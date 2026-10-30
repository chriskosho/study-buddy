/* Oceans: the tools. Content is in data.js; the page shell comes from shared/sb-module.js. The map tools are in oce-map.js.
   Study guide, Study map, and Flashcards are practice only. Listen and tap, Find it, Drag names, Quiz, and Type the answer are checked tools.
   Quiz has topics (on the map, clues, size); Type the answer has two (from a clue, from the map). The Full quiz asks one question per body of water. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { shuffle } = SBT;
  const esc = SB.esc;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const NAME_ALSO = ALSO.name || {};
  const nameAlts = w => [w.name, ...(NAME_ALSO[w.id] || [])];
  const firstHint = t => `It starts with "${t[0]}".`;
  /* sizes are rounded and always said as "about" (sources differ a little): 165 million, 3.9 million, 251,000 square kilometers */
  const areaNum = a => a >= 1e7 ? String(Math.round(a / 1e6)) + ' million' : a >= 1e6 ? (a / 1e6).toFixed(1).replace(/\.0$/, '') + ' million' : a.toLocaleString('en-US');
  const areaText = w => `about ${areaNum(w.area)} square kilometers`;
  const kindWord = w => w.kind === 'ocean' ? 'Ocean' : w.type;
  const map = (w, cls = '') => `<span class="oce-q ${cls}" data-s="${w.id}">${window.__oceMap.miniMap(w.id)}</span>`;
  const TOPICS = [{ id: 'map', label: 'On the map' }, { id: 'clues', label: 'Clues' }, { id: 'size', label: 'Size' }];

  /* ---------- topic picker, shared by Quiz and Type the answer ---------- */
  function withTopics(ctx, key, topics, run) {
    const P = ctx.panel;
    P.innerHTML = `<div class="seg oce-topics" role="group" aria-label="Topic">${topics.map(t => `<button type="button" data-t="${t.id}" aria-pressed="false">${esc(t.label)}</button>`).join('')}</div><div class="oce-body"></div>`;
    const body = $('.oce-body', P), sub = Object.create(ctx, { panel: { value: body } });
    function go(t) {
      ctx.state.topic = ctx.state.topic || {}; ctx.state.topic[key] = t; ctx.save();
      $$('.oce-topics button', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
      body.innerHTML = ''; run(sub, t);
    }
    $$('.oce-topics button', P).forEach(b => b.onclick = () => go(b.dataset.t));
    const saved = ctx.state.topic && ctx.state.topic[key];
    go(topics.some(t => t.id === saved) ? saved : topics[0].id);
  }

  /* ---------- Quiz questions ---------- */
  /* wrong answers: the same kind first (an ocean is wrong next to other oceans), then anything else; never the answer, never a repeat */
  const others = (w, n = 3) => { const same = shuffle(WATERS.filter(o => o !== w && o.kind === w.kind)), rest = shuffle(WATERS.filter(o => o !== w && o.kind !== w.kind)); return [...same, ...rest].slice(0, n).map(o => o.name); };
  const Q = {
    map: w => ({ q: 'Which ocean or sea is colored orange on this map?', html: map(w, 'oce-qmap'), a: w.name, wrong: others(w), why: `That is the ${w.name}. ${w.where}` }),
    clues: w => ({ q: `Which one is this? ${w.clue}`, a: w.name, wrong: others(w), why: `That is the ${w.name}. ${w.fact}` }),
    /* each body of water is the answer once: it is asked as "largest" when three or more others are clearly smaller, else as "smallest" */
    size: (w, i) => {
      const smaller = WATERS.filter(o => o.area * 1.2 <= w.area), bigger = WATERS.filter(o => o.area >= w.area * 1.2);
      const largest = smaller.length >= 3 && (bigger.length < 3 || i % 2 === 0);
      const wrong = shuffle(largest ? smaller : bigger).slice(0, 3), all = [w, ...wrong].sort((a, b) => b.area - a.area);
      return { q: largest ? 'Which of these is the largest?' : 'Which of these is the smallest?', a: w.name, wrong: wrong.map(o => o.name),
        why: `The ${w.name} is ${largest ? 'bigger' : 'smaller'} than the others: ` + all.map(o => `${o.name}, ${areaText(o)}`).join('; ') + '.' };
    }
  };
  const quizSet = (topic, n) => shuffle(WATERS).slice(0, n).map((w, i) => Q[topic === 'mixed' ? pick(Object.keys(Q)) : topic](w, i + (Math.random() < 0.5 ? 1 : 0)));
  const fullQ = t => WATERS.map((w, i) => Q[t](w, i + 1));
  const allFull = () => Object.keys(Q).flatMap(fullQ);

  /* ---------- Type the answer questions ---------- */
  const T = {
    clues: w => ({ q: `Which ocean or sea is this? ${esc(w.clue)}`, say: `Which ocean or sea is this? ${w.clue}`, a: nameAlts(w), hint: firstHint(w.name), why: `That is the ${w.name}. ${w.where}` }),
    map: w => ({ q: `Which ocean or sea is colored orange on this map?${map(w, 'oce-qmap')}`, say: 'Which ocean or sea is colored orange on this map?', a: nameAlts(w), hint: firstHint(w.name), why: `That is the ${w.name}. ${w.where}` })
  };
  const TYPE_TOPICS = [{ id: 'clues', label: 'From a clue' }, { id: 'map', label: 'From the map' }];
  const typeSet = t => shuffle(WATERS).slice(0, 10).map(T[t]);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const TABS = [{ id: 'overview', label: 'Oceans and seas' }, { id: 'facts', label: 'Facts' }];
      P.innerHTML = `<h2>Study guide</h2><p class="lead">${WATERS.length} bodies of water in one place: the 5 oceans and ${WATERS.length - 5} seas, gulfs, and bays. Tap a speaker to hear it. Sizes are rounded and approximate.</p>
        <div class="seg gtabs" role="group" aria-label="Study guide section">${TABS.map((t, i) => `<button data-g="${t.id}" aria-pressed="${i === 0}">${esc(t.label)}</button>`).join('')}</div>
        <div class="oce-find"><label class="sr" for="oceFind">Find an ocean or sea</label><input id="oceFind" type="search" placeholder="Find an ocean or sea" autocomplete="off"></div>
        <div class="gbody"></div>`;
      const body = $('.gbody', P), find = $('#oceFind', P);
      const tbl = (cols, rows) => `<div class="tablewrap"><table class="ttable oce-guide"><thead><tr>${cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      const spk = (w, t) => `<td class="s">${ctx.sayButton(t, 'Hear ' + w.name)}</td>`;
      const rowKey = w => esc((w.name + ' ' + w.type + ' ' + w.where).toLowerCase());
      const VIEWS = {
        overview: () => tbl(['Name', 'Kind', 'Where it is', 'Size', '<span class="sr">Hear it</span>'], WATERS.map(w => `<tr data-k="${rowKey(w)}"><th scope="row">${esc(w.name)}</th><td>${esc(kindWord(w))}</td><td>${esc(w.where)}</td><td>${esc(areaText(w).replace('about ', '~').replace(' square kilometers', ' km²'))}</td>${spk(w, w.name + '. ' + w.where)}</tr>`)),
        facts: () => tbl(['Name', 'Fact', '<span class="sr">Hear it</span>'], WATERS.map(w => `<tr data-k="${rowKey(w)}"><th scope="row">${esc(w.name)}</th><td>${esc(w.fact)}</td>${spk(w, w.name + '. ' + w.fact)}</tr>`))
      };
      const filter = () => {
        const q = find.value.trim().toLowerCase();
        $$('[data-k]', body).forEach(el => { el.hidden = !!q && !el.dataset.k.includes(q); });
        let none = $('.oce-none', body); if (!none) { none = document.createElement('p'); none.className = 'hint oce-none'; none.setAttribute('role', 'status'); none.textContent = 'No ocean or sea matches that.'; body.appendChild(none); }
        none.hidden = !q || $$('[data-k]', body).some(el => !el.hidden);
      };
      const show = id => {
        body.innerHTML = VIEWS[id]();
        $$('.oce-guide', body).forEach(t => { const heads = $$('thead th', t).map(h => h.textContent.trim()); $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (!td.classList.contains('s')) td.dataset.label = heads[i + 1] || ''; })); });
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
      const say = (w, t) => ctx.sayButton(t, 'Hear it');
      const D = {
        shapes: w => ({ front: `<div class="tag">Map shape</div>${window.__oceMap.miniMap(w.id)}<div class="small">Which ocean or sea is colored?</div>`, back: `<div class="tag">${esc(kindWord(w))}</div><div class="defline">${esc(w.name)}</div><div class="exl">${esc(w.where)}</div>${say(w, w.name + '. ' + w.where)}` }),
        clues: w => ({ front: `<div class="tag">Clue</div><div class="small" style="font-size:1.05em">${esc(w.clue)}</div><div class="small">Which one is it?</div>`, back: `<div class="tag">${esc(kindWord(w))}</div><div class="defline">${esc(w.name)}</div><div class="exl">${esc(w.where)}</div>${say(w, w.name + '. ' + w.where)}` }),
        facts: w => ({ front: `<div class="tag">${esc(kindWord(w))}</div><div class="big">${esc(w.name)}</div><div class="small">What do you know about it?</div>`, back: `<div class="tag">Fact</div><div class="defline" style="font-size:1.05em">${esc(w.fact)}</div><div class="exl">Size: ${esc(areaText(w))}</div>${say(w, w.name + '. ' + w.fact)}` })
      };
      SBT.flashcards(ctx, {
        lead: 'Tap the card to flip it. Say the answer before you flip. Cards you miss come back again.',
        modes: [{ id: 'shapes', label: 'Map shapes' }, { id: 'clues', label: 'Clues' }, { id: 'facts', label: 'Facts' }, { id: 'quizq', label: 'Every quiz question' }],
        build: mode => mode === 'quizq' ? SBT.quizCards(ctx, allFull()) : shuffle(WATERS).map(D[mode])
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

  window.__oceTest = { Q, T, quizSet, fullQ, typeSet };                      // a hook so the test can check every body of water's questions
  SBM.start({ module: 'oceans', defaults: { topic: {} }, tools: { guide, ...window.__oceTools, cards, quiz, answer } });
})();
