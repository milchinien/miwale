(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const Nn=["red","yellow","green","blue"],Jc=[1,2,3,4,5,6,7,8,9,10,11,12,13],Qc=4,jc=4,ei=n=>n.kind==="pip";function Pr(){const n=[];for(const e of Nn)for(const t of Jc)n.push({id:`${e}-${t}`,kind:"pip",suit:e,value:t});for(let e=1;e<=Qc;e++)n.push({id:`mage-${e}`,kind:"mage"});for(let e=1;e<=jc;e++)n.push({id:`jester-${e}`,kind:"jester"});return n}const yd=Nn.length*Jc.length+Qc+jc;function eu(n){let e=n>>>0;const t=()=>{e=e+1831565813>>>0;let i=e;return i=Math.imul(i^i>>>15,i|1),i^=i+Math.imul(i^i>>>7,i|61),((i^i>>>14)>>>0)/4294967296};return{next:t,nextInt:i=>Math.floor(t()*i),seed:n>>>0}}function bd(n,e){const t=n.slice();for(let i=t.length-1;i>0;i--){const r=e.nextInt(i+1),s=t[i],a=t[r];s!==void 0&&a!==void 0&&(t[i]=a,t[r]=s)}return t}const Rl=3,Cl=6;function ko(n){return Math.floor(yd/n)}function Go(n){for(const e of n){if(e.card.kind==="mage")return{suit:null,settled:!0};if(ei(e.card))return{suit:e.card.suit,settled:!0}}return{suit:null,settled:!1}}function Vo(n,e,t){const i=Go(t);return i.suit===null||!ei(n)||n.suit===i.suit?null:e.some(s=>ei(s)&&s.suit===i.suit)?{code:"must-follow-suit",suit:i.suit}:null}const Ed=(n,e,t)=>Vo(n,e,t)===null;function tu(n,e){return n.filter(t=>Ed(t,n,e))}function Pl(n,e){let t=null;for(const i of n)ei(i.card)&&i.card.suit===e&&(t===null||!ei(t.card)||i.card.value>t.card.value)&&(t=i);return t}function nu(n,e){const t=n[0];if(t===void 0)throw new RangeError("An empty trick has no winner");const i=n.find(s=>s.card.kind==="mage");if(i!==void 0)return{winner:i.player,card:i.card,reason:"mage"};if(e!==null){const s=Pl(n,e);if(s!==null)return{winner:s.player,card:s.card,reason:"trump"}}const r=Go(n);if(r.suit!==null){const s=Pl(n,r.suit);if(s!==null)return{winner:s.player,card:s.card,reason:"led-suit"}}return{winner:t.player,card:t.card,reason:"jesters-only"}}function Ho(n,e){return n===e?20+10*n:-10*Math.abs(n-e)}function iu(n){const e=Math.max(...n),t=[];return n.forEach((i,r)=>{i===e&&t.push(r)}),t}function Wo(n,e){const t=r=>r.kind==="mage"?0:r.kind==="jester"?2:1,i=r=>r===e?-1:Nn.indexOf(r);return n.slice().sort((r,s)=>{const a=t(r)-t(s);if(a!==0)return a;if(ei(r)&&ei(s)){const o=i(r.suit)-i(s.suit);return o!==0?o:s.value-r.value}return r.id<s.id?-1:1})}class Kt extends Error{code;constructor(e,t){super(t),this.name="RuleError",this.code=e}}function Td(n){const{playerCount:e,seed:t}=n;if(!Number.isInteger(e)||e<Rl||e>Cl)throw new Kt("player-count",`Runecall is played with ${Rl} to ${Cl} players, not ${e}`);const i=n.dealer??0;if(!Number.isInteger(i)||i<0||i>=e)throw new Kt("dealer",`Seat ${i} does not exist with ${e} players`);const r=ko(e),s=n.totalRounds??r;if(!Number.isInteger(s)||s<1||s>r)throw new Kt("total-rounds",`With ${e} players, 1 to ${r} rounds are possible, not ${s}`);const a={playerCount:e,seed:t,totalRounds:s,roundNumber:0,dealer:i,phase:"round-end",hands:[],stock:[],playedCards:[],trumpCard:null,trumpSuit:null,bids:[],tricksWon:[],scores:Array.from({length:e},()=>0),trickNumber:0,currentTrick:[],lastTrick:null,leader:i,turn:i,events:[]};return ru(a,1,i)}function wd(n,e){let t=(n^Math.imul(e,2654435761))>>>0;return t=Math.imul(t^t>>>16,2246822507)>>>0,t>>>0}function ru(n,e,t){const{playerCount:i}=n,r=bd(Pr(),eu(wd(n.seed,e))),s=Array.from({length:i},()=>[]);let a=0;for(let u=0;u<e;u++)for(let f=1;f<=i;f++){const x=r[a],S=s[(t+f)%i];if(x===void 0||S===void 0)throw new Kt("deal",`The deck is too small for round ${e}`);S.push(x),a++}const o=r.slice(a),l=o[0]??null,c=(t+1)%i;let d=null,h="bidding";return l!==null&&(l.kind==="pip"?d=l.suit:l.kind==="mage"&&(h="trump-choice")),{...n,roundNumber:e,dealer:t,phase:h,hands:s,stock:o,playedCards:[],trumpCard:l,trumpSuit:d,bids:Array.from({length:i},()=>null),tricksWon:Array.from({length:i},()=>0),trickNumber:1,currentTrick:[],lastTrick:null,leader:c,turn:h==="trump-choice"?t:c,events:[...n.events,{type:"round-dealt",round:e,dealer:t},{type:"trump-revealed",card:l,suit:d}]}}function ai(n,e){switch(e.type){case"choose-trump":return Ad(n,e.suit);case"bid":return Rd(n,e.value);case"play":return Cd(n,e.cardId);case"next-round":return Ld(n)}}function Us(n,e){if(n.phase!==e)throw new Kt("phase",`Expected phase ${e}, but the game is in phase ${n.phase}`)}function Ad(n,e){if(Us(n,"trump-choice"),!Nn.includes(e))throw new Kt("suit",`${e} is not one of the four suits`);return{...n,trumpSuit:e,phase:"bidding",turn:n.leader,events:[...n.events,{type:"trump-chosen",player:n.dealer,suit:e}]}}function Rd(n,e){if(Us(n,"bidding"),!Number.isInteger(e)||e<0||e>n.roundNumber)throw new Kt("bid-range",`Bid ${e} is not between 0 and ${n.roundNumber}`);const t=n.turn,i=n.bids.map((s,a)=>a===t?e:s),r=i.every(s=>s!==null);return{...n,bids:i,phase:r?"playing":"bidding",turn:r?n.leader:(t+1)%n.playerCount,events:[...n.events,{type:"bid",player:t,value:e}]}}function Cd(n,e){Us(n,"playing");const t=n.turn,i=n.hands[t];if(i===void 0)throw new Kt("seat",`Seat ${t} does not exist`);const r=i.find(x=>x.id===e);if(r===void 0)throw new Kt("card-not-in-hand",`Card ${e} is not in the hand of seat ${t}`);const s=Vo(r,i,n.currentTrick);if(s!==null)throw new Kt(s.code,`Seat ${t} must follow suit (${s.suit})`);const a=n.hands.map((x,S)=>S===t?x.filter(m=>m.id!==e):x),o=[...n.currentTrick,{player:t,card:r}],l=[...n.events,{type:"card-played",player:t,card:r}],c=[...n.playedCards,r];if(o.length<n.playerCount)return{...n,hands:a,currentTrick:o,playedCards:c,turn:(t+1)%n.playerCount,events:l};const d=nu(o,n.trumpSuit),h=n.tricksWon.map((x,S)=>S===d.winner?x+1:x),u={plays:o,winner:d.winner,reason:d.reason};return l.push({type:"trick-won",plays:o,winner:d.winner,reason:d.reason}),n.trickNumber>=n.roundNumber?Pd({...n,hands:a,playedCards:c,tricksWon:h,currentTrick:[],lastTrick:u,events:l}):{...n,hands:a,playedCards:c,tricksWon:h,trickNumber:n.trickNumber+1,currentTrick:[],lastTrick:u,leader:d.winner,turn:d.winner,events:l}}function Pd(n){const t=n.bids.map((r,s)=>{if(r===null)throw new Kt("internal",`Seat ${s} never bid, so the round cannot be scored`);return r}).map((r,s)=>Ho(r,n.tricksWon[s]??0)),i=n.scores.map((r,s)=>r+(t[s]??0));return{...n,phase:"round-end",scores:i,events:[...n.events,{type:"round-scored",round:n.roundNumber,points:t,totals:i}]}}function Ld(n){if(Us(n,"round-end"),n.roundNumber>=n.totalRounds){const e=iu(n.scores);return{...n,phase:"game-over",events:[...n.events,{type:"game-over",winners:e}]}}return ru(n,n.roundNumber+1,(n.dealer+1)%n.playerCount)}function Br(n,e){const t=n.hands[e];if(t===void 0)throw new Kt("seat",`Seat ${e} does not exist`);const r=n.phase==="playing"&&n.turn===e?tu(t,n.currentTrick).map(s=>s.id):[];return{you:e,hand:t,handSizes:n.hands.map(s=>s.length),playable:r,phase:n.phase,roundNumber:n.roundNumber,totalRounds:n.totalRounds,dealer:n.dealer,leader:n.leader,turn:n.turn,trickNumber:n.trickNumber,trumpCard:n.trumpCard,trumpSuit:n.trumpSuit,bids:n.bids,tricksWon:n.tricksWon,scores:n.scores,currentTrick:n.currentTrick,lastTrick:n.lastTrick,playedCards:n.playedCards,stockSize:n.stock.length}}const fs=4,Oa=8,Id="hard";function Dd(){return{mode:"ranked",playerCount:fs,totalRounds:Oa,difficulty:Id,roomCode:null}}function su(n){return{mode:"friends",playerCount:n.playerCount,totalRounds:Nd(n.rounds,n.playerCount),difficulty:n.difficulty,roomCode:n.roomCode}}function Nd(n,e){const t=ko(e);return n===null?t:Math.max(1,Math.min(t,Math.round(n)))}const Ba="ABCDEFGHJKLMNPQRTUVWXYZ2346789",Zi=5;function za(){const n=new Uint32Array(Zi);crypto.getRandomValues(n);let e="";for(const t of n)e+=Ba[t%Ba.length];return e}function bs(n){return[...n.toUpperCase()].filter(e=>Ba.includes(e)).slice(0,Zi).join("")}function ka(n){return bs(n).length===Zi}function au(){try{const n=bs(decodeURIComponent(window.location.hash.replace(/^#/,"")));if(ka(n))return n;const e=bs(/\/raum\/([^/]+)\/?$/.exec(window.location.pathname)?.[1]??"");return ka(e)?e:null}catch{return null}}const Ud=["miwale.com","www.miwale.com"];function ou(){const n=window.location.pathname.replace(/[^/]*$/,"");return n.endsWith("/")?n:`${n}/`}function Fd(n){const{origin:e,hostname:t,pathname:i}=window.location;return Ud.includes(t)?`${e}${ou()}raum/${n}`:`${e}${i}#${n}`}function Ll(n){try{window.history.replaceState(null,"",`#${n}`)}catch{}}function Od(){try{window.history.replaceState(null,"",ou()+window.location.search)}catch{}}const Bd=Pr();function zd(n){const e=new Set;for(const t of n.hand)e.add(t.id);for(const t of n.playedCards)e.add(t.id);return n.trumpCard!==null&&e.add(n.trumpCard.id),{unseen:Bd.filter(t=>!e.has(t.id)),trump:n.trumpSuit}}function kd(n,e,t){if(n.kind==="mage")return!0;if(e.kind==="mage"||n.kind==="jester")return!1;if(e.kind==="jester")return!0;const i=t!==null&&n.suit===t,r=t!==null&&e.suit===t;return i!==r?i:n.suit!==e.suit?!1:n.value>e.value}function Gd(n,e){for(const t of n.unseen)if(kd(t,e,n.trump))return!1;return!0}const Vd=["easy","normal","hard"];function Hd(n,e){const t=eu(e);return{difficulty:n,chooseTrump:i=>Wd(i),chooseBid:i=>Xd(i,n,t),chooseCard:i=>qd(i,n,t)}}function lu(n,e,t){return n.kind==="mage"?.95:n.kind==="jester"?.02:e!==null&&n.suit===e?Math.min(.92,.22+.06*n.value):Math.max(0,(n.value-8)/6)*Math.pow(.85,t-3)}function cu(n){return n.hand.reduce((e,t)=>e+lu(t,n.trumpSuit,n.handSizes.length),0)}function Wd(n){let e=Nn[0]??"red",t=-1;for(const i of Nn){let r=0;for(const s of n.hand)ei(s)&&s.suit===i&&(r+=s.value>=10?2:1);r>t&&(e=i,t=r)}return e}function Xd(n,e,t){let i=cu(n);return e==="easy"&&(i+=t.next()-.5),e==="hard"&&n.bids.reduce((s,a)=>s+(a??0),0)>=n.roundNumber&&(i-=.35),Yd(Math.round(i),0,n.roundNumber)}function qd(n,e,t){const i=tu(n.hand,n.currentTrick),r=i[0];if(r===void 0)throw new Error("No legal move -- the engine must never allow this");if(i.length===1)return r.id;if(e==="easy")return(i[t.nextInt(i.length)]??r).id;const s=e==="hard",a=S=>lu(S,n.trumpSuit,n.handSizes.length),o=n.bids[n.you]??0,l=n.tricksWon[n.you]??0,c=o-l,d=n.hand.length,h=c>=d?!0:c>0;if(n.currentTrick.length===0)return(h?Ws(i,a):or(i,a)).id;const u=i.filter(S=>Il(n,S)),f=i.filter(S=>!Il(n,S)),x=n.currentTrick.length===n.handSizes.length-1;if(h){if(u.length===0)return or(i,a).id;if(x)return or(u,a).id;if(s){const S=zd(n),m=u.filter(R=>Gd(S,R)),p=m[0]===void 0?null:or(m,a);if(p!==null)return p.id}return Ws(u,a).id}return f.length>0?Ws(f,a).id:or(u,a).id}function Il(n,e){const t=[...n.currentTrick,{player:n.you,card:e}];return nu(t,n.trumpSuit).winner===n.you}function Ws(n,e){return uu(n,(t,i)=>e(t)>=e(i))}function or(n,e){return uu(n,(t,i)=>e(t)<=e(i))}function uu(n,e){const t=n[0];if(t===void 0)throw new Error("Cannot pick from an empty set of cards");let i=t;for(const r of n)e(r,i)&&(i=r);return i}const Yd=(n,e,t)=>Math.max(e,Math.min(t,n));function Xo(n){try{const e=localStorage.getItem(n);return e===null?null:JSON.parse(e)}catch{return null}}function qo(n,e){try{localStorage.setItem(n,JSON.stringify(e))}catch{}}function $d(n){try{localStorage.removeItem(n)}catch{}}const hs=[5,2,-1,-4],Kd={points:0,games:0,wins:0};function Zd(n,e){const t=n[e]??0;return 1+n.filter(i=>i>t).length}function Jd(n){return hs[n-1]??hs[hs.length-1]??0}const Ga=[{from:0,name:"Spark"},{from:25,name:"Rune"},{from:60,name:"Seal"},{from:110,name:"Circle"},{from:180,name:"Archwizard"}];function du(n){let e=Ga[0]?.name??"";for(const t of Ga)n>=t.from&&(e=t.name);return e}function Qd(n){return Ga.find(e=>e.from>n)??null}const fu="runecall.rank.v1";function Va(){const n=Xo(fu);if(n===null||typeof n!="object")return Kd;const e=n;return{points:Xs(e.points),games:Xs(e.games),wins:Xs(e.wins)}}function jd(n){qo(fu,n)}function ef(n){const e=Va(),t=Math.max(0,e.points+Jd(n)),i={points:t,games:e.games+1,wins:e.wins+(n===1?1:0)};return jd(i),{place:n,delta:t-e.points,rank:i}}function Ha(n){const e=n%100;if(e>=11&&e<=13)return`${n}th`;const t=["th","st","nd","rd"][n%10]??"th";return`${n}${t}`}function Yi(n,e,t){return`${n} ${n===1?e:t}`}function Xs(n){return typeof n=="number"&&Number.isFinite(n)?Math.max(0,Math.round(n)):0}const hu={playerName:"",playerCount:4,difficulty:"normal",rounds:null,roomCode:null,speed:1e3,counting:!1,hint:!0},tf={easy:"Easy",normal:"Normal",hard:"Hard"},nf=[{label:"Relaxed",ms:1600},{label:"Normal",ms:1e3},{label:"Fast",ms:550}],rf={1100:1600,600:1e3,260:550},pu="runecall.settings.v1",Yo="runecall.save.v1";function sf(){const n=Xo(pu),e={...hu,...n??{}},t={...e,speed:rf[e.speed]??e.speed,roomCode:e.roomCode??za()};return e.roomCode!==t.roomCode&&mu(t),t}function mu(n){qo(pu,n)}function gu(){const n=Xo(Yo);if(n===null)return null;const e=n;return e.state===void 0||e.settings===void 0||e.state.phase==="game-over"?null:{state:e.state,settings:e.settings,seed:e.seed??0,match:e.match??{mode:"friends",playerCount:e.state.playerCount,totalRounds:e.state.totalRounds,difficulty:e.settings.difficulty,roomCode:null}}}function af(n){qo(Yo,n)}function _u(){$d(Yo)}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const $o="185",of=0,Dl=1,lf=2,ps=1,cf=2,Mr=3,ti=0,Ut=1,Vt=2,In=0,Ji=1,ni=2,Nl=3,Ul=4,uf=5,gi=100,df=101,ff=102,hf=103,pf=104,mf=200,gf=201,_f=202,xf=203,Wa=204,Xa=205,vf=206,Mf=207,Sf=208,yf=209,bf=210,Ef=211,Tf=212,wf=213,Af=214,qa=0,Ya=1,$a=2,er=3,Ka=4,Za=5,Ja=6,Qa=7,xu=0,Rf=1,Cf=2,gn=0,vu=1,Mu=2,Su=3,Ko=4,yu=5,bu=6,Eu=7,Tu=300,bi=301,tr=302,qs=303,Ys=304,Fs=306,ja=1e3,nn=1001,eo=1002,At=1003,Pf=1004,zr=1005,Et=1006,$s=1007,Pn=1008,Ht=1009,wu=1010,Au=1011,Tr=1012,Zo=1013,vn=1014,fn=1015,Un=1016,Jo=1017,Qo=1018,wr=1020,Ru=35902,Cu=35899,Pu=1021,Lu=1022,rn=1023,Fn=1026,Mi=1027,Iu=1028,jo=1029,Ei=1030,el=1031,tl=1033,ms=33776,gs=33777,_s=33778,xs=33779,to=35840,no=35841,io=35842,ro=35843,so=36196,ao=37492,oo=37496,lo=37488,co=37489,Es=37490,uo=37491,fo=37808,ho=37809,po=37810,mo=37811,go=37812,_o=37813,xo=37814,vo=37815,Mo=37816,So=37817,yo=37818,bo=37819,Eo=37820,To=37821,wo=36492,Ao=36494,Ro=36495,Co=36283,Po=36284,Ts=36285,Lo=36286,Lf=3200,Io=0,If=1,Kn="",dt="srgb",ws="srgb-linear",As="linear",Je="srgb",Ci=7680,Fl=519,Df=512,Nf=513,Uf=514,nl=515,Ff=516,Of=517,il=518,Bf=519,Ol=35044,zf=35048,Bl="300 es",hn=2e3,Ar=2001;function kf(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Rs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Gf(){const n=Rs("canvas");return n.style.display="block",n}const zl={};function kl(...n){const e="THREE."+n.shift();console.log(e,...n)}function Du(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ie(...n){n=Du(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Xe(...n){n=Du(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Qi(...n){const e=n.join(" ");e in zl||(zl[e]=!0,Ie(...n))}function Vf(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const Hf={[qa]:Ya,[$a]:Ja,[Ka]:Qa,[er]:Za,[Ya]:qa,[Ja]:$a,[Qa]:Ka,[Za]:er};class Ti{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Lt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ks=Math.PI/180,Cs=180/Math.PI;function Lr(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Lt[n&255]+Lt[n>>8&255]+Lt[n>>16&255]+Lt[n>>24&255]+"-"+Lt[e&255]+Lt[e>>8&255]+"-"+Lt[e>>16&15|64]+Lt[e>>24&255]+"-"+Lt[t&63|128]+Lt[t>>8&255]+"-"+Lt[t>>16&255]+Lt[t>>24&255]+Lt[i&255]+Lt[i>>8&255]+Lt[i>>16&255]+Lt[i>>24&255]).toLowerCase()}function We(n,e,t){return Math.max(e,Math.min(t,n))}function Wf(n,e){return(n%e+e)%e}function Zs(n,e,t){return(1-t)*n+t*e}function lr(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Ft(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class Be{static{Be.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class pn{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],d=i[r+2],h=i[r+3],u=s[a+0],f=s[a+1],x=s[a+2],S=s[a+3];if(h!==S||l!==u||c!==f||d!==x){let m=l*u+c*f+d*x+h*S;m<0&&(u=-u,f=-f,x=-x,S=-S,m=-m);let p=1-o;if(m<.9995){const R=Math.acos(m),L=Math.sin(R);p=Math.sin(p*R)/L,o=Math.sin(o*R)/L,l=l*p+u*o,c=c*p+f*o,d=d*p+x*o,h=h*p+S*o}else{l=l*p+u*o,c=c*p+f*o,d=d*p+x*o,h=h*p+S*o;const R=1/Math.sqrt(l*l+c*c+d*d+h*h);l*=R,c*=R,d*=R,h*=R}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],d=i[r+3],h=s[a],u=s[a+1],f=s[a+2],x=s[a+3];return e[t]=o*x+d*h+l*f-c*u,e[t+1]=l*x+d*u+c*h-o*f,e[t+2]=c*x+d*f+o*u-l*h,e[t+3]=d*x-o*h-l*u-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(r/2),h=o(s/2),u=l(i/2),f=l(r/2),x=l(s/2);switch(a){case"XYZ":this._x=u*d*h+c*f*x,this._y=c*f*h-u*d*x,this._z=c*d*x+u*f*h,this._w=c*d*h-u*f*x;break;case"YXZ":this._x=u*d*h+c*f*x,this._y=c*f*h-u*d*x,this._z=c*d*x-u*f*h,this._w=c*d*h+u*f*x;break;case"ZXY":this._x=u*d*h-c*f*x,this._y=c*f*h+u*d*x,this._z=c*d*x+u*f*h,this._w=c*d*h-u*f*x;break;case"ZYX":this._x=u*d*h-c*f*x,this._y=c*f*h+u*d*x,this._z=c*d*x-u*f*h,this._w=c*d*h+u*f*x;break;case"YZX":this._x=u*d*h+c*f*x,this._y=c*f*h+u*d*x,this._z=c*d*x-u*f*h,this._w=c*d*h-u*f*x;break;case"XZY":this._x=u*d*h-c*f*x,this._y=c*f*h-u*d*x,this._z=c*d*x+u*f*h,this._w=c*d*h+u*f*x;break;default:Ie("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],h=t[10],u=i+o+h;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(d-l)*f,this._y=(s-c)*f,this._z=(a-r)*f}else if(i>o&&i>h){const f=2*Math.sqrt(1+i-o-h);this._w=(d-l)/f,this._x=.25*f,this._y=(r+a)/f,this._z=(s+c)/f}else if(o>h){const f=2*Math.sqrt(1+o-i-h);this._w=(s-c)/f,this._x=(r+a)/f,this._y=.25*f,this._z=(l+d)/f}else{const f=2*Math.sqrt(1+h-i-o);this._w=(a-r)/f,this._x=(s+c)/f,this._y=(l+d)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+r*c-s*l,this._y=r*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-r*o,this._w=a*d-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),d=Math.sin(c);l=Math.sin(l*c)/d,t=Math.sin(t*c)/d,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class z{static{z.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Gl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Gl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),d=2*(o*t-s*r),h=2*(s*i-a*t);return this.x=t+l*c+a*h-o*d,this.y=i+l*d+o*c-s*h,this.z=r+l*h+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Js.copy(this).projectOnVector(e),this.sub(Js)}reflect(e){return this.sub(Js.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Js=new z,Gl=new pn;class Ne{static{Ne.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],h=i[7],u=i[2],f=i[5],x=i[8],S=r[0],m=r[3],p=r[6],R=r[1],L=r[4],v=r[7],E=r[2],y=r[5],C=r[8];return s[0]=a*S+o*R+l*E,s[3]=a*m+o*L+l*y,s[6]=a*p+o*v+l*C,s[1]=c*S+d*R+h*E,s[4]=c*m+d*L+h*y,s[7]=c*p+d*v+h*C,s[2]=u*S+f*R+x*E,s[5]=u*m+f*L+x*y,s[8]=u*p+f*v+x*C,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],h=d*a-o*c,u=o*l-d*s,f=c*s-a*l,x=t*h+i*u+r*f;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/x;return e[0]=h*S,e[1]=(r*c-d*i)*S,e[2]=(o*i-r*a)*S,e[3]=u*S,e[4]=(d*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=f*S,e[7]=(i*l-c*t)*S,e[8]=(a*t-i*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Qi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Qs.makeScale(e,t)),this}rotate(e){return Qi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Qs.makeRotation(-e)),this}translate(e,t){return Qi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Qs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Qs=new Ne,Vl=new Ne().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Hl=new Ne().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Xf(){const n={enabled:!0,workingColorSpace:ws,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Je&&(r.r=Dn(r.r),r.g=Dn(r.g),r.b=Dn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Je&&(r.r=ji(r.r),r.g=ji(r.g),r.b=ji(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Kn?As:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Qi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Qi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[ws]:{primaries:e,whitePoint:i,transfer:As,toXYZ:Vl,fromXYZ:Hl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:dt},outputColorSpaceConfig:{drawingBufferColorSpace:dt}},[dt]:{primaries:e,whitePoint:i,transfer:Je,toXYZ:Vl,fromXYZ:Hl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:dt}}}),n}const He=Xf();function Dn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ji(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Pi;class qf{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Pi===void 0&&(Pi=Rs("canvas")),Pi.width=e.width,Pi.height=e.height;const r=Pi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Pi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Rs("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Dn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Dn(t[i]/255)*255):t[i]=Dn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ie("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Yf=0;class rl{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Yf++}),this.uuid=Lr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(js(r[a].image)):s.push(js(r[a]))}else s=js(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function js(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?qf.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ie("Texture: Unable to serialize Texture."),{})}let $f=0;const ea=new z;class Rt extends Ti{constructor(e=Rt.DEFAULT_IMAGE,t=Rt.DEFAULT_MAPPING,i=nn,r=nn,s=Et,a=Pn,o=rn,l=Ht,c=Rt.DEFAULT_ANISOTROPY,d=Kn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$f++}),this.uuid=Lr(),this.name="",this.source=new rl(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Be(0,0),this.repeat=new Be(1,1),this.center=new Be(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ne,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ea).x}get height(){return this.source.getSize(ea).y}get depth(){return this.source.getSize(ea).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Ie(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ie(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Tu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ja:e.x=e.x-Math.floor(e.x);break;case nn:e.x=e.x<0?0:1;break;case eo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ja:e.y=e.y-Math.floor(e.y);break;case nn:e.y=e.y<0?0:1;break;case eo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Rt.DEFAULT_IMAGE=null;Rt.DEFAULT_MAPPING=Tu;Rt.DEFAULT_ANISOTROPY=1;class ot{static{ot.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],d=l[4],h=l[8],u=l[1],f=l[5],x=l[9],S=l[2],m=l[6],p=l[10];if(Math.abs(d-u)<.01&&Math.abs(h-S)<.01&&Math.abs(x-m)<.01){if(Math.abs(d+u)<.1&&Math.abs(h+S)<.1&&Math.abs(x+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const L=(c+1)/2,v=(f+1)/2,E=(p+1)/2,y=(d+u)/4,C=(h+S)/4,_=(x+m)/4;return L>v&&L>E?L<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(L),r=y/i,s=C/i):v>E?v<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),i=y/r,s=_/r):E<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(E),i=C/s,r=_/s),this.set(i,r,s,t),this}let R=Math.sqrt((m-x)*(m-x)+(h-S)*(h-S)+(u-d)*(u-d));return Math.abs(R)<.001&&(R=1),this.x=(m-x)/R,this.y=(h-S)/R,this.z=(u-d)/R,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Kf extends Ti{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Et,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Rt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Et,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new rl(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class _n extends Kf{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Nu extends Rt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=At,this.minFilter=At,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Zf extends Rt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=At,this.minFilter=At,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class rt{static{rt.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,l,c,d,h,u,f,x,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,d,h,u,f,x,S,m)}set(e,t,i,r,s,a,o,l,c,d,h,u,f,x,S,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=d,p[10]=h,p[14]=u,p[3]=f,p[7]=x,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new rt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Li.setFromMatrixColumn(e,0).length(),s=1/Li.setFromMatrixColumn(e,1).length(),a=1/Li.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const u=a*d,f=a*h,x=o*d,S=o*h;t[0]=l*d,t[4]=-l*h,t[8]=c,t[1]=f+x*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=x+f*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*d,f=l*h,x=c*d,S=c*h;t[0]=u+S*o,t[4]=x*o-f,t[8]=a*c,t[1]=a*h,t[5]=a*d,t[9]=-o,t[2]=f*o-x,t[6]=S+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*d,f=l*h,x=c*d,S=c*h;t[0]=u-S*o,t[4]=-a*h,t[8]=x+f*o,t[1]=f+x*o,t[5]=a*d,t[9]=S-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*d,f=a*h,x=o*d,S=o*h;t[0]=l*d,t[4]=x*c-f,t[8]=u*c+S,t[1]=l*h,t[5]=S*c+u,t[9]=f*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,f=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=S-u*h,t[8]=x*h+f,t[1]=h,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=f*h+x,t[10]=u-S*h}else if(e.order==="XZY"){const u=a*l,f=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=-h,t[8]=c*d,t[1]=u*h+S,t[5]=a*d,t[9]=f*h-x,t[2]=x*h-f,t[6]=o*d,t[10]=S*h+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Jf,e,Qf)}lookAt(e,t,i){const r=this.elements;return kt.subVectors(e,t),kt.lengthSq()===0&&(kt.z=1),kt.normalize(),Gn.crossVectors(i,kt),Gn.lengthSq()===0&&(Math.abs(i.z)===1?kt.x+=1e-4:kt.z+=1e-4,kt.normalize(),Gn.crossVectors(i,kt)),Gn.normalize(),kr.crossVectors(kt,Gn),r[0]=Gn.x,r[4]=kr.x,r[8]=kt.x,r[1]=Gn.y,r[5]=kr.y,r[9]=kt.y,r[2]=Gn.z,r[6]=kr.z,r[10]=kt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],h=i[5],u=i[9],f=i[13],x=i[2],S=i[6],m=i[10],p=i[14],R=i[3],L=i[7],v=i[11],E=i[15],y=r[0],C=r[4],_=r[8],b=r[12],U=r[1],D=r[5],O=r[9],K=r[13],Z=r[2],w=r[6],V=r[10],N=r[14],$=r[3],ne=r[7],oe=r[11],ie=r[15];return s[0]=a*y+o*U+l*Z+c*$,s[4]=a*C+o*D+l*w+c*ne,s[8]=a*_+o*O+l*V+c*oe,s[12]=a*b+o*K+l*N+c*ie,s[1]=d*y+h*U+u*Z+f*$,s[5]=d*C+h*D+u*w+f*ne,s[9]=d*_+h*O+u*V+f*oe,s[13]=d*b+h*K+u*N+f*ie,s[2]=x*y+S*U+m*Z+p*$,s[6]=x*C+S*D+m*w+p*ne,s[10]=x*_+S*O+m*V+p*oe,s[14]=x*b+S*K+m*N+p*ie,s[3]=R*y+L*U+v*Z+E*$,s[7]=R*C+L*D+v*w+E*ne,s[11]=R*_+L*O+v*V+E*oe,s[15]=R*b+L*K+v*N+E*ie,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],h=e[6],u=e[10],f=e[14],x=e[3],S=e[7],m=e[11],p=e[15],R=l*f-c*u,L=o*f-c*h,v=o*u-l*h,E=a*f-c*d,y=a*u-l*d,C=a*h-o*d;return t*(S*R-m*L+p*v)-i*(x*R-m*E+p*y)+r*(x*L-S*E+p*C)-s*(x*v-S*y+m*C)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],d=e[10];return t*(a*d-o*c)-i*(s*d-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],h=e[9],u=e[10],f=e[11],x=e[12],S=e[13],m=e[14],p=e[15],R=t*o-i*a,L=t*l-r*a,v=t*c-s*a,E=i*l-r*o,y=i*c-s*o,C=r*c-s*l,_=d*S-h*x,b=d*m-u*x,U=d*p-f*x,D=h*m-u*S,O=h*p-f*S,K=u*p-f*m,Z=R*K-L*O+v*D+E*U-y*b+C*_;if(Z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/Z;return e[0]=(o*K-l*O+c*D)*w,e[1]=(r*O-i*K-s*D)*w,e[2]=(S*C-m*y+p*E)*w,e[3]=(u*y-h*C-f*E)*w,e[4]=(l*U-a*K-c*b)*w,e[5]=(t*K-r*U+s*b)*w,e[6]=(m*v-x*C-p*L)*w,e[7]=(d*C-u*v+f*L)*w,e[8]=(a*O-o*U+c*_)*w,e[9]=(i*U-t*O-s*_)*w,e[10]=(x*y-S*v+p*R)*w,e[11]=(h*v-d*y-f*R)*w,e[12]=(o*b-a*D-l*_)*w,e[13]=(t*D-i*b+r*_)*w,e[14]=(S*L-x*E-m*R)*w,e[15]=(d*E-h*L+u*R)*w,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,d*o+i,d*l-r*a,0,c*l-r*o,d*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,h=o+o,u=s*c,f=s*d,x=s*h,S=a*d,m=a*h,p=o*h,R=l*c,L=l*d,v=l*h,E=i.x,y=i.y,C=i.z;return r[0]=(1-(S+p))*E,r[1]=(f+v)*E,r[2]=(x-L)*E,r[3]=0,r[4]=(f-v)*y,r[5]=(1-(u+p))*y,r[6]=(m+R)*y,r[7]=0,r[8]=(x+L)*C,r[9]=(m-R)*C,r[10]=(1-(u+S))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Li.set(r[0],r[1],r[2]).length();const o=Li.set(r[4],r[5],r[6]).length(),l=Li.set(r[8],r[9],r[10]).length();s<0&&(a=-a),Zt.copy(this);const c=1/a,d=1/o,h=1/l;return Zt.elements[0]*=c,Zt.elements[1]*=c,Zt.elements[2]*=c,Zt.elements[4]*=d,Zt.elements[5]*=d,Zt.elements[6]*=d,Zt.elements[8]*=h,Zt.elements[9]*=h,Zt.elements[10]*=h,t.setFromRotationMatrix(Zt),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=hn,l=!1){const c=this.elements,d=2*s/(t-e),h=2*s/(i-r),u=(t+e)/(t-e),f=(i+r)/(i-r);let x,S;if(l)x=s/(a-s),S=a*s/(a-s);else if(o===hn)x=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===Ar)x=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=hn,l=!1){const c=this.elements,d=2/(t-e),h=2/(i-r),u=-(t+e)/(t-e),f=-(i+r)/(i-r);let x,S;if(l)x=1/(a-s),S=a/(a-s);else if(o===hn)x=-2/(a-s),S=-(a+s)/(a-s);else if(o===Ar)x=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=h,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Li=new z,Zt=new rt,Jf=new z(0,0,0),Qf=new z(1,1,1),Gn=new z,kr=new z,kt=new z,Wl=new rt,Xl=new pn;class ii{constructor(e=0,t=0,i=0,r=ii.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],d=r[9],h=r[2],u=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-We(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,f),this._y=0);break;default:Ie("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Wl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Wl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Xl.setFromEuler(this),this.setFromQuaternion(Xl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ii.DEFAULT_ORDER="XYZ";class sl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let jf=0;const ql=new z,Ii=new pn,yn=new rt,Gr=new z,cr=new z,eh=new z,th=new pn,Yl=new z(1,0,0),$l=new z(0,1,0),Kl=new z(0,0,1),Zl={type:"added"},nh={type:"removed"},Di={type:"childadded",child:null},ta={type:"childremoved",child:null};class Tt extends Ti{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:jf++}),this.uuid=Lr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Tt.DEFAULT_UP.clone();const e=new z,t=new ii,i=new pn,r=new z(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new rt},normalMatrix:{value:new Ne}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=Tt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new sl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ii.setFromAxisAngle(e,t),this.quaternion.multiply(Ii),this}rotateOnWorldAxis(e,t){return Ii.setFromAxisAngle(e,t),this.quaternion.premultiply(Ii),this}rotateX(e){return this.rotateOnAxis(Yl,e)}rotateY(e){return this.rotateOnAxis($l,e)}rotateZ(e){return this.rotateOnAxis(Kl,e)}translateOnAxis(e,t){return ql.copy(e).applyQuaternion(this.quaternion),this.position.add(ql.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Yl,e)}translateY(e){return this.translateOnAxis($l,e)}translateZ(e){return this.translateOnAxis(Kl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(yn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Gr.copy(e):Gr.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),cr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?yn.lookAt(cr,Gr,this.up):yn.lookAt(Gr,cr,this.up),this.quaternion.setFromRotationMatrix(yn),r&&(yn.extractRotation(r.matrixWorld),Ii.setFromRotationMatrix(yn),this.quaternion.premultiply(Ii.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Xe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Zl),Di.child=e,this.dispatchEvent(Di),Di.child=null):Xe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(nh),ta.child=e,this.dispatchEvent(ta),ta.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),yn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),yn.multiply(e.parent.matrixWorld)),e.applyMatrix4(yn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Zl),Di.child=e,this.dispatchEvent(Di),Di.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(cr,e,eh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(cr,th,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),h=a(e.shapes),u=a(e.skeletons),f=a(e.animations),x=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),h.length>0&&(i.shapes=h),u.length>0&&(i.skeletons=u),f.length>0&&(i.animations=f),x.length>0&&(i.nodes=x)}return i.object=r,i;function a(o){const l=[];for(const c in o){const d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Tt.DEFAULT_UP=new z(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Ki extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ih={type:"move"};class na{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ki,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ki,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ki,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,i),p=this._getHandJoint(c,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const d=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],u=d.position.distanceTo(h.position),f=.02,x=.005;c.inputState.pinching&&u>f+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=f-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ih)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Ki;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const Uu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Vn={h:0,s:0,l:0},Vr={h:0,s:0,l:0};function ia(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Pe{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=dt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,He.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=He.workingColorSpace){return this.r=e,this.g=t,this.b=i,He.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=He.workingColorSpace){if(e=Wf(e,1),t=We(t,0,1),i=We(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=ia(a,s,e+1/3),this.g=ia(a,s,e),this.b=ia(a,s,e-1/3)}return He.colorSpaceToWorking(this,r),this}setStyle(e,t=dt){function i(s){s!==void 0&&parseFloat(s)<1&&Ie("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ie("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ie("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=dt){const i=Uu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ie("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Dn(e.r),this.g=Dn(e.g),this.b=Dn(e.b),this}copyLinearToSRGB(e){return this.r=ji(e.r),this.g=ji(e.g),this.b=ji(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=dt){return He.workingToColorSpace(It.copy(this),e),Math.round(We(It.r*255,0,255))*65536+Math.round(We(It.g*255,0,255))*256+Math.round(We(It.b*255,0,255))}getHexString(e=dt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=He.workingColorSpace){He.workingToColorSpace(It.copy(this),t);const i=It.r,r=It.g,s=It.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const d=(o+a)/2;if(o===a)l=0,c=0;else{const h=a-o;switch(c=d<=.5?h/(a+o):h/(2-a-o),a){case i:l=(r-s)/h+(r<s?6:0);break;case r:l=(s-i)/h+2;break;case s:l=(i-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=He.workingColorSpace){return He.workingToColorSpace(It.copy(this),t),e.r=It.r,e.g=It.g,e.b=It.b,e}getStyle(e=dt){He.workingToColorSpace(It.copy(this),e);const t=It.r,i=It.g,r=It.b;return e!==dt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Vn),this.setHSL(Vn.h+e,Vn.s+t,Vn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Vn),e.getHSL(Vr);const i=Zs(Vn.h,Vr.h,t),r=Zs(Vn.s,Vr.s,t),s=Zs(Vn.l,Vr.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const It=new Pe;Pe.NAMES=Uu;class rh extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ii,this.environmentIntensity=1,this.environmentRotation=new ii,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Jt=new z,bn=new z,ra=new z,En=new z,Ni=new z,Ui=new z,Jl=new z,sa=new z,aa=new z,oa=new z,la=new ot,ca=new ot,ua=new ot;class en{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Jt.subVectors(e,t),r.cross(Jt);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Jt.subVectors(r,t),bn.subVectors(i,t),ra.subVectors(e,t);const a=Jt.dot(Jt),o=Jt.dot(bn),l=Jt.dot(ra),c=bn.dot(bn),d=bn.dot(ra),h=a*c-o*o;if(h===0)return s.set(0,0,0),null;const u=1/h,f=(c*l-o*d)*u,x=(a*d-o*l)*u;return s.set(1-f-x,x,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,En)===null?!1:En.x>=0&&En.y>=0&&En.x+En.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,En)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,En.x),l.addScaledVector(a,En.y),l.addScaledVector(o,En.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return la.setScalar(0),ca.setScalar(0),ua.setScalar(0),la.fromBufferAttribute(e,t),ca.fromBufferAttribute(e,i),ua.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(la,s.x),a.addScaledVector(ca,s.y),a.addScaledVector(ua,s.z),a}static isFrontFacing(e,t,i,r){return Jt.subVectors(i,t),bn.subVectors(e,t),Jt.cross(bn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Jt.subVectors(this.c,this.b),bn.subVectors(this.a,this.b),Jt.cross(bn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return en.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return en.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return en.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return en.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return en.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;Ni.subVectors(r,i),Ui.subVectors(s,i),sa.subVectors(e,i);const l=Ni.dot(sa),c=Ui.dot(sa);if(l<=0&&c<=0)return t.copy(i);aa.subVectors(e,r);const d=Ni.dot(aa),h=Ui.dot(aa);if(d>=0&&h<=d)return t.copy(r);const u=l*h-d*c;if(u<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(Ni,a);oa.subVectors(e,s);const f=Ni.dot(oa),x=Ui.dot(oa);if(x>=0&&f<=x)return t.copy(s);const S=f*c-l*x;if(S<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(i).addScaledVector(Ui,o);const m=d*x-f*h;if(m<=0&&h-d>=0&&f-x>=0)return Jl.subVectors(s,r),o=(h-d)/(h-d+(f-x)),t.copy(r).addScaledVector(Jl,o);const p=1/(m+S+u);return a=S*p,o=u*p,t.copy(i).addScaledVector(Ni,a).addScaledVector(Ui,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Ir{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=Qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Qt):Qt.fromBufferAttribute(s,a),Qt.applyMatrix4(e.matrixWorld),this.expandByPoint(Qt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Hr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Hr.copy(i.boundingBox)),Hr.applyMatrix4(e.matrixWorld),this.union(Hr)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Qt),Qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ur),Wr.subVectors(this.max,ur),Fi.subVectors(e.a,ur),Oi.subVectors(e.b,ur),Bi.subVectors(e.c,ur),Hn.subVectors(Oi,Fi),Wn.subVectors(Bi,Oi),oi.subVectors(Fi,Bi);let t=[0,-Hn.z,Hn.y,0,-Wn.z,Wn.y,0,-oi.z,oi.y,Hn.z,0,-Hn.x,Wn.z,0,-Wn.x,oi.z,0,-oi.x,-Hn.y,Hn.x,0,-Wn.y,Wn.x,0,-oi.y,oi.x,0];return!da(t,Fi,Oi,Bi,Wr)||(t=[1,0,0,0,1,0,0,0,1],!da(t,Fi,Oi,Bi,Wr))?!1:(Xr.crossVectors(Hn,Wn),t=[Xr.x,Xr.y,Xr.z],da(t,Fi,Oi,Bi,Wr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Qt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Tn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Tn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Tn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Tn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Tn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Tn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Tn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Tn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Tn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Tn=[new z,new z,new z,new z,new z,new z,new z,new z],Qt=new z,Hr=new Ir,Fi=new z,Oi=new z,Bi=new z,Hn=new z,Wn=new z,oi=new z,ur=new z,Wr=new z,Xr=new z,li=new z;function da(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){li.fromArray(n,s);const o=r.x*Math.abs(li.x)+r.y*Math.abs(li.y)+r.z*Math.abs(li.z),l=e.dot(li),c=t.dot(li),d=i.dot(li);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}const gt=new z,qr=new Be;let sh=0;class xt extends Ti{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:sh++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Ol,this.updateRanges=[],this.gpuType=fn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)qr.fromBufferAttribute(this,t),qr.applyMatrix3(e),this.setXY(t,qr.x,qr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix3(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix4(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyNormalMatrix(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.transformDirection(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=lr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Ft(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=lr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=lr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=lr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=lr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array),r=Ft(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array),r=Ft(r,this.array),s=Ft(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ol&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class Fu extends xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Ou extends xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class wt extends xt{constructor(e,t,i){super(new Float32Array(e),t,i)}}const ah=new Ir,dr=new z,fa=new z;class Os{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):ah.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;dr.subVectors(e,this.center);const t=dr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(dr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(fa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(dr.copy(e.center).add(fa)),this.expandByPoint(dr.copy(e.center).sub(fa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let oh=0;const qt=new rt,ha=new Tt,zi=new z,Gt=new Ir,fr=new Ir,yt=new z;class Dt extends Ti{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:oh++}),this.uuid=Lr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(kf(e)?Ou:Fu)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ne().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return qt.makeRotationFromQuaternion(e),this.applyMatrix4(qt),this}rotateX(e){return qt.makeRotationX(e),this.applyMatrix4(qt),this}rotateY(e){return qt.makeRotationY(e),this.applyMatrix4(qt),this}rotateZ(e){return qt.makeRotationZ(e),this.applyMatrix4(qt),this}translate(e,t,i){return qt.makeTranslation(e,t,i),this.applyMatrix4(qt),this}scale(e,t,i){return qt.makeScale(e,t,i),this.applyMatrix4(qt),this}lookAt(e){return ha.lookAt(e),ha.updateMatrix(),this.applyMatrix4(ha.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(zi).negate(),this.translate(zi.x,zi.y,zi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new wt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ie("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ir);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Gt.setFromBufferAttribute(s),this.morphTargetsRelative?(yt.addVectors(this.boundingBox.min,Gt.min),this.boundingBox.expandByPoint(yt),yt.addVectors(this.boundingBox.max,Gt.max),this.boundingBox.expandByPoint(yt)):(this.boundingBox.expandByPoint(Gt.min),this.boundingBox.expandByPoint(Gt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Os);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){const i=this.boundingSphere.center;if(Gt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];fr.setFromBufferAttribute(o),this.morphTargetsRelative?(yt.addVectors(Gt.min,fr.min),Gt.expandByPoint(yt),yt.addVectors(Gt.max,fr.max),Gt.expandByPoint(yt)):(Gt.expandByPoint(fr.min),Gt.expandByPoint(fr.max))}Gt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)yt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(yt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)yt.fromBufferAttribute(o,c),l&&(zi.fromBufferAttribute(e,c),yt.add(zi)),r=Math.max(r,i.distanceToSquared(yt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Xe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Xe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new xt(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new z,l[_]=new z;const c=new z,d=new z,h=new z,u=new Be,f=new Be,x=new Be,S=new z,m=new z;function p(_,b,U){c.fromBufferAttribute(i,_),d.fromBufferAttribute(i,b),h.fromBufferAttribute(i,U),u.fromBufferAttribute(s,_),f.fromBufferAttribute(s,b),x.fromBufferAttribute(s,U),d.sub(c),h.sub(c),f.sub(u),x.sub(u);const D=1/(f.x*x.y-x.x*f.y);isFinite(D)&&(S.copy(d).multiplyScalar(x.y).addScaledVector(h,-f.y).multiplyScalar(D),m.copy(h).multiplyScalar(f.x).addScaledVector(d,-x.x).multiplyScalar(D),o[_].add(S),o[b].add(S),o[U].add(S),l[_].add(m),l[b].add(m),l[U].add(m))}let R=this.groups;R.length===0&&(R=[{start:0,count:e.count}]);for(let _=0,b=R.length;_<b;++_){const U=R[_],D=U.start,O=U.count;for(let K=D,Z=D+O;K<Z;K+=3)p(e.getX(K+0),e.getX(K+1),e.getX(K+2))}const L=new z,v=new z,E=new z,y=new z;function C(_){E.fromBufferAttribute(r,_),y.copy(E);const b=o[_];L.copy(b),L.sub(E.multiplyScalar(E.dot(b))).normalize(),v.crossVectors(y,b);const D=v.dot(l[_])<0?-1:1;a.setXYZW(_,L.x,L.y,L.z,D)}for(let _=0,b=R.length;_<b;++_){const U=R[_],D=U.start,O=U.count;for(let K=D,Z=D+O;K<Z;K+=3)C(e.getX(K+0)),C(e.getX(K+1)),C(e.getX(K+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,f=i.count;u<f;u++)i.setXYZ(u,0,0,0);const r=new z,s=new z,a=new z,o=new z,l=new z,c=new z,d=new z,h=new z;if(e)for(let u=0,f=e.count;u<f;u+=3){const x=e.getX(u+0),S=e.getX(u+1),m=e.getX(u+2);r.fromBufferAttribute(t,x),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),d.subVectors(a,s),h.subVectors(r,s),d.cross(h),o.fromBufferAttribute(i,x),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(x,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,f=t.count;u<f;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),d.subVectors(a,s),h.subVectors(r,s),d.cross(h),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)yt.fromBufferAttribute(e,t),yt.normalize(),e.setXYZ(t,yt.x,yt.y,yt.z)}toNonIndexed(){function e(o,l){const c=o.array,d=o.itemSize,h=o.normalized,u=new c.constructor(l.length*d);let f=0,x=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?f=l[S]*o.data.stride+o.offset:f=l[S]*d;for(let p=0;p<d;p++)u[x++]=c[f++]}return new xt(u,d,h)}if(this.index===null)return Ie("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Dt,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let d=0,h=c.length;d<h;d++){const u=c[d],f=e(u,i);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let h=0,u=c.length;h<u;h++){const f=c[h];d.push(f.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const d=r[c];this.setAttribute(c,d.clone(t))}const s=e.morphAttributes;for(const c in s){const d=[],h=s[c];for(let u=0,f=h.length;u<f;u++)d.push(h[u].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,d=a.length;c<d;c++){const h=a[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}let lh=0;class sr extends Ti{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:lh++}),this.uuid=Lr(),this.name="",this.type="Material",this.blending=Ji,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Wa,this.blendDst=Xa,this.blendEquation=gi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pe(0,0,0),this.blendAlpha=0,this.depthFunc=er,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Fl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ci,this.stencilZFail=Ci,this.stencilZPass=Ci,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Ie(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ie(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ji&&(i.blending=this.blending),this.side!==ti&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Wa&&(i.blendSrc=this.blendSrc),this.blendDst!==Xa&&(i.blendDst=this.blendDst),this.blendEquation!==gi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==er&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Fl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ci&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ci&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ci&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Pe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Be().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Be().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const wn=new z,pa=new z,Yr=new z,Xn=new z,ma=new z,$r=new z,ga=new z;class al{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,wn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=wn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(wn.copy(this.origin).addScaledVector(this.direction,t),wn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){pa.copy(e).add(t).multiplyScalar(.5),Yr.copy(t).sub(e).normalize(),Xn.copy(this.origin).sub(pa);const s=e.distanceTo(t)*.5,a=-this.direction.dot(Yr),o=Xn.dot(this.direction),l=-Xn.dot(Yr),c=Xn.lengthSq(),d=Math.abs(1-a*a);let h,u,f,x;if(d>0)if(h=a*l-o,u=a*o-l,x=s*d,h>=0)if(u>=-x)if(u<=x){const S=1/d;h*=S,u*=S,f=h*(h+a*u+2*o)+u*(a*h+u+2*l)+c}else u=s,h=Math.max(0,-(a*u+o)),f=-h*h+u*(u+2*l)+c;else u=-s,h=Math.max(0,-(a*u+o)),f=-h*h+u*(u+2*l)+c;else u<=-x?(h=Math.max(0,-(-a*s+o)),u=h>0?-s:Math.min(Math.max(-s,-l),s),f=-h*h+u*(u+2*l)+c):u<=x?(h=0,u=Math.min(Math.max(-s,-l),s),f=u*(u+2*l)+c):(h=Math.max(0,-(a*s+o)),u=h>0?s:Math.min(Math.max(-s,-l),s),f=-h*h+u*(u+2*l)+c);else u=a>0?-s:s,h=Math.max(0,-(a*u+o)),f=-h*h+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(pa).addScaledVector(Yr,u),f}intersectSphere(e,t){wn.subVectors(e.center,this.origin);const i=wn.dot(this.direction),r=wn.dot(wn)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,d=1/this.direction.y,h=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),d>=0?(s=(e.min.y-u.y)*d,a=(e.max.y-u.y)*d):(s=(e.max.y-u.y)*d,a=(e.min.y-u.y)*d),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),h>=0?(o=(e.min.z-u.z)*h,l=(e.max.z-u.z)*h):(o=(e.max.z-u.z)*h,l=(e.min.z-u.z)*h),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,wn)!==null}intersectTriangle(e,t,i,r,s){ma.subVectors(t,e),$r.subVectors(i,e),ga.crossVectors(ma,$r);let a=this.direction.dot(ga),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Xn.subVectors(this.origin,e);const l=o*this.direction.dot($r.crossVectors(Xn,$r));if(l<0)return null;const c=o*this.direction.dot(ma.cross(Xn));if(c<0||l+c>a)return null;const d=-o*Xn.dot(ga);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class $t extends sr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Pe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ii,this.combine=xu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Ql=new rt,ci=new al,Kr=new Os,jl=new z,Zr=new z,Jr=new z,Qr=new z,_a=new z,jr=new z,ec=new z,es=new z;class _t extends Tt{constructor(e=new Dt,t=new $t){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){jr.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const d=o[l],h=s[l];d!==0&&(_a.fromBufferAttribute(h,e),a?jr.addScaledVector(_a,d):jr.addScaledVector(_a.sub(t),d))}t.add(jr)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Kr.copy(i.boundingSphere),Kr.applyMatrix4(s),ci.copy(e.ray).recast(e.near),!(Kr.containsPoint(ci.origin)===!1&&(ci.intersectSphere(Kr,jl)===null||ci.origin.distanceToSquared(jl)>(e.far-e.near)**2))&&(Ql.copy(s).invert(),ci.copy(e.ray).applyMatrix4(Ql),!(i.boundingBox!==null&&ci.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,ci)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,h=s.attributes.normal,u=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],p=a[m.materialIndex],R=Math.max(m.start,f.start),L=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let v=R,E=L;v<E;v+=3){const y=o.getX(v),C=o.getX(v+1),_=o.getX(v+2);r=ts(this,p,e,i,c,d,h,y,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,f.start),S=Math.min(o.count,f.start+f.count);for(let m=x,p=S;m<p;m+=3){const R=o.getX(m),L=o.getX(m+1),v=o.getX(m+2);r=ts(this,a,e,i,c,d,h,R,L,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],p=a[m.materialIndex],R=Math.max(m.start,f.start),L=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let v=R,E=L;v<E;v+=3){const y=v,C=v+1,_=v+2;r=ts(this,p,e,i,c,d,h,y,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,f.start),S=Math.min(l.count,f.start+f.count);for(let m=x,p=S;m<p;m+=3){const R=m,L=m+1,v=m+2;r=ts(this,a,e,i,c,d,h,R,L,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function ch(n,e,t,i,r,s,a,o){let l;if(e.side===Ut?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===ti,o),l===null)return null;es.copy(o),es.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(es);return c<t.near||c>t.far?null:{distance:c,point:es.clone(),object:n}}function ts(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,Zr),n.getVertexPosition(l,Jr),n.getVertexPosition(c,Qr);const d=ch(n,e,t,i,Zr,Jr,Qr,ec);if(d){const h=new z;en.getBarycoord(ec,Zr,Jr,Qr,h),r&&(d.uv=en.getInterpolatedAttribute(r,o,l,c,h,new Be)),s&&(d.uv1=en.getInterpolatedAttribute(s,o,l,c,h,new Be)),a&&(d.normal=en.getInterpolatedAttribute(a,o,l,c,h,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new z,materialIndex:0};en.getNormal(Zr,Jr,Qr,u.normal),d.face=u,d.barycoord=h}return d}class uh extends Rt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=At,d=At,h,u){super(null,a,o,l,c,d,r,s,h,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const xa=new z,dh=new z,fh=new Ne;class Cn{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=xa.subVectors(i,t).cross(dh.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(xa),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||fh.getNormalMatrix(e),r=this.coplanarPoint(xa).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ui=new Os,hh=new Be(.5,.5),ns=new z;class ol{constructor(e=new Cn,t=new Cn,i=new Cn,r=new Cn,s=new Cn,a=new Cn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=hn,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],d=s[4],h=s[5],u=s[6],f=s[7],x=s[8],S=s[9],m=s[10],p=s[11],R=s[12],L=s[13],v=s[14],E=s[15];if(r[0].setComponents(c-a,f-d,p-x,E-R).normalize(),r[1].setComponents(c+a,f+d,p+x,E+R).normalize(),r[2].setComponents(c+o,f+h,p+S,E+L).normalize(),r[3].setComponents(c-o,f-h,p-S,E-L).normalize(),i)r[4].setComponents(l,u,m,v).normalize(),r[5].setComponents(c-l,f-u,p-m,E-v).normalize();else if(r[4].setComponents(c-l,f-u,p-m,E-v).normalize(),t===hn)r[5].setComponents(c+l,f+u,p+m,E+v).normalize();else if(t===Ar)r[5].setComponents(l,u,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ui.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ui.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ui)}intersectsSprite(e){ui.center.set(0,0,0);const t=hh.distanceTo(e.center);return ui.radius=.7071067811865476+t,ui.applyMatrix4(e.matrixWorld),this.intersectsSphere(ui)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(ns.x=r.normal.x>0?e.max.x:e.min.x,ns.y=r.normal.y>0?e.max.y:e.min.y,ns.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ns)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ll extends sr{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Pe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const tc=new rt,Do=new al,is=new Os,rs=new z;class Bu extends Tt{constructor(e=new Dt,t=new ll){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),is.copy(i.boundingSphere),is.applyMatrix4(r),is.radius+=s,e.ray.intersectsSphere(is)===!1)return;tc.copy(r).invert(),Do.copy(e.ray).applyMatrix4(tc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,h=i.attributes.position;if(c!==null){const u=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let x=u,S=f;x<S;x++){const m=c.getX(x);rs.fromBufferAttribute(h,m),nc(rs,m,l,r,e,t,this)}}else{const u=Math.max(0,a.start),f=Math.min(h.count,a.start+a.count);for(let x=u,S=f;x<S;x++)rs.fromBufferAttribute(h,x),nc(rs,x,l,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function nc(n,e,t,i,r,s,a){const o=Do.distanceSqToPoint(n);if(o<t){const l=new z;Do.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class zu extends Rt{constructor(e=[],t=bi,i,r,s,a,o,l,c,d){super(e,t,i,r,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Sn extends Rt{constructor(e,t,i,r,s,a,o,l,c){super(e,t,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class nr extends Rt{constructor(e,t,i=vn,r,s,a,o=At,l=At,c,d=Fn,h=1){if(d!==Fn&&d!==Mi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:h};super(u,r,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new rl(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class ph extends nr{constructor(e,t=vn,i=bi,r,s,a=At,o=At,l,c=Fn){const d={width:e,height:e,depth:1},h=[d,d,d,d,d,d];super(e,e,t,i,r,s,a,o,l,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class ku extends Rt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Dr extends Dt{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],d=[],h=[];let u=0,f=0;x("z","y","x",-1,-1,i,t,e,a,s,0),x("z","y","x",1,-1,i,t,-e,a,s,1),x("x","z","y",1,1,e,i,t,r,a,2),x("x","z","y",1,-1,e,i,-t,r,a,3),x("x","y","z",1,-1,e,t,i,r,s,4),x("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new wt(c,3)),this.setAttribute("normal",new wt(d,3)),this.setAttribute("uv",new wt(h,2));function x(S,m,p,R,L,v,E,y,C,_,b){const U=v/C,D=E/_,O=v/2,K=E/2,Z=y/2,w=C+1,V=_+1;let N=0,$=0;const ne=new z;for(let oe=0;oe<V;oe++){const ie=oe*D-K;for(let fe=0;fe<w;fe++){const Oe=fe*U-O;ne[S]=Oe*R,ne[m]=ie*L,ne[p]=Z,c.push(ne.x,ne.y,ne.z),ne[S]=0,ne[m]=0,ne[p]=y>0?1:-1,d.push(ne.x,ne.y,ne.z),h.push(fe/C),h.push(1-oe/_),N+=1}}for(let oe=0;oe<_;oe++)for(let ie=0;ie<C;ie++){const fe=u+ie+w*oe,Oe=u+ie+w*(oe+1),Ke=u+(ie+1)+w*(oe+1),Te=u+(ie+1)+w*oe;l.push(fe,Oe,Te),l.push(Oe,Ke,Te),$+=6}o.addGroup(f,$,b),f+=$,u+=N}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Dr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Ps extends Dt{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new z,d=new Be;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let h=0,u=3;h<=t;h++,u+=3){const f=i+h/t*r;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),d.x=(a[u]/e+1)/2,d.y=(a[u+1]/e+1)/2,l.push(d.x,d.y)}for(let h=1;h<=t;h++)s.push(h,h+1,0);this.setIndex(s),this.setAttribute("position",new wt(a,3)),this.setAttribute("normal",new wt(o,3)),this.setAttribute("uv",new wt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ps(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class cl extends Dt{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const d=[],h=[],u=[],f=[];let x=0;const S=[],m=i/2;let p=0;R(),a===!1&&(e>0&&L(!0),t>0&&L(!1)),this.setIndex(d),this.setAttribute("position",new wt(h,3)),this.setAttribute("normal",new wt(u,3)),this.setAttribute("uv",new wt(f,2));function R(){const v=new z,E=new z;let y=0;const C=(t-e)/i;for(let _=0;_<=s;_++){const b=[],U=_/s,D=U*(t-e)+e;for(let O=0;O<=r;O++){const K=O/r,Z=K*l+o,w=Math.sin(Z),V=Math.cos(Z);E.x=D*w,E.y=-U*i+m,E.z=D*V,h.push(E.x,E.y,E.z),v.set(w,C,V).normalize(),u.push(v.x,v.y,v.z),f.push(K,1-U),b.push(x++)}S.push(b)}for(let _=0;_<r;_++)for(let b=0;b<s;b++){const U=S[b][_],D=S[b+1][_],O=S[b+1][_+1],K=S[b][_+1];(e>0||b!==0)&&(d.push(U,D,K),y+=3),(t>0||b!==s-1)&&(d.push(D,O,K),y+=3)}c.addGroup(p,y,0),p+=y}function L(v){const E=x,y=new Be,C=new z;let _=0;const b=v===!0?e:t,U=v===!0?1:-1;for(let O=1;O<=r;O++)h.push(0,m*U,0),u.push(0,U,0),f.push(.5,.5),x++;const D=x;for(let O=0;O<=r;O++){const Z=O/r*l+o,w=Math.cos(Z),V=Math.sin(Z);C.x=b*V,C.y=m*U,C.z=b*w,h.push(C.x,C.y,C.z),u.push(0,U,0),y.x=w*.5+.5,y.y=V*.5*U+.5,f.push(y.x,y.y),x++}for(let O=0;O<r;O++){const K=E+O,Z=D+O;v===!0?d.push(Z,Z+1,K):d.push(Z+1,Z,K),_+=3}c.addGroup(p,_,v===!0?1:2),p+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cl(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class wi extends Dt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,d=l+1,h=e/o,u=t/l,f=[],x=[],S=[],m=[];for(let p=0;p<d;p++){const R=p*u-a;for(let L=0;L<c;L++){const v=L*h-s;x.push(v,-R,0),S.push(0,0,1),m.push(L/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let R=0;R<o;R++){const L=R+c*p,v=R+c*(p+1),E=R+1+c*(p+1),y=R+1+c*p;f.push(L,v,y),f.push(v,E,y)}this.setIndex(f),this.setAttribute("position",new wt(x,3)),this.setAttribute("normal",new wt(S,3)),this.setAttribute("uv",new wt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new wi(e.width,e.height,e.widthSegments,e.heightSegments)}}class Ls extends Dt{constructor(e=.5,t=1,i=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:a},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],d=[];let h=e;const u=(t-e)/r,f=new z,x=new Be;for(let S=0;S<=r;S++){for(let m=0;m<=i;m++){const p=s+m/i*a;f.x=h*Math.cos(p),f.y=h*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),x.x=(f.x/t+1)/2,x.y=(f.y/t+1)/2,d.push(x.x,x.y)}h+=u}for(let S=0;S<r;S++){const m=S*(i+1);for(let p=0;p<i;p++){const R=p+m,L=R,v=R+i+1,E=R+i+2,y=R+1;o.push(L,v,y),o.push(v,E,y)}}this.setIndex(o),this.setAttribute("position",new wt(l,3)),this.setAttribute("normal",new wt(c,3)),this.setAttribute("uv",new wt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ls(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}function ir(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(ic(r))r.isRenderTargetTexture?(Ie("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(ic(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Nt(n){const e={};for(let t=0;t<n.length;t++){const i=ir(n[t]);for(const r in i)e[r]=i[r]}return e}function ic(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function mh(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Gu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:He.workingColorSpace}const gh={clone:ir,merge:Nt};var _h=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,xh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mn extends sr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=_h,this.fragmentShader=xh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ir(e.uniforms),this.uniformsGroups=mh(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Pe().setHex(r.value);break;case"v2":this.uniforms[i].value=new Be().fromArray(r.value);break;case"v3":this.uniforms[i].value=new z().fromArray(r.value);break;case"v4":this.uniforms[i].value=new ot().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ne().fromArray(r.value);break;case"m4":this.uniforms[i].value=new rt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class vh extends Mn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Mh extends sr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Pe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Pe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Io,this.normalScale=new Be(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ii,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Sh extends sr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Lf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class yh extends sr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Bs extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Pe(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class bh extends Bs{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Pe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const va=new rt,rc=new z,sc=new z;class Vu{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Be(512,512),this.mapType=Ht,this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ol,this._frameExtents=new Be(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;rc.setFromMatrixPosition(e.matrixWorld),t.position.copy(rc),sc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(sc),t.updateMatrixWorld(),va.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(va,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===Ar||t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(va)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const ss=new z,as=new pn,ln=new z;class Hu extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=hn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ss,as,ln),ln.x===1&&ln.y===1&&ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ss,as,ln.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(ss,as,ln),ln.x===1&&ln.y===1&&ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ss,as,ln.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const qn=new z,ac=new Be,oc=new Be;class Ot extends Hu{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Cs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ks*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Cs*2*Math.atan(Math.tan(Ks*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(qn.x,qn.y).multiplyScalar(-e/qn.z),qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(qn.x,qn.y).multiplyScalar(-e/qn.z)}getViewSize(e,t){return this.getViewBounds(e,ac,oc),t.subVectors(oc,ac)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ks*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Eh extends Vu{constructor(){super(new Ot(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,i=Cs*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=e.distance||t.far;(i!==t.fov||r!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=r,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class Th extends Bs{constructor(e,t,i=0,r=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.distance=i,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new Eh}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class wh extends Vu{constructor(){super(new Ot(90,1,.5,500)),this.isPointLightShadow=!0}}class lc extends Bs{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new wh}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class Wu extends Hu{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Ah extends Bs{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}const ki=-90,Gi=1;class Rh extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Ot(ki,Gi,e,t);r.layers=this.layers,this.add(r);const s=new Ot(ki,Gi,e,t);s.layers=this.layers,this.add(s);const a=new Ot(ki,Gi,e,t);a.layers=this.layers,this.add(a);const o=new Ot(ki,Gi,e,t);o.layers=this.layers,this.add(o);const l=new Ot(ki,Gi,e,t);l.layers=this.layers,this.add(l);const c=new Ot(ki,Gi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===hn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ar)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,d]=this.children,h=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,d),e.setRenderTarget(h,u,f),e.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class Ch extends Ot{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const cc=new rt;class Ph{constructor(e,t,i=0,r=1/0){this.ray=new al(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new sl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Xe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return cc.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(cc),this}intersectObject(e,t=!0,i=[]){return No(e,this,i,t),i.sort(uc),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)No(e[r],this,i,t);return i.sort(uc),i}}function uc(n,e){return n.distance-e.distance}function No(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){const s=n.children;for(let a=0,o=s.length;a<o;a++)No(s[a],e,t,!0)}}class Xu{static{Xu.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}}function dc(n,e,t,i){const r=Lh(i);switch(t){case Pu:return n*e;case Iu:return n*e/r.components*r.byteLength;case jo:return n*e/r.components*r.byteLength;case Ei:return n*e*2/r.components*r.byteLength;case el:return n*e*2/r.components*r.byteLength;case Lu:return n*e*3/r.components*r.byteLength;case rn:return n*e*4/r.components*r.byteLength;case tl:return n*e*4/r.components*r.byteLength;case ms:case gs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case _s:case xs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case no:case ro:return Math.max(n,16)*Math.max(e,8)/4;case to:case io:return Math.max(n,8)*Math.max(e,8)/2;case so:case ao:case lo:case co:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case oo:case Es:case uo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case fo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ho:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case po:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case mo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case go:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case _o:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case xo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case vo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Mo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case So:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case yo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case bo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Eo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case To:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case wo:case Ao:case Ro:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Co:case Po:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ts:case Lo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Lh(n){switch(n){case Ht:case wu:return{byteLength:1,components:1};case Tr:case Au:case Un:return{byteLength:2,components:1};case Jo:case Qo:return{byteLength:2,components:4};case vn:case Zo:case fn:return{byteLength:4,components:1};case Ru:case Cu:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:$o}}));typeof window<"u"&&(window.__THREE__?Ie("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=$o);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function qu(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Ih(n){const e=new WeakMap;function t(o,l){const c=o.array,d=o.usage,h=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,d),o.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:h}}function i(o,l,c){const d=l.array,h=l.updateRanges;if(n.bindBuffer(c,o),h.length===0)n.bufferSubData(c,0,d);else{h.sort((f,x)=>f.start-x.start);let u=0;for(let f=1;f<h.length;f++){const x=h[u],S=h[f];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++u,h[u]=S)}h.length=u+1;for(let f=0,x=h.length;f<x;f++){const S=h[f];n.bufferSubData(c,S.start*d.BYTES_PER_ELEMENT,d,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var Dh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Nh=`#ifdef USE_ALPHAHASH
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
#endif`,Uh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fh=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Oh=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bh=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,zh=`#ifdef USE_AOMAP
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
#endif`,kh=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Gh=`#ifdef USE_BATCHING
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
#endif`,Vh=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Hh=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Wh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xh=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,qh=`#ifdef USE_IRIDESCENCE
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
#endif`,Yh=`#ifdef USE_BUMPMAP
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
#endif`,$h=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Kh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Zh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Jh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Qh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,jh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,ep=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,tp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,np=`#define PI 3.141592653589793
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
} // validated`,ip=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,rp=`vec3 transformedNormal = objectNormal;
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
#endif`,sp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ap=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,op=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,lp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,cp="gl_FragColor = linearToOutputTexel( gl_FragColor );",up=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,dp=`#ifdef USE_ENVMAP
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
#endif`,fp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,hp=`#ifdef USE_ENVMAP
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
#endif`,pp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,mp=`#ifdef USE_ENVMAP
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
#endif`,gp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,_p=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,xp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Mp=`#ifdef USE_GRADIENTMAP
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
}`,Sp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,yp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,bp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ep=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Tp=`#ifdef USE_ENVMAP
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
	#endif
#endif`,wp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ap=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Rp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Cp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Pp=`PhysicalMaterial material;
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
#endif`,Lp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
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
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
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
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
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
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
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
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
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
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
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
}`,Ip=`
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
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
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
#endif`,Dp=`#if defined( RE_IndirectDiffuse )
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
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Np=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Up=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Fp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Op=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,zp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,kp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Gp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Vp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Hp=`#if defined( USE_POINTS_UV )
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
#endif`,Wp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Xp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,qp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Yp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,$p=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Kp=`#ifdef USE_MORPHTARGETS
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
#endif`,Zp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Jp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Qp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,jp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,em=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,tm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,nm=`#ifdef USE_NORMALMAP
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
#endif`,im=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,rm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,sm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,am=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,om=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,lm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,cm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,um=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,fm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,hm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,pm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,mm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
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
#endif`,gm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
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
#endif`,_m=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
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
#endif`,xm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
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
}`,vm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Mm=`#ifdef USE_SKINNING
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
#endif`,Sm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ym=`#ifdef USE_SKINNING
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
#endif`,bm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Em=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Tm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,wm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Am=`#ifdef USE_TRANSMISSION
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
#endif`,Rm=`#ifdef USE_TRANSMISSION
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
#endif`,Cm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Pm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Lm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Im=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Dm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Nm=`uniform sampler2D t2D;
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
}`,Um=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Om=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Bm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zm=`#include <common>
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
}`,km=`#if DEPTH_PACKING == 3200
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
}`,Gm=`#define DISTANCE
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
}`,Vm=`#define DISTANCE
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
}`,Hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Wm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xm=`uniform float scale;
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
}`,qm=`uniform vec3 diffuse;
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
}`,Ym=`#include <common>
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
}`,$m=`uniform vec3 diffuse;
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
}`,Km=`#define LAMBERT
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
}`,Zm=`#define LAMBERT
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
}`,Jm=`#define MATCAP
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
}`,Qm=`#define MATCAP
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
}`,jm=`#define NORMAL
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
}`,eg=`#define NORMAL
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
}`,tg=`#define PHONG
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
}`,ng=`#define PHONG
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
}`,ig=`#define STANDARD
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
}`,rg=`#define STANDARD
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
}`,sg=`#define TOON
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
}`,ag=`#define TOON
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
}`,og=`uniform float size;
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
}`,lg=`uniform vec3 diffuse;
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
}`,cg=`#include <common>
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
}`,ug=`uniform vec3 color;
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
}`,dg=`uniform float rotation;
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
}`,fg=`uniform vec3 diffuse;
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
}`,ze={alphahash_fragment:Dh,alphahash_pars_fragment:Nh,alphamap_fragment:Uh,alphamap_pars_fragment:Fh,alphatest_fragment:Oh,alphatest_pars_fragment:Bh,aomap_fragment:zh,aomap_pars_fragment:kh,batching_pars_vertex:Gh,batching_vertex:Vh,begin_vertex:Hh,beginnormal_vertex:Wh,bsdfs:Xh,iridescence_fragment:qh,bumpmap_pars_fragment:Yh,clipping_planes_fragment:$h,clipping_planes_pars_fragment:Kh,clipping_planes_pars_vertex:Zh,clipping_planes_vertex:Jh,color_fragment:Qh,color_pars_fragment:jh,color_pars_vertex:ep,color_vertex:tp,common:np,cube_uv_reflection_fragment:ip,defaultnormal_vertex:rp,displacementmap_pars_vertex:sp,displacementmap_vertex:ap,emissivemap_fragment:op,emissivemap_pars_fragment:lp,colorspace_fragment:cp,colorspace_pars_fragment:up,envmap_fragment:dp,envmap_common_pars_fragment:fp,envmap_pars_fragment:hp,envmap_pars_vertex:pp,envmap_physical_pars_fragment:Tp,envmap_vertex:mp,fog_vertex:gp,fog_pars_vertex:_p,fog_fragment:xp,fog_pars_fragment:vp,gradientmap_pars_fragment:Mp,lightmap_pars_fragment:Sp,lights_lambert_fragment:yp,lights_lambert_pars_fragment:bp,lights_pars_begin:Ep,lights_toon_fragment:wp,lights_toon_pars_fragment:Ap,lights_phong_fragment:Rp,lights_phong_pars_fragment:Cp,lights_physical_fragment:Pp,lights_physical_pars_fragment:Lp,lights_fragment_begin:Ip,lights_fragment_maps:Dp,lights_fragment_end:Np,lightprobes_pars_fragment:Up,logdepthbuf_fragment:Fp,logdepthbuf_pars_fragment:Op,logdepthbuf_pars_vertex:Bp,logdepthbuf_vertex:zp,map_fragment:kp,map_pars_fragment:Gp,map_particle_fragment:Vp,map_particle_pars_fragment:Hp,metalnessmap_fragment:Wp,metalnessmap_pars_fragment:Xp,morphinstance_vertex:qp,morphcolor_vertex:Yp,morphnormal_vertex:$p,morphtarget_pars_vertex:Kp,morphtarget_vertex:Zp,normal_fragment_begin:Jp,normal_fragment_maps:Qp,normal_pars_fragment:jp,normal_pars_vertex:em,normal_vertex:tm,normalmap_pars_fragment:nm,clearcoat_normal_fragment_begin:im,clearcoat_normal_fragment_maps:rm,clearcoat_pars_fragment:sm,iridescence_pars_fragment:am,opaque_fragment:om,packing:lm,premultiplied_alpha_fragment:cm,project_vertex:um,dithering_fragment:dm,dithering_pars_fragment:fm,roughnessmap_fragment:hm,roughnessmap_pars_fragment:pm,shadowmap_pars_fragment:mm,shadowmap_pars_vertex:gm,shadowmap_vertex:_m,shadowmask_pars_fragment:xm,skinbase_vertex:vm,skinning_pars_vertex:Mm,skinning_vertex:Sm,skinnormal_vertex:ym,specularmap_fragment:bm,specularmap_pars_fragment:Em,tonemapping_fragment:Tm,tonemapping_pars_fragment:wm,transmission_fragment:Am,transmission_pars_fragment:Rm,uv_pars_fragment:Cm,uv_pars_vertex:Pm,uv_vertex:Lm,worldpos_vertex:Im,background_vert:Dm,background_frag:Nm,backgroundCube_vert:Um,backgroundCube_frag:Fm,cube_vert:Om,cube_frag:Bm,depth_vert:zm,depth_frag:km,distance_vert:Gm,distance_frag:Vm,equirect_vert:Hm,equirect_frag:Wm,linedashed_vert:Xm,linedashed_frag:qm,meshbasic_vert:Ym,meshbasic_frag:$m,meshlambert_vert:Km,meshlambert_frag:Zm,meshmatcap_vert:Jm,meshmatcap_frag:Qm,meshnormal_vert:jm,meshnormal_frag:eg,meshphong_vert:tg,meshphong_frag:ng,meshphysical_vert:ig,meshphysical_frag:rg,meshtoon_vert:sg,meshtoon_frag:ag,points_vert:og,points_frag:lg,shadow_vert:cg,shadow_frag:ug,sprite_vert:dg,sprite_frag:fg},he={common:{diffuse:{value:new Pe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ne}},envmap:{envMap:{value:null},envMapRotation:{value:new Ne},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ne}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ne}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ne},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ne},normalScale:{value:new Be(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ne},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ne}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ne}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ne}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new z},probesMax:{value:new z},probesResolution:{value:new z}},points:{diffuse:{value:new Pe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0},uvTransform:{value:new Ne}},sprite:{diffuse:{value:new Pe(16777215)},opacity:{value:1},center:{value:new Be(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}}},un={basic:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:ze.meshbasic_vert,fragmentShader:ze.meshbasic_frag},lambert:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Pe(0)},envMapIntensity:{value:1}}]),vertexShader:ze.meshlambert_vert,fragmentShader:ze.meshlambert_frag},phong:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Pe(0)},specular:{value:new Pe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ze.meshphong_vert,fragmentShader:ze.meshphong_frag},standard:{uniforms:Nt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Pe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag},toon:{uniforms:Nt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Pe(0)}}]),vertexShader:ze.meshtoon_vert,fragmentShader:ze.meshtoon_frag},matcap:{uniforms:Nt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:ze.meshmatcap_vert,fragmentShader:ze.meshmatcap_frag},points:{uniforms:Nt([he.points,he.fog]),vertexShader:ze.points_vert,fragmentShader:ze.points_frag},dashed:{uniforms:Nt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ze.linedashed_vert,fragmentShader:ze.linedashed_frag},depth:{uniforms:Nt([he.common,he.displacementmap]),vertexShader:ze.depth_vert,fragmentShader:ze.depth_frag},normal:{uniforms:Nt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:ze.meshnormal_vert,fragmentShader:ze.meshnormal_frag},sprite:{uniforms:Nt([he.sprite,he.fog]),vertexShader:ze.sprite_vert,fragmentShader:ze.sprite_frag},background:{uniforms:{uvTransform:{value:new Ne},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ze.background_vert,fragmentShader:ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ne}},vertexShader:ze.backgroundCube_vert,fragmentShader:ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ze.cube_vert,fragmentShader:ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ze.equirect_vert,fragmentShader:ze.equirect_frag},distance:{uniforms:Nt([he.common,he.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ze.distance_vert,fragmentShader:ze.distance_frag},shadow:{uniforms:Nt([he.lights,he.fog,{color:{value:new Pe(0)},opacity:{value:1}}]),vertexShader:ze.shadow_vert,fragmentShader:ze.shadow_frag}};un.physical={uniforms:Nt([un.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ne},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ne},clearcoatNormalScale:{value:new Be(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ne},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ne},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ne},sheen:{value:0},sheenColor:{value:new Pe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ne},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ne},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ne},transmissionSamplerSize:{value:new Be},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ne},attenuationDistance:{value:0},attenuationColor:{value:new Pe(0)},specularColor:{value:new Pe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ne},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ne},anisotropyVector:{value:new Be},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ne}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag};const os={r:0,b:0,g:0},hg=new rt,Yu=new Ne;Yu.set(-1,0,0,0,1,0,0,0,1);function pg(n,e,t,i,r,s){const a=new Pe(0);let o=r===!0?0:1,l,c,d=null,h=0,u=null;function f(R){let L=R.isScene===!0?R.background:null;if(L&&L.isTexture){const v=R.backgroundBlurriness>0;L=e.get(L,v)}return L}function x(R){let L=!1;const v=f(R);v===null?m(a,o):v&&v.isColor&&(m(v,1),L=!0);const E=n.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,s):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||L)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(R,L){const v=f(L);v&&(v.isCubeTexture||v.mapping===Fs)?(c===void 0&&(c=new _t(new Dr(1,1,1),new Mn({name:"BackgroundCubeMaterial",uniforms:ir(un.backgroundCube.uniforms),vertexShader:un.backgroundCube.vertexShader,fragmentShader:un.backgroundCube.fragmentShader,side:Ut,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,y,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=L.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(hg.makeRotationFromEuler(L.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Yu),c.material.toneMapped=He.getTransfer(v.colorSpace)!==Je,(d!==v||h!==v.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,d=v,h=v.version,u=n.toneMapping),c.layers.enableAll(),R.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new _t(new wi(2,2),new Mn({name:"BackgroundMaterial",uniforms:ir(un.background.uniforms),vertexShader:un.background.vertexShader,fragmentShader:un.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=L.backgroundIntensity,l.material.toneMapped=He.getTransfer(v.colorSpace)!==Je,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(d!==v||h!==v.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,d=v,h=v.version,u=n.toneMapping),l.layers.enableAll(),R.unshift(l,l.geometry,l.material,0,0,null))}function m(R,L){R.getRGB(os,Gu(n)),t.buffers.color.setClear(os.r,os.g,os.b,L,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(R,L=1){a.set(R),o=L,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(R){o=R,m(a,o)},render:x,addToRenderList:S,dispose:p}}function mg(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null);let s=r,a=!1;function o(D,O,K,Z,w){let V=!1;const N=h(D,Z,K,O);s!==N&&(s=N,c(s.object)),V=f(D,Z,K,w),V&&x(D,Z,K,w),w!==null&&e.update(w,n.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,v(D,O,K,Z),w!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(w).buffer))}function l(){return n.createVertexArray()}function c(D){return n.bindVertexArray(D)}function d(D){return n.deleteVertexArray(D)}function h(D,O,K,Z){const w=Z.wireframe===!0;let V=i[O.id];V===void 0&&(V={},i[O.id]=V);const N=D.isInstancedMesh===!0?D.id:0;let $=V[N];$===void 0&&($={},V[N]=$);let ne=$[K.id];ne===void 0&&(ne={},$[K.id]=ne);let oe=ne[w];return oe===void 0&&(oe=u(l()),ne[w]=oe),oe}function u(D){const O=[],K=[],Z=[];for(let w=0;w<t;w++)O[w]=0,K[w]=0,Z[w]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:K,attributeDivisors:Z,object:D,attributes:{},index:null}}function f(D,O,K,Z){const w=s.attributes,V=O.attributes;let N=0;const $=K.getAttributes();for(const ne in $)if($[ne].location>=0){const ie=w[ne];let fe=V[ne];if(fe===void 0&&(ne==="instanceMatrix"&&D.instanceMatrix&&(fe=D.instanceMatrix),ne==="instanceColor"&&D.instanceColor&&(fe=D.instanceColor)),ie===void 0||ie.attribute!==fe||fe&&ie.data!==fe.data)return!0;N++}return s.attributesNum!==N||s.index!==Z}function x(D,O,K,Z){const w={},V=O.attributes;let N=0;const $=K.getAttributes();for(const ne in $)if($[ne].location>=0){let ie=V[ne];ie===void 0&&(ne==="instanceMatrix"&&D.instanceMatrix&&(ie=D.instanceMatrix),ne==="instanceColor"&&D.instanceColor&&(ie=D.instanceColor));const fe={};fe.attribute=ie,ie&&ie.data&&(fe.data=ie.data),w[ne]=fe,N++}s.attributes=w,s.attributesNum=N,s.index=Z}function S(){const D=s.newAttributes;for(let O=0,K=D.length;O<K;O++)D[O]=0}function m(D){p(D,0)}function p(D,O){const K=s.newAttributes,Z=s.enabledAttributes,w=s.attributeDivisors;K[D]=1,Z[D]===0&&(n.enableVertexAttribArray(D),Z[D]=1),w[D]!==O&&(n.vertexAttribDivisor(D,O),w[D]=O)}function R(){const D=s.newAttributes,O=s.enabledAttributes;for(let K=0,Z=O.length;K<Z;K++)O[K]!==D[K]&&(n.disableVertexAttribArray(K),O[K]=0)}function L(D,O,K,Z,w,V,N){N===!0?n.vertexAttribIPointer(D,O,K,w,V):n.vertexAttribPointer(D,O,K,Z,w,V)}function v(D,O,K,Z){S();const w=Z.attributes,V=K.getAttributes(),N=O.defaultAttributeValues;for(const $ in V){const ne=V[$];if(ne.location>=0){let oe=w[$];if(oe===void 0&&($==="instanceMatrix"&&D.instanceMatrix&&(oe=D.instanceMatrix),$==="instanceColor"&&D.instanceColor&&(oe=D.instanceColor)),oe!==void 0){const ie=oe.normalized,fe=oe.itemSize,Oe=e.get(oe);if(Oe===void 0)continue;const Ke=Oe.buffer,Te=Oe.type,Q=Oe.bytesPerElement,le=Te===n.INT||Te===n.UNSIGNED_INT||oe.gpuType===Zo;if(oe.isInterleavedBufferAttribute){const ae=oe.data,Ce=ae.stride,De=oe.offset;if(ae.isInstancedInterleavedBuffer){for(let Re=0;Re<ne.locationSize;Re++)p(ne.location+Re,ae.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let Re=0;Re<ne.locationSize;Re++)m(ne.location+Re);n.bindBuffer(n.ARRAY_BUFFER,Ke);for(let Re=0;Re<ne.locationSize;Re++)L(ne.location+Re,fe/ne.locationSize,Te,ie,Ce*Q,(De+fe/ne.locationSize*Re)*Q,le)}else{if(oe.isInstancedBufferAttribute){for(let ae=0;ae<ne.locationSize;ae++)p(ne.location+ae,oe.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let ae=0;ae<ne.locationSize;ae++)m(ne.location+ae);n.bindBuffer(n.ARRAY_BUFFER,Ke);for(let ae=0;ae<ne.locationSize;ae++)L(ne.location+ae,fe/ne.locationSize,Te,ie,fe*Q,fe/ne.locationSize*ae*Q,le)}}else if(N!==void 0){const ie=N[$];if(ie!==void 0)switch(ie.length){case 2:n.vertexAttrib2fv(ne.location,ie);break;case 3:n.vertexAttrib3fv(ne.location,ie);break;case 4:n.vertexAttrib4fv(ne.location,ie);break;default:n.vertexAttrib1fv(ne.location,ie)}}}}R()}function E(){b();for(const D in i){const O=i[D];for(const K in O){const Z=O[K];for(const w in Z){const V=Z[w];for(const N in V)d(V[N].object),delete V[N];delete Z[w]}}delete i[D]}}function y(D){if(i[D.id]===void 0)return;const O=i[D.id];for(const K in O){const Z=O[K];for(const w in Z){const V=Z[w];for(const N in V)d(V[N].object),delete V[N];delete Z[w]}}delete i[D.id]}function C(D){for(const O in i){const K=i[O];for(const Z in K){const w=K[Z];if(w[D.id]===void 0)continue;const V=w[D.id];for(const N in V)d(V[N].object),delete V[N];delete w[D.id]}}}function _(D){for(const O in i){const K=i[O],Z=D.isInstancedMesh===!0?D.id:0,w=K[Z];if(w!==void 0){for(const V in w){const N=w[V];for(const $ in N)d(N[$].object),delete N[$];delete w[V]}delete K[Z],Object.keys(K).length===0&&delete i[O]}}}function b(){U(),a=!0,s!==r&&(s=r,c(s.object))}function U(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:b,resetDefaultState:U,dispose:E,releaseStatesOfGeometry:y,releaseStatesOfObject:_,releaseStatesOfProgram:C,initAttributes:S,enableAttribute:m,disableUnusedAttributes:R}}function gg(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,d){d!==0&&(n.drawArraysInstanced(i,l,c,d),t.update(c,i,d))}function o(l,c,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,d);let u=0;for(let f=0;f<d;f++)u+=c[f];t.update(u,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function _g(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==rn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const _=C===Un&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Ht&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==fn&&!_)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const d=l(c);d!==c&&(Ie("WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);const h=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ie("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),R=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),L=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),E=n.getParameter(n.MAX_SAMPLES),y=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:R,maxVaryings:L,maxFragmentUniforms:v,maxSamples:E,samples:y}}function xg(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new Cn,o=new Ne,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){const f=h.length!==0||u||i!==0||r;return r=u,i=h.length,f},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,u){t=d(h,u,0)},this.setState=function(h,u,f){const x=h.clippingPlanes,S=h.clipIntersection,m=h.clipShadows,p=n.get(h);if(!r||x===null||x.length===0||s&&!m)s?d(null):c();else{const R=s?0:i,L=R*4;let v=p.clippingState||null;l.value=v,v=d(x,u,L,f);for(let E=0;E!==L;++E)v[E]=t[E];p.clippingState=v,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=R}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(h,u,f,x){const S=h!==null?h.length:0;let m=null;if(S!==0){if(m=l.value,x!==!0||m===null){const p=f+S*4,R=u.matrixWorldInverse;o.getNormalMatrix(R),(m===null||m.length<p)&&(m=new Float32Array(p));for(let L=0,v=f;L!==S;++L,v+=4)a.copy(h[L]).applyMatrix4(R,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}const Jn=4,fc=[.125,.215,.35,.446,.526,.582],_i=20,vg=256,hr=new Wu,hc=new Pe;let Ma=null,Sa=0,ya=0,ba=!1;const Mg=new z;class pc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=Mg}=s;Ma=this._renderer.getRenderTarget(),Sa=this._renderer.getActiveCubeFace(),ya=this._renderer.getActiveMipmapLevel(),ba=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=_c(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=gc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ma,Sa,ya),this._renderer.xr.enabled=ba,e.scissorTest=!1,Vi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===bi||e.mapping===tr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ma=this._renderer.getRenderTarget(),Sa=this._renderer.getActiveCubeFace(),ya=this._renderer.getActiveMipmapLevel(),ba=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Et,minFilter:Et,generateMipmaps:!1,type:Un,format:rn,colorSpace:ws,depthBuffer:!1},r=mc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=mc(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Sg(s)),this._blurMaterial=bg(s,e,t),this._ggxMaterial=yg(s,e,t)}return r}_compileMaterial(e){const t=new _t(new Dt,e);this._renderer.compile(t,hr)}_sceneToCubeUV(e,t,i,r,s){const l=new Ot(90,1,t,i),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(hc),h.toneMapping=gn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new _t(new Dr,new $t({name:"PMREM.Background",side:Ut,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let p=!1;const R=e.background;R?R.isColor&&(m.color.copy(R),e.background=null,p=!0):(m.color.copy(hc),p=!0);for(let L=0;L<6;L++){const v=L%3;v===0?(l.up.set(0,c[L],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+d[L],s.y,s.z)):v===1?(l.up.set(0,0,c[L]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+d[L],s.z)):(l.up.set(0,c[L],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+d[L]));const E=this._cubeSize;Vi(r,v*E,L>2?E:0,E,E),h.setRenderTarget(r),p&&h.render(S,l),h.render(e,l)}h.toneMapping=f,h.autoClear=u,e.background=R}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===bi||e.mapping===tr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=_c()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=gc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Vi(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,hr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),d=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-d*d),u=0+c*1.25,f=h*u,{_lodMax:x}=this,S=this._sizeLods[i],m=3*S*(i>x-Jn?i-x+Jn:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=x-t,Vi(s,m,p,3*S,2*S),r.setRenderTarget(s),r.render(o,hr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=x-i,Vi(e,m,p,3*S,2*S),r.setRenderTarget(e),r.render(o,hr)}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Xe("blur direction must be either latitudinal or longitudinal!");const d=3,h=this._lodMeshes[r];h.material=c;const u=c.uniforms,f=this._sizeLods[i]-1,x=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*_i-1),S=s/x,m=isFinite(s)?1+Math.floor(d*S):_i;m>_i&&Ie(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${_i}`);const p=[];let R=0;for(let C=0;C<_i;++C){const _=C/S,b=Math.exp(-_*_/2);p.push(b),C===0?R+=b:C<m&&(R+=2*b)}for(let C=0;C<p.length;C++)p[C]=p[C]/R;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=p,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:L}=this;u.dTheta.value=x,u.mipInt.value=L-i;const v=this._sizeLods[r],E=3*v*(r>L-Jn?r-L+Jn:0),y=4*(this._cubeSize-v);Vi(t,E,y,3*v,2*v),l.setRenderTarget(t),l.render(h,hr)}}function Sg(n){const e=[],t=[],i=[];let r=n;const s=n-Jn+1+fc.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let l=1/o;a>n-Jn?l=fc[a-n+Jn-1]:a===0&&(l=0),t.push(l);const c=1/(o-2),d=-c,h=1+c,u=[d,d,h,d,h,h,d,d,h,h,d,h],f=6,x=6,S=3,m=2,p=1,R=new Float32Array(S*x*f),L=new Float32Array(m*x*f),v=new Float32Array(p*x*f);for(let y=0;y<f;y++){const C=y%3*2/3-1,_=y>2?0:-1,b=[C,_,0,C+2/3,_,0,C+2/3,_+1,0,C,_,0,C+2/3,_+1,0,C,_+1,0];R.set(b,S*x*y),L.set(u,m*x*y);const U=[y,y,y,y,y,y];v.set(U,p*x*y)}const E=new Dt;E.setAttribute("position",new xt(R,S)),E.setAttribute("uv",new xt(L,m)),E.setAttribute("faceIndex",new xt(v,p)),i.push(new _t(E,null)),r>Jn&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function mc(n,e,t){const i=new _n(n,e,t);return i.texture.mapping=Fs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Vi(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function yg(n,e,t){return new Mn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:vg,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:zs(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function bg(n,e,t){const i=new Float32Array(_i),r=new z(0,1,0);return new Mn({name:"SphericalGaussianBlur",defines:{n:_i,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:zs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function gc(){return new Mn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:zs(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function _c(){return new Mn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:zs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function zs(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class $u extends _n{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new zu(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Dr(5,5,5),s=new Mn({name:"CubemapFromEquirect",uniforms:ir(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ut,blending:In});s.uniforms.tEquirect.value=t;const a=new _t(r,s),o=t.minFilter;return t.minFilter===Pn&&(t.minFilter=Et),new Rh(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function Eg(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,f=!1){return u==null?null:f?a(u):s(u)}function s(u){if(u&&u.isTexture){const f=u.mapping;if(f===qs||f===Ys)if(e.has(u)){const x=e.get(u).texture;return o(x,u.mapping)}else{const x=u.image;if(x&&x.height>0){const S=new $u(x.height);return S.fromEquirectangularTexture(n,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const f=u.mapping,x=f===qs||f===Ys,S=f===bi||f===tr;if(x||S){let m=t.get(u);const p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new pc(n)),m=x?i.fromEquirectangular(u,m):i.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const R=u.image;return x&&R&&R.height>0||S&&R&&l(R)?(i===null&&(i=new pc(n)),m=x?i.fromEquirectangular(u):i.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",d),m.texture):null}}}return u}function o(u,f){return f===qs?u.mapping=bi:f===Ys&&(u.mapping=tr),u}function l(u){let f=0;const x=6;for(let S=0;S<x;S++)u[S]!==void 0&&f++;return f===x}function c(u){const f=u.target;f.removeEventListener("dispose",c);const x=e.get(f);x!==void 0&&(e.delete(f),x.dispose())}function d(u){const f=u.target;f.removeEventListener("dispose",d);const x=t.get(f);x!==void 0&&(t.delete(f),x.dispose())}function h(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:h}}function Tg(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&Qi("WebGLRenderer: "+i+" extension not supported."),r}}}function wg(n,e,t,i){const r={},s=new WeakMap;function a(h){const u=h.target;u.index!==null&&e.remove(u.index);for(const x in u.attributes)e.remove(u.attributes[x]);u.removeEventListener("dispose",a),delete r[u.id];const f=s.get(u);f&&(e.remove(f),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(h,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function l(h){const u=h.attributes;for(const f in u)e.update(u[f],n.ARRAY_BUFFER)}function c(h){const u=[],f=h.index,x=h.attributes.position;let S=0;if(x===void 0)return;if(f!==null){const R=f.array;S=f.version;for(let L=0,v=R.length;L<v;L+=3){const E=R[L+0],y=R[L+1],C=R[L+2];u.push(E,y,y,C,C,E)}}else{const R=x.array;S=x.version;for(let L=0,v=R.length/3-1;L<v;L+=3){const E=L+0,y=L+1,C=L+2;u.push(E,y,y,C,C,E)}}const m=new(x.count>=65535?Ou:Fu)(u,1);m.version=S;const p=s.get(h);p&&e.remove(p),s.set(h,m)}function d(h){const u=s.get(h);if(u){const f=h.index;f!==null&&u.version<f.version&&c(h)}else c(h);return s.get(h)}return{get:o,update:l,getWireframeAttribute:d}}function Ag(n,e,t){let i;function r(h){i=h}let s,a;function o(h){s=h.type,a=h.bytesPerElement}function l(h,u){n.drawElements(i,u,s,h*a),t.update(u,i,1)}function c(h,u,f){f!==0&&(n.drawElementsInstanced(i,u,s,h*a,f),t.update(u,i,f))}function d(h,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,s,h,0,f);let S=0;for(let m=0;m<f;m++)S+=u[m];t.update(S,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d}function Rg(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Xe("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Cg(n,e,t){const i=new WeakMap,r=new ot;function s(a,o,l){const c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,h=d!==void 0?d.length:0;let u=i.get(o);if(u===void 0||u.count!==h){let U=function(){_.dispose(),i.delete(o),o.removeEventListener("dispose",U)};var f=U;u!==void 0&&u.texture.dispose();const x=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],R=o.morphAttributes.normal||[],L=o.morphAttributes.color||[];let v=0;x===!0&&(v=1),S===!0&&(v=2),m===!0&&(v=3);let E=o.attributes.position.count*v,y=1;E>e.maxTextureSize&&(y=Math.ceil(E/e.maxTextureSize),E=e.maxTextureSize);const C=new Float32Array(E*y*4*h),_=new Nu(C,E,y,h);_.type=fn,_.needsUpdate=!0;const b=v*4;for(let D=0;D<h;D++){const O=p[D],K=R[D],Z=L[D],w=E*y*4*D;for(let V=0;V<O.count;V++){const N=V*b;x===!0&&(r.fromBufferAttribute(O,V),C[w+N+0]=r.x,C[w+N+1]=r.y,C[w+N+2]=r.z,C[w+N+3]=0),S===!0&&(r.fromBufferAttribute(K,V),C[w+N+4]=r.x,C[w+N+5]=r.y,C[w+N+6]=r.z,C[w+N+7]=0),m===!0&&(r.fromBufferAttribute(Z,V),C[w+N+8]=r.x,C[w+N+9]=r.y,C[w+N+10]=r.z,C[w+N+11]=Z.itemSize===4?r.w:1)}}u={count:h,texture:_,size:new Be(E,y)},i.set(o,u),o.addEventListener("dispose",U)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let x=0;for(let m=0;m<c.length;m++)x+=c[m];const S=o.morphTargetsRelative?1:1-x;l.getUniforms().setValue(n,"morphTargetBaseInfluence",S),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:s}}function Pg(n,e,t,i,r){let s=new WeakMap;function a(c){const d=r.render.frame,h=c.geometry,u=e.get(c,h);if(s.get(u)!==d&&(e.update(u),s.set(u,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==d&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,d))),c.isSkinnedMesh){const f=c.skeleton;s.get(f)!==d&&(f.update(),s.set(f,d))}return u}function o(){s=new WeakMap}function l(c){const d=c.target;d.removeEventListener("dispose",l),i.releaseStatesOfObject(d),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:a,dispose:o}}const Lg={[vu]:"LINEAR_TONE_MAPPING",[Mu]:"REINHARD_TONE_MAPPING",[Su]:"CINEON_TONE_MAPPING",[Ko]:"ACES_FILMIC_TONE_MAPPING",[bu]:"AGX_TONE_MAPPING",[Eu]:"NEUTRAL_TONE_MAPPING",[yu]:"CUSTOM_TONE_MAPPING"};function Ig(n,e,t,i,r,s){const a=new _n(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new nr(e,t):void 0}),o=new _n(e,t,{type:Un,depthBuffer:!1,stencilBuffer:!1}),l=new Dt;l.setAttribute("position",new wt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new wt([0,2,0,0,2,0],2));const c=new vh({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new _t(l,c),h=new Wu(-1,1,1,-1,0,1);let u=null,f=null,x=!1,S,m=null,p=[],R=!1;this.setSize=function(L,v){a.setSize(L,v),o.setSize(L,v);for(let E=0;E<p.length;E++){const y=p[E];y.setSize&&y.setSize(L,v)}},this.setEffects=function(L){p=L,R=p.length>0&&p[0].isRenderPass===!0;const v=a.width,E=a.height;for(let y=0;y<p.length;y++){const C=p[y];C.setSize&&C.setSize(v,E)}},this.begin=function(L,v){if(x||L.toneMapping===gn&&p.length===0)return!1;if(m=v,v!==null){const E=v.width,y=v.height;(a.width!==E||a.height!==y)&&this.setSize(E,y)}return R===!1&&L.setRenderTarget(a),S=L.toneMapping,L.toneMapping=gn,!0},this.hasRenderPass=function(){return R},this.end=function(L,v){L.toneMapping=S,x=!0;let E=a,y=o;for(let C=0;C<p.length;C++){const _=p[C];if(_.enabled!==!1&&(_.render(L,y,E,v),_.needsSwap!==!1)){const b=E;E=y,y=b}}if(u!==L.outputColorSpace||f!==L.toneMapping){u=L.outputColorSpace,f=L.toneMapping,c.defines={},He.getTransfer(u)===Je&&(c.defines.SRGB_TRANSFER="");const C=Lg[f];C&&(c.defines[C]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=E.texture,L.setRenderTarget(m),L.render(d,h),m=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}const Ku=new Rt,Uo=new nr(1,1),Zu=new Nu,Ju=new Zf,Qu=new zu,xc=[],vc=[],Mc=new Float32Array(16),Sc=new Float32Array(9),yc=new Float32Array(4);function ar(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=xc[r];if(s===void 0&&(s=new Float32Array(r),xc[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Mt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function St(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function ks(n,e){let t=vc[e];t===void 0&&(t=new Int32Array(e),vc[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Dg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Ng(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2fv(this.addr,e),St(t,e)}}function Ug(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;n.uniform3fv(this.addr,e),St(t,e)}}function Fg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4fv(this.addr,e),St(t,e)}}function Og(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;yc.set(i),n.uniformMatrix2fv(this.addr,!1,yc),St(t,i)}}function Bg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;Sc.set(i),n.uniformMatrix3fv(this.addr,!1,Sc),St(t,i)}}function zg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;Mc.set(i),n.uniformMatrix4fv(this.addr,!1,Mc),St(t,i)}}function kg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Gg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2iv(this.addr,e),St(t,e)}}function Vg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3iv(this.addr,e),St(t,e)}}function Hg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4iv(this.addr,e),St(t,e)}}function Wg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Xg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2uiv(this.addr,e),St(t,e)}}function qg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3uiv(this.addr,e),St(t,e)}}function Yg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4uiv(this.addr,e),St(t,e)}}function $g(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Uo.compareFunction=t.isReversedDepthBuffer()?il:nl,s=Uo):s=Ku,t.setTexture2D(e||s,r)}function Kg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Ju,r)}function Zg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Qu,r)}function Jg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Zu,r)}function Qg(n){switch(n){case 5126:return Dg;case 35664:return Ng;case 35665:return Ug;case 35666:return Fg;case 35674:return Og;case 35675:return Bg;case 35676:return zg;case 5124:case 35670:return kg;case 35667:case 35671:return Gg;case 35668:case 35672:return Vg;case 35669:case 35673:return Hg;case 5125:return Wg;case 36294:return Xg;case 36295:return qg;case 36296:return Yg;case 35678:case 36198:case 36298:case 36306:case 35682:return $g;case 35679:case 36299:case 36307:return Kg;case 35680:case 36300:case 36308:case 36293:return Zg;case 36289:case 36303:case 36311:case 36292:return Jg}}function jg(n,e){n.uniform1fv(this.addr,e)}function e0(n,e){const t=ar(e,this.size,2);n.uniform2fv(this.addr,t)}function t0(n,e){const t=ar(e,this.size,3);n.uniform3fv(this.addr,t)}function n0(n,e){const t=ar(e,this.size,4);n.uniform4fv(this.addr,t)}function i0(n,e){const t=ar(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function r0(n,e){const t=ar(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function s0(n,e){const t=ar(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function a0(n,e){n.uniform1iv(this.addr,e)}function o0(n,e){n.uniform2iv(this.addr,e)}function l0(n,e){n.uniform3iv(this.addr,e)}function c0(n,e){n.uniform4iv(this.addr,e)}function u0(n,e){n.uniform1uiv(this.addr,e)}function d0(n,e){n.uniform2uiv(this.addr,e)}function f0(n,e){n.uniform3uiv(this.addr,e)}function h0(n,e){n.uniform4uiv(this.addr,e)}function p0(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Uo:a=Ku;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function m0(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Ju,s[a])}function g0(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Qu,s[a])}function _0(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Zu,s[a])}function x0(n){switch(n){case 5126:return jg;case 35664:return e0;case 35665:return t0;case 35666:return n0;case 35674:return i0;case 35675:return r0;case 35676:return s0;case 5124:case 35670:return a0;case 35667:case 35671:return o0;case 35668:case 35672:return l0;case 35669:case 35673:return c0;case 5125:return u0;case 36294:return d0;case 36295:return f0;case 36296:return h0;case 35678:case 36198:case 36298:case 36306:case 35682:return p0;case 35679:case 36299:case 36307:return m0;case 35680:case 36300:case 36308:case 36293:return g0;case 36289:case 36303:case 36311:case 36292:return _0}}class v0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Qg(t.type)}}class M0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=x0(t.type)}}class S0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const Ea=/(\w+)(\])?(\[|\.)?/g;function bc(n,e){n.seq.push(e),n.map[e.id]=e}function y0(n,e,t){const i=n.name,r=i.length;for(Ea.lastIndex=0;;){const s=Ea.exec(i),a=Ea.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){bc(t,c===void 0?new v0(o,n,e):new M0(o,n,e));break}else{let h=t.map[o];h===void 0&&(h=new S0(o),bc(t,h)),t=h}}}class vs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);y0(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function Ec(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const b0=37297;let E0=0;function T0(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const Tc=new Ne;function w0(n){He._getMatrix(Tc,He.workingColorSpace,n);const e=`mat3( ${Tc.elements.map(t=>t.toFixed(4))} )`;switch(He.getTransfer(n)){case As:return[e,"LinearTransferOETF"];case Je:return[e,"sRGBTransferOETF"];default:return Ie("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function wc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+T0(n.getShaderSource(e),o)}else return s}function A0(n,e){const t=w0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const R0={[vu]:"Linear",[Mu]:"Reinhard",[Su]:"Cineon",[Ko]:"ACESFilmic",[bu]:"AgX",[Eu]:"Neutral",[yu]:"Custom"};function C0(n,e){const t=R0[e];return t===void 0?(Ie("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const ls=new z;function P0(){He.getLuminanceCoefficients(ls);const n=ls.x.toFixed(4),e=ls.y.toFixed(4),t=ls.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function L0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Sr).join(`
`)}function I0(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function D0(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Sr(n){return n!==""}function Ac(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Rc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const N0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fo(n){return n.replace(N0,F0)}const U0=new Map;function F0(n,e){let t=ze[e];if(t===void 0){const i=U0.get(e);if(i!==void 0)t=ze[i],Ie('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Fo(t)}const O0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Cc(n){return n.replace(O0,B0)}function B0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Pc(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const z0={[ps]:"SHADOWMAP_TYPE_PCF",[Mr]:"SHADOWMAP_TYPE_VSM"};function k0(n){return z0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const G0={[bi]:"ENVMAP_TYPE_CUBE",[tr]:"ENVMAP_TYPE_CUBE",[Fs]:"ENVMAP_TYPE_CUBE_UV"};function V0(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":G0[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const H0={[tr]:"ENVMAP_MODE_REFRACTION"};function W0(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":H0[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const X0={[xu]:"ENVMAP_BLENDING_MULTIPLY",[Rf]:"ENVMAP_BLENDING_MIX",[Cf]:"ENVMAP_BLENDING_ADD"};function q0(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":X0[n.combine]||"ENVMAP_BLENDING_NONE"}function Y0(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function $0(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=k0(t),c=V0(t),d=W0(t),h=q0(t),u=Y0(t),f=L0(t),x=I0(s),S=r.createProgram();let m,p,R=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Sr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Sr).join(`
`),p.length>0&&(p+=`
`)):(m=[Pc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Sr).join(`
`),p=[Pc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+h:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==gn?"#define TONE_MAPPING":"",t.toneMapping!==gn?ze.tonemapping_pars_fragment:"",t.toneMapping!==gn?C0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ze.colorspace_pars_fragment,A0("linearToOutputTexel",t.outputColorSpace),P0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Sr).join(`
`)),a=Fo(a),a=Ac(a,t),a=Rc(a,t),o=Fo(o),o=Ac(o,t),o=Rc(o,t),a=Cc(a),o=Cc(o),t.isRawShaderMaterial!==!0&&(R=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Bl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Bl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const L=R+m+a,v=R+p+o,E=Ec(r,r.VERTEX_SHADER,L),y=Ec(r,r.FRAGMENT_SHADER,v);r.attachShader(S,E),r.attachShader(S,y),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function C(D){if(n.debug.checkShaderErrors){const O=r.getProgramInfoLog(S)||"",K=r.getShaderInfoLog(E)||"",Z=r.getShaderInfoLog(y)||"",w=O.trim(),V=K.trim(),N=Z.trim();let $=!0,ne=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if($=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,E,y);else{const oe=wc(r,E,"vertex"),ie=wc(r,y,"fragment");Xe("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+w+`
`+oe+`
`+ie)}else w!==""?Ie("WebGLProgram: Program Info Log:",w):(V===""||N==="")&&(ne=!1);ne&&(D.diagnostics={runnable:$,programLog:w,vertexShader:{log:V,prefix:m},fragmentShader:{log:N,prefix:p}})}r.deleteShader(E),r.deleteShader(y),_=new vs(r,S),b=D0(r,S)}let _;this.getUniforms=function(){return _===void 0&&C(this),_};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=r.getProgramParameter(S,b0)),U},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=E0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=E,this.fragmentShader=y,this}let K0=0;class Z0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new J0(e),t.set(e,i)),i}}class J0{constructor(e){this.id=K0++,this.code=e,this.usedTimes=0}}function Q0(n){return n===Ei||n===Es||n===Ts}function j0(n,e,t,i,r,s){const a=new sl,o=new Z0,l=new Set,c=[],d=new Map,h=i.logarithmicDepthBuffer;let u=i.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,b,U,D,O,K){const Z=D.fog,w=O.geometry,V=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?D.environment:null,N=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,$=e.get(_.envMap||V,N),ne=$&&$.mapping===Fs?$.image.height:null,oe=f[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&Ie("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));const ie=w.morphAttributes.position||w.morphAttributes.normal||w.morphAttributes.color,fe=ie!==void 0?ie.length:0;let Oe=0;w.morphAttributes.position!==void 0&&(Oe=1),w.morphAttributes.normal!==void 0&&(Oe=2),w.morphAttributes.color!==void 0&&(Oe=3);let Ke,Te,Q,le;if(oe){const Se=un[oe];Ke=Se.vertexShader,Te=Se.fragmentShader}else{Ke=_.vertexShader,Te=_.fragmentShader;const Se=o.getVertexShaderStage(_),ct=o.getFragmentShaderStage(_);o.update(_,Se,ct),Q=Se.id,le=ct.id}const ae=n.getRenderTarget(),Ce=n.state.buffers.depth.getReversed(),De=O.isInstancedMesh===!0,Re=O.isBatchedMesh===!0,at=!!_.map,Ge=!!_.matcap,Ze=!!$,qe=!!_.aoMap,Ve=!!_.lightMap,lt=!!_.bumpMap&&_.wireframe===!1,ft=!!_.normalMap,mt=!!_.displacementMap,vt=!!_.emissiveMap,tt=!!_.metalnessMap,Ue=!!_.roughnessMap,B=_.anisotropy>0,Ct=_.clearcoat>0,Ye=_.dispersion>0,T=_.iridescence>0,g=_.sheen>0,G=_.transmission>0,H=B&&!!_.anisotropyMap,J=Ct&&!!_.clearcoatMap,ce=Ct&&!!_.clearcoatNormalMap,A=Ct&&!!_.clearcoatRoughnessMap,P=T&&!!_.iridescenceMap,I=T&&!!_.iridescenceThicknessMap,W=g&&!!_.sheenColorMap,re=g&&!!_.sheenRoughnessMap,j=!!_.specularMap,te=!!_.specularColorMap,_e=!!_.specularIntensityMap,ve=G&&!!_.transmissionMap,be=G&&!!_.thicknessMap,F=!!_.gradientMap,ue=!!_.alphaMap,ee=_.alphaTest>0,de=!!_.alphaHash,pe=!!_.extensions;let se=gn;_.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(se=n.toneMapping);const Ee={shaderID:oe,shaderType:_.type,shaderName:_.name,vertexShader:Ke,fragmentShader:Te,defines:_.defines,customVertexShaderID:Q,customFragmentShaderID:le,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:Re,batchingColor:Re&&O._colorsTexture!==null,instancing:De,instancingColor:De&&O.instanceColor!==null,instancingMorph:De&&O.morphTexture!==null,outputColorSpace:ae===null?n.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:He.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:at,matcap:Ge,envMap:Ze,envMapMode:Ze&&$.mapping,envMapCubeUVHeight:ne,aoMap:qe,lightMap:Ve,bumpMap:lt,normalMap:ft,displacementMap:mt,emissiveMap:vt,normalMapObjectSpace:ft&&_.normalMapType===If,normalMapTangentSpace:ft&&_.normalMapType===Io,packedNormalMap:ft&&_.normalMapType===Io&&Q0(_.normalMap.format),metalnessMap:tt,roughnessMap:Ue,anisotropy:B,anisotropyMap:H,clearcoat:Ct,clearcoatMap:J,clearcoatNormalMap:ce,clearcoatRoughnessMap:A,dispersion:Ye,iridescence:T,iridescenceMap:P,iridescenceThicknessMap:I,sheen:g,sheenColorMap:W,sheenRoughnessMap:re,specularMap:j,specularColorMap:te,specularIntensityMap:_e,transmission:G,transmissionMap:ve,thicknessMap:be,gradientMap:F,opaque:_.transparent===!1&&_.blending===Ji&&_.alphaToCoverage===!1,alphaMap:ue,alphaTest:ee,alphaHash:de,combine:_.combine,mapUv:at&&x(_.map.channel),aoMapUv:qe&&x(_.aoMap.channel),lightMapUv:Ve&&x(_.lightMap.channel),bumpMapUv:lt&&x(_.bumpMap.channel),normalMapUv:ft&&x(_.normalMap.channel),displacementMapUv:mt&&x(_.displacementMap.channel),emissiveMapUv:vt&&x(_.emissiveMap.channel),metalnessMapUv:tt&&x(_.metalnessMap.channel),roughnessMapUv:Ue&&x(_.roughnessMap.channel),anisotropyMapUv:H&&x(_.anisotropyMap.channel),clearcoatMapUv:J&&x(_.clearcoatMap.channel),clearcoatNormalMapUv:ce&&x(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:A&&x(_.clearcoatRoughnessMap.channel),iridescenceMapUv:P&&x(_.iridescenceMap.channel),iridescenceThicknessMapUv:I&&x(_.iridescenceThicknessMap.channel),sheenColorMapUv:W&&x(_.sheenColorMap.channel),sheenRoughnessMapUv:re&&x(_.sheenRoughnessMap.channel),specularMapUv:j&&x(_.specularMap.channel),specularColorMapUv:te&&x(_.specularColorMap.channel),specularIntensityMapUv:_e&&x(_.specularIntensityMap.channel),transmissionMapUv:ve&&x(_.transmissionMap.channel),thicknessMapUv:be&&x(_.thicknessMap.channel),alphaMapUv:ue&&x(_.alphaMap.channel),vertexTangents:!!w.attributes.tangent&&(ft||B),vertexNormals:!!w.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!w.attributes.color&&w.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!w.attributes.uv&&(at||ue),fog:!!Z,useFog:_.fog===!0,fogExp2:!!Z&&Z.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||w.attributes.normal===void 0&&ft===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:Ce,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:w.attributes.position!==void 0,morphTargets:w.morphAttributes.position!==void 0,morphNormals:w.morphAttributes.normal!==void 0,morphColors:w.morphAttributes.color!==void 0,morphTargetsCount:fe,morphTextureStride:Oe,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:K.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&U.length>0,shadowMapType:n.shadowMap.type,toneMapping:se,decodeVideoTexture:at&&_.map.isVideoTexture===!0&&He.getTransfer(_.map.colorSpace)===Je,decodeVideoTextureEmissive:vt&&_.emissiveMap.isVideoTexture===!0&&He.getTransfer(_.emissiveMap.colorSpace)===Je,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Vt,flipSided:_.side===Ut,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:pe&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(pe&&_.extensions.multiDraw===!0||Re)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Ee.vertexUv1s=l.has(1),Ee.vertexUv2s=l.has(2),Ee.vertexUv3s=l.has(3),l.clear(),Ee}function m(_){const b=[];if(_.shaderID?b.push(_.shaderID):(b.push(_.customVertexShaderID),b.push(_.customFragmentShaderID)),_.defines!==void 0)for(const U in _.defines)b.push(U),b.push(_.defines[U]);return _.isRawShaderMaterial===!1&&(p(b,_),R(b,_),b.push(n.outputColorSpace)),b.push(_.customProgramCacheKey),b.join()}function p(_,b){_.push(b.precision),_.push(b.outputColorSpace),_.push(b.envMapMode),_.push(b.envMapCubeUVHeight),_.push(b.mapUv),_.push(b.alphaMapUv),_.push(b.lightMapUv),_.push(b.aoMapUv),_.push(b.bumpMapUv),_.push(b.normalMapUv),_.push(b.displacementMapUv),_.push(b.emissiveMapUv),_.push(b.metalnessMapUv),_.push(b.roughnessMapUv),_.push(b.anisotropyMapUv),_.push(b.clearcoatMapUv),_.push(b.clearcoatNormalMapUv),_.push(b.clearcoatRoughnessMapUv),_.push(b.iridescenceMapUv),_.push(b.iridescenceThicknessMapUv),_.push(b.sheenColorMapUv),_.push(b.sheenRoughnessMapUv),_.push(b.specularMapUv),_.push(b.specularColorMapUv),_.push(b.specularIntensityMapUv),_.push(b.transmissionMapUv),_.push(b.thicknessMapUv),_.push(b.combine),_.push(b.fogExp2),_.push(b.sizeAttenuation),_.push(b.morphTargetsCount),_.push(b.morphAttributeCount),_.push(b.numDirLights),_.push(b.numPointLights),_.push(b.numSpotLights),_.push(b.numSpotLightMaps),_.push(b.numHemiLights),_.push(b.numRectAreaLights),_.push(b.numDirLightShadows),_.push(b.numPointLightShadows),_.push(b.numSpotLightShadows),_.push(b.numSpotLightShadowsWithMaps),_.push(b.numLightProbes),_.push(b.shadowMapType),_.push(b.toneMapping),_.push(b.numClippingPlanes),_.push(b.numClipIntersection),_.push(b.depthPacking)}function R(_,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function L(_){const b=f[_.type];let U;if(b){const D=un[b];U=gh.clone(D.uniforms)}else U=_.uniforms;return U}function v(_,b){let U=d.get(b);return U!==void 0?++U.usedTimes:(U=new $0(n,b,_,r),c.push(U),d.set(b,U)),U}function E(_){if(--_.usedTimes===0){const b=c.indexOf(_);c[b]=c[c.length-1],c.pop(),d.delete(_.cacheKey),_.destroy()}}function y(_){o.remove(_)}function C(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:L,acquireProgram:v,releaseProgram:E,releaseShaderCache:y,programs:c,dispose:C}}function e_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function t_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Lc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ic(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,x,S,m,p){let R=n[e];return R===void 0?(R={id:u.id,object:u,geometry:f,material:x,materialVariant:a(u),groupOrder:S,renderOrder:u.renderOrder,z:m,group:p},n[e]=R):(R.id=u.id,R.object=u,R.geometry=f,R.material=x,R.materialVariant=a(u),R.groupOrder=S,R.renderOrder=u.renderOrder,R.z=m,R.group=p),e++,R}function l(u,f,x,S,m,p){const R=o(u,f,x,S,m,p);x.transmission>0?i.push(R):x.transparent===!0?r.push(R):t.push(R)}function c(u,f,x,S,m,p){const R=o(u,f,x,S,m,p);x.transmission>0?i.unshift(R):x.transparent===!0?r.unshift(R):t.unshift(R)}function d(u,f,x){t.length>1&&t.sort(u||t_),i.length>1&&i.sort(f||Lc),r.length>1&&r.sort(f||Lc),x&&(t.reverse(),i.reverse(),r.reverse())}function h(){for(let u=e,f=n.length;u<f;u++){const x=n[u];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:h,sort:d}}function n_(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new Ic,n.set(i,[a])):r>=s.length?(a=new Ic,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function i_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Pe};break;case"SpotLight":t={position:new z,direction:new z,color:new Pe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Pe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Pe,groundColor:new Pe};break;case"RectAreaLight":t={color:new Pe,position:new z,halfWidth:new z,halfHeight:new z};break}return n[e.id]=t,t}}}function r_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let s_=0;function a_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function o_(n){const e=new i_,t=r_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);const r=new z,s=new rt,a=new rt;function o(c){let d=0,h=0,u=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let f=0,x=0,S=0,m=0,p=0,R=0,L=0,v=0,E=0,y=0,C=0;c.sort(a_);for(let b=0,U=c.length;b<U;b++){const D=c[b],O=D.color,K=D.intensity,Z=D.distance;let w=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===Ei?w=D.shadow.map.texture:w=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)d+=O.r*K,h+=O.g*K,u+=O.b*K;else if(D.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(D.sh.coefficients[V],K);C++}else if(D.isDirectionalLight){const V=e.get(D);if(V.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const N=D.shadow,$=t.get(D);$.shadowIntensity=N.intensity,$.shadowBias=N.bias,$.shadowNormalBias=N.normalBias,$.shadowRadius=N.radius,$.shadowMapSize=N.mapSize,i.directionalShadow[f]=$,i.directionalShadowMap[f]=w,i.directionalShadowMatrix[f]=D.shadow.matrix,R++}i.directional[f]=V,f++}else if(D.isSpotLight){const V=e.get(D);V.position.setFromMatrixPosition(D.matrixWorld),V.color.copy(O).multiplyScalar(K),V.distance=Z,V.coneCos=Math.cos(D.angle),V.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),V.decay=D.decay,i.spot[S]=V;const N=D.shadow;if(D.map&&(i.spotLightMap[E]=D.map,E++,N.updateMatrices(D),D.castShadow&&y++),i.spotLightMatrix[S]=N.matrix,D.castShadow){const $=t.get(D);$.shadowIntensity=N.intensity,$.shadowBias=N.bias,$.shadowNormalBias=N.normalBias,$.shadowRadius=N.radius,$.shadowMapSize=N.mapSize,i.spotShadow[S]=$,i.spotShadowMap[S]=w,v++}S++}else if(D.isRectAreaLight){const V=e.get(D);V.color.copy(O).multiplyScalar(K),V.halfWidth.set(D.width*.5,0,0),V.halfHeight.set(0,D.height*.5,0),i.rectArea[m]=V,m++}else if(D.isPointLight){const V=e.get(D);if(V.color.copy(D.color).multiplyScalar(D.intensity),V.distance=D.distance,V.decay=D.decay,D.castShadow){const N=D.shadow,$=t.get(D);$.shadowIntensity=N.intensity,$.shadowBias=N.bias,$.shadowNormalBias=N.normalBias,$.shadowRadius=N.radius,$.shadowMapSize=N.mapSize,$.shadowCameraNear=N.camera.near,$.shadowCameraFar=N.camera.far,i.pointShadow[x]=$,i.pointShadowMap[x]=w,i.pointShadowMatrix[x]=D.shadow.matrix,L++}i.point[x]=V,x++}else if(D.isHemisphereLight){const V=e.get(D);V.skyColor.copy(D.color).multiplyScalar(K),V.groundColor.copy(D.groundColor).multiplyScalar(K),i.hemi[p]=V,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=he.LTC_FLOAT_1,i.rectAreaLTC2=he.LTC_FLOAT_2):(i.rectAreaLTC1=he.LTC_HALF_1,i.rectAreaLTC2=he.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=h,i.ambient[2]=u;const _=i.hash;(_.directionalLength!==f||_.pointLength!==x||_.spotLength!==S||_.rectAreaLength!==m||_.hemiLength!==p||_.numDirectionalShadows!==R||_.numPointShadows!==L||_.numSpotShadows!==v||_.numSpotMaps!==E||_.numLightProbes!==C)&&(i.directional.length=f,i.spot.length=S,i.rectArea.length=m,i.point.length=x,i.hemi.length=p,i.directionalShadow.length=R,i.directionalShadowMap.length=R,i.pointShadow.length=L,i.pointShadowMap.length=L,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=R,i.pointShadowMatrix.length=L,i.spotLightMatrix.length=v+E-y,i.spotLightMap.length=E,i.numSpotLightShadowsWithMaps=y,i.numLightProbes=C,_.directionalLength=f,_.pointLength=x,_.spotLength=S,_.rectAreaLength=m,_.hemiLength=p,_.numDirectionalShadows=R,_.numPointShadows=L,_.numSpotShadows=v,_.numSpotMaps=E,_.numLightProbes=C,i.version=s_++)}function l(c,d){let h=0,u=0,f=0,x=0,S=0;const m=d.matrixWorldInverse;for(let p=0,R=c.length;p<R;p++){const L=c[p];if(L.isDirectionalLight){const v=i.directional[h];v.direction.setFromMatrixPosition(L.matrixWorld),r.setFromMatrixPosition(L.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(m),h++}else if(L.isSpotLight){const v=i.spot[f];v.position.setFromMatrixPosition(L.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(L.matrixWorld),r.setFromMatrixPosition(L.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(m),f++}else if(L.isRectAreaLight){const v=i.rectArea[x];v.position.setFromMatrixPosition(L.matrixWorld),v.position.applyMatrix4(m),a.identity(),s.copy(L.matrixWorld),s.premultiply(m),a.extractRotation(s),v.halfWidth.set(L.width*.5,0,0),v.halfHeight.set(0,L.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),x++}else if(L.isPointLight){const v=i.point[u];v.position.setFromMatrixPosition(L.matrixWorld),v.position.applyMatrix4(m),u++}else if(L.isHemisphereLight){const v=i.hemi[S];v.direction.setFromMatrixPosition(L.matrixWorld),v.direction.transformDirection(m),S++}}}return{setup:o,setupView:l,state:i}}function Dc(n){const e=new o_(n),t=[],i=[],r=[];function s(u){h.camera=u,t.length=0,i.length=0,r.length=0}function a(u){t.push(u)}function o(u){i.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function d(u){e.setupView(t,u)}const h={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:h,setupLights:c,setupLightsView:d,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function l_(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Dc(n),e.set(r,[o])):s>=a.length?(o=new Dc(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const c_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,u_=`uniform sampler2D shadow_pass;
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
}`,d_=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],f_=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],Nc=new rt,pr=new z,Ta=new z;function h_(n,e,t){let i=new ol;const r=new Be,s=new Be,a=new ot,o=new Sh,l=new yh,c={},d=t.maxTextureSize,h={[ti]:Ut,[Ut]:ti,[Vt]:Vt},u=new Mn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Be},radius:{value:4}},vertexShader:c_,fragmentShader:u_}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const x=new Dt;x.setAttribute("position",new xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new _t(x,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ps;let p=this.type;this.render=function(y,C,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||y.length===0)return;this.type===cf&&(Ie("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ps);const b=n.getRenderTarget(),U=n.getActiveCubeFace(),D=n.getActiveMipmapLevel(),O=n.state;O.setBlending(In),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const K=p!==this.type;K&&C.traverse(function(Z){Z.material&&(Array.isArray(Z.material)?Z.material.forEach(w=>w.needsUpdate=!0):Z.material.needsUpdate=!0)});for(let Z=0,w=y.length;Z<w;Z++){const V=y[Z],N=V.shadow;if(N===void 0){Ie("WebGLShadowMap:",V,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;r.copy(N.mapSize);const $=N.getFrameExtents();r.multiply($),s.copy(N.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/$.x),r.x=s.x*$.x,N.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/$.y),r.y=s.y*$.y,N.mapSize.y=s.y));const ne=n.state.buffers.depth.getReversed();if(N.camera._reversedDepth=ne,N.map===null||K===!0){if(N.map!==null&&(N.map.depthTexture!==null&&(N.map.depthTexture.dispose(),N.map.depthTexture=null),N.map.dispose()),this.type===Mr){if(V.isPointLight){Ie("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}N.map=new _n(r.x,r.y,{format:Ei,type:Un,minFilter:Et,magFilter:Et,generateMipmaps:!1}),N.map.texture.name=V.name+".shadowMap",N.map.depthTexture=new nr(r.x,r.y,fn),N.map.depthTexture.name=V.name+".shadowMapDepth",N.map.depthTexture.format=Fn,N.map.depthTexture.compareFunction=null,N.map.depthTexture.minFilter=At,N.map.depthTexture.magFilter=At}else V.isPointLight?(N.map=new $u(r.x),N.map.depthTexture=new ph(r.x,vn)):(N.map=new _n(r.x,r.y),N.map.depthTexture=new nr(r.x,r.y,vn)),N.map.depthTexture.name=V.name+".shadowMap",N.map.depthTexture.format=Fn,this.type===ps?(N.map.depthTexture.compareFunction=ne?il:nl,N.map.depthTexture.minFilter=Et,N.map.depthTexture.magFilter=Et):(N.map.depthTexture.compareFunction=null,N.map.depthTexture.minFilter=At,N.map.depthTexture.magFilter=At);N.camera.updateProjectionMatrix()}const oe=N.map.isWebGLCubeRenderTarget?6:1;for(let ie=0;ie<oe;ie++){if(N.map.isWebGLCubeRenderTarget)n.setRenderTarget(N.map,ie),n.clear();else{ie===0&&(n.setRenderTarget(N.map),n.clear());const fe=N.getViewport(ie);a.set(s.x*fe.x,s.y*fe.y,s.x*fe.z,s.y*fe.w),O.viewport(a)}if(V.isPointLight){const fe=N.camera,Oe=N.matrix,Ke=V.distance||fe.far;Ke!==fe.far&&(fe.far=Ke,fe.updateProjectionMatrix()),pr.setFromMatrixPosition(V.matrixWorld),fe.position.copy(pr),Ta.copy(fe.position),Ta.add(d_[ie]),fe.up.copy(f_[ie]),fe.lookAt(Ta),fe.updateMatrixWorld(),Oe.makeTranslation(-pr.x,-pr.y,-pr.z),Nc.multiplyMatrices(fe.projectionMatrix,fe.matrixWorldInverse),N._frustum.setFromProjectionMatrix(Nc,fe.coordinateSystem,fe.reversedDepth)}else N.updateMatrices(V);i=N.getFrustum(),v(C,_,N.camera,V,this.type)}N.isPointLightShadow!==!0&&this.type===Mr&&R(N,_),N.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(b,U,D)};function R(y,C){const _=e.update(S);u.defines.VSM_SAMPLES!==y.blurSamples&&(u.defines.VSM_SAMPLES=y.blurSamples,f.defines.VSM_SAMPLES=y.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),y.mapPass===null&&(y.mapPass=new _n(r.x,r.y,{format:Ei,type:Un})),u.uniforms.shadow_pass.value=y.map.depthTexture,u.uniforms.resolution.value=y.mapSize,u.uniforms.radius.value=y.radius,n.setRenderTarget(y.mapPass),n.clear(),n.renderBufferDirect(C,null,_,u,S,null),f.uniforms.shadow_pass.value=y.mapPass.texture,f.uniforms.resolution.value=y.mapSize,f.uniforms.radius.value=y.radius,n.setRenderTarget(y.map),n.clear(),n.renderBufferDirect(C,null,_,f,S,null)}function L(y,C,_,b){let U=null;const D=_.isPointLight===!0?y.customDistanceMaterial:y.customDepthMaterial;if(D!==void 0)U=D;else if(U=_.isPointLight===!0?l:o,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){const O=U.uuid,K=C.uuid;let Z=c[O];Z===void 0&&(Z={},c[O]=Z);let w=Z[K];w===void 0&&(w=U.clone(),Z[K]=w,C.addEventListener("dispose",E)),U=w}if(U.visible=C.visible,U.wireframe=C.wireframe,b===Mr?U.side=C.shadowSide!==null?C.shadowSide:C.side:U.side=C.shadowSide!==null?C.shadowSide:h[C.side],U.alphaMap=C.alphaMap,U.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,U.map=C.map,U.clipShadows=C.clipShadows,U.clippingPlanes=C.clippingPlanes,U.clipIntersection=C.clipIntersection,U.displacementMap=C.displacementMap,U.displacementScale=C.displacementScale,U.displacementBias=C.displacementBias,U.wireframeLinewidth=C.wireframeLinewidth,U.linewidth=C.linewidth,_.isPointLight===!0&&U.isMeshDistanceMaterial===!0){const O=n.properties.get(U);O.light=_}return U}function v(y,C,_,b,U){if(y.visible===!1)return;if(y.layers.test(C.layers)&&(y.isMesh||y.isLine||y.isPoints)&&(y.castShadow||y.receiveShadow&&U===Mr)&&(!y.frustumCulled||i.intersectsObject(y))){y.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,y.matrixWorld);const K=e.update(y),Z=y.material;if(Array.isArray(Z)){const w=K.groups;for(let V=0,N=w.length;V<N;V++){const $=w[V],ne=Z[$.materialIndex];if(ne&&ne.visible){const oe=L(y,ne,b,U);y.onBeforeShadow(n,y,C,_,K,oe,$),n.renderBufferDirect(_,null,K,oe,y,$),y.onAfterShadow(n,y,C,_,K,oe,$)}}}else if(Z.visible){const w=L(y,Z,b,U);y.onBeforeShadow(n,y,C,_,K,w,null),n.renderBufferDirect(_,null,K,w,y,null),y.onAfterShadow(n,y,C,_,K,w,null)}}const O=y.children;for(let K=0,Z=O.length;K<Z;K++)v(O[K],C,_,b,U)}function E(y){y.target.removeEventListener("dispose",E);for(const _ in c){const b=c[_],U=y.target.uuid;U in b&&(b[U].dispose(),delete b[U])}}}function p_(n,e){function t(){let F=!1;const ue=new ot;let ee=null;const de=new ot(0,0,0,0);return{setMask:function(pe){ee!==pe&&!F&&(n.colorMask(pe,pe,pe,pe),ee=pe)},setLocked:function(pe){F=pe},setClear:function(pe,se,Ee,Se,ct){ct===!0&&(pe*=Se,se*=Se,Ee*=Se),ue.set(pe,se,Ee,Se),de.equals(ue)===!1&&(n.clearColor(pe,se,Ee,Se),de.copy(ue))},reset:function(){F=!1,ee=null,de.set(-1,0,0,0)}}}function i(){let F=!1,ue=!1,ee=null,de=null,pe=null;return{setReversed:function(se){if(ue!==se){const Ee=e.get("EXT_clip_control");se?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),ue=se;const Se=pe;pe=null,this.setClear(Se)}},getReversed:function(){return ue},setTest:function(se){se?ae(n.DEPTH_TEST):Ce(n.DEPTH_TEST)},setMask:function(se){ee!==se&&!F&&(n.depthMask(se),ee=se)},setFunc:function(se){if(ue&&(se=Hf[se]),de!==se){switch(se){case qa:n.depthFunc(n.NEVER);break;case Ya:n.depthFunc(n.ALWAYS);break;case $a:n.depthFunc(n.LESS);break;case er:n.depthFunc(n.LEQUAL);break;case Ka:n.depthFunc(n.EQUAL);break;case Za:n.depthFunc(n.GEQUAL);break;case Ja:n.depthFunc(n.GREATER);break;case Qa:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}de=se}},setLocked:function(se){F=se},setClear:function(se){pe!==se&&(pe=se,ue&&(se=1-se),n.clearDepth(se))},reset:function(){F=!1,ee=null,de=null,pe=null,ue=!1}}}function r(){let F=!1,ue=null,ee=null,de=null,pe=null,se=null,Ee=null,Se=null,ct=null;return{setTest:function(nt){F||(nt?ae(n.STENCIL_TEST):Ce(n.STENCIL_TEST))},setMask:function(nt){ue!==nt&&!F&&(n.stencilMask(nt),ue=nt)},setFunc:function(nt,sn,an){(ee!==nt||de!==sn||pe!==an)&&(n.stencilFunc(nt,sn,an),ee=nt,de=sn,pe=an)},setOp:function(nt,sn,an){(se!==nt||Ee!==sn||Se!==an)&&(n.stencilOp(nt,sn,an),se=nt,Ee=sn,Se=an)},setLocked:function(nt){F=nt},setClear:function(nt){ct!==nt&&(n.clearStencil(nt),ct=nt)},reset:function(){F=!1,ue=null,ee=null,de=null,pe=null,se=null,Ee=null,Se=null,ct=null}}}const s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let d={},h={},u={},f=new WeakMap,x=[],S=null,m=!1,p=null,R=null,L=null,v=null,E=null,y=null,C=null,_=new Pe(0,0,0),b=0,U=!1,D=null,O=null,K=null,Z=null,w=null;const V=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let N=!1,$=0;const ne=n.getParameter(n.VERSION);ne.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(ne)[1]),N=$>=1):ne.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),N=$>=2);let oe=null,ie={};const fe=n.getParameter(n.SCISSOR_BOX),Oe=n.getParameter(n.VIEWPORT),Ke=new ot().fromArray(fe),Te=new ot().fromArray(Oe);function Q(F,ue,ee,de){const pe=new Uint8Array(4),se=n.createTexture();n.bindTexture(F,se),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ee=0;Ee<ee;Ee++)F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY?n.texImage3D(ue,0,n.RGBA,1,1,de,0,n.RGBA,n.UNSIGNED_BYTE,pe):n.texImage2D(ue+Ee,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,pe);return se}const le={};le[n.TEXTURE_2D]=Q(n.TEXTURE_2D,n.TEXTURE_2D,1),le[n.TEXTURE_CUBE_MAP]=Q(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[n.TEXTURE_2D_ARRAY]=Q(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),le[n.TEXTURE_3D]=Q(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ae(n.DEPTH_TEST),a.setFunc(er),lt(!1),ft(Dl),ae(n.CULL_FACE),qe(In);function ae(F){d[F]!==!0&&(n.enable(F),d[F]=!0)}function Ce(F){d[F]!==!1&&(n.disable(F),d[F]=!1)}function De(F,ue){return u[F]!==ue?(n.bindFramebuffer(F,ue),u[F]=ue,F===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=ue),F===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=ue),!0):!1}function Re(F,ue){let ee=x,de=!1;if(F){ee=f.get(ue),ee===void 0&&(ee=[],f.set(ue,ee));const pe=F.textures;if(ee.length!==pe.length||ee[0]!==n.COLOR_ATTACHMENT0){for(let se=0,Ee=pe.length;se<Ee;se++)ee[se]=n.COLOR_ATTACHMENT0+se;ee.length=pe.length,de=!0}}else ee[0]!==n.BACK&&(ee[0]=n.BACK,de=!0);de&&n.drawBuffers(ee)}function at(F){return S!==F?(n.useProgram(F),S=F,!0):!1}const Ge={[gi]:n.FUNC_ADD,[df]:n.FUNC_SUBTRACT,[ff]:n.FUNC_REVERSE_SUBTRACT};Ge[hf]=n.MIN,Ge[pf]=n.MAX;const Ze={[mf]:n.ZERO,[gf]:n.ONE,[_f]:n.SRC_COLOR,[Wa]:n.SRC_ALPHA,[bf]:n.SRC_ALPHA_SATURATE,[Sf]:n.DST_COLOR,[vf]:n.DST_ALPHA,[xf]:n.ONE_MINUS_SRC_COLOR,[Xa]:n.ONE_MINUS_SRC_ALPHA,[yf]:n.ONE_MINUS_DST_COLOR,[Mf]:n.ONE_MINUS_DST_ALPHA,[Ef]:n.CONSTANT_COLOR,[Tf]:n.ONE_MINUS_CONSTANT_COLOR,[wf]:n.CONSTANT_ALPHA,[Af]:n.ONE_MINUS_CONSTANT_ALPHA};function qe(F,ue,ee,de,pe,se,Ee,Se,ct,nt){if(F===In){m===!0&&(Ce(n.BLEND),m=!1);return}if(m===!1&&(ae(n.BLEND),m=!0),F!==uf){if(F!==p||nt!==U){if((R!==gi||E!==gi)&&(n.blendEquation(n.FUNC_ADD),R=gi,E=gi),nt)switch(F){case Ji:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ni:n.blendFunc(n.ONE,n.ONE);break;case Nl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ul:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Xe("WebGLState: Invalid blending: ",F);break}else switch(F){case Ji:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ni:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Nl:Xe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ul:Xe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xe("WebGLState: Invalid blending: ",F);break}L=null,v=null,y=null,C=null,_.set(0,0,0),b=0,p=F,U=nt}return}pe=pe||ue,se=se||ee,Ee=Ee||de,(ue!==R||pe!==E)&&(n.blendEquationSeparate(Ge[ue],Ge[pe]),R=ue,E=pe),(ee!==L||de!==v||se!==y||Ee!==C)&&(n.blendFuncSeparate(Ze[ee],Ze[de],Ze[se],Ze[Ee]),L=ee,v=de,y=se,C=Ee),(Se.equals(_)===!1||ct!==b)&&(n.blendColor(Se.r,Se.g,Se.b,ct),_.copy(Se),b=ct),p=F,U=!1}function Ve(F,ue){F.side===Vt?Ce(n.CULL_FACE):ae(n.CULL_FACE);let ee=F.side===Ut;ue&&(ee=!ee),lt(ee),F.blending===Ji&&F.transparent===!1?qe(In):qe(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),a.setFunc(F.depthFunc),a.setTest(F.depthTest),a.setMask(F.depthWrite),s.setMask(F.colorWrite);const de=F.stencilWrite;o.setTest(de),de&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),vt(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?ae(n.SAMPLE_ALPHA_TO_COVERAGE):Ce(n.SAMPLE_ALPHA_TO_COVERAGE)}function lt(F){D!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),D=F)}function ft(F){F!==of?(ae(n.CULL_FACE),F!==O&&(F===Dl?n.cullFace(n.BACK):F===lf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ce(n.CULL_FACE),O=F}function mt(F){F!==K&&(N&&n.lineWidth(F),K=F)}function vt(F,ue,ee){F?(ae(n.POLYGON_OFFSET_FILL),(Z!==ue||w!==ee)&&(Z=ue,w=ee,a.getReversed()&&(ue=-ue),n.polygonOffset(ue,ee))):Ce(n.POLYGON_OFFSET_FILL)}function tt(F){F?ae(n.SCISSOR_TEST):Ce(n.SCISSOR_TEST)}function Ue(F){F===void 0&&(F=n.TEXTURE0+V-1),oe!==F&&(n.activeTexture(F),oe=F)}function B(F,ue,ee){ee===void 0&&(oe===null?ee=n.TEXTURE0+V-1:ee=oe);let de=ie[ee];de===void 0&&(de={type:void 0,texture:void 0},ie[ee]=de),(de.type!==F||de.texture!==ue)&&(oe!==ee&&(n.activeTexture(ee),oe=ee),n.bindTexture(F,ue||le[F]),de.type=F,de.texture=ue)}function Ct(){const F=ie[oe];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function Ye(){try{n.compressedTexImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function g(){try{n.texSubImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function G(){try{n.texSubImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function H(){try{n.compressedTexSubImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function ce(){try{n.texStorage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function A(){try{n.texStorage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function P(){try{n.texImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function I(){try{n.texImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function W(F){return h[F]!==void 0?h[F]:n.getParameter(F)}function re(F,ue){h[F]!==ue&&(n.pixelStorei(F,ue),h[F]=ue)}function j(F){Ke.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),Ke.copy(F))}function te(F){Te.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),Te.copy(F))}function _e(F,ue){let ee=c.get(ue);ee===void 0&&(ee=new WeakMap,c.set(ue,ee));let de=ee.get(F);de===void 0&&(de=n.getUniformBlockIndex(ue,F.name),ee.set(F,de))}function ve(F,ue){const de=c.get(ue).get(F);l.get(ue)!==de&&(n.uniformBlockBinding(ue,de,F.__bindingPointIndex),l.set(ue,de))}function be(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),d={},h={},oe=null,ie={},u={},f=new WeakMap,x=[],S=null,m=!1,p=null,R=null,L=null,v=null,E=null,y=null,C=null,_=new Pe(0,0,0),b=0,U=!1,D=null,O=null,K=null,Z=null,w=null,Ke.set(0,0,n.canvas.width,n.canvas.height),Te.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ae,disable:Ce,bindFramebuffer:De,drawBuffers:Re,useProgram:at,setBlending:qe,setMaterial:Ve,setFlipSided:lt,setCullFace:ft,setLineWidth:mt,setPolygonOffset:vt,setScissorTest:tt,activeTexture:Ue,bindTexture:B,unbindTexture:Ct,compressedTexImage2D:Ye,compressedTexImage3D:T,texImage2D:P,texImage3D:I,pixelStorei:re,getParameter:W,updateUBOMapping:_e,uniformBlockBinding:ve,texStorage2D:ce,texStorage3D:A,texSubImage2D:g,texSubImage3D:G,compressedTexSubImage2D:H,compressedTexSubImage3D:J,scissor:j,viewport:te,reset:be}}function m_(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Be,d=new WeakMap,h=new Set;let u;const f=new WeakMap;let x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(T,g){return x?new OffscreenCanvas(T,g):Rs("canvas")}function m(T,g,G){let H=1;const J=Ye(T);if((J.width>G||J.height>G)&&(H=G/Math.max(J.width,J.height)),H<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const ce=Math.floor(H*J.width),A=Math.floor(H*J.height);u===void 0&&(u=S(ce,A));const P=g?S(ce,A):u;return P.width=ce,P.height=A,P.getContext("2d").drawImage(T,0,0,ce,A),Ie("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+ce+"x"+A+")."),P}else return"data"in T&&Ie("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function p(T){return T.generateMipmaps}function R(T){n.generateMipmap(T)}function L(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(T,g,G,H,J,ce=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ie("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let A;H&&(A=e.get("EXT_texture_norm16"),A||Ie("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let P=g;if(g===n.RED&&(G===n.FLOAT&&(P=n.R32F),G===n.HALF_FLOAT&&(P=n.R16F),G===n.UNSIGNED_BYTE&&(P=n.R8),G===n.UNSIGNED_SHORT&&A&&(P=A.R16_EXT),G===n.SHORT&&A&&(P=A.R16_SNORM_EXT)),g===n.RED_INTEGER&&(G===n.UNSIGNED_BYTE&&(P=n.R8UI),G===n.UNSIGNED_SHORT&&(P=n.R16UI),G===n.UNSIGNED_INT&&(P=n.R32UI),G===n.BYTE&&(P=n.R8I),G===n.SHORT&&(P=n.R16I),G===n.INT&&(P=n.R32I)),g===n.RG&&(G===n.FLOAT&&(P=n.RG32F),G===n.HALF_FLOAT&&(P=n.RG16F),G===n.UNSIGNED_BYTE&&(P=n.RG8),G===n.UNSIGNED_SHORT&&A&&(P=A.RG16_EXT),G===n.SHORT&&A&&(P=A.RG16_SNORM_EXT)),g===n.RG_INTEGER&&(G===n.UNSIGNED_BYTE&&(P=n.RG8UI),G===n.UNSIGNED_SHORT&&(P=n.RG16UI),G===n.UNSIGNED_INT&&(P=n.RG32UI),G===n.BYTE&&(P=n.RG8I),G===n.SHORT&&(P=n.RG16I),G===n.INT&&(P=n.RG32I)),g===n.RGB_INTEGER&&(G===n.UNSIGNED_BYTE&&(P=n.RGB8UI),G===n.UNSIGNED_SHORT&&(P=n.RGB16UI),G===n.UNSIGNED_INT&&(P=n.RGB32UI),G===n.BYTE&&(P=n.RGB8I),G===n.SHORT&&(P=n.RGB16I),G===n.INT&&(P=n.RGB32I)),g===n.RGBA_INTEGER&&(G===n.UNSIGNED_BYTE&&(P=n.RGBA8UI),G===n.UNSIGNED_SHORT&&(P=n.RGBA16UI),G===n.UNSIGNED_INT&&(P=n.RGBA32UI),G===n.BYTE&&(P=n.RGBA8I),G===n.SHORT&&(P=n.RGBA16I),G===n.INT&&(P=n.RGBA32I)),g===n.RGB&&(G===n.UNSIGNED_SHORT&&A&&(P=A.RGB16_EXT),G===n.SHORT&&A&&(P=A.RGB16_SNORM_EXT),G===n.UNSIGNED_INT_5_9_9_9_REV&&(P=n.RGB9_E5),G===n.UNSIGNED_INT_10F_11F_11F_REV&&(P=n.R11F_G11F_B10F)),g===n.RGBA){const I=ce?As:He.getTransfer(J);G===n.FLOAT&&(P=n.RGBA32F),G===n.HALF_FLOAT&&(P=n.RGBA16F),G===n.UNSIGNED_BYTE&&(P=I===Je?n.SRGB8_ALPHA8:n.RGBA8),G===n.UNSIGNED_SHORT&&A&&(P=A.RGBA16_EXT),G===n.SHORT&&A&&(P=A.RGBA16_SNORM_EXT),G===n.UNSIGNED_SHORT_4_4_4_4&&(P=n.RGBA4),G===n.UNSIGNED_SHORT_5_5_5_1&&(P=n.RGB5_A1)}return(P===n.R16F||P===n.R32F||P===n.RG16F||P===n.RG32F||P===n.RGBA16F||P===n.RGBA32F)&&e.get("EXT_color_buffer_float"),P}function E(T,g){let G;return T?g===null||g===vn||g===wr?G=n.DEPTH24_STENCIL8:g===fn?G=n.DEPTH32F_STENCIL8:g===Tr&&(G=n.DEPTH24_STENCIL8,Ie("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===vn||g===wr?G=n.DEPTH_COMPONENT24:g===fn?G=n.DEPTH_COMPONENT32F:g===Tr&&(G=n.DEPTH_COMPONENT16),G}function y(T,g){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==At&&T.minFilter!==Et?Math.log2(Math.max(g.width,g.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?g.mipmaps.length:1}function C(T){const g=T.target;g.removeEventListener("dispose",C),b(g),g.isVideoTexture&&d.delete(g),g.isHTMLTexture&&h.delete(g)}function _(T){const g=T.target;g.removeEventListener("dispose",_),D(g)}function b(T){const g=i.get(T);if(g.__webglInit===void 0)return;const G=T.source,H=f.get(G);if(H){const J=H[g.__cacheKey];J.usedTimes--,J.usedTimes===0&&U(T),Object.keys(H).length===0&&f.delete(G)}i.remove(T)}function U(T){const g=i.get(T);n.deleteTexture(g.__webglTexture);const G=T.source,H=f.get(G);delete H[g.__cacheKey],a.memory.textures--}function D(T){const g=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(g.__webglFramebuffer[H]))for(let J=0;J<g.__webglFramebuffer[H].length;J++)n.deleteFramebuffer(g.__webglFramebuffer[H][J]);else n.deleteFramebuffer(g.__webglFramebuffer[H]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[H])}else{if(Array.isArray(g.__webglFramebuffer))for(let H=0;H<g.__webglFramebuffer.length;H++)n.deleteFramebuffer(g.__webglFramebuffer[H]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let H=0;H<g.__webglColorRenderbuffer.length;H++)g.__webglColorRenderbuffer[H]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[H]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const G=T.textures;for(let H=0,J=G.length;H<J;H++){const ce=i.get(G[H]);ce.__webglTexture&&(n.deleteTexture(ce.__webglTexture),a.memory.textures--),i.remove(G[H])}i.remove(T)}let O=0;function K(){O=0}function Z(){return O}function w(T){O=T}function V(){const T=O;return T>=r.maxTextures&&Ie("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),O+=1,T}function N(T){const g=[];return g.push(T.wrapS),g.push(T.wrapT),g.push(T.wrapR||0),g.push(T.magFilter),g.push(T.minFilter),g.push(T.anisotropy),g.push(T.internalFormat),g.push(T.format),g.push(T.type),g.push(T.generateMipmaps),g.push(T.premultiplyAlpha),g.push(T.flipY),g.push(T.unpackAlignment),g.push(T.colorSpace),g.join()}function $(T,g){const G=i.get(T);if(T.isVideoTexture&&B(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&G.__version!==T.version){const H=T.image;if(H===null)Ie("WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)Ie("WebGLRenderer: Texture marked for update but image is incomplete");else{Ce(G,T,g);return}}else T.isExternalTexture&&(G.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,G.__webglTexture,n.TEXTURE0+g)}function ne(T,g){const G=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&G.__version!==T.version){Ce(G,T,g);return}else T.isExternalTexture&&(G.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,G.__webglTexture,n.TEXTURE0+g)}function oe(T,g){const G=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&G.__version!==T.version){Ce(G,T,g);return}t.bindTexture(n.TEXTURE_3D,G.__webglTexture,n.TEXTURE0+g)}function ie(T,g){const G=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&G.__version!==T.version){De(G,T,g);return}t.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture,n.TEXTURE0+g)}const fe={[ja]:n.REPEAT,[nn]:n.CLAMP_TO_EDGE,[eo]:n.MIRRORED_REPEAT},Oe={[At]:n.NEAREST,[Pf]:n.NEAREST_MIPMAP_NEAREST,[zr]:n.NEAREST_MIPMAP_LINEAR,[Et]:n.LINEAR,[$s]:n.LINEAR_MIPMAP_NEAREST,[Pn]:n.LINEAR_MIPMAP_LINEAR},Ke={[Df]:n.NEVER,[Bf]:n.ALWAYS,[Nf]:n.LESS,[nl]:n.LEQUAL,[Uf]:n.EQUAL,[il]:n.GEQUAL,[Ff]:n.GREATER,[Of]:n.NOTEQUAL};function Te(T,g){if(g.type===fn&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===Et||g.magFilter===$s||g.magFilter===zr||g.magFilter===Pn||g.minFilter===Et||g.minFilter===$s||g.minFilter===zr||g.minFilter===Pn)&&Ie("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,fe[g.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,fe[g.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,fe[g.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Oe[g.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Oe[g.minFilter]),g.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,Ke[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===At||g.minFilter!==zr&&g.minFilter!==Pn||g.type===fn&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function Q(T,g){let G=!1;T.__webglInit===void 0&&(T.__webglInit=!0,g.addEventListener("dispose",C));const H=g.source;let J=f.get(H);J===void 0&&(J={},f.set(H,J));const ce=N(g);if(ce!==T.__cacheKey){J[ce]===void 0&&(J[ce]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,G=!0),J[ce].usedTimes++;const A=J[T.__cacheKey];A!==void 0&&(J[T.__cacheKey].usedTimes--,A.usedTimes===0&&U(g)),T.__cacheKey=ce,T.__webglTexture=J[ce].texture}return G}function le(T,g,G){return Math.floor(Math.floor(T/G)/g)}function ae(T,g,G,H){const ce=T.updateRanges;if(ce.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,G,H,g.data);else{ce.sort((re,j)=>re.start-j.start);let A=0;for(let re=1;re<ce.length;re++){const j=ce[A],te=ce[re],_e=j.start+j.count,ve=le(te.start,g.width,4),be=le(j.start,g.width,4);te.start<=_e+1&&ve===be&&le(te.start+te.count-1,g.width,4)===ve?j.count=Math.max(j.count,te.start+te.count-j.start):(++A,ce[A]=te)}ce.length=A+1;const P=t.getParameter(n.UNPACK_ROW_LENGTH),I=t.getParameter(n.UNPACK_SKIP_PIXELS),W=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let re=0,j=ce.length;re<j;re++){const te=ce[re],_e=Math.floor(te.start/4),ve=Math.ceil(te.count/4),be=_e%g.width,F=Math.floor(_e/g.width),ue=ve,ee=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,be),t.pixelStorei(n.UNPACK_SKIP_ROWS,F),t.texSubImage2D(n.TEXTURE_2D,0,be,F,ue,ee,G,H,g.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,P),t.pixelStorei(n.UNPACK_SKIP_PIXELS,I),t.pixelStorei(n.UNPACK_SKIP_ROWS,W)}}function Ce(T,g,G){let H=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(H=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(H=n.TEXTURE_3D);const J=Q(T,g),ce=g.source;t.bindTexture(H,T.__webglTexture,n.TEXTURE0+G);const A=i.get(ce);if(ce.version!==A.__version||J===!0){if(t.activeTexture(n.TEXTURE0+G),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const ee=He.getPrimaries(He.workingColorSpace),de=g.colorSpace===Kn?null:He.getPrimaries(g.colorSpace),pe=g.colorSpace===Kn||ee===de?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,pe)}t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment);let I=m(g.image,!1,r.maxTextureSize);I=Ct(g,I);const W=s.convert(g.format,g.colorSpace),re=s.convert(g.type);let j=v(g.internalFormat,W,re,g.normalized,g.colorSpace,g.isVideoTexture);Te(H,g);let te;const _e=g.mipmaps,ve=g.isVideoTexture!==!0,be=A.__version===void 0||J===!0,F=ce.dataReady,ue=y(g,I);if(g.isDepthTexture)j=E(g.format===Mi,g.type),be&&(ve?t.texStorage2D(n.TEXTURE_2D,1,j,I.width,I.height):t.texImage2D(n.TEXTURE_2D,0,j,I.width,I.height,0,W,re,null));else if(g.isDataTexture)if(_e.length>0){ve&&be&&t.texStorage2D(n.TEXTURE_2D,ue,j,_e[0].width,_e[0].height);for(let ee=0,de=_e.length;ee<de;ee++)te=_e[ee],ve?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,te.width,te.height,W,re,te.data):t.texImage2D(n.TEXTURE_2D,ee,j,te.width,te.height,0,W,re,te.data);g.generateMipmaps=!1}else ve?(be&&t.texStorage2D(n.TEXTURE_2D,ue,j,I.width,I.height),F&&ae(g,I,W,re)):t.texImage2D(n.TEXTURE_2D,0,j,I.width,I.height,0,W,re,I.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){ve&&be&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ue,j,_e[0].width,_e[0].height,I.depth);for(let ee=0,de=_e.length;ee<de;ee++)if(te=_e[ee],g.format!==rn)if(W!==null)if(ve){if(F)if(g.layerUpdates.size>0){const pe=dc(te.width,te.height,g.format,g.type);for(const se of g.layerUpdates){const Ee=te.data.subarray(se*pe/te.data.BYTES_PER_ELEMENT,(se+1)*pe/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,se,te.width,te.height,1,W,Ee)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,te.width,te.height,I.depth,W,te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ee,j,te.width,te.height,I.depth,0,te.data,0,0);else Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ve?F&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,te.width,te.height,I.depth,W,re,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ee,j,te.width,te.height,I.depth,0,W,re,te.data)}else{ve&&be&&t.texStorage2D(n.TEXTURE_2D,ue,j,_e[0].width,_e[0].height);for(let ee=0,de=_e.length;ee<de;ee++)te=_e[ee],g.format!==rn?W!==null?ve?F&&t.compressedTexSubImage2D(n.TEXTURE_2D,ee,0,0,te.width,te.height,W,te.data):t.compressedTexImage2D(n.TEXTURE_2D,ee,j,te.width,te.height,0,te.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ve?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,te.width,te.height,W,re,te.data):t.texImage2D(n.TEXTURE_2D,ee,j,te.width,te.height,0,W,re,te.data)}else if(g.isDataArrayTexture)if(ve){if(be&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ue,j,I.width,I.height,I.depth),F)if(g.layerUpdates.size>0){const ee=dc(I.width,I.height,g.format,g.type);for(const de of g.layerUpdates){const pe=I.data.subarray(de*ee/I.data.BYTES_PER_ELEMENT,(de+1)*ee/I.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,de,I.width,I.height,1,W,re,pe)}g.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,I.width,I.height,I.depth,W,re,I.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,j,I.width,I.height,I.depth,0,W,re,I.data);else if(g.isData3DTexture)ve?(be&&t.texStorage3D(n.TEXTURE_3D,ue,j,I.width,I.height,I.depth),F&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,I.width,I.height,I.depth,W,re,I.data)):t.texImage3D(n.TEXTURE_3D,0,j,I.width,I.height,I.depth,0,W,re,I.data);else if(g.isFramebufferTexture){if(be)if(ve)t.texStorage2D(n.TEXTURE_2D,ue,j,I.width,I.height);else{let ee=I.width,de=I.height;for(let pe=0;pe<ue;pe++)t.texImage2D(n.TEXTURE_2D,pe,j,ee,de,0,W,re,null),ee>>=1,de>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in n){const ee=n.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),I.parentNode!==ee){ee.appendChild(I),h.add(g),ee.onpaint=de=>{const pe=de.changedElements;for(const se of h)pe.includes(se.image)&&(se.needsUpdate=!0)},ee.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,I);else{const pe=n.RGBA,se=n.RGBA,Ee=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,pe,se,Ee,I)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(_e.length>0){if(ve&&be){const ee=Ye(_e[0]);t.texStorage2D(n.TEXTURE_2D,ue,j,ee.width,ee.height)}for(let ee=0,de=_e.length;ee<de;ee++)te=_e[ee],ve?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,W,re,te):t.texImage2D(n.TEXTURE_2D,ee,j,W,re,te);g.generateMipmaps=!1}else if(ve){if(be){const ee=Ye(I);t.texStorage2D(n.TEXTURE_2D,ue,j,ee.width,ee.height)}F&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,W,re,I)}else t.texImage2D(n.TEXTURE_2D,0,j,W,re,I);p(g)&&R(H),A.__version=ce.version,g.onUpdate&&g.onUpdate(g)}T.__version=g.version}function De(T,g,G){if(g.image.length!==6)return;const H=Q(T,g),J=g.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+G);const ce=i.get(J);if(J.version!==ce.__version||H===!0){t.activeTexture(n.TEXTURE0+G);const A=He.getPrimaries(He.workingColorSpace),P=g.colorSpace===Kn?null:He.getPrimaries(g.colorSpace),I=g.colorSpace===Kn||A===P?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,I);const W=g.isCompressedTexture||g.image[0].isCompressedTexture,re=g.image[0]&&g.image[0].isDataTexture,j=[];for(let se=0;se<6;se++)!W&&!re?j[se]=m(g.image[se],!0,r.maxCubemapSize):j[se]=re?g.image[se].image:g.image[se],j[se]=Ct(g,j[se]);const te=j[0],_e=s.convert(g.format,g.colorSpace),ve=s.convert(g.type),be=v(g.internalFormat,_e,ve,g.normalized,g.colorSpace),F=g.isVideoTexture!==!0,ue=ce.__version===void 0||H===!0,ee=J.dataReady;let de=y(g,te);Te(n.TEXTURE_CUBE_MAP,g);let pe;if(W){F&&ue&&t.texStorage2D(n.TEXTURE_CUBE_MAP,de,be,te.width,te.height);for(let se=0;se<6;se++){pe=j[se].mipmaps;for(let Ee=0;Ee<pe.length;Ee++){const Se=pe[Ee];g.format!==rn?_e!==null?F?ee&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee,0,0,Se.width,Se.height,_e,Se.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee,be,Se.width,Se.height,0,Se.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee,0,0,Se.width,Se.height,_e,ve,Se.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee,be,Se.width,Se.height,0,_e,ve,Se.data)}}}else{if(pe=g.mipmaps,F&&ue){pe.length>0&&de++;const se=Ye(j[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,de,be,se.width,se.height)}for(let se=0;se<6;se++)if(re){F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,j[se].width,j[se].height,_e,ve,j[se].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,be,j[se].width,j[se].height,0,_e,ve,j[se].data);for(let Ee=0;Ee<pe.length;Ee++){const ct=pe[Ee].image[se].image;F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee+1,0,0,ct.width,ct.height,_e,ve,ct.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee+1,be,ct.width,ct.height,0,_e,ve,ct.data)}}else{F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,_e,ve,j[se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,be,_e,ve,j[se]);for(let Ee=0;Ee<pe.length;Ee++){const Se=pe[Ee];F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee+1,0,0,_e,ve,Se.image[se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ee+1,be,_e,ve,Se.image[se])}}}p(g)&&R(n.TEXTURE_CUBE_MAP),ce.__version=J.version,g.onUpdate&&g.onUpdate(g)}T.__version=g.version}function Re(T,g,G,H,J,ce){const A=s.convert(G.format,G.colorSpace),P=s.convert(G.type),I=v(G.internalFormat,A,P,G.normalized,G.colorSpace),W=i.get(g),re=i.get(G);if(re.__renderTarget=g,!W.__hasExternalTextures){const j=Math.max(1,g.width>>ce),te=Math.max(1,g.height>>ce);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,ce,I,j,te,g.depth,0,A,P,null):t.texImage2D(J,ce,I,j,te,0,A,P,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,H,J,re.__webglTexture,0,tt(g)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,H,J,re.__webglTexture,ce),t.bindFramebuffer(n.FRAMEBUFFER,null)}function at(T,g,G){if(n.bindRenderbuffer(n.RENDERBUFFER,T),g.depthBuffer){const H=g.depthTexture,J=H&&H.isDepthTexture?H.type:null,ce=E(g.stencilBuffer,J),A=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ue(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,tt(g),ce,g.width,g.height):G?n.renderbufferStorageMultisample(n.RENDERBUFFER,tt(g),ce,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,ce,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,A,n.RENDERBUFFER,T)}else{const H=g.textures;for(let J=0;J<H.length;J++){const ce=H[J],A=s.convert(ce.format,ce.colorSpace),P=s.convert(ce.type),I=v(ce.internalFormat,A,P,ce.normalized,ce.colorSpace);Ue(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,tt(g),I,g.width,g.height):G?n.renderbufferStorageMultisample(n.RENDERBUFFER,tt(g),I,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,I,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ge(T,g,G){const H=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const J=i.get(g.depthTexture);if(J.__renderTarget=g,(!J.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),H){if(J.__webglInit===void 0&&(J.__webglInit=!0,g.depthTexture.addEventListener("dispose",C)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),Te(n.TEXTURE_CUBE_MAP,g.depthTexture);const W=s.convert(g.depthTexture.format),re=s.convert(g.depthTexture.type);let j;g.depthTexture.format===Fn?j=n.DEPTH_COMPONENT24:g.depthTexture.format===Mi&&(j=n.DEPTH24_STENCIL8);for(let te=0;te<6;te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,j,g.width,g.height,0,W,re,null)}}else $(g.depthTexture,0);const ce=J.__webglTexture,A=tt(g),P=H?n.TEXTURE_CUBE_MAP_POSITIVE_X+G:n.TEXTURE_2D,I=g.depthTexture.format===Mi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===Fn)Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,I,P,ce,0,A):n.framebufferTexture2D(n.FRAMEBUFFER,I,P,ce,0);else if(g.depthTexture.format===Mi)Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,I,P,ce,0,A):n.framebufferTexture2D(n.FRAMEBUFFER,I,P,ce,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ze(T){const g=i.get(T),G=T.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==T.depthTexture){const H=T.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),H){const J=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,H.removeEventListener("dispose",J)};H.addEventListener("dispose",J),g.__depthDisposeCallback=J}g.__boundDepthTexture=H}if(T.depthTexture&&!g.__autoAllocateDepthBuffer)if(G)for(let H=0;H<6;H++)Ge(g.__webglFramebuffer[H],T,H);else{const H=T.texture.mipmaps;H&&H.length>0?Ge(g.__webglFramebuffer[0],T,0):Ge(g.__webglFramebuffer,T,0)}else if(G){g.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[H]),g.__webglDepthbuffer[H]===void 0)g.__webglDepthbuffer[H]=n.createRenderbuffer(),at(g.__webglDepthbuffer[H],T,!1);else{const J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=g.__webglDepthbuffer[H];n.bindRenderbuffer(n.RENDERBUFFER,ce),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ce)}}else{const H=T.texture.mipmaps;if(H&&H.length>0?t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),at(g.__webglDepthbuffer,T,!1);else{const J=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ce),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,ce)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function qe(T,g,G){const H=i.get(T);g!==void 0&&Re(H.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),G!==void 0&&Ze(T)}function Ve(T){const g=T.texture,G=i.get(T),H=i.get(g);T.addEventListener("dispose",_);const J=T.textures,ce=T.isWebGLCubeRenderTarget===!0,A=J.length>1;if(A||(H.__webglTexture===void 0&&(H.__webglTexture=n.createTexture()),H.__version=g.version,a.memory.textures++),ce){G.__webglFramebuffer=[];for(let P=0;P<6;P++)if(g.mipmaps&&g.mipmaps.length>0){G.__webglFramebuffer[P]=[];for(let I=0;I<g.mipmaps.length;I++)G.__webglFramebuffer[P][I]=n.createFramebuffer()}else G.__webglFramebuffer[P]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){G.__webglFramebuffer=[];for(let P=0;P<g.mipmaps.length;P++)G.__webglFramebuffer[P]=n.createFramebuffer()}else G.__webglFramebuffer=n.createFramebuffer();if(A)for(let P=0,I=J.length;P<I;P++){const W=i.get(J[P]);W.__webglTexture===void 0&&(W.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&Ue(T)===!1){G.__webglMultisampledFramebuffer=n.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let P=0;P<J.length;P++){const I=J[P];G.__webglColorRenderbuffer[P]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,G.__webglColorRenderbuffer[P]);const W=s.convert(I.format,I.colorSpace),re=s.convert(I.type),j=v(I.internalFormat,W,re,I.normalized,I.colorSpace,T.isXRRenderTarget===!0),te=tt(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,te,j,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+P,n.RENDERBUFFER,G.__webglColorRenderbuffer[P])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(G.__webglDepthRenderbuffer=n.createRenderbuffer(),at(G.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ce){t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture),Te(n.TEXTURE_CUBE_MAP,g);for(let P=0;P<6;P++)if(g.mipmaps&&g.mipmaps.length>0)for(let I=0;I<g.mipmaps.length;I++)Re(G.__webglFramebuffer[P][I],T,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+P,I);else Re(G.__webglFramebuffer[P],T,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+P,0);p(g)&&R(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(A){for(let P=0,I=J.length;P<I;P++){const W=J[P],re=i.get(W);let j=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(j=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(j,re.__webglTexture),Te(j,W),Re(G.__webglFramebuffer,T,W,n.COLOR_ATTACHMENT0+P,j,0),p(W)&&R(j)}t.unbindTexture()}else{let P=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(P=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(P,H.__webglTexture),Te(P,g),g.mipmaps&&g.mipmaps.length>0)for(let I=0;I<g.mipmaps.length;I++)Re(G.__webglFramebuffer[I],T,g,n.COLOR_ATTACHMENT0,P,I);else Re(G.__webglFramebuffer,T,g,n.COLOR_ATTACHMENT0,P,0);p(g)&&R(P),t.unbindTexture()}T.depthBuffer&&Ze(T)}function lt(T){const g=T.textures;for(let G=0,H=g.length;G<H;G++){const J=g[G];if(p(J)){const ce=L(T),A=i.get(J).__webglTexture;t.bindTexture(ce,A),R(ce),t.unbindTexture()}}}const ft=[],mt=[];function vt(T){if(T.samples>0){if(Ue(T)===!1){const g=T.textures,G=T.width,H=T.height;let J=n.COLOR_BUFFER_BIT;const ce=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,A=i.get(T),P=g.length>1;if(P)for(let W=0;W<g.length;W++)t.bindFramebuffer(n.FRAMEBUFFER,A.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,A.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,A.__webglMultisampledFramebuffer);const I=T.texture.mipmaps;I&&I.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,A.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,A.__webglFramebuffer);for(let W=0;W<g.length;W++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),P){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,A.__webglColorRenderbuffer[W]);const re=i.get(g[W]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,re,0)}n.blitFramebuffer(0,0,G,H,0,0,G,H,J,n.NEAREST),l===!0&&(ft.length=0,mt.length=0,ft.push(n.COLOR_ATTACHMENT0+W),T.depthBuffer&&T.resolveDepthBuffer===!1&&(ft.push(ce),mt.push(ce),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,mt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ft))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),P)for(let W=0;W<g.length;W++){t.bindFramebuffer(n.FRAMEBUFFER,A.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,A.__webglColorRenderbuffer[W]);const re=i.get(g[W]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,A.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.TEXTURE_2D,re,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,A.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){const g=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function tt(T){return Math.min(r.maxSamples,T.samples)}function Ue(T){const g=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function B(T){const g=a.render.frame;d.get(T)!==g&&(d.set(T,g),T.update())}function Ct(T,g){const G=T.colorSpace,H=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||G!==ws&&G!==Kn&&(He.getTransfer(G)===Je?(H!==rn||J!==Ht)&&Ie("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xe("WebGLTextures: Unsupported texture color space:",G)),g}function Ye(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=K,this.getTextureUnits=Z,this.setTextureUnits=w,this.setTexture2D=$,this.setTexture2DArray=ne,this.setTexture3D=oe,this.setTextureCube=ie,this.rebindTextures=qe,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=lt,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=Ze,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=Ue,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function g_(n,e){function t(i,r=Kn){let s;const a=He.getTransfer(r);if(i===Ht)return n.UNSIGNED_BYTE;if(i===Jo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Qo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Ru)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Cu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===wu)return n.BYTE;if(i===Au)return n.SHORT;if(i===Tr)return n.UNSIGNED_SHORT;if(i===Zo)return n.INT;if(i===vn)return n.UNSIGNED_INT;if(i===fn)return n.FLOAT;if(i===Un)return n.HALF_FLOAT;if(i===Pu)return n.ALPHA;if(i===Lu)return n.RGB;if(i===rn)return n.RGBA;if(i===Fn)return n.DEPTH_COMPONENT;if(i===Mi)return n.DEPTH_STENCIL;if(i===Iu)return n.RED;if(i===jo)return n.RED_INTEGER;if(i===Ei)return n.RG;if(i===el)return n.RG_INTEGER;if(i===tl)return n.RGBA_INTEGER;if(i===ms||i===gs||i===_s||i===xs)if(a===Je)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ms)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===_s)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===xs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ms)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===_s)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===xs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===to||i===no||i===io||i===ro)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===to)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===no)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===io)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ro)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===so||i===ao||i===oo||i===lo||i===co||i===Es||i===uo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===so||i===ao)return a===Je?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===oo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===lo)return s.COMPRESSED_R11_EAC;if(i===co)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Es)return s.COMPRESSED_RG11_EAC;if(i===uo)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===fo||i===ho||i===po||i===mo||i===go||i===_o||i===xo||i===vo||i===Mo||i===So||i===yo||i===bo||i===Eo||i===To)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===fo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ho)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===po)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===mo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===go)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===_o)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===xo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===vo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Mo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===So)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===yo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===bo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Eo)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===To)return a===Je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===wo||i===Ao||i===Ro)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===wo)return a===Je?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ao)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ro)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Co||i===Po||i===Ts||i===Lo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Co)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Po)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ts)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Lo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===wr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const __=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,x_=`
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

}`;class v_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new ku(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Mn({vertexShader:__,fragmentShader:x_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new _t(new wi(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class M_ extends Ti{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,h=null,u=null,f=null,x=null;const S=typeof XRWebGLBinding<"u",m=new v_,p={},R=t.getContextAttributes();let L=null,v=null;const E=[],y=[],C=new Be;let _=null;const b=new Ot;b.viewport=new ot;const U=new Ot;U.viewport=new ot;const D=[b,U],O=new Ch;let K=null,Z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let le=E[Q];return le===void 0&&(le=new na,E[Q]=le),le.getTargetRaySpace()},this.getControllerGrip=function(Q){let le=E[Q];return le===void 0&&(le=new na,E[Q]=le),le.getGripSpace()},this.getHand=function(Q){let le=E[Q];return le===void 0&&(le=new na,E[Q]=le),le.getHandSpace()};function w(Q){const le=y.indexOf(Q.inputSource);if(le===-1)return;const ae=E[le];ae!==void 0&&(ae.update(Q.inputSource,Q.frame,c||a),ae.dispatchEvent({type:Q.type,data:Q.inputSource}))}function V(){r.removeEventListener("select",w),r.removeEventListener("selectstart",w),r.removeEventListener("selectend",w),r.removeEventListener("squeeze",w),r.removeEventListener("squeezestart",w),r.removeEventListener("squeezeend",w),r.removeEventListener("end",V),r.removeEventListener("inputsourceschange",N);for(let Q=0;Q<E.length;Q++){const le=y[Q];le!==null&&(y[Q]=null,E[Q].disconnect(le))}K=null,Z=null,m.reset();for(const Q in p)delete p[Q];e.setRenderTarget(L),f=null,u=null,h=null,r=null,v=null,Te.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){s=Q,i.isPresenting===!0&&Ie("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){o=Q,i.isPresenting===!0&&Ie("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Q){c=Q},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return h===null&&S&&(h=new XRWebGLBinding(r,t)),h},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function(Q){if(r=Q,r!==null){if(L=e.getRenderTarget(),r.addEventListener("select",w),r.addEventListener("selectstart",w),r.addEventListener("selectend",w),r.addEventListener("squeeze",w),r.addEventListener("squeezestart",w),r.addEventListener("squeezeend",w),r.addEventListener("end",V),r.addEventListener("inputsourceschange",N),R.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(C),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ae=null,Ce=null,De=null;R.depth&&(De=R.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ae=R.stencil?Mi:Fn,Ce=R.stencil?wr:vn);const Re={colorFormat:t.RGBA8,depthFormat:De,scaleFactor:s};h=this.getBinding(),u=h.createProjectionLayer(Re),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),v=new _n(u.textureWidth,u.textureHeight,{format:rn,type:Ht,depthTexture:new nr(u.textureWidth,u.textureHeight,Ce,void 0,void 0,void 0,void 0,void 0,void 0,ae),stencilBuffer:R.stencil,colorSpace:e.outputColorSpace,samples:R.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const ae={antialias:R.antialias,alpha:!0,depth:R.depth,stencil:R.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,ae),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new _n(f.framebufferWidth,f.framebufferHeight,{format:rn,type:Ht,colorSpace:e.outputColorSpace,stencilBuffer:R.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Te.setContext(r),Te.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function N(Q){for(let le=0;le<Q.removed.length;le++){const ae=Q.removed[le],Ce=y.indexOf(ae);Ce>=0&&(y[Ce]=null,E[Ce].disconnect(ae))}for(let le=0;le<Q.added.length;le++){const ae=Q.added[le];let Ce=y.indexOf(ae);if(Ce===-1){for(let Re=0;Re<E.length;Re++)if(Re>=y.length){y.push(ae),Ce=Re;break}else if(y[Re]===null){y[Re]=ae,Ce=Re;break}if(Ce===-1)break}const De=E[Ce];De&&De.connect(ae)}}const $=new z,ne=new z;function oe(Q,le,ae){$.setFromMatrixPosition(le.matrixWorld),ne.setFromMatrixPosition(ae.matrixWorld);const Ce=$.distanceTo(ne),De=le.projectionMatrix.elements,Re=ae.projectionMatrix.elements,at=De[14]/(De[10]-1),Ge=De[14]/(De[10]+1),Ze=(De[9]+1)/De[5],qe=(De[9]-1)/De[5],Ve=(De[8]-1)/De[0],lt=(Re[8]+1)/Re[0],ft=at*Ve,mt=at*lt,vt=Ce/(-Ve+lt),tt=vt*-Ve;if(le.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(tt),Q.translateZ(vt),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),De[10]===-1)Q.projectionMatrix.copy(le.projectionMatrix),Q.projectionMatrixInverse.copy(le.projectionMatrixInverse);else{const Ue=at+vt,B=Ge+vt,Ct=ft-tt,Ye=mt+(Ce-tt),T=Ze*Ge/B*Ue,g=qe*Ge/B*Ue;Q.projectionMatrix.makePerspective(Ct,Ye,T,g,Ue,B),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function ie(Q,le){le===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(le.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(r===null)return;let le=Q.near,ae=Q.far;m.texture!==null&&(m.depthNear>0&&(le=m.depthNear),m.depthFar>0&&(ae=m.depthFar)),O.near=U.near=b.near=le,O.far=U.far=b.far=ae,(K!==O.near||Z!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),K=O.near,Z=O.far),O.layers.mask=Q.layers.mask|6,b.layers.mask=O.layers.mask&-5,U.layers.mask=O.layers.mask&-3;const Ce=Q.parent,De=O.cameras;ie(O,Ce);for(let Re=0;Re<De.length;Re++)ie(De[Re],Ce);De.length===2?oe(O,b,U):O.projectionMatrix.copy(b.projectionMatrix),fe(Q,O,Ce)};function fe(Q,le,ae){ae===null?Q.matrix.copy(le.matrixWorld):(Q.matrix.copy(ae.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(le.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(le.projectionMatrix),Q.projectionMatrixInverse.copy(le.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=Cs*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(Q){l=Q,u!==null&&(u.fixedFoveation=Q),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Q)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function(Q){return p[Q]};let Oe=null;function Ke(Q,le){if(d=le.getViewerPose(c||a),x=le,d!==null){const ae=d.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let Ce=!1;ae.length!==O.cameras.length&&(O.cameras.length=0,Ce=!0);for(let Ge=0;Ge<ae.length;Ge++){const Ze=ae[Ge];let qe=null;if(f!==null)qe=f.getViewport(Ze);else{const lt=h.getViewSubImage(u,Ze);qe=lt.viewport,Ge===0&&(e.setRenderTargetTextures(v,lt.colorTexture,lt.depthStencilTexture),e.setRenderTarget(v))}let Ve=D[Ge];Ve===void 0&&(Ve=new Ot,Ve.layers.enable(Ge),Ve.viewport=new ot,D[Ge]=Ve),Ve.matrix.fromArray(Ze.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(Ze.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(qe.x,qe.y,qe.width,qe.height),Ge===0&&(O.matrix.copy(Ve.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ce===!0&&O.cameras.push(Ve)}const De=r.enabledFeatures;if(De&&De.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){h=i.getBinding();const Ge=h.getDepthInformation(ae[0]);Ge&&Ge.isValid&&Ge.texture&&m.init(Ge,r.renderState)}if(De&&De.includes("camera-access")&&S){e.state.unbindTexture(),h=i.getBinding();for(let Ge=0;Ge<ae.length;Ge++){const Ze=ae[Ge].camera;if(Ze){let qe=p[Ze];qe||(qe=new ku,p[Ze]=qe);const Ve=h.getCameraImage(Ze);qe.sourceTexture=Ve}}}}for(let ae=0;ae<E.length;ae++){const Ce=y[ae],De=E[ae];Ce!==null&&De!==void 0&&De.update(Ce,le,c||a)}Oe&&Oe(Q,le),le.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:le}),x=null}const Te=new qu;Te.setAnimationLoop(Ke),this.setAnimationLoop=function(Q){Oe=Q},this.dispose=function(){}}}const S_=new rt,ju=new Ne;ju.set(-1,0,0,0,1,0,0,0,1);function y_(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,Gu(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,R,L,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),h(m,p)):p.isMeshPhongMaterial?(s(m,p),d(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),u(m,p),p.isMeshPhysicalMaterial&&f(m,p,v)):p.isMeshMatcapMaterial?(s(m,p),x(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,R,L):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ut&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ut&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const R=e.get(p),L=R.envMap,v=R.envMapRotation;L&&(m.envMap.value=L,m.envMapRotation.value.setFromMatrix4(S_.makeRotationFromEuler(v)).transpose(),L.isCubeTexture&&L.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(ju),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,R,L){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*R,m.scale.value=L*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function d(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,R){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ut&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=R.texture,m.transmissionSamplerSize.value.set(R.width,R.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const R=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(R.matrixWorld),m.nearDistance.value=R.shadow.camera.near,m.farDistance.value=R.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function b_(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,E){const y=E.program;i.uniformBlockBinding(v,y)}function c(v,E){let y=r[v.id];y===void 0&&(m(v),y=d(v),r[v.id]=y,v.addEventListener("dispose",R));const C=E.program;i.updateUBOMapping(v,C);const _=e.render.frame;s[v.id]!==_&&(u(v),s[v.id]=_)}function d(v){const E=h();v.__bindingPointIndex=E;const y=n.createBuffer(),C=v.__size,_=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,C,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,E,y),y}function h(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Xe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){const E=r[v.id],y=v.uniforms,C=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,E);for(let _=0,b=y.length;_<b;_++){const U=y[_];if(Array.isArray(U))for(let D=0,O=U.length;D<O;D++)f(U[D],_,D,C);else f(U,_,0,C)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,E,y,C){if(S(v,E,y,C)===!0){const _=v.__offset,b=v.value;if(Array.isArray(b)){let U=0;for(let D=0;D<b.length;D++){const O=b[D],K=p(O);x(O,v.__data,U),typeof O!="number"&&typeof O!="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O)&&(U+=K.storage/Float32Array.BYTES_PER_ELEMENT)}}else x(b,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,_,v.__data)}}function x(v,E,y){typeof v=="number"||typeof v=="boolean"?E[0]=v:v.isMatrix3?(E[0]=v.elements[0],E[1]=v.elements[1],E[2]=v.elements[2],E[3]=0,E[4]=v.elements[3],E[5]=v.elements[4],E[6]=v.elements[5],E[7]=0,E[8]=v.elements[6],E[9]=v.elements[7],E[10]=v.elements[8],E[11]=0):ArrayBuffer.isView(v)?E.set(new v.constructor(v.buffer,v.byteOffset,E.length)):v.toArray(E,y)}function S(v,E,y,C){const _=v.value,b=E+"_"+y;if(C[b]===void 0)return typeof _=="number"||typeof _=="boolean"?C[b]=_:ArrayBuffer.isView(_)?C[b]=_.slice():C[b]=_.clone(),!0;{const U=C[b];if(typeof _=="number"||typeof _=="boolean"){if(U!==_)return C[b]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(U.equals(_)===!1)return U.copy(_),!0}}return!1}function m(v){const E=v.uniforms;let y=0;const C=16;for(let b=0,U=E.length;b<U;b++){const D=Array.isArray(E[b])?E[b]:[E[b]];for(let O=0,K=D.length;O<K;O++){const Z=D[O],w=Array.isArray(Z.value)?Z.value:[Z.value];for(let V=0,N=w.length;V<N;V++){const $=w[V],ne=p($),oe=y%C,ie=oe%ne.boundary,fe=oe+ie;y+=ie,fe!==0&&C-fe<ne.storage&&(y+=C-fe),Z.__data=new Float32Array(ne.storage/Float32Array.BYTES_PER_ELEMENT),Z.__offset=y,y+=ne.storage}}}const _=y%C;return _>0&&(y+=C-_),v.__size=y,v.__cache={},this}function p(v){const E={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(E.boundary=4,E.storage=4):v.isVector2?(E.boundary=8,E.storage=8):v.isVector3||v.isColor?(E.boundary=16,E.storage=12):v.isVector4?(E.boundary=16,E.storage=16):v.isMatrix3?(E.boundary=48,E.storage=48):v.isMatrix4?(E.boundary=64,E.storage=64):v.isTexture?Ie("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(E.boundary=16,E.storage=v.byteLength):Ie("WebGLRenderer: Unsupported uniform value type.",v),E}function R(v){const E=v.target;E.removeEventListener("dispose",R);const y=a.indexOf(E.__bindingPointIndex);a.splice(y,1),n.deleteBuffer(r[E.id]),delete r[E.id],delete s[E.id]}function L(){for(const v in r)n.deleteBuffer(r[v]);a=[],r={},s={}}return{bind:l,update:c,dispose:L}}const E_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let cn=null;function T_(){return cn===null&&(cn=new uh(E_,16,16,Ei,Un),cn.name="DFG_LUT",cn.minFilter=Et,cn.magFilter=Et,cn.wrapS=nn,cn.wrapT=nn,cn.generateMipmaps=!1,cn.needsUpdate=!0),cn}class w_{constructor(e={}){const{canvas:t=Gf(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:u=!1,outputBufferType:f=Ht}=e;this.isWebGLRenderer=!0;let x;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=i.getContextAttributes().alpha}else x=a;const S=f,m=new Set([tl,el,jo]),p=new Set([Ht,vn,Tr,wr,Jo,Qo]),R=new Uint32Array(4),L=new Int32Array(4),v=new z;let E=null,y=null;const C=[],_=[];let b=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=gn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const U=this;let D=!1,O=null,K=null,Z=null,w=null;this._outputColorSpace=dt;let V=0,N=0,$=null,ne=-1,oe=null;const ie=new ot,fe=new ot;let Oe=null;const Ke=new Pe(0);let Te=0,Q=t.width,le=t.height,ae=1,Ce=null,De=null;const Re=new ot(0,0,Q,le),at=new ot(0,0,Q,le);let Ge=!1;const Ze=new ol;let qe=!1,Ve=!1;const lt=new rt,ft=new z,mt=new ot,vt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let tt=!1;function Ue(){return $===null?ae:1}let B=i;function Ct(M,k){return t.getContext(M,k)}try{const M={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${$o}`),t.addEventListener("webglcontextlost",ct,!1),t.addEventListener("webglcontextrestored",nt,!1),t.addEventListener("webglcontextcreationerror",sn,!1),B===null){const k="webgl2";if(B=Ct(k,M),B===null)throw Ct(k)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw Xe("WebGLRenderer: "+M.message),M}let Ye,T,g,G,H,J,ce,A,P,I,W,re,j,te,_e,ve,be,F,ue,ee,de,pe,se;function Ee(){Ye=new Tg(B),Ye.init(),de=new g_(B,Ye),T=new _g(B,Ye,e,de),g=new p_(B,Ye),T.reversedDepthBuffer&&u&&g.buffers.depth.setReversed(!0),K=B.createFramebuffer(),Z=B.createFramebuffer(),w=B.createFramebuffer(),G=new Rg(B),H=new e_,J=new m_(B,Ye,g,H,T,de,G),ce=new Eg(U),A=new Ih(B),pe=new mg(B,A),P=new wg(B,A,G,pe),I=new Pg(B,P,A,pe,G),F=new Cg(B,T,J),_e=new xg(H),W=new j0(U,ce,Ye,T,pe,_e),re=new y_(U,H),j=new n_,te=new l_(Ye),be=new pg(U,ce,g,I,x,l),ve=new h_(U,I,T),se=new b_(B,G,T,g),ue=new gg(B,Ye,G),ee=new Ag(B,Ye,G),G.programs=W.programs,U.capabilities=T,U.extensions=Ye,U.properties=H,U.renderLists=j,U.shadowMap=ve,U.state=g,U.info=G}Ee(),S!==Ht&&(b=new Ig(S,t.width,t.height,o,r,s));const Se=new M_(U,B);this.xr=Se,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){const M=Ye.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Ye.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return ae},this.setPixelRatio=function(M){M!==void 0&&(ae=M,this.setSize(Q,le,!1))},this.getSize=function(M){return M.set(Q,le)},this.setSize=function(M,k,Y=!0){if(Se.isPresenting){Ie("WebGLRenderer: Can't change size while VR device is presenting.");return}Q=M,le=k,t.width=Math.floor(M*ae),t.height=Math.floor(k*ae),Y===!0&&(t.style.width=M+"px",t.style.height=k+"px"),b!==null&&b.setSize(t.width,t.height),this.setViewport(0,0,M,k)},this.getDrawingBufferSize=function(M){return M.set(Q*ae,le*ae).floor()},this.setDrawingBufferSize=function(M,k,Y){Q=M,le=k,ae=Y,t.width=Math.floor(M*Y),t.height=Math.floor(k*Y),this.setViewport(0,0,M,k)},this.setEffects=function(M){if(S===Ht){Xe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let k=0;k<M.length;k++)if(M[k].isOutputPass===!0){Ie("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}b.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(ie)},this.getViewport=function(M){return M.copy(Re)},this.setViewport=function(M,k,Y,X){M.isVector4?Re.set(M.x,M.y,M.z,M.w):Re.set(M,k,Y,X),g.viewport(ie.copy(Re).multiplyScalar(ae).round())},this.getScissor=function(M){return M.copy(at)},this.setScissor=function(M,k,Y,X){M.isVector4?at.set(M.x,M.y,M.z,M.w):at.set(M,k,Y,X),g.scissor(fe.copy(at).multiplyScalar(ae).round())},this.getScissorTest=function(){return Ge},this.setScissorTest=function(M){g.setScissorTest(Ge=M)},this.setOpaqueSort=function(M){Ce=M},this.setTransparentSort=function(M){De=M},this.getClearColor=function(M){return M.copy(be.getClearColor())},this.setClearColor=function(){be.setClearColor(...arguments)},this.getClearAlpha=function(){return be.getClearAlpha()},this.setClearAlpha=function(){be.setClearAlpha(...arguments)},this.clear=function(M=!0,k=!0,Y=!0){let X=0;if(M){let q=!1;if($!==null){const ge=$.texture.format;q=m.has(ge)}if(q){const ge=$.texture.type,Me=p.has(ge),me=be.getClearColor(),ye=be.getClearAlpha(),we=me.r,Fe=me.g,ke=me.b;Me?(R[0]=we,R[1]=Fe,R[2]=ke,R[3]=ye,B.clearBufferuiv(B.COLOR,0,R)):(L[0]=we,L[1]=Fe,L[2]=ke,L[3]=ye,B.clearBufferiv(B.COLOR,0,L))}else X|=B.COLOR_BUFFER_BIT}k&&(X|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(X|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),X!==0&&B.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),O=M},this.dispose=function(){t.removeEventListener("webglcontextlost",ct,!1),t.removeEventListener("webglcontextrestored",nt,!1),t.removeEventListener("webglcontextcreationerror",sn,!1),be.dispose(),j.dispose(),te.dispose(),H.dispose(),ce.dispose(),I.dispose(),pe.dispose(),se.dispose(),W.dispose(),Se.dispose(),Se.removeEventListener("sessionstart",Ml),Se.removeEventListener("sessionend",Sl),si.stop()};function ct(M){M.preventDefault(),kl("WebGLRenderer: Context Lost."),D=!0}function nt(){kl("WebGLRenderer: Context Restored."),D=!1;const M=G.autoReset,k=ve.enabled,Y=ve.autoUpdate,X=ve.needsUpdate,q=ve.type;Ee(),G.autoReset=M,ve.enabled=k,ve.autoUpdate=Y,ve.needsUpdate=X,ve.type=q}function sn(M){Xe("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function an(M){const k=M.target;k.removeEventListener("dispose",an),md(k)}function md(M){gd(M),H.remove(M)}function gd(M){const k=H.get(M).programs;k!==void 0&&(k.forEach(function(Y){W.releaseProgram(Y)}),M.isShaderMaterial&&W.releaseShaderCache(M))}this.renderBufferDirect=function(M,k,Y,X,q,ge){k===null&&(k=vt);const Me=q.isMesh&&q.matrixWorld.determinantAffine()<0,me=vd(M,k,Y,X,q);g.setMaterial(X,Me);let ye=Y.index,we=1;if(X.wireframe===!0){if(ye=P.getWireframeAttribute(Y),ye===void 0)return;we=2}const Fe=Y.drawRange,ke=Y.attributes.position;let Ae=Fe.start*we,Qe=(Fe.start+Fe.count)*we;ge!==null&&(Ae=Math.max(Ae,ge.start*we),Qe=Math.min(Qe,(ge.start+ge.count)*we)),ye!==null?(Ae=Math.max(Ae,0),Qe=Math.min(Qe,ye.count)):ke!=null&&(Ae=Math.max(Ae,0),Qe=Math.min(Qe,ke.count));const ht=Qe-Ae;if(ht<0||ht===1/0)return;pe.setup(q,X,me,Y,ye);let ut,je=ue;if(ye!==null&&(ut=A.get(ye),je=ee,je.setIndex(ut)),q.isMesh)X.wireframe===!0?(g.setLineWidth(X.wireframeLinewidth*Ue()),je.setMode(B.LINES)):je.setMode(B.TRIANGLES);else if(q.isLine){let Pt=X.linewidth;Pt===void 0&&(Pt=1),g.setLineWidth(Pt*Ue()),q.isLineSegments?je.setMode(B.LINES):q.isLineLoop?je.setMode(B.LINE_LOOP):je.setMode(B.LINE_STRIP)}else q.isPoints?je.setMode(B.POINTS):q.isSprite&&je.setMode(B.TRIANGLES);if(q.isBatchedMesh)if(Ye.get("WEBGL_multi_draw"))je.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{const Pt=q._multiDrawStarts,xe=q._multiDrawCounts,zt=q._multiDrawCount,$e=ye?A.get(ye).bytesPerElement:1,Xt=H.get(X).currentProgram.getUniforms();for(let on=0;on<zt;on++)Xt.setValue(B,"_gl_DrawID",on),je.render(Pt[on]/$e,xe[on])}else if(q.isInstancedMesh)je.renderInstances(Ae,ht,q.count);else if(Y.isInstancedBufferGeometry){const Pt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,xe=Math.min(Y.instanceCount,Pt);je.renderInstances(Ae,ht,xe)}else je.render(Ae,ht)};function vl(M,k,Y){M.transparent===!0&&M.side===Vt&&M.forceSinglePass===!1?(M.side=Ut,M.needsUpdate=!0,Or(M,k,Y),M.side=ti,M.needsUpdate=!0,Or(M,k,Y),M.side=Vt):Or(M,k,Y)}this.compile=function(M,k,Y=null){Y===null&&(Y=M),y=te.get(Y),y.init(k),_.push(y),Y.traverseVisible(function(q){q.isLight&&q.layers.test(k.layers)&&(y.pushLight(q),q.castShadow&&y.pushShadow(q))}),M!==Y&&M.traverseVisible(function(q){q.isLight&&q.layers.test(k.layers)&&(y.pushLight(q),q.castShadow&&y.pushShadow(q))}),y.setupLights();const X=new Set;return M.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;const ge=q.material;if(ge)if(Array.isArray(ge))for(let Me=0;Me<ge.length;Me++){const me=ge[Me];vl(me,Y,q),X.add(me)}else vl(ge,Y,q),X.add(ge)}),y=_.pop(),X},this.compileAsync=function(M,k,Y=null){const X=this.compile(M,k,Y);return new Promise(q=>{function ge(){if(X.forEach(function(Me){H.get(Me).currentProgram.isReady()&&X.delete(Me)}),X.size===0){q(M);return}setTimeout(ge,10)}Ye.get("KHR_parallel_shader_compile")!==null?ge():setTimeout(ge,10)})};let Vs=null;function _d(M){Vs&&Vs(M)}function Ml(){si.stop()}function Sl(){si.start()}const si=new qu;si.setAnimationLoop(_d),typeof self<"u"&&si.setContext(self),this.setAnimationLoop=function(M){Vs=M,Se.setAnimationLoop(M),M===null?si.stop():si.start()},Se.addEventListener("sessionstart",Ml),Se.addEventListener("sessionend",Sl),this.render=function(M,k){if(k!==void 0&&k.isCamera!==!0){Xe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(M,k);const Y=Se.enabled===!0&&Se.isPresenting===!0,X=b!==null&&($===null||Y)&&b.begin(U,$);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),Se.enabled===!0&&Se.isPresenting===!0&&(b===null||b.isCompositing()===!1)&&(Se.cameraAutoUpdate===!0&&Se.updateCamera(k),k=Se.getCamera()),M.isScene===!0&&M.onBeforeRender(U,M,k,$),y=te.get(M,_.length),y.init(k),y.state.textureUnits=J.getTextureUnits(),_.push(y),lt.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),Ze.setFromProjectionMatrix(lt,hn,k.reversedDepth),Ve=this.localClippingEnabled,qe=_e.init(this.clippingPlanes,Ve),E=j.get(M,C.length),E.init(),C.push(E),Se.enabled===!0&&Se.isPresenting===!0){const Me=U.xr.getDepthSensingMesh();Me!==null&&Hs(Me,k,-1/0,U.sortObjects)}Hs(M,k,0,U.sortObjects),E.finish(),U.sortObjects===!0&&E.sort(Ce,De,k.reversedDepth),tt=Se.enabled===!1||Se.isPresenting===!1||Se.hasDepthSensing()===!1,tt&&be.addToRenderList(E,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),qe===!0&&_e.beginShadows();const q=y.state.shadowsArray;if(ve.render(q,M,k),qe===!0&&_e.endShadows(),(X&&b.hasRenderPass())===!1){const Me=E.opaque,me=E.transmissive;if(y.setupLights(),k.isArrayCamera){const ye=k.cameras;if(me.length>0)for(let we=0,Fe=ye.length;we<Fe;we++){const ke=ye[we];bl(Me,me,M,ke)}tt&&be.render(M);for(let we=0,Fe=ye.length;we<Fe;we++){const ke=ye[we];yl(E,M,ke,ke.viewport)}}else me.length>0&&bl(Me,me,M,k),tt&&be.render(M),yl(E,M,k)}$!==null&&N===0&&(J.updateMultisampleRenderTarget($),J.updateRenderTargetMipmap($)),X&&b.end(U),M.isScene===!0&&M.onAfterRender(U,M,k),pe.resetDefaultState(),ne=-1,oe=null,_.pop(),_.length>0?(y=_[_.length-1],J.setTextureUnits(y.state.textureUnits),qe===!0&&_e.setGlobalState(U.clippingPlanes,y.state.camera)):y=null,C.pop(),C.length>0?E=C[C.length-1]:E=null,O!==null&&O.renderEnd()};function Hs(M,k,Y,X){if(M.visible===!1)return;if(M.layers.test(k.layers)){if(M.isGroup)Y=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(k);else if(M.isLightProbeGrid)y.pushLightProbeGrid(M);else if(M.isLight)y.pushLight(M),M.castShadow&&y.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Ze.intersectsSprite(M)){X&&mt.setFromMatrixPosition(M.matrixWorld).applyMatrix4(lt);const Me=I.update(M),me=M.material;me.visible&&E.push(M,Me,me,Y,mt.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Ze.intersectsObject(M))){const Me=I.update(M),me=M.material;if(X&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),mt.copy(M.boundingSphere.center)):(Me.boundingSphere===null&&Me.computeBoundingSphere(),mt.copy(Me.boundingSphere.center)),mt.applyMatrix4(M.matrixWorld).applyMatrix4(lt)),Array.isArray(me)){const ye=Me.groups;for(let we=0,Fe=ye.length;we<Fe;we++){const ke=ye[we],Ae=me[ke.materialIndex];Ae&&Ae.visible&&E.push(M,Me,Ae,Y,mt.z,ke)}}else me.visible&&E.push(M,Me,me,Y,mt.z,null)}}const ge=M.children;for(let Me=0,me=ge.length;Me<me;Me++)Hs(ge[Me],k,Y,X)}function yl(M,k,Y,X){const{opaque:q,transmissive:ge,transparent:Me}=M;y.setupLightsView(Y),qe===!0&&_e.setGlobalState(U.clippingPlanes,Y),X&&g.viewport(ie.copy(X)),q.length>0&&Fr(q,k,Y),ge.length>0&&Fr(ge,k,Y),Me.length>0&&Fr(Me,k,Y),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function bl(M,k,Y,X){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(y.state.transmissionRenderTarget[X.id]===void 0){const Ae=Ye.has("EXT_color_buffer_half_float")||Ye.has("EXT_color_buffer_float");y.state.transmissionRenderTarget[X.id]=new _n(1,1,{generateMipmaps:!0,type:Ae?Un:Ht,minFilter:Pn,samples:Math.max(4,T.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:He.workingColorSpace})}const ge=y.state.transmissionRenderTarget[X.id],Me=X.viewport||ie;ge.setSize(Me.z*U.transmissionResolutionScale,Me.w*U.transmissionResolutionScale);const me=U.getRenderTarget(),ye=U.getActiveCubeFace(),we=U.getActiveMipmapLevel();U.setRenderTarget(ge),U.getClearColor(Ke),Te=U.getClearAlpha(),Te<1&&U.setClearColor(16777215,.5),U.clear(),tt&&be.render(Y);const Fe=U.toneMapping;U.toneMapping=gn;const ke=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),y.setupLightsView(X),qe===!0&&_e.setGlobalState(U.clippingPlanes,X),Fr(M,Y,X),J.updateMultisampleRenderTarget(ge),J.updateRenderTargetMipmap(ge),Ye.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let Qe=0,ht=k.length;Qe<ht;Qe++){const ut=k[Qe],{object:je,geometry:Pt,material:xe,group:zt}=ut;if(xe.side===Vt&&je.layers.test(X.layers)){const $e=xe.side;xe.side=Ut,xe.needsUpdate=!0,El(je,Y,X,Pt,xe,zt),xe.side=$e,xe.needsUpdate=!0,Ae=!0}}Ae===!0&&(J.updateMultisampleRenderTarget(ge),J.updateRenderTargetMipmap(ge))}U.setRenderTarget(me,ye,we),U.setClearColor(Ke,Te),ke!==void 0&&(X.viewport=ke),U.toneMapping=Fe}function Fr(M,k,Y){const X=k.isScene===!0?k.overrideMaterial:null;for(let q=0,ge=M.length;q<ge;q++){const Me=M[q],{object:me,geometry:ye,group:we}=Me;let Fe=Me.material;Fe.allowOverride===!0&&X!==null&&(Fe=X),me.layers.test(Y.layers)&&El(me,k,Y,ye,Fe,we)}}function El(M,k,Y,X,q,ge){M.onBeforeRender(U,k,Y,X,q,ge),M.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),q.onBeforeRender(U,k,Y,X,M,ge),q.transparent===!0&&q.side===Vt&&q.forceSinglePass===!1?(q.side=Ut,q.needsUpdate=!0,U.renderBufferDirect(Y,k,X,q,M,ge),q.side=ti,q.needsUpdate=!0,U.renderBufferDirect(Y,k,X,q,M,ge),q.side=Vt):U.renderBufferDirect(Y,k,X,q,M,ge),M.onAfterRender(U,k,Y,X,q,ge)}function Or(M,k,Y){k.isScene!==!0&&(k=vt);const X=H.get(M),q=y.state.lights,ge=y.state.shadowsArray,Me=q.state.version,me=W.getParameters(M,q.state,ge,k,Y,y.state.lightProbeGridArray),ye=W.getProgramCacheKey(me);let we=X.programs;X.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?k.environment:null,X.fog=k.fog;const Fe=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;X.envMap=ce.get(M.envMap||X.environment,Fe),X.envMapRotation=X.environment!==null&&M.envMap===null?k.environmentRotation:M.envMapRotation,we===void 0&&(M.addEventListener("dispose",an),we=new Map,X.programs=we);let ke=we.get(ye);if(ke!==void 0){if(X.currentProgram===ke&&X.lightsStateVersion===Me)return wl(M,me),ke}else me.uniforms=W.getUniforms(M),O!==null&&M.isNodeMaterial&&O.build(M,Y,me),M.onBeforeCompile(me,U),ke=W.acquireProgram(me,ye),we.set(ye,ke),X.uniforms=me.uniforms;const Ae=X.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ae.clippingPlanes=_e.uniform),wl(M,me),X.needsLights=Sd(M),X.lightsStateVersion=Me,X.needsLights&&(Ae.ambientLightColor.value=q.state.ambient,Ae.lightProbe.value=q.state.probe,Ae.directionalLights.value=q.state.directional,Ae.directionalLightShadows.value=q.state.directionalShadow,Ae.spotLights.value=q.state.spot,Ae.spotLightShadows.value=q.state.spotShadow,Ae.rectAreaLights.value=q.state.rectArea,Ae.ltc_1.value=q.state.rectAreaLTC1,Ae.ltc_2.value=q.state.rectAreaLTC2,Ae.pointLights.value=q.state.point,Ae.pointLightShadows.value=q.state.pointShadow,Ae.hemisphereLights.value=q.state.hemi,Ae.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Ae.spotLightMatrix.value=q.state.spotLightMatrix,Ae.spotLightMap.value=q.state.spotLightMap,Ae.pointShadowMatrix.value=q.state.pointShadowMatrix),X.lightProbeGrid=y.state.lightProbeGridArray.length>0,X.currentProgram=ke,X.uniformsList=null,ke}function Tl(M){if(M.uniformsList===null){const k=M.currentProgram.getUniforms();M.uniformsList=vs.seqWithValue(k.seq,M.uniforms)}return M.uniformsList}function wl(M,k){const Y=H.get(M);Y.outputColorSpace=k.outputColorSpace,Y.batching=k.batching,Y.batchingColor=k.batchingColor,Y.instancing=k.instancing,Y.instancingColor=k.instancingColor,Y.instancingMorph=k.instancingMorph,Y.skinning=k.skinning,Y.morphTargets=k.morphTargets,Y.morphNormals=k.morphNormals,Y.morphColors=k.morphColors,Y.morphTargetsCount=k.morphTargetsCount,Y.numClippingPlanes=k.numClippingPlanes,Y.numIntersection=k.numClipIntersection,Y.vertexAlphas=k.vertexAlphas,Y.vertexTangents=k.vertexTangents,Y.toneMapping=k.toneMapping}function xd(M,k){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;v.setFromMatrixPosition(k.matrixWorld);for(let Y=0,X=M.length;Y<X;Y++){const q=M[Y];if(q.texture!==null&&q.boundingBox.containsPoint(v))return q}return null}function vd(M,k,Y,X,q){k.isScene!==!0&&(k=vt),J.resetTextureUnits();const ge=k.fog,Me=X.isMeshStandardMaterial||X.isMeshLambertMaterial||X.isMeshPhongMaterial?k.environment:null,me=$===null?U.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:He.workingColorSpace,ye=X.isMeshStandardMaterial||X.isMeshLambertMaterial&&!X.envMap||X.isMeshPhongMaterial&&!X.envMap,we=ce.get(X.envMap||Me,ye),Fe=X.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,ke=!!Y.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Ae=!!Y.morphAttributes.position,Qe=!!Y.morphAttributes.normal,ht=!!Y.morphAttributes.color;let ut=gn;X.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(ut=U.toneMapping);const je=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Pt=je!==void 0?je.length:0,xe=H.get(X),zt=y.state.lights;if(qe===!0&&(Ve===!0||M!==oe)){const it=M===oe&&X.id===ne;_e.setState(X,M,it)}let $e=!1;X.version===xe.__version?(xe.needsLights&&xe.lightsStateVersion!==zt.state.version||xe.outputColorSpace!==me||q.isBatchedMesh&&xe.batching===!1||!q.isBatchedMesh&&xe.batching===!0||q.isBatchedMesh&&xe.batchingColor===!0&&q.colorTexture===null||q.isBatchedMesh&&xe.batchingColor===!1&&q.colorTexture!==null||q.isInstancedMesh&&xe.instancing===!1||!q.isInstancedMesh&&xe.instancing===!0||q.isSkinnedMesh&&xe.skinning===!1||!q.isSkinnedMesh&&xe.skinning===!0||q.isInstancedMesh&&xe.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&xe.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&xe.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&xe.instancingMorph===!1&&q.morphTexture!==null||xe.envMap!==we||X.fog===!0&&xe.fog!==ge||xe.numClippingPlanes!==void 0&&(xe.numClippingPlanes!==_e.numPlanes||xe.numIntersection!==_e.numIntersection)||xe.vertexAlphas!==Fe||xe.vertexTangents!==ke||xe.morphTargets!==Ae||xe.morphNormals!==Qe||xe.morphColors!==ht||xe.toneMapping!==ut||xe.morphTargetsCount!==Pt||!!xe.lightProbeGrid!=y.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,xe.__version=X.version);let Xt=xe.currentProgram;$e===!0&&(Xt=Or(X,k,q),O&&X.isNodeMaterial&&O.onUpdateProgram(X,Xt,xe));let on=!1,Bn=!1,Ai=!1;const et=Xt.getUniforms(),pt=xe.uniforms;if(g.useProgram(Xt.program)&&(on=!0,Bn=!0,Ai=!0),X.id!==ne&&(ne=X.id,Bn=!0),xe.needsLights){const it=xd(y.state.lightProbeGridArray,q);xe.lightProbeGrid!==it&&(xe.lightProbeGrid=it,Bn=!0)}if(on||oe!==M){g.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),et.setValue(B,"projectionMatrix",M.projectionMatrix),et.setValue(B,"viewMatrix",M.matrixWorldInverse);const kn=et.map.cameraPosition;kn!==void 0&&kn.setValue(B,ft.setFromMatrixPosition(M.matrixWorld)),T.logarithmicDepthBuffer&&et.setValue(B,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&et.setValue(B,"isOrthographic",M.isOrthographicCamera===!0),oe!==M&&(oe=M,Bn=!0,Ai=!0)}if(xe.needsLights&&(zt.state.directionalShadowMap.length>0&&et.setValue(B,"directionalShadowMap",zt.state.directionalShadowMap,J),zt.state.spotShadowMap.length>0&&et.setValue(B,"spotShadowMap",zt.state.spotShadowMap,J),zt.state.pointShadowMap.length>0&&et.setValue(B,"pointShadowMap",zt.state.pointShadowMap,J)),q.isSkinnedMesh){et.setOptional(B,q,"bindMatrix"),et.setOptional(B,q,"bindMatrixInverse");const it=q.skeleton;it&&(it.boneTexture===null&&it.computeBoneTexture(),et.setValue(B,"boneTexture",it.boneTexture,J))}q.isBatchedMesh&&(et.setOptional(B,q,"batchingTexture"),et.setValue(B,"batchingTexture",q._matricesTexture,J),et.setOptional(B,q,"batchingIdTexture"),et.setValue(B,"batchingIdTexture",q._indirectTexture,J),et.setOptional(B,q,"batchingColorTexture"),q._colorsTexture!==null&&et.setValue(B,"batchingColorTexture",q._colorsTexture,J));const zn=Y.morphAttributes;if((zn.position!==void 0||zn.normal!==void 0||zn.color!==void 0)&&F.update(q,Y,Xt),(Bn||xe.receiveShadow!==q.receiveShadow)&&(xe.receiveShadow=q.receiveShadow,et.setValue(B,"receiveShadow",q.receiveShadow)),(X.isMeshStandardMaterial||X.isMeshLambertMaterial||X.isMeshPhongMaterial)&&X.envMap===null&&k.environment!==null&&(pt.envMapIntensity.value=k.environmentIntensity),pt.dfgLUT!==void 0&&(pt.dfgLUT.value=T_()),Bn){if(et.setValue(B,"toneMappingExposure",U.toneMappingExposure),xe.needsLights&&Md(pt,Ai),ge&&X.fog===!0&&re.refreshFogUniforms(pt,ge),re.refreshMaterialUniforms(pt,X,ae,le,y.state.transmissionRenderTarget[M.id]),xe.needsLights&&xe.lightProbeGrid){const it=xe.lightProbeGrid;pt.probesSH.value=it.texture,pt.probesMin.value.copy(it.boundingBox.min),pt.probesMax.value.copy(it.boundingBox.max),pt.probesResolution.value.copy(it.resolution)}vs.upload(B,Tl(xe),pt,J)}if(X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(vs.upload(B,Tl(xe),pt,J),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&et.setValue(B,"center",q.center),et.setValue(B,"modelViewMatrix",q.modelViewMatrix),et.setValue(B,"normalMatrix",q.normalMatrix),et.setValue(B,"modelMatrix",q.matrixWorld),X.uniformsGroups!==void 0){const it=X.uniformsGroups;for(let kn=0,Ri=it.length;kn<Ri;kn++){const Al=it[kn];se.update(Al,Xt),se.bind(Al,Xt)}}return Xt}function Md(M,k){M.ambientLightColor.needsUpdate=k,M.lightProbe.needsUpdate=k,M.directionalLights.needsUpdate=k,M.directionalLightShadows.needsUpdate=k,M.pointLights.needsUpdate=k,M.pointLightShadows.needsUpdate=k,M.spotLights.needsUpdate=k,M.spotLightShadows.needsUpdate=k,M.rectAreaLights.needsUpdate=k,M.hemisphereLights.needsUpdate=k}function Sd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return V},this.getActiveMipmapLevel=function(){return N},this.getRenderTarget=function(){return $},this.setRenderTargetTextures=function(M,k,Y){const X=H.get(M);X.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,X.__autoAllocateDepthBuffer===!1&&(X.__useRenderToTexture=!1),H.get(M.texture).__webglTexture=k,H.get(M.depthTexture).__webglTexture=X.__autoAllocateDepthBuffer?void 0:Y,X.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,k){const Y=H.get(M);Y.__webglFramebuffer=k,Y.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(M,k=0,Y=0){$=M,V=k,N=Y;let X=null,q=!1,ge=!1;if(M){const me=H.get(M);if(me.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(B.FRAMEBUFFER,me.__webglFramebuffer),ie.copy(M.viewport),fe.copy(M.scissor),Oe=M.scissorTest,g.viewport(ie),g.scissor(fe),g.setScissorTest(Oe),ne=-1;return}else if(me.__webglFramebuffer===void 0)J.setupRenderTarget(M);else if(me.__hasExternalTextures)J.rebindTextures(M,H.get(M.texture).__webglTexture,H.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Fe=M.depthTexture;if(me.__boundDepthTexture!==Fe){if(Fe!==null&&H.has(Fe)&&(M.width!==Fe.image.width||M.height!==Fe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");J.setupDepthRenderbuffer(M)}}const ye=M.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(ge=!0);const we=H.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(we[k])?X=we[k][Y]:X=we[k],q=!0):M.samples>0&&J.useMultisampledRTT(M)===!1?X=H.get(M).__webglMultisampledFramebuffer:Array.isArray(we)?X=we[Y]:X=we,ie.copy(M.viewport),fe.copy(M.scissor),Oe=M.scissorTest}else ie.copy(Re).multiplyScalar(ae).floor(),fe.copy(at).multiplyScalar(ae).floor(),Oe=Ge;if(Y!==0&&(X=K),g.bindFramebuffer(B.FRAMEBUFFER,X)&&g.drawBuffers(M,X),g.viewport(ie),g.scissor(fe),g.setScissorTest(Oe),q){const me=H.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+k,me.__webglTexture,Y)}else if(ge){const me=k;for(let ye=0;ye<M.textures.length;ye++){const we=H.get(M.textures[ye]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+ye,we.__webglTexture,Y,me)}}else if(M!==null&&Y!==0){const me=H.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,me.__webglTexture,Y)}ne=-1},this.readRenderTargetPixels=function(M,k,Y,X,q,ge,Me,me=0){if(!(M&&M.isWebGLRenderTarget)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=H.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Me!==void 0&&(ye=ye[Me]),ye){g.bindFramebuffer(B.FRAMEBUFFER,ye);try{const we=M.textures[me],Fe=we.format,ke=we.type;if(M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+me),!T.textureFormatReadable(Fe)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!T.textureTypeReadable(ke)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=M.width-X&&Y>=0&&Y<=M.height-q&&B.readPixels(k,Y,X,q,de.convert(Fe),de.convert(ke),ge)}finally{const we=$!==null?H.get($).__webglFramebuffer:null;g.bindFramebuffer(B.FRAMEBUFFER,we)}}},this.readRenderTargetPixelsAsync=async function(M,k,Y,X,q,ge,Me,me=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=H.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Me!==void 0&&(ye=ye[Me]),ye)if(k>=0&&k<=M.width-X&&Y>=0&&Y<=M.height-q){g.bindFramebuffer(B.FRAMEBUFFER,ye);const we=M.textures[me],Fe=we.format,ke=we.type;if(M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+me),!T.textureFormatReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!T.textureTypeReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ae=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,Ae),B.bufferData(B.PIXEL_PACK_BUFFER,ge.byteLength,B.STREAM_READ),B.readPixels(k,Y,X,q,de.convert(Fe),de.convert(ke),0);const Qe=$!==null?H.get($).__webglFramebuffer:null;g.bindFramebuffer(B.FRAMEBUFFER,Qe);const ht=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Vf(B,ht,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,Ae),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,ge),B.deleteBuffer(Ae),B.deleteSync(ht),ge}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,k=null,Y=0){const X=Math.pow(2,-Y),q=Math.floor(M.image.width*X),ge=Math.floor(M.image.height*X),Me=k!==null?k.x:0,me=k!==null?k.y:0;J.setTexture2D(M,0),B.copyTexSubImage2D(B.TEXTURE_2D,Y,0,0,Me,me,q,ge),g.unbindTexture()},this.copyTextureToTexture=function(M,k,Y=null,X=null,q=0,ge=0){let Me,me,ye,we,Fe,ke,Ae,Qe,ht;const ut=M.isCompressedTexture?M.mipmaps[ge]:M.image;if(Y!==null)Me=Y.max.x-Y.min.x,me=Y.max.y-Y.min.y,ye=Y.isBox3?Y.max.z-Y.min.z:1,we=Y.min.x,Fe=Y.min.y,ke=Y.isBox3?Y.min.z:0;else{const pt=Math.pow(2,-q);Me=Math.floor(ut.width*pt),me=Math.floor(ut.height*pt),M.isDataArrayTexture?ye=ut.depth:M.isData3DTexture?ye=Math.floor(ut.depth*pt):ye=1,we=0,Fe=0,ke=0}X!==null?(Ae=X.x,Qe=X.y,ht=X.z):(Ae=0,Qe=0,ht=0);const je=de.convert(k.format),Pt=de.convert(k.type);let xe;k.isData3DTexture?(J.setTexture3D(k,0),xe=B.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(J.setTexture2DArray(k,0),xe=B.TEXTURE_2D_ARRAY):(J.setTexture2D(k,0),xe=B.TEXTURE_2D),g.activeTexture(B.TEXTURE0),g.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,k.flipY),g.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),g.pixelStorei(B.UNPACK_ALIGNMENT,k.unpackAlignment);const zt=g.getParameter(B.UNPACK_ROW_LENGTH),$e=g.getParameter(B.UNPACK_IMAGE_HEIGHT),Xt=g.getParameter(B.UNPACK_SKIP_PIXELS),on=g.getParameter(B.UNPACK_SKIP_ROWS),Bn=g.getParameter(B.UNPACK_SKIP_IMAGES);g.pixelStorei(B.UNPACK_ROW_LENGTH,ut.width),g.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ut.height),g.pixelStorei(B.UNPACK_SKIP_PIXELS,we),g.pixelStorei(B.UNPACK_SKIP_ROWS,Fe),g.pixelStorei(B.UNPACK_SKIP_IMAGES,ke);const Ai=M.isDataArrayTexture||M.isData3DTexture,et=k.isDataArrayTexture||k.isData3DTexture;if(M.isDepthTexture){const pt=H.get(M),zn=H.get(k),it=H.get(pt.__renderTarget),kn=H.get(zn.__renderTarget);g.bindFramebuffer(B.READ_FRAMEBUFFER,it.__webglFramebuffer),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,kn.__webglFramebuffer);for(let Ri=0;Ri<ye;Ri++)Ai&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(M).__webglTexture,q,ke+Ri),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(k).__webglTexture,ge,ht+Ri)),B.blitFramebuffer(we,Fe,Me,me,Ae,Qe,Me,me,B.DEPTH_BUFFER_BIT,B.NEAREST);g.bindFramebuffer(B.READ_FRAMEBUFFER,null),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(q!==0||M.isRenderTargetTexture||H.has(M)){const pt=H.get(M),zn=H.get(k);g.bindFramebuffer(B.READ_FRAMEBUFFER,Z),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,w);for(let it=0;it<ye;it++)Ai?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,pt.__webglTexture,q,ke+it):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,pt.__webglTexture,q),et?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,zn.__webglTexture,ge,ht+it):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,zn.__webglTexture,ge),q!==0?B.blitFramebuffer(we,Fe,Me,me,Ae,Qe,Me,me,B.COLOR_BUFFER_BIT,B.NEAREST):et?B.copyTexSubImage3D(xe,ge,Ae,Qe,ht+it,we,Fe,Me,me):B.copyTexSubImage2D(xe,ge,Ae,Qe,we,Fe,Me,me);g.bindFramebuffer(B.READ_FRAMEBUFFER,null),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else et?M.isDataTexture||M.isData3DTexture?B.texSubImage3D(xe,ge,Ae,Qe,ht,Me,me,ye,je,Pt,ut.data):k.isCompressedArrayTexture?B.compressedTexSubImage3D(xe,ge,Ae,Qe,ht,Me,me,ye,je,ut.data):B.texSubImage3D(xe,ge,Ae,Qe,ht,Me,me,ye,je,Pt,ut):M.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,ge,Ae,Qe,Me,me,je,Pt,ut.data):M.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,ge,Ae,Qe,ut.width,ut.height,je,ut.data):B.texSubImage2D(B.TEXTURE_2D,ge,Ae,Qe,Me,me,je,Pt,ut);g.pixelStorei(B.UNPACK_ROW_LENGTH,zt),g.pixelStorei(B.UNPACK_IMAGE_HEIGHT,$e),g.pixelStorei(B.UNPACK_SKIP_PIXELS,Xt),g.pixelStorei(B.UNPACK_SKIP_ROWS,on),g.pixelStorei(B.UNPACK_SKIP_IMAGES,Bn),ge===0&&k.generateMipmaps&&B.generateMipmap(xe),g.unbindTexture()},this.initRenderTarget=function(M){H.get(M).__webglFramebuffer===void 0&&J.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?J.setTextureCube(M,0):M.isData3DTexture?J.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?J.setTexture2DArray(M,0):J.setTexture2D(M,0),g.unbindTexture()},this.resetState=function(){V=0,N=0,$=null,g.reset(),pe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return hn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=He._getDrawingBufferColorSpace(e),t.unpackColorSpace=He._getUnpackColorSpace()}}const A_={back:"/cards/standard/back.webp","blue-1":"/cards/standard/blue-1.webp","blue-10":"/cards/standard/blue-10.webp","blue-11":"/cards/standard/blue-11.webp","blue-12":"/cards/standard/blue-12.webp","blue-13":"/cards/standard/blue-13.webp","blue-2":"/cards/standard/blue-2.webp","blue-3":"/cards/standard/blue-3.webp","blue-4":"/cards/standard/blue-4.webp","blue-5":"/cards/standard/blue-5.webp","blue-6":"/cards/standard/blue-6.webp","blue-7":"/cards/standard/blue-7.webp","blue-8":"/cards/standard/blue-8.webp","blue-9":"/cards/standard/blue-9.webp","green-1":"/cards/standard/green-1.webp","green-10":"/cards/standard/green-10.webp","green-11":"/cards/standard/green-11.webp","green-12":"/cards/standard/green-12.webp","green-13":"/cards/standard/green-13.webp","green-2":"/cards/standard/green-2.webp","green-3":"/cards/standard/green-3.webp","green-4":"/cards/standard/green-4.webp","green-5":"/cards/standard/green-5.webp","green-6":"/cards/standard/green-6.webp","green-7":"/cards/standard/green-7.webp","green-8":"/cards/standard/green-8.webp","green-9":"/cards/standard/green-9.webp","jester-1":"/cards/standard/jester-1.webp","jester-2":"/cards/standard/jester-2.webp","jester-3":"/cards/standard/jester-3.webp","jester-4":"/cards/standard/jester-4.webp","mage-1":"/cards/standard/mage-1.webp","mage-2":"/cards/standard/mage-2.webp","mage-3":"/cards/standard/mage-3.webp","mage-4":"/cards/standard/mage-4.webp","red-1":"/cards/standard/red-1.webp","red-10":"/cards/standard/red-10.webp","red-11":"/cards/standard/red-11.webp","red-12":"/cards/standard/red-12.webp","red-13":"/cards/standard/red-13.webp","red-2":"/cards/standard/red-2.webp","red-3":"/cards/standard/red-3.webp","red-4":"/cards/standard/red-4.webp","red-5":"/cards/standard/red-5.webp","red-6":"/cards/standard/red-6.webp","red-7":"/cards/standard/red-7.webp","red-8":"/cards/standard/red-8.webp","red-9":"/cards/standard/red-9.webp","yellow-1":"/cards/standard/yellow-1.webp","yellow-10":"/cards/standard/yellow-10.webp","yellow-11":"/cards/standard/yellow-11.webp","yellow-12":"/cards/standard/yellow-12.webp","yellow-13":"/cards/standard/yellow-13.webp","yellow-2":"/cards/standard/yellow-2.webp","yellow-3":"/cards/standard/yellow-3.webp","yellow-4":"/cards/standard/yellow-4.webp","yellow-5":"/cards/standard/yellow-5.webp","yellow-6":"/cards/standard/yellow-6.webp","yellow-7":"/cards/standard/yellow-7.webp","yellow-8":"/cards/standard/yellow-8.webp","yellow-9":"/cards/standard/yellow-9.webp"},R_="/cards/standard/atlas.webp",C_=8,bt={width:256,height:400,gutter:4},ul={back:{col:0,row:0,edge:"#e1dfe7"},"blue-1":{col:1,row:0,edge:"#c2cbd6"},"blue-10":{col:2,row:0,edge:"#c7d1df"},"blue-11":{col:3,row:0,edge:"#c4ceda"},"blue-12":{col:4,row:0,edge:"#c4cdd7"},"blue-13":{col:5,row:0,edge:"#c5ceda"},"blue-2":{col:6,row:0,edge:"#c2cbd5"},"blue-3":{col:7,row:0,edge:"#c1cbd9"},"blue-4":{col:0,row:1,edge:"#c1cbd9"},"blue-5":{col:1,row:1,edge:"#c4cdd9"},"blue-6":{col:2,row:1,edge:"#c7d0dd"},"blue-7":{col:3,row:1,edge:"#c5cfdb"},"blue-8":{col:4,row:1,edge:"#c3ccd8"},"blue-9":{col:5,row:1,edge:"#c9d3e1"},"green-1":{col:6,row:1,edge:"#cdd8cc"},"green-10":{col:7,row:1,edge:"#d0dacf"},"green-11":{col:0,row:2,edge:"#d2dbd2"},"green-12":{col:1,row:2,edge:"#d1dad1"},"green-13":{col:2,row:2,edge:"#ced8cd"},"green-2":{col:3,row:2,edge:"#cdd8cc"},"green-3":{col:4,row:2,edge:"#cbd5ca"},"green-4":{col:5,row:2,edge:"#c9d2c8"},"green-5":{col:6,row:2,edge:"#ced7cd"},"green-6":{col:7,row:2,edge:"#cdd7cc"},"green-7":{col:0,row:3,edge:"#cbd4c9"},"green-8":{col:1,row:3,edge:"#cdd6cb"},"green-9":{col:2,row:3,edge:"#d0dacf"},"jester-1":{col:3,row:3,edge:"#edc3b4"},"jester-2":{col:4,row:3,edge:"#e4d29b"},"jester-3":{col:5,row:3,edge:"#bfd0b7"},"jester-4":{col:6,row:3,edge:"#bcd2e7"},"mage-1":{col:7,row:3,edge:"#ecc2b3"},"mage-2":{col:0,row:4,edge:"#e2d099"},"mage-3":{col:1,row:4,edge:"#c5d7be"},"mage-4":{col:2,row:4,edge:"#b5cade"},"red-1":{col:3,row:4,edge:"#d2bebb"},"red-10":{col:4,row:4,edge:"#d9c7c0"},"red-11":{col:5,row:4,edge:"#dbc7c0"},"red-12":{col:6,row:4,edge:"#dbc8c0"},"red-13":{col:7,row:4,edge:"#dcc8c2"},"red-2":{col:0,row:5,edge:"#d1bebb"},"red-3":{col:1,row:5,edge:"#d0bcb6"},"red-4":{col:2,row:5,edge:"#d0bbb6"},"red-5":{col:3,row:5,edge:"#c3aba6"},"red-6":{col:4,row:5,edge:"#c1aaa5"},"red-7":{col:5,row:5,edge:"#d0b7b3"},"red-8":{col:6,row:5,edge:"#d0b8b3"},"red-9":{col:7,row:5,edge:"#d9c8c1"},"yellow-1":{col:0,row:6,edge:"#d6ceba"},"yellow-10":{col:1,row:6,edge:"#d6cbb6"},"yellow-11":{col:2,row:6,edge:"#d7cfba"},"yellow-12":{col:3,row:6,edge:"#d7ceb9"},"yellow-13":{col:4,row:6,edge:"#d9cfb9"},"yellow-2":{col:5,row:6,edge:"#d7cfba"},"yellow-3":{col:6,row:6,edge:"#d6ceb7"},"yellow-4":{col:7,row:6,edge:"#d4cdb7"},"yellow-5":{col:0,row:7,edge:"#d7cfbc"},"yellow-6":{col:1,row:7,edge:"#d6cfbc"},"yellow-7":{col:2,row:7,edge:"#dbd0b7"},"yellow-8":{col:3,row:7,edge:"#d1c6ae"},"yellow-9":{col:4,row:7,edge:"#d6cbb5"}};function ed(n){return`${"./".replace(/\/$/,"")}/${n.replace(/^\//,"")}`}const xn={red:{label:"Red",runeName:"Kenaz",runePath:"M7.5 2 L2.5 8 L7.5 14"},yellow:{label:"Yellow",runeName:"Sowilo",runePath:"M7.5 2 L3 6 L7 10 L2.5 14"},green:{label:"Green",runeName:"Berkano",runePath:"M2.5 2 L2.5 14 M2.5 2 L7.5 5 L2.5 8 M2.5 8 L7.5 11 L2.5 14"},blue:{label:"Blue",runeName:"Laguz",runePath:"M3 2 L3 14 M3 2 L7.5 6"}};function dl(n){const e=xn[n],t="http://www.w3.org/2000/svg",i=document.createElementNS(t,"svg");i.setAttribute("viewBox","0 0 10 16"),i.setAttribute("class","rune"),i.setAttribute("aria-hidden","true");const r=document.createElementNS(t,"path");return r.setAttribute("d",e.runePath),r.setAttribute("fill","none"),r.setAttribute("stroke","currentColor"),r.setAttribute("stroke-width","1.6"),r.setAttribute("stroke-linecap","round"),r.setAttribute("stroke-linejoin","round"),i.append(r),i}function Gs(n){return n.kind==="mage"?"Wizard":n.kind==="jester"?"Jester":`${xn[n.suit].label} ${n.value}`}function P_(n){const e=document.createElement("div");e.className=`card card--${n.kind}`,e.dataset.card=n.id,e.setAttribute("aria-label",Gs(n)),n.kind==="pip"&&e.classList.add(`card--${n.suit}`);const t=A_[n.id];if(t!==void 0)return e.classList.add("card--art"),e.append(L_(t)),e;if(n.kind==="pip"){const s=document.createElement("span");s.className="card__corner",s.textContent=String(n.value);const a=document.createElement("span");return a.className="card__value",a.textContent=String(n.value),e.append(s,dl(n.suit),a),e}const i=document.createElement("span");i.className="card__glyph",i.textContent=n.kind==="mage"?"★":"?";const r=document.createElement("span");return r.className="card__label",r.textContent=n.kind==="mage"?"Wizard":"Jester",e.append(i,r),e}function L_(n){const e=document.createElement("img");return e.className="card__art",e.src=ed(n),e.alt="",e.draggable=!1,e}const Ms=bt.width+2*bt.gutter,Ss=bt.height+2*bt.gutter;function I_(){return["back",...Pr().map(n=>n.id)]}async function D_(n){const e=I_(),t=e.filter(a=>ul[a]===void 0),i=await F_(R_).catch(()=>null),r=i!==null&&t.length===0?N_(i):await U_(e,i);r.texture.colorSpace=dt,r.texture.anisotropy=n,r.texture.magFilter=Et,r.texture.minFilter=Pn,r.texture.wrapS=nn,r.texture.wrapT=nn,r.texture.generateMipmaps=!0,r.texture.needsUpdate=!0;const s=r.entries.get("back")??{face:{u0:0,u1:1,v0:0,v1:1},edge:new Pe("#2a2333")};return{texture:r.texture,back:s,art:a=>r.entries.get(a)??s}}function N_(n){const e=new Map;for(const[i,r]of Object.entries(ul))e.set(i,{face:td(r.col,r.row,n.width,n.height),edge:new Pe(r.edge)});return{texture:new Rt(n),entries:e}}async function U_(n,e){const t=C_,i=Math.ceil(n.length/t),r=document.createElement("canvas");r.width=t*Ms,r.height=i*Ss;const s=r.getContext("2d");if(s===null)throw new Error("No 2D context for the card atlas");const a=new Map(Pr().map(l=>[l.id,l])),o=new Map;return n.forEach((l,c)=>{const d=c%t,h=Math.floor(c/t),u=d*Ms+bt.gutter,f=h*Ss+bt.gutter,x=ul[l];let S;x!==void 0&&e!==null?(s.drawImage(e,x.col*Ms+bt.gutter,x.row*Ss+bt.gutter,bt.width,bt.height,u,f,bt.width,bt.height),S=x.edge):(s.save(),s.translate(u,f),S=l==="back"?id(s):B_(s,a.get(l)??null),s.restore()),o.set(l,{face:td(d,h,r.width,r.height),edge:new Pe(S)})}),{texture:new Sn(r),entries:o}}function td(n,e,t,i){const r=n*Ms+bt.gutter,s=e*Ss+bt.gutter;return{u0:r/t,u1:(r+bt.width)/t,v0:1-(s+bt.height)/i,v1:1-s/i}}function F_(n){return new Promise((e,t)=>{const i=new Image;i.decoding="async",i.addEventListener("load",()=>e(i)),i.addEventListener("error",()=>t(new Error(`Card atlas image ${n} is missing`))),i.src=ed(n)})}const xi=bt.width,dn=bt.height,O_=26,nd={red:"#c8402f",yellow:"#bb8409",green:"#2d8a4c",blue:"#3366ba"};function Is(n){n.beginPath(),n.roundRect(4,4,xi-8,dn-8,O_)}function B_(n,e){if(e===null)return id(n);if(e.kind==="pip"){const r=nd[e.suit];return Is(n),n.fillStyle="#fbf7ee",n.fill(),n.lineWidth=8,n.strokeStyle=r,n.stroke(),n.fillStyle=r,n.textAlign="center",n.textBaseline="middle",n.font="800 132px system-ui, sans-serif",n.fillText(String(e.value),xi/2,dn*.44),n.font="700 40px system-ui, sans-serif",n.textAlign="left",n.textBaseline="top",n.fillText(String(e.value),28,24),z_(n,e.suit,xi/2,dn*.74,72),r}const t=e.kind==="mage",i=n.createLinearGradient(0,0,xi,dn);return i.addColorStop(0,t?"#8a5cf0":"#ffe9a8"),i.addColorStop(1,t?"#4b23a8":"#dfa62a"),Is(n),n.fillStyle=i,n.fill(),n.lineWidth=8,n.strokeStyle=t?"#37187d":"#96690f",n.stroke(),n.fillStyle=t?"#ffffff":"#4a370f",n.textAlign="center",n.textBaseline="middle",n.font="700 150px system-ui, sans-serif",n.fillText(t?"★":"?",xi/2,dn*.42),n.font="800 34px system-ui, sans-serif",n.fillText(t?"WIZARD":"JESTER",xi/2,dn*.78),t?"#37187d":"#96690f"}function id(n){Is(n),n.fillStyle="#241d33",n.fill(),n.lineWidth=8,n.strokeStyle="#6d3fd1",n.stroke(),n.save(),Is(n),n.clip(),n.strokeStyle="rgba(150, 110, 235, 0.55)",n.lineWidth=6;for(let e=-dn;e<xi+dn;e+=26)n.beginPath(),n.moveTo(e,0),n.lineTo(e+dn,dn),n.stroke();return n.restore(),"#2a2333"}function z_(n,e,t,i,r){const s=r/16;n.save(),n.translate(t-5*s,i-8*s),n.scale(s,s),n.strokeStyle=nd[e],n.lineWidth=1.6,n.lineCap="round",n.lineJoin="round",n.stroke(new Path2D(xn[e].runePath)),n.restore()}const fl=(n,e,t)=>n<e?e:n>t?t:n,Yn=(n,e,t)=>n+(e-n)*t,wa=n=>n<.5?4*n*n*n:1-(-2*n+2)**3/2,di=n=>1-(1-n)**3;function k_(n){return 1+(1.34+1)*(n-1)**3+1.34*(n-1)**2}const G_=n=>Math.sin(Math.PI*fl(n,0,1));function V_(n,e){let t=2166136261^e;for(let i=0;i<n.length;i++)t^=n.charCodeAt(i),t=Math.imul(t,16777619);return(t>>>8)%1e4/1e4}const Aa=(n,e)=>V_(n,e)*2-1,Zn=4.55,$i=3.15,mr=0;function H_(n,e){const t=new Ki,i=[],r=m=>(i.push(m),m),s=W_();t.add(s.mesh),i.push(s);const a=new _t(r(new Ps(1,128)),r(new $t({map:r(j_(e)),toneMapped:!1})));a.rotation.x=-Math.PI/2,a.scale.set(Zn,$i,1),a.position.y=mr,t.add(a);const o=new _t(r(new Ls(.978,1.02,160)),r(new $t({map:r(ox()),transparent:!0,depthWrite:!1,opacity:.5})));o.rotation.x=-Math.PI/2,o.scale.set(Zn,$i,1),o.position.y=mr+.006,t.add(o);const l=new _t(r(new Ls(.9,1.3,160)),r(new $t({map:r(ax()),transparent:!0,depthWrite:!1,blending:ni,opacity:.55})));l.rotation.x=-Math.PI/2,l.scale.set(Zn,$i,1),l.position.y=mr+.004,t.add(l);const c=new _t(r(new cl(1,.9,.5,128,1,!0)),r(new Mh({map:r(lx()),roughness:.72,metalness:.04,side:Ut,transparent:!0,depthWrite:!1})));c.scale.set(Zn,1,$i),c.position.y=mr-.25,t.add(c);const d=new _t(r(new Ps(1,96)),r(new $t({map:r(cx()),transparent:!0,depthWrite:!1,blending:ni,opacity:.34})));d.rotation.x=-Math.PI/2,d.scale.set(Zn*1.95,$i*1.95,1),d.position.y=mr-.7,t.add(d),t.add(new Ah(new Pe("#ff3344"),1.55)),t.add(new bh(new Pe("#ffd0b8"),new Pe("#780018"),1.15));const h=new Th(new Pe("#ffe3bb"),320,26,.9,.95,2);h.position.set(0,7.6,1.8),h.target.position.set(0,0,-.2),t.add(h,h.target);const u=new lc(new Pe("#ff001e"),480,34,1.55);u.position.set(-7,3.4,-4.5),t.add(u);const f=new lc(new Pe("#ff001e"),420,34,1.55);f.position.set(7,2.6,-4.2),t.add(f);const x=ux();t.add(x.points),i.push(x);const S=dx();return t.add(S.points),i.push(S),{group:t,update(m){n||S.update(m)},fit(m){s.fit(m)},dispose(){for(const m of i)m.dispose()}}}const Uc=40,mi=2048,$n=1152;function W_(){const n=q_(),e=new wi(1,1),t=new $t({map:n,depthTest:!1,depthWrite:!1,toneMapped:!1}),i=new _t(e,t);i.frustumCulled=!1,i.renderOrder=-100;let r=0;return{mesh:i,fit(s){const a=2*Uc*Math.tan(s.fov/2*Math.PI/180),o=a*s.aspect;i.quaternion.copy(s.quaternion),i.position.set(0,0,-Uc).applyQuaternion(s.quaternion).add(s.position),i.scale.set(o,a,1),!(Math.abs(s.aspect-r)<5e-4)&&(r=s.aspect,X_(n,s.aspect,mi/$n))},dispose(){e.dispose(),n.dispose(),t.dispose()}}}function X_(n,e,t){e>t?(n.repeat.set(1,t/e),n.offset.set(0,(1-t/e)/2)):(n.repeat.set(e/t,1),n.offset.set((1-e/t)/2,0)),n.needsUpdate=!0}function q_(){const n=document.createElement("canvas");n.width=mi,n.height=$n;const e=n.getContext("2d");if(e===null)throw new Error("No 2D context for the stage backdrop");e.fillStyle="#d00028",e.fillRect(0,0,mi,$n),e.save(),e.translate(mi*.5,$n*Z_),Y_(e),e.restore(),$_(e,mi,$n),K_(e,mi,$n),J_(e,mi,$n,5);const t=new Sn(n);return t.colorSpace=dt,t}function Y_(n){Nr(n,0,0,$n*1.05,[[0,"rgba(255, 255, 255, 1)"],[.08,"rgba(255, 235, 213, 1)"],[.18,"rgba(255, 126, 100, 1)"],[.34,"rgba(255, 32, 48, 1)"],[.56,"rgba(255, 0, 35, 1)"],[.78,"rgba(218, 0, 40, 1)"],[1,"rgba(174, 0, 39, 1)"]])}function $_(n,e,t){for(let r=0;r<30;r++){const s=r%2===0,a=t*(.2+Math.random()*.42),o=(.45+Math.random()*.55)*(s?.115:.105),l=s?"255, 225, 190":"125, 0, 24";n.save(),n.globalCompositeOperation=s?"lighter":"source-over",n.translate(Math.random()*e,Math.random()*t),n.rotate(Math.random()*Math.PI),n.scale(1+Math.random()*1.5,.45+Math.random()*.6),Nr(n,0,0,a,[[0,`rgba(${l}, ${o})`],[.55,`rgba(${l}, ${o*.4})`],[1,`rgba(${l}, 0)`]]),n.restore()}n.globalCompositeOperation="source-over"}function K_(n,e,t){n.save(),n.translate(e/2,t*.56),n.scale(e/t,1),Nr(n,0,0,t*.75,[[0,"rgba(110, 0, 22, 0)"],[.52,"rgba(110, 0, 22, 0)"],[.76,"rgba(105, 0, 25, 0.1)"],[.92,"rgba(86, 0, 26, 0.2)"],[1,"rgba(62, 0, 24, 0.28)"]]),n.restore()}const Z_=.46;function Nr(n,e,t,i,r){const s=n.createRadialGradient(e,t,0,e,t,i);for(const[a,o]of r)s.addColorStop(a,o);n.fillStyle=s,n.fillRect(e-i,t-i,i*2,i*2)}function J_(n,e,t,i){const r=n.getImageData(0,0,e,t);for(let s=0;s<r.data.length;s+=4){const a=(Math.random()-.5)*i;r.data[s]=Ra((r.data[s]??0)+a),r.data[s+1]=Ra((r.data[s+1]??0)+a),r.data[s+2]=Ra((r.data[s+2]??0)+a)}n.putImageData(r,0,0)}const Q_=2048;function j_(n){const e=Q_,t=e/512,i=e/2,r=document.createElement("canvas");r.width=e,r.height=e;const s=r.getContext("2d");if(s===null)throw new Error("No 2D context for the table top");s.fillStyle="#831c38",s.fillRect(0,0,e,e);const a=s.createRadialGradient(i,i,0,i,i,i);a.addColorStop(0,"#e94a50"),a.addColorStop(.34,"#d93648"),a.addColorStop(.7,"#b52240"),a.addColorStop(.88,"#961c3a"),a.addColorStop(1,"#7e1833"),s.fillStyle=a,s.fillRect(0,0,e,e),ex(s,e),tx(s,e,t),ix(s,e),sx(s,e,t),rx(s,e,t),nx(s,e);const o=new Sn(r);return o.colorSpace=dt,o.anisotropy=n,o.magFilter=Et,o.minFilter=Pn,o.generateMipmaps=!0,o}function ex(n,e){for(let t=0;t<22;t++){const i=t%2===0,r=e*(.12+Math.random()*.3),s=(.35+Math.random()*.65)*.05,a=i?"226, 190, 255":"58, 20, 104";n.save(),n.globalCompositeOperation=i?"lighter":"source-over",n.translate(Math.random()*e,Math.random()*e),n.rotate(Math.random()*Math.PI),n.scale(1+Math.random(),.6+Math.random()*.5),Nr(n,0,0,r,[[0,`rgba(${a}, ${s})`],[.6,`rgba(${a}, ${s*.35})`],[1,`rgba(${a}, 0)`]]),n.restore()}n.globalCompositeOperation="source-over"}function tx(n,e,t){n.save(),n.lineWidth=t;for(const[i,r]of[[1,.03],[-1,.02]]){n.strokeStyle=`rgba(226, 206, 255, ${r})`,n.beginPath();for(let s=-e;s<e*2;s+=9*t)n.moveTo(s,0),n.lineTo(s+i*e,e);n.stroke()}n.restore()}function nx(n,e){const t=document.createElement("canvas");t.width=512,t.height=512;const i=t.getContext("2d");if(i===null)return;const r=i.createImageData(t.width,t.height);for(let a=0;a<r.data.length;a+=4){const o=128+(Math.random()-.5)*44;r.data[a]=o,r.data[a+1]=o,r.data[a+2]=o,r.data[a+3]=255}i.putImageData(r,0,0);const s=n.createPattern(t,"repeat");s!==null&&(n.save(),n.globalCompositeOperation="overlay",n.globalAlpha=.5,n.fillStyle=s,n.fillRect(0,0,e,e),n.restore())}function ix(n,e){const t=e/2,i=12;n.save(),n.translate(t,t);for(let r=0;r<i;r++){const s=r/i*Math.PI*2,a=Math.PI/i/1.9,o=n.createRadialGradient(0,0,e*.06,0,0,e*.46);o.addColorStop(0,"rgba(198, 164, 255, 0.055)"),o.addColorStop(.6,"rgba(180, 140, 250, 0.022)"),o.addColorStop(1,"rgba(160, 120, 240, 0)"),n.fillStyle=o,n.beginPath(),n.moveTo(0,0),n.arc(0,0,e*.46,s-a,s+a),n.closePath(),n.fill()}n.restore()}function rx(n,e,t){const i=e/2,r=e*.468,s=e*.436;n.save(),n.translate(i,i),n.strokeStyle="rgba(206, 178, 252, 0.19)",n.lineWidth=1.4*t;for(const a of[r,s])n.beginPath(),n.arc(0,0,a,0,Math.PI*2),n.stroke();n.strokeStyle="rgba(206, 178, 252, 0.12)",n.lineWidth=1.2*t,n.beginPath();for(let a=0;a<72;a++){const o=a/72*Math.PI*2;n.moveTo(Math.cos(o)*s,Math.sin(o)*s),n.lineTo(Math.cos(o)*r,Math.sin(o)*r)}n.stroke(),n.restore()}function sx(n,e,t){const i=e/2,r=e*.355;n.save(),n.strokeStyle="rgba(214, 186, 255, 0.22)",n.lineWidth=1.6*t,n.beginPath(),n.arc(i,i,r,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(214, 186, 255, 0.12)",n.lineWidth=t,n.beginPath(),n.arc(i,i,r-13*t,0,Math.PI*2),n.stroke();const s=34/16*t;n.strokeStyle="rgba(226, 206, 255, 0.38)",n.lineWidth=1.7*t/s,n.lineCap="round",n.lineJoin="round",Nn.forEach((a,o)=>{const l=o/Nn.length*Math.PI*2;n.save(),n.translate(i+Math.sin(l)*r,i-Math.cos(l)*r),n.rotate(l),n.scale(s,s),n.translate(-5,-8),n.stroke(new Path2D(xn[a].runePath)),n.restore()}),n.restore()}function ax(){const e=document.createElement("canvas");e.width=256,e.height=4;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the table edge");const i=t.createLinearGradient(0,0,256,0);i.addColorStop(0,"rgba(112, 74, 176, 0)"),i.addColorStop(.14,"rgba(132, 92, 200, 0.26)"),i.addColorStop(.2,"rgba(186, 148, 246, 0.4)"),i.addColorStop(.3,"rgba(146, 96, 216, 0.2)"),i.addColorStop(.55,"rgba(118, 70, 190, 0.075)"),i.addColorStop(1,"rgba(96, 54, 168, 0)"),t.fillStyle=i,t.fillRect(0,0,256,4);const r=new Sn(e);return r.colorSpace=dt,r}function ox(){const e=document.createElement("canvas");e.width=64,e.height=4;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the edge sheen");const i=t.createLinearGradient(0,0,64,0);i.addColorStop(0,"rgba(196, 164, 246, 0)"),i.addColorStop(.5,"rgba(214, 188, 255, 0.85)"),i.addColorStop(1,"rgba(196, 164, 246, 0)"),t.fillStyle=i,t.fillRect(0,0,64,4);const r=new Sn(e);return r.colorSpace=dt,r}function lx(){const e=document.createElement("canvas");e.width=4,e.height=64;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the table apron");const i=t.createLinearGradient(0,0,0,64);i.addColorStop(0,"rgba(78, 46, 120, 1)"),i.addColorStop(.24,"rgba(52, 30, 84, 0.95)"),i.addColorStop(.62,"rgba(30, 17, 52, 0.6)"),i.addColorStop(.86,"rgba(18, 10, 34, 0.22)"),i.addColorStop(1,"rgba(13, 7, 25, 0)"),t.fillStyle=i,t.fillRect(0,0,4,64);const r=new Sn(e);return r.colorSpace=dt,r}function cx(){const e=document.createElement("canvas");e.width=256,e.height=256;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the light pool");Nr(t,256/2,256/2,256/2,[[0,"rgba(108, 52, 208, 0.5)"],[.42,"rgba(76, 34, 158, 0.2)"],[.75,"rgba(50, 22, 116, 0.06)"],[1,"rgba(34, 14, 86, 0)"]]);const i=new Sn(e);return i.colorSpace=dt,i}const Ra=n=>n<0?0:n>255?255:n,Ca=600;function ux(){const n=new Dt,e=new Float32Array(Ca*3),t=new Float32Array(Ca*3),i=new Pe("#9fb4ff"),r=new Pe("#ffd9f0"),s=new Pe;for(let l=0;l<Ca;l++){const c=Math.random()*Math.PI*2,d=Math.random()**1.5,h=26+Math.random()*9,u=Math.sqrt(1-d*d);e[l*3]=Math.sin(c)*u*h,e[l*3+1]=2+d*h*.85,e[l*3+2]=Math.cos(c)*u*h,s.copy(i).lerp(r,Math.random());const f=(.2+Math.random()**2*.8)*.45;t[l*3]=s.r*f,t[l*3+1]=s.g*f,t[l*3+2]=s.b*f}n.setAttribute("position",new xt(e,3)),n.setAttribute("color",new xt(t,3));const a=new ll({size:.5,map:rd(),vertexColors:!0,transparent:!0,depthWrite:!1,blending:ni,sizeAttenuation:!0}),o=new Bu(n,a);return o.frustumCulled=!1,o.renderOrder=-3,{points:o,update(){},dispose(){n.dispose(),a.map?.dispose(),a.dispose()}}}const gr=340,Pa=7.5;function dx(){const n=new Dt,e=new Float32Array(gr*3),t=new Float32Array(gr*3),i=new Float32Array(gr),r=new Pe("#ffd9a0"),s=new Pe("#b48cff"),a=new Pe;for(let d=0;d<gr;d++){const h=Math.random()*Math.PI*2,u=5.6+Math.random()*5.4;e[d*3]=Math.sin(h)*u*1.25,e[d*3+1]=Math.random()*Pa,e[d*3+2]=Math.cos(h)*u,a.copy(s).lerp(r,Math.random()**2);const f=.35+Math.random()*.65;t[d*3]=a.r*f,t[d*3+1]=a.g*f,t[d*3+2]=a.b*f,i[d]=.12+Math.random()*.42}const o=new xt(e,3);n.setAttribute("position",o),n.setAttribute("color",new xt(t,3));const l=new ll({size:.13,map:rd(),vertexColors:!0,transparent:!0,depthWrite:!1,blending:ni,sizeAttenuation:!0}),c=new Bu(n,l);return c.frustumCulled=!1,c.renderOrder=-2,{points:c,update(d){for(let h=0;h<gr;h++){const u=h*3+1;let f=(e[u]??0)+(i[h]??0)*d;f>Pa&&(f-=Pa),e[u]=f}o.needsUpdate=!0},dispose(){n.dispose(),l.map?.dispose(),l.dispose()}}}function rd(){const e=document.createElement("canvas");e.width=64,e.height=64;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the particles");const i=t.createRadialGradient(64/2,64/2,0,64/2,64/2,64/2);i.addColorStop(0,"rgba(255, 255, 255, 1)"),i.addColorStop(.25,"rgba(255, 255, 255, 0.62)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=i,t.fillRect(0,0,64,64);const r=new Sn(e);return r.colorSpace=dt,r}const Oo=new z(0,6.5,5.23),Fc=new z(0,.1,-.25),La=43,fx=1.55;function hx(n){const e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,t=new w_({canvas:n,antialias:!0,alpha:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1});t.toneMapping=Ko,t.toneMappingExposure=1.03;const i=new rh,r=new Ot(La,1,.1,120);r.position.copy(Oo),r.lookAt(Fc);let s=Math.min(window.devicePixelRatio||1,2),a=1,o=1;function l(){const _=n.getBoundingClientRect();a=Math.max(1,Math.round(_.width)),o=Math.max(1,Math.round(_.height));const b=a/o,U=a<=760&&o>a;r.position.copy(U?new z(0,8,3.8):Oo),r.lookAt(Fc);const D=U?1.05:fx;r.aspect=b,r.fov=b>=D?La:2*Math.atan(Math.tan(La/2*(Math.PI/180))*D/b)*180/Math.PI,r.updateProjectionMatrix(),t.setPixelRatio(s),t.setSize(a,o,!1)}const c=new ResizeObserver(l);c.observe(n),l();const d=new Set;let h=0,u=performance.now(),f=0,x=60;function S(_){h=requestAnimationFrame(S);const b=Math.min(.05,Math.max(5e-4,(_-u)/1e3));u=_,f+=b,x+=(1/b-x)*.05,R();for(const U of d)U(b,f);t.render(i,r)}let m=0;const p=5;function R(){if(f<p||x>=45||s<=1){m=0;return}++m<120||(m=0,s=Math.max(1,s-.25),l(),console.info(`Runecall: resolution lowered to ${s.toFixed(2)} (${x.toFixed(0)} fps)`))}h=requestAnimationFrame(S);const L=new z,v=new Ph,E=new Be,y=new Cn(new z(0,1,0),0);function C(_,b){const U=n.getBoundingClientRect();return E.set((_-U.left)/U.width*2-1,-((b-U.top)/U.height*2-1)),v.setFromCamera(E,r),v}return{renderer:t,scene:i,camera:r,canvas:n,reducedMotion:e,onFrame(_){return d.add(_),()=>d.delete(_)},toScreen(_,b){return L.copy(_).project(r),b.set((L.x+1)/2*a,(1-L.y)/2*o),b},isInFront(_){return L.copy(_).project(r),L.z<1},rayAt:C,planePoint(_,b,U,D){return y.constant=-U,C(_,b).ray.intersectPlane(y,D)===null?null:D},fps:()=>x,dispose(){cancelAnimationFrame(h),c.disconnect(),d.clear(),t.dispose()}}}Oo.clone();const _r=44,px=.42,mx=.66,Oc=Zn+4.2,gx=Zn+12,Ia=-2.6,Bc=8.4,_x=8.5,zc=5.5;function xx(n,e){const t=Pr(),i=new Float32Array(_r*4*3),r=new Float32Array(_r*4*2),s=new Float32Array(_r*4*3),a=new Uint16Array(_r*6),o=[],l=new Pe;for(let v=0;v<_r;v++){const E=t[Math.floor(Math.random()*t.length)],y=Math.random()<.25||E===void 0?e.back:e.art(E.id),C=[[y.face.u0,y.face.v0],[y.face.u1,y.face.v0],[y.face.u1,y.face.v1],[y.face.u0,y.face.v1]],_=Math.random(),b=.85-_*.45;l.setRGB(b,b*.94,b*1.04);for(let O=0;O<4;O++){const K=C[O]??[0,0];r[(v*4+O)*2]=K[0],r[(v*4+O)*2+1]=K[1],s[(v*4+O)*3]=l.r,s[(v*4+O)*3+1]=l.g,s[(v*4+O)*3+2]=l.b}const U=v*4;a.set([U,U+1,U+2,U,U+2,U+3],v*6);const D=Oc+(gx-Oc)*_;o.push({angle:Math.random()*Math.PI*2,turn:(.055+Math.random()*.075)*(1-_*.45),radiusX:D,radiusZ:D*.78,height:Ia+Math.random()*(Bc-Ia),rise:.12+Math.random()*.4,spin:Math.random()*Math.PI*2,spinTurn:(Math.random()-.5)*.5,tumble:Math.random()*Math.PI*2,tumbleTurn:.18+Math.random()*.5,swayPhase:Math.random()*Math.PI*2,swayTurn:.2+Math.random()*.4})}const c=new Dt,d=new xt(i,3);d.setUsage(zf),c.setAttribute("position",d),c.setAttribute("uv",new xt(r,2)),c.setAttribute("color",new xt(s,3)),c.setIndex(new xt(a,1));const h=new $t({map:e.texture,vertexColors:!0,side:Vt,transparent:!0,opacity:.5,alphaTest:.25,blending:ni,depthWrite:!1,toneMapped:!1}),u=new _t(c,h);u.frustumCulled=!1,u.renderOrder=-1;const f=new z(1,0,0).applyQuaternion(n.camera.quaternion),x=new z(0,1,0).applyQuaternion(n.camera.quaternion),S=n.camera.position,m=new z,p=new z,R=new z;function L(){o.forEach((v,E)=>{const y=Math.sin(v.swayPhase)*.5;R.set(Math.sin(v.angle)*(v.radiusX+y),v.height,Math.cos(v.angle)*(v.radiusZ+y));const C=Math.max(.14,Math.abs(Math.cos(v.tumble))),_=Math.cos(v.spin),b=Math.sin(v.spin),U=R.distanceTo(S),D=Math.min(1,Math.max(0,(U-zc)/(_x-zc))),O=px*C*D,K=mx*D;m.copy(f).multiplyScalar(_).addScaledVector(x,b).multiplyScalar(O),p.copy(x).multiplyScalar(_).addScaledVector(f,-b).multiplyScalar(K);for(let Z=0;Z<4;Z++){const w=Z===0||Z===3?-1:1,V=Z===0||Z===1?-1:1,N=(E*4+Z)*3;i[N]=R.x+m.x*w+p.x*V,i[N+1]=R.y+m.y*w+p.y*V,i[N+2]=R.z+m.z*w+p.z*V}}),d.needsUpdate=!0}return L(),{mesh:u,update(v){for(const E of o)E.angle+=E.turn*v,E.spin+=E.spinTurn*v,E.tumble+=E.tumbleTurn*v,E.swayPhase+=E.swayTurn*v,E.height+=E.rise*v,E.height>Bc&&(E.height=Ia);L()},dispose(){c.dispose(),h.dispose()}}}const sd=1,yr=1.5625,vx=.5,kc=.62;function Mx(n){const e=new $t({map:n,vertexColors:!0,side:Vt,transparent:!0,alphaTest:.35,depthTest:!1,depthWrite:!1,toneMapped:!1}),t=new $t({map:Sx(),color:new Pe("#0b0518"),transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,opacity:.45}),i=new $t({map:n,vertexColors:!0,side:Vt,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1});return{face:e,shade:t,mirror:i,dispose(){e.dispose(),t.map?.dispose(),t.dispose(),i.dispose()}}}function Sx(){const e=document.createElement("canvas");e.width=128,e.height=128;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the card shadow");const i=t.createRadialGradient(128/2,128/2,0,128/2,128/2,128/2);i.addColorStop(0,"rgba(255, 255, 255, 0.9)"),i.addColorStop(.5,"rgba(255, 255, 255, 0.5)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=i,t.fillRect(0,0,128,128);const r=new Sn(e);return r.colorSpace=dt,r}let Gc=null;function Da(){return Gc??=new wi(sd,yr),Gc}function yx(n){const e=Da().clone(),t=e.getAttribute("uv"),i=Float32Array.from(t.array),r=t.count,s=new xt(new Float32Array(r*3),3);e.setAttribute("color",s);const a=new _t(e,n.face);a.frustumCulled=!1;const o=Da().clone(),l=o.getAttribute("uv"),c=o.getAttribute("position"),d=new xt(new Float32Array(r*4),4);o.setAttribute("color",d);for(let S=0;S<r;S++)d.setXYZW(S,1,1,1,c.getY(S)>0?0:vx);const h=new _t(o,n.mirror);h.frustumCulled=!1,h.visible=!1;const u=new _t(Da().clone(),n.shade.clone());u.frustumCulled=!1;let f=1;function x(){for(let S=0;S<r;S++)s.setXYZ(S,f,f,f);s.needsUpdate=!0}return x(),{mesh:a,shade:u,mirror:h,setArt(S){const{u0:m,u1:p,v0:R,v1:L}=S.face;for(let v=0;v<r;v++){const E=i[v*2]??0,y=i[v*2+1]??0;t.setXY(v,m+E*(p-m),R+y*(L-R)),l.setXY(v,m+E*(p-m),R+y*(L-R))}t.needsUpdate=!0,l.needsUpdate=!0},setTint(S){Math.abs(S-f)<.004||(f=S,x())},setOrder(S){a.renderOrder=S,u.renderOrder=S-.5,h.renderOrder=S-.25},dispose(){e.dispose(),o.dispose(),u.geometry.dispose(),Array.isArray(u.material)||u.material.dispose()}}}function bx(){const e=document.createElement("canvas");e.width=256,e.height=256;const t=e.getContext("2d");if(t===null)throw new Error("No 2D context for the discard area");const i=t.createRadialGradient(256/2,256/2,0,256/2,256/2,256/2);i.addColorStop(0,"rgba(226, 190, 255, 0.3)"),i.addColorStop(.45,"rgba(190, 140, 246, 0.13)"),i.addColorStop(1,"rgba(160, 100, 230, 0)"),t.fillStyle=i,t.fillRect(0,0,256,256);const r=new Sn(e);r.colorSpace=dt;const s=new _t(new wi(4.2,4.2),new $t({map:r,transparent:!0,depthWrite:!1,side:Vt,blending:ni,toneMapped:!1}));return s.rotation.x=-Math.PI/2,s.position.y=.004,s}const Ex=.9;function Vc(n){return Array.from({length:n},(e,t)=>{const i=t/n*Math.PI*2,r=br(i,Ex,0);return{index:t,angle:i,facing:Math.atan2(r.x,r.z),at:r}})}function br(n,e,t){return new z(Math.sin(n)*Zn*e,t,Math.cos(n)*$i*e)}const Tx=1.03,wx=1.15,Ax=new Set;function Hi(n,e=.5){for(const t of Ax)t(n,e)}const Rx=.93,Cx=8.1,Px=.34,Lx=.45,Ix=.9,Dx=.3,Nx=.056,Ux=.26,Fx=.15,Ox=1.05,Bx=.62,zx=.2,Na=.72,kx=.78,xr=new z(0,.05,.35),Gx=.75,Hc=.34,Vx=.34,Hx=new z(2.15,.05,-.15),Wx=.62,Xx=.3,Wc=1.07,qx=.85,Xc=.32,Wi=.22,Yx=.13,$x=.34,Kx=.36,Zx=.44,Xi={away:20,pile:200,trump:160,hand:400,held:900},fi=(n,e,t=1,i=0,r=0,s=1)=>({x:n.x,y:n.y,z:n.z,roll:e,scale:t,lay:i,yaw:r,flip:s}),qi=n=>({...n});function Jx(n,e){return n===null?!1:Math.abs(n.x-e.x)<.002&&Math.abs(n.y-e.y)<.002&&Math.abs(n.z-e.z)<.002&&Math.abs(n.roll-e.roll)<.002&&Math.abs(n.scale-e.scale)<.002&&Math.abs(n.lay-e.lay)<.002&&Math.abs(n.yaw-e.yaw)<.002&&Math.abs(n.flip-e.flip)<.002}function Qx(n,e,t){const i=new Ki;n.scene.add(i);const r=Mx(e.texture),s=bx();i.add(s);const a=new Map,o=[],l=n.reducedMotion,c=l?.12:1,d=l?0:1,h=n.camera.quaternion.clone(),u=new z(1,0,0).applyQuaternion(h),f=new z(0,1,0).applyQuaternion(h),x=new z(0,0,1).applyQuaternion(h),S=new pn().setFromAxisAngle(new z(1,0,0),-Math.PI/2),m=new pn,p=new z().copy(n.camera.position).addScaledVector(x,-10.5).addScaledVector(f,-2.65),R=new pn,L=new pn,v=new z(0,0,1),E=new z,y=new z,C=new z,_=new Be,b=new Be;function U(A,P,I,W){return E.copy(A).addScaledVector(u,P).addScaledVector(f,I).addScaledVector(x,W)}const D={index:0,angle:0,facing:0,at:new z},O=A=>K[A]??D;let K=Vc(3),Z=[],w=null,V=null,N=new Set,$=0,ne=new Set,oe=null,ie="";function fe(A,P){const I=a.get(A);if(I!==void 0)return I.retiring=!1,I.fadeTarget=1,I;const W=o.pop()??yx(r),re=e.art(P);W.setArt(re),W.shade.visible=!0,W.mirror.visible=!1,i.add(W.mesh,W.shade,W.mirror);const j={body:W,pose:{x:0,y:0,z:0,roll:0,scale:1,lay:0,yaw:0,flip:1},goal:null,move:null,placed:!1,front:re,back:e.back,showsFront:!0,tint:1,tintTarget:1,fade:1,fadeTarget:1,retiring:!1};return a.set(A,j),j}function Oe(A,P){a.delete(A),i.remove(P.body.mesh,P.body.shade,P.body.mirror),o.push(P.body)}function Ke(A,P){Object.assign(A.pose,P),A.goal=qi(P),A.move=null,A.placed=!0}function Te(A,P,I,W={}){Jx(A.goal,P)||(A.goal=qi(P),A.move={from:qi(A.pose),to:qi(P),elapsed:0,duration:Math.max(.04,I*c),ease:W.ease??wa,arc:(W.arc??0)*d,pop:W.pop??!1,onLand:W.onLand??null},A.placed=!0)}function Q(A,P){const I=P>1?A/(P-1)-.5:0,W=P>1?Math.min(Rx,Cx/(P-1)):0,re=Math.min(Px,.075*P),j=U(p,I*W*(P-1),-I*I*Lx,A*.012);return fi(j,-I*re*2)}function le(A,P,I){const re=-Math.sin(A.angle)*zx,j=br(A.angle,Ix,Dx),te=n.camera.position.distanceTo(j),_e=Nx*te,ve=I>1?Math.min(Fx,Ox/(I-1)):0,be=(I-1)/2,F=re+(P-be)*ve,ue=Bx*yr*_e,ee=ue*(Math.sin(re)-Math.sin(F)),de=ue*(Math.cos(F)-Math.cos(re)),pe=E.copy(j).addScaledVector(u,ee).addScaledVector(f,de).addScaledVector(x,P*.01);return fi(pe,F,_e,Ux)}function ae(A,P,I){const W=br(O(I).angle,1,0).normalize().multiplyScalar(Vx),re=E.set(xr.x+W.x+Aa(A,11)*Hc,xr.y+P*.004,xr.z+W.z+Aa(A,23)*Hc*.8);return fi(re,Aa(A,37)*.34,Gx,Na)}const Ce=A=>fi(Hx,.14,Wx,kx,0,A?1:0);function De(A,P){A.handSizes.length!==K.length&&(K=Vc(A.handSizes.length)),Z=Wo(A.hand,A.trumpSuit),N=new Set(A.playable),A.lastTrick!==null&&($=A.lastTrick.winner);const I=`${A.roundNumber}`;I!==ie&&(ie=I,ne=new Set,oe=null);const W=new Set;Re(W),at(A,W),Ge(A,P,W),qe(A,W);for(const[re,j]of a)W.has(re)||j.retiring||Ve(re,j)}function Re(A){const P=Z.length;Z.forEach((I,W)=>{const re=`hand:${I.id}`;A.add(re);const j=fe(re,I.id),te=Q(W,P);j.body.mesh.userData.cardId=I.id,j.tintTarget=N.size>0&&!N.has(I.id)?.62:1,j.placed||(Ke(j,fi(y.copy(xr),0,.45,Na)),Te(j,te,Xc+W*.04,{ease:di,arc:.25,pop:!0}),W===0&&Hi("deal",.4));const _e=Ue?.cardId===I.id,ve=V===I.id,be=ve||w===I.id;if(j.body.setOrder(_e||be?Xi.held:Xi.hand+W*2),_e)return;if(!be){Te(j,te,Wi);return}const F=Xx*(ve?1.5:1);Te(j,{...te,x:te.x+f.x*F,y:te.y+f.y*F,z:te.z+f.z*F,roll:te.roll*.4,scale:Wc},Yx,{ease:di})})}function at(A,P){for(let I=1;I<A.handSizes.length;I++){const W=A.handSizes[I]??0;for(let re=0;re<W;re++){const j=`away:${I}:${re}`;P.add(j);const te=fe(j,"back"),_e=le(O(I),re,W);te.body.setOrder(Xi.away+I*40+re*2),te.body.mirror.visible=!1,te.body.shade.visible=!0,te.placed?Te(te,_e,Wi):(Ke(te,fi(y.copy(xr),0,.4,Na)),Te(te,_e,Xc+re*.03,{ease:di,arc:.2}))}}}function Ge(A,P,I){const W=P&&A.lastTrick!==null?A.lastTrick.plays:A.currentTrick,re=P?A.lastTrick?.winner??null:null;W.forEach((j,te)=>{const _e=`pile:${j.card.id}`;I.add(_e);const ve=fe(_e,j.card.id),be=ae(j.card.id,te,j.player);if(ve.body.setOrder(Xi.pile+te*2),!ne.has(j.card.id))ne.add(j.card.id),Ze(ve,j.player,j.card.id,A,be);else{const F=j.player===re;Te(ve,F?{...be,scale:1.12}:be,Wi)}ve.tintTarget=re===null||j.player===re?1:.6})}function Ze(A,P,I,W,re){const j=P===W.you?`hand:${I}`:`away:${P}:${W.handSizes[P]??0}`,te=a.get(j);te!==void 0?(Ke(A,qi(te.pose)),Oe(j,te)):Ke(A,le(O(P),0,1));const _e=P===W.you;Hi("throw",_e?.8:.55),Te(A,re,$x,{ease:di,arc:.3,pop:!0,onLand:()=>Hi("land",.6)})}function qe(A,P){if(A.trumpCard===null)return;const I="trump";P.add(I);const W=fe(I,A.trumpCard.id);W.body.setOrder(Xi.trump),oe!==A.trumpCard.id?(oe=A.trumpCard.id,W.front=e.art(A.trumpCard.id),W.showsFront=!1,W.body.setArt(W.back),Ke(W,Ce(!1)),Hi("flip",.45),Te(W,Ce(!0),Zx,{ease:wa})):Te(W,Ce(!0),Wi)}function Ve(A,P){const I=O($),W=br(I.angle,1.02,.5);P.retiring=!0,P.fadeTarget=0,A.startsWith("pile:")&&Hi("collect",.45),Te(P,fi(W,P.pose.roll*.5,.4,P.pose.lay),Kx,{ease:wa,onLand:()=>Oe(A,P)})}const lt=n.onFrame(A=>{const P=window.matchMedia("(max-width: 900px)").matches;for(const[I,W]of a){ft(W,A);const re=P&&I.startsWith("hand:");W.body.mesh.visible=!re,re&&(W.body.shade.visible=!1)}});function ft(A,P){const I=A.move;if(I!==null){I.elapsed+=P;const ve=fl(I.elapsed/I.duration,0,1),be=I.ease(ve),F=I.arc*G_(ve);A.pose.x=Yn(I.from.x,I.to.x,be)+f.x*F,A.pose.y=Yn(I.from.y,I.to.y,be)+f.y*F,A.pose.z=Yn(I.from.z,I.to.z,be)+f.z*F,A.pose.roll=Yn(I.from.roll,I.to.roll,di(ve)),A.pose.scale=Yn(I.from.scale,I.to.scale,I.pop?k_(ve):be),A.pose.lay=Yn(I.from.lay,I.to.lay,be),A.pose.yaw=Yn(I.from.yaw,I.to.yaw,be),A.pose.flip=Yn(I.from.flip,I.to.flip,be),ve>=1&&(Object.assign(A.pose,I.to),A.move=null,I.onLand?.())}const W=Math.min(1,P*11);A.tint+=(A.tintTarget-A.tint)*W,A.fade+=(A.fadeTarget-A.fade)*W;const re=A.pose.flip>.5;re!==A.showsFront&&(A.showsFront=re,A.body.setArt(re?A.front:A.back));const j=A.body.mesh,te=A.pose.scale*Math.max(.001,A.fade),_e=Math.abs(Math.cos(Math.PI*A.pose.flip));m.copy(h).slerp(S,A.pose.lay),R.setFromAxisAngle(v,A.pose.roll),L.setFromAxisAngle(f,A.pose.yaw),j.position.set(A.pose.x,A.pose.y,A.pose.z),j.quaternion.copy(L).multiply(m).multiply(R),j.scale.set(Math.max(.001,te*_e),te,1),A.body.setTint(A.tint),vt(A,te,_e),A.body.mirror.visible&&mt(A,te,_e)}function mt(A,P,I){const W=A.body.mirror,re=yr*P;W.quaternion.copy(A.body.mesh.quaternion),W.position.set(0,-(re/2)-re*kc/2,0).applyQuaternion(W.quaternion).add(A.body.mesh.position),W.scale.set(Math.max(.001,P*I),-P*kc,1)}function vt(A,P,I){const W=A.body.shade,re=A.body.mesh,j=y.set(.04*P,-.07*P,-.004).applyQuaternion(re.quaternion).add(re.position);W.position.copy(j),W.quaternion.copy(A.body.mesh.quaternion),W.scale.set(Math.max(.001,P*I*1.3),P*1.22,1),W.visible=A.fade>.05;const te=W.material;Array.isArray(te)||(te.opacity=.42*A.fade)}function tt(A,P){const I=[];for(const[j,te]of a)!j.startsWith("hand:")||te.retiring||I.push(te.body.mesh);if(I.length===0)return null;const re=n.rayAt(A,P).intersectObjects(I,!1)[0]?.object.userData.cardId;return typeof re=="string"?re:null}let Ue=null;const B=new Cn,Ct=new z;function Ye(A,P){return B.setFromNormalAndCoplanarPoint(x,p),n.rayAt(A,P).ray.intersectPlane(B,Ct)}function T(A){if(A.button!==0||Ue!==null||window.matchMedia("(max-width: 900px)").matches)return;const P=tt(A.clientX,A.clientY);if(P===null)return;const I=a.get(`hand:${P}`),W=Ye(A.clientX,A.clientY);I===void 0||W===null||(Ue={cardId:P,pointerId:A.pointerId,start:W.clone(),origin:qi(I.pose),moved:!1},I.body.setOrder(Xi.held),n.canvas.setPointerCapture(A.pointerId))}function g(A){if(Ue!==null&&A.pointerId!==Ue.pointerId)return;if(Ue===null){if(A.pointerType==="touch")return;t.onHover(tt(A.clientX,A.clientY));return}const P=a.get(`hand:${Ue.cardId}`),I=Ye(A.clientX,A.clientY);P===void 0||I===null||(E.copy(I).sub(Ue.start),E.length()>.1&&(Ue.moved=!0),Ue.moved&&(P.move=null,P.goal=null,P.pose.x=Ue.origin.x+E.x,P.pose.y=Ue.origin.y+E.y,P.pose.z=Ue.origin.z+E.z,P.pose.roll=Ue.origin.roll*.3,P.pose.scale=Wc))}function G(A){if(Ue!==null&&A.pointerId!==Ue.pointerId)return;const P=Ue;if(Ue=null,P===null)return;n.canvas.hasPointerCapture(P.pointerId)&&n.canvas.releasePointerCapture(P.pointerId);const I=Ye(A.clientX,A.clientY),W=I===null?0:E.copy(I).sub(P.start).dot(f);if(!P.moved||W>qx){t.onPick(P.cardId);return}const re=a.get(`hand:${P.cardId}`),j=Z.findIndex(te=>te.id===P.cardId);re!==void 0&&j>=0&&Te(re,Q(j,Z.length),Wi,{ease:di})}function H(){const A=Ue;if(Ue=null,A!==null){const P=a.get(`hand:${A.cardId}`),I=Z.findIndex(W=>W.id===A.cardId);P!==void 0&&I>=0&&Te(P,Q(I,Z.length),Wi,{ease:di}),n.canvas.hasPointerCapture(A.pointerId)&&n.canvas.releasePointerCapture(A.pointerId)}t.onHover(null)}function J(A){tt(A.clientX,A.clientY)===null&&t.onEmptyClick()}return n.canvas.addEventListener("pointerdown",T),n.canvas.addEventListener("pointermove",g),n.canvas.addEventListener("pointerup",G),n.canvas.addEventListener("pointercancel",H),n.canvas.addEventListener("pointerleave",H),n.canvas.addEventListener("click",J),{show:De,focus(A){w!==A&&(A!==null&&Hi("lift",.25),w=A,ce())},select(A){V!==A&&(V=A,ce())},seatAt(A,P){const I=A===0?y.copy(p).addScaledVector(u,-5).addScaledVector(f,.5):y.copy(br(O(A).angle,Tx,wx));return n.isInFront(I)?n.toScreen(I,P):null},cardAt(A,P){const I=a.get(`hand:${A}`);return I===void 0?null:(y.copy(I.body.mesh.position),n.isInFront(y)?n.toScreen(y,P):null)},cardSize(){n.toScreen(C.copy(p),_),n.toScreen(C.copy(p).addScaledVector(f,yr/2),b);const A=Math.max(24,_.distanceTo(b)*2);return{width:A*(sd/yr),height:A}},reset(){for(const[A,P]of a)Oe(A,P);a.clear(),ne=new Set,oe=null,ie="",w=null,V=null,Ue=null,Z=[]},dispose(){lt(),n.canvas.removeEventListener("pointerdown",T),n.canvas.removeEventListener("pointermove",g),n.canvas.removeEventListener("pointerup",G),n.canvas.removeEventListener("pointercancel",H),n.canvas.removeEventListener("pointerleave",H),n.canvas.removeEventListener("click",J);for(const[A,P]of a)Oe(A,P);for(const A of o)A.dispose();o.length=0,s.geometry.dispose(),Array.isArray(s.material)||s.material.dispose(),r.dispose(),n.scene.remove(i)}};function ce(){Re(new Set)}}let ad=[],od=0;const Ln=n=>ad[n]??`Seat ${n}`,jx=(n,e,t)=>n===od?e:t,ev={mage:"first Wizard",trump:"highest trump","led-suit":"highest card of the led suit","jesters-only":"only Jesters — the first one wins"},tv=!window.matchMedia("(hover: hover)").matches,nv=new z(0,1.3,1.62),iv=new z(0,2,.75),rv=new z(2.15,.05,.72),Wt=n=>{const e=document.getElementById(n);if(e===null)throw new Error(`Element #${n} is missing from the document`);return e};let Bo=null,On=null,Ua=!1,Er=null,Ds={onMenu:()=>{},onNewGame:()=>{},rankNote:()=>null};const Qn=new Map,mn=new Map;let jn=null,hl=null,cs=null;function pl(){On?.reset(),jn=null,hl=null;for(const n of Qn.values())n.remove();Qn.clear();for(const n of mn.values())n.parentElement?.remove();mn.clear()}function ld(){if(Bo!==null||Ua)return;Ua=!0;const n=Wt("scene"),e=hx(n);Bo=e;const t=H_(e.reducedMotion,e.renderer.capabilities.getMaxAnisotropy());e.scene.add(t.group),e.onFrame(i=>{t.fit(e.camera),t.update(i)}),e.onFrame(ud),D_(e.renderer.capabilities.getMaxAnisotropy()).then(i=>{const r=xx(e,i);e.scene.add(r.mesh),e.reducedMotion||e.onFrame(s=>r.update(s)),On=Qx(e,i,{onPick:s=>cd(s),onHover:s=>{hl=s,On?.focus(s)},onEmptyClick:()=>Er?.skip()}),Er!==null&&rr(Er,Ds)}).catch(i=>{console.error("Runecall: the card atlas could not be loaded.",i),Yt("Card images are missing — please reload.")}).finally(()=>{Ua=!1})}function Yt(n){const e=Wt("toast");e.textContent=n,e.hidden=!1,e.classList.add("is-visible"),cs!==null&&window.clearTimeout(cs),cs=window.setTimeout(()=>{e.classList.remove("is-visible"),cs=window.setTimeout(()=>{e.hidden=!0},220)},1900)}function rr(n,e){Er=n,Ds=e,ld(),ad=n.names;const t=n.view();od=t.you;const i=n.waiting()==="trick";Wt("roundInfo").textContent=`Round ${t.roundNumber} of ${t.totalRounds}`,Ns.clear(),On?.show(t,i),sv(t,n),av(t),cv(t,n),dv(t,n),fv(t,n),pv(t,n),mv(t,n,e),ud()}function sv(n,e){const t=Wt("plates");for(const[i,r]of Qn)i<n.handSizes.length||(r.remove(),Qn.delete(i));for(let i=0;i<n.handSizes.length;i++){let r=Qn.get(i);const s=r===void 0;r===void 0&&(r=document.createElement("div"),r.className="plate",r.dataset.seat=String(i),r.innerHTML='<span class="plate__avatar" aria-hidden="true"></span><span class="plate__name"></span><span class="plate__tally"></span><span class="plate__score"></span>',Qn.set(i,r),t.append(r));const a=n.bids[i],o=a==null?"–":`${n.tricksWon[i]??0}/${a}`;us(r,".plate__name",Ln(i)),us(r,".plate__avatar",i===n.you?"◆":Ln(i).slice(0,1)),us(r,".plate__score",`${n.scores[i]??0}`),us(r,".plate__tally",o)&&!s&&ov(r);const l=n.phase==="round-end"||n.phase==="game-over",c=l&&a!==null&&a!==void 0&&(n.tricksWon[i]??0)===a;r.classList.toggle("is-me",i===n.you),r.classList.toggle("is-dealer",i===n.dealer),r.classList.toggle("is-turn",lv(n,i)&&e.waiting()!=="trick"),r.classList.toggle("is-winner",e.waiting()==="trick"&&n.lastTrick?.winner===i),r.classList.toggle("is-hit",c),r.classList.toggle("is-missed",l&&!c),r.title=i===n.dealer?"Dealer":""}}function av(n){const e=Wt("trump");if(n.trumpCard===null){e.hidden=!0;return}const t=n.trumpSuit,i=t??"none";if(e.hidden=!1,e.dataset.suit===i)return;e.dataset.suit=i,e.className=`trump trump--${i}`,e.replaceChildren(),t!==null&&e.append(dl(t));const r=document.createElement("span");r.textContent=t===null?"No trump":`Trump: ${xn[t].label}`,e.append(r)}function us(n,e,t){const i=n.querySelector(e);return i===null||i.textContent===t?!1:(i.textContent=t,!0)}function ov(n){n.classList.remove("is-bumped"),n.offsetWidth,n.classList.add("is-bumped")}function lv(n,e){return n.phase==="trump-choice"?e===n.dealer:n.phase==="bidding"||n.phase==="playing"?e===n.turn:!1}function cv(n,e){const t=Wt("status"),i=uv(n,e);t.textContent!==i&&(t.textContent=i,t.classList.remove("is-fresh"),t.offsetWidth,t.classList.add("is-fresh"))}function uv(n,e){if(e.waiting()==="trick"&&n.lastTrick!==null){const{winner:t,reason:i}=n.lastTrick;return`${Ln(t)} ${jx(t,"win","wins")} the trick — ${ev[i]}`}switch(n.phase){case"trump-choice":return n.dealer===n.you?"A Wizard was turned up — choose the trump suit.":`${Ln(n.dealer)} is choosing the trump suit …`;case"bidding":return n.turn===n.you?"How many tricks will you win?":`${Ln(n.turn)} is bidding …`;case"playing":{const t=Go(n.currentTrick),i=t.suit!==null?`${xn[t.suit].label} led`:t.settled?"no suit to follow — any card goes":n.currentTrick.length>0?"no suit led yet":"new trick",r=n.turn===n.you?"your turn":`${Ln(n.turn)}'s turn`;return`Trick ${n.trickNumber} of ${n.roundNumber} · ${i} · ${r}`}default:return""}}function dv(n,e){const t=Wt("actions");if(t.replaceChildren(),n.phase==="trump-choice"&&n.dealer===n.you){for(const s of Nn){const a=document.createElement("button");a.type="button",a.className=`pill pill--${s}`,a.append(dl(s),document.createTextNode(xn[s].label)),a.title=`${xn[s].label} — rune ${xn[s].runeName}`,a.addEventListener("click",()=>e.chooseTrump(s)),t.append(a)}qc(t);return}if(n.phase!=="bidding"||n.turn!==n.you)return;const i=cu(n),r=e.settings.hint?Math.max(0,Math.min(n.roundNumber,Math.round(i))):null;for(let s=0;s<=n.roundNumber;s++){const a=document.createElement("button");a.type="button",a.className="pill",a.textContent=String(s),s===r&&(a.classList.add("is-suggested"),a.title="Suggested by the bid assist"),a.addEventListener("click",()=>e.bid(s)),t.append(a)}if(qc(t),r!==null){const s=document.createElement("span");s.className="actions__hint",s.textContent=`Your hand is worth about ${i.toFixed(1)} tricks`,t.append(s)}}function qc(n){const e=Array.from(n.children).filter(a=>a instanceof HTMLElement),t=e.length;if(t===0)return;const i=640;let r=0;for(let a=1;a<t;a++)r+=((e[a-1]?.offsetWidth??0)+(e[a]?.offsetWidth??0))/2+8;const s=Math.min(.66,Math.max(.085*t,r/i));e.forEach((a,o)=>{const c=(t>1?o/(t-1)-.5:0)*s,d=Math.sin(c)*i,h=(1-Math.cos(c))*i;a.style.transform=`translate(-50%, -50%) translate(${d.toFixed(1)}px, ${h.toFixed(1)}px) rotate(${(c*180/Math.PI).toFixed(2)}deg)`,a.style.animationDelay=`${(o*.035).toFixed(3)}s`})}function fv(n,e){const t=Wt("handKeys"),i=Wo(n.hand,n.trumpSuit),r=new Set(i.map(a=>a.id));for(const[a,o]of mn)r.has(a)||(o.parentElement?.remove(),mn.delete(a));jn!==null&&!r.has(jn)&&(jn=null);const s=n.phase==="playing"&&n.turn===n.you&&e.waiting()==="none";i.forEach((a,o)=>{let l=mn.get(a.id);if(l===void 0){const u=document.createElement("li");l=document.createElement("button"),l.type="button",l.className="handkey";const f=P_(a);f.classList.add("mobile-card-face"),f.setAttribute("aria-hidden","true"),l.append(f),l.addEventListener("click",()=>cd(a.id)),l.addEventListener("focus",()=>On?.focus(a.id)),l.addEventListener("blur",()=>On?.focus(hl)),l.addEventListener("keydown",hv),u.append(l),mn.set(a.id,l),t.append(u)}const c=s&&n.playable.includes(a.id),d=`Card ${o+1} of ${i.length}`,h=s?c?", playable":", not playable":"";l.setAttribute("aria-label",`${Gs(a)} — ${d}${h}`),l.setAttribute("aria-disabled",String(s&&!c)),l.dataset.card=a.id,l.classList.toggle("is-selected",jn===a.id),l.tabIndex=s||window.matchMedia("(max-width: 900px)").matches?0:-1,t.append(l.parentElement)})}function hv(n){if(n.key!=="ArrowLeft"&&n.key!=="ArrowRight")return;const e=Array.from(mn.values()).filter(r=>r.tabIndex===0),t=e.indexOf(n.currentTarget);if(t<0||e.length===0)return;n.preventDefault();const i=n.key==="ArrowLeft"?-1:1;e[(t+i+e.length)%e.length]?.focus()}function cd(n){const e=Er;if(e===null)return;const t=e.view(),i=t.hand.find(s=>s.id===n);if(i===void 0)return;if(t.phase!=="playing"||t.turn!==t.you||e.waiting()!=="none"){rr(e,Ds);return}const r=Vo(i,t.hand,t.currentTrick);if(r!==null){Yt(`You must follow suit — play ${xn[r.suit].label}`),rr(e,Ds);return}if((tv||window.matchMedia("(max-width: 900px)").matches)&&jn!==n){jn=n,On?.select(n);for(const[s,a]of mn)a.classList.toggle("is-selected",s===n);Yt(`${Gs(i)} — tap again to play`);return}jn=null,On?.select(null),e.play(n)}function pv(n,e){const t=Wt("counting");if(!e.settings.counting){t.hidden=!0;return}t.hidden=!1,t.replaceChildren();const i=document.createElement("span");if(i.className="counting__title",i.textContent="Played this round",t.append(i),n.playedCards.length===0){const s=document.createElement("span");s.className="counting__none",s.textContent="nothing yet",t.append(s);return}const r=document.createElement("div");r.className="counting__row";for(const s of Wo(n.playedCards,n.trumpSuit)){const a=document.createElement("span");a.className="chip",s.kind==="pip"&&a.classList.add(`chip--${s.suit}`),a.textContent=s.kind==="pip"?String(s.value):s.kind==="mage"?"★":"?",a.title=Gs(s),r.append(a)}t.append(r)}function mv(n,e,t){const i=Wt("overlay");if(n.phase!=="round-end"&&n.phase!=="game-over"){i.hidden=!0,i.replaceChildren();return}i.hidden=!1,i.replaceChildren();const r=document.createElement("div");r.className="sheet";const s=document.createElement("h2");s.textContent=n.phase==="game-over"?"Game over":`Round ${n.roundNumber} scored`,r.append(s);const a=document.createElement("p");a.className="sheet__note",a.textContent=gv(n),r.append(a);const o=n.phase==="game-over"?t.rankNote():null;if(o!==null){const u=document.createElement("p");u.className="sheet__rank",u.textContent=o,r.append(u)}const l=document.createElement("table");l.className="sheet__table",l.innerHTML="<thead><tr><th>Player</th><th>Bid</th><th>Tricks</th><th>Round</th><th>Total</th></tr></thead>";const c=document.createElement("tbody"),d=n.scores.map((u,f)=>({seat:f,score:u})).sort((u,f)=>f.score-u.score);for(const{seat:u,score:f}of d){const x=n.bids[u]??0,S=n.tricksWon[u]??0,m=Ho(x,S),p=document.createElement("tr");u===n.you&&(p.className="is-me"),x===S&&p.classList.add("is-hit");for(const v of[Ln(u),String(x),String(S)]){const E=document.createElement("td");E.textContent=v,p.append(E)}const R=document.createElement("td");R.className=m>=0?"is-gain":"is-loss",R.textContent=m>0?`+${m}`:String(m),p.append(R);const L=document.createElement("td");L.textContent=String(f),p.append(L),c.append(p)}l.append(c),r.append(l);const h=document.createElement("div");if(h.className="sheet__actions",n.phase==="round-end"){const u=document.createElement("button");u.type="button",u.textContent="Next round",u.addEventListener("click",()=>e.nextRound()),h.append(u)}else{const u=document.createElement("button");u.type="button",u.textContent="New game",u.addEventListener("click",t.onNewGame);const f=document.createElement("button");f.type="button",f.className="ghost",f.textContent="Menu",f.addEventListener("click",t.onMenu),h.append(u,f)}r.append(h),i.append(r)}function gv(n){if(n.phase==="game-over"){const o=iu(n.scores),l=n.scores[o[0]??0]??0;if(o.length>1){const d=o.map(Ln);return`Shared win for ${d.slice(0,-1).join(", ")} and ${d.at(-1)} — ${vr(l)}.`}const c=o[0]??0;return c===n.you?`You win with ${vr(l)}.`:`${Ln(c)} wins with ${vr(l)}.`}const e=n.bids[n.you]??0,t=n.tricksWon[n.you]??0,i=Ho(e,t);if(e===t)return`Bid made — ${vr(i)} gained.`;const r=Math.abs(t-e),s=r===1?"One trick":`${r} tricks`,a=t>e?"too many":"too few";return`${s} ${a} — ${vr(Math.abs(i))} lost.`}const vr=n=>`${n} ${Math.abs(n)===1?"point":"points"}`,vi=new Be;function ud(){const n=On,e=Bo;if(e===null)return;if(window.matchMedia("(max-width: 900px)").matches){for(const a of Qn.values())a.style.visibility="";for(const a of mn.values())a.style.visibility="";return}zo(Wt("actions"),e.toScreen(nv,vi)),Fa(Wt("status"),e.toScreen(iv,vi));const t=Wt("trump");if(t.hidden||Fa(t,e.toScreen(rv,vi)),n===null)return;for(const[a,o]of Qn){const l=n.seatAt(a,vi);o.style.visibility=l===null?"hidden":"",l!==null&&Fa(o,l)}const i=n.cardSize(),r=`${i.width.toFixed(0)}px`,s=`${i.height.toFixed(0)}px`;for(const[a,o]of mn){const l=n.cardAt(a,vi);o.style.visibility=l===null?"hidden":"",l!==null&&zo(o,l),o.style.width!==r&&(o.style.width=r,o.style.height=s)}}function zo(n,e){n.style.transform=`translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px) translate(-50%, -50%)`}const Yc=10;function Fa(n,e){const t=_v(n);vi.set($c(e.x,t.width/2,window.innerWidth),$c(e.y,t.height/2,window.innerHeight)),zo(n,vi)}function $c(n,e,t){const i=e+Yc,r=t-e-Yc;return i>r?t/2:fl(n,i,r)}const Ns=new Map;function _v(n){const e=Ns.get(n);if(e!==void 0)return e;const t={width:n.offsetWidth,height:n.offsetHeight};return Ns.set(n,t),t}window.addEventListener("resize",()=>Ns.clear());const xv=3800,vv=1400;function Mv(n,e){const t=au();let i=t===null?"home":"join",r=null,s=t??"",a=null,o="searching",l=!1;function c(w){e.change(w),S()}function d(w){navigator.clipboard?.writeText(Fd(w)).then(()=>Yt("Invite link copied")).catch(()=>Yt("Could not copy — just tell them the code"))}function h(){const w=n.closest(".menu");return w!==null&&!w.hasAttribute("hidden")}function u(){r!==null&&window.clearTimeout(r),r=null}function f(w){u(),i=w,w!=="join"&&(s="",a=null),w!=="quit"&&(l=!1),S()}function x(){const w={home:"home",play:"home",search:"play",queue:"search",create:"home",join:"play",room:"home",settings:"home",quit:"home"};i==="room"&&(e.leaveRoom(),Od()),f(w[i])}function S(){n.replaceChildren(m()),n.closest(".menu__panel")?.classList.toggle("is-deep",i!=="home")}function m(){switch(i){case"home":return p();case"play":return R();case"search":return L();case"queue":return v();case"create":return y();case"join":return _();case"room":return U();case"settings":return D();case"quit":return O()}}function p(){const w=An();return e.hasSave()&&w.append(hi("Resume game","You have an unfinished game",e.resume)),w.append(hi("Play","Join friends or find other players",()=>f("play")),hi("Create game","Your own room with a code — you set the rules",()=>f("create")),hi("Settings","Speed and assists",()=>f("settings")),hi("Quit game",null,()=>f("quit"),{ghost:!0}),K()),w}function R(){const w=An("Play");return w.append(hi("Join a friend","Enter a room code to join a friend's game",()=>f("join")),hi("Matchmaking","Ranked game against other players",()=>f("search")),Z()),w}function L(){const w=An("Matchmaking"),V=Va(),N=document.createElement("button");N.type="button",N.className="mode",N.addEventListener("click",()=>{o="searching",f("queue"),E()});const $=document.createElement("div");$.className="mode__head",$.append(Le("b","mode__title","Ranked"),Le("span","mode__badge","Rated"));const ne=document.createElement("ul");ne.className="mode__rules";for(const ie of[`Always ${fs} players`,`Always ${Oa} rounds`,"Bots only fill seats that stay empty"])ne.append(Le("li",null,ie));const oe=document.createElement("div");return oe.className="mode__points",hs.forEach((ie,fe)=>{const Oe=Le("span","mode__point");Oe.append(Le("small",null,Ha(fe+1)),Le("b",ie>=0?"is-gain":"is-loss",ie>0?`+${ie}`:String(ie))),oe.append(Oe)}),N.append($,ne,oe,Le("span","mode__go","Find a match")),w.append(N,K(),Z()),V.games===0&&w.append(Rn("Your first ranked game decides where you start — losing it costs you nothing.")),w}function v(){const w=An("Ranked"),V=Le("div","queue"),N=Le("div","queue__runes");for(const ne of["◆","◆","◆"])N.append(Le("span",null,ne));return V.append(N,Le("p","queue__state",o==="searching"?"Looking for players …":"No more players found — bots take the empty seats."),Le("p","queue__count",`1 of ${fs} seats filled`)),w.append(V),o==="searching"&&w.append(jt([st("Cancel search",()=>f("search"),{ghost:!0})])),w.append(Rn(`Ranked: ${fs} players, ${Oa} rounds, fixed rules. Your final place counts toward your rank.`)),w}function E(){u(),r=window.setTimeout(()=>{o="filling",S(),r=window.setTimeout(()=>e.start(Dd()),vv)},xv)}function y(){const w=e.settings(),V=An("Create game"),N=w.roomCode??za(),$=Le("div","room");$.append(Le("span","room__label","Room code"),Le("b","room__code",N));const ne=Le("div","room__actions");ne.append(st("Copy",()=>{navigator.clipboard?.writeText(N).then(()=>Yt(`Room code ${N} copied`)).catch(()=>Yt("Could not copy — type the code instead"))},{ghost:!0,small:!0}),st("Copy link",()=>d(N),{ghost:!0,small:!0}),st("New code",()=>{c({roomCode:za()})},{ghost:!0,small:!0})),$.append(ne),V.append($);const oe=ko(w.playerCount);return V.append(ds("Players","01",[3,4,5,6].map(ie=>({label:String(ie),value:ie})),w.playerCount,ie=>c({playerCount:ie})),ds("Rounds","02",[...[3,5,8,10].filter(ie=>ie<oe).map(Sv),{label:`All (${oe})`,value:null}],w.rounds!==null&&w.rounds<oe?w.rounds:null,ie=>c({rounds:ie})),ds("Bots","03",Vd.map(ie=>({label:tf[ie],value:ie})),w.difficulty,ie=>c({difficulty:ie}))),V.append(C()),V.append(jt([st("Open room",()=>{const ie=e.settings();if(ie.playerName.trim().length===0){Yt("Enter your name first");return}const fe=ie.roomCode??N;Ll(fe),e.openRoom({create:!0,code:fe})}),st("Solo vs bots",()=>{const ie=e.settings();e.start(su({playerCount:ie.playerCount,difficulty:ie.difficulty,rounds:ie.rounds,roomCode:ie.roomCode??N}))},{ghost:!0}),st("Back",x,{ghost:!0})]),Rn('Tell your friends the room code — they join via "Play → Join a friend". Bots take any seats that stay empty. This game is unranked and earns no rank points.')),V}function C(){const w=Le("div","menu__group"),V=Le("span","menu__label");V.append(Le("small",null,"00"),document.createTextNode("Your name")),w.append(V);const N=document.createElement("input");return N.type="text",N.className="code__input is-name",N.autocomplete="off",N.maxLength=16,N.placeholder="What should the others call you?",N.value=e.settings().playerName,N.setAttribute("aria-label","Your name"),N.addEventListener("input",()=>e.change({playerName:N.value})),w.append(N),w}function _(){const w=An("Join a friend");w.append(C());const V=Le("div","code"),N=document.createElement("input");return N.type="text",N.className="code__input",N.autocomplete="off",N.spellcheck=!1,N.maxLength=Zi,N.placeholder="·".repeat(Zi),N.setAttribute("aria-label","Room code"),N.value=s,N.addEventListener("input",()=>{s=bs(N.value),s!==N.value&&(N.value=s)}),N.addEventListener("keydown",$=>{$.key==="Enter"&&b()}),V.append(N),w.append(Le("p","menu__lead",t===null?"Your friend creates the room and tells you the code.":"You've been invited — the code is already filled in. Just enter your name."),V,jt([st("Join",b),st("Back",x,{ghost:!0})])),a!==null&&(w.append(Rn(a,"is-warn")),w.append(jt([st("Create your own room instead",()=>f("create"),{ghost:!0})]))),queueMicrotask(()=>N.focus()),w}function b(){const w=s;if(!ka(w)){a=`A room code has ${Zi} characters — you have entered ${Yi(w.length,"character","characters")} so far.`,S();return}if(e.settings().playerName.trim().length===0){a="Enter your name first — the others should see who just joined.",S();return}a=null,Ll(w),e.openRoom({create:!1,code:w})}function U(){const w=An("Room"),V=e.room(),N=e.roomNote();if(N!==null)return w.append(Rn(N,"is-warn")),w.append(jt([st("Try again",()=>f("join"),{ghost:!0}),st("Create your own room",()=>f("create"),{ghost:!0}),st("Back",x,{ghost:!0})])),w;if(V===null||V.status()==="connecting")return w.append(Le("p","menu__lead","Connecting to the server …")),w.append(Z()),w;const $=V.lobby();if($===null)return w.append(Le("p","menu__lead","Waiting for the room …")),w.append(Z()),w;const ne=Le("div","room");ne.append(Le("span","room__label","Room code"),Le("b","room__code",$.code));const oe=Le("div","room__actions");oe.append(st("Copy",()=>{navigator.clipboard?.writeText($.code).then(()=>Yt(`Room code ${$.code} copied`)).catch(()=>Yt("Could not copy — type the code instead"))},{ghost:!0,small:!0}),st("Copy link",()=>d($.code),{ghost:!0,small:!0})),ne.append(oe),w.append(ne);const ie=Le("div","seats");$.seats.forEach((Te,Q)=>{const le=Le("div","seats__row"),ae=Q===V.seat(),Ce=Te.kind==="human"?ae?`${Te.name} (you)`:Te.name:Te.kind==="bot"?`${Te.name} · Bot`:"open — waiting for someone";le.append(Le("span","seats__seat",`${Q+1}`),Le("b","seats__who",Ce)),Te.kind==="human"&&!Te.connected&&le.append(Le("span","seats__state","disconnected")),Q===$.hostSeat&&le.append(Le("span","seats__state","Host")),ae&&le.classList.add("is-me"),Te.kind==="empty"&&le.classList.add("is-empty"),ie.append(le)}),w.append(ie);const fe=$.seats.filter(Te=>Te.kind==="human").length,Oe=$.seats.filter(Te=>Te.kind==="empty").length,Ke=$.rules.rounds;return w.append(Rn(`${fe} in the room, ${Yi(Oe,"seat","seats")} open · ${$.seats.length} at the table, ${Ke===null?"all rounds":Yi(Ke,"round","rounds")}.`)),V.isHost()?w.append(jt([st("Start game",()=>V.start()),st("Leave room",x,{ghost:!0})]),Rn("Bots take the empty seats. Start as soon as everyone's here.")):w.append(jt([st("Leave room",x,{ghost:!0})]),Rn("The host starts the game as soon as everyone's here.")),w}function D(){const w=e.settings(),V=An("Settings");V.append(ds("Speed","01",nf.map($=>({label:$.label,value:$.ms})),w.speed,$=>c({speed:$})));const N=Le("div","menu__switches");return N.append(Kc("Bid assist — estimates your hand strength",w.hint,$=>c({hint:$})),Kc("Card counter — shows cards already played",w.counting,$=>c({counting:$}))),V.append(N,jt([st("Back",x,{ghost:!0})])),V.append(Rn("Speed and assists apply immediately, even in a game in progress.")),V}function O(){const w=An("Quit game");return l?(w.append(Le("p","menu__lead","See you soon — you can close the tab now."),jt([st("Keep playing",()=>f("home"),{ghost:!0})])),w):(w.append(Le("p","menu__lead","Quit Runecall?"),jt([st("Quit",()=>{l=!0,e.quit(),S()}),st("Back",x,{ghost:!0})])),w)}function K(){const w=Va(),V=Le("div","rankstrip");V.append(Le("span","rankstrip__tier",du(w.points)),Le("b","rankstrip__points",`${w.points} RP`));const N=Qd(w.points);return V.append(Le("span","rankstrip__note",w.games===0?"no ranked games yet":`${Yi(w.games,"game","games")} · ${Yi(w.wins,"win","wins")}${N===null?"":` · ${N.from-w.points} to ${N.name}`}`)),V}function Z(){return jt([st("Back",x,{ghost:!0})])}return document.addEventListener("keydown",w=>{w.key==="Escape"&&h()&&i!=="home"&&(w.preventDefault(),x())}),{open(w){f(w??"home")},close(){u()},screen:()=>i,refresh(){h()&&S()}}}function Le(n,e,t){const i=document.createElement(n);return e!=null&&(i.className=e),t!==void 0&&(i.textContent=t),i}function An(n){const e=Le("div","menu__stack");return n!==void 0&&e.append(Le("h2","menu__heading",n)),e}function Rn(n,e){return Le("p",e===void 0?"menu__note":`menu__note ${e}`,n)}function jt(n){const e=Le("div","menu__actions");return e.append(...n),e}function st(n,e,t={}){const i=document.createElement("button");return i.type="button",i.textContent=n,t.ghost===!0&&i.classList.add("ghost"),t.small===!0&&i.classList.add("small"),i.addEventListener("click",e),i}function hi(n,e,t,i={}){const r=st("",t,i);return r.classList.add("bigbtn"),r.append(Le("b",null,n)),e!==null&&r.append(Le("small",null,e)),r}function Kc(n,e,t){const i=document.createElement("label");i.className="switch";const r=document.createElement("input");return r.type="checkbox",r.checked=e,r.addEventListener("change",()=>t(r.checked)),i.append(r,Le("span",null,n)),i}const Sv=n=>({label:String(n),value:n});function ds(n,e,t,i,r){const s=Le("div","menu__group"),a=Le("span","menu__label");a.append(Le("small",null,e),document.createTextNode(n)),s.append(a);const o=Le("div","choices");for(const l of t){const c=document.createElement("button");c.type="button",c.className="pill",c.textContent=l.label,c.setAttribute("aria-pressed",String(l.value===i)),l.value===i&&c.classList.add("is-active"),c.addEventListener("click",()=>r(l.value)),o.append(c)}return s.append(o),s}const yv={},bv=yv.VITE_SERVER_URL??"https://runecall-server.milchinien.workers.dev";function Ev(n){return`${bv.replace(/^http/,"ws").replace(/\/$/,"")}/room/${n}`}const dd=n=>`runecall.token.${n}`;function Tv(n){try{return window.sessionStorage.getItem(dd(n))??void 0}catch{return}}function wv(n,e){try{window.sessionStorage.setItem(dd(n),e)}catch{}}const fd=[500,1e3,2e3,4e3,8e3],Av=fd.length,Rv=25e3;function Cv(n,e){const{code:t,name:i,create:r,settings:s}=n;let a=null,o="connecting",l=null,c=-1,d=Tv(t),h=0,u=!1,f=null,x=null,S=null;function m(){if(u)return;const y=new WebSocket(Ev(t));a=y,y.addEventListener("open",()=>{h=0;const C={type:"hello",name:i,create:r&&d===void 0,...n.rules!==void 0?{rules:n.rules}:{},...d!==void 0?{token:d}:{}};y.send(JSON.stringify(C)),x=window.setInterval(()=>{y.readyState===WebSocket.OPEN&&y.send(JSON.stringify({type:"ping"}))},Rv)}),y.addEventListener("message",C=>{if(typeof C.data!="string")return;let _;try{_=JSON.parse(C.data)}catch{return}p(_)}),y.addEventListener("close",()=>{if(E(),u||o==="closed")return;if(h+=1,h>Av){o="closed",e.onClosed("Lost the connection to the server.");return}const C=fd[h-1]??8e3;f=window.setTimeout(m,C)})}function p(y){switch(y.type){case"welcome":c=y.seat,d=y.token,wv(t,y.token),R(y.lobby);return;case"lobby":R(y.lobby);return;case"view":L(y.view,y.names,y.sync===!0);return;case"refused":u=!0,o="closed",e.onRefused(y.reason);return;case"rejected":e.onRejected(y.message);return;case"pong":return}}function R(y){l=y,o!=="playing"&&(o=y.started?"playing":"lobby"),e.onLobby(y)}function L(y,C,_){if(S===null){S=Lv({first:y,names:C,settings:s,match:Pv(l,t),send:b=>v(b),onChange:n.onChange}),o="playing",e.onStart(S);return}S.receive(y,C,_)}function v(y){a!==null&&a.readyState===WebSocket.OPEN&&a.send(JSON.stringify(y))}function E(){x!==null&&window.clearInterval(x),x=null}return m(),{code:t,status:()=>o,lobby:()=>l,seat:()=>c,isHost:()=>l!==null&&c>=0&&l.hostSeat===c,setRules:y=>v({type:"set-rules",rules:y}),start:()=>v({type:"start"}),session:()=>S,leave(){u=!0,o="closed",E(),f!==null&&window.clearTimeout(f),f=null,S?.stop(),S=null,a?.close(1e3,"verlassen"),a=null}}}function Pv(n,e){return su({playerCount:n?.rules.playerCount??4,difficulty:n?.rules.difficulty??"normal",rounds:n?.rules.rounds??null,roomCode:e})}function Lv(n){const{settings:e,match:t,send:i,onChange:r}=n;let s=n.first,a=Zc(n.names,n.first.you),o="none",l=!1;const c=[];let d=null,h=null;const u=Math.max(700,Math.round(e.speed*1.25));function f(m,p){x(),h=p,d=window.setTimeout(()=>{d=null,h=null,l||p()},m)}function x(){d!==null&&window.clearTimeout(d),d=null,h=null}function S(){if(l)return;const m=c.shift();if(m===void 0){o="none",r();return}const p=m.lastTrick!==null&&m.lastTrick!==s.lastTrick;if(s=m,p){o="trick",r(),f(u,S);return}if(c.length>0){o="bot",r(),f(e.speed,S);return}o="none",r()}return{settings:e,match:t,get names(){return a},view:()=>s,waiting:()=>o,receive(m,p,R){if(!l){if(a=Zc(p,m.you),R){c.length=0,x(),s=m,o="none",r();return}c.push(m),d===null&&S()}},chooseTrump(m){i({type:"action",action:{type:"choose-trump",suit:m}})},bid(m){i({type:"action",action:{type:"bid",value:m}})},play(m){o==="none"&&i({type:"action",action:{type:"play",cardId:m}})},nextRound(){i({type:"action",action:{type:"next-round"}})},skip(){const m=h;m!==null&&(x(),m())},stop(){l=!0,x(),c.length=0}}}function Zc(n,e){return n.map((t,i)=>i===e?"You":t)}const pi=0,Iv=["You","Ben","Chris","Dana","Eli","Faye"];function hd(n,e){const{settings:t,match:i,seed:r}=n;let s=n.resume??Td({playerCount:i.playerCount,totalRounds:i.totalRounds,seed:r});const a=Array.from({length:s.playerCount},(v,E)=>Hd(i.difficulty,r+E*7919)),o=v=>{const E=a[v];if(E===void 0)throw new Error(`No bot in seat ${v}`);return E},l=Math.max(700,Math.round(t.speed*1.25));let c=null,d=null,h="none",u=null,f=!1;function x(v,E){S(),d=E,c=window.setTimeout(()=>{c=null,d=null,f||E()},v)}function S(){c!==null&&window.clearTimeout(c),c=null,d=null}function m(v){s=v,af({state:s,settings:t,seed:r,match:i}),p()}function p(){if(!f){if(e(),s.lastTrick!==null&&s.lastTrick!==u){h="trick",e(),x(l,()=>{u=s.lastTrick,h="none",p()});return}switch(s.phase){case"trump-choice":return s.dealer===pi?R():L(()=>ai(s,{type:"choose-trump",suit:o(s.dealer).chooseTrump(Br(s,s.dealer))}));case"bidding":return s.turn===pi?R():L(()=>ai(s,{type:"bid",value:o(s.turn).chooseBid(Br(s,s.turn))}));case"playing":return s.turn===pi?R():L(()=>ai(s,{type:"play",cardId:o(s.turn).chooseCard(Br(s,s.turn))}));case"round-end":case"game-over":return R()}}}function R(){h="none",e()}function L(v){h="bot",e(),x(t.speed,()=>{h="none",m(v())})}return u=s.lastTrick,queueMicrotask(p),{settings:t,match:i,names:Iv.slice(0,s.playerCount),view:()=>Br(s,pi),waiting:()=>h,chooseTrump(v){s.phase!=="trump-choice"||s.dealer!==pi||m(ai(s,{type:"choose-trump",suit:v}))},bid(v){s.phase!=="bidding"||s.turn!==pi||m(ai(s,{type:"bid",value:v}))},play(v){s.phase!=="playing"||s.turn!==pi||h==="none"&&m(ai(s,{type:"play",cardId:v}))},nextRound(){s.phase==="round-end"&&m(ai(s,{type:"next-round"}))},skip(){const v=d;v!==null&&(S(),h="none",v())},stop(){f=!0,S()}}}const ri=n=>{const e=document.getElementById(n);if(e===null)throw new Error(`Element #${n} is missing from the document`);return e};let tn={...hu,...sf()},Bt=null,yi=null,ys=null,Ur=null,Rr=!1;const Si=Mv(ri("menuScreen"),{settings:()=>tn,change(n){tn={...tn,...n},mu(tn),Bt!==null&&rr(Bt,xl)},hasSave:()=>gu()!==null,resume:Dv,start:pd,openRoom:Nv,leaveRoom:gl,room:()=>yi,roomNote:()=>ys,quit:Ov});function Cr(n){Bt?.stop(),Bt=null,n!=="room"&&gl(),ri("menu").hidden=!1,ri("table").hidden=!0,Si.open(n)}function ml(n){Si.close(),Bt=n,ri("menu").hidden=!0,ri("table").hidden=!1,rr(n,xl)}function pd(n){Bt?.stop(),pl(),_u(),Ur=null,Rr=!1;const e=Math.floor(Math.random()*2147483647);ml(hd({settings:tn,match:n,seed:e},_l))}function Dv(){const n=gu();if(n===null){Cr("home");return}Bt?.stop(),pl(),Ur=null,Rr=!1,ml(hd({settings:tn,match:n.match,seed:n.seed,resume:n.state},_l))}function Nv(n){gl(),Bt?.stop(),Bt=null,ys=null,Ur=null,Rr=!1,yi=Cv({code:n.code,name:tn.playerName.trim(),create:n.create,settings:tn,rules:{playerCount:tn.playerCount,rounds:tn.rounds,difficulty:tn.difficulty},onChange:_l},{onLobby:()=>Si.refresh(),onStart(e){pl(),ml(e)},onRefused(e){ys=Uv(e,n.code),yi=null,Si.refresh()},onClosed(e){ys=e,yi=null,Bt===null?Si.refresh():Yt(e)},onRejected:e=>Yt(e)}),Si.open("room")}function gl(){yi?.leave(),yi=null}function Uv(n,e){switch(n){case"no-such-room":return`No room with the code ${e}. A typo — or hasn't your friend opened the room yet?`;case"room-full":return`Room ${e} is full. The host can raise the player count to make space for one more.`;case"already-started":return`The game in room ${e} has already started. Players who weren't there from the start can't join anymore.`;case"bad-code":return"That isn't a valid room code.";case"bad-name":return"You need a name — enter one and try again."}}function _l(){const n=Bt;n!==null&&(Fv(n),rr(n,xl))}function Fv(n){if(Rr||n.match.mode!=="ranked")return;const e=n.view();if(e.phase!=="game-over")return;Rr=!0;const t=ef(Zd(e.scores,e.you)),i=`${t.rank.points} RP (${du(t.rank.points)})`;Ur=t.delta===0?`${Ha(t.place)} place — you can't drop below zero, so you stay at ${i}.`:`${Ha(t.place)} place — ${t.delta>0?"+":"-"}${Yi(Math.abs(t.delta),"rank point","rank points")}. You are now at ${i}.`}const xl={onMenu:()=>{_u(),Cr("home")},onNewGame:()=>{if(yi!==null){Bt?.stop(),Bt=null,ri("menu").hidden=!1,ri("table").hidden=!0,Si.open("room");return}const n=Bt?.match;if(n===void 0)return Cr("home");pd(n)},rankNote:()=>Ur};ri("btnMenu").addEventListener("click",()=>Cr("home"));function Ov(){window.close()}Cr(au()===null?"home":"join");ld();
