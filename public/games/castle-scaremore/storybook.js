/* Generated, hand-inked sprite art. All animation clocks are presentation only;
   visitor speed, timing windows, rarity, loot rolls and save data stay in game.js/app.js. */
(() => {
  'use strict';
  const root = new URL('assets/storybook/', document.currentScript.src);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sheets = new Map();
  const kinds = ['tourist', 'kid', 'photographer', 'jogger', 'skeptic', 'police', 'hunter', 'royal'];
  const clips = Object.freeze({ idle: [0, 1], walk: [2, 3, 4, 5, 6, 7], scared: [8, 9, 10], flee: [11, 12, 13, 14], action: [15] });
  const median = values => values.sort((a,b) => a-b)[Math.floor(values.length/2)];

  // Find per-cell registration points once, rather than changing character scale
  // with each pose. Transparent sheet padding must not produce foot sliding.
  function measure(img, columns, rows, chest) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const {data} = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const frames = [];
    for (let i=0; i<columns*rows; i++) {
      const sx = Math.round(i%columns*canvas.width/columns), sy = Math.round(Math.floor(i/columns)*canvas.height/rows);
      const sw = Math.round((i%columns+1)*canvas.width/columns)-sx;
      const sh = Math.round((Math.floor(i/columns)+1)*canvas.height/rows)-sy;
      let left=sw, right=0, top=sh, bottom=0, count=0;
      const spans = [];
      for (let y=0; y<sh; y++) {
        let lo=sw, hi=-1;
        for (let x=0; x<sw; x++) {
          if (data[((sy+y)*canvas.width+sx+x)*4+3] < 96) continue;
          lo=Math.min(lo,x); hi=Math.max(hi,x); count++;
        }
        spans.push([lo,hi]);
        if (hi>=lo) { left=Math.min(left,lo); right=Math.max(right,hi); top=Math.min(top,y); bottom=y; }
      }
      if (!count) throw new Error(`Empty sprite cell ${i}`);
      const height=bottom-top+1;
      const centers=[]; const widths=[];
      const from=top+Math.floor(height*(chest ? .65 : .49));
      const to=top+Math.floor(height*(chest ? .89 : .64));
      for(let y=from;y<=to;y++) {
        const [lo,hi]=spans[y];
        if(hi>=lo) { centers.push((lo+hi)/2); widths.push(hi-lo+1); }
      }
      frames.push({sx,sy,sw,sh,left,right,top,bottom,height,
        anchorX: centers.length ? median(centers) : (left+right)/2,
        baseWidth: widths.length ? median(widths) : right-left+1});
    }
    // Release the large, CPU-readable analysis buffer after registering frames.
    canvas.width=canvas.height=1;
    return frames;
  }

  function sheet(name) {
    if (sheets.has(name)) return sheets.get(name);
    const entry={name, image:new Image(), ready:false, failed:false};
    sheets.set(name,entry);
    entry.promise=new Promise(resolve => {
      entry.image.onload=() => {
        try {
          entry.frames=measure(entry.image,4,name.startsWith('chest-')?2:4,name.startsWith('chest-'));
          entry.referenceHeight=entry.frames[0].height;
          entry.ready=true;
          window.dispatchEvent(new CustomEvent('scaremore:sprite-ready', {detail:name}));
        } catch(error) { entry.failed=true; console.warn('Sprite registration failed:',name,error); }
        resolve(entry);
      };
      entry.image.onerror=() => { entry.failed=true; console.warn('Sprite unavailable:',name); resolve(entry); };
      entry.image.src=new URL(`${name}.png`,root).href;
    });
    return entry;
  }

  function frameAt(v,time) {
    if (v.state==='scared' || v.state==='startled') {
      if(reduced.matches) return 9;
      return v.st<.075 ? 8 : v.st<.27 ? 9 : 10;
    }
    if(v.state==='flee' || (v.state==='walk' && v.kind==='jogger')) {
      return reduced.matches ? 11 : clips.flee[Math.floor(v.phase/(Math.PI*2)*4)%4];
    }
    if (v.state==='photo' || v.state==='action' || (v.artActionUntil || 0)>time) return 15;
    if (v.state==='patrol') return v.st<.2 ? 1 : 15;
    if(v.state==='walk') return reduced.matches ? 2 : clips.walk[Math.floor(v.phase/(Math.PI*2)*6)%6];
    return reduced.matches ? 0 : Math.floor(time*.75)%2;
  }

  function drawVisitor(c,v,time,L,rarity=0) {
    if(window.ScaremorePuppets) return window.ScaremorePuppets.drawVisitor(c,v,time,L,rarity);
    const entry=sheet(`visitor-${v.kind}`);
    if(!entry.ready) return false;
    const frame=entry.frames[frameAt(v,time)];
    const targetH=L.charH*(v.kind==='kid'?.89:1.22);
    const scale=targetH/entry.referenceHeight;
    const hit=v.state==='scared'||v.state==='startled';
    const jump=hit&&!reduced.matches ? Math.sin(Math.min(1,v.st/.38)*Math.PI)*L.charH*.14 : 0;
    const face=v.state==='flee' ? (v.dir||1) : v.state==='patrol'&&v.st>.8 ? -1 : 1;
    c.save();
    c.fillStyle='#11101a55';
    c.beginPath();c.ellipse(v.x,L.walkY+2,targetH*.16*(1-jump/100),targetH*.036,0,0,Math.PI*2);c.fill();
    c.translate(v.x,L.walkY-jump); c.scale(face*scale,scale);
    c.imageSmoothingEnabled=true;
    c.drawImage(entry.image,frame.sx,frame.sy,frame.sw,frame.sh,-frame.anchorX,-frame.bottom,frame.sw,frame.sh);
    c.restore();
    const afraid=hit||v.state==='flee';
    if(rarity&&!afraid) {
      const y=L.walkY-targetH-7;
      c.save();c.fillStyle=['','#a8c8e7','#baa9db','#dfc58e'][rarity];
      c.beginPath();c.moveTo(v.x,y-4);c.lineTo(v.x+3,y);c.lineTo(v.x,y+4);c.lineTo(v.x-3,y);c.closePath();c.fill();c.restore();
    }
    if(hit) {
      c.save();c.strokeStyle='#f3d69b';c.lineWidth=1.6;c.lineCap='round';
      const y=L.walkY-targetH-jump;
      [-1,1].forEach(dir => { c.beginPath();c.moveTo(v.x+dir*targetH*.24,y+6);c.lineTo(v.x+dir*targetH*.30,y+1);c.stroke(); });
      c.restore();
    }
    return true;
  }

  function chestPose(elapsed) {
    const times=[0,.13,.22,.28,.335,.40,.48,.57];
    let frame=0;
    times.forEach((time,i)=>{if(elapsed>=time)frame=i;});
    const anticipation=Math.sin(Math.min(1,elapsed/.22)*Math.PI);
    const settle=elapsed>.4 ? Math.sin((elapsed-.4)*26)*Math.exp(-(elapsed-.4)*12) : 0;
    return {frame, scaleX:1+anticipation*.035, scaleY:1-anticipation*.055, rotate:anticipation*Math.sin(elapsed*45)*.018+settle*.015};
  }

  function drawChest(c,entry,index,width,height,pose={scaleX:1,scaleY:1,rotate:0}) {
    if(!entry.ready) return;
    const frame=entry.frames[index];
    const scale=width*.76/frame.baseWidth;
    c.save(); c.translate(width/2,height*.94);c.rotate(pose.rotate);c.scale(pose.scaleX,pose.scaleY);
    c.fillStyle='#0003';c.beginPath();c.ellipse(0,0,width*.33,height*.034,0,0,Math.PI*2);c.fill();
    c.drawImage(entry.image,frame.sx,frame.sy,frame.sw,frame.sh,-frame.anchorX*scale,-frame.bottom*scale,frame.sw*scale,frame.sh*scale);
    c.restore();
  }

  class ChestSprite extends HTMLElement {
    connectedCallback() {
      if(this.canvas) return;
      this.canvas=document.createElement('canvas');this.canvas.setAttribute('aria-hidden','true');this.appendChild(this.canvas);
      this.frame=0; this.pose={scaleX:1,scaleY:1,rotate:0};
      this.entry=sheet(`chest-${this.dataset.kind==='royal'?'royal':'crypt'}`);
      this.entry.promise.then(()=>{if(this.isConnected)this.paint();});
      this.resize=new ResizeObserver(()=>this.paint());this.resize.observe(this);
      this.paint();
    }
    disconnectedCallback() {this.resize?.disconnect();cancelAnimationFrame(this.raf);this.finish?.();}
    paint() {
      const r=this.getBoundingClientRect();if(!r.width||!r.height)return;
      const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
      const c=this.canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);
      drawChest(c,this.entry,this.frame,r.width,r.height,this.pose);
    }
    async play() {
      if(this.playing)return this.playing;
      this.playing=(async()=>{
        await this.entry.promise;
        if(!this.isConnected)return;
        if(reduced.matches){this.frame=7;this.paint();return;}
        await new Promise(resolve=>{
          this.finish=resolve;const start=performance.now();
          const animate=now=>{
            const elapsed=(now-start)/1000;
            this.pose=chestPose(elapsed);this.frame=this.pose.frame;this.paint();
            if(elapsed<.68&&this.isConnected)this.raf=requestAnimationFrame(animate);
            else{this.pose={scaleX:1,scaleY:1,rotate:0};this.frame=7;this.paint();this.finish=null;resolve();}
          };
          this.raf=requestAnimationFrame(animate);
        });
      })();
      return this.playing;
    }
    reset() {cancelAnimationFrame(this.raf);this.finish?.();this.finish=null;this.playing=null;this.frame=0;this.pose={scaleX:1,scaleY:1,rotate:0};this.paint();}
  }
  customElements.define('scaremore-chest',ChestSprite);
  window.ScaremoreArt={
    kinds,clips:window.ScaremorePuppets?.clips||clips,drawVisitor,frameAt:window.ScaremorePuppets?.frameAt||frameAt,chestPose,
    chestMarkup:kind=>`<scaremore-chest data-kind="${kind==='royal'?'royal':'crypt'}" role="img" aria-label="${kind==='royal'?'Royal':'Crypt'} Chest"></scaremore-chest>`,
    preload:()=>Promise.all((window.ScaremorePuppets?[window.ScaremorePuppets.preload()]:kinds.map(kind=>sheet(`visitor-${kind}`).promise)).concat(['crypt','royal'].map(kind=>sheet(`chest-${kind}`).promise))),
    status:()=>[...sheets.values()].map(e=>({name:e.name,ready:e.ready,failed:e.failed,frames:e.frames?.length||0})).concat(window.ScaremorePuppets?.status()||[]),
    get reduced(){return reduced.matches;}
  };
  // Load the first room's cast immediately; later room characters load on demand.
  if(window.ScaremorePuppets)window.ScaremorePuppets.warm();
  else ['tourist','kid','photographer'].forEach(kind=>sheet(`visitor-${kind}`));
  ['crypt','royal'].forEach(kind=>sheet(`chest-${kind}`));
})();
