// games/shadow-match/script.js — Shadow Match
// 3D rotation matrices projected onto 2D canvas

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='shadow-match-high-score';

let W,H,running=false,raf,score=0,best=0;
let rotX=0,rotY=0,targetRotX,targetRotY;
let dragging=false,lastMX=0,lastMY=0;
let shape,shapeVertices,t=0;

const SHAPES=[
  // Cube edges
  {name:'Cube',verts:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
   edges:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]},
  // Pyramid
  {name:'Pyramid',verts:[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[0,2,0]],
   edges:[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]]},
  // Octahedron
  {name:'Octahedron',verts:[[0,1.4,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1.4,0]],
   edges:[[0,1],[0,2],[0,3],[0,4],[5,1],[5,2],[5,3],[5,4],[1,3],[3,2],[2,4],[4,1]]},
];

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;H=canvas.height=wrap.clientHeight;
}
function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function project(v,rx,ry,scale,ox,oy){
  // Rotate Y
  const cos=Math.cos(ry),sin=Math.sin(ry);
  let x=v[0]*cos-v[2]*sin,z=v[0]*sin+v[2]*cos;
  let y=v[1];
  // Rotate X
  const cosx=Math.cos(rx),sinx=Math.sin(rx);
  const y2=y*cosx-z*sinx;
  z=y*sinx+z*cosx;y=y2;
  // Orthographic projection
  return {x:ox+x*scale,y:oy-y*scale,z};
}

function drawWireframe(sh,rx,ry,ox,oy,scale,col,alpha=1){
  ctx.globalAlpha=alpha;
  ctx.strokeStyle=col;ctx.lineWidth=2;
  ctx.shadowColor=col;ctx.shadowBlur=6;
  sh.edges.forEach(([a,b])=>{
    const pa=project(sh.verts[a],rx,ry,scale,ox,oy);
    const pb=project(sh.verts[b],rx,ry,scale,ox,oy);
    ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();
  });
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function drawShadow(sh,rx,ry,ox,oy,scale){
  // Project all verts, draw filled black shadow
  const pts=sh.verts.map(v=>project(v,rx,ry,scale,ox,oy));
  ctx.fillStyle='rgba(255,255,255,0.18)';
  sh.edges.forEach(([a,b])=>{
    ctx.beginPath();ctx.arc(pts[a].x,pts[a].y,2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(pts[b].x,pts[b].y,2,0,Math.PI*2);ctx.fill();
  });
  // Hull approximation– just draw projected edges thicker
  ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=10;
  ctx.lineJoin='round';ctx.lineCap='round';
  sh.edges.forEach(([a,b])=>{
    ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke();
  });
}

function angDiff(a,b){ return Math.abs(((a-b)+Math.PI)%(Math.PI*2)-Math.PI); }

function checkMatch(){
  const dr=angDiff(rotX,targetRotX)+angDiff(rotY,targetRotY);
  return dr<0.35;
}

function newChallenge(){
  shape=SHAPES[Math.floor(Math.random()*SHAPES.length)];
  targetRotX=(Math.random()-0.5)*Math.PI;
  targetRotY=Math.random()*Math.PI*2;
  rotX=0.3;rotY=0.7;
}

function initGame(){
  score=0;scoreDom.textContent=0;newChallenge();overlay.style.display='none';
}

function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  const CX=W/2,CY=H/2;
  const S=Math.min(W,H)*0.18;

  // Target shadow (left side)
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.fillRect(0,0,W/2-10,H);
  ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText('TARGET SILHOUETTE',W/4,30);
  drawShadow(shape,targetRotX,targetRotY,W/4,CY,S*0.9);

  // Player wireframe (right side)
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillText('ROTATE TO MATCH',W*3/4,30);
  drawWireframe(shape,rotX,rotY,W*3/4,CY,S,'#00E5FF',1);
  // Shadow of player
  drawShadow(shape,rotX,rotY,W*3/4,CY*1.7,S*0.8);

  // Match indicator
  const match=checkMatch();
  if(match){
    ctx.fillStyle='rgba(0,255,136,0.15)';ctx.fillRect(W/2,0,W/2,H);
    ctx.fillStyle='#00FF88';ctx.font='bold 18px JetBrains Mono,monospace';
    ctx.textAlign='center';ctx.fillText('✓ MATCHED!',W*3/4,H-30);
  }

  ctx.textAlign='left';
}

function loop(){if(!running)return;t++;draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}

// Auto-advance on match
let checkInterval;
function checkLoop(){
  if(running&&checkMatch()){
    score++;scoreDom.textContent=score;saveBest();
    setTimeout(()=>{newChallenge();},800);
  }
}

canvas.addEventListener('mousedown',e=>{dragging=true;lastMX=e.clientX;lastMY=e.clientY;});
canvas.addEventListener('mousemove',e=>{
  if(!dragging||!running)return;
  rotY+=(e.clientX-lastMX)*0.01;
  rotX+=(e.clientY-lastMY)*0.01;
  rotX=Math.max(-Math.PI/2,Math.min(Math.PI/2,rotX));
  lastMX=e.clientX;lastMY=e.clientY;
});
canvas.addEventListener('mouseup',()=>dragging=false);
canvas.addEventListener('touchstart',e=>{e.preventDefault();dragging=true;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();if(!dragging||!running)return;
  rotY+=(e.touches[0].clientX-lastMX)*0.012;
  rotX+=(e.touches[0].clientY-lastMY)*0.012;
  rotX=Math.max(-Math.PI/2,Math.min(Math.PI/2,rotX));
  lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;
},{passive:false});
canvas.addEventListener('touchend',()=>dragging=false);

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize();loadBest();
setInterval(checkLoop,100);
