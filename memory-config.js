const memoryTargets = {
  brightStable: { pitch: 0.55, loudness: 0.58, brightness: 0.72, breathiness: 0.18, stability: 0.82, phiSn: 0.84, phiEtex: 0.5, closure: 0.58 },
  clearSoft: { pitch: 0.48, loudness: 0.42, brightness: 0.5, breathiness: 0.16, stability: 0.86, phiSn: 0.88, phiEtex: 0.43, closure: 0.54 },
  darkWarm: { pitch: 0.45, loudness: 0.52, brightness: 0.32, breathiness: 0.2, stability: 0.78, phiSn: 0.76, phiEtex: 0.36, closure: 0.48 },
  lightBreathy: { pitch: 0.5, loudness: 0.34, brightness: 0.46, breathiness: 0.55, stability: 0.62, phiSn: 0.52, phiEtex: 0.6, closure: 0.3 },
};
const memoryPathClasses = {
  neutralBright: { label: 'neutral → bright', soundBias: 0.96, hiddenBias: 0.96, advice: '保留这条路径，观察保持段是否能不增加压力地维持明亮度。' },
  breathyClear: { label: 'breathy → clear', soundBias: 1.02, hiddenBias: 1.02, advice: '从气声进入清晰闭合，适合寻找闭合平衡；如果负荷升高，放慢收束速度。' },
  darkBright: { label: 'dark → bright', soundBias: 1, hiddenBias: 1.06, advice: '暗到亮路径容易出现舌位或下颌补偿，优先降低响度并缩短保持段。' },
  pressedRelease: { label: 'pressed → release', soundBias: 0.98, hiddenBias: 1.24, advice: '避免从压紧感进入目标，改用释放或半闭合重置会更稳。' },
  softLoud: { label: 'soft → loud', soundBias: 0.94, hiddenBias: 1.18, advice: '弱到强可以接近目标，但要控制响度爬升；恢复拖尾明显时先降动态。' },
  sovtReset: { label: 'SOVT reset', soundBias: 1.08, hiddenBias: 0.72, advice: '半闭合重置可能牺牲一点目标相似度，但通常更能降低隐藏负荷。' },
  siren: { label: 'siren approach', soundBias: 1.04, hiddenBias: 0.84, advice: '滑音路径能约束音高变化，适合把目标接回更平滑的动作轨迹。' },
};
const memoryControlInstructions = {
  reduceBreathiness: {
    label: '减少气声 / 提高声源稳定',
    vector: { phiSn: 0.26, phiEtex: -0.03, breathiness: -0.28, closure: 0.08, loudness: 0.02 },
    advice: '优先做更清晰的起音和更连续的声源，注意不要靠提高响度硬顶。S84 中气声最稳定的控制方向是 ΦSN 下降/上升这一维，所以这里把声源稳定作为主反馈。',
  },
  healthyClosure: {
    label: '增加健康闭合',
    vector: { phiSn: 0.12, phiEtex: 0.16, breathiness: -0.08, closure: 0.22, loudness: 0.08 },
    advice: '尝试更连贯的闭合，但把它当作协调动作，不要当成“越紧越好”。论文提示闭合不是气声的反方向，过度闭合可能带来压紧或恢复拖尾。',
  },
  releasePressed: {
    label: '释放压紧闭合',
    vector: { phiSn: 0.08, phiEtex: -0.12, breathiness: 0.04, closure: -0.22, loudness: -0.22 },
    advice: '如果当前接近目标但响度、闭合或恢复成本偏高，先释放压力、降低响度，再重新接近目标。',
  },
  keepBreathy: {
    label: '保留气声色彩',
    vector: { phiSn: -0.18, phiEtex: 0.11, breathiness: 0.2, closure: -0.08, loudness: -0.04 },
    advice: '目标本身偏气声时，低 ΦSN 不一定是错误。重点是让气声保持可控、稳定，并避免音高和响度一起漂移。',
  },
};
