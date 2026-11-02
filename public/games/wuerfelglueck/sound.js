// Würfelglück – Sound und Musik. Alles wird live mit der WebAudio-API erzeugt, es gibt keine Audiodateien.
// window.WGSound: unlock(), play(name, opts), mood(name), setVolume('master' | 'sfx' | 'music', 0..1)
// Die Musik kommt normalerweise aus Dateien (music.js); die erzeugte Musik hier ist nur der Ersatz, falls keine da sind.
(() => {
  'use strict';
  let ac = null, out, post, sfxBus, sfxWet, musicBus, musicTone, verbIn, noiseBuf;
  const vol = { master: 1, sfx: 0.8, music: 0.5 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ── Aufbau: Kompressor am Ausgang, getrennte Busse für Effekte und Musik, ein gemeinsamer Hall ──
  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    out = gain(0.9); out.connect(comp);
    post = gain(1); comp.connect(post); post.connect(ac.destination);
    sfxBus = gain(vol.sfx); sfxBus.connect(out);
    // Hall aus einer erzeugten Impulsantwort
    const verb = ac.createConvolver();
    verb.buffer = impulse(2.4, 3.2);
    verbIn = gain(1); verbIn.connect(verb);
    const verbOut = gain(0.32); verb.connect(verbOut); verbOut.connect(out);
    sfxWet = gain(vol.sfx); sfxWet.connect(verbIn);
    // Musik: Klangfilter (pro Stimmung) -> Lautstärke -> Ausgang und etwas Hall
    musicTone = ac.createBiquadFilter(); musicTone.type = 'lowpass'; musicTone.frequency.value = 5200; musicTone.Q.value = 0.5;
    musicBus = gain(0); musicTone.connect(musicBus); musicBus.connect(out);
    const mWet = gain(0.28); musicBus.connect(mWet); mWet.connect(verbIn);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes(0.05);
    return true;
  }
  function gain(v) { const g = ac.createGain(); g.gain.value = v; return g; }
  function impulse(sec, decay) {
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  function applyVolumes(ramp = 0.15) {
    if (!ac) return;
    const t = ac.currentTime;
    out.gain.setTargetAtTime(0.9 * vol.master, t, ramp);
    sfxBus.gain.setTargetAtTime(vol.sfx, t, ramp);
    sfxWet.gain.setTargetAtTime(vol.sfx, t, ramp);
    musicBus.gain.setTargetAtTime(music.on ? vol.music * 0.42 : 0, t, music.on ? 1.2 : ramp);
  }

  // ── Bausteine ─────────────────────────────────────────────────────────
  // Hüllkurve: schneller Anstieg, exponentielles Abklingen
  function env(p, t, a, peak, d) {
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function route(node, o) {
    node.connect(o.dest || sfxBus);
    if (o.wet && !o.dest) { const s = gain(o.wet); node.connect(s); s.connect(sfxWet); }
  }
  // Oszillator mit Tonhöhen-Gleiten und optionalem Tiefpass
  function tone(type, f, t, d, peak, o = {}) {
    const osc = ac.createOscillator(), g = ac.createGain(), a = o.a || 0.003;
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || d));
    if (o.detune) osc.detune.value = o.detune;
    let n = osc;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; fl.Q.value = o.q || 0.7; osc.connect(fl); n = fl; }
    n.connect(g);
    env(g.gain, t, a, peak, d);
    route(g, o);
    osc.start(t); osc.stop(t + a + d + 0.05);
  }
  // Gefiltertes Rauschen (Klicks, Wischen, Becken)
  function noise(t, d, peak, o = {}) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), a = o.a || 0.002;
    s.buffer = noiseBuf; s.loop = true;
    f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + a + d);
    s.connect(f); f.connect(g);
    env(g.gain, t, a, peak, d);
    route(g, o);
    s.start(t, Math.random() * 1.5); s.stop(t + a + d + 0.05);
  }
  // FM-Glocke (Münzen, Funkeln, Vibraphon)
  function bell(f, t, d, peak, o = {}) {
    const car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    car.frequency.value = f; mod.frequency.value = f * (o.ratio || 3.5);
    mg.gain.setValueAtTime(f * (o.index || 2), t);
    mg.gain.exponentialRampToValueAtTime(f * 0.02 + 0.01, t + d * 0.7);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g);
    env(g.gain, t, o.a || 0.002, peak, d);
    route(g, o);
    car.start(t); mod.start(t); car.stop(t + d + 0.1); mod.stop(t + d + 0.1);
  }
  // Marimba: Grundton plus schnell verklingender Oberton
  function marimba(f, t, peak, o = {}) {
    tone('sine', f, t, 0.32, peak, o);
    tone('sine', f * 4, t, 0.05, peak * 0.35, o);
    noise(t, 0.012, peak * 0.4, { f: f * 6, q: 2, dest: o.dest });
  }
  // Pentatonik: Schritt n -> Frequenz (für ansteigende Wertungstöne)
  const PENTA = [0, 2, 4, 7, 9];
  const penta = (base, n) => mtof(base + PENTA[n % 5] + 12 * Math.floor(n / 5));

  // Würfel landet auf dem Filz: dumpfer Schlag, harter Klick, kleiner Nachhüpfer
  function dieLand(t) {
    tone('sine', rnd(140, 190), t, 0.09, 0.3, { to: 62 });
    noise(t, 0.028, 0.26, { f: rnd(2600, 4200), q: 1.3 });
    tone('triangle', rnd(1050, 1500), t, 0.045, 0.06);
    const b = t + rnd(0.05, 0.08);
    noise(b, 0.014, 0.11, { f: rnd(3000, 5200), q: 3 });
    tone('sine', rnd(150, 180), b, 0.04, 0.12, { to: 80 });
  }

  // ── Klänge ────────────────────────────────────────────────────────────
  const SFX = {
    click: (t) => { tone('triangle', 640, t, 0.06, 0.2, { to: 380 }); noise(t, 0.018, 0.1, { f: 3400, q: 2 }); tone('sine', 180, t, 0.05, 0.12, { to: 90 }); },
    hover: (t) => tone('sine', rnd(1500, 1650), t, 0.025, 0.03),
    hold: (t, o) => {
      tone('sine', o.on ? 320 : 540, t, 0.09, 0.26, { to: o.on ? 600 : 290, glide: 0.07 });
      noise(t, 0.014, 0.08, { f: 2600, q: 3 });
    },
    // Würfel im Becher: viele kleine Klicks über die ganze Wurfdauer
    rattle: (t, o) => {
      const n = o.n || 5, d = o.dur || 0.6, hits = Math.round(n * d * 20);
      for (let i = 0; i < hits; i++) {
        const tt = t + Math.random() * d, v = rnd(0.07, 0.22);
        noise(tt, rnd(0.007, 0.018), v, { f: rnd(1800, 5200), q: rnd(2, 6) });
        if (Math.random() < 0.3) tone('triangle', rnd(900, 1700), tt, 0.022, v * 0.3);
      }
      noise(t, d, 0.09, { type: 'lowpass', f: 500, a: 0.08 });
    },
    land: (t) => dieLand(t),
    lucky: (t) => { for (let i = 0; i < 5; i++) bell(penta(84, i * 2), t + i * 0.035, 0.35, 0.06, { ratio: 2.01, index: 1.2, wet: 0.7 }); },
    // Wertung: Pips als Marimba, Power als Glocke, beide steigen pro Schritt an
    pips: (t, o) => marimba(penta(67, Math.min(o.step || 0, 14)), t, 0.2, { wet: 0.25 }),
    power: (t, o) => { const f = penta(67, Math.min(o.step || 0, 14)); bell(f, t, 0.4, 0.13, { ratio: 2, index: 2.6, wet: 0.35 }); tone('sine', f / 2, t, 0.12, 0.1); },
    xpower: (t) => {
      tone('sine', 120, t, 0.32, 0.55, { to: 48 });
      noise(t, 0.12, 0.28, { type: 'lowpass', f: 2400, to: 300 });
      bell(mtof(72), t, 0.7, 0.1, { ratio: 1.5, index: 3, wet: 0.5 });
      bell(mtof(79), t + 0.02, 0.7, 0.08, { ratio: 1.5, index: 3, wet: 0.5 });
    },
    relic: (t, o) => bell(penta(79, (o.step || 0) % 10), t, 0.22, 0.06, { ratio: 3.01, index: 1, wet: 0.3 }),
    coin: (t) => {
      const p = rnd(-0.3, 0.3);
      bell(mtof(91 + p), t, 0.16, 0.09, { ratio: 3.01, index: 1.4, wet: 0.3 });
      bell(mtof(96 + p), t + 0.065, 0.32, 0.09, { ratio: 3.01, index: 1.4, wet: 0.35 });
    },
    pay: (t) => { tone('square', 784, t, 0.07, 0.05, { lp: 1600 }); tone('square', 523, t + 0.07, 0.12, 0.05, { lp: 1200 }); },
    buy: (t) => {
      noise(t, 0.05, 0.14, { type: 'highpass', f: 4000 });
      bell(mtof(96), t + 0.02, 0.4, 0.1, { ratio: 3.01, index: 1.6, wet: 0.4 });
      bell(mtof(100), t + 0.09, 0.5, 0.08, { ratio: 3.01, index: 1.6, wet: 0.4 });
      tone('sine', 160, t, 0.1, 0.3, { to: 70 });
    },
    sell: (t) => { bell(mtof(93), t, 0.2, 0.09, { ratio: 3.01, index: 1.4, wet: 0.3 }); bell(mtof(88), t + 0.07, 0.35, 0.08, { ratio: 3.01, index: 1.4, wet: 0.3 }); },
    deny: (t) => { tone('square', 150, t, 0.07, 0.11, { lp: 900 }); tone('square', 142, t + 0.1, 0.1, 0.11, { lp: 900 }); },
    card: (t) => { noise(t, 0.035, 0.15, { f: rnd(2200, 3200), q: 0.8 }); tone('sine', 900, t, 0.03, 0.035, { to: 600 }); },
    shuffle: (t) => { for (let i = 0; i < 7; i++) noise(t + i * rnd(0.035, 0.05), 0.03, rnd(0.06, 0.11), { type: 'highpass', f: rnd(2500, 3500), to: 6500 }); },
    magic: (t) => {
      noise(t, 0.5, 0.08, { f: 500, to: 4000, a: 0.25, q: 1.5, wet: 0.6 });
      for (let i = 0; i < 8; i++) bell(penta(79, i + ((Math.random() * 2) | 0)), t + i * 0.06, 0.6, 0.05, { ratio: 2.01, index: 1.5, wet: 0.8 });
    },
    whoosh: (t) => noise(t, 0.4, 0.45, { f: 300, to: 2600, a: 0.3, q: 1.4, wet: 0.3 }),
    impact: (t, o) => {
      const big = !!o.big;
      tone('sine', 125, t, 0.5, big ? 0.85 : 0.6, { to: 36 });
      noise(t, 0.35, big ? 0.5 : 0.35, { type: 'lowpass', f: 2200, to: 180 });
      noise(t, big ? 0.9 : 0.5, big ? 0.16 : 0.1, { type: 'highpass', f: 5200, wet: 0.7 });
      if (big) [60, 67, 72, 76].forEach((m, i) => bell(mtof(m + 12), t + i * 0.015, 1.4, 0.07, { ratio: 2, index: 2, wet: 0.7 }));
    },
    land_score: (t, o) => {
      tone('sine', 210, t, 0.12, 0.3, { to: 90 });
      [84, 88, 91, 96].forEach((m, i) => marimba(mtof(m), t + i * 0.04, o.big ? 0.13 : 0.09, { wet: 0.4 }));
    },
    bust: (t) => {
      tone('sine', 85, t, 0.8, 0.8, { to: 28 });
      tone('sawtooth', 55, t, 0.7, 0.16, { lp: 320 });
      tone('sawtooth', 58.3, t, 0.7, 0.16, { lp: 320 });
      noise(t, 0.5, 0.35, { type: 'lowpass', f: 900, to: 120 });
    },
    win: (t) => {
      [72, 76, 79, 84, 88].forEach((m, i) => bell(mtof(m), t + i * 0.085, 0.9, 0.1, { ratio: 2, index: 1.6, wet: 0.6 }));
      [72, 79, 84].forEach((m) => marimba(mtof(m), t + 0.5, 0.1, { wet: 0.6 }));
      for (let i = 0; i < 6; i++) SFX.coin(t + 0.35 + i * 0.07);
    },
    lose: (t) => {
      [67, 63, 60, 55].forEach((m, i) => tone('square', mtof(m), t + i * 0.26, 0.45, 0.07, { lp: 900, wet: 0.5 }));
      tone('sine', 65, t + 0.8, 1.6, 0.3, { a: 0.2 });
    },
    fanfare: (t) => {
      const seq = [[72, 0], [72, 0.14], [72, 0.28], [79, 0.42], [76, 0.7], [79, 0.84], [84, 1.0]];
      seq.forEach(([m, d]) => { tone('sawtooth', mtof(m), t + d, 0.35, 0.13, { lp: 2200, wet: 0.5 }); bell(mtof(m), t + d, 0.5, 0.12, { ratio: 2, index: 1.2, wet: 0.5 }); });
      [60, 64, 67, 72, 76].forEach((m) => tone('sawtooth', mtof(m), t + 1.0, 1.8, 0.08, { lp: 1800, a: 0.05, wet: 0.6 }));
      tone('sine', 65, t + 1.0, 1.2, 0.4, { a: 0.02 });
      for (let i = 0; i < 8; i++) SFX.coin(t + 1.05 + i * 0.08);
    },
    // ── Jingles: alle aus dem Würfel-Motiv (steigt und fällt wie ein geworfener Würfel) ──
    cleared: (t) => {
      // Runde geschafft: Motiv auf Vibraphon und Bläsern, dann ein warmer Dur-9-Akkord
      MOTIF.forEach((m, i) => { const f = mtof(72 + m); bell(f, t + i * 0.085, 0.6, 0.075, { ratio: 4, index: 0.7, wet: 0.5 }); brass(f, t + i * 0.085, 0.16, 0.05); });
      const c = t + 0.48;
      [60, 64, 67, 71, 74].forEach((m) => epiano(mtof(m), c, 1.6, 0.05));
      tone('sine', mtof(36), c, 0.9, 0.3, { a: 0.01 });
      brassChord([64, 67, 72], c, 0.7, 0.035);
      noise(c, 0.08, 0.1, { type: 'highpass', f: 6000 });
      for (let i = 0; i < 5; i++) SFX.coin(c + 0.05 + i * 0.06);
    },
    cupdraw: (t) => {
      // Becher dreimal schütteln, Harfen-Glissando, dann das Motiv in Es-Dur mit Bläsern und Glocken
      for (let k = 0; k < 3; k++) SFX.rattle(t + k * 0.22, { n: 3, dur: 0.14 });
      const g = t + 0.7;
      for (let i = 0; i < 14; i++) pluck(penta(63, i), g + i * 0.035, 0.05);
      const r = g + 0.55;
      MOTIF.forEach((m, i) => { bell(mtof(75 + m), r + i * 0.09, 0.9, 0.07, { ratio: 2, index: 1.4, wet: 0.6 }); brass(mtof(63 + m), r + i * 0.09, 0.2, 0.05); });
      const c = r + 0.5;
      brassChord([51, 58, 63, 67, 70], c, 1.4, 0.04);
      [87, 91, 94, 99].forEach((m, i) => bell(mtof(m), c + i * 0.04, 1.6, 0.05, { ratio: 3.01, index: 1, wet: 0.8 }));
      tone('sine', mtof(39), c, 1.2, 0.35, { a: 0.01 });
      noise(c, 1.2, 0.07, { type: 'highpass', f: 5500, wet: 0.8 });
    },
    gameover: (t) => {
      // Würfel rollt aus, das Motiv rückwärts in Moll auf gedämpfter Trompete, Rhodes-Akkord
      [0, 0.16, 0.3, 0.42, 0.51].forEach((d, i) => tone('sine', rnd(150, 180) - i * 10, t + d, 0.05, 0.22 - i * 0.035, { to: 70 }));
      const m0 = t + 0.6;
      [7, 12, 8, 5, 0].forEach((m, i) => brass(mtof(64 + m), m0 + i * 0.24, 0.35, 0.06, true));
      [57, 60, 64, 67, 71].forEach((m) => epiano(mtof(m), m0 + 1.25, 2.4, 0.045));
      tone('sine', mtof(33), m0 + 1.25, 2.2, 0.3, { a: 0.05 });
    },
    // Dieters Stimme: kurze Piepser, Tonhöhe je nach Stimmung
    voice: (t, o) => { const f = o.f || 520, harsh = o.mood === 'angry' || o.mood === 'furious', v = o.vol === undefined ? 1 : o.vol; if (v <= 0) return; tone(harsh ? 'sawtooth' : 'square', f, t, 0.045, (harsh ? 0.03 : 0.025) * v, { lp: harsh ? 1500 : 2400, to: f * (0.85 + Math.random() * 0.3), glide: 0.04 }); },
    achieve: (t) => {
      // Achievement: das Würfel-Motiv hell auf Glocken, dann ein weicher Akkord mit Funkeln und Münzen
      MOTIF.forEach((m, i) => bell(mtof(79 + m), t + i * 0.06, 0.7, 0.06, { ratio: 2, index: 1.2, wet: 0.6 }));
      const c = t + 0.34;
      [72, 76, 79, 84].forEach((m) => epiano(mtof(m), c, 1.2, 0.04));
      [96, 100, 103].forEach((m, i) => bell(mtof(m), c + i * 0.05, 0.9, 0.035, { ratio: 3.01, index: 1, wet: 0.8 }));
      for (let i = 0; i < 3; i++) SFX.coin(c + 0.05 + i * 0.07);
    },
    chime: (t) => { bell(mtof(79), t, 0.7, 0.06, { ratio: 2, index: 1, wet: 0.7 }); bell(mtof(86), t + 0.12, 0.9, 0.05, { ratio: 2, index: 1, wet: 0.7 }); },
    boss: (t) => {
      tone('sawtooth', 55, t, 1.6, 0.16, { lp: 420, a: 0.35 });
      tone('sawtooth', 82.4, t, 1.6, 0.12, { lp: 420, a: 0.35 });
      tone('sine', 70, t, 0.6, 0.6, { to: 35 });
      noise(t, 1.2, 0.08, { type: 'lowpass', f: 300, a: 0.3, wet: 0.6 });
    },
    panel: (t, o) => noise(t, 0.16, 0.2, { f: o.close ? 1800 : 600, to: o.close ? 500 : 1900, q: 1.2 }),
    page: (t) => { noise(t, 0.12, 0.08, { f: 900, to: 2600, q: 1 }); tone('sine', 420, t, 0.08, 0.06, { to: 640 }); },
    save: (t) => { bell(mtof(84), t, 0.3, 0.06, { ratio: 2, index: 1, wet: 0.4 }); bell(mtof(91), t + 0.08, 0.4, 0.06, { ratio: 2, index: 1, wet: 0.4 }); },
  };
  // Bläser: zwei leicht verstimmte Sägezähne, Filter öffnet sich beim Anschlag (muted = gedämpfte Trompete)
  function brass(f, t, d, peak, muted) {
    const f1 = ac.createBiquadFilter(), g = ac.createGain();
    f1.type = 'lowpass'; f1.Q.value = 1.2;
    const top = muted ? 1400 : 2600;
    f1.frequency.setValueAtTime(400, t); f1.frequency.exponentialRampToValueAtTime(top, t + 0.04); f1.frequency.exponentialRampToValueAtTime(top * 0.6, t + d);
    [-7, 7].forEach((det) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(f1); o.start(t); o.stop(t + d + 0.25); });
    f1.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak, t + d);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
    route(g, { wet: 0.4 });
  }
  function brassChord(ms, t, d, peak) { ms.forEach((m) => brass(mtof(m), t, d, peak)); }
  // E-Piano für Jingles (FM 1:1, wie die Musik)
  function epiano(f, t, d, peak) { bell(f, t, d, peak, { ratio: 1, index: 1.3, wet: 0.4 }); tone('sine', f * 7, t, 0.04, peak * 0.12); }
  // Harfe: gezupft
  function pluck(f, t, peak) { tone('triangle', f, t, 0.5, peak, { wet: 0.6 }); tone('sine', f * 2, t, 0.15, peak * 0.4); }
  const MOTIF = [0, 5, 9, 12, 7];

  // Mindestabstand pro Klang, damit gleichzeitige Auslöser nicht übersteuern
  const GAP = { voice: 0.03, hover: 0.05, coin: 0.045, card: 0.03, relic: 0.05, pips: 0.03, power: 0.03, deny: 0.15, land: 0.012 };
  const last = {};

  function play(name, o = {}) {
    if (!ac || ac.state !== 'running' || vol.sfx <= 0 || !SFX[name]) return;
    const t = ac.currentTime;
    if (GAP[name] && last[name] && t - last[name] < GAP[name]) return;
    last[name] = t;
    SFX[name](t + 0.005 + (o.delay || 0), o);
  }

  // ── Musik: ruhiger Lounge-Groove (E-Piano, Bass, Besen-Drums), wechselt mit der Spiellage ──
  // Akkorde: [Grundton (MIDI), Intervalle]. Jede Stimmung hat eine Folge von 4 Takten.
  const MOODS = {
    menu: { bpm: 84, lp: 4200, kick: [0, 5], prog: [[53, [0, 4, 7, 11, 14]], [52, [0, 3, 7, 10]], [50, [0, 3, 7, 10, 14]], [55, [0, 5, 7, 10, 14]]], mel: 0.1, pad: 1 },
    table: { bpm: 90, lp: 5200, kick: [0, 3, 5], prog: [[57, [0, 3, 7, 10, 14]], [53, [0, 4, 7, 11]], [50, [0, 3, 7, 10, 14]], [52, [0, 4, 7, 10]]], mel: 0.14, pad: 0.7 },
    shop: { bpm: 96, lp: 6500, kick: [0, 5], prog: [[48, [0, 4, 7, 11, 14]], [57, [0, 3, 7, 10, 14]], [50, [0, 3, 7, 10, 14]], [55, [0, 4, 7, 10, 14]]], mel: 0.2, pad: 0.6 },
    boss: { bpm: 100, lp: 3000, kick: [0, 2, 4, 6], prog: [[50, [0, 3, 7, 14]], [46, [0, 4, 7, 11]], [55, [0, 3, 7, 10, 14]], [57, [0, 4, 7, 10, 13]]], mel: 0.08, pad: 1 },
    lose: { bpm: 70, lp: 1600, kick: [], prog: [[57, [0, 3, 7, 10]], [53, [0, 4, 7, 11]]], mel: 0, pad: 1.4, sparse: true },
    win: { bpm: 96, lp: 7000, kick: [0, 3, 5], prog: [[48, [0, 4, 7, 11, 14]], [53, [0, 4, 7, 11, 14]], [57, [0, 3, 7, 10, 14]], [55, [0, 5, 7, 10, 14]]], mel: 0.24, pad: 0.8 },
  };
  const music = { on: false, mood: 'menu', want: 'menu', step: 0, bar: 0, nextT: 0, timer: null, lastMel: 0 };

  function mood(name) {
    if (!MOODS[name]) return;
    music.want = name;
    if (ac && music.on) musicTone.frequency.setTargetAtTime(MOODS[name].lp, ac.currentTime, 0.8);
  }
  function startMusic() {
    if (music.timer || !ac) return;
    music.on = true;
    music.nextT = ac.currentTime + 0.1;
    music.step = 0; music.bar = 0;
    musicTone.frequency.value = MOODS[music.want].lp;
    applyVolumes();
    music.timer = setInterval(schedule, 30);
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    if (music.nextT < ac.currentTime - 0.05) music.nextT = ac.currentTime + 0.05;   // nach Pausen nicht nachholen
    while (music.nextT < ac.currentTime + 0.18) {
      if (music.step === 0) {
        // Stimmungswechsel nur am Taktanfang
        if (music.want !== music.mood) { music.mood = music.want; music.bar = 0; }
      }
      const md = MOODS[music.mood], beat = 60 / md.bpm, half = beat / 2;
      const swing = music.step % 2 ? half * 0.16 : 0;
      if (vol.music > 0) playStep(md, music.step, music.nextT + swing, beat);
      music.nextT += half;
      if (++music.step >= 8) { music.step = 0; music.bar++; }
    }
  }
  const M_DEST = () => ({ dest: musicTone });
  function playStep(md, s, t, beat) {
    const [root, iv] = md.prog[music.bar % md.prog.length];
    const next = md.prog[(music.bar + 1) % md.prog.length][0];
    const bar = beat * 4;
    // Pad über den ganzen Takt
    if (s === 0 && md.pad) pad(root, iv, t, bar, md.pad);
    // E-Piano: auf 1 und "2 und", gelegentlich auf "4"
    if (!md.sparse) {
      if (s === 0) epChord(root, iv, t, 1);
      if (s === 3) epChord(root, iv, t, 0.65);
      if (s === 6 && Math.random() < 0.35) epChord(root, iv, t, 0.45);
    } else if (s === 0) epChord(root, iv, t, 0.6);
    // Bass
    const b = root - 24 + (root - 24 < 26 ? 12 : 0);
    if (s === 0) bass(b, t, beat * 1.4, 1);
    if (s === 4 && !md.sparse) bass(b + 7, t, beat * 0.9, 0.8);
    if (s === 7 && !md.sparse && Math.random() < 0.6) { const n = next - 24 + (next - 24 < 26 ? 12 : 0); bass(n + (Math.random() < 0.5 ? -1 : 1), t, beat * 0.4, 0.6); }
    // Schlagzeug
    if (md.kick.includes(s)) kick(t, s === 0 ? 1 : 0.75);
    if (!md.sparse) {
      if (s === 2 || s === 6) rim(t);
      hat(t, s % 2 ? 0.45 : 0.8, s === 7 && Math.random() < 0.25);
    }
    // Vibraphon-Melodie: einzelne Töne aus dem Akkord, sparsam
    if (md.mel && Math.random() < md.mel) {
      const pool = iv.map((x) => root + 12 + x).concat(iv.map((x) => root + 24 + x)).filter((m) => m >= 67 && m <= 86 && m !== music.lastMel);
      if (pool.length) { const m = pool[(Math.random() * pool.length) | 0]; music.lastMel = m; bell(mtof(m), t, 1.1, 0.045, { ratio: 4, index: 0.6, dest: musicTone }); }
    }
  }
  // E-Piano (FM mit Verhältnis 1:1, kurzer Anschlag-Oberton)
  function ep(m, t, vel) {
    const f = mtof(m), car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    car.frequency.value = f; mod.frequency.value = f;
    mg.gain.setValueAtTime(f * 1.4 * vel, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.35);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.012 * vel, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    g.connect(musicTone);
    car.start(t); mod.start(t); car.stop(t + 1.7); mod.stop(t + 1.7);
    tone('sine', f * 7, t, 0.04, 0.006 * vel, M_DEST());
  }
  function epChord(root, iv, t, vel) {
    iv.forEach((x, i) => ep(root + 12 + x, t + i * 0.008 + rnd(0, 0.006), vel * rnd(0.8, 1)));
  }
  function pad(root, iv, t, d, amt) {
    iv.slice(0, 4).forEach((x) => [-6, 6].forEach((det) => {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = mtof(root + x); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 900;
      o.connect(f); f.connect(g); g.connect(musicTone);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.011 * amt, t + d * 0.3);
      g.gain.linearRampToValueAtTime(0.008 * amt, t + d * 0.85);
      g.gain.linearRampToValueAtTime(0, t + d + 0.25);
      o.start(t); o.stop(t + d + 0.3);
    }));
  }
  function bass(m, t, d, vel) {
    const f = mtof(m);
    [['sine', 0.16], ['triangle', 0.07]].forEach(([type, v]) => {
      const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      fl.type = 'lowpass'; fl.frequency.value = 520;
      o.connect(fl); fl.connect(g); g.connect(musicTone);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v * vel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(v * vel * 0.45, t + d);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
      o.start(t); o.stop(t + d + 0.12);
    });
  }
  function kick(t, v) { tone('sine', 105, t, 0.22, 0.32 * v, Object.assign({ to: 42, glide: 0.11 }, M_DEST())); }
  function rim(t) { noise(t, 0.035, 0.07, { f: 1900, q: 4, dest: musicTone }); noise(t, 0.12, 0.03, { type: 'highpass', f: 3000, dest: musicTone }); }
  function hat(t, v, open) { noise(t, open ? 0.16 : 0.025, 0.035 * v * rnd(0.7, 1.1), { type: 'highpass', f: 7500, dest: musicTone }); }

  // ── Freischalten (Browser erlauben Ton erst nach einer Eingabe) ─────────
  function unlock() {
    if (!init()) return;
    if (ac.state === 'suspended') ac.resume();
    startMusic();
  }
  // Handy: Browser erlauben Ton erst beim Loslassen (touchend/pointerup), nicht schon beim Berühren
  (window.WG_MOBILE ? ['pointerdown', 'pointerup', 'touchend', 'keydown'] : ['pointerdown', 'keydown']).forEach((ev) => window.addEventListener(ev, unlock, { capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else ac.resume();
  });

  function setVolume(kind, v) {
    vol[kind] = Math.max(0, Math.min(1, v));
    applyVolumes();
  }

  window.WGSound = { unlock, play, mood, setVolume, context: () => (init() ? ac : null), get ready() { return !!ac && ac.state === 'running'; },
    names: () => Object.keys(SFX), _tap: () => (ac ? { ac, post } : null) };   // _tap: nur für automatische Pegel-Tests
})();
