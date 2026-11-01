/*!
 * BalatroFX – Balatro-inspirierter Grafikstil für Browser-Spiele (WebGL2)
 *
 * Eigene Implementierung des Looks: Paint-Swirl-Hintergrund, CRT-Postprocessing
 * (Scanlines, Bloom, Wölbung, chromatische Aberration, Rauschen), Karten mit
 * 3D-Tilt, "Juice"-Wackeln, Editionen (Foil / Holo / Polychrome / Negative),
 * Dissolve/Materialize, Pixel-Partikel, Pop-up-Texte, Flammen und Screen-Shake.
 * Enthält keine Original-Assets von Balatro.
 *
 * Nutzung: <script src="balatro-fx/balatro-fx.js"></script>  ->  window.BalatroFX
 */
(function (global) {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════
  //  Farben
  // ════════════════════════════════════════════════════════════════════════

  /** Balatro-ähnliche Palette (Annäherung an die Farben im Spiel). */
  const PALETTE = {
    RED: '#FE5F55', BLUE: '#009DFF', GREEN: '#4BC292', PALE_GREEN: '#56A887',
    ORANGE: '#FDA200', IMPORTANT: '#FF9A00', GOLD: '#EAC058', MONEY: '#F3B958',
    YELLOW: '#FFFF00', PURPLE: '#8867A5', WHITE: '#FFFFFF',
    BLACK: '#374244', L_BLACK: '#4F6367', GREY: '#5F7377', JOKER_GREY: '#BFC7D5',
    CHIPS: '#009DFF', MULT: '#FE5F55', XMULT: '#FE5F55',
    PLANET: '#13AFCE', TAROT: '#A782D1', SPECTRAL: '#4584FA',
    HEARTS: '#F03464', DIAMONDS: '#F06B3F', SPADES: '#403995', CLUBS: '#235955',
    PANEL: '#3A5055', PANEL_DARK: '#26353A', CARD: '#FFFFFF', CARD_EDGE: '#BFC7D5',
    BLIND: '#50846E', BOSS: '#B44430', WON: '#4F6367',
  };

  function hexToRgb(h) {
    if (Array.isArray(h)) return h.slice(0, 3);
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function rgbToHex(c) {
    const f = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
    return '#' + f(c[0]) + f(c[1]) + f(c[2]);
  }
  const mixHex = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const darken = (h, amt) => rgbToHex(hexToRgb(h).map((v) => v * (1 - amt)));
  const lighten = (h, amt) => rgbToHex(hexToRgb(h).map((v) => v + (1 - v) * amt));
  const scaleHex = (h, k) => rgbToHex(hexToRgb(h).map((v) => v * k));
  const rgba = (h, a) => { const c = hexToRgb(h); return `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${a})`; };

  // ════════════════════════════════════════════════════════════════════════
  //  Mathe / Easing
  // ════════════════════════════════════════════════════════════════════════

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const Ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
  };

  /**
   * "Juice": das typische Balatro-Wackeln. Skalierung schwingt mit sin(50.8·t),
   * Rotation mit sin(40.8·t), beide klingen über 0.4 s kubisch/quadratisch ab.
   */
  class Juice {
    constructor() { this.s = 0; this.r = 0; this.start = -1; this.end = -1; this.sAmt = 0; this.rAmt = 0; }
    up(scale = 0.4, rot) {
      this.sAmt = scale;
      this.rAmt = rot !== undefined ? rot : (Math.random() < 0.5 ? -1 : 1) * 0.6 * scale * 0.4;
      this.start = this._t || 0; this.end = this.start + 0.4;
    }
    update(t) {
      this._t = t;
      if (t > this.end) { this.s = 0; this.r = 0; return this; }
      const dt = t - this.start, k = Math.max(0, (this.end - t) / (this.end - this.start));
      this.s = this.sAmt * Math.sin(50.8 * dt) * k * k * k;
      this.r = this.rAmt * Math.sin(40.8 * dt) * k * k;
      return this;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Shader
  // ════════════════════════════════════════════════════════════════════════

  const GLSL_NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v/0.9375; }
vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
  vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1.0e-10;
  return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)), d/(q.x+e), q.x); }
vec3 hsv2rgb(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.), clamp(p-1.,0.,1.), c.y); }
`;

  const VS_FULLSCREEN = `#version 300 es
out vec2 vUv;
void main(){ vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); vUv = p; gl_Position = vec4(p*2.-1., 0., 1.); }`;

  // Hintergrund: der "Paint-Swirl". Aufbau wie der Balatro-Hintergrund:
  // verpixelte Koordinaten -> Polar-Wirbel -> 5 Iterationen Domain-Warping -> 3-Farben-Mix.
  const FS_BACKGROUND = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uFlow, uSpin, uSpinEase;
uniform vec3 uC1, uC2, uC3;
uniform float uContrast, uLighting, uSpinAmount, uPixel;
uniform vec2 uOffset;
uniform int uStyle;
out vec4 o;
${GLSL_NOISE}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// Gemeinsame 3-Farben-Mischung: paint ~0 -> Farbe 2, ~1 -> Farbe 1, sonst Farbe 3
vec3 paintCol(float paint){
  float cm = 0.25 * uContrast + 0.5 * uSpinAmount + 1.2;
  paint = clamp(paint, 0., 2.);
  float c1p = max(0., 1. - cm * abs(1. - paint));
  float c2p = max(0., 1. - cm * abs(paint));
  float c3p = 1. - min(1., c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5. - 4., 0.) + uLighting * max(c2p * 5. - 4., 0.);
  return (0.3 / uContrast) * uC1 + (1. - 0.3 / uContrast) * (uC1 * c1p + uC2 * c2p + uC3 * c3p) + light;
}
// Lava: zähe Blasen durch zweifach verzerrtes Rauschen
float styleLava(vec2 uv, float t, float spin){
  vec2 p = rot(spin * 0.6) * uv * 3.2;
  float tt = t * 0.035;
  vec2 q = vec2(fbm(p + vec2(0., -tt)), fbm(p + vec2(4.7, 1.3) + vec2(tt * 0.7, 0.)));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) - vec2(0., tt * 1.2)), fbm(p + 2.2 * q + vec2(8.3, 2.8) + tt * 0.5));
  return smoothstep(0.22, 0.78, fbm(p + 2.6 * r)) * 2.;
}
// Tide: diagonale Wellenbänder mit Strömung
float styleTide(vec2 uv, float t, float spin){
  vec2 p = rot(0.5 + spin * 0.4) * uv * 9.;
  float tt = t * 0.06;
  float w = sin(p.x + sin(p.y * 0.8 + tt) * 1.6 + tt * 0.7)
          + 0.6 * sin(p.y * 1.3 - tt * 0.9 + cos(p.x * 0.5 - tt * 0.4) * 2.)
          + 1.6 * (fbm(p * 0.35 + vec2(tt * 0.2, -tt * 0.15)) - 0.5);
  return smoothstep(0.05, 0.95, 0.5 + 0.22 * w) * 2.;
}
// Pips: schräg wanderndes Raster aus Würfelaugen, die in Wellen wachsen und schrumpfen
float stylePips(vec2 uv, float t, float spin){
  vec2 p = rot(0.35 + spin * 0.5) * uv * 16. + vec2(t * 0.04, t * 0.025);
  vec2 cell = floor(p), fp = fract(p) - 0.5;
  float wave = 0.5 + 0.5 * sin(cell.x * 0.45 - cell.y * 0.3 + t * 0.12 + 3. * fbm(cell * 0.15 + t * 0.01));
  float rad = 0.08 + 0.3 * wave;
  float dotm = 1. - smoothstep(rad - 0.04, rad, length(fp));
  float field = smoothstep(0.35, 0.65, fbm(uv * 2.5 + vec2(t * 0.01, -t * 0.008)));
  return mix(field * 2., 1., dotm);
}
// Kaleido: sechsfach gespiegeltes, langsam drehendes Rauschen
float styleKaleido(vec2 uv, float t, float spin){
  float seg = 6.2831853 / 6.;
  float a = mod(atan(uv.y, uv.x) + spin * 0.5 + t * 0.006, seg);
  a = abs(a - seg * 0.5);
  vec2 k = vec2(cos(a), sin(a)) * length(uv) * 6.;
  float tt = t * 0.03;
  vec2 q = vec2(fbm(k + vec2(tt, 0.)), fbm(k + vec2(3.1, -tt)));
  return smoothstep(0.2, 0.8, fbm(k * 1.2 + 2. * q - vec2(0., tt))) * 2.;
}
void main(){
  vec2 res = uRes;
  float px = length(res) / uPixel;
  vec2 uv = (floor(gl_FragCoord.xy / px) * px - 0.5 * res) / length(res) - uOffset;
  if (uStyle > 0) {
    float paint = uStyle == 1 ? styleLava(uv, uFlow, uSpin) : uStyle == 2 ? styleTide(uv, uFlow, uSpin)
                : uStyle == 3 ? stylePips(uv, uFlow, uSpin) : styleKaleido(uv, uFlow, uSpin);
    o = vec4(paintCol(paint), 1.);
    return;
  }
  float uvLen = length(uv);
  float speed = uSpin + 302.2;
  float ang = atan(uv.y, uv.x) + speed - uSpinEase * 20. * (uSpinAmount * uvLen + (1. - uSpinAmount));
  vec2 mid = (res / length(res)) * 0.5;
  uv = vec2(uvLen * cos(ang) + mid.x, uvLen * sin(ang) + mid.y) - mid;
  uv *= 30.;
  speed = uFlow;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv  += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv  -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float cm = 0.25 * uContrast + 0.5 * uSpinAmount + 1.2;
  float paint = min(2., max(0., length(uv) * 0.035 * cm));
  float c1p = max(0., 1. - cm * abs(1. - paint));
  float c2p = max(0., 1. - cm * abs(paint));
  float c3p = 1. - min(1., c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5. - 4., 0.) + uLighting * max(c2p * 5. - 4., 0.);
  vec3 col = (0.3 / uContrast) * uC1 + (1. - 0.3 / uContrast) * (uC1 * c1p + uC2 * c2p + uC3 * c3p) + light;
  o = vec4(col, 1.);
}`;

  // Sprites (Karten, Würfel …): 3D-Tilt mit perspektivisch korrekter Interpolation.
  const VS_SPRITE = `#version 300 es
layout(location=0) in vec2 aPos;
uniform vec4 uView;
uniform vec2 uCenter, uSize, uTilt;
uniform float uRot, uScale;
out vec2 vUv;
void main(){
  vec3 p = vec3(aPos * uSize, 0.);
  float cx = cos(uTilt.x), sx = sin(uTilt.x);
  p = vec3(p.x * cx, p.y, -p.x * sx);
  float cy = cos(uTilt.y), sy = sin(uTilt.y);
  p = vec3(p.x, p.y * cy + p.z * sy, -p.y * sy + p.z * cy);
  float dist = max(uSize.x, uSize.y) * 2.6;
  float w = max((dist + p.z) / dist, 0.2);
  vec2 q = p.xy * uScale;
  float c = cos(uRot), s = sin(uRot);
  q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  vec2 world = uCenter + q / w;
  vec2 clip = world * uView.xy + uView.zw;
  vUv = aPos + 0.5;
  gl_Position = vec4(clip * w, 0., w);
}`;

  const FS_SPRITE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexSize, uTilt;
uniform float uTime, uSeed, uDissolve, uShadow, uHover, uAlpha, uFlash;
uniform int uEdition;
uniform vec3 uBurn1, uBurn2;
uniform vec4 uTint;
out vec4 o;
${GLSL_NOISE}
void main(){
  vec2 puv = (floor(vUv * uTexSize) + 0.5) / uTexSize;   // Effekte im Pixelraster der Textur
  vec4 tex = texture(uTex, vUv);
  if (tex.a < 0.02) discard;
  vec3 c = tex.rgb / tex.a;
  float a = tex.a;
  bool burning = false;

  if (uDissolve > 0.) {
    float n = fbm(puv * uTexSize / 13. + uSeed * 37.);
    vec2 e = abs(puv - 0.5) * 2.;
    n = n * 0.78 + 0.22 * (1. - max(e.x, e.y));
    float th = uDissolve * 1.18 - 0.08;
    if (n < th) discard;
    if (n < th + 0.08) { c = mix(uBurn1, uBurn2, (n - th) / 0.08); a = 1.; burning = true; }
  }
  if (uShadow > 0.5) { o = vec4(0., 0., 0., a * 0.36 * uAlpha); return; }

  float t = uTime + uSeed * 10.;
  if (!burning) {
    if (uEdition == 1) {            // FOIL – blau-silberner Schimmer mit wandernden Lichtbändern
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 base = mix(c, vec3(l) * vec3(0.72, 0.86, 1.18), 0.6);
      vec2 q = puv - 0.5 + uTilt * 0.7;
      float bands = sin((q.x * 1.4 - q.y) * 16. + t * 1.4);
      float rings = sin(length(q * vec2(1., 1.35)) * 38. - t * 2.1);
      float f = pow(clamp(0.5 + 0.7 * bands * rings, 0., 1.), 3.);
      c = base + vec3(0.42, 0.66, 1.) * f * 0.6 + vec3(0.02, 0.05, 0.12);
    } else if (uEdition == 2) {     // HOLOGRAPHIC – Regenbogen-Gitter
      vec2 q = puv + uTilt * 0.55;
      vec2 g = abs(fract(q * vec2(8., 11.) + vec2(0., t * 0.12)) - 0.5);
      float grid = smoothstep(0.36, 0.5, max(g.x, g.y));
      float h = fract(q.x * 0.9 + q.y * 0.7 + t * 0.07);
      vec3 rb = hsv2rgb(vec3(h, 0.6, 1.));
      float sweep = 0.5 + 0.5 * sin((q.x + q.y) * 7. - t * 1.3);
      c = mix(c, c * 0.6 + rb * 0.5, 0.3 + 0.2 * sweep) + rb * grid * 0.28;
    } else if (uEdition == 3) {     // POLYCHROME – fließende Farbtonverschiebung
      vec3 hsv = rgb2hsv(c);
      vec2 q = puv - 0.5 + uTilt * 0.45;
      float sh = 0.45 * sin(q.x * 4. + t * 0.7) + 0.45 * cos(q.y * 5. - t * 0.5) + length(q) * 1.4 + t * 0.05;
      hsv.x = fract(hsv.x + sh);
      hsv.y = clamp(max(hsv.y, 0.45) * 1.15, 0., 1.);
      c = mix(c, hsv2rgb(hsv), 0.85);
    } else if (uEdition == 4) {     // NEGATIVE – invertiert, kühl-violett
      c = (1. - c) * vec3(0.82, 0.8, 1.) + vec3(0.04, 0.02, 0.1);
      float s = sin((puv.x - puv.y) * 10. + t * 1.2 + uTilt.x * 4.);
      c += vec3(0.25, 0.2, 0.45) * pow(max(s, 0.), 6.) * 0.4;
    }
    // Hover-Glanzstreifen
    float sl = (puv.x - puv.y * 0.6) - (0.15 + uTilt.x * 1.1 - uTilt.y * 0.6);
    c += smoothstep(0.06, 0., abs(sl)) * 0.14 * uHover;
    c = mix(c, uTint.rgb, uTint.a);
    c = mix(c, vec3(1.), uFlash);
  }
  float alpha = a * uAlpha;
  o = vec4(c * alpha, alpha);
}`;

  const VS_PARTICLE = `#version 300 es
layout(location=0) in vec2 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in vec4 aCol;
layout(location=3) in float aShape;
uniform vec4 uView;
out vec2 vUv; out vec4 vCol; out float vShape;
void main(){ vUv = aUv; vCol = aCol; vShape = aShape; gl_Position = vec4(aPos * uView.xy + uView.zw, 0., 1.); }`;

  const FS_PARTICLE = `#version 300 es
precision highp float;
in vec2 vUv; in vec4 vCol; in float vShape;
out vec4 o;
void main(){
  vec2 d = vUv - 0.5;
  if (vShape > 0.5 && vShape < 1.5 && length(d) > 0.5) discard;          // Kreis
  if (vShape > 1.5 && vShape < 2.5 && abs(d.x) + abs(d.y) > 0.5) discard; // Raute
  if (vShape > 2.5) {                                                     // 4-zackiger Stern
    vec2 a = abs(d);
    if (a.x * a.y * 28. + max(a.x, a.y) * 0.9 > 0.45) discard;
  }
  o = vec4(vCol.rgb * vCol.a, vCol.a);
}`;

  const FS_FLAME = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec2 uPix;
uniform float uTime, uIntensity, uSeed;
uniform vec3 uCol1, uCol2;
out vec4 o;
${GLSL_NOISE}
void main(){
  vec2 uv = (floor(vUv * uPix) + 0.5) / uPix;
  float y = 1. - uv.y;
  float x = uv.x * 2. - 1.;
  float tt = uTime * (1.4 + uIntensity * 0.6) + uSeed * 20.;
  float n = fbm(vec2(uv.x * 4.5, y * 2.2 - tt * 1.6));
  n += 0.55 * fbm(vec2(uv.x * 10. + 3., y * 4.5 - tt * 2.7));
  float width = 1. - pow(abs(x), 2.6);
  float h = clamp(uIntensity, 0., 2.);
  float f = n * width * 1.15 - y * (1.5 / max(h, 0.05));
  if (f < 0.12) discard;
  vec3 c = mix(uCol2, uCol1, smoothstep(0.12, 0.45, f));
  c = mix(c, vec3(1., 0.97, 0.86), smoothstep(0.6, 0.95, f));
  o = vec4(c, 1.);
}`;

  const FS_LAYER = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main(){ o = texture(uTex, vec2(vUv.x, 1. - vUv.y)); }`;

  // CRT: Wölbung, chromatische Aberration, Bloom (über Mipmaps), Scanlines, Rauschen, Vignette.
  const FS_CRT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime, uDpr;
uniform float uAmount, uCurve, uScan, uBloom, uChroma, uNoise, uVignette;
out vec4 o;
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vUv * 2. - 1.;
  float k = uCurve * uAmount;
  p *= 1. + k * 0.075 * dot(p, p) - k * 0.03;
  vec2 uv = p * 0.5 + 0.5;
  vec2 edge = smoothstep(vec2(0.), vec2(0.004 + k * 0.006), uv) * smoothstep(vec2(0.), vec2(0.004 + k * 0.006), 1. - uv);
  float inside = edge.x * edge.y;

  vec2 ca = (uv - 0.5) * uChroma * uAmount * 0.006 + vec2(uChroma * uAmount * 0.6 / uRes.x, 0.);
  vec3 col;
  col.r = textureLod(uScene, uv + ca, 0.).r;
  col.g = textureLod(uScene, uv, 0.).g;
  col.b = textureLod(uScene, uv - ca, 0.).b;

  vec3 b1 = textureLod(uScene, uv, 2.5).rgb;
  vec3 b2 = textureLod(uScene, uv, 4.5).rgb;
  vec3 bloom = b1 * 0.55 + b2 * 0.45;
  col += max(bloom - 0.28, 0.) * uBloom * uAmount * 1.1;

  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float period = max(3., uDpr * 2.5);
  float line = 0.5 + 0.5 * cos(gl_FragCoord.y / period * 6.2831853);
  col *= 1. - uScan * uAmount * 0.32 * line * (1. - 0.55 * clamp(lum, 0., 1.));

  col += (h12(floor(gl_FragCoord.xy / max(1., uDpr)) + fract(uTime * 7.31) * 91.7) - 0.5) * uNoise * uAmount * 0.075;

  float v = smoothstep(1.55, 0.45, length(p * vec2(0.92, 1.)));
  col *= mix(1., v, uVignette * uAmount);
  col *= 1. + 0.06 * uAmount;
  o = vec4(col * inside, 1.);
}`;

  // ════════════════════════════════════════════════════════════════════════
  //  GL-Helfer
  // ════════════════════════════════════════════════════════════════════════

  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      throw new Error('BalatroFX Shader-Fehler:\n' + log + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
    }
    return s;
  }
  function createProgram(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('BalatroFX Link-Fehler: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  const EDITIONS = { none: 0, base: 0, foil: 1, holo: 2, holographic: 2, polychrome: 3, negative: 4 };

  /** Hintergrund-Stile (gleiche Farben/Parameter, andere Bewegung). 0 = Original-Swirl. */
  const BG_STYLES = [
    { id: 'swirl', name: 'Swirl (Original)' }, { id: 'lava', name: 'Lava' }, { id: 'tide', name: 'Tide' },
    { id: 'pips', name: 'Pips' }, { id: 'kaleido', name: 'Kaleido' },
  ];

  const BG_PRESETS = {
    menu: { c1: '#DE443B', c2: '#006BB4', c3: '#162325', contrast: 3.5, lighting: 0.4, spinAmount: 0.25 },
  };

  /** Wie Balatros ease_background_colour: eine Grundfarbe -> drei Swirl-Farben. */
  function bgFromColour(hex, opts = {}) {
    const special = opts.special;
    return {
      c1: special ? hexToRgb(special) : hexToRgb(scaleHex(hex, 0.9)),
      c2: hexToRgb(scaleHex(hex, 1.3)),
      c3: hexToRgb(scaleHex(hex, special ? 0.4 : 0.7)),
      contrast: opts.contrast !== undefined ? opts.contrast : 1.0,
      lighting: opts.lighting !== undefined ? opts.lighting : 0.28,
    };
  }
  BG_PRESETS.blind = bgFromColour(PALETTE.BLIND, { contrast: 1 });
  BG_PRESETS.boss = bgFromColour(PALETTE.BOSS, { contrast: 2 });
  BG_PRESETS.bossViolet = bgFromColour('#8A71E1', { contrast: 2 });
  BG_PRESETS.shop = bgFromColour('#2B6E8F', { special: '#4BC292', contrast: 1.6 });
  BG_PRESETS.won = bgFromColour(PALETTE.WON, { contrast: 1 });
  BG_PRESETS.gold = bgFromColour('#C08A2E', { special: '#FE5F55', contrast: 2.5 });

  function normaliseBg(src) {
    const o = {};
    for (const k of ['c1', 'c2', 'c3']) if (src[k] !== undefined) o[k] = hexToRgb(src[k]);
    for (const k of ['contrast', 'lighting', 'spinAmount', 'pixelFilter', 'spinSpeed', 'rotation']) if (src[k] !== undefined) o[k] = src[k];
    return o;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Sprite (Karte, Würfel, Joker …)
  // ════════════════════════════════════════════════════════════════════════

  class Sprite {
    constructor(engine, opts = {}) {
      this.engine = engine;
      this.tex = opts.tex || null;
      this.w = opts.w || (this.tex ? this.tex.w : 64);
      this.h = opts.h || (this.tex ? this.tex.h : 64);
      this.x = opts.x || 0; this.y = opts.y || 0;
      this.r = opts.r || 0; this.s = opts.s !== undefined ? opts.s : 1;
      this.T = { x: this.x, y: this.y, r: this.r, s: this.s };
      this.vx = 0; this.vy = 0;
      this.z = opts.z || 0;
      this.edition = opts.edition || 'none';
      this.interactive = opts.interactive !== undefined ? opts.interactive : true;
      this.shadow = opts.shadow !== undefined ? opts.shadow : true;
      this.ambient = opts.ambient !== undefined ? opts.ambient : 1;
      this.tiltStrength = opts.tiltStrength !== undefined ? opts.tiltStrength : 1;
      this.stiffness = opts.stiffness || 230;
      this.damping = opts.damping || 21;
      this.alpha = 1; this.flash = 0;
      this.tint = null;
      this.dissolve = 0; this.burn1 = hexToRgb('#FFE8A0'); this.burn2 = hexToRgb(PALETTE.RED);
      this.hover = false; this.hoverAmt = 0;
      this.dragging = false;
      this.tilt = { x: 0, y: 0 };
      this.juice = new Juice();
      this.seed = Math.random();
      this.visible = true;
      this.data = opts.data || {};
      this._dead = false;
    }
    moveTo(x, y, r, s) { this.T.x = x; this.T.y = y; if (r !== undefined) this.T.r = r; if (s !== undefined) this.T.s = s; return this; }
    snap() { this.x = this.T.x; this.y = this.T.y; this.r = this.T.r; this.s = this.T.s; this.vx = this.vy = 0; return this; }
    juiceUp(scale = 0.4, rot) { this.juice.up(scale, rot); return this; }
    flashWhite(amount = 0.8) { this.flash = amount; return this; }
    remove() { this._dead = true; }

    /** Karte verbrennt (Balatro "dissolve"). */
    dissolveOut(duration = 0.9, opts = {}) {
      if (opts.colours) { this.burn1 = hexToRgb(opts.colours[0]); this.burn2 = hexToRgb(opts.colours[1]); }
      this.interactive = false;
      this._dissolveDir = 1; this._dissolveDur = duration; this._onDissolved = opts.onDone;
      this.juiceUp(0.15);
      return this;
    }
    /** Karte materialisiert sich (umgekehrter Dissolve, standardmäßig weiß/blau). */
    materialize(duration = 0.7, opts = {}) {
      const cols = opts.colours || [PALETTE.WHITE, PALETTE.BLUE];
      this.burn1 = hexToRgb(cols[0]); this.burn2 = hexToRgb(cols[1]);
      this.dissolve = 1; this._dissolveDir = -1; this._dissolveDur = duration; this._onDissolved = opts.onDone;
      return this;
    }

    contains(px, py) {
      const sc = this.s * (1 + this.juice.s);
      const c = Math.cos(-this.vr || 0), s = Math.sin(-this.vr || 0);
      const dx = px - this.x, dy = py - this.y;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      return Math.abs(lx) <= (this.w * sc) / 2 && Math.abs(ly) <= (this.h * sc) / 2;
    }

    update(dt, t) {
      // Federbewegung (leichtes Überschwingen wie in Balatro)
      const k = this.stiffness, d = this.damping;
      this.vx += ((this.T.x - this.x) * k - this.vx * d) * dt;
      this.vy += ((this.T.y - this.y) * k - this.vy * d) * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.r = damp(this.r, this.T.r, 14, dt);
      this.s = damp(this.s, this.T.s, 12, dt);
      this.juice.update(t);
      this.hoverAmt = damp(this.hoverAmt, this.hover || this.dragging ? 1 : 0, 14, dt);
      this.flash = damp(this.flash, 0, 9, dt);

      // Tilt: zur Maus hin, sonst sanftes Schaukeln + Bewegungsneigung
      const m = this.engine.mouse;
      let tx, ty;
      if (this.hover || this.dragging) {
        tx = clamp((m.x - this.x) / (this.w * 0.5), -1.2, 1.2) * 0.42;
        ty = clamp((m.y - this.y) / (this.h * 0.5), -1.2, 1.2) * 0.42;
      } else {
        tx = Math.sin(t * 0.9 + this.seed * 6.28) * 0.09 * this.ambient;
        ty = Math.cos(t * 0.73 + this.seed * 9.1) * 0.07 * this.ambient;
      }
      tx += clamp(this.vx * 0.0009, -0.4, 0.4);
      ty += clamp(-this.vy * 0.0006, -0.3, 0.3);
      this.tilt.x = damp(this.tilt.x, tx * this.tiltStrength, 10, dt);
      this.tilt.y = damp(this.tilt.y, ty * this.tiltStrength, 10, dt);

      this.vr = this.r + this.juice.r
        + clamp(this.vx * 0.00035, -0.3, 0.3)
        + Math.sin(t * 1.3 + this.seed * 12) * 0.012 * this.ambient * (1 - this.hoverAmt);
      this.vs = this.s * (1 + this.juice.s) * (1 + 0.05 * this.hoverAmt);
      this.bob = Math.sin(t * 1.1 + this.seed * 20) * 1.2 * this.ambient * (1 - this.hoverAmt);

      if (this._dissolveDir) {
        this.dissolve = clamp(this.dissolve + (this._dissolveDir * dt) / this._dissolveDur, 0, 1);
        if (this._dissolveDir > 0 && this.dissolve > 0.05 && this.dissolve < 0.9 && Math.random() < dt * 40) {
          this.engine.emit(this.x + rand(-0.45, 0.45) * this.w * this.s, this.y + rand(-0.45, 0.45) * this.h * this.s, {
            count: 1, colours: [rgbToHex(this.burn1), rgbToHex(this.burn2)], speed: 40, size: rand(3, 6), life: 0.5, gravity: -90, spread: Math.PI * 2,
          });
        }
        if ((this._dissolveDir > 0 && this.dissolve >= 1) || (this._dissolveDir < 0 && this.dissolve <= 0)) {
          const cb = this._onDissolved; const dir = this._dissolveDir;
          this._dissolveDir = 0; this._onDissolved = null;
          if (dir > 0) this._dead = true;
          if (cb) cb(this);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Engine
  // ════════════════════════════════════════════════════════════════════════

  class Engine {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} opts { width, height (virtuelle Auflösung), maxDpr, crt:{…}, background:'menu'|{…} }
     */
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.W = opts.width || 1280; this.H = opts.height || 720;
      this.maxDpr = opts.maxDpr || 2;
      const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: true });
      if (!gl) throw new Error('BalatroFX benötigt WebGL2.');
      this.gl = gl;
      this.time = 0;
      this.timeScale = 1;

      const start = normaliseBg(Object.assign({ pixelFilter: 745, spinSpeed: 7, rotation: 0, lighting: 0.4, spinAmount: 0.25 },
        typeof opts.background === 'string' ? BG_PRESETS[opts.background] : opts.background || BG_PRESETS.menu));
      this.bg = JSON.parse(JSON.stringify(start));
      this.bgTarget = JSON.parse(JSON.stringify(start));
      this.bgRate = 2.2;
      this.bgFlow = Math.random() * 100; this.bgSpin = 0; this.spinPulse = 0; this.flowBoost = 0;

      this.crt = Object.assign({ enabled: true, amount: 0.75, curvature: 0.6, scanlines: 0.55, bloom: 0.55, chroma: 0.55, noise: 0.35, vignette: 0.6 }, opts.crt);

      this.sprites = []; this.particles = []; this.popups = []; this.flames = new Map();
      this.timers = []; this.events = []; this.tweens = [];
      this.shakeAmt = 0; this.shakeOff = { x: 0, y: 0 };
      this.mouse = { x: -9999, y: -9999, down: false };
      this.hovered = null;
      this._listeners = {};

      this.back = document.createElement('canvas').getContext('2d');
      this.front = document.createElement('canvas').getContext('2d');

      this._initGL();
      this._bindInput();
      this.resize();
      if (global.ResizeObserver) { this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(canvas); }
      else global.addEventListener('resize', () => this.resize());
    }

    // ── Setup ────────────────────────────────────────────────────────────
    _initGL() {
      const gl = this.gl;
      this.prog = {
        bg: createProgram(gl, VS_FULLSCREEN, FS_BACKGROUND),
        sprite: createProgram(gl, VS_SPRITE, FS_SPRITE),
        flame: createProgram(gl, VS_SPRITE, FS_FLAME),
        particle: createProgram(gl, VS_PARTICLE, FS_PARTICLE),
        layer: createProgram(gl, VS_FULLSCREEN, FS_LAYER),
        crt: createProgram(gl, VS_FULLSCREEN, FS_CRT),
      };
      this.vaoEmpty = gl.createVertexArray();

      this.vaoQuad = gl.createVertexArray();
      gl.bindVertexArray(this.vaoQuad);
      const qb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      this.MAX_PARTICLES = 3000;
      this.pData = new Float32Array(this.MAX_PARTICLES * 6 * 9);
      this.vaoParticles = gl.createVertexArray();
      gl.bindVertexArray(this.vaoParticles);
      this.pBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.pData.byteLength, gl.DYNAMIC_DRAW);
      const st = 9 * 4;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, st, 8);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, st, 16);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 32);
      gl.bindVertexArray(null);

      this.texBack = this._makeTex(gl.NEAREST);
      this.texFront = this._makeTex(gl.NEAREST);
      this.fbo = gl.createFramebuffer();
      this.sceneTex = null;
    }

    _makeTex(filter) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    /** Erzeugt eine (Pixel-Art-)Textur aus Canvas/Bild. */
    texture(source, opts = {}) {
      const gl = this.gl, t = this._makeTex(opts.smooth ? gl.LINEAR : gl.NEAREST);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      return { tex: t, w: source.width, h: source.height, source };
    }
    updateTexture(texObj, source) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, texObj.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source || texObj.source);
    }

    resize() {
      const dpr = Math.min(global.devicePixelRatio || 1, this.maxDpr);
      const cw = this.canvas.clientWidth || global.innerWidth, ch = this.canvas.clientHeight || global.innerHeight;
      const bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round(ch * dpr));
      this.dpr = dpr; this.cssW = cw; this.cssH = ch;
      this.scale = Math.min(cw / this.W, ch / this.H);
      this.ox = (cw - this.W * this.scale) / 2; this.oy = (ch - this.H * this.scale) / 2;
      this.view = { left: -this.ox / this.scale, top: -this.oy / this.scale, right: (cw - this.ox) / this.scale, bottom: (ch - this.oy) / this.scale };
      if (this.canvas.width === bw && this.canvas.height === bh && this.sceneTex) return;
      this.canvas.width = bw; this.canvas.height = bh;
      for (const ctx of [this.back, this.front]) { ctx.canvas.width = bw; ctx.canvas.height = bh; }

      const gl = this.gl;
      if (this.sceneTex) gl.deleteTexture(this.sceneTex);
      this.sceneTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      const levels = Math.floor(Math.log2(Math.max(bw, bh))) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, bw, bh);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    _bindInput() {
      const c = this.canvas;
      const pos = (e) => { const p = this.toVirtual(e.clientX, e.clientY); this.mouse.x = p.x; this.mouse.y = p.y; };
      c.addEventListener('pointermove', (e) => { pos(e); this._fire('move', this.mouse); });
      c.addEventListener('pointerdown', (e) => { pos(e); this.mouse.down = true; c.setPointerCapture && c.setPointerCapture(e.pointerId); this._fire('down', this.mouse); });
      c.addEventListener('pointerup', (e) => { pos(e); this.mouse.down = false; this._fire('up', this.mouse); });
      c.addEventListener('pointerleave', () => { if (!this.mouse.down) { this.mouse.x = -9999; this.mouse.y = -9999; } });
      c.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    on(name, fn) { (this._listeners[name] = this._listeners[name] || []).push(fn); return this; }
    _fire(name, arg) { (this._listeners[name] || []).forEach((f) => f(arg)); }

    /** Bildschirm- (client) -> virtuelle Koordinaten. */
    toVirtual(cx, cy) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (cx - r.left - this.ox) / this.scale, y: (cy - r.top - this.oy) / this.scale };
    }

    // ── API: Objekte & Effekte ────────────────────────────────────────────
    sprite(opts) { const s = new Sprite(this, opts); this.sprites.push(s); return s; }

    /**
     * Partikel-Burst. Balatro-typisch: kleine Quadrate, die sich drehen und kleiner werden.
     * opts: count, colours[], speed, size, life, spread, angle, gravity, drag, shape('square'|'circle'|'diamond'|'star'), spin
     */
    emit(x, y, opts = {}) {
      const shapes = { square: 0, circle: 1, diamond: 2, star: 3 };
      const n = opts.count !== undefined ? opts.count : 14;
      const cols = (opts.colours || [PALETTE.WHITE]).map(hexToRgb);
      const spread = opts.spread !== undefined ? opts.spread : Math.PI * 2;
      const ang = opts.angle !== undefined ? opts.angle : -Math.PI / 2;
      for (let i = 0; i < n && this.particles.length < this.MAX_PARTICLES; i++) {
        const a = ang + (Math.random() - 0.5) * spread;
        const sp = (opts.speed !== undefined ? opts.speed : 220) * rand(0.35, 1);
        const life = (opts.life || 0.7) * rand(0.6, 1.2);
        this.particles.push({
          x: x + rand(-1, 1) * (opts.jitter || 0), y: y + rand(-1, 1) * (opts.jitter || 0),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          size: (opts.size || 9) * rand(0.6, 1.3), r: rand(0, Math.PI), vr: (opts.spin !== undefined ? opts.spin : 6) * rand(-1, 1),
          col: pick(cols), t: 0, life, gravity: opts.gravity || 0, drag: opts.drag !== undefined ? opts.drag : 3.2,
          shape: shapes[opts.shape || 'square'] || 0, fadeIn: opts.fadeIn || 0,
        });
      }
    }

    /**
     * Pop-up-Text in einer Sprechblase (z. B. "+10" blau für Chips, "+4 Mult" rot, "X2" rot, "$3" gold).
     */
    popup(x, y, text, opts = {}) {
      this.popups.push({
        x, y, text: String(text), t: 0, life: opts.life || 1.0, size: opts.size || 26,
        colour: opts.colour || PALETTE.RED, textColour: opts.textColour || PALETTE.WHITE,
        bubble: opts.bubble !== undefined ? opts.bubble : true, rot: opts.rot !== undefined ? opts.rot : rand(-0.12, 0.12), rise: opts.rise || 10,
      });
    }

    /** Flammen (wie hinter Chips × Mult, wenn der Score explodiert). */
    setFlame(id, opts) {
      const f = this.flames.get(id) || { intensity: 0, cur: 0, seed: Math.random() };
      Object.assign(f, opts);
      if (opts.colours) { f.c1 = hexToRgb(opts.colours[0]); f.c2 = hexToRgb(opts.colours[1]); }
      this.flames.set(id, f);
      return f;
    }

    shake(amount = 6) { this.shakeAmt = Math.max(this.shakeAmt, amount); }

    /** Hintergrund setzen: Preset-Name oder {c1,c2,c3,contrast,…}. Wird weich übergeblendet. */
    setBackground(p, opts = {}) {
      const src = typeof p === 'string' ? BG_PRESETS[p] : p;
      Object.assign(this.bgTarget, normaliseBg(src));
      if (opts.instant) Object.assign(this.bg, JSON.parse(JSON.stringify(this.bgTarget)));
      if (opts.spin !== false) this.spinPulse += opts.spin || 1.6;
    }
    /** Hintergrund aus einer einzigen Farbe ableiten (wie Balatro bei Blinds). */
    setBackgroundColour(hex, opts = {}) {
      const b = bgFromColour(hex, opts);
      this.setBackground({ c1: rgbToHex(b.c1), c2: rgbToHex(b.c2), c3: rgbToHex(b.c3), contrast: b.contrast, lighting: b.lighting }, opts);
    }
    /** Hintergrund-Stil wählen (id aus BG_STYLES oder Index). */
    setBackgroundStyle(style) {
      const i = typeof style === 'number' ? style : BG_STYLES.findIndex((x) => x.id === style);
      this.bgStyle = Math.max(0, i);
      this.spinPulse += 0.8;
    }
    /** Kurzer Energie-Schub im Hintergrund (schneller fließen/drehen). */
    pulseBackground(spin = 0.8, flow = 4) { this.spinPulse += spin; this.flowBoost += flow; }

    after(delay, fn) { this.timers.push({ t: delay, fn }); }
    /** Sequenzielle Event-Queue (wie Balatros Event-Manager): jedes Event wartet `delay` Sekunden nach dem vorigen. */
    queue(fn, delay = 0) { this.events.push({ fn, delay, t: 0 }); }
    get busy() { return this.events.length > 0; }
    tween(obj, props, dur, ease = Ease.outCubic, onDone) {
      const from = {};
      for (const k in props) from[k] = obj[k];
      this.tweens.push({ obj, from, to: props, dur, t: 0, ease, onDone });
    }

    // ── Update ───────────────────────────────────────────────────────────
    update(rawDt) {
      const dt = Math.min(rawDt, 1 / 20) * this.timeScale;
      this.time += dt;
      const t = this.time;

      // Hintergrund
      const b = this.bg, bt = this.bgTarget, r = this.bgRate;
      for (const k of ['c1', 'c2', 'c3']) for (let i = 0; i < 3; i++) b[k][i] = damp(b[k][i], bt[k][i], r, dt);
      for (const k of ['contrast', 'lighting', 'spinAmount', 'pixelFilter', 'spinSpeed', 'rotation']) b[k] = damp(b[k], bt[k], r, dt);
      this.spinPulse = damp(this.spinPulse, 0, 1.8, dt);
      this.flowBoost = damp(this.flowBoost, 0, 1.5, dt);
      this.bgFlow += dt * (b.spinSpeed + this.flowBoost);
      this.bgSpin += dt * (b.rotation * 0.2 + this.spinPulse * 0.35);

      // Timer, Events, Tweens
      for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= dt; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
      if (this.events.length) {
        const ev = this.events[0]; ev.t += dt;
        if (ev.t >= ev.delay) { this.events.shift(); ev.fn(); }
      }
      for (let i = this.tweens.length - 1; i >= 0; i--) {
        const tw = this.tweens[i]; tw.t += dt;
        const k = tw.ease(Math.min(1, tw.t / tw.dur));
        for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * k;
        if (tw.t >= tw.dur) { this.tweens.splice(i, 1); tw.onDone && tw.onDone(); }
      }

      // Hover (oberstes interaktives Sprite)
      let hov = null;
      const sorted = this.sprites.slice().sort((a, c) => c.z - a.z);
      for (const s of sorted) if (s.visible && s.interactive && !s._dead && s.contains(this.mouse.x, this.mouse.y)) { hov = s; break; }
      if (hov !== this.hovered) {
        if (this.hovered) this.hovered.hover = false;
        if (hov) { hov.hover = true; hov.juiceUp(0.05, 0.03); this._fire('hover', hov); }
        this.hovered = hov;
      }

      for (const s of this.sprites) s.update(dt, t);
      this.sprites = this.sprites.filter((s) => !s._dead);

      // Partikel
      for (const p of this.particles) {
        p.t += dt;
        p.vx *= Math.exp(-p.drag * dt); p.vy *= Math.exp(-p.drag * dt);
        p.vy += p.gravity * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      }
      this.particles = this.particles.filter((p) => p.t < p.life);

      for (const p of this.popups) p.t += dt;
      this.popups = this.popups.filter((p) => p.t < p.life);

      for (const f of this.flames.values()) f.cur = damp(f.cur, f.intensity, 4, dt);

      // Screen-Shake
      this.shakeAmt = damp(this.shakeAmt, 0, 7, dt);
      this.shakeOff.x = (Math.random() * 2 - 1) * this.shakeAmt;
      this.shakeOff.y = (Math.random() * 2 - 1) * this.shakeAmt;
    }

    /** Bereitet die beiden 2D-Ebenen (hinter/vor den Sprites) für das Zeichnen vor. */
    beginLayers() {
      const k = this.scale * this.dpr;
      for (const ctx of [this.back, this.front]) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(k, 0, 0, k, (this.ox + this.shakeOff.x * this.scale) * this.dpr, (this.oy + this.shakeOff.y * this.scale) * this.dpr);
        ctx.imageSmoothingEnabled = false;
      }
    }

    _drawPopups(ctx) {
      for (const p of this.popups) {
        const age = p.t / p.life;
        let sc = p.t < 0.2 ? Ease.outBack(p.t / 0.2) : 1;
        if (age > 0.78) sc *= 1 - Ease.inCubic((age - 0.78) / 0.22);
        const wob = Math.sin(p.t * 40.8) * 0.18 * Math.pow(Math.max(0, 1 - p.t / 0.45), 2);
        ctx.save();
        ctx.translate(p.x, p.y - p.t * p.rise);
        ctx.rotate(p.rot + wob);
        ctx.scale(sc, sc);
        ctx.font = UI.font(p.size);
        const tw = ctx.measureText(p.text).width;
        if (p.bubble) {
          const w = tw + p.size * 0.8, h = p.size * 1.3;
          UI.box(ctx, -w / 2, -h / 2, w, h, { colour: p.colour, radius: h * 0.3, emboss: 3, shadow: true });
        }
        UI.text(ctx, p.text, 0, 0, { size: p.size, colour: p.bubble ? p.textColour : p.colour, align: 'center' });
        ctx.restore();
      }
    }

    // ── Render ───────────────────────────────────────────────────────────
    _viewUniform(shake = true) {
      const s = this.scale, sx = shake ? this.shakeOff.x * s : 0, sy = shake ? this.shakeOff.y * s : 0;
      return [2 * s / this.cssW, -2 * s / this.cssH, (2 * (this.ox + sx)) / this.cssW - 1, 1 - (2 * (this.oy + sy)) / this.cssH];
    }

    _drawLayer(ctx, tex) {
      const gl = this.gl, P = this.prog.layer;
      gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
      gl.uniform1i(P.u.uTex, 0);
      gl.bindVertexArray(this.vaoEmpty);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    _drawSprite(P, s, shadow) {
      const gl = this.gl;
      let x = s.x, y = s.y + (s.bob || 0);
      let sc = s.vs || s.s;
      if (shadow) {
        const lift = 6 + 10 * s.hoverAmt + (s.dragging ? 14 : 0);
        x += (s.x - this.W / 2) * 0.03; y += lift; sc *= 0.98;
      }
      gl.uniform2f(P.u.uCenter, x, y);
      gl.uniform2f(P.u.uSize, s.w, s.h);
      gl.uniform2f(P.u.uTilt, s.tilt.x, s.tilt.y);
      gl.uniform1f(P.u.uRot, s.vr !== undefined ? s.vr : s.r);
      gl.uniform1f(P.u.uScale, sc);
      gl.uniform1f(P.u.uShadow, shadow ? 1 : 0);
      gl.uniform2f(P.u.uTexSize, s.tex.w, s.tex.h);
      gl.uniform1f(P.u.uSeed, s.seed);
      gl.uniform1f(P.u.uDissolve, s.dissolve);
      gl.uniform1f(P.u.uHover, s.hoverAmt);
      gl.uniform1f(P.u.uAlpha, s.alpha);
      gl.uniform1f(P.u.uFlash, s.flash);
      gl.uniform1i(P.u.uEdition, EDITIONS[s.edition] || 0);
      gl.uniform3fv(P.u.uBurn1, s.burn1);
      gl.uniform3fv(P.u.uBurn2, s.burn2);
      if (s.tint) { const c = hexToRgb(s.tint[0]); gl.uniform4f(P.u.uTint, c[0], c[1], c[2], s.tint[1]); }
      else gl.uniform4f(P.u.uTint, 0, 0, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, s.tex.tex);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    render() {
      const gl = this.gl, W = this.canvas.width, H = this.canvas.height;
      this._drawPopups(this.front);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // 1) Hintergrund
      const B = this.prog.bg, b = this.bg;
      gl.useProgram(B.p);
      gl.bindVertexArray(this.vaoEmpty);
      gl.uniform2f(B.u.uRes, W, H);
      gl.uniform1f(B.u.uFlow, this.bgFlow);
      gl.uniform1f(B.u.uSpin, this.bgSpin);
      gl.uniform1f(B.u.uSpinEase, 1.0);
      gl.uniform3fv(B.u.uC1, b.c1); gl.uniform3fv(B.u.uC2, b.c2); gl.uniform3fv(B.u.uC3, b.c3);
      gl.uniform1f(B.u.uContrast, b.contrast);
      gl.uniform1f(B.u.uLighting, b.lighting);
      gl.uniform1f(B.u.uSpinAmount, b.spinAmount);
      gl.uniform1f(B.u.uPixel, b.pixelFilter);
      gl.uniform2f(B.u.uOffset, 0, 0);
      gl.uniform1i(B.u.uStyle, this.bgStyle || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const view = this._viewUniform();

      // 2) UI hinten
      this._drawLayer(this.back, this.texBack);

      // 3) Flammen (über der hinteren UI, unter den Sprites)
      if (this.flames.size) {
        const F = this.prog.flame;
        gl.useProgram(F.p);
        gl.bindVertexArray(this.vaoQuad);
        gl.uniform4fv(F.u.uView, view);
        gl.uniform1f(F.u.uTime, this.time);
        for (const f of this.flames.values()) {
          if (f.cur < 0.02) continue;
          gl.uniform2f(F.u.uCenter, f.x + f.w / 2, f.y - f.h / 2);
          gl.uniform2f(F.u.uSize, f.w, f.h);
          gl.uniform2f(F.u.uTilt, 0, 0);
          gl.uniform1f(F.u.uRot, 0); gl.uniform1f(F.u.uScale, 1);
          gl.uniform2f(F.u.uPix, f.w / (f.pixel || 3), f.h / (f.pixel || 3));
          gl.uniform1f(F.u.uIntensity, f.cur);
          gl.uniform1f(F.u.uSeed, f.seed);
          gl.uniform3fv(F.u.uCol1, f.c1 || hexToRgb(PALETTE.ORANGE));
          gl.uniform3fv(F.u.uCol2, f.c2 || hexToRgb(PALETTE.RED));
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      // 4) Sprites: erst alle Schatten, dann die Sprites
      const list = this.sprites.filter((s) => s.visible && s.tex).sort((a, c) => a.z - c.z);
      const S = this.prog.sprite;
      gl.useProgram(S.p);
      gl.bindVertexArray(this.vaoQuad);
      gl.uniform4fv(S.u.uView, view);
      gl.uniform1f(S.u.uTime, this.time);
      gl.uniform1i(S.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      for (const s of list) if (s.shadow) this._drawSprite(S, s, true);
      for (const s of list) this._drawSprite(S, s, false);

      // 5) Partikel
      if (this.particles.length) {
        const d = this.pData; let o = 0;
        for (const p of this.particles) {
          const k = p.t / p.life;
          const sz = p.size * (1 - k * k) * (p.fadeIn ? Math.min(1, p.t / p.fadeIn) : 1) * 0.5;
          const c = Math.cos(p.r) * sz, s = Math.sin(p.r) * sz;
          const corners = [[-c + s, -s - c, 0, 0], [c + s, s - c, 1, 0], [-c - s, -s + c, 0, 1], [c - s, s + c, 1, 1]];
          for (const idx of [0, 1, 2, 2, 1, 3]) {
            const q = corners[idx];
            d[o++] = p.x + q[0]; d[o++] = p.y + q[1]; d[o++] = q[2]; d[o++] = q[3];
            d[o++] = p.col[0]; d[o++] = p.col[1]; d[o++] = p.col[2]; d[o++] = 1; d[o++] = p.shape;
          }
        }
        const P = this.prog.particle;
        gl.useProgram(P.p);
        gl.uniform4fv(P.u.uView, view);
        gl.bindVertexArray(this.vaoParticles);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, o);
        gl.drawArrays(gl.TRIANGLES, 0, o / 9);
      }

      // 6) UI vorne (inkl. Pop-ups)
      this._drawLayer(this.front, this.texFront);

      // 7) CRT-Pass auf den Bildschirm
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.BLEND);
      const C = this.prog.crt, cr = this.crt, on = cr.enabled ? 1 : 0;
      gl.useProgram(C.p);
      gl.bindVertexArray(this.vaoEmpty);
      gl.uniform1i(C.u.uScene, 0);
      gl.uniform2f(C.u.uRes, W, H);
      gl.uniform1f(C.u.uTime, this.time);
      gl.uniform1f(C.u.uDpr, this.dpr);
      gl.uniform1f(C.u.uAmount, cr.amount * on);
      gl.uniform1f(C.u.uCurve, cr.curvature);
      gl.uniform1f(C.u.uScan, cr.scanlines);
      gl.uniform1f(C.u.uBloom, cr.bloom);
      gl.uniform1f(C.u.uChroma, cr.chroma);
      gl.uniform1f(C.u.uNoise, cr.noise);
      gl.uniform1f(C.u.uVignette, cr.vignette);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /** Startet die Spielschleife. update(dt) für Logik, draw(back, front, t) für 2D-UI. */
    start(update, draw) {
      let last = performance.now();
      const frame = (now) => {
        const dt = (now - last) / 1000; last = now;
        if (update) update(Math.min(dt, 0.05));
        this.update(dt);
        this.beginLayers();
        if (draw) draw(this.back, this.front, this.time);
        this.render();
        this._raf = requestAnimationFrame(frame);
      };
      this._raf = requestAnimationFrame(frame);
    }
    stop() { cancelAnimationFrame(this._raf); }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  UI-Helfer (Canvas 2D) – Boxen, Buttons, Texte im Balatro-Look
  // ════════════════════════════════════════════════════════════════════════

  const UI = {
    FONT: "'m6x11', 'Pixelify Sans', 'Courier New', monospace",
    font(size) { return `${Math.round(size)}px ${UI.FONT}`; },

    roundRect(ctx, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    /** Abgerundete Box mit Schlagschatten, dunkler "Emboss"-Unterkante und optionaler Kontur. */
    box(ctx, x, y, w, h, o = {}) {
      const r = o.radius !== undefined ? o.radius : 10, em = o.emboss || 0, col = o.colour || PALETTE.PANEL;
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
      if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; UI.roundRect(ctx, x - 2, y + 4, w, h + em, r); ctx.fill(); }
      if (em) { ctx.fillStyle = o.embossColour || darken(col, 0.35); UI.roundRect(ctx, x, y + em, w, h, r); ctx.fill(); }
      ctx.fillStyle = col; UI.roundRect(ctx, x, y, w, h, r); ctx.fill();
      if (o.outline) { ctx.lineWidth = o.outlineWidth || 2; ctx.strokeStyle = o.outline; UI.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1); ctx.stroke(); }
      ctx.restore();
    },

    /** Text mit Balatro-Schatten (leicht nach links unten versetzt). */
    text(ctx, str, x, y, o = {}) {
      const size = o.size || 24;
      ctx.font = UI.font(size);
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = o.baseline || 'middle';
      if (o.shadow !== false) { ctx.fillStyle = o.shadowColour || 'rgba(0,0,0,0.35)'; ctx.fillText(str, x - size * 0.06, y + size * 0.09); }
      ctx.fillStyle = o.colour || PALETTE.WHITE;
      ctx.fillText(str, x, y);
    },

    /**
     * "DynaText": Buchstaben wippen einzeln, poppen nacheinander auf (pop 0..1) und drehen sich leicht.
     */
    dynaText(ctx, str, x, y, o = {}) {
      str = String(str);
      const size = o.size || 32, t = o.time || 0, wave = o.wave !== undefined ? o.wave : 2.5, rw = o.rotWave !== undefined ? o.rotWave : 0.06;
      const pop = o.pop !== undefined ? o.pop : 1, sc = o.scale || 1;
      ctx.save();
      ctx.translate(x, y);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(sc, sc);
      ctx.font = UI.font(size);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sp = o.spacing || 0;
      const ws = [...str].map((ch) => ctx.measureText(ch).width + sp);
      const total = ws.reduce((a, b) => a + b, 0) - sp;
      let cx = o.align === 'left' ? 0 : o.align === 'right' ? -total : -total / 2;
      const n = ws.length;
      [...str].forEach((ch, i) => {
        const lp = clamp(pop * (n + 2) - i, 0, 1);
        if (lp <= 0) { cx += ws[i]; return; }
        const ls = Ease.outBack(lp);
        const dy = Math.sin(t * 3.2 + i * 0.75) * wave;
        const r = Math.sin(t * 2.3 + i * 1.3) * rw;
        ctx.save();
        ctx.translate(cx + ws[i] / 2 - sp / 2, dy);
        ctx.rotate(r);
        ctx.scale(ls, ls);
        if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(ch, -size * 0.06, size * 0.09); }
        ctx.fillStyle = Array.isArray(o.colour) ? o.colour[i % o.colour.length] : o.colour || PALETTE.WHITE;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        cx += ws[i];
      });
      ctx.restore();
    },

    /**
     * Button im Balatro-Stil. b = {x,y,w,h,label,colour,hover,pressed,disabled,juice?:Juice}
     */
    button(ctx, b, t = 0) {
      const em = 5;
      const col = b.disabled ? PALETTE.L_BLACK : b.colour || PALETTE.ORANGE;
      const j = b.juice ? b.juice.update(t) : { s: 0, r: 0 };
      const press = b.pressed && !b.disabled ? em - 1 : 0;
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2 + press);
      ctx.rotate(j.r);
      const s = 1 + j.s + (b.hover && !b.disabled ? 0.03 : 0);
      ctx.scale(s, s);
      UI.box(ctx, -b.w / 2, -b.h / 2, b.w, b.h, { colour: b.hover && !b.disabled ? lighten(col, 0.08) : col, radius: b.radius || 10, emboss: em - press, shadow: !press });
      UI.text(ctx, b.label, 0, -1, { size: b.size || b.h * 0.42, colour: b.disabled ? PALETTE.GREY : PALETTE.WHITE });
      ctx.restore();
    },

    inside(b, p) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; },

    /** Zahlenformat wie im Spiel (Tausenderpunkte, sehr große Zahlen wissenschaftlich). */
    num(v) {
      v = Math.round(v);
      if (Math.abs(v) >= 1e11) return v.toExponential(3).replace('+', '');
      return v.toLocaleString('de-DE');
    },
  };

  global.BalatroFX = {
    Engine, Sprite, Juice, UI, PALETTE, BG_PRESETS, BG_STYLES, EDITIONS, Ease,
    color: { hexToRgb, rgbToHex, mix: mixHex, darken, lighten, rgba, scale: scaleHex },
    math: { clamp, lerp, damp, rand, pick },
    bgFromColour,
  };
})(typeof window !== 'undefined' ? window : globalThis);
