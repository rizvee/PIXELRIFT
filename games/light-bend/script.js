// games/light-bend/script.js — Raycasting Light Puzzle

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const winOverlay = document.getElementById('win-overlay');
const nextBtn    = document.getElementById('next-btn');
const levelEl    = document.getElementById('level-display');

const CELL = 60;
let COLS, ROWS, W, H;
let level = 0, mirrors = [], selected = null;

// ── Levels ─────────────────────────────────────────────────────────────────
const levels = [
  {
    source: { x: 1, y: 3, dir: 0 }, // dir: 0=right,1=down,2=left,3=up
    targets: [{ x: 7, y: 3 }],
    walls: []
  },
  {
    source: { x: 1, y: 1, dir: 0 },
    targets: [{ x: 7, y: 5 }],
    walls: [{ x: 4, y: 0, len: 3, axis: 'v' }]
  },
  {
    source: { x: 1, y: 2, dir: 0 },
    targets: [{ x: 5, y: 6 }, { x: 7, y: 2 }],
    walls: []
  },
  {
    source: { x: 0, y: 1, dir: 0 },
    targets: [{ x: 6, y: 5 }],
    walls: [{ x: 3, y: 0, len: 4, axis: 'v' }, { x: 0, y: 4, len: 4, axis: 'h' }]
  }
];

function resize() {
  const wrap = canvas.parentElement;
  const size = Math.min(wrap.clientWidth, wrap.clientHeight) - 40;
  COLS = 10; ROWS = 8;
  W = COLS * CELL; H = ROWS * CELL;
  canvas.width = W; canvas.height = H;
}

function loadLevel(i) {
  level  = i % levels.length;
  mirrors = [];
  levelEl.textContent = level + 1;
  winOverlay.style.display = 'none';
  render();
}

// ── Ray Marching ───────────────────────────────────────────────────────────
const DIRS = [[1,0],[0,1],[-1,0],[0,-1]]; // right,down,left,up

function traceRay(startX, startY, dirIdx) {
  const segments = [];
  let x = startX + 0.5, y = startY + 0.5;
  let dx = DIRS[dirIdx][0], dy = DIRS[dirIdx][1];
  const MAX_BOUNCES = 16;

  for (let bounce = 0; bounce < MAX_BOUNCES; bounce++) {
    // March until a mirror or wall or boundary
    let bestT = Infinity, bestMirror = null;

    mirrors.forEach(m => {
      const mx = m.x + 0.5, my = m.y + 0.5;
      // Mirror is a line segment; use bounding box hit
      if (dx !== 0) {
        const t = (mx - x) / dx;
        if (t > 0.01 && t < bestT) {
          const hy = y + dy * t;
          if (Math.abs(hy - my) < 0.6) { bestT = t; bestMirror = m; }
        }
      }
      if (dy !== 0) {
        const t = (my - y) / dy;
        if (t > 0.01 && t < bestT) {
          const hx = x + dx * t;
          if (Math.abs(hx - mx) < 0.6) { bestT = t; bestMirror = m; }
        }
      }
    });

    // Also check boundary
    let boundT = Infinity;
    if (dx > 0) boundT = Math.min(boundT, (COLS - x) / dx);
    if (dx < 0) boundT = Math.min(boundT, (0 - x) / dx);
    if (dy > 0) boundT = Math.min(boundT, (ROWS - y) / dy);
    if (dy < 0) boundT = Math.min(boundT, (0 - y) / dy);

    if (!bestMirror || bestT >= boundT) {
      // Ray exits
      segments.push({ x1: x, y1: y, x2: x + dx * boundT, y2: y + dy * boundT });
      break;
    }

    segments.push({ x1: x, y1: y, x2: x + dx * bestT, y2: y + dy * bestT });
    x = x + dx * bestT;
    y = y + dy * bestT;

    // Reflect off mirror (angle 45° or -45°)
    if (bestMirror.angle === 45) {
      // \ mirror: swap and negate both
      [dx, dy] = [dy, dx];
    } else {
      // / mirror: swap
      [dx, dy] = [-dy, -dx];
    }
  }
  return segments;
}

function hitTest(segments, targets) {
  return targets.map(t => {
    return segments.some(s => {
      // Check if segment passes through target cell
      const tx = t.x + 0.5, ty = t.y + 0.5;
      const ex = s.x2 - s.x1, ey = s.y2 - s.y1;
      const len = Math.sqrt(ex*ex+ey*ey);
      if (len < 0.001) return false;
      const nx = ex/len, ny = ey/len;
      const dot = (tx-s.x1)*nx + (ty-s.y1)*ny;
      const closest = { x: s.x1+nx*dot, y: s.y1+ny*dot };
      return dot >= 0 && dot <= len &&
        Math.abs(closest.x-tx) < 0.55 && Math.abs(closest.y-ty) < 0.55;
    });
  });
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);
  const lv = levels[level];

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke(); }

  // Walls
  ctx.fillStyle = '#2a2a2a';
  (lv.walls||[]).forEach(w => {
    if (w.axis === 'v') ctx.fillRect(w.x*CELL, w.y*CELL, CELL, w.len*CELL);
    else                ctx.fillRect(w.x*CELL, w.y*CELL, w.len*CELL, CELL);
  });

  // Ray
  const segments = traceRay(lv.source.x, lv.source.y, lv.source.dir);
  const hits = hitTest(segments, lv.targets);

  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,   'rgba(0,229,255,0.9)');
  grad.addColorStop(0.5, 'rgba(255,100,200,0.7)');
  grad.addColorStop(1,   'rgba(255,229,0,0.9)');

  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur  = 12;
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  segments.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x1*CELL, s.y1*CELL);
    ctx.lineTo(s.x2*CELL, s.y2*CELL);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Source emitter
  const src = lv.source;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc((src.x+0.5)*CELL, (src.y+0.5)*CELL, 8, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Targets
  lv.targets.forEach((t, i) => {
    const hit = hits[i];
    ctx.strokeStyle = hit ? '#00FF88' : '#FF4D4D';
    ctx.shadowColor = hit ? '#00FF88' : '#FF4D4D';
    ctx.shadowBlur  = 10;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc((t.x+0.5)*CELL, (t.y+0.5)*CELL, 10, 0, Math.PI*2);
    ctx.stroke();
    if (hit) {
      ctx.fillStyle = 'rgba(0,255,136,0.25)';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  });

  // Mirrors
  mirrors.forEach(m => {
    const cx = (m.x+0.5)*CELL, cy = (m.y+0.5)*CELL;
    const ang = m.angle === 45 ? Math.PI/4 : -Math.PI/4;
    const len = CELL * 0.6;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const isSel = selected === m;
    ctx.strokeStyle = isSel ? '#00E5FF' : '#888';
    ctx.lineWidth   = isSel ? 3 : 2;
    ctx.shadowColor = isSel ? '#00E5FF' : 'transparent';
    ctx.shadowBlur  = isSel ? 10 : 0;
    ctx.beginPath();
    ctx.moveTo(-len/2, 0);
    ctx.lineTo( len/2, 0);
    ctx.stroke();
    ctx.restore();
  });

  // Win check
  if (hits.length && hits.every(Boolean)) {
    setTimeout(() => { winOverlay.style.display = 'flex'; }, 400);
  }
}

// ── Interaction ────────────────────────────────────────────────────────────
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const gx = Math.floor(mx / CELL), gy = Math.floor(my / CELL);

  // Check if clicking existing mirror
  const existing = mirrors.find(m => m.x === gx && m.y === gy);

  if (existing) {
    if (selected === existing) {
      // Rotate mirror
      existing.angle = existing.angle === 45 ? -45 : 45;
      selected = null;
    } else {
      selected = existing;
    }
  } else {
    // Place new mirror
    selected = null;
    const lv = levels[level];
    // Don't place on source/target/wall
    const onSource  = lv.source.x === gx && lv.source.y === gy;
    const onTarget  = lv.targets.some(t => t.x === gx && t.y === gy);
    if (!onSource && !onTarget) {
      mirrors.push({ x: gx, y: gy, angle: 45 });
    }
  }
  render();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selected) {
      mirrors = mirrors.filter(m => m !== selected);
      selected = null;
      render();
    }
  }
  if (e.key === 'r' || e.key === 'R') {
    if (selected) { selected.angle = selected.angle === 45 ? -45 : 45; render(); }
  }
});

nextBtn.addEventListener('click', () => loadLevel(level + 1));

window.addEventListener('resize', () => { resize(); render(); });
resize();
loadLevel(0);
