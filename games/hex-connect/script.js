// games/hex-connect/script.js — Hex Connect
// Click to rotate hex tiles. Path connects two opposite sides = win.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='hex-connect-high-score';

let W,H,running=false,score=0,best=0;
const GRID_R=5; // hex radius in cells
let hexes={},HEX_SIZE;

// Axial hex coordinates, 6 directions
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
// Pipe directions: 0=NE,1=N,2=NW,3=SW,4=S,5=SE
// connectors is a Set of direction indices this hex connects
// When rotated by 1 step, all directions shift +1 mod 6

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function initGame(){
  score=0;scoreDom.textContent=0;
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  HEX_SIZE=Math.min(W,H)/(GRID_R*2+2)*0.9;

  hexes={};
  // Generate hex grid within radius GRID_R
  for(let q=-GRID_R;q<=GRID_R;q++){
    for(let r=Math.max(-GRID_R,-q-GRID_R);r<=Math.min(GRID_R,-q+GRID_R);r++){
      const key=`${q},${r}`;
      // Random rotation (0-5)
      const rot=Math.floor(Math.random()*6);
      // Pipe type: straight(2 opposite dirs), corner(2 adjacent), T-junction(3 dirs)
      const type=Math.random()<0.4?'straight':Math.random()<0.5?'corner':'T';
      let dirs=[];
      if(type==='straight') dirs=[0,3];
      else if(type==='corner') dirs=[0,1];
      else dirs=[0,1,3];
      hexes[key]={q,r,rot,baseDirs:dirs};
    }
  }
  overlay.style.display='none';
  draw();
}

function getActiveDirs(hex){
  return hex.baseDirs.map(d=>(d+hex.rot)%6);
}

function hexToPixel(q,r){
  const x=W/2+HEX_SIZE*(3/2*q);
  const y=H/2+HEX_SIZE*(Math.sqrt(3)/2*q+Math.sqrt(3)*r);
  return {x,y};
}

function pixelToHex(px,py){
  const q=(px-W/2)/(HEX_SIZE*1.5);
  const r=(py-H/2)/HEX_SIZE/Math.sqrt(3)-q/2;
  // Round to nearest hex
  let rq=Math.round(q),rr=Math.round(r),rs=Math.round(-q-r);
  const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-(-q-r));
  if(dq>dr&&dq>ds) rq=-rr-rs;
  else if(dr>ds) rr=-rq-rs;
  return {q:rq,r:rr};
}

function hexCorners(cx,cy){
  const pts=[];
  for(let i=0;i<6;i++){
    const a=Math.PI/180*(60*i+30);
    pts.push({x:cx+HEX_SIZE*Math.cos(a),y:cy+HEX_SIZE*Math.sin(a)});
  }
  return pts;
}

function dirAngle(d){ return d*Math.PI/3-Math.PI/2; }

// BFS: check if top-row hexes connect to bottom-row hexes via aligned pipes
function checkWin(){
  const entered=new Set();
  const queue=[];
  // Top edge hexes
  Object.values(hexes).forEach(h=>{
    if(h.r===-GRID_R){const key=`${h.q},${h.r}`;queue.push(key);entered.add(key);}
  });
  let found=false;
  while(queue.length){
    const key=queue.shift();
    const [q,r]=key.split(',').map(Number);
    const hex=hexes[key];
    if(!hex)continue;
    if(r===GRID_R){found=true;break;}
    const active=getActiveDirs(hex);
    active.forEach(d=>{
      const nq=q+DIRS[d][0],nr=r+DIRS[d][1];
      const nk=`${nq},${nr}`;
      const nh=hexes[nk];
      if(!nh)return;
      // Neighbor must connect back via opposite direction
      const opp=(d+3)%6;
      if(getActiveDirs(nh).includes(opp)&&!entered.has(nk)){
        entered.add(nk);queue.push(nk);
      }
    });
  }
  return found;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  const connected=new Set();
  // BFS to mark connected hexes (same as checkWin but collect set)
  const entered=new Set();const queue=[];
  Object.values(hexes).forEach(h=>{if(h.r===-GRID_R){const k=`${h.q},${h.r}`;queue.push(k);entered.add(k);}});
  while(queue.length){
    const key=queue.shift();const [q,r]=key.split(',').map(Number);const hex=hexes[key];if(!hex)continue;
    connected.add(key);
    getActiveDirs(hex).forEach(d=>{
      const nq=q+DIRS[d][0],nr=r+DIRS[d][1];const nk=`${nq},${nr}`;const nh=hexes[nk];
      if(!nh)return;const opp=(d+3)%6;
      if(getActiveDirs(nh).includes(opp)&&!entered.has(nk)){entered.add(nk);queue.push(nk);}
    });
  }

  Object.values(hexes).forEach(h=>{
    const {x,y}=hexToPixel(h.q,h.r);
    const corners=hexCorners(x,y);
    const isConn=connected.has(`${h.q},${h.r}`);
    // Hex fill
    ctx.beginPath();corners.forEach((c,i)=>i===0?ctx.moveTo(c.x,c.y):ctx.lineTo(c.x,c.y));ctx.closePath();
    ctx.fillStyle=isConn?'rgba(0,229,255,0.08)':'rgba(255,255,255,0.03)';
    ctx.strokeStyle=isConn?'rgba(0,229,255,0.5)':'rgba(255,255,255,0.1)';
    ctx.lineWidth=1;ctx.fill();ctx.stroke();
    // Pipes
    const active=getActiveDirs(h);
    ctx.strokeStyle=isConn?'#00E5FF':'#555';
    ctx.lineWidth=isConn?4:3;
    ctx.shadowColor=isConn?'#00E5FF':'transparent';ctx.shadowBlur=isConn?8:0;
    active.forEach(d=>{
      const ang=dirAngle(d);
      const ex=x+Math.cos(ang)*HEX_SIZE*0.9;
      const ey=y+Math.sin(ang)*HEX_SIZE*0.9;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
    });
    ctx.shadowBlur=0;
    // Center dot
    ctx.fillStyle=isConn?'#00E5FF':'#333';
    ctx.beginPath();ctx.arc(x,y,isConn?5:3,0,Math.PI*2);ctx.fill();
  });

  // Edge labels
  ctx.fillStyle='rgba(0,229,255,0.6)';ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText('POWER IN',W/2,30);
  ctx.fillText('POWER OUT',W/2,H-10);
}

canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect();
  const {q,r:hr}=pixelToHex(e.clientX-r.left,e.clientY-r.top);
  const key=`${q},${hr}`;
  if(hexes[key]){
    hexes[key].rot=(hexes[key].rot+1)%6;
    if(checkWin()){
      score++;scoreDom.textContent=score;saveBest();
      setTimeout(()=>{
        document.getElementById('overlay-title').textContent='CONNECTED!';
        document.getElementById('overlay-msg').innerHTML=`Circuits solved: <span style="color:var(--accent)">${score}</span>`;
        startBtn.textContent='NEXT PUZZLE';overlay.style.display='flex';
      },400);
    } else draw();
  }
});
startBtn.addEventListener('click',initGame);
window.addEventListener('resize',initGame);
loadBest();initGame();
