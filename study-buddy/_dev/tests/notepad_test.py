"""Notepad (November 2026): New note on the Notes page, formatted typing (bold, italic, underline, strike, colors, highlight, links, lists,
checklists, alignment, clear), fonts (Handwriting by default) and sizes, letters sitting on the lines, full-width typing, drawings that move
with their text, shapes (draw, move, resize, fill, outline, width, shadow, order, delete, nudge, undo), Full screen with Page and Pageless,
downloads (PDF, Word, text, picture, each checked as a real file), saving and reopening, cleaning unsafe text, old notes, backups, and layout
at 1440x900, 360x740 and 915x412 (Playwright + Chromium).
Run:  python3 study-buddy/_dev/tests/notepad_test.py"""
import asyncio, http.server, threading, functools, os, sys, json, zipfile, io, re
import xml.etree.ElementTree as ET
from playwright.async_api import async_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(__import__('socket').socket())
BASE = f'http://127.0.0.1:{PORT}/'
fails, errors = [], []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)
INIT = """localStorage.getItem('studybuddy.v1.root') || localStorage.setItem('studybuddy.v1.root', JSON.stringify({profiles:[{id:'k1',name:'Joshua',color:'#e4572e'}],active:'k1',pin:null,pinOffered:true}));"""
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

async def st(pg): return await pg.evaluate("SBPad.debug()")
async def html(pg): return (await st(pg))['html']
async def select_text(pg, text):
    ok = await pg.evaluate("""(t) => { const ed = document.querySelector('.sbp-ed'), wk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
      while ((n = wk.nextNode())) { const i = n.nodeValue.indexOf(t); if (i >= 0) { ed.focus(); const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } } return false; }""", text)
    await pg.wait_for_timeout(60); return ok
async def caret_end(pg):
    await pg.evaluate("(() => { const ed = document.querySelector('.sbp-ed'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()"); await pg.wait_for_timeout(40)
async def drag(pg, x0, y0, x1, y1, steps=6):
    await pg.mouse.move(x0, y0); await pg.mouse.down(); await pg.mouse.move(x1, y1, steps=steps); await pg.mouse.up(); await pg.wait_for_timeout(60)
async def content_origin(pg):      # where content coordinate (0, 0) is on screen
    return await pg.evaluate("(() => { const e = document.querySelector('.sbp-ed'), r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { x: r.left + parseFloat(cs.paddingLeft), y: r.top + parseFloat(cs.paddingTop) }; })()")
async def download(pg, kind, uncheck_q=False):
    await pg.click('.sbp [data-a="download"]'); await pg.wait_for_selector(f'.sb-ov [data-k="{kind}"]')
    if uncheck_q and await pg.locator('#sbpDQ').count(): await pg.uncheck('#sbpDQ')
    async with pg.expect_download() as dl: await pg.click(f'.sb-ov [data-k="{kind}"]')
    d = await dl.value; data = open(await d.path(), 'rb').read(); await pg.wait_for_selector('.sb-ov', state='detached'); return d.suggested_filename, data
async def overflow(pg):
    await pg.evaluate("document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")
    return await pg.evaluate("({v: document.documentElement.scrollHeight - innerHeight, h: document.documentElement.scrollWidth - innerWidth})")

async def main():
    threading.Thread(target=lambda: http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=SITE)).serve_forever(), daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block', accept_downloads=True); await ctx.add_init_script(INIT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))

        # ---- New note from the Notes page ----
        await pg.goto(BASE + 'index.html#/notes'); await pg.wait_for_selector('#notesNew')
        check('notepad' in (await pg.inner_text('#notesBox, .setpanel')).lower(), 'the Notes page talks about the notepad')
        await pg.click('#notesNew'); await pg.wait_for_selector('.sbp .sbp-ed'); await pg.wait_for_timeout(300)
        s = await st(pg)
        check(s['full'] and s['mode'] == 'type' and s['font'] == 'hand', f'New note opens full screen, ready to type, in Handwriting ({s["full"]}, {s["mode"]}, {s["font"]})')
        check(await pg.evaluate("document.activeElement.classList.contains('sbp-ed')"), 'the cursor is already in the page')
        ff = await pg.evaluate("getComputedStyle(document.querySelector('.sbp-ed')).fontFamily")
        check('SB Hand' in ff and await pg.evaluate("document.fonts.check('21px \"SB Hand\"')"), f'the handwriting font is used and loaded ({ff[:40]})')
        check(await pg.locator('.sbp.full.page').count() == 1, 'Full screen starts on Page view')
        sheet = await pg.locator('.sbp-sheet').bounding_box(); stage = await pg.locator('.sbp-stage').bounding_box()
        check(abs(sheet['width'] - 816) < 2 and abs((sheet['x'] - stage['x']) - (stage['x'] + stage['width'] - sheet['x'] - sheet['width'])) < 24, f'Page view is a centered letter page ({sheet["width"]:.0f}px)')

        # ---- formatted typing ----
        await pg.keyboard.type('Science notes')
        await select_text(pg, 'Science notes'); await pg.select_option('.sbp [data-s="block"]', 'h2')
        check('<h2' in await html(pg) and 'Science notes</h2>' in await html(pg), 'Paragraph style makes a heading')
        await caret_end(pg); await pg.keyboard.press('Enter'); await pg.select_option('.sbp [data-s="block"]', 'p')
        await pg.keyboard.type('Plants need ')
        await pg.keyboard.press('Control+b'); await pg.keyboard.type('sunlight'); await pg.keyboard.press('Control+b')
        await pg.keyboard.type(', ')
        await pg.keyboard.press('Control+i'); await pg.keyboard.type('water'); await pg.keyboard.press('Control+i')
        await pg.keyboard.type(' and ')
        await pg.keyboard.press('Control+u'); await pg.keyboard.type('air'); await pg.keyboard.press('Control+u')
        await pg.keyboard.type('. Read more at the library.')
        h = await html(pg)
        check('<b>sunlight</b>' in h and '<i>water</i>' in h and '<u>air</u>' in h, f'Ctrl+B, Ctrl+I and Ctrl+U format while typing {h[-200:]!r}')
        await select_text(pg, 'library'); await pg.click('.sbp [data-f="strike"]')
        check(re.search(r'<(s|strike)>library</(s|strike)>', await html(pg)), 'Strikethrough')
        await select_text(pg, 'Plants'); await pg.click('.sbp [data-pop="fc"]'); await pg.click('.sbp-pop [aria-label="Red"]')
        check('color: rgb(210, 59, 42)' in await html(pg) or '#d23b2a' in await html(pg), 'text color')
        await select_text(pg, 'need'); await pg.click('.sbp [data-pop="hl"]'); await pg.click('.sbp-pop [aria-label="Yellow"]')
        check('background-color' in await html(pg), 'highlight')
        await select_text(pg, 'Read more'); await pg.keyboard.press('Control+k'); await pg.wait_for_selector('#sbpUrl')
        await pg.fill('#sbpUrl', 'javascript:alert(1)'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(80)
        check(await pg.locator('.sb-ov .sbp-err').is_visible(), 'a javascript: link is refused')
        await pg.fill('#sbpUrl', 'example.com/plants'); await pg.keyboard.press('Enter'); await pg.wait_for_selector('.sb-ov', state='detached')
        check('<a href="https://example.com/plants">Read more</a>' in await html(pg), 'Ctrl+K adds a link (https added)')
        await pg.click('.sbp-ed a'); await pg.wait_for_selector('.sbp-lb')
        check(await pg.get_attribute('.sbp-lb a', 'target') == '_blank' and 'noopener' in await pg.get_attribute('.sbp-lb a', 'rel'), 'clicking a link offers to open it in a new tab')
        await pg.keyboard.press('Escape'); check(await pg.locator('.sbp-lb').count() == 0 and await pg.locator('.sbp').count() == 1, 'Escape closes the link box, not the notepad')
        await caret_end(pg); await pg.keyboard.press('Enter')
        await pg.click('.sbp [data-f="ul"]'); await pg.keyboard.type('roots'); await pg.keyboard.press('Enter'); await pg.keyboard.type('stem'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Enter')
        await pg.click('.sbp [data-f="ol"]'); await pg.keyboard.type('plant the seed'); await pg.keyboard.press('Enter'); await pg.keyboard.type('water it'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Enter')
        await pg.click('.sbp [data-f="check"]'); await pg.keyboard.type('bring a pot'); await pg.keyboard.press('Enter'); await pg.keyboard.type('buy soil')
        h = await html(pg)
        check(re.search(r'<ul[^>]*><li[^>]*>roots</li><li[^>]*>stem</li></ul>', h) and re.search(r'<ol[^>]*><li[^>]*>plant the seed</li><li[^>]*>water it</li></ol>', h), f'bulleted and numbered lists {h[-400:]!r}')
        check(re.search(r'<ul[^>]*class="check"[^>]*><li[^>]*>bring a pot</li><li[^>]*>buy soil</li></ul>', h), 'a checklist')
        check(not re.search(r'<p[^>]*>\s*<(ul|ol)', h), 'lists are never inside a paragraph')
        li = await pg.locator('.sbp-ed ul.check li >> nth=0').bounding_box()
        await pg.mouse.click(li['x'] + 8, li['y'] + li['height'] / 2); await pg.wait_for_timeout(60)
        check(await pg.locator('.sbp-ed ul.check li.done').count() == 1, 'clicking a box ticks it')
        await pg.keyboard.press('Control+z'); check(await pg.locator('.sbp-ed ul.check li.done').count() == 0, 'ticking a box can be undone')
        await pg.keyboard.press('Control+y'); check(await pg.locator('.sbp-ed ul.check li.done').count() == 1, 'and redone')
        await select_text(pg, 'Science'); await pg.click('.sbp [data-f="center"]')
        check(re.search(r'<h2[^>]*text-align: center', await html(pg)), 'Center')
        await select_text(pg, 'sunlight'); check(await pg.get_attribute('.sbp [data-f="bold"]', 'aria-pressed') == 'true', 'Bold shows as pressed inside bold text')
        await select_text(pg, 'Plants need sunlight'); await pg.click('.sbp [data-f="clear"]')
        check('<b>sunlight</b>' not in await html(pg), 'Clear formatting')
        await pg.keyboard.press('Control+z'); check('<b>sunlight</b>' in await html(pg), 'undo brings the formatting back')

        # ---- fonts and sizes: nothing selected = the whole note, words selected = those words ----
        await caret_end(pg); await pg.select_option('.sbp [data-s="font"]', 'print')
        check((await st(pg))['font'] == 'print' and 'SB Print' in await pg.evaluate("getComputedStyle(document.querySelector('.sbp-ed')).fontFamily"), 'with nothing selected, the font changes the whole note')
        await select_text(pg, 'roots'); await pg.select_option('.sbp [data-s="font"]', 'mono')
        check('class="ff-mono">roots' in await html(pg), 'with words selected, only they change font')
        await select_text(pg, 'stem'); await pg.select_option('.sbp [data-s="size"]', 'xl')
        check('class="sz-xl">stem' in await html(pg), 'size for selected words')
        await caret_end(pg); await pg.select_option('.sbp [data-s="font"]', 'hand')
        check(await pg.evaluate("SB.getSetting('notepad').font") == 'hand', 'the chosen font is remembered for the next note')

        # ---- full width, and letters sitting on the lines ----
        ew = await pg.evaluate("(() => { const e = document.querySelector('.sbp-ed'), cs = getComputedStyle(e), p = [...e.querySelectorAll('p')].find(x => x.textContent.length > 20); return [p.getBoundingClientRect().width, e.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)]; })()")
        check(abs(ew[0] - ew[1]) < 2, f'typing spans the full width of the page {ew}')
        await pg.click('.sbp [data-paper="lines"]'); await pg.wait_for_timeout(150)
        BASES = """(() => { const sh = document.querySelector('.sbp-sheet'), y0 = parseFloat(getComputedStyle(sh).backgroundPositionY), top = sh.getBoundingClientRect().top, out = [];
          document.querySelectorAll('.sbp-ed p, .sbp-ed h2, .sbp-ed li').forEach(b => { if (!b.textContent.trim()) return; const i = document.createElement('i'); i.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
            const t = [...b.childNodes].find(n => n.nodeType === 3 || n.nodeType === 1 && n.tagName !== 'UL' && n.tagName !== 'OL'); b.insertBefore(i, t ? t.nextSibling : null); const y = i.getBoundingClientRect().top - top; i.remove();
            let g = ((y0 + 31 - y) % 32 + 32) % 32; if (g > 16) g -= 32; out.push(+g.toFixed(1)); });
          return out; })()"""
        for font in ('hand', 'print', 'cursive', 'serif'):
            await caret_end(pg); await pg.select_option('.sbp [data-s="font"]', font); await pg.wait_for_timeout(250)
            gaps = await pg.evaluate(BASES)
            check(len(gaps) >= 8 and all(-2 <= g <= 6 for g in gaps), f'with Lines on, every line of {font} text sits on a line (line minus baseline {gaps})')
        await caret_end(pg); await pg.select_option('.sbp [data-s="font"]', 'hand')
        await pg.screenshot(path='/tmp/np_lines.png')

        # ---- drawings stay with their words ----
        await pg.click('.sbp [data-mode="draw"]'); await pg.click('.sbp [data-tool="pen"]')
        o = await content_origin(pg); w = await pg.locator('.sbp-ed li >> nth=0').bounding_box()
        await drag(pg, o['x'] + 420, w['y'] + 10, o['x'] + 540, w['y'] + 20)
        it = (await st(pg))['items'][-1]
        check(it['k'] == 's' and it.get('a'), f'a stroke remembers the text block it was drawn beside ({it.get("a")})')
        await pg.click('.sbp [data-mode="type"]')
        await pg.evaluate("(() => { const ed = document.querySelector('.sbp-ed'), h = ed.querySelector('h2'), r = document.createRange(); r.setStart(h.firstChild, h.firstChild.length); r.collapse(true); ed.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()")
        await pg.keyboard.press('Enter'); await pg.keyboard.type('A new line above'); await pg.keyboard.press('Enter'); await pg.keyboard.type('and another')
        off = await pg.evaluate("(() => { const it = SBPad.debug().items.slice(-1)[0], tops = SBPad.internals.blockTops(document.querySelector('.sbp-ed')); return tops[it.a.b] - it.a.t; })()")
        check(abs(off - 64) < 1, f'typing two lines above moves the drawing down two lines ({off}px)')
        await pg.screenshot(path='/tmp/np_anchor.png')

        # ---- shapes ----
        await pg.click('.sbp [data-mode="shapes"]'); o = await content_origin(pg)
        sb = await pg.locator('.sbp-stage').bounding_box(); y = sb['y'] + sb['height'] - 230
        n0 = len((await st(pg))['items'])
        kinds = ['rect', 'round', 'ellipse', 'tri', 'star', 'line', 'arrow']
        for i, k in enumerate(kinds):
            await pg.click(f'.sbp [data-sh="{k}"]'); x = o['x'] + 10 + i * 88
            await drag(pg, x, y, x + 70, y + 60)
            s = await st(pg)
            check(len(s['items']) == n0 + i + 1 and s['items'][-1]['sh'] == k and s['sel'] == len(s['items']) - 1, f'drawing a {k} adds it and selects it')
        check(await pg.get_attribute('.sbp [data-sh="select"]', 'aria-pressed') == 'true', 'after drawing a shape, Select is picked again')
        rect_i = n0; await pg.click(f'.sbp-shapes [data-i="{rect_i}"]', force=True)
        r0 = (await st(pg))['items'][rect_i]; c = await pg.locator(f'.sbp-shapes [data-i="{rect_i}"]').bounding_box()
        await drag(pg, c['x'] + c['width'] / 2, c['y'] + c['height'] / 2, c['x'] + c['width'] / 2 + 30, c['y'] + c['height'] / 2 - 120)
        r1 = (await st(pg))['items'][rect_i]
        check(abs((r1['x'] - r0['x']) - 30) < 2 and r1['y'] < r0['y'] - 60, f'dragging a shape moves it ({r0["x"]},{r0["y"]} -> {r1["x"]},{r1["y"]})')
        hd = await pg.locator('.sbp-shapes [data-hd="se"]').bounding_box()
        await drag(pg, hd['x'] + 6, hd['y'] + 6, hd['x'] + 66, hd['y'] + 46)
        r2 = (await st(pg))['items'][rect_i]
        check(abs(r2['w'] - r1['w'] - 60) < 2 and abs(r2['h'] - r1['h'] - 40) < 2, f'dragging a corner resizes it ({r1["w"]}x{r1["h"]} -> {r2["w"]}x{r2["h"]})')
        await pg.click('.sbp [data-pop="sf"]'); await pg.click('.sbp-pop [aria-label="Light blue"]')
        await pg.click('.sbp [data-pop="so"]'); await pg.click('.sbp-pop [aria-label="Purple"]')
        await pg.fill('.sbp [data-r="lw"]', '9'); await pg.dispatch_event('.sbp [data-r="lw"]', 'change')
        await pg.click('.sbp [data-shp="shadow"]')
        r3 = (await st(pg))['items'][rect_i]
        check(r3['f'] == '#cfe3ff' and r3['c'] == '#7a4cc2' and r3['lw'] == 9 and r3['sd'], f'fill, outline color, outline width and shadow {r3}')
        check(await pg.locator(f'.sbp-shapes [data-i="{rect_i}"] [filter]').count() == 1, 'the shadow is drawn')
        await pg.click('.sbp [data-shp="front"]'); s = await st(pg)
        check(s['items'][-1]['sh'] == 'rect' and s['sel'] == len(s['items']) - 1, 'Bring to front moves it to the top')
        await pg.click('.sbp [data-shp="back"]'); s = await st(pg)
        check(s['items'][0]['sh'] == 'rect' and s['sel'] == 0, 'Send to back moves it under everything')
        x0 = s['items'][0]['x']; await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Shift+ArrowRight')
        check(abs((await st(pg))['items'][0]['x'] - x0 - 11) < .01, 'arrow keys nudge the chosen shape')
        n = len((await st(pg))['items']); await pg.keyboard.press('Delete')
        check(len((await st(pg))['items']) == n - 1 and (await st(pg))['sel'] == -1, 'Delete removes the chosen shape')
        await pg.keyboard.press('Control+z'); check(len((await st(pg))['items']) == n, 'undo brings it back')
        li = [i for i, t in enumerate((await st(pg))['items']) if t.get('sh') == 'line'][0]
        await pg.click(f'.sbp-shapes [data-i="{li}"] line.hit', force=True); l0 = (await st(pg))['items'][li]
        hb = await pg.locator('.sbp-shapes [data-hd="b"]').bounding_box(); await drag(pg, hb['x'] + 6, hb['y'] + 6, hb['x'] + 46, hb['y'] - 34)
        l1 = (await st(pg))['items'][li]; check(abs(l1['w'] - l0['w'] - 40) < 2 and abs(l1['h'] - l0['h'] + 40) < 2, 'a line end can be dragged')
        await pg.click('.sbp [data-sh="ellipse"]'); await pg.mouse.click(o['x'] + 300, sb['y'] + 120); await pg.wait_for_timeout(60)
        e = (await st(pg))['items'][-1]; check(e['sh'] == 'ellipse' and e['w'] == 140 and e['h'] == 140, 'a click (no drag) makes a shape of a standard size')
        await pg.screenshot(path='/tmp/np_shapes.png')

        # ---- Page, Pageless, side panel ----
        await pg.click('.sbp [data-mode="type"]'); await caret_end(pg)
        for _ in range(34): await pg.keyboard.press('Enter')
        await pg.keyboard.type('the end'); await pg.wait_for_timeout(150)
        check(await pg.locator('.sbp-brk').count() >= 1 and 'Page 2' in await pg.inner_text('.sbp-brk >> nth=0'), 'Page view marks where a page ends')
        await pg.click('.sbp [data-view="pageless"]'); await pg.wait_for_timeout(200)
        sheet = await pg.locator('.sbp-sheet').bounding_box(); stage = await pg.locator('.sbp-stage').bounding_box()
        check(sheet['width'] > stage['width'] - 20 and await pg.locator('.sbp-brk').count() == 0, f'Pageless uses the full width ({sheet["width"]:.0f} of {stage["width"]:.0f})')
        check(await pg.evaluate("SB.getSetting('notepad').view") == 'pageless', 'Page or Pageless is remembered')
        await pg.screenshot(path='/tmp/np_pageless.png')
        await pg.click('.sbp [data-view="page"]'); await pg.click('.sbp [data-a="full"]'); await pg.wait_for_timeout(200)
        pb = await pg.locator('.sbp').bounding_box()
        check(not (await st(pg))['full'] and pb['x'] > 700 and pb['x'] + pb['width'] >= 1438, f'Side panel docks it at the right ({pb["x"]:.0f})')
        await pg.click('.sbp [data-a="full"]'); await pg.wait_for_timeout(200); check((await st(pg))['full'], 'and Full screen brings it back')
        ov = await overflow(pg); check(ov['h'] <= 0 and ov['v'] <= 0, f'no page scroll bars with the notepad full screen {ov}')

        # ---- downloads ----
        name, data = await download(pg, 'txt')
        t = data.decode('utf-8')
        check(name.startswith('note-') and name.endswith('.txt'), f'text file name {name}')
        for want in ('Science notes', 'Plants need sunlight, water and air.', 'Read more (https://example.com/plants)', '- roots', '1. plant the seed', '2. water it', '[x] bring a pot', '[ ] buy soil', 'the end'):
            check(want in t, f'the text file has {want!r}')
        name, data = await download(pg, 'pdf')
        check(data[:8] == b'%PDF-1.4' and data.rstrip().endswith(b'%%EOF'), f'a real PDF ({name}, {len(data)} bytes)')
        pages = data.count(b'/Type /Page ')
        check(pages >= 2, f'a long note makes more than one PDF page ({pages})')
        xref = int(re.search(rb'startxref\n(\d+)', data).group(1)); tbl = data[xref:].split(b'\n')
        offs = [int(l[:10]) for l in tbl[3:] if re.match(rb'^\d{10} 00000 n ', l)]
        check(all(data[o:].startswith(b'%d 0 obj' % (i + 1)) for i, o in enumerate(offs)), f'every PDF object is where the index says ({len(offs)} objects)')
        name, data = await download(pg, 'docx')
        z = zipfile.ZipFile(io.BytesIO(data))
        check(z.testzip() is None and {'[Content_Types].xml', 'word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/_rels/document.xml.rels'} <= set(z.namelist()), f'a real Word file ({name}: {z.namelist()})')
        doc = ET.fromstring(z.read('word/document.xml')); text = ''.join(x.text or '' for x in doc.iter(W + 't'))
        check('Science notes' in text and 'sunlight' in text and 'buy soil' in text and '☑' in text and '☐' in text, 'the Word file has the words and the check boxes')
        bold = [r for r in doc.iter(W + 'r') if r.find(W + 'rPr/' + W + 'b') is not None and 'sunlight' in ''.join(x.text or '' for x in r.iter(W + 't'))]
        check(bool(bold), 'bold text stays bold in Word')
        check(len(list(doc.iter(W + 'hyperlink'))) == 1 and 'https://example.com/plants' in z.read('word/_rels/document.xml.rels').decode(), 'the link is a real Word link')
        check(len(list(doc.iter(W + 'numPr'))) >= 4, 'lists are Word lists')
        check('word/media/drawings.png' in z.namelist() and z.read('word/media/drawings.png')[:4] == b'\x89PNG', 'drawings and shapes come along as a picture')
        name, data = await download(pg, 'png'); check(data[:8] == b'\x89PNG\r\n\x1a\n' and name.endswith('.png'), 'a picture of the note')
        open('/tmp/np_note.png', 'wb').write(data)

        # ---- save, list, reopen ----
        h0, items0 = await html(pg), len((await st(pg))['items'])
        await pg.click('.sbp [data-a="save"]'); await pg.click('.sb-ov [data-k="profile"]'); await pg.wait_for_timeout(100)
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')
        await pg.wait_for_selector('#notesBox .sbn')
        check('Science notes' in await pg.inner_text('#notesBox .sbn'), 'the saved note is listed by its first line')
        blank = await pg.evaluate("(() => { const c = document.querySelector('#notesBox .sbn canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 120) n++; return n; })()")
        check(blank > 30, f'the list shows a small picture with the writing ({blank} dark pixels)')
        await pg.click('#notesBox [data-a="open"]'); await pg.wait_for_selector('.sbp .sbp-ed'); await pg.wait_for_timeout(200)
        s = await st(pg)
        check(s['html'] == await pg.evaluate("h => SBPad.sanitize(h)", h0) and len(s['items']) == items0 and s['paper'] == 'lines' and not s['dirty'], 'reopening brings back the text, drawings, shapes and paper, unchanged')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')

        # ---- unsafe text is cleaned, never run ----
        clean = await pg.evaluate("""SBPad.sanitize('<p onclick="window.__x=1">hi<script>window.__x=2<\\/script><img src=x onerror="window.__x=3"><a href="javascript:window.__x=4">j</a><a href="https://ok.example/">ok</a><span style="color:#ff0000;position:fixed">c</span><iframe src="https://x"></iframe><font color="#00ff00">g</font></p>')""")
        check('script' not in clean and 'onerror' not in clean and 'onclick' not in clean and 'javascript' not in clean and '<img' not in clean and 'iframe' not in clean and 'position' not in clean, f'scripts, pictures, handlers, frames and odd styles are removed {clean}')
        check('<a href="https://ok.example/">ok</a>' in clean and 'color: rgb(255, 0, 0)' in clean and 'rgb(0, 255, 0)' in clean, 'safe links and colors stay')
        await pg.evaluate("""localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([{ id: 'evil', at: 1, html: '<p>hi<img src=x onerror="window.__x=5"></p><script>window.__x=6</script>', items: [] }]))""")
        await pg.goto(BASE + 'index.html#/home'); await pg.goto(BASE + 'index.html#/notes'); await pg.wait_for_selector('#notesBox .sbn'); await pg.click('#notesBox [data-a="open"]'); await pg.wait_for_selector('.sbp'); await pg.wait_for_timeout(300)
        check(await pg.evaluate("window.__x === undefined") and await pg.locator('.sbp-ed img').count() == 0, 'a note with a hidden script opens safely')
        await pg.evaluate("""(() => { const ed = document.querySelector('.sbp-ed'); ed.focus(); const dt = new DataTransfer(); dt.setData('text/html', '<b>pasted</b><img src=x onerror="window.__x=7"><script>window.__x=8</script>'); dt.setData('text/plain', 'pasted'); ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); })()""")
        await pg.wait_for_timeout(100)
        check('<b>pasted</b>' in await html(pg) and await pg.evaluate("window.__x === undefined") and '<img' not in await html(pg), 'pasting keeps bold but drops anything unsafe')
        await pg.click('.sbp [data-a="close"]'); await pg.click('.sb-ov [data-k="discard"]'); await pg.wait_for_selector('.sbp', state='detached')

        # ---- a note from before November 2026 (typed boxes on the drawing) still opens ----
        await pg.evaluate("""localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([{ id: 'old', at: 1, question: '2 x 3', mod: 'Volume', paper: 'graph', w: 500, h: 400,
          items: [{ k: 't', c: '#1d2733', s: 20, x: 18, y: 18, t: '2 x 3 = 6' }, { k: 's', t: 'pen', c: '#1f5fbf', w: 3, p: [20, 80, .5, 120, 90, .5, 200, 60, .5] }] }]))""")
        await pg.goto(BASE + 'index.html#/home'); await pg.goto(BASE + 'index.html#/notes'); await pg.wait_for_selector('#notesBox .sbn'); await pg.click('#notesBox [data-a="open"]'); await pg.wait_for_selector('.sbp'); await pg.wait_for_timeout(500)
        s = await st(pg); inkpx = await pg.evaluate("(() => { const c = document.querySelector('.sbp-ink'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()")
        check(len(s['items']) == 2 and s['paper'] == 'graph' and inkpx > 200, f'an old note opens with its typing and drawing ({inkpx} px)')
        name, data = await download(pg, 'txt'); check('Question: 2 x 3' in data.decode() and '2 x 3 = 6' in data.decode(), f'its text download has the question and the old typing {data.decode()!r}')
        await pg.click('.sbp [data-a="close"]'); await pg.wait_for_selector('.sbp', state='detached')

        # ---- backups carry the new notes ----
        await pg.evaluate("""localStorage.setItem('studybuddy.v1.notes.k1', JSON.stringify([{ id: 'n2', at: 1, v: 2, html: '<p>hello</p>', font: 'print', items: [{ k: 'h', sh: 'rect', x: 1, y: 2, w: 30, h: 20, f: '', c: '#1d2733', lw: 2, sd: true }] }]))""")
        ok = await pg.evaluate("(() => { try { return SB.checkBackup(SB.exportAll()).names.join(); } catch (e) { return 'ERR ' + e.message; } })()")
        check(ok == 'Joshua', f'a backup with typed text and shapes is accepted ({ok})')
        bad = await pg.evaluate("(() => { try { const o = JSON.parse(SB.exportAll()); o.data['studybuddy.v1.notes.k1'] = JSON.stringify([{ id: 'x', html: 5, items: [] }]); SB.checkBackup(JSON.stringify(o)); return 'accepted'; } catch (e) { return 'refused'; } })()")
        check(bad == 'refused', 'a damaged typed-text entry is refused')

        # ---- dark mode: the paper stays light ----
        await pg.evaluate("SB.setSetting('theme','dark'); SB.applyDisplay()")
        await pg.click('#notesNew'); await pg.wait_for_selector('.sbp'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("getComputedStyle(document.querySelector('.sbp-sheet')).backgroundColor") == 'rgb(255, 253, 245)', 'the page stays light in dark mode')
        check(await pg.evaluate("getComputedStyle(document.querySelector('.sbp')).backgroundColor") != 'rgb(255, 253, 247)', 'the toolbar follows dark mode')
        await pg.screenshot(path='/tmp/np_dark.png')
        await pg.click('.sbp [data-a="close"]'); await pg.evaluate("SB.setSetting('theme','light'); SB.applyDisplay()")
        await ctx.close()

        # ---- phone and phone turned sideways ----
        for (vw, vh) in ((360, 740), (915, 412)):
            for label, extra in (('plain', ''), ('dyslexic + larger', "SB.setSetting('font','dyslexic'); SB.setSetting('size','large'); SB.applyDisplay()")):
                m = await b.new_context(viewport={'width': vw, 'height': vh}, service_workers='block', has_touch=True); await m.add_init_script(INIT)
                q = await m.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
                await q.goto(BASE + 'index.html#/notes'); await q.wait_for_selector('#notesNew')
                if extra: await q.evaluate(extra); await q.wait_for_timeout(150)
                await q.click('#notesNew'); await q.wait_for_selector('.sbp .sbp-ed'); await q.wait_for_timeout(250)
                for mode in ('type', 'draw', 'shapes'):
                    await q.click(f'.sbp [data-mode="{mode}"]'); await q.wait_for_timeout(120)
                    ov = await overflow(q)
                    inside = await q.evaluate("(() => { const s = document.querySelector('.sbp').getBoundingClientRect(); return [...document.querySelectorAll('.sbp button, .sbp input, .sbp select')].filter(e => e.offsetParent).every(e => { const r = e.getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1; }); })()")
                    sh = (await q.locator('.sbp-stage').bounding_box())['height']
                    check(ov['h'] <= 0 and inside and sh >= (110 if vh < 500 else 150), f'{vw}x{vh} {label} {mode}: no sideways scroll, every control fits, room to write ({sh:.0f}px)')
                if label == 'plain':
                    await q.click('.sbp [data-mode="type"]'); await q.tap('.sbp-ed'); await q.keyboard.type('On a phone the page is full width')
                    pw = await q.evaluate("(() => { const e = document.querySelector('.sbp-ed'), cs = getComputedStyle(e); return [e.querySelector('p').getBoundingClientRect().width, e.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)]; })()")
                    check(abs(pw[0] - pw[1]) < 2, f'{vw}x{vh}: typing spans the page {pw}')
                    check(await q.locator('.sbp [data-a="full"]').is_hidden(), f'{vw}x{vh}: no Full screen button (phones are already full screen)')
                    await q.screenshot(path=f'/tmp/np_{vw}.png')
                await m.close()
        await b.close()
    check(not errors, f'no page errors {errors}')
    print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
asyncio.run(main())
