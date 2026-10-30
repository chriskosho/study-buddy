/* Oceans: the map tools, ported from the World module (which came from Europe and Explorer's Atlas): Study map, Listen and tap, Find it,
   Drag names, and the map flashcards. The map is equirectangular (longitude across, latitude up) and shows the whole Earth from 85 degrees
   north to 85 south. Oceans and seas are polygons drawn UNDER the land (mapdata.js, made by _dev/world-map/geo_oceans.mjs), so a tap on land
   does nothing and each body of water is a tappable shape like a country is on the other maps. Small seas show a short code until they are tapped
   or the map is zoomed (the same small-place rule as the country maps). Behavior otherwise matches the Atlas: zoom and pan, keyboard access on
   every shape, names spoken only from speaker buttons unless Read aloud is on. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const BYID = Object.fromEntries(WATERS.map(s => [s.id, s]));
  /* five pale ocean colors, then four stronger sea colors, so a sea stands out against the ocean around it (mapdata.js picks the index) */
  const COLORS = ['#cfe6f3', '#cfe9dc', '#ddd5f0', '#c4e6f2', '#dbe9f5', '#6fb3d9', '#7cc4b3', '#9aa9e3', '#a8d8a0'];
  const colorOf = id => COLORS[MAPDATA.waters[id].c % COLORS.length];
  const pickN = (a, n) => shuffle(a.slice()).slice(0, n);
  const GREY = '#d6d2c4', BLANK = '#ece4cc';   // placed / blank fills (the pastel map stays the same in dark mode)
  const W = MAPDATA.width, H = MAPDATA.height;
  const BASE_W = W, homeVB = () => ({ x: 0, y: 0, w: W, h: H });          // the map always opens on the whole Earth

  /* ---------- map rendering ---------- */
  const OUT = [], outPos = () => ({ x: 0, y: 0, end: false });          // no leader lines here: small seas use short codes instead
  function buildMap(svg, named) {
    const vb = svg._vb || { x: 0, y: 0, w: W, h: H };
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    svg.innerHTML = '';
    const paths = {}, gl = document.createElementNS(SVGNS, 'g');
    WATERS.forEach(s => {                                                  // oceans first, then seas, so a sea is drawn over its ocean
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', MAPDATA.waters[s.id].d); p.setAttribute('class', 'land cpath');
      p.dataset.id = s.id; p.style.fill = colorOf(s.id);
      // keyboard access: every body of water takes Tab and Enter. Only the Study map names it; the game maps stay generic.
      p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', named ? s.name : 'Body of water on the map');
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
      if (named) { const ti = document.createElementNS(SVGNS, 'title'); ti.textContent = s.name; p.appendChild(ti); }   // a hover tooltip with the full name (Study map only)
      svg.appendChild(p); paths[s.id] = p;
    });
    const g0 = document.createElementNS(SVGNS, 'g');                        // the land goes on top of the water
    ['ctx-edge', 'ctx-fill'].forEach(cls => Object.values(MAPDATA.context).forEach(d => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'ctx ' + cls); g0.appendChild(p); }));   // an outline under a fill, so coasts have an edge but borders between countries do not show
    svg.appendChild(g0);
    svg.appendChild(gl);
    svg._paths = paths; svg._labels = gl;
    return paths;
  }
  function labelSpec(id) {
    const w = MAPDATA.waters[id], [x, y, size] = w.label;
    if (w.small) return { lines: [id.toUpperCase()], size: 8 * 1.7, x, y, short: true };   // relabel() sets the real code size from the screen
    return { lines: w.lines, size, x, y };
  }
  /* SMALL-PLACE LABELS (rule in STYLE_GUIDE.md, "Maps"): a place too small for its name gets a short code, and the code opens into the full name
     (a) when it is tapped or focused, (b) when the map is zoomed in, (c) for a moment after it is placed in Drag names. relabel() does the switching. */
  const OPEN_ZOOM = 1.5;                                // the first press of + (1.6x) already opens the names
  function relabel(svg) {
    if (!svg._labels) return;
    const vb = svg._vb || { w: W }, zoom = (svg._homeW || W) / vb.w, rect = svg.getBoundingClientRect(), u = rect.width ? vb.w / rect.width : 1;
    $$('text[data-short]', svg._labels).forEach(t => {
      const id = t.dataset.id, open = zoom >= OPEN_ZOOM || svg._sel === id || svg._temp === id, size = (open ? 9.5 : 8) * u, name = BYID[id].name;
      const words = name.split(' '), lines = open ? (name.length > 12 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name]) : [id.toUpperCase()];
      const x = t.getAttribute('x'); t.textContent = ''; t.style.fontSize = size + 'px'; t.removeAttribute('y');
      lines.forEach((ln, i) => { const ts = document.createElementNS(SVGNS, 'tspan'); ts.setAttribute('x', x); ts.setAttribute('y', t._y + size * 0.35 + (i - (lines.length - 1) / 2) * size * 1.05); ts.textContent = ln; t.appendChild(ts); });
      t.classList.toggle('lbl-open', open && (svg._sel === id || svg._temp === id));
      if (open && svg._sel === id) { const ln = $(`.lead-line[data-id="${id}"]`, svg._labels); svg._labels.appendChild(t); }
    });
    $$('.lead-dot', svg._labels).forEach(d => d.setAttribute('r', Math.max(1, 1.6 * Math.min(1.4, u))));
  }
  function select(svg, id) {
    if (svg._sel && svg._paths[svg._sel]) svg._paths[svg._sel].classList.remove('sel');
    svg._sel = id; if (id && svg._paths[id]) svg._paths[id].classList.add('sel');
    relabel(svg);
  }
  function openAWhile(svg, id) { svg._temp = id; relabel(svg); clearTimeout(svg._tempT); svg._tempT = setTimeout(() => { svg._temp = null; relabel(svg); }, 2600); }
  function addLabel(svg, id) {
    if (svg._labels.querySelector(`[data-id="${id}"]`)) return;
    const w = MAPDATA.waters[id], sp = labelSpec(id), mk = tag => document.createElementNS(SVGNS, tag);
    [[sp.x, sp.y], ...(w.alts || [])].forEach(([x, y]) => {                // a few oceans have a second label spot (the Pacific is on both edges of the map)
      const t = mk('text'); t.setAttribute('class', 'lbl lbl-water'); t.dataset.id = id; t.style.fontSize = sp.size + 'px';
      if (sp.short) { t.dataset.short = '1'; t._size = sp.size; t._y = y; t.setAttribute('x', x); t.setAttribute('y', y + sp.size * 0.35); t.textContent = id.toUpperCase(); }
      else { const lh = sp.size * 1.05, top = y - (sp.lines.length - 1) * lh / 2 + sp.size * 0.35; sp.lines.forEach((ln, i) => { const ts = mk('tspan'); ts.setAttribute('x', x); ts.setAttribute('y', top + i * lh); ts.textContent = ln; t.appendChild(ts); }); }
      svg._labels.appendChild(t);
    });
    relabel(svg);
  }
  /* zoom + pan: buttons, mouse wheel, drag to pan when zoomed */
  function makeZoom(svg) {
    const full = { x: 0, y: 0, w: W, h: H }, home = homeVB(), vb = svg._vb = { ...home }; svg._homeW = home.w;
    const apply = () => { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); svg.classList.toggle('zoomed', vb.w < BASE_W - 1); relabel(svg); };
    const clampPan = () => { vb.x = Math.min(Math.max(vb.x, full.x - vb.w * 0.1), full.x + full.w - vb.w * 0.9); vb.y = Math.min(Math.max(vb.y, full.y - vb.h * 0.1), full.y + full.h - vb.h * 0.9); };
    const zoomAt = (f, cx, cy) => { const nw = Math.min(full.w, Math.max(full.w / 8, vb.w / f)), nh = nw * full.h / full.w, k = nw / vb.w; vb.x = cx - (cx - vb.x) * k; vb.y = cy - (cy - vb.y) * k; vb.w = nw; vb.h = nh; clampPan(); apply(); };
    const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return [vb.x + (cx - r.left) / r.width * vb.w, vb.y + (cy - r.top) / r.height * vb.h]; };
    const bar = document.createElement('div'); bar.className = 'zoombar';
    bar.innerHTML = '<button type="button" aria-label="Zoom in" title="Zoom in">+</button><button type="button" aria-label="Zoom out" title="Zoom out">&minus;</button><button type="button" aria-label="Reset zoom" title="Show the whole map" style="font-size:13px">All</button>';
    svg.parentElement.appendChild(bar);
    const [bi, bo, br] = bar.children, mid = () => [vb.x + vb.w / 2, vb.y + vb.h / 2];
    bi.onclick = () => zoomAt(1.6, ...mid()); bo.onclick = () => zoomAt(1 / 1.6, ...mid()); br.onclick = () => { Object.assign(vb, homeVB()); apply(); };
    svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, ...toSvg(e.clientX, e.clientY)); }, { passive: false });
    if (svg.id === 'mapStudy') svg.addEventListener('dblclick', e => zoomAt(1.6, ...toSvg(e.clientX, e.clientY)));   // double-tap or double-click zooms in on that spot (Study map only: the games count every tap)
    let pan = null;
    svg.addEventListener('pointerdown', e => { if (vb.w < BASE_W - 1 && e.button === 0) pan = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; });
    svg.addEventListener('pointermove', e => {
      if (!pan) return;
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) > 6) { pan.moved = true; try { svg.setPointerCapture(pan.id); } catch (er) {} }
      if (pan.moved) { const r = svg.getBoundingClientRect(); vb.x -= dx / r.width * vb.w; vb.y -= dy / r.height * vb.h; pan.x = e.clientX; pan.y = e.clientY; clampPan(); apply(); }
    });
    const end = () => { if (pan && pan.moved) { svg._justPanned = true; setTimeout(() => svg._justPanned = false, 50); } pan = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    /* centers on a place (and zooms in a little if it is a tiny one) so it is easy to see */
    svg._focus = id => { const m = MAPDATA.waters[id].label; let w = vb.w; if (MAPDATA.waters[id].small && w > full.w / 3) w = full.w / 3; else if (w > full.w / 1.6) w = full.w / 1.6; const h = w * full.h / full.w; Object.assign(vb, { x: m[0] - w / 2, y: m[1] - h / 2, w, h }); clampPan(); apply(); };
    if (window.ResizeObserver) new ResizeObserver(() => relabel(svg)).observe(svg);
    apply();
  }
  const clickOK = svg => !svg._justPanned;
  const flash = (p, cls) => { p.classList.remove('flash-good', 'flash-bad'); void p.getBBox(); p.classList.add(cls); };
  const mapBox = (id, label) => `<div class="mapbox"><svg id="${id}" aria-label="${esc(label)}"></svg></div>`;
  const speakName = id => SB.say(BYID[id].name, { force: true });

  /* the whole map with one body of water highlighted (flashcards), with a ring for the small ones */
  function miniMap(id) {
    const water = s => `<path d="${MAPDATA.waters[s.id].d}" fill="${s.id === id ? '#e4572e' : '#cfe3ee'}" stroke="${s.id === id ? '#8c2f12' : '#ffffff'}" stroke-width="${s.id === id ? 2 : 0.8}" stroke-linejoin="round"/>`;
    const land = Object.values(MAPDATA.context).map(d => `<path d="${d}" fill="#cfc7ae" stroke="#cfc7ae" stroke-width="1.6"/><path d="${d}" fill="#ece6d3" stroke="#ece6d3" stroke-width=".8"/>`).join('');
    const m = MAPDATA.waters[id].label, ring = MAPDATA.waters[id].small ? `<circle cx="${m[0]}" cy="${m[1]}" r="20" fill="none" stroke="#e4572e" stroke-width="3"/>` : '';
    return `<svg class="mini oce-mini" viewBox="0 0 ${W} ${H}" aria-hidden="true">${WATERS.filter(s => s.id !== id).map(water).join('')}${water(BYID[id])}${land}${ring}</svg>`;
  }
  window.__oceMap = { miniMap, cur: null };   // cur: the body of water being asked for. A test hook only (europe_test.py); nothing else reads it.

  /* ===================== Study map ===================== */
  const study = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study map</h2><p class="lead">Every ocean and sea with its name. Tap one, or a name in the list, to see its full name and hear it. Small seas show a short code until you tap them or zoom in.</p>
        <div class="mapgrid study">${mapBox('mapStudy', 'Labeled map of the oceans and seas')}<div><div class="studylist" id="oceStudyList"></div></div></div>`;
      const svg = $('#mapStudy', P); buildMap(svg, true); makeZoom(svg);
      Object.entries(svg._paths).forEach(([id, p]) => {
        addLabel(svg, id);
        p.addEventListener('click', () => { if (clickOK(svg)) { select(svg, id); speakName(id); flash(p, 'flash-good'); } });
        p.addEventListener('focus', () => select(svg, id));
      });
      svg.addEventListener('click', e => { if (!e.target.closest('.cpath')) select(svg, null); });
      const listEl = $('#oceStudyList', P); listEl.innerHTML = WATERS.map(s => `<div class="srow"><div class="st" role="button" tabindex="0" data-id="${s.id}"><b>${esc(s.name)}</b><span>${esc(s.kind === 'ocean' ? 'Ocean' : s.type)}</span></div>${ctx.sayButton(s.name, 'Hear ' + s.name)}</div>`).join('');
      $$('.st', listEl).forEach(el => { const go = () => { select(svg, el.dataset.id); svg._focus(el.dataset.id); }; el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    }
  };

  /* ===================== Listen and tap ===================== */
  let listenState = null, findStop = null;
  const listen = {
    init(ctx) {
      const P = ctx.panel, N = 10;
      P.innerHTML = `<h2>Listen and tap</h2><p class="lead">Listen to the name of an ocean or sea, then tap it on the map. Each round has ${N} places.</p>
        <div class="scorebar"><div class="stat"><b id="lScore">0/${N}</b><span>Right</span></div><div class="stat"><b id="lRound">1</b><span>Round</span></div></div>
        <div class="mapgrid">${mapBox('mapListen', 'Map of the oceans and seas')}<div><div class="prompt" id="lPrompt">Press play</div>
          <div class="row"><button class="btn" id="lPlay" type="button">Play the name</button><button class="btn ghost" id="lSkip" type="button">Skip</button></div><p class="msg" id="lMsg"></p></div></div>`;
      const L = listenState = { svg: $('#mapListen', P), order: [], i: 0, score: 0, tries: 0, done: false, locked: false, t: null };
      makeZoom(L.svg);
            function newRound() {
        L.order = pickN(WATERS.map(s => s.id), N); L.i = 0; L.score = 0; L.tries = 0; L.done = false; L.locked = false;
        buildMap(L.svg); Object.entries(L.svg._paths).forEach(([id, p]) => p.addEventListener('click', () => tap(id)));
        show();
      }
      function show(quiet) {
        L.locked = false; L.t = null;
        $('#lScore', P).textContent = L.score + '/' + N; $('#lRound', P).textContent = Math.min(L.i + 1, N);
        if (L.i >= N) { L.done = true; ctx.result(L.score, N); $('#lPrompt', P).textContent = 'All done!'; $('#lMsg', P).className = 'msg good'; $('#lMsg', P).textContent = `You got ${L.score} of ${N} on the first try.`; $('#lPlay', P).textContent = 'Play again'; ctx.sfx.win(); return; }
        $('#lPrompt', P).textContent = 'Which one did you hear?'; $('#lPlay', P).textContent = 'Play the name again'; L.tries = 0;
        window.__oceMap.cur = L.order[L.i]; if (!quiet) speakName(L.order[L.i]);
      }
      function tap(id) {
        if (L.done || L.locked || !clickOK(L.svg)) return;
        const want = L.order[L.i], p = L.svg._paths[id], msg = $('#lMsg', P);
        if (id === want) { if (L.tries === 0) L.score++; ctx.credit(); ctx.sfx.good(); flash(p, 'flash-good'); msg.className = 'msg good'; msg.textContent = 'Yes! ' + BYID[id].name + '.'; L.i++; L.locked = true; L.t = setTimeout(show, 900); }
        else { L.tries++; ctx.slip(); ctx.sfx.bad(); flash(p, 'flash-bad'); msg.className = 'msg bad'; msg.textContent = 'That is ' + BYID[id].name + '. Listen again and try another.'; }
      }
      $('#lPlay', P).onclick = () => { if (L.done) { newRound(); $('#lMsg', P).textContent = ''; } else speakName(L.order[L.i]); };
      $('#lSkip', P).onclick = () => { if (L.done || L.locked) return; L.order.push(L.order.splice(L.i, 1)[0]); show(); };
      L.show = show;
      if (!('speechSynthesis' in window)) { $('#lPrompt', P).textContent = 'This browser cannot speak. Try Chrome, Edge, or Safari.'; return; }
      newRound();
    },
    // leaving mid-pause: finish the pending step now (quietly) so coming back is never stuck and the last result is recorded
    leave() { if (listenState && listenState.t) { clearTimeout(listenState.t); listenState.show(true); } }
  };

  /* ===================== Find it ===================== */
  const find = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Find it</h2><p class="lead">The name of an ocean or sea appears. Tap it on the map as fast as you can.</p>
        <div class="scorebar"><div class="stat"><b id="fScore">0</b><span>Score</span></div><div class="stat"><b id="fTime">60</b><span>Seconds</span></div><div class="stat"><b id="fBest">0</b><span>Best</span></div></div>
        <div class="mapgrid">${mapBox('mapFind', 'Map of the oceans and seas')}<div><div class="prompt" id="fPrompt">Ready?</div>
          <p class="msg" id="fMsg">You get 60 seconds. Each right tap is a point.</p><div class="row"><button class="btn" id="fStart" type="button">Start</button></div></div></div>`;
      const F = { svg: $('#mapFind', P), score: 0, time: 60, timer: null, target: null, running: false, hard: new Set() };
      const stopFind = silent => { clearInterval(F.timer); F.running = false; if (silent) { $('#fPrompt', P).textContent = 'Ready?'; $('#fStart', P).textContent = 'Start'; } };
      function next() {
        let s; do { s = pickN(WATERS, 1)[0]; } while (F.target && s.id === F.target);
        F.target = window.__oceMap.cur = s.id; $('#fPrompt', P).innerHTML = 'Find <em>' + esc(s.name) + '</em> ' + ctx.sayButton(s.name, 'Hear ' + s.name); ctx.say(s.name);
      }
      function end() {
        if (F.target) F.hard.add(F.target);
        clearInterval(F.timer); F.running = false; F.target = null;
        const prev = ctx.state.bestFind || 0, best = Math.max(prev, F.score);
        ctx.state.bestFind = best; ctx.save(); $('#fBest', P).textContent = best; ctx.result(F.score, null);
        $('#fPrompt', P).textContent = 'Time!'; $('#fMsg', P).className = 'msg good';
        $('#fMsg', P).textContent = 'You found ' + F.score + ' places.' + (F.score > prev && F.score > 0 ? ' New best!' : ''); $('#fStart', P).textContent = 'Play again'; ctx.sfx.win();
        if (F.hard.size) {                                    // the ones that took more than one try are outlined, with their names to hear
          F.hard.forEach(id => F.svg._paths[id] && F.svg._paths[id].classList.add('target'));
          $('#fMsg', P).insertAdjacentHTML('beforeend', '<br><span class="fpractice">Practice these: ' + [...F.hard].map(id => esc(BYID[id].name) + ' ' + ctx.sayButton(BYID[id].name, 'Hear ' + BYID[id].name)).join(', ') + '</span>');
        }
      }
      function start() {
        F.hard = new Set(); Object.values(F.svg._paths).forEach(p => p.classList.remove('target'));
        F.score = 0; F.time = 60; F.running = true; $('#fScore', P).textContent = 0; $('#fTime', P).textContent = 60; $('#fMsg', P).className = 'msg'; $('#fMsg', P).textContent = 'Go!'; $('#fStart', P).textContent = 'Restart';
        next(); clearInterval(F.timer); F.timer = setInterval(() => { F.time--; $('#fTime', P).textContent = F.time; if (F.time <= 0) end(); }, 1000);
      }
      function tap(id) {
        if (!F.running || !clickOK(F.svg)) return;
        const p = F.svg._paths[id], msg = $('#fMsg', P);
        if (id === F.target) { F.score++; $('#fScore', P).textContent = F.score; ctx.credit(); ctx.sfx.good(); flash(p, 'flash-good'); msg.className = 'msg good'; msg.textContent = 'Yes! ' + BYID[id].name + '.'; next(); }
        else { F.hard.add(F.target); ctx.slip(); ctx.sfx.bad(); flash(p, 'flash-bad'); msg.className = 'msg bad'; msg.textContent = 'That is ' + BYID[id].name + '. Keep looking for ' + BYID[F.target].name + '.'; }
      }
      buildMap(F.svg); makeZoom(F.svg);
      Object.entries(F.svg._paths).forEach(([id, p]) => p.addEventListener('click', () => tap(id)));
      $('#fBest', P).textContent = ctx.state.bestFind || 0; $('#fStart', P).onclick = start;
      findStop = () => stopFind(true);
    },
    leave() { if (findStop) findStop(); }
  };

  /* ===================== Drag names ===================== */
  const drag = {
    init(ctx) {
      const P = ctx.panel, N = WATERS.length;
      P.innerHTML = `<h2>Drag names</h2><p class="lead">Drag each name onto its ocean or sea (or tap a name, then tap it on the map). Zoom in on the small ones.</p>
        <div class="scorebar"><div class="stat"><b id="dPlaced">0/${N}</b><span>Placed</span></div><div class="stat"><b id="dMiss">0</b><span>Misses</span></div>
          <div class="seg" id="dragMode" role="group" aria-label="Map style"><button type="button" data-m="grey" aria-pressed="true" title="Everything starts colored. Placed ones turn grey.">Grey out when placed</button><button type="button" data-m="reveal" aria-pressed="false" title="Everything starts blank. Placed ones get color and a thick border.">Blank, then color</button><button type="button" data-m="stay" aria-pressed="false" title="Colors stay as they are.">Keep colors</button></div></div>
        <div class="mapgrid">${mapBox('mapDrag', 'Map of the oceans and seas')}<div><div class="tray oce-tray" id="tray"></div><p class="msg" id="dMsg"></p>
          <div class="row"><button class="btn ghost" id="dHint" type="button">Hint</button><button class="btn warn" id="dReset" type="button">Start over</button></div></div></div>`;
      const DR = { svg: $('#mapDrag', P), placed: new Set(), miss: 0, sel: null, mode: 'grey' };
      const msgEl = $('#dMsg', P), setMsg = (t, c = '') => { msgEl.className = 'msg ' + c; msgEl.textContent = t; };
      function paint(id, placed) {
        const p = DR.svg._paths[id], col = colorOf(id);
        if (DR.mode === 'grey') p.style.fill = placed ? GREY : col; else if (DR.mode === 'reveal') p.style.fill = placed ? col : BLANK; else p.style.fill = col;
        p.classList.toggle('placed-grey', placed && DR.mode === 'grey'); p.classList.toggle('placed', placed && DR.mode !== 'grey');
        if (placed && DR.mode !== 'grey') DR.svg.insertBefore(p, DR.svg._labels);
      }
      const score = () => { $('#dPlaced', P).textContent = DR.placed.size + '/' + N; $('#dMiss', P).textContent = DR.miss; };
      function reset() {
        buildMap(DR.svg); DR.placed = new Set(); DR.miss = 0; DR.sel = null;
        WATERS.forEach(s => paint(s.id, false));
        Object.entries(DR.svg._paths).forEach(([id, p]) => {
          p.addEventListener('click', () => { if (DR.sel && clickOK(DR.svg)) tryDrop(DR.sel, id); });
          p.addEventListener('pointerenter', () => { if (DR.sel) p.classList.add('hover'); }); p.addEventListener('pointerleave', () => p.classList.remove('hover'));
        });
        const tray = $('#tray', P); tray.innerHTML = '';
        shuffle(WATERS.slice()).forEach(s => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s.name; b.dataset.id = s.id;
          b.addEventListener('pointerdown', e => pointerDown(e, b));
          b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } });
          tray.appendChild(b);
        });
        score(); setMsg('Pick a name to begin.');
      }
      function select(id, quiet) {
        DR.sel = DR.sel === id ? null : id;
        $$('#tray .chip', P).forEach(ch => ch.classList.toggle('sel', ch.dataset.id === DR.sel));
        if (DR.sel) { setMsg('Now tap ' + BYID[DR.sel].name + ' on the map.'); if (!quiet) ctx.say(BYID[DR.sel].name); }
      }
      function pointerDown(e, chip) {
        if (e.button !== undefined && e.button > 0) return;
        const id = chip.dataset.id, sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
        chip.setPointerCapture(e.pointerId); ctx.say(BYID[id].name);
        const mv = ev => {
          if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { moved = true; ghost = document.createElement('div'); ghost.className = 'ghostchip'; ghost.textContent = chip.textContent; document.body.appendChild(ghost); chip.style.opacity = .4; }
          if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
          if (moved) { const t = document.elementFromPoint(ev.clientX, ev.clientY); $$('#mapDrag .cpath.hover', P).forEach(x => x.classList.remove('hover')); const p = t && t.closest && t.closest('.cpath'); if (p) p.classList.add('hover'); }
        };
        const up = ev => {
          chip.removeEventListener('pointermove', mv); chip.removeEventListener('pointerup', up); chip.removeEventListener('pointercancel', up);
          $$('#mapDrag .cpath.hover', P).forEach(x => x.classList.remove('hover')); chip.style.opacity = '';
          if (moved) { ghost.remove(); const t = document.elementFromPoint(ev.clientX, ev.clientY), p = t && t.closest && t.closest('.cpath'); if (p && ev.type === 'pointerup') tryDrop(id, p.dataset.id); else setMsg('Drop the name right on a country.'); }
          else select(id, true);
        };
        chip.addEventListener('pointermove', mv); chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', up);
      }
      function tryDrop(id, target) {
        if (DR.placed.has(target)) { setMsg(BYID[target].name + ' is already placed.'); return; }
        const chip = $(`#tray .chip[data-id="${id}"]`, P), path = DR.svg._paths[target];
        if (id === target) {
          DR.placed.add(id); chip.remove(); DR.sel = null; paint(id, true); addLabel(DR.svg, id); openAWhile(DR.svg, id); ctx.credit(); ctx.sfx.good(); flash(path, 'flash-good');
          setMsg('Yes! That is ' + BYID[id].name + '.', 'good'); score();
          if (DR.placed.size === N) { ctx.result(Math.max(0, N - DR.miss), N); ctx.sfx.win(); setMsg(DR.miss === 0 ? `Perfect! All ${N} places with no misses!` : `Done! All ${N} placed with ${DR.miss} miss${DR.miss === 1 ? '' : 'es'}.`, 'good'); }
        } else {
          DR.miss++; ctx.slip(); ctx.sfx.bad(); score(); chip.classList.remove('shake'); void chip.offsetWidth; chip.classList.add('shake'); flash(path, 'flash-bad');
          setMsg('Not quite. That one is ' + BYID[target].name + '. Try again.', 'bad');
        }
      }
      makeZoom(DR.svg);
      $('#dReset', P).onclick = reset;
      $('#dHint', P).onclick = () => {
        const id = DR.sel || ($('#tray .chip', P) && $('#tray .chip', P).dataset.id); if (!id) return;
        const p = DR.svg._paths[id]; p.classList.add('target'); setTimeout(() => p.classList.remove('target'), 1800);
        DR.miss++; score(); setMsg('Hint: ' + BYID[id].name + ' is outlined in orange.');
      };
      $$('#dragMode button', P).forEach(b => b.onclick = () => { DR.mode = b.dataset.m; $$('#dragMode button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); reset(); });
      reset();
    }
  };


  window.__oceTools = { study, listen, find, drag };
})();
