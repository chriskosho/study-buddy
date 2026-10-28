"""Scratch pad notes (October 2026): the simpler save box for students with a name, the same note when the pad is reopened on the same
question, the New note button, the pen toast, and the Scratch pad utility.
Run:  python3 study-buddy/_dev/tests/scratchpad_notes_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
VOL = BASE + 'modules/math/volume/index.html'
SHOTS = os.environ.get('SHOTS')
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""
INIT_GUEST = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'g1',name:'Guest',color:'#2b4162',guest:true}],active:'g1',pin:null,pinOffered:true}));"""

async def state(pg): return await pg.evaluate("SBPad.debug()")
async def stroke(pg, pts, steps=3):
    box = await pg.locator('.sbp-ink').bounding_box()
    x0, y0 = pts[0]; await pg.mouse.move(box['x'] + x0, box['y'] + y0); await pg.mouse.down()
    for x, y in pts[1:]: await pg.mouse.move(box['x'] + x, box['y'] + y, steps=steps)
    await pg.mouse.up()
async def shot(pg, name):
    if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, name + '.png'))

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', accept_downloads=True); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(VOL + '?tool=cubes'); await pg.wait_for_selector('#sbPad')

        # ---- the save box for a named student ----
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp'); await stroke(pg, [(30, 30), (140, 90), (60, 150)])
        await pg.click('.sbp [data-a="save"]'); await pg.wait_for_selector('.sb-ov')
        keys = await pg.evaluate("[...document.querySelectorAll('.sb-ov [data-k]')].map(b => b.dataset.k)")
        check(keys == ['profile', 'device', 'keep'] or keys == ['profile', 'device', 'share', 'keep'], f'Save offers my notes and a download, nothing else {keys}')
        check('this session' not in (await pg.inner_text('.sb-ov')).lower() and 'Add your name' not in await pg.inner_text('.sb-ov'), 'no "this session only" and no "add your name" for a named student')
        await shot(pg, 'pad-save-profile')
        await pg.click('.sb-ov [data-k="keep"]')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sb-ov')
        keys = await pg.evaluate("[...document.querySelectorAll('.sb-ov [data-k]')].map(b => b.dataset.k)")
        check(keys[:2] == ['profile', 'device'] and 'discard' in keys and keys[-1] == 'keep' and 'session' not in keys, f'closing offers save, download, do not save, keep working {keys}')
        await shot(pg, 'pad-close-profile')
        await pg.click('.sb-ov [data-k="keep"]')

        # ---- the same question shows the same note ----
        q1x = await pg.evaluate("document.querySelector('#tab-cubes .qtext svg').getAttribute('aria-label')"); q1 = (await state(pg))['question']; n1 = len((await state(pg))['items'])
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_selector('.sbp', state='detached')
        saved = await pg.evaluate("SBPad.store.list('profile').length")
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        st = await state(pg)
        check(st['question'] == q1 and len(st['items']) == n1 and not st['dirty'], f'reopening on the same question shows the same note ({len(st["items"])} strokes, saved)')
        await stroke(pg, [(200, 200), (260, 240)])
        await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("SBPad.store.list('profile').length") == saved, 'saving it again updates that note instead of adding another')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        check(len((await state(pg))['items']) == n1 + 1, 'and the added stroke is there the next time')
        # unsaved writing is kept too: close with Do not save is the only way to lose it
        await stroke(pg, [(300, 100), (340, 160)])
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp'); await pg.wait_for_timeout(150)
        check(len((await state(pg))['items']) == 0 and await pg.locator('.sb-ov').count() == 0, 'after Do not save the pad opens blank')
        await stroke(pg, [(40, 40), (120, 100)]); a = len((await state(pg))['items'])
        await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        # a different question starts blank
        for _ in range(6):
            for _t in range(2):   # the first wrong answer is a retry, the second shows the answer
                await pg.fill('#tab-cubes input[aria-label="Your answer"]', '1'); await pg.click('#tab-cubes form button.btn'); await pg.wait_for_timeout(80)
            await pg.wait_for_selector('#tab-cubes [data-a="similar"]', state='visible')
            await pg.click('#tab-cubes [data-a="similar"]'); await pg.wait_for_timeout(120)
            if (await pg.evaluate("document.querySelector('#tab-cubes .qtext svg').getAttribute('aria-label')")) != q1x: break
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        st = await state(pg)
        check(len(st['items']) == 0 and st['question'] != q1, f'the next question starts with a blank pad {len(st["items"])} {st["question"]==q1} {st["question"][:40]!r}')

        # ---- New note ----
        await stroke(pg, [(30, 30), (140, 90)])
        check(await pg.locator('.sbp [data-a="new"]').is_visible() and await pg.locator('.sbp [data-a="new"]').is_enabled(), 'the toolbar has a New note button')
        await pg.click('.sbp [data-a="new"]'); await pg.wait_for_selector('.sb-ov')
        check('Save this note?' in await pg.inner_text('.sb-ov h3') and 'new note' in (await pg.inner_text('.sb-ov')).lower(), 'New note with writing asks to save first')
        keys = await pg.evaluate("[...document.querySelectorAll('.sb-ov [data-k]')].map(b => b.dataset.k)")
        check('profile' in keys and 'device' in keys and 'discard' in keys and keys[-1] == 'keep', f'with the same choices as closing {keys}')
        await shot(pg, 'pad-new-note')
        await pg.click('.sb-ov [data-k="keep"]'); check(len((await state(pg))['items']) == 1, 'Keep working keeps the writing')
        n0 = await pg.evaluate("SBPad.store.list('profile').length")
        await pg.click('.sbp [data-a="new"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_timeout(120)
        st = await state(pg)
        check(await pg.evaluate("SBPad.store.list('profile').length") == n0 + 1 and len(st['items']) == 0 and st['from'] is None and await pg.locator('.sbp').count() == 1, 'Save then starts a blank note, with the pad still open')
        await stroke(pg, [(60, 60), (160, 120)]); await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_timeout(100)
        await pg.click('.sbp [data-a="new"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('.sb-ov').count() == 0 and len((await state(pg))['items']) == 0, 'New note after saving needs no question')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        check(len((await state(pg))['items']) == 0, 'a new note stays the note for this question')
        await stroke(pg, [(30, 30), (140, 90)]); await pg.click('.sbp [data-a="new"]'); await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_timeout(100)
        check(len((await state(pg))['items']) == 0 and await pg.locator('.sbp').count() == 1, 'Do not save clears the page and stays')
        await stroke(pg, [(30, 30), (140, 90)]); await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        check(len((await state(pg))['items']) == 1, 'after Do not save with New note, closing and saving still remembers the next note')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')

        # ---- the pen toast ----
        await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
        await pg.evaluate("""() => { const c = document.querySelector('.sbp-ink'), r = c.getBoundingClientRect();
          const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 41, pointerType: 'pen', pressure: .5, clientX: r.left + x, clientY: r.top + y, button: 0, buttons: t === 'pointerup' ? 0 : 1 }));
          ev('pointerdown', 40, 40); ev('pointermove', 90, 60); ev('pointerup', 90, 60); }""")
        await pg.wait_for_selector('#sb-toast.show'); await pg.wait_for_timeout(450)
        t = await pg.evaluate("(() => { const e = document.getElementById('sb-toast'), r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { w: r.width, h: r.height, l: r.left, r: innerWidth - r.right, pad: cs.paddingLeft + ' ' + cs.paddingTop, align: cs.textAlign, text: e.textContent }; })()")
        check(t['pad'] == '22px 12px' and t['align'] == 'center', f'the toast has room around its text and is centered {t["pad"]} {t["align"]}')
        check(abs(t['l'] - t['r']) <= 2 and t['w'] <= 440, f'it sits in the middle and does not stretch ({t["w"]:.0f}px wide)')
        check(t['h'] < 120 and 'Pen found' in t['text'], f'two short lines at most ({t["h"]:.0f}px tall)')
        await shot(pg, 'pad-pen-toast')
        await pg.wait_for_timeout(300)
        # it stays up long enough to read (longer than the old 2.4 seconds)
        await pg.wait_for_timeout(2300)
        check(await pg.evaluate("document.getElementById('sb-toast').classList.contains('show')"), 'a long message stays long enough to read')
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_selector('.sbp', state='detached')

        # ---- Utilities: Scratch pad ----
        await pg.goto(BASE + 'index.html#/utilities'); await pg.wait_for_selector('.grid .mod')
        titles = await pg.locator('.grid .mod h3').all_inner_texts()
        check('Scratch pad' in titles and 'Calculator' in titles, f'Utilities lists the Scratch pad {titles}')
        await pg.click('.grid .mod:has-text("Scratch pad")'); await pg.wait_for_selector('.sbp')
        st = await state(pg)
        check(st['question'] == '' and not await pg.locator('.sbp-q').is_visible(), 'it opens with no question on it')
        check(await pg.locator('.sbhead').inner_text() != '' and 'Scratch pad' in await pg.inner_text('.sbcrumbs'), 'the header shows Utilities > Scratch pad')
        await stroke(pg, [(30, 30), (140, 90)])
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_selector('.sbp', state='detached')
        nn = await pg.evaluate("SBPad.store.list('profile').length"); check(nn >= 1 and await pg.locator('#spNotes .sbn').count() == nn and 'Scratch pad' in await pg.inner_text('#spNotes'), f'the saved note is listed on the page ({nn} notes)')
        await pg.click('#spOpen'); await pg.wait_for_selector('.sbp')
        check(len((await state(pg))['items']) == 1 and (await state(pg))['from'] is not None, 'opening again shows the same note')
        await shot(pg, 'pad-utility')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#spNotes [data-a="open"]'); await pg.wait_for_selector('.sbp')
        check(len((await state(pg))['items']) == 1, 'a saved note opens from the list')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        ov = await pg.evaluate("document.fonts.ready.then(() => document.documentElement.scrollHeight - innerHeight)")
        check(ov <= 0, f'the Scratch pad page has no scroll bar at 1440x900 ({ov})')
        found = await pg.evaluate("window.SB_REGISTRY.utilities.map(u => u.id)")
        check(found == ['calculator', 'scratchpad'], f'registry {found}')

        # ---- Guest keeps the full box ----
        gx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await gx.add_init_script(INIT_GUEST)
        gp = await gx.new_page(); gp.on('pageerror', lambda e: errors.append(str(e)))
        await gp.goto(VOL + '?tool=cubes'); await gp.wait_for_selector('#sbPad'); await gp.click('#sbPad'); await gp.wait_for_selector('.sbp'); await stroke(gp, [(30, 30), (140, 90)])
        await gp.click('.sbp [data-a="close"]'); await gp.wait_for_selector('.sb-ov')
        keys = await gp.evaluate("[...document.querySelectorAll('.sb-ov [data-k]')].map(b => b.dataset.k)")
        check('session' in keys and 'device' in keys and 'profile' not in keys, f'Guest still chooses between a download and this session {keys}')
        await gp.click('.sb-ov [data-k="session"]'); await gp.wait_for_selector('.sbp', state='detached')
        await gp.click('#sbPad'); await gp.wait_for_selector('.sbp')
        check(len((await state(gp))['items']) == 1, 'Guest gets the same note back on the same question')
        await gx.close()

        # ---- phone ----
        ph = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block', has_touch=True); await ph.add_init_script(INIT)
        pp = await ph.new_page(); pp.on('pageerror', lambda e: errors.append(str(e)))
        for label, extra in (('plain', ''), ('dyslexic + larger', "SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()")):
            await pp.goto(VOL + '?tool=cubes'); await pp.wait_for_selector('#sbPad')
            if extra: await pp.evaluate(extra); await pp.wait_for_timeout(150)
            await pp.click('#sbPad'); await pp.wait_for_selector('.sbp'); await pp.wait_for_timeout(200)
            sw = await pp.evaluate("[document.documentElement.scrollWidth - innerWidth, document.querySelector('.sbp').scrollWidth - document.querySelector('.sbp').clientWidth]")
            check(sw[0] <= 0 and sw[1] <= 0, f'the pad header with New note fits at 360px, {label} {sw}')
            hb = await pp.evaluate("(() => { const r = document.querySelector('.sbp-head').getBoundingClientRect(); return r.height; })()")
            check(hb < 110, f'the header stays compact at 360px, {label} ({hb:.0f}px)')
            await pp.evaluate("SB.toast('Pen found. Your fingers will not draw now. Turn off Pen only to draw with a finger.')"); await pp.wait_for_timeout(450)
            tw = await pp.evaluate("(() => { const r = document.getElementById('sb-toast').getBoundingClientRect(); return [r.left, innerWidth - r.right, r.height]; })()")
            check(tw[0] >= 14 and tw[1] >= 14, f'the toast keeps a margin on a phone, {label} {tw}')
            if label == 'plain': await shot(pp, 'pad-phone-toast')
            await pp.click('.sbp [data-a="close"]'); await pp.wait_for_selector('.sbp', state='detached')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
