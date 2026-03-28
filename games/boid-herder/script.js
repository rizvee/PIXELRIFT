// games/boid-herder/script.js — Boid Herder

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const scoreEl = document.getElementById('score-display');

let W, H;
const N = 80;
const mouse = { x: -9999, y: -9999 };
let boids = [], target;

// ── Target zone ────────────────────────────────────────────────────────────
function newTarget() {
  const margin = 80;
  return {
    x: margin + Math.random() * (W - margin*2),
    y: margin + Math.random() * (H - margin*2),
    r: 60
  };
}

// ── Boid ───────────────────────────────────────────────────────────────────
class Boid {
  constructor() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random()-0.5)*2;
    this.vy = (Math.random()-0.5)*2;
    this.hue = Math.random()*40+170;
  }

  update(boids) {
    let sepX=0,sepY=0,alignX=0,alignY=0,cohX=0,cohY=0;
    let sepCount=0,nearCount=0;

    const SEP_R=25, ALIGN_R=60, COH_R=80;
    const SPEED=2.5;

    for (const b of boids) {
      if (b===this) continue;
      const dx=b.x-this.x, dy=b.y-this.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d<SEP_R && d>0) { sepX-=dx/d; sepY-=dy/d; sepCount++; }
      if (d<ALIGN_R)     { alignX+=b.vx; alignY+=b.vy; nearCount++; }
      if (d<COH_R)       { cohX+=b.x; cohY+=b.y; nearCount++; }
    }

    if (sepCount>0) { sepX/=sepCount; sepY/=sepCount; }
    if (nearCount>0) { alignX/=nearCount; alignY/=nearCount; cohX=cohX/nearCount-this.x; cohY=cohY/nearCount-this.y; }

    // Mouse repulsion (shepherd)
    const mDx=this.x-mouse.x, mDy=this.y-mouse.y;
    const mD=Math.sqrt(mDx*mDx+mDy*mDy);
    let repX=0,repY=0;
    if (mD<120 && mD>0) {
      const f=(120-mD)/120;
      repX=(mDx/mD)*f*3;
      repY=(mDy/mD)*f*3;
    }

    this.vx += sepX*0.08 + alignX*0.04 + cohX*0.003 + repX*0.5;
    this.vy += sepY*0.08 + alignY*0.04 + cohY*0.003 + repY*0.5;

    // Speed limit
    const sp=Math.sqrt(this.vx**2+this.vy**2);
    if (sp>SPEED) { this.vx=(this.vx/sp)*SPEED; this.vy=(this.vy/sp)*SPEED; }
    if (sp<0.5)   { this.vx*=1.1; this.vy*=1.1; }

    this.x+=this.vx; this.y+=this.vy;

    // Wrap
    if (this.x<0) this.x=W; if (this.x>W) this.x=0;
    if (this.y<0) this.y=H; if (this.y>H) this.y=0;
  }

  inTarget() {
    const dx=this.x-target.x, dy=this.y-target.y;
    return dx*dx+dy*dy<target.r**2;
  }

  draw() {
    const angle=Math.atan2(this.vy,this.vx);
    const inT=this.inTarget();
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(angle);
    ctx.shadowColor=`hsl(${this.hue},80%,65%)`;
    ctx.shadowBlur=inT?12:4;
    ctx.fillStyle=`hsl(${this.hue},80%,${inT?75:55}%)`;
    ctx.beginPath();
    ctx.moveTo( 8, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-5,-4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.restore();
  }
}

function init() {
  const wrap = canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  boids=Array.from({length:N},()=>new Boid());
  target=newTarget();
}

function loop() {
  ctx.fillStyle='rgba(10,10,10,0.25)';
  ctx.fillRect(0,0,W,H);

  // Target zone
  const inCount=boids.filter(b=>b.inTarget()).length;
  scoreEl.textContent=inCount;

  ctx.strokeStyle=`hsla(120,80%,60%,${0.2+inCount/N*0.5})`;
  ctx.shadowColor='#00FF88';
  ctx.shadowBlur=16;
  ctx.lineWidth=2;
  ctx.setLineDash([8,6]);
  ctx.beginPath();
  ctx.arc(target.x,target.y,target.r,0,Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur=0;

  ctx.fillStyle=`rgba(0,255,136,${0.03+inCount/N*0.08})`;
  ctx.beginPath();
  ctx.arc(target.x,target.y,target.r,0,Math.PI*2);
  ctx.fill();

  // Label
  ctx.fillStyle='rgba(0,255,136,0.6)';
  ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='center';
  ctx.fillText(`${inCount}/${N}`,target.x,target.y+target.r+18);

  // Move target when full
  if (inCount===N) target=newTarget();

  boids.forEach(b=>b.update(boids));
  boids.forEach(b=>b.draw());

  // Mouse cursor indicator
  if (mouse.x>0) {
    ctx.strokeStyle='rgba(0,229,255,0.25)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(mouse.x,mouse.y,120,0,Math.PI*2);
    ctx.stroke();
  }

  ctx.textAlign='left';
  requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top;
});
canvas.addEventListener('mouseleave',()=>{mouse.x=-9999;mouse.y=-9999;});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  mouse.x=e.touches[0].clientX-r.left; mouse.y=e.touches[0].clientY-r.top;
},{passive:false});

window.addEventListener('resize',init);
init();
requestAnimationFrame(loop);
