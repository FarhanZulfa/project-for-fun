/* ==========================================================================
   KeyLab - WPM Typing Challenge & Speed Measurement Engine
   Minimalist Typography, Real-Time WPM / Accuracy Tracking & Audio Feedback
   ========================================================================== */

const WORD_BANK = [
  'keyboard', 'switch', 'mechanical', 'linear', 'tactile', 'clicky', 'thock', 'clack',
  'aluminum', 'brass', 'gasket', 'plate', 'keycap', 'spring', 'lube', 'stabilizer',
  'typing', 'speed', 'accuracy', 'focus', 'design', 'custom', 'layout', 'spring',
  'system', 'code', 'minimal', 'studio', 'craft', 'sound', 'acoustic', 'smooth',
  'travel', 'bottom', 'housing', 'stem', 'copper', 'solder', 'hotswap', 'profile',
  'cherry', 'oem', 'artisan', 'silence', 'dampener', 'spacebar', 'matrix', 'rollover',
  'create', 'build', 'write', 'learn', 'stream', 'device', 'pure', 'fluid', 'tempo',
  'rhythm', 'motion', 'touch', 'finger', 'hands', 'flow', 'state', 'zen', 'quiet'
];

class TypingChallengeEngine {
  constructor(displayContainerId, synth) {
    this.container = document.getElementById(displayContainerId);
    this.synth = synth;

    this.duration = 30; // 15, 30, 60
    this.timeLeft = 30;
    this.isRunning = false;
    this.isFinished = false;
    this.timerInterval = null;

    this.words = [];
    this.currentWordIdx = 0;
    this.currentCharIdx = 0;
    this.typedHistory = []; // records all keypresses

    this.totalTypedChars = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.startTime = null;

    this.onTick = null;
    this.onFinish = null;

    this.init();
  }

  init() {
    this.reset();
  }

  setDuration(sec) {
    this.duration = sec;
    this.reset();
  }

  generateWords(count = 60) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const randIdx = Math.floor(Math.random() * WORD_BANK.length);
      list.push(WORD_BANK[randIdx]);
    }
    return list;
  }

  reset() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isFinished = false;
    this.timeLeft = this.duration;
    this.words = this.generateWords(80);
    this.currentWordIdx = 0;
    this.currentCharIdx = 0;
    this.totalTypedChars = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.startTime = null;
    this.typedHistory = [];

    this.render();
    if (this.onTick) this.onTick(this.getLiveMetrics());
  }

  render() {
    if (!this.container) return;

    let html = '';
    this.words.forEach((w, wIdx) => {
      const isCurrentWord = wIdx === this.currentWordIdx;
      html += `<div class="word" id="word_${wIdx}">`;
      for (let cIdx = 0; cIdx < w.length; cIdx++) {
        html += `<span class="char" id="char_${wIdx}_${cIdx}">${w[cIdx]}</span>`;
      }
      html += `</div>`;
    });

    this.container.innerHTML = `
      <div class="caret" id="typingCaret"></div>
      ${html}
    `;

    this.updateCaretPosition();
  }

  handleKeyPress(key, code) {
    if (this.isFinished) return;

    // Start timer on first keypress
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = performance.now();
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.finish();
        }
        if (this.onTick) this.onTick(this.getLiveMetrics());
      }, 1000);
    }

    const currentWord = this.words[this.currentWordIdx];
    if (!currentWord) return;

    // Handle Backspace
    if (key === 'Backspace') {
      if (this.currentCharIdx > 0) {
        this.currentCharIdx--;
        const charEl = document.getElementById(`char_${this.currentWordIdx}_${this.currentCharIdx}`);
        if (charEl) {
          if (charEl.classList.contains('correct')) this.correctChars--;
          if (charEl.classList.contains('incorrect')) this.incorrectChars--;
          charEl.classList.remove('correct', 'incorrect');
        }
        this.updateCaretPosition();
        if (this.onTick) this.onTick(this.getLiveMetrics());
      }
      return;
    }

    // Handle Spacebar (Advance to next word)
    if (key === ' ') {
      if (this.currentCharIdx > 0) {
        this.currentWordIdx++;
        this.currentCharIdx = 0;
        this.totalTypedChars++;
        this.correctChars++; // space counts as char

        // Scroll words display down if moving to new line
        this.checkScroll();
        this.updateCaretPosition();
        if (this.onTick) this.onTick(this.getLiveMetrics());
      }
      return;
    }

    // Single character input
    if (key.length === 1) {
      const targetChar = currentWord[this.currentCharIdx];
      const charEl = document.getElementById(`char_${this.currentWordIdx}_${this.currentCharIdx}`);

      this.totalTypedChars++;

      if (charEl) {
        if (key === targetChar) {
          charEl.classList.add('correct');
          this.correctChars++;
        } else {
          charEl.classList.add('incorrect');
          this.incorrectChars++;
        }
      }

      this.currentCharIdx++;

      // If finished word without space, wait for space
      this.updateCaretPosition();
      if (this.onTick) this.onTick(this.getLiveMetrics());
    }
  }

  updateCaretPosition() {
    const caret = document.getElementById('typingCaret');
    const targetCharEl = document.getElementById(`char_${this.currentWordIdx}_${this.currentCharIdx}`);
    const wordEl = document.getElementById(`word_${this.currentWordIdx}`);

    if (!caret) return;

    if (targetCharEl) {
      caret.style.left = `${targetCharEl.offsetLeft}px`;
      caret.style.top = `${targetCharEl.offsetTop}px`;
    } else if (wordEl) {
      caret.style.left = `${wordEl.offsetLeft + wordEl.offsetWidth}px`;
      caret.style.top = `${wordEl.offsetTop}px`;
    }
  }

  checkScroll() {
    const wordEl = document.getElementById(`word_${this.currentWordIdx}`);
    if (wordEl && this.container) {
      if (wordEl.offsetTop > 70) {
        this.container.scrollTop = wordEl.offsetTop - 30;
      }
    }
  }

  getLiveMetrics() {
    const elapsedSec = Math.max(1, this.duration - this.timeLeft);
    const elapsedMin = elapsedSec / 60;

    // Standard WPM: (all correct keystrokes / 5) / time in minutes
    const wpm = Math.round((this.correctChars / 5) / elapsedMin) || 0;
    const accuracy = this.totalTypedChars > 0
      ? Math.round((this.correctChars / this.totalTypedChars) * 100)
      : 100;
    const cpm = Math.round(this.correctChars / elapsedMin) || 0;

    return {
      wpm,
      accuracy,
      cpm,
      timeLeft: this.timeLeft,
      totalTyped: this.totalTypedChars,
      correctChars: this.correctChars,
      incorrectChars: this.incorrectChars
    };
  }

  finish() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isFinished = true;
    const finalMetrics = this.getLiveMetrics();

    if (this.onFinish) {
      this.onFinish(finalMetrics);
    }
  }
}

window.TypingChallengeEngine = TypingChallengeEngine;
