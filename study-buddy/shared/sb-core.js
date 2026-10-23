/* Study Buddy core.
   Loaded by every page (the hub and every module). It owns:
   - child profiles and which child is studying
   - progress: streak, daily goal, and per-tool results
   - per-child settings (sound, read aloud)
   - tones, speech, toast
   - the parent PIN lock and small dialogs
   - backup export / import
   Everything is saved in this browser's localStorage. Nothing goes online.

   Module API (what a tool calls):
     SB.requireProfile()            -> the active child, or sends the page back to the hub
     SB.moduleKey('my-module')      -> a localStorage key private to this child + module
     SB.opened(moduleId, toolId)    -> when a tool is opened (sets "Keep going", counts visits)
     SB.credit() / SB.slip()        -> one right / one wrong answer (streak + daily goal)
     SB.result(moduleId, toolId, score, max) -> a finished round (best score, attempts)
     SB.sfx.good() / bad() / win()  -> tones (respect the child's Sound setting)
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
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const remove = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const allKeys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const uid = () => Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function root() { return Object.assign({ profiles: [], active: null, pin: null, pinRemovedAt: null }, read(ROOT, {})); }
  function saveRoot(r) { write(ROOT, r); }
  function child(id) {
    const d = Object.assign({ settings: {}, streak: 0, bestStreak: 0, daily: { d: '', n: 0, done: false }, tools: {}, last: null }, read(CHILD(id), {}));
    d.settings = Object.assign({ sound: true, readAloud: false }, d.settings);
    if (d.daily.d !== today()) d.daily = { d: today(), n: 0, done: false };
    return d;
  }
  function saveChild(id, d) { write(CHILD(id), d); }

  /* ---------- profiles ---------- */
  const profiles = () => root().profiles;
  const profile = id => profiles().find(p => p.id === id) || null;
  const activeProfile = () => { const r = root(); return r.profiles.find(p => p.id === r.active) || null; };
  const activeId = () => { const p = activeProfile(); return p ? p.id : null; };
  function setActive(id) { const r = root(); r.active = id; saveRoot(r); }
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
    remove(CHILD(id)); clearModuleData(id);
  }
  function resetChild(id) {           // erase progress, keep the child's settings
    const old = child(id), fresh = child('__none__'); fresh.settings = old.settings;
    saveChild(id, fresh); clearModuleData(id);
  }
  function resetModule(id, moduleId, storageKeys) {
    const d = child(id);
    Object.keys(d.tools).forEach(k => { if (k.startsWith(moduleId + '/')) delete d.tools[k]; });
    if (d.last && d.last.module === moduleId) d.last = null;
    saveChild(id, d);
    (storageKeys || []).forEach(k => remove(MODPREFIX(id) + k));
  }
  const colorInk = c => (COLORS.find(x => x.c === c) || { ink: '#fff' }).ink;
  const initial = name => (String(name).trim()[0] || '?').toUpperCase();
  const avatar = (p, cls = '') => `<span class="av ${cls}" style="--c:${esc(p.color)};--ci:${colorInk(p.color)}" aria-hidden="true">${esc(initial(p.name))}</span>`;

  /* ---------- settings ---------- */
  function getSetting(k, id = activeId()) { return id ? child(id).settings[k] : ({ sound: true, readAloud: false })[k]; }
  function setSetting(k, v, id = activeId()) { if (!id) return; const d = child(id); d.settings[k] = v; saveChild(id, d); }

  /* ---------- progress ---------- */
  function credit() {
    const id = activeId(); if (!id) return { streak: 0, daily: 0, goal: DAILY_GOAL, goalJustReached: false };
    const d = child(id); d.streak++; d.bestStreak = Math.max(d.bestStreak, d.streak); d.daily.n++;
    let hit = false; if (d.daily.n >= DAILY_GOAL && !d.daily.done) { d.daily.done = true; hit = true; }
    saveChild(id, d); return { streak: d.streak, daily: d.daily.n, goal: DAILY_GOAL, goalJustReached: hit };
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
    if (r.best == null || score > r.best) { r.best = score; r.max = max == null ? null : max; }
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

  /* A storage key that belongs to the active child and one module */
  function moduleKey(key) { return MODPREFIX(activeId() || 'none') + key; }

  function requireProfile() {
    let p = activeProfile();
    if (!p && !profiles().length) p = ensureGuest();
    if (!p && profiles().length === 1) { setActive(profiles()[0].id); p = activeProfile(); }
    if (!p) { try { location.replace(BASE + 'index.html'); } catch (e) {} return null; }
    return p;
  }

  /* ---------- sound ---------- */
  let actx = null;
  function tone(freqs, dur = 0.12) {
    if (!getSetting('sound')) return;
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

  /* ---------- speech ---------- */
  const CAN_SPEAK = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const SPK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  let sayTok = 0, sayTimer = null;
  function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) {} sayTok++; clearTimeout(sayTimer); document.querySelectorAll('[data-sb-say].playing').forEach(b => b.classList.remove('playing')); }
  /* force: speak even when Read aloud is off (speaker buttons use this) */
  function say(text, opts = {}) {
    if (!CAN_SPEAK || !text || (!opts.force && !getSetting('readAloud'))) return;
    try {
      stopSpeech(); const tok = sayTok;
      const u = new SpeechSynthesisUtterance(text); u.lang = opts.lang || 'en-US'; u.rate = opts.rate || 0.85;
      const btns = opts.button ? [opts.button] : [];
      const done = () => { if (tok === sayTok) { clearTimeout(sayTimer); btns.forEach(b => b.classList.remove('playing')); } };
      u.onend = done; u.onerror = done; btns.forEach(b => b.classList.add('playing'));
      sayTimer = setTimeout(done, 5000 + text.length * 60);
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  const sayButton = (text, label = 'Hear it', lang = '') => CAN_SPEAK ? `<button type="button" class="spk" data-sb-say="${esc(text)}" data-lang="${esc(lang)}" aria-label="${esc(label)}" title="${esc(label)}">${SPK_ICON}</button>` : '';
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-sb-say]');
    if (b) { e.stopPropagation(); say(b.dataset.sbSay, { force: true, lang: b.dataset.lang || undefined, button: b }); }
  }, true);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('sb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'sb-toast'; t.className = 'sb-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- dialogs (styles are injected so modules with their own CSS get them too) ---------- */
  const DLG_CSS = `
  .sb-ov{position:fixed;inset:0;background:rgba(35,49,63,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;font-family:"Trebuchet MS","Segoe UI",system-ui,-apple-system,Arial,sans-serif}
  .sb-dlg{background:#fffdf7;color:#23313f;border:2px solid #e4dcc8;border-radius:24px;padding:26px 26px 22px;width:min(440px,100%);box-shadow:0 18px 40px rgba(0,0,0,.25);font-size:17px;line-height:1.45}
  .sb-dlg h3{margin:0 0 6px;font-size:23px}
  .sb-dlg p{margin:0 0 14px;color:#5b6773}
  .sb-dlg input{width:100%;font:inherit;font-size:24px;font-weight:700;letter-spacing:6px;text-align:center;padding:12px 14px;border:2px solid #2b4162;border-radius:12px;background:#fff;color:#23313f;margin-bottom:8px}
  .sb-dlg input.txt{letter-spacing:1px;font-size:20px}
  .sb-dlg input:focus{outline:3px solid rgba(27,153,139,.35)}
  .sb-dlg .sb-err{color:#d64545;font-weight:700;min-height:24px;font-size:16px;margin-bottom:6px}
  .sb-dlg .sb-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;align-items:center}
  .sb-dlg .sb-btn{font:inherit;font-weight:700;font-size:17px;border-radius:13px;padding:11px 22px;cursor:pointer;border:0;background:#2b4162;color:#fff;box-shadow:0 3px 0 #1b2b45}
  .sb-dlg .sb-btn.ghost{background:#fff;color:#2b4162;border:2px solid #e4dcc8;box-shadow:none}
  .sb-dlg .sb-btn.warn{background:#fff;color:#e4572e;border:2px solid #e4572e;box-shadow:none}
  .sb-dlg .sb-link{background:none;border:0;padding:0;color:#5b6773;text-decoration:underline;font:inherit;font-size:14px;cursor:pointer;margin-right:auto}
  .sb-sw{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 8px}
  .sb-sw button{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #e4dcc8;padding:0;cursor:pointer}
  .sb-sw button[aria-pressed="true"]{box-shadow:0 0 0 3px #2b4162}
  .sb-invite{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:105;background:#2b4162;color:#fff;border-radius:18px;padding:12px 12px 12px 18px;display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.25);width:max-content;max-width:calc(100% - 24px);font-family:"Trebuchet MS","Segoe UI",system-ui,-apple-system,Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.3}
  .sb-invite .sb-inv-btns{display:flex;gap:8px}
  .sb-invite button{font:inherit;font-size:15px;border-radius:11px;padding:8px 14px;cursor:pointer;border:0}
  .sb-invite .yes{background:#f6b73c;color:#23313f;box-shadow:0 3px 0 #b07a00}
  .sb-invite .no{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.45)}
  body.sb-inviting .sb-toast,body.sb-inviting .toast{bottom:calc(var(--sb-inv-h,80px) + 30px)!important}
  .sb-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,40px);background:#2b4162;color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;opacity:0;transition:.3s;z-index:110;pointer-events:none;font-family:"Trebuchet MS","Segoe UI",system-ui,Arial,sans-serif}
  .sb-toast.show{opacity:1;transform:translate(-50%,0)}
  @media (prefers-reduced-motion:reduce){.sb-toast{transition:none}}`;
  function injectCSS() { if (document.getElementById('sb-dlg-css')) return; const s = document.createElement('style'); s.id = 'sb-dlg-css'; s.textContent = DLG_CSS; (document.head || document.documentElement).appendChild(s); }
  injectCSS();

  function dialog(html, wire) {
    injectCSS();
    const prevFocus = document.activeElement;
    const ov = document.createElement('div'); ov.className = 'sb-ov';
    ov.innerHTML = `<div class="sb-dlg" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); try { prevFocus && prevFocus.focus(); } catch (e) {} };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); (ov._cancel || close)(); } };
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('pointerdown', e => { if (e.target === ov) (ov._cancel || close)(); });
    wire(ov.firstElementChild, close, ov);
    const f = ov.querySelector('input,button.sb-btn:not(.ghost)'); if (f) setTimeout(() => f.focus(), 30);
    return close;
  }

  function confirmDlg({ title, text, ok = 'Yes', cancel = 'Cancel', danger = false }, onOk, onCancel) {
    dialog(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="sb-row"><button class="sb-btn ghost" data-x="no">${esc(cancel)}</button><button class="sb-btn ${danger ? 'warn' : ''}" data-x="yes">${esc(ok)}</button></div>`, (box, close, ov) => {
      ov._cancel = () => { close(); onCancel && onCancel(); };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = () => { close(); onOk && onOk(); };
    });
  }

  /* ---------- parent PIN ----------
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
        setPin(a.value); close(); toast('Parent PIN saved'); onOk && onOk();
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      [a, b].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); x === a ? b.focus() : go(); } }));
    });
  }

  function forgotDialog(onOk, onCancel) {
    dialog(`<h3>Forgot the PIN?</h3><p>Type REMOVE to clear the PIN. All progress stays. The parent area will show the date the PIN was removed.</p>
      <input class="txt" type="text" autocomplete="off" aria-label="Type REMOVE" data-x="a">
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn warn" data-x="yes">Remove PIN</button></div>`, (box, close, ov) => {
      const a = box.querySelector('[data-x="a"]'), err = box.querySelector('.sb-err');
      ov._cancel = () => { close(); onCancel && onCancel(); };
      const go = () => {
        if (a.value.trim().toUpperCase() !== 'REMOVE') { err.textContent = 'Type the word REMOVE.'; a.focus(); return; }
        const r = root(); r.pin = null; r.pinRemovedAt = new Date().toISOString(); saveRoot(r); close();
        newPinDialog('Set a new parent PIN', 'Choose 4 to 8 digits.', onOk, onCancel);
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      a.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }

  /* Ask for the parent PIN, then run onOk. Stays unlocked for 5 minutes in this tab. */
  function requirePin(message, onOk, onCancel) {
    if (!hasPin()) {
      const r = root();
      if (!r.pinOffered) { r.pinOffered = true; saveRoot(r); return offerPin('Protect this with a parent PIN?', 'A PIN keeps kids from erasing progress or changing profiles. You can add one later in the Parent area.', onOk); }
      return onOk && onOk();
    }
    if (isUnlocked()) return onOk && onOk();
    dialog(`<h3>Parent PIN</h3><p>${esc(message || 'Enter the parent PIN to continue.')}</p>
      <input type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Parent PIN" data-x="a">
      <div class="sb-err" role="alert"></div>
      <div class="sb-row"><button class="sb-link" data-x="forgot" type="button">Forgot PIN?</button><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn" data-x="yes">Unlock</button></div>`, (box, close, ov) => {
      const a = box.querySelector('[data-x="a"]'), err = box.querySelector('.sb-err');
      ov._cancel = () => { close(); onCancel && onCancel(); };
      const go = () => {
        if (!checkPin(a.value)) { err.textContent = 'That PIN is not right.'; a.value = ''; a.focus(); sfx.bad(); return; }
        unlock(); close(); onOk && onOk();
      };
      box.querySelector('[data-x="no"]').onclick = ov._cancel;
      box.querySelector('[data-x="yes"]').onclick = go;
      box.querySelector('[data-x="forgot"]').onclick = () => { close(); forgotDialog(onOk, onCancel); };
      a.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }

  /* Offer a PIN with a Skip button. onDone runs after either choice. */
  function offerPin(title, text, onDone) {
    dialog(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="sb-row"><button class="sb-btn ghost" data-x="skip">Skip</button><button class="sb-btn" data-x="set">Set PIN</button></div>`, (box, close, ov) => {
      const skip = () => { close(); const r = root(); r.pinSkipped = true; saveRoot(r); onDone && onDone(); };
      ov._cancel = skip;
      box.querySelector('[data-x="skip"]').onclick = skip;
      box.querySelector('[data-x="set"]').onclick = () => { close(); newPinDialog('Set a parent PIN', 'Choose 4 to 8 digits. Only a parent should know it.', onDone, onDone); };
    });
  }
  /* Call after adding a profile: once there are two people and no PIN, offer one a second time. */
  function afterProfileAdded(onDone) {
    const r = root();
    if (r.profiles.length >= 2 && !r.pin && !r.pinOfferedAtTwo) {
      r.pinOfferedAtTwo = true; r.pinOffered = true; saveRoot(r);
      return offerPin('Add a parent PIN?', "Now that more than one child uses Study Buddy, a PIN keeps them from erasing each other's progress.", onDone);
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
    bar.innerHTML = '<span>Nice work! Add your name to keep your progress.</span><span class="sb-inv-btns"><button class="no" type="button">Not now</button><button class="yes" type="button">Add a name</button></span>';
    document.body.appendChild(bar);
    // other toasts move up while the invite is showing, so they never cover its buttons
    document.body.style.setProperty('--sb-inv-h', bar.offsetHeight + 'px'); document.body.classList.add('sb-inviting');
    const close = () => { bar.remove(); document.body.classList.remove('sb-inviting'); };
    bar.querySelector('.no').onclick = () => { const x = root(); x.inviteSnoozeUntil = Date.now() + 7 * 864e5; saveRoot(x); close(); };
    bar.querySelector('.yes').onclick = () => { close(); nameDialog(() => location.reload()); };
  }

  /* ---------- backup ---------- */
  function exportAll() {
    const data = {}; allKeys().filter(k => k && k.startsWith(NS)).forEach(k => { data[k] = localStorage.getItem(k); });
    return JSON.stringify({ app: 'study-buddy', version: 1, exported: new Date().toISOString(), data }, null, 1);
  }
  function importAll(text) {
    let o; try { o = JSON.parse(text); } catch (e) { throw new Error('That file is not a Study Buddy backup.'); }
    if (!o || o.app !== 'study-buddy' || !o.data || typeof o.data !== 'object') throw new Error('That file is not a Study Buddy backup.');
    allKeys().filter(k => k && k.startsWith(NS)).forEach(remove);
    Object.entries(o.data).forEach(([k, v]) => { if (k.startsWith(NS) && typeof v === 'string') { try { localStorage.setItem(k, v); } catch (e) {} } });
    lock();
  }
  function download(name, text, type = 'application/json') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- offline support (only works on a real web address, not a double-clicked file) ---------- */
  try {
    const webAddress = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if ('serviceWorker' in navigator && webAddress) window.addEventListener('load', () => navigator.serviceWorker.register(BASE + 'sw.js').catch(() => {}));
  } catch (e) {}

  window.SB = {
    ready: true, BASE, DAILY_GOAL, DIFFS, DIFF_NAMES, COLORS, CAN_SPEAK, SPK_ICON,
    esc, today,
    root, profiles, profile, activeProfile, activeId, setActive, addProfile, isGuest, ensureGuest, nameDialog, afterProfileAdded, offerPin, updateProfile, deleteProfile, resetChild, resetModule,
    avatar, colorInk, initial, child,
    getSetting, setSetting,
    credit, slip, streakInfo, opened, result, toolRecord, isMastered, moduleProgress, difficultyRange, diffBadge, diffRangeHTML,
    moduleKey, requireProfile,
    tone, sfx, say, stopSpeech, sayButton, toast,
    dialog, confirm: confirmDlg, requirePin, newPinDialog, hasPin, dismissPinNote, isUnlocked, lock,
    exportAll, importAll, download
  };
})();
