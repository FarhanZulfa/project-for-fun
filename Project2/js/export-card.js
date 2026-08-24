/* ==========================================================================
   HabitHeatmap - Share Card PNG Export Engine
   Renders a high-resolution, aesthetic contribution card onto HTML5 Canvas
   ========================================================================== */

(function(window) {
  'use strict';

  class HeatmapCardExporter {
    constructor() {
      this.width = 1080;
      this.height = 580;
    }

    exportCard(store, statsEngine, isDarkMode = false) {
      const canvas = document.createElement('canvas');
      const dpr = 2; // High-resolution Retina export
      canvas.width = this.width * dpr;
      canvas.height = this.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // Color Schemes
      const theme = isDarkMode ? {
        bg: '#181614',
        cardBg: '#221F1C',
        border: '#302A24',
        textMain: '#EDE6DC',
        textMuted: '#A3998E',
        textDim: '#756D63',
        statBoxBg: '#2A2622',
        heatLevels: ['#292521', '#2E5928', '#43873B', '#62B855', '#8DE07F'],
        accent: '#4F7C53',
        brandIconBg: '#4F7C53'
      } : {
        bg: '#F7F5F0',
        cardBg: '#FFFFFF',
        border: '#ECE7DE',
        textMain: '#2D251E',
        textMuted: '#73675C',
        textDim: '#9C8F82',
        statBoxBg: '#FAF8F5',
        heatLevels: ['#EBE7DE', '#B5D8A4', '#72B868', '#3B8C3A', '#1E5C22'],
        accent: '#4F7C53',
        brandIconBg: '#4F7C53'
      };

      // 1. Draw Card Background with Soft Border
      this.drawRoundedRect(ctx, 0, 0, this.width, this.height, 24);
      ctx.fillStyle = theme.bg;
      ctx.fill();

      // Card Container
      const padding = 28;
      const innerW = this.width - padding * 2;
      const innerH = this.height - padding * 2;

      this.drawRoundedRect(ctx, padding, padding, innerW, innerH, 18);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = theme.border;
      ctx.stroke();

      // 2. Header: Logo & Title
      const contentX = padding + 28;
      let curY = padding + 36;

      // Brand Icon (4 squares)
      const iconX = contentX;
      const iconY = curY - 14;
      const s = 11;
      const g = 3;
      ctx.fillStyle = theme.accent;
      this.drawRoundedRect(ctx, iconX, iconY, s, s, 2.5); ctx.fill();
      this.drawRoundedRect(ctx, iconX + s + g, iconY, s, s, 2.5); ctx.fill();
      this.drawRoundedRect(ctx, iconX, iconY + s + g, s, s, 2.5); ctx.fill();
      this.drawRoundedRect(ctx, iconX + s + g, iconY + s + g, s, s, 2.5); ctx.fill();

      // Title & Subtitle
      ctx.font = 'bold 22px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
      ctx.fillStyle = theme.textMain;
      ctx.fillText('HabitHeatmap', iconX + s * 2 + g + 14, curY + 2);

      ctx.font = '500 12px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = theme.textMuted;
      ctx.fillText('Personal Daily Consistency & Contribution Matrix', iconX + s * 2 + g + 14, curY + 19);

      // Date Stamp in Header Right
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = theme.textDim;
      ctx.textAlign = 'right';
      ctx.fillText(dateStr, this.width - padding - 28, curY + 4);
      ctx.textAlign = 'left';

      // 3. Stats Highlight Boxes
      curY += 44;
      const summary = statsEngine ? statsEngine.calculateSummary() : { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, completionRate30d: 0 };
      const stats = [
        { label: 'Current Streak', value: `${summary.currentStreak} Days`, sub: `Best: ${summary.longestStreak} days` },
        { label: 'Total Check-ins', value: `${summary.totalCheckIns}`, sub: 'Across all active habits' },
        { label: '30-Day Consistency', value: `${summary.completionRate30d}%`, sub: 'Rolling completion rate' }
      ];

      const statBoxW = (innerW - 56 - 28) / 3;
      const statBoxH = 68;

      stats.forEach((st, idx) => {
        const bx = contentX + idx * (statBoxW + 14);
        this.drawRoundedRect(ctx, bx, curY, statBoxW, statBoxH, 10);
        ctx.fillStyle = theme.statBoxBg;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = theme.border;
        ctx.stroke();

        ctx.font = '600 11px "Inter", sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(st.label, bx + 14, curY + 20);

        ctx.font = 'bold 18px "Plus Jakarta Sans", "Inter", sans-serif';
        ctx.fillStyle = theme.textMain;
        ctx.fillText(st.value, bx + 14, curY + 44);

        ctx.font = '500 10px "Inter", sans-serif';
        ctx.fillStyle = theme.textDim;
        ctx.fillText(st.sub, bx + 14, curY + 58);
      });

      // 4. Draw 52-Week Contribution Matrix
      curY += statBoxH + 34;

      const cellSize = 13;
      const cellGap = 4;
      const dayLabelW = 32;
      const habits = store.getHabits();
      const totalHabits = habits.length;

      // Generate Dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDayOfWeek = today.getDay();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + (6 - currentDayOfWeek));

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
      if (currentWeek.length > 0) weeks.push(currentWeek);

      // Draw Day Labels (Mon, Wed, Fri)
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = theme.textDim;
      ctx.fillText('Mon', contentX, curY + (1 * (cellSize + cellGap)) + cellSize - 2);
      ctx.fillText('Wed', contentX, curY + (3 * (cellSize + cellGap)) + cellSize - 2);
      ctx.fillText('Fri', contentX, curY + (5 * (cellSize + cellGap)) + cellSize - 2);

      // Draw Month Headers
      let lastMonth = -1;
      weeks.forEach((week, wIdx) => {
        const firstDay = week[0];
        const m = firstDay.getMonth();
        if (m !== lastMonth && wIdx < weeks.length - 1) {
          const monthName = firstDay.toLocaleString('en-US', { month: 'short' });
          const mx = contentX + dayLabelW + (wIdx * (cellSize + cellGap));
          ctx.fillText(monthName, mx, curY - 10);
          lastMonth = m;
        }
      });

      // Draw Matrix Cells
      weeks.forEach((week, colIdx) => {
        week.forEach((dObj, rowIdx) => {
          if (dObj > today) return;

          const dateStr = dObj.toISOString().split('T')[0];
          const logs = store.getLogsForDate(dateStr);

          let level = 0;
          if (totalHabits > 0 && logs.length > 0) {
            const ratio = logs.length / totalHabits;
            if (ratio <= 0.25) level = 1;
            else if (ratio <= 0.50) level = 2;
            else if (ratio <= 0.75) level = 3;
            else level = 4;
          }

          const cx = contentX + dayLabelW + colIdx * (cellSize + cellGap);
          const cy = curY + rowIdx * (cellSize + cellGap);

          this.drawRoundedRect(ctx, cx, cy, cellSize, cellSize, 2.5);
          ctx.fillStyle = theme.heatLevels[level];
          ctx.fill();
        });
      });

      // 5. Footer (Legend & Branding)
      const footerY = this.height - padding - 22;
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillStyle = theme.textDim;
      ctx.fillText('365-day rolling consistency • 100% offline & private', contentX, footerY);

      // Legend in Footer Right
      const legendX = this.width - padding - 180;
      ctx.fillText('Less', legendX - 30, footerY);
      theme.heatLevels.forEach((color, idx) => {
        this.drawRoundedRect(ctx, legendX + idx * 14, footerY - 9, 10, 10, 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
      ctx.fillText('More', legendX + 5 * 14 + 6, footerY);

      // 6. Download as PNG image
      const link = document.createElement('a');
      link.download = `habit-heatmap-card-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }

  window.HeatmapCardExporter = new HeatmapCardExporter();
})(window);
