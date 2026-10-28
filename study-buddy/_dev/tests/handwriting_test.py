"""Handwriting test (Playwright + Chromium).
Simulates tracing: dots along the gray letters should pass, a scribble across the page should fail, and a
half-traced letter should fail and show the missed parts in orange. Also checks palm rejection after a stylus
is used, Undo and Clear, the cursive / print switch, saved pen settings, results reaching the hub, and layout.
Run:  python3 study-buddy/_dev/tests/handwriting_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/english/handwriting/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));"""

# Find the gray guide pixels on the paper canvas and return sample points (client coordinates).
GUIDE_POINTS = """(opts) => {
  const P = document.querySelector('section.panel:not([hidden])'), bg = P.querySelector('.hw-bg'), r = bg.getBoundingClientRect();
  const ctx = bg.getContext('2d'), d = ctx.getImageData(0, 0, bg.width, bg.height).data, sx = bg.width / r.width;
  const want = getComputedStyle(document.documentElement).getPropertyValue('--hw-guide').trim();
  const t = document.createElement('canvas').getContext('2d'); t.fillStyle = want; t.fillRect(0,0,1,1); const g = t.getImageData(0,0,1,1).data;
  const pts = [], step = opts.step;
  for (let y = 0; y < r.height; y += step) for (let x = 0; x < r.width; x += step) {
    const i = (Math.floor(y * sx) * bg.width + Math.floor(x * sx)) * 4;
    if (Math.abs(d[i]-g[0]) < 12 && Math.abs(d[i+1]-g[1]) < 12 && Math.abs(d[i+2]-g[2]) < 12) pts.push([r.left + x, r.top + y]);
  }
  return opts.half ? pts.filter(p => p[0] < r.left + r.width / 2) : pts; }"""
DOTS = """([pts, type]) => {
  const ink = document.querySelector('section.panel:not([hidden]) .hw-ink'); let id = 10;
  for (const [x, y] of pts) { const o = { clientX: x, clientY: y, pointerId: id, pointerType: type, isPrimary: true, bubbles: true, pressure: .5, button: 0 };
    ink.dispatchEvent(new PointerEvent('pointerdown', o)); ink.dispatchEvent(new PointerEvent('pointerup', o)); id++; } }"""
LINE = """([x0, y0, x1, y1, type]) => {
  const ink = document.querySelector('section.panel:not([hidden]) .hw-ink'), o = (x, y) => ({ clientX: x, clientY: y, pointerId: 99, pointerType: type, isPrimary: true, bubbles: true, pressure: .5, button: 0 });
  ink.dispatchEvent(new PointerEvent('pointerdown', o(x0, y0)));
  for (let k = 1; k <= 30; k++) ink.dispatchEvent(new PointerEvent('pointermove', o(x0 + (x1 - x0) * k / 30, y0 + (y1 - y0) * k / 30)));
  ink.dispatchEvent(new PointerEvent('pointerup', o(x1, y1))); }"""
INK_PIXELS = "() => { const c = document.querySelector('section.panel:not([hidden]) .hw-ink'); const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }"
MISSED = """() => { const bg = document.querySelector('section.panel:not([hidden]) .hw-bg'); const d = bg.getContext('2d').getImageData(0,0,bg.width,bg.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 16) if (d[i] > 200 && d[i+1] > 120 && d[i+1] < 190 && d[i+2] < 150) n++; return n; }"""

async def trace_and_check(pg, half=False, step=7):
    pts = await pg.evaluate(GUIDE_POINTS, {'step': step, 'half': half})
    await pg.evaluate(DOTS, [pts, 'mouse'])
    await pg.click('section.panel:not([hidden]) [data-a="check"]')
    return await pg.locator('section.panel:not([hidden]) .hw-msg').inner_text(), len(pts)

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

        await pg.goto(base + M + '?tool=letters'); await pg.wait_for_selector('#tab-letters .hw-bg'); await pg.wait_for_timeout(400)
        check(await pg.locator('#tab-letters [data-style="cursive"]').get_attribute('aria-pressed') == 'true', 'cursive is the default')
        check(await pg.locator('#tab-letters .hw-strip button').count() == 26, '26 letter buttons')

        # good tracing passes
        msg, n = await trace_and_check(pg)
        check(n > 40 and ('Nice' in msg or 'Beautiful' in msg), f'tracing along the letter passes ({n} dots): {msg[:40]}')
        rec = await pg.evaluate("SB.toolRecord('handwriting','letters')")
        check(rec and rec['best'] == 1 and rec['max'] == 52, f'first letter recorded as 1 of 52 {rec}')
        check('passed' in (await pg.locator('#tab-letters .hw-strip button[data-i="0"]').get_attribute('class') or ''), 'passed letter is marked in the strip')

        # scribble fails
        await pg.click('#tab-letters [data-a="next"]'); await pg.wait_for_timeout(200)
        box = await pg.locator('#tab-letters .hw-ink').bounding_box()
        await pg.evaluate(LINE, [box['x'] + 20, box['y'] + 30, box['x'] + box['width'] - 20, box['y'] + box['height'] - 30, 'mouse'])
        await pg.click('#tab-letters [data-a="check"]')
        msg = await pg.locator('#tab-letters .hw-msg').inner_text()
        check('Nice' not in msg and 'Beautiful' not in msg, f'a scribble does not pass: {msg[:50]}')

        # half traced fails and shows orange
        await pg.click('#tab-letters [data-a="clear"]')
        msg, n = await trace_and_check(pg, half=True)
        check('orange' in msg, f'half a letter asks for the rest: {msg[:50]}')
        check(await pg.evaluate(MISSED) > 20, 'missed parts are shown in orange')

        # undo and clear
        await pg.click('#tab-letters [data-a="clear"]')
        check(await pg.evaluate(INK_PIXELS) == 0, 'Clear empties the pad')
        await pg.evaluate(LINE, [box['x'] + 50, box['y'] + 50, box['x'] + 150, box['y'] + 60, 'mouse'])
        check(await pg.evaluate(INK_PIXELS) > 0, 'mouse draws')
        await pg.click('#tab-letters [data-a="undo"]')
        check(await pg.evaluate(INK_PIXELS) == 0, 'Undo removes the last stroke')

        # palm rejection
        await pg.evaluate(LINE, [box['x'] + 50, box['y'] + 50, box['x'] + 150, box['y'] + 60, 'pen'])
        before = await pg.evaluate(INK_PIXELS)
        check(not await pg.locator('#tab-letters [data-a="finger"]').is_hidden(), 'Finger button appears after the stylus is used')
        await pg.evaluate(LINE, [box['x'] + 200, box['y'] + 120, box['x'] + 400, box['y'] + 130, 'touch'])
        check(await pg.evaluate(INK_PIXELS) == before, 'touches are ignored after a stylus is used (palm rejection)')
        await pg.click('#tab-letters [data-a="finger"]')
        await pg.evaluate(LINE, [box['x'] + 200, box['y'] + 120, box['x'] + 400, box['y'] + 130, 'touch'])
        check(await pg.evaluate(INK_PIXELS) > before, 'Finger: on lets touches draw again')

        # print style and saved pen settings
        await pg.click('#tab-letters [data-case="lower"]'); await pg.click('#tab-letters [data-style="print"]')
        await pg.click('#tab-letters [data-color="#1b998b"]'); await pg.click('#tab-letters [data-size="thick"]')
        st = await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('handwriting')))")
        check(st['style'] == 'print' and st['color'] == '#1b998b' and st['size'] == 'thick' and st['case'] == 'lower', f'style and pen settings are saved {st}')
        msg, n = await trace_and_check(pg)
        check('Nice' in msg or 'Beautiful' in msg, f'print lowercase a traces and passes: {msg[:30]}')

        # words round
        await pg.click('nav.tabs button[data-tab="words"]'); await pg.wait_for_timeout(400)
        for k in range(6):
            msg, n = await trace_and_check(pg, step=6)
            await pg.click('#tab-words [data-a="next"]'); await pg.wait_for_timeout(150)
        rec = await pg.evaluate("SB.toolRecord('handwriting','words')")
        check(rec and rec['best'] >= 5 and rec['max'] == 6, f'words round recorded {rec}')
        o = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
        check(o['v'] <= 0 and o['h'] <= 0, f'words fits 1440x900 {o}')

        # practice paper traces typed text, no Check button
        await pg.click('nav.tabs button[data-tab="practice"]'); await pg.wait_for_timeout(300)
        check(await pg.locator('#tab-practice [data-a="check"]').count() == 0, 'practice paper has no grading')
        await pg.fill('#tab-practice input', 'Joshua'); await pg.click('#tab-practice form button'); await pg.wait_for_timeout(200)
        pts = await pg.evaluate(GUIDE_POINTS, {'step': 8, 'half': False})
        check(len(pts) > 30, 'typed name appears as a gray guide')

        for vw, vh in [(1440, 900), (360, 780)]:
            await pg.set_viewport_size({'width': vw, 'height': vh})
            for t in ['practice', 'letters', 'words', 'sentences']:
                await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(350)
                o = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
                check(o['h'] <= 0 and (vw < 800 or o['v'] <= 0), f'{vw}px {t}: layout ok {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
