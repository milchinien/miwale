// Katalog der Spieleseite (miwale.com). Nur was man wirklich spielen kann.
//
// Bewusst getrennt von PROJECTS im Portfolio: dort stehen technische Texte
// fuer Leute, die sich fuer den Bau interessieren, hier Texte fuer Spieler.
// Spiele von GitHub ohne Eintrag hier nimmt tools/sync-games.mjs selbst auf
// (shop/spiele-auto.js); ein Eintrag hier ersetzt den automatischen.
//
// Reihenfolge = "Beliebt". trend setzt die Flamme, neu das Abzeichen "Neu".
// spielen: Adresse, die im Spielfenster geladen wird.
// medien: Trailer und Screenshots im Querformat (assets/games/shop/).
// texte: kurz (neben dem Bild), tags, ueber (Absaetze), features, steuerung.
window.MIWALE_SPIELE = [
  {
    "id": "timberline-idle",
    "name": "Timberline Idle",
    "trend": 1,
    "veroeffentlicht": "2026-10-09",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "/games/timberline-idle/index.html",
    "bild": "assets/games/shop/timberline-preview.jpg",
    "bilder": [
      "assets/games/shop/timberline-1.jpg",
      "assets/games/shop/timberline-2.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/timberline-trailer.webm",
      "poster": "assets/games/shop/timberline-trailer.jpg",
      "screens": [
        "assets/games/shop/timberline-1.jpg",
        "assets/games/shop/timberline-2.jpg",
        "assets/games/shop/timberline-3.jpg",
        "assets/games/shop/timberline-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "Fell trees, carry the timber to your chest, replant the forest and watch your little woodland grow – even while you are away.",
        "tags": [
          "Idle",
          "Management",
          "Incremental",
          "Skill tree"
        ],
        "ueber": [
          "A small meadow surrounded by fog. Lumberjacks chop trees, carry the logs to a chest in the middle and plant new saplings. Sell the timber, buy new plots of land, hire workers and invest in skills.",
          "Workers have colourful traits and levels, and you can set their priorities yourself. A day and night cycle opens up different builds: night owls and early birds work better at different times.",
          "Your forest keeps growing while you are away, up to an upgradable offline cap. Early prototype – more is coming."
        ],
        "features": [
          "Hire workers from a notice board with rare and legendary candidates",
          "Traits that help or hurt, and a level system up to 10",
          "Expand your land plot by plot as the fog recedes",
          "Day and night cycle for different playstyles",
          "Skill trees for your clicks, your workers and your economy",
          "Achievements and offline progress",
          "Three save slots, saved in your browser"
        ],
        "steuerung": "Mouse: click trees and the chest yourself, drag to move the camera, scroll to zoom."
      },
      "de": {
        "kurz": "Fälle Bäume, bring das Holz zur Truhe, pflanze den Wald neu und sieh zu, wie dein kleiner Forst wächst – auch wenn du nicht da bist.",
        "tags": [
          "Idle",
          "Management",
          "Incremental",
          "Skill Tree"
        ],
        "ueber": [
          "Eine kleine Wiese im Nebel. Holzfäller fällen Bäume, tragen die Stämme zur Truhe in der Mitte und pflanzen neue Setzlinge. Verkaufe das Holz, kaufe neues Land, stelle Worker ein und investiere in Skills.",
          "Worker haben farbige Werte und Eigenschaften, und du legst ihre Prioritäten selbst fest. Ein Tag-und-Nacht-System eröffnet verschiedene Builds: Nachteulen und Frühaufsteher arbeiten zu unterschiedlichen Zeiten besser.",
          "Dein Wald wächst auch weiter, wenn du weg bist, bis zu einem verbesserbaren Offline-Limit. Frühe Version – es kommt noch mehr."
        ],
        "features": [
          "Worker vom Schwarzen Brett anheuern, mit seltenen und legendären Kandidaten",
          "Eigenschaften, die helfen oder schaden, und ein Level-System bis 10",
          "Land Plot für Plot erweitern, während der Nebel zurückweicht",
          "Tag-und-Nacht-Zyklus für verschiedene Spielstile",
          "Skill Trees für Klicks, Worker und Wirtschaft",
          "Achievements und Offline-Fortschritt",
          "Drei Speicherstände, im Browser gespeichert"
        ],
        "steuerung": "Maus: Bäume und Truhe selbst anklicken, ziehen zum Verschieben der Kamera, Mausrad zum Zoomen."
      }
    }
  },
  {
    "id": "dropfall",
    "name": "Dropfall",
    "trend": 2,
    "veroeffentlicht": "2026-09-04",
    "geraete": [
      "pc",
      "handy"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "https://milchinien.github.io/Dropfall/",
    "bild": "assets/games/previews/dropfall-v1.jpg",
    "bilder": [
      "assets/games/dropfall-main.jpg",
      "assets/games/dropfall-1.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/dropfall-trailer.webm",
      "poster": "assets/games/shop/dropfall-trailer.jpg",
      "screens": [
        "assets/games/shop/dropfall-1.jpg",
        "assets/games/shop/dropfall-2.jpg",
        "assets/games/shop/dropfall-3.jpg",
        "assets/games/shop/dropfall-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "Drop balls through a field of pegs, collect sparks on every bounce and grow a huge skill tree – one run at a time.",
        "tags": [
          "Idle",
          "Incremental",
          "Roguelite",
          "Skill tree"
        ],
        "ueber": [
          "Balls tumble through an arena of pegs, and every contact pays out sparks. Spend them mid-run to level up your balls, then cash in when your life bar runs dry – only direct peg hits keep you alive.",
          "Between runs you shape your build in a big skill tree: unlock pulse, lightning, fire and buff balls, stretch your life bar, boost payouts. Later you forge elemental enchantments with a perk and a catch.",
          "Thirty arenas wait to be unlocked and mastered, each with its own goals. Early prototype – more is coming. The game's text is currently in German."
        ],
        "features": [
          "Five ball types: white, pulse, lightning, fire and buff",
          "Thirty hand-built arenas with unlock, mastery, speed and endurance goals",
          "A big skill tree that only reveals what you can buy next",
          "Forge: six elemental enchantments, each with an upside and a catch",
          "Detailed results screen that shows which ball carried your run",
          "Playable on PC and on your phone"
        ],
        "steuerung": "Mouse or touch: buy nodes in the skill tree, start runs, and upgrade balls during a run (on PC also with keys 1–5)."
      },
      "de": {
        "kurz": "Lass Kugeln durch ein Feld aus Pegs fallen, sammle bei jedem Aufprall Funken und bau Lauf für Lauf einen riesigen Skill Tree aus.",
        "tags": [
          "Idle",
          "Incremental",
          "Roguelite",
          "Skill Tree"
        ],
        "ueber": [
          "Kugeln prasseln durch eine Arena voller Pegs, und jeder Kontakt bringt Funken. Die steckst du noch im Lauf in stärkere Kugeln – bis die Lebensleiste leer ist. Am Leben halten dich nur direkte Treffer.",
          "Zwischen den Läufen baust du im Skill Tree an deinem Build: Puls-, Blitz-, Feuer- und Buff-Kugel freischalten, mehr Lebenszeit, höhere Auszahlung. Später schmiedest du in der Esse Verzauberungen, die immer einen Vorteil und einen Haken haben.",
          "Dreißig Arenen wollen freigespielt und gemeistert werden, jede mit eigenen Zielen. Früher Prototyp – da kommt noch mehr."
        ],
        "features": [
          "Fünf Kugelarten: Weiß, Puls, Blitz, Feuer und Buff",
          "Dreißig Arenen mit Zielen für Freischaltung, Meisterschaft, Tempo und Ausdauer",
          "Großer Skill Tree, der immer nur den nächsten Schritt aufdeckt",
          "Die Esse: sechs Element-Verzauberungen mit Vorteil und Haken",
          "Auswertung nach jedem Lauf – du siehst sofort, welche Kugel ihn getragen hat",
          "Spielbar am PC und am Handy"
        ],
        "steuerung": "Maus oder Finger: Knoten im Skill Tree kaufen, Läufe starten und Kugeln im Lauf aufwerten (am PC auch mit den Tasten 1–5)."
      }
    }
  },
  {
    "id": "wavebreaker",
    "name": "Wavebreaker",
    "trend": 3,
    "veroeffentlicht": "2026-08-04",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "In polish",
      "de": "Im Feinschliff"
    },
    "spielen": "/games/wavebreaker/index.html",
    "bild": "assets/games/previews/wavebreaker-v1.jpg",
    "bilder": [
      "assets/games/wavebreaker-main.jpg",
      "assets/games/wavebreaker-1.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/wavebreaker-trailer.webm",
      "poster": "assets/games/shop/wavebreaker-trailer.jpg",
      "screens": [
        "assets/games/shop/wavebreaker-1.jpg",
        "assets/games/shop/wavebreaker-2.jpg",
        "assets/games/shop/wavebreaker-3.jpg",
        "assets/games/shop/wavebreaker-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "Build a modular battle station and hold it against endless waves. Your main turret fights on its own – you decide how the station grows.",
        "tags": [
          "Idle",
          "Tower defense",
          "Incremental",
          "Sci-fi"
        ],
        "ueber": [
          "Enemies swarm your station from every direction, wave after wave. The main turret opens fire by itself – your job is the build-out: dock new turrets onto free edges, place buff modules where they boost the most neighbours, and pick up the gold the enemies leave behind.",
          "Turrets come in rarities from Common to Mythic, levels bring perks, and active abilities like Orbital Strike or Time Warp turn a tight wave around. Random events and a passing supply drone offer risky deals.",
          "When you hit a wall, prestige: reset the run, keep your prestige points and unlock permanent upgrades. Leagues raise the stakes further. Close the tab and your station keeps fighting."
        ],
        "features": [
          "Modular station: dock turrets onto free edges and rearrange them anytime",
          "Thirteen turret types, from Autocannon and Tesla Coil to Void Sphere and Drone Bay",
          "Five rarities, level-up perks and five active abilities",
          "Events, a supply drone trader and boss waves",
          "Prestige tree and ten leagues with tougher enemies and bigger rewards",
          "Offline progress: see what your station did while you were away"
        ],
        "steuerung": "Mouse: sweep over the field to collect gold, drag modules onto the station, right-click to remove; keys for game speed, mute, zoom and camera."
      },
      "de": {
        "kurz": "Bau eine modulare Kampfstation und halte sie gegen endlose Wellen. Der Hauptturm kämpft allein – du entscheidest, wie die Station wächst.",
        "tags": [
          "Idle",
          "Tower Defense",
          "Incremental",
          "Sci-Fi"
        ],
        "ueber": [
          "Von allen Seiten fliegen Gegner auf deine Station zu, Welle um Welle. Der Hauptturm feuert von selbst – deine Aufgabe ist der Ausbau: neue Türme an freie Kanten docken, Buff-Module dorthin setzen, wo sie möglichst viele Nachbarn stärken, und das Gold einsammeln, das die Gegner fallen lassen.",
          "Türme gibt es in Raritäten von Common bis Mythic, Level-ups bringen Perks, und aktive Fähigkeiten wie Orbital Strike oder Time Warp retten eine knappe Welle. Zufällige Events und eine vorbeifliegende Versorgungsdrohne locken mit riskanten Angeboten.",
          "Kommst du nicht weiter, gehst du ins Prestige: Lauf zurücksetzen, Prestigepunkte behalten, dauerhafte Upgrades freischalten. Ligen machen es noch härter. Und wenn du den Tab schließt, kämpft deine Station weiter. Die Spieltexte sind auf Englisch."
        ],
        "features": [
          "Modulare Station: Türme an freie Kanten docken und jederzeit umbauen",
          "Dreizehn Turmarten, von Autocannon und Tesla Coil bis Void Sphere und Drone Bay",
          "Fünf Raritäten, Perks beim Level-up und fünf aktive Fähigkeiten",
          "Events, eine Händler-Drohne und Bosswellen",
          "Prestige-Baum und zehn Ligen mit zäheren Gegnern und größeren Belohnungen",
          "Offline-Fortschritt: sieh nach, was deine Station ohne dich geschafft hat"
        ],
        "steuerung": "Maus: über das Feld fahren sammelt Gold, Module an die Station ziehen, Rechtsklick entfernt sie; Tasten für Tempo, Ton, Zoom und Kamera."
      }
    }
  },
  {
    "id": "chromatic",
    "name": "Chromatic 2",
    "trend": 4,
    "veroeffentlicht": "2026-09-29",
    "geraete": [
      "pc",
      "handy"
    ],
    "status": {
      "en": "Playable",
      "de": "Spielbar"
    },
    "spielen": "/games/chromatic/index.html",
    "bild": "assets/games/previews/chromatic-v2.jpg",
    "bilder": [
      "assets/games/shop/chromatic-4.jpg",
      "assets/games/shop/chromatic-3.jpg",
      "assets/games/shop/chromatic-2.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/chromatic-trailer.webm",
      "poster": "assets/games/shop/chromatic-trailer.jpg",
      "screens": [
        "assets/games/shop/chromatic-1.jpg",
        "assets/games/shop/chromatic-2.jpg",
        "assets/games/shop/chromatic-3.jpg",
        "assets/games/shop/chromatic-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "Build an army from your cards and send hundreds of pixel troops into real-time mass battles across four worlds.",
        "tags": [
          "Roguelite",
          "Deckbuilder",
          "Mass battles",
          "Strategy"
        ],
        "ueber": [
          "Choose three factions and reveal a ten-card starting deck. Each round you draw three cards, place two in front and back, then watch hundreds of troops clash in real time.",
          "Matching factions and classes unlock powerful army bonuses. Position, troop count, upgrades and card synergies decide whether your survivors reach the enemy castle.",
          "Travel through four worlds with branching battles, treasure, shops, enchantments and pyres. Chromatic 2 plays in English on desktop and mobile."
        ],
        "features": [
          "Three-card draw: choose a front and back line every round",
          "Real-time pixel battles with hundreds of individually simulated units",
          "Seven factions and class combos with distinct army bonuses",
          "Four branching worlds with battles, treasure, shops, enchantments and bosses",
          "Card upgrades, persistent runs and escalating castle sieges",
          "Responsive desktop and portrait-mobile layouts"
        ],
        "steuerung": "Mouse or touch: choose routes and cards; Space starts or pauses a battle, M toggles sound."
      },
      "de": {
        "kurz": "Baue aus deinen Karten eine Armee und schicke Hunderte Pixeltruppen durch vier Welten in Echtzeit-Massenschlachten.",
        "tags": [
          "Roguelite",
          "Deckbuilder",
          "Massenschlachten",
          "Strategie"
        ],
        "ueber": [
          "Wähle drei Fraktionen und decke dein Startdeck aus zehn Karten auf. Pro Runde ziehst du drei Karten, stellst zwei vorne und hinten auf und siehst Hunderten Truppen beim Echtzeitkampf zu.",
          "Gleiche Fraktionen und Klassen schalten starke Armeeboni frei. Aufstellung, Truppenzahl, Verbesserungen und Kartensynergien entscheiden, ob Überlebende die gegnerische Burg erreichen.",
          "Reise durch vier verzweigte Welten mit Kämpfen, Schätzen, Shops, Verzauberungen und Pyren. Chromatic 2 läuft auf PC und im Handy-Hochformat."
        ],
        "features": [
          "Drei Karten ziehen und jede Runde Front- und Hinterreihe wählen",
          "Echtzeit-Pixelschlachten mit Hunderten einzeln simulierten Einheiten",
          "Sieben Fraktionen und Klassen-Combos mit eigenen Armeeboni",
          "Vier verzweigte Welten mit Kämpfen, Schätzen, Shops, Verzauberungen und Bossen",
          "Kartenverbesserungen, gespeicherte Runs und eskalierende Belagerungen",
          "Angepasste Oberflächen für Desktop und Handy-Hochformat"
        ],
        "steuerung": "Maus oder Touch: Route und Karten wählen; Leertaste startet oder pausiert den Kampf, M schaltet den Ton um."
      }
    }
  },
  {
    "id": "reliktenschieber",
    "name": "Reliktenschieber",
    "neu": true,
    "veroeffentlicht": "2026-09-17",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "/games/reliktenschieber/index.html",
    "bild": "assets/games/previews/reliktenschieber-v1.jpg",
    "bilder": [
      "assets/games/reliktenschieber-main.jpg",
      "assets/games/reliktenschieber-1.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/reliktenschieber-trailer.webm",
      "poster": "assets/games/shop/reliktenschieber-trailer.jpg",
      "screens": [
        "assets/games/shop/reliktenschieber-1.jpg",
        "assets/games/shop/reliktenschieber-2.jpg",
        "assets/games/shop/reliktenschieber-3.jpg",
        "assets/games/shop/reliktenschieber-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "The arcade coin pusher as an idle game: aim your drop, shove the pile over the edge and rescue the treasure chest.",
        "tags": [
          "Idle",
          "Arcade",
          "Physics",
          "Incremental"
        ],
        "ueber": [
          "You know the machine from the arcade: coins drop in, the pusher slides forward, and whatever tips over the edge pays out. Here you aim every throw yourself – and the slot a coin falls into decides between double or nothing.",
          "There is always a treasure chest on the platform. It's heavy and needs several pushes, and just before the edge it shows which slot it would land in. When lots of coins fall at once, combos multiply your payout.",
          "Ten coin types change the pile: magnet coins pull clusters together, sticky coins bond into slabs, blast coins knock everything off, king coins multiply the cascade. Early prototype – more is coming. The game's text is currently in German."
        ],
        "features": [
          "Aim every drop and watch the pile shift with each push",
          "Treasure chests that slowly creep toward the edge",
          "Combos when many coins fall together – up to ×16",
          "Ten coin types, from copper and gold to magnet, blast and chaos coins",
          "Upgrade tree with 51 nodes in five branches",
          "Two looks: autumn and classic"
        ],
        "steuerung": "Mouse to aim, click or hold to drop coins; Space drops at the last spot, 1–0 pick the coin, Tab switches to the upgrade tree."
      },
      "de": {
        "kurz": "Der Münzschieber vom Jahrmarkt als Idle-Spiel: Einwurf zielen, den Haufen über die Kante schieben und die Schatztruhe bergen.",
        "tags": [
          "Idle",
          "Arcade",
          "Physik",
          "Incremental"
        ],
        "ueber": [
          "Du kennst den Automaten vom Jahrmarkt: Münzen fallen hinein, der Schieber rückt vor, und was über die Kante kippt, zahlt aus. Hier zielst du jeden Einwurf selbst – und das Fach, in das eine Münze fällt, entscheidet über doppelt oder gar nichts.",
          "Auf der Plattform liegt immer eine Schatztruhe. Sie ist schwer, braucht mehrere Schübe und zeigt kurz vor der Kante an, in welches Fach sie fallen würde. Fallen viele Münzen auf einmal, vervielfacht eine Combo die Auszahlung.",
          "Zehn Münzarten mischen den Haufen auf: Magnetmünzen ziehen Klumpen zusammen, Klebemünzen verbinden sich zu Platten, Sprengmünzen fegen alles hinunter, Königsmünzen vervielfachen die Kaskade. Früher Prototyp – da kommt noch mehr."
        ],
        "features": [
          "Jeden Einwurf selbst zielen und zusehen, wie der Haufen wandert",
          "Schatztruhen, die sich langsam der Kante nähern",
          "Combos, wenn viele Münzen gemeinsam fallen – bis ×16",
          "Zehn Münzarten, von Kupfer und Gold bis Magnet-, Spreng- und Chaosmünze",
          "Upgrade-Baum mit 51 Knoten in fünf Ästen",
          "Zwei Looks: Herbst und Klassisch"
        ],
        "steuerung": "Maus zum Zielen, Klicken oder Halten wirft ein; Leertaste wirft an die letzte Stelle, 1–0 wählen die Münze, Tab wechselt zum Upgrade-Baum."
      }
    }
  },
  {
    "id": "runecall",
    "name": "Runecall",
    "veroeffentlicht": "2026-08-19",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "/games/runecall/index.html",
    "bild": "assets/games/previews/runecall-v1.jpg",
    "bilder": [
      "assets/games/runecall-main.jpg",
      "assets/games/runecall-1.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/runecall-trailer.webm",
      "poster": "assets/games/shop/runecall-trailer.jpg",
      "screens": [
        "assets/games/shop/runecall-1.jpg",
        "assets/games/shop/runecall-2.jpg",
        "assets/games/shop/runecall-3.jpg",
        "assets/games/shop/runecall-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "A trick-taking card game where you call exactly how many tricks you'll win – one too many is as bad as one too few.",
        "tags": [
          "Card game",
          "Trick-taking",
          "Strategy",
          "Singleplayer"
        ],
        "ueber": [
          "Before every round you predict exactly how many tricks you'll take – then you have to hit that number. Grab tricks when you need them, dodge them when you don't. The classic bidding principle, plus the Wizard, who wins every trick, and the Jester, who wants to win none.",
          "Play at a table against 2 to 5 computer opponents on easy, normal or hard. Set up your own room with free rules, or play a ranked match with a fixed ruleset and climb the ranks.",
          "Optional helpers estimate the strength of your hand and show which cards have already fallen. Playing with friends online isn't available yet – the prototype is single-player for now. The game's text is currently in German."
        ],
        "features": [
          "Call your tricks exactly – every round is a small dare",
          "Special cards: the Wizard wins every trick, the Jester none",
          "3 to 6 players at the table, computer opponents in three difficulty levels",
          "Your own room with adjustable player count and rounds",
          "Ranked matches with rank points",
          "Bidding helper and card-counting helper, switchable anytime"
        ],
        "steuerung": "Mouse: choose your bid and click a card to play it."
      },
      "de": {
        "kurz": "Ein Stichkartenspiel, bei dem du exakt ansagst, wie viele Stiche du holst – einer zu viel ist so schlecht wie einer zu wenig.",
        "tags": [
          "Kartenspiel",
          "Stichspiel",
          "Strategie",
          "Einzelspieler"
        ],
        "ueber": [
          "Vor jeder Runde sagst du genau voraus, wie viele Stiche du gewinnst – und dann musst du diese Zahl treffen. Stiche holen, wenn du sie brauchst, und ausweichen, wenn nicht. Das klassische Stichansage-Prinzip, dazu der Magier, der jeden Stich gewinnt, und der Narr, der keinen will.",
          "Du sitzt am Tisch mit 2 bis 5 Computergegnern – leicht, normal oder schwer. Erstell einen eigenen Raum mit freien Regeln oder spiel eine gewertete Partie mit festem Regelsatz und steig im Rang auf.",
          "Auf Wunsch schätzt eine Ansage-Hilfe deine Hand ein, und eine Kartenzähl-Hilfe zeigt, was schon gefallen ist. Online mit Freunden geht noch nicht – der Prototyp ist vorerst ein Spiel gegen Bots."
        ],
        "features": [
          "Stiche exakt ansagen – jede Runde eine kleine Mutprobe",
          "Sonderkarten: Der Magier gewinnt jeden Stich, der Narr keinen",
          "3 bis 6 Spieler am Tisch, Computergegner in drei Stärken",
          "Eigener Raum mit einstellbarer Spieler- und Rundenzahl",
          "Gewertete Partien mit Rangpunkten",
          "Ansage-Hilfe und Kartenzähl-Hilfe, jederzeit umschaltbar"
        ],
        "steuerung": "Maus: Ansage wählen und Karte anklicken, um sie auszuspielen."
      }
    }
  },
  {
    "id": "harmonics",
    "name": "Harmonics",
    "veroeffentlicht": "2026-09-04",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "Early prototype",
      "de": "Früher Prototyp"
    },
    "spielen": "/games/harmonics/index.html",
    "bild": "assets/games/previews/harmonics-v1.jpg",
    "bilder": [
      "assets/games/harmonics-main.jpg",
      "assets/games/harmonics-1.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/harmonics-trailer.webm",
      "poster": "assets/games/shop/harmonics-trailer.jpg",
      "screens": [
        "assets/games/shop/harmonics-1.jpg",
        "assets/games/shop/harmonics-2.jpg",
        "assets/games/shop/harmonics-3.jpg",
        "assets/games/shop/harmonics-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "A calm idle game about rhythm: nodes orbit on rings, and when several line up at once, they pay out – the more, the bigger.",
        "tags": [
          "Idle",
          "Incremental",
          "Relaxing",
          "Prototype"
        ],
        "ueber": [
          "Nodes circle the core on rings with different speeds. Whenever several of them pass through the same line at the same moment, you earn echo – and every extra node in the lineup makes the payout grow exponentially.",
          "You don't fight anything. You tune a clockwork: add rings and nodes, adjust orbit times, reverse directions. A forecast shows when the next big convergence is coming, so you can watch it build up.",
          "The clockwork keeps ticking while the game is closed. Early prototype – more is coming. The game's text is currently in German."
        ],
        "features": [
          "Payouts grow exponentially with every node that joins a lineup",
          "Forecast of the next convergence – see the big moment coming",
          "Upgrade tree: new rings, more nodes, retuned orbits, reversed directions",
          "Chase your record for the biggest convergence",
          "Keeps earning while you're away"
        ],
        "steuerung": "Mouse: click nodes in the upgrade tree to buy them; U switches between the clockwork and the upgrades."
      },
      "de": {
        "kurz": "Ein ruhiges Idle-Spiel über Rhythmus: Knoten kreisen auf Ringen, und wenn mehrere gleichzeitig auf einer Linie liegen, zahlen sie aus.",
        "tags": [
          "Idle",
          "Incremental",
          "Entspannt",
          "Prototyp"
        ],
        "ueber": [
          "Knoten kreisen auf Ringen mit unterschiedlichem Tempo um den Kern. Immer wenn mehrere gleichzeitig durch dieselbe Linie laufen, gibt es Echo – und jeder weitere Knoten in der Reihe lässt die Auszahlung exponentiell wachsen.",
          "Du kämpfst gegen nichts. Du stimmst ein Uhrwerk: Ringe und Knoten dazubauen, Umlaufzeiten justieren, Drehrichtungen umkehren. Eine Vorschau zeigt, wann die nächste große Konvergenz kommt – du siehst sie kommen.",
          "Das Uhrwerk läuft weiter, auch wenn das Spiel geschlossen ist. Früher Prototyp – da kommt noch mehr."
        ],
        "features": [
          "Auszahlungen wachsen exponentiell mit jedem Knoten in der Reihe",
          "Vorschau auf die nächste Konvergenz – der große Moment kündigt sich an",
          "Ausbaubaum: neue Ringe, mehr Knoten, justierte Bahnen, umgekehrte Drehrichtung",
          "Jag deinen Rekord für die größte Konvergenz",
          "Verdient weiter, während du weg bist"
        ],
        "steuerung": "Maus: Knoten im Ausbaubaum anklicken und kaufen; U wechselt zwischen Uhrwerk und Upgrades."
      }
    }
  },
  {
    "id": "mathuniverse",
    "name": "Michis Mathe Universe",
    "veroeffentlicht": "2025-08-15",
    "geraete": [
      "pc"
    ],
    "status": {
      "en": "Playable",
      "de": "Spielbar"
    },
    "spielen": "https://milchinien.github.io/michi-math-universe/",
    "bild": "assets/games/previews/mathuniverse-v1.jpg",
    "bilder": [
      "assets/games/mathuniverse-main.jpg"
    ],
    "medien": {
      "trailer": "assets/games/shop/mathuniverse-trailer.webm",
      "poster": "assets/games/shop/mathuniverse-trailer.jpg",
      "screens": [
        "assets/games/shop/mathuniverse-1.jpg",
        "assets/games/shop/mathuniverse-2.jpg",
        "assets/games/shop/mathuniverse-3.jpg",
        "assets/games/shop/mathuniverse-4.jpg"
      ]
    },
    "texte": {
      "en": {
        "kurz": "Three small browser games about the basics of calculus – race along asymptotes, shoot pole monsters and spray function graphs.",
        "tags": [
          "Learning",
          "Math",
          "Arcade",
          "Puzzle"
        ],
        "ueber": [
          "Michis Mathe Universe turns calculus topics into quick arcade games. In Asymptoten-Raserei your car drives along a function graph on its own – brake, speed up and jump over gaps while asymptotes give you a boost.",
          "In Polstellen-Panik function monsters close in on you: shoot only the dangerous ones with a pole at x = 0, and catch the disguised ones for power-ups. In Funktions-Graffiti you build a function from numerator and denominator and spray its graph through the target points.",
          "Made for students in the German school system – all games are in German. Free to play, no sign-up."
        ],
        "features": [
          "Three games in one collection, straight in the browser",
          "Asymptoten-Raserei: a graph racer with levels, lives and boosts",
          "Polstellen-Panik: tell real poles from removable gaps – under pressure",
          "Funktions-Graffiti: build functions and hit targets while avoiding no-go zones",
          "Hints and solutions when you get stuck",
          "No sign-up needed"
        ],
        "steuerung": "Depends on the game: arrow keys and Space in Asymptoten-Raserei, mouse aim and click in Polstellen-Panik, mouse clicks in Funktions-Graffiti."
      },
      "de": {
        "kurz": "Drei kleine Browserspiele rund um die Analysis – rase über Asymptoten, schieß Polstellen-Monster ab und sprüh Funktionsgraphen.",
        "tags": [
          "Lernspiel",
          "Mathe",
          "Arcade",
          "Knobelspiel"
        ],
        "ueber": [
          "Michis Mathe Universe macht aus Analysis-Themen kurze Arcade-Spiele. In der Asymptoten-Raserei fährt dein Wagen von allein über einen Funktionsgraphen – du bremst, gibst Gas und springst über Lücken, während Asymptoten dir einen Boost geben.",
          "In der Polstellen-Panik rücken Funktions-Monster an: Schieß nur die gefährlichen mit Polstelle bei x = 0 ab, die getarnten mit hebbarer Lücke bringen Power-ups. Im Funktions-Graffiti baust du aus Zähler und Nenner eine Funktion und sprühst ihren Graphen durch die Zielpunkte.",
          "Gedacht für Schülerinnen und Schüler der Oberstufe. Kostenlos, ohne Anmeldung."
        ],
        "features": [
          "Drei Spiele in einer Sammlung, direkt im Browser",
          "Asymptoten-Raserei: Graphen-Rennen mit Levels, Leben und Boosts",
          "Polstellen-Panik: Polstelle oder hebbare Lücke – unter Zeitdruck erkennen",
          "Funktions-Graffiti: Funktionen bauen, Ziele treffen, Sperrzonen meiden",
          "Hinweise und Lösungen, wenn du nicht weiterkommst",
          "Keine Anmeldung nötig"
        ],
        "steuerung": "Je nach Spiel: Pfeiltasten und Leertaste in der Asymptoten-Raserei, mit der Maus zielen und klicken in der Polstellen-Panik, Mausklicks im Funktions-Graffiti."
      }
    }
  }
];
