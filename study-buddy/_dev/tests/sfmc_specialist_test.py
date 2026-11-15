"""Marketing Cloud Engagement Specialist module (shared/sb-exam.js): data, study guide, flashcards, Sort it, Practice, Mock exam (weights, choose-2 questions, timer,
resume, results), and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/sfmc_specialist_test.py"""
import asyncio, http.server, threading, functools, os, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/'
URL = BASE + 'modules/other/sfmc-specialist/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Chris',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)},cancel(){},getVoices(){return[]},addEventListener(){}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
async def right_letters(pg, kind):   # the buttons on screen that hold the right answers
    return await pg.evaluate("k => { const R = __sfmcTest[k](), q = SFMC.Q.find(x => x.id === R.ids[R.i]); return R.perm[R.i].map((ci, j) => q.a.includes(ci) ? j : -1).filter(j => j >= 0); }", kind)
async def wrong_letter(pg, kind):
    return await pg.evaluate("k => { const R = __sfmcTest[k](), q = SFMC.Q.find(x => x.id === R.ids[R.i]); return R.perm[R.i].findIndex(ci => !q.a.includes(ci)); }", kind)
async def answer_right(pg, kind, mode):
    for j in await right_letters(pg, kind): await pg.click(f'.hopt >> nth={j}')
    if mode == 'now' and await pg.locator('[data-a="check"]').count(): await pg.click('[data-a="check"]')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def page(tool, vp=(1440, 900), fresh=True):
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, service_workers='block'); await ctx.add_init_script(INIT)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(URL + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2, #tab-{tool} .fcard, #tab-{tool} .sortTray')
            return pg

        # ---- registry and hub ----
        pg = await page('guide')
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'sfmc-specialist').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty + (t.kind ? '/' + t.kind : '') + (t.masterAt ? '/' + t.masterAt : '')).join(','))")
        check(reg == ['other:guide/easy/study,cards/easy/study,sort/medium,quiz/medium/study,exam/hard/41'], f'registry entry {reg}')
        await pg.goto(BASE + 'index.html#/home/other'); await pg.wait_for_selector('.grid .mod, .grid .card')
        check('Marketing Cloud Engagement Specialist' in await pg.inner_text('.grid'), 'Other lists the Marketing Cloud Engagement Specialist module')

        # ---- data ----
        await pg.goto(URL + '?tool=guide'); await pg.wait_for_selector('.gtabs')
        d = await pg.evaluate("""(() => { const D = SFMC, bad = [], per = {};
          D.Q.forEach(q => { per[q.s] = (per[q.s] || 0) + 1;
            const multi = q.a.length > 1, says = (q.q.match(/\\(Choose (\\d)\\.\\)/) || [])[1];
            if (!D.SECTIONS.some(s => s.id === q.s)) bad.push('section:' + q.id);
            if (q.c.length < 4 || q.c.length > 5 || q.c.some(c => !c) || new Set(q.c).size !== q.c.length) bad.push('choices:' + q.id);
            if (!q.a.length || new Set(q.a).size !== q.a.length || q.a.some(i => i < 0 || i >= q.c.length)) bad.push('key:' + q.id);
            if (multi ? +says !== q.a.length : !!says) bad.push('choose:' + q.id);
            if (!D.SOURCES[q.src] || !q.x || q.x.length < 20) bad.push('src/x:' + q.id); });
          const g = Object.entries(D.GUIDE).flatMap(([k, bl]) => bl.flatMap(x => x.src.filter(s => !D.SOURCES[s]).map(s => k + ':' + s)));
          const cards = D.CARDS.filter(c => !D.SECTIONS.some(s => s.id === c[0]) || !c[1] || !c[2]).length;
          const sorts = D.SORTS.flatMap(s => s.items.filter(([t, b]) => !s.buckets.some(x => x[0] === b)).map(([t]) => s.id + ':' + t));
          return { n: D.Q.length, ids: new Set(D.Q.map(q => q.id)).size, per, bad, g, cards, sorts, multi: D.Q.filter(q => q.a.length > 1).length,
            weights: D.SECTIONS.reduce((n, s) => n + s.pct, 0), exam: D.SECTIONS.reduce((n, s) => n + s.n, 0), need: Object.fromEntries(D.SECTIONS.map(s => [s.id, s.n])),
            urls: Object.values(D.SOURCES).every(([t, u]) => t && /^https:\\/\\/(developer|help|trailhead)\\.salesforce\\.com\\//.test(u)) }; })()""")
        check(d['n'] == d['ids'] and d['n'] >= 130, f"{d['n']} questions with unique ids")
        check(not d['bad'], f"every question has 4 or 5 different choices, a valid key, a matching 'Choose N', a source, and a reason {d['bad'][:6]}")
        check(all(d['per'][k] >= 2 * v for k, v in d['need'].items()), f"each section has at least twice the questions the mock exam needs {d['per']}")
        check(d['multi'] >= 8, f"there are choose-2 questions ({d['multi']})")
        check(d['weights'] == 100 and d['exam'] == 60 and d['need'] == {'bp': 6, 'ccd': 14, 'ma': 16, 'sdm': 16, 'ia': 8}, 'the five sections add up to 100% and 60 exam questions (6, 14, 16, 16, 8)')
        check(not d['g'] and not d['cards'] and not d['sorts'], f"guide sources, flashcards, and sort items are all valid {d['g']} {d['sorts']}")
        check(d['urls'], 'every source is an official Salesforce page')
        exam = await pg.evaluate("SFMC.EXAM")
        check(exam == {'questions': 60, 'unscored': 5, 'minutes': 90, 'passPct': 67, 'pass': 41}, f'exam facts from the guide {exam}')

        # ---- study guide ----
        tabs = await pg.locator('.gtabs button').all_inner_texts()
        check(tabs == ['The exam', 'Email Marketing Best Practices (10%)', 'Content Creation and Delivery (24%)', 'Marketing Automation (26%)', 'Subscriber and Data Management (26%)', 'Insights and Analytics (14%)'], f'guide tabs {tabs}')
        body = await pg.inner_text('.gbody')
        check('90 minutes' in body and '67% (41 of 60)' in body and 'original' in body, 'the exam tab shows the facts and says the questions are original')
        worst = (await overflow(pg))['v']
        check(worst <= 0, f'the exam tab fits at 1440x900 ({worst})')
        for sid in ['bp', 'ccd', 'ma', 'sdm', 'ia']:
            await pg.click(f'.gtabs button[data-g="{sid}"]')
            n = await pg.locator('.stabs button').count(); blocks = await pg.evaluate(f"SFMC.GUIDE.{sid}.length")
            check(n == blocks + 1, f'{sid}: an Objectives tab plus one tab per topic ({n})')
            objs = await pg.evaluate(f"SFMC.SECTIONS.find(s => s.id === '{sid}').obj")
            sbt = await pg.inner_text('.sbody'); check(all(o in sbt for o in objs), f'{sid}: the objectives from the exam guide are shown')
            for t in range(n):
                await pg.click(f'.stabs button >> nth={t}'); worst = max(worst, (await overflow(pg))['v'])
            check(await pg.locator('.sbody .ssrc a').count() >= 1, f'{sid}: the last topic links its sources')
        check(worst <= 0, f'no guide tab scrolls at 1440x900 ({worst})')
        await pg.context.close()

        # ---- flashcards ----
        pg = await page('cards')
        cnt = await pg.inner_text('#tab-cards .count'); total_cards = await pg.evaluate("SFMC.CARDS.length")
        check(cnt.endswith(f'of {total_cards} done'), f'flashcards start with all {total_cards} cards ({cnt})')
        await pg.select_option('#tab-cards .secsel', 'ma'); await pg.wait_for_timeout(200)
        api_n = await pg.evaluate("SFMC.CARDS.filter(c => c[0] === 'ma').length")
        check((await pg.inner_text('#tab-cards .count')).endswith(f'of {api_n} done'), 'choosing Marketing Automation shows only those cards')
        await pg.click('#tab-cards .fcard'); await pg.wait_for_timeout(600)
        check(len((await pg.inner_text('#tab-cards .back')).strip()) > 5, 'the card flips to its meaning')
        st = await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('sfmc-specialist')) || '{}')")
        check(st.get('cardSec') == 'ma', 'the chosen flashcard section is remembered')
        await pg.context.close()

        # ---- sort it ----
        pg = await page('sort')
        sm = await pg.evaluate("Object.fromEntries(SFMC.SORTS.map(s => [s.id, Object.fromEntries(s.items)]))")
        for sid, label in [('profiles', 'Which send setting?'), ('tool', 'Automation Studio or Journey Builder?'), ('reentry', 'Which re-entry setting?'), ('persona', 'Which Einstein persona?')]:
            await pg.click(f'#tab-sort .seg button:has-text("{label}")'); await pg.wait_for_timeout(150)
            for _ in range(len(sm[sid])):
                t = await pg.inner_text('#tab-sort .sortTray .chip >> nth=0')
                await pg.click('#tab-sort .sortTray .chip >> nth=0'); await pg.click(f'#tab-sort .bucket[data-b="{sm[sid][t]}"]'); await pg.wait_for_timeout(40)
            n = len(sm[sid])
            check(await pg.inner_text('#tab-sort .placed') == f'{n}/{n}' and await pg.inner_text('#tab-sort .miss') == '0', f'sort "{label}": all {n} placed with no misses')
            check((await overflow(pg))['v'] <= 0, f'sort "{label}" fits at 1440x900')
        await pg.context.close()

        # ---- practice ----
        pg = await page('quiz')
        opts = await pg.locator('#sp-sec option').all_inner_texts()
        check(len(opts) == 6 and opts[0].startswith('Every section'), f'practice offers every section and each one {opts}')
        await pg.select_option('#sp-sec', 'ia'); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        ids = await pg.evaluate("__sfmcTest.practice().ids")
        check(len(ids) == 10 and all(i.startswith('ia') for i in ids) and len(set(ids)) == 10, 'Insights practice gives 10 different Insights and Analytics questions')
        check('Question 1 of 10' in await pg.inner_text('.roundbar'), 'practice shows its progress')
        check(await pg.locator('.stimer').count() == 0, 'practice has no timer')
        await pg.click(f'.hopt >> nth={await wrong_letter(pg, "practice")}')
        rv = await pg.inner_text('.hreveal')
        check('Not quite' in rv and 'Source:' in rv and await pg.locator('.hreveal .ssrc a').count() == 1, 'a wrong answer shows the right one, the reason, and the source link')
        await pg.click('[data-a="next"]')
        for _ in range(9):
            await answer_right(pg, 'practice', 'now'); await pg.click('[data-a="next"]')
        await pg.wait_for_selector('.hresult')
        check('9 out of 10' in await pg.inner_text('.hresult'), 'practice results count 9 of 10')
        st = await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('sfmc-specialist')))")
        check(len(st['missed']) == 1 and st['missed'][0] == ids[0], 'the missed question is remembered')
        await pg.click('[data-a="again"]'); await pg.wait_for_selector('#sp-sec')
        opts = await pg.locator('#sp-sec option').all_inner_texts()
        check(any('Questions you missed (1)' in o for o in opts), 'practice offers the missed questions')
        await pg.select_option('#sp-sec', 'missed'); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        check(await pg.evaluate("__sfmcTest.practice().ids") == [ids[0]], 'practicing missed questions gives just that one')
        await pg.context.close()

        # ---- mock exam: picks in the section weights, with a timer ----
        pg = await page('exam')
        check(await pg.locator('[data-t="on"][aria-pressed="true"]').count() == 1 and '90 minutes' in await pg.inner_text('#tab-exam'), 'the timer is on by default (90 minutes)')
        await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        per = await pg.evaluate("(() => { const R = __sfmcTest.exam(), c = {}; R.ids.forEach(id => { const s = SFMC.Q.find(q => q.id === id).s; c[s] = (c[s] || 0) + 1; }); return { c, n: R.ids.length, u: new Set(R.ids).size }; })()")
        check(per['n'] == 60 and per['u'] == 60 and per['c'] == {'bp': 6, 'ccd': 14, 'ma': 16, 'sdm': 16, 'ia': 8}, f"the exam has 60 different questions in the section weights {per}")
        tm = await pg.inner_text('.stimer')
        check(re.match(r'(89|90):\d\d left', tm) is not None, f'the timer counts down from 90 minutes ({tm})')
        check((await overflow(pg))['v'] <= 0, 'an exam question fits at 1440x900')
        await pg.click('[data-a="quit"]'); await pg.click('[data-a="quit"]'); await pg.wait_for_selector('[data-a="start"]')
        check(await pg.locator('[data-a="resume"]').count() == 0, 'stopping the exam clears it')

        # choose-2 and code questions, answered right away
        await pg.evaluate("window.__sfmcTest = Object.assign(window.__sfmcTest || {}, { force: ['bp02', 'ccd01', 'ma22'] })")
        await pg.click('[data-t="off"]'); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        check(await pg.locator('.stimer').count() == 0, 'No timer turns the timer off')
        check('choose 2' in (await pg.inner_text('.hgl')).lower(), 'a choose-2 question says so')
        rl = await right_letters(pg, 'exam')
        await pg.click(f'.hopt >> nth={rl[0]}')
        check(await pg.locator('[data-a="check"]').is_disabled(), 'Check waits until two choices are picked')
        await pg.click(f'.hopt >> nth={rl[1]}'); await pg.click('[data-a="check"]')
        check('Correct' in await pg.inner_text('.hreveal'), 'picking both right choices is correct')
        await pg.click('[data-a="next"]')
        check(await pg.locator('.scode').count() == 0, 'a question without code shows no code box')
        await answer_right(pg, 'exam', 'now'); await pg.click('[data-a="next"]')
        rl = await right_letters(pg, 'exam'); wl = await wrong_letter(pg, 'exam')
        await pg.click(f'.hopt >> nth={rl[0]}'); await pg.click(f'.hopt >> nth={wl}'); await pg.click('[data-a="check"]')
        rv = await pg.inner_text('.hreveal')
        check('Not quite' in rv and 'all of these' in rv, 'one right and one wrong choice is marked wrong and shows both right answers')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.hresult')
        res = await pg.inner_text('#tab-exam')
        check('2 out of 3' in res and 'Not yet' in res, 'results: 2 of 3, not passed')
        await pg.click('[data-a="missed"]'); await pg.wait_for_timeout(300)
        check(await pg.locator('.hrev').count() == 1 and 'correct answer' in (await pg.inner_text('.hreview')).lower(), 'reviewing the missed question shows the right answers')
        await pg.context.close()

        # the real thing: answer at the end, unanswered questions, passing, resume, and time running out
        pg = await page('exam')
        await pg.click('[data-r="end"]'); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        check(await pg.locator('.hgrid button').count() == 60, 'answer-at-the-end mode shows a grid of 60 questions')
        for _ in range(2):
            await answer_right(pg, 'exam', 'end'); await pg.click('[data-a="next"]')
        perm0 = await pg.evaluate("JSON.stringify(__sfmcTest.exam().perm)")
        await pg.reload(); await pg.wait_for_selector('[data-a="resume"]')
        check('2 of 60 answered' in await pg.inner_text('[data-a="resume"]'), 'a closed exam can be carried on (2 of 60 answered)')
        await pg.click('[data-a="resume"]'); await pg.wait_for_selector('.hopt')
        check(await pg.evaluate("JSON.stringify(__sfmcTest.exam().perm)") == perm0, 'the choices keep their order after carrying on')
        check(await pg.evaluate("__sfmcTest.exam().i") == 2, 'carrying on returns to the same question')
        for _ in range(55):
            await answer_right(pg, 'exam', 'end'); await pg.click('[data-a="next"]')
        await pg.evaluate("__sfmcTest.exam().i = 59"); await pg.click('.hgrid button >> nth=59'); await pg.wait_for_timeout(100)
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.hgrid')
        check('Before you finish' in await pg.inner_text('#tab-exam') and await pg.locator('.hgrid button').count() == 3, 'finishing with 3 unanswered asks first and lists them')
        await pg.click('[data-a="anyway"]'); await pg.wait_for_selector('.hresult')
        res = await pg.inner_text('.hresult')
        check('57 out of 60' in res and 'You passed!' in res, '57 of 60 passes')
        check(await pg.locator('.hsubs .hrow').count() == 5, 'results show all five sections')
        st = await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('sfmc-specialist')))")
        check(st.get('examNow') is None and st['examLast']['score'] == 57 and st['reveal'] == 'end', 'the finished exam is saved as the last result')
        mastered = await pg.evaluate("(() => { const t = SB.child(SB.activeId()).tools['sfmc-specialist/exam']; return t && t.best; })()")
        check(mastered == 57, f'the exam score is recorded for the module ({mastered})')
        await pg.click('[data-a="again"]'); await pg.wait_for_selector('[data-a="last"]')
        await pg.click('[data-a="last"]'); await pg.wait_for_selector('.hresult')
        check('57 out of 60' in await pg.inner_text('.hresult'), 'the last results can be opened again')
        # time runs out while the page is closed
        await pg.click('[data-a="again"]'); await pg.click('[data-t="on"]'); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        await answer_right(pg, 'exam', 'end')
        await pg.evaluate("(() => { const k = SB.moduleKey('sfmc-specialist'), s = JSON.parse(localStorage.getItem(k)); s.examNow.start = Date.now() - 106 * 60000; localStorage.setItem(k, JSON.stringify(s)); })()")
        await pg.reload(); await pg.wait_for_selector('[data-a="resume"]'); await pg.click('[data-a="resume"]'); await pg.wait_for_selector('.hresult')
        res = await pg.inner_text('.hresult')
        check('Time ran out' in res and '1 out of 60' in res, 'when time has run out, the exam ends with what was answered')
        await pg.context.close()

        # ---- layout ----
        for tool in ['guide', 'cards', 'sort', 'quiz', 'exam']:
            pg = await page(tool, (360, 780))
            if tool in ('quiz', 'exam'):
                if tool == 'exam': await pg.evaluate("window.__sfmcTest = { force: ['sdm15', 'ccd08'] }")
                await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
            check((await overflow(pg))['h'] <= 0, f'360px: no sideways scroll on {tool}')
            await pg.context.close()
        pg = await page('exam')
        await pg.evaluate("window.__sfmcTest = { force: ['ccd02'] }"); await pg.click('[data-a="start"]'); await pg.wait_for_selector('.hopt')
        check((await overflow(pg))['v'] <= 0, 'a question with long choices fits at 1440x900')
        await answer_right(pg, 'exam', 'now')
        check((await overflow(pg))['v'] <= 0, 'and still fits with the answer shown')
        await pg.context.close()

        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('ALL PASSED' if not fails else f'{len(fails)} FAILED')
    raise SystemExit(1 if fails else 0)

asyncio.run(main())
