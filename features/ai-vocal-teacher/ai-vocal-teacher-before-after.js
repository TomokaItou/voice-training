function compareAiTeacherBeforeAfter(taskId, beforeEstimates, afterEstimates) {
  const before = beforeEstimates.find((estimate) => estimate.taskId === taskId);
  const after = afterEstimates.find((estimate) => estimate.taskId === taskId);
  const beforeInstability = before?.instabilityScore || 0;
  const afterInstability = after?.instabilityScore || 0;
  const delta = afterInstability - beforeInstability;
  return {
    taskId,
    beforeInstability,
    afterInstability,
    delta,
    improved: afterInstability < beforeInstability,
  };
}

window.compareAiTeacherBeforeAfter = compareAiTeacherBeforeAfter;
