// games/ant-farm/script.js — Ant Farm
// Pheromone grid matrix with frame-based decay. Emergent colony behavior.

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
let W,H;
const CELL=6;
let COLS,ROWS;
let homePhero,foodPhero;
let ants=[],food=[],t=0;
const N_ANTS=80,PHERO_DECAY=0.995,PHERO_DEPOSIT=50,SENSE_DIST=3;

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;H=canvas.height=wrap.clientHeight;
  COLS=Math.floor(W/CELL);ROWS=Math.floor(H/CELL);
  homePhero=new Float32Array(COLS*ROWS);
  foodPhero=new Float32Array(COLS*ROWS);
}

const HOME={x:0,y:0};

function idx(c,r){return r*COLS+c;}
function cellC(x){return Math.floor(x/CELL);}
function cellR(y){return Math.floor(y/CELL);}

class Ant{
  constructor(){
    const home=HOME;
    this.x=W*0.1+Math.random()*20;this.y=H*0.5+Math.random()*20;
    this.angle=Math.random()*Math.PI*2;this.speed=1.4;
    this.carrying=false;
  }
  sense(phero){
    // Sense in 3 directions: forward-left, forward, forward-right
    const dirs=[-0.4,0,0.4];
    const vals=dirs.map(da=>{
      const a=this.angle+da;
      const sc=cellC(this.x+Math.cos(a)*SENSE_DIST*CELL);
      const sr=cellR(this.y+Math.sin(a)*SENSE_DIST*CELL);
      if(sc<0||sc>=COLS||sr<0||sr>=ROWS)return 0;
      return phero[idx(sc,sr)];
    });
    if(vals[1]>vals[0]&&vals[1]>vals[2]) return 0;
    if(vals[0]>vals[2]) return -0.4;
    if(vals[2]>vals[0]) return 0.4;
    return (Math.random()-0.5)*0.4;
  }
  update(){
    const target=this.carrying?homePhero:foodPhero;
    this.angle+=this.sense(target)+(Math.random()-0.5)*0.25;
    this.x+=Math.cos(this.angle)*this.speed;
    this.y+=Math.sin(this.angle)*this.speed;
    // Bounce walls
    if(this.x<0||this.x>W){this.angle=Math.PI-this.angle;this.x=Math.max(1,Math.min(W-1,this.x));}
    if(this.y<0||this.y>H){this.angle=-this.angle;this.y=Math.max(1,Math.min(H-1,this.y));}
    const c=cellC(this.x),r=cellR(this.y);
    if(c<0||c>=COLS||r<0||r>=ROWS)return;
    // Deposit pheromone
    if(this.carrying){
      homePhero[idx(c,r)]=Math.min(255,homePhero[idx(c,r)]+PHERO_DEPOSIT);
    } else {
      foodPhero[idx(c,r)]=Math.min(255,foodPhero[idx(c,r)]+PHERO_DEPOSIT*0.5);
    }
    // Pick up food
    if(!this.carrying){
      for(let i=food.length-1;i>=0;i--){
        const f=food[i];
        if(Math.abs(this.x-f.x)<8&&Math.abs(this.y-f.y)<8){
          this.carrying=true;this.angle+=Math.PI;// turn around
          f.amount--;if(f.amount<=0)food.splice(i,1);
          break;
        }
      }
    }
    // Return home
    if(this.carrying){
      const dx=W*0.1-this.x,dy=H*0.5-this.y;
      if(Math.sqrt(dx*dx+dy*dy)<12){this.carrying=false;this.angle+=Math.PI;}
    }
  }
}

function spawnFood(mx,my){
  food.push({x:mx,y:my,amount:20+Math.floor(Math.random()*30)});
}

function init(){
  resize();
  HOME.x=W*0.1;HOME.y=H*0.5;
  ants=Array.from({length:N_ANTS},()=>new Ant());
  // Initial food clusters
  for(let i=0;i<4;i++) spawnFood(W*0.4+Math.random()*W*0.5,H*0.1+Math.random()*H*0.8);
}

let imgData;
function draw(){
  if(!imgData||imgData.width!==W||imgData.height!==H) imgData=ctx.createImageData(W,H);
  const d=imgData.data;
  d.fill(0);
  // Pheromone rendering
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const hp=homePhero[idx(c,r)],fp=foodPhero[idx(c,r)];
    for(let dy=0;dy<CELL;dy++)for(let dx=0;dx<CELL;dx++){
      const pi=4*((r*CELL+dy)*W+(c*CELL+dx));
      d[pi]=Math.min(255,10+fp*0.6); // red=food phero
      d[pi+1]=Math.min(255,hp*0.4);  // green=home phero
      d[pi+2]=Math.min(255,hp*0.6);
      d[pi+3]=Math.min(255,10+hp*0.5+fp*0.4);
    }
  }
  ctx.putImageData(imgData,0,0);
  // Food
  food.forEach(f=>{
    ctx.fillStyle='rgba(255,184,0,0.9)';ctx.shadowColor='#FFB800';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(f.x,f.y,6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  });
  // Ants
  ants.forEach(a=>{
    ctx.fillStyle=a.carrying?'#FFB800':'rgba(255,255,255,0.7)';
    ctx.beginPath();ctx.arc(a.x,a.y,2,0,Math.PI*2);ctx.fill();
  });
  // Home
  ctx.strokeStyle='rgba(0,229,255,0.7)';ctx.lineWidth=2;ctx.shadowColor='#00E5FF';ctx.shadowBlur=10;
  ctx.beginPath();ctx.arc(HOME.x,HOME.y,18,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(0,229,255,0.5)';ctx.font='10px mono';ctx.textAlign='center';ctx.fillText('HOME',HOME.x,HOME.y+4);
  ctx.textAlign='left';
}

function loop(){
  t++;
  ants.forEach(a=>a.update());
  // Decay pheromones
  for(let i=0;i<homePhero.length;i++){homePhero[i]*=PHERO_DECAY;foodPhero[i]*=PHERO_DECAY;}
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect();
  spawnFood(e.clientX-r.left,e.clientY-r.top);
});
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();const r=canvas.getBoundingClientRect();
  spawnFood(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);
},{passive:false});

window.addEventListener('resize',init);
init();requestAnimationFrame(loop);
