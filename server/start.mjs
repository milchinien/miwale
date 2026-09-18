// Startet die Dienste der Seite in einem Prozess auf 127.0.0.1:8081:
// Bewertungen (/api/bewertungen/) und Game Requests (/api/ideen/).
// Gestartet von docker/40-dienste.sh; nginx reicht beide Pfade hierher durch.
//
// Beide teilen Datenordner, Wortsperrliste und das Passwort der Verwaltung.

import http from "node:http";
import { anwendungBauen, spieleAusKatalog, KATALOG } from "./bewertungen.mjs";
import { ideenBauen } from "./ideen.mjs";

const port = Number(process.env.BEWERTUNGEN_PORT || 8081);
const ordner = process.env.BEWERTUNGEN_ORDNER || "/data";
const passwort = process.env.BEWERTUNGEN_ADMIN_PASSWORT || "";
const salz = process.env.BEWERTUNGEN_SALZ || passwort || "miwale";
if (!passwort) console.warn("BEWERTUNGEN_ADMIN_PASSWORT fehlt: die Verwaltungsseite bleibt gesperrt.");

const bewertungen = anwendungBauen({
  ordner,
  spiele: spieleAusKatalog(process.env.BEWERTUNGEN_KATALOG || KATALOG),
  passwort,
  salz
});
const ideen = ideenBauen({ ordner, passwort, salz });

http.createServer((req, res) => {
  if (req.url.startsWith("/api/ideen/") || req.url.split("?")[0] === "/api/ideen") return ideen(req, res);
  return bewertungen(req, res);
}).listen(port, "127.0.0.1", () => console.log("Dienste auf 127.0.0.1:" + port));
