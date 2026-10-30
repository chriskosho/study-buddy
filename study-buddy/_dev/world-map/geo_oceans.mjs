/* The Oceans map (equirectangular, whole world). Run from the study-buddy folder:
     node _dev/world-map/geo_oceans.mjs      (reads _dev/world-map/regions/oceans.json, writes modules/geography/oceans/mapdata.js)
   The oceans and seas are hand-drawn polygons in longitude and latitude (regions/oceans.json), drawn UNDER the land. Because land is drawn on
   top, a polygon only has to be right where it crosses open water; where it runs over land the land hides it. So the edges you see between
   two bodies of water are straight lines across the water (the usual way maps divide the oceans), and every coastline comes from the
   Natural Earth 1:110m country outlines (public domain, world-110m.json). Order matters: later bodies are drawn over earlier ones, so the
   five oceans come first (the Pacific is the whole picture underneath) and the seas after them.
   Body fields: polys [[lon,lat],...] (one or more), label [lon,lat,size,lines], alt [[lon,lat]] (extra label spots), small (a short code
   label until tapped or zoomed, like a small country), kind ocean|sea. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(readFileSync(join(HERE, 'regions', 'oceans.json'), 'utf8'));
const topo = JSON.parse(readFileSync(join(HERE, 'world-110m.json'), 'utf8'));
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arcPts = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idxs => { const out = []; idxs.forEach(i => { const p = arcPts(i); out.push(...(out.length ? p.slice(1) : p)); }); return out; };
const polys = g => g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];
const [LAT0, LAT1] = CFG.lat, PAD = 4, K = CFG.width / 360;       // map units per degree
const W = Math.round(CFG.width + 2 * PAD), H = Math.round((LAT1 - LAT0) * K + 2 * PAD);
const project = (lon, lat) => [PAD + (lon + 180) * K, PAD + (LAT1 - lat) * K];
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

const fmt = r => 'M' + r.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z';
const OCEAN_COLORS = 5, SEA_COLORS = 4;
const waters = {}; let si = 0;
for (const [id, b] of Object.entries(CFG.bodies)) {
  const d = b.polys.map(p => { const c = clipRect(p.map(([lo, la]) => project(lo, la)), 0, 0, W, H); return c.length >= 3 ? fmt(c) : ''; }).join('');
  const [lon, lat, size, lines] = b.label, [x, y] = project(lon, lat);
  const c = b.kind === 'ocean' ? b.c : OCEAN_COLORS + (b.c !== undefined ? b.c : (si++ % SEA_COLORS));
  waters[id] = { d, label: [+x.toFixed(1), +y.toFixed(1), size], lines, c, ...(b.small ? { small: 1 } : {}), ...(b.alt ? { alts: b.alt.map(([lo, la]) => project(lo, la).map(v => +v.toFixed(1))) } : {}) };
}
const land = [];
topo.objects.countries.geometries.forEach(g => polys(g).forEach(poly => {
  const rings = poly.map(r => { const c = clipRect(r.slice(0, -1), -180, LAT0, 180, LAT1); return c.length >= 3 ? clipRect(c.map(([lo, la]) => project(lo, la)), 0, 0, W, H) : []; });
  if (rings[0].length < 3) return;
  const o = ring2(rings[0], 0.45); if (o.length < 4 || Math.abs(area(o)) < 0.8) return;
  land.push(fmt(o) + rings.slice(1).map(r => ring2(r, 0.45)).filter(r => r.length >= 4 && Math.abs(area(r)) >= 0.8).map(fmt).join(''));
}));
const outDir = join(HERE, '..', '..', 'modules', 'geography', CFG.slug); mkdirSync(outDir, { recursive: true });
const data = { width: W, height: H, waters, context: [land.join('')] };
writeFileSync(join(outDir, 'mapdata.js'), `/* Oceans map: bodies of water and land. Generated by _dev/world-map/geo_oceans.mjs (regions/oceans.json) from Natural Earth 1:110m outlines. Do not edit by hand. */\nconst MAPDATA = ${JSON.stringify(data)};\n`);
console.log('oceans', Object.keys(waters).length, 'size', W, 'x', H, 'bytes', JSON.stringify(data).length);
