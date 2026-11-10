/* Study Buddy Textbooks page. hub.js calls HUBTB.draw(box, bookId) to fill the page.
   It reads books.js (the map) and registry.js (the modules), and the student's saved progress: a lesson is done when every
   tool listed for it is mastered. Nothing here is saved. */
(function () {
  'use strict';
  const SB = window.SB, esc = SB.esc;
  const REG = window.SB_REGISTRY, BOOKS = window.BOOKS || [];
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const modById = id => REG.modules.find(m => m.id === id && !m.archived);
  const toolURL = (m, t) => m.path + '?tool=' + encodeURIComponent(t.id);
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  /* what a lesson looks like for the active student */
  function lessonState(ch, ls) {
    const m = modById(ch.module);
    const tools = (ls.tools || []).map(id => m && m.tools.find(t => t.id === id)).filter(Boolean);
    const rows = tools.map(t => ({ t, mastered: SB.isMastered(t, SB.toolRecord(m.id, t.id)), started: !!SB.toolRecord(m.id, t.id) }));
    const left = rows.find(r => !r.mastered && r.t.kind !== 'study');   // study tools are shown but never need mastering
    return { m, rows, done: rows.some(r => r.t.kind !== 'study') && !left, started: rows.some(r => r.started), next: left ? left.t : null };
  }
  const mapped = ch => !!(ch.module && ch.lessons && ch.lessons.length && modById(ch.module));
  /* the first lesson (in book order) that is not done yet */
  function nextUp(book) {
    for (const ch of book.chapters) {
      if (!mapped(ch)) continue;
      for (const ls of ch.lessons) { const s = lessonState(ch, ls); if (s.next) return { ch, ls, s }; }
    }
    return null;
  }
  function counts(book) {
    let done = 0, total = 0;
    book.chapters.forEach(ch => { if (mapped(ch)) ch.lessons.forEach(ls => { total++; if (lessonState(ch, ls).done) done++; }); });
    return { done, total };
  }

  function chapterHTML(ch, openN, book) {
    const label = ch.label || (book.chapterLabel || 'Chapter') + ' ' + ch.n;
    const part = ch.part ? `<h4 class="tb-part">${esc(ch.part)}</h4>` : '';
    if (!ch.module || !modById(ch.module)) {
      return part + `<div class="tb-chap tb-off"><div class="tb-head"><span class="tb-num">${esc(label)}</span><span class="tb-title">${esc(ch.title || '')}</span><span class="tb-status">Not in Study Buddy yet</span></div></div>`;
    }
    const m = modById(ch.module);
    if (!mapped(ch)) {
      return part + `<div class="tb-chap"><div class="tb-head"><span class="tb-num">${esc(label)}</span><span class="tb-title">${esc(ch.title)}</span>
        <span class="tb-status">Lessons not matched to the book yet</span><a class="btn ghost small" href="${esc(m.path)}">Open the module</a></div></div>`;
    }
    const n = ch.lessons.filter(ls => lessonState(ch, ls).done).length;
    const guide = m.tools.find(t => t.id === ch.guide);
    const lessons = ch.lessons.map(ls => {
      const s = lessonState(ch, ls);
      const status = s.done ? `<span class="done">${CHECK}Done</span>` : s.started ? '<span class="tb-mid">In progress</span>' : '';
      return `<li class="tb-lesson${s.done ? ' is-done' : ''}" id="tb-${ch.n}-${ls.n}">
        <div class="tb-lhead"><span class="tb-lnum">${esc(book.lessonLabel || 'Lesson')} ${ls.n}</span><h4>${esc(ls.title)}</h4>${status}</div>
        ${ls.skills && ls.skills.length ? `<ul class="tb-skills">${ls.skills.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        <div class="tb-tools" role="group" aria-label="Tools for ${esc(ls.title)}">${s.rows.map(r => `<a class="btn small${r.mastered ? ' ghost' : ''}" href="${esc(toolURL(s.m, r.t))}"${r.mastered ? ' aria-label="' + esc(r.t.name) + ', mastered"' : ''}>${r.mastered ? CHECK : ''}${esc(r.t.name)}</a>`).join('')}</div>
      </li>`;
    }).join('');
    return part + `<details class="tb-chap"${ch.n === openN ? ' open' : ''}><summary class="tb-head"><span class="tb-num">${esc(label)}</span><span class="tb-title">${esc(ch.title)}</span>
        <span class="tb-status">${n === ch.lessons.length ? `<span class="done">${CHECK}All done</span>` : esc(n + ' of ' + plural(ch.lessons.length, 'lesson') + ' done')}</span></summary>
      <div class="tb-body"><div class="tb-top">${guide ? `<a class="btn small" href="${esc(toolURL(m, guide))}">${esc(guide.name)}</a>` : ''}<a class="btn ghost small" href="${esc(m.path)}">Open the module</a></div>
      <ol class="tb-lessons">${lessons}</ol></div></details>`;
  }

  function draw(box, bookId) {
    const book = BOOKS.find(b => b.id === bookId);
    if (bookId && !book) { location.hash = '#/textbooks'; return; }
    if (!book) {
      document.title = 'Textbooks · Study Buddy';
      box.innerHTML = `<h3 style="margin:0">Textbooks</h3><p class="lead" style="margin:2px 0 12px">Follow along with a book. Each lesson shows the tools that practice it.</p>
        <div class="grid">${BOOKS.map(b => { const c = counts(b); return `<a class="mod" href="#/textbooks/${esc(b.id)}"><div class="eyebrow">Textbook</div><h3>${esc(b.title)}</h3><p>${esc(b.blurb)}</p><p class="hint">${c.total ? esc(c.done + ' of ' + plural(c.total, 'lesson') + ' done') : ''}</p></a>`; }).join('')}</div>`;
      return;
    }
    document.title = book.title + ' · Study Buddy';
    const nx = nextUp(book), c = counts(book);
    const openN = nx ? nx.ch.n : (book.chapters.find(mapped) || {}).n;
    box.innerHTML = `<div class="tb-bookhead"><div class="grow"><h3 style="margin:0">${esc(book.title)}</h3><p class="lead" style="margin:2px 0 0">${esc(book.blurb)}</p></div>
        ${book.link ? `<a class="btn ghost small" href="${esc(book.link.url)}" target="_blank" rel="noopener">${esc(book.link.label)}</a>` : ''}</div>
      <div class="prog row" style="margin:10px 0 14px"><div class="bar" aria-hidden="true"><i style="width:${c.total ? c.done / c.total * 100 : 0}%"></i></div><span class="hint">${c.done} of ${plural(c.total, 'lesson')} done in the chapters matched so far</span></div>
      ${nx ? `<div class="continue" id="tbNext"><div class="grow"><div class="eyebrow">Up next</div><b>${esc(nx.ch.label || (book.chapterLabel || 'Chapter') + ' ' + nx.ch.n)}, ${esc(book.lessonLabel || 'Lesson')} ${nx.ls.n}: ${esc(nx.ls.title)}</b> <span class="hint">${esc(nx.s.next.name)}</span></div><a class="btn small" href="${esc(toolURL(nx.s.m, nx.s.next))}">Open</a></div>`
        : c.total ? '<p class="empty" id="tbNext">Every matched lesson is done.</p>' : ''}
      <div class="tb-chaps">${book.chapters.map(ch => chapterHTML(ch, openN, book)).join('')}</div>
      <div class="row" style="margin-top:14px"><a class="btn ghost small" href="#/textbooks">All textbooks</a></div>`;
  }

  window.HUBTB = { draw, nextUp, lessonState, counts };
})();
