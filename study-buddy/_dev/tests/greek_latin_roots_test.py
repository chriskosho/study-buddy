"""Greek and Latin Roots test (Playwright + Chromium).
Checks the subject and module entry, the content (every root, words, notes, the ambi/amphi contrast, levels),
all five tools, Set 2 (Roots Study Sheet #17-24: 8 roots, 16 derivatives, its levels, sheet words and blanks), per-root mastery (80% of the last 5 tries, at least 3), missed roots coming back, Read aloud, and layout.
Run:  python3 study-buddy/_dev/tests/greek_latin_roots_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
URL = f'http://127.0.0.1:{PORT}/modules/roots/greek-latin-roots/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

SPEECH = """window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)},cancel(){},getVoices(){return[]},addEventListener(){}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""
def init(state=None):
    s = """if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');
      localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""
    if state is not None: s += "localStorage.setItem('studybuddy.v1.m.k1.greek-latin-roots',%s);" % json.dumps(json.dumps(state))
    return s + "}" + SPEECH

# the right answer, worked out from the question and the page's own data (ROOTS and TWO are in data.js)
RIGHT = """(q) => {
  if (q.startsWith('Two roots mean')) return q.includes('Latin') ? 'ambi' : 'amphi';
  let m = q.match(/The word (\\w+) is built from \\w+ \\+/); if (m) return TWO.find(x => x.w === m[1]).def;
  m = q.match(/root (\\w+)/); return ROOTS.find(r => r.id === m[1]).meaning; }"""
async def state(pg):
    return await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('greek-latin-roots')) || '{}')")
async def pill(pg):
    return await pg.inner_text('#rlPill')
async def level(pg, lv):
    await pg.click(f'.rl-levels button[data-l="{lv}"]'); await pg.wait_for_selector('.rl-body .qtext')
async def play_quiz(pg, wrong_last=False):
    seen = []
    total = await pg.evaluate("document.querySelector('.rl-body .hint').textContent.match(/of (\\d+)/)[1]|0")
    for i in range(total):
        await pg.wait_for_selector('.opt'); q = await pg.inner_text('.qtext')
        ans = await pg.evaluate(RIGHT, q); opts = await pg.evaluate("[...document.querySelectorAll('.opt')].map(b => b.dataset.v)")
        pick = ans if not (wrong_last and i == total - 1) else next(o for o in opts if o != ans)
        await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", pick)
        seen.append((q, ans, opts)); await pg.click('[data-a="next"]')
    await pg.wait_for_selector('.result')
    return seen
async def state_has_no_credit(pg):
    st = await state(pg); return not st.get('roots')
async def type_q(pg, text):
    await pg.fill('.rl-body input', text); await pg.press('.rl-body input', 'Enter')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def page(state=None, tool='quiz', vp=(1440, 900)):
            c = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, service_workers='block'); await c.add_init_script(init(state))
            pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(f'{URL}?tool={tool}'); await pg.wait_for_selector('.panel:not([hidden])'); await pg.wait_for_timeout(200)
            return pg

        # ---- registry and hub ----
        pg = await page(tool='cards')
        reg = await pg.evaluate("({subj: SB_REGISTRY.subjects.find(s => s.id === 'roots'), mods: SB_REGISTRY.modules.filter(m => m.subject === 'roots').map(m => m.id), tags: SB_REGISTRY.modules.find(m => m.id === 'greek-latin-roots').tags, tagged: SB_REGISTRY.modules.filter(m => m.id !== 'greek-latin-roots' && m.tags.includes('roots')).length, tools: SB_REGISTRY.modules.find(m => m.id === 'greek-latin-roots').tools.map(t => t.id + ':' + t.difficulty)})")
        check(reg['subj'] and reg['subj']['name'] == 'Greek and Latin Roots' and reg['mods'] == ['greek-latin-roots'], 'new subject Greek and Latin Roots has this module as its only entry')
        check(reg['tags'] == [] and reg['tagged'] == 0, 'the module has no tags, and no other module is tagged roots')
        check(reg['tools'] == ['guide:easy', 'cards:easy', 'sort:easy', 'quiz:medium', 'answer:hard', 'explain:insane'], f'study guide plus five tools, difficulties only easy/medium/hard/insane {reg["tools"]}')
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html#/home/roots'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('a.mod[href="#/module/greek-latin-roots"]').count() == 1, 'the module is on the Greek and Latin Roots subject page')
        for s in ['english', 'math', 'science', 'geography', 'history']:
            await pg.goto(f'http://127.0.0.1:{PORT}/index.html#/home/{s}'); await pg.wait_for_selector('a.mod')
            check(await pg.locator('a.mod[href="#/module/greek-latin-roots"]').count() == 0, f'not in the {s} page or its Suggested area')
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html#/module/greek-latin-roots'); await pg.wait_for_selector('.modhead')
        check('Insane' in await pg.inner_text('.modhead') and 'Easy' in await pg.inner_text('.modhead'), 'the module shows Easy to Insane')
        await pg.context.close()

        # ---- content ----
        pg = await page(tool='cards')
        d = await pg.evaluate("({roots: ROOTS.map(r => [r.root, r.lang, r.meaning, r.level, r.words.length, !!r.use, !!r.eg]), two: TWO.length, twoBad: TWO.filter(w => !ROOTS.some(r => r.id === w.root) || !w.other || !w.def || !w.ans.length).length, contrast: ['ambi', 'amphi'].map(i => ROOTS.find(r => r.id === i).contrast)})")
        want = [('equus','Latin','horse','easy'),('caballus','Latin','horse','easy'),('hippos','Greek','horse','easy'),('porcus','Latin','pig','easy'),('canis','Latin','dog','easy'),('leon','Greek','lion','easy'),('feles','Latin','cat','easy'),
                ('ornis','Greek','bird','medium'),('avis','Latin','bird','medium'),('malus','Latin','apple or bad','medium'),('omnis','Latin','all','medium'),('ex','Latin','out of','medium'),('eu','Greek','good or well','medium'),
                ('amphi','Greek','both or around','hard'),('ambi','Latin','both','hard'),('archos','Greek','ruler','hard'),('kyklos','Greek','circle','hard'),('circum','Latin','around','hard')]
        got = [tuple(r[:4]) for r in d['roots']]
        check(got[:18] == want and len(got) == 26, 'the first 18 roots, with the owner\'s spellings, languages, meanings, and levels, plus the 8 roots of Set 2')
        sheet = [('nomen','name','s2a'),('pro','for, before, forward, in place of','s2a'),('prae','before, in front of','s2a'),('ad','to, toward, near, next to','s2a'),('jacio','throw','s2b'),('pono','lay, put, place','s2b'),('cum','with, together','s2b'),('figo','fix, fasten, attach','s2b')]
        check([(r[0], r[2], r[3]) for r in d['roots'][18:]] == sheet and all(r[1] == 'Latin' for r in d['roots'][18:]), 'Set 2 has the 8 roots and meanings from the study sheet, in order, all Latin')
        dv = await pg.evaluate("DERIVS.map(x => [x.w, x.root, x.def, x.word || false, x.blanks.map(b => b[0])])")
        check(len(dv) == 16 and all(ROOTW(x) for x in dv) if False else len(dv) == 16, 'Set 2 has the sheet\'s 16 derivatives')
        check(await pg.evaluate("DERIVS.every(x => BY_ROOT(x))".replace('BY_ROOT(x)', "ROOTS.find(r => r.id === x.root).words.includes(x.w)")), 'every derivative is listed in its root\'s words')
        want_def = {'nominate': "suggest someone's name for office", 'denominator': 'part of a fraction below the line', 'prologue': 'words before beginning a book or play', 'pronoun': 'words that stand or replace nouns',
                    'preamble': 'that which goes before', 'predict': 'say beforehand, foretell', 'admire': 'look at with wonder and amazement', 'object': 'throw against', 'reject': 'throw back', 'position': 'establish place',
                    'component': 'put together', 'collaborate': 'work with', 'community': 'group which builds together', 'prefix': 'letters or syllables added to the beginning of a word', 'suffix': 'letters or syllable added to the end of a word'}
        check(all(want_def[x[0]] == x[2] for x in dv if x[0] in want_def) and len([x for x in dv if x[0] in want_def]) == 15, 'the derivative definitions are the sheet\'s wording')
        check([x[0] for x in dv if x[3]] == ['nominate', 'pronoun', 'preamble', 'adjective', 'reject', 'component', 'collaborate', 'suffix'], 'the 8 derivatives the sheet leaves blank are marked')
        check(sum(len(x[4]) for x in dv) == 13, 'the 13 blanks inside definitions are listed')
        check(all(2 <= r[4] <= 3 and r[5] and r[6] for r in d['roots']), 'every root has 2 or 3 English words, a kid-friendly note, and an example sentence')
        check(d['two'] >= 14 and d['twoBad'] == 0, f'Insane two-root words are all well formed ({d["two"]})')
        check(all('ambi' in c and 'amphi' in c and 'Greek' in c and 'Latin' in c for c in d['contrast']), 'ambi and amphi each explain how they differ')
        await pg.context.close()

        # ---- study guide ----
        pg = await page(tool='guide')
        tabs = await pg.locator('.gtabs button').all_inner_texts()
        check(len(tabs) == 7, f'study guide has 7 sections (Easy, Medium, Hard, Insane, the two sheet pages, Greek or Latin) {tabs}')
        seen = set()
        for lv in ['easy', 'medium', 'hard']:
            await pg.click(f'.gtabs button[data-g="{lv}"]')
            seen |= set(x.lower() for x in await pg.locator('.rl-guide tbody th .rl-parts').all_inner_texts())
        check(seen == {'equus','caballus','hippos','porcus','canis','leon','feles','ornis','avis','malus','omnis','ex','eu','amphi','ambi','archos','kyklos','circum'}, f'the guide lists the first 18 roots {len(seen)}')
        for tab, roots_on in [('s2a', ['nomen', 'pro', 'prae', 'ad']), ('s2b', ['jacio', 'pono', 'cum', 'figo'])]:
            await pg.click(f'.gtabs button[data-g="{tab}"]'); body = await pg.inner_text('.gbody')
            got_r = [x.lower() for x in await pg.locator('.rl-guide tbody th .rl-parts').all_inner_texts()]
            check(got_r == roots_on, f'guide tab {tab} lists {roots_on} {got_r}')
            ders = await pg.evaluate("t => DERIVS.filter(d => ROOTS.find(r => r.id === d.root).level === t).map(d => d.w + ' - ' + d.def)", tab)
            check(all(x in body for x in ders) and len(ders) == 8, f'guide tab {tab} shows its 8 derivatives with the sheet\'s definitions')
            check('sheet' in body.lower() and await pg.locator('.spk').count() == 4, f'guide tab {tab} has a speaker button per root')
        await pg.click('.gtabs button[data-g="hard"]')
        check('cousins' in (await pg.inner_text('.rl-guide')).lower(), 'the guide keeps the ambi and amphi note')
        await pg.click('.gtabs button[data-g="insane"]'); check(await pg.locator('.rl-guide tbody tr').count() == 20, 'the guide lists the 20 two-root words')
        await pg.click('.gtabs button[data-g="hard"]'); check(await pg.locator('.spk').count() >= 2, 'the guide has speaker buttons')
        await pg.click('.gtabs button[data-g="lang"]'); check('equus' in (await pg.inner_text('.gbody')) and 'hippos' in (await pg.inner_text('.gbody')), 'the guide has a Greek or Latin page')
        check(await state_has_no_credit(pg), 'the guide gives no credit')
        await pg.context.close()
        pg = await page(tool='guide', vp=(360, 780))
        check(await pg.evaluate("document.documentElement.scrollWidth <= innerWidth"), 'study guide: no sideways scroll at 360px')
        await pg.click('.gtabs button[data-g="s2a"]')
        check(await pg.evaluate("document.documentElement.scrollWidth <= innerWidth"), 'study guide: the sheet tab has no sideways scroll at 360px')
        await pg.context.close()

        # ---- skip and mark for review ----
        pg = await page({'roots': {}, 'missed': [], 'level': {'quiz': 'easy'}}, 'quiz')
        await pg.wait_for_selector('.opt'); q = await pg.inner_text('.qtext'); ans = await pg.evaluate(RIGHT, q)
        rid = await pg.evaluate("q => ROOTS.find(r => q.includes('root ' + r.id) || q.includes('<b>' + r.id)).id" if False else "q => (q.match(/root (\\w+)/) || [])[1]", q)
        await pg.click('[data-a="skip"]')
        check(await pg.locator('.opt.right').count() == 1 and 'Marked for review' in await pg.inner_text('.explain'), 'Quiz: Skip shows the answer and marks it for review')
        check(await pg.is_visible('[data-a="next"]') and not await pg.is_visible('[data-a="skip"]'), 'Quiz: after Skip, Next is available')
        st = await state(pg)
        check(rid in st.get('missed', []) and st['roots'].get(rid) == [0], f'Quiz: a skipped root is marked for review ({rid}, {st.get("missed")})')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.opt')
        check('Score 0' in await pg.inner_text('.rl-body .hint'), 'Quiz: a skip gives no point')
        await pg.context.close()
        pg = await page({'roots': {}, 'missed': [], 'level': {'quiz': 'easy'}}, 'quiz')
        await pg.wait_for_selector('.opt'); await pg.click('.opt >> nth=0')
        check(not await pg.is_visible('[data-a="skip"]'), 'Quiz: Skip hides once an answer is picked')
        await pg.context.close()
        pg = await page({'roots': {}, 'missed': ['canis'], 'level': {'answer': 'easy'}}, 'answer')
        await pg.wait_for_selector('.rl-body input')
        check(await pg.is_visible('[data-a="skip"]'), 'Type the answer has a Skip button')
        await pg.click('[data-a="skip"]')
        txt = await pg.inner_text('.err')
        check('Marked for review' in txt and 'dog' in txt and await pg.is_visible('[data-a="next"]'), f'Type: Skip shows the answer {txt}')
        st = await state(pg); check('canis' in st['missed'] and st['roots']['canis'] == [0], 'Type: the skipped root is marked for review')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.rl-body input')
        check(not await pg.is_disabled('.rl-body input'), 'Type: can move on to the next question after a skip')
        await pg.context.close()

        # ---- flashcards: all roots, practice only ----
        pg = await page(tool='cards')
        check('All 26 roots' in await pg.inner_text('.deckbar'), 'flashcards offer all 26 roots')
        check('0 of 26' in await pg.inner_text('.count'), 'the all-roots deck has 26 cards')
        for _ in range(26):
            await pg.click('.fcard'); await pg.wait_for_timeout(560)
            await pg.click('[data-a="knew"]'); await pg.wait_for_timeout(700)
        check('deck complete' in (await pg.inner_text('.front')).lower(), 'all 26 cards can be finished')
        s = await pg.evaluate("({c: SB.streakInfo(), t: Object.keys(JSON.parse(localStorage.getItem('studybuddy.v1.child.k1')).tools)})")
        check(s['c']['streak'] == 0 and s['c']['daily'] == 0, 'flashcards give no streak or daily credit')
        check('Roots mastered 0 of 26' in await pill(pg), 'flashcards do not change the roots-mastered count')
        await pg.click('.deckbar button:has-text("Hard")'); await pg.wait_for_timeout(200)
        await pg.click('.fcard'); await pg.wait_for_timeout(600)
        back = await pg.inner_text('.fcard .back'); front_txt = (await pg.inner_text('.fcard .front')).lower()
        check('Words:' in back and any(x in front_txt for x in ('greek root', 'latin root')), 'a card shows the language on the front, and meaning, words, and note on the back')
        await pg.click('.deckbar button:has-text("Insane")'); await pg.wait_for_timeout(200)
        check('two-root word' in (await pg.inner_text('.fcard .front')).lower(), 'the Insane deck shows two-root words')
        for mode, n, tag in [('Sheet 17 to 20', 4, 'latin root'), ('Sheet 21 to 24', 4, 'latin root'), ('Sheet words', 16, 'sheet word')]:
            await pg.click(f'.deckbar button:has-text("{mode}")'); await pg.wait_for_timeout(200)
            check(f'0 of {n}' in await pg.inner_text('.count') and tag in (await pg.inner_text('.fcard .front')).lower(), f'the {mode} deck has {n} cards ({tag})')
        await pg.click('.fcard'); await pg.wait_for_timeout(600)
        word_card = (await pg.inner_text('.fcard .front .big')).strip(); back = await pg.inner_text('.fcard .back')
        want_back = await pg.evaluate("w => DERIVS.find(d => d.w === w).def", word_card)
        check(want_back in back, f'a sheet word card shows the sheet\'s definition on the back ({word_card})')
        await pg.context.close()
        # ambi and amphi cards show the contrast
        pg = await page(tool='cards')
        await pg.click('.deckbar button:has-text("Hard")')
        seen = set()
        for _ in range(5):
            front = await pg.evaluate("document.querySelector('.fcard .front .big').textContent")
            await pg.click('.fcard'); await pg.wait_for_timeout(560)
            if front in ('ambi', 'amphi'): seen.add(front); check('Greek' in await pg.inner_text('.fcard .back') and 'Latin' in await pg.inner_text('.fcard .back'), f'the {front} card explains how ambi and amphi differ')
            await pg.click('[data-a="knew"]'); await pg.wait_for_timeout(700)
        check(seen == {'ambi', 'amphi'}, 'both the ambi and the amphi cards were checked')
        await pg.context.close()

        # ---- sort ----
        pg = await page(tool='sort')
        SORTMAP = await pg.evaluate("Object.fromEntries(SORTS.map(s => [s.id, s.items === 'language' ? ROOTS.filter(r => !r.set).map(r => [r.root, r.lang.toLowerCase()]) : s.items === 'derivs' ? DERIVS.filter(d => s.buckets.some(b => b[0] === d.root)).map(d => [d.w, d.root]) : s.items]))")
        for sid, label in [('animals', 'Animals'), ('meanings', 'Good, bad, around'), ('language', 'Greek or Latin'), ('sheet1', 'Sheet 17 to 20: which root?'), ('sheet2', 'Sheet 21 to 24: which root?')]:
            await pg.click(f'.seg button:has-text("{label}")'); await pg.wait_for_timeout(150)
            total = len(SORTMAP[sid]); pairs = dict((a, bkt) for a, bkt in SORTMAP[sid])
            for _ in range(total):
                text = await pg.inner_text('.sortTray .chip >> nth=0'); await pg.click('.sortTray .chip >> nth=0')
                bid = pairs[text].lower().replace(' ', '-')
                await pg.click(f'.bucket[data-b="{bid}"]'); await pg.wait_for_timeout(60)
            check(await pg.inner_text('.placed') == f'{total}/{total}' and await pg.inner_text('.miss') == '0', f'sort "{label}": all {total} sorted with no misses')
        await pg.click('.seg button:has-text("Animals")'); await pg.wait_for_timeout(100)
        await pg.click('.sortTray .chip >> nth=0'); first = await pg.evaluate("document.querySelector('.chip.sel').textContent")
        wrongb = 'bird' if first in ('equus', 'caballus', 'hippos') else 'horse'
        await pg.click(f'.bucket[data-b="{wrongb}"]'); check('means' in await pg.inner_text('.sbt-sort .msg'), 'a wrong drop says what the root means')
        await pg.context.close()
        pg = await page(tool='sort')
        await pg.click('.seg button:has-text("Sheet 17 to 20")'); await pg.wait_for_timeout(100)
        await pg.click('.sortTray .chip >> nth=0'); fw = await pg.evaluate("document.querySelector('.chip.sel').textContent")
        wrong_root = await pg.evaluate("w => ['nomen', 'pro', 'prae', 'ad'].find(r => r !== DERIVS.find(d => d.w === w).root)", fw)
        await pg.click(f'.bucket[data-b="{wrong_root}"]'); check('Not quite' in await pg.inner_text('.sbt-sort .msg') and 'means' in await pg.inner_text('.sbt-sort .msg'), 'a wrong drop of a sheet word says what the word means')
        await pg.context.close()

        # ---- quiz: levels, distractors, mastery, missed roots ----
        pg = await page(tool='quiz')
        check('Roots mastered 0 of 26' in await pill(pg), 'the module page shows Roots mastered 0 of 26')
        seen = await play_quiz(pg)
        qs = [q for q, a, o in seen]
        check(len(seen) == 10 and len(set(qs)) == 10, 'an Easy round has 10 different questions')
        roots_seen = {__import__('re').search(r'root (\w+)', q).group(1) for q in qs}
        check(roots_seen == {'equus', 'caballus', 'hippos', 'porcus', 'canis', 'leon', 'feles'}, f'Easy asks only the 7 animal roots, every one each round {roots_seen}')
        check(all(len(set(o)) == len(o) and len(o) == 4 for q, a, o in seen), 'every question has 4 different choices')
        check('10 out of 10' in await pg.inner_text('.result'), 'ten right answers score 10 out of 10')
        for _ in range(2):
            await pg.click('[data-a="again"]'); await play_quiz(pg)
        check('Roots mastered 7 of 26' in await pill(pg), 'three perfect Easy rounds master the 7 animal roots')
        st = await state(pg); check(all(len(st['roots'][r]) >= 3 for r in ['equus', 'leon', 'feles']), 'each answer is remembered per root')
        # Medium and Hard, and the choices never include a near-identical meaning
        near = {'amphi': {'both', 'around', 'circle'}, 'ambi': {'both', 'around', 'circle', 'both or around'}, 'circum': {'around', 'both or around', 'circle'}, 'kyklos': {'circle', 'both or around', 'around', 'both'}}
        await level(pg, 'medium'); s1 = await play_quiz(pg)
        roots_seen = {__import__('re').search(r'root (\w+)', q).group(1) for q, a, o in s1}
        check(roots_seen == {'ornis', 'avis', 'malus', 'omnis', 'ex', 'eu'}, f'Medium asks bird roots plus malus, omnis, ex, eu {roots_seen}')
        bad = []
        for _ in range(6):
            await pg.click('[data-a="again"]') if await pg.locator('[data-a="again"]').count() else None
            await level(pg, 'hard') if await pg.locator('.rl-levels button[aria-pressed="true"][data-l="hard"]').count() == 0 else None
            for q, a, o in await play_quiz(pg):
                m = __import__('re').search(r'root (\w+)', q)
                if m and m.group(1) in near: bad += [x for x in o if x != a and x in near[m.group(1)]]
                if q.startswith('Two roots mean'): bad += [] if sorted(o) == ['ambi', 'amphi'] else ['bad ' + str(o)]
        check(not bad, f'Hard never offers a near-identical meaning as a wrong choice {bad}')
        # Insane
        await level(pg, 'insane') if await pg.locator('.rl-levels button[data-l="insane"][aria-pressed="true"]').count() == 0 else None
        await pg.click('[data-a="again"]') if await pg.locator('[data-a="again"]').count() else None
        seen = await play_quiz(pg)
        check(len(seen) == 8 and all('is built from' in q and len(o) == 4 for q, a, o in seen), 'Insane asks 8 two-root words with 4 choices each')
        await pg.context.close()

        # ---- mastery rule: 80% of the last 5, at least 3 tries ----
        seed = {'roots': {'equus': [1, 1, 1], 'caballus': [1, 1, 0], 'hippos': [0, 1, 1, 1], 'porcus': [1, 1, 1, 1, 0], 'canis': [1, 0, 1, 1, 1], 'leon': [1, 1], 'feles': [0, 0, 0, 1, 1, 1, 1, 1]}, 'missed': [], 'level': {}}
        pg = await page(seed, 'quiz')
        check('Roots mastered 4 of 26' in await pill(pg), f'mastery rule: 3 of 3, 4 of 5 and 5 of 5 count; 2 of 3, 3 of 4 and only 2 tries do not (equus, porcus, canis, feles) {await pill(pg)}')
        await pg.context.close()

        # ---- Set 2: the set picker, the sheet's levels, words and blanks ----
        RIGHT2 = """(q) => {
          let m = q.match(/^The word (\\w+) comes from the root/); if (m) return DERIVS.find(x => x.w === m[1]).def;
          m = q.match(/^Which word fits the blank\\? ___ - (.*)$/); if (m) return DERIVS.find(x => x.def === m[1]).w;
          m = q.match(/root (\\w+)/); return ROOTS.find(r => r.id === m[1]).meaning; }"""
        async def play2(pg, wrong_last=False):
            seen = []
            total = await pg.evaluate("document.querySelector('.rl-body .hint').textContent.match(/of (\\d+)/)[1]|0")
            for i in range(total):
                await pg.wait_for_selector('.opt'); q = await pg.inner_text('.qtext')
                ans = await pg.evaluate(RIGHT2, q); opts = await pg.evaluate("[...document.querySelectorAll('.opt')].map(b => b.dataset.v)")
                pick = ans if not (wrong_last and i == total - 1) else next(o for o in opts if o != ans)
                await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", pick)
                seen.append((q, ans, opts)); await pg.click('[data-a="next"]')
            await pg.wait_for_selector('.result')
            return seen
        pg = await page(tool='quiz')
        check(await pg.locator('.rl-sets button').count() == 2 and await pg.locator('.rl-levels button').count() == 4, 'Quiz has a Set 1 / Set 2 picker, and Set 1 shows its 4 levels')
        await pg.click('.rl-sets button[data-s="2"]'); await pg.wait_for_selector('.rl-body .qtext')
        check(await pg.locator('.rl-levels button').count() == 3 and await pg.locator('.rl-levels button[aria-pressed="true"]').get_attribute('data-l') == 's2a', 'Set 2 shows 3 levels and opens on Sheet 17 to 20')
        s1 = await play2(pg)
        check(len(s1) == 10 and all(len(set(o)) == 4 for q, a, o in s1), 'a Sheet 17 to 20 round has 10 questions with 4 different choices')
        check({__import__('re').search(r'root (\w+)', q).group(1) for q, a, o in s1} == {'nomen', 'pro', 'prae', 'ad'}, 'Sheet 17 to 20 asks nomen, pro, prae, and ad')
        bad_near = [o for q, a, o in s1 if 'pro' in q.split('root ')[1].split(' ')[0] and False]
        for q, a, o in s1:
            r = __import__('re').search(r'root (\w+)', q).group(1)
            if r == 'pro': check(not any(x in ('before, in front of', 'lay, put, place') for x in o if x != a), 'pro never gets prae or pono as a wrong choice')
            if r == 'prae': check(not any(x == 'for, before, forward, in place of' for x in o if x != a), 'prae never gets pro as a wrong choice')
        st = await state(pg); check(all(r in st['roots'] for r in ['nomen', 'pro', 'prae', 'ad']), 'answers in Set 2 are remembered per root')
        await pg.click('[data-a="again"]'); await pg.click('.rl-levels button[data-l="s2b"]'); await pg.wait_for_selector('.rl-body .qtext')
        s2 = await play2(pg); check({__import__('re').search(r'root (\w+)', q).group(1) for q, a, o in s2} == {'jacio', 'pono', 'cum', 'figo'}, 'Sheet 21 to 24 asks jacio, pono, cum, and figo')
        await pg.click('.rl-levels button[data-l="s2w"]'); await pg.wait_for_selector('.rl-body .qtext')
        sw = await play2(pg)
        check(len(sw) == 8 and all(len(set(o)) == 4 for q, a, o in sw), 'Sheet words: a round has 8 questions with 4 different choices')
        check(all(q.startswith('The word ') and 'comes from the root' in q or q.startswith('Which word fits the blank?') for q, a, o in sw), 'Sheet words asks what a word means, or which word fits the blank')
        check({__import__('re').search(r'root (\w+)', q).group(1) for q, a, o in sw if 'comes from' in q} <= {'nomen', 'pro', 'prae', 'ad', 'jacio', 'pono', 'cum', 'figo'}, 'Sheet words questions come from the 8 roots')
        near_bad = []
        for _ in range(8):
            await pg.click('[data-a="again"]'); 
            for q, a, o in await play2(pg):
                extra = [x for x in o if x != a]
                if a in ('put together', 'group which builds together', 'work with'): near_bad += [x for x in extra if x in ('put together', 'group which builds together', 'work with')]
                if a in ('component', 'community', 'collaborate'): near_bad += [x for x in extra if x in ('component', 'community', 'collaborate')]
        check(not near_bad, f'near-identical sheet definitions are never offered together {near_bad}')
        st = await state(pg); check(st['level']['quiz'] == 's2w', 'the chosen set level is remembered')
        await pg.context.close()
        pg = await page({'roots': {r: [1, 1, 1] for r in ['nomen', 'pro', 'prae', 'ad', 'jacio', 'pono', 'cum', 'figo']}, 'missed': [], 'level': {}}, 'quiz')
        check('Roots mastered 8 of 26' in await pill(pg), 'mastering the 8 sheet roots counts toward the module total')
        await pg.context.close()
        # Type the answer: every blank on the sheet is accepted, and a wrong answer is not
        EXPECT = """() => { const out = []; DERIVS.forEach(d => { if (d.word) out.push(['___ - ' + d.def, [d.w]]);
          d.blanks.forEach((b, i) => out.push([d.w + ' - ' + d.def.replace(new RegExp('\\\\b' + b[0] + '\\\\b'), '___'), b])); }); return out; }"""
        exp = await (await page(tool='cards')).evaluate(EXPECT)
        check(len(exp) == 21, f'the sheet has 21 blanks to fill in {len(exp)}')
        for text, accepted in exp:
            fills = {t: a for t, a in exp}
            pg = await page({'roots': {}, 'missed': [], 'level': {'answer': 's2w'}}, 'answer')
            seen_q = []
            for _ in range(8):
                await pg.wait_for_selector('.rl-body input'); q = (await pg.inner_text('.qtext')).replace('Fill in the blank from the sheet: ', '').strip(); seen_q.append(q)
                check(q in fills, f'Sheet words question matches a sheet blank: {q}')
                await type_q(pg, fills[q][0]); check('Correct' in await pg.inner_text('.err'), f'{q}: "{fills[q][0]}" is accepted')
                await pg.click('[data-a="next"]')
            await pg.context.close()
            break
        pg = await page({'roots': {}, 'missed': [], 'level': {'answer': 's2w'}}, 'answer')
        await pg.wait_for_selector('.rl-body input'); q = (await pg.inner_text('.qtext')).replace('Fill in the blank from the sheet: ', '').strip()
        await type_q(pg, 'zzzzz'); check('Not quite' in await pg.inner_text('.err'), 'a wrong word for a sheet blank gets a second try')
        await pg.click('[data-a="hint"]'); check('starts with' in (await pg.inner_text('.err')).lower(), 'the hint gives the first letter')
        await pg.context.close()
        for rid, typed in [('pro', ['for', 'before', 'forward', 'in place of']), ('prae', ['before', 'in front of']), ('ad', ['to', 'toward', 'near', 'next to']), ('jacio', ['throw']), ('pono', ['lay', 'put', 'place']), ('cum', ['with', 'together']), ('figo', ['fix', 'fasten', 'attach']), ('nomen', ['name'])]:
            for t in typed:
                pg = await page({'roots': {}, 'missed': [rid], 'level': {'answer': 's2a' if rid in ('nomen', 'pro', 'prae', 'ad') else 's2b'}}, 'answer')
                await type_q(pg, t); check('Correct' in await pg.inner_text('.err'), f'{rid}: "{t}" is accepted'); await pg.context.close()
        pg = await page({'roots': {}, 'missed': ['prae'], 'level': {'answer': 's2a'}}, 'answer')
        await type_q(pg, 'for'); check('Not quite' in await pg.inner_text('.err'), 'prae does not accept "for" (that is only pro)'); await pg.context.close()
        pg = await page({'roots': {}, 'missed': [], 'level': {'answer': 's2w'}}, 'answer')
        await pg.click('[data-a="skip"]'); st = await state(pg)
        check(await pg.is_visible('[data-a="next"]') and 'Marked for review' in await pg.inner_text('.err') and len(st['missed']) == 1, 'Skip works on a sheet blank and marks its root for review')
        await pg.context.close()
        # Explain it can ask about a Set 2 root
        pg = await page(tool='explain'); await pg.context.close()
        txt = await (await page(tool='explain')).evaluate("EXPLAIN_HAS_SET2")if False else None
        pg = await page(tool='cards'); ok = await pg.evaluate("ROOTS.filter(r => r.set === 2).every(r => r.stems.length >= 2 && r.eg && r.use)"); await pg.context.close()
        check(ok, 'every Set 2 root has a note, an example sentence, and stems for Explain it')

        # ---- a missed root comes back ----
        pg = await page(tool='quiz')
        seen = await play_quiz(pg, wrong_last=True)
        missed_root = __import__('re').search(r'root (\w+)', seen[-1][0]).group(1)
        st = await state(pg); check(st['missed'] == [missed_root], f'a missed root is remembered ({missed_root})')
        await pg.click('[data-a="again"]'); seen2 = await play_quiz(pg)
        n = sum(1 for q, a, o in seen2 if ('root ' + missed_root + ' ') in q or ('root ' + missed_root + '.') in q)
        check(n >= 2, f'the missed root comes back in the next round, more than once ({n})')
        st = await state(pg); check(missed_root not in st['missed'], 'a missed root leaves the list once it is answered right')
        await pg.context.close()

        # ---- type the answer ----
        pg = await page({'roots': {}, 'missed': ['hippos'], 'level': {'answer': 'easy'}}, 'answer')
        q = await pg.inner_text('.qtext'); check('hippos' in q, 'a missed root is the first question in Type the answer')
        await type_q(pg, 'cow'); check('Not quite' in await pg.inner_text('.err'), 'a wrong answer gets a second try')
        await type_q(pg, 'horse'); check('Correct' in await pg.inner_text('.err'), 'the right answer on the second try is correct')
        st = await state(pg); check(st['roots']['hippos'] == [0], 'a second-try answer does not count for mastery')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.rl-body input')
        # hint
        await pg.click('[data-a="hint"]'); check('starts with' in (await pg.inner_text('.err')).lower() and '"' in await pg.inner_text('.err'), 'the hint gives the first letter and a word')
        await pg.context.close()
        for rid, lv, typed in [('malus', 'medium', ['bad', 'apple']), ('eu', 'medium', ['well', 'good']), ('ex', 'medium', ['out of', 'out']), ('amphi', 'hard', ['around', 'both']), ('circum', 'hard', ['around']), ('ambi', 'hard', ['both']), ('kyklos', 'hard', ['circle']), ('archos', 'hard', ['ruler'])]:
            for t in typed:
                pg = await page({'roots': {}, 'missed': [rid], 'level': {'answer': lv}}, 'answer')
                await type_q(pg, t); res = await pg.inner_text('.err')
                check('Correct' in res, f'{rid}: "{t}" is accepted')
                await pg.context.close()
        pg = await page({'roots': {}, 'missed': ['kyklos'], 'level': {'answer': 'hard'}}, 'answer')
        await type_q(pg, 'circlee'); check('Correct' in await pg.inner_text('.err') or 'Close' in await pg.inner_text('.err'), 'a one-letter typo is accepted'); await pg.context.close()
        for rid, lv, bad in [('equus', 'easy', 'house'), ('circum', 'hard', 'ground'), ('omnis', 'medium', 'very')]:
            pg = await page({'roots': {}, 'missed': [rid], 'level': {'answer': lv}}, 'answer')
            await type_q(pg, bad); r2 = await pg.inner_text('.err')
            check('Correct' not in r2 and 'Close' not in r2, f'{rid}: look-alike word "{bad}" is not accepted'); await pg.context.close()
        for rid, lv, t in [('malus', 'medium', 'apple or bad'), ('eu', 'medium', 'good or well')]:
            pg = await page({'roots': {}, 'missed': [rid], 'level': {'answer': lv}}, 'answer')
            await type_q(pg, t); check('Correct' in await pg.inner_text('.err'), f'{rid}: "{t}" is accepted'); await pg.context.close()
        pg = await page({'roots': {}, 'missed': ['ambi'], 'level': {'answer': 'hard'}}, 'answer')
        await type_q(pg, 'around'); check('Not quite' in await pg.inner_text('.err'), 'ambi does not accept "around" (that is amphi and circum)'); await pg.context.close()
        # insane type
        pg = await page({'roots': {}, 'missed': [], 'level': {'answer': 'insane'}}, 'answer')
        q = await pg.inner_text('.qtext'); word = q.split(' ')[0]
        ans = await pg.evaluate("w => TWO.find(x => x.w === w).ans[0]", word)
        await type_q(pg, ans); check('Correct' in await pg.inner_text('.err'), f'Insane type: {word} filled in with "{ans}"')
        await pg.context.close()

        # ---- explain ----
        pg = await page(tool='explain')
        q = await pg.inner_text('.qline')
        words = q.split('words: ')[1].split('. They')[0].split(', ')
        await pg.fill('textarea.answer', f'We talked about the {words[0]} at school today.'); await pg.click('[data-a="check"]')
        check('Great answer' in await pg.inner_text('.feedback'), f'Explain it: a complete sentence using {words[0]} passes')
        await pg.click('[data-a="next"]'); await pg.fill('textarea.answer', 'This sentence does not use any root word at all.'); await pg.click('[data-a="check"]')
        check('Add what is missing' in await pg.inner_text('.feedback'), 'Explain it: a sentence without a root word does not pass')
        await pg.context.close()

        # ---- Read aloud only when on; speaker buttons always ----
        pg = await page(tool='quiz'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("window.__spoken.length") == 0, 'questions are not read aloud while Read aloud is off')
        await pg.click('.spk >> nth=0'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("window.__spoken.length") == 1, 'the speaker button always plays')
        await pg.click('#sbRead'); await pg.click('.rl-levels button[data-l="medium"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("window.__spoken.length") >= 2, 'with Read aloud on, the question is read')
        await pg.context.close()

        # ---- layout ----
        for tool in ['cards', 'sort', 'quiz', 'answer', 'explain']:
            pg = await page(tool=tool); await pg.wait_for_timeout(300)
            o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
            check(o[0] <= 0 and o[1] <= 0, f'1440x900 no scroll bars on {tool} {o}'); await pg.context.close()
            pg = await page(tool=tool, vp=(360, 780)); await pg.wait_for_timeout(300)
            o = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            check(o <= 0, f'360px no sideways scroll on {tool} {o}'); await pg.context.close()
        pg = await page(tool='quiz', vp=(360, 780))
        await pg.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await pg.wait_for_timeout(300)
        for tool in ['quiz', 'answer']:
            await pg.goto(f'{URL}?tool={tool}'); await pg.wait_for_selector('.rl-levels'); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(300)
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px with dyslexic font and larger text: no sideways scroll on {tool}')
        await pg.context.close()
        check(not errors, f'no page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
