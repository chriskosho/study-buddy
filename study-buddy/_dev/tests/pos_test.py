"""Parts of Speech test (Playwright + Chromium).
Plays every tool to the end with correct answers (and some wrong ones), checks results reach the hub,
checks read aloud stays silent when off, the parent PIN on Reset, and layout:
1440x900 with no scroll on every tool, 360px phone with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/pos_test.py   (from the repository root, or anywhere)"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
M = 'modules/english/parts-of-speech/index.html'
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
# answer helpers that run in the page (data.js consts are global)
TAGS_JS = """(sentText) => {
  const norm = s => s.replace(/\\s+/g,' ').replace(/ ([,.!?])/g,'$1').trim();
  const all = [...SENTENCES, ...TRICKY.map(t => t.s)];
  for (const s of all) {
    const toks = s.split(' ');
    const words = toks.map(t => t.split('/')[0]).join(' ');
    if (norm(words) === norm(sentText)) return toks.map(t => { const m = t.match(/^(.+)\\/(\\w+)\\*?$/); return m ? (m[2] === 'art' ? 'adj' : m[2]) : null; });
  }
  return null; }"""
SENT_TEXT_JS = "() => [...document.querySelectorAll('section.panel:not([hidden]) .words > *')].map(e => e.classList.contains('punct') ? e.textContent : e.querySelector('.w').textContent).join(' ')"
NAME = {'n': 'noun', 'v': 'verb', 'adj': 'adjective', 'adv': 'adverb', 'pron': 'pronoun'}

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

        # ---- hub shows the module ----
        await pg.goto(base + 'index.html#/home/english'); await pg.wait_for_selector('a.mod[href="#/module/parts-of-speech"]')
        txt = await pg.locator('a.mod[href="#/module/parts-of-speech"]').inner_text()
        check('Parts of Speech' in txt and 'Insane' in txt, 'English shows Parts of Speech, Easy to Insane')
        check('0 of 4 mastered' in txt, 'four scored tools (flashcards are practice only)')

        # ---- study guide ----
        await pg.goto(base + M); await pg.wait_for_selector('.gcard')
        check(await pg.locator('.gcard').count() == 8, 'study guide shows 8 parts')
        check(await pg.locator('nav.tabs button').count() == 6, 'six tool tabs')
        check(await pg.evaluate('window.__spoken.length') == 0, 'read aloud off: nothing spoken on open')
        await pg.click('.gcard >> nth=0 >> .spk'); await pg.wait_for_timeout(100)
        check(len(await pg.evaluate('window.__spoken')) == 1, 'speaker button speaks even with read aloud off')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'guide fits 1440x900 {o}')

        # ---- flashcards: words deck, all known ----
        await pg.click('nav.tabs button[data-tab="cards"]')
        await pg.click('section.panel:not([hidden]) .seg button[data-m="words"]')
        for i in range(10):
            await pg.click('section.panel:not([hidden]) [data-a="knew"]'); await pg.wait_for_timeout(60)
        check('Deck complete' in await pg.locator('#tab-cards .front').text_content(), 'flashcard deck completes')
        rec = await pg.evaluate("SB.toolRecord('parts-of-speech','cards')")
        check(not rec or rec.get('best') is None, f'flashcards are practice only: no score recorded {rec}')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'cards fits 1440x900 {o}')

        # ---- sort it: one wrong, then all right ----
        await pg.click('nav.tabs button[data-tab="sort"]')
        first = pg.locator('#tab-sort .sortTray .chip').first
        right = await first.get_attribute('data-b')
        wrong = [x for x in ['n', 'v', 'adj'] if x != right][0]
        await first.click(); await pg.click(f'#tab-sort .bucket[data-b="{wrong}"]')
        check(await pg.locator('#tab-sort .miss').inner_text() == '1', 'wrong sort counts a miss')
        while await pg.locator('#tab-sort .sortTray .chip').count():
            c = pg.locator('#tab-sort .sortTray .chip').first; pp = await c.get_attribute('data-b')
            sel = await c.get_attribute('class')
            if 'sel' not in sel: await c.click()
            await pg.click(f'#tab-sort .bucket[data-b="{pp}"]')
        rec = await pg.evaluate("SB.toolRecord('parts-of-speech','sort')")
        check(rec and rec['best'] == 11, f'sort result 12 minus 1 miss {rec}')
        # drag one chip with the mouse
        await pg.click('#tab-sort [data-a="restart"]')
        c = pg.locator('#tab-sort .sortTray .chip').first; pp = await c.get_attribute('data-b')
        cb = await c.bounding_box(); bb = await pg.locator(f'#tab-sort .bucket[data-b="{pp}"]').bounding_box()
        await pg.mouse.move(cb['x'] + 10, cb['y'] + 10); await pg.mouse.down()
        await pg.mouse.move(cb['x'] + 40, cb['y'] + 40, steps=4); await pg.mouse.move(bb['x'] + 60, bb['y'] + 80, steps=8); await pg.mouse.up()
        check(await pg.locator('#tab-sort .placed').inner_text() == '1/12', 'drag and drop places a word')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'sort fits 1440x900 {o}')

        # ---- spot it: first one wrong, rest right ----
        await pg.click('nav.tabs button[data-tab="spot"]')
        for r in range(10):
            await pg.wait_for_selector('#tab-spot .wtok')
            want = (await pg.locator('#tab-spot .prompt em').inner_text()).strip()
            tags = await pg.evaluate(TAGS_JS, await pg.evaluate(SENT_TEXT_JS))
            check(tags is not None, f'spot sentence {r + 1} found in data') if tags is None else None
            idx = [i for i, t in enumerate(tags) if t and NAME.get(t) == want]
            bad = [i for i, t in enumerate(tags) if t and NAME.get(t) != want]
            if r == 0 and bad:
                await pg.click(f'#tab-spot .wtok[data-i="{bad[0]}"]')
            await pg.click(f'#tab-spot .wtok[data-i="{idx[0]}"]')
            await pg.click('#tab-spot [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('parts-of-speech','spot')")
        check(rec and rec['best'] == 9 and rec['max'] == 10, f'spot it scores first tries only {rec}')

        # ---- speed round: a few right answers, then fast-forward the clock ----
        await pg.click('nav.tabs button[data-tab="speed"]')
        await pg.click('#tab-speed [data-a="start"]')
        for i in range(3):
            q = await pg.evaluate("() => { const m = document.querySelector('#tab-speed .q mark'); const s = document.querySelector('#tab-speed .q'); return [s.textContent, m.textContent]; }")
            tags = await pg.evaluate(TAGS_JS, q[0])
            words = await pg.evaluate("t => t.split(' ').filter(w => !/^[,.!?]$/.test(w))", q[0].replace(',', ' ,').replace('.', ' .').replace('!', ' !'))
            mark_index = await pg.evaluate("() => { const s = document.querySelector('#tab-speed .q'); let i = 0, found = -1; s.childNodes.forEach(n => { if (n.nodeType === 3) { const parts = n.textContent.split(' ').filter(Boolean); parts.forEach(p => { if (!/^[,.!?]+$/.test(p)) i++; }); } else { found = i; i++; } }); return found; }")
            word_tags = [t for t in tags if t]
            await pg.click(f'#tab-speed .pgrid button[data-p="{word_tags[mark_index]}"]'); await pg.wait_for_timeout(350)
        check(await pg.locator('#tab-speed .sc').inner_text() == '3', 'speed round counts right answers')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'speed fits 1440x900 {o}')
        await pg.click('nav.tabs button[data-tab="label"]')   # leaving stops the timer
        await pg.wait_for_timeout(1200)
        stopped = await pg.evaluate("() => [...document.querySelectorAll('#tab-speed .pgrid button')].every(b => b.disabled) && document.querySelector('#tab-speed .q').textContent.startsWith('Press Start')")
        check(stopped, 'leaving the speed round stops it')

        # ---- label the sentence: all perfect ----
        for r in range(5):
            await pg.wait_for_selector('#tab-label .wtok')
            tags = await pg.evaluate(TAGS_JS, await pg.evaluate(SENT_TEXT_JS))
            for i, t in enumerate(tags):
                if not t: continue
                await pg.click(f'#tab-label .palette button[data-p="{t}"]')
                await pg.click(f'#tab-label .wtok[data-i="{i}"]')
            await pg.click('#tab-label [data-a="check"]')
            check('Every word is right' in await pg.locator('#tab-label .msg').inner_text(), f'label sentence {r + 1} perfect')
            check(len(await pg.locator('#tab-label .why').inner_text()) > 10, f'label sentence {r + 1} explains the tricky word')
            await pg.click('#tab-label [data-a="next"]')
        rec = await pg.evaluate("SB.toolRecord('parts-of-speech','label')")
        check(rec and rec['best'] == 5, f'label result {rec}')

        # ---- hub reflects mastery ----
        await pg.goto(base + 'index.html#/module/parts-of-speech'); await pg.wait_for_selector('.tool')
        mastered = await pg.locator('.tool.mastered').count()
        check(mastered == 3, f'hub shows 3 tools mastered (sort, spot, label; flashcards give no credit) -> {mastered}')

        # ---- read aloud on (Hazel) speaks prompts ----
        await pg.evaluate("SB.setActive('k2'); SB.setSetting('readAloud', true, 'k2')")
        await pg.goto(base + M + '?tool=spot'); await pg.wait_for_selector('#tab-spot .wtok'); await pg.wait_for_timeout(100)
        spoken = await pg.evaluate('window.__spoken')
        check(any(s.startswith('Tap a') for s in spoken), f'read aloud on: Spot it question is spoken {spoken[:1]}')
        check(await pg.locator('#sbRead').inner_text() == 'Read aloud: on', 'read aloud toggle shows on')

        # ---- reset asks for PIN ----
        await pg.click('#sbReset')
        check(await pg.locator('.sb-dlg').count() == 1, 'reset asks for parent PIN (or to set one)')
        await pg.keyboard.press('Escape')

        # ---- phone ----
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for t in ['guide', 'cards', 'sort', 'spot', 'speed', 'label']:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['h'] <= 0, f'phone {t}: no sideways scroll {o}')

        # ---- 1440 every tool fits ----
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        for t in ['guide', 'cards', 'sort', 'spot', 'speed', 'label']:
            await pg.goto(base + M + '?tool=' + t); await pg.wait_for_timeout(200)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'1440x900 {t}: no scroll {o}')

        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)

asyncio.run(main())
