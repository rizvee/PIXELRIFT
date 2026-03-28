// games/tower-defense/script.js — Tower Defense
// Waypoint-based enemy movement and proximity-based tower fire

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const scoreDom = document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY = 'tower-defense-high-score';

let W, H;
let running = false;
let raf;
let t = 0;

// Game State
let life = 20;
let money = 100;
let score = 0;
let wave = 1;

let towers = [];
let enemies = [];
let projectiles = [];
let waypoints = [];

const GRID_SIZE = 40;

function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
    // Generate waypoints based on screen size
    waypoints = [
        { x: -50, y: H / 2 },
        { x: W * 0.2, y: H / 2 },
        { x: W * 0.2, y: H * 0.2 },
        { x: W * 0.8, y: H * 0.2 },
        { x: W * 0.8, y: H * 0.8 },
        { x: W * 0.5, y: H * 0.8 },
        { x: W * 0.5, y: H + 50 }
    ];
}

class Enemy {
    constructor(wave) {
        this.wpIdx = 0;
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        this.speed = 1 + wave * 0.1;
        this.hp = 20 + wave * 10;
        this.maxHp = this.hp;
        this.dead = false;
    }

    update() {
        const target = waypoints[this.wpIdx + 1];
        if (!target) {
            this.dead = true;
            life--;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) {
            this.wpIdx++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (this.hp <= 0) {
            this.dead = true;
            money += 15;
            score += 10;
        }
    }

    draw() {
        ctx.fillStyle = '#FF4D4D';
        ctx.shadowColor = '#FF4D4D';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // HP bar
        const bw = 24, bh = 3;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x - bw / 2, this.y - 15, bw, bh);
        ctx.fillStyle = '#FF4D4D';
        ctx.fillRect(this.x - bw / 2, this.y - 15, bw * (this.hp / this.maxHp), bh);
    }
}

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 150;
        this.atkCd = 0;
        this.atkRate = 30;
    }

    update(enemies) {
        if (this.atkCd > 0) this.atkCd--;

        if (this.atkCd === 0) {
            const target = enemies.find(e => {
                const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                return d <= this.range && !e.dead;
            });

            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target));
                this.atkCd = this.atkRate;
            }
        }
    }

    draw() {
        ctx.fillStyle = '#00E5FF';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Projectile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 10;
        this.dead = false;
    }

    update() {
        if (this.target.dead) { this.dead = true; return; }
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) {
            this.target.hp -= 10;
            this.dead = true;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initGame() {
    life = 20; money = 200; score = 0; wave = 1;
    towers = []; enemies = []; projectiles = [];
    overlay.style.display = 'none';
}

function updateHUD() {
    scoreDom.textContent = score;
}

function update() {
    t++;
    if (t % 120 === 0) enemies.push(new Enemy(wave));
    if (t % 1200 === 0) wave++;

    enemies.forEach(e => e.update());
    enemies = enemies.filter(e => !e.dead);
    
    towers.forEach(tw => tw.update(enemies));
    projectiles.forEach(p => p.update());
    projectiles = projectiles.filter(p => !p.dead);

    if (life <= 0) endGame();
    updateHUD();
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, W, H);

    // Path
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 40;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
    });
    ctx.stroke();

    enemies.forEach(e => e.draw());
    towers.forEach(tw => tw.draw());
    projectiles.forEach(p => p.draw());

    // HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`♥ ${life}`, 20, 30);
    ctx.fillStyle = '#FFB800';
    ctx.fillText(`$ ${money}`, 20, 55);
    ctx.textAlign = 'right';
    ctx.fillText(`Wave ${wave}`, W - 20, 30);
    
    // Help
    ctx.fillStyle = '#888888';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click to build Tower ($50)', W / 2, H - 20);
}

function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
}

canvas.addEventListener('click', e => {
    if (!running) return;
    if (money >= 50) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        towers.push(new Tower(mx, my));
        money -= 50;
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
    document.getElementById('overlay-title').textContent = 'DEFENSE BREACHED';
    document.getElementById('overlay-msg').innerHTML = `Enemies destroyed: <span style="color:var(--accent)">${score/10}</span><br>Wave survived: <span style="color:var(--accent)">${wave}</span>`;
    startBtn.textContent = 'RETRY';
    overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', resize);
resize();
