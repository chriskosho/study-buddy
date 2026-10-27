"""Add and Subtract Fractions module (Dimensions Math 5, chapter 4): registry, study guide and helper, every tool, typed
fraction answers, models, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/fractions_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from fractions import Fraction
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8787
BASE = f'http://127.0.0.1:{PORT}/'
MOD = BASE + 'modules/math/fractions-add-sub/index.html'
TOOLS = ['guide', 'division', 'models', 'improper', 'unlike', 'mixedadd', 'mixedsub', 'words', 'review']
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""

def values(html):
    """the numbers shown in a question, in order, and the operators between them"""
    out = []
    for m in re.finditer(r'<span class="mixed" data-w="(\d+)"><b>\d+</b><span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="frac" data-n="(\d+)" data-d="(\d+)">|<span class="num" data-w="(\d+)">', html):
        out.append(Fraction(int(m[1])) + Fraction(int(m[2]), int(m[3])) if m[1] else Fraction(int(m[4]), int(m[5])) if m[4] else Fraction(int(m[6])))
    return out
def solve(html):
    vals = values(html); text = re.sub(r'<[^>]+>', ' ', html); ops = re.findall(r'[+−]', text.split('?')[0] if '?' in text else text)
    tot = vals[0]
    for op, v in zip(ops, vals[1:]): tot = tot + v if op == '+' else tot - v
    return tot
def write(v, mixed=True):
    v = Fraction(v)
    if v.denominator == 1: return str(v.numerator)
    w = v.numerator // v.denominator
    return (f'{w} {v.numerator - w * v.denominator}/{v.denominator}' if w and mixed else f'{v.numerator}/{v.denominator}')
async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- registry ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'fractions-add-sub').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['math:guide/easy,division/easy,models/easy,improper/easy,unlike/medium,mixedadd/medium,mixedsub/hard,words/hard,review/insane'], f'registry entry {reg}')

        # ---- study guide and helper ----
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .fgout')
        check(await pg.locator('#tab-guide .rule').count() == 6, 'six worked-example cards')
        check(await pg.locator('#tab-guide .fbar').count() >= 4, 'the guide shows bar models')
        cards = await pg.eval_on_selector_all('#tab-guide .rule', "els => els.map(e => [...e.querySelectorAll('.frac')].map(f => f.dataset.n + '/' + f.dataset.d).join(' '))")
        check('3/6 2/6' in cards[1] and '9/12 2/12' in cards[2] and '6/8 3/4' in cards[3] and '4/12 3/12' in cards[4] and '3/12 8/12' in cards[5], f'the guide shows the unreduced steps {cards}')
        out = await pg.inner_text('#tab-guide .fgout')
        check('5/6' in out.replace('\n', '') or '56' in out.replace('\n', ''), f'helper starts with 1/2 + 1/3 = 5/6: {out[:60]!r}')
        async def helper(a, op, c):
            ins = pg.locator('#tab-guide .fgform .textin'); await ins.nth(0).fill(a); await ins.nth(1).fill(c); await pg.select_option('#tab-guide .fgform select', op); await pg.click('#tab-guide .fgform button'); return (await pg.inner_text('#tab-guide .fgout')).replace('\n', ' ')
        t = await helper('2 1/3', '+', '1 3/4'); check('4 1/12' in t, f'helper adds mixed numbers: {t[-90:]!r}')
        t = await helper('4 1/4', '-', '1 2/3'); check('2 7/12' in t and 'rename' in t, f'helper subtracts with renaming: {t[-110:]!r}')
        t = await helper('1/4', '-', '1/2'); check('at least as big' in t, 'helper refuses a negative answer')
        t = await helper('abc', '+', '1/2'); check('Use fractions' in t, 'helper explains bad input')
        t = await helper('7/4', '+', '3/8'); check('17/8' in t and '2 1/8' in t, f'helper handles improper fractions: {t[:70]!r}')

        # ---- the answer tools: type the right answer, in different forms ----
        async def qhtml(pg, tool): return await pg.inner_html(f'#tab-{tool} .qtext')
        async def type_check(pg, tool, text):
            await pg.fill(f'#tab-{tool} input[aria-label="Your answer"]', text); await pg.click(f'#tab-{tool} form button'); await pg.wait_for_timeout(60)
            return await pg.inner_text(f'#tab-{tool} .err')
        for tool in ['unlike', 'mixedadd', 'mixedsub', 'review']:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .qtext')
            hh = await qhtml(pg, tool)
            if tool == 'review' and ('<b>?</b>' in hh): continue
            check(await pg.locator(f'#tab-{tool} .qtext .frac').count() >= 2, f'{tool}: fractions are drawn stacked')
            msg = await type_check(pg, tool, 'abc'); check('Type a fraction' in msg, f'{tool}: typing nonsense gets a hint, not a try ({msg!r})')
        # the unlike tool in detail
        await pg.goto(MOD + '?tool=unlike'); await pg.wait_for_selector('#tab-unlike .qtext')
        for round_ in range(10):
            hh = await qhtml(pg, 'unlike'); want = solve(hh)
            if round_ == 0:
                un = f'{want.numerator * 2}/{want.denominator * 2}' if want.denominator > 1 else '0'
                msg = await type_check(pg, 'unlike', un); check('simplest form' in msg, f'unreduced right amount gets a nudge ({msg!r})')
                check(await pg.locator('#tab-unlike [data-a="next"]').is_hidden(), 'the nudge does not end the question')
                msg = await type_check(pg, 'unlike', '99/100'); check(msg.startswith('Not quite'), f'a wrong answer says not quite ({msg!r})')
                msg = await type_check(pg, 'unlike', write(want)); check(msg.startswith('Correct'), f'the simplest form is accepted on the second try ({msg!r})')
                check('The common denominator' in await pg.inner_text('#tab-unlike .why') or 'denominators are the same' in await pg.inner_text('#tab-unlike .why'), 'the explanation shows the common denominator')
            elif round_ == 1:
                msg = await type_check(pg, 'unlike', write(want, mixed=False)); check(msg.startswith('Correct'), f'improper form is accepted when either form is fine: {write(want, False)} ({msg!r})')
            else:
                await type_check(pg, 'unlike', write(want))
            await pg.click('#tab-unlike [data-a="next"]'); await pg.wait_for_timeout(40)
            if round_ == 9: break
        check('10 out of 10' in await pg.inner_text('#tab-unlike .result') or '9 out of 10' in await pg.inner_text('#tab-unlike .result'), 'a full round of typed answers scores')

        # improper tool: the asked form is enforced
        await pg.goto(MOD + '?tool=improper'); await pg.wait_for_selector('#tab-improper .qtext')
        seen_m = seen_i = False
        for _ in range(40):
            hh = await qhtml(pg, 'improper'); txt = re.sub(r'<[^>]+>', ' ', hh); v = values(hh)[0]
            if 'as a mixed number' in txt and not seen_m:
                msg = await type_check(pg, 'improper', write(v, mixed=False)); check('mixed number' in msg, f'asked for a mixed number, an improper fraction gets a nudge ({msg!r})'); seen_m = True
            elif 'improper fraction' in txt and not seen_i:
                msg = await type_check(pg, 'improper', write(v, mixed=True)); check('improper fraction' in msg, f'asked for an improper fraction, a mixed number gets a nudge ({msg!r})'); seen_i = True
            await pg.fill('#tab-improper input[aria-label="Your answer"]', write(v, mixed='as a mixed number' in txt)); await pg.click('#tab-improper form button')
            if await pg.locator('#tab-improper [data-a="next"]').is_visible(): await pg.click('#tab-improper [data-a="next"]')
            if seen_m and seen_i: break
        check(seen_m and seen_i, 'both improper and mixed questions came up')

        # division tool: wrong twice reveals the answer
        await pg.goto(MOD + '?tool=division'); await pg.wait_for_selector('#tab-division .qtext')
        await type_check(pg, 'division', '0/9'); msg = await type_check(pg, 'division', '0/9')
        check(msg.startswith('The answer is'), f'two misses show the answer ({msg!r})')

        # models: pictures, four choices, the right one is the sum
        await pg.goto(MOD + '?tool=models'); await pg.wait_for_selector('#tab-models .opt')
        check(await pg.locator('#tab-models .fbar').count() == 2 and await pg.locator('#tab-models .opt').count() == 4, 'models: two bars and four choices')
        for k in range(10):
            hh = await pg.inner_html('#tab-models .qtext'); v = values(hh); op = '+' if '+' in re.sub(r'<[^>]+>', ' ', hh) else '-'
            want = write(v[0] + v[1] if op == '+' else v[0] - v[1])
            await pg.click(f'#tab-models .opt[data-v="{want}"]'); await pg.click('#tab-models [data-a="next"]')
        check('10 out of 10' in await pg.inner_text('#tab-models .result'), 'models: solving from the pictures scores 10 of 10')

        # words tool reads like a story
        await pg.goto(MOD + '?tool=words'); await pg.wait_for_selector('#tab-words .qtext')
        check(len(await pg.inner_text('#tab-words .qtext')) > 60, 'word problems are full sentences')

        # ---- layout: every tool, desktop, phone, with the dyslexic font and larger text ----
        for tool in TOOLS:
            await pg.goto(MOD + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(120)
            ov = await overflow(pg)
            if tool == 'guide': check(ov['h'] <= 0, f'{tool}: no sideways scroll at 1440x900 {ov}')
            else: check(ov['v'] <= 0 and ov['h'] <= 0, f'{tool}: no scroll bars at 1440x900 {ov}')
        await pg.goto(MOD + '?tool=models'); await pg.wait_for_selector('#tab-models .opt'); await pg.screenshot(path='/tmp/frac_models.png')
        await pg.goto(MOD + '?tool=unlike'); await pg.wait_for_selector('#tab-unlike .qtext'); await pg.screenshot(path='/tmp/frac_unlike.png')
        await pg.goto(MOD + '?tool=guide'); await pg.wait_for_selector('#tab-guide .rule'); await pg.screenshot(path='/tmp/frac_guide.png', full_page=True)
        for extra in ('', 'dys'):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block'); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            for tool in TOOLS:
                await q.goto(MOD + '?tool=' + tool); await q.wait_for_selector(f'#tab-{tool} h2')
                if extra: await q.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await q.wait_for_timeout(150)
                ov = await q.evaluate("document.documentElement.scrollWidth - innerWidth")
                check(ov <= 0, f'{tool}: no sideways scroll at 360px {extra} ({ov})')
                if tool in ('models', 'unlike', 'guide') and not extra: await q.screenshot(path=f'/tmp/frac_360_{tool}.png')
            await m.close()
        # dark mode: toast-free, but the bars and fractions use theme colors
        await pg.goto(MOD + '?tool=models'); await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()"); await pg.wait_for_selector('#tab-models .fbar'); await pg.wait_for_timeout(900); await pg.screenshot(path='/tmp/frac_models_dark.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
