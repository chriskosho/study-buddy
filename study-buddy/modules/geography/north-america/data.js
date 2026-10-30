/* North America: content. One record per country (alphabetical). To add or remove a country, change this list and the matching entries in
   _dev/world-map/regions/north-america.json (its iso table or its dots), then run _dev/world-map/geo_region.mjs. Scope: the 23 UN member
   states of North America, including Central America and the Caribbean. Capitals and languages are checked by a separate pass (see
   ARCHITECTURE.md). langs: the main official or national languages, the first is the most spoken. note: a short extra fact shown in the guide and on
   flashcards. FLAGS: simplified drawings (coats of arms are simplified, so they are recognizable but not exact). */
const COUNTRIES = [
  { id: 'ag', name: 'Antigua and Barbuda', capital: "Saint John's", langs: ['English'], note: 'A country of two islands in the Caribbean Sea.' },
  { id: 'bs', name: 'Bahamas', capital: 'Nassau', langs: ['English'], note: 'A country of hundreds of islands in the Atlantic Ocean, east of Florida.' },
  { id: 'bb', name: 'Barbados', capital: 'Bridgetown', langs: ['English'], note: 'An island country, the easternmost of the Caribbean islands.' },
  { id: 'bz', name: 'Belize', capital: 'Belmopan', langs: ['English'], note: 'Belize City is the biggest city, but the capital is Belmopan. Belize is the only country in Central America where English is the official language.' },
  { id: 'ca', name: 'Canada', capital: 'Ottawa', langs: ['English', 'French'], note: 'Canada is the second biggest country in the world.' },
  { id: 'cr', name: 'Costa Rica', capital: 'San Jose', langs: ['Spanish'] },
  { id: 'cu', name: 'Cuba', capital: 'Havana', langs: ['Spanish'], note: 'The biggest island in the Caribbean Sea.' },
  { id: 'dm', name: 'Dominica', capital: 'Roseau', langs: ['English'], note: 'A small island country in the Caribbean. Do not mix it up with the Dominican Republic.' },
  { id: 'do', name: 'Dominican Republic', capital: 'Santo Domingo', langs: ['Spanish'], note: 'It shares the island of Hispaniola with Haiti.' },
  { id: 'sv', name: 'El Salvador', capital: 'San Salvador', langs: ['Spanish'], note: 'The smallest country on the mainland of Central America.' },
  { id: 'gd', name: 'Grenada', capital: "Saint George's", langs: ['English'], note: 'An island country in the Caribbean, known as the Spice Isle.' },
  { id: 'gt', name: 'Guatemala', capital: 'Guatemala City', langs: ['Spanish'] },
  { id: 'ht', name: 'Haiti', capital: 'Port-au-Prince', langs: ['French', 'Haitian Creole'], note: 'It shares the island of Hispaniola with the Dominican Republic.' },
  { id: 'hn', name: 'Honduras', capital: 'Tegucigalpa', langs: ['Spanish'] },
  { id: 'jm', name: 'Jamaica', capital: 'Kingston', langs: ['English'], note: 'An island country in the Caribbean Sea, south of Cuba.' },
  { id: 'mx', name: 'Mexico', capital: 'Mexico City', langs: ['Spanish'] },
  { id: 'ni', name: 'Nicaragua', capital: 'Managua', langs: ['Spanish'], note: 'The biggest country in Central America.' },
  { id: 'pa', name: 'Panama', capital: 'Panama City', langs: ['Spanish'], note: 'The Panama Canal cuts across the country and joins the Atlantic and Pacific oceans.' },
  { id: 'kn', name: 'Saint Kitts and Nevis', capital: 'Basseterre', langs: ['English'], note: 'The smallest country in the Americas, made of two islands.' },
  { id: 'lc', name: 'Saint Lucia', capital: 'Castries', langs: ['English'], note: 'An island country in the Caribbean Sea.' },
  { id: 'vc', name: 'Saint Vincent and the Grenadines', capital: 'Kingstown', langs: ['English'], note: 'One main island and many small islands in the Caribbean Sea.' },
  { id: 'tt', name: 'Trinidad and Tobago', capital: 'Port of Spain', langs: ['English'], note: 'Two islands just off the coast of South America.' },
  { id: 'us', name: 'United States', capital: 'Washington, D.C.', langs: ['English'], note: 'Washington, D.C. is a city that is not part of any state. Alaska and Hawaii are the two states not joined to the rest. Only Alaska is on this map.' }
];

/* other spellings accepted when typing: name and capital by country id, language by language name */
const ALSO = {
  name: { ag: ['Antigua', 'Antigua & Barbuda', 'Antigua Barbuda'], bs: ['The Bahamas', 'Bahamas Islands'], cr: ['Costarica'], do: ['Dominican Rep', 'DR'], sv: ['Salvador'], us: ['USA', 'US', 'United States of America', 'America', 'The United States', 'The US', 'The USA'], kn: ['Saint Kitts', 'St Kitts and Nevis', 'St. Kitts and Nevis', 'St Kitts', 'St. Kitts', 'Saint Christopher and Nevis', 'Saint Kitts & Nevis', 'St Kitts & Nevis'], lc: ['St Lucia', 'St. Lucia'], vc: ['Saint Vincent', 'St Vincent', 'St. Vincent', 'Saint Vincent & the Grenadines', 'St Vincent and the Grenadines', 'St. Vincent and the Grenadines', 'St Vincent & the Grenadines', 'Saint Vincent and Grenadines', 'The Grenadines'], tt: ['Trinidad', 'Trinidad & Tobago', 'Trinidad Tobago'], mx: ['Mexico', 'United Mexican States'] },
  capital: { ag: ["St. John's", "St John's", 'St Johns', 'Saint Johns', "Saint John"], gd: ["St. George's", "St George's", 'St Georges', 'Saint Georges'], cr: ['San José'], us: ['Washington', 'Washington DC', 'Washington D.C.', 'Washington, DC', 'DC', 'D.C.'], ht: ['Port au Prince', 'Port-au-Prince', 'Portauprince'], tt: ['Port-of-Spain', 'Port Of Spain'], mx: ['Mexico', 'Ciudad de Mexico', 'Mexico DF', 'CDMX', 'Mexico D.F.'], gt: ['Guatemala', 'Guatemala City'], pa: ['Panama', 'Ciudad de Panama'], bs: ['Nassau'], do: ['Santo Domingo'], hn: ['Tegus'], sv: ['San Salvador'], bz: ['Belmopan'], ca: ['Ottowa'], kn: ['Basse Terre'] },
  lang: { 'Haitian Creole': ['Creole', 'Haitian', 'Kreyol', 'Kreyòl', 'Haitian Kreyol', 'Haitian Kreyòl', 'Kreyol Ayisyen'] }
};

/* ---- flags, drawn from simple pieces ---- */
const FLAGS = (() => {
  const svg = (name, body, w = 300, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flag of ${name}">${body}</svg>`;
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const H = cs => cs.map((c, i) => rect(0, i * 200 / cs.length, 300, 200 / cs.length + .5, c)).join('');
  const V = cs => cs.map((c, i) => rect(i * 300 / cs.length, 0, 300 / cs.length + .5, 200, c)).join('');
  const star = (cx, cy, r, f) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return `<polygon fill="${f}" points="${p.join(' ')}"/>`; };
  const poly = (pts, f) => `<polygon fill="${f}" points="${pts}"/>`;
  const circ = (cx, cy, r, f, s, sw) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${s ? ` stroke="${s}" stroke-width="${sw || 2}"` : ''}/>`;
  /* a ring of small leaves or dots around a point, used for wreaths */
  const wreath = (cx, cy, r, n, lr, f) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n; return circ((cx + r * Math.cos(a)).toFixed(1), (cy + r * Math.sin(a)).toFixed(1), lr, f); }).join('');
  /* a fan of rays rising from a point, with a half disc (used by the Antigua and Barbuda sun) */
  const sun = (cx, cy, r, f) => { let s = ''; for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8, b = a + Math.PI / 20, c = a - Math.PI / 20, R = r * 1.65; s += poly(`${cx},${cy} ${(cx + R * Math.cos(c)).toFixed(1)},${(cy + R * Math.sin(c)).toFixed(1)} ${(cx + R * Math.cos(b)).toFixed(1)},${(cy + R * Math.sin(b)).toFixed(1)}`, f); } return s + `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${f}"/>`; };
  /* the Canadian maple leaf, mirrored from one half */
  const leaf = (cx, cy, k, f) => { const h = [[0, -50], [8, -33], [14, -37], [13, -19], [30, -27], [27, -13], [44, -6], [37, 0], [40, 9], [22, 7], [24, 15], [10, 9], [10, 30], [3, 30], [3, 46]]; const all = [...h, ...h.slice(1).reverse().map(([x, y]) => [-x, y])].map(([x, y]) => (cx + x * k).toFixed(1) + ',' + (cy + y * k).toFixed(1)); return `<polygon fill="${f}" points="${all.join(' ')}"/>`; };
  const F = {};
  F.ag = svg('Antigua and Barbuda', rect(0, 0, 300, 200, '#CE1126') + poly('0,0 300,0 150,200', '#000') + `<g>${poly('75,100 225,100 150,200', '#0072C6')}${poly('112.5,150 187.5,150 150,200', '#fff')}</g>` + sun(150, 100, 34, '#FCD116'));
  F.bs = svg('Bahamas', H(['#00ABC9', '#FFC72C', '#00ABC9']) + poly('0,0 125,100 0,200', '#000'));
  F.bb = svg('Barbados', V(['#00267F', '#FFC726', '#00267F']) + `<g fill="none" stroke="#000" stroke-width="8" stroke-linecap="round"><path d="M150 52v96"/><path d="M122 62q0 34 28 38q28-4 28-38"/><path d="M122 56v14M178 56v14M150 48v14" stroke-width="7"/></g>`);
  F.bz = svg('Belize', rect(0, 0, 300, 200, '#003F87') + rect(0, 0, 300, 24, '#CE1126') + rect(0, 176, 300, 24, '#CE1126') + circ(150, 100, 62, '#fff', '#3A913F', 6) + wreath(150, 100, 57, 24, 4.5, '#3A913F') + `<path d="M130 82h40v22q0 16-20 24q-20-8-20-24z" fill="#fff" stroke="#6b4b2a" stroke-width="3"/>` + rect(130, 82, 40, 10, '#003F87') + `<path d="M138 100h24M150 92v34" stroke="#6b4b2a" stroke-width="4"/>`);
  F.ca = svg('Canada', rect(0, 0, 300, 200, '#D80621') + rect(75, 0, 150, 200, '#fff') + leaf(150, 96, 1.6, '#D80621'));
  F.cr = svg('Costa Rica', rect(0, 0, 300, 34, '#002B7F') + rect(0, 33, 300, 34, '#fff') + rect(0, 66, 300, 68, '#CE1126') + rect(0, 133, 300, 34, '#fff') + rect(0, 166, 300, 34, '#002B7F') + `<ellipse cx="105" cy="100" rx="34" ry="24" fill="#fff" stroke="#6b4b2a" stroke-width="3"/>${poly('78,88 100,72 118,84 118,92 78,96', '#0F6FC6')}${poly('78,100 118,96 130,106 94,118', '#009A44')}`);
  F.cu = svg('Cuba', [0, 1, 2, 3, 4].map(i => rect(0, i * 40, 300, 40.5, i % 2 ? '#fff' : '#002A8F')).join('') + poly('0,0 140,100 0,200', '#CF142B') + star(46, 100, 30, '#fff'));
  F.dm = svg('Dominica', rect(0, 0, 300, 200, '#006B3F') + rect(124, 0, 14, 200, '#FCD116') + rect(138, 0, 14, 200, '#000') + rect(152, 0, 14, 200, '#fff') + rect(0, 78, 300, 14, '#FCD116') + rect(0, 92, 300, 14, '#000') + rect(0, 106, 300, 14, '#fff') + circ(145, 99, 44, '#CE1126') + `<ellipse cx="142" cy="102" rx="19" ry="12" fill="#7A3E9D" transform="rotate(-30 142 102)"/><circle cx="154" cy="86" r="9" fill="#7A3E9D"/><path d="M162 84l10 4-10 3z" fill="#222"/><path d="M128 112l-12 14 18-6z" fill="#008C45"/>` + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2; return star(145 + 34 * Math.cos(a), 99 + 34 * Math.sin(a), 6.5, '#006B3F'); }).join(''));
  F.do = svg('Dominican Republic', rect(0, 0, 300, 200, '#fff') + rect(0, 0, 132, 82, '#002D62') + rect(168, 0, 132, 82, '#CE1126') + rect(0, 118, 132, 82, '#CE1126') + rect(168, 118, 132, 82, '#002D62') + `<path d="M130 80h40v24q0 14-20 22q-20-8-20-22z" fill="#fff" stroke="#555" stroke-width="2"/>${rect(130, 80, 20, 14, '#002D62')}${rect(150, 80, 20, 14, '#CE1126')}${rect(130, 94, 20, 12, '#CE1126')}${rect(150, 94, 20, 12, '#002D62')}<path d="M144 90h12v22h-12z" fill="#fff"/><path d="M120 92q-4 24 30 40q34-16 30-40" fill="none" stroke="#009A44" stroke-width="4"/>`);
  F.sv = svg('El Salvador', H(['#0F47AF', '#fff', '#0F47AF']) + circ(150, 100, 28, '#fff', '#2e8b3a', 5) + poly('150,76 130,112 170,112', '#f0e68c').replace('fill="#f0e68c"', 'fill="#FFE47A" stroke="#7a5c00" stroke-width="2"') + `<path d="M133 108q8-14 17-6 9-8 17 6" fill="none" stroke="#c0392b" stroke-width="3"/>` + `<path d="M134 82h32" stroke="#7a5c00" stroke-width="2" opacity="0"/>`);
  F.gd = svg('Grenada', rect(0, 0, 300, 200, '#CE1126') + poly('30,30 270,30 150,100', '#FCD116') + poly('30,170 270,170 150,100', '#FCD116') + poly('30,30 30,170 150,100', '#007A5E') + poly('270,30 270,170 150,100', '#007A5E') + [90, 150, 210].map(x => star(x, 15, 10, '#FCD116') + star(x, 185, 10, '#FCD116')).join('') + circ(150, 100, 28, '#CE1126') + star(150, 100, 19, '#FCD116') + `<ellipse cx="62" cy="100" rx="11" ry="8" fill="#FCD116"/><path d="M52 100q10 8 20 0z" fill="#CE1126"/>`);
  F.gt = svg('Guatemala', V(['#4997D0', '#fff', '#4997D0']) + circ(150, 100, 34, 'none', '#3A913F', 5) + wreath(150, 100, 34, 22, 3.5, '#3A913F') + `<path d="M122 78L178 122M178 78L122 122" stroke="#8a6d00" stroke-width="5"/>` + `<ellipse cx="150" cy="96" rx="9" ry="16" fill="#2E9A5B"/><path d="M146 112q-4 20 4 24q8-4 4-24z" fill="#2E9A5B"/><rect x="132" y="104" width="36" height="8" rx="4" fill="#F2D16B" stroke="#8a6d00" stroke-width="1.5"/>`);
  F.ht = svg('Haiti', H(['#00209F', '#D21034']) + rect(94, 60, 112, 80, '#fff') + rect(94, 60, 112, 80, 'none') + `<path d="M150 74v40" stroke="#6b4b2a" stroke-width="5"/><g fill="#3A913F"><path d="M150 76q-20-4-32 10q16-4 32-4z"/><path d="M150 76q20-4 32 10q-16-4-32-4z"/><path d="M150 80q-14 10-22 26q14-14 22-20z"/><path d="M150 80q14 10 22 26q-14-14-22-20z"/></g><path d="M112 120h76" stroke="#555" stroke-width="6"/><path d="M116 124h68" stroke="#D21034" stroke-width="3"/><path d="M118 130l64-6" stroke="#00209F" stroke-width="3"/>`);
  F.hn = svg('Honduras', H(['#0073CF', '#fff', '#0073CF']) + [[150, 100], [122, 88], [178, 88], [122, 112], [178, 112]].map(([x, y]) => star(x, y, 11, '#0073CF')).join(''));
  F.jm = svg('Jamaica', rect(0, 0, 300, 200, '#000') + poly('0,0 300,0 150,100', '#009B3A') + poly('0,200 300,200 150,100', '#009B3A') + `<path d="M-20 -13L320 213M320 -13L-20 213" stroke="#FED100" stroke-width="32"/>`);
  F.mx = svg('Mexico', V(['#006847', '#fff', '#CE1126']) + `<path d="M118 130q10 24 32 24q22 0 32-24" fill="none" stroke="#3A913F" stroke-width="5"/><path d="M130 142q20 10 40 0" fill="none" stroke="#CE1126" stroke-width="4"/><ellipse cx="150" cy="108" rx="20" ry="13" fill="#8B5E3C"/><path d="M135 100l-18-14 6 20z" fill="#8B5E3C"/><circle cx="162" cy="84" r="9" fill="#8B5E3C"/><path d="M169 83l8 4-8 2z" fill="#E0B040"/><path d="M146 118h14l-3 12h-8z" fill="#3A913F"/><ellipse cx="150" cy="134" rx="12" ry="4" fill="#8B7B5A"/>`);
  F.ni = svg('Nicaragua', H(['#0067C6', '#fff', '#0067C6']) + circ(150, 100, 30, 'none', '#6b8a2a', 3) + poly('150,76 128,116 172,116', '#fff').replace('fill="#fff"', 'fill="#E8F0D8" stroke="#6b8a2a" stroke-width="3"') + `<path d="M134 108q16-20 32 0M138 112q12-14 24 0" fill="none" stroke="#CE1126" stroke-width="3"/><path d="M142 112q8-8 16 0" fill="none" stroke="#FCD116" stroke-width="3"/><circle cx="150" cy="92" r="4" fill="#FCD116"/>`);
  F.pa = svg('Panama', rect(0, 0, 300, 200, '#fff') + rect(150, 0, 150, 100, '#D21034') + rect(0, 100, 150, 100, '#005293') + star(75, 50, 30, '#005293') + star(225, 150, 30, '#D21034'));
  F.kn = svg('Saint Kitts and Nevis', rect(0, 0, 300, 200, '#009E49') + poly('300,0 300,200 0,200', '#CE1126') + `<path d="M-30 220L330 -20" stroke="#FCD116" stroke-width="86"/><path d="M-30 220L330 -20" stroke="#000" stroke-width="60"/>` + star(105, 130, 17, '#fff') + star(195, 70, 17, '#fff'));
  F.lc = svg('Saint Lucia', rect(0, 0, 300, 200, '#66CCFF') + poly('150,28 84,172 216,172', '#fff') + poly('150,44 96,164 204,164', '#000') + poly('150,94 112,164 188,164', '#FCD116'));
  F.vc = svg('Saint Vincent and the Grenadines', rect(0, 0, 75, 200, '#0072C6') + rect(75, 0, 150, 200, '#FCD116') + rect(225, 0, 75, 200, '#009E60') + [[122, 68], [178, 68], [150, 114]].map(([x, y]) => poly(`${x},${y - 28} ${x + 17},${y} ${x},${y + 28} ${x - 17},${y}`, '#009E60')).join(''));
  F.tt = svg('Trinidad and Tobago', rect(0, 0, 300, 200, '#CE1126') + `<path d="M-30 -20L330 220" stroke="#fff" stroke-width="82"/><path d="M-30 -20L330 220" stroke="#000" stroke-width="56"/>`);
  F.us = (() => {
    let b = [...Array(13).keys()].map(i => rect(0, i * 200 / 13, 300, 200 / 13 + .4, i % 2 ? '#fff' : '#B22234')).join('') + rect(0, 0, 120, 7 * 200 / 13, '#3C3B6E');
    for (let r = 0; r < 9; r++) { const n = r % 2 ? 5 : 6; for (let c = 0; c < n; c++) b += star((r % 2 ? 20 : 10) + c * 20, 10.5 + r * 10.2, 4.6, '#fff'); }
    return svg('United States', b);
  })();
  return F;
})();
