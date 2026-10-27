/* US States: the five tools. Content is in data.js; the page shell comes from shared/sb-module.js.
   Study guide and Flashcards are practice only. Quiz, Type the answer, and Put in order are checked tools.
   Quiz and Type the answer have a topic picker (capitals, flags, mottos, birds, flowers, cities, years). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const BY = Object.fromEntries(STATES.map(s => [s.id, s]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  /* A flag. In questions and cards the picture's label must not give the answer away to a screen reader. */
  const flag = (s, cls = '') => `<span class="us-flag ${cls}" data-s="${s.id}">${/us-qflag|us-cardflag/.test(cls) ? FLAGS[s.id].replace(/aria-label="[^"]*"/, 'aria-label="A state flag"') : FLAGS[s.id]}</span>`;
  const motto = s => s.motto.replace(/\s*\(.*\)\s*$/, '');                  // the motto as written (Latin etc.)
  const mottoSay = s => { const m = s.motto.match(/\((.*)\)\s*$/); return m ? m[1] : s.motto; };
  const alts = (txt, kind) => {                                              // accepted spellings for a typed answer
    const out = new Set([txt]);
    if (/^Saint /.test(txt)) out.add('St. ' + txt.slice(6));
    if (kind === 'name') { if (txt === 'Washington') out.add('Washington State'); }
    const w = txt.split(' ');
    if (kind === 'bird') { if (w.length === 2 && /^(Northern|Eastern|Western|American|Mountain|Common|Ruffed|Black-capped|Mourning)$/.test(w[0])) out.add(w[1]); if (w[w.length - 1] === 'Chicken') out.add(w.slice(0, -1).join(' ')); }
    if (kind === 'flower') { const t = txt.replace(/ (Blossom|Flower|Blossoms)$/, ''); out.add(t); if (!/s$/.test(t)) out.add(t + 's'); if (w.length >= 2) { out.add(w[w.length - 1]); out.add(w.slice(1).join(' ').replace(/ (Blossom|Flower|Blossoms)$/, '')); } if (/Dogwood$/.test(txt)) ['Dogwood', 'American Dogwood', 'Flowering Dogwood'].forEach(x => out.add(x)); if (/Violet$/.test(txt)) out.add('Violet'); }
    return [...out];
  };
  const firstHint = txt => `It starts with "${txt[0]}".`;

  /* city names that belong to more than one state in real life (so a choice could be right for two states) */
  const AMBIG = new Set(['Aberdeen', 'Alexandria', 'Augusta', 'Aurora', 'Bellevue', 'Bowling Green', 'Burlington', 'South Burlington', 'Cambridge', 'Charleston', 'Columbia', 'Columbus', 'Davenport', 'Fayetteville', 'Greenville', 'Henderson', 'Huntington', 'Jacksonville', 'Kansas City', 'Lafayette', 'Lawrence', 'Lewiston', 'Lexington', 'Lowell', 'Manchester', 'Meridian', 'Middletown', 'Newark', 'Newport', 'Norfolk', 'Peoria', 'Portland', 'Portsmouth', 'Rochester', 'Springfield', 'Warwick', 'Wilmington']);
  /* how many times each city name appears, so a city that only one state has can ask "which state?" */
  const CITYCOUNT = {};
  STATES.forEach(s => [s.capital, ...s.cities].forEach(c => { CITYCOUNT[c] = (CITYCOUNT[c] || 0) + 1; }));

  const TOPICS = [
    { id: 'capitals', label: 'Capitals' }, { id: 'flags', label: 'Flags' }, { id: 'mottos', label: 'Mottos' }, { id: 'birds', label: 'Birds' },
    { id: 'flowers', label: 'Flowers' }, { id: 'cities', label: 'Cities' }, { id: 'admitted', label: 'Admitted' }
  ];

  /* ---------- topic picker, shared by Quiz and Type the answer ---------- */
  function withTopics(ctx, key, list, run) {
    const P = ctx.panel;
    P.innerHTML = `<div class="seg us-topics" role="group" aria-label="Topic">${list.map(t => `<button type="button" data-t="${t.id}" aria-pressed="false">${esc(t.label)}</button>`).join('')}</div><div class="us-body"></div>`;
    const body = $('.us-body', P), sub = Object.create(ctx, { panel: { value: body } });
    function go(t) {
      ctx.state.topic = ctx.state.topic || {}; ctx.state.topic[key] = t; ctx.save();
      $$('.us-topics button', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
      body.innerHTML = ''; run(sub, t);
    }
    $$('.us-topics button', P).forEach(b => b.onclick = () => go(b.dataset.t));
    const saved = ctx.state.topic && ctx.state.topic[key];
    go(list.some(t => t.id === saved) ? saved : list[0].id);
  }

  /* ---------- Quiz questions ---------- */
  const others = (s, f, n = 3) => { const used = new Set([f(s)]), out = []; for (const o of shuffle(STATES)) { const v = f(o); if (!used.has(v)) { used.add(v); out.push(v); if (out.length === n) break; } } return out; };
  const lastWord = t => t.toLowerCase().split(/[ -]/).pop().replace(/(blossom|flower)s?$/, '').replace(/s$/, '');
  const othersKeyed = (s, f, n = 3) => {                                      // wrong choices that are not close cousins of the right one (Rose and Wild Rose, Violet and Wood Violet)
    const key = v => lastWord(v) || v.toLowerCase(), used = new Set([key(f(s))]), out = [];
    for (const o of shuffle(STATES)) { const v = f(o), k = key(v); if (!used.has(k)) { used.add(k); out.push(v); if (out.length === n) break; } } return out;
  };
  const near = (s, key, fmt) => {                                            // years or numbers close to the right one
    const a = s[key], pool = shuffle(STATES.filter(o => o[key] !== a)).sort((x, y) => Math.abs(x[key] - a) - Math.abs(y[key] - a)).slice(0, 10);
    const out = []; for (const o of shuffle(pool)) { const v = fmt(o[key]); if (!out.includes(v)) out.push(v); if (out.length === 3) break; } return out;
  };
  const Q = {
    capitals: (s, i) => i % 2
      ? { q: `${s.capital} is the capital of which state?`, a: s.name, wrong: others(s, o => o.name), why: `${s.capital} is the capital of ${s.name}.` }
      : { q: `What is the capital of ${s.name}?`, a: s.capital, wrong: others(s, o => o.capital), why: `The capital of ${s.name} is ${s.capital}.` },
    flags: s => ({ q: 'Which state has this flag?', html: flag(s, 'us-qflag'), a: s.name, wrong: others(s, o => o.name), why: `That is the flag of ${s.name}.` }),
    mottos: s => ({ q: `Which state's motto is "${s.motto}"?`, a: s.name, wrong: others(s, o => o.name), why: `${s.name}'s motto is "${s.motto}". ${s.mottoNote || ''}`.trim() }),
    birds: s => ({ q: `What is the state bird of ${s.name}?`, a: s.bird, wrong: othersKeyed(s, o => o.bird), why: `The state bird of ${s.name} is the ${s.bird}.` }),
    flowers: s => ({ q: `What is the state flower of ${s.name}?`, a: s.flower, wrong: othersKeyed(s, o => o.flower), why: `The state flower of ${s.name} is the ${s.flower}. ${s.flowerNote || ''}`.trim() }),
    cities: (s, i) => {
      const clear = s.cities.filter(x => !AMBIG.has(x)), c = pick(clear.length ? clear : s.cities);
      if (i % 2 && CITYCOUNT[c] === 1 && !AMBIG.has(c)) return { q: `${c} is a notable city in which state?`, a: s.name, wrong: others(s, o => o.name), why: `${c} is a city in ${s.name}. The capital is ${s.capital}.` };
      const mine = new Set([s.capital, ...s.cities]), pool = shuffle(STATES.flatMap(o => o === s ? [] : o.cities)).filter(x => !mine.has(x) && !AMBIG.has(x)), wrong = [...new Set(pool)].slice(0, 3);
      return { q: `Which of these is a notable city in ${s.name}?`, a: c, wrong, why: `${c} is a notable city in ${s.name}. Others: ${s.cities.filter(x => x !== c).join(', ')}.` };
    },
    admitted: (s, i) => i % 2
      ? { q: `Which number state was ${s.name} to join the United States?`, a: ord(s.order), wrong: near(s, 'order', ord), why: `${s.name} joined in ${s.admitted} as the ${ord(s.order)} state.` }
      : { q: `In what year did ${s.name} join the United States?`, a: String(s.admitted), wrong: near(s, 'admitted', String), why: `${s.name} joined in ${s.admitted} as the ${ord(s.order)} state.` }
  };
  const quizSet = (topic, n) => shuffle(STATES).slice(0, n).map((s, i) => { const t = topic === 'mixed' ? pick(Object.keys(Q)) : topic; return Q[t](s, i + (Math.random() < 0.5 ? 1 : 0)); });

  /* ---------- Type the answer questions ---------- */
  const T = {
    capitals: s => ({ q: `What is the capital of <b>${esc(s.name)}</b>?`, say: `What is the capital of ${s.name}?`, a: alts(s.capital), hint: firstHint(s.capital), why: `The capital of ${s.name} is ${s.capital}.` }),
    states: s => ({ q: `<b>${esc(s.capital)}</b> is the capital of which state?`, say: `${s.capital} is the capital of which state?`, a: alts(s.name, 'name'), hint: firstHint(s.name), why: `${s.capital} is the capital of ${s.name}.` }),
    flags: s => ({ q: `Which state has this flag?${flag(s, 'us-qflag')}`, say: 'Which state has this flag?', a: alts(s.name, 'name'), hint: firstHint(s.name), why: `That is the flag of ${s.name}.` }),
    birds: s => ({ q: `What is the state bird of <b>${esc(s.name)}</b>?`, say: `What is the state bird of ${s.name}?`, a: alts(s.bird, 'bird'), hint: firstHint(s.bird), why: `The state bird of ${s.name} is the ${s.bird}.` }),
    flowers: s => ({ q: `What is the state flower of <b>${esc(s.name)}</b>?`, say: `What is the state flower of ${s.name}?`, a: alts(s.flower, 'flower'), hint: firstHint(s.flower), why: `The state flower of ${s.name} is the ${s.flower}. ${s.flowerNote || ''}`.trim() }),
    years: s => ({ q: `In what year did <b>${esc(s.name)}</b> join the United States? Type the year.`, say: `In what year did ${s.name} join the United States?`, a: [String(s.admitted)], hint: `It was the ${ord(s.order)} state to join.`, why: `${s.name} joined in ${s.admitted} as the ${ord(s.order)} state.` }),
    order: s => ({ q: `<b>${esc(s.name)}</b> was which number state to join the United States? Type a number from 1 to 50.`, say: `${s.name} was which number state to join the United States?`, a: [String(s.order), ord(s.order)], hint: `It joined in ${s.admitted}.`, why: `${s.name} joined in ${s.admitted} as the ${ord(s.order)} state.` })
  };
  const TYPE_TOPICS = [{ id: 'capitals', label: 'Capitals' }, { id: 'states', label: 'Name the state' }, { id: 'flags', label: 'Flags' }, { id: 'birds', label: 'Birds' }, { id: 'flowers', label: 'Flowers' }, { id: 'years', label: 'Years' }, { id: 'order', label: 'Order' }];

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const TABS = [{ id: 'overview', label: 'States and capitals' }, { id: 'flags', label: 'Flags' }, { id: 'mottos', label: 'Mottos' }, { id: 'birds', label: 'Birds and flowers' }, { id: 'cities', label: 'Notable cities' }, { id: 'admitted', label: 'Admitted' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">All 50 states in one place. Tap a speaker to hear it.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${TABS.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div>
        <div class="us-find"><label class="sr" for="usFind">Find a state</label><input id="usFind" type="search" placeholder="Find a state or capital" autocomplete="off"></div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P), find = $('#usFind', P);
      const tbl = (cols, rows) => `<div class="tablewrap"><table class="ttable us-guide"><thead><tr>${cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      const spk = (s, t) => `<td class="s">${ctx.sayButton(t, 'Hear ' + s.name)}</td>`;
      const rowKey = s => esc((s.name + ' ' + s.capital).toLowerCase());
      const VIEWS = {
        overview: () => tbl(['Flag', 'State', 'Capital', 'Admitted', '<span class="sr">Hear it</span>'], STATES.map(s => `<tr data-k="${rowKey(s)}"><td class="f">${flag(s, 'us-thumb')}</td><th scope="row">${esc(s.name)}</th><td>${esc(s.capital)}</td><td>${ord(s.order)} state, ${s.admitted}</td>${spk(s, s.name + '. The capital is ' + s.capital + '. It joined in ' + s.admitted + ' as the ' + ord(s.order) + ' state.')}</tr>`)),
        flags: () => `<div class="us-flags">${STATES.map(s => `<figure data-k="${rowKey(s)}">${flag(s)}<figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div>`,
        mottos: () => tbl(['State', 'Motto', '<span class="sr">Hear it</span>'], STATES.map(s => `<tr data-k="${rowKey(s)}"><th scope="row">${esc(s.name)}</th><td>${esc(s.motto)}${s.mottoNote ? `<div class="us-note">${esc(s.mottoNote)}</div>` : ''}</td>${spk(s, s.name + '. ' + mottoSay(s))}</tr>`)),
        birds: () => tbl(['State', 'State bird', 'State flower', '<span class="sr">Hear it</span>'], STATES.map(s => `<tr data-k="${rowKey(s)}"><th scope="row">${esc(s.name)}</th><td>${esc(s.bird)}</td><td>${esc(s.flower)}${s.flowerNote ? `<div class="us-note">${esc(s.flowerNote)}</div>` : ''}</td>${spk(s, s.name + '. The state bird is the ' + s.bird + '. The state flower is the ' + s.flower + '.')}</tr>`)),
        cities: () => tbl(['State', 'Capital', 'Notable cities', '<span class="sr">Hear it</span>'], STATES.map(s => `<tr data-k="${rowKey(s)}"><th scope="row">${esc(s.name)}</th><td>${esc(s.capital)}</td><td>${esc(s.cities.join(', '))}</td>${spk(s, s.name + '. The capital is ' + s.capital + '. Notable cities: ' + s.cities.join(', ') + '.')}</tr>`)),
        admitted: () => tbl(['Order', 'State', 'Year', '<span class="sr">Hear it</span>'], [...STATES].sort((a, b) => a.order - b.order).map(s => `<tr data-k="${rowKey(s)}"><th scope="row">${ord(s.order)}</th><td>${esc(s.name)}</td><td>${s.admitted}</td>${spk(s, s.name + ' joined in ' + s.admitted + ' as the ' + ord(s.order) + ' state.')}</tr>`))
      };
      let cur = 'overview';
      const filter = () => {
        const q = find.value.trim().toLowerCase();
        $$('[data-k]', body).forEach(el => { el.hidden = !!q && !el.dataset.k.includes(q); });
        let none = $('.us-none', body); if (!none) { none = document.createElement('p'); none.className = 'hint us-none'; none.setAttribute('role', 'status'); none.textContent = 'No state matches that.'; body.appendChild(none); }
        none.hidden = !q || $$('[data-k]', body).some(el => !el.hidden);
      };
      const show = id => {
        cur = id; body.innerHTML = VIEWS[id]();
        $$('.us-guide', body).forEach(t => { const heads = $$('thead th', t).map(h => h.textContent.trim()); $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (!td.classList.contains('s') && !td.classList.contains('f')) td.dataset.label = heads[i + 1] || ''; })); });
        filter();
      };
      find.oninput = filter;
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.g); });
      show('overview');
    }
  };

  /* ===================== Flashcards (practice only) ===================== */
  const cards = {
    init(ctx) {
      const say = (s, t) => ctx.sayButton(t, 'Hear it');
      const D = {
        capitals: s => ({ front: `<div class="tag">State</div><div class="big">${esc(s.name)}</div><div class="small">What is the capital?</div>`, back: `<div class="tag">Capital</div><div class="defline">${esc(s.capital)}</div><div class="exl">${esc(s.name)} joined in ${s.admitted} as the ${ord(s.order)} state.</div>${say(s, s.name + '. The capital is ' + s.capital + '.')}`, say: 'What is the capital of ' + s.name + '?' }),
        flags: s => ({ front: `<div class="tag">Flag</div>${flag(s, 'us-cardflag')}<div class="small">Which state?</div>`, back: `<div class="tag">State</div><div class="defline">${esc(s.name)}</div><div class="exl">Capital: ${esc(s.capital)}</div>${say(s, 'This is the flag of ' + s.name + '.')}` }),
        mottos: s => ({ front: `<div class="tag">State</div><div class="big">${esc(s.name)}</div><div class="small">What is the motto?</div>`, back: `<div class="tag">Motto</div><div class="defline us-motto">${esc(s.motto)}</div>${s.mottoNote ? `<div class="exl">${esc(s.mottoNote)}</div>` : ''}${say(s, s.name + '. ' + mottoSay(s))}`, say: 'What is the motto of ' + s.name + '?' }),
        birds: s => ({ front: `<div class="tag">State</div><div class="big">${esc(s.name)}</div><div class="small">What are the state bird and flower?</div>`, back: `<div class="tag">Bird and flower</div><div class="defline">${esc(s.bird)}</div><div class="exl">Flower: ${esc(s.flower)}</div>${say(s, s.name + '. The state bird is the ' + s.bird + '. The state flower is the ' + s.flower + '.')}`, say: 'What are the state bird and flower of ' + s.name + '?' }),
        cities: s => ({ front: `<div class="tag">State</div><div class="big">${esc(s.name)}</div><div class="small">Name its capital and notable cities.</div>`, back: `<div class="tag">Cities</div><div class="defline">${esc(s.capital)} (capital)</div><div class="exl">${esc(s.cities.join(', '))}</div>${say(s, s.name + '. The capital is ' + s.capital + '. Notable cities: ' + s.cities.join(', ') + '.')}`, say: 'Name the capital and notable cities of ' + s.name + '.' }),
        admitted: s => ({ front: `<div class="tag">State</div><div class="big">${esc(s.name)}</div><div class="small">When did it join the United States?</div>`, back: `<div class="tag">Admitted</div><div class="defline">${s.admitted}</div><div class="exl">The ${ord(s.order)} state.</div>${say(s, s.name + ' joined in ' + s.admitted + ' as the ' + ord(s.order) + ' state.')}`, say: 'When did ' + s.name + ' join the United States?' })
      };
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say the answer before you flip. Cards you miss come back again.',
        modes: TOPICS.map(t => ({ id: t.id, label: t.id === 'capitals' ? 'Capitals' : t.id === 'birds' ? 'Birds and flowers' : t.label })),
        build: mode => shuffle(STATES).map(D[mode])
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = {
    init(ctx) {
      withTopics(ctx, 'quiz', [{ id: 'mixed', label: 'Mixed' }, ...TOPICS], (c, t) => SBT.quiz(c, {
        title: 'Quiz', lead: 'Pick the best answer. You can skip one you do not know.', rounds: 10, skip: true, build: () => quizSet(t, 10)
      }));
    }
  };

  /* ===================== Type the answer ===================== */
  const answer = {
    init(ctx) {
      withTopics(ctx, 'answer', TYPE_TOPICS, (c, t) => SBT.answer(c, {
        title: 'Type the answer', kind: 'text', typo: true, skip: true, rounds: 10, build: () => shuffle(STATES).slice(0, 10).map(T[t])
      }));
    }
  };

  /* ===================== Put in order ===================== */
  const byOrder = [...STATES].sort((a, b) => a.order - b.order);
  const orderTool = {
    init(ctx) {
      const items = list => list.map(s => ({ text: s.name }));
      SBT.order(ctx, {
        lead: 'Which state joined the United States first? Drag the cards, or use the arrows, from first to last. Then press Check.',
        sets: [
          { id: 'all', label: 'All 50 states', pick: 6, hint: 'Put these 6 states in the order they joined, first at the top.', items: items(byOrder) },
          { id: 'first13', label: 'The first 13', pick: 6, hint: 'The first 13 states were the original colonies. Put these in the order they joined.', items: items(byOrder.slice(0, 13)) },
          { id: 'last10', label: 'The last 10', pick: 6, hint: 'Put these recent states in the order they joined.', items: items(byOrder.slice(-10)) }
        ]
      });
    }
  };

  window.__usTest = { Q, T, quizSet, alts };                                 // a hook so the test can check every state's questions
  SBM.start({ module: 'us-states', defaults: { topic: {} }, tools: { guide, cards, quiz, answer, order: orderTool } });
})();
