/* Study Buddy notepad (called the scratch pad until November 2026; the code names SBPad, sb-scratchpad.js and the storage keys stay).
   One page with formatted typing underneath and pens and shapes on top, like a paper notebook.

     SBPad.open({ question, source, opener, note, scope, onClose, full, mode })
                                                       open the notepad (one at a time). question: plain text shown at the top and in pictures.
                                                       source: the module's name. note: open a saved note. full: open full screen on a desktop.
                                                       mode: 'type' | 'draw' | 'shapes' (math questions open on Draw, everything else on Type).
     SBPad.setQuestion(text)                           the question changed (the note stays)
     SBPad.guard(fn)                                   closes the notepad (asking to save first if there is writing), then calls fn
     SBPad.isOpen()
     SBPad.renderList(box, { onOpen })                 the saved-notes list (also used by the My notes page)
     SBPad.store                                       list / add / remove for 'session' and 'profile' notes
     SBPad.thumbnail()                                 a small picture of the open note (math "show my work")
     SBPad.download(note|null)                         the Download box (PDF, Word, text, picture); null = the open note

   A note: { id, at, v: 2, question, mod, paper, font, size, html, items, w, h }.
     html   the typed text (cleaned by sanitize(): only the tags and styles the toolbar makes)
     items  pen strokes {k:'s'}, old typed boxes {k:'t'} (notes from before November 2026), and shapes {k:'h'}.
            Coordinates start at the top left of the text area. A stroke or shape can carry a: { b, t }: the text block it was drawn
            next to and that block's top at the time, so it moves down with its block when text is added above it.
   Nothing is saved unless the student chooses to: to the profile, for this session only, or as a downloaded file.
   The paper stays light in dark mode on purpose, like real paper. All other colors follow the theme tokens in sb.css. */
(function () {
  'use strict';
  if (window.SBPad) return;
  const SB = window.SB, esc = SB.esc;
  const NS = 'studybuddy.v1';
  const PAPER = { bg: '#fffdf5', line: '#b9c9de', grid: '#d3dfec', major: '#a9bdd6', LINE: 32, GRID: 24, MAJOR: 5, head: '#1d2733' };
  const PAGE = { W: 816, H: 1056, PADX: 96, PADY: 72 };   // a letter page at 96 per inch, with 1 inch side margins
  PAGE.BODY = PAGE.H - 2 * PAGE.PADY;                       // the text that fits on one page
  const COLORS = [['Black', '#1d2733'], ['Blue', '#1f5fbf'], ['Red', '#d23b2a'], ['Green', '#1f8a4c'], ['Orange', '#e8890c'], ['Purple', '#7a4cc2'], ['Pink', '#d9468f'], ['Brown', '#8b5a2b'], ['Yellow', '#f2c200']];
  const FILLS = [['No fill', ''], ['White', '#ffffff'], ['Light yellow', '#fff3b0'], ['Light blue', '#cfe3ff'], ['Light green', '#d3f2dc'], ['Light pink', '#fbd5e6'], ['Light orange', '#ffe0bd']].concat(COLORS);
  const MARKS = [['No highlight', ''], ['Yellow', '#fff07a'], ['Green', '#b9f3c6'], ['Blue', '#bfe1ff'], ['Pink', '#ffc9e3'], ['Orange', '#ffd8a8']];
  const FONTS = [['hand', 'Handwriting', "'SB Hand','Patrick Hand','Comic Sans MS',cursive"], ['print', 'School print', "'SB Print',Andika,sans-serif"], ['cursive', 'Cursive', "'SB Cursive',cursive"],
    ['sans', 'Simple', "Arial,Helvetica,sans-serif"], ['serif', 'Book', "Georgia,'Times New Roman',serif"], ['mono', 'Typewriter', "Consolas,'Courier New',monospace"], ['dys', 'OpenDyslexic', "OpenDyslexic,sans-serif"]];
  const SIZES = [['s', 'Small', 16], ['m', 'Normal', 21], ['l', 'Large', 26], ['xl', 'Huge', 34]];
  const WORDFONT = { hand: 'Patrick Hand', print: 'Andika', cursive: 'Playwrite US Trad', sans: 'Arial', serif: 'Georgia', mono: 'Courier New', dys: 'OpenDyslexic' };
  const SHAPES = [['rect', 'Rectangle'], ['round', 'Rounded box'], ['ellipse', 'Circle'], ['tri', 'Triangle'], ['star', 'Star'], ['line', 'Line'], ['arrow', 'Arrow']];
  const LIMITS = { profile: { notes: 25, bytes: 1200000 }, session: { notes: 15, bytes: 1200000 } };
  const DEVICE_NOTES = 2400000;   // all students' saved notes together, so notes can never crowd out progress (browsers allow about 5 MB)
  const MAXHTML = 300000;
  const otherNotes = kid => { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(NS + '.notes.') && k !== NS + '.notes.' + kid) n += (localStorage.getItem(k) || '').length; } } catch (e) {} return n; };
  const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
  const IC = {
    pad: sv('<rect x="3.5" y="3" width="12.5" height="18" rx="2"/><path d="M7 8h5.5M7 12h3"/><path d="M18.2 8.3l2.6 2.6-6.6 6.6-3.3.7.7-3.3z"/>'),
    pen: sv('<path d="M4 20l1-4.2L16 4.8l3.2 3.2L8.2 19z"/><path d="M13.5 7.3l3.2 3.2"/>'),
    pencil: sv('<path d="M5 19l1.2-4L17 4.2 19.8 7 9 17.8z"/><path d="M5 19l4-1.2M14.5 6.7l2.8 2.8"/>'),
    marker: sv('<path d="M7 14l7-9 4 3-7 9z"/><path d="M7 14l-2 5 5-1.5M15.5 6.5l2 1.5"/>'),
    highlighter: sv('<path d="M9 14l6-7 4 3.5-6 7z"/><path d="M9 14l-1 3.5 3 .5M4 21h9"/>'),
    brush: sv('<path d="M20 4c-5.5.8-9.5 4.8-10.5 9.2l2.8 2.8C16.7 15 20 11 20 4z"/><path d="M9.5 13.5C6.5 13.5 5 15.3 5 17.5 5 18.7 4 19.5 3 20c3.5 1 8.5.3 9.3-3.8"/>'),
    eraser: sv('<path d="M4.5 15.5l8-9 7 6.2-5 5.8H8.2z"/><path d="M10 18.5h10"/>'),
    type: sv('<path d="M5 7V5h14v2M12 5v14M9 19h6"/>'),
    shapes: sv('<rect x="3.5" y="10" width="9" height="9.5" rx="1"/><circle cx="16" cy="8" r="4.5"/>'),
    undo: sv('<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-3" transform="translate(0 -3)"/>', ' stroke-width="2.2"'),
    redo: sv('<path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5h-9a5 5 0 0 0 0 10h3" transform="translate(0 -3)"/>', ' stroke-width="2.2"'),
    trash: sv('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>'),
    lines: sv('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    grid: sv('<path d="M4 4h16v16H4zM4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>'),
    save: sv('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
    download: sv('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>', ' stroke-width="2.2"'),
    notes: sv('<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>', ' stroke-width="2.4"'),
    close: sv('<path d="M6 6l12 12M18 6L6 18"/>', ' stroke-width="2.4"'),
    full: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    side: sv('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M14 4v16"/>'),
    hand: sv('<path d="M8.5 13V6.5a1.5 1.5 0 0 1 3 0V11M11.5 10.5V4.5a1.5 1.5 0 0 1 3 0V11M14.5 11V6.5a1.5 1.5 0 0 1 3 0V15c0 3.8-2.4 6-5.6 6-2.6 0-4.1-1.3-5.4-3.5L4.4 14.4a1.4 1.4 0 0 1 2.3-1.5L8.5 15"/>'),
    bold: sv('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>', ' stroke-width="2.6"'),
    italic: sv('<path d="M10 5h8M6 19h8M14 5l-4 14"/>'),
    underline: sv('<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>'),
    strike: sv('<path d="M4 12h16M16.5 7.5C16 5.8 14.3 5 12 5c-2.8 0-4.5 1.3-4.5 3.2 0 1.6 1.2 2.5 3.4 3M8 16.5c.6 1.7 2.2 2.5 4.3 2.5 2.8 0 4.6-1.3 4.6-3.3 0-.8-.3-1.5-.9-2"/>'),
    link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    ul: sv('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>'),
    ol: sv('<path d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 14.5c.5-.8 2.8-.9 2.8.6 0 1-2.8 2-2.8 3.4h3"/>'),
    check: sv('<rect x="3" y="4" width="6" height="6" rx="1"/><path d="M4.5 7l1 1 2-2.2M12 7h8M12 17h8"/><rect x="3" y="14" width="6" height="6" rx="1"/>'),
    left: sv('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
    center: sv('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
    right: sv('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
    clear: sv('<path d="M6 5h12M12 5l-4 14M4 20l16-16"/>'),
    color: sv('<path d="M6 18L11.5 5h1L18 18M8.2 13h7.6"/>'),
    mark: sv('<path d="M9 14l6-7 4 3.5-6 7z"/><path d="M9 14l-1 3.5 3 .5"/>'),
    select: sv('<path d="M5 3.5l13 8.2-5.6 1.3 3.3 6.2-2.6 1.3-3.2-6.2L6 18.5z"/>'),
    rect: sv('<rect x="3.5" y="6" width="17" height="12"/>'),
    round: sv('<rect x="3.5" y="6" width="17" height="12" rx="4"/>'),
    ellipse: sv('<ellipse cx="12" cy="12" rx="8.5" ry="7"/>'),
    tri: sv('<path d="M12 4.5l8.5 15h-17z"/>'),
    star: sv('<path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/>'),
    line: sv('<path d="M4.5 19.5l15-15"/>'),
    arrow: sv('<path d="M4.5 19.5l15-15M11 4.5h8.5V13"/>'),
    fill: sv('<path d="M5 11l6-6 7 7-6 6z"/><path d="M19 15s1.8 2 1.8 3.2a1.8 1.8 0 0 1-3.6 0C17.2 17 19 15 19 15z"/>'),
    outline: sv('<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 2.5"/>'),
    shadow: sv('<rect x="3.5" y="3.5" width="12" height="12" rx="1.5"/><path d="M18 8.5v10H8.5" stroke-width="3"/>'),
    front: sv('<rect x="8" y="8" width="12" height="12" rx="1.5" fill="currentColor"/><path d="M4 15V4h11"/>'),
    back: sv('<rect x="4" y="4" width="12" height="12" rx="1.5" fill="currentColor"/><path d="M20 9v11H9"/>')
  };
  const PENTOOLS = [['pen', 'Pen'], ['pencil', 'Pencil'], ['marker', 'Marker'], ['highlighter', 'Highlighter'], ['brush', 'Brush'], ['eraser', 'Eraser']];
  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const fmtWhen = at => { try { return new Date(at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
  const fontCSS = id => (FONTS.find(f => f[0] === id) || FONTS[0])[2];

  /* ---------------- cleaning what is saved (notes also come from backup files) ---------------- */
  const isHex = c => /^#[0-9a-f]{6}$/i.test(String(c));
  const fin = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v)) ? Math.max(lo, Math.min(hi, v)) : d;
  const PENS = { pen: 1, pencil: 1, marker: 1, highlighter: 1, brush: 1, erase: 1 };
  const SHAPEIDS = Object.fromEntries(SHAPES.map(s => [s[0], 1]));
  const cleanAnchor = a => (a && typeof a === 'object' && typeof a.b === 'string' && /^[a-z0-9]{1,12}$/.test(a.b) && typeof a.t === 'number' && isFinite(a.t)) ? { b: a.b, t: fin(a.t, -5000, 200000, 0) } : undefined;
  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    if (it.k === 't') {
      if (typeof it.t !== 'string' || !it.t.trim() || !isHex(it.c)) return null;
      return { k: 't', c: it.c, s: fin(it.s, 8, 96, 20), x: fin(it.x, -5000, 5000, 0), y: fin(it.y, -5000, 200000, 0), t: it.t.slice(0, 2000) };
    }
    if (it.k === 'h') {
      if (!SHAPEIDS[it.sh]) return null;
      const o = { k: 'h', sh: it.sh, x: fin(it.x, -5000, 5000, 0), y: fin(it.y, -5000, 200000, 0), w: fin(it.w, -5000, 5000, 100), h: fin(it.h, -5000, 5000, 60),
        f: isHex(it.f) ? it.f : '', c: isHex(it.c) ? it.c : '#1d2733', lw: fin(it.lw, 0, 24, 3), sd: !!it.sd };
      const a = cleanAnchor(it.a); if (a) o.a = a; return o;
    }
    if (it.k !== 's' || !PENS[it.t] || !Array.isArray(it.p) || it.p.length < 3 || it.p.length % 3 || it.p.length > 60000) return null;
    if (!it.p.every(v => typeof v === 'number' && isFinite(v))) return null;
    const o = { k: 's', t: it.t, c: isHex(it.c) ? it.c : '#1d2733', w: fin(it.w, .5, 200, 3), p: it.p.map((v, i) => i % 3 === 2 ? fin(v, 0, 1, .5) : fin(v, -5000, i % 3 ? 200000 : 5000, 0)) };
    const a = cleanAnchor(it.a); if (a) o.a = a; return o;
  }
  /* The typed text keeps only what the toolbar can make. Anything else (scripts, pictures, other styles) is removed, never run:
     a <template> parses the text without loading or running anything. */
  const TAGMAP = { P: 'p', DIV: 'p', H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h3', H5: 'h3', H6: 'h3', BLOCKQUOTE: 'p', PRE: 'p', B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', STRIKE: 's', DEL: 's', A: 'a', UL: 'ul', OL: 'ol', LI: 'li', SPAN: 'span', FONT: 'span', BR: 'br' };
  const DROP = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, SVG: 1, MATH: 1, NOSCRIPT: 1, TITLE: 1, META: 1, LINK: 1, HEAD: 1, IMG: 1, VIDEO: 1, AUDIO: 1, CANVAS: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, FORM: 1 };
  const BLOCKS = { p: 1, h2: 1, h3: 1, ul: 1, ol: 1, li: 1 };
  function toHex(v) {
    v = String(v || '').trim(); if (isHex(v)) return v.toLowerCase();
    let m = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i); if (m) return ('#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toLowerCase();
    m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
    if (m) { if (m[4] != null && parseFloat(m[4]) === 0) return ''; return '#' + [m[1], m[2], m[3]].map(n => Math.min(255, +n).toString(16).padStart(2, '0')).join(''); }
    return '';
  }
  function safeURL(u) {
    u = String(u || '').trim(); if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = (/^[^\s/@]+@[^\s/@]+\.[a-z]{2,}$/i.test(u) ? 'mailto:' : 'https://') + u.replace(/^\/+/, '');
    try { const x = new URL(u); return /^(https?:|mailto:)$/i.test(x.protocol) && !/\s/.test(u) ? x.href : ''; } catch (e) { return ''; }
  }
  function sanitize(html, keepIds = true) {
    const t = document.createElement('template'); t.innerHTML = String(html || '').slice(0, MAXHTML);
    const out = document.createElement('div');
    (function copy(from, to) {
      [...from.childNodes].forEach(n => {
        if (n.nodeType === 3) { to.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toUpperCase();
        if (DROP[tag]) return;
        const nt = TAGMAP[tag];
        if (!nt) { copy(n, to); return; }                      // unknown wrapper: keep the text inside
        const el = document.createElement(nt);
        if (nt === 'a') { const h = safeURL(n.getAttribute('href')); if (!h) { copy(n, to); return; } el.setAttribute('href', h); }
        if (nt === 'ul' && n.classList.contains('check')) el.className = 'check';
        if (nt === 'li' && n.classList.contains('done')) el.className = 'done';
        if (nt === 'span') {
          const cls = [...n.classList].filter(c => /^ff-(hand|print|cursive|sans|serif|mono|dys)$/.test(c) || /^sz-(s|m|l|xl)$/.test(c)); if (cls.length) el.className = cls.join(' ');
          const col = toHex(n.style.color || (tag === 'FONT' ? n.getAttribute('color') : '')), bg = toHex(n.style.backgroundColor);
          if (col) el.style.color = col; if (bg) el.style.backgroundColor = bg;
          if (n.style.fontWeight === 'bold' || +n.style.fontWeight >= 600) { const b = document.createElement('b'); copy(n, b); el.appendChild(b); finish(); return; }
        }
        if (BLOCKS[nt] && nt !== 'ul' && nt !== 'ol') { const al = (n.style.textAlign || n.getAttribute('align') || '').toLowerCase(); if (al === 'center' || al === 'right') el.style.textAlign = al; }
        if (keepIds && BLOCKS[nt] && /^[a-z0-9]{1,12}$/.test(n.getAttribute('data-b') || '')) el.setAttribute('data-b', n.getAttribute('data-b'));
        copy(n, el); finish();
        function finish() {
          if (nt === 'span' && !el.className && !el.getAttribute('style')) { while (el.firstChild) to.appendChild(el.firstChild); return; }   // a span with nothing left is just its text
          to.appendChild(el);
        }
      });
    })(t.content, out);
    return out.innerHTML;
  }
  function cleanNote(n) {
    if (!n || typeof n !== 'object' || typeof n.id !== 'string' || !Array.isArray(n.items) || n.items.length > 6000) return null;
    const items = n.items.map(cleanItem).filter(Boolean);
    return { id: n.id.slice(0, 24), at: fin(n.at, 0, 9e15, 0), v: 2, question: typeof n.question === 'string' ? n.question.slice(0, 400) : '', mod: typeof n.mod === 'string' ? n.mod.slice(0, 80) : '',
      paper: n.paper === 'lines' || n.paper === 'graph' ? n.paper : 'blank', font: FONTS.some(f => f[0] === n.font) ? n.font : 'hand', size: SIZES.some(s => s[0] === n.size) ? n.size : 'm',
      html: typeof n.html === 'string' ? sanitize(n.html) : '', w: fin(n.w, 0, 4000, 0), h: fin(n.h, 0, 200000, 0), items };
  }
  const store = {
    canProfile(kid = SB.activeId()) { const p = SB.profile(kid); return !!p && !SB.isGuest(p); },
    area(scope) { return scope === 'session' ? sessionStorage : localStorage; },
    key(scope, kid = SB.activeId()) { return scope === 'session' ? NS + '.sessnotes.' + kid : NS + '.notes.' + kid; },
    list(scope, kid = SB.activeId()) {
      try { const v = JSON.parse(this.area(scope).getItem(this.key(scope, kid)) || '[]'); return Array.isArray(v) ? v.map(cleanNote).filter(Boolean) : []; } catch (e) { return []; }
    },
    write(scope, list, kid) { try { this.area(scope).setItem(this.key(scope, kid), JSON.stringify(list)); return true; } catch (e) { return false; } },
    add(scope, note, kid = SB.activeId()) {
      if (scope === 'profile' && !this.canProfile(kid)) return { ok: false, why: 'A name is needed to save to a profile.' };
      const lim = LIMITS[scope], list = this.list(scope, kid); list.unshift(note);
      const size = JSON.stringify(list).length;
      if (list.length > lim.notes || size > lim.bytes) return { ok: false, why: 'The notes are full. Delete an older note first.' };
      if (scope === 'profile' && size + otherNotes(kid) > DEVICE_NOTES) return { ok: false, why: 'Notes on this device are full. Delete some older notes first.' };
      return this.write(scope, list, kid) ? { ok: true } : { ok: false, why: 'There was no room to save that note. Delete an older note first.' };
    },
    replace(scope, note, kid = SB.activeId()) {
      const list = this.list(scope, kid), i = list.findIndex(n => n.id === note.id);
      if (i < 0) return this.add(scope, note, kid);
      list[i] = note; const size = JSON.stringify(list).length;
      if (size > LIMITS[scope].bytes || (scope === 'profile' && size + otherNotes(kid) > DEVICE_NOTES)) return { ok: false, why: 'The notes are full. Delete an older note first.' };
      return this.write(scope, list, kid) ? { ok: true } : { ok: false, why: 'There was no room to save that note. Delete an older note first.' };
    },
    remove(scope, id, kid = SB.activeId()) { this.write(scope, this.list(scope, kid).filter(n => n.id !== id), kid); }
  };

  /* ---------------- pens ---------------- */
  const rand = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const PATHY = { marker: 1, highlighter: 1 };
  const widthFor = (tool, size) => ({ pen: .5 * size + 1, pencil: .4 * size + 1, marker: 1.1 * size + 3, highlighter: 2.4 * size + 8, brush: 1.2 * size + 2.5, erase: 3 * size + 10 })[tool];
  function dot(g, s) {
    const x = s.p[0], y = s.p[1];
    g.save();
    if (s.t === 'erase') g.globalCompositeOperation = 'destination-out';
    g.fillStyle = s.c || '#000'; g.globalAlpha = s.t === 'highlighter' ? .35 : s.t === 'pencil' ? .8 : 1;
    const q = s.p[2], f = s.t === 'pen' ? .5 + q : s.t === 'brush' ? .25 + 1.5 * q : 1;
    g.beginPath(); g.arc(x, y, Math.max(.6, s.w * f / 2), 0, Math.PI * 2); g.fill(); g.restore();
  }
  function seg(g, s, i) {
    const p = s.p, a = (i - 1) * 3, b = i * 3, x0 = p[a], y0 = p[a + 1], x1 = p[b], y1 = p[b + 1], q = (p[a + 2] + p[b + 2]) / 2;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s.c || '#000';
    if (s.t === 'erase') { g.globalCompositeOperation = 'destination-out'; g.lineWidth = s.w; }
    else if (s.t === 'pen') g.lineWidth = s.w * (.5 + q);
    else if (s.t === 'brush') g.lineWidth = s.w * (.25 + 1.5 * q);
    else if (s.t === 'pencil') { g.globalAlpha = .8; g.lineWidth = s.w * (.6 + .8 * q); }
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    if (s.t === 'pencil') {      // grain: a lighter, thinner second pass that wobbles the same way every time the stroke is redrawn
      const lw = g.lineWidth, j = (rand(i, x0) - .5) * lw * .6, k = (rand(x1, i) - .5) * lw * .6;
      g.globalAlpha = .35; g.lineWidth = lw * .55; g.beginPath(); g.moveTo(x0 + j, y0 + k); g.lineTo(x1 + k, y1 + j); g.stroke();
    }
    g.restore();
  }
  function drawOldText(g, it, font) {      // typed boxes from notes made before November 2026
    g.save(); g.fillStyle = it.c; g.font = '600 ' + it.s + 'px ' + font; g.textBaseline = 'top';
    it.t.split('\n').forEach((ln, i) => g.fillText(ln, it.x, it.y + i * it.s * 1.3));
    g.restore();
  }
  function drawStroke(g, s) {
    const n = s.p.length / 3;
    if (n === 1) return dot(g, s);
    if (PATHY[s.t]) {
      g.save(); g.lineJoin = 'round'; g.lineCap = s.t === 'highlighter' ? 'butt' : 'round'; g.strokeStyle = s.c; g.lineWidth = s.w; g.globalAlpha = s.t === 'highlighter' ? .35 : .95;
      g.beginPath(); g.moveTo(s.p[0], s.p[1]); for (let i = 1; i < n; i++) g.lineTo(s.p[i * 3], s.p[i * 3 + 1]); g.stroke(); g.restore(); return;
    }
    for (let i = 1; i < n; i++) seg(g, s, i);
  }
  const OLDFONT = () => getComputedStyle(document.body).fontFamily || 'sans-serif';
  function measureOld(it) {
    const c = measureOld.c || (measureOld.c = document.createElement('canvas').getContext('2d')); c.font = '600 ' + it.s + 'px ' + OLDFONT();
    const lines = it.t.split('\n'); return { w: Math.max(...lines.map(l => c.measureText(l).width)), h: lines.length * it.s * 1.3 };
  }

  /* ---------------- shapes ---------------- */
  const boxOf = it => ({ x: Math.min(it.x, it.x + it.w), y: Math.min(it.y, it.y + it.h), w: Math.abs(it.w), h: Math.abs(it.h) });
  const isLine = it => it.sh === 'line' || it.sh === 'arrow';
  function starPts(b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, out = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? .4 : 1, a = -Math.PI / 2 + i * Math.PI / 5; out.push([cx + Math.cos(a) * b.w / 2 * r, cy + Math.sin(a) * b.h / 2 * r + b.h * .05]); }
    return out;
  }
  function arrowHead(it) {
    const x2 = it.x + it.w, y2 = it.y + it.h, ang = Math.atan2(it.h, it.w), L = Math.max(12, it.lw * 3.4), s = .45;
    return [[x2, y2], [x2 - L * Math.cos(ang - s), y2 - L * Math.sin(ang - s)], [x2 - L * Math.cos(ang + s), y2 - L * Math.sin(ang + s)]];
  }
  function shapeSVG(it, i, dy) {
    const b = boxOf(it), st = `fill="${it.f || 'none'}" stroke="${it.lw ? it.c : 'none'}" stroke-width="${it.lw}"${it.sd ? ' filter="url(#sbpShadow)"' : ''}`;
    let body = '';
    if (it.sh === 'rect' || it.sh === 'round') body = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${it.sh === 'round' ? Math.min(18, b.w / 4, b.h / 4) : 0}" ${st}/>`;
    else if (it.sh === 'ellipse') body = `<ellipse cx="${b.x + b.w / 2}" cy="${b.y + b.h / 2}" rx="${b.w / 2}" ry="${b.h / 2}" ${st}/>`;
    else if (it.sh === 'tri') body = `<polygon points="${b.x + b.w / 2},${b.y} ${b.x + b.w},${b.y + b.h} ${b.x},${b.y + b.h}" stroke-linejoin="round" ${st}/>`;
    else if (it.sh === 'star') body = `<polygon points="${starPts(b).map(p => p.join(',')).join(' ')}" stroke-linejoin="round" ${st}/>`;
    else {
      const c = it.lw ? it.c : '#1d2733', w = Math.max(1, it.lw);
      body = `<line x1="${it.x}" y1="${it.y}" x2="${it.x + it.w}" y2="${it.y + it.h}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${it.sd ? ' filter="url(#sbpShadow)"' : ''}/>`
        + (it.sh === 'arrow' ? `<polygon points="${arrowHead(Object.assign({}, it, { lw: w })).map(p => p.join(',')).join(' ')}" fill="${c}" stroke="${c}" stroke-width="1" stroke-linejoin="round"/>` : '')
        + `<line class="hit" x1="${it.x}" y1="${it.y}" x2="${it.x + it.w}" y2="${it.y + it.h}" stroke="transparent" stroke-width="${w + 16}"/>`;
    }
    return `<g data-i="${i}" transform="translate(0 ${dy})">${body}</g>`;
  }
  function drawShape(g, it) {
    const b = boxOf(it); g.save();
    if (it.sd) { g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 4; }
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (isLine(it)) {
      const c = it.lw ? it.c : '#1d2733', w = Math.max(1, it.lw);
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(it.x, it.y); g.lineTo(it.x + it.w, it.y + it.h); g.stroke();
      if (it.sh === 'arrow') { const h = arrowHead(Object.assign({}, it, { lw: w })); g.beginPath(); g.moveTo(h[0][0], h[0][1]); g.lineTo(h[1][0], h[1][1]); g.lineTo(h[2][0], h[2][1]); g.closePath(); g.fill(); }
      g.restore(); return;
    }
    g.beginPath();
    if (it.sh === 'rect') g.rect(b.x, b.y, b.w, b.h);
    else if (it.sh === 'round') { const r = Math.min(18, b.w / 4, b.h / 4); if (g.roundRect) g.roundRect(b.x, b.y, b.w, b.h, r); else g.rect(b.x, b.y, b.w, b.h); }
    else if (it.sh === 'ellipse') g.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(.1, b.w / 2), Math.max(.1, b.h / 2), 0, 0, Math.PI * 2);
    else { const pts = it.sh === 'tri' ? [[b.x + b.w / 2, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]] : starPts(b); g.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); }
    if (it.f) { g.fillStyle = it.f; g.fill(); }
    if (it.lw) { g.shadowColor = it.f ? 'transparent' : g.shadowColor; g.strokeStyle = it.c; g.lineWidth = it.lw; g.stroke(); }
    g.restore();
  }

  /* ---------------- where things sit: text blocks and anchors ---------------- */
  /* Content coordinates start at the top left of the text area (inside the padding), so a drawing stays beside the same words whether the
     notepad is a side panel, a full page, or full width. Each block (paragraph, heading, list item) carries data-b, a short id. */
  function blockTops(ed) {
    const pt = parseFloat(getComputedStyle(ed).paddingTop) || 0, m = {};
    ed.querySelectorAll('[data-b]').forEach(el => { let y = 0, n = el; while (n && n !== ed) { y += n.offsetTop; n = n.offsetParent; } if (n === ed && !(el.dataset.b in m)) m[el.dataset.b] = y - pt; });
    return m;
  }
  function anchorAt(ed, tops, y) {
    let best = null;
    ed.querySelectorAll('[data-b]').forEach(el => { const t = tops[el.dataset.b]; if (t != null && t <= y + .5 && (!best || t >= best.t)) best = { b: el.dataset.b, t: Math.round(t * 10) / 10 }; });
    return best;
  }
  const offOf = (it, tops) => (it.a && tops && tops[it.a.b] != null) ? tops[it.a.b] - it.a.t : 0;
  function itemBounds(items, tops) {
    let mx = 0, my = 0;
    items.forEach(it => {
      const d = offOf(it, tops);
      if (it.k === 't') { const m = measureOld(it); mx = Math.max(mx, it.x + m.w); my = Math.max(my, it.y + m.h + d); }
      else if (it.k === 'h') { const b = boxOf(it); mx = Math.max(mx, b.x + b.w + it.lw); my = Math.max(my, b.y + b.h + it.lw + d + (it.sd ? 8 : 0)); }
      else for (let i = 0; i < it.p.length; i += 3) { mx = Math.max(mx, it.p[i] + it.w / 2); my = Math.max(my, it.p[i + 1] + it.w / 2 + d); }
    });
    return { w: mx, h: my };
  }
  function drawInk(g, items, tops) {
    items.forEach(it => {
      if (it.k === 'h') return; const d = offOf(it, tops);
      if (d) { g.save(); g.translate(0, d); }
      if (it.k === 't') drawOldText(g, it, OLDFONT()); else drawStroke(g, it);
      if (d) g.restore();
    });
  }
  function drawShapes(g, items, tops) { items.forEach(it => { if (it.k !== 'h') return; const d = offOf(it, tops); g.save(); g.translate(0, d); drawShape(g, it); g.restore(); }); }

  /* the line under the letters: where the text baseline sits inside a 32px line of the note's font */
  function baselineOf(ed) {
    const pr = document.createElement('div'); pr.className = 'sbp-ed sbp-probe'; pr.dataset.ff = ed.dataset.ff || 'hand'; pr.dataset.sz = ed.dataset.sz || 'm';
    pr.innerHTML = '<p>Xg<i style="display:inline-block;width:0;height:0;vertical-align:baseline"></i></p>';
    (ed.parentNode || document.body).appendChild(pr);
    const p = pr.firstChild, i = p.lastChild, y = i.offsetTop - p.offsetTop; pr.remove();
    return y;
  }

  /* ---------------- pictures: one canvas of the paper, typed text, shapes and pen ---------------- */
  const zoomOf = el => { const r = el.getBoundingClientRect(); return (r.width / (el.offsetWidth || r.width || 1)) || 1; };
  /* draws the typed text of ed (in the page) onto g at content coordinates, and returns the line boxes (used to break PDF pages between lines) */
  function drawTyped(g, ed) {
    const z = zoomOf(ed), er = ed.getBoundingClientRect(), cs0 = getComputedStyle(ed), pl = parseFloat(cs0.paddingLeft) || 0, pt = parseFloat(cs0.paddingTop) || 0;
    const ox = er.left + (pl + ed.clientLeft) * z, oy = er.top + (pt + ed.clientTop) * z, lines = [];
    const rel = r => ({ x: (r.left - ox) / z, y: (r.top - oy) / z, w: r.width / z, h: r.height / z });
    const wk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let tn;
    const rg = document.createRange();
    while ((tn = wk.nextNode())) {
      const txt = tn.nodeValue; if (!txt) continue;
      const el = tn.parentElement, cs = getComputedStyle(el);
      if (cs.display === 'none') continue;
      const fs = parseFloat(cs.fontSize) || 20, font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      let deco = { u: false, s: false }, bg = '', color = cs.color;
      for (let n = el; n && n !== ed.parentNode; n = n.parentElement) {
        const c = getComputedStyle(n), l = c.textDecorationLine || c.textDecoration || '';
        if (/underline/.test(l)) deco.u = true; if (/line-through/.test(l)) deco.s = true;
        if (!bg && n !== ed) { const b = toHex(c.backgroundColor); if (b) bg = b; }
        if (n === ed) break;
      }
      g.font = font; const m = g.measureText('Hg'), asc = m.fontBoundingBoxAscent || fs * .8, des = m.fontBoundingBoxDescent || fs * .25;
      const parts = txt.split(/(\s+)/); let at = 0;
      parts.forEach(w => {
        const start = at; at += w.length; if (!w) return;
        rg.setStart(tn, start); rg.setEnd(tn, at);
        const rs = [...rg.getClientRects()].filter(r => r.width > 0 || r.height > 0);
        if (!rs.length) return;
        const draw = (s, r) => {
          const q = rel(r), base = q.y + (q.h - (asc + des)) / 2 + asc;
          if (bg) { g.fillStyle = bg; g.fillRect(q.x, q.y, q.w, q.h); }
          if (/\S/.test(s)) { g.fillStyle = color; g.fillText(s, q.x, base); lines.push({ y: q.y, b: q.y + q.h }); }
          if (deco.u || deco.s) { g.strokeStyle = color; g.lineWidth = Math.max(1, fs / 14); g.beginPath(); if (deco.u) { g.moveTo(q.x, base + fs * .12); g.lineTo(q.x + q.w, base + fs * .12); } if (deco.s) { g.moveTo(q.x, base - asc * .32); g.lineTo(q.x + q.w, base - asc * .32); } g.stroke(); }
        };
        if (rs.length === 1 || !/\S/.test(w)) draw(w, rs[0]);
        else for (let k = 0; k < w.length; k++) { rg.setStart(tn, start + k); rg.setEnd(tn, start + k + 1); const r = rg.getClientRects()[0]; if (r) draw(w[k], r); }   // a long word that wraps
      });
    }
    /* list markers: bullets, numbers and check boxes */
    ed.querySelectorAll('li').forEach(li => {
      const list = li.parentElement; if (!list) return;
      const cs = getComputedStyle(li), fs = parseFloat(cs.fontSize) || 20, lr = rel(li.getBoundingClientRect());
      const lh = parseFloat(cs.lineHeight) || fs * 1.4, firstLine = { y: lr.y, h: Math.min(lh, lr.h || lh) };
      g.font = `400 ${fs}px ${cs.fontFamily}`; const m = g.measureText('Hg'), asc = m.fontBoundingBoxAscent || fs * .8, des = m.fontBoundingBoxDescent || fs * .25;
      const base = firstLine.y + (firstLine.h - (asc + des)) / 2 + asc;
      g.fillStyle = cs.color; g.strokeStyle = cs.color;
      if (list.classList.contains('check')) {
        const s = Math.round(fs * .82), x = lr.x + 2, y = firstLine.y + (firstLine.h - s) / 2;
        g.lineWidth = 2; g.strokeRect(x, y, s, s);
        if (li.classList.contains('done')) { g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + s * .2, y + s * .52); g.lineTo(x + s * .42, y + s * .75); g.lineTo(x + s * .8, y + s * .25); g.stroke(); }
      } else if (list.tagName === 'OL') {
        const n = [...list.children].indexOf(li) + 1; g.textAlign = 'right'; g.fillText(n + '.', lr.x - fs * .3, base); g.textAlign = 'left';
      } else { g.beginPath(); g.arc(lr.x - fs * .62, base - asc * .32, Math.max(2, fs * .14), 0, Math.PI * 2); g.fill(); }
    });
    return lines;
  }
  function paperOn(g, paper, w, h, padL, padT, base) {
    g.save(); g.lineWidth = 1;
    if (paper === 'lines') {
      g.strokeStyle = PAPER.line; g.beginPath();
      const y0 = ((padT + base + 2) % PAPER.LINE + PAPER.LINE) % PAPER.LINE;
      for (let y = y0; y < h; y += PAPER.LINE) { g.moveTo(0, Math.round(y) + .5); g.lineTo(w, Math.round(y) + .5); } g.stroke();
    } else if (paper === 'graph') {
      for (const major of [false, true]) {
        g.strokeStyle = major ? PAPER.major : PAPER.grid; g.beginPath();
        const kx = Math.ceil(-padL / PAPER.GRID), ky = Math.ceil(-padT / PAPER.GRID);
        for (let k = kx, x = padL + k * PAPER.GRID; x < w; k++, x += PAPER.GRID) if ((((k % PAPER.MAJOR) + PAPER.MAJOR) % PAPER.MAJOR === 0) === major) { g.moveTo(Math.round(x) + .5, 0); g.lineTo(Math.round(x) + .5, h); }
        for (let k = ky, y = padT + k * PAPER.GRID; y < h; k++, y += PAPER.GRID) if ((((k % PAPER.MAJOR) + PAPER.MAJOR) % PAPER.MAJOR === 0) === major) { g.moveTo(0, Math.round(y) + .5); g.lineTo(w, Math.round(y) + .5); }
        g.stroke();
      }
    }
    g.restore();
  }
  function wrapWords(g, text, maxW) {
    const out = []; String(text).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); });
    return out;
  }
  /* A page-sized copy of a note, out of sight, so it can be measured and drawn (saved notes, page-width downloads). */
  function offscreen(note, layout) {
    const sh = document.createElement('div'); sh.className = 'sbp-sheet sbp-off ' + (layout || 'dock') + (note.paper === 'lines' ? ' lines' : '');
    const ed = document.createElement('div'); ed.className = 'sbp-ed'; ed.dataset.ff = note.font || 'hand'; ed.dataset.sz = note.size || 'm';
    ed.innerHTML = note.html || '';
    sh.appendChild(ed);
    if (layout === 'page') sh.style.width = PAGE.W + 'px';
    else if (layout === 'print') { sh.style.width = PAGE.W + 'px'; ed.style.padding = '0 ' + PAGE.PADX + 'px'; }
    else sh.style.width = (Math.max(280, note.w || 520) + 36) + 'px';
    document.body.appendChild(sh);
    return { sh, ed, done: () => sh.remove() };
  }
  /* compose(o): one picture of a note. o.live uses the open notepad; otherwise o is a note. o.scale, o.question (text across the top),
     o.layout ('print': page width with no top margin, for PDF pages), o.inkOnly (only pens and shapes, on a clear background). Returns a canvas
     (with .lines: the text line boxes, and .top: the height of the question heading). */
  function compose(o = {}) {
    let s = null, ed;
    if (o.live && P) ed = P.ed; else { s = offscreen(o, o.layout); ed = s.ed; }
    try {
      const cs = getComputedStyle(ed), pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      const items = o.live && P ? P.items : (o.items || []), tops = blockTops(ed), sc = o.scale || 1, font = OLDFONT();
      let textH = 0; [...ed.children].forEach(c => { textH = Math.max(textH, c.offsetTop + c.offsetHeight - pt); });
      if (!ed.textContent.trim() && !ed.querySelector('li')) textH = 0;
      const bd = itemBounds(items, tops), cw = ed.clientWidth - pl - pr;
      const W = Math.max(o.inkOnly ? 0 : 320, Math.ceil(Math.max(cw, bd.w + 12) + pl + pr)), H = Math.max(o.inkOnly ? 1 : 220, Math.ceil(Math.max(textH, bd.h) + pt + Math.max(pb, 24)));
      let qlines = [], hh = 0; const tmp = document.createElement('canvas').getContext('2d');
      if (o.question) { tmp.font = '700 20px ' + font; qlines = wrapWords(tmp, o.question, W - 40); hh = qlines.length * 27 + 26; }
      const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W * sc)); cv.height = Math.max(1, Math.round((H + hh) * sc));
      const g = cv.getContext('2d'); g.scale(sc, sc);
      if (!o.inkOnly) { g.fillStyle = PAPER.bg; g.fillRect(0, 0, W, H + hh); }
      g.save(); g.translate(0, hh);
      if (!o.inkOnly) paperOn(g, o.live && P ? P.paper : o.paper, W, H, pl, pt, baselineOf(ed));
      g.translate(pl, pt);
      const lines = o.inkOnly ? [] : drawTyped(g, ed);
      drawShapes(g, items, tops);
      const ink = document.createElement('canvas'); ink.width = cv.width; ink.height = cv.height;     // pens on their own layer, so the eraser only rubs out pen
      const ig = ink.getContext('2d'); ig.scale(sc, sc); ig.translate(pl, pt + hh); drawInk(ig, items, tops);
      g.restore(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(ink, 0, 0); g.restore();
      if (hh) {
        g.fillStyle = PAPER.bg; g.fillRect(0, 0, W, hh); g.fillStyle = PAPER.head; g.font = '700 20px ' + font; g.textBaseline = 'top';
        qlines.forEach((ln, i) => g.fillText(ln, 20, 14 + i * 27));
        g.strokeStyle = PAPER.major; g.lineWidth = 2; g.beginPath(); g.moveTo(0, hh - 1); g.lineTo(W, hh - 1); g.stroke();
      }
      cv.lines = lines.map(l => ({ y: l.y + pt + hh, b: l.b + pt + hh })); cv.top = hh; cv.cssW = W; cv.cssH = H + hh;
      return cv;
    } finally { if (s) s.done(); }
  }
  const toBlob = (cv, type = 'image/png', q) => new Promise(res => cv.toBlob(res, type, q));
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
  }
  const fileBase = at => { const d = new Date(at || Date.now()), z = n => String(n).padStart(2, '0'); return 'note-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()); };
  const fileName = at => fileBase(at) + '.png';
  function thumb(canvas, note) {
    const cv = compose(Object.assign({}, note, { scale: .4 })), g = canvas.getContext('2d');
    const r = Math.min(canvas.width / cv.width, canvas.height / cv.height), w = cv.width * r, h = cv.height * r;
    g.fillStyle = PAPER.bg; g.fillRect(0, 0, canvas.width, canvas.height); g.drawImage(cv, 0, 0, w, h);
  }
  const fontsReady = () => { try { return Promise.all(['SB Hand', 'SB Print', 'SB Cursive', 'OpenDyslexic'].map(f => document.fonts.load('20px "' + f + '"').catch(() => null))).then(() => document.fonts.ready); } catch (e) { return Promise.resolve(); } };

  /* ---------------- styles ---------------- */
  const CSS = `
  @font-face{font-family:'SB Hand';src:url('${SB.BASE}shared/fonts/patrick-hand.woff') format('woff');font-display:swap}
  @font-face{font-family:'SB Print';src:url('${SB.BASE}shared/fonts/andika-regular.woff') format('woff');font-display:swap}
  @font-face{font-family:'SB Cursive';src:url('${SB.BASE}shared/fonts/playwrite-us-trad.woff') format('woff');font-display:swap}
  body.sb-padopen{padding-right:var(--padw)}
  body.sb-padfull{overflow:hidden}
  .sbp{--padw:clamp(400px,40vw,620px);position:fixed;top:0;right:0;bottom:0;width:var(--padw);z-index:80;display:flex;flex-direction:column;gap:6px;padding:8px 10px 10px;background:var(--card);color:var(--ink);border-left:2px solid var(--line);box-shadow:-8px 0 24px rgba(0,0,0,.12);font-family:var(--font);font-size:15px;line-height:1.3;min-width:0}
  body.sb-padopen{--padw:clamp(400px,40vw,620px)}
  body.sb-padfull.sb-padopen{padding-right:0}
  .sbp.full{left:0;width:auto;border-left:0;box-shadow:none;padding:8px 14px 10px}
  @media (max-width:899px){.sbp{width:auto;left:0;border-left:0;box-shadow:none}body.sb-padopen{padding-right:0}}
  .sbp *{box-sizing:border-box}
  .sbp-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .sbp-head h2{margin:0 auto 0 0;font-size:19px;display:flex;align-items:center;gap:8px}
  .sbp-head h2 svg{width:22px;height:22px}
  .sbp button,.sbp select{font:inherit;color:inherit;cursor:pointer}
  .sbp-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--surface);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 9px;min-height:36px;font-weight:700;font-size:14px}
  .sbp-b svg{width:20px;height:20px;flex:0 0 auto}
  .sbp-b:hover:not(:disabled){border-color:var(--teal)}
  .sbp-b:disabled{opacity:.4;cursor:default}
  .sbp-b[aria-pressed="true"]{background:var(--navy);color:#fff;border-color:var(--navy-ink)}
  .sbp-b.pri{background:var(--navy);color:#fff;border-color:var(--navy)}
  .sbp-i{min-width:36px;padding:4px 6px}
  .sbp-b:focus-visible,.sbp-sw:focus-visible,.sbp input:focus-visible,.sbp select:focus-visible{outline:3px solid var(--navy-ink);outline-offset:2px}
  .sbp-q{margin:0;color:var(--ink2);font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .sbp-q b{color:var(--ink)}
  .sbp-bar{display:flex;flex-direction:column;gap:6px}
  .sbp-row{display:flex;gap:5px 6px;flex-wrap:wrap;align-items:center}
  .sbp-row .gap{flex:1 1 auto}
  .sbp-grp{display:inline-flex;gap:3px;flex-wrap:wrap;align-items:center}
  .sbp-grp+.sbp-grp{padding-left:6px;border-left:2px solid var(--line)}
  .sbp-modes{display:inline-flex;border:2px solid var(--line);border-radius:12px;overflow:hidden}
  .sbp-modes button{display:inline-flex;align-items:center;gap:5px;border:0;background:var(--surface);padding:5px 12px;min-height:36px;font-weight:700;font-size:14px}
  .sbp-modes button+button{border-left:2px solid var(--line)}
  .sbp-modes button svg{width:19px;height:19px}
  .sbp-modes button[aria-pressed="true"]{background:var(--teal-fill);color:#fff}
  .sbp-t{flex-direction:column;gap:0;padding:2px 4px;min-width:48px;font-size:12px;min-height:44px}
  .sbp-t svg{width:21px;height:21px}
  .sbp-sel{border:2px solid var(--line);border-radius:10px;background:var(--surface);padding:4px 6px;min-height:36px;font-size:14px;font-weight:700;max-width:150px}
  .sbp-sws{display:flex;gap:5px;flex-wrap:wrap}
  .sbp-sw{width:28px;height:28px;border-radius:50%;border:3px solid var(--card);box-shadow:0 0 0 2px var(--line);padding:0;background:var(--c)}
  .sbp-sw[aria-pressed="true"]{box-shadow:0 0 0 3px var(--navy-ink)}
  .sbp-sw.none{background:linear-gradient(135deg,var(--surface) 44%,var(--bad) 45%,var(--bad) 55%,var(--surface) 56%)}
  .sbp-size{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px}
  .sbp-size input{width:100px;accent-color:var(--teal-fill)}
  .sbp-seg{display:inline-flex;border:2px solid var(--line);border-radius:12px;overflow:hidden}
  .sbp-seg button{border:0;background:var(--surface);padding:5px 10px;min-height:34px;font-weight:700;font-size:13px}
  .sbp-seg button[aria-pressed="true"]{background:var(--teal-fill);color:#fff}
  .sbp-cbtn{position:relative}
  .sbp-cbtn i{position:absolute;left:7px;right:7px;bottom:4px;height:4px;border-radius:2px;background:var(--c,transparent)}
  .sbp-pop{position:absolute;z-index:5;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;flex-wrap:wrap;gap:6px;max-width:250px}
  .sbp-pop .lbl{width:100%;font-size:13px;font-weight:700;color:var(--ink2)}
  .sbp-wrap{position:relative;flex:1 1 0;min-height:200px;border:2px solid var(--line);border-radius:14px;overflow:hidden}
  .sbp-stage{position:absolute;inset:0;overflow:auto;background:${PAPER.bg};overscroll-behavior:contain}
  .sbp.full.page .sbp-stage{background:var(--track)}
  .sbp.draw .sbp-stage{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  .sbp-ink{position:sticky;top:0;left:0;display:block;z-index:3;pointer-events:none;touch-action:none}
  .sbp.draw .sbp-ink{pointer-events:auto;cursor:crosshair}
  .sbp-sheet{position:relative;background-color:${PAPER.bg};min-height:100%}
  .sbp.full.page .sbp-sheet{width:${PAGE.W}px;margin:18px auto 28px;box-shadow:0 2px 10px rgba(0,0,0,.18);min-height:${PAGE.H}px}
  .sbp-sheet.lines{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent ${PAPER.LINE - 1}px,${PAPER.line} ${PAPER.LINE - 1}px,${PAPER.line} ${PAPER.LINE}px)}
  .sbp-sheet.graph{background-image:linear-gradient(to right,${PAPER.major} 1px,transparent 1px),linear-gradient(to bottom,${PAPER.major} 1px,transparent 1px),linear-gradient(to right,${PAPER.grid} 1px,transparent 1px),linear-gradient(to bottom,${PAPER.grid} 1px,transparent 1px);background-size:${PAPER.GRID * PAPER.MAJOR}px ${PAPER.GRID * PAPER.MAJOR}px,${PAPER.GRID * PAPER.MAJOR}px ${PAPER.GRID * PAPER.MAJOR}px,${PAPER.GRID}px ${PAPER.GRID}px,${PAPER.GRID}px ${PAPER.GRID}px}
  .sbp-ed{position:relative;outline:0;padding:14px 18px 40px;color:#1d2733;font-family:${fontCSS('hand')};font-size:21px;line-height:1.5;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;caret-color:#1d2733;min-height:100%;cursor:text;-webkit-user-modify:read-write}
  .sbp.full .sbp-ed{padding:28px max(28px,4vw) 60px}
  .sbp.full.page .sbp-ed,.sbp-sheet.page .sbp-ed{padding:${PAGE.PADY}px ${PAGE.PADX}px}
  @media (max-width:899px){.sbp.full.page .sbp-sheet{width:auto;margin:0;box-shadow:none;min-height:100%}.sbp.full.page .sbp-stage{background:${PAPER.bg}}.sbp.full .sbp-ed,.sbp.full.page .sbp-ed{padding:16px 18px 40px}}
  .sbp-ed:empty::before{content:attr(data-ph);color:#8a94a0}
  .sbp-ed.noph:empty::before{content:none}
  .sbp-ed p,.sbp-ed h2,.sbp-ed h3,.sbp-ed ul,.sbp-ed ol{margin:0}
  .sbp-ed h2{font-size:1.5em;line-height:1.3}
  .sbp-ed h3{font-size:1.22em;line-height:1.35}
  .sbp-ed ul,.sbp-ed ol{padding-left:1.5em}
  .sbp-ed a{color:#1f5fbf;text-decoration:underline}
  .sbp-ed ul.check{list-style:none;padding-left:0}
  .sbp-ed ul.check>li{position:relative;padding-left:1.5em}
  .sbp-ed ul.check>li::before{content:'';position:absolute;left:2px;top:calc(.75em - .41em);width:.82em;height:.82em;border:2px solid currentColor;border-radius:3px;box-sizing:border-box;cursor:pointer}
  .sbp-ed ul.check>li.done::after{content:'';position:absolute;left:calc(2px + .26em);top:calc(.75em - .3em);width:.24em;height:.46em;border:solid currentColor;border-width:0 3px 3px 0;transform:rotate(40deg)}
  .sbp-ed ul.check>li.done{color:#6a7480;text-decoration:line-through;display:list-item;font-size:inherit;font-weight:inherit;gap:0}   /* sb.css has a .done badge style; not here */
  ${FONTS.map(f => `.sbp-ed[data-ff="${f[0]}"],.sbp-ed .ff-${f[0]}{font-family:${f[2]}}`).join('\n  ')}
  ${SIZES.map(s => `.sbp-ed[data-sz="${s[0]}"],.sbp-ed .sz-${s[0]}{font-size:${s[2]}px}`).join('\n  ')}
  .sbp-ed[data-ff="cursive"]{line-height:1.8}
  .sbp-sheet.lines .sbp-ed,.sbp-sheet.lines .sbp-ed *{line-height:${PAPER.LINE}px!important}
  .sbp-sheet.lines .sbp-ed .sz-xl,.sbp-sheet.lines .sbp-ed[data-sz="xl"]{font-size:28px}
  .sbp-sheet.lines .sbp-ed span[class*="sz-"],.sbp-sheet.lines .sbp-ed span[class*="ff-"]{line-height:0!important}   /* a bigger word must not make its line taller, or every line below slips off the ruling */
  .sbp-sheet.lines .sbp-ed h2{font-size:1.25em}
  .sbp-sheet.lines .sbp-ed h3{font-size:1.1em}
  .sbp-sheet.lines .sbp-ed{padding-top:${PAPER.LINE / 2}px}
  .sbp.full.page .sbp-sheet.lines .sbp-ed,.sbp-sheet.page.lines .sbp-ed{padding-top:${PAGE.PADY}px}
  .sbp-probe{position:absolute!important;left:-9999px;top:0;visibility:hidden;min-height:0!important;padding:0!important}
  .sbp-off{position:absolute!important;left:-30000px;top:0;visibility:hidden;pointer-events:none}
  .sbp-off .sbp-ed{min-height:0}
  .sbp-shapes{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2}
  .sbp.shapes .sbp-shapes{pointer-events:all;cursor:crosshair}
  .sbp.shapes .sbp-shapes [data-i]{cursor:move}
  .sbp-shapes .sel{fill:none;stroke:#1f5fbf;stroke-width:1.5;stroke-dasharray:5 4;pointer-events:none}
  .sbp-shapes .hd{fill:#fff;stroke:#1f5fbf;stroke-width:2}
  .sbp-brk{position:absolute;left:0;right:0;height:0;border-top:2px dashed #c7cfd9;pointer-events:none;z-index:1}
  .sbp-brk span{position:absolute;right:8px;top:2px;font:700 12px var(--font);color:#8a94a0}
  .sbp-ring{position:absolute;pointer-events:none;border:2px solid #1d2733;border-radius:50%;background:rgba(255,255,255,.35);transform:translate(-50%,-50%);display:none;z-index:4}
  .sbp-lb{position:absolute;z-index:6;display:flex;gap:4px;align-items:center;background:var(--card);border:2px solid var(--line);border-radius:12px;padding:4px;box-shadow:0 6px 18px rgba(0,0,0,.16);font-size:14px}
  .sbp-lb a,.sbp-lb button{font-weight:700;color:var(--navy-ink);background:var(--surface);border:2px solid var(--line);border-radius:9px;padding:3px 9px;text-decoration:none;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sbp-saved{flex:1 1 0;min-height:0;overflow:auto;padding:4px 2px}
  .sbp.showing-saved>.sbp-bar,.sbp.showing-saved>.sbp-wrap,.sbp.showing-saved>.sbp-q{display:none}
  .sbp-saved h3{margin:0 0 6px;font-size:17px}
  .sbn-list{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:8px}
  .sbn{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:2px solid var(--line);border-radius:14px;padding:8px;background:var(--surface)}
  .sbn canvas{width:96px;height:66px;border-radius:8px;border:1px solid var(--line);flex:0 0 auto}
  .sbn-t{flex:1 1 140px;min-width:0;display:flex;flex-direction:column}
  .sbn-t b{font-size:15px}
  .sbn-t span{color:var(--ink2);font-size:13px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .sbn-bt{display:flex;gap:6px;flex-wrap:wrap}
  .sbn-bt button{font:inherit;font-size:14px;font-weight:700;background:var(--card);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:5px 11px;min-height:36px;cursor:pointer}
  .sbn-bt button:hover{border-color:var(--teal)}
  .sbn-bt button.del{color:var(--coral-ink)}
  .sbn-empty{color:var(--ink2);margin:0 0 10px}
  .sb-dlg .sbp-choices{display:grid;gap:8px;margin:6px 0 10px}
  .sb-dlg .sbp-choices .sb-btn{width:100%;text-align:left}
  .sb-dlg .sbp-choices .sb-btn small{display:block;font-weight:600;opacity:.8}
  .sb-dlg label.sbp-chk{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-weight:700;font-size:15px;cursor:pointer}
  .sb-dlg input.sbp-cb{width:22px;height:22px;padding:0;margin:0;letter-spacing:normal;font-size:16px;accent-color:#0e7468;flex:0 0 auto}
  .sb-dlg .sbp-hint{font-size:14px;margin:0 0 8px}
  .sb-dlg label.sbp-fld{display:block;font-weight:700;margin:0 0 10px}
  .sb-dlg label.sbp-fld input{display:block;width:100%;margin-top:4px}
  @media (max-width:520px){.sbp-modes{max-width:100%}.sbp-modes button{min-width:0;padding:5px 8px}.sbp-modes button svg{display:none}.sbp-b span.l{display:none}.sbp-size input{width:84px}.sbp-t span{display:none}.sbp-t{min-width:44px;min-height:44px}.sbp-modes button{padding:5px 9px}.sbp-sel{max-width:118px}}
  .sbp:not(.full) .sbp-head .sbp-b.opt span.l{display:none}
  @media (max-width:420px){.sbp-head h2 .l{display:none}}
  html.sb-large .sbp{font-size:14px}
  `;
  function injectCSS() { if (document.getElementById('sbp-css')) return; const s = document.createElement('style'); s.id = 'sbp-css'; s.textContent = CSS; document.head.appendChild(s); }
  injectCSS();

  /* ---------------- the notepad ---------------- */
  let P = null;
  let penSeen = false, penOnlyChoice = null;   // once a stylus touches any pad this visit, finger touches stop drawing (unless the student turns Pen only off)
  let lastMode = null;
  const draftKey = kid => NS + '.paddraft.' + kid;
  /* The note is remembered while the page stays open, so closing the notepad and opening it again on the same question
     shows the same writing (and saving again updates the same note). A different question starts blank. */
  let resume = null;
  const resumeKey = (kid, source, question) => [kid, source || '', String(question || '').replace(/\s+/g, ' ').trim().slice(0, 400)].join('\u0001');
  const isOpen = () => !!P;
  const typedSomething = () => !!P && (!!P.ed.textContent.trim() || !!P.ed.querySelector('li'));
  const hasInk = items => items.some(i => i.k === 't' || i.k === 'h' || i.t !== 'erase');
  const hasContent = () => !!P && (hasInk(P.items) || typedSomething());
  const dirty = () => !!P && hasContent() && (P.items !== P.savedItems || P.html !== P.savedHtml);
  const curState = () => ({ items: P.items, html: P.html, font: P.ed.dataset.ff, size: P.ed.dataset.sz });
  const rememberNote = () => { resume = P && (hasContent() || P.from) ? Object.assign({ key: resumeKey(P.kid, P.source, P.question), paper: P.paper, from: P.from, savedItems: P.savedItems, savedHtml: P.savedHtml }, curState()) : null; };
  const isDesktop = () => !(window.matchMedia && matchMedia('(max-width:899px), (max-height:520px)').matches);   // a phone turned sideways (915x412) counts as a phone
  const prefs = () => { const v = SB.activeId() ? SB.getSetting('notepad') : null; return (v && typeof v === 'object') ? v : {}; };
  const setPref = (k, v) => { try { if (SB.activeId()) SB.setSetting('notepad', Object.assign({}, prefs(), { [k]: v })); } catch (e) {} };

  function toolbarHTML() {
    const btn = (a, ic, label, extra = '') => `<button type="button" class="sbp-b sbp-i" data-f="${a}" aria-label="${label}" title="${label}"${extra}>${IC[ic]}</button>`;
    return `
      <div class="sbp-row">
        <span class="sbp-modes" role="group" aria-label="What to do on the page">
          <button type="button" data-mode="type" aria-pressed="false">${IC.type}<span class="l">Type</span></button><button type="button" data-mode="draw" aria-pressed="false">${IC.pen}<span class="l">Draw</span></button><button type="button" data-mode="shapes" aria-pressed="false">${IC.shapes}<span class="l">Shapes</span></button></span>
        <span class="gap"></span>
        <span class="sbp-grp">
          <button type="button" class="sbp-b sbp-i" data-a="undo" disabled aria-label="Undo" title="Undo">${IC.undo}</button>
          <button type="button" class="sbp-b sbp-i" data-a="redo" disabled aria-label="Redo" title="Redo">${IC.redo}</button>
          <button type="button" class="sbp-b sbp-i" data-a="clear" disabled aria-label="Erase all" title="Erase all">${IC.trash}</button></span>
        <span class="sbp-grp">
          <button type="button" class="sbp-b sbp-i" data-paper="lines" aria-pressed="false" aria-label="Lines" title="Lines">${IC.lines}</button>
          <button type="button" class="sbp-b sbp-i" data-paper="graph" aria-pressed="false" aria-label="Graph paper" title="Graph paper">${IC.grid}</button></span>
        <span class="sbp-seg sbp-view" role="group" aria-label="Page view" hidden><button type="button" data-view="page" aria-pressed="false">Page</button><button type="button" data-view="pageless" aria-pressed="false">Pageless</button></span>
      </div>
      <div class="sbp-row" data-for="type" role="toolbar" aria-label="Text">
        <span class="sbp-grp">
          <select class="sbp-sel" data-s="font" aria-label="Font" title="Font">${FONTS.map(f => `<option value="${f[0]}">${f[1]}</option>`).join('')}</select>
          <select class="sbp-sel" data-s="size" aria-label="Text size" title="Text size">${SIZES.map(s => `<option value="${s[0]}">${s[1]}</option>`).join('')}</select>
          <select class="sbp-sel" data-s="block" aria-label="Paragraph style" title="Paragraph style"><option value="p">Normal text</option><option value="h2">Heading</option><option value="h3">Small heading</option></select></span>
        <span class="sbp-grp">${btn('bold', 'bold', 'Bold (Ctrl+B)', ' aria-pressed="false"')}${btn('italic', 'italic', 'Italic (Ctrl+I)', ' aria-pressed="false"')}${btn('underline', 'underline', 'Underline (Ctrl+U)', ' aria-pressed="false"')}${btn('strike', 'strike', 'Strikethrough', ' aria-pressed="false"')}
          <button type="button" class="sbp-b sbp-i sbp-cbtn" data-pop="fc" aria-label="Text color" title="Text color" aria-expanded="false">${IC.color}<i></i></button>
          <button type="button" class="sbp-b sbp-i sbp-cbtn" data-pop="hl" aria-label="Highlight" title="Highlight" aria-expanded="false">${IC.mark}<i></i></button>
          ${btn('link', 'link', 'Link (Ctrl+K)')}</span>
        <span class="sbp-grp">${btn('ul', 'ul', 'Bulleted list', ' aria-pressed="false"')}${btn('ol', 'ol', 'Numbered list', ' aria-pressed="false"')}${btn('check', 'check', 'Checklist', ' aria-pressed="false"')}</span>
        <span class="sbp-grp">${btn('left', 'left', 'Align left', ' aria-pressed="false"')}${btn('center', 'center', 'Center', ' aria-pressed="false"')}${btn('right', 'right', 'Align right', ' aria-pressed="false"')}${btn('clear', 'clear', 'Clear formatting')}</span>
      </div>
      <div class="sbp-row" data-for="draw" role="toolbar" aria-label="Pens">
        <span class="sbp-grp">${PENTOOLS.map(([id, n]) => `<button type="button" class="sbp-b sbp-t" data-tool="${id}" aria-pressed="${id === 'pen'}" aria-label="${n}">${IC[id]}<span>${n}</span></button>`).join('')}</span>
      </div>
      <div class="sbp-row" data-for="draw">
        <div class="sbp-sws" role="group" aria-label="Pen color">${COLORS.map(([n, c], i) => `<button type="button" class="sbp-sw" data-c="${c}" style="--c:${c}" aria-label="${n}" aria-pressed="${i === 0}"></button>`).join('')}</div>
        <label class="sbp-size">Size <input type="range" min="1" max="20" value="4" data-r="pen" aria-label="Pen size"></label>
        <span class="sbp-seg" data-er-seg role="group" aria-label="Eraser type" hidden><button type="button" data-er="area" aria-pressed="true">Rub out</button><button type="button" data-er="stroke" aria-pressed="false">Whole line</button></span>
        <button type="button" class="sbp-b" data-a="penonly" aria-pressed="false" title="Ignore finger touches, so a resting hand does not draw">${IC.hand}<span class="l">Pen only</span></button>
      </div>
      <div class="sbp-row" data-for="shapes" role="toolbar" aria-label="Shapes">
        <span class="sbp-grp"><button type="button" class="sbp-b sbp-i" data-sh="select" aria-pressed="true" aria-label="Select and move" title="Select and move">${IC.select}</button>${SHAPES.map(([id, n]) => `<button type="button" class="sbp-b sbp-i" data-sh="${id}" aria-pressed="false" aria-label="${n}" title="${n}">${IC[id]}</button>`).join('')}</span>
        <span class="sbp-grp">
          <button type="button" class="sbp-b sbp-i sbp-cbtn" data-pop="sf" aria-label="Fill color" title="Fill color" aria-expanded="false">${IC.fill}<i></i></button>
          <button type="button" class="sbp-b sbp-i sbp-cbtn" data-pop="so" aria-label="Outline color" title="Outline color" aria-expanded="false">${IC.outline}<i></i></button>
          <label class="sbp-size" title="Outline width">Outline <input type="range" min="0" max="16" value="3" data-r="lw" aria-label="Outline width"></label>
          <button type="button" class="sbp-b sbp-i" data-shp="shadow" aria-pressed="false" aria-label="Shadow" title="Shadow">${IC.shadow}</button></span>
        <span class="sbp-grp">
          <button type="button" class="sbp-b sbp-i" data-shp="front" aria-label="Bring to front" title="Bring to front" disabled>${IC.front}</button>
          <button type="button" class="sbp-b sbp-i" data-shp="back" aria-label="Send to back" title="Send to back" disabled>${IC.back}</button>
          <button type="button" class="sbp-b sbp-i" data-shp="delete" aria-label="Delete shape" title="Delete shape" disabled>${IC.trash}</button></span>
      </div>`;
  }

  function open(o = {}) {
    if (P) {
      if (o.question != null) setQuestion(o.question);
      if (o.full && isDesktop() && !P.full) setFull(true);
      if (o.note) { P.onClose = o.onClose || P.onClose; loadNote(o.note, false, o.scope); return; }
      focusStart(); return;
    }
    injectCSS();
    const el = document.createElement('div'); el.className = 'sbp'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Notepad');
    const pf = prefs();
    P = {
      el, items: [], html: '', past: [], future: [], savedItems: null, savedHtml: null, tool: 'pen', color: COLORS[0][1], size: 4, erMode: 'area', paper: 'blank',
      penOnly: penOnlyChoice != null ? penOnlyChoice : penSeen, from: null, kid: SB.activeId(), question: '', source: o.source || '', cur: null, opener: o.opener || null, onClose: o.onClose || null, listeners: [],
      mode: o.mode || (o.question ? 'draw' : (lastMode || 'type')), full: false, view: pf.view === 'pageless' ? 'pageless' : 'page',
      shTool: 'select', sel: -1, shFill: '', shLine: '#1d2733', shLw: 3, shShadow: false, fc: '', hl: '#fff07a', tops: {}, typing: false
    };
    el.innerHTML = `
      <div class="sbp-head"><h2>${IC.pad}<span class="l">Notepad</span></h2>
        <button type="button" class="sbp-b" data-a="new" title="Start a new note" aria-label="New note">${IC.plus}<span class="l">New note</span></button>
        <button type="button" class="sbp-b opt" data-a="notes" aria-expanded="false" title="Saved notes">${IC.notes}<span class="l">Saved notes</span></button>
        <button type="button" class="sbp-b opt" data-a="download" title="Download as PDF, Word, text, or a picture" aria-label="Download">${IC.download}<span class="l">Download</span></button>
        <button type="button" class="sbp-b opt" data-a="full" aria-pressed="false" title="Full screen" aria-label="Full screen">${IC.full}<span class="l">Full screen</span></button>
        <button type="button" class="sbp-b pri" data-a="save">${IC.save}<span class="l">Save</span></button>
        <button type="button" class="sbp-b sbp-i" data-a="close" aria-label="Close the notepad" title="Close">${IC.close}</button></div>
      <p class="sbp-q" hidden></p>
      <div class="sbp-bar">${toolbarHTML()}</div>
      <div class="sbp-wrap"><div class="sbp-stage"><canvas class="sbp-ink" aria-hidden="true"></canvas>
        <div class="sbp-sheet"><div class="sbp-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Note. Type here." spellcheck="true" data-ff="${FONTS.some(f => f[0] === pf.font) ? pf.font : 'hand'}" data-sz="m" data-ph="Type here, or choose Draw or Shapes."></div><svg class="sbp-shapes" aria-hidden="true"></svg></div></div>
        <div class="sbp-ring"></div></div>
      <div class="sbp-saved" hidden></div>`;
    document.body.appendChild(el); document.body.classList.add('sb-padopen');
    P.wrap = $('.sbp-wrap', el); P.stage = $('.sbp-stage', el); P.sheet = $('.sbp-sheet', el); P.ed = $('.sbp-ed', el); P.svg = $('.sbp-shapes', el); P.cv = $('.sbp-ink', el); P.g = P.cv.getContext('2d'); P.ring = $('.sbp-ring', el);
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
    wire();
    setQuestion(o.question || '');
    if (o.note) loadNote(o.note, true, o.scope);
    else if (resume && resume.key === resumeKey(P.kid, P.source, P.question)) restoreState(resume, true);
    else { setHTML(''); offerDraft(); }
    if (o.full && isDesktop()) setFull(true);
    fit(); refresh(); fontsReady().then(() => { if (P) { fit(); } });
    if (!isDesktop()) { [...document.body.children].forEach(c => { if (c !== el && !c.classList.contains('sb-ov') && !c.inert) { c.inert = true; P.inerted = (P.inerted || []).concat(c); } }); }
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); P.listeners.push(() => t.removeEventListener(ev, fn, opt)); };
    on(document, 'keydown', onKey);
    on(document, 'selectionchange', onSel);
    on(document, 'pointerdown', e => { if (P && P.popEl && !P.popEl.contains(e.target) && !(e.target.closest && e.target.closest('[data-pop]'))) closePop(); if (P && P.lb && !P.lb.contains(e.target)) closeLinkBubble(); }, true);
    on(window, 'beforeunload', e => { saveDraftNow(); if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
    on(window, 'pagehide', () => saveDraftNow());
    on(document, 'visibilitychange', () => { if (document.hidden) saveDraftNow(); });
    on(document, 'click', guardLinks, true);
    on(window, 'hashchange', e => {
      if (!P) return; if (P.ignoreHash) { P.ignoreHash = false; return; }
      if (!dirty()) return closePad();
      const back = e.oldURL;      // the page already changed: if the student keeps working, go back to the page they were on
      saveDialog(true, null, () => { if (P && back) { P.ignoreHash = true; location.replace(back); } });
    });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => fit()); ro.observe(P.wrap); ro.observe(P.ed); P.listeners.push(() => ro.disconnect()); } else on(window, 'resize', fit);
    focusStart();
  }
  function focusStart() {
    if (!P) return;
    if (P.mode === 'type' && isDesktop()) { P.ed.focus({ preventScroll: true }); placeCaretEnd(); }   // phones: no keyboard popping up until the page is tapped
    else { const f = $(P.mode === 'draw' ? '.sbp-t[aria-pressed="true"]' : '[data-sh][aria-pressed="true"]', P.el) || $('[data-mode="' + P.mode + '"]', P.el); if (f) f.focus(); }
  }

  function guardLinks(e) {
    if (!P || !dirty() || e.defaultPrevented) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download') || a.closest('.sbp') || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (e.button || 0) !== 0) return;
    const raw = a.getAttribute('href') || ''; if (raw === '#' || /^(mailto|tel|javascript):/i.test(raw)) return;
    e.preventDefault(); e.stopPropagation(); const href = a.href;
    requestClose(() => { location.href = href; });
  }
  function onKey(e) {
    if (!P) return;
    const t = e.target || {}, inField = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''), inEd = P.ed.contains(t), dlg = !!document.querySelector('.sb-ov');
    if (dlg) return;
    if (e.key === 'Escape') {
      if (P.popEl) { e.preventDefault(); closePop(true); return; }
      if (P.lb) { e.preventDefault(); closeLinkBubble(); return; }
      if (inEd) { e.preventDefault(); P.ed.blur(); const m = $('[data-mode="type"]', P.el); if (m) m.focus(); return; }   // first Escape leaves the text; the next one closes
      e.preventDefault(); requestClose(); return;
    }
    if ((e.ctrlKey || e.metaKey) && !inField) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); undo(); return; }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); redo(); return; }
      if (inEd && k === 'k') { e.preventDefault(); linkDialog(); return; }
      if (inEd && (k === 'b' || k === 'i' || k === 'u')) { e.preventDefault(); format({ b: 'bold', i: 'italic', u: 'underline' }[k]); return; }
    }
    if (P.mode === 'shapes' && P.sel >= 0 && !inEd && !inField) {
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteShape(); return; }
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (d) { e.preventDefault(); const f = e.shiftKey ? 10 : 1; moveShapeBy(d[0] * f, d[1] * f); }
    }
  }
  function setQuestion(q) {
    if (!P) return; P.question = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    const p = $('.sbp-q', P.el); p.hidden = !P.question; p.innerHTML = P.question ? '<b>Question:</b> ' + esc(P.question) : '';
  }

  /* ---- the text: blocks, ids, caret ---- */
  let bid = 0;
  const newId = () => (Date.now() % 1e7).toString(36) + (bid++).toString(36);
  function tidy() {     // after every change: <font color> becomes a span, loose text goes into a paragraph, every block has its own id
    const ed = P.ed;
    ed.querySelectorAll('font:not([face="sbmark"])').forEach(f => {      // (sbmark: a font or size change in progress, see setFontOrSize)
      const s = document.createElement('span'); const c = toHex(f.getAttribute('color') || f.style.color); if (c) s.style.color = c;
      while (f.firstChild) s.appendChild(f.firstChild); f.replaceWith(s); if (!c) { while (s.firstChild) s.parentNode.insertBefore(s.firstChild, s); s.remove(); }
    });
    /* a list or paragraph inside a paragraph (browsers make these when a list is started in a paragraph) is lifted out, splitting the paragraph */
    for (let guard = 0, pp; guard < 50 && (pp = [...ed.querySelectorAll('p,h2,h3')].find(x => [...x.children].some(c => /^(UL|OL|P|H2|H3|DIV)$/.test(c.tagName)))); guard++) {
      const k = holdCaret(), out = []; let cur = null;
      [...pp.childNodes].forEach(n => {
        if (n.nodeType === 1 && /^(UL|OL|P|H2|H3|DIV)$/.test(n.tagName)) { cur = null; out.push(n); return; }
        if (!cur) { cur = document.createElement(pp.tagName.toLowerCase()); if (pp.style.textAlign) cur.style.textAlign = pp.style.textAlign; out.push(cur); }
        cur.appendChild(n);
      });
      pp.replaceWith(...out);
      k();
    }
    ed.querySelectorAll('div').forEach(d => { const p = document.createElement('p'); [...d.attributes].forEach(a => { if (a.name === 'style' || a.name === 'data-b') p.setAttribute(a.name, a.value); }); while (d.firstChild) p.appendChild(d.firstChild); d.replaceWith(p); });
    const loose = [...ed.childNodes].filter(n => (n.nodeType === 3 && n.nodeValue.trim()) || (n.nodeType === 1 && !BLOCKS[n.tagName.toLowerCase()] && n.tagName !== 'BR'));
    if (loose.length) {
      const k = holdCaret(); let p = null;
      [...ed.childNodes].forEach(n => {
        const inline = n.nodeType === 3 || (n.nodeType === 1 && !BLOCKS[n.tagName.toLowerCase()]);
        if (inline) { if (!p) { p = document.createElement('p'); ed.insertBefore(p, n); } p.appendChild(n); } else p = null;
      });
      k();
    }
    const seen = new Set();
    ed.querySelectorAll('p,h2,h3,ul,ol,li').forEach(b => { let id = b.getAttribute('data-b'); if (!id || seen.has(id) || !/^[a-z0-9]{1,12}$/.test(id)) { id = newId(); b.setAttribute('data-b', id); } seen.add(id); });
    if (!ed.firstChild) { ed.innerHTML = ''; }
    ed.classList.toggle('empty', !typedSomething());
  }
  function setHTML(h) { P.ed.innerHTML = h || ''; tidy(); P.html = P.ed.innerHTML; }
  /* Keeps the cursor on the same spot while blocks are moved around: returns a function that puts it back. */
  function holdCaret() {
    const s = getSelection(); if (!s.rangeCount || !P.ed.contains(s.anchorNode)) return () => {};
    const an = s.anchorNode, ao = s.anchorOffset, child = an.nodeType === 1 ? an.childNodes[ao] || null : null, last = an.nodeType === 1 && !child ? an.lastChild : null, c = caretOffset();
    return () => {
      const r = document.createRange();
      try {
        if (an.isConnected && P.ed.contains(an)) r.setStart(an, Math.min(ao, an.nodeType === 3 ? an.nodeValue.length : an.childNodes.length));
        else if (child && child.isConnected) r.setStartBefore(child);
        else if (last && last.isConnected) r.setStartAfter(last);
        else { if (c != null) setCaret(c); return; }
      } catch (e) { return; }
      r.collapse(true); s.removeAllRanges(); s.addRange(r);
    };
  }
  function caretOffset() {
    const s = getSelection(); if (!s.rangeCount || !P.ed.contains(s.anchorNode)) return null;
    const r = document.createRange(); r.selectNodeContents(P.ed); r.setEnd(s.anchorNode, s.anchorOffset); return r.toString().length;
  }
  function setCaret(n) {
    const wk = document.createTreeWalker(P.ed, NodeFilter.SHOW_TEXT); let t, left = n;
    while ((t = wk.nextNode())) { if (left <= t.nodeValue.length) { const r = document.createRange(); r.setStart(t, left); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return; } left -= t.nodeValue.length; }
    placeCaretEnd();
  }
  function placeCaretEnd() { if (!P) return; const r = document.createRange(); r.selectNodeContents(P.ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  /* Put the cursor back in the text, where it was, after a toolbar menu took focus. When the cursor is still in the text (a keyboard
     shortcut, or a toolbar button, which keeps it there), nothing changes: the saved range can be a few letters behind fast typing. */
  function restoreSel() {
    if (!P || document.activeElement === P.ed) return;
    P.ed.focus({ preventScroll: true });
    if (P.range && P.ed.contains(P.range.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(P.range); }
  }
  function onSel() {
    if (!P) return; const s = getSelection();
    if (s.rangeCount && P.ed.contains(s.anchorNode) && document.activeElement === P.ed) { P.range = s.getRangeAt(0).cloneRange(); paintState(); }   // a menu taking focus can collapse the selection: that is not the student's choice
  }

  /* ---- history: every change keeps the whole state before it (text and drawing), so undo and redo just swap them ---- */
  function pushPast() { if (!P) return; P.past.push(Object.assign({ c: caretOffset() }, curState())); if (P.past.length > 150) P.past.shift(); P.future = []; }
  function afterChange() { if (!P) return; render(); refresh(); saveDraft(); }
  function commit(next) { endTyping(); pushPast(); P.items = next; afterChange(); }
  function endTyping() { if (P) { P.typing = false; clearTimeout(P.tt); } }
  function restoreState(s, fresh) {
    P.ed.innerHTML = s.html || ''; P.ed.dataset.ff = s.font || P.ed.dataset.ff || 'hand'; P.ed.dataset.sz = s.size || 'm'; tidy(); P.html = P.ed.innerHTML; P.items = s.items || [];
    if (fresh) { P.paper = s.paper || P.paper; P.from = s.from || null; P.savedItems = s.savedItems === undefined ? null : s.savedItems; P.savedHtml = s.savedHtml === undefined ? null : s.savedHtml; P.past = []; P.future = []; }
    if (P.sel >= P.items.length || (P.sel >= 0 && P.items[P.sel].k !== 'h')) P.sel = -1;
    fit(); render(); refresh();
    if (s.c != null && P.mode === 'type') { P.ed.focus({ preventScroll: true }); setCaret(s.c); }
  }
  function undo() { if (!P) return; endTyping(); if (!P.past.length) return; P.future.push(Object.assign({ c: caretOffset() }, curState())); restoreState(P.past.pop()); saveDraft(); }
  function redo() { if (!P) return; endTyping(); if (!P.future.length) return; P.past.push(Object.assign({ c: caretOffset() }, curState())); restoreState(P.future.pop()); saveDraft(); }
  /* iPhone and iPad give no warning when a tab is closed or reloaded, so unsaved writing is kept as a draft for this tab and offered back */
  function saveDraft() { if (!P) return; clearTimeout(P.dt); P.dt = setTimeout(saveDraftNow, 250); }   // at most four times a second while typing
  function saveDraftNow() {
    if (!P) return; clearTimeout(P.dt);
    try { if (dirty()) sessionStorage.setItem(draftKey(P.kid), JSON.stringify(Object.assign(snapshotNote(), { id: 'draft' }))); else sessionStorage.removeItem(draftKey(P.kid)); } catch (e) {}
  }
  function dropDraft(kid) { if (P && P.kid === kid) clearTimeout(P.dt); try { sessionStorage.removeItem(draftKey(kid)); } catch (e) {} }
  function offerDraft() {
    let d = null; try { d = JSON.parse(sessionStorage.getItem(draftKey(P.kid)) || 'null'); } catch (e) {}
    const n = d && cleanNote(Object.assign({}, d, { id: 'draft' }));
    if (!n || (!hasInk(n.items) && !n.html.replace(/<[^>]*>/g, '').trim())) return;
    SB.confirm({ title: 'Bring back your writing?', text: 'The notepad closed before your last writing was saved' + (n.mod ? ' (' + n.mod + ')' : '') + '.', ok: 'Bring it back', cancel: 'Start fresh' },
      () => { if (!P) return; P.paper = n.paper; restoreState({ html: n.html, items: n.items, font: n.font, size: n.size, paper: n.paper, from: null, savedItems: null, savedHtml: null }, true); },
      () => { if (P) dropDraft(P.kid); });
  }

  /* ---- drawing the page ---- */
  function refresh() {
    if (!P) return; const el = P.el;
    $('[data-a="undo"]', el).disabled = !P.past.length; $('[data-a="redo"]', el).disabled = !P.future.length;
    $('[data-a="clear"]', el).disabled = !P.items.length && !typedSomething(); $('[data-a="new"]', el).disabled = !hasContent() && !P.from;
    { const a = document.activeElement; if (a && a.disabled && el.contains(a)) { const f = $('[data-mode="' + P.mode + '"]', el); if (f) f.focus(); } }
    el.classList.toggle('draw', P.mode === 'draw'); el.classList.toggle('shapes', P.mode === 'shapes'); el.classList.toggle('typemode', P.mode === 'type');
    el.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === P.mode));
    el.querySelectorAll('[data-for]').forEach(r => { r.hidden = r.dataset.for !== P.mode; });
    $('[data-er-seg]', el).hidden = P.tool !== 'eraser';
    el.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === P.tool));
    el.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === P.color));
    el.querySelectorAll('[data-er]').forEach(b => b.setAttribute('aria-pressed', b.dataset.er === P.erMode));
    el.querySelectorAll('[data-paper]').forEach(b => b.setAttribute('aria-pressed', b.dataset.paper === P.paper));
    $('[data-a="penonly"]', el).setAttribute('aria-pressed', P.penOnly);
    el.querySelectorAll('[data-sh]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sh === P.shTool));
    const s = P.sel >= 0 ? P.items[P.sel] : null;
    ['front', 'back', 'delete'].forEach(k => { $('[data-shp="' + k + '"]', el).disabled = !s; });
    $('[data-shp="shadow"]', el).setAttribute('aria-pressed', !!(s ? s.sd : P.shShadow));
    $('[data-r="lw"]', el).value = s ? s.lw : P.shLw;
    $('[data-pop="sf"] i', el).style.setProperty('--c', (s ? s.f : P.shFill) || 'transparent');
    $('[data-pop="so"] i', el).style.setProperty('--c', (s ? s.c : P.shLine));
    $('[data-pop="fc"] i', el).style.setProperty('--c', P.fc || '#1d2733');
    $('[data-pop="hl"] i', el).style.setProperty('--c', P.hl || 'transparent');
    const full = $('[data-a="full"]', el); full.hidden = !isDesktop(); full.setAttribute('aria-pressed', P.full); full.innerHTML = (P.full ? IC.side + '<span class="l">Side panel</span>' : IC.full + '<span class="l">Full screen</span>'); full.title = P.full ? 'Back to a side panel' : 'Full screen'; full.setAttribute('aria-label', full.title);
    const vw = $('.sbp-view', el); vw.hidden = !(P.full && isDesktop()); vw.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === P.view));
    el.classList.toggle('full', P.full || !isDesktop()); el.classList.toggle('page', P.full && P.view === 'page' && isDesktop()); document.body.classList.toggle('sb-padfull', P.full || !isDesktop());
    P.sheet.classList.toggle('lines', P.paper === 'lines'); P.sheet.classList.toggle('graph', P.paper === 'graph');
    $('select[data-s="font"]', el).value = P.ed.dataset.ff; $('select[data-s="size"]', el).value = P.ed.dataset.sz;
    paintState();
  }
  function paintState() {     // which text buttons show as pressed, for where the cursor is
    if (!P || P.mode !== 'type') return; const el = P.el, s = getSelection();
    const inside = s.rangeCount && P.ed.contains(s.anchorNode); const node = inside ? (s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode) : null;
    const q = c => { try { return inside && document.queryCommandState(c); } catch (e) { return false; } };
    [['bold', 'bold'], ['italic', 'italic'], ['underline', 'underline'], ['strike', 'strikeThrough']].forEach(([f, c]) => { const b = $('[data-f="' + f + '"]', el); if (b) b.setAttribute('aria-pressed', q(c)); });
    const list = node && node.closest && node.closest('ul,ol'), blk = node && node.closest && node.closest('p,h2,h3,li');
    $('[data-f="ul"]', el).setAttribute('aria-pressed', !!(list && list.tagName === 'UL' && !list.classList.contains('check')));
    $('[data-f="ol"]', el).setAttribute('aria-pressed', !!(list && list.tagName === 'OL'));
    $('[data-f="check"]', el).setAttribute('aria-pressed', !!(list && list.classList.contains('check')));
    const al = blk ? (blk.style.textAlign || 'left') : 'left';
    ['left', 'center', 'right'].forEach(a => $('[data-f="' + a + '"]', el).setAttribute('aria-pressed', inside && al === a));
    const ffs = node && node.closest && node.closest('[class*="ff-"]'), szs = node && node.closest && node.closest('[class*="sz-"]');
    const ff = ffs && P.ed.contains(ffs) ? (ffs.className.match(/ff-(\w+)/) || [])[1] : P.ed.dataset.ff, sz = szs && P.ed.contains(szs) ? (szs.className.match(/sz-(\w+)/) || [])[1] : P.ed.dataset.sz;
    const fsel = $('select[data-s="font"]', el), ssel = $('select[data-s="size"]', el), bsel = $('select[data-s="block"]', el);
    if (document.activeElement !== fsel) fsel.value = ff || 'hand'; if (document.activeElement !== ssel) ssel.value = sz || 'm';
    if (document.activeElement !== bsel) bsel.value = blk && /^H[23]$/.test(blk.tagName) ? blk.tagName.toLowerCase() : 'p';
  }
  function padOf() { const cs = getComputedStyle(P.ed); return { l: parseFloat(cs.paddingLeft) || 0, t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0 }; }
  function fit() {
    if (!P) return; const st = P.stage, w = st.clientWidth, h = st.clientHeight; if (!w || !h) return;
    const z = zoomOf(st), ratio = (window.devicePixelRatio || 1) * z;
    if (P.cvW !== w || P.cvH !== h || P.ratio !== ratio) {
      P.cv.style.width = w + 'px'; P.cv.style.height = h + 'px'; P.cv.style.marginBottom = (-h) + 'px';
      P.cv.width = Math.round(w * ratio); P.cv.height = Math.round(h * ratio); P.cvW = w; P.cvH = h; P.ratio = ratio;
    }
    P.pad = padOf();
    if (P.paper === 'lines') { const y0 = P.pad.t + baselineOf(P.ed) + 2 - (PAPER.LINE - 1); P.sheet.style.backgroundPosition = '0 ' + (((y0 % PAPER.LINE) + PAPER.LINE) % PAPER.LINE) + 'px'; }
    else if (P.paper === 'graph') P.sheet.style.backgroundPosition = P.pad.l + 'px ' + P.pad.t + 'px';
    else P.sheet.style.backgroundPosition = '';
    render();
  }
  /* where the content origin (top left of the text area) is on the ink canvas */
  function origin() {
    const z = zoomOf(P.stage), cr = P.cv.getBoundingClientRect(), er = P.ed.getBoundingClientRect();
    return { x: (er.left - cr.left) / z + P.pad.l + P.ed.clientLeft, y: (er.top - cr.top) / z + P.pad.t + P.ed.clientTop };
  }
  function render() {
    if (!P || !P.pad) return;
    P.tops = blockTops(P.ed); P.ed.classList.toggle('noph', P.items.length > 0);   // no "Type here" hint over a drawing
    /* the page grows to hold the drawing, with room below to keep going */
    const bd = itemBounds(P.items, P.tops), need = Math.ceil(bd.h + P.pad.t + 260);
    const cur = parseFloat(P.ed.style.minHeight) || 0; if (Math.abs(cur - need) > 40 || cur < need) P.ed.style.minHeight = Math.max(need, 0) + 'px';
    pageBreaks();
    const o = origin(), g = P.g; P.org = o;
    g.setTransform(P.ratio, 0, 0, P.ratio, 0, 0); g.clearRect(0, 0, P.cvW, P.cvH); g.translate(o.x, o.y);
    drawInk(g, P.items, P.tops); if (P.cur) drawStroke(g, P.cur);
    renderShapes();
  }
  function pageBreaks() {
    P.sheet.querySelectorAll('.sbp-brk').forEach(b => b.remove());
    if (!P.el.classList.contains('page')) return;
    const h = P.sheet.offsetHeight; let k = 1;
    for (let y = PAGE.H; y < h - 20; y += PAGE.H, k++) { const b = document.createElement('div'); b.className = 'sbp-brk'; b.style.top = y + 'px'; b.innerHTML = '<span>Page ' + (k + 1) + '</span>'; P.sheet.appendChild(b); }
  }
  function renderShapes() {
    const pad = P.pad, list = P.items.map((it, i) => it.k === 'h' ? shapeSVG(it, i, offOf(it, P.tops)) : '').join('') + (P.tmp ? shapeSVG(P.tmp, -1, 0) : '');
    let sel = '';
    const s = P.mode === 'shapes' && P.sel >= 0 ? P.items[P.sel] : null;
    if (s) {
      const d = offOf(s, P.tops), hs = handles(s).map(([k, x, y]) => `<rect class="hd" data-hd="${k}" x="${x - 6}" y="${y + d - 6}" width="12" height="12" rx="2" style="cursor:${k.length === 2 || k === 'a' || k === 'b' ? 'nwse' : k === 'n' || k === 's' ? 'ns' : 'ew'}-resize;pointer-events:all"/>`).join('');
      const b = boxOf(s); sel = (isLine(s) ? '' : `<rect class="sel" x="${b.x - 4}" y="${b.y + d - 4}" width="${b.w + 8}" height="${b.h + 8}"/>`) + hs;
    }
    P.svg.innerHTML = `<defs><filter id="sbpShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="3" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".28"/></filter></defs><g transform="translate(${pad.l + P.ed.clientLeft} ${pad.t + P.ed.clientTop})">${list}${sel}</g>`;
  }
  function handles(s) {
    if (isLine(s)) return [['a', s.x, s.y], ['b', s.x + s.w, s.y + s.h]];
    const b = boxOf(s), mx = b.x + b.w / 2, my = b.y + b.h / 2;
    return [['nw', b.x, b.y], ['n', mx, b.y], ['ne', b.x + b.w, b.y], ['e', b.x + b.w, my], ['se', b.x + b.w, b.y + b.h], ['s', mx, b.y + b.h], ['sw', b.x, b.y + b.h], ['w', b.x, my]];
  }

  /* ---- pointer input (mouse, finger, and pen with pressure) ---- */
  const pen = () => P.tool === 'eraser' ? (P.erMode === 'stroke' ? 'estroke' : 'erase') : P.tool;
  function point(e) {     // content coordinates of a pointer event
    const z = zoomOf(P.stage), er = P.ed.getBoundingClientRect();
    return [Math.round(((e.clientX - er.left) / z - P.pad.l - P.ed.clientLeft) * 10) / 10, Math.round(((e.clientY - er.top) / z - P.pad.t - P.ed.clientTop) * 10) / 10];
  }
  function pressure(e, prev) {
    if (e.pointerType === 'pen') return Math.round((e.pressure || .5) * 10) / 10;
    if (P.tool !== 'brush' || !prev) return .5;                         // mouse and finger: the brush gets thinner when you move fast
    const dt = Math.max(1, e.timeStamp - prev.t), v = Math.hypot(e.clientX - prev.cx, e.clientY - prev.cy) / dt;
    const q = Math.max(.2, Math.min(.75, .75 - v * .35)); return Math.round((prev.q * .6 + q * .4) * 10) / 10;
  }
  function hits(it, x, y, r) {
    y -= offOf(it, P.tops);
    if (it.k === 't') { const m = measureOld(it); return x > it.x - r && x < it.x + m.w + r && y > it.y - r && y < it.y + m.h + r; }
    if (it.k === 'h' || it.t === 'erase') return false;
    const n = it.p.length / 3, rr = r + it.w / 2;
    if (n === 1) return Math.hypot(x - it.p[0], y - it.p[1]) <= rr;
    for (let i = 1; i < n; i++) {
      const ax = it.p[(i - 1) * 3], ay = it.p[(i - 1) * 3 + 1], bx = it.p[i * 3], by = it.p[i * 3 + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= rr) return true;
    }
    return false;
  }
  function setMode(m) {
    if (!P || P.mode === m) return;
    endTyping(); closePop(); closeLinkBubble(); P.mode = lastMode = m; if (m !== 'shapes') P.sel = -1;
    if (m !== 'type' && document.activeElement === P.ed) P.ed.blur();
    refresh(); render();
    if (m === 'type') { P.ed.focus({ preventScroll: true }); if (P.range) restoreSel(); else placeCaretEnd(); }
  }
  function setFull(on) {
    if (!P) return; P.full = !!on;
    document.body.classList.toggle('sb-padfull', P.full);
    if (P.full && !P.inertFull) { P.inertFull = []; [...document.body.children].forEach(c => { if (c !== P.el && !c.classList.contains('sb-ov') && !c.inert && c.id !== 'sb-toast') { c.inert = true; P.inertFull.push(c); } }); }
    if (!P.full && P.inertFull) { P.inertFull.forEach(c => { c.inert = false; }); P.inertFull = null; }
    refresh(); requestAnimationFrame(() => { fit(); });
  }
  function wire() {
    const el = P.el, cv = P.cv, ed = P.ed;
    /* toolbar buttons keep the text selection: pressing one must not take the cursor out of the text */
    el.querySelector('.sbp-bar').addEventListener('mousedown', e => { if (e.target.closest('button') && P.mode === 'type') e.preventDefault(); });
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { P.tool = b.dataset.tool; refresh(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { P.color = b.dataset.c; refresh(); });
    el.querySelectorAll('[data-er]').forEach(b => b.onclick = () => { P.erMode = b.dataset.er; refresh(); });
    $('[data-r="pen"]', el).oninput = e => { P.size = +e.target.value; };
    el.querySelectorAll('[data-paper]').forEach(b => b.onclick = () => { P.paper = P.paper === b.dataset.paper ? 'blank' : b.dataset.paper; refresh(); fit(); saveDraft(); });
    el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { P.view = b.dataset.view; setPref('view', P.view); refresh(); requestAnimationFrame(fit); });
    $('[data-a="penonly"]', el).onclick = () => { P.penOnly = penOnlyChoice = !P.penOnly; refresh(); SB.toast(P.penOnly ? 'Pen only is on. Your fingers will not draw, and one finger moves the page.' : 'Pen only is off. You can draw with a finger.'); };
    $('[data-a="undo"]', el).onclick = undo; $('[data-a="redo"]', el).onclick = redo;
    $('[data-a="clear"]', el).onclick = () => { if (!P.items.length && !typedSomething()) return; SB.confirm({ title: 'Erase everything?', text: 'This clears the whole page: typing, drawing, and shapes. You can press Undo to get it back.', ok: 'Erase everything', cancel: 'Keep it', danger: true }, () => { endTyping(); pushPast(); P.items = []; P.sel = -1; setHTML(''); afterChange(); }); };
    $('[data-a="close"]', el).onclick = () => requestClose();
    $('[data-a="save"]', el).onclick = () => saveDialog(false);
    $('[data-a="new"]', el).onclick = newNote;
    $('[data-a="notes"]', el).onclick = toggleSaved;
    $('[data-a="download"]', el).onclick = () => downloadDialog(null);
    $('[data-a="full"]', el).onclick = () => { setFull(!P.full); };

    /* ---- text ---- */
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => format(b.dataset.f));
    $('select[data-s="font"]', el).onchange = e => setFontOrSize('ff', e.target.value);
    $('select[data-s="size"]', el).onchange = e => setFontOrSize('sz', e.target.value);
    $('select[data-s="block"]', el).onchange = e => { restoreSel(); pushPast(); endTyping(); document.execCommand('formatBlock', false, e.target.value); changed(); P.ed.focus({ preventScroll: true }); };
    el.querySelectorAll('[data-pop]').forEach(b => b.onclick = () => togglePop(b));
    ed.addEventListener('beforeinput', e => {
      if (e.inputType === 'historyUndo') { e.preventDefault(); undo(); return; }
      if (e.inputType === 'historyRedo') { e.preventDefault(); redo(); return; }
      if (!P.typing) { pushPast(); P.typing = true; }
      clearTimeout(P.tt); P.tt = setTimeout(() => { if (P) P.typing = false; }, 900);   // a burst of typing is one undo step
    });
    ed.addEventListener('input', () => { changed(true); closeLinkBubble(); });
    ed.addEventListener('paste', e => {
      const cd = e.clipboardData; if (!cd) return; e.preventDefault();
      const h = cd.getData('text/html'), t = cd.getData('text/plain');
      if (!P.typing) { pushPast(); } endTyping();
      if (h) document.execCommand('insertHTML', false, sanitize(h, false)); else if (t) document.execCommand('insertText', false, t);
      changed();
    });
    ed.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) e.preventDefault(); });
    ed.addEventListener('mousedown', e => {      // a check box: tick it without moving the cursor
      const li = e.target.closest && e.target.closest('ul.check>li'); if (!li) return;
      const r = li.getBoundingClientRect(), z = zoomOf(P.stage), fs = parseFloat(getComputedStyle(li).fontSize) || 20;
      if ((e.clientX - r.left) / z <= fs * 1.25) { e.preventDefault(); endTyping(); pushPast(); li.classList.toggle('done'); changed(); }
    });
    ed.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); return; }
      e.preventDefault(); linkBubble(a);
    });
    ed.addEventListener('focus', () => { if (P.mode !== 'type') setMode('type'); });
    P.stage.addEventListener('scroll', () => { if (!P) return; if (!P.raf) P.raf = requestAnimationFrame(() => { P.raf = 0; render(); }); closeLinkBubble(); closePop(); }, { passive: true });

    /* ---- pens ---- */
    let last = null; const touches = new Map(); let pan = null;
    const startPan = () => { const pts = [...touches.values()]; pan = { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length, sl: P.stage.scrollLeft, st: P.stage.scrollTop }; };
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'pen' && !penSeen) {
        penSeen = true;
        if (penOnlyChoice == null && !P.penOnly) { P.penOnly = true; refresh(); SB.toast('Pen found. Your fingers will not draw now. Turn off Pen only to draw with a finger.'); }
      }
      if (e.pointerType === 'touch') {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (P.penOnly || touches.size > 1) {     // one finger with Pen only, or two fingers: move the page instead of drawing
          if (P.cur && P.curType === 'touch') { P.cur = null; P.estroke = null; P.pid = null; render(); }
          try { cv.setPointerCapture(e.pointerId); } catch (er) {} startPan(); return;
        }
      }
      if (e.pointerType === 'pen' && (P.cur || P.estroke) && P.curType === 'touch') { P.cur = null; P.estroke = null; P.pid = null; render(); }   // a resting palm started first: the pen wins
      if (P.cur || P.estroke) return;
      const [x, y] = point(e);
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      P.pid = e.pointerId; P.curType = e.pointerType;
      const penEraser = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32));   // the eraser end of a pen
      const mode = penEraser ? 'erase' : pen();
      if (mode === 'estroke') { P.estroke = { items: P.items, r: P.size * 1.5 + 6 }; eraseAt(x, y); return; }
      const t = mode, q = pressure(e, null);
      P.cur = { k: 's', t, c: t === 'erase' ? '#000000' : P.color, w: Math.round(widthFor(t, P.size) * 10) / 10, p: [x, y, q] };
      last = { cx: e.clientX, cy: e.clientY, t: e.timeStamp, q };
      if (PATHY[t]) { const b = P.base || (P.base = document.createElement('canvas')); b.width = P.cv.width; b.height = P.cv.height; b.getContext('2d').drawImage(P.cv, 0, 0); }
      render();
    });
    cv.addEventListener('pointermove', e => {
      if (!P) return;
      if (e.pointerType === 'touch' && touches.has(e.pointerId)) { touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pan) { const pts = [...touches.values()], x = pts.reduce((a, p) => a + p.x, 0) / pts.length, y = pts.reduce((a, p) => a + p.y, 0) / pts.length; P.stage.scrollLeft = pan.sl - (x - pan.x); P.stage.scrollTop = pan.st - (y - pan.y); return; } }
      if (P.tool === 'eraser' && e.pointerType !== 'touch') { const z = zoomOf(P.stage), wr = P.wrap.getBoundingClientRect(), d = P.erMode === 'stroke' ? (P.size * 1.5 + 6) * 2 : widthFor('erase', P.size); Object.assign(P.ring.style, { display: 'block', left: (e.clientX - wr.left) / z + 'px', top: (e.clientY - wr.top) / z + 'px', width: d + 'px', height: d + 'px' }); } else P.ring.style.display = 'none';
      if (e.pointerId !== P.pid) return;
      const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const [x, y] = point(ev);
        if (P.estroke) { eraseAt(x, y); continue; }
        if (!P.cur) continue;
        const n = P.cur.p.length, dx = x - P.cur.p[n - 3], dy = y - P.cur.p[n - 2];
        if (dx * dx + dy * dy < 2.25) continue;
        const q = pressure(ev, last); last = { cx: ev.clientX, cy: ev.clientY, t: ev.timeStamp, q };
        P.cur.p.push(x, y, q);
        if (PATHY[P.cur.t] && P.base) { P.g.save(); P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.clearRect(0, 0, P.cv.width, P.cv.height); P.g.drawImage(P.base, 0, 0); P.g.restore(); drawStroke(P.g, P.cur); }
        else if (PATHY[P.cur.t]) render(); else seg(P.g, P.cur, P.cur.p.length / 3 - 1);
      }
    });
    cv.addEventListener('pointerleave', () => { if (P) P.ring.style.display = 'none'; });
    const up = e => {
      if (!P) return;
      if (touches.has(e.pointerId)) { touches.delete(e.pointerId); if (pan) { if (touches.size) startPan(); else pan = null; return; } }
      if (e.pointerId !== P.pid) return; P.pid = null;
      if (P.estroke) { const E = P.estroke; P.estroke = null; if (E.items !== P.items) commit(E.items); render(); return; }
      if (!P.cur) return; const s = P.cur; P.cur = null;
      const a = anchorAt(P.ed, P.tops, s.p[1]); if (a) s.a = a;
      commit([...P.items, s]);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());

    /* ---- shapes ---- */
    el.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { P.shTool = b.dataset.sh; if (P.shTool !== 'select') P.sel = -1; refresh(); render(); });
    $('[data-r="lw"]', el).oninput = e => { const v = +e.target.value; if (P.sel >= 0) setShapeProp('lw', v, true); else P.shLw = v; };
    $('[data-r="lw"]', el).onchange = () => { P.lwTyping = false; };
    $('[data-shp="shadow"]', el).onclick = () => { if (P.sel >= 0) setShapeProp('sd', !P.items[P.sel].sd); else { P.shShadow = !P.shShadow; refresh(); } };
    $('[data-shp="front"]', el).onclick = () => reorder(1); $('[data-shp="back"]', el).onclick = () => reorder(-1);
    $('[data-shp="delete"]', el).onclick = deleteShape;
    const svg = P.svg; let op = null;
    svg.addEventListener('pointerdown', e => {
      if (P.mode !== 'shapes' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); const [x, y] = point(e);
      const hd = e.target.closest && e.target.closest('[data-hd]'), g = e.target.closest && e.target.closest('[data-i]');
      try { svg.setPointerCapture(e.pointerId); } catch (er) {}
      if (hd && P.sel >= 0) { op = { kind: 'resize', hd: hd.dataset.hd, i: P.sel, p0: [x, y], orig: Object.assign({}, P.items[P.sel]), id: e.pointerId }; return; }
      if (g && +g.dataset.i >= 0 && P.shTool === 'select') { const i = +g.dataset.i; P.sel = i; op = { kind: 'move', i, p0: [x, y], orig: Object.assign({}, P.items[i]), id: e.pointerId }; refresh(); render(); return; }
      if (P.shTool !== 'select') { op = { kind: 'new', p0: [x, y], id: e.pointerId }; P.tmp = { k: 'h', sh: P.shTool, x, y, w: 0, h: 0, f: P.shFill, c: P.shLine, lw: P.shLw, sd: P.shShadow }; render(); return; }
      if (P.sel >= 0) { P.sel = -1; refresh(); render(); }
    });
    svg.addEventListener('pointermove', e => {
      if (!op || e.pointerId !== op.id) return; const [x, y] = point(e), dx = x - op.p0[0], dy = y - op.p0[1];
      if (op.kind === 'new') { P.tmp.w = dx; P.tmp.h = dy; if (e.shiftKey && !isLine(P.tmp)) { const m = Math.max(Math.abs(dx), Math.abs(dy)); P.tmp.w = Math.sign(dx || 1) * m; P.tmp.h = Math.sign(dy || 1) * m; } }
      else if (op.kind === 'move') { const o = op.orig, it = Object.assign({}, o, { x: o.x + dx, y: o.y + dy }); P.items = P.items.map((v, i) => i === op.i ? it : v); op.moved = true; }
      else { P.items = P.items.map((v, i) => i === op.i ? resizeShape(op.orig, op.hd, dx, dy, e.shiftKey) : v); op.moved = true; }
      render();
    });
    const shUp = e => {
      if (!op || e.pointerId !== op.id) return; const o = op; op = null;
      if (o.kind === 'new') {
        let t = P.tmp; P.tmp = null;
        if (Math.abs(t.w) < 6 && Math.abs(t.h) < 6) t = Object.assign(t, isLine(t) ? { w: 140, h: 0 } : { x: t.x - 70, y: t.y - 45, w: 140, h: t.sh === 'ellipse' || t.sh === 'star' ? 140 : 90 });
        if (!isLine(t)) Object.assign(t, boxOf(t));
        const a = anchorAt(P.ed, P.tops, boxOf(t).y); if (a) t.a = a;
        commit([...P.items, t]); P.sel = P.items.length - 1; P.shTool = 'select'; refresh(); render(); return;
      }
      if (!o.moved) return;
      const now = P.items[o.i], prev = P.items.map((v, i) => i === o.i ? o.orig : v);
      P.items = prev; commit(P.items.map((v, i) => i === o.i ? reanchor(now) : v));
    };
    svg.addEventListener('pointerup', shUp); svg.addEventListener('pointercancel', shUp);
  }
  /* a shape that was moved or resized now belongs to the text beside its new place */
  function reanchor(it) {
    const d = offOf(it, P.tops), n = Object.assign({}, it, { y: it.y + d }); delete n.a;
    if (!isLine(n)) Object.assign(n, boxOf(n));
    const a = anchorAt(P.ed, P.tops, boxOf(n).y); if (a) n.a = a; return n;
  }
  function resizeShape(o, hd, dx, dy, keep) {
    if (isLine(o)) return hd === 'a' ? Object.assign({}, o, { x: o.x + dx, y: o.y + dy, w: o.w - dx, h: o.h - dy }) : Object.assign({}, o, { w: o.w + dx, h: o.h + dy });
    let b = boxOf(o), x1 = b.x, y1 = b.y, x2 = b.x + b.w, y2 = b.y + b.h;
    if (hd.includes('w')) x1 += dx; if (hd.includes('e')) x2 += dx; if (hd.includes('n')) y1 += dy; if (hd.includes('s')) y2 += dy;
    if (keep && hd.length === 2) { const s = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); if (hd.includes('w')) x1 = x2 - s; else x2 = x1 + s; if (hd.includes('n')) y1 = y2 - s; else y2 = y1 + s; }
    return Object.assign({}, o, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(4, Math.abs(x2 - x1)), h: Math.max(4, Math.abs(y2 - y1)) });
  }
  function setShapeProp(k, v, live) {
    if (P.sel < 0) return; const it = Object.assign({}, P.items[P.sel], { [k]: v });
    if (live && P.lwTyping) { P.items = P.items.map((x, i) => i === P.sel ? it : x); render(); refresh(); return; }   // dragging the width slider is one undo step
    if (live) P.lwTyping = true;
    commit(P.items.map((x, i) => i === P.sel ? it : x));
  }
  function moveShapeBy(dx, dy) { const s = P.items[P.sel]; commit(P.items.map((x, i) => i === P.sel ? reanchor(Object.assign({}, s, { x: s.x + dx, y: s.y + dy })) : x)); }
  function reorder(dir) {
    if (P.sel < 0) return; const it = P.items[P.sel], rest = P.items.filter((_, i) => i !== P.sel);
    commit(dir > 0 ? [...rest, it] : [it, ...rest]); P.sel = dir > 0 ? P.items.length - 1 : 0; refresh(); render();
  }
  function deleteShape() { if (P.sel < 0) return; const i = P.sel; P.sel = -1; commit(P.items.filter((_, k) => k !== i)); }
  /* The whole-line eraser: while dragging, the page shows the trimmed list; the history entry is made when the finger lifts. */
  function eraseAt(x, y) {
    const E = P.estroke, keep = E.items.filter(it => !hits(it, x, y, E.r));
    if (keep.length !== E.items.length) { E.items = keep; const g = P.g, o = P.org; g.setTransform(P.ratio, 0, 0, P.ratio, 0, 0); g.clearRect(0, 0, P.cvW, P.cvH); g.translate(o.x, o.y); drawInk(g, keep, P.tops); }
  }

  /* ---- formatting ---- */
  function changed(fromTyping) {
    if (!P) return; tidy(); P.html = P.ed.innerHTML;
    if (!fromTyping) endTyping();
    render(); refresh(); saveDraft();
  }
  function format(f) {
    if (!P) return; restoreSel(); endTyping();
    if (f === 'link') return linkDialog();
    pushPast();
    const ex = (c, v) => { try { document.execCommand(c, false, v == null ? null : v); } catch (e) {} };
    if (f === 'bold') ex('bold'); else if (f === 'italic') ex('italic'); else if (f === 'underline') ex('underline'); else if (f === 'strike') ex('strikeThrough');
    else if (f === 'left') ex('justifyLeft'); else if (f === 'center') ex('justifyCenter'); else if (f === 'right') ex('justifyRight');
    else if (f === 'ul' || f === 'ol' || f === 'check') {
      const s = getSelection(), n = s.anchorNode && (s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode), list = n && n.closest && n.closest('ul,ol');
      const isCheck = list && list.classList.contains('check');
      if (f === 'check') {
        if (isCheck) { ex('insertUnorderedList'); }                                       // checklist off
        else { if (!list || list.tagName === 'OL') ex('insertUnorderedList'); const l2 = list && list.tagName === 'UL' ? list : ownList(); if (l2) l2.classList.add('check'); }
      } else if (f === 'ul' && isCheck) { list.classList.remove('check'); [...list.children].forEach(li => li.classList.remove('done')); }
      else { ex(f === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'); if (!list && f === 'ul') { const l2 = ownList(); if (l2) { l2.classList.remove('check'); [...l2.children].forEach(li => li.classList.remove('done')); } } }
    } else if (f === 'clear') {
      ex('removeFormat');
      const r = P.range; if (r && !r.collapsed) P.ed.querySelectorAll('span').forEach(sp => { if (r.intersectsNode(sp)) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); } });
    }
    changed(); P.ed.focus({ preventScroll: true });
  }
  /* A new list started right under another list is joined to it by the browser. This splits the new lines (the ones selected, or the one
     with the cursor) into a list of their own, so a checklist under bullets does not turn the bullets into boxes. Returns that list. */
  function ownList() {
    const s = getSelection(); if (!s.rangeCount) return null;
    const r = s.getRangeAt(0), at = n => n && (n.nodeType === 3 ? n.parentElement : n), li0 = at(r.startContainer) && at(r.startContainer).closest('li'); if (!li0 || !P.ed.contains(li0)) return null;
    const ul = li0.parentElement, all = [...ul.children], mid = all.filter(li => li === li0 || r.intersectsNode(li));
    const i0 = all.indexOf(mid[0]), i1 = all.indexOf(mid[mid.length - 1]); if (i0 === 0 && i1 === all.length - 1) return ul;
    const k = holdCaret(), mk = items => { const n = document.createElement(ul.tagName.toLowerCase()); if (ul.className) n.className = ul.className; items.forEach(li => n.appendChild(li)); return n; };
    const parts = [], before = all.slice(0, i0), after = all.slice(i1 + 1), m = mk(all.slice(i0, i1 + 1));
    if (before.length) parts.push(mk(before)); parts.push(m); if (after.length) parts.push(mk(after));
    ul.replaceWith(...parts); k(); return m;
  }
  /* Font and size: with words selected, those words change; with nothing selected, the whole note changes. */
  function setFontOrSize(kind, v) {
    if (!P) return; restoreSel(); endTyping(); pushPast();
    const s = getSelection(), sel = s.rangeCount && !s.isCollapsed && P.ed.contains(s.anchorNode);
    if (!sel) { P.ed.dataset[kind] = v; if (kind === 'ff') setPref('font', v); }
    else {
      try { document.execCommand('styleWithCSS', false, false); document.execCommand('fontName', false, 'sbmark'); } catch (e) {}
      P.ed.querySelectorAll('font[face="sbmark"]').forEach(f => {
        const sp = document.createElement('span'); sp.className = kind + '-' + v; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp);
        sp.querySelectorAll('span').forEach(inner => { inner.className = inner.className.split(/\s+/).filter(c => !c.startsWith(kind + '-')).join(' '); if (!inner.className && !inner.getAttribute('style')) { while (inner.firstChild) inner.parentNode.insertBefore(inner.firstChild, inner); inner.remove(); } });
      });
    }
    changed(); fit(); P.ed.focus({ preventScroll: true });
  }
  function closePop(refocus) { if (!P || !P.popEl) return; const b = P.popBtn; P.popEl.remove(); P.popEl = null; if (b) b.setAttribute('aria-expanded', 'false'); if (refocus && b) b.focus(); }
  function togglePop(b) {
    if (P.popEl) { const same = P.popBtn === b; closePop(); if (same) return; }
    const kind = b.dataset.pop, sets = { fc: COLORS, hl: MARKS, sf: FILLS, so: COLORS }[kind];
    const cur = kind === 'fc' ? P.fc : kind === 'hl' ? P.hl : P.sel >= 0 ? (kind === 'sf' ? P.items[P.sel].f : P.items[P.sel].c) : (kind === 'sf' ? P.shFill : P.shLine);
    const pop = document.createElement('div'); pop.className = 'sbp-pop'; pop.setAttribute('role', 'group'); pop.setAttribute('aria-label', b.getAttribute('aria-label'));
    pop.innerHTML = `<span class="lbl">${esc(b.getAttribute('aria-label'))}</span>` + sets.map(([n, c]) => `<button type="button" class="sbp-sw${c ? '' : ' none'}" data-v="${c}" style="--c:${c || 'transparent'}" aria-label="${n}" aria-pressed="${c === cur}"></button>`).join('');
    P.el.appendChild(pop); P.popEl = pop; P.popBtn = b; b.setAttribute('aria-expanded', 'true');
    const br = b.getBoundingClientRect(), pr = P.el.getBoundingClientRect(), z = zoomOf(P.el);
    pop.style.left = Math.max(4, Math.min((br.left - pr.left) / z, P.el.clientWidth - pop.offsetWidth - 6)) + 'px'; pop.style.top = ((br.bottom - pr.top) / z + 4) + 'px';
    pop.addEventListener('mousedown', e => { if (P.mode === 'type') e.preventDefault(); });
    pop.querySelectorAll('[data-v]').forEach(s => s.onclick = () => {
      const v = s.dataset.v; closePop();
      if (kind === 'fc' || kind === 'hl') {
        restoreSel(); endTyping(); pushPast();
        try { document.execCommand('styleWithCSS', false, kind === 'hl'); document.execCommand(kind === 'fc' ? 'foreColor' : 'hiliteColor', false, v || (kind === 'fc' ? '#1d2733' : 'transparent')); document.execCommand('styleWithCSS', false, false); } catch (e) {}
        if (kind === 'fc') P.fc = v; else P.hl = v || P.hl;
        changed(); P.ed.focus({ preventScroll: true });
      } else if (P.sel >= 0) setShapeProp(kind === 'sf' ? 'f' : 'c', v);
      else { if (kind === 'sf') P.shFill = v; else P.shLine = v || '#1d2733'; refresh(); }
      b.focus({ preventScroll: true }); if (kind === 'fc' || kind === 'hl') P.ed.focus({ preventScroll: true });
    });
    const f = pop.querySelector('[aria-pressed="true"]') || pop.querySelector('button'); if (f && P.mode !== 'type') f.focus();
  }
  function linkDialog(a) {
    if (!P) return; restoreSel();
    const s = getSelection(), node = s.anchorNode && (s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode);
    a = a || (node && node.closest && node.closest('a[href]')); if (a && !P.ed.contains(a)) a = null;
    const range = P.range && P.range.cloneRange(), needText = !a && (!range || range.collapsed);
    SB.dialog(`<h3>${a ? 'Edit link' : 'Add a link'}</h3>
      <label class="sbp-fld">Web address<input type="url" id="sbpUrl" class="sb-in" value="${a ? esc(a.getAttribute('href')) : ''}" placeholder="example.com" autocomplete="off" data-autofocus></label>
      ${needText ? '<label class="sbp-fld">Words to show<input type="text" id="sbpTxt" class="sb-in" autocomplete="off"></label>' : ''}
      <p class="sbp-err" role="alert" style="color:var(--bad-ink);font-weight:700;margin:0 0 8px" hidden></p>
      <div class="sb-row">${a ? '<button type="button" class="sb-btn ghost" data-k="rm">Remove link</button>' : ''}<button type="button" class="sb-btn ghost" data-k="no">Cancel</button><button type="button" class="sb-btn" data-k="ok">${a ? 'Save' : 'Add link'}</button></div>`, (box, close, ov) => {
      const back = () => { if (!P) return; P.ed.focus({ preventScroll: true }); if (range) { const ss = getSelection(); ss.removeAllRanges(); ss.addRange(range); } };
      ov._cancel = () => { close(); back(); };
      box.querySelector('[data-k="no"]').onclick = ov._cancel;
      const rm = box.querySelector('[data-k="rm"]'); if (rm) rm.onclick = () => { close(); if (!P) return; endTyping(); pushPast(); while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a); a.remove(); changed(); back(); };
      const go = () => {
        const url = safeURL(box.querySelector('#sbpUrl').value), err = box.querySelector('.sbp-err');
        if (!url) { err.hidden = false; err.textContent = 'Type a web address, like example.com.'; return; }
        close(); if (!P) return; endTyping(); pushPast(); back();
        if (a) a.setAttribute('href', url);
        else if (needText) { const t = (box.querySelector('#sbpTxt').value || '').trim() || url.replace(/^mailto:/, ''); document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(t)}</a>&nbsp;`); }
        else document.execCommand('createLink', false, url);
        changed();
      };
      box.querySelector('[data-k="ok"]').onclick = go;
      box.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }));
    });
  }
  function closeLinkBubble() { if (P && P.lb) { P.lb.remove(); P.lb = null; } }
  function linkBubble(a) {
    closeLinkBubble(); const lb = document.createElement('div'); lb.className = 'sbp-lb';
    lb.innerHTML = `<a href="${esc(a.href)}" target="_blank" rel="noopener noreferrer">Open ${esc(a.href.replace(/^https?:\/\/|^mailto:/, '').replace(/\/$/, ''))}</a><button type="button" data-k="edit">Edit</button><button type="button" data-k="rm">Remove</button>`;
    P.wrap.appendChild(lb); P.lb = lb;
    const z = zoomOf(P.wrap), r = a.getBoundingClientRect(), wr = P.wrap.getBoundingClientRect();
    lb.style.left = Math.max(4, Math.min((r.left - wr.left) / z, P.wrap.clientWidth - lb.offsetWidth - 6)) + 'px'; lb.style.top = ((r.bottom - wr.top) / z + 6) + 'px';
    lb.querySelector('[data-k="edit"]').onclick = () => { closeLinkBubble(); const rg = document.createRange(); rg.selectNodeContents(a); P.range = rg; linkDialog(a); };
    lb.querySelector('[data-k="rm"]').onclick = () => { closeLinkBubble(); endTyping(); pushPast(); while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a); a.remove(); changed(); };
  }

  /* ---- saved notes drawer ---- */
  function toggleSaved() {
    const box = $('.sbp-saved', P.el), btn = $('[data-a="notes"]', P.el);
    const set = on => { box.hidden = !on; P.el.classList.toggle('showing-saved', on); btn.setAttribute('aria-expanded', String(on)); btn.querySelector('.l').textContent = on ? 'Back to the note' : 'Saved notes'; if (!on) requestAnimationFrame(fit); };
    if (!box.hidden) return set(false);
    endTyping(); set(true);
    renderList(box, { onOpen: (note, scope) => loadNote(note, false, scope) });
  }
  function loadNote(note, quiet, scope) {
    const go = () => {
      const n = cleanNote(note) || note;
      P.paper = n.paper || 'blank'; P.sel = -1;
      restoreState({ html: n.html || '', items: JSON.parse(JSON.stringify(n.items || [])), font: n.font, size: n.size, paper: P.paper, from: scope && n.id ? { scope, id: n.id } : null }, true);
      P.savedItems = P.items; P.savedHtml = P.html;
      if (n.question && !P.question) setQuestion(n.question);
      const box = $('.sbp-saved', P.el); if (!box.hidden) toggleSaved();
      refresh();
    };
    if (!quiet && dirty()) SB.confirm({ title: 'Open this note?', text: 'What is on the notepad now will be replaced. Save it first if you want to keep it.', ok: 'Open the note', cancel: 'Keep working' }, go); else go();
  }

  /* ---- saving and closing ---- */
  function snapshotNote() {
    const cs = getComputedStyle(P.ed), w = P.ed.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    return { id: uid(), at: Date.now(), v: 2, question: P.question, mod: P.source, paper: P.paper, font: P.ed.dataset.ff, size: P.ed.dataset.sz, html: sanitize(P.html), w: Math.round(w), h: Math.round(P.ed.scrollHeight), items: P.items };
  }
  const canShare = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'note.png', { type: 'image/png' })] })); } catch (e) { return false; } };   // phones and tablets
  const markSaved = () => { if (P) { P.savedItems = P.items; P.savedHtml = P.html; dropDraft(P.kid); } };
  async function saveTo(kind, withQuestion) {
    if (!P) return false; const note = snapshotNote();
    if (kind === 'share') {
      try { const blob = await toBlob(compose({ live: true, question: withQuestion ? note.question : '', scale: 2 }));
        await navigator.share({ files: [new File([blob], fileName(note.at), { type: 'image/png' })], title: 'Note' }); } catch (e) { if (e && e.name === 'AbortError') return false; SB.toast('Could not share the picture.'); return false; }
      markSaved(); return true;
    }
    if (kind === 'device') { const ok = await new Promise(res => downloadDialog(null, res)); if (ok) markSaved(); return ok; }
    const same = P.from && P.from.scope === kind;
    if (same) { note.id = P.from.id; }
    const r = same ? store.replace(kind, note, P.kid) : store.add(kind, note, P.kid);
    if (!r.ok) { SB.toast(r.why); return false; }
    markSaved(); P.from = { scope: kind, id: note.id };
    SB.toast(same ? 'Note updated.' : kind === 'profile' ? 'Saved to your notes.' : 'Kept for this session.'); return true;
  }
  /* The save choices. From Save the notepad stays open; from closing, a choice (or Do not save) closes it.
     opts.stay: the notepad stays open afterwards (used by New note, which clears the page instead). opts.verb: what is about to happen to the writing. */
  function saveDialog(closing, after, onKeep, opts = {}) {
    if (!P) return; endTyping();
    if (!hasContent()) { SB.toast('There is nothing to save yet.'); return; }
    const canProfile = store.canProfile(P.kid), verb = opts.verb || 'close the notepad';
    SB.dialog(`<h3>${closing ? 'Save this note?' : 'Save this note'}</h3>
      <p>${closing ? 'You have writing on the notepad. It will be gone when you ' + verb + ' unless you save it.' : (canProfile ? 'Save it to your notes, or download a copy.' : 'Choose where to keep it.')}</p>
      ${P.question ? '<label class="sbp-chk"><input type="checkbox" class="sbp-cb" id="sbpQ" checked>Put the question at the top of a picture</label>' : ''}
      <div class="sbp-choices">
        ${canProfile ? '<button type="button" class="sb-btn" data-k="profile">Save to my notes</button>' : ''}
        <button type="button" class="sb-btn${canProfile ? ' ghost' : ''}" data-k="device">Download (PDF, Word, text, or picture)</button>
        ${canShare() ? '<button type="button" class="sb-btn ghost" data-k="share">Share a picture</button>' : ''}
        ${canProfile ? '' : '<button type="button" class="sb-btn ghost" data-k="session">Keep for this session only</button>'}</div>
      ${canProfile ? '' : '<p class="sbp-hint">Add your name to keep notes in your profile.</p>'}
      <div class="sb-row">${closing ? '<button type="button" class="sb-btn warn" data-k="discard">Do not save</button>' : ''}<button type="button" class="sb-btn ghost" data-k="keep">${closing ? 'Keep working' : 'Cancel'}</button></div>`, (box, close, ov) => {
      ov._cancel = () => { close(); onKeep && onKeep(); };
      box.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        const k = b.dataset.k, withQ = !!(box.querySelector('#sbpQ') || {}).checked;
        if (k === 'keep') { close(); onKeep && onKeep(); return; }
        if (k === 'discard') { close(); resume = null; if (P) { dropDraft(P.kid); P.noRemember = true; } if (!opts.stay) closePad(); after && after(true); return; }
        box.querySelectorAll('button').forEach(x => x.disabled = true);
        if (k === 'device') close();
        const ok = await saveTo(k, withQ); if (k !== 'device') close();
        if (ok && closing) { if (!opts.stay) closePad(); after && after(true); } else if (!ok && closing) onKeep && onKeep();
      });
    });
  }
  /* The Download box: PDF (looks like the page), Word (the text stays editable; drawings come along as a picture), plain text, or a picture. */
  let exportLoading = null;
  const loadExport = () => {
    if (window.SBPadExport) return Promise.resolve();
    if (!exportLoading) exportLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = SB.BASE + 'shared/sb-notepad-export.js'; s.onload = () => res(); s.onerror = () => { exportLoading = null; rej(); }; document.head.appendChild(s); });
    return exportLoading;
  };
  function downloadDialog(note, done) {
    const live = !note; if (live && (!P || !hasContent())) { SB.toast('There is nothing to download yet.'); done && done(false); return; }
    const src = live ? snapshotNote() : note, q = src.question;
    let finished = false; const end = ok => { if (!finished) { finished = true; done && done(ok); } };
    SB.dialog(`<h3>Download this note</h3><p>Choose a kind of file. It goes to this device's Downloads.</p>
      ${q ? '<label class="sbp-chk"><input type="checkbox" class="sbp-cb" id="sbpDQ" checked>Put the question at the top</label>' : ''}
      <div class="sbp-choices">
        <button type="button" class="sb-btn" data-k="pdf">PDF<small>Looks just like the page, with drawings and shapes.</small></button>
        <button type="button" class="sb-btn ghost" data-k="docx">Word document (.docx)<small>The words stay editable. Drawings and shapes come as a picture at the end.</small></button>
        <button type="button" class="sb-btn ghost" data-k="txt">Plain text (.txt)<small>Just the words.</small></button>
        <button type="button" class="sb-btn ghost" data-k="png">Picture (.png)<small>One picture of the whole note.</small></button></div>
      <div class="sb-row"><button type="button" class="sb-btn ghost" data-k="no">Cancel</button></div>`, (box, close, ov) => {
      ov._cancel = () => { close(); end(false); };
      box.querySelector('[data-k="no"]').onclick = ov._cancel;
      box.querySelectorAll('.sbp-choices [data-k]').forEach(b => b.onclick = async () => {
        const kind = b.dataset.k, withQ = !!(box.querySelector('#sbpDQ') || {}).checked; box.querySelectorAll('button').forEach(x => x.disabled = true);
        try {
          await fontsReady();
          if (kind === 'png') { const blob = await toBlob(live && P ? compose({ live: true, question: withQ ? q : '', scale: 2 }) : compose(Object.assign({}, src, { question: withQ ? q : '', scale: 2 }))); download(blob, fileBase(src.at) + '.png'); }
          else { await loadExport(); await window.SBPadExport.run(kind, src, { question: withQ ? q : '' }); }
          close(); SB.toast({ pdf: 'PDF', docx: 'Word document', txt: 'Text file', png: 'Picture' }[kind] + ' saved to this device.'); end(true);
        } catch (e) { close(); SB.toast('Could not make that file. Try again.'); end(false); }
      });
    });
  }
  /* New note: a blank page on the same question. Unsaved writing asks first, with the same choices as closing. */
  function resetNote() {
    if (!P) return; endTyping(); dropDraft(P.kid); resume = null;
    P.items = []; P.past = []; P.future = []; P.savedItems = null; P.savedHtml = null; P.from = null; P.noRemember = false; P.sel = -1; setHTML(''); fit(); refresh();
    const box = $('.sbp-saved', P.el); if (box && !box.hidden) toggleSaved();
    focusStart();
  }
  function newNote() {
    if (!P) return; endTyping();
    if (!dirty()) { if (hasContent() || P.from) resetNote(); return; }
    saveDialog(true, () => resetNote(), null, { stay: true, verb: 'start a new note' });
  }
  function requestClose(after) {
    if (!P) { after && after(true); return; }
    endTyping();
    if (!dirty()) { closePad(); after && after(true); return; }
    saveDialog(true, after);
  }
  function closePad() {
    if (!P) return; endTyping(); closePop(); if (!dirty()) dropDraft(P.kid); if (!P.noRemember) rememberNote(); const p = P; P = null;
    (p.inerted || []).forEach(c => { c.inert = false; }); (p.inertFull || []).forEach(c => { c.inert = false; });
    p.listeners.forEach(f => f()); p.el.remove(); document.body.classList.remove('sb-padopen', 'sb-padfull');
    try { p.onClose && p.onClose(); } catch (e) {}
    const back = (p.opener && p.opener.isConnected) ? p.opener : document.getElementById('sbPad');
    if (back) try { back.focus(); } catch (e) {}
  }
  function guard(fn) { if (P) requestClose(ok => { if (ok) fn(); }); else fn(); }

  /* ---------------- saved notes list (drawer and My notes page) ---------------- */
  const noteTitle = n => { const t = (n.html || '').replace(/<\/(p|h2|h3|li)>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').split('\n').map(s => s.trim()).find(Boolean); return t ? t.slice(0, 80) : ''; };
  function renderList(box, o = {}) {
    const kid = SB.activeId(), canProfile = store.canProfile(kid), lists = { profile: canProfile ? store.list('profile', kid) : [], session: store.list('session', kid) };
    const section = (scope, title, empty) => {
      const list = lists[scope];
      return `<h3>${title}</h3>${list.length ? `<ul class="sbn-list">${list.map(n => `<li class="sbn" data-scope="${scope}" data-id="${esc(n.id)}"><canvas width="192" height="132" aria-hidden="true"></canvas>
        <div class="sbn-t"><b>${esc(noteTitle(n) || n.mod || 'Note')} &middot; ${esc(fmtWhen(n.at))}</b><span>${n.question ? esc(n.question) : esc(n.mod && noteTitle(n) ? n.mod : 'No question saved with this note.')}</span></div>
        <div class="sbn-bt"><button type="button" data-a="open">Open</button><button type="button" data-a="dl">Download</button><button type="button" class="del" data-a="del">Delete</button></div></li>`).join('')}</ul>` : `<p class="sbn-empty">${empty}</p>`}`;
    };
    box.innerHTML = (canProfile ? section('profile', 'My notes', 'No notes saved yet. Write on the notepad and choose Save, then Save to my notes.') : '<p class="sbn-empty">Add your name to keep notes in your profile. Notes you keep for this session are below.</p>')
      + (canProfile && !lists.session.length ? '' : section('session', 'This session only', 'Nothing kept for this session. These notes go away when this browser tab closes.'));
    const paint = () => box.querySelectorAll('.sbn').forEach(li => { const note = lists[li.dataset.scope].find(n => n.id === li.dataset.id); if (note) try { thumb($('canvas', li), note); } catch (e) {} });
    paint(); fontsReady().then(() => { if (box.isConnected) paint(); });
    box.querySelectorAll('.sbn').forEach(li => {
      const scope = li.dataset.scope, note = lists[scope].find(n => n.id === li.dataset.id); if (!note) return;
      $('[data-a="open"]', li).onclick = () => o.onOpen && o.onOpen(note, scope);
      $('[data-a="dl"]', li).onclick = () => downloadDialog(note);
      $('[data-a="del"]', li).onclick = () => SB.confirm({ title: 'Delete this note?', text: 'It will be gone for good.', ok: 'Delete', cancel: 'Keep it', danger: true }, () => { store.remove(scope, note.id, kid); renderList(box, o); });
    });
  }

  window.SBPad = {
    open, setQuestion, guard, isOpen, renderList, store, compose, requestClose, sanitize, cleanNote,
    download: note => downloadDialog(note || null),
    thumbnail: () => (P && hasContent()) ? compose({ live: true, scale: .3 }).toDataURL('image/png') : null,
    internals: { compose, offscreen, toBlob, download, fileBase, PAGE, PAPER, FONTS, SIZES, WORDFONT, blockTops, itemBounds, drawShapes, drawInk, fontsReady },
    debug: () => P && ({ items: P.items, html: P.html, text: P.ed.innerText, tool: P.tool, mode: P.mode, paper: P.paper, penOnly: P.penOnly, from: P.from, question: P.question, dirty: dirty(), full: P.full, view: P.view, sel: P.sel, range: P.range ? P.range.toString() : null, font: P.ed.dataset.ff, size: P.ed.dataset.sz })
  };
})();
