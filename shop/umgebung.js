// Einstellungen je Umgebung. Im Container ueberschreibt docker/40-dienste.sh
// diese Datei beim Start mit den Werten aus der Umgebung (SPIELE_ADRESSE).
// Lokal bleibt sie so: die Spiele laufen dann unter derselben Adresse.
window.MIWALE_UMGEBUNG = { spieleAdresse: "" };
