"""Multiplication and Division Facts test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question text, multiple choice by clicking), the study guide chart, the 60 second
speed round (typed and tap, with a fast-forwarded clock), flashcards, the Quiz One of each, and layout: 1440x900 with no scroll on the
practice tools, 360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_facts.mjs.
Run:  python3 study-buddy/_dev/tests/facts_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/facts/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Eli',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
def solve(q):
    """Independent solver for the typed question text."""
    q = re.sub(r'\s+', ' ', q).strip()
    m = re.match(r'^(\d+) × (\d+) = \?$', q)
    if m: return int(m[1]) * int(m[2])
    m = re.match(r'^(\d+) ÷ (\d+) = \?$', q)
    if m: return int(m[1]) // int(m[2])
    m = re.search(r'(\d+) × \? = (\d+)', q)
    if m: return int(m[2]) // int(m[1])
    m = re.search(r'\? × (\d+) = (\d+)', q)
    if m: return int(m[2]) // int(m[1])
    m = re.search(r'(\d+) ÷ \? = (\d+)', q)
    if m: return int(m[1]) // int(m[2])
    m = re.search(r'\? ÷ (\d+) = (\d+)', q)
    if m: return int(m[1]) * int(m[2])
    return None
def solve_word(q, dots=None):
    if 'dots are in this array' in q: return dots
    n = [int(x) for x in re.findall(r'\d+', q)]
    if ' shares ' in q or ' puts ' in q: return n[0] // n[1]
    return n[0] * n[1]
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
        check('Multiplication and Division Facts' in await pg.inner_text('body'), 'Math lists Multiplication and Division Facts')

        # ---- typed tools ----
        for tool in ['times', 'divide', 'missing', 'words']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text())
                if tool == 'words':
                    dots = await pg.locator(f'#tab-{tool} .qtext circle.adot').count()
                    v = solve_word(q, dots)
                else:
                    q = q.replace('Find the missing number:', '').strip(); v = solve(q)
                if v is None: check(False, f'{tool}: could not read question {q!r}'); v = 0
                await pg.fill(f'#tab-{tool} input', str(v)); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('facts','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')

        # a wrong typed answer shows the why
        await pg.goto(base + M + '?tool=times'); await pg.wait_for_selector('#tab-times input')
        await pg.fill('#tab-times input', '999'); await pg.click('#tab-times form button')
        await pg.fill('#tab-times input', '998'); await pg.click('#tab-times form button')
        check(len((await pg.locator('#tab-times .why').first.inner_text()).strip()) > 5, 'a second wrong answer shows the explanation')

        # ---- multiple choice ----
        await pg.goto(base + M + '?tool=families')
        for i in range(10):
            await pg.wait_for_selector('#tab-families .opt'); await pg.locator('#tab-families .opt').first.click()
            if i < 3: check(await pg.locator('#tab-families .opt.right').count() == 1, f'families q{i + 1}: exactly one right answer')
            await pg.click('#tab-families [data-a="next"]')
        check(bool(await pg.evaluate("SB.toolRecord('facts','families')")), 'families: round recorded')

        # ---- study guide ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.ftable')
        check(await pg.locator('.ftable td button').count() == 121, 'times table has 11 x 11 cells (0 to 10)')
        await pg.click('.ftable td button[data-a="6"][data-b="7"]')
        t = await pg.locator('.fdetail').inner_text()
        check('6 × 7 = 42' in t and '7 × 6 = 42' in t and '42 ÷ 6 = 7' in t and '42 ÷ 7 = 6' in t, 'tapping a cell shows its fact family')
        check(await pg.locator('.fdetail circle.adot').count() == 42, 'tapping a cell shows an array of 42 dots')
        await pg.click('.ftable th button[data-row="9"]')
        check('9 × 9 = 81' in await pg.locator('.fdetail').inner_text(), 'tapping a row number lists that times table')
        await pg.click('.ftable td button[data-a="0"][data-b="5"]')
        check('0' in await pg.locator('.fdetail h3').inner_text() and 'divide by 0' in (await pg.locator('.fdetail').inner_text()).lower() and '0 ÷ 5 = 0' in (await pg.locator('.fdetail').inner_text()), 'a times 0 cell explains 0 ÷ a = 0 and no dividing by 0')
        o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at 1440 {o}')

        # ---- speed round ----
        await pg.goto(base + M + '?tool=speed'); await pg.wait_for_selector('#sStart')
        await pg.clock.install()
        await pg.goto(base + M + '?tool=speed'); await pg.wait_for_selector('#sStart')
        await pg.click('#sStart')
        right = 0
        for i in range(6):
            await pg.wait_for_selector('#sInput:not([disabled])')
            txt = (await pg.inner_text('#sPrompt')).replace('= ?', '').strip()
            m = re.match(r'^(\d+) ([×÷]) (\d+)$', txt)
            v = int(m[1]) * int(m[3]) if m[2] == '×' else int(m[1]) // int(m[3])
            if i == 5: v += 1
            else: right += 1
            await pg.fill('#sInput', str(v)); await pg.press('#sInput', 'Enter')
        check(await pg.inner_text('#sScore') == str(right), f'speed score counts right answers only ({right})')
        await pg.click('.seg button[data-m="tap"]')
        check(await pg.locator('#sTap .opt').count() == 4, 'tap mode shows four choices')
        txt = (await pg.inner_text('#sPrompt')).replace('= ?', '').strip(); m = re.match(r'^(\d+) ([×÷]) (\d+)$', txt)
        v = int(m[1]) * int(m[3]) if m[2] == '×' else int(m[1]) // int(m[3])
        await pg.click(f'#sTap .opt[data-n="{v}"]'); right += 1
        check(await pg.inner_text('#sScore') == str(right), 'a tapped right answer scores')
        await pg.clock.run_for(61000)
        check(await pg.inner_text('#sPrompt') == 'Time!', 'the round ends after 60 seconds')
        rec = await pg.evaluate("SB.toolRecord('facts','speed')")
        check(rec is not None and rec.get('best') == right, f'speed result recorded as the number right {rec}')
        check(await pg.inner_text('#sBest') == str(right), 'best score shown')
        check(await pg.locator('#sInput').is_disabled(), 'answering stops when time is up')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (9)'), f'Random and One of each (9) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(9):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after nine questions')

        # ---- layout ----
        tools = ['guide', 'cards', 'times', 'divide', 'missing', 'families', 'speed', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check((o['v'] <= 0 or tool == 'guide') and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        # an array question at phone width
        await pg.set_viewport_size({'width': 360, 'height': 740})
        for _ in range(30):
            await pg.goto(base + M + '?tool=words'); await pg.wait_for_selector('#tab-words .qtext')
            if await pg.locator('#tab-words .qtext svg.farr').count(): break
        o = await overflow(pg); check(o['h'] <= 0, f'array question has no sideways scroll at 360 ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
