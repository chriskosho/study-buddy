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
  const LIVE = REG.modules.filter(m => !m.archived);      // archived modules stay on disk (and open by direct link) but leave the hub, search, and totals
  const ARCHIVED = REG.modules.filter(m => m.archived);
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

  /* Page title row. The trail, search, child, Settings and Help live in the shared header (sb-shell.js). */
  function header(title, kid = null) {
    let right = '';
    if (kid) right = `<div class="pill" title="Right answers in a row, and today's goal">${SB.pillHTML()}</div>`;
    return `<header class="top"><h1><span>${esc(title)}</span></h1><div class="row">${right}</div></header>`;
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
    return `<div class="modcard">${SB.sayButton(m.title, 'Hear the name: ' + m.title)}<a class="mod" href="#/module/${esc(m.id)}">
      <div class="eyebrow">${esc(subjectName(m.subject))}</div>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.blurb)}</p>
      <div class="foot">
        <div class="tags">${m.tags.map(t => `<span class="tagpill">${esc(t)}</span>`).join('')}</div>
        <div class="row between">${SB.diffRangeHTML(m)}<span class="hint">${plural(m.tools.length, 'tool')}</span></div>
        <div class="prog"><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div><span class="hint">${p.mastered} of ${p.total} mastered</span></div>
      </div></a></div>`;
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
    const count = id => LIVE.filter(m => m.subject === id).length;
    const tabs = `<nav class="tabs" aria-label="Subjects">
      <a href="#/home" aria-selected="${subj === 'all'}">All<span class="n">${LIVE.length}</span></a>
      ${REG.subjects.map(s => `<a href="#/home/${s.id}" aria-selected="${subj === s.id}">${esc(s.name)}<span class="n">${count(s.id)}</span></a>`).join('')}
      ${(REG.utilities || []).length ? `<a href="#/utilities" aria-selected="${filter === 'utilities'}" class="utab">Utilities</a>` : ''}
    </nav>`;

    if (filter === 'utilities') {
      const u = REG.utilities || [];
      app.innerHTML = header('Utilities', kid) + `<div class="bar2">${tabs}</div><section class="panel"><div style="margin-bottom:12px"><h3>Utilities</h3><p class="lead" style="margin:2px 0 0">Handy tools for homework. They don't track progress.</p></div>
        <div class="grid">${u.map(x => `<a class="mod" href="${esc(x.path)}"><div class="eyebrow">Utility</div><h3>${esc(x.title)}</h3><p>${esc(x.blurb)}</p></a>`).join('')}</div></section>`;
      return;
    }
    let cont = '';
    const last = SB.child(kid.id).last, lm = last && modById(last.module), lt = toolOf(lm, last && last.tool);
    if (lm && lt) cont = `<div class="continue"><div class="grow"><div class="eyebrow">Keep going</div><b>${esc(lt.name)}</b> <span class="hint">in ${esc(lm.title)} · ${ago(last.at)}</span></div><a class="btn small" href="${esc(toolURL(lm, lt))}">Open</a></div>`;

    let body;
    if (subj === 'all') {
      const order = id => REG.subjects.findIndex(s => s.id === id);
      const all = [...LIVE].sort((a, b) => order(a.subject) - order(b.subject));   // each card names its subject
      body = all.length ? `<div class="grid">${all.map(modCard).join('')}</div>` : '<p class="empty">No modules yet.</p>';
    } else {
      const mine = LIVE.filter(m => m.subject === subj);
      const sugg = LIVE.filter(m => m.subject !== subj && m.tags.includes(subj));
      body = `<div style="margin-bottom:12px"><h3>${esc(subjectName(subj))}</h3></div>` +
        (mine.length ? `<div class="grid">${mine.map(modCard).join('')}</div>` : `<p class="empty">No ${esc(subjectName(subj))} modules yet.</p>`) +
        (sugg.length ? `<div class="sectionhead"><h3>Suggested</h3><p class="lead" style="margin:2px 0 0">From other subjects, with ${esc(subjectName(subj))} mixed in.</p></div><div class="grid">${sugg.map(modCard).join('')}</div>` : '');
    }
    app.innerHTML = header('Hi, ' + kid.name, kid) + `<div class="bar2">${tabs}</div>${cont}<section class="panel">${body}</section>`;
  }

  function viewModule(id) {
    const kid = SB.activeProfile(), m = modById(id);
    if (!m) { location.hash = '#/home'; return; }
    document.title = m.title + ' · Study Buddy';
    const p = SB.moduleProgress(m);
    const tools = [...m.tools].sort((a, b) => DIFF_ORDER(a.difficulty) - DIFF_ORDER(b.difficulty));
    const nextT = tools.find(t => t.kind !== 'study' && !SB.isMastered(t, SB.toolRecord(m.id, t.id)));   // the first tool not mastered yet, easiest first
    const card = t => {
      const r = SB.toolRecord(m.id, t.id), mastered = SB.isMastered(t, r), isNext = t === nextT && m.tools.some(x => SB.toolRecord(m.id, x.id));   // only once the module has been started, so a new module still begins with its study guide
      return `<div class="tool${mastered ? ' mastered' : ''}${isNext ? ' next' : ''}">
        <div class="row between">${SB.diffBadge(t.difficulty)}${mastered ? `<span class="done">${CHECK}Mastered</span>` : isNext ? '<span class="nextlbl">Try next</span>' : t.kind === 'study' ? '<span class="kind">Study</span>' : ''}</div>
        <div class="tname"><h3>${esc(t.name)}</h3>${SB.sayButton(t.name + '. ' + (t.blurb || ''), 'Hear about ' + t.name)}</div><p>${esc(t.blurb || '')}</p>
        <div class="tstats">${esc(toolStats(m, t, r))}</div>
        <a class="btn small" href="${esc(toolURL(m, t))}">Start</a></div>`;
    };
    app.innerHTML = header(m.title, kid) +
      `<section class="panel">
        <div class="modhead"><p>${esc(m.blurb)}</p>${SB.diffRangeHTML(m)}<div class="tags">${m.tags.map(t => `<span class="tagpill">${esc(t)}</span>`).join('')}</div>
          <div class="prog row" style="min-width:220px"><div class="bar" aria-hidden="true"><i style="width:${p.total ? p.mastered / p.total * 100 : 0}%"></i></div><span class="hint">${p.mastered} of ${p.total} mastered</span></div></div>
        <div class="grid">${tools.map(card).join('')}</div>
        <div class="row" style="margin-top:18px"><a class="btn ghost small" href="#/home">Back to all modules</a></div>
      </section>`;
  }

  /* ---------- parent area ---------- */
  const PSECTIONS = [['progress', 'Progress'], ['children', 'Children'], ['backup', 'Backup'], ['archived', 'Archived'], ['pin', 'PIN']];
  function viewParent(section) {
    document.title = 'Parent area · Study Buddy';
    if (!SB.hasPin() && !SB.root().pinOffered) {
      app.innerHTML = header('Parent area') + `<section class="panel"><p class="lead">Parent area</p></section>`;
      SB.requirePin('', route, () => { location.hash = '#/home'; }); return;
    }
    if (SB.hasPin() && !SB.isUnlocked()) {
      app.innerHTML = header('Parent area') + `<section class="panel"><p class="lead">This area is locked with the parent PIN.</p><button class="btn" id="unlock">Unlock</button> <a class="btn ghost" href="#/">Back</a></section>`;
      const ask = () => SB.requirePin('Enter the parent PIN to open the parent area.', route);
      document.getElementById('unlock').onclick = ask; ask(); return;
    }
    const sec = PSECTIONS.find(s => s[0] === section) ? section : 'progress';
    const tabs = `<nav class="tabs" aria-label="Parent sections">${PSECTIONS.map(([k, n]) => `<a href="#/parent/${k}" aria-selected="${sec === k}">${n}</a>`).join('')}</nav>
      <div class="settings"><button class="iconbtn" id="lockBtn">${SB.hasPin() ? 'Lock and leave' : 'Leave'}</button></div>`;
    const nopin = SB.hasPin() ? '' : `<div class="note row between">No parent PIN yet, so anyone can change profiles or erase progress here.<button class="btn small" id="setPin">Set a PIN</button></div>`;
    const bk = sec !== 'backup' && backupDue() ? `<div class="note row between noprint" role="status">${esc(backupLine())} Saving one every couple of weeks keeps progress safe if this browser is cleared.<button class="btn small" id="bkNow" type="button">Download backup</button></div>` : '';
    app.innerHTML = header('Parent area') + `<div class="bar2">${tabs}</div>${nopin}${bk}<section class="panel" id="psec"></section>`;
    if (bk) document.getElementById('bkNow').onclick = () => { saveBackup(); route(); };
    if (nopin) document.getElementById('setPin').onclick = () => SB.newPinDialog('Set a parent PIN', 'Choose 4 to 8 digits. Only a parent should know it.', route);
    document.getElementById('lockBtn').onclick = () => { SB.lock(); location.hash = '#/'; };
    ({ progress: pProgress, children: pChildren, backup: pBackup, archived: pArchived, pin: pPin })[sec](document.getElementById('psec'));
  }

  /* ---------- backups: a gentle reminder once the last one is two weeks old ---------- */
  const BACKUP_DAYS = 14;
  const hasProgress = () => SB.profiles().some(p => Object.keys(SB.child(p.id).tools).length);
  const backupLine = () => { const t = SB.root().lastBackupAt; return t ? 'Last backup: ' + ago(t) + '.' : 'No backup has been saved on this device yet.'; };
  const backupDue = () => { const t = SB.root().lastBackupAt; return hasProgress() && (!t || Date.now() - t > BACKUP_DAYS * 864e5); };
  const backupName = () => { const d = new Date(); return `study-buddy-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`; };
  function saveBackup() { SB.markBackup(); SB.download(backupName(), SB.exportAll()); SB.toast('Backup saved to your downloads'); }

  /* ---------- progress ---------- */
  let pWho = 'all';                                       // which child the Progress tab shows; "all" shows everyone side by side
  const DAYS_SHOWN = 14;
  function activityHTML(p) {
    const days = SB.child(p.id).days || {}, out = [];
    for (let i = DAYS_SHOWN - 1; i >= 0; i--) { const t = Date.now() - i * 864e5; out.push({ t, n: Number(days[SB.dayKey(t)]) || 0 }); }
    const top = Math.max(SB.DAILY_GOAL, ...out.map(o => o.n)), active = out.filter(o => o.n).length;
    const label = `${p.name}: right answers on each of the last ${DAYS_SHOWN} days. Studied on ${plural(active, 'day')}.`;
    return `<div class="actbars" role="img" aria-label="${esc(label)}">${out.map(o => `<i title="${esc(new Date(o.t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))}: ${o.n}" style="height:${o.n ? Math.max(8, o.n / top * 100) : 0}%;background:${o.n ? 'var(--teal-fill)' : 'transparent'}"></i>`).join('')}</div>
      <span class="hint">Last ${DAYS_SHOWN} days: studied on <b>${plural(active, 'day')}</b></span>`;
  }
  /* tools tried at least 3 times and still not mastered: where a little help goes furthest */
  function needsHelp(p) {
    const out = [];
    LIVE.forEach(m => m.tools.forEach(t => { if (t.kind === 'study') return; const r = SB.toolRecord(m.id, t.id, p.id); if (r && r.attempts >= 3 && !SB.isMastered(t, r)) out.push({ m, t, r }); }));
    return out.sort((a, b) => b.r.attempts - a.r.attempts);
  }
  function mostMissed(p, n = 5) {
    const all = SB.child(p.id).misses || {}, out = [];
    Object.entries(all).forEach(([mid, qs]) => { const m = modById(mid); if (!m || m.archived || !qs || typeof qs !== 'object') return; Object.entries(qs).forEach(([q, c]) => { if (Number(c) >= 2) out.push({ m, q, c: Number(c) }); }); });
    return out.sort((a, b) => b.c - a.c).slice(0, n);
  }
  function kidSummary(p, full) {
    const d = SB.child(p.id), s = SB.streakInfo(p.id);
    const mastered = LIVE.reduce((a, m) => a + SB.moduleProgress(m, p.id).mastered, 0);
    const total = LIVE.reduce((a, m) => a + SB.moduleProgress(m, p.id).total, 0);
    const lm = d.last && modById(d.last.module), lt = toolOf(lm, d.last && d.last.tool);
    const help = needsHelp(p), missed = mostMissed(p, full ? 8 : 3);
    const helpHTML = help.length ? `<span class="hint">Needs help:</span><ul class="plist">${help.slice(0, full ? 8 : 3).map(h => `<li><b>${esc(h.t.name)}</b> in ${esc(h.m.title)} <span class="hint">best ${h.r.best}${h.r.max ? '/' + h.r.max : ''} after ${plural(h.r.attempts, 'round')}</span></li>`).join('')}</ul>` : '';
    const missHTML = missed.length ? `<span class="hint">Missed most often:</span><ul class="plist">${missed.map(x => `<li>${esc(x.q)} <span class="hint">${esc(x.m.title)}, ${plural(x.c, 'time')}</span></li>`).join('')}</ul>` : '';
    return `<div class="kidsum"><div class="row">${SB.avatar(p)}<b>${esc(p.name)}</b></div>
      <span class="hint">Tools mastered: <b>${mastered} of ${total}</b></span>
      <span class="hint">Today: <b>${Math.min(s.daily, s.goal)}/${s.goal}</b> right · Best streak: <b>${s.best}</b></span>
      <span class="hint">Last: ${lt ? `<b>${esc(lt.name)}</b> in ${esc(lm.title)}, ${ago(d.last.at)}` : 'nothing yet'}</span>
      ${activityHTML(p)}${helpHTML}${missHTML}</div>`;
  }
  function pProgress(box) {
    const all = SB.profiles();
    if (!all.length) { box.innerHTML = '<p class="empty">No children yet. Add them under Children.</p>'; return; }
    if (pWho !== 'all' && !all.find(p => p.id === pWho)) pWho = 'all';
    const ps = pWho === 'all' ? all : all.filter(p => p.id === pWho), one = ps.length === 1;
    const filter = all.length > 1 ? `<div class="row pfilter" role="group" aria-label="Show progress for">${[['all', 'Everyone'], ...all.map(p => [p.id, p.name])].map(([id, n]) => `<button class="iconbtn" data-who="${esc(id)}" aria-pressed="${pWho === id}">${esc(n)}</button>`).join('')}</div>` : '';
    const started = m => ps.some(p => m.tools.some(t => { const r = SB.toolRecord(m.id, t.id, p.id); return r && (r.attempts || r.visits); }));
    const bySubject = REG.subjects.map(sj => ({ sj, mods: LIVE.filter(m => m.subject === sj.id) })).filter(g => g.mods.length);
    const tables = bySubject.map(({ sj, mods }) => `<h3 class="psubj">${esc(sj.name)}</h3>` + mods.map(m => {
      const tools = [...m.tools].sort((a, b) => DIFF_ORDER(a.difficulty) - DIFF_ORDER(b.difficulty));
      const cell = (t, p) => {
        const r = SB.toolRecord(m.id, t.id, p.id);
        if (t.kind === 'study') return r && r.visits ? 'Opened ' + plural(r.visits, 'time') : '<span class="hint">Not opened</span>';
        if (!r || r.best == null) return '<span class="hint">Not tried</span>';
        return (SB.isMastered(t, r) ? `<span class="done">${CHECK}</span> ` : '') + 'Best ' + r.best + (r.max ? '/' + r.max : '') + ` <span class="hint">(${plural(r.attempts, 'round')})</span>`;
      };
      const counts = ps.map(p => { const pr = SB.moduleProgress(m, p.id); return (one ? '' : esc(p.name) + ' ') + pr.mastered + '/' + pr.total; }).join(' · ');
      return `<details class="pmod"${started(m) ? ' open' : ''}><summary><b>${esc(m.title)}</b> <span class="hint">${one ? 'mastered ' : ''}${counts}</span></summary>
        <div class="tablewrap"><table class="ptable"><thead><tr><th>Tool</th><th>Difficulty</th>${ps.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr></thead>
        <tbody>${tools.map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${SB.diffBadge(t.difficulty)}</td>${ps.map(p => `<td class="num">${cell(t, p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
    }).join('')).join('');
    box.innerHTML = `<div class="row between"><h2 style="margin:0">Progress</h2><button class="btn ghost small noprint" id="printBtn" type="button">Print</button></div>${pinNote(SB.root())}
      <p class="lead">A tool counts as mastered once its best score reaches the goal in its description. Study tools have no score. Flashcards are practice only and do not count toward mastery. "Needs help" lists tools tried at least 3 times and not mastered yet.</p>
      ${filter}<div class="cards2${one ? ' one' : ''}">${ps.map(p => kidSummary(p, one)).join('')}</div>
      <div class="row noprint" style="margin-bottom:10px"><button class="btn ghost small" id="openAll" type="button">Open all</button><button class="btn ghost small" id="closeAll" type="button">Close all</button></div>${tables}`;
    box.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { pWho = b.dataset.who; pProgress(box); const f = box.querySelector(`[data-who="${CSS.escape(pWho)}"]`); if (f) f.focus(); });
    box.querySelector('#openAll').onclick = () => box.querySelectorAll('details.pmod').forEach(d => { d.open = true; });
    box.querySelector('#closeAll').onclick = () => box.querySelectorAll('details.pmod').forEach(d => { d.open = false; });
    box.querySelector('#printBtn').onclick = () => window.print();
    wireDismiss(box, pProgress);
  }
  /* printing opens every module, then puts them back the way they were */
  let printShut = [];
  window.addEventListener('beforeprint', () => { printShut = [...document.querySelectorAll('details.pmod:not([open])')]; printShut.forEach(d => { d.open = true; }); });
  window.addEventListener('afterprint', () => { printShut.forEach(d => { d.open = false; }); printShut = []; });

  function pArchived(box) {
    const ps = SB.profiles();
    box.innerHTML = `<h2>Archived modules</h2><p class="lead">Old versions that no longer show in the hub or search. Their files and each child's saved progress are kept. Open one to look at it again.</p>` +
      (ARCHIVED.length ? ARCHIVED.map(m => `<div class="kidrow"><div class="grow"><b>${esc(m.title)}</b> <span class="hint">${esc(subjectName(m.subject))}</span><div class="hint">${esc(m.archivedNote || m.blurb || '')}</div>
        <div class="hint">${ps.map(p => { const pr = SB.moduleProgress(m, p.id); return esc(p.name) + ': ' + pr.mastered + ' of ' + pr.total + ' tools mastered'; }).join(' · ')}</div></div>
        <a class="btn ghost small" href="${m.path}">Open</a></div>`).join('') : '<p class="empty">Nothing is archived.</p>');
  }

  function swatches(sel, name) {
    return `<div class="swatches" role="group" aria-label="${esc(name)}">${SB.COLORS.map(c => `<button type="button" class="swatch" style="--c:${c.c}" data-c="${c.c}" aria-pressed="${c.c === sel}" aria-label="Color ${c.c}"></button>`).join('')}</div>`;
  }

  function pChildren(box) {
    const ps = SB.profiles(), others = p => ps.filter(o => o.id !== p.id);
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
        </div>${SB.isGuest(p) && others(p).length && Object.keys(SB.child(p.id).tools).length ? `<div class="row movebox"><label class="field">Move Guest's progress to<select class="moveTo">${others(p).map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('')}</select></label><button class="btn small" data-act="move" type="button">Move</button></div>` : ''}</div>`;
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
      const mv = r.querySelector('[data-act="move"]');
      if (mv) mv.onclick = () => { const to = SB.profile(r.querySelector('.moveTo').value); if (!to) return; const lost = SB.mergePreview(id, to.id).notesDropped;
        SB.confirm({ title: "Move Guest's progress to " + to.name + '?', text: "Guest's scores, rounds, today's count, history, missed questions, module progress, and notes are added to " + to.name + '. Where both saved the same thing, ' + to.name + "'s stays. Then the Guest profile is removed." + (lost ? ' Only 25 notes fit, so the ' + plural(lost, 'oldest note') + ' will be left out.' : ''), ok: 'Move progress' }, () => {
          try { SB.mergeProfile(id, to.id); SB.toast("Guest's progress now belongs to " + to.name); } catch (err) { SB.toast(err.message); }
          pChildren(box);
        }); };
      r.querySelector('[data-act="delete"]').onclick = () => SB.confirm({ title: 'Delete ' + p.name + '?', text: 'This removes the profile and all of its progress from this device.', ok: 'Delete', danger: true }, () => { SB.deleteProfile(id); SB.toast(p.name + ' was removed'); pChildren(box); });
    });
    box.querySelectorAll('#newSw .swatch').forEach(s => s.onclick = () => { newColor = s.dataset.c; box.querySelectorAll('#newSw .swatch').forEach(x => x.setAttribute('aria-pressed', x === s)); });
    const add = () => { const n = box.querySelector('#newName'); if (!n.value.trim()) { n.focus(); return; } SB.addProfile(n.value, newColor); SB.toast(n.value.trim() + ' was added'); SB.afterProfileAdded(route); };
    box.querySelector('#addKid').onclick = add;
    box.querySelector('#newName').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  }

  function pBackup(box) {
    const hidden = 'tabindex="-1" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"';
    box.innerHTML = `<h2>Backup</h2>
      <p class="lead">Progress is saved in this browser on this device only. A backup file lets you keep a copy or move everything to another device, like a phone.</p>
      <p class="${backupDue() ? 'note' : 'hint'}" id="lastBk">${esc(backupLine())}</p>
      <div class="kidrow"><div class="grow"><h3>Save a backup</h3><span class="hint">Downloads one small file with every profile, setting, and score. It also holds the parent PIN, so keep it private.</span></div><button class="btn" id="exp">Download backup</button></div>
      <div class="kidrow"><div class="grow"><h3>Load a backup</h3><span class="hint">Replaces everything on this device with the backup, including the parent PIN saved in it.</span></div>
        <button class="btn ghost" id="pick" type="button">Choose file</button><input type="file" id="imp" accept=".json,application/json" ${hidden}></div>
      <div class="kidrow"><div class="grow"><h3>Load one child</h3><span class="hint">Brings back one child from a backup, as a new child or in place of a child here. Everyone else on this device stays as they are.</span></div>
        <button class="btn ghost" id="pick1" type="button">Choose file</button><input type="file" id="imp1" accept=".json,application/json" ${hidden}></div>`;
    box.querySelector('#pick').onclick = () => box.querySelector('#imp').click();
    box.querySelector('#pick1').onclick = () => box.querySelector('#imp1').click();
    box.querySelector('#exp').onclick = () => { saveBackup(); pBackup(box); };
    const readFile = (e, then) => {
      const f = e.target.files[0]; if (!f) return;
      e.target.value = '';
      f.text().then(text => {
        let info; try { info = SB.checkBackup(text); } catch (err) { SB.confirm({ title: 'Cannot load this file', text: err.message + ' Nothing on this device was changed.', ok: 'OK', cancel: 'Close' }); return; }
        then(text, info, f);
      }, () => SB.toast('That file could not be read.'));
    };
    box.querySelector('#imp').onchange = e => readFile(e, (text, info, f) => {
      SB.confirm({ title: 'Load this backup?', text: 'Everything on this device will be replaced with the backup from ' + f.name + '. It has ' + info.names.join(', ') + '.', ok: 'Load backup', danger: true }, () => {
        try { SB.importAll(text); SB.toast('Backup loaded'); location.hash = '#/'; route(); } catch (err) { SB.toast(err.message); }
      });
    });
    box.querySelector('#imp1').onchange = e => readFile(e, text => {
      const kids = JSON.parse(JSON.parse(text).data['studybuddy.v1.root']).profiles, here = SB.profiles();
      SB.dialog(`<h3>Load one child</h3>
        <label class="sb-field">Child in the backup<select id="oneFrom">${kids.map(k => `<option value="${esc(k.id)}">${esc(String(k.name).slice(0, 24))}</option>`).join('')}</select></label>
        <label class="sb-field">Put them<select id="oneTo"><option value="">As a new child</option>${here.map(p => `<option value="${esc(p.id)}">In place of ${esc(p.name)}</option>`).join('')}</select></label>
        <p class="sb-hint" id="oneWarn" hidden>This replaces that child's progress, settings, and notes here.</p>
        <div class="sb-row"><button class="sb-btn ghost" data-x="no">Cancel</button><button class="sb-btn" data-x="yes">Load child</button></div>`, (dlg, close) => {
        const to = dlg.querySelector('#oneTo'), warn = dlg.querySelector('#oneWarn'), yes = dlg.querySelector('[data-x="yes"]');
        const sync = () => { warn.hidden = !to.value; yes.classList.toggle('warn', !!to.value); };   // starts as a new child; replacing is a choice, with a warning
        to.onchange = sync; sync();
        dlg.querySelector('[data-x="no"]').onclick = close;
        yes.onclick = () => {
          const from = dlg.querySelector('#oneFrom').value, target = to.value || null, kid = kids.find(k => k.id === from);
          close();
          try { SB.importChild(text, from, target); SB.toast(String(kid.name).slice(0, 24) + ' was loaded from the backup'); route(); } catch (err) { SB.toast(err.message); }
        };
      });
    });
  }

  const pinNote = r => r.pinRemovedAt ? `<div class="note" role="status">The parent PIN was reset with "Forgot PIN" on ${esc(new Date(r.pinRemovedAt).toLocaleDateString())}. <button class="btn ghost small" id="dismiss" type="button">Dismiss</button></div>` : '';
  function wireDismiss(box, again) { const dm = box.querySelector('#dismiss'); if (dm) dm.onclick = () => { SB.dismissPinNote(); again(box); }; }
  function pPin(box) {
    const r = SB.root();
    box.innerHTML = `<h2>Parent PIN</h2>
      <p class="lead">The PIN protects resetting progress, changing profiles, and backups. It keeps kids from erasing things by accident. It is not real security.</p>
      ${pinNote(r)}
      <button class="btn" id="chg">Change PIN</button>`;
    box.querySelector('#chg').onclick = () => SB.newPinDialog('Change the parent PIN', 'Choose 4 to 8 digits.', () => pPin(box));
    wireDismiss(box, pPin);
  }

  /* ---------- router ----------
     First visit: a Guest profile is made, so the app opens straight to the subjects.
     "Who's studying?" only appears when two or more people use Study Buddy. */
  function route() {
    const [view, arg] = location.hash.replace(/^#\/?/, '').split('/');
    SB.applyDisplay();                                  // each child's own dark mode, font and size, also right after switching child
    if (!SB.profiles().length) SB.ensureGuest();
    if (SB.profiles().length === 1 && !SB.activeProfile()) SB.setActive(SB.profiles()[0].id);
    if (view !== 'parent') SB.lock();
    const kid = SB.activeProfile(), many = SB.profiles().length > 1;
    const INFO = { settings: 'Settings', help: 'Help', faq: 'FAQ', about: 'About', changelog: 'Change log', notes: 'My notes' };
    let crumbs = [], shellOpts = null;
    if (view === 'parent') { viewParent(arg); crumbs = [{ label: 'Parent area' }]; }
    else if (INFO[view] && (kid || (view !== 'settings' && view !== 'notes'))) { window.HUBPAGES[view](app, kid); crumbs = [{ label: INFO[view] }]; }
    else if (view === 'home' && kid) { viewHome(arg); const s = REG.subjects.find(x => x.id === arg); crumbs = s ? [{ label: s.name }] : []; }
    else if (view === 'utilities' && kid) { viewHome('utilities'); crumbs = [{ label: 'Utilities' }]; }
    else if (view === 'module' && kid) { viewModule(arg); if (modById(arg)) shellOpts = { module: arg }; }
    else if (!many && kid) viewHome();
    else { viewWho(); crumbs = [{ label: "Who's studying?" }]; }
    SB.shell(shellOpts || { crumbs });
  }
  window.SB_SHELL_RELOAD = route;
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); const h = app.querySelector('h1'); if (h && !document.querySelector('.sb-ov')) { h.tabIndex = -1; h.focus({ preventScroll: true }); } });   // keyboard and screen reader users start at the new page's title
  route();
})();
