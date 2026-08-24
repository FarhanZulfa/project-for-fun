# AGENTS.md - KeyLab Quality Guidelines

## Visual & Functional Standards
1. **Premium Custom Keyboard Studio Aesthetics (Anti-AI-Slop)**:
   - Matte dual-tone keycaps (Vintage Cream White, Industrial Slate Charcoal, Warm Terracotta Accent Esc/Enter).
   - Realistic 3D keycap depression states (`translateY(3px)` + subtle bottom beveled shadow reduction on press).
   - Zero neon glow, zero cheap gaming gradients.
   - Clean SVG line icons only — no emojis in UI buttons.
   - Clean layout options: 75% Compact, 65% Slim, Tenkeyless (TKL).

2. **Web Audio Mechanical Sound Synthesizer**:
   - 100% synthetic sound generation via Web Audio API oscillators, noise buffers, and biquad filter envelopes.
   - Distinct switch profiles: Deep Thock (Tactile), Creamy Linear, Crisp Clicky (Double-click clickbar snap), Silent Dampened.
   - Realistic acoustic pitch scaling based on keycap mass (Spacebar = deep bass resonant bottom-out; Alphas = crisp clack; Enter/Backspace = distinct mid-thock).

3. **Typography**:
   - Plus Jakarta Sans for UI headers/controls.
   - JetBrains Mono for keycap legends, WPM metrics, and latency numbers.

4. **Testing Accuracy**:
   - Accurate NKRO (N-Key Rollover) simultaneous key tracking.
   - Real-time keystroke frequency heatmap mapping.
   - Millisecond keypress latency response measurement.
