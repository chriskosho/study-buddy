"""Multi-Digit Multiplication and Long Division test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question text with Python's own arithmetic; word problems read from the round the
page built; multiple choice by clicking), checks the study guide helper, remainder answer forms, the Quiz One of each, and layout: 1440x900 with
no scroll on the practice tools, 360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk
by gen_check_muldiv.mjs.
Run:  python3 study-buddy/_dev/tests/muldiv_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/multiply-divide/index.html'
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
def nums(q): return [int(x.replace(',', '')) for x in re.findall(r'[\d,]+', q)]
def qr(n, d):
    q, r = divmod(n, d)
    return f'{q:,} R {r}' if r else f'{q:,}'
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

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
        check('Multi-Digit Multiplication and Long Division' in await pg.inner_text('body'), 'Math lists Multi-Digit Multiplication and Long Division')

        # ---- typed multiplication ----
        for tool, lo, hi in [('multiply', 10, 99), ('bigmult', 100, 9999)]:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                a, bb = nums(await pg.locator(f'#tab-{tool} .qtext').inner_text())[:2]
                if i == 0: check(lo <= a <= hi and 10 <= bb <= 999, f'{tool}: factors in range ({a} x {bb})')
                await pg.fill(f'#tab-{tool} input', f'{a * bb:,}' if i % 2 else str(a * bb)); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('multiply-divide','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 (commas or not) {rec}')

        # ---- typed long division: both remainder forms ----
        for tool, dlo, dhi in [('div1', 2, 9), ('div2', 11, 79)]:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                n, d = nums(await pg.locator(f'#tab-{tool} .qtext').inner_text())[:2]
                if i == 0: check(dlo <= d <= dhi, f'{tool}: divisor in range ({n} / {d})')
                ans = qr(n, d)
                if ' R ' in ans and i % 2: ans = ans.replace(' R ', 'r').replace(',', '')   # 12r3 form, no commas
                await pg.fill(f'#tab-{tool} input', ans); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('multiply-divide','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with R and r forms {rec}')
        # a wrong remainder is not accepted, and an exact division accepts "R 0"
        await pg.goto(base + M + '?tool=div1'); await pg.wait_for_selector('#tab-div1 input')
        n, d = nums(await pg.locator('#tab-div1 .qtext').inner_text())[:2]
        wrong = f'{n // d + 1}'
        await pg.fill('#tab-div1 input', wrong); await pg.click('#tab-div1 form button')
        check(bool((await pg.locator('#tab-div1 .err').inner_text()).strip()) and not await pg.locator('#tab-div1 [data-a="next"]').is_visible(), 'a wrong quotient gets a try-again message and does not move on')
        await pg.fill('#tab-div1 input', qr(n, d)); await pg.click('#tab-div1 form button')
        check(await pg.locator('#tab-div1 [data-a="next"]').is_visible(), 'the right answer on the second try is accepted')
        # ---- word problems: the answers come from the round the page built ----
        await pg.goto(base + M + '?tool=words')
        for i in range(10):
            await pg.wait_for_selector('#tab-words input')
            ans = await pg.evaluate(f"window.__mdList[{i}].a")
            await pg.fill('#tab-words input', f'{ans:,}' if i % 2 else str(ans)); await pg.click('#tab-words form button')
            await pg.click('#tab-words [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('multiply-divide','words')")
        check(rec and rec['best'] == 10, f'words: 10 of 10 {rec}')

        # ---- multiple choice tools ----
        for tool in ['areamodel', 'remainders']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt'); await pg.locator(f'#tab-{tool} .opt').first.click()
                if i < 3: check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer')
                if tool == 'areamodel' and i < 3: check(await pg.locator('#tab-areamodel svg.mdarea').count() == 1, 'area model picture is shown')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            check(bool(await pg.evaluate(f"SB.toolRecord('multiply-divide','{tool}')")), f'{tool}: round recorded')

        # ---- study guide helper ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.mdform')
        async def helper(a, b):
            ins = pg.locator('.mdform .textin'); await ins.nth(0).fill(a); await ins.nth(1).fill(b); await pg.click('.mdform button')
            return await pg.locator('.mdout').inner_text(), await pg.locator('.mderr').inner_text()
        out, err = await helper('428', '36')
        check('15,408' in out and '11 R 32' in out and not err, f'helper: 428 x 36 = 15,408 and 428 / 36 = 11 R 32')
        pre = await pg.locator('.mdcalc').inner_text()
        check(pre.split('\n')[0].strip() == '428' and '2568' in pre and '12840' in pre and pre.strip().endswith('15408'), f'helper: standard method rows line up {pre!r}')
        check(await pg.locator('.mdout svg.mdarea').count() == 1, 'helper: area model drawn')
        out, err = await helper('1,764', '42')
        check('= 42' in out and 'Check: 42 × 42 = 1,764' in out, 'helper: 1,764 / 42 = 42 with a check line')
        out, err = await helper('36', '428')
        check('0 R 36' in out, 'helper: smaller number divided by bigger gives 0 R')
        out, err = await helper('7', '0')
        check('cannot divide by zero' in out and '× 0' in out or 'Anything times 0 is 0' in out, 'helper: zero divisor is explained, multiplication still shown')
        for a, b2, frag in [('', '5', 'two whole numbers'), ('4.5', '2', 'whole numbers only'), ('-3', '2', 'not negative'), ('abc', '2', 'digits only'), ('100000', '2', 'up to 99,999')]:
            out, err = await helper(a, b2)
            check(not out.strip() and frag in err, f'helper says something kind for "{a}": {err}')
        sc = await pg.evaluate("document.fonts.ready.then(() => document.documentElement.scrollWidth - innerWidth)")
        check(sc <= 0, 'guide has no sideways scroll at 1440')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (10)'), f'Random and One of each (10) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            if i == 0: check(await pg.locator('#tab-quiz .opt.right').count() == 1, 'quiz: exactly one right answer')
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after ten problems')

        # ---- layout ----
        for tool in ['cards', 'areamodel', 'multiply', 'bigmult', 'div1', 'div2', 'remainders', 'words', 'quiz']:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        for w, h in [(360, 740), (915, 412)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.mdsteps')
            o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at {w}x{h} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
