/* Study Buddy hub pages: Settings, Help, FAQ, About.
   hub.js calls HUBPAGES.<name>(app, kid) to fill the page. All of the writing here is for parents and kids, so keep it plain. */
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

  function settings(app, kid) {
    document.title = 'Settings · Study Buddy';
    const many = SB.profiles().length > 1;
    const speech = SB.CAN_SPEAK ? `<div class="setgroup"><h3>Reading aloud</h3>
        ${seg('readAloud', 'Read aloud', [[false, 'Off'], [true, 'On']])}
        <div class="setrow"><label for="voiceSel">Voice</label>
          <span class="voicectl"><select id="voiceSel" aria-describedby="voiceHint"></select><button type="button" class="btn ghost small" id="voicePrev">Preview</button></span></div>
        <p class="hint" id="voiceHint">Read aloud reads questions out loud. The speaker buttons always work. "Automatic" picks the most natural voice this device has. Voices come from your device or browser, so a phone and a laptop can sound different.</p></div>` : '';
    app.innerHTML = top('Settings', 'for ' + esc(kid.name)) + `<section class="panel setpanel">
      <p class="lead">Saved for ${esc(kid.name)} on this device. ${many ? `Not ${esc(kid.name)}? <a href="#/">Switch child</a>.` : ''}</p>
      ${OPTS.map(g => `<div class="setgroup"><h3>${g.group}</h3>${g.items.map(i => seg(...i)).join('')}</div>`).join('')}
      ${speech}
      <div class="setgroup"><h3>Parents</h3>
        <div class="setrow"><span>Progress, children, backup, and the parent PIN</span><a class="btn ghost small" href="#/parent">Open the parent area</a></div>
        <p class="hint">The parent area asks for the PIN if one is set.</p></div>
    </section>`;
    app.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
      const k = b.dataset.k, v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v;
      SB.setSetting(k, v); SB.applyDisplay();
      app.querySelectorAll(`.seg button[data-k="${k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
      if (k === 'sound' && v) SB.sfx.good();
      if (k === 'readAloud' && v) SB.say('Read aloud is on.');
    });
    const sel = app.querySelector('#voiceSel');
    if (sel) {
      const fill = () => {
        const list = SB.voicesFor('en-US'), cur = SB.getSetting('voice') || '';
        sel.innerHTML = `<option value="">Automatic (recommended)</option>` + list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)}${v.lang ? ' (' + esc(v.lang) + ')' : ''}</option>`).join('');
        sel.value = list.some(v => v.voiceURI === cur) ? cur : '';
        if (!list.length) app.querySelector('#voiceHint').textContent = 'This browser has not listed any English voices yet. Try Chrome or Edge, or reload the page. Automatic will use the device default.';
      };
      fill();
      try { speechSynthesis.addEventListener('voiceschanged', fill); } catch (e) {}
      const hear = () => SB.say('Hello! This is how I sound.', { force: true });
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
      ${sec('The kinds of tools', `<ul><li><b>Study guide</b>: read it first. No score.</li>
        <li><b>Flashcards</b>: practice only. Tap or press Enter to flip, swipe right for "I knew it" and left for "Still learning". They never change your streak or score.</li>
        <li><b>Quiz</b>, <b>Sort it</b>, <b>Put in order</b>, <b>Fill it in</b>, and the Atlas games are checked tools. They give credit, streaks, and mastery.</li>
        <li><b>Explain it</b>: write your answer in your own words. It checks for the main ideas and complete sentences.</li></ul>`)}
      ${sec('Streak, daily goal, and mastered', `<p>The <b>Streak</b> counts right answers in a row. <b>Today</b> counts toward the daily goal. A tool is <b>Mastered</b> when the best score reaches the goal shown in its description.</p>`)}
      ${sec('Sound and reading aloud', `<ul><li>The speaker button reads a word or sentence. <b>Press it again while it is playing to stop.</b> Escape also stops all sound.</li>
        <li><b>Read aloud</b> reads questions automatically. It is off until you turn it on in <a href="#/settings">Settings</a>.</li>
        <li>If the voice is hard to listen to, choose another in Settings under Voice.</li></ul>`)}
      ${sec('Using the keyboard', `<ul><li><b>Tab</b> moves between buttons. <b>Enter</b> or <b>Space</b> presses one.</li>
        <li>On the South America maps, Tab moves between countries and Enter picks one.</li>
        <li><b>/</b> opens search. <b>Escape</b> stops sound or closes a menu.</li></ul>`)}
      ${sec('Saving, backups, and other devices', `<p>Progress is saved in this browser on this device. A parent can save a backup file and load it on another device in the <a href="#/parent">parent area</a>.</p>`)}
      ${sec('Display options', `<p>Dark mode, the OpenDyslexic font, and larger text are in <a href="#/settings">Settings</a>. Each child keeps their own.</p>`)}
    </section>`;
  }

  /* ---------- FAQ ---------- */
  function faq(app) {
    document.title = 'FAQ · Study Buddy';
    app.innerHTML = top('FAQ') + `<section class="panel infopanel">
      <p class="lead">Common questions.</p>
      ${sec('Is my child\'s information sent anywhere?', '<p>No. There are no accounts, no tracking, and nothing is uploaded. Names, scores, and settings stay in this browser on this device.</p>', true)}
      ${sec('Why did progress disappear?', '<p>Progress lives in the browser. It is cleared if you clear browsing data, use a private window, or switch browsers or devices. Save a backup in the parent area to be safe.</p>')}
      ${sec('Why don\'t flashcards give a score or streak?', '<p>Flashcards are for practice. Credit comes from tools that check answers, like quizzes and sorting, so a score means something.</p>')}
      ${sec('The voice sounds robotic. Can I change it?', '<p>Yes. Open <a href="#/settings">Settings</a> and pick a Voice, then press Preview. Voices come from your device and browser, so a phone and a laptop can differ. Edge and Chrome often have more natural ones.</p>')}
      ${sec('How do I stop a sound that is playing?', '<p>Press the speaker button again, or press Escape. Turning Sound or Read aloud off also stops it.</p>')}
      ${sec('Can several children use it?', '<p>Yes. A parent adds children in the parent area. Each child has their own progress and settings.</p>')}
      ${sec('Does it work without internet?', '<p>After the first visit, most of it works offline. Wikipedia links in the study guides need internet.</p>')}
      ${sec('How do I move to a new device?', '<p>In the parent area, save a backup on the old device and load it on the new one. A backup contains the parent PIN, so keep the file private.</p>')}
      ${sec('I forgot the parent PIN.', '<p>In the PIN prompt choose "Forgot PIN?", type REMOVE, then choose a new PIN.</p>')}
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
        <li>A parent can erase everything for a child, or all of it, in the parent area.</li></ul>
      <h3>Credits</h3>
      <ul><li>Fonts: OpenDyslexic, Andika, and Playwrite US Trad, used under the SIL Open Font License.</li>
        <li>Study guide notes about what historians say link to Wikipedia as their source.</li>
        <li>Map outlines in the South America module are simplified for learning and are not survey-accurate.</li></ul>
    </section>`;
  }

  window.HUBPAGES = { settings, help, faq, about };
})();
