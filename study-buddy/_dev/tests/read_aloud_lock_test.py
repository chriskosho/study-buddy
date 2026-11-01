"""Read aloud lock test (Playwright + Chromium): an admin can set Read aloud to Always on or Always off for one student
from the admin area's Students page. While it is set, the student's switches are hidden (module row, Display dialog,
Atlas Say names) and Settings says an admin set it; speaker buttons still work. Student chooses gives control back.
Run:  python3 study-buddy/_dev/tests/read_aloud_lock_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
fails = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
SEED = """if(!localStorage.getItem('studybuddy.v1.root')){localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#2b9348'}],active:'k1',pin:null,pinOffered:true}));}"""
STUB = """window.__spoken=[];window.SpeechSynthesisUtterance=function(t){this.text=t};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>{u.onstart&&u.onstart({});u.onend&&u.onend({})},0)},cancel(){},getVoices(){return [{name:'Test',lang:'en-US',voiceURI:'t'}]},addEventListener(){}}});"""

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c.add_init_script(SEED); await c.add_init_script(STUB)
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))

        # ---- admin sets Hazel to Always on and Joshua to Always off ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow')
        check(await pg.locator('.kidrow[data-id] .rdLock').count() == 2, 'each student has a Read aloud choice in the admin area')
        check((await pg.locator('.kidrow[data-id="k1"] .rdLock option:checked').inner_text()).startswith('Student chooses'), 'default is Student chooses')
        await pg.select_option('.kidrow[data-id="k2"] .rdLock', 'on'); await pg.wait_for_timeout(150)
        await pg.select_option('.kidrow[data-id="k1"] .rdLock', 'off'); await pg.wait_for_timeout(150)
        check(await pg.evaluate("[SB.readAloudLock('k1'), SB.readAloudLock('k2'), SB.getSetting('readAloud','k1'), SB.getSetting('readAloud','k2')]") == ['off', 'on', False, True], 'the choices are saved per student')

        # ---- Joshua (Always off): switches hidden, cannot turn it on, speaker buttons still speak ----
        await pg.evaluate("SB.setSetting('readAloud', true, 'k1')")
        check(await pg.evaluate("SB.getSetting('readAloud','k1')") is False, 'Joshua cannot turn Read aloud on while it is Always off')
        await pg.goto(base + 'modules/science/planets/index.html?tool=guide'); await pg.wait_for_selector('#sbSound')
        check(not await pg.locator('#sbRead').is_visible(), 'module row hides the Read aloud switch')
        n0 = await pg.evaluate('window.__spoken.length')
        spk = pg.locator('#tab-guide .say, #tab-guide button[aria-label*="Hear"], #tab-guide .spk').first
        if await spk.count():
            await spk.click(); await pg.wait_for_timeout(200)
            check(await pg.evaluate('window.__spoken.length') > n0, 'speaker buttons still work')
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('.setpanel')
        check(await pg.locator('.seg button[data-k="readAloud"]').count() == 0 and 'An admin set this' in await pg.locator('#readLocked').inner_text() and 'Always off' in await pg.locator('#readLocked').inner_text(), 'Settings shows Always off, set by an admin, with no switch')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#soundBtn')
        check(not await pg.locator('#sayBtn').is_visible(), 'Atlas hides Say names')

        # ---- Hazel (Always on): reads aloud, no switch ----
        await pg.evaluate("SB.setActive('k2')")
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('#sbSound'); await pg.wait_for_timeout(300)
        check(not await pg.locator('#sbRead').is_visible() and await pg.evaluate("SB.getSetting('readAloud')") is True, 'Hazel has Read aloud on with no switch to turn it off')
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('.setpanel')
        check('Always on' in await pg.locator('#readLocked').inner_text(), 'Settings shows Always on, set by an admin')

        # ---- Student chooses gives control back, keeping the student's own choice ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow')
        await pg.select_option('.kidrow[data-id="k2"] .rdLock', ''); await pg.wait_for_timeout(150)
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('#sbRead')
        check(await pg.locator('#sbRead').is_visible() and 'off' in await pg.locator('#sbRead').inner_text(), 'Student chooses shows the switch again, back to the student own choice (off)')
        await pg.click('#sbRead'); check(await pg.evaluate("SB.getSetting('readAloud')") is True, 'and the student can turn it on')

        # ---- a change in another tab reaches an open Atlas ----
        await pg.evaluate("SB.setActive('k1')"); await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#soundBtn')
        other = await c.new_page(); await other.goto(base + 'index.html#/admin/children'); await other.wait_for_selector('.kidrow')
        await other.select_option('.kidrow[data-id="k1"] .rdLock', ''); await pg.wait_for_timeout(1200); await pg.wait_for_selector('#soundBtn')
        check(await pg.locator('#sayBtn').is_visible(), 'an open Atlas shows Say names again when the admin gives control back in another tab')
        await other.select_option('.kidrow[data-id="k1"] .rdLock', 'off'); await pg.wait_for_timeout(1200); await pg.wait_for_selector('#soundBtn')
        check(not await pg.locator('#sayBtn').is_visible(), 'and hides it again when set to Always off')
        await other.close()

        # ---- a backup keeps the choice ----
        dump = await pg.evaluate('SB.exportAll()')
        check('readAloudLock' in dump and dump.replace('\\', '').count('"readAloudLock":"off"') == 1, 'backups keep the admin choice')
        await b.close()
    check(not errs, f'no page errors {errs[:2]}')
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)

asyncio.run(main())
