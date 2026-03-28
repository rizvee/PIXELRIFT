// games/orbit-racer/script.js — Orbit Racer
// Centripetal force path: player switches orbital rings to dodge debris

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'orbit-racer-high-score';

let W, H, CX, CY;
let running=false, raf, score=0, best=0, t=0;

// Orbital rings (radius from center)
const RING_COUNT = 3;
const RING_COLORS = ['#00E5FF','#FFB800','#FF4D4D'];
let rings, playerRing, playerAngle, playerSpeed;
let debris, spawnTimer, spawnInterval;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  CX=W/2; CY=H/2;
}

function ringRadius(i){ return 70 + i*80; }

function initGame(){
  t=0; score=0; scoreDom.textContent=0;
  playerRing=1; playerAngle=0; playerSpeed=0.025;
  debris=[];
  spawnTimer=0; spawnInterval=90;
  rings=[0,1,2].map(i=>({ r:ringRadius(i) }));
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function spawnDebris(){
  const ring=Math.floor(Math.random()*RING_COUNT);
  const angle=Math.random()*Math.PI*2;
  const angSpeed=0.015+Math.random()*0.01;
  const dir=Math.random()<0.5?1:-1;
  debris.push({ring, angle, angSpeed:angSpeed*dir, r:8});
}

function update(){
  t++;
  // Accelerate player
  playerSpeed=Math.min(0.06, 0.025+t*0.000025);
  playerAngle=(playerAngle+playerSpeed)%(Math.PI*2);

  // Score per second
  if(t%60===0){ score++; scoreDom.textContent=score; }

  // Spawn debris
  spawnTimer++;
  if(spawnTimer>=spawnInterval){
    spawnTimer=0;
    spawnInterval=Math.max(25,90-Math.floor(score*2));
    spawnDebris();
    if(score>5) spawnDebris();
  }

  // Move debris
  debris.forEach(d=>{ d.angle=(d.angle+d.angSpeed)%(Math.PI*2); });

  // Collision
  const pr=ringRadius(playerRing);
  const px=CX+Math.cos(playerAngle)*pr;
  const py=CY+Math.sin(playerAngle)*pr;

  for(const d of debris){
    const dr=ringRadius(d.ring);
    const dx=CX+Math.cos(d.angle)*dr;
    const dy=CY+Math.sin(d.angle)*dr;
    const dist=Math.sqrt((px-dx)**2+(py-dy)**2);
    if(dist<12+d.r){ endGame(); return; }
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);

  // Starfield
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  // Orbital rings
  rings.forEach((r,i)=>{
    ctx.strokeStyle=`rgba(${i===0?'0,229,255':i===1?'255,184,0':'255,77,77'},0.15)`;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(CX,CY,ringRadius(i),0,Math.PI*2);
    ctx.stroke();
  });

  // Debris
  debris.forEach(d=>{
    const dr=ringRadius(d.ring);
    const dx=CX+Math.cos(d.angle)*dr;
    const dy=CY+Math.sin(d.angle)*dr;
    ctx.shadowColor=RING_COLORS[d.ring];
    ctx.shadowBlur=12;
    ctx.fillStyle=RING_COLORS[d.ring];
    ctx.beginPath();
    // Draw as rotating square
    ctx.save();
    ctx.translate(dx,dy);
    ctx.rotate(t*0.05);
    ctx.fillRect(-d.r,-d.r,d.r*2,d.r*2);
    ctx.restore();
  });
  ctx.shadowBlur=0;

  // Player
  const pr=ringRadius(playerRing);
  const px=CX+Math.cos(playerAngle)*pr;
  const py=CY+Math.sin(playerAngle)*pr;
  ctx.shadowColor='#00E5FF';
  ctx.shadowBlur=20;
  ctx.fillStyle='#00E5FF';
  ctx.beginPath();
  ctx.arc(px,py,10,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur=0;

  // Center pulse
  ctx.strokeStyle='rgba(0,229,255,0.08)';
  ctx.lineWidth=1;
  const pulse=Math.sin(t*0.05)*10;
  ctx.beginPath();
  ctx.arc(CX,CY,20+pulse,0,Math.PI*2);
  ctx.stroke();
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function startGame(){
  initGame();
  overlay.style.display='none';
  running=true;
  requestAnimationFrame(loop);
}

function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  document.getElementById('overlay-title').textContent='DESTROYED';
  document.getElementById('overlay-msg').innerHTML=`Score: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='RETRY';
  overlay.style.display='flex';
}

// Input: tap/click to switch ring up, right-click/shift to switch down
document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowUp'||e.key==='w'||e.key==='W')
    playerRing=Math.max(0,playerRing-1);
  if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')
    playerRing=Math.min(RING_COUNT-1,playerRing+1);
  if(e.key===' '){ playerRing=(playerRing+1)%RING_COUNT; e.preventDefault(); }
});
canvas.addEventListener('click',e=>{
  if(!running)return;
  const rect=canvas.getBoundingClientRect();
  const cy=e.clientY-rect.top;
  if(cy<H/2) playerRing=Math.max(0,playerRing-1);
  else        playerRing=Math.min(RING_COUNT-1,playerRing+1);
});
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(!running)return;
  const rect=canvas.getBoundingClientRect();
  const cy=e.touches[0].clientY-rect.top;
  if(cy<H/2) playerRing=Math.max(0,playerRing-1);
  else        playerRing=Math.min(RING_COUNT-1,playerRing+1);
},{passive:false});

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',()=>{resize();});
resize(); loadBest();
