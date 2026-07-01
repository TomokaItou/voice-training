import type { VocalExercise, VocalFocusArea } from './exerciseLibrary';

export type TeachingDecision = {
  focusArea: VocalFocusArea;
  actionType: 'probe_more' | 'practice' | 'reprobe' | 'increase_difficulty' | 'decrease_difficulty' | 'switch_exercise';
  exerciseId?: string;
  reason: string;
  userFacingPlan: {
    title: string;
    goal: string;
    instruction: string;
    repetitions: number;
    durationMinutes: number;
    reProbeAfter: boolean;
  };
  hiddenDetails: {
    confidence: number;
    instabilityScore: number;
    trend?: 'improving' | 'worsening' | 'flat' | 'unknown';
    suppressedFindings: string[];
  };
};

export type TeachingDecisionInput = {
  focusArea: VocalFocusArea;
  confidence: number;
  instabilityScore: number;
  dominantFeatures: string[];
  trend?: 'improving' | 'worsening' | 'flat' | 'unknown';
  beforeAfterResult?: { improved: boolean };
  currentExercise?: VocalExercise;
  selectedExercise: VocalExercise;
  suppressedFindings?: string[];
};

export function decideNextTeachingAction(input: TeachingDecisionInput): TeachingDecision {
  const confidence = input.confidence > 1 ? input.confidence / 100 : input.confidence;
  const hiddenDetails = {
    confidence,
    instabilityScore: input.instabilityScore,
    trend: input.trend || 'unknown',
    suppressedFindings: input.suppressedFindings || [],
  };

  if (confidence < 0.55) {
    return {
      focusArea: 'global',
      actionType: 'probe_more',
      exerciseId: 'global_easy_a',
      reason: '我还不够确定，先再录几次最简单的声音。',
      userFacingPlan: {
        title: '先补几条最简单的声音',
        goal: '让判断更可靠',
        instruction: '只唱一个舒服的 “a——”，持续 3 秒，目标是每次都尽量一样。',
        repetitions: 5,
        durationMinutes: 3,
        reProbeAfter: true,
      },
      hiddenDetails,
    };
  }

  return {
    focusArea: input.focusArea,
    actionType: input.beforeAfterResult?.improved ? 'practice' : 'practice',
    exerciseId: input.selectedExercise.id,
    reason: input.beforeAfterResult?.improved
      ? '这个练习可能有效，今天继续巩固。'
      : '今天先练最值得改善的一件事。',
    userFacingPlan: {
      title: input.selectedExercise.title,
      goal: input.selectedExercise.goal,
      instruction: input.selectedExercise.instruction,
      repetitions: input.selectedExercise.repetitions,
      durationMinutes: input.selectedExercise.durationMinutes,
      reProbeAfter: true,
    },
    hiddenDetails,
  };
}
