// Lightweight local learning memory for voice training outcomes.
(function () {
  const STORAGE_KEY = 'mira.voiceLearningMemory.v1';
  const MAX_RECORDS = 160;

  function readRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeRecords(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
    } catch (error) {
      // Memory should never block practice.
    }
  }

  function normalizeRecord(record = {}) {
    return {
      id: record.id || `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: record.createdAt || new Date().toISOString(),
      context: record.context || 'unknown',
      problemId: record.problemId || 'general_difference',
      actionId: record.actionId || record.problemId || 'unknown',
      actionLabel: record.actionLabel || '',
      beforeMetric: Number.isFinite(record.beforeMetric) ? record.beforeMetric : null,
      afterMetric: Number.isFinite(record.afterMetric) ? record.afterMetric : null,
      beforeScore: Number.isFinite(record.beforeScore) ? record.beforeScore : null,
      afterScore: Number.isFinite(record.afterScore) ? record.afterScore : null,
      delta: Number.isFinite(record.delta) ? record.delta : 0,
      neuralSimilarity: Number.isFinite(record.neuralSimilarity) ? record.neuralSimilarity : null,
      neuralDelta: Number.isFinite(record.neuralDelta) ? record.neuralDelta : null,
      improved: Boolean(record.improved),
      status: record.status || (record.improved ? 'improved' : 'no_clear_change'),
      observedOnly: Boolean(record.observedOnly || record.status === 'observed'),
      songTitle: record.songTitle || '',
      segmentText: record.segmentText || '',
      recordingId: record.recordingId || null,
      sessionId: record.sessionId || null,
      summary: record.summary || '',
    };
  }

  function recordTrainingResult(record) {
    const records = [normalizeRecord(record), ...readRecords()].slice(0, MAX_RECORDS);
    writeRecords(records);
    return records[0];
  }

  function getProblemRecords(problemId) {
    return readRecords().filter((record) => record.problemId === problemId);
  }

  function getProblemStats(problemId) {
    const records = getProblemRecords(problemId);
    const outcomeRecords = records.filter((record) => !record.observedOnly && record.status !== 'observed');
    const improved = outcomeRecords.filter((record) => record.improved);
    const totalDelta = outcomeRecords.reduce((sum, record) => sum + (record.delta || 0), 0);
    return {
      problemId,
      count: records.length,
      outcomeCount: outcomeRecords.length,
      improvedCount: improved.length,
      successRate: outcomeRecords.length ? improved.length / outcomeRecords.length : 0,
      averageDelta: outcomeRecords.length ? totalDelta / outcomeRecords.length : 0,
      latest: records[0] || null,
      lastImproved: improved[0] || null,
    };
  }

  function getBestActionForProblem(problemId) {
    const records = getProblemRecords(problemId).filter(
      (record) => !record.observedOnly && record.status !== 'observed'
    );
    const grouped = new Map();
    records.forEach((record) => {
      const key = record.actionId || problemId;
      const group = grouped.get(key) || {
        actionId: key,
        actionLabel: record.actionLabel || key,
        count: 0,
        improvedCount: 0,
        totalDelta: 0,
        latest: record,
      };
      group.count += 1;
      group.improvedCount += record.improved ? 1 : 0;
      group.totalDelta += record.delta || 0;
      if (new Date(record.createdAt) > new Date(group.latest.createdAt)) {
        group.latest = record;
      }
      grouped.set(key, group);
    });

    return [...grouped.values()]
      .map((group) => ({
        ...group,
        successRate: group.count ? group.improvedCount / group.count : 0,
        averageDelta: group.count ? group.totalDelta / group.count : 0,
      }))
      .sort((a, b) => (b.successRate - a.successRate) || (b.averageDelta - a.averageDelta))[0] || null;
  }

  function getRecentWeaknesses(limit = 3) {
    const grouped = new Map();
    readRecords().forEach((record) => {
      const group = grouped.get(record.problemId) || {
        problemId: record.problemId,
        count: 0,
        unresolvedCount: 0,
        latest: record,
      };
      group.count += 1;
      group.unresolvedCount += record.improved ? 0 : 1;
      if (new Date(record.createdAt) > new Date(group.latest.createdAt)) {
        group.latest = record;
      }
      grouped.set(record.problemId, group);
    });
    return [...grouped.values()]
      .sort((a, b) => (b.unresolvedCount - a.unresolvedCount) || (b.count - a.count))
      .slice(0, limit);
  }

  function getMemoryHint(problemId) {
    const stats = getProblemStats(problemId);
    if (!stats.count) return '';
    const bestAction = getBestActionForProblem(problemId);
    const problem = window.VoiceProblemMap?.get?.(problemId);
    const label = problem?.shortLabel || problem?.userLabel || problemId;
    if (bestAction?.improvedCount) {
      return `这是最近第 ${stats.count + 1} 次遇到${label}；之前「${bestAction.actionLabel}」有效率 ${Math.round(bestAction.successRate * 100)}%。`;
    }
    return `这是最近第 ${stats.count + 1} 次遇到${label}；Mira 会继续记录哪种动作更有效。`;
  }

  function getCurrentMemoryHint(problemId) {
    const stats = getProblemStats(problemId);
    if (!stats.count) return '';
    const bestAction = getBestActionForProblem(problemId);
    const problem = window.VoiceProblemMap?.get?.(problemId);
    const label = problem?.shortLabel || problem?.userLabel || problemId;
    if (bestAction?.improvedCount) {
      return `Mira 已记录 ${stats.count} 次${label}；之前「${bestAction.actionLabel}」有效率 ${Math.round(bestAction.successRate * 100)}%。`;
    }
    return `Mira 已记录 ${stats.count} 次${label}；继续修这一句后，会知道哪种动作更适合你。`;
  }

  window.VoiceLearningMemory = {
    STORAGE_KEY,
    readRecords,
    recordTrainingResult,
    getProblemRecords,
    getProblemStats,
    getBestActionForProblem,
    getRecentWeaknesses,
    getMemoryHint,
    getCurrentMemoryHint,
  };
})();
