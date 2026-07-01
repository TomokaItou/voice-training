// Assembles static application shell markup before the rest of the app scripts run.
(function () {
  const parts = window.voiceTrainingMarkupParts || {};
  const requiredParts = ['launcher', 'library', 'vocalMoves', 'activeSearch', 'aiVocalTeacher', 'songAnalysis', 'training', 'sidebar'];
  const missingParts = requiredParts.filter((key) => !parts[key]);

  if (missingParts.length) {
    throw new Error(`Missing app markup part(s): ${missingParts.join(', ')}`);
  }

  const appMarkup = requiredParts.map((key) => parts[key]).join('\n');
  document.currentScript.insertAdjacentHTML('beforebegin', appMarkup);
})();
