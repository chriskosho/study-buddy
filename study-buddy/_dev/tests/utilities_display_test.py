"""Utilities and display options test (Playwright + Chromium).
Calculator: order of operations, parentheses, decimals, remainders, divide by zero, negative numbers, keyboard,
history. Display: dark mode, OpenDyslexic, and larger text are saved per child and apply on every page.
Run:  python3 study-buddy/_dev/tests/utilities_display_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8770
CALC = 'utilities/calculator/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Eli',color:'#1b998b'}],active:'k1',pin:null}));"""

async def keys(pg, seq):
    for k in seq:
        await pg.click(f'.key[data-k="{k}"]')

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

        # ---- hub utilities tab ----
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        await pg.click('nav.tabs a.utab'); await pg.wait_for_selector('a.mod[href*="calculator"]')
        check('Calculator' in await pg.locator('a.mod').inner_text(), 'Utilities tab lists the calculator')
        await pg.click('a.mod[href*="calculator"]'); await pg.wait_for_selector('.key')

        # ---- calculator math (pure) ----
        cases = [('2+3×4', 14), ('(2+3)×4', 20), ('0.1+0.2', 0.3), ('100÷8', 12.5), ('−5+2', -3), ('2×(3+(4−1))', 12), ('6÷2×3', 9), ('10−4−3', 3)]
        for e, want in cases:
            got = await pg.evaluate("e => window.__calc.evaluate(e)", e)
            check(abs(got - want) < 1e-9, f'{e} = {want} (got {got})')
        err = await pg.evaluate("() => { try { window.__calc.evaluate('8÷0'); return 'no error'; } catch (e) { return e.message; } }")
        check('divide by 0' in err, f'divide by zero gives a friendly message: {err}')

        # ---- buttons ----
        await keys(pg, ['1', '7', '÷', '5', '='])
        check(await pg.locator('#result').inner_text() == '3.4' and await pg.locator('#rem').inner_text() == '3 R 2', 'buttons: 17 ÷ 5 = 3.4 with remainder 3 R 2')
        await keys(pg, ['AC', '5', '±', '+', '2', '='])
        check(await pg.locator('#result').inner_text() == '-3', 'plus/minus key makes a negative number')
        await keys(pg, ['AC', '1', '2', '3', '4', '5', '6', '7', '×', '1', '0', '0', '0', '='])
        check(await pg.locator('#result').inner_text() == '1,234,567,000', 'big answers get commas')
        await keys(pg, ['AC', '(', '2', '+', '='])
        check(await pg.locator('#result').inner_text() in ('Missing )', 'Not finished'), 'unfinished expressions get a message, not a crash')
        # ---- keyboard ----
        await pg.keyboard.press('Escape'); await pg.keyboard.type('(3+4)*2'); await pg.keyboard.press('Enter')
        check(await pg.locator('#result').inner_text() == '14', 'keyboard: (3+4)*2 Enter = 14')
        await pg.keyboard.press('Backspace')
        # ---- history ----
        check(await pg.locator('#hist button').count() >= 4, 'history keeps answers')
        await pg.click('#hist button >> nth=0'); await pg.keyboard.type('+1'); await pg.keyboard.press('Enter')
        check(await pg.locator('#result').inner_text() == '15', 'tapping history reuses the answer')
        o = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
        check(o['v'] <= 0 and o['h'] <= 0, f'calculator fits 1440x900 {o}')

        # ---- display options ----
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        check(not await pg.evaluate("document.documentElement.classList.contains('sb-dark')"), 'light theme by default')
        check(not await pg.evaluate("document.documentElement.classList.contains('sb-dyslexic')"), 'OpenDyslexic is off by default')
        await pg.click('#sbHead a[href$="#/settings"]'); await pg.wait_for_selector('.setpanel .seg')
        await pg.click('.seg button[data-k="theme"][data-v="dark"]')
        check(await pg.evaluate("document.documentElement.classList.contains('sb-dark')"), 'Dark applies right away')
        bg = await pg.evaluate("getComputedStyle(document.body).backgroundColor")
        check(bg == 'rgb(18, 26, 35)', f'dark page background {bg}')
        await pg.click('.seg button[data-k="font"][data-v="dyslexic"]')
        await pg.wait_for_timeout(400)
        fam = await pg.evaluate("getComputedStyle(document.body).fontFamily")
        check('OpenDyslexic' in fam, f'OpenDyslexic font applies: {fam[:40]}')
        loaded = await pg.evaluate("document.fonts.load('16px OpenDyslexic').then(f => f.length > 0 && document.fonts.check('16px OpenDyslexic'))")
        check(loaded, 'OpenDyslexic font file loads')
        await pg.click('.seg button[data-k="size"][data-v="large"]')
        check(await pg.evaluate("getComputedStyle(document.body).zoom") in ('1.15',), 'Larger text zooms the page')
        await pg.click('.seg button[data-k="size"][data-v="normal"]')
        # follows to every page, including South America and Handwriting
        for path in ['modules/geography/south-america/index.html?tool=cards', 'modules/english/parts-of-speech/index.html', 'modules/english/handwriting/index.html?tool=letters', CALC]:
            await pg.goto(base + path); await pg.wait_for_timeout(500)
            ok = await pg.evaluate("document.documentElement.classList.contains('sb-dark') && document.documentElement.classList.contains('sb-dyslexic')")
            check(ok, f'dark + OpenDyslexic carry over to {path.split("/")[-2] if "/" in path else path}')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=cards'); await pg.wait_for_timeout(400)
        fam = await pg.evaluate("getComputedStyle(document.body).fontFamily")
        check('OpenDyslexic' in fam, 'South America uses OpenDyslexic too')
        # per child
        await pg.evaluate("SB.setActive('k2')"); await pg.goto(base + 'index.html#/home'); await pg.wait_for_timeout(300)
        check(not await pg.evaluate("document.documentElement.classList.contains('sb-dark')"), 'another child keeps their own (light) settings')
        await pg.evaluate("SB.setActive('k1')")

        # ---- phone ----
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for path in [CALC, 'index.html#/utilities']:
            await pg.goto(base + path); await pg.wait_for_timeout(300)
            o = await pg.evaluate("({h: document.documentElement.scrollWidth - innerWidth})")
            check(o['h'] <= 0, f'phone {path}: no sideways scroll {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
