// games/flow-state/script.js — Flow State
// Connect matching colored dots with non-overlapping paths

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='flow-state-high-score';

let W,H,CELL,COLS,ROWS;
let score=0,best=0,running=false;
let dots,paths,occupied,drawing,level;

const COLORS=['#FF4D4D','#00E5FF','#00FF88','#FFB800','#AA44FF','#FF6D00'];

const LEVELS=[
  {cols:6,rows:6,dots:[[0,0,0],[5,5,0],[0,2,1],[5,2,1],[2,0,2],[2,5,2],[4,1,3],[4,4,3]]},
  {cols:7,rows:7,dots:[[0,0,0],[6,6,0],[0,3,1],[6,3,1],[3,0,2],[3,6,2],[1,1,3],[5,1,3],[1,5,4],[5,5,4]]},
  {cols:8,rows:8,dots:[[0,0,0],[7,7,0],[0,4,1],[7,3,1],[3,0,2],[4,7,2],[0,7,3],[7,0,3],[3,3,4],[4,4,4],[1,2,5],[6,5,5]]},
];

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function initLevel(lv){
  const def=LEVELS[lv%LEVELS.length];
  COLS=def.cols;ROWS=def.rows;
  const wrap=canvas.parentElement;
  const size=Math.min(wrap.clientWidth,wrap.clientHeight)-40;
  CELL=Math.floor(size/Math.max(COLS,ROWS));
  canvas.width=COLS*CELL;canvas.height=ROWS*CELL;
  dots=def.dots.map(([c,r,ci])=>({c,r,colorIdx:ci}));
  paths=Array.from({length:COLORS.length},()=>[]);
  occupied=Array.from({length:COLS},()=>Array(ROWS).fill(-1));
  dots.forEach(d=>occupied[d.c][d.r]=d.colorIdx);
  drawing=null;
}

function initGame(){score=0;scoreDom.textContent=0;level=0;initLevel(0);overlay.style.display='none';draw();}

function cellAt(mx,my){
  return {c:Math.floor(mx/CELL),r:Math.floor(my/CELL)};
}

function isValidCell(c,r){return c>=0&&c<COLS&&r>=0&&r<ROWS;}

function checkWin(){
  // All cells must be occupied and all paths must connect their dot pairs
  const full=occupied.every(col=>col.every(v=>v>=0));
  const connected=dots.every(d=>{
    const path=paths[d.colorIdx];
    return path.length>=2&&path.some(p=>p.c===d.c&&p.r===d.r);
  });
  return full&&connected;
}

function draw(){
  ctx.clearRect(0,0,COLS*CELL,ROWS*CELL);
  ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);

  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
  for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,ROWS*CELL);ctx.stroke();}
  for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(COLS*CELL,r*CELL);ctx.stroke();}

  // Paths
  paths.forEach((path,ci)=>{
    if(path.length<2)return;
    ctx.strokeStyle=COLORS[ci];ctx.lineWidth=CELL*0.45;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.globalAlpha=0.6;
    ctx.beginPath();path.forEach((p,i)=>i===0?ctx.moveTo(p.c*CELL+CELL/2,p.r*CELL+CELL/2):ctx.lineTo(p.c*CELL+CELL/2,p.r*CELL+CELL/2));
    ctx.stroke();ctx.globalAlpha=1;
  });

  // Dots
  dots.forEach(d=>{
    ctx.shadowColor=COLORS[d.colorIdx];ctx.shadowBlur=14;
    ctx.fillStyle=COLORS[d.colorIdx];
    ctx.beginPath();ctx.arc(d.c*CELL+CELL/2,d.r*CELL+CELL/2,CELL*0.32,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  });
}

canvas.addEventListener('mousedown',e=>{
  if(!running)return;
  const r=canvas.getBoundingClientRect();
  const {c,r:row}=cellAt(e.clientX-r.left,e.clientY-r.top);
  const dot=dots.find(d=>d.c===c&&d.r===row);
  if(dot){
    const ci=dot.colorIdx;
    // Clear existing path for this color
    paths[ci].forEach(p=>{ if(occupied[p.c] && occupied[p.c][p.r]===ci&&!dots.some(d=>d.c===p.c&&d.r===p.r)) occupied[p.c][p.r]=-1; });
    paths[ci]=[];
    drawing={colorIdx:ci};
    paths[ci].push({c,r:row});occupied[c][row]=ci;
  }
});
canvas.addEventListener('mousemove',e=>{
  if(!drawing||!running)return;
  const r=canvas.getBoundingClientRect();
  const {c,row}=(() => { const v=cellAt(e.clientX-r.left,e.clientY-r.top);return{c:v.c,row:v.r};})();
  if(!isValidCell(c,row))return;
  const path=paths[drawing.colorIdx];
  const last=path[path.length-1];
  if(last.c===c&&last.r===row)return;
  // Must be adjacent to last
  if(Math.abs(c-last.c)+Math.abs(row-last.r)!==1)return;
  // Backtrack if going back over own path
  if(path.length>=2){
    const prev=path[path.length-2];
    if(prev.c===c&&prev.r===row){
      const rem=path.pop();
      if(!dots.some(d=>d.c===rem.c&&d.r===rem.r)) occupied[rem.c][rem.r]=-1;
      draw();return;
    }
  }
  // Cell must be free
  if(occupied[c][row]>=0&&!dots.some(d=>d.c===c&&d.r===row&&d.colorIdx===drawing.colorIdx))return;
  path.push({c,r:row});occupied[c][row]=drawing.colorIdx;
  draw();
  if(checkWin()){score++;scoreDom.textContent=score;saveBest();drawing=null;
    setTimeout(()=>{level++;initLevel(level);draw();},600);}
});
canvas.addEventListener('mouseup',()=>drawing=null);
// Touch
canvas.addEventListener('touchstart',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();const ev=new MouseEvent('mousedown',{clientX:e.touches[0].clientX,clientY:e.touches[0].clientY});canvas.dispatchEvent(ev);},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();const r2=canvas.getBoundingClientRect();const ev=new MouseEvent('mousemove',{clientX:e.touches[0].clientX,clientY:e.touches[0].clientY});canvas.dispatchEvent(ev);},{passive:false});
canvas.addEventListener('touchend',()=>canvas.dispatchEvent(new MouseEvent('mouseup')));

function startGame(){initGame();running=true;}
startBtn.addEventListener('click',startGame);
loadBest();
