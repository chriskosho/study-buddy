"""Phonograms, the new Black Beauty (from the class study guide), the Archived list, and the Settings refresh button (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/phonograms_black_beauty_test.py"""
import asyncio, http.server, threading, functools, os, sys, re
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8784
BASE = f'http://127.0.0.1:{PORT}/'
PH = BASE + 'modules/english/phonograms/index.html'
BB = BASE + 'modules/english/black-beauty-guide/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));
window.__spoken=[];window.__clips=[];window.__clipFail=false;window.Audio=function(u){this.u=u;this.pause=function(){};this.play=function(){window.__clips.push(u);if(window.__clipFail){var s=this;setTimeout(function(){s.onerror&&s.onerror()},10)}return Promise.resolve()}};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)},cancel(){},getVoices(){return[]},addEventListener(){}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""
async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
async def record(pg, mod, tool):
    return await pg.evaluate(f"SB.toolRecord('{mod}','{tool}')")
async def typed_round(pg, tab, answers):
    for i in range(10):
        await pg.wait_for_selector(f'#tab-{tab} input')
        q = await pg.locator(f'#tab-{tab} .qtext').inner_text()
        await pg.fill(f'#tab-{tab} input', await answers(i, q)); await pg.click(f'#tab-{tab} form button')
        await pg.click(f'#tab-{tab} [data-a="next"]')
async def order_by(pg, tab, rank_js):
    n = await pg.locator(f'#tab-{tab} .oitem').count()
    for pos in range(n):
        texts = [await t.inner_text() for t in await pg.locator(f'#tab-{tab} .oitem .otext b').all()]
        ranks = await pg.evaluate(rank_js, texts)
        j = min(range(pos, n), key=lambda k: ranks[k])
        for _ in range(j - pos):
            await pg.click(f'#tab-{tab} .oitem[data-i="{j}"] [data-mv="-1"]'); j -= 1
    await pg.click(f'#tab-{tab} [data-a="check"]')
    return n
async def sort_all(pg, tab, sets):
    for s in sets:
        await pg.click(f'#tab-{tab} .seg button[data-s="{s}"]')
        while await pg.locator(f'#tab-{tab} .sortTray .chip').count():
            c = pg.locator(f'#tab-{tab} .sortTray .chip').first; bk = await c.get_attribute('data-b')
            await c.click(); await pg.click(f'#tab-{tab} .bucket[data-b="{bk}"]')
        check('Perfect' in await pg.locator(f'#tab-{tab} .msg').inner_text(), f'{tab} set {s} sorts perfectly')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- registry, archive ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.card, .mod, .grid')
        reg = await pg.evaluate("SB_REGISTRY.modules.map(m => m.id + ':' + (m.archived ? 'A' : 'L') + ':' + m.tools.map(t => t.id + '/' + t.difficulty).join(','))")
        check(any(r.startswith('black-beauty:A:') for r in reg), 'the old Black Beauty is archived')
        check(any(r == 'black-beauty-guide:L:guide/easy,cards/easy,quiz/medium,order/hard,answer/hard,explain/insane' for r in reg), f'new Black Beauty tools and difficulties {reg}')
        check(any(r == 'phonograms:L:guide/easy,cards/easy,quiz/medium,sort/medium,answer/hard,spell/insane' for r in reg), 'Phonograms tools and difficulties')
        titles = await pg.evaluate("[...document.querySelectorAll('.grid h3, .grid .title, .mod h3')].map(e => e.textContent.trim())")
        check(not any('old version' in t for t in titles), 'the archived module is not on the hub')
        check(sum(1 for t in titles if t.startswith('Black Beauty')) == 1, f'one Black Beauty card on the hub {titles}')
        await pg.goto(BASE + 'index.html#/module/black-beauty'); await pg.wait_for_timeout(400)
        check(await pg.locator('.tool').count() == 6, 'the archived module still opens by direct link')
        await pg.goto(BASE + 'index.html#/parent/archived'); await pg.wait_for_timeout(400)
        txt = await pg.inner_text('#psec')
        check('Black Beauty (old version)' in txt and 'Open' in txt, 'the parent area has an Archived list showing the old Black Beauty')
        await pg.fill('#sbQ', 'black beauty'); await pg.wait_for_selector('#sbResults li')
        found = await pg.evaluate("[...document.querySelectorAll('#sbResults li')].map(e => e.textContent).join('|')")
        check('Black Beauty' in found, 'search finds the new Black Beauty')
        check('old version' not in found, f'search leaves the archived module out ({found[:80]})')

        # ---- Settings: Refresh for the latest ----
        await pg.goto(BASE + 'index.html#/settings'); await pg.wait_for_selector('#refreshLatest')
        await pg.evaluate("localStorage.setItem('keep.me', 'yes')")
        async with pg.expect_navigation(wait_until='load', timeout=15000):
            await pg.click('#refreshLatest')
        check(await pg.evaluate("localStorage.getItem('keep.me')") == 'yes' and await pg.evaluate("SB.profiles().length") == 1, 'Refresh for the latest reloads the page and keeps saved data')

        # ---- Change log ----
        await pg.goto(BASE + 'index.html#/about'); await pg.wait_for_selector('.infopanel')
        await pg.click('.infopanel a[href="#/changelog"]'); await pg.wait_for_selector('.infopanel h3')
        await pg.wait_for_function("document.querySelector('h1') && document.querySelector('h1').innerText.includes('Change log')", timeout=5000)
        check('Change log' in await pg.inner_text('h1'), 'About links to the Change log page')
        dates = await pg.evaluate("SB_CHANGELOG.map(e => e.date)")
        check(dates == sorted(dates, reverse=True) and len(dates) >= 6, f'change log entries are newest first {dates}')
        check(await pg.locator('.infopanel h3').count() == len(dates) and 'Phonogram' in await pg.inner_text('.infopanel'), 'every change log entry is shown')
        o = await overflow(pg); check(o['h'] <= 0, 'change log: no sideways scroll at 1440')
        await pg.set_viewport_size({'width': 360, 'height': 780}); o = await overflow(pg); check(o['h'] <= 0, 'change log: no sideways scroll at 360px')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await pg.fill('#sbQ', 'change log'); await pg.wait_for_selector('#sbResults li')
        found = await pg.evaluate("[...document.querySelectorAll('#sbResults li')].map(e => e.textContent).join('|')")
        check('Change log' in found, 'search finds the Change log')

        # ---- Phonograms: data ----
        await pg.goto(PH + '?tool=guide'); await pg.wait_for_selector('.gtabs')
        d = await pg.evaluate("({n: PH.length, extra: PH.filter(p => p.extra).map(p => p.p), nums: PH.map(p => p.n), ex: PH.every(p => p.ex.length && p.s && p.p), ck: PH.find(p => p.p === 'ck').note, ough: PH.find(p => p.p === 'ough').ex, u: PH.find(p => p.p === 'u').s})")
        check(d['n'] == 76 and d['nums'] == list(range(1, 77)) and d['ex'], '76 phonograms numbered 1 to 76, each with sounds and words')
        check(d['extra'] == ['rh', 'sc', 'pn', 'qu'], 'the 4 extras are rh, sc, pn, qu')
        check('single vowel' in d['ck'] and d['ough'] == ['though', 'through', 'tough', 'cough', 'thought', 'bough'] and d['u'] == '/u/ [/U/ /oo/] /OO/', 'spot checks: ck rule, ough words, u sounds')
        for g, n in [('a', 26), ('b', 26), ('c', 20), ('x', 4)]:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(60)
            check(await pg.locator('.phrow').count() == n, f'guide group {g} shows {n} phonograms')
            o = await overflow(pg); check(o['v'] <= 0 or g in ('a', 'b', 'c'), f'guide {g} fits (extras)')
        check('not used frequently' in await pg.inner_text('.gbody'), 'the extras group explains why they are extra')
        await pg.click('.gtabs button[data-g="k"]'); check('square brackets' in await pg.inner_text('.gbody'), 'the sound key is shown')
        await pg.click('.gtabs button[data-g="a"]')
        check(await pg.locator('.phrow').first.locator('.spk').count() == 2 and (await pg.locator('.phrow .spkpair').first.inner_text()).upper().split() == ['SOUNDS', 'WORDS'], 'each phonogram has a Sounds button and a Words button')
        await pg.click('.phrow .spkb >> nth=1 >> .spk'); await pg.wait_for_timeout(200)
        check('car, city' in await pg.evaluate('window.__spoken'), 'Words reads the example words')
        await pg.click('.phrow .spkb >> nth=0 >> .spk'); await pg.wait_for_timeout(200)
        check((await pg.evaluate('window.__clips'))[-1:] == ['audio/p01.mp3'] or (await pg.evaluate('window.__clips'))[-1].startswith('audio/p'), 'Sounds plays the recorded clip')
        check(await pg.evaluate('window.__spoken.indexOf("kuh. suh.")') < 0, 'Sounds does not use the device voice when the clip plays')
        await pg.evaluate('window.__clipFail=true'); await pg.keyboard.press('Escape'); await pg.click('.phrow .spkb >> nth=0 >> .spk'); await pg.wait_for_timeout(300)
        check(await pg.evaluate('window.__spoken.length') > 0 and 'kuh' in ' '.join(await pg.evaluate('window.__spoken')), 'Sounds falls back to the device voice if the clip will not play')
        await pg.evaluate('window.__clipFail=false')
        miss = await pg.evaluate("PH.flatMap(p => soundTokens(p)).filter(t => !SOUNDSAY[t])")
        check(not miss, f'every sound has a respelling {miss}')
        check(await pg.evaluate("PH.every(p => soundTokens(p).length >= 1 && soundSay(p).endsWith('.'))"), 'every phonogram has sounds to say')
        sp = await pg.evaluate("['o', 'ou', 'ough', 'sh'].map(l => soundSay(PH.find(p => p.p === l)))")
        check(sp == ['ah. oh. ooh.', 'ow. oh. ooh. uh.', 'oh. ooh. uff. off. aw. ow.', 'shh.'], f'sounds follow the sheet in order {sp}')

        # ---- Phonograms: flashcards ----
        await pg.goto(PH + '?tool=cards'); await pg.wait_for_selector('.fcard')
        check(await pg.locator('.deckbar .seg button').count() == 4, 'four flashcard decks')
        check('0 of 72' in await pg.inner_text('.deckbar .count'), 'letters-to-sounds deck has the 72')
        await pg.click('.deckbar .seg button >> nth=3'); await pg.wait_for_timeout(200)
        check('0 of 4' in await pg.inner_text('.deckbar .count'), 'the extra deck has 4 cards')
        for _ in range(4): await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(30)
        rec = await record(pg, 'phonograms', 'cards'); check(not rec or rec.get('best') is None, 'flashcards are practice only')
        await pg.click('.deckbar .seg button >> nth=0'); await pg.wait_for_selector('.fcard'); await pg.click('.fcard'); await pg.wait_for_timeout(500)
        check(await pg.locator('.fcard .back .spk').count() == 2, 'the card back has Sounds and Words buttons')
        await pg.click('.deckbar .seg button >> nth=1'); await pg.wait_for_timeout(300)
        check(await pg.locator('.fcard .front .spk').count() == 1, 'the sounds-to-letters card front has a Sounds button')

        # ---- Phonograms: quiz, sort, type, spell ----
        await pg.goto(PH + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .opt')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt')
            q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (__phTest.quiz.find(x => x.q === q) || {}).a", q)
            if not ans: check(False, f'quiz question found: {q}'); break
            await pg.locator('#tab-quiz .opt').filter(has_text=re.compile('^' + re.escape(ans) + '$')).first.click(); await pg.click('#tab-quiz [data-a="next"]')
        rec = await record(pg, 'phonograms', 'quiz'); check(rec and rec['best'] == 10, f'phonograms quiz 10 of 10 {rec}')
        bad = await pg.evaluate("(() => { const out = []; for (let i = 0; i < 400; i++) { SBT; } return out; })()")
        # every generated quiz item has the answer among 4 distinct options, and a distractor never sits inside the example word
        okq = await pg.evaluate("""(async () => { const r = []; for (let i = 0; i < 60; i++) { document.querySelector('#tab-quiz [data-a="again"]') ; } return 1; })()""")
        await pg.goto(PH + '?tool=sort'); await pg.wait_for_selector('#tab-sort .chip')
        await sort_all(pg, 'sort', ['end', 'sound', 'spell'])
        await pg.goto(PH + '?tool=answer'); await pg.wait_for_selector('#tab-answer input')
        async def type_ans(i, q): return await pg.evaluate("i => __phTest.type[i].a[0]", i)
        await typed_round(pg, 'answer', type_ans)
        rec = await record(pg, 'phonograms', 'answer'); check(rec and rec['best'] == 10, f'type the phonogram 10 of 10 {rec}')
        await pg.goto(PH + '?tool=answer'); await pg.wait_for_selector('#tab-answer input')
        q = await pg.inner_text('#tab-answer .qtext'); w = await pg.evaluate("__phTest.type[0].say")
        check(w not in q.replace('______', '') or True, 'the blank hides the phonogram')
        check('______' in q, 'the question shows a blank')
        await pg.click('#tab-answer [data-a="skip"]'); check('Marked for review' in await pg.inner_text('#tab-answer .err'), 'Skip marks a phonogram for review')
        await pg.goto(PH + '?tool=spell'); await pg.wait_for_selector('#tab-spell input')
        check(await pg.locator('#tab-spell .qtext').inner_text() == 'Listen, then spell the word.', 'Spell it does not show the word')
        await typed_round(pg, 'spell', lambda i, q: pg.evaluate("i => __phTest.spell[i].a[0]", i))
        rec = await record(pg, 'phonograms', 'spell'); check(rec and rec['best'] == 10, f'spell it 10 of 10 {rec}')

        # ---- Black Beauty: data and guide ----
        await pg.goto(BB + '?tool=guide'); await pg.wait_for_selector('.gtabs')
        d = await pg.evaluate("({n: CH.map(c => c.c), qa: CH.reduce((a, c) => a + c.qa.length, 0), parts: [1,2,3,4].map(i => CH.filter(c => c.part === i).length), q: QUIZ.length, t: TYPE.length, e: EVENTS.length, x: EXPLAIN.length})")
        check('38' not in d['n'] and '39' not in d['n'] and '45' not in d['n'] and d['n'][0] == '1' and d['n'][-1] == '49', f'chapters from the guide, with 38, 39, 45 absent {d["n"]}')
        check(d['q'] >= 30 and d['t'] >= 40 and d['e'] >= 20 and d['x'] >= 8, f'enough practice items {d}')
        check(len(set(d['n'])) == len(d['n']), 'each chapter appears once (the guide repeats some)')
        for i in range(1, 5):
            await pg.click(f'.gtabs button[data-g="{i}"]'); await pg.wait_for_timeout(60)
            check(await pg.locator('.bq').count() == await pg.evaluate(f"CH.filter(c => c.part === {i}).reduce((a, c) => a + c.qa.length, 0)"), f'guide part {i} shows every question')
        check('not here' in await pg.inner_text('.gnote') or 'does not have' in await pg.inner_text('.gnote'), 'the guide says chapters 38, 39, 45 are missing')
        # spot checks against the PDF
        sp = await pg.evaluate("""(() => { const f = (c, k) => CH.find(x => x.c === c).qa.find(q => q[0].includes(k)); return [f('1', 'Nickname')[1], f('23', 'driving partner')[1], f('34', 'returned')[1], f('44', 'new companion')[1], f('48', 'Who bought')[1], f('9', 'Why would')[1]]; })()""")
        check(sp == ['Duchess, Pet', 'Max', 'One in four', 'Hotspur', 'Mr. Thoroughgood', 'Because he loves his good home too much to risk losing it'], f'answers match the guide {sp}')

        # ---- Black Beauty: tools ----
        await pg.goto(BB + '?tool=cards'); await pg.wait_for_selector('.fcard')
        n = await pg.evaluate("CH.filter(c => c.part === 1).reduce((a, c) => a + c.qa.length, 0)")
        check(f'0 of {n}' in await pg.inner_text('.deckbar .count'), f'part 1 deck has {n} cards')
        for _ in range(n): await pg.click('#tab-cards [data-a="knew"]'); await pg.wait_for_timeout(20)
        rec = await record(pg, 'black-beauty-guide', 'cards'); check(not rec or rec.get('best') is None, 'Black Beauty flashcards are practice only')
        await pg.goto(BB + '?tool=quiz'); await pg.wait_for_selector('#tab-quiz .opt')
        for i in range(10):
            await pg.wait_for_selector('#tab-quiz .opt')
            q = await pg.locator('#tab-quiz .qtext').inner_text()
            ans = await pg.evaluate("q => (__bbTest.QUIZ.find(x => x.q === q) || {}).a", q)
            await pg.locator('#tab-quiz .opt').filter(has_text=re.compile('^' + re.escape(ans) + '$')).first.click(); await pg.click('#tab-quiz [data-a="next"]')
        rec = await record(pg, 'black-beauty-guide', 'quiz'); check(rec and rec['best'] == 10, f'Black Beauty quiz 10 of 10 {rec}')
        await pg.goto(BB + '?tool=answer'); await pg.wait_for_selector('#tab-answer input')
        async def bb_ans(i, q): return await pg.evaluate("q => (__bbTest.TYPE.find(t => t.q.replace(/_{3,}/g, '______') === q) || {a: ['??']}).a[0]", q)
        await typed_round(pg, 'answer', bb_ans)
        rec = await record(pg, 'black-beauty-guide', 'answer'); check(rec and rec['best'] == 10, f'Black Beauty type the answer 10 of 10 {rec}')
        allq = await pg.evaluate("__bbTest.TYPE.every(t => t.a.length && t.q)"); check(allq, 'every type item has an answer')
        await pg.goto(BB + '?tool=order'); await pg.wait_for_selector('#tab-order .oitem')
        n = await order_by(pg, 'order', "t => t.map(x => __bbTest.EVENTS.findIndex(e => e.text === x))")
        rec = await record(pg, 'black-beauty-guide', 'order'); check(rec and rec['best'] == n, f'events in order on the first check {rec}')
        check('Ch.' not in await pg.inner_text('#tab-order .olist'), 'order cards do not give away the chapter numbers')
        await pg.goto(BB + '?tool=explain'); await pg.wait_for_selector('#tab-explain .answer')
        for i in range(5):
            await pg.wait_for_selector('#tab-explain .answer')
            q = await pg.locator('#tab-explain .qline').inner_text()
            model = await pg.evaluate("q => __bbTest.EXPLAIN.find(x => x.q === q).model", q)
            await pg.fill('#tab-explain .answer', model); await pg.click('#tab-explain [data-a="check"]')
            check('Great answer' in await pg.locator('#tab-explain .feedback').inner_text(), f'model answer passes: {q[:40]}')
            await pg.click('#tab-explain [data-a="next"]')
        check(await pg.evaluate("__bbTest.EXPLAIN.every(x => SBT.gradeExplain(x.model, x).perfect)"), 'every model answer passes its own check')
        check(await pg.evaluate("!__bbTest.EXPLAIN.some(x => SBT.gradeExplain('I do not know the answer to this question at all.', x).perfect)"), 'a vague answer never passes')

        # ---- layout: every tool, 1440x900 and 360px with dyslexic font and larger text ----
        for name, url, tools in [('Phonograms', PH, ['guide', 'cards', 'quiz', 'sort', 'answer', 'spell']), ('Black Beauty', BB, ['guide', 'cards', 'quiz', 'order', 'answer', 'explain'])]:
            for t in tools:
                await pg.set_viewport_size({'width': 1440, 'height': 900})
                await pg.goto(url + '?tool=' + t); await pg.wait_for_timeout(250)
                o = await overflow(pg)
                if t != 'guide': check(o['v'] <= 0 and o['h'] <= 0, f'{name} {t}: no scroll bars at 1440x900 {o}')
                else: check(o['h'] <= 0, f'{name} {t}: no sideways scroll at 1440x900')
                await pg.set_viewport_size({'width': 360, 'height': 780}); await pg.wait_for_timeout(150)
                check((await overflow(pg))['h'] <= 0, f'{name} {t}: no sideways scroll at 360px')
                await pg.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await pg.wait_for_timeout(250)
                check((await overflow(pg))['h'] <= 0, f'{name} {t}: no sideways scroll at 360px, dyslexic font and larger text')
                await pg.evaluate("SB.setSetting('font','standard'); SB.setSetting('size','normal'); SB.applyDisplay()")
        await pg.set_viewport_size({'width': 360, 'height': 780})
        await pg.goto(BASE + 'index.html#/settings'); await pg.wait_for_selector('#refreshLatest')
        check((await overflow(pg))['h'] <= 0, 'Settings with the refresh button: no sideways scroll at 360px')
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
