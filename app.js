// ============================================================
// EUNOIA — App Core (Router, Utilities, Home Page)
// ============================================================

// --- Router ---
const Router = {
  current: 'home',
  go(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const el = document.getElementById('page-' + page);
    if (!el) return;
    el.classList.add('active');

    const nav = document.getElementById('nav-' + page);
    if (nav) nav.classList.add('active');

    this.current = page;
    window.scrollTo(0, 0);

    // Render page content
    if (page === 'home')      Pages.home();
    if (page === 'cermin')    Pages.cermin();
    if (page === 'energi')    Pages.energi();
    if (page === 'rutinitas') Pages.rutinitas();
    if (page === 'kontrak')   Pages.kontrak();
  }
};

// --- Toast ---
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// --- Format time ---
function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// --- Format date ID ---
function todayLabel() {
  const d = new Date();
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// --- Avatar initials color ---
function avatarColor(name) {
  const colors = ['#3A5A4A','#6B5B8A','#C4882A','#C4604A','#2C6B8A'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// --- Initials ---
function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ============================================================
// HOME PAGE
// ============================================================

const Pages = {

  home() {
    const profile = Store.getProfile();
    const streak  = Store.getStreak();
    const energy  = Store.calcEnergyScore();
    const insight = Store.getInsight();
    const days7   = Store.getLast7();
    const checkin = Store.getCheckin();
    const lite    = Store.isLiteMode();

    // Greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'pagi' : hour < 17 ? 'siang' : 'malam';

    document.getElementById('home-greeting').innerHTML =
      `Selamat ${greet},<br><em>${profile.name || 'Teman'}</em>`;
    document.getElementById('home-sub').textContent =
      `${todayLabel()} · ${streak > 0 ? 'Hari ke-' + streak + ' berturut-turut' : 'Mulai streak hari ini!'}`;

    // Streak dots
    document.getElementById('home-streak').innerHTML = days7.map(d => `
      <div class="streak-day">
        <div class="streak-dot ${d.isToday ? 'today' : d.done ? 'done' : 'pending'}">
          ${d.isToday ? streak || '·' : d.done ? '✓' : ''}
        </div>
        <div class="streak-label">${d.label}</div>
      </div>
    `).join('');

    // Energy
    document.getElementById('home-energy-num').textContent = energy;
    document.getElementById('home-energy-bar').style.width = energy + '%';
    document.getElementById('home-energy-desc').textContent =
      energy >= 80 ? 'Kondisi prima — siap untuk hari yang produktif!' :
      energy >= 60 ? 'Cukup baik — jadwal sudah disesuaikan' :
      energy >= 40 ? 'Agak lelah — prioritaskan tugas penting saja' :
                     'Energi rendah — istirahat lebih dulu ya';

    // Insight
    document.getElementById('home-insight-text').textContent = insight.text;
    document.getElementById('home-insight-sub').textContent  = insight.sub;

    // Pillar statuses
    document.getElementById('ps-cermin').textContent    = checkin ? '✓ Selesai' : 'Belum diisi';
    document.getElementById('ps-energi').textContent    = energy + ' / 100';
    document.getElementById('ps-rutinitas').textContent  = lite ? 'Lite mode ✦' : 'Normal';
    const contracts = Store.getContracts();
    document.getElementById('ps-kontrak').textContent   = contracts.length ? contracts.length + ' aktif' : 'Buat kontrak';
  },

  // ============================================================
  // CERMIN PAGE
  // ============================================================

  cermin() {
    const checkin = Store.getCheckin();
    const patterns = this._getPatterns();

    // Pre-fill if already done
    const mood  = checkin?.mood  || 0;
    const sleep = checkin?.sleep || 7;
    const note  = checkin?.note  || '';

    document.getElementById('cermin-sleep').value = sleep;
    document.getElementById('cermin-sleep-val').textContent = sleep + ' jam';
    document.getElementById('cermin-note').value = note;

    // Mood
    document.querySelectorAll('.mood-btn').forEach((b, i) => {
      b.classList.toggle('selected', (i + 1) === mood);
    });

    // Patterns
    document.getElementById('cermin-patterns').innerHTML = patterns.length
      ? patterns.map(p => `<span class="pattern-chip"><i class="ti ${p.icon}" aria-hidden="true"></i> ${p.text}</span>`).join('')
      : '<span style="font-size:13px;color:var(--bark)">Isi check-in beberapa hari untuk melihat pola.</span>';

    if (checkin) {
      document.getElementById('cermin-save-btn').textContent = '✓ Diperbarui — Simpan Lagi';
    }
  },

  _getPatterns() {
    const patterns = [];
    // Collect last 7 days checkins
    const week = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const c = Store.getCheckin(d.toISOString().slice(0, 10));
      if (c) week.push(c);
    }
    if (week.length < 2) return patterns;

    const avgSleep = week.reduce((s, c) => s + (c.sleep || 7), 0) / week.length;
    const avgMood  = week.reduce((s, c) => s + (c.mood  || 3), 0) / week.length;

    if (avgSleep < 6.5) patterns.push({ icon: 'ti-moon', text: 'Rata-rata tidur kurang dari 6.5 jam' });
    if (avgSleep >= 7.5) patterns.push({ icon: 'ti-moon', text: 'Tidur cukup minggu ini!' });
    if (avgMood >= 4) patterns.push({ icon: 'ti-sun', text: 'Mood umumnya positif minggu ini' });
    if (avgMood <= 2) patterns.push({ icon: 'ti-cloud', text: 'Mood sedang kurang baik — jaga dirimu' });
    if (week.length >= 5) patterns.push({ icon: 'ti-calendar-check', text: 'Konsisten ' + week.length + ' hari berturut-turut!' });

    return patterns;
  },

  // ============================================================
  // ENERGI PAGE
  // ============================================================

  energi() {
    const score = Store.calcEnergyScore();
    const acts  = Store.getActivities();

    document.getElementById('energi-score').textContent = score;
    document.getElementById('energi-bar').style.width = score + '%';

    const drains   = acts.filter(a => a.energy < 0).reduce((s, a) => s + a.energy, 0);
    const restores = acts.filter(a => a.energy > 0).reduce((s, a) => s + a.energy, 0);

    document.getElementById('energi-drains').textContent   = drains;
    document.getElementById('energi-restores').textContent = '+' + restores;
    document.getElementById('energi-total').textContent    = score;

    // Render activity list
    const list = document.getElementById('energi-list');
    if (!acts.length) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">⚡</div>
        <div class="empty-text">Belum ada aktivitas hari ini.<br>Tambahkan untuk melacak energimu.</div>
      </div>`;
      return;
    }
    list.innerHTML = acts.map(a => {
      const pillClass = a.energy > 0 ? 'pill-restore' : a.energy < 0 ? 'pill-drain' : 'pill-neutral';
      const sign = a.energy > 0 ? '+' : '';
      return `
        <div class="activity-row">
          <div class="act-icon" style="background:${a.energy > 0 ? 'var(--info-bg)' : a.energy < 0 ? 'var(--coral-light)' : 'var(--stone)'}">
            <i class="ti ${a.icon}" style="color:${a.energy > 0 ? 'var(--info-fg)' : a.energy < 0 ? 'var(--coral)' : 'var(--bark)'}" aria-hidden="true"></i>
          </div>
          <div class="act-info">
            <div class="act-name">${a.name}</div>
            <div class="act-type">${a.duration || ''}</div>
          </div>
          <span class="energy-pill ${pillClass}">${sign}${a.energy}</span>
          <span class="act-del" onclick="Pages.deleteActivity(${a.id})" title="Hapus">
            <i class="ti ti-x" aria-hidden="true"></i>
          </span>
        </div>`;
    }).join('');
  },

  deleteActivity(id) {
    Store.removeActivity(id);
    this.energi();
    Pages.home();
    showToast('Aktivitas dihapus');
  },

  // ============================================================
  // RUTINITAS PAGE
  // ============================================================

  rutinitas() {
    const routines = Store.getRoutines();
    const lite = Store.isLiteMode();
    const done = routines.filter(r => r.done).length;
    const total = routines.length;

    // Context banner
    const banner = document.getElementById('rutinitas-banner');
    if (lite) {
      const checkin = Store.getCheckin();
      const reasons = [];
      if (checkin?.sleep < 6) reasons.push('tidur kurang');
      if (checkin?.mood <= 2) reasons.push('mood sedang rendah');
      banner.style.display = 'flex';
      banner.innerHTML = `
        <i class="ti ti-cloud-rain" style="font-size:18px;color:var(--coral);flex-shrink:0" aria-hidden="true"></i>
        <div>Kondisi hari ini: <strong style="color:var(--coral)">${reasons.join(' + ')}</strong> — <strong>Mode Lite aktif.</strong> Rutinitas disederhanakan untukmu. Kamu tetap maju! 💪</div>`;
    } else {
      banner.style.display = 'none';
    }

    // Progress
    document.getElementById('rutinitas-progress').textContent = `${done} / ${total} selesai`;
    document.getElementById('rutinitas-bar').style.width = (total ? (done/total*100) : 0) + '%';

    // Render
    const list = document.getElementById('rutinitas-list');
    list.innerHTML = routines.map(r => {
      const title = (lite && r.lite && r.liteTitle) ? r.liteTitle : r.title;
      const isLiteVariant = lite && r.lite && r.liteTitle;
      return `
        <div class="routine-item">
          <div class="routine-time">${r.time}</div>
          <div class="routine-check ${r.done ? 'done' : ''}" onclick="Pages.toggleRoutine(${r.id})">
            ${r.done ? '<i class="ti ti-check" style="font-size:12px;color:white" aria-hidden="true"></i>' : ''}
          </div>
          <div class="routine-title ${r.done ? 'done' : ''} ${isLiteVariant ? 'lite-active' : ''}">${title}</div>
          ${isLiteVariant ? '<span class="badge badge-lite">Lite</span>' : ''}
          <span class="badge-del" onclick="Pages.deleteRoutine(${r.id})" title="Hapus">
            <i class="ti ti-x" aria-hidden="true"></i>
          </span>
        </div>`;
    }).join('') || `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Belum ada rutinitas.<br>Tambahkan aktivitas harianmu!</div></div>`;
  },

  toggleRoutine(id) {
    Store.toggleRoutine(id);
    this.rutinitas();
  },

  deleteRoutine(id) {
    Store.deleteRoutine(id);
    this.rutinitas();
    showToast('Rutinitas dihapus');
  },

  // ============================================================
  // KONTRAK PAGE
  // ============================================================

  kontrak() {
    const contracts = Store.getContracts();
    const list = document.getElementById('kontrak-list');

    if (!contracts.length) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📜</div>
        <div class="empty-text">Belum ada kontrak diri.<br>Buat komitmen pertamamu!</div>
      </div>`;
      return;
    }

    list.innerHTML = contracts.map(c => {
      const start = new Date(c.startDate);
      const today = new Date();
      const daysDiff = Math.floor((today - start) / 86400000) + 1;
      const daysLeft = Math.max(0, c.duration - daysDiff + 1);
      const verifs = c.verifications || [];
      const todayKey = Store.getTodayKey();
      const verifiedToday = verifs.includes(todayKey);

      // Last 7 verifications
      const dots = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        dots.push(verifs.includes(k));
      }

      const color = avatarColor(c.partner || 'X');
      const ini   = initials(c.partner || 'P');

      return `
        <div class="contract-card">
          <div class="contract-header">
            <i class="ti ti-writing" style="font-size:18px;flex-shrink:0;margin-top:2px" aria-hidden="true"></i>
            <div>
              <div class="contract-title">${c.title}</div>
              <div class="contract-meta">Mulai ${c.startDate} · ${daysLeft} hari tersisa dari ${c.duration}</div>
            </div>
            <span onclick="Pages.deleteContract(${c.id})" style="margin-left:auto;cursor:pointer;opacity:.6;font-size:18px" title="Hapus">
              <i class="ti ti-x" aria-hidden="true"></i>
            </span>
          </div>
          <div class="contract-body">
            <div class="contract-promise">"${c.promise}"</div>
            ${c.partner ? `
            <div class="partner-row">
              <div class="avatar" style="background:${color}">${ini}</div>
              <div>
                <div class="partner-name">${c.partner}</div>
                <div class="partner-role">Accountability partner</div>
              </div>
              <i class="ti ti-check-circle" style="color:var(--forest);font-size:18px;margin-left:auto" aria-hidden="true"></i>
            </div>` : ''}
            <div class="label-upper" style="margin-bottom:8px">Verifikasi 7 hari terakhir</div>
            <div class="streak-mini">
              ${dots.map(done => `
                <div class="streak-mini-dot ${done ? '' : 'empty'}">
                  ${done ? '<i class="ti ti-check" style="font-size:10px" aria-hidden="true"></i>' : ''}
                </div>`).join('')}
            </div>
            <div style="font-size:12px;color:var(--bark);margin:6px 0 12px">
              ${verifs.length} hari terverifikasi dari ${daysDiff} hari berjalan
            </div>
            <button class="verify-btn ${verifiedToday ? 'verified' : ''}"
              onclick="${verifiedToday ? '' : 'Pages.verifyContract(' + c.id + ')'}"
              ${verifiedToday ? 'disabled' : ''}>
              <i class="ti ${verifiedToday ? 'ti-check' : 'ti-camera'}" aria-hidden="true"></i>
              ${verifiedToday ? 'Sudah terverifikasi hari ini!' : 'Verifikasi hari ini'}
            </button>
          </div>
        </div>`;
    }).join('');
  },

  verifyContract(id) {
    Store.verifyContract(id);
    this.kontrak();
    showToast('✓ Verifikasi berhasil!');
  },

  deleteContract(id) {
    if (!confirm('Hapus kontrak ini?')) return;
    Store.deleteContract(id);
    this.kontrak();
    showToast('Kontrak dihapus');
  }
};

window.Pages = Pages;
window.Router = Router;
window.showToast = showToast;
