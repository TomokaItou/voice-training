// Accompaniment file loading and playback controls.

function setAccompanimentStatus(text) {
  accompanimentStatus.textContent = text;
}

function updateAccompanimentButtons(hasSource) {
  const canPlay = Boolean(hasSource);
  playAccompanimentButton.disabled = !canPlay;
  pauseAccompanimentButton.disabled = !canPlay;
  stopAccompanimentButton.disabled = !canPlay;
}

function loadAccompanimentFile(file, statusText = '已加载') {
  if (!file) {
    return;
  }
  if (accompanimentUrl) {
    URL.revokeObjectURL(accompanimentUrl);
  }
  accompanimentUrl = URL.createObjectURL(file);
  if (!accompanimentAudio) {
    accompanimentAudio = new Audio();
    accompanimentAudio.addEventListener('ended', () => {
      setAccompanimentStatus('已停止');
    });
  }
  accompanimentAudio.src = accompanimentUrl;
  accompanimentAudio.volume = Number(accompanimentVolume.value || 0.7);
  accompanimentFile = file;
  setAccompanimentStatus(statusText);
  updateAccompanimentButtons(true);
  updatePitchAccuracyButton();
}

accompanimentInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  loadAccompanimentFile(file);
});

playAccompanimentButton.addEventListener('click', async () => {
  if (!accompanimentAudio) {
    return;
  }
  try {
    await accompanimentAudio.play();
    setAccompanimentStatus('播放中');
  } catch (error) {
    console.error(error);
    setAccompanimentStatus('无法播放');
  }
});

pauseAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  setAccompanimentStatus('已暂停');
});

stopAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  accompanimentAudio.currentTime = 0;
  setAccompanimentStatus('已停止');
});

accompanimentVolume.addEventListener('input', (event) => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.volume = Number(event.target.value);
});
