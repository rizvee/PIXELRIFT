// games/blind-echo/script.js — Blind Echo
// Sonar-based navigation in darkness. Pings reveal walls with alpha decay.

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');

let W, H;
let running = false;
let raf;
let t = 0;

const GRID_SIZE = 40;
let maze = [];

// Player
let px = 60, py = 60;
let score = 0;

// Vision Pings (list of circular expanders)
let pings = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
    generateMaze();
}

function generateMaze() {
    maze = [];
    const cols = Math.floor(W / GRID_SIZE);
    const rows = Math.floor(H / GRID_SIZE);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (Math.random() < 0.25) maze.push({ x: x * GRID_SIZE, y: y * GRID_SIZE });
        }
    }
    // Clear start/end
    maze = maze.filter(m => !(m.x < 120 && m.y < 120) && !(m.x > W - 120 && m.y > H - 120));
}

function initGame() {
    px = 60; py = 60; score = 0; pings = [];
    overlay.style.display = 'none';
    scoreDom.textContent = 0;
}

function update() {
    t++;
    pings.forEach(p => {
        p.r += 10;
        p.life *= 0.94;
    });
    pings = pings.filter(p => p.life > 0.1);

    // Goal Check
    if (px > W - 80 && py > H - 80) {
        score += 100;
        px = 60; py = 60;
        generateMaze();
    }
    scoreDom.textContent = score;
}

function draw() {
    // Total Darkness background
    ctx.fillStyle = '#010508';
    ctx.fillRect(0, 0, W, H);

    // Goal glow (always slightly visible)
    const goalGrad = ctx.createRadialGradient(W - 60, H - 60, 0, W - 60, H - 60, 50);
    goalGrad.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
    goalGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = goalGrad;
    ctx.fillRect(W - 120, H - 120, 120, 120);

    // Walls revealed by pings
    maze.forEach(m => {
        let bestAlpha = 0;
        pings.forEach(p => {
            const dx = (m.x + GRID_SIZE/2) - p.x;
            const dy = (m.y + GRID_SIZE/2) - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // If wall is on the expansion ring
            if (Math.abs(dist - p.r) < 20) {
                bestAlpha = Math.max(bestAlpha, p.life);
            }
        });
        if (bestAlpha > 0) {
            ctx.fillStyle = `rgba(0, 229, 255, ${bestAlpha * 0.8})`;
            ctx.fillRect(m.x + 2, m.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
        }
    });

    // Player (pulsing dot)
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && running) pings.push({ x: px, y: py, r: 0, life: 1.0 });
});
document.addEventListener('keyup', e => keys[e.key] = false);

function move() {
    if (!running) return;
    let nx = px, ny = py;
    if (keys['w'] || keys['ArrowUp']) ny -= 3;
    if (keys['s'] || keys['ArrowDown']) ny += 3;
    if (keys['a'] || keys['ArrowLeft']) nx -= 3;
    if (keys['d'] || keys['ArrowRight']) nx += 3;

    // Collision
    const hit = maze.some(m => nx > m.x && nx < m.x + GRID_SIZE && ny > m.y && ny < m.y + GRID_SIZE);
    if (!hit && nx > 0 && nx < W && ny > 0 && ny < H) {
        px = nx; py = ny;
    }
    requestAnimationFrame(move);
}

canvas.addEventListener('mousedown', e => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    pings.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r: 0, life: 1.0 });
});

function startGame() {
    resize();
    initGame();
    running = true;
    requestAnimationFrame(loop);
    requestAnimationFrame(move);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
