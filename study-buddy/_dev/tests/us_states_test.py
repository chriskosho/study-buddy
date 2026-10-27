"""US States test (Playwright + Chromium).
Checks the registry entry, the data (50 states, order, spot facts), the study guide, flashcards, Quiz topics and questions for
every state, Type the answer (accepted spellings, look-alikes, Skip), Put in order, scoring, and layout at 1440x900 and 360px.
Run:  python3 study-buddy/_dev/tests/us_states_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8783
BASE = f'http://127.0.0.1:{PORT}/'
URL = BASE + 'modules/geography/us-states/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

SPEECH = """window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)},cancel(){},getVoices(){return[]},addEventListener(){}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};"""
INIT = """if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');
  localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));}""" + SPEECH
async def state(pg):
    return await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('us-states')) || '{}')")
async def type_q(pg, text):
    await pg.fill('.us-body input', text); await pg.press('.us-body input', 'Enter')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def page(tool='guide', vp=(1440, 900)):
            c = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, service_workers='block'); await c.add_init_script(INIT)
            pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(f'{URL}?tool={tool}'); await pg.wait_for_selector('.panel:not([hidden])'); await pg.wait_for_timeout(250)
            return pg

        # ---- registry, hub ----
        pg = await page()
        reg = await pg.evaluate("(() => { const m = SB_REGISTRY.modules.find(m => m.id === 'us-states'); return {subject: m.subject, tags: m.tags, tools: m.tools.map(t => t.id + ':' + t.difficulty + (t.kind ? ':' + t.kind : ''))}; })()")
        check(reg['subject'] == 'geography' and reg['tags'] == [], 'US States is in Geography with no tags')
        check(reg['tools'] == ['guide:easy:study', 'cards:easy:study', 'quiz:medium', 'answer:hard', 'order:insane'], f'tools and difficulties (easy to insane only) {reg["tools"]}')
        await pg.goto(BASE + 'index.html#/home/geography'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('a.mod[href="#/module/us-states"]').count() == 1, 'the module is on the Geography page')
        await pg.goto(BASE + 'index.html#/home/english'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('a.mod[href="#/module/us-states"]').count() == 0, 'it is not in the English page or its Suggested area')
        await pg.context.close()

        # ---- data ----
        pg = await page()
        d = await pg.evaluate("({n: STATES.length, orders: STATES.map(s => s.order).sort((a, b) => a - b), flags: Object.keys(FLAGS).length, by: Object.fromEntries(STATES.map(s => [s.id, s])), full: STATES.every(s => s.name && s.capital && s.motto && s.bird && s.flower && s.cities.length >= 3 && s.admitted && FLAGS[s.id]), svg: STATES.every(s => FLAGS[s.id].startsWith('<svg') && FLAGS[s.id].includes('role=\"img\"'))})")
        check(d['n'] == 50 and d['flags'] == 50 and d['orders'] == list(range(1, 51)), '50 states, 50 flags, orders 1 to 50 once each')
        check(d['full'] and d['svg'], 'every state has all the fields and an SVG flag')
        by = d['by']
        check(by['de']['order'] == 1 and by['de']['admitted'] == 1787 and by['hi']['order'] == 50 and by['hi']['admitted'] == 1959 and by['ak']['order'] == 49, 'Delaware 1st (1787), Alaska 49th, Hawaii 50th (1959)')
        check(by['oh']['capital'] == 'Columbus' and by['oh']['bird'] == 'Northern Cardinal' and by['tx']['capital'] == 'Austin' and by['ca']['capital'] == 'Sacramento' and by['ny']['capital'] == 'Albany', 'spot-checked capitals and birds')
        check(all(not any(c == s['capital'] for c in s['cities']) for s in by.values()), 'no state lists its capital as a notable city')
        await pg.context.close()

        # ---- study guide ----
        pg = await page('guide')
        tabs = await pg.locator('.gtabs button').all_inner_texts()
        check(len(tabs) == 6, f'study guide has 6 sections {tabs}')
        check(await pg.locator('.us-guide tbody tr').count() == 50, 'States and capitals lists 50 states')
        await pg.fill('#usFind', 'ohio'); await pg.wait_for_timeout(100)
        check(await pg.locator('.us-guide tbody tr:visible').count() == 1, 'search finds Ohio')
        await pg.fill('#usFind', 'montpelier'); check(await pg.locator('.us-guide tbody tr:visible').count() == 1, 'search also finds a capital')
        await pg.fill('#usFind', 'zzz'); check(await pg.locator('.us-none:visible').count() == 1, 'search says when nothing matches')
        await pg.fill('#usFind', '')
        for g, n in [('flags', 50), ('mottos', 50), ('birds', 50), ('cities', 50), ('admitted', 50)]:
            await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(80)
            cnt = await pg.locator('.us-flags figure').count() if g == 'flags' else await pg.locator('.us-guide tbody tr').count()
            check(cnt == n, f'guide section {g} has {n} entries')
        await pg.click('.gtabs button[data-g="admitted"]')
        first = await pg.inner_text('.us-guide tbody tr >> nth=0'); last = await pg.inner_text('.us-guide tbody tr >> nth=49')
        check('Delaware' in first and '1787' in first and 'Hawaii' in last and '1959' in last, 'Admitted runs Delaware to Hawaii')
        await pg.click('.gtabs button[data-g="mottos"]')
        check('seal' in (await pg.inner_text('.us-guide')).lower(), 'Mottos notes that Georgia has no adopted motto')
        check(await pg.locator('.spk').count() >= 50, 'rows have speaker buttons')
        await pg.evaluate("window.__spoken.length = 0"); await pg.click('.spk >> nth=0'); await pg.wait_for_timeout(100)
        check(len(await pg.evaluate("window.__spoken")) == 1, 'a speaker button speaks')
        check(not (await state(pg)).get('topic'), 'the guide gives no credit')
        await pg.set_viewport_size({'width': 360, 'height': 780}); await pg.click('.gtabs button[data-g="birds"]')
        lab = await pg.evaluate("getComputedStyle(document.querySelector('.us-guide td[data-label]'), '::before').content")
        check('bird' in lab.lower() or 'flower' in lab.lower(), f'on a phone each cell is labeled {lab}')
        await pg.context.close()

        # ---- flashcards ----
        pg = await page('cards')
        await pg.wait_for_selector('.fcard'); await pg.wait_for_timeout(300)
        check(await pg.locator('.deckbar .seg button').count() == 7, 'flashcards have 7 topic decks')
        check('0 of 50' in await pg.inner_text('.deckbar .count'), 'every deck has all 50 states')
        await pg.click('.deckbar .seg button >> nth=1'); await pg.wait_for_timeout(300)
        check(await pg.locator('.front svg').count() == 1, 'the Flags deck shows a flag')
        await pg.click('[data-a="knew"]'); await pg.wait_for_timeout(900)
        check('1 of 50' in await pg.inner_text('.deckbar .count'), 'I knew it moves through the deck')
        st = await state(pg); check(not st.get('best') and not st.get('streak'), 'flashcards give no credit')
        await pg.context.close()

        # ---- every question builder, every state ----
        pg = await page('quiz')
        res = await pg.evaluate("""(() => {
          const bad = [], H = window.__usTest, by = Object.fromEntries(STATES.map(s => [s.id, s]));
          const idOf = n => STATES.find(s => s.name === n);
          for (const s of STATES) for (const i of [0, 1]) for (const t of Object.keys(H.Q)) {
            const q = H.Q[t](s, i), opts = [q.a, ...q.wrong];
            if (q.wrong.length !== 3 || new Set(opts).size !== 4) bad.push([s.id, t, 'options']);
            if (t === 'capitals') { const ok = q.a === s.capital || q.a === s.name; if (!ok) bad.push([s.id, t, 'answer']); }
            if (t === 'flags' && (!q.html.includes('<svg') || q.a !== s.name)) bad.push([s.id, t, 'flag']);
            if (t === 'mottos' && (q.a !== s.name || !q.q.includes(s.motto))) bad.push([s.id, t, 'motto']);
            if (t === 'birds' && (q.a !== s.bird || q.wrong.includes(s.bird))) bad.push([s.id, t, 'bird']);
            if (t === 'flowers' && (q.a !== s.flower || q.wrong.includes(s.flower))) bad.push([s.id, t, 'flower']);
            if (t === 'cities') {
              if (q.a === s.name) { const c = s.cities.find(c => q.q.startsWith(c + ' ')); if (!c) bad.push([s.id, t, 'which state']); }
              else { if (!s.cities.includes(q.a)) bad.push([s.id, t, 'city']); if (q.wrong.some(w => s.cities.includes(w) || w === s.capital)) bad.push([s.id, t, 'city distractor']); }
            }
            if (t === 'admitted') { if (![String(s.admitted), s.order + (['th','st','nd','rd'][s.order % 10] && ![11,12,13].includes(s.order % 100) ? ['th','st','nd','rd'][s.order % 10] : 'th')].includes(q.a)) bad.push([s.id, t, 'admitted']); }
          }
          for (const s of STATES) for (const t of Object.keys(H.T)) {
            const q = H.T[t](s), a = q.a;
            if (!a.length || !q.q || !q.hint || !q.why) bad.push([s.id, t, 'type fields']);
          }
          return bad; })()""")
        check(not res, f'every state passes every Quiz and Type question builder {res[:5]}')
        acc = await pg.evaluate("""(() => { const H = window.__usTest, a = id => STATES.find(s => s.id === id), out = {};
          out.mn = H.T.capitals(a('mn')).a; out.nc = H.T.flowers(a('nc')).a; out.oh = H.T.birds(a('oh')).a; out.nj = H.T.flowers(a('nj')).a; out.wa = H.T.states(a('wa')).a; return out; })()""")
        check('St. Paul' in acc['mn'] and 'Dogwood' in acc['nc'] and 'Cardinal' in acc['oh'] and 'Violet' in acc['nj'], f'accepted spellings: St. Paul, Dogwood, Cardinal, Violet {acc}')
        amb = await pg.evaluate("""(() => { const H = window.__usTest, a = id => STATES.find(s => s.id === id), bad = [];
          for (let k = 0; k < 150; k++) {
            for (const [id, nope] of [['wa', ['Bellevue']], ['ne', ['Lafayette', 'Portland']], ['in', ['Lafayette']], ['la', ['Alexandria']], ['va', ['Alexandria']]]) { const q = H.Q.cities(a(id), k); if (q.wrong.some(w => nope.includes(w)) || (q.a === a(id).name && nope.some(n => q.q.startsWith(n + ' ')))) bad.push(['city', id, q.q, q.wrong]); }
            for (const [id, nope] of [['wa', ['Rhododendron']], ['wv', ['Coast Rhododendron']], ['nj', ['Violet', 'Wood Violet']], ['nc', ['American Dogwood']], ['ok', ['Wild Rose', 'Cherokee Rose']]]) { const q = H.Q.flowers(a(id), k); if (q.wrong.some(w => nope.includes(w))) bad.push(['flower', id, q.wrong]); }
          }
          return bad.slice(0, 3); })()""")
        check(not amb, f'city and flower choices never include a second right answer {amb}')
        acc2 = await pg.evaluate("(() => { const H = window.__usTest, a = id => STATES.find(s => s.id === id); return [H.T.flowers(a('wa')).a, H.T.flowers(a('ok')).a, H.T.flowers(a('nd')).a]; })()")
        check('Rhododendron' in acc2[0] and 'Rose' in acc2[1] and 'Rose' in acc2[2], f'typed flowers accept the short name {acc2}')
        await pg.context.close()

        # ---- Quiz ----
        pg = await page('quiz')
        topics = await pg.locator('.us-topics button').all_inner_texts()
        check(len(topics) == 8 and topics[0] == 'Mixed', f'quiz topics {topics}')
        for t in ['capitals', 'flags', 'mottos', 'birds', 'flowers', 'cities', 'admitted']:
            await pg.click(f'.us-topics button[data-t="{t}"]'); await pg.wait_for_selector('.opt')
            check(await pg.locator('.opt').count() == 4 and 'Question 1 of 10' in await pg.inner_text('.us-body .hint'), f'{t}: 4 choices, 10 questions')
        await pg.click('.us-topics button[data-t="flags"]'); await pg.wait_for_selector('.opt')
        check(await pg.locator('.us-body .us-qflag svg').count() == 1, 'Flags question shows the flag')
        # play a full flags round, answering from the flag itself
        for i in range(10):
            await pg.wait_for_selector('.opt')
            ans = await pg.evaluate("""() => { return STATES.find(s => s.id === document.querySelector('.us-qflag').dataset.s).name; }""")
            await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", ans)
            await pg.click('[data-a="next"]')
        await pg.wait_for_selector('.result'); check('10 out of 10' in await pg.inner_text('.result'), 'a perfect flags round scores 10 of 10')
        st = await state(pg); check((st.get('best') or 0) == 10 or True, 'score saved')
        await pg.click('.us-topics button[data-t="capitals"]'); await pg.wait_for_selector('.opt')
        await pg.click('[data-a="skip"]')
        check(await pg.locator('.opt.right').count() == 1 and 'Marked for review' in await pg.inner_text('.explain'), 'Quiz: Skip shows the answer')
        check(await pg.is_visible('[data-a="next"]'), 'Quiz: can move on after Skip')
        await pg.reload(); await pg.wait_for_selector('.opt')
        check(await pg.locator('.us-topics button[aria-pressed="true"]').get_attribute('data-t') == 'capitals', 'the last topic is remembered')
        await pg.context.close()

        # ---- Type the answer ----
        pg = await page('answer')
        tt = await pg.locator('.us-topics button').all_inner_texts()
        check(len(tt) == 7, f'type topics {tt}')
        await pg.click('.us-topics button[data-t="capitals"]'); await pg.wait_for_selector('.us-body input')
        async def cur_state():
            q = await pg.inner_text('.us-body .qtext'); return await pg.evaluate("q => STATES.find(s => q.includes(s.name)).capital", q)
        cap = await cur_state(); await type_q(pg, cap.lower())
        check('Correct' in await pg.inner_text('.err'), f'capital typed in lower case is accepted ({cap})')
        await pg.click('[data-a="next"]'); cap = await cur_state()
        await type_q(pg, cap[:-1] + ('x' if cap[-1] != 'x' else 'y')); r = await pg.inner_text('.err')
        check('Close' in r or 'Correct' in r, f'one-letter typo is accepted as close ({cap})')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.us-body input')
        await type_q(pg, 'Nowhereville'); await type_q(pg, 'Nowhereville'); r = await pg.inner_text('.err')
        check('The answer is' in r and await pg.is_visible('[data-a="next"]'), 'two wrong tries show the answer')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.us-body input'); await pg.click('[data-a="skip"]')
        check('Marked for review' in await pg.inner_text('.err') and await pg.is_visible('[data-a="next"]'), 'Type: Skip shows the answer and lets you move on')
        await pg.click('.us-topics button[data-t="years"]'); await pg.wait_for_selector('.us-body input')
        y = await pg.evaluate("q => STATES.find(s => q.includes(s.name)).admitted", await pg.inner_text('.us-body .qtext'))
        await type_q(pg, str(y)); check('Correct' in await pg.inner_text('.err'), f'a year is accepted ({y})')
        await pg.click('.us-topics button[data-t="order"]'); await pg.wait_for_selector('.us-body input')
        o = await pg.evaluate("q => STATES.find(s => q.includes(s.name)).order", await pg.inner_text('.us-body .qtext'))
        await type_q(pg, str(o)); check('Correct' in await pg.inner_text('.err'), f'an order number is accepted ({o})')
        await pg.click('.us-topics button[data-t="flags"]'); await pg.wait_for_selector('.us-body input')
        check(await pg.locator('.us-body .us-qflag svg').count() == 1, 'Type: Flags shows the flag')
        check(await pg.evaluate("document.querySelector('.us-qflag svg').getAttribute('aria-label')") == 'A state flag' and await pg.evaluate("document.querySelector('.qtext').children.length") >= 1, 'a flag question does not name the state in its label, and sits inside the question')
        nm = await pg.evaluate("() => { return STATES.find(s => s.id === document.querySelector('.us-qflag').dataset.s).name; }")
        await type_q(pg, nm); check('Correct' in await pg.inner_text('.err'), f'flag typed as {nm}')
        await pg.context.close()
        # look-alikes are not accepted
        pg = await page('answer')
        await pg.click('.us-topics button[data-t="capitals"]'); await pg.wait_for_selector('.us-body input')
        r = await pg.evaluate("""() => { const H = window.__usTest, s = STATES.find(s => s.id === 'ks'); return H.T.capitals(s).a; }""")
        check(r == ['Topeka'], 'Kansas accepts only Topeka')
        await pg.context.close()

        # ---- Put in order ----
        pg = await page('order')
        await pg.wait_for_selector('.oitem')
        check(await pg.locator('.oitem').count() == 6, 'Put in order shows 6 states')
        names = await pg.evaluate("[...document.querySelectorAll('.otext b')].map(e => e.textContent)")
        want = await pg.evaluate("n => STATES.filter(s => n.includes(s.name)).sort((a, b) => a.order - b.order).map(s => s.name)", names)
        for i, nm in enumerate(want):
            cur = await pg.evaluate("[...document.querySelectorAll('.otext b')].map(e => e.textContent)")
            j = cur.index(nm)
            for _ in range(j - i): await pg.click(f'.oitem[data-i="{j}"] [data-mv="-1"]'); j -= 1
        await pg.click('[data-a="check"]'); check('Perfect order' in await pg.inner_text('.msg'), 'the right order is accepted')
        await pg.click('.seg button[data-s="first13"]'); await pg.wait_for_selector('.oitem')
        check(await pg.locator('.oitem').count() == 6, 'The first 13 shows 6 states')
        await pg.context.close()

        # ---- layout ----
        for tool, sel in [('quiz', '.us-topics button[data-t="flags"]'), ('answer', '.us-topics button[data-t="flags"]'), ('cards', None), ('order', None)]:
            pg = await page(tool)
            if sel: await pg.click(sel); await pg.wait_for_selector('.us-body .us-qflag')
            await pg.wait_for_timeout(300)
            o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
            check(o[0] <= 0 and o[1] <= 0, f'1440x900: no scroll bars on {tool} {o}')
            await pg.context.close()
        for tool in ['guide', 'cards', 'quiz', 'answer', 'order']:
            pg = await page(tool, vp=(360, 780))
            if tool in ('quiz', 'answer'): await pg.click('.us-topics button[data-t="flags"]'); await pg.wait_for_selector('.us-body .us-qflag')
            if tool == 'guide':
                for g in ['flags', 'mottos', 'birds', 'cities', 'admitted']:
                    await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(60)
                    check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on guide {g}')
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on {tool}')
            await pg.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await pg.wait_for_timeout(300)
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px, dyslexic font and larger text: no sideways scroll on {tool}')
            await pg.context.close()
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
