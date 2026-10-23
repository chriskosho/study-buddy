"""Shell test (Playwright + Chromium): the shared header and footer, the Home > Subject > Module trail, one-click Home,
Search, the Settings page, the voice picker, and stopping sound with a second click.
Run:  python3 study-buddy/_dev/tests/shell_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8773
fails = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
SEED = """if(!localStorage.getItem('studybuddy.v1.root')){localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));}"""
# a speech engine that never finishes on its own, with three voices (one robotic, one natural, one Spanish)
STUB = """window.__spoken=[];window.__cancels=0;
const V=[{name:'Microsoft David - English (United States)',lang:'en-US',voiceURI:'david'},{name:'Microsoft Aria Online (Natural) - English (United States)',lang:'en-US',voiceURI:'aria'},{name:'Google espanol',lang:'es-ES',voiceURI:'es'}];
window.SpeechSynthesisUtterance=function(t){this.text=t};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push({text:u.text,voice:u.voice&&u.voice.voiceURI,lang:u.lang})},cancel(){window.__cancels++},getVoices(){return V},addEventListener(){}}});"""
CRUMB = "[...document.querySelectorAll('.sbcrumbs li')].map(li => li.textContent.trim())"

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c.add_init_script(SEED); await c.add_init_script(STUB)
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))

        # ---- the trail on every kind of page ----
        for name, url, want in [('module tool', 'modules/science/planets/index.html?tool=quiz', ['Home', 'Science', 'The Planets']),
                                ('Atlas', 'modules/geography/south-america/index.html?tool=study', ['Home', 'Geography', 'South America']),
                                ('calculator', 'utilities/calculator/index.html', ['Home', 'Utilities', 'Calculator']),
                                ('hub module', 'index.html#/module/ancient-rome', ['Home', 'History', 'Ancient Rome']),
                                ('subject', 'index.html#/home/math', ['Home', 'Math']),
                                ('settings', 'index.html#/settings', ['Home', 'Settings'])]:
            await pg.goto(base + url); await pg.wait_for_selector('.sbcrumbs li'); await pg.wait_for_timeout(200)
            check(await pg.evaluate(CRUMB) == want, f'{name}: trail is {" > ".join(want)}')
            check(await pg.locator('#sbFoot').count() == 1 and await pg.locator('#sbFoot a:has-text("Home")').count() == 1, f'{name}: footer with a Home link')
        # ---- one click to Home from anywhere; trail links work ----
        for url in ['modules/science/planets/index.html?tool=sort', 'modules/geography/south-america/index.html?tool=find', 'utilities/calculator/index.html', 'index.html#/about']:
            await pg.goto(base + url); await pg.wait_for_selector('.sbbrand')
            await pg.click('.sbbrand'); await pg.wait_for_selector('a.mod')
            check(pg.url.endswith('#/home'), f'one click from {url.split("?")[0].split("/")[-2] if "/" in url else url} reaches Home')
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.click('.sbcrumbs a:has-text("Science")'); await pg.wait_for_selector('a.mod')
        check(pg.url.endswith('#/home/science'), 'the Subject crumb opens that subject')
        # ---- footer links ----
        await pg.goto(base + 'modules/science/planets/index.html?tool=guide')
        for label, h in [('Settings', 'Settings'), ('Help', 'Help'), ('FAQ', 'FAQ'), ('About', 'About')]:
            await pg.click(f'#sbFoot a:has-text("{label}")'); await pg.wait_for_function('t => document.querySelector("h1") && document.querySelector("h1").textContent.trim() === t', arg=h)
            check(await pg.locator('h1').inner_text() == h, f'footer {label} link opens {h}')
        # ---- Help menu ----
        await pg.click('#sbHelpBtn'); check(await pg.locator('#sbHelpMenu').is_visible(), 'Help menu opens')
        check(await pg.locator('#sbHelpMenu a').count() == 3, 'Help menu lists Help, FAQ, About')
        await pg.keyboard.press('Escape'); check(not await pg.locator('#sbHelpMenu').is_visible(), 'Escape closes the Help menu')
        # ---- search ----
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        await pg.keyboard.press('/'); check(await pg.evaluate("document.activeElement.id") == 'sbQ', '/ focuses search')
        await pg.keyboard.type('planet'); await pg.wait_for_selector('#sbResults li a')
        first = await pg.locator('#sbResults li a b').first.inner_text()
        check('Planet' in first, f'search finds planets first: {first}')
        await pg.keyboard.press('Enter'); await pg.wait_for_selector('.tool')
        check('#/module/planets' in pg.url, 'Enter opens the top result')
        await pg.fill('#sbQ', 'flashcards'); await pg.wait_for_selector('#sbResults li a')
        n = await pg.locator('#sbResults li a').count()
        check(n >= 5 and 'Tool' in await pg.locator('#sbResults li a span').first.inner_text(), f'tool names are searchable ({n} results)')
        await pg.fill('#sbQ', 'dark mode'); await pg.wait_for_selector('#sbResults li a')
        check('Settings' in await pg.locator('#sbResults li a b').first.inner_text(), 'search finds Settings by what it does')
        await pg.fill('#sbQ', 'zzzzqq'); await pg.wait_for_selector('#sbResults .none')
        check(await pg.locator('#sbResults .none').is_visible(), 'a search with no match says so')
        # ---- Settings: saved per child ----
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('.setpanel .seg')
        await pg.click('.seg button[data-k="readAloud"][data-v="true"]')
        check(await pg.evaluate("SB.getSetting('readAloud')") is True, 'Read aloud turns on from Settings')
        await pg.click('.seg button[data-k="readAloud"][data-v="false"]')
        # ---- voice picker ----
        opts = await pg.locator('#voiceSel option').all_inner_texts()
        check(len(opts) == 3 and 'Automatic' in opts[0] and not any('espanol' in o for o in opts), f'voice list: Automatic plus English voices only {opts}')
        await pg.evaluate("window.__spoken.length = 0")
        await pg.click('#voicePrev'); spoken = await pg.evaluate("window.__spoken")
        check(spoken and spoken[-1]['voice'] == 'aria', f'Automatic picks the natural voice, not the robotic one {spoken}')
        await pg.select_option('#voiceSel', 'david'); spoken = await pg.evaluate("window.__spoken")
        check(await pg.evaluate("SB.getSetting('voice')") == 'david' and spoken[-1]['voice'] == 'david', 'a chosen voice is saved and used, with a preview')
        await pg.goto(base + 'modules/science/planets/index.html?tool=guide'); await pg.wait_for_selector('.spk')
        await pg.evaluate("window.__spoken.length = 0"); await pg.click('.spk >> nth=0')
        check((await pg.evaluate("window.__spoken"))[-1]['voice'] == 'david', 'speaker buttons in modules use the chosen voice')
        await pg.select_option if False else None
        # ---- stopping sound ----
        check(await pg.locator('.spk.playing').count() == 1, 'the speaker button shows it is playing')
        cancels = await pg.evaluate("window.__cancels")
        await pg.click('.spk.playing')
        check(await pg.evaluate("window.__cancels") > cancels and await pg.locator('.spk.playing').count() == 0, 'clicking the speaker while it plays stops it')
        await pg.click('.spk >> nth=0'); check(await pg.locator('.spk.playing').count() == 1, 'clicking again plays it again')
        await pg.keyboard.press('Escape'); check(await pg.locator('.spk.playing').count() == 0, 'Escape stops sound')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=cards'); await pg.wait_for_selector('#fcard')
        await pg.click('#fcard'); await pg.wait_for_selector('#faceB .spk'); await pg.click('#faceB .spk')
        check(await pg.locator('.spk.playing').count() >= 1, 'Atlas speaker plays')
        cancels = await pg.evaluate("window.__cancels"); await pg.click('#faceB .spk')
        check(await pg.evaluate("window.__cancels") > cancels and await pg.locator('.spk.playing').count() == 0, 'Atlas speaker stops on a second click')
        # ---- phone ----
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for url in ['index.html#/module/periodic-table', 'modules/science/periodic-table/index.html?tool=guide', 'index.html#/settings', 'index.html#/faq', 'modules/geography/south-america/index.html?tool=study']:
            await pg.goto(base + url); await pg.wait_for_selector('.sbhead'); await pg.wait_for_timeout(200)
            o = await pg.evaluate("({h: document.documentElement.scrollWidth - innerWidth})")
            check(o['h'] <= 0, f'phone {url.split("?")[0]}: no sideways scroll {o}')
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        await pg.click('.sbsearch-toggle'); await pg.fill('#sbQ', 'quiz'); await pg.wait_for_selector('#sbResults li a')
        box = await pg.locator('#sbResults').bounding_box()
        check(box['x'] >= 0 and box['x'] + box['width'] <= 360, f'phone search results fit the screen {box}')
        # ---- review fixes ----
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        # Escape stops automatic Read aloud (no speaker button involved)
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('.spk')
        await pg.evaluate("SB.setSetting('readAloud', true)"); await pg.evaluate("window.__spoken.length = 0; SBT_RELOAD = 1") if False else None; await pg.reload(); await pg.wait_for_selector('.spk'); await pg.wait_for_timeout(400)
        cancels = await pg.evaluate("window.__cancels"); await pg.keyboard.press('Escape')
        check(await pg.evaluate("window.__cancels") > cancels, 'Escape stops automatic Read aloud')
        await pg.evaluate("SB.setSetting('readAloud', false)")
        # Larger text keeps tool screens free of scroll bars
        await pg.evaluate("SB.setSetting('size','large'); SB.applyDisplay()"); await pg.wait_for_timeout(200)
        o = await pg.evaluate("document.documentElement.scrollHeight - innerHeight")
        check(o <= 0, f'larger text: Planets quiz does not scroll at 1440x900 ({o})')
        # Atlas search shows which result is selected
        await pg.evaluate("SB.setSetting('size','normal'); SB.applyDisplay()")
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=study'); await pg.wait_for_selector('#sbQ')
        await pg.fill('#sbQ', 'quiz'); await pg.wait_for_selector('#sbResults li[aria-selected="true"] a')
        bg = await pg.evaluate("getComputedStyle(document.querySelector('#sbResults li[aria-selected=true] a')).backgroundColor")
        check(bg not in ('rgba(0, 0, 0, 0)', 'transparent'), f'Atlas: the selected search result is highlighted {bg}')
        # Tab leaves the search and closes the list
        await pg.keyboard.press('Tab'); check(not await pg.locator('#sbResults').is_visible(), 'Tab out of search closes the results')
        # Escape in the Help menu does not clear the calculator
        await pg.goto(base + 'utilities/calculator/index.html'); await pg.wait_for_selector('.key')
        await pg.keyboard.type('12'); await pg.click('#sbHelpBtn'); await pg.keyboard.press('Escape')
        shown = await pg.evaluate("document.body.innerText")
        check('12' in shown and not await pg.locator('#sbHelpMenu').is_visible(), 'Escape closes the Help menu without clearing the calculator')
        # the search box is empty after you open a result
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        await pg.fill('#sbQ', 'planets'); await pg.wait_for_selector('#sbResults li a'); await pg.keyboard.press('Enter'); await pg.wait_for_selector('.tool')
        check(await pg.input_value('#sbQ') == '', 'search box is empty after opening a result')
        # voice hint recovers when voices arrive late; no errors after leaving Settings
        await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('#voiceSel')
        await pg.evaluate("window.__lateVoices = true")
        for _ in range(3):
            await pg.goto(base + 'index.html#/help'); await pg.goto(base + 'index.html#/settings'); await pg.wait_for_selector('#voiceSel')
        check('natural voice' in await pg.inner_text('#voiceHint'), 'voice hint is the normal text when voices exist')
        # Help, FAQ and About open even when nobody is chosen
        c2 = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c2.add_init_script("localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'a',name:'Joshua',color:'#e4572e'},{id:'b',name:'Eli',color:'#2b4162'}],active:null,pin:null,pinOffered:true}))")
        p2 = await c2.new_page()
        for h in ['help', 'faq', 'about']:
            await p2.goto(base + f'index.html#/{h}'); await p2.wait_for_selector('h1')
            check((await p2.inner_text('h1')).lower() == h, f'#/{h} opens with nobody chosen')
        await c2.close()
        # phone, larger text: the open search field does not cover the header buttons
        c3 = await b.new_context(viewport={'width': 360, 'height': 780}, service_workers='block'); await c3.add_init_script(SEED)
        p3 = await c3.new_page(); await p3.goto(base + 'index.html#/home'); await p3.wait_for_selector('a.mod')
        await p3.evaluate("SB.setSetting('size','large'); SB.setSetting('font','dyslexic'); SB.applyDisplay()"); await p3.wait_for_timeout(300)
        await p3.click('.sbsearch-toggle'); await p3.wait_for_timeout(150)
        hit = await p3.evaluate("(()=>{const r=document.querySelector('.sbsearch-toggle').getBoundingClientRect();return !!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2).closest('.sbsearch-toggle')})()")
        check(hit, f'phone: open search does not cover its own toggle ({hit})')
        await p3.goto(base + 'index.html#/settings'); await p3.wait_for_selector('.setpanel'); await p3.wait_for_timeout(200)
        o = await p3.evaluate("document.documentElement.scrollWidth - innerWidth")
        check(o <= 0, f'phone, larger + dyslexic: Settings has no sideways scroll ({o})')
        await c3.close()
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
