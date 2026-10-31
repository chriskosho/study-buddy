"""Speed and Accuracy Tests (Typing) test (Playwright + Chromium).
Speed test: real keystrokes with the page clock fast-forwarded past the time limit, the scores (speed, raw speed, accuracy, steadiness),
the chart and its hover readout, what counts toward mastery, credit, history and bests, "Same text again", a space after time is up
not starting a new test, Insane rules, and leaving the tab mid-test. Accuracy test: mistakes, the Insane first-mistake stop.
Your own text: cleaning pasted text and typing it. Layout: 1440x900 and 1280x720 with no scroll, 360px and 915x412 with no sideways scroll.
Run:  python3 study-buddy/_dev/tests/typing_tests_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/typing/tests/index.html'
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
window.__ff = 0; (() => { const pn = performance.now.bind(performance); performance.now = () => pn() + window.__ff; })();   // the test can move the clock forward
"""
def TEXT(tool): return f"[...document.querySelectorAll('#tab-{tool} .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"
def POS(tool): return f"[...document.querySelectorAll('#tab-{tool} .sbty-text .c')].findIndex(s => s.classList.contains('cur'))"
ST = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.typing-tests') || '{}')"
LK = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.learn-keys') || '{}')"
CHILD = "JSON.parse(localStorage.getItem('studybuddy.v1.child.k1') || '{}')"

async def overflow(pg):
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

        # ---- Speed test: 1 minute, Medium ----
        await pg.goto(base + M); await pg.wait_for_selector('#tab-speed .sbty-text .c')
        check(await pg.inner_text('.tclock') == '1:00', 'the clock shows 1:00 before the first key')
        check(await pg.locator('[data-len="60"][aria-pressed="true"]').count() == 1 and await pg.locator('[data-lvl="medium"][aria-pressed="true"]').count() == 1, '1 minute and Medium are picked first')
        t = await pg.evaluate(TEXT('speed'))
        check(len(t) >= 600 and t[0].isupper(), f'enough sentence text for a fast typist ({len(t)} characters)')
        daily0 = (await pg.evaluate(CHILD)).get('daily', {}).get('n', 0)
        typed = t[:60]
        for i, c in enumerate(typed):
            if i in (10, 30): await pg.keyboard.type('~')
            await pg.keyboard.type(c, delay=15)
        check((await pg.inner_text('.tclock')) in ('1:00', '0:59', '0:58', '0:57', '0:56', '0:55'), 'the clock is running')   # typing takes a second or more, longer on a busy machine
        await pg.evaluate("window.__ff += 61000"); await pg.wait_for_timeout(450)
        m = await pg.inner_text('#tab-speed .tmsg')
        check(m.startswith('Time!'), f'time is up: {m}')
        tiles = await pg.locator('#tab-speed .ttiles b').all_inner_texts()
        check(tiles[0] == '12', f'60 right keys in a minute is 12 words a minute: {tiles}')
        check(tiles[1] == '12' and tiles[2] == '96%', f'raw speed counts all 62 keys (12.4) and accuracy is 60 of 62 (96%): {tiles}')
        check(await pg.locator('#tab-speed .tchart svg path.ln').count() == 1 and await pg.locator('#tab-speed .tchart table tr').count() == 13, 'a speed chart with a table of 12 five-second steps')
        check(await pg.locator('#tab-speed .ttype').is_hidden(), 'results show in place of the text')
        await pg.locator('#tab-speed .tchart rect.hit').nth(0).hover()
        check('words a minute' in await pg.inner_text('#tab-speed .ttip'), 'hovering the chart shows the speed for that moment')
        ch = await pg.evaluate(CHILD); rec = ch['tools'].get('typing-tests/speed', {})
        check(rec.get('best') == 12 and rec.get('attempts') == 1, f'a 1 minute test at 90%+ records its speed: {rec}')
        check(ch['daily']['n'] == daily0 + 1, 'it counts toward today')
        st = await pg.evaluate(ST)
        check(st['speed']['best']['60:medium']['wpm'] == 12 and len(st['speed']['history']) == 1, 'best and history saved')
        check('12 words a minute' in await pg.inner_text('#tab-speed .tline'), 'the best shows above the test')
        letter = next(c for c in typed if 'a' <= c <= 'z')   # the first small letter typed (capitals are not part of the letter stats)
        check(len((await pg.evaluate(LK)).get('stats', {}).get(letter, [])) >= 1, 'the letters count in the shared letter stats')
        # a space typed after time is up does not start a new test
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(100)
        check(await pg.locator('#tab-speed .tres').is_visible(), 'a space after time is up leaves the results on screen')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'results fit 1440x900 {o}')
        await pg.click('[data-x="same"]')
        check(await pg.evaluate(TEXT('speed')) == t and await pg.inner_text('.tclock') == '1:00', 'Same text again gives the same text and a fresh clock')
        await pg.click('[data-x="again"]') if await pg.locator('[data-x="again"]').is_visible() else None

        # ---- a 30 second test does not count toward mastery ----
        await pg.click('[data-len="30"]')
        check(await pg.inner_text('.tclock') == '0:30', '30 seconds')
        t = await pg.evaluate(TEXT('speed'))
        await pg.keyboard.type(t[:40], delay=10)
        await pg.evaluate("window.__ff += 31000"); await pg.wait_for_timeout(450)
        check('1 minute or more' in await pg.inner_text('#tab-speed .tmsg'), '30 second tests say they do not count toward mastery')
        rec = (await pg.evaluate(CHILD))['tools']['typing-tests/speed']
        check(rec.get('best') == 12 and rec.get('lastScore') == 0, f'the 30 second test records 0: {rec}')

        # ---- leaving the tab mid-test starts it over ----
        await pg.click('[data-len="60"]')
        t = await pg.evaluate(TEXT('speed'))
        await pg.keyboard.type(t[:5], delay=10)
        await pg.click('#tabbtn-accuracy'); await pg.click('#tabbtn-speed'); await pg.wait_for_timeout(100)
        check(await pg.evaluate(POS('speed')) == 0 and await pg.inner_text('.tclock') == '1:00', 'leaving the tab mid-test starts it over')

        # ---- Insane: wrong keys move on, no Backspace ----
        await pg.click('[data-lvl="insane"]')
        t = await pg.evaluate(TEXT('speed'))
        await pg.keyboard.type(t[0]); await pg.keyboard.type('~')
        check(await pg.evaluate(POS('speed')) == 2, 'Insane: a wrong key moves on')
        await pg.keyboard.press('Backspace')
        check(await pg.evaluate(POS('speed')) == 2, 'Insane: Backspace does nothing')
        await pg.click('[data-lvl="easy"]')
        t = await pg.evaluate(TEXT('speed'))
        check(t == t.lower().replace('i ', 'I ') or all(w.islower() or w == 'I' for w in t.split(' ')), 'Easy is common words')

        # ---- Accuracy test ----
        await pg.goto(base + M + '?tool=accuracy'); await pg.wait_for_selector('#tab-accuracy .sbty-text .c')
        t = await pg.evaluate(TEXT('accuracy'))
        check(len(t) >= 150 and t[0].isupper(), 'accuracy test text is a couple of sentences')
        for i, c in enumerate(t):
            if i == 3: await pg.keyboard.type('~')
            await pg.keyboard.type(c, delay=5)
        await pg.wait_for_timeout(150)
        m = await pg.inner_text('#tab-accuracy .tmsg')
        check('1 mistake' in m and '% right' in m, f'accuracy result names the mistake: {m}')
        check(await pg.locator('#tab-accuracy .ttype').is_visible(), 'the text stays so the mistake can be seen')
        rec = (await pg.evaluate(CHILD))['tools'].get('typing-tests/accuracy', {})
        check(rec.get('max') == 100 and 95 <= rec.get('best', 0) < 100, f'accuracy recorded as a percent: {rec}')
        await pg.click('#tab-accuracy [data-lvl="insane"]')
        t = await pg.evaluate(TEXT('accuracy'))
        stop = next(i for i in range(10, len(t)) if t[i].isalpha())   # stop on a letter (a missed space is not listed as a key)
        await pg.keyboard.type(t[:stop], delay=5); await pg.keyboard.type('~')
        m = await pg.inner_text('#tab-accuracy .tmsg')
        check(f'Stopped at the first mistake after {stop}' in m and 'Keys to practice' in m, f'Insane ends at the first mistake and names the key: {m}')
        await pg.keyboard.type(t[stop])
        check('Stopped' in await pg.inner_text('#tab-accuracy .tmsg'), 'typing after the stop does nothing')

        # ---- Your own text ----
        await pg.goto(base + M + '?tool=custom'); await pg.wait_for_selector('#tab-custom textarea')
        await pg.click('[data-x="use"]')
        check('at least a few words' in await pg.inner_text('#tab-custom .terr'), 'empty text asks for some words')
        await pg.fill('#tab-custom textarea', 'Привет こんにちは'); await pg.click('[data-x="use"]')
        check('Only letters on this keyboard' in await pg.inner_text('#tab-custom .terr'), 'text in another alphabet gets a clear message')
        await pg.fill('#tab-custom textarea', '“Spelling” words — café,\n\tfriend  because')
        await pg.click('[data-x="use"]')
        t = await pg.evaluate(TEXT('custom'))
        check(t == '"Spelling" words - cafe, friend because', f'pasted text is made typeable: {t}')
        await pg.keyboard.type(t, delay=5); await pg.wait_for_timeout(100)
        check('Done:' in await pg.inner_text('#tab-custom .tmsg'), 'your own text can be typed')
        check(not (await pg.evaluate(CHILD))['tools'].get('typing-tests/custom', {}).get('attempts'), 'your own text is practice only')
        await pg.reload(); await pg.wait_for_selector('#tab-custom textarea')
        check('Spelling' in await pg.input_value('#tab-custom textarea'), 'the text is kept for next time')

        # ---- layout ----
        for tool in ['speed', 'accuracy', 'custom']:
            for w, h in [(1440, 900), (1280, 720)]:
                await pg.set_viewport_size({'width': w, 'height': h})
                await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_timeout(250)
                o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits {w}x{h} {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        # results at 1280x720 and on a phone
        await pg.set_viewport_size({'width': 1280, 'height': 720}); await pg.goto(base + M); await pg.wait_for_selector('#tab-speed .sbty-text .c')
        t = await pg.evaluate(TEXT('speed')); await pg.keyboard.type(t[:30], delay=5)
        await pg.evaluate("window.__ff += 61000"); await pg.wait_for_timeout(450)
        o = await overflow(pg); check(o['v'] <= 0, f'speed results fit 1280x720 {o}')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.wait_for_timeout(400)
        o = await overflow(pg); check(o['h'] <= 0, f'speed results have no sideways scroll at 360 ({o["h"]})')
        # the chart's labels stay readable on a phone
        px = await pg.evaluate("(() => { const t = document.querySelector('#tab-speed .tchart text.ax'); return t ? t.getBoundingClientRect().height : 0; })()")
        check(px >= 11, f'chart labels are readable at 360 ({px:.0f}px tall)')
        # a very long pasted word wraps instead of running off the box
        await pg.goto(base + M + '?tool=custom'); await pg.wait_for_selector('#tab-custom textarea')
        if await pg.locator('#tab-custom [data-x="new"]').is_visible(): await pg.click('#tab-custom [data-x="new"]')
        await pg.fill('#tab-custom textarea', 'Supercalifragilisticexpialidocious-antidisestablishmentarianism https://example.com/a/very/long/link/that/goes/on')
        await pg.click('[data-x="use"]'); await pg.wait_for_timeout(100)
        w = await pg.evaluate("(() => { const b = document.querySelector('#tab-custom .sbty-text'); return [b.scrollWidth, b.clientWidth]; })()")
        check(w[0] <= w[1] + 1, f'a long word wraps inside the text box at 360 {w}')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
