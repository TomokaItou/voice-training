# 真实人声基准样本

把本地录制或整理好的 `wav` 人声样本放在这个目录下，并复制 `manifest.example.json` 为 `manifest.json` 后填写标注。

当前 Node 基准脚本支持 PCM / Float WAV。建议使用单人声、短片段、尽量少混响的录音，每个文件控制在 1 到 8 秒内。

标注建议：

- 持续单音：写固定 `expectedHz`。
- 滑音：写 `[startHz, endHz]`，脚本会在片段内线性插值。
- 静音、吸气、明显无声段：写 `expectedHz: null` 或 `voiced: false`。
- 先从 A3、C4、E4、A4 等容易确认的音开始，后面再加入轻声、高音、颤音和真实歌曲片段。

运行：

```powershell
.\scripts\pitch-benchmark.cmd --full --voice
```

只跑人声里的某个样本：

```powershell
.\scripts\pitch-benchmark.cmd --full --voice --fixture female-a4
```

## VocalSet11

如果本机有 VocalSet11，可以自动生成一个本地 manifest：

```powershell
.\scripts\build-vocalset-manifest.cmd --root "C:\path\to\VocalSet11" --singers female1,male1 --techniques straight --vowels a,e --max-samples 8
```

生成结果默认写到 `manifest.vocalset.local.json`，该文件会被 Git 忽略，因为里面包含本机绝对路径。生成器只复制路径和参考标注，不会复制 VocalSet 音频。

然后运行：

```powershell
.\scripts\pitch-benchmark.cmd --full --voice-manifest .\samples\voice-benchmark\manifest.vocalset.local.json --fixture vocalset
```
