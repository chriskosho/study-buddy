# Explorer's Atlas — Style Guide

This is the visual, interaction, and writing style of the South America geography tool. It is the reference look for the wider study hub. Every value here is taken from `src/head.html` (CSS) and `src/core.js` (behavior), so it can be reproduced exactly.

## 1. Design principles

1. **Friendly, not babyish.** Built for a 10-year-old (K–5 range). Warm paper background, chunky rounded shapes, plain words. No cartoon mascots, no emoji in the UI.
2. **Room to breathe.** Large click targets, generous padding, panels that use the full window width. Fits a ~1440×900 screen with **no scroll bars**. Smaller windows may scroll a little, but never scroll horizontally.
3. **One job per screen.** Each tab is one activity with a prompt, the thing to look at, and a short feedback line.
4. **Show the whole picture.** Maps always show the whole continent (no auto-zoom on cards). Users can zoom the interactive maps themselves.
5. **Feedback is immediate and kind.** Green flash for right, red flash for wrong, a gentle shake, a short tone. Wrong answers say what the thing actually was, then "try again". Never scolding.
6. **The learner is in control of sound.** Nothing auto-plays on flashcard flips. The speaker icon plays once per click and shows when it is playing.
7. **Offline and self-contained.** One HTML file. No network, no fonts, no images, no libraries.

## 2. Color tokens

Defined on `:root`:

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#fbf6ea` | Page background (warm cream) |
| `--card` | `#fffdf7` | Panels, tabs, pills |
| `--ink` | `#23313f` | Body text |
| `--ink2` | `#5b6773` | Secondary text |
| `--line` | `#e4dcc8` | Borders, dividers |
| `--sea` | `#cfe8f0` | Map "ocean" background (border `#b7d8e4`) |
| `--coral` | `#e4572e` | Highlighted country, "still learning", warm accents |
| `--teal` | `#1b998b` | Selected state (tabs, segmented controls), **speaker playing** |
| `--sun` | `#f6b73c` | Earned stamps, drag ghost chip |
| `--navy` | `#2b4162` | Primary buttons, card borders, chip borders, toast |
| `--good` | `#2e9e5b` | Correct |
| `--bad` | `#d64545` | Wrong (fills and borders only) |
| `--teal-ink` `--good-ink` `--coral-ink` `--bad-ink` | light `#0e7569` `#1e7340` `#b23a15` `#b32d2d`; dark `#3cc4b4` `#5ccb8a` `#f48d6b` `#f58a8a` | Text in those colors (at least 4.5:1 on cards, paper, and the green/red tints) |
| `--teal-fill` `--good-fill` | light `#0e7468` `#1d7442`; dark `#127268` `#23703f` | Backgrounds behind white text (selected segmented button, "I knew it", speaker playing) |

Keyboard focus shows one navy ring (`:focus-visible`, light navy in dark mode) on every control and on map countries. Selected chips use dark text on the yellow fill in both themes.

Other fixed colors: land with no data `#f6efdb` (stroke `#b9ad8a`), context land (French Guiana, Panama, etc.) `#ece6d3` / `#cfc7ae`, greyed-out placed country `#d6d2c4`, blank "reveal" country `#ece4cc`, button shadow `#1b2b45`, good-button shadow `#1f6f40`.

**Country colors** are soft pastels, one per country, so neighbors always contrast: Venezuela `#f2b880`, Colombia `#e9d27a`, Ecuador `#a6d27a`, Peru `#6fc2a5`, Brazil `#f7a072`, Bolivia `#8fa8d6`, Paraguay `#d9a1b6`, Uruguay `#9fd8d3`, Argentina `#ee8f7a`, Chile `#9bc7e6`, Guyana `#c7b2e0`, Suriname `#f4a9c8`. When adding a region, keep pastel saturation and make sure no two bordering countries share a hue.

Meaning of color is never the only signal: right/wrong also use text, and selection uses a filled state plus a label.

## 3. Typography

- Font stack: `"Trebuchet MS", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif` (no web fonts, so it works offline).
- Body 17px / line-height 1.45. Tabs 15px bold. Buttons 18px bold. Drag chips 20px extra-bold.
- Flashcard answer text is large (`.big`), with a small tag line above ("Which country is this?") and a small detail line below.
- Map labels: weight 800, ink fill, a white 3.4px outline (`paint-order: stroke`) so they read on any color. Default 12px; small countries 9–11px. Chile's label is rotated -90°.
- Sentence case everywhere. No ALL CAPS.

## 4. Shape and depth

- Corner radius: panels 22–26px, cards 22px, buttons 12–14px, chips 12–14px, pills `999px`, map frame 18–22px.
- Borders are 2px (`--line`) on neutral elements and 3px `--navy` on flashcard faces.
- Primary buttons and chips have a hard 3px bottom shadow (a "pressable" look), no blur. Ghost and warn buttons are flat with a 2px border.
- Soft blur shadows only on floating things (drag ghost chip, toast).
- Panels use fluid padding: `clamp(18px, 2.6vw, 36px)`.

## 5. Components

**Header.** Title, a *passport* pill (12 small flag stamps that go from grey to full color with a sun-colored border when earned), and a streak / daily-goal chip.

**Tabs.** Pill buttons, wrap onto a second line instead of scrolling. Selected tab is teal-filled. Current tabs: Study map, Flashcards, Drag names, Find it, Listen and tap, Spell it. Quiz, Which is bigger?, and Memory match exist but carry the `hidden` attribute.

**Settings row.** Sits beside the tabs: Sound, Say names, Voice (English / Local), Reset progress. Pill toggles using `aria-pressed`; "off" is 65% opacity. Labels state the current value ("Sound: on").

**Buttons.** `.btn` (navy, primary), `.btn.good` (green, "I knew it"), `.btn.warn` (white with coral border, "Still learning" / "Start over"), `.btn.ghost` (white with line border, "Skip" / "Hint").

**Random / Full switch (`.qmodes`).** On a Quiz tab with a Full version, a small segmented control (Random 10, Full (N), or One of each (N) for math) sits at the right of the tool title (`.qhead`), so it adds no height; on phones it sits above the question. Every Full quiz question must have a flashcard (`flashcard_rule_test.py`).

**Segmented control (`.seg`).** Joined buttons in a rounded frame; the active one is teal with white text, driven by `aria-pressed="true"`.

**Flashcard.** 3D flip (`.face` with `backface-visibility: hidden`), landscape ~5:4, sized with `calc(100vh - 420px)` so the buttons stay on screen. Front shows the question; back shows the answer, flag, and a speaker button. Flip duration 520ms (`FLIP_MS`). The card always turns back to the front before the next card appears.

**Speaker button (`.spk`).** 38px circle, navy outline, white fill. While speaking it gets `.playing`: teal fill, white icon, and a 5px translucent teal ring. It clears when the sound ends or after a 5-second safety timeout.

**Interactive map (`.mapbox`).** Sea-blue frame, countries drawn with white 1.6px borders, hover/selection highlight, small zoom bar (+, −, All) in a corner, mouse-wheel zoom and drag-to-pan.

**Small places on maps (every geography map follows this; US States and Europe are the reference).** A place too small to hold its name is never left as an unreadable code:
1. *Short code, then the name.* A tiny place shows a two-letter code (with a thin leader line to a label in the sea or margin if it is too small to sit inside). Tapping the place, tapping its name in the list, or tabbing to it opens the code into the full name (tap elsewhere to close it). Names in the list are buttons ("Show on the map"): they select the place, and zoom toward it if it is tiny.
2. *Zoom opens every name.* From the first zoom step (1.5x) every short code becomes the full name, drawn at a steady 9.5px on screen so it does not balloon as you zoom. Names longer than 12 characters wrap onto two lines.
3. *Selected place.* The tapped place gets a navy outline (`.sel`); its label is raised to the front.
4. *Hover tooltip.* On the Study map every place has a `<title>` with its full name. Game maps never do (it would give the answer away).
5. *Double-tap or double-click zooms* in on that spot, on the Study map only (the games count every tap).
6. *Drag names:* a tiny place that was just placed shows its full name for about 2.5 seconds, then goes back to its code.
7. *Find it* and the flashcards: the places that took more than one try are named in "Practice these"; flashcard map shapes ring a tiny place so it can be seen.
8. *Dots for the tiniest.* Places too small to draw (microstates) are drawn as small circles at their real position, and are tappable and keyboard focusable like any other place.
9. South America writes full names everywhere, so it only needs items 3, 4, 5, and the list buttons; if a map ever gets codes, it must meet items 1 and 2.
10. *World exception:* on the whole-world view the codes are hidden (they would be unreadable at that size); names open from tapping, the list, or zoom. Continent views follow items 1 to 8.
11. *Projection and water:* the World and Oceans maps use the equirectangular projection. On the Oceans map, water shapes are drawn under the land, and land borders are not drawn (only coasts).

**Drag chips.** White with navy outline and hard shadow, grab cursor. While dragging, a sun-yellow ghost chip tilts -3° above the pointer. Wrong drops shake the chip; right drops remove it.

**Stats (`.stat`).** Small white rounded boxes for score, misses, time, best.

**Message line (`.msg`).** One line under the activity. Neutral ink, `.good` green, `.bad` red.

**Toast.** Navy pill, bottom center, 2.4s. Used for passport stamps, streaks of 5, and the daily goal.

## 6. Motion

- Country flash: green stroke ring that fades (0.7s) for correct; red stroke pulse (0.5s) for wrong.
- Chip shake 0.4s on a wrong drop.
- Card flip 0.52s. Fill transitions 0.25s.
- All animation is removed under `prefers-reduced-motion: reduce`.

## 7. Sound

- Tone effects are generated with WebAudio (triangle wave), no audio files: *good* 660→880 Hz, *bad* 220→180 Hz, *win* 523→659→784→1046 Hz.
- Spoken names use the browser `speechSynthesis` at rate 0.85. "English" voice says the English name; "Local" voice uses each country's own spelling and language (es-ES, pt-BR, nl-NL, en-US).
- Quiz questions are **not** read aloud (explicit decision).
- Pressing a speaker button that is playing stops the sound (this applies to every sound), and Escape stops all sound. The voice is a per-child setting (Settings page); Automatic picks the most natural voice on the device.
- Controls: *Sound* toggles tones, *Say names* toggles automatic name speaking in activities. Speaker buttons always work, even if Say names is off.

## 8. Layout rules

- Every page has the shared header and footer (`shared/sb-shell.js`). Tool screens use `calc(100vh - var(--chrome) - Npx)` so the combined header and footer height is accounted for.
- Full-width panels, maps and cards sized from the viewport: `calc(100vh - Npx)` for height.
- Two-column grid (map + side tools) collapses to one column at 760px.
- Test sizes: 1440×900 (no scroll), 1000×800 (no horizontal scroll), a narrow phone width (stacks, may scroll vertically).
- Touch: drag uses pointer events with a tap-to-select fallback, so it works with a finger.

## 9. Writing voice

- Short sentences, concrete words, second person ("Now tap Brazil on the map.").
- Right: "Yes! That is Chile."
- Wrong: "Not quite. That one is Peru. Try again."
- Hints say where to look, never the answer text.
- Facts are one kid-friendly sentence (e.g. "Its name means 'equator' in Spanish").
- Avoid jargon and filler words; keep feedback to one line.

## 10. Accessibility checklist

- Real `<button>` elements for all actions; `aria-pressed` for toggles; `role="tab"` / `aria-selected` for tabs.
- Flags have `role="img"` and an aria-label; the speaker has `aria-label="Hear <country>"`.
- Keyboard: Enter/Space flips the card, selects a chip, and activates buttons.
- Color is always paired with text or shape.
- Reduced-motion respected. Browser speech is optional (the UI hides speech controls if unavailable).

## 11. Reuse checklist for a new tool in the hub

1. Copy the `:root` tokens and font stack unchanged.
2. Call `SB.shell({...})` for the shared header and footer, then use the same title, streak chip, tab row, and settings row. Size heights with `var(--chrome)`.
3. Use `.btn` variants, `.seg`, `.stat`, `.msg`, and the toast as-is.
4. One activity per tab, one feedback line, right/wrong colors and tones as above.
5. Save progress locally (see BUILD_APPROACH.md, "Persistence").
6. Test at 1440×900 for zero overflow before delivering.

## Scratch pad
The scratch pad toolbar uses the theme tokens like every other screen. The writing paper is the one exception: it stays light (and the default ink dark) in dark mode, like real paper. No emoji; the notepad-and-pencil mark is an inline SVG.
