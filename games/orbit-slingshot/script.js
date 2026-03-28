// games/orbit-slingshot/script.js — N-body gravity slingshot

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const LS_KEY='orbit-slingshot-high-score';

let W,H,CX,CY;
let running=false,raf,score=0,best=0;

let planets,probe,t,dragging,dragStart,launching;
let trajectory=[];

const G=800; // gravitational constant (scene units)

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  CX=W/2;CY=H/2;
}

function loadBest(){best=parseInt(localStorage.getItem('orbit-slingshot-high-score')||'0');}

function initGame(){
  t=0;score=0;scoreDom.textContent=0;
  planets=[
    {x:CX,y:CY,r:30,mass:5e4,color:'#FFB800',name:'Star'},
    {x:CX+160,y:CY,r:14,mass:8e3,color:'#4FC3F7',name:'Planet A',angle:0,orbitR:160,orbitSpeed:0.008},
    {x:CX-260,y:CY,r:18,mass:1.2e4,color:'#FF6D00',name:'Planet B',angle:Math.PI,orbitR:260,orbitSpeed:0.005},
    {x:CX,y:CY-200,r:10,mass:5e3,color:'#00FF88',name:'Target',angle:Math.PI/2,orbitR:200,orbitSpeed:-0.006,isTarget:true},
  ];
  probe=null;dragging=false;dragStart=null;launching=false;
  trajectory=[];
  overlay.style.display='none';
}

// Predict trajectory for display
function calcTrajectory(px,py,pvx,pvy,steps=300){
  const pts=[];let x=px,y=py,vx=pvx,vy=pvy;
  for(let i=0;i<steps;i++){
    let ax=0,ay=0;
    planets.forEach(p=>{
      const dx=p.x-x,dy=p.y-y;
      const d2=dx*dx+dy*dy;
      const d=Math.sqrt(d2)||1;
      const f=G*p.mass/d2;
      ax+=f*dx/d; ay+=f*dy/d;
    });
    vx+=ax*0.016; vy+=ay*0.016;
    x+=vx; y+=vy;
    pts.push({x,y});
    if(x<-200||x>W+200||y<-200||y>H+200) break;
  }
  return pts;
}

function update(){
  t++;
  // Orbit planets
  planets.forEach(p=>{
    if(!p.orbitR) return;
    p.angle+=p.orbitSpeed;
    p.x=CX+Math.cos(p.angle)*p.orbitR;
    p.y=CY+Math.sin(p.angle)*p.orbitR;
  });

  if(!probe) return;

  // N-body gravity on probe
  let ax=0,ay=0;
  planets.forEach(p=>{
    const dx=p.x-probe.x,dy=p.y-probe.y;
    const d2=dx*dx+dy*dy;
    const d=Math.sqrt(d2)||1;
    const f=G*p.mass/d2;
    ax+=f*dx/d; ay+=f*dy/d;
  });
  probe.vx+=ax*0.016; probe.vy+=ay*0.016;
  probe.x+=probe.vx; probe.y+=probe.vy;
  probe.trail.push({x:probe.x,y:probe.y});
  if(probe.trail.length>200) probe.trail.shift();

  // Collision with planets
  for(const p of planets){
    const dx=probe.x-p.x,dy=probe.y-p.y;
    if(Math.sqrt(dx*dx+dy*dy)<p.r+4){
      if(p.isTarget){ score++;scoreDom.textContent=score;probe=null; return; }
      probe=null; return;
    }
  }
  // Off screen
  if(probe.x<-400||probe.x>W+400||probe.y<-400||probe.y>H+400) probe=null;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // Space
  ctx.fillStyle='#060A10'; ctx.fillRect(0,0,W,H);
  // Stars
  for(let i=0;i<80;i++){
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillRect((i*137.5+t*0.01)%W,(i*79.3)%H,1,1);
  }

  // Predicted trajectory
  if(dragging&&trajectory.length){
    ctx.strokeStyle='rgba(0,229,255,0.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();trajectory.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.stroke();ctx.setLineDash([]);
  }

  // Planets
  planets.forEach(p=>{
    if(p.orbitR){
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(CX,CY,p.orbitR,0,Math.PI*2);ctx.stroke();
    }
    ctx.shadowColor=p.color;ctx.shadowBlur=20;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    if(p.isTarget){
      ctx.strokeStyle='#00FF88';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r+8,0,Math.PI*2);ctx.stroke();
    }
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='9px JetBrains Mono,monospace';
    ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y+p.r+12);
  });

  // Probe trail
  if(probe){
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;
    ctx.beginPath();
    probe.trail.forEach((p,i)=>{
      ctx.globalAlpha=i/probe.trail.length;
      i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);
    });
    ctx.stroke();ctx.globalAlpha=1;
    ctx.shadowColor='#FFFFFF';ctx.shadowBlur=14;
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(probe.x,probe.y,5,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }

  // Launch drag arrow
  if(dragging&&dragStart){
    const rect=canvas.getBoundingClientRect();
    ctx.strokeStyle='#00E5FF';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(dragStart.x,dragStart.y);ctx.lineTo(dragStart.ex,dragStart.ey);ctx.stroke();
    ctx.fillStyle='rgba(0,229,255,0.8)';ctx.font='10px JetBrains Mono,monospace';
    ctx.textAlign='left';ctx.fillText('Release to launch',dragStart.x+8,dragStart.y-8);
  }

  if(!probe&&!dragging){
    ctx.fillStyle='rgba(0,229,255,0.5)';ctx.font='11px JetBrains Mono,monospace';
    ctx.textAlign='center';ctx.fillText('Drag from start point to aim → release to launch',W/2,H-20);
  }
  ctx.textAlign='left';
}

function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}

const LAUNCH_X=()=>W*0.08, LAUNCH_Y=()=>H*0.9;

canvas.addEventListener('mousedown',e=>{
  if(!running||probe)return;
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  dragging=true;
  dragStart={x:LAUNCH_X(),y:LAUNCH_Y(),ex:mx,ey:my};
});
canvas.addEventListener('mousemove',e=>{
  if(!dragging||!dragStart)return;
  const r=canvas.getBoundingClientRect();
  dragStart.ex=e.clientX-r.left;dragStart.ey=e.clientY-r.top;
  const dx=(LAUNCH_X()-dragStart.ex)*0.05,dy=(LAUNCH_Y()-dragStart.ey)*0.05;
  trajectory=calcTrajectory(LAUNCH_X(),LAUNCH_Y(),dx,dy);
});
canvas.addEventListener('mouseup',e=>{
  if(!dragging||!dragStart)return;
  const dx=(LAUNCH_X()-dragStart.ex)*0.05,dy=(LAUNCH_Y()-dragStart.ey)*0.05;
  probe={x:LAUNCH_X(),y:LAUNCH_Y(),vx:dx,vy:dy,trail:[]};
  dragging=false;dragStart=null;trajectory=[];
});

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',()=>{resize();if(!running)draw();});
resize();loadBest();
