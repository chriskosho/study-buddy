/* The Punic Wars: tools. Content is in data.js, the map outline is in mapdata.js (Natural Earth, public domain). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle, starsHTML } = SBT;
  const esc = SB.esc;
  const bc = y => y + ' B.C.';
  const ADDED = '<em class="added">added</em>';

  /* ===================== Drawings (original, drawn for this module) ===================== */
  const ART = {
    ship: `<svg viewBox="0 0 320 150" role="img" aria-label="Drawing of a Roman warship with a boarding bridge, the corvus, beside a Carthaginian ship"><rect width="320" height="150" fill="var(--sea)"/><path d="M0 118q20-9 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0v32H0z" fill="var(--navy)" opacity=".35"/>
      <g><path d="M30 96h120l-14 22H48z" fill="#8a5a33"/><rect x="88" y="42" width="3" height="54" fill="#5b3b20"/><path d="M91 46h36v34H91z" fill="#e4572e" opacity=".9"/><path d="M150 96l30-18" stroke="#5b3b20" stroke-width="5" stroke-linecap="round"/><path d="M178 78l6 2-4 6z" fill="#23313f"/></g>
      <g><path d="M170 100h120l-14 20h-92z" fill="#6c4a6e"/><rect x="226" y="48" width="3" height="52" fill="#4a2f4d"/><path d="M229 52h34v30h-34z" fill="#f6b73c"/><path d="M170 100l-10 8 14 2z" fill="#4a2f4d"/></g>
      <text x="90" y="138" font-size="11" fill="var(--ink)" text-anchor="middle" font-family="inherit" font-weight="700">Rome</text><text x="230" y="140" font-size="11" fill="var(--ink)" text-anchor="middle" font-family="inherit" font-weight="700">Carthage</text></svg>`,
    alps: `<svg viewBox="0 0 320 150" role="img" aria-label="Drawing of war elephants walking through snowy mountains, like the Alps"><rect width="320" height="150" fill="var(--sea)"/><path d="M0 120L60 40l35 45 40-60 55 80 40-50 90 85z" fill="#8fa3b8"/><path d="M60 40l-14 18 10-4 6 8 8-8zM135 25l-14 22 12-6 8 10 8-12zM230 70l-10 12 8-3 5 6 6-7z" fill="#fff"/><path d="M0 128q80-14 160-6t160-4v32H0z" fill="var(--paper)"/>
      <g fill="#6b6f78"><ellipse cx="90" cy="108" rx="30" ry="17"/><rect x="66" y="116" width="7" height="20" rx="2"/><rect x="80" y="118" width="7" height="18" rx="2"/><rect x="100" y="118" width="7" height="18" rx="2"/><rect x="111" y="116" width="7" height="20" rx="2"/><circle cx="125" cy="98" r="11"/><path d="M131 102q12 6 8 24" stroke="#6b6f78" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M129 106q9 3 12 10" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="118" cy="97" rx="5" ry="8" fill="#555a63"/></g>
      <g fill="#7d818a" transform="translate(120 12) scale(.72)"><ellipse cx="90" cy="108" rx="30" ry="17"/><rect x="66" y="116" width="7" height="20" rx="2"/><rect x="80" y="118" width="7" height="18" rx="2"/><rect x="100" y="118" width="7" height="18" rx="2"/><rect x="111" y="116" width="7" height="20" rx="2"/><circle cx="125" cy="98" r="11"/><path d="M131 102q12 6 8 24" stroke="#7d818a" stroke-width="6" fill="none" stroke-linecap="round"/></g></svg>`,
    fire: `<svg viewBox="0 0 320 150" role="img" aria-label="Drawing of a walled city burning"><rect width="320" height="150" fill="var(--sea)"/><rect y="118" width="320" height="32" fill="var(--paper)"/>
      <g fill="#a79a86"><rect x="40" y="76" width="40" height="44"/><rect x="92" y="62" width="34" height="58"/><rect x="140" y="82" width="46" height="38"/><rect x="198" y="68" width="36" height="52"/><rect x="246" y="86" width="34" height="34"/></g>
      <g fill="#7b6f5f"><rect x="52" y="90" width="9" height="14"/><rect x="104" y="76" width="9" height="14"/><rect x="154" y="96" width="9" height="14"/><rect x="210" y="82" width="9" height="14"/></g>
      <path d="M60 76q-14-26 2-44 4 14 12 18 0-12 6-22 14 22 2 48z" fill="#e4572e"/><path d="M104 62q-12-30 6-50 4 16 12 22 0-10 6-18 12 24 0 46z" fill="#f6b73c"/><path d="M206 68q-12-26 4-44 4 14 12 18 2-10 6-18 12 22 0 44z" fill="#e4572e"/><path d="M260 86q-8-20 4-32 3 10 9 13 1-8 5-14 8 18 0 33z" fill="#f6b73c"/>
      <path d="M70 30q10-14 4-26M118 14q12-12 6-24M216 22q10-14 4-24" stroke="#555a63" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/></svg>`
  };

  /* ===================== Study guide ===================== */
  const IMAGES = [
    ['hannibal-bust.jpg', 'Hannibal', 'A marble bust, thought to show Hannibal, in the National Archaeological Museum of Naples.'],
    ['scipio-bust.jpg', 'Scipio Africanus', 'A marble bust, thought to show Scipio Africanus, in the National Archaeological Museum of Naples.'],
    ['hannibal-alps.jpg', 'Hannibal crossing the Alps', 'J. M. W. Turner’s painting “Snow Storm: Hannibal and his Army Crossing the Alps”, 1812.'],
    ['battle-of-zama.jpg', 'The battle of Zama', 'A painting of Scipio and Hannibal at Zama, 202 B.C.'],
    ['cato-bust.jpg', 'Cato the Elder', 'A Roman marble portrait of Cato the Elder.'],
    ['elephant-coin.jpg', 'Carthaginian coin', 'A silver coin made by Carthage in Spain, with an elephant. Elephants were part of Carthage’s armies.'],
    ['ruins-of-carthage.jpg', 'Ruins of Carthage', 'A photo of the Antonine Baths, a Roman ruin built on the Carthage site, in Tunisia today.'],
    ['roman-warship.jpg', 'A Roman warship', 'A Roman relief carving of a warship, from Praeneste, now in the Vatican Museums.']
  ];
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const short = { war1: 'Carthage and the 1st war', war2: 'Hannibal and the 2nd war', war3: 'Results and the 3rd war' };
      const tabs = [...GUIDE.map(g => ({ id: g.id, label: short[g.id] })), { id: 'more', label: 'More to know (added)' }, { id: 'people', label: 'Who’s who' }, { id: 'pics', label: 'Pictures' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Everything from the Punic Wars class notes. “More to know” is background added for this module, and it is not in your notes.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${tabs.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div><div class="gbody"></div>`;
      const body = $('.gbody', P);
      function show(id) {
        const g = GUIDE.find(x => x.id === id);
        if (g) {
          const i = GUIDE.indexOf(g);
          body.innerHTML = `<div class="gwrap"><div class="gart">${ART[g.art]}</div><div><h3>${esc(g.label)}</h3>
            <table class="ttable"><tbody>${g.rows.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${esc(d)}</td><td class="s">${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</td></tr>`).join('')}</tbody></table>
            <div class="summ"><div class="eyebrow">Summary</div><p>${esc(SUMMARIES[i])}</p>${ctx.sayButton(SUMMARIES[i], 'Hear the summary')}</div></div></div>`;
        } else if (id === 'more') {
          body.innerHTML = `<h3>More to know ${ADDED}</h3><p class="note">Added for this module. Your quiz, Type the answer, and Explain it questions use only your notes.</p>
            <div class="more">${MORE.map(([t, d]) => `<div class="mk"><b>${esc(t)}</b><span>${esc(d)}</span>${ctx.sayButton(t + '. ' + d, 'Hear ' + t)}</div>`).join('')}</div>`;
        } else if (id === 'people') {
          body.innerHTML = `<h3>Who’s who</h3><div class="people">${PEOPLE.map(p => `<div class="person${p.notes ? '' : ' extra'}"><b>${esc(p.name)}</b><span class="role">${esc(p.what)}</span><p>${esc(p.line)}</p>${ctx.sayButton(p.name + '. ' + p.line, 'Hear ' + p.name)}</div>`).join('')}</div>`;
        } else {
          body.innerHTML = `<h3>Pictures</h3><p class="note">Busts, paintings, and photos from museums. A card shows its picture once the file is added to the module’s img folder.</p>
            <div class="pics">${IMAGES.map(([f, t, c]) => `<figure class="pic"><div class="frame"><img src="img/${f}" alt="${esc(t)}" loading="lazy"><span class="slot">Picture to add<br><small>img/${esc(f)}</small></span></div><figcaption><b>${esc(t)}</b> ${esc(c)}</figcaption></figure>`).join('')}</div>`;
          $$('.pic img', body).forEach(im => { im.onerror = () => im.remove(); im.onload = () => im.closest('.frame').classList.add('has'); });
        }
      }
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show(tabs[0].id);
    }
  };

  /* ===================== Timeline ===================== */
  const timeline = {
    init(ctx) {
      const P = ctx.panel, A = 280, Z = 140, X = y => 20 + (A - y) / (A - Z) * 760;
      const strip = `<svg class="tstrip" viewBox="0 0 800 70" role="img" aria-label="The three Punic Wars on a line from 280 to 140 B.C.">
        <line x1="20" y1="40" x2="780" y2="40" stroke="var(--line)" stroke-width="4"/>
        ${[280, 260, 240, 220, 200, 180, 160, 140].map(y => `<g><line x1="${X(y)}" y1="36" x2="${X(y)}" y2="44" stroke="var(--ink2)" stroke-width="2"/><text x="${X(y)}" y="62" font-size="12" text-anchor="middle" fill="var(--ink2)" font-family="inherit">${y}</text></g>`).join('')}
        ${WARS.map(w => `<g><rect x="${X(w.from)}" y="22" width="${Math.max(10, X(w.to) - X(w.from))}" height="14" rx="5" fill="${['var(--coral)', 'var(--teal)', 'var(--navy)'][w.n - 1]}"/><text x="${(X(w.from) + X(w.to)) / 2}" y="16" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)" font-family="inherit">${w.n === 1 ? '1st' : w.n === 2 ? '2nd' : '3rd'}</text></g>`).join('')}</svg>`;
      P.innerHTML = `<h2>Timeline</h2><p class="lead">Dates count backward, because they are B.C. The notes give the wars and what happened; the dates and the events marked “added” are for this module. Tap an event to read more, or use its speaker to hear it.</p>${strip}
        <div class="tcols">${WARS.map(w => `<section><h3 class="w${w.n}">${esc(w.label)}<small>${bc(w.from)} to ${bc(w.to)}</small></h3>${TIMELINE.filter(e => e.war === w.n).map(e => `<div class="tev${e.notes ? '' : ' extra'}" data-y="${e.y}"><div><b>${bc(e.y)}</b>${e.notes ? '' : ADDED}<span class="tt">${esc(e.t)}</span><span class="td">${esc(e.d)}</span></div>${ctx.sayButton(bc(e.y) + '. ' + e.t + '. ' + e.d, 'Hear ' + bc(e.y))}</div>`).join('')}</section>`).join('')}</div>`;
      $$('.tev', P).forEach(b => b.onclick = () => $$('.tev', P).forEach(x => x.classList.toggle('on', x === b)));
    }
  };

  /* ===================== Map ===================== */
  const px = lon => (lon - PMAP.w0) * PMAP.kx, py = lat => (PMAP.n0 - lat) * PMAP.ky;
  const pts = r => r.map(([lo, la]) => px(lo).toFixed(1) + ',' + py(la).toFixed(1)).join(' ');
  function mapSVG(opts = {}) {
    const lab = opts.labels !== false;
    const dot = p => {
      const x = px(p.lon), y = py(p.lat);
      const L = { rome: [13, -9, 'start'], sicily: [0, -16, 'middle'], syracuse: [14, 20, 'start'], cannae: [13, 6, 'start'], carthage: [-13, -8, 'end'], zama: [13, 6, 'start'], numidia: [-13, 6, 'end'], sardinia: [13, 6, 'start'], alps: [-13, 5, 'end'], spain: [-13, 5, 'end'] }[p.id] || [13, 5, 'start'];
      return `<g class="pt${p.notes ? '' : ' extra'}" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}"><circle class="hit" cx="${x}" cy="${y}" r="22"/><circle class="dot" cx="${x}" cy="${y}" r="${p.notes ? 8 : 6}"/>${lab ? `<text class="pl" x="${x + L[0]}" y="${y + L[1]}" text-anchor="${L[2]}">${esc(p.name)}</text>` : ''}</g>`;
    };
    return `<svg class="pmap" viewBox="0 0 ${PMAP.width} ${PMAP.height}" role="group" aria-label="Map of the western Mediterranean"><rect width="${PMAP.width}" height="${PMAP.height}" class="sea"/><path class="land" d="${PMAP.land}"/>
      <polyline class="route hr" points="${pts(HANNIBAL)}"/><polyline class="route sr" points="${pts(SCIPIO)}"/>${PLACES.map(dot).join('')}</svg>`;
  }
  const study = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study map</h2><p class="lead">Tap a place to hear about it. Places marked “added” are not in your notes.</p>
        <div class="mrow"><div class="mwrap">${mapSVG()}</div><aside class="minfo"><div class="mcard"><b>Rome and Carthage</b><p>Tap a dot on the map.</p></div>
        <label class="chk"><input type="checkbox" id="hr"> Show Hannibal’s march ${ADDED}</label><label class="chk"><input type="checkbox" id="sr"> Show Scipio’s attack ${ADDED}</label></aside></div>`;
      const svg = $('.pmap', P), card = $('.mcard', P);
      $('#hr', P).onchange = e => svg.classList.toggle('showH', e.target.checked);
      $('#sr', P).onchange = e => svg.classList.toggle('showS', e.target.checked);
      const pick = id => { const p = PLACES.find(x => x.id === id); $$('.pt', svg).forEach(g => g.classList.toggle('on', g.dataset.id === id)); const t = p.name + '. ' + p.d.replace(/^Added: /, ''); card.innerHTML = `<b>${esc(p.name)}</b> ${p.notes ? '' : ADDED}<p>${esc(p.d)}</p>${ctx.sayButton(t, 'Hear ' + p.name)}`; ctx.say(t); };
      $$('.pt', svg).forEach(g => { g.onclick = () => pick(g.dataset.id); g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g.dataset.id); } }; });
    }
  };
  const listen = {
    init(ctx) {
      const P = ctx.panel, R = { list: [], i: 0, score: 0, tries: 0 };
      function start() { R.list = shuffle(PLACES).slice(0, 10); R.i = 0; R.score = 0; show(); }
      function show() {
        if (R.i >= R.list.length) { ctx.result(R.score, R.list.length); ctx.sfx.win(); P.innerHTML = `<h2>Listen and tap</h2><div class="result">${starsHTML(R.score, R.list.length)}<p class="prompt">${R.score} out of ${R.list.length}</p><p class="lead">${R.score >= 8 ? 'Excellent! You know the map.' : 'Good practice. Look at the Study map, then try again.'}</p><button class="btn" data-a="again">Play again</button></div>`; $('[data-a="again"]', P).onclick = start; return; }
        const p = R.list[R.i]; R.tries = 0;
        P.innerHTML = `<h2>Listen and tap</h2><div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">Question ${R.i + 1} of ${R.list.length} &middot; Score ${R.score}</span></div>
          <div class="row qrow"><p class="qtext">Tap <b>${esc(p.name)}</b></p>${ctx.sayButton('Tap ' + p.name, 'Hear it again')}</div><div class="mwrap game">${mapSVG({ labels: false })}</div><p class="msg" role="status"></p>`;
        const svg = $('.pmap', P), msg = $('.msg', P);
        $$('.pt', svg).forEach(g => g.onclick = () => {
          if (svg.classList.contains('done')) return;
          if (g.dataset.id === p.id) { if (R.tries === 0) R.score++; ctx.credit(); ctx.sfx.good(); g.classList.add('right'); svg.classList.add('done'); msg.textContent = 'Yes! ' + p.name + '. ' + p.d.replace(/^Added: /, ''); setTimeout(() => { R.i++; show(); }, 1500); }
          else { R.tries++; ctx.slip(); ctx.sfx.bad(); g.classList.add('wrong'); msg.textContent = R.tries >= 2 ? 'That is ' + PLACES.find(x => x.id === g.dataset.id).name + '. Look for the glowing dot.' : 'Not that one. Try again.'; if (R.tries >= 2) { $(`.pt[data-id="${p.id}"]`, svg).classList.add('hint'); } }
        });
        ctx.say('Tap ' + p.name);
      }
      start();
    }
  };
  const find = {
    init(ctx) {
      const P = ctx.panel, S = { found: 0, left: 60, tim: 0, order: [], i: 0, over: false };
      P.innerHTML = `<h2>Find it</h2><p class="lead">60 seconds. Tap each place as its name comes up. Skip with the Pass button.</p><button class="btn" data-a="go">Start</button>`;
      $('[data-a="go"]', P).onclick = go;
      function go() {
        S.found = 0; S.left = 60; S.over = false; S.order = shuffle(PLACES); S.i = 0;
        P.innerHTML = `<h2>Find it</h2><div class="row qrow"><p class="qtext">Find <b class="tgt"></b></p><span class="hint tinfo"></span><button class="btn ghost" data-a="pass">Pass</button></div><div class="mwrap game">${mapSVG({ labels: false })}</div>`;
        const svg = $('.pmap', P), tgt = $('.tgt', P), info = $('.tinfo', P);
        const upd = () => { tgt.textContent = S.order[S.i % S.order.length].name; info.textContent = S.left + ' seconds · Found ' + S.found; };
        const nextOne = () => { S.i++; if (S.i % S.order.length === 0) S.order = shuffle(PLACES); upd(); };
        $$('.pt', svg).forEach(g => g.onclick = () => { if (S.over) return; if (g.dataset.id === S.order[S.i % S.order.length].id) { S.found++; ctx.credit(); ctx.sfx.good(); nextOne(); } else { ctx.slip(); ctx.sfx.bad(); g.classList.add('wrong'); setTimeout(() => g.classList.remove('wrong'), 400); } });
        $('[data-a="pass"]', P).onclick = nextOne;
        upd(); clearInterval(S.tim);
        S.tim = setInterval(() => { if (!document.body.contains(svg)) { clearInterval(S.tim); return; } S.left--; if (S.left <= 0) { clearInterval(S.tim); S.over = true; ctx.result(S.found, 60); ctx.sfx.win(); P.innerHTML = `<h2>Find it</h2><div class="result"><p class="prompt">You found ${S.found}</p><p class="lead">${S.found >= 10 ? 'Excellent! You know the map.' : 'Good practice. Look at the Study map, then try again.'}</p><button class="btn" data-a="again">Play again</button></div>`; $('[data-a="again"]', P).onclick = go; } else upd(); }, 1000);
      }
    }
  };

  /* ===================== Flashcards, Quiz, Type, Order, Explain ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, { modes: [{ id: 'terms', label: 'Class notes terms' }], build: () => shuffle(CARDS).map(([t, d]) => ({
        front: `<div class="tag">What does this mean?</div><div class="big">${esc(t)}</div>`,
        back: `<div class="tag">Answer</div><div class="defline">${esc(d)}</div>${ctx.sayButton(t + '. ' + d, 'Hear it')}`, say: 'What does ' + t + ' mean?' })) });
    }
  };
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, lead: 'Pick the best answer.', build: () => shuffle(QUIZ).slice(0, 10) }); } };
  const type = {
    init(ctx) {
      SBT.answer(ctx, { title: 'Type the answer', kind: 'text', typo: true, skip: true, rounds: 10,
        lead: 'Type the missing word, then press Check. Two tries, and you can skip one for review.',
        build: () => shuffle(TYPE).map(t => ({ q: esc(t.q).replace(/_{3,}/g, '<span class="blank">______</span>'), say: t.q.replace(/_{3,}/g, 'blank'), a: t.a, noTypo: t.noTypo })) });
    }
  };
  const order = {
    init(ctx) {
      const set = (id, label, pick) => ({ id, label, items: EVENTS.filter(e => e.set === id), pick });
      SBT.order(ctx, { lead: 'Put the events in the order they happened. Drag the cards, or use the arrows. Then press Check.', sets: [set('wars', 'The three wars'), set('war2', 'The 2nd Punic War'), set('story', 'The whole story', 6)] });
    }
  };
  const explain = { init(ctx) { SBT.explain(ctx, { items: EXPLAIN, rounds: 5, keepFirst: true }); } };

  SBM.start({ module: 'punic-wars', defaults: {}, tools: { guide, timeline, study, listen, find, cards, quiz, type, order, explain } });
})();
