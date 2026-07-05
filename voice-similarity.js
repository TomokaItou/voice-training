// Similarity helpers for VoiceRepresentation objects.
(function () {
  function vectorDistance(a = [], b = []) {
    const length = Math.min(a.length, b.length);
    if (!length) return 1;
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      const delta = (Number(a[index]) || 0) - (Number(b[index]) || 0);
      sum += delta * delta;
    }
    return Math.sqrt(sum / length);
  }

  function vectorSimilarity(a = [], b = []) {
    return Math.max(0, Math.min(1, 1 - vectorDistance(a, b)));
  }

  function compareEmbeddings(reference, candidate) {
    const referenceVector = reference?.embedding?.vector || [];
    const candidateVector = candidate?.embedding?.vector || [];
    const fields = reference?.embedding?.fields || candidate?.embedding?.fields || [];
    const differences = fields.map((field, index) => ({
      field,
      reference: referenceVector[index] || 0,
      candidate: candidateVector[index] || 0,
      delta: (candidateVector[index] || 0) - (referenceVector[index] || 0),
      absDelta: Math.abs((candidateVector[index] || 0) - (referenceVector[index] || 0)),
    }));

    return {
      model: reference?.embedding?.model || candidate?.embedding?.model || 'unknown',
      similarity: Number(vectorSimilarity(referenceVector, candidateVector).toFixed(4)),
      distance: Number(vectorDistance(referenceVector, candidateVector).toFixed(4)),
      differences: differences.sort((a, b) => b.absDelta - a.absDelta),
    };
  }

  function findMostDifferentSegment(reference, candidate) {
    const referenceSegments = reference?.segments || [];
    const candidateSegments = candidate?.segments || [];
    const count = Math.min(referenceSegments.length, candidateSegments.length);
    if (!count) return null;

    let worst = null;
    for (let index = 0; index < count; index += 1) {
      const comparison = compareEmbeddings(referenceSegments[index], candidateSegments[index]);
      const segment = {
        index,
        startMs: candidateSegments[index].startMs,
        endMs: candidateSegments[index].endMs,
        comparison,
        candidateProblem: candidateSegments[index].primaryProblem,
      };
      if (!worst || comparison.distance > worst.comparison.distance) {
        worst = segment;
      }
    }
    return worst;
  }

  function compareVoiceRepresentations(reference, candidate) {
    const overall = compareEmbeddings(reference, candidate);
    const worstSegment = findMostDifferentSegment(reference, candidate);
    const neural = reference?.neuralEmbedding && candidate?.neuralEmbedding && window.NeuralVoiceEmbedding
      ? window.NeuralVoiceEmbedding.compareVoiceEmbeddings(reference.neuralEmbedding, candidate.neuralEmbedding)
      : null;
    return {
      referenceId: reference?.id || null,
      candidateId: candidate?.id || null,
      model: overall.model,
      similarity: overall.similarity,
      distance: overall.distance,
      neural,
      largestDifferences: overall.differences.slice(0, 5),
      worstSegment,
    };
  }

  window.VoiceSimilarity = {
    vectorDistance,
    vectorSimilarity,
    compareEmbeddings,
    findMostDifferentSegment,
    compare: compareVoiceRepresentations,
  };
})();
