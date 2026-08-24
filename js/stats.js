/* ==========================================================================
   HabitHeatmap - Statistical & Streak Calculation Engine
   100% Precise Date Mathematics & Habit Metrics
   ========================================================================== */

class HabitStatsEngine {
  constructor(store) {
    this.store = store;
  }

  // Format date to YYYY-MM-DD
  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Parse YYYY-MM-DD to Date object at local midnight
  parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Calculate Overall Streak (consecutive days with >= 1 habit done)
  calculateOverallStreak() {
    const logs = this.store.getAllLogs();
    const today = new Date();
    const todayStr = this.formatDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterday);

    // Check if streak is active starting from today or yesterday
    let checkDate = (logs[todayStr] && logs[todayStr].length > 0) ? new Date(today) : new Date(yesterday);
    let currentStreak = 0;

    while (true) {
      const dateStr = this.formatDate(checkDate);
      if (logs[dateStr] && logs[dateStr].length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak calculation across all time
    const sortedDates = Object.keys(logs)
      .filter(d => logs[d] && logs[d].length > 0)
      .sort();

    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    sortedDates.forEach(dateStr => {
      const currDate = this.parseDate(dateStr);
      if (prevDate) {
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = currDate;
    });

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak)
    };
  }

  // Calculate individual streak for a specific habit
  calculateHabitStreak(habitId) {
    const logs = this.store.getAllLogs();
    const today = new Date();
    const todayStr = this.formatDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterday);

    const hasToday = logs[todayStr] && logs[todayStr].includes(habitId);
    const hasYesterday = logs[yesterdayStr] && logs[yesterdayStr].includes(habitId);

    if (!hasToday && !hasYesterday) {
      return 0;
    }

    let checkDate = hasToday ? new Date(today) : new Date(yesterday);
    let streak = 0;

    while (true) {
      const dateStr = this.formatDate(checkDate);
      if (logs[dateStr] && logs[dateStr].includes(habitId)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Calculate high-level summary metrics
  calculateSummary() {
    const habits = this.store.getHabits();
    const logs = this.store.getAllLogs();
    const streakInfo = this.calculateOverallStreak();

    // Total check-ins
    let totalCheckIns = 0;
    Object.values(logs).forEach(arr => {
      totalCheckIns += arr.length;
    });

    // 30-Day Completion Rate
    const today = new Date();
    let totalPossible30d = habits.length * 30;
    let actualCompleted30d = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = this.formatDate(d);
      const dayLogs = logs[dateStr] || [];
      actualCompleted30d += dayLogs.length;
    }

    const completionRate30d = totalPossible30d > 0
      ? Math.min(100, Math.round((actualCompleted30d / totalPossible30d) * 100))
      : 0;

    // Today's progress
    const todayStr = this.formatDate(today);
    const todayDone = (logs[todayStr] || []).length;
    const todayTotal = habits.length;

    return {
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalCheckIns,
      completionRate30d,
      todayDone,
      todayTotal
    };
  }
}

window.HabitStatsEngine = HabitStatsEngine;
