// Seiten, die Suchmaschinen, Link-Vorschauen und KI-Crawler lesen koennen.
//
// Die Spieleseite ist eine Ein-Seiten-App: index.html hat ein leeres #app, den
// Rest zeichnet shop.js. Discord, X, WhatsApp und viele Crawler fuehren kein JS
// aus und sahen deshalb bei jedem Spiel dieselbe Vorschau (die der Startseite).
// Dieses Modul baut aus dem Katalog (shop/spiele.js) je Spiel eine Fassung von
// index.html mit eigenem Titel, eigener Beschreibung, eigenem Vorschaubild und
// dem sichtbaren Text schon im HTML. shop.js ersetzt den Inhalt beim Start wie
// bisher. Dazu: sitemap.xml, robots.txt, feed.xml und das Presskit unter /press.
//
// Reine Funktionen, Text rein, Text raus. Geschrieben wird in tools/seiten.mjs;
// der Vite-Server (tools/games-preview.mjs) ruft sie bei jeder Anfrage auf.
//
// wurzel ist der Ordner mit index.html, shop/ und assets/: das Repository oder
// der fertige Ausgabeordner (dist, im Image /usr/share/nginx/html).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { zipBauen } from './zip.mjs';

export const SITE = 'https://miwale.com';
export const KANAELE = {
  youtube: 'https://www.youtube.com/@miwale-games',
  itch: 'https://milchinien.itch.io/',
  github: 'https://github.com/milchinien'
};
export const KONTAKT = 'michi.waggoner@gmail.com';
export const OG = { breite: 1200, hoehe: 630 };
export const STANDARD_BILD = 'assets/og/miwale.jpg';

const MONATE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GERAETE = { pc: 'PC', handy: 'Phone' };

export function esc(x) {
  return String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** JSON fuer ein <script type="application/ld+json">: "<" ausgeschrieben, damit nichts den Block beendet. */
export function jsonLd(daten) {
  const BS = String.fromCharCode(92);
  return JSON.stringify(daten)
    .split('<').join(BS + 'u003c')
    .split(String.fromCharCode(0x2028)).join(BS + 'u2028')
    .split(String.fromCharCode(0x2029)).join(BS + 'u2029');
}

export function datumKurz(iso) {
  const [j, m, t] = String(iso || '').split('-').map(Number);
  return j && m && t ? `${t} ${MONATE[m - 1]} ${j}` : '';
}

// ---- Daten lesen -------------------------------------------------------------------

export function katalogLesen(wurzel) {
  const window = {};
  for (const datei of ['shop/spiele.js', 'shop/spiele-auto.js']) {
    const pfad = join(wurzel, datei);
    if (existsSync(pfad)) new Function('window', readFileSync(pfad, 'utf8'))(window);
  }
  return window.MIWALE_SPIELE || [];
}

export function stylesLesen(wurzel) {
  for (const pfad of ['public/styles/styles.json', 'styles/styles.json']) {
    const voll = join(wurzel, pfad);
    if (existsSync(voll)) return JSON.parse(readFileSync(voll, 'utf8')).styles || [];
  }
  return [];
}

export const text = (sp, l = 'en') => (sp.texte && (sp.texte[l] || sp.texte.en)) || {};
const bildPfad = (p) => String(p || '').replace(/^\//, '');
export const bildUrl = (p) => `${SITE}/${bildPfad(p)}`;

/** Das Hauptbild eines Spiels: erster Screenshot, sonst die Kachel. */
export function hauptbild(sp) {
  const m = sp.medien || {};
  return (m.screens && m.screens[0]) || (sp.bilder && sp.bilder[0]) || sp.bild;
}

/** Vorschaubild fuers Teilen: die Karte aus tools/og-bilder.mjs, sonst die allgemeine. */
export function ogBild(wurzel, id) {
  const eigene = `assets/og/${id}.jpg`;
  return existsSync(join(wurzel, eigene)) ? eigene : STANDARD_BILD;
}

// ---- Gemeinsame Bausteine ----------------------------------------------------------

const ORGANISATION = {
  '@type': 'Organization',
  '@id': `${SITE}/#miwale`,
  name: 'miwale',
  url: SITE,
  logo: `${SITE}/assets/logo-wordmark.png`,
  sameAs: [KANAELE.youtube, KANAELE.itch, KANAELE.github]
};

/** Alles zwischen den Markern in <head> von index.html. */
export function seoBlock({ titel, beschreibung, url, bild, bildAlt, daten = [], robots }) {
  const zeilen = [
    `<title>${esc(titel)}</title>`,
    `<meta name="description" content="${esc(beschreibung)}">`,
    robots ? `<meta name="robots" content="${esc(robots)}">` : '',
    url ? `<link rel="canonical" href="${esc(url)}">` : '',
    `<link rel="alternate" type="application/atom+xml" title="miwale games" href="/feed.xml">`,
    `<meta property="og:site_name" content="miwale games">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(titel)}">`,
    `<meta property="og:description" content="${esc(beschreibung)}">`,
    url ? `<meta property="og:url" content="${esc(url)}">` : '',
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:locale:alternate" content="de_DE">`,
    `<meta property="og:image" content="${esc(bildUrl(bild))}">`,
    `<meta property="og:image:width" content="${OG.breite}">`,
    `<meta property="og:image:height" content="${OG.hoehe}">`,
    `<meta property="og:image:alt" content="${esc(bildAlt || titel)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(titel)}">`,
    `<meta name="twitter:description" content="${esc(beschreibung)}">`,
    `<meta name="twitter:image" content="${esc(bildUrl(bild))}">`,
    ...daten.map((d) => `<script type="application/ld+json">${jsonLd(d)}</script>`)
  ];
  return zeilen.filter(Boolean).join('\n');
}

/** Setzt seoBlock und den vorgezeichneten Inhalt in die Vorlage index.html ein. */
export function seiteBauen(vorlage, { seo, inhalt }) {
  if (!/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/.test(vorlage)) throw new Error('index.html: Marker seo:start/seo:end fehlen');
  if (!vorlage.includes('<div id="app"></div>')) throw new Error('index.html: <div id="app"></div> fehlt');
  return vorlage
    .replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => `<!-- seo:start -->\n${seo}\n<!-- seo:end -->`)
    .replace('<div id="app"></div>', () => `<div id="app">\n${inhalt}\n</div>`);
}

const vorlageLesen = (wurzel) => readFileSync(join(wurzel, 'index.html'), 'utf8');

// ---- Startseite und Spielseiten ----------------------------------------------------

const STARTTEXT = 'Idle games, card games and roguelites by miwale. Play them right in your browser — no download, no sign-up.';

function spielListe(spiele) {
  return '<ul class="sp-vorab__liste">' + spiele.map((sp) =>
    `<li><a href="/games/${esc(sp.id)}">${esc(sp.name)}</a> — ${esc(text(sp).kurz)}</li>`).join('') + '</ul>';
}

export function startSeite(wurzel, spiele = katalogLesen(wurzel)) {
  const inhalt = '<main class="sp-vorab sp-breite">' +
    '<h1>miwale games</h1>' +
    `<p class="sp-vorab__kurz">${esc(STARTTEXT)}</p>` +
    '<h2>All games</h2>' + spielListe(spiele) +
    `<p><a href="/requests">Game Requests</a> · <a href="/portfolio">Portfolio</a> · <a href="/styles/">Game Style Library</a> · <a href="/press/">Press kit</a> · <a href="/feed.xml">Feed</a></p>` +
    '</main>';
  const daten = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'miwale games', url: SITE, inLanguage: ['en', 'de'], publisher: { '@id': `${SITE}/#miwale` } },
    { '@context': 'https://schema.org', ...ORGANISATION },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Games by miwale',
      itemListElement: spiele.map((sp, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/games/${sp.id}`, name: sp.name }))
    }
  ];
  return seiteBauen(vorlageLesen(wurzel), {
    seo: seoBlock({
      titel: 'miwale games — play free in your browser',
      beschreibung: STARTTEXT,
      url: `${SITE}/`,
      bild: STANDARD_BILD,
      bildAlt: 'miwale games — free browser games',
      daten
    }),
    inhalt
  });
}

function spielDaten(sp, wurzel, spiele) {
  const t = text(sp);
  const url = `${SITE}/games/${sp.id}`;
  const m = sp.medien || {};
  const spiel = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: sp.name,
    url,
    description: t.kurz,
    image: bildUrl(ogBild(wurzel, sp.id)),
    genre: t.tags || [],
    applicationCategory: 'Game',
    gamePlatform: (sp.geraete || ['pc']).map((g) => (g === 'handy' ? 'Mobile web browser' : 'Desktop web browser')),
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url },
    publisher: { '@id': `${SITE}/#miwale` },
    author: { '@id': `${SITE}/#miwale` }
  };
  if (sp.veroeffentlicht) spiel.datePublished = sp.veroeffentlicht;
  if (m.trailer && sp.veroeffentlicht) {
    spiel.video = {
      '@type': 'VideoObject',
      name: `${sp.name} — trailer`,
      description: t.kurz,
      thumbnailUrl: bildUrl(ogBild(wurzel, sp.id)),
      uploadDate: sp.veroeffentlicht,
      contentUrl: bildUrl(m.trailer)
    };
  }
  const pfad = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'All games', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: sp.name, item: url }
    ]
  };
  return [{ '@context': 'https://schema.org', ...ORGANISATION }, spiel, pfad];
}

export function spielSeite(wurzel, id, spiele = katalogLesen(wurzel)) {
  const sp = spiele.find((s) => s.id === id);
  if (!sp) return null;
  const t = text(sp);
  const weitere = spiele.filter((s) => s.id !== id);
  const status = [(sp.status && (sp.status.en || sp.status.de)) || '', sp.veroeffentlicht ? 'Released ' + datumKurz(sp.veroeffentlicht) : '',
    (sp.geraete || []).map((g) => GERAETE[g] || g).join(' · ')].filter(Boolean).join(' · ');
  const inhalt = '<main class="sp-vorab sp-breite">' +
    '<p><a href="/">All games</a></p>' +
    `<h1>${esc(sp.name)}</h1>` +
    `<p class="sp-vorab__status">${esc(status)}</p>` +
    `<p class="sp-vorab__kurz">${esc(t.kurz)}</p>` +
    `<p><a class="sp-vorab__spielen" href="/games/${esc(sp.id)}/spielen">Play now — free in your browser</a></p>` +
    ((t.ueber || []).length ? '<h2>About this game</h2>' + t.ueber.map((p) => `<p>${esc(p)}</p>`).join('') : '') +
    ((t.features || []).length ? '<h2>Features</h2><ul>' + t.features.map((f) => `<li>${esc(f)}</li>`).join('') + '</ul>' : '') +
    (t.steuerung ? `<h2>How to play</h2><p>${esc(t.steuerung)}</p>` : '') +
    ((t.tags || []).length ? `<p class="sp-vorab__tags">${esc(t.tags.join(', '))}</p>` : '') +
    '<h2>More games from miwale</h2>' + spielListe(weitere) +
    '</main>';
  return seiteBauen(vorlageLesen(wurzel), {
    seo: seoBlock({
      titel: `${sp.name} — play free in your browser | miwale games`,
      beschreibung: t.kurz,
      url: `${SITE}/games/${sp.id}`,
      bild: ogBild(wurzel, sp.id),
      bildAlt: `${sp.name} — ${t.kurz}`.slice(0, 200),
      daten: spielDaten(sp, wurzel, spiele)
    }),
    inhalt
  });
}

// ---- sitemap.xml, robots.txt, feed.xml ---------------------------------------------

export function sitemap(wurzel, spiele = katalogLesen(wurzel)) {
  const styles = stylesLesen(wurzel);
  const urls = [
    '/', ...spiele.map((s) => `/games/${s.id}`), '/requests', '/portfolio', '/press/', '/privacy',
    ...(styles.length ? ['/styles/', '/styles/mix/', '/styles/design/', ...styles.map((s) => `/styles/${s.id}/`)] : [])
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${esc(SITE + u)}</loc></url>`).join('\n') + '\n</urlset>\n';
}

export function robots() {
  return [
    'User-agent: *',
    'Allow: /',
    // Verwaltung, Werkzeuge und Schnittstellen gehoeren nicht in Suchergebnisse.
    'Disallow: /admin/',
    'Disallow: /dev/',
    'Disallow: /usage/',
    'Disallow: /api/',
    // Profile gehoeren den Spielern: nicht in Suchergebnisse.
    'Disallow: /u/',
    'Disallow: /profile',
    'Disallow: /library',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    ''
  ].join('\n');
}

/**
 * Atom-Feed: neue Spiele und, wo vorhanden, Neuigkeiten (Feld "neuigkeiten" im
 * Katalog: { datum, titel: { en, de }, text: { en, de } }). Kein Konto, keine
 * E-Mail-Adresse: wer folgen will, nimmt einen Feed-Reader.
 */
export function feed(wurzel, spiele = katalogLesen(wurzel)) {
  const eintraege = [];
  for (const sp of spiele) {
    const t = text(sp);
    if (sp.veroeffentlicht) {
      eintraege.push({
        id: `tag:miwale.com,${sp.veroeffentlicht}:${sp.id}`, datum: sp.veroeffentlicht, titel: `New game: ${sp.name}`,
        url: `${SITE}/games/${sp.id}`, kurz: t.kurz, bild: ogBild(wurzel, sp.id)
      });
    }
    for (const n of sp.neuigkeiten || []) {
      const titel = (n.titel && (n.titel.en || n.titel.de)) || '';
      const inh = (n.text && (n.text.en || n.text.de)) || '';
      if (n.datum && titel) {
        eintraege.push({ id: `tag:miwale.com,${n.datum}:${sp.id}:${titel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, datum: n.datum, titel: `${sp.name}: ${titel}`, url: `${SITE}/games/${sp.id}`, kurz: inh, bild: ogBild(wurzel, sp.id) });
      }
    }
  }
  eintraege.sort((a, b) => b.datum.localeCompare(a.datum) || a.id.localeCompare(b.id));
  const neueste = eintraege.length ? eintraege[0].datum : '2026-01-01';
  return '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">\n' +
    '  <title>miwale games</title>\n' +
    '  <subtitle>New games and updates from miwale — free to play in your browser.</subtitle>\n' +
    `  <link rel="self" type="application/atom+xml" href="${SITE}/feed.xml"/>\n` +
    `  <link rel="alternate" type="text/html" href="${SITE}/"/>\n` +
    `  <id>${SITE}/</id>\n` +
    `  <updated>${neueste}T00:00:00Z</updated>\n` +
    '  <author><name>miwale</name></author>\n' +
    eintraege.slice(0, 30).map((e) =>
      '  <entry>\n' +
      `    <id>${esc(e.id)}</id>\n    <title>${esc(e.titel)}</title>\n    <link rel="alternate" type="text/html" href="${esc(e.url)}"/>\n` +
      `    <updated>${e.datum}T00:00:00Z</updated>\n    <summary>${esc(e.kurz)}</summary>\n` +
      `    <content type="html">${esc(`<p><img src="${bildUrl(e.bild)}" alt="" width="600"></p><p>${esc(e.kurz)}</p>`)}</content>\n` +
      '  </entry>').join('\n') + '\n</feed>\n';
}

// ---- Presskit ----------------------------------------------------------------------

const BOILERPLATE = {
  en: 'miwale is a one-person game studio from Leipzig, Germany. Michel Waggoner builds idle games, card games and roguelites with the help of AI, tunes them by hand, and releases them free to play in the browser — no download, no sign-up.',
  de: 'miwale ist ein Ein-Personen-Spielestudio aus Leipzig. Michel Waggoner baut Idle-Spiele, Kartenspiele und Roguelites mit KI-Unterstützung, feilt von Hand nach und veröffentlicht sie kostenlos im Browser — ohne Download, ohne Anmeldung.'
};

const FARBEN = [
  ['Navy', '#172449'], ['Deep navy', '#070C1A'], ['Aqua', '#3FC6DC'], ['Light aqua', '#7FE0EE'], ['Ice', '#EDF3F9']
];

/** Dateien des Presskits: [{ name, daten }] — Marke, Fakten und je Spiel Bilder, Trailer und Karte. */
export function presseDateien(wurzel, spiele = katalogLesen(wurzel)) {
  const dateien = [];
  const dazu = (name, rel) => {
    const pfad = join(wurzel, bildPfad(rel));
    if (rel && existsSync(pfad) && statSync(pfad).isFile()) dateien.push({ name, daten: readFileSync(pfad) });
  };
  dazu('miwale-presskit/brand/logo-wordmark-dark-text.png', 'assets/logo-wordmark.png');
  dazu('miwale-presskit/brand/logo-wordmark-light-text.png', 'assets/logo-wordmark-light.png');
  dazu('miwale-presskit/brand/mascot-whale.png', 'assets/mascot-whale.png');
  dazu('miwale-presskit/brand/mascot-whale-light.png', 'assets/mascot-whale-light.png');
  dazu('miwale-presskit/brand/share-card.jpg', STANDARD_BILD);
  dateien.push({ name: 'miwale-presskit/factsheet.txt', daten: Buffer.from(faktenText(spiele), 'utf8') });
  for (const sp of spiele) {
    const m = sp.medien || {};
    const ordner = `miwale-presskit/games/${sp.id}/`;
    const bilder = [...new Set([...(m.screens || []), ...(sp.bilder || [])])].filter((p) => !/-trailer\./.test(p));
    bilder.forEach((p, i) => dazu(`${ordner}screenshot-${i + 1}.${p.split('.').pop()}`, p));
    dazu(`${ordner}trailer.${(m.trailer || 'x.webm').split('.').pop()}`, m.trailer);
    dazu(`${ordner}share-card.jpg`, `assets/og/${sp.id}.jpg`);
  }
  return dateien;
}

function faktenText(spiele) {
  return [
    'miwale — fact sheet', '===================', '',
    'Studio:    miwale (one-person game studio)',
    'Developer: Michel Waggoner',
    'Based in:  Leipzig, Germany',
    `Website:   ${SITE}`,
    `Contact:   ${KONTAKT}`,
    `YouTube:   ${KANAELE.youtube}`,
    `itch.io:   ${KANAELE.itch}`,
    `GitHub:    ${KANAELE.github}`,
    'Price:     all games are free to play in the browser (no download, no sign-up)', '',
    'About (EN)', BOILERPLATE.en, '',
    'Über miwale (DE)', BOILERPLATE.de, '',
    'Games', '-----',
    ...spiele.map((sp) => `${sp.name} (${datumKurz(sp.veroeffentlicht)}): ${text(sp).kurz}\n  ${SITE}/games/${sp.id}`),
    '', 'Colours', '-------', ...FARBEN.map(([n, h]) => `${n}: ${h}`), ''
  ].join('\n');
}

export function presseZip(wurzel, spiele = katalogLesen(wurzel)) {
  return zipBauen(presseDateien(wurzel, spiele));
}

const PRESSE_CSS = `
:root{color-scheme:dark;--akzent:#7FE0EE;--leise:rgba(237,243,249,.68)}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1100px 480px at 15% -6%,rgba(127,224,238,.2),transparent 70%),linear-gradient(180deg,#0D3A4E 0%,#071A29 40%,#050A16 100%) fixed;color:#EDF3F9;font:400 16px/1.6 Manrope,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--akzent);text-decoration:none}a:hover{color:#fff}
:focus-visible{outline:2px solid var(--akzent);outline-offset:3px}
.kopf{width:min(1080px,100% - 40px);margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.kopf img{height:38px;width:auto}
.kopf nav{display:flex;gap:18px;font-weight:600;font-size:14px}
main{width:min(1080px,100% - 40px);margin:0 auto;padding:12px 0 80px}
h1{font:700 clamp(34px,5vw,52px)/1.08 Quicksand,Manrope,sans-serif;margin:14px 0 10px;letter-spacing:-.01em}
h2{font:700 13px/1 Manrope,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--akzent);margin:56px 0 18px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.12)}
h3{font:700 22px/1.2 Quicksand,Manrope,sans-serif;margin:0 0 6px}
.lead{font-size:19px;color:var(--leise);max-width:68ch;margin:0 0 24px}
.knopf{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 22px;border-radius:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:14px;background:linear-gradient(180deg,#8BEAF3,#3FC6DC);color:#062A33}
.knopf:hover{color:#062A33;filter:brightness(1.08)}
.knopf--glas{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18);text-transform:none;letter-spacing:.01em}
.knopf--glas:hover{color:#fff;background:rgba(255,255,255,.14)}
.reihe{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0 0}
.fakten{display:grid;grid-template-columns:max-content 1fr;gap:10px 28px;margin:0}
.fakten dt{color:var(--leise)}.fakten dd{margin:0}
.zwei{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.karte{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:20px}
.karte p{margin:0;color:var(--leise)}
.karte .sprache{font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--akzent);margin-bottom:8px}
.farben{display:flex;gap:14px;flex-wrap:wrap}
.farbe{width:150px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.14);font-size:13px}
.farbe i{display:block;height:64px}.farbe span{display:block;padding:8px 10px;background:rgba(0,0,0,.25)}
.marke{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.marke figure{margin:0;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.marke .feld{display:grid;place-items:center;height:130px;padding:16px}
.marke .dunkel{background:#070C1A}.marke .hell{background:#EDF3F9}
.marke img{max-height:80px;max-width:100%;width:auto}
.marke figcaption{padding:8px 12px;font-size:13px;color:var(--leise);background:rgba(0,0,0,.25)}
.spiel{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:22px;margin:0 0 34px;padding:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12);border-radius:8px}
.spiel .bild{position:relative;border-radius:6px;overflow:hidden;background:#000;aspect-ratio:16/9}
.spiel .bild img{width:100%;height:100%;object-fit:cover}
.meta{margin:0 0 10px;font-size:13px;color:var(--leise)}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px;padding:0;list-style:none}
.tags li{padding:2px 9px;font-size:12px;font-weight:600;border-radius:4px;background:rgba(127,224,238,.12);color:var(--akzent)}
.mini{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.mini a{display:block;width:104px;border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,.14)}
.mini img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.links{display:flex;gap:16px;flex-wrap:wrap;font-weight:600;font-size:14px;margin-top:12px}
footer{width:min(1080px,100% - 40px);margin:0 auto;padding:26px 0 50px;border-top:1px solid rgba(255,255,255,.12);color:var(--leise);font-size:14px}
@media (max-width:760px){.zwei,.spiel{grid-template-columns:1fr}.fakten{grid-template-columns:1fr;gap:2px}.fakten dd{margin-bottom:10px}}
`;

/** Die Presse-Seite /press/ als eigenstaendige HTML-Datei (Stil eingebettet, Schriften aus /assets/fonts). zipMB: Groesse des Downloads fuer die Beschriftung. */
export function presseSeite(wurzel, spiele = katalogLesen(wurzel), zipMB = 0) {
  const zipGroesse = zipMB;
  const spielHtml = spiele.map((sp) => {
    const t = text(sp);
    const m = sp.medien || {};
    const shots = [...new Set([...(m.screens || []), ...(sp.bilder || [])])].filter((p) => !/-trailer\./.test(p)).slice(0, 4);
    const status = (sp.status && sp.status.en) || '';
    return `<article class="spiel" id="${esc(sp.id)}">` +
      `<div class="bild"><img src="/${esc(bildPfad(hauptbild(sp)))}" alt="${esc(sp.name)} screenshot" loading="lazy" width="800" height="450"></div>` +
      '<div>' +
      `<h3>${esc(sp.name)}</h3>` +
      `<p class="meta">${esc([status, sp.veroeffentlicht ? 'Released ' + datumKurz(sp.veroeffentlicht) : '', (sp.geraete || []).map((g) => GERAETE[g] || g).join(' · ')].filter(Boolean).join(' · '))}</p>` +
      `<p>${esc(t.kurz)}</p>` +
      `<ul class="tags">${(t.tags || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
      `<div class="reihe" style="margin:0"><a class="knopf" href="/games/${esc(sp.id)}">Play free</a>` +
      (m.trailer ? `<a class="knopf knopf--glas" href="/${esc(bildPfad(m.trailer))}" download>Trailer (WebM)</a>` : '') + '</div>' +
      (shots.length ? `<div class="mini">${shots.map((p, i) => `<a href="/${esc(bildPfad(p))}" download title="Screenshot ${i + 1}"><img src="/${esc(bildPfad(p))}" alt="" loading="lazy" width="208" height="117"></a>`).join('')}</div>` : '') +
      '</div></article>';
  }).join('\n');
  const beschreibung = 'Press kit for miwale: fact sheet, logos, screenshots, trailers and contact for one-person game studio miwale from Leipzig.';
  const seo = seoBlock({
    titel: 'Press kit — miwale games',
    beschreibung,
    url: `${SITE}/press/`,
    bild: STANDARD_BILD,
    bildAlt: 'miwale games press kit',
    daten: [{ '@context': 'https://schema.org', ...ORGANISATION, email: KONTAKT, address: { '@type': 'PostalAddress', addressLocality: 'Leipzig', addressCountry: 'DE' } }]
  });
  return `<!doctype html>
<html lang="en" translate="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google" content="notranslate">
<base href="/">
${seo}
<link rel="icon" type="image/png" sizes="128x128" href="/assets/favicon-whale.png" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/png" sizes="128x128" href="/assets/favicon-whale-light.png" media="(prefers-color-scheme: dark)">
<link rel="preload" href="/assets/fonts/manrope-v20-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/quicksand-v37-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/_ds/miwale-design-system-4a4112aa-5a13-43da-86d2-90be065036b7/tokens/fonts.css">
<style>${PRESSE_CSS}</style>
</head>
<body>
<header class="kopf">
  <a href="/" aria-label="miwale games"><img src="/assets/logo-wordmark-light.png" alt="miwale" width="110" height="38"></a>
  <nav><a href="/">Games</a><a href="/portfolio">Portfolio</a><a href="/styles/">Style Library</a><a href="/feed.xml">Feed</a></nav>
</header>
<main>
  <h1>Press kit</h1>
  <p class="lead">Everything you need to write about miwale: facts, logos, screenshots and trailers. Use it freely — a link back to miwale.com is appreciated.</p>
  <div class="reihe">
    <a class="knopf" href="/press/miwale-presskit.zip" download>Download everything${zipGroesse ? ` (ZIP, ${zipGroesse} MB)` : ''}</a>
    <a class="knopf knopf--glas" href="mailto:${esc(KONTAKT)}">${esc(KONTAKT)}</a>
  </div>

  <h2>Fact sheet</h2>
  <dl class="fakten">
    <dt>Studio</dt><dd>miwale — one-person game studio</dd>
    <dt>Developer</dt><dd>Michel Waggoner</dd>
    <dt>Based in</dt><dd>Leipzig, Germany</dd>
    <dt>Games</dt><dd>${spiele.length} playable, all free in the browser — no download, no sign-up</dd>
    <dt>Website</dt><dd><a href="${SITE}/">miwale.com</a></dd>
    <dt>Contact</dt><dd><a href="mailto:${esc(KONTAKT)}">${esc(KONTAKT)}</a></dd>
    <dt>Channels</dt><dd><a href="${KANAELE.youtube}" rel="noopener">YouTube</a> · <a href="${KANAELE.itch}" rel="noopener">itch.io</a> · <a href="${KANAELE.github}" rel="noopener">GitHub</a> · <a href="/feed.xml">Atom feed</a></dd>
  </dl>

  <h2>About miwale</h2>
  <div class="zwei">
    <div class="karte" lang="en"><div class="sprache">ENGLISH</div><p>${esc(BOILERPLATE.en)}</p></div>
    <div class="karte" lang="de"><div class="sprache">DEUTSCH</div><p>${esc(BOILERPLATE.de)}</p></div>
  </div>

  <h2>Games</h2>
${spielHtml}

  <h2>Logo and mascot</h2>
  <div class="marke">
    <figure><div class="feld hell"><img src="/assets/logo-wordmark.png" alt="miwale wordmark, dark" width="232" height="80"></div><figcaption>Wordmark for light backgrounds</figcaption></figure>
    <figure><div class="feld dunkel"><img src="/assets/logo-wordmark-light.png" alt="miwale wordmark, light" width="232" height="80"></div><figcaption>Wordmark for dark backgrounds</figcaption></figure>
    <figure><div class="feld dunkel"><img src="/assets/mascot-whale-light.png" alt="miwale whale mascot" width="120" height="80"></div><figcaption>Whale mascot</figcaption></figure>
  </div>
  <p class="meta" style="margin-top:14px">Please keep the wordmark unchanged and leave some space around it. Don't recolour, stretch or add effects.</p>

  <h2>Colours and fonts</h2>
  <div class="farben">${FARBEN.map(([n, h]) => `<div class="farbe"><i style="background:${h}"></i><span>${esc(n)} · ${h}</span></div>`).join('')}</div>
  <p class="meta" style="margin-top:14px">Fonts: Quicksand (headings), Manrope (text) — both free on Google Fonts.</p>
</main>
<footer>© miwale · Michel Waggoner · <a href="/privacy">Privacy</a></footer>
</body>
</html>
`;
}
