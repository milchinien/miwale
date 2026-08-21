import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Devlog-Eintraege.
 *
 * Bewusst als Content Collection und nicht ueber eine API: die Eintraege
 * erzeugt ein Agent, und ein Agent kann git. Ein Commit ist damit gleichzeitig
 * Inhalt, Versionsstand und Audit-Spur – ohne Datenbank, ohne Backend.
 *
 * Das Schema ist die Qualitaetssicherung dafuer. Faellt ein generierter
 * Eintrag durch, schlaegt der BUILD fehl und die Seite bleibt heil, statt
 * die kaputte Datei still auszuliefern.
 */
const devlog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(3).max(120),
    /** Datum im Frontmatter als YYYY-MM-DD. */
    date: z.coerce.date(),
    /** Kurzfassung fuer Uebersicht und Meta-Description. */
    summary: z.string().min(20).max(300),
    tags: z.array(z.string()).default([]),
    /** Auf true gesetzt erscheint der Eintrag nirgends – fuer Entwuerfe. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { devlog };
