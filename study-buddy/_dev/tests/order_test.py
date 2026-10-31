"""Order of Operations test (Playwright + Chromium).
Plays every tool (typed answers worked out from the question with an independent evaluator, multiple choice by clicking), checks the
study guide helper (right answers, kind error messages), the Quiz One of each, and layout: 1440x900 with no scroll on the practice tools,
360px phone and 915x412 landscape phone with no sideways scroll. The generators are checked in bulk by math_gen_check.mjs.
Run:  python3 study-buddy/_dev/tests/order_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/order-of-operations/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
# an independent evaluator (recursive descent, exact integers) so the test does not trust the module's own stepper
EVAL = """(s) => { const t = s.replace(/,/g,'').match(/\\d+|[+−×÷()\\[\\]{}]/g); let i = 0;
  const num = () => { const x = t[i++]; if ('([{'.includes(x)) { const v = expr(); i++; return v; } return Number(x); };
  const term = () => { let v = num(); while (t[i] === '×' || t[i] === '÷') { const o = t[i++], b = num(); if (o === '÷' && v % b) throw 'inexact'; v = o === '×' ? v * b : v / b; } return v; };
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '−') { const o = t[i++], b = term(); v = o === '+' ? v + b : v - b; } return v; };
  return expr(); }"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'sw.js' not in m.text and errors.append(m.text))

        await pg.goto(base + 'index.html#/home/math'); await pg.wait_for_selector('a.mod')
        check('Order of Operations' in await pg.inner_text('body'), 'Math lists Order of Operations')

        # ---- typed tools ----
        for tool in ['plain', 'parens', 'nested', 'braces']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} input')
                q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).replace('Work it out:', '').strip()
                v = await pg.evaluate(EVAL, q)
                if i == 0 and tool == 'braces': check(sum(q.count(c) for c in '({[') == 3, f'braces has three layers: {q}')
                if i == 0 and tool == 'nested': check('[' in q and '(' in q and '{' not in q, f'nested has brackets and parentheses: {q}')
                if i == 0 and tool == 'plain': check(not any(c in q for c in '([{'), f'plain has no grouping symbols: {q}')
                await pg.fill(f'#tab-{tool} input', str(v)); await pg.click(f'#tab-{tool} form button')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            rec = await pg.evaluate(f"SB.toolRecord('order-of-operations','{tool}')")
            check(rec and rec['best'] == 10, f'{tool}: 10 of 10 with answers worked out independently {rec}')

        # ---- multiple choice tools ----
        for tool in ['first', 'next', 'words', 'fit']:
            await pg.goto(base + M + '?tool=' + tool)
            for i in range(10):
                await pg.wait_for_selector(f'#tab-{tool} .opt'); await pg.locator(f'#tab-{tool} .opt').first.click()
                if i < 3: check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer')
                await pg.click(f'#tab-{tool} [data-a="next"]')
            check(bool(await pg.evaluate(f"SB.toolRecord('order-of-operations','{tool}')")), f'{tool}: round recorded')

        # ---- study guide helper ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.ooform')
        async def helper(text):
            await pg.fill('.ooform input', text); await pg.click('.ooform button')
            steps = await pg.locator('.oosteps .st').all_inner_texts(); err = await pg.locator('.ooerr').inner_text()
            return steps, err
        for text, want in [('24 ÷ 4 × 3', '18'), ('20 - 5 + 3', '18'), ('3 + 4 * 5', '23'), ('(3 + 4) x 5', '35'), ('{6 + [18 ÷ (5 − 2)]} × 2', '24'), ('2 × [3 + (4 × 5)]', '46')]:
            steps, err = await helper(text)
            check(steps and steps[-1] == want and not err, f'helper: {text} = {want} ({steps[-1:] if steps else err})')
        steps, err = await helper('24 ÷ 4 × 3'); check(steps == ['24 ÷ 4 × 3', '6 × 3', '18'], f'helper goes left to right {steps}')
        for text, frag in [('2(3 + 4)', 'Put ×'), ('5 ÷ 2', 'even'), ('3 + ', 'ends too soon'), ('(3 + 4', 'not closed'), ('3.5 + 1', 'whole numbers'), ('', 'Type an expression'), ('3 + a', 'do not know')]:
            steps, err = await helper(text)
            check(not steps and frag in err, f'helper says something kind for "{text}": {err}')
        sc = await pg.evaluate("document.fonts.ready.then(() => document.documentElement.scrollWidth - innerWidth)")
        check(sc <= 0, 'guide has no sideways scroll at 1440')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        check(len(labels) == 2 and labels[1].startswith('One of each (10)'), f'Random and One of each (10) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt, #tab-quiz input'); 
            if await pg.locator('#tab-quiz .opt').count(): await pg.locator('#tab-quiz .opt').first.click()
            else:
                q = (await pg.locator('#tab-quiz .qtext').inner_text()).replace('Work it out:', '').strip(); await pg.fill('#tab-quiz input', str(await pg.evaluate(EVAL, q))); await pg.click('#tab-quiz form button')
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after ten problems')

        # ---- layout ----
        tools = ['cards', 'first', 'plain', 'next', 'parens', 'nested', 'words', 'braces', 'fit', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .panel, #tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.oosteps')
        o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at 360 ({o["h"]})')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
