(function () {
  const app = {
    installPrompt: null,
    standalone:
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  };

  function isSecureForAudio() {
    return window.isSecureContext || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  }

  function setMobileViewportHeight() {
    document.documentElement.style.setProperty('--app-viewport-height', `${window.innerHeight}px`);
  }

  function updateInstallState() {
    document.documentElement.classList.toggle('is-installed-app', app.standalone);
    document.documentElement.classList.toggle('can-install-app', Boolean(app.installPrompt));
    document.documentElement.classList.toggle('needs-secure-audio-context', !isSecureForAudio());
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      return;
    }

    try {
      await navigator.serviceWorker.register('./service-worker.js');
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    app.installPrompt = event;
    updateInstallState();
  });

  window.addEventListener('appinstalled', () => {
    app.installPrompt = null;
    app.standalone = true;
    updateInstallState();
  });

  window.voiceTrainingAppInstall = {
    async prompt() {
      if (!app.installPrompt) {
        return false;
      }

      const promptEvent = app.installPrompt;
      app.installPrompt = null;
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      updateInstallState();
      return choice?.outcome === 'accepted';
    },
    isSecureForAudio
  };

  setMobileViewportHeight();
  updateInstallState();
  registerServiceWorker();
  window.addEventListener('resize', setMobileViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setMobileViewportHeight, 250);
  });
})();
