// ============================================================
// EUNOIA — Modals & Form Handlers
// ============================================================

const Modals = {

  // --- Generic open/close ---
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  },

  // ============================================================
  // CERMIN — Save check-in
  // ============================================================
  saveCermin() {
    const mood  = parseInt(document.querySelector('.mood-btn.selected')?.dataset.mood || '0');
    const sleep = parseFloat(document.getElementById('cermin-sleep').value || '7');
    const note  = document.getElementById('cermin-note').value.trim();

    if (!mood) { showToast('Pilih mood dulu ya!'); return; }

    Store.saveCheckin({ mood, sleep, note });
    Pages.cermin();
    Pages.home();
    showToast('✓ Check-in tersimpan!');
  },

  // ============================================================
  // ENERGI — Add activity modal
  // ============================================================
  openAddActivity() {
    document.getElementById('act-name-input').value     = '';
    document.getElementById('act-duration-input').value = '';
    document.getElementById('act-energy-input').value   = '0';
    document.getElementById('act-energy-display').textContent = '0';
    document.getElementById('act-type-select').value    = 'restore';
    this._updateEnergySign();
    this.open('modal-activity');
  },

  _updateEnergySign() {
    const type  = document.getElementById('act-type-select').value;
    const slider = document.getElementById('act-energy-input');
    const disp  = document.getElementById('act-energy-display');
    const raw   = parseInt(slider.value);
    const val   = type === 'drain' ? -Math.abs(raw) : Math.abs(raw);
    disp.textContent = (val > 0 ? '+' : '') + val;
    disp.style.color = val > 0 ? 'var(--info-fg)' : val < 0 ? 'var(--coral)' : 'var(--bark)';
  },

  saveActivity() {
    const name     = document.getElementById('act-name-input').value.trim();
    const duration = document.getElementById('act-duration-input').value.trim();
    const type     = document.getElementById('act-type-select').value;
    const raw      = parseInt(document.getElementById('act-energy-input').value);
    const energy   = type === 'drain' ? -Math.abs(raw) : Math.abs(raw);

    if (!name) { showToast('Isi nama aktivitas dulu!'); return; }

    const iconMap = {
      restore: 'ti-heart', drain: 'ti-device-laptop',
      neutral: 'ti-minus'
    };

    Store.addActivity({ name, duration, energy, icon: iconMap[type] || 'ti-circle' });
    this.close('modal-activity');
    Pages.energi();
    Pages.home();
    showToast('✓ Aktivitas ditambahkan!');
  },

  // ============================================================
  // RUTINITAS — Add routine modal
  // ============================================================
  openAddRoutine() {
    document.getElementById('rt-title-input').value  = '';
    document.getElementById('rt-time-input').value   = '07:00';
    document.getElementById('rt-energy-input').value = '10';
    document.getElementById('rt-lite-input').value   = '';
    this.open('modal-routine');
  },

  saveRoutine() {
    const title    = document.getElementById('rt-title-input').value.trim();
    const time     = document.getElementById('rt-time-input').value;
    const energy   = parseInt(document.getElementById('rt-energy-input').value) || 0;
    const liteTitle = document.getElementById('rt-lite-input').value.trim();

    if (!title) { showToast('Isi nama rutinitas dulu!'); return; }
    if (!time)  { showToast('Isi jam rutinitas!'); return; }

    Store.addRoutine({ title, time, energy, lite: !!liteTitle, liteTitle: liteTitle || '' });
    this.close('modal-routine');
    Pages.rutinitas();
    showToast('✓ Rutinitas ditambahkan!');
  },

  // ============================================================
  // KONTRAK — Add contract modal
  // ============================================================
  openAddContract() {
    document.getElementById('kt-title-input').value    = '';
    document.getElementById('kt-promise-input').value  = '';
    document.getElementById('kt-partner-input').value  = '';
    document.getElementById('kt-duration-input').value = '30';
    this.open('modal-contract');
  },

  saveContract() {
    const title    = document.getElementById('kt-title-input').value.trim();
    const promise  = document.getElementById('kt-promise-input').value.trim();
    const partner  = document.getElementById('kt-partner-input').value.trim();
    const duration = parseInt(document.getElementById('kt-duration-input').value) || 30;

    if (!title)   { showToast('Isi judul kontrak!'); return; }
    if (!promise) { showToast('Tulis janji/komitmenmu!'); return; }

    Store.addContract({ title, promise, partner, duration });
    this.close('modal-contract');
    Pages.kontrak();
    Pages.home();
    showToast('✓ Kontrak dibuat!');
  },

  // ============================================================
  // SETUP — Save profile
  // ============================================================
  saveSetup() {
    const name = document.getElementById('setup-name').value.trim();
    if (!name) { showToast('Masukkan namamu dulu!'); return; }

    Store.saveProfile({ name, setupDone: true });

    // Hide setup, show app
    document.getElementById('page-setup').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    Router.go('home');
    showToast('Selamat datang, ' + name + '! 🌱');
  }
};

window.Modals = Modals;

// ============================================================
// INIT — Bootstrap the app
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const profile = Store.getProfile();

  if (!profile.setupDone) {
    // Show onboarding
    document.getElementById('page-setup').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  } else {
    document.getElementById('page-setup').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    Router.go('home');
  }

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) Modals.closeAll();
    });
  });

  // Mood buttons
  document.querySelectorAll('.mood-btn').forEach((btn, i) => {
    btn.dataset.mood = i + 1;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Sleep slider live update
  const sleepSlider = document.getElementById('cermin-sleep');
  if (sleepSlider) {
    sleepSlider.addEventListener('input', () => {
      document.getElementById('cermin-sleep-val').textContent = sleepSlider.value + ' jam';
    });
  }

  // Activity energy slider live update
  const actSlider = document.getElementById('act-energy-input');
  if (actSlider) {
    actSlider.addEventListener('input', () => Modals._updateEnergySign());
    document.getElementById('act-type-select')?.addEventListener('change', () => Modals._updateEnergySign());
  }

  // Reset routine done status at midnight
  const lastDate = localStorage.getItem('eunoia_last_date');
  const today = Store.getTodayKey();
  if (lastDate && lastDate !== today) {
    Store.resetRoutineDone();
  }
  localStorage.setItem('eunoia_last_date', today);
});
