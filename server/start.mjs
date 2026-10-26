// Startet die Dienste der Seite in einem Prozess auf 127.0.0.1:8081:
// Bewertungen (/api/bewertungen/), Game Requests (/api/ideen/), Konten
// (/api/konto/), die Stimmen der Style Library (/api/stimmen/) und Profile mit
// Spielzeit, Erfolgen und Perlen-Shop (/api/profil/). Gestartet von
// docker/40-dienste.sh; nginx reicht alle fuenf Pfade hierher durch.
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

// Ein Schutz gegen das Raten des Verwaltungs-Passworts fuer alle Dienste zusammen.
const gemeinsam = { ordner, passwort, salz, herkunft: [adresse], adminSchutz: adminSchutz() };
const konten = kontenBauen({
  ...gemeinsam,
  adresse,
  anbieter,
  beimLoeschen: (id) => { bewertungen.kontoLoeschen(id); ideen.kontoLoeschen(id); profil.kontoLoeschen(id); },
  datenVon: (id) => ({ bewertungen: bewertungen.kontoDaten(id), ...ideen.kontoDaten(id), profil: profil.kontoDaten(id) })
});
const bewertungen = anwendungBauen({
  ...gemeinsam,
  konten,
  spiele: spieleAusKatalog(process.env.BEWERTUNGEN_KATALOG || KATALOG),
  beiBewertung: (id, spiel) => profil.ereignis(id, "bewertung", spiel)
});
const ideen = ideenBauen({ ...gemeinsam, konten, beiIdee: (id, idee) => profil.ereignis(id, "idee", idee) });
const profil = profilBauen({ ...gemeinsam, konten });
// Stimmen der Game Style Library; welche Styles es gibt, steht im Katalog der Seite.
const stimmen = stimmenBauen({ ...gemeinsam, katalog: stylesAusKatalog(process.env.STIMMEN_KATALOG || STYLE_KATALOG) });

const unter = (url, basis) => url === basis || url.startsWith(basis + "/") || url.startsWith(basis + "?");

http.createServer((req, res) => {
  if (unter(req.url, "/api/konto")) return konten(req, res);
  if (unter(req.url, "/api/ideen")) return ideen(req, res);
  if (unter(req.url, "/api/stimmen")) return stimmen(req, res);
  if (unter(req.url, "/api/profil")) return profil(req, res);
  return bewertungen(req, res);
}).listen(port, "127.0.0.1", () => console.log("Dienste auf 127.0.0.1:" + port));

// Profile werden gesammelt geschrieben; beim Beenden den Rest sichern.
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => { profil.flush(); process.exit(0); });
