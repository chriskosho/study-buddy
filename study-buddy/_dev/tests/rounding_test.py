"""Rounding and Place Value test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question with an independent evaluator, multiple choice by clicking), checks the
study guide helper (right answers, kind error messages), the Quiz One of each, and layout: 1440x900 with no scroll on the practice tools,
360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk by math_gen_check.mjs.
Run:  python3 study-buddy/_dev/tests/rounding_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/rounding-place-value/index.html'
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
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")


SLUG = 'rounding-place-value'
def rnd(n, s):  # independent rounding by the digit rule, on text
    t = str(n).zfill(4); k = 3 if s == 10 else 2
    return (int(t[:k]) + (1 if int(t[k]) >= 5 else 0)) * s
def nums(t): return [int(x.replace(',', '')) for x in re.findall(r'\d[\d,]*', t)]

def solve(q):
    """Work the typed answer out from the question text."""
    q = q.replace('\u2212', '-')
    m = re.search(r'Round ([\d,]+) to the nearest (100|10)', q)
    if m: return rnd(int(m.group(1).replace(',', '')), int(m.group(2)))
    m = re.match(r'^\s*([\d,]+) ([+-]) ([\d,]+) = \?', q)
    if m:
        a, b = int(m.group(1).replace(',', '')), int(m.group(3).replace(',', '')); return a + b if m.group(2) == '+' else a - b
    n = nums(q)
    if 'nearest 10,' in q: return rnd(n[0], 10)
    if 'muffins' in q: return rnd(n[0], 100)
    if 'in all?' in q and 'Round each' not in q: return n[0] + n[1]
    if 'Round each number' in q: return rnd(n[0], 100) + rnd(n[1], 100)
    if 'the rest are blue' in q or 'How many more' in q: return n[0] - n[1]
    m = re.search(r'has (\d) hundreds?, (\d) tens?, and (\d) ones?', q)
    if m: return int(m.group(1)) * 100 + int(m.group(2)) * 10 + int(m.group(3))
    raise Exception('cannot solve: ' + q)

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
        check('Rounding and Place Value' in await pg.inner_text('body'), 'Math lists Rounding and Place Value')

        # ---- typed tools ----
        for tool in ['round10', 'round100', 'addsub', 'words']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).strip()
                v = solve(q)
                if i == 0 and tool in ('round10', 'round100'):
                    check(await pg.locator(f'#tab-{tool} svg.rl').count() == 1, f'{tool} shows a number line')
                    s = int(tool[5:]); n = nums(q)[0]; check(n % s != 0, f'{tool} number is not already rounded: {q}')
                await pg.fill(f'#tab-{tool} input', f'{v:,}' if i % 2 else str(v)); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('{SLUG}','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')

        # ---- multiple choice tools ----
        for tool in ['place', 'compare', 'estimate']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt'); await pg.locator(f'#tab-{tool} .opt').first.click()
                if i < 3: check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            check(bool(await pg.evaluate(f"SB.toolRecord('{SLUG}','{tool}')")), f'{tool}: round recorded')
        # the compare tool uses <, > and = as options: a symbol question is answered right by the symbol worked out here
        await pg.goto(base + M + '?tool=compare'); ok = 0
        for i in range(10):
            await pg.wait_for_selector('#tab-compare .opt'); q = await pg.locator('#tab-compare .qtext').inner_text()
            m = re.search(r'true\? (.+?)\s+___\s+(\d+)', q)
            if m:
                L = sum(nums(m.group(1))) if '+' in m.group(1) else nums(m.group(1))[0]; R = int(m.group(2)); sym = '<' if L < R else '>' if L > R else '='
                await pg.locator(f'#tab-compare .opt[data-v="{sym}"]').click()
                ok += 1 if await pg.locator('#tab-compare .opt.right').count() == 1 and await pg.locator('#tab-compare .opt.right').get_attribute('data-v') == sym and await pg.locator('#tab-compare .opt.wrong').count() == 0 else 0
            else: await pg.locator('#tab-compare .opt').first.click()
            await pg.click('#tab-compare [data-a="next"]')
        check(ok >= 1, f'compare symbols worked out independently ({ok})')

        # ---- study guide helpers ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.rf1')
        async def chart(text):
            await pg.fill('.rf1 input', text); await pg.click('.rf1 button')
            return (await pg.locator('.rchart .dg').inner_text()).split(), await pg.locator('.rs1').inner_text(), await pg.locator('.rerr1').inner_text()
        d, s, e = await chart('538'); check(d == ['5', '3', '8'] and '500 + 30 + 8' in s and 'five hundred thirty-eight' in s, f'chart 538: {d} {s}')
        d, s, e = await chart('407'); check('400 + 7' in s and 'four hundred seven' in s, f'chart 407 skips the zero: {s}')
        d, s, e = await chart('1,000'); check('1,000' in s and 'one thousand' in s and not e, f'chart 1,000: {s}')
        for bad_in in ['', 'abc', '1001', '3.5']:
            d, s, e = await chart(bad_in); check('whole number' in e, f'chart says something kind for "{bad_in}": {e}')
        await pg.fill('.rf2 input', '45'); await pg.select_option('.rf2 select', '10')
        t = await pg.locator('.rs2').inner_text(); check('exactly at halfway' in t and 'up to 50' in t, f'45 to nearest 10 rounds up: {t}')
        await pg.fill('.rf2 input', '449'); await pg.select_option('.rf2 select', '100')
        t = await pg.locator('.rs2').inner_text(); check('before halfway' in t and 'down to 400' in t, f'449 to nearest 100 rounds down: {t}')
        await pg.fill('.rf2 input', '962'); t = await pg.locator('.rs2').inner_text(); check('1,000' in t, f'962 to nearest 100 is 1,000: {t}')
        await pg.fill('.rf2 input', '900x'); check('whole number' in await pg.locator('.rerr2').inner_text(), 'rounding box says something kind for bad input')
        await pg.fill('.rf2 input', '30'); await pg.select_option('.rf2 select', '10'); check('already a multiple' in await pg.locator('.rs2').inner_text(), 'a multiple of 10 stays the same')
        await pg.locator('.rform input[type=range]').fill('700'); check(await pg.locator('.rf2 input').input_value() == '700', 'slider drives the number box')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (13)'), f'Random and One of each (13) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]'); seen = 0
        for i in range(13):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click(); seen += 1
            await pg.click('#tab-quiz [data-a="next"]')
        check(seen == 13 and await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after thirteen problems')

        # ---- layout ----
        tools = ['guide', 'cards', 'place', 'compare', 'round10', 'round100', 'estimate', 'addsub', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .panel, #tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
