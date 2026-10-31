"""Continents test (Africa, Asia, North America, Oceania) (Playwright + Chromium).
The same checks as the Europe test, driven by each module's own data (counts come from data.js), plus spot checks of capitals.
Run:  python3 study-buddy/_dev/tests/continents_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
BASE = f'http://127.0.0.1:{PORT}/'

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

MODS = [('africa', 'af', 54), ('asia', 'as', None), ('north-america', 'na', 23), ('oceania', 'oc', 14)]   # (slug, prefix, expected count or None to take it from the data)
SPOT = {'africa': [('eg', 'Cairo'), ('ng', 'Abuja'), ('za', None), ('ke', 'Nairobi')], 'asia': [('jp', 'Tokyo'), ('in', 'New Delhi'), ('cn', 'Beijing')], 'north-america': [('ca', 'Ottawa'), ('mx', 'Mexico City'), ('us', 'Washington, D.C.')], 'oceania': [('au', 'Canberra'), ('nz', 'Wellington'), ('fj', 'Suva')]}

async def tap(pg, sel):
    await pg.evaluate("(s)=>document.querySelector(s).dispatchEvent(new MouseEvent('click',{bubbles:true}))", sel)

async def run_module(b, slug, p, want):
    URL = BASE + f'modules/geography/{slug}/index.html'
    async def page(tool='guide', vp=(1440, 900)):
        c = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, service_workers='block'); await c.add_init_script(INIT)
        pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(f'{slug}: {e}'))
        await pg.goto(f'{URL}?tool={tool}'); await pg.wait_for_selector('.panel:not([hidden])'); await pg.wait_for_timeout(250)
        return pg
    async def type_q(pg, text):
        await pg.fill(f'.{p}-body input', text); await pg.press(f'.{p}-body input', 'Enter')
    T = lambda m: f'{slug}: {m}'
    pg = await page()
    reg = await pg.evaluate("(slug) => { const m = SB_REGISTRY.modules.find(m => m.id === slug); return {subject: m.subject, tags: m.tags, tools: m.tools.map(t => t.id + ':' + t.difficulty + (t.kind ? ':' + t.kind : '')), drag: m.tools.find(t => t.id === 'drag').masterAt}; }", slug)
    check(reg['subject'] == 'geography' and reg['tags'] == [], T('is in Geography with no tags'))
    check(reg['tools'] == ['guide:easy:study', 'study:easy:study', 'cards:easy:study', 'listen:medium', 'find:medium', 'drag:medium', 'quiz:medium', 'answer:hard'], T(f'tools and difficulties {reg["tools"]}'))
    d = await pg.evaluate("({n: COUNTRIES.length, flags: Object.keys(FLAGS).length, map: Object.keys(MAPDATA.countries).length, ids: new Set(COUNTRIES.map(c => c.id)).size, same: COUNTRIES.every(c => MAPDATA.countries[c.id] && FLAGS[c.id]), full: COUNTRIES.every(c => c.name && c.capital && c.langs.length), svg: COUNTRIES.every(c => FLAGS[c.id].startsWith('<svg') && FLAGS[c.id].includes('role=\"img\"')), by: Object.fromEntries(COUNTRIES.map(c => [c.id, c])), sorted: COUNTRIES.every((c, i) => i === 0 || COUNTRIES[i - 1].name.localeCompare(c.name) <= 0), outs: Object.keys(MAPDATA.countries).filter(k => MAPDATA.countries[k].out), dots: Object.keys(MAPDATA.countries).filter(k => MAPDATA.countries[k].dot), height: MAPDATA.height, width: MAPDATA.width})")
    N = d['n']
    check((want is None or N == want) and N == d['flags'] == d['map'] == d['ids'], T(f'{N} countries, as many flags, shapes, and unique ids'))
    check(d['same'] and d['full'] and d['svg'], T('every country has a shape, a flag (SVG), a capital, and a language'))
    check(d['sorted'], T('countries are alphabetical'))
    check(reg['drag'] == N - 5, T(f'Drag names mastery is the count minus 5 ({reg["drag"]} for {N})'))
    check(0.9 < d['width'] / d['height'] < 2.2, T(f'the map picture has a sensible shape {d["width"]}x{d["height"]}'))
    for cid, cap in SPOT[slug]:
        got = d['by'][cid]['capital'] if cid in d['by'] else None
        if cap: check(got == cap, T(f'capital of {cid} is {cap} (found {got})'))
        else: check(got is not None, T(f'{cid} is in the list'))
    await pg.context.close()

    pg = await page('guide')
    check(await pg.locator(f'.{p}-guide tbody tr').count() == N, T('guide lists every country'))
    await pg.fill(f'#{p}Find', 'zzz'); check(await pg.locator(f'.{p}-none:visible').count() == 1, T('search says when nothing matches'))
    await pg.fill(f'#{p}Find', d['by'][next(iter(d['by']))]['capital'].lower()); await pg.wait_for_timeout(100)
    check(await pg.locator(f'.{p}-guide tbody tr:visible').count() >= 1, T('search finds a capital'))
    await pg.fill(f'#{p}Find', '')
    await pg.click('.gtabs button[data-g="flags"]'); check(await pg.locator(f'.{p}-flags figure').count() == N, T('Flags section shows every flag'))
    await pg.click('.gtabs button[data-g="languages"]'); check(await pg.locator(f'.{p}-guide tbody tr').count() == N, T('Languages section lists every country'))
    check(not (await pg.evaluate(f"JSON.parse(localStorage.getItem(SB.moduleKey('{slug}')) || '{{}}')")).get('topic'), T('the guide gives no credit'))
    await pg.context.close()

    pg = await page('cards')
    await pg.wait_for_selector('.fcard'); await pg.wait_for_timeout(300)
    check(await pg.locator('.deckbar .seg button').count() == 5, T('flashcards have 5 decks'))
    check(f'0 of {N}' in await pg.inner_text('.deckbar .count'), T('the first deck has every country'))
    await pg.click('.deckbar .seg button >> nth=2')
    try: await pg.wait_for_selector('.front svg', timeout=5000)   # waits instead of a fixed pause: under load the card can take longer to draw
    except Exception: pass
    check(await pg.locator('.front svg').count() == 1, T('the Flags deck shows a flag'))
    await pg.context.close()

    pg = await page('quiz')
    res = await pg.evaluate("""(() => {
      const bad = [], H = window.__%sTest;
      const phrase = c => c.langs.length < 3 ? c.langs.join(' and ') : c.langs.slice(0, -1).join(', ') + ', and ' + c.langs[c.langs.length - 1];
      for (const c of COUNTRIES) for (const i of [0, 1, 2, 3]) for (const t of Object.keys(H.Q)) {
        const q = H.Q[t](c, i), opts = [q.a, ...q.wrong];
        if (q.wrong.length !== 3 || new Set(opts).size !== 4) bad.push([c.id, t, 'options']);
        if (t === 'capitals' && q.a !== c.capital && q.a !== c.name) bad.push([c.id, t, 'answer']);
        if (t === 'capitals' && q.q.endsWith('which country?') && (c.capital.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(c.capital.toLowerCase()))) bad.push([c.id, t, 'gives away']);
        if (t === 'flags' && (!q.html.includes('<svg') || q.a !== c.name)) bad.push([c.id, t, 'flag']);
        if (t === 'languages') {
          const mine = new Set(c.langs);
          if (q.a === c.name) { if (c.langs.length !== 1) bad.push([c.id, t, 'unique language']); }
          else { if (q.a !== phrase(c)) bad.push([c.id, t, 'language']);
                 const oth = COUNTRIES.filter(o => o !== c && q.wrong.some(w => phrase(o) === w));
                 if (oth.some(o => o.langs.some(l => mine.has(l)))) bad.push([c.id, t, 'wrong choice shares a language']); }
        }
      }
      for (const c of COUNTRIES) for (const t of Object.keys(H.T)) { const q = H.T[t](c); if (!q.a.length || !q.q || !q.hint || !q.why) bad.push([c.id, t, 'type fields']); }
      return bad; })()""" % p)
    check(not res, T(f'every country passes every Quiz and Type question builder {res[:5]}'))
    n = await pg.evaluate("window.__%sTest.typeSet('countries').every(q => !q.q.includes('undefined'))" % p)
    check(n, T('Name the country questions are well formed'))
    await pg.context.close()

    pg = await page('quiz')
    check(await pg.locator(f'.{p}-topics button').all_inner_texts() == ['Mixed', 'Capitals', 'Flags', 'Languages'], T('quiz topics'))
    for t in ['capitals', 'flags', 'languages']:
        await pg.click(f'.{p}-topics button[data-t="{t}"]'); await pg.wait_for_selector('.opt')
        check(await pg.locator('.opt').count() == 4 and 'Question 1 of 10' in await pg.inner_text(f'.{p}-body .hint'), T(f'{t}: 4 choices, 10 questions'))
    await pg.click(f'.{p}-topics button[data-t="flags"]'); await pg.wait_for_selector('.opt')
    for i in range(10):
        await pg.wait_for_selector('.opt')
        ans = await pg.evaluate("p => COUNTRIES.find(c => c.id === document.querySelector('.' + p + '-qflag').dataset.s).name", p)
        await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", ans)
        await pg.click('[data-a="next"]')
    await pg.wait_for_selector('.result'); check('10 out of 10' in await pg.inner_text('.result'), T('a perfect flags round scores 10 of 10'))
    await pg.context.close()

    pg = await page('answer')
    await pg.click(f'.{p}-topics button[data-t="capitals"]'); await pg.wait_for_selector(f'.{p}-body input')
    cap = await pg.evaluate("q => { const c = COUNTRIES.filter(c => q.includes(c.name)).sort((a, b) => b.name.length - a.name.length)[0]; return c.capital; }", await pg.inner_text(f'.{p}-body .qtext'))
    await type_q(pg, cap.lower()); check('Correct' in await pg.inner_text('.err'), T(f'capital in lower case is accepted ({cap})'))
    await pg.click('[data-a="next"]'); await pg.wait_for_selector(f'.{p}-body input')
    await type_q(pg, 'Nowhereville'); await type_q(pg, 'Nowhereville'); check('The answer is' in await pg.inner_text('.err'), T('two wrong tries show the answer'))
    await pg.click('[data-a="next"]'); await pg.wait_for_selector(f'.{p}-body input'); await pg.click('[data-a="skip"]')
    check('Marked for review' in await pg.inner_text('.err'), T('Type: Skip shows the answer'))
    await pg.click(f'.{p}-topics button[data-t="flags"]'); await pg.wait_for_selector(f'.{p}-body input')
    try: await pg.wait_for_selector(f'.{p}-body .{p}-qflag svg', timeout=3000)
    except Exception: pass
    nm = await pg.evaluate("p => COUNTRIES.find(c => c.id === document.querySelector('.' + p + '-qflag').dataset.s).name", p)
    await type_q(pg, nm); check('Correct' in await pg.inner_text('.err'), T(f'flag typed as {nm}'))
    await pg.context.close()

    for tool, sel in [('quiz', f'.{p}-topics button[data-t="flags"]'), ('answer', f'.{p}-topics button[data-t="flags"]'), ('cards', None), ('study', None), ('listen', None), ('find', None), ('drag', None)]:
        pg = await page(tool)
        if sel: await pg.click(sel); await pg.wait_for_selector(f'.{p}-body .{p}-qflag')
        await pg.wait_for_timeout(300)
        o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
        check(o[0] <= 0 and o[1] <= 0, T(f'1440x900: no scroll bars on {tool} {o}'))
        await pg.context.close()
    for tool in ['guide', 'study', 'listen', 'find', 'drag', 'cards', 'quiz', 'answer']:
        pg = await page(tool, vp=(360, 780))
        if tool in ('quiz', 'answer'): await pg.click(f'.{p}-topics button[data-t="flags"]'); await pg.wait_for_selector(f'.{p}-body .{p}-qflag')
        check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, T(f'360px: no sideways scroll on {tool}'))
        await pg.context.close()

    pg = await page('study')
    check(await pg.locator('#mapStudy .cpath').count() == N, T('Study map: a shape for every country'))
    first = d['dots'][0] if d['dots'] else d['outs'][0]
    check(await pg.locator('#mapStudy .lead-line').count() == len(d['outs']), T('Study map: every place with an out-label has its line'))
    name = d['by'][first]['name']
    lab = lambda i: pg.evaluate("i => { const t = document.querySelector('#mapStudy .lbl[data-id=' + JSON.stringify(i) + ']'); const sp = [...t.querySelectorAll('tspan')]; return sp.length ? sp.map(x => x.textContent).join(' ') : t.textContent; }", i)
    check(await lab(first) == first.upper(), T(f'Study map: {first} starts with a short code'))
    await tap(pg, f'#mapStudy .cpath[data-id="{first}"]'); await pg.wait_for_timeout(100)
    check(await lab(first) == name, T(f'Study map: tapping {first} opens {name}'))
    await pg.click(f'.zoombar button >> nth=0'); await pg.wait_for_timeout(200)
    check(await pg.evaluate("document.querySelectorAll('#mapStudy .lbl[data-short]').length") >= 1, T('Study map: there are short labels'))
    shorts = await pg.evaluate("[...document.querySelectorAll('#mapStudy .lbl[data-short]')].filter(t => t.textContent.length <= 2).length")
    check(shorts == 0, T(f'Study map: zoomed in, no short codes are left ({shorts})'))
    await pg.context.close()
    pg = await page('listen'); sid = await pg.evaluate(f'window.__{p}Map.cur')
    await tap(pg, f'#mapListen .cpath[data-id="{sid}"]'); await pg.wait_for_timeout(100)
    check('Yes' in await pg.inner_text('#lMsg'), T('Listen: the right tap is accepted'))
    pg = await page('find'); await pg.click('#fStart'); await pg.wait_for_timeout(150)
    for _ in range(2):
        sid = await pg.evaluate(f'window.__{p}Map.cur'); await tap(pg, f'#mapFind .cpath[data-id="{sid}"]')
    check(await pg.inner_text('#fScore') == '2', T('Find it: right taps score'))
    pg = await page('drag')
    check(await pg.locator('#tray .chip').count() == N, T('Drag: a name chip for every country'))
    await pg.click(f'#tray .chip[data-id="{first}"]'); await tap(pg, f'#mapDrag .cpath[data-id="{first}"]')
    check(await pg.inner_text('#dPlaced') == f'1/{N}', T('Drag: a tiny place can be placed'))
    pg = await page('cards'); await pg.wait_for_timeout(100)
    check(await pg.evaluate("!!document.querySelector('#tab-cards svg.mini')"), T('Flashcards: Map shapes deck shows a map'))

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    only = [a for a in sys.argv[1:] if not a.startswith('-')]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for slug, pre, want in MODS:
            if only and slug not in only: continue
            await run_module(b, slug, pre, want)
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
