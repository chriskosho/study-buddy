"""Multiplication of Fractions module (Dimensions Math 5, chapter 5): registry, guide and helper, typed answers, area model,
sort, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/fractions_mul_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fracfill import fill_box, fill_answer, fill_any, plain
from fractions import Fraction
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
MOD = BASE + 'modules/math/fractions-multiply/index.html'
TOOLS = ['guide', 'whole', 'fractionof', 'models', 'fraction', 'scale', 'recip', 'mixed', 'words', 'review']
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
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'fractions-multiply').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['math:guide/easy,whole/easy,fractionof/easy,models/easy,fraction/medium,scale/medium,recip/medium,mixed/hard,words/hard,review/insane'], f'registry entry {reg}')

        # ---- guide and helper ----
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .fgout')
        check(await pg.locator('#tab-guide .rule').count() == 6, 'six worked-example cards')
        check(await pg.locator('#tab-guide .farea').count() >= 2, 'the guide shows the area model')
        async def helper(a, c):
            ins = pg.locator('#tab-guide .fgform .fbox'); await fill_box(ins.nth(0), a); await fill_box(ins.nth(1), c); await pg.click('#tab-guide .fgform button'); return await plain(pg, '#tab-guide .fgout')
        t = await helper('2/3', '3/4'); check('1/2' in t and '6/12' in t, f'helper: 2/3 x 3/4 {t[:120]!r}')
        t = await helper('2 1/3', '3/4'); check('1 3/4' in t and '7/3' in t, f'helper: mixed number {t[-120:]!r}')
        t = await helper('4', '3/8'); check('1 1/2' in t, f'helper: whole number {t[:80]!r}')
        t = await helper('x', '1/2'); check('Check the boxes' in t, 'helper explains bad input')

        # ---- typed answers ----
        async def type_check(tool, text):
            await fill_any(pg, tool, text); await pg.click(f'#tab-{tool} form button'); await pg.wait_for_timeout(60)
            return await pg.inner_text(f'#tab-{tool} .err')
        async def product(tool):
            hh = await pg.inner_html(f'#tab-{tool} .qtext'); v = values(hh); r = Fraction(1)
            for x in v: r *= x
            return r, hh
        for tool in ['whole', 'fraction', 'mixed', 'words']:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext')
            msg = await type_check(tool, 'abc'); check('Fill in the boxes' in msg, f'{tool}: nonsense gets a hint ({msg!r})')
            for k in range(10):
                want, hh = await product(tool)
                if k == 0 and want.denominator > 1:
                    un = f'{want.numerator * 2}/{want.denominator * 2}'
                    msg = await type_check(tool, un); check('simplest form' in msg, f'{tool}: unreduced answer nudged ({msg!r})')
                msg = await type_check(tool, write(want)); check(msg.startswith('Correct'), f'{tool}: {write(want)} accepted ({msg!r})')
                await pg.click(f'#tab-{tool} [data-a="next"]'); await pg.wait_for_timeout(40)
            check('10 out of 10' in await pg.inner_text(f'#tab-{tool} .result'), f'{tool}: a full round scores')
        # fraction of a number: first question is "What is a/b of N?"
        await pg.goto(MOD + '?tool=fractionof'); await pg.wait_for_selector('#tab-fractionof .qtext')
        for k in range(10):
            want, hh = await product('fractionof'); await type_check('fractionof', write(want)); await pg.click('#tab-fractionof [data-a="next"]')
        check('10 out of 10' in await pg.inner_text('#tab-fractionof .result'), 'fractionof: a full round scores')
        # reciprocals
        await pg.goto(MOD + '?tool=recip'); await pg.wait_for_selector('#tab-recip .qtext')
        hh = await pg.inner_html('#tab-recip .qtext'); v = values(hh)
        if len(v) == 1 and 'reciprocal' in hh:
            msg = await type_check('recip', write(1 / v[0], mixed=False)); check(msg.startswith('Correct'), f'reciprocal accepted ({msg!r})')
        # review: two wrong tries reveal the answer
        await pg.goto(MOD + '?tool=review'); await pg.wait_for_selector('#tab-review .qtext')
        await type_check('review', '99/100'); msg = await type_check('review', '99/100'); check(msg.startswith('The answer is'), f'two misses show the answer ({msg!r})')

        # ---- area model ----
        await pg.goto(MOD + '?tool=models'); await pg.wait_for_selector('#tab-models .opt')
        check(await pg.locator('#tab-models .farea').count() == 1 and await pg.locator('#tab-models .opt').count() == 4, 'models: one picture and four choices')
        for k in range(10):
            want, hh = await product('models')
            await pg.click(f'#tab-models .opt[data-v="{write(want)}"]'); await pg.click('#tab-models [data-a="next"]')
        check('10 out of 10' in await pg.inner_text('#tab-models .result'), 'models: reading the picture scores 10 of 10')

        # ---- sort: bigger, smaller or the same ----
        await pg.goto(MOD + '?tool=scale'); await pg.wait_for_selector('#tab-scale .chip')
        n = await pg.locator('#tab-scale .chip').count(); check(n >= 7, f'scale: {n} items to sort')
        first = sorted(await pg.locator('#tab-scale .chip').all_inner_texts())
        await pg.click('#tab-scale [data-a="restart"]'); await pg.wait_for_selector('#tab-scale .chip')
        check(sorted(await pg.locator('#tab-scale .chip').all_inner_texts()) != first, 'scale: Start over brings a fresh set of items, not the same eight')
        done = 0
        while await pg.locator('#tab-scale .chip').count():
            await pg.evaluate("getSelection().removeAllRanges()")
            chip = pg.locator('#tab-scale .chip').first; t = await chip.inner_text()
            m = re.match(r'(\d+) × (?:(\d+) )?(\d+)/(\d+)$|(\d+) × (\d+)$', t.strip()); 
            v = Fraction(int(m[2] or 0)) + Fraction(int(m[3]), int(m[4])) if m[3] else Fraction(int(m[6]))
            await chip.click(); await pg.click(f'#tab-scale .bucket[data-b="{"less" if v < 1 else "equal" if v == 1 else "more"}"]'); done += 1
            if done > 20: break
        check(done == n, 'scale: every item sorted by its value')

        # ---- layout ----
        for tool in TOOLS:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(120)
            ov = await overflow(pg)
            if tool == 'guide': check(ov['h'] <= 0, f'{tool}: no sideways scroll at 1440x900 {ov}')
            else: check(ov['v'] <= 0 and ov['h'] <= 0, f'{tool}: no scroll bars at 1440x900 {ov}')
        await pg.goto(MOD + '?tool=models'); await pg.wait_for_selector('#tab-models .opt'); await pg.screenshot(path='/tmp/mul_models.png')
        await pg.goto(MOD + '?tool=fraction'); await pg.wait_for_selector('#tab-fraction .qtext'); await pg.screenshot(path='/tmp/mul_fraction.png')
        await pg.goto(MOD + '?tool=scale'); await pg.wait_for_selector('#tab-scale .chip'); await pg.screenshot(path='/tmp/mul_scale.png')
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .rule'); await pg.screenshot(path='/tmp/mul_guide.png', full_page=True)
        for extra in ('', 'dys'):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            for tool in TOOLS:
                await q.goto(MOD + '?tool=' + tool); await q.wait_for_selector(f'#tab-{tool} h2')
                if extra: await q.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await q.wait_for_timeout(150)
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{tool}: no sideways scroll at 360px {extra} ({ov})')
                if tool in ('models', 'fraction') and not extra: await q.screenshot(path=f'/tmp/mul_360_{tool}.png')
            await m.close()
        await pg.goto(MOD + '?tool=models'); await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()"); await pg.wait_for_selector('#tab-models .farea'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/mul_models_dark.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
