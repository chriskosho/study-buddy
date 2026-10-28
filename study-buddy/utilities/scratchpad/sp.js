/* Scratch pad utility: the same scratch pad the math tools use, but with no question on it, for any homework.
   Notes are saved the same way (to the student's profile, or a picture), and the saved ones are listed here. */
(function () {
  'use strict';
  const kid = SB.requireProfile(); if (!kid) return;
  const app = document.getElementById('app');
  SB.shell({ utility: 'Scratch pad' });
  app.innerHTML = `<section class="panel"><div class="sp-top"><h2>Scratch pad</h2><button type="button" class="btn" id="spOpen">Open the scratch pad</button></div>
    <p class="lead">Draw, type, or work things out on paper that never runs out. It is not tied to any question, so use it for any homework. Save what you want to keep.</p>
    <div class="sp-notes" id="spNotes"></div></section>`;
  const btn = document.getElementById('spOpen'), box = document.getElementById('spNotes');
  const draw = () => SBPad.renderList(box, { onOpen: (note, scope) => SBPad.open({ note, scope, source: note.mod || 'Scratch pad', opener: btn, onClose: draw }) });
  const open = () => SBPad.open({ source: 'Scratch pad', opener: btn, onClose: draw });
  btn.onclick = open;
  draw(); open();
})();
