"""Flashcard Undo and confirmation toast: shared tool (Ham Radio) and the South America flashcards (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/flashcard_undo_test.py"""
import asyncio, http.server, threading, functools, os
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8786
BASE = f'http://127.0.0.1:{PORT}/'
HAM = BASE + 'modules/other/ham-technician/index.html'
SA = BASE + 'modules/geography/south-america/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""

async def run(pg, name, url, tab, sel, tabclick=None):
    """sel: dict of selectors: knew, again, skip, undo, count, toast, zone"""
    if not tabclick: await pg.goto(url)
    await pg.wait_for_selector(tab + ' .fcard')
    cnt = lambda: pg.inner_text(sel['count'])
    toast = lambda: pg.inner_text(sel['toast'] + ' span')
    visible = lambda: pg.eval_on_selector(sel['toast'], "e => e.classList.contains('show') && getComputedStyle(e).visibility === 'visible'")
    front = lambda: pg.inner_text(tab + ' .front')
    check(await pg.is_disabled(sel['undo']), f'{name}: Undo starts disabled')
    f0, c0 = await front(), await cnt()
    await pg.click(sel['knew']); await pg.wait_for_timeout(120)
    check(await toast() == 'Knew it' and await visible(), f'{name}: tapping I knew it shows a "Knew it" toast')
    check(not await pg.is_disabled(sel['undo']) and await cnt() != c0, f'{name}: Undo turns on and the count moves')
    await pg.wait_for_timeout(1500)
    check(not await visible(), f'{name}: the toast goes away after about a second')
    f1 = await front()
    await pg.click(sel['again']); await pg.wait_for_timeout(120)
    check(await toast() == 'Still learning', f'{name}: Still learning shows its toast')
    await pg.click(sel['skip']); await pg.wait_for_timeout(120)
    check(await toast() == 'Skipped', f'{name}: Skip shows its toast')
    # undo with the toast link, then the button, then the keyboard
    await pg.click(sel['toast'] + ' button'); await pg.wait_for_timeout(150)
    check(await toast() == 'Undone' and await front() != '', f'{name}: the Undo link in the toast undoes Skip')
    await pg.click(sel['undo']); await pg.wait_for_timeout(150)
    await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(150)
    check(await front() == f0 and await cnt() == c0, f'{name}: three undos bring back the first card and the count')
    check(await pg.is_disabled(sel['undo']), f'{name}: Undo is off again with nothing left to undo')
    # swipe confirms too
    box = await pg.locator(tab + ' .cardstage').bounding_box()
    await pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); await pg.mouse.down()
    await pg.mouse.move(box['x'] + box['width'] / 2 + 260, box['y'] + box['height'] / 2, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(500)
    check(await toast() == 'Knew it', f'{name}: a right swipe shows the "Knew it" toast')
    await pg.evaluate('getSelection().removeAllRanges()')   # automated drags can leave a text selection that cancels the next drag
    await pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); await pg.mouse.down()
    await pg.mouse.move(box['x'] + box['width'] / 2 - 260, box['y'] + box['height'] / 2, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(500)
    check(await toast() == 'Still learning', f'{name}: a left swipe shows the "Still learning" toast')
    await pg.click(sel['undo']); await pg.wait_for_timeout(150); await pg.click(sel['undo']); await pg.wait_for_timeout(150)
    check(await front() == f0, f'{name}: two undos after two swipes restore the first card')
    # flipped card: undo returns face-down
    await pg.click(sel['knew']); await pg.wait_for_timeout(300)
    await pg.click(tab + ' .fcard'); await pg.wait_for_timeout(700)
    await pg.click(sel['undo']); await pg.wait_for_timeout(900)
    check(not await pg.eval_on_selector(tab + ' .fcard', "e => e.classList.contains('flip')") and await front() == f0, f'{name}: undo puts the card back face-down')
    ar = await pg.eval_on_selector(sel['toast'], "e => e.getAttribute('role')")
    check(ar == 'status', f'{name}: the toast is announced to screen readers')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await run(pg, 'shared tool', HAM, '#tab-cards', dict(knew='#tab-cards [data-a=knew]', again='#tab-cards [data-a=again]', skip='#tab-cards [data-a=skip]', undo='#tab-cards [data-a=undo]', count='#tab-cards .count', toast='#tab-cards .card-toast'))
        ov = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
        check(ov['v'] <= 0 and ov['h'] <= 0, f'shared tool: no scroll bars at 1440x900 {ov}')
        await pg.screenshot(path='/tmp/fc_undo_ham.png')
        await pg.goto(SA); await pg.wait_for_selector('[data-tab=cards]'); await pg.click('[data-tab=cards]')
        await run(pg, 'South America', SA, '#tab-cards', dict(knew='#cardKnew', again='#cardAgain', skip='#cardSkip', undo='#cardUndo', count='#cardCount', toast='#tab-cards .card-toast'), tabclick='[data-tab=cards]')
        ov = await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
        check(ov['v'] <= 0 and ov['h'] <= 0, f'South America: no scroll bars at 1440x900 {ov}')
        await pg.screenshot(path='/tmp/fc_undo_sa.png')
        for name, url, tab, tc in (('shared tool', HAM, '#tab-cards', None), ('South America', SA, '#tab-cards', '[data-tab=cards]')):
            for extra in ('', 'dys'):
                m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
                if extra: await m.add_init_script("localStorage.setItem('studybuddy.v1.k1.settings', JSON.stringify({font:'dyslexic', size:'large'}))")
                q = await m.new_page(); await q.goto(url); await q.wait_for_selector('.fcard', state='attached')
                if tc: await q.click(tc)
                await q.wait_for_selector(tab + ' .fcard'); await q.wait_for_timeout(300)
                if extra: await q.evaluate("SB.setSetting && (SB.setSetting('font','dyslexic'), SB.setSetting('size','large'), SB.applyDisplay())")
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{name}: no sideways scroll at 360px {extra} {ov}')
                if not extra: await q.screenshot(path='/tmp/fc_undo_360_%s.png' % name.split()[0])
                await m.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
import sys
asyncio.run(main())
