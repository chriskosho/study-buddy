"""Fixes from the October 2026 code review: shared code (old Safari, Refresh offline, safe dialogs, best scores, storage full,
display per child, backups, offline worker). Later review PRs add their checks here too.
Run:  python3 study-buddy/_dev/tests/review_fixes_test.py"""
import asyncio, http.server, threading, functools, os, sys, re, glob
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8776
BASE = f'http://127.0.0.1:{PORT}/'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
TWO = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'},{id:'k2',name:'Hazel',color:'#1b998b'}],active:'k1',pin:null,pinOffered:true}));"""

async def main():
    # ---- no script uses syntax that Safari before 16.4 cannot read (one lookbehind used to blank every shared tool) ----
    bad = [f for f in glob.glob(SITE + '/**/*.js', recursive=True) if '/_dev/' not in f and re.search(r'\(\?<[=!]', open(f, encoding='utf8').read())]
    bad += [f for f in glob.glob(SITE + '/**/*.html', recursive=True) if '/_dev/' not in f and re.search(r'\(\?<[=!]', open(f, encoding='utf8').read())]
    check(not bad, f'no regex lookbehind in site code {bad}')

    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(TWO)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')

        # Explain it still splits sentences the same way without the lookbehind
        g = await pg.evaluate("""(async () => { await new Promise(r => { const s = document.createElement('script'); s.src = 'shared/sb-tools.js'; s.onload = r; document.head.appendChild(s); });
            return [SBT.gradeExplain('In 753 B.C. Rome began. It grew fast!', { ideas: [{ label: 'x', all: [['rome']] }] }).complete,
                    SBT.gradeExplain('rome began. it grew', { ideas: [{ label: 'x', all: [['rome']] }] }).complete]; })()""")
        check(g == [True, False], f'Explain it sentence check unchanged {g}')

        # ---- best score is the best share of a round ----
        r = await pg.evaluate("""(() => { SB.result('greek-latin-roots', 'sort', 6, 6); SB.result('greek-latin-roots', 'sort', 7, 9); const a = SB.toolRecord('greek-latin-roots', 'sort');
            SB.result('greek-latin-roots', 'sort', 18, 18); const b = SB.toolRecord('greek-latin-roots', 'sort'); return [a.best, a.max, b.best, b.max, a.attempts]; })()""")
        check(r == [6, 6, 18, 18, 2], f'6/6 is not replaced by 7/9, and 18/18 replaces 6/6 {r}')

        # ---- dangerous confirms start on Cancel ----
        await pg.goto(BASE + 'index.html#/settings'); await pg.wait_for_selector('#resetProg')
        await pg.click('#resetProg'); await pg.wait_for_selector('.sb-ov'); await pg.wait_for_timeout(120)
        f = await pg.evaluate("document.activeElement && document.activeElement.dataset.x")
        check(f == 'no', f'Reset all progress opens with focus on Cancel, not the dangerous button ({f})')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        check(await pg.locator('.sb-ov').count() == 0 and await pg.evaluate("SB.toolRecord('greek-latin-roots','sort') !== null"), 'pressing Enter there cancels and erases nothing')

        # ---- each child's display options follow a switch ----
        await pg.evaluate("SB.setSetting('theme','dark'); SB.setSetting('font','dyslexic'); SB.applyDisplay()")
        await pg.goto(BASE + 'index.html#/'); await pg.wait_for_selector('.whocard')
        await pg.click('.whocard:has-text("Hazel")'); await pg.wait_for_selector('.grid')
        cls = await pg.evaluate("document.documentElement.className")
        check('sb-dark' not in cls and 'sb-dyslexic' not in cls, f"switching to Hazel drops Joshua's dark mode and font ({cls!r})")
        await pg.goto(BASE + 'index.html#/'); await pg.click('.whocard:has-text("Joshua")'); await pg.wait_for_selector('.grid')
        check('sb-dark' in await pg.evaluate("document.documentElement.className"), 'and switching back brings them back')
        await pg.evaluate("SB.setSetting('theme','light'); SB.setSetting('font','standard'); SB.applyDisplay()")

        # ---- backups: leftovers of a deleted child are left out, not fatal ----
        res = await pg.evaluate("""(() => { localStorage.setItem('studybuddy.v1.m.zzz9.atlas', '{}'); localStorage.setItem('studybuddy.v1.child.zzz9', '{}');
            const out = SB.exportAll(), inOut = /zzz9/.test(out);
            const o = JSON.parse(out); o.data['studybuddy.v1.m.zzz9.atlas'] = '{}'; o.data['studybuddy.v1.notes.zzz9'] = '[]';
            let ok; try { const c = SB.checkBackup(JSON.stringify(o)); ok = !Object.keys(c.data).some(k => /zzz9/.test(k)); } catch (e) { ok = 'ERR ' + e.message; }
            localStorage.removeItem('studybuddy.v1.m.zzz9.atlas'); localStorage.removeItem('studybuddy.v1.child.zzz9'); return [inOut, ok]; })()""")
        check(res == [False, True], f'stray keys are not exported, and a file that has them still loads without them {res}')

        # ---- Refresh for the latest with no internet keeps the offline copy ----
        await pg.goto(BASE + 'index.html#/settings'); await pg.wait_for_selector('#refreshLatest')
        await ctx.set_offline(True); await pg.click('#refreshLatest'); await pg.wait_for_timeout(400)
        hint = await pg.inner_text('#refreshHint')
        check('No internet' in hint and await pg.is_enabled('#refreshLatest'), f'Refresh with no internet changes nothing and says so ({hint[:50]!r})')
        await ctx.set_offline(False)

        # ---- a full device says so instead of silently dropping progress ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        msg = await pg.evaluate("""(async () => { let i = 0; for (let size = 1 << 20; size >= 1; size >>= 1) { const big = 'x'.repeat(size); try { for (;; i++) localStorage.setItem('zz.fill' + i, big); } catch (e) {} }
            SB.updateProfile('k1', { name: 'Joshua the very long' }); await new Promise(r => setTimeout(r, 120)); const t = (document.getElementById('sb-toast') || {}).textContent || '';
            for (let j = 0; j <= i; j++) localStorage.removeItem('zz.fill' + j); SB.updateProfile('k1', { name: 'Joshua' }); return t; })()""")
        check('out of room' in msg, f'a failed save shows a message ({msg[:60]!r})')

        # ---- the first PIN offer: Escape goes home instead of leaving a blank page ----
        nx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await nx.add_init_script("""localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));""")
        np_ = await nx.new_page(); np_.on('pageerror', lambda e: errors.append(str(e)))
        await np_.goto(BASE + 'index.html#/parent'); await np_.wait_for_selector('.sb-ov'); await np_.keyboard.press('Escape'); await np_.wait_for_timeout(200)
        check(np_.url.endswith('#/home') and await np_.locator('.grid').count() == 1, f'Escape on the first PIN offer goes to Home ({np_.url[-10:]})')
        await nx.close()

        # ---- another tab resetting this child reloads the open module (so old progress is not written back) ----
        t2 = await ctx.new_page(); await t2.goto(BASE + 'modules/math/volume/index.html?tool=cubes'); await t2.wait_for_selector('#tab-cubes .qtext')
        await t2.evaluate("window.__marker = 1")
        await pg.evaluate("SB.resetChild('k1')"); await t2.wait_for_timeout(600)
        check(await t2.evaluate("window.__marker === undefined"), 'an open module reloads when another tab resets that child')
        await t2.close(); await ctx.close()

        # ---- offline worker: installs, opens a module with no internet, and a missing script is not answered with the home page ----
        ox = await b.new_context(viewport={'width': 1440, 'height': 900}); await ox.add_init_script(TWO)
        op = await ox.new_page(); op.on('pageerror', lambda e: errors.append(str(e)))
        await op.goto(BASE + 'index.html#/home'); await op.wait_for_selector('.grid')
        ready = await op.evaluate("(async () => { const r = await navigator.serviceWorker.ready; await new Promise(res => { const w = r.active; if (w && w.state === 'activated') res(); else setTimeout(res, 3000); }); return !!r.active; })()")
        check(ready, 'the offline worker installs')
        await op.wait_for_timeout(500)
        await ox.set_offline(True)
        await op.goto(BASE + 'modules/math/volume/index.html?tool=cubes'); await op.wait_for_selector('#tab-cubes .qtext', timeout=8000)
        check(await op.locator('#tab-cubes .qtext').count() == 1, 'a module opens with no internet')
        miss = await op.evaluate("fetch('shared/not-a-file.js').then(r => r.status + ' ' + (r.headers.get('content-type') || '')).catch(() => 'network error')")
        check('html' not in miss, f'a missing script offline is not answered with the home page ({miss})')
        await ox.set_offline(False); await ox.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
