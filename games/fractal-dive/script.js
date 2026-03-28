// games/fractal-dive/script.js — Mandelbrot Set Renderer

const canvas   = document.getElementById('game-canvas');
const ctx      = canvas.getContext('2d');
const depthEl  = document.getElementById('depth-display');

let W, H;
let centerX = -0.5, centerY = 0, viewRadius = 2.0;
let maxIter  = 128;
let zoomLevel = 1;
let rendering = false;
let imageData;

function resize() {
  const wrap = canvas.parentElement;
  W = wrap.clientWidth;
  H = wrap.clientHeight;
  canvas.width  = W;
  canvas.height = H;
  imageData = ctx.createImageData(W, H);
  render();
}

function smoothColor(iter, zr, zi) {
  if (iter === maxIter) return [0, 0, 0];
  const log2 = Math.log(Math.log(Math.sqrt(zr*zr + zi*zi))) / Math.log(2);
  const smooth = iter + 1 - log2;
  const t = smooth / maxIter;

  // Cyan-magenta-blue palette
  const r = Math.round(9   * (1-t)**3 * t     * 255);
  const g = Math.round(15  * (1-t)**2 * t**2  * 255);
  const b = Math.round(8.5 * (1-t)    * t**3  * 255 + t * 180);
  return [
    Math.min(255, r + Math.round(smooth * 2) % 40),
    Math.min(255, g + Math.round(smooth * 3) % 60),
    Math.min(255, b)
  ];
}

function render() {
  if (rendering) return;
  rendering = true;

  const data = imageData.data;
  const scaleX = (viewRadius * 2) / W;
  const scaleY = (viewRadius * 2) / H;

  for (let py = 0; py < H; py++) {
    const ci = centerY + (py - H / 2) * scaleY;
    for (let px = 0; px < W; px++) {
      const cr = centerX + (px - W / 2) * scaleX;
      let zr = 0, zi = 0;
      let iter = 0;
      while (iter < maxIter && zr*zr + zi*zi <= 4) {
        const tmp = zr*zr - zi*zi + cr;
        zi = 2 * zr * zi + ci;
        zr = tmp;
        iter++;
      }
      const [r, g, b] = smoothColor(iter, zr, zi);
      const idx = (py * W + px) * 4;
      data[idx]   = r;
      data[idx+1] = g;
      data[idx+2] = b;
      data[idx+3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  rendering = false;
}

// ── Interaction ────────────────────────────────────────────────────────────
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const scaleX = (viewRadius * 2) / W;
  const scaleY = (viewRadius * 2) / H;

  centerX = centerX + (px - W / 2) * scaleX;
  centerY = centerY + (py - H / 2) * scaleY;

  viewRadius *= 0.4;
  zoomLevel = Math.round(2 / viewRadius);
  depthEl.textContent = `${zoomLevel}x`;

  // Increase iterations with depth
  maxIter = Math.min(512, 128 + Math.floor(Math.log2(zoomLevel) * 32));

  render();
});

// Pinch zoom
let lastPinchDist = null;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 2) lastPinchDist = null;
});
canvas.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return;
  e.preventDefault();
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (lastPinchDist) {
    const factor = lastPinchDist / dist;
    viewRadius = Math.min(3, viewRadius * factor);
    render();
  }
  lastPinchDist = dist;
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') {
    centerX = -0.5; centerY = 0; viewRadius = 2; maxIter = 128; zoomLevel = 1;
    depthEl.textContent = '1x';
    render();
  }
  if (e.key === '+' || e.key === '=') { maxIter = Math.min(4096, maxIter * 2); render(); }
  if (e.key === '-')                   { maxIter = Math.max(32,   maxIter / 2); render(); }
});

// Mouse wheel zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const scaleX = (viewRadius * 2) / W;
  const scaleY = (viewRadius * 2) / H;

  const mx = centerX + (px - W/2) * scaleX;
  const my = centerY + (py - H/2) * scaleY;

  const factor = e.deltaY > 0 ? 1.3 : 0.7;
  viewRadius *= factor;

  centerX = mx + (centerX - mx) * factor;
  centerY = my + (centerY - my) * factor;

  zoomLevel = Math.max(1, Math.round(2 / viewRadius));
  depthEl.textContent = `${zoomLevel}x`;
  maxIter = Math.min(512, 128 + Math.floor(Math.log2(Math.max(1,zoomLevel)) * 32));
  render();
}, { passive: false });

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', resize);
resize();
