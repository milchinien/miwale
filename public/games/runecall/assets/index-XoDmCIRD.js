(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const Cn=["red","yellow","green","blue"],Oc=[1,2,3,4,5,6,7,8,9,10,11,12,13],Bc=4,zc=4,Qn=n=>n.kind==="pip";function Tr(){const n=[];for(const e of Cn)for(const t of Oc)n.push({id:`${e}-${t}`,kind:"pip",suit:e,value:t});for(let e=1;e<=Bc;e++)n.push({id:`mage-${e}`,kind:"mage"});for(let e=1;e<=zc;e++)n.push({id:`jester-${e}`,kind:"jester"});return n}const ad=Cn.length*Oc.length+Bc+zc;function kc(n){let e=n>>>0;const t=()=>{e=e+1831565813>>>0;let i=e;return i=Math.imul(i^i>>>15,i|1),i^=i+Math.imul(i^i>>>7,i|61),((i^i>>>14)>>>0)/4294967296};return{next:t,nextInt:i=>Math.floor(t()*i),seed:n>>>0}}function od(n,e){const t=n.slice();for(let i=t.length-1;i>0;i--){const r=e.nextInt(i+1),s=t[i],a=t[r];s!==void 0&&a!==void 0&&(t[i]=a,t[r]=s)}return t}const gl=3,_l=6;function Do(n){return Math.floor(ad/n)}function Io(n){for(const e of n){if(e.card.kind==="mage")return{suit:null,settled:!0};if(Qn(e.card))return{suit:e.card.suit,settled:!0}}return{suit:null,settled:!1}}function Uo(n,e,t){const i=Io(t);return i.suit===null||!Qn(n)||n.suit===i.suit?null:e.some(s=>Qn(s)&&s.suit===i.suit)?{code:"must-follow-suit",suit:i.suit}:null}const ld=(n,e,t)=>Uo(n,e,t)===null;function Gc(n,e){return n.filter(t=>ld(t,n,e))}function xl(n,e){let t=null;for(const i of n)Qn(i.card)&&i.card.suit===e&&(t===null||!Qn(t.card)||i.card.value>t.card.value)&&(t=i);return t}function Hc(n,e){const t=n[0];if(t===void 0)throw new RangeError("Ein leerer Stich hat keinen Gewinner");const i=n.find(s=>s.card.kind==="mage");if(i!==void 0)return{winner:i.player,card:i.card,reason:"mage"};if(e!==null){const s=xl(n,e);if(s!==null)return{winner:s.player,card:s.card,reason:"trump"}}const r=Io(n);if(r.suit!==null){const s=xl(n,r.suit);if(s!==null)return{winner:s.player,card:s.card,reason:"led-suit"}}return{winner:t.player,card:t.card,reason:"jesters-only"}}function No(n,e){return n===e?20+10*n:-10*Math.abs(n-e)}function Vc(n){const e=Math.max(...n),t=[];return n.forEach((i,r)=>{i===e&&t.push(r)}),t}function Fo(n,e){const t=r=>r.kind==="mage"?0:r.kind==="jester"?2:1,i=r=>r===e?-1:Cn.indexOf(r);return n.slice().sort((r,s)=>{const a=t(r)-t(s);if(a!==0)return a;if(Qn(r)&&Qn(s)){const o=i(r.suit)-i(s.suit);return o!==0?o:s.value-r.value}return r.id<s.id?-1:1})}class $t extends Error{code;constructor(e,t){super(t),this.name="RuleError",this.code=e}}function cd(n){const{playerCount:e,seed:t}=n;if(!Number.isInteger(e)||e<gl||e>_l)throw new $t("player-count",`Runecall wird zu ${gl} bis ${_l} gespielt, nicht zu ${e}`);const i=n.dealer??0;if(!Number.isInteger(i)||i<0||i>=e)throw new $t("dealer",`Sitzplatz ${i} gibt es bei ${e} Spielern nicht`);const r=Do(e),s=n.totalRounds??r;if(!Number.isInteger(s)||s<1||s>r)throw new $t("total-rounds",`Zu ${e} Spielern sind 1 bis ${r} Runden moeglich, nicht ${s}`);const a={playerCount:e,seed:t,totalRounds:s,roundNumber:0,dealer:i,phase:"round-end",hands:[],stock:[],playedCards:[],trumpCard:null,trumpSuit:null,bids:[],tricksWon:[],scores:Array.from({length:e},()=>0),trickNumber:0,currentTrick:[],lastTrick:null,leader:i,turn:i,events:[]};return Wc(a,1,i)}function ud(n,e){let t=(n^Math.imul(e,2654435761))>>>0;return t=Math.imul(t^t>>>16,2246822507)>>>0,t>>>0}function Wc(n,e,t){const{playerCount:i}=n,r=od(Tr(),kc(ud(n.seed,e))),s=Array.from({length:i},()=>[]);let a=0;for(let u=0;u<e;u++)for(let h=1;h<=i;h++){const x=r[a],S=s[(t+h)%i];if(x===void 0||S===void 0)throw new $t("deal",`Das Deck reicht fuer Runde ${e} nicht aus`);S.push(x),a++}const o=r.slice(a),l=o[0]??null,c=(t+1)%i;let d=null,f="bidding";return l!==null&&(l.kind==="pip"?d=l.suit:l.kind==="mage"&&(f="trump-choice")),{...n,roundNumber:e,dealer:t,phase:f,hands:s,stock:o,playedCards:[],trumpCard:l,trumpSuit:d,bids:Array.from({length:i},()=>null),tricksWon:Array.from({length:i},()=>0),trickNumber:1,currentTrick:[],lastTrick:null,leader:c,turn:f==="trump-choice"?t:c,events:[...n.events,{type:"round-dealt",round:e,dealer:t},{type:"trump-revealed",card:l,suit:d}]}}function ii(n,e){switch(e.type){case"choose-trump":return dd(n,e.suit);case"bid":return fd(n,e.value);case"play":return hd(n,e.cardId);case"next-round":return md(n)}}function Rs(n,e){if(n.phase!==e)throw new $t("phase",`Erwartet wurde die Phase ${e}, die Partie steht auf ${n.phase}`)}function dd(n,e){if(Rs(n,"trump-choice"),!Cn.includes(e))throw new $t("suit",`${e} ist keine der vier Farben`);return{...n,trumpSuit:e,phase:"bidding",turn:n.leader,events:[...n.events,{type:"trump-chosen",player:n.dealer,suit:e}]}}function fd(n,e){if(Rs(n,"bidding"),!Number.isInteger(e)||e<0||e>n.roundNumber)throw new $t("bid-range",`Ansage ${e} liegt nicht zwischen 0 und ${n.roundNumber}`);const t=n.turn,i=n.bids.map((s,a)=>a===t?e:s),r=i.every(s=>s!==null);return{...n,bids:i,phase:r?"playing":"bidding",turn:r?n.leader:(t+1)%n.playerCount,events:[...n.events,{type:"bid",player:t,value:e}]}}function hd(n,e){Rs(n,"playing");const t=n.turn,i=n.hands[t];if(i===void 0)throw new $t("seat",`Sitzplatz ${t} gibt es nicht`);const r=i.find(x=>x.id===e);if(r===void 0)throw new $t("card-not-in-hand",`Karte ${e} liegt nicht auf der Hand von Sitzplatz ${t}`);const s=Uo(r,i,n.currentTrick);if(s!==null)throw new $t(s.code,`Sitzplatz ${t} muss ${s.suit} bedienen`);const a=n.hands.map((x,S)=>S===t?x.filter(m=>m.id!==e):x),o=[...n.currentTrick,{player:t,card:r}],l=[...n.events,{type:"card-played",player:t,card:r}],c=[...n.playedCards,r];if(o.length<n.playerCount)return{...n,hands:a,currentTrick:o,playedCards:c,turn:(t+1)%n.playerCount,events:l};const d=Hc(o,n.trumpSuit),f=n.tricksWon.map((x,S)=>S===d.winner?x+1:x),u={plays:o,winner:d.winner,reason:d.reason};return l.push({type:"trick-won",plays:o,winner:d.winner,reason:d.reason}),n.trickNumber>=n.roundNumber?pd({...n,hands:a,playedCards:c,tricksWon:f,currentTrick:[],lastTrick:u,events:l}):{...n,hands:a,playedCards:c,tricksWon:f,trickNumber:n.trickNumber+1,currentTrick:[],lastTrick:u,leader:d.winner,turn:d.winner,events:l}}function pd(n){const t=n.bids.map((r,s)=>{if(r===null)throw new $t("internal",`Sitzplatz ${s} hat nie angesagt, die Runde kann nicht gewertet werden`);return r}).map((r,s)=>No(r,n.tricksWon[s]??0)),i=n.scores.map((r,s)=>r+(t[s]??0));return{...n,phase:"round-end",scores:i,events:[...n.events,{type:"round-scored",round:n.roundNumber,points:t,totals:i}]}}function md(n){if(Rs(n,"round-end"),n.roundNumber>=n.totalRounds){const e=Vc(n.scores);return{...n,phase:"game-over",events:[...n.events,{type:"game-over",winners:e}]}}return Wc(n,n.roundNumber+1,(n.dealer+1)%n.playerCount)}function Dr(n,e){const t=n.hands[e];if(t===void 0)throw new $t("seat",`Sitzplatz ${e} gibt es nicht`);const r=n.phase==="playing"&&n.turn===e?Gc(t,n.currentTrick).map(s=>s.id):[];return{you:e,hand:t,handSizes:n.hands.map(s=>s.length),playable:r,phase:n.phase,roundNumber:n.roundNumber,totalRounds:n.totalRounds,dealer:n.dealer,leader:n.leader,turn:n.turn,trickNumber:n.trickNumber,trumpCard:n.trumpCard,trumpSuit:n.trumpSuit,bids:n.bids,tricksWon:n.tricksWon,scores:n.scores,currentTrick:n.currentTrick,lastTrick:n.lastTrick,playedCards:n.playedCards,stockSize:n.stock.length}}const gd=Tr();function _d(n){const e=new Set;for(const t of n.hand)e.add(t.id);for(const t of n.playedCards)e.add(t.id);return n.trumpCard!==null&&e.add(n.trumpCard.id),{unseen:gd.filter(t=>!e.has(t.id)),trump:n.trumpSuit}}function xd(n,e,t){if(n.kind==="mage")return!0;if(e.kind==="mage"||n.kind==="jester")return!1;if(e.kind==="jester")return!0;const i=t!==null&&n.suit===t,r=t!==null&&e.suit===t;return i!==r?i:n.suit!==e.suit?!1:n.value>e.value}function vd(n,e){for(const t of n.unseen)if(xd(t,e,n.trump))return!1;return!0}const Md=["easy","normal","hard"];function Sd(n,e){const t=kc(e);return{difficulty:n,chooseTrump:i=>bd(i),chooseBid:i=>Ed(i,n,t),chooseCard:i=>yd(i,n,t)}}function Xc(n,e,t){return n.kind==="mage"?.95:n.kind==="jester"?.02:e!==null&&n.suit===e?Math.min(.92,.22+.06*n.value):Math.max(0,(n.value-8)/6)*Math.pow(.85,t-3)}function qc(n){return n.hand.reduce((e,t)=>e+Xc(t,n.trumpSuit,n.handSizes.length),0)}function bd(n){let e=Cn[0]??"red",t=-1;for(const i of Cn){let r=0;for(const s of n.hand)Qn(s)&&s.suit===i&&(r+=s.value>=10?2:1);r>t&&(e=i,t=r)}return e}function Ed(n,e,t){let i=qc(n);return e==="easy"&&(i+=t.next()-.5),e==="hard"&&n.bids.reduce((s,a)=>s+(a??0),0)>=n.roundNumber&&(i-=.35),Td(Math.round(i),0,n.roundNumber)}function yd(n,e,t){const i=Gc(n.hand,n.currentTrick),r=i[0];if(r===void 0)throw new Error("Kein erlaubter Zug -- das darf die Engine nicht zulassen");if(i.length===1)return r.id;if(e==="easy")return(i[t.nextInt(i.length)]??r).id;const s=e==="hard",a=S=>Xc(S,n.trumpSuit,n.handSizes.length),o=n.bids[n.you]??0,l=n.tricksWon[n.you]??0,c=o-l,d=n.hand.length,f=c>=d?!0:c>0;if(n.currentTrick.length===0)return(f?Bs(i,a):nr(i,a)).id;const u=i.filter(S=>vl(n,S)),h=i.filter(S=>!vl(n,S)),x=n.currentTrick.length===n.handSizes.length-1;if(f){if(u.length===0)return nr(i,a).id;if(x)return nr(u,a).id;if(s){const S=_d(n),m=u.filter(R=>vd(S,R)),p=m[0]===void 0?null:nr(m,a);if(p!==null)return p.id}return Bs(u,a).id}return h.length>0?Bs(h,a).id:nr(u,a).id}function vl(n,e){const t=[...n.currentTrick,{player:n.you,card:e}];return Hc(t,n.trumpSuit).winner===n.you}function Bs(n,e){return Yc(n,(t,i)=>e(t)>=e(i))}function nr(n,e){return Yc(n,(t,i)=>e(t)<=e(i))}function Yc(n,e){const t=n[0];if(t===void 0)throw new Error("Auswahl aus einer leeren Kartenmenge");let i=t;for(const r of n)e(r,i)&&(i=r);return i}const Td=(n,e,t)=>Math.max(e,Math.min(t,n)),as=4,La=8,Ad="hard";function wd(){return{mode:"ranked",playerCount:as,totalRounds:La,difficulty:Ad,roomCode:null}}function Rd(n){return{mode:"friends",playerCount:n.playerCount,totalRounds:Cd(n.rounds,n.playerCount),difficulty:n.difficulty,roomCode:n.roomCode}}function Cd(n,e){const t=Do(e);return n===null?t:Math.max(1,Math.min(t,Math.round(n)))}const Da="ABCDEFGHJKLMNPQRTUVWXYZ2346789",Wi=5;function Ia(){const n=new Uint32Array(Wi);crypto.getRandomValues(n);let e="";for(const t of n)e+=Da[t%Da.length];return e}function $c(n){return[...n.toUpperCase()].filter(e=>Da.includes(e)).slice(0,Wi).join("")}function Pd(n){return $c(n).length===Wi}function Oo(n){try{const e=localStorage.getItem(n);return e===null?null:JSON.parse(e)}catch{return null}}function Bo(n,e){try{localStorage.setItem(n,JSON.stringify(e))}catch{}}function Ld(n){try{localStorage.removeItem(n)}catch{}}const os=[5,2,-1,-4],Dd={points:0,games:0,wins:0};function Id(n,e){const t=n[e]??0;return 1+n.filter(i=>i>t).length}function Ud(n){return os[n-1]??os[os.length-1]??0}const Ua=[{from:0,name:"Funke"},{from:25,name:"Rune"},{from:60,name:"Siegel"},{from:110,name:"Zirkel"},{from:180,name:"Erzmagier"}];function Kc(n){let e=Ua[0]?.name??"";for(const t of Ua)n>=t.from&&(e=t.name);return e}function Nd(n){return Ua.find(e=>e.from>n)??null}const Zc="runecall.rank.v1";function Na(){const n=Oo(Zc);if(n===null||typeof n!="object")return Dd;const e=n;return{points:zs(e.points),games:zs(e.games),wins:zs(e.wins)}}function Fd(n){Bo(Zc,n)}function Od(n){const e=Na(),t=Math.max(0,e.points+Ud(n)),i={points:t,games:e.games+1,wins:e.wins+(n===1?1:0)};return Fd(i),{place:n,delta:t-e.points,rank:i}}function zs(n){return typeof n=="number"&&Number.isFinite(n)?Math.max(0,Math.round(n)):0}const Jc={playerCount:4,difficulty:"normal",rounds:null,roomCode:null,speed:1e3,counting:!1,hint:!0},Bd={easy:"Leicht",normal:"Normal",hard:"Schwer"},zd=[{label:"Ruhig",ms:1600},{label:"Normal",ms:1e3},{label:"Zügig",ms:550}],kd={1100:1600,600:1e3,260:550},Qc="runecall.settings.v1",zo="runecall.save.v1";function Gd(){const n=Oo(Qc),e={...Jc,...n??{}},t={...e,speed:kd[e.speed]??e.speed,roomCode:e.roomCode??Ia()};return e.roomCode!==t.roomCode&&jc(t),t}function jc(n){Bo(Qc,n)}function eu(){const n=Oo(zo);if(n===null)return null;const e=n;return e.state===void 0||e.settings===void 0||e.state.phase==="game-over"?null:{state:e.state,settings:e.settings,seed:e.seed??0,match:e.match??{mode:"friends",playerCount:e.state.playerCount,totalRounds:e.state.totalRounds,difficulty:e.settings.difficulty,roomCode:null}}}function Hd(n){Bo(zo,n)}function tu(){Ld(zo)}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ko="185",Vd=0,Ml=1,Wd=2,ls=1,Xd=2,mr=3,jn=0,Nt=1,Ht=2,wn=0,Xi=1,ei=2,Sl=3,bl=4,qd=5,fi=100,Yd=101,$d=102,Kd=103,Zd=104,Jd=200,Qd=201,jd=202,ef=203,Fa=204,Oa=205,tf=206,nf=207,rf=208,sf=209,af=210,of=211,lf=212,cf=213,uf=214,Ba=0,za=1,ka=2,$i=3,Ga=4,Ha=5,Va=6,Wa=7,nu=0,df=1,ff=2,hn=0,iu=1,ru=2,su=3,Go=4,au=5,ou=6,lu=7,cu=300,_i=301,Ki=302,ks=303,Gs=304,Cs=306,Xa=1e3,jt=1001,qa=1002,wt=1003,hf=1004,Ir=1005,yt=1006,Hs=1007,Tn=1008,Vt=1009,uu=1010,du=1011,Mr=1012,Ho=1013,gn=1014,cn=1015,Pn=1016,Vo=1017,Wo=1018,Sr=1020,fu=35902,hu=35899,pu=1021,mu=1022,en=1023,Ln=1026,gi=1027,gu=1028,Xo=1029,xi=1030,qo=1031,Yo=1033,cs=33776,us=33777,ds=33778,fs=33779,Ya=35840,$a=35841,Ka=35842,Za=35843,Ja=36196,Qa=37492,ja=37496,eo=37488,to=37489,gs=37490,no=37491,io=37808,ro=37809,so=37810,ao=37811,oo=37812,lo=37813,co=37814,uo=37815,fo=37816,ho=37817,po=37818,mo=37819,go=37820,_o=37821,xo=36492,vo=36494,Mo=36495,So=36283,bo=36284,_s=36285,Eo=36286,pf=3200,yo=0,mf=1,Yn="",ut="srgb",xs="srgb-linear",vs="linear",Ze="srgb",Ei=7680,El=519,gf=512,_f=513,xf=514,$o=515,vf=516,Mf=517,Ko=518,Sf=519,yl=35044,bf=35048,Tl="300 es",un=2e3,br=2001;function Ef(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ms(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function yf(){const n=Ms("canvas");return n.style.display="block",n}const Al={};function wl(...n){const e="THREE."+n.shift();console.log(e,...n)}function _u(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Pe(...n){n=_u(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Xe(...n){n=_u(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function qi(...n){const e=n.join(" ");e in Al||(Al[e]=!0,Pe(...n))}function Tf(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const Af={[Ba]:za,[ka]:Va,[Ga]:Wa,[$i]:Ha,[za]:Ba,[Va]:ka,[Wa]:Ga,[Ha]:$i};class vi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Lt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Vs=Math.PI/180,Ss=180/Math.PI;function Ar(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Lt[n&255]+Lt[n>>8&255]+Lt[n>>16&255]+Lt[n>>24&255]+"-"+Lt[e&255]+Lt[e>>8&255]+"-"+Lt[e>>16&15|64]+Lt[e>>24&255]+"-"+Lt[t&63|128]+Lt[t>>8&255]+"-"+Lt[t>>16&255]+Lt[t>>24&255]+Lt[i&255]+Lt[i>>8&255]+Lt[i>>16&255]+Lt[i>>24&255]).toLowerCase()}function We(n,e,t){return Math.max(e,Math.min(t,n))}function wf(n,e){return(n%e+e)%e}function Ws(n,e,t){return(1-t)*n+t*e}function ir(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Ft(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class Fe{static{Fe.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class dn{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],d=i[r+2],f=i[r+3],u=s[a+0],h=s[a+1],x=s[a+2],S=s[a+3];if(f!==S||l!==u||c!==h||d!==x){let m=l*u+c*h+d*x+f*S;m<0&&(u=-u,h=-h,x=-x,S=-S,m=-m);let p=1-o;if(m<.9995){const R=Math.acos(m),P=Math.sin(R);p=Math.sin(p*R)/P,o=Math.sin(o*R)/P,l=l*p+u*o,c=c*p+h*o,d=d*p+x*o,f=f*p+S*o}else{l=l*p+u*o,c=c*p+h*o,d=d*p+x*o,f=f*p+S*o;const R=1/Math.sqrt(l*l+c*c+d*d+f*f);l*=R,c*=R,d*=R,f*=R}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],d=i[r+3],f=s[a],u=s[a+1],h=s[a+2],x=s[a+3];return e[t]=o*x+d*f+l*h-c*u,e[t+1]=l*x+d*u+c*f-o*h,e[t+2]=c*x+d*h+o*u-l*f,e[t+3]=d*x-o*f-l*u-c*h,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(r/2),f=o(s/2),u=l(i/2),h=l(r/2),x=l(s/2);switch(a){case"XYZ":this._x=u*d*f+c*h*x,this._y=c*h*f-u*d*x,this._z=c*d*x+u*h*f,this._w=c*d*f-u*h*x;break;case"YXZ":this._x=u*d*f+c*h*x,this._y=c*h*f-u*d*x,this._z=c*d*x-u*h*f,this._w=c*d*f+u*h*x;break;case"ZXY":this._x=u*d*f-c*h*x,this._y=c*h*f+u*d*x,this._z=c*d*x+u*h*f,this._w=c*d*f-u*h*x;break;case"ZYX":this._x=u*d*f-c*h*x,this._y=c*h*f+u*d*x,this._z=c*d*x-u*h*f,this._w=c*d*f+u*h*x;break;case"YZX":this._x=u*d*f+c*h*x,this._y=c*h*f+u*d*x,this._z=c*d*x-u*h*f,this._w=c*d*f-u*h*x;break;case"XZY":this._x=u*d*f-c*h*x,this._y=c*h*f-u*d*x,this._z=c*d*x+u*h*f,this._w=c*d*f+u*h*x;break;default:Pe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],f=t[10],u=i+o+f;if(u>0){const h=.5/Math.sqrt(u+1);this._w=.25/h,this._x=(d-l)*h,this._y=(s-c)*h,this._z=(a-r)*h}else if(i>o&&i>f){const h=2*Math.sqrt(1+i-o-f);this._w=(d-l)/h,this._x=.25*h,this._y=(r+a)/h,this._z=(s+c)/h}else if(o>f){const h=2*Math.sqrt(1+o-i-f);this._w=(s-c)/h,this._x=(r+a)/h,this._y=.25*h,this._z=(l+d)/h}else{const h=2*Math.sqrt(1+f-i-o);this._w=(a-r)/h,this._x=(s+c)/h,this._y=(l+d)/h,this._z=.25*h}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+r*c-s*l,this._y=r*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-r*o,this._w=a*d-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),d=Math.sin(c);l=Math.sin(l*c)/d,t=Math.sin(t*c)/d,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{static{O.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Rl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Rl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),d=2*(o*t-s*r),f=2*(s*i-a*t);return this.x=t+l*c+a*f-o*d,this.y=i+l*d+o*c-s*f,this.z=r+l*f+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Xs.copy(this).projectOnVector(e),this.sub(Xs)}reflect(e){return this.sub(Xs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(We(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Xs=new O,Rl=new dn;class Ie{static{Ie.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],f=i[7],u=i[2],h=i[5],x=i[8],S=r[0],m=r[3],p=r[6],R=r[1],P=r[4],v=r[7],T=r[2],y=r[5],L=r[8];return s[0]=a*S+o*R+l*T,s[3]=a*m+o*P+l*y,s[6]=a*p+o*v+l*L,s[1]=c*S+d*R+f*T,s[4]=c*m+d*P+f*y,s[7]=c*p+d*v+f*L,s[2]=u*S+h*R+x*T,s[5]=u*m+h*P+x*y,s[8]=u*p+h*v+x*L,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],f=d*a-o*c,u=o*l-d*s,h=c*s-a*l,x=t*f+i*u+r*h;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/x;return e[0]=f*S,e[1]=(r*c-d*i)*S,e[2]=(o*i-r*a)*S,e[3]=u*S,e[4]=(d*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=h*S,e[7]=(i*l-c*t)*S,e[8]=(a*t-i*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return qi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(qs.makeScale(e,t)),this}rotate(e){return qi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(qs.makeRotation(-e)),this}translate(e,t){return qi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(qs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const qs=new Ie,Cl=new Ie().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Pl=new Ie().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Rf(){const n={enabled:!0,workingColorSpace:xs,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Ze&&(r.r=Rn(r.r),r.g=Rn(r.g),r.b=Rn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Ze&&(r.r=Yi(r.r),r.g=Yi(r.g),r.b=Yi(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Yn?vs:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return qi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return qi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[xs]:{primaries:e,whitePoint:i,transfer:vs,toXYZ:Cl,fromXYZ:Pl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:ut},outputColorSpaceConfig:{drawingBufferColorSpace:ut}},[ut]:{primaries:e,whitePoint:i,transfer:Ze,toXYZ:Cl,fromXYZ:Pl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:ut}}}),n}const Ve=Rf();function Rn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Yi(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let yi;class Cf{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{yi===void 0&&(yi=Ms("canvas")),yi.width=e.width,yi.height=e.height;const r=yi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=yi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ms("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Rn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Rn(t[i]/255)*255):t[i]=Rn(t[i]);return{data:t,width:e.width,height:e.height}}else return Pe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Pf=0;class Zo{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pf++}),this.uuid=Ar(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Ys(r[a].image)):s.push(Ys(r[a]))}else s=Ys(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Ys(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Cf.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Pe("Texture: Unable to serialize Texture."),{})}let Lf=0;const $s=new O;class Rt extends vi{constructor(e=Rt.DEFAULT_IMAGE,t=Rt.DEFAULT_MAPPING,i=jt,r=jt,s=yt,a=Tn,o=en,l=Vt,c=Rt.DEFAULT_ANISOTROPY,d=Yn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Lf++}),this.uuid=Ar(),this.name="",this.source=new Zo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Fe(0,0),this.repeat=new Fe(1,1),this.center=new Fe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ie,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize($s).x}get height(){return this.source.getSize($s).y}get depth(){return this.source.getSize($s).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Pe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Pe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==cu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Xa:e.x=e.x-Math.floor(e.x);break;case jt:e.x=e.x<0?0:1;break;case qa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Xa:e.y=e.y-Math.floor(e.y);break;case jt:e.y=e.y<0?0:1;break;case qa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Rt.DEFAULT_IMAGE=null;Rt.DEFAULT_MAPPING=cu;Rt.DEFAULT_ANISOTROPY=1;class at{static{at.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],d=l[4],f=l[8],u=l[1],h=l[5],x=l[9],S=l[2],m=l[6],p=l[10];if(Math.abs(d-u)<.01&&Math.abs(f-S)<.01&&Math.abs(x-m)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+S)<.1&&Math.abs(x+m)<.1&&Math.abs(c+h+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const P=(c+1)/2,v=(h+1)/2,T=(p+1)/2,y=(d+u)/4,L=(f+S)/4,_=(x+m)/4;return P>v&&P>T?P<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(P),r=y/i,s=L/i):v>T?v<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),i=y/r,s=_/r):T<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),i=L/s,r=_/s),this.set(i,r,s,t),this}let R=Math.sqrt((m-x)*(m-x)+(f-S)*(f-S)+(u-d)*(u-d));return Math.abs(R)<.001&&(R=1),this.x=(m-x)/R,this.y=(f-S)/R,this.z=(u-d)/R,this.w=Math.acos((c+h+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(We(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Df extends vi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:yt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new at(0,0,e,t),this.scissorTest=!1,this.viewport=new at(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Rt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:yt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Zo(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class pn extends Df{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class xu extends Rt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=wt,this.minFilter=wt,this.wrapR=jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class If extends Rt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=wt,this.minFilter=wt,this.wrapR=jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class rt{static{rt.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,l,c,d,f,u,h,x,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,d,f,u,h,x,S,m)}set(e,t,i,r,s,a,o,l,c,d,f,u,h,x,S,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=d,p[10]=f,p[14]=u,p[3]=h,p[7]=x,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new rt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Ti.setFromMatrixColumn(e,0).length(),s=1/Ti.setFromMatrixColumn(e,1).length(),a=1/Ti.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const u=a*d,h=a*f,x=o*d,S=o*f;t[0]=l*d,t[4]=-l*f,t[8]=c,t[1]=h+x*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=x+h*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*d,h=l*f,x=c*d,S=c*f;t[0]=u+S*o,t[4]=x*o-h,t[8]=a*c,t[1]=a*f,t[5]=a*d,t[9]=-o,t[2]=h*o-x,t[6]=S+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*d,h=l*f,x=c*d,S=c*f;t[0]=u-S*o,t[4]=-a*f,t[8]=x+h*o,t[1]=h+x*o,t[5]=a*d,t[9]=S-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*d,h=a*f,x=o*d,S=o*f;t[0]=l*d,t[4]=x*c-h,t[8]=u*c+S,t[1]=l*f,t[5]=S*c+u,t[9]=h*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,h=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=S-u*f,t[8]=x*f+h,t[1]=f,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=h*f+x,t[10]=u-S*f}else if(e.order==="XZY"){const u=a*l,h=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=-f,t[8]=c*d,t[1]=u*f+S,t[5]=a*d,t[9]=h*f-x,t[2]=x*f-h,t[6]=o*d,t[10]=S*f+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Uf,e,Nf)}lookAt(e,t,i){const r=this.elements;return kt.subVectors(e,t),kt.lengthSq()===0&&(kt.z=1),kt.normalize(),On.crossVectors(i,kt),On.lengthSq()===0&&(Math.abs(i.z)===1?kt.x+=1e-4:kt.z+=1e-4,kt.normalize(),On.crossVectors(i,kt)),On.normalize(),Ur.crossVectors(kt,On),r[0]=On.x,r[4]=Ur.x,r[8]=kt.x,r[1]=On.y,r[5]=Ur.y,r[9]=kt.y,r[2]=On.z,r[6]=Ur.z,r[10]=kt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],f=i[5],u=i[9],h=i[13],x=i[2],S=i[6],m=i[10],p=i[14],R=i[3],P=i[7],v=i[11],T=i[15],y=r[0],L=r[4],_=r[8],b=r[12],U=r[1],E=r[5],I=r[9],G=r[13],Y=r[2],k=r[6],K=r[10],z=r[14],te=r[3],re=r[7],ce=r[11],de=r[15];return s[0]=a*y+o*U+l*Y+c*te,s[4]=a*L+o*E+l*k+c*re,s[8]=a*_+o*I+l*K+c*ce,s[12]=a*b+o*G+l*z+c*de,s[1]=d*y+f*U+u*Y+h*te,s[5]=d*L+f*E+u*k+h*re,s[9]=d*_+f*I+u*K+h*ce,s[13]=d*b+f*G+u*z+h*de,s[2]=x*y+S*U+m*Y+p*te,s[6]=x*L+S*E+m*k+p*re,s[10]=x*_+S*I+m*K+p*ce,s[14]=x*b+S*G+m*z+p*de,s[3]=R*y+P*U+v*Y+T*te,s[7]=R*L+P*E+v*k+T*re,s[11]=R*_+P*I+v*K+T*ce,s[15]=R*b+P*G+v*z+T*de,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],f=e[6],u=e[10],h=e[14],x=e[3],S=e[7],m=e[11],p=e[15],R=l*h-c*u,P=o*h-c*f,v=o*u-l*f,T=a*h-c*d,y=a*u-l*d,L=a*f-o*d;return t*(S*R-m*P+p*v)-i*(x*R-m*T+p*y)+r*(x*P-S*T+p*L)-s*(x*v-S*y+m*L)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],d=e[10];return t*(a*d-o*c)-i*(s*d-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],f=e[9],u=e[10],h=e[11],x=e[12],S=e[13],m=e[14],p=e[15],R=t*o-i*a,P=t*l-r*a,v=t*c-s*a,T=i*l-r*o,y=i*c-s*o,L=r*c-s*l,_=d*S-f*x,b=d*m-u*x,U=d*p-h*x,E=f*m-u*S,I=f*p-h*S,G=u*p-h*m,Y=R*G-P*I+v*E+T*U-y*b+L*_;if(Y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const k=1/Y;return e[0]=(o*G-l*I+c*E)*k,e[1]=(r*I-i*G-s*E)*k,e[2]=(S*L-m*y+p*T)*k,e[3]=(u*y-f*L-h*T)*k,e[4]=(l*U-a*G-c*b)*k,e[5]=(t*G-r*U+s*b)*k,e[6]=(m*v-x*L-p*P)*k,e[7]=(d*L-u*v+h*P)*k,e[8]=(a*I-o*U+c*_)*k,e[9]=(i*U-t*I-s*_)*k,e[10]=(x*y-S*v+p*R)*k,e[11]=(f*v-d*y-h*R)*k,e[12]=(o*b-a*E-l*_)*k,e[13]=(t*E-i*b+r*_)*k,e[14]=(S*P-x*T-m*R)*k,e[15]=(d*T-f*P+u*R)*k,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,d*o+i,d*l-r*a,0,c*l-r*o,d*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,f=o+o,u=s*c,h=s*d,x=s*f,S=a*d,m=a*f,p=o*f,R=l*c,P=l*d,v=l*f,T=i.x,y=i.y,L=i.z;return r[0]=(1-(S+p))*T,r[1]=(h+v)*T,r[2]=(x-P)*T,r[3]=0,r[4]=(h-v)*y,r[5]=(1-(u+p))*y,r[6]=(m+R)*y,r[7]=0,r[8]=(x+P)*L,r[9]=(m-R)*L,r[10]=(1-(u+S))*L,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Ti.set(r[0],r[1],r[2]).length();const o=Ti.set(r[4],r[5],r[6]).length(),l=Ti.set(r[8],r[9],r[10]).length();s<0&&(a=-a),Kt.copy(this);const c=1/a,d=1/o,f=1/l;return Kt.elements[0]*=c,Kt.elements[1]*=c,Kt.elements[2]*=c,Kt.elements[4]*=d,Kt.elements[5]*=d,Kt.elements[6]*=d,Kt.elements[8]*=f,Kt.elements[9]*=f,Kt.elements[10]*=f,t.setFromRotationMatrix(Kt),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=un,l=!1){const c=this.elements,d=2*s/(t-e),f=2*s/(i-r),u=(t+e)/(t-e),h=(i+r)/(i-r);let x,S;if(l)x=s/(a-s),S=a*s/(a-s);else if(o===un)x=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===br)x=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=h,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=un,l=!1){const c=this.elements,d=2/(t-e),f=2/(i-r),u=-(t+e)/(t-e),h=-(i+r)/(i-r);let x,S;if(l)x=1/(a-s),S=a/(a-s);else if(o===un)x=-2/(a-s),S=-(a+s)/(a-s);else if(o===br)x=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=h,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Ti=new O,Kt=new rt,Uf=new O(0,0,0),Nf=new O(1,1,1),On=new O,Ur=new O,kt=new O,Ll=new rt,Dl=new dn;class ti{constructor(e=0,t=0,i=0,r=ti.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],d=r[9],f=r[2],u=r[6],h=r[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,h),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,h),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,h),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-We(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,h),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,h));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,h),this._y=0);break;default:Pe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Ll.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ll,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Dl.setFromEuler(this),this.setFromQuaternion(Dl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ti.DEFAULT_ORDER="XYZ";class Jo{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Ff=0;const Il=new O,Ai=new dn,vn=new rt,Nr=new O,rr=new O,Of=new O,Bf=new dn,Ul=new O(1,0,0),Nl=new O(0,1,0),Fl=new O(0,0,1),Ol={type:"added"},zf={type:"removed"},wi={type:"childadded",child:null},Ks={type:"childremoved",child:null};class Tt extends vi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ff++}),this.uuid=Ar(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Tt.DEFAULT_UP.clone();const e=new O,t=new ti,i=new dn,r=new O(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new rt},normalMatrix:{value:new Ie}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=Tt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ai.setFromAxisAngle(e,t),this.quaternion.multiply(Ai),this}rotateOnWorldAxis(e,t){return Ai.setFromAxisAngle(e,t),this.quaternion.premultiply(Ai),this}rotateX(e){return this.rotateOnAxis(Ul,e)}rotateY(e){return this.rotateOnAxis(Nl,e)}rotateZ(e){return this.rotateOnAxis(Fl,e)}translateOnAxis(e,t){return Il.copy(e).applyQuaternion(this.quaternion),this.position.add(Il.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ul,e)}translateY(e){return this.translateOnAxis(Nl,e)}translateZ(e){return this.translateOnAxis(Fl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(vn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Nr.copy(e):Nr.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),rr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vn.lookAt(rr,Nr,this.up):vn.lookAt(Nr,rr,this.up),this.quaternion.setFromRotationMatrix(vn),r&&(vn.extractRotation(r.matrixWorld),Ai.setFromRotationMatrix(vn),this.quaternion.premultiply(Ai.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Xe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ol),wi.child=e,this.dispatchEvent(wi),wi.child=null):Xe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(zf),Ks.child=e,this.dispatchEvent(Ks),Ks.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),vn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),vn.multiply(e.parent.matrixWorld)),e.applyMatrix4(vn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ol),wi.child=e,this.dispatchEvent(wi),wi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rr,e,Of),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rr,Bf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),f=a(e.shapes),u=a(e.skeletons),h=a(e.animations),x=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),h.length>0&&(i.animations=h),x.length>0&&(i.nodes=x)}return i.object=r,i;function a(o){const l=[];for(const c in o){const d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Tt.DEFAULT_UP=new O(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Hi extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const kf={type:"move"};class Zs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Hi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Hi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Hi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,i),p=this._getHandJoint(c,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const d=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=d.position.distanceTo(f.position),h=.02,x=.005;c.inputState.pinching&&u>h+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=h-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(kf)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Hi;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const vu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Bn={h:0,s:0,l:0},Fr={h:0,s:0,l:0};function Js(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Re{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ve.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Ve.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ve.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Ve.workingColorSpace){if(e=wf(e,1),t=We(t,0,1),i=We(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Js(a,s,e+1/3),this.g=Js(a,s,e),this.b=Js(a,s,e-1/3)}return Ve.colorSpaceToWorking(this,r),this}setStyle(e,t=ut){function i(s){s!==void 0&&parseFloat(s)<1&&Pe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Pe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Pe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ut){const i=vu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Pe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Rn(e.r),this.g=Rn(e.g),this.b=Rn(e.b),this}copyLinearToSRGB(e){return this.r=Yi(e.r),this.g=Yi(e.g),this.b=Yi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ut){return Ve.workingToColorSpace(Dt.copy(this),e),Math.round(We(Dt.r*255,0,255))*65536+Math.round(We(Dt.g*255,0,255))*256+Math.round(We(Dt.b*255,0,255))}getHexString(e=ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ve.workingColorSpace){Ve.workingToColorSpace(Dt.copy(this),t);const i=Dt.r,r=Dt.g,s=Dt.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const d=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=d<=.5?f/(a+o):f/(2-a-o),a){case i:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-i)/f+2;break;case s:l=(i-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=Ve.workingColorSpace){return Ve.workingToColorSpace(Dt.copy(this),t),e.r=Dt.r,e.g=Dt.g,e.b=Dt.b,e}getStyle(e=ut){Ve.workingToColorSpace(Dt.copy(this),e);const t=Dt.r,i=Dt.g,r=Dt.b;return e!==ut?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Bn),this.setHSL(Bn.h+e,Bn.s+t,Bn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Bn),e.getHSL(Fr);const i=Ws(Bn.h,Fr.h,t),r=Ws(Bn.s,Fr.s,t),s=Ws(Bn.l,Fr.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Dt=new Re;Re.NAMES=vu;class Gf extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ti,this.environmentIntensity=1,this.environmentRotation=new ti,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Zt=new O,Mn=new O,Qs=new O,Sn=new O,Ri=new O,Ci=new O,Bl=new O,js=new O,ea=new O,ta=new O,na=new at,ia=new at,ra=new at;class Qt{constructor(e=new O,t=new O,i=new O){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Zt.subVectors(e,t),r.cross(Zt);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Zt.subVectors(r,t),Mn.subVectors(i,t),Qs.subVectors(e,t);const a=Zt.dot(Zt),o=Zt.dot(Mn),l=Zt.dot(Qs),c=Mn.dot(Mn),d=Mn.dot(Qs),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const u=1/f,h=(c*l-o*d)*u,x=(a*d-o*l)*u;return s.set(1-h-x,x,h)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Sn)===null?!1:Sn.x>=0&&Sn.y>=0&&Sn.x+Sn.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,Sn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Sn.x),l.addScaledVector(a,Sn.y),l.addScaledVector(o,Sn.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return na.setScalar(0),ia.setScalar(0),ra.setScalar(0),na.fromBufferAttribute(e,t),ia.fromBufferAttribute(e,i),ra.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(na,s.x),a.addScaledVector(ia,s.y),a.addScaledVector(ra,s.z),a}static isFrontFacing(e,t,i,r){return Zt.subVectors(i,t),Mn.subVectors(e,t),Zt.cross(Mn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Zt.subVectors(this.c,this.b),Mn.subVectors(this.a,this.b),Zt.cross(Mn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Qt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Qt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return Qt.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return Qt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Qt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;Ri.subVectors(r,i),Ci.subVectors(s,i),js.subVectors(e,i);const l=Ri.dot(js),c=Ci.dot(js);if(l<=0&&c<=0)return t.copy(i);ea.subVectors(e,r);const d=Ri.dot(ea),f=Ci.dot(ea);if(d>=0&&f<=d)return t.copy(r);const u=l*f-d*c;if(u<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(Ri,a);ta.subVectors(e,s);const h=Ri.dot(ta),x=Ci.dot(ta);if(x>=0&&h<=x)return t.copy(s);const S=h*c-l*x;if(S<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(i).addScaledVector(Ci,o);const m=d*x-h*f;if(m<=0&&f-d>=0&&h-x>=0)return Bl.subVectors(s,r),o=(f-d)/(f-d+(h-x)),t.copy(r).addScaledVector(Bl,o);const p=1/(m+S+u);return a=S*p,o=u*p,t.copy(i).addScaledVector(Ri,a).addScaledVector(Ci,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class wr{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Jt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Jt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=Jt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Jt):Jt.fromBufferAttribute(s,a),Jt.applyMatrix4(e.matrixWorld),this.expandByPoint(Jt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Or.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Or.copy(i.boundingBox)),Or.applyMatrix4(e.matrixWorld),this.union(Or)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Jt),Jt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(sr),Br.subVectors(this.max,sr),Pi.subVectors(e.a,sr),Li.subVectors(e.b,sr),Di.subVectors(e.c,sr),zn.subVectors(Li,Pi),kn.subVectors(Di,Li),ri.subVectors(Pi,Di);let t=[0,-zn.z,zn.y,0,-kn.z,kn.y,0,-ri.z,ri.y,zn.z,0,-zn.x,kn.z,0,-kn.x,ri.z,0,-ri.x,-zn.y,zn.x,0,-kn.y,kn.x,0,-ri.y,ri.x,0];return!sa(t,Pi,Li,Di,Br)||(t=[1,0,0,0,1,0,0,0,1],!sa(t,Pi,Li,Di,Br))?!1:(zr.crossVectors(zn,kn),t=[zr.x,zr.y,zr.z],sa(t,Pi,Li,Di,Br))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Jt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Jt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const bn=[new O,new O,new O,new O,new O,new O,new O,new O],Jt=new O,Or=new wr,Pi=new O,Li=new O,Di=new O,zn=new O,kn=new O,ri=new O,sr=new O,Br=new O,zr=new O,si=new O;function sa(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){si.fromArray(n,s);const o=r.x*Math.abs(si.x)+r.y*Math.abs(si.y)+r.z*Math.abs(si.z),l=e.dot(si),c=t.dot(si),d=i.dot(si);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}const gt=new O,kr=new Fe;let Hf=0;class xt extends vi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Hf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=yl,this.updateRanges=[],this.gpuType=cn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)kr.fromBufferAttribute(this,t),kr.applyMatrix3(e),this.setXY(t,kr.x,kr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix3(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix4(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.applyNormalMatrix(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)gt.fromBufferAttribute(this,t),gt.transformDirection(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ir(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Ft(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ir(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ir(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ir(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ir(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ft(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array),r=Ft(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Ft(t,this.array),i=Ft(i,this.array),r=Ft(r,this.array),s=Ft(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==yl&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class Mu extends xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Su extends xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class At extends xt{constructor(e,t,i){super(new Float32Array(e),t,i)}}const Vf=new wr,ar=new O,aa=new O;class Ps{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Vf.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ar.subVectors(e,this.center);const t=ar.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(ar,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(aa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ar.copy(e.center).add(aa)),this.expandByPoint(ar.copy(e.center).sub(aa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Wf=0;const qt=new rt,oa=new Tt,Ii=new O,Gt=new wr,or=new wr,bt=new O;class It extends vi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Wf++}),this.uuid=Ar(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ef(e)?Su:Mu)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ie().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return qt.makeRotationFromQuaternion(e),this.applyMatrix4(qt),this}rotateX(e){return qt.makeRotationX(e),this.applyMatrix4(qt),this}rotateY(e){return qt.makeRotationY(e),this.applyMatrix4(qt),this}rotateZ(e){return qt.makeRotationZ(e),this.applyMatrix4(qt),this}translate(e,t,i){return qt.makeTranslation(e,t,i),this.applyMatrix4(qt),this}scale(e,t,i){return qt.makeScale(e,t,i),this.applyMatrix4(qt),this}lookAt(e){return oa.lookAt(e),oa.updateMatrix(),this.applyMatrix4(oa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ii).negate(),this.translate(Ii.x,Ii.y,Ii.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new At(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Pe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new wr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Gt.setFromBufferAttribute(s),this.morphTargetsRelative?(bt.addVectors(this.boundingBox.min,Gt.min),this.boundingBox.expandByPoint(bt),bt.addVectors(this.boundingBox.max,Gt.max),this.boundingBox.expandByPoint(bt)):(this.boundingBox.expandByPoint(Gt.min),this.boundingBox.expandByPoint(Gt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ps);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const i=this.boundingSphere.center;if(Gt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];or.setFromBufferAttribute(o),this.morphTargetsRelative?(bt.addVectors(Gt.min,or.min),Gt.expandByPoint(bt),bt.addVectors(Gt.max,or.max),Gt.expandByPoint(bt)):(Gt.expandByPoint(or.min),Gt.expandByPoint(or.max))}Gt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)bt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(bt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)bt.fromBufferAttribute(o,c),l&&(Ii.fromBufferAttribute(e,c),bt.add(Ii)),r=Math.max(r,i.distanceToSquared(bt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Xe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Xe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new xt(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new O,l[_]=new O;const c=new O,d=new O,f=new O,u=new Fe,h=new Fe,x=new Fe,S=new O,m=new O;function p(_,b,U){c.fromBufferAttribute(i,_),d.fromBufferAttribute(i,b),f.fromBufferAttribute(i,U),u.fromBufferAttribute(s,_),h.fromBufferAttribute(s,b),x.fromBufferAttribute(s,U),d.sub(c),f.sub(c),h.sub(u),x.sub(u);const E=1/(h.x*x.y-x.x*h.y);isFinite(E)&&(S.copy(d).multiplyScalar(x.y).addScaledVector(f,-h.y).multiplyScalar(E),m.copy(f).multiplyScalar(h.x).addScaledVector(d,-x.x).multiplyScalar(E),o[_].add(S),o[b].add(S),o[U].add(S),l[_].add(m),l[b].add(m),l[U].add(m))}let R=this.groups;R.length===0&&(R=[{start:0,count:e.count}]);for(let _=0,b=R.length;_<b;++_){const U=R[_],E=U.start,I=U.count;for(let G=E,Y=E+I;G<Y;G+=3)p(e.getX(G+0),e.getX(G+1),e.getX(G+2))}const P=new O,v=new O,T=new O,y=new O;function L(_){T.fromBufferAttribute(r,_),y.copy(T);const b=o[_];P.copy(b),P.sub(T.multiplyScalar(T.dot(b))).normalize(),v.crossVectors(y,b);const E=v.dot(l[_])<0?-1:1;a.setXYZW(_,P.x,P.y,P.z,E)}for(let _=0,b=R.length;_<b;++_){const U=R[_],E=U.start,I=U.count;for(let G=E,Y=E+I;G<Y;G+=3)L(e.getX(G+0)),L(e.getX(G+1)),L(e.getX(G+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,h=i.count;u<h;u++)i.setXYZ(u,0,0,0);const r=new O,s=new O,a=new O,o=new O,l=new O,c=new O,d=new O,f=new O;if(e)for(let u=0,h=e.count;u<h;u+=3){const x=e.getX(u+0),S=e.getX(u+1),m=e.getX(u+2);r.fromBufferAttribute(t,x),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),o.fromBufferAttribute(i,x),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(x,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,h=t.count;u<h;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)bt.fromBufferAttribute(e,t),bt.normalize(),e.setXYZ(t,bt.x,bt.y,bt.z)}toNonIndexed(){function e(o,l){const c=o.array,d=o.itemSize,f=o.normalized,u=new c.constructor(l.length*d);let h=0,x=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?h=l[S]*o.data.stride+o.offset:h=l[S]*d;for(let p=0;p<d;p++)u[x++]=c[h++]}return new xt(u,d,f)}if(this.index===null)return Pe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new It,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let d=0,f=c.length;d<f;d++){const u=c[d],h=e(u,i);l.push(h)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let f=0,u=c.length;f<u;f++){const h=c[f];d.push(h.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const d=r[c];this.setAttribute(c,d.clone(t))}const s=e.morphAttributes;for(const c in s){const d=[],f=s[c];for(let u=0,h=f.length;u<h;u++)d.push(f[u].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,d=a.length;c<d;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}let Xf=0;class er extends vi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xf++}),this.uuid=Ar(),this.name="",this.type="Material",this.blending=Xi,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Fa,this.blendDst=Oa,this.blendEquation=fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Re(0,0,0),this.blendAlpha=0,this.depthFunc=$i,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=El,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ei,this.stencilZFail=Ei,this.stencilZPass=Ei,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Pe(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Pe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Xi&&(i.blending=this.blending),this.side!==jn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Fa&&(i.blendSrc=this.blendSrc),this.blendDst!==Oa&&(i.blendDst=this.blendDst),this.blendEquation!==fi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==$i&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==El&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ei&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ei&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ei&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Re().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Fe().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Fe().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const En=new O,la=new O,Gr=new O,Gn=new O,ca=new O,Hr=new O,ua=new O;class Qo{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,En)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=En.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(En.copy(this.origin).addScaledVector(this.direction,t),En.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){la.copy(e).add(t).multiplyScalar(.5),Gr.copy(t).sub(e).normalize(),Gn.copy(this.origin).sub(la);const s=e.distanceTo(t)*.5,a=-this.direction.dot(Gr),o=Gn.dot(this.direction),l=-Gn.dot(Gr),c=Gn.lengthSq(),d=Math.abs(1-a*a);let f,u,h,x;if(d>0)if(f=a*l-o,u=a*o-l,x=s*d,f>=0)if(u>=-x)if(u<=x){const S=1/d;f*=S,u*=S,h=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=s,f=Math.max(0,-(a*u+o)),h=-f*f+u*(u+2*l)+c;else u=-s,f=Math.max(0,-(a*u+o)),h=-f*f+u*(u+2*l)+c;else u<=-x?(f=Math.max(0,-(-a*s+o)),u=f>0?-s:Math.min(Math.max(-s,-l),s),h=-f*f+u*(u+2*l)+c):u<=x?(f=0,u=Math.min(Math.max(-s,-l),s),h=u*(u+2*l)+c):(f=Math.max(0,-(a*s+o)),u=f>0?s:Math.min(Math.max(-s,-l),s),h=-f*f+u*(u+2*l)+c);else u=a>0?-s:s,f=Math.max(0,-(a*u+o)),h=-f*f+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(la).addScaledVector(Gr,u),h}intersectSphere(e,t){En.subVectors(e.center,this.origin);const i=En.dot(this.direction),r=En.dot(En)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),d>=0?(s=(e.min.y-u.y)*d,a=(e.max.y-u.y)*d):(s=(e.max.y-u.y)*d,a=(e.min.y-u.y)*d),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-u.z)*f,l=(e.max.z-u.z)*f):(o=(e.max.z-u.z)*f,l=(e.min.z-u.z)*f),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,En)!==null}intersectTriangle(e,t,i,r,s){ca.subVectors(t,e),Hr.subVectors(i,e),ua.crossVectors(ca,Hr);let a=this.direction.dot(ua),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Gn.subVectors(this.origin,e);const l=o*this.direction.dot(Hr.crossVectors(Gn,Hr));if(l<0)return null;const c=o*this.direction.dot(ca.cross(Gn));if(c<0||l+c>a)return null;const d=-o*Gn.dot(ua);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Yt extends er{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Re(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.combine=nu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const zl=new rt,ai=new Qo,Vr=new Ps,kl=new O,Wr=new O,Xr=new O,qr=new O,da=new O,Yr=new O,Gl=new O,$r=new O;class _t extends Tt{constructor(e=new It,t=new Yt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Yr.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const d=o[l],f=s[l];d!==0&&(da.fromBufferAttribute(f,e),a?Yr.addScaledVector(da,d):Yr.addScaledVector(da.sub(t),d))}t.add(Yr)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Vr.copy(i.boundingSphere),Vr.applyMatrix4(s),ai.copy(e.ray).recast(e.near),!(Vr.containsPoint(ai.origin)===!1&&(ai.intersectSphere(Vr,kl)===null||ai.origin.distanceToSquared(kl)>(e.far-e.near)**2))&&(zl.copy(s).invert(),ai.copy(e.ray).applyMatrix4(zl),!(i.boundingBox!==null&&ai.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,ai)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,f=s.attributes.normal,u=s.groups,h=s.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],p=a[m.materialIndex],R=Math.max(m.start,h.start),P=Math.min(o.count,Math.min(m.start+m.count,h.start+h.count));for(let v=R,T=P;v<T;v+=3){const y=o.getX(v),L=o.getX(v+1),_=o.getX(v+2);r=Kr(this,p,e,i,c,d,f,y,L,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,h.start),S=Math.min(o.count,h.start+h.count);for(let m=x,p=S;m<p;m+=3){const R=o.getX(m),P=o.getX(m+1),v=o.getX(m+2);r=Kr(this,a,e,i,c,d,f,R,P,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],p=a[m.materialIndex],R=Math.max(m.start,h.start),P=Math.min(l.count,Math.min(m.start+m.count,h.start+h.count));for(let v=R,T=P;v<T;v+=3){const y=v,L=v+1,_=v+2;r=Kr(this,p,e,i,c,d,f,y,L,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,h.start),S=Math.min(l.count,h.start+h.count);for(let m=x,p=S;m<p;m+=3){const R=m,P=m+1,v=m+2;r=Kr(this,a,e,i,c,d,f,R,P,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function qf(n,e,t,i,r,s,a,o){let l;if(e.side===Nt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===jn,o),l===null)return null;$r.copy(o),$r.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo($r);return c<t.near||c>t.far?null:{distance:c,point:$r.clone(),object:n}}function Kr(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,Wr),n.getVertexPosition(l,Xr),n.getVertexPosition(c,qr);const d=qf(n,e,t,i,Wr,Xr,qr,Gl);if(d){const f=new O;Qt.getBarycoord(Gl,Wr,Xr,qr,f),r&&(d.uv=Qt.getInterpolatedAttribute(r,o,l,c,f,new Fe)),s&&(d.uv1=Qt.getInterpolatedAttribute(s,o,l,c,f,new Fe)),a&&(d.normal=Qt.getInterpolatedAttribute(a,o,l,c,f,new O),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new O,materialIndex:0};Qt.getNormal(Wr,Xr,qr,u.normal),d.face=u,d.barycoord=f}return d}class Yf extends Rt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=wt,d=wt,f,u){super(null,a,o,l,c,d,r,s,f,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const fa=new O,$f=new O,Kf=new Ie;class yn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=fa.subVectors(i,t).cross($f.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(fa),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||Kf.getNormalMatrix(e),r=this.coplanarPoint(fa).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const oi=new Ps,Zf=new Fe(.5,.5),Zr=new O;class jo{constructor(e=new yn,t=new yn,i=new yn,r=new yn,s=new yn,a=new yn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=un,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],d=s[4],f=s[5],u=s[6],h=s[7],x=s[8],S=s[9],m=s[10],p=s[11],R=s[12],P=s[13],v=s[14],T=s[15];if(r[0].setComponents(c-a,h-d,p-x,T-R).normalize(),r[1].setComponents(c+a,h+d,p+x,T+R).normalize(),r[2].setComponents(c+o,h+f,p+S,T+P).normalize(),r[3].setComponents(c-o,h-f,p-S,T-P).normalize(),i)r[4].setComponents(l,u,m,v).normalize(),r[5].setComponents(c-l,h-u,p-m,T-v).normalize();else if(r[4].setComponents(c-l,h-u,p-m,T-v).normalize(),t===un)r[5].setComponents(c+l,h+u,p+m,T+v).normalize();else if(t===br)r[5].setComponents(l,u,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),oi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),oi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(oi)}intersectsSprite(e){oi.center.set(0,0,0);const t=Zf.distanceTo(e.center);return oi.radius=.7071067811865476+t,oi.applyMatrix4(e.matrixWorld),this.intersectsSphere(oi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Zr.x=r.normal.x>0?e.max.x:e.min.x,Zr.y=r.normal.y>0?e.max.y:e.min.y,Zr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Zr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class el extends er{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Re(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Hl=new rt,To=new Qo,Jr=new Ps,Qr=new O;class bu extends Tt{constructor(e=new It,t=new el){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Jr.copy(i.boundingSphere),Jr.applyMatrix4(r),Jr.radius+=s,e.ray.intersectsSphere(Jr)===!1)return;Hl.copy(r).invert(),To.copy(e.ray).applyMatrix4(Hl);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,f=i.attributes.position;if(c!==null){const u=Math.max(0,a.start),h=Math.min(c.count,a.start+a.count);for(let x=u,S=h;x<S;x++){const m=c.getX(x);Qr.fromBufferAttribute(f,m),Vl(Qr,m,l,r,e,t,this)}}else{const u=Math.max(0,a.start),h=Math.min(f.count,a.start+a.count);for(let x=u,S=h;x<S;x++)Qr.fromBufferAttribute(f,x),Vl(Qr,x,l,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Vl(n,e,t,i,r,s,a){const o=To.distanceSqToPoint(n);if(o<t){const l=new O;To.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class Eu extends Rt{constructor(e=[],t=_i,i,r,s,a,o,l,c,d){super(e,t,i,r,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class xn extends Rt{constructor(e,t,i,r,s,a,o,l,c){super(e,t,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Zi extends Rt{constructor(e,t,i=gn,r,s,a,o=wt,l=wt,c,d=Ln,f=1){if(d!==Ln&&d!==gi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:f};super(u,r,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Zo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class Jf extends Zi{constructor(e,t=gn,i=_i,r,s,a=wt,o=wt,l,c=Ln){const d={width:e,height:e,depth:1},f=[d,d,d,d,d,d];super(e,e,t,i,r,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class yu extends Rt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Rr extends It{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],d=[],f=[];let u=0,h=0;x("z","y","x",-1,-1,i,t,e,a,s,0),x("z","y","x",1,-1,i,t,-e,a,s,1),x("x","z","y",1,1,e,i,t,r,a,2),x("x","z","y",1,-1,e,i,-t,r,a,3),x("x","y","z",1,-1,e,t,i,r,s,4),x("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new At(c,3)),this.setAttribute("normal",new At(d,3)),this.setAttribute("uv",new At(f,2));function x(S,m,p,R,P,v,T,y,L,_,b){const U=v/L,E=T/_,I=v/2,G=T/2,Y=y/2,k=L+1,K=_+1;let z=0,te=0;const re=new O;for(let ce=0;ce<K;ce++){const de=ce*E-G;for(let _e=0;_e<k;_e++){const ke=_e*U-I;re[S]=ke*R,re[m]=de*P,re[p]=Y,c.push(re.x,re.y,re.z),re[S]=0,re[m]=0,re[p]=y>0?1:-1,d.push(re.x,re.y,re.z),f.push(_e/L),f.push(1-ce/_),z+=1}}for(let ce=0;ce<_;ce++)for(let de=0;de<L;de++){const _e=u+de+k*ce,ke=u+de+k*(ce+1),Je=u+(de+1)+k*(ce+1),Le=u+(de+1)+k*ce;l.push(_e,ke,Le),l.push(ke,Je,Le),te+=6}o.addGroup(h,te,b),h+=te,u+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Rr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class bs extends It{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new O,d=new Fe;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,u=3;f<=t;f++,u+=3){const h=i+f/t*r;c.x=e*Math.cos(h),c.y=e*Math.sin(h),a.push(c.x,c.y,c.z),o.push(0,0,1),d.x=(a[u]/e+1)/2,d.y=(a[u+1]/e+1)/2,l.push(d.x,d.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new At(a,3)),this.setAttribute("normal",new At(o,3)),this.setAttribute("uv",new At(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new bs(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class tl extends It{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const d=[],f=[],u=[],h=[];let x=0;const S=[],m=i/2;let p=0;R(),a===!1&&(e>0&&P(!0),t>0&&P(!1)),this.setIndex(d),this.setAttribute("position",new At(f,3)),this.setAttribute("normal",new At(u,3)),this.setAttribute("uv",new At(h,2));function R(){const v=new O,T=new O;let y=0;const L=(t-e)/i;for(let _=0;_<=s;_++){const b=[],U=_/s,E=U*(t-e)+e;for(let I=0;I<=r;I++){const G=I/r,Y=G*l+o,k=Math.sin(Y),K=Math.cos(Y);T.x=E*k,T.y=-U*i+m,T.z=E*K,f.push(T.x,T.y,T.z),v.set(k,L,K).normalize(),u.push(v.x,v.y,v.z),h.push(G,1-U),b.push(x++)}S.push(b)}for(let _=0;_<r;_++)for(let b=0;b<s;b++){const U=S[b][_],E=S[b+1][_],I=S[b+1][_+1],G=S[b][_+1];(e>0||b!==0)&&(d.push(U,E,G),y+=3),(t>0||b!==s-1)&&(d.push(E,I,G),y+=3)}c.addGroup(p,y,0),p+=y}function P(v){const T=x,y=new Fe,L=new O;let _=0;const b=v===!0?e:t,U=v===!0?1:-1;for(let I=1;I<=r;I++)f.push(0,m*U,0),u.push(0,U,0),h.push(.5,.5),x++;const E=x;for(let I=0;I<=r;I++){const Y=I/r*l+o,k=Math.cos(Y),K=Math.sin(Y);L.x=b*K,L.y=m*U,L.z=b*k,f.push(L.x,L.y,L.z),u.push(0,U,0),y.x=k*.5+.5,y.y=K*.5*U+.5,h.push(y.x,y.y),x++}for(let I=0;I<r;I++){const G=T+I,Y=E+I;v===!0?d.push(Y,Y+1,G):d.push(Y+1,Y,G),_+=3}c.addGroup(p,_,v===!0?1:2),p+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tl(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Mi extends It{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,d=l+1,f=e/o,u=t/l,h=[],x=[],S=[],m=[];for(let p=0;p<d;p++){const R=p*u-a;for(let P=0;P<c;P++){const v=P*f-s;x.push(v,-R,0),S.push(0,0,1),m.push(P/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let R=0;R<o;R++){const P=R+c*p,v=R+c*(p+1),T=R+1+c*(p+1),y=R+1+c*p;h.push(P,v,y),h.push(v,T,y)}this.setIndex(h),this.setAttribute("position",new At(x,3)),this.setAttribute("normal",new At(S,3)),this.setAttribute("uv",new At(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Mi(e.width,e.height,e.widthSegments,e.heightSegments)}}class Es extends It{constructor(e=.5,t=1,i=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:a},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],d=[];let f=e;const u=(t-e)/r,h=new O,x=new Fe;for(let S=0;S<=r;S++){for(let m=0;m<=i;m++){const p=s+m/i*a;h.x=f*Math.cos(p),h.y=f*Math.sin(p),l.push(h.x,h.y,h.z),c.push(0,0,1),x.x=(h.x/t+1)/2,x.y=(h.y/t+1)/2,d.push(x.x,x.y)}f+=u}for(let S=0;S<r;S++){const m=S*(i+1);for(let p=0;p<i;p++){const R=p+m,P=R,v=R+i+1,T=R+i+2,y=R+1;o.push(P,v,y),o.push(v,T,y)}}this.setIndex(o),this.setAttribute("position",new At(l,3)),this.setAttribute("normal",new At(c,3)),this.setAttribute("uv",new At(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Es(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}function Ji(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(Wl(r))r.isRenderTargetTexture?(Pe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Wl(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Ut(n){const e={};for(let t=0;t<n.length;t++){const i=Ji(n[t]);for(const r in i)e[r]=i[r]}return e}function Wl(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Qf(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Tu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ve.workingColorSpace}const jf={clone:Ji,merge:Ut};var eh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,th=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class _n extends er{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=eh,this.fragmentShader=th,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ji(e.uniforms),this.uniformsGroups=Qf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Re().setHex(r.value);break;case"v2":this.uniforms[i].value=new Fe().fromArray(r.value);break;case"v3":this.uniforms[i].value=new O().fromArray(r.value);break;case"v4":this.uniforms[i].value=new at().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ie().fromArray(r.value);break;case"m4":this.uniforms[i].value=new rt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class nh extends _n{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class ih extends er{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Re(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Re(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yo,this.normalScale=new Fe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ti,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class rh extends er{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=pf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class sh extends er{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Ls extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Re(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class ah extends Ls{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Re(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const ha=new rt,Xl=new O,ql=new O;class Au{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Fe(512,512),this.mapType=Vt,this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new jo,this._frameExtents=new Fe(1,1),this._viewportCount=1,this._viewports=[new at(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Xl.setFromMatrixPosition(e.matrixWorld),t.position.copy(Xl),ql.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ql),t.updateMatrixWorld(),ha.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ha,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===br||t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(ha)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const jr=new O,es=new dn,sn=new O;class wu extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(jr,es,sn),sn.x===1&&sn.y===1&&sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(jr,es,sn.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(jr,es,sn),sn.x===1&&sn.y===1&&sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(jr,es,sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Hn=new O,Yl=new Fe,$l=new Fe;class Bt extends wu{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ss*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Vs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ss*2*Math.atan(Math.tan(Vs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Hn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Hn.x,Hn.y).multiplyScalar(-e/Hn.z),Hn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Hn.x,Hn.y).multiplyScalar(-e/Hn.z)}getViewSize(e,t){return this.getViewBounds(e,Yl,$l),t.subVectors($l,Yl)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Vs*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class oh extends Au{constructor(){super(new Bt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,i=Ss*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=e.distance||t.far;(i!==t.fov||r!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=r,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class lh extends Ls{constructor(e,t,i=0,r=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.distance=i,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new oh}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class ch extends Au{constructor(){super(new Bt(90,1,.5,500)),this.isPointLightShadow=!0}}class Kl extends Ls{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new ch}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class Ru extends wu{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class uh extends Ls{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}const Ui=-90,Ni=1;class dh extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Bt(Ui,Ni,e,t);r.layers=this.layers,this.add(r);const s=new Bt(Ui,Ni,e,t);s.layers=this.layers,this.add(s);const a=new Bt(Ui,Ni,e,t);a.layers=this.layers,this.add(a);const o=new Bt(Ui,Ni,e,t);o.layers=this.layers,this.add(o);const l=new Bt(Ui,Ni,e,t);l.layers=this.layers,this.add(l);const c=new Bt(Ui,Ni,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===un)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===br)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,d]=this.children,f=e.getRenderTarget(),u=e.getActiveCubeFace(),h=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,d),e.setRenderTarget(f,u,h),e.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class fh extends Bt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const Zl=new rt;class hh{constructor(e,t,i=0,r=1/0){this.ray=new Qo(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new Jo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Xe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Zl.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Zl),this}intersectObject(e,t=!0,i=[]){return Ao(e,this,i,t),i.sort(Jl),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Ao(e[r],this,i,t);return i.sort(Jl),i}}function Jl(n,e){return n.distance-e.distance}function Ao(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){const s=n.children;for(let a=0,o=s.length;a<o;a++)Ao(s[a],e,t,!0)}}class Cu{static{Cu.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}}function Ql(n,e,t,i){const r=ph(i);switch(t){case pu:return n*e;case gu:return n*e/r.components*r.byteLength;case Xo:return n*e/r.components*r.byteLength;case xi:return n*e*2/r.components*r.byteLength;case qo:return n*e*2/r.components*r.byteLength;case mu:return n*e*3/r.components*r.byteLength;case en:return n*e*4/r.components*r.byteLength;case Yo:return n*e*4/r.components*r.byteLength;case cs:case us:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ds:case fs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case $a:case Za:return Math.max(n,16)*Math.max(e,8)/4;case Ya:case Ka:return Math.max(n,8)*Math.max(e,8)/2;case Ja:case Qa:case eo:case to:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ja:case gs:case no:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case io:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ro:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case so:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ao:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case oo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case lo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case co:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case uo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case fo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case ho:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case po:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case mo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case go:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case _o:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case xo:case vo:case Mo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case So:case bo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case _s:case Eo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ph(n){switch(n){case Vt:case uu:return{byteLength:1,components:1};case Mr:case du:case Pn:return{byteLength:2,components:1};case Vo:case Wo:return{byteLength:2,components:4};case gn:case Ho:case cn:return{byteLength:4,components:1};case fu:case hu:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ko}}));typeof window<"u"&&(window.__THREE__?Pe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ko);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Pu(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function mh(n){const e=new WeakMap;function t(o,l){const c=o.array,d=o.usage,f=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,d),o.onUploadCallback();let h;if(c instanceof Float32Array)h=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)h=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?h=n.HALF_FLOAT:h=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)h=n.SHORT;else if(c instanceof Uint32Array)h=n.UNSIGNED_INT;else if(c instanceof Int32Array)h=n.INT;else if(c instanceof Int8Array)h=n.BYTE;else if(c instanceof Uint8Array)h=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)h=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:h,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,l,c){const d=l.array,f=l.updateRanges;if(n.bindBuffer(c,o),f.length===0)n.bufferSubData(c,0,d);else{f.sort((h,x)=>h.start-x.start);let u=0;for(let h=1;h<f.length;h++){const x=f[u],S=f[h];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++u,f[u]=S)}f.length=u+1;for(let h=0,x=f.length;h<x;h++){const S=f[h];n.bufferSubData(c,S.start*d.BYTES_PER_ELEMENT,d,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var gh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_h=`#ifdef USE_ALPHAHASH
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
#endif`,xh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,vh=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Mh=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Sh=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,bh=`#ifdef USE_AOMAP
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
#endif`,Eh=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,yh=`#ifdef USE_BATCHING
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
#endif`,Th=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ah=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,wh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Rh=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Ch=`#ifdef USE_IRIDESCENCE
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
#endif`,Ph=`#ifdef USE_BUMPMAP
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
#endif`,Lh=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Dh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ih=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Uh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Nh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Fh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Oh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Bh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,zh=`#define PI 3.141592653589793
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
} // validated`,kh=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Gh=`vec3 transformedNormal = objectNormal;
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
#endif`,Hh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Vh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Wh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Xh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,qh="gl_FragColor = linearToOutputTexel( gl_FragColor );",Yh=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,$h=`#ifdef USE_ENVMAP
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
#endif`,Kh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Zh=`#ifdef USE_ENVMAP
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
#endif`,Jh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Qh=`#ifdef USE_ENVMAP
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
#endif`,jh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ep=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,tp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,np=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ip=`#ifdef USE_GRADIENTMAP
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
}`,rp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,sp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ap=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,op=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,lp=`#ifdef USE_ENVMAP
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
#endif`,cp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,up=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,dp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,fp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hp=`PhysicalMaterial material;
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
#endif`,pp=`uniform sampler2D dfgLUT;
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
}`,mp=`
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
#endif`,gp=`#if defined( RE_IndirectDiffuse )
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
#endif`,_p=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,xp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,vp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Mp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,bp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ep=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,yp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Tp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Ap=`#if defined( USE_POINTS_UV )
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
#endif`,wp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Rp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Cp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Pp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Lp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Dp=`#ifdef USE_MORPHTARGETS
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
#endif`,Ip=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Up=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Np=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Op=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Bp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,zp=`#ifdef USE_NORMALMAP
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
#endif`,kp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Gp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Hp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Vp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Wp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Xp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,qp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Yp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,$p=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Kp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Zp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Qp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,jp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,em=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,tm=`float getShadowMask() {
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
}`,nm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,im=`#ifdef USE_SKINNING
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
#endif`,rm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,sm=`#ifdef USE_SKINNING
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
#endif`,am=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,om=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,lm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,cm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,um=`#ifdef USE_TRANSMISSION
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
#endif`,dm=`#ifdef USE_TRANSMISSION
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
#endif`,fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,pm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,mm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const gm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,_m=`uniform sampler2D t2D;
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
}`,xm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,vm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Mm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bm=`#include <common>
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
}`,Em=`#if DEPTH_PACKING == 3200
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
}`,ym=`#define DISTANCE
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
}`,Tm=`#define DISTANCE
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
}`,Am=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,wm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rm=`uniform float scale;
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
}`,Cm=`uniform vec3 diffuse;
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
}`,Pm=`#include <common>
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
}`,Lm=`uniform vec3 diffuse;
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
}`,Dm=`#define LAMBERT
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
}`,Im=`#define LAMBERT
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
}`,Um=`#define MATCAP
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
}`,Nm=`#define MATCAP
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
}`,Fm=`#define NORMAL
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
}`,Om=`#define NORMAL
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
}`,Bm=`#define PHONG
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
}`,zm=`#define PHONG
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
}`,km=`#define STANDARD
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
}`,Gm=`#define STANDARD
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
}`,Hm=`#define TOON
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
}`,Vm=`#define TOON
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
}`,Wm=`uniform float size;
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
}`,Xm=`uniform vec3 diffuse;
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
}`,qm=`#include <common>
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
}`,Ym=`uniform vec3 color;
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
}`,$m=`uniform float rotation;
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
}`,Km=`uniform vec3 diffuse;
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
}`,Oe={alphahash_fragment:gh,alphahash_pars_fragment:_h,alphamap_fragment:xh,alphamap_pars_fragment:vh,alphatest_fragment:Mh,alphatest_pars_fragment:Sh,aomap_fragment:bh,aomap_pars_fragment:Eh,batching_pars_vertex:yh,batching_vertex:Th,begin_vertex:Ah,beginnormal_vertex:wh,bsdfs:Rh,iridescence_fragment:Ch,bumpmap_pars_fragment:Ph,clipping_planes_fragment:Lh,clipping_planes_pars_fragment:Dh,clipping_planes_pars_vertex:Ih,clipping_planes_vertex:Uh,color_fragment:Nh,color_pars_fragment:Fh,color_pars_vertex:Oh,color_vertex:Bh,common:zh,cube_uv_reflection_fragment:kh,defaultnormal_vertex:Gh,displacementmap_pars_vertex:Hh,displacementmap_vertex:Vh,emissivemap_fragment:Wh,emissivemap_pars_fragment:Xh,colorspace_fragment:qh,colorspace_pars_fragment:Yh,envmap_fragment:$h,envmap_common_pars_fragment:Kh,envmap_pars_fragment:Zh,envmap_pars_vertex:Jh,envmap_physical_pars_fragment:lp,envmap_vertex:Qh,fog_vertex:jh,fog_pars_vertex:ep,fog_fragment:tp,fog_pars_fragment:np,gradientmap_pars_fragment:ip,lightmap_pars_fragment:rp,lights_lambert_fragment:sp,lights_lambert_pars_fragment:ap,lights_pars_begin:op,lights_toon_fragment:cp,lights_toon_pars_fragment:up,lights_phong_fragment:dp,lights_phong_pars_fragment:fp,lights_physical_fragment:hp,lights_physical_pars_fragment:pp,lights_fragment_begin:mp,lights_fragment_maps:gp,lights_fragment_end:_p,lightprobes_pars_fragment:xp,logdepthbuf_fragment:vp,logdepthbuf_pars_fragment:Mp,logdepthbuf_pars_vertex:Sp,logdepthbuf_vertex:bp,map_fragment:Ep,map_pars_fragment:yp,map_particle_fragment:Tp,map_particle_pars_fragment:Ap,metalnessmap_fragment:wp,metalnessmap_pars_fragment:Rp,morphinstance_vertex:Cp,morphcolor_vertex:Pp,morphnormal_vertex:Lp,morphtarget_pars_vertex:Dp,morphtarget_vertex:Ip,normal_fragment_begin:Up,normal_fragment_maps:Np,normal_pars_fragment:Fp,normal_pars_vertex:Op,normal_vertex:Bp,normalmap_pars_fragment:zp,clearcoat_normal_fragment_begin:kp,clearcoat_normal_fragment_maps:Gp,clearcoat_pars_fragment:Hp,iridescence_pars_fragment:Vp,opaque_fragment:Wp,packing:Xp,premultiplied_alpha_fragment:qp,project_vertex:Yp,dithering_fragment:$p,dithering_pars_fragment:Kp,roughnessmap_fragment:Zp,roughnessmap_pars_fragment:Jp,shadowmap_pars_fragment:Qp,shadowmap_pars_vertex:jp,shadowmap_vertex:em,shadowmask_pars_fragment:tm,skinbase_vertex:nm,skinning_pars_vertex:im,skinning_vertex:rm,skinnormal_vertex:sm,specularmap_fragment:am,specularmap_pars_fragment:om,tonemapping_fragment:lm,tonemapping_pars_fragment:cm,transmission_fragment:um,transmission_pars_fragment:dm,uv_pars_fragment:fm,uv_pars_vertex:hm,uv_vertex:pm,worldpos_vertex:mm,background_vert:gm,background_frag:_m,backgroundCube_vert:xm,backgroundCube_frag:vm,cube_vert:Mm,cube_frag:Sm,depth_vert:bm,depth_frag:Em,distance_vert:ym,distance_frag:Tm,equirect_vert:Am,equirect_frag:wm,linedashed_vert:Rm,linedashed_frag:Cm,meshbasic_vert:Pm,meshbasic_frag:Lm,meshlambert_vert:Dm,meshlambert_frag:Im,meshmatcap_vert:Um,meshmatcap_frag:Nm,meshnormal_vert:Fm,meshnormal_frag:Om,meshphong_vert:Bm,meshphong_frag:zm,meshphysical_vert:km,meshphysical_frag:Gm,meshtoon_vert:Hm,meshtoon_frag:Vm,points_vert:Wm,points_frag:Xm,shadow_vert:qm,shadow_frag:Ym,sprite_vert:$m,sprite_frag:Km},fe={common:{diffuse:{value:new Re(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ie}},envmap:{envMap:{value:null},envMapRotation:{value:new Ie},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ie}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ie}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ie},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ie},normalScale:{value:new Fe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ie},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ie}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ie}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ie}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Re(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new Re(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0},uvTransform:{value:new Ie}},sprite:{diffuse:{value:new Re(16777215)},opacity:{value:1},center:{value:new Fe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}}},on={basic:{uniforms:Ut([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:Oe.meshbasic_vert,fragmentShader:Oe.meshbasic_frag},lambert:{uniforms:Ut([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new Re(0)},envMapIntensity:{value:1}}]),vertexShader:Oe.meshlambert_vert,fragmentShader:Oe.meshlambert_frag},phong:{uniforms:Ut([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new Re(0)},specular:{value:new Re(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphong_vert,fragmentShader:Oe.meshphong_frag},standard:{uniforms:Ut([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new Re(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag},toon:{uniforms:Ut([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new Re(0)}}]),vertexShader:Oe.meshtoon_vert,fragmentShader:Oe.meshtoon_frag},matcap:{uniforms:Ut([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:Oe.meshmatcap_vert,fragmentShader:Oe.meshmatcap_frag},points:{uniforms:Ut([fe.points,fe.fog]),vertexShader:Oe.points_vert,fragmentShader:Oe.points_frag},dashed:{uniforms:Ut([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Oe.linedashed_vert,fragmentShader:Oe.linedashed_frag},depth:{uniforms:Ut([fe.common,fe.displacementmap]),vertexShader:Oe.depth_vert,fragmentShader:Oe.depth_frag},normal:{uniforms:Ut([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:Oe.meshnormal_vert,fragmentShader:Oe.meshnormal_frag},sprite:{uniforms:Ut([fe.sprite,fe.fog]),vertexShader:Oe.sprite_vert,fragmentShader:Oe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ie},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Oe.background_vert,fragmentShader:Oe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ie}},vertexShader:Oe.backgroundCube_vert,fragmentShader:Oe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Oe.cube_vert,fragmentShader:Oe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Oe.equirect_vert,fragmentShader:Oe.equirect_frag},distance:{uniforms:Ut([fe.common,fe.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Oe.distance_vert,fragmentShader:Oe.distance_frag},shadow:{uniforms:Ut([fe.lights,fe.fog,{color:{value:new Re(0)},opacity:{value:1}}]),vertexShader:Oe.shadow_vert,fragmentShader:Oe.shadow_frag}};on.physical={uniforms:Ut([on.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ie},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ie},clearcoatNormalScale:{value:new Fe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ie},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ie},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ie},sheen:{value:0},sheenColor:{value:new Re(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ie},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ie},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ie},transmissionSamplerSize:{value:new Fe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ie},attenuationDistance:{value:0},attenuationColor:{value:new Re(0)},specularColor:{value:new Re(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ie},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ie},anisotropyVector:{value:new Fe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ie}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag};const ts={r:0,b:0,g:0},Zm=new rt,Lu=new Ie;Lu.set(-1,0,0,0,1,0,0,0,1);function Jm(n,e,t,i,r,s){const a=new Re(0);let o=r===!0?0:1,l,c,d=null,f=0,u=null;function h(R){let P=R.isScene===!0?R.background:null;if(P&&P.isTexture){const v=R.backgroundBlurriness>0;P=e.get(P,v)}return P}function x(R){let P=!1;const v=h(R);v===null?m(a,o):v&&v.isColor&&(m(v,1),P=!0);const T=n.xr.getEnvironmentBlendMode();T==="additive"?t.buffers.color.setClear(0,0,0,1,s):T==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||P)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(R,P){const v=h(P);v&&(v.isCubeTexture||v.mapping===Cs)?(c===void 0&&(c=new _t(new Rr(1,1,1),new _n({name:"BackgroundCubeMaterial",uniforms:Ji(on.backgroundCube.uniforms),vertexShader:on.backgroundCube.vertexShader,fragmentShader:on.backgroundCube.fragmentShader,side:Nt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,y,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=P.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Zm.makeRotationFromEuler(P.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Lu),c.material.toneMapped=Ve.getTransfer(v.colorSpace)!==Ze,(d!==v||f!==v.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,d=v,f=v.version,u=n.toneMapping),c.layers.enableAll(),R.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new _t(new Mi(2,2),new _n({name:"BackgroundMaterial",uniforms:Ji(on.background.uniforms),vertexShader:on.background.vertexShader,fragmentShader:on.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,l.material.toneMapped=Ve.getTransfer(v.colorSpace)!==Ze,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(d!==v||f!==v.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,d=v,f=v.version,u=n.toneMapping),l.layers.enableAll(),R.unshift(l,l.geometry,l.material,0,0,null))}function m(R,P){R.getRGB(ts,Tu(n)),t.buffers.color.setClear(ts.r,ts.g,ts.b,P,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(R,P=1){a.set(R),o=P,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(R){o=R,m(a,o)},render:x,addToRenderList:S,dispose:p}}function Qm(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null);let s=r,a=!1;function o(E,I,G,Y,k){let K=!1;const z=f(E,Y,G,I);s!==z&&(s=z,c(s.object)),K=h(E,Y,G,k),K&&x(E,Y,G,k),k!==null&&e.update(k,n.ELEMENT_ARRAY_BUFFER),(K||a)&&(a=!1,v(E,I,G,Y),k!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return n.createVertexArray()}function c(E){return n.bindVertexArray(E)}function d(E){return n.deleteVertexArray(E)}function f(E,I,G,Y){const k=Y.wireframe===!0;let K=i[I.id];K===void 0&&(K={},i[I.id]=K);const z=E.isInstancedMesh===!0?E.id:0;let te=K[z];te===void 0&&(te={},K[z]=te);let re=te[G.id];re===void 0&&(re={},te[G.id]=re);let ce=re[k];return ce===void 0&&(ce=u(l()),re[k]=ce),ce}function u(E){const I=[],G=[],Y=[];for(let k=0;k<t;k++)I[k]=0,G[k]=0,Y[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:G,attributeDivisors:Y,object:E,attributes:{},index:null}}function h(E,I,G,Y){const k=s.attributes,K=I.attributes;let z=0;const te=G.getAttributes();for(const re in te)if(te[re].location>=0){const de=k[re];let _e=K[re];if(_e===void 0&&(re==="instanceMatrix"&&E.instanceMatrix&&(_e=E.instanceMatrix),re==="instanceColor"&&E.instanceColor&&(_e=E.instanceColor)),de===void 0||de.attribute!==_e||_e&&de.data!==_e.data)return!0;z++}return s.attributesNum!==z||s.index!==Y}function x(E,I,G,Y){const k={},K=I.attributes;let z=0;const te=G.getAttributes();for(const re in te)if(te[re].location>=0){let de=K[re];de===void 0&&(re==="instanceMatrix"&&E.instanceMatrix&&(de=E.instanceMatrix),re==="instanceColor"&&E.instanceColor&&(de=E.instanceColor));const _e={};_e.attribute=de,de&&de.data&&(_e.data=de.data),k[re]=_e,z++}s.attributes=k,s.attributesNum=z,s.index=Y}function S(){const E=s.newAttributes;for(let I=0,G=E.length;I<G;I++)E[I]=0}function m(E){p(E,0)}function p(E,I){const G=s.newAttributes,Y=s.enabledAttributes,k=s.attributeDivisors;G[E]=1,Y[E]===0&&(n.enableVertexAttribArray(E),Y[E]=1),k[E]!==I&&(n.vertexAttribDivisor(E,I),k[E]=I)}function R(){const E=s.newAttributes,I=s.enabledAttributes;for(let G=0,Y=I.length;G<Y;G++)I[G]!==E[G]&&(n.disableVertexAttribArray(G),I[G]=0)}function P(E,I,G,Y,k,K,z){z===!0?n.vertexAttribIPointer(E,I,G,k,K):n.vertexAttribPointer(E,I,G,Y,k,K)}function v(E,I,G,Y){S();const k=Y.attributes,K=G.getAttributes(),z=I.defaultAttributeValues;for(const te in K){const re=K[te];if(re.location>=0){let ce=k[te];if(ce===void 0&&(te==="instanceMatrix"&&E.instanceMatrix&&(ce=E.instanceMatrix),te==="instanceColor"&&E.instanceColor&&(ce=E.instanceColor)),ce!==void 0){const de=ce.normalized,_e=ce.itemSize,ke=e.get(ce);if(ke===void 0)continue;const Je=ke.buffer,Le=ke.type,j=ke.bytesPerElement,le=Le===n.INT||Le===n.UNSIGNED_INT||ce.gpuType===Ho;if(ce.isInterleavedBufferAttribute){const se=ce.data,Ce=se.stride,De=ce.offset;if(se.isInstancedInterleavedBuffer){for(let we=0;we<re.locationSize;we++)p(re.location+we,se.meshPerAttribute);E.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let we=0;we<re.locationSize;we++)m(re.location+we);n.bindBuffer(n.ARRAY_BUFFER,Je);for(let we=0;we<re.locationSize;we++)P(re.location+we,_e/re.locationSize,Le,de,Ce*j,(De+_e/re.locationSize*we)*j,le)}else{if(ce.isInstancedBufferAttribute){for(let se=0;se<re.locationSize;se++)p(re.location+se,ce.meshPerAttribute);E.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let se=0;se<re.locationSize;se++)m(re.location+se);n.bindBuffer(n.ARRAY_BUFFER,Je);for(let se=0;se<re.locationSize;se++)P(re.location+se,_e/re.locationSize,Le,de,_e*j,_e/re.locationSize*se*j,le)}}else if(z!==void 0){const de=z[te];if(de!==void 0)switch(de.length){case 2:n.vertexAttrib2fv(re.location,de);break;case 3:n.vertexAttrib3fv(re.location,de);break;case 4:n.vertexAttrib4fv(re.location,de);break;default:n.vertexAttrib1fv(re.location,de)}}}}R()}function T(){b();for(const E in i){const I=i[E];for(const G in I){const Y=I[G];for(const k in Y){const K=Y[k];for(const z in K)d(K[z].object),delete K[z];delete Y[k]}}delete i[E]}}function y(E){if(i[E.id]===void 0)return;const I=i[E.id];for(const G in I){const Y=I[G];for(const k in Y){const K=Y[k];for(const z in K)d(K[z].object),delete K[z];delete Y[k]}}delete i[E.id]}function L(E){for(const I in i){const G=i[I];for(const Y in G){const k=G[Y];if(k[E.id]===void 0)continue;const K=k[E.id];for(const z in K)d(K[z].object),delete K[z];delete k[E.id]}}}function _(E){for(const I in i){const G=i[I],Y=E.isInstancedMesh===!0?E.id:0,k=G[Y];if(k!==void 0){for(const K in k){const z=k[K];for(const te in z)d(z[te].object),delete z[te];delete k[K]}delete G[Y],Object.keys(G).length===0&&delete i[I]}}}function b(){U(),a=!0,s!==r&&(s=r,c(s.object))}function U(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:b,resetDefaultState:U,dispose:T,releaseStatesOfGeometry:y,releaseStatesOfObject:_,releaseStatesOfProgram:L,initAttributes:S,enableAttribute:m,disableUnusedAttributes:R}}function jm(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,d){d!==0&&(n.drawArraysInstanced(i,l,c,d),t.update(c,i,d))}function o(l,c,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,d);let u=0;for(let h=0;h<d;h++)u+=c[h];t.update(u,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function eg(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const L=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(L){return!(L!==en&&i.convert(L)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(L){const _=L===Pn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(L!==Vt&&i.convert(L)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&L!==cn&&!_)}function l(L){if(L==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const d=l(c);d!==c&&(Pe("WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);const f=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Pe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),R=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),P=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),T=n.getParameter(n.MAX_SAMPLES),y=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:h,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:R,maxVaryings:P,maxFragmentUniforms:v,maxSamples:T,samples:y}}function tg(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new yn,o=new Ie,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const h=f.length!==0||u||i!==0||r;return r=u,i=f.length,h},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,u){t=d(f,u,0)},this.setState=function(f,u,h){const x=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,p=n.get(f);if(!r||x===null||x.length===0||s&&!m)s?d(null):c();else{const R=s?0:i,P=R*4;let v=p.clippingState||null;l.value=v,v=d(x,u,P,h);for(let T=0;T!==P;++T)v[T]=t[T];p.clippingState=v,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=R}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(f,u,h,x){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=l.value,x!==!0||m===null){const p=h+S*4,R=u.matrixWorldInverse;o.getNormalMatrix(R),(m===null||m.length<p)&&(m=new Float32Array(p));for(let P=0,v=h;P!==S;++P,v+=4)a.copy(f[P]).applyMatrix4(R,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}const Kn=4,jl=[.125,.215,.35,.446,.526,.582],hi=20,ng=256,lr=new Ru,ec=new Re;let pa=null,ma=0,ga=0,_a=!1;const ig=new O;class tc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=ig}=s;pa=this._renderer.getRenderTarget(),ma=this._renderer.getActiveCubeFace(),ga=this._renderer.getActiveMipmapLevel(),_a=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=rc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ic(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(pa,ma,ga),this._renderer.xr.enabled=_a,e.scissorTest=!1,Fi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===_i||e.mapping===Ki?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),pa=this._renderer.getRenderTarget(),ma=this._renderer.getActiveCubeFace(),ga=this._renderer.getActiveMipmapLevel(),_a=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:yt,minFilter:yt,generateMipmaps:!1,type:Pn,format:en,colorSpace:xs,depthBuffer:!1},r=nc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=nc(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=rg(s)),this._blurMaterial=ag(s,e,t),this._ggxMaterial=sg(s,e,t)}return r}_compileMaterial(e){const t=new _t(new It,e);this._renderer.compile(t,lr)}_sceneToCubeUV(e,t,i,r,s){const l=new Bt(90,1,t,i),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,h=f.toneMapping;f.getClearColor(ec),f.toneMapping=hn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new _t(new Rr,new Yt({name:"PMREM.Background",side:Nt,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let p=!1;const R=e.background;R?R.isColor&&(m.color.copy(R),e.background=null,p=!0):(m.color.copy(ec),p=!0);for(let P=0;P<6;P++){const v=P%3;v===0?(l.up.set(0,c[P],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+d[P],s.y,s.z)):v===1?(l.up.set(0,0,c[P]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+d[P],s.z)):(l.up.set(0,c[P],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+d[P]));const T=this._cubeSize;Fi(r,v*T,P>2?T:0,T,T),f.setRenderTarget(r),p&&f.render(S,l),f.render(e,l)}f.toneMapping=h,f.autoClear=u,e.background=R}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===_i||e.mapping===Ki;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=rc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ic());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Fi(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,lr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),d=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-d*d),u=0+c*1.25,h=f*u,{_lodMax:x}=this,S=this._sizeLods[i],m=3*S*(i>x-Kn?i-x+Kn:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=h,l.mipInt.value=x-t,Fi(s,m,p,3*S,2*S),r.setRenderTarget(s),r.render(o,lr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=x-i,Fi(e,m,p,3*S,2*S),r.setRenderTarget(e),r.render(o,lr)}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Xe("blur direction must be either latitudinal or longitudinal!");const d=3,f=this._lodMeshes[r];f.material=c;const u=c.uniforms,h=this._sizeLods[i]-1,x=isFinite(s)?Math.PI/(2*h):2*Math.PI/(2*hi-1),S=s/x,m=isFinite(s)?1+Math.floor(d*S):hi;m>hi&&Pe(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${hi}`);const p=[];let R=0;for(let L=0;L<hi;++L){const _=L/S,b=Math.exp(-_*_/2);p.push(b),L===0?R+=b:L<m&&(R+=2*b)}for(let L=0;L<p.length;L++)p[L]=p[L]/R;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=p,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:P}=this;u.dTheta.value=x,u.mipInt.value=P-i;const v=this._sizeLods[r],T=3*v*(r>P-Kn?r-P+Kn:0),y=4*(this._cubeSize-v);Fi(t,T,y,3*v,2*v),l.setRenderTarget(t),l.render(f,lr)}}function rg(n){const e=[],t=[],i=[];let r=n;const s=n-Kn+1+jl.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let l=1/o;a>n-Kn?l=jl[a-n+Kn-1]:a===0&&(l=0),t.push(l);const c=1/(o-2),d=-c,f=1+c,u=[d,d,f,d,f,f,d,d,f,f,d,f],h=6,x=6,S=3,m=2,p=1,R=new Float32Array(S*x*h),P=new Float32Array(m*x*h),v=new Float32Array(p*x*h);for(let y=0;y<h;y++){const L=y%3*2/3-1,_=y>2?0:-1,b=[L,_,0,L+2/3,_,0,L+2/3,_+1,0,L,_,0,L+2/3,_+1,0,L,_+1,0];R.set(b,S*x*y),P.set(u,m*x*y);const U=[y,y,y,y,y,y];v.set(U,p*x*y)}const T=new It;T.setAttribute("position",new xt(R,S)),T.setAttribute("uv",new xt(P,m)),T.setAttribute("faceIndex",new xt(v,p)),i.push(new _t(T,null)),r>Kn&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function nc(n,e,t){const i=new pn(n,e,t);return i.texture.mapping=Cs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Fi(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function sg(n,e,t){return new _n({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:ng,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ds(),fragmentShader:`

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
		`,blending:wn,depthTest:!1,depthWrite:!1})}function ag(n,e,t){const i=new Float32Array(hi),r=new O(0,1,0);return new _n({name:"SphericalGaussianBlur",defines:{n:hi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Ds(),fragmentShader:`

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
		`,blending:wn,depthTest:!1,depthWrite:!1})}function ic(){return new _n({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ds(),fragmentShader:`

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
		`,blending:wn,depthTest:!1,depthWrite:!1})}function rc(){return new _n({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function Ds(){return`

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
	`}class Du extends pn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Eu(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Rr(5,5,5),s=new _n({name:"CubemapFromEquirect",uniforms:Ji(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Nt,blending:wn});s.uniforms.tEquirect.value=t;const a=new _t(r,s),o=t.minFilter;return t.minFilter===Tn&&(t.minFilter=yt),new dh(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function og(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,h=!1){return u==null?null:h?a(u):s(u)}function s(u){if(u&&u.isTexture){const h=u.mapping;if(h===ks||h===Gs)if(e.has(u)){const x=e.get(u).texture;return o(x,u.mapping)}else{const x=u.image;if(x&&x.height>0){const S=new Du(x.height);return S.fromEquirectangularTexture(n,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const h=u.mapping,x=h===ks||h===Gs,S=h===_i||h===Ki;if(x||S){let m=t.get(u);const p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new tc(n)),m=x?i.fromEquirectangular(u,m):i.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const R=u.image;return x&&R&&R.height>0||S&&R&&l(R)?(i===null&&(i=new tc(n)),m=x?i.fromEquirectangular(u):i.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",d),m.texture):null}}}return u}function o(u,h){return h===ks?u.mapping=_i:h===Gs&&(u.mapping=Ki),u}function l(u){let h=0;const x=6;for(let S=0;S<x;S++)u[S]!==void 0&&h++;return h===x}function c(u){const h=u.target;h.removeEventListener("dispose",c);const x=e.get(h);x!==void 0&&(e.delete(h),x.dispose())}function d(u){const h=u.target;h.removeEventListener("dispose",d);const x=t.get(h);x!==void 0&&(t.delete(h),x.dispose())}function f(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:f}}function lg(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&qi("WebGLRenderer: "+i+" extension not supported."),r}}}function cg(n,e,t,i){const r={},s=new WeakMap;function a(f){const u=f.target;u.index!==null&&e.remove(u.index);for(const x in u.attributes)e.remove(u.attributes[x]);u.removeEventListener("dispose",a),delete r[u.id];const h=s.get(u);h&&(e.remove(h),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(f,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function l(f){const u=f.attributes;for(const h in u)e.update(u[h],n.ARRAY_BUFFER)}function c(f){const u=[],h=f.index,x=f.attributes.position;let S=0;if(x===void 0)return;if(h!==null){const R=h.array;S=h.version;for(let P=0,v=R.length;P<v;P+=3){const T=R[P+0],y=R[P+1],L=R[P+2];u.push(T,y,y,L,L,T)}}else{const R=x.array;S=x.version;for(let P=0,v=R.length/3-1;P<v;P+=3){const T=P+0,y=P+1,L=P+2;u.push(T,y,y,L,L,T)}}const m=new(x.count>=65535?Su:Mu)(u,1);m.version=S;const p=s.get(f);p&&e.remove(p),s.set(f,m)}function d(f){const u=s.get(f);if(u){const h=f.index;h!==null&&u.version<h.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:d}}function ug(n,e,t){let i;function r(f){i=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,u){n.drawElements(i,u,s,f*a),t.update(u,i,1)}function c(f,u,h){h!==0&&(n.drawElementsInstanced(i,u,s,f*a,h),t.update(u,i,h))}function d(f,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,s,f,0,h);let S=0;for(let m=0;m<h;m++)S+=u[m];t.update(S,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d}function dg(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Xe("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function fg(n,e,t){const i=new WeakMap,r=new at;function s(a,o,l){const c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=d!==void 0?d.length:0;let u=i.get(o);if(u===void 0||u.count!==f){let U=function(){_.dispose(),i.delete(o),o.removeEventListener("dispose",U)};var h=U;u!==void 0&&u.texture.dispose();const x=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],R=o.morphAttributes.normal||[],P=o.morphAttributes.color||[];let v=0;x===!0&&(v=1),S===!0&&(v=2),m===!0&&(v=3);let T=o.attributes.position.count*v,y=1;T>e.maxTextureSize&&(y=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const L=new Float32Array(T*y*4*f),_=new xu(L,T,y,f);_.type=cn,_.needsUpdate=!0;const b=v*4;for(let E=0;E<f;E++){const I=p[E],G=R[E],Y=P[E],k=T*y*4*E;for(let K=0;K<I.count;K++){const z=K*b;x===!0&&(r.fromBufferAttribute(I,K),L[k+z+0]=r.x,L[k+z+1]=r.y,L[k+z+2]=r.z,L[k+z+3]=0),S===!0&&(r.fromBufferAttribute(G,K),L[k+z+4]=r.x,L[k+z+5]=r.y,L[k+z+6]=r.z,L[k+z+7]=0),m===!0&&(r.fromBufferAttribute(Y,K),L[k+z+8]=r.x,L[k+z+9]=r.y,L[k+z+10]=r.z,L[k+z+11]=Y.itemSize===4?r.w:1)}}u={count:f,texture:_,size:new Fe(T,y)},i.set(o,u),o.addEventListener("dispose",U)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let x=0;for(let m=0;m<c.length;m++)x+=c[m];const S=o.morphTargetsRelative?1:1-x;l.getUniforms().setValue(n,"morphTargetBaseInfluence",S),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:s}}function hg(n,e,t,i,r){let s=new WeakMap;function a(c){const d=r.render.frame,f=c.geometry,u=e.get(c,f);if(s.get(u)!==d&&(e.update(u),s.set(u,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==d&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,d))),c.isSkinnedMesh){const h=c.skeleton;s.get(h)!==d&&(h.update(),s.set(h,d))}return u}function o(){s=new WeakMap}function l(c){const d=c.target;d.removeEventListener("dispose",l),i.releaseStatesOfObject(d),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:a,dispose:o}}const pg={[iu]:"LINEAR_TONE_MAPPING",[ru]:"REINHARD_TONE_MAPPING",[su]:"CINEON_TONE_MAPPING",[Go]:"ACES_FILMIC_TONE_MAPPING",[ou]:"AGX_TONE_MAPPING",[lu]:"NEUTRAL_TONE_MAPPING",[au]:"CUSTOM_TONE_MAPPING"};function mg(n,e,t,i,r,s){const a=new pn(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new Zi(e,t):void 0}),o=new pn(e,t,{type:Pn,depthBuffer:!1,stencilBuffer:!1}),l=new It;l.setAttribute("position",new At([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new At([0,2,0,0,2,0],2));const c=new nh({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new _t(l,c),f=new Ru(-1,1,1,-1,0,1);let u=null,h=null,x=!1,S,m=null,p=[],R=!1;this.setSize=function(P,v){a.setSize(P,v),o.setSize(P,v);for(let T=0;T<p.length;T++){const y=p[T];y.setSize&&y.setSize(P,v)}},this.setEffects=function(P){p=P,R=p.length>0&&p[0].isRenderPass===!0;const v=a.width,T=a.height;for(let y=0;y<p.length;y++){const L=p[y];L.setSize&&L.setSize(v,T)}},this.begin=function(P,v){if(x||P.toneMapping===hn&&p.length===0)return!1;if(m=v,v!==null){const T=v.width,y=v.height;(a.width!==T||a.height!==y)&&this.setSize(T,y)}return R===!1&&P.setRenderTarget(a),S=P.toneMapping,P.toneMapping=hn,!0},this.hasRenderPass=function(){return R},this.end=function(P,v){P.toneMapping=S,x=!0;let T=a,y=o;for(let L=0;L<p.length;L++){const _=p[L];if(_.enabled!==!1&&(_.render(P,y,T,v),_.needsSwap!==!1)){const b=T;T=y,y=b}}if(u!==P.outputColorSpace||h!==P.toneMapping){u=P.outputColorSpace,h=P.toneMapping,c.defines={},Ve.getTransfer(u)===Ze&&(c.defines.SRGB_TRANSFER="");const L=pg[h];L&&(c.defines[L]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=T.texture,P.setRenderTarget(m),P.render(d,f),m=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}const Iu=new Rt,wo=new Zi(1,1),Uu=new xu,Nu=new If,Fu=new Eu,sc=[],ac=[],oc=new Float32Array(16),lc=new Float32Array(9),cc=new Float32Array(4);function tr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=sc[r];if(s===void 0&&(s=new Float32Array(r),sc[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Mt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function St(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Is(n,e){let t=ac[e];t===void 0&&(t=new Int32Array(e),ac[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function gg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function _g(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2fv(this.addr,e),St(t,e)}}function xg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;n.uniform3fv(this.addr,e),St(t,e)}}function vg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4fv(this.addr,e),St(t,e)}}function Mg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;cc.set(i),n.uniformMatrix2fv(this.addr,!1,cc),St(t,i)}}function Sg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;lc.set(i),n.uniformMatrix3fv(this.addr,!1,lc),St(t,i)}}function bg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,i))return;oc.set(i),n.uniformMatrix4fv(this.addr,!1,oc),St(t,i)}}function Eg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function yg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2iv(this.addr,e),St(t,e)}}function Tg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3iv(this.addr,e),St(t,e)}}function Ag(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4iv(this.addr,e),St(t,e)}}function wg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Rg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2uiv(this.addr,e),St(t,e)}}function Cg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3uiv(this.addr,e),St(t,e)}}function Pg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4uiv(this.addr,e),St(t,e)}}function Lg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(wo.compareFunction=t.isReversedDepthBuffer()?Ko:$o,s=wo):s=Iu,t.setTexture2D(e||s,r)}function Dg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Nu,r)}function Ig(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Fu,r)}function Ug(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Uu,r)}function Ng(n){switch(n){case 5126:return gg;case 35664:return _g;case 35665:return xg;case 35666:return vg;case 35674:return Mg;case 35675:return Sg;case 35676:return bg;case 5124:case 35670:return Eg;case 35667:case 35671:return yg;case 35668:case 35672:return Tg;case 35669:case 35673:return Ag;case 5125:return wg;case 36294:return Rg;case 36295:return Cg;case 36296:return Pg;case 35678:case 36198:case 36298:case 36306:case 35682:return Lg;case 35679:case 36299:case 36307:return Dg;case 35680:case 36300:case 36308:case 36293:return Ig;case 36289:case 36303:case 36311:case 36292:return Ug}}function Fg(n,e){n.uniform1fv(this.addr,e)}function Og(n,e){const t=tr(e,this.size,2);n.uniform2fv(this.addr,t)}function Bg(n,e){const t=tr(e,this.size,3);n.uniform3fv(this.addr,t)}function zg(n,e){const t=tr(e,this.size,4);n.uniform4fv(this.addr,t)}function kg(n,e){const t=tr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Gg(n,e){const t=tr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Hg(n,e){const t=tr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Vg(n,e){n.uniform1iv(this.addr,e)}function Wg(n,e){n.uniform2iv(this.addr,e)}function Xg(n,e){n.uniform3iv(this.addr,e)}function qg(n,e){n.uniform4iv(this.addr,e)}function Yg(n,e){n.uniform1uiv(this.addr,e)}function $g(n,e){n.uniform2uiv(this.addr,e)}function Kg(n,e){n.uniform3uiv(this.addr,e)}function Zg(n,e){n.uniform4uiv(this.addr,e)}function Jg(n,e,t){const i=this.cache,r=e.length,s=Is(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=wo:a=Iu;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function Qg(n,e,t){const i=this.cache,r=e.length,s=Is(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Nu,s[a])}function jg(n,e,t){const i=this.cache,r=e.length,s=Is(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Fu,s[a])}function e0(n,e,t){const i=this.cache,r=e.length,s=Is(t,r);Mt(i,s)||(n.uniform1iv(this.addr,s),St(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Uu,s[a])}function t0(n){switch(n){case 5126:return Fg;case 35664:return Og;case 35665:return Bg;case 35666:return zg;case 35674:return kg;case 35675:return Gg;case 35676:return Hg;case 5124:case 35670:return Vg;case 35667:case 35671:return Wg;case 35668:case 35672:return Xg;case 35669:case 35673:return qg;case 5125:return Yg;case 36294:return $g;case 36295:return Kg;case 36296:return Zg;case 35678:case 36198:case 36298:case 36306:case 35682:return Jg;case 35679:case 36299:case 36307:return Qg;case 35680:case 36300:case 36308:case 36293:return jg;case 36289:case 36303:case 36311:case 36292:return e0}}class n0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Ng(t.type)}}class i0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=t0(t.type)}}class r0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const xa=/(\w+)(\])?(\[|\.)?/g;function uc(n,e){n.seq.push(e),n.map[e.id]=e}function s0(n,e,t){const i=n.name,r=i.length;for(xa.lastIndex=0;;){const s=xa.exec(i),a=xa.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){uc(t,c===void 0?new n0(o,n,e):new i0(o,n,e));break}else{let f=t.map[o];f===void 0&&(f=new r0(o),uc(t,f)),t=f}}}class hs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);s0(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function dc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const a0=37297;let o0=0;function l0(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const fc=new Ie;function c0(n){Ve._getMatrix(fc,Ve.workingColorSpace,n);const e=`mat3( ${fc.elements.map(t=>t.toFixed(4))} )`;switch(Ve.getTransfer(n)){case vs:return[e,"LinearTransferOETF"];case Ze:return[e,"sRGBTransferOETF"];default:return Pe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function hc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+l0(n.getShaderSource(e),o)}else return s}function u0(n,e){const t=c0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const d0={[iu]:"Linear",[ru]:"Reinhard",[su]:"Cineon",[Go]:"ACESFilmic",[ou]:"AgX",[lu]:"Neutral",[au]:"Custom"};function f0(n,e){const t=d0[e];return t===void 0?(Pe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const ns=new O;function h0(){Ve.getLuminanceCoefficients(ns);const n=ns.x.toFixed(4),e=ns.y.toFixed(4),t=ns.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function p0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(gr).join(`
`)}function m0(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function g0(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function gr(n){return n!==""}function pc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function mc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const _0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ro(n){return n.replace(_0,v0)}const x0=new Map;function v0(n,e){let t=Oe[e];if(t===void 0){const i=x0.get(e);if(i!==void 0)t=Oe[i],Pe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Ro(t)}const M0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function gc(n){return n.replace(M0,S0)}function S0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function _c(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}const b0={[ls]:"SHADOWMAP_TYPE_PCF",[mr]:"SHADOWMAP_TYPE_VSM"};function E0(n){return b0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const y0={[_i]:"ENVMAP_TYPE_CUBE",[Ki]:"ENVMAP_TYPE_CUBE",[Cs]:"ENVMAP_TYPE_CUBE_UV"};function T0(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":y0[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const A0={[Ki]:"ENVMAP_MODE_REFRACTION"};function w0(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":A0[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const R0={[nu]:"ENVMAP_BLENDING_MULTIPLY",[df]:"ENVMAP_BLENDING_MIX",[ff]:"ENVMAP_BLENDING_ADD"};function C0(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":R0[n.combine]||"ENVMAP_BLENDING_NONE"}function P0(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function L0(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=E0(t),c=T0(t),d=w0(t),f=C0(t),u=P0(t),h=p0(t),x=m0(s),S=r.createProgram();let m,p,R=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(gr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(gr).join(`
`),p.length>0&&(p+=`
`)):(m=[_c(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(gr).join(`
`),p=[_c(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==hn?"#define TONE_MAPPING":"",t.toneMapping!==hn?Oe.tonemapping_pars_fragment:"",t.toneMapping!==hn?f0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Oe.colorspace_pars_fragment,u0("linearToOutputTexel",t.outputColorSpace),h0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(gr).join(`
`)),a=Ro(a),a=pc(a,t),a=mc(a,t),o=Ro(o),o=pc(o,t),o=mc(o,t),a=gc(a),o=gc(o),t.isRawShaderMaterial!==!0&&(R=`#version 300 es
`,m=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Tl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Tl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const P=R+m+a,v=R+p+o,T=dc(r,r.VERTEX_SHADER,P),y=dc(r,r.FRAGMENT_SHADER,v);r.attachShader(S,T),r.attachShader(S,y),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function L(E){if(n.debug.checkShaderErrors){const I=r.getProgramInfoLog(S)||"",G=r.getShaderInfoLog(T)||"",Y=r.getShaderInfoLog(y)||"",k=I.trim(),K=G.trim(),z=Y.trim();let te=!0,re=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(te=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,T,y);else{const ce=hc(r,T,"vertex"),de=hc(r,y,"fragment");Xe("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+k+`
`+ce+`
`+de)}else k!==""?Pe("WebGLProgram: Program Info Log:",k):(K===""||z==="")&&(re=!1);re&&(E.diagnostics={runnable:te,programLog:k,vertexShader:{log:K,prefix:m},fragmentShader:{log:z,prefix:p}})}r.deleteShader(T),r.deleteShader(y),_=new hs(r,S),b=g0(r,S)}let _;this.getUniforms=function(){return _===void 0&&L(this),_};let b;this.getAttributes=function(){return b===void 0&&L(this),b};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=r.getProgramParameter(S,a0)),U},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=o0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=y,this}let D0=0;class I0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new U0(e),t.set(e,i)),i}}class U0{constructor(e){this.id=D0++,this.code=e,this.usedTimes=0}}function N0(n){return n===xi||n===gs||n===_s}function F0(n,e,t,i,r,s){const a=new Jo,o=new I0,l=new Set,c=[],d=new Map,f=i.logarithmicDepthBuffer;let u=i.precision;const h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,b,U,E,I,G){const Y=E.fog,k=I.geometry,K=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?E.environment:null,z=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,te=e.get(_.envMap||K,z),re=te&&te.mapping===Cs?te.image.height:null,ce=h[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&Pe("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));const de=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,_e=de!==void 0?de.length:0;let ke=0;k.morphAttributes.position!==void 0&&(ke=1),k.morphAttributes.normal!==void 0&&(ke=2),k.morphAttributes.color!==void 0&&(ke=3);let Je,Le,j,le;if(ce){const Se=on[ce];Je=Se.vertexShader,Le=Se.fragmentShader}else{Je=_.vertexShader,Le=_.fragmentShader;const Se=o.getVertexShaderStage(_),lt=o.getFragmentShaderStage(_);o.update(_,Se,lt),j=Se.id,le=lt.id}const se=n.getRenderTarget(),Ce=n.state.buffers.depth.getReversed(),De=I.isInstancedMesh===!0,we=I.isBatchedMesh===!0,st=!!_.map,ze=!!_.matcap,Ke=!!te,qe=!!_.aoMap,He=!!_.lightMap,ot=!!_.bumpMap&&_.wireframe===!1,dt=!!_.normalMap,mt=!!_.displacementMap,vt=!!_.emissiveMap,tt=!!_.metalnessMap,Ue=!!_.roughnessMap,F=_.anisotropy>0,Ct=_.clearcoat>0,Ye=_.dispersion>0,A=_.iridescence>0,g=_.sheen>0,H=_.transmission>0,V=F&&!!_.anisotropyMap,Z=Ct&&!!_.clearcoatMap,ae=Ct&&!!_.clearcoatNormalMap,w=Ct&&!!_.clearcoatRoughnessMap,C=A&&!!_.iridescenceMap,D=A&&!!_.iridescenceThicknessMap,W=g&&!!_.sheenColorMap,ne=g&&!!_.sheenRoughnessMap,J=!!_.specularMap,ee=!!_.specularColorMap,ge=!!_.specularIntensityMap,ve=H&&!!_.transmissionMap,Ee=H&&!!_.thicknessMap,N=!!_.gradientMap,oe=!!_.alphaMap,Q=_.alphaTest>0,ue=!!_.alphaHash,he=!!_.extensions;let ie=hn;_.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(ie=n.toneMapping);const ye={shaderID:ce,shaderType:_.type,shaderName:_.name,vertexShader:Je,fragmentShader:Le,defines:_.defines,customVertexShaderID:j,customFragmentShaderID:le,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:we,batchingColor:we&&I._colorsTexture!==null,instancing:De,instancingColor:De&&I.instanceColor!==null,instancingMorph:De&&I.morphTexture!==null,outputColorSpace:se===null?n.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:Ve.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:st,matcap:ze,envMap:Ke,envMapMode:Ke&&te.mapping,envMapCubeUVHeight:re,aoMap:qe,lightMap:He,bumpMap:ot,normalMap:dt,displacementMap:mt,emissiveMap:vt,normalMapObjectSpace:dt&&_.normalMapType===mf,normalMapTangentSpace:dt&&_.normalMapType===yo,packedNormalMap:dt&&_.normalMapType===yo&&N0(_.normalMap.format),metalnessMap:tt,roughnessMap:Ue,anisotropy:F,anisotropyMap:V,clearcoat:Ct,clearcoatMap:Z,clearcoatNormalMap:ae,clearcoatRoughnessMap:w,dispersion:Ye,iridescence:A,iridescenceMap:C,iridescenceThicknessMap:D,sheen:g,sheenColorMap:W,sheenRoughnessMap:ne,specularMap:J,specularColorMap:ee,specularIntensityMap:ge,transmission:H,transmissionMap:ve,thicknessMap:Ee,gradientMap:N,opaque:_.transparent===!1&&_.blending===Xi&&_.alphaToCoverage===!1,alphaMap:oe,alphaTest:Q,alphaHash:ue,combine:_.combine,mapUv:st&&x(_.map.channel),aoMapUv:qe&&x(_.aoMap.channel),lightMapUv:He&&x(_.lightMap.channel),bumpMapUv:ot&&x(_.bumpMap.channel),normalMapUv:dt&&x(_.normalMap.channel),displacementMapUv:mt&&x(_.displacementMap.channel),emissiveMapUv:vt&&x(_.emissiveMap.channel),metalnessMapUv:tt&&x(_.metalnessMap.channel),roughnessMapUv:Ue&&x(_.roughnessMap.channel),anisotropyMapUv:V&&x(_.anisotropyMap.channel),clearcoatMapUv:Z&&x(_.clearcoatMap.channel),clearcoatNormalMapUv:ae&&x(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:w&&x(_.clearcoatRoughnessMap.channel),iridescenceMapUv:C&&x(_.iridescenceMap.channel),iridescenceThicknessMapUv:D&&x(_.iridescenceThicknessMap.channel),sheenColorMapUv:W&&x(_.sheenColorMap.channel),sheenRoughnessMapUv:ne&&x(_.sheenRoughnessMap.channel),specularMapUv:J&&x(_.specularMap.channel),specularColorMapUv:ee&&x(_.specularColorMap.channel),specularIntensityMapUv:ge&&x(_.specularIntensityMap.channel),transmissionMapUv:ve&&x(_.transmissionMap.channel),thicknessMapUv:Ee&&x(_.thicknessMap.channel),alphaMapUv:oe&&x(_.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(dt||F),vertexNormals:!!k.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!k.attributes.uv&&(st||oe),fog:!!Y,useFog:_.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||k.attributes.normal===void 0&&dt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Ce,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:k.attributes.position!==void 0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:ke,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&U.length>0,shadowMapType:n.shadowMap.type,toneMapping:ie,decodeVideoTexture:st&&_.map.isVideoTexture===!0&&Ve.getTransfer(_.map.colorSpace)===Ze,decodeVideoTextureEmissive:vt&&_.emissiveMap.isVideoTexture===!0&&Ve.getTransfer(_.emissiveMap.colorSpace)===Ze,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ht,flipSided:_.side===Nt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:he&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(he&&_.extensions.multiDraw===!0||we)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return ye.vertexUv1s=l.has(1),ye.vertexUv2s=l.has(2),ye.vertexUv3s=l.has(3),l.clear(),ye}function m(_){const b=[];if(_.shaderID?b.push(_.shaderID):(b.push(_.customVertexShaderID),b.push(_.customFragmentShaderID)),_.defines!==void 0)for(const U in _.defines)b.push(U),b.push(_.defines[U]);return _.isRawShaderMaterial===!1&&(p(b,_),R(b,_),b.push(n.outputColorSpace)),b.push(_.customProgramCacheKey),b.join()}function p(_,b){_.push(b.precision),_.push(b.outputColorSpace),_.push(b.envMapMode),_.push(b.envMapCubeUVHeight),_.push(b.mapUv),_.push(b.alphaMapUv),_.push(b.lightMapUv),_.push(b.aoMapUv),_.push(b.bumpMapUv),_.push(b.normalMapUv),_.push(b.displacementMapUv),_.push(b.emissiveMapUv),_.push(b.metalnessMapUv),_.push(b.roughnessMapUv),_.push(b.anisotropyMapUv),_.push(b.clearcoatMapUv),_.push(b.clearcoatNormalMapUv),_.push(b.clearcoatRoughnessMapUv),_.push(b.iridescenceMapUv),_.push(b.iridescenceThicknessMapUv),_.push(b.sheenColorMapUv),_.push(b.sheenRoughnessMapUv),_.push(b.specularMapUv),_.push(b.specularColorMapUv),_.push(b.specularIntensityMapUv),_.push(b.transmissionMapUv),_.push(b.thicknessMapUv),_.push(b.combine),_.push(b.fogExp2),_.push(b.sizeAttenuation),_.push(b.morphTargetsCount),_.push(b.morphAttributeCount),_.push(b.numDirLights),_.push(b.numPointLights),_.push(b.numSpotLights),_.push(b.numSpotLightMaps),_.push(b.numHemiLights),_.push(b.numRectAreaLights),_.push(b.numDirLightShadows),_.push(b.numPointLightShadows),_.push(b.numSpotLightShadows),_.push(b.numSpotLightShadowsWithMaps),_.push(b.numLightProbes),_.push(b.shadowMapType),_.push(b.toneMapping),_.push(b.numClippingPlanes),_.push(b.numClipIntersection),_.push(b.depthPacking)}function R(_,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function P(_){const b=h[_.type];let U;if(b){const E=on[b];U=jf.clone(E.uniforms)}else U=_.uniforms;return U}function v(_,b){let U=d.get(b);return U!==void 0?++U.usedTimes:(U=new L0(n,b,_,r),c.push(U),d.set(b,U)),U}function T(_){if(--_.usedTimes===0){const b=c.indexOf(_);c[b]=c[c.length-1],c.pop(),d.delete(_.cacheKey),_.destroy()}}function y(_){o.remove(_)}function L(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:P,acquireProgram:v,releaseProgram:T,releaseShaderCache:y,programs:c,dispose:L}}function O0(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function B0(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function xc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function vc(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u){let h=0;return u.isInstancedMesh&&(h+=2),u.isSkinnedMesh&&(h+=1),h}function o(u,h,x,S,m,p){let R=n[e];return R===void 0?(R={id:u.id,object:u,geometry:h,material:x,materialVariant:a(u),groupOrder:S,renderOrder:u.renderOrder,z:m,group:p},n[e]=R):(R.id=u.id,R.object=u,R.geometry=h,R.material=x,R.materialVariant=a(u),R.groupOrder=S,R.renderOrder=u.renderOrder,R.z=m,R.group=p),e++,R}function l(u,h,x,S,m,p){const R=o(u,h,x,S,m,p);x.transmission>0?i.push(R):x.transparent===!0?r.push(R):t.push(R)}function c(u,h,x,S,m,p){const R=o(u,h,x,S,m,p);x.transmission>0?i.unshift(R):x.transparent===!0?r.unshift(R):t.unshift(R)}function d(u,h,x){t.length>1&&t.sort(u||B0),i.length>1&&i.sort(h||xc),r.length>1&&r.sort(h||xc),x&&(t.reverse(),i.reverse(),r.reverse())}function f(){for(let u=e,h=n.length;u<h;u++){const x=n[u];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:f,sort:d}}function z0(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new vc,n.set(i,[a])):r>=s.length?(a=new vc,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function k0(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new Re};break;case"SpotLight":t={position:new O,direction:new O,color:new Re,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new Re,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new Re,groundColor:new Re};break;case"RectAreaLight":t={color:new Re,position:new O,halfWidth:new O,halfHeight:new O};break}return n[e.id]=t,t}}}function G0(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Fe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Fe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Fe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let H0=0;function V0(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function W0(n){const e=new k0,t=G0(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new O);const r=new O,s=new rt,a=new rt;function o(c){let d=0,f=0,u=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let h=0,x=0,S=0,m=0,p=0,R=0,P=0,v=0,T=0,y=0,L=0;c.sort(V0);for(let b=0,U=c.length;b<U;b++){const E=c[b],I=E.color,G=E.intensity,Y=E.distance;let k=null;if(E.shadow&&E.shadow.map&&(E.shadow.map.texture.format===xi?k=E.shadow.map.texture:k=E.shadow.map.depthTexture||E.shadow.map.texture),E.isAmbientLight)d+=I.r*G,f+=I.g*G,u+=I.b*G;else if(E.isLightProbe){for(let K=0;K<9;K++)i.probe[K].addScaledVector(E.sh.coefficients[K],G);L++}else if(E.isDirectionalLight){const K=e.get(E);if(K.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){const z=E.shadow,te=t.get(E);te.shadowIntensity=z.intensity,te.shadowBias=z.bias,te.shadowNormalBias=z.normalBias,te.shadowRadius=z.radius,te.shadowMapSize=z.mapSize,i.directionalShadow[h]=te,i.directionalShadowMap[h]=k,i.directionalShadowMatrix[h]=E.shadow.matrix,R++}i.directional[h]=K,h++}else if(E.isSpotLight){const K=e.get(E);K.position.setFromMatrixPosition(E.matrixWorld),K.color.copy(I).multiplyScalar(G),K.distance=Y,K.coneCos=Math.cos(E.angle),K.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),K.decay=E.decay,i.spot[S]=K;const z=E.shadow;if(E.map&&(i.spotLightMap[T]=E.map,T++,z.updateMatrices(E),E.castShadow&&y++),i.spotLightMatrix[S]=z.matrix,E.castShadow){const te=t.get(E);te.shadowIntensity=z.intensity,te.shadowBias=z.bias,te.shadowNormalBias=z.normalBias,te.shadowRadius=z.radius,te.shadowMapSize=z.mapSize,i.spotShadow[S]=te,i.spotShadowMap[S]=k,v++}S++}else if(E.isRectAreaLight){const K=e.get(E);K.color.copy(I).multiplyScalar(G),K.halfWidth.set(E.width*.5,0,0),K.halfHeight.set(0,E.height*.5,0),i.rectArea[m]=K,m++}else if(E.isPointLight){const K=e.get(E);if(K.color.copy(E.color).multiplyScalar(E.intensity),K.distance=E.distance,K.decay=E.decay,E.castShadow){const z=E.shadow,te=t.get(E);te.shadowIntensity=z.intensity,te.shadowBias=z.bias,te.shadowNormalBias=z.normalBias,te.shadowRadius=z.radius,te.shadowMapSize=z.mapSize,te.shadowCameraNear=z.camera.near,te.shadowCameraFar=z.camera.far,i.pointShadow[x]=te,i.pointShadowMap[x]=k,i.pointShadowMatrix[x]=E.shadow.matrix,P++}i.point[x]=K,x++}else if(E.isHemisphereLight){const K=e.get(E);K.skyColor.copy(E.color).multiplyScalar(G),K.groundColor.copy(E.groundColor).multiplyScalar(G),i.hemi[p]=K,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=fe.LTC_FLOAT_1,i.rectAreaLTC2=fe.LTC_FLOAT_2):(i.rectAreaLTC1=fe.LTC_HALF_1,i.rectAreaLTC2=fe.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=u;const _=i.hash;(_.directionalLength!==h||_.pointLength!==x||_.spotLength!==S||_.rectAreaLength!==m||_.hemiLength!==p||_.numDirectionalShadows!==R||_.numPointShadows!==P||_.numSpotShadows!==v||_.numSpotMaps!==T||_.numLightProbes!==L)&&(i.directional.length=h,i.spot.length=S,i.rectArea.length=m,i.point.length=x,i.hemi.length=p,i.directionalShadow.length=R,i.directionalShadowMap.length=R,i.pointShadow.length=P,i.pointShadowMap.length=P,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=R,i.pointShadowMatrix.length=P,i.spotLightMatrix.length=v+T-y,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=y,i.numLightProbes=L,_.directionalLength=h,_.pointLength=x,_.spotLength=S,_.rectAreaLength=m,_.hemiLength=p,_.numDirectionalShadows=R,_.numPointShadows=P,_.numSpotShadows=v,_.numSpotMaps=T,_.numLightProbes=L,i.version=H0++)}function l(c,d){let f=0,u=0,h=0,x=0,S=0;const m=d.matrixWorldInverse;for(let p=0,R=c.length;p<R;p++){const P=c[p];if(P.isDirectionalLight){const v=i.directional[f];v.direction.setFromMatrixPosition(P.matrixWorld),r.setFromMatrixPosition(P.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(m),f++}else if(P.isSpotLight){const v=i.spot[h];v.position.setFromMatrixPosition(P.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(P.matrixWorld),r.setFromMatrixPosition(P.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(m),h++}else if(P.isRectAreaLight){const v=i.rectArea[x];v.position.setFromMatrixPosition(P.matrixWorld),v.position.applyMatrix4(m),a.identity(),s.copy(P.matrixWorld),s.premultiply(m),a.extractRotation(s),v.halfWidth.set(P.width*.5,0,0),v.halfHeight.set(0,P.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),x++}else if(P.isPointLight){const v=i.point[u];v.position.setFromMatrixPosition(P.matrixWorld),v.position.applyMatrix4(m),u++}else if(P.isHemisphereLight){const v=i.hemi[S];v.direction.setFromMatrixPosition(P.matrixWorld),v.direction.transformDirection(m),S++}}}return{setup:o,setupView:l,state:i}}function Mc(n){const e=new W0(n),t=[],i=[],r=[];function s(u){f.camera=u,t.length=0,i.length=0,r.length=0}function a(u){t.push(u)}function o(u){i.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function d(u){e.setupView(t,u)}const f={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:d,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function X0(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Mc(n),e.set(r,[o])):s>=a.length?(o=new Mc(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const q0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Y0=`uniform sampler2D shadow_pass;
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
}`,$0=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],K0=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],Sc=new rt,cr=new O,va=new O;function Z0(n,e,t){let i=new jo;const r=new Fe,s=new Fe,a=new at,o=new rh,l=new sh,c={},d=t.maxTextureSize,f={[jn]:Nt,[Nt]:jn,[Ht]:Ht},u=new _n({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Fe},radius:{value:4}},vertexShader:q0,fragmentShader:Y0}),h=u.clone();h.defines.HORIZONTAL_PASS=1;const x=new It;x.setAttribute("position",new xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new _t(x,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ls;let p=this.type;this.render=function(y,L,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||y.length===0)return;this.type===Xd&&(Pe("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ls);const b=n.getRenderTarget(),U=n.getActiveCubeFace(),E=n.getActiveMipmapLevel(),I=n.state;I.setBlending(wn),I.buffers.depth.getReversed()===!0?I.buffers.color.setClear(0,0,0,0):I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const G=p!==this.type;G&&L.traverse(function(Y){Y.material&&(Array.isArray(Y.material)?Y.material.forEach(k=>k.needsUpdate=!0):Y.material.needsUpdate=!0)});for(let Y=0,k=y.length;Y<k;Y++){const K=y[Y],z=K.shadow;if(z===void 0){Pe("WebGLShadowMap:",K,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;r.copy(z.mapSize);const te=z.getFrameExtents();r.multiply(te),s.copy(z.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/te.x),r.x=s.x*te.x,z.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/te.y),r.y=s.y*te.y,z.mapSize.y=s.y));const re=n.state.buffers.depth.getReversed();if(z.camera._reversedDepth=re,z.map===null||G===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===mr){if(K.isPointLight){Pe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new pn(r.x,r.y,{format:xi,type:Pn,minFilter:yt,magFilter:yt,generateMipmaps:!1}),z.map.texture.name=K.name+".shadowMap",z.map.depthTexture=new Zi(r.x,r.y,cn),z.map.depthTexture.name=K.name+".shadowMapDepth",z.map.depthTexture.format=Ln,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=wt,z.map.depthTexture.magFilter=wt}else K.isPointLight?(z.map=new Du(r.x),z.map.depthTexture=new Jf(r.x,gn)):(z.map=new pn(r.x,r.y),z.map.depthTexture=new Zi(r.x,r.y,gn)),z.map.depthTexture.name=K.name+".shadowMap",z.map.depthTexture.format=Ln,this.type===ls?(z.map.depthTexture.compareFunction=re?Ko:$o,z.map.depthTexture.minFilter=yt,z.map.depthTexture.magFilter=yt):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=wt,z.map.depthTexture.magFilter=wt);z.camera.updateProjectionMatrix()}const ce=z.map.isWebGLCubeRenderTarget?6:1;for(let de=0;de<ce;de++){if(z.map.isWebGLCubeRenderTarget)n.setRenderTarget(z.map,de),n.clear();else{de===0&&(n.setRenderTarget(z.map),n.clear());const _e=z.getViewport(de);a.set(s.x*_e.x,s.y*_e.y,s.x*_e.z,s.y*_e.w),I.viewport(a)}if(K.isPointLight){const _e=z.camera,ke=z.matrix,Je=K.distance||_e.far;Je!==_e.far&&(_e.far=Je,_e.updateProjectionMatrix()),cr.setFromMatrixPosition(K.matrixWorld),_e.position.copy(cr),va.copy(_e.position),va.add($0[de]),_e.up.copy(K0[de]),_e.lookAt(va),_e.updateMatrixWorld(),ke.makeTranslation(-cr.x,-cr.y,-cr.z),Sc.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),z._frustum.setFromProjectionMatrix(Sc,_e.coordinateSystem,_e.reversedDepth)}else z.updateMatrices(K);i=z.getFrustum(),v(L,_,z.camera,K,this.type)}z.isPointLightShadow!==!0&&this.type===mr&&R(z,_),z.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(b,U,E)};function R(y,L){const _=e.update(S);u.defines.VSM_SAMPLES!==y.blurSamples&&(u.defines.VSM_SAMPLES=y.blurSamples,h.defines.VSM_SAMPLES=y.blurSamples,u.needsUpdate=!0,h.needsUpdate=!0),y.mapPass===null&&(y.mapPass=new pn(r.x,r.y,{format:xi,type:Pn})),u.uniforms.shadow_pass.value=y.map.depthTexture,u.uniforms.resolution.value=y.mapSize,u.uniforms.radius.value=y.radius,n.setRenderTarget(y.mapPass),n.clear(),n.renderBufferDirect(L,null,_,u,S,null),h.uniforms.shadow_pass.value=y.mapPass.texture,h.uniforms.resolution.value=y.mapSize,h.uniforms.radius.value=y.radius,n.setRenderTarget(y.map),n.clear(),n.renderBufferDirect(L,null,_,h,S,null)}function P(y,L,_,b){let U=null;const E=_.isPointLight===!0?y.customDistanceMaterial:y.customDepthMaterial;if(E!==void 0)U=E;else if(U=_.isPointLight===!0?l:o,n.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0||L.alphaToCoverage===!0){const I=U.uuid,G=L.uuid;let Y=c[I];Y===void 0&&(Y={},c[I]=Y);let k=Y[G];k===void 0&&(k=U.clone(),Y[G]=k,L.addEventListener("dispose",T)),U=k}if(U.visible=L.visible,U.wireframe=L.wireframe,b===mr?U.side=L.shadowSide!==null?L.shadowSide:L.side:U.side=L.shadowSide!==null?L.shadowSide:f[L.side],U.alphaMap=L.alphaMap,U.alphaTest=L.alphaToCoverage===!0?.5:L.alphaTest,U.map=L.map,U.clipShadows=L.clipShadows,U.clippingPlanes=L.clippingPlanes,U.clipIntersection=L.clipIntersection,U.displacementMap=L.displacementMap,U.displacementScale=L.displacementScale,U.displacementBias=L.displacementBias,U.wireframeLinewidth=L.wireframeLinewidth,U.linewidth=L.linewidth,_.isPointLight===!0&&U.isMeshDistanceMaterial===!0){const I=n.properties.get(U);I.light=_}return U}function v(y,L,_,b,U){if(y.visible===!1)return;if(y.layers.test(L.layers)&&(y.isMesh||y.isLine||y.isPoints)&&(y.castShadow||y.receiveShadow&&U===mr)&&(!y.frustumCulled||i.intersectsObject(y))){y.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,y.matrixWorld);const G=e.update(y),Y=y.material;if(Array.isArray(Y)){const k=G.groups;for(let K=0,z=k.length;K<z;K++){const te=k[K],re=Y[te.materialIndex];if(re&&re.visible){const ce=P(y,re,b,U);y.onBeforeShadow(n,y,L,_,G,ce,te),n.renderBufferDirect(_,null,G,ce,y,te),y.onAfterShadow(n,y,L,_,G,ce,te)}}}else if(Y.visible){const k=P(y,Y,b,U);y.onBeforeShadow(n,y,L,_,G,k,null),n.renderBufferDirect(_,null,G,k,y,null),y.onAfterShadow(n,y,L,_,G,k,null)}}const I=y.children;for(let G=0,Y=I.length;G<Y;G++)v(I[G],L,_,b,U)}function T(y){y.target.removeEventListener("dispose",T);for(const _ in c){const b=c[_],U=y.target.uuid;U in b&&(b[U].dispose(),delete b[U])}}}function J0(n,e){function t(){let N=!1;const oe=new at;let Q=null;const ue=new at(0,0,0,0);return{setMask:function(he){Q!==he&&!N&&(n.colorMask(he,he,he,he),Q=he)},setLocked:function(he){N=he},setClear:function(he,ie,ye,Se,lt){lt===!0&&(he*=Se,ie*=Se,ye*=Se),oe.set(he,ie,ye,Se),ue.equals(oe)===!1&&(n.clearColor(he,ie,ye,Se),ue.copy(oe))},reset:function(){N=!1,Q=null,ue.set(-1,0,0,0)}}}function i(){let N=!1,oe=!1,Q=null,ue=null,he=null;return{setReversed:function(ie){if(oe!==ie){const ye=e.get("EXT_clip_control");ie?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),oe=ie;const Se=he;he=null,this.setClear(Se)}},getReversed:function(){return oe},setTest:function(ie){ie?se(n.DEPTH_TEST):Ce(n.DEPTH_TEST)},setMask:function(ie){Q!==ie&&!N&&(n.depthMask(ie),Q=ie)},setFunc:function(ie){if(oe&&(ie=Af[ie]),ue!==ie){switch(ie){case Ba:n.depthFunc(n.NEVER);break;case za:n.depthFunc(n.ALWAYS);break;case ka:n.depthFunc(n.LESS);break;case $i:n.depthFunc(n.LEQUAL);break;case Ga:n.depthFunc(n.EQUAL);break;case Ha:n.depthFunc(n.GEQUAL);break;case Va:n.depthFunc(n.GREATER);break;case Wa:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ue=ie}},setLocked:function(ie){N=ie},setClear:function(ie){he!==ie&&(he=ie,oe&&(ie=1-ie),n.clearDepth(ie))},reset:function(){N=!1,Q=null,ue=null,he=null,oe=!1}}}function r(){let N=!1,oe=null,Q=null,ue=null,he=null,ie=null,ye=null,Se=null,lt=null;return{setTest:function(nt){N||(nt?se(n.STENCIL_TEST):Ce(n.STENCIL_TEST))},setMask:function(nt){oe!==nt&&!N&&(n.stencilMask(nt),oe=nt)},setFunc:function(nt,tn,nn){(Q!==nt||ue!==tn||he!==nn)&&(n.stencilFunc(nt,tn,nn),Q=nt,ue=tn,he=nn)},setOp:function(nt,tn,nn){(ie!==nt||ye!==tn||Se!==nn)&&(n.stencilOp(nt,tn,nn),ie=nt,ye=tn,Se=nn)},setLocked:function(nt){N=nt},setClear:function(nt){lt!==nt&&(n.clearStencil(nt),lt=nt)},reset:function(){N=!1,oe=null,Q=null,ue=null,he=null,ie=null,ye=null,Se=null,lt=null}}}const s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let d={},f={},u={},h=new WeakMap,x=[],S=null,m=!1,p=null,R=null,P=null,v=null,T=null,y=null,L=null,_=new Re(0,0,0),b=0,U=!1,E=null,I=null,G=null,Y=null,k=null;const K=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,te=0;const re=n.getParameter(n.VERSION);re.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(re)[1]),z=te>=1):re.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(re)[1]),z=te>=2);let ce=null,de={};const _e=n.getParameter(n.SCISSOR_BOX),ke=n.getParameter(n.VIEWPORT),Je=new at().fromArray(_e),Le=new at().fromArray(ke);function j(N,oe,Q,ue){const he=new Uint8Array(4),ie=n.createTexture();n.bindTexture(N,ie),n.texParameteri(N,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(N,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ye=0;ye<Q;ye++)N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY?n.texImage3D(oe,0,n.RGBA,1,1,ue,0,n.RGBA,n.UNSIGNED_BYTE,he):n.texImage2D(oe+ye,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,he);return ie}const le={};le[n.TEXTURE_2D]=j(n.TEXTURE_2D,n.TEXTURE_2D,1),le[n.TEXTURE_CUBE_MAP]=j(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[n.TEXTURE_2D_ARRAY]=j(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),le[n.TEXTURE_3D]=j(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),se(n.DEPTH_TEST),a.setFunc($i),ot(!1),dt(Ml),se(n.CULL_FACE),qe(wn);function se(N){d[N]!==!0&&(n.enable(N),d[N]=!0)}function Ce(N){d[N]!==!1&&(n.disable(N),d[N]=!1)}function De(N,oe){return u[N]!==oe?(n.bindFramebuffer(N,oe),u[N]=oe,N===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=oe),N===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=oe),!0):!1}function we(N,oe){let Q=x,ue=!1;if(N){Q=h.get(oe),Q===void 0&&(Q=[],h.set(oe,Q));const he=N.textures;if(Q.length!==he.length||Q[0]!==n.COLOR_ATTACHMENT0){for(let ie=0,ye=he.length;ie<ye;ie++)Q[ie]=n.COLOR_ATTACHMENT0+ie;Q.length=he.length,ue=!0}}else Q[0]!==n.BACK&&(Q[0]=n.BACK,ue=!0);ue&&n.drawBuffers(Q)}function st(N){return S!==N?(n.useProgram(N),S=N,!0):!1}const ze={[fi]:n.FUNC_ADD,[Yd]:n.FUNC_SUBTRACT,[$d]:n.FUNC_REVERSE_SUBTRACT};ze[Kd]=n.MIN,ze[Zd]=n.MAX;const Ke={[Jd]:n.ZERO,[Qd]:n.ONE,[jd]:n.SRC_COLOR,[Fa]:n.SRC_ALPHA,[af]:n.SRC_ALPHA_SATURATE,[rf]:n.DST_COLOR,[tf]:n.DST_ALPHA,[ef]:n.ONE_MINUS_SRC_COLOR,[Oa]:n.ONE_MINUS_SRC_ALPHA,[sf]:n.ONE_MINUS_DST_COLOR,[nf]:n.ONE_MINUS_DST_ALPHA,[of]:n.CONSTANT_COLOR,[lf]:n.ONE_MINUS_CONSTANT_COLOR,[cf]:n.CONSTANT_ALPHA,[uf]:n.ONE_MINUS_CONSTANT_ALPHA};function qe(N,oe,Q,ue,he,ie,ye,Se,lt,nt){if(N===wn){m===!0&&(Ce(n.BLEND),m=!1);return}if(m===!1&&(se(n.BLEND),m=!0),N!==qd){if(N!==p||nt!==U){if((R!==fi||T!==fi)&&(n.blendEquation(n.FUNC_ADD),R=fi,T=fi),nt)switch(N){case Xi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ei:n.blendFunc(n.ONE,n.ONE);break;case Sl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case bl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Xe("WebGLState: Invalid blending: ",N);break}else switch(N){case Xi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ei:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Sl:Xe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case bl:Xe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xe("WebGLState: Invalid blending: ",N);break}P=null,v=null,y=null,L=null,_.set(0,0,0),b=0,p=N,U=nt}return}he=he||oe,ie=ie||Q,ye=ye||ue,(oe!==R||he!==T)&&(n.blendEquationSeparate(ze[oe],ze[he]),R=oe,T=he),(Q!==P||ue!==v||ie!==y||ye!==L)&&(n.blendFuncSeparate(Ke[Q],Ke[ue],Ke[ie],Ke[ye]),P=Q,v=ue,y=ie,L=ye),(Se.equals(_)===!1||lt!==b)&&(n.blendColor(Se.r,Se.g,Se.b,lt),_.copy(Se),b=lt),p=N,U=!1}function He(N,oe){N.side===Ht?Ce(n.CULL_FACE):se(n.CULL_FACE);let Q=N.side===Nt;oe&&(Q=!Q),ot(Q),N.blending===Xi&&N.transparent===!1?qe(wn):qe(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),s.setMask(N.colorWrite);const ue=N.stencilWrite;o.setTest(ue),ue&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),vt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?se(n.SAMPLE_ALPHA_TO_COVERAGE):Ce(n.SAMPLE_ALPHA_TO_COVERAGE)}function ot(N){E!==N&&(N?n.frontFace(n.CW):n.frontFace(n.CCW),E=N)}function dt(N){N!==Vd?(se(n.CULL_FACE),N!==I&&(N===Ml?n.cullFace(n.BACK):N===Wd?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ce(n.CULL_FACE),I=N}function mt(N){N!==G&&(z&&n.lineWidth(N),G=N)}function vt(N,oe,Q){N?(se(n.POLYGON_OFFSET_FILL),(Y!==oe||k!==Q)&&(Y=oe,k=Q,a.getReversed()&&(oe=-oe),n.polygonOffset(oe,Q))):Ce(n.POLYGON_OFFSET_FILL)}function tt(N){N?se(n.SCISSOR_TEST):Ce(n.SCISSOR_TEST)}function Ue(N){N===void 0&&(N=n.TEXTURE0+K-1),ce!==N&&(n.activeTexture(N),ce=N)}function F(N,oe,Q){Q===void 0&&(ce===null?Q=n.TEXTURE0+K-1:Q=ce);let ue=de[Q];ue===void 0&&(ue={type:void 0,texture:void 0},de[Q]=ue),(ue.type!==N||ue.texture!==oe)&&(ce!==Q&&(n.activeTexture(Q),ce=Q),n.bindTexture(N,oe||le[N]),ue.type=N,ue.texture=oe)}function Ct(){const N=de[ce];N!==void 0&&N.type!==void 0&&(n.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Ye(){try{n.compressedTexImage2D(...arguments)}catch(N){Xe("WebGLState:",N)}}function A(){try{n.compressedTexImage3D(...arguments)}catch(N){Xe("WebGLState:",N)}}function g(){try{n.texSubImage2D(...arguments)}catch(N){Xe("WebGLState:",N)}}function H(){try{n.texSubImage3D(...arguments)}catch(N){Xe("WebGLState:",N)}}function V(){try{n.compressedTexSubImage2D(...arguments)}catch(N){Xe("WebGLState:",N)}}function Z(){try{n.compressedTexSubImage3D(...arguments)}catch(N){Xe("WebGLState:",N)}}function ae(){try{n.texStorage2D(...arguments)}catch(N){Xe("WebGLState:",N)}}function w(){try{n.texStorage3D(...arguments)}catch(N){Xe("WebGLState:",N)}}function C(){try{n.texImage2D(...arguments)}catch(N){Xe("WebGLState:",N)}}function D(){try{n.texImage3D(...arguments)}catch(N){Xe("WebGLState:",N)}}function W(N){return f[N]!==void 0?f[N]:n.getParameter(N)}function ne(N,oe){f[N]!==oe&&(n.pixelStorei(N,oe),f[N]=oe)}function J(N){Je.equals(N)===!1&&(n.scissor(N.x,N.y,N.z,N.w),Je.copy(N))}function ee(N){Le.equals(N)===!1&&(n.viewport(N.x,N.y,N.z,N.w),Le.copy(N))}function ge(N,oe){let Q=c.get(oe);Q===void 0&&(Q=new WeakMap,c.set(oe,Q));let ue=Q.get(N);ue===void 0&&(ue=n.getUniformBlockIndex(oe,N.name),Q.set(N,ue))}function ve(N,oe){const ue=c.get(oe).get(N);l.get(oe)!==ue&&(n.uniformBlockBinding(oe,ue,N.__bindingPointIndex),l.set(oe,ue))}function Ee(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),d={},f={},ce=null,de={},u={},h=new WeakMap,x=[],S=null,m=!1,p=null,R=null,P=null,v=null,T=null,y=null,L=null,_=new Re(0,0,0),b=0,U=!1,E=null,I=null,G=null,Y=null,k=null,Je.set(0,0,n.canvas.width,n.canvas.height),Le.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:se,disable:Ce,bindFramebuffer:De,drawBuffers:we,useProgram:st,setBlending:qe,setMaterial:He,setFlipSided:ot,setCullFace:dt,setLineWidth:mt,setPolygonOffset:vt,setScissorTest:tt,activeTexture:Ue,bindTexture:F,unbindTexture:Ct,compressedTexImage2D:Ye,compressedTexImage3D:A,texImage2D:C,texImage3D:D,pixelStorei:ne,getParameter:W,updateUBOMapping:ge,uniformBlockBinding:ve,texStorage2D:ae,texStorage3D:w,texSubImage2D:g,texSubImage3D:H,compressedTexSubImage2D:V,compressedTexSubImage3D:Z,scissor:J,viewport:ee,reset:Ee}}function Q0(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Fe,d=new WeakMap,f=new Set;let u;const h=new WeakMap;let x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(A,g){return x?new OffscreenCanvas(A,g):Ms("canvas")}function m(A,g,H){let V=1;const Z=Ye(A);if((Z.width>H||Z.height>H)&&(V=H/Math.max(Z.width,Z.height)),V<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const ae=Math.floor(V*Z.width),w=Math.floor(V*Z.height);u===void 0&&(u=S(ae,w));const C=g?S(ae,w):u;return C.width=ae,C.height=w,C.getContext("2d").drawImage(A,0,0,ae,w),Pe("WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+ae+"x"+w+")."),C}else return"data"in A&&Pe("WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),A;return A}function p(A){return A.generateMipmaps}function R(A){n.generateMipmap(A)}function P(A){return A.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?n.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(A,g,H,V,Z,ae=!1){if(A!==null){if(n[A]!==void 0)return n[A];Pe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let w;V&&(w=e.get("EXT_texture_norm16"),w||Pe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let C=g;if(g===n.RED&&(H===n.FLOAT&&(C=n.R32F),H===n.HALF_FLOAT&&(C=n.R16F),H===n.UNSIGNED_BYTE&&(C=n.R8),H===n.UNSIGNED_SHORT&&w&&(C=w.R16_EXT),H===n.SHORT&&w&&(C=w.R16_SNORM_EXT)),g===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(C=n.R8UI),H===n.UNSIGNED_SHORT&&(C=n.R16UI),H===n.UNSIGNED_INT&&(C=n.R32UI),H===n.BYTE&&(C=n.R8I),H===n.SHORT&&(C=n.R16I),H===n.INT&&(C=n.R32I)),g===n.RG&&(H===n.FLOAT&&(C=n.RG32F),H===n.HALF_FLOAT&&(C=n.RG16F),H===n.UNSIGNED_BYTE&&(C=n.RG8),H===n.UNSIGNED_SHORT&&w&&(C=w.RG16_EXT),H===n.SHORT&&w&&(C=w.RG16_SNORM_EXT)),g===n.RG_INTEGER&&(H===n.UNSIGNED_BYTE&&(C=n.RG8UI),H===n.UNSIGNED_SHORT&&(C=n.RG16UI),H===n.UNSIGNED_INT&&(C=n.RG32UI),H===n.BYTE&&(C=n.RG8I),H===n.SHORT&&(C=n.RG16I),H===n.INT&&(C=n.RG32I)),g===n.RGB_INTEGER&&(H===n.UNSIGNED_BYTE&&(C=n.RGB8UI),H===n.UNSIGNED_SHORT&&(C=n.RGB16UI),H===n.UNSIGNED_INT&&(C=n.RGB32UI),H===n.BYTE&&(C=n.RGB8I),H===n.SHORT&&(C=n.RGB16I),H===n.INT&&(C=n.RGB32I)),g===n.RGBA_INTEGER&&(H===n.UNSIGNED_BYTE&&(C=n.RGBA8UI),H===n.UNSIGNED_SHORT&&(C=n.RGBA16UI),H===n.UNSIGNED_INT&&(C=n.RGBA32UI),H===n.BYTE&&(C=n.RGBA8I),H===n.SHORT&&(C=n.RGBA16I),H===n.INT&&(C=n.RGBA32I)),g===n.RGB&&(H===n.UNSIGNED_SHORT&&w&&(C=w.RGB16_EXT),H===n.SHORT&&w&&(C=w.RGB16_SNORM_EXT),H===n.UNSIGNED_INT_5_9_9_9_REV&&(C=n.RGB9_E5),H===n.UNSIGNED_INT_10F_11F_11F_REV&&(C=n.R11F_G11F_B10F)),g===n.RGBA){const D=ae?vs:Ve.getTransfer(Z);H===n.FLOAT&&(C=n.RGBA32F),H===n.HALF_FLOAT&&(C=n.RGBA16F),H===n.UNSIGNED_BYTE&&(C=D===Ze?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT&&w&&(C=w.RGBA16_EXT),H===n.SHORT&&w&&(C=w.RGBA16_SNORM_EXT),H===n.UNSIGNED_SHORT_4_4_4_4&&(C=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(C=n.RGB5_A1)}return(C===n.R16F||C===n.R32F||C===n.RG16F||C===n.RG32F||C===n.RGBA16F||C===n.RGBA32F)&&e.get("EXT_color_buffer_float"),C}function T(A,g){let H;return A?g===null||g===gn||g===Sr?H=n.DEPTH24_STENCIL8:g===cn?H=n.DEPTH32F_STENCIL8:g===Mr&&(H=n.DEPTH24_STENCIL8,Pe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===gn||g===Sr?H=n.DEPTH_COMPONENT24:g===cn?H=n.DEPTH_COMPONENT32F:g===Mr&&(H=n.DEPTH_COMPONENT16),H}function y(A,g){return p(A)===!0||A.isFramebufferTexture&&A.minFilter!==wt&&A.minFilter!==yt?Math.log2(Math.max(g.width,g.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?g.mipmaps.length:1}function L(A){const g=A.target;g.removeEventListener("dispose",L),b(g),g.isVideoTexture&&d.delete(g),g.isHTMLTexture&&f.delete(g)}function _(A){const g=A.target;g.removeEventListener("dispose",_),E(g)}function b(A){const g=i.get(A);if(g.__webglInit===void 0)return;const H=A.source,V=h.get(H);if(V){const Z=V[g.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&U(A),Object.keys(V).length===0&&h.delete(H)}i.remove(A)}function U(A){const g=i.get(A);n.deleteTexture(g.__webglTexture);const H=A.source,V=h.get(H);delete V[g.__cacheKey],a.memory.textures--}function E(A){const g=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(g.__webglFramebuffer[V]))for(let Z=0;Z<g.__webglFramebuffer[V].length;Z++)n.deleteFramebuffer(g.__webglFramebuffer[V][Z]);else n.deleteFramebuffer(g.__webglFramebuffer[V]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[V])}else{if(Array.isArray(g.__webglFramebuffer))for(let V=0;V<g.__webglFramebuffer.length;V++)n.deleteFramebuffer(g.__webglFramebuffer[V]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let V=0;V<g.__webglColorRenderbuffer.length;V++)g.__webglColorRenderbuffer[V]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[V]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const H=A.textures;for(let V=0,Z=H.length;V<Z;V++){const ae=i.get(H[V]);ae.__webglTexture&&(n.deleteTexture(ae.__webglTexture),a.memory.textures--),i.remove(H[V])}i.remove(A)}let I=0;function G(){I=0}function Y(){return I}function k(A){I=A}function K(){const A=I;return A>=r.maxTextures&&Pe("WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+r.maxTextures),I+=1,A}function z(A){const g=[];return g.push(A.wrapS),g.push(A.wrapT),g.push(A.wrapR||0),g.push(A.magFilter),g.push(A.minFilter),g.push(A.anisotropy),g.push(A.internalFormat),g.push(A.format),g.push(A.type),g.push(A.generateMipmaps),g.push(A.premultiplyAlpha),g.push(A.flipY),g.push(A.unpackAlignment),g.push(A.colorSpace),g.join()}function te(A,g){const H=i.get(A);if(A.isVideoTexture&&F(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&H.__version!==A.version){const V=A.image;if(V===null)Pe("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)Pe("WebGLRenderer: Texture marked for update but image is incomplete");else{Ce(H,A,g);return}}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+g)}function re(A,g){const H=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){Ce(H,A,g);return}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+g)}function ce(A,g){const H=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){Ce(H,A,g);return}t.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+g)}function de(A,g){const H=i.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&H.__version!==A.version){De(H,A,g);return}t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+g)}const _e={[Xa]:n.REPEAT,[jt]:n.CLAMP_TO_EDGE,[qa]:n.MIRRORED_REPEAT},ke={[wt]:n.NEAREST,[hf]:n.NEAREST_MIPMAP_NEAREST,[Ir]:n.NEAREST_MIPMAP_LINEAR,[yt]:n.LINEAR,[Hs]:n.LINEAR_MIPMAP_NEAREST,[Tn]:n.LINEAR_MIPMAP_LINEAR},Je={[gf]:n.NEVER,[Sf]:n.ALWAYS,[_f]:n.LESS,[$o]:n.LEQUAL,[xf]:n.EQUAL,[Ko]:n.GEQUAL,[vf]:n.GREATER,[Mf]:n.NOTEQUAL};function Le(A,g){if(g.type===cn&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===yt||g.magFilter===Hs||g.magFilter===Ir||g.magFilter===Tn||g.minFilter===yt||g.minFilter===Hs||g.minFilter===Ir||g.minFilter===Tn)&&Pe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(A,n.TEXTURE_WRAP_S,_e[g.wrapS]),n.texParameteri(A,n.TEXTURE_WRAP_T,_e[g.wrapT]),(A===n.TEXTURE_3D||A===n.TEXTURE_2D_ARRAY)&&n.texParameteri(A,n.TEXTURE_WRAP_R,_e[g.wrapR]),n.texParameteri(A,n.TEXTURE_MAG_FILTER,ke[g.magFilter]),n.texParameteri(A,n.TEXTURE_MIN_FILTER,ke[g.minFilter]),g.compareFunction&&(n.texParameteri(A,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(A,n.TEXTURE_COMPARE_FUNC,Je[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===wt||g.minFilter!==Ir&&g.minFilter!==Tn||g.type===cn&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){const H=e.get("EXT_texture_filter_anisotropic");n.texParameterf(A,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function j(A,g){let H=!1;A.__webglInit===void 0&&(A.__webglInit=!0,g.addEventListener("dispose",L));const V=g.source;let Z=h.get(V);Z===void 0&&(Z={},h.set(V,Z));const ae=z(g);if(ae!==A.__cacheKey){Z[ae]===void 0&&(Z[ae]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,H=!0),Z[ae].usedTimes++;const w=Z[A.__cacheKey];w!==void 0&&(Z[A.__cacheKey].usedTimes--,w.usedTimes===0&&U(g)),A.__cacheKey=ae,A.__webglTexture=Z[ae].texture}return H}function le(A,g,H){return Math.floor(Math.floor(A/H)/g)}function se(A,g,H,V){const ae=A.updateRanges;if(ae.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,H,V,g.data);else{ae.sort((ne,J)=>ne.start-J.start);let w=0;for(let ne=1;ne<ae.length;ne++){const J=ae[w],ee=ae[ne],ge=J.start+J.count,ve=le(ee.start,g.width,4),Ee=le(J.start,g.width,4);ee.start<=ge+1&&ve===Ee&&le(ee.start+ee.count-1,g.width,4)===ve?J.count=Math.max(J.count,ee.start+ee.count-J.start):(++w,ae[w]=ee)}ae.length=w+1;const C=t.getParameter(n.UNPACK_ROW_LENGTH),D=t.getParameter(n.UNPACK_SKIP_PIXELS),W=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let ne=0,J=ae.length;ne<J;ne++){const ee=ae[ne],ge=Math.floor(ee.start/4),ve=Math.ceil(ee.count/4),Ee=ge%g.width,N=Math.floor(ge/g.width),oe=ve,Q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Ee),t.pixelStorei(n.UNPACK_SKIP_ROWS,N),t.texSubImage2D(n.TEXTURE_2D,0,Ee,N,oe,Q,H,V,g.data)}A.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,C),t.pixelStorei(n.UNPACK_SKIP_PIXELS,D),t.pixelStorei(n.UNPACK_SKIP_ROWS,W)}}function Ce(A,g,H){let V=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(V=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(V=n.TEXTURE_3D);const Z=j(A,g),ae=g.source;t.bindTexture(V,A.__webglTexture,n.TEXTURE0+H);const w=i.get(ae);if(ae.version!==w.__version||Z===!0){if(t.activeTexture(n.TEXTURE0+H),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const Q=Ve.getPrimaries(Ve.workingColorSpace),ue=g.colorSpace===Yn?null:Ve.getPrimaries(g.colorSpace),he=g.colorSpace===Yn||Q===ue?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment);let D=m(g.image,!1,r.maxTextureSize);D=Ct(g,D);const W=s.convert(g.format,g.colorSpace),ne=s.convert(g.type);let J=v(g.internalFormat,W,ne,g.normalized,g.colorSpace,g.isVideoTexture);Le(V,g);let ee;const ge=g.mipmaps,ve=g.isVideoTexture!==!0,Ee=w.__version===void 0||Z===!0,N=ae.dataReady,oe=y(g,D);if(g.isDepthTexture)J=T(g.format===gi,g.type),Ee&&(ve?t.texStorage2D(n.TEXTURE_2D,1,J,D.width,D.height):t.texImage2D(n.TEXTURE_2D,0,J,D.width,D.height,0,W,ne,null));else if(g.isDataTexture)if(ge.length>0){ve&&Ee&&t.texStorage2D(n.TEXTURE_2D,oe,J,ge[0].width,ge[0].height);for(let Q=0,ue=ge.length;Q<ue;Q++)ee=ge[Q],ve?N&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ee.width,ee.height,W,ne,ee.data):t.texImage2D(n.TEXTURE_2D,Q,J,ee.width,ee.height,0,W,ne,ee.data);g.generateMipmaps=!1}else ve?(Ee&&t.texStorage2D(n.TEXTURE_2D,oe,J,D.width,D.height),N&&se(g,D,W,ne)):t.texImage2D(n.TEXTURE_2D,0,J,D.width,D.height,0,W,ne,D.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){ve&&Ee&&t.texStorage3D(n.TEXTURE_2D_ARRAY,oe,J,ge[0].width,ge[0].height,D.depth);for(let Q=0,ue=ge.length;Q<ue;Q++)if(ee=ge[Q],g.format!==en)if(W!==null)if(ve){if(N)if(g.layerUpdates.size>0){const he=Ql(ee.width,ee.height,g.format,g.type);for(const ie of g.layerUpdates){const ye=ee.data.subarray(ie*he/ee.data.BYTES_PER_ELEMENT,(ie+1)*he/ee.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,ie,ee.width,ee.height,1,W,ye)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ee.width,ee.height,D.depth,W,ee.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Q,J,ee.width,ee.height,D.depth,0,ee.data,0,0);else Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ve?N&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ee.width,ee.height,D.depth,W,ne,ee.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Q,J,ee.width,ee.height,D.depth,0,W,ne,ee.data)}else{ve&&Ee&&t.texStorage2D(n.TEXTURE_2D,oe,J,ge[0].width,ge[0].height);for(let Q=0,ue=ge.length;Q<ue;Q++)ee=ge[Q],g.format!==en?W!==null?ve?N&&t.compressedTexSubImage2D(n.TEXTURE_2D,Q,0,0,ee.width,ee.height,W,ee.data):t.compressedTexImage2D(n.TEXTURE_2D,Q,J,ee.width,ee.height,0,ee.data):Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ve?N&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ee.width,ee.height,W,ne,ee.data):t.texImage2D(n.TEXTURE_2D,Q,J,ee.width,ee.height,0,W,ne,ee.data)}else if(g.isDataArrayTexture)if(ve){if(Ee&&t.texStorage3D(n.TEXTURE_2D_ARRAY,oe,J,D.width,D.height,D.depth),N)if(g.layerUpdates.size>0){const Q=Ql(D.width,D.height,g.format,g.type);for(const ue of g.layerUpdates){const he=D.data.subarray(ue*Q/D.data.BYTES_PER_ELEMENT,(ue+1)*Q/D.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ue,D.width,D.height,1,W,ne,he)}g.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,D.width,D.height,D.depth,W,ne,D.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,J,D.width,D.height,D.depth,0,W,ne,D.data);else if(g.isData3DTexture)ve?(Ee&&t.texStorage3D(n.TEXTURE_3D,oe,J,D.width,D.height,D.depth),N&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,D.width,D.height,D.depth,W,ne,D.data)):t.texImage3D(n.TEXTURE_3D,0,J,D.width,D.height,D.depth,0,W,ne,D.data);else if(g.isFramebufferTexture){if(Ee)if(ve)t.texStorage2D(n.TEXTURE_2D,oe,J,D.width,D.height);else{let Q=D.width,ue=D.height;for(let he=0;he<oe;he++)t.texImage2D(n.TEXTURE_2D,he,J,Q,ue,0,W,ne,null),Q>>=1,ue>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in n){const Q=n.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),D.parentNode!==Q){Q.appendChild(D),f.add(g),Q.onpaint=ue=>{const he=ue.changedElements;for(const ie of f)he.includes(ie.image)&&(ie.needsUpdate=!0)},Q.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,D);else{const he=n.RGBA,ie=n.RGBA,ye=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,he,ie,ye,D)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(ge.length>0){if(ve&&Ee){const Q=Ye(ge[0]);t.texStorage2D(n.TEXTURE_2D,oe,J,Q.width,Q.height)}for(let Q=0,ue=ge.length;Q<ue;Q++)ee=ge[Q],ve?N&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,W,ne,ee):t.texImage2D(n.TEXTURE_2D,Q,J,W,ne,ee);g.generateMipmaps=!1}else if(ve){if(Ee){const Q=Ye(D);t.texStorage2D(n.TEXTURE_2D,oe,J,Q.width,Q.height)}N&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,W,ne,D)}else t.texImage2D(n.TEXTURE_2D,0,J,W,ne,D);p(g)&&R(V),w.__version=ae.version,g.onUpdate&&g.onUpdate(g)}A.__version=g.version}function De(A,g,H){if(g.image.length!==6)return;const V=j(A,g),Z=g.source;t.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture,n.TEXTURE0+H);const ae=i.get(Z);if(Z.version!==ae.__version||V===!0){t.activeTexture(n.TEXTURE0+H);const w=Ve.getPrimaries(Ve.workingColorSpace),C=g.colorSpace===Yn?null:Ve.getPrimaries(g.colorSpace),D=g.colorSpace===Yn||w===C?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,D);const W=g.isCompressedTexture||g.image[0].isCompressedTexture,ne=g.image[0]&&g.image[0].isDataTexture,J=[];for(let ie=0;ie<6;ie++)!W&&!ne?J[ie]=m(g.image[ie],!0,r.maxCubemapSize):J[ie]=ne?g.image[ie].image:g.image[ie],J[ie]=Ct(g,J[ie]);const ee=J[0],ge=s.convert(g.format,g.colorSpace),ve=s.convert(g.type),Ee=v(g.internalFormat,ge,ve,g.normalized,g.colorSpace),N=g.isVideoTexture!==!0,oe=ae.__version===void 0||V===!0,Q=Z.dataReady;let ue=y(g,ee);Le(n.TEXTURE_CUBE_MAP,g);let he;if(W){N&&oe&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ue,Ee,ee.width,ee.height);for(let ie=0;ie<6;ie++){he=J[ie].mipmaps;for(let ye=0;ye<he.length;ye++){const Se=he[ye];g.format!==en?ge!==null?N?Q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye,0,0,Se.width,Se.height,ge,Se.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye,Ee,Se.width,Se.height,0,Se.data):Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye,0,0,Se.width,Se.height,ge,ve,Se.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye,Ee,Se.width,Se.height,0,ge,ve,Se.data)}}}else{if(he=g.mipmaps,N&&oe){he.length>0&&ue++;const ie=Ye(J[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ue,Ee,ie.width,ie.height)}for(let ie=0;ie<6;ie++)if(ne){N?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,J[ie].width,J[ie].height,ge,ve,J[ie].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,Ee,J[ie].width,J[ie].height,0,ge,ve,J[ie].data);for(let ye=0;ye<he.length;ye++){const lt=he[ye].image[ie].image;N?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye+1,0,0,lt.width,lt.height,ge,ve,lt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye+1,Ee,lt.width,lt.height,0,ge,ve,lt.data)}}else{N?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,ge,ve,J[ie]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,Ee,ge,ve,J[ie]);for(let ye=0;ye<he.length;ye++){const Se=he[ye];N?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye+1,0,0,ge,ve,Se.image[ie]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,ye+1,Ee,ge,ve,Se.image[ie])}}}p(g)&&R(n.TEXTURE_CUBE_MAP),ae.__version=Z.version,g.onUpdate&&g.onUpdate(g)}A.__version=g.version}function we(A,g,H,V,Z,ae){const w=s.convert(H.format,H.colorSpace),C=s.convert(H.type),D=v(H.internalFormat,w,C,H.normalized,H.colorSpace),W=i.get(g),ne=i.get(H);if(ne.__renderTarget=g,!W.__hasExternalTextures){const J=Math.max(1,g.width>>ae),ee=Math.max(1,g.height>>ae);Z===n.TEXTURE_3D||Z===n.TEXTURE_2D_ARRAY?t.texImage3D(Z,ae,D,J,ee,g.depth,0,w,C,null):t.texImage2D(Z,ae,D,J,ee,0,w,C,null)}t.bindFramebuffer(n.FRAMEBUFFER,A),Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,V,Z,ne.__webglTexture,0,tt(g)):(Z===n.TEXTURE_2D||Z>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,V,Z,ne.__webglTexture,ae),t.bindFramebuffer(n.FRAMEBUFFER,null)}function st(A,g,H){if(n.bindRenderbuffer(n.RENDERBUFFER,A),g.depthBuffer){const V=g.depthTexture,Z=V&&V.isDepthTexture?V.type:null,ae=T(g.stencilBuffer,Z),w=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ue(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,tt(g),ae,g.width,g.height):H?n.renderbufferStorageMultisample(n.RENDERBUFFER,tt(g),ae,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,ae,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,w,n.RENDERBUFFER,A)}else{const V=g.textures;for(let Z=0;Z<V.length;Z++){const ae=V[Z],w=s.convert(ae.format,ae.colorSpace),C=s.convert(ae.type),D=v(ae.internalFormat,w,C,ae.normalized,ae.colorSpace);Ue(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,tt(g),D,g.width,g.height):H?n.renderbufferStorageMultisample(n.RENDERBUFFER,tt(g),D,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,D,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ze(A,g,H){const V=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,A),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Z=i.get(g.depthTexture);if(Z.__renderTarget=g,(!Z.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),V){if(Z.__webglInit===void 0&&(Z.__webglInit=!0,g.depthTexture.addEventListener("dispose",L)),Z.__webglTexture===void 0){Z.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,Z.__webglTexture),Le(n.TEXTURE_CUBE_MAP,g.depthTexture);const W=s.convert(g.depthTexture.format),ne=s.convert(g.depthTexture.type);let J;g.depthTexture.format===Ln?J=n.DEPTH_COMPONENT24:g.depthTexture.format===gi&&(J=n.DEPTH24_STENCIL8);for(let ee=0;ee<6;ee++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,J,g.width,g.height,0,W,ne,null)}}else te(g.depthTexture,0);const ae=Z.__webglTexture,w=tt(g),C=V?n.TEXTURE_CUBE_MAP_POSITIVE_X+H:n.TEXTURE_2D,D=g.depthTexture.format===gi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===Ln)Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,D,C,ae,0,w):n.framebufferTexture2D(n.FRAMEBUFFER,D,C,ae,0);else if(g.depthTexture.format===gi)Ue(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,D,C,ae,0,w):n.framebufferTexture2D(n.FRAMEBUFFER,D,C,ae,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ke(A){const g=i.get(A),H=A.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==A.depthTexture){const V=A.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),V){const Z=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,V.removeEventListener("dispose",Z)};V.addEventListener("dispose",Z),g.__depthDisposeCallback=Z}g.__boundDepthTexture=V}if(A.depthTexture&&!g.__autoAllocateDepthBuffer)if(H)for(let V=0;V<6;V++)ze(g.__webglFramebuffer[V],A,V);else{const V=A.texture.mipmaps;V&&V.length>0?ze(g.__webglFramebuffer[0],A,0):ze(g.__webglFramebuffer,A,0)}else if(H){g.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[V]),g.__webglDepthbuffer[V]===void 0)g.__webglDepthbuffer[V]=n.createRenderbuffer(),st(g.__webglDepthbuffer[V],A,!1);else{const Z=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=g.__webglDepthbuffer[V];n.bindRenderbuffer(n.RENDERBUFFER,ae),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,ae)}}else{const V=A.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),st(g.__webglDepthbuffer,A,!1);else{const Z=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ae),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,ae)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function qe(A,g,H){const V=i.get(A);g!==void 0&&we(V.__webglFramebuffer,A,A.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&Ke(A)}function He(A){const g=A.texture,H=i.get(A),V=i.get(g);A.addEventListener("dispose",_);const Z=A.textures,ae=A.isWebGLCubeRenderTarget===!0,w=Z.length>1;if(w||(V.__webglTexture===void 0&&(V.__webglTexture=n.createTexture()),V.__version=g.version,a.memory.textures++),ae){H.__webglFramebuffer=[];for(let C=0;C<6;C++)if(g.mipmaps&&g.mipmaps.length>0){H.__webglFramebuffer[C]=[];for(let D=0;D<g.mipmaps.length;D++)H.__webglFramebuffer[C][D]=n.createFramebuffer()}else H.__webglFramebuffer[C]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){H.__webglFramebuffer=[];for(let C=0;C<g.mipmaps.length;C++)H.__webglFramebuffer[C]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(w)for(let C=0,D=Z.length;C<D;C++){const W=i.get(Z[C]);W.__webglTexture===void 0&&(W.__webglTexture=n.createTexture(),a.memory.textures++)}if(A.samples>0&&Ue(A)===!1){H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let C=0;C<Z.length;C++){const D=Z[C];H.__webglColorRenderbuffer[C]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[C]);const W=s.convert(D.format,D.colorSpace),ne=s.convert(D.type),J=v(D.internalFormat,W,ne,D.normalized,D.colorSpace,A.isXRRenderTarget===!0),ee=tt(A);n.renderbufferStorageMultisample(n.RENDERBUFFER,ee,J,A.width,A.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+C,n.RENDERBUFFER,H.__webglColorRenderbuffer[C])}n.bindRenderbuffer(n.RENDERBUFFER,null),A.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),st(H.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ae){t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture),Le(n.TEXTURE_CUBE_MAP,g);for(let C=0;C<6;C++)if(g.mipmaps&&g.mipmaps.length>0)for(let D=0;D<g.mipmaps.length;D++)we(H.__webglFramebuffer[C][D],A,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+C,D);else we(H.__webglFramebuffer[C],A,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+C,0);p(g)&&R(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(w){for(let C=0,D=Z.length;C<D;C++){const W=Z[C],ne=i.get(W);let J=n.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(J=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(J,ne.__webglTexture),Le(J,W),we(H.__webglFramebuffer,A,W,n.COLOR_ATTACHMENT0+C,J,0),p(W)&&R(J)}t.unbindTexture()}else{let C=n.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(C=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(C,V.__webglTexture),Le(C,g),g.mipmaps&&g.mipmaps.length>0)for(let D=0;D<g.mipmaps.length;D++)we(H.__webglFramebuffer[D],A,g,n.COLOR_ATTACHMENT0,C,D);else we(H.__webglFramebuffer,A,g,n.COLOR_ATTACHMENT0,C,0);p(g)&&R(C),t.unbindTexture()}A.depthBuffer&&Ke(A)}function ot(A){const g=A.textures;for(let H=0,V=g.length;H<V;H++){const Z=g[H];if(p(Z)){const ae=P(A),w=i.get(Z).__webglTexture;t.bindTexture(ae,w),R(ae),t.unbindTexture()}}}const dt=[],mt=[];function vt(A){if(A.samples>0){if(Ue(A)===!1){const g=A.textures,H=A.width,V=A.height;let Z=n.COLOR_BUFFER_BIT;const ae=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,w=i.get(A),C=g.length>1;if(C)for(let W=0;W<g.length;W++)t.bindFramebuffer(n.FRAMEBUFFER,w.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,w.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,w.__webglMultisampledFramebuffer);const D=A.texture.mipmaps;D&&D.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglFramebuffer);for(let W=0;W<g.length;W++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Z|=n.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Z|=n.STENCIL_BUFFER_BIT)),C){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,w.__webglColorRenderbuffer[W]);const ne=i.get(g[W]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,H,V,0,0,H,V,Z,n.NEAREST),l===!0&&(dt.length=0,mt.length=0,dt.push(n.COLOR_ATTACHMENT0+W),A.depthBuffer&&A.resolveDepthBuffer===!1&&(dt.push(ae),mt.push(ae),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,mt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,dt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),C)for(let W=0;W<g.length;W++){t.bindFramebuffer(n.FRAMEBUFFER,w.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.RENDERBUFFER,w.__webglColorRenderbuffer[W]);const ne=i.get(g[W]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,w.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+W,n.TEXTURE_2D,ne,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){const g=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function tt(A){return Math.min(r.maxSamples,A.samples)}function Ue(A){const g=i.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function F(A){const g=a.render.frame;d.get(A)!==g&&(d.set(A,g),A.update())}function Ct(A,g){const H=A.colorSpace,V=A.format,Z=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||H!==xs&&H!==Yn&&(Ve.getTransfer(H)===Ze?(V!==en||Z!==Vt)&&Pe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xe("WebGLTextures: Unsupported texture color space:",H)),g}function Ye(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=K,this.resetTextureUnits=G,this.getTextureUnits=Y,this.setTextureUnits=k,this.setTexture2D=te,this.setTexture2DArray=re,this.setTexture3D=ce,this.setTextureCube=de,this.rebindTextures=qe,this.setupRenderTarget=He,this.updateRenderTargetMipmap=ot,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=Ke,this.setupFrameBufferTexture=we,this.useMultisampledRTT=Ue,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function j0(n,e){function t(i,r=Yn){let s;const a=Ve.getTransfer(r);if(i===Vt)return n.UNSIGNED_BYTE;if(i===Vo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Wo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===fu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===hu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===uu)return n.BYTE;if(i===du)return n.SHORT;if(i===Mr)return n.UNSIGNED_SHORT;if(i===Ho)return n.INT;if(i===gn)return n.UNSIGNED_INT;if(i===cn)return n.FLOAT;if(i===Pn)return n.HALF_FLOAT;if(i===pu)return n.ALPHA;if(i===mu)return n.RGB;if(i===en)return n.RGBA;if(i===Ln)return n.DEPTH_COMPONENT;if(i===gi)return n.DEPTH_STENCIL;if(i===gu)return n.RED;if(i===Xo)return n.RED_INTEGER;if(i===xi)return n.RG;if(i===qo)return n.RG_INTEGER;if(i===Yo)return n.RGBA_INTEGER;if(i===cs||i===us||i===ds||i===fs)if(a===Ze)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===cs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===us)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ds)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===fs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===cs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===us)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ds)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===fs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ya||i===$a||i===Ka||i===Za)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Ya)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===$a)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Ka)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Za)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ja||i===Qa||i===ja||i===eo||i===to||i===gs||i===no)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Ja||i===Qa)return a===Ze?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===ja)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===eo)return s.COMPRESSED_R11_EAC;if(i===to)return s.COMPRESSED_SIGNED_R11_EAC;if(i===gs)return s.COMPRESSED_RG11_EAC;if(i===no)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===io||i===ro||i===so||i===ao||i===oo||i===lo||i===co||i===uo||i===fo||i===ho||i===po||i===mo||i===go||i===_o)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===io)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ro)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===so)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ao)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===oo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===lo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===co)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===uo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===fo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ho)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===po)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===mo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===go)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===_o)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===xo||i===vo||i===Mo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===xo)return a===Ze?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===vo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Mo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===So||i===bo||i===_s||i===Eo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===So)return s.COMPRESSED_RED_RGTC1_EXT;if(i===bo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===_s)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Eo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Sr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const e_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,t_=`
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

}`;class n_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new yu(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new _n({vertexShader:e_,fragmentShader:t_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new _t(new Mi(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class i_ extends vi{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,f=null,u=null,h=null,x=null;const S=typeof XRWebGLBinding<"u",m=new n_,p={},R=t.getContextAttributes();let P=null,v=null;const T=[],y=[],L=new Fe;let _=null;const b=new Bt;b.viewport=new at;const U=new Bt;U.viewport=new at;const E=[b,U],I=new fh;let G=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let le=T[j];return le===void 0&&(le=new Zs,T[j]=le),le.getTargetRaySpace()},this.getControllerGrip=function(j){let le=T[j];return le===void 0&&(le=new Zs,T[j]=le),le.getGripSpace()},this.getHand=function(j){let le=T[j];return le===void 0&&(le=new Zs,T[j]=le),le.getHandSpace()};function k(j){const le=y.indexOf(j.inputSource);if(le===-1)return;const se=T[le];se!==void 0&&(se.update(j.inputSource,j.frame,c||a),se.dispatchEvent({type:j.type,data:j.inputSource}))}function K(){r.removeEventListener("select",k),r.removeEventListener("selectstart",k),r.removeEventListener("selectend",k),r.removeEventListener("squeeze",k),r.removeEventListener("squeezestart",k),r.removeEventListener("squeezeend",k),r.removeEventListener("end",K),r.removeEventListener("inputsourceschange",z);for(let j=0;j<T.length;j++){const le=y[j];le!==null&&(y[j]=null,T[j].disconnect(le))}G=null,Y=null,m.reset();for(const j in p)delete p[j];e.setRenderTarget(P),h=null,u=null,f=null,r=null,v=null,Le.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(L.width,L.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,i.isPresenting===!0&&Pe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,i.isPresenting===!0&&Pe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return u!==null?u:h},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function(j){if(r=j,r!==null){if(P=e.getRenderTarget(),r.addEventListener("select",k),r.addEventListener("selectstart",k),r.addEventListener("selectend",k),r.addEventListener("squeeze",k),r.addEventListener("squeezestart",k),r.addEventListener("squeezeend",k),r.addEventListener("end",K),r.addEventListener("inputsourceschange",z),R.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(L),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let se=null,Ce=null,De=null;R.depth&&(De=R.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,se=R.stencil?gi:Ln,Ce=R.stencil?Sr:gn);const we={colorFormat:t.RGBA8,depthFormat:De,scaleFactor:s};f=this.getBinding(),u=f.createProjectionLayer(we),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),v=new pn(u.textureWidth,u.textureHeight,{format:en,type:Vt,depthTexture:new Zi(u.textureWidth,u.textureHeight,Ce,void 0,void 0,void 0,void 0,void 0,void 0,se),stencilBuffer:R.stencil,colorSpace:e.outputColorSpace,samples:R.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const se={antialias:R.antialias,alpha:!0,depth:R.depth,stencil:R.stencil,framebufferScaleFactor:s};h=new XRWebGLLayer(r,t,se),r.updateRenderState({baseLayer:h}),e.setPixelRatio(1),e.setSize(h.framebufferWidth,h.framebufferHeight,!1),v=new pn(h.framebufferWidth,h.framebufferHeight,{format:en,type:Vt,colorSpace:e.outputColorSpace,stencilBuffer:R.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Le.setContext(r),Le.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function z(j){for(let le=0;le<j.removed.length;le++){const se=j.removed[le],Ce=y.indexOf(se);Ce>=0&&(y[Ce]=null,T[Ce].disconnect(se))}for(let le=0;le<j.added.length;le++){const se=j.added[le];let Ce=y.indexOf(se);if(Ce===-1){for(let we=0;we<T.length;we++)if(we>=y.length){y.push(se),Ce=we;break}else if(y[we]===null){y[we]=se,Ce=we;break}if(Ce===-1)break}const De=T[Ce];De&&De.connect(se)}}const te=new O,re=new O;function ce(j,le,se){te.setFromMatrixPosition(le.matrixWorld),re.setFromMatrixPosition(se.matrixWorld);const Ce=te.distanceTo(re),De=le.projectionMatrix.elements,we=se.projectionMatrix.elements,st=De[14]/(De[10]-1),ze=De[14]/(De[10]+1),Ke=(De[9]+1)/De[5],qe=(De[9]-1)/De[5],He=(De[8]-1)/De[0],ot=(we[8]+1)/we[0],dt=st*He,mt=st*ot,vt=Ce/(-He+ot),tt=vt*-He;if(le.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(tt),j.translateZ(vt),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),De[10]===-1)j.projectionMatrix.copy(le.projectionMatrix),j.projectionMatrixInverse.copy(le.projectionMatrixInverse);else{const Ue=st+vt,F=ze+vt,Ct=dt-tt,Ye=mt+(Ce-tt),A=Ke*ze/F*Ue,g=qe*ze/F*Ue;j.projectionMatrix.makePerspective(Ct,Ye,A,g,Ue,F),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function de(j,le){le===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(le.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(r===null)return;let le=j.near,se=j.far;m.texture!==null&&(m.depthNear>0&&(le=m.depthNear),m.depthFar>0&&(se=m.depthFar)),I.near=U.near=b.near=le,I.far=U.far=b.far=se,(G!==I.near||Y!==I.far)&&(r.updateRenderState({depthNear:I.near,depthFar:I.far}),G=I.near,Y=I.far),I.layers.mask=j.layers.mask|6,b.layers.mask=I.layers.mask&-5,U.layers.mask=I.layers.mask&-3;const Ce=j.parent,De=I.cameras;de(I,Ce);for(let we=0;we<De.length;we++)de(De[we],Ce);De.length===2?ce(I,b,U):I.projectionMatrix.copy(b.projectionMatrix),_e(j,I,Ce)};function _e(j,le,se){se===null?j.matrix.copy(le.matrixWorld):(j.matrix.copy(se.matrixWorld),j.matrix.invert(),j.matrix.multiply(le.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(le.projectionMatrix),j.projectionMatrixInverse.copy(le.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Ss*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return I},this.getFoveation=function(){if(!(u===null&&h===null))return l},this.setFoveation=function(j){l=j,u!==null&&(u.fixedFoveation=j),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=j)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(I)},this.getCameraTexture=function(j){return p[j]};let ke=null;function Je(j,le){if(d=le.getViewerPose(c||a),x=le,d!==null){const se=d.views;h!==null&&(e.setRenderTargetFramebuffer(v,h.framebuffer),e.setRenderTarget(v));let Ce=!1;se.length!==I.cameras.length&&(I.cameras.length=0,Ce=!0);for(let ze=0;ze<se.length;ze++){const Ke=se[ze];let qe=null;if(h!==null)qe=h.getViewport(Ke);else{const ot=f.getViewSubImage(u,Ke);qe=ot.viewport,ze===0&&(e.setRenderTargetTextures(v,ot.colorTexture,ot.depthStencilTexture),e.setRenderTarget(v))}let He=E[ze];He===void 0&&(He=new Bt,He.layers.enable(ze),He.viewport=new at,E[ze]=He),He.matrix.fromArray(Ke.transform.matrix),He.matrix.decompose(He.position,He.quaternion,He.scale),He.projectionMatrix.fromArray(Ke.projectionMatrix),He.projectionMatrixInverse.copy(He.projectionMatrix).invert(),He.viewport.set(qe.x,qe.y,qe.width,qe.height),ze===0&&(I.matrix.copy(He.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),Ce===!0&&I.cameras.push(He)}const De=r.enabledFeatures;if(De&&De.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){f=i.getBinding();const ze=f.getDepthInformation(se[0]);ze&&ze.isValid&&ze.texture&&m.init(ze,r.renderState)}if(De&&De.includes("camera-access")&&S){e.state.unbindTexture(),f=i.getBinding();for(let ze=0;ze<se.length;ze++){const Ke=se[ze].camera;if(Ke){let qe=p[Ke];qe||(qe=new yu,p[Ke]=qe);const He=f.getCameraImage(Ke);qe.sourceTexture=He}}}}for(let se=0;se<T.length;se++){const Ce=y[se],De=T[se];Ce!==null&&De!==void 0&&De.update(Ce,le,c||a)}ke&&ke(j,le),le.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:le}),x=null}const Le=new Pu;Le.setAnimationLoop(Je),this.setAnimationLoop=function(j){ke=j},this.dispose=function(){}}}const r_=new rt,Ou=new Ie;Ou.set(-1,0,0,0,1,0,0,0,1);function s_(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,Tu(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,R,P,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),d(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),u(m,p),p.isMeshPhysicalMaterial&&h(m,p,v)):p.isMeshMatcapMaterial?(s(m,p),x(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,R,P):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Nt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Nt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const R=e.get(p),P=R.envMap,v=R.envMapRotation;P&&(m.envMap.value=P,m.envMapRotation.value.setFromMatrix4(r_.makeRotationFromEuler(v)).transpose(),P.isCubeTexture&&P.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Ou),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,R,P){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*R,m.scale.value=P*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function d(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function h(m,p,R){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Nt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=R.texture,m.transmissionSamplerSize.value.set(R.width,R.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const R=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(R.matrixWorld),m.nearDistance.value=R.shadow.camera.near,m.farDistance.value=R.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function a_(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,T){const y=T.program;i.uniformBlockBinding(v,y)}function c(v,T){let y=r[v.id];y===void 0&&(m(v),y=d(v),r[v.id]=y,v.addEventListener("dispose",R));const L=T.program;i.updateUBOMapping(v,L);const _=e.render.frame;s[v.id]!==_&&(u(v),s[v.id]=_)}function d(v){const T=f();v.__bindingPointIndex=T;const y=n.createBuffer(),L=v.__size,_=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,L,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,y),y}function f(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Xe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){const T=r[v.id],y=v.uniforms,L=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let _=0,b=y.length;_<b;_++){const U=y[_];if(Array.isArray(U))for(let E=0,I=U.length;E<I;E++)h(U[E],_,E,L);else h(U,_,0,L)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function h(v,T,y,L){if(S(v,T,y,L)===!0){const _=v.__offset,b=v.value;if(Array.isArray(b)){let U=0;for(let E=0;E<b.length;E++){const I=b[E],G=p(I);x(I,v.__data,U),typeof I!="number"&&typeof I!="boolean"&&!I.isMatrix3&&!ArrayBuffer.isView(I)&&(U+=G.storage/Float32Array.BYTES_PER_ELEMENT)}}else x(b,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,_,v.__data)}}function x(v,T,y){typeof v=="number"||typeof v=="boolean"?T[0]=v:v.isMatrix3?(T[0]=v.elements[0],T[1]=v.elements[1],T[2]=v.elements[2],T[3]=0,T[4]=v.elements[3],T[5]=v.elements[4],T[6]=v.elements[5],T[7]=0,T[8]=v.elements[6],T[9]=v.elements[7],T[10]=v.elements[8],T[11]=0):ArrayBuffer.isView(v)?T.set(new v.constructor(v.buffer,v.byteOffset,T.length)):v.toArray(T,y)}function S(v,T,y,L){const _=v.value,b=T+"_"+y;if(L[b]===void 0)return typeof _=="number"||typeof _=="boolean"?L[b]=_:ArrayBuffer.isView(_)?L[b]=_.slice():L[b]=_.clone(),!0;{const U=L[b];if(typeof _=="number"||typeof _=="boolean"){if(U!==_)return L[b]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(U.equals(_)===!1)return U.copy(_),!0}}return!1}function m(v){const T=v.uniforms;let y=0;const L=16;for(let b=0,U=T.length;b<U;b++){const E=Array.isArray(T[b])?T[b]:[T[b]];for(let I=0,G=E.length;I<G;I++){const Y=E[I],k=Array.isArray(Y.value)?Y.value:[Y.value];for(let K=0,z=k.length;K<z;K++){const te=k[K],re=p(te),ce=y%L,de=ce%re.boundary,_e=ce+de;y+=de,_e!==0&&L-_e<re.storage&&(y+=L-_e),Y.__data=new Float32Array(re.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=y,y+=re.storage}}}const _=y%L;return _>0&&(y+=L-_),v.__size=y,v.__cache={},this}function p(v){const T={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(T.boundary=4,T.storage=4):v.isVector2?(T.boundary=8,T.storage=8):v.isVector3||v.isColor?(T.boundary=16,T.storage=12):v.isVector4?(T.boundary=16,T.storage=16):v.isMatrix3?(T.boundary=48,T.storage=48):v.isMatrix4?(T.boundary=64,T.storage=64):v.isTexture?Pe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(T.boundary=16,T.storage=v.byteLength):Pe("WebGLRenderer: Unsupported uniform value type.",v),T}function R(v){const T=v.target;T.removeEventListener("dispose",R);const y=a.indexOf(T.__bindingPointIndex);a.splice(y,1),n.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function P(){for(const v in r)n.deleteBuffer(r[v]);a=[],r={},s={}}return{bind:l,update:c,dispose:P}}const o_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let an=null;function l_(){return an===null&&(an=new Yf(o_,16,16,xi,Pn),an.name="DFG_LUT",an.minFilter=yt,an.magFilter=yt,an.wrapS=jt,an.wrapT=jt,an.generateMipmaps=!1,an.needsUpdate=!0),an}class c_{constructor(e={}){const{canvas:t=yf(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:h=Vt}=e;this.isWebGLRenderer=!0;let x;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=i.getContextAttributes().alpha}else x=a;const S=h,m=new Set([Yo,qo,Xo]),p=new Set([Vt,gn,Mr,Sr,Vo,Wo]),R=new Uint32Array(4),P=new Int32Array(4),v=new O;let T=null,y=null;const L=[],_=[];let b=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=hn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const U=this;let E=!1,I=null,G=null,Y=null,k=null;this._outputColorSpace=ut;let K=0,z=0,te=null,re=-1,ce=null;const de=new at,_e=new at;let ke=null;const Je=new Re(0);let Le=0,j=t.width,le=t.height,se=1,Ce=null,De=null;const we=new at(0,0,j,le),st=new at(0,0,j,le);let ze=!1;const Ke=new jo;let qe=!1,He=!1;const ot=new rt,dt=new O,mt=new at,vt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let tt=!1;function Ue(){return te===null?se:1}let F=i;function Ct(M,B){return t.getContext(M,B)}try{const M={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${ko}`),t.addEventListener("webglcontextlost",lt,!1),t.addEventListener("webglcontextrestored",nt,!1),t.addEventListener("webglcontextcreationerror",tn,!1),F===null){const B="webgl2";if(F=Ct(B,M),F===null)throw Ct(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw Xe("WebGLRenderer: "+M.message),M}let Ye,A,g,H,V,Z,ae,w,C,D,W,ne,J,ee,ge,ve,Ee,N,oe,Q,ue,he,ie;function ye(){Ye=new lg(F),Ye.init(),ue=new j0(F,Ye),A=new eg(F,Ye,e,ue),g=new J0(F,Ye),A.reversedDepthBuffer&&u&&g.buffers.depth.setReversed(!0),G=F.createFramebuffer(),Y=F.createFramebuffer(),k=F.createFramebuffer(),H=new dg(F),V=new O0,Z=new Q0(F,Ye,g,V,A,ue,H),ae=new og(U),w=new mh(F),he=new Qm(F,w),C=new cg(F,w,H,he),D=new hg(F,C,w,he,H),N=new fg(F,A,Z),ge=new tg(V),W=new F0(U,ae,Ye,A,he,ge),ne=new s_(U,V),J=new z0,ee=new X0(Ye),Ee=new Jm(U,ae,g,D,x,l),ve=new Z0(U,D,A),ie=new a_(F,H,A,g),oe=new jm(F,Ye,H),Q=new ug(F,Ye,H),H.programs=W.programs,U.capabilities=A,U.extensions=Ye,U.properties=V,U.renderLists=J,U.shadowMap=ve,U.state=g,U.info=H}ye(),S!==Vt&&(b=new mg(S,t.width,t.height,o,r,s));const Se=new i_(U,F);this.xr=Se,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const M=Ye.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Ye.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return se},this.setPixelRatio=function(M){M!==void 0&&(se=M,this.setSize(j,le,!1))},this.getSize=function(M){return M.set(j,le)},this.setSize=function(M,B,$=!0){if(Se.isPresenting){Pe("WebGLRenderer: Can't change size while VR device is presenting.");return}j=M,le=B,t.width=Math.floor(M*se),t.height=Math.floor(B*se),$===!0&&(t.style.width=M+"px",t.style.height=B+"px"),b!==null&&b.setSize(t.width,t.height),this.setViewport(0,0,M,B)},this.getDrawingBufferSize=function(M){return M.set(j*se,le*se).floor()},this.setDrawingBufferSize=function(M,B,$){j=M,le=B,se=$,t.width=Math.floor(M*$),t.height=Math.floor(B*$),this.setViewport(0,0,M,B)},this.setEffects=function(M){if(S===Vt){Xe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let B=0;B<M.length;B++)if(M[B].isOutputPass===!0){Pe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}b.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(de)},this.getViewport=function(M){return M.copy(we)},this.setViewport=function(M,B,$,X){M.isVector4?we.set(M.x,M.y,M.z,M.w):we.set(M,B,$,X),g.viewport(de.copy(we).multiplyScalar(se).round())},this.getScissor=function(M){return M.copy(st)},this.setScissor=function(M,B,$,X){M.isVector4?st.set(M.x,M.y,M.z,M.w):st.set(M,B,$,X),g.scissor(_e.copy(st).multiplyScalar(se).round())},this.getScissorTest=function(){return ze},this.setScissorTest=function(M){g.setScissorTest(ze=M)},this.setOpaqueSort=function(M){Ce=M},this.setTransparentSort=function(M){De=M},this.getClearColor=function(M){return M.copy(Ee.getClearColor())},this.setClearColor=function(){Ee.setClearColor(...arguments)},this.getClearAlpha=function(){return Ee.getClearAlpha()},this.setClearAlpha=function(){Ee.setClearAlpha(...arguments)},this.clear=function(M=!0,B=!0,$=!0){let X=0;if(M){let q=!1;if(te!==null){const me=te.texture.format;q=m.has(me)}if(q){const me=te.texture.type,Me=p.has(me),pe=Ee.getClearColor(),be=Ee.getClearAlpha(),Te=pe.r,Ne=pe.g,Be=pe.b;Me?(R[0]=Te,R[1]=Ne,R[2]=Be,R[3]=be,F.clearBufferuiv(F.COLOR,0,R)):(P[0]=Te,P[1]=Ne,P[2]=Be,P[3]=be,F.clearBufferiv(F.COLOR,0,P))}else X|=F.COLOR_BUFFER_BIT}B&&(X|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),$&&(X|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),X!==0&&F.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),I=M},this.dispose=function(){t.removeEventListener("webglcontextlost",lt,!1),t.removeEventListener("webglcontextrestored",nt,!1),t.removeEventListener("webglcontextcreationerror",tn,!1),Ee.dispose(),J.dispose(),ee.dispose(),V.dispose(),ae.dispose(),D.dispose(),he.dispose(),ie.dispose(),W.dispose(),Se.dispose(),Se.removeEventListener("sessionstart",ll),Se.removeEventListener("sessionend",cl),ni.stop()};function lt(M){M.preventDefault(),wl("WebGLRenderer: Context Lost."),E=!0}function nt(){wl("WebGLRenderer: Context Restored."),E=!1;const M=H.autoReset,B=ve.enabled,$=ve.autoUpdate,X=ve.needsUpdate,q=ve.type;ye(),H.autoReset=M,ve.enabled=B,ve.autoUpdate=$,ve.needsUpdate=X,ve.type=q}function tn(M){Xe("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function nn(M){const B=M.target;B.removeEventListener("dispose",nn),ju(B)}function ju(M){ed(M),V.remove(M)}function ed(M){const B=V.get(M).programs;B!==void 0&&(B.forEach(function($){W.releaseProgram($)}),M.isShaderMaterial&&W.releaseShaderCache(M))}this.renderBufferDirect=function(M,B,$,X,q,me){B===null&&(B=vt);const Me=q.isMesh&&q.matrixWorld.determinantAffine()<0,pe=id(M,B,$,X,q);g.setMaterial(X,Me);let be=$.index,Te=1;if(X.wireframe===!0){if(be=C.getWireframeAttribute($),be===void 0)return;Te=2}const Ne=$.drawRange,Be=$.attributes.position;let Ae=Ne.start*Te,Qe=(Ne.start+Ne.count)*Te;me!==null&&(Ae=Math.max(Ae,me.start*Te),Qe=Math.min(Qe,(me.start+me.count)*Te)),be!==null?(Ae=Math.max(Ae,0),Qe=Math.min(Qe,be.count)):Be!=null&&(Ae=Math.max(Ae,0),Qe=Math.min(Qe,Be.count));const ft=Qe-Ae;if(ft<0||ft===1/0)return;he.setup(q,X,pe,$,be);let ct,je=oe;if(be!==null&&(ct=w.get(be),je=Q,je.setIndex(ct)),q.isMesh)X.wireframe===!0?(g.setLineWidth(X.wireframeLinewidth*Ue()),je.setMode(F.LINES)):je.setMode(F.TRIANGLES);else if(q.isLine){let Pt=X.linewidth;Pt===void 0&&(Pt=1),g.setLineWidth(Pt*Ue()),q.isLineSegments?je.setMode(F.LINES):q.isLineLoop?je.setMode(F.LINE_LOOP):je.setMode(F.LINE_STRIP)}else q.isPoints?je.setMode(F.POINTS):q.isSprite&&je.setMode(F.TRIANGLES);if(q.isBatchedMesh)if(Ye.get("WEBGL_multi_draw"))je.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{const Pt=q._multiDrawStarts,xe=q._multiDrawCounts,zt=q._multiDrawCount,$e=be?w.get(be).bytesPerElement:1,Xt=V.get(X).currentProgram.getUniforms();for(let rn=0;rn<zt;rn++)Xt.setValue(F,"_gl_DrawID",rn),je.render(Pt[rn]/$e,xe[rn])}else if(q.isInstancedMesh)je.renderInstances(Ae,ft,q.count);else if($.isInstancedBufferGeometry){const Pt=$._maxInstanceCount!==void 0?$._maxInstanceCount:1/0,xe=Math.min($.instanceCount,Pt);je.renderInstances(Ae,ft,xe)}else je.render(Ae,ft)};function ol(M,B,$){M.transparent===!0&&M.side===Ht&&M.forceSinglePass===!1?(M.side=Nt,M.needsUpdate=!0,Lr(M,B,$),M.side=jn,M.needsUpdate=!0,Lr(M,B,$),M.side=Ht):Lr(M,B,$)}this.compile=function(M,B,$=null){$===null&&($=M),y=ee.get($),y.init(B),_.push(y),$.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(y.pushLight(q),q.castShadow&&y.pushShadow(q))}),M!==$&&M.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(y.pushLight(q),q.castShadow&&y.pushShadow(q))}),y.setupLights();const X=new Set;return M.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;const me=q.material;if(me)if(Array.isArray(me))for(let Me=0;Me<me.length;Me++){const pe=me[Me];ol(pe,$,q),X.add(pe)}else ol(me,$,q),X.add(me)}),y=_.pop(),X},this.compileAsync=function(M,B,$=null){const X=this.compile(M,B,$);return new Promise(q=>{function me(){if(X.forEach(function(Me){V.get(Me).currentProgram.isReady()&&X.delete(Me)}),X.size===0){q(M);return}setTimeout(me,10)}Ye.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let Fs=null;function td(M){Fs&&Fs(M)}function ll(){ni.stop()}function cl(){ni.start()}const ni=new Pu;ni.setAnimationLoop(td),typeof self<"u"&&ni.setContext(self),this.setAnimationLoop=function(M){Fs=M,Se.setAnimationLoop(M),M===null?ni.stop():ni.start()},Se.addEventListener("sessionstart",ll),Se.addEventListener("sessionend",cl),this.render=function(M,B){if(B!==void 0&&B.isCamera!==!0){Xe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;I!==null&&I.renderStart(M,B);const $=Se.enabled===!0&&Se.isPresenting===!0,X=b!==null&&(te===null||$)&&b.begin(U,te);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Se.enabled===!0&&Se.isPresenting===!0&&(b===null||b.isCompositing()===!1)&&(Se.cameraAutoUpdate===!0&&Se.updateCamera(B),B=Se.getCamera()),M.isScene===!0&&M.onBeforeRender(U,M,B,te),y=ee.get(M,_.length),y.init(B),y.state.textureUnits=Z.getTextureUnits(),_.push(y),ot.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),Ke.setFromProjectionMatrix(ot,un,B.reversedDepth),He=this.localClippingEnabled,qe=ge.init(this.clippingPlanes,He),T=J.get(M,L.length),T.init(),L.push(T),Se.enabled===!0&&Se.isPresenting===!0){const Me=U.xr.getDepthSensingMesh();Me!==null&&Os(Me,B,-1/0,U.sortObjects)}Os(M,B,0,U.sortObjects),T.finish(),U.sortObjects===!0&&T.sort(Ce,De,B.reversedDepth),tt=Se.enabled===!1||Se.isPresenting===!1||Se.hasDepthSensing()===!1,tt&&Ee.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),qe===!0&&ge.beginShadows();const q=y.state.shadowsArray;if(ve.render(q,M,B),qe===!0&&ge.endShadows(),(X&&b.hasRenderPass())===!1){const Me=T.opaque,pe=T.transmissive;if(y.setupLights(),B.isArrayCamera){const be=B.cameras;if(pe.length>0)for(let Te=0,Ne=be.length;Te<Ne;Te++){const Be=be[Te];dl(Me,pe,M,Be)}tt&&Ee.render(M);for(let Te=0,Ne=be.length;Te<Ne;Te++){const Be=be[Te];ul(T,M,Be,Be.viewport)}}else pe.length>0&&dl(Me,pe,M,B),tt&&Ee.render(M),ul(T,M,B)}te!==null&&z===0&&(Z.updateMultisampleRenderTarget(te),Z.updateRenderTargetMipmap(te)),X&&b.end(U),M.isScene===!0&&M.onAfterRender(U,M,B),he.resetDefaultState(),re=-1,ce=null,_.pop(),_.length>0?(y=_[_.length-1],Z.setTextureUnits(y.state.textureUnits),qe===!0&&ge.setGlobalState(U.clippingPlanes,y.state.camera)):y=null,L.pop(),L.length>0?T=L[L.length-1]:T=null,I!==null&&I.renderEnd()};function Os(M,B,$,X){if(M.visible===!1)return;if(M.layers.test(B.layers)){if(M.isGroup)$=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(B);else if(M.isLightProbeGrid)y.pushLightProbeGrid(M);else if(M.isLight)y.pushLight(M),M.castShadow&&y.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Ke.intersectsSprite(M)){X&&mt.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ot);const Me=D.update(M),pe=M.material;pe.visible&&T.push(M,Me,pe,$,mt.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Ke.intersectsObject(M))){const Me=D.update(M),pe=M.material;if(X&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),mt.copy(M.boundingSphere.center)):(Me.boundingSphere===null&&Me.computeBoundingSphere(),mt.copy(Me.boundingSphere.center)),mt.applyMatrix4(M.matrixWorld).applyMatrix4(ot)),Array.isArray(pe)){const be=Me.groups;for(let Te=0,Ne=be.length;Te<Ne;Te++){const Be=be[Te],Ae=pe[Be.materialIndex];Ae&&Ae.visible&&T.push(M,Me,Ae,$,mt.z,Be)}}else pe.visible&&T.push(M,Me,pe,$,mt.z,null)}}const me=M.children;for(let Me=0,pe=me.length;Me<pe;Me++)Os(me[Me],B,$,X)}function ul(M,B,$,X){const{opaque:q,transmissive:me,transparent:Me}=M;y.setupLightsView($),qe===!0&&ge.setGlobalState(U.clippingPlanes,$),X&&g.viewport(de.copy(X)),q.length>0&&Pr(q,B,$),me.length>0&&Pr(me,B,$),Me.length>0&&Pr(Me,B,$),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function dl(M,B,$,X){if(($.isScene===!0?$.overrideMaterial:null)!==null)return;if(y.state.transmissionRenderTarget[X.id]===void 0){const Ae=Ye.has("EXT_color_buffer_half_float")||Ye.has("EXT_color_buffer_float");y.state.transmissionRenderTarget[X.id]=new pn(1,1,{generateMipmaps:!0,type:Ae?Pn:Vt,minFilter:Tn,samples:Math.max(4,A.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ve.workingColorSpace})}const me=y.state.transmissionRenderTarget[X.id],Me=X.viewport||de;me.setSize(Me.z*U.transmissionResolutionScale,Me.w*U.transmissionResolutionScale);const pe=U.getRenderTarget(),be=U.getActiveCubeFace(),Te=U.getActiveMipmapLevel();U.setRenderTarget(me),U.getClearColor(Je),Le=U.getClearAlpha(),Le<1&&U.setClearColor(16777215,.5),U.clear(),tt&&Ee.render($);const Ne=U.toneMapping;U.toneMapping=hn;const Be=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),y.setupLightsView(X),qe===!0&&ge.setGlobalState(U.clippingPlanes,X),Pr(M,$,X),Z.updateMultisampleRenderTarget(me),Z.updateRenderTargetMipmap(me),Ye.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let Qe=0,ft=B.length;Qe<ft;Qe++){const ct=B[Qe],{object:je,geometry:Pt,material:xe,group:zt}=ct;if(xe.side===Ht&&je.layers.test(X.layers)){const $e=xe.side;xe.side=Nt,xe.needsUpdate=!0,fl(je,$,X,Pt,xe,zt),xe.side=$e,xe.needsUpdate=!0,Ae=!0}}Ae===!0&&(Z.updateMultisampleRenderTarget(me),Z.updateRenderTargetMipmap(me))}U.setRenderTarget(pe,be,Te),U.setClearColor(Je,Le),Be!==void 0&&(X.viewport=Be),U.toneMapping=Ne}function Pr(M,B,$){const X=B.isScene===!0?B.overrideMaterial:null;for(let q=0,me=M.length;q<me;q++){const Me=M[q],{object:pe,geometry:be,group:Te}=Me;let Ne=Me.material;Ne.allowOverride===!0&&X!==null&&(Ne=X),pe.layers.test($.layers)&&fl(pe,B,$,be,Ne,Te)}}function fl(M,B,$,X,q,me){M.onBeforeRender(U,B,$,X,q,me),M.modelViewMatrix.multiplyMatrices($.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),q.onBeforeRender(U,B,$,X,M,me),q.transparent===!0&&q.side===Ht&&q.forceSinglePass===!1?(q.side=Nt,q.needsUpdate=!0,U.renderBufferDirect($,B,X,q,M,me),q.side=jn,q.needsUpdate=!0,U.renderBufferDirect($,B,X,q,M,me),q.side=Ht):U.renderBufferDirect($,B,X,q,M,me),M.onAfterRender(U,B,$,X,q,me)}function Lr(M,B,$){B.isScene!==!0&&(B=vt);const X=V.get(M),q=y.state.lights,me=y.state.shadowsArray,Me=q.state.version,pe=W.getParameters(M,q.state,me,B,$,y.state.lightProbeGridArray),be=W.getProgramCacheKey(pe);let Te=X.programs;X.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?B.environment:null,X.fog=B.fog;const Ne=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;X.envMap=ae.get(M.envMap||X.environment,Ne),X.envMapRotation=X.environment!==null&&M.envMap===null?B.environmentRotation:M.envMapRotation,Te===void 0&&(M.addEventListener("dispose",nn),Te=new Map,X.programs=Te);let Be=Te.get(be);if(Be!==void 0){if(X.currentProgram===Be&&X.lightsStateVersion===Me)return pl(M,pe),Be}else pe.uniforms=W.getUniforms(M),I!==null&&M.isNodeMaterial&&I.build(M,$,pe),M.onBeforeCompile(pe,U),Be=W.acquireProgram(pe,be),Te.set(be,Be),X.uniforms=pe.uniforms;const Ae=X.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ae.clippingPlanes=ge.uniform),pl(M,pe),X.needsLights=sd(M),X.lightsStateVersion=Me,X.needsLights&&(Ae.ambientLightColor.value=q.state.ambient,Ae.lightProbe.value=q.state.probe,Ae.directionalLights.value=q.state.directional,Ae.directionalLightShadows.value=q.state.directionalShadow,Ae.spotLights.value=q.state.spot,Ae.spotLightShadows.value=q.state.spotShadow,Ae.rectAreaLights.value=q.state.rectArea,Ae.ltc_1.value=q.state.rectAreaLTC1,Ae.ltc_2.value=q.state.rectAreaLTC2,Ae.pointLights.value=q.state.point,Ae.pointLightShadows.value=q.state.pointShadow,Ae.hemisphereLights.value=q.state.hemi,Ae.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Ae.spotLightMatrix.value=q.state.spotLightMatrix,Ae.spotLightMap.value=q.state.spotLightMap,Ae.pointShadowMatrix.value=q.state.pointShadowMatrix),X.lightProbeGrid=y.state.lightProbeGridArray.length>0,X.currentProgram=Be,X.uniformsList=null,Be}function hl(M){if(M.uniformsList===null){const B=M.currentProgram.getUniforms();M.uniformsList=hs.seqWithValue(B.seq,M.uniforms)}return M.uniformsList}function pl(M,B){const $=V.get(M);$.outputColorSpace=B.outputColorSpace,$.batching=B.batching,$.batchingColor=B.batchingColor,$.instancing=B.instancing,$.instancingColor=B.instancingColor,$.instancingMorph=B.instancingMorph,$.skinning=B.skinning,$.morphTargets=B.morphTargets,$.morphNormals=B.morphNormals,$.morphColors=B.morphColors,$.morphTargetsCount=B.morphTargetsCount,$.numClippingPlanes=B.numClippingPlanes,$.numIntersection=B.numClipIntersection,$.vertexAlphas=B.vertexAlphas,$.vertexTangents=B.vertexTangents,$.toneMapping=B.toneMapping}function nd(M,B){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;v.setFromMatrixPosition(B.matrixWorld);for(let $=0,X=M.length;$<X;$++){const q=M[$];if(q.texture!==null&&q.boundingBox.containsPoint(v))return q}return null}function id(M,B,$,X,q){B.isScene!==!0&&(B=vt),Z.resetTextureUnits();const me=B.fog,Me=X.isMeshStandardMaterial||X.isMeshLambertMaterial||X.isMeshPhongMaterial?B.environment:null,pe=te===null?U.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:Ve.workingColorSpace,be=X.isMeshStandardMaterial||X.isMeshLambertMaterial&&!X.envMap||X.isMeshPhongMaterial&&!X.envMap,Te=ae.get(X.envMap||Me,be),Ne=X.vertexColors===!0&&!!$.attributes.color&&$.attributes.color.itemSize===4,Be=!!$.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Ae=!!$.morphAttributes.position,Qe=!!$.morphAttributes.normal,ft=!!$.morphAttributes.color;let ct=hn;X.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(ct=U.toneMapping);const je=$.morphAttributes.position||$.morphAttributes.normal||$.morphAttributes.color,Pt=je!==void 0?je.length:0,xe=V.get(X),zt=y.state.lights;if(qe===!0&&(He===!0||M!==ce)){const it=M===ce&&X.id===re;ge.setState(X,M,it)}let $e=!1;X.version===xe.__version?(xe.needsLights&&xe.lightsStateVersion!==zt.state.version||xe.outputColorSpace!==pe||q.isBatchedMesh&&xe.batching===!1||!q.isBatchedMesh&&xe.batching===!0||q.isBatchedMesh&&xe.batchingColor===!0&&q.colorTexture===null||q.isBatchedMesh&&xe.batchingColor===!1&&q.colorTexture!==null||q.isInstancedMesh&&xe.instancing===!1||!q.isInstancedMesh&&xe.instancing===!0||q.isSkinnedMesh&&xe.skinning===!1||!q.isSkinnedMesh&&xe.skinning===!0||q.isInstancedMesh&&xe.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&xe.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&xe.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&xe.instancingMorph===!1&&q.morphTexture!==null||xe.envMap!==Te||X.fog===!0&&xe.fog!==me||xe.numClippingPlanes!==void 0&&(xe.numClippingPlanes!==ge.numPlanes||xe.numIntersection!==ge.numIntersection)||xe.vertexAlphas!==Ne||xe.vertexTangents!==Be||xe.morphTargets!==Ae||xe.morphNormals!==Qe||xe.morphColors!==ft||xe.toneMapping!==ct||xe.morphTargetsCount!==Pt||!!xe.lightProbeGrid!=y.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,xe.__version=X.version);let Xt=xe.currentProgram;$e===!0&&(Xt=Lr(X,B,q),I&&X.isNodeMaterial&&I.onUpdateProgram(X,Xt,xe));let rn=!1,Un=!1,Si=!1;const et=Xt.getUniforms(),ht=xe.uniforms;if(g.useProgram(Xt.program)&&(rn=!0,Un=!0,Si=!0),X.id!==re&&(re=X.id,Un=!0),xe.needsLights){const it=nd(y.state.lightProbeGridArray,q);xe.lightProbeGrid!==it&&(xe.lightProbeGrid=it,Un=!0)}if(rn||ce!==M){g.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),et.setValue(F,"projectionMatrix",M.projectionMatrix),et.setValue(F,"viewMatrix",M.matrixWorldInverse);const Fn=et.map.cameraPosition;Fn!==void 0&&Fn.setValue(F,dt.setFromMatrixPosition(M.matrixWorld)),A.logarithmicDepthBuffer&&et.setValue(F,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&et.setValue(F,"isOrthographic",M.isOrthographicCamera===!0),ce!==M&&(ce=M,Un=!0,Si=!0)}if(xe.needsLights&&(zt.state.directionalShadowMap.length>0&&et.setValue(F,"directionalShadowMap",zt.state.directionalShadowMap,Z),zt.state.spotShadowMap.length>0&&et.setValue(F,"spotShadowMap",zt.state.spotShadowMap,Z),zt.state.pointShadowMap.length>0&&et.setValue(F,"pointShadowMap",zt.state.pointShadowMap,Z)),q.isSkinnedMesh){et.setOptional(F,q,"bindMatrix"),et.setOptional(F,q,"bindMatrixInverse");const it=q.skeleton;it&&(it.boneTexture===null&&it.computeBoneTexture(),et.setValue(F,"boneTexture",it.boneTexture,Z))}q.isBatchedMesh&&(et.setOptional(F,q,"batchingTexture"),et.setValue(F,"batchingTexture",q._matricesTexture,Z),et.setOptional(F,q,"batchingIdTexture"),et.setValue(F,"batchingIdTexture",q._indirectTexture,Z),et.setOptional(F,q,"batchingColorTexture"),q._colorsTexture!==null&&et.setValue(F,"batchingColorTexture",q._colorsTexture,Z));const Nn=$.morphAttributes;if((Nn.position!==void 0||Nn.normal!==void 0||Nn.color!==void 0)&&N.update(q,$,Xt),(Un||xe.receiveShadow!==q.receiveShadow)&&(xe.receiveShadow=q.receiveShadow,et.setValue(F,"receiveShadow",q.receiveShadow)),(X.isMeshStandardMaterial||X.isMeshLambertMaterial||X.isMeshPhongMaterial)&&X.envMap===null&&B.environment!==null&&(ht.envMapIntensity.value=B.environmentIntensity),ht.dfgLUT!==void 0&&(ht.dfgLUT.value=l_()),Un){if(et.setValue(F,"toneMappingExposure",U.toneMappingExposure),xe.needsLights&&rd(ht,Si),me&&X.fog===!0&&ne.refreshFogUniforms(ht,me),ne.refreshMaterialUniforms(ht,X,se,le,y.state.transmissionRenderTarget[M.id]),xe.needsLights&&xe.lightProbeGrid){const it=xe.lightProbeGrid;ht.probesSH.value=it.texture,ht.probesMin.value.copy(it.boundingBox.min),ht.probesMax.value.copy(it.boundingBox.max),ht.probesResolution.value.copy(it.resolution)}hs.upload(F,hl(xe),ht,Z)}if(X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(hs.upload(F,hl(xe),ht,Z),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&et.setValue(F,"center",q.center),et.setValue(F,"modelViewMatrix",q.modelViewMatrix),et.setValue(F,"normalMatrix",q.normalMatrix),et.setValue(F,"modelMatrix",q.matrixWorld),X.uniformsGroups!==void 0){const it=X.uniformsGroups;for(let Fn=0,bi=it.length;Fn<bi;Fn++){const ml=it[Fn];ie.update(ml,Xt),ie.bind(ml,Xt)}}return Xt}function rd(M,B){M.ambientLightColor.needsUpdate=B,M.lightProbe.needsUpdate=B,M.directionalLights.needsUpdate=B,M.directionalLightShadows.needsUpdate=B,M.pointLights.needsUpdate=B,M.pointLightShadows.needsUpdate=B,M.spotLights.needsUpdate=B,M.spotLightShadows.needsUpdate=B,M.rectAreaLights.needsUpdate=B,M.hemisphereLights.needsUpdate=B}function sd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return K},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return te},this.setRenderTargetTextures=function(M,B,$){const X=V.get(M);X.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,X.__autoAllocateDepthBuffer===!1&&(X.__useRenderToTexture=!1),V.get(M.texture).__webglTexture=B,V.get(M.depthTexture).__webglTexture=X.__autoAllocateDepthBuffer?void 0:$,X.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,B){const $=V.get(M);$.__webglFramebuffer=B,$.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(M,B=0,$=0){te=M,K=B,z=$;let X=null,q=!1,me=!1;if(M){const pe=V.get(M);if(pe.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(F.FRAMEBUFFER,pe.__webglFramebuffer),de.copy(M.viewport),_e.copy(M.scissor),ke=M.scissorTest,g.viewport(de),g.scissor(_e),g.setScissorTest(ke),re=-1;return}else if(pe.__webglFramebuffer===void 0)Z.setupRenderTarget(M);else if(pe.__hasExternalTextures)Z.rebindTextures(M,V.get(M.texture).__webglTexture,V.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Ne=M.depthTexture;if(pe.__boundDepthTexture!==Ne){if(Ne!==null&&V.has(Ne)&&(M.width!==Ne.image.width||M.height!==Ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Z.setupDepthRenderbuffer(M)}}const be=M.texture;(be.isData3DTexture||be.isDataArrayTexture||be.isCompressedArrayTexture)&&(me=!0);const Te=V.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Te[B])?X=Te[B][$]:X=Te[B],q=!0):M.samples>0&&Z.useMultisampledRTT(M)===!1?X=V.get(M).__webglMultisampledFramebuffer:Array.isArray(Te)?X=Te[$]:X=Te,de.copy(M.viewport),_e.copy(M.scissor),ke=M.scissorTest}else de.copy(we).multiplyScalar(se).floor(),_e.copy(st).multiplyScalar(se).floor(),ke=ze;if($!==0&&(X=G),g.bindFramebuffer(F.FRAMEBUFFER,X)&&g.drawBuffers(M,X),g.viewport(de),g.scissor(_e),g.setScissorTest(ke),q){const pe=V.get(M.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+B,pe.__webglTexture,$)}else if(me){const pe=B;for(let be=0;be<M.textures.length;be++){const Te=V.get(M.textures[be]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+be,Te.__webglTexture,$,pe)}}else if(M!==null&&$!==0){const pe=V.get(M.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,pe.__webglTexture,$)}re=-1},this.readRenderTargetPixels=function(M,B,$,X,q,me,Me,pe=0){if(!(M&&M.isWebGLRenderTarget)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let be=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Me!==void 0&&(be=be[Me]),be){g.bindFramebuffer(F.FRAMEBUFFER,be);try{const Te=M.textures[pe],Ne=Te.format,Be=Te.type;if(M.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+pe),!A.textureFormatReadable(Ne)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!A.textureTypeReadable(Be)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=M.width-X&&$>=0&&$<=M.height-q&&F.readPixels(B,$,X,q,ue.convert(Ne),ue.convert(Be),me)}finally{const Te=te!==null?V.get(te).__webglFramebuffer:null;g.bindFramebuffer(F.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(M,B,$,X,q,me,Me,pe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let be=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Me!==void 0&&(be=be[Me]),be)if(B>=0&&B<=M.width-X&&$>=0&&$<=M.height-q){g.bindFramebuffer(F.FRAMEBUFFER,be);const Te=M.textures[pe],Ne=Te.format,Be=Te.type;if(M.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+pe),!A.textureFormatReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!A.textureTypeReadable(Be))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ae=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,Ae),F.bufferData(F.PIXEL_PACK_BUFFER,me.byteLength,F.STREAM_READ),F.readPixels(B,$,X,q,ue.convert(Ne),ue.convert(Be),0);const Qe=te!==null?V.get(te).__webglFramebuffer:null;g.bindFramebuffer(F.FRAMEBUFFER,Qe);const ft=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await Tf(F,ft,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,Ae),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,me),F.deleteBuffer(Ae),F.deleteSync(ft),me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,B=null,$=0){const X=Math.pow(2,-$),q=Math.floor(M.image.width*X),me=Math.floor(M.image.height*X),Me=B!==null?B.x:0,pe=B!==null?B.y:0;Z.setTexture2D(M,0),F.copyTexSubImage2D(F.TEXTURE_2D,$,0,0,Me,pe,q,me),g.unbindTexture()},this.copyTextureToTexture=function(M,B,$=null,X=null,q=0,me=0){let Me,pe,be,Te,Ne,Be,Ae,Qe,ft;const ct=M.isCompressedTexture?M.mipmaps[me]:M.image;if($!==null)Me=$.max.x-$.min.x,pe=$.max.y-$.min.y,be=$.isBox3?$.max.z-$.min.z:1,Te=$.min.x,Ne=$.min.y,Be=$.isBox3?$.min.z:0;else{const ht=Math.pow(2,-q);Me=Math.floor(ct.width*ht),pe=Math.floor(ct.height*ht),M.isDataArrayTexture?be=ct.depth:M.isData3DTexture?be=Math.floor(ct.depth*ht):be=1,Te=0,Ne=0,Be=0}X!==null?(Ae=X.x,Qe=X.y,ft=X.z):(Ae=0,Qe=0,ft=0);const je=ue.convert(B.format),Pt=ue.convert(B.type);let xe;B.isData3DTexture?(Z.setTexture3D(B,0),xe=F.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(Z.setTexture2DArray(B,0),xe=F.TEXTURE_2D_ARRAY):(Z.setTexture2D(B,0),xe=F.TEXTURE_2D),g.activeTexture(F.TEXTURE0),g.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,B.flipY),g.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),g.pixelStorei(F.UNPACK_ALIGNMENT,B.unpackAlignment);const zt=g.getParameter(F.UNPACK_ROW_LENGTH),$e=g.getParameter(F.UNPACK_IMAGE_HEIGHT),Xt=g.getParameter(F.UNPACK_SKIP_PIXELS),rn=g.getParameter(F.UNPACK_SKIP_ROWS),Un=g.getParameter(F.UNPACK_SKIP_IMAGES);g.pixelStorei(F.UNPACK_ROW_LENGTH,ct.width),g.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ct.height),g.pixelStorei(F.UNPACK_SKIP_PIXELS,Te),g.pixelStorei(F.UNPACK_SKIP_ROWS,Ne),g.pixelStorei(F.UNPACK_SKIP_IMAGES,Be);const Si=M.isDataArrayTexture||M.isData3DTexture,et=B.isDataArrayTexture||B.isData3DTexture;if(M.isDepthTexture){const ht=V.get(M),Nn=V.get(B),it=V.get(ht.__renderTarget),Fn=V.get(Nn.__renderTarget);g.bindFramebuffer(F.READ_FRAMEBUFFER,it.__webglFramebuffer),g.bindFramebuffer(F.DRAW_FRAMEBUFFER,Fn.__webglFramebuffer);for(let bi=0;bi<be;bi++)Si&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,V.get(M).__webglTexture,q,Be+bi),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,V.get(B).__webglTexture,me,ft+bi)),F.blitFramebuffer(Te,Ne,Me,pe,Ae,Qe,Me,pe,F.DEPTH_BUFFER_BIT,F.NEAREST);g.bindFramebuffer(F.READ_FRAMEBUFFER,null),g.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(q!==0||M.isRenderTargetTexture||V.has(M)){const ht=V.get(M),Nn=V.get(B);g.bindFramebuffer(F.READ_FRAMEBUFFER,Y),g.bindFramebuffer(F.DRAW_FRAMEBUFFER,k);for(let it=0;it<be;it++)Si?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,ht.__webglTexture,q,Be+it):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,ht.__webglTexture,q),et?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Nn.__webglTexture,me,ft+it):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,Nn.__webglTexture,me),q!==0?F.blitFramebuffer(Te,Ne,Me,pe,Ae,Qe,Me,pe,F.COLOR_BUFFER_BIT,F.NEAREST):et?F.copyTexSubImage3D(xe,me,Ae,Qe,ft+it,Te,Ne,Me,pe):F.copyTexSubImage2D(xe,me,Ae,Qe,Te,Ne,Me,pe);g.bindFramebuffer(F.READ_FRAMEBUFFER,null),g.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else et?M.isDataTexture||M.isData3DTexture?F.texSubImage3D(xe,me,Ae,Qe,ft,Me,pe,be,je,Pt,ct.data):B.isCompressedArrayTexture?F.compressedTexSubImage3D(xe,me,Ae,Qe,ft,Me,pe,be,je,ct.data):F.texSubImage3D(xe,me,Ae,Qe,ft,Me,pe,be,je,Pt,ct):M.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,me,Ae,Qe,Me,pe,je,Pt,ct.data):M.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,me,Ae,Qe,ct.width,ct.height,je,ct.data):F.texSubImage2D(F.TEXTURE_2D,me,Ae,Qe,Me,pe,je,Pt,ct);g.pixelStorei(F.UNPACK_ROW_LENGTH,zt),g.pixelStorei(F.UNPACK_IMAGE_HEIGHT,$e),g.pixelStorei(F.UNPACK_SKIP_PIXELS,Xt),g.pixelStorei(F.UNPACK_SKIP_ROWS,rn),g.pixelStorei(F.UNPACK_SKIP_IMAGES,Un),me===0&&B.generateMipmaps&&F.generateMipmap(xe),g.unbindTexture()},this.initRenderTarget=function(M){V.get(M).__webglFramebuffer===void 0&&Z.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Z.setTextureCube(M,0):M.isData3DTexture?Z.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Z.setTexture2DArray(M,0):Z.setTexture2D(M,0),g.unbindTexture()},this.resetState=function(){K=0,z=0,te=null,g.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ve._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ve._getUnpackColorSpace()}}const u_={back:"/cards/standard/back.webp","blue-1":"/cards/standard/blue-1.webp","blue-10":"/cards/standard/blue-10.webp","blue-11":"/cards/standard/blue-11.webp","blue-12":"/cards/standard/blue-12.webp","blue-13":"/cards/standard/blue-13.webp","blue-2":"/cards/standard/blue-2.webp","blue-3":"/cards/standard/blue-3.webp","blue-4":"/cards/standard/blue-4.webp","blue-5":"/cards/standard/blue-5.webp","blue-6":"/cards/standard/blue-6.webp","blue-7":"/cards/standard/blue-7.webp","blue-8":"/cards/standard/blue-8.webp","blue-9":"/cards/standard/blue-9.webp","green-1":"/cards/standard/green-1.webp","green-10":"/cards/standard/green-10.webp","green-11":"/cards/standard/green-11.webp","green-12":"/cards/standard/green-12.webp","green-13":"/cards/standard/green-13.webp","green-2":"/cards/standard/green-2.webp","green-3":"/cards/standard/green-3.webp","green-4":"/cards/standard/green-4.webp","green-5":"/cards/standard/green-5.webp","green-6":"/cards/standard/green-6.webp","green-7":"/cards/standard/green-7.webp","green-8":"/cards/standard/green-8.webp","green-9":"/cards/standard/green-9.webp","jester-1":"/cards/standard/jester-1.webp","jester-2":"/cards/standard/jester-2.webp","jester-3":"/cards/standard/jester-3.webp","jester-4":"/cards/standard/jester-4.webp","mage-1":"/cards/standard/mage-1.webp","mage-2":"/cards/standard/mage-2.webp","mage-3":"/cards/standard/mage-3.webp","mage-4":"/cards/standard/mage-4.webp","red-1":"/cards/standard/red-1.webp","red-10":"/cards/standard/red-10.webp","red-11":"/cards/standard/red-11.webp","red-12":"/cards/standard/red-12.webp","red-13":"/cards/standard/red-13.webp","red-2":"/cards/standard/red-2.webp","red-3":"/cards/standard/red-3.webp","red-4":"/cards/standard/red-4.webp","red-5":"/cards/standard/red-5.webp","red-6":"/cards/standard/red-6.webp","red-7":"/cards/standard/red-7.webp","red-8":"/cards/standard/red-8.webp","red-9":"/cards/standard/red-9.webp","yellow-1":"/cards/standard/yellow-1.webp","yellow-10":"/cards/standard/yellow-10.webp","yellow-11":"/cards/standard/yellow-11.webp","yellow-12":"/cards/standard/yellow-12.webp","yellow-13":"/cards/standard/yellow-13.webp","yellow-2":"/cards/standard/yellow-2.webp","yellow-3":"/cards/standard/yellow-3.webp","yellow-4":"/cards/standard/yellow-4.webp","yellow-5":"/cards/standard/yellow-5.webp","yellow-6":"/cards/standard/yellow-6.webp","yellow-7":"/cards/standard/yellow-7.webp","yellow-8":"/cards/standard/yellow-8.webp","yellow-9":"/cards/standard/yellow-9.webp"},d_="/cards/standard/atlas.webp",f_=8,Et={width:256,height:400,gutter:4},nl={back:{col:0,row:0,edge:"#e1dfe7"},"blue-1":{col:1,row:0,edge:"#c2cbd6"},"blue-10":{col:2,row:0,edge:"#c7d1df"},"blue-11":{col:3,row:0,edge:"#c4ceda"},"blue-12":{col:4,row:0,edge:"#c4cdd7"},"blue-13":{col:5,row:0,edge:"#c5ceda"},"blue-2":{col:6,row:0,edge:"#c2cbd5"},"blue-3":{col:7,row:0,edge:"#c1cbd9"},"blue-4":{col:0,row:1,edge:"#c1cbd9"},"blue-5":{col:1,row:1,edge:"#c4cdd9"},"blue-6":{col:2,row:1,edge:"#c7d0dd"},"blue-7":{col:3,row:1,edge:"#c5cfdb"},"blue-8":{col:4,row:1,edge:"#c3ccd8"},"blue-9":{col:5,row:1,edge:"#c9d3e1"},"green-1":{col:6,row:1,edge:"#cdd8cc"},"green-10":{col:7,row:1,edge:"#d0dacf"},"green-11":{col:0,row:2,edge:"#d2dbd2"},"green-12":{col:1,row:2,edge:"#d1dad1"},"green-13":{col:2,row:2,edge:"#ced8cd"},"green-2":{col:3,row:2,edge:"#cdd8cc"},"green-3":{col:4,row:2,edge:"#cbd5ca"},"green-4":{col:5,row:2,edge:"#c9d2c8"},"green-5":{col:6,row:2,edge:"#ced7cd"},"green-6":{col:7,row:2,edge:"#cdd7cc"},"green-7":{col:0,row:3,edge:"#cbd4c9"},"green-8":{col:1,row:3,edge:"#cdd6cb"},"green-9":{col:2,row:3,edge:"#d0dacf"},"jester-1":{col:3,row:3,edge:"#edc3b4"},"jester-2":{col:4,row:3,edge:"#e4d29b"},"jester-3":{col:5,row:3,edge:"#bfd0b7"},"jester-4":{col:6,row:3,edge:"#bcd2e7"},"mage-1":{col:7,row:3,edge:"#ecc2b3"},"mage-2":{col:0,row:4,edge:"#e1d099"},"mage-3":{col:1,row:4,edge:"#c5d8be"},"mage-4":{col:2,row:4,edge:"#b5cade"},"red-1":{col:3,row:4,edge:"#d2bebb"},"red-10":{col:4,row:4,edge:"#d9c7c0"},"red-11":{col:5,row:4,edge:"#dbc7c0"},"red-12":{col:6,row:4,edge:"#dbc8c0"},"red-13":{col:7,row:4,edge:"#dcc8c2"},"red-2":{col:0,row:5,edge:"#d1bebb"},"red-3":{col:1,row:5,edge:"#d0bcb6"},"red-4":{col:2,row:5,edge:"#d0bbb6"},"red-5":{col:3,row:5,edge:"#c3aba6"},"red-6":{col:4,row:5,edge:"#c1aaa5"},"red-7":{col:5,row:5,edge:"#d0b7b3"},"red-8":{col:6,row:5,edge:"#d0b8b3"},"red-9":{col:7,row:5,edge:"#d9c8c1"},"yellow-1":{col:0,row:6,edge:"#d6ceba"},"yellow-10":{col:1,row:6,edge:"#d6cbb6"},"yellow-11":{col:2,row:6,edge:"#d7cfba"},"yellow-12":{col:3,row:6,edge:"#d7ceb9"},"yellow-13":{col:4,row:6,edge:"#d9cfb9"},"yellow-2":{col:5,row:6,edge:"#d7cfba"},"yellow-3":{col:6,row:6,edge:"#d6ceb7"},"yellow-4":{col:7,row:6,edge:"#d4cdb7"},"yellow-5":{col:0,row:7,edge:"#d7cfbc"},"yellow-6":{col:1,row:7,edge:"#d6cfbc"},"yellow-7":{col:2,row:7,edge:"#dbd0b7"},"yellow-8":{col:3,row:7,edge:"#d1c6ae"},"yellow-9":{col:4,row:7,edge:"#d6cbb5"}};function Bu(n){return`${"./".replace(/\/$/,"")}/${n.replace(/^\//,"")}`}const mn={red:{label:"Rot",runeName:"Kenaz",runePath:"M7.5 2 L2.5 8 L7.5 14"},yellow:{label:"Gelb",runeName:"Sowilo",runePath:"M7.5 2 L3 6 L7 10 L2.5 14"},green:{label:"Grün",runeName:"Berkano",runePath:"M2.5 2 L2.5 14 M2.5 2 L7.5 5 L2.5 8 M2.5 8 L7.5 11 L2.5 14"},blue:{label:"Blau",runeName:"Laguz",runePath:"M3 2 L3 14 M3 2 L7.5 6"}};function il(n){const e=mn[n],t="http://www.w3.org/2000/svg",i=document.createElementNS(t,"svg");i.setAttribute("viewBox","0 0 10 16"),i.setAttribute("class","rune"),i.setAttribute("aria-hidden","true");const r=document.createElementNS(t,"path");return r.setAttribute("d",e.runePath),r.setAttribute("fill","none"),r.setAttribute("stroke","currentColor"),r.setAttribute("stroke-width","1.6"),r.setAttribute("stroke-linecap","round"),r.setAttribute("stroke-linejoin","round"),i.append(r),i}function Us(n){return n.kind==="mage"?"Magier":n.kind==="jester"?"Narr":`${mn[n.suit].label} ${n.value}`}function h_(n){const e=document.createElement("div");e.className=`card card--${n.kind}`,e.dataset.card=n.id,e.setAttribute("aria-label",Us(n)),n.kind==="pip"&&e.classList.add(`card--${n.suit}`);const t=u_[n.id];if(t!==void 0)return e.classList.add("card--art"),e.append(p_(t)),e;if(n.kind==="pip"){const s=document.createElement("span");s.className="card__corner",s.textContent=String(n.value);const a=document.createElement("span");return a.className="card__value",a.textContent=String(n.value),e.append(s,il(n.suit),a),e}const i=document.createElement("span");i.className="card__glyph",i.textContent=n.kind==="mage"?"★":"?";const r=document.createElement("span");return r.className="card__label",r.textContent=n.kind==="mage"?"Magier":"Narr",e.append(i,r),e}function p_(n){const e=document.createElement("img");return e.className="card__art",e.src=Bu(n),e.alt="",e.draggable=!1,e}const ps=Et.width+2*Et.gutter,ms=Et.height+2*Et.gutter;function m_(){return["back",...Tr().map(n=>n.id)]}async function g_(n){const e=m_(),t=e.filter(a=>nl[a]===void 0),i=await v_(d_).catch(()=>null),r=i!==null&&t.length===0?__(i):await x_(e,i);r.texture.colorSpace=ut,r.texture.anisotropy=n,r.texture.magFilter=yt,r.texture.minFilter=Tn,r.texture.wrapS=jt,r.texture.wrapT=jt,r.texture.generateMipmaps=!0,r.texture.needsUpdate=!0;const s=r.entries.get("back")??{face:{u0:0,u1:1,v0:0,v1:1},edge:new Re("#2a2333")};return{texture:r.texture,back:s,art:a=>r.entries.get(a)??s}}function __(n){const e=new Map;for(const[i,r]of Object.entries(nl))e.set(i,{face:zu(r.col,r.row,n.width,n.height),edge:new Re(r.edge)});return{texture:new Rt(n),entries:e}}async function x_(n,e){const t=f_,i=Math.ceil(n.length/t),r=document.createElement("canvas");r.width=t*ps,r.height=i*ms;const s=r.getContext("2d");if(s===null)throw new Error("Kein 2D-Kontext fuer die Kartentafel");const a=new Map(Tr().map(l=>[l.id,l])),o=new Map;return n.forEach((l,c)=>{const d=c%t,f=Math.floor(c/t),u=d*ps+Et.gutter,h=f*ms+Et.gutter,x=nl[l];let S;x!==void 0&&e!==null?(s.drawImage(e,x.col*ps+Et.gutter,x.row*ms+Et.gutter,Et.width,Et.height,u,h,Et.width,Et.height),S=x.edge):(s.save(),s.translate(u,h),S=l==="back"?Gu(s):S_(s,a.get(l)??null),s.restore()),o.set(l,{face:zu(d,f,r.width,r.height),edge:new Re(S)})}),{texture:new xn(r),entries:o}}function zu(n,e,t,i){const r=n*ps+Et.gutter,s=e*ms+Et.gutter;return{u0:r/t,u1:(r+Et.width)/t,v0:1-(s+Et.height)/i,v1:1-s/i}}function v_(n){return new Promise((e,t)=>{const i=new Image;i.decoding="async",i.addEventListener("load",()=>e(i)),i.addEventListener("error",()=>t(new Error(`Bildtafel ${n} fehlt`))),i.src=Bu(n)})}const pi=Et.width,ln=Et.height,M_=26,ku={red:"#c8402f",yellow:"#bb8409",green:"#2d8a4c",blue:"#3366ba"};function ys(n){n.beginPath(),n.roundRect(4,4,pi-8,ln-8,M_)}function S_(n,e){if(e===null)return Gu(n);if(e.kind==="pip"){const r=ku[e.suit];return ys(n),n.fillStyle="#fbf7ee",n.fill(),n.lineWidth=8,n.strokeStyle=r,n.stroke(),n.fillStyle=r,n.textAlign="center",n.textBaseline="middle",n.font="800 132px system-ui, sans-serif",n.fillText(String(e.value),pi/2,ln*.44),n.font="700 40px system-ui, sans-serif",n.textAlign="left",n.textBaseline="top",n.fillText(String(e.value),28,24),b_(n,e.suit,pi/2,ln*.74,72),r}const t=e.kind==="mage",i=n.createLinearGradient(0,0,pi,ln);return i.addColorStop(0,t?"#8a5cf0":"#ffe9a8"),i.addColorStop(1,t?"#4b23a8":"#dfa62a"),ys(n),n.fillStyle=i,n.fill(),n.lineWidth=8,n.strokeStyle=t?"#37187d":"#96690f",n.stroke(),n.fillStyle=t?"#ffffff":"#4a370f",n.textAlign="center",n.textBaseline="middle",n.font="700 150px system-ui, sans-serif",n.fillText(t?"★":"?",pi/2,ln*.42),n.font="800 34px system-ui, sans-serif",n.fillText(t?"MAGIER":"NARR",pi/2,ln*.78),t?"#37187d":"#96690f"}function Gu(n){ys(n),n.fillStyle="#241d33",n.fill(),n.lineWidth=8,n.strokeStyle="#6d3fd1",n.stroke(),n.save(),ys(n),n.clip(),n.strokeStyle="rgba(150, 110, 235, 0.55)",n.lineWidth=6;for(let e=-ln;e<pi+ln;e+=26)n.beginPath(),n.moveTo(e,0),n.lineTo(e+ln,ln),n.stroke();return n.restore(),"#2a2333"}function b_(n,e,t,i,r){const s=r/16;n.save(),n.translate(t-5*s,i-8*s),n.scale(s,s),n.strokeStyle=ku[e],n.lineWidth=1.6,n.lineCap="round",n.lineJoin="round",n.stroke(new Path2D(mn[e].runePath)),n.restore()}const rl=(n,e,t)=>n<e?e:n>t?t:n,Vn=(n,e,t)=>n+(e-n)*t,Ma=n=>n<.5?4*n*n*n:1-(-2*n+2)**3/2,li=n=>1-(1-n)**3;function E_(n){return 1+(1.34+1)*(n-1)**3+1.34*(n-1)**2}const y_=n=>Math.sin(Math.PI*rl(n,0,1));function T_(n,e){let t=2166136261^e;for(let i=0;i<n.length;i++)t^=n.charCodeAt(i),t=Math.imul(t,16777619);return(t>>>8)%1e4/1e4}const Sa=(n,e)=>T_(n,e)*2-1,$n=4.55,Gi=3.15,ur=0;function A_(n,e){const t=new Hi,i=[],r=m=>(i.push(m),m),s=w_();t.add(s.mesh),i.push(s);const a=new _t(r(new bs(1,128)),r(new Yt({map:r(F_(e)),toneMapped:!1})));a.rotation.x=-Math.PI/2,a.scale.set($n,Gi,1),a.position.y=ur,t.add(a);const o=new _t(r(new Es(.978,1.02,160)),r(new Yt({map:r(W_()),transparent:!0,depthWrite:!1,opacity:.5})));o.rotation.x=-Math.PI/2,o.scale.set($n,Gi,1),o.position.y=ur+.006,t.add(o);const l=new _t(r(new Es(.9,1.3,160)),r(new Yt({map:r(V_()),transparent:!0,depthWrite:!1,blending:ei,opacity:.55})));l.rotation.x=-Math.PI/2,l.scale.set($n,Gi,1),l.position.y=ur+.004,t.add(l);const c=new _t(r(new tl(1,.9,.5,128,1,!0)),r(new ih({map:r(X_()),roughness:.72,metalness:.04,side:Nt,transparent:!0,depthWrite:!1})));c.scale.set($n,1,Gi),c.position.y=ur-.25,t.add(c);const d=new _t(r(new bs(1,96)),r(new Yt({map:r(q_()),transparent:!0,depthWrite:!1,blending:ei,opacity:.34})));d.rotation.x=-Math.PI/2,d.scale.set($n*1.95,Gi*1.95,1),d.position.y=ur-.7,t.add(d),t.add(new uh(new Re("#ff3344"),1.55)),t.add(new ah(new Re("#ffd0b8"),new Re("#780018"),1.15));const f=new lh(new Re("#ffe3bb"),320,26,.9,.95,2);f.position.set(0,7.6,1.8),f.target.position.set(0,0,-.2),t.add(f,f.target);const u=new Kl(new Re("#ff001e"),480,34,1.55);u.position.set(-7,3.4,-4.5),t.add(u);const h=new Kl(new Re("#ff001e"),420,34,1.55);h.position.set(7,2.6,-4.2),t.add(h);const x=Y_();t.add(x.points),i.push(x);const S=$_();return t.add(S.points),i.push(S),{group:t,update(m){n||S.update(m)},fit(m){s.fit(m)},dispose(){for(const m of i)m.dispose()}}}const bc=40,di=2048,qn=1152;function w_(){const n=C_(),e=new Mi(1,1),t=new Yt({map:n,depthTest:!1,depthWrite:!1,toneMapped:!1}),i=new _t(e,t);i.frustumCulled=!1,i.renderOrder=-100;let r=0;return{mesh:i,fit(s){const a=2*bc*Math.tan(s.fov/2*Math.PI/180),o=a*s.aspect;i.quaternion.copy(s.quaternion),i.position.set(0,0,-bc).applyQuaternion(s.quaternion).add(s.position),i.scale.set(o,a,1),!(Math.abs(s.aspect-r)<5e-4)&&(r=s.aspect,R_(n,s.aspect,di/qn))},dispose(){e.dispose(),n.dispose(),t.dispose()}}}function R_(n,e,t){e>t?(n.repeat.set(1,t/e),n.offset.set(0,(1-t/e)/2)):(n.repeat.set(e/t,1),n.offset.set((1-e/t)/2,0)),n.needsUpdate=!0}function C_(){const n=document.createElement("canvas");n.width=di,n.height=qn;const e=n.getContext("2d");if(e===null)throw new Error("Kein 2D-Kontext fuer die Buehne");e.fillStyle="#d00028",e.fillRect(0,0,di,qn),e.save(),e.translate(di*.5,qn*I_),P_(e),e.restore(),L_(e,di,qn),D_(e,di,qn),U_(e,di,qn,5);const t=new xn(n);return t.colorSpace=ut,t}function P_(n){Cr(n,0,0,qn*1.05,[[0,"rgba(255, 255, 255, 1)"],[.08,"rgba(255, 235, 213, 1)"],[.18,"rgba(255, 126, 100, 1)"],[.34,"rgba(255, 32, 48, 1)"],[.56,"rgba(255, 0, 35, 1)"],[.78,"rgba(218, 0, 40, 1)"],[1,"rgba(174, 0, 39, 1)"]])}function L_(n,e,t){for(let r=0;r<30;r++){const s=r%2===0,a=t*(.2+Math.random()*.42),o=(.45+Math.random()*.55)*(s?.115:.105),l=s?"255, 225, 190":"125, 0, 24";n.save(),n.globalCompositeOperation=s?"lighter":"source-over",n.translate(Math.random()*e,Math.random()*t),n.rotate(Math.random()*Math.PI),n.scale(1+Math.random()*1.5,.45+Math.random()*.6),Cr(n,0,0,a,[[0,`rgba(${l}, ${o})`],[.55,`rgba(${l}, ${o*.4})`],[1,`rgba(${l}, 0)`]]),n.restore()}n.globalCompositeOperation="source-over"}function D_(n,e,t){n.save(),n.translate(e/2,t*.56),n.scale(e/t,1),Cr(n,0,0,t*.75,[[0,"rgba(110, 0, 22, 0)"],[.52,"rgba(110, 0, 22, 0)"],[.76,"rgba(105, 0, 25, 0.1)"],[.92,"rgba(86, 0, 26, 0.2)"],[1,"rgba(62, 0, 24, 0.28)"]]),n.restore()}const I_=.46;function Cr(n,e,t,i,r){const s=n.createRadialGradient(e,t,0,e,t,i);for(const[a,o]of r)s.addColorStop(a,o);n.fillStyle=s,n.fillRect(e-i,t-i,i*2,i*2)}function U_(n,e,t,i){const r=n.getImageData(0,0,e,t);for(let s=0;s<r.data.length;s+=4){const a=(Math.random()-.5)*i;r.data[s]=ba((r.data[s]??0)+a),r.data[s+1]=ba((r.data[s+1]??0)+a),r.data[s+2]=ba((r.data[s+2]??0)+a)}n.putImageData(r,0,0)}const N_=2048;function F_(n){const e=N_,t=e/512,i=e/2,r=document.createElement("canvas");r.width=e,r.height=e;const s=r.getContext("2d");if(s===null)throw new Error("Kein 2D-Kontext fuer die Tischplatte");s.fillStyle="#831c38",s.fillRect(0,0,e,e);const a=s.createRadialGradient(i,i,0,i,i,i);a.addColorStop(0,"#e94a50"),a.addColorStop(.34,"#d93648"),a.addColorStop(.7,"#b52240"),a.addColorStop(.88,"#961c3a"),a.addColorStop(1,"#7e1833"),s.fillStyle=a,s.fillRect(0,0,e,e),O_(s,e),B_(s,e,t),k_(s,e),H_(s,e,t),G_(s,e,t),z_(s,e);const o=new xn(r);return o.colorSpace=ut,o.anisotropy=n,o.magFilter=yt,o.minFilter=Tn,o.generateMipmaps=!0,o}function O_(n,e){for(let t=0;t<22;t++){const i=t%2===0,r=e*(.12+Math.random()*.3),s=(.35+Math.random()*.65)*.05,a=i?"226, 190, 255":"58, 20, 104";n.save(),n.globalCompositeOperation=i?"lighter":"source-over",n.translate(Math.random()*e,Math.random()*e),n.rotate(Math.random()*Math.PI),n.scale(1+Math.random(),.6+Math.random()*.5),Cr(n,0,0,r,[[0,`rgba(${a}, ${s})`],[.6,`rgba(${a}, ${s*.35})`],[1,`rgba(${a}, 0)`]]),n.restore()}n.globalCompositeOperation="source-over"}function B_(n,e,t){n.save(),n.lineWidth=t;for(const[i,r]of[[1,.03],[-1,.02]]){n.strokeStyle=`rgba(226, 206, 255, ${r})`,n.beginPath();for(let s=-e;s<e*2;s+=9*t)n.moveTo(s,0),n.lineTo(s+i*e,e);n.stroke()}n.restore()}function z_(n,e){const t=document.createElement("canvas");t.width=512,t.height=512;const i=t.getContext("2d");if(i===null)return;const r=i.createImageData(t.width,t.height);for(let a=0;a<r.data.length;a+=4){const o=128+(Math.random()-.5)*44;r.data[a]=o,r.data[a+1]=o,r.data[a+2]=o,r.data[a+3]=255}i.putImageData(r,0,0);const s=n.createPattern(t,"repeat");s!==null&&(n.save(),n.globalCompositeOperation="overlay",n.globalAlpha=.5,n.fillStyle=s,n.fillRect(0,0,e,e),n.restore())}function k_(n,e){const t=e/2,i=12;n.save(),n.translate(t,t);for(let r=0;r<i;r++){const s=r/i*Math.PI*2,a=Math.PI/i/1.9,o=n.createRadialGradient(0,0,e*.06,0,0,e*.46);o.addColorStop(0,"rgba(198, 164, 255, 0.055)"),o.addColorStop(.6,"rgba(180, 140, 250, 0.022)"),o.addColorStop(1,"rgba(160, 120, 240, 0)"),n.fillStyle=o,n.beginPath(),n.moveTo(0,0),n.arc(0,0,e*.46,s-a,s+a),n.closePath(),n.fill()}n.restore()}function G_(n,e,t){const i=e/2,r=e*.468,s=e*.436;n.save(),n.translate(i,i),n.strokeStyle="rgba(206, 178, 252, 0.19)",n.lineWidth=1.4*t;for(const a of[r,s])n.beginPath(),n.arc(0,0,a,0,Math.PI*2),n.stroke();n.strokeStyle="rgba(206, 178, 252, 0.12)",n.lineWidth=1.2*t,n.beginPath();for(let a=0;a<72;a++){const o=a/72*Math.PI*2;n.moveTo(Math.cos(o)*s,Math.sin(o)*s),n.lineTo(Math.cos(o)*r,Math.sin(o)*r)}n.stroke(),n.restore()}function H_(n,e,t){const i=e/2,r=e*.355;n.save(),n.strokeStyle="rgba(214, 186, 255, 0.22)",n.lineWidth=1.6*t,n.beginPath(),n.arc(i,i,r,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(214, 186, 255, 0.12)",n.lineWidth=t,n.beginPath(),n.arc(i,i,r-13*t,0,Math.PI*2),n.stroke();const s=34/16*t;n.strokeStyle="rgba(226, 206, 255, 0.38)",n.lineWidth=1.7*t/s,n.lineCap="round",n.lineJoin="round",Cn.forEach((a,o)=>{const l=o/Cn.length*Math.PI*2;n.save(),n.translate(i+Math.sin(l)*r,i-Math.cos(l)*r),n.rotate(l),n.scale(s,s),n.translate(-5,-8),n.stroke(new Path2D(mn[a].runePath)),n.restore()}),n.restore()}function V_(){const e=document.createElement("canvas");e.width=256,e.height=4;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer die Tischkante");const i=t.createLinearGradient(0,0,256,0);i.addColorStop(0,"rgba(112, 74, 176, 0)"),i.addColorStop(.14,"rgba(132, 92, 200, 0.26)"),i.addColorStop(.2,"rgba(186, 148, 246, 0.4)"),i.addColorStop(.3,"rgba(146, 96, 216, 0.2)"),i.addColorStop(.55,"rgba(118, 70, 190, 0.075)"),i.addColorStop(1,"rgba(96, 54, 168, 0)"),t.fillStyle=i,t.fillRect(0,0,256,4);const r=new xn(e);return r.colorSpace=ut,r}function W_(){const e=document.createElement("canvas");e.width=64,e.height=4;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer den Kantenschimmer");const i=t.createLinearGradient(0,0,64,0);i.addColorStop(0,"rgba(196, 164, 246, 0)"),i.addColorStop(.5,"rgba(214, 188, 255, 0.85)"),i.addColorStop(1,"rgba(196, 164, 246, 0)"),t.fillStyle=i,t.fillRect(0,0,64,4);const r=new xn(e);return r.colorSpace=ut,r}function X_(){const e=document.createElement("canvas");e.width=4,e.height=64;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer die Zarge");const i=t.createLinearGradient(0,0,0,64);i.addColorStop(0,"rgba(78, 46, 120, 1)"),i.addColorStop(.24,"rgba(52, 30, 84, 0.95)"),i.addColorStop(.62,"rgba(30, 17, 52, 0.6)"),i.addColorStop(.86,"rgba(18, 10, 34, 0.22)"),i.addColorStop(1,"rgba(13, 7, 25, 0)"),t.fillStyle=i,t.fillRect(0,0,4,64);const r=new xn(e);return r.colorSpace=ut,r}function q_(){const e=document.createElement("canvas");e.width=256,e.height=256;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer den Lichtteppich");Cr(t,256/2,256/2,256/2,[[0,"rgba(108, 52, 208, 0.5)"],[.42,"rgba(76, 34, 158, 0.2)"],[.75,"rgba(50, 22, 116, 0.06)"],[1,"rgba(34, 14, 86, 0)"]]);const i=new xn(e);return i.colorSpace=ut,i}const ba=n=>n<0?0:n>255?255:n,Ea=600;function Y_(){const n=new It,e=new Float32Array(Ea*3),t=new Float32Array(Ea*3),i=new Re("#9fb4ff"),r=new Re("#ffd9f0"),s=new Re;for(let l=0;l<Ea;l++){const c=Math.random()*Math.PI*2,d=Math.random()**1.5,f=26+Math.random()*9,u=Math.sqrt(1-d*d);e[l*3]=Math.sin(c)*u*f,e[l*3+1]=2+d*f*.85,e[l*3+2]=Math.cos(c)*u*f,s.copy(i).lerp(r,Math.random());const h=(.2+Math.random()**2*.8)*.45;t[l*3]=s.r*h,t[l*3+1]=s.g*h,t[l*3+2]=s.b*h}n.setAttribute("position",new xt(e,3)),n.setAttribute("color",new xt(t,3));const a=new el({size:.5,map:Hu(),vertexColors:!0,transparent:!0,depthWrite:!1,blending:ei,sizeAttenuation:!0}),o=new bu(n,a);return o.frustumCulled=!1,o.renderOrder=-3,{points:o,update(){},dispose(){n.dispose(),a.map?.dispose(),a.dispose()}}}const dr=340,ya=7.5;function $_(){const n=new It,e=new Float32Array(dr*3),t=new Float32Array(dr*3),i=new Float32Array(dr),r=new Re("#ffd9a0"),s=new Re("#b48cff"),a=new Re;for(let d=0;d<dr;d++){const f=Math.random()*Math.PI*2,u=5.6+Math.random()*5.4;e[d*3]=Math.sin(f)*u*1.25,e[d*3+1]=Math.random()*ya,e[d*3+2]=Math.cos(f)*u,a.copy(s).lerp(r,Math.random()**2);const h=.35+Math.random()*.65;t[d*3]=a.r*h,t[d*3+1]=a.g*h,t[d*3+2]=a.b*h,i[d]=.12+Math.random()*.42}const o=new xt(e,3);n.setAttribute("position",o),n.setAttribute("color",new xt(t,3));const l=new el({size:.13,map:Hu(),vertexColors:!0,transparent:!0,depthWrite:!1,blending:ei,sizeAttenuation:!0}),c=new bu(n,l);return c.frustumCulled=!1,c.renderOrder=-2,{points:c,update(d){for(let f=0;f<dr;f++){const u=f*3+1;let h=(e[u]??0)+(i[f]??0)*d;h>ya&&(h-=ya),e[u]=h}o.needsUpdate=!0},dispose(){n.dispose(),l.map?.dispose(),l.dispose()}}}function Hu(){const e=document.createElement("canvas");e.width=64,e.height=64;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer die Partikel");const i=t.createRadialGradient(64/2,64/2,0,64/2,64/2,64/2);i.addColorStop(0,"rgba(255, 255, 255, 1)"),i.addColorStop(.25,"rgba(255, 255, 255, 0.62)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=i,t.fillRect(0,0,64,64);const r=new xn(e);return r.colorSpace=ut,r}const Co=new O(0,6.5,5.23),Ec=new O(0,.1,-.25),Ta=43,K_=1.55;function Z_(n){const e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,t=new c_({canvas:n,antialias:!0,alpha:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1});t.toneMapping=Go,t.toneMappingExposure=1.03;const i=new Gf,r=new Bt(Ta,1,.1,120);r.position.copy(Co),r.lookAt(Ec);let s=Math.min(window.devicePixelRatio||1,2),a=1,o=1;function l(){const _=n.getBoundingClientRect();a=Math.max(1,Math.round(_.width)),o=Math.max(1,Math.round(_.height));const b=a/o,U=a<=760&&o>a;r.position.copy(U?new O(0,8,3.8):Co),r.lookAt(Ec);const E=U?1.05:K_;r.aspect=b,r.fov=b>=E?Ta:2*Math.atan(Math.tan(Ta/2*(Math.PI/180))*E/b)*180/Math.PI,r.updateProjectionMatrix(),t.setPixelRatio(s),t.setSize(a,o,!1)}const c=new ResizeObserver(l);c.observe(n),l();const d=new Set;let f=0,u=performance.now(),h=0,x=60;function S(_){f=requestAnimationFrame(S);const b=Math.min(.05,Math.max(5e-4,(_-u)/1e3));u=_,h+=b,x+=(1/b-x)*.05,R();for(const U of d)U(b,h);t.render(i,r)}let m=0;const p=5;function R(){if(h<p||x>=45||s<=1){m=0;return}++m<120||(m=0,s=Math.max(1,s-.25),l(),console.info(`Runecall: Aufloesung auf ${s.toFixed(2)} gesenkt (${x.toFixed(0)} B/s)`))}f=requestAnimationFrame(S);const P=new O,v=new hh,T=new Fe,y=new yn(new O(0,1,0),0);function L(_,b){const U=n.getBoundingClientRect();return T.set((_-U.left)/U.width*2-1,-((b-U.top)/U.height*2-1)),v.setFromCamera(T,r),v}return{renderer:t,scene:i,camera:r,canvas:n,reducedMotion:e,onFrame(_){return d.add(_),()=>d.delete(_)},toScreen(_,b){return P.copy(_).project(r),b.set((P.x+1)/2*a,(1-P.y)/2*o),b},isInFront(_){return P.copy(_).project(r),P.z<1},rayAt:L,planePoint(_,b,U,E){return y.constant=-U,L(_,b).ray.intersectPlane(y,E)===null?null:E},fps:()=>x,dispose(){cancelAnimationFrame(f),c.disconnect(),d.clear(),t.dispose()}}}Co.clone();const fr=44,J_=.42,Q_=.66,yc=$n+4.2,j_=$n+12,Aa=-2.6,Tc=8.4,ex=8.5,Ac=5.5;function tx(n,e){const t=Tr(),i=new Float32Array(fr*4*3),r=new Float32Array(fr*4*2),s=new Float32Array(fr*4*3),a=new Uint16Array(fr*6),o=[],l=new Re;for(let v=0;v<fr;v++){const T=t[Math.floor(Math.random()*t.length)],y=Math.random()<.25||T===void 0?e.back:e.art(T.id),L=[[y.face.u0,y.face.v0],[y.face.u1,y.face.v0],[y.face.u1,y.face.v1],[y.face.u0,y.face.v1]],_=Math.random(),b=.85-_*.45;l.setRGB(b,b*.94,b*1.04);for(let I=0;I<4;I++){const G=L[I]??[0,0];r[(v*4+I)*2]=G[0],r[(v*4+I)*2+1]=G[1],s[(v*4+I)*3]=l.r,s[(v*4+I)*3+1]=l.g,s[(v*4+I)*3+2]=l.b}const U=v*4;a.set([U,U+1,U+2,U,U+2,U+3],v*6);const E=yc+(j_-yc)*_;o.push({angle:Math.random()*Math.PI*2,turn:(.055+Math.random()*.075)*(1-_*.45),radiusX:E,radiusZ:E*.78,height:Aa+Math.random()*(Tc-Aa),rise:.12+Math.random()*.4,spin:Math.random()*Math.PI*2,spinTurn:(Math.random()-.5)*.5,tumble:Math.random()*Math.PI*2,tumbleTurn:.18+Math.random()*.5,swayPhase:Math.random()*Math.PI*2,swayTurn:.2+Math.random()*.4})}const c=new It,d=new xt(i,3);d.setUsage(bf),c.setAttribute("position",d),c.setAttribute("uv",new xt(r,2)),c.setAttribute("color",new xt(s,3)),c.setIndex(new xt(a,1));const f=new Yt({map:e.texture,vertexColors:!0,side:Ht,transparent:!0,opacity:.5,alphaTest:.25,blending:ei,depthWrite:!1,toneMapped:!1}),u=new _t(c,f);u.frustumCulled=!1,u.renderOrder=-1;const h=new O(1,0,0).applyQuaternion(n.camera.quaternion),x=new O(0,1,0).applyQuaternion(n.camera.quaternion),S=n.camera.position,m=new O,p=new O,R=new O;function P(){o.forEach((v,T)=>{const y=Math.sin(v.swayPhase)*.5;R.set(Math.sin(v.angle)*(v.radiusX+y),v.height,Math.cos(v.angle)*(v.radiusZ+y));const L=Math.max(.14,Math.abs(Math.cos(v.tumble))),_=Math.cos(v.spin),b=Math.sin(v.spin),U=R.distanceTo(S),E=Math.min(1,Math.max(0,(U-Ac)/(ex-Ac))),I=J_*L*E,G=Q_*E;m.copy(h).multiplyScalar(_).addScaledVector(x,b).multiplyScalar(I),p.copy(x).multiplyScalar(_).addScaledVector(h,-b).multiplyScalar(G);for(let Y=0;Y<4;Y++){const k=Y===0||Y===3?-1:1,K=Y===0||Y===1?-1:1,z=(T*4+Y)*3;i[z]=R.x+m.x*k+p.x*K,i[z+1]=R.y+m.y*k+p.y*K,i[z+2]=R.z+m.z*k+p.z*K}}),d.needsUpdate=!0}return P(),{mesh:u,update(v){for(const T of o)T.angle+=T.turn*v,T.spin+=T.spinTurn*v,T.tumble+=T.tumbleTurn*v,T.swayPhase+=T.swayTurn*v,T.height+=T.rise*v,T.height>Tc&&(T.height=Aa);P()},dispose(){c.dispose(),f.dispose()}}}const Vu=1,_r=1.5625,nx=.5,wc=.62;function ix(n){const e=new Yt({map:n,vertexColors:!0,side:Ht,transparent:!0,alphaTest:.35,depthTest:!1,depthWrite:!1,toneMapped:!1}),t=new Yt({map:rx(),color:new Re("#0b0518"),transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,opacity:.45}),i=new Yt({map:n,vertexColors:!0,side:Ht,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1});return{face:e,shade:t,mirror:i,dispose(){e.dispose(),t.map?.dispose(),t.dispose(),i.dispose()}}}function rx(){const e=document.createElement("canvas");e.width=128,e.height=128;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer den Kartenschatten");const i=t.createRadialGradient(128/2,128/2,0,128/2,128/2,128/2);i.addColorStop(0,"rgba(255, 255, 255, 0.9)"),i.addColorStop(.5,"rgba(255, 255, 255, 0.5)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),t.fillStyle=i,t.fillRect(0,0,128,128);const r=new xn(e);return r.colorSpace=ut,r}let Rc=null;function wa(){return Rc??=new Mi(Vu,_r),Rc}function sx(n){const e=wa().clone(),t=e.getAttribute("uv"),i=Float32Array.from(t.array),r=t.count,s=new xt(new Float32Array(r*3),3);e.setAttribute("color",s);const a=new _t(e,n.face);a.frustumCulled=!1;const o=wa().clone(),l=o.getAttribute("uv"),c=o.getAttribute("position"),d=new xt(new Float32Array(r*4),4);o.setAttribute("color",d);for(let S=0;S<r;S++)d.setXYZW(S,1,1,1,c.getY(S)>0?0:nx);const f=new _t(o,n.mirror);f.frustumCulled=!1,f.visible=!1;const u=new _t(wa().clone(),n.shade.clone());u.frustumCulled=!1;let h=1;function x(){for(let S=0;S<r;S++)s.setXYZ(S,h,h,h);s.needsUpdate=!0}return x(),{mesh:a,shade:u,mirror:f,setArt(S){const{u0:m,u1:p,v0:R,v1:P}=S.face;for(let v=0;v<r;v++){const T=i[v*2]??0,y=i[v*2+1]??0;t.setXY(v,m+T*(p-m),R+y*(P-R)),l.setXY(v,m+T*(p-m),R+y*(P-R))}t.needsUpdate=!0,l.needsUpdate=!0},setTint(S){Math.abs(S-h)<.004||(h=S,x())},setOrder(S){a.renderOrder=S,u.renderOrder=S-.5,f.renderOrder=S-.25},dispose(){e.dispose(),o.dispose(),u.geometry.dispose(),Array.isArray(u.material)||u.material.dispose()}}}function ax(){const e=document.createElement("canvas");e.width=256,e.height=256;const t=e.getContext("2d");if(t===null)throw new Error("Kein 2D-Kontext fuer die Ablage");const i=t.createRadialGradient(256/2,256/2,0,256/2,256/2,256/2);i.addColorStop(0,"rgba(226, 190, 255, 0.3)"),i.addColorStop(.45,"rgba(190, 140, 246, 0.13)"),i.addColorStop(1,"rgba(160, 100, 230, 0)"),t.fillStyle=i,t.fillRect(0,0,256,256);const r=new xn(e);r.colorSpace=ut;const s=new _t(new Mi(4.2,4.2),new Yt({map:r,transparent:!0,depthWrite:!1,side:Ht,blending:ei,toneMapped:!1}));return s.rotation.x=-Math.PI/2,s.position.y=.004,s}const ox=.9;function Cc(n){return Array.from({length:n},(e,t)=>{const i=t/n*Math.PI*2,r=xr(i,ox,0);return{index:t,angle:i,facing:Math.atan2(r.x,r.z),at:r}})}function xr(n,e,t){return new O(Math.sin(n)*$n*e,t,Math.cos(n)*Gi*e)}const lx=1.03,cx=1.15,ux=new Set;function Oi(n,e=.5){for(const t of ux)t(n,e)}const dx=.93,fx=8.1,hx=.34,px=.45,mx=.9,gx=.3,_x=.056,xx=.26,vx=.15,Mx=1.05,Sx=.62,bx=.2,Ra=.72,Ex=.78,hr=new O(0,.05,.35),yx=.75,Pc=.34,Tx=.34,Ax=new O(2.15,.05,-.15),wx=.62,Rx=.3,Lc=1.07,Cx=.85,Dc=.32,Bi=.22,Px=.13,Lx=.34,Dx=.36,Ix=.44,zi={away:20,pile:200,trump:160,hand:400,held:900},ci=(n,e,t=1,i=0,r=0,s=1)=>({x:n.x,y:n.y,z:n.z,roll:e,scale:t,lay:i,yaw:r,flip:s}),ki=n=>({...n});function Ux(n,e){return n===null?!1:Math.abs(n.x-e.x)<.002&&Math.abs(n.y-e.y)<.002&&Math.abs(n.z-e.z)<.002&&Math.abs(n.roll-e.roll)<.002&&Math.abs(n.scale-e.scale)<.002&&Math.abs(n.lay-e.lay)<.002&&Math.abs(n.yaw-e.yaw)<.002&&Math.abs(n.flip-e.flip)<.002}function Nx(n,e,t){const i=new Hi;n.scene.add(i);const r=ix(e.texture),s=ax();i.add(s);const a=new Map,o=[],l=n.reducedMotion,c=l?.12:1,d=l?0:1,f=n.camera.quaternion.clone(),u=new O(1,0,0).applyQuaternion(f),h=new O(0,1,0).applyQuaternion(f),x=new O(0,0,1).applyQuaternion(f),S=new dn().setFromAxisAngle(new O(1,0,0),-Math.PI/2),m=new dn,p=new O().copy(n.camera.position).addScaledVector(x,-10.5).addScaledVector(h,-2.65),R=new dn,P=new dn,v=new O(0,0,1),T=new O,y=new O,L=new O,_=new Fe,b=new Fe;function U(w,C,D,W){return T.copy(w).addScaledVector(u,C).addScaledVector(h,D).addScaledVector(x,W)}const E={index:0,angle:0,facing:0,at:new O},I=w=>G[w]??E;let G=Cc(3),Y=[],k=null,K=null,z=new Set,te=0,re=new Set,ce=null,de="";function _e(w,C){const D=a.get(w);if(D!==void 0)return D.retiring=!1,D.fadeTarget=1,D;const W=o.pop()??sx(r),ne=e.art(C);W.setArt(ne),W.shade.visible=!0,W.mirror.visible=!1,i.add(W.mesh,W.shade,W.mirror);const J={body:W,pose:{x:0,y:0,z:0,roll:0,scale:1,lay:0,yaw:0,flip:1},goal:null,move:null,placed:!1,front:ne,back:e.back,showsFront:!0,tint:1,tintTarget:1,fade:1,fadeTarget:1,retiring:!1};return a.set(w,J),J}function ke(w,C){a.delete(w),i.remove(C.body.mesh,C.body.shade,C.body.mirror),o.push(C.body)}function Je(w,C){Object.assign(w.pose,C),w.goal=ki(C),w.move=null,w.placed=!0}function Le(w,C,D,W={}){Ux(w.goal,C)||(w.goal=ki(C),w.move={from:ki(w.pose),to:ki(C),elapsed:0,duration:Math.max(.04,D*c),ease:W.ease??Ma,arc:(W.arc??0)*d,pop:W.pop??!1,onLand:W.onLand??null},w.placed=!0)}function j(w,C){const D=C>1?w/(C-1)-.5:0,W=C>1?Math.min(dx,fx/(C-1)):0,ne=Math.min(hx,.075*C),J=U(p,D*W*(C-1),-D*D*px,w*.012);return ci(J,-D*ne*2)}function le(w,C,D){const ne=-Math.sin(w.angle)*bx,J=xr(w.angle,mx,gx),ee=n.camera.position.distanceTo(J),ge=_x*ee,ve=D>1?Math.min(vx,Mx/(D-1)):0,Ee=(D-1)/2,N=ne+(C-Ee)*ve,oe=Sx*_r*ge,Q=oe*(Math.sin(ne)-Math.sin(N)),ue=oe*(Math.cos(N)-Math.cos(ne)),he=T.copy(J).addScaledVector(u,Q).addScaledVector(h,ue).addScaledVector(x,C*.01);return ci(he,N,ge,xx)}function se(w,C,D){const W=xr(I(D).angle,1,0).normalize().multiplyScalar(Tx),ne=T.set(hr.x+W.x+Sa(w,11)*Pc,hr.y+C*.004,hr.z+W.z+Sa(w,23)*Pc*.8);return ci(ne,Sa(w,37)*.34,yx,Ra)}const Ce=w=>ci(Ax,.14,wx,Ex,0,w?1:0);function De(w,C){w.handSizes.length!==G.length&&(G=Cc(w.handSizes.length)),Y=Fo(w.hand,w.trumpSuit),z=new Set(w.playable),w.lastTrick!==null&&(te=w.lastTrick.winner);const D=`${w.roundNumber}`;D!==de&&(de=D,re=new Set,ce=null);const W=new Set;we(W),st(w,W),ze(w,C,W),qe(w,W);for(const[ne,J]of a)W.has(ne)||J.retiring||He(ne,J)}function we(w){const C=Y.length;Y.forEach((D,W)=>{const ne=`hand:${D.id}`;w.add(ne);const J=_e(ne,D.id),ee=j(W,C);J.body.mesh.userData.cardId=D.id,J.tintTarget=z.size>0&&!z.has(D.id)?.62:1,J.placed||(Je(J,ci(y.copy(hr),0,.45,Ra)),Le(J,ee,Dc+W*.04,{ease:li,arc:.25,pop:!0}),W===0&&Oi("deal",.4));const ge=Ue?.cardId===D.id,ve=K===D.id,Ee=ve||k===D.id;if(J.body.setOrder(ge||Ee?zi.held:zi.hand+W*2),ge)return;if(!Ee){Le(J,ee,Bi);return}const N=Rx*(ve?1.5:1);Le(J,{...ee,x:ee.x+h.x*N,y:ee.y+h.y*N,z:ee.z+h.z*N,roll:ee.roll*.4,scale:Lc},Px,{ease:li})})}function st(w,C){for(let D=1;D<w.handSizes.length;D++){const W=w.handSizes[D]??0;for(let ne=0;ne<W;ne++){const J=`away:${D}:${ne}`;C.add(J);const ee=_e(J,"back"),ge=le(I(D),ne,W);ee.body.setOrder(zi.away+D*40+ne*2),ee.body.mirror.visible=!1,ee.body.shade.visible=!0,ee.placed?Le(ee,ge,Bi):(Je(ee,ci(y.copy(hr),0,.4,Ra)),Le(ee,ge,Dc+ne*.03,{ease:li,arc:.2}))}}}function ze(w,C,D){const W=C&&w.lastTrick!==null?w.lastTrick.plays:w.currentTrick,ne=C?w.lastTrick?.winner??null:null;W.forEach((J,ee)=>{const ge=`pile:${J.card.id}`;D.add(ge);const ve=_e(ge,J.card.id),Ee=se(J.card.id,ee,J.player);if(ve.body.setOrder(zi.pile+ee*2),!re.has(J.card.id))re.add(J.card.id),Ke(ve,J.player,J.card.id,w,Ee);else{const N=J.player===ne;Le(ve,N?{...Ee,scale:1.12}:Ee,Bi)}ve.tintTarget=ne===null||J.player===ne?1:.6})}function Ke(w,C,D,W,ne){const J=C===W.you?`hand:${D}`:`away:${C}:${W.handSizes[C]??0}`,ee=a.get(J);ee!==void 0?(Je(w,ki(ee.pose)),ke(J,ee)):Je(w,le(I(C),0,1));const ge=C===W.you;Oi("throw",ge?.8:.55),Le(w,ne,Lx,{ease:li,arc:.3,pop:!0,onLand:()=>Oi("land",.6)})}function qe(w,C){if(w.trumpCard===null)return;const D="trump";C.add(D);const W=_e(D,w.trumpCard.id);W.body.setOrder(zi.trump),ce!==w.trumpCard.id?(ce=w.trumpCard.id,W.front=e.art(w.trumpCard.id),W.showsFront=!1,W.body.setArt(W.back),Je(W,Ce(!1)),Oi("flip",.45),Le(W,Ce(!0),Ix,{ease:Ma})):Le(W,Ce(!0),Bi)}function He(w,C){const D=I(te),W=xr(D.angle,1.02,.5);C.retiring=!0,C.fadeTarget=0,w.startsWith("pile:")&&Oi("collect",.45),Le(C,ci(W,C.pose.roll*.5,.4,C.pose.lay),Dx,{ease:Ma,onLand:()=>ke(w,C)})}const ot=n.onFrame(w=>{const C=window.matchMedia("(max-width: 900px)").matches;for(const[D,W]of a){dt(W,w);const ne=C&&D.startsWith("hand:");W.body.mesh.visible=!ne,ne&&(W.body.shade.visible=!1)}});function dt(w,C){const D=w.move;if(D!==null){D.elapsed+=C;const ve=rl(D.elapsed/D.duration,0,1),Ee=D.ease(ve),N=D.arc*y_(ve);w.pose.x=Vn(D.from.x,D.to.x,Ee)+h.x*N,w.pose.y=Vn(D.from.y,D.to.y,Ee)+h.y*N,w.pose.z=Vn(D.from.z,D.to.z,Ee)+h.z*N,w.pose.roll=Vn(D.from.roll,D.to.roll,li(ve)),w.pose.scale=Vn(D.from.scale,D.to.scale,D.pop?E_(ve):Ee),w.pose.lay=Vn(D.from.lay,D.to.lay,Ee),w.pose.yaw=Vn(D.from.yaw,D.to.yaw,Ee),w.pose.flip=Vn(D.from.flip,D.to.flip,Ee),ve>=1&&(Object.assign(w.pose,D.to),w.move=null,D.onLand?.())}const W=Math.min(1,C*11);w.tint+=(w.tintTarget-w.tint)*W,w.fade+=(w.fadeTarget-w.fade)*W;const ne=w.pose.flip>.5;ne!==w.showsFront&&(w.showsFront=ne,w.body.setArt(ne?w.front:w.back));const J=w.body.mesh,ee=w.pose.scale*Math.max(.001,w.fade),ge=Math.abs(Math.cos(Math.PI*w.pose.flip));m.copy(f).slerp(S,w.pose.lay),R.setFromAxisAngle(v,w.pose.roll),P.setFromAxisAngle(h,w.pose.yaw),J.position.set(w.pose.x,w.pose.y,w.pose.z),J.quaternion.copy(P).multiply(m).multiply(R),J.scale.set(Math.max(.001,ee*ge),ee,1),w.body.setTint(w.tint),vt(w,ee,ge),w.body.mirror.visible&&mt(w,ee,ge)}function mt(w,C,D){const W=w.body.mirror,ne=_r*C;W.quaternion.copy(w.body.mesh.quaternion),W.position.set(0,-(ne/2)-ne*wc/2,0).applyQuaternion(W.quaternion).add(w.body.mesh.position),W.scale.set(Math.max(.001,C*D),-C*wc,1)}function vt(w,C,D){const W=w.body.shade,ne=w.body.mesh,J=y.set(.04*C,-.07*C,-.004).applyQuaternion(ne.quaternion).add(ne.position);W.position.copy(J),W.quaternion.copy(w.body.mesh.quaternion),W.scale.set(Math.max(.001,C*D*1.3),C*1.22,1),W.visible=w.fade>.05;const ee=W.material;Array.isArray(ee)||(ee.opacity=.42*w.fade)}function tt(w,C){const D=[];for(const[J,ee]of a)!J.startsWith("hand:")||ee.retiring||D.push(ee.body.mesh);if(D.length===0)return null;const ne=n.rayAt(w,C).intersectObjects(D,!1)[0]?.object.userData.cardId;return typeof ne=="string"?ne:null}let Ue=null;const F=new yn,Ct=new O;function Ye(w,C){return F.setFromNormalAndCoplanarPoint(x,p),n.rayAt(w,C).ray.intersectPlane(F,Ct)}function A(w){if(w.button!==0||Ue!==null||window.matchMedia("(max-width: 900px)").matches)return;const C=tt(w.clientX,w.clientY);if(C===null)return;const D=a.get(`hand:${C}`),W=Ye(w.clientX,w.clientY);D===void 0||W===null||(Ue={cardId:C,pointerId:w.pointerId,start:W.clone(),origin:ki(D.pose),moved:!1},D.body.setOrder(zi.held),n.canvas.setPointerCapture(w.pointerId))}function g(w){if(Ue!==null&&w.pointerId!==Ue.pointerId)return;if(Ue===null){if(w.pointerType==="touch")return;t.onHover(tt(w.clientX,w.clientY));return}const C=a.get(`hand:${Ue.cardId}`),D=Ye(w.clientX,w.clientY);C===void 0||D===null||(T.copy(D).sub(Ue.start),T.length()>.1&&(Ue.moved=!0),Ue.moved&&(C.move=null,C.goal=null,C.pose.x=Ue.origin.x+T.x,C.pose.y=Ue.origin.y+T.y,C.pose.z=Ue.origin.z+T.z,C.pose.roll=Ue.origin.roll*.3,C.pose.scale=Lc))}function H(w){if(Ue!==null&&w.pointerId!==Ue.pointerId)return;const C=Ue;if(Ue=null,C===null)return;n.canvas.hasPointerCapture(C.pointerId)&&n.canvas.releasePointerCapture(C.pointerId);const D=Ye(w.clientX,w.clientY),W=D===null?0:T.copy(D).sub(C.start).dot(h);if(!C.moved||W>Cx){t.onPick(C.cardId);return}const ne=a.get(`hand:${C.cardId}`),J=Y.findIndex(ee=>ee.id===C.cardId);ne!==void 0&&J>=0&&Le(ne,j(J,Y.length),Bi,{ease:li})}function V(){const w=Ue;if(Ue=null,w!==null){const C=a.get(`hand:${w.cardId}`),D=Y.findIndex(W=>W.id===w.cardId);C!==void 0&&D>=0&&Le(C,j(D,Y.length),Bi,{ease:li}),n.canvas.hasPointerCapture(w.pointerId)&&n.canvas.releasePointerCapture(w.pointerId)}t.onHover(null)}function Z(w){tt(w.clientX,w.clientY)===null&&t.onEmptyClick()}return n.canvas.addEventListener("pointerdown",A),n.canvas.addEventListener("pointermove",g),n.canvas.addEventListener("pointerup",H),n.canvas.addEventListener("pointercancel",V),n.canvas.addEventListener("pointerleave",V),n.canvas.addEventListener("click",Z),{show:De,focus(w){k!==w&&(w!==null&&Oi("lift",.25),k=w,ae())},select(w){K!==w&&(K=w,ae())},seatAt(w,C){const D=w===0?y.copy(p).addScaledVector(u,-5).addScaledVector(h,.5):y.copy(xr(I(w).angle,lx,cx));return n.isInFront(D)?n.toScreen(D,C):null},cardAt(w,C){const D=a.get(`hand:${w}`);return D===void 0?null:(y.copy(D.body.mesh.position),n.isInFront(y)?n.toScreen(y,C):null)},cardSize(){n.toScreen(L.copy(p),_),n.toScreen(L.copy(p).addScaledVector(h,_r/2),b);const w=Math.max(24,_.distanceTo(b)*2);return{width:w*(Vu/_r),height:w}},reset(){for(const[w,C]of a)ke(w,C);a.clear(),re=new Set,ce=null,de="",k=null,K=null,Ue=null,Y=[]},dispose(){ot(),n.canvas.removeEventListener("pointerdown",A),n.canvas.removeEventListener("pointermove",g),n.canvas.removeEventListener("pointerup",H),n.canvas.removeEventListener("pointercancel",V),n.canvas.removeEventListener("pointerleave",V),n.canvas.removeEventListener("click",Z);for(const[w,C]of a)ke(w,C);for(const w of o)w.dispose();o.length=0,s.geometry.dispose(),Array.isArray(s.material)||s.material.dispose(),r.dispose(),n.scene.remove(i)}};function ae(){we(new Set)}}const pt=0;function Wu(n,e){const{settings:t,match:i,seed:r}=n;let s=n.resume??cd({playerCount:i.playerCount,totalRounds:i.totalRounds,seed:r});const a=Array.from({length:s.playerCount},(v,T)=>Sd(i.difficulty,r+T*7919)),o=v=>{const T=a[v];if(T===void 0)throw new Error(`Kein Bot auf Platz ${v}`);return T},l=Math.max(700,Math.round(t.speed*1.25));let c=null,d=null,f="none",u=null,h=!1;function x(v,T){S(),d=T,c=window.setTimeout(()=>{c=null,d=null,h||T()},v)}function S(){c!==null&&window.clearTimeout(c),c=null,d=null}function m(v){s=v,Hd({state:s,settings:t,seed:r,match:i}),p()}function p(){if(!h){if(e(),s.lastTrick!==null&&s.lastTrick!==u){f="trick",e(),x(l,()=>{u=s.lastTrick,f="none",p()});return}switch(s.phase){case"trump-choice":return s.dealer===pt?R():P(()=>ii(s,{type:"choose-trump",suit:o(s.dealer).chooseTrump(Dr(s,s.dealer))}));case"bidding":return s.turn===pt?R():P(()=>ii(s,{type:"bid",value:o(s.turn).chooseBid(Dr(s,s.turn))}));case"playing":return s.turn===pt?R():P(()=>ii(s,{type:"play",cardId:o(s.turn).chooseCard(Dr(s,s.turn))}));case"round-end":case"game-over":return R()}}}function R(){f="none",e()}function P(v){f="bot",e(),x(t.speed,()=>{f="none",m(v())})}return u=s.lastTrick,queueMicrotask(p),{settings:t,match:i,seed:r,state:()=>s,view:()=>Dr(s,pt),waiting:()=>f,chooseTrump(v){s.phase!=="trump-choice"||s.dealer!==pt||m(ii(s,{type:"choose-trump",suit:v}))},bid(v){s.phase!=="bidding"||s.turn!==pt||m(ii(s,{type:"bid",value:v}))},play(v){s.phase!=="playing"||s.turn!==pt||f==="none"&&m(ii(s,{type:"play",cardId:v}))},nextRound(){s.phase==="round-end"&&m(ii(s,{type:"next-round"}))},skip(){const v=d;v!==null&&(S(),f="none",v())},stop(){h=!0,S()}}}const Fx=["Du","Ben","Chris","Dana","Emil","Fee"],An=n=>Fx[n]??`Platz ${n}`,Ox={mage:"erster Magier",trump:"höchster Trumpf","led-suit":"höchste angespielte Farbe","jesters-only":"nur Narren — der erste gewinnt"},Bx=!window.matchMedia("(hover: hover)").matches,zx=new O(0,1.3,1.62),kx=new O(0,2,.75),Gx=new O(2.15,.05,.72),Wt=n=>{const e=document.getElementById(n);if(e===null)throw new Error(`Element #${n} fehlt im Dokument`);return e};let Po=null,Dn=null,Ca=!1,vr=null,Ts={onMenu:()=>{},onNewGame:()=>{},rankNote:()=>null};const Zn=new Map,fn=new Map;let Jn=null,sl=null,is=null;function Xu(){Dn?.reset(),Jn=null,sl=null;for(const n of Zn.values())n.remove();Zn.clear();for(const n of fn.values())n.parentElement?.remove();fn.clear()}function qu(){if(Po!==null||Ca)return;Ca=!0;const n=Wt("scene"),e=Z_(n);Po=e;const t=A_(e.reducedMotion,e.renderer.capabilities.getMaxAnisotropy());e.scene.add(t.group),e.onFrame(i=>{t.fit(e.camera),t.update(i)}),e.onFrame($u),g_(e.renderer.capabilities.getMaxAnisotropy()).then(i=>{const r=tx(e,i);e.scene.add(r.mesh),e.reducedMotion||e.onFrame(s=>r.update(s)),Dn=Nx(e,i,{onPick:s=>Yu(s),onHover:s=>{sl=s,Dn?.focus(s)},onEmptyClick:()=>vr?.skip()}),vr!==null&&Qi(vr,Ts)}).catch(i=>{console.error("Runecall: Die Kartentafel liess sich nicht laden.",i),Er("Die Kartenbilder fehlen — bitte neu laden.")}).finally(()=>{Ca=!1})}function Er(n){const e=Wt("toast");e.textContent=n,e.hidden=!1,e.classList.add("is-visible"),is!==null&&window.clearTimeout(is),is=window.setTimeout(()=>{e.classList.remove("is-visible"),is=window.setTimeout(()=>{e.hidden=!0},220)},1900)}function Qi(n,e){vr=n,Ts=e,qu();const t=n.state(),i=n.view(),r=n.waiting()==="trick";Wt("roundInfo").textContent=`Runde ${t.roundNumber} von ${t.totalRounds}`,As.clear(),Dn?.show(i,r),Hx(i,n),Vx(i),qx(i,n),$x(i,n),Kx(i,n),Jx(i,n),Qx(i,n,e),$u()}function Hx(n,e){const t=Wt("plates");for(const[i,r]of Zn)i<n.handSizes.length||(r.remove(),Zn.delete(i));for(let i=0;i<n.handSizes.length;i++){let r=Zn.get(i);const s=r===void 0;r===void 0&&(r=document.createElement("div"),r.className="plate",r.dataset.seat=String(i),r.innerHTML='<span class="plate__avatar" aria-hidden="true"></span><span class="plate__name"></span><span class="plate__tally"></span><span class="plate__score"></span>',Zn.set(i,r),t.append(r));const a=n.bids[i],o=a==null?"–":`${n.tricksWon[i]??0}/${a}`;rs(r,".plate__name",An(i)),rs(r,".plate__avatar",i===pt?"◆":An(i).slice(0,1)),rs(r,".plate__score",`${n.scores[i]??0}`),rs(r,".plate__tally",o)&&!s&&Wx(r);const l=n.phase==="round-end"||n.phase==="game-over",c=l&&a!==null&&a!==void 0&&(n.tricksWon[i]??0)===a;r.classList.toggle("is-me",i===pt),r.classList.toggle("is-dealer",i===n.dealer),r.classList.toggle("is-turn",Xx(n,i)&&e.waiting()!=="trick"),r.classList.toggle("is-winner",e.waiting()==="trick"&&n.lastTrick?.winner===i),r.classList.toggle("is-hit",c),r.classList.toggle("is-missed",l&&!c),r.title=i===n.dealer?"Geber":""}}function Vx(n){const e=Wt("trump");if(n.trumpCard===null){e.hidden=!0;return}const t=n.trumpSuit,i=t??"none";if(e.hidden=!1,e.dataset.suit===i)return;e.dataset.suit=i,e.className=`trump trump--${i}`,e.replaceChildren(),t!==null&&e.append(il(t));const r=document.createElement("span");r.textContent=t===null?"ohne Trumpf":`Trumpf ${mn[t].label}`,e.append(r)}function rs(n,e,t){const i=n.querySelector(e);return i===null||i.textContent===t?!1:(i.textContent=t,!0)}function Wx(n){n.classList.remove("is-bumped"),n.offsetWidth,n.classList.add("is-bumped")}function Xx(n,e){return n.phase==="trump-choice"?e===n.dealer:n.phase==="bidding"||n.phase==="playing"?e===n.turn:!1}function qx(n,e){const t=Wt("status"),i=Yx(n,e);t.textContent!==i&&(t.textContent=i,t.classList.remove("is-fresh"),t.offsetWidth,t.classList.add("is-fresh"))}function Yx(n,e){if(e.waiting()==="trick"&&n.lastTrick!==null){const{winner:t,reason:i}=n.lastTrick;return`${An(t)} gewinnt den Stich — ${Ox[i]}`}switch(n.phase){case"trump-choice":return n.dealer===pt?"Ein Magier liegt offen — wähle die Trumpffarbe.":`${An(n.dealer)} wählt die Trumpffarbe …`;case"bidding":return n.turn===pt?"Wie viele Stiche gewinnst du?":`${An(n.turn)} sagt an …`;case"playing":{const t=Io(n.currentTrick),i=t.suit!==null?`${mn[t.suit].label} angespielt`:t.settled?"keine Farbe angespielt — alle frei":n.currentTrick.length>0?"Farbe noch offen":"neuer Stich",r=n.turn===pt?"du bist am Zug":`${An(n.turn)} ist am Zug`;return`Stich ${n.trickNumber} von ${n.roundNumber} · ${i} · ${r}`}default:return""}}function $x(n,e){const t=Wt("actions");if(t.replaceChildren(),n.phase==="trump-choice"&&n.dealer===pt){for(const s of Cn){const a=document.createElement("button");a.type="button",a.className=`pill pill--${s}`,a.append(il(s),document.createTextNode(mn[s].label)),a.title=`${mn[s].label} — Rune ${mn[s].runeName}`,a.addEventListener("click",()=>e.chooseTrump(s)),t.append(a)}Ic(t);return}if(n.phase!=="bidding"||n.turn!==pt)return;const i=qc(n),r=e.settings.hint?Math.max(0,Math.min(n.roundNumber,Math.round(i))):null;for(let s=0;s<=n.roundNumber;s++){const a=document.createElement("button");a.type="button",a.className="pill",a.textContent=String(s),s===r&&(a.classList.add("is-suggested"),a.title="Vorschlag der Ansage-Hilfe"),a.addEventListener("click",()=>e.bid(s)),t.append(a)}if(Ic(t),r!==null){const s=document.createElement("span");s.className="actions__hint",s.textContent=`Deine Hand ist etwa ${i.toFixed(1)} Stiche wert`,t.append(s)}}function Ic(n){const e=Array.from(n.children).filter(s=>s instanceof HTMLElement),t=e.length;if(t===0)return;const i=640,r=Math.min(.66,.085*t);e.forEach((s,a)=>{const l=(t>1?a/(t-1)-.5:0)*r,c=Math.sin(l)*i,d=(1-Math.cos(l))*i;s.style.transform=`translate(-50%, -50%) translate(${c.toFixed(1)}px, ${d.toFixed(1)}px) rotate(${(l*180/Math.PI).toFixed(2)}deg)`,s.style.animationDelay=`${(a*.035).toFixed(3)}s`})}function Kx(n,e){const t=Wt("handKeys"),i=Fo(n.hand,n.trumpSuit),r=new Set(i.map(a=>a.id));for(const[a,o]of fn)r.has(a)||(o.parentElement?.remove(),fn.delete(a));Jn!==null&&!r.has(Jn)&&(Jn=null);const s=n.phase==="playing"&&n.turn===pt&&e.waiting()==="none";i.forEach((a,o)=>{let l=fn.get(a.id);if(l===void 0){const u=document.createElement("li");l=document.createElement("button"),l.type="button",l.className="handkey";const h=h_(a);h.classList.add("mobile-card-face"),h.setAttribute("aria-hidden","true"),l.append(h),l.addEventListener("click",()=>Yu(a.id)),l.addEventListener("focus",()=>Dn?.focus(a.id)),l.addEventListener("blur",()=>Dn?.focus(sl)),l.addEventListener("keydown",Zx),u.append(l),fn.set(a.id,l),t.append(u)}const c=s&&n.playable.includes(a.id),d=`Karte ${o+1} von ${i.length}`,f=s?c?", spielbar":", gesperrt":"";l.setAttribute("aria-label",`${Us(a)} — ${d}${f}`),l.setAttribute("aria-disabled",String(s&&!c)),l.dataset.card=a.id,l.classList.toggle("is-selected",Jn===a.id),l.tabIndex=s||window.matchMedia("(max-width: 900px)").matches?0:-1,t.append(l.parentElement)})}function Zx(n){if(n.key!=="ArrowLeft"&&n.key!=="ArrowRight")return;const e=Array.from(fn.values()).filter(r=>r.tabIndex===0),t=e.indexOf(n.currentTarget);if(t<0||e.length===0)return;n.preventDefault();const i=n.key==="ArrowLeft"?-1:1;e[(t+i+e.length)%e.length]?.focus()}function Yu(n){const e=vr;if(e===null)return;const t=e.view(),i=t.hand.find(s=>s.id===n);if(i===void 0)return;if(t.phase!=="playing"||t.turn!==pt||e.waiting()!=="none"){Qi(e,Ts);return}const r=Uo(i,t.hand,t.currentTrick);if(r!==null){Er(`Du musst ${mn[r.suit].label} bedienen`),Qi(e,Ts);return}if((Bx||window.matchMedia("(max-width: 900px)").matches)&&Jn!==n){Jn=n,Dn?.select(n);for(const[s,a]of fn)a.classList.toggle("is-selected",s===n);Er(`${Us(i)} — noch einmal tippen zum Ausspielen`);return}Jn=null,Dn?.select(null),e.play(n)}function Jx(n,e){const t=Wt("counting");if(!e.settings.counting){t.hidden=!0;return}t.hidden=!1,t.replaceChildren();const i=document.createElement("span");if(i.className="counting__title",i.textContent="In dieser Runde gefallen",t.append(i),n.playedCards.length===0){const s=document.createElement("span");s.className="counting__none",s.textContent="noch nichts",t.append(s);return}const r=document.createElement("div");r.className="counting__row";for(const s of Fo(n.playedCards,n.trumpSuit)){const a=document.createElement("span");a.className="chip",s.kind==="pip"&&a.classList.add(`chip--${s.suit}`),a.textContent=s.kind==="pip"?String(s.value):s.kind==="mage"?"★":"?",a.title=Us(s),r.append(a)}t.append(r)}function Qx(n,e,t){const i=Wt("overlay");if(n.phase!=="round-end"&&n.phase!=="game-over"){i.hidden=!0,i.replaceChildren();return}i.hidden=!1,i.replaceChildren();const r=document.createElement("div");r.className="sheet";const s=document.createElement("h2");s.textContent=n.phase==="game-over"?"Partie zu Ende":`Runde ${n.roundNumber} gewertet`,r.append(s);const a=document.createElement("p");a.className="sheet__note",a.textContent=jx(n),r.append(a);const o=n.phase==="game-over"?t.rankNote():null;if(o!==null){const u=document.createElement("p");u.className="sheet__rank",u.textContent=o,r.append(u)}const l=document.createElement("table");l.className="sheet__table",l.innerHTML="<thead><tr><th>Spieler</th><th>Ansage</th><th>Stiche</th><th>Runde</th><th>Gesamt</th></tr></thead>";const c=document.createElement("tbody"),d=n.scores.map((u,h)=>({seat:h,score:u})).sort((u,h)=>h.score-u.score);for(const{seat:u,score:h}of d){const x=n.bids[u]??0,S=n.tricksWon[u]??0,m=No(x,S),p=document.createElement("tr");u===pt&&(p.className="is-me"),x===S&&p.classList.add("is-hit");for(const v of[An(u),String(x),String(S)]){const T=document.createElement("td");T.textContent=v,p.append(T)}const R=document.createElement("td");R.className=m>=0?"is-gain":"is-loss",R.textContent=m>0?`+${m}`:String(m),p.append(R);const P=document.createElement("td");P.textContent=String(h),p.append(P),c.append(p)}l.append(c),r.append(l);const f=document.createElement("div");if(f.className="sheet__actions",n.phase==="round-end"){const u=document.createElement("button");u.type="button",u.textContent="Nächste Runde",u.addEventListener("click",()=>e.nextRound()),f.append(u)}else{const u=document.createElement("button");u.type="button",u.textContent="Neue Partie",u.addEventListener("click",t.onNewGame);const h=document.createElement("button");h.type="button",h.className="ghost",h.textContent="Menü",h.addEventListener("click",t.onMenu),f.append(u,h)}r.append(f),i.append(r)}function jx(n){if(n.phase==="game-over"){const o=Vc(n.scores),l=n.scores[o[0]??0]??0;if(o.length>1){const d=o.map(An);return`Geteilter Sieg für ${d.slice(0,-1).join(", ")} und ${d.at(-1)} — ${l} Punkte.`}const c=o[0]??0;return c===pt?`Du gewinnst mit ${l} Punkten.`:`${An(c)} gewinnt mit ${l} Punkten.`}const e=n.bids[pt]??0,t=n.tricksWon[pt]??0,i=No(e,t);if(e===t)return`Ansage getroffen — ${i} Punkte dazu.`;const r=Math.abs(t-e),s=r===1?"Ein Stich":`${r} Stiche`,a=t>e?"zu viel":"zu wenig";return`${s} ${a} — ${Math.abs(i)} Punkte ab.`}const mi=new Fe;function $u(){const n=Dn,e=Po;if(e===null)return;if(window.matchMedia("(max-width: 900px)").matches){for(const a of Zn.values())a.style.visibility="";for(const a of fn.values())a.style.visibility="";return}Lo(Wt("actions"),e.toScreen(zx,mi)),Pa(Wt("status"),e.toScreen(kx,mi));const t=Wt("trump");if(t.hidden||Pa(t,e.toScreen(Gx,mi)),n===null)return;for(const[a,o]of Zn){const l=n.seatAt(a,mi);o.style.visibility=l===null?"hidden":"",l!==null&&Pa(o,l)}const i=n.cardSize(),r=`${i.width.toFixed(0)}px`,s=`${i.height.toFixed(0)}px`;for(const[a,o]of fn){const l=n.cardAt(a,mi);o.style.visibility=l===null?"hidden":"",l!==null&&Lo(o,l),o.style.width!==r&&(o.style.width=r,o.style.height=s)}}function Lo(n,e){n.style.transform=`translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px) translate(-50%, -50%)`}const Uc=10;function Pa(n,e){const t=ev(n);mi.set(Nc(e.x,t.width/2,window.innerWidth),Nc(e.y,t.height/2,window.innerHeight)),Lo(n,mi)}function Nc(n,e,t){const i=e+Uc,r=t-e-Uc;return i>r?t/2:rl(n,i,r)}const As=new Map;function ev(n){const e=As.get(n);if(e!==void 0)return e;const t={width:n.offsetWidth,height:n.offsetHeight};return As.set(n,t),t}window.addEventListener("resize",()=>As.clear());const tv=3800,nv=1400;function iv(n,e){let t="home",i=null,r="",s=null,a="searching",o=!1;function l(E){e.change(E),h()}function c(){const E=n.closest(".menu");return E!==null&&!E.hasAttribute("hidden")}function d(){i!==null&&window.clearTimeout(i),i=null}function f(E){d(),t=E,E!=="join"&&(r="",s=null),E!=="quit"&&(o=!1),h()}function u(){f({home:"home",play:"home",search:"play",queue:"search",create:"home",join:"play",settings:"home",quit:"home"}[t])}function h(){n.replaceChildren(x()),n.closest(".menu__panel")?.classList.toggle("is-deep",t!=="home")}function x(){switch(t){case"home":return S();case"play":return m();case"search":return p();case"queue":return R();case"create":return v();case"join":return T();case"settings":return L();case"quit":return _()}}function S(){const E=Wn();return e.hasSave()&&E.append(ui("Partie fortsetzen","Da steht noch eine angefangene Partie",e.resume)),E.append(ui("Spielen","Zu Freunden dazustoßen oder Mitspieler suchen",()=>f("play")),ui("Spiel erstellen","Eigener Raum mit Code — alle Regeln frei",()=>f("create")),ui("Einstellungen","Tempo und Hilfen",()=>f("settings")),ui("Spiel beenden",null,()=>f("quit"),{ghost:!0}),b()),E}function m(){const E=Wn("Spielen");return E.append(ui("Freund beitreten","Mit dem Raumcode in die Partie eines Freundes",()=>f("join")),ui("Spielersuche","Gewertete Partie gegen fremde Spieler",()=>f("search")),U()),E}function p(){const E=Wn("Spielersuche"),I=Na(),G=document.createElement("button");G.type="button",G.className="mode",G.addEventListener("click",()=>{a="searching",f("queue"),P()});const Y=document.createElement("div");Y.className="mode__head",Y.append(Ge("b","mode__title","Ranked"),Ge("span","mode__badge","Gewertet"));const k=document.createElement("ul");k.className="mode__rules";for(const z of[`Immer ${as} Spieler`,`Immer ${La} Runden`,"Bots nur für Plätze, die frei bleiben"])k.append(Ge("li",null,z));const K=document.createElement("div");return K.className="mode__points",os.forEach((z,te)=>{const re=Ge("span","mode__point");re.append(Ge("small",null,`${te+1}.`),Ge("b",z>=0?"is-gain":"is-loss",z>0?`+${z}`:String(z))),K.append(re)}),G.append(Y,k,K,Ge("span","mode__go","Spielersuche starten")),E.append(G,b(),U()),I.games===0&&E.append(pr("Deine erste gewertete Partie entscheidet, wo du anfängst — verlieren kostet hier noch nichts.")),E}function R(){const E=Wn("Ranked"),I=Ge("div","queue"),G=Ge("div","queue__runes");for(const k of["◆","◆","◆"])G.append(Ge("span",null,k));return I.append(G,Ge("p","queue__state",a==="searching"?"Suche Mitspieler …":"Keine weiteren Spieler gefunden — Bots übernehmen die freien Plätze."),Ge("p","queue__count",`1 von ${as} Plätzen besetzt`)),E.append(I),a==="searching"&&E.append(Xn([Ot("Suche abbrechen",()=>f("search"),{ghost:!0})])),E.append(pr(`Gewertet: ${as} Spieler, ${La} Runden, fester Regelsatz. Der Platz am Ende zählt für deinen Rang.`)),E}function P(){d(),i=window.setTimeout(()=>{a="filling",h(),i=window.setTimeout(()=>e.start(wd()),nv)},tv)}function v(){const E=e.settings(),I=Wn("Spiel erstellen"),G=E.roomCode??Ia(),Y=Ge("div","room");Y.append(Ge("span","room__label","Raumcode"),Ge("b","room__code",G));const k=Ge("div","room__actions");k.append(Ot("Kopieren",()=>{navigator.clipboard?.writeText(G).then(()=>Er(`Raumcode ${G} kopiert`)).catch(()=>Er("Kopieren ging nicht — Code abtippen"))},{ghost:!0,small:!0}),Ot("Neuer Code",()=>{l({roomCode:Ia()})},{ghost:!0,small:!0})),Y.append(k),I.append(Y);const K=Do(E.playerCount);return I.append(ss("Spieler","01",[3,4,5,6].map(z=>({label:String(z),value:z})),E.playerCount,z=>l({playerCount:z})),ss("Runden","02",[...[3,5,8,10].filter(z=>z<K).map(rv),{label:`Alle (${K})`,value:null}],E.rounds!==null&&E.rounds<K?E.rounds:null,z=>l({rounds:z})),ss("Gegner","03",Md.map(z=>({label:Bd[z],value:z})),E.difficulty,z=>l({difficulty:z}))),I.append(Xn([Ot("Partie starten",()=>{const z=e.settings();e.start(Rd({playerCount:z.playerCount,difficulty:z.difficulty,rounds:z.rounds,roomCode:z.roomCode??G}))}),Ot("Zurück",u,{ghost:!0})]),pr("Freie Plätze übernehmen Bots — du kannst also sofort allein anfangen. Diese Partie ist nicht gewertet und gibt keine Rangpunkte.")),I}function T(){const E=Wn("Freund beitreten"),I=Ge("div","code"),G=document.createElement("input");return G.type="text",G.className="code__input",G.autocomplete="off",G.spellcheck=!1,G.maxLength=Wi,G.placeholder="·".repeat(Wi),G.setAttribute("aria-label","Raumcode"),G.value=r,G.addEventListener("input",()=>{r=$c(G.value),r!==G.value&&(G.value=r)}),G.addEventListener("keydown",Y=>{Y.key==="Enter"&&y()}),I.append(G),E.append(Ge("p","menu__lead","Dein Freund erstellt den Raum und sagt dir den Code."),I,Xn([Ot("Beitreten",y),Ot("Zurück",u,{ghost:!0})])),s!==null&&(E.append(pr(s,"is-warn")),E.append(Xn([Ot("Stattdessen eigenen Raum erstellen",()=>f("create"),{ghost:!0})]))),queueMicrotask(()=>G.focus()),E}function y(){const E=r;if(!Pd(E)){s=`Ein Raumcode hat ${Wi} Zeichen — ${E.length} ${E.length===1?"ist":"sind"} es bisher.`,h();return}s=`Kein Raum mit dem Code ${E} erreichbar. Partien zwischen zwei Geräten brauchen den Runecall-Server — der läuft noch nicht.`,h()}function L(){const E=e.settings(),I=Wn("Einstellungen");I.append(ss("Tempo","01",zd.map(Y=>({label:Y.label,value:Y.ms})),E.speed,Y=>l({speed:Y})));const G=Ge("div","menu__switches");return G.append(Fc("Ansage-Hilfe — schätzt deine Handstärke",E.hint,Y=>l({hint:Y})),Fc("Kartenzähl-Hilfe — zeigt gefallene Karten",E.counting,Y=>l({counting:Y}))),I.append(G,Xn([Ot("Zurück",u,{ghost:!0})])),I.append(pr("Tempo und Hilfen gelten sofort, auch in einer laufenden Partie.")),I}function _(){const E=Wn("Spiel beenden");return o?(E.append(Ge("p","menu__lead","Bis bald — du kannst den Tab jetzt schließen."),Xn([Ot("Doch weiterspielen",()=>f("home"),{ghost:!0})])),E):(E.append(Ge("p","menu__lead","Runecall beenden?"),Xn([Ot("Beenden",()=>{o=!0,e.quit(),h()}),Ot("Zurück",u,{ghost:!0})])),E)}function b(){const E=Na(),I=Ge("div","rankstrip");I.append(Ge("span","rankstrip__tier",Kc(E.points)),Ge("b","rankstrip__points",`${E.points} RP`));const G=Nd(E.points);return I.append(Ge("span","rankstrip__note",E.games===0?"noch keine gewertete Partie":`${E.games} ${E.games===1?"Partie":"Partien"} · ${E.wins} ${E.wins===1?"Sieg":"Siege"}${G===null?"":` · ${G.from-E.points} bis ${G.name}`}`)),I}function U(){return Xn([Ot("Zurück",u,{ghost:!0})])}return document.addEventListener("keydown",E=>{E.key==="Escape"&&c()&&t!=="home"&&(E.preventDefault(),u())}),{open(E){f(E??"home")},close(){d()},screen:()=>t}}function Ge(n,e,t){const i=document.createElement(n);return e!=null&&(i.className=e),t!==void 0&&(i.textContent=t),i}function Wn(n){const e=Ge("div","menu__stack");return n!==void 0&&e.append(Ge("h2","menu__heading",n)),e}function pr(n,e){return Ge("p",e===void 0?"menu__note":`menu__note ${e}`,n)}function Xn(n){const e=Ge("div","menu__actions");return e.append(...n),e}function Ot(n,e,t={}){const i=document.createElement("button");return i.type="button",i.textContent=n,t.ghost===!0&&i.classList.add("ghost"),t.small===!0&&i.classList.add("small"),i.addEventListener("click",e),i}function ui(n,e,t,i={}){const r=Ot("",t,i);return r.classList.add("bigbtn"),r.append(Ge("b",null,n)),e!==null&&r.append(Ge("small",null,e)),r}function Fc(n,e,t){const i=document.createElement("label");i.className="switch";const r=document.createElement("input");return r.type="checkbox",r.checked=e,r.addEventListener("change",()=>t(r.checked)),i.append(r,Ge("span",null,n)),i}const rv=n=>({label:String(n),value:n});function ss(n,e,t,i,r){const s=Ge("div","menu__group"),a=Ge("span","menu__label");a.append(Ge("small",null,e),document.createTextNode(n)),s.append(a);const o=Ge("div","choices");for(const l of t){const c=document.createElement("button");c.type="button",c.className="pill",c.textContent=l.label,c.setAttribute("aria-pressed",String(l.value===i)),l.value===i&&c.classList.add("is-active"),c.addEventListener("click",()=>r(l.value)),o.append(c)}return s.append(o),s}const ji=n=>{const e=document.getElementById(n);if(e===null)throw new Error(`Element #${n} fehlt im Dokument`);return e};let Vi={...Jc,...Gd()},In=null,Ns=null,ws=!1;const Ku=iv(ji("menuScreen"),{settings:()=>Vi,change(n){Vi={...Vi,...n},jc(Vi),In!==null&&Qi(In,al)},hasSave:()=>eu()!==null,resume:sv,start:Ju,quit:ov});function yr(n){In?.stop(),In=null,ji("menu").hidden=!1,ji("table").hidden=!0,Ku.open(n)}function Zu(n){Ku.close(),In=n,ji("menu").hidden=!0,ji("table").hidden=!1,Qi(n,al)}function Ju(n){In?.stop(),Xu(),tu(),Ns=null,ws=!1;const e=Math.floor(Math.random()*2147483647);Zu(Wu({settings:Vi,match:n,seed:e},Qu))}function sv(){const n=eu();if(n===null){yr("home");return}In?.stop(),Xu(),Ns=null,ws=!1,Zu(Wu({settings:Vi,match:n.match,seed:n.seed,resume:n.state},Qu))}function Qu(){const n=In;n!==null&&(av(n),Qi(n,al))}function av(n){if(ws||n.match.mode!=="ranked")return;const e=n.state();if(e.phase!=="game-over")return;ws=!0;const t=Od(Id(e.scores,pt)),i=`${t.rank.points} RP (${Kc(t.rank.points)})`;Ns=t.delta===0?`${t.place}. Platz — unter null geht es nicht, du bleibst bei ${i}.`:`${t.place}. Platz — ${t.delta>0?"+":""}${t.delta} Rangpunkte. Du stehst bei ${i}.`}const al={onMenu:()=>{tu(),yr("home")},onNewGame:()=>{const n=In?.match;if(n===void 0)return yr("home");Ju(n)},rankNote:()=>Ns};ji("btnMenu").addEventListener("click",()=>yr("home"));function ov(){window.close()}yr("home");qu();
