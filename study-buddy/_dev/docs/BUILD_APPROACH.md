# Explorer's Atlas — How the Latest Version (v3) Was Built

This document explains the approaches and decisions behind v3 so a new chat (or developer) can continue the work without the original conversation.

## 1. Goal and constraints

A learning tool for a 10-year-old to learn the 12 countries of South America, built as a quick-review tool (not a main curriculum). Constraints from the owner:

- Works **offline**, runs locally by double-clicking a file. Later may be hosted free as a static site (GitHub Pages or Netlify).
- **Self-contained single HTML file**: inline CSS, JS, and SVG. No external resources.
- **Expandable** to other continents/regions (and, in the wider hub, other subjects).
- Standing delivery rule: code is delivered as a **clickable, downloadable file that previews in the side panel**.
- Desktop first, mobile in mind. Progress saved locally only.

## 2. Version history (what changed and why)

- **v1** — Flashcards (map shape / capital / flag / mix), drag-names-to-map, find-it, quiz, memory match.
- **v2** — Owner feedback: add a labeled study map; flashcards must flip back before advancing (the next answer was visible mid-flip); hear country names; drag modes where placed countries grey out, or start blank and gain color plus a thicker border; much bigger flashcards. Approved extras: zoom/pan on maps, Spell it, Which is bigger?, Listen and tap, streak/daily goal, passport stamps. Rejected: reading quiz questions aloud.
- **v3 (current)** — Owner feedback: keep Study map, Drag names, Find it, Listen and tap unchanged. Flashcards and Spell it go back to showing the **whole continent** (no zoom) on a bigger card. Flashcard sound must **not** auto-play or replay on flip; the speaker is one play per click and must show a color fill while playing. More room, no scroll bars. **Hide (not delete)** Quiz, Which is bigger?, Memory match.

## 3. Architecture

Source files in `src/` are concatenated by `src/assemble.mjs` into one HTML file in `app/`.

| File | Purpose |
|---|---|
| `head.html` | All CSS and the page markup (header, tabs, settings row, one `<section class="panel" id="tab-…">` per activity). Later CSS blocks override earlier ones (v3 overrides are at the end). |
| `data.js` | `FLAGS` (SVG generators for 12 flags), `flagSVG(id)`, `REGION` config (countries, capitals, facts, clues, neighbors, colors, label tweaks), and the `EXTRA` block (local spelling, speech language, area, population). |
| `core.js` | Helpers, saved `state`, WebAudio tones, speech, streak/daily goal/passport, map rendering, zoom/pan, mini-map, tab switching, boot. |
| `cards.js` | Flashcards. |
| `maps.js` | Study map, Drag names, Find it, Listen and tap. |
| `games.js` | Quiz, Spell it, Which is bigger?, Memory match. |
| `geo.mjs` | Generates `mapdata.json` (SVG paths and label points) from hand-authored coordinates. |
| `mapdata.json` | Output of `geo.mjs`, embedded into the app as `MAPDATA`. |
| `assemble.mjs` | Builds `app/south_america_geography.html`. |

Build: `cd src && node assemble.mjs`. Regenerate the map only if you change `geo.mjs`: `node geo.mjs` then assemble. No npm packages are needed (Node built-ins only).

Tabs are lazy: each activity's `inits.<name>` function runs the first time its tab is opened (`showTab` in `core.js`).

## 4. Key approaches

### 4.1 Map data (hand-authored)
No map dataset could be downloaded (the sandbox blocked package registries), so country outlines were **drawn by hand** as simplified longitude/latitude polygons in `geo.mjs`.

- Shared borders are stored once as named point arrays (e.g. `B.colVen`, `B.venBra`) and reused by both neighbors, in opposite direction (`rev(...)`). This guarantees neighbors line up with no gaps or overlaps.
- Projection: equirectangular, x-scale 0.93, 11.2 px per degree, origin lon -83 / lat 13.5. The SVG viewBox is about 533×798.
- Label position is the **pole of inaccessibility** (the point farthest from any edge), found by grid search, so labels sit well inside each country. Per-country tweaks (size, offset, rotation) live in `REGION.labelTweaks`.
- Context shapes (French Guiana, Panama, Falklands, Trinidad) are drawn faintly but are not playable.
- Known pitfall: border arrays have direction. Peru, Ecuador, and Guyana originally had reversed rings; fix with `rev()` and always check a rendered preview.
- **Caveat:** outlines are an approximation, good for learning, not survey-accurate. If real data (e.g. Natural Earth) becomes available, replace `geo.mjs` output but keep the `{d, label}` per-country shape of `MAPDATA`.

### 4.2 Data-driven region config
Everything region-specific lives in `REGION` and `EXTRA` in `data.js` plus the map in `geo.mjs`. Activities read `REGION.countries` and never hard-code South America. The storage key is `explorers-atlas.<REGION.key>`. See `EXPANSION_GUIDE.md`.

### 4.3 Flashcards
- Types: map shape, capital, flag, mix. A queue shuffles the 12 countries; "Still learning" reinserts the card 3–5 positions later, "I knew it" removes it and credits mastery.
- **Flip-then-advance:** `fcAfterUnflip(fn)` flips the card back to the front, waits `FLIP_MS` (520ms), then advances. A `busy` flag blocks double-taps during the animation. This fixed the v1 bug where the next answer was visible mid-flip.
- **Sound:** flipping calls `stopSpeech()` and never speaks. Only the speaker button speaks.
- The shape card uses `miniMap(id, '#e4572e', false)`: the full continent with the target highlighted, no zoom. (`zoom=true` still exists in `miniMap` for possible future use.)
- Card height is viewport-based (`calc(100vh - 420px)`) and landscape, so it is large but the buttons stay on screen.

### 4.4 Speech
- Web Speech API (`speechSynthesis`), rate 0.85. English voice says the English name; Local voice says the local spelling in the right language (es-ES, pt-BR, nl-NL, en-US).
- `speak(id, force)`: `force` means speak even if "Say names" is off (speaker buttons and Listen and tap use it).
- A single document-level capture listener handles every `[data-say]` button, so any new speaker button just needs `data-say="<id>"` (use `spkBtn(id)`).
- **Playing indicator:** `speak` adds `.playing` to all matching speaker buttons and removes it on `onend`/`onerror`, or after a 5-second timer if the browser never reports the end. A token counter (`speakTok`) prevents a stale utterance from clearing a newer one. `stopSpeech()` cancels and clears everything.
- If speech is unavailable, the UI hides speech controls (`body.no-speech`). Browsers: Chrome, Edge, Safari work best.

### 4.5 Drag names
- Pointer events (works with mouse and touch). A drag begins after a 6px move, creates a ghost chip, and hit-tests the drop with `document.elementFromPoint`. A tap on a chip selects it, then tapping a country places it (tap-to-select fallback, also keyboard accessible).
- Three map styles: **grey** (default; placed countries turn grey so only the remaining ones have color), **reveal** (everything starts blank; correct placements gain color and a thick navy border), **stay** (colors never change; placed countries get a thick border).
- In non-grey modes the placed path is moved before the labels group so neighbors cannot cover its thick border.
- Hints add a miss and outline the target in orange.

### 4.6 Zoom and pan
`makeZoom(svg)` changes the SVG `viewBox` (buttons, wheel, drag-to-pan). Pointer capture begins only after a 6px move, and `_justPanned` suppresses the click that follows a pan so panning never counts as an answer (`clickOK`).

### 4.7 Study map
All 12 names labeled; tapping a country says its name and flashes it. A side list shows flag, capital, and a speaker button for each country.

### 4.8 Find it / Listen and tap / Spell it
- **Find it:** 60-second timer, random target, spoken prompt, running score and a saved best.
- **Listen and tap:** speaks a name (always, even if Say names is off); learner taps the country. Score counts first-try successes only. Skip moves the item to the end.
- **Spell it:** whole-continent map with one country highlighted, learner types the name. Accent-insensitive matching via `norm()`. Empty input shows "Type a name first." and doesn't use a try. Two tries, then the answer is revealed; a hint shows the first letter and length.

### 4.9 Progress and motivation
- `state` (mastery counts per country, best scores, settings, daily progress) saved to `localStorage` under `explorers-atlas.south-america`, always inside `try/catch` (storage can be blocked).
- A **passport stamp** is earned at 3 correct answers for a country (`STAMP_AT`). **Streak** counts right answers in a row (reset by `slip()`); **daily goal** is 20 right answers (`DAILY_GOAL`).
- `credit(id)` and `slip()` are the only functions activities call to record results.

### 4.10 Layout without scroll bars
- Merged the old settings bar and footer into one row beside the tabs; moved Reset into it.
- Maps and flashcards size from the viewport: `.cardstage{height:calc(100vh - 420px)}`, `.mapbox svg{height:calc(100vh - 410px)}`, study map `calc(100vh - 312px)`, Spell it map `calc(100vh - 340px)`.
- Tabs wrap rather than scroll. Verified 0px vertical overflow on Flashcards, Study map, Drag names, Find it, Listen and tap, and Spell it at 1440×900, and no horizontal scroll at 1000×800 and narrow widths.
- The `calc()` offsets assume the header + tab/settings rows + controls height. If you add rows above or below an activity, re-measure and adjust.

### 4.11 Hidden activities
Quiz, Which is bigger?, and Memory match are fully implemented but their nav buttons have the `hidden` attribute (`head.html`, near the `nav.tabs` block). Remove `hidden` to show them again.

## 5. Testing

Playwright (Chromium) scripts in `tests/`. `test3.py` stubs `speechSynthesis` (onend fires after 700ms) and checks:

- hidden tabs are quiz, bigger, memory;
- flipping a card speaks nothing;
- the speaker gets `.playing` while speaking and loses it after;
- flipping mid-play cancels speech and clears the state;
- no repeated speech;
- 0px overflow on each visible activity at 1440×900, no horizontal scroll at 1000×800;
- no console or page errors.

Run (needs `pip install playwright` and a Chromium): `cd tests && python3 test3.py`. Screenshots are written to `/tmp/atlas_*.png`. `test2.py` is an earlier, broader functional test written before the v3 changes; it may need updating (for example, it may expect the Quiz, Which is bigger?, or Memory match tabs to be visible) before it passes.

Limits: speech was only tested with a stub, so actual voices have not been heard in the build sandbox.

## 6. Known caveats

- Map outlines are simplified and hand-drawn.
- Bolivia's capital is shown as **Sucre** with a note that La Paz is where the government sits (editable in `data.js`).
- Population and area numbers are approximate (`EXTRA` in `data.js`).
- Voice quality depends on the voices installed in the learner's browser/OS. "Local" voices need the matching language installed.
- Progress is per browser profile and per file location (`file://` storage can differ between browsers).
- Country Explorer (a deeper per-country page) was deferred by the owner to a later phase.

## 7. Decisions to preserve

- No read-aloud for quiz questions.
- Flashcards: whole continent, no auto-zoom; sound only on speaker click; unflip before advancing.
- Study map, Drag names, Find it, Listen and tap: owner likes them; avoid changing behavior.
- Hide, don't delete, unused activities.
- Never add modules the owner hasn't asked for.
