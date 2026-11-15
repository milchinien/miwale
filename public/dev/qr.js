// QR-Code fuer die Dev-Zentrale (Adresse fuers Handy). Ohne Bibliothek: Die
// Seite darf nur eigene Skripte laden (CSP). Byte-Modus, Fehlerkorrektur M,
// Versionen 1-10 (bis 213 Zeichen) -- fuer http://192.168.x.y:5173/ reicht das
// weit. Nach Project Nayuki "QR Code generator" (MIT), stark gekuerzt.
//
//   miwaleQR('http://192.168.178.23:5173/') -> { groesse, dunkel(x, y) }
(() => {
  'use strict';

  // Index = Version. Fehlerkorrektur M.
  const ECC_JE_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const BLOECKE = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

  function rohModule(v) {
    let n = (16 * v + 128) * v + 64;
    if (v >= 2) {
      const a = Math.floor(v / 7) + 2;
      n -= (25 * a - 10) * a - 55;
      if (v >= 7) n -= 36;
    }
    return n;
  }
  const datenWorte = (v) => Math.floor(rohModule(v) / 8) - ECC_JE_BLOCK[v] * BLOECKE[v];

  function mal(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }

  function teiler(grad) {
    const r = new Array(grad).fill(0);
    r[grad - 1] = 1;
    let wurzel = 1;
    for (let i = 0; i < grad; i++) {
      for (let j = 0; j < grad; j++) {
        r[j] = mal(r[j], wurzel);
        if (j + 1 < grad) r[j] ^= r[j + 1];
      }
      wurzel = mal(wurzel, 0x02);
    }
    return r;
  }

  function rest(daten, t) {
    const r = t.map(() => 0);
    for (const b of daten) {
      const f = b ^ r.shift();
      r.push(0);
      t.forEach((k, i) => { r[i] ^= mal(k, f); });
    }
    return r;
  }

  function miwaleQR(text) {
    const bytes = [...new TextEncoder().encode(String(text))];
    let v = 1;
    while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > datenWorte(v) * 8) v++;
    if (v > 10) throw new Error('Text zu lang für den QR-Code');

    // Bitfolge: Modus Byte, Laenge, Daten, Ende, Fuellbytes.
    const bits = [];
    const schreib = (wert, laenge) => { for (let i = laenge - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
    schreib(4, 4);
    schreib(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) schreib(b, 8);
    const kapazitaet = datenWorte(v) * 8;
    schreib(0, Math.min(4, kapazitaet - bits.length));
    schreib(0, (8 - (bits.length % 8)) % 8);
    for (let f = 0xec; bits.length < kapazitaet; f ^= 0xec ^ 0x11) schreib(f, 8);
    const daten = [];
    for (let i = 0; i < bits.length; i += 8) daten.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

    // Bloecke mit Fehlerkorrektur, verschraenkt.
    const anzahl = BLOECKE[v];
    const eccLaenge = ECC_JE_BLOCK[v];
    const roh = Math.floor(rohModule(v) / 8);
    const kurze = anzahl - (roh % anzahl);
    const kurzLaenge = Math.floor(roh / anzahl);
    const t = teiler(eccLaenge);
    const bloecke = [];
    for (let i = 0, k = 0; i < anzahl; i++) {
      const d = daten.slice(k, k + kurzLaenge - eccLaenge + (i < kurze ? 0 : 1));
      k += d.length;
      const ecc = rest(d, t);
      if (i < kurze) d.push(0);
      bloecke.push(d.concat(ecc));
    }
    const worte = [];
    for (let i = 0; i < bloecke[0].length; i++) {
      bloecke.forEach((b, j) => { if (i !== kurzLaenge - eccLaenge || j >= kurze) worte.push(b[i]); });
    }

    // Matrix mit festen Mustern.
    const n = v * 4 + 17;
    const modul = Array.from({ length: n }, () => new Array(n).fill(false));
    const fest = Array.from({ length: n }, () => new Array(n).fill(false));
    const setze = (x, y, d) => { modul[y][x] = d; fest[y][x] = true; };
    for (let i = 0; i < n; i++) { setze(6, i, i % 2 === 0); setze(i, 6, i % 2 === 0); }
    const finder = (x, y) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && xx < n && yy >= 0 && yy < n) setze(xx, yy, d !== 2 && d !== 4);
        }
      }
    };
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    if (v > 1) {
      const a = Math.floor(v / 7) + 2;
      const schritt = Math.ceil((v * 4 + 4) / (a * 2 - 2)) * 2;
      const pos = [6];
      for (let p = n - 7; pos.length < a; p -= schritt) pos.splice(1, 0, p);
      for (let i = 0; i < a; i++) {
        for (let j = 0; j < a; j++) {
          if ((i === 0 && j === 0) || (i === 0 && j === a - 1) || (i === a - 1 && j === 0)) continue;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setze(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
    const format = (maske) => {
      const d = (0 << 3) | maske; // M = 0
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const bit = (i) => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) setze(8, i, bit(i));
      setze(8, 7, bit(6)); setze(8, 8, bit(7)); setze(7, 8, bit(8));
      for (let i = 9; i < 15; i++) setze(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) setze(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) setze(8, n - 15 + i, bit(i));
      setze(8, n - 8, true);
    };
    format(0);
    if (v >= 7) {
      let r = v;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) {
        const d = ((b >>> i) & 1) !== 0;
        const a = n - 11 + (i % 3);
        const c = Math.floor(i / 3);
        setze(a, c, d); setze(c, a, d);
      }
    }

    // Daten im Zickzack von rechts unten.
    let i = 0;
    for (let rechts = n - 1; rechts >= 1; rechts -= 2) {
      if (rechts === 6) rechts = 5;
      for (let s = 0; s < n; s++) {
        for (let j = 0; j < 2; j++) {
          const x = rechts - j;
          const hoch = ((rechts + 1) & 2) === 0;
          const y = hoch ? n - 1 - s : s;
          if (!fest[y][x] && i < worte.length * 8) {
            modul[y][x] = ((worte[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }

    // Maske mit der geringsten Strafe (Laeufe, 2x2-Bloecke, Hell/Dunkel-Verhaeltnis).
    const MASKEN = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    const maskiere = (m) => {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fest[y][x] && MASKEN[m](x, y)) modul[y][x] = !modul[y][x];
    };
    const strafe = () => {
      let s = 0;
      let dunkel = 0;
      for (let a = 0; a < n; a++) {
        let lz = 1; let ls = 1;
        for (let b = 1; b < n; b++) {
          if (modul[a][b] === modul[a][b - 1]) { lz++; if (lz === 5) s += 3; else if (lz > 5) s++; } else lz = 1;
          if (modul[b][a] === modul[b - 1][a]) { ls++; if (ls === 5) s += 3; else if (ls > 5) s++; } else ls = 1;
        }
      }
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (modul[y][x]) dunkel++;
          if (x < n - 1 && y < n - 1) {
            const c = modul[y][x];
            if (c === modul[y][x + 1] && c === modul[y + 1][x] && c === modul[y + 1][x + 1]) s += 3;
          }
        }
      }
      return s + Math.floor(Math.abs(dunkel * 20 - n * n * 10) / (n * n)) * 10;
    };
    let beste = 0;
    let wenigste = Infinity;
    for (let m = 0; m < 8; m++) {
      maskiere(m); format(m);
      const s = strafe();
      if (s < wenigste) { wenigste = s; beste = m; }
      maskiere(m);
    }
    maskiere(beste); format(beste);
    return { groesse: n, version: v, dunkel: (x, y) => modul[y][x] };
  }

  globalThis.miwaleQR = miwaleQR;
})();
