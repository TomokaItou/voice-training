const VOCAL_MOVE_SAMPLE_STORAGE_KEY = 'mira-vocal-move-success-samples-v1';
const VOCAL_MOVE_DAILY_INDEX_KEY = 'mira-vocal-move-daily-index-v1';
const VOCAL_MOVE_PRACTICE_SECONDS = 180;

let vocalMoveSamples = [];
let selectedVocalMoveId = null;
let pendingVocalMoveSampleId = null;
let vocalMovePracticeRemainingSeconds = VOCAL_MOVE_PRACTICE_SECONDS;
let vocalMovePracticeTimerId = null;

function getVocalMoves() {
  return Array.isArray(window.VOCAL_MOVES) ? window.VOCAL_MOVES : [];
}

function getVocalMoveById(moveId) {
  return getVocalMoves().find((move) => move.id === moveId) || getVocalMoves()[0] || null;
}

function getVocalMoveCategoryLabel(category) {
  return window.VOCAL_MOVE_CATEGORY_LABELS?.[category] || category || '动作';
}

function getTodayMoveIndex() {
  const moves = getVocalMoves();
  if (!moves.length) {
    return 0;
  }
  const todayKey = new Date().toISOString().slice(0, 10);
  try {
    const saved = JSON.parse(localStorage.getItem(VOCAL_MOVE_DAILY_INDEX_KEY) || '{}');
    if (saved.date === todayKey && Number.isInteger(saved.index)) {
      return ((saved.index % moves.length) + moves.length) % moves.length;
    }
    const nextIndex = Number.isInteger(saved.index) ? (saved.index + 1) % moves.length : 4;
    localStorage.setItem(VOCAL_MOVE_DAILY_INDEX_KEY, JSON.stringify({ date: todayKey, index: nextIndex }));
    return nextIndex;
  } catch {
    return 4;
  }
}

function setTodayMoveIndex(index) {
  const moves = getVocalMoves();
  if (!moves.length) {
    return;
  }
  const normalizedIndex = ((index % moves.length) + moves.length) % moves.length;
  localStorage.setItem(
    VOCAL_MOVE_DAILY_INDEX_KEY,
    JSON.stringify({ date: new Date().toISOString().slice(0, 10), index: normalizedIndex })
  );
  renderTodayVocalMove();
}

function getTodayMove() {
  const moves = getVocalMoves();
  return moves[getTodayMoveIndex()] || moves[0] || null;
}

function loadVocalMoveSamples() {
  try {
    const raw = JSON.parse(localStorage.getItem(VOCAL_MOVE_SAMPLE_STORAGE_KEY) || '[]');
    vocalMoveSamples = Array.isArray(raw)
      ? raw
          .map((sample) => ({
            ...sample,
            rating: Number(sample.rating) || 3,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
  } catch {
    vocalMoveSamples = [];
  }
}

function saveVocalMoveSamples() {
  localStorage.setItem(VOCAL_MOVE_SAMPLE_STORAGE_KEY, JSON.stringify(vocalMoveSamples.slice(0, 120)));
}

function formatMoveSampleTime(value) {
  const date = new Date(value || Date.now());
  return date.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatMoveExampleTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function createVocalMoveCard(move) {
  const card = document.createElement('article');
  card.className = 'vocal-move-card';
  card.dataset.category = move.category;
  card.innerHTML = `
    <div class="vocal-move-card-top">
      <span class="vocal-move-code">${move.id}</span>
      <span class="vocal-move-category">${getVocalMoveCategoryLabel(move.category)}</span>
    </div>
    <h2>${move.shortName || move.name}</h2>
    <p>${move.description}</p>
    <div class="vocal-move-card-actions">
      <button type="button" data-vocal-move-start="${move.id}">开始练习</button>
      <button class="secondary" type="button" data-vocal-move-detail="${move.id}">查看详情</button>
    </div>
  `;
  return card;
}

function renderVocalMoveGrid() {
  const grid = document.getElementById('vocalMoveGrid');
  if (!grid) {
    return;
  }
  grid.innerHTML = '';
  getVocalMoves().forEach((move) => {
    grid.append(createVocalMoveCard(move));
  });
}

function renderTodayVocalMove() {
  const move = getTodayMove();
  const panel = document.getElementById('todayVocalMoveCard');
  if (!move || !panel) {
    return;
  }
  document.getElementById('todayVocalMoveName').textContent = move.name;
  document.getElementById('todayVocalMoveGoal').textContent = `目标：${move.practiceGoal}`;
  document.getElementById('todayVocalMoveDescription').textContent = move.description;
  panel.dataset.moveId = move.id;
}

function getSamplesForMove(moveId) {
  return vocalMoveSamples.filter((sample) => sample.moveId === moveId);
}

function renderVocalMoveSamples(moveId = selectedVocalMoveId) {
  const list = document.getElementById('vocalMoveSampleList');
  const status = document.getElementById('vocalMoveSampleStatus');
  if (!list) {
    return;
  }
  const samples = getSamplesForMove(moveId);
  list.innerHTML = '';
  if (status) {
    status.textContent = samples.length
      ? `${samples.length} 个魔法样本 · 最近 ${formatMoveSampleTime(samples[0].createdAt)}`
      : '还没有采集样本';
  }
  if (!samples.length) {
    const empty = document.createElement('div');
    empty.className = 'recording-library-empty';
    empty.textContent = '保存一次“做对了”的瞬间，Mira 会把它放在这里。';
    list.append(empty);
    return;
  }
  samples.forEach((sample) => {
    const item = document.createElement('article');
    item.className = 'vocal-move-sample-item';
    item.innerHTML = `
      <div>
        <strong>${sample.win || '抓到一次好感觉'}</strong>
        <span>${formatMoveSampleTime(sample.createdAt)} · 自评分 ${sample.rating || 3}/5</span>
      </div>
      <p>${sample.note || '没有备注，但这次已经被 Mira 记住了。'}</p>
    `;
    list.append(item);
  });
}

function renderVocalMoveDetail(moveId) {
  const move = getVocalMoveById(moveId);
  if (!move) {
    return;
  }
  selectedVocalMoveId = move.id;
  document.getElementById('vocalMoveOverviewPanel').hidden = true;
  document.getElementById('vocalMovePracticePanel').hidden = true;
  document.getElementById('vocalMoveDetailPanel').hidden = false;
  document.getElementById('vocalMoveDetailCode').textContent = move.id;
  document.getElementById('vocalMoveDetailCategory').textContent = getVocalMoveCategoryLabel(move.category);
  document.getElementById('vocalMoveDetailName').textContent = move.name;
  document.getElementById('vocalMoveDetailDescription').textContent = move.description;
  document.getElementById('vocalMoveDetailWhy').textContent = move.whyItMatters;
  document.getElementById('vocalMoveDetailGoal').textContent = move.practiceGoal;

  const tips = document.getElementById('vocalMoveDetailTips');
  tips.innerHTML = '';
  move.practiceTips.forEach((tip) => {
    const item = document.createElement('li');
    item.textContent = tip;
    tips.append(item);
  });

  const examples = document.getElementById('vocalMoveDetailExamples');
  examples.innerHTML = '';
  (move.examples || []).forEach((example) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${example.songTitle}</strong>
      <span>${formatMoveExampleTime(example.startTime)}-${formatMoveExampleTime(example.endTime)}${example.note ? ` · ${example.note}` : ''}</span>
    `;
    examples.append(item);
  });
  if (!move.examples?.length) {
    const item = document.createElement('li');
    item.textContent = '先用任意一句舒服的歌词做样本。';
    examples.append(item);
  }
  renderVocalMoveSamples(move.id);
}

function resetVocalMoveTimer() {
  clearInterval(vocalMovePracticeTimerId);
  vocalMovePracticeTimerId = null;
  vocalMovePracticeRemainingSeconds = VOCAL_MOVE_PRACTICE_SECONDS;
  updateVocalMoveTimerDisplay();
}

function updateVocalMoveTimerDisplay() {
  const timer = document.getElementById('vocalMoveTimer');
  const toggle = document.getElementById('vocalMoveTimerToggleButton');
  if (timer) {
    const minutes = Math.floor(vocalMovePracticeRemainingSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(vocalMovePracticeRemainingSeconds % 60).toString().padStart(2, '0');
    timer.textContent = `${minutes}:${seconds}`;
  }
  if (toggle) {
    toggle.textContent = vocalMovePracticeTimerId ? '暂停计时' : '开始计时';
  }
}

function startVocalMovePractice(moveId = selectedVocalMoveId || getTodayMove()?.id) {
  const move = getVocalMoveById(moveId);
  if (!move) {
    return;
  }
  selectedVocalMoveId = move.id;
  document.getElementById('vocalMoveOverviewPanel').hidden = true;
  document.getElementById('vocalMoveDetailPanel').hidden = true;
  document.getElementById('vocalMovePracticePanel').hidden = false;
  document.getElementById('vocalMovePracticeTitle').textContent = move.name;
  document.getElementById('vocalMovePracticeGoal').textContent = move.practiceGoal;
  document.getElementById('vocalMovePracticeHint').textContent =
    move.practiceTips[0] || '不用唱完整首，先把这一秒变好听。';
  resetVocalMoveTimer();
}

function toggleVocalMoveTimer() {
  if (vocalMovePracticeTimerId) {
    clearInterval(vocalMovePracticeTimerId);
    vocalMovePracticeTimerId = null;
    updateVocalMoveTimerDisplay();
    return;
  }
  vocalMovePracticeTimerId = setInterval(() => {
    vocalMovePracticeRemainingSeconds = Math.max(0, vocalMovePracticeRemainingSeconds - 1);
    updateVocalMoveTimerDisplay();
    if (vocalMovePracticeRemainingSeconds <= 0) {
      clearInterval(vocalMovePracticeTimerId);
      vocalMovePracticeTimerId = null;
      document.getElementById('vocalMovePracticeHint').textContent = '3 分钟到。找到一次成功就算赢。';
      updateVocalMoveTimerDisplay();
    }
  }, 1000);
  updateVocalMoveTimerDisplay();
}

function showVocalMoveLibrary(moveId = null) {
  const page = document.getElementById('vocalMoveLibraryPage');
  if (!page) {
    return;
  }
  modeLauncher.hidden = true;
  if (libraryPage) {
    libraryPage.hidden = true;
  }
  if (appWindow) {
    appWindow.hidden = true;
  }
  page.hidden = false;
  if (moveId) {
    renderVocalMoveDetail(moveId);
  } else {
    document.getElementById('vocalMoveOverviewPanel').hidden = false;
    document.getElementById('vocalMoveDetailPanel').hidden = true;
    document.getElementById('vocalMovePracticePanel').hidden = true;
  }
}

function hideVocalMoveLibrary() {
  const page = document.getElementById('vocalMoveLibraryPage');
  if (page) {
    page.hidden = true;
  }
  resetVocalMoveTimer();
}

function showVocalMoveSampleModal(moveId = selectedVocalMoveId || getTodayMove()?.id) {
  selectedVocalMoveId = getVocalMoveById(moveId)?.id || selectedVocalMoveId;
  pendingVocalMoveSampleId = selectedVocalMoveId;
  document.getElementById('vocalMoveSampleWinInput').value = '';
  document.getElementById('vocalMoveSampleNoteInput').value = '';
  document.getElementById('vocalMoveSampleRatingSelect').value = '3';
  document.getElementById('vocalMoveSampleModal').hidden = false;
  document.getElementById('vocalMoveSampleWinInput').focus();
}

function hideVocalMoveSampleModal() {
  document.getElementById('vocalMoveSampleModal').hidden = true;
}

function saveVocalMoveSample() {
  const move = getVocalMoveById(pendingVocalMoveSampleId);
  if (!move) {
    return;
  }
  const latestRecording = Array.isArray(recordingLibrary)
    ? recordingLibrary.find((item) => item?.type === 'recording')
    : null;
  const sample = {
    id: `move-sample-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    moveId: move.id,
    createdAt: new Date().toISOString(),
    recordingId: latestRecording?.id || null,
    audioUrl: latestRecording?.audioUrl || undefined,
    win: document.getElementById('vocalMoveSampleWinInput').value.trim(),
    note: document.getElementById('vocalMoveSampleNoteInput').value.trim(),
    rating: Number(document.getElementById('vocalMoveSampleRatingSelect').value) || 3,
  };
  vocalMoveSamples = [sample, ...vocalMoveSamples.filter((item) => item.id !== sample.id)].slice(0, 120);
  saveVocalMoveSamples();
  hideVocalMoveSampleModal();
  renderVocalMoveSamples(move.id);
  renderVocalMoveDetail(move.id);
}

function bindVocalMoveEvents() {
  document.getElementById('openVocalMoveLibraryButton')?.addEventListener('click', () => showVocalMoveLibrary());
  document.getElementById('todayVocalMoveStartButton')?.addEventListener('click', () => {
    showVocalMoveLibrary(getTodayMove()?.id);
    startVocalMovePractice(getTodayMove()?.id);
  });
  document.getElementById('todayVocalMoveShuffleButton')?.addEventListener('click', () => {
    setTodayMoveIndex(getTodayMoveIndex() + 1);
  });
  document.getElementById('todayVocalMoveLibraryButton')?.addEventListener('click', () => showVocalMoveLibrary());
  document.getElementById('vocalMoveBackHomeButton')?.addEventListener('click', () => {
    hideVocalMoveLibrary();
    if (typeof showLauncherView === 'function') {
      showLauncherView();
    }
  });
  document.getElementById('vocalMoveBackToListButton')?.addEventListener('click', () => showVocalMoveLibrary());
  document.getElementById('vocalMoveStartPracticeButton')?.addEventListener('click', () => startVocalMovePractice());
  document.getElementById('vocalMoveCollectButton')?.addEventListener('click', () => showVocalMoveSampleModal());
  document.getElementById('vocalMoveTimerToggleButton')?.addEventListener('click', toggleVocalMoveTimer);
  document.getElementById('vocalMovePracticeCollectButton')?.addEventListener('click', () => showVocalMoveSampleModal());
  document.getElementById('vocalMovePracticeDoneButton')?.addEventListener('click', () => renderVocalMoveDetail(selectedVocalMoveId));
  document.getElementById('vocalMoveSampleSaveButton')?.addEventListener('click', saveVocalMoveSample);
  document.getElementById('vocalMoveSampleCancelButton')?.addEventListener('click', hideVocalMoveSampleModal);
  document.getElementById('vocalMoveSampleModal')?.addEventListener('click', (event) => {
    if (event.target?.id === 'vocalMoveSampleModal') {
      hideVocalMoveSampleModal();
    }
  });
  document.getElementById('vocalMoveGrid')?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const detailButton = target?.closest('[data-vocal-move-detail]');
    const startButton = target?.closest('[data-vocal-move-start]');
    if (detailButton) {
      renderVocalMoveDetail(detailButton.dataset.vocalMoveDetail);
    }
    if (startButton) {
      renderVocalMoveDetail(startButton.dataset.vocalMoveStart);
      startVocalMovePractice(startButton.dataset.vocalMoveStart);
    }
  });
}

loadVocalMoveSamples();
renderVocalMoveGrid();
renderTodayVocalMove();
bindVocalMoveEvents();

window.showVocalMoveLibrary = showVocalMoveLibrary;
window.hideVocalMoveLibrary = hideVocalMoveLibrary;
