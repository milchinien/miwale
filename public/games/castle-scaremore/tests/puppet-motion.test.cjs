const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../puppet-motion.js'),'utf8'),context);
const M=context.module.exports;
test('walk and run alternate persistent legs by exactly half a cycle',()=>{
  for(const state of ['walk','flee'])for(let i=0;i<96;i++){
    const a=M.pose(state,i/96),b=M.pose(state,i/96+.5);
    for(const axis of ['x','y'])assert.ok(Math.abs(a.legs[0].ankle[axis]-b.legs[1].ankle[axis])<1e-8);
    const l=a.legs[0];
    assert.ok(Math.abs(Math.hypot(l.knee.x-l.hip.x,l.knee.y-l.hip.y)-21)<1e-8);
    assert.ok(Math.abs(Math.hypot(l.ankle.x-l.knee.x,l.ankle.y-l.knee.y)-20)<.15);
  }
});
test('stance feet stay on the ground, swing feet clear it, wrap is continuous',()=>{
  for(const run of [false,true]){
    for(let i=0;i<100;i++){
      const f=M.foot(i/100,run);assert.ok(f.contact?f.y===-5:f.y<=-5);
    }
    const a=M.foot(1-1e-8,run),b=M.foot(0,run);
    assert.ok(Math.abs(a.x-b.x)<.001&&Math.abs(a.y-b.y)<.001);
    const boundary=run?.4:.62,c=M.foot(boundary-1e-8,run),d=M.foot(boundary+1e-8,run);
    assert.ok(Math.abs(c.angle-d.angle)<.001);
  }
});
test('all 128 frames are reachable; scares override actions; reduced motion freezes',()=>{
  assert.equal(Object.values(M.counts).reduce((a,b)=>a+b),128);
  for(const state of ['idle','walk','flee','action']){
    const seen=new Set();for(let i=0;i<10000;i++)seen.add(M.sample({state,kind:'tourist',phase:i*.01,st:i*.001},i*.01).frame);
    assert.equal(seen.size,M.counts[state]);
  }
  const v={kind:'hunter',state:'scared',st:.15,artActionUntil:10,phase:2};
  assert.equal(M.sample(v,5).state,'scared');assert.equal(M.sample({...v,state:'flee'},5).state,'flee');
  assert.equal(M.sample({...v,state:'walk'},5).state,'action');
  assert.equal(M.sample({...v,state:'walk',phase:99},5,true).frame,M.sample({...v,state:'walk',phase:0},5,true).frame);
});
test('isolated cutouts discard a neighboring foot and keep transparent padding',()=>{
  const w=16,h=20,data=new Uint8ClampedArray(w*h*4);
  for(let y=6;y<18;y++)for(let x=4;x<11;x++){const p=(y*w+x)*4;data[p]=120;data[p+3]=255;}
  for(let y=0;y<2;y++)for(let x=7;x<15;x++){const p=(y*w+x)*4;data[p]=255;data[p+3]=255;}
  const out=M.isolate(data,w,h);assert.equal(out.width,11);assert.equal(out.height,16);
  for(let i=0;i<out.data.length;i+=4)if(out.data[i+3])assert.equal(out.data[i],120);
  for(let x=0;x<out.width;x++)assert.equal(out.data[x*4+3],0);
});
test('transition starts at the previous pose and ends at the target pose',()=>{
  const a=M.pose('scared',.7),b=M.pose('flee',.3);
  assert.deepEqual(M.blend(a,b,0),a);assert.deepEqual(M.blend(a,b,1),b);
});
test('joint interpolation crosses the walk-loop boundary without a foot jump',()=>{
  const a=M.smoothPose(M.sample({state:'walk',phase:Math.PI*2-1e-5},0),'tourist',0);
  const b=M.smoothPose(M.sample({state:'walk',phase:1e-5},0),'tourist',0);
  for(let i=0;i<2;i++)assert.ok(Math.hypot(a.legs[i].ankle.x-b.legs[i].ankle.x,a.legs[i].ankle.y-b.legs[i].ankle.y)<.01);
});
