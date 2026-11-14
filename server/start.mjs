// Startet die Dienste der Seite in einem Prozess auf 127.0.0.1:8081:
// Bewertungen (/api/bewertungen/), Game Requests (/api/ideen/), Konten
// (/api/konto/), die Stimmen der Style Library (/api/stimmen/) und Profile mit
// Spielzeit, Erfolgen und Perlen-Shop (/api/profil/) und die Sterne der
// Jam-Spiele (/api/jam/) und die Statistiken des Minecraft-Servers
// (/api/minecraft/). Gestartet von docker/40-dienste.sh; nginx reicht alle
// sieben Pfade hierher durch.
//
// Alle teilen Datenordner, Wortsperrliste und das Passwort der Verwaltung.

import http from "node:http";
import { mkdirSync } from "node:fs";
import { adminSchutz, salzLesen } from "./gemeinsam.mjs";
import { anwendungBauen, spieleAusKatalog, KATALOG } from "./bewertungen.mjs";
import { ideenBauen } from "./ideen.mjs";
import { kontenBauen } from "./konten.mjs";
import { stimmenBauen, stylesAusKatalog, STYLE_KATALOG } from "./stimmen.mjs";
import { profilBauen } from "./profil.mjs";
import { jamBauen } from "./jam.mjs";
import { minecraftBauen } from "./minecraft.mjs";
import { verwaltungBauen } from "./verwaltung.mjs";
import { studioBauen } from "./studio.mjs";
import { postBauen } from "./post.mjs";

const port = Number(process.env.BEWERTUNGEN_PORT || 8081);
const ordner = process.env.BEWERTUNGEN_ORDNER || "/data";
const passwort = process.env.BEWERTUNGEN_ADMIN_PASSWORT || "";
// Eigenes Salz (Datei im Datenordner), nie das Passwort: die Pruefsumme steht im
// Datenexport eines Kontos, mit dem Passwort als Salz liesse es sich offline raten.
mkdirSync(ordner, { recursive: true });
const salz = process.env.BEWERTUNGEN_SALZ || salzLesen(ordner);
// Oeffentliche Adresse der Seite. Nur von dort nehmen die Dienste aendernde
// Anfragen an, und dorthin schicken Discord und Google nach der Anmeldung zurueck.
const adresse = (process.env.MIWALE_ADRESSE || "https://miwale.com").replace(/\/+$/, "");
if (!passwort) console.warn("BEWERTUNGEN_ADMIN_PASSWORT fehlt: die Verwaltungsseite bleibt gesperrt.");

// Konten nur, wenn die Spiele unter eigener Adresse laufen (SPIELE_ADRESSE,
// docker/30-umgebung.sh). Laufen sie unter derselben Adresse wie die Seite,
// koennte jedes Spiel im Namen eines angemeldeten Besuchers handeln -- die
// Pruefung auf fremde Seiten haelt es nicht auf, es IST ja die eigene Seite.
const spieleGetrennt = !!process.env.SPIELE_ADRESSE;
const anbieter = spieleGetrennt ? {
  discord: { id: process.env.DISCORD_CLIENT_ID, secret: process.env.DISCORD_CLIENT_SECRET },
  google: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
} : {};
if (!spieleGetrennt) console.warn("Anmelden ist aus: SPIELE_ADRESSE fehlt, die Spiele laufen unter der Adresse der Seite.");
for (const [name, z] of Object.entries(anbieter)) {
  if (!z.id || !z.secret) console.warn("Anmelden mit " + name + " ist aus: " + name.toUpperCase() + "_CLIENT_ID/_SECRET fehlen.");
}

// E-Mails (Einreichungen, Pruefergebnisse, Konten mit E-Mail). Ohne SMTP_HOST
// landen sie nur im Postausgang der Verwaltung.
const post = postBauen({
  ordner,
  zugang: {
    host: process.env.SMTP_HOST || "", port: Number(process.env.SMTP_PORT || 465),
    benutzer: process.env.SMTP_BENUTZER || "", passwort: process.env.SMTP_PASSWORT || "",
    absender: process.env.SMTP_ABSENDER || process.env.SMTP_BENUTZER || ""
  }
});
if (!process.env.SMTP_HOST) console.warn("SMTP_HOST fehlt: E-Mails landen nur im Postausgang der Verwaltung.");

// Admin-Konten mit 2FA (/api/verwaltung/). Das alte Passwort legt nur noch das erste Konto an.
// Benachrichtigungen gehen an die Liste aus den Einstellungen, sonst an MELDUNG_AN.
const meldungAn = String(process.env.MELDUNG_AN || "").split(",").map((x) => x.trim()).filter(Boolean);
const verwaltung = verwaltungBauen({ ordner, passwort, herkunft: [adresse], post, meldungAn });

// Ein Schutz gegen das Raten des Verwaltungs-Passworts fuer alle Dienste zusammen.
// Mit Admin-Konten gilt stattdessen deren Sitzung (gemeinsam.mjs, adminSchutz).
const gemeinsam = { ordner, passwort, salz, herkunft: [adresse], adminSchutz: adminSchutz(undefined, undefined, verwaltung) };
const konten = kontenBauen({
  ...gemeinsam,
  adresse,
  anbieter,
  // Anmelden mit E-Mail und Passwort: dieselbe Regel wie Discord/Google.
  email: { aktiv: spieleGetrennt, post },
  beimLoeschen: (id) => { bewertungen.kontoLoeschen(id); ideen.kontoLoeschen(id); profil.kontoLoeschen(id); studio.kontoLoeschen(id); },
  datenVon: (id) => ({ bewertungen: bewertungen.kontoDaten(id), ...ideen.kontoDaten(id), profil: profil.kontoDaten(id), studio: studio.kontoDaten(id) })
});
const festeSpiele = spieleAusKatalog(process.env.BEWERTUNGEN_KATALOG || KATALOG);
// Studio (/api/studio/): Builds nur mit eigener Spiele-Adresse -- fremder Code
// laeuft nie unter miwale.com.
const studio = studioBauen({
  ...gemeinsam, konten, verwaltung, post, adresse, festeIds: festeSpiele,
  spieleAdresse: (process.env.SPIELE_ADRESSE || "").replace(/\/+$/, "")
});
const bewertungen = anwendungBauen({
  ...gemeinsam,
  konten,
  spiele: festeSpiele,
  weitereSpiele: () => studio.liveIds(),
  beiBewertung: (id, spiel) => profil.ereignis(id, "bewertung", spiel)
});
const ideen = ideenBauen({ ...gemeinsam, konten, beiIdee: (id, idee) => profil.ereignis(id, "idee", idee) });
const profil = profilBauen({ ...gemeinsam, konten, weitereSpiele: () => studio.liveIds() });
// Stimmen der Game Style Library; welche Styles es gibt, steht im Katalog der Seite.
const stimmen = stimmenBauen({ ...gemeinsam, katalog: stylesAusKatalog(process.env.STIMMEN_KATALOG || STYLE_KATALOG) });
// Sterne der Jam-Spiele (miwale.com/jam); welche Spiele es gibt, steht in jams.json.
const jam = jamBauen({ ...gemeinsam, ...(process.env.JAM_KATALOG ? { katalog: process.env.JAM_KATALOG } : {}) });
// Statistiken des Minecraft-Servers (miwale.com/minecraft/statistics); der Stand kommt vom Panel auf dem PC.
const minecraft = minecraftBauen({ ...gemeinsam, schluessel: process.env.MINECRAFT_TOKEN || "" });

const unter = (url, basis) => url === basis || url.startsWith(basis + "/") || url.startsWith(basis + "?");

http.createServer((req, res) => {
  if (unter(req.url, "/api/konto")) return konten(req, res);
  if (unter(req.url, "/api/ideen")) return ideen(req, res);
  if (unter(req.url, "/api/stimmen")) return stimmen(req, res);
  if (unter(req.url, "/api/profil")) return profil(req, res);
  if (unter(req.url, "/api/jam")) return jam(req, res);
  if (unter(req.url, "/api/minecraft")) return minecraft(req, res);
  if (unter(req.url, "/api/studio")) return studio(req, res);
  if (unter(req.url, "/api/verwaltung")) return verwaltung(req, res);
  return bewertungen(req, res);
}).listen(port, "127.0.0.1", () => console.log("Dienste auf 127.0.0.1:" + port));

// Profile werden gesammelt geschrieben; beim Beenden den Rest sichern.
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => { profil.flush(); process.exit(0); });
