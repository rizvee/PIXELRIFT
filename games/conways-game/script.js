// games/conways-game/script.js — Conway's Game of Life

const canvas   = document.getElementById('game-canvas');
const ctx      = canvas.getContext('2d');
const genEl    = document.getElementById('gen-count');
const btnPlay  = document.getElementById('btn-play');
const btnStep  = document.getElementById('btn-step');
const btnRand  = document.getElementById('btn-random');
const btnClear = document.getElementById('btn-clear');
const fpsSlider = document.getElementById('fps-slider');

const CELL = 10;
let COLS, ROWS;
let grid, nextGrid;
let running = false, generation = 0, raf = null, lastStepTime = 0;
let fps = 10;
let drawing = false, drawValue = 1;

function resize() {
  const wrap = canvas.parentElement;
  COLS = Math.floor(wrap.clientWidth  / CELL);
  ROWS = Math.floor(wrap.clientHeight / CELL);
  canvas.width  = COLS * CELL;
  canvas.height = ROWS * CELL;
  initGrid();
}

function initGrid() {
  grid      = new Uint8Array(COLS * ROWS);
  nextGrid  = new Uint8Array(COLS * ROWS);
  generation = 0;
  genEl.textContent = 0;
}

function get(x, y) {
  // Toroidal wrapping
  const wx = (x + COLS) % COLS;
  const wy = (y + ROWS) % ROWS;
  return grid[wy * COLS + wx];
}

function countNeighbors(x, y) {
  return get(x-1,y-1)+get(x,y-1)+get(x+1,y-1)+
         get(x-1,y  )+            get(x+1,y  )+
         get(x-1,y+1)+get(x,y+1)+get(x+1,y+1);
}

function step() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const n    = countNeighbors(x, y);
      const alive = grid[y * COLS + x];
      nextGrid[y * COLS + x] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
    }
  }
  [grid, nextGrid] = [nextGrid, grid];
  generation++;
  genEl.textContent = generation;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y*CELL); ctx.lineTo(canvas.width, y*CELL); ctx.stroke();
  }

  // Cells
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!grid[y * COLS + x]) continue;
      const n = countNeighbors(x, y);
      // Color by neighbor count — lonely cells cyan, crowded cells warmer
      const hue = 180 + n * 15;
      ctx.fillStyle = `hsl(${hue},80%,65%)`;
      ctx.fillRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
    }
  }
}

function loop(ts) {
  if (running && ts - lastStepTime > 1000 / fps) {
    step();
    lastStepTime = ts;
  }
  draw();
  raf = requestAnimationFrame(loop);
}

function randomize() {
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.3 ? 1 : 0;
  generation = 0; genEl.textContent = 0;
}

// ── Controls ───────────────────────────────────────────────────────────────
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? '⏸ Pause' : '▶ Play';
  btnPlay.classList.toggle('active', running);
});

btnStep.addEventListener('click', () => { if (!running) { step(); draw(); } });

btnRand.addEventListener('click', () => { randomize(); if (!running) draw(); });

btnClear.addEventListener('click', () => {
  grid.fill(0); generation = 0; genEl.textContent = 0;
  if (!running) draw();
});

fpsSlider.addEventListener('input', () => { fps = parseInt(fpsSlider.value); });

// ── Drawing ────────────────────────────────────────────────────────────────
function getCellAt(e) {
  const rect = canvas.getBoundingClientRect();
  let cx = e.clientX ?? e.touches[0].clientX;
  let cy = e.clientY ?? e.touches[0].clientY;
  return {
    x: Math.floor((cx - rect.left)  / CELL),
    y: Math.floor((cy - rect.top)   / CELL)
  };
}

function paintCell(e) {
  if (!drawing) return;
  const { x, y } = getCellAt(e);
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
    grid[y * COLS + x] = drawValue;
    if (!running) draw();
  }
}

canvas.addEventListener('mousedown', e => {
  drawing = true;
  const { x, y } = getCellAt(e);
  drawValue = grid[y*COLS+x] ? 0 : 1;
  paintCell(e);
});
canvas.addEventListener('mousemove', paintCell);
canvas.addEventListener('mouseup',   () => drawing = false);
canvas.addEventListener('mouseleave',() => drawing = false);

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  drawing = true;
  const { x, y } = getCellAt(e.touches[0]);
  drawValue = grid[y*COLS+x] ? 0 : 1;
  paintCell(e.touches[0]);
}, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); paintCell(e.touches[0]); }, { passive: false });
canvas.addEventListener('touchend',   () => drawing = false);

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { resize(); });
resize();
randomize();
requestAnimationFrame(loop);
