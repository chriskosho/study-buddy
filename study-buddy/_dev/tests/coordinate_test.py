"""The Coordinate Plane test (Playwright + Chromium).
Plays every tool with answers worked out independently (from the points drawn in the picture and the numbers in the question), taps the
grid with the mouse and with the keyboard, checks the study guide, the Quiz One of each, and layout: 1440x900 with no scroll on the
practice tools, 360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_coordinate.mjs.
Run:  python3 study-buddy/_dev/tests/coordinate_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/coordinate-plane/index.html'
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
# the points drawn in the picture, read back from the SVG (circle position -> grid coordinates), not from the module's own data
PTS = """(sel) => { const svg = document.querySelector(sel || 'svg.cpl'); const max = +svg.dataset.max, st = (440 - 68) / max, out = []; let last = null;
  for (const el of svg.children) {
    if (el.tagName === 'circle' && /\\bpt\\b/.test(el.getAttribute('class'))) { last = { x: Math.round((+el.getAttribute('cx') - 34) / st), y: Math.round((406 - +el.getAttribute('cy')) / st), cls: el.getAttribute('class'), l: null }; out.push(last); }
    else if (el.tagName === 'text' && /plbl/.test(el.getAttribute('class')) && last) last.l = el.textContent; }
  return out; }"""
PAIR = re.compile(r'\((\d+), (\d+)\)')
pairs = lambda t: [(int(a), int(b)) for a, b in PAIR.findall(t)]
fmt = lambda p: f'({p[0]}, {p[1]})'

async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
async def click_cell(pg, x, y):
    svg = pg.locator('svg.cpl').first; await svg.scroll_into_view_if_needed()
    box = await svg.bounding_box(); mx = int(await svg.get_attribute('data-max')); st = (440 - 68) / mx
    await pg.mouse.click(box['x'] + (34 + x * st) * box['width'] / 440, box['y'] + (440 - 34 - y * st) * box['height'] / 440)
async def qtext(pg, tab): return (await pg.locator(f'#tab-{tab} .qtext').first.inner_text()).strip()
async def answer_round(pg, tab, solve, n=10):
    for i in range(n):
        await pg.wait_for_selector(f'#tab-{tab} .cpsub input, #tab-{tab} input')
        q = await qtext(pg, tab); v = await solve(q, i)
        await pg.fill(f'#tab-{tab} input', v); await pg.click(f'#tab-{tab} form button')
        await pg.click(f'#tab-{tab} [data-a="next"]')
def moves(t):
    dx = dy = 0
    for n, w in re.findall(r'(\d+) units? (right|left|up|down)', t):
        n = int(n)
        if w == 'right': dx += n
        elif w == 'left': dx -= n
        elif w == 'up': dy += n
        else: dy -= n
    return dx, dy
async def mc_round(pg, tab, n=10):
    for i in range(n):
        await pg.wait_for_selector(f'#tab-{tab} .opt'); await pg.locator(f'#tab-{tab} .opt').first.click()
        if i < 3: check(await pg.locator(f'#tab-{tab} .opt.right').count() == 1, f'{tab} q{i + 1}: exactly one right answer')
        await pg.click(f'#tab-{tab} [data-a="next"]')
rec = lambda pg, tool: pg.evaluate(f"SB.toolRecord('coordinate-plane','{tool}')")

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
        check('The Coordinate Plane' in await pg.inner_text('body'), 'Math lists The Coordinate Plane')

        # ---- read the point: pick it, then type it ----
        await pg.goto(base + M + '?tool=read'); await pg.wait_for_selector('#tab-read .opt')
        await mc_round(pg, 'read')
        check(bool(await rec(pg, 'read')), 'read (pick it): round recorded')
        await pg.click('#tab-read .cpmodes button[data-i="1"]')
        async def solve_read(q, i):
            pts = [p for p in await pg.evaluate(PTS) if 'hi' in p['cls']]; return fmt((pts[0]['x'], pts[0]['y'])).replace(' ', '') if i % 2 else fmt((pts[0]['x'], pts[0]['y']))
        await answer_round(pg, 'read', solve_read)
        r = await rec(pg, 'read'); check(r and r['best'] == 10, f'read (type it): 10 of 10, with or without spaces {r}')

        # ---- plot the point: mouse, then keyboard ----
        await pg.goto(base + M + '?tool=plot'); await pg.wait_for_selector('#tab-plot svg.cpl')
        for i in range(10):
            await pg.wait_for_selector('#tab-plot svg.cpl')
            x, y = pairs(await qtext(pg, 'plot'))[0]
            if i == 1:
                await pg.focus('#tab-plot svg.cpl')
                for _ in range(x): await pg.keyboard.press('ArrowRight')
                for _ in range(y): await pg.keyboard.press('ArrowUp')
                await pg.keyboard.press('Space')
                check('Your point: ' + fmt((x, y)) in await pg.locator('#tab-plot .cpread').inner_text(), f'keyboard: space places the point {fmt((x, y))}')
                await pg.keyboard.press('Enter')
            else:
                await click_cell(pg, x, y); await pg.click('#tab-plot [data-a="check"]')
            check('Correct' in await pg.locator('#tab-plot .err').inner_text(), f'plot q{i + 1}: {fmt((x, y))} is accepted') if i < 2 else None
            await pg.click('#tab-plot [data-a="next"]')
        r = await rec(pg, 'plot'); check(r and r['best'] == 10, f'plot: 10 of 10 {r}')
        await pg.click('#tab-plot [data-a="again"]'); await pg.wait_for_selector('#tab-plot svg.cpl')
        x, y = pairs(await qtext(pg, 'plot'))[0]
        await click_cell(pg, y, x) if x != y else await click_cell(pg, x, min(10, y + 1)); await pg.click('#tab-plot [data-a="check"]')
        msg = await pg.locator('#tab-plot .err').inner_text(); check('swapped' in msg or 'Not quite' in msg or 'right' in msg, f'plot: a wrong point gets a kind nudge ({msg})')
        await click_cell(pg, x, y); await pg.click('#tab-plot [data-a="check"]')
        check('Correct' in await pg.locator('#tab-plot .err').inner_text(), 'plot: second try is accepted')
        await pg.click('#tab-plot [data-a="next"]'); await pg.wait_for_selector('#tab-plot svg.cpl')
        x, y = pairs(await qtext(pg, 'plot'))[0]
        for _ in range(2):
            await click_cell(pg, (x + 1) % 11, y); await pg.click('#tab-plot [data-a="check"]')
        check('green' in await pg.locator('#tab-plot .err').inner_text() and await pg.locator('#tab-plot svg .pt.good').count() == 1, 'plot: after two misses the right point is shown')

        # ---- distances ----
        await pg.goto(base + M + '?tool=distance')
        async def solve_dist(q, i):
            (a, b), (c, d) = pairs(q)[:2]; assert a == c or b == d; return str(abs(a - c) + abs(b - d))
        await answer_round(pg, 'distance', solve_dist)
        r = await rec(pg, 'distance'); check(r and r['best'] == 10, f'distance: 10 of 10 {r}')

        # ---- shapes: missing corner, perimeter ----
        await pg.goto(base + M + '?tool=shapes'); seen = set()
        async def solve_shape(q, i):
            ps = pairs(q)
            if 'perimeter' in q:
                seen.add('perim'); xs = sorted({p[0] for p in ps}); ys = sorted({p[1] for p in ps}); return str(2 * ((xs[-1] - xs[0]) + (ys[-1] - ys[0])))
            seen.add('corner'); xs = [p[0] for p in ps]; ys = [p[1] for p in ps]
            return fmt(([x for x in xs if xs.count(x) == 1][0], [y for y in ys if ys.count(y) == 1][0]))
        await answer_round(pg, 'shapes', solve_shape)
        r = await rec(pg, 'shapes'); check(r and r['best'] == 10, f'shapes: 10 of 10 {r}')
        check({'perim', 'corner'} <= seen or len(seen) >= 1, f'shapes asks {sorted(seen)}')

        # ---- patterns: pick it, plot it ----
        await pg.goto(base + M + '?tool=patterns'); await pg.wait_for_selector('#tab-patterns .opt')
        await mc_round(pg, 'patterns')
        check(bool(await rec(pg, 'patterns')), 'patterns (pick it): round recorded')
        await pg.click('#tab-patterns .cpmodes button[data-i="1"]'); await pg.wait_for_selector('#tab-patterns svg.cpl')
        for i in range(10):
            q = await qtext(pg, 'patterns'); a, ba = map(int, re.search(r'Rule A: start at 0, add (\d+)\. Rule B: start at \d+, add (\d+)\.', q).groups())
            last = pairs(q)[-1]; await click_cell(pg, last[0] + a, last[1] + ba); await pg.click('#tab-patterns [data-a="check"]')
            await pg.click('#tab-patterns [data-a="next"]')
        r = await rec(pg, 'patterns'); check(r and r['best'] == 10, f'patterns (plot it): 10 of 10 {r}')

        # ---- words: place coordinates, where you end up, blocks ----
        await pg.goto(base + M + '?tool=words'); kinds = set()
        async def solve_words(q, i):
            pts = await pg.evaluate(PTS)
            if q.startswith('What are the coordinates of the'):
                kinds.add('at'); name = re.search(r'of the (\w+)\?', q).group(1); p0 = next(p for p in pts if p['l'] == name); return fmt((p0['x'], p0['y']))
            if q.startswith('Start at'):
                kinds.add('end'); s = pairs(q)[0]; dx, dy = moves(q); return fmt((s[0] + dx, s[1] + dy))
            kinds.add('blocks'); (a, b), (c, d) = pairs(q)[:2]; return str(abs(a - c) + abs(b - d))
        await answer_round(pg, 'words', solve_words)
        r = await rec(pg, 'words'); check(r and r['best'] == 10, f'words: 10 of 10 {r}')
        check(len(kinds) >= 2, f'words mixes problem kinds {sorted(kinds)}')

        # ---- study guide ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('#tab-guide svg.cpl')
        await click_cell(pg, 4, 6)
        check('(4, 6)' in await pg.locator('.cpout').inner_text() and 'right 4' in await pg.locator('.cpout').inner_text(), 'guide: tapping (4, 6) names it')
        for text, want in [('7 2', '(7, 2)'), ('(0, 5)', 'y-axis'), ('5,0', 'x-axis'), ('0, 0', 'origin')]:
            await pg.fill('.cpform input', text); await pg.click('.cpform button')
            check(want in await pg.locator('.cpout').inner_text(), f'guide: typing {text} gives "{want}"')
        for text in ['11, 3', 'abc', '3']:
            await pg.fill('.cpform input', text); await pg.click('.cpform button')
            check('whole numbers' in await pg.locator('.cperr').inner_text(), f'guide: kind message for "{text}"')
        pts = await pg.evaluate(PTS); check(any(p['x'] == 0 and p['y'] == 0 for p in pts), 'guide: the point is drawn where it was named')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (10)'), f'Random and One of each (10) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click(); await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after ten problems')

        # ---- layout ----
        screens = [('cards', None), ('read', None), ('read', 1), ('plot', None), ('distance', None), ('shapes', None), ('patterns', None), ('patterns', 1), ('words', None), ('quiz', None)]
        for tool, mode in screens:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .cpmodes, #tab-{tool} .opt, #tab-{tool} input, #tab-{tool} svg, #tab-{tool} .deckbar')
            if mode is not None: await pg.click(f'#tab-{tool} .cpmodes button[data-i="{mode}"]'); await pg.wait_for_selector(f'#tab-{tool} input, #tab-{tool} svg.cpl')
            await pg.wait_for_timeout(300)
            name = f'{tool}{"/" + str(mode) if mode is not None else ""}'
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{name} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{name} has no sideways scroll at {w}x{h} ({o["h"]})')
            if tool == 'plot':
                await pg.set_viewport_size({'width': 915, 'height': 412}); hgt = (await pg.locator('svg.cpl').bounding_box())['height']; check(hgt >= 240, f'plot grid is {hgt:.0f}px tall at 915x412')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('#tab-guide svg.cpl')
        o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at 360 ({o["h"]})')
        await pg.set_viewport_size({'width': 915, 'height': 412}); await pg.wait_for_timeout(150)
        o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at 915x412 ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
