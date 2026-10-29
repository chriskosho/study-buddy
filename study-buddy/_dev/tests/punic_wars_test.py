"""The Punic Wars test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks results reach the hub, checks the
Explain it grading accepts the study guide's own answer and rejects a weak one, and checks layout:
1440x900 with no scroll on every tool, 360px phone with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/punic_wars_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/history/punic-wars/index.html'
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
    TOOLS = ['guide', 'timeline', 'study', 'cards', 'listen', 'find', 'quiz', 'type', 'order', 'explain']
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and 'Failed to load resource' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/history'); await pg.wait_for_selector('a.mod')
        check('The Punic Wars' in ' '.join(await pg.locator('a.mod').all_inner_texts()), 'History shows The Punic Wars')

        # study guide: every tab opens and fits; added material is marked
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        for g in ['war1', 'war2', 'war3', 'more', 'people', 'pics']:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(80)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide tab {g} fits 1440x900 {o}')
        await pg.click('.gtabs button[data-g="more"]')
        check(await pg.locator('em.added').count() >= 1 and 'not in your notes' in await pg.locator('.lead').inner_text(), 'More to know is marked as added')
        await pg.click('.gtabs button[data-g="war1"]')
        check('Rome copied their navy' in await pg.locator('.gbody').inner_text(), "guide keeps the notes' wording")
        check(await pg.locator('.gart svg').count() == 1, 'guide shows its drawing')

        # timeline: three wars, added events marked, tapping speaks
        await pg.goto(base + M + '?tool=timeline'); await pg.wait_for_selector('.tev')
        n = await pg.evaluate('TIMELINE.length')
        check(await pg.locator('.tev').count() == n and await pg.locator('.tev.extra').count() == await pg.evaluate('TIMELINE.filter(e => !e.notes).length'), 'timeline marks added events')
        await pg.click('.tev >> nth=1'); check(await pg.locator('.tev.on .td').is_visible(), 'tapping an event opens its detail')
        await pg.click('.tev >> nth=0 >> .spk'); await pg.wait_for_timeout(100)
        check(await pg.evaluate('window.__spoken.length') >= 1, 'the timeline speaker reads the event')
        check(await pg.evaluate("TIMELINE.every((e, i, a) => !i || a[i - 1].y > e.y)"), 'timeline years run from earliest (largest B.C.) to latest')

        # study map: every place drawn, route toggles
        await pg.goto(base + M + '?tool=study'); await pg.wait_for_selector('.pmap')
        check(await pg.locator('.pt').count() == await pg.evaluate('PLACES.length'), 'map draws every place')
        check(await pg.evaluate("[...document.querySelectorAll('.pt')].every(g => { const b = g.querySelector('.dot').getBoundingClientRect(), m = document.querySelector('.pmap').getBoundingClientRect(); return b.left > m.left && b.right < m.right && b.top > m.top && b.bottom < m.bottom; })"), 'every dot is inside the map')
        check(await pg.evaluate("(() => { const q = id => PLACES.find(p => p.id === id), y = p => (PMAP.n0 - p.lat); return y(q('rome')) < y(q('carthage')) && q('spain').lon < q('rome').lon; })()"), 'Rome is north of Carthage and Spain is west of Rome')
        await pg.check('#hr'); check(await pg.evaluate("getComputedStyle(document.querySelector('.hr')).display") == 'block', 'Hannibal route shows')
        await pg.click('.pt[data-id="alps"]'); check('Alps' in await pg.locator('.mcard').inner_text(), 'tapping a place shows its card')

        # listen and tap: tap the right place every time
        await pg.goto(base + M + '?tool=listen')
        for i in range(10):
            await pg.wait_for_selector('#tab-listen .qtext b')
            nm = await pg.inner_text('#tab-listen .qtext b')
            pid = await pg.evaluate("n => PLACES.find(p => p.name === n).id", nm)
            await pg.click(f'#tab-listen .pt[data-id="{pid}"]'); await pg.wait_for_timeout(1600)
        rec = await pg.evaluate("SB.toolRecord('punic-wars','listen')"); check(rec and rec['best'] == 10, f'listen and tap 10 of 10 {rec}')

        # find it: a few right taps count
        await pg.goto(base + M + '?tool=find'); await pg.click('[data-a="go"]')
        for i in range(4):
            nm = await pg.inner_text('#tab-find .tgt'); pid = await pg.evaluate("n => PLACES.find(p => p.name === n).id", nm)
            await pg.click(f'#tab-find .pt[data-id="{pid}"]')
        check('Found 4' in await pg.inner_text('#tab-find .tinfo'), 'find it counts four found')

        # flashcards: practice only
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards [data-a="knew"]')
        for i in range(await pg.evaluate('CARDS.length')): await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(40)
        rec = await pg.evaluate("SB.toolRecord('punic-wars','cards')"); check(not rec or rec.get('best') is None, f'flashcards are practice only {rec}')

        # quiz: lookup
        await pg.goto(base + M + '?tool=quiz')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt'); q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (QUIZ.find(x => x.q === q) || {}).a", q); check(ans is not None, f'quiz question in data: {q[:40]}') if ans is None else None
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]'); await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('punic-wars','quiz')"); check(rec and rec['best'] == 10, f'quiz 10 of 10 {rec}')
        check(await pg.evaluate("QUIZ.every(x => !x.wrong.includes(x.a) && new Set([x.a, ...x.wrong]).size === 4)"), 'every quiz question has 4 distinct options')

        # type the answer
        await pg.goto(base + M + '?tool=type')
        for i in range(10):
            await pg.wait_for_selector('#tab-type input')
            q = await pg.evaluate("() => document.querySelector('#tab-type .qtext').textContent.trim()")
            ans = await pg.evaluate("q => { const n = s => s.replace(/_{3,}/g, '').replace(/\\s+/g, ' ').trim(); const f = TYPE.find(t => n(t.q) === n(q)); return f ? f.a[0] : null; }", q)
            check(ans is not None, f'type question in data: {q[:40]}') if ans is None else None
            await pg.fill('#tab-type input', ans or ''); await pg.click('#tab-type form button'); await pg.click('#tab-type [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('punic-wars','type')"); check(rec and rec['best'] == 10, f'type the answer 10 of 10 {rec}')

        # put in order: the first set, solved from the data order
        await pg.goto(base + M + '?tool=order'); await pg.wait_for_selector('.oitem')
        names = await pg.evaluate("[...document.querySelectorAll('.otext')].map(e => e.textContent.trim())")
        want = await pg.evaluate("n => EVENTS.filter(e => e.set === 'wars').map(e => e.text).filter(t => n.some(x => x.includes(t)))", names)
        check(len(want) == 5, f'order shows the five events {len(want)}')
        for i, t in enumerate(want):
            cur = await pg.evaluate("[...document.querySelectorAll('.otext')].map(e => e.textContent.trim())")
            j = next(k for k, x in enumerate(cur) if t in x)
            for _ in range(j - i): await pg.click(f'.oitem[data-i="{j}"] [data-mv="-1"]'); j -= 1
        await pg.click('[data-a="check"]'); check('Perfect order' in await pg.inner_text('.msg'), 'the right order is accepted')

        # explain: model answers pass; weak fails
        await pg.goto(base + M + '?tool=explain')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer'); q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'they fought a long time ago'); await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'weak answer is not accepted')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')

        # quizzes stay on the notes: no added place or date leaks into quiz/type/explain
        check(await pg.evaluate("!/Cannae|Zama|Hamilcar|Cato|Mylae|corvus|Numidia|216|202|264|241|149|146/.test(JSON.stringify([QUIZ, TYPE, EXPLAIN, CARDS, EVENTS]))"), 'quiz, type, explain, cards, and order use only the notes')

        # layout
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            if t == 'find': await pg.click('[data-a="go"]')
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
