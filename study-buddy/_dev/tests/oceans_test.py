"""Oceans module test (Playwright + Chromium): the data (27 bodies of water, clues that do not give the name away), the equirectangular map
under the land, small-sea codes, the question builders, and every tool.
Run:  python3 study-buddy/_dev/tests/oceans_test.py"""
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


URL = BASE + 'modules/geography/oceans/index.html'
P = 'oce'

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

        pg = await page()
        reg = await pg.evaluate("(() => { const m = SB_REGISTRY.modules.find(m => m.id === 'oceans'); return {subject: m.subject, tags: m.tags, tools: m.tools.map(t => t.id + ':' + t.difficulty + (t.kind ? ':' + t.kind : '')), drag: m.tools.find(t => t.id === 'drag').masterAt, find: m.tools.find(t => t.id === 'find').masterAt}; })()")
        check(reg['subject'] == 'geography' and reg['tags'] == [], 'Oceans is in Geography with no tags')
        check(reg['tools'] == ['guide:easy:study', 'study:easy:study', 'cards:easy:study', 'listen:medium', 'find:medium', 'drag:medium', 'quiz:medium', 'answer:hard'], f'tools and difficulties {reg["tools"]}')
        d = await pg.evaluate("""({n: WATERS.length, ids: new Set(WATERS.map(w => w.id)).size, shapes: Object.keys(MAPDATA.waters).length, same: WATERS.every(w => MAPDATA.waters[w.id] && MAPDATA.waters[w.id].d),
          oceans: WATERS.filter(w => w.kind === 'ocean').map(w => w.name), seas: WATERS.filter(w => w.kind === 'sea').length, width: MAPDATA.width, height: MAPDATA.height,
          full: WATERS.every(w => w.name && w.where && w.clue && w.fact && w.type && w.area > 0), areas: new Set(WATERS.map(w => w.area)).size,
          seasSorted: WATERS.filter(w => w.kind === 'sea').every((w, i, a) => !i || a[i - 1].name.localeCompare(w.name) <= 0),
          small: WATERS.filter(w => MAPDATA.waters[w.id].small).map(w => w.id),
          leaks: WATERS.map(w => { const gen = new Set(['sea', 'ocean', 'gulf', 'bay', 'of', 'the']); const bad = (w.name.toLowerCase().match(/[a-z]+/g) || []).filter(x => !gen.has(x) && new RegExp('\\b' + x + '\\b').test(w.clue.toLowerCase())); return bad.length ? w.id + ':' + bad : null; }).filter(Boolean),
          order: WATERS.slice(0, 5).every(w => w.kind === 'ocean') && WATERS.slice(0, 5).every((w, i, a) => !i || a[i - 1].area >= w.area)})""")
        check(d['n'] == 27 and d['ids'] == 27 and d['shapes'] == 27 and d['same'], f"27 bodies of water, as many shapes, unique ids ({d['n']}, {d['shapes']})")
        check(d['oceans'] == ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Southern Ocean', 'Arctic Ocean'] and d['seas'] == 22 and d['order'], f"5 oceans largest first, then 22 seas {d['oceans']}")
        check(d['full'] and d['areas'] == 27, 'every body of water has a name, kind, place, clue, fact, and its own size')
        check(d['seasSorted'], 'seas, gulfs, and bays are alphabetical')
        check(not d['leaks'], f"no clue gives the name away {d['leaks']}")
        check(len(d['small']) >= 6, f"small seas use short codes {d['small']}")
        check(2.0 < d['width'] / d['height'] < 2.3, f"the map is equirectangular (360 by 170 degrees) {d['width']}x{d['height']}")
        check(reg['drag'] == 22 and reg['find'] == 15, f"Drag mastery is 22 of 27 and Find it is 15 ({reg['drag']}, {reg['find']})")
        facts = await pg.evaluate("Object.fromEntries(WATERS.map(w => [w.id, w.area]))")
        check(facts['pa'] > facts['at'] > facts['in'] > facts['so'] > facts['ar'] and facts['cs'] > facts['ab'] > facts['sc'], 'sizes: the oceans are in order, and a few seas (Coral > Arabian > South China)')
        # the water is drawn under the land, and Pacific/Atlantic/Indian are in the right places (longitude runs left to right, north is up)
        pos = await pg.evaluate("Object.fromEntries(['pa', 'at', 'in', 'so', 'ar', 'md', 'cb', 'ts'].map(i => [i, MAPDATA.waters[i].label]))")
        check(pos['at'][0] < pos['in'][0] and pos['cb'][0] < pos['md'][0] and pos['ar'][1] < pos['md'][1] < pos['cb'][1] < pos['so'][1], 'the oceans and seas are where they belong on the map')
        check(pos['ts'][0] > pos['in'][0] and pos['ts'][1] > pos['md'][1], 'the Tasman Sea is south and east of the Indian Ocean label')
        await pg.context.close()

        pg = await page('guide')
        check(await pg.locator('.oce-guide tbody tr').count() == 27, 'guide lists every body of water')
        await pg.fill('#oceFind', 'zzz'); check(await pg.locator('.oce-none:visible').count() == 1, 'search says when nothing matches')
        await pg.fill('#oceFind', 'gulf'); await pg.wait_for_timeout(100)
        check(await pg.locator('.oce-guide tbody tr:visible').count() == 2, 'search finds the two gulfs')
        await pg.fill('#oceFind', '')
        await pg.click('.gtabs button[data-g="facts"]'); check(await pg.locator('.oce-guide tbody tr').count() == 27, 'Facts section lists every body of water')
        check(not (await pg.evaluate("JSON.parse(localStorage.getItem(SB.moduleKey('oceans')) || '{}')")).get('topic'), 'the guide gives no credit')
        await pg.context.close()

        pg = await page('cards')
        await pg.wait_for_selector('.fcard'); await pg.wait_for_timeout(300)
        check(await pg.locator('.deckbar .seg button').count() == 4, 'flashcards have 4 decks')
        check('0 of 27' in await pg.inner_text('.deckbar .count'), 'the first deck has every body of water')
        check(await pg.evaluate("!!document.querySelector('#tab-cards svg.mini')"), 'Flashcards: the Map shapes deck shows a map')
        await pg.context.close()

        pg = await page('quiz')
        res = await pg.evaluate("""(() => {
          const bad = [], H = window.__oceTest;
          for (const w of WATERS) for (const i of [0, 1, 2, 3]) for (const t of Object.keys(H.Q)) {
            const q = H.Q[t](w, i), opts = [q.a, ...q.wrong];
            if (q.wrong.length !== 3 || new Set(opts).size !== 4 || q.a !== w.name) bad.push([w.id, t, 'options']);
            if (t === 'map' && !q.html.includes('<svg')) bad.push([w.id, t, 'map']);
            if (t === 'clues' && !q.q.includes(w.clue)) bad.push([w.id, t, 'clue']);
            if (t === 'size') {
              const A = n => WATERS.find(x => x.name === n).area, largest = q.q.includes('largest'), as = opts.map(A);
              if (largest ? A(q.a) !== Math.max(...as) : A(q.a) !== Math.min(...as)) bad.push([w.id, t, 'wrong extreme']);
              const others = as.filter(x => x !== A(q.a)); if (others.some(x => Math.max(x, A(q.a)) / Math.min(x, A(q.a)) < 1.2)) bad.push([w.id, t, 'too close']);
            }
          }
          for (const w of WATERS) for (const t of Object.keys(H.T)) { const q = H.T[t](w); if (!q.a.length || !q.q || !q.hint || !q.why || !q.a.includes(w.name)) bad.push([w.id, t, 'type']); }
          if (H.fullQ('size').length !== 27 || H.fullQ('map').length !== 27 || H.fullQ('clues').length !== 27) bad.push(['full']);
          return bad; })()""")
        check(not res, f'every body of water passes every question builder {res[:5]}')
        await pg.context.close()

        pg = await page('quiz')
        check(await pg.locator('.oce-topics button').all_inner_texts() == ['Mixed', 'On the map', 'Clues', 'Size'], 'quiz topics')
        for t in ['map', 'clues', 'size']:
            await pg.click(f'.oce-topics button[data-t="{t}"]'); await pg.wait_for_selector('.opt')
            check(await pg.locator('.opt').count() == 4 and 'Question 1 of 10' in await pg.inner_text('.oce-body .hint'), f'{t}: 4 choices, 10 questions')
            check(await pg.locator('.qmodes button[data-m="full"]').count() == 1, f'{t}: a Full quiz is offered')
        await pg.click('.oce-topics button[data-t="clues"]'); await pg.wait_for_selector('.opt')
        for i in range(10):
            await pg.wait_for_selector('.opt')
            q = await pg.inner_text('.oce-body .qtext')
            ans = await pg.evaluate("q => WATERS.find(w => q.includes(w.clue)).name", q)
            await pg.evaluate("v => [...document.querySelectorAll('.opt')].find(b => b.dataset.v === v).click()", ans)
            await pg.click('[data-a="next"]')
        await pg.wait_for_selector('.result'); check('10 out of 10' in await pg.inner_text('.result'), 'a perfect clues round scores 10 of 10')
        await pg.context.close()

        pg = await page('answer')
        check(await pg.locator('.oce-topics button').all_inner_texts() == ['From a clue', 'From the map'], 'type topics')
        await pg.click('.oce-topics button[data-t="clues"]'); await pg.wait_for_selector('.oce-body input')
        nm = await pg.evaluate("q => WATERS.find(w => q.includes(w.clue)).name", await pg.inner_text('.oce-body .qtext'))
        await pg.fill('.oce-body input', nm.lower()); await pg.press('.oce-body input', 'Enter'); check('Correct' in await pg.inner_text('.err'), f'a clue answered in lower case is accepted ({nm})')
        await pg.click('[data-a="next"]'); await pg.wait_for_selector('.oce-body input')
        for _ in range(2): await pg.fill('.oce-body input', 'Nowhere Sea'); await pg.press('.oce-body input', 'Enter')
        check('The answer is' in await pg.inner_text('.err'), 'two wrong tries show the answer')
        await pg.click('.oce-topics button[data-t="map"]'); await pg.wait_for_selector('.oce-body .oce-mini')
        sid = await pg.evaluate("document.querySelector('.oce-body .oce-q').dataset.s")
        nm = await pg.evaluate("i => WATERS.find(w => w.id === i).name", sid)
        await pg.fill('.oce-body input', nm); await pg.press('.oce-body input', 'Enter'); check('Correct' in await pg.inner_text('.err'), f'a map answered by name ({nm})')
        await pg.context.close()
        alt = await page('answer'); await alt.evaluate("document.body.dataset.x = 1")
        ok = await alt.evaluate("""(() => { const a = (ALSO.name || {}); return a.sj.includes('East Sea') && a.pa.includes('Pacific') && a.pg.includes('Arabian Gulf'); })()""")
        check(ok, 'other names are accepted (East Sea, Pacific, Arabian Gulf)')
        await alt.context.close()

        for tool, sel in [('quiz', '.oce-topics button[data-t="map"]'), ('answer', '.oce-topics button[data-t="map"]'), ('cards', None), ('study', None), ('listen', None), ('find', None), ('drag', None)]:
            pg = await page(tool)
            if sel: await pg.click(sel); await pg.wait_for_selector('.oce-body .oce-mini')
            await pg.wait_for_timeout(300)
            o = await pg.evaluate("[document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth]")
            check(o[0] <= 0 and o[1] <= 0, f'1440x900: no scroll bars on {tool} {o}')
            await pg.context.close()
        for tool in ['guide', 'study', 'listen', 'find', 'drag', 'cards', 'quiz', 'answer']:
            pg = await page(tool, vp=(360, 780))
            if tool in ('quiz', 'answer'): await pg.click('.oce-topics button[data-t="map"]'); await pg.wait_for_selector('.oce-body .oce-mini')
            check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f'360px: no sideways scroll on {tool}')
            await pg.context.close()

        pg = await page('study')
        check(await pg.locator('#mapStudy .cpath').count() == 27, 'Study map: a shape for every body of water')
        check(await pg.evaluate("document.querySelectorAll('#mapStudy .lbl[data-id=pa]').length") == 2, 'the Pacific is labeled on both sides of the map')
        lab = lambda i: pg.evaluate("i => { const t = document.querySelector('#mapStudy .lbl[data-id=' + JSON.stringify(i) + ']'); return [...t.querySelectorAll('tspan')].map(x => x.textContent).join(' ') || t.textContent; }", i)
        check(await lab('ns') == 'NS', 'Study map: the North Sea starts as a short code')
        await tap(pg, '#mapStudy .cpath[data-id="ns"]'); await pg.wait_for_timeout(100)
        check(await lab('ns') == 'North Sea', 'Study map: tapping it opens North Sea')
        await tap(pg, '#mapStudy .ctx-fill'); await pg.wait_for_timeout(100)
        check(await pg.locator('#mapStudy .cpath.sel').count() == 0, 'Study map: tapping land selects nothing')
        await pg.locator('.zoombar button').first.click(); await pg.wait_for_timeout(200)
        left = await pg.evaluate("[...document.querySelectorAll('#mapStudy .lbl[data-short]')].filter(t => t.textContent.length <= 2).length")
        check(left == 0, f'Study map: zoomed in, no short codes are left ({left})')
        await pg.locator('.st[data-id="md"]').first.click(); await pg.wait_for_timeout(150)
        check(await pg.locator('#mapStudy .cpath.sel[data-id="md"]').count() == 1, 'Study map: the list row selects the Mediterranean Sea')
        await pg.context.close()
        pg = await page('listen'); sid = await pg.evaluate('window.__oceMap.cur')
        await tap(pg, f'#mapListen .cpath[data-id="{sid}"]'); await pg.wait_for_timeout(100)
        check('Yes' in await pg.inner_text('#lMsg'), 'Listen: the right tap is accepted')
        await pg.context.close()
        pg = await page('find'); await pg.click('#fStart'); await pg.wait_for_timeout(150)
        for _ in range(2):
            sid = await pg.evaluate('window.__oceMap.cur'); await tap(pg, f'#mapFind .cpath[data-id="{sid}"]')
        check(await pg.inner_text('#fScore') == '2', 'Find it: right taps score')
        await pg.context.close()
        pg = await page('drag')
        check(await pg.locator('#tray .chip').count() == 27, 'Drag: a name chip for every body of water')
        await pg.click('#tray .chip[data-id="ns"]'); await tap(pg, '#mapDrag .cpath[data-id="ns"]')
        check(await pg.inner_text('#dPlaced') == '1/27', 'Drag: a small sea can be placed')
        await pg.click('#tray .chip[data-id="pa"]'); await tap(pg, '#mapDrag .cpath[data-id="at"]')
        check(await pg.inner_text('#dMiss') == '1', 'Drag: a wrong drop counts as a miss')
        await pg.context.close()
        check(not errors, f'no page errors {errors[:3]}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
