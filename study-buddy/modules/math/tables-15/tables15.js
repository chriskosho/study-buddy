/* Multiplication Tables to 15: tools. Problems come from gen.js (T15GEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.T15GEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);
  const N = 15;

  /* ===================== Study guide ===================== */
  const TIPS = [['11', '10 + 1', '11 × 6 = 60 + 6 = 66'], ['12', '10 + 2', '12 × 7 = 70 + 14 = 84'], ['13', '10 + 3', '13 × 7 = 70 + 21 = 91'],
    ['14', '10 + 4', '14 × 6 = 60 + 24 = 84'], ['15', '10 + 5', '15 × 8 = 80 + 40 = 120']];
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      let rows = ''; for (let a = 1; a <= N; a++) { let row = `<th scope="row"><button type="button" data-row="${a}" aria-label="Row ${a}">${a}</button></th>`; for (let b = 1; b <= N; b++) row += `<td><button type="button" class="${a > 10 || b > 10 ? 'teen' : ''}" data-a="${a}" data-b="${b}" aria-label="${a} times ${b}">${a * b}</button></td>`; rows += `<tr>${row}</tr>`; }
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Tap a number in the chart. For anything over 10, break the big number into 10 and the rest. Tap a row or column number to light up that times table.</p>
        <div class="fguide">
          <table class="ftable" aria-label="Times table from 1 to 15"><thead><tr><th scope="col">&times;</th>${Array.from({ length: N }, (_, i) => `<th scope="col"><button type="button" data-col="${i + 1}" aria-label="Column ${i + 1}">${i + 1}</button></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
          <div><div class="fdetail" aria-live="polite"></div>
          <div class="ftips"><h3>Break the big number into 10 and the rest</h3>${TIPS.map(t => `<p><b>Times ${t[0]}:</b> ${t[1]}. ${t[2]}</p>`).join('')}</div></div>
        </div>`;
      const detail = $('.fdetail', P), btns = $$('.ftable td button', P), heads = $$('.ftable th button', P);
      const show = (a, b) => {
        const p = a * b;
        btns.forEach(x => x.classList.remove('sel', 'row', 'col')); heads.forEach(x => x.classList.remove('on'));
        btns.find(x => +x.dataset.a === a && +x.dataset.b === b).classList.add('sel');
        const st = a < 2 || b < 2 ? { why: `Any number times 1 is that number. ${a} × ${b} = ${p}.` } : G.strategy(a, b);
        const fam = a >= 2 && b >= 2 ? `<ul><li>${a} × ${b} = ${p}</li>${a === b ? '' : `<li>${b} × ${a} = ${p}</li>`}<li>${p} ÷ ${a} = ${b}</li>${a === b ? '' : `<li>${p} ÷ ${b} = ${a}</li>`}</ul>` : '';
        detail.innerHTML = `<h3>${a} × ${b} = ${p}</h3>${G.splitHTML(a, b)}${fam}<p class="fnote">${esc(st.why)}</p>`;
      };
      btns.forEach(x => x.onclick = () => show(+x.dataset.a, +x.dataset.b));
      const line = (kind, n) => { btns.forEach(x => { x.classList.remove('sel', 'row', 'col'); if (+x.dataset[kind === 'row' ? 'a' : 'b'] === n) x.classList.add(kind); }); heads.forEach(h => h.classList.toggle('on', +h.dataset[kind] === n)); };
      $$('.ftable th button[data-row]', P).forEach(h => h.onclick = () => line('row', +h.dataset.row));
      $$('.ftable th button[data-col]', P).forEach(h => h.onclick = () => line('col', +h.dataset.col));
      show(13, 7);
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(fn) }); } });
  const times = answerTool('Multiplication facts', 'Type the product. For a number over 10, break it into 10 and the rest.', G.timesQ);
  const apart = answerTool('Break it apart', 'Fill in the missing step: split the big number into 10 and the rest, then add.', G.apartQ);
  const divide = answerTool('Division facts', 'Think of the multiplication fact that goes with it.', G.divideQ);
  const missing = answerTool('Missing numbers', 'Find the number that makes the fact true.', G.missingQ);
  const words = answerTool('Word problems', 'Equal groups, rows, and sharing. Decide whether to multiply or divide.', G.wordsQ);

  /* ===================== Speed round (60 seconds) ===================== */
  let speedStop = null;
  const speed = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Speed round</h2><p class="lead">You get 60 seconds. Answer as many multiplication and division facts as you can. Each right answer is a point.</p>
        <div class="scorebar"><div class="stat"><b id="sScore">0</b><span>Score</span></div><div class="stat"><b id="sTime">60</b><span>Seconds</span></div><div class="stat"><b id="sBest">0</b><span>Best</span></div>
          <div class="seg" role="group" aria-label="How to answer"><button type="button" data-m="type" aria-pressed="true">Type</button><button type="button" data-m="tap" aria-pressed="false">Tap</button></div></div>
        <div class="fsprompt" id="sPrompt" aria-live="polite">Ready?</div>
        <form class="fsrow fsbox" id="sType" autocomplete="off"><input class="textin" id="sInput" inputmode="numeric" aria-label="Your answer" disabled><button class="btn" type="submit" id="sGo" disabled>Answer</button></form>
        <div class="fschoices fsbox" id="sTap" hidden></div>
        <p class="msg" id="sMsg">Press Start when you are ready.</p><div class="row"><button class="btn" id="sStart" type="button">Start</button></div>`;
      const S = { score: 0, time: 60, timer: null, running: false, cur: null, mode: ctx.state.speedMode || 'type' };
      const prompt = $('#sPrompt', P), input = $('#sInput', P), msg = $('#sMsg', P), tap = $('#sTap', P);
      const setMode = m => { S.mode = m; ctx.state.speedMode = m; ctx.save(); $$('.seg button', P).forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m)); $('#sType', P).hidden = m !== 'type'; tap.hidden = m !== 'tap'; if (S.running) nextQ(true); };
      const stop = silent => { clearInterval(S.timer); S.running = false; input.disabled = true; $('#sGo', P).disabled = true; tap.querySelectorAll('button').forEach(b => b.disabled = true); if (silent) { prompt.textContent = 'Ready?'; } };
      const nextQ = same => {
        if (!same || !S.cur) S.cur = G.speedQ();
        prompt.textContent = `${S.cur.text} = ?`; ctx.say(S.cur.text);
        if (S.mode === 'type') { input.value = ''; input.disabled = false; $('#sGo', P).disabled = false; input.focus(); }
        else { tap.innerHTML = G.shuffle([S.cur.a, ...S.cur.wrong]).map(n => `<button type="button" class="opt" data-n="${n}">${n}</button>`).join(''); tap.querySelectorAll('button').forEach(b => b.onclick = () => answer(+b.dataset.n)); }
      };
      const answer = n => {
        if (!S.running || !S.cur) return;
        if (n === S.cur.a) { S.score++; $('#sScore', P).textContent = S.score; ctx.credit(); ctx.sfx.good(); msg.className = 'msg good'; msg.textContent = 'Yes! ' + S.cur.text + ' = ' + S.cur.a + '.'; }
        else { ctx.slip(); ctx.sfx.bad(); msg.className = 'msg bad'; msg.textContent = S.cur.text + ' = ' + S.cur.a + '. On to the next one.'; }
        S.cur = null; nextQ();
      };
      const end = () => {
        stop(false); const prev = ctx.state.bestSpeed || 0, best = Math.max(prev, S.score);
        ctx.state.bestSpeed = best; ctx.save(); $('#sBest', P).textContent = best; ctx.result(S.score, null);
        prompt.textContent = 'Time!'; msg.className = 'msg good'; msg.textContent = 'You answered ' + S.score + ' right.' + (S.score > prev && S.score > 0 ? ' New best!' : ''); $('#sStart', P).textContent = 'Play again'; ctx.sfx.win();
      };
      const begin = () => {
        S.score = 0; S.time = 60; S.running = true; S.cur = null; $('#sScore', P).textContent = 0; $('#sTime', P).textContent = 60; msg.className = 'msg'; msg.textContent = 'Go!'; $('#sStart', P).textContent = 'Restart';
        nextQ(); clearInterval(S.timer); S.timer = setInterval(() => { S.time--; $('#sTime', P).textContent = S.time; if (S.time <= 0) end(); }, 1000);
      };
      $('#sType', P).onsubmit = e => { e.preventDefault(); const v = input.value.trim().replace(/,/g, ''); if (v === '') return; answer(Number(v)); };
      $$('.seg button', P).forEach(b => b.onclick = () => setMode(b.dataset.m));
      $('#sStart', P).onclick = begin; $('#sBest', P).textContent = ctx.state.bestSpeed || 0;
      setMode(S.mode); speedStop = () => stop(true);
    },
    leave() { if (speedStop) speedStop(); }
  };

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const toMC = f => () => { const q = f(); return { q: q.q, a: String(q.a), wrong: q.wrong.map(String), why: q.why, say: q.say }; };
  const TYPES = [
    { gen: toMC(G.timesQ), cards: [
      ['How do you find 13 × 7?', 'Break 13 into 10 and 3. 10 × 7 = 70 and 3 × 7 = 21. 70 + 21 = 91.'],
      ['How do you multiply by 11?', 'Break 11 into 10 and 1. 11 × 6 = 60 + 6 = 66.'],
      ['How do you multiply by 12?', 'Break 12 into 10 and 2. 12 × 7 = 70 + 14 = 84.'],
      ['How do you multiply by 14?', 'Break 14 into 10 and 4. 14 × 6 = 60 + 24 = 84. Or double the 7s: 7 × 6 = 42, and 42 + 42 = 84.'],
      ['How do you multiply by 15?', 'Break 15 into 10 and 5. 15 × 8 = 80 + 40 = 120. The 5 part is half of the 10 part.'],
      ['What are the square numbers from 11 × 11 to 15 × 15?', '11 × 11 = 121, 12 × 12 = 144, 13 × 13 = 169, 14 × 14 = 196, 15 × 15 = 225.'],
      ['Does the order matter, like 13 × 7 and 7 × 13?', 'No. Both are 91. Pick the order that is easier: break the bigger number apart.']] },
    { gen: toMC(G.apartQ), cards: [['How do you multiply two numbers over 10, like 13 × 14?', 'Break one into 10 and the rest: 13 × 14 = (13 × 10) + (13 × 4) = 130 + 52 = 182.']] },
    { gen: toMC(G.divideQ), cards: [['How do you divide, like 156 ÷ 12?', 'Think: what times 12 makes 156? 12 × 10 = 120, and 156 − 120 = 36. 36 ÷ 12 = 3, so the answer is 10 + 3 = 13.']] },
    { gen: toMC(G.missingQ), cards: [['How do you find a missing number, like 12 × ? = 144?', 'Divide the product by the number you know. 144 ÷ 12 = 12, so the missing number is 12.']] },
    { gen: toMC(G.wordsQ), cards: [['How do you solve an equal groups problem?', 'Multiply the number of groups by the number in each group. 14 boxes of 6 pencils: 14 × 6 = 84.'], ['How do you solve a sharing problem?', 'Divide the total by the number of groups. 84 pencils shared among 14 friends: 84 ÷ 14 = 6.']] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about the tables to 15. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'tables-15', defaults: {}, tools: { guide, cards, times, apart, divide, missing, words, speed, quiz } });
})();
