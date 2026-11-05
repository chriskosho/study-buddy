/* Checks books.js (the Textbooks map) against registry.js: every module and tool a lesson points at must exist, a lesson lists
   practice tools only (never a study guide or flashcards), chapters run in order, and a chapter's title matches its module.
   Run: node study-buddy/_dev/tests/gen_check_books.mjs */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const load = f => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(readFileSync(join(SITE, f), 'utf8'), ctx); return ctx.window; };
const REG = load('registry.js').SB_REGISTRY, BOOKS = load('books.js').BOOKS;
let fails = 0; const bad = m => { fails++; console.log('FAIL', m); };

if (!Array.isArray(BOOKS) || !BOOKS.length) bad('books.js has no books');
const ids = new Set();
for (const b of BOOKS || []) {
  if (ids.has(b.id)) bad('duplicate book id ' + b.id); ids.add(b.id);
  if (!b.title || !b.blurb) bad(b.id + ': needs a title and a blurb');
  if (b.link && !/^https:\/\//.test(b.link.url)) bad(b.id + ': the link must be https');
  let prev = 0, lessonCount = 0;
  for (const ch of b.chapters) {
    const at = b.id + ' chapter ' + ch.n;
    if (!(ch.n > prev)) bad(at + ': chapters must run in order (after ' + prev + ')'); prev = ch.n;
    if (!ch.module) { if (ch.lessons) bad(at + ': lessons need a module'); continue; }
    const m = REG.modules.find(x => x.id === ch.module);
    if (!m) { bad(at + ': no module "' + ch.module + '"'); continue; }
    if (m.archived) bad(at + ': module "' + ch.module + '" is archived');
    if (!ch.title) bad(at + ': needs a title');
    else if (!m.blurb.includes('chapter ' + ch.n)) bad(at + ': the module blurb does not say chapter ' + ch.n);
    if (!ch.lessons) continue;
    const t = id => m.tools.find(x => x.id === id);
    if (ch.guide && (!t(ch.guide) || t(ch.guide).kind !== 'study')) bad(at + ': guide "' + ch.guide + '" is not a study tool of ' + m.id);
    let lp = 0;
    for (const ls of ch.lessons) {
      const lat = at + ' lesson ' + ls.n; lessonCount++;
      if (!(ls.n > lp)) bad(lat + ': lessons must run in order'); lp = ls.n;
      if (!ls.title) bad(lat + ': needs a title');
      if (!ls.tools || !ls.tools.length) bad(lat + ': needs at least one tool');
      if (new Set(ls.tools).size !== (ls.tools || []).length) bad(lat + ': a tool is listed twice');
      for (const id of ls.tools || []) { const x = t(id); if (!x) bad(lat + ': no tool "' + id + '" in ' + m.id); else if (x.kind === 'study') bad(lat + ': "' + id + '" is a study tool, not practice'); }
      if (ls.skills && !ls.skills.every(s => typeof s === 'string' && s.trim())) bad(lat + ': skills must be text');
    }
  }
  console.log(b.id + ': ' + b.chapters.length + ' chapters, ' + lessonCount + ' lessons matched');
}
console.log(fails ? fails + ' book check(s) failed' : 'ALL PASSED (books ok)');
process.exit(fails ? 1 : 0);
