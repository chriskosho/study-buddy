"""Ancient Rome test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks results reach the hub, checks the
Explain it grading accepts the study guide's own answer and rejects a weak one, and checks layout:
1440x900 with no scroll on every tool, 360px phone with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/rome_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/history/ancient-rome/index.html'
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
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/history'); await pg.wait_for_selector('a.mod')
        txt = await pg.locator('a.mod').inner_text()
        check('Ancient Rome' in txt and 'Insane' in txt, 'History shows Ancient Rome, Easy to Insane')

        # study guide: every section opens and fits
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        for g in ['founding', 'religion', 'gov', 'republic', 'explain']:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(80)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide section {g} fits 1440x900 {o}')
        await pg.click('.gtabs button[data-g="religion"]')
        check(await pg.locator('.god').count() == 12 and 'class chart' in await pg.locator('.note').inner_text(), 'gods shown with the check-your-chart note')

        # flashcards: whole terms deck
        await pg.click('nav.tabs button[data-tab="cards"]')
        n = await pg.evaluate('CARDS.length')
        for i in range(n):
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(40)
        rec = await pg.evaluate("SB.toolRecord('ancient-rome','cards')")
        check(not rec or rec.get('best') is None, f'flashcards deck of {n} is practice only {rec}')

        # quiz: answer every question correctly by lookup
        await pg.click('nav.tabs button[data-tab="quiz"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt')
            q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("""q => { const f = QUIZ.find(x => x.q === q); if (f) return f.a;
              const g = GODS.find(x => q.includes(x.attr.charAt(0).toLowerCase() + x.attr.slice(1))); return g ? g.name : null; }""", q)
            check(ans is not None, f'quiz question found in data: {q[:50]}') if ans is None else None
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]')
            await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('ancient-rome','quiz')")
        check(rec and rec['best'] == 10, f'quiz 10 of 10 {rec}')

        # sort: each set, all right
        await pg.click('nav.tabs button[data-tab="sort"]')
        for s in ['gov', 'parts', 'classes']:
            await pg.click(f'#tab-sort .seg button[data-s="{s}"]')
            while await pg.locator('#tab-sort .sortTray .chip').count():
                c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
                await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
            check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), f'sort set {s} completes')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # fill it in: right answers, plus one typo that should count as close
        await pg.click('nav.tabs button[data-tab="blanks"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-blanks input')
            s = await pg.evaluate("() => document.querySelector('#tab-blanks .qtext').textContent.replace(/_+/, '___').trim()")
            ans = await pg.evaluate("s => { const f = BLANKS.find(x => x.s === s); return f ? f.a[0] : null; }", s)
            check(ans is not None, f'blank found: {s}') if ans is None else None
            typed = ans
            if i == 0 and len(ans) >= 6: typed = ans[:-2] + ans[-1]          # drop one letter
            await pg.fill('#tab-blanks input', typed); await pg.click('#tab-blanks form button')
            await pg.click('#tab-blanks [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('ancient-rome','blanks')")
        check(rec and rec['best'] == 10, f'fill it in 10 of 10 (one-letter slip accepted) {rec}')

        # explain: weak answer first fails; model answers pass
        await pg.click('nav.tabs button[data-tab="explain"]')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'a republic is good because it has rules and stuff')
                await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'weak answer is not accepted')
                check(await pg.locator('#tab-explain .checks li.no').count() >= 2, 'weak answer shows missing ideas')
                await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), 'study guide answer passes the check')
            else:
                await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('ancient-rome','explain')")
        check(rec and rec['best'] == 4, f'explain counts first checks only (4 of 5) {rec}')

        await pg.goto(base + 'index.html#/module/ancient-rome'); await pg.wait_for_selector('.tool')
        m = await pg.locator('.tool.mastered').count()
        check(m == 4, f'hub shows all 4 scored tools mastered (flashcards are practice only) -> {m}')

        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in ['guide', 'cards', 'quiz', 'sort', 'blanks', 'explain']:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in ['guide', 'cards', 'quiz', 'sort', 'blanks', 'explain']:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
