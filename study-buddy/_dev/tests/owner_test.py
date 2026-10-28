"""Admin area features from the October 2026 review: backup reminder, activity history, a tidier Progress tab with
"Needs help" and "Missed most often", moving Guest's progress, loading one child from a backup, and printing.
Run:  python3 study-buddy/_dev/tests/owner_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
SHOTS = os.environ.get('SHOTS')
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'},{id:'g1',name:'Guest',color:'#2b4162',guest:true}],active:'k1',pin:null,pinOffered:true}));"""

async def shot(pg, name):
    if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=True)

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', accept_downloads=True); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- misses and daily history are recorded while a child works ----
        await pg.goto(BASE + 'modules/math/volume/index.html?tool=cubes'); await pg.wait_for_selector('#tab-cubes .qtext')
        q = await pg.inner_text('#tab-cubes .qtext')
        await pg.fill('#tab-cubes input[aria-label="Your answer"]', '99999'); await pg.click('#tab-cubes form button'); await pg.wait_for_timeout(40)
        await pg.fill('#tab-cubes input[aria-label="Your answer"]', '99998'); await pg.click('#tab-cubes form button'); await pg.wait_for_timeout(60)
        miss = await pg.evaluate("SB.child('k1').misses || {}")
        check(list(miss.get('volume', {}).values()) == [1] and '(answer: ' in list(miss['volume'])[0], f'a missed typed answer is remembered with its answer {miss}')
        await pg.evaluate("SB.credit(); SB.credit(); SB.credit()")
        days = await pg.evaluate("SB.child('k1').days")
        check(list(days.values()) == [3], f'right answers are counted per day {days}')
        old = await pg.evaluate("(() => { const d = SB.child('k1'); d.days['2020-01-01'] = 4; localStorage.setItem('studybuddy.v1.child.k1', JSON.stringify(d)); SB.credit(); return Object.keys(SB.child('k1').days); })()")
        check('2020-01-01' not in old, 'days older than 60 are dropped')
        # set up: a tool tried three times without mastery, the same question missed often, and Guest with some progress
        await pg.evaluate("""(() => {
          for (let i = 0; i < 3; i++) SB.result('volume', 'cubes', 2, 10);
          for (let i = 0; i < 3; i++) SB.noteMiss('volume', 'How many cubes? (answer: 24)');
          SB.setActive('g1'); SB.result('place-value', 'place', 9, 10); SB.credit(); SB.setActive('k1');
        })()""")

        # ---- backup reminder ----
        await pg.goto(BASE + 'index.html#/parent/progress'); await pg.wait_for_selector('#psec .kidsum')
        check(await pg.locator('#bkNow').count() == 1, 'with progress and no backup yet, the admin area shows a backup reminder')
        async with pg.expect_download() as dl: await pg.click('#bkNow')
        check((await dl.value).suggested_filename.startswith('study-buddy-backup-'), 'the reminder downloads a backup')
        await pg.wait_for_timeout(100)
        check(await pg.locator('#bkNow').count() == 0 and await pg.evaluate("!!SB.root().lastBackupAt"), 'after a backup the reminder goes away')
        await pg.evaluate("(() => { const r = SB.root(); r.lastBackupAt = Date.now() - 20 * 864e5; localStorage.setItem('studybuddy.v1.root', JSON.stringify(r)); })()")
        await pg.goto(BASE + 'index.html#/parent/backup'); await pg.wait_for_selector('#lastBk')
        check('20 days ago' in await pg.inner_text('#lastBk'), 'the Backup tab says when the last backup was')
        await pg.goto(BASE + 'index.html#/parent/progress'); await pg.wait_for_selector('#psec .kidsum')
        check(await pg.locator('#bkNow').count() == 1, 'a backup older than two weeks brings the reminder back')

        # ---- Progress tab ----
        check(await pg.locator('.pfilter [data-who]').count() == 4, 'the Progress tab can show everyone or one child')
        check(await pg.locator('.kidsum').count() == 3 and await pg.locator('.kidsum').first.locator('.actbars i').count() == 14, 'each child has 14 days of activity bars')
        k1 = await pg.locator('.kidsum').first.inner_text()
        check('Needs help' in k1 and 'Count the cubes' in k1, f'a tool tried 3 times and not mastered is under Needs help {k1!r}')
        check('Missed most often' in k1 and 'How many cubes? (answer: 24)' in k1, 'questions missed more than once are listed')
        opened = await pg.evaluate("[...document.querySelectorAll('details.pmod')].filter(d => d.open).map(d => d.querySelector('summary b').textContent)")
        total = await pg.locator('details.pmod').count()
        check(0 < len(opened) < total and any('Volume' in t for t in opened), f'only modules someone has started are open ({len(opened)} of {total})')
        check(await pg.locator('h3.psubj').count() >= 2, 'modules are grouped by subject')
        await pg.click('#openAll'); check(await pg.evaluate("[...document.querySelectorAll('details.pmod')].every(d => d.open)"), 'Open all opens every module')
        await pg.click('#closeAll')
        await pg.click('[data-who="k2"]'); await pg.wait_for_timeout(50)
        check(await pg.locator('.kidsum').count() == 1 and 'Hazel' in await pg.inner_text('.kidsum'), 'choosing a child shows only that child')
        check(await pg.evaluate("document.querySelector('.ptable thead tr').children.length") == 3, 'the tables have one column for the chosen child')
        await pg.click('[data-who="all"]')
        await pg.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        check(await pg.evaluate("[...document.querySelectorAll('details.pmod')].every(d => d.open)"), 'printing opens every module')
        await pg.evaluate("window.dispatchEvent(new Event('afterprint'))")
        check(await pg.evaluate("[...document.querySelectorAll('details.pmod')].some(d => !d.open)"), 'and closes them again afterwards')
        await pg.emulate_media(media='print')
        check(await pg.evaluate("getComputedStyle(document.querySelector('.sbhead')).display === 'none' && getComputedStyle(document.querySelector('#printBtn')).display === 'none' && getComputedStyle(document.querySelector('.bar2')).display === 'none'"), 'the printout leaves out the header, tabs, and buttons')
        await pg.evaluate("SB.setSetting('theme', 'dark', 'k1'); SB.applyDisplay()"); await pg.wait_for_timeout(50)
        pc = await pg.evaluate("[getComputedStyle(document.querySelector('.diff.easy')).color, getComputedStyle(document.body).backgroundColor]")
        check(pc == ['rgb(35, 120, 74)', 'rgb(255, 255, 255)'], f'a child in dark mode still prints dark text on white {pc}')
        await pg.evaluate("SB.setSetting('theme', 'light', 'k1'); SB.applyDisplay()")
        await pg.emulate_media(media='screen')
        await shot(pg, 'owner-progress')
        for theme in ['dark']:
            await pg.evaluate("SB.setSetting('theme', 'dark', 'k1'); SB.applyDisplay()"); await pg.wait_for_timeout(50); await shot(pg, 'owner-progress-dark')
            await pg.evaluate("SB.setSetting('theme', 'light', 'k1'); SB.applyDisplay()")

        # ---- phone: no sideways scroll ----
        ph = await b.new_context(viewport={'width': 360, 'height': 780}, service_workers='block', is_mobile=True, has_touch=True)
        await ph.add_init_script(INIT)
        await ph.add_init_script("localStorage.setItem('studybuddy.v1.child.k1', " + json.dumps(json.dumps(await pg.evaluate("SB.child('k1')"))) + ")")
        pp = await ph.new_page(); pp.on('pageerror', lambda e: errors.append(str(e)))
        for sec in ['progress', 'children', 'backup']:
            await pp.goto(BASE + 'index.html#/parent/' + sec); await pp.wait_for_selector('#psec h2'); await pp.wait_for_timeout(150)
            await pp.evaluate("document.querySelectorAll('details.pmod').forEach(d => d.open = true)")
            sw = await pp.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check(sw <= 0, f'parent {sec} has no sideways scroll at 360px ({sw})')
            if sec == 'progress': await shot(pp, 'owner-progress-phone')
        await ph.close()

        # ---- move Guest's progress into a child ----
        await pg.goto(BASE + 'index.html#/parent/children'); await pg.wait_for_selector('.kidrow[data-id]')
        check(await pg.locator('.movebox').count() == 1 and await pg.locator('.kidrow[data-id="g1"] .movebox').count() == 1, 'only Guest offers to move its progress')
        await shot(pg, 'owner-children')
        # a full device: nothing is lost, Guest stays
        await pg.evaluate("window.__set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).includes('.child.k2')) throw new DOMException('full', 'QuotaExceededError'); return window.__set.call(this, k, v); }; 0")
        await pg.select_option('.moveTo', 'k2'); await pg.click('[data-act="move"]'); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(80)
        st = await pg.evaluate("({ ids: SB.profiles().map(p => p.id), g: Object.keys(SB.child('g1').tools) })")
        check(st['ids'] == ['k1', 'k2', 'g1'] and st['g'] == ['place-value/place'], f'when the device is full, the move changes nothing and Guest keeps its progress {st}')
        await pg.evaluate("Storage.prototype.setItem = window.__set; 0")
        # odd saved data does not stop the move; too many notes are named in the question
        await pg.evaluate("""(() => {
          const g = JSON.parse(localStorage.getItem('studybuddy.v1.child.g1')); g.misses = { volume: null, 'place-value': { 'Q (answer: 1)': 2 } }; localStorage.setItem('studybuddy.v1.child.g1', JSON.stringify(g));
          const n = i => ({ id: 'n' + i, at: i, items: [] });
          localStorage.setItem('studybuddy.v1.notes.k2', JSON.stringify([...Array(20).keys()].map(i => n(100 + i))));
          localStorage.setItem('studybuddy.v1.notes.g1', JSON.stringify([...Array(10).keys()].map(i => n(i))));
          localStorage.setItem('studybuddy.v1.m.k2.stamps', JSON.stringify(['peru'])); localStorage.setItem('studybuddy.v1.m.g1.stamps', JSON.stringify(['chile', 'peru']));
        })()""")
        await pg.goto(BASE + 'index.html#/parent/children'); await pg.wait_for_selector('.movebox')
        await pg.select_option('.moveTo', 'k2'); await pg.click('[data-act="move"]')
        check('5 oldest notes will be left out' in await pg.inner_text('.sb-dlg'), 'the question says which notes will not fit')
        await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(80)
        st = await pg.evaluate("({ ids: SB.profiles().map(p => p.id), tools: Object.keys(SB.child('k2').tools), days: Object.values(SB.child('k2').days), today: SB.child('k2').daily.n, miss: SB.child('k2').misses['place-value'], notes: JSON.parse(localStorage.getItem('studybuddy.v1.notes.k2')).length, stamps: JSON.parse(localStorage.getItem('studybuddy.v1.m.k2.stamps')) })")
        check(st['ids'] == ['k1', 'k2'] and 'place-value/place' in st['tools'] and st['days'] == [1] and st['today'] == 1, f"Guest's scores, today's count and history now belong to Hazel, and Guest is gone {st}")
        check(st['miss'] == {'Q (answer: 1)': 2} and st['notes'] == 25 and st['stamps'] == ['peru', 'chile'], f"missed questions, notes (up to 25) and module lists are combined {st}")

        # ---- load one child from a backup ----
        backup = await pg.evaluate("SB.exportAll()")
        await pg.evaluate("SB.resetChild('k2'); SB.result('volume', 'cubes', 10, 10)")
        before_k1 = await pg.evaluate("JSON.stringify(SB.child('k1').tools)")
        await pg.goto(BASE + 'index.html#/parent/backup'); await pg.wait_for_selector('#pick1')
        await pg.set_input_files('#imp1', files=[{'name': 'b.json', 'mimeType': 'application/json', 'buffer': backup.encode()}])
        await pg.wait_for_selector('.sb-dlg #oneFrom')
        await pg.select_option('#oneFrom', 'k2'); await pg.wait_for_timeout(30)
        check(await pg.evaluate("document.querySelector('#oneTo').value") == '' and not await pg.locator('#oneWarn').is_visible(), 'loading one child starts as a new child')
        await pg.select_option('#oneTo', 'k2'); await pg.wait_for_timeout(30)
        check(await pg.locator('#oneWarn').is_visible(), 'choosing to replace a child shows a warning')
        await shot(pg, 'owner-loadone')
        await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(80)
        k2 = await pg.evaluate("Object.keys(SB.child('k2').tools)")
        check('place-value/place' in k2, f"Hazel's progress came back from the backup {k2}")
        check(await pg.evaluate("JSON.stringify(SB.child('k1').tools)") == before_k1, "Joshua's newer progress was not touched")
        await pg.set_input_files('#imp1', files=[{'name': 'b.json', 'mimeType': 'application/json', 'buffer': backup.encode()}])
        await pg.wait_for_selector('.sb-dlg #oneFrom'); await pg.select_option('#oneFrom', 'k1'); await pg.select_option('#oneTo', ''); await pg.click('.sb-dlg [data-x="yes"]'); await pg.wait_for_timeout(80)
        names = await pg.evaluate("SB.profiles().map(p => p.name)")
        check(names == ['Joshua', 'Hazel', 'Joshua'], f'or a child can come back as a new child {names}')
        await pg.set_input_files('#imp1', files=[{'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'{"nope":1}'}])
        await pg.wait_for_selector('.sb-dlg'); check('not a Study Buddy backup' in await pg.inner_text('.sb-dlg'), 'a file that is not a backup is refused with a plain message')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
