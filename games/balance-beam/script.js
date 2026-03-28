// games/balance-beam/script.js — Balance Beam
// Center of mass calculations and rotational torque math

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='balance-beam-high-score';

let W,H,running=false,raf,score=0,best=0,t=0;
let beam,objects,spawnTimer,angVel,maxAngle;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

const SHAPES=['box','circle','triangle'];
const COLS=['#00E5FF','#FFB800','#FF4D4D','#AA44FF','#00FF88'];

function initGame(){
  t=0;score=0;scoreDom.textContent=0;
  // Beam properties
  beam={
    cx:W/2, cy:H*0.55,
    length:W*0.6,
    angle:0,
    pivot:{x:W/2,y:H*0.55}
  };
  angVel=0;
  maxAngle=Math.PI/3;
  objects=[];
  spawnTimer=0;
  overlay.style.display='none';
}

function spawnObject(){
  const side=Math.random()<0.5?-1:1;
  const x=beam.cx+side*(40+Math.random()*beam.length*0.4);
  const mass=1+Math.random()*4;
  const r=10+mass*3;
  objects.push({
    x,y:-60, vy:0,
    mass,r,
    shape:SHAPES[Math.floor(Math.random()*3)],
    color:COLS[Math.floor(Math.random()*5)],
    onBeam:false,
    beamFraction:0 // position along beam relative to center, in [-1,1]
  });
}

function getBeamY(bx){
  // Beam angle: left end rises when right is heavier
  const fraction=(bx-beam.cx)/(beam.length/2);
  return beam.cy+fraction*(beam.length/2)*Math.sin(beam.angle);
}

function update(){
  t++;spawnTimer++;
  if(spawnTimer>120-score*2){spawnTimer=0;spawnObject();}

  // Physics: torque = sum of (mass * g * distance from pivot)
  let torque=0,totalMass=0;
  objects.forEach(o=>{
    if(!o.onBeam)return;
    const d=o.x-beam.cx; // distance from pivot (+right, -left)
    torque+=o.mass*d;
    totalMass+=o.mass;
  });

  const I=500+(totalMass*10); // moment of inertia estimate
  const angAccel=torque/I*0.005;
  angVel=(angVel+angAccel)*0.97;
  angVel=Math.max(-0.04,Math.min(0.04,angVel));
  beam.angle+=angVel;

  if(Math.abs(beam.angle)>maxAngle){endGame();return;}

  // Score for time balanced
  if(t%120===0&&Math.abs(beam.angle)<0.3){score++;scoreDom.textContent=score;}

  // Drop objects
  objects.forEach(o=>{
    if(o.onBeam){
      // Let objects slide slightly with beam tilt
      o.x+=Math.sin(beam.angle)*o.mass*0.02;
      o.y=getBeamY(o.x)-o.r;
      // Fall off edges
      if(Math.abs(o.x-beam.cx)>beam.length/2){o.onBeam=false;}
    } else {
      o.vy+=0.4;
      o.y+=o.vy;
      // Land on beam?
      const beamY=getBeamY(o.x);
      if(o.y+o.r>=beamY&&o.y<beamY&&Math.abs(o.x-beam.cx)<beam.length/2){
        o.y=beamY-o.r;o.vy=0;o.onBeam=true;
      }
      // Remove fallen below screen
      if(o.y>H+100){ objects=objects.filter(x=>x!==o); }
    }
  });
}

function drawShape(sh,x,y,r,col){
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=8;
  ctx.beginPath();
  if(sh==='circle') ctx.arc(x,y,r,0,Math.PI*2);
  else if(sh==='box') ctx.rect(x-r,y-r,r*2,r*2);
  else{ ctx.moveTo(x,y-r);ctx.lineTo(x+r*0.866,y+r*0.5);ctx.lineTo(x-r*0.866,y+r*0.5);ctx.closePath(); }
  ctx.fill();ctx.shadowBlur=0;
}

function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  // Fulcrum triangle
  ctx.fillStyle='rgba(0,229,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(beam.cx,beam.cy+20);
  ctx.lineTo(beam.cx-15,beam.cy+40);ctx.lineTo(beam.cx+15,beam.cy+40);
  ctx.closePath();ctx.fill();
  // Stand
  ctx.fillStyle='rgba(0,229,255,0.3)';
  ctx.fillRect(beam.cx-4,beam.cy+40,8,H-beam.cy-40);

  ctx.save();
  ctx.translate(beam.cx,beam.cy);
  ctx.rotate(beam.angle);
  // Beam plank
  const bl=beam.length/2;
  const bh=14;
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.strokeStyle='rgba(255,255,255,0.6)';
  ctx.lineWidth=2;
  ctx.fillRect(-bl,-bh/2,bl*2,bh);
  ctx.strokeRect(-bl,-bh/2,bl*2,bh);
  ctx.restore();

  // Objects (world coords)
  objects.forEach(o=>drawShape(o.shape,o.x,o.y,o.r,o.color));

  // Angle indicator
  const pct=Math.abs(beam.angle)/maxAngle;
  ctx.fillStyle=`hsl(${120-pct*120},80%,60%)`;
  ctx.fillRect(W-24,H-24-(pct*100),14,(pct*100));
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.strokeRect(W-24,H-124,14,100);
}

function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}
function endGame(){
  running=false;cancelAnimationFrame(raf);saveBest();
  document.getElementById('overlay-title').textContent='TIPPED';
  document.getElementById('overlay-msg').innerHTML=`Score: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='TRY AGAIN';overlay.style.display='flex';
}

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize();loadBest();
