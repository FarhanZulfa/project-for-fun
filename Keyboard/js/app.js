/* ==========================================================================
   KeyLab - Main Application Orchestrator
   Real 3D Three.js Model, Anime.js Springs & Sound Synthesis Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Switch Synthesizer Engine
  const synth = new window.SwitchSynthesizer();

  // 2. Initialize Real 3D Mechanical Keyboard Engine (Three.js + Anime.js)
  const keyboard3d = new window.Keyboard3DEngine('keyboard3dCanvas', synth);

  // 3. Initialize 2D Keyboard Tester Engine (Matrix fallback & tracking)
  const keyboard2d = new window.KeyboardTesterEngine('keyboardPlate', synth);

  // 4. Initialize WPM Typing Challenge Engine
  const typing = new window.TypingChallengeEngine('typingWordsBox', synth);

  // DOM Elements
  const modeTabs = document.querySelectorAll('.mode-tab-btn');
  const viewTester = document.getElementById('viewTester');
  const viewTyping = document.getElementById('viewTyping');
  const viewSoundboard = document.getElementById('viewSoundboard');

  let activeMode = 'tester'; // 'tester', 'typing', 'soundboard'

  // Metric Displays
  const metricActiveKeys = document.getElementById('metricActiveKeys');
  const metricMaxNkro = document.getElementById('metricMaxNkro');
  const metricTestedKeys = document.getElementById('metricTestedKeys');
  const metricLatency = document.getElementById('metricLatency');

  // Switch Profiles Bar
  const switchCards = document.querySelectorAll('.switch-card');
  const volumeSlider = document.getElementById('volumeSlider');
  const btnToggleMute = document.getElementById('btnToggleMute');

  // Mode Tabs Switching
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeMode = tab.dataset.mode;

      if (viewTester) viewTester.style.display = activeMode === 'tester' ? 'flex' : 'none';
      if (viewTyping) viewTyping.style.display = activeMode === 'typing' ? 'flex' : 'none';
      if (viewSoundboard) viewSoundboard.style.display = activeMode === 'soundboard' ? 'flex' : 'none';

      if (activeMode === 'typing') {
        typing.reset();
        focusTypingInput();
      }

      if (activeMode === 'tester') {
        keyboard3d.handleResize();
      }
    });
  });

  // Switch Profile Selection with Anime.js bounce
  switchCards.forEach(card => {
    card.addEventListener('click', () => {
      switchCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const profile = card.dataset.switch;
      synth.setProfile(profile);

      // Anime.js card micro-bounce
      if (typeof anime !== 'undefined') {
        anime({
          targets: card,
          scale: [0.94, 1],
          duration: 200,
          easing: 'easeOutBack'
        });
      }

      // Play test sound
      synth.playDownstroke('KeyA');
      setTimeout(() => synth.playUpstroke('KeyA'), 60);

      showToast(`Acoustic Switch: ${card.querySelector('span:last-child').textContent}`);
    });
  });

  // Volume & Audio Controls
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      synth.setVolume(vol);
    });
  }

  let isMuted = false;
  if (btnToggleMute) {
    btnToggleMute.addEventListener('click', () => {
      isMuted = !isMuted;
      synth.setMuted(isMuted);
      btnToggleMute.style.opacity = isMuted ? '0.45' : '1';
      showToast(isMuted ? 'Sound synthesizer muted' : 'Sound synthesizer active');
    });
  }

  // View Switcher (3D Model vs 2D Flat Matrix)
  const btnView3D = document.getElementById('btnView3D');
  const btnView2D = document.getElementById('btnView2D');
  const viewport3D = document.getElementById('viewport3D');
  const container2D = document.getElementById('container2D');

  if (btnView3D && btnView2D) {
    btnView3D.addEventListener('click', () => {
      btnView3D.classList.add('active');
      btnView2D.classList.remove('active');
      if (viewport3D) viewport3D.style.display = 'flex';
      if (container2D) container2D.style.display = 'none';
      keyboard3d.handleResize();
      showToast('Switched to Real 3D Studio Model');
    });

    btnView2D.addEventListener('click', () => {
      btnView2D.classList.add('active');
      btnView3D.classList.remove('active');
      if (viewport3D) viewport3D.style.display = 'none';
      if (container2D) container2D.style.display = 'inline-block';
      showToast('Switched to 2D Matrix View');
    });
  }

  // 3D Camera Reset Button
  const btnResetCamera3D = document.getElementById('btnResetCamera3D');
  if (btnResetCamera3D) {
    btnResetCamera3D.addEventListener('click', () => {
      keyboard3d.resetCameraAngle();
      showToast('3D Camera angle reset');
    });
  }

  // Keyboard Layout Selector (Syncs both 3D & 2D)
  const layoutBtns = document.querySelectorAll('.layout-opt-btn');
  layoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      layoutBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layout = btn.dataset.layout;
      keyboard3d.setLayout(layout);
      keyboard2d.setLayout(layout);
      showToast(`Keyboard Layout: ${btn.textContent}`);
    });
  });

  // Initialize metrics display on startup
  keyboard2d.notifyMetrics();

  // Heatmap & Reset Buttons
  const btnToggleHeatmap = document.getElementById('btnToggleHeatmap');
  let heatmapActive = false;
  if (btnToggleHeatmap) {
    btnToggleHeatmap.addEventListener('click', () => {
      heatmapActive = !heatmapActive;
      keyboard2d.toggleHeatmapMode(heatmapActive);
      btnToggleHeatmap.classList.toggle('active', heatmapActive);
      showToast(heatmapActive ? 'Heatmap frequency mode ON' : 'Heatmap mode OFF');
    });
  }

  const btnResetTester = document.getElementById('btnResetTester');
  if (btnResetTester) {
    btnResetTester.addEventListener('click', () => {
      keyboard2d.resetTester();
      showToast('Tester memory cleared');
    });
  }

  // Sync Global Keyboard Events with 3D Model
  window.addEventListener('keydown', (e) => {
    keyboard3d.pressKey3D(e.code);
  });

  window.addEventListener('keyup', (e) => {
    keyboard3d.releaseKey3D(e.code);
  });

  // Live Metrics Update from Keyboard Tester with Anime.js
  keyboard2d.onMetricsChange = (metrics) => {
    if (metricActiveKeys) metricActiveKeys.textContent = metrics.activeCount;
    if (metricMaxNkro) metricMaxNkro.textContent = `${metrics.maxSimultaneous} keys`;
    if (metricTestedKeys) metricTestedKeys.textContent = `${metrics.testedCount}/${metrics.totalKeys}`;
    if (metricLatency) metricLatency.textContent = metrics.avgLatency > 0 ? `${metrics.avgLatency}ms` : '--';
  };

  // =========================================================================
  // WPM Typing Mode Handlers
  // =========================================================================
  const liveWpm = document.getElementById('liveWpm');
  const liveAcc = document.getElementById('liveAcc');
  const liveTimer = document.getElementById('liveTimer');
  const typingWordsBox = document.getElementById('typingWordsBox');
  const durationPills = document.querySelectorAll('.duration-pill');
  const btnRestartTyping = document.getElementById('btnRestartTyping');
  const typingResultModal = document.getElementById('typingResultModal');

  durationPills.forEach(pill => {
    pill.addEventListener('click', () => {
      durationPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const sec = parseInt(pill.dataset.sec, 10);
      typing.setDuration(sec);
      focusTypingInput();
    });
  });

  if (btnRestartTyping) {
    btnRestartTyping.addEventListener('click', () => {
      typing.reset();
      focusTypingInput();
    });
  }

  // Live WPM ticking
  typing.onTick = (metrics) => {
    if (liveWpm) liveWpm.textContent = metrics.wpm;
    if (liveAcc) liveAcc.textContent = `${metrics.accuracy}%`;
    if (liveTimer) liveTimer.textContent = `${metrics.timeLeft}s`;
  };

  typing.onFinish = (metrics) => {
    showTypingResult(metrics);
  };

  function showTypingResult(m) {
    if (typingResultModal) {
      document.getElementById('resWpm').textContent = m.wpm;
      document.getElementById('resAcc').textContent = `${m.accuracy}%`;
      document.getElementById('resCpm').textContent = m.cpm;
      document.getElementById('resChars').textContent = `${m.correctChars}/${m.totalTyped}`;
      typingResultModal.classList.add('active');

      // Anime.js number counter popup
      if (typeof anime !== 'undefined') {
        anime({
          targets: '#resWpm',
          innerHTML: [0, m.wpm],
          round: 1,
          duration: 900,
          easing: 'easeOutExpo'
        });
      }
    }
  }

  function focusTypingInput() {
    if (typingWordsBox) {
      typingWordsBox.focus();
    }
  }

  if (typingWordsBox) {
    typingWordsBox.tabIndex = 0;
    typingWordsBox.addEventListener('keydown', (e) => {
      if (activeMode !== 'typing') return;

      // Restart shortcut: Tab + Enter
      if (e.key === 'Tab') {
        e.preventDefault();
        typing.reset();
        return;
      }

      if (e.key === ' ' || e.key === 'Backspace' || e.key.length === 1) {
        e.preventDefault();
        synth.playDownstroke(e.code);
        typing.handleKeyPress(e.key, e.code);
      }
    });

    typingWordsBox.addEventListener('keyup', (e) => {
      if (activeMode === 'typing') {
        synth.playUpstroke(e.code);
      }
    });
  }

  // =========================================================================
  // Free Soundboard Typewriter Canvas
  // =========================================================================
  const soundboardTextarea = document.getElementById('soundboardTextarea');
  const soundboardCharCount = document.getElementById('soundboardCharCount');
  const soundboardWordCount = document.getElementById('soundboardWordCount');

  if (soundboardTextarea) {
    soundboardTextarea.addEventListener('keydown', (e) => {
      synth.playDownstroke(e.code);
    });

    soundboardTextarea.addEventListener('keyup', (e) => {
      synth.playUpstroke(e.code);
      const text = soundboardTextarea.value;
      if (soundboardCharCount) soundboardCharCount.textContent = text.length;
      if (soundboardWordCount) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        soundboardWordCount.textContent = words;
      }
    });
  }

  // =========================================================================
  // Theme Toggle (Dark Aluminum vs Light Studio)
  // =========================================================================
  const btnToggleTheme = document.getElementById('btnToggleTheme');
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (btnToggleTheme) btnToggleTheme.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      if (keyboard3d.materials.case) {
        keyboard3d.materials.case.color.setHex(0xE6E0D4);
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (btnToggleTheme) btnToggleTheme.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      if (keyboard3d.materials.case) {
        keyboard3d.materials.case.color.setHex(0x1E1B18);
      }
    }
  }

  const savedTheme = localStorage.getItem('keylab_theme') || 'dark';
  applyTheme(savedTheme);

  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const nextTheme = isLight ? 'dark' : 'light';
      localStorage.setItem('keylab_theme', nextTheme);
      applyTheme(nextTheme);
      showToast(`Switched to ${nextTheme} studio theme`);
    });
  }

  // Toast System with Anime.js
  const toastContainer = document.getElementById('toastContainer');
  function showToast(msg) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }
  window.showToast = showToast;

  // Modal Backdrop Closer
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(b => {
    b.addEventListener('click', () => {
      const m = b.closest('.modal-backdrop');
      if (m) m.classList.remove('active');
    });
  });

  // Initial feedback
  showToast('KeyLab 3D Studio Ready · Click & drag to rotate keyboard');
});
