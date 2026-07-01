function aiTeacherFeatureNames(vectors) {
  const names = new Set();
  vectors.forEach((vector) => {
    Object.keys(vector.features || {}).forEach((key) => names.add(key));
  });
  return [...names].sort();
}

function aiTeacherBuildMatrix(vectors, featureNames) {
  return vectors.map((vector) => featureNames.map((name) => Number(vector.features?.[name]) || 0));
}

function aiTeacherCovariance(matrix, mean) {
  const rows = matrix.length;
  const cols = mean.length;
  const covariance = Array.from({ length: cols }, () => Array(cols).fill(0));
  if (rows < 2) return covariance;
  matrix.forEach((row) => {
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < cols; j += 1) {
        covariance[i][j] += (row[i] - mean[i]) * (row[j] - mean[j]);
      }
    }
  });
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      covariance[i][j] /= rows - 1;
    }
  }
  return covariance;
}

function aiTeacherJacobiEigenSymmetric(matrix) {
  const n = matrix.length;
  const a = matrix.map((row) => row.slice());
  const v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_x, j) => (i === j ? 1 : 0)));
  if (!n) return { eigenvalues: [], eigenvectors: [] };

  for (let iteration = 0; iteration < 80; iteration += 1) {
    let p = 0;
    let q = 1;
    let max = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const value = Math.abs(a[i][j]);
        if (value > max) {
          max = value;
          p = i;
          q = j;
        }
      }
    }
    if (max < 1e-10) break;
    const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
    const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = 0;
    a[q][p] = 0;
    for (let k = 0; k < n; k += 1) {
      if (k !== p && k !== q) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[p][k] = a[k][p];
        a[k][q] = s * akp + c * akq;
        a[q][k] = a[k][q];
      }
      const vkp = v[k][p];
      const vkq = v[k][q];
      v[k][p] = c * vkp - s * vkq;
      v[k][q] = s * vkp + c * vkq;
    }
  }

  const pairs = a.map((row, index) => ({
    value: Math.max(0, row[index]),
    vector: v.map((vectorRow) => vectorRow[index]),
  })).sort((left, right) => right.value - left.value);

  return {
    eigenvalues: pairs.map((pair) => pair.value),
    eigenvectors: pairs.map((pair) => pair.vector),
  };
}

function estimateAiTeacherTaskMemory(taskId, vectors) {
  const featureNames = aiTeacherFeatureNames(vectors);
  const matrix = aiTeacherBuildMatrix(vectors, featureNames);
  const meanValues = featureNames.map((_name, index) => aiTeacherMean(matrix.map((row) => row[index])));
  const covariance = aiTeacherCovariance(matrix, meanValues);
  const eigens = aiTeacherJacobiEigenSymmetric(covariance);
  const leading = eigens.eigenvectors[0] || featureNames.map(() => 0);
  const leadingEigenvector = {};
  featureNames.forEach((name, index) => {
    leadingEigenvector[name] = leading[index] || 0;
  });
  const mean = {};
  featureNames.forEach((name, index) => {
    mean[name] = meanValues[index] || 0;
  });
  const dominantFeatures = featureNames
    .map((name, index) => ({ name, weight: Math.abs(leading[index] || 0) }))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3)
    .map((item) => item.name);

  return {
    taskId,
    mean,
    covariance,
    eigenvalues: eigens.eigenvalues,
    leadingEigenvector,
    instabilityScore: eigens.eigenvalues[0] || 0,
    dominantFeatures,
  };
}

function estimateAiTeacherMemoryByTask(vectors) {
  return AI_VOCAL_TEACHER_TASKS.map((task) => {
    const taskVectors = vectors.filter((vector) => vector.taskId === task.id);
    return taskVectors.length ? estimateAiTeacherTaskMemory(task.id, taskVectors) : null;
  }).filter(Boolean);
}

window.estimateAiTeacherTaskMemory = estimateAiTeacherTaskMemory;
window.estimateAiTeacherMemoryByTask = estimateAiTeacherMemoryByTask;
