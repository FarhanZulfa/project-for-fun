# HabitHeatmap 🟩

> Minimalist, tactile, and aesthetic life habit tracker featuring **GitHub-style 52-week contribution heatmaps**, streak analytics, and 100% client-side offline privacy.

![HabitHeatmap Preview](https://raw.githubusercontent.com/username/habit-heatmap/main/preview.png)

---

## ✨ Features

- **GitHub-Style Contribution Heatmap**: Visualizes a full 52-week (365-day) rolling matrix of your daily consistency with dynamic forest-green intensity tiers.
- **Per-Habit & Master Filters**: Switch between the Master combined heatmap or inspect individual habit heatmaps with custom stationery palette colors.
- **Tactile Daily Check-ins**: Smooth micro-animations with subtle scale bounces and synthetic Web Audio wooden chime sounds on completion.
- **Time Machine History Navigation**: Click on any square in the heatmap or use the date navigator to inspect and edit check-ins for past days.
- **Precision Streak Engine**: Calculates current streaks, all-time record streaks, 30-day consistency rate, and total check-ins with zero lag.
- **Curated Anti-AI-Slop Aesthetics**: Inspired by Japanese stationery shops (Kyoto paper & ink) and Scandinavian study cafes.
- **Midnight Lofi Dark Mode**: Comfortable warm dark theme designed for late-night reflection and journaling.
- **100% Privacy & Zero Server Dependencies**: All data is stored locally in your browser's `localStorage` with full JSON Export & Import backup support.

---

## 🛠️ Built With

- **HTML5 & SVG** — Clean, semantic structure with vector line icons (no emojis in UI controls).
- **Vanilla CSS (No frameworks)** — Custom design tokens, glassmorphism tooltips, soft double-layer diffuse shadows, and responsive grid layouts.
- **Vanilla JavaScript (ES6+ Modules)** — Object-oriented architecture with decoupled Store, Stats, and SVG Heatmap rendering engines.
- **Web Audio API** — Real-time synthesized sine wave chimes for tactile feedback without audio asset loading.

---

## 🚀 Getting Started

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/habit-heatmap.git
   cd habit-heatmap
   ```
2. Open `index.html` directly in any modern browser, or run a lightweight local server:
   ```bash
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your browser.

---

## 📄 License

MIT License. Designed with care for daily habit builders.
