// Würfelglück – Tutorial mit Jonny, dem Würfel-Tutor.
// Ein vollständig geskripteter Run (Stage 1: Warm-up, High Stakes, Showdown), der nur einmal gespielt werden kann.
// Jonny ist ein Nerd mit Brille: ängstlich, paranoid, schnell beleidigt und passiv-aggressiv. Alles, was der Spieler tut,
// ohne dass Jonny es gesagt hat, zählt als Fehler und macht ihn wütender. Nach MAX_MISTAKES gibt er auf und macht gelangweilt
// weiter. Ab und zu fällt er aus der Rolle und spricht mit dem Menschen vor dem Bildschirm, dann räuspert er sich.
//
// Textauszeichnung in Sätzen: {flags|Text}. Flags: s = zittern, w = wellen, d = durchhängen, b = groß, r = rot,
// q = leise, g = Begriff (gold), c = Pips (blau), m = Power (rot), p = pulsieren
(() => {
  'use strict';

  window.WGTutorial = function (K) {
    const { S, eng, UI, P, R, B } = K;
    const sfx = (n, o) => K.sfx(n, o);
    const MAX_MISTAKES = 8;
    const TIP = { x: 184, y: 578, w: 814, h: 120 };      // Sprechblase
    const FACE = { x: 42, y: 574, s: 1.875 };            // Porträt (64 px × s)
    // Handy: Plätze, Knöpfe und Schriftgröße kommen aus dem Layout (ui/layout-mobile.js, L.tut)
    const MOB = !!K.mobile;
    const LT = () => (MOB && K.L() && K.L().tut) || null;
    const tipBox = () => (LT() ? LT().tip : TIP);
    const faceBox = () => (LT() ? LT().face : FACE);
    const FONT_K = () => (LT() ? LT().font : 1);
    const dim = (ctx, a) => { if (K.dim) K.dim(ctx, a); else { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); } };
    // Auf dem Handy wird getippt statt geklickt, und Tooltips öffnen sich per langem Druck
    const MOBILE_TEXT = [
      [/point at \{g\|Triple Threat\} and keep the mouse still\. A little \{g\|ring\} fills up\./, 'touch {g|Triple Threat} and {g|keep holding}. A box with all the details pops up.'],
      [/When it is full, the box stays open and you can point at the underlined words for more\./, 'Tap the underlined words in it for more. Tap anywhere else to close it.'],
      [/Point at a card until the ring is full/, 'Touch and hold a card'],
      [/Point at a relic/, 'Touch and hold a relic'],
      [/The ring tooltips will\. Point at anything and wait for the ring\./, 'The tooltips will. Touch and hold anything to read about it.'],
      [/\bClick\b/g, 'Tap'], [/\bclick\b/g, 'tap'], [/\bclicking\b/g, 'tapping'], [/\bthe mouse\b/g, 'your finger'],
    ];
    const mobText = (text) => (MOB ? MOBILE_TEXT.reduce((t, [re, to]) => t.replace(re, to), text) : text);

    // ── Zustand ───────────────────────────────────────────────────────────
    let active = false, modal = false, finished = false;
    let steps = [], si = -1, li = 0;                     // aktueller Schritt und Satz
    let queue = [];                                      // Einwürfe (Reaktionen), vor den Sätzen des Schritts
    let cur = null;                                      // angezeigter Satz { words, mood, shown, t0, auto, fourth, ... }
    let mistakes = 0, lastMistake = -9, gaveUp = false, lastAction = 0, idleCount = 0;
    let intro = [];                                      // Begrüßung bei wiederholtem Tutorial
    let totalMistakes = 0, everGaveUp = false, correctStreak = 0, unfairCount = 0, sinceUnfair = 0;
    let round = 0, handInRound = -1, rerollNo = 0, shopNo = 0, lastScore = 0;
    let promptCb = null, promptChoice = null, pending = -1;   // pending: Anker, zu dem nach dem aktuellen Satz gesprungen wird

    // ── Text: Auszeichnung zerlegen ───────────────────────────────────────
    function parse(text) {
      const words = [];
      const re = /\{([a-z]+)\|([^}]*)\}|([^{]+)/g;
      let m;
      while ((m = re.exec(text))) {
        const flags = m[1] || '', body = m[1] ? m[2] : m[3];
        body.split(/(\s+)/).forEach((w) => { if (w) words.push({ t: w, f: flags, space: !w.trim() }); });
      }
      return words;
    }
    const val = (x) => (typeof x === 'function' ? x() : x);

    // Stimmung des Satzes: je mehr Fehler, desto gereizter werden auch die normalen Sätze
    function moodFor(base, reaction) {
      if (reaction) return base;
      if (gaveUp && base !== 'fourth') return 'bored';
      const calm = ['neutral', 'happy', 'excited', 'smug'];
      if (mistakes >= 7 && calm.includes(base)) return 'furious';
      if (mistakes >= 5 && calm.includes(base)) return 'angry';
      if (mistakes >= 3 && base === 'neutral') return 'annoyed';
      return base;
    }
    const BORED_FILLER = ['Anyway.', 'Yeah.', '*yawn*', 'Whatever.', 'Mhm.', 'So.'];
    function show(line, reaction) {
      let text = mobText(val(line.text));
      const mood = moodFor(line.mood || 'neutral', reaction);
      // Nach dem Aufgeben: Effekte weg, gelangweilte Einleitung
      if (gaveUp && !reaction && line.mood !== 'fourth') text = BORED_FILLER[(Math.random() * BORED_FILLER.length) | 0] + ' ' + text.replace(/\{[a-z]+\|([^}]*)\}/g, (_, x) => '{g|' + x + '}');
      cur = { words: parse(text), mood, shown: 0, t0: eng.time, reaction: !!reaction, line, done: false, chars: text.replace(/\{[a-z]+\||\}/g, '').length };
      cur.layout = null;
      if (mood === 'fourth') sfx('page');
    }

    // ── Ablauf ────────────────────────────────────────────────────────────
    function enterStep(i) {
      si = i; li = 0;
      const st = steps[si];
      if (!st) return;
      if (st.enter) st.enter();
      let lines = val(st.say) || [];
      if (intro.length && st.anchor === 'r0h0') { lines = intro.concat(lines); intro = []; }
      st._lines = lines;
      if (lines.length) show(lines[0]); else cur = null;
      if (!lines.length && st.wait === 'click') next();
    }
    function next() { if (pending > si) { const k = pending; pending = -1; enterStep(k); } else enterStep(si + 1); }
    // Zu einem Anker springen; spricht Jonny gerade noch, erst danach
    function jump(k) {
      if (k <= si) return;
      const st = step();
      if (st && st.wait === 'click' && cur && !cur.reaction) pending = k; else { pending = -1; enterStep(k); }
    }
    const step = () => steps[si];
    const lastLine = () => { const st = step(); return !st || li >= (st._lines || []).length - 1; };

    // Klick auf die Sprechblase: Satz fertig tippen, sonst weiter
    function advance() {
      if (!cur) return;
      if (cur.shown < cur.chars) { cur.shown = cur.chars; return; }
      if (cur.reaction) { popQueue(); return; }
      const st = step();
      if (!st) return;
      if (!lastLine()) { li++; show(st._lines[li]); return; }
      if (st.final) return;   // bleibt stehen bis "Finish"
      if (st.wait === 'click') next();
    }
    function popQueue() {
      const q = queue.shift();
      if (q) { show(q.line, true); if (q.after) q.after(); return; }
      // zurück zum Satz des Schritts, ohne erneut zu tippen
      const st = step();
      if (st && st._lines && st._lines[li]) { show(st._lines[li]); cur.shown = cur.chars; } else cur = null;
    }
    // urgent: ältere, noch wartende Reaktionen verwerfen und sofort reagieren (sonst hinkt Jonny hinterher)
    function interject(lines, after, urgent) {
      const wasIdle = !cur || !cur.reaction;
      if (urgent) queue = [];
      lines.forEach((l, k) => queue.push({ line: l, after: k === lines.length - 1 ? after : null }));
      if (wasIdle || urgent) popQueue();
    }

    // ── Fehler und Reaktionen ─────────────────────────────────────────────
    const pick = (a) => a[(Math.random() * a.length) | 0];
    const tier = () => (mistakes <= 2 ? 0 : mistakes <= 4 ? 1 : mistakes <= 6 ? 2 : 3);
    const TIER_MOOD = ['annoyed', 'angry', 'angry', 'furious'];
    const REACT = {
      wrongHold: [
        (d) => `Hmm. That's a {g|${d.v}}. Not what I asked for. But hey, you're new. It's not your fault.`,
        (d) => `Another wrong die. A {g|${d.v}}. {d|Wonderful.} I'm sure you had your reasons. {q|Bad ones.}`,
        () => '{sr|STOP} clicking random dice! Do you press random buttons in elevators too?!',
        () => "I'm going to count to three. {s|One.} {s|Two.} ...I don't know what happens at three. {sr|NOBODY KNOWS.}",
      ],
      fiddle: [
        () => "Ahem. I'm still {g|talking}. But sure, click things. I'll wait. {q|I'm good at waiting.}",
        () => "You know there's a little {g|arrow} when I'm done, right? {d|Right?}",
        () => '{s|LET} {s|ME} {sr|FINISH!}',
        () => '{sr|I AM A PERSON WITH FEELINGS!} ...technically a sprite. {s|BUT STILL!}',
      ],
      rerollEarly: [
        () => "Whoa, whoa! I didn't say {g|reroll} yet. It's okay. Newbies get excited. Like puppies.",
        () => 'You rerolled. Again. Without asking. {d|Rude.} But I forgive you. {q|I don\'t.}',
        () => 'THE REROLL BUTTON IS NOT A {sr|STRESS BALL!}',
        () => 'Every wasted reroll, a tutor somewhere {sr|loses a hair}. LOOK AT MY HAIR!',
      ],
      play: [
        () => "Oh! You played it. Already. Without me. That's... {d|fine}. Totally fine. I'll just stand here.",
        () => "You keep playing without me. Is it something I said? {q|It's always something I said.}",
        () => 'I WAS {sr|TALKING!}',
        () => "{sr|I MADE SLIDES!} I made {s|SLIDES} for this and you're just {s|PLAYING HANDS!}",
      ],
      buy: [
        (d) => `You bought {g|${d.name}}. Not part of the plan. But sure. Your money. {q|It was MY money.}`,
        () => 'Shopping spree, huh? With my allowance? {d|Cool. Cool cool cool.}',
        () => "{sr|STOP BUYING THINGS} I DIDN'T POINT AT!",
        () => "Fine! Buy the whole shop! Buy the {s|building}! {sr|I DON'T CARE!}",
      ],
      sell: [
        (d) => `You sold {g|${d.name}}?! I picked that out for you. {d|By hand.} With my {d|hands}.`,
        () => "Selling my gifts. Okay. I'll just add that to {g|the list}. {q|There is a list.}",
        () => '{sr|YOU SOLD MY GIFT!} My mom was right about people!',
        () => "Sell everything! Sell {s|ME}! {sr|I'M PROBABLY WORTH $2!}",
      ],
      shopReroll: [
        () => "You rerolled the shop. Spoiler: it's {g|rigged}. Same stuff comes back. {q|Everything here is rigged. Forget I said that.}",
        () => 'Rerolling a rigged shop. Bold. {d|Pointless}, but bold.',
        () => "IT'S THE SAME ITEMS! IT WILL {sr|ALWAYS} BE THE SAME ITEMS!",
        () => '{sr|THE DEFINITION OF INSANITY!} Look it up! {s|I HAVE.}',
      ],
      leave: [
        () => "You're leaving?! Without the build? Here. I'll just {g|give} it to you. For free. {d|Like a pushover.}",
        () => 'Leaving early. Again. {d|Here are your free things.} Enjoy them. {q|Ingrate.}',
        () => '{sr|TAKE THE RELICS.} TAKE THEM AND GO!',
        () => "Just take it! Take it all! {sr|I DON'T EVEN WANT IT!}",
      ],
      drag: [
        () => "Rearranging furniture, I see. Order matters for {g|some} relics. Not these. But I respect the energy.",
        () => 'Still rearranging. Do you also sort your socks by colour? {q|...me too, actually.}',
        () => '{s|STOP} MOVING THE {sr|FURNITURE!}',
        () => "{sr|IT'S NOT A PUZZLE GAME!}",
      ],
      badHold: [
        () => 'You rerolled without holding the right dice. Bold strategy. {q|Wrong, but bold.}',
        () => 'The dice I {s|pointed} at. With the {s|arrow}. The big, {s|golden} arrow.',
        () => '{sr|HOLD.} {sr|THE.} {sr|RIGHT.} {sr|DICE.}',
        () => "I'm going to start charging for this. {sr|PER MISTAKE.}",
      ],
      use: [
        () => "Using things without being told. Independent. Reckless. {d|Like my cousin Gerald.}",
        () => 'We talked about this. We did {s|not} talk about this. {d|But we should have.}',
        () => '{sr|WHY} DO YOU DO THINGS!',
        () => '{sr|I AM LOSING MY MIND} AND IT IS A {s|VERY} GOOD MIND!',
      ],
    };
    // Ersatzsätze pro Wut-Stufe, damit sich Jonny nicht wiederholt
    const GENERIC = [
      ["That's okay! Everyone starts somewhere. Usually somewhere {d|better}, but still.", 'Interesting choice. {q|Wrong, but interesting.}', "No, no, go ahead. I'll just... {d|update my notes}."],
      ['Are you doing this {s|on purpose}? Blink twice if you are doing this on purpose.', 'I {s|practised} this tutorial in the {s|mirror}. {d|For weeks.}', 'Okay. Deep breaths, Jonny. {q|In... out...} {s|IN... OUT...}'],
      ['{sr|WHY} ARE YOU LIKE THIS?!', 'My therapist said this would happen. {sr|SHE WAS RIGHT!}', 'I am writing this down. {sr|IN PEN.}'],
      ["{sr|I'M CALM!} I'M VERY CALM! THIS IS MY {s|CALM FACE!}", '{sr|AAAAAAAAH!} ...sorry. {sr|AAAAAAH!}'],
    ];
    let lastReact = '';
    const BORED = ['Mhm.', 'Yep. Sure. Do that.', '*yawn* Great choice. Probably.', "I'm not even mad. I'm just {d|tired}.", 'Cool. Cool cool.', 'You do you.', 'Fascinating. {q|Not really.}'];

    function mistake(type, data) {
      const now = performance.now() / 1000;
      if (now - lastMistake < 0.8) return;          // Doppelklicks nicht doppelt zählen (echte Zeit)
      lastMistake = now;
      totalMistakes++;
      correctStreak = 0;
      if (gaveUp) { interject([{ mood: 'bored', text: pick(BORED) }], null, true); return; }
      mistakes++;
      if (mistakes >= MAX_MISTAKES) {
        gaveUp = true; everGaveUp = true;
        interject([
          { mood: 'furious', text: '{sr|THAT\'S IT!} That is mistake number {b|' + mistakes + '}! I counted! {s|I ALWAYS COUNT!}' },
          { mood: 'disappointed', text: "You know what? {d|I give up.} I'm going to read my script, and you're going to do... whatever {d|that} is." },
          { mood: 'bored', text: '{d|Wheee.} Tutorial. Fun.' },
        ], null, true);
        return;
      }
      const t = tier(), list = REACT[type] || REACT.fiddle;
      let text = list[Math.min(t, list.length - 1)](data || {});
      if (text === lastReact) text = pick(GENERIC[t].filter((x) => x !== lastReact));
      lastReact = text;
      const lines = [{ mood: TIER_MOOD[t], text }];
      // Jonny erinnert gern daran, dass wir Anfänger sind
      if (t === 0 && Math.random() < 0.4) lines.push({ mood: 'smug', text: pick(["Remember: you're a {g|newbie}. Mistakes are expected. {q|Constantly, apparently.}", "It's not your fault. Some people are just... {d|beginners}. Forever.", "No no, it's fine. I was new once too. For about {g|four minutes}."]) });
      sfx(t >= 2 ? 'deny' : 'card');
      if (t >= 2) eng.shake(t === 3 ? 6 : 3);
      interject(lines, null, true);
    }

    // ── Richtige Züge ─────────────────────────────────────────────────────
    // Nach dem Aufgeben: drei richtige Züge in Folge holen Jonny zurück (Zähler wieder bei null).
    // Sonst wird er ab und zu grundlos wütend, obwohl alles richtig war (zählt nicht als Fehler).
    const UNFAIR = [
      [['angry', 'You did it! {s|Correctly!} Do you know how long I {s|rehearsed} explaining that?! {sr|WEEKS!}'], ['nervous', '...sorry. That was good. Good job. {q|*ahem*}']],
      [['annoyed', 'Did you have to click it so {s|HARD}? The dice have {g|feelings}. {q|Probably.}'], ['neutral', '{q|*ahem*} Anyway. Correct.']],
      [['angry', 'Perfect. Flawless. Now I look {sr|USELESS}. {s|THANKS.}'], ['disappointed', "{d|I'm happy for you. Really.}"]],
      [['furious', '{sr|WHY} DOES THAT MAKE ME SO {sr|ANGRY?!}'], ['nervous', "I'm fine. That was right. {q|I need a snack.}"]],
      [['paranoid', 'That was {s|too} correct. Who told you? {s|WHO TOLD YOU?!}'], ['neutral', '...the script. I told you. Right. {q|*ahem*}']],
      [['angry', 'You did that with so much {s|confidence}. Confident people make me {sr|NERVOUS!}'], ['smug', 'Carry on. {q|Show-off.}']],
    ];
    let unfairLeft = UNFAIR.slice();
    function correct() {
      if (gaveUp) {
        correctStreak++;
        if (correctStreak >= 3) { recover(); return; }
        if (correctStreak === 2) interject([{ mood: 'bored', text: pick(['...huh. That was right.', 'Correct. {q|Again.} Suspicious.', 'Oh. You did the thing. {d|Neat.}']) }]);
        return;
      }
      sinceUnfair++;
      if (unfairLeft.length && unfairCount < 3 && sinceUnfair >= 2 && Math.random() < 0.25) {
        sinceUnfair = 0; unfairCount++;
        const u = unfairLeft.splice((Math.random() * unfairLeft.length) | 0, 1)[0];
        if (u[0][0] === 'furious' || u[0][0] === 'angry') eng.shake(3);
        interject(u.map(([mood, text]) => ({ mood, text })));
      }
    }
    function recover() {
      gaveUp = false; mistakes = 0; correctStreak = 0; lastReact = '';
      sfx('chime');
      interject([
        { mood: 'shocked', text: 'Wait. Wait wait wait. That was {b|three} correct moves in a row.' },
        { mood: 'excited', text: "{w|I'M BACK!} New me! Fresh start! The mistake counter is {g|zero} again!" },
        { mood: 'nervous', text: "{q|Please don't make me regret this.}" },
      ], null, true);
    }

    // ── Spieler-Aktionen und Spiel-Ereignisse ─────────────────────────────
    const ACTIONS = ['hold', 'unhold', 'reroll', 'play', 'buy', 'sell', 'use', 'shopReroll', 'leaveShop', 'drag', 'vault'];
    const TYPE = { hold: 'wrongHold', unhold: 'fiddle', reroll: 'rerollEarly', play: 'play', buy: 'buy', sell: 'sell', use: 'use', shopReroll: 'shopReroll', leaveShop: 'leave', drag: 'drag', vault: 'fiddle' };

    function event(name, data = {}) {
      if (!active) return;
      // Ist das Spiel schon weiter (neue Hand, Shop), zählt die Aktion für die neue Lage
      if (ACTIONS.includes(name) && pending > si) { const k = pending; pending = -1; enterStep(k); }
      const st = step();
      if (ACTIONS.includes(name)) {
        lastAction = eng.time;
        if (name === 'leaveShop') giveMissing();
        if (st && st.wait && typeof st.wait === 'function' && st.wait(name, data)) {
          const before = totalMistakes;
          if (st.done) st.done(name, data);
          next();
          if (totalMistakes === before) correct();
          return;
        }
        if (st && st.ok && st.ok(name, data)) return;            // Teilschritt in die richtige Richtung
        // Vorauseilen: passt die Aktion zu einem der nächsten Schritte, dorthin springen (kein Fehler)
        for (let k = si + 1; k < Math.min(steps.length, si + 4); k++) {
          const s2 = steps[k];
          if (s2.anchor) break;
          // Teilschritt einer der nächsten Aufgaben (z. B. schon den ersten richtigen Würfel halten): einfach dorthin
          if (s2.ok && s2.ok(name, data)) { enterStep(k); return; }
          if (typeof s2.wait === 'function' && s2.wait(name, data)) {
            interject([{ mood: 'smug', text: pick(['Skipping ahead, are we? {d|Fine.} Show-off.', "Oh, you're ahead of me. {q|I hate that.}", 'Okay, Mister Speedrun. Or Miss. Or... {q|I don\'t know who you are. That\'s the scary part.}']) }]);
            if (s2.done) s2.done(name, data);
            enterStep(k + 1);
            if (gaveUp) correct();
            return;
          }
        }
        mistake(name === 'hold' && st && st.expectsHold ? 'wrongHold' : name === 'hold' ? 'fiddle' : TYPE[name], data);
        return;
      }
      // System-Ereignisse: zum passenden Anker im Skript springen
      if (name === 'handReady') {
        const key = 'r' + round + 'h' + handInRound;
        const k = steps.findIndex((s2, j) => j > si && s2.anchor === key);
        if (k >= 0) { jump(k); return; }
        if (st && st.wait === 'handReady') { next(); return; }
        if (handInRound > 0 && !(st && st.anchor === key)) {
          // zusätzliche Hand ohne Skript: zum Ende der Runde springen
          const w = steps.findIndex((s2, j) => j > si && s2.anchor === 'won' + round);
          if (w > si + 1) enterStep(w - 1);
          interject([{ mood: gaveUp ? 'bored' : 'neutral', text: 'New hand. You know the drill: {g|hold}, {g|reroll}, {g|play}. {q|Please.}' }]);
        }
        return;
      }
      if (name === 'scored') {
        lastScore = data.total || 0;
        if (st && st.wait === 'scored') next();
        return;
      }
      if (name === 'roundWon') {
        const k = steps.findIndex((s2, j) => j > si && s2.anchor === 'won' + round);
        if (k >= 0) jump(k);
        return;
      }
      if (name === 'shop') {
        shopNo++;
        const k = steps.findIndex((s2, j) => j > si && s2.anchor === 'shop' + shopNo);
        if (k >= 0) jump(k);
        return;
      }
      if (name === 'tipPinned' && st && st.wait === 'tipPinned') { next(); return; }
    }

    // Was der Build braucht: fehlt etwas beim Verlassen des Shops, schenkt Jonny es
    const BUILD = { 1: ['triple_threat', 'twin_peaks'], 2: ['combo'] };
    function giveMissing() {
      const want = [].concat(...Object.keys(BUILD).filter((n) => +n <= shopNo).map((n) => BUILD[n]));
      const given = [];
      want.forEach((id) => { if (!S.relics.some((r) => r.id === id) && S.relics.length < R.MAX_RELICS) { K.addRelic(id); given.push(R.RELIC_BY_ID[id].name); } });
      if (shopNo >= 1 && (S.levels['Three of a Kind'] || 1) < 2) S.levels['Three of a Kind'] = 2;
      // verkaufte Build-Relikte kommen zurück, mit Kommentar
      if (given.length && step() && typeof step().wait === 'function' && step().wait('leaveShop', {})) {
        interject([{ mood: 'annoyed', text: 'Oh, and here is {g|' + given.join('} and {g|') + "} back. You're welcome. {q|I'm still upset.}" }]);
      }
    }

    // ── Gezinkte Würfel und Shop ──────────────────────────────────────────
    // Pro Runde und Hand: erster Wurf und Ergebnisse der Neu-Würfe (nach Position)
    const ROLLS = {
      'r0h0': { init: [4, 2, 4, 6, 1], rerolls: [[4, 4, 4, 6, 2], [4, 4, 4, 4, 2], [4, 4, 4, 4, 4]] },
      'r0h1': { init: [6, 3, 6, 6, 2], rerolls: [[6, 5, 6, 6, 6], [6, 6, 6, 6, 6]] },
      'r1h0': { init: [2, 2, 5, 2, 4], rerolls: [[2, 2, 2, 2, 6], [2, 2, 2, 2, 2]] },
      'r2h0': { init: [1, 3, 1, 3, 3], rerolls: [[6, 3, 3, 3, 3], [3, 3, 3, 3, 3]] },
    };
    const FALLBACK = { init: [5, 2, 5, 3, 5], rerolls: [[5, 5, 5, 6, 5], [5, 5, 5, 5, 5]] };
    function beginHand() { handInRound++; rerollNo = 0; }
    function beginReroll() { rerollNo++; }
    function rig(idx, initial) {
      const sc = ROLLS['r' + round + 'h' + handInRound] || FALLBACK;
      const vals = initial ? sc.init : sc.rerolls[Math.min(rerollNo, sc.rerolls.length) - 1] || sc.rerolls[sc.rerolls.length - 1];
      const out = {};
      idx.forEach((i) => {
        const die = K.dice()[i].data.die, v = vals[i % vals.length];
        let up = die.faces.findIndex((f) => f.v === v && !R.isSkull(f));
        if (up < 0) up = die.faces.findIndex((f) => f.kind === 'wild');
        out[i] = { up: up < 0 ? 0 : up, lucky: false };
      });
      return out;
    }
    const relicItem = (id) => ({ type: 'relic', id, price: R.RELIC_BY_ID[id].cost });
    const SHOPS = {
      1: () => [relicItem('triple_threat'), relicItem('twin_peaks'), { type: 'constellation', hand: 'Three of a Kind', price: 3 },
        { type: 'die', dieType: 'lucky', die: R.makeDie('lucky'), price: R.DIE_TYPES.lucky.cost }],
      2: () => [relicItem('combo'), { type: 'oracle', id: 'ascend', price: 3 }, { type: 'tally', n: 2, price: 3 },
        { type: 'die', dieType: 'gilded', die: R.makeDie('gilded'), price: R.DIE_TYPES.gilded.cost }],
    };
    function shopItem(k) {
      const list = (SHOPS[shopNo] || SHOPS[2])();
      const it = list[k];
      if (!it) return null;
      if (it.type === 'relic' && S.relics.some((r) => r.id === it.id)) return null;   // schon gekauft
      return it;
    }

    // ── Das Skript ────────────────────────────────────────────────────────
    const L = (mood, text, point) => ({ mood, text, point });
    const isHand = (name) => K.preview() && K.preview().name === name;
    const heldIs = (vals) => { const d = K.dice(); return d.length && d.every((x) => !!x.data.held === vals.includes(K.upValue(x))); };
    const owns = (id) => S.relics.some((r) => r.id === id);
    const buyOf = (id) => (n, d) => n === 'buy' && d.item && d.item.id === id;

    steps = [
      // ── Runde 1, Hand 1: Würfel, Halten, Neu-Würfeln ──
      { anchor: 'r0h0', wait: 'click', say: [
        L('excited', "Welcome to the table! This is where the magic happens. And by magic I mean {g|maths}."),
        L('paranoid', "Before we start: did anyone follow you here? {q|No? Good. They're always watching.}"),
        L('neutral', 'These are your {g|dice}. Five of them. Every round you get {g|4 hands} to reach the {g|target score}.', 'target'),
        L('neutral', 'Right now you have two {g|4s}. That is a {g|Pair}. Cute. But we want {b|more}.', 'dice4'),
      ] },
      { wait: (n) => n === 'hold' && heldIs([4]), expectsHold: true, task: 'Hold both 4s', point: 'dice4',
        ok: (n, d) => (n === 'hold' && d.v === 4) || (n === 'unhold' && d.v !== 4),
        say: [L('neutral', 'Click the two {g|4s} to {g|hold} them. Held dice stay where they are when you reroll.', 'dice4')] },
      { wait: (n) => n === 'reroll', task: 'Press Reroll', point: 'roll', done: () => {}, say: [
        L('happy', 'Look at you! Holding things! I am so proud. {q|Don\'t tell anyone I said that.}'),
        L('neutral', 'Now hit {g|Reroll}. Only the dice you are {d|not} holding get thrown again.', 'roll'),
      ] },
      { wait: 'handReady', say: [L('nervous', 'Rolling... rolling... {w|come on, come on...}')] },
      { wait: 'click', say: () => (isHand('Three of a Kind') || isHand('Four of a Kind') ? [
        L('excited', '{w|THREE OF A KIND!} Look at those beautiful 4s. {q|I may cry.}'),
        L('neutral', 'See the list on the right? Those are all the {g|hands} you can make. Better hand, more points.', 'hands'),
      ] : [
        L('annoyed', "That is... not what I planned. {d|Somebody} held the wrong dice. I won't say who. {s|It was you.}"),
        L('smug', "But it's not your fault. You're new. Let's just play what we have.", 'hands'),
      ]) },
      { wait: 'click', say: [
        L('neutral', 'Every hand scores {c|Pips} {g|times} {m|Power}. Pips are the blue box, Power is the red one.', 'pipspower'),
        L('smug', "Pips come from the hand and the dice that score. Power mostly from the hand. Multiply. Done. That's the whole genius."),
      ] },
      { wait: (n) => n === 'play', task: 'Press Play Hand', point: 'play',
        say: [L('neutral', "Now press {g|Play Hand}. Don't overthink it. {q|Overthinking is MY job.}", 'play')] },
      { wait: 'scored', say: [L('excited', 'Watch! {w|WATCH!} This is my favourite part!', 'pipspower')] },
      { wait: 'click', say: () => [
        L('happy', '{b|' + lastScore + '} points! They go into your {g|Score}.', 'score'),
        S.score >= S.target ? L('shocked', 'Wait, that already beats the target? {q|...okay, the script didn\'t plan for that.}')
          : L('neutral', 'Not enough for {g|' + S.target + '} yet. But you still have {g|' + S.hands + ' hands}. Here comes the next one.', 'hands_left'),
      ] },
      // ── Runde 1, Hand 2: Halten und Four of a Kind ──
      { anchor: 'r0h1', wait: 'click', say: [
        L('excited', 'Three {g|6s} right away! See? I {s|totally} didn\'t rig that.', 'dice6'),
        L('paranoid', "{q|I rigged it. Don't tell the casino. They have} {s|people}{q|.}"),
      ] },
      { wait: (n) => n === 'reroll', task: 'Hold the 6s, then Reroll', point: 'dice6', expectsHold: true,
        ok: (n, d) => (n === 'hold' && d.v === 6) || (n === 'unhold' && d.v !== 6),
        done: () => { if (!heldIs([6])) mistake('badHold'); },
        say: [L('neutral', 'Hold all three {g|6s} and reroll the rest. You know how this works now. {q|I hope.}', 'dice6')] },
      { wait: 'handReady', say: [L('nervous', '{w|Come on... come on...}')] },
      { wait: 'click', say: () => (isHand('Four of a Kind') || isHand('Five of a Kind') ? [
        L('excited', '{b|FOUR} of a kind! {w|Ohhh}, I have goosebumps. Is that normal? {q|Don\'t answer.}'),
      ] : [L('disappointed', "Well. That's a hand. {d|Technically.}")]) },
      { wait: (n) => n === 'play', task: 'Press Play Hand', point: 'play', say: [L('neutral', 'Play it. {g|Play Hand}. Go.', 'play')] },
      { wait: 'scored', say: [L('excited', '{w|Here it comes!}')] },
      // ── Runde 1 geschafft ──
      { anchor: 'won0', wait: 'click', say: [
        L('excited', '{w|ROUND CLEARED!} You beat the {g|Warm-up}!'),
        L('neutral', 'Winning gives you {g|money}, plus {g|$1} for every hand you did not need.', 'money'),
        L('smug', 'And {g|interest}: $1 for every $5 you hold when a round ends. So hoarding is good. {q|Like my action figures.}'),
      ] },
      { wait: 'shop', say: [L('nervous', 'Next stop: the shop. {q|Act natural.}')] },
      // ── Shop 1: der Build ──
      { anchor: 'shop1', wait: 'click', enter: () => {
        const need = R.RELIC_BY_ID.triple_threat.cost + R.RELIC_BY_ID.twin_peaks.cost + 3 + 1;
        if (S.money < need) { S.money = need; sfx('coin'); }
      }, say: [
        L('excited', "The {g|SHOP}! My favourite place. It's like a library, but everything costs money and nobody shushes you."),
        L('neutral', '{g|Relics} are the most important things here. They stay with you and change how you score.', 'shop01'),
        L('neutral', "I've prepared a {g|beginner build}. It's called {g|Pattern}: you play the {b|same hand} again and again, and it keeps getting stronger."),
        L('nervous', 'I topped up your money for it. From my own wallet. {q|My mom\'s wallet.}', 'money'),
      ] },
      { wait: 'tipPinned', task: 'Point at a card until the ring is full', point: 'shop0', say: [
        L('neutral', 'First, a trick: point at {g|Triple Threat} and keep the mouse still. A little {g|ring} fills up.', 'shop0'),
        L('neutral', 'When it is full, the box stays open and you can point at the underlined words for more. Works on {b|everything}.'),
      ] },
      { wait: buyOf('triple_threat'), task: 'Buy Triple Threat', point: 'shop0', say: [
        L('happy', 'See? Knowledge! Delicious knowledge.'),
        L('neutral', 'Now buy {g|Triple Threat}. It doubles your {m|Power} whenever your hand contains Three of a Kind. {g|x2}!', 'shop0'),
      ] },
      { wait: buyOf('twin_peaks'), task: 'Buy Twin Peaks', point: 'shop1', say: [
        L('neutral', 'Next: {g|Twin Peaks}. {m|+8 Power} whenever there is a Pair. And guess what? Three of a Kind {b|contains} a Pair.', 'shop1'),
        L('smug', 'They work together. That is called {g|synergy}. I learned that word at a seminar.'),
      ] },
      { wait: 'click', say: [
        L('neutral', 'Both of these have the {g|Pattern} tag. Point at a relic and look at the little badge.', 'relics'),
        L('neutral', 'Own {g|3} relics with the same tag and you unlock a {g|set bonus}. With {g|5} an even bigger one.'),
        L('fourth', "Sorry, quick unrelated question. Can you hear the music too? Or is it just in my head? {q|...it's always been in my head.}"),
        L('neutral', '{q|*ahem*} Where was I. Ah. The third Pattern relic comes in the next shop. {q|If you behave.}'),
      ] },
      { wait: (n, d) => n === 'buy' && d.item && d.item.type === 'constellation', task: 'Buy the Constellation', point: 'shop2', say: [
        L('neutral', 'Last thing: the {g|Constellation}. It levels up a hand {b|forever}. Buy the one for {g|Three of a Kind}.', 'shop2'),
      ] },
      { wait: (n, d) => n === 'use' && d.item && d.item.type === 'constellation', task: 'Click it, then press Use', point: 'cons',
        ok: (n) => n === 'select', say: [L('neutral', 'It went to your consumables on the right. Click it, then press {g|Use}.', 'cons')] },
      { wait: 'click', say: [
        L('happy', 'Three of a Kind is now {g|level 2}. More Pips, more Power. Forever. {q|Unlike my last relationship.}', 'hands'),
        L('neutral', 'The {g|die} over there? You can buy new dice for your bag. We skip that. Budget reasons. {q|My mom checks the statements.}', 'shop3'),
        L('neutral', 'And the far right is an {g|upgrade}: it lasts the whole run, but it is expensive.', 'shop4'),
      ] },
      { wait: (n) => n === 'leaveShop', task: 'Press Next Round', point: 'next', say: [
        L('neutral', 'Ready? Press {g|Next Round}. The next one is {g|High Stakes}: same idea, bigger target.', 'next'),
      ] },
      // ── Runde 2: der Build zündet ──
      { anchor: 'r1h0', wait: 'click', say: [
        L('excited', 'Look! Three {g|2s}! The build {w|LOVES} this.', 'dice2'),
        L('smug', "Small numbers. But the relics don't care how big the dice are. Watch."),
      ] },
      { wait: (n) => n === 'play', task: 'Play it right away', point: 'play', ok: (n, d) => n === 'hold' || n === 'unhold',
        say: [L('neutral', 'Just play it. {b|No} rerolls needed. Trust me. {q|For once.}', 'play')] },
      { wait: 'scored', say: [L('excited', 'Here come the relics! {w|Triple Threat! Twin Peaks!}', 'relics')] },
      { wait: 'click', say: () => [
        L('excited', '{b|' + lastScore + '} points! With a Three of a Kind of {d|twos}! That is the build working.', 'score'),
        L('smug', 'Level 2 hand, +8 Power, then x2 Power. {w|Synergy.} I said it twice now. It is still a great word.'),
      ] },
      { anchor: 'won1', wait: 'click', say: [L('smug', '{w|Round cleared!} I am a genius. {q|You helped. A little.}')] },
      { wait: 'shop', say: [L('nervous', 'Back to the shop. {q|Walk casually.}')] },
      // ── Shop 2: Set-Bonus ──
      { anchor: 'shop2', wait: buyOf('combo'), task: 'Buy Combo Meter', point: 'shop0', enter: () => {
        const need = R.RELIC_BY_ID.combo.cost + 1;
        if (S.money < need) { S.money = need; sfx('coin'); }
      }, say: [
        L('neutral', 'Shop number two. See {g|Combo Meter}? Another {g|Pattern} relic. Your {b|third} one.', 'shop0'),
        L('excited', 'It gives more {m|Power} every time you play the same hand in a row. Which is... exactly our plan. Buy it!'),
      ] },
      { wait: 'click', say: [
        L('happy', 'Three Pattern relics: {g|set bonus} unlocked! Your most played hand gets a free level every stage. Like a subscription, but {w|good}.', 'relics'),
        L('nervous', 'One more thing: click a relic and you can {g|sell} it for money.', 'relics'),
        L('angry', "Do {s|NOT} sell the ones I gave you. I will know. {s|I always know.}"),
      ] },
      { wait: 'click', say: [
        L('fourth', '...hey. You. The real one. Behind the screen.'),
        L('fourth', "Are you drinking enough water? You've been staring at dice for a while. Blink. Stretch. I'll wait."),
        L('neutral', '{q|*ahem*} Right. Where were we. {g|Dice.}'),
      ] },
      { wait: (n) => n === 'leaveShop', task: 'Press Next Round', point: 'next', say: [
        L('paranoid', 'Next is the {g|Showdown}. The {b|boss} of this stage. Bosses have nasty {g|rules}. {s|Always} read them.', 'next'),
      ] },
      // ── Runde 3: Boss ──
      { anchor: 'r2h0', wait: 'click', say: [
        L('paranoid', 'This is {g|The Snake}. Every hand it {b|eats} your {g|lowest} scored die: that die gives nothing. {q|I hate snakes. And bosses. And... outdoors.}', 'target'),
        L('neutral', 'We have three {g|3s}. Hold them and reroll the {g|1s}. Low dice are snake snacks.', 'dice3'),
      ] },
      { wait: (n) => n === 'reroll', task: 'Hold the 3s, then Reroll', point: 'dice3', expectsHold: true,
        ok: (n, d) => (n === 'hold' && d.v === 3) || (n === 'unhold' && d.v !== 3),
        done: () => { if (!heldIs([3])) mistake('badHold'); },
        say: [L('neutral', 'Hold the {g|3s}. Reroll. You can do it. {q|Statistically.}', 'dice3')] },
      { wait: 'handReady', say: [L('nervous', '{s|Please please please}...')] },
      { wait: (n) => n === 'play', task: 'Play the hand', point: 'play', say: () => [
        isHand('Four of a Kind') || isHand('Five of a Kind') ? L('excited', '{b|Four} 3s! The Snake only gets {s|one} of them. {g|Play it!}', 'play')
          : L('neutral', 'Good enough. {g|Play it} and pray. {q|I am already praying.}', 'play'),
      ] },
      { wait: 'scored', say: [L('excited', '{w|GET HIM!}')] },
      // ── Abschluss ──
      { anchor: 'won2', wait: 'click', say: () => [
        L('excited', '{w|YOU DID IT!} You beat your first stage!'),
        L('neutral', 'A real run has {g|8 stages}. Targets get huge. Bosses get meaner. There is {g|Luck}, {g|Skulls}, the {g|Vault}, {g|Cups} and about eighty relics.'),
        L('nervous', "I didn't explain all of it. The ring tooltips will. Point at anything and wait for the ring."),
        L('fourth', 'Real talk, though: thank you for doing the tutorial. Most people skip me. {d|Everyone skips me.}'),
        L('neutral', '{q|*ahem*} Anyway.'),
        totalMistakes === 0 ? L('happy', 'Zero mistakes. {b|ZERO.} I am going to frame this moment.')
          : everGaveUp ? L('smug', 'You made {g|' + totalMistakes + '} mistakes. I gave up on you once. {q|And then I un-gave up. Growth.}')
            : L('smug', 'Only {g|' + totalMistakes + '} mistake' + (totalMistakes === 1 ? '' : 's') + '. For a newbie, that is... {d|fine}. It is fine.'),
        L('happy', "Now go. Pick a save and play for real. I'll be around. {q|Watching. Not in a creepy way.}"),
      ], final: true },
    ];

    // ── Zeigen: Pfeile und Rahmen ─────────────────────────────────────────
    function targets(key) {
      const Lay = K.L(), d = K.dice();
      const dieR = (x) => ({ x: x.x - 42, y: x.y - 44, w: 84, h: 88 });
      const btnR = (b) => ({ x: b.x, y: b.y, w: b.w, h: b.h });
      const shopR = (k) => { const p = Lay.shopPos(k); return { x: p.x - 54, y: p.y - 70, w: 108, h: 140 }; };
      if (!key) return [];
      if (key.startsWith('dice')) { const v = +key.slice(4); return d.filter((x) => x.data.die && K.upValue(x) === v).map(dieR); }
      if (key === 'roll') return [btnR(B.roll)];
      if (key === 'play') return [btnR(B.play)];
      if (key === 'next') return [btnR(B.next)];
      if (key.startsWith('shop')) return key.slice(4).split('').map((k) => shopR(+k)).filter((r, k) => S.shop && S.shop[+key.slice(4)[k]]);
      if (key === 'relics') return K.relicSprites().map((sp) => ({ x: sp.x - 44, y: sp.y - 56, w: 88, h: 112 }));
      if (key === 'cons') return K.consSprites().map((sp) => ({ x: sp.x - 44, y: sp.y - 56, w: 88, h: 112 }));
      const AREAS = (MOB && Lay.tutAreas) || { target: { x: 46, y: 28, w: 248, h: 104 }, score: { x: 42, y: 136, w: 252, h: 58 }, pipspower: { x: 40, y: 236, w: 252, h: 96 },
        hands_left: { x: 40, y: 344, w: 118, h: 78 }, money: { x: 40, y: 432, w: 252, h: 58 }, hands: { x: 1004, y: 172, w: 242, h: 292 } };
      return AREAS[key] ? [AREAS[key]] : [];
    }
    function drawPointers(ctx, key, t) {
      targets(key).forEach((r) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        UI.box(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, { colour: 'rgba(0,0,0,0)', radius: 12, shadow: false, outline: P.GOLD, outlineWidth: 3 });
        ctx.restore();
        // hüpfender Pixel-Pfeil darüber (bei Zielen ganz oben darunter)
        const up = r.y < 70, ax = r.x + r.w / 2, ay = up ? r.y + r.h + 14 + Math.sin(t * 7) * 5 : r.y - 14 - Math.sin(t * 7) * 5;
        ctx.fillStyle = P.GOLD;
        for (let k = 0; k < 7; k++) {
          const w = (7 - k) * 2;
          ctx.fillRect(Math.round(ax - w), Math.round(up ? ay + k * 2 : ay - k * 2), w * 2, 2);
        }
        ctx.fillRect(Math.round(ax - 3), Math.round(up ? ay + 14 : ay - 26), 6, 12);
      });
    }

    // ── Jonny zeichnen: 64×64-Pixel-Porträt im Comic-Stil (dicke Konturen) ─────────────
    // Längere braune Haare mit Seitenscheitel, dicke eckige Brille mit großen ovalen Augen, rosige Knollennase,
    // schiefes Zahn-Grinsen und kurzer Bart am Kiefer. Varianten (Stimmung, Mund, Blinzeln, Blick) werden zwischengespeichert.
    const N = 64;
    const cache = new Map();
    let g = null;
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    // gefüllte Ellipse; pred(x, y) kann einzelne Pixel ausschließen
    function ell(cx, cy, rx, ry, c, pred) {
      g.fillStyle = c;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1 && (!pred || pred(x, y))) g.fillRect(x, y, 1, 1);
        }
      }
    }
    const inEll = (x, y, cx, cy, rx, ry) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
    // Linie aus Punkten (Brauen, Haarsträhnen)
    function line(pts, c, w = 1) {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let i = 0; i <= n; i++) px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), w, w, c);
      }
    }
    const FACES = {
      neutral: { brow: 'flat', eyes: 'open', mouth: 'grin' },
      happy: { brow: 'up', eyes: 'happy', mouth: 'grin', fx: 'sparkle' },
      excited: { brow: 'up', eyes: 'wide', mouth: 'open', fx: 'sparkle', bounce: true },
      smug: { brow: 'raised', eyes: 'half', look: [2, 0], mouth: 'smirk' },
      nervous: { brow: 'worried', eyes: 'open', mouth: 'wobbly', fx: 'sweat', tremble: 1 },
      paranoid: { brow: 'worried', eyes: 'small', mouth: 'flat', fx: 'sweat', tremble: 1, dart: true },
      annoyed: { brow: 'low', eyes: 'half', mouth: 'flat', fx: 'tick' },
      angry: { brow: 'angry', eyes: 'angry', mouth: 'frown', fx: 'vein', blush: true, shake: 2 },
      furious: { brow: 'angry', eyes: 'small', mouth: 'teeth', fx: 'steam', red: true, shake: 4 },
      disappointed: { brow: 'sad', eyes: 'half', look: [0, 2], mouth: 'frown', fx: 'cloud' },
      bored: { brow: 'flat', eyes: 'sleepy', look: [2, 0], mouth: 'flat', fx: 'zzz' },
      shocked: { brow: 'up', eyes: 'wide', mouth: 'O', fx: 'bang' },
      fourth: { brow: 'flat', eyes: 'stare', mouth: 'smile' },
    };
    const O = '#16111A', HAIR = '#8A5A2E', HAIR_D = '#5C3819', HAIR_L = '#A97A44', BEARD = '#74481F';
    const LENS = '#ECF6FB', LENS_D = '#C9DDE9', MOUTH = '#4A1A1A';

    function paintJonny(mood, open, blink, lx, head) {
      const key = mood + '|' + open + '|' + blink + '|' + lx + '|' + !!head;
      if (cache.has(key)) return cache.get(key);
      const c = document.createElement('canvas'); c.width = c.height = N;
      g = c.getContext('2d');
      const f = FACES[mood] || FACES.neutral;
      const SKIN = f.red ? '#F4A28A' : '#F6D2B6', SKIN_D = f.red ? '#DE806C' : '#E8B596';
      const ly = (f.look || [0, 0])[1];

      // Hemd (senfgelb) mit Kragen und Stifteschutz
      if (!head) {   // ohne Hemd: nur der Kopf (schwebender Jonny im Hintergrund)
        px(4, 57, 56, 7, O); px(5, 58, 54, 6, '#E7B23C'); px(5, 58, 54, 1, '#F3CB62');
        px(22, 55, 20, 4, SKIN_D);
        line([[20, 56], [26, 61], [31, 57]], O); line([[44, 56], [38, 61], [33, 57]], O);
        px(21, 57, 5, 3, '#FFFFFF'); px(38, 57, 5, 3, '#FFFFFF');
        px(9, 60, 8, 4, '#FFFFFF'); px(10, 58, 1, 3, '#2F6FD0'); px(12, 58, 1, 3, '#C2312A'); px(14, 59, 1, 2, '#2E8B57');
      }

      // Kopf etwas höher setzen, damit Hals, Bart und Kragen Platz haben
      g.save(); g.translate(0, -3);
      // Haare hinten (Volumen bis über die Ohren)
      ell(32, 25, 26, 23, O);
      ell(32, 25, 25, 22, HAIR);
      // Ohren
      [[10, 37], [54, 37]].forEach(([x, y]) => { ell(x, y, 4.5, 5.5, O); ell(x, y, 3.5, 4.5, SKIN); px(Math.round(x) - 1, y - 1, 2, 3, SKIN_D); });
      // Gesicht
      ell(32, 37.5, 20, 23.5, O);
      ell(32, 37.5, 19, 22.5, SKIN);
      // Kinnbart: kurzer, zerzauster Streifen ganz unten am Kinn (Haut zwischen Mund und Bart bleibt frei)
      const jag = (x) => ((x * 7) % 5 === 0 ? -1 : (x * 3) % 4 === 0 ? 1 : 0);
      ell(32, 37.5, 19, 22.5, BEARD, (x, y) => x >= 19 && x <= 44 && y >= 55 + jag(x));
      ell(31.5, 59.5, 11.5, 3.6, O, (x, y) => y >= 60);
      ell(31.5, 59.5, 10.5, 2.6, BEARD, (x, y) => y >= 60);
      for (let x = 22; x <= 41; x += 3) { const d = 62 + (x % 2); px(x, d - 1, 1, 1, BEARD); px(x, d, 1, 1, O); }
      px(26, 58, 1, 2, '#5C3517'); px(33, 58, 1, 2, '#5C3517');
      // Haaransatz mit Seitenscheitel: links höher, rechts fällt die Strähne tiefer
      const hl = (x) => 17 + Math.round(2.5 * Math.sin((x - 6) / 8)) + (x > 38 ? Math.round((x - 38) * 0.32) : 0);
      ell(32, 37, 19, 22, HAIR, (x, y) => y < hl(x) || ((x < 15 || x > 49) && y < 31));
      for (let x = 15; x <= 49; x++) { const y = hl(x); if (inEll(x, y, 32, 37, 19, 22)) px(x, y, 1, 1, HAIR_D); }
      // Strähnen und Glanz
      line([[18, 9], [24, 13], [29, 17]], HAIR_D); line([[33, 5], [40, 10], [44, 16]], HAIR_D); line([[46, 9], [51, 15], [53, 22]], HAIR_D);
      line([[12, 18], [11, 26], [12, 31]], HAIR_D); line([[24, 6], [31, 5], [37, 6]], HAIR_L); line([[20, 9], [26, 7]], HAIR_L);

      // Augenbrauen (dick, braun)
      const BROWS = {
        flat: [[[16, 22], [21, 21], [28, 22]], [[36, 22], [43, 21], [48, 22]]],
        up: [[[16, 20], [21, 18], [28, 19]], [[36, 19], [43, 18], [48, 20]]],
        low: [[[16, 23], [22, 23], [28, 23]], [[36, 23], [42, 23], [48, 23]]],
        angry: [[[16, 20], [22, 22], [28, 24]], [[36, 24], [42, 22], [48, 20]]],
        worried: [[[16, 23], [22, 21], [28, 19]], [[36, 19], [42, 21], [48, 23]]],
        sad: [[[16, 23], [22, 21], [28, 20]], [[36, 20], [42, 21], [48, 23]]],
        raised: [[[16, 22], [22, 22], [28, 22]], [[36, 19], [42, 17], [48, 19]]],
      }[f.brow] || null;
      (BROWS || []).forEach((b) => line(b, HAIR_D, 2));

      // Brille: dicke schwarze Rahmen, abgerundete Ecken
      const lens = (x0) => {
        px(x0 + 1, 25, 17, 15, O); px(x0, 26, 19, 13, O);
        px(x0 + 2, 27, 15, 11, LENS); px(x0 + 3, 26 + 1, 13, 1, LENS);
        px(x0 + 2, 35, 15, 3, LENS_D);
        px(x0 + 3, 28, 2, 1, '#FFFFFF'); px(x0 + 3, 29, 1, 1, '#FFFFFF');
      };
      lens(12); lens(33);
      px(31, 29, 2, 2, O); px(9, 29, 3, 2, O); px(52, 29, 3, 2, O);

      // Augen: große, hohe Ovale mit Glanzpunkt
      const eye = (cx) => {
        const x = cx + lx, y = 32 + ly;
        if (blink) { px(cx - 4, 32, 9, 2, O); return; }
        switch (f.eyes) {
          case 'happy': line([[cx - 4, 34], [cx - 2, 31], [cx, 30], [cx + 2, 31], [cx + 4, 34]], O, 2); break;
          case 'wide': ell(x, y, 2.6, 4.8, O); px(x - 1, y - 3, 1, 2, '#FFFFFF'); break;
          case 'small': px(x - 1, y - 1, 2, 3, O); break;
          case 'half': px(cx - 7, 27, 15, 5, LENS_D); px(cx - 7, 32, 15, 1, O); px(x - 1, 34, 3, 3, O); break;
          case 'sleepy': px(cx - 7, 27, 15, 7, LENS_D); px(cx - 7, 34, 15, 1, O); px(x - 1, 35, 3, 1, O); break;
          case 'angry': ell(x, y + 1, 1.8, 3.4, O); line(cx < 32 ? [[cx - 6, 27], [cx + 6, 31]] : [[cx - 6, 31], [cx + 6, 27]], O, 2); break;
          case 'stare': ell(x, y, 3.2, 5.2, O); px(x - 2, y - 3, 2, 2, '#FFFFFF'); px(x + 1, y + 2, 1, 1, '#FFFFFF'); break;
          default: ell(x, y, 1.9, 4.2, O); px(x - 1, y - 3, 1, 2, '#FFFFFF');
        }
      };
      eye(21); eye(42);

      // Knollennase, leicht links
      ell(29, 43.5, 4.2, 3.2, O); ell(29, 43.5, 3.2, 2.2, '#E89A88'); px(28, 42, 2, 1, '#F4B9A8');
      // Wangen
      if (f.blush || f.red) { ell(16, 45, 3, 1.4, '#EE8C86'); ell(48, 45, 3, 1.4, '#EE8C86'); }

      // Mund
      const M = open && !['teeth', 'O'].includes(f.mouth) ? 'talk' : f.mouth;
      const grin = (x0, x1, depth, tilt) => {
        for (let x = x0; x <= x1; x++) {
          const k = (x - x0) / (x1 - x0), top = 48 - Math.round(tilt * k), bot = top + Math.round(depth * Math.sin(Math.PI * k));
          px(x, top, 1, bot - top + 1, O);
          if (bot - top >= 2) { px(x, top + 1, 1, bot - top - 1, MOUTH); px(x, top + 1, 1, Math.min(2, bot - top - 1), '#FFFFFF'); }
        }
        for (let x = x0 + 4; x < x1 - 2; x += 4) { const k = (x - x0) / (x1 - x0); px(x, 48 - Math.round(tilt * k) + 1, 1, 2, '#9A9A9A'); }
      };
      switch (M) {
        case 'grin': grin(21, 45, 6, 3); px(20, 47, 1, 2, O); px(46, 44, 1, 2, O); break;
        case 'smile': grin(23, 43, 4, 2); break;
        case 'talk': ell(33, 49.5, 6, 3.6, O); ell(33, 49.5, 5, 2.6, MOUTH); px(29, 47, 9, 2, '#FFFFFF'); break;
        case 'open': ell(33, 50, 8, 5, O); ell(33, 50, 7, 4, MOUTH); px(28, 46, 11, 2, '#FFFFFF'); ell(33, 52.5, 4, 1.6, '#D96A6A'); break;
        case 'smirk': line([[24, 50], [32, 50], [38, 48], [42, 45]], O, 2); px(33, 51, 4, 1, '#FFFFFF'); break;
        case 'frown': line([[23, 52], [27, 49], [33, 48], [39, 49], [43, 52]], O, 2); break;
        case 'wobbly': for (let x = 24; x <= 42; x++) px(x, 49 + (x % 4 < 2 ? 0 : 1), 1, 2, O); break;
        case 'teeth': px(21, 45, 24, 9, O); px(22, 46, 22, 7, '#FFFFFF'); px(22, 49, 22, 1, '#9A9A9A'); for (let x = 25; x < 44; x += 3) px(x, 46, 1, 7, '#9A9A9A'); break;
        case 'O': ell(33, 50, 3, 3.6, O); ell(33, 50, 2, 2.6, MOUTH); break;
        default: line([[25, 50], [41, 49]], O, 2);
      }
      g.restore();
      cache.set(key, c);
      return c;
    }
    // Effekte um den Kopf (in Koordinaten eines 48er-Rasters, s = Bildschirmpixel pro Rasterpunkt)
    function drawFx(ctx, f, x, y, s, t) {
      const P2 = (px2, py2, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + px2 * s), Math.round(y + py2 * s), Math.round(w * s), Math.round(h * s)); };
      switch (f.fx) {
        case 'sweat': { const k = (t * 0.8) % 1; P2(40, 12 + k * 10, 2, 3, '#7EC8F2'); P2(40.5, 11 + k * 10, 1, 1, '#7EC8F2'); break; }
        case 'vein': { const on = Math.sin(t * 10) > -0.2; if (on) { P2(33, 6, 1, 4, '#D02A2A'); P2(31.5, 7.5, 4, 1, '#D02A2A'); P2(32, 6.5, 1, 1, '#D02A2A'); P2(34, 8.5, 1, 1, '#D02A2A'); } break; }
        case 'steam': for (let k = 0; k < 3; k++) { const q = (t * 0.9 + k / 3) % 1; ctx.globalAlpha = 1 - q; P2(8 + k * 14 + Math.sin(q * 6 + k) * 2, 4 - q * 14, 4 + q * 3, 3 + q * 2, '#E8E8E8'); ctx.globalAlpha = 1; } break;
        case 'sparkle': for (let k = 0; k < 3; k++) { const on = Math.sin(t * 5 + k * 2) > 0.2; if (on) { const sx = [4, 43, 43][k], sy = [8, 6, 30][k]; P2(sx, sy - 1, 1, 3, P.GOLD); P2(sx - 1, sy, 3, 1, P.GOLD); } } break;
        case 'cloud': { const b = Math.sin(t * 1.5) * 0.6; P2(14, -2 + b, 20, 4, '#7C8A93'); P2(17, -4 + b, 12, 3, '#7C8A93'); for (let k = 0; k < 4; k++) { const q = (t * 1.6 + k / 4) % 1; P2(16 + k * 5, 2 + b + q * 6, 1, 2, '#7EC8F2'); } break; }
        case 'zzz': for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3) % 1; ctx.globalAlpha = 1 - q; UI.text(ctx, 'z', x + (40 + q * 6) * s, y + (10 - q * 12) * s, { size: 12 + k * 4, colour: '#DDE6EE' }); ctx.globalAlpha = 1; } break;
        case 'bang': if (Math.sin(t * 8) > -0.4) { P2(42, 2, 2, 6, '#FFD84A'); P2(42, 9, 2, 2, '#FFD84A'); } break;
        case 'tick': if ((t % 1.6) < 0.25) { P2(38, 6, 1, 3, '#FFFFFF'); P2(40, 5, 1, 3, '#FFFFFF'); } break;
        default:
      }
    }
    // s = Bildschirmpixel pro Porträt-Pixel (64er-Raster)
    function drawJonny(ctx, x, y, s, mood, talking, t, tag) {
      const f = FACES[mood] || FACES.neutral, size = N * s;
      let ox = 0, oy = Math.sin(t * 2) * 2;
      if (f.bounce) oy = -Math.abs(Math.sin(t * 6)) * 6;
      if (f.tremble) ox += (Math.random() - 0.5) * 2 * f.tremble;
      if (f.shake) { ox += (Math.random() - 0.5) * 2 * f.shake; oy += (Math.random() - 0.5) * f.shake; }
      const zoom = mood === 'fourth' ? 1.3 : 1;
      let lx = (f.look || [0, 0])[0];
      if (f.dart) lx = Math.sin(t * 2.3) > 0.3 ? 3 : Math.sin(t * 2.3) < -0.3 ? -3 : 0;
      const blink = (t % 3.7) < 0.12 && f.eyes !== 'sleepy' && f.eyes !== 'happy';
      const open = talking && Math.floor(t * 9) % 2 === 0;
      const img = paintJonny(mood, open, blink, lx);
      // Rahmen in der Farbe der Stimmung
      const frame = { angry: '#7A2A2A', furious: '#9A1F1F', fourth: '#101418', bored: '#3A4448', disappointed: '#34414F', paranoid: '#3B3550', nervous: '#3B3550' }[mood] || P.PANEL_DARK;
      UI.box(ctx, x - 4, y - 4, size + 8, size + 8, { colour: frame, radius: 14, emboss: 4, outline: mood === 'furious' ? '#FF5A4A' : P.GOLD, outlineWidth: 2 });
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
      const w = size * zoom, bx = x + ox - (w - size) / 2, by = y + oy - (w - size) * 0.3;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round(bx), Math.round(by), Math.round(w), Math.round(w));
      ctx.restore();
      drawFx(ctx, f, x + ox, y + oy, size / 48, t);
      if (tag) { UI.box(ctx, x + size / 2 - 46, y + size - 4, 92, 24, { colour: P.GOLD, radius: 8, emboss: 2 }); UI.text(ctx, 'JONNY', x + size / 2, y + size + 8, { size: 16, colour: P.BLACK, shadow: false }); }
    }

    // ── Sprechblase mit Wort-Effekten ─────────────────────────────────────
    const SPEED = { excited: 75, angry: 80, furious: 95, bored: 26, nervous: 62, paranoid: 60, fourth: 38, disappointed: 34 };
    const VOICE = { nervous: 640, paranoid: 610, excited: 700, happy: 580, neutral: 520, smug: 470, annoyed: 440, angry: 360, furious: 300, disappointed: 380, bored: 330, shocked: 720, fourth: 470 };
    function layoutWords(ctx, words, maxW, k = 1) {
      const out = [];
      let x = 0, row = 0;
      for (const w of words) {
        const size = (w.f.includes('b') ? 26 : w.f.includes('q') ? 16 : 20) * FONT_K() * k;
        ctx.font = UI.font(size);
        const ww = ctx.measureText(w.t).width;
        if (!w.space && x + ww > maxW && x > 0) { x = 0; row++; }
        if (w.space && x === 0) continue;
        out.push({ w, x, row, size, width: ww });
        x += ww;
      }
      return out;
    }
    function drawBubble(ctx, t, box, mood, dark) {
      const { x, y, w, h } = box;
      const fill = dark ? '#14181C' : '#FFF8EA', edge = dark ? '#5A6A72' : mood === 'furious' ? '#C2312A' : '#2A2620';
      // Schwanz zur Figur
      ctx.fillStyle = edge;
      ctx.beginPath(); ctx.moveTo(x + 2, y + 44); ctx.lineTo(x - 22, y + 58); ctx.lineTo(x + 2, y + 70); ctx.fill();
      UI.box(ctx, x, y, w, h, { colour: fill, radius: 14, emboss: 4, outline: edge, outlineWidth: 3 });
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.moveTo(x + 4, y + 48); ctx.lineTo(x - 15, y + 58); ctx.lineTo(x + 4, y + 66); ctx.fill();
    }
    function drawText(ctx, t, box, c = cur, k = 1) {
      const dark = c.mood === 'fourth';
      const pad = 22 * k, maxW = box.w - pad * 2 - 30 * k;
      if (!c.layout) c.layout = layoutWords(ctx, c.words, maxW, k);
      const rows = c.layout.length ? c.layout[c.layout.length - 1].row + 1 : 1;
      const lh = (LT() ? LT().lineH : 28) * k, top = box.y + box.h / 2 - ((rows - 1) * lh) / 2 - (dark ? 4 : 0);
      let budget = Math.floor(c.shown);
      const base = dark ? '#E8EEF2' : c.mood === 'bored' ? '#6E6A62' : '#2A2620';
      const globalShake = { angry: 0.8, furious: 1.8 }[c.mood] || 0;
      for (const it of c.layout) {
        if (budget <= 0) break;
        const w = it.w, text = w.t.slice(0, budget);
        budget -= w.t.length;
        if (w.space) continue;
        const f = w.f;
        let colour = base;
        if (f.includes('g')) colour = dark ? '#FFD27A' : '#B0700E';
        if (f.includes('c')) colour = P.CHIPS;
        if (f.includes('m')) colour = P.MULT;
        if (f.includes('r')) colour = '#D0261C';
        if (f.includes('q')) colour = dark ? '#9AA8B0' : '#8A8378';
        const x0 = box.x + pad + it.x, y0 = top + it.row * lh;
        const perChar = /[swdp]/.test(f) || globalShake;
        if (!perChar) { UI.text(ctx, text, x0, y0, { size: it.size, colour, align: 'left', shadow: false }); continue; }
        // Zeichenweise, damit jedes Wort (und jeder Buchstabe) eigene Bewegung bekommt
        ctx.font = UI.font(it.size);
        let cx = x0;
        [...text].forEach((ch, k) => {
          let dx = 0, dy = 0, sc = 1;
          if (globalShake) { dx += (Math.random() - 0.5) * globalShake; dy += (Math.random() - 0.5) * globalShake; }
          if (f.includes('s')) { dx += (Math.random() - 0.5) * 3.2; dy += (Math.random() - 0.5) * 3.2; }
          if (f.includes('w')) dy += Math.sin(t * 7 + k * 0.7) * 3.5;
          if (f.includes('d')) dy += 1 + k * 0.9 + Math.sin(t * 2 + k) * 0.6;
          if (f.includes('p')) sc = 1 + 0.12 * Math.sin(t * 8);
          ctx.save(); ctx.translate(cx + dx, y0 + dy); ctx.scale(sc, sc);
          UI.text(ctx, ch, 0, 0, { size: it.size, colour, align: 'left', shadow: false });
          ctx.restore();
          cx += ctx.measureText(ch).width;
        });
      }
    }

    // ── Sprüche außerhalb des Tutorials (Shop, Jonny's Cup, Endboss, Run-Ende) ──
    // Das Spiel verwaltet Reihenfolge und Platz; hier: Satz bauen, tippen lassen (mit Stimme) und zeichnen.
    function makeLine(text, mood = 'neutral') {
      const tx = mobText(text);
      return { words: parse(tx), mood, shown: 0, chars: tx.replace(/\{[a-z]+\||\}/g, '').length, layout: null, blip: 0 };
    }
    function tickLine(c, dt) {
      if (!c || c.shown >= c.chars) return;
      const before = Math.floor(c.shown);
      c.shown = Math.min(c.chars, c.shown + dt * (SPEED[c.mood] || 52) * (K.textSpeed ? K.textSpeed() : 1));
      c.blip += Math.floor(c.shown) - before;
      if (c.blip >= 3) { c.blip = 0; sfx('voice', { f: (VOICE[c.mood] || 520) * (0.92 + Math.random() * 0.16), mood: c.mood }); }
    }
    // face: {x, y, s} (oder null), box: Sprechblase. o.k: Schriftgröße, o.tag: Namensschild, o.fit: Blase so schmal wie der Text.
    // Gibt die gezeichnete Blase zurück (für Klicks).
    function drawSpeech(ctx, t, c, face, box, o = {}) {
      const k = o.k || 1;
      if (face) drawJonny(ctx, face.x, face.y, face.s, c.mood, c.shown < c.chars, t, !!o.tag);
      if (o.fit) {
        const pad = 22 * k, extra = pad * 2 + 30 * k;
        if (!c.layout) c.layout = layoutWords(ctx, c.words, box.w - extra, k);
        const wide = Math.max(0, ...c.layout.map((it) => it.x + it.width));
        box = Object.assign({}, box, { w: Math.min(box.w, Math.max(o.minW || 180, wide + extra)) });
      }
      drawBubble(ctx, t, box, c.mood, c.mood === 'fourth');
      drawText(ctx, t, box, c, k);
      if (c.shown >= c.chars && c.more) {
        const bob = Math.sin(t * 6) * 3;
        ctx.fillStyle = c.mood === 'fourth' ? '#E8EEF2' : '#2A2620';
        for (let q = 0; q < 5; q++) ctx.fillRect(box.x + box.w - 24 + q, box.y + box.h - 16 + bob + q, 10 - q * 2, 1.5);
      }
      return box;
    }

    // ── Pro Bild ──────────────────────────────────────────────────────────
    let lastT = 0, blipAcc = 0;
    function update() {
      const dt = Math.min(0.1, Math.max(0, eng.time - lastT)); lastT = eng.time;
      if (!cur) return;
      if (cur.shown < cur.chars) {
        const before = Math.floor(cur.shown);
        cur.shown = Math.min(cur.chars, cur.shown + dt * (SPEED[cur.mood] || 52) * (K.textSpeed ? K.textSpeed() : 1));
        blipAcc += Math.floor(cur.shown) - before;
        if (blipAcc >= 3) { blipAcc = 0; sfx('voice', { f: (VOICE[cur.mood] || 520) * (0.92 + Math.random() * 0.16), mood: cur.mood }); }
      } else if (cur.reaction && eng.time - cur.t0 > 2.6 + cur.chars * 0.035) popQueue();
      // Lange nichts getan: Jonny wird unruhig und spricht den Menschen vor dem Bildschirm an
      const st = step();
      if (active && st && typeof st.wait === 'function' && !queue.length && !cur.reaction && eng.time - lastAction > 40 && idleCount < 2 && cur.shown >= cur.chars) {
        lastAction = eng.time; idleCount++;
        interject(idleCount === 1 ? [
          { mood: 'fourth', text: 'Hello? Are you still there? Did you go get snacks? {q|Bring me some.}' },
          { mood: 'neutral', text: '{q|*ahem*} Whenever you are ready.' },
        ] : [
          { mood: 'paranoid', text: "You've been quiet. {s|Too} quiet. Are you... one of {s|them}?" },
          { mood: 'nervous', text: '{q|*ahem*} Just checking. Carry on.' },
        ]);
      }
    }
    function bubbleBox() {
      if (!LT()) return modal ? { x: 470, y: 222, w: 560, h: 150 } : TIP;
      // Handy: wird der Satz länger als die Blase, wächst sie nach oben
      const b = Object.assign({}, modal ? LT().modalBox : LT().tip);
      if (cur && cur.layout && cur.layout.length) {
        const rows = cur.layout[cur.layout.length - 1].row + 1, need = rows * LT().lineH + 34;
        if (need > b.h) { if (!modal) b.y -= need - b.h; b.h = need; }
      }
      return b;
    }
    function draw(ctx, t) {
      if (!active && !modal) return;
      if (modal) dim(ctx, 0.55);
      const st = step();
      // Zeiger auf das, worum es gerade geht
      if (active && cur && !cur.reaction) drawPointers(ctx, (cur.line && cur.line.point) || (st && st.point), t);
      if (!cur) return;
      if (!cur.layout) cur.layout = layoutWords(ctx, cur.words, bubbleBox().w - 74);   // Größe der Blase hängt am Umbruch
      const box = bubbleBox(), dark = cur.mood === 'fourth', fk = FONT_K();
      if (dark && !modal) dim(ctx, 0.35);
      const talking = cur.shown < cur.chars;
      const away = modal && leaving ? Math.max(0, eng.time - leaving.t0) : 0;
      if (away > 0) ctx.save(), ctx.globalAlpha = Math.max(0, 1 - away / 1.8);
      const mf = LT() ? LT().modalFace : { x: 286, y: 196, s: 2.7 }, fb = faceBox();
      if (modal) drawJonny(ctx, mf.x - away * away * 260, mf.y + Math.abs(Math.sin(away * 9)) * -8, mf.s, cur.mood, talking, t, true);
      else drawJonny(ctx, fb.x, fb.y, fb.s, cur.mood, talking, t, false);
      drawBubble(ctx, t, box, cur.mood, dark);
      // Namensschild oben links an der Blase
      let tabEnd = box.x + 18;
      if (!modal) { UI.box(ctx, box.x + 18, box.y - 26 * fk, 96 * fk, 26 * fk, { colour: P.GOLD, radius: 8, emboss: 2 }); UI.text(ctx, 'JONNY', box.x + 18 + 48 * fk, box.y - 13 * fk, { size: 16 * fk, colour: P.BLACK, shadow: false }); tabEnd = box.x + 24 + 100 * fk; }
      if (dark) UI.text(ctx, '(off the record)', box.x + box.w - 16, box.y + 16, { size: 13 * fk, colour: '#7F9099', align: 'right', shadow: false });
      drawText(ctx, t, box);
      // Weiter-Hinweis oder Aufgabe
      if (!talking) {
        const waitsClick = cur.reaction || (st && (!lastLine() || st.wait === 'click'));
        if (waitsClick && !(st && st.final && lastLine() && !cur.reaction)) {
          const bob = Math.sin(t * 6) * 3;
          ctx.fillStyle = dark ? '#E8EEF2' : '#2A2620';
          for (let k = 0; k < 5; k++) ctx.fillRect(box.x + box.w - 30 + k, box.y + box.h - 22 + bob + k, 10 - k * 2, 1.5);
        }
      }
      if (active && st && st.task && !cur.reaction && typeof st.wait === 'function') {
        const label = 'TO DO: ' + mobText(st.task);
        ctx.font = UI.font(16 * fk);
        const w = ctx.measureText(label).width + 28;
        UI.box(ctx, tabEnd, box.y - 26 * fk, w, 26 * fk, { colour: P.PANEL_DARK, radius: 13, emboss: 2, outline: P.GOLD, outlineWidth: 2 });
        UI.text(ctx, label, tabEnd + w / 2, box.y - 13 * fk, { size: 16 * fk, colour: P.GOLD, shadow: false });
      }
      if (active && mistakes > 0) {
        const lab = gaveUp ? 'Jonny gave up' : 'Mistakes: ' + mistakes + ' / ' + MAX_MISTAKES;
        UI.text(ctx, lab, box.x + box.w - 18, box.y - 14 * fk, { size: 15 * fk, colour: gaveUp ? '#9AA8B0' : mistakes >= 5 ? '#FF6A5A' : P.TEXT_SOFT, align: 'right' });
      }
      if (away > 0) ctx.restore();
      if (modal) for (const b of buttons()) UI.button(ctx, b, t);
      // Das X wackelt verführerisch
      if (modal && stage >= 2 && promptChoice === null) UI.text(ctx, stage === 2 ? 'close?' : 'really?', B.tutX.x + B.tutX.w / 2, B.tutX.y + B.tutX.h + 14 * fk, { size: 14 * fk, colour: P.TEXT_DIM });
      else if (active && st && st.final && lastLine() && !talking) UI.button(ctx, B.tutDone, t);
    }
    function inBubble(m) {
      const b = bubbleBox();
      const F = faceBox();
      return (m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h) || (!modal && m.x >= F.x - 4 && m.x <= F.x + 64 * F.s + 4 && m.y >= F.y - 4 && m.y <= F.y + 64 * F.s + 28);
    }
    function click(m) {
      if (!cur || (!active && !modal) || !inBubble(m)) return false;
      if (modal && promptChoice === null) { if (cur.shown < cur.chars) cur.shown = cur.chars; return true; }
      advance();
      return true;
    }
    function buttons() {
      if (modal && promptChoice === null) return stage >= 2 ? [B.tutYes, B.tutNo, B.tutX] : [B.tutYes, B.tutNo];
      const st = step();
      if (active && st && st.final && lastLine() && cur && !cur.reaction && cur.shown >= cur.chars) return [B.tutDone];
      return [];
    }

    // ── Frage beim ersten Klick auf PLAY ──────────────────────────────────
    // Jonny lässt nicht locker: Nein -> "Sicher?" -> Nein wird zu einem zweiten Ja und oben rechts erscheint ein X
    // -> X: er bettelt (braucht das Geld) -> X nochmal: er geht traurig weg.
    let stage = 0, leaving = null;
    const NO_STYLE = { label: 'No thanks', size: 24, w: 210 };
    function prompt(cb) {
      modal = true; promptCb = cb; promptChoice = null; stage = 0; leaving = null;
      B.tutYes.x = 492; B.tutYes.y = 400; B.tutNo.x = 772; B.tutNo.y = 400;
      Object.assign(B.tutNo, NO_STYLE, { colour: P.RED });
      if (LT()) { Object.assign(B.tutYes, LT().yes); Object.assign(B.tutNo, LT().no, { label: 'No thanks' }); Object.assign(B.tutX, LT().x); }
      show({ mood: 'nervous', text: "Oh! A new player. Okay. Okay okay okay. {q|Be cool, Jonny.} Hi! I'm {g|Jonny}, your dice tutor. Would you like a {g|tutorial}? {w|I've been practising.}" });
    }
    function finishPrompt(yes, delay) {
      promptChoice = yes;
      eng.after(delay, () => { modal = false; cur = null; leaving = null; const cb = promptCb; promptCb = null; if (cb) cb(yes); });
    }
    function answer(yes) {
      if (promptChoice !== null) return;
      if (yes || stage >= 2) {
        // ab Stufe 2 ist auch der "Nein"-Knopf ein Ja
        show(stage >= 2
          ? { mood: 'smug', text: '{w|YES!} See? Was that so hard? {q|Yes. It was. For me. I almost cried.}' }
          : { mood: 'excited', text: "{w|YES!} Okay! Okay. Follow me. {q|Don't make eye contact with the dice.}" });
        sfx('chime');
        finishPrompt(true, 2.2);
        return;
      }
      if (stage === 0) {
        stage = 1;
        B.tutNo.label = 'Still no';
        show({ mood: 'shocked', text: 'Wait. {s|No?} Are you {b|sure}? I really, {w|really} think you would like it. I made {g|snacks}. {q|Imaginary snacks.}' });
        return;
      }
      // Stufe 2: "Nein" wird ein exaktes Ebenbild von "Ja", oben rechts erscheint ein X
      stage = 2;
      Object.assign(B.tutNo, { label: B.tutYes.label, colour: B.tutYes.colour, size: B.tutYes.size, w: B.tutYes.w });
      B.tutNo.juice.up(0.5, 0.08); B.tutYes.juice.up(0.5, 0.08);
      eng.shake(12);
      sfx('bust');
      show({ mood: 'furious', text: '{sbr|YOU.} {sbr|WILL.} {sbr|PLAY.} {sbr|THE.} {sbr|TUTORIAL!}' });
    }
    // Klick auf das X oben rechts
    function closeX() {
      if (promptChoice !== null || stage < 2) return;
      if (stage === 2) {
        stage = 3;
        sfx('card');
        show({ mood: 'nervous', text: "Wait wait wait! Okay. Real talk. I {s|need} this. I get paid {g|per tutorial}. My mom charges me {g|rent}. {d|In this economy.}" });
        return;
      }
      // Stufe 3: er gibt auf und geht
      stage = 4;
      leaving = { t0: eng.time + 2.2 };
      show({ mood: 'disappointed', text: "{d|...fine.} I'll just... go. {q|Enjoy the game. Without me. Alone. Like always.}" });
      sfx('gameover');
      finishPrompt(false, 4.4);
    }

    // Jonny merkt sich, wie oft man schon da war
    function introLines(runs, declined) {
      if (runs === 0) return declined ? [
        L('shocked', 'Oh! You came back! You said {d|no} last time.'),
        L('paranoid', 'I remember. {s|I remember everything.} But I forgive you. {q|Mostly.}'),
      ] : [];
      if (runs === 1) return [
        L('shocked', 'Wait. {b|You} again?'),
        L('paranoid', 'You already did this tutorial. Why are you back? Is this an {s|audit}? Are you from the {s|casino}?'),
        L('smug', 'Fine. Maybe you just missed me. {q|Everyone misses me eventually.}'),
        L('neutral', 'Same dice, same shop, same jokes. I rigged it all {g|exactly} the same. Consistency is a virtue.'),
      ];
      if (runs === 2) return [
        L('nervous', 'Third time. {s|Third.} This is a {g|pattern}.'),
        L('smug', "I respect patterns. It's literally the build we're doing. {q|Coincidence? I think not.}"),
        L('fourth', '...are you okay out there? Do you just like hanging out with me? {q|That would be nice.}'),
        L('neutral', '{q|*ahem*} Right. Dice.'),
      ];
      return pick([
        [L('bored', 'Tutorial number {g|' + (runs + 1) + '}. I could do this in my sleep. {q|I DO do this in my sleep.}'),
          L('fourth', "Honestly? I've started looking forward to it. Don't tell anyone."), L('neutral', '{q|*ahem*} From the top.')],
        [L('paranoid', 'Visit number {g|' + (runs + 1) + '}. Either you love me or you are {s|studying} me.'),
          L('nervous', '{q|Please be the first one.}'), L('neutral', '{q|*ahem*} Okay. Dice. Again.')],
        [L('smug', 'Back for round {g|' + (runs + 1) + '}? I knew it. Nobody explains dice like Jonny.'),
          L('disappointed', '{d|Mostly because nobody else explains dice.}'), L('neutral', '{q|*ahem*} Anyway.')],
      ]);
    }
    function start(opts = {}) {
      active = true; finished = false; modal = false;
      mistakes = 0; gaveUp = false; lastMistake = -9; idleCount = 0; queue = [];
      totalMistakes = 0; everGaveUp = false; correctStreak = 0; unfairCount = 0; sinceUnfair = 0; unfairLeft = UNFAIR.slice();
      round = 0; handInRound = -1; rerollNo = 0; shopNo = 0; lastScore = 0; lastAction = eng.time;
      si = -1; cur = null; pending = -1;
      intro = introLines(opts.runs || 0, !!opts.declined);
    }
    function stop() { active = false; modal = false; cur = null; queue = []; }
    // Neue Runde: Zähler für die gezinkten Würfel
    function roundStart(idx) { round = idx; handInRound = -1; }

    return {
      get active() { return active; }, get totalMistakes() { return totalMistakes; }, get everGaveUp() { return everGaveUp; },
      head: (mood, blink) => paintJonny(mood || 'neutral', false, !!blink, 0, true),
      makeLine, tickLine, drawSpeech, moods: Object.keys(FACES),
      face: (ctx, x, y, s, mood, t, talking) => drawJonny(ctx, x, y, s, mood, !!talking, t, false),
      portrait: (ctx, x, y, s, mood, t) => drawJonny(ctx, x, y, s, mood, false, t, true), get modal() { return modal; }, get mistakes() { return mistakes; },
      start, stop, prompt, answer, closeX, event, rig, beginHand, beginReroll, roundStart, shopItem, update, draw, click, buttons, advance,
      // Im Tutorial gibt es kein Verlieren: Jonny schenkt eine Hand
      extraHand() {
        if (!active) return false;
        interject([{ mood: 'paranoid', text: "Out of hands? Here. I'm giving you {g|another one}. Don't tell the casino. {q|They'd take my license.}" }]);
        return true;
      },
      finish() { finished = true; },
      // nur für Tests: aktueller Schritt und Satz
      _sheet: () => { const c = document.createElement('canvas'), names = Object.keys(FACES); c.width = names.length * 130; c.height = 170; const x = c.getContext('2d'); x.fillStyle = '#20302A'; x.fillRect(0, 0, c.width, c.height); names.forEach((n, i) => { drawJonny(x, 8 + i * 130, 8, 1.8, n, false, 1.3, false); x.fillStyle = '#fff'; x.font = '14px monospace'; x.fillText(n, 10 + i * 130, 160); }); return c.toDataURL(); },
      _dbg: () => ({ gaveUp, total: totalMistakes, unfair: unfairCount, step: si, anchor: steps[si] && steps[si].anchor, mood: cur && cur.mood, text: cur && cur.words.map((w) => w.t).join('').slice(0, 70) }),
    };
  };
})();
