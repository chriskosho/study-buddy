/* ---------- Region data (swap this block to make a different continent) ---------- */
const star = (cx, cy, r, fill = '#fff') => {
  let p = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r; p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2)); }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
};
const FLAGS = {
  venezuela: () => `<rect width="30" height="6.7" fill="#fcd116"/><rect y="6.7" width="30" height="6.7" fill="#00247d"/><rect y="13.4" width="30" height="6.6" fill="#cf142b"/>` + [0,1,2,3,4,5,6,7].map(i => { const a = Math.PI * (0.15 + 0.7 * i / 7); return `<circle cx="${(15 - 6.5 * Math.cos(a)).toFixed(2)}" cy="${(11.3 - 2.6 * Math.sin(a)).toFixed(2)}" r="0.55" fill="#fff"/>`; }).join(''),
  colombia: () => `<rect width="30" height="10" fill="#fcd116"/><rect y="10" width="30" height="5" fill="#003893"/><rect y="15" width="30" height="5" fill="#ce1126"/>`,
  ecuador: () => `<rect width="30" height="10" fill="#ffdd00"/><rect y="10" width="30" height="5" fill="#034ea2"/><rect y="15" width="30" height="5" fill="#ed1c24"/><ellipse cx="15" cy="10" rx="2.6" ry="3.2" fill="#8a6d3b" stroke="#c9a227" stroke-width="0.5"/><circle cx="15" cy="9.2" r="1.3" fill="#7ec8e3"/>`,
  peru: () => `<rect width="30" height="20" fill="#d91023"/><rect x="10" width="10" height="20" fill="#fff"/><ellipse cx="15" cy="10" rx="2" ry="2.5" fill="#6b8e4e" stroke="#c9a227" stroke-width="0.5"/>`,
  brazil: () => `<rect width="30" height="20" fill="#009b3a"/><polygon points="15,2 27.5,10 15,18 2.5,10" fill="#fedf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/><path d="M10.6 9.2 Q15 7.6 19.4 11.2" stroke="#fff" stroke-width="1" fill="none"/>`,
  bolivia: () => `<rect width="30" height="6.7" fill="#d52b1e"/><rect y="6.7" width="30" height="6.7" fill="#f9e300"/><rect y="13.4" width="30" height="6.6" fill="#007934"/>`,
  paraguay: () => `<rect width="30" height="6.7" fill="#d52b1e"/><rect y="6.7" width="30" height="6.7" fill="#fff"/><rect y="13.4" width="30" height="6.6" fill="#0038a8"/><circle cx="15" cy="10" r="2.3" fill="none" stroke="#6b8e4e" stroke-width="0.7"/>`,
  uruguay: () => `<rect width="30" height="20" fill="#fff"/>` + [1,3,5,7].map(i => `<rect y="${(i * 20 / 9).toFixed(2)}" width="30" height="${(20 / 9).toFixed(2)}" fill="#0038a8"/>`).join('') + `<rect width="11" height="${(20 * 4 / 9).toFixed(2)}" fill="#fff"/><circle cx="5.5" cy="4.4" r="2.3" fill="#fcd116"/>`,
  argentina: () => `<rect width="30" height="20" fill="#74acdf"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><circle cx="15" cy="10" r="1.9" fill="#f6b40e"/>`,
  chile: () => `<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#d52b1e"/><rect width="10" height="10" fill="#0039a6"/>` + star(5, 5, 2.8),
  guyana: () => `<rect width="30" height="20" fill="#009e49"/><polygon points="0,0 30,10 0,20" fill="#fff"/><polygon points="0,1.3 27.4,10 0,18.7" fill="#fcd116"/><polygon points="0,0 15.5,10 0,20" fill="#000"/><polygon points="0,1.7 13,10 0,18.3" fill="#ce1126"/>`,
  suriname: () => `<rect width="30" height="20" fill="#377e3f"/><rect y="4.4" width="30" height="11.2" fill="#fff"/><rect y="6" width="30" height="8" fill="#b40a2d"/>` + star(15, 10, 3.6, '#ecc81d'),
};
const flagSVG = (id, cls = '') => `<svg class="flag ${cls}" viewBox="0 0 30 20" role="img" aria-label="Flag of ${COUNTRY_BY_ID[id].name}" preserveAspectRatio="xMidYMid slice">${FLAGS[id]()}</svg>`;

const REGION = {
  key: 'south-america',
  title: 'South America',
  countries: [
    { id: 'venezuela', name: 'Venezuela', capital: 'Caracas', color: '#f2b880',
      fact: 'Angel Falls here is the tallest waterfall on Earth, about 979 meters tall (3,212 feet).',
      clue: 'Home of Angel Falls, the tallest waterfall in the world.', neighbors: ['colombia','brazil','guyana'] },
    { id: 'colombia', name: 'Colombia', capital: 'Bogotá', color: '#e9d27a',
      fact: 'Named after Christopher Columbus. It is famous for coffee, emeralds, and colorful flowers.',
      clue: 'Named after Christopher Columbus and famous for its coffee.', neighbors: ['venezuela','brazil','peru','ecuador'] },
    { id: 'ecuador', name: 'Ecuador', capital: 'Quito', color: '#a6d27a',
      fact: 'Its name means "equator" in Spanish, and the Galápagos Islands belong to it.',
      clue: 'The equator runs through it, and it owns the Galápagos Islands.', neighbors: ['colombia','peru'] },
    { id: 'peru', name: 'Peru', capital: 'Lima', color: '#6fc2a5',
      fact: 'Machu Picchu, the mountain city of the Inca, is here. Llamas and alpacas live in the Andes.',
      clue: 'Home of Machu Picchu, the ancient Inca city in the mountains.', neighbors: ['ecuador','colombia','brazil','bolivia','chile'] },
    { id: 'brazil', name: 'Brazil', capital: 'Brasília', color: '#f7a072',
      fact: 'The biggest country in South America. People speak Portuguese, and the Amazon rainforest is mostly here.',
      clue: 'The biggest country in South America. People speak Portuguese there.', neighbors: ['venezuela','guyana','suriname','colombia','peru','bolivia','paraguay','argentina','uruguay'] },
    { id: 'bolivia', name: 'Bolivia', capital: 'Sucre', capitalNote: 'La Paz is where the government sits.', color: '#8fa8d6',
      fact: 'It has no coast and holds Salar de Uyuni, the largest salt flat in the world.',
      clue: 'It has no coastline, but it does have the biggest salt flat in the world.', neighbors: ['peru','brazil','paraguay','argentina','chile'] },
    { id: 'paraguay', name: 'Paraguay', capital: 'Asunción', color: '#d9a1b6',
      fact: 'It has no coast. Many people speak both Spanish and Guaraní.',
      clue: 'A landlocked country where many people speak Guaraní and Spanish.', neighbors: ['bolivia','brazil','argentina'] },
    { id: 'uruguay', name: 'Uruguay', capital: 'Montevideo', color: '#9fd8d3',
      fact: 'One of the smallest countries in South America, and it loves soccer. The first World Cup was held here in 1930.',
      clue: 'A small country that hosted the very first soccer World Cup in 1930.', neighbors: ['brazil','argentina'] },
    { id: 'argentina', name: 'Argentina', capital: 'Buenos Aires', color: '#ee8f7a',
      fact: 'Tango music began here. Mount Aconcagua, the tallest mountain in the Americas, is here, near the border with Chile.',
      clue: 'Tango music started here, and it is the second-biggest country in South America.', neighbors: ['chile','bolivia','paraguay','brazil','uruguay'] },
    { id: 'chile', name: 'Chile', capital: 'Santiago', color: '#9bc7e6',
      fact: 'A very long, skinny country, about 4,300 km long but only about 175 km wide on average. The Atacama Desert is here.',
      clue: 'A super long, skinny country that stretches along the Pacific coast.', neighbors: ['peru','bolivia','argentina'] },
    { id: 'guyana', name: 'Guyana', capital: 'Georgetown', color: '#c7b2e0',
      fact: 'The only country in South America where English is the official language. Kaieteur Falls is here.',
      clue: 'The only South American country where English is the official language.', neighbors: ['venezuela','brazil','suriname'] },
    { id: 'suriname', name: 'Suriname', capital: 'Paramaribo', color: '#f4a9c8',
      fact: 'The smallest country in South America. People speak Dutch, and most of it is covered in rainforest.',
      clue: 'The smallest country in South America, where people speak Dutch.', neighbors: ['guyana','brazil'] },
  ],
  labelTweaks: {            // per-country map label sizing / position overrides
    guyana:   { size: 9,  dx: -5, dy: 3 },
    suriname: { size: 9,  dx: 5,  dy: -2 },
    uruguay:  { size: 9 },
    ecuador:  { size: 10 },
    paraguay: { size: 10 },
    chile:    { size: 11, x: 121, y: 520, rot: -90 },
    peru:     { size: 11 },
  },
};
const COUNTRY_BY_ID = Object.fromEntries(REGION.countries.map(c => [c.id, c]));

/* Extra per-country data: local spelling + language for "Local" voice, area (km2), people (about) */
const EXTRA = {
  venezuela: { local: 'Venezuela', lang: 'es-ES', area: 916445,  pop: 28000000 },
  colombia:  { local: 'Colombia',  lang: 'es-ES', area: 1141748, pop: 52000000 },
  ecuador:   { local: 'Ecuador',   lang: 'es-ES', area: 283561,  pop: 18000000 },
  peru:      { local: 'Perú',      lang: 'es-ES', area: 1285216, pop: 34000000 },
  brazil:    { local: 'Brasil',    lang: 'pt-BR', area: 8515767, pop: 216000000 },
  bolivia:   { local: 'Bolivia',   lang: 'es-ES', area: 1098581, pop: 12000000 },
  paraguay:  { local: 'Paraguay',  lang: 'es-ES', area: 406752,  pop: 6800000 },
  uruguay:   { local: 'Uruguay',   lang: 'es-ES', area: 176215,  pop: 3400000 },
  argentina: { local: 'Argentina', lang: 'es-ES', area: 2780400, pop: 46000000 },
  chile:     { local: 'Chile',     lang: 'es-ES', area: 756102,  pop: 19600000 },
  guyana:    { local: 'Guyana',    lang: 'en-US', area: 214969,  pop: 800000 },
  suriname:  { local: 'Suriname',  lang: 'nl-NL', area: 163820,  pop: 600000 },
};
REGION.countries.forEach(c => Object.assign(c, EXTRA[c.id]));
