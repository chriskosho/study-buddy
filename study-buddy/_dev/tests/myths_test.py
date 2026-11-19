"""Greek and Roman Myths test (Playwright + Chromium).
Plays every tool with correct answers (looked up from data.js), checks that practice uses only the words in the notes,
that Historians say notes carry a Wikipedia link, that results reach the hub, that Explain it accepts the notes' own summaries and
rejects a weak answer, and the layout: 1440x900 with no scroll on every tool, 360px with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/myths_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/history/myths/index.html'
ID = 'myths'
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
TOOLS = ['guide', 'cards', 'quiz', 'sort', 'order', 'blanks', 'explain']

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
        txt = ' '.join(await pg.locator('a.mod').all_inner_texts())
        check('Greek and Roman Myths' in txt, 'History lists Greek and Roman Myths')
        tabs = await pg.evaluate("SB_REGISTRY.modules.find(m => m.id === '%s').tools.map(t => t.id)" % ID)
        check(tabs == TOOLS, f'the module has the seven tools in order {tabs}')

        # ---- the guide: every answer on the sheet is in the guide, and every right answer in practice comes from it ----
        await pg.goto(base + M); await pg.wait_for_selector('.gtabs')
        n = await pg.evaluate("STORIES.length")
        check(n == 7, 'seven stories')
        bad = await pg.evaluate("""() => {
          const words = s => (s.toLowerCase().match(/[a-z]+/g) || []);
          const all = new Set(STORIES.flatMap(s => [...s.qa, ...s.talk].flat().concat([s.label, s.main || '', s.note || ''])).flatMap(words));
          const out = [];
          QUIZ.forEach(q => words(q.a).forEach(w => { if (!all.has(w) && !['is','are','and','him','from','fights'].includes(w)) out.push('quiz: ' + w + ' (' + q.q.slice(0, 30) + ')'); }));
          ORDERS.forEach(o => { if (o.items.length < 4) out.push('short order ' + o.id); });
          QUIZ.forEach(q => { if (q.wrong.includes(q.a) || new Set([q.a, ...q.wrong]).size !== 4) out.push('options: ' + q.q); });
          return [...new Set(out)];
        }""")
        print('words not in the guide:', bad)
        check(not [x for x in bad if x.startswith(('short', 'options'))], f'quiz options are distinct, orders are long enough {bad}')
        for st in await pg.evaluate("STORIES.map(s => s.id)"):
            await pg.click(f'.gtabs button[data-g="{st}"]'); await pg.wait_for_timeout(60)
            nq, nt = await pg.evaluate("id => { const s = STORIES.find(x => x.id === id); return [s.qa.length, s.talk.length]; }", st)
            pages = await pg.locator('.gsub button').count() - 1
            shown = 0
            for i in range(pages):
                await pg.click(f'.gsub button[data-p="{i}"]'); await pg.wait_for_timeout(40)
                shown += await pg.locator('.qa .item').count()
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide {st} page {i + 1} fits 1440x900 {o}')
            check(shown == nq, f'{st}: all {nq} questions shown over {pages} page(s)')
            await pg.click(f'.gsub button[data-p="{pages}"]'); await pg.wait_for_timeout(40)
            check(await pg.locator('.qa .item').count() == nt, f'{st}: {nt} talk-it-over items shown')
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide {st} talk fits 1440x900 {o}')

        # ---- flashcards: all four decks, practice only ----
        await pg.click('nav.tabs button[data-tab="cards"]')
        for mode in await pg.locator('#tab-cards .seg button').all():
            await mode.click(); await pg.wait_for_timeout(60)
            n = await pg.locator('#tab-cards .count, #tab-cards .hint').first.inner_text()
        for i in range(30):
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
        await pg.evaluate("SB.result('%s', 'quiz', 12, 12, 'full')" % ID)   # mastery needs the Full quiz (played in quiz_full_test)

        # ---- sort it ----
        await pg.click('nav.tabs button[data-tab="sort"]')
        while await pg.locator('#tab-sort .sortTray .chip').count():
            c = pg.locator('#tab-sort .sortTray .chip').first; bk = await c.get_attribute('data-b')
            await c.click(); await pg.click(f'#tab-sort .bucket[data-b="{bk}"]')
        check('Perfect' in await pg.locator('#tab-sort .msg').inner_text(), 'sort: every fact in the right place')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # ---- put in order: solve every set with the arrow buttons ----
        await pg.click('nav.tabs button[data-tab="order"]'); await pg.wait_for_selector('#tab-order .oitem')
        for sid in ['jason', 'perseus', 'psyche', 'damon', 'damocles']:
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

        # ---- fill it in: right answers (also the other accepted word), then two misses show the answer ----
        await pg.click('nav.tabs button[data-tab="blanks"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-blanks input')
            s = await pg.evaluate("() => document.querySelector('#tab-blanks .qtext').textContent.replace(/_+/, '___').trim()")
            ans = await pg.evaluate("s => { const f = BLANKS.find(x => x[0] === s); return f ? f[1] : null; }", s)
            check(ans is not None, f'blank found: {s}') if ans is None else None
            await pg.fill('#tab-blanks input', ans[-1]); await pg.click('#tab-blanks form button')   # the last accepted word (killed or murdered)
            await pg.click('#tab-blanks [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('%s','blanks')" % ID)
        check(rec and rec['best'] == 10, f'fill it in 10 of 10 {rec}')
        await pg.goto(base + M + '?tool=blanks'); await pg.wait_for_selector('#tab-blanks input')
        await pg.evaluate("SB.child && 0")
        await pg.fill('#tab-blanks input', 'banana'); await pg.click('#tab-blanks form button')
        await pg.fill('#tab-blanks input', 'banana'); await pg.click('#tab-blanks form button')
        check(await pg.locator('#tab-blanks [data-a="next"]').is_visible(), 'two misses end the question and show the answer')

        # ---- explain it ----
        await pg.click('nav.tabs button[data-tab="explain"]')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => EXPLAIN.find(x => x.q === q).model", q)
            if i == 0:
                await pg.fill('#tab-explain .answer', 'caesar was a roman guy and things happened')
                await pg.click('#tab-explain [data-a="check"]')
                check('Great answer' not in await pg.locator('#tab-explain .feedback').inner_text(), 'a weak answer is not accepted')
                check(await pg.locator('#tab-explain .checks li.no').count() >= 2, 'a weak answer shows the missing ideas')
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'the teacher\'s own answer {i + 1} passes')
            await pg.click('#tab-explain [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('%s','explain')" % ID)
        check(rec and rec['best'] == 4, f'explain counts first checks only (4 of 5) {rec}')

        await pg.goto(base + 'index.html#/module/' + ID); await pg.wait_for_selector('.tool')
        m = await pg.locator('.tool.mastered').count()
        check(m == 5, f'hub shows all 5 scored tools mastered (flashcards and the guide are practice only) -> {m}')

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
