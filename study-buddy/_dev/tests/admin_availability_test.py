"""Admin availability test (Playwright + Chromium): on the admin area's Students page, Sound and Read aloud are on/off
toggles for each student. On (the default) means the student can use it. Off removes it for that student: the
switches are hidden (module row, Display dialog, Settings, Atlas), it stays off, the student cannot turn it on, and
speaker buttons still work. Turning it on again brings the switches back.
Run:  python3 study-buddy/_dev/tests/admin_availability_test.py"""
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

        # ---- the admin toggles: on by default, one per setting per student, no third choice ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow')
        check(await pg.locator('.kidrow[data-id] [data-avail]').count() == 4 and await pg.locator('.rdLock').count() == 0, 'each student has a Sound toggle and a Read aloud toggle, and no third choice')
        check('Read aloud: on' in await pg.locator('.kidrow[data-id="k1"] [data-avail="readAloud"]').inner_text() and 'Sound: on' in await pg.locator('.kidrow[data-id="k1"] [data-avail="sound"]').inner_text(), 'both start on')
        await pg.click('.kidrow[data-id="k1"] [data-avail="readAloud"]'); await pg.wait_for_timeout(150)
        await pg.click('.kidrow[data-id="k2"] [data-avail="sound"]'); await pg.wait_for_timeout(150)
        check('Read aloud: off' in await pg.locator('.kidrow[data-id="k1"] [data-avail="readAloud"]').inner_text() and 'Sound: off' in await pg.locator('.kidrow[data-id="k2"] [data-avail="sound"]').inner_text(), 'the toggles read off after a click')
        check(await pg.evaluate("[SB.unavailable('readAloud','k1'), SB.unavailable('sound','k1'), SB.unavailable('readAloud','k2'), SB.unavailable('sound','k2')]") == [True, False, False, True], 'each choice is saved for its own student only')

        # ---- Joshua: Read aloud off ----
        await pg.evaluate("SB.setSetting('readAloud', true, 'k1')")
        check(await pg.evaluate("SB.getSetting('readAloud','k1')") is False, 'Joshua cannot turn Read aloud on while it is off')
        await pg.goto(base + 'modules/science/planets/index.html?tool=guide'); await pg.wait_for_selector('#sbSound')
        check(not await pg.locator('#sbRead').is_visible() and await pg.locator('#sbSound').is_visible(), 'module row hides Read aloud but still shows Sound')
        n0 = await pg.evaluate('window.__spoken.length'); spk = pg.locator('#tab-guide .spk').first
        if await spk.count():
            await spk.click(); await pg.wait_for_timeout(200)
            check(await pg.evaluate('window.__spoken.length') > n0, 'speaker buttons still speak')
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('.setpanel')
        check(await pg.locator('.seg button[data-k="readAloud"]').count() == 0 and 'An admin turned this off' in await pg.locator('#readLocked').inner_text() and await pg.locator('.seg button[data-k="sound"]').count() == 2, 'Settings explains Read aloud is off and still has Sound')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#soundBtn')
        check(not await pg.locator('#sayBtn').is_visible() and await pg.locator('#soundBtn').is_visible(), 'Atlas hides Say names but keeps Sound')

        # ---- Hazel: Sound off ----
        await pg.evaluate("SB.setActive('k2')")
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('#sbRead')
        check(not await pg.locator('#sbSound').is_visible() and await pg.locator('#sbRead').is_visible(), 'Hazel has no Sound switch but keeps Read aloud')
        await pg.evaluate("SB.setSetting('sound', true)")
        check(await pg.evaluate("SB.getSetting('sound')") is False, 'Hazel cannot turn Sound on')
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('.setpanel')
        check('An admin turned this off' in await pg.locator('#soundLocked').inner_text() and await pg.locator('.seg button[data-k="sound"]').count() == 0, 'Settings explains Sound is off')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#sayBtn')
        check(not await pg.locator('#soundBtn').is_visible(), 'Atlas hides its Sound button for Hazel')

        # ---- turning it back on brings the switches back ----
        await pg.goto(base + 'index.html#/admin/children'); await pg.wait_for_selector('.kidrow')
        await pg.click('.kidrow[data-id="k2"] [data-avail="sound"]'); await pg.wait_for_timeout(150)
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('#sbSound')
        check(await pg.locator('#sbSound').is_visible(), 'turning Sound on again brings the switch back')
        await pg.click('#sbSound'); check(await pg.evaluate("SB.getSetting('sound')") is False, 'and Hazel can use it again')

        # ---- a change in another tab reaches an open Atlas ----
        await pg.evaluate("SB.setActive('k1')"); await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#soundBtn')
        other = await c.new_page(); await other.goto(base + 'index.html#/admin/children'); await other.wait_for_selector('.kidrow')
        await other.click('.kidrow[data-id="k1"] [data-avail="readAloud"]'); await pg.wait_for_timeout(1200); await pg.wait_for_selector('#soundBtn')
        check(await pg.locator('#sayBtn').is_visible(), 'an open Atlas shows Say names again when the admin turns Read aloud on in another tab')
        await other.click('.kidrow[data-id="k1"] [data-avail="sound"]'); await pg.wait_for_timeout(1200); await pg.wait_for_selector('#sayBtn')
        check(not await pg.locator('#soundBtn').is_visible(), 'and hides Sound when the admin turns it off')
        await other.close()

        # ---- a backup keeps the choices ----
        dump = (await pg.evaluate('SB.exportAll()')).replace('\\', '')
        check('"soundLock":"off"' in dump, 'backups keep the admin choices')
        await b.close()
    check(not errs, f'no page errors {errs[:2]}')
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)

asyncio.run(main())
