"""Weather test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks results reach the hub, checks the
Explain it grading accepts the study guide's own answer and rejects a weak one, and checks layout:
1440x900 with no scroll on every tool, 360px phone with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/weather_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/science/weather/index.html'
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
    TOOLS = ['guide', 'cards', 'quiz', 'sort', 'label', 'graph', 'type', 'explain']
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/science'); await pg.wait_for_selector('.modcard, .modrow')
        check('Weather' in await pg.inner_text('#mArea'), 'Science shows Weather')

        # study guide: every tab opens and fits
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        for g in ['l1', 'l2', 'l3', 'l45', 'kinds', 'test']:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(80)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide tab {g} fits 1440x900 {o}')
        await pg.click('.gtabs button[data-g="l1"]')
        t = await pg.locator('.gbody').inner_text()
        check('The state of the atmosphere at a certain place and time.' in t and 'How far something is from the equator.' in t, "guide keeps the notes' wording")
        await pg.click('.gtabs button[data-g="kinds"]'); check(await pg.locator('.kind').count() == 6, 'six kinds of weather with pictures')
        await pg.click('.gtabs button[data-g="test"]'); check('not in your notes' in await pg.locator('.note').inner_text(), 'practice-test facts are marked as not in the notes')

        # data sanity
        check(await pg.evaluate("QUIZ.every(x => !x.wrong.includes(x.a) && x.wrong.every(w => w))"), 'no quiz answer repeats among its wrong options')
        check(await pg.evaluate("SORTS.every(s => s.items.every(([t, b]) => s.buckets.includes(b)) && s.buckets.every(b => s.items.some(([t, k]) => k === b)))"), 'every sort item belongs to a real group and every group has an item')
        check(await pg.evaluate("TYPE.every(t => (t.q.match(/_{3,}/g) || []).length === 1)"), 'every type-the-answer sentence has exactly one blank')

        # flashcards practice only
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards [data-a="knew"]')
        for i in range(await pg.evaluate('CARDS.length')): await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(30)
        rec = await pg.evaluate("SB.toolRecord('weather','cards')"); check(not rec or rec.get('best') is None, f'flashcards are practice only {rec}')

        # quiz: lookup, pictures by their label
        await pg.goto(base + M + '?tool=quiz')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt'); q = await pg.locator('#tab-quiz .qtext').inner_text()
            if await pg.locator('#tab-quiz .qpic svg').count():
                lab = await pg.get_attribute('#tab-quiz .qpic svg', 'aria-label'); ans = await pg.evaluate("l => KINDS.find(k => l.toLowerCase().includes(k.toLowerCase()))", lab)
            else: ans = await pg.evaluate("q => (QUIZ.find(x => x.q === q) || {}).a", q)
            check(ans is not None, f'quiz question in data: {q[:40]}') if ans is None else None
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]'); await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('weather','quiz')"); check(rec and rec['best'] == 10, f'quiz 10 of 10 {rec}')

        # sort: every set, all right
        await pg.goto(base + M + '?tool=sort'); await pg.wait_for_selector('#tab-sort .chip')
        for s in ['clouds', 'cycle', 'tools', 'hemi']:
            await pg.click(f'#tab-sort .seg button[data-s="{s}"]')
            while await pg.locator('#tab-sort .sortTray .chip').count():
                c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
                await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
            check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), f'sort set {s} completes')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # label the diagram: the right letter for each part, from the data
        await pg.goto(base + M + '?tool=label')
        for i in range(8):
            await pg.wait_for_selector('#tab-label .opt'); q = await pg.locator('#tab-label .qtext').inner_text()
            ans = await pg.evaluate("q => { const f = [...EARTH, ...CYCLE].find(([k, n]) => q.toLowerCase().includes(n.toLowerCase())); return f ? f[0] : null; }", q)
            check(ans is not None, f'label question in data: {q}') if ans is None else None
            await pg.click(f'#tab-label .opt[data-v="{ans}"]'); await pg.click('#tab-label [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('weather','label')"); check(rec and rec['best'] == 8, f'label the diagram 8 of 8 {rec}')

        # read the graph: read the values from the graph itself
        await pg.goto(base + M + '?tool=graph')
        for i in range(6):
            await pg.wait_for_selector('#tab-graph .opt'); q = await pg.locator('#tab-graph .qtext').inner_text()
            lab = await pg.get_attribute('#tab-graph svg.graph', 'aria-label')
            temps = [int(x.split(', ')[1]) for x in lab.split(': ')[1].split('; ')]
            if 'highest' in q: ans = 'Day ' + str(temps.index(max(temps)) + 1)
            elif 'lowest' in q: ans = 'Day ' + str(temps.index(min(temps)) + 1)
            else: ans = str(temps[int(q.split('day ')[1].rstrip('?')) - 1]) + ' degrees'
            await pg.click(f'#tab-graph .opt[data-v="{ans}"]'); await pg.click('#tab-graph [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('weather','graph')"); check(rec and rec['best'] == 6, f'read the graph 6 of 6 {rec}')

        # type the answer
        await pg.goto(base + M + '?tool=type')
        for i in range(10):
            await pg.wait_for_selector('#tab-type input')
            q = await pg.evaluate("() => document.querySelector('#tab-type .qtext').textContent.trim()")
            ans = await pg.evaluate("q => { const n = s => s.replace(/_{3,}/g, '').replace(/\\s+/g, ' ').trim(); const f = TYPE.find(t => n(t.q) === n(q)); return f ? f.a[0] : null; }", q)
            check(ans is not None, f'type question in data: {q[:40]}') if ans is None else None
            await pg.fill('#tab-type input', ans or ''); await pg.click('#tab-type form button'); await pg.click('#tab-type [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('weather','type')"); check(rec and rec['best'] == 10, f'type the answer 10 of 10 {rec}')

        # explain
        await pg.goto(base + M + '?tool=explain')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer'); q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'it is sunny sometimes'); await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'weak answer is not accepted')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')

        # layout
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')
        # the picture and diagram questions fit with options showing
        for t in ['label', 'graph', 'quiz']:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_selector('#tab-' + t + ' .opt'); await pg.click(f'#tab-{t} .opt >> nth=0'); await pg.wait_for_timeout(100)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t} after answering (explanation and Next showing): no scroll {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
