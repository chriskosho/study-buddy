/* Phonograms: content.
   SOURCE: "72 Phonograms: English Spelling Patterns" (2 pages), plus its four extra phonograms (73 to 76). Sounds, notes, and example words keep the sheet's wording.
   Sound key (from the sheet): letters in slashes are one sound, like /sh/. A lowercase vowel, /a/, is the first sound (short sound); a capital vowel, /A/, is the second sound (its name).
   /th/ is the first (unvoiced) sound of [th] and /TH/ the second (voiced) sound. [/oo/ is the first sound of [oo] and /OO/ the second.]
   Each row: [number, phonogram, sounds, note ("" when the sheet has none), example words]. Words with dots on the sheet (na·tion) are stored without them. */
const KEY = [
  'A single sound is written between slashes, like /sh/, /oy/, /t/, /k/.',
  'A lowercase vowel, like /a/, is the first sound of the phonogram (its short sound).',
  'A capital vowel, like /A/, is the second sound of the phonogram (its name).',
  '/oo/ is the first sound of [oo] and /OO/ is the second sound. /th/ is the first (unvoiced) sound of [th] and /TH/ is the second (voiced) sound.',
  'A phonogram is written in square brackets, like [sh]. Letters in brackets are read as the phonogram with all sounds and text needed to distinguish it from another.'
];
const PH = [
  [1, 'c', '/k/ /s/', '', ['car', 'city']],
  [2, 'o', '/o/ /O/ /oo/', '', ['not', 'no', 'to']],
  [3, 'g', '/g/ /j/', '', ['get', 'giant']],
  [4, 'd', '/d/', '', ['did']],
  [5, 'a', '/a/ /A/ /aw/', '', ['at', 'ate', 'talk']],
  [6, 's', '/s/ /z/', '', ['sit', 'has']],
  [7, 'f', '/f/', '', ['fun']],
  [8, 'i', '/i/ /I/ /E/', '', ['it', 'fine', 'machine']],
  [9, 'r', '/r/', '', ['run']],
  [10, 'n', '/n/', '', ['no']],
  [11, 'm', '/m/', '', ['met']],
  [12, 'u', '/u/ [/U/ /oo/] /OO/', '', ['up', 'cute', 'blue', 'put']],
  [13, 'y', '/y/ /i/ /I/ /E/', '', ['yes', 'gym', 'my', 'baby']],
  [14, 'j', '/j/', '', ['jump']],
  [15, 'p', '/p/', '', ['pet']],
  [16, 'e', '/e/ /E/', '', ['met', 'me']],
  [17, 'z', '/z/', '', ['zoo']],
  [18, 'l', '/l/', '', ['let']],
  [19, 't', '/t/', '', ['tell']],
  [20, 'b', '/b/', '', ['big']],
  [21, 'h', '/h/', '', ['his']],
  [22, 'k', '/k/', '', ['kite']],
  [23, 'v', '/v/', '', ['very']],
  [24, 'w', '/w/', '', ['wet']],
  [25, 'x', '/ks/', '', ['fox']],
  [26, 'qu', '/kw/', '', ['quit']],
  [27, 'er', '/er/', 'the /er/ of her', ['paper']],
  [28, 'ur', '/er/', 'the /er/ of hurt', ['burn']],
  [29, 'ir', '/er/', 'the /er/ of bird', ['thirst']],
  [30, 'wor', '/er/', 'the /er/ of worms', ['world']],
  [31, 'ear', '/er/', 'the /er/ of early', ['learn']],
  [32, 'ee', '/E/', 'E, double E, always says /E/', ['see']],
  [33, 'th', '/th/ /TH/', '', ['think', 'that']],
  [34, 'sh', '/sh/', 'used at the beginning of a word, at the end of a syllable, but not at the beginning of syllables after the first one, except for the ending -ship.', ['shut', 'fish', 'relationship']],
  [35, 'wh', '/hw/', '', ['where']],
  [36, 'ow', '/ow/ /O/', '', ['cow', 'snow']],
  [37, 'ou', '/ow/ /O/ /oo/ /u/', '', ['out', 'soul', 'soup', 'touch']],
  [38, 'ar', '/ar/', '', ['far']],
  [39, 'or', '/or/', '', ['for']],
  [40, 'oo', '/oo/ /OO/', '', ['fool', 'foot']],
  [41, 'ck', '/k/', '2-letter /k/, used only after a single vowel that says /a/ /e/ /i/ /o/ /u/', ['pack', 'peck', 'pick', 'lock', 'luck']],
  [42, 'oa', '/O/', 'the /O/ of boat', ['coat']],
  [43, 'oe', '/O/', 'the /O/ of toe', ['hoe']],
  [44, 'ay', '/A/', 'two-letter /A/ that we DO use at the end of English words.', ['play']],
  [45, 'ai', '/A/', '2-letter /A/ that we do NOT use at the end of English words. Why not? English words do not end with I.', ['wait']],
  [46, 'ea', '/E/ /e/ /A/', '', ['eat', 'bread', 'great']],
  [47, 'ie', '/E/ /I/', 'we say /E/ /I/ but we write I – E', ['thief', 'pie']],
  [48, 'aw', '/aw/', 'that we DO use at the end of English words.', ['saw']],
  [49, 'au', '/aw/', 'that we do NOT use at the end of English words. Why not? English words do not end with U.', ['sauce']],
  [50, 'ed', '/ed/ /d/ /t/', 'past tense ending', ['waited', 'warmed', 'baked']],
  [51, 'ch', '/ch/ /k/ /sh/', '', ['child', 'school', 'chef']],
  [52, 'ng', '/ng/', '', ['hung']],
  [53, 'tch', '/ch/', '3-letter /ch/, used after a single vowel that says /a/ /e/ /i/ /o/ /u/', ['hatch', 'etch', 'stitch', 'blotch', 'clutch']],
  [54, 'ui', '/oo/', '', ['fruit']],
  [55, 'gu', '/g/', '2-letter /g/, always followed by a vowel.', ['guess']],
  [56, 'eigh', '/A/', '4-letter /A/', ['weight']],
  [57, 'ey', '/A/ /E/', 'that we DO use at the end of English words.', ['they', 'key']],
  [58, 'ei', '/A/ /E/', 'that we do NOT use at the end of English words. Why not? English words do not end with I.', ['veil', 'ceiling']],
  [59, 'igh', '/I/', '3-letter /I/', ['fight']],
  [60, 'ew', '/oo/ /U/', 'that we DO use at the end of English words.', ['new', 'few']],
  [61, 'eu', '/oo/ /U/', 'that we do NOT use at the end of English words. Why not? English words do not end with U.', ['neutral', 'feud']],
  [62, 'dge', '/j/', '3-letter /j/, used only after a single vowel that says /a/ /e/ /i/ /o/ /u/.', ['badge', 'edge', 'fridge', 'lodge', 'judge']],
  [63, 'wr', '/r/', '2-letter /r/', ['wrong']],
  [64, 'kn', '/n/', '2-letter /n/, used only at the beginning of a base word.', ['know']],
  [65, 'gn', '/n/', '2-letter /n/, used both at the beginning and end of a base word', ['gnaw', 'sign']],
  [66, 'ph', '/f/', '2-letter /f/ or /f/, Greek /f/', ['graph']],
  [67, 'oy', '/oy/', 'that we DO use at the end of English words.', ['boy']],
  [68, 'oi', '/oy/', 'that we do NOT use at the end of English words. Why not? English words do not end with I.', ['boil']],
  [69, 'ough', '/O/ /oo/ /uff/ /off/ /aw/ /ow/', '', ['though', 'through', 'tough', 'cough', 'thought', 'bough']],
  [70, 'ti', '/sh/', 'tall letter /sh/ used at the beginning of syllables after the first one.', ['nation']],
  [71, 'si', '/sh/ /zh/', 'used at the beginning of syllables after the first one.', ['mission', 'vision']],
  [72, 'ci', '/sh/', 'short letter /sh/ used at the beginning of syllables after the first one.', ['glacier']],
  /* the four extra phonograms: "not used frequently enough to be included with the 72 most common English spelling patterns" */
  [73, 'rh', '/r/', 'Greek /r/.', ['rhythm']],
  [74, 'sc', '/s/', '2-letter /s/', ['science']],
  [75, 'pn', '/n/', 'Greek /n/', ['pneumonia']],
  [76, 'qu', '/k/', 'a less often used second sound of the Q-U phonogram in foreign-origin words', ['mosquito']]
].map(([n, p, s, note, ex]) => ({ n, p, s, note, ex, extra: n > 72 }));
const EXTRA_NOTE = 'These four phonograms are not used frequently enough to be included with the 72 most common English spelling patterns. However, they do occur occasionally in vocabulary in texts. The cards can be used to teach these phonograms when needed.';
/* the phonogram's own letters, found in an example word (first match) */
const hiWord = (w, p) => { const i = w.indexOf(p); return i < 0 ? w : w.slice(0, i) + '<b>' + p + '</b>' + w.slice(i + p.length); };

/* "we DO use it at the end of English words" pairs: the one we use, and the one we do not */
const ENDPAIRS = [
  { use: 'ay', not: 'ai', sound: '/A/', word: 'play', wait: 'wait' },
  { use: 'aw', not: 'au', sound: '/aw/', word: 'saw', wait: 'sauce' },
  { use: 'oy', not: 'oi', sound: '/oy/', word: 'boy', wait: 'boil' },
  { use: 'ew', not: 'eu', sound: '/oo/ /U/', word: 'new', wait: 'neutral' },
  { use: 'ey', not: 'ei', sound: '/A/ /E/', word: 'they', wait: 'veil' }
];

/* How the device voice is asked to say each sound. Speech cannot say a bare sound, so each one is a respelling (a "kuh" for /k/).
   These are best tries and some will sound a little off. To change one, edit its respelling here. */
const SOUNDSAY = {
  b: 'buh', c: 'kuh', d: 'duh', f: 'fuh', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'luh', m: 'muh', n: 'nuh', p: 'puh', r: 'ruh', s: 'suh', t: 'tuh', v: 'vuh', w: 'wuh', y: 'yuh', z: 'zuh',
  ks: 'kuhs', kw: 'kwuh', hw: 'hwuh', ch: 'chuh', sh: 'shh', th: 'thhh', TH: 'thuh', ng: 'ung', zh: 'zhuh',
  a: 'aeh', A: 'ay', aw: 'aw', o: 'ah', O: 'oh', oo: 'ooh', OO: 'uuh', e: 'eh', E: 'ee', i: 'ih', I: 'eye', u: 'uh', U: 'yoo', er: 'er', ar: 'ar', or: 'or', ow: 'ow', oy: 'oy',
  uff: 'uff', off: 'off', ed: 'ed'
};
const soundTokens = p => (p.s.match(/\/[^/]+\//g) || []).map(t => t.slice(1, -1));
/* the text the speaker says for a phonogram's sounds: each sound, with a pause between */
const soundSay = p => soundTokens(p).map(t => SOUNDSAY[t] || t).join('. ') + '.';
