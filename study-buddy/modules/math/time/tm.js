/* Telling Time and Elapsed Time: tools. Problems and clock pictures come from gen.js (TIMEGEN). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const G = window.TIMEGEN, esc = SB.esc, pad = n => String(n).padStart(2, '0');
  const many = (fn, n = 10) => SBT.many(fn, n);

  /* ===================== Study guide ===================== */
  const guide = {
    init(ctx) {
      const P = ctx.panel; let h = 4, m = 35;
      P.innerHTML = `<h2>Study guide</h2><p class="lead">Set the clock. Type a time like 4:35, or use the buttons, and see it three ways.</p>
        <div class="tmguide">
          <div class="tmg-clock" id="tmgClock"></div>
          <div class="tmg-side">
            <form class="tmform" autocomplete="off"><input class="textin" inputmode="numeric" value="4:35" aria-label="Time to show on the clock"><button class="btn small" type="submit">Set the clock</button></form>
            <div class="derr" role="status"></div>
            <div class="tmbtns" role="group" aria-label="Move the clock hands">
              <span class="tmlbl">Hour</span><button class="btn small ghost" type="button" data-d="h-1" aria-label="One hour less">−</button><button class="btn small ghost" type="button" data-d="h+1" aria-label="One hour more">+</button>
              <span class="tmlbl">Minutes</span><button class="btn small ghost" type="button" data-d="m-5" aria-label="Five minutes less">−5</button><button class="btn small ghost" type="button" data-d="m-1" aria-label="One minute less">−1</button><button class="btn small ghost" type="button" data-d="m+1" aria-label="One minute more">+1</button><button class="btn small ghost" type="button" data-d="m+5" aria-label="Five minutes more">+5</button>
            </div>
            <div class="tmshow" aria-live="polite"><div><span>Digital</span><b id="tmgDig"></b></div><div><span>In words</span><b id="tmgWords"></b></div><div><span>Hour hand</span><b id="tmgH"></b></div><div><span>Minute hand</span><b id="tmgM"></b></div></div>
          </div>
        </div>
        <div class="rules">
          <div class="rule"><h3>The two hands</h3><p>The <b>short hand</b> is the hour hand. The <b>long hand</b> is the minute hand. The short hand moves slowly: halfway between two numbers means it is about half past.</p></div>
          <div class="rule"><h3>Count the minutes by 5s</h3><p>Each number on the clock is 5 minutes. The 1 is 5, the 2 is 10, the 3 is 15, and so on up to the 12, which is 0 or 60. The small marks between the numbers are single minutes: count on from the last number.</p></div>
          <div class="rule"><h3>Quarter past, half past, quarter to</h3><p>Minute hand on the 3: <b>quarter past</b> (15 minutes). On the 6: <b>half past</b> (30 minutes). On the 9: <b>quarter to</b> the next hour (45 minutes). On the 12: <b>o'clock</b>.</p></div>
          <div class="rule"><h3>Past and to</h3><p>Up to 30 minutes, say how many minutes <b>past</b> the hour. After 30, say how many minutes are left <b>to</b> the next hour. 4:35 is 25 minutes to 5.</p></div>
          <div class="rule"><h3>a.m. and p.m.</h3><p><b>a.m.</b> is from midnight to noon. <b>p.m.</b> is from noon to midnight. 12:00 at night is midnight, and 12:00 in the day is noon.</p></div>
          <div class="rule"><h3>Elapsed time</h3><p>Elapsed time is how much time passes. Count up from the start: first to the next hour, then whole hours, then the minutes left. 3:40 to 5:15 is 20 minutes + 1 hour + 15 minutes = <b>1 hour 35 minutes</b>.</p></div>
          <div class="rule"><h3>What time will it be?</h3><p>Add the hours first, then the minutes. If the minutes pass the hour, go up to the hour and add what is left. 2:50 plus 25 minutes: 10 minutes to 3:00, then 15 more is <b>3:15</b>. To go back in time, subtract the same way.</p></div>
          <div class="rule"><h3>One hour, one minute</h3><p>1 hour = 60 minutes. A day has 24 hours: 12 hours for a.m. and 12 hours for p.m.</p></div>
        </div>`;
      const draw = () => {
        $('#tmgClock', P).innerHTML = G.clockSVG(h, m, `The clock shows ${h}:${pad(m)}.`);
        $('#tmgDig', P).textContent = `${h}:${pad(m)}`; $('#tmgWords', P).textContent = G.timeWords(h, m);
        $('#tmgH', P).textContent = m === 0 ? `points to the ${h}` : m >= 45 ? `almost at the ${h % 12 + 1}` : `just past the ${h}`;
        $('#tmgM', P).textContent = m === 0 ? 'points to the 12' : `${m} minutes (${m % 5 ? `${Math.floor(m / 5)} fives and ${m % 5} more` : `the ${m / 5}`})`;
        $('.tmform .textin', P).value = `${h}:${pad(m)}`;
      };
      $('.tmform', P).onsubmit = e => { e.preventDefault(); try { const t = G.parseTime($('.tmform .textin', P).value); h = t.h; m = t.m; $('.derr', P).textContent = ''; draw(); } catch (er) { $('.derr', P).textContent = er.message; } };
      P.querySelectorAll('.tmbtns button').forEach(b => b.onclick = () => {
        const [k, s, n] = [b.dataset.d[0], b.dataset.d[1], +b.dataset.d.slice(2)], sign = s === '-' ? -1 : 1;
        if (k === 'h') h = ((h - 1 + sign * n + 12) % 12) + 1; else { let tot = h * 60 + m + sign * n; tot = ((tot % 720) + 720) % 720; const hh = Math.floor(tot / 60) % 12; h = hh || 12; m = tot % 60; }
        $('.derr', P).textContent = ''; draw();
      });
      draw();
    }
  };

  /* ===================== Practice tools ===================== */
  const KEEP = window.__tmAnswers = {};   // test hook: the answer shown for each question (the tests also work answers out on their own)
  const answerTool = (title, lead, fn, kind) => ({ init(ctx) { SBT.answer(ctx, { title, lead, kind, rounds: 10, build: () => many(fn).map(it => { KEEP[String(it.plain || it.q).replace(/<[^>]+>/g, '')] = it.show; return it; }) }); } });
  const quizTool = (title, lead, fn) => ({ init(ctx) { SBT.quiz(ctx, { title, lead, rounds: 10, build: () => many(fn) }); } });
  const pickOf = (...fns) => () => fns[Math.floor(Math.random() * fns.length)]();

  /* typed questions become multiple choice in the Quiz */
  const toMC = f => () => {
    const q = f();
    if (!(q.wrong && q.show != null)) return q;
    const svg = (String(q.q).match(/<svg[\s\S]*<\/svg>/) || [''])[0];
    const text = String(q.plain || q.q).replace(/<[^>]+>/g, '').replace(/ Type it like 4:35\./, '').replace(/ Type it like 4:35 ?/, '');
    return { q: text, html: (q.html || '') + svg, a: q.show, wrong: q.wrong, why: q.why, say: q.say };
  };

  const read = answerTool('Read the clock', 'Type the time like 4:35. You can also type 435 or 4 35.', G.readQ, 'text');
  const pick = quizTool('Pick the clock', 'Find the clock that shows the time.', G.pickQ);
  const ampm = quizTool('a.m. or p.m.', 'Pick the time that makes sense for what is happening.', G.ampmQ);
  const elapsed = quizTool('Elapsed time', 'How much time passes? Count up from the start time.', pickOf(toMC(G.elapsedQ), G.hmQ));
  const later = answerTool('What time will it be?', 'Add or subtract the time. Type the answer like 4:35 (no a.m. or p.m.).', G.laterQ, 'text');
  const words = quizTool('Word problems', 'Schedules, practice, and recess. Work out the time.', G.wordsQ);

  /* ---- Quiz (Random 10 or One of each) and Flashcards: one list of question types serves both, so every type has a card ---- */
  const TYPES = [
    { gen: toMC(G.readQ), cards: [["Which hand tells the hour, and which tells the minutes?", "The short hand is the hour hand. The long hand is the minute hand."], ["How do you read the minutes on a clock?", "Count by fives for each number the minute hand passes (the 1 is 5, the 2 is 10, the 3 is 15). Then count the small marks past that number."], ["Where does the hour hand point at 4:35?", "Between the 4 and the 5, past the halfway mark. The hour hand moves a little as the minutes pass, so it is not on a number."]] },
    { gen: G.pickQ, cards: [["What do the numbers on the clock mean for the minute hand?", "Each number is 5 minutes. The 3 is 15 minutes, the 6 is 30 minutes, and the 9 is 45 minutes."], ["What do quarter past, half past, and quarter to mean?", "Quarter past is 15 minutes after the hour. Half past is 30 minutes after. Quarter to is 15 minutes before the next hour, which is 45 minutes after."]] },
    { gen: G.ampmQ, cards: [["What do a.m. and p.m. mean?", "a.m. is from midnight to noon. p.m. is from noon to midnight."], ["Is 12:00 at night a.m. or p.m.?", "12:00 at night is midnight, and the new day starts, so it is a.m. 12:00 in the middle of the day is noon, which is p.m."]] },
    { gen: toMC(G.elapsedQ), cards: [["What is elapsed time?", "How much time passes from a start time to an end time."], ["How do you find elapsed time?", "Count up from the start: first to the next hour, then whole hours, then the minutes left. Add the jumps. 3:40 to 5:15 is 20 minutes + 1 hour + 15 minutes = 1 hour 35 minutes."]] },
    { gen: G.hmQ, cards: [["How many minutes are in an hour?", "60 minutes."], ["How do you say 95 minutes in hours and minutes?", "1 hour 35 minutes, because 60 + 35 = 95."]] },
    { gen: toMC(G.laterQ), cards: [["How do you find what time it will be after adding time?", "Add the hours first, then the minutes. If the minutes pass the hour, go up to the hour and add what is left. 2:50 plus 25 minutes: 10 minutes to 3:00, then 15 more is 3:15."], ["How do you find what time it was before?", "Go back the hours first, then the minutes. If the minutes go back past the hour, go back to the hour and subtract what is left."]] },
    { gen: G.wordsQ, cards: [["How do you solve a time word problem?", "Find the start time and what you are looking for: the end time, the start time, or how long. Use a number line and count up (or back) in jumps: to the hour, whole hours, then minutes."]] }
  ];
  const cards = { init(ctx) { SBT.flashcards(ctx, { lead: 'Tap the card to flip it. These are the rules and facts the questions use.', build: () => SBT.shuffle(TYPES.flatMap(t => t.cards)).map(([q, a]) => ({
    front: `<div class="tag">Rule or fact</div><div class="defline">${esc(q)}</div>`, back: `<div class="tag">Answer</div><div class="defline">${esc(a)}</div>${ctx.sayButton(q + ' ' + a, 'Hear it')}`, say: q })) }); } };
  const quiz = { init(ctx) { SBT.quiz(ctx, { title: 'Quiz', lead: 'Questions about clocks and elapsed time. Random 10 mixes them up; One of each asks every kind once.', rounds: 10, fullLabel: 'One of each', full: () => TYPES.map(t => t.gen()), build: () => many(() => TYPES[Math.floor(Math.random() * TYPES.length)].gen()) }); } };

  SBM.start({ module: 'time', defaults: {}, tools: { guide, cards, read, pick, ampm, elapsed, later, words, quiz } });
})();
