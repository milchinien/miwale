/* Procedural audio for "Jack vs. the Turnip Ancestors" – every sound and every music loop is synthesized
   with the Web Audio API (no audio files, works from file://). Global API: window.Sfx

   Sfx.unlock()                  call on first user input (creates/resumes the AudioContext; also auto-armed on first pointer/key)
   Sfx.play(name, {vol,pan,pitch})
   Sfx.music(mood | null)        crossfade to a mood loop / fade out
   Sfx.setMuted(bool), Sfx.muted, Sfx.setVolume(0..1), Sfx.worldMood(styleId)
   Sfx._renderTest(name|'music:<mood>', seconds, opts) -> Promise<{peak, rms, rmsDb, clipped}>  (OfflineAudioContext)

   Signal chain:  voices -> sfxBus ┐
                  music tracks -> musicBus -> HP/LP ┤-> master(vol/mute) -> compressor -> limiter -> soft clip -> out
                  sends -> convolver reverb (generated IR) / tempo delay (music) ┘                                      */
(function () {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const LS_KEY = 'jack.muted';

  let muted = false;
  try { muted = window.localStorage.getItem(LS_KEY) === '1'; } catch (e) { /* storage blocked */ }
  let volume = 0.8;
  let musicVol = 1, sfxVol = 1; // per-bus volumes (settings menu)
  let E = null; // live engine
  let wantMood = null; // requested mood (may be requested before unlock)
  let timer = 0;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

  /* ------------------------------------------------------------------ engine / graph */

  function makeImpulse(ctx, secs) {
    const sr = ctx.sampleRate, len = Math.floor(sr * secs);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let y = 0, energy = 0;
      const pre = Math.floor(sr * 0.012);
      for (let i = 0; i < len; i++) {
        if (i < pre) { d[i] = 0; continue; }
        const k = (i - pre) / (len - pre);
        const x = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.6);
        const a = 0.55 - 0.45 * k; // tail gets darker
        y += (x - y) * a;
        // a few early reflections
        d[i] = y + (i - pre === Math.floor(sr * (0.017 + ch * 0.004)) ? 0.5 : 0) + (i - pre === Math.floor(sr * (0.031 - ch * 0.006)) ? 0.35 : 0);
        energy += d[i] * d[i];
      }
      const s = 1 / Math.sqrt(energy || 1);
      for (let i = 0; i < len; i++) d[i] *= s;
    }
    return buf;
  }

  function softClipCurve() {
    const n = 2048, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1, ax = Math.abs(x);
      // linear up to 0.75, then smooth knee that never exceeds 0.98
      const y = ax < 0.75 ? ax : 0.75 + 0.23 * Math.tanh((ax - 0.75) / 0.23);
      c[i] = Math.sign(x) * y;
    }
    return c;
  }

  function pulseWave(ctx, duty, harmonics) {
    const re = new Float32Array(harmonics + 1), im = new Float32Array(harmonics + 1);
    for (let n = 1; n <= harmonics; n++) {
      re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty) * (1 - n / (harmonics + 2)); // gentle rolloff = not harsh
    }
    return ctx.createPeriodicWave(re, im);
  }

  function buildEngine(ctx, offline) {
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const Eng = { ctx, offline: !!offline, voices: {}, last: {}, all: [], track: null, pk: { t: -9, i: 0 } };

    const master = g(muted && !offline ? 0 : volume);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.09;
    const clip = ctx.createWaveShaper();
    clip.curve = softClipCurve();
    master.connect(comp); comp.connect(lim); lim.connect(clip); clip.connect(ctx.destination);

    const sfx = g(1);
    sfx.connect(master);

    const musicBus = g(0.17);
    const mhp = ctx.createBiquadFilter(); mhp.type = 'highpass'; mhp.frequency.value = 38;
    const mlp = ctx.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 7200; mlp.Q.value = 0.5;
    musicBus.connect(mhp); mhp.connect(mlp); mlp.connect(master);

    const revIn = g(1);
    const conv = ctx.createConvolver();
    conv.normalize = false;
    conv.buffer = makeImpulse(ctx, 2.2);
    const revLP = ctx.createBiquadFilter(); revLP.type = 'lowpass'; revLP.frequency.value = 5200;
    const revOut = g(0.55);
    revIn.connect(conv); conv.connect(revLP); revLP.connect(revOut); revOut.connect(master);

    const dlyIn = g(1);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.4;
    const fbLP = ctx.createBiquadFilter(); fbLP.type = 'lowpass'; fbLP.frequency.value = 2400;
    const fb = g(0.33);
    const dlyOut = g(0.6);
    dlyIn.connect(delay); delay.connect(fbLP); fbLP.connect(fb); fb.connect(delay); fbLP.connect(dlyOut); dlyOut.connect(musicBus);

    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    Object.assign(Eng, { master, sfx, musicBus, revIn, dlyIn, delay, noiseBuf: nb,
      pulse25: pulseWave(ctx, 0.25, 28), pulse12: pulseWave(ctx, 0.125, 28) });
    return Eng;
  }

  /* ------------------------------------------------------------------ synthesis primitives */

  // Oscillator voice with envelope + optional filter/vibrato/glide. o: {f, type|wave, det, vol, a, dur | len,d,sus,rel,
  //  f2,gT (glide), from,pT (portamento), lp|ft, lp2, lpT, q, vib, vibR, vibD}
  function tone(Eg, dest, t, o) {
    const c = Eg.ctx;
    const n = o.det ? 2 : 1;
    const vol = (o.vol || 0.2) / (n === 2 ? 1.5 : 1);
    if (vol <= 0) return null;
    const a = o.a || 0.004;
    const g = c.createGain();
    const gp = g.gain;
    let end;
    gp.setValueAtTime(0, t);
    gp.linearRampToValueAtTime(vol, t + a);
    if (o.len != null) {
      const hold = Math.max(o.len, a + 0.01);
      const sus = vol * (o.sus == null ? 0.7 : o.sus);
      const rel = o.rel || 0.08;
      gp.setTargetAtTime(sus, t + a, (o.d || 0.1) / 3);
      gp.setTargetAtTime(0, t + hold, rel / 3);
      end = t + hold + rel * 2;
    } else {
      const dur = Math.max(o.dur || 0.2, a + 0.01);
      gp.exponentialRampToValueAtTime(0.0001, t + dur);
      end = t + dur;
    }
    let filt = null;
    if (o.lp) {
      filt = c.createBiquadFilter();
      filt.type = o.ft || 'lowpass';
      filt.frequency.setValueAtTime(o.lp, t);
      if (o.lp2) filt.frequency.exponentialRampToValueAtTime(o.lp2, t + (o.lpT || end - t));
      filt.Q.value = o.q || 0.7;
      filt.connect(g);
    }
    g.connect(dest);
    let lfo = null, lg = null;
    if (o.vib) {
      lfo = c.createOscillator();
      lfo.frequency.value = o.vibR || 5.5;
      lg = c.createGain();
      const vd = o.vibD == null ? 0.15 : o.vibD;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(0, t + vd);
      lg.gain.linearRampToValueAtTime(o.vib, t + vd + 0.25);
      lfo.connect(lg);
      lfo.start(t); lfo.stop(end + 0.02);
    }
    let first = null;
    for (let i = 0; i < n; i++) {
      const osc = c.createOscillator();
      if (o.wave) osc.setPeriodicWave(o.wave); else osc.type = o.type || 'sine';
      if (o.from) {
        osc.frequency.setValueAtTime(o.from, t);
        osc.frequency.exponentialRampToValueAtTime(o.f, t + (o.pT || 0.08));
      } else {
        osc.frequency.setValueAtTime(o.f, t);
        if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.gT || end - t));
      }
      if (n === 2) osc.detune.value = i ? o.det : -o.det;
      if (lg) lg.connect(osc.detune);
      osc.connect(filt || g);
      osc.start(t); osc.stop(end + 0.02);
      if (!first) first = osc;
    }
    first.onended = () => { try { g.disconnect(); if (filt) filt.disconnect(); if (lg) lg.disconnect(); } catch (e) { /* noop */ } };
    return { g, filt, end };
  }

  // Filtered noise burst. o: {f, f2, fT, ft ('bandpass'|'lowpass'|'highpass'), q, vol, a, dur, rate}
  function noise(Eg, dest, t, o) {
    const c = Eg.ctx;
    const src = c.createBufferSource();
    src.buffer = Eg.noiseBuf; src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    const f = c.createBiquadFilter();
    f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f, t);
    const dur = Math.max(o.dur || 0.1, (o.a || 0.002) + 0.01);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur));
    f.Q.value = o.q == null ? (f.type === 'bandpass' ? 1 : 0.7) : o.q;
    const g = c.createGain();
    const a = o.a || 0.002;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol || 0.3, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 0.8);
    src.stop(t + dur + 0.02);
    src.onended = () => { try { g.disconnect(); f.disconnect(); } catch (e) { /* noop */ } };
    return { g, f, end: t + dur };
  }

  /* ------------------------------------------------------------------ melodic instruments (shared by music + jingles) */

  function inst(Eg, dest, t, midi, len, vel, sp, prevMidi) {
    const f = mtof(midi), v = (sp.vol || 0.15) * vel;
    switch (sp.inst) {
      case 'pluck': // nylon/harp-like
        tone(Eg, dest, t, { type: 'triangle', f, dur: sp.dec || 0.55, vol: v, lp: sp.lp || 2600, lp2: (sp.lp || 2600) * 0.3, lpT: 0.25 });
        tone(Eg, dest, t, { type: 'sine', f: f * 2, dur: 0.14, vol: v * 0.22 });
        break;
      case 'harpsi':
        tone(Eg, dest, t, { type: 'sawtooth', f, dur: sp.dec || 0.4, vol: v, lp: 3200, lp2: 700, lpT: 0.2, q: 1.5 });
        break;
      case 'synpluck':
        tone(Eg, dest, t, { type: 'sawtooth', det: 6, f, dur: sp.dec || 0.3, vol: v, lp: sp.lp || 2600, lp2: 450, lpT: 0.18, q: 3 });
        break;
      case 'bell': // music box / celesta
        tone(Eg, dest, t, { type: 'sine', f, dur: sp.dec || 1.4, vol: v, a: 0.002 });
        tone(Eg, dest, t, { type: 'sine', f: f * 2, dur: 0.45, vol: v * 0.28, a: 0.002 });
        tone(Eg, dest, t, { type: 'sine', f: f * 4, dur: 0.12, vol: v * 0.1, a: 0.001 });
        break;
      case 'vibes':
        tone(Eg, dest, t, { type: 'sine', f, dur: sp.dec || 1.8, vol: v, a: 0.003, vib: 9, vibR: 4.5, vibD: 0.05 });
        tone(Eg, dest, t, { type: 'sine', f: f * 4, dur: 0.18, vol: v * 0.12, a: 0.002 });
        break;
      case 'rhodes':
        tone(Eg, dest, t, { type: 'sine', f, len, d: 0.9, sus: 0.45, rel: 0.35, vol: v, a: 0.004 });
        tone(Eg, dest, t, { type: 'sine', f: f * 2, dur: 0.4, vol: v * 0.3 });
        tone(Eg, dest, t, { type: 'triangle', f: f * 0.5, len, d: 0.6, sus: 0.3, rel: 0.3, vol: v * 0.25 });
        break;
      case 'flute':
        tone(Eg, dest, t, { type: 'sine', f, len, a: 0.05, d: 0.15, sus: 0.85, rel: 0.14, vol: v, vib: 14, vibR: 5, vibD: 0.18 });
        tone(Eg, dest, t, { type: 'triangle', f, len, a: 0.04, d: 0.15, sus: 0.6, rel: 0.1, vol: v * 0.25, lp: 1800 });
        break;
      case 'square':
        tone(Eg, dest, t, { type: 'square', f, len, a: 0.008, d: 0.15, sus: 0.55, rel: 0.07, vol: v, lp: sp.lp || 1700, q: 1, vib: 10, vibD: 0.2 });
        break;
      case 'chip':
        tone(Eg, dest, t, { wave: Eg.pulse25, f, len: len * 0.92, a: 0.002, d: 0.08, sus: 0.7, rel: 0.025, vol: v, vib: 16, vibR: 6, vibD: 0.22, lp: 5200 });
        break;
      case 'chiparp':
        tone(Eg, dest, t, { wave: Eg.pulse12, f, len: len * 0.8, a: 0.002, d: 0.05, sus: 0.5, rel: 0.015, vol: v, lp: 4500 });
        break;
      case 'saw':
        tone(Eg, dest, t, { type: 'sawtooth', det: 7, f, len, a: 0.02, d: 0.2, sus: 0.7, rel: 0.15, vol: v, lp: sp.lp || 1800, q: 1.2, vib: 8, vibD: 0.25 });
        break;
      case 'stab':
        tone(Eg, dest, t, { type: 'sawtooth', det: 12, f, dur: 0.24, vol: v, lp: 2300, lp2: 450, lpT: 0.2, q: 2 });
        break;
      case 'pizz':
        tone(Eg, dest, t, { type: 'triangle', f, dur: 0.2, vol: v, lp: 2000, lp2: 600, lpT: 0.15 });
        tone(Eg, dest, t, { type: 'sine', f: f * 2, dur: 0.06, vol: v * 0.25 });
        break;
      case 'theremin':
        tone(Eg, dest, t, { type: 'sine', f, len, a: 0.09, d: 0.2, sus: 0.9, rel: 0.3, vol: v, vib: 28, vibR: 5.6, vibD: 0.05,
          from: prevMidi ? mtof(prevMidi) : 0, pT: 0.1 });
        tone(Eg, dest, t, { type: 'triangle', f: f * 2, len, a: 0.12, sus: 0.8, rel: 0.25, vol: v * 0.08, vib: 28, vibR: 5.6, vibD: 0.05 });
        break;
      case 'organ':
        tone(Eg, dest, t, { type: 'sine', f, len, a: 0.025, d: 0.1, sus: 1, rel: 0.12, vol: v });
        tone(Eg, dest, t, { type: 'sine', f: f * 2, len, a: 0.02, d: 0.1, sus: 1, rel: 0.1, vol: v * 0.45 });
        tone(Eg, dest, t, { type: 'triangle', f: f * 3, len, a: 0.02, d: 0.1, sus: 1, rel: 0.08, vol: v * 0.16 });
        break;
      case 'bass':
      default:
        tone(Eg, dest, t, { type: sp.type || 'triangle', f, len, a: 0.006, d: 0.14, sus: 0.6, rel: 0.06, vol: v, lp: sp.lp || 900, lp2: sp.lp2, lpT: 0.15, q: sp.q || 1 });
        if (sp.sub) tone(Eg, dest, t, { type: 'sine', f: f / 2 < 30 ? f : f / 2, len, a: 0.01, d: 0.2, sus: 0.8, rel: 0.08, vol: v * sp.sub });
    }
  }

  function drum(Eg, dest, t, kind, vel, kit) {
    const chip = kit === 'chip', soft = kit === 'soft' || kit === 'brush' || kit === 'eerie';
    switch (kind) {
      case 'k':
        if (chip) tone(Eg, dest, t, { wave: Eg.pulse25, f: 160, f2: 45, gT: 0.07, dur: 0.13, vol: 0.55 * vel, lp: 1500 });
        else {
          tone(Eg, dest, t, { type: 'sine', f: soft ? 105 : 135, f2: 42, gT: 0.1, dur: soft ? 0.26 : 0.34, vol: (soft ? 0.55 : 0.9) * vel });
          noise(Eg, dest, t, { ft: 'lowpass', f: 1400, dur: 0.025, vol: 0.25 * vel });
        }
        break;
      case 's':
        if (chip) noise(Eg, dest, t, { ft: 'highpass', f: 1500, dur: 0.11, vol: 0.32 * vel, rate: 0.5 });
        else if (kit === 'brush') noise(Eg, dest, t, { f: 2600, q: 0.6, a: 0.02, dur: 0.22, vol: 0.4 * vel });
        else {
          noise(Eg, dest, t, { f: 1900, q: 0.7, dur: 0.17, vol: 0.75 * vel });
          tone(Eg, dest, t, { type: 'triangle', f: 215, f2: 165, dur: 0.09, vol: 0.4 * vel });
        }
        break;
      case 'h':
        noise(Eg, dest, t, { ft: 'highpass', f: chip ? 5500 : 6800, dur: chip ? 0.03 : 0.04, vol: (soft ? 0.14 : 0.22) * vel });
        break;
      case 'o':
        noise(Eg, dest, t, { ft: 'highpass', f: 6000, dur: 0.24, vol: 0.14 * vel });
        break;
      case 'x': // crash-ish swell
        noise(Eg, dest, t, { ft: 'highpass', f: 4200, dur: 1.2, vol: 0.12 * vel });
        break;
      case 'r': // ride
        noise(Eg, dest, t, { f: 6200, q: 0.6, dur: 0.32, vol: 0.13 * vel });
        tone(Eg, dest, t, { type: 'sine', f: 3150, dur: 0.25, vol: 0.012 * vel });
        break;
      case 'p':
        if (kit === 'eerie') { // ticking clock
          tone(Eg, dest, t, { type: 'sine', f: 2300, dur: 0.02, vol: 0.06 * vel });
          noise(Eg, dest, t, { f: 3300, q: 4, dur: 0.018, vol: 0.2 * vel });
        } else noise(Eg, dest, t, { f: 5200, q: 1.2, a: 0.012, dur: 0.07, vol: 0.2 * vel }); // shaker
        break;
      case 't':
        tone(Eg, dest, t, { type: 'sine', f: chip ? 200 : 150, f2: chip ? 90 : 92, gT: 0.2, dur: 0.32, vol: 0.6 * vel });
        noise(Eg, dest, t, { ft: 'lowpass', f: 900, dur: 0.05, vol: 0.18 * vel });
        break;
      case 'c': // clap
        for (let i = 0; i < 3; i++) noise(Eg, dest, t + i * 0.011, { f: 1500, q: 1.3, dur: i === 2 ? 0.16 : 0.05, vol: 0.5 * vel });
        break;
    }
  }

  /* ------------------------------------------------------------------ sound effects */
  // fn(E, out, t, p) -> duration.  vol: base level, max: simultaneous voices, gap: min seconds between triggers,
  // rev: reverb send, jit: random pitch spread
  const T = tone, N = noise;
  const SFX = {
    shoot: { vol: 0.4, max: 4, gap: 0.035, rev: 0.04, jit: 0.07, fn: (Eg, o, t, p) => {
      N(Eg, o, t, { f: 1700 * p, f2: 650 * p, q: 1.3, dur: 0.07, vol: 0.9 });
      T(Eg, o, t, { type: 'sine', f: 620 * p, f2: 300 * p, dur: 0.07, vol: 0.32 });
      return 0.09;
    } },
    hit: { vol: 0.55, max: 6, gap: 0.025, rev: 0.03, jit: 0.1, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'triangle', f: 280 * p, f2: 120 * p, dur: 0.08, vol: 0.6 });
      N(Eg, o, t, { ft: 'lowpass', f: 2600 * p, f2: 700, dur: 0.05, vol: 0.45 });
      return 0.1;
    } },
    crit: { vol: 0.75, max: 4, gap: 0.04, rev: 0.22, jit: 0.05, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'triangle', f: 300 * p, f2: 110 * p, dur: 0.09, vol: 0.6 });
      N(Eg, o, t, { ft: 'lowpass', f: 3500, f2: 800, dur: 0.06, vol: 0.5 });
      T(Eg, o, t + 0.01, { type: 'sine', f: 1568 * p, dur: 0.28, vol: 0.22 });
      T(Eg, o, t + 0.03, { type: 'sine', f: 2349 * p, dur: 0.2, vol: 0.1 });
      return 0.32;
    } },
    kill: { vol: 0.58, max: 6, gap: 0.03, rev: 0.07, jit: 0.12, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 360 * p, f2: 880 * p, gT: 0.045, dur: 0.1, vol: 0.55 });
      N(Eg, o, t, { f: 1300 * p, q: 0.9, dur: 0.045, vol: 0.4 });
      T(Eg, o, t + 0.01, { type: 'triangle', f: 190 * p, f2: 85 * p, dur: 0.12, vol: 0.3 });
      return 0.14;
    } },
    killBig: { vol: 0.55, max: 3, gap: 0.06, rev: 0.2, jit: 0.06, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 115 * p, f2: 36 * p, gT: 0.5, dur: 0.62, vol: 0.9 });
      N(Eg, o, t, { ft: 'lowpass', f: 2200, f2: 160, dur: 0.7, vol: 0.7 });
      T(Eg, o, t, { type: 'sawtooth', f: 78 * p, f2: 40 * p, dur: 0.38, vol: 0.3, lp: 450 });
      T(Eg, o, t, { type: 'sine', f: 280 * p, f2: 720 * p, gT: 0.06, dur: 0.12, vol: 0.35 });
      return 0.75;
    } },
    pickup: { vol: 0.38, max: 8, gap: 0.03, rev: 0.12, jit: 0.015, fn: (Eg, o, t, p) => {
      const pk = Eg.pk;
      pk.i = t - pk.t < 0.4 ? pk.i + 1 : 0;
      pk.t = t;
      const PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const i = pk.i < 8 ? pk.i : 7 + ((pk.i - 7) % 3); // climb, then sparkle on top
      const f = 784 * Math.pow(2, PENT[i] / 12) * p;
      T(Eg, o, t, { type: 'sine', f, f2: f * 1.02, gT: 0.03, dur: 0.1, vol: 0.55, a: 0.002 });
      T(Eg, o, t, { type: 'triangle', f: f * 2, dur: 0.045, vol: 0.1, a: 0.001 });
      return 0.11;
    } },
    levelup: { vol: 0.42, max: 1, gap: 0.3, rev: 0.32, jit: 0, fn: (Eg, o, t, p) => {
      const notes = [69, 73, 76, 81, 85];
      notes.forEach((m, i) => {
        const f = mtof(m) * p;
        T(Eg, o, t + i * 0.065, { type: 'triangle', f, dur: 0.45, vol: 0.45 });
        T(Eg, o, t + i * 0.065, { type: 'sine', f: f * 2, dur: 0.2, vol: 0.12 });
      });
      T(Eg, o, t + 0.33, { type: 'sine', f: mtof(88) * p, dur: 0.9, vol: 0.14, vib: 12, vibD: 0.05 });
      T(Eg, o, t + 0.33, { type: 'sine', f: mtof(93) * p, dur: 0.8, vol: 0.08, vib: 12, vibD: 0.05 });
      N(Eg, o, t, { ft: 'bandpass', f: 1500, f2: 6000, q: 2, a: 0.15, dur: 0.5, vol: 0.18 });
      return 1.25;
    } },
    hurt: { vol: 0.75, max: 2, gap: 0.12, rev: 0.08, jit: 0.05, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sawtooth', det: 18, f: 230 * p, f2: 85 * p, gT: 0.18, dur: 0.24, vol: 0.55, lp: 1400, lp2: 300 });
      N(Eg, o, t, { ft: 'lowpass', f: 1600, f2: 200, dur: 0.13, vol: 0.6 });
      T(Eg, o, t, { type: 'sine', f: 130 * p, f2: 60 * p, dur: 0.16, vol: 0.6 });
      return 0.28;
    } },
    dash: { vol: 0.6, max: 2, gap: 0.08, rev: 0.1, jit: 0.06, fn: (Eg, o, t, p) => {
      N(Eg, o, t, { f: 500 * p, f2: 2600 * p, q: 1.6, a: 0.035, dur: 0.21, vol: 0.9 });
      T(Eg, o, t, { type: 'sine', f: 320 * p, f2: 640 * p, a: 0.02, dur: 0.12, vol: 0.13 });
      return 0.23;
    } },
    rocket: { vol: 0.6, max: 4, gap: 0.05, rev: 0.1, jit: 0.08, fn: (Eg, o, t, p) => {
      N(Eg, o, t, { f: 420 * p, f2: 2300 * p, q: 2, a: 0.02, dur: 0.36, vol: 0.85 });
      N(Eg, o, t, { ft: 'lowpass', f: 900, dur: 0.16, vol: 0.4 });
      T(Eg, o, t, { type: 'sawtooth', f: 95 * p, f2: 280 * p, dur: 0.3, vol: 0.28, lp: 650 });
      return 0.38;
    } },
    explode: { vol: 0.5, max: 4, gap: 0.05, rev: 0.2, jit: 0.1, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 145 * p, f2: 34 * p, gT: 0.45, dur: 0.55, vol: 0.95 });
      N(Eg, o, t, { ft: 'lowpass', f: 4200 * p, f2: 240, fT: 0.5, dur: 0.72, vol: 0.85 });
      N(Eg, o, t, { f: 950 * p, q: 0.7, dur: 0.12, vol: 0.45 });
      return 0.75;
    } },
    nova: { vol: 0.45, max: 2, gap: 0.1, rev: 0.28, jit: 0.04, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 260 * p, f2: 46 * p, gT: 0.4, dur: 0.5, vol: 0.8 });
      N(Eg, o, t, { f: 3200 * p, f2: 280 * p, q: 0.9, a: 0.01, dur: 0.56, vol: 0.65 });
      T(Eg, o, t, { type: 'triangle', det: 10, f: 1320 * p, f2: 660 * p, dur: 0.42, vol: 0.13 });
      return 0.6;
    } },
    bossSpawn: { vol: 0.5, max: 1, gap: 0.6, rev: 0.32, jit: 0, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 95 * p, f2: 38 * p, gT: 0.5, dur: 0.6, vol: 0.8 });
      [55, 55.6, 82.4, 41.2].forEach((f, i) => {
        const r = T(Eg, o, t + 0.05, { type: 'sawtooth', f: f * p, f2: f * 0.86 * p, len: 1.45, a: 0.28, d: 0.3, sus: 0.85, rel: 0.35,
          vol: i === 3 ? 0.3 : 0.24, lp: 160, q: 5, vib: 35 + i * 6, vibR: 6.5 + i * 0.7, vibD: 0.1 });
        const fr = r.filt.frequency;
        fr.exponentialRampToValueAtTime(1150, t + 0.6);
        fr.exponentialRampToValueAtTime(240, t + 1.9);
      });
      N(Eg, o, t + 0.1, { ft: 'lowpass', f: 700, f2: 300, q: 2, a: 0.3, dur: 1.6, vol: 0.32 });
      return 2.2;
    } },
    bossSlam: { vol: 0.65, max: 2, gap: 0.15, rev: 0.28, jit: 0.04, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 92 * p, f2: 28 * p, gT: 0.36, dur: 0.85, vol: 1 });
      N(Eg, o, t, { ft: 'lowpass', f: 1300, f2: 90, dur: 0.6, vol: 0.85 });
      N(Eg, o, t, { f: 320, q: 1, dur: 0.25, vol: 0.55 });
      T(Eg, o, t + 0.02, { type: 'triangle', f: 55 * p, f2: 48 * p, dur: 0.55, vol: 0.35 });
      return 0.9;
    } },
    bossCharge: { vol: 0.38, max: 1, gap: 0.4, rev: 0.2, jit: 0, fn: (Eg, o, t, p) => {
      [0, 0.17, 0.34].forEach((dt, i) => {
        const f = mtof(64 + i * 3) * p;
        T(Eg, o, t + dt, { type: 'square', f, f2: f * 1.06, len: 0.11, a: 0.005, sus: 0.8, rel: 0.04, vol: 0.32, lp: 1900, q: 2 });
      });
      N(Eg, o, t, { f: 300, f2: 3200, q: 2.5, a: 0.4, dur: 0.72, vol: 0.4 });
      T(Eg, o, t, { type: 'sawtooth', det: 9, f: 110 * p, f2: 220 * p, a: 0.3, dur: 0.72, vol: 0.18, lp: 600, lp2: 1800 });
      return 0.8;
    } },
    bossDie: { vol: 0.5, max: 1, gap: 1, rev: 0.38, jit: 0, fn: (Eg, o, t, p) => {
      [[0, 1], [0.28, 0.75], [0.6, 0.85], [1.0, 1]].forEach(([dt, v]) => {
        T(Eg, o, t + dt, { type: 'sine', f: 130 * p, f2: 32 * p, gT: 0.5, dur: 0.6, vol: 0.9 * v });
        N(Eg, o, t + dt, { ft: 'lowpass', f: 3600, f2: 200, dur: 0.65, vol: 0.75 * v });
      });
      T(Eg, o, t, { type: 'sawtooth', det: 14, f: 110 * p, f2: 30 * p, gT: 2, len: 1.8, a: 0.05, d: 0.6, sus: 0.7, rel: 0.4, vol: 0.32,
        lp: 950, lp2: 120, lpT: 2, q: 4, vib: 40, vibR: 7 });
      [69, 73, 76, 81].forEach((m, i) => T(Eg, o, t + 1.25 + i * 0.03, { type: 'sine', f: mtof(m) * p, dur: 2, vol: 0.13, a: 0.04, vib: 8 }));
      N(Eg, o, t + 1.2, { ft: 'highpass', f: 4500, dur: 1.4, vol: 0.12 });
      return 3.4;
    } },
    portal: { vol: 0.38, max: 1, gap: 0.4, rev: 0.48, jit: 0, fn: (Eg, o, t, p) => {
      [69, 71, 72, 76, 80, 81, 83, 84].forEach((m, i) => {
        T(Eg, o, t + i * 0.055, { type: 'sine', f: mtof(m) * p, dur: 0.8, vol: 0.22, a: 0.01, vib: 15, vibR: 7, vibD: 0 });
      });
      T(Eg, o, t, { type: 'triangle', det: 12, f: mtof(57) * p, len: 0.9, a: 0.25, sus: 0.8, rel: 0.4, vol: 0.18, lp: 900, vib: 20, vibR: 3 });
      N(Eg, o, t, { f: 1800, f2: 5200, q: 3, a: 0.3, dur: 1.1, vol: 0.18 });
      return 1.6;
    } },
    worldStart: { vol: 0.34, max: 1, gap: 0.5, rev: 0.3, jit: 0, fn: (Eg, o, t, p) => {
      const ld = { inst: 'pluck', vol: 0.4, dec: 0.6 };
      [69, 72, 76, 80].forEach((m, i) => inst(Eg, o, t + i * 0.11, m + 12 * Math.log2(p), 0.2, 1, ld));
      inst(Eg, o, t + 0.44, 81, 0.8, 1, { inst: 'bell', vol: 0.35, dec: 1.4 });
      inst(Eg, o, t + 0.44, 81, 0.7, 1, { inst: 'flute', vol: 0.18 });
      inst(Eg, o, t, 45, 0.35, 1, { inst: 'bass', vol: 0.45, lp: 900 });
      inst(Eg, o, t + 0.33, 40, 0.1, 0.8, { inst: 'bass', vol: 0.45, lp: 900 });
      inst(Eg, o, t + 0.44, 45, 0.8, 1, { inst: 'bass', vol: 0.5, lp: 900 });
      [57, 60, 64].forEach((m) => T(Eg, o, t + 0.44, { type: 'triangle', f: mtof(m), len: 0.6, a: 0.05, sus: 0.8, rel: 0.4, vol: 0.08, lp: 1400 }));
      drum(Eg, o, t + 0.44, 'x', 0.9, 'acoustic');
      return 1.6;
    } },
    buy: { vol: 0.36, max: 3, gap: 0.05, rev: 0.12, jit: 0, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { wave: Eg.pulse25, f: mtof(83) * p, len: 0.065, a: 0.002, sus: 0.9, rel: 0.01, vol: 0.35, lp: 4500 });
      T(Eg, o, t + 0.07, { wave: Eg.pulse25, f: mtof(88) * p, dur: 0.38, a: 0.002, vol: 0.35, lp: 4500 });
      T(Eg, o, t + 0.07, { type: 'sine', f: mtof(100) * p, dur: 0.12, vol: 0.05 });
      return 0.46;
    } },
    deny: { vol: 0.38, max: 1, gap: 0.15, rev: 0.03, jit: 0, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'square', f: 175 * p, len: 0.08, a: 0.004, sus: 0.9, rel: 0.02, vol: 0.32, lp: 900 });
      T(Eg, o, t + 0.12, { type: 'square', f: 140 * p, len: 0.14, a: 0.004, sus: 0.9, rel: 0.04, vol: 0.32, lp: 800 });
      return 0.32;
    } },
    reroll: { vol: 0.38, max: 2, gap: 0.08, rev: 0.1, jit: 0.02, fn: (Eg, o, t, p) => {
      for (let i = 0; i < 5; i++) T(Eg, o, t + i * 0.04, { type: 'triangle', f: 560 * Math.pow(2, (i * 3) / 12) * p, dur: 0.06, vol: 0.4 });
      N(Eg, o, t, { f: 900, f2: 3200, q: 1.4, a: 0.05, dur: 0.24, vol: 0.4 });
      return 0.3;
    } },
    click: { vol: 0.48, max: 3, gap: 0.025, rev: 0.02, jit: 0.03, fn: (Eg, o, t, p) => {
      T(Eg, o, t, { type: 'sine', f: 1400 * p, f2: 900 * p, dur: 0.035, vol: 0.55, a: 0.001 });
      N(Eg, o, t, { ft: 'highpass', f: 3000, dur: 0.015, vol: 0.15 });
      return 0.05;
    } },
    victory: { vol: 0.36, max: 1, gap: 1, rev: 0.36, jit: 0, fn: (Eg, o, t, p) => {
      const pl = { inst: 'pluck', vol: 0.32, dec: 0.5 };
      const groups = [[[69, 72, 76], 45], [[69, 72, 77], 41], [[71, 74, 79], 43]];
      groups.forEach(([ns, b], gi) => {
        ns.forEach((m, i) => inst(Eg, o, t + gi * 0.36 + i * 0.1, m, 0.2, 1, pl));
        inst(Eg, o, t + gi * 0.36, b, 0.3, 1, { inst: 'bass', vol: 0.4 });
      });
      const t2 = t + 1.1;
      [69, 73, 76, 81].forEach((m) => {
        T(Eg, o, t2, { type: 'sawtooth', det: 8, f: mtof(m), len: 1.4, a: 0.03, d: 0.4, sus: 0.6, rel: 0.6, vol: 0.09, lp: 2200, lp2: 900 });
        inst(Eg, o, t2, m + 12, 1, 0.8, { inst: 'bell', vol: 0.16, dec: 1.8 });
      });
      inst(Eg, o, t2, 81, 1.3, 1, { inst: 'flute', vol: 0.22 });
      inst(Eg, o, t2, 33, 1.4, 1, { inst: 'bass', vol: 0.5, sub: 0.4 });
      drum(Eg, o, t2, 'x', 1, 'acoustic');
      drum(Eg, o, t2, 'k', 0.9, 'acoustic');
      return 3.3;
    } },
    gameover: { vol: 0.32, max: 1, gap: 1, rev: 0.36, jit: 0, fn: (Eg, o, t, p) => {
      const fl = { inst: 'flute', vol: 0.3 };
      [[0, 76, 0.36], [0.4, 74, 0.36], [0.8, 72, 0.36], [1.2, 71, 0.5]].forEach(([dt, m, l]) => inst(Eg, o, t + dt, m, l, 1, fl));
      inst(Eg, o, t + 1.2, 40, 0.5, 1, { inst: 'bass', vol: 0.4 });
      const t2 = t + 1.75;
      inst(Eg, o, t2, 69, 1.3, 1, fl);
      [57, 60, 64].forEach((m) => T(Eg, o, t2, { type: 'triangle', det: 7, f: mtof(m), len: 1.3, a: 0.2, sus: 0.8, rel: 0.6, vol: 0.09, lp: 1000 }));
      inst(Eg, o, t2, 33, 1.4, 1, { inst: 'bass', vol: 0.5, sub: 0.4, lp: 500 });
      return 3.4;
    } },
    midnightBell: { vol: 0.46, max: 2, gap: 0.3, rev: 0.42, jit: 0, fn: (Eg, o, t, p) => {
      const f0 = 98 * p;
      const parts = [[0.5, 5.0, 0.42], [1, 4.0, 0.5], [1.19, 2.8, 0.3], [1.5, 2.4, 0.2], [2, 2.8, 0.28], [2.52, 1.6, 0.12], [3.01, 1.2, 0.1], [4.07, 0.7, 0.06]];
      parts.forEach(([r, d, v], i) => T(Eg, o, t, { type: 'sine', det: i < 2 ? 3 : 0, f: f0 * r, dur: d, vol: v, a: 0.002 + i * 0.0005 }));
      N(Eg, o, t, { f: 1800, q: 1, dur: 0.05, vol: 0.25 });
      return 5.2;
    } },
  };

  function playSfx(Eg, name, opts, t) {
    const def = SFX[name];
    if (!def) return;
    opts = opts || {};
    const c = Eg.ctx;
    // voice + rate limiting
    const vs = Eg.voices[name] || (Eg.voices[name] = []);
    for (let i = vs.length - 1; i >= 0; i--) if (vs[i] <= t) vs.splice(i, 1);
    if (vs.length >= def.max) return;
    if (t - (Eg.last[name] == null ? -9 : Eg.last[name]) < def.gap) return;
    const all = Eg.all;
    for (let i = all.length - 1; i >= 0; i--) if (all[i] <= t) all.splice(i, 1);
    if (all.length >= 40 && def.max >= 4) return; // global cap for spammy sounds
    Eg.last[name] = t;

    const crowd = 1 / (1 + 0.32 * vs.length);
    const vol = def.vol * clamp(opts.vol == null ? 1 : +opts.vol || 0, 0, 1.5) * crowd;
    if (vol <= 0.0005) return;
    const p = clamp(opts.pitch == null ? 1 : +opts.pitch || 1, 0.25, 4) * (1 + (Math.random() * 2 - 1) * (def.jit || 0));

    const v = c.createGain();
    v.gain.value = vol;
    let pn = null;
    if (opts.pan && c.createStereoPanner) {
      pn = c.createStereoPanner();
      pn.pan.value = clamp(+opts.pan || 0, -1, 1);
      v.connect(pn); pn.connect(Eg.sfx);
    } else v.connect(Eg.sfx);
    let s = null;
    if (def.rev) { s = c.createGain(); s.gain.value = def.rev; v.connect(s); s.connect(Eg.revIn); }
    const dur = def.fn(Eg, v, t, p) || 0.5;
    vs.push(t + dur);
    all.push(t + dur);
    if (!Eg.offline) setTimeout(() => { try { v.disconnect(); if (pn) pn.disconnect(); if (s) s.disconnect(); } catch (e) { /* noop */ } }, (dur + 0.5) * 1000);
  }

  /* ------------------------------------------------------------------ music */

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    hminor: [0, 2, 3, 5, 7, 8, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
  };

  /* Mood format: patterns are strings of (steps × bars) chars; one char per 16th.
     bass: 1/3/5/7 chord tones, 8 = root+octave, '-' hold, '.' rest     arp: digit = index into chord tones (+octaves)
     comp: x/X/g = play chord, '-' hold     drums: x normal, X accent, g ghost     lead rhythms: x onset, '-' hold, '.' rest
     prog: chord roots as scale degrees (0 = i), each lasting bpc bars; loop = prog.length*bpc bars (all 16). */
  const MOODS = {
    title: { // spooky carnival music-box waltz
      bpm: 112, steps: 12, root: 57, sc: 'hminor', bpc: 1, level: 0.82,
      prog: [0, 3, 0, 4, 0, 3, 5, 4, 5, 3, 0, 4, 5, 1, 4, 4],
      bass: { inst: 'bass', type: 'triangle', lp: 800, lo: 38, vol: 0.42, p: '1-------....5-------....' },
      comp: { inst: 'pizz', lo: 57, vol: 0.075, p: '....x...x...' },
      pad: { type: 'triangle', det: 6, lp: 1100, vol: 0.035, lo: 52, a: 0.4, rel: 0.6 },
      lead: { inst: 'bell', oct: 1, vol: 0.15, dec: 1.2,
        rh: ['x---x---x---', 'x-------x-x-', 'x-----x-x---', 'x---x-x-x-x-', 'x-x-x-------'], end: ['x-----------', 'x-------x---'] },
      dr: { kit: 'soft', k: 'x...........', p: '....g...g...' },
      rev: { lead: 0.32, comp: 0.18 }, dly: { lead: 0.12 }, fillP: 0,
    },
    cozy: { // autumn fingerpicking, flute, brushes
      bpm: 92, steps: 16, root: 50, sc: 'dorian', bpc: 2, swing: 0.12, level: 0.58,
      prog: [0, 3, 2, 6, 0, 3, 4, 0],
      bass: { inst: 'bass', type: 'triangle', lp: 700, lo: 38, vol: 0.42, p: '1-----5-8-----5-' },
      arp: { inst: 'pluck', lo: 57, vol: 0.085, dec: 0.7, p: '0.1.2.1.0.1.2.1.0.2.1.3.2.4.3.1.' },
      pad: { type: 'triangle', det: 5, lp: 900, vol: 0.03, lo: 53, a: 0.6, rel: 0.8 },
      lead: { inst: 'flute', oct: 1, vol: 0.12,
        rh: ['x---x-x-x-------', 'x-----x-x---x---', 'x-x-x---x-------', '..x-x-x-x---x-x-'], end: ['x---------------', 'x-----x---------'] },
      dr: { kit: 'brush', k: 'x.......x.......', s: '....g.......g...', p: 'g.x.g.x.g.x.g.x.' },
      rev: { lead: 0.3, arp: 0.2 }, dly: { lead: 0.12 }, fillP: 0,
    },
    playful: { // bouncy Brotato-style
      bpm: 124, steps: 16, root: 52, sc: 'hminor', bpc: 1, level: 1.0,
      prog: [0, 0, 3, 3, 5, 5, 4, 4, 0, 0, 3, 3, 5, 4, 0, 4],
      bass: { inst: 'bass', type: 'sawtooth', lp: 650, lo: 38, vol: 0.3, p: '1...5...1...5.8.' },
      comp: { inst: 'pizz', lo: 59, vol: 0.075, p: '..x...x...x...x.' },
      pad: { type: 'sawtooth', det: 8, lp: 750, vol: 0.02, lo: 55, a: 0.3, rel: 0.4 },
      lead: { inst: 'square', oct: 1, vol: 0.075, lp: 1700,
        rh: ['x.x.x...x.x.x...', 'x..x..x.x-x-x...', 'x-x-x-x-x---x...', 'x.x.x.x.x...x-x-'], end: ['x---x---x-------', 'x-x-x-----------'] },
      dr: { kit: 'acoustic', k: 'x.....x.x.......', s: '....x.......x...', h: '..x...x...x...x.' },
      rev: {}, dly: { lead: 0.1 }, fillP: 0.5,
    },
    retro: { // chiptune
      bpm: 144, steps: 16, root: 57, sc: 'hminor', bpc: 1, level: 0.88,
      prog: [0, 5, 3, 4, 0, 5, 6, 4, 3, 4, 0, 5, 3, 1, 4, 4],
      bass: { inst: 'bass', type: 'triangle', lp: 3000, lo: 40, vol: 0.42, p: '1.8.1.8.1.8.5.8.' },
      arp: { inst: 'chiparp', lo: 64, vol: 0.03, p: '0120120120120120' },
      lead: { inst: 'chip', oct: 1, vol: 0.06,
        rh: ['x-x-x-x-x---x-x-', 'x---x-x-x-x-x---', 'x-x.x-x-x---x---', 'x---x---x-x-x-x-'], end: ['x-------x-------', 'x---------------'] },
      dr: { kit: 'chip', k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      rev: { lead: 0.12, arp: 0.1, drm: 0.03 }, dly: { lead: 0.12 }, fillP: 0.5,
    },
    dreamy: { // lush 7th chords, bells, slow
      bpm: 76, steps: 16, root: 59, sc: 'minor', bpc: 2, sev: true, level: 0.72,
      prog: [0, 5, 2, 6, 3, 5, 4, 0],
      bass: { inst: 'bass', type: 'triangle', lp: 500, lo: 35, vol: 0.4, p: '1-------5-------' },
      arp: { inst: 'bell', lo: 66, vol: 0.06, dec: 1.6, p: '0..2..1..3..2.4.' },
      pad: { type: 'sawtooth', det: 10, lp: 800, vol: 0.03, lo: 54, a: 1.0, rel: 1.2 },
      lead: { inst: 'vibes', oct: 1, vol: 0.1,
        rh: ['x-------x-------', 'x---x-------x---', 'x-----x-x-------'], end: ['x---------------'] },
      dr: { kit: 'soft', k: 'x.........x.....', p: '..g...g...g...g.' },
      rev: { lead: 0.4, arp: 0.38, pad: 0.4 }, dly: { lead: 0.2, arp: 0.3 }, fillP: 0,
    },
    eerie: { // drone, augmented chords, theremin, ticking clock
      bpm: 68, steps: 16, root: 50, sc: 'hminor', bpc: 2, level: 0.36,
      prog: [0, 2, 3, 0, 5, 1, 4, 4],
      bass: { inst: 'bass', type: 'sine', lp: 400, lo: 38, vol: 0.45, sub: 0.4, p: '1---------------' },
      arp: { inst: 'bell', lo: 69, vol: 0.05, dec: 1.8, p: '0.....2.....1...' },
      pad: { type: 'triangle', det: 14, lp: 650, vol: 0.045, lo: 50, a: 1.2, rel: 1.5 },
      lead: { inst: 'theremin', oct: 1, vol: 0.085,
        rh: ['x-------x-------', 'x-----------x---', 'x---x-----------'], end: ['x---------------'] },
      dr: { kit: 'eerie', p: 'x...x...x...x...', t: '................x...............' },
      rev: { lead: 0.42, arp: 0.4, pad: 0.35, drm: 0.25 }, dly: { lead: 0.2, arp: 0.25 }, fillP: 0,
    },
    dark: { // gothic organ + harpsichord toccata
      bpm: 100, steps: 16, root: 50, sc: 'hminor', bpc: 1, level: 1.0,
      prog: [0, 4, 0, 4, 3, 0, 4, 4, 5, 3, 4, 0, 5, 1, 4, 4],
      bass: { inst: 'bass', type: 'sawtooth', lp: 480, lo: 38, vol: 0.3, p: '1.1.1.1.1.1.5.8.' },
      arp: { inst: 'harpsi', lo: 62, vol: 0.04, p: '5432543254325432' },
      pad: { inst: 'organ', vol: 0.03, lo: 55, rel: 0.3 },
      lead: { inst: 'saw', oct: 1, vol: 0.06, lp: 1400,
        rh: ['x-------x---x---', 'x---x---x-------', 'x-x-x---x---x---'], end: ['x---------------'] },
      dr: { kit: 'acoustic', k: 'x.......x.......', s: '........X.......', h: '..g...g...g...g.' },
      rev: { pad: 0.35, lead: 0.3, arp: 0.2, drm: 0.12 }, dly: { lead: 0.08 }, fillP: 0.45,
    },
    neon: { // synthwave
      bpm: 110, steps: 16, root: 53, sc: 'minor', bpc: 2, sev: true, level: 0.95,
      prog: [0, 5, 2, 6, 0, 5, 3, 4],
      bass: { inst: 'bass', type: 'sawtooth', lp: 700, lo: 36, vol: 0.28, p: '1.8.1.8.1.8.1.8.' },
      arp: { inst: 'synpluck', lo: 65, vol: 0.04, p: '0123012301230123' },
      pad: { type: 'sawtooth', det: 12, lp: 1000, vol: 0.026, lo: 55, a: 0.4, rel: 0.6 },
      lead: { inst: 'saw', oct: 1, vol: 0.06, lp: 2000,
        rh: ['x---x---x-x-x---', 'x-------x---x-x-', 'x-x-x---x-------'], end: ['x-------x-------', 'x---------------'] },
      dr: { kit: 'acoustic', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
      rev: { drm: 0.12, lead: 0.25 }, dly: { arp: 0.35, lead: 0.2 }, fillP: 0.3,
    },
    boss: { // fast, galloping, tense
      bpm: 150, steps: 16, root: 52, sc: 'hminor', bpc: 1, level: 0.77,
      prog: [0, 0, 1, 0, 5, 5, 4, 4, 0, 0, 1, 0, 3, 1, 4, 4],
      bass: { inst: 'bass', type: 'sawtooth', lp: 600, lo: 33, vol: 0.3, p: '1.11.11.1.11.15.' },
      comp: { inst: 'stab', lo: 59, vol: 0.045, p: 'X.....x.....x...' },
      pad: { type: 'sawtooth', det: 10, lp: 700, vol: 0.022, lo: 52, a: 0.2, rel: 0.3 },
      lead: { inst: 'saw', oct: 1, vol: 0.065, lp: 2200,
        rh: ['x-x-x-x-x-x-x-x-', 'x---x-x-x---x-x-', 'x-x.x-x-x-x.x-x-'], end: ['x-------x---x---', 'x---------------'] },
      dr: { kit: 'acoustic', k: 'x...x...x...x.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      rev: { drm: 0.06 }, dly: { lead: 0.08 }, fillP: 0.6,
    },
    shop: { // spooky lounge: swing, rhodes, vibes, brushes
      bpm: 100, steps: 16, root: 55, sc: 'hminor', bpc: 2, sev: true, swing: 0.28, level: 0.64,
      prog: [0, 3, 1, 4, 0, 3, 5, 4],
      bass: { inst: 'bass', type: 'triangle', lp: 800, lo: 36, vol: 0.45, p: '1---3---5---3---1---5---8---5---' },
      comp: { inst: 'rhodes', lo: 57, vol: 0.05, p: '..x-......x-....' },
      lead: { inst: 'vibes', oct: 1, vol: 0.1,
        rh: ['x-x---x-x-------', 'x---x-x---x-x---', '..x-x-x-x---x---'], end: ['x---------------', 'x-x-x-----------'] },
      dr: { kit: 'brush', k: 'x.........x.....', s: '....g.......g...', r: 'x...x.x.x...x.x.' },
      rev: { lead: 0.3, comp: 0.25 }, dly: { lead: 0.1 }, fillP: 0,
    },
  };

  const DEF_REV = { bass: 0, pad: 0.3, comp: 0.18, arp: 0.22, lead: 0.24, drm: 0.07 };
  const CH_PAN = { comp: 0.25, arp: -0.3, lead: 0.06 };
  const CHANNELS = ['bass', 'pad', 'comp', 'arp', 'lead', 'drm'];

  const degMidi = (m, deg, base) => base + SCALES[m.sc][((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
  const fold = (x, lo) => { while (x < lo) x += 12; while (x >= lo + 12) x -= 12; return x; };
  function chordTones(m, d, lo) {
    const n = m.sev ? 4 : 3, out = [];
    for (let k = 0; k < n; k++) out.push(fold(degMidi(m, d + 2 * k, m.root), lo));
    return out.sort((a, b) => a - b);
  }
  function holdSteps(pat, idx) {
    let n = 1;
    while (pat[idx + n] === '-') n++;
    return n;
  }

  function genPhrase(m, r) {
    const bars = [];
    let h = 3 + Math.floor(r() * 4);
    for (let b = 0; b < 4; b++) bars.push(genBar(m, r, b === 3, () => h, (v) => { h = v; }));
    return bars;
  }
  function genBar(m, r, last, getH, setH) {
    const S = m.steps;
    const rh = pick(r, last ? m.lead.end : m.lead.rh);
    const notes = new Array(S).fill(null);
    let h = getH();
    for (let s = 0; s < S; s++) {
      if (rh[s] !== 'x') continue;
      const len = holdSteps(rh, s);
      if (s % 4 === 0) {
        h = clamp(h + Math.floor(r() * 5) - 2, 1, 9);
        notes[s] = { len, kind: 'ct', h };
      } else {
        const dir = h > 7 ? -1 : h < 3 ? 1 : (r() < 0.5 ? -1 : 1);
        h = clamp(h + dir, 0, 10);
        notes[s] = { len, kind: 'st', h, dir: r() < 0.2 ? dir * 2 : dir };
      }
    }
    setH(h);
    return notes;
  }
  function makeMelody(tr, seed) {
    const m = tr.m, r = mulberry(seed);
    const A = genPhrase(m, r), B = genPhrase(m, r);
    let hh = 5;
    const A2 = A.slice(0, 3).concat([genBar(m, r, true, () => hh, (v) => { hh = v; })]);
    const A3 = A.slice(0, 3).concat([A[3].map((n) => n && { ...n })]);
    // resolve: last onset of final phrase lands on the tonic region
    for (let s = A3[3].length - 1; s >= 0; s--) if (A3[3][s]) { A3[3][s] = { ...A3[3][s], kind: 'ct', h: 7 }; break; }
    tr.mel = A.concat(A2, B, A3);
  }

  function newTrack(Eg, name, t0, fade) {
    const c = Eg.ctx, m = MOODS[name];
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(m.level || 1, t0 + (fade || 0.05));
    out.connect(Eg.musicBus);
    const revS = c.createGain(); revS.gain.value = 1; revS.connect(Eg.revIn);
    const dlyS = c.createGain(); dlyS.gain.value = 1; dlyS.connect(Eg.dlyIn);
    const ch = {};
    for (const k of CHANNELS) {
      const g = c.createGain();
      if (CH_PAN[k] && c.createStereoPanner) {
        const pn = c.createStereoPanner(); pn.pan.value = CH_PAN[k];
        g.connect(pn); pn.connect(out);
      } else g.connect(out);
      const rv = m.rev && m.rev[k] != null ? m.rev[k] : DEF_REV[k];
      if (rv) { const s = c.createGain(); s.gain.value = rv; g.connect(s); s.connect(revS); }
      const dl = m.dly && m.dly[k];
      if (dl) { const s = c.createGain(); s.gain.value = dl; g.connect(s); s.connect(dlyS); }
      ch[k] = g;
    }
    // sends fade together with the track
    const fadeGain = (gp) => { gp.setValueAtTime(0.0001, t0); gp.linearRampToValueAtTime(1, t0 + (fade || 0.05)); };
    fadeGain(revS.gain); fadeGain(dlyS.gain);
    const sp = 60 / m.bpm / 4;
    try { Eg.delay.delayTime.setTargetAtTime(Math.min(sp * 3, 1.5), t0, 0.05); } catch (e) { /* noop */ }
    const tr = { Eg, m, name, out, revS, dlyS, ch, sp, step: 0, next: t0, seed: (Math.random() * 1e9) | 0, rng: mulberry((Math.random() * 1e9) | 0),
      prevLead: 0, prevDeg: null, fill: false };
    makeMelody(tr, tr.seed);
    return tr;
  }

  function fadeTrack(tr, now, secs) {
    for (const gp of [tr.out.gain, tr.revS.gain, tr.dlyS.gain]) {
      try { gp.cancelScheduledValues(now); gp.setValueAtTime(gp.value, now); gp.setTargetAtTime(0, now, secs / 4); } catch (e) { /* noop */ }
    }
    if (!tr.Eg.offline) setTimeout(() => { try { tr.out.disconnect(); tr.revS.disconnect(); tr.dlyS.disconnect(); } catch (e) { /* noop */ } }, (secs + 2.5) * 1000);
  }

  function patChar(pat, S, bar, s) {
    if (!pat) return '.';
    const k = Math.max(1, Math.floor(pat.length / S));
    return pat[(bar % k) * S + s] || '.';
  }
  const VEL = { X: 1, x: 0.75, g: 0.35 };

  function playStep(tr, step, t0) {
    const m = tr.m, Eg = tr.Eg, S = m.steps, sp = tr.sp;
    const bar = Math.floor(step / S), s = step % S;
    const L = m.prog.length * m.bpc;
    const bl = bar % L, cycle = Math.floor(bar / L);
    if (s === 0 && bl === 0 && cycle > 0 && cycle % 2 === 0) makeMelody(tr, tr.seed + cycle);
    const d = m.prog[Math.floor(bl / m.bpc)];
    const t = t0 + (s % 2 ? (m.swing || 0) * sp : 0);
    const r = tr.rng;
    const hum = () => 0.88 + r() * 0.12;

    // pad – once per chord
    if (m.pad && s === 0 && bl % m.bpc === 0) {
      const len = m.bpc * S * sp;
      const tones = chordTones(m, d, m.pad.lo);
      for (const mi of tones) {
        if (m.pad.inst) inst(Eg, tr.ch.pad, t, mi, len, 1, m.pad);
        else tone(Eg, tr.ch.pad, t, { type: m.pad.type, det: m.pad.det, f: mtof(mi), len: len - 0.02, a: m.pad.a || 0.3, d: 0.3, sus: 0.85,
          rel: m.pad.rel || 0.6, vol: m.pad.vol, lp: m.pad.lp || 900 });
      }
    }
    // bass
    if (m.bass) {
      const pat = m.bass.p, k = Math.max(1, Math.floor(pat.length / S)), idx = (bar % k) * S + s, c = pat[idx];
      if (c && c !== '.' && c !== '-') {
        const rootB = fold(degMidi(m, d, m.root), m.bass.lo);
        const off = { 1: 0, 3: 2, 5: 4, 7: 6 }[c];
        let mi = c === '8' ? rootB + 12 : rootB;
        if (off) { mi = degMidi(m, d + off, m.root); while (mi < rootB) mi += 12; while (mi >= rootB + 12) mi -= 12; }
        inst(Eg, tr.ch.bass, t, mi, holdSteps(pat, idx) * sp * 0.92, hum(), m.bass);
      }
    }
    const introLead = cycle === 0 && bl < 4;
    const breakdown = cycle % 2 === 1 && bl >= 8 && bl < 12;
    // comp
    if (m.comp) {
      const pat = m.comp.p, k = Math.max(1, Math.floor(pat.length / S)), idx = (bar % k) * S + s, c = pat[idx];
      if (VEL[c]) {
        const len = holdSteps(pat, idx) * sp;
        for (const mi of chordTones(m, d, m.comp.lo)) inst(Eg, tr.ch.comp, t, mi, len, VEL[c] * hum(), m.comp);
      }
    }
    // arp
    if (m.arp && !(cycle === 0 && bl < 2)) {
      const c = patChar(m.arp.p, S, bar, s);
      if (c >= '0' && c <= '9') {
        const tones = chordTones(m, d, m.arp.lo);
        const n = tones.length, i = +c;
        const mi = tones[i % n] + 12 * Math.floor(i / n);
        const vel = (breakdown ? 1.2 : 1) * (s % 4 === 0 ? 1 : 0.8) * hum();
        inst(Eg, tr.ch.arp, t, mi, sp * 1.5, vel, m.arp);
      }
    }
    // lead
    if (m.lead && !introLead && !breakdown) {
      const nt = tr.mel[bl % tr.mel.length][s];
      if (nt) {
        const cts = m.sev ? [0, 2, 4, 6] : [0, 2, 4];
        let e = tr.prevDeg == null ? 4 : tr.prevDeg;
        if (nt.kind === 'st' && tr.prevDeg != null) e = tr.prevDeg + nt.dir;
        else {
          for (const dd of [0, -1, 1, -2, 2, -3, 3]) {
            const cand = nt.h + dd;
            if (cts.indexOf((((cand - d) % 7) + 7) % 7) >= 0) { e = cand; break; }
          }
        }
        e = isFinite(e) ? clamp(e, -2, 12) : 4;
        tr.prevDeg = e;
        const mi = degMidi(m, e, m.root + 12 * (m.lead.oct || 1));
        inst(Eg, tr.ch.lead, t, mi, nt.len * sp * 0.95, (s % 4 === 0 ? 1 : 0.85) * hum(), m.lead, tr.prevLead);
        tr.prevLead = mi;
      }
    }
    // drums
    const dr = m.dr;
    if (dr && !(cycle === 0 && bl < 2)) {
      if (s === 0) tr.fill = bl % 4 === 3 && r() < (m.fillP || 0);
      const kit = dr.kit;
      const inFill = tr.fill && s >= S - 4;
      if (s === 0 && bl % 8 === 0 && kit === 'acoustic' && !(cycle === 0 && bl === 0)) drum(Eg, tr.ch.drm, t, 'x', 0.8, kit);
      for (const kind of ['k', 's', 'h', 'o', 'p', 't', 'r']) {
        if (inFill && (kind === 's' || kind === 'h' || kind === 't')) continue;
        if (breakdown && kind === 'k' && bl < 10) continue;
        const c = patChar(dr[kind], S, bar, s);
        if (VEL[c]) drum(Eg, tr.ch.drm, t, kind, VEL[c] * hum(), kit);
      }
      if (inFill) {
        const j = s - (S - 4);
        drum(Eg, tr.ch.drm, t, kit === 'chip' || j % 2 ? 's' : 't', 0.5 + j * 0.15, kit);
      }
    }
  }

  function scheduleTrack(tr, until) {
    while (tr.next < until) {
      try { playStep(tr, tr.step, tr.next); } catch (e) { if (tr.Eg.offline) throw e; } // never stall the sequencer
      tr.step++;
      tr.next += tr.sp;
    }
  }

  function startMusic(Eg, mood) {
    const now = Eg.ctx.currentTime;
    if (Eg.track) { fadeTrack(Eg.track, now, mood ? 1.6 : 1.4); Eg.track = null; }
    if (mood) {
      Eg.track = newTrack(Eg, mood, now + 0.08, 1.2);
    }
  }

  function tick() {
    if (!E || !E.track || E.ctx.state !== 'running') return;
    const now = E.ctx.currentTime, tr = E.track;
    if (tr.next < now - 0.03) { // fell behind (throttled tab / suspended): skip silently instead of bursting
      while (tr.next < now) { tr.step++; tr.next += tr.sp; }
    }
    const ahead = (typeof document !== 'undefined' && document.hidden) ? 1.6 : 0.15;
    try { scheduleTrack(tr, now + ahead); } catch (e) { /* never break the game */ }
  }

  /* ------------------------------------------------------------------ public API */

  const WORLD_MOOD = {
    harvest16: 'cozy', cartoon: 'playful', voxel: 'playful', clay: 'playful', paper: 'cozy', crossstitch: 'cozy', candy: 'playful',
    lowpoly: 'dreamy', nes8bit: 'retro', kuerbisboy: 'retro', popart: 'playful', watercolor: 'dreamy', chalk: 'eerie', linocut: 'eerie',
    stainedglass: 'dreamy', dusk: 'dreamy', vangogh: 'dreamy', shadow: 'eerie', neon: 'neon', gothic: 'dark',
  };

  function analyze(buf) {
    let peak = 0, sum = 0, clipped = 0, n = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
        if (a >= 0.999) clipped++;
        sum += d[i] * d[i];
        n++;
      }
    }
    const rms = Math.sqrt(sum / Math.max(1, n));
    const r3 = (x) => Math.round(x * 1000) / 1000;
    return { peak: r3(peak), rms: r3(rms), peakDb: r3(20 * Math.log10(peak || 1e-9)), rmsDb: r3(20 * Math.log10(rms || 1e-9)), clipped };
  }

  const Sfx = {
    unlock() {
      try {
        if (!AC) return;
        if (!E) {
          E = buildEngine(new AC({ latencyHint: 'interactive' }), false);
          E.sfx.gain.value = sfxVol; E.musicBus.gain.value = 0.17 * musicVol;
          timer = setInterval(tick, 25);
          if (wantMood) startMusic(E, wantMood);
        }
        if (E.ctx.state === 'suspended') {
          const pr = E.ctx.resume();
          if (pr && pr.catch) pr.catch(() => {});
        }
      } catch (e) { /* audio unavailable */ }
    },
    play(name, opts) {
      try {
        if (!E || muted || E.ctx.state !== 'running') return;
        playSfx(E, name, opts, E.ctx.currentTime + 0.005);
      } catch (e) { /* never throw into the game */ }
    },
    music(mood) {
      try {
        if (mood != null && !MOODS[mood]) mood = 'eerie';
        mood = mood || null;
        if (mood === wantMood && (!E || (E.track ? E.track.name === mood : !mood))) return;
        wantMood = mood;
        if (E) startMusic(E, mood);
      } catch (e) { /* noop */ }
    },
    setMuted(b) {
      muted = !!b;
      try { window.localStorage.setItem(LS_KEY, muted ? '1' : '0'); } catch (e) { /* noop */ }
      try {
        if (E) { const now = E.ctx.currentTime; E.master.gain.cancelScheduledValues(now); E.master.gain.setTargetAtTime(muted ? 0 : volume, now, 0.04); }
      } catch (e) { /* noop */ }
    },
    get muted() { return muted; },
    setVolume(v) {
      volume = clamp(+v || 0, 0, 1);
      try {
        if (E && !muted) { const now = E.ctx.currentTime; E.master.gain.cancelScheduledValues(now); E.master.gain.setTargetAtTime(volume, now, 0.04); }
      } catch (e) { /* noop */ }
    },
    get volume() { return volume; },
    setMusicVolume(v) {
      musicVol = clamp(+v || 0, 0, 1);
      try { if (E) E.musicBus.gain.setTargetAtTime(0.17 * musicVol, E.ctx.currentTime, 0.05); } catch (e) { /* noop */ }
    },
    setSfxVolume(v) {
      sfxVol = clamp(+v || 0, 0, 1);
      try { if (E) E.sfx.gain.setTargetAtTime(sfxVol, E.ctx.currentTime, 0.05); } catch (e) { /* noop */ }
    },
    get unlocked() { return !!E && E.ctx.state === 'running'; },
    get mood() { return wantMood; },
    worldMood(id) { return WORLD_MOOD[id] || 'eerie'; },
    names: Object.keys(SFX),
    moods: Object.keys(MOODS),
    // Offline render for automated checks. name: sfx name or 'music:<mood>'. opts: {repeat, interval, vol, pan, pitch}
    _renderTest(name, seconds, opts) {
      try {
        if (!OAC) return Promise.reject(new Error('no OfflineAudioContext'));
        seconds = seconds || 2;
        opts = opts || {};
        const sr = 44100;
        const ctx = new OAC(2, Math.ceil(sr * seconds), sr);
        const TE = buildEngine(ctx, true);
        TE.master.gain.value = opts.volume == null ? 0.8 : opts.volume;
        if (name.indexOf('music:') === 0) {
          const mood = name.slice(6);
          if (!MOODS[mood]) return Promise.reject(new Error('unknown mood ' + mood));
          // schedule in 0.5 s windows via suspend/resume, like the live lookahead scheduler (lets ended nodes get released)
          const tr = newTrack(TE, mood, 0.02, 0.05);
          scheduleTrack(tr, 0.6);
          for (let w = 0.5; w < seconds - 0.1; w += 0.5) {
            const until = Math.min(w + 0.6, seconds - 0.05);
            ctx.suspend(w).then(() => { scheduleTrack(tr, until); return new Promise((r) => setTimeout(r, 0)); }).then(() => ctx.resume());
          }
        } else {
          if (!SFX[name]) return Promise.reject(new Error('unknown sfx ' + name));
          const n = opts.repeat || 1, iv = opts.interval || 0.05;
          for (let i = 0; i < n; i++) playSfx(TE, name, opts, 0.02 + i * iv);
        }
        const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
        return ctx.startRendering().then((buf) => {
          const r = analyze(buf);
          r.cpu = Math.round((((typeof performance !== 'undefined' ? performance : Date).now() - t0) / 1000 / seconds) * 1000) / 1000; // render time / audio time
          return r;
        });
      } catch (e) { return Promise.reject(e); }
    },
  };

  // convenience: arm unlock on the first user gesture (the game may also call Sfx.unlock() itself)
  if (typeof window.addEventListener === 'function') {
    const arm = () => { Sfx.unlock(); if (E && E.ctx.state === 'running') ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.removeEventListener(ev, arm, true)); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, arm, true));
  }

  window.Sfx = Sfx;
})();
