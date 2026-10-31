"""Typing polish test (Playwright + Chromium): checks across all four typing modules.
- Every typing tool fits 1440x900 with no scroll bars under each display option: default, Larger text, OpenDyslexic, both, and both in dark mode,
  including the screens after a round (drill results, speed and accuracy test results, game over, race result).
- The keyboard picture never shrinks below a readable size, and default settings keep the full CSS size.
- Phones: no sideways scroll at 360x740 or 915x412, the text to type is on the first screen in landscape, and Larger text keeps phone sizes.
- A shorter desktop window: the keyboard shrinks to fit and grows back; a medium window keeps the Keyboard map boxes apart; a short window with a mouse opens at the top.
- Backups: typing progress in all four modules goes out in a backup and comes back exactly after Erase everything.
Run:  python3 study-buddy/_dev/tests/typing_polish_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
def init(settings):
    return """
localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,inviteSnoozeUntil:9e15}));
(() => { const k = 'studybuddy.v1.child.k1', d = JSON.parse(localStorage.getItem(k) || '{}'); d.settings = Object.assign(d.settings || {}, %s); localStorage.setItem(k, JSON.stringify(d)); })();
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
window.__ff = 0; (() => { const pn = performance.now.bind(performance); performance.now = () => pn() + window.__ff;
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => cb(t + window.__ff)); })();
""" % json.dumps(settings)
TOOLS = {'learn-keys': ['lesson', 'hunt', 'map', 'stats'], 'drills': ['rows', 'words', 'marks', 'weak', 'sentences', 'paragraphs'],
         'tests': ['speed', 'accuracy', 'custom'], 'games': ['sprint', 'falling', 'ghost']}
DISPLAYS = [('default', {}), ('Larger text', {'size': 'large'}), ('OpenDyslexic', {'font': 'dyslexic'}),
            ('Larger text + OpenDyslexic', {'size': 'large', 'font': 'dyslexic'}), ('both, dark', {'size': 'large', 'font': 'dyslexic', 'theme': 'dark'})]
def TEXT(tool): return f"[...document.querySelectorAll('#tab-{tool} .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"
KB = "(() => { const s = [...document.querySelectorAll('svg.sbkb')].filter(x => x.getClientRects().length).pop(); return s ? s.getBoundingClientRect().height : 0; })()"   # the last visible keyboard (the one fit() sizes)
FITTED = "[...document.querySelectorAll('svg.sbkb')].some(x => x.style.maxHeight)"

async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/modules/typing/'
    async with async_playwright() as p:
        b = await p.chromium.launch()

        # ---- every tool, every display option, at 1440x900 ----
        for name, st in DISPLAYS:
            ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
            await ctx.add_init_script(init(st))
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            bad, small, fitted = [], [], []
            for mod, tools in TOOLS.items():
                for t in tools:
                    await pg.goto(base + mod + '/index.html?tool=' + t); await pg.wait_for_timeout(300)
                    o = await overflow(pg)
                    if o['v'] > 0 or o['h'] > 0: bad.append(f'{mod}/{t} {o}')
                    kb = await pg.evaluate(KB)
                    if kb and kb < 79: small.append(f'{mod}/{t} {kb:.0f}px')
                    if name == 'default' and await pg.evaluate(FITTED): fitted.append(f'{mod}/{t}')
                    if name == 'default' and await pg.evaluate('scrollY') != 0: fitted.append(f'{mod}/{t} scrolled')
            check(not bad, f'{name}: every typing tool fits 1440x900 {bad}')
            check(not small, f'{name}: keyboard pictures stay at least about 80px tall {small}')
            if name == 'default': check(not fitted, f'default settings: every keyboard keeps its CSS size and no page opens scrolled {fitted}')
            # the screens after a round, with the larger settings
            if name != 'Larger text':
                after = []
                await pg.goto(base + 'drills/index.html?tool=paragraphs'); await pg.wait_for_selector('#tab-paragraphs .sbty-text .c')
                t = await pg.evaluate(TEXT('paragraphs')); await pg.keyboard.type(t, delay=0); await pg.wait_for_timeout(200)
                o = await overflow(pg); after.append(('drill result', o))
                await pg.goto(base + 'tests/index.html'); await pg.wait_for_selector('#tab-speed .sbty-text .c')
                t = await pg.evaluate(TEXT('speed')); await pg.keyboard.type(t[:40], delay=0)
                await pg.evaluate("window.__ff += 61000"); await pg.wait_for_timeout(500)
                o = await overflow(pg); after.append(('speed test results', o))
                await pg.goto(base + 'tests/index.html?tool=accuracy'); await pg.wait_for_selector('#tab-accuracy .sbty-text .c')
                t = await pg.evaluate(TEXT('accuracy')); await pg.keyboard.type(t, delay=0); await pg.wait_for_timeout(200)
                o = await overflow(pg); after.append(('accuracy test result', o))
                await pg.goto(base + 'games/index.html'); await pg.wait_for_selector('.ws-word span')
                await pg.keyboard.type('x'); await pg.evaluate("window.__ff += 61000"); await pg.wait_for_timeout(500)
                o = await overflow(pg); after.append(('Word Sprint result', o))
                await pg.goto(base + 'games/index.html?tool=ghost'); await pg.wait_for_selector('#tab-ghost .sbty-text .c')
                t = await pg.evaluate(TEXT('ghost')); await pg.keyboard.type(t, delay=0); await pg.wait_for_timeout(300)
                o = await overflow(pg); after.append(('race result', o))
                over = [f'{a} {o}' for a, o in after if o['v'] > 0 or o['h'] > 0]
                check(not over, f'{name}: result screens fit 1440x900 {over}')
            await ctx.close()

        # ---- a shorter desktop window: the Lesson keyboard shrinks to fit, and grows back ----
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(init({}))
        pg = await ctx.new_page()
        await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_selector('svg.sbkb'); await pg.wait_for_timeout(300)
        full = await pg.evaluate(KB)
        await pg.set_viewport_size({'width': 1366, 'height': 640}); await pg.wait_for_timeout(400)
        o = await overflow(pg); kb = await pg.evaluate(KB)
        check(o['v'] <= 0 and kb < full, f'at 1366x640 the Lesson keyboard shrinks and the page fits (overflow {o["v"]}, keyboard {kb:.0f} of {full:.0f}px)')
        await pg.set_viewport_size({'width': 1440, 'height': 900}); await pg.wait_for_timeout(400)
        check(abs(await pg.evaluate(KB) - full) < 2 and not await pg.evaluate(FITTED), 'back at 1440x900 the keyboard returns to its full size')
        await ctx.close()

        # ---- a medium-width window with Larger text and OpenDyslexic: the Keyboard map's boxes do not cover each other ----
        ctx = await b.new_context(viewport={'width': 1100, 'height': 700}, service_workers='block'); await ctx.add_init_script(init({'size': 'large', 'font': 'dyslexic'}))
        pg = await ctx.new_page()
        await pg.goto(base + 'learn-keys/index.html?tool=map'); await pg.wait_for_selector('.kmpress'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        r = await pg.evaluate("(() => { const a = document.querySelector('.kmpress').getBoundingClientRect(), b = document.querySelector('.kmlegend').getBoundingClientRect(); return [a.bottom, b.top]; })()")
        check(r[0] <= r[1] + 1, f'at 1100x700 the finger box sits above the color key {r}')
        await ctx.close()

        # ---- phones ----
        for vw, vh in [(360, 740), (915, 412)]:
            ctx = await b.new_context(viewport={'width': vw, 'height': vh}, service_workers='block', has_touch=True, is_mobile=True)
            await ctx.add_init_script(init({})); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            side, hidden = [], []
            for mod, tools in TOOLS.items():
                for t in tools:
                    await pg.goto(base + mod + '/index.html?tool=' + t); await pg.wait_for_timeout(250)
                    o = await overflow(pg)
                    if o['h'] > 0: side.append(f'{mod}/{t} {o["h"]}')
            check(not side, f'{vw}x{vh}: no sideways scroll on any typing tool {side}')
            if vw > vh:   # sideways: the text to type is scrolled into view when the tool opens
                for mod, t, sel in [('learn-keys', 'lesson', '#lkType'), ('drills', 'rows', '#tab-rows .dtype'), ('tests', 'speed', '#tab-speed .ttype'), ('games', 'sprint', '.ws-stage'), ('games', 'ghost', '#tab-ghost .grtype'), ('games', 'falling', '.fw-area')]:
                    await pg.goto(base + mod + '/index.html?tool=' + t); await pg.wait_for_timeout(450)
                    r = await pg.evaluate(f"(() => {{ const r = document.querySelector('{sel}').getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; }})()")
                    if not (r[0] >= 0 and r[0] < r[2] - 60): hidden.append(f'{mod}/{t} top {r[0]:.0f}')
                check(not hidden, f'{vw}x{vh}: the text to type is on screen when a tool opens {hidden}')
            # Larger text on a phone keeps the phone sizes
            lctx = await b.new_context(viewport={'width': vw, 'height': vh}, service_workers='block', has_touch=True, is_mobile=True)
            await lctx.add_init_script(init({'size': 'large'})); lp = await lctx.new_page()
            await lp.goto(base + 'games/index.html?tool=falling'); await lp.wait_for_selector('.fw-area')
            h = await lp.evaluate("parseFloat(getComputedStyle(document.querySelector('.fw-area')).height)")
            check(abs(h - 300) < 1, f'{vw}x{vh} with Larger text: the Falling Words area keeps its phone size ({h:.0f}px)')
            await lctx.close()
            await ctx.close()

        # ---- a short desktop window with a mouse opens at the top ----
        ctx = await b.new_context(viewport={'width': 1280, 'height': 500}, service_workers='block'); await ctx.add_init_script(init({}))
        pg = await ctx.new_page(); await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_timeout(400)
        check(await pg.evaluate('scrollY') == 0, 'a short desktop window with a mouse is not scrolled when a tool opens')
        await ctx.close()

        # ---- backups carry typing progress ----
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(init({}))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_selector('#lkType .c')
        await pg.evaluate("""(() => {
          const set = (k, v) => localStorage.setItem(SB.moduleKey(k), JSON.stringify(v));
          set('learn-keys', { unlocked: 12, target: 20, wait: false, showKb: true, stats: { a: [[300, 1], [0, 0]], e: [[420, 1]] }, rounds: [{ at: 1, wpm: 18.5, acc: 0.97 }], best: 21, hunt: { set: 'top', caps: true } });
          set('typing-drills', { opt: { rows: 'number' }, best: { 'rows:home': { stars: 3, wpm: 22, acc: 0.98 } } });
          set('typing-tests', { speed: { len: '180', level: 'hard', best: { '60:medium': { wpm: 19.2, acc: 0.95 } }, history: [{ at: 2, len: 60, level: 'medium', wpm: 19.2, raw: 20, acc: 0.95, cons: 0.8 }] }, acc: { level: 'easy', best: { easy: { score: 98 } } }, custom: 'my spelling words' });
          set('typing-games', { sprint: { level: 'easy', best: { easy: 21 } }, fall: { level: 'medium', best: { medium: 14 } }, ghost: { speed: 'best', best: 24.5, wins: 3 } });
        })()""")
        before = await pg.evaluate("Object.fromEntries(['learn-keys','typing-drills','typing-tests','typing-games'].map(k => [k, localStorage.getItem(SB.moduleKey(k))]))")
        text = await pg.evaluate("SB.exportAll()")
        check(all(f'studybuddy.v1.m.k1.{k}' in json.loads(text)['data'] for k in before), 'a backup includes all four typing modules')
        ok_check = await pg.evaluate("(t) => { try { SB.checkBackup(t); return true; } catch (e) { return e.message; } }", text)
        check(ok_check is True, f'the backup passes the backup check ({ok_check})')
        await pg.evaluate("SB.eraseEverything()"); await pg.wait_for_timeout(300)
        await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_timeout(300)
        gone = await pg.evaluate("Object.keys(localStorage).filter(k => k.includes('.m.k1.')).length")
        check(gone == 0, 'Erase everything removes the typing progress')
        await pg.evaluate("(t) => SB.importAll(t)", text); await pg.wait_for_timeout(200)
        await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_selector('#lkType .c')
        after = await pg.evaluate("Object.fromEntries(['learn-keys','typing-drills','typing-tests','typing-games'].map(k => [k, JSON.parse(localStorage.getItem(SB.moduleKey(k)))]))")
        check(all(json.loads(before[k]).items() <= after[k].items() for k in before), 'after loading the backup, every typing module has its progress back')
        check(await pg.locator('.lkletters span:not(.off)').count() == 12 and '20 words a minute' in await pg.inner_text('.lkfocus'), 'Learn the Keys shows the restored letters and target speed')
        await pg.goto(base + 'games/index.html?tool=ghost'); await pg.wait_for_selector('#tab-ghost .gline')
        check('Races won: 3' in await pg.inner_text('#tab-ghost .gline'), 'Typing Games shows the restored best race and wins')
        await ctx.close()

        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
