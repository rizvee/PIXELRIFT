// games/wall-bounce/script.js — Wall Bounce
// Line-to-circle collision math. Shrinking polygon.

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'wall-bounce-high-score';

let W, H, CX, CY;
let running=false, raf, score=0, best=0, t=0;

let ball, polygon, polyRadius, polyShrinkRate;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  CX=W/2; CY=H/2;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function initGame(){
  t=0; score=0; scoreDom.textContent=0;
  polyRadius=Math.min(W,H)*0.4;
  polyShrinkRate=0.04;
  polygon={ sides:6, rotation:0, rotSpeed:0.008 };
  ball={
    x: CX, y: CY-60,
    vx: (Math.random()-0.5)*5+2,
    vy: (Math.random()-0.5)*5+2,
    r: 8
  };
}

function getPolyVertices(){
  const verts=[];
  for(let i=0;i<polygon.sides;i++){
    const a=polygon.rotation+i*(Math.PI*2/polygon.sides);
    verts.push({ x:CX+Math.cos(a)*polyRadius, y:CY+Math.sin(a)*polyRadius });
  }
  return verts;
}

// Closest point on segment to circle center
function closestPointOnSeg(ax,ay,bx,by,px,py){
  const ABx=bx-ax, ABy=by-ay;
  const t=Math.max(0,Math.min(1,((px-ax)*ABx+(py-ay)*ABy)/(ABx*ABx+ABy*ABy)));
  return { x:ax+t*ABx, y:ay+t*ABy };
}

// Line-to-circle collision and bounce
function reflectBall(verts){
  for(let i=0;i<verts.length;i++){
    const a=verts[i], b=verts[(i+1)%verts.length];
    const cp=closestPointOnSeg(a.x,a.y,b.x,b.y,ball.x,ball.y);
    const dx=ball.x-cp.x, dy=ball.y-cp.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<ball.r){
      // Reflect velocity around wall normal
      const nx=dx/dist, ny=dy/dist;
      const dot=ball.vx*nx+ball.vy*ny;
      ball.vx-=2*dot*nx;
      ball.vy-=2*dot*ny;
      // Push ball out of wall
      const overlap=ball.r-dist;
      ball.x+=nx*overlap;
      ball.y+=ny*overlap;
      // Score per bounce
      score++;
      scoreDom.textContent=score;
      // Slightly increase speed
      const speed=Math.sqrt(ball.vx**2+ball.vy**2);
      if(speed<12){ ball.vx*=1.03; ball.vy*=1.03; }
    }
  }
}

function isInsidePolygon(verts,x,y){
  let inside=false;
  for(let i=0,j=verts.length-1;i<verts.length;j=i++){
    const xi=verts[i].x, yi=verts[i].y;
    const xj=verts[j].x, yj=verts[j].y;
    if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function update(){
  t++;
  polygon.rotation+=polygon.rotSpeed;
  polyRadius=Math.max(60, polyRadius-polyShrinkRate);
  polyShrinkRate=Math.min(0.15, 0.04+score*0.0005);

  // Gravity
  ball.vy+=0.15;

  ball.x+=ball.vx;
  ball.y+=ball.vy;

  const verts=getPolyVertices();
  reflectBall(verts);

  // If ball escapes polygon — game over
  if(!isInsidePolygon(verts,ball.x,ball.y)){
    endGame(); return;
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  const verts=getPolyVertices();

  // Polygon
  const grad=ctx.createLinearGradient(CX-polyRadius,CY-polyRadius,CX+polyRadius,CY+polyRadius);
  grad.addColorStop(0,'rgba(0,229,255,0.12)');
  grad.addColorStop(1,'rgba(170,68,255,0.12)');
  ctx.fillStyle=grad;
  ctx.strokeStyle='rgba(0,229,255,0.8)';
  ctx.lineWidth=2;
  ctx.shadowColor='#00E5FF';
  ctx.shadowBlur=12;
  ctx.beginPath();
  verts.forEach((v,i)=> i===0?ctx.moveTo(v.x,v.y):ctx.lineTo(v.x,v.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur=0;

  // Ball
  const speed=Math.sqrt(ball.vx**2+ball.vy**2);
  const hue=180+speed*10;
  ctx.shadowColor=`hsl(${hue},100%,65%)`;
  ctx.shadowBlur=18;
  ctx.fillStyle=`hsl(${hue},100%,65%)`;
  ctx.beginPath();
  ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur=0;

  // Shrink warning
  const pct=1-polyRadius/(Math.min(W,H)*0.4);
  if(pct>0.5){
    ctx.fillStyle=`rgba(255,77,77,${(pct-0.5)*0.3})`;
    ctx.fillRect(0,0,W,H);
  }
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function startGame(){
  initGame();
  overlay.style.display='none';
  running=true;
  requestAnimationFrame(loop);
}

function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  document.getElementById('overlay-title').textContent='ESCAPED';
  document.getElementById('overlay-msg').innerHTML=`Bounces: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='RETRY';
  overlay.style.display='flex';
}

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
