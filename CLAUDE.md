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
- Keep the Explorer's Atlas tools Study map, Drag names, Find it, and Listen and tap as they are unless asked. Flashcards show the whole continent, and sound plays only from the speaker button.
- Hide unused features instead of deleting them.
- Desktop first, phone friendly. No scroll bars on tool screens at 1440×900, and no sideways scroll at 360px wide (Galaxy S23).
- Progress is saved locally only. No cloud.

## How to work
1. Never commit to `main`. Make a branch, push it, and open a pull request. Netlify builds a preview copy for the owner to try. The owner merges.
2. One pull request per request from the owner, with a plain description of what changed and how to try it.
3. Before pushing, run these from the repository root:
   - `node study-buddy/_dev/build.mjs`
   - `python3 study-buddy/_dev/tests/hub_test.py`, `atlas_test3.py`, `pos_test.py`, `rome_test.py`, and `onboarding_test.py` in the same folder (they need Playwright and Chromium)
   Add or extend tests for each new module, and look at screenshots of the new screens.
4. Commit the rebuilt files too (`sw.js` and `study-buddy/modules/geography/south-america/index.html`). Netlify also rebuilds them on deploy.
5. To add a module, use the shared tools in `shared/sb-tools.js` where they fit, copy the Parts of Speech or Ancient Rome folder pattern and use `shared/sb-module.js` (ARCHITECTURE.md section 5), then add its entry to `study-buddy/registry.js`. Write its content in a `data.js`, and have a separate pass review the content for accuracy.
6. Modules made from photos of homework or study guides: follow ARCHITECTURE.md section 7 (teacher's wording, mark anything not on the photos, separate review against the photos).
7. Update the docs when behavior changes. Keep new modules consistent with the Explorer's Atlas screens.
