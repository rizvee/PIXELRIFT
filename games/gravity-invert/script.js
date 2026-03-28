// games/gravity-invert/script.js — Gravity Invert
// Gravity constant toggle and velocity inversion platformer

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');

let W, H;
let running = false;
let raf;
let t = 0;

// Player
let px = 100, py = 150;
let pvX = 0, pvY = 0;
let gravity = 0.5;
let score = 0;

let platforms = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    px = 100; py = H / 2; pvX = 0; pvY = 0;
    gravity = 0.5; score = 0; platforms = [];
    overlay.style.display = 'none';
}

function spawnPlatform() {
    platforms.push({
        x: W + 50,
        y: Math.random() > 0.5 ? 50 : H - 100,
        w: 150,
        h: 20,
        vx: -5 - (score * 0.1)
    });
}

function update() {
    t++;
    if (t % 60 === 0) spawnPlatform();

    pvY += gravity;
    py += pvY;
    
    // Bounds check
    if (py < 0 || py > H) endGame();

    platforms.forEach(p => {
        p.x += p.vx;
        // Collision
        if (px > p.x && px < p.x + p.w && py > p.y && py < p.y + p.h) {
            if (gravity > 0) py = p.y - 1; else py = p.y + p.h + 1;
            pvY = 0;
        }
        if (p.x < -200) {
            p.dead = true;
            score++;
            scoreDom.textContent = score;
        }
    });
    platforms = platforms.filter(p => !p.dead);
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Gravity field effect
    ctx.fillStyle = gravity > 0 ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 184, 0, 0.05)';
    ctx.fillRect(0, 0, W, H);

    // Platforms
    ctx.fillStyle = '#FFFFFF';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Player
    ctx.fillStyle = '#00FF88';
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE TO INVERT GRAVITY', W / 2, 30);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
    if (e.key === ' ' && running) {
        gravity = -gravity;
        pvY = 0;
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
    document.getElementById('overlay-title').textContent = 'VOID BREACH';
    document.getElementById('overlay-msg').innerHTML = `Gravity stabilization failed.<br>Score: <span style="color:var(--accent)">${score}</span>`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
