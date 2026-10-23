/* Study Buddy build. Run from anywhere:  node _dev/build.mjs
   1. Assembles each module that has a source folder (South America for now).
   2. Writes sw.js with the list of site files and a version, so phones get updates and work offline.
   Node built-ins only. */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEV = dirname(fileURLToPath(import.meta.url));
const SITE = join(DEV, '..');
const r = f => readFileSync(f, 'utf8');

/* ---- 1. Explorer's Atlas (South America) ---- */
{
  const s = join(DEV, 'atlas-src');
  const html = r(join(s, 'head.html')) + '<script>\n"use strict";\nconst MAPDATA = ' + r(join(s, 'mapdata.json')).trim() + ';\n' +
    ['data.js', 'core.js', 'cards.js', 'maps.js', 'games.js'].map(f => r(join(s, f))).join('\n') + '\n</script>\n</body>\n</html>\n';
  const out = join(SITE, 'modules/geography/south-america/index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  mkdirSync(join(DEV, 'standalone'), { recursive: true });
  writeFileSync(join(DEV, 'standalone/south_america_geography.html'), html);   // still works when double-clicked on its own
  console.log('built', relative(SITE, out), html.length, 'chars');
}

/* ---- 2. Offline file list ---- */
const skip = new Set(['_dev', 'sw.js', 'README.md', '.git', 'node_modules', '.DS_Store', 'netlify.toml']);
const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir).sort()) {
    if (skip.has(n) || n.startsWith('.')) continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p) : files.push(relative(SITE, p).split('\\').join('/'));
  }
})(SITE);
const hash = createHash('sha1'); files.forEach(f => hash.update(f).update(readFileSync(join(SITE, f))));
const version = hash.digest('hex').slice(0, 10);
const sw = r(join(DEV, 'sw.template.js')).replace('__VERSION__', version).replace('__FILES__', JSON.stringify(['./', ...files], null, 2));
writeFileSync(join(SITE, 'sw.js'), sw);
console.log('sw.js version', version, 'with', files.length, 'files');
