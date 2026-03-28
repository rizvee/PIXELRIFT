import { PixelRiftEngine } from '../../assets/js/engine.js';

const engine   = new PixelRiftEngine('game-canvas', 'neon-dodge');
const ctx      = engine.ctx;
const overlay  = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const msgEl    = document.getElementById('overlay-msg');

let running = false, score, t;
let player, pool;

// ── Bullet Pool ────────────────────────────────────────────────────────────
const POOL_SIZE = 1000;
function createBullet() {
  return { x: 0, y: 0, vx: 0, vy: 0, r: 4, hue: 0, active: false };
}

function getBullet() {
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!pool[i].active) {
      pool[i].active = true;
      return pool[i];
    }
  }
  return null;
}

function spawnBullet() {
  const b = getBullet();
  if (!b) return;

  const edge = Math.floor(Math.random() * 4);
  if (edge === 0)      { b.x = Math.random() * engine.W; b.y = -10; }
  else if (edge === 1) { b.x = engine.W + 10; b.y = Math.random() * engine.H; }
  else if (edge === 2) { b.x = Math.random() * engine.W; b.y = engine.H + 10; }
  else                 { b.x = -10; b.y = Math.random() * engine.H; }

  const dx = player.x - b.x + (Math.random() - 0.5) * 200;
  const dy = player.y - b.y + (Math.random() - 0.5) * 200;
  const speed = 2 + Math.min(5, score * 0.04);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  b.vx = (dx / len) * speed;
  b.vy = (dy / len) * speed;
  b.r = 3 + Math.random() * 2;
  b.hue = Math.floor(Math.random() * 12) * 30;
}

// ── Player & State ─────────────────────────────────────────────────────────
let impactFrames = 0;

function initGame() {
  score = 0; t = 0;
  engine.updateScore(0);
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, createBullet);
  } else {
    pool.forEach(b => b.active = false);
  }
  player = { x: engine.W / 2, y: engine.H / 2, r: 8, targetX: engine.W / 2, targetY: engine.H / 2 };
  impactFrames = 0;
}

let spawnRate = 60;
let frameCount = 0;

function update(dt) {
  t++;
  frameCount++;

  player.x += (player.targetX - player.x) * 0.15;
  player.y += (player.targetY - player.y) * 0.15;

  spawnRate = Math.max(8, 60 - Math.floor(t / 180));
  if (frameCount % spawnRate === 0) spawnBullet();
  if (t % 300 === 0 && t > 0) {
    score++;
    engine.updateScore(score);
  }

  for (let i = 0; i < POOL_SIZE; i++) {
    const b = pool[i];
    if (!b.active) continue;
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < -30 || b.x > engine.W + 30 || b.y < -30 || b.y > engine.H + 30) {
      b.active = false;
      continue;
    }

    const dx = b.x - player.x, dy = b.y - player.y;
    if (dx * dx + dy * dy < (b.r + player.r - 2) ** 2) {
      impactFrames = 10;
      endGame();
      return;
    }
  }
}

function drawFrame() {
  const groups = {};
  for (let i = 0; i < POOL_SIZE; i++) {
    const b = pool[i];
    if (!b.active) continue;
    if (!groups[b.hue]) groups[b.hue] = [];
    groups[b.hue].push(b);
  }

  if (impactFrames > 0) {
    impactFrames--;
    const shift = 4;
    ctx.clearRect(0, 0, engine.W, engine.H);
    
    ctx.save();
    ctx.translate(shift, 0);
    ctx.globalCompositeOperation = 'screen';
    renderScene(groups, '#FF0000');
    ctx.restore();

    ctx.save();
    ctx.translate(-shift, 0);
    ctx.globalCompositeOperation = 'screen';
    renderScene(groups, '#0000FF');
    ctx.restore();
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    renderScene(groups, '#00FF00');
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(10,10,10,0.3)';
    ctx.fillRect(0, 0, engine.W, engine.H);
    renderScene(groups);
  }

  // HUD
  ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 30);
}

function renderScene(groups, tint) {
  Object.keys(groups).forEach(hue => {
    ctx.fillStyle = tint || `hsl(${hue}, 100%, 65%)`;
    ctx.beginPath();
    groups[hue].forEach(b => {
      ctx.moveTo(b.x + b.r, b.y);
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    });
    ctx.fill();
  });

  ctx.strokeStyle = tint || '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = tint || '#00E5FF';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function startGame() {
  initGame();
  overlay.style.display = 'none';
  engine.start(update, drawFrame);
}

function endGame() {
  engine.stop();
  engine.saveScore(score);
  msgEl.innerHTML = `Score: <span style="color:var(--accent)">${score}</span>`;
  overlay.style.display = 'flex';
  startBtn.textContent  = 'RETRY';
}

engine.canvas.addEventListener('mousemove', e => {
  if (!engine.running) return;
  const rect = engine.canvas.getBoundingClientRect();
  player.targetX = e.clientX - rect.left;
  player.targetY = e.clientY - rect.top;
});

engine.canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!engine.running) return;
  const rect = engine.canvas.getBoundingClientRect();
  player.targetX = e.touches[0].clientX - rect.left;
  player.targetY = e.touches[0].clientY - rect.top;
}, { passive: false });

startBtn.addEventListener('click', startGame);
