"""Typing on a phone's own keyboard (Playwright + Chromium).
For a phone (touch, no mouse) and a touch device that also reports a fine pointer (phones with a pen, like a Galaxy with an S Pen,
which is the case that used to fail), in every typing tool and game: tapping the text (or Show keyboard) focuses the hidden text box,
which is what opens the phone's keyboard, and letters typed into it count. Also: the Show keyboard button hides while the keyboard
is open, Falling Words opens the keyboard when Start is tapped, and a desktop (mouse, no touch) gets no button and no hidden-box focus.
Run:  python3 study-buddy/_dev/tests/typing_mobile_test.py"""
import asyncio, http.server, threading, functools, os, sys
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
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Eli',color:'#e4572e'}],active:'k1',pin:null,inviteSnoozeUntil:9e15}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
FOCUSED = "!!(document.activeElement && document.activeElement.classList.contains('sbty-in'))"
def TEXT(sel): return f"[...document.querySelectorAll('{sel} .sbty-text .c')].map(s => s.classList.contains('sp') ? ' ' : s.textContent).join('')"
def POS(sel): return f"[...document.querySelectorAll('{sel} .sbty-text .c')].findIndex(s => s.classList.contains('cur'))"
TYPERS = [('learn-keys', 'lesson', '#lkType'), ('drills', 'rows', '#tab-rows .dtype'), ('drills', 'sentences', '#tab-sentences .dtype'),
          ('tests', 'speed', '#tab-speed .ttype'), ('tests', 'accuracy', '#tab-accuracy .ttype'), ('games', 'ghost', '#tab-ghost .grtype')]

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/modules/typing/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for label, opts in [('phone', dict(viewport={'width': 360, 'height': 740}, has_touch=True, is_mobile=True)),
                            ('touch device with a pen', dict(viewport={'width': 412, 'height': 900}, has_touch=True, is_mobile=True))]:
            ctx = await b.new_context(service_workers='block', **opts); await ctx.add_init_script(INIT)
            if 'pen' in label:   # the emulator cannot report a pen, so the page is told there is a fine pointer as well as a finger
                await ctx.add_init_script("(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => /any-pointer:\\s*fine|any-hover:\\s*hover/.test(q) ? Object.assign(Object.create(mm(q)), { matches: true, media: q, addEventListener() {}, removeEventListener() {} }) : mm(q); })();")
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            for mod, tool, sel in TYPERS:
                await pg.goto(base + mod + '/index.html?tool=' + tool); await pg.wait_for_selector(sel + ' .sbty-text .c'); await pg.wait_for_timeout(150)
                check(await pg.locator(sel + ' .sbty-kbd').is_visible(), f'{label}, {mod}/{tool}: a Show keyboard button')
                await pg.tap(sel + ' .sbty-text')
                check(await pg.evaluate(FOCUSED), f'{label}, {mod}/{tool}: tapping the text opens the keyboard')
                check(await pg.locator(sel + ' .sbty-kbd').is_hidden(), f'{label}, {mod}/{tool}: the button hides while the keyboard is open')
                t = await pg.evaluate(TEXT(sel))
                await pg.keyboard.insert_text(t[:4])
                check(await pg.evaluate(POS(sel)) == 4, f'{label}, {mod}/{tool}: letters typed on the phone keyboard count')
            # the Show keyboard button itself
            await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_selector('#lkType .sbty-kbd')
            await pg.tap('#lkType .sbty-kbd')
            check(await pg.evaluate(FOCUSED), f'{label}: the Show keyboard button opens the keyboard')
            # Your own text
            await pg.goto(base + 'tests/index.html?tool=custom'); await pg.wait_for_selector('#tab-custom textarea')
            await pg.fill('#tab-custom textarea', 'my spelling words'); await pg.tap('#tab-custom [data-x="use"]')
            await pg.tap('#tab-custom .sbty-text'); await pg.keyboard.insert_text('my sp')
            check(await pg.evaluate(POS('#tab-custom')) == 5, f'{label}: Your own text works with the phone keyboard')
            # Word Sprint
            await pg.goto(base + 'games/index.html'); await pg.wait_for_selector('.ws-word span')
            check(await pg.locator('#tab-sprint .sbty-kbd').is_visible(), f'{label}: Word Sprint has a Show keyboard button')
            await pg.tap('.ws-stage')
            check(await pg.evaluate(FOCUSED), f'{label}: tapping Word Sprint opens the keyboard')
            w = await pg.evaluate("[...document.querySelectorAll('.ws-word span')].map(s => s.textContent).join('')")
            await pg.keyboard.insert_text(w)
            check('1 word' in await pg.inner_text('#wsScore'), f'{label}: a word typed on the phone keyboard scores in Word Sprint')
            # Falling Words
            await pg.goto(base + 'games/index.html?tool=falling'); await pg.wait_for_selector('.fw-cover [data-x="go"]')
            await pg.tap('.fw-cover [data-x="go"]'); await pg.wait_for_selector('.fw-word')
            if label == 'phone': check(await pg.evaluate(FOCUSED), 'phone: Start in Falling Words opens the keyboard')
            else:
                await pg.tap('.fw-area'); check(await pg.evaluate(FOCUSED), f'{label}: tapping Falling Words opens the keyboard')
            word = (await pg.locator('.fw-word').first.inner_text()).strip()
            await pg.keyboard.insert_text(word)
            check('1 word' in await pg.inner_text('#fwScore'), f'{label}: a falling word typed on the phone keyboard is cleared')
            await ctx.close()

        # ---- a desktop with a mouse: no button, and clicking the text does not focus the hidden box ----
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        await pg.goto(base + 'learn-keys/index.html'); await pg.wait_for_selector('#lkType .c')
        check(await pg.locator('.sbty-kbd').count() == 0, 'desktop: no Show keyboard button')
        await pg.click('#lkType .sbty-text')
        check(not await pg.evaluate(FOCUSED), 'desktop: clicking the text does not focus the hidden box')
        t = await pg.evaluate(TEXT('#lkType')); await pg.keyboard.type(t[:3])
        check(await pg.evaluate(POS('#lkType')) == 3, 'desktop: the real keyboard still types')
        await ctx.close()
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
