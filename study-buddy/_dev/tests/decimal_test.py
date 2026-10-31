"""Decimal Operations test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question text with exact Decimal math, multiple choice by clicking), checks the study guide
helper (right answers, kind error messages), the Quiz One of each, and layout: 1440x900 with no scroll on the practice tools, 360px phone and
915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_decimal.mjs.
Run:  python3 study-buddy/_dev/tests/decimal_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from decimal import Decimal
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/decimal-operations/index.html'
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
def fmt(d):
    d = d.normalize(); s = format(d, 'f'); return s
def solve_binary(q):
    """Work out 'A op B = ?' with exact decimals."""
    m = re.match(r'^([\d,.]+) ([+−×÷]) ([\d,.]+) = \?$', q.strip())
    if not m: return None
    a, op, b = Decimal(m.group(1).replace(',', '')), m.group(2), Decimal(m.group(3).replace(',', ''))
    return fmt({'+': a + b, '−': a - b, '×': a * b, '÷': a / b}[op])
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def play_typed(pg, tool, solver):
    for i in range(10):
        await pg.wait_for_selector(f'#tab-{tool} input')
        q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).strip()
        ans = solver(q)
        if ans is None: ans = await pg.evaluate("(q) => window.__decAnswers[q]", q)
        ans = str(ans)
        if i % 3 == 0 and Decimal(ans) >= 1000: ans = ('{:,}'.format(int(Decimal(ans))) + ('.' + ans.split('.')[1] if '.' in ans else ''))   # commas are allowed
        elif i % 3 == 1: ans = ans + ('0' if '.' in ans else '.0')                                                                           # so is a zero at the end
        await pg.fill(f'#tab-{tool} input', str(ans)); await pg.click(f'#tab-{tool} form button')
        await pg.click(f'#tab-{tool} [data-a="next"]')
    return await pg.evaluate(f"SB.toolRecord('decimal-operations','{tool}')")

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
        check('Decimal Operations' in await pg.inner_text('body'), 'Math lists Decimal Operations')

        # ---- typed tools: answers worked out from the question text ----
        for tool in ['add', 'subtract', 'multiply', 'divide']:
            await pg.goto(base + f'{M}?tool={tool}')
            rec = await play_typed(pg, tool, lambda q: solve_binary(q))
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')
        # the other typed tools use the module's own answers (the generators are re-solved in bulk by gen_check_decimal.mjs)
        for tool in ['words', 'review']:
            await pg.goto(base + f'{M}?tool={tool}')
            rec = await play_typed(pg, tool, lambda q: solve_binary(q))
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 {rec}')

        # ---- multiple choice ----
        await pg.goto(base + f'{M}?tool=estimate')
        for i in range(10):
            await pg.wait_for_selector('#tab-estimate .opt'); await pg.locator('#tab-estimate .opt').first.click()
            if i < 3: check(await pg.locator('#tab-estimate .opt.right').count() == 1, f'estimate q{i + 1}: exactly one right answer')
            await pg.click('#tab-estimate [data-a="next"]')
        check(bool(await pg.evaluate("SB.toolRecord('decimal-operations','estimate')")), 'estimate: round recorded')

        # ---- study guide helper ----
        await pg.goto(base + f'{M}?tool=guide'); await pg.wait_for_selector('.dform')
        async def helper(a, op, bb):
            f = pg.locator('.dform input'); await f.nth(0).fill(a); await f.nth(1).fill(bb); await pg.select_option('.dform select', op); await pg.click('.dform button')
            ans = await pg.locator('.dsteps li.last').all_inner_texts(); err = await pg.locator('.derr').inner_text()
            return (ans[0].replace('Answer: ', '') if ans else None), err
        for a, op, bb, want in [('4.7', '+', '2.35', '7.05'), ('7', '−', '2.35', '4.65'), ('0.6', '×', '0.04', '0.024'), ('3.4', '×', '6', '20.4'), ('7.5', '÷', '5', '1.5'), ('4.8', '÷', '0.6', '8'), ('6', '÷', '0.25', '24'), ('1,000.5', '+', '0.25', '1,000.75')]:
            got, err = await helper(a, op, bb)
            check(got == want and not err, f'helper: {a} {op} {bb} = {want} (got {got} {err})')
        for a, op, bb, frag in [('', '+', '1', 'Type a number'), ('1', '+', 'x', 'needs a decimal'), ('2', '−', '5', 'at least as big'), ('1', '÷', '0', 'divide by zero'), ('1', '÷', '3', 'evenly'), ('-2', '+', '1', 'positive')]:
            got, err = await helper(a, op, bb)
            check(got is None and frag in err, f'helper says something kind for {a!r} {op} {bb!r}: {err}')
        await helper('12.4', '+', '3.25'); check(await pg.locator('.dsteps pre').count() == 1, 'add shows the numbers lined up in columns')

        # ---- cards and quiz ----
        await pg.goto(base + f'{M}?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + f'{M}?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[0].startswith('Random') and labels[1].startswith('One of each (11)'), f'Random and One of each (11) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(11):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            if i < 3: check(await pg.locator('#tab-quiz .opt.right').count() == 1, f'quiz q{i + 1}: exactly one right answer')
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after eleven problems')

        # ---- layout ----
        for tool in ['cards', 'add', 'subtract', 'multiply', 'divide', 'estimate', 'words', 'review', 'quiz']:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + f'{M}?tool={tool}'); await pg.wait_for_selector(f'#tab-{tool}'); await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        for w, h in [(360, 740), (915, 412), (1440, 900)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.goto(base + f'{M}?tool=guide'); await pg.wait_for_selector('.dsteps')
            await pg.fill('.dform input >> nth=0', '123456.7'); await pg.select_option('.dform select', '×'); await pg.fill('.dform input >> nth=1', '98.765'); await pg.click('.dform button')
            o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at {w}x{h} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
