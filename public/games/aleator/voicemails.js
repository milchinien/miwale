// Aleator – die Anrufbeantworter-Bänder von Jonnys Vater. window.WGTapes
// Acht Nachrichten, die er Jonny hinterlassen hat. Man findet sie über Secrets und Easter Eggs (game.js ruft tape(id)).
// Gespeichert in meta().tapes { id: Zeitstempel }, gemeinsam für alle Speicherplätze. Im Codex (Reiter Phone) nachzulesen.
// Alle acht: Secret "Answering Machine" und ein zusätzlicher Satz im Kampf gegen den Vater.
((global) => {
  'use strict';
  const LIST = [
    { id: 'first_call', title: 'Pick Up', hint: 'Answer the phone after a Showdown.',
      text: "Jonny, it's me. No, don't put the phone down. Your mother says you run your own table now. Good. Keep the dice clean. ...Mostly clean." },
    { id: 'night', title: '3 A.M.', hint: 'He calls late. Very late. Wait in the main menu.',
      text: "It's three in the morning and I'm talking to a machine. Your grandfather did the same thing. Night owls and bad decisions. Runs in the family." },
    { id: 'lesson', title: 'Lesson One', hint: 'He taught Jonny to cheat. Try it on a menu die.',
      text: 'Shift and click. Six times. I showed you that when you were seven. You loaded the die, then you looked guilty. Never look guilty, Jonny.' },
    { id: 'number', title: 'Six Six Six', hint: 'A very specific, very unholy score.',
      text: 'Somebody at your table just hit six hundred and sixty-six. I felt it from here. Your mother would light a candle. I would raise the stakes.' },
    { id: 'close', title: 'By a Hair', hint: 'Lose a run by a hair.',
      text: 'Lost by a hair? I lost the house once by less. Your mother kept the dog and the good dice. Fair trade. I miss the dog.' },
    { id: 'kid', title: 'The Kid', hint: 'Beat his son.',
      text: "Somebody beat my boy. ...Good. He needed that. I needed it at his age. Tell whoever it was: I'm waiting at the bottom." },
    { id: 'jacket', title: 'The Jacket', hint: 'Go deep into the Endless night.',
      text: "If they make it to twenty, I take the jacket off. Haven't done that since the old casino burned down. Don't ask who rolled last." },
    { id: 'dad', title: 'Dad', hint: 'Call him what Jonny calls him. Type it in the main menu.',
      text: "Nobody calls me that anymore. Not even him. ...Tell him the phone works both ways. Tell him I'm sorry about the birthday." },
  ];
  const BY_ID = Object.fromEntries(LIST.map((t) => [t.id, t]));
  const owned = (m) => (m && m.tapes) || {};
  const count = (m) => LIST.filter((t) => owned(m)[t.id]).length;
  // Band verbuchen: true, wenn es neu ist
  function add(m, id) {
    if (!m || !BY_ID[id]) return false;
    if (!m.tapes) m.tapes = {};
    if (m.tapes[id]) return false;
    m.tapes[id] = Date.now();
    return true;
  }
  const api = { LIST, BY_ID, owned, count, add, all: (m) => count(m) === LIST.length };
  global.WGTapes = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
