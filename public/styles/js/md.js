/* Tiny Markdown renderer for the STYLE.md files: headings, paragraphs, lists, tables, fenced code, quotes,
   inline code, bold, italic, links. Everything is escaped first – the specs never inject raw HTML. */
(function () {
  'use strict';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(text) {
    const codes = [];
    let s = text.replace(/`([^`]+)`/g, (m, c) => {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    s = esc(s)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
        const safe = /^(https?:|\.{0,2}\/|#|[\w-]+\.(md|json|js|html|txt))/i.test(href) ? href : '#';
        return '<a href="' + safe + '"' + (/^https?:/.test(safe) ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\w*])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => {
      const c = codes[+i];
      const hex = /^#[0-9a-fA-F]{6}$/.test(c);
      return hex ? '<code class="hex"><i style="background:' + c + '"></i>' + esc(c) + '</code>' : '<code>' + esc(c) + '</code>';
    });
    return s;
  }

  function table(rows) {
    const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    let h = '<div class="tbl"><table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
    for (const r of body) {
      h += '<tr>' + r.map((c) => {
        const m = /^`?(#[0-9a-fA-F]{6})`?$/.exec(c);
        return m ? '<td><code class="hex"><i style="background:' + m[1] + '"></i>' + m[1] + '</code></td>' : '<td>' + inline(c) + '</td>';
      }).join('') + '</tr>';
    }
    return h + '</tbody></table></div>';
  }

  const LI = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  /** One list item: its first paragraph inline, nested lists/code blocks rendered recursively. */
  function item(lines) {
    const rest = lines.slice(1);
    const pad = Math.min(...rest.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length), 99);
    const body = rest.map((l) => l.slice(Math.min(pad, l.length - l.trimStart().length)));
    const para = [lines[0]];
    let k = 0;
    while (k < body.length && body[k].trim() && !LI.test(body[k]) && !/^```/.test(body[k])) para.push(body[k++].trim());
    const more = body.slice(k).join('\n').trim();
    return '<li>' + inline(para.join(' ')) + (more ? render(more) : '') + '</li>';
  }

  function render(md, opts) {
    opts = opts || {};
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let out = '', i = 0;
    const shift = opts.headingShift || 0;
    while (i < lines.length) {
      const line = lines[i];
      const fence = /^```(\w*)/.exec(line);
      if (fence) {
        const lang = fence[1] || 'text';
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out += '<div class="code" data-lang="' + esc(lang) + '"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(buf.join('\n')) + '</code></pre></div>';
        continue;
      }
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        const lvl = Math.min(6, h[1].length + shift);
        const id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        out += '<h' + lvl + ' id="md-' + id + '">' + inline(h[2]) + '</h' + lvl + '>';
        i++;
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
        out += table(rows);
        continue;
      }
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        out += '<blockquote>' + render(buf.join('\n')) + '</blockquote>';
        continue;
      }
      const li = LI.exec(line);
      if (li) {
        const base = li[1].length;
        const ordered = /\d/.test(li[2]);
        const items = [];
        while (i < lines.length) {
          const l = lines[i];
          const m = LI.exec(l);
          const ind = l.length - l.trimStart().length;
          if (m && ind <= base + 1 && /\d/.test(m[2]) === ordered) { items.push([m[3]]); i++; continue; }
          if (!l.trim()) {
            // a blank line continues the list only if more of it follows
            const next = lines[i + 1] || '';
            const nind = next.length - next.trimStart().length;
            if (next.trim() && (nind > base || (LI.test(next) && nind <= base + 1))) { items[items.length - 1].push(''); i++; continue; }
            break;
          }
          if (ind > base && items.length) { items[items.length - 1].push(l); i++; continue; }
          break;
        }
        const tag = ordered ? 'ol' : 'ul';
        const start = ordered && parseInt(li[2], 10) > 1 ? ' start="' + parseInt(li[2], 10) + '"' : '';
        out += '<' + tag + start + '>' + items.map(item).join('') + '</' + tag + '>';
        continue;
      }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out += '<hr>'; i++; continue; }
      if (!line.trim()) { i++; continue; }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*([-*+]|\d+[.)])\s|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      out += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return out;
  }

  /** Splits a STYLE.md into { title, intro, sections: { heading: markdown } } – same rules as tools/styles-lib.mjs. */
  function sections(md) {
    const out = { title: '', intro: '', sections: {}, order: [] };
    let cur = null, buf = [], inFence = false;
    const flush = () => {
      const body = buf.join('\n').trim();
      if (cur === null) out.intro = body; else { out.sections[cur] = body; out.order.push(cur); }
      buf = [];
    };
    for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
      if (/^```/.test(line)) inFence = !inFence;
      if (!inFence && /^# /.test(line) && !out.title) { out.title = line.slice(2).trim(); continue; }
      const m = !inFence && /^## (.+)$/.exec(line);
      if (m) { flush(); cur = m[1].trim(); continue; }
      buf.push(line);
    }
    flush();
    return out;
  }

  window.MD = { render, sections, esc, inline };
})();
