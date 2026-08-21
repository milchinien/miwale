// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://miwale.com',
  // Statischer Export: die Seite braucht zur Laufzeit keinen Server.
  output: 'static',
  build: { format: 'directory' },
  // Kein Prefetch-Overkill – die Seite ist klein, aber die Tab-Navigation
  // soll sich sofort anfuehlen.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
