/* Style registry. Every file in js/styles/ calls Styles.register({...}). See STYLE_API.md. */
(function () {
  'use strict';
  const Styles = {
    list: [],
    byId: {},
    register(style) {
      if (this.byId[style.id]) return;
      style._inited = false;
      this.list.push(style);
      this.byId[style.id] = style;
    },
    visible() {
      return this.list.filter((s) => !s.hidden);
    },
  };
  window.Styles = Styles;
})();
