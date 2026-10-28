/* Study Buddy scratch pad: a notepad that sits beside a question so a child can work it out with a pen, finger, mouse or keyboard.

     SBPad.open({ question, source, opener, note, onClose })   open the pad (one at a time). question: plain text shown at the top and in the saved picture.
                                                       source: the module's name. note: open a saved note instead of a blank page.
     SBPad.setQuestion(text)                           the question changed (the drawing stays)
     SBPad.guard(fn)                                   closes the pad (asking to save first if there is writing), then calls fn
     SBPad.isOpen()
     SBPad.renderList(box, { onOpen })                 the saved-notes list (also used by the My notes page)
     SBPad.store                                       list / add / remove for 'session' and 'profile' notes

   Nothing is saved unless the child chooses to:
     device   a PNG picture downloads to the device (needs no profile)
     session  kept in this browser tab until it closes (sessionStorage)
     profile  kept on this device under the child's own profile (not for the Guest profile)
   The drawing is a list of strokes, not a flat picture, so a future notebook can reopen and edit it.
   The paper stays light in dark mode on purpose, like real paper. All other colors follow the theme tokens in sb.css. */
(function () {
  'use strict';
  if (window.SBPad) return;
  const SB = window.SB, esc = SB.esc;
  const NS = 'studybuddy.v1';
  const PAPER = { bg: '#fffdf5', line: '#b9c9de', grid: '#d3dfec', major: '#a9bdd6', LINE: 32, GRID: 24, MAJOR: 5, head: '#1d2733' };
  const COLORS = [['Black', '#1d2733'], ['Blue', '#1f5fbf'], ['Red', '#d23b2a'], ['Green', '#1f8a4c'], ['Orange', '#e8890c'], ['Purple', '#7a4cc2'], ['Pink', '#d9468f'], ['Brown', '#8b5a2b'], ['Yellow', '#f2c200']];
  const LIMITS = { profile: { notes: 25, bytes: 1200000 }, session: { notes: 15, bytes: 1200000 } };
  const IC = {
    pad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3" width="12.5" height="18" rx="2"/><path d="M7 8h5.5M7 12h3"/><path d="M18.2 8.3l2.6 2.6-6.6 6.6-3.3.7.7-3.3z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4.2L16 4.8l3.2 3.2L8.2 19z"/><path d="M13.5 7.3l3.2 3.2"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19l1.2-4L17 4.2 19.8 7 9 17.8z"/><path d="M5 19l4-1.2M14.5 6.7l2.8 2.8"/></svg>',
    marker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 14l7-9 4 3-7 9z"/><path d="M7 14l-2 5 5-1.5M15.5 6.5l2 1.5"/></svg>',
    highlighter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14l6-7 4 3.5-6 7z"/><path d="M9 14l-1 3.5 3 .5M4 21h9"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4c-5.5.8-9.5 4.8-10.5 9.2l2.8 2.8C16.7 15 20 11 20 4z"/><path d="M9.5 13.5C6.5 13.5 5 15.3 5 17.5 5 18.7 4 19.5 3 20c3.5 1 8.5.3 9.3-3.8"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 15.5l8-9 7 6.2-5 5.8H8.2z"/><path d="M10 18.5h10"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7V5h14v2M12 5v14M9 19h6"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-3" transform="translate(0 -3)"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5h-9a5 5 0 0 0 0 10h3" transform="translate(0 -3)"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>',
    lines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4h16v16H4zM4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 13V6.5a1.5 1.5 0 0 1 3 0V11M11.5 10.5V4.5a1.5 1.5 0 0 1 3 0V11M14.5 11V6.5a1.5 1.5 0 0 1 3 0V15c0 3.8-2.4 6-5.6 6-2.6 0-4.1-1.3-5.4-3.5L4.4 14.4a1.4 1.4 0 0 1 2.3-1.5L8.5 15"/></svg>'
  };
  const TOOLS = [['pen', 'Pen'], ['pencil', 'Pencil'], ['marker', 'Marker'], ['highlighter', 'Highlighter'], ['brush', 'Brush'], ['eraser', 'Eraser'], ['text', 'Type']];
  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const fmtWhen = at => { try { return new Date(at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };

  /* ---------------- saved notes ---------------- */
  const isHex = c => /^#[0-9a-f]{6}$/i.test(String(c));
  const fin = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v)) ? Math.max(lo, Math.min(hi, v)) : d;
  const PENS = { pen: 1, pencil: 1, marker: 1, highlighter: 1, brush: 1, erase: 1 };
  /* saved notes come from storage or a backup file, so every number and string is checked before it is drawn */
  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    if (it.k === 't') {
      if (typeof it.t !== 'string' || !it.t.trim() || !isHex(it.c)) return null;
      return { k: 't', c: it.c, s: fin(it.s, 8, 96, 20), x: fin(it.x, -5000, 5000, 0), y: fin(it.y, -5000, 5000, 0), t: it.t.slice(0, 2000) };
    }
    if (it.k !== 's' || !PENS[it.t] || !Array.isArray(it.p) || it.p.length < 3 || it.p.length % 3 || it.p.length > 60000) return null;
    if (!it.p.every(v => typeof v === 'number' && isFinite(v))) return null;
    return { k: 's', t: it.t, c: isHex(it.c) ? it.c : '#1d2733', w: fin(it.w, .5, 200, 3), p: it.p.map((v, i) => i % 3 === 2 ? fin(v, 0, 1, .5) : fin(v, -5000, 5000, 0)) };
  }
  function cleanNote(n) {
    if (!n || typeof n !== 'object' || typeof n.id !== 'string' || !Array.isArray(n.items) || n.items.length > 6000) return null;
    const items = n.items.map(cleanItem).filter(Boolean);
    return { id: n.id.slice(0, 24), at: fin(n.at, 0, 9e15, 0), question: typeof n.question === 'string' ? n.question.slice(0, 400) : '', mod: typeof n.mod === 'string' ? n.mod.slice(0, 80) : '',
      paper: n.paper === 'lines' || n.paper === 'graph' ? n.paper : 'blank', w: fin(n.w, 0, 4000, 0), h: fin(n.h, 0, 6000, 0), items };
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
      if (list.length > lim.notes || JSON.stringify(list).length > lim.bytes) return { ok: false, why: 'The notes are full. Delete an older note first.' };
      return this.write(scope, list, kid) ? { ok: true } : { ok: false, why: 'There was no room to save that note. Delete an older note first.' };
    },
    replace(scope, note, kid = SB.activeId()) {
      const list = this.list(scope, kid), i = list.findIndex(n => n.id === note.id);
      if (i < 0) return this.add(scope, note, kid);
      list[i] = note; if (JSON.stringify(list).length > LIMITS[scope].bytes) return { ok: false, why: 'The notes are full. Delete an older note first.' };
      return this.write(scope, list, kid) ? { ok: true } : { ok: false, why: 'There was no room to save that note. Delete an older note first.' };
    },
    remove(scope, id, kid = SB.activeId()) { this.write(scope, this.list(scope, kid).filter(n => n.id !== id), kid); }
  };

  /* ---------------- drawing ---------------- */
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
  function drawText(g, it, font) {
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
  function drawItems(g, items, font) { items.forEach(it => it.k === 't' ? drawText(g, it, font) : drawStroke(g, it)); }
  function measureText(it, font) {
    const c = measureText.c || (measureText.c = document.createElement('canvas').getContext('2d')); c.font = '600 ' + it.s + 'px ' + font;
    const lines = it.t.split('\n'); return { w: Math.max(...lines.map(l => c.measureText(l).width)), h: lines.length * it.s * 1.3 };
  }
  function bounds(items, font) {
    let mx = 0, my = 0;
    items.forEach(it => {
      if (it.k === 't') { const m = measureText(it, font); mx = Math.max(mx, it.x + m.w); my = Math.max(my, it.y + m.h); }
      else for (let i = 0; i < it.p.length; i += 3) { mx = Math.max(mx, it.p[i] + it.w / 2); my = Math.max(my, it.p[i + 1] + it.w / 2); }
    });
    return { w: mx, h: my };
  }
  function paperLines(g, paper, w, h, y0 = 0) {
    g.save(); g.lineWidth = 1;
    if (paper === 'lines') {
      g.strokeStyle = PAPER.line; g.beginPath();
      for (let y = y0 + PAPER.LINE; y < y0 + h; y += PAPER.LINE) { g.moveTo(0, y + .5); g.lineTo(w, y + .5); } g.stroke();
    } else if (paper === 'graph') {
      for (const major of [false, true]) {
        g.strokeStyle = major ? PAPER.major : PAPER.grid; g.beginPath();
        for (let x = 0, k = 0; x < w; x += PAPER.GRID, k++) if ((k % PAPER.MAJOR === 0) === major) { g.moveTo(x + .5, y0); g.lineTo(x + .5, y0 + h); }
        for (let y = 0, k = 0; y < h; y += PAPER.GRID, k++) if ((k % PAPER.MAJOR === 0) === major) { g.moveTo(0, y0 + y + .5); g.lineTo(w, y0 + y + .5); }
        g.stroke();
      }
    }
    g.restore();
  }
  function wrap(g, text, maxW) {
    const out = []; String(text).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); });
    return out;
  }
  /* one picture of a note: paper, writing, and (optionally) the question across the top */
  function compose(o) {
    const font = o.font || getComputedStyle(document.body).fontFamily || 'sans-serif', sc = o.scale || 1;
    const bd = bounds(o.items, font), W = Math.max(o.w || 0, Math.ceil(bd.w + 24), 320), H = Math.max(o.h || 0, Math.ceil(bd.h + 24), 220);
    let qlines = [], hh = 0; const tmp = document.createElement('canvas').getContext('2d');
    if (o.question) { tmp.font = '700 20px ' + font; qlines = wrap(tmp, o.question, W - 40); hh = qlines.length * 27 + 26; }
    const cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round((H + hh) * sc);
    const g = cv.getContext('2d'); g.scale(sc, sc);
    g.fillStyle = PAPER.bg; g.fillRect(0, 0, W, H + hh);
    paperLines(g, o.paper, W, H, hh);
    const ink = document.createElement('canvas'); ink.width = cv.width; ink.height = Math.round(H * sc);
    const ig = ink.getContext('2d'); ig.scale(sc, sc); drawItems(ig, o.items, font);
    g.drawImage(ink, 0, 0, ink.width, ink.height, 0, hh, W, H);
    if (hh) {
      g.fillStyle = PAPER.bg; g.fillRect(0, 0, W, hh); g.fillStyle = PAPER.head; g.font = '700 20px ' + font; g.textBaseline = 'top';
      qlines.forEach((ln, i) => g.fillText(ln, 20, 14 + i * 27));
      g.strokeStyle = PAPER.major; g.lineWidth = 2; g.beginPath(); g.moveTo(0, hh - 1); g.lineTo(W, hh - 1); g.stroke();
    }
    return cv;
  }
  const toBlob = cv => new Promise(res => cv.toBlob(res, 'image/png'));
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  const fileName = at => { const d = new Date(at || Date.now()), z = n => String(n).padStart(2, '0'); return 'scratch-note-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + '.png'; };
  function thumb(canvas, note) {
    const cv = compose({ items: note.items, w: note.w, h: note.h, paper: note.paper, scale: .4 }), g = canvas.getContext('2d');
    const r = Math.min(canvas.width / cv.width, canvas.height / cv.height), w = cv.width * r, h = cv.height * r;
    g.fillStyle = PAPER.bg; g.fillRect(0, 0, canvas.width, canvas.height); g.drawImage(cv, 0, 0, w, h);
  }

  /* ---------------- styles ---------------- */
  const CSS = `
  body.sb-padopen{padding-right:var(--padw)}
  .sbp{--padw:clamp(400px,40vw,620px);position:fixed;top:0;right:0;bottom:0;width:var(--padw);z-index:80;display:flex;flex-direction:column;gap:6px;padding:8px 10px 10px;background:var(--card);color:var(--ink);border-left:2px solid var(--line);box-shadow:-8px 0 24px rgba(0,0,0,.12);font-family:var(--font);font-size:15px;line-height:1.3;min-width:0;overflow-y:auto}
  body.sb-padopen{--padw:clamp(400px,40vw,620px)}
  @media (max-width:899px){.sbp{width:auto;left:0;border-left:0;box-shadow:none}body.sb-padopen{padding-right:0}}
  .sbp *{box-sizing:border-box}
  .sbp-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .sbp-head h2{margin:0 auto 0 0;font-size:19px;display:flex;align-items:center;gap:8px}
  .sbp-head h2 svg{width:22px;height:22px}
  .sbp button{font:inherit;color:inherit;cursor:pointer}
  .sbp-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--surface);color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:5px 10px;min-height:38px;font-weight:700;font-size:14px}
  .sbp-b svg{width:20px;height:20px;flex:0 0 auto}
  .sbp-b:hover:not(:disabled){border-color:var(--teal)}
  .sbp-b:disabled{opacity:.4;cursor:default}
  .sbp-b[aria-pressed="true"]{background:var(--navy);color:#fff;border-color:var(--navy-ink)}
  .sbp-b.pri{background:var(--navy);color:#fff;border-color:var(--navy)}
  .sbp-b:focus-visible,.sbp-sw:focus-visible,.sbp input:focus-visible{outline:3px solid var(--navy-ink);outline-offset:2px}
  .sbp-q{margin:0;color:var(--ink2);font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .sbp-q b{color:var(--ink)}
  .sbp-tools{display:flex;gap:4px;flex-wrap:wrap}
  .sbp-t{flex-direction:column;gap:0;padding:3px 4px;min-width:50px;font-size:12px;min-height:46px}
  .sbp-t svg{width:22px;height:22px}
  .sbp-row{display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center}
  .sbp-sws{display:flex;gap:5px;flex-wrap:wrap}
  .sbp-sw{width:28px;height:28px;border-radius:50%;border:3px solid var(--card);box-shadow:0 0 0 2px var(--line);padding:0;background:var(--c)}
  .sbp-sw[aria-pressed="true"]{box-shadow:0 0 0 3px var(--navy-ink)}
  .sbp-size{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px}
  .sbp-size input{width:110px;accent-color:var(--teal-fill)}
  .sbp-seg{display:inline-flex;border:2px solid var(--line);border-radius:12px;overflow:hidden}
  .sbp-seg button{border:0;background:var(--surface);padding:5px 10px;min-height:34px;font-weight:700;font-size:13px}
  .sbp-seg button[aria-pressed="true"]{background:var(--teal-fill);color:#fff}
  .sbp-stage{position:relative;flex:1 1 0;min-height:200px;border:2px solid var(--line);border-radius:14px;overflow:hidden;background-color:${PAPER.bg};touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  .sbp-stage.lines{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent ${PAPER.LINE - 1}px,${PAPER.line} ${PAPER.LINE - 1}px,${PAPER.line} ${PAPER.LINE}px);background-position:0 0}
  .sbp-stage.graph{background-image:linear-gradient(to right,${PAPER.major} 1px,transparent 1px),linear-gradient(to bottom,${PAPER.major} 1px,transparent 1px),linear-gradient(to right,${PAPER.grid} 1px,transparent 1px),linear-gradient(to bottom,${PAPER.grid} 1px,transparent 1px);background-size:${PAPER.GRID * PAPER.MAJOR}px ${PAPER.GRID * PAPER.MAJOR}px,${PAPER.GRID * PAPER.MAJOR}px ${PAPER.GRID * PAPER.MAJOR}px,${PAPER.GRID}px ${PAPER.GRID}px,${PAPER.GRID}px ${PAPER.GRID}px}
  .sbp-ink{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;display:block}
  .sbp-ring{position:absolute;pointer-events:none;border:2px solid #1d2733;border-radius:50%;background:rgba(255,255,255,.35);transform:translate(-50%,-50%);display:none}
  .sbp-ta{position:absolute;margin:0;padding:0;border:0;border-bottom:2px dashed var(--teal-fill);background:rgba(255,253,245,.6);outline:0;resize:none;overflow:hidden;min-width:120px;max-width:calc(100% - 8px);white-space:pre-wrap;font-weight:600;line-height:1.3}
  .sbp-saved{flex:1 1 0;min-height:0;overflow:auto;padding:4px 2px}
  .sbp.showing-saved>.sbp-tools,.sbp.showing-saved>.sbp-row,.sbp.showing-saved>.sbp-stage,.sbp.showing-saved>.sbp-q{display:none}
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
  .sb-dlg label.sbp-chk{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-weight:700;font-size:15px;cursor:pointer}
  .sb-dlg input.sbp-cb{width:22px;height:22px;padding:0;margin:0;letter-spacing:normal;font-size:16px;accent-color:#0e7468;flex:0 0 auto}
  .sb-dlg .sbp-hint{font-size:14px;margin:0 0 8px}
  @media (max-width:520px){.sbp-b span.l{display:none}.sbp-size input{width:90px}.sbp-t span{display:none}.sbp-t{min-width:44px;min-height:44px}}
  html.sb-large .sbp{font-size:14px}
  `;
  function injectCSS() { if (document.getElementById('sbp-css')) return; const s = document.createElement('style'); s.id = 'sbp-css'; s.textContent = CSS; document.head.appendChild(s); }
  injectCSS();

  /* ---------------- the pad ---------------- */
  let P = null;
  let penSeen = false, penOnlyChoice = null;   // once a stylus touches any pad this visit, finger touches stop drawing (unless the child turns Pen only off)
  const draftKey = kid => NS + '.paddraft.' + kid;
  const isOpen = () => !!P;
  const hasInk = items => items.some(i => i.k === 't' || i.t !== 'erase');
  const dirty = () => !!P && hasInk(P.items) && P.items !== P.saved;

  function open(o = {}) {
    if (P) { if (o.question != null) setQuestion(o.question); if (o.note) { P.onClose = o.onClose || P.onClose; loadNote(o.note, false, o.scope); return; } const f = $('.sbp-t[aria-pressed="true"]', P.el) || $('.sbp-b', P.el); if (f) f.focus(); return; }
    injectCSS();
    const el = document.createElement('div'); el.className = 'sbp'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Scratch pad');
    P = {
      el, items: [], past: [], future: [], saved: null, tool: 'pen', color: COLORS[0][1], size: 4, erMode: 'area', paper: 'blank', penOnly: penOnlyChoice != null ? penOnlyChoice : penSeen, from: null,
      kid: SB.activeId(), question: '', source: o.source || '', font: getComputedStyle(document.body).fontFamily || 'sans-serif', cur: null, editor: null, opener: o.opener || null, onClose: o.onClose || null, listeners: []
    };
    el.innerHTML = `
      <div class="sbp-head"><h2>${IC.pad}Scratch pad</h2>
        <button type="button" class="sbp-b" data-a="notes" aria-expanded="false">${IC.notes}<span class="l">Saved notes</span></button>
        <button type="button" class="sbp-b pri" data-a="save">${IC.save}<span class="l">Save</span></button>
        <button type="button" class="sbp-b" data-a="close" aria-label="Close the scratch pad">${IC.close}</button></div>
      <p class="sbp-q" hidden></p>
      <div class="sbp-tools" role="toolbar" aria-label="Pens and tools">${TOOLS.map(([id, n]) => `<button type="button" class="sbp-b sbp-t" data-tool="${id}" aria-pressed="${id === 'pen'}" aria-label="${n}">${IC[id]}<span>${n}</span></button>`).join('')}</div>
      <div class="sbp-row"><div class="sbp-sws" role="group" aria-label="Color">${COLORS.map(([n, c], i) => `<button type="button" class="sbp-sw" data-c="${c}" style="--c:${c}" aria-label="${n}" aria-pressed="${i === 0}"></button>`).join('')}</div>
        <label class="sbp-size">Size <input type="range" min="1" max="20" value="4" aria-label="Pen size"></label>
        <span class="sbp-seg" role="group" aria-label="Eraser type" hidden><button type="button" data-er="area" aria-pressed="true">Rub out</button><button type="button" data-er="stroke" aria-pressed="false">Whole line</button></span></div>
      <div class="sbp-row">
        <button type="button" class="sbp-b" data-a="undo" disabled>${IC.undo}<span class="l">Undo</span></button>
        <button type="button" class="sbp-b" data-a="redo" disabled>${IC.redo}<span class="l">Redo</span></button>
        <button type="button" class="sbp-b" data-a="clear" disabled>${IC.trash}<span class="l">Erase all</span></button>
        <button type="button" class="sbp-b" data-paper="lines" aria-pressed="false">${IC.lines}<span class="l">Lines</span></button>
        <button type="button" class="sbp-b" data-paper="graph" aria-pressed="false">${IC.grid}<span class="l">Graph</span></button>
        <button type="button" class="sbp-b" data-a="penonly" aria-pressed="false" title="Ignore finger touches, so a resting hand does not draw">${IC.hand}<span class="l">Pen only</span></button></div>
      <div class="sbp-stage"><canvas class="sbp-ink" role="img" aria-label="Drawing area. Use the Type tool to write with the keyboard."></canvas><div class="sbp-ring"></div></div>
      <div class="sbp-saved" hidden></div>`;
    document.body.appendChild(el); document.body.classList.add('sb-padopen');
    P.stage = $('.sbp-stage', el); P.cv = $('canvas', el); P.g = P.cv.getContext('2d'); P.ring = $('.sbp-ring', el);
    wire();
    setQuestion(o.question || '');
    if (o.note) loadNote(o.note, true, o.scope);
    else offerDraft();
    fit(); refresh();
    if (window.matchMedia && matchMedia('(max-width:899px)').matches) { [...document.body.children].forEach(c => { if (c !== el && !c.classList.contains('sb-ov') && !c.inert) { c.inert = true; P.inerted = (P.inerted || []).concat(c); } }); }
    const first = $('.sbp-t[aria-pressed="true"]', el); if (first) first.focus();
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); P.listeners.push(() => t.removeEventListener(ev, fn, opt)); };
    on(document, 'keydown', onKey);
    on(window, 'beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
    on(document, 'click', guardLinks, true);
    on(window, 'hashchange', e => {
      if (!P) return; if (P.ignoreHash) { P.ignoreHash = false; return; }
      if (!dirty()) return closePad();
      const back = e.oldURL;      // the page already changed: if the child keeps working, go back to the page they were on
      saveDialog(true, null, () => { if (P && back) { P.ignoreHash = true; location.replace(back); } });
    });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => fit()); ro.observe(P.stage); P.listeners.push(() => ro.disconnect()); } else on(window, 'resize', fit);
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
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '');
    if (e.key === 'Escape' && !document.querySelector('.sb-ov') && !(e.target && e.target.classList && e.target.classList.contains('sbp-ta'))) { e.preventDefault(); requestClose(); return; }
    if ((e.ctrlKey || e.metaKey) && !inField && !document.querySelector('.sb-ov')) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); redo(); }
    }
  }
  function setQuestion(q) {
    if (!P) return; P.question = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    const p = $('.sbp-q', P.el); p.hidden = !P.question; p.innerHTML = P.question ? '<b>Question:</b> ' + esc(P.question) : '';
  }

  /* ---- history: every change swaps in a new list, so undo and redo just swap back ---- */
  function commit(next) {
    P.past.push(P.items); if (P.past.length > 200) P.past.shift();
    P.items = next; P.future = []; refresh(); saveDraft();
  }
  function undo() { if (!P) return; commitEditor(); if (!P.past.length) return; P.future.push(P.items); P.items = P.past.pop(); render(); refresh(); saveDraft(); }
  function redo() { if (!P) return; commitEditor(); if (!P.future.length) return; P.past.push(P.items); P.items = P.future.pop(); render(); refresh(); saveDraft(); }
  /* iPhone and iPad give no warning when a tab is closed or reloaded, so unsaved writing is kept as a draft for this tab and offered back */
  function saveDraft() {
    if (!P) return;
    try { if (dirty()) sessionStorage.setItem(draftKey(P.kid), JSON.stringify({ at: Date.now(), question: P.question, mod: P.source, paper: P.paper, items: P.items })); else sessionStorage.removeItem(draftKey(P.kid)); } catch (e) {}
  }
  function dropDraft(kid) { try { sessionStorage.removeItem(draftKey(kid)); } catch (e) {} }
  function offerDraft() {
    let d = null; try { d = JSON.parse(sessionStorage.getItem(draftKey(P.kid)) || 'null'); } catch (e) {}
    const n = d && cleanNote(Object.assign({ id: 'draft' }, d));
    if (!n || !hasInk(n.items)) return;
    SB.confirm({ title: 'Bring back your writing?', text: 'The scratch pad closed before your last writing was saved' + (n.mod ? ' (' + n.mod + ')' : '') + '.', ok: 'Bring it back', cancel: 'Start fresh' },
      () => { if (!P) return; P.items = n.items; P.past = []; P.future = []; P.saved = null; P.paper = n.paper; render(); refresh(); },
      () => { if (P) dropDraft(P.kid); });
  }
  function refresh() {
    if (!P) return; const el = P.el;
    $('[data-a="undo"]', el).disabled = !P.past.length; $('[data-a="redo"]', el).disabled = !P.future.length; $('[data-a="clear"]', el).disabled = !P.items.length;
    { const a = document.activeElement; if (a && a.disabled && el.contains(a)) { const f = $('.sbp-t[aria-pressed="true"]', el); if (f) f.focus(); } }
    $('.sbp-seg', el).hidden = P.tool !== 'eraser';
    el.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === P.tool));
    el.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === P.color));
    el.querySelectorAll('[data-er]').forEach(b => b.setAttribute('aria-pressed', b.dataset.er === P.erMode));
    el.querySelectorAll('[data-paper]').forEach(b => b.setAttribute('aria-pressed', b.dataset.paper === P.paper));
    $('[data-a="penonly"]', el).setAttribute('aria-pressed', P.penOnly);
    P.stage.classList.toggle('lines', P.paper === 'lines'); P.stage.classList.toggle('graph', P.paper === 'graph');
    P.cv.style.cursor = P.tool === 'text' ? 'text' : 'crosshair';
  }
  function fit() {
    if (!P) return; const st = P.stage, w = st.clientWidth, h = st.clientHeight; if (!w || !h) return;
    const r = st.getBoundingClientRect(), z = (r.width / st.offsetWidth) || 1, ratio = (window.devicePixelRatio || 1) * z;
    P.cv.width = Math.round(w * ratio); P.cv.height = Math.round(h * ratio); P.g.setTransform(ratio, 0, 0, ratio, 0, 0); P.w = w; P.h = h; render();
  }
  function render() { if (!P) return; P.g.clearRect(0, 0, P.w || 9999, P.h || 9999); drawItems(P.g, P.items, P.font); if (P.cur) drawStroke(P.g, P.cur); }

  /* ---- pointer input (mouse, finger, and pen with pressure) ---- */
  const pen = () => P.tool === 'eraser' ? (P.erMode === 'stroke' ? 'estroke' : 'erase') : P.tool;
  function point(e) {
    const r = P.cv.getBoundingClientRect(), sx = (r.width / P.cv.offsetWidth) || 1, sy = (r.height / P.cv.offsetHeight) || 1;
    return [Math.round((e.clientX - r.left) / sx * 10) / 10, Math.round((e.clientY - r.top) / sy * 10) / 10];
  }
  function pressure(e, prev) {
    if (e.pointerType === 'pen') return Math.round((e.pressure || .5) * 10) / 10;
    if (P.tool !== 'brush' || !prev) return .5;                         // mouse and finger: the brush gets thinner when you move fast
    const dt = Math.max(1, e.timeStamp - prev.t), v = Math.hypot(e.clientX - prev.cx, e.clientY - prev.cy) / dt;
    const q = Math.max(.2, Math.min(.75, .75 - v * .35)); return Math.round((prev.q * .6 + q * .4) * 10) / 10;
  }
  function hits(it, x, y, r) {
    if (it.k === 't') { const m = measureText(it, P.font); return x > it.x - r && x < it.x + m.w + r && y > it.y - r && y < it.y + m.h + r; }
    if (it.t === 'erase') return false;
    const n = it.p.length / 3, rr = r + it.w / 2;
    if (n === 1) return Math.hypot(x - it.p[0], y - it.p[1]) <= rr;
    for (let i = 1; i < n; i++) {
      const ax = it.p[(i - 1) * 3], ay = it.p[(i - 1) * 3 + 1], bx = it.p[i * 3], by = it.p[i * 3 + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= rr) return true;
    }
    return false;
  }
  function wire() {
    const el = P.el, cv = P.cv;
    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
      commitEditor(); P.tool = b.dataset.tool; refresh();
      if (P.tool === 'text') { const ts = P.items.filter(i => i.k === 't'); const y = ts.length ? Math.max(...ts.map(i => i.y + measureText(i, P.font).h)) + 10 : 18; openEditor(18, Math.min(y, Math.max(18, P.h - 60))); }
    });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { P.color = b.dataset.c; if (P.editor) { P.editor.style.color = P.color; P.editorAt[3] = P.color; } refresh(); });
    el.querySelectorAll('[data-er]').forEach(b => b.onclick = () => { P.erMode = b.dataset.er; refresh(); });
    $('input[type="range"]', el).oninput = e => { P.size = +e.target.value; if (P.editor) { P.editor.style.fontSize = textSize() + 'px'; P.editorAt[2] = textSize(); } };
    el.querySelectorAll('[data-paper]').forEach(b => b.onclick = () => { P.paper = P.paper === b.dataset.paper ? 'blank' : b.dataset.paper; refresh(); });
    $('[data-a="penonly"]', el).onclick = () => { P.penOnly = penOnlyChoice = !P.penOnly; refresh(); SB.toast(P.penOnly ? 'Pen only: finger touches will not draw.' : 'Pen only is off.'); };
    $('[data-a="undo"]', el).onclick = undo; $('[data-a="redo"]', el).onclick = redo;
    $('[data-a="clear"]', el).onclick = () => { commitEditor(); if (!P.items.length) return; SB.confirm({ title: 'Erase everything?', text: 'This clears the whole page. You can press Undo to get it back.', ok: 'Erase everything', cancel: 'Keep it', danger: true }, () => { commit([]); render(); }); };
    $('[data-a="close"]', el).onclick = () => requestClose();
    $('[data-a="save"]', el).onclick = () => { commitEditor(); saveDialog(false); };
    $('[data-a="notes"]', el).onclick = toggleSaved;

    let last = null;
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'pen' && !penSeen) {
        penSeen = true;
        if (penOnlyChoice == null && !P.penOnly) { P.penOnly = true; refresh(); SB.toast('Pen found. Finger touches will not draw. Turn off Pen only to use a finger.'); }
      }
      if (P.penOnly && e.pointerType === 'touch') return;
      if (e.pointerType === 'pen' && (P.cur || P.estroke) && P.curType === 'touch') { P.cur = null; P.estroke = null; P.pid = null; render(); }   // a resting palm started first: the pen wins
      if (P.cur || P.estroke) return;
      const [x, y] = point(e);
      if (P.tool === 'text') { e.preventDefault(); commitEditor(); openEditor(x, y); return; }
      commitEditor(); e.preventDefault();
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
      if (P.tool === 'eraser' && e.pointerType !== 'touch') { const [x, y] = point(e), d = P.erMode === 'stroke' ? (P.size * 1.5 + 6) * 2 : widthFor('erase', P.size); Object.assign(P.ring.style, { display: 'block', left: x + 'px', top: y + 'px', width: d + 'px', height: d + 'px' }); } else P.ring.style.display = 'none';
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
      if (!P || e.pointerId !== P.pid) return; P.pid = null;
      if (P.estroke) { const E = P.estroke; P.estroke = null; if (E.items !== P.items) commit(E.items); render(); return; }
      if (!P.cur) return; const s = P.cur; P.cur = null; commit([...P.items, s]); render();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  /* The whole-line eraser: while dragging, the page shows the trimmed list; the history entry is made when the finger lifts. */
  function eraseAt(x, y) {
    const E = P.estroke, keep = E.items.filter(it => !hits(it, x, y, E.r));
    if (keep.length !== E.items.length) { E.items = keep; P.g.clearRect(0, 0, P.w, P.h); drawItems(P.g, keep, P.font); }
  }

  /* ---- typing ---- */
  const textSize = () => Math.round(14 + P.size * 1.4);
  function openEditor(x, y) {
    commitEditor();
    const ta = document.createElement('textarea'); ta.className = 'sbp-ta'; ta.rows = 1; ta.setAttribute('aria-label', 'Type your note here. Press Escape when you are done.'); ta.spellcheck = false;
    ta.style.left = x + 'px'; ta.style.top = y + 'px'; ta.style.color = P.color; ta.style.fontSize = textSize() + 'px'; ta.style.fontFamily = P.font; ta.style.width = Math.max(140, Math.min(260, P.w - x - 8)) + 'px';
    const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; ta.addEventListener('input', grow);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) { e.preventDefault(); e.stopPropagation(); const b = P && $('.sbp-t[data-tool="text"]', P.el); commitEditor(); if (b) b.focus(); }
    });
    ta.addEventListener('blur', () => setTimeout(() => { if (P && P.editor === ta) commitEditor(); }, 0));
    P.stage.appendChild(ta); P.editor = ta; P.editorAt = [x, y, textSize(), P.color]; grow(); ta.focus();
    requestAnimationFrame(() => { if (P && P.editor === ta && document.activeElement !== ta) ta.focus(); });
  }
  /* long typed lines wrap the way the text box showed them, because the saved text is drawn without a box */
  function wrapText(text, fs, maxW) {
    const g = measureText.c || (measureText.c = document.createElement('canvas').getContext('2d')); g.font = '600 ' + fs + 'px ' + P.font;
    const out = [];
    text.split('\n').forEach(par => { let line = ''; par.split(/(\s+)/).forEach(w => { const t = line + w; if (line && g.measureText(t.trimEnd()).width > maxW) { out.push(line.trimEnd()); line = w.trim() ? w : ''; } else line = t; }); out.push(line.trimEnd()); });
    return out.join('\n');
  }
  function commitEditor() {
    if (!P || !P.editor) return; const ta = P.editor, at = P.editorAt; P.editor = null;
    const raw = ta.value.replace(/\s+$/g, ''), maxW = ta.clientWidth || 200; ta.remove();
    if (raw.trim()) { commit([...P.items, { k: 't', c: at[3], s: at[2], x: at[0], y: at[1], t: wrapText(raw, at[2], maxW).slice(0, 2000) }]); render(); }
  }

  /* ---- saved notes drawer ---- */
  function toggleSaved() {
    const box = $('.sbp-saved', P.el), btn = $('[data-a="notes"]', P.el);
    const set = on => { box.hidden = !on; P.el.classList.toggle('showing-saved', on); btn.setAttribute('aria-expanded', String(on)); btn.querySelector('.l').textContent = on ? 'Back to pad' : 'Saved notes'; if (!on) fit(); };
    if (!box.hidden) return set(false);
    commitEditor(); set(true);
    renderList(box, { onOpen: (note, scope) => loadNote(note, false, scope) });
  }
  function loadNote(note, quiet, scope) {
    const go = () => {
      P.items = JSON.parse(JSON.stringify(note.items)); P.past = []; P.future = []; P.saved = P.items; P.from = scope && note.id ? { scope, id: note.id } : null; P.paper = ['lines', 'graph'].includes(note.paper) ? note.paper : 'blank';
      if (note.question && !P.question) setQuestion(note.question);
      const box = $('.sbp-saved', P.el); if (!box.hidden) toggleSaved();
      render(); refresh();
    };
    if (!quiet && dirty()) SB.confirm({ title: 'Open this note?', text: 'What is on the pad now will be replaced. Save it first if you want to keep it.', ok: 'Open the note', cancel: 'Keep working' }, go); else go();
  }

  /* ---- saving and closing ---- */
  function snapshotNote() {
    return { id: uid(), at: Date.now(), question: P.question, mod: P.source, paper: P.paper, w: P.w, h: P.h, items: P.items };
  }
  async function saveTo(kind, withQuestion) {
    if (!P) return false; const note = snapshotNote();
    if (kind === 'device') {
      try { const blob = await toBlob(compose({ items: note.items, w: note.w, h: note.h, paper: note.paper, question: withQuestion ? note.question : '', font: P.font, scale: 2 })); download(blob, fileName(note.at)); } catch (e) { SB.toast('Could not make the picture.'); return false; }
      if (P) { P.saved = P.items; dropDraft(P.kid); } SB.toast('Picture saved to this device.'); return true;
    }
    const same = P.from && P.from.scope === kind;
    if (same) { note.id = P.from.id; }
    const r = same ? store.replace(kind, note, P.kid) : store.add(kind, note, P.kid);
    if (!r.ok) { SB.toast(r.why); return false; }
    P.saved = P.items; P.from = { scope: kind, id: note.id }; dropDraft(P.kid);
    SB.toast(same ? 'Note updated.' : kind === 'profile' ? 'Saved to your notes.' : 'Kept for this session.'); return true;
  }
  /* The save choices. From Save the pad stays open; from closing, a choice (or Don't save) closes it. */
  function saveDialog(closing, after, onKeep) {
    if (!P) return;
    if (!hasInk(P.items)) { SB.toast('There is nothing to save yet.'); return; }
    const canProfile = store.canProfile(P.kid);
    SB.dialog(`<h3>${closing ? 'Save this note?' : 'Save this note'}</h3>
      <p>${closing ? 'You have writing on the scratch pad. It will be gone when you close it unless you save it.' : 'Choose where to keep it.'}</p>
      ${P.question ? '<label class="sbp-chk"><input type="checkbox" class="sbp-cb" id="sbpQ" checked>Put the question at the top of the picture</label>' : ''}
      <div class="sbp-choices">
        <button type="button" class="sb-btn" data-k="device">Save a picture to this device</button>
        ${canProfile ? '<button type="button" class="sb-btn" data-k="profile">Save to my notes (my profile)</button>' : ''}
        <button type="button" class="sb-btn" data-k="session">Keep for this session only</button></div>
      ${canProfile ? '' : '<p class="sbp-hint">Add your name to keep notes in your profile.</p>'}
      <div class="sb-row">${closing ? '<button type="button" class="sb-btn warn" data-k="discard">Do not save</button>' : ''}<button type="button" class="sb-btn ghost" data-k="keep">${closing ? 'Keep working' : 'Cancel'}</button></div>`, (box, close, ov) => {
      ov._cancel = () => { close(); onKeep && onKeep(); };
      box.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        const k = b.dataset.k, withQ = !!(box.querySelector('#sbpQ') || {}).checked;
        if (k === 'keep') { close(); onKeep && onKeep(); return; }
        if (k === 'discard') { close(); if (P) dropDraft(P.kid); closePad(); after && after(true); return; }
        box.querySelectorAll('button').forEach(x => x.disabled = true);
        const ok = await saveTo(k, withQ); close();
        if (ok && closing) { closePad(); after && after(true); } else if (!ok && closing) onKeep && onKeep();
      });
    });
  }
  function requestClose(after) {
    if (!P) { after && after(true); return; }
    commitEditor();
    if (!dirty()) { closePad(); after && after(true); return; }
    saveDialog(true, after);
  }
  function closePad() {
    if (!P) return; commitEditor(); if (!dirty()) dropDraft(P.kid); const p = P; P = null;
    (p.inerted || []).forEach(c => { c.inert = false; });
    p.listeners.forEach(f => f()); p.el.remove(); document.body.classList.remove('sb-padopen');
    try { p.onClose && p.onClose(); } catch (e) {}
    const back = (p.opener && p.opener.isConnected) ? p.opener : document.getElementById('sbPad');
    if (back) try { back.focus(); } catch (e) {}
  }
  function guard(fn) { if (P) requestClose(ok => { if (ok) fn(); }); else fn(); }

  /* ---------------- saved notes list (drawer and My notes page) ---------------- */
  function renderList(box, o = {}) {
    const kid = SB.activeId(), canProfile = store.canProfile(kid), lists = { profile: canProfile ? store.list('profile', kid) : [], session: store.list('session', kid) };
    const section = (scope, title, empty) => {
      const list = lists[scope];
      return `<h3>${title}</h3>${list.length ? `<ul class="sbn-list">${list.map(n => `<li class="sbn" data-scope="${scope}" data-id="${esc(n.id)}"><canvas width="192" height="132" aria-hidden="true"></canvas>
        <div class="sbn-t"><b>${esc(n.mod || 'Scratch note')} &middot; ${esc(fmtWhen(n.at))}</b><span>${n.question ? esc(n.question) : 'No question saved with this note.'}</span></div>
        <div class="sbn-bt"><button type="button" data-a="open">Open</button><button type="button" data-a="dl">Download</button><button type="button" class="del" data-a="del">Delete</button></div></li>`).join('')}</ul>` : `<p class="sbn-empty">${empty}</p>`}`;
    };
    box.innerHTML = (canProfile ? section('profile', 'My notes', 'No notes saved yet. When you close the scratch pad with writing on it, choose Save to my notes.') : '<p class="sbn-empty">Add your name to keep notes in your profile. Notes you keep for this session are below.</p>')
      + section('session', 'This session only', 'Nothing kept for this session. These notes go away when this browser tab closes.');
    box.querySelectorAll('.sbn').forEach(li => {
      const scope = li.dataset.scope, note = lists[scope].find(n => n.id === li.dataset.id); if (!note) return;
      try { thumb($('canvas', li), note); } catch (e) {}
      $('[data-a="open"]', li).onclick = () => o.onOpen && o.onOpen(note, scope);
      $('[data-a="dl"]', li).onclick = async () => { const blob = await toBlob(compose({ items: note.items, w: note.w, h: note.h, paper: note.paper, question: note.question, scale: 2 })); download(blob, fileName(note.at)); };
      $('[data-a="del"]', li).onclick = () => SB.confirm({ title: 'Delete this note?', text: 'It will be gone for good.', ok: 'Delete', cancel: 'Keep it', danger: true }, () => { store.remove(scope, note.id, kid); renderList(box, o); });
    });
  }

  window.SBPad = { open, setQuestion, guard, isOpen, renderList, store, compose, requestClose, debug: () => P && ({ items: P.items, tool: P.tool, paper: P.paper, penOnly: P.penOnly, from: P.from, question: P.question, dirty: dirty() }) };
})();
