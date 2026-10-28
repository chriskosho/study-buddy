"""Safety test (Playwright + Chromium): destructive actions always confirm, Escape and Cancel keep data,
"Forgot PIN" keeps the old PIN until a new one is saved, and broken backup files are refused without touching saved data.
Run:  python3 study-buddy/_dev/tests/safety_test.py"""
import asyncio, http.server, threading, functools, json, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
fails = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
SEED = """if(!localStorage.getItem('studybuddy.v1.root')){localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
localStorage.setItem('studybuddy.v1.child.k1',JSON.stringify({tools:{'planets/quiz':{attempts:1,visits:1,best:9,max:10,lastScore:9,last:1}}}));}"""
REC = "SB.toolRecord('planets','quiz')?.best"
ROOT = '{"profiles":[{"id":"a","name":"A","color":"#112233"}],"active":"a"}'

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch(); c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c.add_init_script(SEED)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        mod = base + 'modules/science/planets/index.html?tool=guide'
        await pg.goto(mod); await pg.wait_for_selector('#sbReset')
        # first reset offers a PIN; Escape cancels everything and keeps the scores
        await pg.click('#sbReset'); await pg.wait_for_selector('.sb-dlg')
        check('PIN' in await pg.locator('.sb-dlg h3').inner_text(), 'first reset offers a parent PIN')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        check(await pg.evaluate(REC) == 9 and await pg.locator('.sb-dlg').count() == 0, 'Escape on the PIN offer keeps the scores')
        # Skip, then a confirmation still appears; Cancel keeps the scores
        await pg.click('#sbReset'); await pg.wait_for_selector('.sb-dlg')
        if await pg.locator('.sb-dlg [data-x="skip"]').count(): await pg.click('.sb-dlg [data-x="skip"]')   # the offer may come back once after Escape
        await pg.wait_for_selector('.sb-dlg [data-x="yes"]')
        check('Reset' in await pg.locator('.sb-dlg h3').inner_text(), 'reset without a PIN still asks "Reset ...?"')
        await pg.click('.sb-dlg [data-x="no"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate(REC) == 9, 'Cancel keeps the scores')
        await pg.click('#sbReset'); await pg.wait_for_selector('.sb-dlg')
        if await pg.locator('.sb-dlg [data-x="skip"]').count(): await pg.click('.sb-dlg [data-x="skip"]')
        await pg.wait_for_selector('.sb-dlg [data-x="yes"]'); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(300)
        check(await pg.evaluate(REC) is None, 'confirming the reset erases the scores')
        # Forgot PIN + Cancel keeps the PIN
        await pg.goto(base + '#/parent'); await pg.wait_for_timeout(300)
        await pg.evaluate("SB.newPinDialog('x','y')"); await pg.fill('[data-x="a"]', '1234'); await pg.fill('[data-x="b"]', '1234'); await pg.click('[data-x="yes"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("SB.hasPin()"), 'PIN set')
        await pg.evaluate("SB.lock()"); await pg.goto(mod); await pg.click('#sbReset'); await pg.wait_for_selector('[data-x="forgot"]')
        await pg.click('[data-x="forgot"]'); await pg.fill('[data-x="a"]', 'remove'); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_selector('[data-x="b"]')
        await pg.click('[data-x="no"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("SB.hasPin()") and await pg.evaluate("SB.root().pinRemovedAt") is None, 'Forgot PIN, then Cancel: the old PIN stays')
        # backups
        good = await pg.evaluate("SB.exportAll()")
        bad = [('empty', '{"app":"study-buddy","data":{}}'),
               ('bad root', json.dumps({"app": "study-buddy", "data": {"studybuddy.v1.root": '{"profiles":"oops"}'}})),
               ('script text', json.dumps({"app": "study-buddy", "data": {"studybuddy.v1.root": ROOT, "studybuddy.v1.child.a": '{"streak":"<img src=x onerror=alert(1)>"}'}})),
               ('foreign key', json.dumps({"app": "study-buddy", "data": {"studybuddy.v1.root": ROOT, "other.key": '1'}})),
               ('not a backup', 'hello')]
        before = await pg.evaluate("JSON.stringify(Object.entries(localStorage).filter(([k])=>k.startsWith('studybuddy')).sort())")
        for name, txt in bad:
            ok = await pg.evaluate("t=>{try{SB.checkBackup(t);return true}catch(e){return false}}", txt)
            check(not ok, f'backup refused: {name}')
        after = await pg.evaluate("JSON.stringify(Object.entries(localStorage).filter(([k])=>k.startsWith('studybuddy')).sort())")
        check(before == after, 'refused backups change nothing on this device')
        check(await pg.evaluate("t=>SB.checkBackup(t).names.length>0", good), 'a real backup is accepted')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
