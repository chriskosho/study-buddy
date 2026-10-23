/* ---------- Quiz ---------- */
const QZ = { qs: [], i: 0, score: 0, answered: false };
const QTYPES = ['shape', 'flag', 'capital', 'capitalRev', 'clue', 'border'];
const nameOpts = (id, n = 4) => shuffle([id, ...pick(C.filter(c => c.id !== id), n - 1).map(c => c.id)]).map(x => ({ v: x, label: COUNTRY_BY_ID[x].name }));
function makeQ(type, id) {
  const c = COUNTRY_BY_ID[id];
  if (type === 'shape') return { id, visual: miniMap(id), text: 'Which country is colored in?', opts: nameOpts(id), ans: id, why: c.name + '. Capital: ' + c.capital + '.' };
  if (type === 'flag') return { id, visual: `<div class="flagbox">${flagSVG(id)}</div>`, text: 'Whose flag is this?', opts: nameOpts(id), ans: id, why: 'That is the flag of ' + c.name + '.' };
  if (type === 'capital') {
    const o = shuffle([id, ...pick(C.filter(x => x.id !== id), 3).map(x => x.id)]).map(x => ({ v: x, label: COUNTRY_BY_ID[x].capital }));
    return { id, visual: '', text: 'What is the capital of ' + c.name + '?', opts: o, ans: id, why: c.capital + ' is the capital of ' + c.name + '.' + (c.capitalNote ? ' ' + c.capitalNote : '') };
  }
  if (type === 'capitalRev') return { id, visual: '', text: c.capital + ' is the capital of which country?', opts: nameOpts(id), ans: id, why: c.capital + ' is in ' + c.name + '.' };
  if (type === 'clue') return { id, visual: '', text: c.clue, opts: nameOpts(id), ans: id, why: c.name + '. ' + c.fact };
  if (type === 'border') {
    const non = C.filter(x => x.id !== id && !c.neighbors.includes(x.id)).map(x => x.id);
    if (non.length < 3) return null;
    const right = pick(c.neighbors)[0];
    const o = shuffle([right, ...pick(non, 3)]).map(x => ({ v: x, label: COUNTRY_BY_ID[x].name }));
    return { id, visual: miniMap(id, '#f6b73c', false), text: 'Which country shares a border with ' + c.name + '?', opts: o, ans: right, why: c.name + ' borders ' + c.neighbors.map(n => COUNTRY_BY_ID[n].name).join(', ') + '.' };
  }
}
function quizBuild() {
  const qs = [], used = {}, seen = new Set();
  for (const type of shuffle([...QTYPES, ...QTYPES]).slice(0, 10)) {
    for (let tries = 0; tries < 30; tries++) {
      const id = pick(C)[0].id;
      if ((used[id] || 0) >= 2 || seen.has(type + id)) continue;
      const q = makeQ(type, id); if (!q) continue;
      q.type = type; used[id] = (used[id] || 0) + 1; seen.add(type + id); qs.push(q); break;
    }
  }
  QZ.qs = shuffle(qs); QZ.i = 0; QZ.score = 0; quizShow();
}
const starsHTML = n => `<div class="stars">${[0, 1, 2].map(i => `<span class="${i < n ? '' : 'off'}">&#9733;</span>`).join('')}</div>`;
function quizShow() {
  const box = $('#quizBox');
  if (QZ.i >= QZ.qs.length) {
    const s = QZ.score, n = QZ.qs.length, stars = s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0;
    const best = Math.max(state.best.quiz || 0, s); state.best.quiz = best; save(); sfx.win();
    box.innerHTML = `<div class="result"><h2>Quiz complete</h2>${starsHTML(stars)}
      <p class="prompt">${s} out of ${n}</p><p class="lead">${stars === 3 ? 'Amazing! You really know South America.' : stars === 2 ? 'Great job. A little more practice and you will have it.' : 'Good start. Try the flashcards, then come back.'} Best score: ${best}</p>
      <button class="btn" id="qAgain">Play again</button></div>`;
    $('#qAgain').onclick = quizBuild; return;
  }
  const q = QZ.qs[QZ.i]; QZ.answered = false;
  box.innerHTML = `<div class="deckbar"><div class="bar"><i style="width:${QZ.i / QZ.qs.length * 100}%"></i></div><span class="hint">Question ${QZ.i + 1} of ${QZ.qs.length} &middot; Score ${QZ.score}</span></div>
    <div class="qvisual">${q.visual}</div><p class="qtext">${q.text}</p>
    <div class="opts">${q.opts.map(o => `<button class="opt" data-v="${o.v}">${o.label}</button>`).join('')}</div>
    <div class="explain" id="qWhy"></div><div class="row center" style="margin-top:10px"><button class="btn" id="qNext" hidden>${QZ.i === QZ.qs.length - 1 ? 'See results' : 'Next question'}</button></div>`;
  $$('.opt', box).forEach(b => b.onclick = () => quizAnswer(b, q));
  $('#qNext').onclick = () => { QZ.i++; quizShow(); };
}
function quizAnswer(btn, q) {
  if (QZ.answered) return; QZ.answered = true;
  const ok = btn.dataset.v === q.ans;
  $$('.opt').forEach(b => { b.disabled = true; if (b.dataset.v === q.ans) b.classList.add('right'); });
  if (ok) { QZ.score++; credit(q.id); sfx.good(); } else { btn.classList.add('wrong'); slip(); sfx.bad(); }
  $('#qWhy').innerHTML = (ok ? '<b style="color:var(--good)">Correct!</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + q.why + ' ' + spkBtn(q.id);
  $('#qNext').hidden = false; $('#qNext').focus();
}
inits.quiz = quizBuild;

/* ---------- Spell it ---------- */
const SP = { order: [], i: 0, score: 0, tries: 0, hinted: false };
function spellNew() { SP.order = pick(C, 10).map(c => c.id); SP.i = 0; SP.score = 0; spellShow(); }
function spellShow() {
  const box = $('#spellBox');
  if (SP.i >= SP.order.length) {
    const s = SP.score, n = SP.order.length, stars = s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0; sfx.win();
    state.best.spell = Math.max(state.best.spell || 0, s); save(); report('spell', s, n);
    box.innerHTML = `<div class="result"><h2>Spelling complete</h2>${starsHTML(stars)}<p class="prompt">${s} out of ${n}</p><p class="lead">Best: ${state.best.spell}</p><button class="btn" id="spAgain">Play again</button></div>`;
    $('#spAgain').onclick = spellNew; return;
  }
  const id = SP.order[SP.i], c = COUNTRY_BY_ID[id]; SP.tries = 0; SP.hinted = false;
  box.innerHTML = `<div class="deckbar"><div class="bar"><i style="width:${SP.i / SP.order.length * 100}%"></i></div><span class="hint">Country ${SP.i + 1} of ${SP.order.length} &middot; Score ${SP.score}</span></div>
    <div class="spellgrid"><div class="qvisual">${miniMap(id, '#e4572e', false)}</div><div><p class="qtext">Type the name of the country colored in</p>
    <form class="spellrow" id="spForm" autocomplete="off"><input id="spIn" aria-label="Country name" placeholder="Country name" autocapitalize="words" spellcheck="false"><button class="btn" type="submit">Check</button></form>
    <div class="err" id="spErr" role="alert"></div><div class="row"><button type="button" class="btn ghost" id="spHint">Hint</button><button type="button" class="btn ghost" id="spNext" hidden>Next</button></div></div></div>`;
  const inp = $('#spIn'); inp.focus();
  inp.oninput = () => { inp.classList.remove('bad'); $('#spErr').textContent = ''; };
  $('#spHint').onclick = () => { SP.hinted = true; $('#spErr').style.color = 'var(--ink2)'; $('#spErr').textContent = 'Starts with "' + c.name[0] + '" and has ' + c.name.length + ' letters.'; inp.focus(); };
  $('#spForm').onsubmit = e => {
    e.preventDefault();
    const v = inp.value.trim();
    if (!v) { inp.classList.add('bad'); $('#spErr').style.color = ''; $('#spErr').textContent = 'Type a name first.'; return; }
    const ok = norm(v) === norm(c.name) || norm(v) === norm(c.local);
    if (ok) { SP.score += SP.hinted ? 0 : 1; if (!SP.hinted) credit(id); sfx.good(); speak(id); $('#spErr').style.color = 'var(--good)'; $('#spErr').textContent = 'Correct! ' + c.name + (SP.hinted ? ' (hint used, so no point)' : '') + '.'; spellDone(); }
    else {
      SP.tries++; slip(); sfx.bad(); inp.classList.add('bad'); $('#spErr').style.color = '';
      if (SP.tries >= 2) { $('#spErr').textContent = 'It is spelled ' + c.name + '.'; spellDone(); }
      else $('#spErr').textContent = 'Not quite. Check the spelling and try again.';
    }
  };
  $('#spNext').onclick = () => { SP.i++; spellShow(); };
}
function spellDone() { $('#spIn').disabled = true; $('#spForm button').disabled = true; $('#spNext').hidden = false; $('#spHint').hidden = true; $('#spNext').focus(); }
inits.spell = spellNew;

/* ---------- Which is bigger? ---------- */
const BG = { kind: 'area', order: [], i: 0, score: 0, answered: false };
const fmt = n => n.toLocaleString('en-US');
function bigNew() {
  const pairs = []; let guard = 0;
  while (pairs.length < 10 && guard++ < 200) {
    const [a, b] = pick(C, 2); const x = a[BG.kind === 'area' ? 'area' : 'pop'], y = b[BG.kind === 'area' ? 'area' : 'pop'];
    if (Math.max(x, y) / Math.min(x, y) < 1.25) continue;
    if (pairs.some(p => p[0] === a.id && p[1] === b.id || p[0] === b.id && p[1] === a.id)) continue;
    pairs.push([a.id, b.id]);
  }
  BG.order = pairs; BG.i = 0; BG.score = 0; bigShow();
}
function bigShow() {
  const box = $('#bigBox');
  const toggle = `<div class="row center" style="margin-bottom:10px"><div class="seg" id="bgKind"><button data-k="area" aria-pressed="${BG.kind === 'area'}">Bigger area</button><button data-k="pop" aria-pressed="${BG.kind === 'pop'}">More people</button></div></div>`;
  const wire = () => $$('#bgKind button').forEach(b => b.onclick = () => { BG.kind = b.dataset.k; bigNew(); });
  if (BG.i >= BG.order.length) {
    const s = BG.score, n = BG.order.length, stars = s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0; sfx.win();
    state.best['big-' + BG.kind] = Math.max(state.best['big-' + BG.kind] || 0, s); save();
    box.innerHTML = toggle + `<div class="result"><h2>Round complete</h2>${starsHTML(stars)}<p class="prompt">${s} out of ${n}</p><p class="lead">Best: ${state.best['big-' + BG.kind]}</p><button class="btn" id="bgAgain">Play again</button></div>`;
    wire(); $('#bgAgain').onclick = bigNew; return;
  }
  const [a, b] = BG.order[BG.i].map(id => COUNTRY_BY_ID[id]); BG.answered = false;
  const card = c => `<button class="vbtn" data-id="${c.id}"><div class="flagbox">${flagSVG(c.id)}</div>${c.name}<small></small></button>`;
  box.innerHTML = toggle + `<div class="deckbar"><div class="bar"><i style="width:${BG.i / BG.order.length * 100}%"></i></div><span class="hint">Round ${BG.i + 1} of ${BG.order.length} &middot; Score ${BG.score}</span></div>
    <p class="qtext">${BG.kind === 'area' ? 'Which country is bigger?' : 'Which country has more people?'}</p><div class="versus">${card(a)}${card(b)}</div>
    <div class="explain" id="bgWhy"></div><div class="row center" style="margin-top:10px"><button class="btn" id="bgNext" hidden>${BG.i === BG.order.length - 1 ? 'See results' : 'Next'}</button></div>`;
  wire();
  const key = BG.kind === 'area' ? 'area' : 'pop', winner = a[key] > b[key] ? a : b;
  $$('.vbtn').forEach(btn => btn.onclick = () => {
    if (BG.answered) return; BG.answered = true;
    const ok = btn.dataset.id === winner.id;
    $$('.vbtn').forEach(x => { x.disabled = true; const c = COUNTRY_BY_ID[x.dataset.id]; x.querySelector('small').textContent = BG.kind === 'area' ? fmt(c.area) + ' km²' : 'about ' + fmt(c.pop); if (x.dataset.id === winner.id) x.classList.add('right'); });
    if (ok) { BG.score++; credit(winner.id); sfx.good(); } else { btn.classList.add('wrong'); slip(); sfx.bad(); }
    $('#bgWhy').innerHTML = (ok ? '<b style="color:var(--good)">Correct!</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + winner.name + ' is ' + (BG.kind === 'area' ? 'bigger.' : 'home to more people.');
    $('#bgNext').hidden = false; $('#bgNext').focus();
  });
  $('#bgNext').onclick = () => { BG.i++; bigShow(); };
}
inits.bigger = bigNew;

/* ---------- Memory match ---------- */
const MM = { mode: 'capital', n: 6, cards: [], open: [], lock: false, moves: 0, pairs: 0 };
const mmKey = () => `mem-${MM.mode}-${MM.n}`;
function mmBuild() {
  const chosen = pick(C, MM.n); MM.cards = []; MM.open = []; MM.lock = false; MM.moves = 0; MM.pairs = 0;
  chosen.forEach(c => {
    if (MM.mode === 'capital') MM.cards.push({ id: c.id, html: c.name }, { id: c.id, html: c.capital });
    else MM.cards.push({ id: c.id, html: flagSVG(c.id) }, { id: c.id, html: c.name });
  });
  MM.cards = shuffle(MM.cards);
  const g = $('#mgrid'); g.style.gridTemplateColumns = 'repeat(4,1fr)'; g.innerHTML = '';
  MM.cards.forEach((card, i) => {
    const b = document.createElement('button'); b.className = 'mcard'; b.setAttribute('aria-label', 'Hidden card ' + (i + 1));
    b.innerHTML = `<div class="in"><div class="f front">?</div><div class="f back">${card.html}</div></div>`;
    b.onclick = () => mmFlip(i, b); g.appendChild(b);
  });
  $('#mPairs').textContent = '0'; $('#mMoves').textContent = '0'; $('#mBest').textContent = state.best[mmKey()] || '-'; $('#mMsg').textContent = '';
  $('#memLead').textContent = MM.mode === 'capital' ? 'Flip two cards. Match each country with its capital.' : 'Flip two cards. Match each flag with its country.';
}
function mmFlip(i, el) {
  if (MM.lock || el.classList.contains('up') || el.classList.contains('done')) return;
  el.classList.add('up'); MM.open.push({ i, el });
  if (MM.open.length < 2) return;
  MM.moves++; $('#mMoves').textContent = MM.moves; MM.lock = true;
  const [a, b] = MM.open;
  if (MM.cards[a.i].id === MM.cards[b.i].id) {
    a.el.classList.replace('up', 'done'); b.el.classList.replace('up', 'done'); MM.pairs++; $('#mPairs').textContent = MM.pairs; credit(MM.cards[a.i].id); sfx.good(); speak(MM.cards[a.i].id);
    MM.open = []; MM.lock = false;
    if (MM.pairs === MM.n) {
      const prev = state.best[mmKey()]; const nb = !prev || MM.moves < prev; if (nb) { state.best[mmKey()] = MM.moves; save(); $('#mBest').textContent = MM.moves; }
      $('#mMsg').className = 'msg good'; $('#mMsg').textContent = 'You matched them all in ' + MM.moves + ' moves.' + (nb ? ' New best!' : ''); sfx.win();
    }
  } else {
    sfx.bad();
    setTimeout(() => { a.el.classList.remove('up'); b.el.classList.remove('up'); MM.open = []; MM.lock = false; }, 950);
  }
}
inits.memory = () => {
  $$('#memMode button').forEach(b => b.onclick = () => { MM.mode = b.dataset.m; $$('#memMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); mmBuild(); });
  $$('#memSize button').forEach(b => b.onclick = () => { MM.n = +b.dataset.n; $$('#memSize button').forEach(x => x.setAttribute('aria-pressed', x === b)); mmBuild(); });
  $('#mNew').onclick = mmBuild; mmBuild();
};
