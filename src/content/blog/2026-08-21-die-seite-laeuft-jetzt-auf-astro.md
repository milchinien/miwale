---
title: "Die Seite läuft jetzt auf Astro"
date: 2026-08-21
summary: "Der erste Entwurf kam als Export aus Claude Design und lud React aus dem Netz nach. Jetzt ist es eine statische Seite — mit 24 statt 390 Kilobyte JavaScript."
tags: ["website", "astro", "performance"]
draft: false
---

Diese Seite entstand als Entwurf in Claude Design. Was dabei herauskommt, sieht
aus wie eine HTML-Datei, ist aber keine: Der Export enthält ein Template, das
erst im Browser von einer mitgelieferten Laufzeitumgebung mit React gerendert
wird. React kam dabei von einem fremden Server nach.

Dazu gab es zwei getrennte Dateien, eine für Desktop und eine fürs Handy. Beide
mussten von Hand gepflegt werden, und die Zahlen darin liefen bereits
auseinander.

## Was nicht stimmte

Beim Scrollen flackerte der Hintergrund, und einzelne Animationen blieben
gelegentlich stehen. Beides hatte dieselbe Wurzel.

Der Tiefenverlauf wurde pro Bild neu gerechnet, und dabei wurden rund zwanzig
Elemente einzeln angefasst. Zwischen diesen Schreibvorgängen standen
Messungen — und jede Messung nach einem Schreibvorgang zwingt den Browser, das
gesamte Layout sofort neu zu berechnen. Bei sechzig Bildern pro Sekunde reicht
das, um sichtbar ins Stocken zu geraten.

Das Steckenbleiben kam von einer zweiten Kollision: Auf denselben Elementen
liefen CSS-Animationen *und* wurden gleichzeitig Werte direkt gesetzt. CSS
gewinnt diesen Streit, die gesetzten Werte verpufften.

Im Code standen drei Notlösungen gegen die Symptome — ein Timer, der alle 700
Millisekunden nachbesserte, ein Sicherheitsnetz, das nach vier Sekunden
Text einblendete, der sonst unsichtbar geblieben wäre, und ein weicher Übergang
gegen kurzes Aufblitzen. Alle drei sind jetzt weg.

## Was jetzt läuft

Der ganze Ozean hängt an drei CSS-Variablen, die einmal pro Bild geschrieben
werden. Alle Ebenen leiten ihre Deckkraft und Bewegung selbst daraus ab. Zwei
Regeln halten das stabil: Messen und Schreiben sind getrennt, und kein Element
hat gleichzeitig eine CSS-Animation und einen gesetzten Wert.

Statt zweier Dateien gibt es eine Seite, die sich anpasst. Die Reiter sind
echte Adressen — jede Seite lässt sich verlinken.

Aus 390 Kilobyte JavaScript sind 24 geworden. Die Schriften liegen auf dem
eigenen Server. Beim Laden geht keine einzige Anfrage mehr an Dritte.

## Und dieser Eintrag

Der Devlog liegt als Markdown im selben Repository wie der Code. Jeder Eintrag
wird beim Bauen gegen ein Schema geprüft: Fehlt die Zusammenfassung oder ist
das Datum unbrauchbar, schlägt der Bau fehl und die Seite bleibt, wie sie war.

Von hier bis online sind es zwei Schritte. Ein Pull Request muss durch
Typprüfung, Bau und einen Test aller Seiten. Nach dem Zusammenführen baut die
Pipeline ein Container-Image, und der Server holt es sich innerhalb von fünf
Minuten selbst ab.

Dieser Eintrag ist der erste, der diesen Weg gegangen ist.
