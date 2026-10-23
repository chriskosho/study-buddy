"""Guest-first onboarding test (Playwright + Chromium).
Fresh visitors land straight in the app as Guest. After a finished round they are invited to add a name
(once per visit; "Not now" waits a week). Adding a name keeps progress. The PIN is offered at the first
protected action and once more when a second person is added. "Who's studying?" only shows with 2+ people.
Run:  python3 study-buddy/_dev/tests/onboarding_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8768
POS = 'modules/english/parts-of-speech/index.html'
ATLAS = 'modules/geography/south-america/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
STUB = """Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),100)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""

async def finish_parts_deck(pg, base):
    await pg.goto(base + POS + '?tool=cards'); await pg.wait_for_selector('#tab-cards .fcard')
    for i in range(8):
        await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(40)

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(STUB)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        # ---- straight in ----
        await pg.goto(base); await pg.wait_for_selector('a.mod')
        check('Hi, Guest' in await pg.locator('h1').inner_text(), 'first visit lands on the subjects, no setup')
        check(await pg.locator('.sb-dlg').count() == 0, 'no PIN or name prompt on first visit')
        await pg.goto(base + '#/'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('.whocard').count() == 0, "no Who's studying screen with one person")

        # ---- invite after a finished round; Not now snoozes ----
        await finish_parts_deck(pg, base)
        await pg.wait_for_selector('.sb-invite', timeout=4000)
        check('Add your name' in await pg.locator('.sb-invite').inner_text(), 'invite appears after the first finished round')
        await pg.click('.sb-invite .no')
        snooze = await pg.evaluate("SB.root().inviteSnoozeUntil - Date.now()")
        check(snooze > 6 * 864e5, 'Not now waits a week')
        await pg.evaluate("sessionStorage.clear()")
        await finish_parts_deck(pg, base); await pg.wait_for_timeout(1800)
        check(await pg.locator('.sb-invite').count() == 0, 'no invite while snoozed')

        # ---- once per visit ----
        await pg.evaluate("(() => { const r = SB.root(); r.inviteSnoozeUntil = 0; localStorage.setItem('studybuddy.v1.root', JSON.stringify(r)); sessionStorage.clear(); })()")
        await finish_parts_deck(pg, base); await pg.wait_for_selector('.sb-invite', timeout=4000)
        await pg.evaluate("document.querySelector('.sb-invite').remove()")
        await finish_parts_deck(pg, base); await pg.wait_for_timeout(1800)
        check(await pg.locator('.sb-invite').count() == 0, 'invite shows at most once per visit')

        # ---- add a name from the chip: keeps progress ----
        before = await pg.evaluate("SB.toolRecord('parts-of-speech','cards')")
        await pg.click('#sbAddName'); await pg.wait_for_selector('.sb-dlg')
        await pg.click('[data-x="yes"]')
        check('Type a name' in await pg.locator('.sb-err').inner_text(), 'empty name rejected')
        await pg.fill('[data-x="a"]', 'guest'); await pg.click('[data-x="yes"]')
        check('other than Guest' in await pg.locator('.sb-err').inner_text(), '"Guest" is not accepted as a name')
        await pg.fill('[data-x="a"]', 'Hazel'); await pg.click('[data-x="yes"]')
        await pg.wait_for_load_state('load'); await pg.wait_for_selector('.kidpill')
        check('Hazel' in await pg.locator('.kidpill').inner_text(), 'module header now shows the name')
        after = await pg.evaluate("SB.toolRecord('parts-of-speech','cards')")
        check(before and after and after['attempts'] == before['attempts'] and not await pg.evaluate("SB.isGuest(SB.activeProfile())"), 'progress kept after adding a name')
        await pg.evaluate("sessionStorage.clear()")
        await finish_parts_deck(pg, base); await pg.wait_for_timeout(1800)
        check(await pg.locator('.sb-invite').count() == 0, 'no invite once named')

        # ---- first protected action offers a PIN; Skip lets it through ----
        await pg.click('#sbReset'); await pg.wait_for_selector('.sb-dlg')
        check('Protect this with a parent PIN' in await pg.locator('.sb-dlg').inner_text(), 'first reset offers a PIN')
        await pg.click('[data-x="skip"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("(SB.toolRecord('parts-of-speech','cards') || {}).best == null"), 'Skip, then the reset happens (scores erased)')
        await pg.click('#sbReset'); await pg.wait_for_timeout(200)
        check(await pg.locator('.sb-dlg').count() == 0, 'after skipping, no PIN prompt on later resets')

        # ---- parent area without a PIN shows a note; second person triggers one more offer ----
        await pg.goto(base + '#/parent/children'); await pg.wait_for_selector('.kidrow')
        check('No parent PIN yet' in await pg.locator('.note').first.inner_text(), 'parent area notes there is no PIN')
        await pg.fill('#newName', 'Eli'); await pg.click('#addKid'); await pg.wait_for_selector('.sb-dlg')
        check('Add a parent PIN' in await pg.locator('.sb-dlg').inner_text(), 'adding a second person offers a PIN once more')
        await pg.click('[data-x="skip"]'); await pg.wait_for_selector('.kidrow')
        await pg.fill('#newName', 'Ava'); await pg.click('#addKid'); await pg.wait_for_timeout(300)
        check(await pg.locator('.sb-dlg').count() == 0, 'no PIN offer for the third person')
        await pg.goto(base + '#/'); await pg.wait_for_selector('.whocard')
        check(await pg.locator('.whocard').count() == 3, "Who's studying appears with 2+ people")

        # ---- set a PIN later: then it is required ----
        await pg.goto(base + '#/parent'); await pg.wait_for_selector('#setPin')
        await pg.click('#setPin'); await pg.fill('[data-x="a"]', '4321'); await pg.fill('[data-x="b"]', '4321'); await pg.click('[data-x="yes"]')
        await pg.wait_for_timeout(200)
        check(await pg.locator('#setPin').count() == 0, 'note goes away after a PIN is set')
        await pg.evaluate("SB.lock()"); await pg.goto(base + '#/home'); await pg.goto(base + '#/parent'); await pg.reload(); await pg.wait_for_selector('.sb-dlg')
        check('Parent PIN' in await pg.locator('.sb-dlg h3').inner_text(), 'parent area now asks for the PIN')

        # ---- South America opened directly on a fresh device ----
        ctx2 = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx2.add_init_script(STUB); pg2 = await ctx2.new_page()
        pg2.on('pageerror', lambda e: errors.append(str(e)))
        await pg2.goto(base + ATLAS + '?tool=cards'); await pg2.wait_for_selector('#kidChip')
        check('Add a name' in await pg2.locator('#kidChip').inner_text(), 'South America on a fresh device runs as Guest with Add a name')
        o = await pg2.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
        check(o['v'] <= 0 and o['h'] <= 0, f'South America header still fits 1440x900 {o}')

        # ---- phone: invite fits ----
        await pg2.set_viewport_size({'width': 360, 'height': 780})
        await pg2.goto(base + POS + '?tool=cards'); await pg2.wait_for_selector('#tab-cards .fcard')
        for i in range(8):
            await pg2.click('#tab-cards [data-a="knew"]'); await pg2.wait_for_timeout(40)
        await pg2.wait_for_selector('.sb-invite', timeout=4000)
        box = await pg2.locator('.sb-invite').bounding_box()
        check(box['x'] >= 0 and box['x'] + box['width'] <= 360, f'invite fits a phone screen {box}')
        await pg2.screenshot(path='/tmp/sb_invite_phone.png')
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)
asyncio.run(main())
