/* Oceania: the tools. Content is in data.js; the page shell comes from shared/sb-module.js. The map tools are in oc-map.js.
   Study guide, Study map, and Flashcards are practice only. Listen and tap, Find it, Drag names, Quiz, and Type the answer are checked tools.
   Quiz and Type the answer have a topic picker (capitals, flags, languages). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const BY = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const list = a => a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
  const lang = c => list(c.langs);                                            // "Dutch, French, and German"
  /* a country with its flag. In questions and cards the picture's label must not give the answer away to a screen reader. */
  const flag = (c, cls = '') => `<span class="oc-flag ${cls}" data-s="${c.id}">${/oc-qflag|oc-cardflag/.test(cls) ? FLAGS[c.id].replace(/aria-label="[^"]*"/, 'aria-label="A country flag"') : FLAGS[c.id]}</span>`;
  /* when the capital's name already contains the country's name, "X is the capital of which country?" would give it away */
  const giveaway = c => { const a = c.capital.toLowerCase(), b = c.name.toLowerCase(); return a.includes(b) || b.includes(a); };
  /* alternate spellings accepted when typing come from data.js (ALSO.name, ALSO.capital, ALSO.lang) */
  const NAME_ALSO = ALSO.name || {}, CAP_ALSO = ALSO.capital || {}, LANG_ALSO = ALSO.lang || {};
  const firstHint = t => `It starts with "${t[0]}".`;
  const nameAlts = c => [c.name, ...(NAME_ALSO[c.id] || [])];
  const capAlts = c => [c.capital, ...(CAP_ALSO[c.id] || [])];
  const langAlts = c => [...new Set(c.langs.flatMap(l => [l, ...(LANG_ALSO[l] || [])]))];
  const TOPICS = [{ id: 'capitals', label: 'Capitals' }, { id: 'flags', label: 'Flags' }, { id: 'languages', label: 'Languages' }];

  /* ---------- topic picker, shared by Quiz and Type the answer ---------- */
  function withTopics(ctx, key, topics, run) {
    const P = ctx.panel;
    P.innerHTML = `<div class="seg oc-topics" role="group" aria-label="Topic">${topics.map(t => `<button type="button" data-t="${t.id}" aria-pressed="false">${esc(t.label)}</button>`).join('')}</div><div class="oc-body"></div>`;
    const body = $('.oc-body', P), sub = Object.create(ctx, { panel: { value: body } });
    function go(t) {
      ctx.state.topic = ctx.state.topic || {}; ctx.state.topic[key] = t; ctx.save();
      $$('.oc-topics button', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
      body.innerHTML = ''; run(sub, t);
    }
    $$('.oc-topics button', P).forEach(b => b.onclick = () => go(b.dataset.t));
    const saved = ctx.state.topic && ctx.state.topic[key];
    go(topics.some(t => t.id === saved) ? saved : topics[0].id);
  }

  /* ---------- Quiz questions ---------- */
  const others = (c, f, n = 3, ok = () => true) => { const used = new Set([f(c)]), out = []; for (const o of shuffle(COUNTRIES)) { if (o === c || !ok(o)) continue; const v = f(o); if (!used.has(v)) { used.add(v); out.push(v); if (out.length === n) break; } } return out; };
  const langCount = {}; COUNTRIES.forEach(c => c.langs.forEach(l => { langCount[l] = (langCount[l] || 0) + 1; }));
  /* when too few other countries have a different language (all of Oceania speaks English, say), fill the choices from a general list of well-known languages */
  const MORE_LANGS = ['Spanish', 'French', 'German', 'Arabic', 'Hindi', 'Mandarin Chinese', 'Portuguese', 'Russian', 'Japanese', 'Swahili', 'Turkish', 'Italian', 'Korean', 'Dutch', 'Greek', 'Polish', 'Thai', 'Vietnamese'];
  const padLangs = (w, mine) => { const out = w.slice(); for (const l of shuffle(MORE_LANGS)) { if (out.length >= 3) break; if (!mine.has(l) && !out.includes(l)) out.push(l); } return out; };
  const Q = {
    capitals: (c, i) => (i % 2 && !giveaway(c))
      ? { q: `${c.capital} is the capital of which country?`, a: c.name, wrong: others(c, o => o.name), why: `${c.capital} is the capital of ${c.name}.` }
      : { q: `What is the capital of ${c.name}?`, a: c.capital, wrong: others(c, o => o.capital), why: `The capital of ${c.name} is ${c.capital}.${c.note && /capital/i.test(c.note) ? ' ' + c.note : ''}` },
    flags: c => ({ q: 'Which country has this flag?', html: flag(c, 'oc-qflag'), a: c.name, wrong: others(c, o => o.name), why: `That is the flag of ${c.name}.` }),
    languages: (c, i) => {
      const mine = new Set(c.langs);
      if (i % 2 && c.langs.length === 1 && langCount[c.langs[0]] === 1) return { q: `In which country is ${c.langs[0]} the main language?`, a: c.name, wrong: others(c, o => o.name, 3, o => !o.langs.some(l => mine.has(l))), why: `${c.name} speaks ${lang(c)}.` };
      return { q: `What is the main language of ${c.name}?`, a: lang(c), wrong: padLangs(others(c, lang, 3, o => !o.langs.some(l => mine.has(l))), mine), why: `The main ${c.langs.length > 1 ? 'languages of ' + c.name + ' are ' : 'language of ' + c.name + ' is '}${lang(c)}.` };
    }
  };
  const quizSet = (topic, n) => shuffle(COUNTRIES).slice(0, n).map((c, i) => { const t = topic === 'mixed' ? pick(Object.keys(Q)) : topic; return Q[t](c, i + (Math.random() < 0.5 ? 1 : 0)); });
  const fullQ = t => COUNTRIES.map((c, i) => Q[t](c, i + 1));
  const allFull = () => Object.keys(Q).flatMap(fullQ);

  /* ---------- Type the answer questions ---------- */
  const T = {
    capitals: c => ({ q: `What is the capital of <b>${esc(c.name)}</b>?`, say: `What is the capital of ${c.name}?`, a: capAlts(c), hint: firstHint(c.capital), why: `The capital of ${c.name} is ${c.capital}.` }),
    countries: c => ({ q: `<b>${esc(c.capital)}</b> is the capital of which country?`, say: `${c.capital} is the capital of which country?`, a: nameAlts(c), hint: firstHint(c.name), why: `${c.capital} is the capital of ${c.name}.` }),
    flags: c => ({ q: `Which country has this flag?${flag(c, 'oc-qflag')}`, say: 'Which country has this flag?', a: nameAlts(c), hint: firstHint(c.name), why: `That is the flag of ${c.name}.` }),
    languages: c => ({ q: `What is the main language of <b>${esc(c.name)}</b>?${c.langs.length > 1 ? ' Type any one of them.' : ''}`, say: `What is the main language of ${c.name}?`, a: langAlts(c), hint: firstHint(c.langs[0]), why: `The main ${c.langs.length > 1 ? 'languages of ' + c.name + ' are ' : 'language of ' + c.name + ' is '}${lang(c)}.` })
  };
  const TYPE_TOPICS = [{ id: 'capitals', label: 'Capitals' }, { id: 'countries', label: 'Name the country' }, { id: 'flags', label: 'Flags' }, { id: 'languages', label: 'Languages' }];
  const typeSet = t => shuffle(COUNTRIES.filter(c => t !== 'countries' || !giveaway(c))).slice(0, 10).map(T[t]);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const TABS = [{ id: 'overview', label: 'Countries and capitals' }, { id: 'flags', label: 'Flags' }, { id: 'languages', label: 'Languages' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">${COUNTRIES.length} Oceanian countries in one place. Tap a speaker to hear it.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${TABS.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div>
        <div class="oc-find"><label class="sr" for="ocFind">Find a country</label><input id="ocFind" type="search" placeholder="Find a country or capital" autocomplete="off"></div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P), find = $('#ocFind', P);
      const tbl = (cols, rows) => `<div class="tablewrap"><table class="ttable oc-guide"><thead><tr>${cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      const spk = (c, t) => `<td class="s">${ctx.sayButton(t, 'Hear ' + c.name)}</td>`;
      const rowKey = c => esc((c.name + ' ' + c.capital + ' ' + c.langs.join(' ')).toLowerCase());
      const note = c => c.note ? `<div class="oc-note">${esc(c.note)}</div>` : '';
      const VIEWS = {
        overview: () => tbl(['Flag', 'Country', 'Capital', 'Main language', '<span class="sr">Hear it</span>'], COUNTRIES.map(c => `<tr data-k="${rowKey(c)}"><td class="f">${flag(c, 'oc-thumb')}</td><th scope="row">${esc(c.name)}</th><td>${esc(c.capital)}</td><td>${esc(lang(c))}${note(c)}</td>${spk(c, c.name + '. The capital is ' + c.capital + '. The main language is ' + lang(c) + '.')}</tr>`)),
        flags: () => `<div class="oc-flags">${COUNTRIES.map(c => `<figure data-k="${rowKey(c)}">${flag(c)}<figcaption>${esc(c.name)}</figcaption></figure>`).join('')}</div>`,
        languages: () => tbl(['Country', 'Main language', '<span class="sr">Hear it</span>'], COUNTRIES.map(c => `<tr data-k="${rowKey(c)}"><th scope="row">${esc(c.name)}</th><td>${esc(lang(c))}</td>${spk(c, c.name + '. The main language is ' + lang(c) + '.')}</tr>`))
      };
      const filter = () => {
        const q = find.value.trim().toLowerCase();
        $$('[data-k]', body).forEach(el => { el.hidden = !!q && !el.dataset.k.includes(q); });
        let none = $('.oc-none', body); if (!none) { none = document.createElement('p'); none.className = 'hint oc-none'; none.setAttribute('role', 'status'); none.textContent = 'No country matches that.'; body.appendChild(none); }
        none.hidden = !q || $$('[data-k]', body).some(el => !el.hidden);
      };
      const show = id => {
        body.innerHTML = VIEWS[id]();
        $$('.oc-guide', body).forEach(t => { const heads = $$('thead th', t).map(h => h.textContent.trim()); $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (!td.classList.contains('s') && !td.classList.contains('f')) td.dataset.label = heads[i + 1] || ''; })); });
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
      const say = (c, t) => ctx.sayButton(t, 'Hear it');
      const extra = c => c.note ? `<div class="exl">${esc(c.note)}</div>` : '';
      const D = {
        shapes: c => ({ front: `<div class="tag">Map shape</div>${window.__ocMap.miniMap(c.id)}<div class="small">Which country is colored?</div>`, back: `<div class="tag">Country</div><div class="defline">${esc(c.name)}</div><div class="exl">Capital: ${esc(c.capital)}</div>${say(c, c.name + '. The capital is ' + c.capital + '.')}`, say: 'Which country is colored?' }),
        capitals: c => ({ front: `<div class="tag">Country</div><div class="big">${esc(c.name)}</div><div class="small">What is the capital?</div>`, back: `<div class="tag">Capital</div><div class="defline">${esc(c.capital)}</div>${extra(c)}${say(c, c.name + '. The capital is ' + c.capital + '.')}`, say: 'What is the capital of ' + c.name + '?' }),
        flags: c => ({ front: `<div class="tag">Flag</div>${flag(c, 'oc-cardflag')}<div class="small">Which country?</div>`, back: `<div class="tag">Country</div><div class="defline">${esc(c.name)}</div><div class="exl">Capital: ${esc(c.capital)}</div>${say(c, 'This is the flag of ' + c.name + '.')}`, say: 'Which country has this flag?' }),
        languages: c => ({ front: `<div class="tag">Country</div><div class="big">${esc(c.name)}</div><div class="small">What is the main language?</div>`, back: `<div class="tag">Language</div><div class="defline">${esc(lang(c))}</div>${say(c, c.name + '. The main language is ' + lang(c) + '.')}`, say: 'What is the main language of ' + c.name + '?' })
      };
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say the answer before you flip. Cards you miss come back again.',
        modes: [{ id: 'shapes', label: 'Map shapes' }, ...TOPICS, { id: 'quizq', label: 'Every quiz question' }],
        build: mode => mode === 'quizq' ? SBT.quizCards(ctx, allFull()) : shuffle(COUNTRIES).map(D[mode])
      });
    }
  };

  /* ===================== Quiz ===================== */
  const quiz = {
    init(ctx) {
      withTopics(ctx, 'quiz', [{ id: 'mixed', label: 'Mixed' }, ...TOPICS], (c, t) => SBT.quiz(c, {
        title: 'Quiz', lead: 'Pick the best answer. You can skip one you do not know.', rounds: 10, skip: true, full: t === 'mixed' ? null : () => fullQ(t), build: () => quizSet(t, 10)
      }));
    }
  };

  /* ===================== Type the answer ===================== */
  const answer = {
    init(ctx) {
      withTopics(ctx, 'answer', TYPE_TOPICS, (c, t) => SBT.answer(c, { title: 'Type the answer', kind: 'text', typo: true, skip: true, rounds: 10, build: () => typeSet(t) }));
    }
  };

  window.__ocTest = { Q, T, quizSet, fullQ, typeSet };                        // a hook so the test can check every country's questions
  SBM.start({ module: 'oceania', defaults: { topic: {} }, tools: { guide, ...window.__ocTools, cards, quiz, answer } });
})();
