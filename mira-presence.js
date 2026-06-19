function setMiraPresenceState(state = 'idle', message) {
  if (!miraHero) {
    return;
  }
  const nextState = ['idle', 'listening', 'thinking', 'success'].includes(state) ? state : 'idle';
  miraHero.classList.remove('mira-state-idle', 'mira-state-listening', 'mira-state-thinking', 'mira-state-success');
  miraHero.classList.add(`mira-state-${nextState}`);
  if (miraStateBubble) {
    const stateCopy = {
      idle: '我在等你',
      listening: '我在听',
      thinking: '我在找重点',
      success: '找到今天最值得修的一点了',
    };
    miraStateBubble.textContent = message || stateCopy[nextState] || stateCopy.idle;
  }
}

function pulseMiraSuccess(message) {
  setMiraPresenceState('success', message);
  window.clearTimeout(miraSuccessTimer);
  miraSuccessTimer = window.setTimeout(() => {
    setMiraPresenceState('idle');
  }, 820);
}

function scheduleMiraBlink() {
  if (!miraHero || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  window.clearTimeout(miraBlinkTimer);
  const delay = 4000 + Math.random() * 3000;
  miraBlinkTimer = window.setTimeout(() => {
    miraHero.classList.add('mira-blink');
    window.setTimeout(() => {
      miraHero.classList.remove('mira-blink');
      scheduleMiraBlink();
    }, 160);
  }, delay);
}

function initMiraPresence() {
  setMiraPresenceState('idle');
  scheduleMiraBlink();
  startTodayTrainingButton?.addEventListener('pointerenter', () => {
    miraHero?.classList.add('mira-is-hovered');
  });
  startTodayTrainingButton?.addEventListener('pointerleave', () => {
    miraHero?.classList.remove('mira-is-hovered');
  });
  startTodayTrainingButton?.addEventListener('focus', () => {
    miraHero?.classList.add('mira-is-hovered');
  });
  startTodayTrainingButton?.addEventListener('blur', () => {
    miraHero?.classList.remove('mira-is-hovered');
  });
}

window.setMiraPresenceState = setMiraPresenceState;
window.pulseMiraSuccess = pulseMiraSuccess;
window.initMiraPresence = initMiraPresence;
