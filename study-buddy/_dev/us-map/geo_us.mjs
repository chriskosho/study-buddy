/* US map data for the US States module. Run:  node _dev/us-map/geo_us.mjs  (from the study-buddy folder)
   Source: us-10m.json, the US Census Bureau 1:10,000,000 state outlines (public domain), as a TopoJSON file.
   Output: modules/geography/us-states/mapdata.js  (window-free: defines const MAPDATA).
   The projection is the same one D3 calls "Albers USA": the lower 48 on an Albers equal-area map, with Alaska (scaled down)
   and Hawaii moved under the southwest, so all 50 states fit one picture.
   Outlines are simplified (Douglas-Peucker, 0.7 px) so the page stays small. Label points use the point farthest from any edge. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const topo = JSON.parse(readFileSync(join(HERE, 'us-10m.json'), 'utf8'));
const FIPS = { '01':'al','02':'ak','04':'az','05':'ar','06':'ca','08':'co','09':'ct','10':'de','11':'dc','12':'fl','13':'ga','15':'hi','16':'id','17':'il','18':'in','19':'ia','20':'ks','21':'ky','22':'la','23':'me','24':'md','25':'ma','26':'mi','27':'mn','28':'ms','29':'mo','30':'mt','31':'ne','32':'nv','33':'nh','34':'nj','35':'nm','36':'ny','37':'nc','38':'nd','39':'oh','40':'ok','41':'or','42':'pa','44':'ri','45':'sc','46':'sd','47':'tn','48':'tx','49':'ut','50':'vt','51':'va','53':'wa','54':'wv','55':'wi','56':'wy' };

/* ---- decode the TopoJSON arcs ---- */
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arcPts = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idxs => { const out = []; idxs.forEach(i => { const p = arcPts(i); out.push(...(out.length ? p.slice(1) : p)); }); return out; };
const polys = g => g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];

/* ---- Albers equal-area conic, and the Albers USA composite ---- */
const R = Math.PI / 180;
const K = 1070, T = [480, 250];
/* one conic projection: parallels, rotation, center, scale, translate (y grows downward) */
function proj(par, rot, cen, k, tr) {
  const s0 = Math.sin(par[0] * R), s1 = Math.sin(par[1] * R), n = (s0 + s1) / 2, C = 1 + s0 * (2 * n - s0), r0 = Math.sqrt(C) / n;
  const raw = (lam, phi) => { const r = Math.sqrt(C - 2 * n * Math.sin(phi)) / n, th = n * lam; return [r * Math.sin(th), r0 - r * Math.cos(th)]; };   // y up (north is positive)
  const wrap = d => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const [cx, cy] = raw(cen[0] * R, cen[1] * R);
  return (lon, lat) => { const [x, y] = raw(wrap((lon + rot[0]) * R), lat * R); return [tr[0] + k * (x - cx), tr[1] - k * (y - cy)]; };
}
const P48 = proj([29.5, 45.5], [96, 0], [-0.6, 38.7], K, T);
const PAK = proj([55, 65], [154, 0], [-2, 58.5], K * 0.35, [T[0] - 0.307 * K, T[1] + 0.201 * K]);
const PHI = proj([8, 18], [157, 0], [-3, 19.9], K, [T[0] - 0.205 * K, T[1] + 0.212 * K]);
const project = (id, lon, lat) => (id === 'ak' ? PAK : id === 'hi' ? PHI : P48)(lon, lat);

/* ---- simplify and measure ---- */
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
/* a closed ring starts and ends at the same point, so split it at the farthest point and simplify each half */
function ring2(pts, tol) {
  let m = 1, md = -1; for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > md) { md = d; m = i; } }
  const a = dp(pts.slice(0, m + 1), tol), b = dp(pts.slice(m), tol);
  return [...a, ...b.slice(1)];
}
/* point farthest from every edge (grid search, then refine) */
function pole(poly) {
  const outer = poly[0], rings = poly;
  const inside = (x, y) => { let c = false; rings.forEach(r => { for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } }); return c; };
  const dist = (x, y) => { let m = 1e9; rings.forEach(r => { for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy; let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(x - x1 - t * dx, y - y1 - t * dy)); } }); return m; };
  const xs = outer.map(p => p[0]), ys = outer.map(p => p[1]); let best = [0, 0, -1];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let step = Math.max(x1 - x0, y1 - y0) / 24;
  for (let pass = 0; pass < 4; pass++) {
    const bx = best[2] < 0 ? [x0, x1] : [best[0] - step * 2, best[0] + step * 2], by = best[2] < 0 ? [y0, y1] : [best[1] - step * 2, best[1] + step * 2];
    for (let x = bx[0]; x <= bx[1]; x += step) for (let y = by[0]; y <= by[1]; y += step) if (inside(x, y)) { const d = dist(x, y); if (d > best[2]) best = [x, y, d]; }
    step /= 4;
  }
  return best;
}

/* which states share a border: two states that use the same arc (a border segment) are neighbors */
const arcOwners = {}, ID = g => FIPS[String(g.id).padStart(2, '0')];
const walkArcs = (a, f) => Array.isArray(a) ? a.forEach(x => walkArcs(x, f)) : f(a);
topo.objects.states.geometries.forEach(g => { const id = ID(g); if (!id || !g.arcs) return; walkArcs(g.arcs, i => { const k = i >= 0 ? i : ~i; (arcOwners[k] = arcOwners[k] || new Set()).add(id); }); });
const adj = {}; Object.values(arcOwners).forEach(set => { if (set.size === 2) { const [a, b] = [...set]; (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a); } });
const colorOf = {}; Object.keys(adj).sort((a, b) => adj[b].size - adj[a].size || (a < b ? -1 : 1)).forEach(id => { const used = new Set([...adj[id]].map(n => colorOf[n])); let c = 0; while (used.has(c)) c++; colorOf[id] = c; });
const states = {}, context = {};
let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
topo.objects.states.geometries.forEach(g => {
  const id = FIPS[String(g.id).padStart(2, '0')]; if (!id) return;
  const polysOut = [];
  polys(g).forEach(poly => {
    const pr = poly.map(r => r.map(([lon, lat]) => project(id, lon, lat)));
    if (Math.abs(area(pr[0])) < (id === 'dc' ? 0.05 : id === 'hi' ? 0.5 : id === 'ak' ? 8 : 1.2)) return;                 // drop specks
    const outer = ring2(pr[0], 0.7); if (outer.length < 4) return;
    polysOut.push([outer, ...pr.slice(1).map(r => ring2(r, 0.7)).filter(r => r.length >= 4 && Math.abs(area(r)) >= 0.6)]);
  });
  const d = polysOut.map(p => p.map(r => 'M' + r.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z').join('')).join('');
  polysOut.forEach(p => p[0].forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }));
  if (!polysOut.length) { console.log('EMPTY', id); return; }
  const biggest = polysOut.slice().sort((a, b) => Math.abs(area(b[0])) - Math.abs(area(a[0])))[0];
  const [lx, ly, lr] = pole(biggest);
  (id === 'dc' ? context : states)[id] = id === 'dc' ? d : { d, label: [+lx.toFixed(1), +ly.toFixed(1), +lr.toFixed(1)], c: colorOf[id] || 0, n: [...(adj[id] || [])].filter(x => x !== 'dc').sort() };
});
const pad = 6, W = Math.ceil(maxX + pad) - Math.floor(minX - pad), H = Math.ceil(maxY + pad) - Math.floor(minY - pad);
const ox = Math.floor(minX - pad), oy = Math.floor(minY - pad);
// shift so the picture starts at 0,0
const shift = d => d.replace(/(-?\d+\.\d),(-?\d+\.\d)/g, (m, x, y) => (+x - ox).toFixed(1) + ',' + (+y - oy).toFixed(1));
Object.values(states).forEach(s => { s.d = shift(s.d); s.label[0] = +(s.label[0] - ox).toFixed(1); s.label[1] = +(s.label[1] - oy).toFixed(1); });
Object.keys(context).forEach(k => context[k] = shift(context[k]));
const out = { width: W, height: H, states, context };
writeFileSync(join(HERE, '..', '..', 'modules/geography/us-states/mapdata.js'), '/* US map outlines. Generated by _dev/us-map/geo_us.mjs from US Census 1:10m state outlines. Do not edit by hand. */\nconst MAPDATA = ' + JSON.stringify(out) + ';\n');
console.log('colors used', Math.max(...Object.values(states).map(x => x.c)) + 1, '| states', Object.keys(states).length, 'size', W, 'x', H, 'bytes', JSON.stringify(out).length);
