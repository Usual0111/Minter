(() => {
  'use strict';
  let energy = 65;
  let claimed = false;
  let toastTimer;
  const toast = document.querySelector('#toast');
  const reactor = document.querySelector('.reactor');

  function notify(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function haptic() {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch (_) { /* Browser preview has no native feedback. */ }
  }

  function charge(amount) {
    const added = Math.min(amount, 100 - energy);
    energy += added;
    document.querySelector('#energy-value').textContent = energy;
    document.querySelector('#energy-fill').style.width = `${energy}%`;
    document.querySelector('.energy-progress').setAttribute('aria-valuenow', String(energy));
    reactor.classList.remove('charging');
    requestAnimationFrame(() => requestAnimationFrame(() => reactor.classList.add('charging')));
    haptic();
    return added;
  }

  document.querySelector('[data-action="energy"]').addEventListener('click', () => {
    if (energy === 100) return notify('Energy is full');
    const added = charge(10);
    notify(`+${added} energy`);
  });

  document.querySelector('[data-action="claim"]').addEventListener('click', (event) => {
    if (claimed) return;
    if (energy === 100) return notify('Energy is full');
    claimed = true;
    const added = charge(25);
    event.currentTarget.textContent = 'Claimed';
    event.currentTarget.disabled = true;
    notify(`Daily charge claimed · +${added} energy`);
  });

  document.querySelector('[data-action="wallet"]').addEventListener('click', () => notify('Your balance: 125,40 CR'));
  document.querySelector('[data-action="profile"]').addEventListener('click', () => notify('Welcome to Bountera'));
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      haptic();
      const tab = button.dataset.tab;
      if (tab === 'Home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (tab === 'Wallet') { notify('Your balance: 125,40 CR'); return; }
      notify(`${tab} · Coming soon`);
    });
  });

  // The home screen runs independently; initialize the native bridge when hosted in Telegram.
  function initTelegram() {
    const app = window.Telegram?.WebApp;
    if (!app) return;
    app.ready();
    app.expand();
    try { app.setHeaderColor('#e8ecf3'); app.setBackgroundColor('#e8ecf3'); } catch (_) { /* Older clients keep their native colors. */ }
  }
  if (window.Telegram?.WebApp) initTelegram();
  else if (/(?:tgWebAppData|tgWebAppVersion)=/.test(location.hash)) {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.onload = initTelegram;
    document.head.append(script);
  }
})();
