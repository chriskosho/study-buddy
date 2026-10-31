/* Study Buddy notepad downloads: PDF, Word (.docx) and plain text. Loaded by sb-scratchpad.js only when a student downloads a note.
     SBPadExport.run(kind, note, { question })   kind: 'pdf' | 'docx' | 'txt'
   Everything is made here in the browser; nothing is uploaded and no outside library is used.
     PDF   pictures of letter-size pages (the page breaks fall between lines), so it looks exactly like the notepad
     Word  the typed text as real, editable Word text (bold, colors, sizes, fonts, lists, links); drawings and shapes come as one picture at the end
     text  just the words, with "-" bullets, numbers and [ ] boxes */
(function () {
  'use strict';
  if (window.SBPadExport) return;
  const I = window.SBPad.internals, enc = new TextEncoder();

  /* ---------- the text, block by block (for Word and plain text) ---------- */
  const tmpl = html => { const t = document.createElement('template'); t.innerHTML = html || ''; return t.content; };
  const blockKids = el => [...el.childNodes].filter(n => n.nodeType === 1 || (n.nodeType === 3 && n.nodeValue.trim()));

  /* typed boxes from notes made before November 2026 (they sit on the drawing, top to bottom) */
  const oldTyped = note => (note.items || []).filter(it => it.k === 't').sort((a, b) => a.y - b.y || a.x - b.x).map(it => it.t);
  /* ---------- plain text ---------- */
  function inlineText(node) {
    let s = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) s += n.nodeValue.replace(/ /g, ' ');
      else if (n.nodeType === 1) {
        const t = n.tagName;
        if (t === 'BR') s += '\n';
        else if (t === 'UL' || t === 'OL') return;
        else if (t === 'A') { const inner = inlineText(n), h = n.getAttribute('href') || ''; s += inner + (h && inner.trim() !== h.replace(/^mailto:/, '') ? ' (' + h.replace(/^mailto:/, '') + ')' : ''); }
        else s += inlineText(n);
      }
    });
    return s;
  }
  function txtLines(root, depth, out) {
    blockKids(root).forEach(el => {
      if (el.nodeType === 3) { out.push(el.nodeValue.trim()); return; }
      const t = el.tagName;
      if (t === 'UL' || t === 'OL') {
        [...el.children].forEach((li, i) => {
          const mark = el.classList.contains('check') ? (li.classList.contains('done') ? '[x] ' : '[ ] ') : t === 'OL' ? (i + 1) + '. ' : '- ';
          out.push('    '.repeat(depth) + mark + inlineText(li).trim().replace(/\n/g, '\n' + '    '.repeat(depth + 1)));
          li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => txtLines({ childNodes: [sub] }, depth + 1, out));
        });
      } else out.push(inlineText(el).replace(/\s+$/, ''));
    });
    return out;
  }
  function txt(note, o) {
    const lines = txtLines(tmpl(note.html), 0, []).concat(oldTyped(note));
    const head = o.question ? ['Question: ' + o.question, ''] : [];
    const text = head.concat(lines).join('\r\n').replace(/(\r\n){3,}/g, '\r\n\r\n').trim() + '\r\n';
    I.download(new Blob([text], { type: 'text/plain;charset=utf-8' }), I.fileBase(note.at) + '.txt');
  }

  /* ---------- PDF ---------- */
  function pdfBlob(pages) {
    const parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (id, body) => { offs[id] = len; push(id + ' 0 obj\n' + body + '\nendobj\n'); };
    push('%PDF-1.4\n'); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
    const n = pages.length;
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ')}] /Count ${n} >>`);
    pages.forEach((p, i) => {
      const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2, cs = `q 612 0 0 792 0 0 cm /Im${i} Do Q`;
      obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im${i} ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
      obj(cid, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
      offs[iid] = len;
      push(`${iid} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
      push(p.jpeg); push('\nendstream\nendobj\n');
    });
    const total = 3 + n * 3, xref = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  const dataBytes = url => { const b = atob(url.slice(url.indexOf(',') + 1)), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  async function pdf(note, o) {
    const P = I.PAGE, sc = 2, base = Object.assign({}, note, { layout: 'print', question: o.question });
    const m = I.compose(Object.assign({}, base, { measure: true }));      // where the lines of text are, without a picture
    const W = m.cssW, H = m.cssH, f = Math.min(1, P.W / W), body = P.BODY / f;      // a drawing wider than the page is shrunk to fit
    const lines = m.lines || [], pages = [];
    let y0 = 0;
    while (y0 < H - 1 && pages.length < 200) {
      let y1 = Math.min(H, y0 + body);
      if (y1 < H) { const cut = lines.filter(l => l.y < y1 && l.b > y1).reduce((mm, l) => Math.min(mm, l.y), y1); if (cut > y0 + body * .5) y1 = cut; }   // never cut through a line of text
      const band = I.compose(Object.assign({}, base, { scale: sc, clip: [y0, y1] }));   // one page at a time, so a long note never needs one giant canvas
      const pg = document.createElement('canvas'); pg.width = P.W * sc; pg.height = P.H * sc;
      const g = pg.getContext('2d'); g.fillStyle = I.PAPER.bg; g.fillRect(0, 0, pg.width, pg.height);
      const h = y1 - y0; g.drawImage(band, 0, 0, band.width, band.height, Math.round((P.W - W * f) / 2 * sc), P.PADY * sc, Math.round(W * f * sc), Math.round(h * f * sc));
      pages.push({ jpeg: dataBytes(pg.toDataURL('image/jpeg', .9)), w: pg.width, h: pg.height });
      y0 = y1;
    }
    if (!pages.length) { const pg = document.createElement('canvas'); pg.width = P.W; pg.height = P.H; const g = pg.getContext('2d'); g.fillStyle = I.PAPER.bg; g.fillRect(0, 0, pg.width, pg.height); pages.push({ jpeg: dataBytes(pg.toDataURL('image/jpeg', .9)), w: pg.width, h: pg.height }); }
    I.download(pdfBlob(pages), I.fileBase(note.at) + '.pdf');
  }

  /* ---------- Word ---------- */
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files, type) {      // a zip with no compression ("stored"), which is all a .docx needs
    const parts = [], central = []; let off = 0;
    const d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(f => {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    const size = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type });
  }
  const X = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const sizeOf = id => (I.SIZES.find(s => s[0] === id) || I.SIZES[1])[2];
  function rPr(f) {
    const font = I.WORDFONT[f.font] || 'Arial';
    return '<w:rPr>' + `<w:rFonts w:ascii="${X(font)}" w:hAnsi="${X(font)}" w:cs="${X(font)}"/>` + (f.b ? '<w:b/>' : '') + (f.i ? '<w:i/>' : '') + (f.s ? '<w:strike/>' : '')
      + (f.color ? `<w:color w:val="${f.color.slice(1).toUpperCase()}"/>` : '') + `<w:sz w:val="${Math.round(f.px * 1.5)}"/><w:szCs w:val="${Math.round(f.px * 1.5)}"/>`
      + (f.u ? '<w:u w:val="single"/>' : '') + (f.bg ? `<w:shd w:val="clear" w:color="auto" w:fill="${f.bg.slice(1).toUpperCase()}"/>` : '') + '</w:rPr>';
  }
  function runs(node, f, ctx) {
    let s = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { const t = n.nodeValue.replace(/ /g, ' '); if (t) s += `<w:r>${rPr(f)}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`; return; }
      if (n.nodeType !== 1) return;
      const t = n.tagName, g = Object.assign({}, f);
      if (t === 'BR') { if (!n.nextSibling && /^(P|H2|H3|LI)$/.test(n.parentNode.tagName || '')) return; s += `<w:r>${rPr(f)}<w:br/></w:r>`; return; }   // the <br> that ends every blank line is not a second line
      if (t === 'UL' || t === 'OL') return;
      if (t === 'B') g.b = true; if (t === 'I') g.i = true; if (t === 'U') g.u = true; if (t === 'S') g.s = true;
      if (t === 'SPAN') {
        (n.className.match(/ff-(\w+)/) || [])[1] && (g.font = n.className.match(/ff-(\w+)/)[1]);
        const sz = (n.className.match(/sz-(\w+)/) || [])[1]; if (sz) g.px = sizeOf(sz) * (f.scale || 1);
        if (n.style.color) g.color = hex(n.style.color) || g.color; if (n.style.backgroundColor) g.bg = hex(n.style.backgroundColor) || g.bg;
      }
      if (t === 'A') { const id = ctx.link(n.getAttribute('href')); Object.assign(g, { color: '#1F5FBF', u: true }); s += `<w:hyperlink r:id="${id}">${runs(n, g, ctx)}</w:hyperlink>`; return; }
      s += runs(n, g, ctx);
    });
    return s;
  }
  function hex(v) { const m = String(v).match(/^rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/); if (m) return '#' + [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join(''); return /^#[0-9a-f]{6}$/i.test(v) ? v : ''; }
  function para(el, base, ctx, extra = {}) {
    const t = el.tagName, f = Object.assign({}, base);
    if (t === 'H2') { f.b = true; f.px = base.px * 1.5; f.scale = 1.5; } else if (t === 'H3') { f.b = true; f.px = base.px * 1.22; f.scale = 1.22; }
    if (extra.done) { f.s = true; f.color = '#6A7480'; }
    const al = (el.style && el.style.textAlign) || '', jc = al === 'center' ? '<w:jc w:val="center"/>' : al === 'right' ? '<w:jc w:val="right"/>' : '';
    const num = extra.numId ? `<w:numPr><w:ilvl w:val="${extra.lvl}"/><w:numId w:val="${extra.numId}"/></w:numPr>` : extra.indent ? `<w:ind w:left="${extra.indent}"/>` : '';
    const pre = extra.box ? `<w:r>${rPr(Object.assign({}, f, { s: false, font: 'sans' }))}<w:t xml:space="preserve">${extra.done ? '☑' : '☐'} </w:t></w:r>` : '';
    return `<w:p><w:pPr>${num}${jc}</w:pPr>${pre}${runs(el, f, ctx)}</w:p>`;
  }
  function blocks(root, base, ctx, lvl = 0) {
    let s = '';
    blockKids(root).forEach(el => {
      if (el.nodeType === 3) { const p = document.createElement('p'); p.textContent = el.nodeValue; s += para(p, base, ctx); return; }
      const t = el.tagName;
      if (t === 'UL' || t === 'OL') {
        const check = el.classList.contains('check'), numId = check ? 0 : t === 'UL' ? 1 : ctx.newList();
        [...el.children].forEach(li => {
          s += para(li, base, ctx, check ? { box: true, done: li.classList.contains('done'), indent: 360 * (lvl + 1) } : { numId, lvl: Math.min(lvl, 2) });
          li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => { s += blocks({ childNodes: [sub] }, base, ctx, lvl + 1); });
        });
      } else s += para(el, base, ctx);
    });
    return s;
  }
  function cropInk(cv) {      // only the part of the drawing layer that has something on it
    const g = cv.getContext('2d'), w = cv.width, h = cv.height; if (!w || !h) return null;
    const d = g.getImageData(0, 0, w, h).data; let top = h, bot = -1, left = w, right = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 8) { if (y < top) top = y; if (y > bot) bot = y; if (x < left) left = x; if (x > right) right = x; }
    if (bot < 0) return null;
    const pad = 16; top = Math.max(0, top - pad); left = Math.max(0, left - pad); bot = Math.min(h, bot + pad); right = Math.min(w, right + pad);
    const out = document.createElement('canvas'); out.width = right - left; out.height = bot - top;
    const og = out.getContext('2d'); og.fillStyle = I.PAPER.bg; og.fillRect(0, 0, out.width, out.height); og.drawImage(cv, left, top, out.width, out.height, 0, 0, out.width, out.height);
    out.su = cv.scaleUsed || 2; return out;
  }
  async function docx(note, o) {
    const base = { font: note.font || 'hand', px: sizeOf(note.size || 'm') }, rels = [], nums = [];
    const ctx = { link: href => { const id = 'rIdL' + (rels.length + 1); rels.push({ id, href }); return id; }, newList: () => { const id = 2 + nums.length; nums.push(id); return id; } };
    let body = '';
    if (o.question) body += `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr><w:r>${rPr(Object.assign({}, base, { font: 'sans', px: 15, b: true }))}<w:t xml:space="preserve">Question: ${X(o.question)}</w:t></w:r></w:p>`;
    body += blocks(tmpl(note.html), base, ctx);
    oldTyped(note).forEach(t => t.split('\n').forEach(line => { const p = document.createElement('p'); p.textContent = line; body += para(p, Object.assign({}, base, { font: 'sans' }), ctx); }));
    let img = null;
    if ((note.items || []).some(it => it.k === 'h' || (it.k === 's' && it.t !== 'erase') || it.k === 't')) {
      const ink = cropInk(I.compose(Object.assign({}, note, { layout: 'print', scale: 2, inkOnly: true })));
      if (ink) {
        img = await new Promise(res => ink.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), 'image/png'));
        let w = ink.width / ink.su, h = ink.height / ink.su; const k = Math.min(1, 624 / w, 860 / h); w *= k; h *= k;
        const cx = Math.round(w * 9525), cy = Math.round(h * 9525);
        body += `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Drawings"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="drawings.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
      }
    }
    if (!body) body = '<w:p/>';
    const NSX = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NSX}><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const font = I.WORDFONT[base.font] || 'Arial';
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${X(font)}" w:hAnsi="${X(font)}" w:cs="${X(font)}"/><w:sz w:val="${Math.round(base.px * 1.5)}"/><w:color w:val="1D2733"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
    const lvl = (i, fmt, txt) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (i + 1)}" w:hanging="360"/></w:pPr></w:lvl>`;
    const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">`
      + `<w:abstractNum w:abstractNumId="0">${lvl(0, 'bullet', '•')}${lvl(1, 'bullet', '◦')}${lvl(2, 'bullet', '▪')}</w:abstractNum>`
      + `<w:abstractNum w:abstractNumId="1">${lvl(0, 'decimal', '%1.')}${lvl(1, 'lowerLetter', '%2.')}${lvl(2, 'lowerRoman', '%3.')}</w:abstractNum>`
      + `<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>` + nums.map(id => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('') + `</w:numbering>`;
    const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>`
      + (img ? '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/drawings.png"/>' : '')
      + rels.map(r => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${X(r.href)}" TargetMode="External"/>`).join('') + '</Relationships>';
    const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`;
    const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const files = [{ name: '[Content_Types].xml', data: types }, { name: '_rels/.rels', data: root }, { name: 'word/document.xml', data: doc }, { name: 'word/styles.xml', data: styles }, { name: 'word/numbering.xml', data: numbering }, { name: 'word/_rels/document.xml.rels', data: docRels }];
    if (img) files.push({ name: 'word/media/drawings.png', data: img });
    I.download(zip(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), I.fileBase(note.at) + '.docx');
  }

  window.SBPadExport = { run: async (kind, note, o = {}) => { if (kind === 'txt') return txt(note, o); if (kind === 'pdf') return pdf(note, o); if (kind === 'docx') return docx(note, o); throw new Error('unknown kind'); }, _zip: zip, _crc32: crc32 };
})();
