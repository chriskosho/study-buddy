"""Textbooks page test (Playwright + Chromium).
The Textbooks tab, the book list, the book page (chapters in order, matched lessons, chapters not built yet), "Up next",
tool links that open the right tool, progress marks per student, and layout at 1440x900 and 360px.
Run:  python3 study-buddy/_dev/tests/textbooks_test.py   (screenshots go to $SB_SHOTS if set)"""
import asyncio, http.server, threading, functools, os, sys, json, socket
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(socket.socket())
BASE = f'http://127.0.0.1:{PORT}/'
SHOTS = os.environ.get('SB_SHOTS')
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'}],active:'k1',pin:null,pinOffered:true}));"""
async def shot(pg, name):
    if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=True)
async def over(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
def seed(kid, tools):   # tools: {'fractions-add-sub/division': (best, max)} or None for a started tool with no score
    return "(() => { const d = SB.child('%s'); const t = %s; for (const k in t) d.tools[k] = t[k] ? { attempts: 1, visits: 1, best: t[k][0], max: t[k][1], last: Date.now() } : { attempts: 1, visits: 1, last: Date.now() }; localStorage.setItem('studybuddy.v1.child.%s', JSON.stringify(d)); })()" % (kid, json.dumps(tools), kid)
async def open_book(pg, kid='k1'):
    await pg.goto(BASE + '#/help'); await pg.evaluate("id => SB.setActive(id)", kid)
    await pg.goto(BASE + '#/textbooks/dimensions-5'); await pg.wait_for_selector('.tb-chaps')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))

        # ---- the tab and the book list ----
        await pg.goto(BASE + '#/home/all'); await pg.wait_for_selector('nav.tabs')
        tab = pg.locator('nav.tabs a:has-text("Textbooks")')
        check(await tab.count() == 1, 'the home tabs have a Textbooks tab')
        await tab.click(); await pg.wait_for_selector('#tbArea .mod')
        check('Textbooks' in await pg.locator('h1').inner_text() and await pg.locator('#tbArea .mod').count() == 1, 'the Textbooks page lists the book')
        check('Dimensions Math 5' in await pg.locator('#tbArea .mod h3').inner_text(), 'the book keeps the title as printed')
        check(await pg.locator('nav.tabs a[aria-selected="true"]').inner_text() == 'Textbooks', 'the Textbooks tab shows as selected')
        await pg.locator('#tbArea .mod').click(); await pg.wait_for_selector('.tb-chaps')
        check(pg.url.endswith('#/textbooks/dimensions-5'), 'the book opens at its own address')
        crumbs = await pg.locator('.sbcrumbs').inner_text()
        check('Textbooks' in crumbs and 'Dimensions Math 5' in crumbs, 'the trail shows Textbooks, then the book')
        check(await pg.locator('.sbcrumbs a:has-text("Textbooks")').count() == 1, 'Textbooks in the trail is a link back')

        # ---- the book page ----
        chaps = pg.locator('.tb-chap')
        check(await chaps.count() == 15, 'all 15 chapters are listed')
        nums = [t.strip() for t in await pg.locator('.tb-num').all_inner_texts()]
        check(nums == ['Chapter %d' % i for i in range(1, 16)], 'chapters run 1 to 15 in order')
        off = await pg.locator('.tb-off').count()
        check(off == 10 and all('Not in Study Buddy yet' in t for t in await pg.locator('.tb-off').all_inner_texts()), 'chapters with no module say "Not in Study Buddy yet" (1 to 3 and 9 to 15)')
        check(await pg.locator('.tb-chap:not(.tb-off):not(details)').count() == 4, 'chapters 5 to 8 are built but not matched to lessons yet')
        for h in ['fractions-multiply', 'fractions-divide', 'measurement', 'volume']:
            check(await pg.locator(f'a[href*="modules/math/{h}/"]').count() == 1, f'chapter link to the {h} module')
        c4 = pg.locator('details.tb-chap')
        check(await c4.count() == 1 and await c4.get_attribute('open') is not None, 'Chapter 4 is open')
        check(await pg.locator('.tb-lesson').count() == 9, 'Chapter 4 shows its nine lessons')
        check('Addition and Subtraction of Fractions' in await c4.locator('summary').inner_text(), 'Chapter 4 carries the book title')
        l2 = pg.locator('#tb-4-2')
        check('Adding Unlike Fractions' in await l2.inner_text() and 'Add two or three fractions with unlike denominators' in await l2.inner_text(), 'a lesson lists its title and the IXL skill names')
        check([t.strip() for t in await l2.locator('.tb-tools a').all_inner_texts()] == ['Use the models', 'Unlike denominators'], 'Lesson 2 offers Use the models, then Unlike denominators')
        check(await pg.locator('.tb-tools a[href*="tool=practice"]').count() == 0, 'no link points at a missing tool')
        check(await pg.locator('a[href^="https://www.ixl.com/"][target="_blank"][rel*="noopener"]').count() == 1, 'one link to the IXL skill plan, opening in a new tab')
        check('Study guide' in await c4.locator('.tb-top').inner_text(), 'the chapter has a Study guide button')

        # ---- up next, with nothing done ----
        nx = pg.locator('#tbNext')
        check('Chapter 4, Lesson 1: Fractions and Division' in await nx.inner_text(), 'Up next is Chapter 4, Lesson 1 when nothing is done')
        check((await nx.locator('a').get_attribute('href')).endswith('fractions-add-sub/index.html?tool=division'), 'Up next opens that lesson\'s first tool')
        check(await pg.locator('.tb-lesson .done').count() == 0, 'no lesson shows Done for a new student')
        check(await over(pg) <= 0, 'no sideways scroll at 1440 wide')
        await shot(pg, 'textbooks_new')

        # ---- a tool link opens that tool ----
        await pg.locator('#tb-4-2 .tb-tools a:has-text("Use the models")').click()
        await pg.wait_for_selector('#tabbtn-models')
        check('fractions-add-sub' in pg.url and 'tool=models' in pg.url, 'the link goes to the module with that tool')
        check(await pg.locator('#tabbtn-models').get_attribute('aria-selected') == 'true', 'Use the models is the open tool')

        # ---- progress marks follow the student ----
        await pg.goto(BASE + '#/help')
        await pg.evaluate(seed('k1', {'fractions-add-sub/division': (9, 10), 'fractions-add-sub/models': (8, 10), 'fractions-add-sub/unlike': (3, 10), 'fractions-add-sub/mixedadd': None}))
        await open_book(pg)
        check('Done' in await pg.locator('#tb-4-1').inner_text(), 'Lesson 1 is Done once Fractions and division is mastered')
        check('Done' not in await pg.locator('#tb-4-2').inner_text() and 'In progress' in await pg.locator('#tb-4-2').inner_text(), 'Lesson 2 is In progress: Use the models is mastered, Unlike denominators is not')
        check('In progress' in await pg.locator('#tb-4-5').inner_text(), 'a tool started with no score counts as in progress')
        check('In progress' not in await pg.locator('#tb-4-7').inner_text() and 'Done' not in await pg.locator('#tb-4-7').inner_text(), 'an untouched lesson has no mark')
        check('Chapter 4, Lesson 2: Adding Unlike Fractions' in await pg.locator('#tbNext').inner_text() and 'Unlike denominators' in await pg.locator('#tbNext').inner_text(), 'Up next moves to Lesson 2 and its first tool not mastered')
        check((await pg.locator('#tbNext a').get_attribute('href')).endswith('?tool=unlike'), 'Up next opens Unlike denominators')
        check(await pg.locator('#tb-4-2 .tb-tools a').first.get_attribute('aria-label') == 'Use the models, mastered', 'a mastered tool is labeled for screen readers')
        check('1 of 9 lessons done' in await c4.locator('summary').inner_text(), 'the chapter header counts lessons done')
        check('1 of 9 lessons done' in await pg.locator('.tb-bookhead + .prog .hint').inner_text(), 'the book bar counts lessons done')
        await shot(pg, 'textbooks_progress')
        await open_book(pg, 'k2')
        check(await pg.locator('.tb-lesson .done').count() == 0 and 'Lesson 1: Fractions and Division' in await pg.locator('#tbNext').inner_text(), 'another student starts fresh')

        # ---- all done ----
        done = {}
        for t in ['division', 'models', 'improper', 'unlike', 'words', 'review', 'mixedadd', 'mixedsub']: done['fractions-add-sub/' + t] = (9, 10)
        await pg.goto(BASE + '#/help'); await pg.evaluate(seed('k2', done)); await open_book(pg, 'k2')
        check(await pg.locator('.tb-lesson.is-done').count() == 9 and 'All done' in await pg.locator('details.tb-chap summary').inner_text(), 'every Chapter 4 lesson shows Done when its tools are mastered')
        check('Every matched lesson is done' in await pg.locator('#tbNext').inner_text(), 'Up next says every matched lesson is done')

        # ---- a phone, and keyboard ----
        mp = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await mp.add_init_script(INIT)
        ph = await mp.new_page(); ph.on('pageerror', lambda e: errors.append(str(e)))
        await ph.goto(BASE + '#/textbooks/dimensions-5'); await ph.wait_for_selector('.tb-chaps')
        check(await over(ph) <= 0, 'no sideways scroll at 360 wide')
        await shot(ph, 'textbooks_phone')
        await ph.locator('details.tb-chap summary').focus(); await ph.keyboard.press('Enter'); await ph.wait_for_timeout(100)
        check(await ph.locator('details.tb-chap').get_attribute('open') is None, 'a chapter folds with the keyboard (Enter on its header)')
        await ph.keyboard.press('Enter'); await ph.wait_for_timeout(100)
        check(await ph.locator('details.tb-chap').get_attribute('open') is not None, 'and opens again')
        check(await over(ph) <= 0, 'still no sideways scroll at 360 wide')
        await mp.close()

        # ---- an unknown book goes back to the list ----
        await pg.goto(BASE + '#/textbooks/nope'); await pg.wait_for_selector('#tbArea .mod')
        check(pg.url.endswith('#/textbooks'), 'an unknown book goes back to the Textbooks list')
        await b.close()
    check(not errors, 'no console or page errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
    print('\n%s' % ('ALL PASSED' if not fails else '%d FAILED' % len(fails)))
    sys.exit(1 if fails else 0)
asyncio.run(main())
