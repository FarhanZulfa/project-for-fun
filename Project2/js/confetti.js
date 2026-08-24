/* ==========================================================================
   HabitHeatmap - Canvas Confetti Celebration Engine
   Pure lightweight, zero-dependency celebration particles for 100% completed days
   ========================================================================== */

(function(window) {
  'use strict';

  class ConfettiCelebration {
    constructor() {
      this.colors = [
        '#4F7C53', '#72B868', '#C97A3E', '#B8533E',
        '#4A5B78', '#7A4B6E', '#E5A93C', '#39D353'
      ];
      this.activeAnimation = null;
    }

    fire() {
      // Cancel previous if running
      if (this.activeAnimation) {
        cancelAnimationFrame(this.activeAnimation);
        this.activeAnimation = null;
      }

      // Remove existing canvas if any
      const oldCanvas = document.getElementById('confettiCanvas');
      if (oldCanvas) oldCanvas.remove();

      const canvas = document.createElement('canvas');
      canvas.id = 'confettiCanvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      const resize = () => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
      };
      resize();

      const particles = [];
      const count = 75;

      // Spawn particles from center-bottom bursting upward
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.7;

      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; // upward arc
        const speed = 10 + Math.random() * 16;

        particles.push({
          x: startX + (Math.random() - 0.5) * 60,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 8 + Math.random() * 8,
          h: 5 + Math.random() * 6,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          gravity: 0.38 + Math.random() * 0.15,
          drag: 0.965
        });
      }

      let startTime = performance.now();
      const duration = 2400; // 2.4 seconds

      const render = (now) => {
        const elapsed = now - startTime;
        if (elapsed > duration || particles.length === 0) {
          canvas.remove();
          this.activeAnimation = null;
          return;
        }

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          // Fade out near end of life
          if (elapsed > duration * 0.65) {
            p.opacity = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35));
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.scale(Math.cos((p.rotation * Math.PI) / 90), 1); // 3D flip effect

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }

        this.activeAnimation = requestAnimationFrame(render);
      };

      this.activeAnimation = requestAnimationFrame(render);
    }
  }

  window.ConfettiCelebration = new ConfettiCelebration();
})(window);
