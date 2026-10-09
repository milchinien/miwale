/* Ausbau-Aufwand je Style aus Sicht von Claude (1 = leicht, 10 = sehr aufwändig):
   wie schwer es für Claude wäre, das Spiel in diesem Style auszubauen (neue Gegner, Boss, Waffen-Effekte, Shop-UI, mehr Deko).
   Gameplay ist style-unabhängig – bewertet wird nur, wie aufwändig neue Grafik per Code in dieser Technik ist. */
(function () {
  'use strict';
  window.StyleEffort = {
    cartoon: { stars: 3, why: 'Formen mit Kontur und Flächenfarbe sind für mich am natürlichsten – neue Gegner schnell gebaut, gut lesbar, viel Performance-Luft.' },
    voxel: { stars: 3, why: 'Neue Modelle sind 3D-Würfelraster, die ich sehr präzise beschreiben kann; der Renderer macht Licht und Schatten automatisch.' },
    nes8bit: { stars: 3, why: 'Kleine Sprites als Textraster; die strengen NES-Regeln helfen sogar, weil es weniger Entscheidungen gibt.' },
    crossstitch: { stars: 3, why: 'Funktioniert wie Pixel Art auf grobem Raster – neue Motive sind einfache Stichmuster.' },
    neon: { stars: 3, why: 'Linienzeichnungen plus Leuchten, neue Waffeneffekte passen perfekt ins Genre. Risiko: zu viele Effekte werden schnell bunt.' },
    kuerbisboy: { stars: 4, why: 'Winzige Sprites sind schnell gemacht, aber mit nur 4 Farben wird jeder neue Gegnertyp schwerer unterscheidbar.' },
    shadow: { stars: 4, why: 'Silhouetten sind einfach – viele Gegnertypen nur über ihre Form lesbar zu machen, braucht aber Nachdenken.' },
    chalk: { stars: 5, why: 'Der lockere Strich verzeiht Ungenauigkeit, aber jede Figur braucht mehrere „gezeichnete“ Varianten und der Boden ist rechenintensiv.' },
    harvest16: { stars: 5, why: 'Detaillierte 16-Bit-Sprites mit 4 Laufbildern als Textraster sind mühsame Kleinarbeit, besonders bei großen Bossen.' },
    lowpoly: { stars: 5, why: 'Dreiecksnetze per Koordinaten zu beschreiben ist fummeliger als Voxel, nach Einarbeitung aber berechenbar.' },
    clay: { stars: 5, why: 'Weiche Verlaufsformen sind gutmütig, aber damit es wirklich nach Knete aussieht, braucht jede Figur ein paar Durchgänge.' },
    popart: { stars: 5, why: 'Tuschekontur, Rasterpunkte und Farbversatz muss jedes neue Objekt einzeln bekommen; der Boden ist schon teuer.' },
    gothic: { stars: 6, why: 'Detaillierte Pixel-Sprites, und jedes neue Objekt muss ins Lichtsystem – dunkel und trotzdem lesbar ist eine Gratwanderung.' },
    linocut: { stars: 6, why: 'Weiße Schnittlinien in schwarzen Flächen sind pro Figur Feinarbeit; große Horden verschwimmen schon jetzt zu Schwarz.' },
    paper: { stars: 6, why: 'Gliederpuppen aus vielen Einzelteilen mit Klammern, Rand und Schatten; der Boden ist leistungshungrig.' },
    candy: { stars: 6, why: 'Glänzendes Material überzeugend zu machen kostet Iterationen, und mehr Inhalt kippt schnell ins Bonbon-Chaos.' },
    dusk: { stars: 7, why: 'Detailliertester Pixel-Style mit Randlicht, farbigem Licht und vielen Effekten – neue Assets auf diesem Niveau konsistent zu halten ist viel Arbeit.' },
    stainedglass: { stars: 7, why: 'Jede neue Figur muss sinnvoll in Glasstücke zerlegt werden und trotzdem lesbar bleiben; der Boden ist bereits unruhig.' },
    watercolor: { stars: 8, why: 'Malerische Qualität für jedes neue Asset braucht viele Runden; Performance war schon knapp und der Style lädt 1–3 s.' },
    vangogh: { stars: 8, why: 'Jedes Asset entsteht aus vielen Pinselstrichen; Lesbarkeit gegen den bewegten Boden ist schwer zu halten.' },
  };
  window.StyleEffort.render = function (n) {
    return '★'.repeat(n) + '☆'.repeat(10 - n);
  };
})();
