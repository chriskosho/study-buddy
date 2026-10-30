"""Newton and His Laws test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks results reach the hub, checks the
Explain it grading accepts the study guide's own answer and rejects a weak one, and checks layout:
1440x900 with no scroll on every tool, 360px phone with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/newton_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/science/newton-laws/index.html'
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
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")   # measure after fonts and layout settle
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    TOOLS = ['guide', 'lab', 'cards', 'quiz', 'sort', 'type', 'explain']
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/science'); await pg.wait_for_selector('.modcard, .modrow')
        check('Newton and His Laws' in await pg.inner_text('#mArea'), 'Science shows Newton and His Laws')

        # study guide: every tab opens and fits, wording kept, historians note
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        for g in ['newton', 'laws', 'spq', 'table', 'test']:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(80)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide tab {g} fits 1440x900 {o}')
        await pg.click('.gtabs button[data-g="newton"]')
        t = await pg.locator('.gbody').inner_text()
        check('Isaac Newton was the first person to discover the force of gravity.' in t and 'He lived from 1642 to 1726.' in t, "guide keeps the book's wording")
        check(await pg.locator('.histsay a[href*="wikipedia.org"]').count() == 1, 'the apple story has a Historians say note with a Wikipedia link')
        await pg.click('.gtabs button[data-g="laws"]'); t = await pg.locator('.gbody').inner_text()
        check('For every action, there is an equal and opposite reaction.' in t and 'directly proportional to the object’s mass' in t, 'three laws in the book\'s words')
        await pg.click('.gtabs button[data-g="table"]'); check(await pg.locator('.tbl tbody tr').count() == 3, 'Table 5.1 has its three rows')
        await pg.click('.gtabs button[data-g="test"]'); check('not in the lesson text' in await pg.locator('.note').inner_text(), 'review and Quiz 2 facts are marked as not in the lesson text')

        # data sanity
        check(await pg.evaluate("QUIZ.every(x => !x.wrong.includes(x.a) && x.wrong.every(w => w) && new Set(x.wrong).size === x.wrong.length)"), 'no quiz answer repeats among its wrong options')
        check(await pg.evaluate("new Set(QUIZ.map(x => x.q)).size === QUIZ.length"), 'every quiz question is different')
        check(await pg.evaluate("SORTS.every(s => s.items.every(([t, b]) => s.buckets.includes(b)) && s.buckets.every(b => s.items.some(([t, k]) => k === b)))"), 'every sort item belongs to a real group and every group has an item')
        check(await pg.evaluate("TYPE.every(t => (t.q.match(/_{3,}/g) || []).length === 1)"), 'every type-the-answer sentence has exactly one blank')
        check(await pg.evaluate("EXPLAIN.every(x => { const g = SBT.gradeExplain(x.model, x); return g.perfect; })"), 'every Explain it model answer passes its own checks')

        # flashcards practice only
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards [data-a="knew"]')
        for i in range(await pg.evaluate('CARDS.length')): await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(30)
        rec = await pg.evaluate("SB.toolRecord('newton-laws','cards')"); check(not rec or rec.get('best') is None, f'flashcards are practice only {rec}')

        # quiz: Random 10 and Full
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        nq = await pg.evaluate('QUIZ.length')
        check(labels[0].startswith('Random') and labels[1] == f'Full ({nq})', f'quiz has Random and Full switch {labels}')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt'); q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (QUIZ.find(x => x.q === q) || {}).a", q)
            check(ans is not None, f'quiz question in data: {q[:40]}') if ans is None else None
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]'); await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('newton-laws','quiz')"); check(rec and rec['best'] == 10 and not rec.get('fullBest'), f'random 10 of 10 does not count as Full {rec}')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes'); await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(nq):
            await pg.wait_for_selector('#tab-quiz .opt'); q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (QUIZ.find(x => x.q === q) || {}).a", q)
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]'); await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('newton-laws','quiz')"); check(rec and rec.get('fullBest') == nq, f'Full quiz {nq} of {nq} {rec}')

        # sort: every set, all right
        await pg.goto(base + M + '?tool=sort'); await pg.wait_for_selector('#tab-sort .chip')
        for s in ['laws', 'spq', 'nature']:
            await pg.click(f'#tab-sort .seg button[data-s="{s}"]')
            while await pg.locator('#tab-sort .sortTray .chip').count():
                c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
                await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
            check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), f'sort set {s} completes')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # type the answer
        await pg.goto(base + M + '?tool=type')
        for i in range(10):
            await pg.wait_for_selector('#tab-type input')
            q = await pg.evaluate("() => document.querySelector('#tab-type .qtext').textContent.trim()")
            ans = await pg.evaluate("q => { const n = s => s.replace(/_{3,}/g, '').replace(/\\s+/g, ' ').trim(); const f = TYPE.find(t => n(t.q) === n(q)); return f ? f.a[0] : null; }", q)
            check(ans is not None, f'type question in data: {q[:40]}') if ans is None else None
            await pg.fill('#tab-type input', ans or ''); await pg.click('#tab-type form button'); await pg.click('#tab-type [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('newton-laws','type')"); check(rec and rec['best'] == 10, f'type the answer 10 of 10 {rec}')

        # explain
        await pg.goto(base + M + '?tool=explain')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer'); q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'he was a man with a tree'); await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'weak answer is not accepted')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')

        # experiments: each one runs and shows what the lesson says
        await pg.goto(base + M + '?tool=lab'); await pg.wait_for_selector('#tab-lab .lsvg')
        async def done(sel='#tab-lab [data-a=go]'): await pg.wait_for_function("s => !document.querySelector(s).disabled", arg=sel, timeout=15000)
        bx = "() => +document.querySelector('#tab-lab .ball').getAttribute('transform').match(/translate\\(([-\\d.]+)/)[1]"
        check('at rest' in (await pg.locator('#tab-lab .lmsg').inner_text()).lower(), 'ball starts at rest')
        await pg.click('#tab-lab [data-s=ice]'); await pg.click('#tab-lab [data-a=go]'); await pg.wait_for_timeout(300)
        check('In motion' in await pg.locator('#tab-lab .stlbl').text_content() and await pg.evaluate(bx) > 41, 'kicked ball is in motion')
        await done(); check('goalpost' in await pg.locator('#tab-lab .lmsg').inner_text(), 'on ice the ball keeps going until the goalpost stops it')
        await pg.click('#tab-lab [data-s=sand]'); await pg.click('#tab-lab [data-a=go]'); await done()
        xs = await pg.evaluate(bx); check('friction' in await pg.locator('#tab-lab .lmsg').inner_text() and xs < 400, f'on sand friction stops it early ({xs:.0f})')
        await pg.click('#tab-lab [data-a=reset]'); check(await pg.evaluate(bx) == 40, 'Put it back resets the ball')
        await pg.click('#tab-lab .gtabs button[data-e=push]')
        pos = "() => +document.querySelector('#tab-lab .obj').getAttribute('transform').match(/translate\\(([-\\d.]+)/)[1]"
        await pg.click('#tab-lab [data-t=toy]'); await pg.fill('#tab-lab input[type=range]', '4'); await pg.click('#tab-lab [data-a=go]'); await done(); toy = await pg.evaluate(pos)
        await pg.click('#tab-lab [data-t=car]'); await pg.fill('#tab-lab input[type=range]', '4'); await pg.click('#tab-lab [data-a=go]'); await done(); car = await pg.evaluate(pos)
        check(toy > car + 100, f'the same push moves the toy car farther than the full-sized car ({toy:.0f} vs {car:.0f})')
        check('heavier' in (await pg.locator('#tab-lab .lmsg').inner_text()).lower(), 'the heavy object message explains heavier needs more force')
        w1 = await pg.evaluate("document.querySelector('#tab-lab .b1').style.width"); await pg.fill('#tab-lab input[type=range]', '9'); w2 = await pg.evaluate("document.querySelector('#tab-lab .b1').style.width")
        check(w1 != w2, 'the push slider moves the Your push bar')
        await pg.click('#tab-lab .gtabs button[data-e=rocket]')
        arrow = "() => [...document.querySelectorAll('#tab-lab .arrs .arw line')].map(l => Math.hypot(l.getAttribute('x2') - l.getAttribute('x1'), l.getAttribute('y2') - l.getAttribute('y1')))"
        a = await pg.evaluate(arrow); check(len(a) == 2 and abs(a[0] - a[1]) < 0.5, f'the two rocket arrows are equal {a}')
        await pg.fill('#tab-lab input[type=range]', '5'); a2 = await pg.evaluate(arrow); check(abs(a2[0] - a2[1]) < 0.5 and a2[0] > a[0], 'a stronger engine makes both arrows longer, still equal')
        await pg.click('#tab-lab [data-a=go]'); await pg.wait_for_timeout(600)
        check('translate(0,-' in await pg.get_attribute('#tab-lab .rkt', 'transform'), 'the rocket rises')
        await done(); check('equal and opposite' in await pg.locator('#tab-lab .lmsg').inner_text(), 'rocket ends with the third law')
        check('translate(0,-0.0)' in await pg.get_attribute('#tab-lab .rkt', 'transform') or 'translate(0,0.0)' in await pg.get_attribute('#tab-lab .rkt', 'transform'), 'the rocket is back on the pad after flying off')
        await pg.click('#tab-lab .gtabs button[data-e=size]')
        bs0 = await pg.evaluate("document.querySelector('#tab-lab .bf').style.width"); await pg.fill('#tab-lab .rs', '9')
        check(await pg.evaluate("document.querySelector('#tab-lab .bf').style.width") != bs0, 'bigger system, bigger force bar')
        sp0 = await pg.evaluate("document.querySelector('#tab-lab .bs').style.width"); await pg.fill('#tab-lab .rm', '9')
        check(float((await pg.evaluate("document.querySelector('#tab-lab .bs').style.width"))[:-1]) < float(sp0[:-1]), 'more mass, lower speed bar')
        rec = await pg.evaluate("SB.toolRecord('newton-laws','lab')"); check(not rec or rec.get('best') is None, f'experiments are practice only {rec}')
        # reduced motion: the demos still animate (the student presses the button), and the rocket stays in view and returns to the pad
        rc = await b.new_context(viewport={'width': 360, 'height': 780}, service_workers='block', reduced_motion='reduce'); await rc.add_init_script(INIT); rp = await rc.new_page()
        await rp.goto(base + M + '?tool=lab'); await rp.wait_for_selector('#tab-lab .lsvg'); await rp.click('#tab-lab [data-s=ice]'); await rp.click('#tab-lab [data-a=go]'); await rp.wait_for_timeout(250)
        check('goalpost' not in await rp.locator('#tab-lab .lmsg').inner_text() and 'In motion' in await rp.locator('#tab-lab .stlbl').text_content(), 'with reduced motion the ball still rolls on screen')
        await rp.click('#tab-lab .gtabs button[data-e=rocket]'); await rp.click('#tab-lab [data-a=go]'); await rp.wait_for_timeout(500)
        ry = await rp.evaluate("-parseFloat(document.querySelector('#tab-lab .rkt').getAttribute('transform').match(/,(-?[\\d.]+)/)[1])")
        check(0 < ry < 150 and await rp.locator('#tab-lab .puff').count() == 0, f'reduced motion: the rocket rises gently, with no smoke ({ry:.0f})')
        await rp.wait_for_function("() => !document.querySelector('#tab-lab [data-a=go]').disabled", timeout=15000)
        ry = await rp.evaluate("-parseFloat(document.querySelector('#tab-lab .rkt').getAttribute('transform').match(/,(-?[\\d.]+)/)[1])")
        check(abs(ry) < 1 and 'equal and opposite' in await rp.locator('#tab-lab .lmsg').inner_text(), 'the rocket is back on the pad when it finishes, with the third law shown')
        await rc.close()

        # layout
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.goto(base + M); await pg.click('.gtabs button[data-g="table"]'); o = await overflow(pg); check(o['h'] <= 0, f'phone Table 5.1: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .opt'); await pg.click('#tab-quiz .opt >> nth=0'); await pg.wait_for_timeout(100)
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 quiz after answering: no scroll {o}')
        for vw, vh in [(360, 780), (1440, 900)]:
            await pg.set_viewport_size({'width': vw, 'height': vh})
            for e in ['ball', 'push', 'rocket', 'size']:
                await pg.goto(base + M + '?tool=lab'); await pg.wait_for_selector('#tab-lab .gtabs'); await pg.click(f'#tab-lab .gtabs button[data-e={e}]'); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0 and (vw == 360 or o['v'] <= 0), f'experiment {e} fits {vw}x{vh} {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        # phone: the rocket scene is drawn large enough to read
        await pg.set_viewport_size({'width': 360, 'height': 780}); await pg.goto(base + M + '?tool=lab'); await pg.wait_for_selector('#tab-lab .gtabs'); await pg.click('#tab-lab .gtabs button[data-e=rocket]'); await pg.wait_for_timeout(150)
        px = await pg.evaluate("(() => { const s = document.querySelector('#tab-lab .lsvg'), t = document.querySelector('#tab-lab .arrs .lbl'); return parseFloat(getComputedStyle(t).fontSize) * s.getBoundingClientRect().width / 400; })()")
        check(px >= 11, f'phone rocket labels are readable ({px:.1f}px)')
        h = await pg.evaluate("document.querySelector('#tab-lab .lsvg').getBoundingClientRect().height"); check(h >= 200, f'phone rocket scene is tall enough ({h:.0f}px)')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
