"""Footer "Get latest version" test (Playwright + Chromium): the button is in the footer of the hub, a module page, and a utility page;
pressing it clears the saved offline copies and reloads; with no internet it changes nothing, says so, and can be pressed again.
Run:  python3 study-buddy/_dev/tests/footer_refresh_test.py"""
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

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, url in [('hub', 'index.html'), ('a module', 'modules/geography/oceans/index.html'), ('a utility', 'index.html#/utilities')]:
            c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
            pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(BASE + url); await pg.wait_for_selector('#sbFootRefresh')
            check(await pg.locator('#sbFoot button#sbFootRefresh:has-text("Get latest version")').count() == 1, f'{name}: the footer has Get latest version')
            h = await pg.evaluate("document.querySelector('#sbFoot').getBoundingClientRect().height")
            check(h < 50, f'{name}: the footer still fits on one line at 1440px ({h:.0f}px)')
            await c.close()
        # pressing it: a saved offline copy is removed and the page reloads
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(BASE + 'modules/geography/oceans/index.html'); await pg.wait_for_selector('#sbFootRefresh')
        await pg.evaluate("caches.open('study-buddy-0123456789').then(c => c.put('x', new Response('old')))")
        await pg.evaluate("window.__marker = 'before'")
        async with pg.expect_navigation(timeout=8000):
            await pg.click('#sbFootRefresh')
        await pg.wait_for_selector('#sbFootRefresh')
        left = await pg.evaluate("caches.keys().then(k => k.filter(x => x.startsWith('study-buddy-')))")
        check(left == [] and await pg.evaluate("window.__marker") is None, f'pressing it clears the saved copy and reloads the page {left}')
        # no internet: nothing changes, it says so, and the button works again
        await pg.evaluate("caches.open('study-buddy-0123456789').then(c => c.put('x', new Response('old')))")
        await c.set_offline(True)
        await pg.click('#sbFootRefresh'); await pg.wait_for_timeout(600)
        msg = await pg.inner_text('#sbFootMsg')
        left = await pg.evaluate("caches.keys().then(k => k.filter(x => x.startsWith('study-buddy-')))")
        check('No internet' in msg and left == ['study-buddy-0123456789'], f'with no internet it changes nothing and says so ({msg[:50]!r})')
        check(await pg.is_enabled('#sbFootRefresh'), 'the button can be pressed again')
        await c.close()
        # Settings still has its own button, using the same routine
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        pg = await c.new_page(); await pg.goto(BASE + 'index.html#/settings'); await pg.wait_for_selector('#refreshLatest')
        await c.set_offline(True); await pg.click('#refreshLatest'); await pg.wait_for_timeout(400)
        check('No internet' in await pg.inner_text('#refreshHint') and await pg.is_enabled('#refreshLatest'), 'Settings: the Refresh button still works the same way')
        await c.close()
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
