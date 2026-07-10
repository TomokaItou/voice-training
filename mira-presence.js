function setMiraPresenceState(state = 'idle', message) {
  if (!miraHero) {
    return;
  }
  const aliases = { success: 'celebrating' };
  const requestedState = aliases[state] || state;
  const nextState = ['idle', 'speaking', 'listening', 'thinking', 'celebrating'].includes(requestedState)
    ? requestedState
    : 'idle';
  miraHero.classList.remove(
    'mira-state-idle',
    'mira-state-speaking',
    'mira-state-listening',
    'mira-state-thinking',
    'mira-state-success',
    'mira-state-celebrating'
  );
  miraHero.classList.add(`mira-state-${nextState}`);
  if (miraStateBubble) {
    const stateCopy = {
      idle: '我在等你。',
      speaking: 'Mira 正在说话。',
      listening: '我在听。',
      thinking: '嗯……让我听一下。',
      celebrating: '等等，就是刚才这一句！',
    };
    miraStateBubble.textContent = message || stateCopy[nextState] || stateCopy.idle;
  }
}

function pulseMiraSuccess(message) {
  setMiraPresenceState('celebrating', message);
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
