"""Ham Radio Technician module: data, flashcards with section menu, mock exam, layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/ham_technician_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8785
BASE = f'http://127.0.0.1:{PORT}/'
HAM = BASE + 'modules/other/ham-technician/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)},cancel(){},getVoices(){return[]},addEventListener(){}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""
async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- registry and hub ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        reg = await pg.evaluate("SB_REGISTRY.modules.filter(m => m.id === 'ham-technician').map(m => m.subject + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(reg == ['other:cards/easy,exam/hard'], f'registry entry {reg}')
        check(await pg.evaluate("SB_REGISTRY.subjects.some(s => s.id === 'other' && s.name === 'Other')"), 'the Other subject exists')
        await pg.goto(BASE + 'index.html#/home/other'); await pg.wait_for_selector('.grid .mod, .grid .card')
        check('Ham Radio Technician' in await pg.inner_text('.grid'), 'Other lists the Ham Radio Technician module')

        # ---- data ----
        await pg.goto(HAM); await pg.wait_for_selector('#tab-cards .fcard')
        d = await pg.evaluate("""(() => { const H = HAM, bad = [];
          const per = {}; H.Q.forEach(q => { per[q.g.slice(0,2)] = (per[q.g.slice(0,2)]||0)+1;
            if (q.c.length !== 4 || q.c.some(c => !c) || q.a < 0 || q.a > 3 || !q.x || q.x.length < 30) bad.push(q.id);
            if (/ebook|study guide|NCVEC|choice [A-D]\\b|answer [A-D]\\b/i.test(q.x)) bad.push('words:' + q.id); });
          return { n: H.Q.length, groups: H.GROUPS.length, subs: H.SUBS.length, per, bad, ids: new Set(H.Q.map(q => q.id)).size,
                   figs: H.Q.filter(q => q.f).map(q => q.id), exam: H.SUBS.reduce((n, s) => n + s.n, 0),
                   t1c01: H.Q.find(q => q.id === 'T1C01').q, t0a10: H.Q.find(q => q.id === 'T0A10').q }; })()""")
        check(d['n'] == 409 and d['ids'] == 409, f"409 unique questions {d['n']}")
        check(d['groups'] == 35 and d['subs'] == 10 and d['exam'] == 35, 'ten subelements, 35 groups, 35 exam questions')
        check(d['per'] == {'T1':68,'T2':37,'T3':35,'T4':23,'T5':50,'T6':46,'T7':44,'T8':47,'T9':23,'T0':36}, f"questions per subelement match the syllabus {d['per']}")
        check(not d['bad'], f"every question has 4 choices, a key and an explanation, with no banned words {d['bad'][:5]}")
        check(len(d['figs']) == 12, f"12 figure questions {d['figs']}")
        check('currently issue new licenses' in d['t1c01'] and 'unprotected battery' in d['t0a10'], 'the Feb 19 2026 errata wording is in')
        for n in (1, 2, 3):
            r = await pg.request.get(BASE + f'modules/other/ham-technician/fig-t{n}.png'); check(r.ok, f'figure T-{n} image is served')
        src = open(os.path.join(SITE, 'modules/other/ham-technician/ham.js')).read() + open(os.path.join(SITE, 'modules/other/ham-technician/index.html')).read()
        check(not re.search(r'ebook|mobi|study guide', src, re.I), 'the module never mentions the ebook')

        # ---- flashcards ----
        before = await pg.evaluate("SB.streakInfo().daily")
        check(await pg.locator('#tab-cards .secsel').input_value() == 'T1A', 'flashcards start at section T1A')
        count = lambda: pg.locator('#tab-cards .count').inner_text()
        check((await count()).endswith('of 11 done'), f'T1A has 11 cards {await count()}')
        check('T1A01' not in await pg.inner_text('#tab-cards .front') and 'Basis and Purpose' in await pg.inner_text('#tab-cards .front'), 'the first card is the first question')
        check(await pg.locator('#tab-cards .front .hch div').count() == 4, 'the card front lists the four choices')
        await pg.click('#tab-cards .fcard'); await pg.wait_for_timeout(600)
        back = await pg.inner_text('#tab-cards .back')
        check('Advancing skills in the technical and communication phases' in back and 'purpose of amateur radio' in back, 'the back shows the answer and the explanation')
        await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(700)
        check((await count()).startswith('1 of 11'), 'I knew it moves on')
        await pg.click('#tab-cards [data-a="nextsec"]'); await pg.wait_for_timeout(300)
        check(await pg.locator('#tab-cards .secsel').input_value() == 'T1B' and (await count()).endswith('of 12 done'), 'the Next arrow opens section T1B (12 cards)')
        await pg.click('#tab-cards [data-a="prevsec"]'); await pg.wait_for_timeout(200)
        check(await pg.locator('#tab-cards .secsel').input_value() == 'T1A', 'the Previous arrow goes back')
        check(await pg.locator('#tab-cards [data-a="prevsec"]').is_disabled(), 'Previous is off on the first section (All is not a step)')
        await pg.select_option('#tab-cards .secsel', 'T6C'); await pg.wait_for_timeout(300)
        await pg.click('#tab-cards [data-a="skip"]'); await pg.wait_for_timeout(700)
        check(await pg.locator('#tab-cards .front .hfig img').count() == 1, 'a figure question shows its picture on the card')
        groups = await pg.evaluate("[...document.querySelectorAll('#tab-cards .secsel optgroup')].map(g => g.label)")
        check(len(groups) == 10 and groups[0].startswith('T1 ') and groups[-1].startswith('T0 '), f'menu headings are the ten subelements {groups[:2]}')
        await pg.select_option('#tab-cards .secsel', 'T0C'); await pg.wait_for_timeout(200)
        check(await pg.locator('#tab-cards [data-a="nextsec"]').is_disabled(), 'Next is off on the last section')
        await pg.select_option('#tab-cards .secsel', 'all'); await pg.wait_for_timeout(200)
        check((await count()).endswith('of 409 done'), 'All sections has 409 cards')
        await pg.select_option('#tab-cards .secsel', 'T1A')
        await pg.click('#tab-cards .seg button:has-text("Shuffled")'); await pg.wait_for_timeout(300)
        check(await pg.locator('#tab-cards .secsel').input_value() == 'T1A', 'switching to Shuffled keeps the section')
        await pg.click('#tab-cards .seg button:has-text("In order")'); await pg.wait_for_timeout(200)
        for _ in range(11):
            await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(120)
        check('deck complete' in (await pg.inner_text('#tab-cards .front')).lower() and 'arrows' in await pg.inner_text('#tab-cards .front'), 'finishing a section says so and points to the arrows')
        check(await pg.evaluate("SB.streakInfo().daily") == before, 'flashcards give no credit')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'flashcards: no scroll bars at 1440x900 {o}')
        await pg.select_option('#tab-cards .secsel', 'T6C'); await pg.wait_for_timeout(300)
        await pg.click('#tab-cards [data-a="skip"]'); await pg.wait_for_timeout(700)
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'figure flashcard: no scroll bars at 1440x900 {o}')

        # ---- mock exam, answers shown after each question ----
        await pg.goto(HAM + '?tool=exam'); await pg.wait_for_selector('#tab-exam [data-a="start"]')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'exam start: no scroll bars {o}')
        check(await pg.locator('#tab-exam [data-r="now"]').get_attribute('aria-pressed') == 'true', 'default: show the answer after each question')
        await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_selector('#tab-exam .hopt')
        E = lambda js: pg.evaluate("(() => { const E = __hamTest.exam(); return " + js + "})()")
        check(await E("E.qs.length") == 35 and await E("new Set(E.qs.map(q => q.g)).size") == 35, 'the exam has 35 questions, one from each group')
        check(await E("E.qs.every((q, i) => i === 0 || E.qs[i-1].g <= q.g || E.qs[i-1].g.slice(0,2) !== q.g.slice(0,2))") is True, 'questions follow the group order')
        check('Question 1 of 35' in await pg.inner_text('#tab-exam .roundbar'), 'shows Question 1 of 35')
        check(await pg.locator('#tab-exam [data-a="next"]').is_hidden(), 'Next waits for an answer')
        a0 = await E("E.qs[0].a")
        wrong0 = (a0 + 1) % 4
        await pg.click(f'#tab-exam .hopt[data-i="{wrong0}"]'); await pg.wait_for_timeout(150)
        rv = await pg.inner_text('#tab-exam .hreveal')
        check('Not quite' in rv and 'The answer is' in rv, f'a wrong answer shows the right one {rv[:60]}')
        check(await pg.locator('#tab-exam .hopt.right').count() == 1 and await pg.locator('#tab-exam .hopt.wrong').count() == 1, 'right and wrong choices are marked')
        check(await pg.locator('#tab-exam .hopt:not(:disabled)').count() == 0, 'choices lock after answering')
        await pg.click('#tab-exam [data-a="next"]'); await pg.wait_for_timeout(100)
        a1 = await E("E.qs[1].a")
        await pg.keyboard.press('abcd'[a1])      # keyboard: choose by letter
        await pg.wait_for_timeout(150)
        check('Correct!' in await pg.inner_text('#tab-exam .hreveal') and len((await pg.inner_text('#tab-exam .hreveal')).split()) > 12, 'a right answer says Correct and still explains')
        await pg.keyboard.press('n'); await pg.wait_for_timeout(100)
        check('Question 3 of 35' in await pg.inner_text('#tab-exam .roundbar'), 'N goes to the next question')
        await pg.click('#tab-exam [data-a="quit"]'); check('Really' in await pg.inner_text('#tab-exam [data-a="quit"]'), 'Stop exam asks twice')
        # answer the rest all right, check layout of every question
        worst = 0
        for i in range(2, 35):
            ai = await E(f"E.qs[{i}].a"); await pg.click(f'#tab-exam .hopt[data-i="{ai}"]'); await pg.wait_for_timeout(40)
            o = await overflow(pg); worst = max(worst, o['v']); 
            if o['v'] > 0 or o['h'] > 0: check(False, f'question {i+1} fits at 1440x900 {o}')
            await pg.click('#tab-exam [data-a="next"]'); await pg.wait_for_timeout(40)
        check(worst <= 0, f'every answered question fits at 1440x900 without scroll bars (worst {worst})')
        await pg.wait_for_selector('#tab-exam .hresult')
        check(await E("E.score") == 34 and 'Question' not in await pg.inner_text('#tab-exam .hresult') and 'You passed' in await pg.inner_text('#tab-exam .hverdict'), '34 right passes')
        check('34 out of 35' in await pg.inner_text('#tab-exam .hscore'), 'the score is shown')
        rec = await pg.evaluate("SB.toolRecord('ham-technician','exam')"); check(rec and rec.get('best') == 34, f'best score is recorded {rec}')
        check(await pg.locator('#tab-exam .hrow').count() == 10, 'a row for each subelement')
        await pg.click('#tab-exam [data-a="missed"]'); await pg.wait_for_selector('#tab-exam .hrev')
        check(await pg.locator('#tab-exam .hrev').count() == 1 and 'your answer' in (await pg.inner_text('#tab-exam .hrev')).lower(), 'Review the missed shows the one miss with your answer')
        await pg.click('#tab-exam [data-a="all"]'); await pg.wait_for_timeout(200)
        check(await pg.locator('#tab-exam .hrev').count() == 35, 'Review all shows 35')
        check(await pg.locator('#tab-exam .hrev .hx').count() == 35, 'every reviewed question has its explanation')

        # ---- worst-case and figure questions ----
        force = await pg.evaluate("""(() => { const out = []; HAM.GROUPS.forEach(g => { const a = HAM.Q.filter(q => q.g === g.id);
          a.sort((x, y) => (y.q + y.c.join('') + y.x).length - (x.q + x.c.join('') + x.x).length); out.push(a[0].id); });
          return ['T6A09', 'T6C10', 'T6D10'].concat(out); })()""")
        await pg.evaluate(f"__hamTest.force = {force}")
        await pg.click('#tab-exam [data-a="again"]'); await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_selector('#tab-exam .hopt')
        figs = 0; bad = []
        for i in range(35):
            q = await E(f"E.qs[{i}].id"); await pg.click('#tab-exam .hopt[data-i="0"]'); await pg.wait_for_timeout(30)
            o = await overflow(pg)
            if o['v'] > 0 or o['h'] > 0: bad.append((q, o))
            figs += await pg.locator('#tab-exam .hfig img').count()
            await pg.click('#tab-exam [data-a="next"]'); await pg.wait_for_timeout(30)
        check(figs >= 3, f'figure questions show pictures ({figs})')
        check(not bad, f'longest and figure questions fit at 1440x900 {bad[:3]}')
        await pg.evaluate("__hamTest.force = []")

        # ---- mock exam, answers at the end ----
        await pg.click('#tab-exam [data-a="again"]'); await pg.click('#tab-exam [data-r="end"]')
        check('go back and change' in await pg.inner_text('#tab-exam .hnote'), 'the note explains the end mode')
        await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_selector('#tab-exam .hopt')
        a0 = await E("E.qs[0].a")
        await pg.click(f'#tab-exam .hopt[data-i="{(a0+1)%4}"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('#tab-exam .hreveal').inner_text() == '', 'no answer is revealed during the exam')
        check(await pg.locator('#tab-exam .hopt.right, #tab-exam .hopt.wrong').count() == 0, 'no right or wrong marks yet')
        await pg.click(f'#tab-exam .hopt[data-i="{a0}"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('#tab-exam .hopt.pick').count() == 1 and await E("E.ans[0]") == a0, 'an answer can be changed before finishing')
        await pg.click('#tab-exam [data-a="next"]'); await pg.click('#tab-exam [data-a="back"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('#tab-exam .hopt.pick').count() == 1, 'Back shows the saved answer')
        check(await pg.locator('#tab-exam .hgrid button').count() == 35 and await pg.locator('#tab-exam .hgrid button.done').count() == 1, 'the question grid marks answered questions')
        await pg.click('#tab-exam .hgrid button[data-j="34"]'); await pg.wait_for_timeout(100)
        check('Finish exam' in await pg.inner_text('#tab-exam [data-a="next"]'), 'the last question says Finish exam')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'end-mode question: no scroll bars at 1440x900 {o}')
        await pg.click('#tab-exam [data-a="next"]'); await pg.wait_for_selector('#tab-exam [data-a="anyway"]')
        check('34 questions' in await pg.inner_text('#tab-exam .lead'), 'unanswered questions are listed before finishing')
        await pg.click('#tab-exam [data-a="goback"]'); await pg.wait_for_timeout(100)
        check('Question 2 of 35' in await pg.inner_text('#tab-exam .roundbar'), 'Go back opens the first unanswered question')
        await pg.evaluate("(() => { const E = __hamTest.exam(); E.i = 34; })()")
        await pg.click('#tab-exam .hgrid button[data-j="34"]'); await pg.click('#tab-exam [data-a="next"]'); await pg.click('#tab-exam [data-a="anyway"]')
        await pg.wait_for_selector('#tab-exam .hresult')
        check(await E("E.score") == 1 and 'Not yet' in await pg.inner_text('#tab-exam .hverdict'), 'one right with the rest blank is Not yet')
        check('26' in await pg.inner_text('#tab-exam .hresult .lead'), 'it says how many are needed')
        check(await pg.evaluate("SB.toolRecord('ham-technician','exam').best") == 34, 'a lower score does not replace the best')
        # a perfect end-mode exam passes
        await pg.click('#tab-exam [data-a="again"]'); await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_selector('#tab-exam .hopt')
        for i in range(35):
            ai = await E(f"E.qs[{i}].a"); await pg.click(f'#tab-exam .hopt[data-i="{ai}"]'); await pg.click('#tab-exam [data-a="next"]'); await pg.wait_for_timeout(20)
        await pg.wait_for_selector('#tab-exam .hresult')
        check(await E("E.score") == 35 and 'You passed' in await pg.inner_text('#tab-exam .hverdict'), '35 right passes')
        check(await pg.locator('#tab-exam [data-a="missed"]').count() == 0, 'no Review-missed button when nothing was missed')
        check(await pg.evaluate("SB.toolRecord('ham-technician','exam').best") == 35, 'the new best is saved')
        check(await pg.evaluate("localStorage.length") > 0 and await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('ham-technician'))).reveal") == 'end', 'the reveal choice is remembered')

        # ---- read aloud ----
        await pg.evaluate("SB.setSetting('readAloud', true)"); await pg.click('#tab-exam [data-a="again"]'); await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_timeout(300)
        spoken = await pg.evaluate("window.__spoken.join(' | ')")
        check('A.' in spoken and 'B.' in spoken, 'read aloud reads the question and its choices')
        await pg.evaluate("SB.setSetting('readAloud', false)")

        # ---- narrow screens, display options ----
        for t in ('cards', 'exam'):
            await pg.goto(HAM + '?tool=' + t); await pg.wait_for_selector(f'#tab-{t}:not([hidden])')
            if t == 'exam':
                await pg.click('#tab-exam [data-a="start"]'); await pg.wait_for_selector('#tab-exam .hopt')
            for label, w, extra in (('360px', 360, ''), ('360px dyslexic larger', 360, "SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"), ('dark 1440', 1440, "SB.setSetting('theme','dark'); SB.applyDisplay()")):
                await pg.set_viewport_size({'width': w, 'height': 780 if w == 360 else 900})
                if extra: await pg.evaluate(extra)
                await pg.wait_for_timeout(250)
                o = await overflow(pg); check(o['h'] <= 0, f'{t}: no sideways scroll at {label} {o}')
                if label.startswith('dark'): check(o['v'] <= 0, f'{t}: no scroll bars in dark mode {o}')
                await pg.evaluate("SB.setSetting('font','standard'); SB.setSetting('size','normal'); SB.setSetting('theme','light'); SB.applyDisplay()")
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
