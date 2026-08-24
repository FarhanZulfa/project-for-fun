/* ==========================================================================
   HabitHeatmap - Main Application Orchestrator
   Tactile Micro-Interactions, Audio Feedback, Modal System & State Management
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.HabitStore;
  const statsEngine = new window.HabitStatsEngine(store);

  // Application State
  let currentDate = new Date();
  let selectedHabitId = 'all';
  let isMuted = localStorage.getItem('habit_heatmap_muted') === 'true';

  // DOM Elements
  const statsGrid = document.getElementById('statsGrid');
  const habitsGrid = document.getElementById('habitsChecklistGrid');
  const dateDisplayBtn = document.getElementById('dateDisplayBtn');
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnToday = document.getElementById('btnToday');
  const filterPillsContainer = document.getElementById('heatmapFilterPills');

  // Modals & Triggers
  const btnNewHabit = document.getElementById('btnNewHabit');
  const btnManageHabits = document.getElementById('btnManageHabits');
  const btnBackupRestore = document.getElementById('btnBackupRestore');
  const btnExportCard = document.getElementById('btnExportCard');
  const btnToggleTheme = document.getElementById('btnToggleTheme');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const inputDailyNote = document.getElementById('inputDailyNote');
  const noteSavedStatus = document.getElementById('noteSavedStatus');

  const modalAddHabit = document.getElementById('modalAddHabit');
  const modalManage = document.getElementById('modalManageHabits');
  const modalBackup = document.getElementById('modalBackup');

  // Heatmap Initializer
  const heatmap = new window.HeatmapRenderer(
    'heatmapContainer',
    'heatmapTooltip',
    store,
    (clickedDateStr) => {
      const [y, m, d] = clickedDateStr.split('-').map(Number);
      currentDate = new Date(y, m - 1, d);
      updateDateDisplay();
      renderChecklist();
      renderDailyNote();
      showToast(`Selected date: ${formatDateReadable(currentDate)}`);
    }
  );

  // =========================================================================
  // Web Audio Tactile Sound Effects (Pure Synthetic, zero MP3 dependencies)
  // =========================================================================
  const audioCtx = window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null;

  function playSoftChime(isCheck) {
    if (isMuted || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      const now = audioCtx.currentTime;

      if (isCheck) {
        // High, cheerful wooden bell chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      } else {
        // Subtle soft tap
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playFanfareChime() {
    if (isMuted || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = audioCtx.currentTime;

      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        const noteStart = now + i * 0.07;
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.14, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.38);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.42);
      });
    } catch (e) {
      // Audio fallback silent
    }
  }

  // =========================================================================
  // Date Helpers
  // =========================================================================
  function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateReadable(d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays === -1) return 'Yesterday, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays === 1) return 'Tomorrow, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function updateDateDisplay() {
    if (dateDisplayBtn) {
      dateDisplayBtn.textContent = formatDateReadable(currentDate);
    }
  }

  // =========================================================================
  // Renderers
  // =========================================================================
  function renderStats() {
    if (!statsGrid) return;
    const summary = statsEngine.calculateSummary();

    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-header">
          <span>Current Streak</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
        </div>
        <div class="stat-value">
          ${summary.currentStreak}
          <span class="stat-unit">days</span>
        </div>
        <div class="stat-subtext">Record: ${summary.longestStreak} days</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Total Check-ins</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        </div>
        <div class="stat-value">
          ${summary.totalCheckIns}
          <span class="stat-unit">ticks</span>
        </div>
        <div class="stat-subtext">Across all active habits</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>30-Day Completion</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-value">
          ${summary.completionRate30d}
          <span class="stat-unit">%</span>
        </div>
        <div class="stat-subtext">Last 30 days consistency</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Today's Progress</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
        <div class="stat-value">
          ${summary.todayDone}/${summary.todayTotal}
          <span class="stat-unit">done</span>
        </div>
        <div class="stat-subtext">${summary.todayTotal > 0 ? Math.round((summary.todayDone / summary.todayTotal) * 100) : 0}% completed today</div>
      </div>
    `;
  }

  function renderChecklist() {
    if (!habitsGrid) return;
    const habits = store.getHabits();
    const dateKey = formatDateKey(currentDate);
    const completedIds = store.getLogsForDate(dateKey);

    if (habits.length === 0) {
      habitsGrid.innerHTML = `
        <div class="empty-habits-notice">
          <p style="font-weight:600; font-size:0.95rem; margin-bottom:0.4rem;">No active habits yet</p>
          <p style="font-size:0.82rem; margin-bottom:1rem;">Click "New Habit" above to start building your daily routine.</p>
          <button class="btn btn-primary" onclick="document.getElementById('btnNewHabit').click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add First Habit
          </button>
        </div>
      `;
      return;
    }

    habitsGrid.innerHTML = habits.map(h => {
      const isDone = completedIds.includes(h.id);
      const streak = statsEngine.calculateHabitStreak(h.id);
      const completedClass = isDone ? 'completed' : '';

      return `
        <div class="habit-card ${completedClass}" data-habit-id="${h.id}">
          <div class="habit-card-left">
            <span class="habit-color-indicator" style="background:${h.color}"></span>
            <div class="habit-details">
              <span class="habit-name">${escapeHtml(h.name)}</span>
              <span class="habit-streak-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                ${streak} day streak
              </span>
            </div>
          </div>
          <div class="check-trigger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    habitsGrid.querySelectorAll('.habit-card').forEach(card => {
      card.addEventListener('click', () => {
        const hid = card.dataset.habitId;
        const willBeDone = !card.classList.contains('completed');

        // Check if this action will complete 100% of all habits for this date
        const allHabits = store.getHabits();
        const currentLogs = store.getLogsForDate(dateKey);
        const willBeFull = willBeDone && (currentLogs.length + 1 >= allHabits.length) && !currentLogs.includes(hid) && allHabits.length > 0;

        if (willBeFull) {
          playFanfareChime();
          if (window.ConfettiCelebration) {
            window.ConfettiCelebration.fire();
          }
          showToast('Perfect Day! All habits completed!', 'celebrate');
        } else {
          playSoftChime(willBeDone);
        }

        store.toggleHabitLog(dateKey, hid);
      });
    });
  }

  function renderFilterPills() {
    if (!filterPillsContainer) return;
    const habits = store.getHabits();

    let html = `
      <button class="filter-pill ${selectedHabitId === 'all' ? 'active' : ''}" data-filter="all">
        All Habits (Master)
      </button>
    `;

    habits.forEach(h => {
      const active = selectedHabitId === h.id ? 'active' : '';
      html += `
        <button class="filter-pill ${active}" data-filter="${h.id}">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${h.color}; margin-right:4px;"></span>
          ${escapeHtml(h.name)}
        </button>
      `;
    });

    filterPillsContainer.innerHTML = html;

    filterPillsContainer.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedHabitId = btn.dataset.filter;
        renderFilterPills();
        heatmap.setHabitFilter(selectedHabitId);
      });
    });
  }

  function renderManageHabitsList() {
    const list = document.getElementById('manageHabitsList');
    if (!list) return;
    const habits = store.getHabits();

    if (habits.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.84rem;">No habits found.</div>`;
      return;
    }

    list.innerHTML = habits.map(h => `
      <div class="manage-habit-item">
        <div class="manage-habit-info">
          <span class="habit-color-indicator" style="background:${h.color}"></span>
          <span style="font-weight:600; font-size:0.86rem;">${escapeHtml(h.name)}</span>
        </div>
        <button class="btn btn-sm" style="color:var(--accent-terracotta);" data-delete-id="${h.id}" title="Delete Habit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `).join('');

    list.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hid = btn.dataset.deleteId;
        const habit = store.getHabitById(hid);

        if (!btn.dataset.confirming) {
          btn.dataset.confirming = 'true';
          btn.style.color = '#FFFFFF';
          btn.style.background = 'var(--accent-terracotta)';
          btn.style.borderColor = 'var(--accent-terracotta)';
          btn.innerHTML = `<span style="font-size:0.72rem; font-weight:700; padding:0 4px;">Delete?</span>`;

          setTimeout(() => {
            if (btn && btn.dataset.confirming) {
              delete btn.dataset.confirming;
              btn.style.color = 'var(--accent-terracotta)';
              btn.style.background = '';
              btn.style.borderColor = '';
              btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            }
          }, 3500);
          return;
        }

        delete btn.dataset.confirming;
        store.deleteHabit(hid);
        renderManageHabitsList();
        showToast(`Habit "${habit ? habit.name : ''}" deleted`);
      });
    });
  }

  // =========================================================================
  // Daily Reflection Note
  // =========================================================================
  function renderDailyNote() {
    if (!inputDailyNote) return;
    const dateKey = formatDateKey(currentDate);
    inputDailyNote.value = store.getNoteForDate(dateKey);
  }

  let noteDebounce = null;
  if (inputDailyNote) {
    inputDailyNote.addEventListener('input', () => {
      clearTimeout(noteDebounce);
      noteDebounce = setTimeout(() => {
        const dateKey = formatDateKey(currentDate);
        store.setNoteForDate(dateKey, inputDailyNote.value);
        if (noteSavedStatus) {
          noteSavedStatus.textContent = 'Saved ✓';
          noteSavedStatus.classList.add('visible');
          setTimeout(() => noteSavedStatus.classList.remove('visible'), 1600);
        }
      }, 300);
    });
  }

  // =========================================================================
  // Date Navigation Events
  // =========================================================================
  const nativeDatePicker = document.getElementById('nativeDatePicker');
  if (dateDisplayBtn && nativeDatePicker) {
    dateDisplayBtn.addEventListener('click', () => {
      try {
        nativeDatePicker.value = formatDateKey(currentDate);
        if (typeof nativeDatePicker.showPicker === 'function') {
          nativeDatePicker.showPicker();
        } else {
          nativeDatePicker.click();
        }
      } catch (err) {
        // Fallback silent
      }
    });

    nativeDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        const [y, m, d] = e.target.value.split('-').map(Number);
        currentDate = new Date(y, m - 1, d);
        updateDateDisplay();
        renderChecklist();
        renderDailyNote();
        showToast(`Jumped to ${formatDateReadable(currentDate)}`);
      }
    });
  }

  if (btnPrevDay) {
    btnPrevDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDateDisplay();
      renderChecklist();
      renderDailyNote();
    });
  }

  if (btnNextDay) {
    btnNextDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDateDisplay();
      renderChecklist();
      renderDailyNote();
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      currentDate = new Date();
      updateDateDisplay();
      renderChecklist();
      renderDailyNote();
    });
  }

  // =========================================================================
  // Modal Handlers
  // =========================================================================
  function openModal(m) {
    if (m) m.classList.add('active');
  }

  function closeModal(m) {
    if (m) m.classList.remove('active');
  }

  // Close when clicking outside modal card or close buttons
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      closeModal(modal);
    });
  });

  const modalMobileMenu = document.getElementById('modalMobileMenu');
  const btnOpenMobileMenu = document.getElementById('btnOpenMobileMenu');
  const btnMobileManage = document.getElementById('btnMobileManage');
  const btnMobileExport = document.getElementById('btnMobileExport');
  const btnMobileBackupTrigger = document.getElementById('btnMobileBackupTrigger');

  if (btnOpenMobileMenu) {
    btnOpenMobileMenu.addEventListener('click', () => {
      openModal(modalMobileMenu);
    });
  }

  if (btnMobileManage) {
    btnMobileManage.addEventListener('click', () => {
      closeModal(modalMobileMenu);
      renderManageHabitsList();
      openModal(modalManage);
    });
  }

  if (btnMobileExport) {
    btnMobileExport.addEventListener('click', () => {
      closeModal(modalMobileMenu);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (window.HeatmapCardExporter) {
        window.HeatmapCardExporter.exportCard(store, statsEngine, isDark);
        showToast('Heatmap Share Card downloaded!', 'camera');
      }
    });
  }

  if (btnMobileBackupTrigger) {
    btnMobileBackupTrigger.addEventListener('click', () => {
      closeModal(modalMobileMenu);
      openModal(modalBackup);
    });
  }

  // Mobile Bottom Tab Bar Section Smooth Scrolling
  document.querySelectorAll('.mobile-nav-item[data-nav-target]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mobile-nav-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.dataset.navTarget;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (btnNewHabit) {
    btnNewHabit.addEventListener('click', () => {
      document.getElementById('inputHabitName').value = '';
      openModal(modalAddHabit);
    });
  }

  if (btnManageHabits) {
    btnManageHabits.addEventListener('click', () => {
      renderManageHabitsList();
      openModal(modalManage);
    });
  }

  if (btnBackupRestore) {
    btnBackupRestore.addEventListener('click', () => {
      openModal(modalBackup);
    });
  }

  // Color Swatches in Add Habit Modal
  let selectedColor = '#4F7C53';
  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  // Submit Add Habit
  const formAddHabit = document.getElementById('formAddHabit');
  if (formAddHabit) {
    formAddHabit.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('inputHabitName').value.trim();
      if (!name) return;

      store.addHabit(name, selectedColor);
      closeModal(modalAddHabit);
      showToast(`Added habit: ${name}`);
    });
  }

  // Backup & Restore Actions
  const btnExportJSON = document.getElementById('btnExportJSON');
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      store.exportBackup();
      showToast('Backup JSON downloaded');
    });
  }

  const fileImportJSON = document.getElementById('fileImportJSON');
  if (fileImportJSON) {
    fileImportJSON.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = store.importBackup(event.target.result);
        if (result.success) {
          closeModal(modalBackup);
          showToast(`Successfully restored ${result.count} habits!`, 'success');
        } else {
          showToast('Import failed: ' + result.error, 'info');
        }
      };
      reader.readAsText(file);
    });
  }

  const btnResetDefaultData = document.getElementById('btnResetDefaultData');
  if (btnResetDefaultData) {
    btnResetDefaultData.addEventListener('click', () => {
      if (!btnResetDefaultData.dataset.confirming) {
        btnResetDefaultData.dataset.confirming = 'true';
        btnResetDefaultData.textContent = 'Click again to confirm Reset';
        btnResetDefaultData.style.color = 'var(--accent-amber)';
        setTimeout(() => {
          if (btnResetDefaultData && btnResetDefaultData.dataset.confirming) {
            delete btnResetDefaultData.dataset.confirming;
            btnResetDefaultData.textContent = 'Reset Sample Habits';
            btnResetDefaultData.style.color = '';
          }
        }, 3500);
        return;
      }

      delete btnResetDefaultData.dataset.confirming;
      btnResetDefaultData.textContent = 'Reset Sample Habits';
      btnResetDefaultData.style.color = '';
      store.resetToDefault();
      closeModal(modalBackup);
      showToast('Reset to default habits', 'success');
    });
  }

  const btnClearAllData = document.getElementById('btnClearAllData');
  if (btnClearAllData) {
    btnClearAllData.addEventListener('click', () => {
      if (!btnClearAllData.dataset.confirming) {
        btnClearAllData.dataset.confirming = 'true';
        btnClearAllData.textContent = 'Click again to WIPE ALL DATA';
        btnClearAllData.style.color = '#FFFFFF';
        btnClearAllData.style.background = 'var(--accent-terracotta)';
        setTimeout(() => {
          if (btnClearAllData && btnClearAllData.dataset.confirming) {
            delete btnClearAllData.dataset.confirming;
            btnClearAllData.textContent = 'Wipe All Data';
            btnClearAllData.style.color = 'var(--accent-terracotta)';
            btnClearAllData.style.background = '';
          }
        }, 3500);
        return;
      }

      delete btnClearAllData.dataset.confirming;
      btnClearAllData.textContent = 'Wipe All Data';
      btnClearAllData.style.color = 'var(--accent-terracotta)';
      btnClearAllData.style.background = '';
      store.clearAll();
      closeModal(modalBackup);
      showToast('All habit data cleared', 'success');
    });
  }

  // =========================================================================
  // Theme & Audio Controls
  // =========================================================================
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (btnToggleTheme) btnToggleTheme.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (btnToggleTheme) btnToggleTheme.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  const savedTheme = localStorage.getItem('habit_heatmap_theme') || 'light';
  applyTheme(savedTheme);

  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      localStorage.setItem('habit_heatmap_theme', newTheme);
      applyTheme(newTheme);
      heatmap.render();
      showToast(`Switched to ${newTheme} mode`);
    });
  }

  if (btnToggleSound) {
    const updateSoundBtn = () => {
      btnToggleSound.style.opacity = isMuted ? '0.5' : '1';
      btnToggleSound.title = isMuted ? 'Audio Feedback Muted' : 'Audio Feedback Enabled';
    };
    updateSoundBtn();

    btnToggleSound.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem('habit_heatmap_muted', isMuted);
      updateSoundBtn();
      showToast(isMuted ? 'Sound effects muted' : 'Sound effects enabled');
    });
  }

  if (btnExportCard) {
    btnExportCard.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (window.HeatmapCardExporter) {
        window.HeatmapCardExporter.exportCard(store, statsEngine, isDark);
        showToast('Heatmap Share Card downloaded!', 'camera');
      }
    });
  }

  // =========================================================================
  // Toast Utility (High-Craft Tactile Notifications)
  // =========================================================================
  const toastContainer = document.getElementById('toastContainer');
  function showToast(msg, type = 'info') {
    if (!toastContainer) return;

    let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    let toastClass = 'toast-info';

    if (type === 'celebrate' || msg.includes('Perfect Day') || msg.includes('completed')) {
      toastClass = 'toast-celebrate';
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
    } else if (type === 'camera' || msg.includes('downloaded')) {
      toastClass = 'toast-celebrate';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>';
    } else if (type === 'success' || msg.includes('Saved') || msg.includes('switched') || msg.includes('deleted') || msg.includes('Habit')) {
      toastClass = 'toast-success';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }

    const toast = document.createElement('div');
    toast.className = `toast ${toastClass}`;
    toast.innerHTML = `
      <div class="toast-icon-badge">${iconSvg}</div>
      <div class="toast-body">${escapeHtml(msg)}</div>
      <div class="toast-progress"></div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 2600);
  }
  window.showToast = showToast;

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // =========================================================================
  // Store Subscriptions & Initial Paint
  // =========================================================================
  store.subscribe(() => {
    renderStats();
    renderChecklist();
    renderDailyNote();
    renderFilterPills();
    heatmap.render();
  });

  // Initial Paint
  updateDateDisplay();
  renderStats();
  renderChecklist();
  renderDailyNote();
  renderFilterPills();
  heatmap.render();

  // On mobile screens, auto-scroll heatmap to the latest weeks (right edge)
  setTimeout(() => {
    const hmContainer = document.getElementById('heatmapContainer');
    if (hmContainer && window.innerWidth <= 768) {
      hmContainer.scrollLeft = hmContainer.scrollWidth;
    }
  }, 100);

  // =========================================================================
  // Service Worker Registration for Mobile PWA Offline Support
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    });
  }
});
