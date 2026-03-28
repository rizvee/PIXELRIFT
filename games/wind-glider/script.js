// games/wind-glider/script.js — Wind Glider
// Aerodynamic lift and drag vectors based on pitch angle and wind speed

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='wind-glider-high-score';

let W,H,running=false,raf,score=0,best=0;

let glider,wind,thermals,clouds,t;

const G=0.12; // gravity
const AIR_DENSITY=0.02;
const LIFT_COEFF=0.18;
const DRAG_COEFF=0.004;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function initGame(){
  t=0;score=0;scoreDom.textContent=0;
  glider={
    x:W*0.2, y:H*0.5,
    vx:3, vy:0,
    pitch:0, // radians, positive = nose up
    wingSpan:40,
  };
  wind={x:1.5,y:0}; // horizontal wind
  thermals=Array.from({length:5},()=>({
    x:Math.random()*W,
    y:H*0.3+Math.random()*H*0.5,
    r:30+Math.random()*40,
    strength:0.3+Math.random()*0.4,
    drift:0.2+Math.random()*0.3
  }));
  clouds=Array.from({length:12},()=>({
    x:Math.random()*W,y:20+Math.random()*H*0.5,
    w:60+Math.random()*100,h:20+Math.random()*30
  }));
  overlay.style.display='none';
}

const keys={};

function update(){
  t++;

  // Pitch control
  if(keys['ArrowUp']||keys['w'])    glider.pitch=Math.max(-Math.PI/4, glider.pitch-0.03);
  if(keys['ArrowDown']||keys['s'])  glider.pitch=Math.min(Math.PI/4,  glider.pitch+0.03);

  // Wind variability
  wind.x=1.5+Math.sin(t*0.01)*0.5;
  wind.y=Math.cos(t*0.007)*0.3;

  // Aerodynamics: lift is perpendicular to velocity, drag opposes it
  const speed=Math.sqrt(glider.vx**2+glider.vy**2);
  const velAngle=Math.atan2(glider.vy,glider.vx);
  const aoa=glider.pitch-velAngle; // angle of attack

  // Lift force (perpendicular to velocity direction)
  const lift=LIFT_COEFF*speed*speed*Math.sin(aoa*2)*AIR_DENSITY;
  const liftX=-Math.sin(velAngle)*lift;
  const liftY= Math.cos(velAngle)*lift;

  // Drag force (opposing motion)
  const drag=DRAG_COEFF*speed*speed*AIR_DENSITY*(1+Math.abs(aoa));
  const dragX=-Math.cos(velAngle)*drag;
  const dragY=-Math.sin(velAngle)*drag;

  // Thermal lift
  let thermalForce=0;
  thermals.forEach(th=>{
    const dx=glider.x-th.x,dy=glider.y-th.y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<th.r) thermalForce+=th.strength*(1-d/th.r);
    th.x+=th.drift; if(th.x>W)th.x=0;
  });

  // Apply forces
  glider.vx+=liftX+dragX+wind.x*0.02;
  glider.vy+=liftY+dragY+wind.y*0.02+G-thermalForce;

  // Clamp speed
  const spd=Math.sqrt(glider.vx**2+glider.vy**2);
  if(spd>14){glider.vx=glider.vx/spd*14;glider.vy=glider.vy/spd*14;}

  glider.x+=glider.vx;glider.y+=glider.vy;

  // Scroll world (glider moves right, world scrolls)
  thermals.forEach(th=>th.x-=glider.vx*0.5);
  clouds.forEach(c=>{c.x-=glider.vx*0.3; if(c.x+c.w<0)c.x=W+c.w;});

  // Score = distance traveled
  if(t%60===0){score++;scoreDom.textContent=score;}

  // Ground = death
  if(glider.y>H-30||glider.y<0){endGame();return;}
}

function draw(){
  // Sky gradient
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#0d1b2a');sky.addColorStop(1,'#1a3a5c');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

  // Thermals (visible as rising shimmer)
  thermals.forEach(th=>{
    const g=ctx.createRadialGradient(th.x,th.y,0,th.x,th.y,th.r);
    g.addColorStop(0,`rgba(255,180,0,${0.08*th.strength})`);
    g.addColorStop(1,'rgba(255,180,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(th.x,th.y,th.r,0,Math.PI*2);ctx.fill();
    // Up arrows
    ctx.fillStyle=`rgba(255,180,0,0.3)`;
    ctx.font='14px monospace';ctx.textAlign='center';
    ctx.fillText('▲',th.x,th.y-5+Math.sin(t*0.1)*4);
  });

  // Clouds
  clouds.forEach(c=>{
    ctx.fillStyle='rgba(255,255,255,0.06)';
    ctx.beginPath();ctx.ellipse(c.x,c.y,c.w,c.h,0,0,Math.PI*2);ctx.fill();
  });

  // Ground
  ctx.fillStyle='rgba(0,229,255,0.12)';
  ctx.fillRect(0,H-30,W,30);
  ctx.strokeStyle='rgba(0,229,255,0.4)';
  ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();

  // Wind arrow
  ctx.strokeStyle='rgba(0,229,255,0.3)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(60,H-60);ctx.lineTo(60+wind.x*20,H-60+wind.y*20);ctx.stroke();
  ctx.fillStyle='rgba(0,229,255,0.5)';ctx.font='10px JetBrains Mono,monospace';
  ctx.textAlign='left';ctx.fillText('wind',20,H-55);

  // Glider
  ctx.save();
  ctx.translate(glider.x,glider.y);
  ctx.rotate(Math.atan2(glider.vy,glider.vx));
  // Body
  ctx.fillStyle='#FFFFFF';ctx.shadowColor='#FFFFFF';ctx.shadowBlur=10;
  ctx.fillRect(-20,-4,40,8);
  // Wings
  ctx.strokeStyle='rgba(0,229,255,0.9)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-5,-25);ctx.lineTo(0,-4);ctx.lineTo(10,-4);ctx.lineTo(15,-25);
  ctx.moveTo(-5,25);ctx.lineTo(0,4);ctx.lineTo(10,4);ctx.lineTo(15,25);
  ctx.stroke();
  ctx.shadowBlur=0;
  ctx.restore();

  // Pitch indicator
  ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=2;
  const pitchBarX=W-30;
  ctx.strokeRect(pitchBarX,H/2-50,10,100);
  ctx.fillStyle='rgba(0,229,255,0.6)';
  const pitchPct=0.5-glider.pitch/(Math.PI/2);
  ctx.fillRect(pitchBarX,H/2-50+pitchPct*100-5,10,10);
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px JetBrains Mono';
  ctx.textAlign='right';ctx.fillText('↑ pitch',pitchBarX-4,H/2-40);

  ctx.textAlign='left';
}

function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}
function endGame(){
  running=false;cancelAnimationFrame(raf);saveBest();
  document.getElementById('overlay-title').textContent=glider.y>H-30?'CRASHED':'TOO HIGH';
  document.getElementById('overlay-msg').innerHTML=`Distance: <span style="color:var(--accent)">${score}</span>km`;
  startBtn.textContent='FLY AGAIN';overlay.style.display='flex';
}

document.addEventListener('keydown',e=>{keys[e.key]=true;});
document.addEventListener('keyup',e=>{keys[e.key]=false;});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  const ty=e.touches[0].clientY-r.top;
  keys['ArrowUp']=ty<H*0.4;keys['ArrowDown']=ty>H*0.6;
},{passive:false});
canvas.addEventListener('touchend',()=>{keys['ArrowUp']=keys['ArrowDown']=false;});

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize();loadBest();
