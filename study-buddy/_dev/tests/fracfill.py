"""Helpers for the stacked fraction boxes (whole number, top, bottom).
Tests still think in text ("1 3/4", "3/4", "2"); these turn that text into box entries."""
import re

def parts(text):
    t = re.sub(r'\s+', ' ', str(text).strip().replace(',', ''))
    m = re.match(r'^(\d+) (\d+) ?/ ?(\d+)$', t)
    if m: return m.group(1), m.group(2), m.group(3)
    m = re.match(r'^(\d+) ?/ ?(\d+)$', t)
    if m: return '', m.group(1), m.group(2)
    m = re.match(r'^(\d+)$', t)
    if m: return m.group(1), '', ''
    return '', '', ''          # not an answer the boxes can hold: leave them empty

async def fill_box(box, text):
    """box: a locator for one .fbox"""
    w, n, d = parts(text)
    await box.locator('.fx-w').fill(w); await box.locator('.fx-n').fill(n); await box.locator('.fx-d').fill(d)

async def fill_answer(pg, tab, text):
    """The practice answer boxes on a tool tab (tab is the id without #tab-)."""
    await fill_box(pg.locator(f'#tab-{tab} form .fbox'), text)

async def fill_any(pg, tab, text):
    """Fraction tabs have the boxes, other typed tabs a single input."""
    if await pg.locator(f'#tab-{tab} form .fbox').count(): await fill_answer(pg, tab, text)
    else: await pg.fill(f'#tab-{tab} input[aria-label="Your answer"]', text)

PLAIN_JS = """(sel) => { const el = document.querySelector(sel).cloneNode(true);
  el.querySelectorAll('[data-s]').forEach(n => n.replaceWith(' ' + n.dataset.s + ' ')); return el.innerText || el.textContent; }"""

async def plain(pg, sel):
    """Text of an element with fractions written in text drawn by stackText put back as 3/4 or 1 3/4."""
    return (await pg.evaluate(PLAIN_JS, sel)).replace('\n', ' ')
