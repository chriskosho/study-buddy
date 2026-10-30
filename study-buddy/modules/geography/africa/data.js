/* Africa: content. One record per country (alphabetical): the 54 UN member states of Africa. To add or remove a country, change this list and the
   matching entry in _dev/world-map/regions/africa.json (its iso table or its dots), then run _dev/world-map/geo_region.mjs africa. Western Sahara
   is drawn grey (not a list entry). langs: the main official or national languages, the first is the most spoken. note: a short extra fact shown in the guide
   and on flashcards. FLAGS: simplified drawings (coats of arms are simplified, so they are recognizable but not exact). */
const COUNTRIES = [
  { id: 'dz', name: 'Algeria', capital: 'Algiers', langs: ['Arabic', 'Tamazight'], note: 'The largest country in Africa.' },
  { id: 'ao', name: 'Angola', capital: 'Luanda', langs: ['Portuguese'] },
  { id: 'bj', name: 'Benin', capital: 'Porto-Novo', langs: ['French'], note: 'Porto-Novo is the official capital. The government works in Cotonou, the largest city.' },
  { id: 'bw', name: 'Botswana', capital: 'Gaborone', langs: ['English', 'Setswana'] },
  { id: 'bf', name: 'Burkina Faso', capital: 'Ouagadougou', langs: ['French'] },
  { id: 'bi', name: 'Burundi', capital: 'Gitega', langs: ['Kirundi', 'French'], note: 'Gitega is the political capital. Bujumbura is the biggest city.' },
  { id: 'cm', name: 'Cameroon', capital: 'Yaounde', langs: ['French', 'English'] },
  { id: 'cv', name: 'Cape Verde', capital: 'Praia', langs: ['Portuguese'], note: 'An island country in the Atlantic Ocean, west of Senegal. Also called Cabo Verde.' },
  { id: 'cf', name: 'Central African Republic', capital: 'Bangui', langs: ['French', 'Sango'] },
  { id: 'td', name: 'Chad', capital: "N'Djamena", langs: ['French', 'Arabic'] },
  { id: 'km', name: 'Comoros', capital: 'Moroni', langs: ['Comorian', 'Arabic', 'French'], note: 'A small island country in the Indian Ocean, between Mozambique and Madagascar.' },
  { id: 'ci', name: "Cote d'Ivoire", capital: 'Yamoussoukro', langs: ['French'], note: 'Also called Ivory Coast. Yamoussoukro is the official capital. The government works in Abidjan, the largest city.' },
  { id: 'cd', name: 'Democratic Republic of the Congo', capital: 'Kinshasa', langs: ['French', 'Lingala', 'Swahili'], note: 'Not the same country as the Republic of the Congo next to it.' },
  { id: 'dj', name: 'Djibouti', capital: 'Djibouti', langs: ['French', 'Arabic'], note: 'A small country on the Horn of Africa. Its capital has the same name.' },
  { id: 'eg', name: 'Egypt', capital: 'Cairo', langs: ['Arabic'], note: 'Egypt is in Africa, and a small part of it, the Sinai Peninsula, is in Asia.' },
  { id: 'gq', name: 'Equatorial Guinea', capital: 'Ciudad de la Paz', langs: ['Spanish', 'French', 'Portuguese'], note: 'Ciudad de la Paz became the capital in January 2026. Malabo was the capital before and is still the biggest city.' },
  { id: 'er', name: 'Eritrea', capital: 'Asmara', langs: ['Tigrinya', 'Arabic', 'English'], note: 'Eritrea has no official language in its law. These three are used most in government.' },
  { id: 'sz', name: 'Eswatini', capital: 'Mbabane', langs: ['Swati', 'English'], note: 'Eswatini was called Swaziland until 2018. Mbabane is the working capital. Lobamba is the royal and law-making capital.' },
  { id: 'et', name: 'Ethiopia', capital: 'Addis Ababa', langs: ['Amharic', 'Oromo'], note: 'Ethiopia has no coast. It is one of the oldest countries in the world.' },
  { id: 'ga', name: 'Gabon', capital: 'Libreville', langs: ['French'] },
  { id: 'gm', name: 'Gambia', capital: 'Banjul', langs: ['English'], note: 'The smallest country on the African mainland. It lies along the Gambia River, inside Senegal.' },
  { id: 'gh', name: 'Ghana', capital: 'Accra', langs: ['English'] },
  { id: 'gn', name: 'Guinea', capital: 'Conakry', langs: ['French'] },
  { id: 'gw', name: 'Guinea-Bissau', capital: 'Bissau', langs: ['Portuguese'] },
  { id: 'ke', name: 'Kenya', capital: 'Nairobi', langs: ['Swahili', 'English'] },
  { id: 'ls', name: 'Lesotho', capital: 'Maseru', langs: ['Sesotho', 'English'], note: 'A small mountain country completely surrounded by South Africa.' },
  { id: 'lr', name: 'Liberia', capital: 'Monrovia', langs: ['English'] },
  { id: 'ly', name: 'Libya', capital: 'Tripoli', langs: ['Arabic'] },
  { id: 'mg', name: 'Madagascar', capital: 'Antananarivo', langs: ['Malagasy', 'French'], note: 'The biggest island country in Africa, in the Indian Ocean.' },
  { id: 'mw', name: 'Malawi', capital: 'Lilongwe', langs: ['English', 'Chichewa'] },
  { id: 'ml', name: 'Mali', capital: 'Bamako', langs: ['Bambara', 'French'], note: 'French is the working language. Bambara is the most widely spoken national language.' },
  { id: 'mr', name: 'Mauritania', capital: 'Nouakchott', langs: ['Arabic'] },
  { id: 'mu', name: 'Mauritius', capital: 'Port Louis', langs: ['English', 'French'], note: 'An island country in the Indian Ocean. Most people speak Mauritian Creole at home.' },
  { id: 'ma', name: 'Morocco', capital: 'Rabat', langs: ['Arabic', 'Amazigh'], note: 'Western Sahara, drawn in grey on this map, is a disputed area and is not on the list.' },
  { id: 'mz', name: 'Mozambique', capital: 'Maputo', langs: ['Portuguese'] },
  { id: 'na', name: 'Namibia', capital: 'Windhoek', langs: ['English'] },
  { id: 'ne', name: 'Niger', capital: 'Niamey', langs: ['Hausa', 'French'], note: 'Not the same country as Nigeria next to it. French is still widely used in government.' },
  { id: 'ng', name: 'Nigeria', capital: 'Abuja', langs: ['English'], note: 'Abuja is the capital. The biggest city is Lagos. Nigeria has more people than any other country in Africa.' },
  { id: 'cg', name: 'Republic of the Congo', capital: 'Brazzaville', langs: ['French'], note: 'Not the same country as the Democratic Republic of the Congo next to it.' },
  { id: 'rw', name: 'Rwanda', capital: 'Kigali', langs: ['Kinyarwanda', 'French', 'English'] },
  { id: 'st', name: 'Sao Tome and Principe', capital: 'Sao Tome', langs: ['Portuguese'], note: 'A tiny island country in the Gulf of Guinea, on the equator.' },
  { id: 'sn', name: 'Senegal', capital: 'Dakar', langs: ['French'] },
  { id: 'sc', name: 'Seychelles', capital: 'Victoria', langs: ['Seychellois Creole', 'English', 'French'], note: 'A group of islands in the Indian Ocean.' },
  { id: 'sl', name: 'Sierra Leone', capital: 'Freetown', langs: ['English'] },
  { id: 'so', name: 'Somalia', capital: 'Mogadishu', langs: ['Somali', 'Arabic'], note: 'The northern part, called Somaliland, governs itself, but most countries do not recognize it as a separate country.' },
  { id: 'za', name: 'South Africa', capital: 'Pretoria', langs: ['Zulu', 'Xhosa', 'Afrikaans', 'English'], note: 'South Africa has three capitals: Pretoria (government), Cape Town (law-making), and Bloemfontein (courts). It has 12 official languages. These are among the most spoken.' },
  { id: 'ss', name: 'South Sudan', capital: 'Juba', langs: ['English'], note: 'The newest country in Africa. It became independent in 2011.' },
  { id: 'sd', name: 'Sudan', capital: 'Khartoum', langs: ['Arabic', 'English'] },
  { id: 'tz', name: 'Tanzania', capital: 'Dodoma', langs: ['Swahili', 'English'], note: 'Dodoma is the capital. The biggest city is Dar es Salaam. Mount Kilimanjaro, the highest mountain in Africa, is here.' },
  { id: 'tg', name: 'Togo', capital: 'Lome', langs: ['French'] },
  { id: 'tn', name: 'Tunisia', capital: 'Tunis', langs: ['Arabic'] },
  { id: 'ug', name: 'Uganda', capital: 'Kampala', langs: ['English', 'Swahili'] },
  { id: 'zm', name: 'Zambia', capital: 'Lusaka', langs: ['English'] },
  { id: 'zw', name: 'Zimbabwe', capital: 'Harare', langs: ['English', 'Shona', 'Ndebele'], note: 'Zimbabwe has 16 official languages. These three are the most spoken.' }
];

/* other spellings accepted when typing: name and capital by country id, language by language name */
const ALSO = {
  name: { cv: ['Cabo Verde'], cg: ['Congo', 'Congo-Brazzaville', 'Congo Brazzaville', 'Congo Republic', 'Republic of Congo'], cd: ['DR Congo', 'DRC', 'D.R. Congo', 'Congo-Kinshasa', 'Congo Kinshasa', 'Democratic Republic of Congo', 'Congo Democratic Republic'], ci: ['Ivory Coast', 'Cote dIvoire', 'Côte d’Ivoire', "Côte d'Ivoire"], gm: ['The Gambia'], sz: ['Swaziland'], cf: ['CAR', 'Central African Rep'], gw: ['Guinea Bissau'], st: ['Sao Tome & Principe', 'São Tomé and Príncipe', 'Sao Tome', 'Sao Tome and Principe'], za: ['RSA'], tz: ['United Republic of Tanzania'] },
  capital: { dz: ['Alger', 'El Djazair'], bj: ['Porto-Novo', 'Porto Novo', 'Cotonou'], cm: ['Yaoundé'], td: ['Ndjamena', 'N Djamena', 'Fort-Lamy'], cg: ['Brazza'], ci: ['Yamoussoukro', 'Abidjan'], eg: ['Al Qahirah', 'El Cairo'], gq: ['Malabo', 'Ciudad de la Paz'], sz: ['Lobamba'], et: ['Addis Abeba', 'Addis'], mg: ['Tana', 'Antananarivo'], mu: ['Port-Louis'], ma: ['Er Rabat'], st: ['São Tomé', 'Sao Tome City'], so: ['Muqdisho', 'Mogadiscio'], za: ['Tshwane', 'Cape Town', 'Bloemfontein'], tg: ['Lomé'], ly: ['Tarabulus'], sd: ['Khartum'] },
  lang: { Bambara: ['Bamanankan'], Tamazight: ['Berber', 'Amazigh'], Amazigh: ['Berber', 'Tamazight'], Setswana: ['Tswana'], Kirundi: ['Rundi', 'Burundi'], Comorian: ['Shikomori', 'Comoran'], Swati: ['siSwati', 'Swazi'], Sesotho: ['Sotho', 'Southern Sotho'], Chichewa: ['Chewa', 'Nyanja'], Kinyarwanda: ['Rwanda'], 'Seychellois Creole': ['Creole', 'Seselwa', 'Seychelles Creole'], Zulu: ['isiZulu'], Xhosa: ['isiXhosa'], Ndebele: ['isiNdebele', 'Northern Ndebele'], Swahili: ['Kiswahili'], Malagasy: ['Madagascan'], Amharic: ['Amarinya'], Oromo: ['Afaan Oromo', 'Oromifa'], Tigrinya: ['Tigrigna'] }
};

/* ---- flags, drawn from simple pieces ---- */
const FLAGS = (() => {
  const svg = (name, body, w = 300, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" overflow="hidden" role="img" aria-label="Flag of ${name}">${body}</svg>`;
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const H = cs => cs.map((c, i) => rect(0, i * 200 / cs.length, 300, 200 / cs.length + .5, c)).join('');
  const V = cs => cs.map((c, i) => rect(i * 300 / cs.length, 0, 300 / cs.length + .5, 200, c)).join('');
  const star = (cx, cy, r, f, rot = 0) => { const p = []; for (let i = 0; i < 10; i++) { const a = (-90 + rot) * Math.PI / 180 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return `<polygon fill="${f}" points="${p.join(' ')}"/>`; };
  const circ = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
  const poly = (pts, f) => `<polygon fill="${f}" points="${pts}"/>`;
  const line = (x1, y1, x2, y2, s, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}"/>`;
  const pent = (cx, cy, r, s, w) => { const p = [0, 2, 4, 1, 3].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }); return `<polygon fill="none" stroke="${s}" stroke-width="${w}" stroke-linejoin="miter" points="${p.join(' ')}"/>`; };
  const rays = (cx, cy, r1, r2, n, s, w) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n; return line((cx + r1 * Math.cos(a)).toFixed(1), (cy + r1 * Math.sin(a)).toFixed(1), (cx + r2 * Math.cos(a)).toFixed(1), (cy + r2 * Math.sin(a)).toFixed(1), s, w); }).join('');
  const crescent = (cx, cy, r, dx, f, bg, rr = r * .82) => circ(cx, cy, r, f) + circ(cx + dx, cy, rr, bg);
  const stripes = (cs, hs) => { let y = 0; return cs.map((c, i) => { const s = rect(0, y, 300, hs[i] + .5, c); y += hs[i]; return s; }).join(''); };
  const F = {};
  F.dz = svg('Algeria', rect(0, 0, 150, 200, '#006233') + rect(150, 0, 150, 200, '#fff') + crescent(150, 100, 48, 11, '#D21034', '#fff', 40) + star(166, 100, 20, '#D21034', 90));
  F.ao = svg('Angola', rect(0, 0, 300, 100, '#CC092F') + rect(0, 100, 300, 100, '#000') + `<path d="M105 112a46 46 0 0 1 90 0h-16a30 30 0 0 0-58 0z" fill="#FFCB00"/>` + star(150, 108, 22, '#FFCB00') + line(172, 150, 210, 118, '#FFCB00', 7));
  F.bj = svg('Benin', rect(0, 0, 120, 200, '#008751') + rect(120, 0, 180, 100, '#FCD116') + rect(120, 100, 180, 100, '#E8112D'));
  F.bw = svg('Botswana', rect(0, 0, 300, 200, '#75AADB') + rect(0, 72, 300, 56, '#fff') + rect(0, 82, 300, 36, '#000'));
  F.bf = svg('Burkina Faso', H(['#EF2B2D', '#009E49']) + star(150, 100, 40, '#FCD116'));
  F.bi = svg('Burundi', rect(0, 0, 300, 200, '#fff') + poly('0,0 300,0 150,100', '#CE1126') + poly('0,200 300,200 150,100', '#CE1126') + poly('0,0 150,100 0,200', '#1EB53A') + poly('300,0 150,100 300,200', '#1EB53A') + line(0, 0, 300, 200, '#fff', 14) + line(300, 0, 0, 200, '#fff', 14) + circ(150, 100, 50, '#fff') + star(150, 78, 13, '#CE1126') + star(131, 113, 13, '#CE1126') + star(169, 113, 13, '#CE1126'));
  F.cv = svg('Cape Verde', rect(0, 0, 300, 200, '#003893') + rect(0, 108, 300, 36, '#fff') + rect(0, 118, 300, 16, '#CF2027') + Array.from({ length: 10 }, (_, i) => { const a = i * 36 * Math.PI / 180; return star(105 + 56 * Math.sin(a), 126 - 56 * Math.cos(a), 10, '#F7D116'); }).join(''));
  F.cm = svg('Cameroon', V(['#007A5E', '#CE1126', '#FCD116']) + star(150, 100, 36, '#FCD116'));
  F.cf = svg('Central African Republic', H(['#003082', '#fff', '#289728', '#FFCE00']) + rect(120, 0, 60, 200, '#D21034') + star(40, 26, 20, '#FFCE00'));
  F.td = svg('Chad', V(['#002664', '#FECB00', '#C60C30']));
  F.km = svg('Comoros', H(['#FFC61E', '#fff', '#CE1126', '#3A75C4']) + poly('0,0 150,100 0,200', '#3D8E33') + crescent(48, 100, 34, 9, '#fff', '#3D8E33', 28) + [0, 1, 2, 3].map(i => star(74, 76 + i * 16, 6, '#fff', 90)).join(''));
  F.cd = svg('Democratic Republic of the Congo', rect(0, 0, 300, 200, '#007FFF') + line(-30, 220, 330, -20, '#F7D618', 62) + line(-30, 220, 330, -20, '#CE1021', 42) + star(48, 46, 30, '#F7D618'));
  F.cg = svg('Republic of the Congo', rect(0, 0, 300, 200, '#009543') + poly('200,0 300,0 100,200 0,200', '#FBDE4A') + poly('300,0 300,200 100,200', '#DC241F'));
  F.ci = svg("Cote d'Ivoire", V(['#F77F00', '#fff', '#009E60']));
  F.dj = svg('Djibouti', H(['#6AB2E7', '#12AD2B']) + poly('0,0 150,100 0,200', '#fff') + star(50, 100, 24, '#D7141A'));
  F.eg = svg('Egypt', H(['#CE1126', '#fff', '#000']) + `<g fill="#C09300"><ellipse cx="150" cy="86" rx="9" ry="9"/><path d="M142 94h16l8 20q4 22-16 28-20-6-16-28z"/><path d="M138 100q-30-10-42 12 18-2 30 4zM162 100q30-10 42 12-18-2-30 4z"/><path d="M128 120h44v6h-44z"/></g>`);
  F.gq = svg('Equatorial Guinea', H(['#3E9A00', '#fff', '#E32118']) + poly('0,0 90,100 0,200', '#0073CE') + `<path d="M138 78h24v28q0 12-12 20-12-8-12-20z" fill="#9aa0a6" stroke="#555" stroke-width="2"/>` + `<path d="M150 86v26M140 96l10-8 10 8" stroke="#2e7d32" stroke-width="3" fill="none"/>`);
  F.er = svg('Eritrea', poly('0,0 300,0 300,100', '#12AD2B') + poly('0,200 300,200 300,100', '#4189DD') + poly('0,0 300,100 0,200', '#EA0437') + `<g fill="none" stroke="#FFC726" stroke-width="5"><ellipse cx="62" cy="100" rx="30" ry="38"/></g><path d="M62 78v44M62 90q14-4 16 4M62 100q14-4 16 4M62 90q-14-4-16 4M62 100q-14-4-16 4" stroke="#FFC726" stroke-width="4" fill="none"/>`);
  F.sz = svg('Eswatini', stripes(['#3E5EB9', '#FFD900', '#B10C0C', '#FFD900', '#3E5EB9'], [40, 10, 100, 10, 40]) + `<path d="M85 100q0-30 65-30t65 30q0 30-65 30t-65-30z" fill="#fff"/><path d="M85 100q0-30 65-30v60q-65 0-65-30z" fill="#000"/><path d="M70 100h160" stroke="#FFD900" stroke-width="5"/>`);
  F.et = svg('Ethiopia', H(['#078930', '#FCDD09', '#DA121A']) + circ(150, 100, 42, '#0F47AF') + pent(150, 102, 30, '#FCDD09', 4));
  F.ga = svg('Gabon', H(['#009E60', '#FCD116', '#3A75C4']));
  F.gm = svg('Gambia', stripes(['#CE1126', '#fff', '#0C1C8C', '#fff', '#3A7728'], [66, 11, 45, 11, 67]));
  F.gh = svg('Ghana', H(['#CE1126', '#FCD116', '#006B3F']) + star(150, 104, 36, '#000'));
  F.gn = svg('Guinea', V(['#CE1126', '#FCD116', '#009460']));
  F.gw = svg('Guinea-Bissau', rect(0, 0, 100, 200, '#CE1126') + rect(100, 0, 200, 100, '#FCD116') + rect(100, 100, 200, 100, '#009E49') + star(50, 100, 32, '#000'));
  F.ke = svg('Kenya', stripes(['#000', '#fff', '#BB0000', '#fff', '#006600'], [58, 10, 64, 10, 58]) + `<g stroke="#fff" stroke-width="5"><path d="M118 52L182 148M182 52L118 148"/></g><ellipse cx="150" cy="100" rx="28" ry="52" fill="#BB0000" stroke="#000" stroke-width="4"/><ellipse cx="150" cy="100" rx="9" ry="22" fill="#fff"/><ellipse cx="150" cy="100" rx="4" ry="22" fill="#000"/>`);
  F.ls = svg('Lesotho', stripes(['#00209F', '#fff', '#009543'], [60, 80, 60]) + `<path d="M150 70l32 50h-64z" fill="#000"/><circle cx="150" cy="70" r="6" fill="#000"/><ellipse cx="150" cy="122" rx="38" ry="6" fill="#000"/>`);
  F.lr = svg('Liberia', Array.from({ length: 11 }, (_, i) => rect(0, i * 200 / 11, 300, 200 / 11 + .5, i % 2 ? '#fff' : '#BF0A30')).join('') + rect(0, 0, 91, 91, '#002868') + star(45, 47, 28, '#fff'));
  F.ly = svg('Libya', stripes(['#E70013', '#000', '#239E46'], [50, 100, 50]) + crescent(140, 100, 32, 9, '#fff', '#000', 26) + star(166, 100, 14, '#fff', 90));
  F.mg = svg('Madagascar', rect(0, 0, 100, 200, '#fff') + rect(100, 0, 200, 100, '#FC3D32') + rect(100, 100, 200, 100, '#007E3A'));
  F.mw = svg('Malawi', H(['#000', '#CE1126', '#339E35']) + `<path d="M108 66a42 42 0 0 1 84 0z" fill="#CE1126"/>` + [0, 1, 2, 3, 4, 5, 6].map(k => { const a = Math.PI + (k + 0.5) * Math.PI / 7; return line((150 + 48 * Math.cos(a)).toFixed(1), (66 + 48 * Math.sin(a)).toFixed(1), (150 + 62 * Math.cos(a)).toFixed(1), (66 + 62 * Math.sin(a)).toFixed(1), '#CE1126', 5); }).join(''));
  F.ml = svg('Mali', V(['#14B53A', '#FCD116', '#CE1126']));
  F.mr = svg('Mauritania', rect(0, 0, 300, 200, '#00A95C') + rect(0, 0, 300, 28, '#D01C1F') + rect(0, 172, 300, 28, '#D01C1F') + crescent(150, 100, 46, 0, '#FFC400', '#00A95C', 46).replace(/cy="100" r="46" fill="#00A95C"/, 'cy="80" r="46" fill="#00A95C"') + star(150, 80, 15, '#FFC400'));
  F.mu = svg('Mauritius', H(['#EA2839', '#1A206D', '#FFD500', '#00A551']));
  F.ma = svg('Morocco', rect(0, 0, 300, 200, '#C1272D') + pent(150, 104, 48, '#006233', 7));
  F.mz = svg('Mozambique', stripes(['#007168', '#fff', '#000', '#fff', '#FCE100'], [60, 8, 64, 8, 60]) + poly('0,0 130,100 0,200', '#CE1126') + star(46, 92, 30, '#FCE100') + `<rect x="30" y="120" width="34" height="14" fill="#fff" stroke="#000" stroke-width="2"/><path d="M28 148l40-20" stroke="#000" stroke-width="5"/>`);
  F.na = svg('Namibia', poly('0,0 300,0 0,200', '#003580') + poly('300,200 300,0 0,200', '#009543') + line(-30, 220, 330, -20, '#fff', 58) + line(-30, 220, 330, -20, '#D21034', 40) + circ(50, 48, 15, '#FFCE00') + rays(50, 48, 19, 31, 12, '#FFCE00', 5));
  F.ne = svg('Niger', H(['#E05206', '#fff', '#0DB02B']) + circ(150, 100, 28, '#E05206'));
  F.ng = svg('Nigeria', V(['#008751', '#fff', '#008751']));
  F.rw = svg('Rwanda', stripes(['#00A1DE', '#FAD201', '#20603D'], [100, 50, 50]) + circ(238, 48, 17, '#FAD201') + rays(238, 48, 23, 35, 24, '#FAD201', 3));
  F.st = svg('Sao Tome and Principe', stripes(['#12AD2B', '#FFCE00', '#12AD2B'], [50, 100, 50]) + poly('0,0 110,100 0,200', '#D21034') + star(185, 100, 22, '#000') + star(245, 100, 22, '#000'));
  F.sn = svg('Senegal', V(['#00853F', '#FDEF42', '#E31B23']) + star(150, 102, 30, '#00853F'));
  F.sc = svg('Seychelles', poly('0,200 0,0 100,0', '#003F87') + poly('0,200 100,0 200,0', '#FCD856') + poly('0,200 200,0 300,0 300,67', '#D62828') + poly('0,200 300,67 300,133', '#fff') + poly('0,200 300,133 300,200', '#007A3D'));
  F.sl = svg('Sierra Leone', H(['#1EB53A', '#fff', '#0072C6']));
  F.so = svg('Somalia', rect(0, 0, 300, 200, '#4189DD') + star(150, 106, 56, '#fff'));
  F.za = svg('South Africa', rect(0, 0, 300, 100, '#DE3831') + rect(0, 100, 300, 100, '#002395') + `<g fill="none"><path d="M-10 -10L105 100 -10 210M105 100H310" stroke="#fff" stroke-width="64" stroke-linejoin="miter"/><path d="M-10 -10L105 100 -10 210M105 100H310" stroke="#007A4D" stroke-width="40" stroke-linejoin="miter"/></g>` + poly('0,14 0,186 88,100', '#FFB612') + poly('0,36 0,164 66,100', '#000'));
  F.ss = svg('South Sudan', stripes(['#000', '#fff', '#DA121A', '#fff', '#078930'], [58, 10, 64, 10, 58]) + poly('0,0 140,100 0,200', '#0F47AF') + star(42, 100, 28, '#FCDD09', 90));
  F.sd = svg('Sudan', H(['#D21034', '#fff', '#000']) + poly('0,0 100,100 0,200', '#007229'));
  F.tz = svg('Tanzania', poly('0,0 300,0 0,200', '#1EB53A') + poly('300,200 300,0 0,200', '#00A3DD') + line(-30, 220, 330, -20, '#FCD116', 64) + line(-30, 220, 330, -20, '#000', 44));
  F.tg = svg('Togo', [0, 1, 2, 3, 4].map(i => rect(0, i * 40, 300, 40.5, i % 2 ? '#FFCE00' : '#006A4E')).join('') + rect(0, 0, 120, 120, '#D21034') + star(60, 62, 38, '#fff'));
  F.tn = svg('Tunisia', rect(0, 0, 300, 200, '#E70013') + circ(150, 100, 56, '#fff') + crescent(142, 100, 38, 9, '#E70013', '#fff', 31) + star(158, 100, 19, '#E70013', 90));
  F.ug = svg('Uganda', H(['#000', '#FCDC04', '#D90000', '#000', '#FCDC04', '#D90000']) + circ(150, 100, 40, '#fff') + `<g fill="#444"><ellipse cx="148" cy="108" rx="16" ry="10"/><path d="M158 104q14-20 6-34l6-3q12 20-4 40z"/><circle cx="168" cy="66" r="5"/></g><path d="M133 118l-6 12M148 118v14" stroke="#444" stroke-width="3"/>`);
  F.zm = svg('Zambia', rect(0, 0, 300, 200, '#198A00') + rect(228, 100, 24, 100, '#DE2010') + rect(252, 100, 24, 100, '#000') + rect(276, 100, 24, 100, '#EF7D00') + `<g fill="#EF7D00"><path d="M236 62q16-22 40-10l-14 6 12 4q-20 12-38 0z"/><circle cx="262" cy="46" r="6"/><path d="M262 60l-8 18h16z"/></g>`);
  F.zw = svg('Zimbabwe', stripes(['#006400', '#FFD200', '#D40000', '#000', '#D40000', '#FFD200', '#006400'], [200 / 7, 200 / 7, 200 / 7, 200 / 7, 200 / 7, 200 / 7, 200 / 7]) + poly('0,0 130,100 0,200', '#000') + poly('0,12 112,100 0,188', '#fff') + star(40, 100, 28, '#D40000') + `<ellipse cx="42" cy="108" rx="9" ry="6" fill="#FFD200"/>`);
  return F;
})();
