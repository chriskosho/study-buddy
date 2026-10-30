"""Europe test (Playwright + Chromium).
Checks the registry entry, the data (46 countries, spot facts, flags), the map, the study guide, flashcards, Quiz topics and questions for
every country, Type the answer (accepted spellings, Skip), the map tools, and layout at 1440x900 and 360px.
Run:  python3 study-buddy/_dev/tests/europe_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'
URL = BASE + 'modules/geography/europe/index.html'
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
    return await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('europe')) || '{}')")
async def type_q(pg, text):
    await pg.fill('.eu-body input', text); await pg.press('.eu-body input', 'Enter')
async def tap(pg, sel):
    await pg.evaluate("(s)=>document.querySelector(s).dispatchEvent(new MouseEvent('click',{bubbles:true}))", sel)

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
        reg = await pg.evaluate("(() => { const m = SB_REGISTRY.modules.find(m => m.id === 'europe'); return {subject: m.subject, tags: m.tags, tools: m.tools.map(t => t.id + ':' + t.difficulty + (t.kind ? ':' + t.kind : ''))}; })()")
        check(reg['subject'] == 'geography' and reg['tags'] == [], 'Europe is in Geography with no tags')
        check(reg['tools'] == ['guide:easy:study', 'study:easy:study', 'cards:easy:study', 'listen:medium', 'find:medium', 'drag:medium', 'quiz:medium', 'answer:hard'], f'tools and difficulties {reg["tools"]}')
        await pg.goto(BASE + 'index.html#/home/geography'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('a.mod[href="#/module/europe"]').count() == 1, 'the module is on the Geography page')
        await pg.context.close()

        # ---- data ----
        pg = await page()
        d = await pg.evaluate("({n: COUNTRIES.length, flags: Object.keys(FLAGS).length, map: Object.keys(MAPDATA.countries).length, same: COUNTRIES.every(c => MAPDATA.countries[c.id] && FLAGS[c.id]), by: Object.fromEntries(COUNTRIES.map(c => [c.id, c])), full: COUNTRIES.every(c => c.name && c.capital && c.langs.length), svg: COUNTRIES.every(c => FLAGS[c.id].startsWith('<svg') && FLAGS[c.id].includes('role=\"img\"')), ids: new Set(COUNTRIES.map(c => c.id)).size})")
        check(d['n'] == 46 and d['flags'] == 46 and d['map'] == 46 and d['ids'] == 46, '46 countries, 46 flags, 46 map shapes')
        check(d['same'] and d['full'] and d['svg'], 'every country has a shape, a flag (SVG), a capital, and a language')
        by = d['by']
        check(by['fr']['capital'] == 'Paris' and by['pl']['capital'] == 'Warsaw' and by['ua']['capital'] == 'Kyiv' and by['ch']['capital'] == 'Bern' and by['nl']['capital'] == 'Amsterdam' and by['xk']['capital'] == 'Pristina', 'spot-checked capitals')
        check(by['be']['langs'] == ['Dutch', 'French', 'German'] and by['at']['langs'] == ['German'] and by['pt']['langs'] == ['Portuguese'], 'spot-checked languages')
        await pg.context.close()

        # ---- study guide ----
        pg = await page('guide')
        check(len(await pg.locator('.gtabs button').all_inner_texts()) == 3, 'study guide has 3 sections')
        check(await pg.locator('.eu-guide tbody tr').count() == 46, 'Countries and capitals lists 46 countries')
        await pg.fill('#euFind', 'vienna'); await pg.wait_for_timeout(100)
        check(await pg.locator('.eu-guide tbody tr:visible').count() == 1, 'search finds a capital')
        await pg.fill('#euFind', 'dutch'); check(await pg.locator('.eu-guide tbody tr:visible').count() == 2, 'search finds a language (Dutch: Belgium and the Netherlands)')
        await pg.fill('#euFind', 'zzz'); check(await pg.locator('.eu-none:visible').count() == 1, 'search says when nothing matches')
        await pg.fill('#euFind', '')
        await pg.click('.gtabs button[data-g="flags"]'); check(await pg.locator('.eu-flags figure').count() == 46, 'Flags section shows 46 flags')
        await pg.click('.gtabs button[data-g="languages"]'); check(await pg.locator('.eu-guide tbody tr').count() == 46, 'Languages section lists 46 countries')
        check(await pg.locator('.spk').count() >= 46, 'rows have speaker buttons')
        check(not (await state(pg)).get('topic'), 'the guide gives no credit')
        await pg.context.close()

        # ---- flashcards ----
        pg = await page('cards')
        await pg.wait_for_selector('.fcard'); await pg.wait_for_timeout(300)
        check(await pg.locator('.deckbar .seg button').count() == 5, 'flashcards have 5 decks (map shapes, 3 topics, every quiz question)')
        check('0 of 46' in await pg.inner_text('.deckbar .count'), 'the first deck has all 46 countries')
        await pg.click('.deckbar .seg button >> nth=2'); await pg.wait_for_timeout(300)
        check(await pg.locator('.front svg').count() == 1, 'the Flags deck shows a flag')
        st = await state(pg); check(not st.get('best') and not st.get('streak'), 'flashcards give no credit')
        await pg.context.close()

        # ---- every question builder, every country ----
        pg = await page('quiz')
        res = await pg.evaluate("""(() => {
          const bad = [], H = window.__euTest;
          for (const c of COUNTRIES) for (const i of [0, 1, 2, 3]) for (const t of Object.keys(H.Q)) {
            const q = H.Q[t](c, i), opts = [q.a, ...q.wrong];
            if (q.wrong.length !== 3 || new Set(opts).size !== 4) bad.push([c.id, t, 'options']);
            if (t === 'capitals' && q.a !== c.capital && q.a !== c.name) bad.push([c.id, t, 'answer']);
            if (t === 'capitals' && q.q.endsWith('which country?') && (c.capital.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(c.capital.toLowerCase()))) bad.push([c.id, t, 'gives away']);
            if (t === 'flags' && (!q.html.includes('<svg') || q.a !== c.name)) bad.push([c.id, t, 'flag']);
            if (t === 'languages') {
              const mine = new Set(c.langs);
              if (q.a === c.name) { if (c.langs.length !== 1) bad.push([c.id, t, 'unique language']); }
              else { if (q.a !== (c.langs.length < 3 ? c.langs.join(' and ') : c.langs.slice(0, -1).join(', ') + ', and ' + c.langs[c.langs.length - 1])) bad.push([c.id, t, 'language']);
                     if (q.wrong.some(w => COUNTRIES.some(o => o.langs.join(' ').includes(w) && false))) bad.push([c.id, t, 'x']);
                     const oth = COUNTRIES.filter(o => o !== c && q.wrong.some(w => (o.langs.length < 3 ? o.langs.join(' and ') : o.langs.slice(0, -1).join(', ') + ', and ' + o.langs[o.langs.length - 1]) === w));
                     if (oth.some(o => o.langs.some(l => mine.has(l)))) bad.push([c.id, t, 'wrong choice shares a language']); }
            }
          }
          for (const c of COUNTRIES) for (const t of Object.keys(H.T)) { const q = H.T[t](c); if (!q.a.length || !q.q || !q.hint || !q.why) bad.push([c.id, t, 'type fields']); }
          return bad; })()""")
        check(not res, f'every country passes every Quiz and Type question builder {res[:5]}')
        acc = await pg.evaluate("""(() => { const H = window.__euTest, a = id => COUNTRIES.find(c => c.id === id); return [H.T.capitals(a('ua')).a, H.T.countries(a('gb')).a, H.T.languages(a('be')).a, H.T.countries(a('va'))]; })()""")
        check('Kiev' in acc[0] and 'UK' in acc[1] and 'French' in acc[2] and 'Dutch' in acc[2], f'accepted spellings {acc[:3]}')
        n = await pg.evaluate("window.__euTest.typeSet('countries').every(q => !/Vatican|San Marino|Monaco|Luxembourg|Andorra/.test(q.q))")
        check(n, 'Name the country never asks about a capital that gives the country away')
        await pg.context.close()

        # ---- Quiz ----
        pg = await page('quiz')
        topics = await pg.locator('.eu-topics button').all_inner_texts()
        check(topics == ['Mixed', 'Capitals', 'Flags', 'Languages'], f'quiz topics {topics}')
        for t in ['capitals', 'flags', 'languages']:
            await pg.click(f'.eu-topics button[data-t="{t}"]'); await pg.wait_for_selector('.opt')
            check(await pg.locator('.opt').count() == 4 and 'Question 1 of 10' in await pg.inner_text('.eu-body .hint'), f'{t}: 4 choices, 10 questions')
        await pg.click('.eu-topics button[data-t="flags"]'); await pg.wait_for_selector('.opt')
        check(await pg.locator('.eu-body .eu-qflag svg').count() == 1, 'Flags question shows the flag')
        for i in range(10):
            await pg.wait_for_selector('.opt')
            ans = await pg.evaluate("() => COUNTRIES.find(c => c.id === document.querySelector('.eu-qflag').dataset.s).name")
            await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", ans)
            await pg.click('[data-a="next"]')
        await pg.wait_for_selector('.result'); check('10 out of 10' in await pg.inner_text('.result'), 'a perfect flags round scores 10 of 10')
        await pg.click('.eu-topics button[data-t="capitals"]'); await pg.wait_for_selector('.opt'); await pg.click('[data-a="skip"]')
        check(await pg.locator('.opt.right').count() == 1, 'Quiz: Skip shows the answer')
        await pg.reload(); await pg.wait_for_selector('.opt')
        check(await pg.locator('.eu-topics button[aria-pressed="true"]').get_attribute('data-t') == 'capitals', 'the last topic is remembered')
        await pg.context.close()

        # ---- Type the answer ----
        pg = await page('answer')
        check(len(await pg.locator('.eu-topics button').all_inner_texts()) == 4, 'type has 4 topics')
        await pg.click('.eu-topics button[data-t="capitals"]'); await pg.wait_for_selector('.eu-body input')
        cap = await pg.evaluate("q => COUNTRIES.find(c => q.includes(c.name)).capital", await pg.inner_text('.eu-body .qtext'))
        await type_q(pg, cap.lower()); check('Correct' in await pg.inner_text('.err'), f'capital in lower case is accepted ({cap})')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.eu-body input')
        await type_q(pg, 'Nowhereville'); await type_q(pg, 'Nowhereville')
        check('The answer is' in await pg.inner_text('.err'), 'two wrong tries show the answer')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.eu-body input'); await pg.click('[data-a="skip"]')
        check('Marked for review' in await pg.inner_text('.err'), 'Type: Skip shows the answer')
        await pg.click('.eu-topics button[data-t="languages"]'); await pg.wait_for_selector('.eu-body input')
        nm = await pg.evaluate("q => COUNTRIES.find(c => q.includes(c.name + '?') || q.includes(c.name + ' ')).langs[0]", await pg.inner_text('.eu-body .qtext'))
        await type_q(pg, nm); check('Correct' in await pg.inner_text('.err'), f'a language is accepted ({nm})')
        await pg.click('.eu-topics button[data-t="flags"]'); await pg.wait_for_selector('.eu-body input')
        try: await pg.wait_for_selector('.eu-body .eu-qflag svg', timeout=3000)
        except Exception: pass
        check(await pg.evaluate("document.querySelector('.eu-qflag svg').getAttribute('aria-label')") == 'A country flag', 'a flag question does not name the country in its label')
        nm = await pg.evaluate("() => COUNTRIES.find(c => c.id === document.querySelector('.eu-qflag').dataset.s).name")
        await type_q(pg, nm); check('Correct' in await pg.inner_text('.err'), f'flag typed as {nm}')
        await pg.context.close()

        # ---- layout ----
        for tool, sel in [('quiz', '.eu-topics button[data-t="flags"]'), ('answer', '.eu-topics button[data-t="flags"]'), ('cards', None)]:
            pg = await page(tool)
            if sel: await pg.click(sel); await pg.wait_for_selector('.eu-body .eu-qflag')
            await pg.wait_for_timeout(300)
            o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
            check(o[0] <= 0 and o[1] <= 0, f'1440x900: no scroll bars on {tool} {o}')
            await pg.context.close()
        for tool in ['guide', 'study', 'listen', 'find', 'drag', 'cards', 'quiz', 'answer']:
            pg = await page(tool, vp=(360, 780))
            if tool in ('quiz', 'answer'): await pg.click('.eu-topics button[data-t="flags"]'); await pg.wait_for_selector('.eu-body .eu-qflag')
            if tool == 'guide':
                for g in ['flags', 'languages']:
                    await pg.click(f'.gtabs button[data-g="{g}"]'); await pg.wait_for_timeout(60)
                    check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on guide {g}')
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on {tool}')
            await pg.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await pg.wait_for_timeout(300)
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px, dyslexic font and larger text: no sideways scroll on {tool}')
            await pg.context.close()

        # ---- map tools ----
        pg = await page('study')
        check(await pg.locator('#mapStudy .cpath').count() == 46, 'Study map: 46 country shapes')
        check(await pg.locator('#mapStudy .cpath[aria-label="France"]').count() == 1, 'Study map: countries are named for keyboard and screen readers')
        check(await pg.locator('#mapStudy .lead-line').count() == 10, 'Study map: the tiny countries have a line to their label')
        await tap(pg, '#mapStudy .cpath[data-id="fr"]'); await pg.wait_for_timeout(100)
        check('France' in await pg.evaluate('window.__spoken'), 'Study map: tapping a country says its name')
        await tap(pg, '#mapStudy .cpath[data-id="va"]'); await pg.wait_for_timeout(100)
        check('Vatican City' in await pg.evaluate('window.__spoken'), 'Study map: the Vatican dot can be tapped')
        for t in ['study', 'listen', 'find', 'drag']:
            pg2 = await page(t)
            check(await pg2.evaluate("document.documentElement.scrollHeight - innerHeight") <= 0 and await pg2.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'1440x900: no page scroll bars on {t}')
            await pg2.context.close()
        # ---- small places: the short code opens into the name ----
        pg = await page('study')
        lab = lambda i: pg.evaluate("i => document.querySelector('#mapStudy .lbl[data-id=\"' + i + '\"]').textContent", i)
        check(await lab('li') == 'LI', 'Study map: a tiny place starts with a short code')
        await tap(pg, '#mapStudy .cpath[data-id="li"]'); await pg.wait_for_timeout(100)
        check(await lab('li') == 'Liechtenstein', 'Study map: tapping a tiny place opens its full name')
        await tap(pg, '#mapStudy .cpath[data-id="fr"]'); await pg.wait_for_timeout(100)
        check(await lab('li') == 'LI', 'Study map: the code comes back when another place is tapped')
        await pg.click('#euStudyList .st[data-id="li"]'); await pg.wait_for_timeout(200)
        check(await lab('li') == 'Liechtenstein' and await pg.locator('#mapStudy .cpath.sel').count() == 1, 'Study map: tapping a name in the list opens it on the map')
        check(await pg.evaluate("document.querySelector('#mapStudy').getAttribute('viewBox').split(' ')[2] < " + str(await pg.evaluate("MAPDATA.width"))) , 'Study map: tapping a tiny place in the list zooms toward it')
        await pg.click('.zoombar button >> nth=2'); await pg.click('#mapStudy ~ .zoombar button >> nth=0' if False else '.zoombar button >> nth=0'); await pg.wait_for_timeout(200)
        await tap(pg, '#mapStudy .cpath[data-id="fr"]'); await pg.wait_for_timeout(100)
        check(await lab('li') == 'Liechtenstein', 'Study map: zoomed in, every tiny place shows its full name')
        check(await pg.locator('#mapStudy .cpath[data-id="li"] title').count() == 1, 'Study map: places have a hover tooltip with the name')
        await pg.context.close()
        pg = await page('drag')
        await pg.click('#tray .chip[data-id="li"]'); await tap(pg, '#mapDrag .cpath[data-id="li"]'); await pg.wait_for_timeout(150)
        check(await pg.evaluate("document.querySelector('#mapDrag .lbl[data-id=\"li\"]').textContent") == 'Liechtenstein', 'Drag: a placed tiny place shows its full name for a moment')
        await pg.wait_for_timeout(2900)
        check(await pg.evaluate("document.querySelector('#mapDrag .lbl[data-id=\"li\"]').textContent") == 'LI', 'Drag: then goes back to its code')
        await pg.context.close()
        pg = await page('listen')
        check(await pg.locator('#mapListen .cpath[aria-label="Country on the map"]').count() == 46, 'Listen: map does not name countries')
        sid = await pg.evaluate('window.__euMap.cur'); wrong = 'de' if sid != 'de' else 'fr'
        await tap(pg, f'#mapListen .cpath[data-id="{wrong}"]'); check('That is' in await pg.inner_text('#lMsg'), 'Listen: wrong tap is corrected')
        await tap(pg, f'#mapListen .cpath[data-id="{sid}"]'); await pg.wait_for_timeout(1100)
        check((await pg.inner_text('#lScore')).startswith('0/'), 'Listen: a retry does not score')
        for _ in range(9):
            sid = await pg.evaluate('window.__euMap.cur'); await tap(pg, f'#mapListen .cpath[data-id="{sid}"]'); await pg.wait_for_timeout(1000)
        check('All done' in await pg.inner_text('#lPrompt'), 'Listen: round ends after 10')
        pg = await page('find'); await pg.click('#fStart'); await pg.wait_for_timeout(150)
        for _ in range(3):
            sid = await pg.evaluate('window.__euMap.cur'); await tap(pg, f'#mapFind .cpath[data-id="{sid}"]')
        check(await pg.inner_text('#fScore') == '3', 'Find it: right taps score')
        pg = await page('drag')
        check(await pg.locator('#tray .chip').count() == 46, 'Drag: 46 name chips')
        await pg.click('#tray .chip[data-id="es"]'); await tap(pg, '#mapDrag .cpath[data-id="fr"]')
        check(await pg.inner_text('#dMiss') == '1', 'Drag: a wrong drop is a miss')
        await tap(pg, '#mapDrag .cpath[data-id="es"]')
        check(await pg.inner_text('#dPlaced') == '1/46', 'Drag: tap a name, tap its country places it')
        await pg.click('#tray .chip[data-id="sm"]'); await tap(pg, '#mapDrag .cpath[data-id="sm"]')
        check(await pg.inner_text('#dPlaced') == '2/46', 'Drag: a tiny country (San Marino) can be placed')
        await pg.click('#dragMode button[data-m="reveal"]'); check(await pg.inner_text('#dPlaced') == '0/46', 'Drag: changing the map style starts over')
        pg = await page('cards'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("!!document.querySelector('#tab-cards svg.mini')"), 'Flashcards: Map shapes deck shows a map')
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
