"""Create (or refresh) a continent module's code files from the Europe module, which is the template.
   python3 _dev/world-map/make_module.py <region>        (run from the study-buddy folder)
   Reads _dev/world-map/regions/<region>.json (slug, prefix, title, adj). Writes modules/geography/<slug>/{index.html, <prefix>-map.js, <slug>.js, <slug>.css}.
   It never touches data.js or mapdata.js (those are the content and the generated outlines)."""
import json, os, re, sys
region = sys.argv[1]
cfg = json.load(open(f'_dev/world-map/regions/{region}.json'))
slug, pre, title, adj = cfg['slug'], cfg['prefix'], cfg['title'], cfg['adj']
src = 'modules/geography/europe'; dst = f'modules/geography/{slug}'
os.makedirs(dst, exist_ok=True)
def conv(t):
    t = re.sub(r'\bEuropean\b', adj, t)
    t = re.sub(r'\bEurope\b', title, t)
    t = t.replace('eu-map.js', f'{pre}-map.js').replace('europe.js', f'{slug}.js').replace('europe.css', f'{slug}.css')
    t = t.replace("module: 'europe'", f"module: '{slug}'").replace("'europe'", f"'{slug}'")
    t = t.replace('geo_eu.mjs', 'geo_region.mjs').replace('_dev/eu-map/', '_dev/world-map/')
    t = t.replace('__eu', f'__{pre}')
    t = re.sub(r'\beu-', f'{pre}-', t)
    t = re.sub(r'\beu(?=[A-Z])', pre, t)
    t = re.sub(r'\.eu-', f'.{pre}-', t)
    return t
for f, g in [('index.html', 'index.html'), ('eu-map.js', f'{pre}-map.js'), ('europe.js', f'{slug}.js'), ('europe.css', f'{slug}.css')]:
    t = conv(open(f'{src}/{f}').read())
    if f == 'index.html':
        t = t.replace('<title>', '<title>', 1)
    open(f'{dst}/{g}', 'w').write(t)
print('wrote', dst)
