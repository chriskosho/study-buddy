"""Typing Drills test (Playwright + Chromium).
Types real drill rounds key by key in every tool: stars and results, credit, bests, the per-letter stats shared with Learn the Keys,
mistakes and "Keys to practice", Shift lighting up for capitals, the number row keyboard, Weak keys before and after practice,
Paragraphs with no Backspace, the shared target speed and Fix mistakes settings, and layout: 1440x900 and 1280x720 with no scroll,
360px phone and 915x412 landscape phone with no sideways scroll. The drill text is checked in bulk by gen_check_typing.mjs.
Run:  python3 study-buddy/_dev/tests/drills_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/typing/drills/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
def TEXT(tool): return f"[...document.querySelectorAll('#tab-{tool} .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"
def POS(tool): return f"[...document.querySelectorAll('#tab-{tool} .sbty-text .c')].findIndex(s => s.classList.contains('cur'))"
LK = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.learn-keys') || '{}')"
DR = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.typing-drills') || '{}')"
CHILD = "JSON.parse(localStorage.getItem('studybuddy.v1.child.k1') || '{}')"

async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def type_all(pg, tool, delay=30):
    t = await pg.evaluate(TEXT(tool))
    for ch in t: await pg.keyboard.type(ch, delay=delay)
    await pg.wait_for_timeout(150)
    return t

async def open_tool(pg, base, tool):
    await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .dmsg')
    await pg.wait_for_timeout(150)

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

        # ---- Weak keys with no typing yet ----
        await open_tool(pg, base, 'weak')
        m = await pg.inner_text('#tab-weak .dmsg')
        check('needs some typing first' in m and await pg.locator('#tab-weak .dmsg a[href*="learn-keys"]').count() == 1, f'Weak keys asks for some typing first: {m}')
        # practice in another tab, then come back: Weak keys now has text
        await pg.click('#tabbtn-rows'); await pg.wait_for_selector('#tab-rows .sbty-text .c')
        for _ in range(2): await type_all(pg, 'rows', delay=20)
        await pg.click('#tabbtn-weak'); await pg.wait_for_timeout(150)
        check(len(await pg.evaluate(TEXT('weak'))) > 10 and 'Practicing:' in await pg.inner_text('#tab-weak .dgoal'), 'Weak keys has text after practice in another tab')

        # ---- Rows: home row ----
        await open_tool(pg, base, 'rows')
        check(await pg.locator('#tab-rows [data-o="home"][aria-pressed="true"]').count() == 1, 'Home row is picked first')
        t = await pg.evaluate(TEXT('rows'))
        check(set(t) <= set('asdfghjkl; '), f'home row text: "{t}"')
        check(await pg.locator('#tab-rows .dkb g.k.off').count() > 20, 'keys off the home row are dimmed')
        daily0 = (await pg.evaluate(CHILD)).get('daily', {}).get('n', 0)
        await type_all(pg, 'rows')
        m = await pg.inner_text('#tab-rows .dmsg')
        check('3 stars' in m and '100%' in m, f'a clean, fast round gets 3 stars: {m}')
        ch = await pg.evaluate(CHILD); rec = ch['tools'].get('typing-drills/rows', {})
        check(rec.get('best') == 3 and rec.get('max') == 3, f'result saved as stars of 3: {rec}')
        check(ch['daily']['n'] == daily0 + 1, 'a 2 or 3 star round counts toward today')
        lk = await pg.evaluate(LK)
        check(len(lk.get('stats', {}).get('a', [])) > 0, 'drill keystrokes are added to the Learn the Keys letter stats')
        check((await pg.evaluate(DR))['best'].get('rows:home', {}).get('stars') == 3, 'best for the home row is saved')
        check('Best: 3 stars' in await pg.inner_text('#tab-rows .dgoal'), 'the best shows in the goal line')
        check(await pg.evaluate(POS('rows')) == 0, 'a new round starts right away')

        # ---- mistakes: 1 star and keys to practice ----
        t = await pg.evaluate(TEXT('rows'))
        for i, c in enumerate(t):
            if i < 30 and c not in ' q': await pg.keyboard.type('q')
            await pg.keyboard.type(c, delay=10)
        await pg.wait_for_timeout(150)
        m = await pg.inner_text('#tab-rows .dmsg')
        check('1 star' in m and 'Slow down' in m and 'Keys to practice' in m, f'many mistakes give 1 star and keys to practice: {m}')

        # ---- number row ----
        await pg.click('#tab-rows [data-o="number"]')
        t = await pg.evaluate(TEXT('rows'))
        check(set(t) <= set('1234567890- ') and all(d in t for d in '0123456789'), f'number row text uses every digit: "{t}"')
        check(await pg.locator('#tab-rows .dkb g.k[data-k="1"]').count() == 1, 'the number row keyboard shows the numbers')
        check((await pg.evaluate(DR))['opt'].get('rows') == 'number', 'the row choice is saved')
        await type_all(pg, 'rows')
        check('stars' in await pg.inner_text('#tab-rows .dmsg'), 'number row round finishes')

        # ---- shared settings ----
        await pg.select_option('#tab-rows [data-x="target"]', '25')
        check((await pg.evaluate(LK)).get('target') == 25, 'target speed is shared with Learn the Keys')
        check('25 words a minute' in await pg.inner_text('#tab-rows .dgoal'), 'the goal shows the new speed')
        p0 = await pg.evaluate(POS('rows')); t = await pg.evaluate(TEXT('rows'))
        await pg.keyboard.type(t[p0]); check(await pg.evaluate(POS('rows')) == p0 + 1, 'typing works right after changing the speed')
        await pg.select_option('#tab-rows [data-x="target"]', '15')
        # opening the menu and leaving it with Escape: the next letter still types
        p0 = await pg.evaluate(POS('rows')); t = await pg.evaluate(TEXT('rows'))
        await pg.click('#tab-rows [data-x="target"]'); await pg.keyboard.press('Escape'); await pg.keyboard.type(t[p0])
        check(await pg.evaluate(POS('rows')) == p0 + 1, 'typing works after opening the speed menu and pressing Escape')
        check(await pg.locator('#tab-rows [data-x="wait"]').count() == 0, 'there is no Fix mistakes switch (always on)')
        # a wrong key, then the right one: the letter turns green with a red underline
        p0 = await pg.evaluate(POS('rows')); t = await pg.evaluate(TEXT('rows'))
        await pg.keyboard.type('q' if t[p0] != 'q' else 'z'); await pg.keyboard.type(t[p0])
        check(await pg.locator(f'#tab-rows .sbty-text .c:nth-child(n)').count() > 0 and await pg.locator('#tab-rows .c.fixed').count() == 1 and await pg.locator('#tab-rows .c.bad').count() == 0, 'a fixed letter shows as fixed, not red')
        # Start over: new text inside the card, the best is kept
        best0 = (await pg.evaluate(DR))['best']
        await pg.click('#tab-rows [data-x="over"]')
        check(await pg.evaluate(POS('rows')) == 0 and await pg.evaluate(TEXT('rows')) != t, 'Start over gives new text')
        check((await pg.evaluate(DR))['best'] == best0, 'and keeps the best')
        t = await pg.evaluate(TEXT('rows')); await pg.keyboard.type(t[0])
        check(await pg.evaluate(POS('rows')) == 1, 'typing works right after Start over')
        await pg.click('#tab-rows [data-x="kb"]'); check(await pg.locator('#tab-rows .dkb').is_hidden(), 'the keyboard can be hidden')
        await pg.click('#tab-rows [data-x="kb"]'); check(await pg.locator('#tab-rows .dkb').is_visible(), 'and shown again')

        # ---- capitals light up Shift on the other hand ----
        await open_tool(pg, base, 'marks')
        t = await pg.evaluate(TEXT('marks'))
        check(any(c.isupper() for c in t), f'capitals drill has capitals: "{t}"')
        # type up to the first capital
        i = next(i for i, c in enumerate(t) if c.isupper())
        for c in t[:i]: await pg.keyboard.type(c, delay=10)
        nxt = await pg.evaluate("[...document.querySelectorAll('#tab-marks .dkb g.k.next')].map(g => g.dataset.k)")
        left = t[i].lower() in 'qwertasdfgzxcvb'
        check(t[i].lower() in nxt and ('ShiftRight' if left else 'ShiftLeft') in nxt, f'capital {t[i]} lights its key and the other Shift: {nxt}')
        for c in t[i:]: await pg.keyboard.type(c, delay=10)
        await pg.wait_for_timeout(150)
        check('stars' in await pg.inner_text('#tab-marks .dmsg'), 'capitals round finishes')
        await pg.click('#tab-marks [data-o="punct"]')
        t = await pg.evaluate(TEXT('marks'))
        check(any(c in t for c in ",.?!;:'\"()-"), f'punctuation drill has punctuation: "{t}"')
        await type_all(pg, 'marks', delay=15)
        check('stars' in await pg.inner_text('#tab-marks .dmsg'), 'punctuation round finishes')

        # ---- common words ----
        await open_tool(pg, base, 'words')
        await pg.click('#tab-words [data-o="100"]')
        t = await pg.evaluate(TEXT('words'))
        check(len(t.split(' ')) == 25, 'common words gives 25 words')
        await type_all(pg, 'words', delay=15)
        check('3 stars' in await pg.inner_text('#tab-words .dmsg'), 'common words round gets 3 stars')

        # ---- Weak keys after practice ----
        await open_tool(pg, base, 'weak')
        g = await pg.inner_text('#tab-weak .dgoal')
        check('Practicing:' in g, f'Weak keys names the letters it practices: {g}')
        t = await pg.evaluate(TEXT('weak'))
        check(len(t.split(' ')) == 16, f'Weak keys gives 16 words: "{t}"')
        await type_all(pg, 'weak', delay=15)
        check('stars' in await pg.inner_text('#tab-weak .dmsg'), 'Weak keys round finishes')

        # ---- Sentences ----
        await open_tool(pg, base, 'sentences')
        t = await pg.evaluate(TEXT('sentences'))
        check(t[0].isupper() and t.rstrip()[-1] in '.?!', f'sentences start with a capital and end with punctuation: "{t[:60]}"')
        await type_all(pg, 'sentences', delay=15)
        check('3 stars' in await pg.inner_text('#tab-sentences .dmsg'), 'sentences round gets 3 stars')
        await pg.click('#tab-sentences [data-o="num"]')
        check(any(c.isdigit() for c in await pg.evaluate(TEXT('sentences'))), 'With numbers has digits')

        # ---- Paragraphs: no Backspace, mistakes stay ----
        await open_tool(pg, base, 'paragraphs')
        check(await pg.locator('#tab-paragraphs [data-x="wait"]').count() == 0, 'no Fix mistakes switch on Paragraphs')
        check('No Backspace' in await pg.inner_text('#tab-paragraphs .dgoal') and '97%' in await pg.inner_text('#tab-paragraphs .dgoal'), 'Paragraphs says no Backspace and 97%')
        t = await pg.evaluate(TEXT('paragraphs'))
        await pg.keyboard.type(t[0]); await pg.keyboard.type('~')
        check(await pg.evaluate(POS('paragraphs')) == 2, 'a wrong key moves on')
        await pg.keyboard.press('Backspace')
        check(await pg.evaluate(POS('paragraphs')) == 2, 'Backspace does nothing')
        for c in t[2:]: await pg.keyboard.type(c, delay=8)
        await pg.wait_for_timeout(150)
        m = await pg.inner_text('#tab-paragraphs .dmsg')
        check('stars' in m and '100%' not in m, f'paragraph round finishes with the mistake counted: {m}')

        # ---- Learn the Keys open in another tab never erases drill practice ----
        pg2 = await ctx.new_page(); await pg2.goto(base + 'modules/typing/learn-keys/index.html'); await pg2.wait_for_selector('#lkType .c')
        await open_tool(pg, base, 'words')
        await pg.select_option('#tab-words [data-x="target"]', '20')
        await type_all(pg, 'words', delay=10)
        n_e = len((await pg.evaluate(LK))['stats'].get('e', []))
        await pg2.click('#lkKb')
        lk = await pg.evaluate(LK)
        check(lk.get('target') == 20 and len(lk['stats'].get('e', [])) == n_e, f'a save in Learn the Keys keeps the drill stats and speed (target {lk.get("target")}, e {len(lk["stats"].get("e", []))} of {n_e})')
        await pg2.click('#lkKb'); await pg2.close()
        await pg.select_option('#tab-words [data-x="target"]', '15')

        # ---- layout ----
        for tool in ['rows', 'words', 'marks', 'weak', 'sentences', 'paragraphs']:
            for w, h in [(1440, 900), (1280, 720)]:
                await pg.set_viewport_size({'width': w, 'height': h})
                await open_tool(pg, base, tool)
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits {w}x{h} {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await open_tool(pg, base, 'rows'); await pg.click('#tab-rows [data-o="number"]')
        o = await overflow(pg); check(o['v'] <= 0, f'number row keyboard fits 1440x900 {o}')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
