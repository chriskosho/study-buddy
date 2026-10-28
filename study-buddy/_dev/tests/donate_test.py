"""The Support Study Buddy link: in the footer and on the About page, a plain outbound link, nothing loaded from PayPal,
and the footer still fits (no wrap at 1440x900, no sideways scroll at 360px).
Run:  python3 study-buddy/_dev/tests/donate_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/'
URL = 'https://www.paypal.me/chriskosho'
fails, errors, outside = [], [], []
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
        pg.on('request', lambda r: outside.append(r.url) if not r.url.startswith(BASE) and not r.url.startswith('data:') else None)
        for name, url in (('home', 'index.html#/home'), ('a module page', 'modules/math/volume/index.html'), ('About', 'index.html#/about')):
            await pg.goto(BASE + url); await pg.wait_for_selector('#sbFoot a')
            a = pg.locator('#sbFoot a:has-text("Support Study Buddy")')
            check(await a.count() == 1 and await a.get_attribute('href') == URL, f'{name}: the footer has the Support link to PayPal')
            check(await a.get_attribute('target') == '_blank' and 'noopener' in await a.get_attribute('rel') and 'noreferrer' in await a.get_attribute('rel'), f'{name}: it opens a new tab safely')
            check('PayPal' in await a.get_attribute('aria-label') and 'new tab' in await a.get_attribute('aria-label'), f'{name}: its label says where it goes')
            fh = await pg.evaluate("document.querySelector('#sbFoot').getBoundingClientRect().height")
            check(fh < 50, f'{name}: the footer stays one line at 1440px wide ({fh:.0f}px)')
        await pg.wait_for_selector('.infopanel')
        ab = pg.locator('.infopanel a[href="' + URL + '"]')
        check(await ab.count() == 1 and 'not tax-deductible' in await pg.inner_text('.infopanel') and 'nothing is locked' in (await pg.inner_text('.infopanel')).lower(), 'the About page has a Support section that says it is a gift and nothing is locked')
        check(await ab.get_attribute('target') == '_blank' and 'noopener' in await ab.get_attribute('rel'), 'its link opens a new tab safely')
        check(not any('paypal' in u for u in outside), f'no request to PayPal is made by loading pages ({outside[:3]})')
        for w, h, extra in ((360, 740, ''), (360, 740, "SB.setSetting('size','large'); SB.setSetting('font','dyslexic'); SB.applyDisplay();")):
            px = await ctx.new_page(); await px.set_viewport_size({'width': w, 'height': h}); await px.goto(BASE + 'index.html#/about'); await px.wait_for_selector('#sbFoot a')
            if extra: await px.evaluate(extra); await px.wait_for_timeout(200)
            sw = await px.evaluate("[document.documentElement.scrollWidth - innerWidth, document.querySelector('#sbFoot').scrollWidth - document.querySelector('#sbFoot').clientWidth]")
            check(sw[0] <= 0 and sw[1] <= 0, f'footer and About fit at 360px{" with larger text and dyslexic" if extra else ""} {sw}')
            await px.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
