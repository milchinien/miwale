// Aleator – überarbeitete Menü- und Hinweistexte (Einstellung Look > New texts).
// Links der alte Text genau wie im Spiel, rechts der neue. Ersetzt wird beim Zeichnen (BalatroFX UI.textMap),
// also nur feste Texte; Texte mit Zahlen darin bleiben, wie sie sind. Neue Texte etwa gleich lang halten.
(function (global) {
  'use strict';
  global.WG_TEXTS = {
    'Hold dice, reroll, play your hand. 8 stages. Good luck.': 'Eight stages. One bag of dice. Jonny is watching.',
    'Same dice, shops and bosses for everyone today.': 'Everyone gets the same dice today. No excuses.',
    'Your rated attempt for today is ready.': 'One try counts today. Make it a good one.',
    'Today: you won! Play again as practice.': 'Done for today. Anything now is practice.',
    'Holds one run at a time': 'One run fits in here',
    'Start a new run here': 'Empty. Fill it with a run',
    'No relics yet': 'Pockets still empty',
    'Choose a Save': 'Pick a Save',
    'Saving is possible once the dice have settled': 'Wait until the dice stop, then you can save',
    'Drawn cups are used up when you start a run with them': 'A drawn cup is gone once you start a run with it',
    'Win a run to open the Colour Studio': 'Win one run and the Colour Studio is yours',
    'Phone calls: nothing yet': 'Phone calls: nobody called yet',
    'Choose a tag. You get its strongest relic you do not own yet.': 'Pick a tag. You get its best relic you are missing.',
    'No runs yet. Finish a run and it shows up here.': 'Nothing here yet. Finish a run and it lands here.',
    'The phone rings after every Showdown. Pick up to choose a gift for this run.': 'After every Showdown the phone rings. Pick up, and there is a gift in it for this run.',
    'Unlocked. Get it once to fill this page.': 'Unlocked. Get it once and this page fills in.',
  };
})(typeof window !== 'undefined' ? window : globalThis);
