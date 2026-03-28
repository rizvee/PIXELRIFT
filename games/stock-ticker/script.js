// games/stock-ticker/script.js — Stock Ticker
// Real-time stock price simulation with Brownian motion

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_PORTFOLIO = 'stock-ticker-portfolio';
const LS_BEST = 'stock-ticker-high-score';

let W, H;
let running = false;
let raf;
let t = 0;

// Game State
let balance = 10000;
let portfolio = { PIXEL: 0, RIFT: 0, VOID: 0 };
let stocks = [
    { name: 'PIXEL', price: 100, history: [], volatility: 0.02, drift: 0.0001, color: '#00E5FF' },
    { name: 'RIFT', price: 50, history: [], volatility: 0.03, drift: -0.0002, color: '#FFB800' },
    { name: 'VOID', price: 200, history: [], volatility: 0.05, drift: 0.0005, color: '#AA44FF' }
];

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function loadGame() {
    const saved = localStorage.getItem(LS_PORTFOLIO);
    if (saved) {
        const data = JSON.parse(saved);
        balance = data.balance;
        portfolio = data.portfolio;
    }
    const best = localStorage.getItem(LS_BEST);
    if (best) bestDom.textContent = Math.floor(best);
}

function saveGame() {
    localStorage.setItem(LS_PORTFOLIO, JSON.stringify({ balance, portfolio }));
    const totalValue = balance + stocks.reduce((sum, s) => sum + s.price * portfolio[s.name], 0);
    const best = parseFloat(localStorage.getItem(LS_BEST) || '0');
    if (totalValue > best) {
        localStorage.setItem(LS_BEST, totalValue);
        bestDom.textContent = Math.floor(totalValue);
    }
}

function updateStocks() {
    stocks.forEach(s => {
        // Geometric Brownian Motion: dS = S * (mu*dt + sigma*dW)
        const mu = s.drift;
        const sigma = s.volatility;
        const dt = 1;
        const dW = (Math.random() - 0.5) * 2;
        const dS = s.price * (mu * dt + sigma * dW);
        s.price = Math.max(1, s.price + dS);
        
        s.history.push(s.price);
        if (s.history.length > 200) s.history.shift();
    });
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Draw Price Charts
    const chartWidth = W - 100;
    const chartHeight = (H - 100) / stocks.length;

    stocks.forEach((s, i) => {
        const oy = 50 + i * (chartHeight + 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeRect(50, oy, chartWidth, chartHeight);

        if (s.history.length > 1) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const min = Math.min(...s.history);
            const max = Math.max(...s.history);
            const range = max - min || 1;

            s.history.forEach((p, j) => {
                const x = 50 + (j / 200) * chartWidth;
                const y = oy + chartHeight - ((p - min) / range) * chartHeight;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Stock Info
        ctx.fillStyle = s.color;
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${s.name}: $${s.price.toFixed(2)}`, 60, oy + 25);
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillText(`Owned: ${portfolio[s.name]}`, 60, oy + 45);
    });

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    const totalValue = balance + stocks.reduce((sum, s) => sum + s.price * portfolio[s.name], 0);
    ctx.fillText(`Net Worth: $${totalValue.toFixed(2)}`, W - 50, 30);
    ctx.fillStyle = '#00FF88';
    ctx.fillText(`Cash: $${balance.toFixed(2)}`, W - 50, 55);

    // Controls Help
    ctx.fillStyle = '#888888';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1/2/3: Buy PIX/RIF/VOI | Q/W/E: Sell PIX/RIF/VOI', W / 2, H - 20);
}

function updateHUD() {
    const totalValue = balance + stocks.reduce((sum, s) => sum + s.price * portfolio[s.name], 0);
    scoreDom.textContent = Math.floor(totalValue);
}

function loop() {
    if (!running) return;
    t++;
    if (t % 10 === 0) {
        updateStocks();
        updateHUD();
        saveGame();
    }
    draw();
    raf = requestAnimationFrame(loop);
}

function buy(idx) {
    const s = stocks[idx];
    if (balance >= s.price) {
        balance -= s.price;
        portfolio[s.name]++;
    }
}

function sell(idx) {
    const s = stocks[idx];
    if (portfolio[s.name] > 0) {
        balance += s.price;
        portfolio[s.name]--;
    }
}

document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === '1') buy(0);
    if (e.key === '2') buy(1);
    if (e.key === '3') buy(2);
    if (e.key === 'q') sell(0);
    if (e.key === 'w') sell(1);
    if (e.key === 'e') sell(2);
});

function startGame() {
    loadGame();
    overlay.style.display = 'none';
    running = true;
    requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
