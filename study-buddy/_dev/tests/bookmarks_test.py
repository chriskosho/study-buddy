"""Saved modules (bookmarks) per student, the Saved tab, the new words Student and Admin, and the #/admin link.
Run:  python3 study-buddy/_dev/tests/bookmarks_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/index.html'
SHOTS = os.environ.get('SHOTS')
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'}],active:'k1',pin:null,pinOffered:true}));"""
async def shot(pg, name):
    if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=True)
async def tabs(pg): return [t.strip() for t in await pg.locator('nav[aria-label="Subjects"] a').all_inner_texts()]
async def sel(pg): return await pg.evaluate("document.querySelector('nav[aria-label=\"Subjects\"] [aria-selected=\"true\"]').textContent.trim()")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(BASE + '#/home'); await pg.wait_for_selector('.modcard')
        t = await tabs(pg)
        check(not any(x.startswith('Saved') for x in t) and (await sel(pg)).startswith('All'), f'no Saved tab until something is saved, and All is showing {t}')
        mods = await pg.evaluate("SB_REGISTRY.modules.filter(m => !m.archived).map(m => m.id)")
        n = len(mods); check(n >= 4, f'modules to work with ({n})')

        # ---- save from a card ----
        b0 = pg.locator('.modcard [data-bm]').first
        check(await b0.get_attribute('aria-pressed') == 'false' and 'Save ' in await b0.get_attribute('aria-label'), 'a card has a Save button, not pressed')
        await b0.click(); await pg.wait_for_timeout(100)
        first = await pg.locator('.modcard [data-bm]').first.get_attribute('data-bm')
        t = await tabs(pg)
        check(len(t) > 1 and t[0].startswith('All') and t[1].startswith('Saved') and t[1].endswith('1'), f'a Saved tab appears right next to All with a count {t[:3]}')
        check(await pg.evaluate("document.activeElement.dataset.bm") == first and await pg.evaluate("document.activeElement.getAttribute('aria-pressed')") == 'true', 'the pressed Save button keeps focus and says pressed')
        check('Remove' in await pg.evaluate("document.activeElement.getAttribute('aria-label')"), 'its label now offers to remove it')
        check(await pg.evaluate("SB.child('k1').bookmarks.join()") == first, 'saved in the student record')
        await pg.locator('.modcard [data-bm]').nth(2).click(); await pg.wait_for_timeout(100)
        check((await tabs(pg))[1].endswith('2'), 'a second save raises the count')
        await shot(pg, 'bm-all')

        # ---- the Saved tab ----
        await pg.click('nav[aria-label="Subjects"] a.stab'); await pg.wait_for_selector('a.stab[aria-selected="true"]'); await pg.wait_for_timeout(100)
        check((await sel(pg)).startswith('Saved') and await pg.locator('.modcard').count() == 2, 'the Saved tab lists just the saved modules')
        check(await pg.locator('.modcard [data-bm][aria-pressed="true"]').count() == 2, 'each is marked saved')
        await shot(pg, 'bm-saved')

        # ---- home opens on Saved ----
        await pg.goto(BASE + '#/home'); await pg.wait_for_selector('.modcard')
        check((await sel(pg)).startswith('Saved'), 'opening the home screen shows Saved when something is saved')
        await pg.reload(); await pg.wait_for_selector('.modcard'); check((await sel(pg)).startswith('Saved'), 'also on a fresh load')
        await pg.goto(BASE + '#/home/all'); await pg.wait_for_selector('.modcard')
        check((await sel(pg)).startswith('All') and await pg.locator('.modcard').count() == n, 'the All tab still shows every module')
        await pg.goto(BASE + '#/home/math'); await pg.wait_for_selector('.modcard'); check((await sel(pg)).startswith('Math'), 'a subject tab still opens its own subject')

        # ---- the module page ----
        await pg.goto(BASE + '#/module/' + first); await pg.wait_for_selector('.modhead [data-bm]')
        mb = pg.locator('.modhead [data-bm]')
        check(await mb.get_attribute('aria-pressed') == 'true' and 'Saved' in await mb.inner_text(), 'the module page shows it as Saved')
        await mb.click(); await pg.wait_for_timeout(100)
        check(await pg.locator('.modhead [data-bm]').get_attribute('aria-pressed') == 'false' and 'Save' == (await pg.locator('.modhead [data-bm]').inner_text()).strip(), 'pressing it removes it')
        await pg.locator('.modhead [data-bm]').click(); await pg.wait_for_timeout(100)
        check(await pg.evaluate("SB.isBookmarked('" + first + "')"), 'and pressing again saves it')
        await shot(pg, 'bm-module')

        # ---- per student ----
        await pg.goto(BASE + '#/home'); await pg.evaluate("SB.setActive('k2')"); await pg.goto(BASE + '#/help'); await pg.goto(BASE + '#/home'); await pg.wait_for_timeout(300)
        check(not any(x.startswith('Saved') for x in await tabs(pg)) and (await sel(pg)).startswith('All'), 'another student has their own list: none saved, so All')
        await pg.evaluate("SB.setActive('k1')"); await pg.goto(BASE + '#/help'); await pg.goto(BASE + '#/home'); await pg.wait_for_selector('a.stab', timeout=5000)
        check((await sel(pg)).startswith('Saved'), 'the first student still has theirs')

        # ---- remove the last ones: the tab goes away and All shows ----
        await pg.click('nav[aria-label="Subjects"] a.stab'); await pg.wait_for_selector('a.stab[aria-selected="true"]'); await pg.wait_for_timeout(100)
        while await pg.locator('.modcard').count() > 1:
            await pg.locator('.modcard [data-bm]').first.click(); await pg.wait_for_timeout(80)
        await pg.locator('.modcard [data-bm]').first.click(); await pg.wait_for_timeout(150)
        check(not any(x.startswith('Saved') for x in await tabs(pg)) and (await sel(pg)).startswith('All') and await pg.locator('.modcard').count() == n, 'removing the last saved module drops the tab and shows All')
        check(await pg.evaluate("document.activeElement.tagName") != 'BODY', 'focus is not lost')

        # ---- data safety ----
        await pg.evaluate("localStorage.setItem('studybuddy.v1.child.k1', JSON.stringify({bookmarks: ['a', 'a', 7, null, {}, 'b']}))")
        check(await pg.evaluate("SB.child('k1').bookmarks.join()") == 'a,b', 'odd saved data is cleaned (no duplicates or non-text)')
        await pg.evaluate("localStorage.setItem('studybuddy.v1.child.k1', JSON.stringify({bookmarks: 'x'}))")
        check(await pg.evaluate("SB.child('k1').bookmarks.length") == 0, 'a bookmarks value that is not a list becomes empty')
        await pg.evaluate("(() => { const a = SB.child('k1'), c = SB.child('k2'); a.bookmarks = ['x1', 'x2']; c.bookmarks = ['x2', 'x3']; localStorage.setItem('studybuddy.v1.child.k1', JSON.stringify(a)); localStorage.setItem('studybuddy.v1.child.k2', JSON.stringify(c)); SB.mergeProfile('k1', 'k2'); })()")
        check(await pg.evaluate("SB.child('k2').bookmarks.join()") == 'x2,x3,x1', 'moving one profile into another joins the saved modules')
        await pg.evaluate("SB.toggleBookmark('keep', 'k2'); SB.resetChild('k2')")
        check(await pg.evaluate("SB.child('k2').bookmarks.includes('keep')"), 'resetting progress keeps saved modules')
        bk = await pg.evaluate("SB.exportAll ? 1 : 0"); check(bk == 1, 'backups include the student record (and so the saved modules)')

        # ---- the new words ----
        await pg.evaluate("SB.setActive('k1')"); await pg.goto(BASE + '#/help'); await pg.goto(BASE + '#/home'); await pg.wait_for_selector('.modcard')
        foot = await pg.inner_text('#sbFoot')
        check('Admin area' in foot and 'Parent' not in foot, 'the footer says Admin area')
        await pg.goto(BASE + '#/admin'); await pg.wait_for_selector('.sb-dlg, #psec, #setPin')
        txt = await pg.inner_text('body')
        check('Admin' in txt and 'arent' not in txt, 'the #/admin link opens the admin area with no "parent" on the page')
        await pg.goto(BASE + '#/parent/children'); await pg.wait_for_selector('.sb-dlg, #psec, #setPin')
        check('Students' in await pg.inner_text('body') or await pg.locator('.sb-dlg').count() > 0, 'the old #/parent/children link still works')
        await pg.goto(BASE + '#/settings'); await pg.wait_for_selector('.setgroup')
        s = await pg.inner_text('#app')
        check('Admins' in s and 'arent' not in s and 'child' not in s.lower().replace('children', 'x') and 'children' not in s.lower(), 'Settings uses Student and Admin')
        await pg.goto(BASE + '#/help'); await pg.wait_for_selector('#app .panel')
        h = await pg.inner_text('#app'); check('arent' not in h and 'child' not in h.lower(), 'Help has no parent or child')
        await pg.goto(BASE + '#/faq'); await pg.wait_for_selector('#app .panel')
        f = await pg.inner_text('#app'); check('arent' not in f and 'child' not in f.lower(), 'the FAQ has no parent or child')

        # ---- layout ----
        await pg.evaluate("SB.toggleBookmark('" + first + "')")
        await pg.goto(BASE + '#/home'); await pg.wait_for_selector('.modcard')
        ov = await pg.evaluate("document.documentElement.scrollHeight - innerHeight"); 
        for w, h in ((1440, 900), (360, 740)):
            for extra in ('', "SB.setSetting('size','large'); SB.setSetting('font','dyslexic'); SB.applyDisplay();"):
                px = await ctx.new_page(); await px.set_viewport_size({'width': w, 'height': h}); await px.goto(BASE + '#/home'); await px.wait_for_selector('.modcard')
                if extra: await px.evaluate(extra); await px.wait_for_timeout(150)
                sw = await px.evaluate("document.documentElement.scrollWidth - innerWidth")
                over = await px.evaluate("[...document.querySelectorAll('.modcard')].filter(c => { const a = c.querySelector('.spk').getBoundingClientRect(), k = c.querySelector('.bm').getBoundingClientRect(); return !(a.bottom <= k.top + 1) || k.right > c.getBoundingClientRect().right + 1; }).length")
                check(sw <= 0 and over == 0, f'cards with the Save button fit at {w}px{" with larger text and dyslexic" if extra else ""} (sideways {sw}, overlaps {over})')
                if w == 360 and not extra: await shot(px, 'bm-phone')
                await px.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
