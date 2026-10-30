/* Add and Subtract Fractions (Dimensions Math 5, chapter 4): tools. Problems come from gen.js (FRACGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.FRACGEN, esc = SB.esc;
  const many = SBT.many, shuffle = SBT.shuffle;   // n different questions for a round
  const F = G.F;

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel, f = (n, d) => G.html({ n, d }, 'improper')   // shown exactly as written, not reduced;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Fill in two fractions or mixed numbers to see every step. A whole number goes in the small box on the left; the top and bottom go above and below the line.</p>
        <form class="fgform" autocomplete="off">${SBT.fracBox('First fraction or mixed number', '1/2')}<select aria-label="Add or subtract"><option value="+">+</option><option value="-">&minus;</option></select>${SBT.fracBox('Second fraction or mixed number', '1/3')}<button class="btn small" type="submit">Show the steps</button></form>
        <div class="fgout" aria-live="polite"></div>
        <div class="rules">
          <div class="rule"><h3>A fraction is a division</h3><p><b>3 &divide; 4 = ${f(3, 4)}</b>: 3 shared among 4 equal parts, so each part is ${f(3, 4)}.</p><p>When the top is bigger, you get a mixed number: <b>7 &divide; 3 = ${f(7, 3)} = ${G.html(F(7, 3))}</b>. If it divides evenly, you get a whole number: 8 &divide; 4 = 2.</p></div>
          <div class="rule"><h3>Pieces must be the same size</h3><p>To add or subtract, the denominators must match. Find a <b>common denominator</b>: a number both denominators go into.</p><p>${f(1, 2)} + ${f(1, 3)}: both go into 6. ${f(1, 2)} = ${f(3, 6)} and ${f(1, 3)} = ${f(2, 6)}, so ${f(3, 6)} + ${f(2, 6)} = <b>${f(5, 6)}</b>.</p>${G.bars(F(1, 2), F(1, 3))}</div>
          <div class="rule"><h3>Subtract unlike fractions</h3><p>Same idea: ${f(3, 4)} &minus; ${f(1, 6)}. Both go into 12. ${f(3, 4)} = ${f(9, 12)} and ${f(1, 6)} = ${f(2, 12)}, so ${f(9, 12)} &minus; ${f(2, 12)} = <b>${f(7, 12)}</b>.</p>${G.bars(F(3, 4), F(1, 6))}</div>
          <div class="rule"><h3>Improper fractions and mixed numbers</h3><p>An <b>improper fraction</b> has a top that is at least as big as the bottom, like ${f(17, 5)}. A <b>mixed number</b> is a whole number and a fraction, like ${G.html(F(17, 5))}.</p><p>${f(17, 5)}: 17 &divide; 5 = 3 with 2 left over, so it is <b>${G.html(F(17, 5))}</b>. Back again: (3 &times; 5) + 2 = 17 fifths.</p><p>Simplest form: keep dividing the top and bottom by the same number until only 1 goes into both. ${f(6, 8)} = <b>${f(3, 4)}</b>.</p></div>
          <div class="rule"><h3>Add mixed numbers</h3><p>${G.html(F(7, 3))} + ${G.html(F(17, 4))}: ${f(1, 3)} = ${f(4, 12)} and ${f(1, 4)} = ${f(3, 12)}. Add the wholes: 2 + 4 = 6. Add the fractions: ${f(4, 12)} + ${f(3, 12)} = ${f(7, 12)}. The answer is <b>${G.html(F(79, 12))}</b>.</p><p>If the fractions make 1 or more, regroup: ${f(3, 4)} + ${f(2, 3)} = ${f(17, 12)} = ${G.html(F(17, 12))}, so add the 1 to the wholes. You can add in any order, so look for fractions that make a whole.</p></div>
          <div class="rule"><h3>Subtract mixed numbers</h3><p>If the first fraction is too small, <b>rename 1 whole</b>.</p><p>${G.html(F(17, 4))} &minus; ${G.html(F(5, 3))}: ${f(1, 4)} = ${f(3, 12)} and ${f(2, 3)} = ${f(8, 12)}. ${f(3, 12)} is less than ${f(8, 12)}. 1 whole = ${f(12, 12)}, and ${f(3, 12)} + ${f(12, 12)} = ${f(15, 12)}, so 4 ${f(3, 12)} = 3 ${f(15, 12)}. Subtract the wholes: 3 &minus; 1 = 2. Subtract the fractions: ${f(15, 12)} &minus; ${f(8, 12)} = ${f(7, 12)}. The answer is <b>${G.html(F(31, 12))}</b>.</p></div>
        </div>`;
      const parse = raw => {
        const t = raw.trim().replace(/\s+/g, ' '); let m;
        if ((m = t.match(/^(\d+) (\d+) ?\/ ?(\d+)$/))) return +m[3] && +m[2] < +m[3] ? { v: { n: +m[1] * +m[3] + +m[2], d: +m[3] }, mixed: true } : null;   // kept as typed, not reduced
        if ((m = t.match(/^(\d+) ?\/ ?(\d+)$/))) return +m[2] ? { v: { n: +m[1], d: +m[2] }, mixed: false } : null;
        if ((m = t.match(/^(\d+)$/))) return { v: { n: +m[1], d: 1 }, mixed: true };
        return null;
      };
      const show = () => {
        const [a, b] = [...P.querySelectorAll('.fgform .fbox')].map(i => parse(i.value)), op = $('.fgform select', P).value, out = $('.fgout', P);
        if (!a || !b || a.v.d > 24 || b.v.d > 24 || a.v.n > 500 || b.v.n > 500) { out.textContent = 'Check the boxes. A fraction needs both a top and a bottom number, and the bottom cannot be 0. (Mixed numbers need a proper fraction part, and keep the denominators to 24 or less.)'; return; }
        if (op === '-' && G.cmp(a.v, b.v) < 0) { out.textContent = 'The first number must be at least as big as the second to subtract.'; return; }
        const mixed = a.mixed || b.mixed;
        const res = op === '+' ? G.add(a.v, b.v) : G.sub(a.v, b.v);
        const showBars = !mixed && a.v.n < a.v.d && b.v.n < b.v.d && a.v.d !== b.v.d;
        out.innerHTML = `<p>${G.html(a.v, a.mixed ? 'mixed' : 'improper')} ${op === '+' ? '+' : '&minus;'} ${G.html(b.v, b.mixed ? 'mixed' : 'improper')} = <b>${G.html(res)}</b></p><p>${SBT.stackText(G.whyTwo(op, a.v, b.v, mixed))}</p>${showBars ? G.bars(a.v, b.v) : ''}`;
      };
      SBT.wireFrac(P);
      $('.fgform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const fa = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'fraction', rounds: 10, build: () => many(fn) }); } });
  const FORM = ' Whole number in the small box, fraction top and bottom in the others.';
  const division = fa('Fractions and division', 'A fraction bar means divide. Share the top number among the bottom number.' + FORM, G.divisionQ);
  const models = { init(ctx) { SBT.quiz(ctx, { title: 'Use the models', lead: 'The dashed lines cut both bars into same-size pieces. Pick the answer.', rounds: 10, build: () => many(G.modelQ) }); } };
  const improper = fa('Improper fractions and mixed numbers', 'Change between improper fractions and mixed numbers. Reduce to simplest form.' + FORM, G.improperQ);
  const unlike = fa('Unlike denominators', 'Find a common denominator, then add or subtract. Write the answer in simplest form.' + FORM, G.unlikeQ);
  const mixedadd = fa('Add mixed numbers', 'Add the whole numbers and the fractions, and regroup when the fractions make 1 or more.' + FORM, G.mixedAddQ);
  const mixedsub = fa('Subtract mixed numbers', 'Rename 1 whole when the first fraction is too small.' + FORM, () => G.mixedSubQ(Math.random() < 0.6));
  const words = fa('Word problems', 'Decide whether to add or subtract, then solve.' + FORM, G.wordsQ);
  const review = fa('Mixed review', 'Missing numbers, three fractions at once, and bigger mixed numbers.' + FORM, G.reviewQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of problem types serves both, so every type has a card ---- */
  const TYPES = [
    { name: "Fractions and division", gen: G.divisionQ, cards: [["What does a fraction bar mean?", "Divide. 3/4 = 3 ÷ 4. Sharing 3 among 4 gives 3/4 each."]] },
    { name: "Improper fractions and mixed numbers", gen: G.improperQ, cards: [["How do you change an improper fraction to a mixed number?", "Divide the top by the bottom. The answer is the whole number, and the remainder goes over the bottom. 11/4 = 2 3/4."], ["How do you change a mixed number to an improper fraction?", "Multiply the whole number by the bottom, add the top, and keep the bottom. 2 3/4 = (2 × 4 + 3)/4 = 11/4."]] },
    { name: "Unlike denominators", gen: G.unlikeQ, cards: [["How do you add or subtract fractions with unlike denominators?", "Find a common denominator, rename both fractions, then add or subtract the tops. Simplify at the end."]] },
    { name: "Add mixed numbers", gen: G.mixedAddQ, cards: [["How do you add mixed numbers?", "Add the whole numbers, add the fractions, and regroup if the fractions make 1 or more."]] },
    { name: "Subtract mixed numbers", gen: () => G.mixedSubQ(Math.random() < 0.5), cards: [["What do you do when the fraction in a subtraction is too small?", "Rename 1 whole as a fraction (like 4/4) and add it to the fraction, then subtract."]] },
    { name: "Word problems", gen: G.wordsQ, cards: [["How do you decide whether to add or subtract in a word problem?", "Putting together or finding the total means add. Taking away or finding the difference means subtract."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the problems use.', build: () => shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.answer(ctx, { title: 'Quiz', lead: 'One problem from each kind in this module. Random 10 mixes them up; One of each asks every kind once.' + FORM, kind: 'fraction', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'fractions-add-sub', defaults: {}, tools: { guide, cards, division, models, improper, unlike, mixedadd, mixedsub, words, review, quiz } });
})();
