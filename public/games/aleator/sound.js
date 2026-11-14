// Aleator – Sound. Die Effekte und Jingles sind echte Aufnahmen (sounds/sfx-data.js, CC0: Kenney und VCSL),
// die hier gemischt, umgestimmt und zu kleinen Melodien zusammengesetzt werden. window.WGSound: unlock(), play(name, opts), mood(name), setVolume(...)
// Die Musik kommt normalerweise aus Dateien (music.js); die erzeugte Musik hier unten ist nur der Ersatz, falls keine da sind.
(() => {
  'use strict';
  let ac = null, preLim = null, out, post, sfxBus, sfxWet, musicBus, musicTone, verbIn, noiseBuf;
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
    // Schutz-Limiter: fängt kurze Spitzen ab (Chip-Klacks, Würfel), damit nichts übersteuert
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    comp.connect(lim); preLim = comp;
    post = gain(1); lim.connect(post); post.connect(ac.destination);
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

  // ── Synth-Bausteine (nur noch für die Ersatz-Musik, falls keine Musikdateien da sind) ──
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
  // ── Aufnahmen: sounds/sfx-data.js (Base64-MP3), schon beim Laden der Seite dekodiert ──────────
  // Würfel, Chips, Karten, Bücher, Holz: Kenney (kenney.nl). Instrumente: VCSL (github.com/sgossner/VCSL). Alles CC0.
  const BUF = {};
  const NOTE = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };
  const INST = {};   // Instrument -> [{ name, m }] (m = MIDI-Note der Aufnahme)
  (function decodeAll() {
    const data = window.WG_SFX;
    if (!data) return;
    Object.keys(data).forEach((name) => {
      const k = /^([a-z]+)_([A-G]s?)(\d)$/.exec(name);
      if (k) (INST[k[1]] = INST[k[1]] || []).push({ name, m: 12 * (+k[3] + 1) + NOTE[k[2]] });
    });
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    let dc;
    try { dc = new OAC(1, 1, 44100); } catch (e) { return; }
    Object.keys(data).forEach((name) => {
      const bin = atob(data[name]), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const done = (b) => { BUF[name] = { b, off: leadIn(b) }; };
      try { const p = dc.decodeAudioData(bytes.buffer, done, () => {}); if (p && p.catch) p.catch(() => {}); } catch (e) { /* Format nicht unterstützt */ }
    });
  })();
  // MP3 beginnt je nach Browser mit etwas Stille (Encoder-Verzögerung): bis kurz vor den Anschlag überspringen
  function leadIn(b) {
    const d = b.getChannelData(0);
    let pk = 0;
    for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    const thr = pk * 0.01, lim = Math.min(d.length, b.sampleRate * 0.15);
    for (let i = 0; i < lim; i++) if (Math.abs(d[i]) > thr) return Math.max(0, i - b.sampleRate * 0.001) / b.sampleRate;
    return 0;
  }
  // Eine Aufnahme abspielen.
  // o: vol, rate, bend (Zielrate; bei note() als Faktor) + bendAt/bendT, pan, wet (Hallanteil), at (Startstelle in s), dur (danach kurz ausblenden), fadeIn, lp (Tiefpass in Hz)
  function smp(name, t, o = {}) {
    const s = BUF[name];
    if (!s) return;
    const src = ac.createBufferSource(), g = ac.createGain(), vol = (o.vol === undefined ? 1 : o.vol) * level;
    src.buffer = s.b;
    const rate = o.rate || 1;
    src.playbackRate.setValueAtTime(rate, t);
    if (o.bend) { src.playbackRate.setValueAtTime(rate, t + (o.bendAt || 0)); src.playbackRate.linearRampToValueAtTime(o.bend, t + (o.bendAt || 0) + (o.bendT || 0.4)); }
    if (o.fadeIn) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + o.fadeIn); } else g.gain.setValueAtTime(vol, t);
    let n = src;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; n.connect(f); n = f; }
    n.connect(g); n = g;
    if (o.pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = o.pan; n.connect(p); n = p; }
    route(n, o);
    src.start(t, s.off + (o.at || 0));
    const len = (s.b.duration - s.off - (o.at || 0)) / rate;
    if (o.dur && o.dur < len) {
      const end = t + o.dur, f = Math.min(0.06, o.dur * 0.3);
      g.gain.setValueAtTime(vol, end - f);
      g.gain.linearRampToValueAtTime(0.0001, end);
      src.stop(end + 0.02);
    }
  }
  // Ein Ton auf einem Instrument (oder dem passendsten aus einer Liste): nächstliegende Aufnahme, umgestimmt
  function note(inst, m, t, o = {}) {
    let best = null;
    [].concat(inst).forEach((k) => (INST[k] || []).forEach((s) => { if (!best || Math.abs(s.m - m) < Math.abs(best.m - m)) best = s; }));
    if (!best) return;
    const r = Math.pow(2, (m - best.m) / 12) * (o.rate || 1);
    smp(best.name, t, Object.assign({}, o, { rate: r, bend: o.bend ? o.bend * r : 0 }));
  }
  // Zufällige Variante, aber nie zweimal hintereinander dieselbe
  const lastPick = {};
  function pick(list) {
    let i = (Math.random() * list.length) | 0;
    if (list.length > 1 && list[i] === lastPick[list[0]]) i = (i + 1) % list.length;
    return (lastPick[list[0]] = list[i]);
  }
  const DIE = ['die1', 'die2', 'die3', 'die4'], SHAKE = ['shake1', 'shake2', 'shake3'], THROW = ['throw1', 'throw2', 'throw3'];
  const CHIP = ['chip1', 'chip2'], CLACK = ['clack1', 'clack2', 'clack3', 'clack4'], STACK = ['stack1', 'stack2', 'stack4', 'stack5', 'stack6'];
  const HANDLE = ['handle1', 'handle6'], CARD = ['cplace1', 'cplace2', 'cplace3', 'cslide1', 'cslide2', 'cslide4', 'cslide5'];
  // Pentatonik: Schritt n -> MIDI-Note (für ansteigende Wertungstöne)
  const PENTA = [0, 2, 4, 7, 9];
  const pm = (base, n) => base + PENTA[n % 5] + 12 * Math.floor(n / 5);
  const MOTIF = [0, 5, 9, 12, 7];   // Würfel-Motiv: steigt und fällt wie ein geworfener Würfel

  // ── Klänge ────────────────────────────────────────────────────────────
  const SFX = {
    // Knopf: ein Chip klackt auf den Tisch
    click: (t) => { smp(pick(CLACK), t, { vol: 0.42, rate: rnd(1.02, 1.14) }); smp('woodL1', t, { vol: 0.1, rate: 1.4 }); },
    hover: (t) => smp(pick(CHIP), t, { vol: 0.07, rate: rnd(1.45, 1.6), dur: 0.05 }),
    // Würfel halten / loslassen: Holz-Klick, beim Halten heller
    hold: (t, o) => {
      smp(pick(['claves1', 'claves2']), t, { vol: o.on ? 0.24 : 0.17, rate: o.on ? 1.2 : 0.92 });
      smp(pick(DIE), t, { vol: o.on ? 0.42 : 0.3, rate: o.on ? 1.08 : 0.9 });
    },
    // Würfel im Becher (echte Aufnahme, auf die Wurfdauer gekürzt)
    rattle: (t, o) => {
      const d = Math.min(1.2, o.dur || 0.6), n = o.n || 5;
      smp(pick(SHAKE), t, { vol: Math.min(0.75, 0.38 + 0.06 * n), dur: d, at: 0.12, rate: rnd(0.97, 1.06) });
    },
    // Ein Würfel landet auf dem Filz
    land: (t) => smp(pick(DIE), t, { vol: rnd(0.5, 0.65), rate: rnd(0.9, 1.12), pan: rnd(-0.3, 0.3) }),
    lucky: (t) => {
      for (let i = 0; i < 5; i++) note('glk', pm(79, i * 2), t + i * 0.04, { vol: 0.2, wet: 0.45 });
      smp('chimes_fast', t, { vol: 0.2, wet: 0.4, dur: 1.2 });
    },
    // Wertung: Pips = Chip + Marimba, Power = Vibraphon (oben Glockenspiel); beide steigen pro Schritt an
    pips: (t, o) => {
      const s = Math.min(o.step || 0, 13);
      smp(pick(STACK), t, { vol: 0.34, rate: 1 + s * 0.025 });
      note('mar', pm(60, s), t, { vol: 0.5, wet: 0.15 });
    },
    power: (t, o) => {
      const s = Math.min(o.step || 0, 13), m = pm(60, s);
      note(['vib', 'glk'], m, t, { vol: m > 80 ? 0.24 : 0.42, wet: 0.3 });
      smp('handle3', t, { vol: 0.16, rate: 1 + s * 0.02 });
    },
    // xPower: Bassdrum, Becken, Vibraphon und Glockenspiel zusammen, dazu ein Griff in die Chips
    xpower: (t) => {
      smp('bd_hard', t, { vol: 0.72 });
      smp('crash_short', t, { vol: 0.32, wet: 0.3 });
      note('vib', 72, t, { vol: 0.42, wet: 0.4 });
      note('glk', 91, t + 0.012, { vol: 0.2, wet: 0.4 });
      note('glk', 96, t + 0.03, { vol: 0.16, wet: 0.4 });
      smp(pick(HANDLE), t + 0.02, { vol: 0.3 });
    },
    relic: (t, o) => { note('glk', pm(79, (o.step || 0) % 8), t, { vol: 0.17, wet: 0.3 }); smp(pick(CARD), t, { vol: 0.12, rate: 1.1 }); },
    coin: (t) => {
      smp(pick(['coins2', 'stack1', 'stack4', 'stack5']), t, { vol: 0.36, rate: rnd(0.95, 1.1) });
      note('glk', pick([91, 96]), t + 0.01, { vol: 0.08, rate: rnd(0.995, 1.005) });
    },
    pay: (t) => { smp('chip3', t, { vol: 0.42, rate: 0.9 }); smp(pick(CLACK), t + 0.06, { vol: 0.26, rate: 0.85 }); },
    // Kaufen: Chips über den Tisch, Münzen, Triangel-"Kling"
    buy: (t) => {
      smp('handle1', t, { vol: 0.45 });
      smp('coins1', t + 0.03, { vol: 0.32, dur: 0.5 });
      note('vib', 72, t + 0.05, { vol: 0.22, wet: 0.3 });
      note('vib', 79, t + 0.13, { vol: 0.22, wet: 0.3 });
      smp('tri', t + 0.1, { vol: 0.13, wet: 0.35, dur: 1 });
    },
    sell: (t) => {
      smp(pick(CLACK), t, { vol: 0.38 });
      smp('coins2', t + 0.04, { vol: 0.36 });
      note('vib', 76, t + 0.05, { vol: 0.2, wet: 0.3 });
      note('vib', 71, t + 0.13, { vol: 0.2, wet: 0.3 });
    },
    // Abgelehnt: zweimal dumpf auf Holz klopfen
    deny: (t) => { smp('woodM1', t, { vol: 0.5, rate: 0.85 }); smp('woodM1', t + 0.11, { vol: 0.42, rate: 0.72 }); },
    card: (t) => smp(pick(CARD), t, { vol: 0.36, rate: rnd(0.94, 1.08) }),
    shuffle: (t) => smp('shuffle', t, { vol: 0.42 }),
    // Magie: Windspiel und ein Harfen-Glissando
    magic: (t) => {
      smp('chimes_fast', t, { vol: 0.24, wet: 0.4, dur: 1.6 });
      for (let i = 0; i < 7; i++) note('harp', pm(67, i + ((Math.random() * 2) | 0)), t + 0.04 + i * 0.05, { vol: 0.26, wet: 0.5 });
      note('glk', 91, t + 0.42, { vol: 0.12, wet: 0.6 });
    },
    // Anlauf vor dem Einschlag: Karte zischt, Becken schwillt bis zum Treffer an
    whoosh: (t) => { smp(pick(['cshove1', 'cshove3']), t, { vol: 0.32, rate: 1.15 }); smp('swell', t, { vol: 0.26, at: 0.5, dur: 0.48 }); },
    impact: (t, o) => {
      const big = !!o.big;
      smp('bd_hard', t, { vol: big ? 0.95 : 0.75 });
      smp('timp_mid', t, { vol: big ? 0.55 : 0.42, wet: 0.3 });
      smp('punch0', t, { vol: 0.22 });
      smp(pick(HANDLE), t + 0.02, { vol: 0.3 });
      if (big) {
        smp('crash', t, { vol: 0.42, wet: 0.4 });
        note('tub', 72, t + 0.01, { vol: 0.28, wet: 0.5 });
        [72, 76, 79, 84].forEach((m, i) => note('glk', m + 12, t + i * 0.02, { vol: 0.1, wet: 0.5 }));
      }
    },
    land_score: (t, o) => {
      smp('timp_hi', t, { vol: 0.32 });
      smp(pick(STACK), t, { vol: 0.35 });
      [72, 76, 79, 84].forEach((m, i) => note('mar', m, t + i * 0.04, { vol: o.big ? 0.36 : 0.26, wet: 0.4 }));
    },
    // Bust: tiefe Pauke, dumpfer Schlag, Klavier-Cluster ganz unten, die Würfel kullern weg
    bust: (t) => {
      smp('timp_lo', t, { vol: 0.75 });
      smp('punch0', t, { vol: 0.4 });
      note('pno', 36, t, { vol: 0.32 }); note('pno', 37, t + 0.008, { vol: 0.26 }); note('pno', 42, t + 0.015, { vol: 0.22 });
      smp(pick(THROW), t + 0.05, { vol: 0.32, rate: 0.85 });
    },
    // ── Jingles: alle aus dem Würfel-Motiv, gespielt auf echten Instrumenten ──
    cleared: (t) => {
      // Runde geschafft: Motiv auf Vibraphon und Marimba, dann ein warmer Dur-9-Akkord
      MOTIF.forEach((m, i) => { note('vib', 67 + m, t + i * 0.085, { vol: 0.32, wet: 0.4 }); note('mar', 79 + m, t + i * 0.085, { vol: 0.2, wet: 0.3 }); });
      const c = t + 0.48;
      [60, 64, 67, 71, 74].forEach((m, i) => note('vibs', m, c + i * 0.012, { vol: 0.18, wet: 0.5 }));
      note('pno', 48, c, { vol: 0.28 }); note('pno', 36, c, { vol: 0.2 });
      smp('bd_soft', c, { vol: 0.35 });
      smp('tri', c + 0.02, { vol: 0.12, wet: 0.4 });
      smp('handle1', c + 0.04, { vol: 0.3 });
      for (let i = 0; i < 5; i++) SFX.coin(c + 0.08 + i * 0.07);
    },
    cupdraw: (t) => {
      // Becher dreimal schütteln, Harfen-Glissando, dann das Motiv in Es-Dur auf Vibraphon und Glockenspiel
      for (let k = 0; k < 3; k++) smp(pick(SHAKE), t + k * 0.22, { vol: 0.4, at: 0.25, dur: 0.16 });
      smp(pick(THROW), t + 0.62, { vol: 0.35 });
      const g = t + 0.75;
      for (let i = 0; i < 14; i++) note('harp', pm(63, i), g + i * 0.035, { vol: 0.22, wet: 0.5 });
      const r = g + 0.55;
      MOTIF.forEach((m, i) => { note('vib', 63 + m, r + i * 0.09, { vol: 0.3, wet: 0.5 }); note('glk', 87 + m, r + i * 0.09, { vol: 0.1, wet: 0.5 }); });
      const c = r + 0.5;
      [55, 58, 63, 67].forEach((m) => note('vibs', m, c, { vol: 0.2, wet: 0.6 }));
      note('pno', 39, c, { vol: 0.28 }); note('pno', 51, c, { vol: 0.22 });
      note('tub', 63, c, { vol: 0.24, wet: 0.6 });
      smp('chimes_asc', c - 0.3, { vol: 0.18, wet: 0.6 });
      smp('crash_short', c, { vol: 0.18, wet: 0.5 });
    },
    gameover: (t) => {
      // Ein Würfel rollt aus, dann das Motiv rückwärts in Moll auf dem Tenorsaxophon ("wah wah wah waaah")
      [0, 0.16, 0.3, 0.42, 0.51].forEach((d, i) => smp(pick(DIE), t + d, { vol: 0.5 - i * 0.08, rate: 1 - i * 0.05 }));
      const m0 = t + 0.6;
      [59, 64, 60, 57].forEach((m, i) => note('sax', m, m0 + i * 0.26, { vol: 0.3, dur: 0.3, wet: 0.35 }));
      note('sax', 52, m0 + 1.04, { vol: 0.34, dur: 1.5, wet: 0.4, bend: Math.pow(2, -1.5 / 12), bendAt: 0.7, bendT: 0.7 });
      const c = m0 + 1.25;
      [57, 60, 64, 67].forEach((m, i) => note('pno', m, c + i * 0.015, { vol: 0.16, wet: 0.4 }));
      note('pno', 45, c, { vol: 0.22 });
      note('vibs', 57, c, { vol: 0.14, wet: 0.6 });
    },
    fanfare: (t) => {
      // Paukenwirbel, Saxophon-Fanfare, dann Becken, Röhrenglocken und ein großer Akkord
      smp('timp_roll', t, { vol: 0.4, dur: 1.05, fadeIn: 0.8 });
      const seq = [[60, 0.0, 0.12], [60, 0.14, 0.12], [60, 0.28, 0.12], [67, 0.42, 0.26], [64, 0.7, 0.12], [67, 0.84, 0.12]];
      seq.forEach(([m, d, len]) => { note('saxs', m, t + d, { vol: 0.32, dur: len + 0.08, wet: 0.35 }); note('vib', m + 12, t + d, { vol: 0.16, wet: 0.4 }); });
      const c = t + 1.0;
      note('sax', 72, c, { vol: 0.32, dur: 1.4, wet: 0.45 });
      smp('crash', c, { vol: 0.4, wet: 0.4 });
      smp('bd_hard', c, { vol: 0.7 });
      note('tub', 72, c, { vol: 0.26, wet: 0.5 }); note('tub', 76, c + 0.02, { vol: 0.2, wet: 0.5 });
      [60, 64, 67].forEach((m) => note('vibs', m, c, { vol: 0.2, wet: 0.5 }));
      note('pno', 36, c, { vol: 0.25 }); note('pno', 48, c, { vol: 0.2 });
      smp('chimes_asc', c + 0.1, { vol: 0.16, wet: 0.6 });
      for (let i = 0; i < 8; i++) SFX.coin(c + 0.05 + i * 0.08);
    },
    achieve: (t) => {
      // Achievement: das Motiv hell auf dem Glockenspiel, dann ein weicher Akkord mit Triangel und Windspiel
      MOTIF.forEach((m, i) => note('glk', 79 + m, t + i * 0.06, { vol: 0.17, wet: 0.5 }));
      const c = t + 0.34;
      [60, 64, 67, 72].forEach((m) => note('vibs', m, c, { vol: 0.17, wet: 0.5 }));
      smp('tri', c, { vol: 0.13, wet: 0.5 });
      smp('chimes_asc', c - 0.15, { vol: 0.13, wet: 0.6, dur: 1.6 });
      for (let i = 0; i < 3; i++) SFX.coin(c + 0.05 + i * 0.07);
    },
    chime: (t) => { smp('tri', t, { vol: 0.2, wet: 0.45 }); note('glk', 91, t + 0.1, { vol: 0.12, wet: 0.5 }); },
    // Telefon nach dem Showdown: Klingeln im Ohr (Triangel, hoch und leise), Klingelstoß eines alten Telefons, Abheben, Auflegen
    tinnitus: (t) => { smp('tri_long', t, { vol: 0.2, rate: 1.62, fadeIn: 0.3, wet: 0.35 }); smp('tri_long', t + 0.05, { vol: 0.08, rate: 2.43, fadeIn: 0.4, wet: 0.5, pan: 0.4 }); },
    ring: (t, o) => smp('phone_ring', t, { vol: o.soft ? 0.32 : 0.55, wet: 0.12 }),
    pickup: (t) => { smp('phone_up', t, { vol: 0.6 }); smp('phone_switch', t + 0.07, { vol: 0.4, rate: 0.9 }); },
    hangup: (t) => { smp('phone_down', t, { vol: 0.55 }); smp('phone_latch', t + 0.05, { vol: 0.35, rate: 0.95 }); },
    // Boss: Gong, Paukenwirbel, tiefe Röhrenglocke
    boss: (t) => {
      smp('gong', t, { vol: 0.6, wet: 0.3 });
      smp('bd_hard', t, { vol: 0.55 });
      smp('timp_roll', t + 0.05, { vol: 0.32, dur: 1.4 });
      note('tub', 50, t + 0.02, { vol: 0.26, wet: 0.5 });
      note('pno', 36, t, { vol: 0.24 }); note('pno', 42, t, { vol: 0.18 });
    },
    panel: (t, o) => {
      if (o.close) smp('bookclose', t, { vol: 0.36 });
      else { smp('leather', t, { vol: 0.3 }); smp(pick(['cslide4', 'cslide5']), t + 0.01, { vol: 0.2 }); }
    },
    page: (t) => smp(pick(['flip2', 'flip3']), t, { vol: 0.34, rate: rnd(0.95, 1.1) }),
    save: (t) => { smp(pick(STACK), t, { vol: 0.36 }); note('glk', 91, t + 0.05, { vol: 0.12, wet: 0.4 }); note('glk', 96, t + 0.12, { vol: 0.1, wet: 0.4 }); },
    // Jonnys Stimme: kurze Saxophon-Silben, Tonhöhe je nach Stimmung (wie eine nuschelnde Trompete im Trickfilm)
    voice: (t, o) => {
      const v = o.vol === undefined ? 1 : o.vol;
      if (v <= 0) return;
      const m = Math.max(44, Math.min(66, 52 + 12 * Math.log2((o.f || 520) / 520)));
      note('saxs', m, t, { vol: 0.24 * v, dur: 0.085, rate: rnd(0.98, 1.02), wet: 0.1 });
    },
  };
  SFX.win = SFX.cleared;
  SFX.lose = SFX.gameover;

  // Pegel pro Klang (gemessen gegen die Musik und die übrigen Effekte; Wertung und Einschläge etwas vorne)
  const LEVEL = { click: 2.014, rattle: 0.649, land: 2.449, lucky: 0.343, pips: 0.239, power: 0.187, relic: 0.777, pay: 0.922,
    buy: 0.208, sell: 0.217, deny: 0.398, card: 0.795, shuffle: 0.761, magic: 0.208, land_score: 0.153, achieve: 0.186,
    panel: 0.755, page: 0.978, save: 0.921, voice: 0.337, hover: 3.243, hold: 1.054, xpower: 0.133, coin: 1.237, whoosh: 0.809,
    impact: 0.114, bust: 0.147, cleared: 0.1, cupdraw: 0.101, gameover: 0.187, fanfare: 0.104, chime: 0.531, boss: 0.127, win: 0.1,
    lose: 0.187 };
  let level = 1;
  // Mindestabstand pro Klang, damit gleichzeitige Auslöser nicht übersteuern
  const GAP = { voice: 0.03, hover: 0.05, coin: 0.045, card: 0.03, relic: 0.05, pips: 0.03, power: 0.03, deny: 0.15, land: 0.012 };
  const last = {};

  function play(name, o = {}) {
    if (!ac || ac.state !== 'running' || vol.sfx <= 0 || !SFX[name]) return;
    const t = ac.currentTime;
    if (GAP[name] && last[name] && t - last[name] < GAP[name]) return;
    last[name] = t;
    level = LEVEL[name] || 1;
    try { SFX[name](t + 0.005 + (o.delay || 0), o); } finally { level = 1; }
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
    names: () => Object.keys(SFX), loaded: () => Object.keys(BUF).length, sample: (name, o) => { if (ac && ac.state === 'running') smp(name, ac.currentTime + 0.01, o || {}); }, _tap: () => (ac ? { ac, post, pre: preLim } : null) };   // _tap: nur für automatische Pegel-Tests
})();
