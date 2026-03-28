// games/shape-shifter/script.js — Shape Shifter
// 3-state shape toggle (Circle/Triangle/Square). Custom polygon hitboxes.

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'shape-shifter-high-score';

let W, H;
let running=false, raf, score=0, best=0, t=0;

const SHAPES=['circle','triangle','square'];
const SHAPE_COLORS=['#00E5FF','#FFB800','#FF4D4D'];
const PLAYER_R=22;

let playerShape=0, gates=[], gateSpeed=4;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

// Draw a shape at position
function drawShape(shape,x,y,r,col,alpha=1){
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.shadowColor=col;
  ctx.shadowBlur=14;
  ctx.fillStyle=col;
  ctx.strokeStyle=col;
  ctx.lineWidth=2;
  ctx.beginPath();
  if(shape==='circle'){
    ctx.arc(x,y,r,0,Math.PI*2);
  } else if(shape==='triangle'){
    ctx.moveTo(x,y-r);
    ctx.lineTo(x+r*Math.sin(Math.PI*2/3),y+r*Math.cos(Math.PI*2/3)*(-1)*-1);
    ctx.lineTo(x-r*Math.sin(Math.PI*2/3),y+r*Math.cos(Math.PI*2/3)*(-1)*-1);
    ctx.closePath();
  } else {
    ctx.rect(x-r,y-r,r*2,r*2);
  }
  ctx.fill();
  ctx.globalAlpha=1;
  ctx.shadowBlur=0;
  ctx.restore();
}

// Check if player shape fits through gate
function shapeHitboxCollides(playerSh, gate){
  // Player is centered at W/2, H/2·0.6
  const px=W/2, py=H*0.55;
  const gx=gate.x, gy=gate.y;
  const dr=Math.sqrt((px-gx)**2+(py-gy)**2);
  if(dr>PLAYER_R+gate.r*0.7) return false; // too far apart

  // Same shape = pass through
  if(playerSh===gate.shape) return false;
  return true; // different shape = collision
}

function spawnGate(){
  const shape=SHAPES[Math.floor(Math.random()*3)];
  const r=35+Math.random()*15;
  const x=80+Math.random()*(W-160);
  gates.push({ shape, r, x, y:-r-20, color:SHAPE_COLORS[SHAPES.indexOf(shape)] });
}

function initGame(){
  t=0; score=0; scoreDom.textContent=0;
  playerShape=0; gates=[];
  gateSpeed=4;
  overlay.style.display='none';
}

function update(){
  t++;
  gateSpeed=4+score*0.1;

  // Spawn gate
  if(t%80===0) spawnGate();

  for(let i=gates.length-1;i>=0;i--){
    const g=gates[i];
    g.y+=gateSpeed;
    // Check collision
    if(shapeHitboxCollides(SHAPES[playerShape],g)){
      endGame(); return;
    }
    // Passed gate — score
    if(!g.scored && g.y>H*0.55+PLAYER_R+g.r){
      g.scored=true;
      score++;
      scoreDom.textContent=score;
    }
    // Remove off-screen
    if(g.y>H+g.r+20) gates.splice(i,1);
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  // Guide line
  ctx.strokeStyle='rgba(255,255,255,0.04)';
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(W/2,0); ctx.lineTo(W/2,H);
  ctx.stroke();

  // Gates
  gates.forEach(g=>{
    drawShape(g.shape,g.x,g.y,g.r,g.color,0.85);
    // Label
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.font='11px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(g.shape.toUpperCase(),g.x,g.y+g.r+14);
  });

  // Player at bottom center
  const col=SHAPE_COLORS[playerShape];
  drawShape(SHAPES[playerShape],W/2,H*0.75,PLAYER_R,col);

  // Shape indicator row
  SHAPES.forEach((s,i)=>{
    const active=i===playerShape;
    drawShape(s,W/2+(i-1)*55,H-40,active?14:9,SHAPE_COLORS[i],active?1:0.3);
  });

  ctx.textAlign='left';
}

function loop(){
  if(!running)return;
  update();
  draw();
  raf=requestAnimationFrame(loop);
}

function startGame(){
  initGame();
  running=true;
  requestAnimationFrame(loop);
}

function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  document.getElementById('overlay-title').textContent='WRONG SHAPE';
  document.getElementById('overlay-msg').innerHTML=`Gates cleared: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='RETRY';
  overlay.style.display='flex';
}

// Cycle shape on tap/click/space
function nextShape(){ playerShape=(playerShape+1)%3; }
document.addEventListener('keydown',e=>{if(!running)return;if(e.key===' '||e.key==='ArrowRight'||e.key==='d'){nextShape();e.preventDefault();}});
canvas.addEventListener('click',()=>{if(running)nextShape();});
canvas.addEventListener('touchstart',e=>{e.preventDefault();if(running)nextShape();},{passive:false});

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
