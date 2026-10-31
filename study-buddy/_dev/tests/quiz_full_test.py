"""Quiz Random sample / Full test (Playwright + Chromium).
Every module Quiz tab has a Random 10 / Full switch; Full asks every question once; a Full result is saved
as its own best, and mastery needs the Full quiz.
Run:  python3 study-buddy/_dev/tests/quiz_full_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),200)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""

MODS = ['history/punic-wars', 'history/ancient-rome', 'science/weather', 'science/newton-laws', 'science/planets', 'science/periodic-table',
        'english/black-beauty', 'english/black-beauty-guide', 'english/phonograms', 'geography/us-states', 'geography/europe', 'geography/africa', 'geography/asia', 'geography/north-america', 'geography/oceania', 'geography/world', 'geography/oceans']
RUN = "(() => { let n = 0; while (!document.querySelector('.result') && n++ < 1000) { document.querySelector('.opt').click(); const x = document.querySelector('[data-a=next]'); if (x) x.click(); } return !!document.querySelector('.result'); })()"


MATH = ['place-value', 'order-of-operations', 'fractions-add-sub', 'fractions-multiply', 'fractions-divide', 'measurement', 'volume']
async def math_checks(pg, base):
    for m in MATH:
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await pg.goto(base + f'modules/math/{m}/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[0].startswith('Random') and labels[1].startswith('One of each ('), f'math {m}: Random and One of each switch {labels}')
        n = int(labels[1].split('(')[1].rstrip(')'))
        check(n >= 3, f'math {m}: One of each has a problem for every kind ({n})')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        check(f'of {n}' in await pg.locator('#tab-quiz .roundbar .hint').inner_text(), f'math {m}: One of each runs {n} problems')
        o = await pg.evaluate("document.fonts.ready.then(() => ({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth}))")
        check(o['v'] <= 0 and o['h'] <= 0, f'math {m}: quiz fits 1440x900 {o}')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.wait_for_timeout(150)
        o = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
        check(o <= 0, f'math {m}: quiz has no sideways scroll at 360px ({o})')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await pg.goto(base + f'modules/math/{m}/index.html?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        txt = await pg.locator('#tab-cards').inner_text()
        check('rule or fact' in txt.lower(), f'math {m}: has a rules and facts flashcard deck')

async def other_checks(pg, base):
    # Greek and Latin Roots: every root at the level
    await pg.goto(base + 'modules/roots/greek-latin-roots/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
    labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
    check(len(labels) == 2 and labels[1].startswith('Full ('), f'roots: Random and Full switch {labels}')
    n = int(labels[1].split('(')[1].rstrip(')'))
    nroots = await pg.evaluate("ROOTS.filter(r => r.level === 'easy').length")
    check(n == nroots, f'roots: Full asks every root at the level ({n} of {nroots})')
    # Ham Radio: Full is every question in the chosen group
    await pg.goto(base + 'modules/other/ham-technician/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz .hsel')
    check(await pg.locator('#tab-quiz .qmodes').count() == 0, 'ham: no Full for every group at once')
    gid = await pg.evaluate("HAM.GROUPS[0].id"); n = await pg.evaluate("HAM.Q.filter(q => q.g === HAM.GROUPS[0].id).length")
    await pg.select_option('#tab-quiz .hsel', gid); await pg.wait_for_selector('#tab-quiz .qmodes')
    labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
    check(labels[1] == f'Full ({n})', f'ham: Full is every question in the group {labels}')
    await pg.click('#tab-quiz .qmodes button[data-m="full"]')
    check(await pg.evaluate(RUN), 'ham: Full finishes')
    check(f'out of {n}' in await pg.locator('#tab-quiz .result').inner_text(), f'ham: result is out of {n}')

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        for m in MODS:
            await pg.goto(base + f'modules/{m}/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz')
            if m.endswith('us-states'):
                await pg.click('.us-topics button[data-t="capitals"]')
            if m.split('/')[1] in ('europe', 'africa', 'asia', 'north-america', 'oceania', 'world', 'oceans'):
                await pg.click('.eu-topics button[data-t="capitals"], .af-topics button[data-t="capitals"], .as-topics button[data-t="capitals"], .na-topics button[data-t="capitals"], .oc-topics button[data-t="capitals"], .wd-topics button[data-t="capitals"], .oce-topics button[data-t="map"]')
            await pg.wait_for_selector('.qmodes')
            labels = await pg.locator('.qmodes button').all_inner_texts()
            check(len(labels) == 2 and labels[0].startswith('Random') and labels[1].startswith('Full ('), f'{m}: has Random and Full switch {labels}')
            n = int(labels[1].split('(')[1].rstrip(')'))
            check(n > 10, f'{m}: Full has more than 10 questions ({n})')
            await pg.click('.qmodes button[data-m="full"]')
            check(await pg.locator('.hint').first.inner_text() != '' and f'of {n}' in await pg.locator('.roundbar .hint').inner_text(), f'{m}: Full runs {n} questions')
            check(await pg.evaluate(RUN), f'{m}: Full finishes')
            check(f'out of {n}' in await pg.locator('.result').inner_text(), f'{m}: result is out of {n}')
            rec = await pg.evaluate("SB.toolRecord('" + m.split('/')[1] + "', 'quiz')")
            check(rec is not None and rec['fullMax'] == n, f'{m}: Full best saved as its own record')
        await math_checks(pg, base)
        await other_checks(pg, base)
        # mastery follows the Full quiz
        r = await pg.evaluate("[SB.isMastered({kind:'quiz', full:true}, {best:10, max:10}), SB.isMastered({kind:'quiz', full:true}, {best:10, max:10, fullBest:8, fullMax:10}), SB.isMastered({kind:'quiz', full:true}, {best:10, max:10, fullBest:7, fullMax:10}), SB.isMastered({kind:'quiz'}, {best:8, max:10})]")
        check(r == [False, True, False, True], f'mastery uses the Full best for tools with a Full quiz {r}')
        await b.close()
    check(not errors, 'no page errors ' + str(errors[:3]))
    print('\nFAILED: ' + str(len(fails)) if fails else '\nALL PASSED')
    sys.exit(1 if fails else 0)
asyncio.run(main())
