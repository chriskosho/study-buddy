"""Measurement and Area module (Dimensions Math 5, chapter 7): registry, guide and helper, typed answers, area model,
sort, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/measurement_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from fractions import Fraction
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8782
BASE = f'http://127.0.0.1:{PORT}/'
MOD = BASE + 'modules/math/measurement/index.html'
TOOLS = ['guide', 'units', 'time', 'rect', 'triangle', 'trapezoid', 'composite', 'review']
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
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'measurement').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['math:guide/easy,units/easy,time/easy,rect/medium,triangle/medium,trapezoid/hard,composite/hard,review/insane'], f'registry entry {reg}')

        # ---- guide and helper ----
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .fgout')
        check(await pg.locator('#tab-guide .rule').count() == 6, 'six worked-example cards')
        async def helper(shape, a, b, c='1'):
            await pg.select_option('#tab-guide .gshape', shape); ins = pg.locator('#tab-guide .fgform .textin'); await ins.nth(0).fill(a); await ins.nth(1).fill(b); (await ins.nth(2).fill(c) if shape != 'rect' else None); await pg.click('#tab-guide .fgform button'); return (await pg.inner_text('#tab-guide .fgout')).replace('\n', ' ')
        t = await helper('rect', '3', '2 1/2'); check('7 1/2' in t, f'helper: rectangle {t[:90]!r}')
        t = await helper('tri', '8', '5'); check('= 20' in t or 'Area = 20' in t, f'helper: triangle {t[:90]!r}')
        t = await helper('trap', '4', '10', '6'); check('Area = 42' in t, f'helper: trapezoid {t[:90]!r}')
        t = await helper('rect', 'x', '2'); check('Use whole numbers' in t, 'helper explains bad input')

        # ---- typed answers: each question's answer is worked out here from what is shown on screen ----
        async def type_check(tool, text):
            await pg.fill(f'#tab-{tool} input[aria-label="Your answer"]', text); await pg.click(f'#tab-{tool} form button'); await pg.wait_for_timeout(60)
            return await pg.inner_text(f'#tab-{tool} .err')
        FACT = {('foot', 'inches'): 12, ('foot', 'inch'): 12, ('feet', 'inches'): 12, ('yard', 'feet'): 3, ('yards', 'feet'): 3, ('yard', 'inches'): 36, ('yards', 'inches'): 36,
                ('pound', 'ounces'): 16, ('pounds', 'ounces'): 16, ('gallon', 'quarts'): 4, ('gallons', 'quarts'): 4, ('quart', 'pints'): 2, ('quarts', 'pints'): 2, ('pint', 'cups'): 2, ('pints', 'cups'): 2,
                ('gallon', 'cups'): 16, ('gallons', 'cups'): 16, ('hour', 'minutes'): 60, ('hours', 'minutes'): 60, ('minute', 'seconds'): 60, ('minutes', 'seconds'): 60, ('day', 'hours'): 24, ('days', 'hours'): 24,
                ('week', 'days'): 7, ('weeks', 'days'): 7, ('year', 'months'): 12, ('years', 'months'): 12}
        BIG = {k[0] for k in FACT}
        async def solve(tool):
            hh = await pg.inner_html(f'#tab-{tool} .qtext'); text = re.sub(r'<svg.*?</svg>', ' ', hh, flags=re.S); text = re.sub(r'<[^>]+>', ' ', text); text = re.sub(r'\s+', ' ', text)
            labels = [re.sub(r'<[^>]+>', '', t) for t in re.findall(r'<text[^>]*>(.*?)</text>', hh)]
            def num(t):
                t = t.strip(); m = re.match(r'^(\d+) (\d+)/(\d+)$', t)
                return Fraction(int(m[1])) + Fraction(int(m[2]), int(m[3])) if m else Fraction(t)
            board = re.search(r'(\w+) long\. How many (\w+)', text)
            if board: return values(hh)[0] * FACT[(board[1], board[2])]
            conv = re.search(r'= \? (\w+)', text)
            if conv and 'area' not in text:
                v = values(hh)[0]; m = re.search(r'\? ?.*?(\w+) = \?', text) ; unit_from = re.findall(r'([a-z]+) = \?', text)[0]
                f = FACT.get((unit_from, conv[1]))
                return v * f if f else v / FACT[(conv[1], unit_from)]
            ar = (re.search(r'aria-label="([^"]*)"', hh) or [None, 'NONE ' + text])[1]
            if ar.startswith('A rectangle') and 'cut out' not in ar and 'triangle' not in ar: return num(labels[0]) * num(labels[1])
            if 'triangle' in ar and 'on top' not in ar: return Fraction(1, 2) * num(labels[0]) * num(labels[1])
            if 'trapezoid' in ar: return (num(labels[0]) + num(labels[1])) / 2 * num(labels[2])
            if ar.startswith('An L-shaped'):
                a, W, H, b = [int(x) for x in labels]; return Fraction(W * H - (W - a) * (H - b))
            if 'cut out' in ar:
                W = int(labels[0].split()[0]); H = int(labels[1]); w, h = [int(x) for x in labels[2].split(' by ')]; return Fraction(W * H - w * h)
            w, h, t = [int(x) for x in labels]; return Fraction(w * h) + Fraction(w * t, 2)
        for tool in ['units', 'time', 'rect', 'triangle', 'trapezoid', 'composite', 'review']:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext')
            check(await pg.locator(f'#tab-{tool} .qtext .mfig').count() == (0 if tool in ('units', 'time') else 1) or tool == 'review', f'{tool}: figure shown when expected')
            msg = await type_check(tool, 'abc'); check('Type a fraction' in msg, f'{tool}: nonsense gets a hint ({msg!r})')
            for k in range(10):
                want = await solve(tool)
                if k == 0 and want.denominator > 1:
                    msg = await type_check(tool, f'{want.numerator * 2}/{want.denominator * 2}'); check('simplest form' in msg, f'{tool}: unreduced answer nudged ({msg!r})')
                msg = await type_check(tool, write(want)); check(msg.startswith('Correct'), f'{tool}: {write(want)} accepted ({msg!r})')
                await pg.click(f'#tab-{tool} [data-a="next"]'); await pg.wait_for_timeout(40)
            check('10 out of 10' in await pg.inner_text(f'#tab-{tool} .result'), f'{tool}: a full round scores')
        await pg.goto(MOD + '?tool=trapezoid'); await pg.wait_for_selector('#tab-trapezoid .qtext')
        await type_check('trapezoid', '99/100'); msg = await type_check('trapezoid', '99/100'); check(msg.startswith('The answer is'), f'two misses show the answer ({msg!r})')

        # ---- layout ----
        for tool in TOOLS:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(120)
            ov = await overflow(pg)
            if tool == 'guide': check(ov['h'] <= 0, f'{tool}: no sideways scroll at 1440x900 {ov}')
            else: check(ov['v'] <= 0 and ov['h'] <= 0, f'{tool}: no scroll bars at 1440x900 {ov}')
        for tl in ('triangle', 'trapezoid', 'composite'):
            await pg.goto(MOD + '?tool=' + tl); await pg.wait_for_selector(f'#tab-{tl} .mfig'); await pg.screenshot(path=f'/tmp/mea_{tl}.png')
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .rule'); await pg.screenshot(path='/tmp/mea_guide.png', full_page=True)
        for extra in ('', 'dys'):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            for tool in TOOLS:
                await q.goto(MOD + '?tool=' + tool); await q.wait_for_selector(f'#tab-{tool} h2')
                if extra: await q.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await q.wait_for_timeout(150)
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{tool}: no sideways scroll at 360px {extra} ({ov})')
                if tool in ('triangle', 'composite') and not extra: await q.screenshot(path=f'/tmp/mea_360_{tool}.png')
            await m.close()
        await pg.goto(MOD + '?tool=triangle'); await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()"); await pg.wait_for_selector('#tab-triangle .mfig'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/mea_triangle_dark.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
