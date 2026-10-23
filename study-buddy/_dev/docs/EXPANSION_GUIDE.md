# Expansion Guide

How to extend Explorer's Atlas to another region, and how it can serve as the model for the wider study hub.

## A. Add another continent or region

1. **Copy the project** (`src/`) to a new folder, e.g. `north-america/`.
2. **Map (`geo.mjs`)**
   - Replace the border arrays and country shapes with the new region's outlines (lon/lat points). Store each shared border once and reuse it (reversed with `rev(...)`) for the neighbor.
   - Update the projection constants (`lon0`, `lat0`, scale) so the region fills an SVG of roughly the same aspect ratio. Adjust the viewBox width/height output.
   - Add faint context shapes for nearby land that is not playable.
   - Run `node geo.mjs` to regenerate `mapdata.json`. Render a preview and check for reversed rings and gaps.
3. **Data (`data.js`)**
   - Change `REGION.key` (this becomes the localStorage key, so progress stays separate) and `REGION.title`.
   - Replace `REGION.countries`: `id`, `name`, `capital`, optional `capitalNote`, pastel `color`, `fact`, `clue`, `neighbors`.
   - Add a flag generator for each country in `FLAGS`, and `EXTRA` entries (`local`, `lang`, `area`, `pop`).
   - Tune `labelTweaks` for small or odd-shaped countries.
4. **Tabs and counts.** `DAILY_GOAL`, passport stamps, and "x of N" counters read the country list length. Larger regions (20+ countries) may need smaller chips and a smaller passport pill; check the layout at 1440×900.
5. **Rebuild and test:** `cd src && node assemble.mjs`, then adapt `tests/test3.py` (file name, hidden tabs list).

Ideas for larger regions: let the flashcard and quiz decks be filtered by sub-region, or add a "pick your countries" settings control. Don't add these until asked.

## B. Use this as the style model for the study hub

Per the owner's plan: a hub of quick-review tools for K–5 subjects, with a profile per child for progress, hosted as a static site (GitHub Pages or Netlify), progress saved locally.

Suggested approach (confirm with the owner before building anything new):

- **Shared shell:** one `hub.css` holding the tokens and components from `STYLE_GUIDE.md`, and one small `hub-core.js` holding `state`/`save`, tones, speech, toast, and `credit/slip` logic, imported by every tool. Keep each tool usable on its own so it still works offline from a single file if desired.
- **Child profiles:** namespace the storage key by profile, e.g. `explorers-atlas.<profile>.<tool-key>`, with a simple profile picker on the hub home. Keep it local; cloud save is optional and not needed.
- **Tool template:** header + progress chip, tab row, settings row, panels with one activity each, and the `inits.<tab>` lazy-init pattern.
- **Hosting:** static files only, so GitHub Pages or Netlify drag-and-drop both work without a build step beyond `node assemble.mjs`.
- **Scope rule:** build only the modules the owner asks for.
