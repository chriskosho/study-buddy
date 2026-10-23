/* Parts of Speech: the six tools. Content lives in data.js; the page shell comes from shared/sb-module.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = SB.esc;
  const PART = Object.fromEntries(PARTS.map(p => [p.id, p]));
  const ORDER = PARTS.map(p => p.id);
  const partOf = tag => tag === 'art' ? 'adj' : tag;            // articles count as adjectives
  const aAn = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const lower = p => PART[p].name.toLowerCase();
  const DOES = {
    n: 'Nouns name a person, place, thing, or idea.', v: 'Verbs show an action or a state of being.',
    adj: 'Adjectives describe a noun or a pronoun.', adv: 'Adverbs describe a verb, an adjective, or another adverb.',
    pron: 'Pronouns take the place of a noun.', prep: 'Prepositions connect a noun or pronoun to another word.',
    conj: 'Conjunctions join words or groups of words.', int: 'Interjections show a strong feeling.'
  };

  function parse(s) {
    return s.split(' ').map(t => { const m = t.match(/^(.+)\/(\w+)(\*?)$/); return m ? { w: m[1], tag: m[2], part: partOf(m[2]), star: !!m[3] } : { w: t, punct: true }; });
  }
  const pv = id => `--pc:${PART[id].color};--pi:${PART[id].ink}`;
  const pill = id => `<span class="ppill" style="${pv(id)}">${PART[id].name}</span>`;
  /* kind 'hl' = neutral highlight (never gives the answer away), 'pc' = the part's own color */
  function sentHTML(toks, mark = -1, kind = 'hl') {
    let out = '';
    toks.forEach((t, i) => {
      if (t.punct) { out += esc(t.w); return; }
      let w = esc(t.w);
      if (i === mark) w = kind === 'pc' ? `<mark class="pc" style="${pv(t.part)}">${w}</mark>` : `<mark class="hl">${w}</mark>`;
      out += (out ? ' ' : '') + w;
    });
    return out;
  }
  const plain = toks => toks.reduce((o, t) => t.punct ? o + t.w : o + (o ? ' ' : '') + t.w, '');
  const isName = t => t.tag === 'n' && /^[A-Z]/.test(t.w);
  const wordAsShown = (t, i) => (i === 0 && !isName(t) && t.w !== 'I') ? t.w.toLowerCase() : t.w;
  function reason(t, i = 1) {
    const w = cap(wordAsShown(t, i));
    if (t.tag === 'art') return `${w} is an article. Articles are a kind of adjective.`;
    return `${w} is ${aAn(lower(t.part))} ${lower(t.part)}. ${DOES[t.part]}`;
  }
  const starsHTML = (s, n) => { const k = s / n >= 0.9 ? 3 : s / n >= 0.7 ? 2 : s / n >= 0.5 ? 1 : 0; return `<div class="stars">${[0, 1, 2].map(i => `<span class="${i < k ? '' : 'off'}">&#9733;</span>`).join('')}</div>`; };
  function setMsg(el, text, kind = '') { el.className = 'msg' + (kind ? ' ' + kind : ''); el.textContent = text; }

  const SENTS = SENTENCES.map(parse);
  const ALL_WORDS = SENTS.flatMap((toks, si) => toks.map((t, ti) => ({ si, ti, t })).filter(x => !x.t.punct));

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      ctx.panel.innerHTML = `<h2>Study guide</h2><p class="lead">Every word in a sentence has a job. These are the eight jobs, called the parts of speech.</p>
        <div class="guide">${PARTS.map(p => {
          const toks = parse(p.sample), speech = `${p.name}. ${p.def} For example: ${plain(toks)}`;
          return `<div class="gcard"><div class="row">${pill(p.id)}${ctx.sayButton(speech, 'Hear about ' + p.name)}</div>
            <p class="def">${esc(p.def)}</p><p class="asks">Asks: ${esc(p.asks)}</p>
            <div class="ex">${p.examples.map(e => `<span>${esc(e)}</span>`).join('')}</div>
            ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
            <p class="samp">${sentHTML(toks, p.focus, 'pc')}</p></div>`;
        }).join('')}</div>`;
    }
  };

  /* ===================== Flashcards (shared tool) ===================== */
  const cards = {
    init(ctx) {
      SBT.flashcards(ctx, {
        modes: [{ id: 'parts', label: 'The 8 parts' }, { id: 'words', label: 'Words in sentences' }],
        build(mode) {
          if (mode === 'parts') return shuffle(ORDER).map(id => {
            const p = PART[id];
            return { front: `<div class="tag">What does this part of speech do?</div><div class="big">${p.name}</div>`,
              back: `<div class="tag">Answer</div>${pill(p.id)}<div class="defline">${esc(p.def)}</div><div class="exl">Examples: ${esc(p.examples.join(', '))}</div>${ctx.sayButton(p.name + '. ' + p.def, 'Hear it')}`,
              say: 'What does ' + aAn(p.name) + ' ' + p.name.toLowerCase() + ' do?' };
          });
          const pool = shuffle(ALL_WORDS.filter(x => x.t.tag !== 'art')), seen = new Set(), out = [];
          for (const x of pool) {
            const k = x.t.w.toLowerCase(); if (seen.has(k)) continue; seen.add(k);
            const toks = SENTS[x.si], why = reason(x.t, x.ti);
            out.push({ front: `<div class="tag">What part of speech is the marked word?</div><div class="sent">${sentHTML(toks, x.ti)}</div>`,
              back: `<div class="tag">Answer</div>${pill(x.t.part)}<div class="sent">${sentHTML(toks, x.ti, 'pc')}</div><div class="why">${esc(why)}</div>${ctx.sayButton(why, 'Hear it')}`,
              say: 'What part of speech is ' + x.t.w + '? ' + plain(toks) });
            if (out.length === 10) break;
          }
          return out;
        }
      });
    }
  };

  /* ===================== Sort it (shared tool) ===================== */
  const SORT_PARTS = ['n', 'v', 'adj'];
  const sort = {
    init(ctx) {
      SBT.sort(ctx, {
        lead: 'Drag each word into its group, or tap a word and then tap a group.',
        sets: [{ id: 'nva', label: 'Nouns, verbs, adjectives', perBucket: 4,
          buckets: SORT_PARTS.map(p => ({ id: p, name: PART[p].name, style: pv(p), html: `<span class="ppill" style="${pv(p)}">${PART[p].name}</span>` })),
          items: SORT_PARTS.flatMap(p => SORT_WORDS[p].map(w => ({ text: w, b: p }))) }],
        right: (it, b) => 'Yes! ' + cap(it.text) + ' is ' + aAn(b.name.toLowerCase()) + ' ' + b.name.toLowerCase() + '.',
        wrong: (it, b) => 'Not quite. "' + it.text + '" is not ' + aAn(b.name.toLowerCase()) + ' ' + b.name.toLowerCase() + '. Try another group.'
      });
    }
  };

  /* ===================== Spot it ===================== */
  const SPOT_PARTS = ['n', 'v', 'adj', 'adv', 'pron'], SPOT_ROUNDS = 10;
  const spot = {
    init(ctx) {
      const P = ctx.panel, R = { list: [], i: 0, score: 0, tries: 0, done: false };
      const makeRound = () => {
        const used = new Set(), list = []; let targets = [];
        while (list.length < SPOT_ROUNDS) {
          if (!targets.length) targets = shuffle(SPOT_PARTS);
          const want = targets.pop();
          const options = SENTS.map((t, si) => si).filter(si => !used.has(si) && SENTS[si].some(t => t.tag === want));
          if (!options.length) continue;
          const si = options[Math.floor(Math.random() * options.length)]; used.add(si); list.push({ si, want });
        }
        return list;
      };
      function start() { R.list = makeRound(); R.i = 0; R.score = 0; show(); }
      function show() {
        if (R.i >= R.list.length) {
          ctx.result(R.score, R.list.length); ctx.sfx.win();
          P.innerHTML = `<h2>Spot it</h2><div class="result">${starsHTML(R.score, R.list.length)}<p class="prompt">${R.score} out of ${R.list.length}</p><p class="lead">${R.score >= 9 ? 'Amazing spotting!' : R.score >= 7 ? 'Great job. A little more practice and you will have it.' : 'Good start. Try the study guide, then come back.'}</p><button class="btn" data-a="again">Play again</button></div>`;
          $('[data-a="again"]', P).onclick = start; return;
        }
        const { si, want } = R.list[R.i], toks = SENTS[si], name = lower(want); R.tries = 0; R.done = false;
        const promptText = 'Tap ' + aAn(name) + ' ' + name + '.';
        P.innerHTML = `<h2>Spot it</h2><p class="lead">Read the sentence. Tap a word that does the job asked.</p>
          <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="hint">Sentence ${R.i + 1} of ${R.list.length} &middot; Score ${R.score}</span></div>
          <div class="row"><p class="prompt" style="margin:0">Tap ${aAn(name)} <em>${name}</em>.</p>${ctx.sayButton(promptText + ' ' + plain(toks), 'Hear the question')}</div>
          <div class="words">${toks.map((t, i) => t.punct ? `<span class="punct">${esc(t.w)}</span>` : `<button class="wtok" data-i="${i}"><span class="w">${esc(t.w)}</span></button>`).join('')}</div>
          <p class="msg"></p><div class="row"><button class="btn" data-a="next" hidden>${R.i === R.list.length - 1 ? 'See results' : 'Next sentence'}</button></div>`;
        const msg = $('.msg', P), nextBtn = $('[data-a="next"]', P);
        const finish = () => { R.done = true; $$('.wtok', P).forEach(b => b.disabled = true); nextBtn.hidden = false; nextBtn.focus(); };
        $$('.wtok', P).forEach(b => b.onclick = () => {
          if (R.done) return;
          const i = +b.dataset.i, t = toks[i];
          if (t.part === want) {
            if (R.tries === 0) R.score++;
            ctx.credit(); ctx.sfx.good(); b.classList.add('right');
            setMsg(msg, 'Yes! ' + (t.tag === 'art' ? cap(wordAsShown(t, i)) + ' is an article, a kind of adjective.' : cap(wordAsShown(t, i)) + ' is ' + aAn(name) + ' ' + name + '.'), 'good'); finish();
          } else {
            R.tries++; ctx.slip(); ctx.sfx.bad(); b.classList.add('wrong'); b.disabled = true;
            if (R.tries >= 2) {
              toks.forEach((x, j) => { if (!x.punct && x.part === want) $(`.wtok[data-i="${j}"]`, P).classList.add('show'); });
              setMsg(msg, reason(t, i) + ' The dashed box shows ' + aAn(name) + ' ' + name + '.', 'bad'); finish();
            } else setMsg(msg, 'Not quite. ' + reason(t, i) + ' Find ' + aAn(name) + ' ' + name + '.', 'bad');
          }
        });
        nextBtn.onclick = () => { R.i++; show(); };
        ctx.say(promptText + ' ' + plain(toks));
      }
      start();
    }
  };

  /* ===================== Speed round ===================== */
  const SPEED_SECS = 60;
  const speed = {
    init(ctx) {
      const P = ctx.panel, G = { score: 0, time: SPEED_SECS, timer: null, running: false, cur: null, lock: false };
      P.innerHTML = `<h2>Speed round</h2><p class="lead">Name the part of speech for the marked word. You have ${SPEED_SECS} seconds.</p>
        <div class="scorebar"><div class="stat"><b class="sc">0</b><span>Score</span></div><div class="stat"><b class="tm">${SPEED_SECS}</b><span>Seconds</span></div><div class="stat"><b class="best">${ctx.state.bestSpeed || 0}</b><span>Best</span></div></div>
        <div class="speedq"><div class="ask">Which part of speech?</div><div class="sent q">Press Start when you are ready.</div></div>
        <div class="speedctl"><button class="btn" data-a="start">Start</button><p class="msg"></p></div>
        <div class="pgrid">${ORDER.map(id => `<button style="${pv(id)}" data-p="${id}" disabled>${PART[id].name}</button>`).join('')}</div>`;
      const msg = $('.msg', P), q = $('.q', P), btns = $$('.pgrid button', P);
      function next() {
        let x; do { x = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]; } while (G.cur && x.si === G.cur.si);
        G.cur = x; G.lock = false; btns.forEach(b => { b.classList.remove('right', 'wrong'); b.disabled = false; });
        q.innerHTML = sentHTML(SENTS[x.si], x.ti); ctx.say(x.t.w);
      }
      function stop(silent) {
        clearInterval(G.timer); G.running = false; btns.forEach(b => b.disabled = true);
        if (silent) { q.textContent = 'Press Start when you are ready.'; $('[data-a="start"]', P).textContent = 'Start'; setMsg(msg, ''); }
      }
      function end() {
        stop(); const best = Math.max(ctx.state.bestSpeed || 0, G.score), isNew = G.score > (ctx.state.bestSpeed || 0);
        ctx.state.bestSpeed = best; ctx.save(); $('.best', P).textContent = best; ctx.result(G.score, null); ctx.sfx.win();
        q.textContent = 'Time!'; setMsg(msg, 'You got ' + G.score + ' right.' + (isNew && G.score > 0 ? ' New best!' : ''), 'good'); $('[data-a="start"]', P).textContent = 'Play again';
      }
      btns.forEach(b => b.onclick = () => {
        if (!G.running || G.lock) return; G.lock = true;
        const want = G.cur.t.part, right = btns.find(x => x.dataset.p === want);
        if (b.dataset.p === want) { G.score++; $('.sc', P).textContent = G.score; ctx.credit(); ctx.sfx.good(); b.classList.add('right'); setMsg(msg, 'Yes!', 'good'); setTimeout(() => G.running && next(), 250); }
        else { ctx.slip(); ctx.sfx.bad(); b.classList.add('wrong'); right.classList.add('right'); setMsg(msg, reason(G.cur.t, G.cur.ti), 'bad'); setTimeout(() => G.running && next(), 1400); }
      });
      $('[data-a="start"]', P).onclick = () => {
        G.score = 0; G.time = SPEED_SECS; G.running = true; G.cur = null; $('.sc', P).textContent = 0; $('.tm', P).textContent = SPEED_SECS;
        $('[data-a="start"]', P).textContent = 'Restart'; setMsg(msg, 'Go!'); next(); clearInterval(G.timer);
        G.timer = setInterval(() => { G.time--; $('.tm', P).textContent = G.time; if (G.time <= 0) end(); }, 1000);
      };
      speed.leave = () => stop(true);
    }
  };

  /* ===================== Label the sentence ===================== */
  const LABEL_ROUNDS = 5;
  const label = {
    init(ctx) {
      const P = ctx.panel, L = { list: [], i: 0, score: 0, cur: null };
      function start() { L.list = shuffle(TRICKY).slice(0, LABEL_ROUNDS); L.i = 0; L.score = 0; show(); }
      function show() {
        if (L.i >= L.list.length) {
          ctx.result(L.score, L.list.length); ctx.sfx.win();
          P.innerHTML = `<h2>Label the sentence</h2><div class="result">${starsHTML(L.score, L.list.length)}<p class="prompt">${L.score} out of ${L.list.length} perfect</p><p class="lead">${L.score >= 4 ? 'Insane work. You really know your parts of speech.' : 'These are the hardest ones. Try the speed round, then come back.'}</p><button class="btn" data-a="again">Play again</button></div>`;
          $('[data-a="again"]', P).onclick = start; return;
        }
        const item = L.list[L.i], toks = parse(item.s), pick = [];
        P.innerHTML = `<h2>Label the sentence</h2><p class="lead">Pick a part of speech, then tap every word it fits. The underlined word may be doing a surprising job.</p>
          <div class="roundbar"><div class="bar" aria-hidden="true"><i style="width:${L.i / L.list.length * 100}%"></i></div><span class="hint">Sentence ${L.i + 1} of ${L.list.length} &middot; Perfect ${L.score}</span>${ctx.sayButton(plain(toks), 'Hear the sentence')}</div>
          <div class="words">${toks.map((t, i) => t.punct ? `<span class="punct">${esc(t.w)}</span>` : `<button class="wtok${t.star ? ' star' : ''}" data-i="${i}"><span class="w">${esc(t.w)}</span><span class="lab">&nbsp;</span></button>`).join('')}</div>
          <div class="palette" role="group" aria-label="Parts of speech">${ORDER.map(id => `<button data-p="${id}" aria-pressed="${L.cur === id}" class="ppill" style="${pv(id)}">${PART[id].name}</button>`).join('')}</div>
          <p class="msg">${L.cur ? '' : 'Pick a part of speech to start.'}</p><p class="why" hidden></p>
          <div class="row"><button class="btn" data-a="check" disabled>Check</button><button class="btn" data-a="next" hidden>${L.i === L.list.length - 1 ? 'See results' : 'Next sentence'}</button></div>`;
        const msg = $('.msg', P), check = $('[data-a="check"]', P), nextBtn = $('[data-a="next"]', P);
        const words = toks.map((t, i) => i).filter(i => !toks[i].punct);
        $$('.palette button', P).forEach(b => b.onclick = () => { L.cur = b.dataset.p; $$('.palette button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); setMsg(msg, 'Now tap each ' + lower(L.cur) + '.'); });
        $$('.wtok', P).forEach(b => b.onclick = () => {
          if (!L.cur) { setMsg(msg, 'Pick a part of speech first.', 'bad'); return; }
          const i = +b.dataset.i, lab = $('.lab', b);
          pick[i] = pick[i] === L.cur ? undefined : L.cur;
          if (pick[i]) { lab.textContent = PART[pick[i]].name; lab.className = 'lab set'; lab.style.cssText = pv(pick[i]); }
          else { lab.innerHTML = '&nbsp;'; lab.className = 'lab'; lab.style.cssText = ''; }
          check.disabled = !words.every(j => pick[j]);
        });
        check.onclick = () => {
          let wrong = 0;
          words.forEach(i => {
            const b = $(`.wtok[data-i="${i}"]`, P), ok = pick[i] === toks[i].part;
            b.disabled = true; b.classList.add(ok ? 'right' : 'wrong');
            if (!ok) { wrong++; const f = document.createElement('span'); f.className = 'fix'; f.textContent = PART[toks[i].part].name; b.appendChild(f); }
          });
          if (!wrong) { L.score++; ctx.credit(); ctx.sfx.good(); setMsg(msg, 'Every word is right!', 'good'); }
          else { ctx.slip(); ctx.sfx.bad(); setMsg(msg, wrong + (wrong === 1 ? ' word needs' : ' words need') + ' a different label. The right answer is in red under ' + (wrong === 1 ? 'it' : 'each one') + '.', 'bad'); }
          const why = $('.why', P); why.textContent = item.why; why.hidden = false;
          check.hidden = true; nextBtn.hidden = false; nextBtn.focus();
        };
        nextBtn.onclick = () => { L.i++; show(); };
        ctx.say(plain(toks));
      }
      start();
    }
  };

  SBM.start({ module: 'parts-of-speech', defaults: { bestSpeed: 0 }, tools: { guide, cards, sort, spot, speed, label } });
})();
