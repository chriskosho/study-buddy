/* Newton and His Laws: Experiments. Small animated demos of the lesson. Practice only: no credit and no result.
   Wording on screen is the lesson's own. Numbers (pushes, masses) are made-up units, not real measurements. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let raf = 0;
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const calm = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* run step(dt) each frame until it returns false; with reduced motion, jump straight to the end */
  function loop(step, done) {
    stop();
    if (calm()) { let n = 0; while (n++ < 4000 && step(0.02) !== false); done && done(); return; }
    let last = performance.now();
    const f = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (step(dt) === false) { raf = 0; done && done(); return; } raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
  }
  const ARROW = (x1, y1, x2, y2, cls) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 9, p = (t) => [x2 - h * Math.cos(a + t), y2 - h * Math.sin(a + t)];
    const l = p(0.5), r = p(-0.5);
    return `<g class="arw ${cls || ''}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><path d="M${x2} ${y2}L${l[0].toFixed(1)} ${l[1].toFixed(1)}L${r[0].toFixed(1)} ${r[1].toFixed(1)}Z"/></g>`;
  };

  /* ---------- 1. A rolling ball (first law) ---------- */
  const SURF = [['ice', 'Ice', 25], ['grass', 'Grass', 110], ['sand', 'Sand', 260], ['space', 'No friction', 0]];
  function ballLab(box) {
    let surf = 'grass', x = 40, v = 0, state = 'rest';
    box.innerHTML = `<div class="lstage"><svg class="lsvg" viewBox="0 0 640 220" role="img" aria-label="A soccer ball on a field, next to a goalpost">
        <rect class="gnd" x="-1000" y="150" width="2640" height="70"/>
        <path class="post" d="M592 150V72H622V150"/>
        <g class="ball"><circle r="18" class="bfill"/><path class="bpatch" d="M0 -9 L8.5 -2.8 L5.3 7.3 L-5.3 7.3 L-8.5 -2.8Z"/></g>
        <g class="fric" hidden>${ARROW(30, 168, 8, 168, 'bad')}<text x="38" y="172" class="lbl">friction</text></g>
        <text class="stlbl" x="320" y="44" text-anchor="middle">At rest</text></svg></div>
      <div class="lctl"><div class="seg" role="group" aria-label="What the ball rolls on">${SURF.map(([id, n]) => `<button data-s="${id}" aria-pressed="${id === surf}">${n}</button>`).join('')}</div>
        <button class="btn" data-a="go">Kick the ball</button><button class="btn ghost" data-a="reset">Put it back</button></div>
      <p class="lmsg" aria-live="polite"></p>`;
    const svg = $('svg', box), g = $('.ball', svg), gnd = $('.gnd', svg), fr = $('.fric', svg), lab = $('.stlbl', svg), msg = $('.lmsg', box), go = $('[data-a=go]', box);
    const draw = () => { g.setAttribute('transform', `translate(${x.toFixed(1)},132)`); fr.setAttribute('transform', `translate(${(x - 40).toFixed(1)},0)`); };
    const set = (st, text) => { state = st; lab.textContent = { rest: 'At rest', move: 'In motion' }[st] || 'At rest'; msg.textContent = text; };
    const reset = () => { stop(); x = 40; v = 0; fr.hidden = true; go.disabled = false; set('rest', 'The ball is at rest. It will not move unless someone kicks it or something else applies force to it.'); draw(); };
    gnd.setAttribute('class', 'gnd ' + surf);
    $$('[data-s]', box).forEach(b => b.onclick = () => { surf = b.dataset.s; $$('[data-s]', box).forEach(o => o.setAttribute('aria-pressed', o === b)); gnd.setAttribute('class', 'gnd ' + surf); reset(); });
    $('[data-a=reset]', box).onclick = reset;
    go.onclick = () => {
      reset(); go.disabled = true; v = 300; const mu = SURF.find(s => s[0] === surf)[2];
      set('move', 'The ball is in motion. A moving soccer ball will keep moving until something stops it.'); fr.hidden = !mu;
      loop(dt => {
        v = Math.max(0, v - mu * dt); x += v * dt;
        if (x >= 572) { x = 572; v = 0; draw(); return false; }
        draw(); return v > 0.5;
      }, () => {
        fr.hidden = true; go.disabled = false; draw();
        set('rest', x >= 572 ? 'The goalpost stopped it. An object in motion tends to stay in motion unless an outside force acts on it.'
          : 'Because of friction, the ball eventually stopped rolling. It will stay at rest until another force makes it move.');
      });
    };
    reset();
  }

  /* ---------- 2. Push it (second law) ---------- */
  const THINGS = [['toy', 'Toy car', 1, 46, 26], ['box', 'Empty box', 2, 52, 42], ['books', 'Box of books', 6, 66, 54], ['car', 'Full-sized car', 10, 118, 48]];
  function pushLab(box) {
    let sel = 'toy', force = 5, x = 30;
    const thing = () => THINGS.find(t => t[0] === sel);
    box.innerHTML = `<div class="lstage"><svg class="lsvg" viewBox="0 0 640 220" role="img" aria-label="An object on a track with a finish line"><rect class="gnd road" x="-1000" y="170" width="2640" height="50"/>
        <line class="fin" x1="612" y1="120" x2="612" y2="170"/><text class="lbl" x="612" y="112" text-anchor="middle">finish</text><g class="obj"></g></svg></div>
      <div class="lctl"><div class="seg" role="group" aria-label="What to push">${THINGS.map(t => `<button data-t="${t[0]}" aria-pressed="${t[0] === sel}">${t[1]}</button>`).join('')}</div></div>
      <div class="lctl"><label class="slab">Your push <input type="range" min="1" max="10" value="${force}" aria-label="How hard you push"></label>
        <button class="btn" data-a="go">Push</button><button class="btn ghost" data-a="reset">Put it back</button></div>
      <div class="bars" aria-hidden="true"><div><span>Your push</span><div class="lbar"><i class="b1"></i></div></div><div><span>Force needed to move it quickly</span><div class="lbar"><i class="b2"></i></div></div></div>
      <p class="lmsg" aria-live="polite"></p>`;
    const svg = $('svg', box), og = $('.obj', svg), msg = $('.lmsg', box), go = $('[data-a=go]', box), rng = $('input', box);
    const shape = () => {
      const [id, name, m, w, h] = thing();
      const wheels = (id === 'toy' || id === 'car') ? `<circle class="wh" cx="${w * 0.25}" cy="0" r="${h * 0.22}"/><circle class="wh" cx="${w * 0.75}" cy="0" r="${h * 0.22}"/>` : '';
      const body = id === 'box' ? `<rect class="bx" y="${-h}" width="${w}" height="${h}"/><path class="ln" d="M0 ${-h}L${w} 0M${w} ${-h}L0 0"/>`
        : id === 'books' ? `<rect class="bx" y="${-h}" width="${w}" height="${h}"/><path class="ln" d="M0 ${-h * 0.66}H${w}M0 ${-h * 0.33}H${w}"/>`
        : `<rect class="bx" y="${-h * 0.9}" width="${w}" height="${h * 0.7}" rx="8"/>${id === 'car' ? `<path class="bx" d="M${w * 0.22} ${-h * 0.9}L${w * 0.34} ${-h}H${w * 0.66}L${w * 0.8} ${-h * 0.9}Z"/>` : ''}`;
      og.innerHTML = body + wheels + `<text class="lbl" x="${w / 2}" y="${-h - 8}" text-anchor="middle">${name}</text>`;
    };
    const place = () => og.setAttribute('transform', `translate(${x.toFixed(1)},${id0()})`);
    const id0 = () => 168 - (thing()[0] === 'toy' || thing()[0] === 'car' ? thing()[4] * 0.22 : 0);
    const bars = () => { $('.b1', box).style.width = force * 10 + '%'; $('.b2', box).style.width = thing()[2] * 10 + '%'; };
    const reset = () => { stop(); x = 30; go.disabled = false; shape(); place(); bars(); msg.textContent = 'Pick something to push, choose how hard to push, then press Push. The heavier the object, the more force it takes to move it.'; };
    $$('[data-t]', box).forEach(b => b.onclick = () => { sel = b.dataset.t; $$('[data-t]', box).forEach(o => o.setAttribute('aria-pressed', o === b)); reset(); });
    rng.oninput = () => { force = +rng.value; bars(); };
    $('[data-a=reset]', box).onclick = reset;
    go.onclick = () => {
      reset(); go.disabled = true; const [, name, m, w] = thing(), a = force / m * 26, end = 612 - w; let t = 0;
      loop(dt => { t += dt; x = Math.min(end, 30 + 0.5 * a * t * t); place(); return t < 2.5 && x < end; }, () => {
        go.disabled = false; const far = x >= end - 1;
        msg.textContent = far ? `Your push was enough, so the ${name.toLowerCase()} moved all the way. Try a heavier object with the same push.`
          : force >= m ? `Your push was enough, and the ${name.toLowerCase()} moved a good way. A heavier object needs more force.`
          : `The ${name.toLowerCase()} is heavy, so your push moved it only a little. The heavier the object, the more force it takes to move it.`;
      });
    };
    reset();
  }

  /* ---------- 3. A rocket (third law) ---------- */
  function rocketLab(box) {
    let force = 3, y = 0, parts = [];
    box.innerHTML = `<div class="lstage"><svg class="lsvg" viewBox="0 0 640 260" role="img" aria-label="A rocket on a launch pad with two equal arrows: the rocket pushes gas down and the gas pushes the rocket up">
        <rect class="gnd road" x="-1000" y="236" width="2640" height="24"/><g class="gas"></g>
        <g class="rkt"><path class="bx" d="M320 78C336 98 340 130 340 168V214H300V168C300 130 304 98 320 78Z"/><path class="bx" d="M300 190L282 222H300ZM340 190L358 222H340Z"/><circle class="wh" cx="320" cy="140" r="9"/>
          <g class="arrs"></g></g></svg></div>
      <div class="lctl"><label class="slab">Engine force <input type="range" min="1" max="5" value="${force}" aria-label="How strong the engine is"></label>
        <button class="btn" data-a="go">Launch</button><button class="btn ghost" data-a="reset">Back to the pad</button></div>
      <p class="lmsg" aria-live="polite"></p>`;
    const svg = $('svg', box), r = $('.rkt', svg), gas = $('.gas', svg), arrs = $('.arrs', svg), msg = $('.lmsg', box), go = $('[data-a=go]', box), rng = $('input', box);
    const arrows = () => { const L = 14 + force * 14; arrs.innerHTML = ARROW(262, 120, 262, 120 + L, 'bad') + `<text class="lbl" x="254" y="${120 + L / 2}" text-anchor="end">Rocket pushes gas down</text>`
      + ARROW(378, 190, 378, 190 - L, 'good') + `<text class="lbl" x="386" y="${190 - L / 2}">Gas pushes rocket up</text>`; };
    const draw = () => { r.setAttribute('transform', `translate(0,${(-y).toFixed(1)})`); gas.innerHTML = parts.map(p => `<circle class="puff" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" opacity="${p.o.toFixed(2)}"/>`).join(''); };
    const reset = () => { stop(); y = 0; parts = []; go.disabled = false; arrows(); draw(); msg.textContent = 'When a rocket launches, it pushes hot gas out of its engines. The hot gas pushes back on the rocket with the same amount of force.'; };
    rng.oninput = () => { force = +rng.value; if (!raf) arrows(); };
    $('[data-a=reset]', box).onclick = reset;
    go.onclick = () => {
      reset(); go.disabled = true; let v = 0, t = 0; const a = force * 45;
      loop(dt => {
        t += dt; v += a * dt; y += v * dt;
        if (!calm()) for (let i = 0; i < 2; i++) parts.push({ x: 308 + Math.random() * 24, y: 222 - y + 6, vy: 120 + Math.random() * 120, r: 3 + Math.random() * 4, o: 0.9 });
        parts.forEach(p => { p.y += p.vy * dt; p.r += dt * 6; p.o -= dt * 0.9; }); parts = parts.filter(p => p.o > 0 && p.y < 262);
        draw(); return y < 290 && t < 8;
      }, () => { parts = []; draw(); go.disabled = false; msg.textContent = 'The rocket pushed the hot gas down, and the gas pushed the rocket up with the same amount of force. For every action, there is an equal and opposite reaction.'; });
    };
    reset();
  }

  /* ---------- 4. Scale, proportion, quantity ---------- */
  function sizeLab(box) {
    let size = 5, mass = 5;
    box.innerHTML = `<div class="l3">
      <div class="lcard"><h4>Scale</h4><svg class="lsvg2" viewBox="0 0 220 130" role="img" aria-label="Earth drawn bigger than the moon, with a longer gravity arrow from Earth">
          <circle class="earth" cx="62" cy="62" r="50"/><circle class="moon" cx="176" cy="62" r="14"/>
          ${ARROW(62, 120, 62, 80, 'good')}${ARROW(176, 120, 176, 100, 'good')}<text class="lbl" x="62" y="14" text-anchor="middle">Earth</text><text class="lbl" x="176" y="38" text-anchor="middle">moon</text></svg>
        <p>Scale is how big or small something is. The force of gravity is greater from Earth, which is bigger.</p></div>
      <div class="lcard"><h4>Proportion</h4><label class="slab">Mass <input class="rm" type="range" min="1" max="10" value="${mass}" aria-label="How much mass the object has"></label>
        <div class="lane" aria-hidden="true"><span class="dot"></span></div><div class="bars"><div><span>Speed</span><div class="lbar"><i class="bs"></i></div></div></div>
        <p class="pp">The more mass an object has, the slower it would move. The less mass, the faster it would go.</p></div>
      <div class="lcard"><h4>Quantity</h4><label class="slab">Size of the system <input class="rs" type="range" min="1" max="10" value="${size}" aria-label="How big the system is"></label>
        <div class="bars"><div><span>Amount of force</span><div class="lbar"><i class="bf"></i></div></div></div>
        <p class="pq">The amount of force in a system increases when the system is bigger.</p></div></div>`;
    const dot = $('.dot', box);
    const upd = () => { $('.bs', box).style.width = (110 - mass * 10) + '%'; $('.bf', box).style.width = size * 10 + '%'; dot.style.animationDuration = (0.4 + mass * 0.35).toFixed(2) + 's'; };
    $('.rm', box).oninput = e => { mass = +e.target.value; upd(); };
    $('.rs', box).oninput = e => { size = +e.target.value; upd(); };
    upd();
  }

  const EXPS = [['ball', 'Rolling ball', 'Newton’s first law', ballLab], ['push', 'Push it', 'Newton’s second law', pushLab], ['rocket', 'Rocket', 'Newton’s third law', rocketLab], ['size', 'Scale, proportion, quantity', 'Table 5.1', sizeLab]];
  window.labTool = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Experiments</h2><p class="lead">Try each one and watch what happens. Practice only.</p>
        <div class="seg gtabs" role="group" aria-label="Experiment">${EXPS.map((e, i) => `<button data-e="${e[0]}" aria-pressed="${i === 0}">${e[1]}</button>`).join('')}</div><div class="lbody"></div>`;
      const body = $('.lbody', P);
      const show = id => { stop(); const e = EXPS.find(x => x[0] === id); body.innerHTML = `<div class="lhead"><h3>${e[1]}</h3><span class="lawtag">${e[2]}</span></div><div class="lbox"></div>`; e[3]($('.lbox', body)); };
      $$('.gtabs button', P).forEach(b => b.onclick = () => { $$('.gtabs button', P).forEach(x => x.setAttribute('aria-pressed', x === b)); show(b.dataset.e); });
      show('ball');
    },
    leave() { stop(); }
  };
})();
