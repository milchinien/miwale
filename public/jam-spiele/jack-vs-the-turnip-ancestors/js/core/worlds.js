/* Worlds: each world is ONE evening. Its styles are the times of day – the run starts in the first style,
   cross-fades into the next one and ends at night in the last one, where the boss waits at midnight.
   Edit this list to regroup / reorder worlds. */
(function () {
  'use strict';
  window.Worlds = {
    list: [
      { id: 'herbsthof', name: 'The Harvest Farm', tag: 'A day on the pumpkin patch', styles: ['harvest16', 'dusk', 'gothic'] },
      { id: 'spielzeug', name: 'The Toy Box', tag: 'Bright blocks until bedtime', styles: ['cartoon', 'voxel', 'lowpoly'] },
      { id: 'bastelstube', name: 'The Craft Room', tag: 'Yarn, paper and clay', styles: ['crossstitch', 'paper', 'clay'] },
      { id: 'spielhalle', name: 'The Arcade', tag: 'From handheld to neon cabinet', styles: ['kuerbisboy', 'nes8bit', 'neon'] },
      { id: 'druckerei', name: 'The Print Shop', tag: 'Printer’s ink and chalk dust', styles: ['linocut', 'popart', 'chalk'] },
      { id: 'galerie', name: 'The Gallery', tag: 'Paintings that come alive', styles: ['watercolor', 'stainedglass', 'vangogh'] },
      { id: 'halloween', name: 'Halloween Night', tag: 'The finale at midnight', styles: ['candy', 'shadow'] },
    ],
    waveSeconds: 120, // per world, then the boss comes (split evenly over its styles)
    fadeSeconds: 3, // cross-fade between two styles
    startHour: 16, // the in-game clock runs 16:00 -> 24:00 inside every world
    available() {
      return this.list.filter((w) => w.styles.every((id) => window.Styles && window.Styles.byId[id]));
    },
  };
})();
