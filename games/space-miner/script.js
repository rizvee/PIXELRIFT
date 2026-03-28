// games/space-miner/script.js — Space Miner
// Click-to-mine idle game with persistent upgrades

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_SAVE = 'space-miner-save';

let W, H;
let running = false;
let raf;
let t = 0;

// Game State
let ore = 0;
let totalOre = 0;
let clickPower = 1;
let autoPower = 0;
let upgrades = {
    drill: { level: 0, cost: 20, power: 1, type: 'click' },
    drone: { level: 0, cost: 50, power: 0.5, type: 'auto' },
    laser: { level: 0, cost: 200, power: 5, type: 'auto' }
};

let particles = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function loadSave() {
    const saved = localStorage.getItem(LS_SAVE);
    if (saved) {
        const data = JSON.parse(saved);
        ore = data.ore;
        totalOre = data.totalOre;
        upgrades = data.upgrades;
        calculatePower();
    }
}

function saveGame() {
    localStorage.setItem(LS_SAVE, JSON.stringify({ ore, totalOre, upgrades }));
}

function calculatePower() {
    clickPower = 1 + (upgrades.drill.level * upgrades.drill.power);
    autoPower = (upgrades.drone.level * upgrades.drone.power) + (upgrades.laser.level * upgrades.laser.power);
}

function spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: '#FFB800'
        });
    }
}

function update() {
    t++;
    if (t % 60 === 0) {
        ore += autoPower;
        totalOre += autoPower;
    }
    
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);

    scoreDom.textContent = Math.floor(ore);
    bestDom.textContent = Math.floor(totalOre);
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Asteroid
    const cx = W / 2, cy = H / 2;
    const pulse = Math.sin(t * 0.05) * 5;
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 80 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glitter
    ctx.fillStyle = '#FFB800';
    for (let i = 0; i < 5; i++) {
        const angle = t * 0.02 + i * (Math.PI * 2 / 5);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(ore)} ORE`, cx, cy - 120);
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(`+${autoPower.toFixed(1)}/sec`, cx, cy - 100);

    // Upgrades
    ctx.textAlign = 'left';
    let i = 0;
    for (const key in upgrades) {
        const u = upgrades[key];
        const y = 80 + i * 45;
        ctx.fillStyle = ore >= u.cost ? '#00FF88' : '#888888';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillText(`${key.toUpperCase()} (Lv ${u.level})`, 40, y);
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`Cost: ${u.cost} ORE | +${u.power} ${u.type === 'click' ? 'Click' : 'Sec'}`, 40, y + 15);
        i++;
    }
}

function loop() {
    if (!running) return;
    update();
    draw();
    if (t % 300 === 0) saveGame();
    raf = requestAnimationFrame(loop);
}

canvas.addEventListener('click', e => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    
    // Check if clicked asteroid
    const d = Math.sqrt((mx - W/2)**2 + (my - H/2)**2);
    if (d < 100) {
        ore += clickPower;
        totalOre += clickPower;
        spawnParticles(mx, my, 5);
    }
});

document.addEventListener('keydown', e => {
    if (e.key === '1') buy('drill');
    if (e.key === '2') buy('drone');
    if (e.key === '3') buy('laser');
});

function buy(key) {
    const u = upgrades[key];
    if (ore >= u.cost) {
        ore -= u.cost;
        u.level++;
        u.cost = Math.floor(u.cost * 1.5);
        calculatePower();
        saveGame();
    }
}

function startGame() {
    resize();
    loadSave();
    running = true;
    overlay.style.display = 'none';
    requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
loadSave();
