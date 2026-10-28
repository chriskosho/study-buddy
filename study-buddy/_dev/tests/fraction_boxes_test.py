"""Stacked fraction answer boxes (whole number, top over a line over bottom): digits only, partial entries get a hint,
Enter submits, mixed numbers and plain fractions are judged, fractions in explanations are drawn stacked, the calculators use
the same boxes, and everything fits at 360px.
Run:  python3 study-buddy/_dev/tests/fraction_boxes_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(BASE + 'modules/math/fractions-add-sub/index.html?tool=improper'); await pg.wait_for_selector('#tab-improper .fbox')
        T = '#tab-improper '
        check(await pg.locator(T + 'form .fbox input').count() == 3 and await pg.locator(T + 'form input[aria-label="Your answer"]').count() == 0, 'the answer is three boxes, not one text box')
        check(await pg.locator(T + '.fbox .fline').count() == 1, 'a line sits between the top and bottom boxes')
        labels = await pg.locator(T + '.fbox input').evaluate_all('els => els.map(e => e.getAttribute("aria-label"))')
        check(all('whole' in labels[0] and 'top' in labels[1] and 'bottom' in labels[2] for _ in [0]), f'each box has a clear label {labels}')
        await pg.fill(T + '.fx-n', '3x.'); check(await pg.input_value(T + '.fx-n') == '3', 'only digits can be typed (no slash, letters or decimal point)')
        pos = await pg.evaluate("[...document.querySelectorAll('#tab-improper .fbox input')].map(e => e.getBoundingClientRect()).map(r => [Math.round(r.left), Math.round(r.top)])")
        check(pos[0][0] < pos[1][0] and pos[1][1] < pos[2][1] and abs(pos[1][0] - pos[2][0]) <= 1, f'whole box on the left, top above bottom {pos}')
        # partial entry gets a hint, not a try
        await pg.fill(T + '.fx-d', ''); await pg.click(T + 'form button.btn')
        check('both the top number and the bottom' in await pg.inner_text(T + '.err') and 'bad' in (await pg.get_attribute(T + '.fbox', 'class')), 'a top number without a bottom number gets a hint')
        check(await pg.evaluate("document.querySelector('#tab-improper .roundbar .hint').textContent.includes('Score 0')"), 'and it does not count as a try')
        await pg.fill(T + '.fx-n', ''); await pg.click(T + 'form button.btn')
        check('Fill in the boxes' in await pg.inner_text(T + '.err'), 'empty boxes get a hint')
        # the right answer in boxes; Enter submits
        q = await pg.evaluate("document.querySelector('#tab-improper .qtext').innerText")
        ans = None
        for _ in range(1): pass
        right = await pg.evaluate("""() => { const q = document.querySelector('#tab-improper .qtext'); const f = [...q.querySelectorAll('.frac')];
            const mixed = q.querySelector('.mixed'); return { mixed: !!mixed, w: mixed ? mixed.querySelector('b').textContent : '', n: f[0] && f[0].querySelector('.fn').textContent, d: f[0] && f[0].querySelector('.fd').textContent, text: q.innerText }; }""")
        n, d = int(right['n']), int(right['d']); w = int(right['w'] or 0)
        total = w * d + n
        from math import gcd
        if 'mixed' in right['text'].lower() and not right['mixed']:      # improper -> mixed
            fw, fn, fd = total // d, total % d, d; g = gcd(fn, fd) or 1; fn, fd = fn // g, fd // g
            await pg.fill(T + '.fx-w', str(fw)); await pg.fill(T + '.fx-n', str(fn) if fn else ''); await pg.fill(T + '.fx-d', str(fd) if fn else '')
        else:                                                             # mixed -> improper
            g = gcd(total, d); await pg.fill(T + '.fx-w', ''); await pg.fill(T + '.fx-n', str(total // g)); await pg.fill(T + '.fx-d', str(d // g))
        await pg.press(T + '.fx-d', 'Enter'); await pg.wait_for_timeout(100)
        err = await pg.inner_text(T + '.err')
        check(err.startswith('Correct') or 'Now write it' in err or 'simplest' in err, f'Enter in a box checks the answer ({err[:60]!r})')
        # a miss: the explanation draws fractions stacked, and the answer shown is stacked too
        await pg.goto(BASE + 'modules/math/fractions-add-sub/index.html?tool=unlike'); await pg.wait_for_selector('#tab-unlike .fbox')
        for _ in range(2):
            await pg.fill('#tab-unlike .fx-w', '99'); await pg.fill('#tab-unlike .fx-n', '98'); await pg.fill('#tab-unlike .fx-d', '97'); await pg.click('#tab-unlike form button.btn'); await pg.wait_for_timeout(80)
        check(await pg.locator('#tab-unlike .err .frac, #tab-unlike .err .mixed').count() >= 1, 'the answer shown after a miss is drawn stacked')
        for _ in range(12):
            if await pg.locator('#tab-unlike .stepbtn').count(): await pg.click('#tab-unlike .stepbtn')
        check(await pg.locator('#tab-unlike .why .frac').count() >= 1 and not await pg.evaluate("/\\d\\/\\d/.test(document.querySelector('#tab-unlike .why').innerText)"), 'the explanation draws its fractions stacked, with no slash')
        check(all(await pg.locator('#tab-unlike .fbox input').evaluate_all('els => els.map(e => e.disabled)')), 'the boxes lock after the answer')
        # a long number gets a wider box
        await pg.goto(BASE + 'modules/math/volume/index.html?tool=stacks'); await pg.wait_for_selector('#tab-stacks .fbox')
        await pg.fill('#tab-stacks .fx-w', '123456'); await pg.dispatch_event('#tab-stacks .fx-w', 'input')
        wd = await pg.evaluate("document.querySelector('#tab-stacks .fx-w').getBoundingClientRect().width")
        check(wd > 100 and await pg.input_value('#tab-stacks .fx-w') == '123456', f'a long whole number fits in its box ({wd:.0f}px)')
        # calculators use the same boxes
        for mod in ('fractions-add-sub', 'fractions-divide', 'fractions-multiply', 'measurement'):
            await pg.goto(BASE + f'modules/math/{mod}/index.html?tool=guide'); await pg.wait_for_selector('#tab-guide .fgform .fbox')
            check(await pg.locator('#tab-guide .fgform .fbox').count() >= 2 and await pg.locator('#tab-guide .fgform .textin').count() == 0, f'{mod}: the calculator uses the boxes')
        # phones: no sideways scroll, boxes visible
        for mod, tool in (('fractions-add-sub', 'mixedadd'), ('fractions-add-sub', 'guide'), ('measurement', 'guide'), ('volume', 'stacks')):
            for extra in ('', "SB.setSetting('size','large'); SB.setSetting('font','dyslexic'); SB.applyDisplay();"):
                px = await ctx.new_page(); await px.set_viewport_size({'width': 360, 'height': 740}); await px.goto(BASE + f'modules/math/{mod}/index.html?tool={tool}'); await px.wait_for_selector(f'#tab-{tool} .fbox')
                if extra: await px.evaluate(extra); await px.wait_for_timeout(150)
                sw = await px.evaluate("document.documentElement.scrollWidth - innerWidth")
                off = await px.evaluate(f"[...document.querySelectorAll('#tab-{tool} .fbox')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length")
                check(sw <= 0 and off == 0, f'{mod}/{tool} at 360px{" with larger text and dyslexic" if extra else ""} fits (sideways {sw}, off-screen {off})')
                await px.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)

asyncio.run(main())
