/* Oceania: content. One record per country (alphabetical): the 14 United Nations member states of Oceania. To add or remove a country,
   change this list and the matching entry in _dev/world-map/regions/oceania.json (its iso table or its dots list), then run
   node _dev/world-map/geo_region.mjs oceania. Capitals and languages were written for this module and are checked by a separate pass
   (see ARCHITECTURE.md). langs: the main official or national languages, the first is the most spoken. note: a short extra fact shown in the guide
   and on flashcards. FLAGS: simplified drawings (coats of arms are simplified, so they are recognizable but not exact). */
const COUNTRIES = [
  { id: 'au', name: 'Australia', capital: 'Canberra', langs: ['English'], note: 'Australia is both a country and a continent. Canberra is the capital, not Sydney.' },
  { id: 'fj', name: 'Fiji', capital: 'Suva', langs: ['English', 'Fijian', 'Fiji Hindi'], note: 'An island country of more than 300 islands in the South Pacific Ocean.' },
  { id: 'ki', name: 'Kiribati', capital: 'Tarawa', langs: ['English', 'Gilbertese'], note: 'Said "KIR-ih-bas". An island country of low coral atolls. The government is on South Tarawa.' },
  { id: 'mh', name: 'Marshall Islands', capital: 'Majuro', langs: ['Marshallese', 'English'], note: 'An island country of coral atolls in the North Pacific Ocean.' },
  { id: 'fm', name: 'Micronesia', capital: 'Palikir', langs: ['English'], note: 'The full name is the Federated States of Micronesia. Many local languages are spoken, such as Chuukese and Pohnpeian.' },
  { id: 'nr', name: 'Nauru', capital: 'Yaren', langs: ['Nauruan', 'English'], note: 'One of the smallest countries in the world. It has no official capital, and Yaren is where the government offices are.' },
  { id: 'nz', name: 'New Zealand', capital: 'Wellington', langs: ['English', 'Maori', 'New Zealand Sign Language'], note: 'Its Maori name is Aotearoa.' },
  { id: 'pw', name: 'Palau', capital: 'Ngerulmud', langs: ['Palauan', 'English'], note: 'The capital moved from Koror to Ngerulmud in 2006. Koror is still the largest city.' },
  { id: 'pg', name: 'Papua New Guinea', capital: 'Port Moresby', langs: ['English', 'Tok Pisin', 'Hiri Motu'], note: 'It shares the island of New Guinea with Indonesia. Over 800 languages are spoken here.' },
  { id: 'ws', name: 'Samoa', capital: 'Apia', langs: ['Samoan', 'English'] },
  { id: 'sb', name: 'Solomon Islands', capital: 'Honiara', langs: ['English'], note: 'English is official, but most people speak Solomon Islands Pijin and local languages.' },
  { id: 'to', name: 'Tonga', capital: 'Nukualofa', langs: ['Tongan', 'English'], note: 'A kingdom of about 170 islands. Its capital is spelled Nukuʻalofa in Tongan.' },
  { id: 'tv', name: 'Tuvalu', capital: 'Funafuti', langs: ['Tuvaluan', 'English'], note: 'One of the smallest and least visited countries in the world.' },
  { id: 'vu', name: 'Vanuatu', capital: 'Port Vila', langs: ['Bislama', 'English', 'French'] }
];

/* other spellings accepted when typing: name and capital by country id, language by language name */
const ALSO = {
  name: { fm: ['Federated States of Micronesia', 'FSM'], pg: ['PNG'], nz: ['Aotearoa'], mh: ['Marshalls', 'The Marshall Islands', 'Republic of the Marshall Islands'], sb: ['Solomons', 'The Solomon Islands'], ws: ['Western Samoa'], au: ['Commonwealth of Australia'] },
  capital: { to: ["Nuku'alofa", 'Nukualofa', 'Nukuʻalofa', 'Nuku alofa'], pw: ['Melekeok'], ki: ['South Tarawa', 'Bairiki', 'Tarawa Atoll'], nr: ['Yaren District'], mh: ['Delap'], vu: ['Vila'], tv: ['Fongafale', 'Funafuti Atoll'] },
  lang: { Gilbertese: ['I-Kiribati', 'Kiribati', 'Ikiribati'], 'Fiji Hindi': ['Fijian Hindi', 'Hindi', 'Fiji Hindustani', 'Hindustani'], Fijian: ['Bauan'], 'Tok Pisin': ['Pidgin', 'Neo-Melanesian'], 'Hiri Motu': ['Police Motu', 'Motu'], Maori: ['Te Reo Maori', 'Te Reo', 'Maori language'], 'New Zealand Sign Language': ['NZSL', 'NZ Sign Language'], Marshallese: ['Kajin Majel'], Nauruan: ['Dorerin Naoero', 'Nauru'], Palauan: ['Belauan'], Tongan: ['Lea Faka-Tonga'], Samoan: ['Gagana Samoa'], Tuvaluan: ['Tuvalu'], Bislama: ['Bichelamar'] }
};

/* ---- flags, drawn from simple pieces ---- */
const FLAGS = (() => {
  const svg = (name, body, w = 300, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flag of ${name}">${body}</svg>`;
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const starN = (cx, cy, r, n, f, k = .4, rot = -Math.PI / 2, s = '') => { const p = []; for (let i = 0; i < 2 * n; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r * k : r; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return `<polygon fill="${f}"${s ? ' ' + s : ''} points="${pts(p)}"/>`; };
  const star5 = (cx, cy, r, f, s = '') => starN(cx, cy, r, 5, f, .4, -Math.PI / 2, s);
  /* the cross of St George/St Andrew/St Patrick pattern, drawn in a 300x200 box and shrunk into a corner with a nested svg */
  const jack = (w, h) => `<svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 300 200" preserveAspectRatio="none">` + rect(0, 0, 300, 200, '#012169') + `<path d="M0 0L300 200M300 0L0 200" stroke="#fff" stroke-width="40"/><path d="M0 0L300 200M300 0L0 200" stroke="#C8102E" stroke-width="14"/>` + rect(120, 0, 60, 200, '#fff') + rect(0, 70, 300, 60, '#fff') + rect(130, 0, 40, 200, '#C8102E') + rect(0, 80, 300, 40, '#C8102E') + '</svg>';
  const cross5 = (f, pos, r = 11, rs = 5.5, s = '') => pos.map((p, i) => star5(p[0], p[1], i === 4 ? rs : r, f, s)).join('');
  const F = {};
  F.au = svg('Australia', rect(0, 0, 300, 200, '#012169') + jack(150, 100) + starN(75, 150, 30, 7, '#fff', .5, -Math.PI / 2) + [[225, 28, 13], [190, 92, 13], [262, 78, 13], [225, 168, 13]].map(p => starN(p[0], p[1], p[2], 7, '#fff', .5)).join('') + star5(243, 112, 7, '#fff'));
  F.fj = svg('Fiji', rect(0, 0, 300, 200, '#68BFE5') + jack(150, 100) + `<path d="M190 55h70v50q0 36-35 50q-35-14-35-50z" fill="#fff" stroke="#8a6d00" stroke-width="3"/><path d="M190 55h70v26h-70z" fill="#CE1126"/><path d="M225 81v74" stroke="#CE1126" stroke-width="8"/><path d="M190 108h70" stroke="#CE1126" stroke-width="8"/><circle cx="207" cy="94" r="7" fill="#FFD100"/><circle cx="243" cy="94" r="7" fill="#FFD100"/><circle cx="207" cy="130" r="7" fill="#2E8B3E"/><circle cx="243" cy="130" r="7" fill="#FFD100"/>`);
  F.ki = svg('Kiribati', rect(0, 0, 300, 200, '#CE1126') + rect(0, 134, 300, 66, '#003F87') + [0, 1, 2].map(i => `<path d="M0 ${146 + i * 20}q18-10 37.5 0t37.5 0t37.5 0t37.5 0t37.5 0t37.5 0t37.5 0t37.5 0" fill="none" stroke="#fff" stroke-width="7"/>`).join('') + `<g fill="#FCD116"><path d="M95 134a55 55 0 0 1 110 0z"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = Math.PI + i * Math.PI / 8; return `<path d="M${150 + 62 * Math.cos(a) - 5 * Math.sin(a)} ${134 + 62 * Math.sin(a) + 5 * Math.cos(a)}L${150 + 88 * Math.cos(a)} ${134 + 88 * Math.sin(a)}L${150 + 62 * Math.cos(a) + 5 * Math.sin(a)} ${134 + 62 * Math.sin(a) - 5 * Math.cos(a)}z"/>`; }).join('') + `<path d="M150 38l-12 10-34-6 30 14-14 4 22 6 8 12 8-12 22-6-14-4 30-14-34 6z"/></g>`);
  F.mh = svg('Marshall Islands', rect(0, 0, 300, 200, '#003893') + `<polygon fill="#DD7500" points="0,200 300,0 300,62"/><polygon fill="#fff" points="0,200 300,62 300,124"/>` + starN(62, 58, 40, 24, '#fff', .45));
  F.fm = svg('Micronesia', rect(0, 0, 300, 200, '#75B2DD') + [[150, 42], [150, 158], [92, 100], [208, 100]].map(p => star5(p[0], p[1], 24, '#fff')).join(''));
  F.nr = svg('Nauru', rect(0, 0, 300, 200, '#002B7F') + rect(0, 94, 300, 12, '#FFC61E') + starN(72, 150, 30, 12, '#fff', .55));
  F.nz = svg('New Zealand', rect(0, 0, 300, 200, '#00247D') + jack(150, 100) + [[225, 36], [188, 92], [262, 82], [225, 170]].map(p => star5(p[0], p[1], 15, '#CC142B', 'stroke="#fff" stroke-width="3" stroke-linejoin="round"')).join(''));
  F.pw = svg('Palau', rect(0, 0, 300, 200, '#4AADD6') + `<circle cx="125" cy="100" r="62" fill="#FFDE00"/>`);
  F.pg = svg('Papua New Guinea', `<polygon fill="#CE1126" points="0,0 300,0 300,200"/><polygon fill="#000" points="0,0 300,200 0,200"/>` + `<path d="M205 52q18-26 52-18-14 4-20 14 14 0 26 10-22 2-34 14-6 22-30 34 4-18 0-26-8 2-14-2 10-6 20-8z" fill="#FCD116"/><path d="M196 94q-20 30-62 40" fill="none" stroke="#FCD116" stroke-width="5"/><circle cx="244" cy="40" r="3" fill="#000"/>` + [[75, 120, 11], [42, 154, 11], [108, 148, 11], [75, 184, 11], [93, 160, 6]].map(p => star5(p[0], p[1], p[2], '#fff')).join(''));
  F.ws = svg('Samoa', rect(0, 0, 300, 200, '#CE1126') + rect(0, 0, 150, 100, '#002B7F') + cross5('#fff', [[75, 20], [45, 52], [105, 40], [75, 80], [92, 58]], 11, 6));
  F.sb = svg('Solomon Islands', `<polygon fill="#0051BA" points="0,0 300,0 0,200"/><polygon fill="#215B33" points="300,0 300,200 0,200"/><path d="M0 200L300 0" stroke="#FCD116" stroke-width="18"/>` + [[48, 30], [104, 30], [76, 62], [48, 94], [104, 94]].map(p => star5(p[0], p[1], 15, '#fff')).join(''));
  F.to = svg('Tonga', rect(0, 0, 300, 200, '#C10000') + rect(0, 0, 130, 100, '#fff') + rect(55, 18, 20, 64, '#C10000') + rect(33, 40, 64, 20, '#C10000'));
  F.tv = svg('Tuvalu', rect(0, 0, 300, 200, '#5BA9D0') + jack(150, 100) + [[238, 26], [282, 58], [208, 66], [256, 96], [214, 120], [284, 132], [240, 148], [206, 172], [266, 174]].map(p => star5(p[0], p[1], 11, '#FFD100')).join(''));
  F.vu = svg('Vanuatu', rect(0, 0, 300, 100, '#D21034') + rect(0, 100, 300, 100, '#009543') + `<path d="M0 0L125 100L0 200M125 100H300" fill="none" stroke="#000" stroke-width="62"/><path d="M0 0L125 100L0 200M125 100H300" fill="none" stroke="#FDCE12" stroke-width="34"/><polygon fill="#000" points="0,14 0,186 98,100"/>` + `<path d="M0 0L125 100L0 200M125 100H300" fill="none" stroke="#FDCE12" stroke-width="3" opacity="0"/><circle cx="26" cy="100" r="22" fill="none" stroke="#FDCE12" stroke-width="7"/><path d="M26 82v36M16 88q10 12 20 0" fill="none" stroke="#FDCE12" stroke-width="4"/>`);
  return F;
})();
