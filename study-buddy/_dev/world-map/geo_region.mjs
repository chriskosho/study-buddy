/* One map generator for the continent modules (Africa, Asia, North America, Oceania). Run from the study-buddy folder:
     node _dev/world-map/geo_region.mjs <region>        (reads _dev/world-map/regions/<region>.json, writes modules/geography/<slug>/mapdata.js)
   Source: world-110m.json, Natural Earth 1:110,000,000 country outlines (public domain), as TopoJSON. Same method as the Europe map
   (_dev/eu-map/geo_eu.mjs): project, clip to the picture's rectangle, simplify, find a label spot, 4-color, and draw the places too small
   for the 110m data as dots at their real longitude and latitude.
   Region file: { slug, projection: {type:'albers'|'laea', parallels:[a,b], rotate:lonShift, center:[lon,lat]}, windows:[[lon0,lat0,lon1,lat1],...],
     bounds:[[lon,lat],...] (the picture must contain all of these), width, iso:{numericId:'xx'}, unnamed:[{id,bbox:[lon0,lat0,lon1,lat1],into?}],
     dots:{id:[lon,lat,[neighborIds]]}, labels:{id:[lon,lat,'start'|'end']}, minArea? }  */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const region = process.argv[2]; if (!region) { console.error('usage: node geo_region.mjs <region>'); process.exit(1); }
const CFG = JSON.parse(readFileSync(join(HERE, 'regions', region + '.json'), 'utf8'));
const topo = JSON.parse(readFileSync(join(HERE, 'world-110m.json'), 'utf8'));
const ISO = Object.fromEntries(Object.entries(CFG.iso).map(([k, v]) => [+k, v]));
const DOTS = CFG.dots || {}, OUT = CFG.labels || {};

const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arcPts = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idxs => { const out = []; idxs.forEach(i => { const p = arcPts(i); out.push(...(out.length ? p.slice(1) : p)); }); return out; };
const polys = g => g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];

const R = Math.PI / 180;
const wrap = d => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function makeProj(P, k, tr) {
  const rot = P.rotate || 0, [clon, clat] = P.center;
  let raw;
  if (P.type === 'laea') {
    const p0 = clat * R, l0 = (clon + rot) * R;
    raw = (lam, phi) => { const dl = wrap(lam - l0), kk = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(dl))); return [kk * Math.cos(phi) * Math.sin(dl), -kk * (Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(dl))]; };
    return (lon, lat) => { const [x, y] = raw((lon + rot) * R, lat * R); return [tr[0] + k * x, tr[1] + k * y]; };
  }
  const par = P.parallels, s0 = Math.sin(par[0] * R), s1 = Math.sin(par[1] * R), n = (s0 + s1) / 2, C = 1 + s0 * (2 * n - s0), r0 = Math.sqrt(C) / n;
  raw = (lam, phi) => { const r = Math.sqrt(C - 2 * n * Math.sin(phi)) / n, th = n * lam; return [r * Math.sin(th), r0 - r * Math.cos(th)]; };
  const [cx, cy] = raw((clon + rot) * R, clat * R);
  return (lon, lat) => { const [x, y] = raw(wrap((lon + rot) * R), lat * R); return [tr[0] + k * (x - cx), tr[1] - k * (y - cy)]; };
}
const unit = makeProj(CFG.projection, 1, [0, 0]);
const sample = CFG.bounds.map(([a, b]) => unit(a, b));
const bx0 = Math.min(...sample.map(p => p[0])), bx1 = Math.max(...sample.map(p => p[0])), by0 = Math.min(...sample.map(p => p[1])), by1 = Math.max(...sample.map(p => p[1]));
const K = (CFG.width || 900) / (bx1 - bx0), PAD = 4;
const project = makeProj(CFG.projection, K, [-bx0 * K + PAD, -by0 * K + PAD]);
const W = Math.round((bx1 - bx0) * K + 2 * PAD), H = Math.round((by1 - by0) * K + 2 * PAD);

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

const bbox = g => { let b = [1e9, 1e9, -1e9, -1e9]; polys(g).forEach(p => p[0].forEach(([x, y]) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); })); return b; };
const idOf = g => {
  if (ISO[g.id]) return ISO[g.id];
  if (g.id === -99) { const b = bbox(g); for (const u of CFG.unnamed || []) if (b[0] >= u.bbox[0] && b[2] <= u.bbox[2] && b[1] >= u.bbox[1] && b[3] <= u.bbox[3]) return u.id; }
  return null;
};
const EUR = {}, CTX = [];
const [rx0, ry0, rx1, ry1] = [0, 0, W, H];
topo.objects.countries.geometries.forEach(g => {
  const id = idOf(g), out = [];
  polys(g).forEach(poly => {
    for (const win of CFG.windows) {
      const rings = poly.map(r => { const c = clipRect(r.slice(0, -1), win[0], win[1], win[2], win[3]); return c.length >= 3 ? clipRect(c.map(([lo, la]) => project(lo, la)), rx0, ry0, rx1, ry1) : []; });
      if (rings[0].length >= 3) out.push(rings);
    }
  });
  if (!out.length) return;
  if (id) (EUR[id] = EUR[id] || []).push(...out); else CTX.push(out);
});

const arcOwners = {}, walk = (a, f) => Array.isArray(a) ? a.forEach(x => walk(x, f)) : f(a);
topo.objects.countries.geometries.forEach(g => { const id = idOf(g); if (!id || !g.arcs) return; walk(g.arcs, i => { const k = i >= 0 ? i : ~i; (arcOwners[k] = arcOwners[k] || new Set()).add(id); }); });
const adj = {}; Object.values(arcOwners).forEach(set => { if (set.size >= 2) { const l = [...set]; l.forEach(a => l.forEach(b => { if (a !== b) (adj[a] = adj[a] || new Set()).add(b); })); } });
function colorGraph() {
  const ids = Object.keys(EUR); let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let attempt = 0; attempt < 20000; attempt++) {
    const order = attempt === 0 ? ids.slice().sort((a, b) => (adj[b] ? adj[b].size : 0) - (adj[a] ? adj[a].size : 0) || (a < b ? -1 : 1)) : ids.slice().sort(() => rnd() - 0.5);
    const col = {}; let ok = true;
    for (const id of order) { const used = new Set([...(adj[id] || [])].map(n => col[n])); let c = 0; while (used.has(c)) c++; if (c > 3) { ok = false; break; } col[id] = c; }
    if (ok) return col;
  }
  throw new Error('cannot 4-color');
}
const colorOf = colorGraph();

const fmt = r => 'M' + r.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z';
const countries = {}, context = [];
const MIN = CFG.minArea || 0.6;
Object.entries(EUR).forEach(([id, plist]) => {
  const kept = [];
  plist.forEach(poly => {
    const outer = ring2(poly[0], 0.55); if (outer.length < 4 || Math.abs(area(outer)) < MIN) return;
    kept.push([outer, ...poly.slice(1).map(r => ring2(r, 0.55)).filter(r => r.length >= 4 && Math.abs(area(r)) >= 0.6)]);
  });
  if (!kept.length) { console.log('EMPTY (no shape in view; add it to dots?):', id); return; }
  const biggest = kept.slice().sort((a, b) => Math.abs(area(b[0])) - Math.abs(area(a[0])))[0];
  const [lx, ly, lr] = pole(biggest);
  countries[id] = { d: kept.map(p => p.map(fmt).join('')).join(''), label: [+lx.toFixed(1), +ly.toFixed(1), +lr.toFixed(1)], c: colorOf[id] };
});
CTX.forEach(plist => { const d = plist.map(p => { const o = ring2(p[0], 0.7); return o.length >= 4 && Math.abs(area(o)) >= 1 ? fmt(o) : ''; }).join(''); if (d) context.push(d); });
Object.entries(DOTS).forEach(([id, [lon, lat, nb]]) => {
  const [x, y] = project(lon, lat);
  if (x < 0 || x > W || y < 0 || y > H) { console.log('DOT OUTSIDE THE PICTURE:', id, x.toFixed(0), y.toFixed(0)); return; }
  const r = 5.2, used = new Set((nb || []).map(n => colorOf[n])); let c = 0; while (used.has(c)) c++;
  countries[id] = { d: `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`, label: [+x.toFixed(1), +y.toFixed(1), r], c, dot: 1 };
});
Object.entries(OUT).forEach(([id, [lon, lat, anchor]]) => { if (!countries[id]) return; const [x, y] = project(lon, lat); countries[id].out = [+x.toFixed(1), +y.toFixed(1), anchor || 'start']; });
const outDir = join(HERE, '..', '..', 'modules', 'geography', CFG.slug); mkdirSync(outDir, { recursive: true });
const data = { width: W, height: H, countries, context };
writeFileSync(join(outDir, 'mapdata.js'), `/* ${CFG.title || CFG.slug} map outlines. Generated by _dev/world-map/geo_region.mjs (region file regions/${region}.json) from Natural Earth 1:110m country outlines. Do not edit by hand. */\nconst MAPDATA = ` + JSON.stringify(data) + ';\n');
console.log(region, 'places', Object.keys(countries).length, 'colors', Math.max(...Object.values(countries).map(x => x.c)) + 1, 'size', W, 'x', H, 'bytes', JSON.stringify(data).length);
