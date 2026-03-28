// games/time-reversal/script.js — Chrono Shift
// Store state snapshot every frame. Hold Shift/Space to rewind.

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'time-reversal-high-score';

let W, H;
let running=false, raf, score=0, best=0;
const keys={};

const GRAVITY=0.5, JUMP=-11, MOVE=4;
const MAX_HISTORY=1200; // 20s at 60fps

let player, platforms, orbs, stateHistory, rewinding, frameCount, cameraY;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function makePlatforms(){
  const plats=[{x:0,y:H-50,w:W,h:20}];
  let y=H-130;
  while(y>-2000){
    const w=70+Math.random()*120;
    plats.push({x:Math.random()*(W-w),y,w,h:12});
    y-=80+Math.random()*60;
  }
  return plats;
}

function makeOrbs(plats){
  return plats.slice(2).map(p=>({
    x:p.x+p.w/2, y:p.y-20, r:8,
    collected:false
  }));
}

function initGame(){
  score=0; rewinding=false; frameCount=0; cameraY=0;
  scoreDom.textContent=0;
  player={x:W/2,y:H-100,vx:0,vy:0,w:20,h:28,onGround:false,dead:false};
  platforms=makePlatforms();
  orbs=makeOrbs(platforms);
  stateHistory=[];
  overlay.style.display='none';
}

function captureState(){
  // Keep last MAX_HISTORY frames
  if(stateHistory.length>=MAX_HISTORY) stateHistory.shift();
  stateHistory.push({
    px:player.x, py:player.y, pvx:player.vx, pvy:player.vy,
    pGround:player.onGround,
    orbs: orbs.map(o=>o.collected),
    score
  });
}

function restoreState(){
  if(!stateHistory.length) return;
  const s=stateHistory.pop();
  player.x=s.px; player.y=s.py; player.vx=s.pvx; player.vy=s.pvy;
  player.onGround=s.pGround; player.dead=false;
  orbs.forEach((o,i)=>o.collected=s.orbs[i]);
  score=s.score;
  scoreDom.textContent=score;
  // Reset camera
  if(player.y-cameraY<H*0.4) cameraY=player.y-H*0.4;
}

function update(){
  frameCount++;
  rewinding=keys['Shift']||keys['r']||keys['R']||keys['z'];

  if(rewinding){
    restoreState();
    return;
  }

  captureState();

  // Horizontal
  player.vx=0;
  if(keys['ArrowLeft']||keys['a']) player.vx=-MOVE;
  if(keys['ArrowRight']||keys['d']) player.vx=MOVE;

  // Gravity
  player.vy=Math.min(player.vy+GRAVITY,16);

  player.x+=player.vx;
  player.y+=player.vy;
  player.x=Math.max(0,Math.min(W-player.w,player.x));

  player.onGround=false;
  for(const p of platforms){
    const pb=player.y+player.h;
    if(player.x+player.w>p.x&&player.x<p.x+p.w&&pb>p.y&&pb<p.y+p.h+player.vy+2&&player.vy>=0){
      player.y=p.y-player.h; player.vy=0; player.onGround=true;
    }
  }

  // Collect orbs
  orbs.forEach(o=>{
    if(o.collected) return;
    if(Math.abs(player.x+player.w/2-o.x)<16&&Math.abs(player.y+player.h/2-o.y)<16){
      o.collected=true; score++; scoreDom.textContent=score;
    }
  });

  // Fall off = die — but can rewind!
  if(player.y>H+200){ player.dead=true; endGame(); return; }

  // Camera
  if(player.y-cameraY<H*0.4) cameraY=player.y-H*0.4;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // Rewind tint
  ctx.fillStyle=rewinding?'rgba(170,68,255,0.08)':'#0A0A0A';
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.translate(0,-cameraY);

  // Platforms
  platforms.forEach(p=>{
    ctx.fillStyle='#1E1E1E';
    ctx.strokeStyle=rewinding?'rgba(170,68,255,0.8)':'rgba(0,229,255,0.4)';
    ctx.lineWidth=1;
    ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.strokeRect(p.x,p.y,p.w,p.h);
  });

  // Orbs
  orbs.forEach(o=>{
    if(o.collected) return;
    ctx.shadowColor='#FFB800';
    ctx.shadowBlur=10;
    ctx.fillStyle='#FFB800';
    ctx.beginPath();
    ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
  });

  // Player — pulse effect during rewind
  const col=rewinding?'rgba(170,68,255,0.9)':'#FFFFFF';
  ctx.shadowColor=col; ctx.shadowBlur=rewinding?20:8;
  ctx.fillStyle=col;
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;

  // Rewind indicator strip
  if(rewinding){
    ctx.fillStyle='rgba(170,68,255,0.25)';
    const progress=stateHistory.length/MAX_HISTORY;
    ctx.fillRect(player.x,player.y-6,player.w*progress,3);
  }

  ctx.restore();

  // Rewind bar
  ctx.fillStyle='rgba(170,68,255,0.2)';
  ctx.fillRect(20,H-16,W-40,6);
  ctx.fillStyle='#AA44FF';
  const rewindFill=(stateHistory.length/MAX_HISTORY)*(W-40);
  ctx.fillRect(20,H-16,rewindFill,6);
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.font='10px JetBrains Mono,monospace';
  ctx.textAlign='right';
  ctx.fillText(rewinding?'◄◄ REWINDING':'HOLD Shift/R to rewind',W-20,H-20);
  ctx.textAlign='left';
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function startGame(){ initGame(); running=true; raf=requestAnimationFrame(loop); }
function endGame(){
  running=false; cancelAnimationFrame(raf); saveBest();
  document.getElementById('overlay-title').textContent='FELL — use REWIND next time!';
  document.getElementById('overlay-msg').innerHTML=`Orbs: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='RETRY';
  overlay.style.display='flex';
}

document.addEventListener('keydown',e=>{
  keys[e.key]=true;
  if((e.key==='ArrowUp'||e.key==='w'||e.key===' ')&&player?.onGround){
    player.vy=JUMP; e.preventDefault();
  }
});
document.addEventListener('keyup',e=>{ keys[e.key]=false; });

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
