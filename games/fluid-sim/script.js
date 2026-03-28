// games/fluid-sim/script.js — Fluid Flow
// Eulerian fluid dynamics: velocity field (u,v) + density field

const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d');
let W,H,N,dt=0.1,diff=0.0001,visc=0.00001;
let u,v,u0,v0,dens,dens0;

function IX(x,y){return x+(N+2)*y;}

function resize(){
  const wrap=canvas.parentElement;
  W=canvas.width=wrap.clientWidth;
  H=canvas.height=wrap.clientHeight;
  N=Math.floor(Math.min(W,H)/8);
  const size=(N+2)*(N+2);
  u=new Float32Array(size);v=new Float32Array(size);
  u0=new Float32Array(size);v0=new Float32Array(size);
  dens=new Float32Array(size);dens0=new Float32Array(size);
}

function addSource(x,s,dt){for(let i=0;i<x.length;i++)x[i]+=dt*s[i];}

function setBnd(b,x){
  for(let i=1;i<=N;i++){
    x[IX(0,i)]  =b===1?-x[IX(1,i)]  :x[IX(1,i)];
    x[IX(N+1,i)]=b===1?-x[IX(N,i)]  :x[IX(N,i)];
    x[IX(i,0)]  =b===2?-x[IX(i,1)]  :x[IX(i,1)];
    x[IX(i,N+1)]=b===2?-x[IX(i,N)]  :x[IX(i,N)];
  }
  x[IX(0,0)]    =0.5*(x[IX(1,0)]    +x[IX(0,1)]);
  x[IX(0,N+1)]  =0.5*(x[IX(1,N+1)]  +x[IX(0,N)]);
  x[IX(N+1,0)]  =0.5*(x[IX(N,0)]    +x[IX(N+1,1)]);
  x[IX(N+1,N+1)]=0.5*(x[IX(N,N+1)]  +x[IX(N+1,N)]);
}

function linSolve(b,x,x0,a,c){
  for(let k=0;k<10;k++){
    for(let i=1;i<=N;i++)for(let j=1;j<=N;j++)
      x[IX(i,j)]=(x0[IX(i,j)]+a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))/c;
    setBnd(b,x);
  }
}

function diffuse(b,x,x0,diff,dt){
  const a=dt*diff*N*N;
  linSolve(b,x,x0,a,1+4*a);
}

function advect(b,d,d0,u,v,dt){
  const dt0=dt*N;
  for(let i=1;i<=N;i++){
    for(let j=1;j<=N;j++){
      let x=i-dt0*u[IX(i,j)], y=j-dt0*v[IX(i,j)];
      x=Math.max(0.5,Math.min(N+0.5,x));
      y=Math.max(0.5,Math.min(N+0.5,y));
      const i0=Math.floor(x),i1=i0+1;
      const j0=Math.floor(y),j1=j0+1;
      const s1=x-i0,s0=1-s1,t1=y-j0,t0=1-t1;
      d[IX(i,j)]=s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
    }
  }
  setBnd(b,d);
}

function project(u,v,p,div){
  const h=1/N;
  for(let i=1;i<=N;i++)for(let j=1;j<=N;j++){
    div[IX(i,j)]=-0.5*h*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)]);
    p[IX(i,j)]=0;
  }
  setBnd(0,div);setBnd(0,p);
  linSolve(0,p,div,1,4);
  for(let i=1;i<=N;i++)for(let j=1;j<=N;j++){
    u[IX(i,j)]-=0.5*(p[IX(i+1,j)]-p[IX(i-1,j)])/h;
    v[IX(i,j)]-=0.5*(p[IX(i,j+1)]-p[IX(i,j-1)])/h;
  }
  setBnd(1,u);setBnd(2,v);
}

function velStep(){
  addSource(u,u0,dt);addSource(v,v0,dt);
  [u,u0]=[u0,u];diffuse(1,u,u0,visc,dt);
  [v,v0]=[v0,v];diffuse(2,v,v0,visc,dt);
  project(u,v,u0,v0);
  [u,u0]=[u0,u];[v,v0]=[v0,v];
  advect(1,u,u0,u0,v0,dt);advect(2,v,v0,u0,v0,dt);
  project(u,v,u0,v0);
}

function denStep(){
  addSource(dens,dens0,dt);
  [dens,dens0]=[dens0,dens];
  diffuse(0,dens,dens0,diff,dt);
  [dens,dens0]=[dens0,dens];
  advect(0,dens,dens0,u,v,dt);
}

let hue=0;
function draw(){
  const imgData=ctx.createImageData(W,H);
  const cw=W/(N+2),ch=H/(N+2);
  const d=imgData.data;
  for(let i=0;i<=N+1;i++){
    for(let j=0;j<=N+1;j++){
      const den=Math.min(1,dens[IX(i,j)]);
      const px=Math.floor(i*cw),py=Math.floor(j*ch);
      const pw=Math.max(1,Math.floor(cw)),ph=Math.max(1,Math.floor(ch));
      const r=Math.round(den*(hue%360/360)*255);
      const g=Math.round(den*50+den*100);
      const b=Math.round(den*200);
      for(let dy=0;dy<ph;dy++)for(let dx=0;dx<pw;dx++){
        const idx=4*((py+dy)*W+(px+dx));
        d[idx]=r+Math.round(den*100);
        d[idx+1]=g;
        d[idx+2]=b;
        d[idx+3]=Math.round(den*255);
      }
    }
  }
  ctx.fillStyle='rgba(10,10,10,0.15)';
  ctx.fillRect(0,0,W,H);
  ctx.putImageData(imgData,0,0);
}

let painting=false,lx=-1,ly=-1;
function addFluid(cx,cy){
  const i=Math.floor(cx/W*(N+2));
  const j=Math.floor(cy/H*(N+2));
  dens0[IX(i,j)]+=20;
  if(lx>=0){
    u0[IX(i,j)]+=(cx-lx)*5;
    v0[IX(i,j)]+=(cy-ly)*5;
  }
  lx=cx;ly=cy;
  hue+=2;
}

function zero(arr){arr.fill(0);}

function loop(){
  zero(u0);zero(v0);zero(dens0);
  velStep();denStep();
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown',e=>{painting=true;lx=-1;ly=-1;});
canvas.addEventListener('mousemove',e=>{
  if(!painting)return;
  const r=canvas.getBoundingClientRect();
  addFluid(e.clientX-r.left,e.clientY-r.top);
});
canvas.addEventListener('mouseup',()=>{painting=false;lx=-1;ly=-1;});
canvas.addEventListener('touchstart',e=>{e.preventDefault();painting=true;lx=-1;ly=-1;},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();if(!painting)return;
  const r=canvas.getBoundingClientRect();
  addFluid(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);
},{passive:false});
canvas.addEventListener('touchend',()=>{painting=false;lx=-1;ly=-1;});

window.addEventListener('resize',resize);
resize();
requestAnimationFrame(loop);
