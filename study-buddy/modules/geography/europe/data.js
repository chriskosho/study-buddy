/* Europe: content. One record per country (alphabetical). To add or remove a country, change this list and the matching entry in
   _dev/eu-map/geo_eu.mjs (its ISO table or its DOTS list), then run that script. Capitals and languages were written for this module
   and are checked by a separate pass (see ARCHITECTURE.md). langs: the main official languages, the first is the most spoken.
   note: a short extra fact shown in the guide and on flashcards. FLAGS: simplified drawings (coats of arms are simplified, so they are
   recognizable but not exact). */
const COUNTRIES = [
  { id: 'al', name: 'Albania', capital: 'Tirana', langs: ['Albanian'] },
  { id: 'ad', name: 'Andorra', capital: 'Andorra la Vella', langs: ['Catalan'], note: 'A tiny country in the Pyrenees mountains, between France and Spain.' },
  { id: 'at', name: 'Austria', capital: 'Vienna', langs: ['German'] },
  { id: 'by', name: 'Belarus', capital: 'Minsk', langs: ['Belarusian', 'Russian'] },
  { id: 'be', name: 'Belgium', capital: 'Brussels', langs: ['Dutch', 'French', 'German'] },
  { id: 'ba', name: 'Bosnia and Herzegovina', capital: 'Sarajevo', langs: ['Bosnian', 'Croatian', 'Serbian'] },
  { id: 'bg', name: 'Bulgaria', capital: 'Sofia', langs: ['Bulgarian'] },
  { id: 'hr', name: 'Croatia', capital: 'Zagreb', langs: ['Croatian'] },
  { id: 'cy', name: 'Cyprus', capital: 'Nicosia', langs: ['Greek', 'Turkish'], note: 'An island country in the Mediterranean Sea.' },
  { id: 'cz', name: 'Czechia', capital: 'Prague', langs: ['Czech'], note: 'Also called the Czech Republic.' },
  { id: 'dk', name: 'Denmark', capital: 'Copenhagen', langs: ['Danish'] },
  { id: 'ee', name: 'Estonia', capital: 'Tallinn', langs: ['Estonian'] },
  { id: 'fi', name: 'Finland', capital: 'Helsinki', langs: ['Finnish', 'Swedish'] },
  { id: 'fr', name: 'France', capital: 'Paris', langs: ['French'] },
  { id: 'de', name: 'Germany', capital: 'Berlin', langs: ['German'] },
  { id: 'gr', name: 'Greece', capital: 'Athens', langs: ['Greek'] },
  { id: 'hu', name: 'Hungary', capital: 'Budapest', langs: ['Hungarian'] },
  { id: 'is', name: 'Iceland', capital: 'Reykjavik', langs: ['Icelandic'], note: 'An island country in the North Atlantic Ocean.' },
  { id: 'ie', name: 'Ireland', capital: 'Dublin', langs: ['Irish', 'English'], note: 'Most people speak English every day. Irish is the first official language.' },
  { id: 'it', name: 'Italy', capital: 'Rome', langs: ['Italian'] },
  { id: 'xk', name: 'Kosovo', capital: 'Pristina', langs: ['Albanian', 'Serbian'], note: 'Kosovo declared its independence in 2008. Not every country recognizes it.' },
  { id: 'lv', name: 'Latvia', capital: 'Riga', langs: ['Latvian'] },
  { id: 'li', name: 'Liechtenstein', capital: 'Vaduz', langs: ['German'], note: 'A tiny country between Switzerland and Austria.' },
  { id: 'lt', name: 'Lithuania', capital: 'Vilnius', langs: ['Lithuanian'] },
  { id: 'lu', name: 'Luxembourg', capital: 'Luxembourg City', langs: ['Luxembourgish', 'French', 'German'] },
  { id: 'mt', name: 'Malta', capital: 'Valletta', langs: ['Maltese', 'English'], note: 'An island country south of Italy.' },
  { id: 'md', name: 'Moldova', capital: 'Chisinau', langs: ['Romanian'] },
  { id: 'mc', name: 'Monaco', capital: 'Monaco', langs: ['French'], note: 'A tiny country on the coast of France. Its capital has the same name.' },
  { id: 'me', name: 'Montenegro', capital: 'Podgorica', langs: ['Montenegrin'] },
  { id: 'nl', name: 'Netherlands', capital: 'Amsterdam', langs: ['Dutch'], note: 'Amsterdam is the capital, but the government meets in The Hague.' },
  { id: 'mk', name: 'North Macedonia', capital: 'Skopje', langs: ['Macedonian'] },
  { id: 'no', name: 'Norway', capital: 'Oslo', langs: ['Norwegian'] },
  { id: 'pl', name: 'Poland', capital: 'Warsaw', langs: ['Polish'] },
  { id: 'pt', name: 'Portugal', capital: 'Lisbon', langs: ['Portuguese'] },
  { id: 'ro', name: 'Romania', capital: 'Bucharest', langs: ['Romanian'] },
  { id: 'ru', name: 'Russia', capital: 'Moscow', langs: ['Russian'], note: 'Russia is the biggest country in the world. It stretches across Europe and Asia. Only the western part is on this map.' },
  { id: 'sm', name: 'San Marino', capital: 'San Marino', langs: ['Italian'], note: 'A tiny country inside Italy. Its capital has the same name.' },
  { id: 'rs', name: 'Serbia', capital: 'Belgrade', langs: ['Serbian'] },
  { id: 'sk', name: 'Slovakia', capital: 'Bratislava', langs: ['Slovak'] },
  { id: 'si', name: 'Slovenia', capital: 'Ljubljana', langs: ['Slovene'] },
  { id: 'es', name: 'Spain', capital: 'Madrid', langs: ['Spanish'] },
  { id: 'se', name: 'Sweden', capital: 'Stockholm', langs: ['Swedish'] },
  { id: 'ch', name: 'Switzerland', capital: 'Bern', langs: ['German', 'French', 'Italian', 'Romansh'], note: 'Bern is called the federal city. Switzerland has no official capital in its law.' },
  { id: 'ua', name: 'Ukraine', capital: 'Kyiv', langs: ['Ukrainian'] },
  { id: 'gb', name: 'United Kingdom', capital: 'London', langs: ['English'], note: 'England, Scotland, Wales, and Northern Ireland together.' },
  { id: 'va', name: 'Vatican City', capital: 'Vatican City', langs: ['Italian', 'Latin'], note: 'The smallest country in the world, inside the city of Rome. Its capital has the same name.' }
];

/* ---- flags, drawn from simple pieces ---- */
const FLAGS = (() => {
  const svg = (name, body, w = 300, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flag of ${name}">${body}</svg>`;
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const H = cs => cs.map((c, i) => rect(0, i * 200 / cs.length, 300, 200 / cs.length + .5, c)).join('');
  const V = cs => cs.map((c, i) => rect(i * 300 / cs.length, 0, 300 / cs.length + .5, 200, c)).join('');
  const star = (cx, cy, r, f) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return `<polygon fill="${f}" points="${p.join(' ')}"/>`; };
  const shield = (cx, cy, w, f, s = '#222') => `<path d="M${cx - w / 2} ${cy - w * .6}h${w}v${w * .7}q0 ${w * .5} ${-w / 2} ${w * .75}q${-w / 2} ${-w * .25} ${-w / 2} ${-w * .75}z" fill="${f}" stroke="${s}" stroke-width="2"/>`;
  const nordic = (name, bg, cross, edge) => svg(name, rect(0, 0, 300, 200, bg) + (edge ? rect(80, 0, 52, 200, edge) + rect(0, 74, 300, 52, edge) : '') + rect(90, 0, 32, 200, cross) + rect(0, 84, 300, 32, cross));
  const F = {};
  F.al = svg('Albania', rect(0, 0, 300, 200, '#E41E20') + `<g fill="#000"><ellipse cx="150" cy="115" rx="22" ry="38"/><circle cx="118" cy="62" r="13"/><circle cx="182" cy="62" r="13"/><path d="M150 100L70 55 82 100 62 120 100 125 90 150 150 135 210 150 200 125 238 120 218 100 230 55z"/></g>`);
  F.ad = svg('Andorra', V(['#10069F', '#FEDD00', '#D50032']) + shield(150, 100, 56, '#FEDD00', '#8a6d00') + rect(135, 84, 14, 40, '#D50032') + rect(151, 84, 14, 40, '#D50032'));
  F.at = svg('Austria', H(['#ED2939', '#fff', '#ED2939']));
  F.by = svg('Belarus', rect(0, 0, 300, 133, '#C8313E') + rect(0, 133, 300, 67, '#4AA657') + rect(0, 0, 40, 200, '#fff') + [0, 1, 2, 3, 4].map(i => `<path d="M20 ${12 + i * 38}l14 14-14 14-14-14z" fill="#C8313E"/>`).join(''));
  F.be = svg('Belgium', V(['#000', '#FAE042', '#ED2939']));
  F.ba = svg('Bosnia and Herzegovina', rect(0, 0, 300, 200, '#002F6C') + `<polygon fill="#FECB00" points="82,0 250,0 250,200"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => star(70 + i * 24, 12 + i * 30, 12, '#fff')).join(''));
  F.bg = svg('Bulgaria', H(['#fff', '#00966E', '#D62612']));
  F.hr = svg('Croatia', H(['#FF0000', '#fff', '#171796']) + shield(150, 100, 60, '#fff', '#222') + [0, 1, 2, 3, 4].flatMap(r => [0, 1, 2, 3, 4].map(c => (r + c) % 2 ? '' : `<rect x="${120 + c * 12}" y="${70 + r * 12}" width="12" height="12" fill="#FF0000"/>`)).join('') + `<path d="M122 66l6-10 6 6 6-8 6 8 6-6 6 10z" fill="#FFD700" stroke="#222" stroke-width="1"/>`);
  F.cy = svg('Cyprus', rect(0, 0, 300, 200, '#fff') + `<path d="M62 100q30-26 66-22 32-14 70 4 20-2 40 12-24 8-46 6-26 12-52 6-26 10-54-4z" fill="#D57800"/><path d="M110 144q40 24 80 0M104 150q46 30 92 0" fill="none" stroke="#4E5B31" stroke-width="7" stroke-linecap="round"/>`);
  F.cz = svg('Czechia', rect(0, 0, 300, 100, '#fff') + rect(0, 100, 300, 100, '#D7141A') + `<polygon fill="#11457E" points="0,0 150,100 0,200"/>`);
  F.dk = nordic('Denmark', '#C8102E', '#fff');
  F.ee = svg('Estonia', H(['#0072CE', '#000', '#fff']));
  F.fi = nordic('Finland', '#fff', '#003580');
  F.fr = svg('France', V(['#0055A4', '#fff', '#EF4135']));
  F.de = svg('Germany', H(['#000', '#DD0000', '#FFCE00']));
  F.gr = svg('Greece', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => rect(0, i * 200 / 9, 300, 200 / 9 + .5, i % 2 ? '#fff' : '#0D5EAF')).join('') + rect(0, 0, 111, 111, '#0D5EAF') + rect(44, 0, 22, 111, '#fff') + rect(0, 44, 111, 22, '#fff'));
  F.hu = svg('Hungary', H(['#CE2939', '#fff', '#477050']));
  F.is = svg('Iceland', rect(0, 0, 300, 200, '#02529C') + rect(78, 0, 56, 200, '#fff') + rect(0, 72, 300, 56, '#fff') + rect(92, 0, 28, 200, '#DC1E35') + rect(0, 86, 300, 28, '#DC1E35'));
  F.ie = svg('Ireland', V(['#169B62', '#fff', '#FF883E']));
  F.it = svg('Italy', V(['#009246', '#fff', '#CE2B37']));
  F.xk = svg('Kosovo', rect(0, 0, 300, 200, '#244AA5') + `<path d="M112 118l8-16 14-4 8-14 18-4 14 8 16 4-4 18 8 10-14 12-20-2-12 8-18-4z" fill="#D0A650"/>` + [0, 1, 2, 3, 4, 5].map(i => star(78 + i * 29, 50 - Math.sin(i * Math.PI / 5) * 22 + 22, 9, '#fff')).join(''));
  F.lv = svg('Latvia', rect(0, 0, 300, 200, '#9E3039') + rect(0, 80, 300, 40, '#fff'));
  F.li = svg('Liechtenstein', H(['#002B7F', '#CE1126']) + `<path d="M48 48l8-16 8 8 8-10 8 10 8-8 8 16z" fill="#FFD83D" stroke="#8a6d00" stroke-width="1.5"/>`);
  F.lt = svg('Lithuania', H(['#FDB913', '#006A44', '#C1272D']));
  F.lu = svg('Luxembourg', H(['#EF3340', '#fff', '#00A3E0']));
  F.mt = svg('Malta', V(['#fff', '#CF142B']) + `<path d="M26 18h12v12h12v12H38v12H26V42H14V30h12z" fill="#A9A9A9" stroke="#666" stroke-width="2"/>`);
  F.md = svg('Moldova', V(['#0046AE', '#FFD200', '#CC092F']) + shield(150, 100, 46, '#CC092F', '#7a5c00') + rect(138, 90, 24, 8, '#FFD200'));
  F.mc = svg('Monaco', H(['#CE1126', '#fff']));
  F.me = svg('Montenegro', rect(0, 0, 300, 200, '#D4AF37') + rect(10, 10, 280, 180, '#C40308') + `<g fill="#D4AF37"><ellipse cx="150" cy="112" rx="20" ry="34"/><circle cx="130" cy="64" r="11"/><circle cx="170" cy="64" r="11"/><path d="M150 100L84 62 94 102 76 120 108 124 100 146 150 134 200 146 192 124 224 120 206 102 216 62z"/></g>`);
  F.nl = svg('Netherlands', H(['#AE1C28', '#fff', '#21468B']));
  F.mk = svg('North Macedonia', rect(0, 0, 300, 200, '#D20000') + `<g fill="#FFE600"><path d="M150 100L0 0h60zM150 100L120 0h60zM150 100L240 0h60zM150 100L300 0v50zM150 100L300 110v50zM150 100L300 200h-60zM150 100L180 200h-60zM150 100L60 200H0zM150 100L0 160v-50zM150 100L0 50V0z"/><circle cx="150" cy="100" r="50" stroke="#D20000" stroke-width="8"/></g>`);
  F.no = svg('Norway', rect(0, 0, 300, 200, '#BA0C2F') + rect(80, 0, 52, 200, '#fff') + rect(0, 74, 300, 52, '#fff') + rect(92, 0, 28, 200, '#00205B') + rect(0, 86, 300, 28, '#00205B'));
  F.pl = svg('Poland', H(['#fff', '#DC143C']));
  F.pt = svg('Portugal', rect(0, 0, 120, 200, '#006600') + rect(120, 0, 180, 200, '#FF0000') + `<circle cx="120" cy="100" r="42" fill="none" stroke="#FFE000" stroke-width="7"/>` + shield(120, 96, 46, '#FF0000', '#fff') + rect(108, 88, 24, 18, '#fff'));
  F.ro = svg('Romania', V(['#002B7F', '#FCD116', '#CE1126']));
  F.ru = svg('Russia', H(['#fff', '#0039A6', '#D52B1E']));
  F.sm = svg('San Marino', H(['#fff', '#5EB6E4']) + shield(150, 100, 50, '#5EB6E4', '#8a6d00') + `<path d="M132 84h36v8h-36z" fill="#fff"/>`);
  F.rs = svg('Serbia', H(['#C6363C', '#0C4076', '#fff']) + shield(100, 100, 56, '#C6363C', '#fff') + rect(92, 82, 16, 36, '#fff'));
  F.sk = svg('Slovakia', H(['#fff', '#0B4EA2', '#EE1C25']) + shield(105, 100, 66, '#EE1C25', '#fff') + rect(101, 74, 8, 52, '#fff') + rect(88, 84, 34, 7, '#fff') + rect(92, 96, 26, 7, '#fff'));
  F.si = svg('Slovenia', H(['#fff', '#005DA4', '#ED1C24']) + shield(75, 68, 44, '#005DA4', '#ED1C24') + `<path d="M58 70l8-12 9 8 9-8 8 12z" fill="#fff"/>`);
  F.es = svg('Spain', rect(0, 0, 300, 200, '#AA151B') + rect(0, 50, 300, 100, '#F1BF00') + shield(100, 98, 40, '#AA151B', '#7a5c00'));
  F.se = svg('Sweden', rect(0, 0, 300, 200, '#006AA7') + rect(90, 0, 32, 200, '#FECC02') + rect(0, 84, 300, 32, '#FECC02'));
  F.ch = svg('Switzerland', rect(0, 0, 200, 200, '#D52B1E') + rect(82, 36, 36, 128, '#fff') + rect(36, 82, 128, 36, '#fff'), 200, 200);
  F.ua = svg('Ukraine', H(['#0057B7', '#FFD700']));
  F.gb = svg('United Kingdom', rect(0, 0, 300, 200, '#012169') + `<path d="M0 0L300 200M300 0L0 200" stroke="#fff" stroke-width="40"/><path d="M0 0L300 200M300 0L0 200" stroke="#C8102E" stroke-width="14"/>` + rect(120, 0, 60, 200, '#fff') + rect(0, 70, 300, 60, '#fff') + rect(130, 0, 40, 200, '#C8102E') + rect(0, 80, 300, 40, '#C8102E'));
  F.va = svg('Vatican City', rect(0, 0, 100, 200, '#FFE000') + rect(100, 0, 100, 200, '#fff') + `<g stroke="#999" stroke-width="7" fill="none"><path d="M120 80l40 70M160 80l-40 70"/></g><path d="M128 52q22-30 44 0z" fill="#E4B500" stroke="#8a6d00" stroke-width="2"/>`, 200, 200);
  return F;
})();
