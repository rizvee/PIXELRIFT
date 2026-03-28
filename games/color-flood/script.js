// games/color-flood/script.js — Color Flood
// Recursive flood fill algorithm on a 2D color matrix

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const movesEl = document.getElementById('moves-display');
const bestEl  = document.getElementById('best-display');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const LS_KEY  = 'color-flood-high-score';

const COLS=14, ROWS=14, MAX_MOVES=25;
const COLORS=['#00E5FF','#FF4D4D','#FFB800','#00FF88','#AA44FF','#FF6D00'];
let CELL;
let grid, board, moves, best, won;

function resize(){
  const wrap=canvas.parentElement;
  const size=Math.min(wrap.clientWidth,wrap.clientHeight)-40;
  CELL=Math.floor(size/COLS);
  canvas.width=COLS*CELL; canvas.height=ROWS*CELL;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestEl.textContent=best; }
function saveBest(){ if(moves<best||best===0){best=moves;localStorage.setItem(LS_KEY,moves);bestEl.textContent=best;} }

function newGame(){
  moves=0; won=false; movesEl.textContent=`${moves}/${MAX_MOVES}`;
  grid=[];
  for(let y=0;y<ROWS;y++){
    grid[y]=[];
    for(let x=0;x<COLS;x++) grid[y][x]=Math.floor(Math.random()*COLORS.length);
  }
  overlay.style.display='none';
  draw();
}

// Recursive flood fill from top-left
function floodFill(x,y,oldColor,newColor){
  if(x<0||x>=COLS||y<0||y>=ROWS) return;
  if(grid[y][x]!==oldColor) return;
  if(oldColor===newColor) return;
  grid[y][x]=newColor;
  floodFill(x+1,y,oldColor,newColor);
  floodFill(x-1,y,oldColor,newColor);
  floodFill(x,y+1,oldColor,newColor);
  floodFill(x,y-1,oldColor,newColor);
}

function applyColor(colorIdx){
  if(won) return;
  const current=grid[0][0];
  if(colorIdx===current) return;
  moves++;
  movesEl.textContent=`${moves}/${MAX_MOVES}`;
  floodFill(0,0,current,colorIdx);
  draw();
  checkWin();
}

function checkWin(){
  const c=grid[0][0];
  won=grid.every(row=>row.every(v=>v===c));
  if(won){
    saveBest();
    setTimeout(()=>showOverlay(true),300);
  } else if(moves>=MAX_MOVES){
    setTimeout(()=>showOverlay(false),300);
  }
}

function showOverlay(win){
  document.getElementById('overlay-title').textContent=win?'FLOODED!':'OUT OF MOVES';
  document.getElementById('overlay-msg').innerHTML=win
    ?`Solved in <span style="color:var(--accent)">${moves}</span> moves`
    :`Board not filled in ${MAX_MOVES} moves`;
  startBtn.textContent='PLAY AGAIN';
  overlay.style.display='flex';
}

function draw(){
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const col=COLORS[grid[y][x]];
      // Flood territory (connected from 0,0)
      ctx.fillStyle=col;
      ctx.fillRect(x*CELL,y*CELL,CELL-1,CELL-1);
    }
  }
  // Border glow for top-left territory
  ctx.strokeStyle='rgba(255,255,255,0.1)';
  ctx.lineWidth=0.5;
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    ctx.strokeRect(x*CELL,y*CELL,CELL,CELL);
  }
}

// Color palette buttons drawn below grid — handled by HTML buttons
function drawPalette(){
  const paletteDiv=document.getElementById('color-palette');
  if(!paletteDiv) return;
  paletteDiv.innerHTML='';
  COLORS.forEach((c,i)=>{
    const btn=document.createElement('button');
    btn.style.cssText=`background:${c};width:36px;height:36px;border:2px solid transparent;border-radius:4px;cursor:pointer;transition:border-color 120ms;`;
    btn.addEventListener('click',()=>applyColor(i));
    paletteDiv.appendChild(btn);
  });
}

canvas.addEventListener('click',e=>{
  // Also allow clicking directly on a cell color
  const rect=canvas.getBoundingClientRect();
  const x=Math.floor((e.clientX-rect.left)/CELL);
  const y=Math.floor((e.clientY-rect.top)/CELL);
  if(x>=0&&x<COLS&&y>=0&&y<ROWS) applyColor(grid[y][x]);
});

startBtn.addEventListener('click',newGame);
window.addEventListener('resize',()=>{resize();draw();});
resize(); loadBest(); drawPalette(); newGame();
