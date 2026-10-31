"""Telling Time and Elapsed Time test (Playwright + Chromium).
Plays every tool with answers worked out independently (clock hands read back from the SVG, times and spans read from the question text),
checks the study guide clock, the Quiz One of each, and layout: 1440x900 with no scroll on the practice tools, 360px phone and 915x412
landscape phone with no sideways scroll. The generators are checked in bulk by gen_check_time.mjs.
Run:  python3 study-buddy/_dev/tests/time_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
M = 'modules/math/time/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve(): http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever()
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """
localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Eli',color:'#e4572e'}],active:'k1',pin:null}));
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""
# read a clock from the hand angles in its SVG (not from the generator): returns "h:mm"
READ = """(svg) => { const ang = c => { const l = svg.querySelector('.' + c); const d = Math.atan2(+l.getAttribute('x2') - 100, 100 - +l.getAttribute('y2')) * 180 / Math.PI; return (d + 360) % 360; };
  const mA = ang('mh'), hA = ang('hh'), mi = Math.round(mA / 6) % 60; let h = Math.round((hA - mi * 0.5) / 30) % 12; if (h === 0) h = 12;
  return h + ':' + String(mi).padStart(2, '0'); }"""
T = r'(\d{1,2}):(\d{2}) (a\.m\.|p\.m\.)'
def absm(h, m, ap): return ((int(h) % 12) + (12 if ap == 'p.m.' else 0)) * 60 + int(m)
def ct(a): return f"{(a // 60 % 12) or 12}:{a % 60:02d}"
def ft(a): return f"{ct(a)} {'a.m.' if a < 720 else 'p.m.'}"
def dur(s):
    h = re.search(r'(\d+) hours?', s); m = re.search(r'(\d+) minutes?', s)
    return (int(h.group(1)) * 60 if h else 0) + (int(m.group(1)) if m else 0)
def dtext(d):
    H, M = divmod(d, 60); p = lambda n, w: f"{n} {w}{'' if n == 1 else 's'}"
    return p(M, 'minute') if not H else (f"{p(H, 'hour')} {p(M, 'minute')}" if M else p(H, 'hour'))
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
        check('Telling Time and Elapsed Time' in await pg.inner_text('body'), 'Math lists Telling Time and Elapsed Time')

        async def mc_click(tool, text):
            await pg.locator(f'#tab-{tool} .opt').filter(has_text=text).first.click()
        async def finish(tool, i):
            if i < 3: check(await pg.locator(f'#tab-{tool} .opt.right').count() == 1, f'{tool} q{i + 1}: exactly one right answer') if await pg.locator(f'#tab-{tool} .opt').count() else None
            await pg.click(f'#tab-{tool} [data-a="next"]')

        # ---- read the clock: typed, three ways of typing ----
        tool = 'read'; await pg.goto(base + M + '?tool=' + tool)
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} input')
            t = await pg.evaluate(READ, await pg.locator(f'#tab-{tool} svg.tmclk').element_handle())
            check(await pg.locator(f'#tab-{tool} svg.tmclk').count() == 1, 'read shows one clock') if i == 0 else None
            label = await pg.locator(f'#tab-{tool} svg.tmclk').get_attribute('aria-label'); 
            if i == 0: check(not re.search(r'\d:\d\d', label or ''), f'clock label does not give the time away ({label})')
            typed = [t, t.replace(':', ''), t.replace(':', ' ')][i % 3]
            await pg.fill(f'#tab-{tool} input', typed); await pg.click(f'#tab-{tool} form button')
            await pg.click(f'#tab-{tool} [data-a="next"]')
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'read: 10 of 10 typing 4:35, 435 and 4 35 {rec}')

        # ---- pick the clock ----
        tool = 'pick'; await pg.goto(base + M + '?tool=' + tool)
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} .opt')
            q = await pg.locator(f'#tab-{tool} .qtext').inner_text(); target = re.search(r'shows (\d{1,2}:\d{2})', q).group(1)
            clocks = pg.locator(f'#tab-{tool} svg.tmclk'); n = await clocks.count()
            shown = [await pg.evaluate(READ, await clocks.nth(k).element_handle()) for k in range(n)]
            if i == 0: check(n == 4 and len(set(shown)) == 4, f'pick shows four different clocks {shown}')
            check(shown.count(target) == 1, f'pick q{i + 1}: exactly one clock shows {target}') if i < 3 else None
            await mc_click(tool, re.compile('^\\s*' + 'ABCD'[shown.index(target)] + '\\s*$')); await finish(tool, i)
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'pick: 10 of 10 {rec}')

        # ---- a.m. or p.m. (events from the question, window from the module's own event table, checked against the rule of sense) ----
        tool = 'ampm'; await pg.goto(base + M + '?tool=' + tool)
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} .opt')
            q = await pg.locator(f'#tab-{tool} .qtext').inner_text(); ev = q.split('?')[-1].strip() or q.split('\n')[-1].strip()
            win = await pg.evaluate("(t) => TIMEGEN.EVENTS.find(e => t.includes(e.t))", q)
            opts = await pg.locator(f'#tab-{tool} .opt').all_inner_texts(); good = []
            for k, o in enumerate(opts):
                m = re.search(T, o)
                if m and win['lo'] <= absm(*m.groups()) <= win['hi']: good.append(k)
            check(len(good) == 1, f'ampm q{i + 1}: one time fits the event ({q[:50]})') if i < 3 else None
            await pg.locator(f'#tab-{tool} .opt').nth(good[0] if good else 0).click(); await finish(tool, i)
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'ampm: 10 of 10 {rec}')

        # ---- elapsed time (minutes, and hours and minutes) ----
        tool = 'elapsed'; await pg.goto(base + M + '?tool=' + tool); seen = set()
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} .opt')
            q = await pg.locator(f'#tab-{tool}').inner_text()
            m = re.search(r'from ' + T + ' to ' + T, q)
            d = absm(*m.groups()[3:6]) - absm(*m.groups()[0:3]); seen.add('minutes' if 'How many minutes' in q else 'hm')
            want = f'{d} minutes' if 'How many minutes' in q else dtext(d)
            check(d > 0 and (absm(*m.groups()[0:3]) < 720) == (absm(*m.groups()[3:6]) < 720), f'elapsed q{i + 1}: same a.m./p.m. period') if i < 3 else None
            await mc_click(tool, re.compile('^\\s*' + re.escape(want) + '\\s*$')); await finish(tool, i)
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'elapsed: 10 of 10 ({sorted(seen)}) {rec}')
        check(await pg.locator(f'#tab-{tool} svg.tmline').count() >= 0, 'elapsed ran')

        # ---- what time will it be: typed ----
        tool = 'later'; await pg.goto(base + M + '?tool=' + tool)
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} input')
            q = await pg.locator(f'#tab-{tool} .qtext').inner_text()
            m = re.search(r'It is ' + T + r'\s*What time (will it be|was it) (?:in )?(.+?)(?: ago)?\?', q.replace('\n', ' '))
            s = absm(*m.groups()[0:3]); d = dur(m.group(5)); r = s - d if m.group(4) == 'was it' else s + d
            await pg.fill(f'#tab-{tool} input', [ct(r), ct(r).replace(':', '')][i % 2]); await pg.click(f'#tab-{tool} form button')
            await pg.click(f'#tab-{tool} [data-a="next"]')
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'later: 10 of 10 with answers worked out independently {rec}')

        # ---- word problems ----
        tool = 'words'; await pg.goto(base + M + '?tool=' + tool); kinds = set()
        for i in range(10):
            await pg.wait_for_selector(f'#tab-{tool} .opt')
            q = (await pg.locator(f'#tab-{tool} .qtext').inner_text()).replace('\n', ' ')
            if (m := re.search(T + ' and ends at ' + T + r' How many minutes', q)): want = f"{absm(*m.groups()[3:6]) - absm(*m.groups()[0:3])} minutes"; kinds.add('mins')
            elif (m := re.search(T + ' and ends at ' + T + r' How long', q)): want = dtext(absm(*m.groups()[3:6]) - absm(*m.groups()[0:3])); kinds.add('hm')
            elif (m := re.search(r'starts at ' + T + r' and lasts (.+?)\. What time does it end', q)): want = ft(absm(*m.groups()[0:3]) + dur(m.group(4))); kinds.add('end')
            elif (m := re.search(r'ends at ' + T + r' and lasts (.+?)\. What time did it start', q)): want = ft(absm(*m.groups()[0:3]) - dur(m.group(4))); kinds.add('start')
            else: check(False, f'words: unknown question {q}'); want = ''
            await mc_click(tool, re.compile('^\\s*' + re.escape(want) + '\\s*$')); await finish(tool, i)
        rec = await pg.evaluate(f"SB.toolRecord('time','{tool}')")
        check(rec and rec['best'] == 10, f'words: 10 of 10 ({sorted(kinds)}) {rec}')

        # ---- study guide: the clock set by typing and by buttons ----
        await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.tmform')
        async def shown():
            return (await pg.inner_text('#tmgDig'), await pg.inner_text('#tmgWords'), await pg.evaluate(READ, await pg.locator('#tmgClock svg').element_handle()))
        check(await shown() == ('4:35', 'twenty-five minutes to five', '4:35'), f'guide starts at 4:35 {await shown()}')
        for text, dig, words in [('9:00', '9:00', "nine o'clock"), ('7:15', '7:15', 'quarter past seven'), ('12:30', '12:30', 'half past twelve'), ('6 45', '6:45', 'quarter to seven'), ('1050', '10:50', 'ten minutes to eleven'), ('3:07', '3:07', 'seven minutes past three')]:
            await pg.fill('.tmform input', text); await pg.click('.tmform button')
            check(await shown() == (dig, words, dig), f'guide: {text} -> {dig}, "{words}", hands agree {await shown()}')
        for text in ['13:00', '4:75', 'noon', '']:
            await pg.fill('.tmform input', text); await pg.click('.tmform button')
            check('Type a time' in await pg.inner_text('.derr'), f'guide says something kind for "{text}"')
        await pg.fill('.tmform input', '11:58'); await pg.click('.tmform button')
        await pg.click('[data-d="m+5"]'); check((await shown())[0] == '12:03', f'+5 minutes goes over the hour: {await shown()}')
        await pg.click('[data-d="h-1"]'); check((await shown())[0] == '11:03', f'hour button goes back past 12: {await shown()}')
        await pg.click('[data-d="m-5"]'); check((await shown())[0] == '10:58', f'-5 minutes goes back past the hour: {await shown()}')
        await pg.click('[data-d="h+1"]'); await pg.click('[data-d="h+1"]'); check((await shown())[0] == '12:58', f'hour button wraps 11 to 12: {await shown()}')
        o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at 1440 ({o["h"]})')

        # ---- cards and quiz ----
        await pg.goto(base + M + '?tool=cards'); await pg.wait_for_selector('#tab-cards .deckbar')
        check('rule or fact' in (await pg.locator('#tab-cards').inner_text()).lower(), 'has a rules and facts flashcard deck')
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes')
        labels = await pg.locator('#tab-quiz .qmodes button').all_inner_texts()
        n_types = await pg.evaluate("document.querySelector('#tab-quiz') && 7")
        check(len(labels) == 2 and labels[1].startswith('One of each (7)'), f'Random and One of each (7) {labels}')
        await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        for i in range(7):
            await pg.wait_for_selector('#tab-quiz .opt'); await pg.locator('#tab-quiz .opt').first.click()
            await pg.click('#tab-quiz [data-a="next"]')
        check(await pg.locator('#tab-quiz .result').count() == 1, 'One of each finishes after seven questions')
        # the typed questions work as multiple choice in the Quiz: clocks are shown and one option is right
        await pg.goto(base + M + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .qmodes'); await pg.click('#tab-quiz .qmodes button[data-m="full"]')
        await pg.wait_for_selector('#tab-quiz .opt')
        check(await pg.locator('#tab-quiz svg.tmclk').count() == 1, 'first Quiz question shows the clock')
        t = await pg.evaluate(READ, await pg.locator('#tab-quiz svg.tmclk').element_handle())
        check(await pg.locator('#tab-quiz .opt').filter(has_text=re.compile('^\\s*' + t + '\\s*$')).count() == 1, f'Quiz offers the clock time {t} exactly once')

        # ---- layout ----
        tools = ['cards', 'read', 'pick', 'ampm', 'elapsed', 'later', 'words', 'quiz']
        for tool in tools:
            await pg.set_viewport_size({'width': 1440, 'height': 900})
            await pg.goto(base + M + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} .panel, #tab-{tool}')
            await pg.wait_for_timeout(250)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'{tool} fits 1440x900 {o}')
            for w, h in [(360, 740), (915, 412)]:
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(150)
                o = await overflow(pg); check(o['h'] <= 0, f'{tool} has no sideways scroll at {w}x{h} ({o["h"]})')
        for w, h in [(360, 740), (915, 412)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.goto(base + M + '?tool=guide'); await pg.wait_for_selector('.tmform')
            o = await overflow(pg); check(o['h'] <= 0, f'guide has no sideways scroll at {w}x{h} ({o["h"]})')
            sz = await pg.evaluate("(() => { const r = document.querySelector('#tmgClock svg').getBoundingClientRect(); return Math.min(r.width, r.height); })()")
            check(sz >= 150, f'guide clock readable at {w}x{h} ({sz:.0f}px)')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.goto(base + M + '?tool=read'); await pg.wait_for_selector('#tab-read svg.tmclk')
        sz = await pg.evaluate("(() => { const r = document.querySelector('#tab-read svg.tmclk').getBoundingClientRect(); return Math.min(r.width, r.height); })()")
        check(sz >= 150, f'read clock readable at 360px ({sz:.0f}px)')
        await pg.goto(base + M + '?tool=pick'); await pg.wait_for_selector('#tab-pick svg.tmclk')
        sz = await pg.evaluate("(() => { const r = document.querySelector('#tab-pick svg.tmclk').getBoundingClientRect(); return Math.min(r.width, r.height); })()")
        check(sz >= 100, f'pick clocks readable at 360px ({sz:.0f}px)')
        check(not errors, f'no page errors {errors[:2]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
