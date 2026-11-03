"""A Bird, came down the Walk test (Playwright + Chromium).
Plays every tool of the poem module, checks the poem text on screen matches data.js, scores, hints, practice-only tools,
and layout (1440x900 with no scroll, 360px phone with no sideways scroll).
Run:  python3 study-buddy/_dev/tests/bird_walk_test.py   (from the repository root, or anywhere)"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/english/bird-walk/index.html'
fails, errors = [], []

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()

def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'}],active:'k1',pin:null}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),200)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""

TABS = ['read', 'cards', 'letters', 'blanks', 'order', 'type', 'recite']

async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def go(pg, base, tool):
    await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool}:not([hidden])'); await pg.wait_for_timeout(150)

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

        await pg.goto(base + 'index.html#/home/english'); await pg.wait_for_selector('a.mod[href="#/module/bird-walk"]')
        txt = await pg.locator('a.mod[href="#/module/bird-walk"]').inner_text()
        check('A Bird, came down the Walk' in txt and 'Insane' in txt, 'English shows the poem module, Easy to Insane')
        check('0 of 4 mastered' in txt, 'four scored tools (the other three are practice only)')

        # ---- the poem on screen is the poem in data.js: 5 stanzas, 20 lines, 2 marked ----
        await go(pg, base, 'read'); await pg.wait_for_selector('.stz')
        POEM = await pg.evaluate('POEM'); LINES = [l for s in POEM['stanzas'] for l in s]
        check(len(POEM['stanzas']) == 5 and len(LINES) == 20 and all(len(s) == 4 for s in POEM['stanzas']), 'five stanzas of four lines')
        shown = await pg.evaluate("[...document.querySelectorAll('#tab-read .stz p')].map(p => p.textContent)")
        check(shown == LINES, 'read tab shows every line exactly')
        check(await pg.locator('#tab-read mark.hl').count() == 2, 'the two highlighted lines from the printed copy are shaded')
        check(await pg.locator('nav.tabs button').count() == 7, 'seven tool tabs')
        check(await pg.evaluate('window.__spoken.length') == 0, 'read aloud off: nothing spoken on open')
        await pg.click('#tab-read .stz >> nth=1 >> .spk'); await pg.wait_for_timeout(100)
        sp = await pg.evaluate('window.__spoken'); check(len(sp) == 1 and 'hopped sidewise' in sp[0] and ' -' not in sp[0], f'speaker reads a stanza without the dashes {sp}')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'read fits 1440x900 {o}')

        # ---- flashcards ----
        await go(pg, base, 'cards')
        front = await pg.locator('#tab-cards .front').inner_text()
        check(LINES[0] in front, 'flashcards start at the first line')
        await pg.click('#tab-cards .card, #tab-cards .front >> nth=0') if False else None
        await pg.keyboard.press('Space') if False else None
        flip = pg.locator('#tab-cards [data-a="flip"]')
        if await flip.count(): await flip.click()
        check(LINES[1] in await pg.locator('#tab-cards .back').inner_text(), 'flipping shows the next line')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','cards')")
        check(not rec or rec.get('best') is None, f'flashcards are practice only {rec}')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'cards fits 1440x900 {o}')

        # ---- first letters ----
        await go(pg, base, 'letters')
        t0 = await pg.locator('#tab-letters .ln').first.inner_text()
        check(t0 == 'A B, c d t W -', f'first letters of line 1: {t0!r}')
        await pg.click('#tab-letters .ln >> nth=0')
        check(await pg.locator('#tab-letters .ln').first.inner_text() == LINES[0], 'tapping a line shows it')
        await pg.click('#tab-letters [data-a="all"]')
        check(await pg.locator('#tab-letters .ln.open').count() == 4, 'Show all opens every line')
        await pg.select_option('#lstz', '1'); await pg.click('#tab-letters .seg button[data-h="word"]')
        check((await pg.locator('#tab-letters .ln').first.inner_text()).startswith('And ...'), 'first word only')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','letters')")
        check(not rec or rec.get('best') is None, 'first letters is practice only')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'letters fits 1440x900 {o}')

        # ---- fill the blanks: one wrong check, then a full-score round ----
        async def fill(correct=True):
            texts = await pg.evaluate("[...document.querySelectorAll('#tab-blanks .ln')].map(d => { const c = d.cloneNode(true); c.querySelectorAll('.blank').forEach(x => x.replaceWith('§')); return c.textContent; })")
            ans = []
            import re
            for t in texts:
                rx = re.compile('^' + re.escape(t).replace('§', "([A-Za-z']+)") + '$')
                for L in LINES:
                    m = rx.match(L)
                    if m: ans += list(m.groups()); break
            return ans
        await go(pg, base, 'blanks')
        ans = await fill(); n = await pg.locator('#tab-blanks .blank').count()
        check(len(ans) == n and n == 4, f'easy level: one blank per line, found answers {ans}')
        for k in range(n):   # fill every blank with the next word in the bank, right or wrong
            await pg.locator('#tab-blanks .chip:not(.used)').first.click()
        await pg.click('#tab-blanks [data-a="check"]')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','blanks')")
        check(rec and rec['max'] == 4 and rec['best'] <= 4, f'blanks result recorded {rec}')
        check(await pg.locator('#tab-blanks [data-a="again"]').is_visible(), 'Try again appears after checking')
        await pg.click('#tab-blanks [data-a="new"]')
        ans = await fill()
        for want in ans:
            await pg.locator('#tab-blanks .chip:not(.used)', has_text=want).first.click()
        await pg.click('#tab-blanks [data-a="check"]')
        check(await pg.locator('#tab-blanks .blank.right').count() == len(ans), 'all blanks right')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','blanks')")
        check(rec and rec['best'] == 4 and rec['max'] == 4, f'full round recorded {rec}')
        for lv, minb in [('half', 8), ('most', 12)]:
            await pg.click(f'#tab-blanks .seg button[data-l="{lv}"]')
            check(await pg.locator('#tab-blanks .blank').count() >= minb, f'{lv}: many more blanks')
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'blanks {lv} fits 1440x900 {o}')

        # ---- order: solve a stanza with the arrow buttons ----
        await go(pg, base, 'order'); await pg.wait_for_selector('#tab-order .oitem')
        await pg.click('#tab-order .seg button[data-s="s0"]')
        target = POEM['stanzas'][0]
        for i in range(4):
            cur = await pg.evaluate("[...document.querySelectorAll('#tab-order .otext b')].map(e => e.textContent)")
            j = cur.index(target[i])
            for _ in range(j - i):
                await pg.locator(f'#tab-order .oitem[data-i="{j}"] [data-mv="-1"]').click(); j -= 1
        await pg.click('#tab-order [data-a="check"]')
        check('Perfect order' in await pg.locator('#tab-order .msg').inner_text(), 'ordering a stanza correctly')
        for s in ['stz', 'mix']:
            await pg.click(f'#tab-order .seg button[data-s="{s}"]')
            n = await pg.locator('#tab-order .oitem').count(); check(n == (5 if s == 'stz' else 6), f'{s}: {n} cards')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'order fits 1440x900 {o}')

        # ---- type it: stanza 1 of the round uses a hint (does not count), the rest are right, one with a typo ----
        await go(pg, base, 'type')
        for r in range(5):
            prog = await pg.locator('#tab-type .prog').inner_text()
            si = int(prog.split('stanza ')[1].split(' ')[0]) - 1; st = POEM['stanzas'][si]
            check(st[0] in await pg.locator('#tab-type .given').inner_text(), f'round {r + 1}: first line shown') if r == 0 else None
            ins = pg.locator('#tab-type .tin input')
            if r == 0:
                await pg.click('#tab-type [data-a="hint"]')
                check(await pg.locator('#tab-type .hl2:visible').count() == 3, 'hint shows first letters under each line')
            for k in range(3):
                line = st[k + 1]
                if r == 1 and k == 0: line = line.replace('Grass', 'Grasss').replace('rapid', 'rapidd').replace('danger', 'dangr').replace('seam', 'seem')   # a small typo still counts
                await ins.nth(k).fill(line.lower().replace(' -', '') if r == 2 else line)
            await pg.click('#tab-type [data-a="check"]')
            if r == 0: check(await pg.locator('#tab-type input.right').count() == 3, 'hinted stanza is marked right')
            await pg.click('#tab-type [data-a="next"]')
        res = await pg.locator('#tab-type .lead').inner_text()
        check(res.startswith('12 of 15'), f'type result ignores the hinted stanza: {res!r}')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','type')")
        check(rec and rec['best'] == 12 and rec['max'] == 15, f'type recorded {rec}')
        # wrong lines show the answer
        await pg.click('#tab-type [data-a="again"]')
        prog = await pg.locator('#tab-type .prog').inner_text(); si = int(prog.split('stanza ')[1].split(' ')[0]) - 1
        await pg.locator('#tab-type .tin input').nth(0).fill('something else entirely')
        await pg.click('#tab-type [data-a="check"]')
        check(POEM['stanzas'][si][1] in await pg.locator('#tab-type .ans').first.inner_text(), 'a wrong line shows the right one')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'type fits 1440x900 {o}')

        # ---- say the whole poem ----
        await go(pg, base, 'recite')
        for si in range(5):
            check(f'Stanza {si + 1} of 5' in await pg.locator('#tab-recite .prog').inner_text(), f'stanza {si + 1} comes in poem order')
            check(await pg.locator('#tab-recite .given').count() == 0, 'nothing is given') if si == 0 else None
            ins = pg.locator('#tab-recite .tin input'); check(await ins.count() == 4, 'four lines to type')
            for k in range(4):
                line = POEM['stanzas'][si][k]
                if si == 4 and k == 0: line = 'Than Oars divide the Oceam'   # one wrong letter is still right
                await ins.nth(k).fill(line)
            await pg.click('#tab-recite [data-a="check"]'); await pg.click('#tab-recite [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('bird-walk','recite')")
        check(rec and rec['best'] == 20 and rec['max'] == 20, f'whole poem recorded {rec}')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'recite end fits 1440x900 {o}')

        # ---- read aloud on speaks the flashcard; layout everywhere ----
        await pg.evaluate("SB.setActive('k2'); SB.setSetting('readAloud', true, 'k2')")
        await go(pg, base, 'cards'); await pg.wait_for_timeout(150)
        check(any('What line comes next' in s for s in await pg.evaluate('window.__spoken')), 'read aloud on: the flashcard question is spoken')
        await pg.evaluate("SB.setActive('k1')")
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in TABS:
            await go(pg, base, t); o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in TABS:
            await go(pg, base, t); o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')

        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)

asyncio.run(main())
