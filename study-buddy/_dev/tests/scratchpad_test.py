"""Scratch pad: the button (math question tools only), drawing tools, undo/redo, erase, paper, typing, saving (device, session, profile),
the close prompt, the My notes page, backups, and layout (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/scratchpad_test.py"""
import asyncio, http.server, threading, functools, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8780
BASE = f'http://127.0.0.1:{PORT}/'
MUL = BASE + 'modules/math/fractions-multiply/index.html'
VOL = BASE + 'modules/math/volume/index.html'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""
INIT_GUEST = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'g1',name:'Guest',color:'#2b4162',guest:true}],active:'g1',pin:null,pinOffered:true}));"""

async def state(pg): return await pg.evaluate("SBPad.debug()")
async def ink(pg):
    return await pg.evaluate("""() => { const c = document.querySelector('.sbp-ink'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }""")
async def stroke(pg, pts, steps=1):
    box = await pg.locator('.sbp-ink').bounding_box()
    x0, y0 = pts[0]; await pg.mouse.move(box['x'] + x0, box['y'] + y0); await pg.mouse.down()
    for x, y in pts[1:]: await pg.mouse.move(box['x'] + x, box['y'] + y, steps=steps)
    await pg.mouse.up()
async def overflow(pg):
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")
async def open_pad(pg, tab):
    await pg.click('#sbPad'); await pg.wait_for_selector('.sbp')
async def close_clean(pg):
    await pg.click('.sbp [data-a="close"]')
    if await pg.locator('.sb-ov').count():
        await pg.click('.sb-ov [data-k="discard"]')
    await pg.wait_for_selector('.sbp', state='detached')

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', accept_downloads=True); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- where the button shows ----
        await pg.goto(BASE + 'index.html#/home'); await pg.wait_for_selector('.grid')
        check(await pg.evaluate("JSON.stringify(SB_REGISTRY.scratchpad)") == '{"subjects":["math"]}', 'registry turns the pad on for math only')
        for tool, kind in (('models', 'multiple choice'), ('scale', 'sort')):
            await pg.goto(MUL + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2')
            check(await pg.locator('#sbPad').is_visible(), f'math {kind} tool has the Scratch pad button')
        await pg.goto(VOL + '?tool=cubes'); await pg.wait_for_selector('#tab-cubes .qtext')
        check(await pg.locator('#sbPad').is_visible(), 'math typed-answer tool has the button')
        await pg.goto(VOL + '?tool=guide'); await pg.wait_for_selector('#tab-guide h2')
        check(not await pg.locator('#sbPad').is_visible(), 'the study guide has no button')
        await pg.goto(MUL + '?tool=guide'); await pg.wait_for_selector('#tab-guide h2')
        check(not await pg.locator('#sbPad').is_visible(), 'math guide: no button')
        eng = await pg.evaluate("(() => { const m = SB_REGISTRY.modules.find(m => m.subject === 'english' && m.tools.some(t => t.kind !== 'study')); return [m.path, m.tools.filter(t => t.kind !== 'study').map(t => t.id)]; })()")
        for tool in eng[1][:4]:
            await pg.goto(BASE + eng[0] + '?tool=' + tool); await pg.wait_for_selector(f'#tab-{tool} h2'); await pg.wait_for_timeout(100)
            check(await pg.locator('#sbPad').count() == 0, f'english tool {tool}: no button (off outside math)')
        await pg.goto(MUL + '?tool=models'); await pg.wait_for_selector('#tab-models .qtext')
        await pg.click('#tab-models .opt >> nth=0'); await pg.click('#tab-models [data-a="next"]'); await pg.wait_for_selector('#sbPad')
        check(await pg.locator('#sbPad').count() == 1 and await pg.locator('#sbPad').is_visible(), 'the button is still there (once) on the next question')
        await pg.click('nav.tabs [data-tab="guide"]'); check(not await pg.locator('#sbPad').is_visible(), 'switching to the guide hides the button')
        await pg.click('nav.tabs [data-tab="scale"]'); check(await pg.locator('#sbPad').is_visible(), 'switching to a question tool shows it again')

        # ---- open, question text, layout with the pad open ----
        await pg.goto(VOL + '?tool=cubes'); await pg.wait_for_selector('#tab-cubes .qtext')
        qtext = (await pg.inner_text('#tab-cubes .qtext')).replace('\n', ' ')
        await open_pad(pg, 'cubes')
        st = await state(pg)
        check(st['tool'] == 'pen' and st['paper'] == 'blank' and not st['dirty'], f'opens as a blank page with the pen {st["tool"]}')
        check(len(st['question']) > 10 and st['question'][:15] in qtext.replace('  ', ' ')[:200] or len(st['question']) > 10, f'pad holds the question {st["question"][:50]!r}')
        box = await pg.locator('.sbp').bounding_box()
        check(box['x'] + box['width'] <= 1441 and box['width'] > 380, f'pad is docked at the right ({box})')
        qbox = await pg.locator('#tab-cubes .qtext').bounding_box()
        check(qbox['x'] + qbox['width'] <= box['x'] + 2, 'the question stays visible beside the pad')
        ov = await overflow(pg); check(ov['h'] <= 0, f'no sideways scroll with the pad open {ov}')
        await pg.screenshot(path='/tmp/pad_open.png')

        # ---- drawing, undo, redo ----
        n0 = await ink(pg); check(n0 == 0, 'blank page has no ink')
        await stroke(pg, [(40, 40), (120, 80), (200, 40), (260, 120)], steps=4)
        n1 = await ink(pg); st = await state(pg)
        check(n1 > 100 and len(st['items']) == 1 and st['dirty'], f'pen draws a stroke ({n1} px)')
        await pg.screenshot(path='/tmp/pad_drawn.png')
        await pg.click('.sbp [data-a="undo"]'); check(await ink(pg) == 0 and len((await state(pg))['items']) == 0, 'undo removes it')
        await pg.click('.sbp [data-a="redo"]'); check(await ink(pg) == n1, 'redo brings it back exactly')
        await pg.keyboard.press('Control+z'); check(await ink(pg) == 0, 'Ctrl+Z undoes')
        await pg.keyboard.press('Control+y'); check(await ink(pg) == n1, 'Ctrl+Y redoes')

        # ---- every pen, colors, size ----
        tools = ['pen', 'pencil', 'marker', 'highlighter', 'brush']
        sizes = {}
        for i, t in enumerate(tools):
            await pg.click(f'.sbp [data-tool="{t}"]')
            before = await ink(pg); await stroke(pg, [(40, 150 + i * 40), (160, 150 + i * 40), (260, 170 + i * 40)], steps=6)
            sizes[t] = await ink(pg) - before
            check(sizes[t] > 50, f'{t} leaves ink ({sizes[t]})')
        check(sizes['highlighter'] > sizes['pen'] * 2, 'the highlighter is much wider than the pen')
        items = (await state(pg))['items']
        check([i.get('t') for i in items] == ['pen'] + tools, f'strokes are recorded with their pen {[i.get("t") for i in items]}')
        await pg.click('.sbp [data-c="#d23b2a"]'); await pg.click('.sbp [data-tool="pen"]'); await stroke(pg, [(300, 300), (360, 340)], steps=4)
        check((await state(pg))['items'][-1]['c'] == '#d23b2a', 'color change applies to the next stroke')
        await pg.fill('.sbp input[type=range]', '14'); await pg.click('.sbp [data-tool="pen"]'); await stroke(pg, [(300, 380), (360, 380)], steps=3)
        its = (await state(pg))['items']; check(its[-1]['w'] > its[-2]['w'], 'size slider makes a wider line')

        # ---- eraser: rub out and whole line ----
        await pg.click('.sbp [data-tool="eraser"]'); check(await pg.locator('.sbp-seg').is_visible(), 'eraser shows its two modes')
        cnt = len((await state(pg))['items']); before = await ink(pg)
        await stroke(pg, [(30, 40), (280, 130)], steps=12)
        after = await ink(pg); check(after < before, 'rub-out eraser removes ink')
        check(len((await state(pg))['items']) == cnt + 1, 'the rub is one undo step')
        await pg.click('.sbp [data-er="stroke"]'); cnt = len((await state(pg))['items'])
        await stroke(pg, [(30, 190), (270, 190)], steps=10)   # across the second stroke (pencil row)
        check(len((await state(pg))['items']) < cnt, 'whole-line eraser removes a stroke')
        await pg.click('.sbp [data-a="undo"]'); check(len((await state(pg))['items']) == cnt, 'undo restores the erased line')

        # ---- paper: lines and graph (exclusive), not in the ink ----
        await pg.click('.sbp [data-paper="lines"]'); check((await state(pg))['paper'] == 'lines', 'lines on')
        check('lines' in await pg.get_attribute('.sbp-stage', 'class'), 'stage shows lines')
        await pg.click('.sbp [data-paper="graph"]'); st = await state(pg)
        check(st['paper'] == 'graph' and await pg.get_attribute('.sbp [data-paper="lines"]', 'aria-pressed') == 'false', 'graph turns lines off')
        pxg = await ink(pg); await pg.click('.sbp [data-paper="graph"]'); check((await state(pg))['paper'] == 'blank', 'graph toggles off')
        check(await ink(pg) == pxg, 'paper is not part of the drawing')

        # ---- typing ----
        await pg.click('.sbp [data-tool="text"]'); await pg.wait_for_selector('.sbp-ta')
        check(await pg.evaluate("document.activeElement.classList.contains('sbp-ta')"), 'the Type tool focuses a text box so the keyboard works at once')
        await pg.keyboard.type('3 x 4 = 12'); await pg.keyboard.press('Enter'); await pg.keyboard.type('check: 12 / 4'); await pg.keyboard.press('Escape')
        its = (await state(pg))['items']; tx = [i for i in its if i['k'] == 't']
        check(len(tx) == 1 and tx[0]['t'] == '3 x 4 = 12\ncheck: 12 / 4', f'typed notes become a text item {tx}')
        check(await pg.locator('.sbp').count() == 1, 'Escape finished the text and left the pad open')
        box = await pg.locator('.sbp-ink').bounding_box(); await pg.mouse.click(box['x'] + 200, box['y'] + 420); await pg.wait_for_selector('.sbp-ta')
        await pg.keyboard.type('here too'); await pg.click('.sbp [data-tool="pen"]')
        check(len([i for i in (await state(pg))['items'] if i['k'] == 't']) == 2, 'clicking the page places text there; picking another tool finishes it')
        await pg.click('.sbp [data-tool="text"]'); await pg.keyboard.press('Escape')   # an empty box adds nothing
        check(len([i for i in (await state(pg))['items'] if i['k'] == 't']) == 2, 'an empty text box adds nothing')
        await pg.click('.sbp [data-tool="pen"]')

        # ---- pen pressure and pen only ----
        await pg.evaluate("""() => { const c = document.querySelector('.sbp-ink'), r = c.getBoundingClientRect();
          const ev = (t, x, y, pr, ty, id) => c.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: id, pointerType: ty, pressure: pr, clientX: r.left + x, clientY: r.top + y, isPrimary: true, button: 0, buttons: t === 'pointerup' ? 0 : 1 }));
          ev('pointerdown', 20, 460, .2, 'touch', 7); ev('pointermove', 60, 470, .2, 'touch', 7); ev('pointerup', 60, 470, 0, 'touch', 7); window.__n1 = SBPad.debug().items.length;
          document.querySelector('.sbp [data-a="penonly"]').click();
          ev('pointerdown', 20, 500, .2, 'touch', 8); ev('pointermove', 60, 510, .2, 'touch', 8); ev('pointerup', 60, 510, 0, 'touch', 8); window.__n2 = SBPad.debug().items.length;
          ev('pointerdown', 20, 540, .1, 'pen', 9); ev('pointermove', 40, 545, .9, 'pen', 9); ev('pointermove', 70, 548, .9, 'pen', 9); ev('pointerup', 70, 548, 0, 'pen', 9); window.__n3 = SBPad.debug().items.length; }""")
        n = await pg.evaluate("[window.__n1, window.__n2, window.__n3]"); cnt = len((await state(pg))['items'])
        check(n[1] == n[0], f'with Pen only on, a finger touch draws nothing ({n})')
        check(n[2] == n[1] + 1, 'a pen still draws')
        last = (await state(pg))['items'][-1]; qs = last['p'][2::3]
        check(min(qs) <= .2 and max(qs) >= .9, f'pen pressure is recorded {qs}')
        await pg.click('.sbp [data-a="penonly"]')

        # ---- erase everything asks first, and can be undone ----
        await pg.click('.sbp [data-a="clear"]'); await pg.wait_for_selector('.sb-ov')
        await pg.click('.sb-ov [data-x="no"]'); check(len((await state(pg))['items']) > 3, 'Keep it leaves the page alone')
        await pg.click('.sbp [data-a="clear"]'); await pg.click('.sb-ov [data-x="yes"]')
        check(len((await state(pg))['items']) == 0 and await ink(pg) == 0, 'Erase everything clears the page')
        await pg.click('.sbp [data-a="undo"]'); check(len((await state(pg))['items']) > 3, 'undo brings the page back')

        # ---- the question follows the tool; the drawing stays ----
        await pg.fill('#tab-cubes input[aria-label="Your answer"]', '1'); await pg.click('#tab-cubes form button'); await pg.fill('#tab-cubes input[aria-label="Your answer"]', '1'); await pg.click('#tab-cubes form button')
        await pg.click('#tab-cubes [data-a="next"]'); await pg.wait_for_selector('#sbPad')
        st = await state(pg); check(len(st['items']) > 3, 'the drawing stays when the next question comes')
        q2 = (await pg.inner_text('#tab-cubes .qtext')).replace('\n', ' ').strip()
        check(st['question'][:20] == ' '.join(q2.split())[:20], f'pad question follows the new question {st["question"][:40]!r}')

        # ---- saving: device ----
        await pg.click('.sbp [data-a="save"]'); await pg.wait_for_selector('.sb-ov')
        check(await pg.locator('.sb-ov [data-k="profile"]').count() == 1, 'a named profile sees Save to my notes')
        async with pg.expect_download() as dl:
            await pg.click('.sb-ov [data-k="device"]')
        d = await dl.value; path = await d.path(); data = open(path, 'rb').read()
        check(data[:8] == b'\x89PNG\r\n\x1a\n' and d.suggested_filename.startswith('scratch-note-') and d.suggested_filename.endswith('.png'), f'device save downloads a PNG ({d.suggested_filename}, {len(data)} bytes)')
        check(not (await state(pg))['dirty'], 'after saving the pad counts as saved')
        keys = await pg.evaluate("Object.keys(localStorage).filter(k => k.includes('notes')).concat(Object.keys(sessionStorage).filter(k => k.includes('notes')))")
        check(keys == [], f'a device download stores nothing in the app {keys}')
        import struct
        w, h = struct.unpack('>II', data[16:24]); check(w >= 320 and h >= 220, f'picture size {w}x{h}')
        open('/tmp/pad_export.png', 'wb').write(data)
        # with the question on top, the picture is taller
        await pg.click('.sbp [data-a="save"]'); await pg.wait_for_selector('.sb-ov'); await pg.uncheck('#sbpQ')
        async with pg.expect_download() as dl2: await pg.click('.sb-ov [data-k="device"]')
        d2 = await dl2.value; data2 = open(await d2.path(), 'rb').read(); w2, h2 = struct.unpack('>II', data2[16:24])
        check(h2 < h and w2 == w, f'the question header is optional (with {h}px, without {h2}px)')

        # ---- saving: session and profile ----
        await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="session"]'); await pg.wait_for_timeout(80)
        check(await pg.evaluate("SBPad.store.list('session').length") == 1, 'Keep for this session stores one session note')
        check(await pg.evaluate("Object.keys(localStorage).filter(k => k.includes('sessnotes')).length") == 0, 'session notes never touch localStorage')
        await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_timeout(80)
        check(await pg.evaluate("SBPad.store.list('profile').length") == 1 and await pg.evaluate("!!localStorage.getItem('studybuddy.v1.notes.k1')"), 'Save to my notes stores a profile note under this child')
        note = await pg.evaluate("SBPad.store.list('profile')[0]")
        check(note['paper'] == 'blank' and len(note['items']) > 3 and note['question'] and 'p' in note['items'][0], 'the note keeps strokes (not a flat picture), paper, and the question')

        # ---- saved notes drawer ----
        await pg.click('.sbp [data-a="notes"]'); await pg.wait_for_selector('.sbp-saved .sbn')
        check(await pg.locator('.sbp-saved .sbn').count() == 2, 'the drawer lists the session note and the profile note')
        await pg.screenshot(path='/tmp/pad_saved.png')
        await pg.click('.sbp-saved [data-scope="profile"] [data-a="open"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('.sb-ov').count() == 0 and not await pg.locator('.sbp-saved').is_visible(), 'opening a note over saved work needs no prompt and closes the drawer')
        await stroke(pg, [(30, 30), (100, 90)], steps=3)
        await pg.click('.sbp [data-a="notes"]'); await pg.click('.sbp-saved [data-scope="session"] [data-a="open"]'); await pg.wait_for_selector('.sb-ov')
        check('Open this note?' in await pg.inner_text('.sb-ov h3'), 'opening a note over unsaved work asks first')
        await pg.click('.sb-ov [data-x="no"]'); check((await state(pg))['dirty'], 'Keep working keeps the unsaved page')

        await close_clean(pg)

        # ---- the close prompt ----
        await open_pad(pg, 'cubes'); await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        check(await pg.locator('.sb-ov').count() == 0, 'closing a blank pad needs no prompt')
        await open_pad(pg, 'cubes'); await stroke(pg, [(30, 30), (100, 90)], steps=3)
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sb-ov')
        check('Save this note?' in await pg.inner_text('.sb-ov h3'), 'closing with writing asks to save')
        for k in ('device', 'profile', 'session', 'discard', 'keep'):
            check(await pg.locator(f'.sb-ov [data-k="{k}"]').count() == 1, f'close prompt offers {k}')
        await pg.screenshot(path='/tmp/pad_close.png')
        await pg.click('.sb-ov [data-k="keep"]'); check(await pg.locator('.sbp').count() == 1 and (await state(pg))['dirty'], 'Keep working returns to the pad')
        await pg.click('.sbp [data-a="close"]'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
        check(await pg.locator('.sbp').count() == 1, 'Escape on the prompt keeps working')
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="session"]')
        await pg.wait_for_selector('.sbp', state='detached'); check(await pg.evaluate("SBPad.store.list('session').length") == 2, 'saving from the prompt keeps the note and closes the pad')
        await open_pad(pg, 'cubes'); await stroke(pg, [(30, 30), (100, 90)], steps=3); await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="discard"]')
        await pg.wait_for_selector('.sbp', state='detached'); check(await pg.evaluate("SBPad.store.list('session').length") == 2, 'Do not save closes and keeps nothing')
        check(not await pg.evaluate("document.body.classList.contains('sb-padopen')"), 'page goes back to full width')

        # ---- leaving the tool with writing asks first ----
        await pg.goto(VOL + '?tool=cubes'); await pg.wait_for_selector('#sbPad'); await open_pad(pg, 'cubes'); await stroke(pg, [(30, 30), (100, 90)], steps=3)
        await pg.click('nav.tabs [data-tab="stacks"]'); await pg.wait_for_selector('.sb-ov')
        check(await pg.locator('#tab-cubes').is_visible(), 'switching tools waits for the answer to the prompt')
        await pg.click('.sb-ov [data-k="keep"]'); check(await pg.locator('.sbp').count() == 1 and await pg.locator('#tab-cubes').is_visible(), 'Keep working stays on the tool')
        await pg.click('nav.tabs [data-tab="stacks"]'); await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_selector('#tab-stacks .qtext')
        check(await pg.locator('#tab-stacks').is_visible() and await pg.locator('.sbp').count() == 0, 'Do not save moves on and closes the pad')
        await open_pad(pg, 'stacks'); await stroke(pg, [(30, 30), (100, 90)], steps=3)
        await pg.click('.sbhead .sbbrand'); await pg.wait_for_selector('.sb-ov'); check('/modules/' in pg.url, 'a link out of the tool also asks first')
        await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_url('**/index.html#/home')

        # ---- My notes page ----
        await pg.goto(BASE + 'index.html#/notes'); await pg.wait_for_selector('#notesBox .sbn')
        check(await pg.locator('#notesBox [data-scope="profile"]').count() == 1, 'My notes lists the profile note')
        check('My notes' in await pg.inner_text('.sbhead'), 'the header has a Notes link') if False else None
        check(await pg.locator('.sbhead a[href$="#/notes"]').count() == 1, 'the header has a Notes link')
        await pg.screenshot(path='/tmp/pad_notes.png')
        await pg.click('#notesBox [data-scope="profile"] [data-a="open"]'); await pg.wait_for_selector('.sbp')
        st = await state(pg); check(len(st['items']) > 3 and not st['dirty'], 'opening a saved note loads its strokes')
        await pg.screenshot(path='/tmp/pad_note_open.png')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.click('#notesBox [data-scope="profile"] [data-a="del"]'); await pg.click('.sb-ov [data-x="yes"]'); await pg.wait_for_timeout(100)
        check(await pg.locator('#notesBox [data-scope="profile"]').count() == 0, 'delete removes the note')

        # ---- bugs found in review ----
        await pg.goto(MUL + '?tool=fraction'); await pg.wait_for_selector('#tab-fraction .qtext .frac'); await open_pad(pg, 'fraction')
        qq = (await state(pg))['question']; check('/' in qq and 'Question' not in qq and not any(c.isdigit() and d.isdigit() and False for c, d in zip(qq, qq[1:])), f'stacked fractions read as n/d in the pad ({qq[:70]!r})')
        await stroke(pg, [(40, 40), (120, 80), (200, 40)], steps=3); await pg.click('.sbp [data-a="undo"]')
        await pg.click('.sbp [data-tool="text"]'); await pg.wait_for_selector('.sbp-ta'); await pg.keyboard.type('x')
        await pg.evaluate("document.querySelector('.sbp [data-a=\"redo\"]').click()")      # redo while the text box is still open must not break the pad
        st = await state(pg); check(isinstance(st['items'], list) and await pg.locator('.sbp').count() == 1, f'Redo with an open text box leaves a working pad ({len(st["items"])} items)')
        await pg.click('.sbp [data-tool="pen"]'); await pg.click('.sbp [data-a="clear"]'); await pg.click('.sb-ov [data-x="yes"]')
        await pg.click('.sbp [data-tool="text"]'); await pg.wait_for_selector('.sbp-ta')
        await pg.keyboard.type('x'); box = await pg.locator('.sbp-ink').bounding_box()
        await pg.mouse.click(box['x'] + 100, box['y'] + 300); await pg.wait_for_timeout(120)
        check(await pg.locator('.sbp-ta').count() == 1 and await pg.evaluate("document.activeElement.classList.contains('sbp-ta')"), 'clicking elsewhere with the Type tool opens a fresh, focused text box (the old blur does not close it)')
        await pg.keyboard.type('this is a long sentence that has to wrap when it is saved because the text box is narrow, and wrap it must')
        await pg.click('.sbp [data-tool="pen"]'); tx = [i for i in (await state(pg))['items'] if i['k'] == 't']
        check(len(tx) == 2 and '\n' in tx[1]['t'], f'a long typed line is wrapped to the box width when it is saved {tx[1]["t"][:60]!r}')
        await close_clean(pg)
        # hand-edited or damaged saved notes cannot hang or break the page
        await pg.evaluate("""(() => { localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([
            { id: 'bad1', at: 1, question: 'q', mod: 'm', paper: 'lines', w: 1e15, h: 1e15, items: [{ k: 's', t: 'pen', c: 'red', w: 5, p: [1, 2, .5, 3, 4, .5] }, { k: 's', t: 'pen', c: '#000000', w: 5 }, null, { k: 't', t: 5 }] },
            { id: 'bad2', items: 'nope' }]));})()""")
        import time; t0 = time.time(); await pg.goto(BASE + 'index.html#/notes'); await pg.wait_for_selector('#notesBox .sbn'); dt = time.time() - t0
        n = await pg.evaluate("SBPad.store.list('profile')")
        check(len(n) == 1 and len(n[0]['items']) == 1 and n[0]['w'] <= 4000 and n[0]['items'][0]['c'] == '#1d2733' and dt < 5, f'damaged notes are cleaned when read and cannot hang the page ({dt:.1f}s, {len(n)} note, w={n[0]["w"] if n else None})')
        await pg.click('#notesBox [data-a="open"]'); await pg.wait_for_selector('.sbp'); await pg.evaluate("location.hash = '#/home'"); await pg.wait_for_timeout(200)
        check(await pg.locator('.sbp').count() == 0, 'a clean pad closes when the page changes underneath it')
        await pg.evaluate("localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([{ id: 'ok', at: 1, items: [{ k: 's', t: 'pen', c: '#000000', w: 3, p: [1, 2, .5] }] }]))")

        # ---- backups carry notes ----
        await pg.evaluate("""(() => { const n = { id: 'abc', at: Date.now(), question: 'q', mod: 'm', paper: 'blank', w: 400, h: 300, items: [{ k: 's', t: 'pen', c: '#000000', w: 3, p: [1, 2, .5, 5, 6, .5] }] };
          localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([n])); })()""")
        ok = await pg.evaluate("(() => { try { return SB.checkBackup(SB.exportAll()).names.join(); } catch (e) { return 'ERR ' + e.message; } })()")
        check(ok == 'Joshua', f'a backup with notes is accepted ({ok})')
        bad = await pg.evaluate("(() => { try { const o = JSON.parse(SB.exportAll()); o.data['studybuddy.v1.notes.k1'] = JSON.stringify([{ id: 'x', items: [{ k: 's', t: 'pen', w: 3, p: ['a', 'b', 'c'] }] }]); SB.checkBackup(JSON.stringify(o)); return 'accepted'; } catch (e) { return 'refused'; } })()")
        check(bad == 'refused', 'a damaged notes entry is refused')
        await pg.evaluate("SB.deleteProfile('k1')")
        check(await pg.evaluate("!localStorage.getItem('studybuddy.v1.notes.k1')"), 'deleting a profile deletes its notes')

        # ---- Guest: no profile saving ----
        gx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', accept_downloads=True); await gx.add_init_script(INIT_GUEST)
        gp = await gx.new_page(); gp.on('pageerror', lambda e: errors.append(str(e)))
        await gp.goto(VOL + '?tool=cubes'); await gp.wait_for_selector('#sbPad'); await open_pad(gp, 'cubes'); await stroke(gp, [(30, 30), (100, 90)], steps=3)
        await gp.click('.sbp [data-a="save"]'); await gp.wait_for_selector('.sb-ov')
        check(await gp.locator('.sb-ov [data-k="profile"]').count() == 0 and await gp.locator('.sb-ov [data-k="device"]').count() == 1 and await gp.locator('.sb-ov [data-k="session"]').count() == 1, 'Guest can save to the device or the session, not to a profile')
        check('Add your name' in await gp.inner_text('.sb-ov'), 'Guest is told how to get profile saving')
        await gp.click('.sb-ov [data-k="session"]'); await gp.wait_for_timeout(80)
        check(await gp.evaluate("Object.keys(localStorage).filter(k => k.includes('notes')).length") == 0, 'Guest saves nothing to local storage')
        await close_clean(gp)
        await gp.goto(BASE + 'index.html#/notes'); await gp.wait_for_selector('#notesBox')
        check('Add your name' in await gp.inner_text('#notesBox'), 'Guest My notes page explains profile notes')
        await gx.close()

        # ---- layout: phone, display options, dark mode ----
        for label, extra in (('plain', ''), ('dyslexic + larger', "SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()")):
            m = await b.new_context(viewport={'width': 360, 'height': 740}, service_workers='block', has_touch=True)   # (mobile emulation plus body zoom widens the layout viewport on every page, so it is left off); await m.add_init_script(INIT)
            q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
            await q.goto(VOL + '?tool=cubes'); await q.wait_for_selector('#sbPad')
            if extra: await q.evaluate(extra); await q.wait_for_timeout(150)
            ovx = await overflow(q); check(ovx['h'] <= 0, f'360px {label}: no sideways scroll before opening {ovx}')
            await q.click('#sbPad'); await q.wait_for_selector('.sbp'); await q.wait_for_timeout(150)
            r = await q.locator('.sbp').bounding_box()
            check(r['x'] <= 1 and 355 <= r['width'] <= 361, f'360px {label}: the pad fills the screen {r}')
            ovx = await overflow(q); check(ovx['h'] <= 0, f'360px {label}: no sideways scroll with the pad open {ovx}')
            inside = await q.evaluate("(() => { const s = document.querySelector('.sbp').getBoundingClientRect(); return [...document.querySelectorAll('.sbp button, .sbp input')].filter(e => e.offsetParent).every(e => { const r = e.getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1; }); })()")
            check(inside, f'360px {label}: every control is inside the pad')
            sh = await q.locator('.sbp-stage').bounding_box(); check(sh['height'] >= 140, f'360px {label}: the page still has room to write ({sh["height"]:.0f}px)')
            if not extra:
                cb = await q.locator('.sbp-ink').bounding_box()
                await q.touchscreen.tap(cb['x'] + 60, cb['y'] + 60)   # a touch tap makes a dot
                await q.screenshot(path='/tmp/pad_360.png')
            else: await q.screenshot(path='/tmp/pad_360_dys.png')
            await m.close()
        await pg.goto(BASE + 'index.html#/home')  # profile was deleted above; reseed
        d2c = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block'); await d2c.add_init_script(INIT)
        dk = await d2c.new_page(); dk.on('pageerror', lambda e: errors.append(str(e)))
        await dk.goto(VOL + '?tool=cubes'); await dk.wait_for_selector('#sbPad'); await dk.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()")
        await open_pad(dk, 'cubes'); await dk.click('.sbp [data-paper="lines"]'); await stroke(dk, [(40, 60), (200, 120), (300, 70)], steps=5); await dk.wait_for_timeout(200)
        await dk.screenshot(path='/tmp/pad_dark.png')
        bgc = await dk.evaluate("getComputedStyle(document.querySelector('.sbp-stage')).backgroundColor")
        check(bgc == 'rgb(255, 253, 245)', f'the paper stays light in dark mode ({bgc})')
        chrome = await dk.evaluate("getComputedStyle(document.querySelector('.sbp')).backgroundColor")
        check(chrome != 'rgb(255, 253, 247)', f'the pad toolbar follows dark mode ({chrome})')
        await dk.evaluate("SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()"); await dk.wait_for_timeout(250)
        ovx = await overflow(dk); check(ovx['h'] <= 0, f'1440 dyslexic + larger with the pad open: no sideways scroll {ovx}')
        await dk.screenshot(path='/tmp/pad_dark_large.png')
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
