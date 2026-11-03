// Würfelglück – Jonnys Sprüche außerhalb des Tutorials (Shop und Situationen im Run). window.WG_JONNY
// Jeder Spruch: [Stimmung, Text]. Textauszeichnung wie im Tutorial: {flags|Text} mit s = zittern, w = wellen,
// d = durchhängen, b = groß, r = rot, q = leise, g = Begriff (gold), c = Pips, m = Power, p = pulsieren.
// Platzhalter #name# setzt das Spiel ein (#boss#, #tag#, #n#, #hand#, #money#, #score#, #stage#, #rule#, #x#).
// Listen in Listen sind Stufen: je weiter hinten, desto heftiger die Situation.
(function (global) {
  'use strict';

  const SHOP = {
    // Begrüßung nach Situation
    hello: {
      first: [
        ['happy', "Welcome to Jonny's! Everything is {g|legal}. {q|Mostly.}"],
        ['excited', 'A customer! A {w|real} one! Okay. Be cool, Jonny.'],
        ['neutral', 'First time here? Touch nothing. Buy everything.'],
      ],
      early: [
        ['neutral', 'Hi! Buy something. {q|I have rent.}'],
        ['smug', 'Back again? I knew you would be.'],
        ['paranoid', "Psst. Don't touch the stuff under the counter."],
        ['excited', "Fresh stock! {w|Smell} that? That's {g|relic} smell."],
        ['fourth', 'Do you think this shop is real? {q|*ahem*} Welcome!'],
        ['happy', 'Stage #stage#! Still early. Still {g|hope}.'],
        ['bored', "Oh. It's you. {q|I mean: oh! It's you!}"],
      ],
      mid: [
        ['neutral', 'Stage #stage#. The numbers get {s|scary} from here.'],
        ['smug', "Still alive? I'm {w|almost} impressed."],
        ['nervous', "The targets keep growing. {q|Like my debt.}"],
        ['paranoid', "Somebody's been rearranging my shelves. {s|Was it you?}"],
        ['happy', 'Halfway! Treat yourself. {q|Treat my wallet.}'],
        ['fourth', "{q|Off the record: the shop music is the same song. Don't tell.} *ahem*"],
      ],
      late: [
        ['nervous', "Stage #stage#. This is where people {d|cry}."],
        ['smug', "Almost at {g|my} Showdown. I've been stretching."],
        ['paranoid', "You're getting close. {s|Too} close."],
        ['excited', 'Late game! Big spends! {w|Big} numbers! {q|Big mistakes.}'],
        ['annoyed', "Don't look at me like that. Prices went up. {q|Inflation. Probably.}"],
      ],
      endless: [
        ['shocked', "Still going? I closed {g|hours} ago. {q|I didn't. But I wanted to.}"],
        ['bored', "Endless mode. Endless shopping. {d|Endless me.}"],
        ['paranoid', "Stage #stage#. Nobody's supposed to get this far. {s|Who sent you?}"],
        ['excited', "The numbers are {w|ridiculous} now. I love it here."],
        ['fourth', "{q|Do you ever sleep? Asking for the dice.} *ahem*"],
      ],
      broke: [
        ['disappointed', "$#money#. Window shopping, I see. {d|Classic.}"],
        ['smug', 'Low on cash? Have you tried {g|having more money}?'],
        ['annoyed', "If you're not buying, at least {s|look} rich."],
      ],
      rich: [
        ['excited', "{g|$#money#}?! Please. Sit. Can I get you a {w|chair}?"],
        ['smug', "Look who's loaded. My prices just {s|happened} to double. {q|Kidding.}"],
        ['paranoid', "That much cash? {s|Where} did you get that?"],
      ],
    },
    afterBoss: [
      ['happy', 'You beat {g|#boss#}! I never liked them.'],
      ['smug', '{g|#boss#} down. I taught you that. {q|I did not teach you that.}'],
      ['excited', '{w|#boss#} is gone! Do a little dance. {q|Not in the shop.}'],
      ['paranoid', "You beat {g|#boss#}. They'll be back. {s|They always come back.}"],
    ],
    close: [
      ['nervous', "That round was {s|close}. My heart can't take this."],
      ['shocked', "You scraped through by {g|#n#}! I had to sit down."],
      ['annoyed', "Cutting it fine again. {q|Some of us have blood pressure.}"],
    ],
    huge: [
      ['smug', '{g|#x#x} the target. {q|Show-off.}'],
      ['shocked', "{g|#x#x} the target?! Leave some points for the rest of us!"],
      ['excited', "{w|#x#x!} I'm putting that on the wall. {q|Next to my diploma.}"],
    ],
    lastStage: [
      ['smug', 'Next round is {g|me}. {q|Buy something nice for your funeral.}'],
      ['excited', "Final Showdown next! It's {w|me}! I've been {s|waiting}."],
      ['nervous', "Next round is me. I'm not nervous. {s|YOU'RE nervous.}"],
    ],
    special: [
      ['paranoid', "Psst. {g|Jonny's Special}. Half price. {q|Don't ask about the catch.}"],
      ['smug', "See the {g|Special}? Half price. {q|Totally no catch.}"],
      ['excited', 'The {g|Special} today is {w|amazing}. {q|Probably.}'],
      ['nervous', "That {g|Special} fell off a truck. {s|A legal truck.}"],
    ],
    job: [
      ['smug', 'Got another {g|job} for you. {q|Cash. No questions.}'],
      ['neutral', 'Do the {g|job}, get paid. Simple. {q|Like you.}'],
      ['paranoid', "The {g|job} is legit. {s|Don't look it up.}"],
      ['happy', "New {g|job}! I believe in you. {q|Ish.}"],
    ],
    jobIntro: [['neutral', 'See that card? A {g|job}. Do it next round and I pay you.']],
    nudge: [
      ['bored', 'Are you buying, or just {g|breathing} on the glass?'],
      ['fourth', '{q|Hello? Did you go get snacks?}'],
      ['annoyed', "I close in five minutes. {q|I don't. But hurry.}"],
      ['bored', "I've counted the dice on the shelf. {d|Twice.}"],
      ['paranoid', "You've been staring for a while. {s|Are you casing the place?}"],
    ],
    sell: [
      ['annoyed', 'Selling my stuff back to me? {s|Bold.}'],
      ['smug', "I'll sell that to the next person for {g|double}."],
      ['disappointed', "I picked that one out {d|personally}."],
      ['neutral', 'Fine. Refund. {q|Minus my feelings.}'],
    ],
    broke: [
      ['smug', "No money? I take... no. I don't take anything else."],
      ['disappointed', 'Window shopping. {d|Classic.}'],
      ['annoyed', "That costs {g|money}. The green paper. {q|You've seen it before.}"],
      ['fourth', '{q|We both know you clicked that on purpose.} *ahem*'],
    ],
    reroll: [
      [['annoyed', 'Not good enough for you?'], ['neutral', 'New stuff. {q|Same old me.}'], ['smug', 'Picky. I like picky. {q|I hate picky.}']],
      [['annoyed', 'Again? I {s|just} put those out!'], ['bored', 'Shuffle shuffle. {d|Riveting.}'], ['nervous', "You're making the shelves {s|nervous}."]],
      [['angry', '{s|Fine.} New stuff. {q|Happy now?}'], ['furious', 'Do you know how {s|heavy} these shelves are?!'], ['angry', "That's {g|#n#} rerolls! I'm charging you for {s|cardio}!"]],
    ],
    die: [
      ['bored', 'A die. {d|Riveting.}'], ['neutral', 'More dice, more problems. {q|Good problems.}'],
      ['happy', "A new die! It's {w|so} shiny. Name it after me."], ['smug', 'Bigger bag, bigger brain. {q|That is not how it works.}'],
    ],
    cursedDie: [['shocked', 'A {g|Cursed Die}? On {s|purpose}?'], ['paranoid', "You bought a {g|Cursed Die}. I'm standing {s|over here} now."]],
    upgrade: [
      ['happy', 'An upgrade! Finally something {g|sensible}.'], ['smug', 'Upgrades last the whole run. {q|Unlike your luck.}'],
      ['excited', "Ooh, a {g|permanent} one. Commitment! I've {w|heard} of that."],
    ],
    constellation: [['smug', 'Stars! {q|Nerd.} I mean that as a compliment.'], ['happy', 'Level up that hand! {w|Astronomy!}'], ['neutral', "I named a star after myself once. {q|It was a lamp.}"]],
    oracle: [['paranoid', 'Oracles work on {g|held} dice. {q|Not on me. Please.}'], ['nervous', "Careful, those {g|Oracles} talk back."]],
    tally: [['excited', 'Number levels. {w|Beautiful} math.'], ['smug', 'Tallies. For people who count. {q|So, not you. Kidding!}']],
    rare: [['excited', 'Ooh, a {g|Rare}! Careful, it bites.'], ['shocked', 'A {g|Rare}! I was saving that for {s|me}.'], ['smug', "A {g|Rare}. Fancy. {q|Don't drop it.}"]],
    legendary: [["shocked", "{b|LEGENDARY.} I'm not jealous. {s|At all.}"], ['furious', "{b|LEGENDARY?!} I didn't even know I {s|had} that!"]],
    sameTag: [['annoyed', 'Ugh, {g|#tag#} again? {q|Predictable.}'], ['smug', "Another {g|#tag#} relic. I see a {w|theme}."], ['bored', '{g|#tag#}, {g|#tag#}, {g|#tag#}. {d|Have you tried variety?}']],
    tags: {
      bank: [['smug', 'Bank build. Saving for something? {q|A personality?}'], ['happy', 'Interest! Money making money. {w|My dream.}']],
      number: [['excited', 'Numbers! My favourite. {q|After dice. And dinosaurs.}'], ['smug', 'Pick a number. Any number. {q|Not that one.}']],
      pattern: [['smug', 'Patterns. I respect patterns. {q|I AM a pattern.}'], ['neutral', 'Same hand, over and over. {g|Discipline.}']],
      luck: [['smug', 'Luck. The strategy of people without one.'], ['paranoid', 'Lucky charms. {s|They know things.}']],
      risk: [['nervous', 'Skulls again? You need a {g|safer} hobby.'], ['excited', '{r|Danger!} I love it. From {q|over here}.']],
      reroll: [['annoyed', 'More rerolls. Shake shake shake. {q|My wrists hurt.}'], ['neutral', 'Rerolls. Because the first try is {d|never} enough.']],
      hold: [['happy', "Holding dice. {g|Commitment}! I've heard of that."], ['smug', 'Hold on tight. {q|Like I hold grudges.}']],
      bag: [['neutral', 'Bigger bag. {g|Bigger} problems.'], ['happy', 'Dice collector! {w|Respect.}']],
      growth: [['neutral', 'Growth! Patience pays. {q|Eventually. Allegedly.}'], ['bored', 'It grows. Slowly. {d|Like this conversation.}']],
      formation: [['excited', "{g|Formation}! Line them up! I {w|love} a tidy table."], ['smug', "Arranging dice. {q|I alphabetise my socks.}"], ['paranoid', 'Dice in a row. {s|Like they are planning something.}']],
      none: [['smug', 'That one is... flexible. {q|Like my morals.}'], ['neutral', 'No tag. A free spirit. {q|Suspicious.}']],
    },
    mine: {
      jonny_glasses: ['shocked', 'Those are MY {g|glasses}! {q|That explains the blur.}'],
      off_record: ['paranoid', '{g|Off the Record}? {s|Shh.} We never talked about this.'],
      mood_ring: ['angry', "My {g|Mood Ring}! It's always on {s|furious}. {q|Weird.}"],
      jonny_autograph: ['excited', 'My {g|autograph}! I {w|knew} it was worth something!'],
    },
    catch: {
      none: [['shocked', "No catch! I'm being {w|nice}."], ['paranoid', "{q|Don't tell anyone.}"]],
      cursed: [['smug', 'It came with a {g|Cursed Die}. Package deal. {q|No refunds.}']],
      tax: [['smug', 'Tiny thing: I keep {g|$4} of your next round reward. {q|Fine print.}']],
      nosell: [['smug', 'Also: {g|non-refundable}. It sells for $0. {q|Fine print.}']],
    },
    // Beim Verlassen (selten)
    leave: {
      nothing: [['disappointed', 'Nothing? {d|Nothing at all?}'], ['annoyed', 'Thanks for visiting. {q|Thanks for nothing.}'], ['bored', 'Come back when you have {g|money}. Or taste.']],
      spree: [['excited', 'Come back {w|soon}! Bring your wallet!'], ['happy', "Pleasure doing business! {q|Mostly my pleasure.}"]],
      normal: [['neutral', 'Good luck out there. {q|You will need it.}'], ['smug', "Don't die. {q|Bad for business.}"], ['paranoid', "Watch the {g|Showdown}. I've heard {s|things}."]],
    },
  };

  const EVENT = {
    roundStart: {
      early: [['neutral', 'Warm-up. {q|Stretch your fingers.}'], ['happy', "Let's see what you've got! {q|Probably a Pair.}"], ['smug', 'Easy round. {g|Probably.}']],
      mid: [['nervous', "The targets are getting {s|big}."], ['neutral', 'Focus. Hold the good ones. {q|You know which ones those are. Right?}'], ['paranoid', 'This round feels {s|rigged}. Not by me. {q|This time.}']],
      late: [['nervous', "Stage #stage#. Breathe. {q|I'm not breathing.}"], ['excited', 'Big numbers time! {w|Big} {w|numbers!}'], ['paranoid', "One bad hand and it's over. {s|No pressure.}"]],
      endless: [['shocked', 'Target: {g|#score#}. Who even {s|counts} that high?'], ['bored', 'Another endless round. {q|I brought a pillow.}'], ['excited', "Stage #stage#! You're {w|off the map}!"]],
    },
    // Heat: Ziel steigt, weil die letzte Runde viel zu gut war (#x# = Prozent über dem normalen Ziel)
    heat: [
      [['paranoid', "You're winning {s|too} much. I raised the target. {g|+#x#%}. {q|Just a little.}"], ['smug', 'Word gets around. Target {g|+#x#%}. {q|Fame has a price.}'],
        ['nervous', "The pit boss saw your last round. Target {g|+#x#%}. {q|Not my idea. Mostly.}"], ['neutral', 'Good players get {g|tougher} tables. {g|+#x#%}. {q|House rules.}']],
      [['annoyed', "Okay, {s|stop} it. Target {g|+#x#%}. Let's see you do {w|that} again."], ['angry', "You're {s|bleeding} me dry! Target {g|+#x#%}!"],
        ['smug', 'Big scores, big targets. {g|+#x#%}. {q|Fair is fair.}'], ['paranoid', "Target {g|+#x#%}. Are you {s|counting} dice? You're counting dice."]],
      [['furious', "{b|DOUBLE.} The target is {b|DOUBLED.} That's as high as the rules let me go!"], ['shocked', "Max heat! {g|Twice} the target! {s|And you're still smiling?}"],
        ['angry', "{g|Double} or nothing. Well. {s|Double} or you lose. {q|Same thing.}"], ['smug', "The table's as hot as it gets. {g|x2.} {q|Show me.}"]],
    ],
    boss: {
      snake: [['paranoid', "{g|The Snake}. It eats your {g|lowest} scored die. {q|No legs. Suspicious.}"], ['smug', 'Snake round. Low dice are {d|snacks}. {q|Keep them high.}']],
      clamp: [['nervous', '{g|The Clamp}: two rerolls less per hand. Make them {s|count}.'], ['smug', 'Fewer rerolls. {q|Choose wisely. You won\'t.}']],
      frost: [['smug', '{g|The Frost}. Your 6s freeze. {q|Brrr.}'], ['neutral', "Frozen sixes can't be rerolled. {q|Build around them.}"]],
      chaos: [['paranoid', '{g|The Chaos}. Even held dice might roll. {s|Trust no one.}'], ['excited', 'Chaos round! {w|Anything} can happen!']],
      echo: [['smug', '{g|The Echo}. Repeat a hand type and it gets {g|half} Power. {q|Half. Half. Half.}'], ['neutral', 'Echo round. Mix it up or {d|lose half}.']],
      wall: [['annoyed', "{g|The Wall}. It's a wall. It doesn't even {s|move}."], ['nervous', "That target is {s|huge}. I'd bring a ladder."]],
    },
    bigHand: [
      [['happy', 'Nice hand! {q|Not as nice as mine would\'ve been.}'], ['neutral', 'Solid. {g|Solid.} I like solid.'], ['smug', 'Okay, okay. {g|Decent.}']],
      [['excited', 'One hand! {w|One hand} and the round is done!'], ['shocked', "Who taught you that? {q|Oh right. Me.}"], ['happy', "That's the whole round! {q|In one go!}"]],
      [['shocked', '{b|#x#x} the target! Are you {s|cheating}?'], ['excited', '{w|HUGE!} Did you see that number?!'], ['paranoid', "That's {g|#x#x} the target. {s|I'm calling the casino.}"]],
      [['furious', '{b|#x#x?!} That is {s|illegal}. That has to be illegal!'], ['shocked', "{b|WHAT.} I need to lie down. {q|On the dice.}"]],
    ],
    record: [['shocked', 'New personal best: {g|#score#}! {q|I wrote it down.}'], ['excited', '{b|NEW RECORD!} {g|#score#}! Frame it!'], ['smug', "{g|#score#}. Best hand you've {w|ever} played. {q|I'm a proud tutor.}"]],
    bust: [
      [['angry', '{r|BUST!} The skulls have {s|faces}! You can {g|see} them!'], ['disappointed', "A Bust. It happens. {q|To newbies.}"], ['shocked', '{r|BUST!} I {s|told} you about skulls! Did I? I meant to.']],
      [['annoyed', 'Second Bust. {d|We talked about this.}'], ['smug', 'Skulls again? You two should get a {g|room}.'], ['angry', '{r|Again?!} Count the skulls! It\'s {s|three}!']],
      [['furious', '{r|#n# BUSTS!} Are you doing this on {s|purpose}?!'], ['disappointed', "{d|#n# Busts.} I'm not mad. {q|I'm just disappointed.}"], ['fourth', '{q|At this point the skulls are winning on points.} *ahem*']],
    ],
    lucky: [
      [['excited', "Lucky! {q|I'm taking credit.}"], ['happy', '{w|Lucky!} The dice like you today.'], ['smug', 'Luck. {q|The one strategy I never mastered.}']],
      [['shocked', '{b|#n# Lucky Hits} in one roll! {s|Who are you?}'], ['paranoid', "That's too lucky. {s|Way} too lucky. {q|I'm checking the dice.}"]],
    ],
    desperate: [
      [['nervous', "Last hand and still {g|#n#} short. {s|No pressure.}"], ['paranoid', "Last hand. I can't look. {q|I'm looking.}"], ['neutral', 'Last hand. Go {g|big} or go home. {q|Probably home.}']],
      [['shocked', "{g|#n#} to go on your {s|last} hand?! Pray."], ['disappointed', "That's a {d|lot} of points for one hand."], ['fourth', '{q|You can still win. Statistically. A little.} *ahem*']],
    ],
    closeWin: [['shocked', 'By {g|#n#} points! {s|#n#!} My heart!'], ['nervous', "That was {s|way} too close."], ['happy', 'Photo finish! {w|Barely} counts as winning!']],
    clutch: [['excited', '{w|LAST HAND!} You did it on the last hand!'], ['shocked', "Last hand win! {s|Don't} do that to me."], ['smug', 'Clutch. {q|I was never worried. I was very worried.}']],
    money: [
      [['excited', '{g|$#money#}! Look at you, {w|saving}!'], ['smug', '{g|$#money#}. Interest loves you.']],
      [['shocked', '{g|$#money#}?! Are you robbing the casino?'], ['paranoid', "That's a lot of money. {s|People talk.}"]],
      [['furious', '{b|$#money#!} Lend me some. {s|Please.}'], ['fourth', '{q|Seriously. Lend me twenty.} *ahem*']],
    ],
    set: [
      [['happy', "{g|#tag#} set! Three of a kind. {q|Relics, I mean.}"], ['smug', 'Set bonus: {g|#tag#}. Now we\'re {w|building}.'], ['excited', 'Three {g|#tag#} relics! The bonus kicks in!']],
      [['shocked', '{b|FIVE} {g|#tag#} relics?! Full set! {w|Glorious!}'], ['excited', 'Full {g|#tag#} set! This is a {w|real} build now!']],
    ],
    link: [
      [['excited', "A {g|Link}! Dice side by side score {c|more}. {w|Neat.}"], ['neutral', 'See that? Same numbers {g|next to each other} form a Link.'], ['smug', 'Links. {q|I invented tidiness.}']],
      [['happy', 'A {g|chain} of three! Look how {w|tidy}!'], ['smug', 'Three in a row. {q|Like ducks. Rich ducks.}']],
      [['shocked', '{b|#n#-dice chain!} Choo choo!'], ['excited', "A {g|#n#}-chain! The dice are {w|holding hands}!"]],
    ],
    palindrome: [['excited', 'Same forwards and backwards! {w|Palindrome!} {q|Like my name. Wait. No.}'], ['smug', "A {g|Palindrome}. Racecar. Kayak. {q|Jonny? No.}"]],
    shift: [
      [['neutral', "You can {g|Shift} dice: drag one onto another to swap them."], ['happy', 'Rearranging! Dice like a {g|tidy} table.']],
      [['annoyed', "That's a lot of {g|Shifting}. {q|Interior designer?}"], ['bored', 'Shift, shift, shift. {d|They were fine where they were.}']],
    ],
    five: [['excited', "{b|FIVE OF A KIND!} I'm framing this!"], ['shocked', '{b|FIVE!} All the same! {s|Is that even allowed?}'], ['happy', 'Five alike! {w|Beautiful.} {q|I might cry.}']],
    four: [['excited', '{g|Four of a Kind}! So close to five!'], ['smug', "Four. {q|Five was right there. Just saying.}"]],
    streak: [
      [['smug', '{g|#hand#} again? {q|You have a type.}'], ['neutral', 'Third {g|#hand#} in a row. {g|Consistent.}']],
      [['bored', '{g|#hand#}. Again. {d|For the #n#th time.}'], ['annoyed', 'Do you know any {s|other} hands?']],
    ],
    rerollSpree: [
      [['annoyed', "Stop shaking them. You'll {s|wake} the dice."], ['nervous', 'That many rerolls? The dice are {s|dizzy}.']],
      [['furious', '{b|#n# rerolls!} The dice are going to {s|file a complaint}!'], ['bored', '{d|Shake. Shake. Shake.} I aged a year.']],
    ],
    idle: [['bored', 'Hello? The dice fell asleep. {q|So did I.}'], ['fourth', "{q|Are you still there? I can hear you breathing.} *ahem*"], ['paranoid', "You stopped moving. {s|Is this a trap?}"]],
    chaos: [['excited', 'New twist: {g|#rule#}! {w|Chaos!}'], ['paranoid', '{g|#rule#}. {s|Who} decides these things?'], ['smug', '{g|#rule#}. Adapt or {d|lose}.']],
    endless: {
      start: [['shocked', "{b|ENDLESS?!} You beat me and you want {s|more}?"], ['excited', 'Endless mode! The targets never stop. {w|Neither do you!}'], ['paranoid', "Nobody goes past Stage 8. {s|Nobody.} Good luck."]],
      stage: [
        [['nervous', 'Stage #stage#. Uncharted territory. {q|Here be dragons.}'], ['excited', "Stage #stage#! You're {w|off the map}!"]],
        [['shocked', 'Stage #stage#?! I need a {g|bigger} calculator.'], ['paranoid', 'Stage #stage#. The numbers are {s|staring} at me.']],
        [['furious', '{b|Stage #stage#!} Go to {s|bed}!'], ['fourth', '{q|I have never seen a run this long. I am a little scared.} *ahem*']],
      ],
    },
  };

  global.WG_JONNY = { SHOP, EVENT };
})(typeof window !== 'undefined' ? window : globalThis);
