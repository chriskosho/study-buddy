/* Study Buddy shell: the one header and footer every page shares.
   A page calls  SB.shell({ ... })  once it knows where it is:

     SB.shell({ module: 'planets' })          Home > Science > Planets
     SB.shell({ utility: 'Calculator' })      Home > Utilities > Calculator
     SB.shell({ crumbs: [{ label, href? }] }) any trail after Home (the last item is the current page)
     SB.shell({})                             just Home

   The hub calls it again on every route change, so the trail always matches the page.
   Header: Study Buddy (home), the trail, Search, the child, Settings, Help menu.
   Footer: Home, Subjects, Utilities, Settings, Parent area, Help, FAQ, About, and the privacy line.
   Needs sb-core.js. Uses registry.js for names and search (loads it if the page did not). */
(function () {
  'use strict';
  if (!window.SB || window.SB.shell) return;
  const SB = window.SB, esc = SB.esc, BASE = SB.BASE;
  const HOME = BASE + 'index.html#/home';
  const PAGE = k => BASE + 'index.html#/' + k;

  const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.8 L10.6 2.2 L13.4 2.2 L13.7 4.8 L15.9 5.7 L18.0 4.1 L19.9 6.0 L18.3 8.1 L19.2 10.3 L21.8 10.6 L21.8 13.4 L19.2 13.7 L18.3 15.9 L19.9 18.0 L18.0 19.9 L15.9 18.3 L13.7 19.2 L13.4 21.8 L10.6 21.8 L10.3 19.2 L8.1 18.3 L6.0 19.9 L4.1 18.0 L5.7 15.9 L4.8 13.7 L2.2 13.4 L2.2 10.6 L4.8 10.3 L5.7 8.1 L4.1 6.0 L6.0 4.1 L8.1 5.7z"/><circle cx="12" cy="12" r="3"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.8M12 17h.01"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>'
  };

  const CSS = `
  body.sbshell{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr auto;min-height:100vh}
  body.sbshell>.wrap{width:100%;min-width:0;padding-top:10px;padding-bottom:8px}
  body.sbshell header.top{margin-bottom:8px}
  body.sbshell h1{font-size:clamp(22px,2.4vw,28px)}
  body.sbshell section.panel{padding-top:16px;padding-bottom:16px}
  body.sbshell .bar2{margin-bottom:8px}
  .sbhead{background:var(--card);border-bottom:2px solid var(--line);position:relative;z-index:60}
  .sbhead-in{max-width:1600px;margin:0 auto;padding:5px clamp(14px,3vw,40px);display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap}
  .sbbrand{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:18px;color:var(--navy-ink,var(--navy));text-decoration:none;white-space:nowrap;padding:4px 6px;border-radius:10px}
  .sbbrand svg{width:22px;height:22px}
  .sbcrumbs{flex:1 1 auto;min-width:0}
  .sbcrumbs ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;gap:2px 0;font-size:15px;font-weight:700}
  .sbcrumbs li{display:inline-flex;align-items:center;min-width:0}
  .sbcrumbs li+li::before{content:"\\203A";margin:0 8px;color:var(--ink2);font-weight:800}
  .sbcrumbs a{color:var(--navy-ink,var(--navy));text-decoration:none;border-bottom:2px solid transparent;padding:2px 0}
  .sbcrumbs a:hover{border-bottom-color:var(--teal)}
  .sbcrumbs [aria-current]{color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sbhead-r{display:flex;align-items:center;gap:8px;margin-left:auto}
  .sbbtn{display:inline-flex;align-items:center;gap:7px;background:var(--surface,var(--card));border:2px solid var(--line);border-radius:999px;padding:4px 13px;font-size:15px;font-weight:700;color:var(--ink);text-decoration:none;white-space:nowrap;line-height:1.2}
  .sbbtn svg{width:18px;height:18px;flex:0 0 auto}
  .sbbtn:hover{border-color:var(--teal)}
  .sbbtn[aria-expanded="true"]{border-color:var(--navy-ink,var(--navy))}
  .sbbtn b{font-weight:800}
  .sbbtn .hint{font-size:13px}
  .sbsearch{position:relative}
  .sbsearch-box{position:relative;display:flex;align-items:center}
  .sbsearch input{width:min(280px,34vw);font:inherit;font-size:15px;padding:5px 14px 5px 38px;border:2px solid var(--line);border-radius:999px;background:var(--surface,var(--card));color:var(--ink)}
  .sbsearch input:focus{border-color:var(--navy-ink,var(--navy));outline:none}
  .sbsearch-box svg{position:absolute;left:12px;width:18px;height:18px;color:var(--ink2);pointer-events:none}
  .sbsearch-toggle{display:none}
  .sbresults{position:absolute;right:0;top:calc(100% + 6px);width:min(420px,92vw);max-height:60vh;overflow:auto;list-style:none;margin:0;padding:6px;background:var(--card);border:2px solid var(--line);border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.2);z-index:70}
  .sbresults[hidden]{display:none}
  .sbresults a{display:flex;flex-direction:column;gap:1px;padding:8px 12px;border-radius:10px;color:var(--ink);text-decoration:none}
  .sbresults a b{font-size:16px}
  .sbresults a span{font-size:13px;color:var(--ink2)}
  .sbresults li[aria-selected="true"] a,.sbresults a:hover{background:var(--tint-note,#fff0cf)}
  .sbresults .none{padding:10px 12px;color:var(--ink2);font-size:15px}
  .sbmenu{position:relative}
  .sbmenu-list{position:absolute;right:0;top:calc(100% + 6px);min-width:190px;list-style:none;margin:0;padding:6px;background:var(--card);border:2px solid var(--line);border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.2);z-index:70}
  .sbmenu-list[hidden]{display:none}
  .sbmenu-list a{display:block;padding:9px 12px;border-radius:10px;color:var(--ink);text-decoration:none;font-weight:700}
  .sbmenu-list a:hover{background:var(--tint-note,#fff0cf)}
  .sbfoot{border-top:2px solid var(--line);background:var(--card);color:var(--ink2);font-size:14px}
  .sbfoot-in{max-width:1600px;margin:0 auto;padding:5px clamp(14px,3vw,40px);display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;justify-content:space-between}
  .sbfoot nav{display:flex;flex-wrap:wrap;gap:2px 16px}
  .sbfoot a{color:var(--navy-ink,var(--navy));font-weight:700;text-decoration:none;padding:3px 0}
  .sbfoot a:hover{text-decoration:underline}
  .sbfoot p{margin:0}
  @media (max-width:760px){
    .sbhead-in{padding:6px 14px;gap:6px 8px}
    .sbbrand span{display:none}
    .sbbtn{padding:6px 10px}
    .sbbtn .lbl{display:none}
    .sbbtn.kidpill .hint{display:none}
    .sbcrumbs{order:5;flex:1 1 100%}
    .sbcrumbs ol{font-size:14px}
    .sbsearch,.sbsearch-box{position:static}
    .sbsearch input{display:none}
    .sbsearch.open input{display:block;position:absolute;left:14px;right:14px;top:calc(100% + 6px);width:auto;z-index:71}
    .sbsearch-toggle{display:inline-flex}
    .sbsearch-box svg{display:none}
    .sbsearch.open .sbresults{position:absolute;left:14px;right:14px;top:calc(100% + 54px);width:auto}
    .sbfoot-in{padding:10px 14px}
    .sbfoot nav{gap:2px 14px}
  }
  html.sb-dark .sbresults,html.sb-dark .sbmenu-list{box-shadow:0 12px 30px rgba(0,0,0,.5)}
  html.sb-dark .sbresults li[aria-selected="true"] a,html.sb-dark .sbresults a:hover,html.sb-dark .sbmenu-list a:hover{background:var(--tint-note,#2d3b4f)}
  html.sb-large body.sbshell{min-height:calc(100vh / 1.15)}
  `;
  const style = document.createElement('style'); style.id = 'sb-shell-css'; style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  /* ---------- the registry (names and search) ---------- */
  const REG = () => window.SB_REGISTRY || { subjects: [], modules: [], utilities: [] };
  let regLoading = null;
  function ensureRegistry() {
    if (window.SB_REGISTRY) return Promise.resolve();
    if (regLoading) return regLoading;
    regLoading = new Promise(res => { const s = document.createElement('script'); s.src = BASE + 'registry.js'; s.onload = s.onerror = () => res(); document.head.appendChild(s); });
    return regLoading;
  }
  const subjectOf = id => (REG().subjects.find(s => s.id === id) || { id, name: id });

  /* ---------- search ---------- */
  const PAGES = [
    { title: 'Settings', blurb: 'Theme, font, text size, sound, read aloud, and the voice', href: PAGE('settings'), words: 'display dark mode dyslexic larger text volume voice update refresh latest reload' },
    { title: 'Help', blurb: 'How to use Study Buddy', href: PAGE('help'), words: 'how to guide tutorial' },
    { title: 'FAQ', blurb: 'Common questions and answers', href: PAGE('faq'), words: 'questions questions answers' },
    { title: 'About', blurb: 'What Study Buddy is, and your privacy', href: PAGE('about'), words: 'privacy data credits' },
    { title: 'Parent area', blurb: 'Progress, children, backup, and the PIN (needs the PIN)', href: PAGE('parent'), words: 'backup pin children progress reset' }
  ];
  function searchIndex() {
    const R = REG(), out = [];
    R.modules.filter(m => !m.archived).forEach(m => {
      out.push({ kind: 'Module', title: m.title, ctx: subjectOf(m.subject).name, blurb: m.blurb || '', words: (m.tags || []).join(' '), href: BASE + 'index.html#/module/' + m.id });
      (m.tools || []).forEach(t => out.push({ kind: 'Tool', title: t.name, ctx: 'in ' + m.title, blurb: t.blurb || '', words: m.title + ' ' + (m.tags || []).join(' '), href: BASE + m.path + '?tool=' + encodeURIComponent(t.id) }));
    });
    (R.utilities || []).forEach(u => out.push({ kind: 'Utility', title: u.title, ctx: 'Utilities', blurb: u.blurb || '', words: '', href: BASE + u.path }));
    R.subjects.forEach(s => out.push({ kind: 'Subject', title: s.name, ctx: 'Subject', blurb: '', words: '', href: BASE + 'index.html#/home/' + s.id }));
    PAGES.forEach(p => out.push({ kind: 'Page', title: p.title, ctx: 'Page', blurb: p.blurb, words: p.words, href: p.href }));
    return out;
  }
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  /* every word typed must be found; a title match beats a tag match beats a description match */
  function search(q) {
    const terms = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
    if (!terms.length) return [];
    const scored = [];
    searchIndex().forEach(it => {
      const t = norm(it.title), w = norm(it.words), b = norm(it.blurb), c = norm(it.ctx);
      let score = 0, ok = true;
      for (const term of terms) {
        if (t.startsWith(term) || t.includes(' ' + term)) score += 10;
        else if (t.includes(term)) score += 6;
        else if (w.includes(term) || c.includes(term)) score += 4;
        else if (b.includes(term)) score += 2;
        else { ok = false; break; }
      }
      if (ok) scored.push({ it, score: score + (it.kind === 'Module' ? 1 : 0) });
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.it);
  }

  /* ---------- build ---------- */
  let head = null, foot = null, openMenus = [];
  function crumbsFor(opts) {
    const list = [{ label: 'Home', href: HOME }];
    if (opts.module) {
      const m = REG().modules.find(x => x.id === opts.module);
      if (m) { const s = subjectOf(m.subject); list.push({ label: s.name, href: BASE + 'index.html#/home/' + s.id }, { label: m.title }); }
    } else if (opts.utility) list.push({ label: 'Utilities', href: PAGE('utilities') }, { label: opts.utility });
    else (opts.crumbs || []).forEach(c => list.push(c));
    if (list.length === 1) list[0] = { label: 'Home' };
    return list;
  }
  function kidChip() {
    const kid = SB.activeProfile(); if (!kid) return '';
    if (SB.isGuest(kid)) return `<button type="button" class="sbbtn kidpill" id="sbAddName" title="Add your name to keep your progress">${SB.avatar(kid)}<b>Guest</b><span class="hint lbl">Add a name</span></button>`;
    if (SB.profiles().length > 1) return `<a class="sbbtn kidpill" href="${PAGE('')}" title="Switch to someone else">${SB.avatar(kid)}<b>${esc(kid.name)}</b><span class="hint lbl">Switch</span></a>`;
    return `<span class="sbbtn kidpill">${SB.avatar(kid)}<b>${esc(kid.name)}</b></span>`;
  }
  function headHTML(opts) {
    const cr = crumbsFor(opts), last = cr.length - 1;
    return `<div class="sbhead-in">
      <a class="sbbrand" href="${HOME}" aria-label="Study Buddy, home">${ICON.home}<span>Study Buddy</span></a>
      <nav class="sbcrumbs" aria-label="Breadcrumb"><ol>${cr.map((c, i) => `<li>${i === last || !c.href ? `<span aria-current="page">${esc(c.label)}</span>` : `<a href="${esc(c.href)}">${esc(c.label)}</a>`}</li>`).join('')}</ol></nav>
      <div class="sbhead-r">
        <div class="sbsearch" id="sbSearch" role="search">
          <button type="button" class="sbbtn sbsearch-toggle" aria-label="Search" aria-expanded="false">${ICON.search}</button>
          <div class="sbsearch-box">${ICON.search}<input type="search" id="sbQ" placeholder="Search" aria-label="Search modules and tools" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sbResults" aria-autocomplete="list"></div>
          <ul class="sbresults" id="sbResults" role="listbox" tabindex="-1" aria-label="Search results" hidden></ul>
        </div>
        ${kidChip()}
        <a class="sbbtn" href="${PAGE('settings')}" aria-label="Settings">${ICON.gear}<span class="lbl">Settings</span></a>
        <div class="sbmenu"><button type="button" class="sbbtn" id="sbHelpBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sbHelpMenu" aria-label="Help menu">${ICON.help}<span class="lbl">Help</span></button>
          <ul class="sbmenu-list" id="sbHelpMenu" hidden><li><a href="${PAGE('help')}">Help</a></li><li><a href="${PAGE('faq')}">FAQ</a></li><li><a href="${PAGE('about')}">About</a></li></ul></div>
      </div></div>`;
  }
  function footHTML() {
    return `<div class="sbfoot-in"><nav aria-label="Footer"><a href="${HOME}">Home</a><a href="${HOME}">Subjects</a><a href="${PAGE('utilities')}">Utilities</a><a href="${PAGE('settings')}">Settings</a><a href="${PAGE('parent')}">Parent area</a><a href="${PAGE('help')}">Help</a><a href="${PAGE('faq')}">FAQ</a><a href="${PAGE('about')}">About</a></nav>
      <p>Progress is saved on this device only. Nothing goes online.</p></div>`;
  }

  function closeMenus() {
    const hb = document.getElementById('sbHelpBtn'), hm = document.getElementById('sbHelpMenu');
    if (hb && hm) { hm.hidden = true; hb.setAttribute('aria-expanded', 'false'); }
    const res = document.getElementById('sbResults'), q = document.getElementById('sbQ');
    if (res) { res.hidden = true; } if (q) q.setAttribute('aria-expanded', 'false');
  }
  function wire() {
    const hb = document.getElementById('sbHelpBtn'), hm = document.getElementById('sbHelpMenu');
    hb.onclick = e => { e.stopPropagation(); const open = hm.hidden; closeMenus(); hm.hidden = !open; hb.setAttribute('aria-expanded', String(open)); if (open) hm.querySelector('a').focus(); };
    hm.addEventListener('keydown', e => {
      const items = [...hm.querySelectorAll('a')], i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { closeMenus(); hb.focus(); }
    });
    const box = document.getElementById('sbSearch'), q = document.getElementById('sbQ'), res = document.getElementById('sbResults'), tg = box.querySelector('.sbsearch-toggle');
    let sel = -1, items = [];
    const paint = () => { [...res.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === sel))); q.setAttribute('aria-activedescendant', sel >= 0 ? 'sbr' + sel : ''); };
    const run = () => {
      items = search(q.value);
      if (!q.value.trim()) { res.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
      res.innerHTML = items.length ? items.map((it, i) => `<li role="option" id="sbr${i}" aria-selected="false"><a href="${esc(it.href)}" tabindex="-1"><b>${esc(it.kind === 'Tool' ? it.title + ' (' + it.ctx.replace(/^in /, '') + ')' : it.title)}</b><span>${esc(it.kind)} &middot; ${esc(it.ctx)}${it.blurb ? ' &middot; ' + esc(it.blurb.length > 70 ? it.blurb.slice(0, 68) + '...' : it.blurb) : ''}</span></a></li>`).join('') : '<li class="none" role="option">Nothing found. Try another word.</li>';
      sel = items.length ? 0 : -1; res.hidden = false; q.setAttribute('aria-expanded', 'true'); paint();
    };
    q.addEventListener('focus', () => { ensureRegistry().then(() => { if (q.value) run(); }); });
    q.addEventListener('input', () => ensureRegistry().then(run));
    q.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; paint(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = items[Math.max(sel, 0)]; if (it) { location.href = it.href; q.value = ''; closeMenus(); } }
      else if (e.key === 'Escape') { if (q.value) { q.value = ''; run(); } else { box.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); } }
    });
    res.addEventListener('click', () => { q.value = ''; closeMenus(); });
    box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) closeMenus(); });
    hm.parentNode.addEventListener('focusout', e => { if (!hm.parentNode.contains(e.relatedTarget)) closeMenus(); });
    tg.onclick = () => { const o = !box.classList.contains('open'); box.classList.toggle('open', o); tg.setAttribute('aria-expanded', String(o)); if (o) { q.focus(); } else { q.value = ''; closeMenus(); } };
    const an = document.getElementById('sbAddName');
    if (an) an.onclick = () => SB.nameDialog(() => { if (window.SB_SHELL_RELOAD) window.SB_SHELL_RELOAD(); else location.reload(); });
  }
  document.addEventListener('click', e => { if (head && !e.target.closest('.sbmenu,.sbsearch')) closeMenus(); });
  /* "/" jumps to the search box (unless you are typing somewhere) */
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !head || window.SB_NO_SLASH_SEARCH) return;   // the calculator needs / for divide
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
    if (document.querySelector('.sb-ov')) return;
    e.preventDefault(); const box = document.getElementById('sbSearch'), tg = box.querySelector('.sbsearch-toggle');
    if (getComputedStyle(tg).display !== 'none' && !box.classList.contains('open')) tg.click(); else document.getElementById('sbQ').focus();
  });

  /* tool screens size themselves from the window height minus this (see --chrome in sb.css) */
  function measure() {
    const h = Math.round((head ? head.offsetHeight : 0) + (foot ? foot.offsetHeight : 0));
    document.documentElement.style.setProperty('--chrome', h + 'px');
  }
  window.addEventListener('resize', () => { if (head) measure(); });
  window.addEventListener('load', () => { if (head) measure(); });
  try { document.fonts && document.fonts.ready.then(() => { if (head) measure(); }); } catch (e) {}
  function shell(opts = {}) {
    document.body.classList.add('sbshell');
    if (!head) {
      head = document.createElement('header'); head.className = 'sbhead'; head.id = 'sbHead';
      document.body.insertBefore(head, document.body.firstChild);
      foot = document.createElement('footer'); foot.className = 'sbfoot'; foot.id = 'sbFoot'; foot.innerHTML = footHTML();
      document.body.appendChild(foot);
    }
    head.innerHTML = headHTML(opts); wire();
    measure();
    return head;
  }
  SB.shell = shell;
  SB.searchSite = search;
})();
