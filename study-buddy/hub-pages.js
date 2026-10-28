/* Study Buddy hub pages: Settings, Help, FAQ, About.
   hub.js calls HUBPAGES.<name>(app, kid) to fill the page. All of the writing here is for admins and kids, so keep it plain. */
(function () {
  'use strict';
  const SB = window.SB, esc = SB.esc;
  const top = (title, sub) => `<header class="top"><h1><span>${esc(title)}</span></h1>${sub ? `<div class="row"><span class="hint">${sub}</span></div>` : ''}</header>`;

  /* ---------- Settings ---------- */
  const OPTS = [
    { group: 'Display', items: [
      ['theme', 'Theme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match device']]],
      ['font', 'Font', [['standard', 'Standard'], ['dyslexic', 'OpenDyslexic']]],
      ['size', 'Text size', [['normal', 'Normal'], ['large', 'Larger']]]] },
    { group: 'Sound', items: [
      ['sound', 'Sound effects', [[true, 'On'], [false, 'Off']]]] }
  ];
  const seg = (k, label, vals) => `<div class="setrow"><span id="lbl-${k}">${label}</span><div class="seg" role="group" aria-labelledby="lbl-${k}">${vals.map(([v, t]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(SB.getSetting(k)) === String(v)}">${t}</button>`).join('')}</div></div>`;

  const HINT = 'Read aloud reads questions out loud. The speaker buttons always work. "Automatic" picks the most natural voice this device has. Voices come from your device or browser, so a phone and a laptop can sound different.';
  function settings(app, kid) {
    document.title = 'Settings · Study Buddy';
    const many = SB.profiles().length > 1;
    const speech = SB.CAN_SPEAK ? `<div class="setgroup"><h3>Reading aloud</h3>
        ${seg('readAloud', 'Read aloud', [[false, 'Off'], [true, 'On']])}
        <div class="setrow"><label for="voiceSel">Voice</label>
          <span class="voicectl"><select id="voiceSel" aria-describedby="voiceHint"></select><button type="button" class="btn ghost small" id="voicePrev">Preview</button></span></div>
        <p class="hint" id="voiceHint">${HINT}</p><p class="hint" id="voiceNow" role="status" aria-live="polite"></p></div>` : '';
    app.innerHTML = top('Settings', 'for ' + esc(kid.name)) + `<section class="panel setpanel">
      <p class="lead">Saved for ${esc(kid.name)} on this device. ${many ? `Not ${esc(kid.name)}? <a href="#/">Switch student</a>.` : ''}</p>
      ${OPTS.map(g => `<div class="setgroup"><h3>${g.group}</h3>${g.items.map(i => seg(...i)).join('')}</div>`).join('')}
      ${speech}
      <div class="setgroup"><h3>Updates</h3>
        <div class="setrow"><span>Show the newest version of Study Buddy</span><button type="button" class="btn ghost small" id="refreshLatest">Refresh for the latest</button></div>
        <p class="hint" id="refreshHint" role="status" aria-live="polite">Use this if a new tool or change is not showing up yet. It reloads the site's files. Names, progress, and settings are not touched.</p>
        <p class="hint" id="versionLine">Checking the version...</p></div>
      <div class="setgroup"><h3>Admins</h3>
        <div class="setrow"><span>Progress, students, backup, and the admin PIN</span><a class="btn ghost small" href="#/admin">Open the admin area</a></div>
        <p class="hint">The admin area asks for the PIN if one is set.</p></div>
      <div class="setgroup"><h3>Start over</h3>
        <div class="setrow"><span>Reset all progress</span><button type="button" class="btn warn small" id="resetProg">Reset all progress</button></div>
        <p class="hint">Erases scores, streaks, and module progress for every student. Names, colors, and settings stay.</p>
        <div class="setrow"><span>Erase everything</span><button type="button" class="btn warn small" id="eraseAll">Erase everything</button></div>
        <p class="hint">Removes every student, all progress, all settings, and the admin PIN, then starts fresh. This cannot be undone. Save a backup first in the <a href="#/admin/backup">admin area</a> if you might want it back. Both ask for the admin PIN if one is set.</p></div>
    </section>`;
    app.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
      const k = b.dataset.k, v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v;
      SB.setSetting(k, v); SB.applyDisplay();
      app.querySelectorAll(`.seg button[data-k="${k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
      if (k === 'sound' && v) SB.sfx.good();
      if (k === 'readAloud' && v) SB.say('Read aloud is on.');
    });
    /* which version this device has (its offline copy), and whether the site has a newer one */
    (async () => {
      const line = app.querySelector('#versionLine'); if (!line) return;
      let mine = null, live = null;
      try { mine = ((await caches.keys()).find(k => /^study-buddy-[0-9a-f]+$/.test(k)) || '').replace('study-buddy-', '') || null; } catch (e) {}
      try { const t = await (await fetch('sw.js', { cache: 'no-cache' })).text(); live = (t.match(/VERSION = '([0-9a-f]+)'/) || [])[1] || null; } catch (e) {}
      if (!line.isConnected) return;
      line.textContent = mine && live ? (mine === live ? 'Version ' + mine + '. This is the newest version.' : 'This device has version ' + mine + '. Version ' + live + ' is ready: press Refresh for the latest.')
        : mine ? 'Version ' + mine + ' (offline, so the newest version could not be checked).' : live ? 'Version ' + live + '.' : '';
    })();
    app.querySelector('#refreshLatest').onclick = async function () {
      const btn = this, hint = app.querySelector('#refreshHint'); btn.disabled = true; hint.textContent = 'Getting the newest files...';
      /* Get the new file list first. Only when that works are the offline copies cleared, so pressing this with no internet
         never leaves the device without a working copy. */
      let sw = null;
      try { const res = await fetch('sw.js', { cache: 'reload' }); if (res.ok) sw = await res.text(); } catch (e) {}
      if (!sw) { btn.disabled = false; hint.textContent = 'No internet right now, so nothing was changed. Study Buddy still works offline. Try again when you are online.'; return; }
      try {
        const files = [...sw.matchAll(/"([^"\s]+\.(?:js|css|html|json|webmanifest))"/g)].map(m => m[1]);
        await Promise.all(files.map(f => fetch(f, { cache: 'reload' }).catch(() => {})));                    // refresh the browser's own copies
        if ('serviceWorker' in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
        if (window.caches) await Promise.all((await caches.keys()).filter(k => k.startsWith('study-buddy-')).map(k => caches.delete(k)));
      } catch (e) {}
      hint.textContent = 'Done. Reloading...'; setTimeout(() => location.reload(), 300);
    };
    const names = SB.profiles().map(p => p.name).join(', ');
    app.querySelector('#resetProg').onclick = () => SB.requirePin('Enter the admin PIN to reset all progress.', () => { SB.resetAllProgress(); SB.toast('All progress was reset'); },
      null, { confirm: { title: 'Reset all progress?', text: 'This erases best scores, streaks, and module progress for ' + names + '. Names and settings stay.', ok: 'Reset all progress' } });
    app.querySelector('#eraseAll').onclick = () => SB.requirePin('Enter the admin PIN to erase everything.', () => { SB.eraseEverything(); location.hash = '#/home'; location.reload(); },
      null, { confirm: { title: 'Erase everything?', text: 'This removes ' + names + ', all progress, all settings, and the admin PIN from this device. It cannot be undone.', ok: 'Erase everything' } });
    const sel = app.querySelector('#voiceSel');
    if (sel) {
      const fill = () => {
        if (!sel.isConnected) { try { speechSynthesis.removeEventListener('voiceschanged', fill); } catch (e) {} return; }   // left this page
        const list = SB.voicesFor('en-US'), cur = SB.getSetting('voice') || '';
        sel.innerHTML = `<option value="">Automatic (recommended)</option>` + (() => { const lb = SB.voiceLabels(list); return list.map((v, i) => `<option value="${esc(SB.voiceId(v))}">${esc(lb[i])}${v.lang ? ' (' + esc(v.lang) + ')' : ''}</option>`).join(''); })();
        { const hit = list.find(v => SB.voiceId(v) === cur) || list.find(v => v.voiceURI === cur); sel.value = hit ? SB.voiceId(hit) : ''; }   // an older saved value was a bare voiceURI
        app.querySelector('#voiceHint').textContent = list.length ? HINT : 'This browser has not listed any English voices yet. Try Chrome or Edge, or reload the page. Automatic will use the device default.';
      };
      fill();
      try { speechSynthesis.addEventListener('voiceschanged', fill); } catch (e) {}
      const now = app.querySelector('#voiceNow');
      const hear = () => { now.textContent = ''; SB.say('Hello! This is how I sound.', { force: true, onstart: u => { now.textContent = 'Speaking with: ' + (u.voice ? u.voice.name + (u.voice.voiceURI && u.voice.voiceURI !== u.voice.name ? ' [' + u.voice.voiceURI + ']' : '') : 'the device default voice') + '.'; },
        onerror: e => { if (e && /interrupted|canceled/.test(e.error || '')) return; now.textContent = 'That voice did not play on this device. Please choose another.'; } }); };
      sel.onchange = () => { SB.setSetting('voice', sel.value); hear(); };
      app.querySelector('#voicePrev').onclick = hear;
    }
  }

  /* ---------- Help ---------- */
  const sec = (title, body, open) => `<details class="qa"${open ? ' open' : ''}><summary>${title}</summary><div class="qa-body">${body}</div></details>`;
  function help(app) {
    document.title = 'Help · Study Buddy';
    app.innerHTML = top('Help') + `<section class="panel infopanel">
      <p class="lead">Short answers for using Study Buddy. More questions? See the <a href="#/faq">FAQ</a>.</p>
      ${sec('Getting started', `<ol><li>Open a <b>subject</b> from the Home page, then a <b>module</b>, then a <b>tool</b>. The trail at the top (Home, Subject, Module) always shows where you are, and each part is a link back.</li>
        <li>Everyone starts as a <b>Guest</b>. Choose <b>Add a name</b> at the top to keep progress under your name.</li>
        <li>Use <b>Search</b> at the top to find a module or tool by name. Press <b>/</b> to jump to it.</li></ol>`, true)}
      ${sec('Finding modules', `<ul><li>Choose <b>Tiles</b> or <b>List</b> above the modules. Tiles show a card for each module. List shows one short row for each, so you see more at once. Each student keeps their own choice.</li>
        <li><b>Sort by</b> puts the modules in order by subject, A to Z, the ones you used most recently, or the ones you have not started first.</li>
        <li>Type in <b>Filter modules</b> to show only the modules whose name, description, tags, or subject match. Choose <b>Clear the filter</b> to see everything again.</li></ul>`)}
      ${sec('Saving modules', `<p>Press the bookmark button on a module card, or at the top of a module, to save it. A <b>Saved</b> tab then appears next to <b>All</b> and lists everything you saved, from every subject. When you have saved modules, the home screen opens on Saved; choose All to see everything. Press the bookmark again to remove one. Each student has their own saved list.</p>`)}
      ${sec('The kinds of tools', `<ul><li><b>Study guide</b>: read it first. No score.</li>
        <li><b>Flashcards</b>: practice only. Tap or press Enter to flip, swipe right for "I knew it" and left for "Still learning". A short message confirms each choice, and Undo (or Ctrl+Z) takes it back. They never change your streak or score.</li>
        <li><b>Quiz</b>, <b>Sort it</b>, <b>Put in order</b>, <b>Fill it in</b>, and the Atlas games are checked tools. They give credit, streaks, and mastery.</li>
        <li><b>Explain it</b>: write your answer in your own words. It checks for the main ideas and complete sentences.</li></ul>`)}
      ${sec('Streak, daily goal, and mastered', `<p>The <b>Streak</b> counts right answers in a row. <b>Today</b> counts toward the daily goal. A tool is <b>Mastered</b> when the best score reaches the goal shown in its description.</p>`)}
      ${sec('Sound and reading aloud', `<ul><li>The speaker button reads a word or sentence. <b>Press it again while it is playing to stop.</b> Escape also stops all sound.</li>
        <li><b>Read aloud</b> reads questions automatically. It is off until you turn it on in <a href="#/settings">Settings</a>.</li>
        <li>If the voice is hard to listen to, choose another in Settings under Voice.</li></ul>`)}
      ${sec('Using the keyboard', `<ul><li><b>Tab</b> moves between buttons. <b>Enter</b> or <b>Space</b> presses one.</li>
        <li>On the South America maps, Tab moves between countries and Enter picks one.</li>
        <li><b>/</b> opens search. <b>Escape</b> stops sound or closes a menu.</li></ul>`)}
      ${sec('The scratch pad (math)', `<p>Math questions have a <b>Scratch pad</b> button. It opens a notepad beside the question for working out the problem with a pen, finger, mouse, or keyboard.</p>
        <ul><li>Pick a pen, pencil, marker, highlighter, brush, or the eraser. Choose a color and size. <b>Lines</b> and <b>Graph</b> turn on notebook or graph paper. <b>Undo</b>, <b>Redo</b>, and <b>Erase all</b> are at the top.</li>
        <li>Choose <b>Type</b> to use the keyboard. Press Escape when the line is done.</li>
        <li>On a tablet with a pen, turn on <b>Pen only</b> so a resting hand does not draw.</li>
        <li>When you close the pad with writing on it, it asks what to do: save to <b>My notes</b> (under your name), download a picture, or not save it. Guest, which has no name, can keep a note for this session only. Notes saved to your name are in <b>Notes</b> at the top of every page.</li>
        <li>Close the pad and open it again on the same question and your writing is still there. A new question starts on a clean page. The <b>New note</b> button starts a fresh page, and asks first if the old one is not saved.</li>
        <li>The pad is also in <a href="#/utilities">Utilities</a> as <b>Scratch pad</b>, with no question, for any homework.</li></ul>`)}
      ${sec('Saving, backups, and other devices', `<p>Progress is saved in this browser on this device. An admin can save a backup file and load it on another device in the <a href="#/admin">admin area</a>, which reminds you when the last backup is two weeks old. "Load one student" brings back just one student from a backup.</p>`)}
      ${sec('Display options', `<p>Dark mode, the OpenDyslexic font, and larger text are in <a href="#/settings">Settings</a>. Each student keeps their own.</p>`)}
    </section>`;
  }

  /* ---------- FAQ ---------- */
  function faq(app) {
    document.title = 'FAQ · Study Buddy';
    app.innerHTML = top('FAQ') + `<section class="panel infopanel">
      <p class="lead">Common questions.</p>
      ${sec('Is my student\'s information sent anywhere?', '<p>No. There are no accounts, no tracking, and nothing is uploaded. Names, scores, and settings stay in this browser on this device.</p>', true)}
      ${sec('Why did progress disappear?', '<p>Progress lives in the browser. It is cleared if you clear browsing data, use a private window, or switch browsers or devices. Save a backup in the admin area to be safe.</p>')}
      ${sec('Why don\'t flashcards give a score or streak?', '<p>Flashcards are for practice. Credit comes from tools that check answers, like quizzes and sorting, so a score means something.</p>')}
      ${sec('The voice sounds robotic. Can I change it?', '<p>Yes. Open <a href="#/settings">Settings</a> and pick a Voice, then press Preview. Voices come from your device and browser, so a phone and a laptop can differ. Edge and Chrome often have more natural ones.</p>')}
      ${sec('How do I stop a sound that is playing?', '<p>Press the speaker button again, or press Escape. Turning Sound or Read aloud off also stops it.</p>')}
      ${sec('Where do scratch pad notes go?', '<p>Nowhere unless you choose. A picture you save to the device downloads like any file. "My notes" are kept in this browser under that student\'s name (not for the Guest profile), and are included in an admin backup. Guest can keep a note "for this session"; it is gone when the browser tab closes. Nothing is uploaded.</p>')}
      ${sec('Can several students use it?', '<p>Yes. An admin adds students in the admin area. Each student has their own progress and settings.</p>')}
      ${sec('Does it work without internet?', '<p>After the first visit, most of it works offline. Wikipedia links in the study guides need internet.</p>')}
      ${sec('How do I move to a new device?', '<p>In the admin area, save a backup on the old device and load it on the new one. A backup contains the admin PIN, so keep the file private.</p>')}
      ${sec('Someone studied as Guest. Can I keep that progress?', '<p>Yes. In the admin area, under Students, Guest has "Move Guest\'s progress to". Pick the student and press Move.</p>')}
      ${sec('I forgot the admin PIN.', '<p>In the PIN prompt choose "Forgot PIN?", type REMOVE, then choose a new PIN.</p>')}
      ${sec('Are the answers always right?', '<p>Modules built from a teacher\'s study guide keep the teacher\'s wording. Where historians disagree, a "Historians say" note links a source. If you spot a mistake, please tell the person who set up your Study Buddy.</p>')}
    </section>`;
  }

  /* ---------- About ---------- */
  function about(app) {
    document.title = 'About · Study Buddy';
    app.innerHTML = top('About') + `<section class="panel infopanel">
      <p class="lead">Study Buddy is a set of quick review tools for school subjects, made for one family and shared with others.</p>
      <h3>How it is organized</h3>
      <p>Study Buddy has <b>subjects</b>. Each subject has <b>modules</b>, like Planets or Ancient Rome. Each module has <b>tools</b>, like flashcards and quizzes. Difficulty is Easy, Medium, Hard, or Insane.</p>
      <h3>Privacy</h3>
      <ul><li>No accounts, no ads, and no tracking.</li>
        <li>Names, scores, and settings are saved only in your browser, on your device. Nothing is sent to a server.</li>
        <li>Links to Wikipedia open another website, which has its own privacy rules.</li>
        <li>An admin can erase everything for a student, or all of it, in the admin area.</li></ul>
      <h3>What is new</h3>
      <p>See the <a href="#/changelog">Change log</a> for what has changed, newest first.</p>
      <h3>Support Study Buddy</h3>
      <p>Study Buddy is free, and nothing is locked behind a payment. If it helps your family and you would like to say thanks, you can <a href="https://www.paypal.me/chriskosho" target="_blank" rel="noopener noreferrer" aria-label="Donate through PayPal (opens in a new tab)">donate through PayPal</a>. It is a gift to the person who makes Study Buddy, not a charitable donation, so it is not tax-deductible. The link opens PayPal, a different website with its own privacy rules. Nothing about you or your students is sent to it.</p>
      <h3>Credits</h3>
      <ul><li>Fonts: OpenDyslexic, Andika, and Playwrite US Trad, used under the SIL Open Font License.</li>
        <li>Study guide notes about what historians say link to Wikipedia as their source.</li>
        <li>Map outlines in the South America module are simplified for learning and are not survey-accurate.</li></ul>
    </section>`;
  }

  /* ---------- Change log ---------- */
  function changelog(app) {
    document.title = 'Change log \u00b7 Study Buddy';
    const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    app.innerHTML = top('Change log') + `<section class="panel infopanel">
      <p class="lead">What is new in Study Buddy, newest first. See <a href="#/settings">Settings</a> if a change is not showing yet.</p>
      ${(window.SB_CHANGELOG || []).map(e => `<h3>${esc(e.title)} <span class="hint">${esc(fmt(e.date))}</span></h3><ul>${e.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
      <p><a href="#/about">Back to About</a></p></section>`;
  }

  /* ---------- My notes (saved from the scratch pad) ---------- */
  function notes(app, kid) {
    document.title = 'My notes · Study Buddy';
    app.innerHTML = top('My notes', 'for ' + esc(kid.name)) + `<section class="panel setpanel">
      <p class="lead">${SB.isGuest(kid) ? 'Notes you keep from the scratch pad for this session are here. Add your name at the top to save notes to your profile.' : 'Notes you saved from the scratch pad. They stay on this device, under ' + esc(kid.name) + "'s profile. Open one to keep writing, or download it as a picture."}</p>
      <div id="notesBox"></div></section>`;
    const box = app.querySelector('#notesBox');
    const draw = () => SBPad.renderList(box, { onOpen: (note, scope) => SBPad.open({ note, scope, source: note.mod, onClose: draw }) });
    if (window.SBPad) return draw();
    box.innerHTML = '<p class="hint">Loading notes...</p>';                      // the scratch pad code loads only when it is needed
    const sc = document.createElement('script'); sc.src = SB.BASE + 'shared/sb-scratchpad.js';
    sc.onload = () => { if (box.isConnected) draw(); };
    sc.onerror = () => { box.innerHTML = '<p class="hint">Notes could not load. Reload the page and try again.</p>'; };
    document.head.appendChild(sc);
  }
  window.HUBPAGES = { settings, help, faq, about, changelog, notes };
})();
