/* Study Buddy hub: who's studying, subjects and modules, module pages, parent area, first-run setup.
   Pages are switched with the address hash:
     #/                 who's studying
     #/home[/subject]   modules, optionally filtered to one subject
     #/module/<id>      one module and its tools
     #/parent[/section] parent area (PIN): progress, children, backup, pin  */
(function () {
  'use strict';
  const REG = window.SB_REGISTRY || { subjects: [], modules: [] };
  const app = document.getElementById('app');
  const esc = SB.esc;
  const subjectName = id => (REG.subjects.find(s => s.id === id) || { name: id }).name;
  const modById = id => REG.modules.find(m => m.id === id);
  const toolOf = (m, id) => m && m.tools.find(t => t.id === id);
  const DIFF_ORDER = d => SB.DIFFS.indexOf(d);
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function ago(ts) {
    if (!ts) return '';
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const days = Math.round((d0 - new Date(new Date(ts).setHours(0, 0, 0, 0))) / 864e5);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago';
  }
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  function header(title, eyebrow = 'Study Buddy', kid = null, parentView = false) {
    let right = '';
    if (kid) {
      const s = SB.streakInfo();
      right += `<div class="pill" title="Right answers in a row, and today's goal"><b>Streak ${s.streak}</b><b>Today ${Math.min(s.daily, s.goal)}/${s.goal}</b></div>`;
      right += `<a class="pill kidpill" href="#/" title="Switch to someone else">${SB.avatar(kid)}<b>${esc(kid.name)}</b><span class="hint">Switch</span></a>`;
    }
    if (!parentView) right += `<a class="pill" href="#/parent">Parent</a>`;
    return `<header class="top"><h1><small>${eyebrow}</small><span>${esc(title)}</span></h1><div class="row">${right}</div></header>`;
  }

  /* ---------- tool stats line ---------- */
  function toolStats(m, t, r) {
    if (t.kind === 'study') return r && r.visits ? 'Opened ' + plural(r.visits, 'time') + ', last ' + ago(r.last) : 'Not opened yet';
    if (!r || r.best == null) return r && r.visits ? 'Opened, no finished rounds yet' : 'Not tried yet';
    return 'Best ' + r.best + (r.max ? '/' + r.max : '') + ' · ' + plural(r.attempts, 'round') + ' · last ' + ago(r.last);
  }
  const toolURL = (m, t) => m.path + '?tool=' + encodeURIComponent(t.id);

  /* ---------- module card ---------- */
  function modCard(m) {
    const p = SB.moduleProgress(m), pct = p.total ? p.mastered / p.total * 100 : 0;
    return `<a class="mod" href="#/module/${esc(m.id)}">
      <div class="eyebrow">${esc(subjectName(m.subject))}</div>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.blurb)}</p>
      <div class="foot">
        <div class="tags">${m.tags.map(t => `<span class="tagpill">${esc(t)}</span>`).join('')}</div>
        <div class="row between">${SB.diffRangeHTML(m)}<span class="hint">${plural(m.tools.length, 'tool')}</span></div>
        <div class="prog"><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div><span class="hint">${p.mastered} of ${p.total} mastered</span></div>
      </div></a>`;
  }

  /* ---------- views ---------- */
  function viewWho() {
    document.title = 'Study Buddy';
    const ps = SB.profiles();
    app.innerHTML = header("Who's studying?") + `<section class="panel">
      <div class="who">${ps.map(p => `<button class="whocard" data-id="${esc(p.id)}">${SB.avatar(p, 'lg')}<span>${esc(p.name)}</span></button>`).join('')}</div>
      <p class="hint" style="text-align:center">Parents can add or change profiles in the Parent area.</p></section>`;
    app.querySelectorAll('.whocard').forEach(b => b.onclick = () => { SB.setActive(b.dataset.id); location.hash = '#/home'; });
  }

  function viewHome(filter) {
    const kid = SB.activeProfile();
    document.title = 'Study Buddy';
    const subj = REG.subjects.find(s => s.id === filter) ? filter : 'all';
    const count = id => REG.modules.filter(m => m.subject === id).length;
    const tabs = `<nav class="tabs" aria-label="Subjects">
      <a href="#/home" aria-selected="${subj === 'all'}">All<span class="n">${REG.modules.length}</span></a>
      ${REG.subjects.map(s => `<a href="#/home/${s.id}" aria-selected="${subj === s.id}">${esc(s.name)}<span class="n">${count(s.id)}</span></a>`).join('')}
    </nav>`;

    let cont = '';
    const last = SB.child(kid.id).last, lm = last && modById(last.module), lt = toolOf(lm, last && last.tool);
    if (lm && lt) cont = `<div class="continue"><div class="grow"><div class="eyebrow">Keep going</div><b>${esc(lt.name)}</b> <span class="hint">in ${esc(lm.title)} · ${ago(last.at)}</span></div><a class="btn small" href="${esc(toolURL(lm, lt))}">Open</a></div>`;

    let body;
    if (subj === 'all') {
      const order = id => REG.subjects.findIndex(s => s.id === id);
      const all = [...REG.modules].sort((a, b) => order(a.subject) - order(b.subject));   // each card names its subject
      body = all.length ? `<div class="grid">${all.map(modCard).join('')}</div>` : '<p class="empty">No modules yet.</p>';
    } else {
      const mine = REG.modules.filter(m => m.subject === subj);
      const sugg = REG.modules.filter(m => m.subject !== subj && m.tags.includes(subj));
      body = `<div style="margin-bottom:12px"><h3>${esc(subjectName(subj))}</h3></div>` +
        (mine.length ? `<div class="grid">${mine.map(modCard).join('')}</div>` : `<p class="empty">No ${esc(subjectName(subj))} modules yet.</p>`) +
        (sugg.length ? `<div class="sectionhead"><h3>Suggested</h3><p class="lead" style="margin:2px 0 0">From other subjects, with ${esc(subjectName(subj))} mixed in.</p></div><div class="grid">${sugg.map(modCard).join('')}</div>` : '');
    }
    app.innerHTML = header('Hi, ' + kid.name, 'Study Buddy', kid) + `<div class="bar2">${tabs}</div>${cont}<section class="panel">${body}</section>`;
  }

  function viewModule(id) {
    const kid = SB.activeProfile(), m = modById(id);
    if (!m) { location.hash = '#/home'; return; }
    document.title = m.title + ' · Study Buddy';
    const p = SB.moduleProgress(m);
    const tools = [...m.tools].sort((a, b) => DIFF_ORDER(a.difficulty) - DIFF_ORDER(b.difficulty));
    const card = t => {
      const r = SB.toolRecord(m.id, t.id), mastered = SB.isMastered(t, r);
      return `<div class="tool${mastered ? ' mastered' : ''}">
        <div class="row between">${SB.diffBadge(t.difficulty)}${mastered ? `<span class="done">${CHECK}Mastered</span>` : t.kind === 'study' ? '<span class="kind">Study</span>' : ''}</div>
        <h3>${esc(t.name)}</h3><p>${esc(t.blurb || '')}</p>
        <div class="tstats">${esc(toolStats(m, t, r))}</div>
        <a class="btn small" href="${esc(toolURL(m, t))}">Start</a></div>`;
    };
    app.innerHTML = header(m.title, `<a href="#/home">Study Buddy</a> · <a href="#/home/${esc(m.subject)}">${esc(subjectName(m.subject))}</a>`, kid) +
      `<section class="panel">
        <div class="modhead"><p>${esc(m.blurb)}</p>${SB.diffRangeHTML(m)}<div class="tags">${m.tags.map(t => `<span class="tagpill">${esc(t)}</span>`).join('')}</div>
          <div class="prog row" style="min-width:220px"><div class="bar" aria-hidden="true"><i style="width:${p.total ? p.mastered / p.total * 100 : 0}%"></i></div><span class="hint">${p.mastered} of ${p.total} mastered</span></div></div>
        <div class="grid">${tools.map(card).join('')}</div>
        <div class="row" style="margin-top:18px"><a class="btn ghost small" href="#/home">Back to all modules</a></div>
      </section>`;
  }

  /* ---------- parent area ---------- */
  const PSECTIONS = [['progress', 'Progress'], ['children', 'Children'], ['backup', 'Backup'], ['pin', 'PIN']];
  function viewParent(section) {
    document.title = 'Parent area · Study Buddy';
    if (!SB.hasPin() || !SB.isUnlocked()) {
      app.innerHTML = header('Parent area', 'Study Buddy', null, true) + `<section class="panel"><p class="lead">This area is locked with the parent PIN.</p><button class="btn" id="unlock">Unlock</button> <a class="btn ghost" href="#/">Back</a></section>`;
      const ask = () => SB.requirePin('Enter the parent PIN to open the parent area.', route);
      document.getElementById('unlock').onclick = ask; ask(); return;
    }
    const sec = PSECTIONS.find(s => s[0] === section) ? section : 'progress';
    const tabs = `<nav class="tabs" aria-label="Parent sections">${PSECTIONS.map(([k, n]) => `<a href="#/parent/${k}" aria-selected="${sec === k}">${n}</a>`).join('')}</nav>
      <div class="settings"><button class="iconbtn" id="lockBtn">Lock and leave</button></div>`;
    app.innerHTML = header('Parent area', 'Study Buddy', null, true) + `<div class="bar2">${tabs}</div><section class="panel" id="psec"></section>`;
    document.getElementById('lockBtn').onclick = () => { SB.lock(); location.hash = '#/'; };
    ({ progress: pProgress, children: pChildren, backup: pBackup, pin: pPin })[sec](document.getElementById('psec'));
  }

  function pProgress(box) {
    const ps = SB.profiles();
    if (!ps.length) { box.innerHTML = '<p class="empty">No children yet. Add them under Children.</p>'; return; }
    const sums = ps.map(p => {
      const d = SB.child(p.id), s = SB.streakInfo(p.id);
      const mastered = REG.modules.reduce((a, m) => a + SB.moduleProgress(m, p.id).mastered, 0);
      const total = REG.modules.reduce((a, m) => a + SB.moduleProgress(m, p.id).total, 0);
      const lm = d.last && modById(d.last.module), lt = toolOf(lm, d.last && d.last.tool);
      return `<div class="kidsum"><div class="row">${SB.avatar(p)}<b>${esc(p.name)}</b></div>
        <span class="hint">Tools mastered: <b>${mastered} of ${total}</b></span>
        <span class="hint">Today: <b>${Math.min(s.daily, s.goal)}/${s.goal}</b> right · Best streak: <b>${s.best}</b></span>
        <span class="hint">Last: ${lt ? `<b>${esc(lt.name)}</b> in ${esc(lm.title)}, ${ago(d.last.at)}` : 'nothing yet'}</span></div>`;
    }).join('');
    const tables = REG.modules.map(m => {
      const tools = [...m.tools].sort((a, b) => DIFF_ORDER(a.difficulty) - DIFF_ORDER(b.difficulty));
      const cell = (t, p) => {
        const r = SB.toolRecord(m.id, t.id, p.id);
        if (t.kind === 'study') return r && r.visits ? 'Opened ' + plural(r.visits, 'time') : '<span class="hint">Not opened</span>';
        if (!r || r.best == null) return '<span class="hint">Not tried</span>';
        return (SB.isMastered(t, r) ? `<span class="done">${CHECK}</span> ` : '') + 'Best ' + r.best + (r.max ? '/' + r.max : '') + ` <span class="hint">(${plural(r.attempts, 'round')})</span>`;
      };
      return `<h3 style="margin:0 0 8px">${esc(m.title)} <span class="hint">${esc(subjectName(m.subject))}</span></h3>
        <div class="tablewrap"><table class="ptable"><thead><tr><th>Tool</th><th>Difficulty</th>${ps.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr></thead>
        <tbody>${tools.map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${SB.diffBadge(t.difficulty)}</td>${ps.map(p => `<td class="num">${cell(t, p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }).join('');
    box.innerHTML = `<h2>Progress</h2><p class="lead">A tool counts as mastered once its best score reaches the goal in its description. Study tools have no score.</p><div class="cards2">${sums}</div>${tables}`;
  }

  function swatches(sel, name) {
    return `<div class="swatches" role="group" aria-label="${esc(name)}">${SB.COLORS.map(c => `<button type="button" class="swatch" style="--c:${c.c}" data-c="${c.c}" aria-pressed="${c.c === sel}" aria-label="Color ${c.c}"></button>`).join('')}</div>`;
  }

  function pChildren(box) {
    const ps = SB.profiles();
    const row = p => {
      const st = SB.child(p.id).settings;
      return `<div class="kidrow" data-id="${esc(p.id)}">${SB.avatar(p, 'lg')}
        <div class="grow" style="display:flex;flex-direction:column;gap:8px">
          <label class="field">Name<input class="nm" value="${esc(p.name)}" maxlength="24"></label>
          ${swatches(p.color, 'Color for ' + p.name)}
        </div>
        <div class="row">
          <button class="iconbtn" data-set="sound" aria-pressed="${st.sound}">Sound: ${st.sound ? 'on' : 'off'}</button>
          <button class="iconbtn" data-set="readAloud" aria-pressed="${st.readAloud}" title="Reads questions out loud in tools that support it">Read aloud: ${st.readAloud ? 'on' : 'off'}</button>
          <button class="btn warn small" data-act="reset">Reset progress</button>
          <button class="btn ghost small" data-act="delete">Delete</button>
        </div></div>`;
    };
    let newColor = SB.COLORS[ps.length % SB.COLORS.length].c;
    box.innerHTML = `<h2>Children</h2><p class="lead">Names, colors, and settings for each child. Read aloud is off unless you turn it on.</p>
      ${ps.map(row).join('') || '<p class="empty">No children yet.</p>'}
      <div class="kidrow"><div class="grow" style="display:flex;flex-direction:column;gap:8px">
        <label class="field">Add a child<input id="newName" maxlength="24" placeholder="Name"></label>
        <div id="newSw">${swatches(newColor, 'Color for the new child')}</div></div>
        <button class="btn" id="addKid">Add</button></div>`;

    box.querySelectorAll('.kidrow[data-id]').forEach(r => {
      const id = r.dataset.id, p = SB.profile(id);
      const nm = r.querySelector('.nm');
      nm.onchange = () => { if (nm.value.trim()) { SB.updateProfile(id, { name: nm.value }); SB.toast('Saved'); pChildren(box); } else nm.value = p.name; };
      r.querySelectorAll('.swatch').forEach(s => s.onclick = () => { SB.updateProfile(id, { color: s.dataset.c }); pChildren(box); });
      r.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { const k = b.dataset.set; SB.setSetting(k, !SB.getSetting(k, id), id); pChildren(box); });
      r.querySelector('[data-act="reset"]').onclick = () => SB.confirm({ title: 'Reset ' + p.name + "'s progress?", text: 'This erases best scores, streaks, and module progress (like passport stamps) for ' + p.name + '. Settings stay.', ok: 'Reset progress', danger: true }, () => { SB.resetChild(id); SB.toast(p.name + "'s progress was reset"); pChildren(box); });
      r.querySelector('[data-act="delete"]').onclick = () => SB.confirm({ title: 'Delete ' + p.name + '?', text: 'This removes the profile and all of its progress from this device.', ok: 'Delete', danger: true }, () => { SB.deleteProfile(id); SB.toast(p.name + ' was removed'); pChildren(box); });
    });
    box.querySelectorAll('#newSw .swatch').forEach(s => s.onclick = () => { newColor = s.dataset.c; box.querySelectorAll('#newSw .swatch').forEach(x => x.setAttribute('aria-pressed', x === s)); });
    const add = () => { const n = box.querySelector('#newName'); if (!n.value.trim()) { n.focus(); return; } SB.addProfile(n.value, newColor); SB.toast(n.value.trim() + ' was added'); pChildren(box); };
    box.querySelector('#addKid').onclick = add;
    box.querySelector('#newName').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  }

  function pBackup(box) {
    box.innerHTML = `<h2>Backup</h2>
      <p class="lead">Progress is saved in this browser on this device only. A backup file lets you keep a copy or move everything to another device, like a phone.</p>
      <div class="kidrow"><div class="grow"><h3>Save a backup</h3><span class="hint">Downloads one small file with every profile, setting, and score.</span></div><button class="btn" id="exp">Download backup</button></div>
      <div class="kidrow"><div class="grow"><h3>Load a backup</h3><span class="hint">Replaces everything on this device with the backup, including the parent PIN saved in it.</span></div>
        <label class="btn ghost" style="cursor:pointer">Choose file<input type="file" id="imp" accept=".json,application/json" hidden></label></div>`;
    box.querySelector('#exp').onclick = () => { const d = new Date(); SB.download(`study-buddy-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`, SB.exportAll()); };
    box.querySelector('#imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(text => SB.confirm({ title: 'Load this backup?', text: 'Everything on this device will be replaced with the backup from ' + f.name + '.', ok: 'Load backup', danger: true }, () => {
        try { SB.importAll(text); SB.toast('Backup loaded'); location.hash = '#/'; route(); } catch (err) { SB.toast(err.message); }
      }));
      e.target.value = '';
    };
  }

  function pPin(box) {
    const r = SB.root();
    box.innerHTML = `<h2>Parent PIN</h2>
      <p class="lead">The PIN protects resetting progress, changing profiles, and backups. It keeps kids from erasing things by accident. It is not real security.</p>
      ${r.pinRemovedAt ? `<div class="note">The PIN was removed with "Forgot PIN" on ${new Date(r.pinRemovedAt).toLocaleDateString()} and a new one was set. <button class="btn ghost small" id="dismiss">Dismiss</button></div>` : ''}
      <button class="btn" id="chg">Change PIN</button>`;
    box.querySelector('#chg').onclick = () => SB.newPinDialog('Change the parent PIN', 'Choose 4 to 8 digits.', () => pPin(box));
    const dm = box.querySelector('#dismiss'); if (dm) dm.onclick = () => { SB.dismissPinNote(); pPin(box); };
  }

  /* ---------- first run ---------- */
  function viewSetup() {
    document.title = 'Set up Study Buddy';
    const ps = SB.profiles(); let newColor = SB.COLORS[ps.length % SB.COLORS.length].c;
    const pinDone = SB.hasPin();
    app.innerHTML = header('Welcome to Study Buddy', 'First-time setup') + `<section class="panel"><div class="steps">
      <div class="step"><h3><span class="num">1</span>Set a parent PIN</h3>
        <p class="lead">You will need it to reset progress, change profiles, and make backups.</p>
        ${pinDone ? `<p class="done">${CHECK}PIN saved</p>` : '<button class="btn" id="pinBtn">Set PIN</button>'}</div>
      <div class="step"><h3><span class="num">2</span>Add your children</h3>
        <p class="lead">A first name is enough. Each child gets their own progress.</p>
        ${ps.map(p => `<div class="kidrow">${SB.avatar(p)}<b class="grow">${esc(p.name)}</b></div>`).join('')}
        <div class="kidrow"><div class="grow" style="display:flex;flex-direction:column;gap:8px"><input class="textin" id="newName" maxlength="24" placeholder="Name" aria-label="Child's name"><div id="newSw">${swatches(newColor, 'Color')}</div></div><button class="btn" id="addKid">Add</button></div></div>
      <div class="step"><button class="btn good" id="finish" ${pinDone && ps.length ? '' : 'disabled'}>Finish</button>
        <span class="hint" style="margin-left:10px">${pinDone && ps.length ? '' : 'Set a PIN and add at least one child to finish.'}</span></div>
    </div></section>`;
    const pb = document.getElementById('pinBtn'); if (pb) pb.onclick = () => SB.newPinDialog('Set a parent PIN', 'Choose 4 to 8 digits. Only a parent should know it.', viewSetup);
    app.querySelectorAll('#newSw .swatch').forEach(s => s.onclick = () => { newColor = s.dataset.c; app.querySelectorAll('#newSw .swatch').forEach(x => x.setAttribute('aria-pressed', x === s)); });
    const add = () => { const n = document.getElementById('newName'); if (!n.value.trim()) { n.focus(); return; } SB.addProfile(n.value, newColor); viewSetup(); document.getElementById('newName').focus(); };
    document.getElementById('addKid').onclick = add;
    document.getElementById('newName').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    document.getElementById('finish').onclick = () => { SB.root(); location.hash = '#/'; route(); };
  }

  /* ---------- router ---------- */
  let setupMode = false;
  function route() {
    const [view, arg] = location.hash.replace(/^#\/?/, '').split('/');
    if (!SB.profiles().length || (setupMode && !SB.hasPin())) { setupMode = true; return viewSetup(); }
    setupMode = false;
    if (view === 'parent') return viewParent(arg);
    const kid = SB.activeProfile();
    if (view === 'home' && kid) return viewHome(arg);
    if (view === 'module' && kid) return viewModule(arg);
    return viewWho();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
  route();
})();
