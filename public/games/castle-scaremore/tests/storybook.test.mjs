import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function runtime(reduced = false) {
  const context = {
    URL, Map, Image: class {}, HTMLElement: class {},
    matchMedia: () => ({ matches: reduced }),
    document: { currentScript: { src: 'http://localhost/ghost-castle/storybook.js' } },
    customElements: { define() {} }, window: {}, console,
  };
  vm.runInNewContext(readFileSync(new URL('../storybook.js', import.meta.url), 'utf8'), context);
  return context.window.ScaremoreArt;
}

test('all eight existing visitor types have walk, reaction, run and action clips', () => {
  const art=runtime();
  assert.deepEqual(Array.from(art.kinds), ['tourist','kid','photographer','jogger','skeptic','police','hunter','royal']);
  for (const kind of art.kinds) {
    const v={kind,state:'walk',phase:0,st:0};
    for(let phase=0;phase<100;phase+=.07){
      v.phase=phase;
      assert.ok((kind==='jogger'?art.clips.flee:art.clips.walk).includes(art.frameAt(v,2)));
      assert.ok(art.clips.flee.includes(art.frameAt({...v,state:'flee'},2)));
    }
    assert.equal(art.frameAt({...v,state:'action'},2),15);
    assert.equal(art.frameAt({...v,state:'scared',st:.01},2),8);
    assert.equal(art.frameAt({...v,state:'scared',st:.15},2),9);
    assert.equal(art.frameAt({...v,state:'scared',st:.32},2),10);
  }
});

test('successful scares and fleeing override an unfinished refusal or detector action', () => {
  const art=runtime(),v={kind:'hunter',state:'scared',st:.15,phase:0,artActionUntil:9};
  assert.equal(art.frameAt(v,5),9);
  assert.equal(art.frameAt({...v,state:'flee'},5),11);
  assert.equal(art.frameAt({...v,state:'walk'},5),15);
  assert.equal(art.frameAt({...v,state:'walk'},10),2);
});

test('photo and patrol poses are selected by actual game states',()=>{
  const art=runtime(),v={kind:'photographer',state:'photo',phase:1,st:.5};
  assert.equal(art.frameAt(v,1),15);
  assert.equal(art.frameAt({...v,kind:'police',state:'patrol',st:.05},1),1);
  assert.equal(art.frameAt({...v,kind:'police',state:'patrol',st:.6},1),15);
});

test('reduced motion freezes cycles but retains readable state changes',()=>{
  const art=runtime(true);
  for(const phase of [0,1,5,20]) {
    assert.equal(art.frameAt({kind:'tourist',state:'walk',phase},3),2);
    assert.equal(art.frameAt({kind:'tourist',state:'flee',phase},3),11);
    assert.equal(art.frameAt({kind:'tourist',state:'scared',phase,st:0},3),9);
  }
});

test('chest timeline progresses through every opening frame without looping',()=>{
  const art=runtime(),seen=new Set();let previous=0;
  for(let t=0;t<=1;t+=.005){
    const pose=art.chestPose(t);seen.add(pose.frame);
    assert.ok(pose.frame>=previous);previous=pose.frame;
    assert.ok(pose.scaleX>0&&pose.scaleY>0&&Number.isFinite(pose.rotate));
  }
  assert.deepEqual([...seen],[0,1,2,3,4,5,6,7]);
  assert.equal(art.chestPose(3).frame,7);
});
