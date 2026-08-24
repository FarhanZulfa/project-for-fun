/* ==========================================================================
   HabitHeatmap - GitHub-Style Contribution Heatmap Matrix Renderer
   SVG Matrix Generation, Color Tiering & Dynamic Interactive Tooltip
   ========================================================================== */

class HeatmapRenderer {
  constructor(containerId, tooltipId, store, onDateSelect) {
    this.container = document.getElementById(containerId);
    this.tooltip = document.getElementById(tooltipId);
    this.store = store;
    this.onDateSelect = onDateSelect;
    this.selectedHabitId = 'all'; // 'all' or specific habit id

    this.cellSize = 12;
    this.cellGap = 3.5;
    this.dayLabelWidth = 28;
    this.monthHeaderHeight = 20;

    this.init();
  }

  init() {
    this.render();
  }

  setHabitFilter(habitId) {
    this.selectedHabitId = habitId;
    this.render();
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Generate 52 weeks of dates leading up to today
  generateDateGrid() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the end of current week (Saturday = 6)
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - currentDayOfWeek));

    // 52 weeks = 52 * 7 = 364 days back from endDate
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1));

    const weeks = [];
    let currentWeek = [];
    const loopDate = new Date(startDate);

    while (loopDate <= endDate) {
      currentWeek.push(new Date(loopDate));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, startDate, endDate, today };
  }

  // Calculate intensity level (0 to 4)
  calculateLevel(dateStr, totalHabitsCount) {
    const dayLogs = this.store.getLogsForDate(dateStr);

    if (this.selectedHabitId === 'all') {
      if (totalHabitsCount === 0 || dayLogs.length === 0) return 0;
      const ratio = dayLogs.length / totalHabitsCount;
      if (ratio <= 0.25) return 1;
      if (ratio <= 0.50) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    } else {
      // Single habit filter
      return dayLogs.includes(this.selectedHabitId) ? 4 : 0;
    }
  }

  // Get color fill value based on theme and habit
  getCellColor(level, habitColor) {
    if (level === 0) return 'var(--heat-level-0)';

    if (this.selectedHabitId !== 'all' && habitColor) {
      return habitColor;
    }

    return `var(--heat-level-${level})`;
  }

  render() {
    if (!this.container) return;

    const { weeks, today } = this.generateDateGrid();
    const todayStr = this.formatDate(today);
    const habits = this.store.getHabits();
    const totalHabits = habits.length;

    const habitObj = this.selectedHabitId !== 'all'
      ? this.store.getHabitById(this.selectedHabitId)
      : null;

    const numWeeks = weeks.length;
    const svgWidth = this.dayLabelWidth + (numWeeks * (this.cellSize + this.cellGap));
    const svgHeight = this.monthHeaderHeight + (7 * (this.cellSize + this.cellGap));

    let monthLabelsSvg = '';
    let lastMonth = -1;

    // Month headers aligned to week columns
    weeks.forEach((week, weekIdx) => {
      const firstDayInWeek = week[0];
      const month = firstDayInWeek.getMonth();

      if (month !== lastMonth && weekIdx < numWeeks - 1) {
        const monthName = firstDayInWeek.toLocaleString('en-US', { month: 'short' });
        const x = this.dayLabelWidth + (weekIdx * (this.cellSize + this.cellGap));
        monthLabelsSvg += `<text x="${x}" y="12" class="heatmap-month-label">${monthName}</text>`;
        lastMonth = month;
      }
    });

    // Day labels (Mon, Wed, Fri)
    const dayNames = [
      { row: 1, label: 'Mon' },
      { row: 3, label: 'Wed' },
      { row: 5, label: 'Fri' }
    ];

    let dayLabelsSvg = '';
    dayNames.forEach(d => {
      const y = this.monthHeaderHeight + (d.row * (this.cellSize + this.cellGap)) + this.cellSize - 2;
      dayLabelsSvg += `<text x="0" y="${y}" class="heatmap-day-label">${d.label}</text>`;
    });

    // Matrix cells
    let cellsSvg = '';
    weeks.forEach((week, colIdx) => {
      week.forEach((dateObj, rowIdx) => {
        const dateStr = this.formatDate(dateObj);
        const isFuture = dateObj > today;
        const isToday = dateStr === todayStr;

        if (isFuture) {
          return; // Do not draw future days beyond current week end
        }

        const level = this.calculateLevel(dateStr, totalHabits);
        const fill = this.getCellColor(level, habitObj ? habitObj.color : null);
        const x = this.dayLabelWidth + (colIdx * (this.cellSize + this.cellGap));
        const y = this.monthHeaderHeight + (rowIdx * (this.cellSize + this.cellGap));
        const todayClass = isToday ? 'today-cell' : '';

        cellsSvg += `
          <rect
            class="heatmap-cell ${todayClass}"
            data-date="${dateStr}"
            x="${x}"
            y="${y}"
            width="${this.cellSize}"
            height="${this.cellSize}"
            fill="${fill}"
          ></rect>
        `;
      });
    });

    this.container.innerHTML = `
      <svg
        class="heatmap-svg"
        viewBox="0 0 ${svgWidth} ${svgHeight}"
        width="${svgWidth}"
        height="${svgHeight}"
      >
        ${monthLabelsSvg}
        ${dayLabelsSvg}
        ${cellsSvg}
      </svg>
    `;

    this.attachCellEvents();
  }

  attachCellEvents() {
    const cells = this.container.querySelectorAll('.heatmap-cell');

    cells.forEach(cell => {
      cell.addEventListener('mouseenter', (e) => this.showTooltip(e, cell.dataset.date));
      cell.addEventListener('mouseleave', () => this.hideTooltip());
      cell.addEventListener('click', () => {
        if (this.onDateSelect) {
          this.onDateSelect(cell.dataset.date);
        }
      });
    });
  }

  showTooltip(event, dateStr) {
    if (!this.tooltip) return;

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const habits = this.store.getHabits();
    const completedIds = this.store.getLogsForDate(dateStr);

    let countText = '';
    if (this.selectedHabitId === 'all') {
      countText = `${completedIds.length} of ${habits.length} habits completed`;
    } else {
      const isDone = completedIds.includes(this.selectedHabitId);
      countText = isDone ? 'Habit Completed' : 'Not completed';
    }

    let habitsHtml = '';
    if (habits.length > 0) {
      habitsHtml = habits.map(h => {
        const done = completedIds.includes(h.id);
        const statusClass = done ? 'done' : 'missed';
        const checkMark = done ? '✓' : '○';
        return `
          <div class="tooltip-habit-item ${statusClass}">
            <span class="tooltip-habit-dot" style="background:${h.color}"></span>
            <span>${checkMark} ${escapeHtml(h.name)}</span>
          </div>
        `;
      }).join('');
    }

    const dailyNote = this.store.getNoteForDate(dateStr);
    const noteHtml = dailyNote ? `
      <div class="tooltip-note" style="margin-top: 0.45rem; padding-top: 0.35rem; border-top: 1px dashed rgba(255, 255, 255, 0.15); font-size: 0.74rem; color: #E5A93C; font-style: italic; line-height: 1.35; display: flex; align-items: flex-start; gap: 5px;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:2px; opacity:0.9;"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
        <span>&ldquo;${escapeHtml(dailyNote)}&rdquo;</span>
      </div>
    ` : '';

    this.tooltip.innerHTML = `
      <div class="tooltip-date">${formattedDate}</div>
      <div class="tooltip-count">${countText}</div>
      <div class="tooltip-habits-list">${habitsHtml}</div>
      ${noteHtml}
      <div style="font-size: 0.68rem; color: #9C8F82; margin-top: 0.35rem; font-style: italic;">
        Click cell to edit check-ins
      </div>
    `;

    const rect = event.target.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    this.tooltip.style.left = `${rect.left + scrollLeft + rect.width / 2}px`;
    this.tooltip.style.top = `${rect.top + scrollTop}px`;
    this.tooltip.classList.add('visible');
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.HeatmapRenderer = HeatmapRenderer;
