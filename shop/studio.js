// miwale Studio: eigene Browserspiele hochladen, die Store-Seite gestalten und
// zur Pruefung einreichen -- aufgebaut wie Steamworks. Die Daten und alle
// Pruefungen macht der Server (server/studio.mjs, /api/studio/); hier ist nur
// die Oberflaeche.
//
//   /studio          Uebersicht: eigene Projekte, "Neues Spiel"
//   /studio/<id>     Editor mit Schritten (Seitenleiste) und Checkliste
//
// shop.js baut die Seite und ruft MIWALE_STUDIO.einbauen(platz, sprache, { id }).
// Gespeichert wird automatisch (nur die geaenderten Teile, kurz nach dem Tippen)
// oder mit dem Knopf. Waehrend der Pruefung ist alles schreibgeschuetzt.
(() => {
  "use strict";

  const API = "/api/studio/";
  const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
  const SCHRITTE = ["uebersicht", "seite", "grafiken", "inhalt", "rechte", "technik", "build", "veroeffentlichung", "vorschau"];
  // Welcher Teil der Checkliste (server: checkliste().schritte) zu welchem Schritt gehoert.
  const PRUEFTEIL = { seite: "seite", grafiken: "grafiken", inhalt: "inhalt", rechte: "rechte", technik: "technik", build: "build", veroeffentlichung: "datum" };
  const BILDER = ["icon", "header", "kapsel", "kapselKlein", "kapselHoch"];
  const BILD_TYPEN = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const VIDEO_TYPEN = ["video/mp4", "video/webm"];
  const SPEICHERN_NACH_MS = 900;

  const TEXTE = {
    de: {
      titel: "miwale Studio",
      heldTitel: "Veröffentliche dein Browserspiel auf miwale.com",
      heldText: "Lade deinen Web-Export hoch, gestalte die Store-Seite wie bei Steam und reiche alles zur Prüfung ein. Nach der Freigabe steht dein Spiel neben den anderen auf miwale.com – kostenlos.",
      laedt: "Wird geladen …",
      anmeldenTitel: "Melde dich an, um das Studio zu nutzen",
      anmeldenText: "Für das Studio brauchst du ein miwale-Konto. Anmelden geht mit Discord, Google oder E-Mail.",
      anmelden: "Anmelden",
      kontoGesperrt: "Dein Konto ist gesperrt. Im Studio kannst du gerade nichts ändern.",
      zuTitel: "Das Studio ist gerade geschlossen",
      zuText: "Neue Spiele, Uploads und Einreichungen gehen im Moment nicht. Deine Projekte kannst du weiter ansehen.",
      neuesSpiel: "Neues Spiel",
      neuName: "Wie heißt dein Spiel?",
      neuHilfe: "Den Namen kannst du später noch ändern.",
      anlegen: "Anlegen",
      abbrechen: "Abbrechen",
      meineSpiele: "Deine Spiele",
      keineSpiele: "Noch keine Spiele. Leg mit „Neues Spiel“ los.",
      grenze: (n, max) => n + " von " + max + " Projekten",
      grenzeErreicht: "Du hast die Höchstzahl an Projekten erreicht.",
      bereit: "Bereit zum Einreichen",
      unfertig: "Noch nicht vollständig",
      geaendert: (d) => "Geändert " + d,
      status: { entwurf: "Entwurf", eingereicht: "In Prüfung", abgelehnt: "Änderungen nötig", freigegeben: "Freigegeben", gesperrt: "Gesperrt" },
      live: "Live",
      ablaufTitel: "So funktioniert's",
      ablauf: [
        ["Store-Seite gestalten", "Name, Texte, Bilder, Screenshots und ein Trailer – so wie bei Steam."],
        ["Angaben machen", "Inhalte und Altersempfehlung, Datenschutz, Rechte und Technik."],
        ["Build hochladen", "Ein ZIP mit deinem Web-Export. Du kannst ihn sofort testen."],
        ["Einreichen und veröffentlichen", "Wir prüfen Store-Seite und Build. Nach der Freigabe stellst du dein Spiel selbst live."]
      ],
      studio: "Studio",
      schritte: { uebersicht: "Übersicht", seite: "Store-Seite", grafiken: "Grafiken", inhalt: "Inhalte & Altersfreigabe", rechte: "Datenschutz & Rechte", technik: "Technik", build: "Build", veroeffentlichung: "Veröffentlichung", vorschau: "Vorschau" },
      speichern: "Speichern",
      stand: { gespeichert: "Alles gespeichert", offen: "Nicht gespeichert", speichert: "Speichert …", fehler: "Nicht gespeichert" },
      nurLesen: "Dein Spiel wird gerade geprüft. Bis zum Ergebnis kannst du nichts ändern. Wenn du doch noch etwas ändern willst, zieh die Einreichung in der Übersicht zurück.",
      gesperrt: (g) => "Die Verwaltung hat dieses Spiel gesperrt." + (g ? " Grund: " + g : ""),
      liveHinweis: "Dein Spiel ist live. Was du hier änderst, ist ein neuer Entwurf und geht erst nach erneuter Prüfung und Veröffentlichung live.",
      nichtGefunden: "Dieses Projekt gibt es nicht (mehr).",
      zurUebersicht: "Zur Übersicht",
      // Uebersicht
      checkTitel: "Vor der Veröffentlichung",
      checkText: "Hak alles ab, dann kannst du dein Spiel zur Prüfung einreichen.",
      check: {
        seite: ["Store-Seite fertigstellen", "Texte, Genre, Tags, Sprachen, Geräte und Grafiken."],
        inhalt: ["Inhalte & Altersfreigabe", "Den Fragebogen ausfüllen."],
        rechte: ["Datenschutz & Rechte", "Rechte bestätigen, bei Datenerhebung ein Datenschutzhinweis."],
        technik: ["Technische Angaben", "Engine und Eingabe."],
        build: ["Build hochladen", "Ein ZIP mit index.html, im Test lauffähig."],
        datum: ["Datum festlegen", "Sofort nach der Freigabe oder an einem bestimmten Tag."],
        einreichen: ["Zur Prüfung einreichen", "Store-Seite und Build werden einzeln geprüft."],
        veroeffentlichen: ["Veröffentlichen", "Nach der Freigabe stellst du das Spiel selbst live."]
      },
      fehlt: "Fehlt: ",
      bearbeiten: "Bearbeiten",
      adresseTitel: "Adresse im Shop",
      adresseHilfe: "Kleinbuchstaben, Ziffern und Bindestriche, 3–40 Zeichen. Frühere Adressen bleiben für dich reserviert.",
      aendern: "Ändern",
      pruefungTitel: "Prüfung",
      pruefSeite: "Store-Seite",
      pruefBuild: "Build",
      pruef: { ok: "In Ordnung", abgelehnt: "Braucht Änderungen", offen: "Noch offen" },
      pruefNachricht: "Nachricht der Prüfung",
      einreichenTitel: "Zur Prüfung einreichen",
      einreichenText: "Store-Seite und Build werden einzeln geprüft. Bis zum Ergebnis ist der Entwurf schreibgeschützt.",
      einreichenUnfertig: "Erst wenn die Checkliste vollständig ist, kannst du einreichen.",
      notiz: "Notiz an die Prüfung (optional)",
      notizHilfe: "z. B. was neu ist oder wie man das Spiel am besten testet.",
      einreichen: "Einreichen",
      eingereichtAm: (d) => "Eingereicht am " + d + ". Wir schauen es uns so bald wie möglich an.",
      zurueckziehen: "Einreichung zurückziehen",
      freigegebenText: "Freigegeben! Mit einem Klick geht dein Spiel live.",
      freigegebenDatum: (d) => "Freigegeben! Nach dem Veröffentlichen steht es bis zum " + d + " als „Demnächst“ im Shop.",
      veroeffentlichen: "Jetzt veröffentlichen",
      veroeffentlichenFrage: "Jetzt veröffentlichen? Die freigegebene Fassung ersetzt dann, was bisher live war.",
      liveTitel: "Live auf miwale.com",
      liveSeit: (d) => "Live seit " + d,
      spielseite: "Spielseite ansehen",
      ausKatalog: "Aus dem Shop nehmen",
      ausKatalogFrage: "Spiel aus dem Shop nehmen? Es ist dann nicht mehr zu sehen, bis du wieder etwas veröffentlichst.",
      verlaufTitel: "Verlauf",
      verlauf: { angelegt: "Projekt angelegt", build: "Build hochgeladen", eingereicht: "Zur Prüfung eingereicht", zurueckgezogen: "Einreichung zurückgezogen", freigegeben: "Freigegeben", abgelehnt: "Änderungen nötig", veroeffentlicht: "Veröffentlicht", "update-veroeffentlicht": "Update veröffentlicht", "aus-dem-katalog": "Aus dem Shop genommen", gesperrt: "Gesperrt", entsperrt: "Entsperrt" },
      loeschenTitel: "Projekt löschen",
      loeschenText: "Löscht Store-Seite, Bilder und Builds. Ein veröffentlichtes Spiel verschwindet aus dem Shop.",
      loeschen: "Projekt löschen",
      loeschenFrage: (n) => "„" + n + "“ wirklich löschen? Das lässt sich nicht rückgängig machen.",
      // Store-Seite
      seiteIntro: "Das steht auf deiner Spielseite. Schreib so, dass jemand in zehn Sekunden versteht, worum es geht.",
      felder: {
        name: ["Name", "So heißt das Spiel im Shop."],
        kurz: ["Kurzbeschreibung", "Ein bis zwei Sätze, die neugierig machen. Mindestens 20 Zeichen."],
        lang: ["Beschreibung", "Erzähl mehr über dein Spiel. Absätze trennst du mit einer Leerzeile. Mindestens 100 Zeichen."],
        genre: ["Genre", ""],
        tags: ["Tags", "Enter oder Komma fügt einen Tag hinzu. Höchstens 10."],
        sprachen: ["Sprachen", "In welchen Sprachen kann man das Spiel spielen?"],
        features: ["Features", "Ein Feature pro Zeile, höchstens 12. Steht als Liste unter „Das erwartet dich“."],
        steuerung: ["Steuerung", "Wie spielt man? z. B. „Pfeiltasten zum Laufen, Leertaste zum Springen“."],
        geraete: ["Geräte", "Worauf läuft das Spiel gut?"],
        entwickler: ["Entwickler- oder Studioname", "Leer lassen, dann steht dein Kontoname da."],
        webseite: ["Webseite", "Optional, mit https://"]
      },
      genreWaehlen: "Bitte wählen",
      tagNeu: "Tag eingeben …",
      tagWeg: (x) => x + " entfernen",
      pc: "PC (Maus/Tastatur)",
      handy: "Handy (Touch)",
      // Grafiken
      grafikenIntro: "Bilder als PNG, JPEG, WebP oder GIF. Die empfohlenen Größen sind dieselben wie bei Steam – so sieht alles scharf aus.",
      medien: {
        icon: ["Icon", "Quadratisch. Erscheint in Bibliothek und Listen."],
        header: ["Header", "Oben rechts auf der Spielseite und in der Liste aller Spiele."],
        kapsel: ["Hauptkapsel", "Das große Bild für Highlights und Vorschauen."],
        kapselKlein: ["Kleine Kapsel", "Für kleine Kacheln."],
        kapselHoch: ["Hohe Kapsel", "Hochformat für die Reihe „Beliebt & neu“."],
        screen: ["Screenshots", "Mindestens 3, höchstens 12. Szenen aus dem Spiel, keine Logos. Der erste ist das Vorschaubild."],
        trailer: ["Trailer", "MP4 oder WebM. Läuft stumm oben auf der Spielseite."]
      },
      empfohlen: (b, h) => "Empfohlen: " + b + " × " + h + " px",
      pflicht: "Pflicht",
      optional: "Optional",
      empfohlenMarke: "Empfohlen",
      bildWaehlen: "Bild wählen",
      ersetzen: "Ersetzen",
      entfernen: "Entfernen",
      screensHinzu: "Screenshots hinzufügen",
      videoWaehlen: "Video wählen",
      nachVorn: "Nach vorn",
      nachHinten: "Nach hinten",
      keinBild: "Noch kein Bild",
      keinVideo: "Noch kein Video",
      laedtHoch: (p) => "Wird hochgeladen … " + p + " %",
      verarbeitet: "Wird verarbeitet …",
      masse: (w, h, b, hh) => "Dein Bild ist " + w + " × " + h + " px, empfohlen sind " + b + " × " + hh + ".",
      masseFormat: " Das Seitenverhältnis passt nicht – es wird zugeschnitten.",
      masseKlein: " Es ist kleiner und kann unscharf wirken.",
      bildGross: (mb) => "Das Bild ist größer als " + mb + " MB.",
      videoGross: (mb) => "Das Video ist größer als " + mb + " MB.",
      bildTyp: "Bitte ein PNG, JPEG, WebP oder GIF wählen.",
      videoTyp: "Bitte ein MP4- oder WebM-Video wählen.",
      screensZahl: (n, max) => n + " von " + max,
      // Inhalte
      inhaltIntro: "Beantworte jede Frage ehrlich. Daraus ergibt sich die Altersempfehlung und die Inhaltshinweise auf der Spielseite. Das ist eine Selbstauskunft, keine offizielle USK-Prüfung.",
      fragen: {
        gewalt: ["Gibt es Gewalt?", { nein: "Nein", comic: "Comichaft, ohne Verletzungen", fantasie: "Gegen Fantasiewesen oder unrealistisch", realistisch: "Realistisch, gegen Menschen" }],
        blut: ["Ist Blut zu sehen?", { nein: "Nein", wenig: "Ein wenig", viel: "Viel oder detailliert" }],
        horror: ["Gibt es Horror oder Schockmomente?", { nein: "Nein", leicht: "Leichter Grusel", stark: "Starker Horror" }],
        sexuell: ["Gibt es sexuelle Inhalte?", { nein: "Nein", andeutungen: "Andeutungen, knappe Kleidung", nacktheit: "Nacktheit oder sexuelle Handlungen" }],
        sprache: ["Gibt es grobe Sprache?", { nein: "Nein", mild: "Milde Ausdrücke", grob: "Flüche, Beleidigungen" }],
        drogen: ["Kommen Drogen, Alkohol oder Tabak vor?", { nein: "Nein", ja: "Ja" }],
        gluecksspiel: ["Gibt es Glücksspiel?", { nein: "Nein", simuliert: "Ja, simuliert (ohne echtes Geld)" }],
        mikrotransaktionen: ["Kann man im Spiel echtes Geld ausgeben?", { nein: "Nein", ja: "Ja (Mikrotransaktionen, Lootboxen …)" }],
        ki: ["Enthält das Spiel KI-generierte Inhalte?", { nein: "Nein", ja: "Ja (Bilder, Musik, Texte, Stimmen …)" }],
        multiplayer: ["Gibt es Online-Multiplayer?", { nein: "Nein", ja: "Ja" }],
        chat: ["Können Spieler miteinander schreiben oder sprechen?", { nein: "Nein", ja: "Ja" }],
        daten: ["Sammelt das Spiel Daten über Spieler?", { nein: "Nein", ja: "Ja (Konten, Analytics, Werbung …)" }]
      },
      fragenHilfe: {
        gewalt: "Auch Kämpfe gegen Monster zählen.",
        daten: "Speichern im Browser (localStorage) zählt nicht. Server, Analytics, Werbung oder Konten schon."
      },
      kiText: ["Was ist KI-generiert?", "z. B. „Hintergrundmusik und einige Bilder, mit Werkzeug X erstellt“. Mindestens 10 Zeichen."],
      datenWeiter: "Weil das Spiel Daten sammelt, brauchst du unter „Datenschutz & Rechte“ einen Datenschutzhinweis.",
      hinweise: ["Weitere Inhaltshinweise (optional)", "Steht auf der Spielseite, z. B. „Flackernde Lichter“."],
      alterEigen: ["Höher einstufen (optional)", "Du kannst dein Spiel strenger einstufen, nicht milder."],
      alterKeine: "Nicht höher als empfohlen",
      ab: (a) => "ab " + a,
      empfehlung: "Altersempfehlung",
      selbst: "Selbstauskunft",
      keineHinweise: "Keine besonderen Inhaltshinweise.",
      offeneFragen: (n) => n === 1 ? "Noch 1 Frage offen." : "Noch " + n + " Fragen offen.",
      // Rechte
      datenschutzTitel: "Datenschutz",
      datenNein: "Laut Fragebogen sammelt dein Spiel keine Daten über Spieler. Dann brauchst du hier nichts einzutragen.",
      datenOffen: "Beantworte zuerst unter „Inhalte & Altersfreigabe“, ob dein Spiel Daten sammelt.",
      datenJa: "Dein Spiel sammelt Daten. Erkläre kurz, welche, wozu und wer sie bekommt, und verlinke deine Datenschutzerklärung. Beides steht auf der Spielseite.",
      datenText: ["Datenschutzhinweis", "Mindestens 20 Zeichen."],
      datenschutzUrl: ["Link zur Datenschutzerklärung", "Mit https://"],
      rechteTitel: "Rechte",
      rechteText: "Ich habe die Rechte an allem in diesem Spiel – Musik, Bilder, Code und Schriften. Was nicht von mir ist, darf ich nutzen und habe es unten mit Lizenz angegeben.",
      bestaetigtAm: (d) => "Bestätigt am " + d,
      lizenzen: ["Lizenzen und Quellen", "z. B. „Musik: Kevin MacLeod (CC BY 4.0)“, „Schrift: Inter (OFL)“, „Engine: Godot (MIT)“."],
      // Technik
      technikIntro: "Damit Spieler wissen, was sie erwartet – und wir beim Prüfen.",
      engine: ["Engine", ""],
      engines: { unity: "Unity", godot: "Godot", phaser: "Phaser", three: "three.js", pixi: "PixiJS", construct: "Construct", gamemaker: "GameMaker", defold: "Defold", pico8: "PICO-8", html: "Eigenes HTML/JavaScript", andere: "Andere" },
      eingabe: ["Eingabe", "Womit spielt man?"],
      eingaben: { maus: "Maus", tastatur: "Tastatur", touch: "Touch", gamepad: "Gamepad" },
      format: ["Format", "In welchem Seitenverhältnis läuft das Spiel?"],
      formate: { "16:9": "16:9 quer", "4:3": "4:3", "1:1": "1:1 quadratisch", hoch: "Hochformat", frei: "Passt sich an" },
      internet: "Braucht eine Internetverbindung während des Spielens",
      speichernBrowser: "Speichert den Spielstand im Browser",
      technikHinweise: ["Hinweise (optional)", "z. B. „Läuft am besten in Chrome“ oder „Kopfhörer empfohlen“."],
      anleitungTitel: "So exportierst du fürs Web",
      anleitung: [
        ["Unity (WebGL)", "Kompression Gzip oder Brotli mit „Decompression Fallback“ – oder Brotli ohne Fallback, beides läuft hier. Das Standard-Template reicht."],
        ["Godot 4", "Web-Export ohne Threads („Thread Support“ aus). Spiele mit Threads brauchen besondere Server-Köpfe, die es hier nicht gibt."],
        ["Relative Pfade", "src=\"Build/game.js\" statt src=\"/Build/game.js\". Absolute Pfade zeigen nach dem Hochladen ins Leere."],
        ["index.html im ZIP", "Die index.html liegt ganz oben im ZIP oder in genau einem Ordner. Alles, was das Spiel braucht, gehört mit hinein."],
        ["Keine fremden Server", "Nichts über http:// laden. Was das Spiel zum Laufen braucht, kommt ins ZIP."]
      ],
      // Build
      buildIntro: (mb) => "Lade deinen Web-Export als ZIP hoch (höchstens " + mb + " MB). Danach kannst du ihn sofort im Browser testen.",
      buildsAus: "Uploads gehen erst, wenn die Spiele-Adresse (play.miwale.com) eingerichtet ist. Alles andere kannst du schon vorbereiten.",
      zipWaehlen: "ZIP wählen",
      buildNotiz: "Notiz zum Build (optional)",
      buildNotizPlatz: "z. B. Version 1.2",
      hochladen: "Hochladen",
      entpacken: "Wird entpackt und geprüft …",
      zuGross: (mb) => "Die Datei ist größer als " + mb + " MB.",
      keinZip: "Bitte eine .zip-Datei wählen.",
      buildsTitel: "Deine Builds",
      keineBuilds: "Noch kein Build hochgeladen.",
      aktiv: "Aktiv",
      aktivText: "Wird mit der nächsten Einreichung geprüft.",
      verwenden: "Diesen verwenden",
      testen: "Testen",
      inPruefung: "In Prüfung",
      dateien: (n) => n + (n === 1 ? " Datei" : " Dateien"),
      entpackt: (g) => g + " entpackt",
      buildLoeschenFrage: "Diesen Build löschen?",
      bericht: {
        "absolute-pfade": "Die index.html lädt Dateien mit absoluten Pfaden (/…). Die gehen hier ins Leere – nimm relative Pfade.",
        "http-quellen": "Es werden Dateien über http:// geladen. Das blockiert der Browser – nimm https:// oder pack sie ins ZIP.",
        "engine-unity": "Unity-Build erkannt.",
        "engine-godot": "Godot-Build erkannt.",
        threads: "Das Spiel nutzt Threads (SharedArrayBuffer). Das läuft hier nicht – exportiere ohne Threads.",
        "kein-viewport": "Kein <meta name=\"viewport\"> gefunden. Auf dem Handy wird das Spiel dann sehr klein.",
        "index-unlesbar": "Die index.html ließ sich nicht lesen."
      },
      // Veroeffentlichung
      veroeffIntro: "Wann soll dein Spiel erscheinen? Das gilt, sobald es freigegeben ist und du auf „Veröffentlichen“ klickst.",
      sofort: ["Sofort nach der Freigabe", "Dein Spiel erscheint, sobald du es veröffentlichst."],
      datum: ["An einem bestimmten Tag", "Bis dahin steht das Spiel als „Demnächst“ im Shop, mit Datum."],
      datumLabel: "Erscheinungstag",
      // Vorschau
      vorschauHinweis: "So sieht deine Store-Seite auf miwale.com aus (Entwurf). „Jetzt spielen“ öffnet den aktiven Build in einem neuen Tab.",
      keinBuildTest: "Lade zuerst einen Build hoch, dann kannst du ihn hier testen.",
      platzhalter: "Bild fehlt",
      // Felder in der Checkliste
      feldnamen: {
        name: "Name", kurz: "Kurzbeschreibung (mind. 20 Zeichen)", lang: "Beschreibung (mind. 100 Zeichen)", genre: "Genre", tags: "Tags",
        sprachen: "Sprachen", geraete: "Geräte", icon: "Icon", header: "Header", kapsel: "Hauptkapsel", screens: "3 Screenshots",
        gewalt: "Gewalt", blut: "Blut", horror: "Horror", sexuell: "Sexuelle Inhalte", sprache: "Sprache", drogen: "Drogen",
        gluecksspiel: "Glücksspiel", mikrotransaktionen: "Echtgeld-Käufe", ki: "KI-Inhalte", multiplayer: "Multiplayer", chat: "Chat",
        daten: "Nutzerdaten", kiText: "Beschreibung der KI-Inhalte", rechte: "Bestätigung der Rechte", datenText: "Datenschutzhinweis",
        datenschutzUrl: "Link zur Datenschutzerklärung", engine: "Engine", eingabe: "Eingabe", build: "Aktiver Build", datum: "Datum"
      },
      zeichen: (n, max) => n + " / " + max,
      fehler: {
        anmelden: "Bitte melde dich neu an.",
        "konto-gesperrt": "Dein Konto ist gesperrt.",
        "studio-zu": "Das Studio ist gerade geschlossen.",
        "zu-viele-projekte": "Du hast die Höchstzahl an Projekten erreicht.",
        "nicht-gefunden": "Das gibt es nicht (mehr).",
        "in-pruefung": "Dein Spiel wird gerade geprüft. Zieh die Einreichung zurück, um etwas zu ändern.",
        name: "Der Name braucht 2 bis 60 Zeichen.",
        url: "Bitte eine vollständige Adresse mit https:// eingeben.",
        woerter: "Hier steht ein Wort, das auf miwale nicht erlaubt ist.",
        feld: "Zu lang oder ungültig.",
        art: "Unbekannte Bildart.",
        "zu-viele-screens": "Höchstens 12 Screenshots.",
        "bild-format": "Das ist kein PNG, JPEG, WebP oder GIF.",
        "video-format": "Das ist kein MP4- oder WebM-Video.",
        "zu-gross": "Die Datei ist zu groß.",
        "keine-spiele-adresse": "Uploads gehen erst, wenn die Spiele-Adresse eingerichtet ist.",
        "zu-schnell": "Zu viele Anfragen. Bitte kurz warten.",
        "zip-kaputt": "Das ZIP ist beschädigt oder kein ZIP.",
        "zip-leer": "Das ZIP ist leer.",
        "keine-index-html": "Im ZIP fehlt die index.html (ganz oben oder in genau einem Ordner).",
        "pfad-verboten": "Das ZIP enthält unerlaubte Pfade (.. oder absolute Pfade).",
        "zip-verschluesselt": "Verschlüsselte ZIPs gehen nicht.",
        "zip-verfahren": "Das ZIP nutzt eine Kompression, die wir nicht kennen. Bitte normal (Deflate) packen.",
        "zip-bombe": "Das ZIP ist verdächtig stark komprimiert.",
        "zip-doppelt": "Das ZIP enthält Dateien doppelt.",
        "zu-viele-dateien": "Das ZIP enthält zu viele Dateien (höchstens 5000).",
        "zu-gross-entpackt": "Entpackt ist das Spiel zu groß.",
        "slug-vergeben": "Diese Adresse ist schon vergeben oder nicht erlaubt.",
        slug: "Nur Kleinbuchstaben, Ziffern und Bindestriche, 3–40 Zeichen.",
        build: "Diesen Build gibt es nicht mehr.",
        "build-in-benutzung": "Dieser Build ist live oder in Prüfung und kann nicht gelöscht werden.",
        datum: "Bitte ein gültiges Datum wählen (höchstens zwei Jahre im Voraus).",
        "projekt-gesperrt": "Dieses Spiel ist gesperrt.",
        "schon-eingereicht": "Das Spiel ist schon eingereicht.",
        unvollstaendig: "Die Checkliste ist noch nicht vollständig.",
        notiz: "Die Notiz ist zu lang.",
        "nicht-eingereicht": "Das Spiel ist gerade nicht eingereicht.",
        "nicht-freigegeben": "Das Spiel ist noch nicht freigegeben.",
        "nicht-live": "Das Spiel ist gerade nicht live.",
        herkunft: "Die Anfrage kam von einer anderen Seite.",
        netz: "Keine Verbindung zum Server. Bitte noch einmal versuchen.",
        allgemein: "Das hat nicht geklappt. Bitte noch einmal versuchen."
      }
    },
    en: {
      titel: "miwale Studio",
      heldTitel: "Publish your browser game on miwale.com",
      heldText: "Upload your web export, build a store page like on Steam and submit it for review. Once approved, your game sits next to the others on miwale.com – for free.",
      laedt: "Loading…",
      anmeldenTitel: "Sign in to use the Studio",
      anmeldenText: "You need a miwale account for the Studio. Sign in with Discord, Google or email.",
      anmelden: "Sign in",
      kontoGesperrt: "Your account is blocked. You can't change anything in the Studio right now.",
      zuTitel: "The Studio is closed right now",
      zuText: "New games, uploads and submissions are paused. You can still look at your projects.",
      neuesSpiel: "New game",
      neuName: "What's your game called?",
      neuHilfe: "You can change the name later.",
      anlegen: "Create",
      abbrechen: "Cancel",
      meineSpiele: "Your games",
      keineSpiele: "No games yet. Start with “New game”.",
      grenze: (n, max) => n + " of " + max + " projects",
      grenzeErreicht: "You've reached the maximum number of projects.",
      bereit: "Ready to submit",
      unfertig: "Not complete yet",
      geaendert: (d) => "Changed " + d,
      status: { entwurf: "Draft", eingereicht: "In review", abgelehnt: "Changes needed", freigegeben: "Approved", gesperrt: "Blocked" },
      live: "Live",
      ablaufTitel: "How it works",
      ablauf: [
        ["Design the store page", "Name, texts, images, screenshots and a trailer – just like on Steam."],
        ["Fill in the details", "Content and age rating, privacy, rights and tech."],
        ["Upload a build", "A ZIP of your web export. You can test it right away."],
        ["Submit and publish", "We review store page and build. Once approved, you put your game live yourself."]
      ],
      studio: "Studio",
      schritte: { uebersicht: "Overview", seite: "Store page", grafiken: "Graphics", inhalt: "Content & age rating", rechte: "Privacy & rights", technik: "Tech", build: "Build", veroeffentlichung: "Release", vorschau: "Preview" },
      speichern: "Save",
      stand: { gespeichert: "All saved", offen: "Not saved", speichert: "Saving…", fehler: "Not saved" },
      nurLesen: "Your game is being reviewed. You can't change anything until there's a result. To change something anyway, withdraw the submission in the overview.",
      gesperrt: (g) => "This game was blocked by the admins." + (g ? " Reason: " + g : ""),
      liveHinweis: "Your game is live. What you change here is a new draft and only goes live after another review and publish.",
      nichtGefunden: "This project doesn't exist (anymore).",
      zurUebersicht: "Back to overview",
      checkTitel: "Before release",
      checkText: "Tick everything off, then you can submit your game for review.",
      check: {
        seite: ["Finish the store page", "Texts, genre, tags, languages, devices and graphics."],
        inhalt: ["Content & age rating", "Fill in the questionnaire."],
        rechte: ["Privacy & rights", "Confirm the rights; a privacy notice if you collect data."],
        technik: ["Technical details", "Engine and input."],
        build: ["Upload a build", "A ZIP with index.html that runs in the test."],
        datum: ["Set a date", "Right after approval or on a specific day."],
        einreichen: ["Submit for review", "Store page and build are reviewed separately."],
        veroeffentlichen: ["Publish", "Once approved, you put the game live yourself."]
      },
      fehlt: "Missing: ",
      bearbeiten: "Edit",
      adresseTitel: "Address in the shop",
      adresseHilfe: "Lowercase letters, digits and hyphens, 3–40 characters. Earlier addresses stay reserved for you.",
      aendern: "Change",
      pruefungTitel: "Review",
      pruefSeite: "Store page",
      pruefBuild: "Build",
      pruef: { ok: "OK", abgelehnt: "Needs changes", offen: "Pending" },
      pruefNachricht: "Message from the review",
      einreichenTitel: "Submit for review",
      einreichenText: "Store page and build are reviewed separately. Until there's a result, the draft is read-only.",
      einreichenUnfertig: "You can submit once the checklist is complete.",
      notiz: "Note for the review (optional)",
      notizHilfe: "e.g. what's new or how best to test the game.",
      einreichen: "Submit",
      eingereichtAm: (d) => "Submitted on " + d + ". We'll look at it as soon as we can.",
      zurueckziehen: "Withdraw submission",
      freigegebenText: "Approved! One click and your game is live.",
      freigegebenDatum: (d) => "Approved! After publishing it shows as “Coming soon” until " + d + ".",
      veroeffentlichen: "Publish now",
      veroeffentlichenFrage: "Publish now? The approved version replaces whatever was live before.",
      liveTitel: "Live on miwale.com",
      liveSeit: (d) => "Live since " + d,
      spielseite: "View game page",
      ausKatalog: "Take out of the shop",
      ausKatalogFrage: "Take the game out of the shop? It won't be visible until you publish again.",
      verlaufTitel: "History",
      verlauf: { angelegt: "Project created", build: "Build uploaded", eingereicht: "Submitted for review", zurueckgezogen: "Submission withdrawn", freigegeben: "Approved", abgelehnt: "Changes needed", veroeffentlicht: "Published", "update-veroeffentlicht": "Update published", "aus-dem-katalog": "Taken out of the shop", gesperrt: "Blocked", entsperrt: "Unblocked" },
      loeschenTitel: "Delete project",
      loeschenText: "Deletes store page, images and builds. A published game disappears from the shop.",
      loeschen: "Delete project",
      loeschenFrage: (n) => "Really delete “" + n + "”? This can't be undone.",
      seiteIntro: "This is what your game page shows. Write it so someone gets what it's about in ten seconds.",
      felder: {
        name: ["Name", "The game's name in the shop."],
        kurz: ["Short description", "One or two sentences that make people curious. At least 20 characters."],
        lang: ["Description", "Tell more about your game. Separate paragraphs with an empty line. At least 100 characters."],
        genre: ["Genre", ""],
        tags: ["Tags", "Enter or comma adds a tag. Up to 10."],
        sprachen: ["Languages", "Which languages can the game be played in?"],
        features: ["Features", "One feature per line, up to 12. Shown as a list under “Features”."],
        steuerung: ["Controls", "How do you play? e.g. “Arrow keys to move, space to jump”."],
        geraete: ["Devices", "What does the game run well on?"],
        entwickler: ["Developer or studio name", "Leave empty to show your account name."],
        webseite: ["Website", "Optional, with https://"]
      },
      genreWaehlen: "Please choose",
      tagNeu: "Type a tag…",
      tagWeg: (x) => "Remove " + x,
      pc: "PC (mouse/keyboard)",
      handy: "Phone (touch)",
      grafikenIntro: "Images as PNG, JPEG, WebP or GIF. The recommended sizes are the same as on Steam – so everything looks sharp.",
      medien: {
        icon: ["Icon", "Square. Shown in the library and in lists."],
        header: ["Header", "Top right on the game page and in the list of all games."],
        kapsel: ["Main capsule", "The large image for highlights and previews."],
        kapselKlein: ["Small capsule", "For small tiles."],
        kapselHoch: ["Vertical capsule", "Portrait format for the “Popular & new” row."],
        screen: ["Screenshots", "At least 3, up to 12. Scenes from the game, no logos. The first one is the preview image."],
        trailer: ["Trailer", "MP4 or WebM. Plays muted at the top of the game page."]
      },
      empfohlen: (b, h) => "Recommended: " + b + " × " + h + " px",
      pflicht: "Required",
      optional: "Optional",
      empfohlenMarke: "Recommended",
      bildWaehlen: "Choose image",
      ersetzen: "Replace",
      entfernen: "Remove",
      screensHinzu: "Add screenshots",
      videoWaehlen: "Choose video",
      nachVorn: "Move forward",
      nachHinten: "Move back",
      keinBild: "No image yet",
      keinVideo: "No video yet",
      laedtHoch: (p) => "Uploading… " + p + " %",
      verarbeitet: "Processing…",
      masse: (w, h, b, hh) => "Your image is " + w + " × " + h + " px, recommended is " + b + " × " + hh + ".",
      masseFormat: " The aspect ratio doesn't match – it will be cropped.",
      masseKlein: " It's smaller and may look blurry.",
      bildGross: (mb) => "The image is larger than " + mb + " MB.",
      videoGross: (mb) => "The video is larger than " + mb + " MB.",
      bildTyp: "Please choose a PNG, JPEG, WebP or GIF.",
      videoTyp: "Please choose an MP4 or WebM video.",
      screensZahl: (n, max) => n + " of " + max,
      inhaltIntro: "Answer every question honestly. This gives the age rating and the content notes on the game page. It's self-declared, not an official rating.",
      fragen: {
        gewalt: ["Is there violence?", { nein: "No", comic: "Cartoon-like, no injuries", fantasie: "Against fantasy creatures or unrealistic", realistisch: "Realistic, against humans" }],
        blut: ["Is there blood?", { nein: "No", wenig: "A little", viel: "A lot or detailed" }],
        horror: ["Is there horror or jump scares?", { nein: "No", leicht: "Mildly spooky", stark: "Strong horror" }],
        sexuell: ["Is there sexual content?", { nein: "No", andeutungen: "Suggestive, revealing clothes", nacktheit: "Nudity or sexual acts" }],
        sprache: ["Is there strong language?", { nein: "No", mild: "Mild expressions", grob: "Swearing, insults" }],
        drogen: ["Are drugs, alcohol or tobacco shown?", { nein: "No", ja: "Yes" }],
        gluecksspiel: ["Is there gambling?", { nein: "No", simuliert: "Yes, simulated (no real money)" }],
        mikrotransaktionen: ["Can players spend real money in the game?", { nein: "No", ja: "Yes (microtransactions, loot boxes…)" }],
        ki: ["Does the game contain AI-generated content?", { nein: "No", ja: "Yes (images, music, text, voices…)" }],
        multiplayer: ["Is there online multiplayer?", { nein: "No", ja: "Yes" }],
        chat: ["Can players write or talk to each other?", { nein: "No", ja: "Yes" }],
        daten: ["Does the game collect data about players?", { nein: "No", ja: "Yes (accounts, analytics, ads…)" }]
      },
      fragenHilfe: {
        gewalt: "Fighting monsters counts too.",
        daten: "Saving in the browser (localStorage) doesn't count. Servers, analytics, ads or accounts do."
      },
      kiText: ["What is AI-generated?", "e.g. “Background music and some images, made with tool X”. At least 10 characters."],
      datenWeiter: "Because the game collects data, you need a privacy notice under “Privacy & rights”.",
      hinweise: ["More content notes (optional)", "Shown on the game page, e.g. “Flashing lights”."],
      alterEigen: ["Rate higher (optional)", "You can rate your game stricter, not milder."],
      alterKeine: "Not higher than recommended",
      ab: (a) => "Ages " + a + "+",
      empfehlung: "Age rating",
      selbst: "Self-declared",
      keineHinweise: "No special content notes.",
      offeneFragen: (n) => n === 1 ? "1 question left." : n + " questions left.",
      datenschutzTitel: "Privacy",
      datenNein: "According to the questionnaire your game doesn't collect data about players. Then there's nothing to fill in here.",
      datenOffen: "First answer under “Content & age rating” whether your game collects data.",
      datenJa: "Your game collects data. Briefly explain what, why and who gets it, and link your privacy policy. Both are shown on the game page.",
      datenText: ["Privacy notice", "At least 20 characters."],
      datenschutzUrl: ["Link to the privacy policy", "With https://"],
      rechteTitel: "Rights",
      rechteText: "I own the rights to everything in this game – music, images, code and fonts. Whatever isn't mine I'm allowed to use, and I've listed it below with its license.",
      bestaetigtAm: (d) => "Confirmed on " + d,
      lizenzen: ["Licenses and credits", "e.g. “Music: Kevin MacLeod (CC BY 4.0)”, “Font: Inter (OFL)”, “Engine: Godot (MIT)”."],
      technikIntro: "So players know what to expect – and so we can review it.",
      engine: ["Engine", ""],
      engines: { unity: "Unity", godot: "Godot", phaser: "Phaser", three: "three.js", pixi: "PixiJS", construct: "Construct", gamemaker: "GameMaker", defold: "Defold", pico8: "PICO-8", html: "Plain HTML/JavaScript", andere: "Other" },
      eingabe: ["Input", "What do you play with?"],
      eingaben: { maus: "Mouse", tastatur: "Keyboard", touch: "Touch", gamepad: "Gamepad" },
      format: ["Format", "Which aspect ratio does the game use?"],
      formate: { "16:9": "16:9 landscape", "4:3": "4:3", "1:1": "1:1 square", hoch: "Portrait", frei: "Adapts" },
      internet: "Needs an internet connection while playing",
      speichernBrowser: "Saves progress in the browser",
      technikHinweise: ["Notes (optional)", "e.g. “Runs best in Chrome” or “Headphones recommended”."],
      anleitungTitel: "How to export for the web",
      anleitung: [
        ["Unity (WebGL)", "Compression Gzip or Brotli with “Decompression Fallback” – or Brotli without fallback, both work here. The default template is fine."],
        ["Godot 4", "Web export without threads (“Thread Support” off). Games with threads need special server headers that aren't available here."],
        ["Relative paths", "src=\"Build/game.js\" instead of src=\"/Build/game.js\". Absolute paths point nowhere after uploading."],
        ["index.html in the ZIP", "index.html sits at the top of the ZIP or inside exactly one folder. Everything the game needs goes in there too."],
        ["No outside servers", "Don't load anything over http://. Whatever the game needs to run goes in the ZIP."]
      ],
      buildIntro: (mb) => "Upload your web export as a ZIP (up to " + mb + " MB). You can test it in the browser right away.",
      buildsAus: "Uploads open once the games address (play.miwale.com) is set up. You can prepare everything else already.",
      zipWaehlen: "Choose ZIP",
      buildNotiz: "Note for this build (optional)",
      buildNotizPlatz: "e.g. version 1.2",
      hochladen: "Upload",
      entpacken: "Unpacking and checking…",
      zuGross: (mb) => "The file is larger than " + mb + " MB.",
      keinZip: "Please choose a .zip file.",
      buildsTitel: "Your builds",
      keineBuilds: "No build uploaded yet.",
      aktiv: "Active",
      aktivText: "Reviewed with your next submission.",
      verwenden: "Use this one",
      testen: "Test",
      inPruefung: "In review",
      dateien: (n) => n + (n === 1 ? " file" : " files"),
      entpackt: (g) => g + " unpacked",
      buildLoeschenFrage: "Delete this build?",
      bericht: {
        "absolute-pfade": "index.html loads files with absolute paths (/…). Those point nowhere here – use relative paths.",
        "http-quellen": "Files are loaded over http://. Browsers block that – use https:// or put them in the ZIP.",
        "engine-unity": "Unity build detected.",
        "engine-godot": "Godot build detected.",
        threads: "The game uses threads (SharedArrayBuffer). That doesn't work here – export without threads.",
        "kein-viewport": "No <meta name=\"viewport\"> found. On phones the game will look very small.",
        "index-unlesbar": "index.html couldn't be read."
      },
      veroeffIntro: "When should your game come out? This applies once it's approved and you click “Publish”.",
      sofort: ["Right after approval", "Your game appears as soon as you publish it."],
      datum: ["On a specific day", "Until then the game shows as “Coming soon” in the shop, with the date."],
      datumLabel: "Release day",
      vorschauHinweis: "This is how your store page will look on miwale.com (draft). “Play now” opens the active build in a new tab.",
      keinBuildTest: "Upload a build first, then you can test it here.",
      platzhalter: "Image missing",
      feldnamen: {
        name: "Name", kurz: "Short description (20+ characters)", lang: "Description (100+ characters)", genre: "Genre", tags: "Tags",
        sprachen: "Languages", geraete: "Devices", icon: "Icon", header: "Header", kapsel: "Main capsule", screens: "3 screenshots",
        gewalt: "Violence", blut: "Blood", horror: "Horror", sexuell: "Sexual content", sprache: "Language", drogen: "Drugs",
        gluecksspiel: "Gambling", mikrotransaktionen: "Real-money purchases", ki: "AI content", multiplayer: "Multiplayer", chat: "Chat",
        daten: "Player data", kiText: "Description of AI content", rechte: "Rights confirmation", datenText: "Privacy notice",
        datenschutzUrl: "Privacy policy link", engine: "Engine", eingabe: "Input", build: "Active build", datum: "Date"
      },
      zeichen: (n, max) => n + " / " + max,
      fehler: {
        anmelden: "Please sign in again.",
        "konto-gesperrt": "Your account is blocked.",
        "studio-zu": "The Studio is closed right now.",
        "zu-viele-projekte": "You've reached the maximum number of projects.",
        "nicht-gefunden": "That doesn't exist (anymore).",
        "in-pruefung": "Your game is being reviewed. Withdraw the submission to change something.",
        name: "The name needs 2 to 60 characters.",
        url: "Please enter a full address with https://.",
        woerter: "This contains a word that isn't allowed on miwale.",
        feld: "Too long or invalid.",
        art: "Unknown image type.",
        "zu-viele-screens": "Up to 12 screenshots.",
        "bild-format": "That's not a PNG, JPEG, WebP or GIF.",
        "video-format": "That's not an MP4 or WebM video.",
        "zu-gross": "The file is too large.",
        "keine-spiele-adresse": "Uploads open once the games address is set up.",
        "zu-schnell": "Too many requests. Please wait a moment.",
        "zip-kaputt": "The ZIP is damaged or not a ZIP.",
        "zip-leer": "The ZIP is empty.",
        "keine-index-html": "index.html is missing in the ZIP (at the top or in exactly one folder).",
        "pfad-verboten": "The ZIP contains forbidden paths (.. or absolute paths).",
        "zip-verschluesselt": "Encrypted ZIPs don't work.",
        "zip-verfahren": "The ZIP uses an unknown compression. Please pack it normally (Deflate).",
        "zip-bombe": "The ZIP is suspiciously highly compressed.",
        "zip-doppelt": "The ZIP contains duplicate files.",
        "zu-viele-dateien": "The ZIP contains too many files (up to 5000).",
        "zu-gross-entpackt": "Unpacked, the game is too large.",
        "slug-vergeben": "This address is taken or not allowed.",
        slug: "Only lowercase letters, digits and hyphens, 3–40 characters.",
        build: "This build doesn't exist anymore.",
        "build-in-benutzung": "This build is live or in review and can't be deleted.",
        datum: "Please choose a valid date (at most two years ahead).",
        "projekt-gesperrt": "This game is blocked.",
        "schon-eingereicht": "The game is already submitted.",
        unvollstaendig: "The checklist isn't complete yet.",
        notiz: "The note is too long.",
        "nicht-eingereicht": "The game isn't submitted right now.",
        "nicht-freigegeben": "The game isn't approved yet.",
        "nicht-live": "The game isn't live right now.",
        herkunft: "The request came from another site.",
        netz: "No connection to the server. Please try again.",
        allgemein: "That didn't work. Please try again."
      }
    }
  };

  // Fehlercodes von PUT /seite, die zu einem Feld gehoeren.
  const FEHLER_FELD = {
    name: "name", kurz: "kurz", lang: "lang", genre: "genre", tags: "tags", sprachen: "sprachen", features: "features",
    steuerung: "steuerung", geraete: "geraete", entwickler: "entwickler", webseite: "webseite",
    "ki-text": "inhalt.kiText", "daten-text": "inhalt.datenText", "datenschutz-url": "inhalt.datenschutzUrl",
    hinweise: "inhalt.hinweise", alter: "inhalt.alterEigen", engine: "technik.engine", eingabe: "technik.eingabe",
    format: "technik.format", "technik-hinweise": "technik.hinweise", lizenzen: "rechte.lizenzen"
  };
  const URL_FELDER = ["webseite", "inhalt.datenschutzUrl"];
  // Hoechstlaengen wie server/studio.mjs (STUDIO_GRENZEN), fuer maxlength und Zaehler.
  const MAX = { name: 60, kurz: 300, lang: 8000, steuerung: 1500, feature: 160, features: 12, tag: 30, entwickler: 60, lizenzen: 3000, hinweise: 600, kiText: 1500, datenText: 2000, notiz: 2000, webseite: 300 };

  const ICON = {
    haken: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    links: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    rechts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    hoch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    extern: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    warnung: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    spiel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="11" rx="3"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01"/></svg>',
    zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
  };

  // ---- Zustand -------------------------------------------------------------------
  const S = {
    el: null, sprache: "en", id: null,
    status: null, projekte: null,
    p: null, ladeFehler: null,
    schritt: "uebersicht",
    meldung: null,
    offen: {}, timer: 0, speichert: false, stand: "gespeichert",
    feldFehler: {},
    uploads: {},        // art -> { anteil } waehrend eines Uploads
    warnungen: {},      // art -> Text zu den Bildmassen
    neuOffen: false, slugOffen: false,
    ladeNr: 0
  };
  const t = () => TEXTE[S.sprache] || TEXTE.en;

  // ---- Hilfen --------------------------------------------------------------------
  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function fehlerText(grund) {
    const f = t().fehler;
    const g = String(grund || "");
    if (f[g]) return f[g];
    if (g.startsWith("woerter-")) return f.woerter;
    if (g === "webseite" || g === "datenschutz-url") return f.url;
    if (FEHLER_FELD[g] || g.startsWith("frage-")) return f.feld;
    return f.allgemein;
  }
  function datum(iso, mitZeit) {
    if (!iso) return "";
    try {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T12:00:00") : new Date(iso);
      return new Intl.DateTimeFormat(S.sprache, mitZeit ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch (e) { return String(iso).slice(0, 10); }
  }
  function groesse(b) {
    const n = Number(b) || 0;
    if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + " KB";
    return (n / 1048576).toFixed(n < 10 * 1048576 ? 1 : 0).replace(".", S.sprache === "de" ? "," : ".") + " MB";
  }
  function sprachName(code) {
    try {
      const n = new Intl.DisplayNames([S.sprache], { type: "language" }).of(code) || code;
      return n.charAt(0).toUpperCase() + n.slice(1);
    } catch (e) { return String(code).toUpperCase(); }
  }
  const heute = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const ID = () => window.MIWALE_IDENTITAET;
  const nurLesen = () => !!S.p && S.p.status === "eingereicht";
  const listen = () => (S.status && S.status.listen) || { sprachen: [], geraete: ["pc", "handy"], eingaben: [], engines: [], formate: [], fragen: {}, medien: {} };
  const grenzen = () => (S.status && S.status.grenzen) || { maxBuildMb: 300, maxProjekte: 5, bildMb: 8, videoMb: 120, screens: 12, tags: 10 };

  async function api(pfad, methode, koerper) {
    try {
      const init = { method: methode || "GET", credentials: "same-origin", headers: { accept: "application/json" } };
      if (koerper !== undefined) { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(koerper); }
      const res = await fetch(API + pfad, init);
      const daten = await res.json().catch(() => ({}));
      return { status: res.status, daten };
    } catch (e) {
      return { status: 0, daten: { fehler: "netz" } };
    }
  }

  // Rohdaten hochladen (Body = Datei). Mit Fortschritt per XHR, sonst fetch.
  function hochladenRoh(pfad, datei, fortschritt) {
    if (!fortschritt) {
      return fetch(API + pfad, { method: "POST", credentials: "same-origin", headers: { accept: "application/json", "content-type": datei.type || "application/octet-stream" }, body: datei })
        .then(async (res) => ({ status: res.status, daten: await res.json().catch(() => ({})) }))
        .catch(() => ({ status: 0, daten: { fehler: "netz" } }));
    }
    return new Promise((fertig) => {
      const x = new XMLHttpRequest();
      x.open("POST", API + pfad);
      x.setRequestHeader("accept", "application/json");
      x.setRequestHeader("content-type", datei.type || "application/octet-stream");
      x.upload.addEventListener("progress", (e) => { if (e.lengthComputable) fortschritt(e.loaded / e.total); });
      x.upload.addEventListener("load", () => fortschritt(1));
      x.addEventListener("load", () => {
        let daten = {};
        try { daten = JSON.parse(x.responseText || "{}"); } catch (e) { daten = {}; }
        fertig({ status: x.status, daten });
      });
      x.addEventListener("error", () => fertig({ status: 0, daten: { fehler: "netz" } }));
      x.addEventListener("abort", () => fertig({ status: 0, daten: { fehler: "netz" } }));
      x.send(datei);
    });
  }

  // Wie server/studio.mjs alterAus()/hinweiseAus(): sofort beim Antworten zeigen,
  // was die Empfehlung waere. Der Server rechnet beim Speichern nach.
  function alterAus(i) {
    let a = 0;
    const mind = (x) => { a = Math.max(a, x); };
    if (i.gewalt === "comic") mind(6);
    if (i.gewalt === "fantasie") mind(12);
    if (i.gewalt === "realistisch") mind(16);
    if (i.gewalt === "realistisch" && i.blut === "viel") mind(18);
    if (i.blut === "wenig") mind(12);
    if (i.blut === "viel") mind(16);
    if (i.horror === "leicht") mind(12);
    if (i.horror === "stark") mind(16);
    if (i.sexuell === "andeutungen") mind(12);
    if (i.sexuell === "nacktheit") mind(18);
    if (i.sprache === "mild") mind(6);
    if (i.sprache === "grob") mind(12);
    if (i.drogen === "ja") mind(16);
    if (i.gluecksspiel === "simuliert") mind(12);
    return Math.max(a, [0, 6, 12, 16, 18].includes(i.alterEigen) ? i.alterEigen : 0);
  }
  function hinweiseAus(i) {
    const h = [];
    if (i.gewalt && i.gewalt !== "nein") h.push("gewalt-" + i.gewalt);
    if (i.blut && i.blut !== "nein") h.push("blut");
    if (i.horror && i.horror !== "nein") h.push("horror");
    if (i.sexuell && i.sexuell !== "nein") h.push("sexuell-" + i.sexuell);
    if (i.sprache === "grob") h.push("sprache");
    if (i.drogen === "ja") h.push("drogen");
    if (i.gluecksspiel === "simuliert") h.push("gluecksspiel");
    if (i.mikrotransaktionen === "ja") h.push("mikrotransaktionen");
    if (i.ki === "ja") h.push("ki");
    if (i.multiplayer === "ja") h.push("online");
    if (i.chat === "ja") h.push("chat");
    if (i.daten === "ja") h.push("daten");
    return h;
  }
  const hinweisText = (h) => (window.MIWALE_SHOP && window.MIWALE_SHOP.hinweisText ? window.MIWALE_SHOP.hinweisText(h, S.sprache) : h);

  // ---- Laden ---------------------------------------------------------------------
  async function statusLaden() {
    const { status, daten } = await api("status");
    S.status = status === 200 ? daten : { konto: null, offen: true, builds: false, fehler: true };
  }
  async function projekteLaden() {
    const { status, daten } = await api("projekte");
    S.projekte = status === 200 ? daten.projekte : [];
  }
  async function projektLaden(id) {
    const nr = ++S.ladeNr;
    const { status, daten } = await api("projekte/" + id);
    if (nr !== S.ladeNr) return;
    if (status === 200) { S.p = mitOffen(daten); S.ladeFehler = null; }
    else { S.p = null; S.ladeFehler = daten.fehler || "allgemein"; }
  }
  async function allesLaden() {
    await statusLaden();
    if (!S.status.konto) { zeichnen(); return; }
    if (S.id) await projektLaden(S.id);
    else await projekteLaden();
    zeichnen();
  }

  // ---- Speichern -----------------------------------------------------------------
  // S.offen haelt nur, was sich seit dem letzten Speichern geaendert hat, in der
  // Form, die PUT /seite erwartet: { name, inhalt: { gewalt }, ... }.
  function zusammen(a, b) {
    const r = { ...a };
    for (const [k, v] of Object.entries(b)) {
      r[k] = v && typeof v === "object" && !Array.isArray(v) && r[k] && typeof r[k] === "object" ? { ...r[k], ...v } : v;
    }
    return r;
  }
  function mitOffen(p) {
    if (!p || !p.entwurf) return p;
    for (const [k, v] of Object.entries(S.offen)) {
      if (v && typeof v === "object" && !Array.isArray(v)) p.entwurf[k] = { ...p.entwurf[k], ...v };
      else p.entwurf[k] = v;
    }
    return p;
  }
  function pfadWeg(teil, pfad) {
    const [a, b] = pfad.split(".");
    if (b) { if (teil[a]) { delete teil[a][b]; if (!Object.keys(teil[a]).length) delete teil[a]; } }
    else delete teil[a];
  }
  function wertVon(pfad) {
    const [a, b] = pfad.split(".");
    const e = S.p.entwurf;
    return b ? (e[a] || {})[b] : e[a];
  }

  function setzeFeld(pfad, wert) {
    if (!S.p || nurLesen()) return;
    const [a, b] = pfad.split(".");
    if (b) S.p.entwurf[a] = { ...S.p.entwurf[a], [b]: wert };
    else S.p.entwurf[a] = wert;
    // Erst im Browser pruefen, was der Server sicher ablehnen wuerde; sonst
    // scheiterte das ganze Paket an einem halb getippten Link.
    let fehler = "";
    if (URL_FELDER.includes(pfad) && wert && !/^https:\/\/[^\s/]+\.[^\s]+$/.test(wert)) fehler = t().fehler.url;
    if (pfad === "name" && String(wert).trim().length < 2) fehler = t().fehler.name;
    if (fehler) {
      S.feldFehler[pfad] = fehler;
      pfadWeg(S.offen, pfad);
    } else {
      delete S.feldFehler[pfad];
      if (b) S.offen[a] = { ...(S.offen[a] || {}), [b]: wert };
      else S.offen[a] = wert;
    }
    feldFehlerZeigen();
    if (Object.keys(S.offen).length) {
      S.stand = "offen";
      clearTimeout(S.timer);
      S.timer = setTimeout(speichern, SPEICHERN_NACH_MS);
    }
    standZeigen();
  }

  async function speichern() {
    clearTimeout(S.timer);
    if (!S.p || S.speichert || !Object.keys(S.offen).length) { standZeigen(); return; }
    const id = S.p.id;
    let teil = S.offen;
    S.offen = {};
    S.speichert = true;
    S.stand = "speichert";
    standZeigen();
    let { status, daten } = await api("projekte/" + id + "/seite", "PUT", teil);
    // Lehnt der Server ein Feld ab, den Rest trotzdem speichern.
    for (let runde = 0; runde < 4 && (status === 400 || status === 422); runde++) {
      const pfad = feldVonFehler(daten.fehler);
      if (!pfad) break;
      S.feldFehler[pfad] = fehlerText(daten.fehler);
      pfadWeg(teil, pfad);
      if (!Object.keys(teil).length) { status = -1; break; }
      ({ status, daten } = await api("projekte/" + id + "/seite", "PUT", teil));
    }
    S.speichert = false;
    if (!S.p || S.p.id !== id) return;
    if (status === 200) {
      S.p = mitOffen(daten);
      S.stand = Object.keys(S.offen).length ? "offen" : "gespeichert";
    } else if (status === -1) {
      S.stand = Object.keys(S.offen).length ? "offen" : "fehler";
    } else {
      // Nicht verlieren: beim naechsten Mal mit dem Neueren zusammen schicken.
      S.offen = zusammen(teil, S.offen);
      S.stand = "fehler";
      S.meldung = { fehler: true, text: fehlerText(daten.fehler) };
      if (status === 409 && daten.fehler === "in-pruefung") { S.offen = {}; await projektLaden(id); zeichnen(); return; }
      meldungZeigen();
    }
    nachSpeichern();
    if (Object.keys(S.offen).length && status === 200) S.timer = setTimeout(speichern, SPEICHERN_NACH_MS);
  }
  function feldVonFehler(g) {
    const k = String(g || "").replace(/^woerter-/, "");
    if (k.startsWith("frage-")) return "inhalt." + k.slice(6);
    return FEHLER_FELD[k] || null;
  }

  // Nach dem Speichern: Haken, Stand, Fehler und Altersempfehlung auffrischen,
  // ohne die Felder neu zu bauen (sonst sprang der Cursor beim Tippen).
  function nachSpeichern() {
    if (!S.el || !S.el.isConnected) return;
    const nav = S.el.querySelector("[data-st-nav]");
    if (nav) {
      const links = nav.firstElementChild ? nav.firstElementChild.scrollLeft : 0;
      nav.innerHTML = navHtml();
      nav.firstElementChild.scrollLeft = links;
    }
    const kopf = S.el.querySelector("[data-st-kopfdaten]");
    if (kopf) kopf.innerHTML = kopfDatenHtml();
    standZeigen();
    feldFehlerZeigen();
    alterZeigen();
  }
  function standZeigen() {
    const el = S.el && S.el.querySelector("[data-st-stand]");
    if (!el) return;
    const st = S.speichert ? "speichert" : S.stand;
    el.textContent = t().stand[st] || "";
    el.className = "st-stand st-stand--" + st;
  }
  function feldFehlerZeigen() {
    if (!S.el) return;
    S.el.querySelectorAll("[data-fehler-fuer]").forEach((p) => {
      const f = S.feldFehler[p.dataset.fehlerFuer];
      p.hidden = !f;
      p.textContent = f || "";
      const feld = S.el.querySelector('[data-feld="' + p.dataset.fehlerFuer + '"]');
      if (feld) feld.setAttribute("aria-invalid", f ? "true" : "false");
    });
  }
  function meldungZeigen() {
    const el = S.el && S.el.querySelector("[data-st-meldung]");
    if (el) el.innerHTML = meldungHtml();
  }
  function meldungHtml() {
    const m = S.meldung;
    return m ? '<p class="st-meldung' + (m.fehler ? " st-meldung--fehler" : "") + '" role="' + (m.fehler ? "alert" : "status") + '">' + esc(m.text) + "</p>" : "";
  }

  // ---- Darstellung: Rahmen -------------------------------------------------------
  function zeichnen() {
    if (!S.el || !S.el.isConnected) return;
    const T = t();
    if (!S.status) { S.el.innerHTML = '<p class="st-laedt">' + esc(T.laedt) + "</p>"; return; }
    if (!S.status.konto) { S.el.innerHTML = heldHtml(false) + anmeldenHtml(); return; }
    if (S.id) { S.el.innerHTML = editorHtml(); nachDemZeichnen(); return; }
    S.el.innerHTML = uebersichtHtml();
    const feld = S.el.querySelector("[data-st-neu] input");
    if (feld) feld.focus();
  }

  function heldHtml(mitKnopf) {
    const T = t();
    const g = grenzen();
    const voll = S.projekte && S.projekte.length >= g.maxProjekte;
    return '<header class="sp-ideen__held st-held"><div class="sp-ideen__heldtext">' +
      '<p class="sp-ideen__kicker">' + esc(T.titel) + "</p>" +
      '<h1 class="sp-ideen__titel">' + esc(T.heldTitel) + "</h1>" +
      '<p class="sp-ideen__intro">' + esc(T.heldText) + "</p></div>" +
      (mitKnopf ? '<div class="sp-ideen__heldaktion"><button type="button" class="sp-knopf sp-knopf--play sp-knopf--gross" data-st-neu-oeffnen' +
        (voll || S.status.offen === false || (S.status.konto && S.status.konto.gesperrt) ? " disabled" : "") + ">" + ICON.plus + esc(T.neuesSpiel) + "</button>" +
        (S.projekte ? '<span class="st-held__grenze">' + esc(T.grenze(S.projekte.length, g.maxProjekte)) + "</span>" : "") + "</div>" : "") +
      "</header>";
  }

  function hinweiseOben() {
    const T = t();
    const h = S.status.hinweis ? (S.status.hinweis[S.sprache] || S.status.hinweis.de || S.status.hinweis.en) : "";
    return (S.status.offen === false ? '<div class="st-band st-band--warnung"><strong>' + esc(T.zuTitel) + "</strong> " + esc(T.zuText) + "</div>" : "") +
      (S.status.konto && S.status.konto.gesperrt ? '<div class="st-band st-band--fehler">' + esc(T.kontoGesperrt) + "</div>" : "") +
      (h ? '<div class="st-band">' + ICON.info + "<span>" + esc(h) + "</span></div>" : "");
  }

  function anmeldenHtml() {
    const T = t();
    return hinweiseOben() + '<section class="sp-kasten st-anmelden">' +
      '<span class="st-anmelden__symbol">' + ICON.spiel + "</span>" +
      '<div><h2 class="sp-ueberschrift">' + esc(T.anmeldenTitel) + "</h2>" +
      '<p class="st-text">' + esc(T.anmeldenText) + "</p>" +
      '<a class="sp-knopf sp-knopf--play" href="/account?zurueck=/studio" data-anmelden>' + esc(T.anmelden) + "</a></div></section>" +
      ablaufHtml();
  }

  function ablaufHtml() {
    const T = t();
    return '<section class="st-ablauf"><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(T.ablaufTitel) + '</h2><ol class="sp-ideen__schritte st-ablauf__liste">' +
      T.ablauf.map(([titel, text], i) => '<li><span class="sp-ideen__zahl">' + (i + 1) + "</span><span><strong>" + esc(titel) + "</strong>" + esc(text) + "</span></li>").join("") +
      "</ol></section>";
  }

  function statusMarke(status, live, gesperrt) {
    const T = t();
    return '<span class="st-marke st-marke--' + esc(gesperrt ? "gesperrt" : status) + '">' + esc(gesperrt ? T.status.gesperrt : T.status[status] || status) + "</span>" +
      (live && !gesperrt ? '<span class="st-marke st-marke--live">' + esc(T.live) + "</span>" : "");
  }

  // ---- Uebersicht aller Projekte -------------------------------------------------
  function uebersichtHtml() {
    const T = t();
    const liste = S.projekte || [];
    return heldHtml(true) + hinweiseOben() +
      '<div data-st-meldung>' + meldungHtml() + "</div>" +
      (S.neuOffen ? '<form class="sp-kasten st-neu" data-st-neu novalidate>' +
        '<label class="st-label" for="st-neu-name">' + esc(T.neuName) + "</label>" +
        '<div class="st-neu__zeile"><input id="st-neu-name" class="st-eingabe" name="name" maxlength="' + MAX.name + '" autocomplete="off">' +
        '<button type="submit" class="sp-knopf sp-knopf--play">' + esc(T.anlegen) + "</button>" +
        '<button type="button" class="sp-knopf sp-knopf--glas" data-st-neu-zu>' + esc(T.abbrechen) + "</button></div>" +
        '<p class="st-hilfe">' + esc(T.neuHilfe) + "</p></form>" : "") +
      '<section class="st-abschnitt"><h2 class="sp-ueberschrift">' + esc(T.meineSpiele) + "</h2>" +
      (S.projekte === null ? '<p class="st-laedt">' + esc(T.laedt) + "</p>"
        : !liste.length ? '<p class="sp-bew__leer">' + esc(T.keineSpiele) + "</p>"
        : '<div class="st-projekte">' + liste.map(projektKarte).join("") + "</div>") +
      "</section>" + ablaufHtml();
  }

  function projektKarte(p) {
    const T = t();
    return '<a class="st-projekt" href="/studio/' + esc(p.id) + '" data-link>' +
      '<span class="st-projekt__icon">' + (p.icon ? '<img src="' + esc(p.icon) + '" alt="" loading="lazy">' : esc((p.name || "?").charAt(0).toUpperCase())) + "</span>" +
      '<span class="st-projekt__text"><span class="st-projekt__name">' + esc(p.name) + "</span>" +
        '<span class="st-projekt__marken">' + statusMarke(p.status, p.live, p.gesperrt) + "</span>" +
        '<span class="st-projekt__stand' + (p.fertig ? " st-projekt__stand--fertig" : "") + '">' + (p.fertig ? ICON.haken : "") + esc(p.fertig ? T.bereit : T.unfertig) + "</span>" +
        '<span class="st-projekt__zeit">' + esc(T.geaendert(datum(p.geaendert))) + "</span></span>" +
      '<span class="st-projekt__pfeil">' + ICON.rechts + "</span></a>";
  }

  // ---- Editor ----------------------------------------------------------------------
  function editorHtml() {
    const T = t();
    if (!S.p) {
      if (S.ladeFehler) return '<nav class="sp-pfad"><a href="/studio" data-link>' + esc(T.studio) + "</a></nav>" +
        '<p class="sp-bew__leer">' + esc(S.ladeFehler === "nicht-gefunden" ? T.nichtGefunden : fehlerText(S.ladeFehler)) + "</p>" +
        '<p><a class="sp-knopf sp-knopf--glas" href="/studio" data-link>' + esc(T.zurUebersicht) + "</a></p>";
      return '<p class="st-laedt">' + esc(T.laedt) + "</p>";
    }
    const p = S.p;
    return '<nav class="sp-pfad" aria-label="Breadcrumb"><a href="/studio" data-link>' + ICON.zurueck + esc(T.studio) + '</a><span aria-hidden="true">›</span><span>' + esc(p.entwurf.name) + "</span></nav>" +
      '<div class="st-kopf">' +
        '<span class="st-kopf__icon">' + (p.entwurf.medien.icon ? '<img src="' + esc(p.entwurf.medien.icon) + '" alt="">' : ICON.spiel) + "</span>" +
        '<div class="st-kopf__text"><h1 class="st-kopf__titel" data-st-titel>' + esc(p.entwurf.name) + "</h1>" +
          '<div class="st-kopf__daten" data-st-kopfdaten>' + kopfDatenHtml() + "</div></div>" +
        '<div class="st-kopf__aktionen"><span class="st-stand" data-st-stand aria-live="polite"></span>' +
          '<button type="button" class="sp-knopf sp-knopf--glas" data-st-speichern' + (nurLesen() ? " disabled" : "") + ">" + esc(T.speichern) + "</button></div>" +
      "</div>" +
      hinweiseOben() +
      (p.gesperrt ? '<div class="st-band st-band--fehler">' + esc(T.gesperrt(p.gesperrt.grund)) + "</div>" : "") +
      (nurLesen() ? '<div class="st-band st-band--warnung">' + ICON.info + "<span>" + esc(T.nurLesen) + "</span></div>" : "") +
      (p.live && !nurLesen() && S.schritt !== "uebersicht" ? '<div class="st-band">' + ICON.info + "<span>" + esc(T.liveHinweis) + "</span></div>" : "") +
      '<div data-st-meldung>' + meldungHtml() + "</div>" +
      '<div class="st-editor' + (S.schritt === "vorschau" ? " st-editor--vorschau" : "") + '">' +
        '<nav class="st-nav" data-st-nav aria-label="' + esc(T.titel) + '">' + navHtml() + "</nav>" +
        '<section class="st-inhalt" data-st-inhalt>' + schrittHtml() + "</section>" +
      "</div>";
  }

  function kopfDatenHtml() {
    const p = S.p;
    return statusMarke(p.status, !!p.live, !!p.gesperrt) +
      '<span class="st-kopf__adresse">miwale.com/games/' + esc(p.slug) + "</span>";
  }

  function navHtml() {
    const T = t();
    const c = S.p.checkliste.schritte;
    return '<ol class="st-nav__liste">' + SCHRITTE.map((s) => {
      const teil = PRUEFTEIL[s];
      const ok = teil ? !(c[teil] || []).length : null;
      return '<li><button type="button" class="st-nav__knopf' + (s === S.schritt ? " st-nav__knopf--an" : "") + '" data-st-schritt="' + s + '"' + (s === S.schritt ? ' aria-current="step"' : "") + ">" +
        '<span class="st-nav__haken' + (ok === true ? " st-nav__haken--ok" : ok === false ? " st-nav__haken--offen" : "") + '" aria-hidden="true">' + (ok ? ICON.haken : "") + "</span>" +
        '<span class="st-nav__text">' + esc(T.schritte[s]) + "</span>" +
        (ok === false ? '<span class="sp-unsichtbar"> (' + esc(T.fehlt.replace(/:\s*$/, "")) + ")</span>" : "") +
        "</button></li>";
    }).join("") + "</ol>";
  }

  function schrittHtml() {
    const f = {
      uebersicht: uebersichtSchritt, seite: seiteSchritt, grafiken: grafikenSchritt, inhalt: inhaltSchritt, rechte: rechteSchritt,
      technik: technikSchritt, build: buildSchritt, veroeffentlichung: veroeffentlichungSchritt, vorschau: vorschauSchritt
    }[S.schritt] || uebersichtSchritt;
    return f();
  }

  // Waehrend der Pruefung sind alle Felder eines Schritts aus.
  const feldsatz = (inhalt) => '<fieldset class="st-feldsatz"' + (nurLesen() ? " disabled" : "") + ">" + inhalt + "</fieldset>";
  const schrittKopf = (titel, intro) => '<div class="st-schrittkopf"><h2 class="st-schrittkopf__titel">' + esc(titel) + "</h2>" + (intro ? '<p class="st-text">' + esc(intro) + "</p>" : "") + "</div>";

  // ---- Feld-Bausteine ----
  const feldId = (pfad) => "st-f-" + pfad.replace(/\./g, "-");
  function feldRahmen(pfad, label, hilfe, inneres, extra) {
    return '<div class="st-feld' + (extra || "") + '">' +
      '<label class="st-label" for="' + feldId(pfad) + '">' + esc(label) + "</label>" +
      inneres +
      (hilfe ? '<p class="st-hilfe">' + esc(hilfe) + "</p>" : "") +
      '<p class="st-feldfehler" data-fehler-fuer="' + esc(pfad) + '" hidden></p>' +
      "</div>";
  }
  function eingabe(pfad, max, art, platz) {
    return '<input id="' + feldId(pfad) + '" class="st-eingabe" data-feld="' + esc(pfad) + '" type="' + (art || "text") + '" value="' + esc(wertVon(pfad) || "") + '"' +
      (max ? ' maxlength="' + max + '"' : "") + (platz ? ' placeholder="' + esc(platz) + '"' : "") + ' autocomplete="off">';
  }
  function textfeld(pfad, max, zeilen, mitZaehler) {
    const wert = String(wertVon(pfad) || "");
    return '<textarea id="' + feldId(pfad) + '" class="st-eingabe st-eingabe--text" data-feld="' + esc(pfad) + '" rows="' + (zeilen || 4) + '"' + (max ? ' maxlength="' + max + '"' : "") + ">" + esc(wert) + "</textarea>" +
      (mitZaehler ? '<span class="st-zaehler" data-zaehler-fuer="' + esc(pfad) + '">' + esc(t().zeichen(wert.length, max)) + "</span>" : "");
  }
  // Mehrfachauswahl als Chips (Checkboxen).
  function chips(gruppe, werte, gewaehlt, beschriftung) {
    return '<div class="st-chips" role="group">' + werte.map((w) =>
      '<label class="st-chip"><input type="checkbox" data-feld-gruppe="' + esc(gruppe) + '" value="' + esc(w) + '"' + (gewaehlt.includes(w) ? " checked" : "") + ">" +
        "<span>" + esc(beschriftung(w)) + "</span></label>").join("") + "</div>";
  }
  // Eine Antwort aus mehreren (Radio-Knoepfe als Chips).
  function wahl(pfad, werte, gewaehlt, beschriftung) {
    return '<div class="st-chips st-chips--wahl" role="radiogroup">' + werte.map((w) =>
      '<label class="st-chip"><input type="radio" name="' + esc(feldId(pfad)) + '" data-feld="' + esc(pfad) + '" value="' + esc(w) + '"' + (gewaehlt === w ? " checked" : "") + ">" +
        "<span>" + esc(beschriftung(w)) + "</span></label>").join("") + "</div>";
  }

  // ---- Schritt: Uebersicht ----
  function uebersichtSchritt() {
    const T = t();
    const p = S.p;
    const c = p.checkliste.schritte;
    const fn = (liste) => liste.map((k) => T.feldnamen[k] || k).join(", ");
    const eingereicht = p.status === "eingereicht";
    const freigegeben = p.status === "freigegeben";
    const posten = [
      ["seite", c.seite.concat(c.grafiken), c.seite.length ? "seite" : "grafiken"],
      ["inhalt", c.inhalt, "inhalt"],
      ["rechte", c.rechte, "rechte"],
      ["technik", c.technik, "technik"],
      ["build", c.build, "build"],
      ["datum", c.datum, "veroeffentlichung"],
      ["einreichen", null, null, eingereicht || freigegeben],
      ["veroeffentlichen", null, null, !!p.live && !freigegeben && !eingereicht]
    ];
    const liste = '<ol class="st-check">' + posten.map(([k, fehlt, ziel, fertigSonst], i) => {
      const ok = fehlt ? !fehlt.length : !!fertigSonst;
      return '<li class="st-check__posten' + (ok ? " st-check__posten--ok" : "") + '">' +
        '<span class="st-check__zahl" aria-hidden="true">' + (ok ? ICON.haken : i + 1) + "</span>" +
        '<span class="st-check__text"><strong>' + esc(T.check[k][0]) + "</strong><span>" + esc(T.check[k][1]) + "</span>" +
          (fehlt && fehlt.length ? '<span class="st-check__fehlt">' + esc(T.fehlt + fn(fehlt)) + "</span>" : "") + "</span>" +
        (ziel ? '<button type="button" class="sp-knopf sp-knopf--glas st-check__knopf" data-st-schritt="' + ziel + '">' + esc(T.bearbeiten) + "</button>" : "") +
        "</li>";
    }).join("") + "</ol>";

    return '<div class="st-uebersicht">' +
      '<div class="st-spalte">' +
        '<section class="sp-kasten st-karte"><h2 class="st-karte__titel">' + esc(T.checkTitel) + "</h2>" +
          '<p class="st-text">' + esc(T.checkText) + "</p>" + liste + "</section>" +
        aktionKarte() +
      "</div>" +
      '<div class="st-spalte">' +
        (p.live ? liveKarte() : "") +
        pruefungKarte() +
        adresseKarte() +
        verlaufKarte() +
        '<section class="st-karte st-karte--gefahr"><h2 class="st-karte__titel">' + esc(T.loeschenTitel) + "</h2>" +
          '<p class="st-text">' + esc(T.loeschenText) + "</p>" +
          '<button type="button" class="sp-bew__loeschen" data-st-loeschen>' + esc(T.loeschen) + "</button></section>" +
      "</div>" +
    "</div>";
  }

  function aktionKarte() {
    const T = t();
    const p = S.p;
    if (p.gesperrt) return "";
    if (p.status === "eingereicht") {
      return '<section class="sp-kasten st-karte st-karte--akzent"><h2 class="st-karte__titel">' + esc(T.status.eingereicht) + "</h2>" +
        '<p class="st-text">' + esc(T.eingereichtAm(datum(p.einreichung && p.einreichung.zeit, true))) + "</p>" +
        (p.einreichung && p.einreichung.notiz ? '<blockquote class="st-zitat">' + esc(p.einreichung.notiz) + "</blockquote>" : "") +
        '<div class="st-aktionen"><button type="button" class="sp-knopf sp-knopf--glas" data-st-zurueckziehen>' + esc(T.zurueckziehen) + "</button></div></section>";
    }
    if (p.status === "freigegeben") {
      const v = p.veroeffentlichung;
      const spaeter = v.modus === "datum" && v.datum > heute();
      return '<section class="sp-kasten st-karte st-karte--akzent"><h2 class="st-karte__titel">' + esc(T.status.freigegeben) + "</h2>" +
        '<p class="st-text">' + esc(spaeter ? T.freigegebenDatum(datum(v.datum)) : T.freigegebenText) + "</p>" +
        '<div class="st-aktionen"><button type="button" class="sp-knopf sp-knopf--play sp-knopf--gross" data-st-veroeffentlichen>' + esc(T.veroeffentlichen) + "</button></div></section>";
    }
    const fertig = p.checkliste.fertig;
    const zu = S.status.offen === false;
    return '<section class="sp-kasten st-karte"><h2 class="st-karte__titel">' + esc(T.einreichenTitel) + "</h2>" +
      '<p class="st-text">' + esc(fertig ? T.einreichenText : T.einreichenUnfertig) + "</p>" +
      '<form class="st-einreichen" data-st-einreichen novalidate>' +
        feldRahmen("notiz", T.notiz, T.notizHilfe, '<textarea id="st-f-notiz" class="st-eingabe st-eingabe--text" name="notiz" rows="3" maxlength="' + MAX.notiz + '"' + (fertig ? "" : " disabled") + "></textarea>") +
        '<div class="st-aktionen"><button type="submit" class="sp-knopf sp-knopf--play"' + (fertig && !zu ? "" : " disabled") + ">" + esc(T.einreichen) + "</button></div>" +
      "</form></section>";
  }

  function liveKarte() {
    const T = t();
    const p = S.p;
    return '<section class="sp-kasten st-karte st-karte--live"><h2 class="st-karte__titel">' + esc(T.liveTitel) + "</h2>" +
      (p.liveSeit ? '<p class="st-text">' + esc(T.liveSeit(datum(p.liveSeit))) + "</p>" : "") +
      // Ohne data-link: die Spieleseite laedt den Katalog dann neu.
      '<div class="st-aktionen"><a class="sp-knopf sp-knopf--glas" href="' + esc(p.adresse) + '">' + esc(T.spielseite) + "</a>" +
      '<button type="button" class="sp-bew__loeschen" data-st-auskatalog>' + esc(T.ausKatalog) + "</button></div></section>";
  }

  function pruefungKarte() {
    const T = t();
    const pr = S.p.pruefung;
    if (!pr || !pr.zeit) return "";
    const zeile = (name, wert) => '<div class="st-pruefzeile"><span>' + esc(name) + '</span><span class="st-pruef st-pruef--' + esc(wert || "offen") + '">' + esc(T.pruef[wert || "offen"]) + "</span></div>";
    return '<section class="sp-kasten st-karte"><h2 class="st-karte__titel">' + esc(T.pruefungTitel) + '</h2><p class="st-klein">' + esc(datum(pr.zeit, true)) + "</p>" +
      zeile(T.pruefSeite, pr.seite) + zeile(T.pruefBuild, pr.build) +
      (pr.nachricht ? '<p class="st-label">' + esc(T.pruefNachricht) + '</p><blockquote class="st-zitat">' + esc(pr.nachricht) + "</blockquote>" : "") +
      "</section>";
  }

  function adresseKarte() {
    const T = t();
    const p = S.p;
    return '<section class="sp-kasten st-karte"><h2 class="st-karte__titel">' + esc(T.adresseTitel) + "</h2>" +
      (S.slugOffen
        ? '<form class="st-slug" data-st-slug novalidate><div class="st-slug__zeile"><span class="st-slug__vor">/games/</span>' +
            '<input class="st-eingabe" name="slug" value="' + esc(p.slug) + '" maxlength="40" autocomplete="off" spellcheck="false" aria-label="' + esc(T.adresseTitel) + '"></div>' +
            '<p class="st-hilfe">' + esc(T.adresseHilfe) + "</p>" +
            '<div class="st-aktionen"><button type="submit" class="sp-knopf sp-knopf--play">' + esc(T.speichern) + '</button><button type="button" class="sp-knopf sp-knopf--glas" data-st-slug-zu>' + esc(T.abbrechen) + "</button></div></form>"
        : '<p class="st-adresse"><span>miwale.com/games/<strong>' + esc(p.slug) + "</strong></span>" +
            '<button type="button" class="sp-knopf sp-knopf--glas" data-st-slug-auf>' + esc(T.aendern) + "</button></p>") +
      "</section>";
  }

  function verlaufKarte() {
    const T = t();
    const v = (S.p.verlauf || []).slice(0, 12);
    if (!v.length) return "";
    return '<section class="sp-kasten st-karte"><h2 class="st-karte__titel">' + esc(T.verlaufTitel) + '</h2><ol class="st-verlauf">' +
      v.map((e) => '<li><span class="st-verlauf__was">' + esc(T.verlauf[e.aktion] || e.aktion) + "</span>" +
        '<span class="st-klein">' + esc(datum(e.zeit, true)) + (e.wer ? " · " + esc(e.wer) : "") + "</span>" +
        (e.notiz ? '<span class="st-verlauf__notiz">' + esc(e.notiz) + "</span>" : "") + "</li>").join("") +
      "</ol></section>";
  }

  // ---- Schritt: Store-Seite ----
  function seiteSchritt() {
    const T = t();
    const e = S.p.entwurf;
    const F = T.felder;
    const genres = (S.status.genres || []).slice();
    if (e.genre && !genres.includes(e.genre)) genres.unshift(e.genre);
    return schrittKopf(T.schritte.seite, T.seiteIntro) + feldsatz(
      '<div class="sp-kasten st-karte st-formular">' +
        feldRahmen("name", F.name[0], F.name[1], eingabe("name", MAX.name)) +
        feldRahmen("kurz", F.kurz[0], F.kurz[1], textfeld("kurz", MAX.kurz, 3, true)) +
        feldRahmen("lang", F.lang[0], F.lang[1], textfeld("lang", MAX.lang, 10, true)) +
        '<div class="st-zwei">' +
          feldRahmen("genre", F.genre[0], F.genre[1], '<select id="' + feldId("genre") + '" class="st-eingabe" data-feld="genre"><option value="">' + esc(T.genreWaehlen) + "</option>" +
            genres.map((g) => '<option value="' + esc(g) + '"' + (g === e.genre ? " selected" : "") + ">" + esc(g) + "</option>").join("") + "</select>") +
          feldRahmen("entwickler", F.entwickler[0], F.entwickler[1], eingabe("entwickler", MAX.entwickler, "text", S.status.konto ? S.status.konto.name : "")) +
        "</div>" +
        feldRahmen("tags", F.tags[0], F.tags[1], '<div class="st-tags" data-st-tags>' + tagsHtml() + "</div>") +
      "</div>" +
      '<div class="sp-kasten st-karte st-formular">' +
        gruppeRahmen("sprachen", F.sprachen[0], F.sprachen[1], chips("sprachen", listen().sprachen, e.sprachen, sprachName)) +
        gruppeRahmen("geraete", F.geraete[0], F.geraete[1], chips("geraete", listen().geraete, e.geraete, (g) => T[g] || g)) +
        feldRahmen("features", F.features[0], F.features[1], '<textarea id="' + feldId("features") + '" class="st-eingabe st-eingabe--text" data-feld="features" data-zeilen rows="6">' + esc((e.features || []).join("\n")) + "</textarea>") +
        feldRahmen("steuerung", F.steuerung[0], F.steuerung[1], textfeld("steuerung", MAX.steuerung, 4, false)) +
        feldRahmen("webseite", F.webseite[0], F.webseite[1], eingabe("webseite", MAX.webseite, "url", "https://")) +
      "</div>");
  }
  // Gruppen (Checkboxen) brauchen eine Legende statt eines Labels.
  function gruppeRahmen(pfad, label, hilfe, inneres) {
    return '<fieldset class="st-feld st-gruppe"><legend class="st-label">' + esc(label) + "</legend>" + inneres +
      (hilfe ? '<p class="st-hilfe">' + esc(hilfe) + "</p>" : "") +
      '<p class="st-feldfehler" data-fehler-fuer="' + esc(pfad) + '" hidden></p></fieldset>';
  }
  function tagsHtml() {
    const T = t();
    const tags = S.p.entwurf.tags || [];
    return tags.map((x, i) => '<span class="st-tag">' + esc(x) + '<button type="button" data-tag-weg="' + i + '" aria-label="' + esc(T.tagWeg(x)) + '">' + ICON.zu + "</button></span>").join("") +
      (tags.length < grenzen().tags ? '<input id="' + feldId("tags") + '" class="st-tags__neu" data-tag-neu maxlength="' + MAX.tag + '" placeholder="' + esc(T.tagNeu) + '" autocomplete="off">' : "");
  }

  // ---- Schritt: Grafiken ----
  function grafikenSchritt() {
    const T = t();
    return schrittKopf(T.schritte.grafiken, T.grafikenIntro) + feldsatz(
      '<div class="st-medien">' + BILDER.map(bildKarte).join("") + "</div>" +
      screensKarte() + trailerKarte());
  }
  function marke(art) {
    const T = t();
    const m = listen().medien[art] || {};
    return '<span class="st-pflicht' + (m.pflicht ? " st-pflicht--ja" : "") + '">' + esc(art === "trailer" ? T.empfohlenMarke : m.pflicht ? T.pflicht : T.optional) + "</span>";
  }
  function uploadHtml(art) {
    const u = S.uploads[art];
    if (!u) return "";
    const pz = Math.round((u.anteil || 0) * 100);
    return '<div class="st-upload" role="status"><span>' + esc(pz >= 100 ? t().verarbeitet : t().laedtHoch(pz)) + '</span><span class="st-balken"><span style="width:' + pz + '%"></span></span></div>';
  }
  function bildKarte(art) {
    const T = t();
    const m = listen().medien[art] || {};
    const url = S.p.entwurf.medien[art];
    return '<section class="sp-kasten st-medium st-medium--' + art + '">' +
      '<div class="st-medium__kopf"><h3>' + esc(T.medien[art][0]) + "</h3>" + marke(art) + "</div>" +
      '<p class="st-hilfe">' + esc(T.medien[art][1]) + (m.breite ? " " + esc(T.empfohlen(m.breite, m.hoehe)) : "") + "</p>" +
      '<div class="st-medium__buehne" style="aspect-ratio:' + (m.breite || 16) + " / " + (m.hoehe || 9) + '">' +
        (url ? '<img src="' + esc(url) + '" alt="" data-masse="' + art + '">' : '<span class="st-medium__leer">' + esc(T.keinBild) + "</span>") +
        uploadHtml(art) +
      "</div>" +
      '<p class="st-warnung" data-warnung-fuer="' + art + '"' + (S.warnungen[art] ? "" : " hidden") + ">" + ICON.warnung + "<span>" + esc(S.warnungen[art] || "") + "</span></p>" +
      '<div class="st-medium__aktionen">' +
        '<label class="sp-knopf sp-knopf--glas st-datei">' + esc(url ? T.ersetzen : T.bildWaehlen) +
          '<input type="file" accept="' + BILD_TYPEN.join(",") + '" data-hochladen="' + art + '"></label>' +
        (url ? '<button type="button" class="sp-bew__loeschen" data-medium-weg="' + esc(url) + '" data-art="' + art + '">' + esc(T.entfernen) + "</button>" : "") +
      "</div></section>";
  }
  function screensKarte() {
    const T = t();
    const m = listen().medien.screen || {};
    const liste = S.p.entwurf.medien.screens || [];
    const max = grenzen().screens;
    return '<section class="sp-kasten st-medium st-medium--screens">' +
      '<div class="st-medium__kopf"><h3>' + esc(T.medien.screen[0]) + "</h3>" + marke("screen") +
        '<span class="st-klein st-medium__zahl">' + esc(T.screensZahl(liste.length, max)) + "</span></div>" +
      '<p class="st-hilfe">' + esc(T.medien.screen[1]) + (m.breite ? " " + esc(T.empfohlen(m.breite, m.hoehe)) : "") + "</p>" +
      '<p class="st-warnung" data-warnung-fuer="screen"' + (S.warnungen.screen ? "" : " hidden") + ">" + ICON.warnung + "<span>" + esc(S.warnungen.screen || "") + "</span></p>" +
      '<div class="st-screens">' +
        liste.map((url, i) => '<figure class="st-screen"><img src="' + esc(url) + '" alt="" loading="lazy" data-masse="screen">' +
          '<figcaption class="st-screen__leiste"><span class="st-screen__nr">' + (i + 1) + "</span>" +
            '<button type="button" data-screen-schieben="' + i + '" data-richtung="-1" aria-label="' + esc(T.nachVorn) + '"' + (i === 0 ? " disabled" : "") + ">" + ICON.links + "</button>" +
            '<button type="button" data-screen-schieben="' + i + '" data-richtung="1" aria-label="' + esc(T.nachHinten) + '"' + (i === liste.length - 1 ? " disabled" : "") + ">" + ICON.rechts + "</button>" +
            '<button type="button" data-medium-weg="' + esc(url) + '" data-art="screen" aria-label="' + esc(T.entfernen) + '">' + ICON.zu + "</button>" +
          "</figcaption></figure>").join("") +
        (liste.length < max ? '<label class="st-screen st-screen--neu">' + (S.uploads.screen ? uploadHtml("screen") : ICON.plus + "<span>" + esc(T.screensHinzu) + "</span>") +
          '<input type="file" multiple accept="' + BILD_TYPEN.join(",") + '" data-hochladen="screen"></label>' : "") +
      "</div></section>";
  }
  function trailerKarte() {
    const T = t();
    const url = S.p.entwurf.medien.trailer;
    return '<section class="sp-kasten st-medium st-medium--trailer">' +
      '<div class="st-medium__kopf"><h3>' + esc(T.medien.trailer[0]) + "</h3>" + marke("trailer") + "</div>" +
      '<p class="st-hilfe">' + esc(T.medien.trailer[1]) + " (≤ " + grenzen().videoMb + " MB)</p>" +
      '<div class="st-medium__buehne" style="aspect-ratio:16 / 9">' +
        (url ? '<video src="' + esc(url) + '" controls muted playsinline preload="metadata"></video>' : '<span class="st-medium__leer">' + esc(T.keinVideo) + "</span>") +
        uploadHtml("trailer") +
      "</div>" +
      '<div class="st-medium__aktionen"><label class="sp-knopf sp-knopf--glas st-datei">' + esc(url ? T.ersetzen : T.videoWaehlen) +
        '<input type="file" accept="' + VIDEO_TYPEN.join(",") + '" data-hochladen="trailer"></label>' +
        (url ? '<button type="button" class="sp-bew__loeschen" data-medium-weg="' + esc(url) + '" data-art="trailer">' + esc(T.entfernen) + "</button>" : "") +
      "</div></section>";
  }

  // Bildmasse pruefen: vor dem Hochladen und bei jedem angezeigten Bild.
  function masseText(art, w, h) {
    const T = t();
    const m = listen().medien[art] || {};
    if (!m.breite || !w || !h || (w === m.breite && h === m.hoehe)) return "";
    const gleichesFormat = Math.abs(w / h - m.breite / m.hoehe) < 0.015;
    if (gleichesFormat && w >= m.breite) return "";
    return T.masse(w, h, m.breite, m.hoehe) + (gleichesFormat ? T.masseKlein : T.masseFormat);
  }
  function warnungSetzen(art, text) {
    if (art === "screen" && !text && S.warnungen.screen && S.warnungen.screenQuelle) return;
    S.warnungen[art] = text;
    const el = S.el && S.el.querySelector('[data-warnung-fuer="' + art + '"]');
    if (el) { el.hidden = !text; el.querySelector("span").textContent = text; }
  }
  function masseVonBildern() {
    if (!S.el) return;
    const screens = [];
    S.el.querySelectorAll("img[data-masse]").forEach((img) => {
      if (!img.complete || !img.naturalWidth) return;
      const art = img.dataset.masse;
      const text = masseText(art, img.naturalWidth, img.naturalHeight);
      if (art === "screen") { if (text) screens.push(text); }
      else warnungSetzen(art, text);
    });
    if (S.schritt === "grafiken") { S.warnungen.screenQuelle = false; warnungSetzen("screen", screens[0] || ""); }
  }
  function masseLesen(datei) {
    return new Promise((fertig) => {
      const url = URL.createObjectURL(datei);
      const img = new Image();
      img.onload = () => { fertig({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { fertig(null); URL.revokeObjectURL(url); };
      img.src = url;
    });
  }

  async function medienHochladen(art, dateien) {
    const T = t();
    const g = grenzen();
    const p = S.p;
    if (!p || nurLesen()) return;
    const video = art === "trailer";
    for (const datei of dateien) {
      if (video ? !VIDEO_TYPEN.includes(datei.type) : !BILD_TYPEN.includes(datei.type)) { S.meldung = { fehler: true, text: video ? T.videoTyp : T.bildTyp }; meldungZeigen(); continue; }
      if (datei.size > (video ? g.videoMb : g.bildMb) * 1048576) { S.meldung = { fehler: true, text: video ? T.videoGross(g.videoMb) : T.bildGross(g.bildMb) }; meldungZeigen(); continue; }
      if (!video) {
        const masse = await masseLesen(datei);
        const text = masse ? masseText(art, masse.w, masse.h) : "";
        if (art === "screen") { if (text) { S.warnungen.screen = text; S.warnungen.screenQuelle = true; } }
        else S.warnungen[art] = text;
      }
      S.uploads[art] = { anteil: 0 };
      S.meldung = null;
      grafikenNeu();
      const { status, daten } = await hochladenRoh("projekte/" + p.id + "/medien?art=" + encodeURIComponent(art), datei, video ? (a) => fortschrittZeigen(art, a) : null);
      delete S.uploads[art];
      if (!S.p || S.p.id !== p.id) return;
      if (status === 201) S.p = mitOffen(daten);
      else { S.meldung = { fehler: true, text: fehlerText(daten.fehler) }; if (status === 409 && daten.fehler === "in-pruefung") { await projektLaden(p.id); zeichnen(); return; } }
      grafikenNeu();
    }
    S.warnungen.screenQuelle = false;
  }
  function fortschrittZeigen(art, anteil) {
    S.uploads[art] = { anteil };
    const box = S.el && S.el.querySelector('[data-upload-fuer="' + art + '"], .st-medium--' + (art === "screen" ? "screens" : art) + " .st-upload");
    if (!box) return;
    const pz = Math.round(anteil * 100);
    box.querySelector("span").textContent = pz >= 100 ? t().verarbeitet : t().laedtHoch(pz);
    box.querySelector(".st-balken span").style.width = pz + "%";
  }
  // Nur den Inhalt neu zeichnen (Haken in der Seitenleiste mit).
  function grafikenNeu() {
    if (!S.el || !S.el.isConnected || !S.p) return;
    const inhalt = S.el.querySelector("[data-st-inhalt]");
    if (inhalt) inhalt.innerHTML = schrittHtml();
    meldungZeigen();
    nachSpeichern();
    nachDemZeichnen();
  }

  // ---- Schritt: Inhalte & Altersfreigabe ----
  function inhaltSchritt() {
    const T = t();
    const i = S.p.entwurf.inhalt;
    const fragen = listen().fragen;
    const stufen = [0, 6, 12, 16, 18];
    return schrittKopf(T.schritte.inhalt, T.inhaltIntro) +
      '<div class="st-inhalt-raster">' + feldsatz(
        '<div class="sp-kasten st-karte st-fragen">' +
        Object.keys(fragen).map((f) => {
          const txt = T.fragen[f] || [f, {}];
          return '<fieldset class="st-frage" data-frage="' + esc(f) + '"><legend class="st-frage__titel">' + esc(txt[0]) + "</legend>" +
            (T.fragenHilfe[f] ? '<p class="st-hilfe">' + esc(T.fragenHilfe[f]) + "</p>" : "") +
            wahl("inhalt." + f, fragen[f], i[f], (a) => txt[1][a] || a) +
            '<p class="st-feldfehler" data-fehler-fuer="inhalt.' + esc(f) + '" hidden></p>' +
            (f === "ki" ? '<div class="st-unterfeld" data-zeige-wenn="inhalt.ki=ja"' + (i.ki === "ja" ? "" : " hidden") + ">" +
              feldRahmen("inhalt.kiText", T.kiText[0], T.kiText[1], textfeld("inhalt.kiText", MAX.kiText, 3, true)) + "</div>" : "") +
            (f === "daten" ? '<p class="st-hinweis" data-zeige-wenn="inhalt.daten=ja"' + (i.daten === "ja" ? "" : " hidden") + ">" + ICON.info +
              '<span>' + esc(T.datenWeiter) + ' <button type="button" class="st-textknopf" data-st-schritt="rechte">' + esc(T.schritte.rechte) + " →</button></span></p>" : "") +
            "</fieldset>";
        }).join("") +
        "</div>" +
        '<div class="sp-kasten st-karte st-formular">' +
          feldRahmen("inhalt.hinweise", T.hinweise[0], T.hinweise[1], textfeld("inhalt.hinweise", MAX.hinweise, 2, true)) +
          feldRahmen("inhalt.alterEigen", T.alterEigen[0], T.alterEigen[1], '<select id="' + feldId("inhalt.alterEigen") + '" class="st-eingabe" data-feld="inhalt.alterEigen">' +
            stufen.map((a) => '<option value="' + a + '"' + (a === (i.alterEigen || 0) ? " selected" : "") + ">" + esc(a ? T.ab(a) : T.alterKeine) + "</option>").join("") + "</select>") +
        "</div>") +
        '<aside class="st-alter sp-kasten" data-st-alter aria-live="polite">' + alterHtml() + "</aside>" +
      "</div>";
  }
  function alterHtml() {
    const T = t();
    const i = S.p.entwurf.inhalt;
    const a = alterAus(i);
    const h = hinweiseAus(i);
    const offen = Object.keys(listen().fragen).filter((f) => i[f] === null || i[f] === undefined).length;
    return '<p class="st-alter__titel">' + esc(T.empfehlung) + "</p>" +
      '<p class="st-alter__wert"><span class="sp-alter sp-alter--' + a + '">' + esc(T.ab(a)) + '</span><span class="st-klein">' + esc(T.selbst) + "</span></p>" +
      (offen ? '<p class="st-alter__offen">' + esc(T.offeneFragen(offen)) + "</p>" : "") +
      (h.length ? '<ul class="sp-inhalt__liste">' + h.map((x) => '<li class="sp-inhalt__hinweis">' + esc(hinweisText(x)) + "</li>").join("") + "</ul>"
        : '<p class="st-klein">' + esc(T.keineHinweise) + "</p>");
  }
  function alterZeigen() {
    const el = S.el && S.el.querySelector("[data-st-alter]");
    if (el && S.p) el.innerHTML = alterHtml();
  }

  // ---- Schritt: Datenschutz & Rechte ----
  function rechteSchritt() {
    const T = t();
    const e = S.p.entwurf;
    const daten = e.inhalt.daten;
    return schrittKopf(T.schritte.rechte, "") + feldsatz(
      '<div class="sp-kasten st-karte st-formular"><h3 class="st-karte__titel">' + esc(T.datenschutzTitel) + "</h3>" +
        '<p class="st-hinweis">' + ICON.info + "<span>" + esc(daten === "ja" ? T.datenJa : daten === "nein" ? T.datenNein : T.datenOffen) +
          (daten !== "ja" && daten !== "nein" ? ' <button type="button" class="st-textknopf" data-st-schritt="inhalt">' + esc(T.schritte.inhalt) + " →</button>" : "") + "</span></p>" +
        (daten === "ja" ? feldRahmen("inhalt.datenText", T.datenText[0], T.datenText[1], textfeld("inhalt.datenText", MAX.datenText, 4, true)) +
          feldRahmen("inhalt.datenschutzUrl", T.datenschutzUrl[0], T.datenschutzUrl[1], eingabe("inhalt.datenschutzUrl", 300, "url", "https://")) : "") +
      "</div>" +
      '<div class="sp-kasten st-karte st-formular"><h3 class="st-karte__titel">' + esc(T.rechteTitel) + "</h3>" +
        '<label class="sp-ideen__haken st-haken"><input type="checkbox" data-feld="rechte.eigene"' + (e.rechte.eigene ? " checked" : "") + "><span>" + esc(T.rechteText) +
          (e.rechte.eigene && e.rechte.bestaetigt ? '<span class="st-klein st-block">' + esc(T.bestaetigtAm(datum(e.rechte.bestaetigt))) + "</span>" : "") + "</span></label>" +
        feldRahmen("rechte.lizenzen", T.lizenzen[0], T.lizenzen[1], textfeld("rechte.lizenzen", MAX.lizenzen, 5, true)) +
      "</div>");
  }

  // ---- Schritt: Technik ----
  function technikSchritt() {
    const T = t();
    const tk = S.p.entwurf.technik;
    const L = listen();
    return schrittKopf(T.schritte.technik, T.technikIntro) +
      '<div class="st-technik">' + feldsatz(
        '<div class="sp-kasten st-karte st-formular">' +
          feldRahmen("technik.engine", T.engine[0], T.engine[1], '<select id="' + feldId("technik.engine") + '" class="st-eingabe" data-feld="technik.engine"><option value="">' + esc(T.genreWaehlen) + "</option>" +
            L.engines.map((x) => '<option value="' + esc(x) + '"' + (x === tk.engine ? " selected" : "") + ">" + esc(T.engines[x] || x) + "</option>").join("") + "</select>") +
          gruppeRahmen("technik.eingabe", T.eingabe[0], T.eingabe[1], chips("technik.eingabe", L.eingaben, tk.eingabe, (x) => T.eingaben[x] || x)) +
          '<fieldset class="st-feld st-gruppe"><legend class="st-label">' + esc(T.format[0]) + "</legend>" + wahl("technik.format", L.formate, tk.format, (x) => T.formate[x] || x) +
            '<p class="st-hilfe">' + esc(T.format[1]) + "</p></fieldset>" +
          '<label class="sp-ideen__haken st-haken"><input type="checkbox" data-feld="technik.internet"' + (tk.internet ? " checked" : "") + "><span>" + esc(T.internet) + "</span></label>" +
          '<label class="sp-ideen__haken st-haken"><input type="checkbox" data-feld="technik.speichern"' + (tk.speichern ? " checked" : "") + "><span>" + esc(T.speichernBrowser) + "</span></label>" +
          feldRahmen("technik.hinweise", T.technikHinweise[0], T.technikHinweise[1], textfeld("technik.hinweise", MAX.hinweise, 2, true)) +
        "</div>") +
        anleitungHtml() +
      "</div>";
  }
  function anleitungHtml() {
    const T = t();
    return '<aside class="sp-kasten st-karte st-anleitung"><h3 class="st-karte__titel">' + esc(T.anleitungTitel) + '</h3><ul class="st-anleitung__liste">' +
      T.anleitung.map(([titel, text]) => "<li><strong>" + esc(titel) + "</strong><span>" + esc(text) + "</span></li>").join("") + "</ul></aside>";
  }

  // ---- Schritt: Build ----
  function buildSchritt() {
    const T = t();
    const p = S.p;
    const g = grenzen();
    const an = S.status.builds !== false;
    const u = S.uploads.build;
    return schrittKopf(T.schritte.build, T.buildIntro(g.maxBuildMb)) +
      (!an ? '<div class="st-band st-band--warnung">' + ICON.info + "<span>" + esc(T.buildsAus) + "</span></div>" : "") +
      feldsatz('<form class="sp-kasten st-karte st-buildform" data-st-build novalidate>' +
        '<label class="st-ablage' + (an ? "" : " st-ablage--aus") + '">' + ICON.hoch +
          '<span><strong data-st-zipname>' + esc(T.zipWaehlen) + "</strong><span class=\"st-klein\">.zip · ≤ " + g.maxBuildMb + " MB</span></span>" +
          '<input type="file" name="zip" accept=".zip,application/zip,application/x-zip-compressed"' + (an && !u ? "" : " disabled") + "></label>" +
        '<div class="st-buildform__zeile">' +
          feldRahmen("buildnotiz", T.buildNotiz, "", '<input id="st-f-buildnotiz" class="st-eingabe" name="notiz" maxlength="200" placeholder="' + esc(T.buildNotizPlatz) + '" autocomplete="off"' + (an ? "" : " disabled") + ">") +
          '<button type="submit" class="sp-knopf sp-knopf--play"' + (an && !u ? "" : " disabled") + ">" + esc(T.hochladen) + "</button>" +
        "</div>" +
        (u ? '<div class="st-upload st-upload--breit" data-upload-fuer="build" role="status"><span>' + esc(u.anteil >= 1 ? T.entpacken : T.laedtHoch(Math.round(u.anteil * 100))) + '</span><span class="st-balken"><span style="width:' + Math.round(u.anteil * 100) + '%"></span></span></div>' : "") +
      "</form>") +
      '<section class="st-abschnitt"><h3 class="st-karte__titel">' + esc(T.buildsTitel) + "</h3>" +
        (p.builds.length ? '<ol class="st-builds">' + p.builds.map(buildZeile).join("") + "</ol>" : '<p class="sp-bew__leer">' + esc(T.keineBuilds) + "</p>") +
      "</section>" + anleitungHtml();
  }
  function buildZeile(b) {
    const T = t();
    const p = S.p;
    const aktiv = b.id === p.entwurfBuild;
    const live = b.id === p.liveBuild;
    const pruefung = p.status === "eingereicht" && p.einreichung && p.einreichung.build === b.id;
    const symbol = { warnung: ICON.warnung, info: ICON.info, fehler: ICON.warnung };
    return '<li class="sp-kasten st-build' + (aktiv ? " st-build--aktiv" : "") + '">' +
      '<div class="st-build__kopf"><div><p class="st-build__titel">' + esc(b.notiz || datum(b.hochgeladen, true)) + "</p>" +
        '<p class="st-klein">' + (b.notiz ? esc(datum(b.hochgeladen, true)) + " · " : "") + esc(groesse(b.zip || b.groesse)) + " · " + esc(T.entpackt(groesse(b.groesse))) + " · " + esc(T.dateien(b.dateien)) + "</p></div>" +
        '<div class="st-build__marken">' + (aktiv ? '<span class="st-marke st-marke--aktiv">' + esc(T.aktiv) + "</span>" : "") +
          (live ? '<span class="st-marke st-marke--live">' + esc(T.live) + "</span>" : "") +
          (pruefung ? '<span class="st-marke st-marke--eingereicht">' + esc(T.inPruefung) + "</span>" : "") + "</div></div>" +
      ((b.bericht || []).length ? '<ul class="st-bericht">' + b.bericht.map((x) => '<li class="st-bericht__' + esc(x.stufe) + '">' + (symbol[x.stufe] || ICON.info) + "<span>" + esc(T.bericht[x.text] || x.text) + "</span></li>").join("") + "</ul>" : "") +
      (aktiv ? '<p class="st-klein">' + esc(T.aktivText) + "</p>" : "") +
      '<div class="st-aktionen">' +
        '<a class="sp-knopf sp-knopf--glas" href="' + esc(b.vorschau) + '" target="_blank" rel="noopener">' + ICON.extern + esc(T.testen) + "</a>" +
        (!aktiv ? '<button type="button" class="sp-knopf sp-knopf--glas" data-build-aktiv="' + esc(b.id) + '"' + (nurLesen() ? " disabled" : "") + ">" + esc(T.verwenden) + "</button>" : "") +
        (!live && !pruefung ? '<button type="button" class="sp-bew__loeschen" data-build-weg="' + esc(b.id) + '">' + esc(T.entfernen) + "</button>" : "") +
      "</div></li>";
  }

  async function buildHochladen(form) {
    const T = t();
    const g = grenzen();
    const datei = form.elements.zip.files[0];
    if (!datei) { S.meldung = { fehler: true, text: T.keinZip }; meldungZeigen(); return; }
    if (!/\.zip$/i.test(datei.name)) { S.meldung = { fehler: true, text: T.keinZip }; meldungZeigen(); return; }
    if (datei.size > g.maxBuildMb * 1048576) { S.meldung = { fehler: true, text: T.zuGross(g.maxBuildMb) }; meldungZeigen(); return; }
    const notiz = form.elements.notiz.value.trim().slice(0, 200);
    const p = S.p;
    S.meldung = null;
    S.uploads.build = { anteil: 0 };
    grafikenNeu();
    // Rohdaten; der Typ ist egal, der Server liest das ZIP selbst.
    const zip = new Blob([datei], { type: "application/zip" });
    const { status, daten } = await hochladenRoh("projekte/" + p.id + "/builds?notiz=" + encodeURIComponent(notiz), zip, (a) => {
      S.uploads.build = { anteil: a };
      const box = S.el && S.el.querySelector('[data-upload-fuer="build"]');
      if (box) {
        box.querySelector("span").textContent = a >= 1 ? T.entpacken : T.laedtHoch(Math.round(a * 100));
        box.querySelector(".st-balken span").style.width = Math.round(a * 100) + "%";
      }
    });
    delete S.uploads.build;
    if (!S.p || S.p.id !== p.id) return;
    if (status === 201) S.p = mitOffen(daten);
    else S.meldung = { fehler: true, text: fehlerText(daten.fehler) };
    grafikenNeu();
  }

  // ---- Schritt: Veroeffentlichung ----
  function veroeffentlichungSchritt() {
    const T = t();
    const v = S.p.veroeffentlichung;
    const morgen = new Date(Date.now() + 86400000);
    const min = morgen.getFullYear() + "-" + String(morgen.getMonth() + 1).padStart(2, "0") + "-" + String(morgen.getDate()).padStart(2, "0");
    const max = (new Date().getFullYear() + 2) + heute().slice(4);
    return schrittKopf(T.schritte.veroeffentlichung, T.veroeffIntro) +
      '<div class="sp-kasten st-karte st-formular"><div class="sp-ideen__sicht st-modus" role="radiogroup">' +
        ["sofort", "datum"].map((m) => '<label><input type="radio" name="st-modus" data-veroeff-modus value="' + m + '"' + (v.modus === m ? " checked" : "") + ">" +
          "<span><strong>" + esc(T[m][0]) + "</strong>" + esc(T[m][1]) + "</span></label>").join("") +
      "</div>" +
      '<div class="st-feld st-datum"' + (v.modus === "datum" ? "" : " hidden") + ' data-st-datum>' +
        '<label class="st-label" for="st-f-datum">' + esc(T.datumLabel) + "</label>" +
        '<input id="st-f-datum" class="st-eingabe" type="date" data-veroeff-datum min="' + min + '" max="' + max + '" value="' + esc(v.datum || "") + '">' +
      "</div></div>";
  }
  async function veroeffentlichungSetzen(modus, datumWert) {
    const p = S.p;
    if (modus === "datum" && !/^\d{4}-\d{2}-\d{2}$/.test(datumWert || "")) return;
    S.stand = "speichert"; standZeigen();
    const { status, daten } = await api("projekte/" + p.id + "/veroeffentlichung", "PUT", modus === "datum" ? { modus, datum: datumWert } : { modus });
    if (!S.p || S.p.id !== p.id) return;
    if (status === 200) { S.p = mitOffen(daten); S.stand = Object.keys(S.offen).length ? "offen" : "gespeichert"; S.meldung = null; }
    else { S.stand = "fehler"; S.meldung = { fehler: true, text: fehlerText(daten.fehler) }; }
    meldungZeigen();
    nachSpeichern();
  }

  // ---- Schritt: Vorschau ----
  // Platzhalter fuer fehlende Bilder (data:-SVG, erlaubt durch img-src data:).
  function platzhalter(b, h) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + b + '" height="' + h + '" viewBox="0 0 ' + b + " " + h + '"><rect width="100%" height="100%" fill="#0b2433"/>' +
      '<text x="50%" y="50%" fill="#7FE0EE" fill-opacity=".6" font-family="sans-serif" font-size="' + Math.round(h / 9) + '" text-anchor="middle" dominant-baseline="middle">' +
      esc(t().platzhalter) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  // Der Entwurf in der Form des Katalogs (wie server/studio.mjs katalog()).
  function alsSpiel(p) {
    const s = p.entwurf;
    const m = s.medien;
    const v = p.veroeffentlichung;
    const tag = v.modus === "datum" && v.datum ? v.datum : heute();
    const b = p.builds.find((x) => x.id === p.entwurfBuild);
    const text = { kurz: s.kurz, tags: s.tags, ueber: String(s.lang || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean), features: s.features, steuerung: s.steuerung };
    const kapsel = m.kapsel || m.header || platzhalter(1232, 706);
    const konto = S.status.konto ? S.status.konto.name : "";
    return {
      id: "studio-vorschau-" + p.id, name: s.name || "…", community: true,
      veroeffentlicht: tag, demnaechst: tag > heute(), geraete: s.geraete,
      status: { en: "Community game", de: "Community-Spiel" },
      spielen: b ? b.vorschau : "",
      bild: m.header || platzhalter(920, 430), kapsel, hochformat: m.kapselHoch || kapsel,
      bilder: m.screens, medien: { trailer: m.trailer, poster: m.screens[0] || kapsel, screens: m.screens.length ? m.screens : [kapsel] },
      texte: { en: text, de: text },
      genre: s.genre, sprachen: s.sprachen,
      entwickler: { name: s.entwickler || konto, profil: konto },
      webseite: s.webseite,
      inhalt: {
        alter: alterAus(s.inhalt), hinweise: hinweiseAus(s.inhalt), text: s.inhalt.hinweise,
        kiText: s.inhalt.ki === "ja" ? s.inhalt.kiText : "", datenText: s.inhalt.daten === "ja" ? s.inhalt.datenText : "",
        datenschutzUrl: s.inhalt.daten === "ja" ? s.inhalt.datenschutzUrl : ""
      }
    };
  }
  function vorschauSchritt() {
    const T = t();
    const shop = window.MIWALE_SHOP;
    return '<div class="st-band">' + ICON.info + "<span>" + esc(T.vorschauHinweis) + "</span></div>" +
      '<div class="st-vorschau" data-st-vorschau>' + (shop ? shop.spielSeiteHtml(alsSpiel(S.p), S.sprache) : "") + "</div>";
  }

  // ---- Nach dem Zeichnen ----
  function nachDemZeichnen() {
    // Schmal ist die Seitenleiste eine Wischleiste: den aktiven Schritt zeigen.
    const liste = S.el.querySelector(".st-nav__liste");
    const an = liste && liste.querySelector(".st-nav__knopf--an");
    if (an && liste.scrollWidth > liste.clientWidth) liste.scrollLeft = an.parentElement.offsetLeft - (liste.clientWidth - an.offsetWidth) / 2;
    standZeigen();
    feldFehlerZeigen();
    masseVonBildern();
  }

  function schrittWechseln(s) {
    if (!SCHRITTE.includes(s) || !S.p) return;
    if (Object.keys(S.offen).length) speichern();
    S.schritt = s;
    S.meldung = null;
    try { history.replaceState(history.state, "", location.pathname + location.search + (s === "uebersicht" ? "" : "#" + s)); } catch (e) { /* egal */ }
    zeichnen();
    const nav = S.el.querySelector(".st-editor");
    if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: "start" });
  }

  // ---- Eingaben ------------------------------------------------------------------
  function eingabeVerarbeiten(e) {
    const el = e.target;
    if (!S.p) return;
    if (el.matches("[data-feld-gruppe]")) {
      const gruppe = el.dataset.feldGruppe;
      const werte = Array.from(S.el.querySelectorAll('[data-feld-gruppe="' + gruppe + '"]:checked')).map((x) => x.value);
      setzeFeld(gruppe, werte);
      return;
    }
    if (!el.matches("[data-feld]")) return;
    const pfad = el.dataset.feld;
    let wert;
    if (el.type === "checkbox") wert = el.checked;
    else if (el.type === "radio") { if (!el.checked) return; wert = el.value; }
    else if ("zeilen" in el.dataset) wert = el.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, MAX.features).map((x) => x.slice(0, MAX.feature));
    else if (pfad === "inhalt.alterEigen") wert = Number(el.value) || 0;
    else wert = el.value;
    if (el.type === "text" || el.type === "url" || el.tagName === "TEXTAREA") {
      if (e.type === "change") return; // schon bei "input" erledigt
    }
    setzeFeld(pfad, wert);
    // Zaehler und abhaengige Teile.
    const z = S.el.querySelector('[data-zaehler-fuer="' + pfad + '"]');
    if (z) z.textContent = t().zeichen(el.value.length, Number(el.getAttribute("maxlength")) || 0);
    S.el.querySelectorAll("[data-zeige-wenn]").forEach((x) => {
      const [p2, w] = x.dataset.zeigeWenn.split("=");
      if (p2 === pfad) x.hidden = wert !== w;
    });
    if (pfad === "name") {
      const titel = S.el.querySelector("[data-st-titel]");
      if (titel) titel.textContent = wert;
    }
    if (pfad.startsWith("inhalt.")) alterZeigen();
    if (pfad === "rechte.eigene" || pfad === "inhalt.daten") { /* Haken frischt nachSpeichern auf */ }
  }

  function tagHinzu(eingabeEl) {
    const roh = eingabeEl.value.replace(/,/g, " ").trim().slice(0, MAX.tag);
    if (!roh) return;
    const tags = (S.p.entwurf.tags || []).slice();
    if (tags.length >= grenzen().tags || tags.some((x) => x.toLowerCase() === roh.toLowerCase())) { eingabeEl.value = ""; return; }
    tags.push(roh);
    setzeFeld("tags", tags);
    tagsNeu(true);
  }
  function tagsNeu(fokus) {
    const box = S.el.querySelector("[data-st-tags]");
    if (!box) return;
    box.innerHTML = tagsHtml();
    const neu = box.querySelector("[data-tag-neu]");
    if (fokus && neu) neu.focus();
  }

  async function aktion(fn, nachher) {
    const { status, daten } = await fn();
    if (status >= 200 && status < 300) {
      S.meldung = null;
      if (daten && daten.id && daten.entwurf) S.p = mitOffen(daten);
      if (nachher) nachher(daten);
      zeichnen();
      return daten;
    }
    S.meldung = { fehler: true, text: fehlerText(daten.fehler) };
    if (daten.checkliste && S.p) S.p.checkliste = daten.checkliste;
    if (S.id) { meldungZeigen(); nachSpeichern(); } else zeichnen();
    return null;
  }

  function verbinden(el) {
    el.addEventListener("input", (e) => {
      if (e.target.matches("[data-tag-neu]")) {
        if (/,/.test(e.target.value)) tagHinzu(e.target);
        return;
      }
      eingabeVerarbeiten(e);
    });
    el.addEventListener("change", (e) => {
      const z = e.target;
      if (z.matches("[data-hochladen]")) {
        const dateien = Array.from(z.files || []);
        z.value = "";
        if (dateien.length) medienHochladen(z.dataset.hochladen, z.dataset.hochladen === "screen" ? dateien : dateien.slice(0, 1));
        return;
      }
      if (z.matches("[data-veroeff-modus]")) {
        const box = S.el.querySelector("[data-st-datum]");
        if (box) box.hidden = z.value !== "datum";
        if (z.value === "sofort") veroeffentlichungSetzen("sofort");
        else { const d = S.el.querySelector("[data-veroeff-datum]"); if (d && d.value) veroeffentlichungSetzen("datum", d.value); else if (d) d.focus(); }
        return;
      }
      if (z.matches("[data-veroeff-datum]")) { veroeffentlichungSetzen("datum", z.value); return; }
      if (z.name === "zip" && z.files && z.files[0]) {
        const n = S.el.querySelector("[data-st-zipname]");
        if (n) n.textContent = z.files[0].name + " · " + groesse(z.files[0].size);
        return;
      }
      eingabeVerarbeiten(e);
    });
    el.addEventListener("keydown", (e) => {
      if (e.target.matches("[data-tag-neu]")) {
        if (e.key === "Enter") { e.preventDefault(); tagHinzu(e.target); }
        else if (e.key === "Backspace" && !e.target.value && (S.p.entwurf.tags || []).length) {
          setzeFeld("tags", S.p.entwurf.tags.slice(0, -1));
          tagsNeu(true);
        }
      }
    });
    el.addEventListener("focusout", (e) => {
      if (e.target.matches("[data-tag-neu]") && e.target.value.trim()) tagHinzu(e.target);
    });
    // Bildmasse, sobald ein Bild geladen ist (load blubbert nicht: Capture).
    el.addEventListener("load", (e) => { if (e.target.matches && e.target.matches("img[data-masse]")) masseVonBildern(); }, true);

    el.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const T = t();
      if (form.matches("[data-st-neu]")) {
        const name = form.elements.name.value.trim();
        if (name.length < 2) { S.meldung = { fehler: true, text: T.fehler.name }; meldungZeigen(); form.elements.name.focus(); return; }
        form.querySelector("[type=submit]").disabled = true;
        const { status, daten } = await api("projekte", "POST", { name });
        if (status === 201) {
          S.neuOffen = false;
          S.meldung = null;
          S.p = daten;
          S.id = daten.id;
          S.schritt = "seite";
          gehe("/studio/" + daten.id);
        } else {
          S.meldung = { fehler: true, text: fehlerText(daten.fehler) };
          zeichnen();
        }
        return;
      }
      if (form.matches("[data-st-einreichen]")) {
        if (Object.keys(S.offen).length) await speichern();
        const notiz = form.elements.notiz.value.trim();
        await aktion(() => api("projekte/" + S.p.id + "/einreichen", "POST", { notiz }));
        return;
      }
      if (form.matches("[data-st-slug]")) {
        const slug = form.elements.slug.value.trim().toLowerCase();
        if (!SLUG_RE.test(slug)) { S.meldung = { fehler: true, text: T.fehler.slug }; meldungZeigen(); return; }
        await aktion(() => api("projekte/" + S.p.id + "/slug", "PUT", { slug }), () => { S.slugOffen = false; });
        return;
      }
      if (form.matches("[data-st-build]")) { buildHochladen(form); }
    });

    el.addEventListener("click", async (e) => {
      const z = e.target.closest("button, a");
      if (!z || !el.contains(z)) return;
      const d = z.dataset;
      const T = t();
      // Vorschau: "Jetzt spielen" startet den aktiven Build in einem neuen Tab.
      if ("spielen" in d && z.closest("[data-st-vorschau]")) {
        e.preventDefault();
        e.stopPropagation();
        const b = S.p.builds.find((x) => x.id === S.p.entwurfBuild);
        if (b) window.open(b.vorschau, "_blank", "noopener");
        else { S.meldung = { fehler: false, text: T.keinBuildTest }; meldungZeigen(); }
        return;
      }
      if (d.stSchritt) { schrittWechseln(d.stSchritt); return; }
      if ("stSpeichern" in d) { speichern(); return; }
      if ("stNeuOeffnen" in d) { S.neuOffen = true; S.meldung = null; zeichnen(); return; }
      if ("stNeuZu" in d) { S.neuOffen = false; zeichnen(); return; }
      if ("stSlugAuf" in d) { S.slugOffen = true; zeichnen(); const f = S.el.querySelector("[data-st-slug] input"); if (f) f.focus(); return; }
      if ("stSlugZu" in d) { S.slugOffen = false; zeichnen(); return; }
      if (d.tagWeg !== undefined) {
        const tags = (S.p.entwurf.tags || []).filter((_, i) => i !== Number(d.tagWeg));
        setzeFeld("tags", tags);
        tagsNeu(true);
        return;
      }
      if (d.mediumWeg) {
        const datei = d.mediumWeg.split("/").pop();
        if (d.art !== "screen") S.warnungen[d.art] = "";
        await aktion(() => api("projekte/" + S.p.id + "/medien/" + encodeURIComponent(datei), "DELETE"));
        return;
      }
      if (d.screenSchieben !== undefined) {
        const liste = S.p.entwurf.medien.screens.slice();
        const i = Number(d.screenSchieben), j = i + Number(d.richtung);
        if (j < 0 || j >= liste.length) return;
        [liste[i], liste[j]] = [liste[j], liste[i]];
        await aktion(() => api("projekte/" + S.p.id + "/screens", "PUT", { screens: liste }));
        const knopf = S.el.querySelectorAll("[data-screen-schieben]")[j * 2 + (Number(d.richtung) > 0 ? 1 : 0)];
        if (knopf && !knopf.disabled) knopf.focus();
        return;
      }
      if (d.buildAktiv) { await aktion(() => api("projekte/" + S.p.id + "/build", "PUT", { build: d.buildAktiv })); return; }
      if (d.buildWeg) {
        if (!window.confirm(T.buildLoeschenFrage)) return;
        await aktion(() => api("projekte/" + S.p.id + "/builds/" + encodeURIComponent(d.buildWeg), "DELETE"));
        return;
      }
      if ("stZurueckziehen" in d) { await aktion(() => api("projekte/" + S.p.id + "/zurueckziehen", "POST", {})); return; }
      if ("stVeroeffentlichen" in d) {
        if (!window.confirm(T.veroeffentlichenFrage)) return;
        await aktion(() => api("projekte/" + S.p.id + "/veroeffentlichen", "POST", {}), katalogFrisch);
        return;
      }
      if ("stAuskatalog" in d) {
        if (!window.confirm(T.ausKatalogFrage)) return;
        await aktion(() => api("projekte/" + S.p.id + "/zurueckziehen-live", "POST", {}), katalogFrisch);
        return;
      }
      if ("stLoeschen" in d) {
        if (!window.confirm(T.loeschenFrage(S.p.entwurf.name))) return;
        const { status, daten } = await api("projekte/" + S.p.id, "DELETE", { bestaetigt: true });
        if (status === 200) { S.offen = {}; S.p = null; S.projekte = null; gehe("/studio"); }
        else { S.meldung = { fehler: true, text: fehlerText(daten.fehler) }; meldungZeigen(); }
      }
    });
  }

  // Der Katalog (api/studio/katalog.js) liegt bis zu 30 s im Browser-Cache. Nach
  // dem Veroeffentlichen neu holen, damit die naechste Seite das Spiel schon kennt.
  function katalogFrisch() {
    fetch("/api/studio/katalog.js", { cache: "reload", credentials: "same-origin" }).catch(() => {});
  }

  function gehe(href) {
    if (window.MIWALE_SHOP) window.MIWALE_SHOP.gehe(href);
    else location.assign(href);
  }

  // ---- Einbauen (von shop.js) ------------------------------------------------------
  function einbauen(el, sprache, optionen) {
    const id = (optionen && optionen.id) || null;
    // Ungespeichertes vom vorigen Projekt noch wegschicken.
    if (S.p && S.p.id !== id && Object.keys(S.offen).length) speichern();
    const neuesProjekt = id !== S.id;
    S.el = el;
    S.sprache = sprache === "de" ? "de" : "en";
    S.id = id;
    if (neuesProjekt) {
      S.p = id && S.p && S.p.id === id ? S.p : null;
      S.ladeFehler = null;
      S.meldung = null;
      S.feldFehler = {};
      S.warnungen = {};
      S.slugOffen = false;
      S.offen = {};
      const h = location.hash.replace(/^#/, "");
      S.schritt = SCHRITTE.includes(h) ? h : S.p ? S.schritt : "uebersicht";
      if (!id) S.projekte = null;
    }
    verbinden(el);
    zeichnen();
    // Nur die Sprache gewechselt: nichts neu laden.
    if (!neuesProjekt && S.status && (S.p || !id)) return;
    allesLaden();
  }

  // An- oder abgemeldet: neu laden, wenn das Studio gerade zu sehen ist.
  window.addEventListener("miwale-konto", () => {
    if (!S.el || !S.el.isConnected) return;
    const konto = ID() && ID().konto();
    const vorher = S.status && S.status.konto;
    if (!!konto === !!vorher && (!konto || konto.name === vorher.name)) return;
    S.p = null; S.projekte = null;
    allesLaden();
  });
  // Nicht mit ungespeicherten Aenderungen gehen.
  window.addEventListener("beforeunload", (e) => {
    if (Object.keys(S.offen).length || S.speichert || Object.keys(S.uploads).length) {
      speichern();
      e.preventDefault();
      e.returnValue = "";
    }
  });

  window.MIWALE_STUDIO = { einbauen };
})();
