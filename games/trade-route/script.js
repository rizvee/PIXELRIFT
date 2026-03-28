// games/trade-route/script.js — Trade Route
// Graph-based trading across dynamic price nodes

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY = 'trade-route-high-score';

let W, H;
let running = false;
let raf;
let t = 0;

// Game State
let credits = 200;
let fuel = 100;
let shipPos = 0; // Planet index
let inventory = { ore: 0, spice: 0, tech: 0 };
let capacity = 10;

let planets = [];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function initGame() {
    credits = 200; fuel = 100; shipPos = 0;
    inventory = { ore: 0, spice: 0, tech: 0 };
    planets = [
        { name: 'Terra', x: 100, y: H / 2, prices: { ore: 10, spice: 50, tech: 100 } },
        { name: 'Vulcan', x: W / 2, y: 100, prices: { ore: 5, spice: 60, tech: 120 } },
        { name: 'Aurelia', x: W / 2, y: H - 100, prices: { ore: 20, spice: 40, tech: 150 } },
        { name: 'Cyberia', x: W - 100, y: H / 2, prices: { ore: 15, spice: 80, tech: 80 } }
    ];
    overlay.style.display = 'none';
}

function updatePrices() {
    planets.forEach(p => {
        for (const res in p.prices) {
            p.prices[res] += (Math.random() - 0.5) * 2;
            p.prices[res] = Math.max(1, p.prices[res]);
        }
    });
}

function update() {
    t++;
    if (t % 180 === 0) updatePrices();
    scoreDom.textContent = Math.floor(credits + (fuel * 2));
    if (fuel <= 0 && credits < 10) endGame();
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Trade Routes
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            ctx.beginPath();
            ctx.moveTo(planets[i].x, planets[i].y);
            ctx.lineTo(planets[j].x, planets[j].y);
            ctx.stroke();
        }
    }

    planets.forEach((p, i) => {
        const isHere = shipPos === i;
        ctx.fillStyle = isHere ? '#00E5FF' : '#FFFFFF';
        ctx.shadowColor = isHere ? '#00E5FF' : 'transparent';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHere ? 20 : 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - 30);

        // Price Tags
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText(`ORE: ${Math.floor(p.prices.ore)}`, p.x, p.y + 40);
        ctx.fillText(`SPI: ${Math.floor(p.prices.spice)}`, p.x, p.y + 55);
        ctx.fillText(`TEC: ${Math.floor(p.prices.tech)}`, p.x, p.y + 70);
    });

    // Ship indicator
    const cp = planets[shipPos];
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 25, 0, Math.PI * 2);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Credits: ${Math.floor(credits)}`, 20, 30);
    ctx.fillStyle = '#00E5FF';
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 20, 50);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#888';
    ctx.fillText(`Cargo: ${inventory.ore + inventory.spice + inventory.tech} / ${capacity}`, W - 20, 30);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

function travel(idx) {
    if (shipPos === idx) return;
    const dist = Math.sqrt((planets[idx].x - planets[shipPos].x) ** 2 + (planets[idx].y - planets[shipPos].y) ** 2);
    const fuelCost = dist / 10;
    if (fuel >= fuelCost) {
        fuel -= fuelCost;
        shipPos = idx;
    }
}

function buy(res) {
    const p = planets[shipPos];
    const total = inventory.ore + inventory.spice + inventory.tech;
    if (credits >= p.prices[res] && total < capacity) {
        credits -= p.prices[res];
        inventory[res]++;
    }
}

function sell(res) {
    const p = planets[shipPos];
    if (inventory[res] > 0) {
        credits += p.prices[res];
        inventory[res]--;
    }
}

canvas.addEventListener('click', e => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    planets.forEach((p, i) => {
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (d < 30) travel(i);
    });
});

document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'q') buy('ore');
    if (e.key === 'w') buy('spice');
    if (e.key === 'e') buy('tech');
    if (e.key === 'r') sell('ore');
    if (e.key === 't') sell('spice');
    if (e.key === 'y') sell('tech');
    if (e.key === 'f' && credits >= 10) { credits -= 10; fuel = Math.min(100, fuel + 20); }
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
    document.getElementById('overlay-title').textContent = 'BANKRUPT';
    document.getElementById('overlay-msg').innerHTML = `Fuel depleted and no funds left.`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
