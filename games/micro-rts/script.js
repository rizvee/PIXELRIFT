// games/micro-rts/script.js — Micro RTS
// Finite state machines per unit: idle→moving→harvesting/attacking

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('start-btn');
const scoreDom=document.getElementById('score-display');
const LS_KEY='micro-rts-high-score';

let W,H,running=false,raf,score=0,t=0;

let units=[],enemies=[],resources=[],base,enemyBase;
let selectedUnits=[],selectBox=null;
let minerals=10,kills=0;

function resize(){const wrap=canvas.parentElement;W=canvas.width=wrap.clientWidth;H=canvas.height=wrap.clientHeight;}

class Unit{
  constructor(x,y,team='player'){
    this.x=x;this.y=y;this.team=team;
    this.hp=team==='player'?60:40;this.maxHp=this.hp;
    this.atk=team==='player'?8:6;this.speed=team==='player'?1.8:1.2;
    this.range=team==='player'?45:40;this.atkCd=0;this.atkRate=40;
    this.state='idle';// idle|moving|harvesting|attacking
    this.target=null;this.dest=null;this.r=8;
    this.carrying=0;this.selected=false;
  }
  update(){
    this.atkCd=Math.max(0,this.atkCd-1);
    if(this.team==='player'){
      if(this.state==='moving'&&this.dest){
        const dx=this.dest.x-this.x,dy=this.dest.y-this.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<this.speed){this.x=this.dest.x;this.y=this.dest.y;this.state='idle';this.dest=null;}
        else{this.x+=dx/d*this.speed;this.y+=dy/d*this.speed;}
      }
      if(this.state==='harvesting'){
        if(!this.target||this.target.amount<=0){this.state='idle';this.target=null;return;}
        const dx=this.target.x-this.x,dy=this.target.y-this.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d>18){this.x+=dx/d*this.speed;this.y+=dy/d*this.speed;}
        else if(this.atkCd===0){this.carrying++;this.target.amount--;if(this.target.amount<=0)resources=resources.filter(r=>r!==this.target);this.atkCd=30;if(this.carrying>=5){minerals+=5;this.carrying=0;scoreDom.textContent=minerals;}}
      }
      if(this.state==='attacking'){
        if(!this.target||this.target.hp<=0){this.state='idle';this.target=null;return;}
        const dx=this.target.x-this.x,dy=this.target.y-this.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d>this.range){this.x+=dx/d*this.speed;this.y+=dy/d*this.speed;}
        else if(this.atkCd===0){this.target.hp-=this.atk;this.atkCd=this.atkRate;if(this.target.hp<=0){kills++;this.state='idle';}}
      }
      // Auto-attack nearby enemies
      if(this.state==='idle'){
        const nearest=enemies.find(e=>{const dx=e.x-this.x,dy=e.y-this.y;return Math.sqrt(dx*dx+dy*dy)<this.range*2;});
        if(nearest){this.state='attacking';this.target=nearest;}
      }
    } else {// enemy AI
      let et=units.find(u=>{const dx=u.x-this.x,dy=u.y-this.y;return Math.sqrt(dx*dx+dy*dy)<this.range*1.5;})||base;
      if(et){
        const dx=et.x-this.x,dy=et.y-this.y;const d=Math.sqrt(dx*dx+dy*dy);
        if(d>this.range){this.x+=dx/d*this.speed;this.y+=dy/d*this.speed;}
        else if(this.atkCd===0){('hp' in et)?et.hp-=this.atk:et.hp-=this.atk;this.atkCd=this.atkRate;}
      }
    }
  }
  draw(){
    const col=this.team==='player'?this.selected?'#00E5FF':'#4FC3F7':'#FF4D4D';
    ctx.shadowColor=col;ctx.shadowBlur=this.selected?14:4;
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // HP bar
    const bw=this.r*2,bh=3;
    ctx.fillStyle='rgba(255,0,0,0.6)';ctx.fillRect(this.x-this.r,this.y-this.r-5,bw,bh);
    ctx.fillStyle='rgba(0,255,136,0.8)';ctx.fillRect(this.x-this.r,this.y-this.r-5,bw*(this.hp/this.maxHp),bh);
    if(this.state==='harvesting'&&this.carrying>0){
      ctx.fillStyle='#FFB800';ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillText('⛏',this.x,this.y+this.r+10);
    }
  }
}

function initGame(){
  t=0;score=0;minerals=10;kills=0;
  scoreDom.textContent=minerals;
  base={x:100,y:H/2,r:20,hp:200,maxHp:200};
  enemyBase={x:W-100,y:H/2,r:20,hp:200,maxHp:200};
  units=[new Unit(base.x+50,base.y-30),new Unit(base.x+50,base.y+30)];
  enemies=[];selectedUnits=[];
  resources=Array.from({length:8},()=>({
    x:W*0.25+Math.random()*W*0.5,y:50+Math.random()*(H-100),
    amount:20+Math.floor(Math.random()*30),r:10
  }));
  overlay.style.display='none';
}

function spawnEnemy(){
  enemies.push(new Unit(enemyBase.x-30+Math.random()*20,enemyBase.y+(Math.random()-0.5)*60,'enemy'));
}

function trySpawnUnit(){
  if(minerals<5)return;
  minerals-=5;scoreDom.textContent=minerals;
  units.push(new Unit(base.x+30+(Math.random()-0.5)*20,base.y+(Math.random()-0.5)*40));
}

function update(){
  t++;
  if(t%240===0) spawnEnemy();
  if(t%600===0) trySpawnUnit();
  units=units.filter(u=>u.hp>0);
  enemies=enemies.filter(e=>e.hp>0);
  units.forEach(u=>u.update());
  enemies.forEach(e=>e.update());
  score=kills;scoreDom.textContent=`Minerals:${minerals} Kills:${kills}`;
  if(base.hp<=0){endGame('BASE LOST');return;}
  if(enemyBase.hp<=0){endGame('VICTORY');return;}
}

function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0A0A0A';ctx.fillRect(0,0,W,H);
  // Resources
  resources.forEach(r=>{
    ctx.fillStyle='rgba(255,184,0,0.6)';ctx.shadowColor='#FFB800';ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='9px monospace';ctx.textAlign='center';
    ctx.fillText(r.amount,r.x,r.y+3);
  });
  // Bases
  [{b:base,col:'#00E5FF'},{b:enemyBase,col:'#FF4D4D'}].forEach(({b,col})=>{
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.shadowColor=col;ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(b.x-b.r,b.y+b.r+3,b.r*2*(b.hp/b.maxHp),4);
  });
  units.forEach(u=>u.draw());enemies.forEach(e=>e.draw());
  // Select box
  if(selectBox){
    const {x1,y1,x2,y2}=selectBox;
    ctx.strokeStyle='rgba(0,229,255,0.7)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
    ctx.setLineDash([]);
  }
  ctx.textAlign='left';
}

function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}
function startGame(){initGame();running=true;raf=requestAnimationFrame(loop);}
function endGame(msg){
  running=false;cancelAnimationFrame(raf);
  document.getElementById('overlay-title').textContent=msg;
  document.getElementById('overlay-msg').innerHTML=`Kills: <span style="color:var(--accent)">${kills}</span>`;
  startBtn.textContent='RESTART';overlay.style.display='flex';
}

// Input
let dragStart=null;
canvas.addEventListener('mousedown',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  if(e.button===0){dragStart={x:mx,y:my};selectBox={x1:mx,y1:my,x2:mx,y2:my};}
});
canvas.addEventListener('mousemove',e=>{
  if(!selectBox)return;
  const r=canvas.getBoundingClientRect();
  selectBox.x2=e.clientX-r.left;selectBox.y2=e.clientY-r.top;
});
canvas.addEventListener('mouseup',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  if(e.button===0&&selectBox){
    const {x1,y1,x2,y2}=selectBox;
    const lx=Math.min(x1,x2),rx=Math.max(x1,x2),ly=Math.min(y1,y2),ry=Math.max(y1,y2);
    if(rx-lx<5&&ry-ly<5){// click
      selectedUnits.forEach(u=>u.selected=false);
      const clicked=units.find(u=>Math.sqrt((u.x-mx)**2+(u.y-my)**2)<u.r+4);
      selectedUnits=clicked?[clicked]:[];
    } else {
      selectedUnits.forEach(u=>u.selected=false);
      selectedUnits=units.filter(u=>u.x>=lx&&u.x<=rx&&u.y>=ly&&u.y<=ry);
    }
    selectedUnits.forEach(u=>u.selected=true);
    selectBox=null;
  }
  if(e.button===2&&selectedUnits.length){
    // Right click: move/harvest/attack
    const res=resources.find(r2=>Math.sqrt((r2.x-mx)**2+(r2.y-my)**2)<r2.r+8);
    const enemy=enemies.find(en=>Math.sqrt((en.x-mx)**2+(en.y-my)**2)<en.r+8);
    selectedUnits.forEach(u=>{
      if(enemy){u.state='attacking';u.target=enemy;}
      else if(res){u.state='harvesting';u.target=res;}
      else{u.state='moving';u.dest={x:mx+(Math.random()-0.5)*30,y:my+(Math.random()-0.5)*30};u.target=null;}
    });
  }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

startBtn.addEventListener('click',startGame);
window.addEventListener('resize',resize);
resize();
