// games/quantum-states/script.js — Quantum States
// Dual-state coordination where player exists in two timelines

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

// Player
let px = 100, py = 150;
let pvX = 0, pvY = 0;
let score = 0;

// Quantum State
let activeState = 'A'; // 'A' | 'B'

let obstacles = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    px = 100; py = H / 2; pvX = 0; pvY = 0;
    score = 0; activeState = 'A';
    obstacles = [];
    overlay.style.display = 'none';
}

function spawnObstacle() {
    const side = Math.random() > 0.5 ? 'A' : 'B';
    obstacles.push({
        x: W + 50,
        y: Math.random() * (H - 100) + 50,
        w: 40,
        h: 120,
        vx: -4 - (score * 0.1),
        state: side,
        color: side === 'A' ? '#00E5FF' : '#FF4D4D'
    });
}

function update() {
    t++;
    if (t % 60 === 0) spawnObstacle();

    // Movement (physics)
    pvY += 0.5; // Gravity
    py += pvY;
    px += pvX;
    
    // Bounds
    if (py < 0) { py = 0; pvY = 0; }
    if (py > H) endGame();

    obstacles.forEach(o => {
        o.x += o.vx;
        // Collision only with active state
        if (o.state === activeState) {
            if (px + 10 > o.x && px - 10 < o.x + o.w && py + 10 > o.y && py - 10 < o.y + o.h) {
                endGame();
            }
        }
        if (o.x < -100) {
            o.dead = true;
            score++;
            scoreDom.textContent = score;
        }
    });
    obstacles = obstacles.filter(o => !o.dead);
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Draw split-screen background indicator
    ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = activeState === 'A' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 77, 77, 0.1)';
    ctx.fillRect(0, 0, W, H);

    // Draw obstacles
    obstacles.forEach(o => {
        ctx.fillStyle = o.color;
        ctx.globalAlpha = o.state === activeState ? 1.0 : 0.2;
        ctx.shadowColor = o.color;
        ctx.shadowBlur = o.state === activeState ? 15 : 0;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    });

    // Draw Player
    ctx.fillStyle = activeState === 'A' ? '#00E5FF' : '#FF4D4D';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PHASE: ${activeState}`, W / 2, 40);
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('SHIFT: SPACE | JUMP: CLICK', W / 2, 60);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', () => {
    if (!running) return;
    pvY = -8;
});

document.addEventListener('keydown', e => {
    if (e.key === ' ' && running) {
        activeState = activeState === 'A' ? 'B' : 'A';
        e.preventDefault();
    }
});

function startGame() {
    resize();
    initGame();
    running = true;
    requestAnimationFrame(loop);
}

function endGame() {
    running = false;
    cancelAnimationFrame(raf);
    document.getElementById('overlay-title').textContent = 'DECOHERENCE';
    document.getElementById('overlay-msg').innerHTML = `Timeline collapsed.<br>Score: <span style="color:var(--accent)">${score}</span>`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
loadBest();
function loadBest(){
    const best = localStorage.getItem('quantum-best') || 0;
    bestDom.textContent = best;
}
function saveBest(){
    const best = localStorage.getItem('quantum-best') || 0;
    if (score > best) localStorage.setItem('quantum-best', score);
}
