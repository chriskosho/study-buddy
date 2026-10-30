/* Europe map data for the European Geography module. Run:  node _dev/eu-map/geo_eu.mjs  (from the study-buddy folder)
   Source: world-110m.json, Natural Earth 1:110,000,000 country outlines (public domain), as TopoJSON (via the vega-datasets collection).
   Output: modules/geography/europe/mapdata.js (defines const MAPDATA).
   Projection: Albers equal-area conic centered on Europe. Everything is clipped to a generous longitude/latitude window first, then to
   the picture's rectangle, so Russia and the countries around Europe are cut off cleanly at the edge. The 110m file has no tiny countries,
   so Vatican City, San Marino, Monaco, Liechtenstein, Andorra, and Malta are drawn as dots at their real positions. Kosovo is the
   unnamed (-99) shape at 20 to 22 east. The Turkish-occupied north of Cyprus (the other -99 shape) is added to Cyprus. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const topo = JSON.parse(readFileSync(join(HERE, 'world-110m.json'), 'utf8'));
/* ISO numeric id -> our id (ISO 3166 alpha-2, lower case) */
const ISO = { 8:'al',40:'at',112:'by',56:'be',70:'ba',100:'bg',191:'hr',196:'cy',203:'cz',208:'dk',233:'ee',246:'fi',250:'fr',276:'de',300:'gr',348:'hu',352:'is',372:'ie',380:'it',428:'lv',440:'lt',442:'lu',498:'md',499:'me',807:'mk',528:'nl',578:'no',616:'pl',620:'pt',642:'ro',643:'ru',688:'rs',703:'sk',705:'si',724:'es',752:'se',756:'ch',804:'ua',826:'gb' };
/* the tiny ones: [longitude, latitude], neighbors (so the dot's color differs from them) */
const DOTS = { va: [12.45, 41.90, ['it']], sm: [12.46, 43.94, ['it']], mc: [7.42, 43.74, ['fr']], li: [9.55, 47.14, ['at', 'ch']], ad: [1.58, 42.54, ['fr', 'es']], mt: [14.43, 35.90, []] };
/* where each small country's name goes: [longitude, latitude, anchor] (a short line joins it to its dot or shape) */
export const OUT = JSON.parse(readFileSync(join(HERE, 'labels.json'), 'utf8'));

/* ---- decode the TopoJSON arcs ---- */
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arcPts = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idxs => { const out = []; idxs.forEach(i => { const p = arcPts(i); out.push(...(out.length ? p.slice(1) : p)); }); return out; };
const polys = g => g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];

/* ---- projection: Albers equal-area conic ---- */
const R = Math.PI / 180;
function proj(par, rot, cen, k, tr) {
  const s0 = Math.sin(par[0] * R), s1 = Math.sin(par[1] * R), n = (s0 + s1) / 2, C = 1 + s0 * (2 * n - s0), r0 = Math.sqrt(C) / n;
  const raw = (lam, phi) => { const r = Math.sqrt(C - 2 * n * Math.sin(phi)) / n, th = n * lam; return [r * Math.sin(th), r0 - r * Math.cos(th)]; };
  const wrap = d => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const [cx, cy] = raw(cen[0] * R, cen[1] * R);
  return (lon, lat) => { const [x, y] = raw(wrap((lon + rot[0]) * R), lat * R); return [tr[0] + k * (x - cx), tr[1] - k * (y - cy)]; };
}
/* the picture's rectangle comes from where these places land; the scale makes it about 900 wide */
const unit = proj([40, 63], [-15, 0], [0, 54], 1, [0, 0]);
const sample = [[-25, 64], [-25, 66.5], [-13, 36], [-9.6, 36.9], [10, 34.3], [34.7, 34.3], [47, 41], [49, 55], [44, 66], [32, 71.6], [18, 71.4], [6, 62]].map(([a, b]) => unit(a, b));
const bx0 = Math.min(...sample.map(p => p[0])), bx1 = Math.max(...sample.map(p => p[0])), by0 = Math.min(...sample.map(p => p[1])), by1 = Math.max(...sample.map(p => p[1]));
const K = 900 / (bx1 - bx0), PAD = 4;
const project = proj([40, 63], [-15, 0], [0, 54], K, [-bx0 * K + PAD, -by0 * K + PAD]);
const W = Math.round((bx1 - bx0) * K + 2 * PAD), H = Math.round((by1 - by0) * K + 2 * PAD);

/* ---- Sutherland-Hodgman clip of a ring to a rectangle ---- */
function clipRect(pts, x0, y0, x1, y1) {
  const edges = [
    [p => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [p => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [p => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]]
  ];
  let out = pts;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[i], b = inp[(i + 1) % inp.length], ia = inside(a), ib = inside(b);
      if (ia && ib) out.push(b); else if (ia && !ib) out.push(cut(a, b)); else if (!ia && ib) { out.push(cut(a, b)); out.push(b); }
    }
    if (!out.length) return [];
  }
  return out;
}
/* ---- simplify and measure (same helpers as the US map) ---- */
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len; if (d > md) { md = d; mi = i; } }
    if (md > tol && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
function ring2(pts, tol) {
  let m = 1, md = -1; for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > md) { md = d; m = i; } }
  const a = dp(pts.slice(0, m + 1), tol), b = dp(pts.slice(m), tol);
  return [...a, ...b.slice(1)];
}
function pole(poly) {
  const outer = poly[0], rings = poly;
  const inside = (x, y) => { let c = false; rings.forEach(r => { for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } }); return c; };
  const dist = (x, y) => { let m = 1e9; rings.forEach(r => { for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy; let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(x - x1 - t * dx, y - y1 - t * dy)); } }); return m; };
  const xs = outer.map(p => p[0]), ys = outer.map(p => p[1]); let best = [0, 0, -1];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let step = Math.max(x1 - x0, y1 - y0) / 24;
  for (let pass = 0; pass < 4; pass++) {
    const bxs = best[2] < 0 ? [x0, x1] : [best[0] - step * 2, best[0] + step * 2], bys = best[2] < 0 ? [y0, y1] : [best[1] - step * 2, best[1] + step * 2];
    for (let x = bxs[0]; x <= bxs[1]; x += step) for (let y = bys[0]; y <= bys[1]; y += step) if (inside(x, y)) { const d = dist(x, y); if (d > best[2]) best = [x, y, d]; }
    step /= 4;
  }
  return best;
}

/* ---- which countries is each outline? ---- */
const bbox = g => { let b = [1e9, 1e9, -1e9, -1e9]; polys(g).forEach(p => p[0].forEach(([x, y]) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); })); return b; };
const idOf = g => { if (ISO[g.id]) return ISO[g.id]; if (g.id === -99) { const b = bbox(g); if (b[0] > 19 && b[2] < 23 && b[1] > 41 && b[3] < 44) return 'xk'; if (b[0] > 32 && b[2] < 36 && b[1] > 34 && b[3] < 37) return 'cy'; } return null; };
const WIN = [-35, 20, 80, 80];   // generous longitude/latitude window
const clipLL = pts => clipRect(pts, WIN[0], WIN[1], WIN[2], WIN[3]);
const EUR = {}, CTX = [];
topo.objects.countries.geometries.forEach(g => {
  const id = idOf(g), out = [];
  polys(g).forEach(poly => {
    const rings = poly.map((r, i) => { const c = clipLL(r.slice(0, -1)); return c.length >= 3 ? clipRect(c.map(([lo, la]) => project(lo, la)), 0, 0, W, H) : []; });
    if (rings[0].length < 3) return;
    out.push(rings);
  });
  if (!out.length) return;
  if (id) (EUR[id] = EUR[id] || []).push(...out); else CTX.push(out);
});

/* ---- neighbors by shared border arcs, then 4-color ---- */
const arcOwners = {}, walk = (a, f) => Array.isArray(a) ? a.forEach(x => walk(x, f)) : f(a);
topo.objects.countries.geometries.forEach(g => { const id = idOf(g); if (!id || !g.arcs) return; walk(g.arcs, i => { const k = i >= 0 ? i : ~i; (arcOwners[k] = arcOwners[k] || new Set()).add(id); }); });
const adj = {}; Object.values(arcOwners).forEach(set => { if (set.size >= 2) { const l = [...set]; l.forEach(a => l.forEach(b => { if (a !== b) (adj[a] = adj[a] || new Set()).add(b); })); } });
function colorGraph() {
  const ids = Object.keys(EUR); let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let attempt = 0; attempt < 5000; attempt++) {
    const order = attempt === 0 ? ids.slice().sort((a, b) => (adj[b] ? adj[b].size : 0) - (adj[a] ? adj[a].size : 0) || (a < b ? -1 : 1)) : ids.slice().sort(() => rnd() - 0.5);
    const col = {}; let ok = true;
    for (const id of order) { const used = new Set([...(adj[id] || [])].map(n => col[n])); let c = 0; while (used.has(c)) c++; if (c > 3) { ok = false; break; } col[id] = c; }
    if (ok) return col;
  }
  throw new Error('cannot 4-color');
}
const colorOf = colorGraph();

/* ---- build the output ---- */
const fmt = r => 'M' + r.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z';
const countries = {}, context = [];
const MIN = id => (id === 'cy' ? 0.5 : 0.6);
Object.entries(EUR).forEach(([id, plist]) => {
  const kept = [];
  plist.forEach(poly => {
    const outer = ring2(poly[0], 0.55); if (outer.length < 4 || Math.abs(area(outer)) < MIN(id)) return;
    kept.push([outer, ...poly.slice(1).map(r => ring2(r, 0.55)).filter(r => r.length >= 4 && Math.abs(area(r)) >= 0.6)]);
  });
  if (!kept.length) { console.log('EMPTY', id); return; }
  const biggest = kept.slice().sort((a, b) => Math.abs(area(b[0])) - Math.abs(area(a[0])))[0];
  const [lx, ly, lr] = pole(biggest);
  countries[id] = { d: kept.map(p => p.map(fmt).join('')).join(''), label: [+lx.toFixed(1), +ly.toFixed(1), +lr.toFixed(1)], c: colorOf[id] };
});
CTX.forEach(plist => { const d = plist.map(p => { const o = ring2(p[0], 0.7); return o.length >= 4 && Math.abs(area(o)) >= 1 ? fmt(o) : ''; }).join(''); if (d) context.push(d); });
/* the tiny countries: a dot at the real position, colored to differ from its neighbors */
Object.entries(DOTS).forEach(([id, [lon, lat, nb]]) => {
  const [x, y] = project(lon, lat), r = 5.2, used = new Set(nb.map(n => colorOf[n])); let c = 0; while (used.has(c)) c++;
  countries[id] = { d: `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`, label: [+x.toFixed(1), +y.toFixed(1), r], c, dot: 1 };
});
/* ocean/margin label positions */
Object.entries(OUT).forEach(([id, [lon, lat, anchor]]) => { if (!countries[id]) return; const [x, y] = project(lon, lat); countries[id].out = [+x.toFixed(1), +y.toFixed(1), anchor || 'start']; });
const out = { width: W, height: H, countries, context };
writeFileSync(join(HERE, '..', '..', 'modules/geography/europe/mapdata.js'), '/* Europe map outlines. Generated by _dev/eu-map/geo_eu.mjs from Natural Earth 1:110m country outlines. Do not edit by hand. */\nconst MAPDATA = ' + JSON.stringify(out) + ';\n');
console.log('countries', Object.keys(countries).length, 'colors', Math.max(...Object.values(countries).map(x => x.c)) + 1, 'size', W, 'x', H, 'bytes', JSON.stringify(out).length);
