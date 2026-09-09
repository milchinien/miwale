import { defineConfig } from "vite";
import { createServer } from "node:net";

// miwale bekommt einen eigenen Port. 5173 ist Vites Standard und damit belegt,
// sobald parallel ein anderes Projekt laeuft — Dropfall haengt dort seine
// Auswahlseite hin, das Spiel selbst auf 5274. 5310 kollidiert mit keinem davon.
const BASIS_PORT = 5310;

// Sucht ab dem Basis-Port die naechste freie Nummer. Vite wuerde das mit
// strictPort: false zwar auch tun, meldet den Sprung aber erst beim Start;
// so steht der Port fest, bevor der Server hochfaehrt.
async function freierPort(start, versuche = 40) {
  for (let port = start; port < start + versuche; port++) {
    if (await istFrei(port)) return port;
  }
  return start;
}

function istFrei(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, "0.0.0.0");
  });
}

export default defineConfig(async () => ({
  server: {
    host: "0.0.0.0",
    port: await freierPort(BASIS_PORT),
    // Nicht strikt: falls sich jemand zwischen Pruefung und Start
    // dazwischenschiebt, zaehlt Vite selbst weiter, statt abzubrechen.
    strictPort: false
  },
  preview: {
    host: "0.0.0.0",
    port: await freierPort(BASIS_PORT + 100),
    strictPort: false
  }
}));
