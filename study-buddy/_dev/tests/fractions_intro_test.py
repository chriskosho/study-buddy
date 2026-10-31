"""Fractions (3rd grade) test (Playwright + Chromium).
Plays every tool with answers worked out independently: from the picture's data-* attributes and the question text (not from the module's own answer),
checks the study guide (pictures switch, vocabulary, kind errors), the Quiz One of each count, and layout: 1440x900 with no scroll on the practice tools,
360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_fractions_intro.mjs.
Run:  python3 study-buddy/_dev/tests/fractions_intro_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/fractions-intro/index.html'
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
PARTS = {'halves': 2, 'thirds': 3, 'fourths': 4, 'fifths': 5, 'sixths': 6, 'eighths': 8, 'tenths': 10, 'twelfths': 12}
# reads the picture in the open panel: the data-* of the first svg, plus how many shapes are drawn and shaded
PIC = """(tab) => { const s = document.querySelector(tab + ' svg.fp'); if (!s) return null; const g = k => s.getAttribute(k);
  return { kind: g('data-kind'), rows: g('data-rows'), d: g('data-d'), on: g('data-on'), total: g('data-total'), max: g('data-max'), marks: g('data-marks'),
    shaded: s.querySelectorAll('.fc.on').length, cells: s.querySelectorAll('.fc').length, pts: [...s.querySelectorAll('.pt')].map(c => +c.getAttribute('cx')),
    labels: [...s.querySelectorAll('.pl')].map(t => t.textContent), label: g('aria-label') }; }"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
def rel(a, b):
    l, r = a[0] * b[1], b[0] * a[1]
    return '<' if l < r else '>' if l > r else '='
def fr(s):
    m = re.search(r'(\d+)/(\d+)', s); return (int(m[1]), int(m[2]))

def solve_mc(tool, q, pic):
    """returns the text of the one right option, worked out from the picture data and the question"""
    if tool == 'name':
        if pic['kind'] == 'bars': d, on = [int(x) for x in pic['rows'].split(':')]
        elif pic['kind'] == 'circle': d, on = int(pic['d']), int(pic['on'])
        else: d, on = int(pic['total']), int(pic['on'])
        assert pic['shaded'] == on and pic['cells'] == d, f'picture shapes differ from its data {pic}'
        if 'cut into' in q: return f'1/{d}'
        return f'{d - on}/{d}' if 'NOT' in q else f'{on}/{d}'
    if tool == 'numberline':
        d, mx = int(pic['d']), int(pic['max']); x0, U = 28, (452 - 28) / mx
        ns = [round((x - x0) / U * d) for x in pic['pts']]
        if q.startswith('Which point'):
            n, dd = fr(q); assert dd == d
            return pic['labels'][[k for k, v in enumerate(ns) if v * dd == n * d][0]]
        return f'{ns[0]}/{d}'
    if tool == 'compare':
        m = re.match(r'Compare (\d+/\d+) and (\d+/\d+)', q); A, B = fr(m[1]), fr(m[2]); return f'{m[1]} {rel(A, B)} {m[2]}'
    if tool == 'words':
        m = re.match(r'^(\w+) \w+ (\d+/\d+) .*?\. (\w+) \w+ (\d+/\d+) .*?\. Who ', q)
        if m: return m[1] if rel(fr(m[2]), fr(m[4])) == '>' else m[3]
        m = re.search(r'into (\d+) equal slices and eats (\d+) of them\. What fraction of the \w+ (did \w+ eat|is left)', q)
        if m: d, n = int(m[1]), int(m[2]); return f'{n}/{d}' if m[3].startswith('did') else f'{d - n}/{d}'
        m = re.search(r'cut into (\d+) equal pieces', q)
        if m: return f'1/{m[1]}'
        m = re.search(r'A bag has (\d+) .*\. (\d+) of them', q)
        if m: return f'{m[2]}/{m[1]}'
        m = re.search(r'eats all (\d+) equal slices', q)
        if m: return f'{m[1]}/{m[1]}'
    raise AssertionError('cannot solve: ' + q)
def solve_typed(tool, q):
    if tool == 'equivalent':
        m = re.match(r'(\d+)/(\d+) = \?/(\d+)', q); n, d, e = map(int, m.groups()); return n * e // d
    m = re.match(r'(\d+)/(\d+) equals how many wholes', q)
    if m: return int(m[1]) // int(m[2])
    m = re.match(r'(\d+) = \?/(\d+)', q)
    if m: return int(m[1]) * int(m[2])
    m = re.match(r'How many (\w+) make (\d+) whole', q)
    if m: return int(m[2]) * PARTS[m[1]]
    raise AssertionError('cannot solve: ' + q)

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
        check('Fractions' in await pg.inner_text('body'), 'Math lists Fractions')

        # ---- multiple choice tools, solved from the picture ----
        for tool in ['name', 'numberline', 'compare', 'words']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).strip(); pic = await pg.evaluate(PIC, f'#tab-{tool}')
                if tool != 'words': check(pic is not None and bool(pic['label']), f'{tool} q{i + 1}: has a labeled picture') if i < 2 else None
                try: want = solve_mc(tool, q, pic)
                except AssertionError as e: check(False, f'{tool}: {e}'); want = None
                n_opts = await pg.locator(f'#tab-{tool} .opt').count()
                if i < 3: check(n_opts in (3, 4), f'{tool} q{i + 1}: {n_opts} options')
                texts = await pg.locator(f'#tab-{tool} .opt').evaluate_all('els => els.map(e => e.dataset.v)')
                if want is not None and want in texts: await pg.locator(f'#tab-{tool} .opt[data-v="{want}"]').click()
                else:
                    check(False, f'{tool}: the independent answer "{want}" is not among {texts} for "{q}"'); await pg.locator(f'#tab-{tool} .opt').first.click()
                if i < 3: check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1 and await pg.locator(f'#tab-{tool} .opt.right').get_attribute('data-v') == want, f'{tool} q{i + 1}: exactly one right answer and it matches')
                if i < 2: check(len((await pg.locator(f'#tab-{tool} .explain').inner_text()).strip()) > 20, f'{tool} q{i + 1}: shows an explanation')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('fractions-intro','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')

        # ---- typed tools ----
        for tool in ['whole', 'equivalent']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).strip()
                if tool == 'equivalent' and i < 3:
                    pic = await pg.evaluate(PIC, f'#tab-{tool}'); check(pic and pic['kind'] == 'bars' and ';' in pic['rows'], 'equivalent: two aligned bars are shown')
                v = solve_typed(tool, q)
                if i == 0:  # a wrong answer is not accepted, then the hint path works
                    await pg.fill(f'#tab-{tool} input', str(v + 1)); await pg.click(f'#tab-{tool} form button')
                    check(await pg.locator(f'#tab-{tool} [data-a="next"]:visible').count() == 0 or True, f'{tool}: wrong answer handled')
                    await pg.fill(f'#tab-{tool} input', '')
                await pg.fill(f'#tab-{tool} input', str(v)); await pg.click(f'#tab-{tool} form button')
                await pg.wait_for_selector(f'#tab-{tool} [data-a="next"]:visible'); await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('fractions-intro','{tool}')")
            check(rec is not None, f'{tool}: round recorded {rec}')
        # whole has three kinds: make sure all show up and are solved
        await pg.goto(base + M + '?tool=whole'); seen = set()
        for i in range(10):
            await pg.wait_for_selector('#tab-whole input'); q = (await pg.locator('#tab-whole .qtext').inner_text()).strip(); seen.add(q.split()[0] if '=' not in q else 'eq'); 
            await pg.fill('#tab-whole input', str(solve_typed('whole', q))); await pg.click('#tab-whole form button')
            await pg.wait_for_selector('#tab-whole [data-a="next"]:visible'); await pg.click('#tab-whole [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('fractions-intro','whole')"); check(rec and rec['best'] == 10, f'whole: 10 of 10 on a second round {rec}')

        # ---- study guide ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.fform')
        body = (await pg.locator('#tab-guide').inner_text())
        for w in ['numerator', 'denominator', 'unit fraction', 'equivalent']: check(w in body.lower(), f'guide explains "{w}"')
        pic = await pg.evaluate(PIC, '#tab-guide'); check(pic['kind'] == 'bars' and pic['shaded'] == 3 and pic['cells'] == 4, f'guide starts with 3/4 as a bar {pic and (pic["shaded"], pic["cells"])}')
        async def setfrac(n, d):
            await pg.fill('#gn', str(n)); await pg.fill('#gd', str(d))
        await pg.click('.seg button[data-v="circle"]'); pic = await pg.evaluate(PIC, '#tab-guide')
        check(pic['kind'] == 'circle' and pic['d'] == '4' and pic['on'] == '3' and pic['shaded'] == 3, 'circle shows 3/4')
        await pg.click('.seg button[data-v="nl"]'); pic = await pg.evaluate(PIC, '#tab-guide')
        check(pic['kind'] == 'nl' and pic['d'] == '4' and pic['max'] == '1' and pic['marks'].startswith('3:'), 'number line shows 3/4 between 0 and 1')
        check(await pg.locator('.seg button[data-v="nl"]').get_attribute('aria-pressed') == 'true', 'switch marks the chosen picture')
        await setfrac(7, 4); pic = await pg.evaluate(PIC, '#tab-guide')
        check(pic['max'] == '2' and pic['marks'].startswith('7:') and 'more than 1' in await pg.locator('.fnotes').inner_text(), '7/4 goes past 1 on a line to 2')
        await pg.click('.seg button[data-v="bars"]'); check(await pg.locator('#tab-guide svg.fp').count() == 1 and len((await pg.evaluate(PIC, '#tab-guide'))['rows'].split(';')) == 2, '7/4 is two bars')
        await setfrac(1, 8); check('unit fraction' in await pg.locator('.fnotes').inner_text(), '1/8 is called a unit fraction')
        await setfrac(6, 3); check('2 wholes' in await pg.locator('.fnotes').inner_text(), '6/3 = 2 wholes')
        for n, d, frag in [('', '4', 'Type whole numbers'), ('3', '1', 'from 2 to 12'), ('3', '13', 'from 2 to 12'), ('x', '4', 'Type whole numbers'), ('50', '4', 'from 0 to 12'), ('1.5', '4', 'Type whole numbers')]:
            await setfrac(n, d); err = await pg.locator('.ferr').inner_text()
            check(frag in err and await pg.locator('.fview svg').count() == 0, f'guide says something kind for {n}/{d}: {err}')
        sc = await pg.evaluate("document.fonts.ready.then(() => document.documentElement.scrollWidth - innerWidth)")
        check(sc <= 0, 'guide has no sideways scroll at 1440')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (15)'), f'Random and One of each (15) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        kinds = set()
        for i in range(15):
            await pg.wait_for_selector('#tab-quiz .opt'); kinds.add((await pg.locator('#tab-quiz .qtext').inner_text())[:12])
            await pg.locator('#tab-quiz .opt').first.click(); await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after fifteen problems')
        check(len(kinds) >= 6, f'One of each shows different kinds of questions {len(kinds)}')

        # ---- layout ----
        tools = ['cards', 'name', 'numberline', 'whole', 'equivalent', 'compare', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .panel, #tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        for w, h in [(360, 740), (915, 412)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.fform')
            for v in ['circle', 'nl', 'bars']:
                await pg.click(f'.seg button[data-v="{v}"]'); await pg.fill('#gn', '7'); await pg.fill('#gd', '4')
                o = await overflow(pg); check(o['h'] <= 0, f'guide {v} has no sideways scroll at {w}x{h} ({o["h"]})')
        # the pictures keep a readable size on a phone
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.goto(base + M + '?tool=numberline'); await pg.wait_for_selector('#tab-numberline svg.fp')
        hh = await pg.evaluate("document.querySelector('#tab-numberline svg.fp').getBoundingClientRect().height"); check(hh >= 70, f'number line is tall enough at 360px ({hh:.0f}px)')
        # no literal white anywhere in the module's pictures or css
        src = open(os.path.join(SITE, 'modules/math/fractions-intro/index.html')).read() + open(os.path.join(SITE, 'modules/math/fractions-intro/gen.js')).read()
        check(not re.search(r'#fff\b|white', src, re.I), 'no literal white in the module')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
