// Würfelglück: original, font-independent pixel emblems on a 32 × 32 grid.
// Render once, then share the same silhouette between cards and small UI slots.
(function (global) {
  'use strict';
  const A = global.BalatroFX.Art;
  const cache = new Map();
  const INK = '#202C36', PAPER = '#F5E9CF', GOLD = '#E8B65B', COOL = '#96C9CD';

  // Four deliberately chosen tones per material: shadow, body, light, glint.
  // Hue shifts in the shadows keep the sprites in the game's saturated palette.
  const materials = {
    ivory: ['#9A899C','#E4DECC','#FFF4DB','#FFFFFF'],
    steel: ['#334564','#708CA5','#B5D5DD','#EBFAF4'],
    gold: ['#8C462D','#DB943D','#FFD56B','#FFF0B2'],
    green: ['#174D49','#32936A','#77CF83','#D0ED9A'],
    red: ['#6D283F','#C34A55','#FF8575','#FFD1A3'],
    blue: ['#313B80','#487EC3','#80CBEC','#D4F7FA'],
    violet: ['#442D67','#8859B3','#C48AE0','#F6D6FF'],
    leather: ['#4B3041','#956047','#D2995E','#F1D398'],
    charcoal: ['#171D32','#35394E','#63627F','#A9A0AD'],
  };
  const materialById = {};
  function useMaterial(ids, body, detail='gold', secondary='steel') {
    ids.split(' ').forEach(id => { materialById[id] = [body,detail,secondary]; });
  }
  useMaterial('clover seedling loaded_clover lucky_dividend chameleon dragons_hoard slow_steady hybrid_seed', 'green','gold','green');
  useMaterial('vault anchor pruning weighted_dice iron_focus scaffold clockwork evens_club smith lockbox', 'steel');
  useMaterial('piggy_bank fury blood_pact hellfire devils_deal magnet', 'red','gold','ivory');
  useMaterial('crystal_ball hex metamorphosis spiral', 'violet','gold','violet');
  useMaterial('backpack suitcase hoarder grave_digger jacobs_ladder heirloom ash_urn hex_bag', 'leather','gold','red');
  useMaterial('black_cat odd_fellow tycoon', 'charcoal','red','violet');
  useMaterial('telescope trophy_case number_king miser coin golden_rule compound market_day jackpot', 'gold','gold','red');
  useMaterial('cold_storage azure refraction purist mirror moonstone', 'ivory','gold','blue');
  useMaterial('overdraft overdrive dial', 'steel','green','red');
  useMaterial('snake_eyes', 'green','red','green');
  useMaterial('jonny_glasses off_record', 'charcoal','gold','blue');
  useMaterial('mood_ring jonny_autograph', 'gold','gold','violet');

  function shadeSprite(ctx, id) {
    const data = ctx.getImageData(0,0,32,32), src = new Uint8ClampedArray(data.data), out = data.data;
    const palette = (materialById[id] || ['ivory','gold','steel']).map(m => materials[m]);
    const rgb = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
    const keys = [PAPER,GOLD,COOL].map(rgb), ramps = palette.map(r=>r.map(rgb));
    const same = (x,y,k) => x>=0 && y>=0 && x<32 && y<32 && src[(y*32+x)*4+3] && keys[k].every((v,i)=>src[(y*32+x)*4+i]===v);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
      const i=(y*32+x)*4;if(!src[i+3])continue;
      const k=keys.findIndex(c=>c.every((v,j)=>src[i+j]===v));if(k<0)continue;
      // Broad light clusters, no random noise or gradient smoothing.
      let tone = 1;
      if(!same(x,y+1,k) || !same(x+1,y,k)) tone=0;
      if(!same(x,y-1,k) && same(x,y+1,k)) tone=2;
      if(!same(x-1,y,k) && same(x+1,y,k) && tone!==0) tone=2;
      if(tone===2 && !same(x,y-1,k) && !same(x-1,y,k)) tone=3;
      const c=ramps[k][tone];out[i]=c[0];out[i+1]=c[1];out[i+2]=c[2];
    }
    ctx.putImageData(data,0,0);
  }

  function painter(ctx) {
    const rect = (x, y, w, h, c = PAPER) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const line = (x, y, xx, yy, c = PAPER, w = 2) => {
      const dx = Math.abs(xx - x), dy = -Math.abs(yy - y), sx = x < xx ? 1 : -1, sy = y < yy ? 1 : -1;
      let e = dx + dy;
      for (;;) { rect(x, y, w, w, c); if (x === xx && y === yy) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
    };
    const poly = (points, c = PAPER) => {
      // Pixel-centre fill keeps all edges on the same grid, with no antialiasing.
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [a, b] = points[i], [u, v] = points[j];
          if ((b > y + .5) !== (v > y + .5) && x + .5 < (u - a) * (y + .5 - b) / (v - b) + a) inside = !inside;
        }
        if (inside) rect(x, y, 1, 1, c);
      }
    };
    const disc = (x, y, r, c = PAPER) => {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) rect(x + i, y + j, 1, 1, c);
    };
    const ring = (x, y, r, c = PAPER) => { disc(x, y, r, c); disc(x, y, r - 2, INK); };
    const star = (x = 16, y = 15, r = 9, c = GOLD) => poly([[x,y-r],[x+3,y-3],[x+r,y],[x+3,y+3],[x,y+r],[x-3,y+3],[x-r,y],[x-3,y-3]], c);
    const die = (x = 7, y = 7, n = 5, s = 18, c = PAPER) => {
      rect(x+1,y,s-2,s,c);rect(x,y+1,s,s-2,c);
      rect(x+2,y+1,s-4,1,'#FFF7DF');rect(x+1,y+2,1,s-5,'#FFF7DF');
      rect(x+2,y+s-2,s-3,1,'#8A8EA5');rect(x+s-2,y+2,1,s-4,'#8A8EA5');
      const q = Math.max(1, Math.floor(s/7)), a = Math.floor(s*.23), b = Math.floor(s*.66), m = Math.floor(s*.45);
      const dot = (i,j) => rect(x+i,y+j,q,q,INK);
      if(n%2)dot(m,m);if(n>=2){dot(a,a);dot(b,b);}if(n>=4){dot(b,a);dot(a,b);}if(n===6){dot(a,m);dot(b,m);}
    };
    const coin = (x = 16, y = 16, r = 10) => {
      disc(x,y+1,r,'#75412E');disc(x,y,r,GOLD);disc(x,y,r-2,'#FFE28A');disc(x,y,r-3,'#CD8737');
      rect(x-1,y-r+3,2,Math.max(3,r*2-5),'#FFE7A0');
      if(r>6){rect(x-3,y-3,6,2,'#FFE7A0');rect(x-3,y+2,6,2,'#FFE7A0');rect(x-3,y-2,2,2,'#FFE7A0');rect(x+1,y,2,3,'#FFE7A0');}
      rect(x-r+3,y-r+3,2,2,'#FFF6CB');
    };
    const skull = (x = 6, y = 6) => {
      poly([[x+5,y],[x+14,y],[x+18,y+3],[x+20,y+8],[x+18,y+14],[x+15,y+15],[x+15,y+21],[x+5,y+21],[x+5,y+15],[x+2,y+14],[x,y+8],[x+2,y+3]],PAPER);
      rect(x+3,y+7,6,5,INK);rect(x+12,y+7,6,5,INK);
      rect(x+4,y+8,4,2,'#58445A');rect(x+13,y+8,4,2,'#58445A');
      poly([[x+10,y+11],[x+7,y+15],[x+12,y+15]],INK);
      line(x+6,y+17,x+14,y+17,'#9D8990',1);rect(x+7,y+18,1,3,INK);rect(x+11,y+18,1,3,INK);
      line(x+5,y+2,x+12,y+2,'#FFFFED',1);
    };
    const sprout = () => {
      poly([[4,25],[10,22],[22,22],[29,26],[26,30],[7,30]],'#785142');rect(9,25,14,2,'#B18055');
      line(15,26,15,12,COOL,3);poly([[15,18],[6,16],[3,10],[4,7],[12,9],[17,15]],PAPER);
      poly([[17,14],[18,7],[26,3],[29,4],[27,11],[21,16]],COOL);
      line(6,10,13,15,'#B4E886',1);line(20,11,26,6,'#B4E886',1);
    };
    const clover = () => {
      line(16,17,18,27,COOL,3);line(18,27,23,29,COOL);
      poly([[15,15],[7,14],[3,9],[4,5],[8,3],[12,5],[15,11]],PAPER);
      poly([[17,15],[18,7],[23,3],[27,4],[29,8],[26,12],[21,15]],COOL);
      poly([[15,17],[7,17],[3,22],[5,27],[10,28],[14,24]],COOL);
      poly([[17,17],[24,17],[28,21],[27,26],[23,28],[19,24]],PAPER);
      line(8,7,14,13,'#B0E89B',1);line(24,7,19,13,'#B0E89B',1);
      line(8,24,13,19,'#B0E89B',1);disc(16,16,2,'#D6F4B1');
    };
    const bag = () => {poly([[9,3],[23,3],[20,10],[26,17],[27,25],[23,29],[9,29],[5,25],[6,17],[12,10]]);rect(10,10,12,3,GOLD);line(9,18,9,25,'#D5B089',2);line(23,19,23,26,'#64444F',2);};
    const crown = () => {poly([[3,8],[11,14],[16,4],[21,14],[29,8],[25,27],[7,27]],GOLD);rect(8,22,16,4,'#D77E35');rect(9,23,14,1,'#FFE29A');disc(16,17,3,'#823647');rect(15,15,2,3,'#FF8C80');rect(8,17,2,3,COOL);rect(23,17,2,3,COOL);};
    const arrow = (x = 16, y = 4) => {poly([[x,y],[x+7,y+7],[x+2,y+7],[x+2,y+18],[x-2,y+18],[x-2,y+7],[x-7,y+7]],GOLD);};
    const loop = () => {line(7,9,25,9);line(25,9,25,18);poly([[20,14],[29,14],[25,21]],GOLD);line(24,24,6,24);line(6,24,6,15);poly([[2,18],[11,18],[6,11]],GOLD);};
    const gem = () => {
      poly([[9,5],[23,5],[30,13],[16,29],[2,13]],COOL);
      poly([[9,5],[16,5],[11,13],[2,13]],'#B7EFF5');
      poly([[16,5],[23,5],[21,13],[11,13]],'#E9FDFF');
      poly([[21,13],[30,13],[16,29]],'#4C62B5');
      poly([[11,13],[21,13],[16,29]],'#6DB7E5');
      line(3,13,29,13,'#D1F7FF',1);rect(8,7,3,2,'#FFFFFF');
    };
    const jar = () => {rect(9,4,14,4,GOLD);rect(7,10,18,17);rect(10,12,12,12,INK);coin(16,19,4);};
    const eye = () => {poly([[1,16],[8,8],[16,5],[24,8],[31,16],[24,24],[16,27],[8,24]],GOLD);poly([[3,16],[10,10],[22,10],[29,16],[22,22],[10,22]],PAPER);disc(16,16,7,'#477BBA');disc(16,16,5,'#81D5DF');disc(16,16,3,INK);rect(13,12,3,3,'#FFFFFF');};
    const clock = () => {ring(16,16,11);line(16,9,16,16,GOLD);line(16,16,22,19,GOLD);};
    const anchor = () => {ring(16,6,3,GOLD);line(16,10,16,27);line(9,14,23,14);line(5,20,8,25);line(8,25,16,28);line(16,28,24,25);line(24,25,27,20);};
    const heart = () => poly([[3,12],[3,7],[7,4],[12,4],[16,9],[20,4],[25,4],[29,7],[29,12],[16,27]],GOLD);
    const bolt = () => poly([[17,3],[7,18],[15,18],[12,29],[26,12],[18,12],[22,3]],GOLD);
    const book = () => {rect(5,5,22,23);rect(8,7,2,19,GOLD);rect(13,10,10,2,INK);rect(13,15,7,2,INK);};
    return {rect,line,poly,disc,ring,star,die,coin,skull,sprout,clover,bag,crown,arrow,loop,gem,jar,eye,clock,anchor,heart,bolt,book};
  }

  // One authored motif per card ID. Related effects share visual vocabulary.
  const motifs = {
    // Jonny: dicke eckige Brille, geschwärzte Akte, Stimmungsring, Autogramm
    jonny_glasses: p => {
      p.rect(1,10,13,12,PAPER);p.rect(18,10,13,12,PAPER);p.rect(3,12,9,8,COOL);p.rect(20,12,9,8,COOL);
      p.rect(13,13,6,3,PAPER);p.rect(4,13,3,2,'#FFFFFF');p.rect(21,13,3,2,'#FFFFFF');
      p.star(26,5,4,GOLD);p.rect(25,4,2,2,'#FFFFFF');
    },
    off_record: p => {
      p.rect(6,3,20,27,PAPER);p.rect(8,5,16,1,'#FFF9E7');
      p.rect(9,8,14,3,INK);p.rect(9,14,9,3,INK);p.rect(20,14,3,3,COOL);p.rect(9,20,13,3,INK);
      p.poly([[17,22],[30,18],[31,22],[19,27]],GOLD);p.rect(27,19,2,2,'#FFF0B2');
    },
    mood_ring: p => {
      p.ring(16,21,9,GOLD);p.disc(16,10,6,COOL);p.disc(16,10,4,'#B7EFF5');
      p.rect(13,9,2,2,INK);p.rect(18,9,2,2,INK);p.rect(14,12,5,1,INK);p.rect(13,7,2,1,'#FFFFFF');
    },
    jonny_autograph: p => {
      p.rect(4,5,24,22,PAPER);p.rect(6,7,20,1,'#FFF9E7');
      p.line(7,19,10,13,INK,1);p.line(10,13,12,20,INK,1);p.line(12,20,15,14,INK,1);p.line(15,14,17,19,INK,1);p.line(17,19,22,15,INK,1);p.line(22,15,25,17,INK,1);
      p.line(8,23,24,22,COOL,1);p.star(25,8,4,GOLD);
    },
    snake_eyes: p => {p.line(8,24,23,24,COOL,4);p.line(23,24,23,15,COOL,4);p.line(23,15,8,15,COOL,4);p.line(8,15,8,6,COOL,4);p.rect(8,5,16,7);p.rect(12,7,2,2,INK);p.rect(20,7,2,2,INK);},
    evens_club: p => {p.line(16,5,16,26,GOLD);p.line(5,10,26,10);p.line(7,10,4,18);p.line(7,10,11,18);p.line(24,10,20,18);p.line(24,10,28,18);p.rect(3,19,10,3,COOL);p.rect(19,19,10,3,COOL);p.rect(10,27,14,2);},
    odd_fellow: p => {p.rect(9,6,15,18);p.rect(5,24,24,3);p.rect(9,19,15,4,GOLD);p.rect(12,8,2,8,COOL);},
    big_six: p => {p.die(4,4,6,24);},
    clover: p => p.clover(),
    twin_peaks: p => {p.poly([[1,26],[11,6],[23,26]],COOL);p.poly([[13,26],[22,9],[31,26]]);p.poly([[7,14],[11,6],[15,14]],GOLD);},
    triple_threat: p => {p.line(16,4,16,28,GOLD);p.line(6,7,6,16);p.line(26,7,26,16);p.line(6,16,16,21);p.line(26,16,16,21);p.poly([[2,8],[6,2],[10,8]]);p.poly([[22,8],[26,2],[30,8]]);},
    stairway: p => {p.poly([[3,27],[3,22],[9,22],[9,16],[15,16],[15,10],[21,10],[21,4],[28,4],[28,27]]);p.line(5,18,20,3,GOLD);},
    steady_hand: p => {p.rect(9,13,16,12);p.rect(8,8,3,12);p.rect(13,4,3,15);p.rect(18,5,3,14);p.rect(23,9,3,13);p.poly([[9,18],[4,13],[2,16],[9,27],[22,27]]);p.rect(12,27,10,3,GOLD);},
    gambler: p => {p.die(3,5,3,16,COOL);p.die(13,14,5,16);},
    loaded: p => {p.loop();p.die(11,12,1,10);},
    patience: p => {p.rect(6,3,20,3,GOLD);p.rect(6,27,20,3,GOLD);p.poly([[8,7],[24,7],[17,16],[24,26],[8,26],[15,16]]);p.poly([[11,9],[21,9],[16,14]],GOLD);p.poly([[11,25],[16,20],[21,25]],GOLD);},
    upper_bonus: p => {p.arrow(16,2);p.rect(4,25,24,4);p.rect(7,21,3,4,COOL);p.rect(22,21,3,4,COOL);},
    piggy_bank: p => {p.disc(15,17,10);p.rect(23,14,6,7);p.poly([[19,9],[23,4],[25,13]],GOLD);p.rect(9,25,4,4);p.rect(20,25,4,4);p.rect(12,8,7,2,INK);p.rect(22,13,2,2,INK);p.line(4,15,2,11,GOLD);},
    last_chance: p => {p.rect(4,7,24,18);p.rect(3,13,4,6,INK);p.rect(25,13,4,6,INK);p.star(16,16,7);},
    compound: p => {p.rect(4,23,5,6,COOL);p.rect(12,18,5,11);p.rect(20,12,5,17,GOLD);p.line(4,17,25,4);p.poly([[20,3],[28,3],[28,11]],GOLD);},
    miser: p => {p.coin(12,20,8);p.coin(20,11,8);},
    market_day: p => {p.rect(5,13,22,15);p.rect(9,17,6,11,INK);p.poly([[3,12],[7,4],[25,4],[29,12]],GOLD);p.rect(11,5,3,7,INK);p.rect(20,5,3,7,INK);},
    tip_jar: p => p.jar(),
    tycoon: p => {p.poly([[4,27],[7,10],[13,8],[16,15],[19,8],[25,10],[28,27]]);p.poly([[13,9],[19,9],[16,14]],GOLD);p.poly([[16,15],[19,23],[16,27],[13,23]],GOLD);},
    favorite: p => {p.ring(16,16,12,COOL);p.ring(16,16,7);p.disc(16,16,2,GOLD);p.line(18,13,27,4,GOLD);},
    opposites: p => {p.die(2,4,1,14);p.die(17,15,6,14,COOL);p.line(7,26,12,26,GOLD);p.line(20,6,25,6,GOLD);},
    jacobs_ladder: p => {p.line(8,4,8,28);p.line(23,4,23,28);for(let y=7;y<28;y+=6)p.line(10,y,21,y,GOLD);},
    number_king: p => {p.crown();p.rect(13,15,6,5,INK);p.rect(15,16,2,3,PAPER);},
    signature: p => {p.poly([[5,26],[10,12],[24,3],[29,8],[20,22]],PAPER);p.line(8,24,23,9,INK);p.rect(5,28,23,2,GOLD);},
    encore: p => {p.loop();p.rect(12,13,3,8);p.rect(18,13,3,8);},
    gap_jumper: p => {p.rect(3,25,8,4);p.rect(22,25,8,4);p.line(5,19,12,10);p.line(12,10,21,10);p.line(21,10,26,17);p.poly([[20,17],[29,17],[26,23]],GOLD);},
    variety: p => {p.die(3,4,1,12,COOL);p.die(17,4,2,12,GOLD);p.die(3,18,3,12);p.die(17,18,4,12,COOL);},
    combo: p => {p.ring(16,15,11);p.line(16,15,23,8,GOLD);p.rect(6,28,5,2,COOL);p.rect(13,28,5,2,PAPER);p.rect(20,28,7,2,GOLD);},
    fusion: p => {p.ring(11,16,8,COOL);p.ring(21,16,8);p.star(16,16,5);},
    magnet: p => {p.rect(5,5,7,18);p.rect(20,5,7,18);p.rect(8,23,16,5);p.rect(5,5,7,6,GOLD);p.rect(20,5,7,6,GOLD);},
    black_cat: p => {p.poly([[6,25],[5,5],[13,10],[20,10],[27,5],[26,25],[21,28],[11,28]],COOL);p.rect(10,16,4,2,GOLD);p.rect(20,16,4,2,GOLD);p.poly([[14,21],[20,21],[17,24]],INK);},
    moonstone: p => {p.disc(15,16,12);p.disc(21,11,11,INK);p.star(24,7,4);},
    lucky_star: p => {p.star(16,16,14);p.rect(14,13,4,5,PAPER);},
    hellfire: p => {p.poly([[6,25],[3,17],[10,6],[12,15],[20,2],[24,13],[29,17],[26,26],[17,30]],GOLD);p.poly([[11,25],[16,14],[21,25],[17,28]],PAPER);},
    grave_digger: p => {p.poly([[11,3],[21,3],[27,11],[22,29],[10,29],[5,11]]);p.line(16,8,16,23,INK);p.line(11,13,21,13,INK);},
    ritual_candle: p => {p.rect(11,13,10,14);p.rect(6,28,20,3,GOLD);p.poly([[12,10],[13,5],[17,1],[20,8],[17,12]],GOLD);p.rect(13,15,2,7,COOL);},
    blood_pact: p => {p.book();p.poly([[18,8],[12,18],[13,22],[18,24],[23,21],[24,18]],GOLD);},
    hex_bag: p => {p.bag();p.star(16,20,7,INK);p.rect(15,18,2,4,GOLD);},
    recycler: p => {p.loop();p.line(12,16,20,16,COOL);p.line(16,12,16,20,COOL);},
    whirlwind: p => {for(let y=5;y<28;y+=5){const n=Math.floor((y-5)/3);p.rect(3+n,y,26-n*2,2,y%2?PAPER:COOL);}},
    roulette: p => {p.ring(16,16,12,GOLD);for(const [x,y] of [[16,5],[26,10],[26,22],[16,27],[5,22],[5,10]])p.line(16,16,x,y);p.disc(16,16,4,GOLD);p.disc(24,9,2,COOL);},
    last_call: p => {p.clock();p.rect(3,3,7,3,GOLD);p.rect(22,3,7,3,GOLD);p.line(8,26,5,29);p.line(24,26,27,29);},
    jackpot: p => {p.rect(3,7,24,20);p.rect(5,11,20,11,INK);for(let x=7;x<25;x+=6){p.rect(x,13,4,2,GOLD);p.line(x+2,15,x,19,GOLD);}p.line(29,8,29,21);p.disc(29,5,2,GOLD);},
    bedrock: p => {p.poly([[3,23],[7,11],[15,6],[26,10],[30,23],[23,27],[8,27]],COOL);p.line(8,12,15,8);p.line(15,8,21,17);p.line(21,17,28,22,INK);},
    slow_steady: p => {p.poly([[5,23],[6,15],[13,9],[21,11],[26,22]],COOL);p.rect(4,23,23,3);p.disc(28,21,3,GOLD);p.rect(7,26,3,3);p.rect(22,26,3,3);p.line(14,11,14,22,INK);p.line(7,20,22,20,INK);},
    lockbox: p => {p.ring(16,11,7);p.rect(5,14,22,15,COOL);p.disc(16,20,3,INK);p.rect(15,20,3,5,INK);},
    cold_storage: p => {p.poly([[5,9],[18,3],[28,9],[28,23],[15,29],[5,23]],COOL);p.line(6,9,15,14);p.line(15,14,27,9);p.line(15,14,15,27);p.line(9,13,9,21,PAPER,1);},
    monument: p => {p.poly([[12,3],[20,3],[23,25],[9,25]],PAPER);p.rect(5,26,22,4,COOL);p.rect(15,8,2,12,GOLD);},
    minimalist: p => {p.rect(8,8,16,16);p.rect(11,11,10,10,INK);p.rect(15,15,2,2,GOLD);},
    purist: p => p.gem(),
    hoarder: p => {p.line(5,16,11,5);p.line(26,16,21,5);p.line(11,5,21,5);p.poly([[3,15],[29,15],[25,28],[7,28]],GOLD);p.line(10,18,12,25,INK);p.line(16,18,16,25,INK);p.line(22,18,20,25,INK);},
    brood: p => {p.disc(16,16,10);p.poly([[5,18],[10,22],[14,18],[19,23],[25,18],[25,27],[7,27]],GOLD);p.rect(12,12,2,2,INK);p.rect(20,12,2,2,INK);p.rect(16,15,3,2,GOLD);},
    collector: p => {p.rect(3,3,26,26,GOLD);p.rect(5,5,22,22,INK);p.die(7,7,1,8);p.die(18,7,2,8,COOL);p.die(7,18,3,8,COOL);p.die(18,18,4,8);},
    seedling: p => p.sprout(),
    snowball: p => {p.disc(18,18,11);p.disc(15,15,6,COOL);p.disc(14,13,3);p.line(2,27,10,27,GOLD);p.line(3,23,6,23,GOLD);},
    nest_egg: p => {p.disc(16,15,8);p.rect(12,6,8,5);p.line(4,20,10,27,GOLD,3);p.line(10,27,24,27,GOLD,3);p.line(24,27,29,20,GOLD,3);p.line(6,22,25,22,COOL);},
    trophy_case: p => {p.poly([[9,4],[23,4],[22,16],[17,21],[15,21],[10,16]],GOLD);p.line(16,20,16,27);p.rect(10,28,14,3);p.line(8,7,3,7);p.line(3,7,3,14);p.line(3,14,10,17);p.line(24,7,28,7);p.line(28,7,28,14);p.line(28,14,22,17);},
    heirloom: p => {p.poly([[6,29],[7,7],[16,2],[25,7],[26,29]],GOLD);p.disc(16,13,8,INK);p.line(16,8,16,13);p.line(16,13,20,13);p.line(16,22,16,26,INK);p.rect(4,29,24,2);},
    metamorphosis: p => {p.line(16,3,16,28,GOLD);p.poly([[13,15],[3,5],[2,16],[10,19],[5,26],[13,25],[16,19]],COOL);p.poly([[19,15],[29,5],[30,16],[22,19],[27,26],[19,25],[16,19]],PAPER);},
    golden_rule: p => {p.rect(4,10,24,13,GOLD);for(let x=7;x<27;x+=4)p.rect(x,10,1,x%3?5:8,INK);p.star(24,5,4,PAPER);},
    lucky_dividend: p => {p.coin(20,22,7);p.disc(9,8,4,COOL);p.disc(17,8,4,PAPER);p.disc(9,16,4,PAPER);p.disc(17,16,4,COOL);},
    iron_focus: p => {p.ring(16,16,10);p.rect(14,14,5,5,GOLD);p.line(16,1,16,6,COOL);p.line(16,26,16,30,COOL);p.line(1,16,6,16,COOL);p.line(26,16,30,16,COOL);},
    loaded_skulls: p => {p.skull();p.line(3,28,28,3,GOLD);},
    chameleon: p => {p.poly([[4,14],[10,8],[21,8],[26,13],[22,17],[12,17],[9,22],[5,22]],COOL);p.disc(23,10,2,PAPER);p.rect(23,10,1,1,INK);p.line(11,17,20,25);p.line(20,25,27,25);p.line(27,25,27,20);p.line(27,20,23,20);},
    compass: p => {p.ring(16,16,12);p.poly([[23,6],[19,19],[9,26],[13,13]],GOLD);p.disc(16,16,2,INK);},
    jack: p => {p.rect(3,7,13,20,COOL);p.rect(10,4,13,20,GOLD);p.rect(17,9,13,20);p.star(23,19,4,INK);},
    mirror: p => {p.poly([[11,3],[26,7],[23,20],[14,29],[5,16]],PAPER);p.poly([[12,6],[23,9],[20,19],[14,25],[8,16]],COOL);p.line(11,18,20,9);p.line(14,21,20,15);},
    hybrid_seed: p => {p.poly([[7,21],[8,12],[17,4],[25,13],[24,24],[17,28],[10,26]],GOLD);p.line(17,8,13,23,INK);p.rect(20,14,2,6,PAPER);},
    dial: p => {for(let x=7;x<28;x+=9)p.line(x,4,x,28);p.rect(4,9,8,5,GOLD);p.rect(13,21,8,5,COOL);p.rect(22,5,8,5,GOLD);},
    coin: p => {p.coin();p.line(16,6,16,26,INK);p.rect(19,13,3,7,INK);},
    day_night: p => {p.disc(16,16,11,GOLD);p.poly([[16,5],[27,5],[27,27],[16,27]],INK);p.disc(20,15,6,PAPER);p.disc(23,12,5,INK);},
    crossroads: p => {p.line(15,28,15,17);p.line(15,17,6,8);p.line(15,17,25,7);p.poly([[2,5],[11,5],[2,14]],GOLD);p.poly([[21,4],[30,4],[30,13]],COOL);},
    dragons_hoard: p => {p.poly([[3,24],[5,14],[13,8],[16,3],[19,9],[26,7],[29,13],[23,18],[16,16],[11,21],[20,23],[21,28],[8,28]],COOL);p.rect(22,11,2,2,INK);p.coin(23,25,5);},
    loaded_clover: p => {p.clover();p.die(19,20,3,10,GOLD);},
    evil_eye: p => p.eye(),
    scaffold: p => {p.line(6,4,6,29);p.line(25,4,25,29);p.line(6,5,25,5,GOLD);p.line(6,17,25,17,GOLD);p.line(6,28,25,28,GOLD);p.line(8,7,23,15,COOL);p.line(8,19,23,26,COOL);},
    abacus: p => {p.rect(3,4,3,25);p.rect(27,4,3,25);for(let y=8;y<28;y+=8)p.line(6,y,26,y,COOL);for(const [x,y] of [[8,6],[17,6],[12,14],[21,14],[8,22],[17,22]])p.rect(x,y,5,6,GOLD);},
    ash_urn: p => {p.rect(9,3,14,3,GOLD);p.poly([[11,7],[21,7],[21,11],[27,15],[24,24],[19,27],[19,29],[13,29],[13,27],[8,24],[5,15],[11,11]]);p.rect(11,16,10,2,COOL);},
    suitcase: p => {p.rect(11,4,10,3,GOLD);p.rect(10,6,3,5,GOLD);p.rect(20,6,3,5,GOLD);p.rect(3,11,26,17);p.rect(8,11,3,17,COOL);p.rect(22,11,3,17,COOL);p.rect(15,17,3,4,INK);},
    clockwork: p => {p.disc(16,16,10);for(const [x,y,w,h] of [[13,2,6,5],[13,26,6,5],[2,13,5,6],[26,13,5,6],[5,5,5,5],[22,5,5,5],[5,22,5,5],[22,22,5,5]])p.rect(x,y,w,h);p.disc(16,16,6,INK);p.line(16,11,16,16,GOLD);p.line(16,16,20,18,GOLD);},
    spiral: p => {const pts=[[28,25],[7,25],[4,21],[4,8],[8,4],[24,4],[28,8],[28,18],[24,21],[12,21],[9,18],[9,11],[12,8],[21,8],[24,11],[24,15],[20,17],[15,17],[13,14],[17,12]];for(let i=1;i<pts.length;i++)p.line(...pts[i-1],...pts[i],i<8?PAPER:GOLD);},
    vault: p => {p.rect(3,3,26,26);p.rect(6,6,20,20,COOL);p.ring(17,16,7,INK);p.line(17,11,17,21,GOLD);p.line(12,16,22,16,GOLD);p.rect(4,8,3,4,INK);p.rect(4,21,3,4,INK);},
    overdraft: p => {p.rect(3,7,26,19);p.rect(3,11,26,5,INK);p.rect(7,20,5,3,GOLD);p.rect(19,21,7,2,INK);},
    telescope: p => {p.poly([[3,13],[23,3],[28,12],[8,22]],PAPER);p.line(22,4,26,12,COOL,3);p.line(16,18,10,29,GOLD);p.line(16,18,24,29,GOLD);},
    crystal_ball: p => {p.disc(16,13,11,COOL);p.star(16,12,7,PAPER);p.rect(10,25,12,3,GOLD);p.rect(6,28,20,3);},
    weighted_dice: p => {p.die(5,3,6,22);p.rect(4,26,24,4,GOLD);p.rect(9,27,3,2,INK);p.rect(20,27,3,2,INK);},
    rabbit_foot: p => {p.ring(17,4,3,GOLD);p.poly([[12,8],[21,8],[24,19],[21,27],[13,30],[7,25],[8,15]]);p.line(10,22,12,26,COOL);p.line(15,23,15,27,COOL);p.rect(12,8,10,3,GOLD);},
    overdrive: p => {p.rect(9,4,15,25);p.rect(13,1,7,3,COOL);p.rect(11,6,11,21,INK);p.bolt();},
    anchor: p => p.anchor(),
    pruning: p => {p.ring(8,24,5);p.ring(24,24,5);p.line(10,20,25,3);p.line(22,20,7,3);p.disc(16,14,2,GOLD);},
    backpack: p => {p.line(11,6,11,3,GOLD);p.line(11,3,21,3,GOLD);p.line(21,3,21,6,GOLD);p.rect(5,7,22,23);p.rect(9,17,14,10,COOL);p.rect(10,17,12,2,INK);p.rect(14,11,4,4,GOLD);},
    spare_die: p => {p.die(3,4,5,18,COOL);p.die(12,13,6,18);p.rect(23,2,2,7,GOLD);p.rect(20,5,8,2,GOLD);},
    smith: p => {p.rect(5,7,20,7);p.rect(17,13,4,16,GOLD);p.poly([[3,7],[8,3],[11,7]],COOL);p.star(7,24,5);},
    gilding: p => {p.die(3,10,3,18,GOLD);p.poly([[17,5],[22,2],[30,10],[25,15]]);p.line(20,12,13,19,COOL,3);},
    fury: p => {p.heart();p.poly([[17,4],[12,16],[18,16],[15,27],[24,12],[18,12]],INK);},
    azure: p => {p.disc(16,16,12,COOL);p.ring(16,16,9);p.rect(14,10,4,12,INK);p.rect(10,14,12,4,INK);},
    ascend: p => {p.die(3,14,2,15);p.arrow(24,2);},
    twin: p => {p.die(2,3,3,17,COOL);p.die(13,14,3,17);},
    shatter: p => {p.poly([[4,4],[17,4],[13,13],[18,17],[11,27],[4,27]]);p.poly([[21,6],[29,9],[29,25],[17,28],[22,17],[17,12]],COOL);p.rect(7,8,3,3,INK);p.rect(24,20,3,3,INK);},
    windfall: p => {p.coin(11,21,8);p.coin(23,15,7);p.line(8,2,8,9);p.poly([[4,7],[13,7],[8,13]],GOLD);},
    devils_deal: p => {p.skull();p.poly([[5,13],[2,2],[13,8]],GOLD);p.poly([[19,8],[30,2],[27,13]],GOLD);},
    refraction: p => {p.poly([[16,4],[29,27],[3,27]],COOL);p.line(16,9,7,24);p.line(1,18,12,18,GOLD);p.line(19,17,30,10,PAPER);p.line(21,20,30,20,GOLD);p.line(23,23,30,29,COOL);},
    hex: p => {p.skull();p.star(23,9,8,COOL);p.rect(22,7,2,4,INK);},
  };

  // Larger object silhouettes and hand-placed material planes replace pictograms.
  Object.assign(motifs, {
    vault: p => {
      p.poly([[3,7],[9,3],[28,3],[30,6],[30,27],[25,30],[3,30]],INK);
      p.rect(4,7,22,21,PAPER);p.poly([[26,7],[29,5],[29,26],[26,28]],COOL);
      p.poly([[4,6],[9,4],[28,4],[25,6]],'#C0DBE3');
      p.rect(7,9,17,16,INK);p.rect(8,10,15,14,COOL);
      p.disc(16,17,6,INK);p.disc(16,17,5,PAPER);p.disc(16,17,2,GOLD);
      p.line(16,13,16,21,GOLD,1);p.line(12,17,20,17,GOLD,1);
      p.rect(5,11,3,4,GOLD);p.rect(5,21,3,4,GOLD);p.rect(6,29,4,2,INK);p.rect(23,29,4,2,INK);
    },
    crystal_ball: p => {
      p.disc(16,13,12,INK);p.disc(16,12,11,COOL);
      p.poly([[6,13],[9,19],[17,22],[24,18],[26,11],[24,19],[19,24],[11,22],[6,18]],'#58356F');
      p.poly([[8,9],[11,5],[18,3],[22,5],[14,5],[10,10]],'#F6D6FF');
      p.poly([[7,14],[12,12],[19,14],[23,11],[21,17],[14,19]],'#AC80E8');
      p.star(17,12,5,'#F0EAFF');p.rect(9,8,2,3,'#FFFFFF');
      p.poly([[8,23],[12,25],[21,25],[25,22],[26,26],[22,29],[9,29],[6,26]],GOLD);
      p.rect(9,29,15,2,INK);p.rect(10,25,12,1,'#FFF0B2');
    },
    telescope: p => {
      p.line(17,18,8,29,COOL,2);p.line(17,18,26,29,COOL,2);p.line(17,18,17,29,COOL,2);
      p.poly([[2,13],[23,3],[29,13],[8,23]],INK);
      p.poly([[3,13],[22,5],[27,13],[8,21]],PAPER);
      p.poly([[7,16],[24,8],[27,13],[9,21]],GOLD);
      p.line(22,4,27,13,COOL,3);p.line(24,5,27,10,'#BDECF0',2);
      p.line(7,12,11,19,COOL,2);p.line(4,14,7,19,INK,2);p.rect(16,18,4,4,GOLD);
    },
    backpack: p => {
      p.rect(11,2,11,3,INK);p.rect(10,4,3,5,GOLD);p.rect(21,4,3,5,GOLD);
      p.rect(3,15,4,13,COOL);p.rect(26,15,4,13,COOL);
      p.poly([[9,6],[24,6],[27,10],[27,28],[24,31],[8,31],[5,27],[5,11]],PAPER);
      p.rect(8,10,16,10,COOL);p.poly([[7,9],[25,9],[24,16],[18,19],[12,18],[7,15]],PAPER);
      p.rect(9,22,14,7,GOLD);p.rect(10,23,12,1,'#F6D39B');p.rect(14,14,5,7,INK);p.rect(15,15,3,4,GOLD);
      p.rect(7,12,1,14,'#DAAE7D');p.rect(24,19,2,9,'#624338');
    },
    overdrive: p => {
      p.rect(10,3,12,3,COOL);p.rect(13,1,6,3,GOLD);
      p.poly([[8,5],[24,5],[26,8],[26,28],[23,31],[8,31],[6,28],[6,8]],INK);
      p.rect(8,7,16,22,PAPER);p.rect(10,10,12,15,INK);
      p.rect(11,11,10,13,GOLD);p.rect(12,12,2,10,'#B8F3A1');p.rect(9,8,14,1,'#D2EAF1');
      p.poly([[18,9],[12,18],[17,18],[14,25],[22,15],[17,15]],'#FFF0A1');
      p.rect(11,27,3,2,COOL);p.rect(18,27,3,2,COOL);
    },
    overdraft: p => {
      p.poly([[3,6],[27,6],[30,9],[30,25],[27,28],[3,28],[1,25],[1,9]],INK);
      p.rect(3,8,25,17,PAPER);p.rect(3,11,25,5,COOL);p.rect(5,18,7,5,GOLD);
      p.rect(8,18,1,5,INK);p.rect(5,20,7,1,INK);p.rect(16,21,8,2,'#D9E9EF');p.rect(4,8,22,1,'#EAF8F9');
      p.rect(5,26,22,1,'#384B6E');
    },
    weighted_dice: p => {
      p.poly([[3,7],[9,2],[25,2],[29,6],[29,23],[23,28],[3,28]],INK);
      p.poly([[4,7],[10,3],[25,3],[23,7]],'#D1E8E4');
      p.poly([[24,8],[28,5],[28,22],[24,25]],COOL);p.die(4,8,6,19,PAPER);
      p.rect(3,26,22,4,GOLD);p.rect(7,27,2,2,INK);p.rect(20,27,2,2,INK);
    },
    rabbit_foot: p => {
      p.ring(19,4,3,GOLD);p.line(17,7,14,12,GOLD,2);
      p.poly([[11,11],[19,11],[23,17],[22,25],[18,30],[11,31],[6,27],[5,22],[8,14]],PAPER);
      p.poly([[19,14],[21,18],[20,25],[16,29],[10,29],[15,26]],COOL);
      p.line(9,21,8,25,'#FFF9E7',1);p.line(12,24,11,28,'#FFF9E7',1);p.rect(10,10,10,4,GOLD);p.rect(12,11,2,2,'#FFF0B2');
    },
    pruning: p => {
      p.poly([[6,1],[11,5],[19,18],[16,21],[12,14]],PAPER);
      p.poly([[27,1],[25,10],[18,20],[14,17],[22,5]],COOL);
      p.ring(8,25,6,GOLD);p.ring(24,25,6,GOLD);p.line(11,21,17,15,PAPER,3);p.line(21,21,17,15,COOL,3);
      p.disc(17,16,3,INK);p.disc(17,16,2,GOLD);p.rect(16,15,1,1,'#FFEDB7');
    },
    anchor: p => {
      p.ring(16,5,4,GOLD);p.rect(14,9,5,16,PAPER);p.rect(8,12,17,3,COOL);
      p.poly([[2,18],[9,22],[6,23],[12,27],[15,27],[15,23],[18,23],[18,27],[22,27],[27,23],[24,22],[31,18],[30,26],[27,25],[21,30],[12,30],[5,25],[3,26]],PAPER);
      p.line(15,10,15,23,'#D7F0F1',1);p.line(9,13,23,13,'#ADCED8',1);
    },
    snake_eyes: p => {
      p.poly([[3,23],[5,19],[18,19],[22,16],[20,13],[10,13],[6,9],[7,5],[12,2],[23,3],[28,8],[26,13],[20,14],[16,10],[11,10],[15,15],[14,17],[6,21],[7,25],[23,25],[28,21],[28,27],[23,30],[8,30]],PAPER);
      p.line(8,27,23,27,'#C4D584',2);p.rect(19,5,3,3,GOLD);p.rect(25,7,2,3,GOLD);p.rect(20,5,1,3,INK);p.rect(26,7,1,3,INK);
      p.line(25,13,29,16,'#E76B6A',1);p.rect(28,17,2,1,'#E76B6A');
    },
    piggy_bank: p => {
      p.poly([[4,14],[8,9],[19,7],[25,12],[26,24],[22,28],[9,28],[4,23]],PAPER);
      p.poly([[18,9],[20,3],[25,5],[24,13]],COOL);p.rect(23,16,7,8,COOL);
      p.rect(25,18,1,3,INK);p.rect(28,18,1,3,INK);p.rect(21,12,2,2,INK);
      p.rect(8,26,5,5,COOL);p.rect(20,26,5,5,COOL);p.rect(9,10,8,2,INK);
      p.line(3,17,1,13,COOL,2);p.line(7,14,11,11,'#FFB6A6',2);p.rect(11,2,5,6,GOLD);
    },
    odd_fellow: p => {
      p.poly([[7,5],[25,4],[23,24],[28,24],[29,28],[4,29],[2,26],[8,24]],INK);
      p.poly([[8,6],[24,5],[22,24],[9,25]],PAPER);p.rect(9,20,14,4,GOLD);
      p.poly([[3,26],[10,25],[24,24],[28,26],[25,28],[5,28]],COOL);
      p.line(10,7,10,17,'#8D829C',2);p.rect(18,20,3,4,'#ED9A79');
    },
    patience: p => {
      p.rect(5,2,22,4,GOLD);p.rect(5,28,22,3,GOLD);p.rect(7,6,2,22,COOL);p.rect(23,6,2,22,COOL);
      p.poly([[10,6],[22,6],[21,11],[17,16],[17,18],[22,24],[22,28],[10,28],[10,24],[15,18],[15,16],[11,11]],COOL);
      p.poly([[11,8],[21,8],[17,14],[15,14]],GOLD);p.poly([[11,27],[12,24],[16,20],[20,24],[21,27]],GOLD);
      p.rect(15,15,2,5,'#FFF2B8');p.line(11,7,12,11,'#E5FFFF',1);p.rect(6,3,18,1,'#FFDF83');
    },
    black_cat: p => {
      p.poly([[5,22],[5,4],[12,9],[20,9],[27,3],[27,22],[23,28],[11,28]],PAPER);
      p.poly([[7,7],[11,11],[7,12]],GOLD);p.poly([[24,7],[21,11],[25,11]],GOLD);
      p.line(9,16,13,17,'#ABD96A',2);p.line(21,17,25,15,'#ABD96A',2);p.rect(11,16,1,3,INK);p.rect(23,15,1,3,INK);
      p.poly([[14,21],[19,21],[16,24]],GOLD);p.line(1,20,9,22,COOL,1);p.line(23,22,30,20,COOL,1);
      p.line(11,11,15,10,'#72708B',1);
    },
    magnet: p => {
      p.poly([[4,5],[12,5],[12,21],[15,24],[18,24],[21,21],[21,5],[29,5],[29,22],[25,28],[20,31],[11,31],[5,27],[2,21],[2,7]],PAPER);
      p.rect(3,5,9,7,COOL);p.rect(21,5,8,7,COOL);p.line(5,14,5,22,'#FFAD8D',2);p.line(5,22,10,27,'#FFAD8D',2);
      p.rect(4,5,7,2,'#FFF2D8');p.rect(22,5,6,2,'#FFF2D8');
    },
    loaded: p => {p.die(3,4,6,20);p.die(12,14,6,18,COOL);p.rect(5,21,15,3,GOLD);p.rect(14,29,14,2,GOLD);},
    fusion: p => {p.die(2,4,2,18,COOL);p.die(13,14,3,18);p.star(18,12,6,GOLD);},
    monument: p => {
      p.poly([[10,2],[24,3],[25,8],[23,11],[23,26],[8,26],[7,12]],COOL);
      p.poly([[10,3],[19,3],[18,14],[22,18],[17,20],[16,26],[9,26]],PAPER);
      p.rect(10,10,6,2,INK);p.rect(20,10,3,2,INK);p.poly([[17,11],[20,18],[16,18]],GOLD);
      p.rect(12,22,8,2,INK);p.rect(5,27,22,4,COOL);
    },
    combo: p => {
      p.poly([[3,9],[8,4],[25,4],[29,9],[29,28],[3,28]],PAPER);p.rect(6,8,20,14,INK);
      p.poly([[8,18],[8,13],[12,9],[21,9],[25,13],[25,18]],COOL);
      p.poly([[11,18],[12,14],[16,12],[20,14],[22,18]],INK);p.line(16,18,23,11,GOLD,2);
      p.rect(7,24,4,2,COOL);p.rect(14,24,4,2,GOLD);p.rect(21,24,4,2,'#F37C66');
    },
  });

  const vineMarks = {golden_vine:'bank',clover_vine:'luck',thorn_vine:'risk',pattern_vine:'pattern',root_vine:'hold',dice_vine:'reroll',number_vine:'number',bag_vine:'bag'};
  const tagMotifs = {bank:'vault',number:'big_six',pattern:'fusion',luck:'clover',risk:'loaded_skulls',reroll:'loaded',hold:'anchor',bag:'backpack',growth:'seedling'};
  for (const [id, tag] of Object.entries(vineMarks)) motifs[id] = p => {
    materialById[id] = ['green',tag==='bank'?'gold':'green','green'];
    p.line(8,29,6,20,COOL,3);p.line(6,20,11,11,COOL,3);p.line(11,11,9,4,COOL,3);
    p.poly([[7,23],[1,19],[1,12],[7,15],[9,20]],PAPER);
    p.poly([[11,13],[13,5],[21,2],[20,9]],PAPER);
    p.line(4,17,7,20,'#B0E89B',1);p.line(14,9,18,5,'#B0E89B',1);
    // The fruit carries its build emblem, so all eight evolutions are distinct.
    p.stamp(get(tagMotifs[tag]), 15, 13, 17);
  };

  const constellations = {
    'Five of a Kind': [[5,16],[11,8],[17,14],[25,10],[23,23],[13,24],[5,16]],
    'Four of a Kind': [[16,3],[16,27],[16,14],[4,14],[28,14]],
    'Large Straight': [[3,24],[9,17],[6,9],[16,4],[27,9],[22,17],[15,17]],
    'Full House': [[3,4],[10,16],[16,25],[22,16],[29,4],[22,16],[10,16]],
    'Small Straight': [[8,6],[25,11],[20,26],[5,21],[8,6],[20,26]],
    'Three of a Kind': [[16,4],[29,26],[3,26],[16,4]],
    'Two Pair': [[3,8],[10,5],[10,14],[3,8],[26,25],[21,28],[21,19],[26,25]],
    Pair: [[8,5],[6,26],[8,16],[24,16],[26,26],[24,5],[8,5]],
    Chance: [[3,3],[20,20],[9,4],[25,18],[16,5],[28,16]],
  };
  for (const [id, points] of Object.entries(constellations)) motifs['star:' + id] = p => {
    for(let i=1;i<points.length;i++)p.line(...points[i-1],...points[i],COOL,1);
    points.forEach(([x,y],i)=>{p.disc(x,y,2,i%2?PAPER:GOLD);});
    if(id==='Chance')p.star(24,23,6,PAPER);
  };

  function get(id) {
    if(cache.has(id)) return cache.get(id);
    if(!motifs[id]) throw new Error('Missing card icon: ' + id);
    const [c,ctx] = A.canvas(32,32), p = painter(ctx);
    p.stamp = (image,x,y,size) => ctx.drawImage(image,x,y,size,size);
    motifs[id](p);
    if(!id.startsWith('star:')) shadeSprite(ctx,id);
    // A one-pixel dark keyline holds the silhouette against striped card faces.
    const [outlined,oc] = A.canvas(34,34);
    for(const [x,y] of [[0,1],[2,1],[1,0],[1,2]])oc.drawImage(c,x,y);
    oc.globalCompositeOperation='source-in';oc.fillStyle=INK;oc.fillRect(0,0,34,34);
    oc.globalCompositeOperation='source-over';oc.drawImage(c,1,1);
    cache.set(id,outlined);return outlined;
  }
  function draw(ctx,id,x,y,size=34) {
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(get(id),Math.round(x-size/2),Math.round(y-size/2),size,size);ctx.restore();
  }
  function card(id,colour,rarity) {
    A.ICONS.none = A.ICONS.none || (()=>{});
    const c=A.joker('none',colour),ctx=c.getContext('2d');
    const {darken,lighten}=global.BalatroFX.color;
    // A quiet inset gives the object contrast; the original border stays intact.
    A.pixelRect(ctx,9,18,53,45,darken(colour,.48),[3,1]);
    A.pixelRect(ctx,10,19,51,43,darken(colour,.32),[2,1]);
    ctx.fillStyle=lighten(colour,.06);
    [[12,22],[57,22],[12,57],[57,57]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
    ctx.fillStyle=darken(colour,.60);ctx.fillRect(23,57,26,3);ctx.fillRect(26,60,20,1);
    draw(ctx,id,35,40,42);
    if(rarity){const col=global.WG.RARITY[rarity].colour;ctx.fillStyle=INK;ctx.fillRect(56,8,9,9);ctx.fillStyle=col;ctx.fillRect(57,9,7,7);ctx.fillStyle=PAPER;ctx.fillRect(58,10,2,2);}
    return c;
  }
  global.WGIcons = {get,draw,card,tag:(ctx,tag,x,y,size)=>draw(ctx,tagMotifs[tag],x,y,size),ids:Object.freeze(Object.keys(motifs))};
})(typeof window !== 'undefined' ? window : globalThis);
