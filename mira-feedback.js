const miraFeedbackStorageKey = 'voiceTrainingMiraFeedback.lastResult.v1';
const miraFeedbackEndpoint =
  window.MIRA_LLM_FEEDBACK_ENDPOINT || 'http://127.0.0.1:8787/api/mira-feedback';

let miraFeedbackRequestId = 0;
let miraFeedbackLastMode = 'curve';

function clampMiraScore(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function compactMiraResult(trainingResult = {}) {
  const result = {
    mode: trainingResult.mode || 'practice',
    targetSong: trainingResult.targetSong || trainingResult.songTitle || '',
    totalScore: clampMiraScore(trainingResult.totalScore ?? trainingResult.score),
    pitchScore: clampMiraScore(trainingResult.pitchScore),
    rhythmScore: clampMiraScore(trainingResult.rhythmScore),
    breathScore: clampMiraScore(trainingResult.breathScore),
    resonanceScore: clampMiraScore(trainingResult.resonanceScore),
    summary: trainingResult.summary || '',
    createdAt: trainingResult.createdAt || new Date().toISOString(),
  };

  Object.keys(result).forEach((key) => {
    if (result[key] === null || result[key] === undefined || result[key] === '') {
      delete result[key];
    }
  });
  return result;
}

function loadPreviousMiraResult() {
  try {
    const raw = window.localStorage?.getItem(miraFeedbackStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to load previous Mira feedback result', error);
    return null;
  }
}

function savePreviousMiraResult(trainingResult) {
  try {
    window.localStorage?.setItem(miraFeedbackStorageKey, JSON.stringify(compactMiraResult(trainingResult)));
  } catch (error) {
    console.warn('Failed to save previous Mira feedback result', error);
  }
}

function buildFallbackMiraFeedback(error = null) {
  if (error?.code === 'missing_api_key') {
    return {
      encouragement: 'Mira 的导航核心已经启动，但还没有配置 API Key。',
      observation: '声音坐标已经保存，本地复盘仍然可用。',
      nextStep: '把 OPENAI_API_KEY 填进 .env 后重启导航核心，就能生成个性化反馈。',
      source: 'fallback',
    };
  }
  return {
    encouragement: 'Mira 暂时无法连接导航核心。',
    observation: '不过声音坐标已经保存。',
    nextStep: '今天先完成一次回听，找出最想修正的一句。',
    source: 'fallback',
  };
}

function normalizeMiraFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') {
    return buildFallbackMiraFeedback();
  }
  return {
    encouragement: String(feedback.encouragement || '这一次训练已经留下了新的声音坐标。').trim(),
    observation: String(feedback.observation || 'Mira 会先帮你看最值得修正的一处。').trim(),
    nextStep: String(feedback.nextStep || '下一遍只修一个方向，离目标声音更近一点。').trim(),
    source: feedback.source || 'llm',
  };
}

function getRecentImprovement(trainingResult, previousResult) {
  const current = clampMiraScore(trainingResult?.totalScore ?? trainingResult?.score);
  const previous = clampMiraScore(previousResult?.totalScore ?? previousResult?.score);
  if (current === null || previous === null) return null;
  return current > previous;
}

async function generateMiraLLMFeedback(trainingResult = {}, previousResult = null, targetSong = '') {
  const compactResult = compactMiraResult({
    ...trainingResult,
    targetSong: targetSong || trainingResult.targetSong || trainingResult.songTitle || '',
  });
  const payload = {
    trainingResult: compactResult,
    previousResult: previousResult ? compactMiraResult(previousResult) : null,
    targetSong: compactResult.targetSong || targetSong || '',
    isFirstTraining: !previousResult,
    recentImprovement: getRecentImprovement(compactResult, previousResult),
  };

  try {
    const response = await fetch(miraFeedbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const error = new Error(detail.message || `Mira feedback API returned ${response.status}`);
      error.code = detail.error || `http_${response.status}`;
      throw error;
    }
    const data = await response.json();
    return normalizeMiraFeedback(data.feedback || data);
  } catch (error) {
    console.warn('Mira feedback fallback used', error);
    return buildFallbackMiraFeedback(error);
  }
}

function renderMiraFeedback(feedback, statusText) {
  if (!miraFeedbackPanel) return;
  const normalized = normalizeMiraFeedback(feedback);
  miraFeedbackPanel.hidden = false;
  miraFeedbackPanel.dataset.source = normalized.source || 'llm';
  if (miraFeedbackStatus) {
    miraFeedbackStatus.textContent = statusText || (normalized.source === 'fallback'
      ? '本地导航建议'
      : 'Mira 已生成本次导航方向');
  }
  if (miraFeedbackEncouragement) {
    miraFeedbackEncouragement.textContent = normalized.encouragement;
  }
  if (miraFeedbackObservation) {
    miraFeedbackObservation.textContent = normalized.observation;
  }
  if (miraFeedbackNextStep) {
    miraFeedbackNextStep.textContent = normalized.nextStep;
  }
}

function showMiraFeedbackLoading(trainingResult = {}) {
  if (!miraFeedbackPanel) return;
  miraFeedbackPanel.hidden = false;
  miraFeedbackPanel.dataset.source = 'loading';
  if (miraFeedbackStatus) {
    miraFeedbackStatus.textContent = 'Mira 正在读取本次声音坐标...';
  }
  if (miraFeedbackEncouragement) {
    miraFeedbackEncouragement.textContent = '这一遍已经完成，先把呼吸放下来。';
  }
  if (miraFeedbackObservation) {
    miraFeedbackObservation.textContent = trainingResult.summary || 'Mira 正在寻找最值得修正的一处。';
  }
  if (miraFeedbackNextStep) {
    miraFeedbackNextStep.textContent = '稍等一下，导航方向马上生成。';
  }
}

async function requestMiraFeedbackForReward(trainingResult = {}) {
  const requestId = ++miraFeedbackRequestId;
  const previousResult = loadPreviousMiraResult();
  const compactResult = compactMiraResult(trainingResult);

  miraFeedbackLastMode = compactResult.mode || 'curve';
  showMiraFeedbackLoading(compactResult);
  const feedback = await generateMiraLLMFeedback(compactResult, previousResult, compactResult.targetSong);
  if (requestId !== miraFeedbackRequestId) return feedback;

  renderMiraFeedback(feedback);
  savePreviousMiraResult(compactResult);
  return feedback;
}

function hideMiraFeedback() {
  if (miraFeedbackPanel) {
    miraFeedbackPanel.hidden = true;
  }
}

miraFeedbackRepeatButton?.addEventListener('click', () => {
  const mode = miraFeedbackLastMode === 'song' ? 'curve' : miraFeedbackLastMode || 'curve';
  if (typeof showTrainingView === 'function') {
    showTrainingView(mode);
  }
});

window.generateMiraLLMFeedback = generateMiraLLMFeedback;
window.requestMiraFeedbackForReward = requestMiraFeedbackForReward;
window.renderMiraFeedback = renderMiraFeedback;
window.hideMiraFeedback = hideMiraFeedback;
