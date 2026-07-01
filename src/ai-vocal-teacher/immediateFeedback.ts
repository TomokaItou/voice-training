export type ImmediateFeedback = {
  quickComment: string;
  nextCue: string;
  isUsable: boolean;
  severity: 'good' | 'minor' | 'needs_retry';
};

export type TaskSummary = {
  taskId: string;
  mainObservation: string;
  bestAttemptIndex: number;
  nextTaskCue: string;
};

type AttemptLike = {
  taskId?: string;
  attemptId?: number;
  durationMs?: number;
  features?: Record<string, number>;
};

type ProbeTaskLike = {
  id: string;
  name?: string;
};

const durationSeconds = (attempt: AttemptLike) => Math.max(0, (attempt.durationMs || 0) / 1000);

export function generateImmediateFeedback(
  currentAttempt: AttemptLike,
  previousAttempts: AttemptLike[] = [],
  currentTask?: ProbeTaskLike,
): ImmediateFeedback {
  const features = currentAttempt.features || {};
  const duration = durationSeconds(currentAttempt);
  const loudness = features.loudness_mean;
  const pitchStd = features.pitch_std;
  const previousPitchStd = previousAttempts[previousAttempts.length - 1]?.features?.pitch_std;

  if (duration > 0 && duration < 1.8) {
    return {
      quickComment: '这次太短了。',
      nextCue: '下一次保持 2 到 4 秒，让我听到完整的声音。',
      isUsable: false,
      severity: 'needs_retry',
    };
  }

  if (Number.isFinite(loudness) && loudness < -42) {
    return {
      quickComment: '这次声音有点小。',
      nextCue: '下一次离麦克风近一点，或者稍微唱清楚一点。',
      isUsable: loudness > -52,
      severity: loudness > -52 ? 'minor' : 'needs_retry',
    };
  }

  if (Number.isFinite(loudness) && loudness > -10) {
    return {
      quickComment: '这次有点冲。',
      nextCue: '下一次轻一点开始，不要一下子把声音推出来。',
      isUsable: loudness < -6,
      severity: loudness < -6 ? 'minor' : 'needs_retry',
    };
  }

  if (Number.isFinite(pitchStd) && Number.isFinite(previousPitchStd)) {
    const meaningfulChange = Math.max(2, previousPitchStd * 0.12);
    if (previousPitchStd - pitchStd > meaningfulChange) {
      return {
        quickComment: '这次比上一条更稳定。',
        nextCue: '记住刚才那个感觉，我们再做一次。',
        isUsable: true,
        severity: 'good',
      };
    }
    if (pitchStd - previousPitchStd > meaningfulChange) {
      return {
        quickComment: '这次有点飘。',
        nextCue: '下一次只想一个稳定的音，不要急着调整。',
        isUsable: true,
        severity: 'minor',
      };
    }
  }

  return {
    quickComment: currentTask?.id === 'soft_to_normal' ? '这次可以用，我听到了音量变化。' : '这次可以用。',
    nextCue: '我们再录下一次，尽量让它和刚才一样。',
    isUsable: true,
    severity: 'good',
  };
}

export function generateTaskSummary(taskId: string, attempts: AttemptLike[], nextTask?: ProbeTaskLike | null): TaskSummary {
  const scored = attempts
    .map((attempt, index) => {
      const pitchStd = Number.isFinite(attempt.features?.pitch_std) ? attempt.features!.pitch_std : 30;
      const loudnessStd = Number.isFinite(attempt.features?.loudness_std) ? attempt.features!.loudness_std : 8;
      const duration = durationSeconds(attempt);
      const durationPenalty = duration >= 2 && duration <= 4 ? 0 : Math.abs(duration - 3) * 12;
      return { attempt, index, score: pitchStd * 2 + loudnessStd * 0.6 + durationPenalty };
    })
    .sort((left, right) => left.score - right.score);
  const best = scored[0]?.attempt;
  const bestAttemptIndex = best?.attemptId || (scored[0]?.index ?? 0) + 1;

  return {
    taskId,
    mainObservation: `这个任务里，第 ${bestAttemptIndex} 次最稳定。`,
    bestAttemptIndex,
    nextTaskCue: nextTask ? `接下来进入下一个任务：${nextTask.name || nextTask.id}。` : '这个阶段已经录完了，接下来可以查看完整诊断。',
  };
}
