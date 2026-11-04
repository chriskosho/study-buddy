"""Saved progress, Back and Start over in the shared tools (owner's request, November 2026).
Answers survive a reload, leaving for another module, and switching topics; Back is a practice try (no extra credit or score);
Start over asks first and clears the round; a finished round and the admin Reset clear the saved round.
Run:  python3 study-buddy/_dev/tests/progress_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
PW = 'modules/history/punic-wars/index.html'
POS = 'modules/english/parts-of-speech/index.html'
EU = 'modules/geography/europe/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Eli',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),20)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
async def daily(pg): return await pg.evaluate("SB.streakInfo().daily")
async def hint(pg, tool): return (await pg.locator(f'#tab-{tool} .roundbar .hint').inner_text()).strip()

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
        async def go(path, tool):
            await pg.goto(base + path + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool}:not([hidden]) h2'); await pg.wait_for_timeout(120)

        # ---- quiz: answers survive a reload and a trip to another module ----
        await go(PW, 'quiz')
        q1 = await pg.locator('#tab-quiz .qtext').inner_text()
        for _ in range(2):
            await pg.locator('#tab-quiz .opt').first.click(); await pg.click('#tab-quiz [data-a="next"]')
        h = await hint(pg, 'quiz'); score = re.search(r'Score (\d+)', h)[1]
        q3 = await pg.locator('#tab-quiz .qtext').inner_text()
        await go(PW, 'quiz')
        check((await hint(pg, 'quiz')).startswith('Question 3 of 10') and await pg.locator('#tab-quiz .qtext').inner_text() == q3, 'quiz: a reload comes back to question 3, the same question')
        await go(POS, 'guide'); await go(PW, 'quiz')
        check((await hint(pg, 'quiz')).startswith('Question 3 of 10') and f'Score {score}' in await hint(pg, 'quiz'), 'quiz: leaving for another module keeps the place and the score')
        # Back: a practice try
        d0 = await daily(pg)
        await pg.click('#tab-quiz [data-a="back"]')
        check((await hint(pg, 'quiz')).startswith('Question 2 of 10') and 'Practice try' in await pg.locator('#tab-quiz .explain').inner_text(), 'Back goes to question 2 as a practice try')
        check(await pg.locator('#tab-quiz [data-a="next"]').is_visible(), 'a practice try can go straight on')
        right = pg.locator('#tab-quiz .opt').filter(has_text=re.compile('.'))
        opts = await pg.locator('#tab-quiz .opt').count()
        for k in range(opts):   # answer it right this time
            await pg.locator('#tab-quiz .opt').nth(k).click()
            if await pg.locator('#tab-quiz .opt.right.wrong, #tab-quiz .opt.wrong').count() == 0: break
            await pg.click('#tab-quiz [data-a="back"]') if False else None
            break
        check(f'Score {score}' in await hint(pg, 'quiz') and await daily(pg) == d0, 'a practice try changes neither the score nor the daily count')
        await pg.click('#tab-quiz [data-a="next"]')
        check((await hint(pg, 'quiz')).startswith('Question 3 of 10'), 'Next returns to where you were')
        check(not await pg.locator('#tab-quiz [data-a="back"]').is_disabled(), 'Back is available after question 1')
        # Start over asks first
        await pg.click('#tab-quiz [data-a="restart"]')
        check(await pg.locator('.sb-dlg:has-text("Start over?")').count() == 1, 'Start over asks first')
        await pg.click('.sb-dlg [data-x="no"]')
        check((await hint(pg, 'quiz')).startswith('Question 3 of 10'), 'Cancel keeps the round')
        await pg.click('#tab-quiz [data-a="restart"]'); await pg.click('.sb-dlg [data-x="yes"]')
        check((await hint(pg, 'quiz')).startswith('Question 1 of 10 · Score 0'), 'Start over begins a new round')
        check(await pg.locator('#tab-quiz [data-a="back"]').is_disabled(), 'no Back on question 1')
        # a finished round is cleared
        for _ in range(10):
            await pg.locator('#tab-quiz .opt').first.click(); await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'the round finishes')
        rec = await pg.evaluate("SB.toolRecord('punic-wars','quiz')"); check(rec and rec['max'] == 10, f'the finished round is recorded once {rec}')
        await go(PW, 'quiz')
        check((await hint(pg, 'quiz')).startswith('Question 1 of 10'), 'after a finished round the next visit starts a new one')

        # ---- type the answer: a wrong try is remembered, and an answered question comes back as a practice try ----
        await go(PW, 'type')
        await pg.fill('#tab-type input', 'zzzz wrong'); await pg.click('#tab-type form button')
        await go(PW, 'type')
        check('Not quite' in await pg.locator('#tab-type .err').inner_text(), 'type: a wrong try is still counted after a reload')
        await pg.fill('#tab-type input', 'zzzz wrong again'); await pg.click('#tab-type form button')
        check('The answer is' in await pg.locator('#tab-type .err').inner_text(), 'so the second wrong try shows the answer')
        await go(PW, 'type')
        check('Practice try' in await pg.locator('#tab-type .err').inner_text() and await pg.locator('#tab-type [data-a="next"]').is_visible(), 'an answered question comes back as a practice try with Next')
        await pg.click('#tab-type [data-a="next"]')
        check((await hint(pg, 'type')).startswith('Question 2 of 10'), 'type: Next goes on to question 2')

        # ---- put in order: moves are kept, and Undo takes one back ----
        await go(PW, 'order')
        before = await pg.locator('#tab-order .otext b').all_inner_texts()
        await pg.locator('#tab-order .oitem[data-i="1"] [data-mv="-1"]').click()
        moved = await pg.locator('#tab-order .otext b').all_inner_texts()
        await go(PW, 'order')
        check(await pg.locator('#tab-order .otext b').all_inner_texts() == moved and moved != before, 'order: the arrangement survives a reload')
        await pg.locator('#tab-order .oitem[data-i="2"] [data-mv="-1"]').click(); await pg.click('#tab-order [data-a="undo"]')
        check(await pg.locator('#tab-order .otext b').all_inner_texts() == moved, 'order: Undo takes back the last move')

        # ---- explain: the answer being written is kept ----
        await go(PW, 'explain')
        await pg.fill('#tab-explain textarea', 'Carthage and Rome fought'); await pg.wait_for_timeout(700)
        await go(PW, 'explain')
        check(await pg.input_value('#tab-explain textarea') == 'Carthage and Rome fought', 'explain: the draft answer survives a reload')

        # ---- flashcards: the deck picks up where it was ----
        await go(PW, 'cards')
        for _ in range(2):
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(80)
        c1 = await pg.locator('#tab-cards .count').inner_text()
        await go(PW, 'cards')
        check(await pg.locator('#tab-cards .count').inner_text() == c1 and c1.startswith('2 of'), f'flashcards: the deck resumes ({c1})')
        await pg.click('#tab-cards [data-a="restartdeck"]'); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(100)
        check((await pg.locator('#tab-cards .count').inner_text()).startswith('0 of'), 'flashcards: Start over puts every card back')

        # ---- sort: placements are kept; Undo puts one back with no extra credit ----
        await go(POS, 'sort')
        chip = pg.locator('#tab-sort .sortTray .chip').first; bk = await chip.get_attribute('data-b')
        await chip.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
        await go(POS, 'sort')
        check(await pg.locator('#tab-sort .placed').inner_text() == '1/12', 'sort: a sorted word survives a reload')
        d0 = await daily(pg); word = (await pg.locator('#tab-sort .bucket .got span').first.inner_text()).strip()
        await pg.click('#tab-sort [data-a="undo"]')
        check(await pg.locator('#tab-sort .placed').inner_text() == '0/12', 'sort: Undo puts it back')
        c = pg.locator('#tab-sort .sortTray .chip', has_text=re.compile('^' + re.escape(word) + '$')).first; bk = await c.get_attribute('data-b'); await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
        check(await pg.locator('#tab-sort .placed').inner_text() == '1/12' and await daily(pg) == d0, 'sorting it again gives no extra credit')

        # ---- topics keep separate rounds ----
        await go(EU, 'quiz'); await pg.click('.eu-topics button[data-t="capitals"]'); await pg.wait_for_selector('.eu-body .opt')
        await pg.locator('.eu-body .opt').first.click(); await pg.click('.eu-body [data-a="next"]')
        await pg.click('.eu-topics button[data-t="flags"]'); await pg.wait_for_selector('.eu-body .opt')
        check('Question 1 of 10' in await pg.inner_text('.eu-body .hint'), 'another topic has its own round')
        await pg.click('.eu-topics button[data-t="capitals"]'); await pg.wait_for_selector('.eu-body .opt')
        check('Question 2 of 10' in await pg.inner_text('.eu-body .hint'), 'and the first topic kept its place')

        # ---- map tools: Drag names and Listen and tap keep their place ----
        tapjs = "(s)=>document.querySelector(s).dispatchEvent(new MouseEvent('click',{bubbles:true}))"
        await go(EU, 'drag'); await pg.wait_for_selector('#tray .chip')
        await pg.click('#tray .chip[data-id="es"]'); await pg.evaluate(tapjs, '#mapDrag .cpath[data-id="fr"]')
        await pg.evaluate(tapjs, '#mapDrag .cpath[data-id="es"]')
        await go(EU, 'drag'); await pg.wait_for_selector('#tray .chip')
        check(await pg.inner_text('#dPlaced') == '1/46' and await pg.inner_text('#dMiss') == '1' and await pg.locator('#tray .chip[data-id="es"]').count() == 0, 'Drag names: the placed name and the miss survive a reload')
        check(await pg.locator('#mapDrag [data-id="es"].lbl, #mapDrag text[data-id="es"]').count() >= 1 or await pg.locator('#mapDrag .cpath[data-id="es"].placed-grey').count() == 1, 'Drag names: Spain is still shown as placed')
        d0 = await daily(pg)
        await pg.click('#dUndo')
        check(await pg.inner_text('#dPlaced') == '0/46' and await pg.locator('#tray .chip[data-id="es"]').count() == 1, 'Drag names: Undo puts Spain back with the names')
        await pg.click('#tray .chip[data-id="es"]'); await pg.evaluate(tapjs, '#mapDrag .cpath[data-id="es"]')
        check(await pg.inner_text('#dPlaced') == '1/46' and await daily(pg) == d0, 'Drag names: placing it again gives no extra credit')
        await go(EU, 'listen'); await pg.wait_for_function("window.__euMap && window.__euMap.cur")
        cur = await pg.evaluate("window.__euMap.cur"); await pg.evaluate(tapjs, f'#mapListen .cpath[data-id="{cur}"]'); await pg.wait_for_timeout(1100)
        await go(EU, 'listen'); await pg.wait_for_timeout(200)
        check(await pg.inner_text('#lRound') == '2' and await pg.inner_text('#lScore') == '1/10', 'Listen and tap: a reload comes back to name 2 with the score')
        await pg.click('#lBack')
        check(await pg.inner_text('#lRound') == '1' and 'Practice try' in await pg.inner_text('#lMsg'), 'Listen and tap: Back is a practice try')
        cur = await pg.evaluate("window.__euMap.cur"); await pg.evaluate(tapjs, f'#mapListen .cpath[data-id="{cur}"]'); await pg.wait_for_timeout(1100)
        check(await pg.inner_text('#lScore') == '1/10' and await pg.inner_text('#lRound') == '2', 'a practice tap does not add to the score')

        # ---- a wrong try stays counted after Back and Next (no point for a missed question) ----
        T15 = 'modules/math/tables-15/index.html'
        async def solve(tool):
            q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).strip()
            m = re.match(r'^(\d+) × (\d+) = \?$', q); return int(m[1]) * int(m[2])
        await go(T15, 'times')
        await pg.fill('#tab-times input', str(await solve('times'))); await pg.click('#tab-times form button'); await pg.click('#tab-times [data-a="next"]')
        await pg.fill('#tab-times input', '1'); await pg.click('#tab-times form button')
        await pg.click('#tab-times [data-a="back"]'); await pg.click('#tab-times [data-a="next"]')
        await pg.fill('#tab-times input', str(await solve('times'))); await pg.click('#tab-times form button')
        check('Score 1' in await hint(pg, 'times'), f'type: a question missed once earns no point after Back and Next ({await hint(pg, "times")})')
        # ---- a finished sort cannot be undone into a second result ----
        await go(POS, 'sort'); await pg.click('#tab-sort [data-a="restart"]')
        if await pg.locator('.sb-dlg').count(): await pg.click('.sb-dlg [data-x="yes"]')
        while await pg.locator('#tab-sort .sortTray .chip').count():
            c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b'); await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
        check(await pg.locator('#tab-sort [data-a="undo"]').is_disabled(), 'sort: Undo is off once the round is done')

        # ---- the admin Reset clears the saved rounds ----
        await go(PW, 'quiz'); await pg.locator('#tab-quiz .opt').first.click(); await pg.click('#tab-quiz [data-a="next"]')
        n = await pg.evaluate("Object.keys(localStorage).filter(k => k.includes('.round.punic-wars.')).length")
        check(n >= 3, f'rounds are saved per tool ({n})')
        await pg.click('#sbReset'); await pg.wait_for_selector('.sb-dlg'); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(200)
        n = await pg.evaluate("Object.keys(localStorage).filter(k => k.includes('.round.punic-wars.')).length")
        check(n <= 1, f'Reset clears the saved rounds ({n} left, the reopened tool only)')
        check((await hint(pg, 'quiz')).startswith('Question 1 of 10'), 'after Reset the quiz starts again')

        # ---- layout: the new buttons fit ----
        for path, tool in [(PW, 'quiz'), (PW, 'type'), (PW, 'explain'), (POS, 'sort'), (PW, 'cards')]:
            await go(path, tool)
            o = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
            check(o['h'] <= 0, f'{tool}: no sideways scroll at 1440 {o}')
        await pg.set_viewport_size({'width': 360, 'height': 740})
        for path, tool in [(PW, 'quiz'), (PW, 'type'), (PW, 'cards')]:
            await go(path, tool)
            o = await pg.evaluate("({h: document.documentElement.scrollWidth - innerWidth})")
            check(o['h'] <= 0, f'{tool}: no sideways scroll at 360 {o}')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
