// games/echo-runner/script.js — Echo Runner
// Records player movement history. Each round survived spawns a new ghost.

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'echo-runner-high-score';

let W, H, running=false, raf, score=0, best=0;

const SPEED=3, GHOST_SIZE=12, SURVIVE_TIME=600; // 10s at 60fps
const keys={};

let player, ghosts, history, frameCount, roundTime;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function initGame(){
  score=0; scoreDom.textContent=0;
  player={x:W/2,y:H/2,r:10};
  ghosts=[];
  history=[{x:W/2,y:H/2}];
  frameCount=0; roundTime=0;
  overlay.style.display='none';
}

function spawnGhost(){
  // Each ghost replays history from the start of the last round
  ghosts.push({ trail:history.slice(), frame:0, r:GHOST_SIZE/2, alpha:0.6-ghosts.length*0.08 });
  history=[];
}

function update(){
  frameCount++; roundTime++;

  // Player movement
  let dx=0, dy=0;
  if(keys['ArrowLeft']||keys['a']||keys['A']) dx-=SPEED;
  if(keys['ArrowRight']||keys['d']||keys['D']) dx+=SPEED;
  if(keys['ArrowUp']||keys['w']||keys['W']) dy-=SPEED;
  if(keys['ArrowDown']||keys['s']||keys['S']) dy+=SPEED;

  // Normalize diagonal
  if(dx&&dy){ dx*=0.707; dy*=0.707; }

  player.x=Math.max(player.r,Math.min(W-player.r,player.x+dx));
  player.y=Math.max(player.r,Math.min(H-player.r,player.y+dy));

  // Record history every frame
  history.push({x:player.x,y:player.y});

  // Advance ghosts
  ghosts.forEach(g=>{
    if(g.frame<g.trail.length) g.frame++;
  });

  // Check collision with any ghost
  for(const g of ghosts){
    const idx=Math.min(g.frame,g.trail.length-1);
    const gx=g.trail[idx].x, gy=g.trail[idx].y;
    const d=Math.sqrt((player.x-gx)**2+(player.y-gy)**2);
    if(d<player.r+g.r*2){ endGame(); return; }
  }

  // Survive long enough? Spawn new ghost
  if(roundTime>=SURVIVE_TIME){
    roundTime=0;
    score++;
    scoreDom.textContent=score;
    spawnGhost();
  }
}

function draw(){
  ctx.fillStyle='rgba(10,10,10,0.35)';
  ctx.fillRect(0,0,W,H);

  // Ghost trails
  ghosts.forEach((g,gi)=>{
    const hue=180+gi*30;
    for(let i=0;i<g.trail.length;i+=3){
      const alpha=(i/g.trail.length)*0.15;
      ctx.fillStyle=`hsla(${hue},80%,60%,${alpha})`;
      ctx.beginPath();
      ctx.arc(g.trail[i].x,g.trail[i].y,4,0,Math.PI*2);
      ctx.fill();
    }
    // Ghost current position
    const idx=Math.min(g.frame,g.trail.length-1);
    ctx.shadowColor=`hsl(${hue},80%,60%)`;
    ctx.shadowBlur=16;
    ctx.fillStyle=`hsla(${hue},80%,60%,${g.alpha})`;
    ctx.beginPath();
    ctx.arc(g.trail[idx].x,g.trail[idx].y,g.r*2,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
  });

  // Player trail
  const trailLen=Math.min(history.length,60);
  for(let i=history.length-trailLen;i<history.length;i++){
    const alpha=((i-(history.length-trailLen))/trailLen)*0.4;
    ctx.fillStyle=`rgba(0,229,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(history[i].x,history[i].y,4,0,Math.PI*2);
    ctx.fill();
  }

  // Player
  ctx.shadowColor='#00E5FF';
  ctx.shadowBlur=20;
  ctx.fillStyle='#00E5FF';
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur=0;

  // Survive timer arc
  const pct=roundTime/SURVIVE_TIME;
  ctx.strokeStyle='rgba(0,229,255,0.3)';
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r+8,-Math.PI/2,-Math.PI/2+pct*Math.PI*2);
  ctx.stroke();

  // Ghost count warning
  if(ghosts.length>0){
    ctx.fillStyle=`rgba(255,${Math.max(0,229-ghosts.length*40)},${Math.max(0,255-ghosts.length*60)},0.7)`;
    ctx.font='12px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(`${ghosts.length} echo${ghosts.length>1?'s':''}`,W/2,30);
  }
  ctx.textAlign='left';
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function startGame(){
  initGame();
  running=true;
  raf=requestAnimationFrame(loop);
}

function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  document.getElementById('overlay-title').textContent='CAUGHT';
  document.getElementById('overlay-msg').innerHTML=`Echoes survived: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='TRY AGAIN';
  overlay.style.display='flex';
}

document.addEventListener('keydown',e=>{keys[e.key]=true;});
document.addEventListener('keyup',e=>{keys[e.key]=false;});

// Touch joystick
let touchStart=null;
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; },{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(!touchStart||!running) return;
  const dx=e.touches[0].clientX-touchStart.x;
  const dy=e.touches[0].clientY-touchStart.y;
  keys['ArrowLeft']=dx<-10; keys['ArrowRight']=dx>10;
  keys['ArrowUp']=dy<-10;   keys['ArrowDown']=dy>10;
},{passive:false});
canvas.addEventListener('touchend',()=>{ keys['ArrowLeft']=keys['ArrowRight']=keys['ArrowUp']=keys['ArrowDown']=false; });

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
