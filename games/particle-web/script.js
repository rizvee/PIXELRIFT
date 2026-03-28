import { PixelRiftEngine } from '../../assets/js/engine.js';

const engine = new PixelRiftEngine('game-canvas', 'particle-web');
const ctx = engine.ctx;

const MAX_DIST = 140;
const N_PARTICLES = 120;
const mouse = { x: -9999, y: -9999 };

let particles = [];

class Particle {
  constructor(x, y) {
    this.x  = x  ?? Math.random() * engine.W;
    this.y  = y  ?? Math.random() * engine.H;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.r  = 2 + Math.random() * 2;
    this.hue = Math.random() * 60 + 170; // cyan-blue range
  }

  update() {
    // Mouse repulsion
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 10000 && distSq > 0) {
      const dist = Math.sqrt(distSq);
      const force = (100 - dist) / 100;
      this.vx += (dx / dist) * force * 0.6;
      this.vy += (dy / dist) * force * 0.6;
    }

    this.vx *= 0.99;
    this.vy *= 0.99;

    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > 9) {
      const spd = Math.sqrt(speedSq);
      this.vx = (this.vx / spd) * 3;
      this.vy = (this.vy / spd) * 3;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); }
    if (this.x > engine.W) { this.x = engine.W; this.vx = -Math.abs(this.vx); }
    if (this.y < 0) { this.y = 0; this.vy = Math.abs(this.vy); }
    if (this.y > engine.H) { this.y = engine.H; this.vy = -Math.abs(this.vy); }

    this.hue = (this.hue + 0.05) % 360;
  }

  draw() {
    ctx.fillStyle = `hsl(${this.hue},80%,65%)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${this.hue},80%,65%,0.3)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r + 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function init() {
  particles = Array.from({ length: N_PARTICLES }, () => new Particle());
}

function drawConnections() {
  const groups = {};
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > MAX_DIST * MAX_DIST) continue;

      const dist = Math.sqrt(distSq);
      const alpha = Math.floor((1 - dist / MAX_DIST) * 10) / 10;
      if (alpha <= 0) continue;

      const hue = Math.floor(((p1.hue + p2.hue) / 2) / 30) * 30;
      const style = `hsla(${hue},70%,60%,${alpha})`;
      
      if (!groups[style]) groups[style] = [];
      groups[style].push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, width: (1 - dist / MAX_DIST) * 1.5 });
    }
  }

  Object.keys(groups).forEach(style => {
    ctx.strokeStyle = style;
    ctx.beginPath();
    groups[style].forEach(c => {
      ctx.lineWidth = c.width;
      ctx.moveTo(c.x1, c.y1);
      ctx.lineTo(c.x2, c.y2);
    });
    ctx.stroke();
  });
}

function update(dt) {
  particles.forEach(p => p.update());
}

function draw() {
  ctx.fillStyle = 'rgba(10,10,10,0.2)';
  ctx.fillRect(0, 0, engine.W, engine.H);

  drawConnections();
  particles.forEach(p => p.draw());
}

engine.canvas.addEventListener('mousemove', e => {
  const rect = engine.canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
engine.canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

engine.canvas.addEventListener('click', e => {
  const rect = engine.canvas.getBoundingClientRect();
  particles.push(new Particle(e.clientX - rect.left, e.clientY - rect.top));
  if (particles.length > 300) particles.shift();
});

engine.canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = engine.canvas.getBoundingClientRect();
  mouse.x = e.touches[0].clientX - rect.left;
  mouse.y = e.touches[0].clientY - rect.top;
}, { passive: false });

init();
engine.start(update, draw);
