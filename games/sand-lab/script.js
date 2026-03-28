// games/sand-lab/script.js — Cellular Automata Sand Simulation

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

// ── Types ──────────────────────────────────────────────────────────────────
const EMPTY = 0, SAND = 1, WATER = 2, FIRE = 3, STONE = 4, SMOKE = 5;

const COLORS = {
  [EMPTY]: null,
  [SAND]:  () => `hsl(40,${60+Math.random()*20}%,${50+Math.random()*15}%)`,
  [WATER]: () => `hsl(200,${70+Math.random()*20}%,${50+Math.random()*10}%)`,
  [FIRE]:  () => `hsl(${10+Math.random()*30},100%,${50+Math.random()*20}%)`,
  [STONE]: () => `hsl(0,0%,${35+Math.random()*15}%)`,
  [SMOKE]: () => `hsl(0,0%,${55+Math.random()*20}%)`
};

let COLS, ROWS, CELL = 4;
let grid, colorGrid, updated;

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
  colorGrid = new Array(COLS * ROWS).fill(null);
  updated   = new Uint8Array(COLS * ROWS);
}

function idx(x, y) { return y * COLS + x; }
function get(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return STONE;
  return grid[idx(x, y)];
}
function set(x, y, type) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
  const i = idx(x, y);
  grid[i]      = type;
  colorGrid[i] = type !== EMPTY ? COLORS[type]() : null;
}
function swap(x1, y1, x2, y2) {
  const i1 = idx(x1, y1), i2 = idx(x2, y2);
  [grid[i1], grid[i2]]           = [grid[i2], grid[i1]];
  [colorGrid[i1], colorGrid[i2]] = [colorGrid[i2], colorGrid[i1]];
}

// ── Simulation Step ────────────────────────────────────────────────────────
function step() {
  updated.fill(0);

  for (let y = ROWS - 1; y >= 0; y--) {
    // Alternate scan direction each row to avoid directional bias
    const ltr = y % 2 === 0;
    for (let xi = 0; xi < COLS; xi++) {
      const x = ltr ? xi : (COLS - 1 - xi);
      const i = idx(x, y);
      if (updated[i]) continue;

      const type = grid[i];
      if (type === EMPTY || type === STONE) continue;

      if (type === SAND) {
        if (get(x, y+1) === EMPTY) {
          swap(x, y, x, y+1); updated[idx(x,y+1)] = 1;
        } else if (get(x, y+1) === WATER) {
          swap(x, y, x, y+1); updated[idx(x,y+1)] = 1;
        } else {
          const d = Math.random() < 0.5 ? -1 : 1;
          if (get(x+d, y+1) === EMPTY || get(x+d, y+1) === WATER) {
            swap(x, y, x+d, y+1); updated[idx(x+d,y+1)] = 1;
          } else if (get(x-d, y+1) === EMPTY || get(x-d, y+1) === WATER) {
            swap(x, y, x-d, y+1); updated[idx(x-d,y+1)] = 1;
          }
        }
      }

      else if (type === WATER) {
        if (get(x, y+1) === EMPTY) {
          swap(x, y, x, y+1); updated[idx(x,y+1)] = 1;
        } else {
          const d = Math.random() < 0.5 ? -1 : 1;
          if (get(x+d, y) === EMPTY) { swap(x, y, x+d, y); updated[idx(x+d,y)] = 1; }
          else if (get(x-d, y) === EMPTY) { swap(x, y, x-d, y); updated[idx(x-d,y)] = 1; }
        }
      }

      else if (type === FIRE) {
        // Spread fire
        [[0,-1],[1,0],[-1,0],[1,-1],[-1,-1]].forEach(([dx,dy]) => {
          const nx = x+dx, ny = y+dy;
          if (Math.random() < 0.06 && get(nx,ny) === SAND) set(nx, ny, FIRE);
          if (Math.random() < 0.1  && get(nx,ny) === WATER) {
            set(nx, ny, EMPTY); set(x, y, SMOKE);
          }
        });
        // Rise as smoke
        if (Math.random() < 0.04) {
          set(x, y, SMOKE);
        } else if (get(x, y-1) === EMPTY && Math.random() < 0.3) {
          swap(x, y, x, y-1); updated[idx(x,y-1)] = 1;
        }
      }

      else if (type === SMOKE) {
        if (Math.random() < 0.015) { set(x, y, EMPTY); continue; }
        const d = Math.random() < 0.5 ? -1 : 1;
        if (get(x, y-1) === EMPTY && Math.random() < 0.5) {
          swap(x, y, x, y-1); updated[idx(x,y-1)] = 1;
        } else if (get(x+d, y-1) === EMPTY) {
          swap(x, y, x+d, y-1); updated[idx(x+d,y-1)] = 1;
        }
      }
    }
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = idx(x, y);
      if (grid[i] === EMPTY) continue;
      ctx.fillStyle = colorGrid[i];
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
}

// ── Main Loop ──────────────────────────────────────────────────────────────
function loop() {
  step();
  draw();
  requestAnimationFrame(loop);
}

// ── Drawing ────────────────────────────────────────────────────────────────
let painting   = false;
let currentEl  = SAND;
let brushSize  = 3;

const elMap = { sand: SAND, water: WATER, fire: FIRE, stone: STONE, void: EMPTY };

document.querySelectorAll('.el-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.el-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentEl = elMap[btn.dataset.el];
  });
});

document.getElementById('brush-size').addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
});

function paint(e) {
  if (!painting) return;
  let cx, cy;
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    cx = e.touches[0].clientX - rect.left;
    cy = e.touches[0].clientY - rect.top;
  } else {
    cx = e.clientX - rect.left;
    cy = e.clientY - rect.top;
  }
  const gx = Math.floor(cx / CELL);
  const gy = Math.floor(cy / CELL);
  for (let dy = -brushSize; dy <= brushSize; dy++) {
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      if (dx*dx + dy*dy <= brushSize*brushSize) {
        if (currentEl === EMPTY) {
          const i = idx(gx+dx, gy+dy);
          if (gx+dx >= 0 && gx+dx < COLS && gy+dy >= 0 && gy+dy < ROWS) {
            grid[i] = EMPTY; colorGrid[i] = null;
          }
        } else {
          if (Math.random() < 0.7) set(gx+dx, gy+dy, currentEl);
        }
      }
    }
  }
}

canvas.addEventListener('mousedown',  e => { painting = true; paint(e); });
canvas.addEventListener('mousemove',  paint);
canvas.addEventListener('mouseup',    () => painting = false);
canvas.addEventListener('mouseleave', () => painting = false);
canvas.addEventListener('touchstart', e => { e.preventDefault(); painting = true; paint(e); }, { passive: false });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); paint(e); }, { passive: false });
canvas.addEventListener('touchend',   () => painting = false);

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);
