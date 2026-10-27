/* Loads the content layer (new enemies + upgrades + per-style art). Include ONE tag after all js/styles/*.js and
   before js/app.js / js/main.js:   <script src="js/content/load.js"></script>
   document.write keeps the scripts parser-blocking and in order (works from file:// and the Vite dev server). */
(function () {
  'use strict';
  if (/[?&]nocontent(=|&|$)/.test(location.search)) { document.write('<script src="js/content/debug.js"></script>'); return; } // A/B testing: the game without the content layer (debug helpers only)
  var base = 'js/content/';
  var core = ['core', 'enemies', 'upgrades', 'icons'];
  var art = ['harvest16', 'kuerbisboy', 'gothic', 'dusk', 'cartoon', 'paper', 'watercolor', 'neon', 'lowpoly', 'linocut',
    'nes8bit', 'stainedglass', 'clay', 'chalk', 'candy', 'crossstitch', 'popart', 'vangogh', 'shadow', 'voxel'];
  var html = '';
  core.forEach(function (f) { html += '<script src="' + base + f + '.js"></script>'; });
  art.forEach(function (id) { html += '<script src="' + base + 'art/' + id + '.js"></script>'; });
  html += '<script src="' + base + 'debug.js"></script>';
  document.write(html);
})();
