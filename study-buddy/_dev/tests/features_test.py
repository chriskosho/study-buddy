"""New features from the October 2026 review: helping the youngest find their way, turning misses into practice, and more.
Run:  python3 study-buddy/_dev/tests/features_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fracfill import fill_box, fill_answer, fill_any, plain
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'}],active:'k1',pin:null,pinOffered:true}));"""

async def wrong_answer(pg, tab):
    await fill_any(pg, tab, '99999'); await pg.click(f'#tab-{tab} form button'); await pg.wait_for_timeout(40)
    await fill_any(pg, tab, '99998'); await pg.click(f'#tab-{tab} form button'); await pg.wait_for_timeout(60)

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', has_touch=False); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- hub: speakers for pre-readers, goal bar, Try next ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        mods, spk = await pg.locator('a.mod').count(), await pg.locator('.modcard > .spk').count()
        can = await pg.evaluate("SB.CAN_SPEAK")
        check(spk == 0, f'module cards have no speaker, so nothing crowds the bookmark ({spk} found)')
        w0 = await pg.evaluate("document.querySelector('.pill .goalbar i').style.width")
        await pg.evaluate("for (let i = 0; i < 5; i++) SB.credit()"); await pg.reload(); await pg.wait_for_selector('.grid')
        w1 = await pg.evaluate("document.querySelector('.pill .goalbar i').style.width")
        check(w0 == '0%' and w1 == '25%', f'the daily goal bar fills (0 then 5 of 20: {w0} then {w1})')
        await pg.goto(BASE + 'index.html#/module/volume'); await pg.wait_for_selector('.tool')
        check(await pg.locator('.tool.next').count() == 0, 'a module not started yet has no "Try next" (it starts with the study guide)')
        await pg.evaluate("SB.opened('volume', 'guide'); SB.result('volume', 'cubes', 10, 10)")
        await pg.reload(); await pg.wait_for_selector('.tool')
        nxt = await pg.locator('.tool.next h3').all_inner_texts()
        check(nxt == ['Stacks of cubes'], f'once started, the first tool not mastered (easiest first) says Try next {nxt}')
        check(await pg.locator('.tool .tname .spk').count() == (9 if can else 0), 'each tool card has a speaker')

        # ---- typed answers: review list, Try a similar one, steps, typed preview ----
        await pg.goto(BASE + 'modules/math/fractions-multiply/index.html?tool=fraction'); await pg.wait_for_selector('#tab-fraction .qtext')
        await pg.fill('#tab-fraction .fx-w', '1'); await pg.fill('#tab-fraction .fx-n', '3'); await pg.fill('#tab-fraction .fx-d', 'x4')
        check(await pg.locator('#tab-fraction .fbox .fline').count() == 1 and await pg.input_value('#tab-fraction .fx-d') == '4', 'the answer is a whole box plus a top box over a line over a bottom box, digits only')
        check(await pg.locator('#tab-fraction .fbox input').count() == 3, 'three boxes: whole, top, bottom')
        await wrong_answer(pg, 'fraction')
        check(await pg.locator('#tab-fraction [data-a="similar"]').is_visible(), 'after a miss, "Try a similar one" is offered')
        steps = await pg.locator('#tab-fraction .stepbtn').count()
        why = await pg.inner_text('#tab-fraction .why')
        check(steps == 1 or len(re.findall(r'[.!?](?:\s|$)', why)) < 3, f'after a miss, the explanation comes step by step ({steps})')
        if steps:
            await pg.click('#tab-fraction .stepbtn'); check(len(await pg.inner_text('#tab-fraction .why')) > len(why) - 25, 'Show the next step adds the next part')
        hint0 = await pg.inner_text('#tab-fraction .roundbar .hint')
        await pg.click('#tab-fraction [data-a="similar"]'); await pg.wait_for_selector('#tab-fraction .qtext')
        hint1 = await pg.inner_text('#tab-fraction .roundbar .hint')
        check('Practice' in hint1 and 'Question 1 of 10' in hint0, f'the similar one is practice and does not count ({hint1!r})')
        await wrong_answer(pg, 'fraction'); check(await pg.locator('#tab-fraction [data-a="similar"]').count() == 0, 'a practice question does not offer another similar one')
        await pg.click('#tab-fraction [data-a="next"]'); await pg.wait_for_selector('#tab-fraction .qtext')
        check('Question 2 of 10' in await pg.inner_text('#tab-fraction .roundbar .hint'), 'the round goes on at question 2 of 10')
        for k in range(9):
            await wrong_answer(pg, 'fraction'); await pg.click('#tab-fraction [data-a="next"]'); await pg.wait_for_timeout(60)
        await pg.wait_for_selector('#tab-fraction .result')
        res = await pg.inner_text('#tab-fraction .result')
        check('0 out of 10' in res, f'the score counts only the 10 real questions ({res[:30]!r})')
        check(await pg.locator('#tab-fraction details.review li').count() == 10, 'the result screen lists the 10 to practice (folded away)')
        ov = await pg.evaluate("document.documentElement.scrollHeight - innerHeight")
        check(ov <= 0, f'the result screen still fits at 1440x900 ({ov})')

        # ---- quiz: number keys, review list ----
        await pg.goto(BASE + 'modules/roots/greek-latin-roots/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz .opt')
        await pg.keyboard.press('2'); await pg.wait_for_timeout(80)
        check(await pg.locator('#tab-quiz .opt:disabled').count() == 4, 'pressing 2 answers with the second choice')
        check(await pg.locator('#tab-quiz .optkey').count() == 4, 'choices show their number keys')

        # ---- flashcards: go again with just the missed ----
        await pg.goto(BASE + 'modules/roots/greek-latin-roots/index.html?tool=cards'); await pg.wait_for_selector('#tab-cards .fcard')
        total = int(re.search(r'of (\d+)', await pg.inner_text('#tab-cards .count')).group(1))
        await pg.click('#tab-cards [data-a="again"]'); await pg.wait_for_timeout(600)
        for k in range(total + 3):
            if await pg.locator('#tab-cards [data-a="again-missed"]').count(): break
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(560)
        check(await pg.locator('#tab-cards [data-a="again-missed"]').count() == 1, 'the finished deck offers "Just the one I missed"')
        check(await pg.evaluate("document.querySelector('#tab-cards .fcard').getAttribute('role')") is None, 'the finished card is no longer one big button around its buttons')
        await pg.focus('#tab-cards [data-a="again-missed"]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        check('of 1' in await pg.inner_text('#tab-cards .count'), 'and that deck has just the missed card')

        # ---- Phonograms: Hear it, tap it ----
        await pg.goto(BASE + 'modules/english/phonograms/index.html?tool=hear'); await pg.wait_for_selector('#tab-hear .opt')
        items = await pg.evaluate("window.__phTest.hear")
        same = [x for x in items if x['a'] in x['wrong']]
        check(len(items) == 10 and not same and all(x['audio'].endswith('.mp3') for x in items), 'Hear it, tap it: 10 questions, each with a recorded sound and 3 other phonograms')
        check(await pg.locator('#tab-hear .spk[data-sb-audio]').count() == 1, 'the speaker plays the recorded sound')
        for k in range(10):
            a = items[k]['a']
            await pg.evaluate("a => { const b = [...document.querySelectorAll('#tab-hear .opt')].find(x => x.dataset.v !== a && !x.disabled); b && b.click(); }", a); await pg.wait_for_timeout(60)
            nx = pg.locator('#tab-hear [data-a="next"]')
            if await nx.count() and await nx.is_visible(): await nx.click()
            await pg.wait_for_timeout(60)
        await pg.wait_for_selector('#tab-hear details.review')
        await pg.click('#tab-hear details.review summary'); await pg.wait_for_timeout(80)
        nrev = await pg.locator('#tab-hear details.review li').count(); nspk = await pg.locator('#tab-hear details.review li .spk[data-sb-audio]').count(); check(nrev >= 1 and nspk == nrev, f'each missed sound in the list can be heard again ({nspk} of {nrev})')
        ov = await pg.evaluate("document.documentElement.scrollHeight - innerHeight")
        check(ov <= 0, f'the open list of 10 still fits at 1440x900 ({ov})')

        # ---- Ham: practice a topic from the results ----
        await pg.goto(BASE + 'modules/other/ham-technician/index.html?tool=exam'); await pg.wait_for_selector('[data-a="start"]')
        await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        await pg.evaluate("(() => { const E = window.__hamTest.exam(); E.qs.forEach((q, i) => { E.ans[i] = (q.a + 1) % 4; }); E.i = 34; E.ans[34] = null; })()")
        await pg.evaluate("document.querySelector('.hopt').click()"); await pg.wait_for_timeout(150)
        nb = pg.locator('[data-a="next"]')
        if await nb.count(): await nb.click()
        await pg.wait_for_selector('[data-prac]')
        await pg.click('[data-prac] >> nth=1'); await pg.wait_for_selector('#tab-cards .secsel')
        await pg.goto(BASE + 'modules/other/ham-technician/index.html?tool=exam'); await pg.wait_for_selector('[data-a="last"]')
        await pg.click('[data-a="last"]'); await pg.wait_for_selector('[data-prac]')
        check('Mock exam results' in await pg.inner_text('#tab-exam h2'), 'after practicing, the last exam results can be opened again')
        await pg.goto(BASE + 'modules/other/ham-technician/index.html?tool=cards'); await pg.wait_for_selector('#tab-cards .secsel')
        sec = await pg.evaluate("document.querySelector('.secsel').value")
        check(sec.startswith('T2') or sec.startswith('T1'), f'Practice opens the flashcards at that topic ({sec})')

        # ---- maps: the ones that took more than one try ----
        await pg.goto(BASE + 'modules/geography/south-america/index.html?tool=find'); await pg.wait_for_selector('#fStart')
        await pg.click('#fStart'); await pg.wait_for_timeout(100)
        await pg.evaluate("(() => { const wrong = C.find(c => c.id !== FD.target).id; FD.svg._paths[wrong].dispatchEvent(new MouseEvent('click', { bubbles: true })); fdEnd(); })()")
        check(await pg.locator('#fMsg .fpractice').count() == 1 and await pg.locator('#mapFind .cpath.target').count() >= 1, 'Find it outlines the countries to practice and names them')

        # ---- handwriting: Show me how ----
        await pg.goto(BASE + 'modules/english/handwriting/index.html?tool=letters'); await pg.wait_for_selector('[data-a="demo"]'); await pg.wait_for_timeout(400)
        await pg.click('[data-a="demo"]'); await pg.wait_for_timeout(700)
        px = await pg.evaluate("(() => { const c = document.querySelector('.hw-demo'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })()")
        check(px > 200, f'Show me how draws the letter stroke by stroke ({px} px)')
        await pg.click('.hw-strip [data-i="2"]'); await pg.wait_for_timeout(80)
        check(await pg.locator('[data-a="demo"]').is_enabled(), 'choosing another letter mid-demo hands the Show me how button back')
        await pg.click('[data-a="demo"]'); await pg.wait_for_timeout(300)
        miss = await pg.evaluate("(() => { const S = window.HW_STROKES, out = []; for (const st of ['print', 'cursive']) for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') { const v = S[st][l]; if (!v || !v.length || v.some(s => !s.length || s.some(p => p[0] < -0.05 || p[0] > 1.05 || p[1] < -0.05 || p[1] > 1.05))) out.push(st + ' ' + l); } return out; })()")
        check(not miss, f'every letter has stroke paths inside its box, in print and cursive {miss[:6]}')
        await pg.wait_for_timeout(5000)

        # ---- scratch pad: work shown with a missed question, share where possible ----
        await pg.goto(BASE + 'modules/math/volume/index.html?tool=cubes'); await pg.wait_for_selector('#sbPad'); await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        box = await pg.locator('.sbp-ink').bounding_box(); await pg.mouse.move(box['x'] + 40, box['y'] + 40); await pg.mouse.down(); await pg.mouse.move(box['x'] + 140, box['y'] + 90, steps=4); await pg.mouse.up()
        for k in range(10):
            await wrong_answer(pg, 'cubes'); await pg.click('#tab-cubes [data-a="next"]'); await pg.wait_for_timeout(50)
        await pg.wait_for_selector('#tab-cubes .result')
        check(await pg.locator('#tab-cubes .review img.revpic').count() >= 1, 'missed questions keep a picture of the scratch pad work')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
