/* ==========================================================================
   HabitHeatmap - Local Storage Data Store Layer
   Zero Server Communication, 100% Offline-First, Robust Data Integrity
   ========================================================================== */

const STORAGE_KEYS = {
  HABITS: 'habit_heatmap_habits_v1',
  LOGS: 'habit_heatmap_logs_v1',
  THEME: 'habit_heatmap_theme_v1'
};

const DEFAULT_HABITS = [
  { id: 'h_read', name: 'Read 20 Pages', color: '#C97A3E', createdAt: Date.now() - 86400000 * 90 },
  { id: 'h_code', name: 'Deep Coding Session', color: '#4F7C53', createdAt: Date.now() - 86400000 * 90 },
  { id: 'h_exercise', name: 'Physical Exercise', color: '#B8533E', createdAt: Date.now() - 86400000 * 90 },
  { id: 'h_water', name: 'Hydration 2.5L', color: '#4A5B78', createdAt: Date.now() - 86400000 * 90 },
  { id: 'h_meditate', name: 'Mindful Meditation', color: '#7A4B6E', createdAt: Date.now() - 86400000 * 90 }
];

class HabitStore {
  constructor() {
    this.habits = [];
    this.logs = {}; // { "YYYY-MM-DD": ["h_read", "h_code"] }
    this.listeners = [];
    this.init();
  }

  init() {
    const storedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

    if (storedHabits) {
      try {
        this.habits = JSON.parse(storedHabits);
      } catch (e) {
        this.habits = DEFAULT_HABITS;
      }
    } else {
      this.habits = DEFAULT_HABITS;
      this.saveHabits();
    }

    if (storedLogs) {
      try {
        this.logs = JSON.parse(storedLogs);
      } catch (e) {
        this.logs = this.generateSampleLogs();
      }
    } else {
      // Seed with realistic historical data for visual gratification
      this.logs = this.generateSampleLogs();
      this.saveLogs();
    }
  }

  generateSampleLogs() {
    const logs = {};
    const today = new Date();
    const habitIds = this.habits.map(h => h.id);

    // Seed back 120 days with realistic probabilistic habits
    for (let i = 0; i <= 140; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Simulate a realistic active person with weekends and streak patterns
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
      const randomSeed = Math.sin(i * 999) * 10000;
      const pseudoRandom = randomSeed - Math.floor(randomSeed);

      const completed = [];
      habitIds.forEach((hid, idx) => {
        let prob = 0.72; // base probability
        if (hid === 'h_code' && (dayOfWeek === 0 || dayOfWeek === 6)) prob = 0.45;
        if (hid === 'h_exercise' && dayOfWeek === 0) prob = 0.3;
        if (i < 5) prob = 0.88; // current streak strong

        const itemSeed = Math.sin(i * 77 + idx * 31) * 10000;
        const itemRand = itemSeed - Math.floor(itemSeed);

        if (itemRand < prob) {
          completed.push(hid);
        }
      });

      if (completed.length > 0) {
        logs[dateStr] = completed;
      }
    }

    return logs;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  saveHabits() {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(this.habits));
    this.notify();
  }

  saveLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
    this.notify();
  }

  getHabits() {
    return [...this.habits];
  }

  getHabitById(id) {
    return this.habits.find(h => h.id === id);
  }

  addHabit(name, color) {
    if (!name || !name.trim()) return null;
    const newHabit = {
      id: 'h_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      color: color || '#4F7C53',
      createdAt: Date.now()
    };
    this.habits.push(newHabit);
    this.saveHabits();
    return newHabit;
  }

  updateHabit(id, name, color) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return false;
    if (name && name.trim()) habit.name = name.trim();
    if (color) habit.color = color;
    this.saveHabits();
    return true;
  }

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    // Remove habit from logs
    Object.keys(this.logs).forEach(dateStr => {
      this.logs[dateStr] = this.logs[dateStr].filter(hid => hid !== id);
      if (this.logs[dateStr].length === 0) {
        delete this.logs[dateStr];
      }
    });
    this.saveHabits();
    this.saveLogs();
  }

  getLogsForDate(dateStr) {
    return this.logs[dateStr] || [];
  }

  toggleHabitLog(dateStr, habitId) {
    if (!this.logs[dateStr]) {
      this.logs[dateStr] = [];
    }

    const index = this.logs[dateStr].indexOf(habitId);
    if (index >= 0) {
      this.logs[dateStr].splice(index, 1);
      if (this.logs[dateStr].length === 0) {
        delete this.logs[dateStr];
      }
    } else {
      this.logs[dateStr].push(habitId);
    }

    this.saveLogs();
  }

  getAllLogs() {
    return { ...this.logs };
  }

  // Backup & Restore
  exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: this.habits,
      logs: this.logs
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `habit-heatmap-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.habits) && typeof data.logs === 'object') {
        this.habits = data.habits;
        this.logs = data.logs;
        this.saveHabits();
        this.saveLogs();
        return { success: true, count: this.habits.length };
      }
      return { success: false, error: 'Invalid JSON format or schema.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDefault() {
    this.habits = DEFAULT_HABITS;
    this.logs = this.generateSampleLogs();
    this.saveHabits();
    this.saveLogs();
  }

  clearAll() {
    this.habits = [];
    this.logs = {};
    this.saveHabits();
    this.saveLogs();
  }
}

window.HabitStore = new HabitStore();
