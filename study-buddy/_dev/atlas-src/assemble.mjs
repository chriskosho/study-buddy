import { readFileSync, writeFileSync } from 'node:fs';
const d = new URL('./', import.meta.url);
const r = f => readFileSync(new URL(f, d), 'utf8');
const html = r('head.html') + '<script>\n"use strict";\nconst MAPDATA = ' + r('mapdata.json').trim() + ';\n' + r('data.js') + '\n' + r('core.js') + '\n' + r('cards.js') + '\n' + r('maps.js') + '\n' + r('games.js') + '\n</script>\n</body>\n</html>\n';
const out = new URL('../app/south_america_geography.html', import.meta.url);
writeFileSync(out, html);
console.log('wrote', out.pathname, html.length, 'chars');
