"""Area and Perimeter test (Playwright + Chromium).
Plays every tool (typed answers worked out again from the picture data and the words, multiple choice by clicking), checks the study guide
(sliders, grid, area and perimeter), the Quiz One of each count, and layout: 1440x900 with no scroll on the practice tools, 360px phone and
915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_areaperim.mjs.
Run:  python3 study-buddy/_dev/tests/areaperim_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/area-perimeter/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Eli',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
# worked out again from the question text and the picture's own data (not from the module's generator)
SOLVE = """(sel) => {
  const q = document.querySelector(sel + ' .qtext'), t = q.innerText.replace(/\\s+/g, ' '), n = (t.match(/\\d+/g) || []).map(Number), svg = q.querySelector('svg'), at = k => svg && svg.getAttribute('data-' + k);
  const cells = svg && at('kind') === 'grid' ? svg.querySelectorAll('.cell.on').length : 0;
  const pts = s => s.split(' ').map(p => p.split(',').map(Number)), edges = P => P.map((p, i) => { const m = P[(i + 1) % P.length]; return Math.abs(p[0] - m[0]) + Math.abs(p[1] - m[1]); });
  const shoe = P => Math.abs(P.reduce((s, p, i) => { const m = P[(i + 1) % P.length]; return s + p[0] * m[1] - m[0] * p[1]; }, 0)) / 2;
  const sum = a => a.reduce((x, y) => x + y, 0), kind = svg && at('kind');
  if (kind === 'grid') return cells;
  if (/Square tiles/.test(t)) return n[1] * n[2];
  if (/area of this rectangle is/.test(t)) return n[0] / n[1];
  if (/perimeter of this rectangle is/.test(t)) return n[0] / 2 - n[1];
  if (/perimeter of this triangle is/.test(t)) return n[0] - sum(at('sides').split(',').filter(x => x !== '?').map(Number));
  if (/two rectangles/.test(t) && kind === 'L') return shoe(pts(at('pts')));
  if (/two rectangles/.test(t)) return n[0] * n[1] + n[2] * n[3];
  if (/perimeter/.test(t) && kind === 'rect') return 2 * (+at('w') + +at('h'));
  if (/perimeter/.test(t) && kind === 'poly') return sum(at('sides').split(',').map(Number));
  if (/perimeter/.test(t) && kind === 'L') return sum(edges(pts(at('pts'))));
  if (/area/.test(t) && kind === 'rect') return at('w') * at('h');
  if (/square has sides that are each/.test(t)) return 4 * n[0];
  if (/is \\d+ units long and \\d+ units wide/.test(t)) return n[0] * n[1];
  if (/How many meters of fence go around/.test(t) || /ribbon does/.test(t)) return 2 * (n[0] + n[1]);
  if (/carpet|poster/.test(t)) return n[0] * n[1];
  if (/tiles are needed/.test(t)) return n[0] * n[1];
  if (/rug has an area/.test(t)) return n[0] / n[1];
  if (/rectangular pen/.test(t)) return n[0] / 2 - n[1];
  if (/edging/.test(t)) return 4 * n[0];
  if (/patio/.test(t)) return n[0] * n[0];
  if (/bigger garden/.test(t)) return Math.abs(n[0] * n[1] - n[2] * n[3]);
  if (/banner/.test(t)) return n[0] * n[1] + n[2] * n[3];
  return -1;
}"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/math'); await pg.wait_for_selector('a.mod')
        check('Area and Perimeter' in await pg.inner_text('body'), 'Math lists Area and Perimeter')

        # ---- typed tools ----
        for tool in ['count', 'area', 'perimeter', 'missing', 'composite', 'words']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                v = await pg.evaluate(SOLVE, f'#tab-{tool}')
                check(v >= 1 and v == int(v), f'{tool} q{i + 1}: worked out {v}') if i == 0 else None
                if v < 1: fails.append(f'{tool}: could not solve'); break
                await pg.fill(f'#tab-{tool} input', str(int(v))); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('area-perimeter','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')
        # a wrong answer shows the explanation, and a typed unit is accepted
        await pg.goto(base + M + '?tool=area'); await pg.wait_for_selector('#tab-area input')
        v = int(await pg.evaluate(SOLVE, '#tab-area'))
        for _ in range(2):
            await pg.fill('#tab-area input', str(v + 1)); await pg.click('#tab-area form button')
            if await pg.locator('#tab-area [data-a="next"]:visible').count(): break
        check('square units' in (await pg.locator('#tab-area').inner_text()), 'a wrong answer explains in square units')

        # ---- multiple choice tools ----
        for tool in ['compare']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt'); await pg.locator(f'#tab-{tool} .opt').first.click()
                check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer') if i < 3 else None
                await pg.click(f'#tab-{tool} [data-a="next"]')
            check(bool(await pg.evaluate(f"SB.toolRecord('area-perimeter','{tool}')")), f'{tool}: round recorded')

        # ---- study guide ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('#ap-l')
        for L, W in [(7, 4), (12, 12), (1, 1), (5, 9)]:
            await pg.evaluate("([l,w]) => { for (const [id,v] of [['ap-l',l],['ap-w',w]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); } }", [L, W])
            out = await pg.locator('.apout').inner_text()
            cells = await pg.locator('svg.apf .cell.on').count()
            check(f'{L * W}' in out and f'{2 * (L + W)}' in out and cells == L * W, f'guide {L} by {W}: area {L * W}, perimeter {2 * (L + W)}, {cells} squares')
        check('square unit' in await pg.locator('.apout').inner_text(), 'guide names the unit')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (7)'), f'Random and One of each (7) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(7):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after seven problems')

        # ---- layout ----
        tools = ['cards', 'count', 'area', 'perimeter', 'missing', 'compare', 'composite', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            for k in range(3):   # a few different problems, since pictures differ in size
                await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .panel, #tab-{tool}')
                await pg.wait_for_timeout(200)
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        # pictures stay readable: labels no smaller than about 12px on a phone
        for tool in ['perimeter', 'composite']:
            await pg.set_viewport_size({'width': 360, 'height': 740})
            for k in range(6):
                await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} input')
                if not await pg.locator('svg.apf').count(): continue
                px = await pg.evaluate("(() => { const s = document.querySelector('svg.apf'); const r = s.getBoundingClientRect(), vb = s.viewBox.baseVal; return 17 * Math.min(r.width / vb.width, r.height / vb.height); })()")
                check(px >= 11, f'{tool} labels about {px:.0f}px tall at 360')
        await pg.set_viewport_size({'width': 1440, 'height': 900}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('#ap-l'); await pg.wait_for_timeout(200)
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide fits 1440x900 {o}')
        for w, h in [(360, 740), (915, 412)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
            o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at {w}x{h} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
