/* DOM HUD. Layout lives in css/base.css, each style re-skins it via its `css` string (scoped to body.style-<id>). */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);

  class Hud {
    constructor(game) {
      this.game = game;
      this.el = {
        hpFill: $('#hud .hp-fill'), hpText: $('#hud .hp-text'),
        xpFill: $('#hud .xp-fill'), lvl: $('#hud .lvl'),
        clock: $('#hud .clock-time'), kills: $('#hud .kills-num'),
        killsIcon: $('#hud .kills-icon'), hpIcon: $('#hud .hp-icon'),
        styleName: $('#stylebar .style-name'), styleFamily: $('#stylebar .style-family'),
        levelup: $('#levelup'), cards: $('#levelup .lu-cards'),
        gameover: $('#gameover'), goStats: $('#gameover .go-stats'),
        auto: $('#stylebar .auto'),
      };
      this.last = {};
      this.cardsFor = null;
    }
    setStyle(style) {
      this.style = style;
      this.el.styleName.textContent = style.name;
      this.el.styleFamily.textContent = style.family || '';
      this.drawIcon(this.el.killsIcon, 'kills');
      this.drawIcon(this.el.hpIcon, 'hp-heart');
      this.cardsFor = null;
      this.last = {};
    }
    drawIcon(canvas, id) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const st = this.style;
      if (st && st.drawIcon) {
        try {
          ctx.save();
          st.drawIcon(ctx, id, canvas.width);
          ctx.restore();
          canvas.style.display = '';
        } catch (e) {
          console.error(e);
        }
      } else canvas.style.display = 'none';
    }
    set(key, value, fn) {
      if (this.last[key] === value) return;
      this.last[key] = value;
      fn(value);
    }
    update(autoOn) {
      const g = this.game, p = g.player, el = this.el;
      this.set('hp', Math.ceil(p.hp) + '/' + p.maxHp, (v) => {
        el.hpFill.style.width = (100 * p.hp) / p.maxHp + '%';
        el.hpText.textContent = v;
      });
      this.set('xp', Math.round((1000 * g.xp) / g.xpNext), (v) => (el.xpFill.style.width = v / 10 + '%'));
      this.set('lvl', g.level, (v) => (el.lvl.textContent = 'Lv ' + v));
      this.set('clock', g.clockText, (v) => (el.clock.textContent = v));
      this.set('kills', g.kills, (v) => (el.kills.textContent = v));
      this.set('auto', autoOn, (v) => el.auto.classList.toggle('on', v));
      this.set('hurt', p.hurtT > 0.5, (v) => document.body.classList.toggle('hurt', v));

      // level up cards
      if (g.state === 'levelup' && g.choices) {
        if (this.cardsFor !== g.choices) {
          this.cardsFor = g.choices;
          el.cards.innerHTML = '';
          g.choices.forEach((u, i) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML =
              '<canvas class="card-icon" width="96" height="96"></canvas>' +
              '<div class="card-name"></div><div class="card-desc"></div><div class="card-key">' + (i + 1) + '</div>';
            card.querySelector('.card-name').textContent = u.name;
            card.querySelector('.card-desc').textContent = u.desc;
            this.drawIcon(card.querySelector('.card-icon'), u.id);
            card.addEventListener('click', () => g.choose(i));
            el.cards.appendChild(card);
          });
        }
        el.levelup.classList.remove('hidden');
      } else {
        this.cardsFor = null;
        el.levelup.classList.add('hidden');
      }
      const dead = g.state === 'dead';
      el.gameover.classList.toggle('hidden', !dead);
      if (dead) {
        this.set('go', g.kills + ':' + g.level, () => {
          el.goStats.textContent = 'Überlebt bis ' + g.clockText + ' · Level ' + g.level + ' · ' + g.kills + ' Rüben besiegt';
        });
      }
    }
  }
  window.Hud = Hud;
})();
