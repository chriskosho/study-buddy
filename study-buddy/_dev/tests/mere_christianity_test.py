"""Mere Christianity, Book 1 test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks that the guide holds no quotations from the book, that Think it through is not scored,
that Explain it accepts the model answers and rejects a weak one, that results reach the hub, and the layout: 1440x900 with no scroll on every tool, 360px with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/mere_christianity_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/other/mere-christianity/index.html'
ID = 'mere-christianity'
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
TOOLS = ['guide', 'think', 'cards', 'quiz', 'sort', 'order', 'explain']

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

        await pg.goto(base + 'index.html#/home/other'); await pg.wait_for_selector('a.mod')
        check('Mere Christianity, Book 1' in ' '.join(await pg.locator('a.mod').all_inner_texts()), 'Other lists Mere Christianity, Book 1')
        tabs = await pg.evaluate("SB_REGISTRY.modules.find(m => m.id === '%s').tools.map(t => t.id)" % ID)
        check(tabs == TOOLS, f'the module has the seven tools in order {tabs}')

        # ---- no quotations from the book, and the content is complete ----
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        quotes = await pg.evaluate("""() => { const strs = []; const walk = v => Array.isArray(v) ? v.forEach(walk) : v && typeof v === 'object' ? Object.values(v).forEach(walk) : typeof v === 'string' && strs.push(v); walk([CHAPTERS, QUIZ, SORT_ITEMS, ORDERS, EXPLAIN]); return strs.filter(x => /[\u201c\u201d"]/.test(x)).length; }""")
        check(quotes == 0, f'no quotation marks anywhere in the content (a guard against copying passages) -> {quotes}')
        shape = await pg.evaluate("[CHAPTERS.length, CHAPTERS.every(c => c.summary && c.ideas.length >= 3 && c.terms.length >= 2 && c.think.length === 3), QUIZ.length, SORT_ITEMS.length, ORDERS.map(o => o.items.length).join(), EXPLAIN.length]")
        check(shape == [5, True, 12, 10, '5,7', 4], f'five chapters, each with ideas, terms and 3 questions; 12 quiz questions; 10 sort cards; order sets 5 and 7; 4 explain questions {shape}')
        titles = await pg.evaluate("CHAPTERS.map(c => c.title)")
        check(titles == ['The Law of Human Nature', 'Some Objections', 'The Reality of the Law', 'What Lies Behind the Law', 'We Have Cause to Be Uneasy'], 'chapter titles are Book 1 of the book, in order')

        # ---- study guide ----
        for i in range(5):
            cid = f'c{i + 1}'
            await pg.click(f'.gtabs button[data-g="{cid}"]'); await pg.wait_for_timeout(60)
            c = await pg.evaluate("id => { const c = CHAPTERS.find(x => x.id === id); return {s: c.summary, i: c.ideas.length, t: c.terms.length}; }", cid)
            check(c['s'] in await pg.locator('.model').inner_text(), f'chapter {i + 1} shows its summary')
            check(await pg.locator('.ideas li').count() == c['i'] and await pg.locator('.ttable tbody tr').count() == c['t'], f'chapter {i + 1} shows {c["i"]} ideas and {c["t"]} terms')
            check(await pg.locator('.ttable .spk').count() == c['t'], f'chapter {i + 1}: a speaker button on every term')
        check('own words' in await pg.locator('.hint').last.inner_text(), 'the guide says it is written in its own words and points to the book')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide fits 1440x900 {o}')

        # ---- think it through: three questions each, starting points, not scored ----
        await pg.click('nav.tabs button[data-tab="think"]')
        for i in range(5):
            await pg.click(f'#tab-think .gtabs button[data-g="c{i + 1}"]'); await pg.wait_for_timeout(60)
            check(await pg.locator('#tab-think .qs li').count() == 3 and await pg.locator('#tab-think .start summary').count() == 3, f'think: chapter {i + 1} has 3 questions with starting points')
        await pg.locator('#tab-think .start summary').first.click()
        check(await pg.locator('#tab-think .start[open] span').first.is_visible(), 'a starting point opens')
        rec = await pg.evaluate("SB.toolRecord('%s','think')" % ID)
        check(not rec or rec.get('best') is None, f'Think it through is not scored {rec}')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'think fits 1440x900 {o}')

        # ---- flashcards ----
        await pg.click('nav.tabs button[data-tab="cards"]')
        for mode in await pg.locator('#tab-cards .seg button').all():
            await mode.click(); await pg.wait_for_timeout(60)
        for i in range(14):
            if await pg.locator('#tab-cards [data-a="knew"]').count() == 0: break
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(40)
        rec = await pg.evaluate("SB.toolRecord('%s','cards')" % ID)
        check(not rec or rec.get('best') is None, f'flashcards are practice only {rec}')

        # ---- quiz ----
        await pg.click('nav.tabs button[data-tab="quiz"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt')
            q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => { const f = QUIZ.find(x => x.q === q); return f ? f.a : null; }", q)
            check(ans is not None, f'quiz question found in data: {q[:50]}') if ans is None else None
            await pg.click(f'#tab-quiz .opt[data-v="{ans}"]')
            await pg.click('#tab-quiz [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('%s','quiz')" % ID)
        check(rec and rec['best'] == 10, f'quiz 10 of 10 {rec}')
        await pg.evaluate("SB.result('%s', 'quiz', 12, 12, 'full')" % ID)   # mastery needs the Full quiz

        # ---- sort it: which chapter ----
        await pg.click('nav.tabs button[data-tab="sort"]')
        check(await pg.locator('#tab-sort .bucket').count() == 5, 'sort: five chapter buckets')
        while await pg.locator('#tab-sort .sortTray .chip').count():
            c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
            await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
        check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), 'sort: every idea in its chapter')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # ---- put in order ----
        await pg.click('nav.tabs button[data-tab="order"]'); await pg.wait_for_selector('#tab-order .oitem')
        for sid in ['chapters', 'argument']:
            await pg.click(f'#tab-order .seg button[data-s="{sid}"]')
            target = await pg.evaluate("sid => ORDERS.find(o => o.id === sid).items", sid)
            check(await pg.locator('#tab-order .oitem').count() == len(target), f'order {sid}: {len(target)} cards')
            for i in range(len(target)):
                cur = await pg.evaluate("[...document.querySelectorAll('#tab-order .otext b')].map(e => e.textContent)")
                j = cur.index(target[i])
                for _ in range(j - i):
                    await pg.locator(f'#tab-order .oitem[data-i="{j}"] [data-mv="-1"]').click(); j -= 1
            await pg.click('#tab-order [data-a="check"]')
            check('Perfect order' in await pg.locator('#tab-order .msg').inner_text(), f'order {sid} solved')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'order fits 1440x900 {o}')

        # ---- explain it ----
        await pg.click('nav.tabs button[data-tab="explain"]')
        for i in range(4):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'lewis wrote a book about some things and then more things happened later')
                await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'a weak answer is not accepted')
                check(await pg.locator('#tab-explain .checks li.no').count() >= 2, 'a weak answer shows the missing ideas')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('%s','explain')" % ID)
        check(rec and rec['best'] == 3, f'explain counts first checks only (3 of 4) {rec}')

        await pg.goto(base + 'index.html#/module/' + ID); await pg.wait_for_selector('.tool')
        m = await pg.locator('.tool.mastered').count()
        check(m == 4, f'hub shows the 4 scored tools mastered (guide, think and flashcards are practice only) -> {m}')

        # ---- layout ----
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in TOOLS:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
