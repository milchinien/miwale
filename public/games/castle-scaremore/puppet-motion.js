/* Deterministic animation + atlas isolation, also exercised by Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ScaremoreMotion=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  'use strict';
  const TAU=Math.PI*2,mod=(n,m)=>((n%m)+m)%m,clamp=x=>Math.max(0,Math.min(1,x));
  const counts={idle:16,walk:32,flee:48,scared:16,action:16};
  const clips={};let offset=0;
  for(const [name,count] of Object.entries(counts)){clips[name]=Array.from({length:count},(_,i)=>offset+i);offset+=count;}
  function sample(v,time,reduced=false){
    let state='idle',u=time*.35;
    if(v.state==='scared'||v.state==='startled'){state='scared';u=Math.min(.999,Math.max(0,v.st||0)/.38);}
    else if(v.state==='flee'||v.state==='walk'&&v.kind==='jogger'){state='flee';u=(v.phase||0)/TAU*(v.kind==='kid'?.9:.65);}
    else if(v.state==='photo'||v.state==='action'||v.state==='patrol'||(v.artActionUntil||0)>time){state='action';u=(v.st||time)/1.3;}
    else if(v.state==='walk'){state='walk';u=(v.phase||0)/TAU;}
    if(reduced)u=state==='scared'?.5:state==='action'?.4:0;
    const index=Math.min(counts[state]-1,Math.floor(mod(u,1)*counts[state]));
    return {state,index,u:index/counts[state],fraction:mod(u,1)*counts[state]-index,frame:clips[state][index]};
  }
  // Two persistent legs, offset by half a cycle. During stance the foot moves
  // linearly backwards relative to the body, cancelling its world translation.
  function foot(u,run=false,kid=false){
    u=mod(u,1);const stance=run?.40:.62,stride=35;
    if(u<stance)return {x:stride*(.5-u/stance),y:-5,angle:Math.max(0,(u/stance-.78)/.22)*.35,contact:true};
    const s=(u-stance)/(1-stance),smooth=s*s*(3-2*s);
    return {x:stride*(smooth-.5),y:-5-Math.sin(Math.PI*s)*(run?23:10),angle:.35*(1-s)-Math.sin(Math.PI*s)*.6,contact:false};
  }
  function ik(a,b,l1,l2){
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.min(Math.hypot(dx,dy),l1+l2-.001));
    const angle=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
    return {x:a.x+Math.cos(angle)*l1,y:a.y+Math.sin(angle)*l1};
  }
  function pose(state,u,kind='tourist',variant=0){
    const run=state==='flee',moving=run||state==='walk',hit=state==='scared',phase=u*TAU;
    const jump=hit?Math.sin(clamp(u)*Math.PI)*9:0;
    const bob=moving?(run?2.2:1.1)*Math.cos(phase*2):Math.sin(phase)*.4;
    const hip={x:0,y:(moving?-42:-45)+bob-jump};
    const lean=run?.18:hit?-.20*Math.sin(Math.PI*u):state==='action'?-.045:0;
    const shoulder={x:Math.sin(lean)*27,y:hip.y-Math.cos(lean)*27};
    const legs=[0,1].map(side=>{
      const t=u+side*.5,f=moving?foot(t,run,kind==='kid'):{x:side?4:-4,y:-5-jump,angle:0,contact:!hit};
      const ankle={x:f.x,y:f.y};return {hip,knee:ik(hip,ankle,21,20),ankle,angle:f.angle,contact:f.contact};
    });
    const arms=[0,1].map(side=>{
      let angle=moving?-Math.cos(phase+side*Math.PI)*(run?1.0:.5):side?.08:-.08;
      let bend=run?1.4:.18;
      if(hit){angle=(side?-1.9:1.3)*Math.sin(Math.PI*Math.min(.85,u+.15));bend=side?1.3:-1;}
      if(state==='action'){
        const lift=Math.sin(Math.PI*clamp(u/.3))*.06;
        angle=side?.8+lift:.05;bend=side?1.6:.3;
        if(kind==='photographer'){angle=side?1.1:.6;bend=1.9;}
        if(kind==='police'){angle=side?1.7:.1;bend=side?1.6:.2;}
        if(kind==='royal'){angle=side?.7:.4;bend=side?1.5:.8;}
      }
      const elbow={x:shoulder.x+Math.sin(angle)*14,y:shoulder.y+Math.cos(angle)*14};
      const hand={x:elbow.x+Math.sin(angle+bend)*16,y:elbow.y+Math.cos(angle+bend)*16};
      return {shoulder,elbow,hand};
    });
    return {hip,shoulder,legs,arms,lean,afraid:hit||run,headTilt:hit?-.12:run?.04:Math.sin(phase)*.012};
  }
  // Keep only the largest connected opaque island in a source cell. The
  // isolated bitmap can never sample feet/noise from an adjacent atlas cell.
  function isolate(data,w,h){
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=[];
    for(let start=0;start<w*h;start++){
      if(seen[start]||data[start*4+3]<48)continue;
      let head=0,tail=1;queue[0]=start;seen[start]=1;
      while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
          const n=ny*w+nx;if(!seen[n]&&data[n*4+3]>=48){seen[n]=1;queue[tail++]=n;}
        }
      }
      if(tail>best.length)best=Array.from(queue.subarray(0,tail));
    }
    if(!best.length)throw new Error('Empty puppet part');
    const mask=new Uint8Array(w*h);let left=w,right=0,top=h,bottom=0;
    for(const p of best){mask[p]=1;const x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const width=right-left+5,height=bottom-top+5,out=new Uint8ClampedArray(width*height*4);
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      if(!mask[y*w+x])continue;const src=(y*w+x)*4,dst=((y-top+2)*width+x-left+2)*4;
      out.set(data.subarray(src,src+4),dst);
    }
    return {data:out,width,height};
  }
  function blend(a,b,t){
    if(t<=0)return a;if(t>=1)return b;
    if(typeof b==='number')return a+(b-a)*t;
    if(typeof b==='boolean')return t<.5?a:b;
    if(Array.isArray(b))return b.map((v,i)=>blend(a[i],v,t));
    return Object.fromEntries(Object.keys(b).map(k=>[k,blend(a[k],b[k],t)]));
  }
  function smoothPose(s,kind,variant){
    const next=s.state==='scared'?Math.min(counts[s.state]-1,s.index+1):(s.index+1)%counts[s.state];
    return blend(pose(s.state,s.u,kind,variant),pose(s.state,next/counts[s.state],kind,variant),s.fraction);
  }
  return {counts,clips,sample,foot,ik,pose,isolate,blend,smoothPose};
});
