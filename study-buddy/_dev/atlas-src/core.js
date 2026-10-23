/* ---------- Helpers, storage, sound, speech, streak ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n = 1) => shuffle(a).slice(0, n);
const C = REGION.countries;
const SVGNS = 'http://www.w3.org/2000/svg';
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

/* ---------- Study Buddy bridge ----------
   Inside Study Buddy, shared/sb-core.js is loaded first and window.SB exists. Progress is then saved per child,
   the streak and daily goal are shared across Study Buddy, and finished rounds are reported to the hub.
   Opened on its own (no SB), the app behaves exactly as before. */
const HUB = (window.SB && window.SB.ready) ? window.SB : null;
const KID = HUB ? HUB.requireProfile() : null;
const ON_HUB = !!(HUB && KID);
const report = (tool, score, max) => { if (ON_HUB) HUB.result(REGION.key, tool, score, max); };

const STORE_KEY = ON_HUB ? HUB.moduleKey('explorers-atlas.' + REGION.key) : 'explorers-atlas.' + REGION.key;
const DAILY_GOAL = ON_HUB ? HUB.DAILY_GOAL : 20;
let state = { mastery: {}, best: {}, sound: true, say: true, voice: 'en', daily: { d: '', n: 0, done: false } };
try { const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s) state = Object.assign(state, s); } catch (e) {}
if (ON_HUB) { state.sound = HUB.getSetting('sound'); state.say = !!HUB.getSetting('readAloud'); }   // Sound and Say names follow each child's Display settings (Say names = Read aloud, off by default)   // Sound is one setting per child across Study Buddy
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

let actx = null;
function tone(freqs, dur = 0.12) {
  if (!state.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const t = actx.currentTime + i * dur;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch (e) {}
}
const sfx = { good: () => tone([660, 880]), bad: () => tone([220, 180], 0.14), win: () => tone([523, 659, 784, 1046], 0.13) };

let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }

/* ---------- Speech ---------- */
const CAN_SPEAK = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const SPK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const spkBtn = (id, cls = '') => CAN_SPEAK ? `<button type="button" class="spk ${cls}" data-say="${id}" aria-label="Hear ${COUNTRY_BY_ID[id].name}" title="Hear the name">${SPK_ICON}</button>` : '';
let speakTok = 0, speakTimer = null;
function stopSpeech() {
  try { speechSynthesis.cancel(); } catch (e) {}
  speakTok++; clearTimeout(speakTimer); $$('.spk.playing').forEach(b => b.classList.remove('playing'));
}
function speak(id, force) {            // force = speak even if "Say names" is off (used by speaker buttons)
  if (!CAN_SPEAK || (!force && !state.say)) return;
  try {
    const c = COUNTRY_BY_ID[id], local = state.voice === 'local';
    stopSpeech(); const tok = speakTok;
    const u = new SpeechSynthesisUtterance(local ? c.local : c.name);
    u.lang = local ? c.lang : 'en-US'; u.rate = 0.85;
    const done = () => { if (tok === speakTok) { clearTimeout(speakTimer); $$('.spk.playing').forEach(b => b.classList.remove('playing')); } };
    u.onend = done; u.onerror = done;
    $$(`[data-say="${id}"]`).forEach(b => b.classList.add('playing'));   // icon lights up while the name plays
    speakTimer = setTimeout(done, 5000);                                  // safety net if the browser never reports the end
    speechSynthesis.speak(u);
  } catch (e) {}
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); speak(b.dataset.say, true); }
}, true);

/* ---------- Streak, daily goal, passport ---------- */
let streak = 0;
const STAMP_AT = 3;
function dailyCheck() { if (state.daily.d !== today()) state.daily = { d: today(), n: 0, done: false }; }
function renderStreak() {
  if (ON_HUB) { const s = HUB.streakInfo(); $('#streakN').textContent = s.streak; $('#dailyN').textContent = Math.min(s.daily, DAILY_GOAL); $('#dailyGoal').textContent = DAILY_GOAL; return; }
  dailyCheck(); $('#streakN').textContent = streak; $('#dailyN').textContent = Math.min(state.daily.n, DAILY_GOAL); $('#dailyGoal').textContent = DAILY_GOAL;
}
function credit(id) {                  // learner got a country right
  const before = state.mastery[id] || 0;
  state.mastery[id] = before + 1;
  let run, goalHit = false;
  if (ON_HUB) { const r = HUB.credit(); run = r.streak; goalHit = r.goalJustReached; }
  else {
    streak++; run = streak; state.best.streak = Math.max(state.best.streak || 0, streak);
    dailyCheck(); state.daily.n++;
    if (state.daily.n === DAILY_GOAL && !state.daily.done) { state.daily.done = true; goalHit = true; }
  }
  if (before + 1 === STAMP_AT) toast('Passport stamp earned: ' + COUNTRY_BY_ID[id].name + '!');
  else if (goalHit) { toast('Daily goal reached! Great studying.'); sfx.win(); }
  else if (run > 0 && run % 5 === 0) toast(run + ' in a row!');
  save(); renderPassport(); renderStreak();
}
function slip() { if (ON_HUB) HUB.slip(); else streak = 0; renderStreak(); }   // learner got one wrong
function renderPassport() {
  const box = $('#stamps');
  if (!box.children.length) C.forEach(c => { const d = document.createElement('div'); d.className = 'stamp'; d.dataset.id = c.id; d.title = c.name; d.innerHTML = flagSVG(c.id); box.appendChild(d); });
  let n = 0;
  $$('.stamp').forEach(s => { const on = (state.mastery[s.dataset.id] || 0) >= STAMP_AT; s.classList.toggle('on', on); if (on) n++; });
  $('#stampCount').textContent = n + '/' + C.length;
}

/* ---------- Map rendering ---------- */
function buildMap(svg) {
  const vb = svg._vb || { x: 0, y: 0, w: MAPDATA.width, h: MAPDATA.height };
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  svg.innerHTML = '';
  const g0 = document.createElementNS(SVGNS, 'g');
  Object.entries(MAPDATA.context).forEach(([k, d]) => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'ctx'); if (k === 'frenchGuiana') p.innerHTML = '<title>French Guiana (part of France)</title>'; g0.appendChild(p); });
  svg.appendChild(g0);
  const paths = {}, gl = document.createElementNS(SVGNS, 'g');
  C.forEach(c => {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', MAPDATA.countries[c.id].d);
    p.setAttribute('class', 'land cpath');
    p.dataset.id = c.id; p.style.fill = c.color;
    // keyboard access: every country can be focused and pressed with Enter or Space.
    // Only the Study map names the country; the quiz maps stay generic so they do not give the answer away.
    p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', svg.id === 'mapStudy' ? c.name : 'Country on the map');
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    svg.appendChild(p); paths[c.id] = p;
  });
  svg.appendChild(gl);
  svg._paths = paths; svg._labels = gl;
  return paths;
}
function addLabel(svg, id) {
  const m = MAPDATA.countries[id].label, t = REGION.labelTweaks[id] || {};
  const x = t.x ?? (m[0] + (t.dx || 0)), y = t.y ?? (m[1] + (t.dy || 0)), size = t.size || 12;
  const el = document.createElementNS(SVGNS, 'text');
  el.setAttribute('class', 'lbl'); el.setAttribute('x', x); el.setAttribute('y', y + size * 0.35); el.style.fontSize = size + 'px';
  if (t.rot) el.setAttribute('transform', `rotate(${t.rot} ${x} ${y})`);
  el.textContent = COUNTRY_BY_ID[id].name; el.dataset.id = id;
  svg._labels.appendChild(el);
}

/* zoom + pan for a map svg (buttons, mouse wheel, drag to pan when zoomed) */
function makeZoom(svg) {
  const full = { x: 0, y: 0, w: MAPDATA.width, h: MAPDATA.height };
  const vb = svg._vb = { ...full };
  const apply = () => { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); svg.classList.toggle('zoomed', vb.w < full.w - 1); };
  const clampPan = () => { vb.x = Math.min(Math.max(vb.x, full.x - vb.w * 0.1), full.x + full.w - vb.w * 0.9); vb.y = Math.min(Math.max(vb.y, full.y - vb.h * 0.1), full.y + full.h - vb.h * 0.9); };
  const zoomAt = (f, cx, cy) => {
    const nw = Math.min(full.w, Math.max(full.w / 6, vb.w / f)), nh = nw * full.h / full.w, k = nw / vb.w;
    vb.x = cx - (cx - vb.x) * k; vb.y = cy - (cy - vb.y) * k; vb.w = nw; vb.h = nh; clampPan(); apply();
  };
  const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return [vb.x + (cx - r.left) / r.width * vb.w, vb.y + (cy - r.top) / r.height * vb.h]; };
  const bar = document.createElement('div'); bar.className = 'zoombar';
  bar.innerHTML = '<button type="button" aria-label="Zoom in" title="Zoom in">+</button><button type="button" aria-label="Zoom out" title="Zoom out">&minus;</button><button type="button" aria-label="Reset zoom" title="Show the whole map" style="font-size:13px">All</button>';
  svg.parentElement.appendChild(bar);
  const [bi, bo, br] = bar.children, mid = () => [vb.x + vb.w / 2, vb.y + vb.h / 2];
  bi.onclick = () => zoomAt(1.6, ...mid()); bo.onclick = () => zoomAt(1 / 1.6, ...mid());
  br.onclick = () => { Object.assign(vb, full); apply(); };
  svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, ...toSvg(e.clientX, e.clientY)); }, { passive: false });
  let pan = null;
  svg.addEventListener('pointerdown', e => { if (vb.w < full.w - 1 && e.button === 0) pan = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; });
  svg.addEventListener('pointermove', e => {
    if (!pan) return;
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 6) { pan.moved = true; try { svg.setPointerCapture(pan.id); } catch (er) {} }
    if (pan.moved) { const r = svg.getBoundingClientRect(); vb.x -= dx / r.width * vb.w; vb.y -= dy / r.height * vb.h; pan.x = e.clientX; pan.y = e.clientY; clampPan(); apply(); }
  });
  const end = () => { if (pan && pan.moved) { svg._justPanned = true; setTimeout(() => svg._justPanned = false, 50); } pan = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  apply();
}
const clickOK = svg => !svg._justPanned;

/* zoomed-in mini map of one country (so small countries are easy to see) */
const BBOX = {};
function computeBoxes() {
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', `0 0 ${MAPDATA.width} ${MAPDATA.height}`); s.style.cssText = 'position:absolute;width:10px;height:10px;visibility:hidden';
  document.body.appendChild(s);
  C.forEach(c => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', MAPDATA.countries[c.id].d); s.appendChild(p); BBOX[c.id] = p.getBBox(); });
  s.remove();
}
function zoomBox(id) {
  const b = BBOX[id], size = Math.min(MAPDATA.height, Math.max(190, Math.max(b.width, b.height) * 1.3));
  return `${(b.x + b.width / 2 - size / 2).toFixed(1)} ${(b.y + b.height / 2 - size / 2).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`;
}
const miniMap = (id, hi = '#e4572e', zoom = true) => {
  const vb = zoom ? zoomBox(id) : `0 0 ${MAPDATA.width} ${MAPDATA.height}`;
  const ctx = Object.values(MAPDATA.context).map(d => `<path d="${d}" fill="#ece6d3" stroke="#cfc7ae" stroke-width="1"/>`).join('');
  const all = C.map(c => `<path d="${MAPDATA.countries[c.id].d}" fill="${c.id === id ? hi : '#f6efdb'}" stroke="${c.id === id ? '#8c2f12' : '#b9ad8a'}" stroke-width="${c.id === id ? 2 : 1.2}" stroke-linejoin="round"/>`).join('');
  return `<svg class="mini" viewBox="${vb}" aria-hidden="true">${ctx}${all}</svg>`;
};

/* ---------- Tabs ---------- */
const tabInit = {}, inits = {};
function showTab(name) {
  $$('nav.tabs button').forEach(b => { b.setAttribute('aria-selected', b.dataset.tab === name); if (b.dataset.tab === name && b.scrollIntoView && innerWidth <= 760) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });   // phones: keep the chosen tab in view in the swipeable row
  $$('section.panel').forEach(s => s.hidden = s.id !== 'tab-' + name);
  if (!tabInit[name]) { tabInit[name] = true; (inits[name] || (() => {}))(); }
  if (name !== 'find') stopFind(true);
  stopSpeech();
  if (ON_HUB) HUB.opened(REGION.key, name);
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#title').textContent = REGION.title;
  document.title = "Explorer's Atlas: " + REGION.title;
  if (ON_HUB) {
    document.title = REGION.title + ' · Study Buddy';
    const hub = HUB.BASE + 'index.html';
    $('#brand').innerHTML = `<a href="${hub}#/module/${REGION.key}" title="Back to Study Buddy">&lsaquo; Study Buddy</a> &middot; Geography`;
    const k = $('#kidChip'); k.href = hub + '#/'; k.innerHTML = HUB.avatar(KID) + '<b>' + HUB.esc(KID.name) + '</b>'; k.hidden = false;
    if (HUB.isGuest(KID)) { k.innerHTML += ' <span style="font-size:13px;color:var(--ink2)">Add a name</span>'; k.title = 'Add your name to keep your progress'; k.onclick = e => { e.preventDefault(); HUB.nameDialog(() => location.reload()); }; }
  }
  if (!CAN_SPEAK) { document.body.classList.add('no-speech'); $('#sayBtn').hidden = true; $('#voiceBtn').hidden = true; }
  computeBoxes(); renderPassport(); renderStreak();
  $$('nav.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  const paint = () => {
    const s = $('#soundBtn'), a = $('#sayBtn'), v = $('#voiceBtn');
    s.textContent = 'Sound: ' + (state.sound ? 'on' : 'off'); s.setAttribute('aria-pressed', state.sound);
    a.textContent = 'Say names: ' + (state.say ? 'on' : 'off'); a.setAttribute('aria-pressed', state.say);
    v.textContent = 'Voice: ' + (state.voice === 'local' ? 'Local' : 'English'); v.setAttribute('aria-pressed', state.voice === 'local');
  };
  $('#soundBtn').onclick = () => { state.sound = !state.sound; if (ON_HUB) HUB.setSetting('sound', state.sound); save(); paint(); if (state.sound) sfx.good(); };
  $('#sayBtn').onclick = () => { state.say = !state.say; if (ON_HUB) HUB.setSetting('readAloud', state.say); save(); paint(); if (state.say) speak(pick(C)[0].id); };
  $('#voiceBtn').onclick = () => { state.voice = state.voice === 'local' ? 'en' : 'local'; save(); paint(); speak(pick(C)[0].id, true); };
  paint();
  if (ON_HUB) { const db = $('#displayBtn'); db.hidden = false; db.onclick = () => HUB.displayDialog(() => { state.sound = HUB.getSetting('sound'); state.say = !!HUB.getSetting('readAloud'); paint(); }); }
  const resetNow = () => { state = Object.assign(state, { mastery: {}, best: {}, daily: { d: today(), n: 0, done: false } }); streak = 0; if (ON_HUB) HUB.resetModule(KID.id, REGION.key, []); save(); renderPassport(); renderStreak(); toast('Progress reset'); };
  $('#resetAll').onclick = () => {
    if (ON_HUB) HUB.requirePin('Enter the parent PIN to erase ' + KID.name + "'s " + REGION.title + ' stamps and best scores.', resetNow, null, { confirm: { title: 'Reset ' + REGION.title + '?', text: 'This erases ' + KID.name + "'s stamps and best scores here. Other modules and settings stay.", ok: 'Reset progress' } });
    else if (confirm('Erase all saved stamps and best scores?')) resetNow();
  };
  const want = new URLSearchParams(location.search).get('tool'), wb = want && $(`nav.tabs button[data-tab="${want}"]`);
  showTab(wb && !wb.hidden ? want : 'cards');
});
