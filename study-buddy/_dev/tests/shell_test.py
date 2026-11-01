"""Shell test (Playwright + Chromium): the shared header and footer, the Home > Subject > Module trail, one-click Home,
Search, the Settings page, the voice picker, and stopping sound with a second click.
Run:  python3 study-buddy/_dev/tests/shell_test.py"""
import asyncio, http.server, threading, functools, os, sys
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
fails = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
SEED = """if(!localStorage.getItem('studybuddy.v1.root')){localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));}"""
# a speech engine that never finishes on its own, with three voices (one robotic, one natural, one Spanish)
STUB = """window.__spoken=[];window.__cancels=0;
const V=[{name:'Microsoft David - English (United States)',lang:'en-US',voiceURI:'david'},{name:'Microsoft Aria Online (Natural) - English (United States)',lang:'en-US',voiceURI:'aria'},{name:'Microsoft George - English (United Kingdom)',lang:'en-GB',voiceURI:'george'},{name:'Google espanol',lang:'es-ES',voiceURI:'es'}];
window.SpeechSynthesisUtterance=function(t){this.text=t};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push({text:u.text,voice:u.voice&&u.voice.voiceURI,lang:u.lang});setTimeout(()=>u.onstart&&u.onstart({}),0)},cancel(){window.__cancels++},getVoices(){return V},addEventListener(){}}});"""
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
        # ---- the back arrow: one step up, on every kind of page, nothing on Home ----
        for name, url, want_href, want_label in [('module tool', 'modules/science/planets/index.html?tool=quiz', '#/home/science', 'Back to Science'),
                                                 ('Atlas', 'modules/geography/south-america/index.html?tool=find', '#/home/geography', 'Back to Geography'),
                                                 ('calculator', 'utilities/calculator/index.html', '#/utilities', 'Back to Utilities'),
                                                 ('hub module', 'index.html#/module/ancient-rome', '#/home/history', 'Back to History'),
                                                 ('subject', 'index.html#/home/math', '#/home', 'Back to Home'),
                                                 ('settings', 'index.html#/settings', '#/home', 'Back to Home')]:
            await pg.goto(base + url); await pg.wait_for_selector('.sbback'); await pg.wait_for_timeout(150)
            check((await pg.get_attribute('.sbback', 'href')).endswith(want_href) and await pg.get_attribute('.sbback', 'aria-label') == want_label, f'{name}: back arrow says "{want_label}" and goes there')
            box = await pg.locator('.sbback').bounding_box(); tr = await pg.locator('.sbcrumbs ol').bounding_box()
            check(box['x'] + box['width'] <= tr['x'] and box['width'] >= 28 and box['height'] >= 28, f'{name}: arrow sits left of the trail and is a tap target of at least 28px')
        await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.click('.sbback'); await pg.wait_for_selector('a.mod')
        check(pg.url.endswith('#/home/science'), 'clicking the arrow in a module opens its subject')
        await pg.click('.sbback'); await pg.wait_for_function("location.hash === '#/home'"); await pg.wait_for_timeout(200)
        check(pg.url.endswith('#/home') and await pg.locator('.sbback').count() == 0, 'then the arrow on the subject page goes Home, and Home has no arrow')
        await pg.set_viewport_size({'width': 360, 'height': 740}); await pg.goto(base + 'modules/science/planets/index.html?tool=quiz'); await pg.wait_for_selector('.sbback')
        check(await pg.evaluate('document.documentElement.scrollWidth <= innerWidth') and await pg.locator('.sbback').is_visible(), 'at 360px the arrow shows and nothing scrolls sideways')
        await pg.set_viewport_size({'width': 1440, 'height': 900})
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
        check(len(opts) == 4 and 'Automatic' in opts[0] and not any('espanol' in o for o in opts), f'voice list: Automatic plus English voices only {opts}')
        await pg.evaluate("window.__spoken.length = 0")
        await pg.click('#voicePrev'); spoken = await pg.evaluate("window.__spoken")
        check(spoken and spoken[-1]['voice'] == 'aria', f'Automatic picks the natural voice, not the robotic one {spoken}')
        await pg.select_option('#voiceSel', label='Microsoft David - English (United States) (en-US)'); spoken = await pg.evaluate("window.__spoken")
        check((await pg.evaluate("SB.getSetting('voice')")).startswith('david|') and spoken[-1]['voice'] == 'david', 'a chosen voice is saved and used, with a preview')
        await pg.select_option('#voiceSel', label='Microsoft George - English (United Kingdom) (en-GB)'); spoken = await pg.evaluate("window.__spoken")
        check(spoken[-1]['voice'] == 'george' and spoken[-1]['lang'] == 'en-GB', f'the speech language follows the chosen voice {spoken[-1]}')
        await pg.wait_for_function("document.querySelector('#voiceNow').textContent.includes('George')")
        check(True, 'Settings says which voice is speaking')
        await pg.select_option('#voiceSel', label='Microsoft David - English (United States) (en-US)')
        await pg.goto(base + 'modules/science/planets/index.html?tool=guide'); await pg.wait_for_selector('.spk')
        await pg.evaluate("window.__spoken.length = 0"); await pg.click('.spk >> nth=0')
        check((await pg.evaluate("window.__spoken"))[-1]['voice'] == 'david', 'speaker buttons in modules use the chosen voice')
        await pg.select_option if False else None
        c3 = await b.new_context(service_workers='block'); await c3.add_init_script(SEED + STUB)
        p3 = await c3.new_page(); await p3.goto(base + 'index.html#/settings'); await p3.wait_for_selector('#voiceSel')
        await p3.evaluate("SB.setSetting('voice', 'aria')"); await p3.reload(); await p3.wait_for_selector('#voiceSel')
        check((await p3.evaluate("document.querySelector('#voiceSel').selectedOptions[0].textContent")).startswith('Microsoft Aria'), 'an older saved voice (a bare voiceURI) still shows as chosen')
        await c3.close()
        # ---- Android-style voices: the same name for every voice, and two with the same everything ----
        ANDROID = """window.__spoken=[];window.SpeechSynthesisUtterance=function(t){this.text=t};
const V=[{name:'English United States',lang:'en_US',voiceURI:'en-us-x-tpf-local',localService:true},{name:'English United States',lang:'en_US',voiceURI:'en-us-x-iom-network',localService:false},{name:'English United States',lang:'en_US',voiceURI:'en-us-x-sfg-local',localService:true},{name:'English United States',lang:'en_US',voiceURI:'en-us-x-same',localService:true},{name:'English United States',lang:'en_US',voiceURI:'en-us-x-same',localService:true}];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push({voice:u.voice&&V.indexOf(u.voice),lang:u.lang});setTimeout(()=>u.onstart&&u.onstart({}),0)},cancel(){},getVoices(){return V},addEventListener(){}}});"""
        c2 = await b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); await c2.add_init_script(SEED + ANDROID)
        p2 = await c2.new_page(); await p2.goto(base + 'index.html#/settings'); await p2.wait_for_selector('#voiceSel option >> nth=1', state='attached')
        labels = await p2.locator('#voiceSel option').all_inner_texts(); vals = await p2.locator('#voiceSel option').evaluate_all("o => o.map(x => x.value)")
        check(len(set(labels)) == len(labels) and len(set(vals)) == len(vals), f'voices with the same name get different labels and ids {labels}')
        for k in range(1, 6):
            await p2.select_option('#voiceSel', index=k); await p2.wait_for_timeout(250)
            sp = await p2.evaluate("window.__spoken"); check(sp and sp[-1]['voice'] == k - 1, f'choice {k} speaks with its own voice (voice {sp[-1] if sp else None})')
        await c2.close()
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
        # ---- cog icon and the two reset options ----
        await pg.goto(base + 'index.html#/home'); await pg.wait_for_selector('a.mod')
        check(await pg.locator('.sbhead a[aria-label="Settings"] svg path').count() == 1 and await pg.locator('.sbhead a[aria-label="Settings"] svg circle').count() == 1, 'the Settings icon is a cog (one toothed outline, one centre hole)')
        c4 = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c4.add_init_script("""if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'a',name:'Joshua',color:'#e4572e'},{id:'b',name:'Eli',color:'#2b4162'}],active:'a',pin:null,pinOffered:true}));
          localStorage.setItem('studybuddy.v1.child.a',JSON.stringify({settings:{sound:true,readAloud:false,theme:'dark',font:'standard',size:'normal',voice:''},streak:5,bestStreak:7,tools:{'planets/quiz':{attempts:2,visits:2,best:8,max:10,lastScore:8,last:1}}}));
          localStorage.setItem('studybuddy.v1.child.b',JSON.stringify({settings:{sound:true,readAloud:false,theme:'light',font:'standard',size:'normal',voice:''},streak:3,bestStreak:3,tools:{}}));
          localStorage.setItem('studybuddy.v1.m.a.calculator',JSON.stringify([{e:'1+1',v:2}]));}""")
        p4 = await c4.new_page(); await p4.goto(base + 'index.html#/settings'); await p4.wait_for_selector('#resetProg')
        # cancel changes nothing
        await p4.click('#resetProg'); await p4.wait_for_selector('.sb-dlg'); await p4.click('.sb-dlg [data-x="no"]')
        check(await p4.evaluate("SB.profile('a') && JSON.parse(localStorage.getItem('studybuddy.v1.child.a')).streak") == 5, 'Cancel keeps the progress')
        await p4.click('#resetProg'); await p4.wait_for_selector('.sb-dlg')
        check('Joshua, Eli' in await p4.inner_text('.sb-dlg'), 'the reset names the children it affects')
        await p4.click('.sb-dlg [data-x="yes"]'); await p4.wait_for_timeout(200)
        r = await p4.evaluate("({n: SB.profiles().length, a: JSON.parse(localStorage.getItem('studybuddy.v1.child.a')), b: JSON.parse(localStorage.getItem('studybuddy.v1.child.b')), calc: localStorage.getItem('studybuddy.v1.m.a.calculator')})")
        check(r['n'] == 2 and r['a']['streak'] == 0 and r['b']['streak'] == 0 and not r['a']['tools'] and r['calc'] is None, f'Reset all progress clears every child but keeps both profiles {r["n"]}')
        check(r['a']['settings']['theme'] == 'dark', 'Reset all progress keeps each child\'s settings')
        await p4.click('#eraseAll'); await p4.wait_for_selector('.sb-dlg'); await p4.click('.sb-dlg [data-x="no"]')
        check(await p4.evaluate("SB.profiles().length") == 2, 'Cancel keeps the profiles')
        await p4.click('#eraseAll'); await p4.wait_for_selector('.sb-dlg'); await p4.click('.sb-dlg [data-x="yes"]')
        await p4.wait_for_selector('a.mod'); await p4.wait_for_timeout(300)
        r = await p4.evaluate("({names: SB.profiles().map(p => p.name), keys: Object.keys(localStorage).filter(k => k === 'studybuddy.v1.child.a' || k === 'studybuddy.v1.child.b').length})")
        check(r['names'] == ['Guest'] and r['keys'] == 0, f'Erase everything removes the profiles and starts fresh as a Guest {r}')
        await c4.close()
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
