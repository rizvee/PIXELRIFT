// games/color-sort/script.js — Color Sort
// HSL-based drag-sort visualization puzzle

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');

let W, H;
let running = false;
let raf;

const COUNT = 16;
let tiles = [];
let draggingIdx = -1;

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    tiles = [];
    for (let i = 0; i < COUNT; i++) {
        tiles.push({
            id: i,
            hue: (i / COUNT) * 360,
            pos: i
        });
    }
    // Shuffle positions
    tiles.sort(() => Math.random() - 0.5);
    tiles.forEach((t, i) => t.pos = i);
    overlay.style.display = 'none';
}

function checkWin() {
    const won = tiles.every(t => t.pos === t.id);
    if (won) {
        scoreDom.textContent = "COMPLETE";
        setTimeout(endGame, 1000);
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    const tileW = (W - 100) / COUNT;
    const tileH = 150;

    tiles.forEach((t, i) => {
        if (i === draggingIdx) return;
        ctx.fillStyle = `hsl(${t.hue}, 80%, 50%)`;
        ctx.fillRect(50 + t.pos * tileW + 2, H / 2 - tileH / 2, tileW - 4, tileH);
    });

    if (draggingIdx !== -1) {
        const t = tiles[draggingIdx];
        ctx.fillStyle = `hsl(${t.hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${t.hue}, 100%, 60%)`;
        ctx.shadowBlur = 20;
        ctx.fillRect(mouseX - tileW / 2, H / 2 - tileH / 2, tileW, tileH);
        ctx.shadowBlur = 0;
    }
}

function loop() {
    if (!running) return;
    draw();
    raf = requestAnimationFrame(loop);
}

let mouseX = 0;
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

canvas.addEventListener('mousedown', () => {
    if (!running) return;
    const tileW = (W - 100) / COUNT;
    const idx = Math.floor((mouseX - 50) / tileW);
    if (idx >= 0 && idx < COUNT) {
        draggingIdx = tiles.findIndex(t => t.pos === idx);
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggingIdx === -1) return;
    const tileW = (W - 100) / COUNT;
    const targetPos = Math.floor((mouseX - 50) / tileW);
    
    if (targetPos >= 0 && targetPos < COUNT) {
        const swapTile = tiles.find(t => t.pos === targetPos);
        const dragTile = tiles[draggingIdx];
        if (swapTile) {
            const oldPos = dragTile.pos;
            dragTile.pos = swapTile.pos;
            swapTile.pos = oldPos;
        }
    }
    draggingIdx = -1;
    checkWin();
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
    document.getElementById('overlay-title').textContent = 'SPECTRUM ALIGNED';
    document.getElementById('overlay-msg').innerHTML = `The colors have been restored.`;
    startBtn.textContent = 'PLAY AGAIN';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
