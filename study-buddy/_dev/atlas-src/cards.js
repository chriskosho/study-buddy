/* ---------- Flashcards ---------- */
const FC = { mode: 'shape', queue: [], cur: null, known: new Set(), missed: new Set(), total: 0, flipped: false, busy: false, hist: [] };
const FLIP_MS = 520;
function fcBuild() { FC.hist = []; FC.queue = shuffle(C.map(c => c.id)); FC.known = new Set(); FC.missed = new Set(); FC.total = C.length; fcNext(); }
const fcKindFor = () => FC.mode !== 'mix' ? FC.mode : ['shape', 'capital', 'flag'][Math.floor(Math.random() * 3)];
function fcSetFlip(on) { FC.flipped = on; $('#fcard').classList.toggle('flip', on); }
function fcNext() {
  stopSpeech(); fcSetFlip(false);
  if (!FC.queue.length) {
    $('#faceF').innerHTML = `<div class="tag">Deck complete</div><div class="big">Great work!</div><div class="small">You went through all ${FC.total} cards. Press a button to go again.</div>`;
    $('#faceB').innerHTML = ''; FC.cur = null; sfx.win(); fcBar(); return;
  }
  const id = FC.queue[0], c = COUNTRY_BY_ID[id], kind = fcKindFor();
  FC.cur = { id, kind };
  let f, b;
  if (kind === 'shape') {
    f = `<div class="tag">Which country is this?</div>${miniMap(id, '#e4572e', false)}`;
    b = `<div class="tag">Answer</div><div class="big">${c.name}</div><div class="small">Capital: ${c.capital}${c.capitalNote ? ' (' + c.capitalNote + ')' : ''}</div><div class="flagbox">${flagSVG(id)}</div>${spkBtn(id)}`;
  } else if (kind === 'capital') {
    f = `<div class="tag">What is the capital?</div><div class="big">${c.name}</div>${spkBtn(id)}`;
    b = `<div class="tag">Capital</div><div class="big">${c.capital}</div><div class="small">${c.capitalNote || c.fact}</div>`;
  } else {
    f = `<div class="tag">Whose flag is this?</div><div class="flagbox">${flagSVG(id)}</div>`;
    b = `<div class="tag">Answer</div><div class="big">${c.name}</div><div class="small">Capital: ${c.capital}${c.capitalNote ? ' (' + c.capitalNote + ')' : ''}</div>${spkBtn(id)}`;
  }
  $('#faceF').innerHTML = f; $('#faceB').innerHTML = b; fcBar();
}
function fcBar() { $('#cardUndo').disabled = !FC.hist.length; $('#cardBar').style.width = (FC.known.size / FC.total * 100) + '%'; $('#cardCount').textContent = FC.known.size + ' of ' + FC.total + ' known'; }
function fcFlip() {
  if (!FC.cur || FC.busy) return;
  fcSetFlip(!FC.flipped);
  stopSpeech();   // flashcard sound is only ever played by pressing the speaker button, once
}
/* The card always turns back to its front first, and only then does the next card appear. */
function fcAfterUnflip(fn) {
  if (FC.busy) return;
  if (!FC.flipped) return fn();
  FC.busy = true; fcSetFlip(false);
  setTimeout(() => { FC.busy = false; fn(); }, FLIP_MS);
}
/* a short confirmation over the card, with an Undo link; Undo steps back one card at a time */
function fcToast(text, undo) {
  const zone = $('.cardzone');
  if (ON_HUB && HUB.cardToast) return HUB.cardToast(zone, text, undo);
  let t = $('.card-toast', zone); if (!t) { t = document.createElement('div'); t.className = 'card-toast'; t.setAttribute('role', 'status'); zone.appendChild(t); }
  t.innerHTML = '<span>' + text + '</span>' + (undo ? '<button type="button">Undo</button>' : '');
  if (undo) t.querySelector('button').onclick = () => { t.classList.remove('show'); undo(); };
  t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1100);
}
const fcSnap = () => { FC.hist.push({ q: FC.queue.slice(), k: new Set(FC.known), m: new Set(FC.missed) }); if (FC.hist.length > 300) FC.hist.shift(); };
function fcUndo() {
  if (FC.busy || !FC.hist.length) return;
  fcAfterUnflip(() => { const h = FC.hist.pop(); FC.queue = h.q; FC.known = h.k; FC.missed = h.m; fcNext(); fcToast('Undone'); });
}
function fcAnswer(knew) {
  if (!FC.cur) return fcBuild();
  fcAfterUnflip(() => {
    fcSnap();
    const id = FC.queue.shift();
    if (knew) { FC.known.add(id); sfx.good(); }
    else { FC.missed.add(id); const pos = Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)); FC.queue.splice(pos, 0, id); sfx.bad(); }
    fcNext(); fcToast(knew ? 'Knew it' : 'Still learning', fcUndo);
  });
}
inits.cards = () => {
  const card = $('#fcard');
  card.addEventListener('click', fcFlip);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fcFlip(); } });
  $('#cardKnew').onclick = () => fcAnswer(true);
  $('#cardAgain').onclick = () => fcAnswer(false);
  if (ON_HUB && HUB.swipeCard) HUB.swipeCard($('.cardstage'), card, { onRight: () => $('#cardKnew').click(), onLeft: () => $('#cardAgain').click() });   // swipe: right = I knew it, left = Still learning
  $('#cardSkip').onclick = () => { if (!FC.cur) return fcBuild(); fcAfterUnflip(() => { fcSnap(); FC.queue.push(FC.queue.shift()); fcNext(); fcToast('Skipped', fcUndo); }); };
  $('#cardUndo').onclick = fcUndo;
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '') && $('#tab-cards').offsetParent) { e.preventDefault(); fcUndo(); } });
  $$('#cardMode button').forEach(b => b.onclick = () => { FC.mode = b.dataset.mode; $$('#cardMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); FC.busy = false; fcBuild(); });
  fcBuild();
};
