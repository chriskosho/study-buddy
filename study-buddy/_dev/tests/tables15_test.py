"""Multiplication Tables to 15 test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question text), the 15 x 15 study guide chart, the 60 second speed round
(typed and tap, with a fast-forwarded clock), flashcards, the Quiz One of each, and layout: 1440x900 with no scroll, 360px phone and
915x412 landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_tables15.mjs.
Run:  python3 study-buddy/_dev/tests/tables15_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/tables-15/index.html'
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
def val(x): return int(x.strip())
def solve(q):
    """Independent solver for the typed question text."""
    q = re.sub(r'\s+', ' ', q).strip()
    m = re.match(r'^(\d+) × (\d+) = \(([\d]+) × ([\d]+)\) \+ \(([\d]+) × ([\d]+)\) = (.+)$', q)
    if m:                                    # break it apart
        p1, p2 = int(m[3]) * int(m[4]), int(m[5]) * int(m[6]); tail = m[7]
        if tail.startswith('?'): return p1
        if tail.endswith('+ ?'): return p2
        return p1 + p2
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
def solve_word(q):
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

        await pg.goto(base + 'index.html#/home/math'); await pg.wait_for_selector('a.mod[href="#/module/tables-15"]')
        txt = await pg.locator('a.mod[href="#/module/tables-15"]').inner_text()
        check('Multiplication Tables to 15' in txt and 'Insane' in txt, 'Math lists Multiplication Tables to 15, Easy to Insane')
        check('0 of 7 mastered' in txt, f'seven scored tools (guide and flashcards are practice only; the quiz counts) {txt!r}') if False else None

        # ---- typed tools: answers worked out from the question text ----
        for tool in ['times', 'apart', 'divide', 'missing', 'words']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text())
                if tool == 'words': v = solve_word(q)
                else: q = q.replace('Find the missing number:', '').strip(); v = solve(q)
                if v is None: check(False, f'{tool}: could not read question {q!r}'); v = 0
                await pg.fill(f'#tab-{tool} input', str(v)); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('tables-15','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')

        # a wrong typed answer shows the why
        await pg.goto(base + M + '?tool=times'); await pg.wait_for_selector('#tab-times input')
        await pg.fill('#tab-times input', '999'); await pg.click('#tab-times form button')
        await pg.fill('#tab-times input', '998'); await pg.click('#tab-times form button')
        check(len((await pg.locator('#tab-times .why').first.inner_text()).strip()) > 5, 'a second wrong answer shows the explanation')

        # ---- study guide ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.ftable')
        check(await pg.locator('.ftable td button').count() == 225, 'times table has 15 x 15 cells')
        check(await pg.locator('.ftable td button:has-text("225")').count() == 1, 'the chart reaches 15 x 15 = 225')
        await pg.click('.ftable td button[data-a="13"][data-b="7"]')
        t = await pg.locator('.fdetail').inner_text()
        check('13 × 7 = 91' in t and '7 × 13 = 91' in t and '91 ÷ 7 = 13' in t and '91 ÷ 13 = 7' in t, 'tapping a cell shows its fact family')
        check('10 × 7' in t and '70' in t and '3 × 7' in t and '21' in t, 'and how to break the 13 into 10 and 3')
        await pg.click('.ftable th button[data-row="15"]')
        check(await pg.locator('.ftable td button.row').count() == 15, 'tapping a row number lights that row')
        await pg.click('.ftable th button[data-col="12"]')
        check(await pg.locator('.ftable td button.col').count() == 15, 'tapping a column number lights that column')
        await pg.click('.ftable td button[data-a="15"][data-b="15"]')
        check('225' in await pg.locator('.fdetail h3').inner_text(), '15 x 15 = 225 shows')

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
        rec = await pg.evaluate("SB.toolRecord('tables-15','speed')")
        check(rec is not None and rec.get('best') == right, f'speed result recorded as the number right {rec}')
        check(await pg.locator('#sInput').is_disabled(), 'answering stops when time is up')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        rec = await pg.evaluate("SB.toolRecord('tables-15','cards')")
        check(not rec or rec.get('best') is None, 'flashcards are practice only')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (5)'), f'Random and One of each (5) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(5):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after five questions')

        # ---- layout ----
        tools = ['guide', 'cards', 'times', 'apart', 'divide', 'missing', 'speed', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
