// games/bridge-builder/script.js — Bridge Builder
// Spring-mass system with stress threshold breaking

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
let W,H;

const GRAVITY=0.4,DAMPING=0.97,ITERS=12,BREAK_STRESS=80;

let nodes=[],springs=[],vehicles=[],simRunning=false,building=true;
let selectedNode=null,hoverNode=null;

class Node{
  constructor(x,y,fixed=false){
    this.x=x;this.y=y;this.ox=x;this.oy=y;this.fixed=fixed;this.r=7;
    this.stress=0;
  }
  update(){
    if(this.fixed)return;
    const vx=(this.x-this.ox)*DAMPING;
    const vy=(this.y-this.oy)*DAMPING;
    this.ox=this.x;this.oy=this.y;
    this.x+=vx;this.y+=vy+GRAVITY;
    if(this.y+this.r>H){this.y=H-this.r;this.oy=this.y+vy*0.3;}
  }
}

class Spring{
  constructor(a,b){
    this.a=a;this.b=b;
    this.rest=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
    this.broken=false;this.stress=0;
  }
  solve(){
    if(this.broken)return;
    const dx=this.b.x-this.a.x,dy=this.b.y-this.a.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||0.001;
    const err=dist-this.rest;
    this.stress=Math.abs(err);
    if(this.stress>BREAK_STRESS){this.broken=true;return;}
    const f=err/dist*0.5;
    if(!this.a.fixed){this.a.x+=dx*f;this.a.y+=dy*f;}
    if(!this.b.fixed){this.b.x-=dx*f;this.b.y-=dy*f;}
  }
}

class Vehicle{
  constructor(){
    this.x=-40;this.y=0;this.vx=2;this.vy=0;this.w=60;this.h=20;this.mass=5;
    // Find road height at x=0
    this.placed=false;
  }
  update(nodes,springs){
    // Find closest road spring below vehicle
    let minY=H;
    springs.forEach(s=>{
      if(s.broken)return;
      const lx=Math.min(s.a.x,s.b.x),rx=Math.max(s.a.x,s.b.x);
      if(this.x>lx&&this.x<rx){
        const t=(this.x-s.a.x)/(s.b.x-s.a.x||0.001);
        const iy=s.a.y+(s.b.y-s.a.y)*t;
        if(iy<minY) minY=iy;
      }
    });
    this.vy+=0.4;
    this.y+=this.vy;
    if(this.y+this.h>=minY){
      this.y=minY-this.h;
      this.vy=0;
      // Apply vehicle weight to nearby nodes
      springs.forEach(s=>{
        if(s.broken)return;
        const lx=Math.min(s.a.x,s.b.x),rx=Math.max(s.a.x,s.b.x);
        if(this.x>=lx&&this.x<=rx){
          if(!s.a.fixed) s.a.y+=this.mass*0.2;
          if(!s.b.fixed) s.b.y+=this.mass*0.2;
        }
      });
    }
    this.x+=this.vx;
  }
}

function init(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  resetBuild();
}

function resetBuild(){
  // Anchor points on each side
  nodes=[
    new Node(W*0.1,H*0.6,true),
    new Node(W*0.9,H*0.6,true),
    new Node(W*0.1,H*0.4,true),
    new Node(W*0.9,H*0.4,true),
  ];
  springs=[];vehicles=[];
  simRunning=false;building=true;
  selectedNode=null;
  overlay.style.display='none';
}

function update(){
  if(!simRunning)return;
  nodes.forEach(n=>n.update());
  for(let i=0;i<ITERS;i++) springs.forEach(s=>s.solve());
  vehicles.forEach(v=>v.update(nodes,springs));
  // Remove off-screen vehicles
  vehicles=vehicles.filter(v=>v.x<W+100);
  // Spawn vehicles
  if(Math.random()<0.005&&vehicles.length<3) vehicles.push(new Vehicle());
  // Check collapse (non-fixed node falls off)
  const collapsed=nodes.some(n=>!n.fixed&&n.y>H+50);
  if(collapsed){ simRunning=false; showResult('COLLAPSED'); }
}

function showResult(msg){
  document.getElementById('overlay-title').textContent=msg;
  document.getElementById('overlay-msg').innerHTML=`Sprung: <span style="color:var(--accent)">${springs.filter(s=>s.broken).length}</span> broken`;
  startBtn.textContent='REBUILD';
  overlay.style.display='flex';
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  // Ground cliff hints
  ctx.fillStyle='rgba(0,229,255,0.06)';
  ctx.fillRect(0,H*0.6,W*0.1,H);
  ctx.fillRect(W*0.9,H*0.6,W*0.1,H);

  // Springs
  springs.forEach(s=>{
    if(s.broken){
      ctx.strokeStyle='rgba(255,77,77,0.2)';
    } else {
      const stressRatio=Math.min(1,s.stress/BREAK_STRESS);
      const r=Math.round(stressRatio*255);
      const g=Math.round((1-stressRatio)*229);
      ctx.strokeStyle=`rgba(${r},${g},0,0.9)`;
      ctx.lineWidth=2+stressRatio*3;
    }
    ctx.lineWidth=s.broken?1:2;
    ctx.beginPath();
    ctx.moveTo(s.a.x,s.a.y);ctx.lineTo(s.b.x,s.b.y);
    ctx.stroke();
  });

  // Nodes
  nodes.forEach(n=>{
    ctx.fillStyle=n.fixed?'#FFB800':n===hoverNode?'#00E5FF':'#888';
    ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=n.fixed?10:4;
    ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    if(n===selectedNode){
      ctx.strokeStyle='#00E5FF';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+4,0,Math.PI*2);ctx.stroke();
    }
  });

  // Vehicles
  vehicles.forEach(v=>{
    ctx.fillStyle='#FF4D4D';
    ctx.shadowColor='#FF4D4D';ctx.shadowBlur=10;
    ctx.fillRect(v.x,v.y,v.w,v.h);
    ctx.shadowBlur=0;
  });

  // Instructions
  if(building){
    ctx.fillStyle='rgba(0,229,255,0.5)';
    ctx.font='12px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText('Click to add node • Click node→node to connect • Press SPACE to simulate',W/2,30);
    ctx.textAlign='left';
  }
}

function loop(){update();draw();requestAnimationFrame(loop);}

canvas.addEventListener('click',e=>{
  if(!building)return;
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  // Check if clicking existing node
  const hit=nodes.find(n=>Math.sqrt((n.x-mx)**2+(n.y-my)**2)<n.r+4);
  if(hit){
    if(selectedNode&&selectedNode!==hit){
      // Create spring between selectedNode and hit
      if(!springs.find(s=>(s.a===selectedNode&&s.b===hit)||(s.a===hit&&s.b===selectedNode)))
        springs.push(new Spring(selectedNode,hit));
      selectedNode=null;
    } else {
      selectedNode=hit;
    }
  } else {
    // Place new node
    const n=new Node(mx,my,false);
    if(selectedNode){
      nodes.push(n);
      springs.push(new Spring(selectedNode,n));
      selectedNode=n;
    } else {
      nodes.push(n);selectedNode=n;
    }
  }
});

canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  hoverNode=nodes.find(n=>Math.sqrt((n.x-mx)**2+(n.y-my)**2)<n.r+6)||null;
});

document.addEventListener('keydown',e=>{
  if(e.key===' '){e.preventDefault();if(building&&springs.length>0){simRunning=true;building=false;vehicles.push(new Vehicle());}}
  if(e.key==='r'||e.key==='R') resetBuild();
});
startBtn.addEventListener('click',resetBuild);
window.addEventListener('resize',init);
init();requestAnimationFrame(loop);
