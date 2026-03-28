// games/pixel-jumper/script.js — Pixel Jumper
// Sub-pixel momentum, wall jumping, camera tracks player Y

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'pixel-jumper-high-score';

let W, H;
let running=false, raf, score=0, best=0;
const keys={};

// Sub-pixel physics constants
const GRAVITY=0.45;
const MAX_FALL=14;
const MOVE_SPEED=4;
const JUMP_FORCE=-11;
const WALL_JUMP_X=5;
const WALL_JUMP_Y=-9;

let player, platforms, cameraY, highestY;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function generatePlatforms(fromY, count){
  const plats=[];
  let y=fromY;
  for(let i=0;i<count;i++){
    const w=60+Math.random()*100;
    const x=Math.random()*(W-w);
    plats.push({x,y,w,h:12});
    y-=70+Math.random()*60;
  }
  return plats;
}

function initGame(){
  score=0; scoreDom.textContent=0;
  player={
    x:W/2-12, y:H-100,
    vx:0, vy:0,
    w:24, h:32,
    onGround:false,
    onWallL:false, onWallR:false,
    canWallJump:false,
    coyoteTime:0
  };
  cameraY=0;
  highestY=player.y;
  // Starting floor
  platforms=[{x:0,y:H-50,w:W,h:20}];
  platforms=platforms.concat(generatePlatforms(H-150, 80));
  overlay.style.display='none';
}

function update(){
  // Horizontal movement
  let moveX=0;
  if(keys['ArrowLeft']||keys['a']||keys['A']) moveX=-MOVE_SPEED;
  if(keys['ArrowRight']||keys['d']||keys['D']) moveX=MOVE_SPEED;

  player.vx=moveX;

  // Gravity
  player.vy=Math.min(player.vy+GRAVITY, MAX_FALL);

  // Coyote time
  if(player.onGround) player.coyoteTime=8;
  else if(player.coyoteTime>0) player.coyoteTime--;

  // --- Move X
  player.x+=player.vx;
  // Screen wrap for X
  if(player.x+player.w<0) player.x=W;
  if(player.x>W) player.x=-player.w;

  // --- Move Y
  player.y+=player.vy;

  player.onGround=false;
  player.onWallL=false;
  player.onWallR=false;

  // Platform collision
  for(const p of platforms){
    const pRight=p.x+p.w, pBottom=p.y+p.h;
    const plRight=player.x+player.w, plBottom=player.y+player.h;

    // AABB overlap
    if(player.x<pRight&&plRight>p.x&&player.y<pBottom&&plBottom>p.y){
      // From above
      if(player.vy>0&&plBottom-p.y<player.h&&player.y<p.y){
        player.y=p.y-player.h;
        player.vy=0;
        player.onGround=true;
      }
      // Wall left
      else if(moveX>0&&plRight-p.x<player.w){
        player.x=p.x-player.w;
        player.onWallR=true;
      }
      // Wall right
      else if(moveX<0&&p.x-player.x<player.w){
        player.x=pRight;
        player.onWallL=true;
      }
    }
  }

  // Fall off screen = death
  if(player.y>H+200){ endGame(); return; }

  // Track height
  const screenY=player.y-cameraY;
  if(screenY<H*0.4){
    cameraY=player.y-H*0.4;
  }
  // Score = height climbed
  const height=Math.round(Math.max(0,((H-highestY)-player.y+(highestY-(H-highestY)))/30));
  if(player.y<highestY){
    highestY=player.y;
    score=Math.round((H-player.y)/30);
    scoreDom.textContent=score;
  }

  // Extend platforms as player climbs
  const lowestPlatY=Math.min(...platforms.map(p=>p.y));
  if(lowestPlatY>cameraY-200){
    platforms=platforms.concat(generatePlatforms(lowestPlatY-50, 20));
  }
  // Trim platforms below screen
  platforms=platforms.filter(p=>p.y<cameraY+H+200);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.translate(0,-cameraY);

  // Platforms
  platforms.forEach(p=>{
    const gradient=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
    gradient.addColorStop(0,'#00E5FF');
    gradient.addColorStop(1,'rgba(0,229,255,0.2)');
    ctx.fillStyle=gradient;
    ctx.shadowColor='#00E5FF';
    ctx.shadowBlur=6;
    ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.shadowBlur=0;
  });

  // Player
  const wallSlide=player.onWallL||player.onWallR;
  ctx.shadowColor=wallSlide?'#FFB800':'#FFFFFF';
  ctx.shadowBlur=14;
  ctx.fillStyle=wallSlide?'#FFB800':'#FFFFFF';
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;

  // Velocity trail
  if(Math.abs(player.vy)>5){
    ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.fillRect(player.x+4,player.y+player.h,player.w-8,player.vy*0.5);
  }

  ctx.restore();
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function jump(){
  if(!running) return;
  if(player.coyoteTime>0){
    player.vy=JUMP_FORCE;
    player.coyoteTime=0;
  } else if(player.onWallL||player.onWallR){
    // Wall jump
    player.vy=WALL_JUMP_Y;
    player.vx=player.onWallL?WALL_JUMP_X:-WALL_JUMP_X;
  }
}

document.addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){ jump(); e.preventDefault(); }
});
document.addEventListener('keyup',e=>{ keys[e.key]=false; });

// Touch
let touchX0=null;
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  touchX0=e.touches[0].clientX;
  jump();
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(!touchX0||!running) return;
  const dx=e.touches[0].clientX-touchX0;
  keys['ArrowLeft']=dx<-20;
  keys['ArrowRight']=dx>20;
},{passive:false});
canvas.addEventListener('touchend',()=>{ keys['ArrowLeft']=keys['ArrowRight']=false; touchX0=null; });

function startGame(){ initGame(); running=true; raf=requestAnimationFrame(loop); }
function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  document.getElementById('overlay-title').textContent='FELL';
  document.getElementById('overlay-msg').innerHTML=`Height: <span style="color:var(--accent)">${score}</span>m`;
  startBtn.textContent='RETRY';
  overlay.style.display='flex';
}

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
