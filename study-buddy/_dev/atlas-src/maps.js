/* ---------- Study map (all names shown) ---------- */
inits.study = () => {
  const svg = $('#mapStudy'); buildMap(svg); makeZoom(svg);
  Object.entries(svg._paths).forEach(([id, p]) => {
    addLabel(svg, id);
    p.addEventListener('click', () => { if (clickOK(svg)) { speak(id, true); p.classList.remove('flash-good'); void p.getBBox(); p.classList.add('flash-good'); } });
  });
  $('#studyList').innerHTML = C.map(c => `<div class="srow"><div class="sf">${flagSVG(c.id)}</div><div class="st"><b>${c.name}</b><span>Capital: ${c.capital}</span></div>${spkBtn(c.id)}</div>`).join('');
};

/* ---------- Map: drag the names ---------- */
const DR = { svg: null, placed: new Set(), miss: 0, sel: null, mode: 'grey' };
const GREY = '#d6d2c4', BLANK = '#ece4cc';
function drPaint(id, placed) {
  const p = DR.svg._paths[id], col = COUNTRY_BY_ID[id].color;
  if (DR.mode === 'grey') p.style.fill = placed ? GREY : col;
  else if (DR.mode === 'reveal') p.style.fill = placed ? col : BLANK;
  else p.style.fill = col;
  p.style.strokeWidth = placed ? (DR.mode === 'grey' ? '1.6' : '3.4') : '';
  p.style.stroke = placed && DR.mode !== 'grey' ? '#2b4162' : '';
  if (placed && DR.mode !== 'grey') DR.svg.insertBefore(p, DR.svg._labels);   // draw on top so the thick border is fully visible
}
function drReset() {
  DR.svg = $('#mapDrag'); buildMap(DR.svg); DR.placed = new Set(); DR.miss = 0; DR.sel = null;
  C.forEach(c => drPaint(c.id, false));
  Object.entries(DR.svg._paths).forEach(([id, p]) => {
    p.addEventListener('click', () => { if (DR.sel && clickOK(DR.svg)) drTry(DR.sel, id); });
    p.addEventListener('pointerenter', () => { if (DR.sel) p.classList.add('hover'); });
    p.addEventListener('pointerleave', () => p.classList.remove('hover'));
  });
  const tray = $('#tray'); tray.innerHTML = '';
  shuffle(C).forEach(c => {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = c.name; b.dataset.id = c.id;
    b.addEventListener('pointerdown', e => drPointerDown(e, b));
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drSelect(c.id); } });
    tray.appendChild(b);
  });
  drScore(); $('#dMsg').className = 'msg'; $('#dMsg').textContent = 'Pick a name to begin.';
}
function drScore() { $('#dPlaced').textContent = DR.placed.size + '/' + C.length; $('#dMiss').textContent = DR.miss; }
function drSelect(id, quiet) {
  DR.sel = DR.sel === id ? null : id;
  $$('#tray .chip').forEach(ch => ch.classList.toggle('sel', ch.dataset.id === DR.sel));
  if (DR.sel) { $('#dMsg').className = 'msg'; $('#dMsg').textContent = 'Now tap ' + COUNTRY_BY_ID[DR.sel].name + ' on the map.'; if (!quiet) speak(DR.sel); }
}
function drPointerDown(e, chip) {
  if (e.button !== undefined && e.button > 0) return;
  const id = chip.dataset.id, sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
  chip.setPointerCapture(e.pointerId); speak(id);
  const mv = ev => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { moved = true; ghost = document.createElement('div'); ghost.className = 'ghostchip'; ghost.textContent = chip.textContent; document.body.appendChild(ghost); chip.style.opacity = .4; }
    if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
    if (moved) { const t = document.elementFromPoint(ev.clientX, ev.clientY); $$('#mapDrag .cpath.hover').forEach(x => x.classList.remove('hover')); const p = t && t.closest && t.closest('.cpath'); if (p) p.classList.add('hover'); }
  };
  const up = ev => {
    chip.removeEventListener('pointermove', mv); chip.removeEventListener('pointerup', up); chip.removeEventListener('pointercancel', up);
    $$('#mapDrag .cpath.hover').forEach(x => x.classList.remove('hover')); chip.style.opacity = '';
    if (moved) {
      ghost.remove();
      const t = document.elementFromPoint(ev.clientX, ev.clientY), p = t && t.closest && t.closest('.cpath');
      if (p && ev.type === 'pointerup') drTry(id, p.dataset.id);
      else { $('#dMsg').className = 'msg'; $('#dMsg').textContent = 'Drop the name right on a country.'; }
    } else drSelect(id, true);
  };
  chip.addEventListener('pointermove', mv); chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', up);
}
function drTry(id, target) {
  if (DR.placed.has(target)) { $('#dMsg').className = 'msg'; $('#dMsg').textContent = COUNTRY_BY_ID[target].name + ' is already placed.'; return; }
  const chip = $(`#tray .chip[data-id="${id}"]`), path = DR.svg._paths[target], msg = $('#dMsg');
  if (id === target) {
    DR.placed.add(id); chip.remove(); DR.sel = null; drPaint(id, true); addLabel(DR.svg, id); credit(id); sfx.good();
    path.classList.remove('flash-good'); void path.getBBox(); path.classList.add('flash-good');
    msg.className = 'msg good'; msg.textContent = 'Yes! That is ' + COUNTRY_BY_ID[id].name + '.'; drScore();
    if (DR.placed.size === C.length) {
      report('drag', Math.max(0, C.length - DR.miss), C.length);
      sfx.win(); msg.textContent = DR.miss === 0 ? 'Perfect! All ' + C.length + ' countries with no misses!' : 'Done! All ' + C.length + ' placed with ' + DR.miss + ' miss' + (DR.miss === 1 ? '' : 'es') + '.';
    }
  } else {
    DR.miss++; slip(); sfx.bad(); drScore();
    chip.classList.remove('shake'); void chip.offsetWidth; chip.classList.add('shake');
    path.classList.remove('flash-bad'); void path.getBBox(); path.classList.add('flash-bad');
    msg.className = 'msg bad'; msg.textContent = 'Not quite. That one is ' + COUNTRY_BY_ID[target].name + '. Try again.';
  }
}
inits.drag = () => {
  const svg = $('#mapDrag'); makeZoom(svg);
  $('#dReset').onclick = drReset;
  $('#dHint').onclick = () => {
    const id = DR.sel || ($('#tray .chip') && $('#tray .chip').dataset.id); if (!id) return;
    const p = DR.svg._paths[id]; p.classList.add('target'); setTimeout(() => p.classList.remove('target'), 1800);
    DR.miss++; drScore(); $('#dMsg').className = 'msg'; $('#dMsg').textContent = 'Hint: ' + COUNTRY_BY_ID[id].name + ' is outlined in orange.';
  };
  $$('#dragMode button').forEach(b => b.onclick = () => { DR.mode = b.dataset.m; $$('#dragMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); drReset(); });
  drReset();
};

/* ---------- Map: find it ---------- */
const FD = { svg: null, score: 0, time: 60, timer: null, target: null, running: false };
function stopFind(silent) {
  clearInterval(FD.timer); FD.running = false;
  if (silent && tabInit.find) { $('#fPrompt').textContent = 'Ready?'; $('#fStart').textContent = 'Start'; }
}
function fdNext() {
  let c; do { c = pick(C)[0]; } while (FD.target && c.id === FD.target && C.length > 1);
  FD.target = c.id; $('#fPrompt').innerHTML = 'Find <em>' + c.name + '</em> ' + spkBtn(c.id); speak(c.id);
}
function fdEnd() {
  clearInterval(FD.timer); FD.running = false; FD.target = null;
  const best = Math.max(state.best.find || 0, FD.score), isNew = FD.score > (state.best.find || 0);
  state.best.find = best; save(); $('#fBest').textContent = best; report('find', FD.score, null);
  $('#fPrompt').textContent = 'Time!'; $('#fMsg').className = 'msg good';
  $('#fMsg').textContent = 'You found ' + FD.score + ' countries.' + (isNew && FD.score > 0 ? ' New best!' : ''); $('#fStart').textContent = 'Play again'; sfx.win();
}
function fdStart() {
  FD.score = 0; FD.time = 60; FD.running = true; $('#fScore').textContent = 0; $('#fTime').textContent = 60; $('#fMsg').className = 'msg'; $('#fMsg').textContent = 'Go!'; $('#fStart').textContent = 'Restart';
  fdNext(); clearInterval(FD.timer);
  FD.timer = setInterval(() => { FD.time--; $('#fTime').textContent = FD.time; if (FD.time <= 0) fdEnd(); }, 1000);
}
function fdClick(id) {
  if (!FD.running || !clickOK(FD.svg)) return;
  const p = FD.svg._paths[id], msg = $('#fMsg');
  if (id === FD.target) {
    FD.score++; $('#fScore').textContent = FD.score; credit(id); sfx.good();
    p.classList.remove('flash-good'); void p.getBBox(); p.classList.add('flash-good'); msg.className = 'msg good'; msg.textContent = 'Yes! ' + COUNTRY_BY_ID[id].name + '.'; fdNext();
  } else {
    slip(); sfx.bad(); p.classList.remove('flash-bad'); void p.getBBox(); p.classList.add('flash-bad'); msg.className = 'msg bad'; msg.textContent = 'That is ' + COUNTRY_BY_ID[id].name + '. Keep looking for ' + COUNTRY_BY_ID[FD.target].name + '.';
  }
}
inits.find = () => {
  FD.svg = $('#mapFind'); buildMap(FD.svg); makeZoom(FD.svg);
  Object.entries(FD.svg._paths).forEach(([id, p]) => p.addEventListener('click', () => fdClick(id)));
  $('#fBest').textContent = state.best.find || 0; $('#fStart').onclick = fdStart;
};

/* ---------- Listen and tap (pronunciation practice) ---------- */
const LS = { svg: null, order: [], i: 0, score: 0, tries: 0, done: false };
function lsNew() {
  LS.order = shuffle(C.map(c => c.id)); LS.i = 0; LS.score = 0; LS.tries = 0; LS.done = false;
  buildMap(LS.svg); Object.entries(LS.svg._paths).forEach(([id, p]) => p.addEventListener('click', () => lsClick(id)));
  lsShow();
}
function lsShow() {
  $('#lScore').textContent = LS.score + '/' + C.length; $('#lRound').textContent = Math.min(LS.i + 1, C.length);
  if (LS.i >= C.length) {
    LS.done = true; report('listen', LS.score, C.length); $('#lPrompt').textContent = 'All done!'; $('#lMsg').className = 'msg good'; $('#lMsg').textContent = 'You got ' + LS.score + ' of ' + C.length + ' on the first try.'; $('#lPlay').textContent = 'Play again'; sfx.win(); return;
  }
  $('#lPrompt').textContent = 'Which country did you hear?'; $('#lPlay').textContent = 'Play the name again'; LS.tries = 0;
  speak(LS.order[LS.i], true);
}
function lsClick(id) {
  if (LS.done || !clickOK(LS.svg)) return;
  const want = LS.order[LS.i], p = LS.svg._paths[id], msg = $('#lMsg');
  if (id === want) {
    if (LS.tries === 0) LS.score++; credit(id); sfx.good(); p.classList.remove('flash-good'); void p.getBBox(); p.classList.add('flash-good');
    msg.className = 'msg good'; msg.textContent = 'Yes! ' + COUNTRY_BY_ID[id].name + '.'; LS.i++; setTimeout(lsShow, 900);
  } else {
    LS.tries++; slip(); sfx.bad(); p.classList.remove('flash-bad'); void p.getBBox(); p.classList.add('flash-bad');
    msg.className = 'msg bad'; msg.textContent = 'That is ' + COUNTRY_BY_ID[id].name + '. Listen again and try another.';
  }
}
inits.listen = () => {
  LS.svg = $('#mapListen'); makeZoom(LS.svg);
  $('#lPlay').onclick = () => { if (LS.done) { lsNew(); $('#lMsg').textContent = ''; } else speak(LS.order[LS.i], true); };
  $('#lSkip').onclick = () => { if (LS.done) return; LS.order.push(LS.order.splice(LS.i, 1)[0]); lsShow(); };
  if (!CAN_SPEAK) { $('#lPrompt').textContent = 'This browser cannot speak. Try Chrome, Edge, or Safari.'; return; }
  lsNew();
};
