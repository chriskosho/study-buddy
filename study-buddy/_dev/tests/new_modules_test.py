"""Place Value and Zeros, The Planets, The Periodic Table, and Black Beauty test (Playwright + Chromium).
Plays the tools with correct answers (worked out from the question or looked up from data.js), checks scores reach
the hub, checks Explain it grading, and checks layout: 1440x900 with no scroll on every tool, 360px phone with no
sideways scroll. The math generators themselves are checked in bulk by math_gen_check.mjs.
Run:  python3 study-buddy/_dev/tests/new_modules_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from decimal import Decimal
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8771
MODS = {
    'place-value': ('modules/math/place-value/index.html', ['guide', 'place', 'decimals', 'multiply', 'divide', 'powers']),
    'planets': ('modules/science/planets/index.html', ['guide', 'cards', 'order', 'sort', 'quiz', 'compare', 'riddle']),
    'periodic-table': ('modules/science/periodic-table/index.html', ['guide', 'cards', 'quiz', 'sort', 'find', 'symbols']),
    'black-beauty': ('modules/english/black-beauty/index.html', ['guide', 'cards', 'quiz', 'sort', 'order', 'explain']),
}
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
async def record(pg, mod, tool):
    return await pg.evaluate(f"SB.toolRecord('{mod}','{tool}')")

def solve_math(q):
    """Work out a math answer from the question text, e.g. '9,000 × 6,000 = ?' or '3.25 ÷ 100 = ?'."""
    m = re.match(r'([\d,.]+) ([×÷]) ([\d,.]+) = \?', q.strip())
    a, op, b = Decimal(m.group(1).replace(',', '')), m.group(2), Decimal(m.group(3).replace(',', ''))
    r = a * b if op == '×' else a / b
    return format(r.normalize(), 'f')

async def answer_round(pg, tab, solve):
    for i in range(10):
        await pg.wait_for_selector(f'#tab-{tab} input')
        q = await pg.locator(f'#tab-{tab} .qtext').inner_text()
        await pg.fill(f'#tab-{tab} input', solve(q, i)); await pg.click(f'#tab-{tab} form button')
        await pg.click(f'#tab-{tab} [data-a="next"]')

async def sort_all(pg, tab, sets):
    for s in sets:
        await pg.click(f'#tab-{tab} .seg button[data-s="{s}"]')
        while await pg.locator(f'#tab-{tab} .sortTray .chip').count():
            c = pg.locator(f'#tab-{tab} .sortTray .chip').first; bk = await c.get_attribute('data-b')
            await c.click(); await pg.click(f'#tab-{tab} .bucket[data-b="{bk}"]')
        check('Perfect' in await pg.locator(f'#tab-{tab} .msg').inner_text(), f'{tab} set {s} sorts perfectly')

async def order_by(pg, tab, rank_js):
    """Put the order list right using only the arrow buttons. rank_js maps an item's text to its place."""
    n = await pg.locator(f'#tab-{tab} .oitem').count()
    for pos in range(n):
        texts = [await t.inner_text() for t in await pg.locator(f'#tab-{tab} .oitem .otext b').all()]
        ranks = await pg.evaluate(rank_js, texts)
        j = min(range(pos, n), key=lambda k: ranks[k])
        for _ in range(j - pos):
            await pg.click(f'#tab-{tab} .oitem[data-i="{j}"] [data-mv="-1"]'); j -= 1
    await pg.click(f'#tab-{tab} [data-a="check"]')
    return n

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

        # ---- hub ----
        for subj, title in [('math', 'Place Value'), ('science', 'The Planets'), ('science', 'The Periodic Table'), ('english', 'Black Beauty')]:
            await pg.goto(base + 'index.html#/home/' + subj); await pg.wait_for_selector('a.mod')
            check(title in await pg.inner_text('main') if await pg.locator('main').count() else title in await pg.inner_text('body'), f'{subj} lists {title}')

        # ---- Place Value: typed answers worked out from each question ----
        M = MODS['place-value'][0]
        for tool in ['multiply', 'divide', 'powers']:
            await pg.goto(base + M + '?tool=' + tool)
            await answer_round(pg, tool, lambda q, i: (f'{int(Decimal(solve_math(q))):,}' if i == 0 and '.' not in solve_math(q) else solve_math(q)))
            rec = await record(pg, 'place-value', tool)
            check(rec and rec['best'] == 10, f'place value {tool}: 10 of 10, commas allowed {rec}')
        for tool in ['place', 'decimals']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt'); await pg.locator(f'#tab-{tool} .opt').first.click()
                check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer') if i < 3 else None
                await pg.click(f'#tab-{tool} [data-a="next"]')
            check(bool(await record(pg, 'place-value', tool)), f'place value {tool}: round recorded')

        # ---- Planets ----
        M = MODS['planets'][0]
        await pg.goto(base + M + '?tool=order'); await pg.wait_for_selector('#tab-order .oitem')
        n = await order_by(pg, 'order', "t => t.map(x => PLANETS.findIndex(p => p.name === x))")
        rec = await record(pg, 'planets', 'order')
        check(rec and rec['best'] == n == 8, f'planets in order from the Sun: {rec}')
        await pg.goto(base + M + '?tool=sort'); await pg.wait_for_selector('#tab-sort .chip')
        sets = await pg.eval_on_selector_all('#tab-sort .seg button', 'bs => bs.map(b => b.dataset.s)')
        await sort_all(pg, 'sort', sets)

        # ---- Periodic Table ----
        M = MODS['periodic-table'][0]
        await pg.goto(base + M + '?tool=symbols')
        async def sym(q, i):
            name = re.search(r'symbol for (.+)\?', q).group(1)
            return await pg.evaluate("n => ELEMENTS.find(e => e.name === n).sym", name)
        for i in range(10):
            await pg.wait_for_selector('#tab-symbols input')
            q = await pg.locator('#tab-symbols .qtext').inner_text()
            await pg.fill('#tab-symbols input', await sym(q, i)); await pg.click('#tab-symbols form button')
            await pg.click('#tab-symbols [data-a="next"]')
        rec = await record(pg, 'periodic-table', 'symbols')
        check(rec and rec['best'] == 10, f'periodic table symbols: 10 of 10 {rec}')
        await pg.goto(base + M + '?tool=sort'); await pg.wait_for_selector('#tab-sort .chip')
        await sort_all(pg, 'sort', ['metal', 'state'])
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.el')
        check(await pg.locator('.el:not(.ph)').count() == 118, 'periodic table shows 118 elements')

        # ---- Black Beauty ----
        M = MODS['black-beauty'][0]
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        for g in ['book', 'horses', 'people', 'homes', 'ideas', 'words']:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(60)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'black beauty guide {g} fits 1440x900 {o}')
        await pg.click('.gtabs button[data-g="homes"]')
        check(await pg.locator('.homes li').count() == await pg.evaluate('HOMES.length'), 'homes timeline shows every home')

        await pg.click('nav.tabs button[data-tab="cards"]')
        n = await pg.evaluate('HORSES.length + PEOPLE.length')
        for i in range(n):
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(30)
        rec = await record(pg, 'black-beauty', 'cards')
        check(rec and rec['best'] == n, f'character flashcards: deck of {n} {rec}')

        await pg.click('nav.tabs button[data-tab="quiz"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt')
            q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (QUIZ.find(x => x.q === q) || {}).a", q)
            await pg.locator('#tab-quiz .opt').filter(has_text=ans).first.click() if ans else check(False, f'quiz question in data: {q}')
            await pg.click('#tab-quiz [data-a="next"]')
        rec = await record(pg, 'black-beauty', 'quiz')
        check(rec and rec['best'] == 10, f'black beauty quiz 10 of 10 {rec}')

        await pg.click('nav.tabs button[data-tab="sort"]')
        await sort_all(pg, 'sort', ['home', 'kind', 'who'])

        await pg.click('nav.tabs button[data-tab="order"]'); await pg.wait_for_selector('#tab-order .oitem')
        n = await order_by(pg, 'order', "t => t.map(x => EVENTS.findIndex(e => e.text === x))")
        rec = await record(pg, 'black-beauty', 'order')
        check(rec and rec['best'] == n, f'black beauty events in order on the first check {rec}')
        check('right place' not in await pg.locator('#tab-order .msg').inner_text(), 'order check reports success')

        await pg.click('nav.tabs button[data-tab="explain"]')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'it was about a horse and stuff happened')
                await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'weak answer is not accepted')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer passes: {q[:40]}')
            await pg.click('#tab-explain [data-a="next"]')
        rec = await record(pg, 'black-beauty', 'explain')
        check(rec and rec['best'] == 4, f'explain counts first checks only (4 of 5) {rec}')
        all_ok = await pg.evaluate("""() => EXPLAIN.every(x => SBT.gradeExplain(x.model, x).perfect)""")
        check(all_ok, 'every Black Beauty model answer passes its own check')

        await pg.goto(base + 'index.html#/module/black-beauty'); await pg.wait_for_selector('.tool')
        m = await pg.locator('.tool.mastered').count()
        check(m == 5, f'hub shows the 5 scored Black Beauty tools mastered -> {m}')

        # ---- layout: every tool of every new module ----
        for mod, (path, tools) in MODS.items():
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            for t in tools:
                await pg.goto(base + path + '?tool=' + t); await pg.wait_for_timeout(250)
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{mod} {t}: no scroll at 1440x900 {o}')
            await pg.set_viewport_size({'width': 360, 'height': 780})
            for t in tools:
                await pg.goto(base + path + '?tool=' + t); await pg.wait_for_timeout(250)
                o = await overflow(pg); check(o['h'] <= 0, f'{mod} {t}: no sideways scroll on phone {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
