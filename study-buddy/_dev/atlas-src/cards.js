/* ---------- Flashcards ---------- */
const FC = { mode: 'shape', queue: [], cur: null, known: new Set(), missed: new Set(), total: 0, flipped: false, busy: false };
const FLIP_MS = 520;
function fcBuild() { FC.queue = shuffle(C.map(c => c.id)); FC.known = new Set(); FC.missed = new Set(); FC.total = C.length; fcNext(); }
const fcKindFor = () => FC.mode !== 'mix' ? FC.mode : ['shape', 'capital', 'flag'][Math.floor(Math.random() * 3)];
function fcSetFlip(on) { FC.flipped = on; $('#fcard').classList.toggle('flip', on); }
function fcNext() {
  stopSpeech(); fcSetFlip(false);
  if (!FC.queue.length) {
    if (FC.cur) report('cards', FC.total - FC.missed.size, FC.total);   // Study Buddy: known on the first try
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
function fcBar() { $('#cardBar').style.width = (FC.known.size / FC.total * 100) + '%'; $('#cardCount').textContent = FC.known.size + ' of ' + FC.total + ' known'; }
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
function fcAnswer(knew) {
  if (!FC.cur) return fcBuild();
  fcAfterUnflip(() => {
    const id = FC.queue.shift();
    if (knew) { FC.known.add(id); credit(id); sfx.good(); }
    else { FC.missed.add(id); const pos = Math.min(FC.queue.length, 3 + Math.floor(Math.random() * 3)); FC.queue.splice(pos, 0, id); slip(); sfx.bad(); }
    fcNext();
  });
}
inits.cards = () => {
  const card = $('#fcard');
  card.addEventListener('click', fcFlip);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fcFlip(); } });
  $('#cardKnew').onclick = () => fcAnswer(true);
  $('#cardAgain').onclick = () => fcAnswer(false);
  if (ON_HUB && HUB.swipeCard) HUB.swipeCard($('.cardstage'), card, { onRight: () => $('#cardKnew').click(), onLeft: () => $('#cardAgain').click() });   // swipe: right = I knew it, left = Still learning
  $('#cardSkip').onclick = () => { if (!FC.cur) return fcBuild(); fcAfterUnflip(() => { FC.queue.push(FC.queue.shift()); fcNext(); }); };
  $$('#cardMode button').forEach(b => b.onclick = () => { FC.mode = b.dataset.mode; $$('#cardMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); FC.busy = false; fcBuild(); });
  fcBuild();
};
