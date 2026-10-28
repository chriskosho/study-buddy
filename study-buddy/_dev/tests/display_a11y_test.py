"""Display and keyboard test (Playwright + Chromium): phone layout with OpenDyslexic + larger text, contrast of the main
colored controls in light and dark mode, keyboard access (map countries, Put in order arrows, dialogs), Say names following
Read aloud, and the calculator's rounding and Enter handling.
Run:  python3 study-buddy/_dev/tests/display_a11y_test.py"""
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
def seed(theme, font, size):
    return ("localStorage.setItem('studybuddy.v1.root',JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"
            f"localStorage.setItem('studybuddy.v1.child.k1',JSON.stringify({{settings:{{theme:'{theme}',font:'{font}',size:'{size}',readAloud:false,sound:false}}}}));"
            "Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){(window.__said=window.__said||[]).push(u.text);setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return[]}}});window.SpeechSynthesisUtterance=function(t){this.text=t};")
CONTRAST = """sel => { const el = document.querySelector(sel); if (!el) return null;
  const rgb = s => s.match(/[\\d.]+/g).map(Number);
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]) };
  let bg = null, n = el; while (n && !bg) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length < 4 || c[3] > .95) bg = c; n = n.parentElement }
  const fg = rgb(getComputedStyle(el).color); const a = lum(fg), b = lum(bg || [255, 255, 255]);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }"""
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")   # measure after fonts and layout settle
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    base = f'http://127.0.0.1:{PORT}/'
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # ---- phone: dyslexic + large, light and dark: no sideways scroll; settings and flashcard buttons stay on screen ----
        for theme in ('light', 'dark'):
            c = await b.new_context(viewport={'width': 360, 'height': 780}, service_workers='block')
            await c.add_init_script(seed(theme, 'dyslexic', 'large'))
            pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            for name, url, sel in [('hub', 'index.html', 'a.mod'), ('planets cards', 'modules/science/planets/index.html?tool=cards', '#tab-cards .fcard'),
                                   ('planets sort', 'modules/science/planets/index.html?tool=sort', '#tab-sort .chip'), ('atlas', 'modules/geography/south-america/index.html?tool=study', '#mapStudy .cpath')]:
                await pg.goto(base + url); await pg.wait_for_selector(sel); await pg.wait_for_timeout(300)
                o = await overflow(pg); check(o['h'] <= 0, f'phone {theme} dyslexic+large {name}: no sideways scroll {o}')
            await pg.goto(base + 'modules/science/planets/index.html?tool=cards'); await pg.wait_for_selector('#tab-cards .fcard')
            boxes = await pg.evaluate("[...document.querySelectorAll('#tab-cards .cardbtns .btn')].map(b => { const r = b.getBoundingClientRect(); return [r.left, r.right] })")
            check(boxes and all(l >= 0 and r <= 360 for l, r in boxes), f'phone {theme}: flashcard buttons stay on screen {boxes}')
            h = await pg.evaluate("[...document.querySelectorAll('.iconbtn,.seg button,.pill')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height)")
            check(h and min(h) >= 38, f'phone {theme}: tap targets at least 38px tall (smallest {min(h) if h else None})')
            await c.close()
        # ---- contrast, light and dark ----
        for theme in ('light', 'dark'):
            c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
            await c.add_init_script(seed(theme, 'standard', 'normal'))
            pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(base + 'modules/science/planets/index.html?tool=cards'); await pg.wait_for_selector('#tab-cards .fcard')
            for sel, label in [('#tab-cards .btn.good', 'I knew it button'), ('#tab-cards .btn.warn', 'Still learning button'), ('#tab-cards .tag', 'card tag'), ('header.top h1 small a', 'eyebrow link')]:
                r = await pg.evaluate(CONTRAST, sel)
                check(r is None or r >= 4.5, f'{theme}: {label} contrast {None if r is None else round(r, 2)}')
            await pg.goto(base + 'modules/science/planets/index.html?tool=sort'); await pg.wait_for_selector('#tab-sort .sortTray .chip')
            await pg.click('#tab-sort .sortTray .chip')
            r = await pg.evaluate(CONTRAST, '#tab-sort .chip.sel'); check(r is not None and r >= 4.5, f'{theme}: selected chip contrast {r and round(r, 2)}')
            await pg.goto(base + 'modules/geography/south-america/index.html?tool=cards'); await pg.wait_for_selector('#fcard')
            r = await pg.evaluate(CONTRAST, '.seg button[aria-pressed="true"]'); check(r is None or r >= 4.5, f'{theme}: selected segmented button contrast {r and round(r, 2)}')
            await c.close()
        # ---- keyboard: Atlas Drag names with Tab and Enter; Say names follows Read aloud ----
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
        await c.add_init_script(seed('light', 'standard', 'normal'))
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(base + 'modules/geography/south-america/index.html?tool=drag'); await pg.wait_for_selector('#tray .chip')
        check(await pg.evaluate("document.querySelector('#sayBtn').getAttribute('aria-pressed')") == 'false', 'Say names starts off when Read aloud is off')
        check(await pg.evaluate("[...document.querySelectorAll('#mapDrag .cpath')].every(p => p.tabIndex === 0)"), 'every country on the map can be reached with Tab')
        await pg.focus('#tray .chip'); await pg.keyboard.press('Enter')
        want = await pg.evaluate("DR.sel"); check(bool(want), 'Enter on a name selects it')
        await pg.focus(f'#mapDrag .cpath[data-id="{want}"]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("DR.placed.has(DR.sel || '') || DR.placed.size") == 1 or await pg.evaluate("DR.placed.size") == 1, 'Enter on the right country places the name')
        await pg.click('#sayBtn'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("SB.getSetting('readAloud')") is True, 'turning Say names on turns Read aloud on for this child')
        # ---- keyboard: Put in order arrows keep focus ----
        await pg.goto(base + 'modules/english/black-beauty/index.html?tool=order'); await pg.wait_for_selector('#tab-order .oitem')
        await pg.focus('#tab-order .oitem:nth-child(2) [data-mv="1"]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        ok = await pg.evaluate("(() => { const a = document.activeElement; return !!a && a.matches('[data-mv]') && !!a.closest('.oitem') })()")
        check(ok, 'after moving an item with the keyboard, focus stays on its arrow')
        label = await pg.evaluate("document.activeElement.getAttribute('aria-label')"); check(label and 'Move' in label and len(label) > 12, f'arrows are named for their item: {label}')
        # ---- dialogs: named, and Tab stays inside ----
        await pg.goto(base + 'index.html'); await pg.wait_for_selector('a.mod')
        await pg.evaluate("SB.displayDialog && SB.displayDialog()"); await pg.wait_for_selector('.sb-dlg')
        check(await pg.evaluate("document.querySelector('.sb-dlg').getAttribute('aria-labelledby')") is not None, 'dialog is named by its heading')
        for _ in range(25): await pg.keyboard.press('Tab')
        check(await pg.evaluate("!!document.activeElement.closest('.sb-dlg')"), 'Tab stays inside an open dialog')
        await pg.keyboard.press('Escape')
        # ---- calculator ----
        await pg.goto(base + 'utilities/calculator/index.html'); await pg.wait_for_selector('#result')
        async def calc(text):
            await pg.keyboard.press('Escape'); await pg.keyboard.type(text); await pg.keyboard.press('Enter'); return await pg.locator('#result').inner_text()
        check(await calc('0.1+0.2') == '0.3', 'calculator: 0.1 + 0.2 = 0.3')
        check(await calc('999999999999*999999999') == 'Too big', 'calculator: huge answers say "Too big"')
        check(await calc('1/3000000') == 'Too small to show', 'calculator: tiny answers say "Too small to show"')
        check('e' not in await calc('123456789*987654'), 'calculator: no e-notation')
        await pg.keyboard.press('Escape'); await pg.keyboard.type('7'); await pg.focus('.key[data-k="5"]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        check(await pg.locator('#expr').inner_text() == '75', 'calculator: Enter on a focused key presses that key')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED')); sys.exit(1 if fails else 0)
asyncio.run(main())
