/**
 * assets/js/engine.js — PIXELRIFT Core Engine
 * Standardizes high-DPI scaling, fixed-timestep physics, and state management.
 */

export class PixelRiftEngine {
  constructor(canvasId, gameId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gameId = gameId;
    this.lsKey = `pixelrift-${gameId}-best`;
    
    // State
    this.score = 0;
    this.best = parseInt(localStorage.getItem(this.lsKey) || '0', 10);
    this.running = false;
    
    // Timing (Fixed Timestep)
    this.lastTime = 0;
    this.accumulator = 0;
    this.TIME_STEP = 1000 / 60; // Target 60 FPS logic
    
    // Dimensions
    this.W = 0;
    this.H = 0;
    
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Scale canvas buffer
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Keep CSS size consistent
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    this.ctx.scale(dpr, dpr);
    
    this.W = rect.width;
    this.H = rect.height;
    
    // User Hook
    if (this.onResize) this.onResize(this.W, this.H);
  }

  saveScore(score) {
    if (score > this.best) {
      this.best = score;
      localStorage.setItem(this.lsKey, this.best);
      const bestEl = document.getElementById('best-display');
      const overBestEl = document.getElementById('overlay-best');
      if (bestEl) bestEl.textContent = this.best;
      if (overBestEl) overBestEl.textContent = this.best;
    }
  }

  updateScore(score) {
    this.score = score;
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = this.score;
  }

  // Core Loop Wrapper
  start(updateFn, drawFn) {
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    const loop = (timestamp) => {
      if (!this.running) return;
      
      let dt = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      // Prevent "spiral of death" during lag or backgrounding
      if (dt > 250) dt = 250;
      
      this.accumulator += dt;
      
      while (this.accumulator >= this.TIME_STEP) {
        updateFn(this.TIME_STEP);
        this.accumulator -= this.TIME_STEP;
      }
      
      drawFn();
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }
}
