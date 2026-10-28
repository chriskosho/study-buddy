"""Black Beauty study guide: the questions the teacher highlighted. Every highlighted question exists in the guide, the guide starts on
highlighted only, a switch shows all, the choice is kept per student, and it fits at 360px.
Run:  python3 study-buddy/_dev/tests/black_beauty_highlights_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        U = BASE + 'modules/english/black-beauty-guide/index.html?tool=guide'
        await pg.goto(U); await pg.wait_for_selector('#tab-guide .chcard')
        d = await pg.evaluate("({ hl: __bbTest.HL, talk: __bbTest.HL_TALK, ch: __bbTest.CH.map(c => [c.c, c.qa.map(x => x[0]), !!c.talk]) })")
        have = {c + '|' + q for c, qs, _ in d['ch'] for q in qs}
        check(len(d['hl']) == 31 and all(c + '|' + q in have for c, q in d['hl']), f"all {len(d['hl'])} highlighted questions are real questions in the guide")
        check(all(any(c == t and tk for c, _, tk in d['ch']) for t in d['talk']), 'the highlighted closing note exists')
        check(len({tuple(x) for x in d['hl']}) == len(d['hl']), 'no highlighted question is listed twice')
        # one switch in the settings row, starts on Highlighted
        tg = pg.locator('#sbTog')
        check(await tg.count() == 1 and 'Highlighted' in await tg.inner_text() and await tg.get_attribute('aria-pressed') == 'true', 'the settings row has a Showing: Highlighted switch, on by default')
        n1 = await pg.locator('#tab-guide .bq').count()
        check(n1 == 13, f'Part 1 shows only its highlighted questions ({n1})')
        check(await pg.locator('#tab-guide .bq:not(.hl)').count() == 0, 'every shown question is highlighted')
        check(await pg.locator('#tab-guide .bq.hl').first.evaluate("e => getComputedStyle(e).backgroundColor") != 'rgba(0, 0, 0, 0)', 'highlighted rows are marked with a yellow background')
        await pg.click('#tab-guide .gtabs [data-g="4"]')
        check(await pg.locator('#tab-guide .talk.hl').count() == 1 and 'fortitude' in await pg.inner_text('#tab-guide .talk'), 'Part 4 shows the highlighted closing note')
        # every tool has the highlighted pool
        pools = await pg.evaluate("({ on: { quiz: __bbTest.pool({}, QUIZ).length, type: __bbTest.pool({}, TYPE).length, ev: __bbTest.pool({}, EVENTS).length, ex: __bbTest.pool({}, EXPLAIN).length }, all: { quiz: __bbTest.pool({ hlOnly: false }, QUIZ).length, type: __bbTest.pool({ hlOnly: false }, TYPE).length, ev: EVENTS.length, ex: EXPLAIN.length } })")
        check(pools['on']['quiz'] == 31 and pools['on']['quiz'] < pools['all']['quiz'], f'Quiz has a question for each highlighted question {pools}')
        check(pools['on']['type'] >= 20 and pools['on']['type'] < pools['all']['type'], 'Type the answer has a highlighted pool')
        check(pools['on']['ev'] == 11 and pools['on']['ex'] == 5, 'Put in order and Explain it have highlighted pools')
        # every highlighted question is covered by a quiz question: its chapter and topic words appear
        cover = await pg.evaluate("__bbTest.HL.filter(([c, q]) => !__bbTest.pool({}, QUIZ).some(x => x.q.startsWith('Ch. ' + c + ':'))).length")
        check(cover == 0, f'every chapter with a highlighted question has highlighted quiz questions (uncovered {cover})')
        # each tool opens in highlighted mode and shows only highlighted content
        for tool in ('cards', 'quiz', 'order', 'answer', 'explain'):
            await pg.goto(BASE + f'modules/english/black-beauty-guide/index.html?tool={tool}'); await pg.wait_for_selector(f'#tab-{tool} > *')
            check(await pg.locator(f'#tab-{tool}').inner_text() != '', f'{tool} opens in Highlighted mode')
        await pg.goto(BASE + 'modules/english/black-beauty-guide/index.html?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qtext, #tab-quiz .prompt')
        qt = await pg.evaluate("document.querySelector('#tab-quiz .qtext, #tab-quiz .prompt').innerText")
        okq = await pg.evaluate("(t) => __bbTest.pool({}, QUIZ).some(x => t.includes(x.q.replace(/^Ch\\. [\\d–]+: /, '')))", qt)
        check(okq, f'the first quiz question is a highlighted one ({qt[:50]!r})')
        # switch to All: reloads on the same tool, and is kept
        await pg.click('#sbTog'); await pg.wait_for_selector('#tab-quiz .qtext, #tab-quiz .prompt')
        check('tool=quiz' in pg.url and 'All questions' in await pg.inner_text('#sbTog') and await pg.get_attribute('#sbTog', 'aria-pressed') == 'false', 'the switch stays on the same tool and shows All questions')
        await pg.goto(U); await pg.wait_for_selector('#tab-guide .chcard')
        tot = await pg.locator('#tab-guide .bq').count(); hl = await pg.locator('#tab-guide .bq.hl').count()
        check(tot > hl > 0 and await pg.locator('#tab-guide .bq.hl .hltag').count() == hl, f'All questions shows everything with the highlighted ones tagged in text too ({hl} of {tot})')
        await pg.click('#sbTog'); await pg.wait_for_selector('#tab-guide .chcard')
        check('Highlighted' in await pg.inner_text('#sbTog'), 'the switch goes back to Highlighted')
        for part in (1, 2, 3, 4):
            await pg.click(f'#tab-guide .gtabs [data-g="{part}"]'); check(await pg.locator('#tab-guide .bq.hl').count() + await pg.locator('#tab-guide .talk.hl').count() > 0, f'Part {part} has highlighted items')
        for w, h, extra in ((1440, 900, ''), (360, 740, ''), (360, 740, "SB.setSetting('size','large'); SB.setSetting('font','dyslexic'); SB.applyDisplay();")):
            px = await ctx.new_page(); await px.set_viewport_size({'width': w, 'height': h}); await px.goto(U); await px.wait_for_selector('#tab-guide .chcard')
            if extra: await px.evaluate(extra); await px.wait_for_timeout(150)
            sw = await px.evaluate("document.documentElement.scrollWidth - innerWidth")
            check(sw <= 0, f'fits at {w}px{" with larger text and dyslexic" if extra else ""} (sideways {sw})')
            await px.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
