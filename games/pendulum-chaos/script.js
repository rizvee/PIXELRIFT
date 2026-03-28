// games/pendulum-chaos/script.js — Double Pendulum
// RK4 (Runge-Kutta 4th order) integration for chaotic motion

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
let W,H,CX,CY;

const G=9.81;
const L1=180,L2=140;
const M1=3,M2=2;
let state; // [θ1, ω1, θ2, ω2]
let trail=[];
let t=0;

const DT=0.04;
const TRAIL_MAX=2000;

// Double pendulum equations of motion
function derivatives(s){
  const [th1,w1,th2,w2]=s;
  const dth=th2-th1;
  const sdth=Math.sin(dth),cdth=Math.cos(dth);
  const m=M1+M2;

  const denom1=m*L1-M2*L1*cdth*cdth;
  const doth1=(M2*L1*w1*w1*sdth*cdth+M2*G*Math.sin(th2)*cdth+M2*L2*w2*w2*sdth-m*G*Math.sin(th1))/denom1;

  const denom2=(denom1/L2)*(L1/L2);
  const doth2=(-M2*L2*w2*w2*sdth*cdth+m*G*Math.sin(th1)*cdth-m*L1*w1*w1*sdth-m*G*Math.sin(th2))/denom2;

  return [w1,doth1,w2,doth2];
}

function rk4(s,dt){
  const k1=derivatives(s);
  const s2=s.map((v,i)=>v+k1[i]*dt/2);
  const k2=derivatives(s2);
  const s3=s.map((v,i)=>v+k2[i]*dt/2);
  const k3=derivatives(s3);
  const s4=s.map((v,i)=>v+k3[i]*dt);
  const k4=derivatives(s4);
  return s.map((v,i)=>v+(k1[i]+2*k2[i]+2*k3[i]+k4[i])*dt/6);
}

function init(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  CX=W/2; CY=H*0.25;
  // Different initial conditions on click
  state=[Math.PI/2.0,0,Math.PI/1.1,0];
  trail=[];t=0;
}

function update(){
  for(let i=0;i<3;i++) state=rk4(state,DT); // sub-step for stability
  t++;
  const [th1,,th2,]=state;
  const x1=CX+L1*Math.sin(th1);
  const y1=CY+L1*Math.cos(th1);
  const x2=x1+L2*Math.sin(th2);
  const y2=y1+L2*Math.cos(th2);
  trail.push({x:x2,y:y2,t});
  if(trail.length>TRAIL_MAX) trail.shift();
}

function draw(){
  ctx.fillStyle='rgba(10,10,10,0.06)';
  ctx.fillRect(0,0,W,H);

  const [th1,,th2,]=state;
  const x1=CX+L1*Math.sin(th1);
  const y1=CY+L1*Math.cos(th1);
  const x2=x1+L2*Math.sin(th2);
  const y2=y1+L2*Math.cos(th2);

  // Trail
  if(trail.length>1){
    for(let i=1;i<trail.length;i++){
      const a=(i/trail.length);
      const hue=(t*0.5+i*0.1)%360;
      ctx.strokeStyle=`hsla(${hue},80%,60%,${a*0.7})`;
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(trail[i-1].x,trail[i-1].y);
      ctx.lineTo(trail[i].x,trail[i].y);
      ctx.stroke();
    }
  }

  // Rods
  ctx.strokeStyle='rgba(255,255,255,0.7)';
  ctx.lineWidth=2;
  ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(CX,CY);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();

  // Pivot
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.beginPath();ctx.arc(CX,CY,6,0,Math.PI*2);ctx.fill();

  // Bob 1
  ctx.shadowColor='#00E5FF';ctx.shadowBlur=16;
  ctx.fillStyle='#00E5FF';
  ctx.beginPath();ctx.arc(x1,y1,10,0,Math.PI*2);ctx.fill();
  // Bob 2
  ctx.shadowColor='#FF4D4D';ctx.shadowBlur=20;
  ctx.fillStyle='#FF4D4D';
  ctx.beginPath();ctx.arc(x2,y2,8,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Info
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.font='10px JetBrains Mono,monospace';
  ctx.fillText('Click to randomize',10,20);
  ctx.fillText('RK4 integration · double pendulum chaos',10,H-12);
}

canvas.addEventListener('click',()=>{
  state=[Math.random()*Math.PI*2,0,Math.random()*Math.PI*2,0];
  trail=[];
});

window.addEventListener('resize',init);
init();
requestAnimationFrame(function loop(){update();draw();requestAnimationFrame(loop);});
