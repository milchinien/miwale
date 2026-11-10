// Aleator – kleiner GIF-Encoder (GIF89a, LZW, feste Palette, ohne Dithering). window.WGGif
// Bilder kommen als Palette-Indizes. Pro Bild wird nur der Bereich gespeichert, der sich geändert hat (kleine Dateien).
((global) => {
  'use strict';
  class Bytes {
    constructor() { this.a = new Uint8Array(1 << 18); this.n = 0; }
    grow(extra) { if (this.n + extra <= this.a.length) return; const b = new Uint8Array(Math.max(this.a.length * 2, this.n + extra)); b.set(this.a.subarray(0, this.n)); this.a = b; }
    byte(v) { this.grow(1); this.a[this.n++] = v; }
    word(v) { this.byte(v & 255); this.byte((v >> 8) & 255); }
    text(s) { for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); }
    done() { return this.a.subarray(0, this.n); }
  }
  // Feste Palette: Spielfarben zuerst, danach ein 6×6×6-Würfel (216). Höchstens 256 Einträge.
  function buildPalette(hexes = []) {
    const out = [], seen = new Set();
    const add = (c) => { const k = c.join(','); if (!seen.has(k) && out.length < 256) { seen.add(k); out.push(c); } };
    hexes.slice(0, 40).forEach((h) => add([1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16))));
    for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) add([r * 51, g * 51, b * 51]);
    return out;
  }
  // Nächste Palettenfarbe, mit Zwischenspeicher pro 15-Bit-Farbe
  function mapper(palette) {
    const cache = new Int16Array(32768).fill(-1);
    return (r, g, b) => {
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      if (cache[key] >= 0) return cache[key];
      let best = 0, bd = 1e9;
      for (let i = 0; i < palette.length; i++) { const p = palette[i], d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = i; } }
      return (cache[key] = best);
    };
  }
  function indexFrame(rgba, map) {
    const out = new Uint8Array(rgba.length / 4);
    for (let i = 0, k = 0; i < rgba.length; i += 4, k++) out[k] = map(rgba[i], rgba[i + 1], rgba[i + 2]);
    return out;
  }
  function bitsFor(n) { let b = 1; while ((1 << b) < n) b++; return b; }

  // Pixel-Strom eines Rechtecks als LZW-Blöcke schreiben
  function lzw(out, minCode, count, pixelAt) {
    out.byte(minCode);
    const clear = 1 << minCode, end = clear + 1;
    let block = [], acc = 0, nb = 0;
    const flush = () => { out.byte(block.length); block.forEach((b) => out.byte(b)); block = []; };
    const emit = (code, size) => { acc |= code << nb; nb += size; while (nb >= 8) { block.push(acc & 255); acc >>>= 8; nb -= 8; if (block.length === 255) flush(); } };
    let table = new Map(), next = end + 1, size = minCode + 1;
    emit(clear, size);
    let prefix = pixelAt(0);
    for (let i = 1; i < count; i++) {
      const k = pixelAt(i), key = (prefix << 8) | k, hit = table.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      emit(prefix, size);
      if (next < 4096) { table.set(key, next); if (next === (1 << size) && size < 12) size++; next++; }
      else { emit(clear, size); table = new Map(); next = end + 1; size = minCode + 1; }
      prefix = k;
    }
    emit(prefix, size);
    emit(end, size);
    if (nb > 0) block.push(acc & 255);
    if (block.length) flush();
    out.byte(0);
  }

  class Writer {
    // scale: ganzzahlig vergrößern (Pixel-Art bleibt scharf)
    constructor(width, height, palette, delayCs, scale = 1) {
      Object.assign(this, { width, height, palette, delayCs, scale, prev: null, out: new Bytes(), frames: 0 });
      const o = this.out, bits = bitsFor(palette.length), S = 1 << bits;
      this.bits = Math.max(2, bits);
      o.text('GIF89a'); o.word(width * scale); o.word(height * scale);
      o.byte(0x80 | ((bits - 1) << 4) | (bits - 1)); o.byte(0); o.byte(0);
      for (let i = 0; i < S; i++) { const c = palette[i] || [0, 0, 0]; o.byte(c[0]); o.byte(c[1]); o.byte(c[2]); }
      o.byte(0x21); o.byte(0xFF); o.byte(11); o.text('NETSCAPE2.0'); o.byte(3); o.byte(1); o.word(0); o.byte(0);   // Endlosschleife
    }
    add(frame, delayCs = this.delayCs) {
      const { width: w, height: h, prev, scale, out: o } = this;
      let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
      if (prev) {
        x0 = w; y0 = h; x1 = -1; y1 = -1;
        for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k++) if (frame[k] !== prev[k]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }   // nichts geändert: ein Pixel genügt
      }
      const fw = x1 - x0 + 1, fh = y1 - y0 + 1, pw = fw * scale, ph = fh * scale;
      o.byte(0x21); o.byte(0xF9); o.byte(4); o.byte(0x04); o.word(delayCs); o.byte(0); o.byte(0);
      o.byte(0x2C); o.word(x0 * scale); o.word(y0 * scale); o.word(pw); o.word(ph); o.byte(0);
      const min = Math.max(2, this.bits);
      lzw(o, min, pw * ph, (i) => frame[(y0 + Math.floor(Math.floor(i / pw) / scale)) * w + x0 + Math.floor((i % pw) / scale)]);
      this.prev = frame;
      this.frames++;
    }
    finish() { this.out.byte(0x3B); return this.out.done(); }
  }

  const api = { buildPalette, mapper, indexFrame, Writer };
  global.WGGif = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
