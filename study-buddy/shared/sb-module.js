/* Study Buddy module shell.
   Builds the standard module page around a set of tools: header (back link, title, child, streak),
   one tab per tool (from registry.js), the settings row (Sound, Read aloud, Reset with the parent PIN),
   ?tool=<id> deep links, lazy tool start-up, and saved per-child module state.

   A module page loads sb-core.js, registry.js and this file, has <div class="wrap" id="app"></div>, then calls:

     SBM.start({
       module: 'parts-of-speech',            // id in registry.js
       defaults: { ... },                     // the module's saved state, per child
       tools: {
         guide: { init(ctx) { ... }, leave() { ... } },   // leave() is optional (stop timers, etc.)
         ...
       }
     });

   ctx (one per tool) gives: panel, tool, mod, kid, state, save(), credit(), slip(), result(score, max),
   say(text) (only when the child's Read aloud is on), sayButton(text, label), sfx, toast(msg), esc. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function start(cfg) {
    const kid = SB.requireProfile(); if (!kid) return;
    const REG = window.SB_REGISTRY, mod = REG.modules.find(m => m.id === cfg.module);
    if (!mod) throw new Error('Module ' + cfg.module + ' is missing from registry.js');
    const subject = REG.subjects.find(s => s.id === mod.subject) || { id: mod.subject, name: mod.subject };
    const tools = mod.tools.filter(t => cfg.tools[t.id] && !cfg.tools[t.id].hidden);
    const hub = SB.BASE + 'index.html', esc = SB.esc;
    const key = SB.moduleKey(cfg.module);
    const fresh = () => JSON.parse(JSON.stringify(cfg.defaults || {}));
    let state = fresh();
    try { Object.assign(state, JSON.parse(localStorage.getItem(key) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} };

    document.title = mod.title + ' · Study Buddy';
    document.body.classList.add('sbm');
    if (!SB.CAN_SPEAK) document.body.classList.add('no-speech');
    const app = $('#app');
    app.innerHTML = `
      <header class="top">
        <h1><small><a href="${hub}#/module/${esc(mod.id)}" title="Back to Study Buddy">&lsaquo; Study Buddy</a> &middot; <a href="${hub}#/home/${esc(subject.id)}">${esc(subject.name)}</a></small><span>${esc(mod.title)}</span></h1>
        <div class="row">${SB.isGuest(kid)
          ? `<button class="pill kidpill" id="sbAddName" title="Add your name to keep your progress">${SB.avatar(kid)}<b>Guest</b><span class="hint">Add a name</span></button>`
          : `<a class="pill kidpill" href="${hub}#/" title="Switch to someone else">${SB.avatar(kid)}<b>${esc(kid.name)}</b></a>`}<div class="pill" id="sbStreak" title="Right answers in a row, and today's goal"></div>
          <div class="settings">
            <button class="iconbtn" id="sbSound"></button>
            ${SB.CAN_SPEAK ? '<button class="iconbtn" id="sbRead" title="Reads questions out loud"></button>' : ''}
            <button class="iconbtn" id="sbDisplay" title="Theme, font, and text size">Display</button>
            <button class="iconbtn" id="sbReset" title="Erase this module's progress (parent PIN)">Reset</button>
          </div></div>
      </header>
      <div class="bar2">
        <nav class="tabs" role="tablist" aria-label="Tools">${tools.map(t => `<button role="tab" data-tab="${esc(t.id)}" aria-selected="false">${esc(t.name)}</button>`).join('')}</nav>
      </div>
      ${tools.map(t => `<section class="panel" id="tab-${esc(t.id)}" role="tabpanel" hidden></section>`).join('')}`;

    const renderStreak = () => { const s = SB.streakInfo(); $('#sbStreak').innerHTML = `<b>Streak ${s.streak}</b><b>Today ${Math.min(s.daily, s.goal)}/${s.goal}</b>`; };
    const paint = () => {
      const snd = SB.getSetting('sound'), rd = SB.getSetting('readAloud');
      const s = $('#sbSound'); s.textContent = 'Sound: ' + (snd ? 'on' : 'off'); s.setAttribute('aria-pressed', snd);
      const r = $('#sbRead'); if (r) { r.textContent = 'Read aloud: ' + (rd ? 'on' : 'off'); r.setAttribute('aria-pressed', rd); }
    };
    renderStreak(); paint();
    $('#sbDisplay').onclick = () => SB.displayDialog(paint);
    if ($('#sbAddName')) $('#sbAddName').onclick = () => SB.nameDialog(() => location.reload());
    $('#sbSound').onclick = () => { SB.setSetting('sound', !SB.getSetting('sound')); paint(); if (SB.getSetting('sound')) SB.sfx.good(); };
    if ($('#sbRead')) $('#sbRead').onclick = () => { const on = !SB.getSetting('readAloud'); SB.setSetting('readAloud', on); paint(); if (on) SB.say('Read aloud is on.'); else SB.stopSpeech(); };

    function ctxFor(t) {
      return {
        panel: $('#tab-' + t.id), tool: t, mod, kid, esc,
        get state() { return state; }, save,
        credit() {
          const r = SB.credit(); renderStreak();
          if (r.goalJustReached) { SB.toast('Daily goal reached! Great studying.'); SB.sfx.win(); }
          else if (r.streak > 0 && r.streak % 5 === 0) SB.toast(r.streak + ' in a row!');
        },
        slip() { SB.slip(); renderStreak(); },
        result(score, max) { SB.result(mod.id, t.id, score, max); },
        say: (text, opts) => SB.say(text, opts),
        sayButton: (text, label) => SB.sayButton(text, label || 'Hear it'),
        sfx: SB.sfx, toast: SB.toast
      };
    }

    const started = {}; let current = null;
    function show(id) {
      if (current && current !== id && cfg.tools[current].leave) cfg.tools[current].leave();
      SB.stopSpeech();
      current = id;
      $$('nav.tabs button').forEach(b => {
        const on = b.dataset.tab === id; b.setAttribute('aria-selected', on);
        if (on && innerWidth <= 760 && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      $$('section.panel').forEach(s => s.hidden = s.id !== 'tab-' + id);
      const t = tools.find(x => x.id === id);
      if (!started[id]) { started[id] = true; cfg.tools[id].init(ctxFor(t)); }
      else if (cfg.tools[id].enter) cfg.tools[id].enter();
      SB.opened(mod.id, id);
    }
    $$('nav.tabs button').forEach(b => b.onclick = () => show(b.dataset.tab));

    $('#sbReset').onclick = () => SB.requirePin('Enter the parent PIN to erase ' + kid.name + "'s " + mod.title + ' progress.', () => {
      if (current && cfg.tools[current].leave) cfg.tools[current].leave();
      SB.resetModule(kid.id, mod.id, mod.storage || []);
      state = fresh(); save();
      Object.keys(started).forEach(k => delete started[k]);
      $$('section.panel').forEach(s => s.innerHTML = '');
      SB.toast('Progress reset'); show(current);
    }, null, { confirm: { title: 'Reset ' + mod.title + '?', text: 'This erases ' + kid.name + "'s scores and saved progress in " + mod.title + '. Other modules and settings stay.', ok: 'Reset progress' } });

    const want = new URLSearchParams(location.search).get('tool');
    show(tools.some(t => t.id === want) ? want : (cfg.first && tools.some(t => t.id === cfg.first) ? cfg.first : tools[0].id));
  }

  window.SBM = { start };
})();
