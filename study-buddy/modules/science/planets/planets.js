/* The Planets: tools. Content is in data.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle, starsHTML, setMsg } = SBT;
  const esc = SB.esc, fmt = n => n.toLocaleString('en-US');
  const BY = Object.fromEntries(PLANETS.map(p => [p.id, p]));
  const EARTH = BY.earth;
  const disc = (p, size) => `<span class="planet p-${p.look}" style="--s:${size}px" aria-hidden="true"></span>`;
  const sizeFor = p => Math.round(16 + 112 * Math.pow(p.diameter / 142984, 0.62));
  const vsEarth = p => { const r = p.diameter / EARTH.diameter; return p.id === 'earth' ? 'our home planet' : r >= 1.5 ? `about ${Math.round(r)} times as wide as Earth` : r > 0.9 ? 'about the same size as Earth' : r > 0.45 ? 'about half as wide as Earth' : 'a little more than a third as wide as Earth'; };
  const tempText = t => `${t}°C (${Math.round(t * 9 / 5 + 32)}°F)`;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Tap a planet to learn about it. Bigger planets are drawn bigger, but sizes and distances are not to scale.</p>
        <div class="system" role="group" aria-label="The planets in order from the Sun"><span class="sun" aria-hidden="true"></span>
          ${PLANETS.map((p, i) => `${i === 4 ? '<span class="belt" title="Asteroid belt" aria-hidden="true"></span>' : ''}<button class="pbtn" data-id="${p.id}" aria-label="${p.name}">${disc(p, sizeFor(p))}<span class="pname">${p.name}</span></button>`).join('')}
        </div>
        <div class="pgridx"><div class="pcard" aria-live="polite"></div><div class="solar">${SOLAR.map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div></div>`;
      const card = $('.pcard', P);
      const show = id => {
        const p = BY[id], n = PLANETS.indexOf(p) + 1;
        $$('.pbtn', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
        const speech = `${p.name}. Planet number ${n} from the Sun. ${p.facts.join(' ')}`;
        card.innerHTML = `<div class="row between"><div class="row">${disc(p, 46)}<div><h3>${p.name}</h3><span class="hint">Planet ${n} from the Sun &middot; ${p.type}</span></div></div>${ctx.sayButton(speech, 'Hear about ' + p.name)}</div>
          <ul class="pfacts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <dl class="pstats"><div><dt>Size</dt><dd>${fmt(p.diameter)} km wide, ${vsEarth(p)}</dd></div><div><dt>Distance from the Sun</dt><dd>${p.distance >= 1000 ? (p.distance / 1000).toFixed(1) + ' billion' : Math.round(p.distance) + ' million'} km</dd></div>
          <div><dt>Time to spin once</dt><dd>${p.spin}</dd></div><div><dt>One trip around the Sun (a year)</dt><dd>${p.yearText}</dd></div>
          <div><dt>Average temperature</dt><dd>${tempText(p.temp)}</dd></div><div><dt>Moons</dt><dd>${p.moons}</dd></div></dl>`;
      };
      $$('.pbtn', P).forEach(b => b.onclick = () => show(b.dataset.id));
      show('earth');
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'name', label: 'Name the planet' }, { id: 'facts', label: 'Planet facts' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, fullQ());
          return shuffle(PLANETS).map(p => mode === 'name'
            ? { front: `<div class="tag">Which planet is this?</div><div class="defline">${esc(p.clues[1])} ${esc(p.clues[2])}</div>`, back: `<div class="tag">Answer</div>${disc(p, 90)}<div class="big">${p.name}</div><div class="small">Planet ${PLANETS.indexOf(p) + 1} from the Sun</div>`, say: p.clues[1] + ' ' + p.clues[2] }
            : { front: `<div class="tag">What do you know about this planet?</div>${disc(p, 110)}<div class="big">${p.name}</div>`, back: `<div class="tag">${p.name}</div><ul class="cardfacts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>${ctx.sayButton(p.name + '. ' + p.facts.join(' '), 'Hear it')}`, say: 'What do you know about ' + p.name + '?' });
        }
      });
    }
  };

  /* ===================== Put in order ===================== */
  const order = {
    init(ctx) {
      SBT.order(ctx, {
        lead: 'Drag the planets into order, or use the arrows. Then press Check.',
        sets: [
          { id: 'sun', label: 'From the Sun', items: PLANETS.map(p => ({ text: p.name, sub: p.type })), hint: 'Closest to the Sun at the top.' },
          { id: 'size', label: 'By size', items: [...PLANETS].sort((a, b) => a.diameter - b.diameter).map(p => ({ text: p.name, sub: fmt(p.diameter) + ' km wide' })), hint: 'Smallest at the top, largest at the bottom.' }
        ]
      });
    }
  };

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        sets: [
          { id: 'type', label: 'Kind of planet', buckets: [{ id: 'Rocky', name: 'Rocky' }, { id: 'Gas giant', name: 'Gas giant' }, { id: 'Ice giant', name: 'Ice giant' }], items: PLANETS.map(p => ({ text: p.name, b: p.type })) },
          { id: 'moons', label: 'Moons', buckets: [{ id: 'none', name: 'No moons' }, { id: 'few', name: '1 or 2 moons' }, { id: 'many', name: 'Many moons' }], items: PLANETS.map(p => ({ text: p.name, b: p.moonCount === 0 ? 'none' : p.moonCount <= 2 ? 'few' : 'many' })) }
        ],
        right: (it, b) => 'Yes! ' + it.text + ' goes in ' + b.name + '.'
      });
    }
  };

  /* ===================== Quiz ===================== */
  const madeQuestions = () => [
    ...PLANETS.map((p, i) => ({ q: `Which planet is number ${i + 1} from the Sun?`, a: p.name, wrong: shuffle(PLANETS.filter(x => x !== p)).slice(0, 3).map(x => x.name) })),
    ...PLANETS.map(p => ({ q: `What kind of planet is ${p.name}?`, a: p.type, wrong: ['Rocky', 'Gas giant', 'Ice giant', 'Dwarf planet'].filter(t => t !== p.type).slice(0, 3) }))
  ];
  /* the made questions skip anything a chosen question already asks in other words (closest = number 1, the ice giants) */
  const overlaps = (q, txt) => (/number 1 from/.test(q.q) && /closest/i.test(txt)) || (/number 8 from/.test(q.q) && /farthest/i.test(txt))
    || (/What kind of planet is/.test(q.q) && ((q.a === 'Ice giant' && /ice giant/i.test(txt)) || (q.a === 'Gas giant' && /gas giant/i.test(txt)) || (q.a === 'Rocky' && /rocky/i.test(txt))));
  const fullQ = () => [...PQUIZ, ...madeQuestions()];
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, full: fullQ, build: () => { const chosen = shuffle(PQUIZ).slice(0, 7), txt = chosen.map(q => q.q + ' ' + q.a).join(' ');
    return [...chosen, ...shuffle(madeQuestions()).filter(q => !overlaps(q, txt)).slice(0, 3)]; } }); } };

  /* ===================== Which is more? ===================== */
  const MEASURES = [
    { key: 'diameter', q: 'Which planet is bigger?', say: (p) => `${p.name}: ${fmt(p.diameter)} km wide` },
    { key: 'distance', q: 'Which planet is farther from the Sun?', say: (p) => `${p.name}: ${p.distance >= 1000 ? (p.distance / 1000).toFixed(1) + ' billion' : Math.round(p.distance) + ' million'} km` },
    { key: 'year', q: 'Which planet takes longer to go around the Sun?', say: (p) => `${p.name}: ${p.yearText}` },
    { key: 'temp', q: 'Which planet is hotter on average?', say: (p) => `${p.name}: ${tempText(p.temp)}` },
    { key: 'spinH', q: 'Which planet takes longer to spin around once?', say: (p) => `${p.name}: ${p.spin}` }
  ];
  const compare = {
    init(ctx) {
      const P = ctx.panel, C = { list: [], i: 0, score: 0, answered: false };
      function makeRound() {
        const out = [], seen = new Set();
        while (out.length < 10) {
          const m = MEASURES[Math.floor(Math.random() * MEASURES.length)], [a, b] = shuffle(PLANETS).slice(0, 2), k = m.key + [a.id, b.id].sort();
          if (seen.has(k) || a[m.key] === b[m.key]) continue;
          if (m.key === 'diameter' && Math.max(a.diameter, b.diameter) / Math.min(a.diameter, b.diameter) < 1.06) continue;   // Venus/Earth, Uranus/Neptune are too close to call
          if (m.key === 'temp' && [a.id, b.id].sort().join() === 'neptune,uranus') continue;   // practically the same temperature
          seen.add(k); out.push({ m, a, b });
        }
        return out;
      }
      function start() { C.list = makeRound(); C.i = 0; C.score = 0; show(); }
      function show() {
        if (C.i >= C.list.length) {
          ctx.result(C.score, C.list.length); ctx.sfx.win();
          P.innerHTML = `<h2>Which is more?</h2><div class="result">${starsHTML(C.score, C.list.length)}<p class="prompt">${C.score} out of ${C.list.length}</p><p class="lead">${C.score >= 8 ? 'You really know your planets!' : 'Look at the planet cards in the study guide, then try again.'}</p><button class="btn" data-a="again">Play again</button></div>`;
          $('[data-a="again"]', P).onclick = start; return;
        }
        const { m, a, b } = C.list[C.i], win = a[m.key] > b[m.key] ? a : b; C.answered = false;
        P.innerHTML = `<h2>Which is more?</h2><p class="lead">Think about what you know, then pick one.</p>
          <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${C.i / C.list.length * 100}%"></i></div><span class="hint">Question ${C.i + 1} of ${C.list.length} &middot; Score ${C.score}</span></div>
          <div class="row qrow"><p class="qtext">${m.q}</p>${ctx.sayButton(m.q + ' ' + a.name + ' or ' + b.name, 'Hear the question')}</div>
          <div class="versus">${[a, b].map(p => `<button class="vbtn" data-id="${p.id}">${disc(p, 80)}<span>${p.name}</span><small></small></button>`).join('')}</div>
          <p class="explain"></p><div class="row center"><button class="btn" data-a="next" hidden>${C.i === C.list.length - 1 ? 'See results' : 'Next'}</button></div>`;
        $$('.vbtn', P).forEach(btn => btn.onclick = () => {
          if (C.answered) return; C.answered = true;
          const ok = btn.dataset.id === win.id;
          $$('.vbtn', P).forEach(x => { x.disabled = true; const p = BY[x.dataset.id]; x.querySelector('small').textContent = m.say(p).split(': ')[1]; if (p === win) x.classList.add('right'); });
          if (ok) { C.score++; ctx.credit(); ctx.sfx.good(); } else { btn.classList.add('wrong'); ctx.slip(); ctx.sfx.bad(); }
          let why = `${m.say(a)}. ${m.say(b)}.`;
          if (m.key === 'spinH' && [a.id, b.id].sort().join() === 'mercury,venus') why += ' Venus spins the slowest of all the planets.';
          if (m.key === 'temp' && (a.id === 'venus' || b.id === 'venus') && (a.id === 'mercury' || b.id === 'mercury')) why += ' Venus is hotter even though Mercury is closer, because Venus’s thick air traps heat.';
          $('.explain', P).innerHTML = (ok ? '<b style="color:var(--good)">Correct!</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + esc(why);
          const nx = $('[data-a="next"]', P); nx.hidden = false; nx.focus();
        });
        $('[data-a="next"]', P).onclick = () => { C.i++; show(); };
        ctx.say(m.q + ' ' + a.name + ' or ' + b.name + '?');
      }
      start();
    }
  };

  /* ===================== Which planet am I? ===================== */
  const riddle = {
    init(ctx) {
      const P = ctx.panel, R = { list: [], i: 0, score: 0, clue: 0, done: false };
      function start() { R.list = shuffle(PLANETS); R.i = 0; R.score = 0; show(); }
      function show() {
        if (R.i >= R.list.length) {
          ctx.result(R.score, R.list.length); ctx.sfx.win();
          P.innerHTML = `<h2>Which planet am I?</h2><div class="result">${starsHTML(R.score, R.list.length)}<p class="prompt">${R.score} out of ${R.list.length} on the first clue</p><p class="lead">${R.score >= 7 ? 'Insane! You are a planet expert.' : 'The first clues are the hardest. Try again to beat your score.'}</p><button class="btn" data-a="again">Play again</button></div>`;
          $('[data-a="again"]', P).onclick = start; return;
        }
        const p = R.list[R.i]; R.clue = 0; R.done = false;
        P.innerHTML = `<h2>Which planet am I?</h2><p class="lead">Guess from the first clue to score. A wrong guess shows the next clue.</p>
          <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">Planet ${R.i + 1} of ${R.list.length} &middot; Score ${R.score}</span></div>
          <ol class="clues"></ol>
          <div class="pick">${PLANETS.map(x => `<button class="pbtn" data-id="${x.id}">${disc(x, 42)}<span class="pname">${x.name}</span></button>`).join('')}</div>
          <p class="msg"></p><div class="row"><button class="btn" data-a="next" hidden>${R.i === R.list.length - 1 ? 'See results' : 'Next planet'}</button></div>`;
        const clues = $('.clues', P), msg = $('.msg', P), next = $('[data-a="next"]', P);
        const addClue = () => { const li = document.createElement('li'); li.innerHTML = `${esc(p.clues[R.clue])} ${ctx.sayButton(p.clues[R.clue], 'Hear the clue')}`; clues.appendChild(li); ctx.say(p.clues[R.clue]); };
        addClue();
        $$('.pick .pbtn', P).forEach(b => b.onclick = () => {
          if (R.done) return;
          if (b.dataset.id === p.id) {
            R.done = true; if (R.clue === 0) R.score++; ctx.credit(); ctx.sfx.good(); b.classList.add('right');
            setMsg(msg, `Yes! I am ${p.name}.` + (R.clue === 0 ? ' First clue!' : ''), 'good'); next.hidden = false; next.focus();
          } else {
            ctx.slip(); ctx.sfx.bad(); b.classList.add('wrong'); b.disabled = true;
            if (R.clue < p.clues.length - 1) { R.clue++; addClue(); setMsg(msg, `Not ${BY[b.dataset.id].name}. Here is another clue.`, 'bad'); }
            else { R.done = true; $(`.pick .pbtn[data-id="${p.id}"]`, P).classList.add('right'); setMsg(msg, `I am ${p.name}.`, 'bad'); next.hidden = false; }
          }
        });
        next.onclick = () => { R.i++; show(); };
      }
      start();
    }
  };

  SBM.start({ module: 'planets', defaults: {}, tools: { guide, cards, order, sort, quiz, compare, riddle } });
})();
