import { PixelRiftEngine } from '../../assets/js/engine.js';

const engine = new PixelRiftEngine('game-canvas', 'gravity-snake');
const ctx = engine.ctx;
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const overTitle = document.getElementById('overlay-title');
const overScore = document.getElementById('overlay-score');

const CELL = 18;
let cols, rows;
let snake, dir, nextDir, apple, score, t;
let velY = 0;

function onResize(w, h) {
  cols = Math.floor(w / CELL);
  rows = Math.floor(h / CELL);
}
engine.onResize = onResize;
onResize(engine.W, engine.H);

function randCell(exclude = []) {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
  } while (exclude.some(e => e.x === cell.x && e.y === cell.y));
  return cell;
}

// ── State ──────────────────────────────────────────────────────────────────
let impactFrames = 0;
const SEG_POOL_SIZE = 1000;
const segPool = Array.from({ length: SEG_POOL_SIZE }, () => ({ x: 0, y: 0 }));
let poolIdx = 0;

function getSeg(x, y) {
  const s = segPool[poolIdx];
  s.x = x; s.y = y;
  poolIdx = (poolIdx + 1) % SEG_POOL_SIZE;
  return s;
}

function initGame() {
  t = 0; velY = 0; score = 0;
  impactFrames = 0;
  engine.updateScore(0);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  snake = [getSeg(cx, cy), getSeg(cx - 1, cy), getSeg(cx - 2, cy)];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  apple = randCell(snake);
}

function gravity(tick) {
  return Math.sin(tick * 0.018) * 0.9 + 0.5;
}

let stepTimer = 0;
const STEP_INTERVAL = 120;
let STEP_INTERVAL_CUR = STEP_INTERVAL;

function flap() {
  velY = -2.2;
}

function gameStep(dt) {
  stepTimer += dt;
  if (stepTimer < STEP_INTERVAL_CUR) return;
  stepTimer -= STEP_INTERVAL_CUR;

  t += 1;
  velY += gravity(t) * 0.3;
  velY = Math.max(-2, Math.min(2, velY));

  let moveDir = { ...nextDir };
  const gravTick = Math.round(velY);
  if (moveDir.x !== 0 && gravTick !== 0) {
    if (t % 4 === 0) moveDir = { x: 0, y: gravTick > 0 ? 1 : -1 };
  } else if (moveDir.x === 0 && moveDir.y === 0) {
    moveDir = { x: 0, y: velY > 0 ? 1 : -1 };
  }

  dir = moveDir;
  const headX = snake[0].x + dir.x;
  const headY = snake[0].y + dir.y;

  if (headX < 0 || headX >= cols || headY < 0 || headY >= rows) {
    impactFrames = 10; endGame(); return;
  }
  if (snake.slice(1).some(s => s.x === headX && s.y === headY)) {
    impactFrames = 10; endGame(); return;
  }

  snake.unshift(getSeg(headX, headY));

  if (headX === apple.x && headY === apple.y) {
    score++;
    engine.updateScore(score);
    apple = randCell(snake);
    STEP_INTERVAL_CUR = Math.max(60, 120 - score * 3);
  } else {
    snake.pop();
  }
}

function draw() {
  if (impactFrames > 0) {
    impactFrames--;
    const shift = 4;
    ctx.clearRect(0, 0, engine.W, engine.H);
    ctx.save();
    ctx.translate(shift, 0);
    ctx.globalCompositeOperation = 'screen';
    renderScene('#FF0000');
    ctx.restore();
    ctx.save();
    ctx.translate(-shift, 0);
    ctx.globalCompositeOperation = 'screen';
    renderScene('#0000FF');
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    renderScene('#00FF00');
    ctx.restore();
  } else {
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, engine.W, engine.H);
    renderScene();
  }

  // HUD
  ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 30);
}

function renderScene(tint) {
  // Grid
  ctx.strokeStyle = tint || 'rgba(30,30,30,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= cols; x++) { ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, engine.H); }
  for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * CELL); ctx.lineTo(engine.W, y * CELL); }
  ctx.stroke();

  // Gravity wave background
  const gv = gravity(t);
  ctx.fillStyle = tint || `rgba(0,229,255,${0.02 + gv * 0.02})`;
  ctx.fillRect(0, 0, engine.W, engine.H);

  // Apple
  const ax = apple.x * CELL + CELL / 2;
  const ay = apple.y * CELL + CELL / 2;
  ctx.fillStyle = tint || '#FF4D4D';
  if (!tint) {
    ctx.beginPath();
    ctx.arc(ax, ay, CELL / 2 + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,77,77,0.3)';
    ctx.fill();
    ctx.fillStyle = '#FF4D4D';
  }
  ctx.beginPath();
  ctx.arc(ax, ay, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  snake.forEach((seg, i) => {
    const ratio = i / snake.length;
    const g = Math.round(229 * (1 - ratio * 0.6));
    const b = Math.round(255 * (1 - ratio * 0.4));
    ctx.fillStyle = tint || `rgb(0,${g},${b})`;
    const pad = i === 0 ? 1 : 2;
    if (i === 0 && !tint) {
      ctx.save();
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10;
      ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
      ctx.restore();
    } else {
      ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
    }
  });

  // Gravity indicator
  const gvNorm = (gravity(t) + 0.5) / 2;
  ctx.fillStyle = tint || 'rgba(0,229,255,0.15)';
  ctx.fillRect(engine.W - 6, 0, 6, engine.H);
  ctx.fillStyle = tint || '#00E5FF';
  ctx.fillRect(engine.W - 6, engine.H * gvNorm - 3, 6, 6);
}

function startGame() {
  initGame();
  overlay.style.display = 'none';
  engine.start(gameStep, draw);
}

function endGame() {
  engine.stop();
  engine.saveScore(score);
  overTitle.textContent = 'GAME OVER';
  overScore.innerHTML   = `Score: <span style="color:var(--accent)">${score}</span> &nbsp;·&nbsp; Best: <span style="color:var(--accent)">${engine.best}</span>`;
  startBtn.textContent  = 'PLAY AGAIN';
  overlay.style.display = 'flex';
}

// ── Input ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!engine.running) return;
  const map = { ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}, ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1} };
  if (map[e.key]) {
    const nd = map[e.key];
    if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
    if (e.key === 'ArrowUp' || e.key === ' ') flap();
    e.preventDefault();
  }
  if (e.key === ' ') flap();
});

engine.canvas.addEventListener('click', () => { if (engine.running) flap(); });
engine.canvas.addEventListener('touchstart', e => { e.preventDefault(); if (engine.running) flap(); }, { passive: false });

startBtn.addEventListener('click', startGame);
