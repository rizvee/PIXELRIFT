// games/minesweeper-z/script.js — Minesweeper Z
// Infinite expanding grid using a sparse Map. Recursive reveal.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='minesweeper-z-high-score';

let W,H,running=false,score=0,best=0;
const CELL=36,MINE_PROB=0.16;
let cells=new Map();  // key="q,r" → {mine,revealed,flagged,count}
let camX=0,camY=0;
let chunkRadius=5; // how many cells around camera to pre-generate
let gameOver=false;

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function key(q,r){return`${q},${r}`;}

function getCell(q,r){
  const k=key(q,r);
  if(!cells.has(k)){
    // Origin zone safe
    const dist=Math.max(Math.abs(q),Math.abs(r));
    const isMine=dist>1&&Math.random()<MINE_PROB;
    cells.set(k,{mine:isMine,revealed:false,flagged:false,count:0,q,r});
  }
  return cells.get(k);
}

function countMines(q,r){
  let c=0;
  for(let dq=-1;dq<=1;dq++)for(let dr=-1;dr<=1;dr++){
    if(dq===0&&dr===0)continue;
    if(getCell(q+dq,r+dr).mine)c++;
  }
  return c;
}

function reveal(q,r){
  const cell=getCell(q,r);
  if(cell.revealed||cell.flagged)return;
  cell.revealed=true;
  score++;scoreDom.textContent=score;
  if(cell.mine){gameOver=true;return;}
  cell.count=countMines(q,r);
  if(cell.count===0){
    for(let dq=-1;dq<=1;dq++)for(let dr=-1;dr<=1;dr++){
      if(dq===0&&dr===0)continue;
      reveal(q+dq,r+dr);
    }
  }
}

function screenToCell(sx,sy){
  const q=Math.floor((sx+camX)/CELL);
  const r=Math.floor((sy+camY)/CELL);
  return {q,r};
}

function pregenChunk(){
  const cq=Math.floor(camX/CELL),cr=Math.floor(camY/CELL);
  for(let q=cq-chunkRadius;q<=cq+chunkRadius;q++)
    for(let r=cr-chunkRadius;r<=cr+chunkRadius;r++)
      getCell(q,r);
}

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;H=canvas.height=wrap.clientHeight;
}

const COUNT_COLORS=['transparent','#4FC3F7','#00FF88','#FF4D4D','#FFB800','#FF4D4D','#00E5FF','#000','#888'];

function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  const startQ=Math.floor(camX/CELL)-1;
  const startR=Math.floor(camY/CELL)-1;
  const endQ=Math.ceil((camX+W)/CELL)+1;
  const endR=Math.ceil((camY+H)/CELL)+1;

  for(let q=startQ;q<=endQ;q++){
    for(let r=startR;r<=endR;r++){
      const cell=getCell(q,r);
      const sx=q*CELL-camX, sy=r*CELL-camY;

      if(cell.revealed){
        if(cell.mine){
          ctx.fillStyle='#FF4D4D';ctx.fillRect(sx+1,sy+1,CELL-2,CELL-2);
          ctx.fillStyle='#000';ctx.font='bold 16px monospace';ctx.textAlign='center';
          ctx.fillText('💥',sx+CELL/2,sy+CELL/2+6);
        } else {
          ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(sx,sy,CELL,CELL);
          if(cell.count>0){
            ctx.fillStyle=COUNT_COLORS[cell.count]||'#fff';
            ctx.font=`bold ${CELL*0.4}px JetBrains Mono,monospace`;ctx.textAlign='center';
            ctx.fillText(cell.count,sx+CELL/2,sy+CELL*0.65);
          }
        }
      } else {
        ctx.fillStyle=cell.flagged?'rgba(255,77,77,0.3)':'rgba(255,255,255,0.06)';
        ctx.fillRect(sx+1,sy+1,CELL-2,CELL-2);
        ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
        ctx.strokeRect(sx+1,sy+1,CELL-2,CELL-2);
        if(cell.flagged){
          ctx.font=`${CELL*0.5}px monospace`;ctx.textAlign='center';
          ctx.fillText('🚩',sx+CELL/2,sy+CELL*0.65);
        }
      }
    }
  }

  ctx.textAlign='left';

  // Crosshair center indicator
  ctx.strokeStyle='rgba(0,229,255,0.1)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
}

let panning=false,panStart={x:0,y:0,cx:0,cy:0};

canvas.addEventListener('mousedown',e=>{
  if(e.button===1||e.altKey){panning=true;panStart={x:e.clientX,y:e.clientY,cx:camX,cy:camY};}
});
canvas.addEventListener('contextmenu',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  const {q,r:row}=screenToCell(e.clientX-r.left,e.clientY-r.top);
  const cell=getCell(q,row);
  if(!cell.revealed) cell.flagged=!cell.flagged;
  draw();
});
canvas.addEventListener('click',e=>{
  if(!running||gameOver)return;
  const r=canvas.getBoundingClientRect();
  const {q,r:row}=screenToCell(e.clientX-r.left,e.clientY-r.top);
  reveal(q,row);
  pregenChunk();
  draw();
  if(gameOver) setTimeout(endGame,500);
});
canvas.addEventListener('mousemove',e=>{
  if(!panning)return;
  camX=panStart.cx-(e.clientX-panStart.x);camY=panStart.cy-(e.clientY-panStart.y);
  pregenChunk();draw();
});
canvas.addEventListener('mouseup',()=>panning=false);

// WASD pan
const keys={};
document.addEventListener('keydown',e=>keys[e.key]=true);
document.addEventListener('keyup',e=>keys[e.key]=false);

function gameLoop(){
  if(running){
    let moved=false;
    if(keys['a']||keys['ArrowLeft']){camX-=5;moved=true;}
    if(keys['d']||keys['ArrowRight']){camX+=5;moved=true;}
    if(keys['w']||keys['ArrowUp']){camY-=5;moved=true;}
    if(keys['s']||keys['ArrowDown']){camY+=5;moved=true;}
    if(moved){pregenChunk();draw();}
  }
  requestAnimationFrame(gameLoop);
}

function startGame(){
  cells=new Map();score=0;gameOver=false;scoreDom.textContent=0;
  camX=(W/2)-CELL*5;camY=(H/2)-CELL*5;
  pregenChunk();reveal(5,5);// Reveal center to start
  overlay.style.display='none';running=true;draw();
}
function endGame(){
  running=false;saveBest();
  document.getElementById('overlay-title').textContent='BOOM';
  document.getElementById('overlay-msg').innerHTML=`Cells revealed: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='PLAY AGAIN';overlay.style.display='flex';
}

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',()=>{resize();draw();});
resize();loadBest();requestAnimationFrame(gameLoop);
