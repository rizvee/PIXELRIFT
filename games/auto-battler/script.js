// games/auto-battler/script.js — Auto-Battler
// Turn-based auto-combat between two teams of "Pixel-Monsters"

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY = 'auto-battler-high-score';

let W, H;
let running = false;
let raf;
let score = 0;
let best = 0;
let t = 0;

const GRID_SIZE = 40;
const ROWS = 6;
const COLS = 12;

let units = [];
let gameState = 'planning'; // planning | combat | result
let combatTimer = 0;
let round = 1;

class Unit {
    constructor(x, y, team, type) {
        this.gridX = x;
        this.gridY = y;
        this.x = x * GRID_SIZE + GRID_SIZE / 2;
        this.y = y * GRID_SIZE + GRID_SIZE / 2;
        this.team = team; // 'player' | 'enemy'
        this.type = type; // 'warrior' | 'archer' | 'mage'
        this.hp = type === 'warrior' ? 150 : type === 'archer' ? 80 : 60;
        this.maxHp = this.hp;
        this.atk = type === 'warrior' ? 10 : type === 'archer' ? 15 : 20;
        this.range = type === 'warrior' ? 1 : type === 'archer' ? 4 : 3;
        this.color = team === 'player' ? (type === 'warrior' ? '#00E5FF' : type === 'archer' ? '#00FF88' : '#AA44FF') 
                                      : '#FF4D4D';
        this.target = null;
        this.atkCd = 0;
        this.atkRate = type === 'warrior' ? 60 : type === 'archer' ? 45 : 90;
        this.dead = false;
    }

    update(allUnits) {
        if (this.dead) return;
        if (this.atkCd > 0) this.atkCd--;

        // Find target
        if (!this.target || this.target.dead) {
            this.target = this.findNearestEnemy(allUnits);
        }

        if (this.target) {
            const dist = Math.abs(this.gridX - this.target.gridX) + Math.abs(this.gridY - this.target.gridY);
            if (dist <= this.range) {
                // Attack
                if (this.atkCd === 0) {
                    this.target.hp -= this.atk;
                    this.atkCd = this.atkRate;
                    if (this.target.hp <= 0) {
                        this.target.dead = true;
                        this.target = null;
                    }
                }
            } else {
                // Move towards target
                if (t % 30 === 0) { // Move every 0.5s
                    this.moveTowards(this.target.gridX, this.target.gridY, allUnits);
                }
            }
        }

        // Interpolate visual position
        const tx = this.gridX * GRID_SIZE + GRID_SIZE / 2;
        const ty = this.gridY * GRID_SIZE + GRID_SIZE / 2;
        this.x += (tx - this.x) * 0.1;
        this.y += (ty - this.y) * 0.1;
    }

    findNearestEnemy(allUnits) {
        let nearest = null;
        let minDist = Infinity;
        allUnits.forEach(u => {
            if (u.team !== this.team && !u.dead) {
                const d = Math.abs(this.gridX - u.gridX) + Math.abs(this.gridY - u.gridY);
                if (d < minDist) {
                    minDist = d;
                    nearest = u;
                }
            }
        });
        return nearest;
    }

    moveTowards(tx, ty, allUnits) {
        const dx = tx - this.gridX;
        const dy = ty - this.gridY;
        let moveX = 0, moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) moveX = dx > 0 ? 1 : -1;
        else moveY = dy > 0 ? 1 : -1;

        const nx = this.gridX + moveX;
        const ny = this.gridY + moveY;

        // Check if cell is occupied
        const occupied = allUnits.some(u => !u.dead && u.gridX === nx && u.gridY === ny);
        if (!occupied && nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            this.gridX = nx;
            this.gridY = ny;
        }
    }

    draw() {
        if (this.dead) return;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Draw shape based on type
        ctx.beginPath();
        if (this.type === 'warrior') {
            ctx.rect(this.x - 12, this.y - 12, 24, 24);
        } else if (this.type === 'archer') {
            ctx.moveTo(this.x, this.y - 14);
            ctx.lineTo(this.x + 12, this.y + 10);
            ctx.lineTo(this.x - 12, this.y + 10);
            ctx.closePath();
        } else { // mage
            ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // HP bar
        const bw = 30, bh = 4;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x - bw/2, this.y - 20, bw, bh);
        ctx.fillStyle = this.team === 'player' ? '#00FF88' : '#FF4D4D';
        ctx.fillRect(this.x - bw/2, this.y - 20, bw * (this.hp / this.maxHp), bh);
    }
}

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
}

function loadBest() {
    best = parseInt(localStorage.getItem(LS_KEY) || '0');
    bestDom.textContent = best;
}

function saveBest() {
    if (score > best) {
        best = score;
        localStorage.setItem(LS_KEY, best);
        bestDom.textContent = best;
    }
}

function initGame() {
    score = 0;
    round = 1;
    scoreDom.textContent = score;
    units = [];
    spawnPlayerUnits();
    spawnEnemyUnits();
    gameState = 'planning';
    overlay.style.display = 'none';
}

function spawnPlayerUnits() {
    units.push(new Unit(1, 1, 'player', 'warrior'));
    units.push(new Unit(1, 3, 'player', 'archer'));
    units.push(new Unit(1, 5, 'player', 'mage'));
}

function spawnEnemyUnits() {
    const count = Math.min(8, 2 + Math.floor(round / 2));
    for (let i = 0; i < count; i++) {
        const type = ['warrior', 'archer', 'mage'][Math.floor(Math.random() * 3)];
        units.push(new Unit(COLS - 2, Math.floor(Math.random() * ROWS), 'enemy', type));
    }
}

function update() {
    t++;
    if (gameState === 'combat') {
        units.forEach(u => u.update(units));
        
        const playerAlive = units.some(u => u.team === 'player' && !u.dead);
        const enemyAlive = units.some(u => u.team === 'enemy' && !u.dead);

        if (!playerAlive) {
            endGame();
        } else if (!enemyAlive) {
            round++;
            score += 10;
            scoreDom.textContent = score;
            gameState = 'planning';
            setTimeout(() => {
                units = units.filter(u => u.team === 'player' && !u.dead);
                // Heal player units a bit
                units.forEach(u => u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.3));
                spawnEnemyUnits();
            }, 1000);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, ROWS * GRID_SIZE); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(COLS * GRID_SIZE, i * GRID_SIZE); ctx.stroke();
    }

    units.forEach(u => u.draw());

    if (gameState === 'planning') {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${round} - Planning Phase`, W / 2, H - 40);
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillText('Press SPACE to start combat', W / 2, H - 20);
    }
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

function startGame() {
    initGame();
    running = true;
    requestAnimationFrame(loop);
}

function endGame() {
    running = false;
    cancelAnimationFrame(raf);
    saveBest();
    document.getElementById('overlay-title').textContent = 'GAME OVER';
    document.getElementById('overlay-msg').innerHTML = `Round reached: <span style="color:var(--accent)">${round}</span><br>Score: <span style="color:var(--accent)">${score}</span>`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

document.addEventListener('keydown', e => {
    if (e.key === ' ' && gameState === 'planning') {
        gameState = 'combat';
        e.preventDefault();
    }
});

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize(); loadBest();
