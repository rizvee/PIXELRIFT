// games/virus-spread/script.js — SIR Epidemiological Model

const canvas     = document.getElementById('game-canvas');
const ctx        = canvas.getContext('2d');
const sEl        = document.getElementById('s-count');
const iEl        = document.getElementById('i-count');
const rEl        = document.getElementById('r-count');
const vaxEl      = document.getElementById('vax-count');
const endOverlay = document.getElementById('end-overlay');
const endTitle   = document.getElementById('end-title');
const endMsg     = document.getElementById('end-msg');
const resetBtn   = document.getElementById('btn-reset');
const restartBtn = document.getElementById('btn-restart');

const N_NODES = 50;
const INFECT_PROB = 0.012;
const RECOVER_TIME = 200; // ticks

let W, H, nodes, edges, vaccines, tick, raf, running;

const S=0, I=1, R=2, V=3;
const NODE_COLORS = ['#4FC3F7','#FF4D4D','#00FF88','#00E5FF'];
const NODE_R = 14;

function resize() {
  const wrap = canvas.parentElement;
  W = canvas.width  = wrap.clientWidth;
  H = canvas.height = wrap.clientHeight;
}

function buildGraph() {
  nodes = [];
  edges = [];
  vaccines = 10;
  tick = 0;
  running = true;
  vaxEl.textContent = vaccines;
  endOverlay.style.display = 'none';

  const margin = 60;
  for (let i = 0; i < N_NODES; i++) {
    nodes.push({
      x: margin + Math.random()*(W-margin*2),
      y: margin + Math.random()*(H-margin*2),
      state: S,
      timer: 0,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4
    });
  }

  // Connect nearby nodes
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a+1; b < nodes.length; b++) {
      const dx=nodes[a].x-nodes[b].x, dy=nodes[a].y-nodes[b].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d < 140 && edges.filter(e=>e.a===a||e.b===a).length < 5) {
        edges.push({ a, b });
      }
    }
  }

  // Seed infection
  for (let i = 0; i < 2; i++) {
    const n = nodes[Math.floor(Math.random()*N_NODES)];
    n.state = I; n.timer = RECOVER_TIME;
  }

  updateHUD();
}

function updateHUD() {
  const s=nodes.filter(n=>n.state===S).length;
  const i=nodes.filter(n=>n.state===I).length;
  const r=nodes.filter(n=>n.state===R||n.state===V).length;
  sEl.textContent=s; iEl.textContent=i; rEl.textContent=r;
}

function stepSim() {
  tick++;

  // Spread infection along edges
  edges.forEach(e => {
    const na=nodes[e.a], nb=nodes[e.b];
    if (na.state===I && nb.state===S && Math.random()<INFECT_PROB) { nb.state=I; nb.timer=RECOVER_TIME; }
    if (nb.state===I && na.state===S && Math.random()<INFECT_PROB) { na.state=I; na.timer=RECOVER_TIME; }
  });

  // Recovery
  nodes.forEach(n => {
    if (n.state===I) {
      n.timer--;
      if (n.timer<=0) n.state=R;
    }
    // Gentle float
    n.x+=n.vx; n.y+=n.vy;
    if (n.x<NODE_R||n.x>W-NODE_R) n.vx*=-1;
    if (n.y<NODE_R||n.y>H-NODE_R) n.vy*=-1;
  });

  updateHUD();

  // Win/lose check
  const infected=nodes.filter(n=>n.state===I).length;
  const susceptible=nodes.filter(n=>n.state===S).length;

  if (infected===0) {
    endGame(susceptible > 0 ? 'CONTAINED' : 'SWEPT');
  }
}

function endGame(result) {
  running = false;
  const r = nodes.filter(n=>n.state===R).length;
  const v = nodes.filter(n=>n.state===V).length;
  endTitle.textContent = result === 'CONTAINED' ? '✓ Contained' : '✕ Outbreak';
  endMsg.innerHTML = `<span style="color:var(--accent)">${r}</span> recovered · <span style="color:#00E5FF">${v}</span> vaccinated`;
  endOverlay.style.display = 'flex';
}

function render() {
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0A0A0A';
  ctx.fillRect(0,0,W,H);

  // Edges
  edges.forEach(e => {
    const na=nodes[e.a], nb=nodes[e.b];
    const infected=na.state===I||nb.state===I;
    ctx.strokeStyle=infected?'rgba(255,77,77,0.25)':'rgba(255,255,255,0.06)';
    ctx.lineWidth=infected?1.5:1;
    ctx.beginPath();
    ctx.moveTo(na.x,na.y);
    ctx.lineTo(nb.x,nb.y);
    ctx.stroke();
  });

  // Nodes
  nodes.forEach(n => {
    const col=NODE_COLORS[n.state];
    ctx.shadowColor=col;
    ctx.shadowBlur=n.state===I?18:8;
    ctx.fillStyle=col;
    ctx.beginPath();
    ctx.arc(n.x,n.y,NODE_R,0,Math.PI*2);
    ctx.fill();

    // Infection progress ring
    if (n.state===I) {
      const prog=(RECOVER_TIME-n.timer)/RECOVER_TIME;
      ctx.strokeStyle='#FF4D4D';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(n.x,n.y,NODE_R+5,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);
      ctx.stroke();
    }
    ctx.shadowBlur=0;
  });
}

function loop() {
  if (running) stepSim();
  render();
  raf=requestAnimationFrame(loop);
}

// Click to vaccinate
canvas.addEventListener('click', e => {
  if (!running || vaccines<=0) return;
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  const clicked=nodes.find(n=>{
    const dx=n.x-mx, dy=n.y-my;
    return dx*dx+dy*dy<(NODE_R+6)**2 && n.state===S;
  });
  if (clicked) {
    clicked.state=V;
    vaccines--;
    vaxEl.textContent=vaccines;
    updateHUD();
  }
});

resetBtn.addEventListener('click', () => { cancelAnimationFrame(raf); buildGraph(); requestAnimationFrame(loop); });
restartBtn.addEventListener('click', () => { cancelAnimationFrame(raf); buildGraph(); requestAnimationFrame(loop); endOverlay.style.display='none'; });

window.addEventListener('resize', () => { resize(); });
resize();
buildGraph();
requestAnimationFrame(loop);
