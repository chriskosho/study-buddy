# Study Buddy: project rules

Study Buddy is a static website of quick-review study tools for the owner's four children. It is hosted free on Netlify and is deployed from this repository. There is no server, no account system, and nothing is saved online: progress is saved in each browser.

The site lives in `study-buddy/`. Read these before changing anything:
- `study-buddy/_dev/docs/ARCHITECTURE.md`: vocabulary, files, saved data, and the module contract
- `study-buddy/_dev/docs/STYLE_GUIDE.md`: the look, sounds, layout, and writing voice
- `study-buddy/_dev/docs/BUILD_APPROACH.md`: how the first module (Explorer's Atlas) was built

## Standing rules from the owner
- Build only the modules the owner asks for. Empty subjects stay empty.
- Words: Study Buddy → Subjects → Modules → Tools. A module has one home subject plus tags. Difficulty is Easy, Medium, Hard, or Insane. Never grade levels.
- The same look for every child, at every age. No emoji, no mascots.
- Read aloud is a per-child setting, off by default. When it is on, modules read their questions aloud. Explorer's Atlas never reads quiz questions aloud. Speaker buttons always work.
- Flashcards are practice only: no credit, streak, or mastery. Credit comes only from checked tools.
- Statements in a study guide that historians dispute keep the teacher's wording, with a "Historians say" note that links a Wikipedia article as its source.
- Keep the Explorer's Atlas tools Study map, Drag names, Find it, and Listen and tap as they are unless asked. (The owner approved keyboard access for the map activities and Say names following Read aloud.) Flashcards show the whole continent, and sound plays only from the speaker button.
- Every geography unit is based on the South America module (Study map, Flashcards with map shapes, Listen and tap, Find it, Drag names, plus the unit's own quiz tools) unless the owner says otherwise. US States follows it.
- Hide unused features instead of deleting them. To retire a module, archive it (`archived: true` in the registry); it stays in the parent area's Archived list.
- Desktop first, phone friendly. No scroll bars on tool screens at 1440×900, and no sideways scroll at 360px wide (Galaxy S23).
- Progress is saved locally only. No cloud.
- Display options (dark mode, OpenDyslexic, larger text) are per child and off by default. New CSS uses the theme tokens, never literal white.

## How to work
1. Never commit to `main`. Make a branch, push it, and open a pull request. Netlify builds a preview copy for the owner to try. The owner merges.
2. One pull request per request from the owner, with a plain description of what changed and how to try it.
3. Before pushing, run these from the repository root:
   - `node study-buddy/_dev/build.mjs`
   - `python3 study-buddy/_dev/tests/hub_test.py`, `shell_test.py`, `atlas_test3.py`, `pos_test.py`, `rome_test.py`, `onboarding_test.py`, `handwriting_test.py`, `utilities_display_test.py`, `safety_test.py`, `display_a11y_test.py`, and `new_modules_test.py`, `greek_latin_roots_test.py`, `us_states_test.py`, and `phonograms_black_beauty_test.py`, and `ham_technician_test.py`, and `flashcard_undo_test.py`, and `fractions_test.py`, and `fractions_mul_test.py`, and `fractions_div_test.py`, and `measurement_test.py` in the same folder (they need Playwright and Chromium)
   - `node study-buddy/_dev/tests/math_gen_check.mjs`
   Add or extend tests for each new module, and look at screenshots of the new screens.
4. Commit the rebuilt files too (`sw.js` and `study-buddy/modules/geography/south-america/index.html`). Netlify also rebuilds them on deploy.
5. To add a module, use the shared tools in `shared/sb-tools.js` where they fit, copy the Parts of Speech or Ancient Rome folder pattern and use `shared/sb-module.js` (ARCHITECTURE.md section 5), then add its entry to `study-buddy/registry.js`. Write its content in a `data.js`, and have a separate pass review the content for accuracy.
6. Modules made from photos of homework or study guides: follow ARCHITECTURE.md section 7 (teacher's wording, mark anything not on the photos, separate review against the photos).
7. Add an entry to `study-buddy/changelog.js` (newest first, plain words) for each change the owner would notice.
8. Update the docs when behavior changes. Keep new modules consistent with the Explorer's Atlas screens.
