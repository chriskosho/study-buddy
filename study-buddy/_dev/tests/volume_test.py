"""Volume of Solid Figures module (Dimensions Math 5, chapter 8): registry, guide and helper, typed answers, area model,
sort, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/volume_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from fractions import Fraction
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8781
BASE = f'http://127.0.0.1:{PORT}/'
MOD = BASE + 'modules/math/volume/index.html'
TOOLS = ['guide', 'cubes', 'stacks', 'formula', 'capacity', 'words', 'compare', 'compound', 'review']
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
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'volume').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['math:guide/easy,cubes/easy,stacks/easy,formula/medium,capacity/medium,words/hard,compare/hard,compound/hard,review/insane'], f'registry entry {reg}')

        # ---- guide and helper ----
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .fgout')
        check(await pg.locator('#tab-guide .rule').count() == 7, 'seven worked-example cards')
        async def helper(a, b, c):
            ins = pg.locator('#tab-guide .fgform .textin'); await ins.nth(0).fill(a); await ins.nth(1).fill(b); await ins.nth(2).fill(c); await pg.click('#tab-guide .fgform button'); return (await pg.inner_text('#tab-guide .fgout')).replace('\n', ' ')
        t = await helper('5', '4', '3'); check('Volume = 60' in t and '60 milliliters' in t, f'helper: 5 x 4 x 3 {t[:140]!r}')
        t = await helper('10', '10', '15'); check('1 1/2 liters' in t or '3/2 liters' in t, f'helper: liters {t[-100:]!r}')
        t = await helper('x', '2', '2'); check('whole numbers' in t, 'helper explains bad input')

        # ---- typed answers: each question's answer is worked out here from what is shown on screen ----
        async def type_check(tool, text):
            await pg.fill(f'#tab-{tool} input[aria-label="Your answer"]', text); await pg.click(f'#tab-{tool} form button'); await pg.wait_for_timeout(60)
            return await pg.inner_text(f'#tab-{tool} .err')
        async def solve(tool):
            hh = await pg.inner_html(f'#tab-{tool} .qtext'); text = re.sub(r'<svg.*?</svg>', ' ', hh, flags=re.S); text = re.sub(r'<[^>]+>', ' ', text); text = re.sub(r'\s+', ' ', text)
            nums = [int(x) for x in re.findall(r'\d+', text.replace(',', ''))]
            svgs = [(int(m[1]), int(m[2]), int(m[3])) for m in re.finditer(r'<svg class="vfig(?: big)?" data-l="(\d+)" data-w="(\d+)" data-h="(\d+)"', hh)]
            labels = [re.sub(r'<[^>]+>', '', t) for t in re.findall(r'<text[^>]*>(.*?)</text>', hh)]
            cells = re.search(r'data-cells="([^"]*)"', hh)
            if cells: return Fraction(sum(int(x) for x in re.split('[;,]', cells[1])))
            if 'Every small cube' in text: l, w, h = svgs[0]; return Fraction(l * w * h)
            if 'Box A' in ' '.join(labels) or 'Part A' in ' '.join(labels) or 'Whole box' in ' '.join(labels):
                (l1, w1, h1), (l2, w2, h2) = svgs; va, vb = l1 * w1 * h1, l2 * w2 * h2
                return Fraction(abs(va - vb) if 'Box A' in ' '.join(labels) else va + vb if 'Part A' in ' '.join(labels) else va - vb)
            if 'How many milliliters does the full container' in text: l, w, h = svgs[0]; return Fraction(l * w * h)
            if 'How many liters does the full container' in text: l, w, h = svgs[0]; return Fraction(l * w * h, 1000)
            if 'How tall is the tank' in text: L, l, w = nums[0], nums[1], nums[2]; return Fraction(L * 1000, l * w)
            if 'water jug' in text: return Fraction(nums[0] * 1000 + (500 if '1/2' in text else 0))
            if 'milliliters of juice' in text: return Fraction(nums[0], 1000)
            if 'What is the volume of the cube' in text or 'volume of the box in' in text:
                vals = [int(x.split()[0]) for x in labels if x.split()[0].isdigit()]
                return Fraction(vals[0] * vals[1] * vals[2])
            if 'The volume of the box is' in text:
                known = [int(x.split()[0]) for x in labels if x.split()[0].isdigit()]; return Fraction(nums[0], known[0] * known[1])
            if 'packs 1-centimeter cubes' in text: return Fraction(nums[1] * nums[2] * nums[3])
            if 'fish tank' in text: return Fraction(nums[0] * nums[1] * nums[3])
            if 'stacks' in text and 'Each cube has edges' in text: return Fraction(nums[0] * nums[1] ** 3)
            if 'swimming pool' in text: return Fraction(nums[2], nums[0] * nums[1])
            if 'identical boxes' in text: return Fraction(nums[0] * nums[1] * nums[2] * nums[3])
            raise Exception('unknown question: ' + text)
        for tool in ['cubes', 'stacks', 'formula', 'capacity', 'words', 'compare', 'compound', 'review']:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext')
            msg = await type_check(tool, 'abc'); check('Type a fraction' in msg, f'{tool}: nonsense gets a hint ({msg!r})')
            for k in range(10):
                want = await solve(tool)
                if k == 0 and want.denominator > 1:
                    msg = await type_check(tool, f'{want.numerator * 2}/{want.denominator * 2}'); check('simplest form' in msg, f'{tool}: unreduced answer nudged ({msg!r})')
                msg = await type_check(tool, write(want)); check(msg.startswith('Correct'), f'{tool}: {write(want)} accepted ({msg!r})')
                await pg.click(f'#tab-{tool} [data-a="next"]'); await pg.wait_for_timeout(40)
            check('10 out of 10' in await pg.inner_text(f'#tab-{tool} .result'), f'{tool}: a full round scores')
        await pg.goto(MOD + '?tool=compare'); await pg.wait_for_selector('#tab-compare .qtext')
        await type_check('compare', '99999'); msg = await type_check('compare', '99999'); check(msg.startswith('The answer is'), f'two misses show the answer ({msg!r})')

        # ---- layout ----
        for tool in TOOLS:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(120)
            ov = await overflow(pg)
            if tool == 'guide': check(ov['h'] <= 0, f'{tool}: no sideways scroll at 1440x900 {ov}')
            else: check(ov['v'] <= 0 and ov['h'] <= 0, f'{tool}: no scroll bars at 1440x900 {ov}')
        for tool in ('cubes', 'compare', 'compound', 'capacity'):   # the figure sizes change with the question: check many
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext'); worst = 0
            for k in range(10):
                ov = await overflow(pg); worst = max(worst, ov['v']); want = await solve(tool); await type_check(tool, write(want)); await pg.click(f'#tab-{tool} [data-a="next"]'); await pg.wait_for_timeout(40)
            check(worst <= 0, f'{tool}: no scroll bars on any of 10 questions (worst {worst})')
        for tl in ('cubes', 'compare', 'compound'):
            await pg.goto(MOD + '?tool=' + tl); await pg.wait_for_selector(f"#tab-{tl} .vfig"); await pg.screenshot(path=f'/tmp/vol_{tl}.png')
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .rule'); await pg.screenshot(path='/tmp/vol_guide.png', full_page=True)
        for extra in ('', 'dys'):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            for tool in TOOLS:
                await q.goto(MOD + '?tool=' + tool); await q.wait_for_selector(f'#tab-{tool} h2')
                if extra: await q.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await q.wait_for_timeout(150)
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{tool}: no sideways scroll at 360px {extra} ({ov})')
                if tool in ('cubes', 'compare') and not extra: await q.screenshot(path=f'/tmp/vol_360_{tool}.png')
            await m.close()
        await pg.goto(MOD + '?tool=compare'); await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()"); await pg.wait_for_selector('#tab-compare .vfig'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/vol_compare_dark.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
