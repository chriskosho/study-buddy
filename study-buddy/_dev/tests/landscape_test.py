"""Landscape phone test (Playwright + Chromium).
A phone turned sideways is wide (915px) but short (412px). On every geography module the map tools must keep a usable map
(not squeezed to nothing, not taller than the window) and the page must not scroll sideways.
Run:  python3 study-buddy/_dev/tests/landscape_test.py"""
import http.server, threading, functools, os, sys, socket
from playwright.sync_api import sync_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(socket.socket())
BASE = f'http://127.0.0.1:{PORT}/'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE))
threading.Thread(target=srv.serve_forever, daemon=True).start()

MODS = ['south-america', 'us-states', 'europe', 'africa', 'asia', 'north-america', 'oceania', 'world', 'oceans']
TOOLS = ['Study map', 'Find it', 'Drag names', 'Listen and tap']
fails = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

BIG = """()=>{let best=0;for(const s of document.querySelectorAll('.mapbox svg')){const r=s.getBoundingClientRect();if(r.width>0&&r.height>best)best=r.height}
 const d=document.documentElement;return {h:Math.round(best),over:d.scrollWidth-d.clientWidth}}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for m in MODS:
        c = b.new_context(viewport={'width': 915, 'height': 412}, is_mobile=True, has_touch=True)
        pg = c.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'{BASE}modules/geography/{m}/index.html'); pg.wait_for_timeout(900)
        for t in TOOLS:
            pg.locator('[role=tab]:visible', has_text=t).first.click(); pg.wait_for_timeout(500)
            r = pg.evaluate(BIG)
            check(240 <= r['h'] <= 400, f'{m} / {t}: map is {r["h"]}px tall in a 412px window')
            check(r['over'] <= 0, f'{m} / {t}: no sideways scroll')
        check(not errs, f'{m}: no page errors {errs[:1]}')
        c.close()
    b.close()
srv.shutdown()
print('\nALL PASSED' if not fails else f'\n{len(fails)} FAILED')
sys.exit(1 if fails else 0)
