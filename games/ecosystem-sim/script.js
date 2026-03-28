// games/ecosystem-sim/script.js — Ecosystem Sim
// Lotka-Volterra population dynamics and interactive biological balance

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

// Populations (Lotka-Volterra agents)
let grass = 100;
let rabbits = 20;
let wolves = 5;

// Rates
const grassGrowth = 0.05;
const rabbitHunger = 0.02; // rabbit eats grass
const wolfHunger = 0.02;   // wolf eats rabbit
const deathRate = 0.01;

let history = { grass: [], rabbits: [], wolves: [] };

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    grass = 150; rabbits = 30; wolves = 5;
    history = { grass: [], rabbits: [], wolves: [] };
    overlay.style.display = 'none';
}

function update() {
    t++;
    
    // Euler integration for population differential equations
    const dGrass = grass * (grassGrowth - 0.001 * grass - 0.01 * rabbits);
    const dRabbits = rabbits * (0.0005 * grass - 0.04 - 0.02 * wolves);
    const dWolves = wolves * (0.01 * rabbits - 0.1);

    grass = Math.max(1, grass + dGrass);
    rabbits = Math.max(1, rabbits + dRabbits);
    wolves = Math.max(1, wolves + dWolves);

    if (t % 10 === 0) {
        history.grass.push(grass);
        history.rabbits.push(rabbits);
        history.wolves.push(wolves);
        if (history.grass.length > 200) {
            history.grass.shift();
            history.rabbits.shift();
            history.wolves.shift();
        }
    }

    scoreDom.textContent = Math.floor(grass + rabbits + wolves);
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Charting
    const chartW = W - 100, chartH = H - 150, ox = 50, oy = 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeRect(ox, oy, chartW, chartH);

    const maxVal = Math.max(...history.grass, ...history.rabbits, ...history.wolves, 10);
    
    const drawLine = (data, col) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = ox + (i / 200) * chartW;
            const y = oy + chartH - (v / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    };

    drawLine(history.grass, '#00FF88');
    drawLine(history.rabbits, '#00E5FF');
    drawLine(history.wolves, '#FF4D4D');

    // Labels
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillStyle = '#00FF88'; ctx.fillText(`Grass: ${Math.floor(grass)}`, 60, 70);
    ctx.fillStyle = '#00E5FF'; ctx.fillText(`Rabbits: ${Math.floor(rabbits)}`, 60, 90);
    ctx.fillStyle = '#FF4D4D'; ctx.fillText(`Wolves: ${Math.floor(wolves)}`, 60, 110);

    // Interaction Help
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('1: Seed Grass | 2: Release Rabbits | 3: Spawn Wolves', W / 2, H - 30);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
    if (e.key === '1') grass += 50;
    if (e.key === '2') rabbits += 10;
    if (e.key === '3') wolves += 5;
});

function startGame() {
    resize();
    initGame();
    running = true;
    requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
