/* Area and Perimeter: tools. Pictures and problems come from gen.js (APGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.APGEN, esc = SB.esc;
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* a typed question: the words, then the picture (if any) */
  const typed = p => ({ q: esc(p.text) + p.pic, a: p.a, show: p.show, why: p.why, hint: p.hint, say: p.say });
  /* the same problem as multiple choice for the Quiz (every problem carries its wrong options) */
  const toMC = p => ({ q: p.text, html: p.pic || undefined, a: p.show, wrong: p.wrongShow, why: p.why, say: p.say });
  const answerTool = (title, lead, fn) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind: 'number', rounds: 10, build: () => many(() => typed(fn())) }); } });
  const randomOf = fns => () => fns[Math.floor(Math.random() * fns.length)]();

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Slide the length and the width. The squares, the area, and the perimeter change with them.</p>
        <div class="apguide"><div class="apview"></div>
          <div><div class="apctl">
            <label for="ap-l">Length</label><input id="ap-l" type="range" min="1" max="12" value="7"><output id="ap-lo" for="ap-l">7</output>
            <label for="ap-w">Width</label><input id="ap-w" type="range" min="1" max="12" value="4"><output id="ap-wo" for="ap-w">4</output></div>
            <div class="apout" aria-live="polite"></div></div>
            <div class="rules">
              <div class="rule"><h3>Area</h3><p>Area is how much flat space a shape covers. We count <b>square units</b>. One row of squares times the number of rows: <b>length &times; width</b>.</p></div>
              <div class="rule"><h3>Perimeter</h3><p>Perimeter is the distance <b>around</b> a shape. Add up every side. We measure it in <b>units</b>.</p></div>
              <div class="rule"><h3>Rectangles</h3><p>Opposite sides are equal. Perimeter = length + width + length + width.</p></div>
              <div class="rule"><h3>Missing side</h3><p>Area: divide the area by the side you know. Perimeter: subtract the known side twice (both sides that match it), then split what is left between the other two sides.</p></div>
              <div class="rule"><h3>Same, but different</h3><p>Rectangles with the same perimeter can have different areas. Rectangles with the same area can have different perimeters.</p></div>
              <div class="rule"><h3>Shapes made of rectangles</h3><p>Split the shape into rectangles. Find each area. Then <b>add</b> them.</p></div>
            </div></div>`;
      const l = $('#ap-l', P), w = $('#ap-w', P), out = $('.apout', P), view = $('.apview', P);
      const draw = () => {
        const L = +l.value, W = +w.value;
        $('#ap-lo', P).textContent = L; $('#ap-wo', P).textContent = W;
        view.innerHTML = G.gridPic(L, W, null);
        out.innerHTML = `<p>Area: ${L} &times; ${W} = <b>${L * W} ${G.sq(L * W)}</b></p><p>Perimeter: ${L} + ${W} + ${L} + ${W} = <b>${2 * (L + W)} ${G.un(2 * (L + W))}</b></p>`;
      };
      l.oninput = w.oninput = draw; draw();
    }
  };

  const count = answerTool('Count the squares', 'Each square is 1 square unit. Type the area. Just the number.', () => G.countQ());
  const area = answerTool('Area of rectangles', 'Type the area. Just the number.', () => G.areaQ());
  const perimeter = answerTool('Perimeter', 'Type the perimeter. Just the number.', () => G.perimQ());
  const missing = answerTool('Find the missing side', 'Type the length of the missing side. Just the number.', () => G.missingQ());
  const composite = answerTool('Shapes made of rectangles', 'Split the shape into rectangles, then add. Type the area.', () => G.compositeQ());
  const words = answerTool('Word problems', 'Decide if it asks for area or perimeter. Type the number.', () => G.wordsQ());
  const compare = { init(ctx) { SBT.quiz(ctx, { title: 'Compare rectangles', lead: 'Same perimeter or same area? Pick the best answer.', rounds: 10, build: () => many(() => toMC(G.compareQ())) }); } };

  /* ---- Quiz and Flashcards: one list of question types serves both, so every type has a card ---- */
  const TYPES = [
    { gen: () => G.countQ(), cards: [["What is area?", "How much flat space a shape covers. We count square units."], ["How do you find the area of a rectangle?", "Multiply the length by the width. 7 × 4 = 28 square units."]] },
    { gen: () => G.areaQ(), cards: [["Why does length times width work?", "A rectangle is rows of squares. 4 rows with 7 squares in each row is 4 × 7 square units."]] },
    { gen: () => G.perimQ(), cards: [["What is perimeter?", "The distance around a shape. Add up all of its sides. We measure it in units."], ["How do you find the perimeter of a rectangle?", "Length + width + length + width. A rectangle 7 by 4 has perimeter 7 + 4 + 7 + 4 = 22 units."], ["How do you find the perimeter of a square?", "A square has 4 equal sides. Multiply the side by 4."]] },
    { gen: () => G.missingQ(), cards: [["How do you find a missing side when you know the area?", "Divide the area by the side you know. If the area is 24 and one side is 4, the other side is 24 ÷ 4 = 6."], ["How do you find a missing side when you know the perimeter?", "Subtract the known side twice (both sides that match it) from the perimeter. Then split what is left between the other two sides. If the perimeter is 20 and one side is 6: 20 − 6 − 6 = 8, and 8 ÷ 2 = 4."]] },
    { gen: () => G.compareQ(), cards: [["Can rectangles with the same perimeter have different areas?", "Yes. A 5 by 1 rectangle and a 3 by 3 rectangle both have perimeter 12, but their areas are 5 and 9 square units."], ["Can rectangles with the same area have different perimeters?", "Yes. A 2 by 6 rectangle and a 3 by 4 rectangle both have area 12 square units, but their perimeters are 16 and 14 units."]] },
    { gen: () => G.compositeQ(), cards: [["How do you find the area of an L-shaped figure?", "Split it into two rectangles. Find the area of each by multiplying. Then add the two areas."]] },
    { gen: () => G.wordsQ(), cards: [["How do you know if a problem asks for area or perimeter?", "Covering a flat space (carpet, paint, tiles) is area. Going around the edge (fence, ribbon, border) is perimeter."], ["What is the difference between square units and units?", "Area is measured in square units. Perimeter and side lengths are measured in units."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'Questions about area and perimeter. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => toMC(t.gen())), build: () => many(() => toMC(randomOf(TYPES.map(t => t.gen))())) }); } };

  SBM.start({ module: 'area-perimeter', defaults: {}, tools: { guide, cards, count, area, perimeter, missing, compare, composite, words, quiz } });
})();
