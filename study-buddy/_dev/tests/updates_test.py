"""Automatic updates test (Playwright + Chromium, with a real service worker): when a new version of the site appears,
an open page picks it up, reloads at a safe moment (hub pages when idle; tool pages only when the app goes into the
background; never while a box is open or someone is typing), and shows one message saying Study Buddy was updated and
updates itself. The very first visit shows no message.
Run:  python3 study-buddy/_dev/tests/updates_test.py"""
import asyncio, http.server, threading, functools, os, re, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
STATE = {'v': 'v1test'}
fails = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path.split('?')[0].endswith('/sw.js'):      # the same service worker, reporting whichever version the test says is live
            body = re.sub(r"const VERSION = '[0-9a-zA-Z]+'", f"const VERSION = '{STATE['v']}'", open(os.path.join(SITE, 'sw.js')).read()).encode()
            self.send_response(200); self.send_header('Content-Type', 'text/javascript'); self.send_header('Content-Length', str(len(body))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body); return
        super().do_GET()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
SEED = """if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');if(!localStorage.getItem('studybuddy.v1.root'))localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));}"""
POKE = "navigator.serviceWorker.getRegistration().then(r => r.update())"

async def controlled(pg):
    await pg.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller", timeout=15000)

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        c = await b.new_context(viewport={'width': 1440, 'height': 900}); await c.add_init_script(SEED)
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))

        # ---- first visit: installing is not an update, so no message ----
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod'); await controlled(pg); await pg.wait_for_timeout(5000)
        check(await pg.locator('.sb-dlg').count() == 0 and await pg.evaluate("localStorage.getItem('sb-update-to')") is None, 'the first visit shows no update message and records no update')
        c0 = await b.new_context(viewport={'width': 1440, 'height': 900})                            # a brand new device: no profile yet
        p0 = await c0.new_page(); await p0.goto(base + 'index.html#/home'); await controlled(p0); await p0.wait_for_timeout(5000)
        check(await p0.locator('.sb-dlg:has-text("up to date")').count() == 0, 'a brand new device shows no update message either')
        await c0.close()

        # ---- a new version while a hub page is open and idle: reloads by itself, then says so ----
        await pg.evaluate("window.__marker = 1"); STATE['v'] = 'v2test'; await pg.evaluate(POKE)
        await pg.wait_for_selector('.sb-dlg', timeout=20000)
        txt = await pg.locator('.sb-dlg').inner_text()
        check(await pg.evaluate("window.__marker") is None, 'the hub page reloaded by itself')
        check('up to date' in txt and 'updated to the latest version' in txt and 'updates itself whenever a new version is available' in txt, 'the message says Study Buddy was updated and updates itself')
        await pg.click('.sb-dlg [data-x="ok"]'); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_selector('a.mod'); await pg.wait_for_timeout(1500)
        check(await pg.locator('.sb-dlg').count() == 0, 'the message shows once for each update')

        # ---- someone typing or a box open: wait ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow .nm'); await controlled(pg)
        await pg.focus('.kidrow .nm'); await pg.evaluate("window.__marker = 1"); STATE['v'] = 'v3test'; await pg.evaluate(POKE); await pg.wait_for_timeout(4500)
        check(await pg.evaluate("window.__marker") == 1 and await pg.locator('.sb-dlg').count() == 0, 'it waits while someone is typing')
        await pg.evaluate("document.activeElement.blur()"); await pg.wait_for_selector('.sb-dlg', timeout=20000)   # no check needed: the box only appears after the reload
        await pg.click('.sb-dlg [data-x="ok"]')

        # ---- going into the background while typing does not reload either ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow .nm'); await controlled(pg)
        await pg.focus('.kidrow .nm'); await pg.evaluate("window.__marker = 1"); STATE['v'] = 'v3btest'; await pg.evaluate(POKE); await pg.wait_for_timeout(3000)
        await pg.evaluate("Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'}); document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(2500)
        check(await pg.evaluate("window.__marker") == 1, 'a tab sent to the background while typing is not reloaded')
        await pg.evaluate("Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'visible'}); document.activeElement.blur()"); await pg.wait_for_selector('.sb-dlg', timeout=20000)
        await pg.click('.sb-dlg [data-x="ok"]')

        # ---- a tool page: never reloaded while it is on screen; updates when the app goes into the background ----
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('#sbSound'); await controlled(pg)
        await pg.evaluate("window.__marker = 1"); STATE['v'] = 'v4test'; await pg.evaluate(POKE); await pg.wait_for_timeout(5000)
        check(await pg.evaluate("window.__marker") == 1 and await pg.locator('.sb-dlg').count() == 0, 'a quiz page is not reloaded while it is on screen')
        await pg.evaluate("Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'}); document.dispatchEvent(new Event('visibilitychange'))")
        await pg.wait_for_selector('.sb-dlg', timeout=20000)
        check(await pg.evaluate("window.__marker") is None and 'updated to the latest version' in await pg.locator('.sb-dlg').inner_text(), 'it updates when the app goes into the background, then says so')
        await pg.click('.sb-dlg [data-x="log"]'); await pg.wait_for_function("location.hash === '#/changelog'", timeout=10000)
        check(True, 'See what is new opens the change log')

        await b.close()
    check(not errs, f'no page errors {errs[:2]}')
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)

asyncio.run(main())
