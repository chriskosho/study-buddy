/* Order of Operations: tools. Problems and the step-by-step stepper come from gen.js (ORDERGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.ORDERGEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const NOTE = d => {
    const where = d.group ? `inside the ${d.group}: ` : '';
    return `${where}${G.stepText(d)}`;
  };
  function stepsHTML(tokens) {
    const ch = G.chain(tokens);
    return `<ol class="oosteps">${ch.map((s, i) => `<li class="${i === ch.length - 1 ? 'last' : ''}"><span class="st">${esc(G.render(s.tokens))}</span><span class="nt">${i === 0 ? 'Start' : esc(NOTE(s.did))}${i === ch.length - 1 ? '. Done.' : ''}</span></li>`).join('')}</ol>`;
  }
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Type an expression and see every step. Use whole numbers, + − × ÷, and ( ) [ ] { }.</p>
        <form class="ooform" autocomplete="off"><input class="textin" value="{ 6 + [ 18 ÷ (5 − 2) ] } × 2" aria-label="An expression to work out step by step"><button class="btn small" type="submit">Show steps</button></form>
        <div class="ooerr" role="status"></div><div class="oout" aria-live="polite"></div>
        <div class="ladder">
          <div class="rung"><h3><span class="no">1</span>Grouping symbols</h3><p>Work inside ( ) parentheses, [ ] brackets, and { } braces first. When they are nested, start with the innermost.</p></div>
          <div class="rung"><h3><span class="no">2</span>Multiply and divide</h3><p>Next, × and ÷. They have the same rank, so go <b>left to right</b>.</p></div>
          <div class="rung"><h3><span class="no">3</span>Add and subtract</h3><p>Last, + and −. They have the same rank too, so go <b>left to right</b>.</p></div>
        </div>
        <div class="rules">
          <div class="rule"><h3>Not always multiply first</h3><p><b>24 ÷ 4 × 3</b>: go left to right. 24 ÷ 4 = 6, then 6 × 3 = <b>18</b>. (Doing 4 × 3 first would give 2, which is wrong.)</p></div>
          <div class="rule"><h3>Not always add first</h3><p><b>20 − 5 + 3</b>: go left to right. 20 − 5 = 15, then 15 + 3 = <b>18</b>. (Doing 5 + 3 first would give 12, which is wrong.)</p></div>
          <div class="rule"><h3>Grouping symbols change the answer</h3><p><b>3 + 4 × 5</b> = 3 + 20 = <b>23</b>. <b>(3 + 4) × 5</b> = 7 × 5 = <b>35</b>. The parentheses make the addition happen first.</p></div>
          <div class="rule"><h3>Words to expressions</h3><p>&ldquo;Add 8 and 7, then multiply by 2&rdquo; is <b>(8 + 7) × 2</b>. You need the parentheses so the adding comes first.</p></div>
          <div class="rule"><h3>Read it without working it out</h3><p><b>3 × (18,932 + 921)</b> is 3 times as large as 18,932 + 921. You can tell from the signs, without adding.</p></div>
          <div class="rule"><h3>Whole numbers only</h3><p>These problems always come out as whole numbers, so you never get a fraction or a number below zero along the way.</p></div>
        </div>`;
      const show = () => {
        const err = $('.ooerr', P), out = $('.oout', P);
        try { const t = G.parse($('.ooform input', P).value); out.innerHTML = stepsHTML(t); err.textContent = ''; }
        catch (e) { out.innerHTML = ''; err.textContent = e.message; }
      };
      $('.ooform', P).onsubmit = e => { e.preventDefault(); show(); };
      show();
    }
  };

  /* ===================== Tools built on the shared builders ===================== */
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(fn) }); } });
  const quizTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) }); } });
  const first = quizTool('What comes first?', 'Pick the part to work out first.', G.firstQ);
  const plain = answerTool('No grouping symbols', 'Multiply and divide first, then add and subtract. Go left to right.', G.plainQ);
  const next = quizTool('Next step', 'Do only the first step. Pick what is left.', G.nextQ);
  const parens = answerTool('Parentheses', 'Work inside the parentheses first.', G.parensQ);
  const nested = answerTool('Brackets and parentheses', 'Work inside the innermost symbols first.', G.nestedQ);
  const WORD_KINDS = [G.writeQ, G.writeQ, G.readQ, G.readQ, G.interpretQ];
  const words = quizTool('Words and expressions', 'Match words to expressions, and compare without working it out.', () => WORD_KINDS[Math.floor(Math.random() * WORD_KINDS.length)]());
  const braces = answerTool('Braces, brackets, and parentheses', 'Three layers: start in the middle and work out.', G.bracesQ);
  const fit = quizTool('Add parentheses', 'Find where the parentheses make it true.', G.fitQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const toMC = f => () => { const q = f(); return { q: q.plain, qh: q.q, a: String(q.a), wrong: q.wrong.map(String), why: q.why, say: q.say }; };
  const TYPES = [
    { gen: G.firstQ, cards: [["What do you work out first?", "Anything inside grouping symbols: ( ) parentheses, [ ] brackets, and { } braces. If they are nested, start with the innermost."], ["What if there are no grouping symbols?", "Multiply and divide first, going left to right. Then add and subtract, going left to right."]] },
    { gen: toMC(G.plainQ), cards: [["Do you always multiply before you divide?", "No. × and ÷ have the same rank, so go left to right. 24 ÷ 4 × 3 = 6 × 3 = 18."], ["Do you always add before you subtract?", "No. + and − have the same rank, so go left to right. 20 − 5 + 3 = 15 + 3 = 18."], ["What is 3 + 4 × 5?", "23. Multiply first: 4 × 5 = 20, then 3 + 20 = 23. Going left to right instead (7 × 5 = 35) is wrong."]] },
    { gen: G.nextQ, cards: [["What is one step?", "One operation. Work it out, write the answer in its place, and copy the rest of the expression. 6 + 3 × 2 becomes 6 + 6."]] },
    { gen: toMC(G.parensQ), cards: [["What do parentheses do?", "They tell you to work inside them first. 3 + 4 × 5 = 23, but (3 + 4) × 5 = 35."]] },
    { gen: toMC(G.nestedQ), cards: [["What do brackets [ ] do?", "Brackets are a second layer of grouping, used around parentheses. Work the parentheses inside first, then the brackets. [2 × (3 + 4)] = [2 × 7] = 14."]] },
    { gen: toMC(G.bracesQ), cards: [["What do braces { } do?", "Braces are the third layer of grouping, used around brackets. Work from the innermost out: parentheses, then brackets, then braces."]] },
    { gen: G.writeQ, cards: [["How do you write \"Add 8 and 7, then multiply by 2\"?", "(8 + 7) × 2. The parentheses make the adding happen first."], ["How do you write \"Multiply 4 by 5, then add 3\"?", "4 × 5 + 3. You do not need parentheses, because multiplying already comes first."]] },
    { gen: G.readQ, cards: [["What does (9 + 8) × 3 say in words?", "Add 9 and 8, then multiply by 3."], ["Which words describe 15 − 4 × 2?", "Multiply 4 by 2, then subtract the product from 15."]] },
    { gen: G.interpretQ, cards: [["How does 4 × (125 + 38) compare to 125 + 38?", "It is 4 times as large. Multiplying a sum by 4 makes it 4 times as large, and you do not need to add to see that."], ["How does (125 + 38) ÷ 4 compare to 125 + 38?", "It is one fourth as large."]] },
    { gen: G.fitQ, cards: [["How do you find where parentheses belong?", "Try each place and work it out. Only one place gives the number you want. 2 + 3 × 4 = 14, but (2 + 3) × 4 = 20."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'One question of each kind about the order of operations. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'order-of-operations', defaults: {}, tools: { guide, cards, first, plain, next, parens, nested, words, braces, fit, quiz } });
})();
