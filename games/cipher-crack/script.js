// games/cipher-crack/script.js — Cipher Crack
// Caesar and Vigenere decryption under a countdown timer

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const bestDom=document.getElementById('best-display');
const LS_KEY='cipher-crack-high-score';

// Game is primarily DOM-based for text input
const gameDiv=document.getElementById('game-content');
let score=0,best=0,timeLeft=60,timerInterval,round=0;
let currentAnswer='',currentInput='';

const WORDS=['PHYSICS','QUANTUM','ORBITAL','LASER','NEBULA','PHOTON','COSMOS','PULSE','MATRIX','VECTOR',
             'CIPHER','SIGNAL','BINARY','NEURAL','PLASMA','FRACTAL','VERTEX','WORMHOLE','ENTROPY'];

function loadBest(){best=parseInt(localStorage.getItem(LS_KEY)||'0');bestDom.textContent=best;}
function saveBest(){if(score>best){best=score;localStorage.setItem(LS_KEY,best);bestDom.textContent=best;}}

function caesar(text,shift){
  return text.split('').map(c=>{
    if(c>='A'&&c<='Z') return String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65);
    return c;
  }).join('');
}

function vigenere(text,key){
  let ki=0;
  return text.split('').map(c=>{
    if(c>='A'&&c<='Z'){
      const shift=key.charCodeAt(ki%key.length)-65;
      ki++;
      return String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65);
    }
    return c;
  }).join('');
}

function generateRound(){
  round++;
  const word=WORDS[Math.floor(Math.random()*WORDS.length)];
  const type=round>3&&Math.random()<0.4?'vigenere':'caesar';
  let ciphertext,hint;

  if(type==='caesar'){
    const shift=1+Math.floor(Math.random()*12);
    ciphertext=caesar(word,shift);
    hint=`Caesar cipher — shift: ${shift}`;
  } else {
    const keys=['KEY','CODE','GATE','LOCK'];
    const k=keys[Math.floor(Math.random()*keys.length)];
    ciphertext=vigenere(word,k);
    hint=`Vigenère — key: ${k}`;
  }

  currentAnswer=word;
  currentInput='';
  return {ciphertext,hint,type,word};
}

function renderGame(){
  const r=generateRound();
  gameDiv.innerHTML=`
    <div style="font-family:JetBrains Mono,monospace;color:var(--text);max-width:500px;margin:0 auto;padding:20px;text-align:center;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Round ${round} — ${r.type.toUpperCase()}</div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:12px;">${r.hint}</div>
      <div style="font-size:36px;letter-spacing:0.25em;color:#FF4D4D;margin:16px 0;font-weight:bold;">${r.ciphertext}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px;">Decrypt the word above</div>
      <input id="ans-input" type="text" maxlength="${r.word.length}" 
        autocomplete="off" autocorrect="off" spellcheck="false"
        style="font-family:JetBrains Mono,monospace;font-size:24px;letter-spacing:0.2em;
               text-align:center;background:rgba(255,255,255,0.05);border:1px solid var(--border);
               color:var(--accent);padding:10px 20px;border-radius:4px;width:300px;
               text-transform:uppercase;outline:none;">
      <div id="ans-feedback" style="margin-top:12px;font-size:13px;height:20px;color:var(--accent)"></div>
    </div>
  `;
  const input=document.getElementById('ans-input');
  input.focus();
  input.addEventListener('input',e=>{
    e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'');
    currentInput=e.target.value;
    if(currentInput.length===r.word.length){
      if(currentInput===currentAnswer){
        score++;scoreDom.textContent=score;
        document.getElementById('ans-feedback').textContent='✓ CORRECT!';
        document.getElementById('ans-feedback').style.color='#00FF88';
        timeLeft=Math.min(60,timeLeft+5); // bonus time
        setTimeout(renderGame,600);
      } else {
        document.getElementById('ans-feedback').textContent='✗ Wrong — try again';
        document.getElementById('ans-feedback').style.color='#FF4D4D';
        e.target.value='';
      }
    }
  });
}

function startGame(){
  score=0;round=0;timeLeft=60;
  scoreDom.textContent=0;
  overlay.style.display='none';
  canvas.style.display='none';
  gameDiv.style.display='block';
  renderGame();
  timerInterval=setInterval(()=>{
    timeLeft--;
    // Draw timer on canvas (hidden — use DOM instead)
    if(gameDiv){
      let timerEl=document.getElementById('timer-display');
      if(!timerEl){
        timerEl=document.createElement('div');
        timerEl.id='timer-display';
        timerEl.style.cssText='font-family:JetBrains Mono,monospace;font-size:22px;text-align:center;color:var(--muted);position:fixed;top:80px;right:30px;';
        document.body.appendChild(timerEl);
      }
      const col=timeLeft<=10?'#FF4D4D':timeLeft<=20?'#FFB800':'var(--muted)';
      timerEl.innerHTML=`<span style="color:${col}">${timeLeft}s</span>`;
    }
    if(timeLeft<=0) endGame();
  },1000);
}

function endGame(){
  clearInterval(timerInterval);
  const el=document.getElementById('timer-display');
  if(el)el.remove();
  saveBest();
  gameDiv.innerHTML='';
  gameDiv.style.display='none';
  canvas.style.display='block';
  document.getElementById('overlay-title').textContent='TIME\'S UP';
  document.getElementById('overlay-msg').innerHTML=`Decoded: <span style="color:var(--accent)">${score}</span> words`;
  startBtn.textContent='PLAY AGAIN';overlay.style.display='flex';

  // Draw summary on canvas
  const wrap=canvas.parentElement;
  canvas.width=wrap.clientWidth;canvas.height=wrap.clientHeight;
  ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,canvas.width,canvas.height);
}

startBtn.addEventListener('click',startGame);
loadBest();

// Initial canvas state
(function initCanvas(){
  const wrap=canvas.parentElement;
  canvas.width=wrap.clientWidth;canvas.height=wrap.clientHeight;
  ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,canvas.width,canvas.height);
})();
