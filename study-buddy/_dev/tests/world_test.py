"""World module test (Playwright + Chromium): the data merged from every continent, the region picker on every tool, the equirectangular map
(whole world and continent views), and the questions for every region.
Run:  python3 study-buddy/_dev/tests/world_test.py"""
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


URL = BASE + 'modules/geography/world/index.html'
P = 'wd'
CONT = {'Europe': 46, 'Asia': 48, 'Africa': 54, 'North America': 23, 'South America': 12, 'Oceania': 14}

async def tap(pg, sel):
    await pg.evaluate("(s)=>document.querySelector(s).dispatchEvent(new MouseEvent('click',{bubbles:true}))", sel)

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def page(tool='guide', vp=(1440, 900), region=None):
            c = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, service_workers='block'); await c.add_init_script(INIT)
            pg = await c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(f'{URL}?tool={tool}'); await pg.wait_for_selector('.panel:not([hidden])'); await pg.wait_for_selector('.wd-regions button:visible'); await pg.wait_for_timeout(250)
            if region: await pick(pg, region)
            return pg
        async def pick(pg, region):
            await pg.locator(f'.wd-regions button[data-r="{region}"]:visible').first.click(); await pg.wait_for_timeout(250)

        pg = await page()
        reg = await pg.evaluate("(() => { const m = SB_REGISTRY.modules.find(m => m.id === 'world'); return {subject: m.subject, tags: m.tags, tools: m.tools.map(t => t.id + ':' + t.difficulty + (t.kind ? ':' + t.kind : '')), drag: m.tools.find(t => t.id === 'drag').masterAt}; })()")
        check(reg['subject'] == 'geography' and reg['tags'] == [], 'World is in Geography with no tags')
        check(reg['tools'] == ['guide:easy:study', 'study:easy:study', 'cards:easy:study', 'listen:medium', 'find:medium', 'drag:medium', 'quiz:medium', 'answer:hard'], f'tools and difficulties {reg["tools"]}')
        d = await pg.evaluate("""({n: ALLC.length, ids: new Set(ALLC.map(c => c.id)).size, flags: ALLC.every(c => FLAGS[c.id] && FLAGS[c.id].includes('<svg')), map: ALLC.every(c => MAPDATA.countries[c.id]), extra: Object.keys(MAPDATA.countries).length,
          full: ALLC.every(c => c.name && c.capital && c.langs && c.langs.length && c.cont), conts: ALLC.reduce((a, c) => (a[c.cont] = (a[c.cont] || 0) + 1, a), {}), width: MAPDATA.width, height: MAPDATA.height,
          sorted: ALLC.every((c, i) => !i || ALLC[i - 1].name.localeCompare(c.name) <= 0), by: Object.fromEntries(ALLC.map(c => [c.id, c]))})""")
        check(d['n'] == 197 and d['ids'] == 197 and d['extra'] == 197, f"197 countries, as many shapes, unique ids ({d['n']}, {d['extra']})")
        check(d['flags'] and d['map'] and d['full'], 'every country has a flag, a shape, a capital, a language, and a continent')
        check(d['conts'] == CONT, f"countries per continent {d['conts']}")
        check(d['sorted'], 'countries are alphabetical')
        check(reg['drag'] == 192, f"Drag names mastery is 192 of 197 ({reg['drag']})")
        check(2.6 < d['width'] / d['height'] < 3.0, f"the map is equirectangular and wide ({d['width']}x{d['height']})")
        for cid, cap in [('fr', 'Paris'), ('jp', 'Tokyo'), ('br', 'Brasília'), ('au', 'Canberra'), ('ca', 'Ottawa'), ('eg', 'Cairo')]:
            check(d['by'][cid]['capital'] == cap, f'capital of {cid} is {cap} (found {d["by"][cid]["capital"]})')
        check(d['by']['ru']['cont'] == 'Europe' and 'Asia' in d['by']['ru']['note'], 'Russia is listed once, under Europe, with a note about Asia')
        # equirectangular: x grows with longitude and y with latitude at the same scale (France ~ 2E,46N vs Brazil ~ -52,-10)
        pos = await pg.evaluate("({fr: MAPDATA.countries.fr.label, br: MAPDATA.countries.br.label, au: MAPDATA.countries.au.label, ws: MAPDATA.countries.ws})")
        k = (d['width'] - 8) / 400
        check(pos['fr'][0] > pos['br'][0] > 0 and pos['fr'][1] < pos['br'][1], 'longitude runs left to right and north is up')
        check(pos['ws'].get('alt') and pos['ws']['alt'][0] > d['width'] - 8 * k * 8, 'Samoa is repeated past the right edge')
        await pg.context.close()

        # --- the region picker on every tool, and the guide
        pg = await page('guide')
        check(await pg.locator('.wd-regions button:visible').all_inner_texts() == ['World', 'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'], 'region picker on the guide')
        check(await pg.locator('.wd-guide tbody tr').count() == 197, 'guide lists all 197 on World')
        for r, n in CONT.items():
            await pick(pg, r)
            check(await pg.locator('.wd-guide tbody tr').count() == n, f'guide: {r} lists {n}')
        await pick(pg, 'Asia'); await pg.reload(); await pg.wait_for_selector('.wd-regions button[aria-pressed="true"]')
        check(await pg.evaluate("document.querySelector('.wd-regions button[aria-pressed=true]').dataset.r") == 'Asia', 'the region you picked is remembered')
        await pg.context.close()

        # --- every region x every question builder
        pg = await page('quiz')
        res = await pg.evaluate("""(() => {
          const bad = [], H = window.__wdTest, regs = ['all', 'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'];
          for (const r of regs) { H.setRegion(r);
            const pool = COUNTRIES.slice();
            for (const c of pool) for (const i of [0, 1, 2, 3]) for (const t of Object.keys(H.Q)) {
              const q = H.Q[t](c, i), opts = [q.a, ...q.wrong];
              if (q.wrong.length !== 3 || new Set(opts).size !== 4) bad.push([r, c.id, t, 'options']);
              if (t === 'flags' && (!q.html.includes('<svg') || q.a !== c.name)) bad.push([r, c.id, t, 'flag']);
              if (t === 'capitals' && q.q.endsWith('which country?') && (c.capital.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(c.capital.toLowerCase()))) bad.push([r, c.id, t, 'gives away']);
            }
            for (const c of pool) for (const t of Object.keys(H.T)) { const q = H.T[t](c); if (!q.a.length || !q.q || !q.hint || !q.why) bad.push([r, c.id, t, 'type']); }
          }
          H.setRegion('all'); return bad; })()""")
        check(not res, f'every country passes every question builder in every region {res[:5]}')
        await pg.context.close()

        # --- quiz: Full mode only for the whole world
        pg = await page('quiz')
        await pg.click('.wd-topics button[data-t="flags"]'); await pg.wait_for_timeout(200)
        check(await pg.locator('.qmodes button[data-m="full"]').count() >= 1, 'Quiz: the Full quiz is offered for the whole world')
        await pick(pg, 'Europe'); await pg.click('.wd-topics button[data-t="flags"]'); await pg.wait_for_timeout(200)
        check(await pg.locator('.qmodes button[data-m="full"]').count() == 0, 'Quiz: no Full quiz for one continent (it would not earn world mastery)')
        await pg.wait_for_selector('.opt'); check(await pg.locator('.opt').count() == 4, 'Quiz: 4 choices in a continent round')
        await pg.context.close()

        # --- maps
        pg = await page('study')
        n_hidden = await pg.evaluate("[...document.querySelectorAll('#mapStudy .lbl[data-short]')].filter(t => t.style.display === 'none').length")
        check(n_hidden >= 20, f'World view: unreadable codes stay hidden ({n_hidden})')
        check(await pg.locator('#mapStudy .cpath').count() == 197, 'Study map: a shape for every country')
        await tap(pg, '#mapStudy .cpath[data-id="be"]'); await pg.wait_for_timeout(100)
        t = await pg.evaluate("(() => { const t = document.querySelector('#mapStudy .lbl[data-id=be]'); return [t.style.display, [...t.querySelectorAll('tspan')].map(x => x.textContent).join(' ')]; })()")
        check(t == ['', 'Belgium'], f'tapping Belgium opens its name {t}')
        await pick(pg, 'Europe')
        cnt = lambda: pg.evaluate("[...document.querySelectorAll('#mapStudy .lbl[data-short]')].filter(t => t.style.display !== 'none' && t.textContent.length <= 2).length")
        check(await cnt() >= 8, f'Europe view: small countries show short codes at first ({await cnt()})')
        await pg.locator('.zoombar button').first.click(); await pg.wait_for_timeout(200)
        check(await cnt() == 0, 'Europe view: one press of + opens every small name')
        await pg.locator('.zoombar button').nth(2).click(); await pg.wait_for_timeout(200)
        check(await cnt() >= 8, 'the reset button goes back to the continent view')
        check(await pg.locator('#mapStudy .cpath').count() == 46, 'Europe view: only Europe is tappable')
        await pick(pg, 'Oceania')
        ws = await pg.evaluate("[...document.querySelectorAll('#mapStudy .lbl[data-id=ws]')].map(t => t.getAttribute('x'))")
        check(len(ws) == 2, 'Samoa has a label on both copies')
        inview = await pg.evaluate("(() => { const vb = document.querySelector('#mapStudy').viewBox.baseVal; return [...document.querySelectorAll('#mapStudy .lbl[data-id=ws]')].some(t => +t.getAttribute('x') > vb.x && +t.getAttribute('x') < vb.x + vb.width); })()")
        check(inview, 'Oceania view shows Samoa (the repeated strip)')
        await pg.context.close()

        for region in ['all', 'Europe', 'Oceania']:
            for tool in ['study', 'listen', 'find', 'drag', 'cards', 'guide']:
                pg = await page(tool, region=None if region == 'all' else region)
                o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
                check(o[0] <= 0 and o[1] <= 0, f'1440x900 {region}: no scroll bars on {tool} {o}' if tool != 'guide' else f'guide {region} no sideways scroll', ) if tool != 'guide' else check(o[1] <= 0, f'1440x900 {region}: no sideways scroll on guide')
                await pg.context.close()
        for tool in ['guide', 'study', 'listen', 'find', 'drag', 'cards', 'quiz', 'answer']:
            pg = await page(tool, vp=(360, 780))
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on {tool}')
            await pg.context.close()

        pg = await page('listen'); sid = await pg.evaluate('window.__wdMap.cur')
        await tap(pg, f'#mapListen .cpath[data-id="{sid}"]'); await pg.wait_for_timeout(100)
        check('Yes' in await pg.inner_text('#lMsg'), 'Listen: the right tap is accepted')
        await pg.context.close()
        pg = await page('find', region='Africa'); await pg.click('#fStart'); await pg.wait_for_timeout(150)
        ids = await pg.evaluate("[window.__wdMap.cur, [...COUNTRIES].map(c => c.cont)]")
        check(set(ids[1]) == {'Africa'}, 'Find it in Africa only asks African countries')
        for _ in range(2):
            sid = await pg.evaluate('window.__wdMap.cur'); await tap(pg, f'#mapFind .cpath[data-id="{sid}"]')
        check(await pg.inner_text('#fScore') == '2', 'Find it: right taps score')
        await pg.context.close()
        pg = await page('drag', region='Oceania')
        check(await pg.locator('#tray .chip').count() == 14, 'Drag in Oceania: 14 chips')
        await pg.click('#tray .chip[data-id="ws"]'); await tap(pg, '#mapDrag .cpath[data-id="ws"]')
        check(await pg.inner_text('#dPlaced') == '1/14', 'Drag: Samoa (a repeated-edge dot) can be placed')
        await pg.context.close()
        pg = await page('cards'); await pg.wait_for_timeout(100)
        check(await pg.evaluate("!!document.querySelector('#tab-cards svg.mini')"), 'Flashcards: Map shapes deck shows a map')
        await pg.context.close()
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
