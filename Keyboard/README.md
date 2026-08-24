# KeyLab ⌨️🔊

> Minimalist Mechanical Keyboard Studio, Real-Time Switch Sound Synthesizer, NKRO Ghosting Tester & WPM Speed Challenge.

![KeyLab Preview](https://raw.githubusercontent.com/username/keylab/main/preview.png)

---

## ✨ Features

- **Interactive 3D Mechanical Matrix**: Realistic keycap depression physics (`translateY` + beveled shadow compression) with support for ANSI 75% Compact and 65% Slim layouts.
- **Web Audio Mechanical Switch Synthesizer**: 100% synthetic sound engine (zero MP3 files, zero latency) offering:
  - 🪵 **Holy Panda (Deep Thock)**: Marbled, deep acoustic bottom-out resonance.
  - 🧈 **Oil King (Creamy Linear)**: Smooth, muffled linear clack.
  - ⚡ **Box Jade (Crisp Clicky)**: High-pitched double clickbar snap.
  - 🍃 **Silent Alpaca (Muted Dampened)**: Soft acoustic silence.
- **Dynamic Acoustic Pitch Scaling**: Distinct acoustic frequencies based on keycap mass (Spacebar features deep resonant bass; alphas offer snappy mid-clack).
- **Diagnostics & Testing Tools**:
  - **N-Key Rollover (NKRO)** simultaneous keypress tracking.
  - **Keystroke Frequency Heatmap Mode** to visualize hot keys.
  - **Keypress Response Latency** in milliseconds (ms).
- **Zen Typing & WPM Speed Challenge**: Monkeytype-inspired clean typing speed test with real-time WPM, accuracy %, raw CPM, and instant restart shortcuts.
- **Free Typewriter Acoustic Sandbox**: Freely write notes or code while enjoying tactile switch feedback.
- **Dual Studio Themes**: Dark Industrial CNC Aluminum & Light Cream Workshop.

---

## 🛠️ Built With

- **HTML5 & SVG** — Clean semantic markup and crisp vector line icons (no emojis in UI buttons).
- **Vanilla CSS3** — 3D keycap bevels, physics depressions, responsive layout tokens, and glassmorphism.
- **Vanilla JavaScript (ES6+)** — Decoupled object-oriented architecture (`SwitchSynthesizer`, `KeyboardTesterEngine`, `TypingChallengeEngine`).
- **Web Audio API** — Real-time oscillator, biquad filter, and noise buffer synthesis.

---

## 🚀 Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/FarhanZulfa/project-for-fun.git
   cd project-for-fun
   ```
2. Open `index.html` directly in any modern browser, or run a local server:
   ```bash
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` and start typing!

---

## 📄 License

MIT License. Crafted with passion for custom mechanical keyboard enthusiasts.
