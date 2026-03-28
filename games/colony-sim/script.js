// games/colony-sim/script.js — Colony Sim
// Base-building resource management with cascade failure mechanics

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY = 'colony-sim-high-score';

let W, H;
let running = false;
let raf;
let t = 0;

// Game Config
const GRID_SIZE = 40;
let COLUMNS, ROWS;

// Resources
let resources = {
    power: 100,
    oxygen: 100,
    food: 100,
    population: 5,
    minerals: 50
};

let buildings = [];
let selectedType = 'solar';

const BUILDING_TYPES = {
    solar: { name: 'Solar Panel', cost: 10, powerGen: 0.5, oxGen: 0, foodGen: 0, color: '#FFB800' },
    farm: { name: 'Hydroponics', cost: 20, powerGen: -0.2, oxGen: 0.1, foodGen: 0.2, color: '#00FF88' },
    hab: { name: 'Habitat', cost: 30, powerGen: -0.5, oxGen: -0.2, foodGen: -0.5, popMax: 5, color: '#00E5FF' },
    mine: { name: 'Miner', cost: 15, powerGen: -0.3, mineralsGen: 0.5, color: '#AA44FF' }
};

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
    COLUMNS = Math.floor(W / GRID_SIZE);
    ROWS = Math.floor(H / GRID_SIZE);
}

function initGame() {
    resources = { power: 100, oxygen: 100, food: 100, population: 5, minerals: 50 };
    buildings = [
        { x: 5, y: 5, type: 'hab' },
        { x: 4, y: 5, type: 'solar' }
    ];
    t = 0;
    overlay.style.display = 'none';
}

function update(allUnits) {
    t++;
    if (t % 60 === 0) {
        // Resource Ticks
        buildings.forEach(b => {
            const def = BUILDING_TYPES[b.type];
            resources.power += def.powerGen || 0;
            resources.oxygen += def.oxGen || 0;
            resources.food += def.foodGen || 0;
            resources.minerals += def.mineralsGen || 0;
        });

        // Consumption
        resources.oxygen -= resources.population * 0.05;
        resources.food -= resources.population * 0.1;

        // Caps
        resources.power = Math.max(0, Math.min(200, resources.power));
        resources.oxygen = Math.max(0, Math.min(100, resources.oxygen));
        resources.food = Math.max(0, Math.min(100, resources.food));

        // State Check
        if (resources.oxygen <= 0 || resources.food <= 0) {
            resources.population *= 0.95; // Die off
            if (resources.population < 1) endGame();
        }
        
        scoreDom.textContent = Math.floor(resources.population * 10 + resources.minerals);
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i <= COLUMNS; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, H); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * GRID_SIZE); ctx.lineTo(W, j * GRID_SIZE); ctx.stroke();
    }

    // Buildings
    buildings.forEach(b => {
        const def = BUILDING_TYPES[b.type];
        ctx.fillStyle = def.color;
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(b.x * GRID_SIZE + 4, b.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);
        ctx.shadowBlur = 0;
    });

    // Cursor
    const mx = Math.floor(mouseX / GRID_SIZE);
    const my = Math.floor(mouseY / GRID_SIZE);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(mx * GRID_SIZE, my * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // HUD
    drawHUD();
}

function drawHUD() {
    const bars = [
        { label: 'POWER', val: resources.power, max: 200, col: '#FFB800' },
        { label: 'OXYGEN', val: resources.oxygen, max: 100, col: '#00E5FF' },
        { label: 'FOOD', val: resources.food, max: 100, col: '#00FF88' }
    ];

    bars.forEach((b, i) => {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(20, 20 + i * 25, 100, 15);
        ctx.fillStyle = b.col;
        ctx.fillRect(20, 20 + i * 25, 100 * (b.val / b.max), 15);
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(b.label, 125, 32 + i * 25);
    });

    ctx.textAlign = 'right';
    ctx.fillText(`Citz: ${Math.floor(resources.population)}`, W - 20, 30);
    ctx.fillText(`Mins: ${Math.floor(resources.minerals)}`, W - 20, 50);

    // Palette
    let i = 0;
    for (const key in BUILDING_TYPES) {
        const def = BUILDING_TYPES[key];
        const x = 20, y = H - 120 + i * 25;
        ctx.fillStyle = key === selectedType ? 'rgba(255,255,255,0.2)' : 'transparent';
        ctx.fillRect(x - 5, y - 15, 150, 20);
        ctx.fillStyle = def.color;
        ctx.fillText(def.name, x + 100, y);
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i+1}:`, x - 15, y);
        i++;
    }
}

let mouseX = 0, mouseY = 0;
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', e => {
    if (!running) return;
    const gx = Math.floor(mouseX / GRID_SIZE);
    const gy = Math.floor(mouseY / GRID_SIZE);
    
    // Check if occupied
    if (buildings.some(b => b.x === gx && b.y === gy)) return;

    const def = BUILDING_TYPES[selectedType];
    if (resources.minerals >= def.cost) {
        resources.minerals -= def.cost;
        buildings.push({ x: gx, y: gy, type: selectedType });
        if (selectedType === 'hab') resources.population += 2;
    }
});

document.addEventListener('keydown', e => {
    if (e.key === '1') selectedType = 'solar';
    if (e.key === '2') selectedType = 'farm';
    if (e.key === '3') selectedType = 'hab';
    if (e.key === '4') selectedType = 'mine';
});

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

function startGame() {
    resize();
    initGame();
    running = true;
    requestAnimationFrame(loop);
}

function endGame() {
    running = false;
    cancelAnimationFrame(raf);
    document.getElementById('overlay-title').textContent = 'COLONY LOST';
    document.getElementById('overlay-msg').innerHTML = `The last colonists have perished.`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
