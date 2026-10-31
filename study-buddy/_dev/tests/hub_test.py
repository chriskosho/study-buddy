"""Study Buddy end-to-end test (Playwright + Chromium).
Serves the site on localhost, then walks through: first-run setup, profiles, the home page,
a module page, opening a tool, finishing a flashcard deck, progress on the hub, parent lock,
per-child separation, backup, and layout (1440x900 no scroll, phone width no sideways scroll).
Run:  python3 _dev/tests/hub_test.py   (screenshots go to /tmp/sb_*.png)"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())   # a free port, so tests can run side by side
OUT = os.environ.get('SB_SHOTS', '/tmp')
errors, fails = [], []

def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Q, directory=SITE)
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), h).serve_forever()

def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

SPEECH_STUB = """
window.__spoken=[];
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),300)},cancel(){},getVoices(){return[]}}});
window.SpeechSynthesisUtterance=function(t){this.text=t};
"""

async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")   # measure after fonts and layout settle
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=serve, daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await ctx.add_init_script(SPEECH_STUB)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))

        # ---- first run: straight in as Guest ----
        await pg.goto(base); await pg.wait_for_selector('a.mod')
        check('Hi, Guest' in await pg.locator('h1').inner_text(), 'first visit opens straight to the subjects as Guest')
        check(await pg.locator('#sbAddName').count() == 1, 'Guest chip offers Add a name')
        # admin area offers a PIN; set one (mismatch rejected first)
        await pg.click('#sbFoot a:has-text("Admin area")'); await pg.wait_for_selector('.sb-dlg')
        check('Protect this with an admin PIN' in await pg.locator('.sb-dlg').inner_text(), 'admin area offers a PIN')
        await pg.click('[data-x="set"]')
        await pg.wait_for_timeout(120)
        await pg.fill('[data-x=\"a\"]', '1234'); await pg.fill('[data-x="b"]', '1299'); await pg.click('[data-x="yes"]')
        check('do not match' in await pg.locator('.sb-err').inner_text(), 'mismatched PIN rejected')
        await pg.fill('[data-x="b"]', '1234'); await pg.click('[data-x="yes"]')
        await pg.wait_for_selector('#psec h2')
        await pg.click('nav.tabs a:has-text("Students")'); await pg.wait_for_selector('.kidrow')
        await pg.fill('.kidrow[data-id] .nm', 'Joshua'); await pg.keyboard.press('Tab'); await pg.wait_for_timeout(150)
        for n in ['Eli', 'Hazel', 'Ava']:
            await pg.fill('#newName', n); await pg.click('#addKid'); await pg.wait_for_selector('.kidrow'); await pg.wait_for_timeout(100)
        check(await pg.locator('.sb-dlg').count() == 0, 'no second PIN offer when a PIN is already set')
        await pg.goto(base + '#/'); await pg.wait_for_selector('.whocard')

        # ---- who's studying ----
        check(await pg.locator('.whocard').count() == 4, 'four profile cards')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'who: no scroll at 1440x900 {o}')
        await pg.screenshot(path=f'{OUT}/sb_who.png')
        await pg.click('.whocard:has-text("Joshua")'); await pg.wait_for_selector('a.mod')

        # ---- home ----
        check('Hi, Joshua' in await pg.locator('h1').inner_text(), 'home greets Joshua')
        check(await pg.locator('a.mod').count() == 39, 'thirty-nine module cards (Learn the Keys, Typing Drills, Speed and Accuracy Tests, Multiplication and Division Facts, Fractions, Rounding and Place Value to 1,000, Telling Time and Elapsed Time, Area and Perimeter, Decimal Operations, Multi-Digit Multiplication and Long Division, The Coordinate Plane, Order of Operations, Volume of Solid Figures, Measurement and Area, Division of Fractions, Multiplication of Fractions, South America, US States, Parts of Speech, Ancient Rome, Handwriting, Place Value, Planets, Periodic Table, Black Beauty, Phonograms, Greek and Latin Roots, Ham Radio Technician, Add and Subtract Fractions, The Punic Wars, Weather, Newton and His Laws, Europe, Africa, Asia, North America, Oceania; the archived Black Beauty is not shown)')
        check('Easy' in await pg.locator('a.mod[href="#/module/south-america"]').inner_text() and 'Hard' in await pg.locator('a.mod[href="#/module/south-america"]').inner_text(), 'automatic difficulty range Easy to Hard')
        o = await overflow(pg); check(o['h'] <= 0, f'home: no sideways scroll (the All list may scroll as modules are added) {o}')
        await pg.screenshot(path=f'{OUT}/sb_home.png')
        await pg.click('nav.tabs a:has-text("Math")'); await pg.wait_for_function("document.querySelectorAll('a.mod').length === 15")
        check(await pg.locator('a.mod').count() == 15, 'math filter shows the five 3rd grade modules, Decimal Operations, Multi-Digit Multiplication and Long Division, The Coordinate Plane, Order of Operations, Place Value and Zeros, the three fraction modules, Measurement and Area, and Volume')
        await pg.click('nav.tabs a:has-text("Geography")'); await pg.wait_for_function("document.querySelectorAll('a.mod').length === 9")
        check(await pg.locator('a.mod').count() == 9, 'geography filter shows South America, US States, the five Europe-style continent modules, World, and Oceans')
        await pg.click('nav.tabs a:has-text("Typing")'); await pg.wait_for_function("document.querySelectorAll('a.mod').length === 3")
        check(await pg.locator('a.mod').count() == 3 and 'Learn the Keys' in ' '.join(await pg.locator('a.mod').all_inner_texts()) and 'Typing Drills' in ' '.join(await pg.locator('a.mod').all_inner_texts()), 'typing filter shows Learn the Keys, Typing Drills, and Speed and Accuracy Tests')
        await pg.click('nav.tabs a:has-text("Geography")'); await pg.wait_for_function("document.querySelectorAll('a.mod').length === 9")

        # ---- module page ----
        await pg.click('a.mod[href="#/module/south-america"]'); await pg.wait_for_selector('.tool')
        check(await pg.locator('.tool').count() == 6, 'six tools listed')
        names = await pg.locator('.tool h3').all_inner_texts()
        check(names[0] in ('Study map', 'Flashcards') and names[-1] == 'Spell it', f'tools sorted easy to hard {names}')
        o = await overflow(pg); check(o['h'] <= 0, f'module: no sideways scroll {o}')
        await pg.screenshot(path=f'{OUT}/sb_module.png', full_page=True)

        # ---- open flashcards in the atlas ----
        await pg.click('.tool:has(h3:text-is("Flashcards")) a.btn')
        await pg.wait_for_selector('#fcard')
        check('Home' in await pg.locator('.sbcrumbs').inner_text() and 'South America' in await pg.locator('.sbcrumbs').inner_text(), 'atlas shows the Home > Subject > Module trail')
        check('Joshua' in await pg.locator('.kidpill').inner_text(), 'atlas shows child chip')
        check(await pg.locator('nav.tabs button[aria-selected="true"]').inner_text() == 'Flashcards', 'deep link opened Flashcards')
        o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'atlas flashcards: no scroll at 1440x900 {o}')
        await pg.screenshot(path=f'{OUT}/sb_atlas_cards.png')
        spoken_before = len(await pg.evaluate('window.__spoken'))
        await pg.click('#fcard'); await pg.wait_for_timeout(600)
        check(len(await pg.evaluate('window.__spoken')) == spoken_before, 'flipping a card speaks nothing')
        for i in range(12):
            await pg.click('#cardKnew'); await pg.wait_for_timeout(650 if i == 0 else 80)
        await pg.wait_for_timeout(300)
        check('Deck complete' in await pg.locator('#faceF').text_content(), 'deck completes')
        check(await pg.locator('#streakN').inner_text() == '0', 'flashcards are practice only: no streak')
        rec = await pg.evaluate("SB.toolRecord('south-america','cards')")
        check(not rec or rec.get('best') is None, f'flashcards record no score {rec}')
        # a checked tool (Drag names) does give credit: place every country with no misses
        await pg.click('nav.tabs button[data-tab="drag"]'); await pg.wait_for_selector('#tray .chip')
        await pg.evaluate("C.forEach(c => drTry(c.id, c.id))"); await pg.wait_for_timeout(300)
        check(await pg.locator('#streakN').inner_text() == '12', 'hub streak shows in atlas after a checked tool')
        rec = await pg.evaluate("SB.toolRecord('south-america','drag')")
        check(rec and rec['best'] == 12 and rec['max'] == 12, f'drag result recorded {rec}')

        # Listen and tap deep link check + every visible tab fits
        for tab in ['study', 'drag', 'find', 'listen', 'spell']:
            await pg.click(f'nav.tabs button[data-tab="{tab}"]'); await pg.wait_for_timeout(150)
            o = await overflow(pg); check(o['v'] <= 0 and o['h'] <= 0, f'atlas {tab}: no scroll at 1440x900 {o}')

        # reset in atlas asks for the PIN (fresh tab session so it is locked)
        await pg.evaluate("sessionStorage.clear()")
        await pg.click('#resetAll')
        check(await pg.locator('.sb-dlg:has-text("Admin PIN")').count() == 1, 'atlas reset asks for parent PIN')
        await pg.click('[data-x="no"]')

        # ---- back to the hub ----
        await pg.click('.sbcrumbs a:has-text("Home")'); await pg.wait_for_selector('a.mod')
        await pg.click('a.mod[href="#/module/south-america"]'); await pg.wait_for_selector('.tool')
        txt = await pg.locator('.tool:has(h3:text-is("Drag names"))').inner_text()
        check('Mastered' in txt and 'Best 12/12' in txt, 'hub shows Drag names mastered')
        ftxt = await pg.locator('.tool:has(h3:text-is("Flashcards"))').inner_text()
        check('Practice only' in ftxt and 'Mastered' not in ftxt, 'hub shows flashcards as practice only')
        await pg.click('a:has-text("Back to all modules")'); await pg.wait_for_selector('a.mod')
        check('1 of 4 mastered' in await pg.locator('a.mod[href="#/module/south-america"]').inner_text(), 'module card shows 1 of 4 mastered')
        check('Keep going' in await pg.locator('body').text_content(), 'keep going strip')
        await pg.screenshot(path=f'{OUT}/sb_home_progress.png')

        # ---- another child sees their own progress ----
        await pg.click('a.kidpill'); await pg.click('.whocard:has-text("Eli")'); await pg.wait_for_selector('a.mod')
        check('0 of 4 mastered' in await pg.locator('a.mod[href="#/module/south-america"]').inner_text(), 'Eli has separate progress')
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=cards')
        await pg.wait_for_selector('#stamps .stamp')
        check(await pg.locator('#stampCount').inner_text() == '0/12', 'Eli passport is separate')
        await pg.goto(base + '#/home')

        # ---- admin area ----
        await pg.click('#sbFoot a:has-text("Admin area")'); await pg.wait_for_selector('.sb-dlg')
        check(await pg.locator('.sb-dlg').count() == 1, 'admin area asks for PIN')
        await pg.wait_for_timeout(120)
        await pg.fill('[data-x=\"a\"]', '0000'); await pg.click('[data-x="yes"]')
        check('not right' in await pg.locator('.sb-err').inner_text(), 'wrong PIN rejected')
        await pg.wait_for_timeout(120)
        await pg.fill('[data-x=\"a\"]', '1234'); await pg.click('[data-x="yes"]')
        await pg.wait_for_selector('#psec h2')
        check('Progress' in await pg.locator('#psec h2').inner_text(), 'parent progress opens')
        check(await pg.locator('.ptable >> nth=0 >> th').count() == 6, 'progress table has a column per child')
        await pg.screenshot(path=f'{OUT}/sb_parent_progress.png', full_page=True)
        await pg.click('nav.tabs a:has-text("Students")'); await pg.wait_for_selector('.kidrow')
        await pg.click('.kidrow:has(input[value="Hazel"]) [data-set="readAloud"]')
        hz = await pg.evaluate("(()=>{const p=SB.profiles().find(x=>x.name==='Hazel');return SB.child(p.id).settings.readAloud})()")
        check(hz is True, 'read aloud turned on for Hazel only')
        jo = await pg.evaluate("(()=>{const p=SB.profiles().find(x=>x.name==='Joshua');return SB.child(p.id).settings.readAloud})()")
        check(jo is False, 'read aloud still off for Joshua')
        await pg.screenshot(path=f'{OUT}/sb_parent_children.png', full_page=True)

        # backup round trip
        dump = await pg.evaluate('SB.exportAll()')
        await pg.evaluate("(()=>{const p=SB.profiles().find(x=>x.name==='Joshua');SB.resetChild(p.id)})()")
        gone = await pg.evaluate("(()=>{const p=SB.profiles().find(x=>x.name==='Joshua');return SB.toolRecord('south-america','drag',p.id)})()")
        check(gone is None, 'reset child clears progress')
        await pg.evaluate('t => SB.importAll(t)', dump)
        back = await pg.evaluate("(()=>{const p=SB.profiles().find(x=>x.name==='Joshua');return SB.toolRecord('south-america','drag',p.id)})()")
        check(back and back['best'] == 12, 'backup restores progress')

        # ---- phone width (Galaxy S23: 360 x 780) ----
        await pg.set_viewport_size({'width': 360, 'height': 780})
        for h, name in [('#/', 'who'), ('#/home', 'home'), ('#/module/south-america', 'module')]:
            await pg.goto(base + h); await pg.wait_for_timeout(150)
            if name == 'who' and await pg.locator('.sb-dlg').count(): await pg.keyboard.press('Escape')
            o = await overflow(pg); check(o['h'] <= 0, f'phone {name}: no sideways scroll {o}')
            await pg.screenshot(path=f'{OUT}/sb_phone_{name}.png', full_page=True)
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=drag'); await pg.wait_for_timeout(300)
        o = await overflow(pg); check(o['h'] <= 0, f'phone atlas: no sideways scroll {o}')
        await pg.screenshot(path=f'{OUT}/sb_phone_atlas.png')

        check(not errors, f'no console or page errors {errors}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
    sys.exit(1 if fails else 0)

asyncio.run(main())
