"""Local Whisper transcription server for voice-training-main.

Install one of:
  python -m pip install faster-whisper
  python -m pip install openai-whisper

Then run:
  python scripts/lyrics_whisper_server.py
"""

from __future__ import annotations

import argparse
import json
import os
import site
import tempfile
import time
import traceback
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


MODEL_CACHE: dict[tuple[str, str], Any] = {}


def add_nvidia_dll_directories() -> None:
    if os.name != "nt":
        return

    roots = [Path(path) / "nvidia" for path in site.getsitepackages()]
    seen: set[Path] = set()
    for root in roots:
        if not root.exists():
            continue
        for bin_dir in root.glob("*\\bin"):
            if bin_dir in seen or not bin_dir.exists():
                continue
            seen.add(bin_dir)
            os.add_dll_directory(str(bin_dir))
            os.environ["PATH"] = f"{bin_dir}{os.pathsep}{os.environ.get('PATH', '')}"


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
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


def normalize_language(value: str | None) -> str | None:
    value = (value or "").strip()
    return None if not value or value == "auto" else value


def transcribe_with_faster_whisper(audio_path: Path, model_name: str, language: str | None, task: str) -> dict[str, Any]:
    add_nvidia_dll_directories()
    from faster_whisper import WhisperModel

    device = os.environ.get("WHISPER_DEVICE", "cpu")
    compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
    cache_key = ("faster-whisper", model_name, device, compute_type)
    if cache_key not in MODEL_CACHE:
        kwargs = {"device": device}
        if compute_type:
            kwargs["compute_type"] = compute_type
        try:
            MODEL_CACHE[cache_key] = WhisperModel(model_name, **kwargs)
        except Exception:
            if device == "cuda" and os.environ.get("WHISPER_CUDA_FALLBACK", "1") != "0":
                fallback_key = ("faster-whisper", model_name, "cpu", "int8")
                if fallback_key not in MODEL_CACHE:
                    MODEL_CACHE[fallback_key] = WhisperModel(model_name, device="cpu", compute_type="int8")
                cache_key = fallback_key
            else:
                raise

    model = MODEL_CACHE[cache_key]
    segments_iter, info = model.transcribe(
        str(audio_path),
        language=language,
        task=task,
        vad_filter=True,
        beam_size=5,
    )
    segments = [
        {"start": float(segment.start), "end": float(segment.end), "text": segment.text.strip()}
        for segment in segments_iter
        if segment.text and segment.text.strip()
    ]
    return {
        "engine": "faster-whisper",
        "model": model_name,
        "device": cache_key[2],
        "compute_type": cache_key[3],
        "language": getattr(info, "language", language),
        "text": "\n".join(segment["text"] for segment in segments),
        "segments": segments,
    }


def transcribe_with_openai_whisper(audio_path: Path, model_name: str, language: str | None, task: str) -> dict[str, Any]:
    import whisper

    cache_key = ("openai-whisper", model_name)
    if cache_key not in MODEL_CACHE:
        MODEL_CACHE[cache_key] = whisper.load_model(model_name)

    model = MODEL_CACHE[cache_key]
    result = model.transcribe(str(audio_path), language=language, task=task, fp16=False)
    segments = [
        {
            "start": float(segment.get("start", 0)),
            "end": float(segment.get("end", 0)),
            "text": str(segment.get("text", "")).strip(),
        }
        for segment in result.get("segments", [])
        if str(segment.get("text", "")).strip()
    ]
    return {
        "engine": "openai-whisper",
        "model": model_name,
        "language": result.get("language", language),
        "text": str(result.get("text", "")).strip(),
        "segments": segments,
    }


def transcribe_audio(audio_path: Path, model_name: str, language: str | None, task: str) -> dict[str, Any]:
    try:
        return transcribe_with_faster_whisper(audio_path, model_name, language, task)
    except ModuleNotFoundError:
        pass
    try:
        return transcribe_with_openai_whisper(audio_path, model_name, language, task)
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "未安装 Whisper。请先运行：python -m pip install faster-whisper，"
            "或 python -m pip install openai-whisper"
        ) from exc


class LyricsWhisperHandler(BaseHTTPRequestHandler):
    server_version = "LyricsWhisperServer/1.0"

    def do_OPTIONS(self) -> None:
        json_response(self, 204, {})

    def do_GET(self) -> None:
        if self.path == "/health":
            json_response(self, 200, {"ok": True})
            return
        json_response(self, 404, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/api/transcribe-lyrics":
            json_response(self, 404, {"error": "Not found"})
            return

        try:
            fields, files = parse_multipart(self)
            uploaded = files.get("file")
            if not uploaded or not uploaded["content"]:
                json_response(self, 400, {"error": "缺少音频文件"})
                return

            model_name = fields.get("model") or os.environ.get("WHISPER_MODEL", "small")
            language = normalize_language(fields.get("language"))
            task = fields.get("task") if fields.get("task") in {"transcribe", "translate"} else "transcribe"
            suffix = Path(uploaded["filename"]).suffix or ".audio"

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(uploaded["content"])
                temp_path = Path(temp_file.name)

            try:
                started_at = time.perf_counter()
                result = transcribe_audio(temp_path, model_name, language, task)
                result["duration_seconds"] = round(time.perf_counter() - started_at, 2)
            finally:
                temp_path.unlink(missing_ok=True)

            json_response(self, 200, result)
        except Exception as exc:
            traceback.print_exc()
            json_response(self, 500, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[lyrics-whisper] {self.address_string()} - {format % args}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Whisper lyrics transcription server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), LyricsWhisperHandler)
    print(f"Local Whisper lyrics server listening on http://{args.host}:{args.port}")
    print("Default model: small. Override with WHISPER_MODEL=large-v3, medium, base, etc.")
    print("Default runtime: CPU int8. Override with WHISPER_DEVICE=cuda only if CUDA 12 DLLs are installed.")
    server.serve_forever()


if __name__ == "__main__":
    main()
