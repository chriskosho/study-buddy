/* Handwriting: a tracing pad for stylus, finger, or mouse, and the four tools that use it.
   Fonts: "SB Cursive" (Playwrite US Trad, traditional US school cursive) and "SB Print" (Andika, a print font
   with the simple one-story a). Both live in shared/fonts and are declared in hw.css. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle, starsHTML, setMsg } = SBT;
  const esc = SB.esc;
  const FONTS = { cursive: '"SB Cursive"', print: '"SB Print"' };
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const fontsReady = Promise.all([document.fonts.load('100px "SB Cursive"', 'Aa'), document.fonts.load('100px "SB Print"', 'Aa')]).catch(() => {});

  /* ---------- font metrics, measured once per style ---------- */
  const metricCache = {};
  function metrics(style) {
    if (metricCache[style]) return metricCache[style];
    const c = document.createElement('canvas').getContext('2d'); c.font = `100px ${FONTS[style]}`;
    const m = t => c.measureText(t);
    return metricCache[style] = {           // per 100px of font size
      asc: Math.max(m('H').actualBoundingBoxAscent, m('l').actualBoundingBoxAscent, m('d').actualBoundingBoxAscent),
      cap: m('H').actualBoundingBoxAscent, x: m('x').actualBoundingBoxAscent,
      desc: Math.max(m('g').actualBoundingBoxDescent, m('y').actualBoundingBoxDescent, m('j').actualBoundingBoxDescent),
      w: t => m(t).width
    };
  }

  /* ---------- the pad ---------- */
  function Pad(host, opt) {
    host.innerHTML = '<canvas class="hw-bg" aria-hidden="true"></canvas><canvas class="hw-demo" aria-hidden="true"></canvas><canvas class="hw-ink" aria-label="Writing area. Trace the gray letters."></canvas>';
    const bg = $('.hw-bg', host), demoC = $('.hw-demo', host), ink = $('.hw-ink', host);
    const P = { text: '', style: 'cursive', strokes: [], cur: null, layout: null, penSeen: false, size: opt.size || 'medium', color: opt.color || 'ink', fingerToo: false, onPen: opt.onPen };
    let W = 0, H = 0, dpr = 1;
    const widths = { thin: 0.035, medium: 0.05, thick: 0.07 };
    const inkColor = () => P.color === 'ink' ? css('--hw-ink') : P.color;

    function layoutFor(text, style) {
      const M = metrics(style), maxF = opt.maxFont || 220, minF = opt.minFont || 56, maxLines = innerWidth <= 760 ? 3 : 2;
      const usable = W * 0.92;
      const rowH = F => (M.asc + M.desc) * F / 100 * 1.32;
      for (let F = maxF; F >= minF; F -= 4) {
        const lines = []; let line = '';
        if (!text) { lines.push(''); }
        else for (const word of text.split(' ')) {
          const tryLine = line ? line + ' ' + word : word;
          if (M.w(tryLine) * F / 100 <= usable || !line) line = tryLine; else { lines.push(line); line = word; }
        }
        if (line) lines.push(line);
        const tooWide = lines.some(l => M.w(l) * F / 100 > usable);
        if (!tooWide && lines.length <= maxLines && rowH(F) * lines.length <= H) return { F, lines, rowH: rowH(F), M };
      }
      const F = minF; return { F, lines: [text], rowH: rowH(F), M };
    }

    function drawPaper(ctx, L, guide = true, missed = null) {
      ctx.clearRect(0, 0, W, H);
      const { F, lines, rowH, M } = L, total = rowH * lines.length, top = (H - total) / 2;
      const ascPx = M.asc * F / 100, descPx = M.desc * F / 100, xPx = M.x * F / 100;
      lines.forEach((line, i) => {
        const base = top + i * rowH + (rowH - ascPx - descPx) / 2 + ascPx;
        const rule = (y, dash, color, w) => { ctx.beginPath(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.moveTo(10, y); ctx.lineTo(W - 10, y); ctx.stroke(); };
        rule(base - M.cap * F / 100, [], css('--hw-rule'), 2);
        rule(base - xPx, [10, 8], css('--hw-mid'), 2);
        rule(base, [], css('--hw-base'), 2.5);
        rule(base + descPx, [3, 7], css('--hw-rule'), 2);
        ctx.setLineDash([]);
        if (guide && line) {
          ctx.font = `${F}px ${FONTS[P.style]}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
          const x = (W - M.w(line) * F / 100) / 2;
          ctx.fillStyle = css('--hw-guide'); ctx.strokeStyle = css('--hw-guide'); ctx.lineWidth = F * 0.035; ctx.lineJoin = 'round';
          ctx.strokeText(line, x, base); ctx.fillText(line, x, base);
        }
      });
      if (missed) { ctx.fillStyle = css('--hw-missed'); missed.forEach(([x, y, s]) => ctx.fillRect(x, y, s, s)); }
    }

    function resize() {
      const r = host.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(200, r.width); H = Math.max(160, r.height);
      [bg, demoC, ink].forEach(c => { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
      P.layout = layoutFor(P.text, P.style); drawPaper(bg.getContext('2d'), P.layout, opt.guide !== false); redrawInk();
    }

    /* strokes are stored relative to the pad width, so they survive a resize or rotation */
    function drawStroke(ctx, s, scale = 1) {
      const pts = s.pts; if (!pts.length) return;
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0].x * W * scale, pts[0].y * W * scale, s.w * W * scale * (pts[0].p || 1) / 2, 0, 7); ctx.fill(); return; }
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        ctx.lineWidth = s.w * W * scale * ((a.p + b.p) / 2 || 1);
        ctx.beginPath(); ctx.moveTo(a.x * W * scale, a.y * W * scale); ctx.lineTo(b.x * W * scale, b.y * W * scale); ctx.stroke();
      }
    }
    function redrawInk() { const c = ink.getContext('2d'); c.clearRect(0, 0, W, H); P.strokes.forEach(s => drawStroke(c, s)); }
    const strokeW = () => (P.layout ? P.layout.F : 120) * widths[P.size] / W;
    const pressure = e => e.pointerType === 'pen' && e.pressure > 0 ? 0.55 + e.pressure * 0.9 : 1;

    ink.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen' && !P.penSeen) { P.penSeen = true; P.onPen && P.onPen(); }
      if (e.pointerType === 'touch' && P.penSeen && !P.fingerToo) return;      // palm rejection once a stylus is used
      if (e.button > 0) return;
      e.preventDefault(); try { ink.setPointerCapture(e.pointerId); } catch (er) {}
      const r = ink.getBoundingClientRect();
      P.cur = { id: e.pointerId, color: inkColor(), w: strokeW(), pts: [{ x: (e.clientX - r.left) / W, y: (e.clientY - r.top) / W, p: pressure(e) }] };
      P.strokes.push(P.cur); drawStroke(ink.getContext('2d'), P.cur);
    });
    ink.addEventListener('pointermove', e => {
      if (!P.cur || e.pointerId !== P.cur.id) return;
      const r = ink.getBoundingClientRect(), c = ink.getContext('2d');
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const pt = { x: (ev.clientX - r.left) / W, y: (ev.clientY - r.top) / W, p: pressure(ev) }, last = P.cur.pts[P.cur.pts.length - 1];
        P.cur.pts.push(pt); drawStroke(c, { ...P.cur, pts: [last, pt] });
      }
    });
    const up = e => { if (P.cur && e.pointerId === P.cur.id) { P.cur = null; opt.onStroke && opt.onStroke(); } };
    ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up);
    ink.addEventListener('contextmenu', e => e.preventDefault());

    /* Grade by comparing the tracing with the gray letters at quarter size:
       recall = how much of the letter got traced; precision = how much of the ink sits on the letter. */
    function grade() {
      if (!P.strokes.length) return null;
      const s = 0.25, w = Math.ceil(W * s), h = Math.ceil(H * s);
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.scale(s, s); return x; };
      const L = P.layout, glyph = mk(), fat = mk(), inkC = mk(), inkFat = mk();
      const drawText = (ctx, extra) => {
        const { F, lines, rowH, M } = L, total = rowH * lines.length, top = (H - total) / 2, ascPx = M.asc * F / 100, descPx = M.desc * F / 100;
        ctx.font = `${F}px ${FONTS[P.style]}`; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
        lines.forEach((line, i) => { const base = top + i * rowH + (rowH - ascPx - descPx) / 2 + ascPx, x = (W - M.w(line) * F / 100) / 2; ctx.fillText(line, x, base); if (extra) { ctx.lineWidth = F * extra; ctx.strokeText(line, x, base); } });
      };
      drawText(glyph, 0); drawText(fat, 0.13);
      P.strokes.forEach(st => drawStroke(inkC, { ...st, color: '#000' }, 1));
      P.strokes.forEach(st => drawStroke(inkFat, { ...st, color: '#000', w: Math.max(st.w * 2.6, L.F * 0.09 / W) }, 1));
      const A = c => c.getImageData(0, 0, w, h).data;
      const g = A(glyph), f = A(fat), i1 = A(inkC), i2 = A(inkFat);
      let G = 0, Gh = 0, I = 0, Ih = 0; const missed = [];
      for (let k = 3, n = 0; k < g.length; k += 4, n++) {
        if (g[k] > 60) { G++; if (i2[k] > 60) Gh++; else missed.push([(n % w) / s, Math.floor(n / w) / s, 1 / s]); }
        if (i1[k] > 60) { I++; if (f[k] > 60) Ih++; }
      }
      const recall = G ? Gh / G : 0, precision = I ? Ih / I : 0;
      const pass = recall >= 0.62 && precision >= 0.7;
      const stars = recall >= 0.85 && precision >= 0.85 ? 3 : pass ? 2 : recall >= 0.4 ? 1 : 0;
      drawPaper(bg.getContext('2d'), P.layout, opt.guide !== false, pass ? null : missed);
      return { recall, precision, pass, stars };
    }

    /* "Show me how": the gray letter fills in along its strokes, in order, with a dot for the pencil and a number at each start.
       The fill is the font's own letter, revealed by a wide brush that follows the stroke paths in strokes.js. */
    let demoRun = 0, demoCancel = null;
    function demo(strokes, done, cancel) {
      const run = ++demoRun, L = P.layout, fin = () => { demoCancel = null; done && done(); }; demoCancel = cancel || null; if (!L || !strokes || !strokes.length || L.lines.length !== 1) { fin(); return; }
      const { F, lines, rowH, M } = L, line = lines[0], top = (H - rowH) / 2, ascPx = M.asc * F / 100, descPx = M.desc * F / 100;
      const base = top + (rowH - ascPx - descPx) / 2 + ascPx, font = `${F}px ${FONTS[P.style]}`;
      const mc = document.createElement('canvas').getContext('2d'); mc.font = font; const m = mc.measureText(line);
      const x0 = (W - M.w(line) * F / 100) / 2, bx = x0 - m.actualBoundingBoxLeft, by = base - m.actualBoundingBoxAscent;
      const bw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, bh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const paths = strokes.map(st => st.map(([x, y]) => [bx + x * bw, by + y * bh]));
      const lens = paths.map(pp => pp.reduce((t, p, i) => t + (i ? Math.hypot(p[0] - pp[i - 1][0], p[1] - pp[i - 1][1]) : 0), 0));
      const total = lens.reduce((a, b) => a + b, 0), brush = F * 0.11, color = css('--hw-demo') || '#0e7569';
      const off = document.createElement('canvas'); off.width = demoC.width; off.height = demoC.height; const o = off.getContext('2d'); o.setTransform(dpr, 0, 0, dpr, 0, 0);
      const glyph = document.createElement('canvas'); glyph.width = demoC.width; glyph.height = demoC.height;     // the letter in the demo color, drawn once
      { const q = glyph.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = color; q.strokeStyle = color; q.font = font; q.textBaseline = 'alphabetic'; q.lineWidth = F * 0.035; q.lineJoin = 'round'; q.strokeText(line, x0, base); q.fillText(line, x0, base); }
      const g = demoC.getContext('2d');
      const frame = upto => {                                   // upto: length of pencil travel so far
        o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height); o.restore();
        o.globalCompositeOperation = 'source-over'; o.strokeStyle = '#000'; o.lineWidth = brush; o.lineCap = 'round'; o.lineJoin = 'round';
        let left = upto, tip = null, starts = [];
        paths.forEach((pp, k) => {
          if (left <= 0) return; starts.push([pp[0], k + 1]);
          o.beginPath(); o.moveTo(pp[0][0], pp[0][1]); let used = 0;
          for (let i = 1; i < pp.length; i++) {
            const a = pp[i - 1], b = pp[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (used + d >= left) { const t = (left - used) / (d || 1); tip = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; o.lineTo(tip[0], tip[1]); used = left; break; }
            o.lineTo(b[0], b[1]); used += d; tip = b;
          }
          if (pp.length === 1) { o.lineTo(pp[0][0] + .1, pp[0][1]); tip = pp[0]; }
          o.stroke(); left -= Math.max(lens[k], 1);
        });
        o.globalCompositeOperation = 'source-in'; o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(glyph, 0, 0); o.restore();
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, demoC.width, demoC.height); g.drawImage(off, 0, 0); g.restore();
        const R = Math.max(9, F * 0.045), placed = [];
        starts.forEach(([p0, n]) => { const p = [p0[0], p0[1]]; while (placed.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < R * 1.9)) p[0] += R * 2;   /* two strokes from one point: put the numbers side by side */ placed.push(p); g.fillStyle = css('--hw-base'); g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `800 ${Math.max(11, Math.round(F * 0.055))}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), p[0], p[1] + 1); });
        if (tip && upto < total) { g.fillStyle = css('--hw-ink'); g.beginPath(); g.arc(tip[0], tip[1], Math.max(6, F * 0.03), 0, 7); g.fill(); }
      };
      const clear = () => { const c = demoC.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, demoC.width, demoC.height); c.restore(); };
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(total); setTimeout(() => { if (run === demoRun) { clear(); fin(); } }, 2500); return; }
      const speed = Math.max(bh, F * 0.6) / 0.85, t0 = performance.now();   // about one letter height every 0.85 seconds
      const tick = now => {
        if (run !== demoRun) return;
        const upto = (now - t0) / 1000 * speed; frame(Math.min(upto, total));
        if (upto < total) requestAnimationFrame(tick); else setTimeout(() => { if (run === demoRun) { clear(); fin(); } }, 1200);
      };
      requestAnimationFrame(tick);
    }
    const stopDemo = () => { demoRun++; const cb = demoCancel; demoCancel = null; if (cb) cb();   // a demo cut short (new letter, style, or case) still hands its button back
      const c = demoC.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, demoC.width, demoC.height); c.restore(); };

    const ro = new ResizeObserver(() => resize()); ro.observe(host);
    return {
      set(text, style) { stopDemo(); P.text = text; P.style = style || P.style; P.strokes = []; P.layout = null; if (W) resize(); },
      demo, stopDemo, get style() { return P.style; },
      clear() { P.strokes = []; redrawInk(); if (P.layout) drawPaper(bg.getContext('2d'), P.layout, opt.guide !== false); },
      undo() { P.strokes.pop(); redrawInk(); },
      grade, resize,
      setPen(k, v) { P[k] = v; },
      get hasInk() { return P.strokes.length > 0; },
      get penSeen() { return P.penSeen; }
    };
  }

  /* ---------- shared controls ---------- */
  const COLORS = [['ink', 'Pencil'], ['#2f6fd0', 'Blue'], ['#1b998b', 'Green'], ['#e4572e', 'Orange'], ['#8a5fbf', 'Purple']];
  function controlsHTML(extra = '') {
    return `<div class="hw-controls">${extra}
      <div class="seg" role="group" aria-label="Letter style"><button data-style="cursive">Cursive</button><button data-style="print">Print</button></div></div>`;
  }
  function penbarHTML(check = true, demo = false) {
    return `<div class="hw-penbar">
      <div class="row hw-actions">${demo && window.HW_STROKES ? '<button class="btn ghost small" data-a="demo">Show me how</button>' : ''}<button class="btn ghost small" data-a="undo">Undo</button><button class="btn warn small" data-a="clear">Clear</button>${check ? '<button class="btn small" data-a="check">Check</button><button class="btn good small" data-a="next" hidden>Next</button>' : ''}</div>
      <div class="row hw-pen">
        <div class="hw-colors" role="group" aria-label="Pen color">${COLORS.map(([c, n]) => `<button type="button" data-color="${c}" aria-label="${n}" title="${n}" style="--sw:${c === 'ink' ? 'var(--hw-ink)' : c}"></button>`).join('')}</div>
        <div class="seg small" role="group" aria-label="Pen size"><button data-size="thin">Thin</button><button data-size="medium">Medium</button><button data-size="thick">Thick</button></div>
        <button class="iconbtn" data-a="finger" hidden title="After a stylus is used, finger touches are ignored so your palm can rest on the screen">Finger: off</button>
      </div></div>`;
  }
  /* wire style, pen, and action buttons for one tool; returns the pad */
  function setupTool(ctx, host, { onStyle, guide = true, maxFont, minFont, onStroke }) {
    const P = ctx.panel, st = ctx.state;
    const pad = Pad(host, { guide, maxFont, minFont, size: st.size, color: st.color, onStroke, onPen: () => { const f = $('[data-a="finger"]', P); if (f) f.hidden = false; } });
    const paintStyle = () => $$('[data-style]', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.style === st.style));
    const paintPen = () => { $$('[data-color]', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.color === st.color)); $$('[data-size]', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.size === st.size)); };
    $$('[data-style]', P).forEach(b => b.onclick = () => { st.style = b.dataset.style; ctx.save(); paintStyle(); onStyle(); });
    $$('[data-color]', P).forEach(b => b.onclick = () => { st.color = b.dataset.color; ctx.save(); pad.setPen('color', st.color); paintPen(); });
    $$('[data-size]', P).forEach(b => b.onclick = () => { st.size = b.dataset.size; ctx.save(); pad.setPen('size', st.size); paintPen(); });
    const fb = $('[data-a="finger"]', P);
    if (fb) fb.onclick = () => { const on = fb.textContent.endsWith('off'); pad.setPen('fingerToo', on); fb.textContent = 'Finger: ' + (on ? 'on' : 'off'); fb.setAttribute('aria-pressed', on); };
    $('[data-a="undo"]', P).onclick = () => pad.undo();
    $('[data-a="clear"]', P).onclick = () => pad.clear();
    paintStyle(); paintPen();
    return pad;
  }
  const feedback = r => r.pass ? (r.stars === 3 ? 'Beautiful! That is great handwriting.' : 'Nice tracing!')
    : r.recall < 0.62 ? 'Trace the whole thing. The orange parts still need ink.' : 'Try to stay on the gray letters.';

  /* ===================== Letters ===================== */
  const letters = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state; let set = st.case || 'upper', i = 0, checked = false;
      P.innerHTML = `<h2>Letters</h2><p class="lead">Trace the gray letter. Start at the top, and keep your pencil moving.</p>
        ${controlsHTML(`<div class="seg" role="group" aria-label="Capital or lowercase"><button data-case="upper">Capitals</button><button data-case="lower">Lowercase</button></div>`)}
        <div class="hw-strip" role="group" aria-label="Pick a letter"></div>
        <div class="hw-pad"></div>${penbarHTML(true, true)}<p class="msg hw-msg"></p>`;
      const host = $('.hw-pad', P), msg = $('.hw-msg', P), next = $('[data-a="next"]', P), check = $('[data-a="check"]', P);
      const list = () => set === 'upper' ? UPPER : LOWER;
      const passedCount = () => Object.keys(st.passed || {}).length;
      const strip = () => { $('.hw-strip', P).innerHTML = list().map((l, k) => `<button data-i="${k}" class="${(st.passed || {})[l] ? 'done' : ''}" aria-pressed="${k === i}">${l}</button>`).join(''); $$('.hw-strip button', P).forEach(b => b.onclick = () => { i = +b.dataset.i; show(); }); };
      let passedNow = false;
      const pad = setupTool(ctx, host, { onStyle: () => show(), maxFont: 300, minFont: 120 });
      function show() {
        checked = false; passedNow = false; next.hidden = true; check.hidden = false; setMsg(msg, '');
        $$('[data-case]', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.case === set));
        pad.set(list()[i], st.style); strip();
        const sb = $(`.hw-strip [data-i="${i}"]`, P); if (sb && sb.scrollIntoView) sb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        ctx.say((set === 'upper' ? 'capital ' : 'lowercase ') + list()[i]);
      }
      $$('[data-case]', P).forEach(b => b.onclick = () => { set = st.case = b.dataset.case; ctx.save(); i = 0; show(); });
      const db = $('[data-a="demo"]', P);
      if (db) db.onclick = () => {                              // watch the letter being written, then trace it
        const l = list()[i], strokes = (window.HW_STROKES[pad.style] || {})[l];
        if (!strokes) return;
        db.disabled = true; setMsg(msg, 'Watch the dot: numbers show where each stroke starts.');
        pad.demo(strokes, () => { db.disabled = false; setMsg(msg, 'Now you try. Trace the gray letter.'); }, () => { db.disabled = false; });
      };
      check.onclick = () => {
        const r = pad.grade(); if (!r) { setMsg(msg, 'Trace the letter first.', 'bad'); return; }
        const l = list()[i];
        if (r.pass) {
          if (!passedNow) { ctx.credit(); ctx.sfx.good(); } passedNow = true; check.hidden = true;     // one credit per letter: pressing Check again gives nothing more
          if (!(st.passed || {})[l]) { st.passed = Object.assign({}, st.passed, { [l]: true }); ctx.save(); ctx.result(passedCount(), 52); }
        } else if (!checked) { ctx.slip(); ctx.sfx.bad(); }
        checked = true;
        msg.innerHTML = `${starsHTML(r.stars, 3).replace('class="stars"', 'class="stars small"')}<span>${esc(feedback(r))} ${r.pass ? '' : 'Clear it and try again.'}</span>`; msg.className = 'msg hw-msg ' + (r.pass ? 'good' : 'bad');
        next.hidden = false; strip();
      };
      next.onclick = () => { i = (i + 1) % list().length; show(); };
      show();
    }
  };

  /* ===================== Words and Sentences (rounds) ===================== */
  function roundTool(title, lead, pool, n, fonts) {
    return {
      init(ctx) {
        const P = ctx.panel, st = ctx.state, R = { list: [], i: 0, score: 0, first: true };
        P.innerHTML = `<h2>${title}</h2><p class="lead">${lead}</p>${controlsHTML(`<div class="roundbar"><div class="bar" aria-hidden="true"><i></i></div><span class="hint rcount"></span></div>`)}
          <div class="hw-pad"></div>${penbarHTML()}<p class="msg hw-msg"></p>`;
        const host = $('.hw-pad', P), msg = $('.hw-msg', P), next = $('[data-a="next"]', P), check = $('[data-a="check"]', P);
        const pad = setupTool(ctx, host, { onStyle: () => pad.set(R.list[R.i], st.style), ...fonts });
        function start() { R.list = shuffle(pool).slice(0, n); R.i = 0; R.score = 0; show(); }
        function show() {
          if (R.i >= R.list.length) {
            ctx.result(R.score, R.list.length); ctx.sfx.win();
            setMsg(msg, `Round done: ${R.score} of ${R.list.length} on the first try. Press Next for a new round.`, 'good');
            check.hidden = true; next.hidden = false; next.onclick = () => { next.onclick = goNext; start(); }; return;
          }
          R.first = true; next.hidden = true; check.hidden = false; setMsg(msg, '');
          $('.bar i', P).style.width = (R.i / R.list.length * 100) + '%'; $('.rcount', P).textContent = `${R.i + 1} of ${R.list.length} · Score ${R.score}`;
          pad.set(R.list[R.i], st.style); ctx.say(R.list[R.i]);
        }
        check.onclick = () => {
          const r = pad.grade(); if (!r) { setMsg(msg, 'Trace it first.', 'bad'); return; }
          if (r.pass) { if (R.first) R.score++; ctx.credit(); ctx.sfx.good(); check.hidden = true; } else if (R.first) { ctx.slip(); ctx.sfx.bad(); }   // after a pass Check hides, so it can't be pressed for more credit
          R.first = false;
          msg.innerHTML = `${starsHTML(r.stars, 3).replace('class="stars"', 'class="stars small"')}<span>${esc(feedback(r))} ${r.pass ? '' : 'Clear it and try again, or press Next.'}</span>`; msg.className = 'msg hw-msg ' + (r.pass ? 'good' : 'bad');
          next.hidden = false;
        };
        const goNext = () => { R.i++; show(); };
        next.onclick = goNext;
        start();
      }
    };
  }
  const words = roundTool('Words', 'Trace each word. In cursive, keep the letters joined.', WORDS, 6, { maxFont: 220, minFont: 90 });
  const sentences = roundTool('Sentences', 'Trace each sentence. Leave a small space between words.', SENTENCES, 4, { maxFont: 150, minFont: 56 });

  /* ===================== Practice paper ===================== */
  const practice = {
    init(ctx) {
      const P = ctx.panel, st = ctx.state;
      P.innerHTML = `<h2>Practice paper</h2><p class="lead">Type anything to trace, like your name or spelling words. Leave it empty for blank lined paper.</p>
        ${controlsHTML(`<form class="hw-own" autocomplete="off"><input class="textin" maxlength="40" placeholder="Type a word or name" aria-label="Words to trace"><button class="btn small" type="submit">Trace it</button></form>`)}
        <div class="hw-pad"></div>${penbarHTML(false)}`;
      const inp = $('input', P);
      const pad = setupTool(ctx, $('.hw-pad', P), { onStyle: () => pad.set(inp.value.trim(), st.style), maxFont: 200, minFont: 56 });
      $('form', P).onsubmit = e => { e.preventDefault(); pad.set(inp.value.trim(), st.style); };
      pad.set('', st.style);
    }
  };

  fontsReady.then(() => SBM.start({ module: 'handwriting', defaults: { style: 'cursive', size: 'medium', color: 'ink', case: 'upper', passed: {} }, tools: { letters, words, sentences, practice } }));
})();
