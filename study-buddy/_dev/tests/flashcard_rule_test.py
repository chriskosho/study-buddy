"""Flashcard rule test (Playwright + Chromium).
Rule: every answer on a Full quiz appears on a flashcard (either direction counts). Modules in COVERED must pass;
the others only print their gaps (run with --report to see them). Move a module into COVERED when its cards are complete.
Run:  python3 study-buddy/_dev/tests/flashcard_rule_test.py [--report]"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),200)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""


MODS = ['history/punic-wars', 'history/ancient-rome', 'science/weather', 'science/newton-laws', 'science/planets', 'science/periodic-table',
        'english/black-beauty', 'english/black-beauty-guide', 'english/phonograms', 'geography/us-states', 'geography/europe', 'geography/africa', 'geography/asia', 'geography/north-america', 'geography/oceania', 'geography/world', 'geography/oceans']
COVERED = ['history/punic-wars', 'history/ancient-rome', 'science/weather', 'science/newton-laws', 'science/planets', 'science/periodic-table', 'english/black-beauty', 'english/black-beauty-guide', 'english/phonograms', 'geography/us-states', 'geography/europe', 'geography/africa', 'geography/asia', 'geography/north-america', 'geography/oceania', 'geography/world', 'geography/oceans']
REPORT = '--report' in sys.argv
GATHER = """async (kind) => {
  const strip = h => { const d = document.createElement('div'); d.innerHTML = String(h || '').replace(/<\/(div|p|span|b)>/g, '$& '); d.querySelectorAll('svg').forEach(s => { s.replaceWith(' ' + (s.getAttribute('aria-label') || '') + ' ' + (s.textContent || '') + ' '); }); return d.textContent.replace(/\s+/g, ' '); };
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9\u00c0-\uffff]+/g, ' ').trim();
  let quizOpt = null, cardsOpt = null;
  const oq = SBT.quiz, of = SBT.flashcards;
  SBT.quiz = (c, o) => { quizOpt = o; };
  SBT.flashcards = (c, o) => { cardsOpt = o; };
  const tab = id => { document.querySelector('nav.tabs button[data-tab="' + id + '"]').click(); };
  const topics = () => [...document.querySelectorAll('#tab-quiz .us-topics button, #tab-quiz .eu-topics button, #tab-quiz .af-topics button, #tab-quiz .as-topics button, #tab-quiz .na-topics button, #tab-quiz .oc-topics button, #tab-quiz .wd-topics button, #tab-quiz .oce-topics button')];
  const qs = [], text = [];
  tab('quiz');
  if (kind) { for (const b of topics()) { if (b.dataset.t === 'mixed') continue; quizOpt = null; b.click(); if (quizOpt && quizOpt.full) quizOpt.full().forEach(q => qs.push(q)); } }
  else if (quizOpt && quizOpt.full) quizOpt.full().forEach(q => qs.push(q));
  tab('cards');
  if (cardsOpt) {
    const ms = cardsOpt.modes || [{ id: 'main' }];
    for (const m of ms) for (let k = 0; k < 6; k++) cardsOpt.build(m.id).forEach(c => text.push(norm(strip(c.front) + ' ' + strip(c.back))));
  }
  const all = ' ' + [...new Set(text)].join(' | ') + ' ';
  const miss = qs.filter(q => { const a = norm(strip(q.a)); if (!a) return false; return !(' ' + all + ' ').includes(' ' + a + ' '); }).map(q => strip(q.q).slice(0, 60) + ' -> ' + strip(q.a).slice(0, 50));
  return { n: qs.length, cards: text.length, miss };
}"""

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        for m in MODS:
            await pg.goto(base + f'modules/{m}/index.html'); await pg.wait_for_selector('nav.tabs')
            r = await pg.evaluate(GATHER, 'us' if m.endswith('us-states') else 'eu' if m.split('/')[1] in ('europe', 'africa', 'asia', 'north-america', 'oceania', 'world', 'oceans') else '')
            if REPORT or m in COVERED:
                print(f"{m}: {r['n']} Full questions, {r['cards']} card builds, {len(r['miss'])} without a flashcard")
                for x in r["miss"][:80]: print('    ' + x)
            if m in COVERED:
                check(r['n'] > 0 and not r['miss'], f"{m}: every Full answer has a flashcard ({len(r['miss'])} missing)")
        await b.close()
    check(not errors, 'no page errors ' + str(errors[:3]))
    print('\nFAILED: ' + str(len(fails)) if fails else '\nALL PASSED')
    sys.exit(1 if fails else 0)
asyncio.run(main())
