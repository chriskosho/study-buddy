"""Science Unit 4 (Force and Motion) lesson modules test (Playwright + Chromium).
Each module is built by shared/sb-lesson.js from its data.js (LESSON). For every module this plays every tool with the right
answers from LESSON, checks the guide (every tab, vocabulary, lab), Explain it (weak answer fails, model answers pass), the hub,
and the layout: 1440x900 with no scroll on every tool and every guide tab, 360 px with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/science_unit4_test.py   (or  ... forces  to run just one module)"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
MODS = ['forces', 'gravity-friction', 'other-forces', 'patterns-of-motion', 'simple-machines', 'compound-machines', 'inquiry-engineering', 'unit4-practice-test']
if len(sys.argv) > 1: MODS = [m for m in MODS if m in sys.argv[1:]]
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),200)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def run_module(b, base, ID):
    M = f'modules/science/{ID}/index.html'
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
    await ctx.add_init_script(INIT)
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{ID}: {e}'))
    pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(f'{ID}: {m.text}'))
    print(f'--- {ID}')
    await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
    L = await pg.evaluate("({sections: LESSON.sections.length, vocab: LESSON.vocab.length, lab: !!LESSON.lab, quiz: LESSON.quiz.length, sorts: (LESSON.sorts||[]).length, orders: (LESSON.orders||[]).length, explain: (LESSON.explain||[]).length, id: LESSON.id})")
    check(L['id'] == ID, f'{ID}: LESSON id matches the folder')
    want = ['guide', 'cards', 'quiz'] + (['sort'] if L['sorts'] else []) + (['order'] if L['orders'] else []) + (['explain'] if L['explain'] else [])
    tools = await pg.evaluate("SB_REGISTRY.modules.find(m => m.id === '%s').tools.map(t => t.id)" % ID)
    check(tools == want, f'{ID}: the registry lists the tools the data gives {tools} vs {want}')
    check(L['quiz'] >= 12, f'{ID}: at least 12 quiz questions ({L["quiz"]})')
    # no duplicate or empty answers in the quiz; the right answer is not among the wrong ones
    bad = await pg.evaluate("LESSON.quiz.filter(x => !x.q || !x.a || x.wrong.length !== 3 || x.wrong.includes(x.a) || new Set(x.wrong).size !== 3 || !x.why).map(x => x.q)")
    check(not bad, f'{ID}: every quiz question has one right answer, three different wrong ones, and a reason {bad}')
    # the hub lists it under Science
    await pg.goto(base + 'index.html#/home/science'); await pg.wait_for_selector('a.mod')
    title = await pg.evaluate("SB_REGISTRY.modules.find(m => m.id === '%s').title" % ID)
    check(title in ' '.join(await pg.locator('a.mod').all_inner_texts()), f'{ID}: Science lists {title}')

    # ---- guide: every tab, vocabulary, lab, fits 1440x900 ----
    await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
    n = L['sections'] + 1 + (1 if L['lab'] else 0)
    check(await pg.locator('.gtabs button').count() == n, f'{ID}: guide has {n} tabs')
    for i in range(n):
        await pg.locator('.gtabs button').nth(i).click(); await pg.wait_for_timeout(50)
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{ID}: guide tab {i + 1} fits 1440x900 {o}')
    await pg.locator('.gtabs button').nth(L['sections']).click()
    check(await pg.locator('.ttable tbody tr').count() == L['vocab'] and await pg.locator('.ttable .spk').count() == L['vocab'], f'{ID}: vocabulary has {L["vocab"]} terms, each with a speaker button')
    if L['lab']:
        await pg.locator('.gtabs button').nth(L['sections'] + 1).click()
        check('Lab Manual' in await pg.locator('.gbody').inner_text(), f'{ID}: the lab tab points to the Lab Manual')
    check('book' in (await pg.locator('.hint').last.inner_text()).lower(), f'{ID}: the guide says where the wording comes from')

    # ---- flashcards: practice only ----
    await pg.click('nav.tabs button[data-tab="cards"]')
    for mode in await pg.locator('#tab-cards .seg button').all():
        await mode.click(); await pg.wait_for_timeout(50)
    for i in range(12):
        if await pg.locator('#tab-cards [data-a="knew"]').count() == 0: break
        await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(40)
    rec = await pg.evaluate("SB.toolRecord('%s','cards')" % ID)
    check(not rec or rec.get('best') is None, f'{ID}: flashcards are practice only {rec}')

    # ---- quiz ----
    await pg.click('nav.tabs button[data-tab="quiz"]')
    rounds = min(10, L['quiz'])
    for i in range(rounds):
        await pg.wait_for_selector('#tab-quiz .opt')
        q = await pg.locator('#tab-quiz .qtext').inner_text()
        ans = await pg.evaluate("q => { const f = LESSON.quiz.find(x => x.q === q); return f ? f.a : null; }", q)
        if ans is None: check(False, f'{ID}: quiz question found in data: {q[:50]}'); break
        await pg.click(f'#tab-quiz .opt[data-v="{ans}"]')
        await pg.click('#tab-quiz [data-a="next"]')
    rec = await pg.evaluate("SB.toolRecord('%s','quiz')" % ID)
    check(rec and rec['best'] == rounds, f'{ID}: quiz {rounds} of {rounds} {rec}')
    await pg.evaluate("SB.result('%s', 'quiz', %d, %d, 'full')" % (ID, L['quiz'], L['quiz']))

    scored = 1
    # ---- sort it ----
    if L['sorts']:
        await pg.click('nav.tabs button[data-tab="sort"]')
        for si in range(L['sorts']):
            if L['sorts'] > 1:
                await pg.locator('#tab-sort .seg button[data-s]').nth(si).click(); await pg.wait_for_timeout(60)
            while await pg.locator('#tab-sort .sortTray .chip').count():
                c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
                await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
            check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), f'{ID}: sort set {si + 1} solved')
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{ID}: sort set {si + 1} fits 1440x900 {o}')
        scored += 1
    # ---- put in order ----
    if L['orders']:
        await pg.click('nav.tabs button[data-tab="order"]'); await pg.wait_for_selector('#tab-order .oitem')
        for oi in range(L['orders']):
            if L['orders'] > 1:
                await pg.locator('#tab-order .seg button[data-s]').nth(oi).click(); await pg.wait_for_timeout(60)
            target = await pg.evaluate("oi => LESSON.orders[oi].items", oi)
            check(await pg.locator('#tab-order .oitem').count() == len(target), f'{ID}: order set {oi + 1}: {len(target)} cards')
            for i in range(len(target)):
                cur = await pg.evaluate("[...document.querySelectorAll('#tab-order .otext b')].map(e => e.textContent)")
                j = cur.index(target[i])
                for _ in range(j - i):
                    await pg.locator(f'#tab-order .oitem[data-i="{j}"] [data-mv="-1"]').click(); j -= 1
            await pg.click('#tab-order [data-a="check"]')
            check('Perfect order' in await pg.locator('#tab-order .msg').inner_text(), f'{ID}: order set {oi + 1} solved')
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{ID}: order set {oi + 1} fits 1440x900 {o}')
        scored += 1
    # ---- explain it ----
    if L['explain']:
        await pg.click('nav.tabs button[data-tab="explain"]')
        for i in range(L['explain']):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => LESSON.explain.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'this is a thing that happens sometimes and then more things happen later on')
                await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), f'{ID}: a weak answer is not accepted')
                check(await pg.locator('#tab-explain .checks li.no').count() >= 2, f'{ID}: a weak answer shows the missing ideas')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'{ID}: model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('%s','explain')" % ID)
        check(rec and rec['best'] == L['explain'] - 1, f'{ID}: explain counts first checks only (the weak first try does not count) {rec}')
        scored += 1
    await pg.goto(base + 'index.html#/module/' + ID); await pg.wait_for_selector('.tool')
    m = await pg.locator('.tool.mastered').count()
    check(m == scored, f'{ID}: hub shows the {scored} scored tools mastered (guide and flashcards are practice only) -> {m}')

    # ---- layout ----
    await pg.set_viewport_size({'width': 360, 'height': 780})
    for t in tools:
        await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
        o = await overflow(pg); check(o['h'] <= 0, f'{ID}: phone {t}: no sideways scroll {o}')
    await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.gtabs')
    for i in range(n):
        await pg.locator('.gtabs button').nth(i).click(); await pg.wait_for_timeout(40)
        o = await overflow(pg); check(o['h'] <= 0, f'{ID}: phone guide tab {i + 1}: no sideways scroll {o}')
    await pg.set_viewport_size({'width': 1440, 'height': 900})
    for t in tools:
        await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{ID}: 1440x900 {t}: no scroll {o}')
    await ctx.close()

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for ID in MODS:
            if os.path.exists(os.path.join(SITE, 'modules', 'science', ID, 'index.html')): await run_module(b, base, ID)
            else: print(f'(skipping {ID}: not built yet)')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
