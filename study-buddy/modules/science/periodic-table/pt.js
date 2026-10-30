/* The Periodic Table: tools. Element data is in data.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle, starsHTML, setMsg } = SBT;
  const esc = SB.esc;
  const BYSYM = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));
  const BYN = Object.fromEntries(ELEMENTS.map(e => [e.n, e]));
  const LATIN = { Na: 'natrium', K: 'kalium', Fe: 'ferrum', Cu: 'cuprum', Ag: 'argentum', Sn: 'stannum', Sb: 'stibium', Au: 'aurum', Hg: 'hydrargyrum', Pb: 'plumbum', W: 'wolfram' };
  const COMMON = ELEMENTS.filter(e => e.n <= 36).concat(['Ag', 'Sn', 'I', 'Xe', 'Ba', 'W', 'Pt', 'Au', 'Hg', 'Pb', 'Rn', 'Ra', 'U', 'Pu'].map(s => BYSYM[s]));
  const KNOWN = ELEMENTS.filter(e => e.cat !== 'un');
  const cs = e => `--c:${CATS[e.cat].color};--i:${CATS[e.cat].ink}`;
  const tile = (e, big) => `<span class="eltile${big ? ' big' : ''}" style="${cs(e)}"><small>${e.n}</small><b>${e.sym}</b><span>${e.name}</span></span>`;

  /* ---------- the table ---------- */
  function cellPos(e) {
    if (e.cat === 'la') return [e.n - 57 + 3, 9];
    if (e.cat === 'ac') return [e.n - 89 + 3, 10];
    return [e.group, e.period];
  }
  function tableHTML(extra = '') {
    return `<div class="ptable-grid" role="grid" aria-label="Periodic table">
      ${ELEMENTS.map(e => { const [c, r] = cellPos(e); return `<button class="el" data-n="${e.n}" style="grid-column:${c};grid-row:${r};${cs(e)}" aria-label="${e.n} ${e.name}"><small>${e.n}</small><b>${e.sym}</b><span>${e.name}</span></button>`; }).join('')}
      <span class="el ph" style="grid-column:3;grid-row:6" aria-hidden="true"><small>57–71</small></span>
      <span class="el ph" style="grid-column:3;grid-row:7" aria-hidden="true"><small>89–103</small></span>
      <span class="gap" style="grid-column:1/-1;grid-row:8" aria-hidden="true"></span>
      ${extra}</div>`;
  }

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Tap any element. Tap a color in the key to light up that family.</p>
        <div class="tablewrap ptwrap">${tableHTML('<div class="eldetail" style="grid-column:3/13;grid-row:1/4" aria-live="polite"></div>')}</div>
        <div class="legend" role="group" aria-label="Element families">${Object.entries(CATS).map(([k, c]) => `<button data-cat="${k}" style="--c:${c.color};--i:${c.ink}">${c.name}</button>`).join('')}</div>`;
      const detail = $('.eldetail', P);
      /* "How the table works" shows in the empty space at the top of the table until an element is tapped */
      const showIdeas = () => {
        $$('.el[data-n]', P).forEach(b => b.classList.remove('sel'));
        detail.innerHTML = `<div class="ideas">${IDEAS.map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>`;
      };
      const show = n => {
        const e = BYN[n], c = CATS[e.cat];
        $$('.el[data-n]', P).forEach(b => b.classList.toggle('sel', +b.dataset.n === n));
        const where = e.group ? `Group ${e.group}, period ${e.period}` : `Period ${e.period}, in the ${c.name.toLowerCase()} row`;
        const fact = FACTS[e.sym] || (e.cat === 'un' ? 'Only a few atoms of it have ever been made in a lab.' : '');
        detail.innerHTML = `${tile(e, true)}<div class="eltext"><h3>${e.name} <span class="hint">${e.sym}</span></h3>
          <div class="hint">Atomic number ${e.n} &middot; ${c.name} &middot; ${where} &middot; ${e.state === 'Unknown' ? 'State unknown' : e.state + ' at room temperature'}</div>
          ${fact ? `<p>${esc(fact)}</p>` : ''}<button class="linkbtn" data-a="ideas">How the table works</button></div>${ctx.sayButton(`${e.name}. Symbol ${e.sym.split('').join(' ')}. Atomic number ${e.n}. ${fact}`, 'Hear about ' + e.name)}`;
        $('[data-a="ideas"]', detail).onclick = showIdeas;
      };
      $$('.el[data-n]', P).forEach(b => b.onclick = () => show(+b.dataset.n));
      $$('.legend button', P).forEach(b => b.onclick = () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        $$('.legend button', P).forEach(x => x.setAttribute('aria-pressed', on && x === b));
        $('.ptable-grid', P).classList.toggle('filtering', on);
        $$('.el[data-n]', P).forEach(x => x.classList.toggle('lit', on && BYN[+x.dataset.n].cat === b.dataset.cat));
      });
      showIdeas();
    }
  };

  /* ===================== Flashcards ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'first', label: 'First 20' }, { id: 'common', label: 'Common elements' }, { id: 'name', label: 'Name to symbol' }, { id: 'quizq', label: 'Every quiz question' }],
        build(mode) {
          if (mode === 'quizq') return SBT.quizCards(ctx, fullQ());
          if (mode === 'name') return shuffle(POOL).map(e => ({
            front: `<div class="tag">What is the symbol?</div><div class="big">${e.name}</div>`,
            back: `<div class="tag">Answer</div>${tile(e, true)}<div class="small">${CATS[e.cat].name}</div>`, say: 'What is the symbol for ' + e.name + '?' }));
          const pool = mode === 'first' ? ELEMENTS.filter(e => e.n <= 20) : shuffle(COMMON);
          return shuffle(pool).map(e => ({
            front: `<div class="tag">Which element is this?</div><div class="bigsym">${e.sym}</div>`,
            back: `<div class="tag">Answer</div><div class="big">${e.name}</div><div class="small">Atomic number ${e.n} &middot; ${CATS[e.cat].name}</div>${FACTS[e.sym] ? `<div class="small">${esc(FACTS[e.sym])}</div>` : ''}`,
            say: 'Which element has the symbol ' + e.sym.split('').join(' ') + '?' }));
        }
      });
    }
  };

  /* ===================== Quiz ===================== */
  const POOL = ELEMENTS.filter(e => e.n <= 36);
  function madeQuestion(e) {
    const pool = POOL;
    const others = n => shuffle(pool.filter(x => x !== e)).slice(0, n);
    const t = Math.floor(Math.random() * 5);
    if (t === 0) return { q: `Which element has the symbol ${e.sym}?`, a: e.name, wrong: others(3).map(x => x.name) };
    if (t === 1) return { q: `What is the symbol for ${e.name}?`, a: e.sym, wrong: others(3).map(x => x.sym) };
    if (t === 2) return { q: `Which element has atomic number ${e.n}?`, a: e.name, wrong: others(3).map(x => x.name) };
    if (t === 3) { const cats = shuffle(Object.keys(CATS).filter(k => k !== e.cat && k !== 'un' && k !== 'la' && k !== 'ac' && !(k === 'nm' && (e.cat === 'hal' || e.cat === 'ng')) && !((k === 'hal' || k === 'ng') && e.cat === 'nm'))).slice(0, 3); return { q: `What kind of element is ${e.name}?`, a: CATS[e.cat].name, wrong: cats.map(k => CATS[k].name) }; }
    return { q: `At room temperature, ${e.name} is a…`, a: e.state, wrong: ['Solid', 'Liquid', 'Gas'].filter(s => s !== e.state) };
  }
  const fullQ = () => [...PTQUIZ, ...POOL.map(madeQuestion)];
  const quiz = { init(ctx) { SBT.quiz(ctx, { rounds: 10, full: fullQ, build: () => [...shuffle(PTQUIZ).slice(0, 4), ...shuffle(POOL).slice(0, 6).map(madeQuestion)] }); } };   // six different elements, so no question gives away another

  /* ===================== Sort it ===================== */
  const sort = {
    init(ctx) {
      const label = e => `${e.name} (${e.sym})`;
      const main = KNOWN.filter(e => e.n <= 56);
      SBT.sort(ctx, {
        sets: [
          { id: 'metal', label: 'Metal or not', perBucket: 4, buckets: [{ id: 'Metal', name: 'Metal' }, { id: 'Nonmetal', name: 'Nonmetal' }, { id: 'Metalloid', name: 'Metalloid' }], items: main.map(e => ({ text: label(e), b: CATS[e.cat].metal })) },
          { id: 'state', label: 'Solid, liquid, or gas', perBucket: 3, buckets: [{ id: 'Solid', name: 'Solid' }, { id: 'Liquid', name: 'Liquid' }, { id: 'Gas', name: 'Gas' }], items: KNOWN.filter(e => e.n <= 86).map(e => ({ text: label(e), b: e.state })) }
        ],
        right: (it, b) => 'Yes! ' + it.text + ' is a ' + b.name.toLowerCase() + (['Solid', 'Liquid', 'Gas'].includes(b.id) ? ' at room temperature.' : '.')
      });
    }
  };

  /* ===================== Find it on the table ===================== */
  const FIND_SECS = 60;
  const find = {
    init(ctx) {
      const P = ctx.panel, F = { score: 0, time: FIND_SECS, timer: null, running: false, target: null };
      P.innerHTML = `<h2>Find it</h2><p class="lead">Find each element on the table as fast as you can. You have ${FIND_SECS} seconds.</p>
        <div class="findbar"><div class="scorebar"><div class="stat"><b class="sc">0</b><span>Score</span></div><div class="stat"><b class="tm">${FIND_SECS}</b><span>Seconds</span></div><div class="stat"><b class="best">${ctx.state.bestFind || 0}</b><span>Best</span></div></div>
          <div class="prompt fprompt">Ready?</div><button class="btn" data-a="start">Start</button></div>
        <p class="msg"></p><div class="tablewrap ptwrap">${tableHTML()}</div>`;
      const msg = $('.msg', P), prompt = $('.fprompt', P);
      function next() {
        let e; do { e = KNOWN[Math.floor(Math.random() * (Math.random() < 0.7 ? 56 : KNOWN.length))]; } while (e === F.target || e.cat === 'un');
        F.target = e; prompt.innerHTML = Math.random() < 0.65 ? `Find <em>${e.name}</em>` : `Find element <em>number ${e.n}</em>`;
        ctx.say(prompt.textContent);
      }
      function stop(silent) { clearInterval(F.timer); F.running = false; if (silent) { prompt.textContent = 'Ready?'; $('[data-a="start"]', P).textContent = 'Start'; } }
      function end() {
        stop(); const best = Math.max(ctx.state.bestFind || 0, F.score), isNew = F.score > (ctx.state.bestFind || 0);
        ctx.state.bestFind = best; ctx.save(); $('.best', P).textContent = best; ctx.result(F.score, null); ctx.sfx.win();
        prompt.textContent = 'Time!'; setMsg(msg, 'You found ' + F.score + ' elements.' + (isNew && F.score > 0 ? ' New best!' : ''), 'good'); $('[data-a="start"]', P).textContent = 'Play again';
      }
      $$('.el[data-n]', P).forEach(b => b.onclick = () => {
        if (!F.running) return;
        const e = BYN[+b.dataset.n];
        if (e === F.target) { F.score++; $('.sc', P).textContent = F.score; ctx.credit(); ctx.sfx.good(); b.classList.remove('flash-good'); void b.offsetWidth; b.classList.add('flash-good'); setMsg(msg, `Yes! ${e.name} is number ${e.n}.`, 'good'); next(); }
        else { ctx.slip(); ctx.sfx.bad(); b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad'); setMsg(msg, `That is ${e.name} (${e.n}). Keep looking.`, 'bad'); }
      });
      $('[data-a="start"]', P).onclick = () => {
        F.score = 0; F.time = FIND_SECS; F.running = true; $('.sc', P).textContent = 0; $('.tm', P).textContent = FIND_SECS; setMsg(msg, 'Go!');
        $('[data-a="start"]', P).textContent = 'Restart'; next(); clearInterval(F.timer);
        F.timer = setInterval(() => { F.time--; $('.tm', P).textContent = F.time; if (F.time <= 0) end(); }, 1000);
      };
      find.leave = () => stop(true);
    }
  };

  /* ===================== Type the symbol ===================== */
  const symbols = {
    init(ctx) {
      const why = e => `The symbol for ${e.name} is ${e.sym}.` + (e.sym === 'W' ? ' It comes from wolfram, its German name.' : LATIN[e.sym] ? ` It comes from its Latin name, ${LATIN[e.sym]}.` : '') + ' A symbol starts with a capital letter.';
      SBT.answer(ctx, {
        title: 'Type the symbol', lead: 'Type the symbol for each element. Watch out for the tricky ones like K and Au. Capital letters count: Co is cobalt, CO is not.', kind: 'text', rounds: 10,
        exactCase: true,
        build: () => shuffle(COMMON).slice(0, 10).map(e => ({ q: `What is the symbol for <em>${e.name}</em>?`, a: [e.sym], show: e.sym, why: why(e), hint: `It starts with "${e.sym[0]}" and has ${e.sym.length} letter${e.sym.length === 1 ? '' : 's'}.`, say: 'What is the symbol for ' + e.name + '?' }))
      });
    }
  };

  SBM.start({ module: 'periodic-table', defaults: { bestFind: 0 }, tools: { guide, cards, quiz, sort, find, symbols } });
})();
