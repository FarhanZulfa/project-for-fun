/* ==========================================================================
   KeyLab - Web Audio Mechanical Switch Synthesizer
   100% Synthetic Sound Synthesis (Zero MP3s, Zero Latency)
   ========================================================================== */

class SwitchSynthesizer {
  constructor() {
    this.ctx = null;
    this.currentProfile = 'holy_panda'; // 'holy_panda', 'oil_king', 'box_jade', 'silent_alpaca'
    this.volume = 0.8;
    this.isMuted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setProfile(profileId) {
    this.currentProfile = profileId;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // Play mechanical switch downstroke sound
  playDownstroke(keyCode) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const isSpace = keyCode === 'Space' || keyCode === 32;
    const isEnter = keyCode === 'Enter' || keyCode === 13;
    const isBackspace = keyCode === 'Backspace' || keyCode === 8;
    const isMod = isSpace || isEnter || isBackspace;

    // Pitch multiplier: Spacebar has deeper bass acoustic
    let pitchMod = 1.0 + (Math.random() * 0.08 - 0.04);
    if (isSpace) pitchMod = 0.62;
    else if (isEnter) pitchMod = 0.82;
    else if (isBackspace) pitchMod = 0.88;

    switch (this.currentProfile) {
      case 'holy_panda':
        this.synthDeepThock(now, pitchMod, isSpace);
        break;
      case 'oil_king':
        this.synthCreamyLinear(now, pitchMod, isSpace);
        break;
      case 'box_jade':
        this.synthCrispClicky(now, pitchMod, isSpace);
        break;
      case 'silent_alpaca':
        this.synthSilentDampened(now, pitchMod, isSpace);
        break;
      default:
        this.synthDeepThock(now, pitchMod, isSpace);
    }
  }

  // Play subtle keycap release upstroke
  playUpstroke(keyCode) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Subtle upstroke tick
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.04 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 1. Holy Panda / Boba U4T (Deep Marbled Thock)
  synthDeepThock(now, pitchMod, isSpace) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Deep woody body resonance
    osc.type = 'sine';
    const baseFreq = 210 * pitchMod;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65 * pitchMod, now + (isSpace ? 0.09 : 0.06));

    // Lowpass plate resonance
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSpace ? 850 : 1200, now);

    const amp = (isSpace ? 0.38 : 0.28) * this.volume;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSpace ? 0.12 : 0.08));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);

    // Subtle tactile friction burst
    this.createNoiseBurst(now, 1400, 0.08 * this.volume, 0.025);
  }

  // 2. Gateron Oil King / Ink Black (Creamy Muffled Linear)
  synthCreamyLinear(now, pitchMod, isSpace) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = 270 * pitchMod;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(90 * pitchMod, now + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    const amp = (isSpace ? 0.32 : 0.24) * this.volume;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);

    this.createNoiseBurst(now, 2200, 0.05 * this.volume, 0.018);
  }

  // 3. Kailh Box Jade (Crisp Clickbar Snap)
  synthCrispClicky(now, pitchMod, isSpace) {
    // 1st click snap (high frequency ping)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const clickFilter = this.ctx.createBiquadFilter();

    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2400 * pitchMod, now);
    clickOsc.frequency.exponentialRampToValueAtTime(700, now + 0.015);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(3200, now);
    clickFilter.Q.setValueAtTime(4.0, now);

    clickGain.gain.setValueAtTime(0.22 * this.volume, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.ctx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.03);

    // 2nd bottom-out thud slightly delayed
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(360 * pitchMod, now + 0.004);
    bodyOsc.frequency.exponentialRampToValueAtTime(110 * pitchMod, now + 0.06);

    bodyGain.gain.setValueAtTime(0.18 * this.volume, now + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);

    bodyOsc.start(now + 0.004);
    bodyOsc.stop(now + 0.08);
  }

  // 4. Silent Alpaca (Muted Dampened)
  synthSilentDampened(now, pitchMod, isSpace) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 * pitchMod, now);
    osc.frequency.exponentialRampToValueAtTime(50 * pitchMod, now + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const amp = 0.16 * this.volume;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Helper: White noise burst for tactile bottom-out texture
  createNoiseBurst(startTime, filterFreq, volume, duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(1.8, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration + 0.01);
  }
}

window.SwitchSynthesizer = SwitchSynthesizer;
