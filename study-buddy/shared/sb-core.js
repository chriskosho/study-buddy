/* Study Buddy core.
   Loaded by every page (the hub and every module). It owns:
   - student profiles and which student is studying
   - progress: streak, daily goal, and per-tool results
   - per-child settings (sound, read aloud)
   - tones, speech, toast
   - the admin PIN lock and small dialogs
   - backup export / import
   Everything is saved in this browser's localStorage. Nothing goes online.

   Module API (what a tool calls):
     SB.requireProfile()            -> the active student, or sends the page back to the hub
     SB.moduleKey('my-module')      -> a localStorage key private to this student + module
     SB.opened(moduleId, toolId)    -> when a tool is opened (sets "Keep going", counts visits)
     SB.credit() / SB.slip()        -> one right / one wrong answer (streak + daily goal)
     SB.result(moduleId, toolId, score, max) -> a finished round (best score, attempts)
     SB.sfx.good() / bad() / win()  -> tones (respect the student's Sound setting)
     SB.say(text, {lang, force})    -> speech (respects Read aloud unless force is true)
     SB.toast(msg), SB.requirePin(message, onOk), SB.confirm(...)
*/
(function () {
  'use strict';
  if (window.SB) return;

  const NS = 'studybuddy.v1';
  const ROOT = NS + '.root';
  const CHILD = id => NS + '.child.' + id;
  const MODPREFIX = id => NS + '.m.' + id + '.';
  const EPOCH = NS + '.epoch';   // bumped by resets and backup loads, so other open tabs reload instead of writing old progress back
  const bumpEpoch = () => { try { localStorage.setItem(EPOCH, String(Date.now())); } catch (e) {} };
  const DAILY_GOAL = 20;
  const UNLOCK_MS = 5 * 60 * 1000;
  const DIFFS = ['easy', 'medium', 'hard', 'insane'];
  const DIFF_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard', insane: 'Insane' };
  const COLORS = [
    { c: '#e4572e', ink: '#fff' }, { c: '#1b998b', ink: '#fff' }, { c: '#2b4162', ink: '#fff' },
    { c: '#2e9e5b', ink: '#fff' }, { c: '#f6b73c', ink: '#23313f' }, { c: '#8a5fbf', ink: '#fff' },
    { c: '#d9668f', ink: '#fff' }, { c: '#5b8fd6', ink: '#fff' }
  ];

  /* base URL of the site, worked out from this script's own address */
  const BASE = (() => {
    try { const s = document.currentScript && document.currentScript.src; if (s) return s.replace(/shared\/sb-core\.js(\?.*)?$/, ''); } catch (e) {}
    return './';
  })();

  /* ---------- storage ---------- */
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  let fullWarned = false;
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { storageFull(); return false; } };
  /* a failed save used to be silent: say so once per page, so an admin can make room */
  function storageFull() { if (fullWarned) return; fullWarned = true; setTimeout(() => { try { toast('This device is out of room, so progress is not being saved. An admin can delete old scratch pad notes or save a backup.'); } catch (e) {} }, 0); }
  const remove = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const allKeys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const uid = () => Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  const objOr = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function root() { return Object.assign({ profiles: [], active: null, pin: null, pinRemovedAt: null }, read(ROOT, {})); }
  function saveRoot(r) { write(ROOT, r); }
  function child(id) {
    const d = Object.assign({ settings: {}, streak: 0, bestStreak: 0, daily: { d: '', n: 0, done: false }, tools: {}, last: null }, read(CHILD(id), {}));
    d.settings = Object.assign({ sound: true, readAloud: false, theme: 'light', font: 'standard', size: 'normal', voice: '' }, d.settings);
    d.streak = Number(d.streak) || 0; d.bestStreak = Number(d.bestStreak) || 0;
    if (!d.daily || typeof d.daily !== 'object') d.daily = { d: '', n: 0, done: false };
    d.daily.n = Number(d.daily.n) || 0;
    if (!d.tools || typeof d.tools !== 'object') d.tools = {};
    d.days = objOr(d.days); d.misses = objOr(d.misses);   // the admin area's history and missed questions
    d.bookmarks = Array.isArray(d.bookmarks) ? [...new Set(d.bookmarks.filter(x => typeof x === 'string' && x && x.length <= 80))].slice(0, 300) : [];   // saved modules
    if (d.daily.d !== today()) d.daily = { d: today(), n: 0, done: false };
    return d;
  }
  function saveChild(id, d) { write(CHILD(id), d); }
  /* Saved modules (bookmarks), kept per student in the student's record. */
  const bookmarks = (id = activeId()) => id ? child(id).bookmarks : [];
  const isBookmarked = (moduleId, id = activeId()) => bookmarks(id).includes(moduleId);
  function toggleBookmark(moduleId, id = activeId()) {      // returns true when the module is now saved
    if (!id || !moduleId) return false; const d = child(id), i = d.bookmarks.indexOf(moduleId);
    if (i >= 0) d.bookmarks.splice(i, 1); else d.bookmarks.push(moduleId);
    saveChild(id, d); return i < 0;
  }

  /* ---------- profiles ---------- */
  const profiles = () => root().profiles;
  const profile = id => profiles().find(p => p.id === id) || null;
  const activeProfile = () => { const r = root(); return r.profiles.find(p => p.id === r.active) || null; };
  const activeId = () => { const p = activeProfile(); return p ? p.id : null; };
  function setActive(id) { const r = root(); r.active = id; saveRoot(r); seenActive = id; }
  let seenActive = null;
  function addProfile(name, color) {
    const r = root(), p = { id: uid(), name: String(name).trim().slice(0, 24), color: color || COLORS[r.profiles.length % COLORS.length].c };
    r.profiles.push(p); saveRoot(r); saveChild(p.id, child(p.id)); return p;
  }
  /* Guest: created on the first visit so the app opens straight away. "Add a name" renames it and keeps its progress. */
  const GUEST_NAME = 'Guest';
  const isGuest = p => !!(p && p.guest);
  function ensureGuest() {
    if (profiles().length) return activeProfile();
    const p = addProfile(GUEST_NAME, '#2b4162'), r = root();
    r.profiles.find(x => x.id === p.id).guest = true; r.active = p.id; saveRoot(r);
    return activeProfile();
  }
  function updateProfile(id, patch) { const r = root(), p = r.profiles.find(x => x.id === id); if (!p) return; Object.assign(p, patch); if (p.name) p.name = String(p.name).trim().slice(0, 24); if (patch.name && patch.name.trim() !== GUEST_NAME) delete p.guest; saveRoot(r); }
  function clearModuleData(id) { allKeys().filter(k => k && k.startsWith(MODPREFIX(id))).forEach(remove); }
  function deleteProfile(id) {
    const r = root(); r.profiles = r.profiles.filter(p => p.id !== id); if (r.active === id) r.active = null; saveRoot(r);
    bumpEpoch(); remove(CHILD(id)); remove(NS + '.notes.' + id); try { sessionStorage.removeItem(NS + '.sessnotes.' + id); } catch (e) {} clearModuleData(id);
  }
  function resetChild(id) {           // erase progress, keep the student's settings
    const old = child(id), fresh = child('__none__'); fresh.settings = old.settings; fresh.bookmarks = old.bookmarks;   // saved modules are not progress
    saveChild(id, fresh); clearModuleData(id); bumpEpoch();
  }
  function resetAllProgress() { profiles().forEach(p => resetChild(p.id)); }   // every student's progress, but names and settings stay
  function eraseEverything() { allKeys().filter(k => k && k.startsWith(NS)).forEach(remove); try { Object.keys(sessionStorage).filter(k => k.startsWith(NS + '.sessnotes.')).forEach(k => sessionStorage.removeItem(k)); } catch (e) {} lock(); }   // all profiles, progress, settings, and the PIN
  function resetModule(id, moduleId, storageKeys) {
    const d = child(id);
    Object.keys(d.tools).forEach(k => { if (k.startsWith(moduleId + '/')) delete d.tools[k]; });
    if (d.last && d.last.module === moduleId) d.last = null;
    saveChild(id, d);
    (storageKeys || []).forEach(k => remove(MODPREFIX(id) + k)); bumpEpoch();
  }
  const colorInk = c => (COLORS.find(x => x.c === c) || { ink: '#fff' }).ink;
  const initial = name => (String(name).trim()[0] || '?').toUpperCase();
  const safeColor = c => /^#[0-9a-f]{6}$/i.test(String(c)) ? c : '#2b4162';
  const avatar = (p, cls = '') => `<span class="av ${cls}" style="--c:${safeColor(p.color)};--ci:${colorInk(p.color)}" aria-hidden="true">${esc(initial(p.name))}</span>`;

  /* ---------- settings ---------- */
  function getSetting(k, id = activeId()) { return id ? child(id).settings[k] : ({ sound: true, readAloud: false, theme: 'light', font: 'standard', size: 'normal', voice: '' })[k]; }
  function setSetting(k, v, id = activeId()) {
    if (!id) return; const d = child(id); d.settings[k] = v; saveChild(id, d);
    if (id === activeId()) { if (k === 'sound' && !v) stopTones(); if (k === 'readAloud' && !v) stopSpeech(); }   // turning a setting off also stops what is playing
  }

  /* ---------- progress ---------- */
  function credit() {
    const id = activeId(); if (!id) return { streak: 0, daily: 0, goal: DAILY_GOAL, goalJustReached: false };
    const d = child(id); d.streak++; d.bestStreak = Math.max(d.bestStreak, d.streak); d.daily.n++;
    logDay(d);
    let hit = false; if (d.daily.n >= DAILY_GOAL && !d.daily.done) { d.daily.done = true; hit = true; }
    saveChild(id, d); return { streak: d.streak, daily: d.daily.n, goal: DAILY_GOAL, goalJustReached: hit };
  }
  /* the streak pill: Today x/20 with a thin bar in the student's color that fills toward the daily goal */
  function pillHTML(s = streakInfo()) {
    const p = activeProfile(), pct = Math.min(100, s.daily / s.goal * 100);
    return `<b>Streak ${s.streak}</b><b>Today ${Math.min(s.daily, s.goal)}/${s.goal}</b><span class="goalbar" aria-hidden="true"><i style="width:${pct}%;background:${safeColor(p && p.color)}"></i></span>`;
  }
  /* a small history for the admin area: right answers per day, the last 60 days */
  const dayKey = t => { const x = new Date(t); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  function logDay(d) {
    const days = d.days && typeof d.days === 'object' ? d.days : {}, k = dayKey(Date.now()); days[k] = (Number(days[k]) || 0) + 1;
    const cut = dayKey(Date.now() - 60 * 864e5); Object.keys(days).forEach(x => { if (x < cut) delete days[x]; }); d.days = days;
  }
  /* questions missed, per module, so an admin can see what to practice (the 40 most missed per module are kept) */
  function noteMiss(moduleId, text) {
    const id = activeId(); if (!id || !moduleId || !text) return; const d = child(id);
    const all = d.misses && typeof d.misses === 'object' ? d.misses : {}, m = all[moduleId] && typeof all[moduleId] === 'object' ? all[moduleId] : {};
    const t = String(text).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 220); m[t] = (Number(m[t]) || 0) + 1;
    const keys = Object.keys(m); if (keys.length > 40) keys.sort((a, b) => m[a] - m[b]).slice(0, keys.length - 40).forEach(k => delete m[k]);
    all[moduleId] = m; d.misses = all; saveChild(id, d);
  }
  /* move everything one profile earned into another (used for Guest). Nothing is deleted unless every save worked. */
  const NOTES_MAX = 25, NOTES_BYTES = 1200000;   // the scratch pad's own limits for notes saved to a profile
  function mergedNotes(fromId, toId) {
    const na = read(NS + '.notes.' + fromId, []), nb = read(NS + '.notes.' + toId, []);
    const all = (Array.isArray(nb) ? nb : []).concat(Array.isArray(na) ? na : []).sort((x, y) => (y.at || 0) - (x.at || 0));
    let keep = all.slice(0, NOTES_MAX); while (keep.length > 1 && JSON.stringify(keep).length > NOTES_BYTES) keep = keep.slice(0, -1);
    return { keep, dropped: all.length - keep.length, any: Array.isArray(na) && na.length > 0 };
  }
  /* module state both profiles have: lists are joined, records are combined (the student's value wins a clash), anything else stays the student's */
  function mergeState(mine, theirs) {
    let x, y; try { x = JSON.parse(mine); y = JSON.parse(theirs); } catch (e) { return mine; }
    if (Array.isArray(x) && Array.isArray(y)) { const seen = new Set(x.map(v => JSON.stringify(v))); return JSON.stringify(x.concat(y.filter(v => !seen.has(JSON.stringify(v))))); }
    if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x) && !Array.isArray(y)) return JSON.stringify(Object.assign({}, y, x));
    return mine;
  }
  const mergePreview = (fromId, toId) => ({ notesDropped: mergedNotes(fromId, toId).dropped });
  function mergeProfile(fromId, toId) {
    if (fromId === toId) return; const a = child(fromId), b = child(toId);
    Object.entries(a.tools).forEach(([k, r]) => {
      if (!r || typeof r !== 'object') return;
      const t = b.tools[k];
      if (!t || typeof t !== 'object') { b.tools[k] = r; return; }
      t.attempts = (Number(t.attempts) || 0) + (Number(r.attempts) || 0); t.visits = (Number(t.visits) || 0) + (Number(r.visits) || 0); t.last = Math.max(Number(t.last) || 0, Number(r.last) || 0);
      const better = t.best == null || (r.best != null && (r.max && t.max ? r.best / r.max > t.best / t.max : r.best > t.best));
      if (better) { t.best = r.best; t.max = r.max; }
    });
    b.bestStreak = Math.max(b.bestStreak, a.bestStreak); b.bookmarks = [...new Set(b.bookmarks.concat(a.bookmarks))].slice(0, 300);
    if (a.daily.d === b.daily.d) { b.daily.n += a.daily.n; b.daily.done = b.daily.done || a.daily.done || b.daily.n >= DAILY_GOAL; }
    Object.entries(a.days).forEach(([k, n]) => { b.days[k] = (Number(b.days[k]) || 0) + (Number(n) || 0); });
    Object.entries(a.misses).forEach(([mod, m]) => { const t = b.misses[mod] = objOr(b.misses[mod]); Object.entries(objOr(m)).forEach(([q, n]) => { t[q] = (Number(t[q]) || 0) + (Number(n) || 0); }); });
    if (!b.last || (a.last && a.last.at > b.last.at)) b.last = a.last;
    /* every write goes through one list, so a full device puts everything back the way it was */
    const writes = { [CHILD(toId)]: JSON.stringify(b) };
    allKeys().filter(k => k && k.startsWith(MODPREFIX(fromId))).forEach(k => {
      const nk = MODPREFIX(toId) + k.slice(MODPREFIX(fromId).length), mine = localStorage.getItem(nk), theirs = localStorage.getItem(k);
      writes[nk] = mine == null ? theirs : mergeState(mine, theirs);
    });
    const notes = mergedNotes(fromId, toId); if (notes.any) writes[NS + '.notes.' + toId] = JSON.stringify(notes.keep);
    const old = {}; Object.keys(writes).forEach(k => { old[k] = localStorage.getItem(k); });
    try { Object.entries(writes).forEach(([k, v]) => localStorage.setItem(k, v)); }
    catch (e) {
      Object.entries(old).forEach(([k, v]) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e2) {} });
      throw new Error('There was not enough room on this device to move the progress. Nothing was changed.');
    }
    const r = root(); if (r.active === fromId) { r.active = toId; saveRoot(r); }
    deleteProfile(fromId);
  }
  /* bring one student back from a backup file, as a new student or in place of one here; nothing else on this device changes */
  function importChild(text, fromId, targetId) {
    const { data } = checkBackup(text), src = JSON.parse(data[ROOT]).profiles.find(p => p.id === fromId);
    if (!src) throw new Error('That student is not in the backup.');
    const r = root(), isNew = !targetId, to = targetId || uid();
    const mine = k => k === CHILD(to) || k === NS + '.notes.' + to || k.startsWith(MODPREFIX(to));
    const old = {}; allKeys().filter(k => k && mine(k)).forEach(k => { old[k] = localStorage.getItem(k); });   // put back if it does not fit
    try {
      Object.keys(old).forEach(remove);
      Object.entries(data).forEach(([k, v]) => {
        if (k === CHILD(fromId)) localStorage.setItem(CHILD(to), v);
        else if (k === NS + '.notes.' + fromId) localStorage.setItem(NS + '.notes.' + to, v);
        else if (k.startsWith(MODPREFIX(fromId))) localStorage.setItem(MODPREFIX(to) + k.slice(MODPREFIX(fromId).length), v);
      });
    } catch (e) {
      allKeys().filter(k => k && mine(k)).forEach(remove);
      Object.entries(old).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch (e2) {} });
      throw new Error('There was not enough room to load that student. Nothing was changed.');
    }
    if (isNew) {
      r.profiles.push({ id: to, name: String(src.name).trim().slice(0, 24) || 'Student', color: safeColor(src.color) });
      if (!write(ROOT, r)) { allKeys().filter(k => k && mine(k)).forEach(remove); throw new Error('There was not enough room to load that student. Nothing was changed.'); }
    }
    bumpEpoch(); return to;
  }
  function slip() { const id = activeId(); if (!id) return; const d = child(id); d.streak = 0; saveChild(id, d); }
  function streakInfo(id = activeId()) { if (!id) return { streak: 0, best: 0, daily: 0, goal: DAILY_GOAL }; const d = child(id); return { streak: d.streak, best: d.bestStreak, daily: d.daily.n, goal: DAILY_GOAL }; }
  function rec(d, moduleId, toolId) { const k = moduleId + '/' + toolId; return d.tools[k] || (d.tools[k] = { attempts: 0, visits: 0, best: null, max: null, lastScore: null, last: null }); }
  function opened(moduleId, toolId) {
    const id = activeId(); if (!id) return; const d = child(id), r = rec(d, moduleId, toolId);
    r.visits++; r.last = Date.now(); d.last = { module: moduleId, tool: toolId, at: r.last }; saveChild(id, d);
  }
  function result(moduleId, toolId, score, max) {
    const id = activeId(); if (!id) return; const d = child(id), r = rec(d, moduleId, toolId);
    r.attempts++; r.lastScore = score; r.last = Date.now();
    /* rounds can have different sizes (sets of 6, 9 or 18), so the best is the best share, not the biggest number */
    const better = r.best == null || (max && r.max ? (score / max > r.best / r.max || (score / max === r.best / r.max && score > r.best)) : score > r.best);
    if (better) { r.best = score; r.max = max == null ? null : max; }
    d.last = { module: moduleId, tool: toolId, at: r.last }; saveChild(id, d);
    setTimeout(maybeInvite, 1400);
  }
  const toolRecord = (moduleId, toolId, id = activeId()) => id ? (child(id).tools[moduleId + '/' + toolId] || null) : null;

  /* Mastery rules live in the registry: masterAt (a score to reach) or masterPct (share of max, default 80%). */
  function isMastered(tool, r) {
    if (!tool || tool.kind === 'study' || !r || r.best == null) return false;
    if (tool.masterAt != null) return r.best >= tool.masterAt;
    if (!r.max) return false;
    return r.best / r.max >= (tool.masterPct || 0.8);
  }
  function moduleProgress(mod, id = activeId()) {
    const scored = mod.tools.filter(t => t.kind !== 'study');
    const n = scored.filter(t => isMastered(t, toolRecord(mod.id, t.id, id))).length;
    return { mastered: n, total: scored.length };
  }
  function difficultyRange(mod) {
    const lv = mod.tools.map(t => DIFFS.indexOf(t.difficulty)).filter(i => i >= 0);
    if (!lv.length) return null;
    return { min: DIFFS[Math.min(...lv)], max: DIFFS[Math.max(...lv)] };
  }
  const diffBadge = d => { const i = DIFFS.indexOf(d); return `<span class="diff ${d}"><span class="pips" aria-hidden="true">${DIFFS.map((x, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</span>${DIFF_NAMES[d] || d}</span>`; };
  const diffRangeHTML = mod => { const r = difficultyRange(mod); if (!r) return ''; return r.min === r.max ? diffBadge(r.min) : `<span class="diffrange">${diffBadge(r.min)}<span class="to">to</span>${diffBadge(r.max)}</span>`; };

  /* A storage key that belongs to the active student and one module */
  function moduleKey(key) { return MODPREFIX(activeId() || 'none') + key; }

  function requireProfile() {
    let p = activeProfile();
    if (!p && !profiles().length) p = ensureGuest();
    if (!p && profiles().length === 1) { setActive(profiles()[0].id); p = activeProfile(); }
    if (!p) { try { location.replace(BASE + 'index.html'); } catch (e) {} return null; }
    return p;
  }

  /* ---------- sound ---------- */
  let actx = null, liveTones = [];
  function stopTones() { liveTones.forEach(o => { try { o.stop(); } catch (e) {} }); liveTones = []; }
  function tone(freqs, dur = 0.12) {
    if (!getSetting('sound')) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state !== 'running' && actx.resume) actx.resume().catch(() => {});     // iPhones suspend sound after the screen locks
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const t = actx.currentTime + i * dur;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
        liveTones.push(o); o.onended = () => { liveTones = liveTones.filter(x => x !== o); };
      });
    } catch (e) {}
  }
  const sfx = { good: () => tone([660, 880]), bad: () => tone([220, 180], 0.14), win: () => tone([523, 659, 784, 1046], 0.13) };

  /* ---------- speech ---------- */
  const CAN_SPEAK = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const SPK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  /* Voices: the browser lists what the device has. "Automatic" prefers natural-sounding voices over the plain robotic ones. */
  let voiceList = [];
  const voiceIds = new Map();
  function loadVoices() {
    try { voiceList = (speechSynthesis.getVoices && speechSynthesis.getVoices()) || []; } catch (e) { voiceList = []; }
    // Android Chrome can list many voices with the same name (and sometimes the same voiceURI), so every voice gets its own id
    voiceIds.clear(); const seen = {};
    voiceList.forEach(v => { const base = (v.voiceURI || '') + '|' + (v.name || '') + '|' + (v.lang || ''); const n = seen[base] = (seen[base] || 0) + 1; voiceIds.set(v, n > 1 ? base + '#' + n : base); });
    return voiceList;
  }
  const voiceId = v => { if (!voiceIds.has(v)) loadVoices(); return voiceIds.get(v) || (v && v.voiceURI) || ''; };
  /* a label a person can tell apart: same names get the voice code or a number added */
  function voiceLabels(list) {
    const names = {}; list.forEach(v => { names[v.name] = (names[v.name] || 0) + 1; });
    const count = {};
    const used = {};
    return list.map(v => {
      let t = v.name || 'Voice';
      if (names[v.name] > 1) {
        count[v.name] = (count[v.name] || 0) + 1;
        const code = String(v.voiceURI || '').replace(/^.*?(-x-)/i, '').replace(/^.*[\/:]/, '');
        t += ' - ' + (code && code !== v.name && /[a-z]/i.test(code) && code.length < 28 ? code : 'voice ' + count[v.name]);
      }
      if (v.localService === false) t += ' (online)';
      used[t] = (used[t] || 0) + 1; if (used[t] > 1) t += ' #' + used[t];   // two voices with exactly the same details
      return t;
    });
  }
  if (CAN_SPEAK) { loadVoices(); try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {} }
  const langBase = l => String(l || '').toLowerCase().replace('_', '-').split('-')[0];
  function voiceScore(v, lang) {
    const n = v.name || '';
    let sc = 0;
    if (String(v.lang || '').toLowerCase().replace('_', '-') === String(lang || '').toLowerCase()) sc += 4;
    if (/natural|neural|online|enhanced|premium/i.test(n)) sc += 50;
    if (/google/i.test(n)) sc += 30;
    if (/samantha|ava\b|allison|susan|karen|moira|serena|zira|jenny|aria|michelle|libby|sonia|emma|female/i.test(n)) sc += 20;
    if (/\bdavid\b|\bmark\b|\bfred\b|\bmale\b/i.test(n)) sc -= 20;
    if (/compact|espeak|robot/i.test(n)) sc -= 40;
    return sc;
  }
  /* voices that can speak this language, best first */
  function voicesFor(lang = 'en-US') { const b = langBase(lang); return loadVoices().filter(v => langBase(v.lang) === b).sort((a, c) => voiceScore(c, lang) - voiceScore(a, lang)); }
  function pickVoice(lang = 'en-US') {
    const list = voicesFor(lang), want = getSetting('voice');
    return (want && (list.find(v => voiceId(v) === want) || list.find(v => v.voiceURI === want))) || list[0] || null;   // a saved choice only applies to its own language
  }
  function applyVoice(u) { try { const v = pickVoice(u.lang); if (v) { u.voice = v; if (v.lang) u.lang = v.lang; } } catch (e) {} }   // browsers often ignore the voice unless the utterance language matches it
  let sayTok = 0, sayTimer = null;
  let clip = null;
  function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) {} try { if (clip) { clip.onended = clip.onerror = null; clip.pause(); clip = null; } } catch (e) {} sayTok++; clearTimeout(sayTimer); document.querySelectorAll('[data-sb-say].playing').forEach(b => b.classList.remove('playing')); }
  /* force: speak even when Read aloud is off (speaker buttons use this) */
  function say(text, opts = {}) {
    if (!CAN_SPEAK || !text || (!opts.force && !getSetting('readAloud'))) return;
    try {
      const busy = speechSynthesis.speaking || speechSynthesis.pending;
      stopSpeech(); const tok = sayTok;
      const u = new SpeechSynthesisUtterance(text); u.lang = opts.lang || 'en-US'; u.rate = opts.rate || 0.85; applyVoice(u);
      const btns = opts.button ? [opts.button] : [];
      const done = () => { if (tok === sayTok) { clearTimeout(sayTimer); btns.forEach(b => b.classList.remove('playing')); } };
      u.onend = done; u.onerror = e => { done(); if (opts.onerror) opts.onerror(e); }; btns.forEach(b => b.classList.add('playing'));
      if (opts.onstart) u.onstart = () => opts.onstart(u);
      sayTimer = setTimeout(done, 5000 + text.length * 60);
      // Chrome can drop a new utterance spoken in the same moment as cancel(), so wait a beat when something was playing
      if (busy) setTimeout(() => { if (tok === sayTok) { try { speechSynthesis.speak(u); } catch (e) {} } }, 80); else speechSynthesis.speak(u);
    } catch (e) {}
  }
  /* play a recorded sound file; if it will not play, say the fallback text with the device voice instead */
  function playClip(url, fallback, opts = {}) {
    stopSpeech(); const tok = sayTok; const btn = opts.button;
    const fb = () => { if (tok === sayTok) { if (btn) btn.classList.remove('playing'); say(fallback, { force: true, button: btn, lang: opts.lang }); } };
    try {
      const a = new Audio(url); clip = a;
      const done = () => { if (tok === sayTok) { clip = null; if (btn) btn.classList.remove('playing'); } };
      a.onended = done; a.onerror = fb;
      if (btn) btn.classList.add('playing');
      const r = a.play(); if (r && r.catch) r.catch(fb);
    } catch (e) { fb(); }
  }
  /* stop everything that is making sound: speech and tones */
  function stopAll() { stopSpeech(); stopTones(); try { window.__sbStopHook && window.__sbStopHook(); } catch (e) {} }
  const sayButton = (text, label = 'Hear it', lang = '', audio = '') => (CAN_SPEAK || audio) ? `<button type="button" class="spk" data-sb-say="${esc(text)}" data-lang="${esc(lang)}"${audio ? ` data-sb-audio="${esc(audio)}"` : ''} aria-label="${esc(label)}" title="${esc(label)}">${SPK_ICON}</button>` : '';
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-sb-say]');
    if (b && b.classList.contains('playing')) { e.stopPropagation(); stopAll(); return; }   // pressing the speaker while it plays stops it
    if (b && b.dataset.sbAudio) { e.stopPropagation(); playClip(b.dataset.sbAudio, b.dataset.sbSay, { button: b, lang: b.dataset.lang || undefined }); return; }
    if (b) { e.stopPropagation(); say(b.dataset.sbSay, { force: true, lang: b.dataset.lang || undefined, button: b }); }
  }, true);

  document.addEventListener('keydown', e => { if (e.key === 'Escape') stopAll(); }, true);   // also stops automatic Read aloud, which has no button
  window.addEventListener('pagehide', () => stopAll());

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('sb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'sb-toast'; t.className = 'sb-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), Math.max(2400, 1400 + String(msg).length * 45));   // longer messages stay long enough to read
  }

  /* ---------- dialogs (styles are injected so modules with their own CSS get them too) ---------- */
  const DLG_CSS = `
  .sb-ov{position:fixed;inset:0;background:rgba(35,49,63,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;font-family:"Trebuchet MS","Segoe UI",system-ui,-apple-system,Arial,sans-serif}
  .sb-dlg{background:#fffdf7;color:#23313f;border:2px solid #e4dcc8;border-radius:24px;padding:26px 26px 22px;width:min(440px,100%);box-shadow:0 18px 40px rgba(0,0,0,.25);font-size:17px;line-height:1.45}
  .sb-dlg h3{margin:0 0 6px;font-size:23px}
  .sb-dlg p{margin:0 0 14px;color:#5b6773}
  .sb-dlg input{width:100%;font:inherit;font-size:24px;font-weight:700;letter-spacing:6px;text-align:center;padding:12px 14px;border:2px solid #2b4162;border-radius:12px;background:#fff;color:#23313f;margin-bottom:8px}
  .sb-dlg input.txt{letter-spacing:1px;font-size:20px}
  .sb-dlg input:focus{outline:3px solid #0e7468;outline-offset:1px}
  .sb-dlg button:focus-visible,.sb-seg button:focus-visible,.sb-sw button:focus-visible,.sb-invite button:focus-visible{outline:3px solid #2b4162;outline-offset:2px}
  .sb-invite button:focus-visible{outline-color:#fff}
  html.sb-dark .sb-dlg button:focus-visible,html.sb-dark .sb-seg button:focus-visible,html.sb-dark .sb-sw button:focus-visible{outline-color:#a9c4f0}
  .sb-dlg .sb-err{color:#b32d2d;font-weight:700;min-height:24px;font-size:16px;margin-bottom:6px}
  .sb-dlg .sb-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;align-items:center}
  .sb-dlg .sb-btn{font:inherit;font-weight:700;font-size:17px;border-radius:13px;padding:11px 22px;cursor:pointer;border:0;background:#2b4162;color:#fff;box-shadow:0 3px 0 #1b2b45}
  .sb-dlg .sb-btn.ghost{background:#fff;color:#2b4162;border:2px solid #e4dcc8;box-shadow:none}
  .sb-dlg .sb-btn.warn{background:#fff;color:#b23a15;border:2px solid #b23a15;box-shadow:none}
  .sb-dlg .sb-link{background:none;border:0;padding:0;color:#5b6773;text-decoration:underline;font:inherit;font-size:14px;cursor:pointer;margin-right:auto}
  .sb-swipe-tag{position:absolute;top:18px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;opacity:0;font-family:"Trebuchet MS","Segoe UI",system-ui,Arial,sans-serif;font-weight:800;font-size:20px;letter-spacing:.5px;padding:6px 16px;border-radius:999px;border:3px solid;background:rgba(255,255,255,.92)}
  .sb-swipe-tag.r{color:#1e7340;border-color:#1e7340}
  .sb-swipe-tag.l{color:#b23a15;border-color:#b23a15}
  .cardstage{position:relative}
  .swipe-tip{display:none}
  @media (pointer:coarse){.swipe-tip{display:inline}}
  .sb-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:7px 0;border-top:1.5px solid #e4dcc8}
  .sb-opt>span{font-weight:700}
  .sb-seg{display:inline-flex;border:2px solid #e4dcc8;border-radius:12px;overflow:hidden;background:#fff}
  .sb-seg button{font:inherit;font-size:15px;font-weight:700;border:0;background:transparent;color:inherit;padding:7px 12px;cursor:pointer}
  .sb-seg button[aria-pressed="true"]{background:#0e7468;color:#fff}
  @font-face{font-family:'OpenDyslexic';src:url('${BASE}shared/fonts/opendyslexic-regular.woff2') format('woff2');font-weight:400;font-display:swap}
  @font-face{font-family:'OpenDyslexic';src:url('${BASE}shared/fonts/opendyslexic-bold.woff2') format('woff2');font-weight:700 900;font-display:swap}
  html.sb-dyslexic{--font:'OpenDyslexic',"Trebuchet MS",system-ui,sans-serif}
  html.sb-dyslexic .sb-dlg,html.sb-dyslexic .sb-invite,html.sb-dyslexic .sb-toast{font-family:'OpenDyslexic',sans-serif}
  html.sb-large body{zoom:1.15}
  :root{--vh:100vh}
  html.sb-large{--vh:calc(100vh / 1.15)}
  html.sb-dark .sb-dlg{background:#1a2430;color:#e9eef3;border-color:#34465c}
  html.sb-dark .sb-dlg p{color:#a9b5c2}
  html.sb-dark .sb-dlg input,html.sb-dark .sb-seg{background:#212d3b;color:#e9eef3;border-color:#a9c4f0}
  html.sb-dark .sb-seg{border-color:#34465c}
  html.sb-dark .sb-opt{border-color:#34465c}
  html.sb-dark .sb-dlg .sb-btn.ghost{background:#212d3b;color:#e9eef3;border-color:#34465c}
  html.sb-dark .sb-dlg .sb-btn{background:#3f5f92}
  html.sb-dark .sb-dlg .sb-btn.warn{background:#212d3b;color:#f48d6b;border-color:#f48d6b}
  html.sb-dark .sb-dlg .sb-err{color:#f58a8a}
  html.sb-dark .sb-dlg .sb-link{color:#a9b5c2}
  html.sb-dark .sb-seg button[aria-pressed="true"]{background:#127268;color:#fff}
  html.sb-dark .sb-swipe-tag{background:rgba(26,36,48,.92)}
  html.sb-dark .sb-swipe-tag.r{color:#5ccb8a;border-color:#5ccb8a}
  html.sb-dark .sb-swipe-tag.l{color:#f48d6b;border-color:#f48d6b}
  .sb-sw{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 8px}
  .sb-sw button{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #e4dcc8;padding:0;cursor:pointer}
  .sb-sw button[aria-pressed="true"]{box-shadow:0 0 0 3px #2b4162}
  html.sb-dark .sb-sw button{border-color:#1a2430}
  html.sb-dark .sb-sw button[aria-pressed="true"]{box-shadow:0 0 0 3px #a9c4f0}
  .sb-invite{position:sticky;top:8px;margin:8px auto 0;z-index:105;background:#2b4162;color:#fff;border-radius:18px;padding:12px 12px 12px 18px;display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.25);width:max-content;max-width:calc(100% - 24px);font-family:"Trebuchet MS","Segoe UI",system-ui,-apple-system,Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.3}
  .sb-invite .sb-inv-btns{display:flex;gap:8px}
  .sb-invite button{font:inherit;font-size:15px;border-radius:11px;padding:8px 14px;cursor:pointer;border:0}
  .sb-invite .yes{background:#f6b73c;color:#23313f;box-shadow:0 3px 0 #b07a00}
  .sb-invite .no{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.45)}
  .sb-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,40px);background:#2b4162;color:#fff;box-sizing:border-box;width:max-content;max-width:min(calc(100vw - 32px),440px);padding:12px 22px;border-radius:18px;font-weight:700;font-size:16px;line-height:1.4;text-align:center;text-wrap:balance;overflow-wrap:anywhere;box-shadow:0 6px 18px rgba(0,0,0,.28);opacity:0;transition:.3s;z-index:110;pointer-events:none;font-family:"Trebuchet MS","Segoe UI",system-ui,Arial,sans-serif}
  html.sb-large .sb-toast{max-width:min(calc((100vw - 32px) / 1.15),440px)}
  .sb-toast.show{opacity:1;transform:translate(-50%,0)}
  @media (prefers-reduced-motion:reduce){.sb-toast{transition:none}}`;
  function injectCSS() { if (document.getElementById('sb-dlg-css')) return; const s = document.createElement('style'); s.id = 'sb-dlg-css'; s.textContent = DLG_CSS; (document.head || document.documentElement).appendChild(s); }
  injectCSS();

  /* feedback lines (.msg) announce themselves to screen readers */
  function liveMsgs(root) { (root || document).querySelectorAll('p.msg:not([aria-live])').forEach(m => m.setAttribute('aria-live', 'polite')); }
  function startLive() { liveMsgs(); try { new MutationObserver(() => liveMsgs()).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
  if (document.body) startLive(); else document.addEventListener('DOMContentLoaded', startLive);

  let dlgN = 0;
  function dialog(html, wire) {
    injectCSS();
    const prevFocus = document.activeElement;
    const ov = document.createElement('div'); ov.className = 'sb-ov';
    ov.innerHTML = `<div class="sb-dlg" role="dialog" aria-modal="true">${html}</div>`;
    { const h = ov.querySelector("h3"); if (h) { h.id = 'sb-dlg-title-' + (++dlgN); ov.firstElementChild.setAttribute("aria-labelledby", h.id); } }
    const behind = [...document.body.children].filter(c => !c.inert && c.id !== 'sb-toast'); behind.forEach(c => { c.inert = true; });   // the page behind cannot be reached while the box is open
    document.body.appendChild(ov);
    const close = () => { behind.forEach(c => { c.inert = false; }); ov.remove(); document.removeEventListener('keydown', onKey, true); try { prevFocus && prevFocus.focus(); } catch (e) {} };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); (ov._cancel || close)(); return; }
      if (e.key === 'Tab') {
        const els = [...ov.querySelectorAll('button,input,select,textarea,summary,[href],[tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (!ov.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('pointerdown', e => { if (e.target === ov) (ov._cancel || close)(); });
    wire(ov.firstElementChild, close, ov);
    const f = ov.querySelector('[data-autofocus]') || ov.querySelector('input,button.sb-btn:not(.ghost)'); if (f) setTimeout(() => f.focus(), 30);
    return close;
  }

  function confirmDlg({ title, text, ok = 'Yes', cancel = 'Cancel', danger = false }, onOk, onCancel) {
    dialog(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="sb-row"><button class="sb-btn ghost" data-x="no"${danger ? ' data-autofocus' : ''}>${esc(cancel)}</button><button class="sb-btn ${danger ? 'warn' : ''}" data-x="yes">${esc(ok)}</button></div>`, (box, close, ov) => {
      ov._cancel = () => { close(); onCancel && onCancel(); };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = () => { close(); onOk && onOk(); };
    });
  }

  /* ---------- admin PIN ----------
     This keeps kids from erasing progress by accident. It is not real security:
     anyone who clears the browser's site data can get around it. */
  function hashPin(p) { let h = 2166136261; const s = 'study-buddy:' + p; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  const hasPin = () => !!root().pin;
  function dismissPinNote() { const r = root(); r.pinRemovedAt = null; saveRoot(r); }
  function setPin(p) { const r = root(); r.pin = hashPin(p); saveRoot(r); unlock(); }
  const checkPin = p => root().pin === hashPin(p);
  const validPin = p => /^\d{4,8}$/.test(p);
  function unlock() { try { sessionStorage.setItem(NS + '.unlockedUntil', String(Date.now() + UNLOCK_MS)); } catch (e) {} }
  function lock() { try { sessionStorage.removeItem(NS + '.unlockedUntil'); } catch (e) {} }
  function isUnlocked() { try { return +sessionStorage.getItem(NS + '.unlockedUntil') > Date.now(); } catch (e) { return false; } }

  function newPinDialog(title, text, onOk, onCancel) {
    dialog(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
      <input type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" aria-label="New PIN" placeholder="New PIN" data-x="a">
      <input type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" aria-label="Type the PIN again" placeholder="Again" data-x="b">
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn" data-x="yes">Save PIN</button></div>`, (box, close, ov) => {
      const a = box.querySelector('[data-x="a"]'), b = box.querySelector('[data-x="b"]'), err = box.querySelector('.sb-err');
      ov._cancel = () => { close(); onCancel && onCancel(); };
      const go = () => {
        if (!validPin(a.value)) { err.textContent = 'Use 4 to 8 digits.'; a.focus(); return; }
        if (a.value !== b.value) { err.textContent = 'The two PINs do not match.'; b.value = ''; b.focus(); return; }
        setPin(a.value); close(); toast('Admin PIN saved'); onOk && onOk();
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      [a, b].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); x === a ? b.focus() : go(); } }));
    });
  }

  function forgotDialog(onOk, onCancel) {
    dialog(`<h3>Forgot the PIN?</h3><p>Type REMOVE, then choose a new PIN. All progress stays. The admin area will show the date the PIN was reset.</p>
      <input class="txt" type="text" autocomplete="off" aria-label="Type REMOVE" data-x="a">
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn warn" data-x="yes">Continue</button></div>`, (box, close, ov) => {
      const a = box.querySelector('[data-x="a"]'), err = box.querySelector('.sb-err');
      ov._cancel = () => { close(); onCancel && onCancel(); };
      const go = () => {
        if (a.value.trim().toUpperCase() !== 'REMOVE') { err.textContent = 'Type the word REMOVE.'; a.focus(); return; }
        close();
        // The old PIN keeps working until a new one is saved, so cancelling here changes nothing.
        newPinDialog('Set a new admin PIN', 'Choose 4 to 8 digits.', () => { const r = root(); r.pinRemovedAt = new Date().toISOString(); saveRoot(r); onOk && onOk(); }, onCancel);
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      a.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }

  /* Ask for the admin PIN, then run onOk. Stays unlocked for 5 minutes in this tab. */
  function requirePin(message, onOk, onCancel, opts = {}) {
    // opts.confirm = { title, text, ok }: for destructive actions. Asks "are you sure" even without a PIN or when unlocked.
    const proceed = () => opts.confirm ? confirmDlg(Object.assign({ danger: true }, opts.confirm), onOk, onCancel) : (onOk && onOk());
    if (!hasPin()) {
      const r = root();
      if (!r.pinOffered) { r.pinOffered = true; saveRoot(r); return offerPin('Protect this with an admin PIN?', 'A PIN keeps kids from erasing progress or changing profiles. You can add one later in the Admin area.', proceed, onCancel || (() => {})); }
      return proceed();
    }
    if (isUnlocked()) return proceed();
    dialog(`<h3>Admin PIN</h3><p>${esc(message || 'Enter the admin PIN to continue.')}</p>
      <input type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Admin PIN" data-x="a">
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-link" data-x="forgot" type="button">Forgot PIN?</button><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn" data-x="yes">Unlock</button></div>`, (box, close, ov) => {
      const a = box.querySelector('[data-x="a"]'), err = box.querySelector('.sb-err');
      ov._cancel = () => { close(); onCancel && onCancel(); };
      const go = () => {
        if (!checkPin(a.value)) { err.textContent = 'That PIN is not right.'; a.value = ''; a.focus(); sfx.bad(); return; }
        unlock(); close(); proceed();
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      box.querySelector('[data-x="forgot"]').onclick = () => { close(); forgotDialog(proceed, onCancel); };
      a.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }

  /* Offer a PIN with a Skip button. onDone runs after either choice. */
  function offerPin(title, text, onDone, onCancel) {
    dialog(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="sb-row"><button class="sb-btn ghost" data-x="skip">Skip</button><button class="sb-btn" data-x="set">Set PIN</button></div>`, (box, close, ov) => {
      const skip = () => { close(); const r = root(); r.pinSkipped = true; saveRoot(r); onDone && onDone(); };
      ov._cancel = onCancel ? () => { close(); onCancel(); } : skip;
      box.querySelector('[data-x="skip"]').onclick = skip;
      box.querySelector('[data-x="set"]').onclick = () => { close(); newPinDialog('Set an admin PIN', 'Choose 4 to 8 digits. Only an admin should know it.', onDone, onCancel || onDone); };
    });
  }
  /* Call after adding a profile: once there are two people and no PIN, offer one a second time. */
  function afterProfileAdded(onDone) {
    const r = root();
    if (r.profiles.length >= 2 && !r.pin && !r.pinOfferedAtTwo) {
      r.pinOfferedAtTwo = true; r.pinOffered = true; saveRoot(r);
      return offerPin('Add an admin PIN?', "Now that more than one student uses Study Buddy, a PIN keeps them from erasing each other's progress.", onDone);
    }
    onDone && onDone();
  }
  /* "Add your name": renames the Guest (keeping its progress), or adds a new person. */
  function nameDialog(onDone, opts = {}) {
    const renaming = !opts.add && isGuest(activeProfile());
    let color = COLORS[(profiles().length + (renaming ? 0 : 1)) % COLORS.length].c;
    dialog(`<h3>${renaming ? 'Add your name' : 'Add a person'}</h3><p>${renaming ? 'Your progress so far stays with you.' : 'Each person gets their own progress.'}</p>
      <input class="txt" type="text" maxlength="24" autocomplete="off" aria-label="Name" placeholder="First name" data-x="a">
      <div class="sb-sw" role="group" aria-label="Color">${COLORS.map(c => `<button type="button" style="background:${c.c}" data-c="${c.c}" aria-pressed="${c.c === color}" aria-label="Color ${c.c}"></button>`).join('')}</div>
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-btn ghost" data-x="no">Not now</button><button class="sb-btn" data-x="yes">Save</button></div>`, (box, close) => {
      const a = box.querySelector('[data-x="a"]'), err = box.querySelector('.sb-err');
      box.querySelectorAll('.sb-sw button').forEach(b => b.onclick = () => { color = b.dataset.c; box.querySelectorAll('.sb-sw button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      const go = () => {
        const n = a.value.trim();
        if (!n) { err.textContent = 'Type a name first.'; a.focus(); return; }
        if (n.toLowerCase() === GUEST_NAME.toLowerCase()) { err.textContent = 'Pick a name other than Guest.'; a.focus(); return; }
        close();
        if (renaming) { updateProfile(activeId(), { name: n, color }); toast('Saved. Hi, ' + n + '!'); onDone && onDone(); }
        else { const p = addProfile(n, color); if (opts.activate) setActive(p.id); toast(n + ' was added'); afterProfileAdded(onDone); }
      };
      box.querySelector('[data-x="no"]').onclick = close;
      box.querySelector('[data-x="yes"]').onclick = go;
      a.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }
  /* After the first finished round, invite a Guest to add a name. At most once per visit; "Not now" waits a week. */
  function maybeInvite() {
    if (!isGuest(activeProfile()) || document.querySelector('.sb-invite,.sb-ov')) return;
    const r = root(); if ((r.inviteSnoozeUntil || 0) > Date.now()) return;
    try { if (sessionStorage.getItem(NS + '.invited')) return; sessionStorage.setItem(NS + '.invited', '1'); } catch (e) {}
    injectCSS();
    const bar = document.createElement('div'); bar.className = 'sb-invite'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>Add your name so this progress shows under you.</span><span class="sb-inv-btns"><button class="no" type="button">Not now</button><button class="yes" type="button">Add a name</button></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    const close = () => bar.remove();
    bar.querySelector('.no').onclick = () => { const x = root(); x.inviteSnoozeUntil = Date.now() + 7 * 864e5; saveRoot(x); close(); };
    bar.querySelector('.yes').onclick = () => { close(); nameDialog(() => location.reload()); };
  }

  /* ---------- swipe for flashcards ----------
     Drag the card right for "I knew it", left for "Still learning". A tap still flips it, and the arrow keys work too.
     stage: the element that moves; card: the element that gets clicked to flip. */
  /* a brief confirmation over the flashcard; onUndo adds a small Undo link. Announced to screen readers. */
  function cardToast(zone, text, onUndo) {
    let t = zone.querySelector('.card-toast');
    if (!t) { t = document.createElement('div'); t.className = 'card-toast'; t.setAttribute('role', 'status'); zone.appendChild(t); }
    t.innerHTML = '<span>' + esc(text) + '</span>' + (onUndo ? '<button type="button">Undo</button>' : '');
    if (onUndo) t.querySelector('button').onclick = () => { t.classList.remove('show'); onUndo(); };
    t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1100);
  }
  function swipeCard(stage, card, { onRight, onLeft }) {
    let st = null, dragged = false;
    const tag = document.createElement('div'); tag.className = 'sb-swipe-tag'; tag.setAttribute('aria-hidden', 'true'); stage.appendChild(tag);
    stage.style.touchAction = 'pan-y';
    const set = dx => {
      stage.style.transform = dx ? `translateX(${dx}px) rotate(${dx / 22}deg)` : '';
      const k = Math.min(1, Math.abs(dx) / 110);
      tag.textContent = dx > 0 ? 'I knew it' : 'Still learning'; tag.className = 'sb-swipe-tag ' + (dx > 0 ? 'r' : 'l'); tag.style.opacity = dx ? k : 0;
    };
    const fly = (dir, fn) => {
      stage.style.transition = 'transform .22s ease-in, opacity .22s'; stage.style.transform = `translateX(${dir * 140}%) rotate(${dir * 14}deg)`; stage.style.opacity = '0';
      setTimeout(() => {
        stage.style.transition = 'none'; set(0); const wasFlipped = card.classList.contains('flip');
        fn();
        setTimeout(() => { stage.style.transition = 'opacity .2s'; stage.style.opacity = '1'; setTimeout(() => stage.style.transition = '', 220); }, wasFlipped ? 560 : 40);
      }, 230);
    };
    stage.addEventListener('pointerdown', e => { if (e.button > 0 || e.target.closest('[data-say],[data-sb-say],button')) return; st = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false }; dragged = false; });
    stage.addEventListener('pointermove', e => {
      if (!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.on) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { st.on = true; dragged = true; stage.style.transition = 'none'; try { stage.setPointerCapture(st.id); } catch (er) {} } else if (Math.abs(dy) > 14) { st = null; return; } else return; }
      set(dx);
    });
    const end = e => {
      if (!st) return; const on = st.on, dx = (e.clientX || st.x) - st.x; st = null;
      if (!on) return;
      const far = Math.abs(dx) > Math.max(90, stage.offsetWidth * 0.28);
      if (far && e.type === 'pointerup') fly(dx > 0 ? 1 : -1, dx > 0 ? onRight : onLeft);
      else { stage.style.transition = 'transform .2s'; set(0); setTimeout(() => stage.style.transition = '', 220); }
    };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    card.addEventListener('click', e => { if (dragged) { e.stopImmediatePropagation(); e.preventDefault(); dragged = false; } }, true);   // a swipe is not a tap
    card.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); fly(1, onRight); } else if (e.key === 'ArrowLeft') { e.preventDefault(); fly(-1, onLeft); } });
  }

  /* ---------- display options: theme, OpenDyslexic, text size (per student, applied as classes on <html>) ---------- */
  const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function applyDisplay() {
    const h = document.documentElement, t = getSetting('theme');
    const dark = t === 'dark' || (t === 'auto' && !!(darkMQ && darkMQ.matches));
    h.classList.toggle('sb-dark', dark);
    h.classList.toggle('sb-dyslexic', getSetting('font') === 'dyslexic');
    h.classList.toggle('sb-large', getSetting('size') === 'large');
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#121a23' : '#2b4162');
  }
  try { darkMQ && darkMQ.addEventListener && darkMQ.addEventListener('change', applyDisplay); } catch (e) {}
  const DISPLAY_OPTS = [
    ['theme', 'Theme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match device']]],
    ['font', 'Font', [['standard', 'Standard'], ['dyslexic', 'OpenDyslexic']]],
    ['size', 'Text size', [['normal', 'Normal'], ['large', 'Larger']]],
    ['sound', 'Sound', [[true, 'On'], [false, 'Off']]],
    ['readAloud', 'Read aloud', [[false, 'Off'], [true, 'On']]]
  ];
  function displayDialog(onChange) {
    const p = activeProfile();
    dialog(`<h3>Display</h3><p>Saved for ${esc(p ? p.name : 'you')} on this device.</p>
      ${DISPLAY_OPTS.filter(o => o[0] !== 'readAloud' || CAN_SPEAK).map(([k, label, vals]) => `<div class="sb-opt"><span>${label}</span><div class="sb-seg" role="group" aria-label="${label}">${vals.map(([v, t]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(getSetting(k)) === String(v)}">${t}</button>`).join('')}</div></div>`).join('')}
      <div class="sb-row" style="margin-top:12px"><button class="sb-btn" data-x="done">Done</button></div>`, (box, close) => {
      box.querySelectorAll('.sb-seg button').forEach(b => b.onclick = () => {
        const k = b.dataset.k, v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v;
        setSetting(k, v); applyDisplay();
        box.querySelectorAll(`.sb-seg button[data-k="${k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
        if (k === 'sound' && v) sfx.good();
        onChange && onChange(k, v);
      });
      box.querySelector('[data-x="done"]').onclick = close;
    });
  }

  /* ---------- backup ---------- */
  /* the admin area reminds an admin to save a backup when the last one is old */
  function markBackup() { const r = root(); r.lastBackupAt = Date.now(); saveRoot(r); }
  function exportAll() {
    const ids = new Set(root().profiles.map(p => p.id)), owner = k => { const m = k.match(/^studybuddy\.v1\.(?:child|notes|m)\.([a-z0-9]+)/i); return m ? m[1] : null; };
    const data = {}; allKeys().filter(k => k && k.startsWith(NS) && k !== EPOCH && (!owner(k) || ids.has(owner(k)))).forEach(k => { data[k] = localStorage.getItem(k); });   // leftovers of deleted students stay out
    return JSON.stringify({ app: 'study-buddy', version: 1, exported: new Date().toISOString(), data }, null, 1);
  }
  /* Check a backup file completely before touching anything. Returns { data, names } or throws an Error with a plain message. */
  const BAD = 'That file is not a Study Buddy backup.';
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const num = v => typeof v === 'number' && isFinite(v);
  function checkBackup(text) {
    if (typeof text !== 'string' || text.length > 12e6) throw new Error('That file is too big to be a Study Buddy backup.');
    let o; try { o = JSON.parse(text); } catch (e) { throw new Error(BAD); }
    if (!isObj(o) || o.app !== 'study-buddy' || !isObj(o.data)) throw new Error(BAD);
    const entries = Object.entries(o.data);
    if (!entries.length || entries.length > 600) throw new Error('This backup is empty or damaged, so nothing was changed.');
    const parsed = {};
    for (const [k, v] of entries) {
      if (typeof k !== 'string' || !k.startsWith(NS + '.') || typeof v !== 'string') throw new Error('This backup is damaged, so nothing was changed.');
      let j; try { j = JSON.parse(v); } catch (e) { throw new Error('This backup is damaged, so nothing was changed.'); }
      parsed[k] = j;
    }
    const r = parsed[ROOT];
    if (!isObj(r) || !Array.isArray(r.profiles) || !r.profiles.length || r.profiles.length > 30) throw new Error('This backup has no profiles in it, so nothing was changed.');
    const ids = new Set();
    for (const p of r.profiles) {
      if (!isObj(p) || typeof p.id !== 'string' || !/^[a-z0-9]{1,24}$/i.test(p.id) || typeof p.name !== 'string' || !/^#[0-9a-f]{6}$/i.test(p.color)) throw new Error('This backup is damaged, so nothing was changed.');
      ids.add(p.id);
    }
    if (r.active != null && !ids.has(r.active)) throw new Error('This backup is damaged, so nothing was changed.');
    if (r.pin != null && typeof r.pin !== 'string') throw new Error('This backup is damaged, so nothing was changed.');
    const skip = new Set();
    for (const [k, j] of Object.entries(parsed)) {
      if (k === ROOT) continue;
      if (k === EPOCH) { skip.add(k); continue; }
      const c = k.match(/^studybuddy\.v1\.child\.([a-z0-9]+)$/i);
      if (c) {
        if (!ids.has(c[1])) { skip.add(k); continue; }
        if (!isObj(j)) throw new Error('This backup is damaged, so nothing was changed.');
        if ((j.streak != null && !num(j.streak)) || (j.bestStreak != null && !num(j.bestStreak))) throw new Error('This backup is damaged, so nothing was changed.');
        if (j.daily != null && (!isObj(j.daily) || !num(j.daily.n) || typeof j.daily.d !== 'string')) throw new Error('This backup is damaged, so nothing was changed.');
        if (j.settings != null && !isObj(j.settings)) throw new Error('This backup is damaged, so nothing was changed.');
        if ((j.days != null && !isObj(j.days)) || (j.misses != null && !isObj(j.misses))) throw new Error('This backup is damaged, so nothing was changed.');
        if (j.tools != null) {
          if (!isObj(j.tools)) throw new Error('This backup is damaged, so nothing was changed.');
          for (const t of Object.values(j.tools)) if (!isObj(t) || ['attempts', 'visits', 'best', 'max', 'lastScore', 'last'].some(f => t[f] != null && !num(t[f]))) throw new Error('This backup is damaged, so nothing was changed.');
        }
        continue;
      }
      const nt = k.match(/^studybuddy\.v1\.notes\.([a-z0-9]+)$/i);   // scratch pad notes saved to a profile
      if (nt) {
        if (!ids.has(nt[1])) { skip.add(k); continue; }
        if (!Array.isArray(j) || j.length > 60) throw new Error('This backup is damaged, so nothing was changed.');
        for (const n of j) {
          const okItem = it => isObj(it) && ((it.k === 't' && typeof it.t === 'string' && num(it.x) && num(it.y) && num(it.s)) || (it.k === 's' && typeof it.t === 'string' && Array.isArray(it.p) && it.p.length % 3 === 0 && it.p.every(num) && num(it.w)));
          if (!isObj(n) || typeof n.id !== 'string' || !Array.isArray(n.items) || n.items.length > 6000 || !n.items.every(okItem) || (n.w != null && !num(n.w)) || (n.h != null && !num(n.h)) || (n.at != null && !num(n.at))) throw new Error('This backup is damaged, so nothing was changed.');
        }
        continue;
      }
      const m = k.match(/^studybuddy\.v1\.m\.([a-z0-9]+)\./i);
      if (m) { if (!ids.has(m[1])) skip.add(k); continue; }
      throw new Error('This backup is damaged, so nothing was changed.');
    }
    const data = {}; Object.keys(o.data).forEach(k => { if (!skip.has(k)) data[k] = o.data[k]; });   // keys left over from a deleted student are dropped, not fatal
    return { data, names: r.profiles.map(p => p.name.slice(0, 24)) };
  }
  /* Replace everything with the backup. The old data is kept until the new data is fully written, and put back if it can't be. */
  function importAll(text) {
    const { data } = checkBackup(text);
    const keys = allKeys().filter(k => k && k.startsWith(NS));
    const old = {}; keys.forEach(k => { old[k] = localStorage.getItem(k); });
    try {
      keys.forEach(remove);
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
    } catch (e) {
      allKeys().filter(k => k && k.startsWith(NS)).forEach(remove);
      Object.entries(old).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch (e2) {} });
      throw new Error('There was not enough room to load that backup. Nothing was changed.');
    }
    bumpEpoch();
    lock();
  }
  function download(name, text, type = 'application/json') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
  }

  /* ---------- offline support (only works on a real web address, not a double-clicked file) ---------- */
  try {
    const webAddress = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if ('serviceWorker' in navigator && webAddress) window.addEventListener('load', () => navigator.serviceWorker.register(BASE + 'sw.js').catch(() => {}));
  } catch (e) {}

  try { applyDisplay(); } catch (e) {}
  try {
    seenActive = activeId();
    window.addEventListener('storage', e => {
      const a = seenActive;
      if (e.key === null) return location.reload();                                              // all site data cleared in another tab
      if (e.key === ROOT) { if (activeId() !== a) location.reload(); return; }
      if (e.key === EPOCH || (a && e.newValue === null && (e.key === CHILD(a) || e.key.startsWith(MODPREFIX(a))))) location.reload();   // a reset or a backup load in another tab: don't write old progress back
    });
  } catch (e) {}

  window.SB = {
    ready: true, BASE, DAILY_GOAL, DIFFS, DIFF_NAMES, COLORS, CAN_SPEAK, SPK_ICON,
    esc, today,
    root, profiles, profile, activeProfile, activeId, setActive, addProfile, isGuest, ensureGuest, nameDialog, afterProfileAdded, offerPin, updateProfile, deleteProfile, resetChild, resetAllProgress, eraseEverything, resetModule,
    avatar, colorInk, initial, child, bookmarks, isBookmarked, toggleBookmark,
    getSetting, setSetting,
    credit, slip, streakInfo, pillHTML, noteMiss, mergeProfile, mergePreview, importChild, dayKey, opened, result, toolRecord, isMastered, moduleProgress, difficultyRange, diffBadge, diffRangeHTML,
    moduleKey, requireProfile,
    tone, sfx, say, stopSpeech, stopAll, voicesFor, voiceId, voiceLabels, pickVoice, applyVoice, sayButton, toast, applyDisplay, displayDialog, swipeCard, cardToast,
    dialog, confirm: confirmDlg, requirePin, newPinDialog, hasPin, dismissPinNote, isUnlocked, lock,
    exportAll, markBackup, checkBackup, importAll, download
  };
})();
