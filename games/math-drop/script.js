// games/math-drop/script.js — Math Drop
// Dynamic equation generation. Falling equations to solve.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='math-drop-high-score';
const ansInput=document.getElementById('answer-input');

let W,H,running=false,raf,score=0,best=0,t=0;
let equations=[],lives=3,inputVal='';

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
}

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

// Safe math evaluation (no eval!)
function makeEquation(difficulty){
  const ops=['+','-','*'];
  const op=difficulty>3&&Math.random()<0.3?'*':ops[Math.floor(Math.random()*(difficulty>1?3:2))];
  let a,b,answer;
  if(op==='*'){
    a=2+Math.floor(Math.random()*10);b=2+Math.floor(Math.random()*9);
    answer=a*b;
  } else if(op==='+'){
    a=Math.floor(Math.random()*(10+difficulty*5));b=Math.floor(Math.random()*(10+difficulty*5));
    answer=a+b;
  } else {
    a=Math.floor(Math.random()*(10+difficulty*5))+5;b=Math.floor(Math.random()*a);
    answer=a-b;
  }
  return {text:`${a} ${op} ${b} = ?`,answer,x:30+Math.random()*(W-160),y:-30,vy:0.6+difficulty*0.05,color:`hsl(${Math.random()*60+160},80%,65%)`};
}

function initGame(){
  t=0;score=0;lives=3;scoreDom.textContent=0;
  equations=[];inputVal='';
  if(ansInput) ansInput.value='';
  overlay.style.display='none';
}

function update(){
  t++;
  // Spawn
  if(t%(120-Math.min(80,score*5))===0) equations.push(makeEquation(1+Math.floor(score/5)));

  equations=equations.filter(eq=>{
    eq.y+=eq.vy;
    if(eq.y>H+20){
      lives--;
      livesEl?.(lives);
      if(lives<=0){endGame();return false;}
      return false;
    }
    return true;
  });
}

let livesEl=null;

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);

  // Danger zone line
  ctx.strokeStyle='rgba(255,77,77,0.25)';ctx.lineWidth=1;ctx.setLineDash([8,6]);
  ctx.beginPath();ctx.moveTo(0,H-60);ctx.lineTo(W,H-60);ctx.stroke();ctx.setLineDash([]);

  // Equations
  equations.forEach(eq=>{
    const danger=(H-60-eq.y)/H;
    ctx.fillStyle=eq.color;
    ctx.shadowColor=eq.color;ctx.shadowBlur=danger<0.2?14:6;
    ctx.font=`bold ${18+Math.floor((1-danger)*8)}px JetBrains Mono,monospace`;
    ctx.textAlign='left';
    ctx.fillText(eq.text,eq.x,eq.y);
    ctx.shadowBlur=0;
  });

  // Lives
  ctx.fillStyle='#FF4D4D';ctx.font='16px monospace';ctx.textAlign='right';
  ctx.fillText('❤'.repeat(Math.max(0,lives)),W-10,H-10);

  // Current input at bottom
  ctx.fillStyle='rgba(0,229,255,0.8)';ctx.font='bold 28px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText(inputVal||'_',W/2,H-15);
  ctx.textAlign='left';
}

function submitAnswer(){
  const num=parseInt(inputVal);
  if(isNaN(num))return;
  const idx=equations.findIndex(eq=>eq.answer===num);
  if(idx>=0){
    score++;scoreDom.textContent=score;
    equations.splice(idx,1);
    inputVal='';
  } else {
    // Wrong answer flash
    ctx.fillStyle='rgba(255,77,77,0.3)';ctx.fillRect(0,0,W,H);
    inputVal='';
  }
}

function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}
function endGame(){
  running=false;cancelAnimationFrame(raf);saveBest();
  document.getElementById('overlay-title').textContent='OVERLOADED';
  document.getElementById('overlay-msg').innerHTML=`Solved: <span style="color:var(--accent)">${score}</span>`;
  startBtn.textContent='TRY AGAIN';overlay.style.display='flex';
}

// Keyboard input
document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key>='0'&&e.key<='9') inputVal+=e.key;
  if(e.key==='-'&&!inputVal) inputVal='-';
  if(e.key==='Backspace') inputVal=inputVal.slice(0,-1);
  if(e.key==='Enter'||e.key===' '){submitAnswer();e.preventDefault();}
});

// Mobile input via number overlay
if(ansInput){
  ansInput.style.opacity='0'; ansInput.style.position='absolute'; ansInput.style.pointerEvents='none';
  ansInput.addEventListener('input',e=>{inputVal=e.target.value;});
}
canvas.addEventListener('click',()=>{if(ansInput){ansInput.focus();}});

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize();loadBest();
