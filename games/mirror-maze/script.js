// games/mirror-maze/script.js — Mirror Maze
// Control two avatars simultaneously. Left = normal, Right = inverted input.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='mirror-maze-high-score';

let W,H,running=false,raf,score=0,best=0;
const ROWS=10,COLS=10,CELL=40;
const keys={};

let mazeL,mazeR,playerL,playerR,goalL,goalR,level;

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

// Generate random maze using recursive backtracking
function genMaze(rows,cols){
  const grid=Array.from({length:rows},()=>Array.from({length:cols},()=>({top:true,right:true,bottom:true,left:true,visited:false})));
  function visit(r,c){
    grid[r][c].visited=true;
    const dirs=[[0,1,'right','left'],[1,0,'bottom','top'],[0,-1,'left','right'],[-1,0,'top','bottom']].sort(()=>Math.random()-0.5);
    dirs.forEach(([dr,dc,d1,d2])=>{
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!grid[nr][nc].visited){
        grid[r][c][d1]=false;grid[nr][nc][d2]=false;visit(nr,nc);
      }
    });
  }
  visit(0,0);return grid;
}

function canMove(maze,r,c,dir){
  if(r<0||r>=ROWS||c<0||c>=COLS) return false;
  const cell=maze[r][c];
  if(dir==='up') return !cell.top;
  if(dir==='down') return !cell.bottom;
  if(dir==='left') return !cell.left;
  if(dir==='right') return !cell.right;
  return false;
}

function initLevel(){
  mazeL=genMaze(ROWS,COLS);
  mazeR=genMaze(ROWS,COLS);
  playerL={r:0,c:0};playerR={r:0,c:0};
  goalL={r:ROWS-1,c:COLS-1};goalR={r:ROWS-1,c:COLS-1};
}

function initGame(){
  score=0;scoreDom.textContent=0;level=0;initLevel();overlay.style.display='none';
}

const PANEL_PAD=20;

function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  const panelW=Math.min((W-PANEL_PAD*3)/2,COLS*CELL);
  const panelH=ROWS*CELL;
  const leftX=PANEL_PAD,rightX=PANEL_PAD*2+panelW;
  const topY=(H-panelH)/2;

  // Labels
  ctx.fillStyle='rgba(0,229,255,0.6)';ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText('NORMAL',leftX+panelW/2,topY-8);
  ctx.fillStyle='rgba(255,100,200,0.6)';
  ctx.fillText('MIRRORED',rightX+panelW/2,topY-8);
  ctx.textAlign='left';

  [mazeL,mazeR].forEach((maze,side)=>{
    const ox=side===0?leftX:rightX;
    const oy=topY;
    const col=side===0?'rgba(0,229,255,0.7)':'rgba(255,100,200,0.7)';
    // Cells
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const x=ox+c*CELL,y=oy+r*CELL;
      ctx.strokeStyle=col;ctx.lineWidth=1;
      if(maze[r][c].top){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+CELL,y);ctx.stroke();}
      if(maze[r][c].left){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+CELL);ctx.stroke();}
      if(r===ROWS-1&&maze[r][c].bottom){ctx.beginPath();ctx.moveTo(x,y+CELL);ctx.lineTo(x+CELL,y+CELL);ctx.stroke();}
      if(c===COLS-1&&maze[r][c].right){ctx.beginPath();ctx.moveTo(x+CELL,y);ctx.lineTo(x+CELL,y+CELL);ctx.stroke();}
    }
    // Goal
    const goal=side===0?goalL:goalR;
    ctx.fillStyle=`rgba(${side===0?'0,255,136':'255,200,0'},0.25)`;
    ctx.fillRect(ox+goal.c*CELL+2,oy+goal.r*CELL+2,CELL-4,CELL-4);

    // Player
    const p=side===0?playerL:playerR;
    ctx.shadowColor=col;ctx.shadowBlur=16;
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(ox+p.c*CELL+CELL/2,oy+p.r*CELL+CELL/2,CELL/3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  });
}

let moveTimer=0;
function tryMove(dir){
  if(!running)return;
  // Inverted controls for right player
  const inv={up:'down',down:'up',left:'right',right:'left'};
  const dirR=dir;  // same column/row mirror — invert column movement
  const invDir=dir==='left'?'right':dir==='right'?'left':dir;

  const deltas={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
  const [dr,dc]=deltas[dir];

  // Left player moves normally
  const nr1=playerL.r+dr,nc1=playerL.c+dc;
  if(canMove(mazeL,playerL.r,playerL.c,dir)){playerL.r=nr1;playerL.c=nc1;}

  // Right player: L/R inverted
  const [dr2,dc2]=deltas[invDir];
  const nr2=playerR.r+dr2,nc2=playerR.c+dc2;
  if(canMove(mazeR,playerR.r,playerR.c,invDir)){playerR.r=nr2;playerR.c=nc2;}

  // Check win
  if(playerL.r===goalL.r&&playerL.c===goalL.c&&playerR.r===goalR.r&&playerR.c===goalR.c){
    score++;scoreDom.textContent=score;saveBest();initLevel();
  }
  draw();
}

function loop(){
  if(!running)return;
  moveTimer++;
  if(moveTimer%8===0){
    if(keys['ArrowUp']||keys['w']) tryMove('up');
    else if(keys['ArrowDown']||keys['s']) tryMove('down');
    else if(keys['ArrowLeft']||keys['a']) tryMove('left');
    else if(keys['ArrowRight']||keys['d']) tryMove('right');
  }
  draw();
  raf=requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup',e=>{keys[e.key]=false;});

function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}
startBtn.addEventListener('click',startGame);
window.addEventListener('resize',()=>{
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;H=canvas.height=wrap.clientHeight;draw();
});
W=canvas.width=(canvas.parentElement||document.body).clientWidth;
H=canvas.height=(canvas.parentElement||document.body).clientHeight;
loadBest();
