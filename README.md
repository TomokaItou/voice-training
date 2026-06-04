# 声乐练习音高曲线

这是一个可直接部署到 GitHub Pages 的静态前端页面，用于实时采集麦克风输入、检测音高并绘制音高曲线。

## 使用方式

1. 软件启动后会先显示模式选择页，包含“音高曲线 / 音量曲线 / 频谱图 / 出气量测量 / 音域训练模式 / 音准评分 / 记忆感知训练”等选项。
2. 初始界面提供“网上搜歌”，输入关键词可在线搜索并显示歌曲列表（支持 iTunes Music、网易云音乐等来源）。
3. 点击“音高曲线”进入原本实时检测界面；点击“频谱图”会进入类似 Overtone Analyzer 的泛音分析视图，包含钢琴键频率轴、滚动声谱、右侧强度剖面和底部能量轨迹。
4. 进入后可点击右上角“返回”按钮回到初始模式选择页。
5. 点击“开始检测”，浏览器会请求麦克风权限，允许后即可看到实时音高曲线、频率与音名。
6. 点击“停止”结束本次采集。
7. 侧边栏“音高算法”可切换不同的音高检测算法（AMDF / 自相关 / 频域 HPS / YIN）。
8. 侧边栏“音高刻度”可选择移动刻度、固定刻度（50–500 Hz）或对数刻度（动态）。
9. 侧边栏“共振峰”开关开启后，会同时显示 F1/F2 数字与对应的曲线。
10. 侧边栏“显示模式”可切换音高曲线、音量曲线与实时频谱图视图。
11. 侧边栏“窗口缩放”可以调节音高窗口占屏幕的大小比例。
12. 侧边栏“音准目标线”可开启/关闭目标线，并设置目标音高（例如 300 Hz）与实时曲线叠加对比。
13. 音高曲线可点击：点击曲线上的任意位置会自动选中最近的有效音高点，并显示对应频率、音名和时间。
14. 在桌面端可将鼠标移到主窗口边缘或四角并拖拽，像 Windows 一样手动调整窗口大小。
15. 在“显示模式”中可选择频谱叠加（音高曲线 / 共振峰曲线），用于在频谱图上同步观察。
16. 侧边栏“显示音量条”和“显示倾斜条”可以分别控制左右两侧刻度条的显示。
17. 录音：点击“开始录音”/“停止录音”后，可在“离线分析”中选择分析最近录音或下载到本地。
18. 录音时间轴：录音时会同步记录时间轴、音量波形和当时音高；停止录音后可点击时间轴任意位置从中间播放，并查看该时刻的波形快照。录音时间轴会与主音高曲线使用同一套时间坐标。
19. 伴奏播放：在侧边栏上传伴奏文件后可播放/暂停/停止并调整音量。建议使用耳机减少伴奏被麦克风拾取。
20. 出气量测量：进入该模式后建议先点击“校准环境”，保持 2 秒安静，软件会记录当前环境噪声底；之后再对准麦克风平稳吹气，可看到扣除环境底噪后的出气评分、气流强度、3kHz 以上高频气声、HNR 近似漏气噪声、声音类型、稳定度和持续时间。出气曲线会显示目标区间、有效线和断气标记；点击“停止”后会自动生成本次出气报告。
21. 音域训练模式：点击“开始检测”后，从舒适低音慢慢滑到高音，再回到中声区；软件会记录最低/最高稳定音、跨度、舒适音区、稳定度和有效采样数。有效采样足够后可点击“保存本次结果”，记录会保存在浏览器本地历史里，并显示最近几次的跨度趋势；也可以点击“重置本次测量”重新开始。
22. 音准评分：从首页进入后，使用侧边栏“音准目标线”设置目标音高，点击“开始检测”即可实时查看当前偏差（cents）、稳定度、命中率和练习提示。
23. 音准模式评估：先上传伴奏（作为参考音高），再完成一段录音，点击“音准模式评估”即可计算平均音高偏差（cents）；偏差较小会显示“音高准确”，偏差较大会显示“跑调”。
24. 记忆感知训练：录制“接近目标 → 保持目标 → 回到中性/安静”的片段后点击“分析最近录音”。该模式现在加入 S84 的专家意图控制场思路，会估算声源稳定 `ΦSN`、包络纹理 `ΦEtex`、气声和闭合代理量，并推荐“减少气声 / 增加健康闭合 / 释放压紧闭合 / 保留气声色彩”等教学控制指令。

> 音高灵敏度优化：实时检测已改为“自适应能量阈值”，并降低了起音门槛（更低起音置信度 + 更短起音帧数），在轻声或起音阶段更容易显示音高曲线。

## 上传音频离线分析

侧边栏提供“上传音频”功能，支持常见音频格式（如 wav/mp3）。流程如下：

1. 点击“上传音频”选择文件，页面会显示“数据源：音频文件”并开始离线分析。
2. 分析过程中会显示进度百分比；完成后可查看音高曲线。
3. 点击“清除文件/返回实时”即可回到实时麦克风模式。

默认最大分析时长为 300 秒（约 5 分钟），超过时会提示是否继续分析全片。若解码失败，请尝试使用 wav/mp3 格式。

## Whisper 歌词识别

上传“歌曲目标曲线”音频后，歌词面板会先尝试读取音频文件里自带的内嵌歌词标签；如果文件没有歌词标签，可以启动本地 Whisper 服务后点击“Whisper识别”。

推荐先安装轻量部署版 Whisper：

```powershell
python -m pip install -r requirements-whisper.txt
```

也可以改用 OpenAI 开源 Whisper：

```powershell
python -m pip install openai-whisper
```

启动本地识别服务：

```powershell
.\scripts\start-lyrics-whisper.cmd
```

使用 NVIDIA GPU / CUDA 启动：

```powershell
.\scripts\start-lyrics-whisper.cmd gpu
```

默认服务地址为 `http://127.0.0.1:8765/api/transcribe-lyrics`，页面默认使用 `small` 模型，速度更快。识别时会显示上传进度、转写计时和当前模型；第一次使用某个模型时需要下载模型文件，所以会明显更慢。如果要识别日语歌词，页面里可把语言选为“日语”；如果机器性能足够，可以用更准的模型：

```powershell
$env:WHISPER_MODEL = "large-v3"
.\scripts\start-lyrics-whisper.cmd
```

完整歌曲直接识别会受伴奏影响。日语歌词建议先做人声分离，再上传分离后的人声音频，识别准确率会明显更好。

## 本地验收

运行下面的命令可执行完整本地质量门槛：检查入口 HTML、CSS/JS 引用、重复 `id`、`document.getElementById` 引用、JavaScript 语法，并运行快速音高算法基准：

```powershell
.\scripts\quality-gate.cmd
```

只检查页面结构和 JavaScript 语法时可以运行：

```powershell
.\scripts\validate-local.cmd
```

`validate-local` 会优先使用 Codex bundled Node，然后再尝试系统 `node`。如果本机没有可运行的 Node，可以临时跳过 Node 语法检查，只做结构检查：

```powershell
.\scripts\validate-local.cmd -SkipNode
```

## 音高算法基准

运行下面的命令可对当前音高检测算法做可重复的合成音频基准测试：

```powershell
.\scripts\pitch-benchmark.cmd
```

默认会运行快速基准，适合每次改完音高逻辑后随手检查：

```powershell
.\scripts\pitch-benchmark.cmd --quick
```

提交或大改算法前建议运行完整基准：

```powershell
.\scripts\pitch-benchmark.cmd --full
```

也可以只跑某个算法或某个场景，便于定位失败原因：

```powershell
.\scripts\pitch-benchmark.cmd --algorithm yin
.\scripts\pitch-benchmark.cmd --fixture vibrato
```

真实人声样本基准放在 `samples/voice-benchmark`。先复制示例标注文件：

```powershell
Copy-Item .\samples\voice-benchmark\manifest.example.json .\samples\voice-benchmark\manifest.json
```

也可以把本地录制的 `wav` 人声样本放入同一目录后自动生成草稿：

```powershell
.\scripts\voice-manifest.cmd --generate
```

再在 `manifest.json` 里补齐每段的目标音高，并先校验：

```powershell
.\scripts\voice-manifest.cmd --validate
```

然后运行：

```powershell
.\scripts\pitch-benchmark.cmd --full --voice
```

只跑某个人声样本：

```powershell
.\scripts\pitch-benchmark.cmd --full --voice --fixture voice-a4
```

如果本机已经有 VocalSet11，可以从 `long_tones` 自动生成本地基准 manifest。生成器会用高置信 YIN 在稳定中段估计参考音高并切分稳定片段；这适合作为真实人声回归测试，不等同于人工逐帧标注：

```powershell
.\scripts\build-vocalset-manifest.cmd --root "C:\path\to\VocalSet11" --singers female1,male1 --techniques straight --vowels a,e --max-samples 8
.\scripts\pitch-benchmark.cmd --full --voice-manifest .\samples\voice-benchmark\manifest.vocalset.local.json --fixture vocalset
```

当前快速基准覆盖纯正弦波、线性滑音、带噪正弦波和静音场景；完整基准额外覆盖轻声起音、泛音丰富音色、颤音和纯噪声。输出包含检出率、静音/噪声误检率、平均音分误差、最大音分误差、平均置信度和八度误判率。基准默认测试 AMDF、自相关和 YIN；HPS/FFT 依赖 WebAudio `AnalyserNode`，后续可单独补浏览器基准。

如果输出 `FAIL`，表示该算法没有达到当前质量阈值。它不一定代表页面无法使用，而是提示这次算法结果需要复查或继续优化。
