/* Weather: drawings, made for this module (original SVG). Letters in the diagrams follow the practice test. */
const CLOUD = 'M24 72h52a15 15 0 0 0 0-30 20 20 0 0 0-38-4 17 17 0 0 0-14 34z';
const sunRays = (cx, cy, r1, r2) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}"/>`; }).join('');
const KIND_ART = {
  'Sunny': `<circle cx="50" cy="50" r="18" fill="#f6b73c"/><g stroke="#f6b73c" stroke-width="5" stroke-linecap="round">${sunRays(50, 50, 26, 38)}</g>`,
  'Partly cloudy': `<circle cx="36" cy="36" r="15" fill="#f6b73c"/><g stroke="#f6b73c" stroke-width="4" stroke-linecap="round">${sunRays(36, 36, 21, 30)}</g><path d="${CLOUD}" transform="translate(8 8)" fill="#eef3f8" stroke="#6b7a8c" stroke-width="3"/>`,
  'Cloudy': `<path d="${CLOUD}" transform="translate(-6 -8) scale(.85)" fill="#cfd8e2" stroke="#6b7a8c" stroke-width="3"/><path d="${CLOUD}" transform="translate(12 12)" fill="#eef3f8" stroke="#6b7a8c" stroke-width="3"/>`,
  'Rainy': `<path d="${CLOUD}" transform="translate(0 -10)" fill="#cfd8e2" stroke="#6b7a8c" stroke-width="3"/><g stroke="#2b6cb0" stroke-width="4" stroke-linecap="round"><line x1="34" y1="70" x2="29" y2="82"/><line x1="50" y1="70" x2="45" y2="82"/><line x1="66" y1="70" x2="61" y2="82"/><line x1="42" y1="84" x2="37" y2="94"/><line x1="58" y1="84" x2="53" y2="94"/></g>`,
  'Snowy': `<path d="${CLOUD}" transform="translate(0 -10)" fill="#cfd8e2" stroke="#6b7a8c" stroke-width="3"/><g stroke="#4a90c2" stroke-width="3" stroke-linecap="round">${[[34, 76], [52, 80], [70, 76], [43, 92], [61, 92]].map(([x, y]) => `<line x1="${x - 4}" y1="${y}" x2="${x + 4}" y2="${y}"/><line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 4}"/><line x1="${x - 3}" y1="${y - 3}" x2="${x + 3}" y2="${y + 3}"/><line x1="${x - 3}" y1="${y + 3}" x2="${x + 3}" y2="${y - 3}"/>`).join('')}</g>`,
  'Thunderstorm': `<path d="${CLOUD}" transform="translate(0 -12)" fill="#7d8896" stroke="#4a5563" stroke-width="3"/><polygon points="54,58 40,80 50,80 44,98 66,72 55,72 62,58" fill="#f6b73c" stroke="#b9831a" stroke-width="2"/><g stroke="#2b6cb0" stroke-width="4" stroke-linecap="round"><line x1="30" y1="68" x2="26" y2="78"/><line x1="74" y1="68" x2="70" y2="78"/></g>`
};
const kindSVG = (k, label) => `<svg viewBox="0 0 100 100" role="img" aria-label="${label || 'Drawing of ' + k.toLowerCase() + ' weather'}">${KIND_ART[k]}</svg>`;

const ART = {
  earth: earthSVG('names'),
  clouds: `<svg viewBox="0 0 320 170" role="img" aria-label="Drawings of cirrus, cumulus, stratus, and nimbus clouds at different heights"><rect width="320" height="170" fill="#bcdcf0"/>
    <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M18 26q22-12 44 0M30 38q26-10 52 2M24 14q18-8 38 0"/></g>
    <path d="M120 74a14 14 0 0 1 4-27 18 18 0 0 1 33 2 13 13 0 0 1 4 25z" fill="#fff"/><path d="M142 66a10 10 0 0 1 2-19 14 14 0 0 1 25 3 10 10 0 0 1 1 16z" fill="#fff" opacity=".9"/>
    <rect x="12" y="104" width="130" height="16" rx="8" fill="#9aa5b1"/><rect x="30" y="124" width="100" height="12" rx="6" fill="#aab4be"/>
    <path d="M212 96a16 16 0 0 1 4-30 22 22 0 0 1 42 2 16 16 0 0 1 4 28z" fill="#6c7683"/><g stroke="#2b6cb0" stroke-width="3" stroke-linecap="round"><line x1="226" y1="104" x2="221" y2="118"/><line x1="240" y1="104" x2="235" y2="118"/><line x1="254" y1="104" x2="249" y2="118"/></g>
    <g font-size="12" font-weight="700" fill="#23313f" font-family="inherit" text-anchor="middle"><text x="48" y="58">Cirrus</text><text x="146" y="92">Cumulus</text><text x="78" y="154">Stratus</text><text x="238" y="140">Nimbus</text></g></svg>`,
  cycle: cycleSVG('names'),
  tools: `<svg viewBox="0 0 320 170" role="img" aria-label="Drawings of a wind vane, an anemometer, and a rain gauge"><rect width="320" height="170" fill="#d6ebf5"/>
    <g stroke="#4a5563" stroke-width="4" stroke-linecap="round"><line x1="52" y1="48" x2="52" y2="136"/><line x1="26" y1="62" x2="78" y2="62"/></g><polygon points="22,40 70,40 70,34 84,44 70,54 70,48 22,48" fill="#e4572e"/><polygon points="22,40 8,32 8,56 22,48" fill="#e4572e"/>
    <g stroke="#4a5563" stroke-width="4" stroke-linecap="round"><line x1="160" y1="72" x2="160" y2="136"/><line x1="130" y1="72" x2="190" y2="72"/><line x1="160" y1="56" x2="160" y2="72"/></g><g fill="#f6b73c" stroke="#b9831a" stroke-width="2"><path d="M118 62a12 12 0 0 1 24 0z" transform="rotate(-20 130 62)"/><path d="M178 62a12 12 0 0 1 24 0z" transform="rotate(20 190 62)"/><path d="M148 48a12 12 0 0 1 24 0z"/></g>
    <rect x="236" y="62" width="44" height="74" rx="5" fill="#fff" stroke="#4a5563" stroke-width="3"/><rect x="238" y="100" width="40" height="34" fill="#6bb4e6"/><g stroke="#4a5563" stroke-width="2"><line x1="236" y1="76" x2="248" y2="76"/><line x1="236" y1="90" x2="248" y2="90"/><line x1="236" y1="104" x2="248" y2="104"/><line x1="236" y1="118" x2="248" y2="118"/></g>
    <g font-size="12" font-weight="700" fill="#23313f" font-family="inherit" text-anchor="middle"><text x="52" y="156">Wind vane</text><text x="160" y="156">Anemometer</text><text x="258" y="156">Rain gauge</text></g></svg>`
};

/* the globe: letters (for the label quiz) or names (for the study guide) */
function earthSVG(mode) {
  const L = { A: [112, 26], B: [196, 70], C: [226, 101], D: [112, 168], E: [202, 206] };
  const names = { A: 'North Pole', B: 'Northern Hemisphere', C: 'Equator', D: 'Southern Hemisphere', E: 'South Pole' };
  const mark = k => mode === 'letters'
    ? `<g><circle cx="${L[k][0]}" cy="${L[k][1]}" r="10" fill="#fff"/><text x="${L[k][0]}" y="${L[k][1] + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="#1d2a44" font-family="inherit">${k}</text></g>`
    : `<text x="${{ A: 132, B: 152, C: 208, D: 152, E: 176 }[k]}" y="${{ A: 16, B: 62, C: 122, D: 176, E: 214 }[k]}" text-anchor="${k === 'A' || k === 'E' ? 'start' : 'middle'}" font-size="12" font-weight="800" fill="#fff" stroke="#1d2a44" stroke-width="3" paint-order="stroke" font-family="inherit">${names[k]}</text>`;
  return `<svg viewBox="0 0 300 220" role="img" aria-label="Drawing of the earth tilted on its axis, with the equator, the poles, and the two hemispheres${mode === 'letters' ? ', marked with the letters A to E' : ''}"><rect width="300" height="220" rx="10" fill="#1d2a44"/>
    <g fill="#fff"><circle cx="20" cy="30" r="1.5"/><circle cx="270" cy="24" r="1.5"/><circle cx="36" cy="190" r="1.5"/><circle cx="268" cy="150" r="1.5"/><circle cx="60" cy="90" r="1"/></g>
    <line x1="116" y1="8" x2="188" y2="212" stroke="#d8dde5" stroke-width="5" stroke-linecap="round"/>
    <circle cx="152" cy="110" r="84" fill="#4a90c2"/><g fill="#5fae5f"><path d="M96 70q22-18 48-8 10 14-4 28-20 6-34-2z"/><path d="M168 118q18-6 30 10 4 22-12 38-14-4-18-24z"/><path d="M110 120q10-4 16 6-2 14-14 12z"/></g>
    <g fill="#fff" opacity=".85"><ellipse cx="128" cy="36" rx="20" ry="7" transform="rotate(-12 128 36)"/><ellipse cx="176" cy="190" rx="22" ry="7" transform="rotate(-12 176 190)"/></g>
    <ellipse cx="152" cy="112" rx="84" ry="15" transform="rotate(-19 152 112)" fill="none" stroke="#e4572e" stroke-width="3"/>
    <circle cx="152" cy="110" r="84" fill="none" stroke="#8fb4d8" stroke-width="2"/>
    ${['A', 'B', 'C', 'D', 'E'].map(mark).join('')}</svg>`;
}
/* the water cycle: letters or names */
function cycleSVG(mode) {
  const names = { A: 'Evaporation', B: 'Condensation', C: 'Precipitation' };
  const pos = { A: [262, 112], B: [150, 24], C: mode === 'letters' ? [128, 92] : [128, 98] };
  const mark = k => mode === 'letters'
    ? `<g><circle cx="${pos[k][0]}" cy="${pos[k][1]}" r="10" fill="#fff" stroke="#23313f" stroke-width="1.5"/><text x="${pos[k][0]}" y="${pos[k][1] + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="#23313f" font-family="inherit">${k}</text></g>`
    : `<text x="${pos[k][0]}" y="${pos[k][1] + 4}" text-anchor="${k === 'A' ? 'middle' : 'middle'}" font-size="12" font-weight="800" fill="#23313f" font-family="inherit" stroke="#fff" stroke-width="3" paint-order="stroke">${names[k]}</text>`;
  return `<svg viewBox="0 0 320 200" role="img" aria-label="Drawing of the water cycle: water rising from the sea, a cloud forming, and rain falling on a mountain${mode === 'letters' ? ', marked with the letters A to C' : ''}"><rect width="320" height="200" rx="10" fill="#cfe8f6"/>
    <circle cx="276" cy="36" r="20" fill="#f6b73c"/><g stroke="#f6b73c" stroke-width="3" stroke-linecap="round">${sunRays(276, 36, 25, 33)}</g>
    <rect x="168" y="140" width="152" height="60" fill="#4a90c2"/><polygon points="0,200 0,104 44,58 68,82 92,66 168,140 168,200" fill="#8a7a62"/><polygon points="0,200 0,150 42,118 100,108 168,140 168,200" fill="#6aa84f"/><polygon points="44,58 30,76 40,72 46,80 54,72 60,76" fill="#fff"/>
    <g fill="none" stroke="#e4572e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M240 138v-30M262 138v-34M284 138v-30"/><path d="M234 116l6-8 6 8M256 112l6-8 6 8M278 116l6-8 6 8"/></g>
    <path d="M118 52a15 15 0 0 1 3-29 20 20 0 0 1 38 2 14 14 0 0 1 3 27z" fill="#fff" stroke="#8aa0b4" stroke-width="2"/>
    <g stroke="#2b6cb0" stroke-width="2.5" stroke-linecap="round"><line x1="112" y1="64" x2="106" y2="80"/><line x1="124" y1="64" x2="118" y2="80"/><line x1="136" y1="64" x2="130" y2="80"/><line x1="148" y1="64" x2="142" y2="80"/></g>
    ${['A', 'B', 'C'].map(mark).join('')}</svg>`;
}

/* single drawings (no labels) for flashcards, cropped from the same artwork as the pictures above */
const CLOUD_PARTS = {
  Cirrus: ['0 0 100 56', '#bcdcf0', '<g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M18 26q22-12 44 0M30 38q26-10 52 2M24 14q18-8 38 0"/></g>'],
  Cumulus: ['100 36 80 52', '#bcdcf0', '<path d="M120 74a14 14 0 0 1 4-27 18 18 0 0 1 33 2 13 13 0 0 1 4 25z" fill="#fff"/><path d="M142 66a10 10 0 0 1 2-19 14 14 0 0 1 25 3 10 10 0 0 1 1 16z" fill="#fff" opacity=".9"/>'],
  Stratus: ['0 96 160 54', '#bcdcf0', '<rect x="12" y="104" width="130" height="16" rx="8" fill="#9aa5b1"/><rect x="30" y="124" width="100" height="12" rx="6" fill="#aab4be"/>'],
  Nimbus: ['196 50 84 80', '#bcdcf0', '<path d="M212 96a16 16 0 0 1 4-30 22 22 0 0 1 42 2 16 16 0 0 1 4 28z" fill="#6c7683"/><g stroke="#2b6cb0" stroke-width="3" stroke-linecap="round"><line x1="226" y1="104" x2="221" y2="118"/><line x1="240" y1="104" x2="235" y2="118"/><line x1="254" y1="104" x2="249" y2="118"/></g>']
};
const cloudSVG = k => { const [vb, bg, body] = CLOUD_PARTS[k], [x, y, w, h] = vb.split(' '); return `<svg viewBox="${vb}" role="img" aria-label="Drawing of a ${k.toLowerCase()} cloud"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`; };
const TOOL_PARTS = {
  'Wind vane': ['0 28 100 116', '#d6ebf5', '<g stroke="#4a5563" stroke-width="4" stroke-linecap="round"><line x1="52" y1="48" x2="52" y2="136"/><line x1="26" y1="62" x2="78" y2="62"/></g><polygon points="22,40 70,40 70,34 84,44 70,54 70,48 22,48" fill="#e4572e"/><polygon points="22,40 8,32 8,56 22,48" fill="#e4572e"/>'],
  'Anemometer': ['108 36 104 108', '#d6ebf5', '<g stroke="#4a5563" stroke-width="4" stroke-linecap="round"><line x1="160" y1="72" x2="160" y2="136"/><line x1="130" y1="72" x2="190" y2="72"/><line x1="160" y1="56" x2="160" y2="72"/></g><g fill="#f6b73c" stroke="#b9831a" stroke-width="2"><path d="M118 62a12 12 0 0 1 24 0z" transform="rotate(-20 130 62)"/><path d="M178 62a12 12 0 0 1 24 0z" transform="rotate(20 190 62)"/><path d="M148 48a12 12 0 0 1 24 0z"/></g>'],
  'Rain gauge': ['222 46 72 98', '#d6ebf5', '<rect x="236" y="62" width="44" height="74" rx="5" fill="#fff" stroke="#4a5563" stroke-width="3"/><rect x="238" y="100" width="40" height="34" fill="#6bb4e6"/><g stroke="#4a5563" stroke-width="2"><line x1="236" y1="76" x2="248" y2="76"/><line x1="236" y1="90" x2="248" y2="90"/><line x1="236" y1="104" x2="248" y2="104"/><line x1="236" y1="118" x2="248" y2="118"/></g>']
};
const toolSVG = k => { const [vb, bg, body] = TOOL_PARTS[k], [x, y, w, h] = vb.split(' '); return `<svg viewBox="${vb}" role="img" aria-label="Drawing of a ${k.toLowerCase()}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`; };
/* the letters version of each diagram, for the label quiz */
const earthLetters = () => earthSVG('letters'), cycleLetters = () => cycleSVG('letters');
/* a line graph of seven days of temperatures */
function graphSVG(temps) {
  const lo = Math.floor(Math.min(...temps) - 1), hi = Math.ceil(Math.max(...temps) + 1), W = 340, H = 200, x0 = 46, x1 = 322, y0 = 14, y1 = 164;
  const X = d => x0 + (d - 1) / 6 * (x1 - x0 - 12) + 6, Y = t => y1 - (t - lo) / (hi - lo) * (y1 - y0);
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line graph of the temperature in Celsius for days 1 to 7: ${temps.map((t, i) => 'day ' + (i + 1) + ', ' + t).join('; ')}">
    ${ticks.map(t => `<line x1="${x0}" y1="${Y(t)}" x2="${x1}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${x0 - 6}" y="${Y(t) + 4}" text-anchor="end" font-size="11" fill="var(--ink2)" font-family="inherit">${t}</text>`).join('')}
    <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="var(--ink2)" stroke-width="2"/><line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="var(--ink2)" stroke-width="2"/>
    <polyline points="${temps.map((t, i) => X(i + 1).toFixed(1) + ',' + Y(t).toFixed(1)).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="2.5"/>
    ${temps.map((t, i) => `<circle cx="${X(i + 1).toFixed(1)}" cy="${Y(t).toFixed(1)}" r="4" fill="var(--coral)"/><text x="${X(i + 1).toFixed(1)}" y="${y1 + 15}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="inherit">${i + 1}</text>`).join('')}
    <text x="${(x0 + x1) / 2}" y="${H - 2}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" font-family="inherit">day</text>
    <text transform="translate(11 ${(y0 + y1) / 2}) rotate(-90)" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)" font-family="inherit">temperature in Celsius</text></svg>`;
}
