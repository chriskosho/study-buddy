/* Multiplication and Division Facts: tools. Problems come from gen.js (FACTSGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.FACTSGEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      const cells = []; for (let a = 0; a <= 10; a++) { let row = ''; for (let b = 0; b <= 10; b++) row += `<td><button type="button" data-a="${a}" data-b="${b}" aria-label="${a} times ${b}">${a * b}</button></td>`; cells.push(`<tr><th scope="row"><button type="button" data-row="${a}" aria-label="Row ${a}">${a}</button></th>${row}</tr>`); }
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Tap a number in the chart to see its array and the facts that go with it. Tap a row or column number to light up that times table.</p>
        <div class="fguide">
          <table class="ftable" aria-label="Times table from 0 to 10"><thead><tr><th scope="col">&times;</th>${Array.from({ length: 11 }, (_, b) => `<th scope="col"><button type="button" data-col="${b}" aria-label="Column ${b}">${b}</button></th>`).join('')}</tr></thead><tbody>${cells.join('')}</tbody></table>
          <div class="fdetail" aria-live="polite"></div>
        </div>
        <div class="frules">
          <div class="frule"><h3>Times 0 and times 1</h3><p>Any number times <b>0</b> is 0. Any number times <b>1</b> is that number. <b>8 × 0 = 0</b> and <b>8 × 1 = 8</b>.</p></div>
          <div class="frule"><h3>Times 2: doubles</h3><p>Times 2 is a double. <b>2 × 7</b> is 7 + 7 = <b>14</b>.</p></div>
          <div class="frule"><h3>Times 5: count by 5s</h3><p>The answers end in 0 or 5. <b>5 × 6</b>: 5, 10, 15, 20, 25, <b>30</b>.</p></div>
          <div class="frule"><h3>Times 10</h3><p>Put a 0 after the other number. <b>10 × 7 = 70</b>.</p></div>
          <div class="frule"><h3>Times 9</h3><p>Do times 10, then take away one group. <b>9 × 7</b>: 70 − 7 = <b>63</b>. The digits of each answer add up to 9: 6 + 3 = 9.</p></div>
          <div class="frule"><h3>Break it apart</h3><p><b>6 × 7</b>: 6 = 5 + 1. 5 × 7 = 35 and 1 × 7 = 7. 35 + 7 = <b>42</b>.</p></div>
          <div class="frule"><h3>Order does not matter</h3><p><b>3 × 8 = 8 × 3 = 24</b>. Turn an array on its side and it has the same number of dots, so you only need to learn half the chart.</p></div>
          <div class="frule"><h3>Division is multiplication backwards</h3><p><b>56 ÷ 7</b>: what times 7 makes 56? 7 × 8 = 56, so <b>56 ÷ 7 = 8</b>. You cannot divide by 0.</p></div>
          <div class="frule"><h3>Fact families</h3><p>Three numbers make four facts: 6 × 7 = 42, 7 × 6 = 42, 42 ÷ 6 = 7, 42 ÷ 7 = 6.</p></div>
          <div class="frule"><h3>Even and odd</h3><p>If either number is even, the product is even. Only odd × odd is odd: <b>3 × 7 = 21</b>.</p></div>
        </div>`;
      const detail = $('.fdetail', P), btns = $$('.ftable td button', P), heads = $$('.ftable th button', P);
      const show = (a, b) => {
        const p = a * b;
        btns.forEach(x => { x.classList.remove('sel', 'row', 'col'); }); heads.forEach(x => x.classList.remove('on'));
        const me = btns.find(x => +x.dataset.a === a && +x.dataset.b === b); me.classList.add('sel');
        detail.innerHTML = `<h3>${a} × ${b} = ${p}</h3>
          <div class="fpic">${G.arraySVG(Math.max(a, 1), Math.max(b, 1)).replace('class="farr"', a && b ? 'class="farr"' : 'class="farr" style="opacity:.25"')}</div>
          ${a && b ? `<ul><li>${a} × ${b} = ${p}</li><li>${b} × ${a} = ${p}</li>${a === b ? '' : ''}<li>${p} ÷ ${a} = ${b}</li><li>${p} ÷ ${b} = ${a}</li></ul>` : `<ul><li>${a} × ${b} = 0</li><li>${b} × ${a} = 0</li></ul><p class="fnote">Any number times 0 is 0. You cannot divide by 0, so there are no division facts for this one.</p>`}
          <p class="fnote">${esc(G.strategy(a, b).why)}</p>`;
      };
      btns.forEach(x => x.onclick = () => show(+x.dataset.a, +x.dataset.b));
      const line = (kind, n) => { btns.forEach(x => { x.classList.remove('sel', 'row', 'col'); if (+x.dataset[kind === 'row' ? 'a' : 'b'] === n) x.classList.add(kind); }); heads.forEach(h => h.classList.toggle('on', h.dataset[kind] === String(n))); detail.innerHTML = `<h3>The ${n} times table</h3><p class="fnote">${Array.from({ length: 11 }, (_, i) => `${kind === 'row' ? n : i} × ${kind === 'row' ? i : n} = ${n * i}`).join('<br>')}</p>`; };
      $$('.ftable th button[data-row]', P).forEach(h => h.onclick = () => line('row', +h.dataset.row));
      $$('.ftable th button[data-col]', P).forEach(h => h.onclick = () => line('col', +h.dataset.col));
      show(7, 8);
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const withPic = it => (it.html ? Object.assign({}, it, { q: `${esc(it.q)}${it.html}` }) : it);
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(fn).map(withPic) }); } });
  const quizTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) }); } });
  const times = answerTool('Multiplication facts', 'Type the product. Use the tricks in the study guide if you need them.', G.timesQ);
  const divide = answerTool('Division facts', 'Think of the multiplication fact that goes with it.', G.divideQ);
  const missing = answerTool('Missing numbers', 'Find the number that makes the fact true.', G.missingQ);
  const families = quizTool('Fact families', 'Three numbers make four facts. Pick the best answer.', G.familiesQ);
  const words = answerTool('Word problems', 'Equal groups, arrays, and sharing. Decide whether to multiply or divide.', () => pickOf(G.wordsQ, G.wordsQ, G.arrayQ));
  function pickOf(...fns) { return fns[Math.floor(Math.random() * fns.length)](); }

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
      const stop = silent => { clearInterval(S.timer); S.running = false; input.disabled = true; $('#sGo', P).disabled = true; tap.querySelectorAll('button').forEach(b => b.disabled = true); if (silent) { prompt.textContent = 'Ready?'; $('#sStart', P).textContent = 'Start'; } };
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
  const toMC = f => () => { const q = f(); return { q: q.q, html: q.html, a: String(q.a), wrong: q.wrong.map(String), why: q.why, say: q.say }; };
  const TYPES = [
    { gen: toMC(G.timesQ), cards: [["What is any number times 0?", "0. Zero groups, or zero in each group, is nothing. 8 × 0 = 0."], ["What is any number times 1?", "The same number. 8 × 1 = 8."], ["How do you do times 2?", "Double the number. 2 × 7 is 7 + 7 = 14."], ["How do you do times 5?", "Count by 5s. The answers end in 0 or 5. 5 × 6: 5, 10, 15, 20, 25, 30."], ["How do you do times 10?", "Put a 0 after the other number. 10 × 7 = 70."], ["How do you do times 9?", "Do times 10, then take away one group. 9 × 7: 70 − 7 = 63."], ["How do you do times 3 and times 4?", "Times 3: double, then add one more group (3 × 6 is 12 + 6 = 18). Times 4: double, then double again (4 × 6 is 12 + 12 = 24)."], ["How can you find 6 × 7 if you do not remember it?", "Break 6 into 5 and 1. 5 × 7 = 35 and 1 × 7 = 7. 35 + 7 = 42."], ["Does the order of the numbers matter in multiplication?", "No. 3 × 8 = 8 × 3 = 24."]] },
    { gen: toMC(G.divideQ), cards: [["How do you find 56 ÷ 7?", "Think of the multiplication fact: what times 7 makes 56? 7 × 8 = 56, so 56 ÷ 7 = 8."], ["What is a number divided by 1?", "The same number. 9 ÷ 1 = 9."], ["Can you divide by 0?", "No. You cannot share something into 0 groups."]] },
    { gen: toMC(G.missingQ), cards: [["How do you find a missing number, like 6 × ? = 42?", "Divide the product by the number you know. 42 ÷ 6 = 7, so the missing number is 7."], ["How do you find ? ÷ 6 = 7?", "Multiply: 7 × 6 = 42, so the missing number is 42."]] },
    { gen: G.familyFactQ, cards: [["What is a fact family?", "Three numbers that make four facts. 6, 7, and 42 make 6 × 7 = 42, 7 × 6 = 42, 42 ÷ 6 = 7, and 42 ÷ 7 = 6."]] },
    { gen: G.familyTrioQ, cards: [["How can you tell if three numbers make a fact family?", "The two small numbers must multiply to make the big one. 4, 9, and 36 work because 4 × 9 = 36."]] },
    { gen: G.familyCompleteQ, cards: [["How do you complete a fact family?", "Use the same three numbers. If 6 × 7 = 42 and 42 ÷ 6 = 7, the last fact is 42 ÷ 7 = 6."]] },
    { gen: () => G.patternQ(), cards: [["What pattern do the 9 times table answers have?", "Their digits add up to 9: 18 (1 + 8), 27 (2 + 7), 36 (3 + 6), and so on."], ["What do the 5 times table answers end in?", "0 or 5."], ["When is a product odd?", "Only when both numbers are odd. 3 × 7 = 21. If either number is even, the product is even."]] },
    { gen: toMC(G.wordsQ), cards: [["How do you solve an equal groups problem?", "Multiply the number of groups by the number in each group. 4 boxes of 6 pencils: 4 × 6 = 24."], ["How do you solve a sharing problem?", "Divide the total by the number of groups. 24 shared among 4 friends: 24 ÷ 4 = 6 each."], ["How do you find how many groups fit?", "Divide the total by the size of each group. 24 pencils, 6 in each box: 24 ÷ 6 = 4 boxes."]] },
    { gen: toMC(G.arrayQ), cards: [["What is an array?", "Objects in equal rows and columns. 3 rows of 5 dots show 3 × 5 = 15."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about multiplication and division facts. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'facts', defaults: {}, tools: { guide, cards, times, divide, missing, families, speed, words, quiz } });
})();
