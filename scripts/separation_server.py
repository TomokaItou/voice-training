"""Local Demucs vocal/accompaniment separation server for voice-training-main.

Install:
  python -m pip install -r requirements-separation.txt

Then run:
  python scripts/separation_server.py
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import traceback
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


DEFAULT_MODEL = "htdemucs"
DEFAULT_TIMEOUT_SECONDS = 900


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def parse_multipart(handler: BaseHTTPRequestHandler) -> tuple[dict[str, str], dict[str, Any]]:
    content_type = handler.headers.get("Content-Type", "")
    content_length = int(handler.headers.get("Content-Length", "0") or "0")
    body = handler.rfile.read(content_length)
    message = BytesParser(policy=policy.default).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
    )
    fields: dict[str, str] = {}
    files: dict[str, Any] = {}

    if not message.is_multipart():
        raise ValueError("Expected multipart/form-data")

    for part in message.iter_parts():
        disposition = part.get("Content-Disposition", "")
        name = part.get_param("name", header="content-disposition")
        if not name or "form-data" not in disposition:
            continue
        filename = part.get_filename()
        payload = part.get_payload(decode=True) or b""
        if filename:
            files[name] = {"filename": filename, "content": payload}
        else:
            fields[name] = payload.decode("utf-8", errors="replace")
    return fields, files


def safe_suffix(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix and len(suffix) <= 12 and all(char.isalnum() or char == "." for char in suffix):
        return suffix
    return ".audio"


def read_audio_payload(path: Path, filename: str) -> dict[str, str]:
    return {
        "filename": filename,
        "mime": "audio/wav",
        "content_base64": base64.b64encode(path.read_bytes()).decode("ascii"),
    }


def find_demucs_outputs(output_root: Path, model_name: str) -> tuple[Path, Path]:
    model_root = output_root / model_name
    search_root = model_root if model_root.exists() else output_root
    vocal_candidates = sorted(search_root.rglob("vocals.wav"), key=lambda item: item.stat().st_mtime, reverse=True)
    backing_candidates = sorted(search_root.rglob("no_vocals.wav"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not vocal_candidates or not backing_candidates:
        raise RuntimeError("Demucs did not produce vocals.wav and no_vocals.wav")
    return vocal_candidates[0], backing_candidates[0]


def run_demucs(input_path: Path, output_root: Path, model_name: str, device: str | None) -> tuple[Path, Path, list[str]]:
    command = [
        os.environ.get("PYTHON", sys.executable),
        "-m",
        "demucs",
        "--two-stems",
        "vocals",
        "-n",
        model_name,
        "-o",
        str(output_root),
    ]
    if device:
        command.extend(["-d", device])
    command.append(str(input_path))

    timeout_seconds = int(os.environ.get("SEPARATION_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS)))
    completed = subprocess.run(
        command,
        check=False,
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
    )
    logs = [line for line in (completed.stdout + "\n" + completed.stderr).splitlines() if line.strip()]
    if completed.returncode != 0:
        tail = "\n".join(logs[-12:])
        raise RuntimeError(f"Demucs failed with exit code {completed.returncode}.\n{tail}")

    vocals_path, accompaniment_path = find_demucs_outputs(output_root, model_name)
    return vocals_path, accompaniment_path, logs[-20:]


def separate_audio(uploaded: dict[str, Any], fields: dict[str, str]) -> dict[str, Any]:
    source_name = uploaded["filename"] or "song.audio"
    model_name = fields.get("model") or os.environ.get("SEPARATION_MODEL", DEFAULT_MODEL)
    device = fields.get("device") or os.environ.get("SEPARATION_DEVICE", "")
    device = device.strip() or None

    with tempfile.TemporaryDirectory(prefix="voice-training-separation-") as temp_dir:
        work_dir = Path(temp_dir)
        input_path = work_dir / f"song{safe_suffix(source_name)}"
        output_root = work_dir / "separated"
        input_path.write_bytes(uploaded["content"])

        started_at = time.perf_counter()
        vocals_path, accompaniment_path, logs = run_demucs(input_path, output_root, model_name, device)
        duration_seconds = round(time.perf_counter() - started_at, 2)

        base_name = Path(source_name).stem or "song"
        return {
            "engine": "demucs",
            "model": model_name,
            "device": device or "auto",
            "duration_seconds": duration_seconds,
            "logs": logs,
            "vocals": read_audio_payload(vocals_path, f"{base_name}-vocals.wav"),
            "accompaniment": read_audio_payload(accompaniment_path, f"{base_name}-no_vocals.wav"),
        }


class SeparationHandler(BaseHTTPRequestHandler):
    server_version = "VoiceSeparationServer/1.0"

    def do_OPTIONS(self) -> None:
        json_response(self, 204, {})

    def do_GET(self) -> None:
        if self.path == "/health":
            json_response(self, 200, {"ok": True, "engine": "demucs"})
            return
        json_response(self, 404, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/api/separate":
            json_response(self, 404, {"error": "Not found"})
            return

        try:
            fields, files = parse_multipart(self)
            uploaded = files.get("file")
            if not uploaded or not uploaded["content"]:
                json_response(self, 400, {"error": "Missing audio file"})
                return

            result = separate_audio(uploaded, fields)
            json_response(self, 200, result)
        except ModuleNotFoundError as exc:
            json_response(self, 500, {"error": f"Missing Python module: {exc.name}"})
        except subprocess.TimeoutExpired:
            json_response(self, 504, {"error": "Demucs separation timed out"})
        except Exception as exc:
            traceback.print_exc()
            json_response(self, 500, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[separation] {self.address_string()} - {format % args}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Demucs vocal/accompaniment separation server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8766, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), SeparationHandler)
    print(f"Local Demucs separation server listening on http://{args.host}:{args.port}")
    print(f"Default model: {DEFAULT_MODEL}. Override with SEPARATION_MODEL=htdemucs_ft, mdx_extra, etc.")
    print("Default device: Demucs auto. Override with SEPARATION_DEVICE=cuda or SEPARATION_DEVICE=cpu.")
    server.serve_forever()


if __name__ == "__main__":
    main()
