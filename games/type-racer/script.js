// games/type-racer/script.js — Type Racer
// High-speed word matching with WPM tracking

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

const WORDS = ["PIXEL", "RIFT", "VOID", "CORE", "GLITCH", "VECTOR", "GEAR", "SYNTH", "NEON", "CHROME", "DATA", "FLOW", "BUFFER", "FRAME", "LOGIC", "SHIFT", "GRID", "QUANTUM", "SIGNAL", "WAVE"];
let currentWord = "";
let inputBuffer = "";
let wpm = 0;
let startTime = 0;
let completed = 0;

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function nextWord() {
    currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    inputBuffer = "";
}

function initGame() {
    completed = 0; wpm = 0; t = 0;
    startTime = Date.now();
    nextWord();
    overlay.style.display = 'none';
}

function update() {
    t++;
    const elapsed = (Date.now() - startTime) / 60000;
    if (elapsed > 0) wpm = Math.floor(completed / elapsed);
    scoreDom.textContent = wpm;
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;

    // Word display
    ctx.font = 'bold 48px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    
    // Split for coloring correct characters
    const textW = ctx.measureText(currentWord).width;
    let startX = cx - textW / 2;
    
    for (let i = 0; i < currentWord.length; i++) {
        const char = currentWord[i];
        const match = inputBuffer[i] === char;
        ctx.fillStyle = match ? '#00FF88' : '#333';
        ctx.fillText(char, startX + ctx.measureText(currentWord.substring(0, i)).width + ctx.measureText(char).width / 2, cy);
    }

    // Cursor
    const cursorX = startX + ctx.measureText(inputBuffer).width;
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(cursorX, cy + 10, ctx.measureText(currentWord[inputBuffer.length] || ' ').width, 4);

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px JetBrains Mono, monospace';
    ctx.fillText(`${wpm} WPM`, W / 2, cy + 80);
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Words: ${completed}`, W / 2, cy + 105);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key.length === 1) {
        if (e.key.toUpperCase() === currentWord[inputBuffer.length]) {
            inputBuffer += e.key.toUpperCase();
            if (inputBuffer === currentWord) {
                completed++;
                nextWord();
            }
        } else {
            // Mistake flash
            ctx.fillStyle = 'rgba(255, 77, 77, 0.2)';
            ctx.fillRect(0, 0, W, H);
        }
    }
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
