# AGENTS.md - HabitHeatmap Quality Guidelines

## Visual & Functional Standards
1. **Cozy, Warm & Chill Aesthetics (Anti-AI-Slop)**:
   - Use warm organic palettes inspired by Mocha Latte, Terracotta Sunset, Matcha Wood, and Midnight Lofi Study.
   - Soft diffuse double-layer shadows, rounded pill shapes, and subtle glassmorphic frost.
   - NO neon gradients, NO loud glow effects, NO dark gaming UI.
   - NO emoji icons in buttons or labels — use clean SVG line icons only.
   - Colors must feel like a Japanese stationery shop or Scandinavian café, not a SaaS dashboard.

2. **Tactile & Interactive**:
   - Every click on a habit cell should feel satisfying with subtle scale + color transition.
   - Hover states should be warm and inviting, not harsh.
   - Smooth micro-animations on state changes (check/uncheck, streak counter).

3. **Typography**:
   - Use premium font pairing: Plus Jakarta Sans (headings) + Inter (body) + JetBrains Mono (numbers/stats).
   - No default system fonts visible anywhere.
   - Letter-spacing and line-height must be intentional and refined.

4. **Data Integrity**:
   - All habit data stored in localStorage with JSON export/import backup.
   - Zero server communication — 100% offline-capable.
   - No fake data, no placeholder stats. Everything the user sees is their real data.
