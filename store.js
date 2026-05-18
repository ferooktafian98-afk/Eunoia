// ============================================================
// EUNOIA — Data Store (localStorage)
// ============================================================

const Store = {
  // --- Get / Set helpers ---
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('eunoia_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('eunoia_' + key, JSON.stringify(value)); } catch {}
  },

  // --- User profile ---
  getProfile() {
    return this.get('profile', { name: '', setupDone: false });
  },
  saveProfile(data) { this.set('profile', data); },

  // --- Daily check-in ---
  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  },
  getCheckin(date) {
    const d = date || this.getTodayKey();
    return this.get('checkin_' + d, null);
  },
  saveCheckin(data) {
    this.set('checkin_' + this.getTodayKey(), { ...data, date: this.getTodayKey() });
  },

  // --- Energy activities ---
  getActivities(date) {
    const d = date || this.getTodayKey();
    return this.get('activities_' + d, []);
  },
  saveActivities(list) {
    this.set('activities_' + this.getTodayKey(), list);
  },
  addActivity(act) {
    const list = this.getActivities();
    list.push({ ...act, id: Date.now() });
    this.saveActivities(list);
    return list;
  },
  removeActivity(id) {
    const list = this.getActivities().filter(a => a.id !== id);
    this.saveActivities(list);
    return list;
  },

  // --- Routines ---
  getRoutines() {
    return this.get('routines', [
      { id: 1, time: '06:30', title: 'Bangun & minum air putih', energy: 5, lite: false, done: false },
      { id: 2, time: '07:00', title: 'Olahraga pagi', energy: 15, lite: true, liteTitle: 'Stretching 5 menit', done: false },
      { id: 3, time: '08:00', title: 'Sarapan bergizi', energy: 10, lite: false, done: false },
      { id: 4, time: '09:00', title: 'Fokus kerja utama', energy: -20, lite: true, liteTitle: 'Kerja 45 menit', done: false },
      { id: 5, time: '12:00', title: 'Istirahat makan siang', energy: 10, lite: false, done: false },
      { id: 6, time: '15:00', title: 'Jalan kaki singkat', energy: 8, lite: true, liteTitle: 'Jalan 5 menit', done: false },
      { id: 7, time: '21:00', title: 'Wind-down & baca buku', energy: 12, lite: false, done: false },
      { id: 8, time: '22:30', title: 'Tidur', energy: 20, lite: false, done: false },
    ]);
  },
  saveRoutines(list) { this.set('routines', list); },
  addRoutine(r) {
    const list = this.getRoutines();
    list.push({ ...r, id: Date.now(), done: false });
    list.sort((a, b) => a.time.localeCompare(b.time));
    this.saveRoutines(list);
    return list;
  },
  toggleRoutine(id) {
    const list = this.getRoutines().map(r => r.id === id ? { ...r, done: !r.done } : r);
    this.saveRoutines(list);
    return list;
  },
  deleteRoutine(id) {
    const list = this.getRoutines().filter(r => r.id !== id);
    this.saveRoutines(list);
    return list;
  },
  resetRoutineDone() {
    const list = this.getRoutines().map(r => ({ ...r, done: false }));
    this.saveRoutines(list);
  },

  // --- Contracts ---
  getContracts() { return this.get('contracts', []); },
  addContract(c) {
    const list = this.getContracts();
    const contract = { ...c, id: Date.now(), startDate: this.getTodayKey(), verifications: [] };
    list.push(contract);
    this.set('contracts', list);
    return list;
  },
  verifyContract(id) {
    const list = this.getContracts().map(c => {
      if (c.id === id) {
        const verifications = [...(c.verifications || [])];
        const today = this.getTodayKey();
        if (!verifications.includes(today)) verifications.push(today);
        return { ...c, verifications };
      }
      return c;
    });
    this.set('contracts', list);
    return list;
  },
  deleteContract(id) {
    const list = this.getContracts().filter(c => c.id !== id);
    this.set('contracts', list);
    return list;
  },

  // --- Streak ---
  getStreak() {
    const checkins = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (this.get('checkin_' + key)) checkins.push(key);
      else break;
    }
    return checkins.length;
  },
  getLast7() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      days.push({
        key,
        label: names[d.getDay()],
        done: !!this.get('checkin_' + key),
        isToday: i === 0
      });
    }
    return days;
  },

  // --- Insights engine ---
  getInsight() {
    const streak = this.getStreak();
    const today = this.getCheckin();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return this.getCheckin(d.toISOString().slice(0, 10));
    })();

    if (!today) return { text: 'Isi check-in pagi ini untuk mendapatkan insight personal.', sub: 'Butuh < 2 menit' };

    const sleep = today.sleep || 7;
    const mood = today.mood || 3;

    if (sleep < 6 && mood <= 2) return { text: 'Tidur kurang + mood rendah terdeteksi. Prioritaskan istirahat hari ini.', sub: 'Mode lite direkomendasikan' };
    if (sleep >= 8 && mood >= 4) return { text: `Kondisi prima! Ini saat terbaik untuk mengerjakan tugas yang paling menantang.`, sub: `Streak ${streak} hari berturut-turut` };
    if (streak >= 7) return { text: `${streak} hari berturut-turut — konsistensimu luar biasa.`, sub: 'Terus pertahankan pola ini' };
    if (mood <= 2) return { text: 'Mood sedang tidak prima. Jadwal sudah disesuaikan agar lebih ringan.', sub: 'Kamu tetap melangkah maju' };

    return { text: 'Kondisimu cukup baik hari ini. Fokus pada 1-2 hal penting saja.', sub: `Energi tersisa: ${this.calcEnergyScore()}` };
  },

  calcEnergyScore() {
    const acts = this.getActivities();
    const checkin = this.getCheckin();
    let base = 100;
    if (checkin) {
      const sleep = checkin.sleep || 7;
      base = Math.min(100, Math.round(40 + sleep * 7 + (checkin.mood || 3) * 4));
    }
    const delta = acts.reduce((sum, a) => sum + (a.energy || 0), 0);
    return Math.max(0, Math.min(100, base + delta));
  },

  isLiteMode() {
    const checkin = this.getCheckin();
    if (!checkin) return false;
    return (checkin.sleep || 7) < 6 || (checkin.mood || 3) <= 2;
  }
};

window.Store = Store;
