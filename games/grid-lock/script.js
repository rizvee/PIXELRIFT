// games/grid-lock/script.js — Grid Lock (Unblock Me / Rush Hour style)
// Drag blocks horizontally or vertically. Clear red block to exit.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='grid-lock-high-score';

let W,H,CELL,COLS=6,ROWS=6;
let score=0,best=0,running=false;
let blocks=[],moves=0,dragging=null,dragStart=null;
let level=0;

const LEVELS=[
  // [col,row,len,dir,isTarget] dir: 0=horiz,1=vert
  [[2,2,2,0,true],[0,0,3,1,false],[1,0,2,0,false],[4,0,2,1,false],[3,1,2,1,false],[0,3,2,0,false],[2,4,3,0,false],[5,2,2,1,false]],
  [[0,2,2,0,true],[2,0,2,1,false],[3,1,3,1,false],[0,0,2,0,false],[4,0,2,0,false],[1,3,2,1,false],[4,3,2,0,false],[0,4,3,0,false]],
  [[1,2,2,0,true],[0,0,2,1,false],[2,0,3,1,false],[3,0,2,0,false],[4,1,2,1,false],[0,3,3,0,false],[5,2,3,1,false],[1,4,2,0,false],[3,3,2,1,false]],
];

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}
function resize(){
  const wrap=canvas.parentElement;
  const size=Math.min(wrap.clientWidth,wrap.clientHeight)-60;
  CELL=Math.floor(size/COLS);
  canvas.width=COLS*CELL;canvas.height=ROWS*CELL;
}

function loadLevel(i){
  const def=LEVELS[i%LEVELS.length];
  blocks=def.map(([c,r,len,dir,isTgt])=>({c,r,len,dir,isTarget:isTgt}));
  moves=0;
}

function initGame(){
  score=0;scoreDom.textContent=0;level=0;loadLevel(0);overlay.style.display='none';draw();
}

function isOccupied(c,r,excludeBlock){
  return blocks.some(b=>{
    if(b===excludeBlock)return false;
    for(let i=0;i<b.len;i++){
      const bc=b.dir===0?b.c+i:b.c;
      const br=b.dir===1?b.r+i:b.r;
      if(bc===c&&br===r)return true;
    }
    return false;
  });
}

function canMoveBlock(b,delta){
  if(b.dir===0){// horizontal
    if(delta<0){ if(b.c+delta<0)return false; return !isOccupied(b.c+delta,b.r,b); }
    else { if(b.c+b.len-1+delta>=COLS)return false; return !isOccupied(b.c+b.len-1+delta,b.r,b); }
  } else {// vertical
    if(delta<0){ if(b.r+delta<0)return false; return !isOccupied(b.c,b.r+delta,b); }
    else { if(b.r+b.len-1+delta>=ROWS)return false; return !isOccupied(b.c,b.r+b.len-1+delta,b); }
  }
}

function draw(){
  ctx.clearRect(0,0,COLS*CELL,ROWS*CELL);
  ctx.fillStyle='#0F0F0F'; ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);
  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
  for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,ROWS*CELL);ctx.stroke();}
  for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(COLS*CELL,r*CELL);ctx.stroke();}
  // Exit arrow
  ctx.fillStyle='rgba(0,255,136,0.5)';
  ctx.font='bold 18px monospace';ctx.textAlign='left';
  ctx.fillText('→',COLS*CELL+4,2.5*CELL+8);

  blocks.forEach(b=>{
    const x=b.c*CELL+3,y=b.r*CELL+3;
    const bw=(b.dir===0?b.len:1)*CELL-6;
    const bh=(b.dir===1?b.len:1)*CELL-6;
    const col=b.isTarget?'#FF4D4D':b.dir===0?'#4FC3F7':'#FFB800';
    ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=b===dragging?14:6;
    ctx.fillRect(x,y,bw,bh);
    ctx.shadowBlur=0;
  });

  ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='left';ctx.fillText(`Moves: ${moves}`,4,ROWS*CELL+16);
}

function hitBlock(mx,my){
  return blocks.find(b=>{
    const bx=b.c*CELL,by=b.r*CELL;
    const bw=(b.dir===0?b.len:1)*CELL,bh=(b.dir===1?b.len:1)*CELL;
    return mx>=bx&&mx<bx+bw&&my>=by&&my<by+bh;
  });
}

canvas.addEventListener('mousedown',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  dragging=hitBlock(mx,my)||null;
  if(dragging) dragStart={gx:mx,gy:my,c:dragging.c,r:dragging.r};
});
canvas.addEventListener('mousemove',e=>{
  if(!dragging||!running)return;
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const dx=Math.round((mx-dragStart.gx)/CELL);
  const dy=Math.round((my-dragStart.gy)/CELL);
  const delta=dragging.dir===0?dx:dy;
  if(delta===0)return;
  // Move one step at a time
  const step=delta>0?1:-1;
  for(let i=0;i<Math.abs(delta);i++){
    if(canMoveBlock(dragging,step)){
      if(dragging.dir===0) dragging.c+=step;
      else dragging.r+=step;
      moves++;
      // Win: target block reaches exit (col 4 for len=2 means c=4 = exit)
      if(dragging.isTarget&&dragging.dir===0&&dragging.c+dragging.len>=COLS){
        score++;scoreDom.textContent=score;saveBest();
        setTimeout(()=>{level++;loadLevel(level);draw();},400);
        dragging=null;return;
      }
    }
  }
  dragStart.gx=mx;dragStart.gy=my;
  draw();
});
canvas.addEventListener('mouseup',()=>{dragging=null;});

function startGame(){initGame();running=true;}
startBtn.addEventListener('click',startGame);
window.addEventListener('resize',()=>{resize();draw();});
resize();loadBest();
