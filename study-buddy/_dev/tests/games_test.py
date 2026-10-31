"""Typing Games test (Playwright + Chromium).
Word Sprint: words typed key by key, Fix mistakes, the 1 minute limit (page clock fast-forwarded), the result and best, a key after time
not starting a new game, levels. Falling Words: start, clearing a word, misses and game over (game time sped up), best, pausing when the
tab is left, reduce motion (words step instead of glide), no two falling words starting with the same letter. Ghost Race: the ghost
marker, beating a slow ghost, a fast ghost winning, the best race becoming the ghost's speed. Games are practice only (no results).
Layout: 1440x900 and 1280x720 with no scroll, 360px and 915x412 with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/games_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/typing/games/index.html'
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
window.__ff = 0; (() => { const pn = performance.now.bind(performance); performance.now = () => pn() + window.__ff;
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => cb(t + window.__ff)); })();
"""
ST = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.typing-games') || '{}')"
CHILD = "JSON.parse(localStorage.getItem('studybuddy.v1.child.k1') || '{}')"
WORD = "[...document.querySelectorAll('.ws-word span')].map(s => s.textContent).join('')"
GTEXT = "[...document.querySelectorAll('#tab-ghost .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"

async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def speed_up(pg, ms, step=200):
    for _ in range(ms // step):
        await pg.evaluate(f"window.__ff += {step}"); await pg.wait_for_timeout(20)

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

        # ---- Word Sprint ----
        await pg.goto(base + M); await pg.wait_for_selector('.ws-word span')
        check(await pg.inner_text('#wsClock') == '1:00', 'the sprint clock shows 1:00')
        w = await pg.evaluate(WORD)
        await pg.keyboard.type(w[0]); await pg.keyboard.type('~' if w[1] != '~' else 'q')
        check(await pg.locator('.ws-word .cur.miss').count() == 1, 'a wrong key is marked and does not move on')
        for c in w[1:]: await pg.keyboard.type(c, delay=10)
        check('1 word' in await pg.inner_text('#wsScore'), 'finishing a word scores it')
        for _ in range(5):
            w = await pg.evaluate(WORD); await pg.keyboard.type(w, delay=10)
        check('6 words' in await pg.inner_text('#wsScore'), 'six words scored')
        await pg.evaluate("window.__ff += 61000"); await pg.wait_for_timeout(450)
        check(await pg.locator('#tab-sprint .gover h2').count() == 1 and '6 words in 1 minute' in await pg.inner_text('#tab-sprint .gover h2'), 'time is up: 6 words in 1 minute')
        check((await pg.evaluate(ST))['sprint']['best']['easy'] == 6, 'the best is saved')
        await pg.keyboard.press('Space'); await pg.keyboard.type('a'); await pg.wait_for_timeout(100)
        check(await pg.locator('#tab-sprint .gover').count() == 1, 'keys after time is up do not start a new game')
        check('Best: 6 words' in await pg.inner_text('#tab-sprint .gline'), 'the best shows above the game')
        check(not (await pg.evaluate(CHILD)).get('tools', {}).get('typing-games/sprint', {}).get('attempts'), 'games record no result (practice only)')
        await pg.click('#tab-sprint [data-x="again"]')
        check(await pg.inner_text('#wsClock') == '1:00' and '0 words' in await pg.inner_text('#wsScore'), 'Play again starts fresh')
        await pg.click('#tab-sprint [data-lvl="hard"]')
        w = await pg.evaluate(WORD)
        check(len(w) >= 6, f'Hard uses longer words: {w}')
        check('No best yet' in await pg.inner_text('#tab-sprint .gline'), 'each level keeps its own best')

        # ---- Falling Words ----
        await pg.goto(base + M + '?tool=falling'); await pg.wait_for_selector('.fw-cover [data-x="go"]')
        await pg.click('[data-x="go"]'); await pg.wait_for_selector('.fw-word')
        word = (await pg.locator('.fw-word').first.inner_text()).strip()
        await pg.keyboard.type(word[0])
        check(await pg.locator('.fw-word.target').count() == 1, 'the first key picks the word')
        await pg.keyboard.press('Backspace'); await pg.keyboard.type(word[0])
        await pg.keyboard.type(word[1:], delay=20)
        check('1 word' in await pg.inner_text('#fwScore'), f'typing a word clears it ("{word}")')
        # no two falling words start with the same letter
        await speed_up(pg, 8000)
        firsts = [x.strip()[0].lower() for x in await pg.locator('.fw-word').all_inner_texts()]
        check(len(firsts) == len(set(firsts)) and len(firsts) >= 2, f'falling words all start with different letters {firsts}')
        # leaving the tab pauses
        await pg.click('#tabbtn-sprint'); await pg.click('#tabbtn-falling'); await pg.wait_for_timeout(100)
        check('Paused' in await pg.inner_text('.fw-cover') and await pg.locator('.fw-cover').is_visible(), 'leaving the tab pauses the game')
        await pg.click('.fw-cover [data-x="go"]')
        # let words reach the bottom: three misses end the game
        for _ in range(60):
            await speed_up(pg, 2000)
            if await pg.locator('.fw-cover [data-x="again"]').count(): break
        check(await pg.locator('.fw-cover [data-x="again"]').count() == 1 and 'cleared' in await pg.inner_text('.fw-cover'), 'three misses end the game')
        check(await pg.locator('.fw-lives i.on').count() == 0, 'no misses left')
        check((await pg.evaluate(ST))['fall']['best']['easy'] >= 1, 'the Falling Words best is saved')
        await pg.keyboard.type('abc')
        check(await pg.locator('.fw-cover [data-x="again"]').count() == 1, 'typing after game over does nothing')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'Falling Words fits 1440x900 {o}')

        # ---- Ghost Race ----
        await pg.goto(base + M + '?tool=ghost'); await pg.wait_for_selector('#tab-ghost .sbty-text .c')
        check('15 words a minute' in await pg.inner_text('#tab-ghost .gline'), 'with no race yet, the ghost uses the target speed')
        await pg.click('[data-gs="10"]')
        t = await pg.evaluate(GTEXT)
        check(t[0].isupper() and t.rstrip()[-1] in '.?!', 'the race text is sentences')
        await pg.keyboard.type(t[:3], delay=20); await pg.wait_for_timeout(200)
        check(await pg.locator('#tab-ghost .c.ghost').count() == 1, 'the ghost marker shows in the text')
        await pg.keyboard.type(t[3:], delay=5); await pg.wait_for_timeout(200)
        h = await pg.inner_text('#tab-ghost .gover h2')
        check('You beat the ghost' in h, f'beating a slow ghost: {h}')
        best = (await pg.evaluate(ST))['ghost']['best']
        check(best > 30, f'the race is saved as the best ({best})')
        await pg.click('[data-gs="best"]')
        check(f'{round(best)} words a minute' in await pg.inner_text('#tab-ghost .gline'), 'Your best makes the ghost race at the best speed')
        await pg.click('[data-gs="40"]')
        t = await pg.evaluate(GTEXT)
        await pg.keyboard.type(t[0]); await pg.evaluate("window.__ff += 120000"); await pg.wait_for_timeout(100)
        await pg.keyboard.type(t[1:], delay=2); await pg.wait_for_timeout(200)
        check('The ghost won' in await pg.inner_text('#tab-ghost .gover h2'), 'a fast ghost wins a slow race')
        check('100%' in await pg.inner_text('#tab-ghost .gr-gp'), 'the ghost bar is full')

        # ---- reduce motion: words step down instead of gliding ----
        rctx = await b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce', service_workers='block')
        await rctx.add_init_script(INIT); rp = await rctx.new_page(); rp.on('pageerror', lambda e: errors.append(str(e)))
        await rp.goto(base + M + '?tool=falling'); await rp.click('[data-x="go"]'); await rp.wait_for_selector('.fw-word')
        ys = []
        for _ in range(12):
            await rp.wait_for_timeout(100)
            ys.append(await rp.evaluate("(() => { const e = document.querySelector('.fw-word'); return e ? Math.round(new DOMMatrix(getComputedStyle(e).transform).m42) : null; })()"))
        moves = [b2 - a for a, b2 in zip(ys, ys[1:]) if a is not None and b2 is not None and b2 != a]
        check(len(moves) <= 3 and all(m >= 20 for m in moves), f'with reduce motion words move in steps {ys}')
        await rctx.close()

        # ---- layout ----
        for tool in ['sprint', 'falling', 'ghost']:
            for w_, h_ in [(1440, 900), (1280, 720)]:
                await pg.set_viewport_size({'width': w_, 'height': h_})
                await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_timeout(250)
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits {w_}x{h_} {o}')
            for w_, h_ in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w_, 'height': h_}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w_}x{h_} ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
