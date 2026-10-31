/* Notepad utility (it was the Scratch pad until November 2026): the same notepad the math tools use, with no question on it, for any
   homework or notes. It opens full screen on a desktop. Notes are saved the same way (to the student's profile, or downloaded), and the
   saved ones are listed here. */
(function () {
  'use strict';
  const kid = SB.requireProfile(); if (!kid) return;
  const app = document.getElementById('app');
  SB.shell({ utility: 'Notepad' });
  app.innerHTML = `<section class="panel"><div class="np-top"><h2>Notepad</h2><button type="button" class="btn" id="npOpen">Open the notepad</button></div>
    <p class="lead">Type, draw, and add shapes on paper that never runs out. Use it for any homework or notes. Save what you want to keep, or download it as a PDF, Word document, text file, or picture.</p>
    <div class="np-notes" id="npNotes"></div></section>`;
  const btn = document.getElementById('npOpen'), box = document.getElementById('npNotes');
  const draw = () => SBPad.renderList(box, { onOpen: (note, scope) => SBPad.open({ note, scope, source: note.mod || 'Notepad', opener: btn, onClose: draw, full: true }) });
  const open = () => SBPad.open({ source: 'Notepad', opener: btn, onClose: draw, full: true });
  btn.onclick = open;
  draw(); open();
})();
