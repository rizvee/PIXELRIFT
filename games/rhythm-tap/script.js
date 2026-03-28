// games/rhythm-tap/script.js — Rhythm Tap
// performance.now() delta timing. Array of timestamp targets.

const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn= document.getElementById('start-btn');
const scoreDom= document.getElementById('score-display');
const bestDom = document.getElementById('best-display');
const LS_KEY  = 'rhythm-tap-high-score';

let W, H, CX, CY;
let running=false, score=0, best=0, combo=0, maxCombo=0;
let beats=[], t=0, startTime=0, raf;

// Beat generation — BPM
const BPM=120;
const BEAT_MS=60000/BPM;
const HIT_WINDOW_PERFECT=50; // ms
const HIT_WINDOW_GOOD=120;   // ms
const RING_MAX_R=160;
const RING_MIN_R=20;

let lastRating='';
let ratingTimer=0;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  CX=W/2; CY=H/2;
}

function loadBest(){ best=parseInt(localStorage.getItem(LS_KEY)||'0'); bestDom.textContent=best; }
function saveBest(){ if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;} }

function generateBeats(){
  beats=[];
  // Generate 32 beats, some with rests
  for(let i=0;i<32;i++){
    if(Math.random()<0.75){ // 75% of beats are active
      beats.push({
        targetTime: startTime + i*BEAT_MS,
        hit: false,
        missed: false,
        angle: Math.random()*Math.PI*2
      });
    }
  }
}

function getNow(){ return performance.now(); }

function startGame(){
  score=0; combo=0; maxCombo=0; t=0;
  scoreDom.textContent=0;
  startTime=getNow()+1000; // 1 sec delay before first beat
  generateBeats();
  overlay.style.display='none';
  running=true;
  raf=requestAnimationFrame(loop);
}

function tryHit(){
  if(!running) return;
  const now=getNow();
  // Find the nearest un-hit beat
  let closest=null, closestDelta=Infinity;
  beats.forEach(b=>{
    if(b.hit||b.missed) return;
    const delta=Math.abs(now-b.targetTime);
    if(delta<closestDelta){ closestDelta=delta; closest=b; }
  });
  if(!closest||closestDelta>HIT_WINDOW_GOOD){
    // Miss penalty
    combo=0;
    showRating('MISS',false);
    return;
  }
  closest.hit=true;
  combo++;
  maxCombo=Math.max(maxCombo,combo);
  const pts=closestDelta<=HIT_WINDOW_PERFECT?100:50;
  score+=pts*(1+Math.floor(combo/4));
  scoreDom.textContent=score;
  showRating(closestDelta<=HIT_WINDOW_PERFECT?'PERFECT':'GOOD',true);
}

function showRating(txt,good){
  lastRating=txt;
  ratingTimer=40;
  lastRatingColor=good?(txt==='PERFECT'?'#00E5FF':'#00FF88'):'#FF4D4D';
}
let lastRatingColor='#fff';

function loop(ts){
  if(!running)return;
  t++;
  const now=getNow();

  // Mark missed beats
  beats.forEach(b=>{
    if(!b.hit&&!b.missed&&now>b.targetTime+HIT_WINDOW_GOOD){
      b.missed=true; combo=0;
    }
  });

  // End game when all beats processed
  if(beats.length&&beats.every(b=>b.hit||b.missed)){
    endGame(); return;
  }

  draw(now);
  raf=requestAnimationFrame(loop);
}

function draw(now=getNow()){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  // BPM pulse background
  const beatPhase=((now-startTime)%BEAT_MS)/BEAT_MS;
  const pulse=Math.max(0,1-beatPhase*2);
  ctx.fillStyle=`rgba(0,229,255,${pulse*0.04})`;
  ctx.fillRect(0,0,W,H);

  // Render each beat as a shrinking ring
  beats.forEach(b=>{
    if(b.hit||b.missed) return;
    const dt=b.targetTime-now;
    if(dt>BEAT_MS*2) return; // not yet approaching
    const progress=1-Math.max(0,Math.min(1,dt/BEAT_MS));
    const r=RING_MAX_R-(RING_MAX_R-RING_MIN_R)*progress;
    const alpha=Math.min(1,progress*2);

    // The beat circle — center offset by angle for variety
    const bx=CX+Math.cos(b.angle)*60*Math.max(0,1-progress*2);
    const by=CY+Math.sin(b.angle)*60*Math.max(0,1-progress*2);

    ctx.strokeStyle=`rgba(0,229,255,${alpha})`;
    ctx.lineWidth=3;
    ctx.shadowColor='#00E5FF';
    ctx.shadowBlur=progress>0.8?20:0;
    ctx.beginPath();
    ctx.arc(bx,by,r,0,Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur=0;

    // Core pulse dot
    ctx.fillStyle=`rgba(0,229,255,${alpha*0.6})`;
    ctx.beginPath();
    ctx.arc(bx,by,RING_MIN_R*0.6,0,Math.PI*2);
    ctx.fill();
  });

  // Tap indicator
  ctx.strokeStyle='rgba(255,255,255,0.08)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(CX,CY,RING_MIN_R-2,0,Math.PI*2);
  ctx.stroke();

  // Rating display
  if(ratingTimer>0){
    ctx.globalAlpha=ratingTimer/40;
    ctx.fillStyle=lastRatingColor;
    ctx.font='bold 28px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(lastRating,CX,CY-40);
    ctx.globalAlpha=1;
    ratingTimer--;
  }

  // Combo
  if(combo>1){
    ctx.fillStyle='rgba(0,229,255,0.7)';
    ctx.font='14px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(`${combo}x COMBO`,CX,CY+RING_MAX_R+20);
  }

  // Progress bar
  const done=beats.filter(b=>b.hit||b.missed).length;
  ctx.fillStyle='rgba(255,255,255,0.05)';
  ctx.fillRect(20,H-20,W-40,4);
  ctx.fillStyle='#00E5FF';
  ctx.fillRect(20,H-20,(W-40)*(done/beats.length),4);

  ctx.textAlign='left';
}

function endGame(){
  running=false;
  cancelAnimationFrame(raf);
  saveBest();
  const hit=beats.filter(b=>b.hit).length;
  const acc=beats.length?Math.round(hit/beats.length*100):0;
  document.getElementById('overlay-title').textContent='STAGE CLEAR';
  document.getElementById('overlay-msg').innerHTML=
    `Score: <span style="color:var(--accent)">${score}</span> &nbsp;·&nbsp; Accuracy: <span style="color:var(--accent)">${acc}%</span>&nbsp;·&nbsp; Max Combo: <span style="color:var(--accent)">${maxCombo}x</span>`;
  startBtn.textContent='PLAY AGAIN';
  overlay.style.display='flex';
}

document.addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter'){ tryHit(); e.preventDefault(); }});
canvas.addEventListener('click',()=>tryHit());
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); tryHit(); },{passive:false});
startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize(); loadBest();
