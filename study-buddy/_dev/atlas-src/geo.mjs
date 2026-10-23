// Hand-authored, simplified country outlines (lon, lat). Shared borders reuse identical point lists.
const P = (...a) => a;
const B = {
  colVen: P([-71.3,11.8],[-71.9,10.8],[-72.0,9.8],[-72.5,8.5],[-72.2,7.35],[-70.1,6.95],[-67.8,6.2],[-67.6,4.5],[-67.8,2.8],[-67.1,1.7]),
  venBra: P([-67.1,1.7],[-66.3,0.8],[-64.8,4.2],[-63.4,3.9],[-60.7,5.2]),
  venGuy: P([-60.7,5.2],[-60.7,7.4],[-59.8,8.55]),
  guyBra: P([-60.7,5.2],[-60.1,4.4],[-60.0,2.8],[-59.2,1.4],[-58.4,1.5],[-57.3,2.0],[-56.5,1.9]),
  guySur: P([-56.5,1.9],[-56.9,2.9],[-57.3,3.9],[-57.3,5.0],[-57.15,5.97]),
  surBra: P([-56.5,1.9],[-55.9,1.9],[-54.6,2.3]),
  surFg:  P([-54.6,2.3],[-54.45,3.2],[-54.2,4.0],[-54.0,5.75]),
  fgBra:  P([-54.6,2.3],[-53.2,2.2],[-52.4,3.2],[-51.6,4.2]),
  colBra: P([-67.1,1.7],[-69.2,1.1],[-70.0,0.5],[-69.5,-1.0],[-69.95,-4.2]),
  colPer: P([-69.95,-4.2],[-72.0,-2.4],[-74.0,-1.0],[-75.3,-0.1]),
  colEcu: P([-75.3,-0.1],[-77.7,0.7],[-78.9,1.4]),
  ecuPer: P([-80.3,-3.4],[-79.5,-4.4],[-78.4,-3.4],[-77.8,-2.9],[-75.6,-1.5],[-75.3,-0.1]),
  perBra: P([-69.6,-10.95],[-70.6,-11.0],[-72.8,-9.5],[-73.2,-7.4],[-73.0,-6.0],[-70.9,-4.4],[-69.95,-4.2]),
  perBol: P([-69.5,-17.5],[-69.1,-16.2],[-69.0,-14.5],[-68.9,-12.7],[-69.6,-10.95]),
  perChi: P([-70.4,-18.3],[-69.5,-17.5]),
  bolBra: P([-58.2,-19.8],[-57.7,-17.6],[-58.4,-16.3],[-60.2,-16.3],[-60.2,-14.5],[-62.7,-13.0],[-65.3,-9.8],[-67.0,-10.2],[-68.8,-11.0],[-69.6,-10.95]),
  bolChi: P([-69.5,-17.5],[-69.0,-18.6],[-68.4,-20.1],[-67.9,-22.0],[-67.2,-22.8]),
  bolArg: P([-67.2,-22.8],[-65.5,-22.1],[-64.4,-22.8],[-62.6,-22.2]),
  bolPar: P([-62.6,-22.2],[-61.9,-20.8],[-60.0,-19.3],[-58.2,-19.8]),
  parBra: P([-58.2,-19.8],[-57.8,-21.0],[-55.8,-22.3],[-54.5,-23.9],[-54.6,-25.6]),
  parArg: P([-62.6,-22.2],[-60.5,-23.8],[-58.3,-24.9],[-58.6,-27.3],[-57.4,-27.3],[-55.9,-27.3],[-54.8,-26.2],[-54.6,-25.6]),
  argBra: P([-54.6,-25.6],[-53.8,-26.4],[-54.5,-27.3],[-55.8,-28.2],[-57.1,-29.4],[-57.6,-30.2]),
  argUru: P([-57.6,-30.2],[-58.1,-31.3],[-58.2,-32.5],[-58.4,-33.3],[-58.4,-33.9]),
  uruBra: P([-57.6,-30.2],[-56.0,-30.2],[-55.0,-31.2],[-53.4,-32.6],[-53.4,-33.7]),
  chiArg: P([-67.2,-22.8],[-68.2,-24.4],[-68.5,-26.5],[-69.2,-28.0],[-70.0,-30.0],[-70.2,-32.5],[-70.1,-34.5],[-70.6,-36.5],[-71.2,-38.5],[-71.7,-40.5],[-71.8,-42.5],[-72.0,-44.5],[-72.3,-46.5],[-72.8,-48.5],[-72.5,-50.0],[-71.5,-50.9],[-70.0,-51.8],[-68.5,-52.5]),
};
const rev = a => [...a].reverse();
const j = (...parts) => { const out = []; for (const p of parts) for (const pt of p) { const l = out[out.length-1]; if (!l || l[0]!==pt[0] || l[1]!==pt[1]) out.push(pt); } return out; };

const shapes = {
  colombia: [j(B.colVen,
    P([-67.1,1.7]), B.colBra.slice(1), B.colPer.slice(1), B.colEcu.slice(1),
    P([-78.6,2.2],[-77.3,4.0],[-77.4,5.6],[-77.9,7.2],[-77.3,8.6],[-76.8,8.7],[-75.6,10.4],[-74.8,11.0],[-73.4,11.3],[-71.9,12.4]))],
  venezuela: [j(P([-71.3,11.8],[-70.0,12.2],[-68.3,10.7],[-66.0,10.6],[-64.0,10.6],[-62.3,10.7],[-61.2,9.9],[-60.9,8.9]),
    rev(B.venGuy).slice(0), B.venBra.slice().reverse().slice(1).reverse().reverse(), [])],
  ecuador: [j(B.colEcu, P([-80.0,0.0],[-80.9,-1.0],[-81.0,-2.2],[-80.2,-2.9],[-80.3,-3.4]), B.ecuPer)],
  peru: [j(P([-80.3,-3.4],[-81.2,-4.7],[-80.9,-5.8],[-79.9,-6.9],[-79.0,-8.3],[-78.0,-9.8],[-77.0,-12.1],[-76.2,-13.6],[-75.2,-15.3],[-73.0,-16.3],[-71.5,-17.3],[-70.4,-18.3]),
    B.perChi, B.perBol, B.perBra, B.colPer, rev(B.ecuPer))],
  brazil: [], bolivia: [], paraguay: [], uruguay: [], argentina: [], chile: [], guyana: [], suriname: [],
};
// venezuela, brazil etc. are assembled explicitly below for clarity
shapes.venezuela = [j(
  P([-71.3,11.8],[-70.0,12.2],[-68.3,10.7],[-66.0,10.6],[-64.0,10.6],[-62.3,10.7],[-61.2,9.9],[-60.9,8.9],[-59.8,8.55]),
  P([-60.7,7.4],[-60.7,5.2]),
  rev(B.venBra),
  rev(B.colVen))];
shapes.venezuela[0] = shapes.venezuela[0].filter((p, i, a) => i === 0 || p[0] !== a[i-1][0] || p[1] !== a[i-1][1]);
shapes.guyana = [j(P([-57.15,5.97],[-58.3,6.8],[-59.2,7.5],[-59.8,8.55]), rev(B.venGuy).slice(1), B.guyBra, B.guySur)];
shapes.suriname = [j(rev(B.guySur), B.surBra, B.surFg, P([-55.0,5.95],[-56.5,5.95],[-57.15,5.97]))];
shapes.brazil = [j(
  P([-51.6,4.2],[-50.0,1.8],[-50.0,0.5],[-48.5,-1.0],[-46.0,-1.1],[-44.0,-2.5],[-41.5,-2.9],[-39.0,-3.1],[-37.2,-4.9],[-35.2,-5.7],[-34.8,-7.0],[-35.0,-8.8],[-36.5,-10.5],[-37.5,-11.0],[-38.5,-13.0],[-39.0,-15.0],[-39.2,-17.7],[-39.7,-19.5],[-40.9,-21.5],[-41.9,-22.9],[-43.2,-23.0],[-45.0,-23.5],[-46.4,-24.0],[-48.0,-25.5],[-48.7,-26.7],[-48.6,-28.2],[-49.7,-29.5],[-50.8,-31.2],[-52.2,-32.2],[-53.4,-33.7]),
  rev(B.uruBra).slice(0).reverse().reverse(),
  [])];
shapes.brazil = [j(
  P([-51.6,4.2],[-50.0,1.8],[-50.0,0.5],[-48.5,-1.0],[-46.0,-1.1],[-44.0,-2.5],[-41.5,-2.9],[-39.0,-3.1],[-37.2,-4.9],[-35.2,-5.7],[-34.8,-7.0],[-35.0,-8.8],[-36.5,-10.5],[-37.5,-11.0],[-38.5,-13.0],[-39.0,-15.0],[-39.2,-17.7],[-39.7,-19.5],[-40.9,-21.5],[-41.9,-22.9],[-43.2,-23.0],[-45.0,-23.5],[-46.4,-24.0],[-48.0,-25.5],[-48.7,-26.7],[-48.6,-28.2],[-49.7,-29.5],[-50.8,-31.2],[-52.2,-32.2]),
  B.uruBra.slice().reverse().length ? [[-53.4,-33.7]] : [],
  B.uruBra.slice().reverse().slice(0),   // (-53.4,-33.7) -> (-57.6,-30.2)
  rev(B.argBra),                          // (-57.6,-30.2) -> (-54.6,-25.6)
  rev(B.parBra),                          // (-54.6,-25.6) -> (-58.2,-19.8)
  B.bolBra,                               // (-58.2,-19.8) -> (-69.6,-10.95)
  B.perBra,                               // -> (-69.95,-4.2)
  rev(B.colBra),                          // -> (-67.1,1.7)
  B.venBra,                               // -> (-60.7,5.2)
  B.guyBra,                               // -> (-56.5,1.9)
  B.surBra,                               // -> (-54.6,2.3)
  B.fgBra)];                              // -> (-51.6,4.2)
shapes.bolivia = [j(B.perBol, rev(B.bolBra), B.bolPar.slice().reverse().reverse(), [])];
shapes.bolivia = [j(
  rev(B.perBol),            // (-69.6,-10.95) <- ... we need ring: start at tripoint Per-Bol-Chi
  [])];
shapes.bolivia = [j(
  B.perBol.slice().reverse(),          // (-69.6,-10.95) ... (-69.5,-17.5) reversed -> starts at -10.95 ends at -17.5
  B.bolChi.slice(1),                   // -> (-67.2,-22.8)
  B.bolArg.slice(1),                   // -> (-62.6,-22.2)
  B.bolPar.slice(1),                   // -> (-58.2,-19.8)
  B.bolBra.slice(1))];                 // -> (-69.6,-10.95)
shapes.paraguay = [j(B.bolPar.slice().reverse(), B.parBra.slice(1), rev(B.parArg).slice(1).reverse().reverse(), [])];
shapes.paraguay = [j(
  B.bolPar,                            // (-62.6,-22.2) -> (-58.2,-19.8)
  B.parBra.slice(1),                   // -> (-54.6,-25.6)
  rev(B.parArg).slice(1))];            // back along Argentina border to (-62.6,-22.2)
shapes.uruguay = [j(B.argUru.slice().reverse().reverse(), [])];
shapes.uruguay = [j(
  B.uruBra,                            // (-57.6,-30.2) -> (-53.4,-33.7)
  P([-54.6,-34.8],[-56.2,-34.9],[-57.3,-34.4],[-58.4,-33.9]),
  rev(B.argUru).slice(1))];            // (-58.4,-33.9) -> (-57.6,-30.2)
shapes.argentina = [
  j(B.bolArg, B.parArg.slice(1), B.argBra.slice(1), B.argUru.slice(1),
    P([-58.4,-34.6],[-57.5,-35.4],[-57.0,-36.3],[-57.6,-38.2],[-59.0,-38.7],[-62.1,-38.8],[-62.3,-40.5],[-64.5,-40.9],[-65.0,-42.0],[-64.2,-42.8],[-65.3,-44.5],[-67.4,-46.0],[-65.7,-47.6],[-67.6,-49.0],[-68.4,-50.3],[-69.0,-51.6]),
    P([-68.5,-52.5]),
    rev(B.chiArg).slice(1)),
  j(P([-68.6,-52.65],[-67.0,-53.6],[-65.3,-54.7],[-66.5,-55.0],[-68.6,-55.0]))];
shapes.chile = [j(
  P([-70.4,-18.3],[-70.2,-20.5],[-70.5,-23.6],[-70.7,-26.0],[-71.3,-29.0],[-71.5,-32.0],[-71.7,-34.0],[-72.5,-36.0],[-73.2,-38.0],[-73.6,-40.0],[-73.9,-42.0],[-74.2,-44.0],[-75.0,-46.5],[-75.4,-48.5],[-75.2,-50.5],[-74.2,-52.0],[-73.0,-53.5],[-71.5,-54.7],[-68.6,-55.0],[-68.6,-52.65]),
  rev(B.chiArg),                       // (-68.5,-52.5) -> (-67.2,-22.8)
  rev(B.bolChi).slice(1),              // -> (-69.5,-17.5)
  rev(B.perChi).slice(1))];            // -> (-70.4,-18.3)

const context = {
  frenchGuiana: [j(B.surFg.slice().reverse().reverse(), [])],
  panama: [[[-77.3,8.6],[-77.9,7.2],[-79.0,7.4],[-80.4,7.3],[-81.7,7.7],[-82.9,8.1],[-82.9,9.0],[-81.5,8.8],[-79.6,9.6],[-78.0,9.2]]],
  falklands: [[[-61.0,-51.5],[-59.5,-51.2],[-57.8,-51.5],[-58.4,-52.3],[-60.5,-52.1]]],
  trinidad: [[[-61.9,10.7],[-60.9,10.8],[-61.0,10.0],[-61.8,10.1]]],
};
context.frenchGuiana = [j(B.surFg, P([-54.0,5.75],[-53.3,5.5],[-52.3,4.9],[-51.6,4.2]), rev(B.fgBra))];

// ---------- project ----------
const KX = 0.93;
const lon0 = -83, lat0 = 13.5, scale = 11.2; // px per degree
const proj = ([lo, la]) => [ (lo - lon0) * KX * scale, (lat0 - la) * scale ];
const f1 = n => Math.round(n * 10) / 10;
const ringPath = r => 'M' + r.map(p => proj(p).map(f1).join(',')).join('L') + 'Z';
const dOf = polys => polys.map(ringPath).join('');

function inside(pt, ring) { let c = false; for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) { const [xi, yi] = ring[i], [xk, yk] = ring[k]; if (((yi > pt[1]) !== (yk > pt[1])) && (pt[0] < (xk - xi) * (pt[1] - yi) / (yk - yi) + xi)) c = !c; } return c; }
function distSeg(p, a, b) { const dx = b[0]-a[0], dy = b[1]-a[1]; const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy || 1))); return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy)); }
function labelPoint(polys) {
  let best = null, bestArea = -1;
  for (const r of polys) { const pr = r.map(proj); let a = 0; for (let i = 0; i < pr.length; i++) { const [x1,y1] = pr[i], [x2,y2] = pr[(i+1)%pr.length]; a += x1*y2 - x2*y1; } a = Math.abs(a/2); if (a > bestArea) { bestArea = a; best = pr; } }
  const xs = best.map(p=>p[0]), ys = best.map(p=>p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  let bp = null, bd = -1;
  for (let x = minx; x <= maxx; x += 1) for (let y = miny; y <= maxy; y += 1) {
    if (!inside([x,y], best)) continue;
    let d = Infinity; for (let i = 0; i < best.length; i++) d = Math.min(d, distSeg([x,y], best[i], best[(i+1)%best.length]));
    if (d > bd) { bd = d; bp = [x,y]; }
  }
  return [f1(bp[0]), f1(bp[1]), f1(bd)];
}
const out = { width: 0, height: 0, countries: {}, context: {} };
let maxx = 0, maxy = 0;
for (const [id, polys] of Object.entries(shapes)) {
  out.countries[id] = { d: dOf(polys), label: labelPoint(polys) };
  for (const r of polys) for (const p of r) { const [x,y] = proj(p); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y); }
}
for (const [id, polys] of Object.entries(context)) out.context[id] = dOf(polys);
out.width = Math.ceil(maxx + 30); out.height = Math.ceil(maxy + 30);
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./mapdata.json', import.meta.url), JSON.stringify(out));
console.log('map', out.width, 'x', out.height, 'bytes', JSON.stringify(out).length);
for (const [id, c] of Object.entries(out.countries)) console.log(id, c.label.join(','), 'rings', shapes[id].length, 'pts', shapes[id].reduce((s,r)=>s+r.length,0));
