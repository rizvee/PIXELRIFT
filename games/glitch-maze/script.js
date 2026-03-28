// games/glitch-maze/script.js — Glitch Maze
// Maze revealed through persistence rendering (no clearRect between frames)

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
let px = 30, py = 30;
let score = 0;

const GRID_SIZE = 30;
let maze = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    px = 30; py = 30; score = 0;
    generateMaze();
    overlay.style.display = 'none';
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);
}

function generateMaze() {
    maze = [];
    const cols = Math.floor(W / GRID_SIZE);
    const rows = Math.floor(H / GRID_SIZE);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (Math.random() < 0.3) maze.push({ x: x * GRID_SIZE, y: y * GRID_SIZE });
        }
    }
    maze = maze.filter(m => !(m.x < 90 && m.y < 90) && !(m.x > W - 90 && m.y > H - 90));
}

function update() {
    t++;
    if (px > W - 50 && py > H - 50) {
        score++;
        scoreDom.textContent = score;
        px = 30; py = 30;
        generateMaze();
        // Semi-clear for new level glitch effect
        ctx.fillStyle = 'rgba(6, 10, 16, 0.5)';
        ctx.fillRect(0, 0, W, H);
    }
}

function draw() {
    // NO clearRect here!
    
    // Draw trail
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Occasionally "glitch" the walls
    if (t % 10 === 0) {
        maze.forEach(m => {
            ctx.fillStyle = 'rgba(255, 77, 77, 0.05)';
            ctx.fillRect(m.x + 1, m.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        });
    }

    // Goal
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(W - 40, H - 40, 20, 20);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function move() {
    if (!running) return;
    let nx = px, ny = py;
    if (keys['w'] || keys['ArrowUp']) ny -= 3;
    if (keys['s'] || keys['ArrowDown']) ny += 3;
    if (keys['a'] || keys['ArrowLeft']) nx -= 3;
    if (keys['d'] || keys['ArrowRight']) nx += 3;

    const hit = maze.some(m => nx > m.x && nx < m.x + GRID_SIZE && ny > m.y && ny < m.y + GRID_SIZE);
    if (!hit && nx > 0 && nx < W && ny > 0 && ny < H) {
        px = nx; py = ny;
    }
    requestAnimationFrame(move);
}

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
