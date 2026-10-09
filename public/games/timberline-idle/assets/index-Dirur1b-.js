var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function n(e){let t=e>>>0;return()=>(t=t*1664525+1013904223>>>0)/4294967296}function r(e){let t=parseInt(e.slice(1),16);return[t>>16&255,t>>8&255,t&255]}function i(e,t){let[n,i,a]=r(e),o=(e,n)=>Math.round(e+(n-e)*Math.abs(t)),s=t>=0?[o(n,255),o(i,236),o(a,200)]:[o(n,30),o(i,10),o(a,0)];return`rgb(${s[0]},${s[1]},${s[2]})`}function a(e,t){let n=document.createElement(`canvas`);n.width=e,n.height=t;let r=n.getContext(`2d`);return{c:n,ctx:r,px:(e,t,n,i=1,a=1)=>{r.fillStyle=e,r.fillRect(t,n,i,a)}}}var o=`#240c00`;function s({colors:e,heights:t=[11,9,12,10],w:r=160,seed:o=1,knots:s=.25,nails:c=!1}){let l=n(o*7919),{c:u,px:d}=a(r,t.reduce((e,t)=>e+t,0)),f=0,p=-1;for(let n of t){let t;do t=Math.floor(l()*e.length);while(t===p&&e.length>1);p=t;let a=e[t],o=i(a,.22),u=i(a,.09),m=i(a,-.13),h=i(a,-.28),g=i(a,-.62);d(a,0,f,r,n);let _=Math.floor(r*n/14);for(let e=0;e<_;e++){let e=Math.floor(l()*r),t=f+1+Math.floor(l()*(n-3)),i=2+Math.floor(l()*10),a=l()<.68?m:u;for(let n=0;n<i;n++)d(a,(e+n)%r,t)}let v=f+2+Math.floor(l()*(n-5)),y=l()*Math.PI*2;for(let e=0;e<r;e++){if(l()<.12)continue;let t=Math.round(Math.sin(y+e/r*Math.PI*4));d(h,e,Math.min(f+n-3,Math.max(f+1,v+t)))}if(l()<s&&n>=9){let e=6+Math.floor(l()*(r-12)),t=f+Math.floor(n/2)-1;for(let n=-4;n<=4;n++)d(m,(e+n+r)%r,t-2),d(m,(e+n+r)%r,t+2);for(let n=-3;n<=3;n++)d(h,(e+n+r)%r,t-1),d(h,(e+n+r)%r,t+1);for(let n=-2;n<=2;n++)d(g,(e+n+r)%r,t);d(h,e-3,t),d(h,e+3,t)}let b=16+Math.floor(l()*(r-32));for(let e=0;e<n-1;e++)d(m,b-1,f+e),d(g,b,f+e),d(u,b+1,f+e);if(c){let e=f+Math.floor(n/2)-1;for(let t of[b-4,b+3])d(`#2d2a28`,t,e,2,2),d(`#a9a39a`,t,e),d(`#14100e`,t+1,e+1)}d(o,0,f,r,1),d(h,0,f+n-2,r,1),d(g,0,f+n-1,r,1),f+=n}return u}function c({thick:e=8,len:t=64,base:r=`#8a4f24`,seed:s=3,bolts:c=!0,vertical:l=!1}){let u=n(s*104729),{c:d,px:f}=a(t,e),p=i(r,.3),m=i(r,.12),h=i(r,-.18),g=i(r,-.36),_=[];for(let t=0;t<e;t++)t===0||t===e-1?_.push(o):t===1?_.push(p):t===2?_.push(m):t===e-2?_.push(g):t===e-3?_.push(h):_.push(r);_.forEach((e,n)=>f(e,0,n,t,1));for(let n=0;n<t/3;n++){let n=2+Math.floor(u()*(e-4)),r=Math.floor(u()*t),i=3+Math.floor(u()*9),a=u()<.7?h:m;for(let e=0;e<i;e++)f(a,(r+e)%t,n)}let v=10+Math.floor(u()*(t-30)),y=Math.floor(e/2);if(f(g,v-2,y,5,1),f(o,v-1,y,3,1),f(m,v-1,y-1,3,1),c){let n=t-10,r=Math.floor(e/2)-1;f(`#1c1c20`,n-1,r-1,4,4),f(`#6f727a`,n,r,2,2),f(`#c9ccd2`,n,r),f(`#3a3c42`,n+1,r+1)}if(!l)return d;let b=a(e,t);b.ctx.translate(e,0),b.ctx.rotate(Math.PI/2),b.ctx.drawImage(d,0,0);let x=a(e,t);return x.ctx.translate(e,0),x.ctx.scale(-1,1),x.ctx.drawImage(b.c,0,0),x.c}function l(e=12){let{c:t,px:n}=a(e,e);n(`#1c1c20`,0,0,e,e),n(`#5d5f66`,1,1,e-2,e-2),n(`#8d9099`,1,1,e-2,1),n(`#8d9099`,1,1,1,e-2),n(`#3a3c42`,1,e-2,e-2,1),n(`#3a3c42`,e-2,1,1,e-2);for(let[t,r]of[[2,2],[e-4,2],[2,e-4],[e-4,e-4]])n(`#14141a`,t,r,2,2),n(`#d6d9de`,t,r);for(let[n,r]of[[0,0],[e-1,0],[0,e-1],[e-1,e-1]])t.getContext(`2d`).clearRect(n,r,1,1);return t}function u(e,t,r){let s=n(r*31),{c,px:l}=a(20,20),u=[`#5a3518`,`#4a2a12`,`#6b4220`];for(let n=0;n<20;n++)for(let r=0;r<20;r++){let a=r-9.5,c=n-9.5,d=Math.sqrt(a*a+c*c);if(d>9.9)continue;let f;if(d>9)f=o;else if(d>7.6)f=u[Math.floor(s()*u.length)];else if(d>6.8)f=`#ecd09a`;else if(d<1.1)f=`#5a3216`;else{f=Math.floor(d*.95+(s()-.5)*.4)%2?t:e;let n=(-a-c)/(d*1.4);n>.45?f=i(f,.12):n<-.5&&(f=i(f,-.1))}l(f,r,n)}return c}function d({w:e=36,h:t=28,state:r=`normal`,seed:s=21}){let c=n(s),{c:l,ctx:u,px:d}=a(e,t),f={normal:[`#dca15a`,`#d19450`],hover:[`#e8b26a`,`#dea55e`],active:[`#f0bf72`,`#e6b062`]}[r],p=Math.floor((t-3)/2);for(let n=1;n<t-1;n++)d(n<=p?f[0]:f[1],1,n,e-2,1);for(let[n,r,a]of[[f[0],1,p],[f[1],p+1,t-3]]){let t=i(n,-.14),o=i(n,.12);for(let n=0;n<e*(a-r)/10;n++){let n=2+Math.floor(c()*(e-6)),i=r+1+Math.floor(c()*Math.max(1,a-r-1)),s=2+Math.floor(c()*6);d(c()<.7?t:o,n,i,Math.min(s,e-2-n),1)}}d(i(f[0],-.55),1,p,e-2,1),d(i(f[1],.2),1,p+1,e-2,1),d(i(f[0],.32),1,1,e-2,1),d(i(f[0],.22),1,1,1,t-3),d(i(f[1],-.3),e-2,2,1,t-4),d(i(f[1],-.35),1,t-3,e-2,1),d(i(f[1],-.55),1,t-2,e-2,1);let m=r===`active`?`#f6d25a`:null;d(o,1,0,e-2,1),d(o,1,t-1,e-2,1),d(o,0,1,1,t-2),d(o,e-1,1,1,t-2),m&&(d(m,1,1,e-2,1),d(m,1,1,1,t-3),d(m,e-2,1,1,t-3),d(`#b8901f`,1,t-3,e-2,1));for(let[n,r]of[[3,3],[e-5,3],[3,t-6],[e-5,t-6]])d(`#2d2a28`,n,r,2,2),d(`#c9c4ba`,n,r),d(`#14100e`,n+1,r+1);return u.clearRect(0,0,1,1),u.clearRect(e-1,0,1,1),u.clearRect(0,t-1,1,1),u.clearRect(e-1,t-1,1,1),l}function f(e,t=12){let{c:n,px:r}=a(t,t),s=t/2-.5,c=t/2-.5,l=t/2;for(let n=0;n<t;n++)for(let a=0;a<t;a++){let t=a-s,u=n-c,d=Math.sqrt(t*t+u*u);if(d>l-.1)continue;if(d>l-1.2){r(o,a,n);continue}let f=(-t-u)/(l*1.3),p=e;f>.45?p=i(e,.35):f>.1?p=i(e,.12):f<-.45?p=i(e,-.35):f<-.1&&(p=i(e,-.15)),r(p,a,n)}return r(`#ffffff`,Math.round(s-l*.45),Math.round(c-l*.45)),n}var p=new Map;function m(e){return p.has(e)||p.set(e,`url("${f(e).toDataURL(`image/png`)}")`),p.get(e)}var h=[[`#e0b070`,`#c08442`],[`#c98e4c`,`#a0642f`],[`#eed4a2`,`#cfaa6e`],[`#c07a50`,`#985634`],[`#ad6d3d`,`#844c28`]];function g(){let e=document.documentElement.style,t=(t,n)=>{e.setProperty(t,`url("${n.toDataURL(`image/png`)}")`),e.setProperty(t+`-w`,n.width*3+`px`),e.setProperty(t+`-h`,n.height*3+`px`)};e.setProperty(`--px`,`3px`),t(`--tex-oak`,s({colors:[`#9a5a28`,`#a6642e`,`#90521f`],seed:2})),t(`--tex-pine`,s({colors:[`#cf9450`,`#c58944`,`#d79e5c`],seed:5})),t(`--tex-walnut`,s({colors:[`#55301a`,`#5f3720`,`#4c2a16`],seed:8,heights:[8,7,9,8],knots:.15})),t(`--tex-tree`,s({colors:[`#7c4620`,`#73401c`,`#854d24`],seed:4,heights:[13,11,14,12],nails:!0})),t(`--tex-tab`,s({colors:[`#d9a35f`,`#cf9853`],seed:9,heights:[7,6,7],w:80,knots:0})),t(`--tex-beam-h`,c({thick:8,len:64,seed:3})),t(`--tex-beam-v`,c({thick:8,len:64,seed:6,vertical:!0})),t(`--tex-beam-head`,c({thick:14,len:96,seed:7,base:`#7a4420`,bolts:!1})),t(`--tex-plate`,l(12));for(let e of[`normal`,`hover`,`active`])t(`--tex-btn-${e}`,d({state:e})),t(`--tex-btn-s-${e}`,d({state:e,h:23,seed:34}));h.forEach(([e,n],r)=>t(`--tex-slice-${r}`,u(e,n,r+1)))}var _=`axe oak pine sapling log planks chest coin worker hut map orders scroll settings sun moon star heart lock check close warning up right repeat sound muted save export import trash trophy saw water sprinkler fountain soil leaves acorn tent boots backpack book clock bolt gift crown tools handshake bread boat bear fish soup lantern market mouse hand flag dice search feather music mountain`.split(` `),v={note:`scroll`,person:`worker`,plots:`map`,house:`hut`,"heart-empty":`heart`,"north-east":`right`,"south-east":`right`,"south-west":`right`,"north-west":`right`,left:`right`,down:`up`},y=/\[\[icon:([a-z-]+)\]\]/g,b=e=>v[e]??e,x=e=>{let t=b(e);if(!_.includes(t))throw Error(`Unknown icon: ${e}`);return`./icons/${t}.png`},S=e=>`<img class="game-icon icon-${e}" src="${x(e)}" width="24" height="24" alt="" aria-hidden="true" draggable="false">`,C=e=>String(e).replace(y,(e,t)=>t.replaceAll(`-`,` `));function w(e){return String(e).replace(/<[^>]*>|\[\[icon:([a-z-]+)\]\]/g,(e,t)=>t?S(t):C(e))}var T=e=>String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),E=new WeakMap;function D(e,t){let n=String(t??``);E.get(e)!==n&&(E.set(e,n),n.includes(`[[icon:`)?e.innerHTML=w(T(n)):e.textContent=n)}var O=Object.fromEntries([..._,...Object.keys(v)].map(e=>[e,S(e)])),k;async function A(){k=new Image,await new Promise((e,t)=>{k.onload=e,k.onerror=()=>t(Error(`Icon atlas failed to load`)),k.src=`./icons/woodland-atlas.png`})}function j(e,t=32){let n=_.indexOf(b(e));if(n<0||!k?.complete)throw Error(`Icon atlas not ready: ${e}`);let r=document.createElement(`canvas`);r.width=r.height=t;let i=Math.round(n%8*k.width/8),a=Math.round(Math.floor(n/8)*k.height/8),o=Math.round((n%8+1)*k.width/8),s=Math.round((Math.floor(n/8)+1)*k.height/8);return r.getContext(`2d`).drawImage(k,i,a,o-i,s-a,0,0,t,t),r}var ee=()=>x(`hand`);function M(){let e=document.documentElement.style,t=(t,n,r,i,a)=>{let o=j(n,32);e.setProperty(t,`url("${o.toDataURL()}") ${r} ${i}, ${a}`)};e.setProperty(`--cur-default`,`default`),t(`--cur-pointer`,`hand`,12,4,`pointer`),t(`--cur-grab`,`hand`,12,4,`grab`),t(`--cur-grabbing`,`hand`,16,16,`grabbing`),t(`--cur-axe`,`axe`,26,18,`pointer`)}var te={oak:{id:`oak`,name:`Oak`,icon:`[[icon:oak]]`,style:`oak`,log:`wood`,sapling:`sapling`,plank:`oak_plank`,growTime:12,hp:6,logBonus:0,saplingPrice:10,unlockRep:0,variants:[0,1,2],trait:null},birch:{id:`birch`,name:`Birch`,icon:`[[icon:leaves]]`,style:`birch`,log:`birch_log`,sapling:`birch_sapling`,plank:`birch_plank`,growTime:7,hp:4,logBonus:-1,saplingPrice:8,unlockRep:1,variants:[0,1],trait:`grove`,traitText:`Grows 30% faster next to another birch`},pine:{id:`pine`,name:`Pine`,icon:`[[icon:pine]]`,style:`pine`,log:`pine_log`,sapling:`pine_sapling`,plank:`pine_plank`,growTime:20,hp:10,logBonus:2,saplingPrice:15,unlockRep:3,variants:[0,1],trait:`night`,traitText:`Grows up to 50% faster at night`}},ne=[`oak`,`birch`,`pine`],N=e=>te[e]??te.oak,re=(e,t)=>(e.repLevel??0)>=N(t).unlockRep,ie=.4;function ae(e,t=1,n=`oak`){let r=N(n).saplingPrice;return Math.max(1,Math.round(r*1.15**Math.max(0,e-1)*t))}function oe(e,t,n=0){let r=[t,...ne.filter(e=>e!==t)],i=n;for(let t of r){let n=e[N(t).sapling]??0;if(n>i)return t;i=Math.max(0,i-n)}return null}var se=e=>ne.reduce((t,n)=>t+(e[N(n).sapling]??0),0),P=(e,t)=>n=>Math.round(e*t**n),F=e=>()=>e,I=e=>`${Math.round(e*100)}%`,ce=[{id:`haul`,name:`Bigger Haul`,icon:`[[icon:log]]`,desc:`+1 log per tree`,col:0,row:1,max:1,cost:F(1),apply:e=>{e.woodPerTree+=1}},{id:`axe`,name:`Sharper Axe`,icon:`[[icon:axe]]`,desc:`+1 damage per click`,col:1,row:1,max:3,requires:[`haul`],cost:P(10,1.8),value:e=>`${1+e} dmg`,apply:(e,t)=>{e.clickPower+=t}},{id:`crit`,name:`Critical Strike`,icon:`[[icon:bolt]]`,desc:`+8% chance for triple damage`,col:2,row:0,max:3,requires:[`axe`],cost:P(40,2),value:e=>`${I(e*.08)} chance`,apply:(e,t)=>{e.critChance+=t*.08}},{id:`iron_axe`,name:`Iron Axe`,icon:`[[icon:axe]]`,desc:`+2 damage per click`,col:3,row:1,max:1,requires:[`axe`],cost:F(120),apply:e=>{e.clickPower+=2}},{id:`thorough`,name:`Thorough`,icon:`[[icon:pine]]`,desc:`+1 log per tree`,col:2,row:2,max:2,requires:[`axe`],cost:P(45,2.4),value:e=>`+${e} logs`,apply:(e,t)=>{e.woodPerTree+=t}},{id:`rhythm`,name:`Lumberjack Rhythm`,icon:`[[icon:music]]`,desc:`Fast clicks build a combo: +10% damage per hit, up to ×2`,col:4,row:0,max:1,requires:[`crit`],cost:F(300),apply:e=>{e.combo=!0}},{id:`woodpecker`,name:`Woodpecker`,icon:`[[icon:feather]]`,desc:`A woodpecker pecks a random tree for 1 damage – chops while you idle`,col:5,row:1,max:3,requires:[`iron_axe`],cost:P(90,2.5),value:e=>e?`every ${[0,4,2.5,1.5][e]}s`:`none`,apply:(e,t)=>{e.woodpecker=t}},{id:`reach`,name:`Wide Grab`,icon:`[[icon:hand]]`,desc:`One click also collects nearby logs`,col:3,row:2,max:1,requires:[`thorough`],cost:F(150),apply:e=>{e.pickupRadius=Math.max(e.pickupRadius,1.2)}},{id:`heavy_crit`,name:`Mighty Blow`,icon:`[[icon:tools]]`,desc:`Critical hits deal ×4 instead of ×3`,col:5,row:0,max:1,requires:[`rhythm`],cost:F(700),apply:e=>{e.critMult=4}},{id:`steel_axe`,name:`Steel Axe`,icon:`[[icon:axe]]`,desc:`+3 damage per click`,col:6,row:1,max:1,requires:[`woodpecker`],cost:F(900),apply:e=>{e.clickPower+=3}},{id:`golden`,name:`Golden Strike`,icon:`[[icon:star]]`,desc:`+3% chance for gold wood instead of wood (×10 value)`,col:6,row:2,max:3,requires:[`reach`],cost:P(400,2),value:e=>`${I(e*.03)} chance`,apply:(e,t)=>{e.goldenChance+=t*.03}},{id:`combo_master`,name:`Combo Master`,icon:`[[icon:bolt]]`,desc:`Combo can rise up to ×3`,col:7,row:0,max:1,requires:[`heavy_crit`],cost:F(1500),apply:e=>{e.comboMax=20}},{id:`splinters`,name:`Splinters`,icon:`[[icon:saw]]`,desc:`Your hits sometimes knock out a bonus log`,col:8,row:1,max:2,requires:[`steel_axe`],cost:P(1200,2.2),value:e=>`${I(e*.08)} per hit`,apply:(e,t)=>{e.splinterChance+=t*.08}},{id:`magnet`,name:`Magnet Chest`,icon:`[[icon:search]]`,desc:`Logs on the ground fly into the chest by themselves`,col:8,row:2,max:2,requires:[`golden`],cost:P(1e3,2.5),value:e=>e?`after ${[0,5,1.5][e]}s`:`off`,apply:(e,t)=>{e.magnet=!0,e.magnetDelay=[5,5,1.5][t]}},{id:`eagle_eye`,name:`Eagle Eye`,icon:`[[icon:search]]`,desc:`+5% crit chance`,col:9,row:0,max:3,requires:[`combo_master`],cost:P(2e3,1.8),value:e=>`+${I(e*.05)}`,apply:(e,t)=>{e.critChance+=t*.05}},{id:`titan_axe`,name:`Titan Axe`,icon:`[[icon:tools]]`,desc:`All click damage ×1.5`,col:10,row:1,max:1,requires:[`splinters`],cost:F(3500),apply:e=>{e.clickPowerMult*=1.5}},{id:`wide_reach`,name:`Long Arms`,icon:`[[icon:hand]]`,desc:`Much bigger collect radius`,col:9,row:2,max:1,requires:[`magnet`],cost:F(2500),apply:e=>{e.pickupRadius=2.2}},{id:`frenzy`,name:`Frenzy`,icon:`[[icon:bolt]]`,desc:`Every combo step also adds +1.5% crit chance`,col:11,row:0,max:1,requires:[`eagle_eye`],cost:F(6e3),apply:e=>{e.frenzy=!0}},{id:`gilded_edge`,name:`Gilded Edge`,icon:`[[icon:star]]`,desc:`+5% chance for gold wood`,col:12,row:1,max:1,requires:[`titan_axe`],cost:F(7e3),apply:e=>{e.goldenChance+=.05}},{id:`double_harvest`,name:`Double Harvest`,icon:`[[icon:oak]]`,desc:`+1 log per tree`,col:12,row:2,max:1,requires:[`wide_reach`],cost:F(4e3),apply:e=>{e.woodPerTree+=1}},{id:`lumber_baron`,name:`Lumber Baron`,icon:`[[icon:crown]]`,desc:`+2 logs per tree`,col:14,row:2,max:1,requires:[`double_harvest`],cost:F(1e4),apply:e=>{e.woodPerTree+=2}}],le=[{id:`chest`,name:`Bigger Chest`,icon:`[[icon:chest]]`,desc:`+5 chest slots`,col:0,row:1,max:4,cost:P(15,1.7),value:e=>`${20+e*5} slots`,apply:(e,t)=>{e.woodCap+=t*5}},{id:`orders`,name:`Order Board`,icon:`[[icon:orders]]`,desc:`Unlocks the Orders tab: customers pay extra & give [[icon:star]] reputation`,col:1,row:0,max:1,requires:[`chest`],cost:F(40),unlocks:`orders`,apply:()=>{}},{id:`trade`,name:`Trade Contacts`,icon:`[[icon:handshake]]`,desc:`+15% sell price`,col:3,row:0,max:3,requires:[`orders`],cost:P(35,1.9),value:e=>`+${I(e*.15)}`,apply:(e,t)=>{e.woodPrice*=1+t*.15}},{id:`construction`,name:`Workshop`,icon:`[[icon:hut]]`,desc:`Unlocks the Build tab: soils & buildings`,col:2,row:1,max:1,requires:[`chest`],cost:F(80),unlocks:`buildings`,apply:()=>{}},{id:`fertilizer`,name:`Fertilizer`,icon:`[[icon:sapling]]`,desc:`Trees grow 25% faster`,col:1,row:2,max:2,requires:[`chest`],cost:P(40,2.2),value:e=>`${I(1+e*.25)} speed`,apply:(e,t)=>{e.growthMult+=t*.25}},{id:`market`,name:`Market Stall`,icon:`[[icon:market]]`,desc:`+25% sell price`,col:4,row:0,max:1,requires:[`trade`],cost:F(200),apply:e=>{e.woodPrice*=1.25}},{id:`annex`,name:`Chest Annex`,icon:`[[icon:chest]]`,desc:`+10 chest slots`,col:3,row:1,max:1,requires:[`construction`],cost:F(150),apply:e=>{e.woodCap+=10}},{id:`plot_tree`,name:`Forest Space`,icon:`[[icon:oak]]`,desc:`Prepare a new tree bed: +1 tree on the meadow`,col:2,row:2,max:2,requires:[`fertilizer`],cost:P(400,5),value:e=>`+${e} slots`,apply:(e,t)=>{e.treeCap+=t}},{id:`autosell`,name:`Auto-Sell`,icon:`[[icon:repeat]]`,desc:`When the chest is full, items are sold automatically · choose items & amount to keep in the chest`,col:6,row:0,max:1,requires:[`market`],cost:F(450),apply:e=>{e.autoSell=!0}},{id:`iron_fittings`,name:`Iron Fittings`,icon:`[[icon:settings]]`,desc:`+10 chest slots`,col:5,row:1,max:1,requires:[`annex`],cost:F(350),apply:e=>{e.woodCap+=10}},{id:`saplings`,name:`Seed Bag`,icon:`[[icon:acorn]]`,desc:`+15% chance for a bonus sapling when a tree falls`,col:5,row:2,max:2,requires:[`plot_tree`],cost:P(250,2.4),value:e=>`${I(ie+e*.15)} chance`,apply:(e,t)=>{e.saplingBonus+=t*.15}},{id:`appraiser`,name:`Gold Appraiser`,icon:`[[icon:search]]`,desc:`Gold wood sells for more`,col:8,row:0,max:2,requires:[`autosell`],cost:P(600,2.5),value:e=>`×${[1,1.5,2][e]} value`,apply:(e,t)=>{e.goldValueMult=[1,1.5,2][t]}},{id:`treasury`,name:`Treasury`,icon:`[[icon:hut]]`,desc:`+15 chest slots`,col:7,row:1,max:1,requires:[`iron_fittings`],cost:F(900),apply:e=>{e.woodCap+=15}},{id:`clearing`,name:`Clearing`,icon:`[[icon:map]]`,desc:`+1 tree bed on the meadow`,col:7,row:2,max:1,requires:[`saplings`],cost:F(3e3),apply:e=>{e.treeCap+=1}},{id:`guild`,name:`Trade Guild`,icon:`[[icon:handshake]]`,desc:`+50% sell price`,col:9,row:0,max:1,requires:[`appraiser`],cost:F(2e3),apply:e=>{e.woodPrice*=1.5}},{id:`soil_science`,name:`Soil Science`,icon:`[[icon:soil]]`,desc:`Rich Soil is 30% cheaper and boosts growth even more`,col:9,row:1,max:1,requires:[`treasury`],cost:F(1500),apply:e=>{e.soilBonus+=.5,e.soilPriceMult*=.7}},{id:`stump_grinder`,name:`Stump Grinder`,icon:`[[icon:settings]]`,desc:`Stumps replant themselves when you have saplings`,col:8,row:2,max:1,requires:[`clearing`],cost:F(1800),apply:e=>{e.autoReplant=!0}},{id:`bulk_deals`,name:`Wholesale`,icon:`[[icon:up]]`,desc:`+10% sell price`,col:11,row:0,max:3,requires:[`guild`],cost:P(3e3,1.9),value:e=>`+${I(e*.1)}`,apply:(e,t)=>{e.woodPrice*=1+t*.1}},{id:`warehouse`,name:`Warehouse`,icon:`[[icon:hut]]`,desc:`+25 chest slots`,col:11,row:1,max:1,requires:[`soil_science`],cost:F(3500),apply:e=>{e.woodCap+=25}},{id:`head_start`,name:`Head Start`,icon:`[[icon:leaves]]`,desc:`New saplings start 30% grown`,col:10,row:2,max:1,requires:[`stump_grinder`],cost:F(2500),apply:e=>{e.headStart=.3}},{id:`royal_contract`,name:`Royal Contract`,icon:`[[icon:scroll]]`,desc:`Sell price ×2`,col:14,row:0,max:1,requires:[`bulk_deals`],cost:F(12e3),apply:e=>{e.woodPrice*=2}},{id:`nursery`,name:`Nursery`,icon:`[[icon:sapling]]`,desc:`Buying saplings is 40% cheaper`,col:13,row:1,max:1,requires:[`warehouse`],cost:F(4e3),apply:e=>{e.saplingPriceMult*=.6}},{id:`old_growth`,name:`Old Growth`,icon:`[[icon:pine]]`,desc:`+2 tree beds on the meadow`,col:12,row:2,max:1,requires:[`head_start`],cost:F(15e3),apply:e=>{e.treeCap+=2}},{id:`ancient_forest`,name:`Ancient Forest`,icon:`[[icon:oak]]`,desc:`Trees grow 50% faster`,col:14,row:2,max:1,requires:[`old_growth`],cost:F(9e3),apply:e=>{e.growthMult+=.5}}],ue=[{id:`worker`,name:`Workers`,icon:`person`,accent:`#4a90d9`,nodes:[{id:`hut`,name:`First Hut`,icon:`[[icon:hut]]`,desc:`Your first worker slot. Unlocks Board & Team`,col:0,row:1,max:1,cost:F(50),unlocks:`workers`,apply:e=>{e.workerCap+=1}},{id:`boots`,name:`Work Boots`,icon:`[[icon:boots]]`,desc:`+10% walk speed for all workers`,col:1,row:0,max:3,requires:[`hut`],cost:P(80,2),value:e=>`+${I(e*.1)}`,apply:(e,t)=>{e.workerSpeedMult*=1+t*.1}},{id:`bunk`,name:`Bunk Bed`,icon:`[[icon:moon]]`,desc:`+1 worker slot`,col:2,row:1,max:1,requires:[`hut`],cost:F(300),apply:e=>{e.workerCap+=1}},{id:`notice`,name:`Bigger Board`,icon:`[[icon:flag]]`,desc:`+1 note on the board`,col:1,row:2,max:2,requires:[`hut`],cost:P(60,3),value:e=>`${3+e} notes`,apply:(e,t)=>{e.boardSize+=t}},{id:`whetstone`,name:`Whetstone`,icon:`[[icon:tools]]`,desc:`+10% swing speed for all workers`,col:3,row:0,max:3,requires:[`boots`],cost:P(150,2),value:e=>`+${I(e*.1)}`,apply:(e,t)=>{e.workerSwingMult*=1+t*.1}},{id:`camp`,name:`Lumber Camp`,icon:`[[icon:tent]]`,desc:`+1 worker slot`,col:4,row:1,max:1,requires:[`bunk`],cost:F(1e3),apply:e=>{e.workerCap+=1}},{id:`recruiter`,name:`Recruiter`,icon:`[[icon:search]]`,desc:`Rare, epic and legendary workers show up more often`,col:2,row:2,max:2,requires:[`notice`],cost:P(250,2.5),value:e=>e?`+${e} luck`:`normal`,apply:(e,t)=>{e.rarityBoost+=t}},{id:`lunch`,name:`Hearty Lunch`,icon:`[[icon:soup]]`,desc:`+15% damage for all workers`,col:4,row:0,max:3,requires:[`whetstone`],cost:P(300,2),value:e=>`+${I(e*.15)}`,apply:(e,t)=>{e.workerDamageMult*=1+t*.15}},{id:`backpacks`,name:`Backpacks`,icon:`[[icon:backpack]]`,desc:`Workers carry +1 log`,col:6,row:1,max:1,requires:[`camp`],cost:F(600),apply:e=>{e.workerCarryBonus+=1}},{id:`dice`,name:`Lucky Dice`,icon:`[[icon:dice]]`,desc:`Rerolling the board is 60% cheaper`,col:5,row:2,max:1,requires:[`recruiter`],cost:F(400),apply:e=>{e.rerollPriceMult*=.4}},{id:`mentor`,name:`Mentor`,icon:`[[icon:book]]`,desc:`+25% XP for all workers`,col:6,row:0,max:2,requires:[`lunch`],cost:P(500,2.5),value:e=>`+${I(e*.25)}`,apply:(e,t)=>{e.xpMult*=1+t*.25}},{id:`treehouse`,name:`Treehouse`,icon:`[[icon:hut]]`,desc:`+1 worker slot`,col:8,row:1,max:1,requires:[`backpacks`],cost:F(2500),apply:e=>{e.workerCap+=1}},{id:`union`,name:`Union Deal`,icon:`[[icon:handshake]]`,desc:`-15% wages for all workers`,col:7,row:2,max:2,requires:[`dice`],cost:P(600,2.5),value:e=>`-${I(e*.15)}`,apply:(e,t)=>{e.wageMult*=1-t*.15}},{id:`training`,name:`Training Camp`,icon:`[[icon:bolt]]`,desc:`Worker level cap +5`,col:9,row:0,max:1,requires:[`mentor`],cost:F(2e3),apply:e=>{e.levelCapBonus+=5}},{id:`lanterns`,name:`Lanterns`,icon:`[[icon:lantern]]`,desc:`No night penalties, +10% speed at night`,col:10,row:1,max:1,requires:[`treehouse`],cost:F(1500),apply:e=>{e.nightProof=!0}},{id:`headhunter`,name:`Headhunter`,icon:`[[icon:worker]]`,desc:`Hiring workers is 25% cheaper`,col:10,row:2,max:1,requires:[`union`],cost:F(1800),apply:e=>{e.hireDiscount*=.75}},{id:`masterclass`,name:`Masterclass`,icon:`[[icon:book]]`,desc:`Every level-up gives +1 extra stat point`,col:11,row:0,max:1,requires:[`training`],cost:F(6e3),apply:e=>{e.masterclass=!0}},{id:`lodge`,name:`Lumber Lodge`,icon:`[[icon:hut]]`,desc:`+2 worker slots`,col:12,row:1,max:1,requires:[`lanterns`],cost:F(8e3),apply:e=>{e.workerCap+=2}},{id:`team_spirit`,name:`Team Spirit`,icon:`[[icon:heart]]`,desc:`+3% speed and damage per hired worker`,col:13,row:2,max:1,requires:[`headhunter`],cost:F(5e3),apply:e=>{e.teamSpirit=!0}},{id:`night_shift`,name:`Night Shift`,icon:`[[icon:moon]]`,desc:`Your team keeps working longer while you are away (offline time)`,col:14,row:1,max:2,requires:[`lodge`],cost:P(2500,3),value:e=>`${[2,6,12][e]}h offline`,apply:(e,t)=>{e.offlineHours=[2,6,12][t]}}]},{id:`economy`,name:`Economy`,icon:`coin`,accent:`#e0a82a`,nodes:le},{id:`click`,name:`Clicker`,icon:`axe`,accent:`#d9503c`,nodes:ce}],de=[`walk`,`swing`,`strength`,`carry`],fe={walk:{name:`Walk`,short:`WLK`,color:`#4a90d9`},swing:{name:`Swing`,short:`SWG`,color:`#e8c33a`},strength:{name:`Strength`,short:`STR`,color:`#d9503c`},carry:{name:`Carry`,short:`CAR`,color:`#5aa83c`}},pe=[{id:`common`,name:`Common`,color:`#c9b89a`,weight:60,boost:0,stats:[1,4],priceMult:1,wageMult:1,traits:[1,2],good:.45},{id:`rare`,name:`Rare`,color:`#4a90d9`,weight:28,boost:8,stats:[3,6],priceMult:2.4,wageMult:1.6,traits:[1,2],good:.6},{id:`epic`,name:`Epic`,color:`#9a6ad9`,weight:10,boost:5,stats:[5,8],priceMult:5.5,wageMult:2.4,traits:[2,3],good:.72},{id:`legendary`,name:`Legendary`,color:`#f0a020`,weight:2,boost:2,stats:[7,10],priceMult:14,wageMult:3.5,traits:[2,3],good:.88}],me=e=>pe.find(t=>t.id===e)??pe[0],he={carry:{name:`Carry`,icon:`[[icon:log]]`},plant:{name:`Plant`,icon:`[[icon:sapling]]`},saw:{name:`Sawmill`,icon:`[[icon:saw]]`},chop:{name:`Chop`,icon:`[[icon:axe]]`}},ge=[`carry`,`plant`,`saw`,`chop`],_e={strong:{name:`Strong`,icon:`[[icon:bolt]]`,good:!0,rarity:1,desc:e=>`+${e*15}% damage`},quick:{name:`Quick`,icon:`[[icon:bolt]]`,good:!0,rarity:1,desc:e=>`+${e*10}% walk speed`},rhythmic:{name:`Rhythmic`,icon:`[[icon:music]]`,good:!0,rarity:1,desc:e=>`${e*10}% faster swings`},packhorse:{name:`Packhorse`,icon:`[[icon:backpack]]`,good:!0,rarity:2,desc:e=>`+${e===3?2:1} carry`},greenThumb:{name:`Green Thumb`,icon:`[[icon:leaves]]`,good:!0,rarity:1,desc:e=>`plants ${[0,30,50,70][e]}% faster`},frugal:{name:`Frugal`,icon:`[[icon:coin]]`,good:!0,rarity:1,desc:e=>`-${e*15}% wage`},nightOwl:{name:`Night Owl`,icon:`[[icon:moon]]`,good:!0,rarity:2,desc:e=>`+${e*25}% speed at night`},earlyBird:{name:`Early Bird`,icon:`[[icon:sun]]`,good:!0,rarity:2,desc:e=>`+${e*20}% speed in the morning`},lucky:{name:`Lucky`,icon:`[[icon:leaves]]`,good:!0,rarity:3,desc:e=>`${e*4}% chance for gold wood when felling`},fastLearner:{name:`Fast Learner`,icon:`[[icon:book]]`,good:!0,rarity:2,desc:e=>`+${e*25}% XP`},lazy:{name:`Lazy`,icon:`[[icon:moon]]`,good:!1,rarity:1,desc:e=>`-${e*10}% speed, naps sometimes`},clumsy:{name:`Clumsy`,icon:`[[icon:warning]]`,good:!1,rarity:1,desc:e=>`${e*8}% chance to drop logs`},weak:{name:`Weak`,icon:`[[icon:feather]]`,good:!1,rarity:1,desc:e=>`-${e*15}% damage`},greedy:{name:`Greedy`,icon:`[[icon:coin]]`,good:!1,rarity:1,desc:e=>`+${e*20}% wage`},afraidOfDark:{name:`Afraid of Dark`,icon:`[[icon:moon]]`,good:!1,rarity:1,desc:e=>`-${[0,30,50,70][e]}% speed at night`}},ve=(e,t)=>e.traits?.find(e=>e.id===t)?.lvl??0,ye=[``,`I`,`II`,`III`],be=e=>10+(e?.levelCapBonus??0),L={hit:1,fell:4,deliver:1,plant:5},xe=e=>Math.round(20*1.5**(e-1)),Se=.25,Ce=`Pip.Bo.Tuck.Mo.Fen.Rolo.Bean.Nib.Tiko.Lumi.Oaky.Puck.Wim.Juno.Fig.Dot.Sprout.Chip.Mossy.Bram.Twig.Pebble.Nutty.Birch.Clove.Tumble`.split(`.`),R=e=>Math.max(1,Math.round(10*e.rerollPriceMult)),we=(e,t)=>e+Math.floor(Math.random()*(t-e+1));function z(e,t){let n=e.reduce((e,n)=>e+t(n),0),r=Math.random()*n;for(let n of e)if(r-=t(n),r<0)return n;return e[0]}function B(e){let t=we(e.traits[0],e.traits[1]),n=[];for(let r=0;r<t;r++){let t=Math.random()<e.good,r=Object.entries(_e).filter(([e,r])=>r.good===t&&!n.some(t=>t.id===e));if(!r.length)continue;let[i]=z(r,([,e])=>1/e.rarity),a=pe.indexOf(e)*.25,o=z([1,2,3],e=>e===1?1:e===2?.35+a:.08+a*.6);n.push({id:i,lvl:o})}return n}function Te(e){e.level??=1,e.xp??=0,e.traits??=[],e.priorities??=[...ge];for(let t of ge){if(e.priorities.includes(t))continue;let n=e.priorities.indexOf(`chop`);e.priorities.splice(n<0?e.priorities.length:n,0,t)}return e}function Ee(e,t){let n=de.reduce((e,n)=>e+t.stats[n],0),r=me(t.rarity),i=(t.traits??[]).reduce((e,t)=>e+(_e[t.id].good?.12:-.08)*t.lvl,0),a=20*r.priceMult*(1+n/40)*(1+i)*1.35**e.workers.length;return Math.max(5,Math.round(a*e.hireDiscount))}function De(e,t){let n=de.reduce((t,n)=>t+e.stats[n],0),r=me(e.rarity),i=(1-ve(e,`frugal`)*.15)*(1+ve(e,`greedy`)*.2)*(1+((e.level??1)-1)*.06);return Math.max(1,Math.round(5*r.wageMult*(1+n/30)*i*(t?.wageMult??1)))}var Oe=e=>e.workers.reduce((t,n)=>t+De(n,e),0);function ke(e){let t=Oe(e);if(t<=0||e.money>=t)return null;let n=(6-e.hour+24)%24;return n<=4?{hours:n,wages:t}:null}function Ae(e){let t=e?.rarityBoost??0,n=z(pe,e=>e.weight+e.boost*t),r=Object.fromEntries(de.map(e=>[e,we(n.stats[0],n.stats[1])]));return Te({id:Math.random().toString(36).slice(2,9),name:Ce[Math.floor(Math.random()*Ce.length)],rarity:n.id,stats:r,traits:B(n)})}function je(){return{...Ae(),priorities:[...ge],hiredDay:1}}function Me(e){e.board={day:e.day,notes:Array.from({length:e.boardSize},()=>Ae(e))}}function Ne(e){for((!e.board||e.board.day!==e.day)&&Me(e);e.board.notes.length<e.boardSize;)e.board.notes.push(Ae(e));for(let t of e.board.notes)t&&Te(t)}function Pe(e,t){let n=e.board.notes[t];if(!n||e.workers.length>=e.workerCap)return null;let r=Ee(e,n);if(e.money<r)return null;e.money-=r;let i=Te({...n,priorities:[...ge],hiredDay:e.day});return e.workers.push(i),e.board.notes[t]=null,i}function Fe(e,t){e.workers=e.workers.filter(e=>e.id!==t)}function Ie(e,t,n){let r=be(n);if(e.level>=r)return null;e.xp+=t*(1+ve(e,`fastLearner`)*.25)*(n?.xpMult??1);let i=null;for(;e.level<r&&e.xp>=xe(e.level);){e.xp-=xe(e.level),e.level+=1,i??=[];let t=(e.level%5==0?2:1)+ +!!n?.masterclass;for(let n=0;n<t;n++){let t=de.filter(t=>e.stats[t]<10);if(!t.length)break;let n=t[Math.floor(Math.random()*t.length)];e.stats[n]+=1,i.push(n)}}return e.level>=r&&(e.xp=0),i}function Le(e){return e>=21||e<5?1:e>=19?(e-19)/2:e<7?1-(e-5)/2:0}function Re(e,t={}){let{stats:n}=e,r=t.hour??12,i=t=>ve(e,t),a=Le(r),o=+(r>=5&&r<11),s=t.nightProof?0:[0,.3,.5,.7][i(`afraidOfDark`)],c=(1+a*i(`nightOwl`)*.25)*(1-a*s)*(1+a*(t.nightProof?.1:0))*(1+o*i(`earlyBird`)*.2),l=1-i(`lazy`)*.1,u=t.teamSpirit?1+.03*(t.workers?.length??0):1;return{speed:(1.2+n.walk*.12)*(1+i(`quick`)*.1)*l*c*(t.workerSpeedMult??1)*u,swingTime:(1-n.swing*.05)*(1-i(`rhythmic`)*.1)/(l*c*(t.workerSwingMult??1)*u),damage:(1+n.strength*.25)*(1+i(`strong`)*.15)*(1-i(`weak`)*.15)*(t.workerDamageMult??1)*u,capacity:2+Math.floor(n.carry/3)+(i(`packhorse`)===3?2:+!!i(`packhorse`))+(t.workerCarryBonus??0),digTime:1.4*(1-[0,.3,.5,.7][i(`greenThumb`)]),dropChance:i(`clumsy`)*.08,napChance:i(`lazy`)*.12,luck:i(`lucky`)*.04}}var ze=new Map;function V(e,t){return ze.has(e)||ze.set(e,new Set),ze.get(e).add(t),()=>ze.get(e).delete(t)}function Be(e,t={}){for(let n of ze.get(e)??[])n(t)}var Ve=[0,5,15,30,55,90,140],He=.03,Ue={1:{icon:`[[icon:leaves]]`,text:`Birch saplings & Bamboo Splitter`},2:{icon:`[[icon:saw]]`,text:`Sawmill`},3:{icon:`[[icon:pine]]`,text:`Pine saplings & Copper Sprinkler`},4:{icon:`[[icon:orders]]`,text:`+1 order slot`},5:{icon:`[[icon:fountain]]`,text:`Brass Fountain & orders pay +25%`},6:{icon:`[[icon:crown]]`,text:`Royal customers: orders pay +25% more`}};function We(e){let t=0;return Ve.forEach((n,r)=>{e>=n&&(t=r)}),t}var Ge=e=>Ve[e+1]??null,Ke=[`n`,`e`,`s`,`w`],qe={n:{arrow:`[[icon:north-east]]`,name:`Back right`},e:{arrow:`[[icon:south-east]]`,name:`Front right`},s:{arrow:`[[icon:south-west]]`,name:`Front left`},w:{arrow:`[[icon:north-west]]`,name:`Back left`}},Je=()=>({n:0,e:0,s:0,w:0}),Ye=e=>e.land??=Je(),Xe=e=>Ke.reduce((t,n)=>t+(Ye(e)[n]??0),0);function Ze(e){let t=Ye(e);return{cols:3+t.w+t.e,rows:3+t.n+t.s}}function Qe(e){let t=Ye(e);return{minI:-t.w*3,maxI:8+t.e*3,minJ:-t.n*3,maxJ:8+t.s*3}}function $e(e,t){let{cols:n,rows:r}=Ze(e);return t===`n`||t===`s`?n:r}var et=(e,t)=>(Ye(e)[t]??0)<2;function tt(e,t){return Math.round(150*$e(e,t)*2.1**Xe(e)*(e.landPriceMult??1))}function nt(e,t){if(!Ke.includes(t)||!et(e,t))return!1;let n=tt(e,t);return e.money<n?!1:(e.money-=n,Ye(e)[t]+=1,!0)}var rt=[{id:`hugo`,name:`Carpenter Hugo`,icon:`[[icon:saw]]`,look:{shirt:`#c8783a`,hat:`#6b4423`,hatStyle:`cap`},perk:{icon:`[[icon:saw]]`,text:e=>`Sawmills work ${[15,15,30][e]}% faster`,apply:(e,t)=>{e.sawSpeedMult*=1+[0,.15,.3][t]}}},{id:`mia`,name:`Baker Mia`,icon:`[[icon:bread]]`,look:{shirt:`#f0e0b0`,hat:`#ffffff`,hatStyle:`chef`},perk:{icon:`[[icon:bread]]`,text:e=>`Fresh bread: workers walk ${[8,8,15][e]}% faster`,apply:(e,t)=>{e.workerSpeedMult*=1+[0,.08,.15][t]}}},{id:`ole`,name:`Shipwright Ole`,icon:`[[icon:boat]]`,look:{shirt:`#3a6ea8`,hat:`#1f3a5a`,hatStyle:`beanie`},perk:{icon:`[[icon:planks]]`,text:e=>`Planks sell for ${[15,15,30][e]}% more`,apply:(e,t)=>{e.plankPriceMult*=1+[0,.15,.3][t]}}},{id:`greta`,name:`Mayor Greta`,icon:`[[icon:hut]]`,look:{shirt:`#7a3a8a`,hat:`#2a2030`,hatStyle:`tophat`},perk:{icon:`[[icon:map]]`,text:e=>`Land rows cost ${[10,10,20][e]}% less`,apply:(e,t)=>{e.landPriceMult*=1-[0,.1,.2][t]}}},{id:`lou`,name:`Toymaker Lou`,icon:`[[icon:bear]]`,look:{shirt:`#e8805f`,hat:`#f0c84a`,hatStyle:`beanie`},perk:{icon:`[[icon:star]]`,text:e=>`+${[2,2,4][e]}% chance for gold wood`,apply:(e,t)=>{e.goldenChance+=[0,.02,.04][t]}}},{id:`bob`,name:`Builder Bob`,icon:`[[icon:hut]]`,look:{shirt:`#e0a82a`,hat:`#f0c84a`,hatStyle:`cap`},perk:{icon:`[[icon:hut]]`,text:e=>`Buildings & soils ${[15,15,30][e]}% cheaper`,apply:(e,t)=>{let n=1-[0,.15,.3][t];e.buildPriceMult*=n,e.soilPriceMult*=n}}},{id:`finn`,name:`Fisher Finn`,icon:`[[icon:fish]]`,look:{shirt:`#5aa8a0`,hat:`#e8d8a0`,hatStyle:`straw`},perk:{icon:`[[icon:fish]]`,text:e=>`Pays your workers in fish: wages −${[8,8,15][e]}%`,apply:(e,t)=>{e.wageMult*=1-[0,.08,.15][t]}}},{id:`ida`,name:`Blacksmith Ida`,icon:`[[icon:tools]]`,look:{shirt:`#5a5a62`,hat:`#d9503c`,hatStyle:`bandana`},perk:{icon:`[[icon:axe]]`,text:e=>`Sharper axes: +${[1,1,2][e]} click damage, workers +${[15,15,30][e]}% damage`,apply:(e,t)=>{e.clickPower+=t,e.workerDamageMult*=1+[0,.15,.3][t]}}},{id:`rosa`,name:`Innkeeper Rosa`,icon:`[[icon:soup]]`,look:{shirt:`#a83a3a`,hat:`#5a2a1a`,hatStyle:`bandana`},perk:{icon:`[[icon:soup]]`,text:e=>`Hearty meals: workers gain ${[25,25,50][e]}% more XP`,apply:(e,t)=>{e.xpMult*=1+[0,.25,.5][t]}}}],it=e=>rt.find(t=>t.id===e)??rt[0],at=e=>rt.find(t=>t.name===e)??null,ot=[0,1,3,6,10,15],st=ot.length-1,ct=[3,5];function lt(e,t){return e.customers??={},e.customers[t]??={pts:0,orders:0}}function ut(e){let t=0;return ot.forEach((n,r)=>{e>=n&&(t=r)}),t}var dt=(e,t)=>ut(e.customers?.[t]?.pts??0),ft=e=>e>=ct[1]?2:+(e>=ct[0]);function pt(e){for(let t of rt){let n=ft(dt(e,t.id));n>0&&t.perk.apply(e,n)}}var mt=[1,2,4],ht={wood:{name:`Oak Log`,type:`log`,species:`oak`,baseValue:1},birch_log:{name:`Birch Log`,type:`log`,species:`birch`,baseValue:1},pine_log:{name:`Pine Log`,type:`log`,species:`pine`,baseValue:1.5},oak_plank:{name:`Oak Plank`,type:`plank`,species:`oak`,baseValue:3},birch_plank:{name:`Birch Plank`,type:`plank`,species:`birch`,baseValue:2.5},pine_plank:{name:`Pine Plank`,type:`plank`,species:`pine`,baseValue:4},goldwood:{name:`Gold Wood`,type:`special`,baseValue:10},sapling:{name:`Oak Sapling`,type:`sapling`,species:`oak`,baseValue:1,plantable:!0},birch_sapling:{name:`Birch Sapling`,type:`sapling`,species:`birch`,baseValue:1,plantable:!0},pine_sapling:{name:`Pine Sapling`,type:`sapling`,species:`pine`,baseValue:1.5,plantable:!0}},gt={rich:{name:`Rich Soil`,desc:`A tree on this tile regrows 50% faster.`,growthMult:1.5,price:e=>Math.round(40*1.35**e)}},_t={clickPower:1,clickPowerMult:1,critChance:0,critMult:3,combo:!1,comboMax:10,frenzy:!1,splinterChance:0,woodpecker:0,woodPerTree:2,pickupRadius:0,goldenChance:0,magnet:!1,magnetDelay:5,woodCap:20,woodPrice:1,goldValueMult:1,growthMult:1,treeCap:3,saplingBonus:0,autoReplant:!1,headStart:0,saplingPriceMult:1,soilBonus:0,soilPriceMult:1,autoSell:!1,plankPriceMult:1,landPriceMult:1,buildPriceMult:1,sawSpeedMult:1,offlineHours:2,workerCap:0,workerSpeedMult:1,workerSwingMult:1,workerDamageMult:1,workerCarryBonus:0,boardSize:3,rarityBoost:0,rerollPriceMult:1,xpMult:1,levelCapBonus:0,wageMult:1,nightProof:!1,hireDiscount:1,masterclass:!1,teamSpirit:!1};function vt(){let e={money:0,inventory:Object.fromEntries(Object.keys(ht).map(e=>[e,0])),soils:{},workers:[],board:null,day:1,hour:8,speed:1,skills:{},tutorial:`chop`,hints:{},reputation:0,orders:null,autoSellRules:{},land:Je(),customers:{},idle:null,playTime:0,beds:[],treeCapSeen:null};return yt(e),e}function yt(e){Object.assign(e,_t),e.repLevel=We(e.reputation??0);for(let t of ue)for(let n of t.nodes){let t=e.skills[n.id]??0;t>0&&n.apply(e,t)}e.treeCap+=Xe(e)*1,e.woodPrice*=1+He*e.repLevel,pt(e)}function bt(e,t){return t===`board`||t===`management`?(e.skills.hut??0)>0:t===`buildings`?(e.skills.construction??0)>0:t!==`orders`||(e.skills.orders??0)>0}function xt(e){return Object.values(e.inventory).reduce((e,t)=>e+t,0)}function St(e,t){let n=ht[t],r=t===`goldwood`?e.goldValueMult:n.type===`plank`?e.plankPriceMult:1;return n.baseValue*e.woodPrice*r*(e.eventPriceMult??1)}function Ct(e,t){let n=Object.values(e.soils).filter(e=>e===t).length;return Math.round(gt[t].price(n)*e.soilPriceMult)}function wt(e){return Object.keys(ht).reduce((t,n)=>t+e.inventory[n]*St(e,n),0)}function Tt(e,t){let n=e.money<0?t*(1-Se):t;return e.money+=n,n}function Et(e,t,n=e.inventory[t]){let r=Math.min(n,e.inventory[t]);return r<=0?0:(e.inventory[t]-=r,Tt(e,r*St(e,t)))}function Dt(e,{onlyTypes:t=null}={}){let n=0;for(let r of Object.keys(ht))(!t||t.includes(ht[r].type))&&(n+=Et(e,r));return n}var Ot=[`log`,`special`];function kt(e,t){return e.autoSellRules??={},e.autoSellRules[t]??={on:Ot.includes(ht[t].type),keep:0},e.autoSellRules[t]}function At(e,t){return(e.orders?.list??[]).reduce((e,n)=>e+n.items.reduce((e,n)=>e+(n.key===t?n.n:0),0),0)}function jt(e,t=!1){let n=0;for(let r of Object.keys(ht)){let i=kt(e,r);if(!i.on)continue;let a=(e.inventory[r]??0)-Math.max(i.keep,t?0:At(e,r));a>0&&(n+=Et(e,r,a))}return n<=0&&!t?jt(e,!0):n}function Mt(e,t,{quiet:n=!1}={}){let r=e.day*24+e.hour;for(e.hour+=t*24/300;e.hour>=24;)e.hour-=24,e.day+=1;let i=e.day*24+e.hour,a=Math.floor((i-6)/24)-Math.floor((r-6)/24);for(let t=0;t<a;t++)Nt(e,n);return a}function Nt(e,t=!1){let n=Oe(e);if(n<=0)return;let r=e.money>=0;e.money-=n,!t&&(Be(`payday`,{total:n}),r&&e.money<0&&Be(`debt`))}function Pt(e){return e>=6&&e<20}function Ft(e){if(e<0)return`-`+Ft(-e);if(e<1e3)return Number.isInteger(e)||e>=100?String(Math.floor(e)):e.toFixed(1).replace(/\.0$/,``);let t=[`k`,`M`,`B`,`T`],n=-1,r=e;for(;r>=1e3&&n<t.length-1;)r/=1e3,n++;return r.toFixed(r<10?2:+(r<100))+t[n]}var It=[`money`,`inventory`,`soils`,`workers`,`board`,`day`,`hour`,`speed`,`skills`,`tutorial`,`hints`,`reputation`,`orders`,`autoSellRules`,`land`,`customers`,`idle`,`playTime`,`beds`,`treeCapSeen`];function Lt(e,t){for(let n of It)t[n]!==void 0&&(n===`inventory`||n===`land`?Object.assign(e[n],t[n]):n===`workers`?e.workers=(Array.isArray(t.workers)?t.workers:[]).map(Te):e[n]=t[n]);yt(e)}function Rt(e){let t=Math.floor(e),n=Math.floor((e-t)*60);return String(t).padStart(2,`0`)+`:`+String(n).padStart(2,`0`)}var zt=1e3,Bt=1001,Vt=1002,H=1003,Ht=1004,Ut=1005,Wt=1006,Gt=1007,Kt=1008,qt=1009,Jt=1010,Yt=1011,Xt=1012,Zt=1013,Qt=1014,$t=1015,en=1016,tn=1017,nn=1018,rn=1020,an=35902,on=35899,sn=1021,cn=1022,ln=1023,un=1026,dn=1027,fn=1028,pn=1029,mn=1030,hn=1031,gn=1033,_n=33776,vn=33777,yn=33778,bn=33779,xn=35840,Sn=35841,Cn=35842,wn=35843,Tn=36196,En=37492,Dn=37496,On=37488,kn=37489,An=37490,jn=37491,Mn=37808,Nn=37809,Pn=37810,Fn=37811,In=37812,Ln=37813,Rn=37814,zn=37815,Bn=37816,Vn=37817,Hn=37818,Un=37819,Wn=37820,Gn=37821,Kn=36492,qn=36494,Jn=36495,Yn=36283,Xn=36284,Zn=36285,Qn=36286,$n=2300,er=2301,tr=2302,nr=2303,rr=2400,ir=2401,ar=2402,or=3200,sr=`srgb`,cr=`srgb-linear`,lr=`linear`,ur=`srgb`,dr=7680,fr=35044,pr=2e3;function mr(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function hr(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function gr(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function _r(){let e=gr(`canvas`);return e.style.display=`block`,e}var vr={};function yr(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function br(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function U(...e){e=br(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function W(...e){e=br(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function xr(...e){let t=e.join(` `);t in vr||(vr[t]=!0,U(...e))}function Sr(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var Cr={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},wr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},Tr=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Er=1234567,Dr=Math.PI/180,Or=180/Math.PI;function kr(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Tr[e&255]+Tr[e>>8&255]+Tr[e>>16&255]+Tr[e>>24&255]+`-`+Tr[t&255]+Tr[t>>8&255]+`-`+Tr[t>>16&15|64]+Tr[t>>24&255]+`-`+Tr[n&63|128]+Tr[n>>8&255]+`-`+Tr[n>>16&255]+Tr[n>>24&255]+Tr[r&255]+Tr[r>>8&255]+Tr[r>>16&255]+Tr[r>>24&255]).toLowerCase()}function Ar(e,t,n){return Math.max(t,Math.min(n,e))}function jr(e,t){return(e%t+t)%t}function Mr(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function Nr(e,t,n){return e===t?0:(n-e)/(t-e)}function Pr(e,t,n){return(1-n)*e+n*t}function Fr(e,t,n,r){return Pr(e,t,1-Math.exp(-n*r))}function Ir(e,t=1){return t-Math.abs(jr(e,t*2)-t)}function Lr(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Rr(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function zr(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Br(e,t){return e+Math.random()*(t-e)}function Vr(e){return e*(.5-Math.random())}function Hr(e){e!==void 0&&(Er=e);let t=Er+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ur(e){return e*Dr}function Wr(e){return e*Or}function Gr(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Kr(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function qr(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Jr(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:U(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Yr(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function Xr(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var Zr={DEG2RAD:Dr,RAD2DEG:Or,generateUUID:kr,clamp:Ar,euclideanModulo:jr,mapLinear:Mr,inverseLerp:Nr,lerp:Pr,damp:Fr,pingpong:Ir,smoothstep:Lr,smootherstep:Rr,randInt:zr,randFloat:Br,randFloatSpread:Vr,seededRandom:Hr,degToRad:Ur,radToDeg:Wr,isPowerOfTwo:Gr,ceilPowerOfTwo:Kr,floorPowerOfTwo:qr,setQuaternionFromProperEuler:Jr,normalize:Xr,denormalize:Yr},Qr=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ar(this.x,e.x,t.x),this.y=Ar(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ar(this.x,e,t),this.y=Ar(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ar(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ar(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},$r=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:U(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ar(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ti.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ti.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ar(this.x,e.x,t.x),this.y=Ar(this.y,e.y,t.y),this.z=Ar(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ar(this.x,e,t),this.y=Ar(this.y,e,t),this.z=Ar(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ar(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ei.copy(this).projectOnVector(e),this.sub(ei)}reflect(e){return this.sub(ei.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ar(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ei=new G,ti=new $r,K=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return xr(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(ni.makeScale(e,t)),this}rotate(e){return xr(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(ni.makeRotation(-e)),this}translate(e,t){return xr(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(ni.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ni=new K,ri=new K().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ii=new K().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function ai(){let e={enabled:!0,workingColorSpace:cr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=oi(e.r),e.g=oi(e.g),e.b=oi(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=si(e.r),e.g=si(e.g),e.b=si(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?lr:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return xr(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return xr(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[cr]:{primaries:t,whitePoint:r,transfer:lr,toXYZ:ri,fromXYZ:ii,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:sr},outputColorSpaceConfig:{drawingBufferColorSpace:sr}},[sr]:{primaries:t,whitePoint:r,transfer:ur,toXYZ:ri,fromXYZ:ii,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:sr}}}),e}var q=ai();function oi(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function si(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var ci,li=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ci===void 0&&(ci=gr(`canvas`)),ci.width=e.width,ci.height=e.height;let t=ci.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=ci}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=gr(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=oi(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(oi(t[e]/255)*255):t[e]=oi(t[e]);return{data:t,width:e.width,height:e.height}}return U(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},ui=0,di=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ui++}),this.uuid=kr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(fi(r[t].image)):e.push(fi(r[t]))}else e=fi(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function fi(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?li.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(U(`Texture: Unable to serialize Texture.`),{})}var pi=0,mi=new G,hi=class e extends wr{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=Bt,i=Bt,a=Wt,o=Kt,s=ln,c=qt,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:pi++}),this.uuid=kr(),this.name=``,this.source=new di(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new Qr(0,0),this.repeat=new Qr(1,1),this.center=new Qr(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new K,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(mi).x}get height(){return this.source.getSize(mi).y}get depth(){return this.source.getSize(mi).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){U(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){U(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case zt:e.x-=Math.floor(e.x);break;case Bt:e.x=e.x<0?0:1;break;case Vt:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case zt:e.y-=Math.floor(e.y);break;case Bt:e.y=e.y<0?0:1;break;case Vt:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};hi.DEFAULT_IMAGE=null,hi.DEFAULT_MAPPING=300,hi.DEFAULT_ANISOTROPY=1;var gi=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ar(this.x,e.x,t.x),this.y=Ar(this.y,e.y,t.y),this.z=Ar(this.z,e.z,t.z),this.w=Ar(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ar(this.x,e,t),this.y=Ar(this.y,e,t),this.z=Ar(this.z,e,t),this.w=Ar(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ar(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},_i=class extends wr{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Wt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new gi(0,0,e,t),this.scissorTest=!1,this.viewport=new gi(0,0,e,t),this.textures=[];let r=new hi({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Wt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new di(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},vi=class extends _i{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},yi=class extends hi{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=H,this.minFilter=H,this.wrapR=Bt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},bi=class extends hi{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=H,this.minFilter=H,this.wrapR=Bt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},xi=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Si.setFromMatrixColumn(e,0).length(),i=1/Si.setFromMatrixColumn(e,1).length(),a=1/Si.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(wi,e,Ti)}lookAt(e,t,n){let r=this.elements;return Oi.subVectors(e,t),Oi.lengthSq()===0&&(Oi.z=1),Oi.normalize(),Ei.crossVectors(n,Oi),Ei.lengthSq()===0&&(Math.abs(n.z)===1?Oi.x+=1e-4:Oi.z+=1e-4,Oi.normalize(),Ei.crossVectors(n,Oi)),Ei.normalize(),Di.crossVectors(Oi,Ei),r[0]=Ei.x,r[4]=Di.x,r[8]=Oi.x,r[1]=Ei.y,r[5]=Di.y,r[9]=Oi.y,r[2]=Ei.z,r[6]=Di.z,r[10]=Oi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],te=r[7],ne=r[11],N=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*ne,i[12]=a*w+o*O+s*ee+c*N,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*ne,i[13]=l*w+u*O+d*ee+f*N,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*ne,i[14]=p*w+m*O+h*ee+g*N,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*ne,i[15]=_*w+v*O+y*ee+b*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Si.set(r[0],r[1],r[2]).length(),o=Si.set(r[4],r[5],r[6]).length(),s=Si.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Ci.copy(this);let c=1/a,l=1/o,u=1/s;return Ci.elements[0]*=c,Ci.elements[1]*=c,Ci.elements[2]*=c,Ci.elements[4]*=l,Ci.elements[5]*=l,Ci.elements[6]*=l,Ci.elements[8]*=u,Ci.elements[9]*=u,Ci.elements[10]*=u,t.setFromRotationMatrix(Ci),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=pr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=pr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Si=new G,Ci=new xi,wi=new G(0,0,0),Ti=new G(1,1,1),Ei=new G,Di=new G,Oi=new G,ki=new xi,Ai=new $r,ji=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(Ar(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-Ar(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(Ar(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-Ar(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(Ar(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-Ar(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:U(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ki.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ki,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ai.setFromEuler(this),this.setFromQuaternion(Ai,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ji.DEFAULT_ORDER=`XYZ`;var Mi=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},Ni=0,Pi=new G,Fi=new $r,Ii=new xi,Li=new G,Ri=new G,zi=new G,Bi=new $r,Vi=new G(1,0,0),Hi=new G(0,1,0),Ui=new G(0,0,1),Wi={type:`added`},Gi={type:`removed`},Ki={type:`childadded`,child:null},qi={type:`childremoved`,child:null},Ji=class e extends wr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ni++}),this.uuid=kr(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new G,n=new ji,r=new $r,i=new G(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new xi},normalMatrix:{value:new K}}),this.matrix=new xi,this.matrixWorld=new xi,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Mi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Fi.setFromAxisAngle(e,t),this.quaternion.multiply(Fi),this}rotateOnWorldAxis(e,t){return Fi.setFromAxisAngle(e,t),this.quaternion.premultiply(Fi),this}rotateX(e){return this.rotateOnAxis(Vi,e)}rotateY(e){return this.rotateOnAxis(Hi,e)}rotateZ(e){return this.rotateOnAxis(Ui,e)}translateOnAxis(e,t){return Pi.copy(e).applyQuaternion(this.quaternion),this.position.add(Pi.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Vi,e)}translateY(e){return this.translateOnAxis(Hi,e)}translateZ(e){return this.translateOnAxis(Ui,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ii.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Li.copy(e):Li.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Ri.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ii.lookAt(Ri,Li,this.up):Ii.lookAt(Li,Ri,this.up),this.quaternion.setFromRotationMatrix(Ii),r&&(Ii.extractRotation(r.matrixWorld),Fi.setFromRotationMatrix(Ii),this.quaternion.premultiply(Fi.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(W(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Wi),Ki.child=e,this.dispatchEvent(Ki),Ki.child=null):W(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Gi),qi.child=e,this.dispatchEvent(qi),qi.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ii.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ii.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ii),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Wi),Ki.child=e,this.dispatchEvent(Ki),Ki.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,e,zi),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,Bi,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Ji.DEFAULT_UP=new G(0,1,0),Ji.DEFAULT_MATRIX_AUTO_UPDATE=!0,Ji.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Yi=class extends Ji{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Xi={type:`move`},Zi=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Yi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Yi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Yi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Xi)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Yi;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Qi={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},$i={h:0,s:0,l:0},ea={h:0,s:0,l:0};function ta(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var J=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=sr){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,q.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=q.workingColorSpace){return this.r=e,this.g=t,this.b=n,q.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=q.workingColorSpace){if(e=jr(e,1),t=Ar(t,0,1),n=Ar(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=ta(i,r,e+1/3),this.g=ta(i,r,e),this.b=ta(i,r,e-1/3)}return q.colorSpaceToWorking(this,r),this}setStyle(e,t=sr){function n(t){t!==void 0&&parseFloat(t)<1&&U(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:U(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);U(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=sr){let n=Qi[e.toLowerCase()];return n===void 0?U(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=oi(e.r),this.g=oi(e.g),this.b=oi(e.b),this}copyLinearToSRGB(e){return this.r=si(e.r),this.g=si(e.g),this.b=si(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=sr){return q.workingToColorSpace(na.copy(this),e),Math.round(Ar(na.r*255,0,255))*65536+Math.round(Ar(na.g*255,0,255))*256+Math.round(Ar(na.b*255,0,255))}getHexString(e=sr){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=q.workingColorSpace){q.workingToColorSpace(na.copy(this),t);let n=na.r,r=na.g,i=na.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=q.workingColorSpace){return q.workingToColorSpace(na.copy(this),t),e.r=na.r,e.g=na.g,e.b=na.b,e}getStyle(e=sr){q.workingToColorSpace(na.copy(this),e);let t=na.r,n=na.g,r=na.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL($i),this.setHSL($i.h+e,$i.s+t,$i.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL($i),e.getHSL(ea);let n=Pr($i.h,ea.h,t),r=Pr($i.s,ea.s,t),i=Pr($i.l,ea.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},na=new J;J.NAMES=Qi;var ra=class extends Ji{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ji,this.environmentIntensity=1,this.environmentRotation=new ji,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},ia=new G,aa=new G,oa=new G,sa=new G,ca=new G,la=new G,ua=new G,da=new G,fa=new G,pa=new G,ma=new gi,ha=new gi,ga=new gi,_a=class e{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),ia.subVectors(e,t),r.cross(ia);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){ia.subVectors(r,t),aa.subVectors(n,t),oa.subVectors(e,t);let a=ia.dot(ia),o=ia.dot(aa),s=ia.dot(oa),c=aa.dot(aa),l=aa.dot(oa),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,sa)!==null&&sa.x>=0&&sa.y>=0&&sa.x+sa.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,sa)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,sa.x),s.addScaledVector(a,sa.y),s.addScaledVector(o,sa.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return ma.setScalar(0),ha.setScalar(0),ga.setScalar(0),ma.fromBufferAttribute(e,t),ha.fromBufferAttribute(e,n),ga.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ma,i.x),a.addScaledVector(ha,i.y),a.addScaledVector(ga,i.z),a}static isFrontFacing(e,t,n,r){return ia.subVectors(n,t),aa.subVectors(e,t),ia.cross(aa).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ia.subVectors(this.c,this.b),aa.subVectors(this.a,this.b),ia.cross(aa).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;ca.subVectors(r,n),la.subVectors(i,n),da.subVectors(e,n);let s=ca.dot(da),c=la.dot(da);if(s<=0&&c<=0)return t.copy(n);fa.subVectors(e,r);let l=ca.dot(fa),u=la.dot(fa);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(ca,a);pa.subVectors(e,i);let f=ca.dot(pa),p=la.dot(pa);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(la,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return ua.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(ua,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(ca,a).addScaledVector(la,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},va=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ba.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ba.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ba.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,ba):ba.fromBufferAttribute(r,t),ba.applyMatrix4(e.matrixWorld),this.expandByPoint(ba);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),xa.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),xa.copy(e.boundingBox)),xa.applyMatrix4(e.matrixWorld),this.union(xa)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ba),ba.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Oa),ka.subVectors(this.max,Oa),Sa.subVectors(e.a,Oa),Ca.subVectors(e.b,Oa),wa.subVectors(e.c,Oa),Ta.subVectors(Ca,Sa),Ea.subVectors(wa,Ca),Da.subVectors(Sa,wa);let t=[0,-Ta.z,Ta.y,0,-Ea.z,Ea.y,0,-Da.z,Da.y,Ta.z,0,-Ta.x,Ea.z,0,-Ea.x,Da.z,0,-Da.x,-Ta.y,Ta.x,0,-Ea.y,Ea.x,0,-Da.y,Da.x,0];return!Ma(t,Sa,Ca,wa,ka)||(t=[1,0,0,0,1,0,0,0,1],!Ma(t,Sa,Ca,wa,ka))?!1:(Aa.crossVectors(Ta,Ea),t=[Aa.x,Aa.y,Aa.z],Ma(t,Sa,Ca,wa,ka))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ba).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ba).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ya[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ya[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ya[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ya[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ya[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ya[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ya[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ya[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ya),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ya=[new G,new G,new G,new G,new G,new G,new G,new G],ba=new G,xa=new va,Sa=new G,Ca=new G,wa=new G,Ta=new G,Ea=new G,Da=new G,Oa=new G,ka=new G,Aa=new G,ja=new G;function Ma(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){ja.fromArray(e,a);let o=i.x*Math.abs(ja.x)+i.y*Math.abs(ja.y)+i.z*Math.abs(ja.z),s=t.dot(ja),c=n.dot(ja),l=r.dot(ja);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Na=new G,Pa=new Qr,Fa=0,Ia=class extends wr{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Fa++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=fr,this.updateRanges=[],this.gpuType=$t,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Pa.fromBufferAttribute(this,t),Pa.applyMatrix3(e),this.setXY(t,Pa.x,Pa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Na.fromBufferAttribute(this,t),Na.applyMatrix3(e),this.setXYZ(t,Na.x,Na.y,Na.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Na.fromBufferAttribute(this,t),Na.applyMatrix4(e),this.setXYZ(t,Na.x,Na.y,Na.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Na.fromBufferAttribute(this,t),Na.applyNormalMatrix(e),this.setXYZ(t,Na.x,Na.y,Na.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Na.fromBufferAttribute(this,t),Na.transformDirection(e),this.setXYZ(t,Na.x,Na.y,Na.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Yr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Xr(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Yr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Xr(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Yr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Xr(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Yr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Xr(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Yr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Xr(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array),r=Xr(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array),r=Xr(r,this.array),i=Xr(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},La=class extends Ia{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Ra=class extends Ia{constructor(e,t,n){super(new Uint32Array(e),t,n)}},za=class extends Ia{constructor(e,t,n){super(new Float32Array(e),t,n)}},Ba=new va,Va=new G,Ha=new G,Ua=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Ba.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Va.subVectors(e,this.center);let t=Va.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(Va,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ha.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Va.copy(e.center).add(Ha)),this.expandByPoint(Va.copy(e.center).sub(Ha))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Wa=0,Ga=new xi,Ka=new Ji,qa=new G,Ja=new va,Ya=new va,Xa=new G,Za=class e extends wr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Wa++}),this.uuid=kr(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(mr(e)?Ra:La)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new K().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ga.makeRotationFromQuaternion(e),this.applyMatrix4(Ga),this}rotateX(e){return Ga.makeRotationX(e),this.applyMatrix4(Ga),this}rotateY(e){return Ga.makeRotationY(e),this.applyMatrix4(Ga),this}rotateZ(e){return Ga.makeRotationZ(e),this.applyMatrix4(Ga),this}translate(e,t,n){return Ga.makeTranslation(e,t,n),this.applyMatrix4(Ga),this}scale(e,t,n){return Ga.makeScale(e,t,n),this.applyMatrix4(Ga),this}lookAt(e){return Ka.lookAt(e),Ka.updateMatrix(),this.applyMatrix4(Ka.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qa).negate(),this.translate(qa.x,qa.y,qa.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new za(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&U(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new va);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){W(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ja.setFromBufferAttribute(n),this.morphTargetsRelative?(Xa.addVectors(this.boundingBox.min,Ja.min),this.boundingBox.expandByPoint(Xa),Xa.addVectors(this.boundingBox.max,Ja.max),this.boundingBox.expandByPoint(Xa)):(this.boundingBox.expandByPoint(Ja.min),this.boundingBox.expandByPoint(Ja.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&W(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ua);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){W(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(Ja.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ya.setFromBufferAttribute(n),this.morphTargetsRelative?(Xa.addVectors(Ja.min,Ya.min),Ja.expandByPoint(Xa),Xa.addVectors(Ja.max,Ya.max),Ja.expandByPoint(Xa)):(Ja.expandByPoint(Ya.min),Ja.expandByPoint(Ya.max))}Ja.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Xa.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Xa));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Xa.fromBufferAttribute(a,t),o&&(qa.fromBufferAttribute(e,t),Xa.add(qa)),r=Math.max(r,n.distanceToSquared(Xa))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&W(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){W(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Ia(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new G,s[e]=new G;let c=new G,l=new G,u=new G,d=new Qr,f=new Qr,p=new Qr,m=new G,h=new G;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new G,y=new G,b=new G,x=new G;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Ia(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new G,i=new G,a=new G,o=new G,s=new G,c=new G,l=new G,u=new G;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Xa.fromBufferAttribute(e,t),Xa.normalize(),e.setXYZ(t,Xa.x,Xa.y,Xa.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Ia(a,r,i)}if(this.index===null)return U(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Qa=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=fr,this.updateRanges=[],this.version=0,this.uuid=kr()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=kr()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=kr()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},$a=new G,eo=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)$a.fromBufferAttribute(this,t),$a.applyMatrix4(e),this.setXYZ(t,$a.x,$a.y,$a.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)$a.fromBufferAttribute(this,t),$a.applyNormalMatrix(e),this.setXYZ(t,$a.x,$a.y,$a.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)$a.fromBufferAttribute(this,t),$a.transformDirection(e),this.setXYZ(t,$a.x,$a.y,$a.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Yr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Xr(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Xr(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Xr(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Xr(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Xr(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Yr(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Yr(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Yr(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Yr(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array),r=Xr(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xr(t,this.array),n=Xr(n,this.array),r=Xr(r,this.array),i=Xr(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){yr(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Ia(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){yr(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},to=new G,no=new G,ro=new K,io=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=to.subVectors(n,t).cross(no.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(to),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||ro.getNormalMatrix(e),r=this.coplanarPoint(to).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},ao=0,oo=class extends wr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ao++}),this.uuid=kr(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=dr,this.stencilZFail=dr,this.stencilZPass=dr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){U(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){U(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new J().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new io().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new Qr().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Qr().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},so=class extends oo{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new J(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},co,lo=new G,uo=new G,fo=new G,po=new Qr,mo=new Qr,ho=new xi,go=new G,_o=new G,vo=new G,yo=new Qr,bo=new Qr,xo=new Qr,So=class extends Ji{constructor(e=new so){if(super(),this.isSprite=!0,this.type=`Sprite`,co===void 0){co=new Za;let e=new Qa(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);co.setIndex([0,1,2,0,2,3]),co.setAttribute(`position`,new eo(e,3,0,!1)),co.setAttribute(`uv`,new eo(e,2,3,!1))}this.geometry=co,this.material=e,this.center=new Qr(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&W(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),uo.setFromMatrixScale(this.matrixWorld),ho.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),fo.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&uo.multiplyScalar(-fo.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;Co(go.set(-.5,-.5,0),fo,a,uo,r,i),Co(_o.set(.5,-.5,0),fo,a,uo,r,i),Co(vo.set(.5,.5,0),fo,a,uo,r,i),yo.set(0,0),bo.set(1,0),xo.set(1,1);let o=e.ray.intersectTriangle(go,_o,vo,!1,lo);if(o===null&&(Co(_o.set(-.5,.5,0),fo,a,uo,r,i),bo.set(0,1),o=e.ray.intersectTriangle(go,vo,_o,!1,lo),o===null))return;let s=e.ray.origin.distanceTo(lo);s<e.near||s>e.far||t.push({distance:s,point:lo.clone(),uv:_a.getInterpolation(lo,go,_o,vo,yo,bo,xo,new Qr),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Co(e,t,n,r,i,a){po.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?mo.copy(po):(mo.x=a*po.x-i*po.y,mo.y=i*po.x+a*po.y),e.copy(t),e.x+=mo.x,e.y+=mo.y,e.applyMatrix4(ho)}var wo=new G,To=new G,Eo=new G,Do=new G,Oo=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,wo)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=wo.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(wo.copy(this.origin).addScaledVector(this.direction,t),wo.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){To.copy(e).add(t).multiplyScalar(.5),Eo.copy(t).sub(e).normalize(),Do.copy(this.origin).sub(To);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Eo),o=Do.dot(this.direction),s=-Do.dot(Eo),c=Do.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(To).addScaledVector(Eo,d),f}intersectSphere(e,t){if(e.radius<0)return null;wo.subVectors(e.center,this.origin);let n=wo.dot(this.direction),r=wo.dot(wo)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,wo)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let te=S/w,ne=C/w,N=1/w,re=T-te*D,ie=E-ne*D,ae=O-te*A,oe=k-ne*A,se=j-te*M,P=ee-ne*M,F=se*oe-P*ae,I=re*P-ie*se,ce=ae*ie-oe*re;if(r){if(F<0||I<0||ce<0)return null}else if((F<0||I<0||ce<0)&&(F>0||I>0||ce>0))return null;let le=F+I+ce;if(le===0)return null;let ue=N*(F*D+I*A+ce*M);return(le>0?ue<0:ue>0)?null:this.at(ue/le,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ko=class extends oo{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ji,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Ao=new xi,jo=new Oo,Mo=new Ua,No=new G,Po=new G,Fo=new G,Io=new G,Lo=new G,Ro=new G,zo=new G,Bo=new G,Vo=class extends Ji{constructor(e=new Za,t=new ko){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Ro.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Lo.fromBufferAttribute(s,e),a?Ro.addScaledVector(Lo,r):Ro.addScaledVector(Lo.sub(t),r))}t.add(Ro)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Mo.copy(n.boundingSphere),Mo.applyMatrix4(i),jo.copy(e.ray).recast(e.near),!(Mo.containsPoint(jo.origin)===!1&&(jo.intersectSphere(Mo,No)===null||jo.origin.distanceToSquared(No)>(e.far-e.near)**2))&&(Ao.copy(i).invert(),jo.copy(e.ray).applyMatrix4(Ao),(n.boundingBox===null||jo.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,jo)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Uo(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Uo(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Uo(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Uo(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Ho(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Bo.copy(s),Bo.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Bo);return l<n.near||l>n.far?null:{distance:l,point:Bo.clone(),object:e}}function Uo(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Po),e.getVertexPosition(c,Fo),e.getVertexPosition(l,Io);let u=Ho(e,t,n,r,Po,Fo,Io,zo);if(u){let e=new G;_a.getBarycoord(zo,Po,Fo,Io,e),i&&(u.uv=_a.getInterpolatedAttribute(i,s,c,l,e,new Qr)),a&&(u.uv1=_a.getInterpolatedAttribute(a,s,c,l,e,new Qr)),o&&(u.normal=_a.getInterpolatedAttribute(o,s,c,l,e,new G),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new G,materialIndex:0};_a.getNormal(Po,Fo,Io,t.normal),u.face=t,u.barycoord=e}return u}var Wo=class extends hi{constructor(e=null,t=1,n=1,r,i,a,o,s,c=H,l=H,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Go=new Ua,Ko=new Qr(.5,.5),qo=new G,Jo=class{constructor(e=new io,t=new io,n=new io,r=new io,i=new io,a=new io){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=pr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Go.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Go.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Go)}intersectsSprite(e){return Go.center.set(0,0,0),Go.radius=.7071067811865476+Ko.distanceTo(e.center),Go.applyMatrix4(e.matrixWorld),this.intersectsSphere(Go)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(qo.x=r.normal.x>0?e.max.x:e.min.x,qo.y=r.normal.y>0?e.max.y:e.min.y,qo.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(qo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Yo=class extends hi{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Xo=class extends hi{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Zo=class extends hi{constructor(e,t,n=Qt,r,i,a,o=H,s=H,c,l=un,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new di(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Qo=class extends Zo{constructor(e,t=Qt,n=301,r,i,a=H,o=H,s,c=un){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},$o=class extends hi{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},es=class e extends Za{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new za(c,3)),this.setAttribute(`normal`,new za(l,3)),this.setAttribute(`uv`,new za(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new G;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},ts=class e extends Za{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new za(p,3)),this.setAttribute(`normal`,new za(m,3)),this.setAttribute(`uv`,new za(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function ns(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(is(i))i.isRenderTargetTexture?(U(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(is(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function rs(e){let t={};for(let n=0;n<e.length;n++){let r=ns(e[n]);for(let e in r)t[e]=r[e]}return t}function is(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function as(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function os(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:q.workingColorSpace}var ss={clone:ns,merge:rs},cs=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ls=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,us=class extends oo{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=cs,this.fragmentShader=ls,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ns(e.uniforms),this.uniformsGroups=as(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new J().setHex(r.value);break;case`v2`:this.uniforms[n].value=new Qr().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new gi().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new xi().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ds=class extends us{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},fs=class extends oo{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=or,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ps=class extends oo{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ms(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function hs(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var gs=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},_s=class extends gs{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:rr,endingEnd:rr}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case ir:i=e,o=2*t-n;break;case ar:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case ir:a=e,s=2*n-t;break;case ar:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},vs=class extends gs{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},ys=class extends gs{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},bs=class extends gs{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Cs(n,t,g,y,r);i[p]=xs(x,o,_,b,m)}return i}};function xs(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ss(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Cs(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=xs(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ss(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var ws=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=ms(t,this.TimeBufferType),this.values=ms(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ms(e.times,Array),values:ms(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),hs(e.settings)&&(n.settings={inTangents:ms(e.settings.inTangents,Array),outTangents:ms(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ys(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new vs(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new _s(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new bs(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case $n:t=this.InterpolantFactoryMethodDiscrete;break;case er:t=this.InterpolantFactoryMethodLinear;break;case tr:t=this.InterpolantFactoryMethodSmooth;break;case nr:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return U(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return $n;case this.InterpolantFactoryMethodLinear:return er;case this.InterpolantFactoryMethodSmooth:return tr;case this.InterpolantFactoryMethodBezier:return nr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;hs(this.settings)&&(Ts(this.settings.inTangents,e),Ts(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(W(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(W(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){W(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){W(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&hr(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){W(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===tr,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,hs(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Ts(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}ws.prototype.ValueTypeName=``,ws.prototype.TimeBufferType=Float32Array,ws.prototype.ValueBufferType=Float32Array,ws.prototype.DefaultInterpolation=er;var Es=class extends ws{constructor(e,t,n){super(e,t,n)}};Es.prototype.ValueTypeName=`bool`,Es.prototype.ValueBufferType=Array,Es.prototype.DefaultInterpolation=$n,Es.prototype.InterpolantFactoryMethodLinear=void 0,Es.prototype.InterpolantFactoryMethodSmooth=void 0;var Ds=class extends ws{constructor(e,t,n,r){super(e,t,n,r)}};Ds.prototype.ValueTypeName=`color`;var Os=class extends ws{constructor(e,t,n,r){super(e,t,n,r)}};Os.prototype.ValueTypeName=`number`;var ks=class extends gs{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)$r.slerpFlat(i,0,a,c-o,a,c,s);return i}},As=class extends ws{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new ks(this.times,this.values,this.getValueSize(),e)}};As.prototype.ValueTypeName=`quaternion`,As.prototype.InterpolantFactoryMethodSmooth=void 0;var js=class extends ws{constructor(e,t,n){super(e,t,n)}};js.prototype.ValueTypeName=`string`,js.prototype.ValueBufferType=Array,js.prototype.DefaultInterpolation=$n,js.prototype.InterpolantFactoryMethodLinear=void 0,js.prototype.InterpolantFactoryMethodSmooth=void 0;var Ms=class extends ws{constructor(e,t,n,r){super(e,t,n,r)}};Ms.prototype.ValueTypeName=`vector`;var Ns=new G,Ps=new $r,Fs=new G,Is=class extends Ji{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new xi,this.projectionMatrix=new xi,this.projectionMatrixInverse=new xi,this.coordinateSystem=pr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ns,Ps,Fs),Fs.x===1&&Fs.y===1&&Fs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ns,Ps,Fs.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ns,Ps,Fs),Fs.x===1&&Fs.y===1&&Fs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ns,Ps,Fs.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Ls=new G,Rs=new Qr,zs=new Qr,Bs=class extends Is{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Or*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Dr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Or*2*Math.atan(Math.tan(Dr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ls.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ls.x,Ls.y).multiplyScalar(-e/Ls.z),Ls.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ls.x,Ls.y).multiplyScalar(-e/Ls.z)}getViewSize(e,t){return this.getViewBounds(e,Rs,zs),t.subVectors(zs,Rs)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Dr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Vs=class extends Is{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Hs=-90,Us=1,Ws=class extends Ji{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Bs(Hs,Us,e,t);r.layers=this.layers,this.add(r);let i=new Bs(Hs,Us,e,t);i.layers=this.layers,this.add(i);let a=new Bs(Hs,Us,e,t);a.layers=this.layers,this.add(a);let o=new Bs(Hs,Us,e,t);o.layers=this.layers,this.add(o);let s=new Bs(Hs,Us,e,t);s.layers=this.layers,this.add(s);let c=new Bs(Hs,Us,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Gs=class extends Bs{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Ks=`\\[\\]\\.:\\/`,qs=RegExp(`[\\[\\]\\.:\\/]`,`g`),Js=`[^\\[\\]\\.:\\/]`,Ys=`[^`+Ks.replace(`\\.`,``)+`]`,Xs=`((?:WC+[\\/:])*)`.replace(`WC`,Js),Zs=`(WCOD+)?`.replace(`WCOD`,Ys),Qs=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Js),$s=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Js),ec=RegExp(`^`+Xs+Zs+Qs+$s+`$`),tc=[`material`,`materials`,`bones`,`map`],nc=class{constructor(e,t,n){let r=n||rc.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},rc=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(qs,``)}static parseTrackName(e){let t=ec.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);tc.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){U(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){W(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){W(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){W(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){W(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){W(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){W(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){W(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;W(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){W(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){W(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};rc.Composite=nc,rc.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},rc.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},rc.prototype.GetterByBindingType=[rc.prototype._getValue_direct,rc.prototype._getValue_array,rc.prototype._getValue_arrayElement,rc.prototype._getValue_toArray],rc.prototype.SetterByBindingTypeAndVersioning=[[rc.prototype._setValue_direct,rc.prototype._setValue_direct_setNeedsUpdate,rc.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[rc.prototype._setValue_array,rc.prototype._setValue_array_setNeedsUpdate,rc.prototype._setValue_array_setMatrixWorldNeedsUpdate],[rc.prototype._setValue_arrayElement,rc.prototype._setValue_arrayElement_setNeedsUpdate,rc.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[rc.prototype._setValue_fromArray,rc.prototype._setValue_fromArray_setNeedsUpdate,rc.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ic=new xi,ac=class{constructor(e,t,n=0,r=1/0){this.ray=new Oo(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Mi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):W(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return ic.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ic),this}intersectObject(e,t=!0,n=[]){return sc(e,this,n,t),n.sort(oc),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)sc(e[r],this,n,t);return n.sort(oc),n}};function oc(e,t){return e.distance-t.distance}function sc(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)sc(r[e],t,n,!0)}}(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});function cc(e,t,n,r){let i=lc(r);switch(n){case sn:return e*t;case fn:return e*t/i.components*i.byteLength;case pn:return e*t/i.components*i.byteLength;case mn:return e*t*2/i.components*i.byteLength;case hn:return e*t*2/i.components*i.byteLength;case cn:return e*t*3/i.components*i.byteLength;case ln:return e*t*4/i.components*i.byteLength;case gn:return e*t*4/i.components*i.byteLength;case _n:case vn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case yn:case bn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Sn:case wn:return Math.max(e,16)*Math.max(t,8)/4;case xn:case Cn:return Math.max(e,8)*Math.max(t,8)/2;case Tn:case En:case On:case kn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Dn:case An:case jn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Mn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Nn:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Pn:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Fn:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case In:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Ln:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Rn:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case zn:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Bn:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Vn:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Hn:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Un:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Wn:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Gn:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Kn:case qn:case Jn:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Yn:case Xn:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Zn:case Qn:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function lc(e){switch(e){case qt:case Jt:return{byteLength:1,components:1};case Xt:case Yt:case en:return{byteLength:2,components:1};case tn:case nn:return{byteLength:2,components:4};case Qt:case Zt:case $t:return{byteLength:4,components:1};case an:case on:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?U(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function uc(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function dc(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Y={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},X={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new K}},envmap:{envMap:{value:null},envMapRotation:{value:new K},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new K}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new K}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new K},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new K},normalScale:{value:new Qr(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new K},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new K}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new K}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new K}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0},uvTransform:{value:new K}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new Qr(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}}},fc={basic:{uniforms:rs([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.fog]),vertexShader:Y.meshbasic_vert,fragmentShader:Y.meshbasic_frag},lambert:{uniforms:rs([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new J(0)},envMapIntensity:{value:1}}]),vertexShader:Y.meshlambert_vert,fragmentShader:Y.meshlambert_frag},phong:{uniforms:rs([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Y.meshphong_vert,fragmentShader:Y.meshphong_frag},standard:{uniforms:rs([X.common,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.roughnessmap,X.metalnessmap,X.fog,X.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag},toon:{uniforms:rs([X.common,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.gradientmap,X.fog,X.lights,{emissive:{value:new J(0)}}]),vertexShader:Y.meshtoon_vert,fragmentShader:Y.meshtoon_frag},matcap:{uniforms:rs([X.common,X.bumpmap,X.normalmap,X.displacementmap,X.fog,{matcap:{value:null}}]),vertexShader:Y.meshmatcap_vert,fragmentShader:Y.meshmatcap_frag},points:{uniforms:rs([X.points,X.fog]),vertexShader:Y.points_vert,fragmentShader:Y.points_frag},dashed:{uniforms:rs([X.common,X.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Y.linedashed_vert,fragmentShader:Y.linedashed_frag},depth:{uniforms:rs([X.common,X.displacementmap]),vertexShader:Y.depth_vert,fragmentShader:Y.depth_frag},normal:{uniforms:rs([X.common,X.bumpmap,X.normalmap,X.displacementmap,{opacity:{value:1}}]),vertexShader:Y.meshnormal_vert,fragmentShader:Y.meshnormal_frag},sprite:{uniforms:rs([X.sprite,X.fog]),vertexShader:Y.sprite_vert,fragmentShader:Y.sprite_frag},background:{uniforms:{uvTransform:{value:new K},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Y.background_vert,fragmentShader:Y.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new K}},vertexShader:Y.backgroundCube_vert,fragmentShader:Y.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Y.cube_vert,fragmentShader:Y.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Y.equirect_vert,fragmentShader:Y.equirect_frag},distance:{uniforms:rs([X.common,X.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Y.distance_vert,fragmentShader:Y.distance_frag},shadow:{uniforms:rs([X.lights,X.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:Y.shadow_vert,fragmentShader:Y.shadow_frag}};fc.physical={uniforms:rs([fc.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new K},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new K},clearcoatNormalScale:{value:new Qr(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new K},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new K},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new K},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new K},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new K},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new K},transmissionSamplerSize:{value:new Qr},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new K},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new K},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new K},anisotropyVector:{value:new Qr},anisotropyMap:{value:null},anisotropyMapTransform:{value:new K}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag};var pc={r:0,b:0,g:0},mc=new xi,hc=new K;hc.set(-1,0,0,0,1,0,0,0,1);function gc(e,t,n,r,i,a){let o=new J(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Vo(new es(1,1,1),new us({name:`BackgroundCubeMaterial`,uniforms:ns(fc.backgroundCube.uniforms),vertexShader:fc.backgroundCube.vertexShader,fragmentShader:fc.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(mc.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(hc),l.material.toneMapped=q.getTransfer(i.colorSpace)!==ur,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Vo(new ts(2,2),new us({name:`BackgroundMaterial`,uniforms:ns(fc.background.uniforms),vertexShader:fc.background.vertexShader,fragmentShader:fc.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=q.getTransfer(i.colorSpace)!==ur,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(pc,os(e)),n.buffers.color.setClear(pc.r,pc.g,pc.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function _c(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function vc(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function yc(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(U(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&U(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function bc(e){let t=this,n=null,r=0,i=!1,a=!1,o=new io,s=new K,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var xc=4,Sc=6,Cc=20,wc=256,Tc=new Vs,Ec=new J,Dc=null,Oc=0,kc=0,Ac=!1,jc=new G,Mc=new G,Nc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=jc}=i;Dc=this._renderer.getRenderTarget(),Oc=this._renderer.getActiveCubeFace(),kc=this._renderer.getActiveMipmapLevel(),Ac=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=zc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Dc,Oc,kc),this._renderer.xr.enabled=Ac,e.scissorTest=!1,Ic(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Dc=this._renderer.getRenderTarget(),Oc=this._renderer.getActiveCubeFace(),kc=this._renderer.getActiveMipmapLevel(),Ac=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Wt,minFilter:Wt,generateMipmaps:!1,type:en,format:ln,colorSpace:cr,depthBuffer:!1},r=Fc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fc(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Pc(r)),this._blurMaterial=Rc(r,e,t),this._ggxMaterial=Lc(r,e,t)}return r}_compileMaterial(e){let t=new Vo(new Za,e);this._renderer.compile(t,Tc)}_sceneToCubeUV(e,t,n,r,i){let a=new Bs(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(Ec),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Vo(new es,new ko({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(Ec),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Ic(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=zc());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Ic(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Tc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-xc?n-d+xc:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Ic(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Tc),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Ic(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Tc)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Ic(t,3*l*(r>this._lodMax-xc?r-this._lodMax+xc:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Tc)}};function Pc(e){let t=[],n=[],r=e,i=e-xc+1+Sc;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Mc.set(1,r,n):e===1?Mc.set(-n,1,-r):e===2?Mc.set(-n,r,1):e===3?Mc.set(-1,r,-n):e===4?Mc.set(-n,-1,r):Mc.set(n,r,-1),Mc.toArray(l,(e*6+t)*3)}}let u=new Za;u.setAttribute(`position`,new Ia(c,3)),u.setAttribute(`outputDirection`,new Ia(l,3)),n.push(new Vo(u,null)),r>xc&&r--}return{lodMeshes:n,sizeLods:t}}function Fc(e,t,n){let r=new vi(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Ic(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Lc(e,t,n){return new us({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:wc,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Vc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Rc(e,t,n){return new us({name:`SphericalGaussianBlur`,defines:{SAMPLES:Cc,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Vc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function zc(){return new us({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Bc(){return new us({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Vc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Vc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Hc=class extends vi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Yo(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new es(5,5,5),i=new us({name:`CubemapFromEquirect`,uniforms:ns(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Vo(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=Wt),new Ws(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Uc(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Hc(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Nc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Nc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Wc(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&xr(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Gc(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?Ra:La)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Kc(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function qc(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:W(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Jc(e,t,n){let r=new WeakMap,i=new gi;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new yi(h,p,m,u);g.type=$t,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new Qr(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Yc(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Xc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Zc(e,t,n,r,i,a){let o=new vi(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Za;l.setAttribute(`position`,new za([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new za([0,2,0,0,2,0],2));let u=new ds({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Vo(l,u),f=new Vs(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new vi(t,n,{type:en,depthBuffer:!1,stencilBuffer:!1}),c=new vi(t,n,{type:en,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},q.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=Xc[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var Qc=new hi,$c=new Zo(1,1),el=new yi,tl=new bi,nl=new Yo,rl=[],il=[],al=new Float32Array(16),ol=new Float32Array(9),sl=new Float32Array(4);function cl(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=rl[i];if(a===void 0&&(a=new Float32Array(i),rl[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function ll(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ul(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function dl(e,t){let n=il[t];n===void 0&&(n=new Int32Array(t),il[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function fl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function pl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ll(n,t))return;e.uniform2fv(this.addr,t),ul(n,t)}}function ml(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(ll(n,t))return;e.uniform3fv(this.addr,t),ul(n,t)}}function hl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ll(n,t))return;e.uniform4fv(this.addr,t),ul(n,t)}}function gl(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ll(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ul(n,t)}else{if(ll(n,r))return;sl.set(r),e.uniformMatrix2fv(this.addr,!1,sl),ul(n,r)}}function _l(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ll(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ul(n,t)}else{if(ll(n,r))return;ol.set(r),e.uniformMatrix3fv(this.addr,!1,ol),ul(n,r)}}function vl(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ll(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ul(n,t)}else{if(ll(n,r))return;al.set(r),e.uniformMatrix4fv(this.addr,!1,al),ul(n,r)}}function yl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function bl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ll(n,t))return;e.uniform2iv(this.addr,t),ul(n,t)}}function xl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ll(n,t))return;e.uniform3iv(this.addr,t),ul(n,t)}}function Sl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ll(n,t))return;e.uniform4iv(this.addr,t),ul(n,t)}}function Cl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function wl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ll(n,t))return;e.uniform2uiv(this.addr,t),ul(n,t)}}function Tl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ll(n,t))return;e.uniform3uiv(this.addr,t),ul(n,t)}}function El(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ll(n,t))return;e.uniform4uiv(this.addr,t),ul(n,t)}}function Dl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?($c.compareFunction=n.isReversedDepthBuffer()?518:515,a=$c):a=Qc,n.setTexture2D(t||a,i)}function Ol(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||tl,i)}function kl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||nl,i)}function Al(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||el,i)}function jl(e){switch(e){case 5126:return fl;case 35664:return pl;case 35665:return ml;case 35666:return hl;case 35674:return gl;case 35675:return _l;case 35676:return vl;case 5124:case 35670:return yl;case 35667:case 35671:return bl;case 35668:case 35672:return xl;case 35669:case 35673:return Sl;case 5125:return Cl;case 36294:return wl;case 36295:return Tl;case 36296:return El;case 35678:case 36198:case 36298:case 36306:case 35682:return Dl;case 35679:case 36299:case 36307:return Ol;case 35680:case 36300:case 36308:case 36293:return kl;case 36289:case 36303:case 36311:case 36292:return Al}}function Ml(e,t){e.uniform1fv(this.addr,t)}function Nl(e,t){let n=cl(t,this.size,2);e.uniform2fv(this.addr,n)}function Pl(e,t){let n=cl(t,this.size,3);e.uniform3fv(this.addr,n)}function Fl(e,t){let n=cl(t,this.size,4);e.uniform4fv(this.addr,n)}function Il(e,t){let n=cl(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Ll(e,t){let n=cl(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Rl(e,t){let n=cl(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function zl(e,t){e.uniform1iv(this.addr,t)}function Bl(e,t){e.uniform2iv(this.addr,t)}function Vl(e,t){e.uniform3iv(this.addr,t)}function Hl(e,t){e.uniform4iv(this.addr,t)}function Ul(e,t){e.uniform1uiv(this.addr,t)}function Wl(e,t){e.uniform2uiv(this.addr,t)}function Gl(e,t){e.uniform3uiv(this.addr,t)}function Kl(e,t){e.uniform4uiv(this.addr,t)}function ql(e,t,n){let r=this.cache,i=t.length,a=dl(n,i);ll(r,a)||(e.uniform1iv(this.addr,a),ul(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?$c:Qc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Jl(e,t,n){let r=this.cache,i=t.length,a=dl(n,i);ll(r,a)||(e.uniform1iv(this.addr,a),ul(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||tl,a[e])}function Yl(e,t,n){let r=this.cache,i=t.length,a=dl(n,i);ll(r,a)||(e.uniform1iv(this.addr,a),ul(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||nl,a[e])}function Xl(e,t,n){let r=this.cache,i=t.length,a=dl(n,i);ll(r,a)||(e.uniform1iv(this.addr,a),ul(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||el,a[e])}function Zl(e){switch(e){case 5126:return Ml;case 35664:return Nl;case 35665:return Pl;case 35666:return Fl;case 35674:return Il;case 35675:return Ll;case 35676:return Rl;case 5124:case 35670:return zl;case 35667:case 35671:return Bl;case 35668:case 35672:return Vl;case 35669:case 35673:return Hl;case 5125:return Ul;case 36294:return Wl;case 36295:return Gl;case 36296:return Kl;case 35678:case 36198:case 36298:case 36306:case 35682:return ql;case 35679:case 36299:case 36307:return Jl;case 35680:case 36300:case 36308:case 36293:return Yl;case 36289:case 36303:case 36311:case 36292:return Xl}}var Ql=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=jl(t.type)}},$l=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Zl(t.type)}},eu=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},tu=/(\w+)(\])?(\[|\.)?/g;function nu(e,t){e.seq.push(t),e.map[t.id]=t}function ru(e,t,n){let r=e.name,i=r.length;for(tu.lastIndex=0;;){let a=tu.exec(r),o=tu.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){nu(n,l===void 0?new Ql(s,e,t):new $l(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new eu(s),nu(n,e)),n=e}}}var iu=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);ru(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function au(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var ou=37297,su=0;function cu(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var lu=new K;function uu(e){q._getMatrix(lu,q.workingColorSpace,e);let t=`mat3( ${lu.elements.map(e=>e.toFixed(4))} )`;switch(q.getTransfer(e)){case lr:return[t,`LinearTransferOETF`];case ur:return[t,`sRGBTransferOETF`];default:return U(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function du(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+cu(e.getShaderSource(t),r)}return i}function fu(e,t){let n=uu(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var pu={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function mu(e,t){let n=pu[t];return n===void 0?(U(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var hu=new G;function gu(){return q.getLuminanceCoefficients(hu),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${hu.x.toFixed(4)}, ${hu.y.toFixed(4)}, ${hu.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function _u(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(bu).join(`
`)}function vu(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function yu(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function bu(e){return e!==``}function xu(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Su(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Cu=/^[ \t]*#include +<([\w\d./]+)>/gm;function wu(e){return e.replace(Cu,Eu)}var Tu=new Map;function Eu(e,t){let n=Y[t];if(n===void 0){let e=Tu.get(t);if(e!==void 0)n=Y[e],U(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return wu(n)}var Du=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ou(e){return e.replace(Du,ku)}function ku(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Au(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var ju={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Mu(e){return ju[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Nu={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Pu(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Nu[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Fu={302:`ENVMAP_MODE_REFRACTION`};function Iu(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Fu[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Lu={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Ru(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Lu[e.combine]||`ENVMAP_BLENDING_NONE`}function zu(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Bu(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Mu(n),l=Pu(n),u=Iu(n),d=Ru(n),f=zu(n),p=_u(n),m=vu(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(bu).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(bu).join(`
`),_.length>0&&(_+=`
`)):(g=[Au(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(bu).join(`
`),_=[Au(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Y.tonemapping_pars_fragment,n.toneMapping===0?``:mu(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Y.colorspace_pars_fragment,fu(`linearToOutputTexel`,n.outputColorSpace),gu(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(bu).join(`
`)),o=wu(o),o=xu(o,n),o=Su(o,n),s=wu(s),s=xu(s,n),s=Su(s,n),o=Ou(o),s=Ou(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=au(i,i.VERTEX_SHADER,y),S=au(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=du(i,x,`vertex`),n=du(i,S,`fragment`);W(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):U(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new iu(i,h),T=yu(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,ou)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=su++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Vu=0,Hu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Uu(e),t.set(e,n)),n}},Uu=class{constructor(e){this.id=Vu++,this.code=e,this.usedTimes=0}};function Wu(e){return e===1030||e===37490||e===36285}function Gu(e,t,n,r,i,a){let o=new Mi,s=new Hu,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&U(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=fc[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,te=h.isBatchedMesh===!0,ne=!!i.map,N=!!i.matcap,re=!!x,ie=!!i.aoMap,ae=!!i.lightMap,oe=!!i.bumpMap&&i.wireframe===!1,se=!!i.normalMap,P=!!i.displacementMap,F=!!i.emissiveMap,I=!!i.metalnessMap,ce=!!i.roughnessMap,le=i.anisotropy>0,ue=i.clearcoat>0,de=i.dispersion>0,fe=i.retroreflectivity>0,pe=i.iridescence>0,me=i.sheen>0,he=i.transmission>0,ge=le&&!!i.anisotropyMap,_e=ue&&!!i.clearcoatMap,ve=ue&&!!i.clearcoatNormalMap,ye=ue&&!!i.clearcoatRoughnessMap,be=pe&&!!i.iridescenceMap,L=pe&&!!i.iridescenceThicknessMap,xe=me&&!!i.sheenColorMap,Se=me&&!!i.sheenRoughnessMap,Ce=!!i.specularMap,R=!!i.specularColorMap,we=!!i.specularIntensityMap,z=he&&!!i.transmissionMap,B=he&&!!i.thicknessMap,Te=!!i.gradientMap,Ee=!!i.alphaMap,De=i.alphaTest>0,Oe=!!i.alphaHash,ke=!!i.extensions,Ae=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Ae=e.toneMapping);let je={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:te,batchingColor:te&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:q.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:ne,matcap:N,envMap:re,envMapMode:re&&x.mapping,envMapCubeUVHeight:S,aoMap:ie,lightMap:ae,bumpMap:oe,normalMap:se,displacementMap:P,emissiveMap:F,normalMapObjectSpace:se&&i.normalMapType===1,normalMapTangentSpace:se&&i.normalMapType===0,packedNormalMap:se&&i.normalMapType===0&&Wu(i.normalMap.format),metalnessMap:I,roughnessMap:ce,anisotropy:le,anisotropyMap:ge,clearcoat:ue,clearcoatMap:_e,clearcoatNormalMap:ve,clearcoatRoughnessMap:ye,dispersion:de,retroreflection:fe,iridescence:pe,iridescenceMap:be,iridescenceThicknessMap:L,sheen:me,sheenColorMap:xe,sheenRoughnessMap:Se,specularMap:Ce,specularColorMap:R,specularIntensityMap:we,transmission:he,transmissionMap:z,thicknessMap:B,gradientMap:Te,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Ee,alphaTest:De,alphaHash:Oe,combine:i.combine,mapUv:ne&&m(i.map.channel),aoMapUv:ie&&m(i.aoMap.channel),lightMapUv:ae&&m(i.lightMap.channel),bumpMapUv:oe&&m(i.bumpMap.channel),normalMapUv:se&&m(i.normalMap.channel),displacementMapUv:P&&m(i.displacementMap.channel),emissiveMapUv:F&&m(i.emissiveMap.channel),metalnessMapUv:I&&m(i.metalnessMap.channel),roughnessMapUv:ce&&m(i.roughnessMap.channel),anisotropyMapUv:ge&&m(i.anisotropyMap.channel),clearcoatMapUv:_e&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ve&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ye&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:be&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:L&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:xe&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Se&&m(i.sheenRoughnessMap.channel),specularMapUv:Ce&&m(i.specularMap.channel),specularColorMapUv:R&&m(i.specularColorMap.channel),specularIntensityMapUv:we&&m(i.specularIntensityMap.channel),transmissionMapUv:z&&m(i.transmissionMap.channel),thicknessMapUv:B&&m(i.thicknessMap.channel),alphaMapUv:Ee&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(se||le),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ne||Ee),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&se===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ae,decodeVideoTexture:ne&&i.map.isVideoTexture===!0&&q.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:F&&i.emissiveMap.isVideoTexture===!0&&q.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:ke&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(ke&&i.extensions.multiDraw===!0||te)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return je.vertexUv1s=c.has(1),je.vertexUv2s=c.has(2),je.vertexUv3s=c.has(3),c.clear(),je}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=fc[t];n=ss.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Bu(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Ku(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function qu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Ju(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Yu(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||qu),r.length>1&&r.sort(t||Ju),i.length>1&&i.sort(t||Ju)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Xu(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Yu,e.set(t,[i])):n>=r.length?(i=new Yu,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Zu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new G,color:new J};break;case`SpotLight`:n={position:new G,direction:new G,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new G,color:new J,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new G,skyColor:new J,groundColor:new J};break;case`RectAreaLight`:n={color:new J,position:new G,halfWidth:new G,halfHeight:new G}}return e[t.id]=n,n}}}function Qu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qr};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qr};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qr,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var $u=0;function ed(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function td(e){let t=new Zu,n=Qu(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new G);let i=new G,a=new xi,o=new xi;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(ed);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=X.LTC_FLOAT_1,r.rectAreaLTC2=X.LTC_FLOAT_2):(r.rectAreaLTC1=X.LTC_HALF_1,r.rectAreaLTC2=X.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=$u++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function nd(e){let t=new td(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function rd(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new nd(e),t.set(n,[a])):r>=i.length?(a=new nd(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var id=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ad=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,od=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],sd=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],cd=new xi,ld=new G,ud=new G;function dd(e,t,n){let r=new Jo,i=new Qr,a=new Qr,o=new gi,s=new fs,c=new ps,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new us({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Qr},radius:{value:4}},vertexShader:id,fragmentShader:ad}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Za;m.setAttribute(`position`,new Ia(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Vo(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(U(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){U(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){U(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new vi(i.x,i.y,{format:mn,type:en,minFilter:Wt,magFilter:Wt,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Zo(i.x,i.y,$t),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=un,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=H,d.map.depthTexture.magFilter=H}else l.isPointLight?(d.map=new Hc(i.x),d.map.depthTexture=new Qo(i.x,Qt)):(d.map=new vi(i.x,i.y),d.map.depthTexture=new Zo(i.x,i.y,Qt)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=un,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=Wt,d.map.depthTexture.magFilter=Wt):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=H,d.map.depthTexture.magFilter=H);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),ld.setFromMatrixPosition(l.matrixWorld),e.position.copy(ld),ud.copy(e.position),ud.add(od[t]),e.up.copy(sd[t]),e.lookAt(ud),e.updateMatrixWorld(),n.makeTranslation(-ld.x,-ld.y,-ld.z),cd.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(cd,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new vi(i.x,i.y,{format:mn,type:en}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function fd(e,t){function n(){let t=!1,n=new gi,r=null,i=new gi(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?I(e.DEPTH_TEST):ce(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=Cr[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?I(e.STENCIL_TEST):ce(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),M=te>=1);let N=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new gi().fromArray(ie),se=new gi().fromArray(ae);function P(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let F={};F[e.TEXTURE_2D]=P(e.TEXTURE_2D,e.TEXTURE_2D,1),F[e.TEXTURE_CUBE_MAP]=P(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),F[e.TEXTURE_2D_ARRAY]=P(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),F[e.TEXTURE_3D]=P(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),I(e.DEPTH_TEST),o.setFunc(3),ge(!1),_e(1),I(e.CULL_FACE),me(0);function I(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ce(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function le(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function ue(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function de(t){return h!==t&&(e.useProgram(t),h=t,!0)}let fe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};fe[103]=e.MIN,fe[104]=e.MAX;let pe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function me(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(ce(e.BLEND),g=!1);return}if(g===!1&&(I(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:W(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:W(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:W(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:W(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(fe[n],fe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(pe[r],pe[i],pe[o],pe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function he(t,n){t.side===2?ce(e.CULL_FACE):I(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ge(r),t.blending===1&&t.transparent===!1?me(0):me(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ye(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?I(e.SAMPLE_ALPHA_TO_COVERAGE):ce(e.SAMPLE_ALPHA_TO_COVERAGE)}function ge(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function _e(t){t===0?ce(e.CULL_FACE):(I(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function ve(t){t!==k&&(M&&e.lineWidth(t),k=t)}function ye(t,n,r){t?(I(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):ce(e.POLYGON_OFFSET_FILL)}function be(t){t?I(e.SCISSOR_TEST):ce(e.SCISSOR_TEST)}function L(t){t===void 0&&(t=e.TEXTURE0+ee-1),N!==t&&(e.activeTexture(t),N=t)}function xe(t,n,r){r===void 0&&(r=N===null?e.TEXTURE0+ee-1:N);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(N!==r&&(e.activeTexture(r),N=r),e.bindTexture(t,n||F[t]),i.type=t,i.texture=n)}function Se(){let t=re[N];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Ce(){try{e.compressedTexImage2D(...arguments)}catch(e){W(`WebGLState:`,e)}}function R(){try{e.compressedTexImage3D(...arguments)}catch(e){W(`WebGLState:`,e)}}function we(){try{e.texSubImage2D(...arguments)}catch(e){W(`WebGLState:`,e)}}function z(){try{e.texSubImage3D(...arguments)}catch(e){W(`WebGLState:`,e)}}function B(){try{e.compressedTexSubImage2D(...arguments)}catch(e){W(`WebGLState:`,e)}}function Te(){try{e.compressedTexSubImage3D(...arguments)}catch(e){W(`WebGLState:`,e)}}function Ee(){try{e.texStorage2D(...arguments)}catch(e){W(`WebGLState:`,e)}}function De(){try{e.texStorage3D(...arguments)}catch(e){W(`WebGLState:`,e)}}function Oe(){try{e.texImage2D(...arguments)}catch(e){W(`WebGLState:`,e)}}function ke(){try{e.texImage3D(...arguments)}catch(e){W(`WebGLState:`,e)}}function Ae(t){return d[t]===void 0?e.getParameter(t):d[t]}function je(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Me(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Ne(t){se.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),se.copy(t))}function Pe(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Fe(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Ie(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},N=null,re={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,oe.set(0,0,e.canvas.width,e.canvas.height),se.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:I,disable:ce,bindFramebuffer:le,drawBuffers:ue,useProgram:de,setBlending:me,setMaterial:he,setFlipSided:ge,setCullFace:_e,setLineWidth:ve,setPolygonOffset:ye,setScissorTest:be,activeTexture:L,bindTexture:xe,unbindTexture:Se,compressedTexImage2D:Ce,compressedTexImage3D:R,texImage2D:Oe,texImage3D:ke,pixelStorei:je,getParameter:Ae,updateUBOMapping:Pe,uniformBlockBinding:Fe,texStorage2D:Ee,texStorage3D:De,texSubImage2D:we,texSubImage3D:z,compressedTexSubImage2D:B,compressedTexSubImage3D:Te,scissor:Me,viewport:Ne,reset:Ie}}function pd(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Qr,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):gr(`canvas`)}function g(e,t,n){let r=1,i=Ce(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),U(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&U(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];U(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||U(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?lr:q.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,U(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function ee(){let e=O;return e>=i.maxTextures&&U(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function M(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function te(t,i){let a=r.get(t);if(t.isVideoTexture&&xe(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)U(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)U(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ce(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ne(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){ce(a,t,i);return}t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function N(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){ce(a,t,i);return}n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function re(t,i){let a=r.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version){le(a,t,i);return}n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let ie={[zt]:e.REPEAT,[Bt]:e.CLAMP_TO_EDGE,[Vt]:e.MIRRORED_REPEAT},ae={[H]:e.NEAREST,[Ht]:e.NEAREST_MIPMAP_NEAREST,[Ut]:e.NEAREST_MIPMAP_LINEAR,[Wt]:e.LINEAR,[Gt]:e.LINEAR_MIPMAP_NEAREST,[Kt]:e.LINEAR_MIPMAP_LINEAR},oe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function se(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&U(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,ie[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,ie[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,ie[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ae[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ae[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,oe[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function P(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=M(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function F(e,t,n){return Math.floor(Math.floor(e/n)/t)}function I(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=F(n.start,r.width,4),c=F(t.start,r.width,4);n.start<=i+1&&a===c&&F(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function ce(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=P(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=Se(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);se(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===dn,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&I(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=cc(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else U(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?U(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=cc(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=Ce(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=Ce(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function le(t,o,s){if(o.image.length!==6)return;let c=P(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Se(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);se(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?U(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=Ce(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ue(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),L(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,be(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function de(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;L(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,be(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,be(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);L(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,be(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,be(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function fe(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),se(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else te(i.depthTexture,0);let u=l.__webglTexture,d=be(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)L(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)L(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function pe(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)fe(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?fe(i.__webglFramebuffer[0],t,0):fe(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),de(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),de(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function me(t,n,i){let a=r.get(t);n!==void 0&&ue(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&pe(t)}function he(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&L(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=be(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),de(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),se(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)ue(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else ue(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),se(c,a),ue(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),se(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)ue(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else ue(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&pe(t)}function ge(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let _e=[],ve=[];function ye(t){if(t.samples>0){if(L(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(_e.length=0,ve.length=0,_e.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(_e.push(l),ve.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,ve)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,_e))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function be(e){return Math.min(i.maxSamples,e.samples)}function L(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function xe(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Se(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(q.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&U(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):W(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ce(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ee,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=te,this.setTexture2DArray=ne,this.setTexture3D=N,this.setTextureCube=re,this.rebindTextures=me,this.setupRenderTarget=he,this.updateRenderTargetMipmap=ge,this.updateMultisampleRenderTarget=ye,this.setupDepthRenderbuffer=pe,this.setupFrameBufferTexture=ue,this.useMultisampledRTT=L,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function md(e,t){function n(n,r=``){let i,a=q.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var hd=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,gd=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,_d=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new $o(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new us({vertexShader:hd,fragmentShader:gd,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Vo(new ts(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},vd=class extends wr{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new _d,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new Qr,C=null,w=null,T=new Bs;T.viewport=new gi;let E=new Bs;E.viewport=new gi;let D=[T,E],O=new Gs,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Zi,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Zi,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Zi,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,se.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&U(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&U(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?dn:un,a=_.stencil?rn:Qt);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new vi(d.textureWidth,d.textureHeight,{format:ln,type:qt,depthTexture:new Zo(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new vi(f.framebufferWidth,f.framebufferHeight,{format:ln,type:qt,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),se.setContext(r),se.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let te=new G,ne=new G;function N(e,t,n){te.setFromMatrixPosition(t.matrixWorld),ne.setFromMatrixPosition(n.matrixWorld);let r=te.distanceTo(ne),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function re(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;re(O,i);for(let e=0;e<a.length;e++)re(a[e],i);a.length===2?N(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),ie(e,O,i)};function ie(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Or*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ae=null;function oe(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Bs,o.layers.enable(n),o.viewport=new gi,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new $o,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ae&&ae(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let se=new uc;se.setAnimationLoop(oe),this.setAnimationLoop=function(e){ae=e},this.dispose=function(){}}},yd=new xi,bd=new K;bd.set(-1,0,0,0,1,0,0,0,1);function xd(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,os(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(yd.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(bd),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Sd(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return W(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?U(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):U(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var Cd=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),wd=null;function Td(){return wd===null&&(wd=new Wo(Cd,16,16,mn,en),wd.name=`DFG_LUT`,wd.minFilter=Wt,wd.magFilter=Wt,wd.wrapS=Bt,wd.wrapT=Bt,wd.generateMipmaps=!1,wd.needsUpdate=!0),wd}var Ed=class{constructor(e={}){let{canvas:t=_r(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=qt}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([gn,hn,pn]),g=new Set([qt,Qt,Xt,rn,tn,nn]),_=new Uint32Array(4),v=new Int32Array(4),y=new G,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=sr;let j=0,ee=0,M=null,te=-1,ne=null,N=new gi,re=new gi,ie=null,ae=new J(0),oe=0,se=t.width,P=t.height,F=1,I=null,ce=null,le=new gi(0,0,se,P),ue=new gi(0,0,se,P),de=!1,fe=new Jo,pe=!1,me=!1,he=new xi,ge=new G,_e=new gi,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ye=!1;function be(){return M===null?F:1}let L=n;function xe(e,n){return t.getContext(e,n)}let Se,Ce,R,we,z,B,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,V,Be;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,Ue,!1),t.addEventListener(`webglcontextrestored`,We,!1),t.addEventListener(`webglcontextcreationerror`,Ge,!1),L===null){let t=`webgl2`;if(L=xe(t,e),L===null)throw xe(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Ve()}catch(e){throw t.removeEventListener(`webglcontextlost`,Ue,!1),t.removeEventListener(`webglcontextrestored`,We,!1),t.removeEventListener(`webglcontextcreationerror`,Ge,!1),W(`WebGLRenderer: `+e.message),e}function Ve(){Se=new Wc(L),Se.init(),ze=new md(L,Se),Ce=new yc(L,Se,e,ze),R=new fd(L,Se),Ce.reversedDepthBuffer&&d&&R.buffers.depth.setReversed(!0),O=L.createFramebuffer(),k=L.createFramebuffer(),A=L.createFramebuffer(),we=new qc(L),z=new Ku,B=new pd(L,Se,R,z,Ce,ze,we),Te=new Uc(T),Ee=new dc(L),V=new _c(L,Ee),De=new Gc(L,Ee,we,V),Oe=new Yc(L,De,Ee,V,we),Ie=new Jc(L,Ce,B),Ne=new bc(z),ke=new Gu(T,Te,Se,Ce,V,Ne),Ae=new xd(T,z),je=new Xu,Me=new rd(Se),Fe=new gc(T,Te,R,Oe,p,s),Pe=new dd(T,Oe,Ce),Be=new Sd(L,we,Ce,R),Le=new vc(L,Se,we),Re=new Kc(L,Se,we),we.programs=ke.programs,T.capabilities=Ce,T.extensions=Se,T.properties=z,T.renderLists=je,T.shadowMap=Pe,T.state=R,T.info=we}m!==1009&&(w=new Zc(m,t.width,t.height,o,r,i));let He=new vd(T,L);this.xr=He,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let e=Se.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Se.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return F},this.setPixelRatio=function(e){e!==void 0&&(F=e,this.setSize(se,P,!1))},this.getSize=function(e){return e.set(se,P)},this.setSize=function(e,n,r=!0){if(He.isPresenting){U(`WebGLRenderer: Can't change size while VR device is presenting.`);return}se=e,P=n,t.width=Math.floor(e*F),t.height=Math.floor(n*F),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(se*F,P*F).floor()},this.setDrawingBufferSize=function(e,n,r){se=e,P=n,F=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009){W(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){U(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(N)},this.getViewport=function(e){return e.copy(le)},this.setViewport=function(e,t,n,r){e.isVector4?le.set(e.x,e.y,e.z,e.w):le.set(e,t,n,r),R.viewport(N.copy(le).multiplyScalar(F).round())},this.getScissor=function(e){return e.copy(ue)},this.setScissor=function(e,t,n,r){e.isVector4?ue.set(e.x,e.y,e.z,e.w):ue.set(e,t,n,r),R.scissor(re.copy(ue).multiplyScalar(F).round())},this.getScissorTest=function(){return de},this.setScissorTest=function(e){R.setScissorTest(de=e)},this.setOpaqueSort=function(e){I=e},this.setTransparentSort=function(e){ce=e},this.getClearColor=function(e){return e.copy(Fe.getClearColor())},this.setClearColor=function(){Fe.setClearColor(...arguments)},this.getClearAlpha=function(){return Fe.getClearAlpha()},this.setClearAlpha=function(){Fe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Fe.getClearColor(),r=Fe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,L.clearBufferuiv(L.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,L.clearBufferiv(L.COLOR,0,v))}else r|=L.COLOR_BUFFER_BIT}t&&(r|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&L.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Ue,!1),t.removeEventListener(`webglcontextrestored`,We,!1),t.removeEventListener(`webglcontextcreationerror`,Ge,!1),Fe.dispose(),je.dispose(),Me.dispose(),z.dispose(),Te.dispose(),Oe.dispose(),V.dispose(),Be.dispose(),ke.dispose(),He.dispose(),He.removeEventListener(`sessionstart`,Qe),He.removeEventListener(`sessionend`,$e),et.stop()};function Ue(e){e.preventDefault(),yr(`WebGLRenderer: Context Lost.`),E=!0}function We(){yr(`WebGLRenderer: Context Restored.`),E=!1;let e=we.autoReset,t=Pe.enabled,n=Pe.autoUpdate,r=Pe.needsUpdate,i=Pe.type;Ve(),we.autoReset=e,Pe.enabled=t,Pe.autoUpdate=n,Pe.needsUpdate=r,Pe.type=i}function Ge(e){W(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function Ke(e){let t=e.target;t.removeEventListener(`dispose`,Ke),qe(t)}function qe(e){Je(e),z.remove(e)}function Je(e){let t=z.get(e).programs;t!==void 0&&(t.forEach(function(e){ke.releaseProgram(e)}),e.isShaderMaterial&&ke.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ve);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=ut(e,t,n,r,i);R.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=De.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;V.setup(i,r,s,n,c);let h,g=Le;if(c!==null&&(h=Ee.get(c),g=Re,g.setIndex(h)),i.isMesh)r.wireframe===!0?(R.setLineWidth(r.wireframeLinewidth*be()),g.setMode(L.LINES)):g.setMode(L.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),R.setLineWidth(e*be()),i.isLineSegments?g.setMode(L.LINES):i.isLineLoop?g.setMode(L.LINE_LOOP):g.setMode(L.LINE_STRIP)}else i.isPoints?g.setMode(L.POINTS):i.isSprite&&g.setMode(L.TRIANGLES);if(i.isBatchedMesh){if(Se.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ee.get(c).bytesPerElement:1,o=z.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(L,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function Ye(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),pe===!0&&Ne.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,ot(e,t,r),e.side=0,e.needsUpdate=!0,ot(e,t,r),e.side=2):ot(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Me.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),me=this.localClippingEnabled,pe=Ne.init(this.clippingPlanes,me),pe===!0&&Ne.setGlobalState(this.clippingPlanes,t),D!==null&&Pe.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];Ye(o,n,t,e),r.add(o)}else Ye(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=z.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Se.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Xe=null;function Ze(e){Xe&&Xe(e)}function Qe(){et.stop()}function $e(){et.start()}let et=new uc;et.setAnimationLoop(Ze),typeof self<`u`&&et.setContext(self),this.setAnimationLoop=function(e){Xe=e,He.setAnimationLoop(e),e===null?et.stop():et.start()},He.addEventListener(`sessionstart`,Qe),He.addEventListener(`sessionend`,$e),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){W(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=He.enabled===!0&&He.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(He.cameraAutoUpdate===!0&&He.updateCamera(t),t=He.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Me.get(e,C.length),x.init(t),x.state.textureUnits=B.getTextureUnits(),C.push(x),he.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),fe.setFromProjectionMatrix(he,pr,t.reversedDepth),me=this.localClippingEnabled,pe=Ne.init(this.clippingPlanes,me),b=je.get(e,S.length),b.init(),S.push(b),He.enabled===!0&&He.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&tt(e,t,-1/0,T.sortObjects)}tt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(I,ce),ye=He.enabled===!1||He.isPresenting===!1||He.hasDepthSensing()===!1,ye&&Fe.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),pe===!0&&Ne.beginShadows();let i=x.state.shadowsArray;if(Pe.render(i,e,t),pe===!0&&Ne.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];rt(n,r,e,a)}ye&&Fe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];nt(b,e,n,n.viewport)}}else r.length>0&&rt(n,r,e,t),ye&&Fe.render(e),nt(b,e,t)}M!==null&&ee===0&&(B.updateMultisampleRenderTarget(M),B.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),V.resetDefaultState(),te=-1,ne=null,C.pop(),C.length>0?(x=C[C.length-1],B.setTextureUnits(x.state.textureUnits),pe===!0&&Ne.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function tt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(fe)){r&&_e.setFromMatrixPosition(e.matrixWorld).applyMatrix4(he);let i=Oe.update(e),a=e.material;a.visible&&b.push(e,i,a,n,_e.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(fe))){let i=Oe.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),_e.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),_e.copy(e.boundingSphere.center)),_e.applyMatrix4(e.matrixWorld).applyMatrix4(he)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,_e.z,s,t)}}else a.visible&&b.push(e,i,a,n,_e.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)tt(i[e],t,n,r)}function nt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),pe===!0&&Ne.setGlobalState(T.clippingPlanes,n),r&&R.viewport(N.copy(r)),i.length>0&&it(i,t,n),a.length>0&&it(a,t,n),o.length>0&&it(o,t,n),R.buffers.depth.setTest(!0),R.buffers.depth.setMask(!0),R.buffers.color.setMask(!0),R.setPolygonOffset(!1)}function rt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Se.has(`EXT_color_buffer_half_float`)||Se.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new vi(1,1,{generateMipmaps:!0,type:e?en:qt,minFilter:Kt,samples:Math.max(4,Ce.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:q.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||N;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ae),oe=T.getClearAlpha(),oe<1&&T.setClearColor(16777215,.5),T.clear(),ye&&Fe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),pe===!0&&Ne.setGlobalState(T.clippingPlanes,r),it(e,n,r),B.updateMultisampleRenderTarget(a),B.updateRenderTargetMipmap(a),Se.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,at(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(B.updateMultisampleRenderTarget(a),B.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ae,oe),d!==void 0&&(r.viewport=d),T.toneMapping=u}function it(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&at(o,t,n,s,l,c)}}function at(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function ot(e,t,n){t.isScene!==!0&&(t=ve);let r=z.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=ke.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=ke.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Te.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,Ke),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ct(e,s),d}else s.uniforms=ke.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=ke.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ne.uniform),ct(e,s),r.needsLights=ft(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function st(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=iu.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ct(e,t){let n=z.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function lt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function ut(e,t,n,r,i){t.isScene!==!0&&(t=ve),B.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:q.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Te.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=z.get(r),y=x.state.lights;if(pe===!0&&(me===!0||e!==ne)){let t=e===ne&&r.id===te;Ne.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ne.numPlanes||v.numIntersection!==Ne.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=ot(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(R.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==te&&(te=r.id,w=!0),v.needsLights){let e=lt(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||ne!==e){R.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(L,`projectionMatrix`,e.projectionMatrix),O.setValue(L,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(L,ge.setFromMatrixPosition(e.matrixWorld)),Ce.logarithmicDepthBuffer&&O.setValue(L,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(L,`isOrthographic`,e.isOrthographicCamera===!0),ne!==e&&(ne=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(L,`sunShadowMap`,y.state.sunShadowMap,B),y.state.directionalShadowMap.length>0&&O.setValue(L,`directionalShadowMap`,y.state.directionalShadowMap,B),y.state.spotShadowMap.length>0&&O.setValue(L,`spotShadowMap`,y.state.spotShadowMap,B),y.state.pointShadowMap.length>0&&O.setValue(L,`pointShadowMap`,y.state.pointShadowMap,B)),i.isSkinnedMesh){O.setOptional(L,i,`bindMatrix`),O.setOptional(L,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(L,`boneTexture`,e.boneTexture,B))}i.isBatchedMesh&&(O.setOptional(L,i,`batchingTexture`),O.setValue(L,`batchingTexture`,i._matricesTexture,B),O.setOptional(L,i,`batchingIdTexture`),O.setValue(L,`batchingIdTexture`,i._indirectTexture,B),O.setOptional(L,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(L,`batchingColorTexture`,i._colorsTexture,B));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Ie.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(L,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=Td()),w){if(O.setValue(L,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&dt(k,E),a&&r.fog===!0&&Ae.refreshFogUniforms(k,a),Ae.refreshMaterialUniforms(k,r,F,P,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}iu.upload(L,st(v),k,B)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(iu.upload(L,st(v),k,B),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(L,`center`,i.center),O.setValue(L,`modelViewMatrix`,i.modelViewMatrix),O.setValue(L,`normalMatrix`,i.normalMatrix),O.setValue(L,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Be.update(n,S),Be.bind(n,S)}}return S}function dt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function ft(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=z.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),z.get(e.texture).__webglTexture=t,z.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=z.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=z.get(e);if(o.__useDefaultFramebuffer!==void 0){R.bindFramebuffer(L.FRAMEBUFFER,o.__webglFramebuffer),N.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest,R.viewport(N),R.scissor(re),R.setScissorTest(ie),te=-1;return}if(o.__webglFramebuffer===void 0)B.setupRenderTarget(e);else if(o.__hasExternalTextures)B.rebindTextures(e,z.get(e.texture).__webglTexture,z.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&z.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);B.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=z.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&B.useMultisampledRTT(e)===!1?z.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,N.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest}else N.copy(le).multiplyScalar(F).floor(),re.copy(ue).multiplyScalar(F).floor(),ie=de;if(n!==0&&(r=O),R.bindFramebuffer(L.FRAMEBUFFER,r)&&R.drawBuffers(e,r),R.viewport(N),R.scissor(re),R.setScissorTest(ie),i){let r=z.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=z.get(e.textures[t]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=z.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,t.__webglTexture,n)}te=-1};function pt(e){let t=z.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Ce.textureFormatReadable(e.format),t.__typeReadable=Ce.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){W(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=z.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){R.bindFramebuffer(L.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let u=pt(o);if(u.__formatReadable===!1){W(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){W(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&L.readPixels(t,n,r,i,ze.convert(c),ze.convert(l),a)}finally{let e=M===null?null:z.get(M).__webglFramebuffer;R.bindFramebuffer(L.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=z.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){R.bindFramebuffer(L.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let d=pt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.bufferData(L.PIXEL_PACK_BUFFER,a.byteLength,L.STREAM_READ),L.readPixels(t,n,r,i,ze.convert(l),ze.convert(u),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);let p=M===null?null:z.get(M).__webglFramebuffer;R.bindFramebuffer(L.FRAMEBUFFER,p);let m=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await Sr(L,m,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,a),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(f),L.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;B.setTexture2D(e,0),L.copyTexSubImage2D(L.TEXTURE_2D,n,0,0,o,s,i,a),R.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=ze.convert(t.format),_=ze.convert(t.type),v;t.isData3DTexture?(B.setTexture3D(t,0),v=L.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(B.setTexture2DArray(t,0),v=L.TEXTURE_2D_ARRAY):(B.setTexture2D(t,0),v=L.TEXTURE_2D),R.activeTexture(L.TEXTURE0),R.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,t.flipY),R.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),R.pixelStorei(L.UNPACK_ALIGNMENT,t.unpackAlignment);let y=R.getParameter(L.UNPACK_ROW_LENGTH),b=R.getParameter(L.UNPACK_IMAGE_HEIGHT),x=R.getParameter(L.UNPACK_SKIP_PIXELS),S=R.getParameter(L.UNPACK_SKIP_ROWS),C=R.getParameter(L.UNPACK_SKIP_IMAGES);R.pixelStorei(L.UNPACK_ROW_LENGTH,h.width),R.pixelStorei(L.UNPACK_IMAGE_HEIGHT,h.height),R.pixelStorei(L.UNPACK_SKIP_PIXELS,l),R.pixelStorei(L.UNPACK_SKIP_ROWS,u),R.pixelStorei(L.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=z.get(e),r=z.get(t),h=z.get(n.__renderTarget),g=z.get(r.__renderTarget);R.bindFramebuffer(L.READ_FRAMEBUFFER,h.__webglFramebuffer),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,z.get(e).__webglTexture,i,d+n),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,z.get(t).__webglTexture,a,m+n)),L.blitFramebuffer(l,u,o,s,f,p,o,s,L.DEPTH_BUFFER_BIT,L.NEAREST);R.bindFramebuffer(L.READ_FRAMEBUFFER,null),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||z.has(e)){let n=z.get(e),r=z.get(t);R.bindFramebuffer(L.READ_FRAMEBUFFER,k),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,n.__webglTexture,i),T?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,r.__webglTexture,a),i===0?T?L.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):L.copyTexSubImage2D(v,a,f,p,l,u,o,s):L.blitFramebuffer(l,u,o,s,f,p,o,s,L.COLOR_BUFFER_BIT,L.NEAREST);R.bindFramebuffer(L.READ_FRAMEBUFFER,null),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?L.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h);R.pixelStorei(L.UNPACK_ROW_LENGTH,y),R.pixelStorei(L.UNPACK_IMAGE_HEIGHT,b),R.pixelStorei(L.UNPACK_SKIP_PIXELS,x),R.pixelStorei(L.UNPACK_SKIP_ROWS,S),R.pixelStorei(L.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&L.generateMipmap(v),R.unbindTexture()},this.initRenderTarget=function(e){z.get(e).__webglFramebuffer===void 0&&B.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?B.setTextureCube(e,0):e.isData3DTexture?B.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?B.setTexture2DArray(e,0):B.setTexture2D(e,0),R.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,R.reset(),V.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return pr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=q._getDrawingBufferColorSpace(e),t.unpackColorSpace=q._getUnpackColorSpace()}};function Dd(e,t){let n=document.createElement(`canvas`);return n.width=e,n.height=t,[n,n.getContext(`2d`)]}function Od(e,{repeat:t=!1}={}){let n=new Xo(e);return n.magFilter=H,n.minFilter=H,n.generateMipmaps=!1,n.colorSpace=sr,t&&(n.wrapS=n.wrapT=zt),n}function kd(e){let t=e>>>0;return()=>(t=t*1664525+1013904223>>>0)/4294967296}function Z(e,t,n,r,i=1,a=1){e.fillStyle=t,e.fillRect(n,r,i,a)}function Ad(e,t){let n=Array(e*t).fill(null),r=Array(e*t).fill(null);return{W:e,H:t,col:n,kind:r,get:(r,i)=>r<0||i<0||r>=e||i>=t?null:n[i*e+r],kindAt:(n,i)=>n<0||i<0||n>=e||i>=t?null:r[i*e+n],set(i,a,o,s=`x`){i<0||a<0||i>=e||a>=t||(n[a*e+i]=o,r[a*e+i]=s)},toCanvas(){let[r,i]=Dd(e,t);for(let r=0;r<t;r++)for(let t=0;t<e;t++)n[r*e+t]&&Z(i,n[r*e+t],t,r);return r}}}function jd(e,t){let n=[];for(let r=0;r<e.H;r++)for(let i=0;i<e.W;i++)if(!e.get(i,r))for(let[a,o]of[[0,1],[0,-1],[1,0],[-1,0]]){let s=e.kindAt(i+a,r+o);if(s){n.push([i,r,t(s)]);break}}for(let[t,r,i]of n)e.set(t,r,i,`outline`)}var Md=[{outline:`#173a1c`,dark:`#24592b`,mid:`#347a34`,light:`#4f9e3f`,hi:`#79c457`,top:`#a6e070`},{outline:`#1d3a15`,dark:`#2f6127`,mid:`#468a2f`,light:`#67ad3d`,hi:`#93cc55`,top:`#c4e67e`},{outline:`#12301f`,dark:`#1e4d30`,mid:`#2c6c3e`,light:`#3f8a4d`,hi:`#5fab60`,top:`#8acb7a`}],Nd={outline:`#2a1508`,dark:`#4e2c12`,mid:`#6e4220`,light:`#8f5c2e`,hi:`#a8743c`},Pd={outline:`#2a2620`,dark:`#2f2a24`,mid:`#d8d0c0`,light:`#ece6d8`,hi:`#ffffff`},Fd={outline:`#2a1205`,dark:`#4e220e`,mid:`#7a3a1c`,light:`#9a4f2a`,hi:`#b8643a`},Id=[{outline:`#2a3a12`,dark:`#5a7a22`,mid:`#7fa832`,light:`#a8cf52`,hi:`#c8e270`,top:`#e6f49a`},{outline:`#3a3010`,dark:`#7a7a1e`,mid:`#a0a02c`,light:`#c4c04a`,hi:`#dcd868`,top:`#f2ee9a`}],Ld=[{outline:`#0c2416`,dark:`#14402a`,mid:`#1f5a38`,light:`#2e7a48`,hi:`#45995c`,top:`#6abf7a`},{outline:`#0c2020`,dark:`#163a3a`,mid:`#215454`,light:`#2e7068`,hi:`#448c80`,top:`#62ad9c`}],Rd=e=>e===`birch`?Pd:e===`pine`?Fd:Nd;function zd(e,t,n,r){let i=Array(e.W*e.H).fill(-1);t.sort((e,t)=>e[1]-t[1]),t.forEach(([t,a,o],s)=>{let c=r()*6.28,l=r()*6.28;for(let u=Math.floor(a-o-2);u<=a+o+2;u++)for(let d=Math.floor(t-o-2);d<=t+o+2;d++){let f=d+.5-t,p=u+.5-a,m=Math.sqrt(f*f+p*p),h=Math.atan2(p,f),g=o*(1+.11*Math.sin(h*5+c)+.06*Math.sin(h*9+l));if(m>g)continue;let _=(-f*.45-p*.9)/g;_+=(d+u)%2?.05:-.05,r()<.1&&(_+=r()<.5?.25:-.25);let v=_>.62?n.top:_>.35?n.hi:_>.05?n.light:_>-.38?n.mid:n.dark;e.set(d,u,v,`leaf`),d>=0&&u>=0&&d<e.W&&u<e.H&&(i[u*e.W+d]=s)}});let a=[];for(let t=0;t<e.H;t++)for(let n=0;n<e.W;n++){let r=i[t*e.W+n];if(!(r<0))for(let[o,s]of[[0,1],[1,0],[-1,0],[0,-1]]){let c=n+o,l=t+s;if(!(c<0||l<0||c>=e.W||l>=e.H)&&i[l*e.W+c]>r){a.push([n,t]);break}}}for(let[t,r]of a)e.set(t,r,e.get(t,r)===n.dark?n.outline:n.dark,`leaf`)}function Bd(e,t,n,r,i,a,o=Rd(`oak`)){for(let s=n;s<=r;s++){let n=s>r-4?(s-(r-4))*.7:0,c=i/2+n,l=Math.round(t-c),u=Math.round(t+c)-1;for(let t=l;t<=u;t++){let n=(t-l)/Math.max(1,u-l),r=n<.18?o.hi:n<.4?o.light:n<.75?o.mid:o.dark;a()<.16&&(r=o.dark),e.set(t,s,r,`bark`)}}for(let s=0;s<i;s++){let s=Math.round(t-i/2+1+a()*(i-2)),c=n+Math.floor(a()*(r-n-4));for(let t=0;t<3+a()*4;t++)e.set(s,c+t,o.dark,`bark`)}}function Vd(e,t,n,r,i,a=Rd(`oak`)){let o=Math.max(Math.abs(r-t),Math.abs(i-n));for(let s=0;s<=o;s++){let c=Math.round(t+(r-t)*s/o),l=Math.round(n+(i-n)*s/o);e.set(c,l,a.mid,`bark`),e.set(c,l+1,a.dark,`bark`)}}function Hd(e,t,n,r){for(let[i,a,o]of t)for(let t=Math.floor(i-o);t<=i;t++){let s=(t-(i-o))/o,c=Math.max(.6,a*s);for(let a=Math.floor(24-c);a<=Math.ceil(24+c);a++){let o=(a+.5-24)/Math.max(1,c);if(Math.abs(o)>1)continue;let l=-o*.8+(1-s)*.6+(r()-.5)*.35;t>=i-1&&(l-=.6);let u=l>.75?n.top:l>.35?n.hi:l>-.05?n.light:l>-.5?n.mid:n.dark;e.set(a,t,u,`leaf`)}}}function Ud(e,t=0,n=`oak`){let r=Ad(48,64),i=kd(100+t*7919+e.length*31+n.length*977),a=Rd(n),o=()=>(i()-.5)*3;if(n===`pine`&&e!==`stump`){let n=Ld[t%Ld.length];if(e===`mature`)Bd(r,24,46,62,5,i,a),Hd(r,[[52,15,12],[43,13,11],[34,11,10],[25,9,9],[16,6,8],[9,3.5,6]],n,i);else if(e===`young`)Bd(r,24,52,62,3,i,a),Hd(r,[[55,9,8],[48,7,7],[41,5,6],[35,3,5]],n,i);else{for(let e=56;e<=62;e++)r.set(24,e,a.light,`bark`);Hd(r,[[57,4.5,5],[52,3,4],[48,1.5,3]],n,i)}return jd(r,e=>e===`leaf`?n.outline:a.outline),r.toCanvas()}if(n===`birch`&&e!==`stump`){let n=Id[t%Id.length];if(e===`mature`)Bd(r,24,26,62,5,i,a),Vd(r,23,34,16,26,a),Vd(r,25,30,32,22,a),zd(r,[[24+o(),17+o(),9],[15+o(),24+o(),7],[33+o(),23+o(),7],[19+o(),11+o(),6],[29+o(),10+o(),6],[24,28+o(),5.5],[24,6.5,4.5]],n,i);else if(e===`young`)Bd(r,24,40,62,3,i,a),zd(r,[[24+o(),34,6.5],[18,39,4.5],[30,38,4.5],[24,28,4.5]],n,i);else{for(let e=50;e<=62;e++)r.set(24,e,a.light,`bark`),r.set(25,e,a.mid,`bark`);zd(r,[[20,52,3],[29,50,3],[24.5,46.5,3]],n,i)}return jd(r,e=>e===`leaf`?n.outline:a.outline),r.toCanvas()}let s=Md[t%Md.length];if(e===`mature`){Bd(r,24,32,62,7,i),Vd(r,23,40,14,29),Vd(r,25,38,35,27);let e=[[24+o(),21+o(),12.5],[13.5+o(),27+o(),8.5],[34.5+o(),27+o(),8.5],[17+o(),14.5+o(),8.5],[31+o(),13.5+o(),8.5],[24+o(),9.5,6],[19+o(),33+o(),7],[30+o(),34+o(),6.5]];if(t===2&&e.push([9,20,5.5],[39,19,5.5]),zd(r,e,s,i),t===1)for(let e=0;e<6;e++){let e=10+Math.floor(i()*28),t=10+Math.floor(i()*24);r.kindAt(e,t)===`leaf`&&r.kindAt(e+1,t+1)===`leaf`&&(r.set(e,t,`#d8402e`,`leaf`),r.set(e+1,t,`#d8402e`,`leaf`),r.set(e,t+1,`#a8261a`,`leaf`),r.set(e+1,t+1,`#a8261a`,`leaf`),r.set(e,t,`#ff9a7a`,`leaf`))}}else if(e===`young`)Bd(r,24,44,62,4,i),Vd(r,24,48,18,42),zd(r,[[24+o(),36,8],[17,42+o(),5.5],[31,42+o(),5.5],[24,30,5.5]],s,i);else if(e===`sapling`){for(let e=50;e<=62;e++)r.set(24,e,Nd.light,`bark`),r.set(25,e,Nd.dark,`bark`);zd(r,[[20,52,3.5],[29,50,3.5],[24.5,46.5,3.5]],s,i)}else{Bd(r,24,54,62,10,i,a);for(let e=51;e<=55;e++)for(let t=18;t<=29;t++){let n=(t+.5-24)/6,i=(e+.5-53.2)/2.4,o=Math.sqrt(n*n+i*i);if(o>1)continue;let s=Math.floor(o*4);r.set(t,e,o>.85?a.light:s%2?`#c4924f`:`#e2b878`,`bark`)}r.set(24,53,`#8a5a2b`,`bark`)}return jd(r,e=>e===`leaf`?s.outline:a.outline),r.toCanvas()}function Wd(e){let[t,n]=Dd(e.width,e.height);return n.drawImage(e,0,0),n.globalCompositeOperation=`source-in`,n.fillStyle=`#ffffff`,n.fillRect(0,0,t.width,t.height),t}function Gd(e){return Od(e)}function Kd(e=0){let t=Ad(22,16),n=kd(500+e*13),r=Md[e%Md.length];if(zd(t,[[11,9,6.5],[6,11,4.5],[16,11,4.5]],r,n),e===0)for(let[e,n]of[[8,8],[13,6],[15,10],[6,11]])t.kindAt(e,n)===`leaf`&&t.set(e,n,`#e84a7a`,`leaf`);return jd(t,()=>r.outline),t.toCanvas()}function qd(e=0){let t=Ad(14,10),n=kd(900+e*17),r=e?5:6,i=e?3.5:4;for(let e=0;e<10;e++)for(let a=0;a<14;a++){let o=(a+.5-7)/r,s=(e+.5-6)/i;if(o*o+s*s>1)continue;let c=-o*.5-s*.9+(n()-.5)*.3;t.set(a,e,c>.5?`#c8c6bc`:c>0?`#a19f96`:c>-.6?`#82807a`:`#66645f`,`rock`)}return jd(t,()=>`#34322e`),t.toCanvas()}function Jd(e=0){let[t,n]=Dd(9,7),r=[[`#3f8a2c`,`#6cbf48`],[`#4a9632`,`#8fd45e`],[`#2f7426`,`#5aa83c`]][e%3];return[[1,3],[3,1],[4,0],[5,2],[7,3]].forEach(([e,t],i)=>{for(let i=t;i<7;i++)Z(n,i<t+2?r[1]:r[0],e,i);i%2&&Z(n,r[0],e+1,5,1,2)}),t}function Yd(e){let[t,n]=Dd(7,8);return Z(n,`#3f8a2c`,3,4,1,4),Z(n,`#5aa83c`,4,5),Z(n,e,2,1,3,3),Z(n,e,3,0),Z(n,e,1,2),Z(n,e,5,2),Z(n,`#f6e05a`,3,2),t}function Xd(){let[e,t]=Dd(8,7);return Z(t,`#3a1508`,1,0,6,1),Z(t,`#3a1508`,0,1,8,3),Z(t,`#d8402e`,1,1,6,2),Z(t,`#a8261a`,1,3,6,1),Z(t,`#ffffff`,2,1),Z(t,`#ffffff`,5,2),Z(t,`#3a1508`,2,4,4,3),Z(t,`#efe0c0`,3,4,2,3),e}function Zd(e,t,n,r=0,i=0){let a=e*16,o=t*16,[s,c]=Dd(a,o),l=[[`#62b243`,`#5aaa3d`,`#68b848`],[`#58a53b`,`#519d36`,`#5eab40`]],u=[`#f4e04d`,`#ffffff`,`#f08fb0`,`#9ad0ff`];for(let n=0;n<t;n++)for(let t=0;t<e;t++){let e=t+r,a=n+i,o=kd(1234+(e+64)*7919+(a+64)*104729),s=l[((e+a)%2+2)%2],d=t*16,f=n*16;for(let e=0;e<16;e++)for(let t=0;t<16;t++)Z(c,s[Math.floor(o()*s.length)],d+t,f+e);for(let e=0;e<7;e++){let e=d+Math.floor(o()*16),t=f+Math.floor(o()*15);Z(c,`#3f8a2c`,e,t+1),Z(c,`#86cc5a`,e,t)}o()<.7&&Z(c,u[Math.floor(o()*u.length)],d+Math.floor(o()*16),f+Math.floor(o()*16))}c.fillStyle=`rgba(30, 80, 20, 0.28)`;for(let t=1;t<e/n;t++){let e=t*n*16;for(let t=0;t<o;t+=4)c.fillRect(e,t,1,2)}for(let e=1;e<t/n;e++){let t=e*n*16;for(let e=0;e<a;e+=4)c.fillRect(e,t,2,1)}return c.fillStyle=`#3c7a28`,c.fillRect(0,0,a,1),c.fillRect(0,o-1,a,1),c.fillRect(0,0,1,o),c.fillRect(a-1,0,1,o),c.fillStyle=`#7cc454`,c.fillRect(1,1,a-2,1),c.fillRect(1,1,1,o-2),Od(s)}function Qd(){let[e,t]=Dd(32,32),n=kd(77),r=[`#4a8f33`,`#45882f`,`#4f9637`,`#428430`];for(let e=0;e<32;e++)for(let i=0;i<32;i++)Z(t,r[Math.floor(n()*r.length)],i,e);for(let e=0;e<40;e++){let e=Math.floor(n()*32),r=Math.floor(n()*30);Z(t,`#356f25`,e,r+1,1,2),Z(t,`#6aaa45`,e,r)}return Od(e,{repeat:!0})}function $d(){let[e,t]=Dd(16,16),n=kd(57),r=[`#5a3518`,`#4e2e14`,`#63391b`,`#56321a`];for(let e=0;e<16;e++)for(let i=0;i<16;i++){let a=Math.hypot(i+.5-8,(e+.5-8)*1.08);if(!(a>7.6)){if(a>6.3){let n=Math.atan2(e-8,i-8),r=Math.floor((n+Math.PI)/(Math.PI*2)*18);if(r%6==5)continue;Z(t,r%2?`#b8ad98`:`#8f8676`,i,e)}else Z(t,r[Math.floor(n()*r.length)],i,e)}}for(let e=0;e<9;e++)Z(t,`#7a4f2a`,4+Math.floor(n()*8),4+Math.floor(n()*8));for(let[e,n]of[[4,4],[12,11]])Z(t,`#67ad3d`,e,n),Z(t,`#93cc55`,e,n-1);return e}function ef(){let[e,t]=Dd(16,16),n=kd(31),r=[`#4a2c16`,`#432713`,`#52321a`,`#3e2412`];for(let e=0;e<16;e++)for(let i=0;i<16;i++)Z(t,r[Math.floor(n()*r.length)],i,e);for(let e=3;e<16;e+=4)Z(t,`#2e1a0b`,1,e,14,1),Z(t,`#6b4423`,1,e-1,14,1);for(let e=0;e<10;e++)Z(t,`#7a5030`,1+Math.floor(n()*14),1+Math.floor(n()*14));for(let[e,n]of[[3,5],[10,9],[6,13],[12,4]])Z(t,`#67ad3d`,e,n),Z(t,`#93cc55`,e,n-1);return t.fillStyle=`#2a1508`,t.fillRect(0,0,16,1),t.fillRect(0,15,16,1),t.fillRect(0,0,1,16),t.fillRect(15,0,1,16),t.clearRect(0,0,1,1),t.clearRect(15,0,1,1),t.clearRect(0,15,1,1),t.clearRect(15,15,1,1),e}function tf(e,t=e){let n=e*16,r=t*16,[i,a]=Dd(n,r);a.fillStyle=`rgba(255, 255, 255, 0.55)`;for(let t=0;t<=e;t++){let e=Math.min(n-1,t*16);for(let t=0;t<r;t+=2)a.fillRect(e,t,1,1)}for(let e=0;e<=t;e++){let t=Math.min(r-1,e*16);for(let e=0;e<n;e+=2)a.fillRect(e,t,1,1)}return Od(i)}function nf(){let[e,t]=Dd(16,16);t.fillStyle=`rgba(255, 255, 255, 0.28)`,t.fillRect(1,1,14,14),t.fillStyle=`#ffffff`,t.fillRect(0,0,16,1),t.fillRect(0,15,16,1),t.fillRect(0,0,1,16),t.fillRect(15,0,1,16);for(let[e,n]of[[1,1],[11,1],[1,11],[11,11]])t.fillRect(e,n,4,1),t.fillRect(e,n,1,4);return Od(e)}function rf(e,t,n,r,i=3){let a=Math.max(0,Math.abs(e)-(n-i)),o=Math.max(0,Math.abs(t)-(r-i));return Math.cbrt(a**3+o**3)-i}function af(e,t,n,r,i,a=6){let o=Math.ceil((e+n)*2*a),s=Math.ceil((t+n)*2*a),[c,l]=Dd(o,s),u=l.createImageData(o,s),d=kd(99);for(let c=0;c<s;c++)for(let s=0;s<o;s++){let l=rf((s+.5)/a-(e+n),(c+.5)/a-(t+n),e,t)+(d()-.5)*.08,f=Math.min(1,Math.max(0,(l-r)/(i-r))),p=(c*o+s)*4;u.data[p]=u.data[p+1]=u.data[p+2]=255,u.data[p+3]=Math.round(f*f*(3-2*f)*255)}l.putImageData(u,0,0);let f=new Xo(c);return f.colorSpace=sr,f}function of(){let[e,t]=Dd(64,64),n=t.createRadialGradient(32,32,2,32,32,32);n.addColorStop(0,`rgba(255,255,255,0.9)`),n.addColorStop(.5,`rgba(255,255,255,0.35)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,64,64);let r=new Xo(e);return r.colorSpace=sr,r}function sf(){let[e,t]=Dd(32,32),n=t.createRadialGradient(16,16,1,16,16,16);n.addColorStop(0,`rgba(0,0,0,0.42)`),n.addColorStop(.7,`rgba(0,0,0,0.25)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,32,32);let r=new Xo(e);return r.colorSpace=sr,r}function cf(e){let[t,n]=Dd(24,20),r=`#3d2008`,i=`#8a5a2b`,a=`#b07a3c`,o=`#c9ccd2`,s=`#f0c84a`;return Z(n,r,2,10,20,9),Z(n,i,3,11,18,7),Z(n,a,3,11,18,1),Z(n,`#6b4220`,3,14,18,1),Z(n,`#6b4220`,3,17,18,1),Z(n,o,5,10,2,9),Z(n,o,17,10,2,9),Z(n,`#8d9099`,6,10,1,9),Z(n,`#8d9099`,18,10,1,9),e?(Z(n,r,3,0,18,5),Z(n,i,4,1,16,3),Z(n,a,4,1,16,1),Z(n,o,5,0,2,5),Z(n,o,17,0,2,5),Z(n,r,3,5,18,6),Z(n,`#2a1604`,4,6,16,4),Z(n,`#8a5a2b`,5,7,14,3),Z(n,`#d8aa6a`,6,7,2,2),Z(n,`#d8aa6a`,10,7,2,2),Z(n,`#d8aa6a`,14,7,2,2),Z(n,`#fff3b0`,8,6,6,1),Z(n,s,11,10,2,2)):(Z(n,r,2,4,20,7),Z(n,r,3,3,18,1),Z(n,a,3,4,18,6),Z(n,i,3,8,18,2),Z(n,`#cf9a55`,3,4,18,1),Z(n,o,5,3,2,8),Z(n,o,17,3,2,8),Z(n,r,10,8,4,5),Z(n,s,11,9,2,3),Z(n,`#fff3b0`,11,9)),Od(t)}function lf(){let[e,t]=Dd(16,10),n=`#2a1508`;return Z(t,n,1,1,12,8),Z(t,n,0,2,1,6),Z(t,`#8f5c2e`,1,2,11,6),Z(t,`#a8743c`,1,2,11,1),Z(t,`#6e4220`,1,6,11,1),Z(t,`#4e2c12`,1,7,11,1),Z(t,`#4e2c12`,4,4,3,1),Z(t,`#4e2c12`,8,3,2,1),Z(t,n,11,1,4,1),Z(t,n,11,8,4,1),Z(t,n,15,2,1,6),Z(t,`#e2b878`,11,2,4,6),Z(t,`#c4924f`,12,3,2,4),Z(t,`#e2b878`,12,4,2,2),Z(t,`#8a5a2b`,13,4),e}function uf(){let e=lf(),t=e.getContext(`2d`),n=t.getImageData(0,0,e.width,e.height),r=[[40,[74,44,4]],[80,[168,118,26]],[120,[217,168,42]],[170,[246,210,90]],[999,[255,243,176]]];for(let e=0;e<n.data.length;e+=4){if(!n.data[e+3])continue;let t=(n.data[e]+n.data[e+1]+n.data[e+2])/3,[,i]=r.find(([e])=>t<e);n.data[e]=i[0],n.data[e+1]=i[1],n.data[e+2]=i[2]}return t.putImageData(n,0,0),e}function df(){let[e,t]=Dd(14,12);return Z(t,`#2a1508`,2,8,10,4),Z(t,`#2a1508`,1,9,12,2),Z(t,`#7a4a22`,2,9,10,2),Z(t,`#9a6232`,3,9,4,1),Z(t,`#3a2010`,5,10,4,1),Z(t,`#5e3a18`,10,1,1,9),Z(t,`#2a1508`,11,1,3,4),Z(t,`#ffffff`,11,2,2,2),Z(t,`#67ad3d`,12,2,1,1),e}function ff(){let[e,t]=Dd(2,2);return Z(t,`#ffffff`,0,0,2,2),Od(e)}function pf(){let[e,t]=Dd(7,7);return Z(t,`#ffffff`,3,0,1,7),Z(t,`#ffffff`,0,3,7,1),Z(t,`#ffffff`,2,2,3,3),Od(e)}function mf(e,t){let[n,r]=Dd(7,5);return Z(r,`#2a1a10`,3,1,1,3),e?(Z(r,t,0,0,3,2),Z(r,t,4,0,3,2),Z(r,t,1,2,2,2),Z(r,t,4,2,2,2)):(Z(r,t,2,0,1,3),Z(r,t,4,0,1,3)),Od(n)}var hf=26,gf=[14,12],_f=[-Math.SQRT1_2,-Math.SQRT1_2],vf=[Math.SQRT1_2,-Math.SQRT1_2],yf=(e,t)=>[gf[0]+e*_f[0]+t*vf[0],gf[1]+e*_f[1]+t*vf[1]],bf={edge:`#f6fafd`,light:`#c9d1db`,mid:`#929ba7`,dark:`#626b77`,deep:`#454c56`,rivet:`#e8b850`,rivetDark:`#9a6a20`,woodLight:`#d6a062`,wood:`#a66c32`,woodDark:`#6e4522`,grip:`#a8321f`,gripDark:`#6b1c12`,pommel:`#4a2a12`,outline:`#1a1210`},xf=null;function Sf(){if(xf)return xf;let e=Ad(hf,hf),t=e=>-7.5+(e-5.5)**2/14;for(let n=0;n<hf;n++)for(let r=0;r<hf;r++){let i=r+.5-gf[0],a=n+.5-gf[1],o=i*_f[0]+a*_f[1],s=i*vf[0]+a*vf[1],c=Math.max(0,-s),l=8.5+c*.35,u=2.5-c*.45,d=s<=1.5&&o>=u&&o<=l&&s>=t(o),f=s>1.5&&s<=3.6&&o>=3.6&&o<=7.4,p=Math.abs(s)<=1.25&&o>=-11.5&&o<=8,m=o>=-12.6&&o<-11.5&&Math.abs(s)<=1.7,h=null;if(d||f){let e=s-t(o);h=f?o>6.6?bf.mid:bf.deep:e<1.1?bf.edge:e<2.3||l-o<1?bf.light:o-u<1?bf.deep:s>-1.6?bf.dark:bf.mid,Math.abs(o-5.5)<.8&&Math.abs(s-.1)<.8?h=bf.rivet:Math.abs(o-4.8)<.6&&Math.abs(s-.7)<.6&&(h=bf.rivetDark)}else m?h=bf.pommel:p&&(o<-6.8?(h=Math.floor((o+12)/1.5)%2?bf.grip:bf.gripDark,s<-.5&&h===bf.grip&&(h=`#d0503a`)):(h=s<-.45?bf.woodLight:s>.45?bf.woodDark:bf.wood,Math.abs(s)<=.45&&Math.floor(o*1.7)%5==0&&(h=bf.woodDark)));h&&e.set(r,n,h,`axe`)}return jd(e,()=>bf.outline),xf={canvas:e.toCanvas(),edge:yf(5.5,-7.5),grip:yf(-11,0)},xf}function Cf(e=1){let t=Sf().canvas,[n,r]=Dd(t.width*e,t.height*e);return r.imageSmoothingEnabled=!1,r.drawImage(t,0,0,n.width,n.height),n}function wf(e,t){let{edge:n,grip:r}=Sf(),i=Math.hypot(n[0]-r[0],n[1]-r[1]),a=Math.atan2(n[1]-r[1],n[0]-r[0]),o=Math.ceil((i+3)*2),[s,c]=Dd(o*e,o*e),l=o/2;for(let n=0;n<o;n++)for(let r=0;r<o;r++){let o=r+.5-l,s=n+.5-l,u=Math.hypot(o,s);if(u<i-3.2||u>i+.6)continue;let d=Math.atan2(s,o)-a;for(;d<0;)d+=Math.PI*2;let f=d/(t*Math.PI/180);if(f>1)continue;let p=(1-f)*(u>i-1.2?.9:.45);p<.08||(c.fillStyle=`rgba(255, 250, 230, ${p.toFixed(2)})`,c.fillRect(r*e,n*e,e,e))}return{canvas:s,size:o*e}}var Tf=t({bell:()=>Xf,buy:()=>Kf,chop:()=>Bf,coin:()=>qf,crash:()=>Vf,crit:()=>Qf,deny:()=>Gf,deposit:()=>Wf,fanfare:()=>Zf,getVolume:()=>Ff,knock:()=>zf,pop:()=>Uf,rain:()=>Jf,saw:()=>$f,setDuck:()=>Pf,setVolume:()=>Nf,thud:()=>Hf,thunder:()=>Yf}),Ef=null,Df=null,Of=1,kf=!1,Af=1,jf=()=>kf?0:Of*Af;function Mf(){return Ef||(Ef=new(window.AudioContext||window.webkitAudioContext),Df=Ef.createGain(),Df.gain.value=jf(),Df.connect(Ef.destination)),Ef.state===`suspended`&&Ef.resume(),Ef}function Nf(e,t=kf){Of=Math.min(1,Math.max(0,e)),kf=t,Df&&(Df.gain.value=jf())}function Pf(e){Af=e,Df&&(Df.gain.value=jf())}var Ff=()=>({volume:Of,muted:kf});function If(e,t,{type:n=`triangle`,from:r,to:i,dur:a,vol:o}){let s=e.createOscillator();s.type=n,s.frequency.setValueAtTime(r,t),s.frequency.exponentialRampToValueAtTime(i,t+a*.8);let c=e.createGain();c.gain.setValueAtTime(1e-4,t),c.gain.exponentialRampToValueAtTime(o,t+.004),c.gain.exponentialRampToValueAtTime(1e-4,t+a),s.connect(c).connect(Df),s.start(t),s.stop(t+a+.02)}function Lf(e,t,{dur:n,freq:r,q:i=1,vol:a,type:o=`bandpass`}){let s=Math.floor(e.sampleRate*n),c=e.createBuffer(1,s,e.sampleRate),l=c.getChannelData(0);for(let e=0;e<s;e++)l[e]=(Math.random()*2-1)*(1-e/s)**2.5;let u=e.createBufferSource();u.buffer=c;let d=e.createBiquadFilter();d.type=o,d.frequency.value=r,d.Q.value=i;let f=e.createGain();f.gain.value=a,u.connect(d).connect(f).connect(Df),u.start(t)}function Rf(e){if(!(kf||Of<=0))try{let t=Mf();e(t,t.currentTime)}catch{}}function zf(e=1,t=.22){Rf((n,r)=>{If(n,r,{from:240*e,to:95*e,dur:.14,vol:t}),Lf(n,r,{dur:.035,freq:1600*e,q:1.2,vol:t*.7})})}function Bf(e=1){let t=.9+Math.random()*.2;Rf((n,r)=>{If(n,r,{from:180*t,to:70*t,dur:.12,vol:.28*e}),Lf(n,r,{dur:.06,freq:2400*t,q:.8,vol:.32*e}),Lf(n,r+.01,{dur:.12,freq:600,q:.7,vol:.12*e})})}function Vf(){Rf((e,t)=>{Lf(e,t,{dur:.25,freq:3e3,q:.5,vol:.12}),If(e,t+.05,{type:`sine`,from:110,to:38,dur:.4,vol:.4}),Lf(e,t+.05,{dur:.45,freq:500,vol:.3,type:`lowpass`})})}function Hf(e=.12){Rf((t,n)=>{If(t,n,{from:160+Math.random()*40,to:80,dur:.08,vol:e})})}function Uf(e=1){Rf((t,n)=>{If(t,n,{type:`square`,from:420,to:900,dur:.09,vol:.06*e}),If(t,n,{type:`sine`,from:600,to:1300,dur:.1,vol:.12*e})})}function Wf(){Rf((e,t)=>{If(e,t,{from:200,to:110,dur:.1,vol:.2}),Lf(e,t,{dur:.04,freq:1400,vol:.15}),If(e,t+.05,{type:`sine`,from:1180,to:1200,dur:.12,vol:.06}),If(e,t+.1,{type:`sine`,from:1580,to:1600,dur:.16,vol:.05})})}function Gf(){Rf((e,t)=>{If(e,t,{type:`square`,from:180,to:120,dur:.14,vol:.06})})}function Kf(){Rf((e,t)=>{[784,988,1318].forEach((n,r)=>If(e,t+r*.06,{type:`square`,from:n,to:n,dur:.1,vol:.05})),If(e,t,{from:220,to:120,dur:.12,vol:.15})})}function qf(){Rf((e,t)=>{If(e,t,{type:`square`,from:988,to:988,dur:.07,vol:.05}),If(e,t+.07,{type:`square`,from:1318,to:1318,dur:.16,vol:.05})})}function Jf(){Rf((e,t)=>{for(let n=0;n<6;n++)Lf(e,t+n*.25,{dur:.9,freq:3200+n*200,q:.4,vol:.05,type:`highpass`})})}function Yf(e=1){Rf((t,n)=>{Lf(t,n,{dur:.25,freq:900,q:.6,vol:.4*e}),Lf(t,n+.08,{dur:1.6,freq:140,q:.7,vol:.55*e,type:`lowpass`}),If(t,n+.05,{type:`sine`,from:70,to:38,dur:1.2,vol:.25*e})})}function Xf(){Rf((e,t)=>{If(e,t,{type:`sine`,from:1568,to:1560,dur:.35,vol:.09}),If(e,t+.12,{type:`sine`,from:1175,to:1170,dur:.5,vol:.08})})}function Zf(){Rf((e,t)=>{[523,659,784,1046].forEach((n,r)=>If(e,t+r*.09,{type:`square`,from:n,to:n,dur:r===3?.3:.1,vol:.05}))})}function Qf(){Rf((e,t)=>{If(e,t,{from:260,to:60,dur:.18,vol:.32}),Lf(e,t,{dur:.1,freq:3200,q:.7,vol:.35}),If(e,t+.02,{type:`square`,from:1200,to:1800,dur:.12,vol:.05})})}function $f(e=.06){Rf((t,n)=>{for(let r=0;r<3;r++)Lf(t,n+r*.07,{dur:.06,freq:2600+r*300,q:3,vol:e});If(t,n,{type:`sawtooth`,from:520,to:430,dur:.2,vol:e*.25})})}var ep=[[0,-1],[1,0],[0,1],[-1,0]],tp={sawmill:{name:`Sawmill`,icon:`[[icon:saw]]`,kind:`processor`,size:2,unlockRep:2,desc:`Turns logs into planks of the same wood (about ×2.5 value). Workers bring logs and fetch planks.`,price:e=>Math.round(200*3**e),levels:[{time:3,inCap:12,outCap:12},{time:2.1,inCap:20,outCap:20,cost:400},{time:1.5,inCap:30,outCap:30,cost:1200}]},spout:{name:`Wooden Spout`,icon:`[[icon:water]]`,kind:`irrigation`,size:1,unlockRep:0,outlets:[0],growth:.25,desc:`1 water outlet · watered tiles grow +25%`,price:e=>Math.round(60*1.3**e)},splitter:{name:`Bamboo Splitter`,icon:`[[icon:leaves]]`,kind:`irrigation`,size:1,unlockRep:1,outlets:[1,3],growth:.3,desc:`2 water outlets · watered tiles grow +30%`,price:e=>Math.round(150*1.3**e)},sprinkler:{name:`Copper Sprinkler`,icon:`[[icon:sprinkler]]`,kind:`irrigation`,size:1,unlockRep:3,outlets:[0,1,3],growth:.4,desc:`3 water outlets · watered tiles grow +40%`,price:e=>Math.round(400*1.3**e)},fountain:{name:`Brass Fountain`,icon:`[[icon:fountain]]`,kind:`irrigation`,size:1,unlockRep:5,outlets:[0,1,2,3],growth:.5,desc:`4 water outlets · watered tiles grow +50%`,price:e=>Math.round(1e3*1.3**e)}},np=[`sawmill`,`spout`,`splitter`,`sprinkler`,`fountain`];function rp(e){let t=tp[e.type];return t.kind===`irrigation`?t.outlets.map(t=>{let[n,r]=ep[(t+e.rot)%4];return[e.cell[0]+n,e.cell[1]+r]}):[]}var ip=e=>tp.sawmill.levels[Math.min(e.level,tp.sawmill.levels.length-1)];function ap(e,t){let n=document.createElement(`canvas`);n.width=e,n.height=t;let r=n.getContext(`2d`);return{c:n,ctx:r,px:(e,t,n,i=1,a=1)=>{r.fillStyle=e,r.fillRect(t,n,i,a)}}}var op={oak:{o:`#2a1508`,bark:`#8f5c2e`,hi:`#a8743c`,lo:`#6e4220`,dark:`#4e2c12`,end:`#e2b878`,ring:`#c4924f`,core:`#8a5a2b`},birch:{o:`#2a2620`,bark:`#ece6d8`,hi:`#ffffff`,lo:`#cfc6b4`,dark:`#2f2a24`,end:`#f2dfae`,ring:`#d9bf86`,core:`#b89a5e`},pine:{o:`#2a1205`,bark:`#9a4f2a`,hi:`#b8643a`,lo:`#7a3a1c`,dark:`#4e220e`,end:`#efc27a`,ring:`#d39a50`,core:`#a86a30`}};function sp(e=`oak`){let t=op[e]??op.oak,{c:n,px:r}=ap(16,10);if(r(t.o,1,1,12,8),r(t.o,0,2,1,6),r(t.bark,1,2,11,6),r(t.hi,1,2,11,1),r(t.lo,1,6,11,1),r(t.dark,1,7,11,1),e===`birch`)for(let[e,n,i]of[[2,3,2],[6,5,3],[9,3,1],[4,6,1]])r(t.dark,e,n,i,1);else r(t.dark,4,4,3,1),r(t.dark,8,3,2,1);return r(t.o,11,1,4,1),r(t.o,11,8,4,1),r(t.o,15,2,1,6),r(t.end,11,2,4,6),r(t.ring,12,3,2,4),r(t.end,12,4,2,2),r(t.core,13,4),n}var cp={oak:[`#c8944f`,`#a8743c`,`#e2b878`],birch:[`#ead9b0`,`#cdb98a`,`#fbf0d0`],pine:[`#d99a5a`,`#b8763a`,`#f2c27e`]};function lp(e=`oak`){let[t,n,r]=cp[e]??cp.oak,i=`#2a1508`,{c:a,px:o}=ap(16,10);return o(i,0,1,14,5),o(t,1,2,12,3),o(r,1,2,12,1),o(n,4,3,4,1),o(i,2,5,14,5),o(t,3,6,12,3),o(r,3,6,12,1),o(n,9,7,4,1),o(n,5,8,2,1),a}var up={oak:[`#1d3a15`,`#67ad3d`,`#93cc55`],birch:[`#2a3a12`,`#a8cf52`,`#d6ec8a`],pine:[`#10301c`,`#2e7a44`,`#4fa060`]};function dp(e=`oak`){let[t,n,r]=up[e]??up.oak,{c:i,px:a}=ap(12,12);return a(`#2a1508`,2,8,8,4),a(`#2a1508`,1,9,10,2),a(`#7a4a22`,2,9,8,2),a(`#9a6232`,3,9,3,1),e===`pine`?(a(t,5,0,2,1),a(t,4,1,4,2),a(t,3,3,6,2),a(t,2,5,8,3),a(n,5,1,2,2),a(n,4,3,4,2),a(n,3,5,6,2),a(r,4,3,1,1),a(r,3,5,1,1),i):(a(t,5,3,2,6),a(e===`birch`?`#e8e2d2`:`#4f9e3f`,5,4,1,5),a(t,0,2,5,4),a(n,1,3,3,2),a(r,1,3,2,1),a(t,7,0,5,4),a(n,8,1,3,2),a(r,8,1,2,1),i)}var fp=new Map;function pp(e){if(fp.has(e))return fp.get(e);let t=ht[e],n;return n=e===`goldwood`?uf():t?.type===`plank`?lp(t.species):t?.type===`sapling`?dp(t.species):sp(t?.species),fp.set(e,n),n}var mp=e=>ht[e]?.type===`sapling`?`sapling`:ht[e]?.type===`plank`?`planks`:`log`,hp=new Map;function gp(e){if(hp.has(e))return hp.get(e);let t=j(mp(e),64),n=t.getContext(`2d`),r=ht[e]?.species,i=e===`goldwood`?`coin`:r===`birch`?`leaves`:r===`pine`?`pine`:null;return i&&(e===`goldwood`&&(n.clearRect(0,0,64,64),n.filter=`sepia(1) saturate(2.4) brightness(1.35)`,n.drawImage(j(`log`,64),0,0),n.filter=`none`),n.drawImage(j(i,28),36,36)),hp.set(e,t),t}var _p=new Map;function vp(e){return _p.has(e)||_p.set(e,gp(e).toDataURL()),_p.get(e)}var yp=new Map;function bp(e){if(!yp.has(e)){let t=document.createElement(`canvas`);t.width=t.height=24,t.getContext(`2d`).drawImage(gp(e),0,0,24,24),yp.set(e,t)}return yp.get(e)}function xp(e=0,t=!1){let{c:n,ctx:r,px:i}=ap(52,48),a=`#2a1508`;i(a,5,15,42,29);for(let e=6;e<46;e+=4)i(e%8==6?`#8f5c2e`:`#9e6834`,e,16,4,27),i(`#6e4220`,e+3,16,1,27);i(`#b07a42`,6,16,40,1);for(let e=4;e<17;e++){let t=Math.max(0,16-e)*.9,n=Math.round(2+t),r=Math.round(50-t);i(a,n,e,r-n,1),e>4&&e<16&&i(e%3==0?`#7a2e1c`:`#9a3e26`,n+1,e,r-n-2,1)}i(`#c4583a`,12,6,28,1),i(a,13,22,26,22),i(`#2a1a10`,14,23,24,20);for(let t=-8;t<=8;t++)for(let n=-8;n<=8;n++){let r=Math.hypot(n,t);if(r>7.2)continue;let a=Math.atan2(t,n)+Math.PI/8*e,o=r>5.8&&Math.floor(a/(Math.PI*2)*16+16)%2==0;r>5.8&&!o||i(r<1.6?`#4a4d54`:r<4?`#c9cfd8`:`#9aa1ab`,26+n,34+t)}if(i(`#ffffff`,23,30,2,1),i(a,13,39,26,5),i(`#b07a42`,14,40,24,3),i(`#d6a062`,14,40,24,1),t)for(let t=0;t<6;t++)i(`#f2dca0`,30+(t*7+e*3)%9,30+(t*5+e*2)%8);return n}function Sp(e){let{c:t,px:n}=ap(16,20),r=`#1e1a16`;return e===`spout`?(n(r,3,6,10,13),n(`#8f5c2e`,4,7,8,11),n(`#a8743c`,4,7,2,11),n(`#6b6f78`,4,9,8,1),n(`#6b6f78`,4,15,8,1),n(`#5ab0e8`,5,7,6,1),n(r,12,11,4,3),n(`#8f5c2e`,12,12,3,1)):e===`splitter`?(n(r,6,4,4,15),n(`#7fb04a`,7,5,2,13),n(`#a8d46a`,7,5,1,13),n(r,0,10,16,4),n(`#7fb04a`,1,11,14,2),n(`#a8d46a`,1,11,14,1),n(`#4a7a2a`,7,9,2,1),n(`#4a7a2a`,4,11,1,2),n(`#4a7a2a`,11,11,1,2)):e===`sprinkler`?(n(r,6,7,4,12),n(`#b8693a`,7,8,2,11),n(`#e09a5a`,7,8,1,11),n(r,3,2,10,6),n(`#c87a42`,4,3,8,4),n(`#f0b070`,4,3,8,1),n(`#2a5a8a`,5,6,1,1),n(`#2a5a8a`,10,6,1,1)):(n(r,1,12,14,7),n(`#d9a82a`,2,13,12,5),n(`#f6d25a`,2,13,12,1),n(`#5ab0e8`,3,14,10,2),n(`#9ad8ff`,4,14,3,1),n(r,6,4,4,9),n(`#d9a82a`,7,5,2,8),n(`#5ab0e8`,7,1,2,3),n(`#9ad8ff`,7,1,1,2)),t}function Cp(e){let{c:t,px:n}=ap(16,16),r=`#4a3a2a`,i=`#5ab0e8`;for(let t of e)t===0&&(n(r,6,0,4,8),n(i,7,0,2,8)),t===1&&(n(r,8,6,8,4),n(i,8,7,8,2)),t===2&&(n(r,6,8,4,8),n(i,7,8,2,8)),t===3&&(n(r,0,6,8,4),n(i,0,7,8,2));return n(r,4,4,8,8),n(i,5,5,6,6),n(`#9ad8ff`,6,6,2,1),t}function wp(){let{c:e,px:t}=ap(16,16);e.getContext(`2d`).fillStyle=`rgba(40, 90, 160, 0.22)`,e.getContext(`2d`).fillRect(0,0,16,16);for(let[e,n]of[[3,4],[11,3],[7,9],[13,12],[2,13],[9,14]])t(`rgba(120, 190, 255, 0.75)`,e,n),t(`rgba(30, 70, 130, 0.5)`,e,n+1);return e}var Tp=2,Ep=2,Dp={W:`#ffffff`,S:`#e6e1d7`,D:`#c9c1b2`,handle:`#8a5a2b`,steel:`#b8c0ca`,steelDark:`#7c848e`,edge:`#f4f8fb`},Op={stand:{handL:[5,14],handR:[11,14],footL:[7,19],footR:[9,19]},breathe:{bob:1,handL:[5,15],handR:[11,15],footL:[7,19],footR:[9,19]},w0:{handL:[6,13],handR:[11,14],footL:[5,19],footR:[11,19]},w1:{bob:1,handL:[5,15],handR:[11,15],footL:[7,19],footR:[9,19]},w2:{handL:[5,14],handR:[10,13],footL:[11,19],footR:[5,19]},w3:{bob:1,handL:[5,15],handR:[11,15],footL:[7,19],footR:[9,19]},cw0:{handL:[5,0],handR:[11,0],footL:[5,19],footR:[11,19]},cw1:{bob:1,handL:[5,1],handR:[11,1],footL:[7,19],footR:[9,19]},cw2:{handL:[5,0],handR:[11,0],footL:[11,19],footR:[5,19]},cw3:{bob:1,handL:[5,1],handR:[11,1],footL:[7,19],footR:[9,19]},carry:{handL:[5,0],handR:[11,0],footL:[7,19],footR:[9,19]},carryB:{bob:1,handL:[5,1],handR:[11,1],footL:[7,19],footR:[9,19]},chop0:{handL:[6,-1],handR:[5,-1],footL:[6,19],footR:[10,19],tool:`axe`,toolDir:[-1,.55]},chop1:{bob:1,handL:[12,12],handR:[13,11],footL:[6,19],footR:[11,19],tool:`axe`,toolDir:[1,.8]},chop2:{handL:[12,9],handR:[12,8],footL:[6,19],footR:[10,19],tool:`axe`,toolDir:[1,-.2]},d0:{crouch:3,handL:[12,19],handR:[13,18],footL:[6,19],footR:[10,19]},d1:{crouch:2,handL:[12,15],handR:[13,14],footL:[6,19],footR:[10,19]},pick:{crouch:3,handL:[11,19],handR:[12,19],footL:[6,19],footR:[10,19]},ch0:{handL:[3,3],handR:[13,3],footL:[6,19],footR:[10,19]},ch1:{bob:-1,handL:[4,0],handR:[12,0],footL:[7,19],footR:[9,19]},wa:{handL:[5,14],handR:[14,4],footL:[7,19],footR:[9,19]},nap:{crouch:4,handL:[6,19],handR:[10,19],footL:[5,19],footR:[11,19]},napB:{crouch:5,handL:[6,19],handR:[10,19],footL:[5,19],footR:[11,19]},wb:{handL:[5,14],handR:[12,1],footL:[7,19],footR:[9,19]}};function kp(e,t){let n=document.createElement(`canvas`);return n.width=e,n.height=t,n}function Ap(e,t=null){let n=new Map,r=(e,t,r)=>{let i=Math.round(e)+Tp,a=Math.round(t)+Ep;i<0||a<0||i>=20||a>=22||n.set(a*20+i,r)},i=(e,t,n,i,a)=>{let o=Math.max(Math.abs(n-e),Math.abs(i-t),1);for(let s=0;s<=o;s++)r(e+(n-e)*s/o,t+(i-t)*s/o,a)},a=e.bob??0,o=e.crouch??0,s=5+a+o,c=9+a+o,l=14+Math.round(o*.7);i(6,c+1,e.handL[0],e.handL[1],Dp.S),i(7,l,e.footL[0],e.footL[1],Dp.S),i(8,l,e.footR[0],e.footR[1],Dp.W);for(let e=c;e<=l;e++)for(let t=6;t<=9;t++)(e!==c||t!==6&&t!==9)&&r(t,e,t===9||e===l?Dp.S:Dp.W);for(let e=s-4;e<=s+4;e++)for(let t=4;t<=12;t++){let n=t+.5-8.5,i=e+.5-(s+.5);n*n+i*i>3.9*3.9||r(t,e,n*.6+i>2.4?Dp.S:Dp.W)}if(t&&Mp(r,t,s,c,l),i(9,c+1,e.handR[0],e.handR[1],Dp.W),r(e.footL[0],e.footL[1],Dp.D),r(e.footR[0],e.footR[1],Dp.D),e.tool===`axe`){let[t,n]=e.handR,i=Math.hypot(...e.toolDir),a=e.toolDir[0]/i,o=e.toolDir[1]/i;for(let e=1;e<=4;e++)r(t+a*e,n+o*e,Dp.handle);let s=t+a*4,c=n+o*4,l=-o,u=a;r(s,c,Dp.steelDark),r(s+l,c+u,Dp.steel),r(s+l*2,c+u*2,Dp.edge),r(s+l+a,c+u+o,Dp.steel),r(s-l,c-u,Dp.steelDark)}let u=kp(20,22),d=u.getContext(`2d`);for(let[e,t]of n)d.fillStyle=t,d.fillRect(e%20,Math.floor(e/20),1,1);return u}function jp(e,t=.72){let n=parseInt(e.slice(1),16),r=e=>Math.round((n>>e&255)*t);return`rgb(${r(16)},${r(8)},${r(0)})`}function Mp(e,t,n,r,i){let a=t.shirt,o=jp(a);for(let t=r;t<=i-1;t++)for(let n=6;n<=9;n++)(t!==r||n!==6&&n!==9)&&e(n,t,n===9||t===i-1?o:a);let s=t.hat,c=jp(s),l=n-4,u=(t,n,r,i)=>{for(let a=n;a<=r;a++)e(a,t,i)};switch(t.hatStyle){case`cap`:u(l,6,11,s),u(l+1,5,12,s),u(l+2,10,14,c);break;case`tophat`:u(l+1,4,13,c);for(let e=l-2;e<=l;e++)u(e,6,11,s);u(l,6,11,`#d9503c`);break;case`beanie`:u(l-1,6,11,s),u(l,5,12,s),u(l+1,5,12,c),e(8,l-2,`#ffffff`),e(9,l-2,`#ffffff`);break;case`straw`:u(l+1,3,14,c),u(l,6,11,s),u(l-1,7,10,s);break;case`chef`:for(let e=l-2;e<=l+1;e++)u(e,e<l?5:6,e<l?12:11,e===l+1?`#d8d0c0`:`#fffaf0`);break;case`bandana`:u(l,5,12,s),u(l+1,4,12,c),e(3,l+2,s),e(3,l+3,c)}}function Np(e){let t=kp(e.width,e.height),n=t.getContext(`2d`);return n.translate(e.width,0),n.scale(-1,1),n.drawImage(e,0,0),t}function Pp(e){return j({heart:`heart`,angry:`bolt`,coin:`coin`,"!":`warning`,zzz:`moon`}[e],32)}function Fp(e=3){let t=Ap(Op.stand),n=kp(20*e,22*e),r=n.getContext(`2d`);return r.imageSmoothingEnabled=!1,r.drawImage(t,0,0,n.width,n.height),n.toDataURL()}function Ip(e,t=2){let n=Ap(Op.stand,e),r=kp(20*t,22*t),i=r.getContext(`2d`);return i.imageSmoothingEnabled=!1,i.drawImage(n,0,0,r.width,r.height),r.toDataURL()}var Lp={idle:{frames:[`stand`,`breathe`],dur:.55},walk:{frames:[`w0`,`w1`,`w2`,`w3`],dur:.11},carryWalk:{frames:[`cw0`,`cw1`,`cw2`,`cw3`],dur:.12},carryIdle:{frames:[`carry`,`carryB`],dur:.4},pickup:{frames:[`pick`],dur:1},dig:{frames:[`d0`,`d1`],dur:.17},cheer:{frames:[`ch0`,`ch1`],dur:.12},wave:{frames:[`wa`,`wb`],dur:.16},chop:{frames:[`chop0`],dur:1},nap:{frames:[`nap`,`napB`],dur:.9}},Rp=Math.random,zp=(e,t)=>e+Rp()*(t-e);function Bp(e){let{state:t,SCREEN_RIGHT:n,TO_CAMERA:r,landBox:i}=e,a=1.35,o=e.PX,s=19*o*a,c={};for(let[t,n]of Object.entries(Op)){let r=Ap(n);c[t]={r:e.canvasTexture(r),l:e.canvasTexture(Np(r))}}let l={"!":e.canvasTexture(Pp(`!`)),heart:e.canvasTexture(Pp(`heart`)),zzz:e.canvasTexture(Pp(`zzz`))},u=new Map,d=!1,f=e=>{let t=new G(e.x,0,e.z);return t.lengthSq()<.01&&t.set(1,0,1),t.normalize().multiplyScalar(.75)},p=e=>{let t=i();return e.x=Zr.clamp(e.x,t.minX+.3,t.maxX-.3),e.z=Zr.clamp(e.z,t.minZ+.3,t.maxZ-.3),e},m=()=>p(new G(zp(-1.6,1.6),0,zp(-1.6,1.6))),h=()=>{let e=i(),t=zp(Math.PI*.75,Math.PI*1.75),n=Math.cos(t),r=Math.sin(t),a=Math.min(Math.abs(n)>.001?e.hx/Math.abs(n):1/0,Math.abs(r)>.001?e.hz/Math.abs(r):1/0);return new G(e.cx+n*(a+1.6),0,e.cz+r*(a+1.6))};function g(n,r){let i=e.makeSprite(c.stand.r,20,22,{scale:a}),o=e.makeShadow(0,0,.55),s=e.makeSprite(l[`!`],9,11,{center:[.5,0],scale:1});s.visible=!1;let d={id:n.id,data:n,sprite:i,shadow:o,emote:s,ab:Re(n,t),pos:r?h():m(),target:null,facing:`r`,anim:`idle`,animT:0,frame:0,poseOverride:null,phase:r?`arrive`:`idle`,task:null,timer:0,think:Rp()*.4,wander:zp(1,3),carried:[],prop:null,cargo:[],hop:0,hopV:0,squash:0,stepAcc:0,emoteT:0,swingT:0,swung:!1,depositT:0,status:`Idle`};return r&&(d.target=m()),u.set(n.id,d),d}function _(t){e.removeSprite(t.sprite),e.removeSprite(t.emote),e.removeShadow(t.shadow),t.prop&&e.removeSprite(t.prop),u.delete(t.id)}function v(e,t){e.anim!==t&&(e.anim=t,e.animT=0,e.frame=0)}function y(e,t){e.emote.material.map=l[t],e.emote.visible=!0,e.emoteT=.9}function b(e,t=2.6){e.hop<=.001&&(e.hopV=t)}function x(e,t,r){let i=(t-e.pos.x)*n.x+(r-e.pos.z)*n.z;Math.abs(i)>.02&&(e.facing=i>0?`r`:`l`)}function S(t,n,r,i=1){let a=n.x-t.pos.x,o=n.z-t.pos.z,s=Math.hypot(a,o),c=t.ab.speed*i*r;return x(t,n.x,n.z),s<=c?(t.pos.x=n.x,t.pos.z=n.z,!0):(t.pos.x+=a/s*c,t.pos.z+=o/s*c,t.stepAcc+=c,t.stepAcc>.55&&(t.stepAcc=0,e.stepDust(t.pos)),!1)}let C=(e,t,n)=>{let r=null,i=1/0;for(let a of t){let t=n(a),o=(t.x-e.pos.x)**2+(t.z-e.pos.z)**2;o<i&&(i=o,r=a)}return r};function w(t){for(let n of t.data.priorities){if(n===`carry`&&e.hasRoom()){let r=C(t,e.items.filter(e=>e.state===`rest`&&!e.reservedBy),e=>e.sprite.position);if(r)return{type:n,item:r}}if(n===`plant`){let r=C(t,[...e.seeds.values()].filter(e=>!e.reservedBy),e=>e.pos);if(r)return{type:n,seed:r};if(e.availableSaplings()>0){let r=C(t,e.trees.filter(e=>e.phase===`stump`&&!e.autoRegrow&&!e.reservedBy),e=>e);if(r)return{type:n,seed:{pos:new G(r.x,0,r.z),stump:r}}}}if(n===`chop`){let r=C(t,e.trees.filter(e=>e.phase===`grown`&&!e.reservedBy),e=>e);if(r)return{type:n,tree:r}}if(n===`saw`){let t=e.sawmills().filter(e=>!e.reservedBy),r=t.find(t=>t.output.length>0&&e.hasRoom());if(r)return{type:n,mill:r,mode:`collect`};let i=t.find(t=>e.sawmillNeedsInput(t));if(i)return{type:n,mill:i,mode:`supply`}}}return null}function T(t,n){for(let r of n)t.cargo.push({key:r,sprite:e.makeSprite(e.itemTexture(r),16,10,{center:[.5,.5],scale:1})})}function E(t){for(let n of t.cargo)e.removeSprite(n.sprite);t.cargo=[]}function D(t,i){if(t.task=i,y(t,`!`),b(t,1.6),i.type===`carry`)i.item.reservedBy=t.id,e.reserveSlot(1),t.phase=`toItem`,t.target=i.item.sprite.position.clone();else if(i.type===`plant`)i.seed.stump?(i.seed.stump.reservedBy=t.id,e.reserveSapling(1)):i.seed.reservedBy=t.id,t.phase=`toChestFetch`,t.target=f(t.pos);else if(i.type===`saw`)i.mill.reservedBy=t.id,i.mode===`supply`?(t.phase=`sawToChest`,t.target=f(t.pos)):(t.phase=`toMill`,t.target=p(e.sawmillSpot(i.mill)));else if(i.type===`chop`){let e=i.tree;e.reservedBy=t.id;let a=(t.pos.x-e.x)*n.x+(t.pos.z-e.z)*n.z>=0?1:-1;i.side=a,t.target=p(new G(e.x,0,e.z).addScaledVector(n,a*.55).addScaledVector(r,.18)),t.phase=`toTree`}}function O(n){let r=n.task;if(r?.type===`carry`&&r.item&&r.item.reservedBy===n.id&&r.item.state!==`carried`&&(r.item.reservedBy=null,e.reserveSlot(-1)),r?.type===`plant`&&r.seed){let t=r.seed.stump;t?(t.reservedBy===n.id&&(t.reservedBy=null),r.saplingTaken?r.planted||e.returnSapling(r.species):e.reserveSapling(-1)):r.seed.reservedBy=null}if(r?.type===`chop`&&r.tree?.reservedBy===n.id&&(r.tree.reservedBy=null),r?.type===`saw`){r.mill.reservedBy===n.id&&(r.mill.reservedBy=null);for(let i of n.cargo)t.inventory[i.key]=(t.inventory[i.key]??0)+1,r.mode===`collect`&&e.reserveSlot(-1)}E(n);for(let t of n.carried)t.state=`air`,t.reservedBy=null,t.shadow.visible=!0,t.vel.set(zp(-.8,.8),2.5,zp(-.8,.8)),e.reserveSlot(-1);n.carried=[],n.prop&&=(e.removeSprite(n.prop),null),n.task=null}function k(e,t=!0){if(e.task=null,e.think=.25,Rp()<e.ab.napChance){e.phase=`nap`,e.timer=zp(3,6),y(e,`zzz`);return}t&&Rp()<.6?(e.phase=`cheer`,e.timer=.75,b(e,3),Rp()<.35&&y(e,`heart`)):e.phase=`idle`}function A(n,r){let i=Ie(n.data,r,t);i&&(e.levelUp(n,i),y(n,`heart`),b(n,3.6))}function j(t){let n=t.carried.pop();n&&(n.state=`air`,n.reservedBy=null,n.shadow.visible=!0,n.vel.set(zp(-1,1),2.4,zp(-1,1)),e.reserveSlot(-1),e.floater(`Oops!`,t.pos.clone().setY(1.2),`floater-warn`),y(t,`!`),t.squash=1)}function ee(t,n){n.state=`carried`,n.shadow.visible=!1,n.sprite.material.rotation=0,t.carried.push(n),t.squash=.8,e.sfx.pop(.5)}function M(i,l){let u=i.carried.length>0||!!i.prop||i.cargo.length>0;switch(i.think-=l,i.ab=Re(i.data,t),i.carried.length&&(i.phase===`toItem`||i.phase===`toChest`)&&Rp()<i.ab.dropChance*l&&j(i),i.phase){case`arrive`:i.status=`Arriving`,v(i,`walk`),S(i,i.target,l)&&(e.floater(`Hi!`,i.pos.clone().setY(1.1),`floater-sapling`),y(i,`heart`),i.phase=`cheer`,i.timer=.9,b(i,3.2));break;case`leave`:if(i.status=`Leaving`,i.timer>0){i.timer-=l,v(i,`wave`);break}if(v(i,`walk`),S(i,i.target,l)){_(i);return}break;case`nap`:i.status=`Napping [[icon:moon]]`,v(i,`nap`),i.timer-=l,i.emoteT<=0&&i.timer>1&&y(i,`zzz`),i.timer<=0&&(i.phase=`idle`,b(i,1.8));break;case`cheer`:v(i,`cheer`),i.timer-=l,i.timer<=0&&(i.phase=`idle`);break;case`idle`:case`wander`:if(i.status=`Idle`,i.think<=0){i.think=.35;let e=w(i);if(e){D(i,e);break}}i.phase===`wander`?(v(i,`walk`),S(i,i.target,l,.55)&&(i.phase=`idle`,i.wander=zp(1.5,4))):(v(i,`idle`),i.wander-=l,i.wander<=0&&(Rp()<.25?(i.phase=`cheer`,i.timer=.5,b(i,2.2)):(i.phase=`wander`,i.target=p(i.pos.clone().add(new G(zp(-1.2,1.2),0,zp(-1.2,1.2)))))));break;case`toItem`:{let t=i.task.item;if(i.status=`Carrying [[icon:log]] ${i.carried.length}/${i.ab.capacity}`,t.state!==`rest`||t.reservedBy!==i.id){e.reserveSlot(-1),t.reservedBy===i.id&&(t.reservedBy=null),i.task.item=null,i.carried.length?(i.phase=`toChest`,i.target=f(i.pos)):(i.task=null,i.phase=`idle`);break}v(i,u?`carryWalk`:`walk`),S(i,t.sprite.position,l,u?.85:1)&&(i.phase=`pickup`,i.timer=.28);break}case`pickup`:if(v(i,`pickup`),i.timer-=l,i.timer>0)break;if(ee(i,i.task.item),i.task.item=null,i.carried.length<i.ab.capacity&&e.hasRoom()){let t=C(i,e.items.filter(e=>e.state===`rest`&&!e.reservedBy&&e.sprite.position.distanceTo(i.pos)<2.6),e=>e.sprite.position);if(t){t.reservedBy=i.id,e.reserveSlot(1),i.task.item=t,i.phase=`toItem`;break}}i.phase=`toChest`,i.target=f(i.pos);break;case`toChest`:i.status=`Carrying [[icon:log]] ${i.carried.length}/${i.ab.capacity}`,v(i,`carryWalk`),S(i,i.target,l,.85)&&(x(i,0,0),i.phase=`deposit`,i.depositT=0);break;case`deposit`:if(v(i,`carryIdle`),i.depositT-=l,i.depositT<=0&&i.carried.length){let t=i.carried.pop();t.reservedBy=null,e.reserveSlot(-1),e.launchItem(t),A(i,L.deliver),i.squash=.6,i.depositT=.16}!i.carried.length&&i.depositT<=0&&k(i);break;case`toChestFetch`:i.status=`Planting [[icon:sapling]]`,v(i,`walk`),S(i,i.target,l)&&(x(i,0,0),i.phase=`fetch`,i.timer=.35);break;case`fetch`:{if(v(i,`pickup`),i.timer-=l,i.timer>0)break;if(i.task.seed.stump){let t=e.takeSapling(i.task.seed.stump.species);if(!t){i.task.seed.stump.reservedBy=null,i.task=null,i.phase=`idle`;break}i.task.saplingTaken=!0,i.task.species=t}else i.task.species=i.task.seed.species;i.prop=e.makeSprite(e.saplingTexOf(i.task.species),12,12,{center:[.5,.5],scale:1.15}),i.squash=.8,e.sfx.pop(.5);let t=i.task.seed;i.target=p(t.pos.clone().addScaledVector(n,-.42).addScaledVector(r,.15)),i.phase=`toSeed`;break}case`toSeed`:{i.status=`Planting [[icon:sapling]]`;let t=i.task.seed.stump;if(t&&t.phase!==`stump`){O(i),i.phase=`idle`;break}v(i,`carryWalk`),S(i,i.target,l,.9)&&(x(i,i.task.seed.pos.x,i.task.seed.pos.z),e.removeSprite(i.prop),i.prop=null,i.phase=`dig`,i.timer=i.ab.digTime,i.digPuff=0);break}case`dig`:if(v(i,`dig`),i.timer-=l,i.digPuff-=l,i.digPuff<=0&&(i.digPuff=.34,e.digDust(i.task.seed.pos)),i.timer<=0){let t=i.task.seed.stump;t?(t.phase===`stump`?(e.plantOnStump(t,i.task.species),i.task.planted=!0):e.returnSapling(i.task.species),t.reservedBy=null):e.plantSeed(i.task.seed),A(i,L.plant),k(i)}break;case`sawToChest`:i.status=`Sawmill [[icon:saw]] fetching logs`,v(i,`walk`),S(i,i.target,l)&&(x(i,0,0),i.phase=`sawFetch`,i.timer=.35);break;case`sawFetch`:{if(v(i,`pickup`),i.timer-=l,i.timer>0)break;let t=e.takeLogsFor(i.task.mill,i.ab.capacity);if(!t.length){O(i),i.phase=`idle`;break}T(i,t),i.squash=.8,e.sfx.pop(.5),i.phase=`toMill`,i.target=p(e.sawmillSpot(i.task.mill));break}case`toMill`:if(i.status=i.cargo.length?`Sawmill [[icon:saw]] ${i.cargo.length} logs`:`Sawmill [[icon:saw]] collecting`,!e.sawmills().includes(i.task.mill)){O(i),i.phase=`idle`;break}v(i,i.cargo.length?`carryWalk`:`walk`),S(i,i.target,l,i.cargo.length?.85:1)&&(x(i,i.task.mill.center.x,i.task.mill.center.z),i.phase=`millWork`,i.timer=.2);break;case`millWork`:{if(v(i,i.cargo.length?`carryIdle`:`pickup`),i.timer-=l,i.timer>0)break;let t=i.task.mill;if(i.cargo.length){let n=i.cargo.pop();e.removeSprite(n.sprite),e.deliverLogs(t,[n.key]),t.bounce=.6,A(i,L.deliver),i.squash=.5,i.timer=.16;break}let n=e.takePlanks(t,i.ab.capacity);if(n.length){e.reserveSlot(n.length),i.task.mode=`collect`,T(i,n),i.squash=.8,e.sfx.pop(.5),i.phase=`sawToChestDeliver`,i.target=f(i.pos);break}t.reservedBy=null,k(i);break}case`sawToChestDeliver`:i.status=`Sawmill [[icon:saw]] ${i.cargo.length} planks`,v(i,`carryWalk`),S(i,i.target,l,.85)&&(x(i,0,0),i.task.mill.reservedBy===i.id&&(i.task.mill.reservedBy=null),i.phase=`sawDeposit`,i.timer=0);break;case`sawDeposit`:{if(v(i,`carryIdle`),i.timer-=l,i.timer>0)break;let t=i.cargo.pop();t&&(e.removeSprite(t.sprite),e.reserveSlot(-1),e.depositToChest([t.key]),A(i,L.deliver),i.squash=.6,i.timer=.16),i.cargo.length||k(i);break}case`toTree`:{i.status=`Chopping [[icon:axe]]`;let e=i.task.tree;if(e.phase!==`grown`){e.reservedBy=null,i.task=null,i.phase=`idle`;break}v(i,`walk`),S(i,i.target,l)&&(x(i,e.x,e.z),i.phase=`chop`,i.swingT=0,i.swung=!1);break}case`chop`:{i.status=`Chopping [[icon:axe]]`;let t=i.task.tree;if(t.phase!==`grown`){t.reservedBy=null,t.lastHitBy===i.data&&A(i,L.fell),k(i,!0);break}v(i,`chop`),x(i,t.x,t.z),i.swingT+=l/i.ab.swingTime,i.swingT<.5?i.poseOverride=`chop0`:i.swingT<.72?(i.poseOverride=`chop1`,i.swung||(i.swung=!0,i.squash=.9,e.workerHit(t,i.ab.damage,i.task.side,i.data),A(i,L.hit))):i.poseOverride=`chop2`,i.swingT>=1&&(i.swingT=0,i.swung=!1);break}default:i.phase=`idle`}let d=Lp[i.anim],m=i.anim===`walk`||i.anim===`carryWalk`?i.ab.speed/1.2:1;i.animT+=l*m,i.animT>=d.dur&&(i.animT=0,i.frame=(i.frame+1)%d.frames.length);let h=i.anim===`chop`?i.poseOverride??`chop0`:d.frames[i.frame];(i.hop>0||i.hopV>0)&&(i.hopV-=14*l,i.hop+=i.hopV*l,i.hop<=0&&(i.hop=0,i.hopV=0,i.squash=1)),i.squash=Math.max(0,i.squash-l*5),i.sprite.material.map=c[h][i.facing];let g=i.squash*.18,E=20*o*a,M=22*o*a;i.sprite.scale.set(E*(1+g),M*(1-g),1),i.sprite.position.set(i.pos.x,i.hop,i.pos.z),i.shadow.position.set(i.pos.x,.012,i.pos.z);let te=Math.max(.4,1-i.hop*.6);i.shadow.scale.set(.5*te,.3*te,1);let ne=Op[h].bob??0,N=s-ne*o*a+i.hop-i.squash*.05,re=r.clone().multiplyScalar(.03);if(i.carried.forEach((e,t)=>{e.sprite.position.set(i.pos.x+re.x,N+.1+t*.17,i.pos.z+re.z),e.sprite.material.rotation=Math.sin(performance.now()/180+t)*.05}),i.prop&&i.prop.position.set(i.pos.x+re.x,N+.15,i.pos.z+re.z),i.cargo.forEach((e,t)=>{e.sprite.position.set(i.pos.x+re.x,N+.1+t*.17,i.pos.z+re.z),e.sprite.material.rotation=Math.sin(performance.now()/180+t)*.05}),i.emoteT>0){i.emoteT-=l;let e=Math.min(1,(.9-i.emoteT)*8);i.emote.visible=i.emoteT>0,i.emote.scale.set(10*o*e,10*o*e,1),i.emote.position.set(i.pos.x+re.x*2,N+.12+(i.carried.length+i.cargo.length)*.17+(1-e)*.1,i.pos.z+re.z*2)}}function te(){for(let e of t.workers)u.has(e.id)||g(e,d);for(let e of u.values()){let n=t.workers.find(t=>t.id===e.id);!n&&e.phase!==`leave`?(O(e),e.phase=`leave`,e.timer=.9,e.target=h(),y(e,`heart`)):n&&(e.data=n,e.ab=Re(n,t))}d=!0}function ne(e){te();for(let t of[...u.values()])M(t,e)}return te(),{update:ne,emoteAll:e=>u.forEach(t=>t.phase!==`leave`&&y(t,e)),status:e=>u.get(e)?.status??`Arriving`,list:()=>[...u.values()]}}var Vp=1.35,Hp=1.5,Up={idle:{frames:[`stand`,`breathe`],dur:.55},tap:{frames:[`stand`,`breathe`],dur:.16},walk:{frames:[`w0`,`w1`,`w2`,`w3`],dur:.11},cheer:{frames:[`ch0`,`ch1`],dur:.12},wave:{frames:[`wa`,`wb`],dur:.16}},Wp={normal:`#3a2a1a`,rush:`#d9503c`,bulk:`#c0941f`},Gp=Math.random,Kp=(e,t)=>e+Gp()*(t-e);function qp(e){let{state:t,PX:n,SCREEN_RIGHT:r,CHEST_TOP:i}=e,a=19*n*Vp,o=new Map;function s(t,n,r){let i=`${t.shirt}${t.hat}${t.hatStyle}:${n}`;if(!o.has(i)){let r=Ap(Op[n],t);o.set(i,{r:e.canvasTexture(r),l:e.canvasTexture(Np(r))})}return o.get(i)[r]}let c=Object.fromEntries([`heart`,`angry`,`coin`,`!`].map(t=>[t,e.canvasTexture(Pp(t))])),l=new Map;function u(t,n){let r=`${t}:${n}`;if(!l.has(r)){let i=e.itemCanvas(t),a=Math.max(i.width+6,16),o=i.height+9,s=document.createElement(`canvas`);s.width=a,s.height=o;let c=s.getContext(`2d`),u=Wp[n]??Wp.normal;c.fillStyle=u,c.fillRect(1,0,a-2,o-4),c.fillRect(0,1,a,o-6),c.fillStyle=`#fffaf0`,c.fillRect(1,1,a-2,o-6),c.fillStyle=u,c.fillRect(Math.floor(a/2)-2,o-4,4,1),c.fillRect(Math.floor(a/2)-1,o-3,2,2),c.fillStyle=`#fffaf0`,c.fillRect(Math.floor(a/2)-1,o-5,2,1),c.drawImage(i,Math.floor((a-i.width)/2),2),l.set(r,{tex:e.canvasTexture(s),w:a,h:o})}return l.get(r)}let d=()=>e.landBox().maxZ+.6,f=t=>{let n=e.landBox();return Zr.clamp((t-3/2)*1.5,n.minX+.8,n.maxX-.8)},p=()=>e.landBox().minX-3,m=()=>e.landBox().maxX+3,h=new Map,g=[];function _(){let e=new Set([...h.values()].filter(e=>e.phase!==`leave`).map(e=>e.slot));for(let t=0;t<4;t++)if(!e.has(t))return t;return 3}function v(t,n,r=null){let i=r?{id:t.id,look:r.look}:it(t.customerId),a=r?r.slot:_(),o=[...h.values()].filter(e=>e.phase===`arrive`).length,l=new G(n?p()-o*1.3:f(a),0,d()),m=e.makeSprite(s(i.look,`stand`,`r`),20,22,{scale:Vp}),g=e.makeShadow(l.x,l.z,.55),v=e.makeSprite(u(t.items[0].key,t.kind).tex,16,14,{center:[.5,0],scale:1}),y=e.makeSprite(c.heart,9,11,{center:[.5,0],scale:1.1});y.visible=!1;for(let e of[m,v,y])e.material.transparent=!0,e.material.alphaTest=.02,e.material.depthWrite=!1,e.material.needsUpdate=!0;m.renderOrder=5;let b={order:t,c:i,slot:a,pos:l,sprite:m,shadow:g,bubble:v,emote:y,phase:n?`arrive`:`wait`,facing:`r`,anim:n?`walk`:`idle`,animT:Gp(),t:0,bubbleT:0,emoteT:0,hop:0,item:0,pending:0,speed:Hp,special:!!r};return h.set(t.id,b),b}let y={shirt:`#7a4ab0`,hat:`#2a1a40`,hatStyle:`tophat`},b={id:`merchant`,kind:`bulk`,items:[{key:`goldwood`,n:1}],time:1,total:1};function x(){h.has(`merchant`)||(v(b,!0,{look:y,slot:4}),e.floater(`A traveling merchant!`,new G(p()+2,1.6,d()),`floater-gold`))}function S(){let e=h.get(`merchant`);e&&e.phase!==`leave`&&(w(e,`coin`,1.4),T(e,`happy`))}function C(t){for(let n of[t.sprite,t.bubble,t.emote])e.removeSprite(n);e.removeShadow(t.shadow),h.delete(t.order.id)}function w(e,t,n=1.6){e.emote.material.map=c[t],e.emote.visible=!0,e.emoteT=n}function T(e,t){e.phase=`leave`,e.bubble.visible=!1,e.speed=t===`angry`?Hp*.7:Hp,e.anim=t===`happy`?`wave`:`walk`,e.waveT=t===`happy`?.9:0}V(`orderNew`,({order:t})=>{h.has(t.id)||(v(t,!0),e.sfx.bell())}),V(`orderDone`,({order:t})=>{let n=h.get(t.id);if(!n)return;n.phase=`happy`,n.t=0,n.bubble.visible=!1;let r=t.items.flatMap(e=>Array(e.n).fill(e.key)),a=Math.min(8,r.length);n.pending=a,e.chestPop();for(let t=0;t<a;t++){let o=r[Math.floor(t/a*r.length)],s=e.makeSprite(e.itemTexture(o),16,10,{center:[.5,.5],scale:1.1});s.position.copy(i),g.push({sprite:s,v:n,t:-t*.07,from:i.clone(),spin:Kp(-10,10)})}}),V(`orderExpired`,({order:t})=>{let n=h.get(t.id);n&&(w(n,`angry`,2.2),e.floater(`Too late!`,n.pos.clone().setY(a+.6),`floater-warn`),T(n,`angry`))}),V(`orderDeclined`,({order:t})=>{let n=h.get(t.id);n&&(e.floater(`Oh well…`,n.pos.clone().setY(a+.6),`floater-dmg`),T(n,`sad`))}),V(`customerLove`,({id:t,hearts:n,perkUp:r})=>{let i=[...h.values()].find(e=>e.c.id===t&&e.phase===`happy`);i&&setTimeout(()=>{e.floater(`${`[[icon:heart]]`.repeat(n)}${r?` Bonus!`:``}`,i.pos.clone().setY(a+1.1),`floater-level`),e.sparkles(i.pos.clone().setY(a),14,`#ff8aa8`,1.8)},700)});function E(e,t){let n=Up[e.anim]??Up.idle;e.animT+=t;let r=n.frames[Math.max(0,Math.floor(e.animT/n.dur))%n.frames.length],i=s(e.c.look,r,e.facing);e.sprite.material.map!==i&&(e.sprite.material.map=i,e.sprite.material.needsUpdate=!0)}function D(t,n,i,a){let o=n-t.pos.x,s=i-t.pos.z,c=Math.hypot(o,s);if(c<.05)return!0;let l=Math.min(c,t.speed*a);return t.pos.x+=o/c*l,t.pos.z+=s/c*l,t.facing=o*r.x+s*r.z>=0?`r`:`l`,t.stepT=(t.stepT??0)-a,t.stepT<=0&&(t.stepT=.25,e.stepDust(t.pos)),!1}function O(t,i){let o=d();switch(t.phase){case`arrive`:t.anim=`walk`,t.bubble.visible=!1,D(t,f(t.slot),o,i)&&(t.phase=`wait`,t.facing=`l`,t.hop=1,w(t,`!`,1.2));break;case`wait`:{D(t,f(t.slot),o,i);let e=t.order.time/t.order.total<.25;if(t.anim=e?`tap`:`idle`,t.facing=`l`,t.bubble.visible=!0,t.bubbleT+=i,t.bubbleT>1.6){t.bubbleT=0,t.item=(t.item+1)%t.order.items.length;let e=u(t.order.items[t.item].key,t.order.kind);t.bubble.material.map=e.tex,t.bubble.material.needsUpdate=!0}let s=u(t.order.items[t.item].key,t.order.kind),c=e?1+Math.sin(performance.now()/90)*.08:1;t.bubble.scale.set(s.w*n*c,s.h*n*c,1),t.bubble.position.set(t.pos.x,a+.15+Math.sin(performance.now()/400+t.slot)*.03,t.pos.z),e&&t.bubble.position.addScaledVector(r,Math.sin(performance.now()/45)*.02);break}case`happy`:if(t.t+=i,t.anim=t.pending>0?`idle`:`cheer`,t.pending<=0&&!t.paid){t.paid=!0,t.t=0,t.hop=1,w(t,`heart`,1.8);let n=t.order,r=n.tip>0?` +${Ft(n.tip)} tip`:``;e.floater(`+${Ft(n.reward)} [[icon:coin]]${r}`,t.pos.clone().setY(a+.7),`floater-gold`),e.sparkles(t.pos.clone().setY(a*.7),12,`#ffe27a`,2),e.sfx.coin()}t.paid&&t.t>1.3&&T(t,`happy`);break;case`leave`:if(t.waveT>0){t.waveT-=i,t.anim=`wave`,t.facing=`r`;break}t.anim=`walk`,D(t,m(),o,i)&&C(t)}t.hop=Math.max(0,t.hop-i*2.5);let s=t.phase===`happy`&&t.paid?Math.abs(Math.sin(t.t*9))*.12:Math.sin(t.hop*Math.PI)*.15;t.sprite.position.set(t.pos.x,s,t.pos.z),t.shadow.position.set(t.pos.x,.01,t.pos.z);let c=1-Math.max(0,e.fogAt(t.pos.x,t.pos.z)-.25)/.75;t.sprite.material.opacity=c,t.bubble.material.opacity=c,t.emote.material.opacity=c,t.shadow.visible=c>.3,E(t,i),t.emoteT>0&&(t.emoteT-=i,t.emote.visible=t.emoteT>0,t.emote.position.set(t.pos.x,a+.25+(1.6-Math.min(1.6,t.emoteT))*.12,t.pos.z))}function k(t){for(let n=g.length-1;n>=0;n--){let r=g[n];if(r.t+=t/.6,r.t<0)continue;let i=Math.min(1,r.t),o=r.v.pos.clone().setY(a*.6),s=r.from.clone().lerp(o,.5).setY(Math.max(r.from.y,o.y)+1.6),c=(1-i)*(1-i),l=2*(1-i)*i,u=i*i;r.sprite.position.set(c*r.from.x+l*s.x+u*o.x,c*r.from.y+l*s.y+u*o.y,c*r.from.z+l*s.z+u*o.z),r.sprite.material.rotation+=r.spin*t,i>=1&&(e.removeSprite(r.sprite),g.splice(n,1),--r.v.pending,r.v.hop=1,e.sparkles(o,4,`#fff3b0`,1.2),e.sfx.pop(.6))}}function A(){let e=t.orders?.list??[],n=new Set(e.map(e=>e.id));for(let t of e){let e=h.get(t.id);e?e.order=t:v(t,j)}for(let e of h.values())!e.special&&!n.has(e.order.id)&&(e.phase===`wait`||e.phase===`arrive`)&&T(e,`sad`)}let j=!1;function ee(e){A(),j=!0,k(e);for(let t of[...h.values()])O(t,e)}function M(e,t,n,r){for(let i of h.values()){if(i.phase!==`wait`)continue;let o=n(i.pos.clone().setY(a*.5));if(Math.hypot(o.x-e,o.y-t)<r)return i}return null}return{update:ee,pickAt:M,spawnMerchant:x,dismissMerchant:S,merchantLook:y}}var Jp=600,Yp=e=>e.idle??={w:0,s:{}};function Xp(e,t,n=1){let r=Yp(e);r.s[t]=(r.s[t]??0)+n}function Zp(e,t){if(t<=0)return;let n=Yp(e),r=Math.exp(-t/Jp);n.w=n.w*r+t;for(let e of Object.keys(n.s))n.s[e]*=r}function Qp(e){let t=Yp(e);return t.w<60?{}:Object.fromEntries(Object.entries(t.s).filter(([e,t])=>ht[e]&&Math.abs(t)>1e-6).map(([e,n])=>[e,n/t.w]))}function $p(e,t,n){let r=e.offlineHours*3600,i=Math.min(t,r),a={away:t,time:i,capped:t>r,gained:{},sold:0,wages:0,days:0,grown:0,lost:0},o=e.money,s=xt(e);for(let[t,n]of Object.entries(Qp(e))){let r=n>0?Math.floor(n*i):-Math.min(e.inventory[t]??0,Math.ceil(-n*i));r&&(e.inventory[t]=(e.inventory[t]??0)+r,a.gained[t]=r)}e.autoSell&&xt(e)>e.woodCap&&(a.sold=jt(e));let c=(t,n)=>{let r=Math.max(0,Math.min(n,e.inventory[t],a.gained[t]));return e.inventory[t]-=r,a.gained[t]-=r,a.lost+=r,r},l=()=>xt(e)-Math.max(e.woodCap,s),u=Object.keys(a.gained).filter(e=>a.gained[e]>0),d=l(),f=u.reduce((t,n)=>t+Math.min(a.gained[n],e.inventory[n]),0);if(d>0&&f>0){for(let t of u)c(t,Math.floor(Math.min(a.gained[t],e.inventory[t])/f*d));for(let e of u){if(d=l(),d<=0)break;c(e,d)}}let p=e.day,m=e.money,h=Mt(e,i,{quiet:!0});return a.days=e.day-p,a.wages=h*Oe(e),a.paydays=h,m>=0&&e.money<0&&(a.debt=!0),a.grown=n.fastForward(i),a.net=e.money-o,a.hasWorkers=e.workers.length>0,a}var em=1/24,tm=9,nm=(tm-1)/2,rm=(e,t)=>`${e},${t}`,im=e=>e-nm,am=[nm,nm],om=[[-2,1],[2,-2],[-2,-2],[3,0],[0,3],[0,-3]].map(([e,t])=>[e+nm,t+nm]),sm=new G(0,.55,0),cm=new G(1,0,-1).normalize(),lm=new G(1,0,1).normalize(),um=new G(12,11,12),dm=new G(0,.8,0),fm=um.clone().sub(dm).normalize(),pm=[[0,4872844,1186352],[5,4872844,1186352],[7,16764826,14271144],[9,16777215,12834488],[17,16777215,12834488],[19,16757370,13609354],[21,4872844,1186352],[24,4872844,1186352]];function mm(e,t,n){for(let r=0;r<pm.length-1;r++){let[i,a,o]=pm[r],[s,c,l]=pm[r+1];if(e>=i&&e<=s){let r=(e-i)/(s-i);t.set(a).lerp(new J(c),r),n.set(o).lerp(new J(l),r);return}}}function hm(e){return e>=21||e<5?1:e>=19?(e-19)/2:e<7?1-(e-5)/2:0}function gm(e){let t=e>>>0;return()=>(t=t*1664525+1013904223>>>0)/4294967296}var _m=Math.random,Q=(e,t)=>e+_m()*(t-e),vm=e=>e[Math.floor(_m()*e.length)];function ym(e,t,n,r=null){let i=Qe(n),a=e=>{let t=im(e.minI)-.5,n=im(e.maxI)+.5,r=im(e.minJ)-.5,i=im(e.maxJ)+.5;return{minX:t,maxX:n,minZ:r,maxZ:i,cx:(t+n)/2,cz:(r+i)/2,hx:(n-t)/2,hz:(i-r)/2}},o=a(i),s=-.45,c=(e,t)=>{let n=rf(e-o.cx,t-o.cz,o.hx,o.hz),r=Math.min(1,Math.max(0,(n-s)/3.6));return r*r*(3-2*r)},l=new Ed({antialias:!1});l.setPixelRatio(Math.min(window.devicePixelRatio,2)),l.autoClear=!1,e.appendChild(l.domElement);let u=new ra,d=new ra,f=new Vs(-1,1,1,-1,.1,100);f.position.copy(um),f.lookAt(dm);let p=0,m=8.5,h=()=>Math.max(16,o.hx+o.hz+7),g=1,_=1,v=new G(o.cx,0,o.cz),y=v.clone(),b=new Set,x=(e,t=0)=>{let n={mat:e,fog:t};return b.add(n),n},S=new J(1,1,1),C=new J(12834488),T=new J;function E(e,t){let n={value:t},r={value:T};e.onBeforeCompile=e=>{e.uniforms.uFogMix=n,e.uniforms.uFogColor=r,e.fragmentShader=`uniform float uFogMix;
uniform vec3 uFogColor;
`+e.fragmentShader.replace(`#include <fog_fragment>`,`#include <fog_fragment>
	gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, uFogMix);`)},e.customProgramCacheKey=()=>`fogmix`}let O=Qd();O.repeat.set(80,80);let k=new ko({map:O});x(k);let A=new Vo(new ts(160,160),k);A.rotation.x=-Math.PI/2,u.add(A);let j=new ko;x(j);let ee=new Vo(new ts(1,1),j);ee.rotation.x=-Math.PI/2,ee.position.y=.003,u.add(ee);let M=sf();function te(e,t,n,r=n*.6){let i=new Vo(new ts(1,1),new ko({map:M,transparent:!0,depthWrite:!1}));return i.rotation.x=-Math.PI/2,i.rotation.z=Math.PI/4,i.scale.set(n,r,1),i.position.set(e,.01,t),i.renderOrder=2,u.add(i),i}let ne=new ko({transparent:!0,depthWrite:!1}),re=new Vo(new ts(1,1),ne);re.rotation.x=-Math.PI/2,re.position.y=.05,re.renderOrder=10,u.add(re);function ie(e){ne.map?.dispose(),ne.map=af(e.hx,e.hz,16,s,3.15),ne.needsUpdate=!0,re.scale.set((e.hx+16)*2,(e.hz+16)*2,1),re.position.set(e.cx,.05,e.cz)}function P(){j.map?.dispose(),j.map=Zd(i.maxI-i.minI+1,i.maxJ-i.minJ+1,3,i.minI,i.minJ),j.needsUpdate=!0,ee.scale.set(o.hx*2,o.hz*2,1),ee.position.set(o.cx,.003,o.cz)}P(),ie(o);function F(e,t,n,{fog:r=0,center:i=[.5,0],scale:a=1}={}){let o=new so({map:e,alphaTest:.5,transparent:!1}),s=x(o);r>0&&E(o,r);let c=new So(o);return c.center.set(i[0],i[1]),c.scale.set(t*em*a,n*em*a,1),c.userData.tintEntry=s,d.add(c),c}function I(e){d.remove(e),b.delete(e.userData.tintEntry),e.material.dispose()}let ce=cf(!1),le=cf(!0),ue=F(ce,24,20,{scale:1.1}),de=ue.scale.clone();te(0,.05,1.5);let pe=0,me=0,he={oak:Md,birch:[{light:`#a8cf52`,mid:`#7fa832`,hi:`#c8e270`},{light:`#c4c04a`,mid:`#a0a02c`,hi:`#dcd868`}],pine:[{light:`#2e7a48`,mid:`#1f5a38`,hi:`#45995c`},{light:`#2e7068`,mid:`#215454`,hi:`#448c80`}]},ge=new Map;function _e(e,t){let n=N(e),r=n.variants.includes(t)?t:n.variants[t%n.variants.length],i=`${n.id}:${r}`;if(!ge.has(i)){let e=Ud(`mature`,r,n.style);ge.set(i,{mature:Gd(e),young:Gd(Ud(`young`,r,n.style)),sapling:Gd(Ud(`sapling`,r,n.style)),stump:Gd(Ud(`stump`,0,n.style)),flash:Gd(Wd(e)),alpha:e.getContext(`2d`).getImageData(0,0,48,64),pal:he[n.id][r%he[n.id].length]})}return ge.get(i)}let ye=e=>_e(e.species,e.variant),be=48*em,L=64*em,xe=[],Se=new Map,Ce=(e,t)=>e===am[0]&&t===am[1],R=(e,t)=>e>=i.minI&&t>=i.minJ&&e<=i.maxI&&t<=i.maxJ,we=new Map,z=new Map,B=(e,t)=>R(e,t)&&!Ce(e,t)&&!Se.has(rm(e,t))&&!we.has(rm(e,t))&&!z.has(rm(e,t));function Te(e,t,n,{growing:r=!1,auto:i=!0,species:a=`oak`}={}){let o=im(e),s=im(t),c=N(a);c.variants.includes(n)||(n=c.variants[n%c.variants.length]);let l=_e(c.id,n),u=F(r?l.sapling:l.mature,48,64);u.position.set(o,0,s);let f=new So(new so({map:l.flash,transparent:!0,depthWrite:!1,blending:2,opacity:0}));f.center.set(.5,0),f.position.copy(u.position),f.renderOrder=3,f.visible=!1,d.add(f);let p={sprite:u,flash:f,x:o,z:s,variant:n,cell:[e,t],auto:i,species:c.id,phase:r?`growing`:`grown`,hp:c.hp,autoRegrow:!1,reservedBy:null,growth:0,hitT:0,flashT:0,fall:0,fallDir:1,stumpTimer:0,swayPhase:_m()*10,hpEl:null,hpTimer:0};return u.userData.tree=p,te(o,s,1.9),xe.push(p),Se.set(rm(e,t),p),p}if(r?.trees?.length)for(let e of r.trees){if(!R(...e.cell)||Se.has(rm(...e.cell)))continue;let t=e.phase===`falling`?`grown`:e.phase,n=Te(...e.cell,e.variant??0,{growing:t!==`grown`,auto:e.auto!==!1,species:e.species});n.phase=t,n.growth=e.growth??0,n.hp=t===`grown`?e.hp??N(n.species).hp:N(n.species).hp,n.autoRegrow=!!e.autoRegrow,n.stumpTimer=e.stumpTimer??0,t===`stump`?n.sprite.material.map=ye(n).stump:t===`growing`&&(n.sprite.material.map=n.growth>=.4?ye(n).young:ye(n).sapling)}else Te(...om[0],0);let Ee=()=>xe.length+we.size,De=gm(4242),Oe=[[0,0,1.3],...xe.map(e=>[e.x,e.z,.8])],ke=[];function Ae(e,t){let n=im(e),r=im(t);for(let e of ke)Math.abs(e.x-n)<.6&&Math.abs(e.z-r)<.6&&(e.sprite.visible=!1,e.shadow&&(e.shadow.visible=!1))}let je=[];function Me(e,t,n,r,i){for(let a=0;a<40;a++){let a=e+De()*(t-e),o=n+De()*(r-n);if(!Oe.some(([e,t,n])=>Math.hypot(a-e,o-t)<n)&&!je.some(([e,t])=>Math.hypot(a-e,o-t)<i))return je.push([a,o]),[a,o]}return null}let Ne=[0,1,2].map(e=>Gd(Jd(e))),Pe=[`#f4e04d`,`#ffffff`,`#f08fb0`,`#9ad0ff`,`#e8603c`].map(e=>Gd(Yd(e))),Fe=Gd(Xd()),Ie=[0,1].map(e=>Gd(qd(e)));function Le(e,t,n,r){let i=[e+.35,t-.35,n+.35,r-.35],a=(t-e)*(r-n)/(tm*tm),o=(e,t,n,r,o,s=!1)=>{for(let c=0;c<Math.round(r*a);c++){let r=Me(...i,o);if(!r)continue;let a=F(Array.isArray(e)?e[Math.floor(De()*e.length)]:e,t,n);a.position.set(r[0],0,r[1]),ke.push({sprite:a,shadow:s?te(r[0],r[1],.6):null,x:r[0],z:r[1]})}};o(Ne,9,7,18,.45),o(Pe,7,8,10,.5),o(Fe,8,7,2,.8),o(Ie,14,10,2,.9,!0)}Le(o.minX,o.maxX,o.minZ,o.maxZ);let Re=Gd(ef()),ze=new Map;function Ve(e,t,r){let i=rm(e,t);if(n.soils[i]=r,ze.has(i))return;let a=new ko({map:Re,transparent:!0,alphaTest:.5});x(a);let o=new Vo(new ts(1,1),a);o.rotation.x=-Math.PI/2,o.position.set(im(e),.006,im(t)),o.renderOrder=1,u.add(o),ze.set(i,o),Ae(e,t)}for(let[e,t]of Object.entries(n.soils))Ve(...e.split(`,`).map(Number),t);let He=Gd($d()),Ue=new Map;function We(e,t){let r=rm(e,t);if(Ue.has(r))return;let i=new ko({map:He,transparent:!0,alphaTest:.5});x(i);let a=new Vo(new ts(1,1),i);a.rotation.x=-Math.PI/2,a.position.set(im(e),.008,im(t)),a.renderOrder=1,u.add(a),Ue.set(r,a),n.beds.includes(r)||n.beds.push(r),Ae(e,t)}let Ge=e=>Ue.has(e)&&!Se.has(e)&&!we.has(e),Ke=()=>[...Ue.keys()].filter(Ge),qe=()=>Math.max(0,n.treeCap-Ue.size),Je=new Set((r?.buildings??[]).flatMap(e=>{let t=tp[e.type]?.size??1;return Array.from({length:t*t},(n,r)=>rm(e.cell[0]+r%t,e.cell[1]+Math.floor(r/t)))}));function Ye(){let e=(e,t)=>R(e,t)&&!Ce(e,t)&&!Ue.has(rm(e,t))&&!z.has(rm(e,t))&&!Je.has(rm(e,t))&&!Se.has(rm(e,t));for(let[t,n]of om)if(e(t,n))return[t,n];for(let t=2;t<12;t++)for(let n=-t;n<=t;n++)for(let r=-t;r<=t;r++){if(Math.max(Math.abs(r),Math.abs(n))!==t)continue;let i=am[0]+r,a=am[1]+n;if(e(i,a))return[i,a]}return null}for(let e of n.beds){let[t,n]=e.split(`,`).map(Number);R(t,n)&&We(t,n)}if(!Ue.size){for(let e of xe)We(...e.cell);for(let e of r?.seeds??[])We(...Array.isArray(e)?e:e.cell);for(;qe()>0;){let e=Ye();if(!e)break;We(...e)}}let Xe=[0,1,2].map(e=>Gd(Kd(e))),Ze=[];function $e(){for(let e of Ze)I(e);Ze=[];let e=gm(99),t=(t,n)=>{for(let r=0;r<40;r++){let r=o.cx+(e()*2-1)*(o.hx+n),i=o.cz+(e()*2-1)*(o.hz+n),a=rf(r-o.cx,i-o.cz,o.hx,o.hz);if(a>=t&&a<=n)return[r,i]}return null},n=(o.hx+o.hz)/tm;for(let r=0;r<Math.round(34*n);r++){let n=t(1.5,4.5);if(!n)continue;let[r,i]=n;if(r-o.cx+(i-o.cz)>(o.hx+o.hz)*.3)continue;let a=F(_e(`oak`,Math.floor(e()*3)).mature,48,64,{fog:Math.min(.88,.42+c(r,i)*.55),scale:.8+e()*.3});a.position.set(r,0,i),Ze.push(a)}for(let e=0;e<Math.round(16*n);e++){let n=t(.3,2);if(!n)continue;let r=F(Xe[e%3],22,16,{fog:Math.min(.85,.2+c(...n)*.7)});r.position.set(n[0],0,n[1]),Ze.push(r)}}$e();let et=of(),tt=[];for(let e=0;e<18;e++){let t=new So(new so({map:et,transparent:!0,opacity:.5,depthWrite:!1}));t.userData={angle:e/18*Math.PI*2,r:.9+e%3*.5,speed:.04+e%4*.015,phase:e*1.7};let n=4+e%3;t.scale.set(n,n*.7,1),t.renderOrder=6,tt.push(t),d.add(t)}let rt=ff(),it=pf(),at=[],ot=[];function st({tex:e=rt,pos:t,vel:n=new G,color:r=`#ffffff`,size:i=.08,life:a=1,gravity:o=9,drag:s=0,ground:c=!0,sway:l=0,additive:u=!1,grow:f=0,spin:p=0,stretch:m=1}){let h=ot.pop()??new So(new so({transparent:!0,depthWrite:!1}));h.material.map=e,h.material.blending=u?2:1,h.material.opacity=1,h.material.rotation=m===1?_m()*Math.PI:0,h.material.needsUpdate=!0,h.position.copy(t),h.scale.set(i,i*m,1),h.renderOrder=4,d.add(h),at.push({s:h,vel:n.clone(),base:new J(r),size:i,life:a,max:a,gravity:o,drag:s,ground:c,sway:l,grow:f,spin:p,stretch:m,age:0,phase:_m()*6,resting:!1})}function ct(e){for(let t=at.length-1;t>=0;t--){let n=at[t];if(n.age+=e,n.life-=e,n.life<=0){d.remove(n.s),ot.push(n.s),at.splice(t,1);continue}n.resting||(n.vel.y-=n.gravity*e,n.drag&&n.vel.multiplyScalar(Math.max(0,1-n.drag*e)),n.s.position.addScaledVector(n.vel,e),n.sway&&n.s.position.addScaledVector(cm,Math.sin(n.age*4+n.phase)*n.sway*e),n.s.material.rotation+=n.spin*e,n.ground&&n.s.position.y<=.03&&(n.s.position.y=.03,n.resting=!0));let r=Math.min(1,n.life/Math.min(.35,n.max*.5));n.s.material.opacity=r;let i=n.size*(1+n.grow*n.age);n.s.scale.set(i,i*n.stretch,1),n.s.material.color.copy(n.base).multiply(S)}}let lt=[`#e2b878`,`#c4924f`,`#a8743c`,`#6e4220`];function ut(e,t=8){for(let n=0;n<t;n++){let t=cm.clone().multiplyScalar(Q(-2.2,2.2)).addScaledVector(lm,Q(.3,1.2));t.y=Q(1.8,3.8),st({pos:e,vel:t,color:vm(lt),size:Q(.06,.11),life:Q(.7,1.1),gravity:11,spin:Q(-8,8)})}}function dt(e,t,n=1.4,r=1.5){let i=ye(e).pal;for(let a=0;a<t;a++)st({pos:new G(e.x,Q(r,r+1),e.z).addScaledVector(cm,Q(-n,n)/2),vel:new G(Q(-.3,.3),Q(0,.8),Q(-.3,.3)),color:vm([i.light,i.mid,i.hi]),size:Q(.07,.1),life:Q(1.6,2.6),gravity:1.3,drag:1.5,sway:1.6,spin:Q(-3,3)})}function ft(e,t,n=`#ffe27a`,r=1.5){for(let i=0;i<t;i++){let t=new G(Q(-1,1),Q(.3,1.2),Q(-1,1)).multiplyScalar(r);st({tex:it,pos:e,vel:t,color:n,size:Q(.1,.16),life:Q(.35,.6),gravity:1.5,ground:!1,additive:!0,grow:-1.2})}}function pt(e,t){for(let n=0;n<t;n++){let t=new G(Q(-1.2,1.2),Q(.2,.7),Q(-1.2,1.2));st({tex:et,pos:e.clone().add(new G(Q(-.3,.3),.1,Q(-.3,.3))),vel:t,color:`#d8c8a8`,size:Q(.4,.7),life:Q(.5,.8),gravity:0,drag:3,ground:!1,grow:1.5})}}let mt=new Map;function _t(e){if(!mt.has(e)){let t=pp(e);mt.set(e,{tex:Gd(t),w:t.width,h:t.height})}return mt.get(e)}let vt={log:`wood`,gold:`goldwood`},bt=1.15,St=[],wt=0;function Tt(e,t,n=`wood`,r=!1){n=vt[n]??n;let i=_t(n),a=F(i.tex,i.w,i.h,{center:[.5,.5],scale:bt});a.position.copy(e);let o=a.scale.clone(),s=te(e.x,e.z,.55);St.push({sprite:a,shadow:s,base:o,vel:t,kind:n,idle:r,state:`air`,t:0,from:null,mid:null,restY:i.h*em*bt/2,spin:Q(-9,9),phase:_m()*6,hover:0,twinkle:Q(.5,2),trail:0,restTime:0})}let Et=0,Dt=()=>xt(n)+wt+Et<n.woodCap;function Ot(e){if(Dt()||Pt(),!Dt()){Gf(),H(`Chest full!`,e.sprite.position.clone().setY(.9),`floater-warn`),Be(`chestFull`),e.state=`air`,e.vel.set(0,2.2,0);return}if(Uf(),kt(e),n.pickupRadius>0){let t=e.sprite.position;for(let r of St)r.state!==`fly`&&r.state!==`carried`&&r!==e&&(r.sprite.position.distanceTo(t)>n.pickupRadius||Dt()&&kt(r,Q(.03,.15)))}}function kt(e,t=0){ft(e.sprite.position,5,e.kind===`goldwood`?`#ffd76a`:`#fff3b0`,1.2),e.state=`fly`,e.t=-t/.55,e.from=e.sprite.position.clone();let n=e.from.distanceTo(sm);e.mid=e.from.clone().lerp(sm,.5).add(new G(0,1.6+n*.15,0)),wt++}function At(e,t){I(e.sprite),u.remove(e.shadow),St.splice(t,1),wt--,pe=.5,me=1,Wf(),n.inventory[e.kind]=(n.inventory[e.kind]??0)+1,e.idle&&Xp(n,e.kind),ht[e.kind]?.type===`sapling`?(ft(sm.clone().setY(.7),6,`#b8ff8a`),H(`+1 [[icon:sapling]]`,new G(0,1.5,0),`floater-sapling`)):e.kind===`goldwood`?(ft(sm.clone().setY(.7),14),H(`+1 Gold`,new G(0,1.5,0),`floater-gold`)):(ft(sm.clone().setY(.7),7),H(`+1`,new G(0,1.5,0),`floater-wood`)),Be(`itemDeposited`,{kind:e.kind}),xt(n)>=n.woodCap&&Be(`chestFull`)}let Mt=()=>xt(n)+wt+Et>=n.woodCap,Nt=0;function Pt(){if(!n.autoSell)return 0;let e=jt(n);return e>0&&(qf(),ft(sm.clone().setY(.9),12,`#ffe27a`,2),H(`+${Ft(e)} [[icon:coin]]`,new G(0,2.1,0),`floater-gold`),Be(`sold`,{earned:e,auto:!0})),e}function It(e){Nt-=e,!(Nt>0)&&(Nt=.3,n.autoSell&&Mt()&&Pt())}for(let e of r?.items??[]){let t=_t(vt[e.kind]??e.kind);Tt(new G(e.x,t.h*em*bt/2,e.z),new G,e.kind,!!e.idle)}function Lt(e,t){for(let r=St.length-1;r>=0;r--){let i=St[r];if(i.state===`carried`)continue;let a=i.sprite;if(i.state===`air`){i.vel.y-=14*e,a.position.addScaledVector(i.vel,e),a.material.rotation+=i.spin*e;for(let[e,t,n]of[[`x`,o.minX,o.maxX],[`z`,o.minZ,o.maxZ]]){let r=Zr.clamp(a.position[e],t+.35,n-.35);r!==a.position[e]&&(a.position[e]=r,i.vel[e]*=-.5)}a.position.y<=i.restY&&(a.position.y=i.restY,i.vel.y<-1.4?(Hf(Math.min(.14,-i.vel.y*.02)),i.vel.y*=-.38,i.vel.x*=.55,i.vel.z*=.55,i.spin*=.4):(i.state=`rest`,i.restTime=0,i.vel.set(0,0,0),a.material.rotation=Q(-.25,.25)))}else if(i.state===`rest`){if(a.position.y=i.restY+Math.sin(t*3+i.phase)*.03,i.twinkle-=e,i.twinkle<=0){let e=i.kind===`goldwood`;i.twinkle=e?Q(.3,.7):Q(1.4,3),st({tex:it,pos:a.position.clone().add(new G(0,.15,0)).addScaledVector(cm,Q(-.25,.25)),color:e?`#ffe27a`:`#ffffff`,size:.14,life:.35,gravity:0,ground:!1,additive:!0,grow:-1.5})}i.restTime+=e,n.magnet&&i.restTime>n.magnetDelay&&!i.reservedBy&&Dt()&&kt(i)}else if(i.state===`fly`){if(i.t=Math.min(1,i.t+e/.55),i.t<0)continue;let t=i.t*i.t*(3-2*i.t),n=(1-t)*(1-t),o=2*(1-t)*t,s=t*t;if(a.position.set(n*i.from.x+o*i.mid.x+s*sm.x,n*i.from.y+o*i.mid.y+s*sm.y,n*i.from.z+o*i.mid.z+s*sm.z),a.material.rotation+=11*e,i.trail-=e,i.trail<=0&&(i.trail=.035,st({tex:it,pos:a.position,color:`#ffd76a`,size:.11,life:.3,gravity:0,ground:!1,additive:!0,grow:-2})),i.t>=1){At(i,r);continue}}i.hover+=(+(i===un)-i.hover)*Math.min(1,e*14);let s=i.state===`fly`?1-Math.max(0,i.t-.75)*1.6:1,c=(1+i.hover*.25)*s;a.scale.set(i.base.x*c,i.base.y*c,1),i.shadow.position.set(a.position.x,.01,a.position.z);let l=Math.max(0,a.position.y-i.restY),u=Math.max(.2,1-l*.35)*(i.state===`fly`?.7:1);i.shadow.scale.set(.55*u,.33*u,1)}}let Rt=[`#f4e04d`,`#ffffff`,`#f08fb0`].map((e,t)=>{let n=[mf(!0,e),mf(!1,e)],r=F(n[0],7,5,{center:[.5,.5],scale:1.4});return r.position.set(Q(-3,3),1,Q(-3,3)),{s:r,frames:n,target:new G,flap:0,retarget:0,phase:t}}),zt=Array.from({length:14},()=>{let e=new So(new so({map:rt,transparent:!0,depthWrite:!1,blending:2,color:14221178}));return e.scale.set(.07,.07,1),e.position.set(Q(o.minX,o.maxX),Q(.3,1.6),Q(o.minZ,o.maxZ)),d.add(e),{s:e,phase:_m()*10,vel:new G}});function Bt(e,t){let r=hm(n.hour);for(let n of Rt){n.s.visible=r<.5,n.retarget-=e,n.retarget<=0&&(n.retarget=Q(1.5,3.5),n.target.set(Q(o.minX+.6,o.maxX-.6),Q(.5,1.5),Q(o.minZ+.6,o.maxZ-.6)));let i=n.target.clone().sub(n.s.position),a=i.length();a>.05&&n.s.position.addScaledVector(i.normalize(),Math.min(a,e*.9)),n.s.position.y+=Math.sin(t*6+n.phase)*.006,n.flap+=e,n.s.material.map=Math.floor(n.flap*9)%2?n.frames[1]:n.frames[0]}for(let n of zt)n.s.visible=r>.05,n.vel.add(new G(Q(-1,1),Q(-.6,.6),Q(-1,1)).multiplyScalar(e*1.5)),n.vel.multiplyScalar(.98),n.s.position.addScaledVector(n.vel,e),n.s.position.x=Zr.clamp(n.s.position.x,o.minX-1,o.maxX+1),n.s.position.z=Zr.clamp(n.s.position.z,o.minZ-1,o.maxZ+1),n.s.position.y=Zr.clamp(n.s.position.y,.2,2),n.s.material.opacity=r*(.35+.65*Math.max(0,Math.sin(t*2.5+n.phase)))}function Vt(e){f.updateMatrixWorld();let t=e.clone().project(f);return{x:(t.x*.5+.5)*g,y:(-t.y*.5+.5)*_}}function H(e,n,r=``){let{x:i,y:a}=Vt(n),o=document.createElement(`div`);o.className=`floater `+r,D(o,e),o.style.left=i+`px`,o.style.top=a+`px`,t.appendChild(o),setTimeout(()=>o.remove(),1e3)}let Ht=.4,Ut={default:`var(--cur-default)`,pointer:`var(--cur-pointer)`,axe:`var(--cur-axe)`},Wt=Sf(),Gt=document.createElement(`div`);Gt.className=`axe-swing-wrap`;let Kt=document.createElement(`div`);Kt.className=`axe-swing`;let qt=Wt.canvas.width*3,[Jt,Yt]=Wt.edge.map(e=>e*3),[Xt,Zt]=Wt.grip.map(e=>e*3);Object.assign(Kt.style,{width:qt+`px`,height:qt+`px`,left:-Jt+`px`,top:-Yt+`px`,transformOrigin:`${Xt}px ${Zt}px`,backgroundImage:`url("${Cf(3).toDataURL()}")`});let Qt=wf(3,105),$t=document.createElement(`div`);$t.className=`axe-swoosh`,Object.assign($t.style,{width:Qt.size+`px`,height:Qt.size+`px`,left:-Jt+Xt-Qt.size/2+`px`,top:-Yt+Zt-Qt.size/2+`px`,backgroundImage:`url("${Qt.canvas.toDataURL()}")`}),Gt.append($t,Kt),t.appendChild(Gt);let en=[],tn=0,nn=Ut.default;function rn(e,t,n){for(let e of en)e.cancel();Gt.style.display=`block`,Gt.style.left=e+`px`,Gt.style.top=t+`px`,Gt.style.transform=n?`scaleX(-1)`:`none`,Kt.classList.remove(`crit`);let r=Kt.animate([{transform:`rotate(30deg)`,opacity:0,offset:0,easing:`ease-out`},{transform:`rotate(105deg)`,opacity:1,offset:.24,easing:`cubic-bezier(0.6, 0, 1, 0.5)`},{transform:`rotate(-7deg)`,offset:Ht,easing:`ease-out`},{transform:`rotate(4deg)`,offset:.5},{transform:`rotate(0deg)`,offset:.58},{transform:`rotate(0deg)`,opacity:1,offset:.8,easing:`ease-in`},{transform:`rotate(30deg)`,opacity:0,offset:1}],{duration:400,fill:`forwards`});en=[r,$t.animate([{opacity:0,offset:0},{opacity:0,offset:.27},{opacity:1,offset:Ht},{opacity:0,offset:.62}],{duration:400,fill:`forwards`})],tn=performance.now()+400,l.domElement.style.cursor=`none`,r.onfinish=()=>{performance.now()<tn-5||(Gt.style.display=`none`,l.domElement.style.cursor=nn)}}function an(e,n,r){let i=document.createElement(`div`);i.className=r?`hit-burst crit`:`hit-burst`,i.style.left=e+`px`,i.style.top=n+`px`,t.appendChild(i),setTimeout(()=>i.remove(),320),r&&Kt.classList.add(`crit`)}function on(e,n){let r=new G(e.x,.5+Q(-.06,.12),e.z),i=Vt(r),a=t.getBoundingClientRect();rn(i.x,i.y,n-a.left<i.x),setTimeout(()=>{e.phase===`grown`&&Wn(e,r,i)},400*Ht)}function sn(e){e.hpEl||(e.hpEl=document.createElement(`div`),e.hpEl.className=`hpbar`,e.hpEl.innerHTML=w(`<div class="hpbar-fill"></div>`),t.appendChild(e.hpEl)),e.hpTimer=2.5;let n=Math.max(0,e.hp/N(e.species).hp),r=e.hpEl.firstChild;r.style.width=n*100+`%`,r.style.background=n>.5?`#7fc95e`:n>.25?`#f0c84a`:`#e8603c`,e.hpEl.classList.remove(`hit`),e.hpEl.offsetWidth,e.hpEl.classList.add(`hit`)}let cn=new ac,ln=new Qr,un=null;function dn(e){let t=l.domElement.getBoundingClientRect();return{x:e.clientX-t.left,y:e.clientY-t.top}}function fn(e){let{x:t,y:n}=dn(e),r=Math.max(16,_/m*.42),i=null,a=r;for(let e of St){if(e.state===`fly`||e.state===`carried`)continue;let r=Vt(e.sprite.position),o=Math.hypot(r.x-t,r.y-n);o<a&&(a=o,i=e)}return i}function pn(e){let{x:t,y:n}=dn(e);ln.set(t/g*2-1,-(n/_)*2+1),f.updateMatrixWorld(),cn.setFromCamera(ln,f);let r=cn.intersectObjects(xe.filter(e=>e.phase===`grown`).map(e=>e.sprite),!1);for(let e of r){let t=e.object.userData.tree;if(mn(ye(t).alpha,e.uv))return{tree:t,point:e.point}}return null}function mn(e,t){if(!t)return!0;let n=Math.floor(t.x*e.width),r=Math.floor((1-t.y)*e.height);for(let t=-2;t<=2;t++)for(let i=-2;i<=2;i++){let a=n+i,o=r+t;if(!(a<0||o<0||a>=e.width||o>=e.height)&&e.data[(o*e.width+a)*4+3]>0)return!0}return!1}let hn=new io(new G(0,1,0),0),gn=new Vo(new ts(1,1),new ko({transparent:!0,depthWrite:!1}));gn.rotation.x=-Math.PI/2,gn.renderOrder=3,gn.visible=!1,u.add(gn);function _n(){let e=gn.material;e.map?.dispose(),e.map=tf(i.maxI-i.minI+1,i.maxJ-i.minJ+1),e.needsUpdate=!0,gn.scale.set(o.hx*2,o.hz*2,1),gn.position.set(o.cx,.012,o.cz)}_n();let vn=new ko({map:nf(),transparent:!0,depthWrite:!1}),yn=new Vo(new ts(1,1),vn);yn.rotation.x=-Math.PI/2,yn.position.y=.014,yn.renderOrder=4,yn.visible=!1,u.add(yn);let bn=new So(new so({map:_e(`oak`,0).sapling,transparent:!0,opacity:.7,depthWrite:!1}));bn.center.set(.5,0),bn.scale.set(be,L,1),bn.visible=!1,d.add(bn);let xn=new Vo(new ts(1,1),new ko({map:Re,transparent:!0,opacity:.75,depthWrite:!1}));xn.rotation.x=-Math.PI/2,xn.position.y=.01,xn.renderOrder=3,xn.visible=!1,u.add(xn);let Sn=document.createElement(`div`);Sn.className=`place-banner`,Sn.hidden=!0,Sn.innerHTML=w(`<span class="place-text"></span><span class="place-hint">Right-click / ESC: done</span><button class="place-cancel">Done</button>`),e.parentElement.appendChild(Sn);let Cn=Sn.querySelector(`.place-text`);Sn.querySelector(`.place-cancel`).addEventListener(`click`,()=>Dn());let wn=null,Tn=null;function En(e){Dn(),wn=e,gn.visible=!0,Sn.hidden=!1,Tn=null,l.domElement.style.cursor=Ut.pointer,zf(1.3,.12)}function Dn(){wn&&(wn=null,gn.visible=!1,yn.visible=!1,bn.visible=!1,xn.visible=!1,q.visible=!1,oi.visible=!1,Sn.hidden=!0,l.domElement.style.cursor=Ut.default)}function On(e){let{x:t,y:n}=dn(e);return ln.set(t/g*2-1,-(n/_)*2+1),f.updateMatrixWorld(),cn.setFromCamera(ln,f),cn.ray.intersectPlane(hn,new G)}function kn(e){let t=On(e);if(!t)return null;let n=Math.round(t.x+nm),r=Math.round(t.z+nm);return R(n,r)?[n,r]:null}function An(e){if(!wn)return;if(D(Cn,wn.label()),!Tn){yn.visible=bn.visible=xn.visible=q.visible=oi.visible=!1;return}let[t,n]=Tn,r=wn.isValid(t,n)===!0,i=wn.size??1,a=(i-1)/2;yn.visible=!0,yn.position.set(im(t)+a,.014,im(n)+a),vn.color.set(r?9305962:16734794);let o=1+Math.sin(e*8)*.04;if(yn.scale.set(i*o,i*o,1),q.visible=wn.ghost===`building`,oi.visible=wn.ghost===`building`&&!!wn.decalTex,q.visible){let e=wn.type===`sawmill`;q.material.map=e?zr[0].idle:Br[wn.type],q.material.needsUpdate=!0,q.scale.set((e?49.4:17.6)*em,(e?48*.95:22)*em,1),q.position.set(im(t)+a,0,im(n)+a),q.material.color.set(r?16777215:16747130)}oi.visible&&(oi.material.map=wn.decalTex,oi.material.needsUpdate=!0,oi.position.set(im(t),.013,im(n))),bn.visible=wn.ghost===`sapling`&&r,xn.visible=(wn.ghost===`soil`||wn.ghost===`bed`)&&r,bn.position.set(im(t),0,im(n)),xn.position.set(im(t),.01,im(n))}function jn(e,t){let n=wn.isValid(e,t);if(n!==!0){Gf(),H(n,new G(im(e),.8,im(t)),`floater-warn`);return}wn.place.call(wn,e,t),wn.keepGoing()||Dn()}function Mn(e=null){let t=N(e??oe(n.inventory,`oak`,0)??`oak`),r=t.sapling;(n.inventory[r]??0)<=0||(bn.material.map=_e(t.id,t.variants[0]).sapling,En({ghost:`sapling`,isValid:(e,t)=>{if(Ce(e,t))return`Chest is here`;let n=Se.get(rm(e,t));return n?n.phase===`stump`&&!n.autoRegrow||`This bed is taken`:we.has(rm(e,t))?`This bed is taken`:Ue.has(rm(e,t))?!0:Ke().length?`Trees only grow in tree beds`:`All tree beds are full`},place:(e,i)=>{--n.inventory[r];let a=Se.get(rm(e,i));if(a){_r(a,t.id);return}if(n.workers.length){kr(e,i,!1,t.id);return}let o=Te(e,i,vm(t.variants),{growing:!0,auto:!1,species:t.id});o.growth=n.headStart,Ae(e,i),Uf(),pt(new G(o.x,0,o.z),3),ft(new G(o.x,.4,o.z),8,`#b8ff8a`,1.2),H(`Planted!`,new G(o.x,1,o.z),`floater-sapling`)},keepGoing:()=>(n.inventory[r]??0)>0,label:()=>`${t.icon} Plant ${t.name} · ${n.inventory[r]} left · ${Ke().length} free tree bed${Ke().length===1?``:`s`} · [[icon:hand]] bed or stump`}))}function Nn(){return qe()<=0?!1:(xn.material.map=He,xn.material.needsUpdate=!0,En({ghost:`bed`,isValid:(e,t)=>{let n=rm(e,t);return Ce(e,t)?`Chest is here`:Ue.has(n)?`Already a tree bed`:z.has(n)?`A building is here`:Se.has(n)||we.has(n)?`Tile taken`:!0},place:(e,t)=>{We(e,t);let n=new G(im(e),0,im(t));Hf(.25),Kf(),pt(n,6),ft(n.clone().setY(.3),18,`#b8ff8a`,1.8),H(`New tree bed!`,n.clone().setY(1),`floater-level`),Be(`bedPlaced`)},keepGoing:()=>qe()>0,label:()=>`[[icon:oak]] New tree bed · ${qe()} to place · [[icon:hand]] pick any free tile`}),!0)}function Pn(e){let t=gt[e];xn.material.map=Re,xn.material.needsUpdate=!0;let r=()=>Ct(n,e);En({ghost:`soil`,isValid:(t,i)=>Ce(t,i)?`Chest is here`:n.soils[rm(t,i)]===e?`Already here`:n.money<r()?`Not enough coins`:!0,place:(t,i)=>{n.money-=r(),Ve(t,i,e),Hf(.2),pt(new G(im(t),0,im(i)),4),ft(new G(im(t),.2,im(i)),6,`#d8aa6a`,1)},keepGoing:()=>n.money>=r(),label:()=>`[[icon:planks]] ${t.name} · [[icon:coin]] ${Ft(r())} per tile · [[icon:hand]] tile`})}l.domElement.addEventListener(`contextmenu`,e=>e.preventDefault()),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&Dn()});let Fn=null,In=e=>(e.x=Zr.clamp(e.x,o.minX,o.maxX),e.z=Zr.clamp(e.z,o.minZ,o.maxZ),e),Ln=()=>f.position.copy(um).add(v);function Rn(e){let t=On(e);t&&(Fn={sx:e.clientX,sy:e.clientY,grab:t,moved:!1})}function zn(e){if(!Fn.moved){if(Math.hypot(e.clientX-Fn.sx,e.clientY-Fn.sy)<5)return;Fn.moved=!0,l.domElement.setPointerCapture(e.pointerId),l.domElement.style.cursor=`grabbing`}Ln();let t=On(e);t&&(In(v.add(Fn.grab.clone().sub(t))),y.copy(v),Ln())}function Bn(){Fn?.moved&&(l.domElement.style.cursor=wn?Ut.pointer:Ut.default),Fn=null}l.domElement.addEventListener(`pointerup`,Bn),l.domElement.addEventListener(`pointercancel`,Bn),l.domElement.addEventListener(`pointerdown`,e=>{if(e.button===1){e.preventDefault(),Rn(e);return}if(wn){if(e.button===2)Dn();else if(e.button===0){let t=kn(e);t&&jn(...t)}return}if(e.button!==0)return;let t=fn(e);if(t){Ot(t);return}let n=pn(e);if(n){on(n.tree,e.clientX);return}let r=vr(e);if(r){U(r);return}let i=ai(e);if(i){i.bounce=1,zf(1,.15),Fr?.(i);return}let a=ii(e);if(a){a.hop=1,zf(1.3,.15),di?.(a.order);return}let o=yr(e);if(o){br(...o);return}Rn(e)}),l.domElement.addEventListener(`pointermove`,e=>{if(Fn&&!e.buttons&&Bn(),Fn&&(zn(e),Fn.moved))return;if(wn){Tn=kn(e);return}un=fn(e),nn=un?Ut.pointer:pn(e)?Ut.axe:vr(e)||ai(e)||ii(e)||yr(e)?Ut.pointer:Ut.default;let t=performance.now()<tn?`none`:nn;l.domElement.style.cursor!==t&&(l.domElement.style.cursor=t)}),l.domElement.addEventListener(`pointerleave`,()=>{un=null,Tn=null}),l.domElement.addEventListener(`wheel`,e=>{e.preventDefault(),m=Math.min(h(),Math.max(6,m+Math.sign(e.deltaY)*.8)),cr()},{passive:!1});let Vn=0,Hn=-10,Un=e=>Number.isInteger(e)?String(e):e.toFixed(1);function Wn(e,t,r){e.lastHitBy=null;let i=performance.now()/1e3;Vn=n.combo&&i-Hn<.8?Math.min(n.comboMax,Vn+1):0,Hn=i;let a=n.critChance+(n.frenzy?Vn*.015:0),o=_m()<a,s=n.clickPower*n.clickPowerMult*(o?n.critMult:1)*(1+Vn*.1);e.hp-=s,e.hitT=1,e.flashT=1;let c=t.clone().addScaledVector(fm,.4);an(r.x,r.y,o),dt(e,o?6:3);let l=t.clone().add(new G(0,.35,0));if(o?(Qf(),p=Math.max(p,.1),ut(c,16),ft(c,8,`#ffb14a`,2.2),H(`CRIT! -${Un(s)}`,l,`floater-crit`)):(Bf(),p=Math.max(p,.035),ut(c,8),H(`-${Un(s)}`,l,`floater-dmg`)),Vn>=2&&H(`Combo ×${(1+Vn*.1).toFixed(1)}`,new G(e.x,L+.5,e.z),`floater-combo`),_m()<n.splinterChance){let t=lm.clone().multiplyScalar(Q(.6,1.4)).add(new G(Q(-.6,.6),3.8,Q(-.6,.6)));Tt(new G(e.x,.6,e.z),t,N(e.species).log),H(`Splinter!`,l.clone().setY(l.y+.3),`floater-sapling`)}sn(e),e.hp<=0&&(e.phase=`falling`,e.fall=0,e.fallDir=_m()<.5?-1:1)}function Gn(e){Vf(),p=.22;let t=cm.clone().multiplyScalar(-e.fallDir),r=new G(e.x,0,e.z);for(let e=0;e<5;e++)pt(r.clone().addScaledVector(t,.4+e*.4),2);dt({...e,x:e.x+t.x*1.4,z:e.z+t.z*1.4},16,1.6,.2);let i=N(e.species),a=n.tutorial===`chop`,o=a?1:n.woodPerTree+i.logBonus,s=!!e.lastHitBy,c=e===Qn;c&&(Qn=null,ft(r.clone().setY(1),30,`#ffe27a`,3),H(`GOLD!`,r.clone().setY(1.8),`floater-gold`),Zf(),Be(`goldenTreeFelled`)),Be(`treeFelled`);for(let e=0;e<o;e++)Tt(r.clone().addScaledVector(t,.5+e/Math.max(1,o-1)*1.3).setY(.5),t.clone().multiplyScalar(Q(-.4,.9)).addScaledVector(lm,Q(-.6,.9)).add(new G(Q(-.5,.5),Q(3.2,4.8),Q(-.5,.5))),c||_m()<n.goldenChance?`goldwood`:i.log,s);if(e.lastHitBy&&_m()<ve(e.lastHitBy,`lucky`)*.04&&(Tt(r.clone().setY(.6),new G(Q(-.6,.6),4.8,Q(-.6,.6)),`goldwood`,s),H(`Lucky!`,r.clone().setY(1.6),`floater-gold`)),!a){let e=1+ +(_m()<.4+n.saplingBonus);for(let t=0;t<e;t++){let e=new G(Q(-.8,.8),4.5,Q(-.8,.8));Tt(r.clone().setY(.5),e,i.sapling,s)}}e.phase=`stump`,e.autoRegrow=a,e.stumpTimer=2,e.reservedBy=null,e.sprite.material.rotation=0,e.sprite.material.map=ye(e).stump,e.flash.visible=!1,e.hpTimer=0}let Kn={rain:0,rainTarget:0,storm:!1,flash:0,dropAcc:0},qn=new J(8688808),Jn=new J(5923960),Yn=new J(9214112),Xn=new J(16777215),Zn=new J(1.35,1.08,.42),Qn=null,$n=0;function er({rain:e=0,storm:t=!1}){Kn.rainTarget=e,Kn.storm=t}function tr(e){Kn.rain+=(Kn.rainTarget-Kn.rain)*Math.min(1,e*.7),Kn.flash=Math.max(0,Kn.flash-e*3.5);let t=Kn.rain;if(t>.01){S.lerp(Kn.storm?Jn:qn,.45*t),C.lerp(Yn,.5*t),Kn.dropAcc+=e*60*t*(Kn.storm?9:5);let n=Kn.storm?-2.4:-.7;for(;Kn.dropAcc>=1;)--Kn.dropAcc,st({pos:new G(Q(o.minX-2,o.maxX+3),Q(3.2,5),Q(o.minZ-2,o.maxZ+3)),vel:new G(n,-10,n*.3),color:`#b4d4ff`,size:.035,stretch:6,life:.48,gravity:3,ground:!1})}Kn.flash>0&&(S.lerp(Xn,Kn.flash*.8),C.lerp(Xn,Kn.flash*.7))}function nr(){Kn.flash=1,p=Math.max(p,.35),Yf();let e=xe.filter(e=>e.phase===`grown`&&e!==Qn);if(!e.length)return null;let t=vm(e);return t.lastHitBy=null,t.hp=0,t.phase=`falling`,t.fall=0,t.fallDir=_m()<.5?-1:1,ft(new G(t.x,L,t.z),16,`#fff6b0`,3),H(`Lightning!`,new G(t.x,L+.4,t.z),`floater-crit`),t}function rr(){let e=xe.filter(e=>e.phase===`grown`);return e.length?(Qn=vm(e),ft(new G(Qn.x,1.4,Qn.z),24,`#ffe27a`,2.4),H(`Golden tree!`,new G(Qn.x,L+.4,Qn.z),`floater-gold`),Qn):null}function ir(e,t){let r=gt[n.soils[rm(...e.cell)]],i=N(e.species),a=r?r.growthMult+n.soilBonus:1,o=n.growthMult*a*(1+(Ir.get(rm(...e.cell))??0));return i.trait===`grove`&&Xr(e,`birch`)&&(o*=1.3),i.trait===`night`&&(o*=1+.5*t),o*(n.eventGrowthMult??1)/i.growTime}function ar(e){let t=0;for(let n of xe)n.phase===`growing`&&(n.growth+=e*ir(n,.4),n.growth>=1?(n.phase=`grown`,n.hp=N(n.species).hp,n.sprite.material.map=ye(n).mature,t++):n.growth>=.4&&(n.sprite.material.map=ye(n).young));return t}function or(e,t){e.sprite.material.map!==t&&(e.sprite.material.map=t,e.hitT=.7,ft(new G(e.x,.6,e.z),4,`#b8ff8a`,.8))}function sr(e,t){let r=performance.now()/1e3;mm(n.hour,S,C),tr(e);for(let e of b)e.mat.color.copy(S);T.copy(C).convertLinearToSRGB(),l.setClearColor(C),ne.color.copy(C);for(let e of tt)e.material.color.copy(C).lerp(new J(16777215),.35);Fn?.moved||v.lerp(y,Math.min(1,e*3)),p=Math.max(0,p-e*.9),Ln(),p>0&&(f.position.addScaledVector(cm,(_m()-.5)*p),f.position.y+=(_m()-.5)*p),pe>0&&(pe-=e),ue.material.map=pe>0?le:ce,me=Math.max(0,me-e*3);let i=Math.sin(me*Math.PI*3)*me*.16;if(ue.scale.set(de.x*(1+i),de.y*(1-i),1),wr(t),Sr(t),!n.workers.length)for(let e of[...we.values()])Ar(e);An(r);for(let i of xe){i.hitT=Math.max(0,i.hitT-e*4.5),i.flashT=Math.max(0,i.flashT-e*9);let a=1+Kn.rain*(Kn.storm?5:1.2),o=(i.phase===`grown`||i.phase===`growing`?Math.sin(r*1.3*(Kn.storm?2.2:1)+i.swayPhase)*.016*a:0)+Math.sin((1-i.hitT)*18)*.08*i.hitT;if(i.phase===`falling`){i.fall+=e/.7;let t=Math.min(1,i.fall);o=i.fallDir*t*t*(Math.PI/2)*.96,i.fall>=1&&(Gn(i),o=0)}else if(i.phase===`stump`){if(i.stumpTimer-=t,i.autoRegrow&&i.stumpTimer<=0)i.autoRegrow=!1,i.phase=`growing`,i.growth=0,or(i,ye(i).sapling);else if(n.autoReplant&&!i.reservedBy&&i.stumpTimer<=-1.2&&hr()>0){let e=gr(i.species);e&&(Xp(n,N(e).sapling,-1),_r(i,e))}}else i.phase===`growing`&&(i.growth+=t*ir(i,hm(n.hour)),i.growth>=1?(i.phase=`grown`,i.hp=N(i.species).hp,or(i,ye(i).mature)):i.growth>=.4&&or(i,ye(i).young));if(i.sprite.material.rotation=o,i===Qn){let t=.85+Math.sin(r*5)*.15;i.sprite.material.color.multiply(Zn.clone().multiplyScalar(t)),$n-=e,$n<=0&&i.phase===`grown`&&($n=.18,ft(new G(i.x,.8+_m()*1.6,i.z).addScaledVector(cm,Q(-.7,.7)),1,`#ffe27a`,.5))}let s=i.hitT;if(i.sprite.scale.set(be*(1+.07*s),L*(1-.06*s),1),i.flash.visible=i.flashT>0&&i.phase!==`stump`&&i.phase!==`growing`,i.flash.visible&&(i.flash.material.opacity=i.flashT*.8,i.flash.material.rotation=o,i.flash.scale.copy(i.sprite.scale)),i.hpEl){i.hpTimer-=e;let t=i.hpTimer>0&&(i.phase===`grown`||i.phase===`falling`);if(i.hpEl.style.display=t?`block`:`none`,t){let e=Vt(new G(i.x,L+.15,i.z));i.hpEl.style.left=e.x+`px`,i.hpEl.style.top=e.y+`px`}}}Lt(e,r),ri(e,t,r),It(e),li.update(t),ui.update(e),ct(e),Bt(e,r),Dr(e);for(let e of tt){let t=e.userData,n=t.angle+r*t.speed*.1,i=t.r+Math.sin(r*.3+t.phase)*.4;e.position.set(o.cx+Math.cos(n)*(o.hx+i),.7,o.cz+Math.sin(n)*(o.hz+i))}l.clear(),l.render(u,f),l.clearDepth(),l.render(d,f)}function cr(){let t=e.clientWidth,n=e.clientHeight;if(!t||!n)return;g=t,_=n,l.setSize(t,n);let r=t/n;f.left=-m*r/2,f.right=m*r/2,f.top=m/2,f.bottom=-m/2,f.updateProjectionMatrix()}new ResizeObserver(cr).observe(e),cr();function lr(e=0){let t=xe[e];t.phase===`grown`&&on(t,l.domElement.getBoundingClientRect().left+Vt(new G(t.x,.5,t.z)).x+40)}function ur(){return{trees:xe.map(e=>({cell:e.cell,variant:e.variant,auto:e.auto,phase:e.phase,species:e.species,autoRegrow:e.autoRegrow,growth:+e.growth.toFixed(3),hp:e.hp,stumpTimer:+e.stumpTimer.toFixed(2)})),items:St.map(e=>{let t=e.state===`fly`?e.from:e.sprite.position;return{kind:e.kind,x:+t.x.toFixed(2),z:+t.z.toFixed(2),idle:e.idle||void 0}}),seeds:[...we.values()].map(e=>({cell:e.cell,species:e.species})),buildings:Pr.map(e=>({type:e.type,cell:e.cell,rot:e.rot,level:e.level,accept:e.accept,input:e.input,output:e.output,progress:+e.progress.toFixed(2)}))}}function dr(e,t,n,r,i){let a=l.domElement.getBoundingClientRect(),o=Vt(new G(e,n,t)),s=Vt(new G(e,r,t)),c=_/m*i;return{left:a.left+o.x-c,right:a.left+o.x+c,top:a.top+s.y,bottom:a.top+o.y}}let fr=(e=0)=>{let t=xe[e];return t?dr(t.x,t.z,0,L,be*.42):null},pr=()=>{let e=St.find(e=>e.state!==`fly`&&e.state!==`carried`);if(!e)return null;let t=e.sprite.position;return dr(t.x,t.z,t.y-.35,t.y+.35,.45)},mr=0,hr=()=>se(n.inventory)-mr;function gr(e=`oak`){let t=oe(n.inventory,e,0);return t?(--n.inventory[N(t).sapling],t):null}function _r(e,t=`oak`){let r=N(t);e.species!==r.id&&(e.variant=vm(r.variants)),e.species=r.id,e.phase=`growing`,e.growth=n.headStart,e.hp=r.hp,e.reservedBy=null,or(e,ye(e).sapling),Uf(),pt(new G(e.x,0,e.z),3),ft(new G(e.x,.4,e.z),8,`#b8ff8a`,1.2),H(`Planted!`,new G(e.x,1,e.z),`floater-sapling`),Be(`treePlanted`)}function vr(e){let{x:t,y:n}=dn(e),r=Math.max(18,_/m*.45),i=null,a=r;for(let e of xe){if(e.phase!==`stump`||e.autoRegrow)continue;let r=Vt(new G(e.x,.2,e.z)),o=Math.hypot(r.x-t,r.y-n);o<a&&(a=o,i=e)}return i}function yr(e){let t=kn(e);return t&&Ge(rm(...t))?t:null}function br(e,t){let r=new G(im(e),0,im(t));if(hr()<=0){Gf(),H(`No sapling!`,r.clone().setY(.9),`floater-warn`),Be(`noSapling`);return}let i=gr(`oak`),a=Te(e,t,vm(N(i).variants),{growing:!0,auto:!1,species:i});a.growth=n.headStart,Mr(r),Uf(),ft(r.clone().setY(.4),8,`#b8ff8a`,1.2),H(`Planted!`,r.clone().setY(1),`floater-sapling`),Be(`treePlanted`)}function U(e){if(e.reservedBy){H(`A worker is on it`,new G(e.x,.9,e.z),`floater-sapling`);return}if(hr()<=0){Gf(),H(`No sapling!`,new G(e.x,.9,e.z),`floater-warn`),Be(`noSapling`);return}let t=gr(e.species);Mr(new G(e.x,0,e.z)),_r(e,t)}let W={name:`Woodpecker`,traits:[]},xr=0;function Sr(e){if(!n.woodpecker||(xr-=e,xr>0))return;xr=[0,4,2.5,1.5][n.woodpecker];let t=xe.filter(e=>e.phase===`grown`);if(!t.length)return;let r=vm(t);Nr(r,1,_m()<.5?-1:1,W),H(`[[icon:feather]] tok!`,new G(r.x,1.4,r.z),`floater-dmg`)}let Cr=0;function wr(e){let t=xe.some(e=>e.phase!==`stump`||e.autoRegrow),r=se(n.inventory)>0||St.some(e=>ht[e.kind]?.type===`sapling`)||we.size>0,i=n.money>=ae(Ee(),n.saplingPriceMult);if(t||r||i||n.tutorial!==`done`){Cr=0;return}Cr+=e,!(Cr<45)&&(Cr=0,Tt(new G(o.minX-.5,.8,o.cz+Q(-1.5,1.5)),new G(3.2,3.5,Q(-.6,.6)),`sapling`),H(`[[icon:acorn]] A squirrel brought a sapling!`,new G(o.minX+1,1.4,o.cz),`floater-sapling`),Uf())}let Tr=null;function Er(e){let t=o;if(!nt(n,e))return!1;yt(n),i=Qe(n),o=a(i),P(),_n(),$e();let r={n:[o.minX,o.maxX,o.minZ,t.minZ],s:[o.minX,o.maxX,t.maxZ,o.maxZ],w:[o.minX,t.minX,o.minZ,o.maxZ],e:[t.maxX,o.maxX,o.minZ,o.maxZ]}[e];Le(...r),Tr={from:t,to:o,t:0},y.set(o.cx,0,o.cz),m=Math.min(h(),m+1.2),cr();let[s,c,l,u]=r;for(let e=0;e<14;e++){let e=new G(Q(s,c),0,Q(l,u));pt(e,2),ft(e.setY(.4),3,`#b8ff8a`,1.4)}return p=Math.max(p,.15),Kf(),H(`New land! +1 [[icon:oak]] slots`,new G((s+c)/2,1.4,(l+u)/2),`floater-level`),Be(`landExpanded`,{side:e}),!0}function Dr(e){if(!Tr)return;Tr.t=Math.min(1,Tr.t+e/1.4);let t=1-(1-Tr.t)**3,n=e=>Tr.from[e]+(Tr.to[e]-Tr.from[e])*t;ie({cx:n(`cx`),cz:n(`cz`),hx:n(`hx`),hz:n(`hz`)}),Tr.t>=1&&(Tr=null)}let Or=Gd(df());function kr(e,t,n=!1,r=`oak`){let i=rm(e,t);if(we.has(i))return;let a=new G(im(e),0,im(t)),o=F(Or,14,12);o.position.copy(a),we.set(i,{cell:[e,t],pos:a,sprite:o,reservedBy:null,species:r}),Ae(e,t),n||(Hf(.2),pt(a,2),H(`Marked!`,a.clone().setY(.8),`floater-sapling`),Be(`seedMarked`))}function Ar(e){let[t,r]=e.cell;I(e.sprite),we.delete(rm(t,r));let i=Te(t,r,Math.floor(_m()*3),{growing:!0,auto:!1,species:e.species});i.growth=n.headStart,Uf(),pt(new G(i.x,0,i.z),3),ft(new G(i.x,.4,i.z),8,`#b8ff8a`,1.2),H(`Planted!`,new G(i.x,1,i.z),`floater-sapling`)}for(let e of r?.seeds??[]){let t=Array.isArray(e)?e:e.cell;B(...t)&&kr(...t,!0,e.species??`oak`)}function jr(e){st({tex:et,pos:new G(e.x,.05,e.z),vel:new G(Q(-.3,.3),.25,Q(-.3,.3)),color:`#efe4c8`,size:.16,life:.35,gravity:0,drag:3,ground:!1,grow:1.4})}function Mr(e){for(let t=0;t<4;t++)st({pos:new G(e.x+Q(-.15,.15),.08,e.z+Q(-.15,.15)),vel:new G(Q(-.8,.8),Q(1.5,2.6),Q(-.8,.8)),color:vm([`#7a4a22`,`#5a3416`,`#9a6232`]),size:Q(.05,.08),life:.6,gravity:9});jr(e)}function Nr(e,t,n,r){e.phase===`grown`&&(e.lastHitBy=r,e.hp-=t,e.hitT=Math.max(e.hitT,.75),e.flashT=Math.max(e.flashT,.45),ut(new G(e.x,.45,e.z).addScaledVector(cm,n*.15).addScaledVector(fm,.4),5),dt(e,1),Bf(.4),sn(e),e.hp<=0&&(e.phase=`falling`,e.fall=0,e.fallDir=n))}let Pr=[],Fr=null,Ir=new Map,Lr=Gd(wp()),Rr=new Map,zr=[0,1].map(e=>({idle:Gd(xp(e,!1)),work:Gd(xp(e,!0))})),Br=Object.fromEntries(Object.keys(tp).filter(e=>tp[e].kind===`irrigation`).map(e=>[e,Gd(Sp(e))])),Vr=(e,t,n)=>{let r=tp[e].size,i=[];for(let e=0;e<r;e++)for(let a=0;a<r;a++)i.push([t+a,n+e]);return i},Hr=(e,t,n)=>{let r=(tp[e].size-1)/2;return new G(im(t)+r,0,im(n)+r)},Ur=(e,t,n,r=!1)=>Vr(e,t,n).every(([e,t])=>B(e,t)&&(r||!Ue.has(rm(e,t)))),Wr=e=>Pr.filter(t=>t.type===e).length,Gr=e=>Math.round(tp[e].price(Wr(e))*n.buildPriceMult),Kr=e=>tp[e.type].outlets.map(t=>(t+e.rot)%4);function qr(e,t,n,r=1){let i=new Vo(new ts(r,r),new ko({map:e,transparent:!0,alphaTest:.05,depthWrite:!1}));return x(i.material),i.rotation.x=-Math.PI/2,i.position.set(t,.009,n),i.renderOrder=2,u.add(i),i}function Jr(e,t,n,r={}){let i=tp[e],a=Hr(e,t,n),o={type:e,cell:[t,n],center:a,rot:r.rot??0,level:r.level??0,accept:r.accept??`all`,input:r.input??[],output:r.output??[],progress:r.progress??0,reservedBy:null,frameT:0,frame:0,bounce:0,sprayT:_m(),parts:[]};e===`sawmill`?(o.sprite=F(zr[0].idle,52,48,{scale:.95}),o.sprite.position.copy(a).addScaledVector(lm,.1),o.shadow=te(a.x,a.z,2.6),o.logPile=Array.from({length:4},()=>F(_t(`wood`).tex,16,10,{center:[.5,0],scale:1.1})),o.plankPile=Array.from({length:4},()=>F(_t(`oak_plank`).tex,16,10,{center:[.5,0],scale:1.1}))):(o.sprite=F(Br[e],16,20,{scale:1.1}),o.sprite.position.copy(a),o.shadow=te(a.x,a.z,.7),o.decal=qr(Gd(Cp(Kr(o))),a.x,a.z)),o.sprite.userData.building=o;for(let[r,i]of Vr(e,t,n))z.set(rm(r,i),o),Ae(r,i);return Pr.push(o),i.kind===`irrigation`&&Yr(),o}function Yr(){Ir.clear();for(let e of Pr){let t=tp[e.type];if(t.kind===`irrigation`)for(let[n,r]of rp(e)){if(!R(n,r)||Ce(n,r))continue;let e=rm(n,r);Ir.set(e,Math.max(Ir.get(e)??0,t.growth))}}for(let[e,t]of Rr)Ir.has(e)||(u.remove(t),Rr.delete(e));for(let e of Ir.keys()){if(Rr.has(e))continue;let[t,n]=e.split(`,`).map(Number);Rr.set(e,qr(Lr,im(t),im(n)))}}function Xr(e,t){let[n,r]=e.cell;return[[1,0],[-1,0],[0,1],[0,-1]].some(([e,i])=>{let a=Se.get(rm(n+e,r+i));return a&&a.species===t&&a.phase!==`stump`})}let $r=e=>Object.keys(ht).filter(t=>ht[t].type===`log`&&(n.inventory[t]??0)>0&&(e.accept===`all`||ht[t].species===e.accept));function ei(e,t){let r=ip(e).inCap-e.input.length,i=[];for(let a of $r(e))for(;i.length<Math.min(t,r)&&n.inventory[a]>0;)--n.inventory[a],i.push(a);return i}let ti=()=>Math.max(0,n.woodCap-xt(n)-wt-Et);function K(e){if(e.length){for(let t of e)n.inventory[t]=(n.inventory[t]??0)+1;pe=.5,me=1,Wf(),ft(sm.clone().setY(.7),6),H(`+${e.length} [[icon:planks]]`,new G(0,1.5,0),`floater-wood`),Be(`itemDeposited`,{kind:e[0]})}}let ni=e=>N(ht[e]?.species).plank;function ri(e,t,r){for(let r of Pr)if(r.type===`sawmill`){let i=ip(r),a=r.input.length>0&&r.output.length<i.outCap;if(a&&(r.progress+=t*n.sawSpeedMult/i.time,r.progress>=1)){r.progress=0,r.output.push(ni(r.input.shift())),r.bounce=1,$f();for(let e=0;e<6;e++)st({pos:r.center.clone().addScaledVector(lm,.7).setY(.45),vel:new G(Q(-1,1),Q(1.2,2.4),Q(-1,1)),color:vm([`#f2dca0`,`#e2c080`,`#fff0c8`]),size:Q(.04,.07),life:.7,gravity:6})}r.frameT+=e,r.frameT>.07&&(r.frameT=0,a&&(r.frame=1-r.frame)),r.sprite.material.map=a?zr[r.frame].work:zr[0].idle,r.bounce=Math.max(0,r.bounce-e*5);let o=r.bounce*.06;r.sprite.scale.set(52*em*.95*(1+o),48*em*.95*(1-o),1);let s=Math.min(4,Math.ceil(r.input.length/3)),c=Math.min(4,Math.ceil(r.output.length/3)),l=r.center.clone().addScaledVector(cm,-1.05).addScaledVector(lm,.55),u=r.center.clone().addScaledVector(cm,1.05).addScaledVector(lm,.55);r.logPile.forEach((e,t)=>{e.visible=t<s,e.visible&&(e.material.map=_t(r.input[0]??`wood`).tex,e.position.copy(l).setY(t*.17))}),r.plankPile.forEach((e,t)=>{e.visible=t<c,e.visible&&(e.material.map=_t(r.output[r.output.length-1]??`oak_plank`).tex,e.position.copy(u).setY(t*.17))})}else if(r.sprayT-=e,r.sprayT<=0){r.sprayT=.5+_m()*.4;for(let[e,t]of rp(r)){if(!R(e,t))continue;let n=new G(im(e),0,im(t)).clone().sub(r.center).multiplyScalar(1.1).setY(2.2);st({pos:r.center.clone().setY(.55),vel:n,color:`#7ec8ff`,size:.07,life:.55,gravity:7,additive:!0})}}}function ii(e){let{x:t,y:n}=dn(e);return ui.pickAt(t,n,Vt,Math.max(18,_/m*.5))}function ai(e){let{x:t,y:n}=dn(e),r=null,i=1/0;for(let e of Pr){let a=tp[e.type].size,o=Vt(e.center.clone().setY(.35*a)),s=_/m*(.45*a+.15),c=Math.hypot(o.x-t,o.y-n);c<s&&c<i&&(i=c,r=e)}return r}for(let e of r?.buildings??[])tp[e.type]&&Ur(e.type,...e.cell,!0)&&Jr(e.type,...e.cell,e);let q=new So(new so({transparent:!0,opacity:.65,depthWrite:!1}));q.center.set(.5,0),q.visible=!1,d.add(q);let oi=new Vo(new ts(1,1),new ko({transparent:!0,opacity:.8,depthWrite:!1}));oi.rotation.x=-Math.PI/2,oi.renderOrder=3,oi.visible=!1,u.add(oi);function si(e){let t=tp[e],r=e=>Gd(Cp(t.outlets?.map(t=>(t+e)%4)??[]));En({ghost:`building`,type:e,size:t.size,rot:0,rotatable:t.kind===`irrigation`,decalTex:t.kind===`irrigation`?r(0):null,onRotate(){this.rot=(this.rot+1)%4,this.decalTex=r(this.rot)},isValid:(r,i)=>(n.repLevel??0)<t.unlockRep?`Needs [[icon:star]] reputation ${t.unlockRep}`:n.money<Gr(e)?`Not enough coins`:Vr(e,r,i).every(([e,t])=>R(e,t))?Ur(e,r,i)?!0:`Tiles taken`:`Not enough room`,place(r,i){n.money-=Gr(e);let a=Jr(e,r,i,{rot:this.rot});Hf(.25),Kf(),pt(a.center,6),ft(a.center.clone().setY(.6),12,`#ffe27a`,1.6),H(`${t.icon} ${t.name}!`,a.center.clone().setY(1.6),`floater-sapling`),Be(`buildingPlaced`,{type:e})},keepGoing:()=>t.kind===`irrigation`&&n.money>=Gr(e),label(){let n=this.rotatable?` · R: rotate`:``;return`${t.icon} ${t.name} · [[icon:coin]] ${Ft(Gr(e))} · ${t.size}×${t.size}${n}`}})}window.addEventListener(`keydown`,e=>{(e.key===`r`||e.key===`R`)&&wn?.rotatable&&(wn.onRotate(),zf(1.6,.1))});let ci={info:e=>({...tp[e.type],lvl:e.type===`sawmill`?ip(e):null}),loadLogs(e){let t=ei(e,1/0);return e.input.push(...t),t.length&&Hf(.2),t.length},takePlanks(e){let t=e.output.splice(0,Math.min(e.output.length,ti()));return K(t),t.length},upgrade(e){let t=tp.sawmill.levels[e.level+1];return!t||n.money<t.cost?!1:(n.money-=t.cost,e.level+=1,e.bounce=1,Kf(),ft(e.center.clone().setY(1),16,`#ffe27a`,2),H(`Sawmill Lv ${e.level+1}!`,e.center.clone().setY(1.7),`floater-level`),!0)},setAccept(e,t){e.accept=t}},li=Bp({state:n,SCREEN_RIGHT:cm,TO_CAMERA:lm,PX:em,landBox:()=>o,canvasTexture:Gd,makeSprite:F,removeSprite:I,makeShadow:(e,t,n)=>te(e,t,n),removeShadow:e=>u.remove(e),items:St,trees:xe,seeds:we,hasRoom:Dt,reserveSlot:e=>{Et=Math.max(0,Et+e)},launchItem:e=>kt(e),workerHit:Nr,plantSeed:Ar,stepDust:jr,digDust:Mr,floater:H,sfx:Tf,plantOnStump:_r,availableSaplings:hr,reserveSapling:e=>{mr=Math.max(0,mr+e)},takeSapling:e=>{mr=Math.max(0,mr-1);let t=gr(e);return t&&Xp(n,N(t).sapling,-1),t},returnSapling:e=>{let t=N(e).sapling;n.inventory[t]=(n.inventory[t]??0)+1,Xp(n,t,1)},itemTexture:e=>_t(e).tex,saplingTexOf:e=>_t(N(e).sapling).tex,sawmills:()=>Pr.filter(e=>e.type===`sawmill`),sawmillSpot:e=>e.center.clone().addScaledVector(lm,1.15),sawmillNeedsInput:e=>e.input.length<ip(e).inCap&&$r(e).length>0,takeLogsFor:(e,t)=>{let r=ei(e,t);for(let e of r)Xp(n,e,-1);return r},deliverLogs:(e,t)=>{e.input.push(...t),Hf(.15)},takePlanks:(e,t)=>e.output.splice(0,Math.max(0,Math.min(t,e.output.length,ti()))),depositToChest:e=>{for(let t of e)Xp(n,t);K(e)},levelUp:(e,t)=>{let n=new G(e.pos.x,.9,e.pos.z);if(ft(n,18,`#ffe27a`,2.4),ft(n,8,`#ffffff`,1.6),H(`LEVEL ${e.data.level}!`,n.clone().setY(1.6),`floater-level`),t.length){let e=t.map(e=>`+1 ${fe[e].short}`).join(` `);setTimeout(()=>H(e,n.clone().setY(1.25),`floater-sapling`),350)}Kf(),Be(`workerLevelUp`,{id:e.id})}}),ui=qp({state:n,PX:em,SCREEN_RIGHT:cm,CHEST_TOP:sm,canvasTexture:Gd,itemCanvas:e=>bp(e),itemTexture:e=>_t(e).tex,makeSprite:F,removeSprite:I,makeShadow:(e,t,n)=>te(e,t,n),removeShadow:e=>u.remove(e),landBox:()=>o,fogAt:c,floater:H,sparkles:ft,stepDust:jr,sfx:Tf,chestPop:()=>{pe=.7,me=1}}),di=null;return V(`payday`,({total:e})=>{H(`Wages −${Ft(e)} [[icon:coin]]`,new G(0,1.9,0),`floater-warn`),ft(sm.clone().setY(.9),10,`#ffe27a`,2),pe=.6,me=1,qf(),li.emoteAll(`heart`)}),{update:sr,trees:xe,items:St,worldToScreen:Vt,camera:f,debugHit:lr,debug:{hit:e=>e.phase===`grown`&&Wn(e,new G(e.x,.5,e.z),{x:0,y:0}),collect:e=>e.state===`rest`&&Ot(e),replant:e=>e.phase===`stump`&&!e.autoRegrow&&U(e),build:(e,t,r,i=0)=>!Ur(e,t,r)||n.money<Gr(e)?null:(n.money-=Gr(e),Jr(e,t,r,{rot:i})),plantAt:(e,t,n,r=0)=>B(t,n)?(We(t,n),Te(t,n,0,{growing:!0,auto:!1,species:e}).growth=r,!0):!1,growthRate:(e,t)=>Ir.get(rm(e,t))??0,plantFree:(e=`oak`)=>{let t=Ke()[0];if(!t||hr()<=0)return!1;let r=gr(e);return Te(...t.split(`,`).map(Number),0,{growing:!0,auto:!1,species:r}).growth=n.headStart,!0},placeBedsAuto:()=>{for(;qe()>0;){let e=Ye();if(!e)break;We(...e)}},replantWith:(e,t)=>{let r=N(t).sapling;return e.phase!==`stump`||e.reservedBy||!(n.inventory[r]>0)?!1:(--n.inventory[r],_r(e,t),!0)},buildAnywhere:(e,t=0)=>{for(let r=i.minJ;r<=i.maxJ;r++)for(let a=i.minI;a<=i.maxI;a++)if(Vr(e,a,r).every(([e,t])=>R(e,t))&&Ur(e,a,r))return n.money<Gr(e)?null:(n.money-=Gr(e),Jr(e,a,r,{rot:t}));return null}},serialize:ur,treeRect:fr,itemRect:pr,beginPlanting:Mn,beginSoil:Pn,beginBuilding:si,endPlacement:Dn,isPlacing:()=>!!wn,expandLand:Er,buildings:Pr,buildingApi:ci,buildPrice:Gr,countOf:Wr,setBuildingClickHandler:e=>{Fr=e},setVisitorClickHandler:e=>{di=e},lookAt:(e,t)=>{y.set(e,0,t),v.copy(y)},fastForward:ar,setWeather:er,lightning:nr,makeGolden:rr,clearGolden:()=>{Qn=null},hasGolden:()=>!!Qn,spawnMerchant:()=>ui.spawnMerchant(),dismissMerchant:()=>ui.dismissMerchant(),hasSawmill:()=>Pr.some(e=>e.type===`sawmill`),isWet:(e,t)=>Ir.has(rm(e,t)),fellaStatus:e=>li.status(e),treeSlots:()=>({used:Ee(),cap:Math.max(n.treeCap,Ue.size),beds:Ue.size,free:Ke().length,pending:qe()}),beginBedPlacement:Nn,stumpRect:()=>{let e=xe.find(e=>e.phase===`stump`&&!e.autoRegrow);return e?dr(e.x,e.z,-.1,.6,.45):null},fellas:li}}var bm=(e,t)=>e+Math.floor(Math.random()*(t-e+1)),xm=e=>e[Math.floor(Math.random()*e.length)],Sm={normal:{name:`Order`,icon:`[[icon:orders]]`,time:1,qty:1,reward:1,rep:1,love:1},rush:{name:`Rush`,icon:`[[icon:bolt]]`,time:.45,qty:.8,reward:1.4,rep:1,love:1},bulk:{name:`Big contract`,icon:`[[icon:scroll]]`,time:1.7,qty:2.2,reward:1.25,rep:2,love:2}},Cm=.3,wm=.05,Tm=e=>3+ +(e.repLevel>=4),Em=e=>1.8+.06*e.repLevel+(e.repLevel>=5?.25:0)+(e.repLevel>=6?.25:0);function Dm(e){e.orders??={list:[],nextIn:3,seq:1};for(let t of e.orders.list)t.customerId||=at(t.customer?.name)?.id??rt[0].id,t.kind??=`normal`}function Om(e,t){let n=[];for(let r of ne){if(!re(e,r))continue;let i=N(r);n.push(i.log),t&&n.push(i.plank,i.plank)}return n}function km(e){let t=Math.random();return e.repLevel>=1&&t<.14?`bulk`:t<.4?`rush`:`normal`}function Am(e,t){let n=new Set(e.orders.list.map(e=>e.customerId)),r=rt.filter(e=>!n.has(e.id));if(!r.length)return null;let i=xm(r),a=km(e),o=Sm[a],s=Om(e,t),c=s.length>1&&Math.random()<.45?2:1,l=[];for(;l.length<c;){let e=xm(s);l.includes(e)||l.push(e)}let u=l.map(t=>{let n=(4+e.repLevel*2+bm(0,6))*o.qty;return{key:t,n:Math.max(2,Math.round(ht[t].type===`plank`?n*.6:n))}}),d=u.reduce((e,t)=>e+t.n,0),f=u.reduce((t,n)=>t+n.n*St(e,n.key),0),p=u.some(e=>ht[e.key].type===`plank`),m=Math.round((180+d*8)*o.time),h=1+wm*dt(e,i.id);return{id:e.orders.seq++,customerId:i.id,kind:a,items:u,reward:Math.max(5,Math.round(f*Em(e)*o.reward*h)),rep:(1+Math.floor(d/10)+ +!!p)*o.rep,time:m,total:m}}var jm=e=>Math.round(e.reward*Cm*Math.max(0,e.time/e.total));function Mm(e,t,n){if(!(e.skills.orders>0))return;Dm(e);let r=e.orders;for(let e of r.list)e.time-=t;for(let t of r.list.filter(e=>e.time<=0)){let n=lt(e,t.customerId),r=ut(n.pts);n.pts=Math.max(0,n.pts-1),ft(ut(n.pts))!==ft(r)&&yt(e),Be(`orderExpired`,{order:t})}r.list=r.list.filter(e=>e.time>0),r.list.length<Tm(e)&&(r.nextIn-=t,r.nextIn<=0&&Nm(e,n))}function Nm(e,t){let n=Am(e,t);return e.orders.nextIn=25+Math.random()*20,n?(e.orders.list.push(n),Be(`orderNew`,{order:n}),n):null}function Pm(e,t){if(!(e.skills.orders>0))return 0;Dm(e);let n=0;for(;e.orders.list.length<Tm(e)&&Nm(e,t);)n++;return n}var Fm=(e,t)=>t.items.every(({key:t,n})=>(e.inventory[t]??0)>=n);function Im(e,t){Dm(e);let n=e.orders.list.find(e=>e.id===t);if(!n||!Fm(e,n))return null;for(let{key:t,n:r}of n.items)e.inventory[t]-=r;n.tip=jm(n),n.paid=Tt(e,n.reward+n.tip);let r=e.repLevel;e.reputation=(e.reputation??0)+n.rep,e.repLevel=We(e.reputation);let i=lt(e,n.customerId),a=ut(i.pts);i.pts+=Sm[n.kind]?.love??1,i.orders+=1;let o=ut(i.pts);return e.orders.list=e.orders.list.filter(e=>e.id!==t),e.orders.nextIn=Math.min(e.orders.nextIn,8),(e.repLevel>r||ft(o)!==ft(a))&&yt(e),Be(`orderDone`,{order:n}),o>a&&Be(`customerLove`,{id:n.customerId,hearts:o,perkUp:ft(o)>ft(a)}),e.repLevel>r&&Be(`repLevel`,{level:e.repLevel}),n}function Lm(e,t){Dm(e);let n=e.orders.list.find(e=>e.id===t);e.orders.list=e.orders.list.filter(e=>e.id!==t),e.orders.nextIn=Math.min(e.orders.nextIn,12),n&&Be(`orderDeclined`,{order:n})}var Rm=e=>`lumberjack-idle-slot-${e}`,zm=`lumberjack-idle-save-v1`,Bm=`lumberjack-idle-boot`,Vm=`lumberjack-idle-settings`,Hm=5e3,Um=1,Wm=e=>{Um=e},Gm=()=>Um,Km={1:e=>(e.state.land??={n:0,e:0,s:0,w:0},e)};function qm(e){if(!e?.state)return null;let t=e.version??1;for(;t<2;)e=Km[t]?.(e)??e,t+=1;return e.version=2,e}function Jm(){try{let e=localStorage.getItem(zm);if(!e)return;localStorage.getItem(Rm(1))||localStorage.setItem(Rm(1),e),localStorage.removeItem(zm)}catch{}}function Ym(e=Um){try{let t=localStorage.getItem(Rm(e));return t?qm(JSON.parse(t)):null}catch{return null}}function Xm(e,t){return{version:2,savedAt:Date.now(),state:Object.fromEntries(It.map(t=>[t,e[t]])),world:t.serialize()}}var Zm=!1;function Qm(e,t){if(!Zm)try{localStorage.setItem(Rm(Um),JSON.stringify(Xm(e,t)))}catch{}}function $m(e=Um){localStorage.removeItem(Rm(e))}function eh(){for(let e=1;e<=3;e++)$m(e);localStorage.removeItem(zm)}function th(e,t){let n=()=>Qm(e,t);return setInterval(n,Hm),window.addEventListener(`beforeunload`,n),document.addEventListener(`visibilitychange`,()=>{document.hidden&&n()}),n}function nh(e){let t=Ym(e);if(!t)return null;let n=t.state;return{slot:e,savedAt:t.savedAt??0,day:n.day??1,money:n.money??0,workers:n.workers?.length??0,reputation:n.reputation??0,land:n.land??{n:0,e:0,s:0,w:0},skills:Object.keys(n.skills??{}).length,playTime:n.playTime??0,tutorial:n.tutorial!==`done`}}function rh(e,t=null){Zm=!0,t&&$m(e),sessionStorage.setItem(Bm,JSON.stringify({slot:e,newGame:t})),location.href=location.pathname}function ih(){try{let e=sessionStorage.getItem(Bm);return sessionStorage.removeItem(Bm),e?JSON.parse(e):null}catch{return null}}function ah(e,t){Qm(e,t),Zm=!0,location.href=location.pathname}function oh(e,t){let n=new TextEncoder().encode(JSON.stringify(Xm(e,t))),r=``;for(let e=0;e<n.length;e+=32768)r+=String.fromCharCode(...n.subarray(e,e+32768));return btoa(r)}function sh(e){let t;try{let n=e.trim(),r=n.startsWith(`{`)?n:new TextDecoder().decode(Uint8Array.from(atob(n),e=>e.charCodeAt(0)));t=qm(JSON.parse(r))}catch{return!1}return t?(Zm=!0,localStorage.setItem(Rm(Um),JSON.stringify(t)),rh(Um),!0):!1}function ch(){rh(Um,{tutorial:!0})}function lh(){try{return{volume:1,muted:!1,...JSON.parse(localStorage.getItem(Vm)??`{}`)}}catch{return{volume:1,muted:!1}}}function uh(e){try{localStorage.setItem(Vm,JSON.stringify(e))}catch{}}var dh=e=>document.getElementById(e);function $(e,t){D(e,t)}function fh(e,t){e.classList.remove(t),e.offsetWidth,e.classList.add(t)}var ph=document.createElement(`div`);ph.id=`fx-layer`,document.body.appendChild(ph);function mh(e,t,n){let r=[`#f0c070`,`#c98a4a`,`#8a4f24`,n];for(let n=0;n<12;n++){let i=document.createElement(`div`);i.className=`chip`;let a=Math.random()<.5?3:6;i.style.width=i.style.height=a+`px`,i.style.background=r[n%r.length],i.style.left=e+`px`,i.style.top=t+`px`,ph.appendChild(i);let o=Math.random()*Math.PI*2,s=28+Math.random()*38,c=Math.cos(o)*s,l=Math.sin(o)*s-24;i.animate([{transform:`translate(0, 0)`,opacity:1},{transform:`translate(${c*.6}px, ${l*.6}px)`,opacity:1,offset:.4},{transform:`translate(${c}px, ${l+46}px)`,opacity:0}],{duration:520+Math.random()*220,easing:`ease-out`}).onfinish=()=>i.remove(),setTimeout(()=>i.remove(),1200)}}function hh(e,t,n){zf(e.classList.contains(`active`)?.8:1),fh(e,`bump`);let r=e.getBoundingClientRect(),i=t&&t.detail>0;mh(i?t.clientX:r.left+r.width/2,i?t.clientY:r.top+r.height/2,n)}function gh({icon:e,label:t,accent:n},r){let i=document.createElement(`button`);return i.className=`tab-btn`,i.style.setProperty(`--accent`,n),i.style.setProperty(`--gem`,m(n)),i.innerHTML=w(`<span class="tab-gem">${O[e]}</span><span class="tab-label">${t}</span>`),i.addEventListener(`click`,e=>{hh(i,e,n),r()}),i}function _h(e,t){let n=dh(`money-value`),r=dh(`hud-money`),i=dh(`wood-value`),a=dh(`time-value`),o=dh(`time-icon`),s=dh(`worker-value`),c=dh(`hud-trees`),l=dh(`trees-value`),u=dh(`trees-badge`);c.addEventListener(`click`,()=>{t.treeSlots().pending&&(zf(1.3),M(),t.beginBedPlacement())});let d=dh(`speed-group`),f=mt.map(t=>{let n=document.createElement(`button`);return n.className=`speed-btn`,D(n,`x`+t),n.addEventListener(`click`,()=>{e.speed=t}),d.appendChild(n),n}),p=dh(`window`),m=dh(`window-title`),g=dh(`window-body`),_=null,v={board:{icon:`note`,label:`Board`,accent:`#d9503c`,title:`Notice Board`,build:P},management:{icon:`person`,label:`Team`,accent:`#4a90d9`,title:`Team`,build:F},plots:{icon:`plots`,label:`Plots`,accent:`#5aa83c`,title:`Plots & Map`,build:I},chest:{icon:`chest`,label:`Chest`,accent:`#e0a82a`,title:`Chest & Market`,build:ve},orders:{icon:`orders`,label:`Orders`,accent:`#3aa8a0`,title:`Orders & Reputation`,build:je},buildings:{icon:`house`,label:`Build`,accent:`#9a6ad9`,title:`Buildings & Soils`,build:L}},y=()=>!0,b=e=>{Gf(),e&&fh(e,`denied`)},S=dh(`side-tabs`),T={};for(let[t,n]of Object.entries(v)){let r=gh(n,()=>{if(!y(`tab`,t))return b(r);_?.id===t?M():ee(t)});r.hidden=!bt(e,t),r.addEventListener(`animationend`,()=>r.classList.remove(`tab-reveal`,`denied`)),S.appendChild(r),T[t]=r}function E(){for(let[t,n]of Object.entries(T)){let r=bt(e,t);r&&n.hidden?(n.hidden=!1,fh(n,`tab-reveal`),Be(`tabUnlocked`,{id:t})):r||(n.hidden=!0)}}let O={building:{title:`Building`,build:e=>vt(e)},settings:{title:`[[icon:settings]] Settings`,build:e=>j(e)},offline:{title:`[[icon:sun]] Welcome back!`,build:e=>_t(e)},merchant:{title:`[[icon:backpack]] Traveling Merchant`,build:e=>lt(e)},newBed:{title:`[[icon:oak]] A new tree bed!`,build:e=>Xe(e)}},k=lh();Nf(k.volume,k.muted);let A=dh(`settings-btn`);A.addEventListener(`click`,e=>{if(!y(`settings`))return b(A);hh(A,e,`#c9b89a`),_?.id===`settings`?M():ee(`settings`)});function j(n){n.innerHTML=w(`
      <div class="settings-group">
        <h3 class="shop-title">[[icon:mouse]] Game · Slot ${Gm()}</h3>
        <div class="settings-row">
          <button class="small-btn menu-back-btn">[[icon:hut]] Save & main menu</button>
        </div>
      </div>
      <div class="settings-group">
        <h3 class="shop-title">[[icon:sound]] Sound</h3>
        <div class="settings-row">
          <button class="small-btn mute-btn"></button>
          <input type="range" class="vol-range" min="0" max="100" step="5">
        </div>
      </div>
      <div class="settings-group">
        <h3 class="shop-title">[[icon:save]] Save</h3>
        <p class="hint">The game saves itself every few seconds. Export a copy to move it to another browser.</p>
        <div class="settings-row">
          <button class="small-btn export-btn">[[icon:export]] Export</button>
          <button class="small-btn import-btn">[[icon:import]] Import</button>
        </div>
        <textarea class="save-text" placeholder="Export puts your save here · paste a save and press Import" spellcheck="false"></textarea>
        <div class="settings-row">
          <button class="small-btn danger reset-btn">[[icon:trash]] Start over</button>
        </div>
      </div>`),n.querySelector(`.menu-back-btn`).addEventListener(`click`,()=>{zf(1.1),ah(e,t)});let r=n.querySelector(`.mute-btn`),i=n.querySelector(`.vol-range`),a=n.querySelector(`.save-text`),o=n.querySelector(`.reset-btn`),s=()=>{Nf(k.volume,k.muted),uh(k),$(r,k.muted?`[[icon:muted]] Sound off`:`[[icon:sound]] Sound on`)};i.value=Math.round(k.volume*100),s(),r.addEventListener(`click`,()=>{k.muted=!k.muted,s(),zf(1.2)}),i.addEventListener(`input`,()=>{k.volume=Number(i.value)/100,k.muted=!1,s()}),i.addEventListener(`change`,()=>zf(1.2)),n.querySelector(`.export-btn`).addEventListener(`click`,n=>{a.value=oh(e,t),a.select(),navigator.clipboard?.writeText(a.value).catch(()=>{}),hh(n.currentTarget,n,`#7fc95e`)});let c=n.querySelector(`.import-btn`);c.addEventListener(`click`,()=>{(!a.value.trim()||!sh(a.value))&&(b(c),a.placeholder=C(`[[icon:close]] That is not a valid save`),a.value=``)});let l=0;return o.addEventListener(`click`,()=>{if(performance.now()>l){l=performance.now()+3e3,$(o,`[[icon:warning]] Sure? Everything is lost!`),o.classList.add(`confirm`);return}ch()}),()=>{l&&performance.now()>l&&(l=0,$(o,`[[icon:trash]] Start over`),o.classList.remove(`confirm`))}}function ee(e){let t=v[e]??O[e];g.replaceChildren(),D(m,t.title),_={id:e,refresh:t.build(g)},p.hidden=!1,p.classList.remove(`lift`),fh(p,`drop`);for(let[t,n]of Object.entries(T))n.classList.toggle(`active`,t===e);Be(`windowOpened`,{id:e})}function M(){_=null;for(let e of Object.values(T))e.classList.remove(`active`);p.classList.remove(`drop`),p.classList.add(`lift`),setTimeout(te,260)}function te(){p.classList.contains(`lift`)&&(p.hidden=!0,p.classList.remove(`lift`))}p.addEventListener(`animationend`,e=>{e.target===p&&te()}),dh(`window-close`).addEventListener(`click`,()=>{zf(1.25,.16),M()});let ie=Fp(3),oe=(e,t=!1)=>de.map(n=>`
    <div class="stat-row${t?` small`:``}" title="${fe[n].name}">
      <span class="stat-name" style="color:${fe[n].color}">${t?fe[n].short:fe[n].name}</span>
      <span class="pips">${Array.from({length:10},(t,r)=>`<i style="${r<e[n]?`background:${fe[n].color}`:``}"></i>`).join(``)}</span>
    </div>`).join(``),se=e=>(e.traits??[]).map(e=>{let t=_e[e.id];return`<span class="trait ${t.good?`good`:`bad`}" title="${t.name} ${ye[e.lvl]}: ${t.desc(e.lvl)}">${t.icon} ${t.name} ${ye[e.lvl]}</span>`}).join(``);function P(t){Ne(e);let n=-1,r=``;function i(){n=e.board.day,r=e.board.notes.map(e=>e?.id??`-`).join(),t.innerHTML=w(`
        <p class="hint">[[icon:worker]] Hire a worker · <b class="slots"></b> · [[icon:clock]] new notes every day</p>
        <div class="notes">${e.board.notes.map((t,n)=>{if(!t)return`<div class="note cand taken"><span class="taken-mark">[[icon:check]]</span><b>Hired!</b><span class="taken-sub">New notes tomorrow</span></div>`;let r=me(t.rarity);return`
          <div class="note cand" style="--rar:${r.color}" data-idx="${n}">
            <div class="note-rarity">${r.name}</div>
            <img class="note-portrait" src="${ie}" alt="">
            <b class="note-name">${t.name}</b>
            <div class="note-stats">${oe(t.stats)}</div>
            <div class="trait-list">${se(t)||`<span class="trait none">No traits</span>`}</div>
            <div class="note-wage">Wage [[icon:coin]] ${De(t,e)} / day</div>
            <button class="small-btn hire-btn"></button>
          </div>`}).join(``)}</div>
        <button class="wood-btn reroll-btn">[[icon:dice]] New notes · [[icon:coin]] ${R(e)}</button>`),t.querySelectorAll(`.note.cand[data-idx]`).forEach(t=>{let n=Number(t.dataset.idx),r=t.querySelector(`.hire-btn`);r.addEventListener(`click`,t=>{if(!y(`hire`))return b(r);let a=Pe(e,n);if(!a)return b(r);Kf(),mh(t.clientX,t.clientY,me(a.rarity).color),mh(t.clientX,t.clientY,`#ffe27a`),Be(`workerHired`,{id:a.id}),i()})});let a=t.querySelector(`.reroll-btn`);a.addEventListener(`click`,t=>{if(e.money<R(e))return b(a);e.money-=R(e),Me(e),zf(1.1),mh(t.clientX,t.clientY,`#c9b89a`),i()})}return i(),()=>{Ne(e);let a=e.board.notes.map(e=>e?.id??`-`).join();(e.board.day!==n||a!==r)&&i();let o=e.workerCap-e.workers.length;$(t.querySelector(`.slots`),`slots ${e.workers.length} / ${e.workerCap}`),t.querySelectorAll(`.note.cand[data-idx]`).forEach(t=>{let n=e.board.notes[Number(t.dataset.idx)];if(!n)return;let r=Ee(e,n),i=t.querySelector(`.hire-btn`);$(i,o>0?`[[icon:coin]] ${Ft(r)} · Hire`:`No free slot`),i.disabled=o<=0||e.money<r}),t.querySelector(`.reroll-btn`).disabled=e.money<R(e)}}function F(n){let r=``,i=null,a=()=>e.workers.map(e=>e.id+e.priorities.join()+e.level).join(`|`);function o(){if(r=a(),!e.workers.length){n.innerHTML=w(`<p class="hint">[[icon:worker]] No workers yet · hire them on the [[icon:scroll]] Board</p>`);return}n.innerHTML=w(`
        <p class="hint">[[icon:worker]] Workers pick tasks on their own · click a task to make it their top priority</p>
        <div class="wage-sum">[[icon:coin]] Daily wages <b class="wage-total"></b> · [[icon:sun]] payday ${`6`.padStart(2,`0`)}:00</div>
        <div class="worker-list">${e.workers.map(t=>{let n=me(t.rarity),r=t.priorities.map((e,t)=>`<button class="prio-chip${t===0?` top`:``}" data-task="${e}"><span class="prio-n">${t+1}</span>${he[e].icon} ${he[e].name}</button>`).join(``);return`
            <div class="worker-row" data-id="${t.id}" style="--rar:${n.color}">
              <img class="worker-portrait" src="${ie}" alt="">
              <div class="worker-main">
                <div class="worker-head"><b>${t.name}</b><span class="lvl-tag">Lv ${t.level}</span><span class="rar-tag">${n.name}</span><span class="wage-tag">[[icon:coin]] ${De(t,e)}/day</span></div>
                <div class="xp-bar" title="XP"><i></i></div>
                <div class="worker-status"></div>
                <div class="trait-list">${se(t)}</div>
                <div class="worker-prios">${r}</div>
              </div>
              <div class="worker-stats">${oe(t.stats,!0)}</div>
              <button class="small-btn fire-btn">Fire</button>
            </div>`}).join(``)}</div>`),n.querySelectorAll(`.worker-row`).forEach(t=>{let n=e.workers.find(e=>e.id===t.dataset.id);t.querySelectorAll(`.prio-chip`).forEach(e=>{e.addEventListener(`click`,()=>{n.priorities=[e.dataset.task,...n.priorities.filter(t=>t!==e.dataset.task)],zf(1.3,.14),o()})});let r=t.querySelector(`.fire-btn`);r.addEventListener(`click`,()=>{if(i!==n.id){i=n.id,D(r,`Sure?`),r.classList.add(`confirm`),setTimeout(()=>{i===n.id&&(i=null,r.isConnected&&(D(r,`Fire`),r.classList.remove(`confirm`)))},2500);return}i=null,Fe(e,n.id),zf(.8),o()})})}return o(),()=>{a()!==r&&o();let i=n.querySelector(`.wage-total`);i&&$(i,`[[icon:coin]] ${Ft(Oe(e))}`),n.querySelectorAll(`.worker-row`).forEach(n=>{let r=e.workers.find(e=>e.id===n.dataset.id);$(n.querySelector(`.worker-status`),t.fellaStatus(n.dataset.id));let i=r.level>=be(e)?100:Math.min(100,r.xp/xe(r.level)*100);n.querySelector(`.xp-bar i`).style.width=i+`%`})}}function I(n){let r=``,i=[],a=()=>Ke.map(t=>Ye(e)[t]).join();function o(){r=a();let o=Ye(e),{cols:s,rows:c}=Ze(e),l=s+2,u=c+2,d=Math.floor(Math.min(24,300/(l+u))),f=1+o.w+1,p=1+o.n+1,m=[];for(let t=0;t<u;t++)for(let n=0;n<l;n++){let r=n>=1&&n<=s,i=t>=1&&t<=c,a=r&&t===0?`n`:r&&t===u-1?`s`:i&&n===0?`w`:i&&n===l-1?`e`:null;r&&i?m.push(`<div class="plot-cell owned">${n===f&&t===p?`<span>[[icon:chest]]</span>`:``}</div>`):a&&et(e,a)?m.push(`<div class="plot-cell buyable" data-side="${a}"><span>+</span></div>`):m.push(`<div class="plot-cell void"></div>`)}let h=(l+u)*d/Math.SQRT2,g=[`w`,`n`,`s`,`e`].map(e=>`<button class="small-btn land-btn" data-side="${e}"></button>`).join(``);n.innerHTML=w(`
        <p class="hint">[[icon:map]] Buy a whole row of plots on one side · [[icon:oak]] +1 tree bed per row · [[icon:mouse]] drag the ground to look around</p>
        <div class="land-info">Land <b>${s}×${c}</b> plots · ${s*3}×${c*3} tiles · [[icon:oak]] Tree beds <b class="land-trees"></b></div>
        <div class="land-layout">
          <div class="plot-map" style="width:${h}px;height:${h}px">
            <div class="plot-grid" style="--cols:${l};--cell:${d}px">${m.join(``)}</div>
          </div>
          <div class="land-buttons">${g}</div>
        </div>`);let _=n.querySelector(`.plot-map`),v=e=>{e?_.dataset.hover=e:delete _.dataset.hover},x=(e,n,r)=>{if(!y(`land`)||!t.expandLand(e))return b(n);mh(r.clientX,r.clientY,`#7fc95e`),mh(r.clientX,r.clientY,`#ffe27a`)};n.querySelectorAll(`.plot-cell.buyable`).forEach(e=>{e.addEventListener(`mouseenter`,()=>v(e.dataset.side)),e.addEventListener(`mouseleave`,()=>v(null)),e.addEventListener(`click`,t=>x(e.dataset.side,e,t))}),i=[...n.querySelectorAll(`.land-btn`)].map(e=>{let t=e.dataset.side;return e.addEventListener(`mouseenter`,()=>v(t)),e.addEventListener(`mouseleave`,()=>v(null)),e.addEventListener(`click`,n=>x(t,e,n)),{side:t,btn:e}})}return o(),()=>{a()!==r&&o();let s=t.treeSlots();$(n.querySelector(`.land-trees`),`${s.used} / ${s.cap}`);for(let{side:t,btn:r}of i){let{arrow:i,name:a}=qe[t];if(!et(e,t)){$(r,`${i} ${a} · max`),r.disabled=!0;continue}let o=tt(e,t);$(r,`${i} ${a} · ${$e(e,t)} plots · [[icon:coin]] ${Ft(o)}`),r.disabled=e.money<o,n.querySelectorAll(`.plot-cell.buyable[data-side="${t}"]`).forEach(e=>e.classList.toggle(`poor`,r.disabled))}}}let ce=Object.fromEntries(Object.keys(ht).map(e=>[e,vp(e)])),le=n=>{let r=ht[n];return(e.inventory[n]??0)>0||!r.species?!0:re(e,r.species)?r.type!==`plank`||t.hasSawmill():!1},pe=x(`soil`);function ge(e,t){t<=0||(Be(`sold`,{earned:t}),qf(),mh(e.clientX,e.clientY,`#f0c84a`),mh(e.clientX,e.clientY,`#ffe27a`))}function ve(n){n.innerHTML=w(`
      <div class="chest-summary">
        <div class="chest-total"><span>Total value</span><b id="chest-total"></b></div>
        <button class="wood-btn" id="chest-sell-all">Sell all</button>
      </div>
      <div class="chest-fill"><span id="chest-used"></span><div class="fill-bar"><div class="fill-bar-in" id="chest-bar"></div></div></div>
      <div class="chest-trees">[[icon:oak]] Tree beds <b id="chest-trees"></b> · trees only grow in beds · click a free bed or stump to plant</div>
      <div class="auto-info" id="auto-info" hidden>[[icon:repeat]] Auto-Sell: chest full [[icon:right]] sells <b>[[icon:check]]</b> items · keeps the set amount and what [[icon:orders]] orders need</div>
      <div class="item-list">${Object.entries(ht).map(([e,t])=>`
      <div class="item-row" data-key="${e}">
        <img class="item-icon" src="${ce[e]}" alt="">
        <div class="item-info"><b>${t.name}</b><span class="item-unit"></span>
          <div class="auto-ctl" hidden>
            <button class="auto-toggle" title="Auto-Sell this item when the chest is full"></button>
            <span class="keep-label">keep</span>
            <button class="keep-btn keep-dec" title="−1 · Shift: −10">−</button>
            <b class="keep-n"></b>
            <button class="keep-btn keep-inc" title="+1 · Shift: +10">+</button>
          </div>
        </div>
        <div class="item-count"></div>
        <div class="item-value"></div>
        <div class="item-actions">
          ${t.plantable?`<button class="small-btn buy-sapling-btn"></button><button class="small-btn plant-btn">Plant</button>`:``}
          <button class="small-btn sell-btn">Sell</button>
        </div>
      </div>`).join(``)}</div>`);let r=n.querySelector(`#chest-total`),i=n.querySelector(`#chest-used`),a=n.querySelector(`#chest-bar`),o=n.querySelector(`#chest-sell-all`);o.addEventListener(`click`,t=>{if(!y(`sell`,`all`))return b(o);ge(t,Dt(e))});let s=[...n.querySelectorAll(`.item-row`)].map(n=>{let r=n.dataset.key,i=n.querySelector(`.sell-btn`);i.addEventListener(`click`,t=>{if(!y(`sell`,r))return b(i);ge(t,Et(e,r))});let a=n.querySelector(`.buy-sapling-btn`),o=ht[r].species;a?.addEventListener(`click`,n=>{let i=ae(t.treeSlots().used,e.saplingPriceMult,o);if(!y(`buy`)||e.money<i||xt(e)>=e.woodCap)return b(a);e.money-=i,e.inventory[r]+=1,qf(),mh(n.clientX,n.clientY,`#7fc95e`)}),n.querySelector(`.plant-btn`)?.addEventListener(`click`,()=>{if(!y(`plant`))return b();zf(1.2),M(),t.beginPlanting(o)});let s=kt(e,r),c=n.querySelector(`.auto-toggle`);c.addEventListener(`click`,()=>{s.on=!s.on,zf(s.on?1.3:.9,.15)});for(let[e,t]of[[`.keep-dec`,-1],[`.keep-inc`,1]])n.querySelector(e).addEventListener(`click`,e=>{s.keep=Math.max(0,s.keep+t*(e.shiftKey?10:1)),zf(1.4,.1)});return{key:r,row:n,rule:s,toggle:c,auto:n.querySelector(`.auto-ctl`),keep:n.querySelector(`.keep-n`),unit:n.querySelector(`.item-unit`),count:n.querySelector(`.item-count`),value:n.querySelector(`.item-value`),sell:n.querySelector(`.sell-btn`),plant:n.querySelector(`.plant-btn`),buy:a}});return()=>{let c=xt(e);$(r,`[[icon:coin]] ${Ft(wt(e))}`),$(i,`Used: ${c} / ${e.woodCap} slots`),a.style.width=Math.min(100,c/e.woodCap*100)+`%`,a.classList.toggle(`full`,c>=e.woodCap);let l=t.treeSlots();$(n.querySelector(`#chest-trees`),`${l.used} / ${l.cap}`),o.disabled=c===0,n.querySelector(`#auto-info`).hidden=!e.autoSell;for(let n of s){if(n.auto.hidden=!e.autoSell,e.autoSell){$(n.toggle,n.rule.on?`[[icon:repeat]] Auto [[icon:check]]`:`[[icon:repeat]] Auto [[icon:close]]`),n.toggle.classList.toggle(`on`,n.rule.on);let t=At(e,n.key);$(n.keep,t>n.rule.keep?`${n.rule.keep} · [[icon:orders]] ${t}`:String(n.rule.keep)),n.keep.title=C(t>0?`${t} kept for open orders`:``),n.auto.classList.toggle(`off`,!n.rule.on)}let r=e.inventory[n.key],i=St(e,n.key);if($(n.unit,`[[icon:coin]] ${Ft(i)} each`),$(n.count,`×${r}`),$(n.value,`[[icon:coin]] ${Ft(r*i)}`),n.row.hidden=!le(n.key),n.row.classList.toggle(`empty`,r===0),n.sell.disabled=r===0,n.plant&&(n.plant.disabled=r===0),n.buy){let r=ae(t.treeSlots().used,e.saplingPriceMult,ht[n.key].species);$(n.buy,`[[icon:coin]] ${Ft(r)} · Buy`),n.buy.disabled=e.money<r||c>=e.woodCap}}}}function L(n){n.innerHTML=w(`
      <p class="hint">[[icon:soil]] Everything sits on the tile grid · 1 tile = 1 tree · [[icon:mouse]] left: place · right / ESC: done</p>
      <h3 class="shop-title">Soils</h3>
      <div class="shop-list">${Object.entries(gt).map(([e,t])=>`
      <div class="shop-card" data-soil="${e}">
        <img class="shop-icon" src="${pe}" alt="">
        <div class="shop-info">
          <b>${t.name}</b>
          <span>${t.desc}</span>
          <span class="shop-meta">1 tile · <span class="soil-count"></span></span>
        </div>
        <button class="small-btn buy-btn"></button>
      </div>`).join(``)}</div>
      <h3 class="shop-title">Buildings</h3>
      <div class="shop-list">${np.map(e=>{let t=tp[e],n=t.kind===`irrigation`?`1 tile · [[icon:water]]×${t.outlets.length} · R: rotate`:`${t.size}×${t.size} tiles`;return`
      <div class="shop-card" data-building="${e}">
        <img class="shop-icon" src="${we[e]}" alt="">
        <div class="shop-info">
          <b>${t.icon} ${t.name}</b>
          <span>${t.desc}</span>
          <span class="shop-meta">${n} · <span class="b-count"></span></span>
        </div>
        <button class="small-btn buy-btn"></button>
      </div>`}).join(``)}</div>`);let r=[...n.querySelectorAll(`[data-building]`)].map(n=>{let r=n.dataset.building,i=n.querySelector(`.buy-btn`);return i.addEventListener(`click`,n=>{let a=tp[r];if((e.repLevel??0)<a.unlockRep||e.money<t.buildPrice(r))return b(i);hh(i,n,`#8a5a2b`),M(),t.beginBuilding(r)}),{type:r,card:n,btn:i,count:n.querySelector(`.b-count`)}}),i=[...n.querySelectorAll(`[data-soil]`)].map(n=>{let r=n.dataset.soil,i=n.querySelector(`.buy-btn`);return i.addEventListener(`click`,n=>{if(e.money<Ce(r)){Gf();return}hh(i,n,`#8a5a2b`),M(),t.beginSoil(r)}),{key:r,btn:i,count:n.querySelector(`.soil-count`)}});return()=>{for(let n of r){let r=tp[n.type],i=(e.repLevel??0)<r.unlockRep,a=t.buildPrice(n.type);n.card.classList.toggle(`locked`,i),$(n.btn,i?`[[icon:lock]] [[icon:star]] Rep ${r.unlockRep}`:`[[icon:coin]] ${Ft(a)} · Place`),n.btn.disabled=i||e.money<a,$(n.count,`placed: ${t.countOf(n.type)}`)}for(let t of i){let n=Ce(t.key);$(t.btn,`[[icon:coin]] ${Ft(n)} · Place`),t.btn.disabled=e.money<n,$(t.count,`placed: ${Object.values(e.soils).filter(e=>e===t.key).length}`)}}}let Ce=t=>Ct(e,t),we=Object.fromEntries(np.map(e=>[e,x({sawmill:`saw`,spout:`water`,splitter:`leaves`,sprinkler:`sprinkler`,fountain:`fountain`}[e])])),z=e=>{let t=Math.max(0,Math.ceil(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`},B=Object.fromEntries(rt.map(e=>[e.id,Ip(e.look,2)])),Te=e=>`<span class="hearts">${`[[icon:heart]]`.repeat(e)}<i>${`[[icon:heart-empty]]`.repeat(st-e)}</i></span>`,Ae=null;function je(t){Dm(e),t.innerHTML=w(`
      <div class="rep-box">
        <div class="rep-head"><b>[[icon:star]] Reputation <span id="rep-level"></span></b><span id="rep-points"></span></div>
        <div class="fill-bar rep-bar"><div class="fill-bar-in" id="rep-bar"></div></div>
        <div class="rep-next"><span id="rep-next"></span><span id="rep-bonus" class="rep-bonus"></span></div>
      </div>
      <p class="hint">[[icon:orders]] Customers pay far more than the market · [[icon:bolt]] deliver fast for a tip · [[icon:heart]] loyal customers give lasting bonuses</p>
      <div class="order-list" id="order-list"></div>
      <h3 class="shop-title">[[icon:heart]] Regular customers</h3>
      <div class="customer-list" id="customer-list"></div>`);let n=t.querySelector(`#order-list`),r=t.querySelector(`#customer-list`),i=null,a=null,o=[];function s(){r.innerHTML=w(rt.map(t=>{let n=e.customers?.[t.id]??{pts:0,orders:0},r=ut(n.pts),i=ft(r),a=ot[r+1],o=a?(n.pts-ot[r])/(a-ot[r])*100:100,s=i===2?`<b class="perk-max">MAX</b>`:i===1?`<span class="perk-next">×2 at [[icon:heart]]${ct[1]}</span>`:`<span class="perk-lock">[[icon:lock]] [[icon:heart]]${ct[0]}</span>`;return`
          <div class="customer-card tier${i}" title="${n.orders} orders delivered">
            <img class="cust-portrait" src="${B[t.id]}" alt="">
            <div class="cust-main">
              <div class="cust-head"><b>${t.icon} ${t.name}</b>${Te(r)}</div>
              <div class="fill-bar love-bar"><div class="fill-bar-in" style="width:${o}%"></div></div>
              <div class="cust-perk">${t.perk.icon} ${t.perk.text(i)} ${s}</div>
            </div>
          </div>`}).join(``))}function c(){let t=e.orders.list;if(!t.length){n.innerHTML=w(`<div class="order-empty">[[icon:clock]] Waiting for customers… <span id="order-next"></span></div>`),o=[],Ae=null;return}n.innerHTML=w(t.map(t=>{let n=it(t.customerId),r=Sm[t.kind]??Sm.normal,i=t.kind===`normal`?``:`<span class="order-kind kind-${t.kind}">${r.icon} ${r.name}</span>`;return`
        <div class="order-card kind-${t.kind}" data-id="${t.id}">
          <div class="order-who">
            <img class="order-portrait" src="${B[n.id]}" alt="">
            <div><b>${n.name}</b> ${i}<div>${Te(dt(e,n.id))}</div></div>
          </div>
          <div class="order-items">${t.items.map(e=>`
            <span class="order-chip" data-key="${e.key}" title="${ht[e.key].name}">
              <img src="${ce[e.key]}" alt=""><span class="oc-n"></span>
            </span>`).join(``)}</div>
          <div class="order-reward">[[icon:coin]] ${Ft(t.reward)} <span class="order-tip"></span><span class="order-rep">[[icon:star]] +${t.rep} · <span class="hearts">[[icon:heart]]</span> +${r.love}</span></div>
          <div class="order-time"><div class="fill-bar"><div class="fill-bar-in"></div></div><span class="ot-text"></span></div>
          <div class="order-actions">
            <button class="small-btn sell-btn deliver-btn">Deliver</button>
            <button class="small-btn decline-btn" title="Decline">[[icon:close]]</button>
          </div>
        </div>`}).join(``)),o=[...n.querySelectorAll(`.order-card`)].map(t=>{let n=Number(t.dataset.id),r=t.querySelector(`.deliver-btn`);return r.addEventListener(`click`,t=>{if(!Im(e,n))return b(r);qf(),Kf(),mh(t.clientX,t.clientY,`#f0c84a`),mh(t.clientX,t.clientY,`#3aa8a0`)}),t.querySelector(`.decline-btn`).addEventListener(`click`,()=>{zf(.8),Lm(e,n)}),Ae===n&&(fh(t,`highlight`),t.scrollIntoView({block:`nearest`})),{id:n,card:t,deliver:r,chips:[...t.querySelectorAll(`.order-chip`)],bar:t.querySelector(`.order-time .fill-bar-in`),time:t.querySelector(`.ot-text`),tip:t.querySelector(`.order-tip`)}}),Ae=null}return()=>{Dm(e);let r=e.repLevel??0,l=Ge(r),u=Ve[r];$(t.querySelector(`#rep-level`),`Lv ${r}`),$(t.querySelector(`#rep-points`),l?`${e.reputation} / ${l}`:`${e.reputation} · max`),t.querySelector(`#rep-bar`).style.width=(l?(e.reputation-u)/(l-u)*100:100)+`%`;let d=Ue[r+1];$(t.querySelector(`#rep-next`),d?`Next: ${d.icon} ${d.text}`:`[[icon:crown]] Fully renowned!`),$(t.querySelector(`#rep-bonus`),r>0?`[[icon:market]] Market +${Math.round(r*He*100)}%`:``);let f=e.orders.list.map(e=>e.id).join(`,`);(f!==i||Ae)&&(i=f,c());let p=rt.map(t=>e.customers?.[t.id]?.pts??0).join();p!==a&&(a=p,s());let m=n.querySelector(`#order-next`);m&&$(m,e.orders.list.length<Tm(e)?`next in ~${z(e.orders.nextIn)}`:``);for(let t of o){let n=e.orders.list.find(e=>e.id===t.id);if(!n)continue;n.items.forEach((n,r)=>{let i=e.inventory[n.key]??0,a=t.chips[r];$(a.querySelector(`.oc-n`),`${Math.min(i,n.n)}/${n.n}`),a.classList.toggle(`ok`,i>=n.n)});let r=n.time/n.total;t.bar.style.width=r*100+`%`,t.bar.classList.toggle(`full`,r<.25),$(t.time,`[[icon:clock]] ${z(n.time)}`);let i=jm(n);$(t.tip,i>0?`+${Ft(i)} tip`:``),t.deliver.disabled=!Fm(e,n)}}}let Ie=null;function Le(e){Ie=e,ee(`building`),D(m,`${tp[e.type].icon} ${tp[e.type].name}`)}t.setBuildingClickHandler(e=>{y(`building`)&&Le(e)}),t.setVisitorClickHandler(t=>{if(t.id===`merchant`)return at();y(`tab`,`orders`)&&bt(e,`orders`)&&(Ae=t.id,_?.id!==`orders`&&ee(`orders`))});let Re=null,ze=e=>{let t=Math.floor(e/60);return t>=60?`${Math.floor(t/60)}h ${String(t%60).padStart(2,`0`)}m`:`${Math.max(1,t)}m`},V=$d().toDataURL(),We=1;function Je(t){We=t,e.inventory.sapling=(e.inventory.sapling??0)+t,ee(`newBed`),Zf();let n=c.getBoundingClientRect();mh(n.left+n.width/2,n.top+n.height/2,`#b8ff8a`),mh(n.left+n.width/2,n.top+n.height/2,`#ffe27a`),Be(`treeBedGained`,{total:e.treeCap})}function Xe(n){n.innerHTML=w(`
      <div class="newbed">
        <div class="newbed-art"><img src="${V}" alt=""><img class="newbed-sapling" src="${ce.sapling}" alt=""></div>
        <p class="newbed-big">Your forest grows!</p>
        <p>Trees only grow in <b>tree beds</b>. You now have room for <b>${e.treeCap}</b> trees.</p>
        <p class="newbed-gift">[[icon:gift]] The forest gives you ${We===1?`a sapling`:`${We} saplings`} for your new bed${We===1?``:`s`}.</p>
        <button class="wood-btn newbed-go">[[icon:hand]] Choose a spot</button>
        <button class="small-btn newbed-later">Later (click [[icon:oak]] Trees at the top)</button>
      </div>`),n.querySelector(`.newbed-go`).addEventListener(`click`,()=>{zf(1.3),M(),t.beginBedPlacement()}),n.querySelector(`.newbed-later`).addEventListener(`click`,()=>{zf(.9),M()})}let Qe=null,nt=Ip({shirt:`#7a4ab0`,hat:`#2a1a40`,hatStyle:`tophat`},3);function at(){y(`merchant`)&&Qe?.current()?.id===`merchant`&&(zf(1.2),_?.id!==`merchant`&&ee(`merchant`))}function lt(t){let n=Qe.offers();t.innerHTML=w(`
      <div class="merchant-head">
        <img src="${nt}" alt="">
        <p><b>"Fine wares from far away!"</b><br>A traveling merchant stops by your meadow. Every deal works once – he leaves soon.</p>
      </div>
      <div class="offer-list">${n.map(e=>`
        <div class="offer-card" data-id="${e.id}">
          <span class="offer-icon">${e.icon}</span>
          <div><b>${e.name}</b><span>${e.desc}</span></div>
          <button class="small-btn sell-btn offer-btn"></button>
        </div>`).join(``)}</div>
      <div class="merchant-timer"></div>`);let r=[...t.querySelectorAll(`.offer-card`)].map(e=>{let t=n.find(t=>t.id===e.dataset.id),r=e.querySelector(`.offer-btn`);return r.addEventListener(`click`,e=>{if(!Qe.buyOffer(t.id))return b(r);qf(),Kf(),mh(e.clientX,e.clientY,`#c98ae0`),mh(e.clientX,e.clientY,`#ffe27a`)}),{o:t,card:e,btn:r}}),i=t.querySelector(`.merchant-timer`);return()=>{let t=Qe.current();if(t?.id!==`merchant`){M();return}$(i,`[[icon:clock]] He leaves in ${z(t.t)}`);for(let{o:t,card:n,btn:i}of r){if(n.classList.toggle(`bought`,!!t.bought),t.bought){$(i,t.result?`[[icon:check]] +${Ft(t.result)}`:`[[icon:check]] Done`),i.disabled=!0;continue}$(i,t.price>0?`[[icon:coin]] ${Ft(t.price)} · Buy`:`Deal!`),i.disabled=e.money<t.price}}}function pt(e){Re=e,ee(`offline`),Zf()}function _t(t){let n=Re,r=Object.entries(n.gained).filter(([,e])=>e!==0).map(([e,t])=>`
      <span class="order-chip ${t>0?`ok`:``}" title="${ht[e].name}"><img src="${ce[e]}" alt="">${t>0?`+`:``}${Ft(t)}</span>`).join(``),i=(e,t,n=``)=>`<div class="away-line ${n}"><span>${e}</span>${t}</div>`,a=[n.sold>0?i(`[[icon:repeat]]`,`Auto-Sell: <b>+${Ft(n.sold)} [[icon:coin]]</b>`):``,n.wages>0?i(`[[icon:sun]]`,`Wages for ${n.paydays} payday${n.paydays===1?``:`s`}: <b>−${Ft(n.wages)} [[icon:coin]]</b>`,`bad`):``,n.grown>0?i(`[[icon:oak]]`,`${n.grown} tree${n.grown===1?``:`s`} grew up`):``,n.customers>0?i(`[[icon:orders]]`,`${n.customers} customer${n.customers===1?` is`:`s are`} waiting for you`):``,n.lost>0?i(`[[icon:chest]]`,`Chest was full: ${Ft(n.lost)} items had no room`,`bad`):``,n.debt?i(`[[icon:warning]]`,`Wages pushed you into debt!`,`bad`):``].join(``),o=n.hasWorkers?n.capped?`[[icon:lantern]] Your team works up to ${e.offlineHours}h while you are away · [[icon:moon]] Night Shift (Workers tree) adds more`:``:`[[icon:lantern]] Hire workers – they keep chopping while you are away!`;t.innerHTML=w(`
      <div class="away-head">You were away <b>${ze(n.away)}</b>${n.capped?` · your team worked <b>${ze(n.time)}</b>`:``}</div>
      ${r?`<div class="away-items">${r}</div>`:`<p class="hint">Nothing new in the chest.</p>`}
      <div class="away-lines">${a}</div>
      <div class="away-net ${n.net<0?`bad`:``}">Coins ${n.net>=0?`+`:`−`}${Ft(Math.abs(n.net))} [[icon:coin]]</div>
      ${o?`<p class="hint">${o}</p>`:``}
      <button class="wood-btn away-ok">Let's go!</button>`),t.querySelector(`.away-ok`).addEventListener(`click`,e=>{mh(e.clientX,e.clientY,`#ffe27a`),qf(),M()})}function vt(n){let r=Ie,i=tp[r.type];if(i.kind===`irrigation`)return n.innerHTML=w(`
        <div class="bld-head">
          <img class="shop-icon" src="${we[r.type]}" alt="">
          <div class="shop-info"><b>${i.name}</b><span>${i.desc}</span>
          <span class="shop-meta">[[icon:water]] ${i.outlets.length} outlet${i.outlets.length>1?`s`:``} · [[icon:sapling]] +${Math.round(i.growth*100)}% growth on watered tiles</span></div>
        </div>
        <p class="hint">[[icon:water]] Watered tiles glow blue · best water source counts · stacks with [[icon:planks]] soil</p>`),()=>{};let a=[`all`,...ne];n.innerHTML=w(`
      <div class="bld-head">
        <img class="shop-icon" src="${we.sawmill}" alt="">
        <div class="shop-info"><b>Sawmill <span id="saw-lvl"></span></b><span id="saw-status"></span>
          <div class="fill-bar"><div class="fill-bar-in" id="saw-progress"></div></div></div>
      </div>
      <div class="saw-flow">
        <div class="saw-box"><span>[[icon:log]] Logs in</span><b id="saw-in"></b><button class="small-btn" id="saw-load">Load from chest</button></div>
        <div class="saw-arrow">[[icon:right]] [[icon:saw]] [[icon:right]]</div>
        <div class="saw-box"><span>[[icon:planks]] Planks out</span><b id="saw-out"></b><button class="small-btn sell-btn" id="saw-take">To chest</button></div>
      </div>
      <h3 class="shop-title">Accepts</h3>
      <div class="saw-accept">${a.map(e=>`<button class="small-btn accept-btn" data-accept="${e}">${e===`all`?`[[icon:star]] All`:`${N(e).icon} ${N(e).name}`}</button>`).join(``)}</div>
      <p class="hint">[[icon:worker]] Workers with the [[icon:saw]] Sawmill task bring logs & fetch planks</p>
      <button class="wood-btn" id="saw-upgrade"></button>`);let o=e=>n.querySelector(e);o(`#saw-load`).addEventListener(`click`,e=>{if(!t.buildingApi.loadLogs(r))return b(o(`#saw-load`));hh(o(`#saw-load`),e,`#c98a4a`)}),o(`#saw-take`).addEventListener(`click`,e=>{if(!t.buildingApi.takePlanks(r))return b(o(`#saw-take`));mh(e.clientX,e.clientY,`#e2b878`)});let s=[...n.querySelectorAll(`.accept-btn`)];for(let e of s)e.addEventListener(`click`,()=>{zf(1.1),t.buildingApi.setAccept(r,e.dataset.accept)});return o(`#saw-upgrade`).addEventListener(`click`,e=>{if(!t.buildingApi.upgrade(r))return b(o(`#saw-upgrade`));mh(e.clientX,e.clientY,`#ffe27a`)}),()=>{if(!t.buildings.includes(r))return M();let n=ip(r),a=i.levels[r.level+1];$(o(`#saw-lvl`),`Lv ${r.level+1}`);let c=r.input.length>0&&r.output.length<n.outCap;$(o(`#saw-status`),r.output.length>=n.outCap?`[[icon:warning]] Planks full — collect them!`:c?`[[icon:saw]] Sawing… ${n.time}s per plank`:`[[icon:moon]] Waiting for logs`),o(`#saw-progress`).style.width=(c?r.progress*100:0)+`%`,$(o(`#saw-in`),`${r.input.length} / ${n.inCap}`),$(o(`#saw-out`),`${r.output.length} / ${n.outCap}`),o(`#saw-take`).disabled=r.output.length===0;for(let t of s){let n=t.dataset.accept;t.hidden=n!==`all`&&!re(e,n),t.classList.toggle(`active`,r.accept===n)}let l=o(`#saw-upgrade`);l.hidden=!a,a&&($(l,`[[icon:up]] Upgrade: ${a.time}s/plank · ${a.inCap} slots · [[icon:coin]] ${Ft(a.cost)}`),l.disabled=e.money<a.cost)}}let Tt=dh(`tree-tabs`),Ot=dh(`tree-canvas`),jt=dh(`tree-scroll`),Mt=`click`,Nt={},It=new Map;for(let e of ue){let t=gh({icon:e.icon,label:e.name,accent:e.accent},()=>{if(Mt!==e.id){if(!y(`tree`,e.id))return b(t);Lt(e.id)}});Tt.appendChild(t),Nt[e.id]=t}function Lt(e){Mt=e;for(let[t,n]of Object.entries(Nt))n.classList.toggle(`active`,t===e);$t(),Wt(),jt.scrollLeft=0}function zt(e,t){return{x:48+e*114,y:15+t*81}}let Bt=ue.flatMap(e=>e.nodes),Vt=t=>e.skills[t.id]??0,H=t=>(t.requires??[]).every(t=>(e.skills[t]??0)>0),Ht=e=>Vt(e)>=e.max,Ut=e=>e.cost(Vt(e));function Wt(){let e=ue.find(e=>e.id===Mt).nodes;It.clear(),Ot.replaceChildren();let t=96+Math.max(...e.map(e=>e.col))*114+60,n=`http://www.w3.org/2000/svg`,r=document.createElementNS(n,`svg`);r.setAttribute(`class`,`tree-lines`),r.setAttribute(`width`,t),r.setAttribute(`height`,270);let i=new Map(e.map(e=>[e.id,e])),a=new Map,o=new Map;for(let t of e)for(let e of t.requires??[]){let s=i.get(e);if(!s)continue;let c=zt(s.col,s.row),l=zt(t.col,t.row),u=c.x+60,d=c.y+30,f=l.x,p=l.y+30,m=`M${u},${d} H${Math.round((u+f)/6)*3} V${p} H${f}`,h=document.createElementNS(n,`g`);for(let e of[`line-outline`,`line-branch`,`line-highlight`]){let t=document.createElementNS(n,`path`);t.setAttribute(`d`,m),t.setAttribute(`class`,e),t.setAttribute(`pathLength`,`1`),h.appendChild(t)}r.appendChild(h),a.has(e)||a.set(e,[]),a.get(e).push(h),o.has(t.id)||o.set(t.id,[]),o.get(t.id).push(h)}Ot.appendChild(r);for(let t of e){let{x:e,y:n}=zt(t.col,t.row),r=document.createElement(`button`);r.className=`skill-node pop-in`,r.setAttribute(`aria-label`,t.name),r.style.setProperty(`--delay`,`${t.col*28+t.row*10}ms`),r.style.left=e+`px`,r.style.top=n+`px`,r.style.zIndex=3-t.row,r.style.setProperty(`--slice`,`var(--tex-slice-${(t.col*3+t.row)%h.length})`),r.innerHTML=w(`<span class="node-icon">${t.icon}</span><span class="node-level"></span><span class="node-cost"></span>`),r.addEventListener(`click`,()=>Gt(t)),r.addEventListener(`animationend`,()=>r.classList.remove(`pop-in`,`bought`,`reveal`,`denied`)),r.addEventListener(`mouseenter`,()=>Qt(t,r)),r.addEventListener(`mouseleave`,$t),Ot.appendChild(r),It.set(t.id,{node:t,el:r,levelEl:r.querySelector(`.node-level`),costEl:r.querySelector(`.node-cost`),outLines:a.get(t.id)??[],inLines:o.get(t.id)??[],visible:null})}qt()}function Gt(t){let n=It.get(t.id);if(Ht(t))return;if(!y(`skill`,t.id)||e.money<Ut(t)){Gf(),fh(n.el,`denied`);return}e.money-=Ut(t),e.skills[t.id]=Vt(t)+1,yt(e),Kf(),fh(n.el,`bought`);let r=n.el.getBoundingClientRect();mh(r.left+r.width/2,r.top+r.height/2,`#ffe27a`),mh(r.left+r.width/2,r.top+r.height/2,`#f0c84a`),qt(),Qt(t,n.el),Be(`skillBought`,{id:t.id})}function Kt(e){for(let t of e.inLines)fh(t,`grow`);fh(e.el,`reveal`),setTimeout(()=>{let t=e.el.getBoundingClientRect();mh(t.left+t.width/2,t.top+t.height/2,`#b8ff8a`),zf(1.5,.1)},380)}function qt(){let t=0;for(let n of It.values()){let{node:r,el:i,levelEl:a,costEl:o,outLines:s,inLines:c}=n,l=H(r)||Vt(r)>0;if(l!==n.visible){i.hidden=!l;for(let e of c)e.style.display=l?``:`none`;l&&n.visible===!1&&Kt(n),n.visible=l}if(!l)continue;t=Math.max(t,r.col);let u=Vt(r),d=Ht(r),f=!d&&e.money>=Ut(r);i.classList.toggle(`owned`,u>0),i.classList.toggle(`maxed`,d),i.classList.toggle(`affordable`,f),i.classList.toggle(`expensive`,!d&&!f),$(a,r.max>1?`${u}/${r.max}`:u?`[[icon:check]]`:``),a.hidden=r.max===1&&!u,$(o,d?r.max>1?`MAX`:`Owned`:`[[icon:coin]] ${Ft(Ut(r))}`);for(let e of s)e.classList.toggle(`lit`,u>0)}Ot.style.width=96+t*114+60+`px`,Yt&&Zt(Yt)}let Jt=document.createElement(`div`);Jt.id=`skill-tip`,Jt.hidden=!0,document.body.appendChild(Jt);let Yt=null,Xt=``;function Zt(t){let n=Vt(t),r=Ht(t),i=H(t),a=r?0:Ut(t),o=(t.requires??[]).filter(t=>!(e.skills[t]>0)).map(e=>Bt.find(t=>t.id===e)?.name??e),s=``;t.value&&(s=r?`<div class="tip-value">${t.value(n)}</div>`:`<div class="tip-value">${t.value(n)} <span class="tip-arrow">[[icon:right]]</span> <b>${t.value(n+1)}</b></div>`);let c;c=r?`<div class="tip-max">Maxed out</div>`:i?`<div class="tip-cost ${e.money>=a?`ok`:`no`}">Cost: [[icon:coin]] ${Ft(a)}</div>`:`<div class="tip-locked">[[icon:lock]] Requires: ${o.join(`, `)}</div>`;let l=t.max>1?`Level ${n}/${t.max}`:n?`Owned`:`One-time`,u=`
      <div class="tip-head"><span class="tip-icon">${t.icon}</span><span class="tip-name">${t.name}</span><span class="tip-level">${l}</span></div>
      <div class="tip-desc">${t.desc}</div>${s}${c}`;u!==Xt&&(Jt.innerHTML=w(u),Xt=u)}function Qt(e,t){Yt=e,Zt(e),Jt.hidden=!1;let n=t.getBoundingClientRect(),r=Jt.offsetWidth,i=Jt.offsetHeight,a=Math.max(8,Math.min(window.innerWidth-r-8,n.left+n.width/2-r/2));Jt.style.left=a+`px`,Jt.style.top=Math.max(8,n.top-i-12)+`px`}function $t(){Yt=null,Jt.hidden=!0}jt.addEventListener(`scroll`,$t),jt.addEventListener(`wheel`,e=>{e.deltaY!==0&&(e.preventDefault(),jt.scrollLeft+=e.deltaY)},{passive:!1});let en=null;jt.addEventListener(`pointerdown`,e=>{e.target.closest(`.skill-node`)||(en={x:e.clientX,left:jt.scrollLeft},jt.setPointerCapture(e.pointerId),jt.classList.add(`dragging`))}),jt.addEventListener(`pointermove`,e=>{en&&(jt.scrollLeft=en.left-(e.clientX-en.x))});let tn=()=>{en=null,jt.classList.remove(`dragging`)};jt.addEventListener(`pointerup`,tn),jt.addEventListener(`pointercancel`,tn),Lt(Mt);function nn(){let d=Ft(e.money);n.textContent!==d&&fh(n,`bump`),$(n,d),n.classList.toggle(`negative`,e.money<0);let p=ke(e);r.classList.toggle(`warn`,!!p),r.title=C(p?`Payday in ${Math.max(1,Math.ceil(p.hours))}h: wages [[icon:coin]] ${Ft(p.wages)} · not enough coins!`:e.money<0?`In debt: ${Math.round(Se*100)}% of every sale and order is garnished`:``);let m=`${xt(e)} / ${e.woodCap}`;i.textContent!==m&&fh(i,`bump`),$(i,m),$(a,`Day ${e.day} · ${Rt(e.hour)}`),$(o,Pt(e.hour)?`[[icon:sun]]`:`[[icon:moon]]`),$(s,`${e.workers.length} / ${e.workerCap}`);let h=t.treeSlots();if($(l,`${h.used} / ${h.cap}`),c.classList.toggle(`pending`,h.pending>0),c.classList.toggle(`full`,!h.free&&!h.pending),u.hidden=!h.pending,$(u,`+${h.pending}`),c.title=h.pending?`A new tree bed! Click to choose where it goes`:`${h.used} of ${h.cap} tree beds used · trees only grow in tree beds · more beds: Forest Space (Economy) and land`,e.treeCapSeen??=e.treeCap,e.treeCap>e.treeCapSeen&&e.tutorial===`done`){let t=e.treeCap-e.treeCapSeen;e.treeCapSeen=e.treeCap,Je(t)}f.forEach((t,n)=>t.classList.toggle(`active`,mt[n]===e.speed)),_?.refresh?.(),qt(),E()}let rn=e=>e&&!e.hidden&&e.offsetParent!==null?e.getBoundingClientRect():null;return{update:nn,setGate:e=>{y=e},showTree:Lt,closeWindow:M,isWindowOpen:e=>_?.id===e,tabRect:e=>rn(T[e]),treeTabRect:e=>rn(Nt[e]),elRect:e=>rn(document.querySelector(e)),nodeRect:e=>rn(It.get(e)?.el),activeTree:()=>Mt,openBuilding:Le,showOfflineReport:pt,openMerchant:at,setRandomEvents:e=>{Qe=e}}}var vh=[`chop`,`collect`,`openChest`,`sell`,`upgrade`],yh={chop:{icons:`[[icon:axe]] [[icon:oak]]`,text:`Chop the tree!`},collect:{icons:`[[icon:hand]] [[icon:log]] [[icon:right]] [[icon:chest]]`,text:`Collect the wood`},openChest:{icons:`[[icon:chest]]`,text:`Open your chest`},sell:{icons:`[[icon:log]] [[icon:right]] [[icon:coin]]`,text:`Sell everything`},upgrade:{icons:`[[icon:coin]] [[icon:right]] [[icon:up]]`,text:`Buy your first upgrade`}},bh=(e,t=40)=>{if(!e)return null;let n=(e.left+e.right)/2,r=(e.top+e.bottom)/2;return{left:n-t,right:n+t,top:r-t,bottom:r+t,width:t*2,height:t*2}},xh={workers:{tab:`board`,icons:`[[icon:scroll]] [[icon:worker]]`,text:`New: Board & Team!`},build:{tab:`buildings`,icons:`[[icon:hut]] [[icon:planks]]`,text:`New: Build tab!`},sapling:{tab:`chest`,icons:`[[icon:sapling]] [[icon:right]] [[icon:soil]]`,text:`Plant saplings from the chest`},full:{tab:`chest`,icons:`[[icon:chest]] [[icon:close]] [[icon:right]] [[icon:coin]]`,text:`Chest full · sell!`},firstWorker:{tab:`management`,icons:`[[icon:worker]] [[icon:right]] [[icon:axe]] [[icon:log]] [[icon:sapling]]`,text:`Workers work on their own!`},replant:{rect:(e,t)=>t.stumpRect(),icons:`[[icon:sapling]] [[icon:right]] [[icon:log]] [[icon:hand]]`,text:`Click the stump to replant`},noSapling:{tab:`chest`,icons:`[[icon:sapling]] [[icon:close]] [[icon:right]] [[icon:chest]] [[icon:coin]]`,text:`Buy saplings in the chest`},workersTree:{rect:e=>e.treeTabRect(`worker`),icons:`[[icon:worker]] [[icon:hut]]`,text:`Get help: Workers tree`},payday:{rect:e=>e.elRect(`#hud-money`),icons:`[[icon:sun]] [[icon:coin]] [[icon:right]] [[icon:worker]]`,text:`Payday! Wages paid`},debt:{rect:e=>e.elRect(`#hud-money`),icons:`[[icon:warning]] [[icon:coin]]`,text:`In debt: sales −25%`},levelUp:{tab:`management`,icons:`[[icon:star]] [[icon:worker]] [[icon:up]]`,text:`Level up! Stats +1`},seeds:{tab:`chest`,icons:`[[icon:sapling]] [[icon:right]] [[icon:flag]] [[icon:right]] [[icon:worker]]`,text:`Mark a tile · workers plant`},orders:{tab:`orders`,icons:`[[icon:orders]] [[icon:log]] [[icon:right]] [[icon:coin]] [[icon:star]]`,text:`New: Orders! Pay extra`},sawmill:{tab:`buildings`,icons:`[[icon:log]] [[icon:right]] [[icon:saw]] [[icon:right]] [[icon:planks]]`,text:`Click the sawmill · [[icon:worker]] help`},irrigation:{tab:`buildings`,icons:`[[icon:water]] [[icon:right]] [[icon:sapling]] [[icon:right]]`,text:`Watered tiles grow faster`},land:{rect:e=>e.tabRect(`plots`),icons:`[[icon:map]] [[icon:coin]] [[icon:right]] [[icon:oak]] +`,text:`Buy land: a new tree bed`},landBought:{rect:e=>bh(e.elRect(`#viewport`)),icons:`[[icon:mouse]] [[icon:hand]] [[icon:right]]`,text:`Drag the ground to look around`},customerPerk:{tab:`orders`,icons:`[[icon:heart]] [[icon:heart]] [[icon:heart]] [[icon:right]] [[icon:gift]]`,text:`Loyal customer: bonus unlocked!`},rushOrder:{tab:`orders`,icons:`[[icon:bolt]] [[icon:orders]] [[icon:clock]]`,text:`Rush order: little time, big pay`},ev_merchant:{rect:e=>e.elRect(`#event-banner`),icons:`[[icon:backpack]] [[icon:right]] [[icon:mouse]]`,text:`Click the merchant for deals`},ev_golden:{rect:e=>e.elRect(`#event-banner`),icons:`[[icon:star]] [[icon:axe]] [[icon:right]] [[icon:coin]]`,text:`Chop the golden tree!`},ev_storm:{rect:e=>e.elRect(`#event-banner`),icons:`[[icon:bolt]] [[icon:oak]] [[icon:right]] [[icon:log]]`,text:`Lightning fells trees · collect the logs`},wagesLow:{rect:e=>e.elRect(`#hud-money`),icons:`[[icon:sun]] [[icon:coin]] [[icon:warning]]`,text:`Not enough coins for payday!`},...Object.fromEntries(Object.entries(Ue).map(([e,t])=>[`rep${e}`,{tab:`orders`,icons:`[[icon:star]] ${e} [[icon:right]] ${t.icon}`,text:t.text}]))};function Sh(e,t,n){let r=document.createElement(`div`);r.id=`tutorial`,r.innerHTML=w(`
    <div class="tut-hole" hidden></div>
    <div class="tut-bubble" hidden>
      <div class="tut-icons"></div>
      <div class="tut-text"></div>
      <div class="tut-dots"></div>
    </div>
    <div class="tut-hand" hidden></div>`),document.body.appendChild(r);let i=r.querySelector(`.tut-hole`),a=r.querySelector(`.tut-bubble`),o=r.querySelector(`.tut-icons`),s=r.querySelector(`.tut-text`),c=r.querySelector(`.tut-dots`),l=r.querySelector(`.tut-hand`);l.style.backgroundImage=`url("${ee(3)}")`;let u=null,d=0,f=()=>e.tutorial!==`done`;n.setGate((t,n)=>{if(!f()||t===`settings`)return!0;let r=e.tutorial;return t===`tab`?r===`openChest`&&n===`chest`:t===`sell`?r===`sell`:t===`skill`&&r===`upgrade`&&n===`haul`});function p(t){e.tutorial=t,t===`upgrade`&&n.showTree(`click`),t!==`done`&&zf(1.4,.12),m()}function m(t=yh[e.tutorial],n=!0){if(!t)return;D(o,t.icons),D(s,t.text);let r=vh.indexOf(e.tutorial);c.innerHTML=w(n?vh.map((e,t)=>`<span class="${t<r?`done`:t===r?`now`:``}"></span>`).join(``):``),a.classList.remove(`pop`),a.offsetWidth,a.classList.add(`pop`)}function h(){e.tutorial=`done`,d=performance.now()+2800,m({icons:`[[icon:star]] [[icon:oak]] [[icon:axe]] [[icon:coin]]`,text:`Have fun!`},!1),Kf()}V(`treeFelled`,()=>e.tutorial===`chop`&&p(`collect`)),V(`itemDeposited`,({kind:t})=>{e.tutorial===`collect`&&p(`openChest`),ht[t]?.type===`sapling`&&g(`sapling`)}),V(`windowOpened`,({id:t})=>e.tutorial===`openChest`&&t===`chest`&&p(`sell`)),V(`sold`,()=>e.tutorial===`sell`&&p(`upgrade`)),V(`skillBought`,({id:t})=>e.tutorial===`upgrade`&&t===`haul`&&h()),V(`tabUnlocked`,({id:e})=>{e===`board`&&g(`workers`),e===`buildings`&&g(`build`),e===`orders`&&g(`orders`)}),V(`repLevel`,({level:e})=>g(`rep${e}`)),V(`buildingPlaced`,({type:e})=>g(e===`sawmill`?`sawmill`:`irrigation`)),V(`chestFull`,()=>g(`full`)),V(`treeFelled`,()=>g(`replant`)),V(`noSapling`,()=>g(`noSapling`)),V(`workerHired`,()=>g(`firstWorker`)),V(`seedMarked`,()=>g(`seeds`)),V(`payday`,()=>g(`payday`)),V(`debt`,()=>g(`debt`)),V(`workerLevelUp`,()=>g(`levelUp`)),V(`landExpanded`,()=>g(`landBought`)),V(`customerLove`,({perkUp:e})=>e&&g(`customerPerk`)),V(`orderNew`,({order:e})=>e.kind===`rush`&&g(`rushOrder`)),V(`randomEvent`,({id:e})=>xh[`ev_${e}`]&&g(`ev_${e}`));function g(t){f()||e.hints[t]||(e.hints[t]=!0,u={key:t,until:performance.now()+6500,...xh[t]},m(xh[t],!1),zf(1.5,.1))}window.addEventListener(`pointerdown`,()=>{u&&performance.now()>u.until-6e3&&(u=null)});function _(){switch(e.tutorial){case`chop`:return t.treeRect(0);case`collect`:return t.itemRect();case`openChest`:return n.tabRect(`chest`);case`sell`:return n.elRect(`#chest-sell-all`);case`upgrade`:{let e=n.nodeRect(`haul`);return e&&{left:e.left,right:e.right,top:e.top,bottom:e.bottom+16}}default:return null}}function v(e){let t=a.offsetWidth,n=a.offsetHeight,r,i;e?e.left<200?(r=e.right+24,i=(e.top+e.bottom)/2-n/2):e.top>n+40?(r=(e.left+e.right)/2-t/2,i=e.top-n-26):(r=(e.left+e.right)/2-t/2,i=e.bottom+70):(r=window.innerWidth/2-t/2,i=window.innerHeight*.3),a.style.left=Math.max(8,Math.min(window.innerWidth-t-8,r))+`px`,a.style.top=Math.max(8,Math.min(window.innerHeight-n-8,i))+`px`}function y(){!f()&&!e.hints.workersTree&&!(e.skills.hut>0)&&e.money>=50&&g(`workersTree`),!f()&&!e.hints.land&&e.skills.hut>0&&Xe(e)===0&&e.money>=Math.min(...Ke.map(t=>tt(e,t)))&&g(`land`),!f()&&!e.hints.wagesLow&&ke(e)&&g(`wagesLow`),e.tutorial===`sell`&&!n.isWindowOpen(`chest`)&&p(`openChest`),e.tutorial===`upgrade`&&n.activeTree()!==`click`&&n.showTree(`click`);let o=performance.now();if(f()){let e=_();r.classList.add(`dim`),a.hidden=!1,e?(i.hidden=!1,Object.assign(i.style,{left:e.left-10+`px`,top:e.top-10+`px`,width:e.right-e.left+20+`px`,height:e.bottom-e.top+20+`px`}),l.hidden=!1,l.style.left=(e.left+e.right)/2-10+`px`,l.style.top=e.bottom+4+`px`):(i.hidden=!0,l.hidden=!0),v(e);return}if(r.classList.remove(`dim`),i.hidden=!0,o<d){a.hidden=!1,l.hidden=!0,v(null);return}if(u&&o<u.until){let e=u.rect?u.rect(n,t):n.tabRect(u.tab);a.hidden=!e,l.hidden=!0,e&&(v(e),i.hidden=!1,i.classList.add(`glow-only`),Object.assign(i.style,{left:e.left-6+`px`,top:e.top-6+`px`,width:e.width+12+`px`,height:e.height+12+`px`}));return}u=null,i.classList.remove(`glow-only`),a.hidden=!0,l.hidden=!0}return f()&&m(),{update:y}}var Ch=`lumberjack-idle-achievements`,wh=[{id:`first_chop`,icon:`[[icon:axe]]`,name:`First Chop`,desc:`Fell your first tree`,check:(e,t)=>t.trees>=1},{id:`lumberjack`,icon:`[[icon:pine]]`,name:`Lumberjack`,desc:`Fell 100 trees`,check:(e,t)=>t.trees>=100},{id:`timber_tycoon`,icon:`[[icon:mountain]]`,name:`Timber Tycoon`,desc:`Fell 1,000 trees`,check:(e,t)=>t.trees>=1e3},{id:`first_sale`,icon:`[[icon:coin]]`,name:`First Coin`,desc:`Sell something at the market`,check:(e,t)=>t.sales>=1},{id:`moneybags`,icon:`[[icon:coin]]`,name:`Moneybags`,desc:`Have 1,000 coins at once`,check:e=>e.money>=1e3},{id:`oak_baron`,icon:`[[icon:coin]]`,name:`Oak Baron`,desc:`Have 100,000 coins at once`,check:e=>e.money>=1e5},{id:`hired_help`,icon:`[[icon:worker]]`,name:`Hired Help`,desc:`Hire your first worker`,check:e=>e.workers.length>=1},{id:`full_crew`,icon:`[[icon:hut]]`,name:`Full Crew`,desc:`Have 6 workers at once`,check:e=>e.workers.length>=6},{id:`veteran`,icon:`[[icon:star]]`,name:`Veteran`,desc:`Get a worker to level 10`,check:e=>e.workers.some(e=>e.level>=10)},{id:`grove`,icon:`[[icon:sapling]]`,name:`Little Grove`,desc:`Have 5 tree beds`,check:e=>e.treeCap>=5},{id:`woodland`,icon:`[[icon:oak]]`,name:`Woodland`,desc:`Have 10 tree beds`,check:e=>e.treeCap>=10},{id:`old_forest`,icon:`[[icon:pine]]`,name:`Old Forest`,desc:`Have 15 tree beds`,check:e=>e.treeCap>=15},{id:`land_ho`,icon:`[[icon:map]]`,name:`Land Ho!`,desc:`Buy your first row of land`,check:e=>Xe(e)>=1},{id:`wide_open`,icon:`[[icon:map]]`,name:`Wide Open`,desc:`Buy every row of land`,check:e=>Xe(e)>=Ke.length*2},{id:`first_order`,icon:`[[icon:orders]]`,name:`Happy Customer`,desc:`Deliver your first order`,check:(e,t)=>t.orders>=1},{id:`regular`,icon:`[[icon:handshake]]`,name:`Regular Business`,desc:`Deliver 50 orders`,check:(e,t)=>t.orders>=50},{id:`best_friends`,icon:`[[icon:heart]]`,name:`Best Friends`,desc:`Get a customer to 5 hearts`,check:(e,t)=>t.maxHearts>=5},{id:`famous`,icon:`[[icon:crown]]`,name:`Famous`,desc:`Reach reputation level 6`,check:e=>(e.repLevel??0)>=6},{id:`sawdust`,icon:`[[icon:saw]]`,name:`Sawdust`,desc:`Build a sawmill`,check:(e,t)=>t.sawmills>=1},{id:`golden_touch`,icon:`[[icon:star]]`,name:`Golden Touch`,desc:`Find gold wood`,check:(e,t)=>t.gold>=1},{id:`skillful`,icon:`[[icon:oak]]`,name:`Well Rounded`,desc:`Own 30 skills`,check:e=>Object.keys(e.skills).length>=30},{id:`ten_days`,icon:`[[icon:clock]]`,name:`Settled In`,desc:`Reach day 10`,check:e=>e.day>=10},{id:`in_the_red`,icon:`[[icon:warning]]`,name:`In the Red`,desc:`Go into debt (it happens!)`,check:(e,t)=>t.debt>=1},{id:`welcome_back`,icon:`[[icon:sun]]`,name:`Welcome Back`,desc:`Return after your team worked without you`,check:(e,t)=>t.returns>=1},{id:`gold_rush`,icon:`[[icon:star]]`,name:`Gold Rush`,desc:`Chop down a golden tree`,check:(e,t)=>t.goldenTrees>=1},{id:`good_deal`,icon:`[[icon:backpack]]`,name:`Good Deal`,desc:`Trade with the traveling merchant`,check:(e,t)=>t.merchantDeals>=1},{id:`storm_chaser`,icon:`[[icon:bolt]]`,name:`Storm Chaser`,desc:`Weather 3 thunderstorms`,check:(e,t)=>t.storms>=3}];function Th(){try{let e=JSON.parse(localStorage.getItem(Ch)??`{}`);return{unlocked:e.unlocked??{},stats:e.stats??{}}}catch{return{unlocked:{},stats:{}}}}function Eh(e){try{localStorage.setItem(Ch,JSON.stringify(e))}catch{}}function Dh(){localStorage.removeItem(Ch)}function Oh(e){let t=Th(),n=t.stats,r=(e,t=1)=>{n[e]=(n[e]??0)+t};V(`treeFelled`,()=>r(`trees`)),V(`sold`,({earned:e})=>e>0&&r(`sales`)),V(`orderDone`,()=>r(`orders`)),V(`customerLove`,({hearts:e})=>{n.maxHearts=Math.max(n.maxHearts??0,e)}),V(`buildingPlaced`,({type:e})=>e===`sawmill`&&r(`sawmills`)),V(`itemDeposited`,({kind:e})=>e===`goldwood`&&r(`gold`)),V(`debt`,()=>r(`debt`)),V(`welcomeBack`,()=>r(`returns`)),V(`goldenTreeFelled`,()=>r(`goldenTrees`)),V(`merchantDeal`,()=>r(`merchantDeals`)),V(`randomEventEnd`,({id:e})=>e===`storm`&&r(`storms`));let i=kh();function a(){let r=!1;for(let a of wh)!t.unlocked[a.id]&&a.check(e,n)&&(t.unlocked[a.id]=Date.now(),i.show(a),r=!0);return Eh(t),r}return setInterval(a,1e3),window.addEventListener(`beforeunload`,()=>Eh(t)),{check:a}}function kh(){let e=document.createElement(`div`);return e.id=`achievement-toasts`,document.body.appendChild(e),{show(t){let n=document.createElement(`div`);n.className=`ach-toast`,n.innerHTML=w(`<span class="ach-toast-icon">${t.icon}</span><div><small>[[icon:trophy]] Achievement unlocked</small><b>${t.name}</b><span>${t.desc}</span></div>`),e.appendChild(n),Zf(),setTimeout(()=>n.classList.add(`out`),4200),setTimeout(()=>n.remove(),4700)}}}var Ah=`v0.4`;function jh(){document.body.classList.add(`mode-menu`);let e=document.getElementById(`menu`);e.innerHTML=w(`
    <div id="menu-world"></div>
    <div id="menu-floaters"></div>
    <div class="menu-shade"></div>
    <div class="menu-side">
      <div class="menu-title">
        <div class="menu-title-axe">[[icon:axe]]</div>
        <h1>Timberline<span>Idle</span></h1>
        <p>A cozy little forest that grows while you are away</p>
      </div>
      <nav class="menu-buttons">
        <button class="menu-btn" data-panel="play"><i>[[icon:pine]]</i>Play</button>
        <button class="menu-btn" data-panel="settings"><i>[[icon:settings]]</i>Settings</button>
        <button class="menu-btn" data-panel="achievements"><i>[[icon:trophy]]</i>Achievements</button>
        <button class="menu-btn" data-panel="credits"><i>[[icon:scroll]]</i>Credits</button>
      </nav>
    </div>
    <div class="menu-stage"></div>
    <div class="menu-foot">${Ah} · made with Three.js</div>`);let t=lh();Nf(t.volume,t.muted);let n=Mh(e.querySelector(`#menu-world`),e.querySelector(`#menu-floaters`)),r=e.querySelector(`.menu-stage`),i=[...e.querySelectorAll(`.menu-btn`)],a=null,o={play:u,settings:f,achievements:p,credits:m};function s(e){i.forEach(t=>t.classList.toggle(`active`,t.dataset.panel===e)),r.replaceChildren(),a=e,e&&o[e](r)}i.forEach(e=>e.addEventListener(`click`,()=>{zf(a===e.dataset.panel?.8:1.1,.2),s(a===e.dataset.panel?null:e.dataset.panel)}));function c(e,t=``,n=0){let r=document.createElement(`section`);return r.className=`menu-board ${t}`,r.style.animationDelay=`${n}s`,r.innerHTML=w(`<header class="window-head"><h2>${e}</h2></header><div class="menu-board-body"></div>`),r}function l(t,n){Kf(),e.classList.add(`leaving`),setTimeout(()=>rh(t,n),380)}function u(e){let t=document.createElement(`div`);t.className=`slot-row`,e.appendChild(t);for(let e=1;e<=3;e++)t.appendChild(d(e,(e-1)*.08))}function d(e,t){let n=nh(e),r=c(`Slot ${e}`,n?`slot filled`:`slot empty`,t),i=r.querySelector(`.menu-board-body`);if(n){let t=We(n.reputation),a=3+n.land.w+n.land.e,o=3+n.land.n+n.land.s;i.innerHTML=w(`
        <div class="slot-day">Day ${n.day}</div>
        <ul class="slot-stats">
          <li><span>[[icon:coin]]</span>${Ft(Math.floor(n.money))} coins</li>
          <li><span>[[icon:worker]]</span>${n.workers} worker${n.workers===1?``:`s`}</li>
          <li><span>[[icon:star]]</span>Reputation ${t}</li>
          <li><span>[[icon:map]]</span>${a}×${o} plots</li>
          <li><span>[[icon:oak]]</span>${n.skills} skills</li>
          <li><span>[[icon:clock]]</span>${Nh(n.playTime)} played</li>
        </ul>
        ${n.tutorial?`<div class="slot-note">[[icon:book]] Tutorial in progress</div>`:``}
        <div class="slot-when">Last played ${Ph(n.savedAt)}</div>
        <div class="slot-actions">
          <button class="wood-btn slot-go">[[icon:right]] Continue</button>
          <button class="small-btn danger slot-del">[[icon:trash]] Delete</button>
        </div>`),i.querySelector(`.slot-go`).addEventListener(`click`,()=>l(e));let s=i.querySelector(`.slot-del`),c=0;s.addEventListener(`click`,()=>{if(performance.now()>c){c=performance.now()+3e3,D(s,`[[icon:warning]] Sure? Click again`),s.classList.add(`confirm`),zf(.8,.2),setTimeout(()=>{performance.now()>c&&s.isConnected&&(D(s,`[[icon:trash]] Delete`),s.classList.remove(`confirm`))},3100);return}$m(e),Gf(),r.replaceWith(d(e,0))})}else{i.innerHTML=w(`
        <img class="slot-sprout" src="${vp(`sapling`)}" alt="">
        <div class="slot-empty-text">Empty slot</div>
        <label class="wood-check"><input type="checkbox" class="slot-tut" checked><span></span>Tutorial</label>
        <div class="slot-actions">
          <button class="wood-btn slot-new">[[icon:sapling]] New game</button>
        </div>`);let t=i.querySelector(`.slot-tut`);t.addEventListener(`change`,()=>zf(t.checked?1.4:.9,.15)),i.querySelector(`.slot-new`).addEventListener(`click`,()=>l(e,{tutorial:t.checked}))}return r}function f(e){let n=c(`[[icon:settings]] Settings`,`wide`);e.appendChild(n);let r=n.querySelector(`.menu-board-body`);r.innerHTML=w(`
      <h3 class="shop-title">[[icon:sound]] Sound</h3>
      <div class="settings-row">
        <button class="small-btn mute-btn"></button>
        <input type="range" class="vol-range" min="0" max="100" step="5">
      </div>
      <h3 class="shop-title">[[icon:save]] Data</h3>
      <p class="hint">Save slots and achievements live in this browser. Use [[icon:export]] Export in the in-game settings to keep a copy.</p>
      <div class="settings-row"><button class="small-btn danger wipe-btn">[[icon:trash]] Delete all saves & achievements</button></div>`);let i=r.querySelector(`.mute-btn`),a=r.querySelector(`.vol-range`),o=()=>{Nf(t.volume,t.muted),uh(t),D(i,t.muted?`[[icon:muted]] Sound off`:`[[icon:sound]] Sound on`)};a.value=Math.round(t.volume*100),o(),i.addEventListener(`click`,()=>{t.muted=!t.muted,o(),zf(1.2)}),a.addEventListener(`input`,()=>{t.volume=Number(a.value)/100,t.muted=!1,o()}),a.addEventListener(`change`,()=>zf(1.2));let s=r.querySelector(`.wipe-btn`),l=0;s.addEventListener(`click`,()=>{if(performance.now()>l){l=performance.now()+3e3,D(s,`[[icon:warning]] Everything will be gone! Click again`);return}eh(),Dh(),Gf(),D(s,`[[icon:check]] All data deleted`),s.disabled=!0})}function p(e){let{unlocked:t}=Th(),n=wh.filter(e=>t[e.id]).length,r=c(`[[icon:trophy]] Achievements`,`wide`);e.appendChild(r),r.querySelector(`.menu-board-body`).innerHTML=w(`
      <div class="ach-progress"><b>${n} / ${wh.length}</b> unlocked
        <div class="fill-bar"><div class="fill-bar-in" style="width:${n/wh.length*100}%"></div></div>
      </div>
      <div class="ach-grid">${wh.map(e=>{let n=t[e.id];return`<div class="ach-card ${n?`got`:`locked`}" title="${n?`Unlocked ${new Date(n).toLocaleDateString()}`:`Locked`}">
          <span class="ach-icon">${e.icon}</span>
          <div><b>${e.name}</b><span>${e.desc}</span></div>
        </div>`}).join(``)}</div>`)}function m(e){let t=c(`[[icon:scroll]] Credits`,`narrow`);e.appendChild(t),t.querySelector(`.menu-board-body`).innerHTML=w(`
      <div class="credits">
        <p class="credits-big">[[icon:axe]] Timberline Idle</p>
        <p>Game design, pixel art & code<br><b>The Timberline Idle team</b></p>
        <p>Built with <b>Three.js</b> & <b>Vite</b><br>All art and sounds are generated in code</p>
        <p>Thanks for playing! [[icon:pine]]</p>
      </div>`)}return{show:s,demo:n}}function Mh(e,t){let n=vt();n.tutorial=`done`,n.skills={haul:1,hut:1,bunk:1,orders:1,chest:4,autosell:1,fertilizer:2,plot_tree:5},n.reputation=16,yt(n),n.workers=[je(),je()],n.workerCap=2,n.inventory.sapling=30,n.hour=9.5;let r=ym(e,t,n,null);for(let[e,t,n,i]of[[`oak`,1,1,.97],[`birch`,6,2,.6],[`oak`,2,6,.99],[`pine`,7,6,.4],[`birch`,5,7,.85],[`oak`,1,4,.5],[`pine`,7,1,.9]])r.debug.plantAt(e,t,n,i);r.lookAt(-2.4,2.4),Pf(.5),Pm(n,!1);let i=12,a=performance.now();function o(e){let t=Math.max(0,Math.min((e-a)/1e3,.1));if(a=e,Mt(n,t,{quiet:!0}),r.update(t,t),Mm(n,t,!1),i-=t,i<=0){i=14+Math.random()*10;let e=n.orders?.list.find(e=>e.time<e.total-8);if(e){for(let{key:t,n:r}of e.items)n.inventory[t]=(n.inventory[t]??0)+r;Im(n,e.id)}}requestAnimationFrame(o)}return requestAnimationFrame(o),{state:n,world:r}}function Nh(e){let t=Math.floor(e/60);return t<60?`${t}m`:`${Math.floor(t/60)}h ${String(t%60).padStart(2,`0`)}m`}function Ph(e){if(!e)return`a while ago`;let t=(Date.now()-e)/1e3;if(t<60)return`just now`;if(t<3600)return`${Math.floor(t/60)} min ago`;if(t<86400)return`${Math.floor(t/3600)} h ago`;let n=Math.floor(t/86400);return n===1?`yesterday`:`${n} days ago`}var Fh={rain:{name:`Rain`,icon:`[[icon:water]]`,desc:`Trees grow twice as fast`,duration:120,weight:30},golden:{name:`Golden Tree`,icon:`[[icon:star]]`,desc:`Chop the shining tree: every log turns into gold wood`,duration:90,weight:22},market:{name:`Market Day`,icon:`[[icon:market]]`,desc:`Everything sells for 50% more`,duration:120,weight:18},merchant:{name:`Traveling Merchant`,icon:`[[icon:backpack]]`,desc:`Special deals today · click him!`,duration:150,weight:18,ok:e=>e.money>=30||e.workers.length>0},storm:{name:`Thunderstorm`,icon:`[[icon:bolt]]`,desc:`Lightning fells trees · grab the logs!`,duration:60,weight:12,ok:e=>e.day>=3}},Ih=240,Lh=[150,300],Rh=180,zh=(e,t)=>e+Math.random()*(t-e);function Bh({state:e,world:t,onMerchantClick:n}){let r=Ih,i=null,a=0;e.eventGrowthMult=1,e.eventPriceMult=1;let o=document.createElement(`div`);o.id=`event-banner`,o.hidden=!0,o.innerHTML=`<span class="ev-icon"></span><div class="ev-text"><b></b><span></span><div class="fill-bar"><div class="fill-bar-in"></div></div></div>`,document.getElementById(`stage`)?.appendChild(o);let s=o.querySelector(`.ev-icon`),c=o.querySelector(`b`),l=o.querySelector(`.ev-text > span`),u=o.querySelector(`.fill-bar-in`);o.addEventListener(`click`,()=>{i?.id===`merchant`&&n?.()});function d(){let t=Object.entries(Fh).filter(([,t])=>!t.ok||t.ok(e)),n=t.reduce((e,[,t])=>e+t.weight,0),r=Math.random()*n;for(let[e,n]of t)if(r-=n.weight,r<0)return e;return t[0]?.[0]}function f(e){let n=Fh[e];if(i={id:e,t:n.duration,total:n.duration,offers:null,strikeIn:4},e===`golden`&&!t.makeGolden()){i=null,r=30;return}e===`rain`&&Jf(),e===`storm`&&Yf(.6),e===`market`&&qf(),e===`merchant`&&(i.offers=h(),t.spawnMerchant(),Xf()),e===`golden`&&Zf(),t.setWeather({rain:+(e===`rain`||e===`storm`),storm:e===`storm`}),o.dataset.event=e,o.classList.toggle(`clickable`,e===`merchant`),D(s,n.icon),D(c,n.name),D(l,n.desc),o.hidden=!1,o.classList.remove(`show`),o.offsetWidth,o.classList.add(`show`),Be(`randomEvent`,{id:e})}function p(){i&&(i.id===`golden`&&t.clearGolden(),i.id===`merchant`&&t.dismissMerchant(),t.setWeather({rain:0,storm:!1}),Be(`randomEventEnd`,{id:i.id}),i=null,o.hidden=!0,r=zh(...Lh))}function m(n){if(a=Math.max(0,a-n),e.eventGrowthMult=(i?.id===`rain`?2:1)*(a>0?2:1),e.eventPriceMult=i?.id===`market`?1.5:1,e.tutorial===`done`){if(!i){r-=n,r<=0&&f(d());return}i.t-=n,u.style.width=Math.max(0,i.t/i.total*100)+`%`,i.id===`storm`&&(i.strikeIn-=n,i.strikeIn<=0&&(i.strikeIn=zh(9,16),t.lightning())),i.id===`golden`&&!t.hasGolden()&&(i.t=Math.min(i.t,0)),i.t<=0&&p()}}function h(){let t=Math.max(25,e.treeCap*e.woodPerTree*e.woodPrice),n=[...ne].reverse().find(t=>re(e,t))??`oak`,r=[{id:`buyLogs`,icon:`[[icon:log]]`,name:`Log Collector`,desc:`Buys all logs in your chest for double the price`,price:0},{id:`saplings`,icon:`[[icon:sapling]]`,name:`${N(n).name} saplings`,desc:`3 saplings at half price`,price:Math.round(ae(1,e.saplingPriceMult,n)*1.5),species:n},{id:`growth`,icon:`[[icon:leaves]]`,name:`Magic Fertilizer`,desc:`Trees grow 2× faster for 3 minutes`,price:Math.round(t*1.2)}];return e.workers.length&&r.push({id:`training`,icon:`[[icon:book]]`,name:`Training Scroll`,desc:`Every worker gains a level`,price:Math.round(t*1.5+30*e.workers.length)}),r.sort(()=>Math.random()-.5).slice(0,3)}function g(t){let n=i?.offers?.find(e=>e.id===t);if(!n||n.bought||e.money<n.price)return!1;if(e.money-=n.price,n.bought=!0,n.id===`buyLogs`){let t=0;for(let n of Object.keys(ht).filter(e=>ht[e].type===`log`)){let r=(e.inventory[n]??0)-At(e,n);r<=0||(e.inventory[n]-=r,t+=Tt(e,r*St(e,n)*2))}n.result=t,Be(`sold`,{earned:t})}else if(n.id===`saplings`){let t=N(n.species).sapling;e.inventory[t]=(e.inventory[t]??0)+3}else if(n.id===`growth`)a=Rh;else if(n.id===`training`)for(let t of e.workers){let n=(1+ve(t,`fastLearner`)*.25)*(e.xpMult??1);Ie(t,(xe(t.level)-t.xp)/n+.01,e)}return Be(`merchantDeal`,{id:n.id}),n}return{update:m,current:()=>i,offers:()=>i?.offers??[],buyOffer:g,fertilizerLeft:()=>a,debugStart:e=>{p(),f(e)}}}g(),await A(),M(),Jm(),new URLSearchParams(location.search);var Vh=ih();Vh?Hh(Vh):jh();function Hh(e){document.body.classList.add(`mode-game`),e&&Wm(e.slot);let t=e?.newGame?null:Ym(),n=vt();t?.state&&Lt(n,t.state),e?.newGame&&(n.tutorial=e.newGame.tutorial?`chop`:`done`);let r=ym(document.getElementById(`viewport`),document.getElementById(`floaters`),n,t?.world),i=_h(n,r),a=Sh(n,r,i),o=Bh({state:n,world:r,onMerchantClick:()=>i.openMerchant()});i.setRandomEvents(o),Oh(n),t?.savedAt&&s((Date.now()-t.savedAt)/1e3),th(n,r);function s(e){if(e<60||n.tutorial!==`done`)return;let t=$p(n,e,r);t.customers=Pm(n,r.hasSawmill()),i.showOfflineReport(t),Be(`welcomeBack`,{report:t})}let c=performance.now();function l(e){let t=Math.max(0,Math.min((e-c)/1e3,.1));c=e;let s=t*n.speed;n.playTime=(n.playTime??0)+t,Mt(n,s),Zp(n,s),r.update(t,s),Mm(n,s,r.hasSawmill()),i.update(),a.update(),o.update(s),requestAnimationFrame(l)}requestAnimationFrame(l)}