"""Learn the Keys (Typing) test (Playwright + Chromium).
Types real lesson rounds key by key: right keys, wrong keys with "Fix mistakes" on and off, Backspace, a new letter opening,
credit and saved results. Plays Key Hunt (wrong key, hint, tapping keys, the result), checks the Keyboard map fingers and Key stats,
the "/" key staying a typing key, the phone notice and on-screen keyboard input, and layout: 1440x900 with no scroll, 360px phone and
915x412 landscape phone with no sideways scroll. The word lists and unlocking rules are checked in bulk by gen_check_typing.mjs.
Run:  python3 study-buddy/_dev/tests/typing_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/typing/learn-keys/index.html'
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
TEXT = "[...document.querySelectorAll('#lkType .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"
POS = "[...document.querySelectorAll('#lkType .sbty-text .c')].findIndex(s => s.classList.contains('cur'))"
STATE = "JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.learn-keys') || '{}')"
CHILD = "JSON.parse(localStorage.getItem('studybuddy.v1.child.k1') || '{}')"

async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def type_round(pg, delay=45):
    t = await pg.evaluate(TEXT)
    for ch in t:
        await pg.keyboard.type(ch, delay=delay)
    await pg.wait_for_timeout(120)
    return t

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

        # ---- Lesson: the first round ----
        await pg.goto(base + M); await pg.wait_for_selector('#lkType .sbty-text .c')
        check(await pg.locator('.lkletters span:not(.off)').count() == 7, 'seven letters open at the start')
        t = await pg.evaluate(TEXT)
        check(set(t) <= set('asdfjkl '), f'the first text only uses the home row: "{t}"')
        check(len(t.split(' ')) == 12, 'a round is 12 words')
        check(await pg.locator('.lkkb g.k.next').count() == 1, 'the next key is lit on the keyboard')
        daily0 = (await pg.evaluate(CHILD)).get('daily', {}).get('n', 0)
        await type_round(pg)
        msg = await pg.inner_text('.lkmsg')
        check('Round done' in msg and '100%' in msg, f'round result shows: {msg}')
        st = await pg.evaluate(STATE)
        check(len(st.get('rounds', [])) == 1 and st['rounds'][0]['acc'] == 1, 'the round is saved')
        check(st.get('best', 0) > 20, f'best speed saved ({st.get("best")})')
        ch = await pg.evaluate(CHILD)
        rec = ch['tools'].get('learn-keys/lesson', {})
        check(rec.get('attempts') == 1 and rec.get('best') == 7 and rec.get('max') == 26, f'result is letters open of 26: {rec}')
        check(ch['daily']['n'] == daily0 + 1, 'a round at 90%+ counts toward today')
        check(await pg.evaluate(POS) == 0 and await pg.evaluate(TEXT) != t, 'a new round starts right away')

        # ---- a wrong key with Fix mistakes on ----
        t = await pg.evaluate(TEXT)
        wrong = 'z' if t[0] != 'z' else 'q'
        await pg.keyboard.type(wrong)
        check(await pg.evaluate(POS) == 0, 'a wrong key does not move on')
        check(await pg.locator('#lkType .c.cur.miss').count() == 1, 'the letter shows the mistake')
        await pg.keyboard.type(t[0])
        check(await pg.evaluate(POS) == 1, 'the right key moves on')
        check(await pg.locator('#lkType .c.bad').count() == 1, 'the fixed letter stays marked')
        # "/" is a key to type, not the search shortcut
        await pg.keyboard.type('/')
        check(not await pg.evaluate("document.activeElement && document.activeElement.id === 'sbQ'"), '"/" does not jump to search')
        check(await pg.evaluate(POS) == 1, '"/" counts as a wrong key only')
        for c in t[1:]: await pg.keyboard.type(c, delay=40)
        await pg.wait_for_timeout(120)
        msg = await pg.inner_text('.lkmsg')
        check('Round done' in msg and '100%' not in msg, f'accuracy counts the mistakes: {msg}')

        # ---- a new letter opens ----
        opened = False
        for r in range(14):
            await type_round(pg, delay=40)
            st = await pg.evaluate(STATE)
            if st.get('unlocked', 7) >= 8: opened = True; break
        check(opened, f'a new letter opens after fast, accurate rounds ({r + 1} rounds)')
        msg = await pg.inner_text('.lkmsg')
        check('New letter: g' in msg and 'left pointer finger' in msg, f'the new letter is announced: {msg}')
        check(await pg.locator('.lkletters span:not(.off)').count() == 8, 'eight letters open')
        check('g' in (await pg.inner_text('.lkfocus .fk')), 'the new letter is the focus')
        t = await pg.evaluate(TEXT)
        check('g' in t and set(t) <= set('asdfjklg '), f'the new text uses g: "{t}"')
        await pg.reload(); await pg.wait_for_selector('#lkType .sbty-text .c')
        check(await pg.locator('.lkletters span:not(.off)').count() == 8, 'open letters are kept after a reload')

        # ---- Fix mistakes off: wrong keys move on, Backspace steps back ----
        await pg.click('#lkWait')
        check('off' in await pg.inner_text('#lkWait'), 'Fix mistakes turns off')
        t = await pg.evaluate(TEXT)
        await pg.keyboard.type(t[0]); await pg.keyboard.type('z' if t[1] != 'z' else 'q')
        check(await pg.evaluate(POS) == 2, 'a wrong key moves on when Fix mistakes is off')
        check(await pg.locator('#lkType .c.bad').count() == 1, 'the wrong letter is marked')
        await pg.keyboard.press('Backspace')
        check(await pg.evaluate(POS) == 1, 'Backspace steps back')
        # a letter fixed with Backspace still counts as a mistake in the key stats
        before = await pg.evaluate("(() => { const s = JSON.parse(localStorage.getItem('studybuddy.v1.m.k1.learn-keys')); return s.stats; })()")
        t = await pg.evaluate(TEXT)
        rest = t[1:]
        await pg.keyboard.type(rest)
        await pg.wait_for_timeout(150)
        after = (await pg.evaluate(STATE))['stats']
        k2 = t[1]
        miss_b = sum(1 for x in before.get(k2, []) if not x[1]); miss_a = sum(1 for x in after.get(k2, []) if not x[1])
        check(miss_a >= min(miss_b + 1, 30) or len(after.get(k2, [])) == 30 and miss_a >= 1, f'the fixed letter "{k2}" is saved as a mistake ({miss_b} -> {miss_a})')
        await pg.click('#lkWait')
        check((await pg.evaluate(STATE)).get('wait') is True, 'Fix mistakes is saved')
        await pg.select_option('#lkTarget', '25')
        check((await pg.evaluate(STATE)).get('target') == 25 and '25 words a minute' in await pg.inner_text('.lkfocus'), 'target speed changes and is saved')
        await pg.select_option('#lkTarget', '15')
        p0 = await pg.evaluate(POS); t = await pg.evaluate(TEXT)
        await pg.keyboard.type(t[p0])
        check(await pg.evaluate(POS) == p0 + 1, 'typing works right after changing the target speed')
        # a capital (Caps Lock or Shift) is not counted, and the student is told
        t = await pg.evaluate(TEXT); p0 = await pg.evaluate(POS)
        if t[p0] != ' ':
            await pg.keyboard.type(t[p0].upper())
            check(await pg.evaluate(POS) == p0 and await pg.locator('#lkType .c.cur.miss').count() == 0, 'a capital letter is not counted as a mistake')
            check(await pg.locator('.sbty-caps').is_visible() and 'Shift' in await pg.inner_text('.sbty-caps'), 'and a message says why')
            await pg.keyboard.type(t[p0])
            check(await pg.locator('.sbty-caps').is_hidden(), 'the message goes away')
        # tapping a key in the picture types it
        p0 = await pg.evaluate(POS); t = await pg.evaluate(TEXT)
        await pg.locator(f'.lkkb g.k[data-k="{t[p0]}"]').click()
        check(await pg.evaluate(POS) == p0 + 1, 'tapping a key in the picture types it')
        await pg.click('#lkKb'); check(await pg.locator('.lkkb').is_hidden(), 'the keyboard can be hidden')
        await pg.click('#lkKb'); check(await pg.locator('.lkkb').is_visible(), 'and shown again')

        # ---- Key Hunt ----
        await pg.goto(base + M + '?tool=hunt'); await pg.wait_for_selector('.huntletter')
        check(await pg.locator('.khkb g.k.off').count() > 20, 'keys outside the home row are dimmed')
        letters = []
        for i in range(10):
            want = (await pg.inner_text('.huntletter')).strip().lower()
            letters.append(want)
            if i == 0:
                bad = 'a' if want != 'a' else 's'
                await pg.keyboard.type(bad)
                m = await pg.inner_text('#tab-hunt .msg')
                check('look for ' + want in m.lower() and 'finger' in m, f'a wrong key gives a hint: {m}')
                check(await pg.locator(f'.khkb g.k.hint[data-k="{want}"]').count() == 1, 'the right key is outlined')
            if i == 1:
                await pg.locator(f'.khkb g.k[data-k="{want}"]').click()   # tapping a key works too
            else:
                await pg.keyboard.type(want)
            await pg.wait_for_timeout(760)
        check(set(''.join(letters)) <= set('asdfghjkl'), f'home row letters only: {letters}')
        check(await pg.locator('.huntdone h2').count() == 1 and '9 of 10' in await pg.inner_text('.huntdone h2'), 'Key Hunt finishes with 9 of 10')
        rec = (await pg.evaluate(CHILD))['tools'].get('learn-keys/hunt', {})
        check(rec.get('best') == 9 and rec.get('max') == 10, f'Key Hunt result saved: {rec}')
        await pg.click('#khAgain'); check(await pg.locator('.huntletter').count() == 1, 'Play again starts a new round')
        # leaving the tab right after an answer pauses the round
        want = (await pg.inner_text('.huntletter')).strip().lower()
        await pg.keyboard.type(want); await pg.click('#tabbtn-map'); await pg.wait_for_timeout(900)
        await pg.click('#tabbtn-hunt'); await pg.wait_for_timeout(100)
        check(await pg.inner_text('#khRound') == '2 of 10', 'Key Hunt waits while another tab is open, then carries on')
        await pg.keyboard.press('Space'); check('Look for' not in await pg.inner_text('#tab-hunt .msg'), 'the space bar is ignored in Key Hunt')
        await pg.click('[data-set="top"]')
        want = (await pg.inner_text('.huntletter')).strip().lower()
        check(want in 'qwertyuiop', 'Top row asks top-row letters')
        check((await pg.inner_text('.huntletter')).strip() == want.upper(), 'Key Hunt shows capitals by default, like the keys')
        await pg.click('#khCaps')
        check((await pg.inner_text('.huntletter')).strip() == want, 'turning Capitals off shows the small letter')
        await pg.keyboard.type(want)
        await pg.wait_for_timeout(100)
        check('Yes' in await pg.inner_text('#tab-hunt .msg'), 'the key answers the small letter too')

        # ---- Keyboard map ----
        await pg.goto(base + M + '?tool=map'); await pg.wait_for_selector('.kmkb svg')
        await pg.keyboard.type('g'); m = await pg.inner_text('.kmpress')
        check('G' in m and 'Left pointer finger' in m, f'g is the left pointer finger: {m}')
        await pg.keyboard.type(';'); check('Right pinky finger' in await pg.inner_text('.kmpress'), '; is the right pinky')
        await pg.keyboard.press('Space'); check('thumb' in (await pg.inner_text('.kmpress')).lower(), 'space is a thumb')
        await pg.locator('.kmkb g.k[data-k="o"]').click(); check('Right ring finger' in await pg.inner_text('.kmpress'), 'tapping o shows the right ring finger')
        await pg.keyboard.press('Shift'); check('Shift' in await pg.inner_text('.kmpress') and 'pinky' in await pg.inner_text('.kmpress'), 'Shift shows a pinky')
        await pg.locator('.kmkb g.k[data-k="Enter"]').click(); check('Enter' in await pg.inner_text('.kmpress') and 'Right pinky' in await pg.inner_text('.kmpress'), 'tapping Enter shows the right pinky')

        # ---- Key stats ----
        await pg.goto(base + M + '?tool=stats'); await pg.wait_for_selector('.ksum')
        s = await pg.inner_text('.ksum')
        n_open = (await pg.evaluate(STATE)).get('unlocked', 7)   # usually 8; a fast run can open a ninth letter
        check(f'{n_open} of 26' in s and n_open >= 8 and 'words a minute' in s, f'stats summary: {s}')
        check(await pg.locator('.kskeys > div').count() == n_open, 'one box per open letter')
        check(await pg.locator('.kskb g.k.h4, .kskb g.k.h3').count() >= 6, 'fast letters are coloured')
        await pg.click('[data-m="acc"]'); check('Few mistakes' in await pg.inner_text('.kslegend'), 'accuracy view')

        # ---- layout ----
        for tool in ['lesson', 'hunt', 'map', 'stats']:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_timeout(300)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412), (1280, 720)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
            await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.wait_for_timeout(100)
            kw = await pg.evaluate("(() => { const s = document.querySelector('#tab-" + tool + " svg.sbkb'); return s ? s.getBoundingClientRect().width : 999; })()")
            check(kw >= 300, f'{tool} keyboard uses the phone width ({kw:.0f}px)')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await pg.evaluate("(() => { const d = JSON.parse(localStorage.getItem('studybuddy.v1.child.k1')); d.settings.theme = 'dark'; localStorage.setItem('studybuddy.v1.child.k1', JSON.stringify(d)); })()")
        await pg.goto(base + M); await pg.wait_for_selector('#lkType .c')
        bg = await pg.evaluate("getComputedStyle(document.querySelector('.sbkb .k[data-k=\"a\"] rect')).fill")
        check(bg not in ('rgb(255, 255, 255)', '#fff', 'white'), f'keys follow dark mode ({bg})')
        check(not errors, f'no page errors {errors[:2]}')

        # ---- a phone with no keyboard ----
        mctx = await b.new_context(viewport={'width': 412, 'height': 900}, has_touch=True, is_mobile=True, service_workers='block')
        await mctx.add_init_script(INIT)
        mp = await mctx.new_page(); mp.on('pageerror', lambda e: errors.append(str(e)))
        await mp.goto(base + M); await mp.wait_for_selector('#lkType .c')
        check(await mp.locator('#tab-lesson .note').count() == 1, 'phones show the keyboard notice')
        t = await mp.evaluate(TEXT)
        await mp.tap('#lkType .sbty-text')
        await mp.keyboard.insert_text(t[:3])
        check(await mp.evaluate(POS) == 3, 'the on-screen keyboard types too')
        # a keyboard that builds up the whole word in the box: only new letters count
        await mp.evaluate("(ch) => { const i = document.querySelector('#lkType .sbty-in'); i.value = i.value + ch; i.dispatchEvent(new Event('input')); }", t[3])
        check(await mp.evaluate(POS) == 4, 'letters already in the box are not typed twice')
        await mp.goto(base + M + '?tool=hunt'); await mp.wait_for_selector('.huntletter')
        want = (await mp.inner_text('.huntletter')).strip().lower()
        await mp.locator(f'.khkb g.k[data-k="{want}"]').tap()
        await mp.wait_for_timeout(100)
        check('Yes' in await mp.inner_text('#tab-hunt .msg'), 'Key Hunt works by tapping on a phone')
        o = await overflow(mp); check(o['h'] <= 0, f'phone has no sideways scroll ({o["h"]})')
        check(not errors, f'no page errors on the phone {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
