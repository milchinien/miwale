// Aleator – Replay-Rekorder. window.WGReplay
// Schreibt jede gewertete Hand als kleines Skript mit: Würfe, gehaltene Würfel, Shifts, Wertungsschritte, Ergebnis.
// Behalten wird nur die beste Hand eines Runs. Der spätere GIF-Export zeichnet die Hand aus diesem Skript neu.
((global) => {
  'use strict';
  const VERSION = 1, MAX_FRAMES = 40, MAX_STEPS = 80;
  // Eine Würfelseite kompakt: [Zahl, Art]
  const compact = (f) => [f.v, f.kind];

  function begin(dieTypes) {
    return { v: VERSION, types: dieTypes.slice(), frames: [], steps: [] };
  }
  // Stand nach einem Wurf oder Shift
  function frame(rec, kind, faces, held) {
    if (!rec || rec.frames.length >= MAX_FRAMES) return rec;
    rec.frames.push({ k: kind, f: faces.map(compact), h: held.map((x) => (x ? 1 : 0)) });
    return rec;
  }
  // Ein Wertungsschritt: nur was man später zeigen muss (und der Zählerstand danach)
  function step(rec, s, chips, mult) {
    if (!rec || rec.steps.length >= MAX_STEPS) return rec;
    const e = { c: chips, m: mult };
    for (const k of ['i', 'j', 'r', 'src', 'id', 'text']) if (s[k] !== undefined) e[k] = s[k];
    rec.steps.push(e);
    return rec;
  }
  function finish(rec, info) {
    if (!rec) return null;
    return Object.assign(rec, { name: info.name, total: info.total, chips: info.chips, mult: info.mult, bust: !!info.bust,
      relics: (info.relics || []).slice(), stage: info.stage, cup: info.cup });
  }
  // Besser als die bisherige beste Hand? Busts zählen nie.
  const better = (candidate, best) => !!candidate && !candidate.bust && candidate.total > 0 && (!best || candidate.total > best.total);

  const api = { VERSION, MAX_FRAMES, MAX_STEPS, begin, frame, step, finish, better };
  global.WGReplay = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
