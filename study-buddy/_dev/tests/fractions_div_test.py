"""Division of Fractions module (Dimensions Math 5, chapter 6): registry, guide and helper, typed answers, area model,
sort, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/fractions_div_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fracfill import fill_box, fill_answer, fill_any, plain
from fractions import Fraction
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
MOD = BASE + 'modules/math/fractions-divide/index.html'
TOOLS = ['guide', 'share', 'fracwhole', 'fit', 'wholefrac', 'words', 'review']
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""

def values(html):
    out = []
    for m in re.finditer(r'<span class="mixed" data-w="(\d+)"><b>\d+</b><span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="num" data-w="(\d+)">', html):
        out.append(Fraction(int(m[1])) + Fraction(int(m[2]), int(m[3])) if m[1] else Fraction(int(m[4]), int(m[5])) if m[4] else Fraction(int(m[6])))
    return out
def write(v, mixed=True):
    v = Fraction(v)
    if v.denominator == 1: return str(v.numerator)
    w = v.numerator // v.denominator
    return f'{w} {v.numerator - w * v.denominator}/{v.denominator}' if w and mixed else f'{v.numerator}/{v.denominator}'
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")   # measure after fonts and layout settle
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'fractions-divide').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['math:guide/easy,cards/easy,share/easy,fracwhole/easy,fit/medium,wholefrac/medium,words/hard,review/insane,quiz/hard'], f'registry entry {reg}')

        # ---- guide and helper ----
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .fgout')
        check(await pg.locator('#tab-guide .rule').count() == 6, 'six worked-example cards')
        async def helper(a, c):
            ins = pg.locator('#tab-guide .fgform .fbox'); await fill_box(ins.nth(0), a); await fill_box(ins.nth(1), c); await pg.click('#tab-guide .fgform button'); return await plain(pg, '#tab-guide .fgout')
        t = await helper('3/4', '2'); check('3/8' in t, f'helper: 3/4 / 2 {t[:100]!r}')
        t = await helper('3', '3/4'); check('= 4' in t or '4' in t.split('=')[1], f'helper: 3 / 3/4 {t[:100]!r}')
        t = await helper('2 1/2', '3'); check('5/6' in t, f'helper: mixed number {t[:100]!r}')
        t = await helper('1/2', '0'); check('divide by zero' in t, 'helper refuses zero')
        t = await helper('x', '1/2'); check('Check the boxes' in t, 'helper explains bad input')

        # ---- typed answers ----
        async def type_check(tool, text):
            await fill_any(pg, tool, text); await pg.click(f'#tab-{tool} form button'); await pg.wait_for_timeout(60)
            return await pg.inner_text(f'#tab-{tool} .err')
        async def quotient(tool):
            hh = await pg.inner_html(f'#tab-{tool} .qtext'); v = values(hh)
            return v[0] / v[1], hh
        for tool in ['fracwhole', 'wholefrac', 'words']:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext')
            msg = await type_check(tool, 'abc'); check('Fill in the boxes' in msg, f'{tool}: nonsense gets a hint ({msg!r})')
            for k in range(10):
                want, hh = await quotient(tool)
                if k == 0 and want.denominator > 1:
                    msg = await type_check(tool, f'{want.numerator * 2}/{want.denominator * 2}'); check('simplest form' in msg, f'{tool}: unreduced answer nudged ({msg!r})')
                msg = await type_check(tool, write(want)); check(msg.startswith('Correct'), f'{tool}: {write(want)} accepted ({msg!r})')
                await pg.click(f'#tab-{tool} [data-a="next"]'); await pg.wait_for_timeout(40)
            check('10 out of 10' in await pg.inner_text(f'#tab-{tool} .result'), f'{tool}: a full round scores')
        await pg.goto(MOD + '?tool=review'); await pg.wait_for_selector('#tab-review .qtext')
        await type_check('review', '99/100'); msg = await type_check('review', '99/100'); check(msg.startswith('The answer is'), f'two misses show the answer ({msg!r})')
        # the two picture quizzes
        for tool, cls in (('share', 'dbar'), ('fit', 'dbar2')):
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .opt')
            check(await pg.locator(f'#tab-{tool} .{cls}').count() == 1 and await pg.locator(f'#tab-{tool} .opt').count() == 4, f'{tool}: one picture and four choices')
            for k in range(10):
                want, hh = await quotient(tool)
                await pg.click(f'#tab-{tool} .opt[data-v="{write(want)}"]'); await pg.click(f'#tab-{tool} [data-a="next"]')
            check('10 out of 10' in await pg.inner_text(f'#tab-{tool} .result'), f'{tool}: reading the picture scores 10 of 10')

        # ---- layout ----
        for tool in TOOLS:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(120)
            ov = await overflow(pg)
            if tool == 'guide': check(ov['h'] <= 0, f'{tool}: no sideways scroll at 1440x900 {ov}')
            else: check(ov['v'] <= 0 and ov['h'] <= 0, f'{tool}: no scroll bars at 1440x900 {ov}')
        await pg.goto(MOD + '?tool=share'); await pg.wait_for_selector('#tab-share .opt'); await pg.screenshot(path='/tmp/div_share.png')
        await pg.goto(MOD + '?tool=fit'); await pg.wait_for_selector('#tab-fit .opt'); await pg.screenshot(path='/tmp/div_fit.png')
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .rule'); await pg.screenshot(path='/tmp/div_guide.png', full_page=True)
        for extra in ('', 'dys'):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            for tool in TOOLS:
                await q.goto(MOD + '?tool=' + tool); await q.wait_for_selector(f'#tab-{tool} h2')
                if extra: await q.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await q.wait_for_timeout(150)
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{tool}: no sideways scroll at 360px {extra} ({ov})')
                if tool in ('share', 'fit') and not extra: await q.screenshot(path=f'/tmp/div_360_{tool}.png')
            await m.close()
        await pg.goto(MOD + '?tool=share'); await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()"); await pg.wait_for_selector('#tab-share .dbar'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/div_share_dark.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
