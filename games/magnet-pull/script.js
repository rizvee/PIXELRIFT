// games/magnet-pull/script.js — Magnet Pull
// Inverse square law attraction/repulsion on particle swarms

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
let W,H;
const N=200;
let particles=[],magnets=[];
let placingPolarity=1; // 1=attract, -1=repel

class Particle{
  constructor(){
    this.x=Math.random()*W; this.y=Math.random()*H;
    this.vx=(Math.random()-0.5)*2; this.vy=(Math.random()-0.5)*2;
    this.r=3; this.hue=200;
  }
  update(){
    let fx=0,fy=0;
    magnets.forEach(m=>{
      const dx=this.x-m.x,dy=this.y-m.y;
      const d2=dx*dx+dy*dy||1;
      const d=Math.sqrt(d2);
      // Inverse square law force: F=k*q/r^2
      const k=3000;
      const f=-m.polarity*k/d2; // negative = attract, positive = repel
      fx+=f*(dx/d); fy+=f*(dy/d);
    });
    this.vx=(this.vx+fx)*0.98;
    this.vy=(this.vy+fy)*0.98;
    const speed=Math.sqrt(this.vx**2+this.vy**2);
    if(speed>8){this.vx=this.vx/speed*8;this.vy=this.vy/speed*8;}
    this.x+=this.vx; this.y+=this.vy;
    // Wrap
    if(this.x<0)this.x=W; if(this.x>W)this.x=0;
    if(this.y<0)this.y=H; if(this.y>H)this.y=0;
    // Hue by speed
    this.hue=180+speed*20;
  }
  draw(){
    ctx.shadowColor=`hsl(${this.hue},100%,65%)`;
    ctx.shadowBlur=4;
    ctx.fillStyle=`hsl(${this.hue},80%,60%)`;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
}

function init(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  particles=Array.from({length:N},()=>new Particle());
  magnets=[];
}

function draw(){
  ctx.fillStyle='rgba(10,10,10,0.2)';ctx.fillRect(0,0,W,H);
  // Magnets
  magnets.forEach(m=>{
    const col=m.polarity===1?'#00E5FF':'#FF4D4D';
    ctx.shadowColor=col;ctx.shadowBlur=30;
    ctx.strokeStyle=col;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(m.x,m.y,20,0,Math.PI*2);ctx.stroke();
    // Field lines
    for(let a=0;a<8;a++){
      const ang=a*Math.PI/4;
      ctx.globalAlpha=0.2;
      ctx.beginPath();
      ctx.arc(m.x,m.y,40,ang,ang+0.5);ctx.stroke();
      ctx.globalAlpha=1;
    }
    ctx.fillStyle=col; ctx.font='bold 14px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(m.polarity===1?'+':'−',m.x,m.y+5);
    ctx.shadowBlur=0;
  });
  particles.forEach(p=>{p.update();p.draw();});
  ctx.textAlign='left';
}

// UI
let polBtn;
function buildUI(){
  const hud=document.getElementById('element-hud');
  if(!hud)return;
  polBtn=document.createElement('span');
  polBtn.className='el-btn active';
  polBtn.textContent='+ Attract';
  polBtn.style.cssText='cursor:pointer;padding:3px 10px;border:1px solid var(--accent);color:var(--accent);font-family:JetBrains Mono,monospace;font-size:11px;border-radius:3px;';
  polBtn.addEventListener('click',()=>{
    placingPolarity*=-1;
    polBtn.textContent=placingPolarity===1?'+ Attract':'− Repel';
    polBtn.style.borderColor=placingPolarity===1?'var(--accent)':'#FF4D4D';
    polBtn.style.color=placingPolarity===1?'var(--accent)':'#FF4D4D';
  });
  const clearBtn=document.createElement('span');
  clearBtn.className='el-btn';
  clearBtn.textContent='Clear';
  clearBtn.style.cssText='cursor:pointer;padding:3px 10px;border:1px solid var(--border);color:var(--muted);font-family:JetBrains Mono,monospace;font-size:11px;border-radius:3px;margin-left:8px;';
  clearBtn.addEventListener('click',()=>magnets=[]);
  hud.appendChild(polBtn);hud.appendChild(clearBtn);
}

canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  // Remove if clicking existing
  const hit=magnets.findIndex(m=>Math.sqrt((m.x-mx)**2+(m.y-my)**2)<24);
  if(hit>=0){magnets.splice(hit,1);return;}
  magnets.push({x:mx,y:my,polarity:placingPolarity});
});

window.addEventListener('resize',init);
init();buildUI();requestAnimationFrame(function loop(){draw();requestAnimationFrame(loop);});
