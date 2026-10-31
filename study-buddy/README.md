# Study Buddy

Quick review tools for school subjects. One hub, a profile per student, and progress saved on each device. It runs fully offline once loaded, and nothing is sent online.

## Put it online (Netlify, easiest)
1. Unzip `study-buddy.zip`. You get a folder named `study-buddy`.
2. Go to **app.netlify.com/drop** while signed in, and drag the `study-buddy` folder onto the page.
3. Netlify gives you an address like `something-random.netlify.app`. You can rename it under **Site configuration → Change site name**.
4. **To update later:** open the site in Netlify, go to **Deploys**, and drag the new `study-buddy` folder onto the deploy box. The address stays the same, and saved progress is kept.

**On the Galaxy phones:** open the address in Chrome, tap **⋮ → Add to Home screen → Install**. It opens like an app and works without internet after the first visit.

GitHub Pages works too: upload the contents of the folder to a repository, then go to **Settings → Pages → Deploy from a branch → main / (root)**.

## First run
Nothing to set up. The first visit opens straight to the subjects as **Guest**, and progress saves right away.
- After the first finished round, Study Buddy invites you to add a name. It asks at most once per visit, and "Not now" waits a week. Adding a name keeps the progress. You can also tap **Guest · Add a name** at the top.
- More people can be added in the **Admin** area. "Who's studying?" appears once there are two or more.
- The admin PIN is optional. Study Buddy offers it the first time someone opens the Admin area or erases progress, and once more when a second person is added.

## Display, handwriting, and utilities
- **Display** (top of every page): light or dark theme (or match the device), the OpenDyslexic font, and larger text, saved for each student.
- **Handwriting** works with the S Pen, a finger, or a mouse. After the pen is used, palm touches are ignored. Tap "Finger: on" to draw with a finger again.
- **Flashcards:** swipe right for "I knew it", left for "Still learning".
- **Utilities** tab: a calculator that follows the order of operations.

## Things to know
- **Progress lives in each browser on each device.** The family computer and each phone keep their own. To copy progress to another device, use **Admin → Backup**: download it on one device, then load it on the other.
- **The admin PIN keeps kids from erasing things by accident.** It is not real security. If you forget it, "Forgot PIN?" removes it without losing progress, and the admin area notes the date it happened.
- **Changing the address** (a new Netlify site name or a move to GitHub) starts with empty progress. Make a backup first and load it at the new address.
- Opening `index.html` by double-clicking it mostly works, but offline install only works from the web address.

## How it's organized
| Term | Meaning |
|---|---|
| Subject | English, Math, Science, Geography, History, Greek and Latin Roots, Typing, Other |
| Module | A topic inside a subject, e.g. South America. One home subject, plus tags. |
| Tags | Extra subjects or skills. A tag matching another subject lists the module under that subject's **Suggested** area. |
| Tool | An activity inside a module, such as flashcards, a quiz, or drag and drop |
| Difficulty | Easy, Medium, Hard, or Insane on every tool. A module shows the range of its tools automatically. |
| Mastered | A tool's best score reached its goal. Study tools have no score. |

## Folder map
```
index.html, hub.js       the hub (who's studying, subjects, modules, parent area)
registry.js              the list of subjects and modules; the hub builds itself from it
shared/sb.css            colors, type, and components shared by every page
shared/sb-core.js        profiles, progress, sound, speech, PIN, backup
shared/fonts/            cursive, print, and OpenDyslexic fonts (open licenses included)
utilities/               utilities such as the calculator
shared/sb-tools.js       ready-made tools (flashcards, sort, quiz, typed answers, put in order, explain) that modules fill with content
shared/sb-module.js      the standard module page (header, tool tabs, settings) that modules build on
modules/<subject>/<module>/index.html   one folder per module
manifest.webmanifest, sw.js, icons/     install on phones and work offline
_dev/                    source, build script, tests, and design docs (not needed by the site)
```

For developers, or a new chat continuing this work, start with `_dev/docs/ARCHITECTURE.md`.
