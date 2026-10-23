from playwright.sync_api import sync_playwright
import os; S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'standalone') + '/'
STUB="""
window.__said=[];window.__cancels=0;
window.SpeechSynthesisUtterance=function(t){this.text=t;};
Object.defineProperty(window,'speechSynthesis',{value:{speak:u=>{window.__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),700)},cancel(){window.__cancels++}},configurable:true});
"""
errors=[]
fails=[]
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ')+msg)
    if not cond: fails.append(msg)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1440,'height':900}); pg.add_init_script(STUB)
    pg.on('pageerror',lambda e:errors.append(str(e))); pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    pg.goto('file://'+S+'south_america_geography.html')
    print('hidden tabs:', pg.eval_on_selector_all('nav.tabs button[hidden]','e=>e.map(x=>x.dataset.tab)'))
    print('nav scrolls?', pg.evaluate("(()=>{const n=document.querySelector('nav.tabs');return n.scrollWidth>n.clientWidth})()"))
    pg.screenshot(path='/tmp/atlas_u1_cards.png')
    check(pg.evaluate('document.documentElement.scrollHeight - window.innerHeight') <= 0, 'cards: no page scroll at 1440x900')
    # flip must not speak; icon plays once with fill state
    pg.click('#fcard'); pg.wait_for_timeout(600)
    check(pg.evaluate('window.__said') == [], 'flipping a card says nothing')
    pg.click('#faceB .spk'); pg.wait_for_timeout(100)
    print('playing class on:', pg.evaluate("document.querySelector('#faceB .spk').classList.contains('playing')"), '| said:', pg.evaluate('window.__said'))
    pg.screenshot(path='/tmp/atlas_u1b_playing.png')
    pg.wait_for_timeout(900)
    check(not pg.evaluate("document.querySelector('#faceB .spk').classList.contains('playing')"), 'speaker stops lighting up when the name ends')
    pg.click('#faceB .spk'); pg.wait_for_timeout(100); c0=pg.evaluate('window.__cancels')
    pg.click('#fcard'); pg.wait_for_timeout(100)   # flip back mid-play
    print('flip stops sound:', pg.evaluate('window.__cancels')>c0, '| playing cleared:', pg.evaluate("document.querySelectorAll('.spk.playing').length")==0)
    pg.wait_for_timeout(900)
    check(len(pg.evaluate('window.__said')) == 2, 'sound plays only from the speaker button (2 plays, no repeats)')
    for tab in ['study','drag','find','listen','spell']:
        pg.click(f'[data-tab={tab}]'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'/tmp/atlas_u2_{tab}.png')
        check(pg.evaluate('document.documentElement.scrollHeight - window.innerHeight') <= 0 and not pg.evaluate('document.documentElement.scrollWidth > window.innerWidth'), tab+': no scroll at 1440x900')
    pg.click('[data-tab=cards]'); pg.click('#cardMode [data-mode=flag]'); pg.screenshot(path='/tmp/atlas_u3_flagcard.png')
    pg.set_viewport_size({'width':1000,'height':800}); pg.click('[data-tab=cards]'); pg.click('#cardMode [data-mode=shape]'); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/atlas_u4_small.png'); check(not pg.evaluate('document.documentElement.scrollWidth > window.innerWidth'), '1000x800: no sideways scroll')
    b.close()
errors=[e for e in errors if 'Failed to load resource' not in e]
check(not errors, f'no page errors {errors}')
print('ALL PASSED' if not fails else f'{len(fails)} FAILED'); raise SystemExit(1 if fails else 0)
