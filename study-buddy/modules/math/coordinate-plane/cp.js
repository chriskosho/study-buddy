/* The Coordinate Plane: tools. Pictures and problems come from gen.js (COORDGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.COORDGEN, esc = SB.esc, pair = G.pair;
  const many = (fn, n = 10) => SBT.many(fn, n);
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- a grid you can tap (or use with the arrow keys) ---------- */
  function interactive(svg, label, h) {
    const max = +svg.dataset.max, g = G.geom(max), X = x => g.M + x * g.st, Y = y => g.W - g.M - y * g.st, clamp = v => Math.max(0, Math.min(max, v));
    svg.setAttribute('tabindex', '0'); svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', label); svg.classList.add('tap');
    const mk = (cls, r) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('class', cls); c.setAttribute('r', r); c.style.display = 'none'; svg.appendChild(c); return c; };
    const cur = mk('cur', 13), mark = mk('pt pick', 9);
    let cx = 0, cy = 0;
    const put = (c, x, y) => { c.setAttribute('cx', X(x)); c.setAttribute('cy', Y(y)); c.style.display = ''; };
    const api = {
      marker: null, locked: false,
      setCursor(x, y) { cx = x; cy = y; put(cur, x, y); if (h.onMove) h.onMove(x, y); },
      place(x, y) { if (api.locked) return; api.marker = { x, y }; cx = x; cy = y; put(cur, x, y); put(mark, x, y); mark.setAttribute('class', 'pt pick'); if (h.onPlace) h.onPlace(x, y); },
      clear() { api.marker = null; mark.style.display = 'none'; },
      markClass(c) { mark.setAttribute('class', 'pt ' + c); },
      reveal(x, y) { const c = mk('pt good', 9); put(c, x, y); },
      svg
    };
    svg.addEventListener('click', e => { const p = G.hit(svg, e.clientX, e.clientY); if (p) api.place(p.x, p.y); });
    svg.addEventListener('focus', () => { api.setCursor(cx, cy); });
    svg.addEventListener('blur', () => { cur.style.display = 'none'; });
    svg.addEventListener('keydown', e => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (d) { e.preventDefault(); api.setCursor(clamp(cx + d[0]), clamp(cy + d[1])); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (e.key === 'Enter' && api.marker && api.marker.x === cx && api.marker.y === cy && h.onEnter) h.onEnter(); else api.place(cx, cy); }
    });
    return api;
  }

  /* ---------- two kinds of practice in one tool (a small switch above) ---------- */
  function twoModes(ctx, modes) {
    const P = ctx.panel;
    P.innerHTML = `<div class="seg cpmodes" role="group" aria-label="Kind of practice">${modes.map((m, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('')}</div><div class="cpsub"></div>`;
    const go = i => {
      $$('.cpmodes button', P).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
      const old = $('.cpsub', P), sub = document.createElement('div'); sub.className = 'cpsub'; old.replaceWith(sub);
      const c = Object.create(ctx); Object.defineProperty(c, 'panel', { value: sub });
      modes[i].run(c);
    };
    $$('.cpmodes button', P).forEach(b => b.onclick = () => go(+b.dataset.i));
    go(0);
  }

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Tap the grid to see a point&rsquo;s ordered pair, or type a pair to plot it. You can also use the arrow keys and the space bar.</p>
        <div class="cpguide"><div>${G.plane({ max: 10, label: 'A coordinate grid from 0 to 10' })}</div>
          <div><form class="cpform" autocomplete="off"><input class="textin" inputmode="numeric" value="3, 7" aria-label="An ordered pair to plot, like 3, 7"><button class="btn small" type="submit">Plot it</button></form>
            <div class="cperr" role="status"></div><div class="cpout" aria-live="polite"></div>
            <div class="rules">
              <div class="rule"><h3>An ordered pair</h3><p>Two numbers in order, like <b>(3, 7)</b>. The first is the <b>x-coordinate</b>: how far to go right. The second is the <b>y-coordinate</b>: how far to go up.</p><p>Run before you jump: go right (x) first, then up (y).</p></div>
              <div class="rule"><h3>Axes and the origin</h3><p>The <b>x-axis</b> is the flat line along the bottom. The <b>y-axis</b> is the line up the left side. They meet at the <b>origin</b>, <b>(0, 0)</b>.</p><p>A point on the x-axis has y = 0, like (5, 0). A point on the y-axis has x = 0, like (0, 5).</p></div>
              <div class="rule"><h3>Order matters</h3><p><b>(3, 7)</b> is 3 right and 7 up. <b>(7, 3)</b> is 7 right and 3 up. They are different points.</p></div>
              <div class="rule"><h3>Distances</h3><p>Two points with the same y are on a horizontal line: subtract the x-coordinates. (2, 5) to (8, 5) is 8 − 2 = <b>6</b> units. Same x? Subtract the y-coordinates.</p></div>
              <div class="rule"><h3>Shapes</h3><p>In these problems, the sides of a rectangle line up with the axes. A missing corner takes its x from one neighbor and its y from the other. The perimeter is width + height + width + height.</p></div>
              <div class="rule"><h3>Patterns</h3><p>Two rules make ordered pairs (A, B). Rule A: start at 0, add 2. Rule B: start at 0, add 4. The pairs (0, 0), (2, 4), (4, 8) line up, and each B is <b>2 times</b> its A.</p></div>
            </div></div></div>`;
      const out = $('.cpout', P), err = $('.cperr', P), svg = $('svg.cpl', P);
      const say = (x, y) => { out.innerHTML = `<b>${esc(pair(x, y))}</b>: go right ${x}, then up ${y}.${x === 0 && y === 0 ? ' This is the origin.' : x === 0 ? ' On the y-axis.' : y === 0 ? ' On the x-axis.' : ''}`; };
      const api = interactive(svg, 'Coordinate grid from 0 to 10. Arrow keys move the cursor. The space bar places a point.', { onPlace: (x, y) => { err.textContent = ''; say(x, y); }, onMove: (x, y) => { out.textContent = `Cursor at ${pair(x, y)}.`; } });
      $('.cpform', P).onsubmit = e => {
        e.preventDefault();
        const m = $('.cpform input', P).value.trim().match(/^\(?\s*(\d{1,2})\s*[, ]\s*(\d{1,2})\s*\)?$/);
        if (!m || +m[1] > 10 || +m[2] > 10) { err.textContent = 'Type two whole numbers from 0 to 10, like 3, 7.'; return; }
        api.place(+m[1], +m[2]);
      };
      api.place(3, 7);
    }
  };

  /* ===================== Tap the grid ===================== */
  function plotTool(ctx, cfg) {
    const P = ctx.panel, R = { list: [], i: 0, score: 0 };
    function start() { R.list = cfg.targets(); R.i = 0; R.score = 0; show(); }
    function show() {
      if (R.i >= R.list.length) {
        ctx.result(R.score, R.list.length, 'random'); ctx.sfx.win();
        P.innerHTML = `<h2>${esc(cfg.title)}</h2><div class="result">${SBT.starsHTML(R.score, R.list.length)}<p class="prompt">${R.score} out of ${R.list.length}</p><p class="lead">${R.score / R.list.length >= 0.8 ? 'Excellent work!' : 'Good practice. Read the explanations, then try another round.'}</p><div class="row center"><button class="btn" data-a="again">Play again</button></div></div>`;
        $('[data-a="again"]', P).onclick = start; return;
      }
      const it = R.list[R.i], last = R.i === R.list.length - 1; let tries = 0, done = false;
      P.innerHTML = `<h2>${esc(cfg.title)}</h2><p class="lead">${esc(cfg.lead)}</p>
        <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">Question ${R.i + 1} of ${R.list.length} &middot; Score ${R.score}</span></div>
        <div class="row qrow"><p class="qtext">${esc(it.text)}</p>${ctx.sayButton(it.say)}</div>
        ${G.plane({ max: it.max, pts: it.pts, label: 'A coordinate grid' })}
        <p class="cpread" aria-live="polite">Tap the grid to place your point.</p><div class="err" role="alert"></div><p class="explain why"></p>
        <div class="row center"><button type="button" class="btn" data-a="check" disabled>Check</button><button type="button" class="btn ghost" data-a="hint">Hint</button><button type="button" class="btn" data-a="next" hidden>${last ? 'See results' : 'Next'}</button></div>`;
      const read = $('.cpread', P), err = $('.err', P), why = $('.why', P), chk = $('[data-a="check"]', P), nx = $('[data-a="next"]', P), hb = $('[data-a="hint"]', P);
      const finish = () => { done = true; api.locked = true; chk.hidden = true; hb.hidden = true; nx.hidden = false; nx.focus(); why.textContent = it.why; };
      const check = () => {
        const m = api.marker; if (!m || done) return;
        if (m.x === it.x && m.y === it.y) {
          if (tries === 0) R.score++;
          ctx.credit(); ctx.sfx.good(); api.markClass('good'); err.style.color = 'var(--good-ink)'; err.textContent = `Correct! ${pair(it.x, it.y)}.`; finish();
        } else {
          tries++; ctx.slip(); ctx.sfx.bad(); err.style.color = '';
          if (tries >= 2) { api.reveal(it.x, it.y); err.textContent = `The point ${pair(it.x, it.y)} is the green one.`; if (ctx.miss) ctx.miss(it.text + ' (answer: ' + pair(it.x, it.y) + ')'); finish(); }
          else err.textContent = m.x === it.x ? 'Your x is right. Check y: how far up?' : m.y === it.y ? 'Your y is right. Check x: how far right?' : m.x === it.y && m.y === it.x ? 'You swapped x and y. Go right first, then up.' : 'Not quite. Try again.';
        }
      };
      const api = interactive($('svg.cpl', P), 'Coordinate grid. Arrow keys move the cursor. The space bar places your point. Enter checks it.', {
        onPlace: (x, y) => { chk.disabled = false; err.textContent = ''; read.textContent = `Your point: ${pair(x, y)}`; },
        onMove: (x, y) => { read.textContent = `Cursor at ${pair(x, y)}. Press the space bar to place your point.`; }, onEnter: check });
      chk.onclick = check; nx.onclick = () => { R.i++; show(); };
      hb.onclick = () => { err.style.color = 'var(--ink2)'; err.textContent = it.hint; };
      ctx.say(it.say);
    }
    start();
  }

  /* ===================== Tools built on the shared builders ===================== */
  const answerTool = (title, lead, kind, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind, rounds: 10, build: () => many(fn) }); } });
  const quizBuild = (ctx, title, lead, fn) => SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) });
  const randomOf = fns => () => fns[Math.floor(Math.random() * fns.length)]();

  const read = { init(ctx) { twoModes(ctx, [
    { label: 'Pick it', run: c => quizBuild(c, 'Read the point', 'Pick the ordered pair for point P.', () => G.readQ('mc')) },
    { label: 'Type it', run: c => SBT.answer(c, { title: 'Read the point', lead: 'Type the ordered pair for point P, like (3, 7).', kind: 'text', rounds: 10, build: () => many(() => G.readQ('text')) }) }]); } };
  const plot = { init(ctx) { plotTool(ctx, { title: 'Plot the point', lead: 'Tap the grid where the ordered pair belongs. Two tries.', targets: () => G.plotTargets(10) }); } };
  const distance = answerTool('Distances', 'Type how many units apart the two points are. Just the number.', 'number', () => G.distQ('num'));
  const shapes = answerTool('Shapes on the grid', 'Type the missing corner like (3, 7), or the perimeter as a number.', 'text', randomOf([() => G.cornerQ('text'), () => G.cornerQ('text'), () => G.perimQ('text')]));
  const patterns = { init(ctx) { twoModes(ctx, [
    { label: 'Pick it', run: c => quizBuild(c, 'Patterns', 'Two rules make ordered pairs. Pick the best answer.', randomOf([() => G.patNextQ('mc'), () => G.patNextQ('mc'), G.patRelQ])) },
    { label: 'Plot it', run: c => plotTool(c, { title: 'Patterns', lead: 'Find the next ordered pair of the two rules and tap it on the grid. Two tries.', targets: () => G.patternTargets(10) }) }]); } };
  const words = answerTool('Maps and word problems', 'Use the grid map. Type the ordered pair like (3, 7), or the number of blocks.', 'text', randomOf([() => G.coordOfQ('text'), () => G.endQ('text'), () => G.blocksQ('text'), () => G.endQ('text')]));

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const TYPES = [
    { gen: () => G.readQ('mc'), cards: [["What is an ordered pair?", "Two numbers in order, like (3, 7). The first is the x-coordinate (how far right) and the second is the y-coordinate (how far up)."], ["Which number do you go along first?", "The x-coordinate. Run before you jump: go right (x) before you go up (y)."]] },
    { gen: G.pickQ, cards: [["Are (3, 7) and (7, 3) the same point?", "No. (3, 7) is 3 right and 7 up. (7, 3) is 7 right and 3 up. The order matters."]] },
    { gen: G.axisQ, cards: [["What is the origin?", "The point (0, 0), where the x-axis and the y-axis meet. Every trip on the grid starts there."], ["How do you know a point is on the y-axis?", "Its x-coordinate is 0, like (0, 5). It has not moved right at all."], ["How do you know a point is on the x-axis?", "Its y-coordinate is 0, like (5, 0). It has not moved up at all."]] },
    { gen: () => G.distQ('mc'), cards: [["How far apart are two points on a horizontal line?", "They have the same y. Subtract the x-coordinates, larger minus smaller. (2, 5) to (8, 5) is 8 − 2 = 6 units."], ["How far apart are two points on a vertical line?", "They have the same x. Subtract the y-coordinates, larger minus smaller. (4, 1) to (4, 9) is 9 − 1 = 8 units."]] },
    { gen: () => G.cornerQ('mc'), cards: [["How do you find the missing corner of a rectangle on the grid?", "In these problems the sides line up with the axes. The missing corner takes its x from one neighbor and its y from the other."]] },
    { gen: () => G.perimQ('mc'), cards: [["How do you find the perimeter of a rectangle on the grid?", "Width is the difference of the x-coordinates, and height is the difference of the y-coordinates. Perimeter = width + height + width + height."]] },
    { gen: () => G.patNextQ('mc'), cards: [["How do you continue two patterns as ordered pairs?", "Add each rule's number to the last A number (x) and to the last B number (y). That gives the next ordered pair."]] },
    { gen: G.patRelQ, cards: [["How can two number patterns be related?", "Compare each B number with the A number beside it. B might be a multiple of A (2 times as large) or a fixed amount more (3 more than)."], ["What do the points of a pattern like this look like on the grid?", "They line up in a straight line."]] },
    { gen: G.placeAtQ, cards: [["How do you find a place on a grid map?", "Go right x, then up y. The place at that point is the one you want."]] },
    { gen: G.movesQ, cards: [["How do moves change an ordered pair?", "Right adds to x and left subtracts from x. Up adds to y and down subtracts from y."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about the coordinate plane. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'coordinate-plane', defaults: {}, tools: { guide, cards, read, plot, distance, shapes, patterns, words, quiz } });
})();
