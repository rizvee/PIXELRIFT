// games/ragdoll-toss/script.js — Ragdoll Toss
// Verlet integration. Points and constraints (joints).

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
let W,H;

const GRAVITY=0.5,DAMPING=0.98,CONSTRAINT_ITERS=8;
const BOUNCE=0.5;

let bodies=[],dragging=null,dragOffset={x:0,y:0};

class Point{
  constructor(x,y,pinned=false){
    this.x=x;this.y=y;
    this.ox=x;this.oy=y;
    this.pinned=pinned;
    this.vx=0;this.vy=0;
    this.r=6;
    this.mass=1;
  }
  update(){
    if(this.pinned)return;
    const vx=(this.x-this.ox)*DAMPING;
    const vy=(this.y-this.oy)*DAMPING+GRAVITY;
    this.ox=this.x;this.oy=this.y;
    this.x+=vx;this.y+=vy;
    // Wall bounce
    if(this.x-this.r<0){this.x=this.r;this.ox=this.x+(this.x-this.ox)*BOUNCE;}
    if(this.x+this.r>W){this.x=W-this.r;this.ox=this.x+(this.x-this.ox)*BOUNCE;}
    if(this.y-this.r<0){this.y=this.r;this.oy=this.y+(this.y-this.oy)*BOUNCE;}
    if(this.y+this.r>H){this.y=H-this.r;this.oy=this.y+(this.y-this.oy)*BOUNCE*0.5;}
  }
}

class Constraint{
  constructor(a,b,stiff=1){
    this.a=a;this.b=b;
    this.rest=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
    this.stiff=stiff;
  }
  solve(){
    const dx=this.b.x-this.a.x,dy=this.b.y-this.a.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||0.001;
    const diff=(dist-this.rest)/dist*0.5*this.stiff;
    if(!this.a.pinned){this.a.x+=dx*diff;this.a.y+=dy*diff;}
    if(!this.b.pinned){this.b.x-=dx*diff;this.b.y-=dy*diff;}
  }
}

function makeRagdoll(cx,cy){
  const pts={};
  // Stick figure: head, neck, chest, hip, lshoulder, rshoulder, lelbow, relbow, lhand, rhand, lhip, rhip, lknee, rknee, lfoot, rfoot
  const defs=[
    ['head',   cx,     cy-100],
    ['neck',   cx,     cy-80],
    ['chest',  cx,     cy-50],
    ['hip',    cx,     cy],
    ['lsho',   cx-30,  cy-65],
    ['rsho',   cx+30,  cy-65],
    ['lelb',   cx-40,  cy-30],
    ['relb',   cx+40,  cy-30],
    ['lhnd',   cx-45,  cy],
    ['rhnd',   cx+45,  cy],
    ['lhip',   cx-18,  cy+5],
    ['rhip',   cx+18,  cy+5],
    ['lkne',   cx-22,  cy+50],
    ['rkne',   cx+22,  cy+50],
    ['lfot',   cx-25,  cy+100],
    ['rfot',   cx+25,  cy+100],
  ];
  defs.forEach(([k,x,y])=>pts[k]=new Point(x,y));

  const cons=[
    [pts.head,pts.neck],[pts.neck,pts.chest],[pts.chest,pts.hip],
    [pts.chest,pts.lsho],[pts.chest,pts.rsho],
    [pts.lsho,pts.lelb],[pts.rsho,pts.relb],
    [pts.lelb,pts.lhnd],[pts.relb,pts.rhnd],
    [pts.hip,pts.lhip],[pts.hip,pts.rhip],
    [pts.lhip,pts.lkne],[pts.rhip,pts.rkne],
    [pts.lkne,pts.lfot],[pts.rkne,pts.rfot],
    // Cross-braces for stability
    [pts.lsho,pts.rsho],[pts.lhip,pts.rhip],[pts.chest,pts.lhip],[pts.chest,pts.rhip],
  ].map(([a,b])=>new Constraint(a,b));

  return {pts:Object.values(pts),cons};
}

function init(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  bodies=[makeRagdoll(W/3,H/2),makeRagdoll(2*W/3,H/2)];
}

function update(){
  bodies.forEach(b=>{
    b.pts.forEach(p=>p.update());
    for(let i=0;i<CONSTRAINT_ITERS;i++) b.cons.forEach(c=>c.solve());
  });
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='rgba(10,10,10,0.4)';
  ctx.fillRect(0,0,W,H);

  // Floor line
  ctx.strokeStyle='rgba(0,229,255,0.15)';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,H-5);ctx.lineTo(W,H-5);ctx.stroke();

  bodies.forEach((b,bi)=>{
    const hue=bi*120;
    // Constraints (skeleton)
    b.cons.forEach(c=>{
      ctx.strokeStyle=`hsla(${hue},70%,60%,0.7)`;
      ctx.lineWidth=3;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(c.a.x,c.a.y);
      ctx.lineTo(c.b.x,c.b.y);
      ctx.stroke();
    });
    // Points (joints)
    b.pts.forEach(p=>{
      ctx.fillStyle=p===dragging?'#FFB800':`hsl(${hue},80%,70%)`;
      ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=p===dragging?16:4;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    });
  });
}

function loop(){update();draw();requestAnimationFrame(loop);}

function findClosestPoint(mx,my){
  let best=null,bestD=30;
  bodies.forEach(b=>b.pts.forEach(p=>{
    const d=Math.sqrt((p.x-mx)**2+(p.y-my)**2);
    if(d<bestD){bestD=d;best=p;}
  }));
  return best;
}

canvas.addEventListener('mousedown',e=>{
  const r=canvas.getBoundingClientRect();
  const p=findClosestPoint(e.clientX-r.left,e.clientY-r.top);
  if(p){dragging=p;dragOffset={x:p.x-(e.clientX-r.left),y:p.y-(e.clientY-r.top)};}
});
canvas.addEventListener('mousemove',e=>{
  if(!dragging)return;
  const r=canvas.getBoundingClientRect();
  dragging.x=e.clientX-r.left+dragOffset.x;
  dragging.y=e.clientY-r.top+dragOffset.y;
  dragging.ox=dragging.x;dragging.oy=dragging.y;
});
canvas.addEventListener('mouseup',()=>{dragging=null;});
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  const p=findClosestPoint(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);
  if(p)dragging=p;
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();if(!dragging)return;
  const r=canvas.getBoundingClientRect();
  dragging.x=e.touches[0].clientX-r.left;
  dragging.y=e.touches[0].clientY-r.top;
  dragging.ox=dragging.x;dragging.oy=dragging.y;
},{passive:false});
canvas.addEventListener('touchend',()=>{dragging=null;});

window.addEventListener('resize',init);
init();requestAnimationFrame(loop);
