/* Fractions: tools. Problems and pictures come from gen.js (FRACINTRO). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.FRACINTRO, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);
  const pickOf = (...fns) => () => fns[Math.floor(Math.random() * fns.length)]();

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel; let view = 'bars';
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Pick a top number and a bottom number. Then switch between a bar, a circle, and a number line to see the same fraction.</p>
        <form class="fform" autocomplete="off"><span class="stack"><input class="textin" id="gn" inputmode="numeric" value="3" aria-label="Numerator, the top number"><span class="fl" aria-hidden="true"></span><input class="textin" id="gd" inputmode="numeric" value="4" aria-label="Denominator, the bottom number"></span>
        <div class="seg" role="group" aria-label="Picture"><button type="button" data-v="bars" aria-pressed="true">Bar</button><button type="button" data-v="circle" aria-pressed="false">Circle</button><button type="button" data-v="nl" aria-pressed="false">Number line</button></div></form>
        <div class="ferr" role="status"></div><div class="fview" aria-live="polite"></div><div class="fnotes"></div>
        <div class="rules">
          <div class="rule"><h3>Numerator and denominator</h3><p>The <b>denominator</b> (bottom) says how many equal parts the whole is cut into. The <b>numerator</b> (top) says how many of those parts you have. In <b>3/4</b>, the whole has 4 equal parts and you have 3.</p></div>
          <div class="rule"><h3>Unit fractions</h3><p>A <b>unit fraction</b> has 1 on top, like <b>1/2</b>, <b>1/3</b>, or <b>1/8</b>. It is one equal part of the whole. Every other fraction is made of unit fractions: 3/4 is 1/4 + 1/4 + 1/4.</p></div>
          <div class="rule"><h3>Equal parts only</h3><p>The parts must be the <b>same size</b>. A bar cut into 4 unequal pieces does not show fourths.</p></div>
          <div class="rule"><h3>On a number line</h3><p>Cut the space from 0 to 1 into equal steps. Each step is a unit fraction. <b>3/4</b> is 3 steps of 1/4 from 0. Fractions can go past 1 too.</p></div>
          <div class="rule"><h3>Wholes as fractions</h3><p>When the numerator and denominator are the same, you have 1 whole: <b>4/4 = 1</b>. A whole number is a fraction too: <b>3 = 6/2</b>, because each whole is 2 halves.</p></div>
          <div class="rule"><h3>Equivalent fractions</h3><p><b>Equivalent</b> fractions name the same amount: <b>1/2 = 2/4 = 4/8</b>. They sit at the same spot on the number line.</p></div>
          <div class="rule"><h3>Same denominator</h3><p>The pieces are the same size, so the one with more pieces is greater. <b>5/8 &gt; 3/8</b>.</p></div>
          <div class="rule"><h3>Same numerator</h3><p>You have the same number of pieces, so compare piece sizes. More parts in the whole means smaller pieces. <b>1/3 &gt; 1/6</b>.</p></div>
          <div class="rule"><h3>Compare with symbols</h3><p><b>&lt;</b> means less than, <b>&gt;</b> means greater than, and <b>=</b> means equal. Compare fractions only when they are parts of the same size whole.</p></div>
        </div>`;
      const show = () => {
        const err = $('.ferr', P), out = $('.fview', P), nt = $('.fnotes', P);
        const n = Number($('#gn', P).value.trim()), d = Number($('#gd', P).value.trim());
        if (!Number.isInteger(n) || !Number.isInteger(d) || $('#gn', P).value.trim() === '' || $('#gd', P).value.trim() === '') { out.innerHTML = ''; nt.innerHTML = ''; err.textContent = 'Type whole numbers in both boxes.'; return; }
        if (d < 2 || d > 12) { out.innerHTML = ''; nt.innerHTML = ''; err.textContent = 'The bottom number must be from 2 to 12.'; return; }
        if (n < 0 || n > d * 3) { out.innerHTML = ''; nt.innerHTML = ''; err.textContent = `The top number must be from 0 to ${d * 3}.`; return; }
        err.textContent = '';
        const k = Math.max(1, Math.ceil(n / d)), rows = Array.from({ length: k }, (_, i) => ({ d, on: Math.max(0, Math.min(d, n - i * d)) }));
        if (view === 'bars') out.innerHTML = G.bars(rows, `${k} bar${k === 1 ? '' : 's'}, each cut into ${d} equal parts, with ${n} part${n === 1 ? '' : 's'} shaded in all.`);
        else if (view === 'circle') out.innerHTML = `<div class="circles">${rows.map(r => G.circle(d, r.on)).join('')}</div>`;
        else out.innerHTML = G.numberline(k, d, [{ n, label: '' }], `A number line from 0 to ${k}, cut into ${d} equal parts between whole numbers, with a point at ${n}/${d}.`);
        const notes = [`<b>${n}/${d}</b> is read "${G.sayFrac(n, d)}". The <b>denominator</b> is ${d}: the whole is cut into ${d} equal parts. The <b>numerator</b> is ${n}: you have ${n} of them.`];
        if (n === 1) notes.push('This is a <b>unit fraction</b>: it is 1 equal part of the whole.');
        if (n === 0) notes.push('Zero parts is 0.');
        else if (n % d === 0) notes.push(`${n}/${d} = <b>${n / d}</b> whole${n / d === 1 ? '' : 's'}.`);
        else if (n > d) notes.push(`${n}/${d} is more than 1 whole.`);
        nt.innerHTML = notes.map(x => `<div class="fnote">${x}</div>`).join('');
      };
      P.querySelectorAll('.seg button').forEach(b => b.onclick = () => { view = b.dataset.v; P.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); show(); });
      $('.fform', P).onsubmit = e => { e.preventDefault(); show(); };
      P.querySelectorAll('.fform input').forEach(i => i.addEventListener('input', show));
      show();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const KEEP = window.__fracAnswers = {};   // test hook: the answer shown for each typed question
  const typed = it => Object.assign({}, it, { q: esc(it.q) + (it.html || ''), a: it.typed, show: String(it.typed) });
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(() => typed(fn())).map(it => { KEEP[String(it.q).replace(/<[^>]+>/g, '')] = it.show; return it; }) }); } });
  const quizTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) }); } });

  const name = quizTool('Name the fraction', 'Look at the picture and pick the fraction. The bottom number is how many equal parts.', pickOf(() => G.nameQ('bars'), () => G.nameQ('bars'), () => G.nameQ('circle'), () => G.nameQ('set'), G.unitQ));
  const numberline = quizTool('Number line', 'Count the equal steps from 0. Each step is a unit fraction.', pickOf(G.nlReadQ, G.nlPlaceQ));
  const whole = answerTool('Wholes and fractions', 'Type just the number.', pickOf(G.fracToWholeQ, G.wholeToFracQ, G.howManyQ));
  const equivalent = answerTool('Equivalent fractions', 'Type the missing top number. Both bars are the same length.', G.equivNumQ);
  const compare = quizTool('Compare fractions', 'Pick the true statement. Look at the top and bottom numbers.', pickOf(G.cmpDenQ, G.cmpNumQ, G.cmpEqQ));
  const words = quizTool('Word problems', 'Read carefully. What is the whole, and how many equal parts?', G.wordsQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const TYPES = [
    { gen: () => G.nameQ('bars'), cards: [["What do the bottom and top numbers of a fraction mean?", "The denominator (bottom) is how many equal parts the whole is cut into. The numerator (top) is how many of those parts you have. In 3/4, the whole has 4 equal parts and you have 3."], ["Why must the parts be equal?", "A fraction names equal parts of a whole. Parts that are not the same size do not show fourths, thirds, or any other fraction."]] },
    { gen: () => G.nameQ('circle'), cards: [["How do you name the shaded part of a circle?", "Count all the equal slices for the bottom number. Count the shaded slices for the top number."]] },
    { gen: () => G.nameQ('set'), cards: [["How do you name part of a group?", "Count all the things in the group for the bottom number. Count the ones you are asked about for the top number. 3 shaded out of 8 counters is 3/8."]] },
    { gen: G.unitQ, cards: [["What is a unit fraction?", "A fraction with 1 on top, like 1/2, 1/3, or 1/8. It is one equal part of the whole."], ["What is 3/4 made of?", "Three unit fractions: 1/4 + 1/4 + 1/4."]] },
    { gen: G.nlReadQ, cards: [["How do you read a fraction on a number line?", "Each space between whole numbers is cut into equal steps, and each step is a unit fraction. Count the steps from 0 to the point. 3 steps of 1/4 is 3/4."]] },
    { gen: G.nlPlaceQ, cards: [["How do you place a fraction on a number line?", "Look at the bottom number to see the size of each step. Count the number of steps shown by the top number, starting at 0."]] },
    { gen: G.fracToWholeQ, cards: [["When does a fraction equal 1 whole?", "When the numerator and the denominator are the same. 4/4 = 1, 8/8 = 1."], ["What does 6/3 equal?", "2 wholes. Each 3/3 is 1 whole, and 6 ÷ 3 = 2."]] },
    { gen: G.wholeToFracQ, cards: [["How do you write a whole number as a fraction?", "Multiply the whole number by the denominator you want. 3 = 6/2, because each whole is 2 halves and 3 × 2 = 6."]] },
    { gen: G.howManyQ, cards: [["How many fourths make 1 whole?", "4. It takes the same number of parts as the denominator: 2 halves, 3 thirds, 4 fourths, and so on."]] },
    { gen: G.equivNumQ, cards: [["What are equivalent fractions?", "Fractions that name the same amount, like 1/2 and 2/4. They are at the same spot on a number line."], ["How do you make an equivalent fraction?", "Multiply the top and the bottom by the same number. 2/3 = (2 × 2)/(3 × 2) = 4/6."]] },
    { gen: G.equivPickQ, cards: [["Does adding the same number to the top and bottom keep a fraction equal?", "No. 1/2 and 2/3 are different. Multiplying the top and bottom by the same number keeps it equal."]] },
    { gen: G.cmpDenQ, cards: [["How do you compare fractions with the same denominator?", "The pieces are the same size, so the fraction with the bigger numerator is greater. 5/8 > 3/8."]] },
    { gen: G.cmpNumQ, cards: [["How do you compare fractions with the same numerator?", "Compare the sizes of the pieces. More parts in the whole means smaller pieces, so the fraction with the smaller denominator is greater. 1/3 > 1/6."]] },
    { gen: G.cmpEqQ, cards: [["How can pictures show that two fractions are equal?", "If two bars are the same length and the same amount is shaded, the fractions are equal. 2/4 = 1/2."]] },
    { gen: G.wordsQ, cards: [["How do you solve a fraction word problem?", "Find the whole and how many equal parts it has (the denominator). Then find how many parts the problem asks about (the numerator)."], ["What does < mean?", "Less than. 3/8 < 5/8 says three eighths is less than five eighths. > means greater than, and = means equal."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about fractions. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'fractions-intro', defaults: {}, tools: { guide, cards, name, numberline, whole, equivalent, compare, words, quiz } });
})();
