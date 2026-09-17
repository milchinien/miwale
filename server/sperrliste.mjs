// Startliste fuer den Wortfilter. Sie wird nur beim allerersten Start in den
// Datenordner kopiert; danach pflegt man sie auf der Verwaltungsseite (/admin),
// ohne neu zu deployen. Englisch und Deutsch, weil die Spieler aus beiden
// Richtungen kommen. Bewusst kurz: der Filter faengt das Grobe ab, der Rest
// wird im Nachhinein geloescht.
export const START_SPERRLISTE = [
  // Englisch
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "cunt",
  "asshole", "dick", "cock", "pussy", "whore", "slut", "retard", "retarded",
  "nigger", "nigga", "faggot", "fag", "kys", "killyourself",
  // Deutsch
  "scheisse", "arschloch", "fotze", "hurensohn", "hure", "wichser",
  "missgeburt", "spast", "spasti", "schwuchtel", "neger", "fick", "ficken", "fickt",
  "drecksau", "vollidiot", "behindert"
];
