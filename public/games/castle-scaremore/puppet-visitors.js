/* Generated cutout art, joint-controlled poses, bounded sprite-frame cache. */
(() => {
  'use strict';
  const M=window.ScaremoreMotion,root=new URL('assets/puppets-v2/',document.currentScript.src);
  const entries=new Map(),frames=new Map(),motion=new WeakMap(),counters={},kinds=['tourist','kid','photographer','jogger','skeptic','police','hunter','royal'];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function load(kind){
    if(entries.has(kind))return entries.get(kind);
    const e={name:`visitor-${kind}`,ready:false,failed:false,image:new Image()};entries.set(kind,e);
    e.promise=new Promise(resolve=>{
      e.image.onload=()=>{try{
        const source=document.createElement('canvas');source.width=e.image.naturalWidth;source.height=e.image.naturalHeight;
        const c=source.getContext('2d',{willReadFrequently:true});c.drawImage(e.image,0,0);e.parts=[];
        for(let i=0;i<18;i++){
          const x=Math.round(i%6*source.width/6),y=Math.round(Math.floor(i/6)*source.height/3);
          const w=Math.round((i%6+1)*source.width/6)-x,h=Math.round((Math.floor(i/6)+1)*source.height/3)-y;
          const cut=M.isolate(c.getImageData(x,y,w,h).data,w,h),part=document.createElement('canvas');part.width=cut.width;part.height=cut.height;
          part.getContext('2d').putImageData(new ImageData(cut.data,cut.width,cut.height),0,0);e.parts.push(part);
        }
        e.darkParts=e.parts.map(part=>{
          const dark=document.createElement('canvas');dark.width=part.width;dark.height=part.height;
          const dc=dark.getContext('2d');dc.filter='brightness(.76)';dc.drawImage(part,0,0);return dark;
        });
        source.width=source.height=1;e.image=null;e.ready=true;
        window.dispatchEvent(new CustomEvent('scaremore:sprite-ready',{detail:e.name}));
      }catch(error){e.failed=true;console.warn('Puppet asset:',kind,error);}resolve(e);};
      e.image.onerror=()=>{e.failed=true;resolve(e);};e.image.src=new URL(`${kind}-parts.png`,root).href;
    });return e;
  }
  function segment(c,img,a,b,width){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);
    c.drawImage(img,-width/2,-2,width,len+4);c.restore();
  }
  function paint(c,e,kind,variant,state,u,override){
    const p=override||M.pose(state,u,kind,variant),col=variant*3,part=(n,far=false)=>(far?e.darkParts:e.parts)[n+col];
    const drawLeg=(leg,far)=>{
      segment(c,part(8,far),leg.hip,leg.knee,kind==='royal'?8:7);
      segment(c,part(12,far),leg.knee,leg.ankle,5.8);
      c.save();c.translate(leg.ankle.x,leg.ankle.y);c.rotate(leg.angle);c.drawImage(part(13,far),-4,-2,14,7);c.restore();
    };
    const drawArm=(arm,far)=>{
      c.save();
      segment(c,part(6,far),arm.shoulder,arm.elbow,7);segment(c,part(7,far),arm.elbow,arm.hand,5.8);
      if(!far&&state==='action'){
        const a=part(14),h=16,w=h*a.width/a.height;c.drawImage(a,arm.hand.x-w*.38,arm.hand.y-7,w,h);
      }c.restore();
    };
    drawArm(p.arms[0],true);drawLeg(p.legs[0],true);drawLeg(p.legs[1],false);
    c.save();c.translate(p.hip.x,p.hip.y);c.rotate(p.lean);
    const torso=part(2),tw=variant===1&&['tourist','skeptic','police'].includes(kind)?25:22;
    c.drawImage(torso,-tw*.53,-30,tw,33);
    c.save();c.translate(0,-27);c.rotate(p.headTilt);
    const head=part(p.afraid?1:0),hh=kind==='kid'?33:31,hw=hh*head.width/head.height;
    // Atlas necks sit towards the rear of side-profile heads.
    const neck=kind==='royal'? .40 : variant===0&&kind==='tourist'?.56:.43;
    c.drawImage(head,-hw*neck,-hh+3,hw,hh);c.restore();c.restore();
    drawArm(p.arms[1],false);
  }
  function sprite(e,kind,variant,s){
    const key=`${kind}:${variant}:${s.frame}`;
    if(frames.has(key)){const f=frames.get(key);frames.delete(key);frames.set(key,f);return f;}
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=240;
    const c=canvas.getContext('2d');c.translate(96,216);c.scale(1.8,1.8);paint(c,e,kind,variant,s.state,s.u);
    frames.set(key,canvas);
    if(frames.size>192){const old=frames.keys().next().value;frames.delete(old);}
    return canvas;
  }
  function drawVisitor(c,v,time,L,rarity=0){
    const e=load(v.kind);if(!e.ready)return false;
    if(v.artVariant===undefined){v.artVariant=(counters[v.kind]||0)%2;counters[v.kind]=(counters[v.kind]||0)+1;}
    const variant=v.artVariant%2,s=M.sample(v,time,reduced.matches);
    let p=M.smoothPose(s,v.kind,variant),track=motion.get(v);
    if(!track){track={state:s.state,pose:p,start:time};motion.set(v,track);}
    if(track.state!==s.state){track.from=track.pose;track.start=time;track.state=s.state;}
    const progress=Math.min(1,Math.max(0,(time-track.start)/.12));
    const blending=track.from&&progress<1&&!reduced.matches;
    if(blending)p=M.blend(track.from,p,progress*progress*(3-2*progress));
    track.pose=p;
    const h=L.charH*(v.kind==='kid'?.89:1.22),scale=h/100;
    const face=v.state==='flee'?(v.dir||1):v.state==='patrol'&&v.st>.8?-1:1;
    c.save();c.fillStyle='#10101b55';c.beginPath();c.ellipse(v.x,L.walkY+1,h*.16,h*.03,0,0,Math.PI*2);c.fill();
    c.translate(v.x,L.walkY);c.scale(face*scale,scale);c.imageSmoothingEnabled=true;
    // Interpolate joints, never crossfade images (which creates double feet).
    if(blending||s.fraction>.001)paint(c,e,v.kind,variant,s.state,s.u,p);
    else c.drawImage(sprite(e,v.kind,variant,s),-96/1.8,-216/1.8,192/1.8,240/1.8);c.restore();
    if(rarity&&s.state!=='scared'&&s.state!=='flee'){
      const y=L.walkY-h-7;c.save();c.fillStyle=['','#a8c8e7','#baa9db','#dfc58e'][rarity];c.beginPath();c.moveTo(v.x,y-4);c.lineTo(v.x+3,y);c.lineTo(v.x,y+4);c.lineTo(v.x-3,y);c.closePath();c.fill();c.restore();
    }
    return true;
  }
  window.ScaremorePuppets={drawVisitor,clips:M.clips,frameAt:(v,time)=>M.sample(v,time,reduced.matches).frame,
    preload:()=>Promise.all(kinds.map(kind=>load(kind).promise)),
    status:()=>[...entries.values()].map(e=>({name:e.name,ready:e.ready,failed:e.failed,variants:2,frames:128})),
    warm:()=>['tourist','kid','photographer'].forEach(load)};
})();
