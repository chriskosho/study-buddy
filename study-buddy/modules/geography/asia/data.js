/* Asia: content. One record per country (alphabetical). To add or remove a country, change this list and the matching entry in
   _dev/world-map/regions/asia.json (its iso table or its dots list), then run _dev/world-map/geo_region.mjs asia. Capitals and languages
   were written for this module and are checked by a separate pass (see ARCHITECTURE.md). langs: the main official or national languages, the first is the most spoken.
   note: a short extra fact shown in the guide and on flashcards. FLAGS: simplified drawings (coats of arms are simplified, so they are
   recognizable but not exact). Scope: the UN member states in Asia, with Russia, Turkey, Kazakhstan, Georgia, Armenia, and Azerbaijan counted here
   (they also reach into Europe), plus Taiwan and Palestine. Cyprus is in the Europe module and Egypt is in the Africa module. */
const COUNTRIES = [
  { id: 'af', name: 'Afghanistan', capital: 'Kabul', langs: ['Pashto', 'Dari'], note: 'The flag shown is the tricolor used in atlases. Since 2021 the government has flown a white flag.' },
  { id: 'am', name: 'Armenia', capital: 'Yerevan', langs: ['Armenian'], note: 'A mountain country in the Caucasus region, between Europe and Asia.' },
  { id: 'az', name: 'Azerbaijan', capital: 'Baku', langs: ['Azerbaijani'], note: 'On the Caspian Sea, in the Caucasus region between Europe and Asia.' },
  { id: 'bh', name: 'Bahrain', capital: 'Manama', langs: ['Arabic'], note: 'An island country in the Persian Gulf.' },
  { id: 'bd', name: 'Bangladesh', capital: 'Dhaka', langs: ['Bengali'] },
  { id: 'bt', name: 'Bhutan', capital: 'Thimphu', langs: ['Dzongkha'], note: 'A small mountain country in the Himalayas.' },
  { id: 'bn', name: 'Brunei', capital: 'Bandar Seri Begawan', langs: ['Malay'], note: 'A small country on the island of Borneo.' },
  { id: 'kh', name: 'Cambodia', capital: 'Phnom Penh', langs: ['Khmer'] },
  { id: 'cn', name: 'China', capital: 'Beijing', langs: ['Mandarin Chinese'] },
  { id: 'ge', name: 'Georgia', capital: 'Tbilisi', langs: ['Georgian'], note: 'This Georgia is a country in the Caucasus region, between Europe and Asia.' },
  { id: 'in', name: 'India', capital: 'New Delhi', langs: ['Hindi', 'English'], note: 'India has many languages. Hindi and English are the main ones used by the national government.' },
  { id: 'id', name: 'Indonesia', capital: 'Jakarta', langs: ['Indonesian'], note: 'Indonesia is made of thousands of islands. A new capital called Nusantara is being built, but Jakarta is still the capital.' },
  { id: 'ir', name: 'Iran', capital: 'Tehran', langs: ['Persian'] },
  { id: 'iq', name: 'Iraq', capital: 'Baghdad', langs: ['Arabic', 'Kurdish'] },
  { id: 'il', name: 'Israel', capital: 'Jerusalem', langs: ['Hebrew', 'Arabic'], note: 'Israel names Jerusalem as its capital. Countries do not all agree about the status of Jerusalem.' },
  { id: 'jp', name: 'Japan', capital: 'Tokyo', langs: ['Japanese'], note: 'An island country made of four main islands and thousands of smaller ones.' },
  { id: 'jo', name: 'Jordan', capital: 'Amman', langs: ['Arabic'] },
  { id: 'kz', name: 'Kazakhstan', capital: 'Astana', langs: ['Kazakh', 'Russian'], note: 'The biggest country in the world with no coast on an ocean. A small part is in Europe.' },
  { id: 'kw', name: 'Kuwait', capital: 'Kuwait City', langs: ['Arabic'], note: 'A small country at the top of the Persian Gulf.' },
  { id: 'kg', name: 'Kyrgyzstan', capital: 'Bishkek', langs: ['Kyrgyz', 'Russian'] },
  { id: 'la', name: 'Laos', capital: 'Vientiane', langs: ['Lao'] },
  { id: 'lb', name: 'Lebanon', capital: 'Beirut', langs: ['Arabic'] },
  { id: 'my', name: 'Malaysia', capital: 'Kuala Lumpur', langs: ['Malay'], note: 'Kuala Lumpur is the capital. The government offices are in a nearby city called Putrajaya.' },
  { id: 'mv', name: 'Maldives', capital: 'Male', langs: ['Dhivehi'], note: 'An island country of coral islands in the Indian Ocean.' },
  { id: 'mn', name: 'Mongolia', capital: 'Ulaanbaatar', langs: ['Mongolian'] },
  { id: 'mm', name: 'Myanmar', capital: 'Naypyidaw', langs: ['Burmese'], note: 'Also called Burma. The biggest city is Yangon, but Naypyidaw is the capital.' },
  { id: 'np', name: 'Nepal', capital: 'Kathmandu', langs: ['Nepali'], note: 'Mount Everest, the tallest mountain in the world, is on its border with China.' },
  { id: 'kp', name: 'North Korea', capital: 'Pyongyang', langs: ['Korean'] },
  { id: 'om', name: 'Oman', capital: 'Muscat', langs: ['Arabic'] },
  { id: 'pk', name: 'Pakistan', capital: 'Islamabad', langs: ['Urdu', 'English'] },
  { id: 'ps', name: 'Palestine', capital: 'Ramallah', langs: ['Arabic'], note: 'The State of Palestine is recognized by many countries but not by all. Ramallah is the seat of government, and Palestine also claims Jerusalem as its capital.' },
  { id: 'ph', name: 'Philippines', capital: 'Manila', langs: ['Filipino', 'English'], note: 'An island country of more than 7,000 islands.' },
  { id: 'qa', name: 'Qatar', capital: 'Doha', langs: ['Arabic'] },
  { id: 'ru', name: 'Russia', capital: 'Moscow', langs: ['Russian'], note: 'Russia is the biggest country in the world. Most of its land is in Asia, but it is also in Europe, and its capital is in Europe.' },
  { id: 'sa', name: 'Saudi Arabia', capital: 'Riyadh', langs: ['Arabic'] },
  { id: 'sg', name: 'Singapore', capital: 'Singapore', langs: ['English', 'Malay', 'Mandarin Chinese', 'Tamil'], note: 'A small island country at the tip of the Malay Peninsula. Its capital has the same name.' },
  { id: 'kr', name: 'South Korea', capital: 'Seoul', langs: ['Korean'] },
  { id: 'lk', name: 'Sri Lanka', capital: 'Colombo', langs: ['Sinhala', 'Tamil'], note: 'Sri Jayawardenepura Kotte is the official capital, and Colombo is the biggest city, where the government works.' },
  { id: 'sy', name: 'Syria', capital: 'Damascus', langs: ['Arabic'] },
  { id: 'tw', name: 'Taiwan', capital: 'Taipei', langs: ['Mandarin Chinese'], note: 'Taiwan governs itself. Some countries recognize it as a country and others do not.' },
  { id: 'tj', name: 'Tajikistan', capital: 'Dushanbe', langs: ['Tajik'] },
  { id: 'th', name: 'Thailand', capital: 'Bangkok', langs: ['Thai'] },
  { id: 'tl', name: 'Timor-Leste', capital: 'Dili', langs: ['Tetum', 'Portuguese'], note: 'Also called East Timor. It shares an island with Indonesia.' },
  { id: 'tr', name: 'Turkey', capital: 'Ankara', langs: ['Turkish'], note: 'Most of Turkey is in Asia, and a small part is in Europe. Its official name in Turkish is Turkiye.' },
  { id: 'tm', name: 'Turkmenistan', capital: 'Ashgabat', langs: ['Turkmen'] },
  { id: 'ae', name: 'United Arab Emirates', capital: 'Abu Dhabi', langs: ['Arabic'], note: 'Seven emirates joined together. Dubai is the biggest city, but Abu Dhabi is the capital.' },
  { id: 'uz', name: 'Uzbekistan', capital: 'Tashkent', langs: ['Uzbek'] },
  { id: 'vn', name: 'Vietnam', capital: 'Hanoi', langs: ['Vietnamese'] },
  { id: 'ye', name: 'Yemen', capital: 'Sanaa', langs: ['Arabic'], note: 'Sanaa is the capital. Aden is the base of the government that most countries recognize.' }
];

/* other spellings accepted when typing: name and capital by country id, language by language name */
const ALSO = {
  name: { bn: ['Brunei Darussalam'], cn: ["People's Republic of China", 'PRC', 'Peoples Republic of China'], kp: ['DPRK', 'Democratic Peoples Republic of Korea', 'Korea North', 'Northern Korea'], kr: ['Republic of Korea', 'Korea South', 'Southern Korea', 'Korea'], kg: ['Kirgizstan', 'Kirghizstan', 'Kyrgyz Republic'], la: ['Lao', 'Lao PDR', 'Laos PDR'], mm: ['Burma'], ps: ['State of Palestine', 'Palestinian Territories', 'Palestinian territories'], ru: ['Russian Federation'], tl: ['East Timor', 'Timor Leste', 'Timor'], tr: ['Turkiye', 'Türkiye'], ae: ['UAE', 'Emirates', 'The UAE'], vn: ['Viet Nam'], tw: ['Republic of China', 'Chinese Taipei'], ir: ['Persia'], lk: ['Ceylon'], mv: ['The Maldives', 'Maldive Islands'], ph: ['The Philippines'], sa: ['KSA', 'Saudi'], tj: ['Tadjikistan'], kh: ['Kampuchea'], bh: ['Kingdom of Bahrain'], il: ['State of Israel'] },
  capital: { kz: ['Astana'], mm: ['Nay Pyi Taw', 'Naypyitaw', 'Nay Pyi Daw'], np: ['Katmandu'], bd: ['Dacca'], in: ['Delhi'], id: ['Nusantara'], mv: ['Malé'], lk: ['Sri Jayawardenepura Kotte', 'Sri Jayawardenapura Kotte', 'Kotte', 'Sri Jayawardenepura'], cn: ['Peking'], th: ['Krung Thep'], mn: ['Ulan Bator', 'Ulanbator'], uz: ['Toshkent'], ps: ['Jerusalem', 'East Jerusalem', 'Al-Quds'], ye: ["Sana'a", 'Sana', "Sana'a'"], bn: ['BSB', 'Bandar'], my: ['KL'], ae: ['Abu Dabi'], tm: ['Ashkhabad', 'Ashgabad', 'Asgabat'], ir: ['Teheran'], kw: ['Kuwait'], il: [], tr: [], ge: ['Tiflis'], az: ['Baki'], kh: ['Phnom Penh'], tw: ['Taipei City'], ph: ['Maynila'], vn: ['Ha Noi'], sy: ['Dimashq'], af: [], kg: [], tl: [], sa: ['Riyad'], qa: ['Al Doha', 'Ad Dawhah'] },
  lang: { 'Mandarin Chinese': ['Chinese', 'Mandarin', 'Standard Chinese', 'Putonghua'], Persian: ['Farsi'], Filipino: ['Tagalog'], Dhivehi: ['Maldivian', 'Divehi'], Dari: ['Afghan Persian'], Pashto: ['Pashtu', 'Pushto'], Malay: ['Malaysian', 'Bahasa Malaysia'], Burmese: ['Myanmar'], Indonesian: ['Bahasa Indonesia'], Lao: ['Laotian'], Tetum: ['Tetun'], Azerbaijani: ['Azeri', 'Azerbaijan'], Kyrgyz: ['Kirghiz', 'Kirgiz'], Sinhala: ['Sinhalese'], Hebrew: [], Kurdish: [], Dzongkha: ['Bhutanese'], Bengali: ['Bangla'], Nepali: ['Nepalese'], Urdu: [], Tajik: ['Tajiki'], Uzbek: [], Kazakh: [], Turkmen: [], Khmer: ['Cambodian'], Tamil: [] }
};

/* ---- flags, drawn from simple pieces ---- */
const FLAGS = (() => {
  const svg = (name, body, w = 300, h = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Flag of ${name}">${body}</svg>`;
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const H = cs => cs.map((c, i) => rect(0, i * 200 / cs.length, 300, 200 / cs.length + .5, c)).join('');
  const V = cs => cs.map((c, i) => rect(i * 300 / cs.length, 0, 300 / cs.length + .5, 200, c)).join('');
  const bands = (cs, ws) => { const t = ws.reduce((a, b) => a + b, 0); let y = 0; return cs.map((c, i) => { const h = 200 * ws[i] / t; const r = rect(0, y, 300, h + .5, c); y += h; return r; }).join(''); };
  const circ = (cx, cy, r, f, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${extra}/>`;
  const poly = (pts, f, extra = '') => `<polygon points="${pts}" fill="${f}" ${extra}/>`;
  /* star with n points; ratio = inner radius / outer radius; rot in degrees (0 = one point up) */
  const starN = (cx, cy, r, f, n = 5, ratio = n === 5 ? .382 : .5, rot = 0) => { const p = []; for (let i = 0; i < 2 * n; i++) { const a = (-90 + rot) * Math.PI / 180 + i * Math.PI / n, rr = i % 2 ? r * ratio : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return poly(p.join(' '), f); };
  /* crescent opening to the right when dir = 1, to the left when dir = -1; bg is the color of the field behind it */
  const cres = (cx, cy, r, f, bg, dir = 1, k = .72) => circ(cx, cy, r, f) + circ(cx + dir * r * .28, cy, r * k, bg);
  const F = {};
  F.af = svg('Afghanistan', V(['#000', '#BE0000', '#007A36']) + circ(150, 100, 30, 'none', 'stroke="#fff" stroke-width="5"') + rect(138, 92, 24, 16, '#fff') + rect(144, 78, 12, 10, '#fff'));
  F.am = svg('Armenia', H(['#D90012', '#0033A0', '#F2A800']));
  F.az = svg('Azerbaijan', H(['#00B5E2', '#EF3340', '#509E2F']) + cres(140, 100, 28, '#fff', '#EF3340') + starN(164, 100, 15, '#fff', 8, .5));
  F.bh = svg('Bahrain', rect(0, 0, 300, 200, '#CE1126') + `<path d="M0 0H85L120 20 85 40 120 60 85 80 120 100 85 120 120 140 85 160 120 180 85 200H0z" fill="#fff"/>`);
  F.bd = svg('Bangladesh', rect(0, 0, 300, 200, '#006A4E') + circ(135, 100, 60, '#F42A41'));
  F.bt = svg('Bhutan', poly('0,0 300,0 0,200', '#FFD520') + poly('300,0 300,200 0,200', '#FF4E12') + `<path d="M70 150C100 110 60 90 110 70 150 55 130 100 170 90 210 80 190 40 230 50M218 52l12-6-6 14" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` + circ(100, 78, 9, '#fff'));
  F.bn = svg('Brunei', rect(0, 0, 300, 200, '#F7E017') + `<path d="M-10 4L310 148" stroke="#fff" stroke-width="40"/><path d="M-10 46L310 190" stroke="#000" stroke-width="30"/>` + `<g fill="#CF1126"><rect x="146" y="56" width="8" height="40"/><path d="M110 98q40-32 80 0z"/><path d="M96 106q54 62 108 0q-54 30-108 0z"/><path d="M104 96l-24-14M196 96l24-14" stroke="#CF1126" stroke-width="8"/></g>`);
  F.kh = svg('Cambodia', bands(['#032EA1', '#E00025', '#032EA1'], [1, 2, 1]) + `<g fill="#fff"><rect x="95" y="118" width="110" height="10"/><rect x="104" y="108" width="92" height="10"/><path d="M110 108l8-26 8 26zM137 108l13-44 13 44zM174 108l8-26 8 26z"/><rect x="146" y="50" width="8" height="16"/></g>`);
  F.cn = svg('China', rect(0, 0, 300, 200, '#DE2910') + starN(50, 50, 30, '#FFDE00') + starN(100, 20, 10, '#FFDE00', 5, .382, 22) + starN(120, 44, 10, '#FFDE00', 5, .382, 45) + starN(120, 76, 10, '#FFDE00', 5, .382, 0) + starN(100, 100, 10, '#FFDE00', 5, .382, -22));
  F.ge = svg('Georgia', rect(0, 0, 300, 200, '#fff') + rect(130, 0, 40, 200, '#FF0000') + rect(0, 80, 300, 40, '#FF0000') + [[65, 40], [235, 40], [65, 160], [235, 160]].map(([x, y]) => rect(x - 7, y - 20, 14, 40, '#FF0000') + rect(x - 20, y - 7, 40, 14, '#FF0000')).join(''));
  F.in = svg('India', H(['#FF9933', '#fff', '#138808']) + circ(150, 100, 19, 'none', 'stroke="#000080" stroke-width="3"') + Array.from({ length: 12 }, (_, i) => `<line x1="150" y1="81" x2="150" y2="119" stroke="#000080" stroke-width="1.6" transform="rotate(${i * 15} 150 100)"/>`).join('') + circ(150, 100, 4, '#000080'));
  F.id = svg('Indonesia', H(['#CE1126', '#fff']));
  F.ir = svg('Iran', H(['#239F40', '#fff', '#DA0000']) + `<g fill="none" stroke="#DA0000" stroke-width="6" stroke-linecap="round"><path d="M135 120q-20-20 0-40M165 120q20-20 0-40"/><path d="M150 76v50"/></g>` + rect(0, 66, 300, 3, '#DA0000') + rect(0, 131, 300, 3, '#239F40'));
  F.iq = svg('Iraq', H(['#CE1126', '#fff', '#000']) + `<g fill="#007A3D"><rect x="104" y="86" width="26" height="9" rx="3"/><rect x="136" y="82" width="9" height="20" rx="3"/><rect x="152" y="86" width="22" height="9" rx="3"/><rect x="180" y="82" width="9" height="20" rx="3"/></g>`);
  F.il = svg('Israel', rect(0, 0, 300, 200, '#fff') + rect(0, 22, 300, 30, '#0038B8') + rect(0, 148, 300, 30, '#0038B8') + `<g fill="none" stroke="#0038B8" stroke-width="7"><path d="M150 66l30 52h-60z"/><path d="M150 134l-30-52h60z"/></g>`);
  F.jp = svg('Japan', rect(0, 0, 300, 200, '#fff') + circ(150, 100, 60, '#BC002D'));
  F.jo = svg('Jordan', H(['#000', '#fff', '#007A3D']) + poly('0,0 150,100 0,200', '#CE1126') + starN(46, 100, 15, '#fff', 7, .45));
  F.kz = svg('Kazakhstan', rect(0, 0, 300, 200, '#00AFCA') + starN(150, 80, 40, '#FEC50C', 32, .78) + circ(150, 80, 27, '#00AFCA') + circ(150, 80, 22, '#FEC50C') + `<path d="M85 134q32-22 65-10 33-12 65 10-30 8-65 2-35 6-65-2z" fill="#FEC50C"/>` + rect(12, 12, 20, 176, '#00AFCA') + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M22 ${20 + i * 22}l9 11-9 11-9-11z" fill="#FEC50C"/>`).join(''));
  F.kw = svg('Kuwait', H(['#007A3D', '#fff', '#CE1126']) + poly('0,0 80,67 80,133 0,200', '#000'));
  F.kg = svg('Kyrgyzstan', rect(0, 0, 300, 200, '#E8112D') + starN(150, 100, 56, '#FFEF00', 40, .82) + circ(150, 100, 38, '#E8112D', 'stroke="#FFEF00" stroke-width="3"') + `<g fill="none" stroke="#FFEF00" stroke-width="3"><path d="M120 90q30-20 60 0M120 110q30 20 60 0M126 80q-8 20 0 40M174 80q8 20 0 40"/></g>`);
  F.la = svg('Laos', bands(['#CE1126', '#002868', '#CE1126'], [1, 2, 1]) + circ(150, 100, 40, '#fff'));
  F.lb = svg('Lebanon', bands(['#ED1C24', '#fff', '#ED1C24'], [1, 2, 1]) + `<g fill="#00A651"><path d="M150 52l30 42h-14l22 28h-24v14h-28v-14h-24l22-28h-14z"/><rect x="144" y="134" width="12" height="14"/></g>`);
  F.my = svg('Malaysia', Array.from({ length: 14 }, (_, i) => rect(0, i * 200 / 14, 300, 200 / 14 + .4, i % 2 ? '#fff' : '#CC0001')).join('') + rect(0, 0, 150, 114.3, '#010066') + cres(58, 57, 34, '#FFCC00', '#010066') + starN(84, 57, 30, '#FFCC00', 14, .5));
  F.mv = svg('Maldives', rect(0, 0, 300, 200, '#D21034') + rect(60, 40, 180, 120, '#007E3A') + cres(145, 100, 32, '#fff', '#007E3A'));
  F.mn = svg('Mongolia', V(['#C4272F', '#015197', '#C4272F']) + `<g fill="#F9CF02"><circle cx="50" cy="58" r="9"/><path d="M50 36l-6 12h12zM50 78l-6-12h12z"/><rect x="28" y="88" width="9" height="62"/><rect x="63" y="88" width="9" height="62"/><rect x="40" y="96" width="20" height="8"/><rect x="40" y="116" width="20" height="8"/><rect x="40" y="136" width="20" height="8"/><rect x="26" y="152" width="48" height="8"/></g>`);
  F.mm = svg('Myanmar', H(['#FECB00', '#34B232', '#EA2839']) + starN(150, 108, 56, '#fff'));
  F.np = svg('Nepal', `<path d="M68 0L230 102H138L230 200H68z" fill="#DC143C" stroke="#003893" stroke-width="8" stroke-linejoin="miter"/>` + cres(110, 58, 14, '#fff', '#DC143C', 1, .8) + starN(104, 68, 9, '#fff', 12, .6).replace('<polygon', '<polygon') + starN(104, 150, 18, '#fff', 12, .6) + circ(104, 150, 9, '#DC143C'));
  F.kp = svg('North Korea', rect(0, 0, 300, 200, '#024FA2') + rect(0, 36, 300, 128, '#fff') + rect(0, 44, 300, 112, '#ED1C27') + circ(110, 100, 40, '#fff') + starN(110, 100, 34, '#ED1C27'));
  F.om = svg('Oman', rect(0, 0, 300, 200, '#fff') + rect(0, 66, 300, 67, '#DB161B') + rect(0, 133, 300, 67, '#008000') + rect(0, 0, 100, 200, '#DB161B') + `<g stroke="#fff" stroke-width="5" fill="none"><path d="M30 50L70 20M70 50L30 20"/><circle cx="50" cy="35" r="9"/></g>`);
  F.pk = svg('Pakistan', rect(0, 0, 300, 200, '#01411C') + rect(0, 0, 75, 200, '#fff') + cres(188, 100, 48, '#fff', '#01411C', 1, .8) + starN(207, 76, 17, '#fff', 5, .382, 30));
  F.ps = svg('Palestine', H(['#000', '#fff', '#007A3D']) + poly('0,0 110,100 0,200', '#CE1126'));
  F.ph = svg('Philippines', rect(0, 0, 300, 100, '#0038A8') + rect(0, 100, 300, 100, '#CE1126') + poly('0,0 0,200 173,100', '#fff') + circ(58, 100, 17, '#FCD116') + Array.from({ length: 8 }, (_, i) => `<line x1="58" y1="76" x2="58" y2="124" stroke="#FCD116" stroke-width="4" transform="rotate(${i * 22.5} 58 100)"/>`).join('') + starN(14, 20, 10, '#FCD116') + starN(14, 180, 10, '#FCD116') + starN(145, 100, 10, '#FCD116'));
  F.qa = svg('Qatar', rect(0, 0, 300, 200, '#8A1538') + `<path d="M0 0H95${Array.from({ length: 9 }, (_, i) => `L135 ${(i + .5) * 200 / 9}L95 ${(i + 1) * 200 / 9}`).join('')}H0z" fill="#fff"/>`);
  F.ru = svg('Russia', H(['#fff', '#0039A6', '#D52B1E']));
  F.sa = svg('Saudi Arabia', rect(0, 0, 300, 200, '#006C35') + `<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M70 90q10-24 20 0t20 0 20-14 20 14 20 0 20-10 20 10 20 0"/><path d="M78 112h140"/></g>` + `<path d="M70 142h160" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M70 136l-10 6 10 6z" fill="#fff"/>`);
  F.sg = svg('Singapore', rect(0, 0, 300, 100, '#EF3340') + rect(0, 100, 300, 100, '#fff') + cres(62, 50, 34, '#fff', '#EF3340', 1, .8) + [0, 1, 2, 3, 4].map(i => starN(113 + 25 * Math.sin(i * 2 * Math.PI / 5), 50 - 25 * Math.cos(i * 2 * Math.PI / 5), 8, '#fff', 5, .382, i * 72)).join(''));
  F.kr = (() => { const tri = (x, y, rot, pat) => `<g transform="translate(${x} ${y}) rotate(${rot})">${[-14, 0, 14].map((dy, i) => pat[i] ? rect(-26, dy - 4, 52, 8, '#000') : rect(-26, dy - 4, 22, 8, '#000') + rect(4, dy - 4, 22, 8, '#000')).join('')}</g>`; const R = 112, a = Math.atan2(100, 150) * 180 / Math.PI; return svg('South Korea', rect(0, 0, 300, 200, '#fff') + `<path d="M100 100a50 50 0 0 1 100 0a25 25 0 0 1-50 0a25 25 0 0 0-50 0z" fill="#CD2E3A"/><path d="M200 100a50 50 0 0 1-100 0a25 25 0 0 1 50 0a25 25 0 0 0 50 0z" fill="#0047A0"/>` + tri(150 - 100, 100 - 67, a, [1, 1, 1]) + tri(150 + 100, 100 - 67, -a, [0, 1, 0]) + tri(150 - 100, 100 + 67, -a, [1, 0, 1]) + tri(150 + 100, 100 + 67, a, [0, 0, 0])); })();
  F.lk = svg('Sri Lanka', rect(0, 0, 300, 200, '#FFB700') + rect(8, 8, 284, 184, '#8D153A') + rect(14, 14, 272, 172, '#FFB700') + rect(20, 20, 30, 160, '#00534E') + rect(50, 20, 30, 160, '#EB7400') + rect(88, 20, 192, 160, '#8D153A') + `<g fill="#FFB700"><path d="M130 140q-4-40 10-62 6-16 30-12 14 4 20 14l-12 4 8 10q-10 6-24 4l-10 18 6 24h-14l-6-18-10 18z"/><rect x="198" y="100" width="6" height="52"/></g>` + [[96, 28], [272, 28], [96, 172], [272, 172]].map(([x, y]) => starN(x, y, 7, '#FFB700', 4, .4, 45)).join(''));
  F.sy = svg('Syria', H(['#007A3D', '#fff', '#000']) + [0, 1, 2].map(i => starN(90 + i * 60, 100, 17, '#CE1126')).join(''));
  F.tw = svg('Taiwan', rect(0, 0, 300, 200, '#FE0000') + rect(0, 0, 150, 100, '#000095') + starN(75, 50, 36, '#fff', 12, .72) + circ(75, 50, 22, '#000095') + circ(75, 50, 17, '#fff'));
  F.tj = svg('Tajikistan', bands(['#CC0000', '#fff', '#006600'], [2, 3, 2]) + `<path d="M118 112q0-32 32-32t32 32z" fill="#F8C300"/><rect x="114" y="112" width="72" height="10" fill="#F8C300"/>` + Array.from({ length: 7 }, (_, i) => starN(150 + 40 * Math.cos(Math.PI - i * Math.PI / 6), 112 - 40 * Math.sin(i * Math.PI / 6) - 8, 6, '#F8C300')).join('') + starN(150, 62, 9, '#F8C300'));
  F.th = svg('Thailand', bands(['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], [1, 1, 2, 1, 1]));
  F.tl = svg('Timor-Leste', rect(0, 0, 300, 200, '#DC241F') + poly('0,0 150,100 0,200', '#FFC726') + poly('0,0 100,100 0,200', '#000') + starN(36, 100, 26, '#fff', 5, .382, -90));
  F.tr = svg('Turkey', rect(0, 0, 300, 200, '#E30A17') + cres(112, 100, 50, '#fff', '#E30A17', 1, .8) + starN(172, 100, 24, '#fff', 5, .382, 90));
  F.tm = svg('Turkmenistan', rect(0, 0, 300, 200, '#00843D') + rect(24, 0, 56, 200, '#D22630') + [0, 1, 2, 3, 4].map(i => `<g transform="translate(52 ${28 + i * 36})"><circle r="13" fill="#FFF" opacity=".0"/><path d="M-14 0l14-16 14 16-14 16z" fill="#00843D"/><path d="M-8 0l8-9 8 9-8 9z" fill="#F4C300"/></g>`).join('') + cres(172, 46, 22, '#fff', '#00843D', 1, .8) + [0, 1, 2, 3, 4].map(i => starN(204 + (i % 3) * 14, 28 + Math.floor(i / 3) * 24, 6, '#fff')).join(''));
  F.ae = svg('United Arab Emirates', H(['#00732F', '#fff', '#000']) + rect(0, 0, 78, 200, '#FF0000'));
  F.uz = svg('Uzbekistan', rect(0, 0, 300, 200, '#fff') + rect(0, 0, 300, 64, '#0099B5') + rect(0, 64, 300, 4, '#CE1126') + rect(0, 132, 300, 4, '#CE1126') + rect(0, 136, 300, 64, '#1EB53A') + cres(44, 30, 20, '#fff', '#0099B5', 1, .8) + [3, 4, 5].flatMap((n, r) => Array.from({ length: n }, (_, i) => starN(88 + i * 14 - (n - 3) * 7 + 14 - 14, 14 + r * 16, 5, '#fff', 5, .382))).join(''));
  F.vn = svg('Vietnam', rect(0, 0, 300, 200, '#DA251D') + starN(150, 105, 62, '#FFFF00'));
  F.ye = svg('Yemen', H(['#CE1126', '#fff', '#000']));
  return F;
})();
