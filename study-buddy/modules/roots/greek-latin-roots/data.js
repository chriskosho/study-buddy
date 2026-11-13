/* Greek and Latin Roots: content.
   Set 1 is the first 18 roots. Set 2 is Roots Study Sheet #17-24 (8 roots, from two photographed pages of the student's own sheet).
   For Set 2 the root names, meanings, and the 16 derivatives with their definitions are the sheet's wording (DERIVS); the kid-friendly
   notes (use) and example sentences were written for this module and need the same separate accuracy review.
   The 18 roots and their meanings are the owner's list (spellings as given). The English words, notes, and the
   two-root words were written for this module and need a separate accuracy review (see ARCHITECTURE.md section 10).
   level: easy (animals), medium (birds, plus malus, omnis, ex, eu), hard (amphi, ambi, archos, kyklos, circum).
   accept: what Type the answer takes (lower case). either: the root has two meanings and one is enough.
   words: 2 or 3 English words built from the root. use: a short kid-friendly note on how the words are used.
   eg: a sample sentence. stems: parts of words that Explain it looks for in the child's sentence. */

const ROOTS = [
  { id: 'equus', noTypo: true, root: 'equus', lang: 'Latin', meaning: 'horse', level: 'easy', group: 'horse', accept: ['horse', 'horses'],
    words: ['equine', 'equestrian'], use: 'An equestrian is a person who rides horses. A vet who treats horses is an equine vet.',
    eg: 'The equestrian rode her horse around the ring.', stems: ['equine', 'equestrian'] },
  { id: 'caballus', noTypo: true, root: 'caballus', lang: 'Latin', meaning: 'horse', level: 'easy', group: 'horse', accept: ['horse', 'horses'],
    words: ['cavalry', 'cavalier', 'chivalry'], use: 'Cavalry are soldiers who fight on horseback. Knights rode horses, and chivalry is their code of honor and good manners.',
    eg: 'The cavalry rode into the valley at dawn.', stems: ['cavalr', 'cavalier', 'chivalr'] },
  { id: 'hippos', noTypo: true, root: 'hippos', lang: 'Greek', meaning: 'horse', level: 'easy', group: 'horse', accept: ['horse', 'horses'],
    words: ['hippopotamus', 'hippodrome', 'hippocampus'], use: 'Hippopotamus means "river horse." A hippodrome was a track for horse races. A hippocampus is a seahorse.',
    eg: 'The hippopotamus cooled off in the river.', stems: ['hippopotam', 'hippodrome', 'hippocamp'] },
  { id: 'porcus', noTypo: true, root: 'porcus', lang: 'Latin', meaning: 'pig', level: 'easy', group: 'animal', accept: ['pig', 'pigs', 'hog', 'hogs', 'swine'],
    words: ['porcine', 'pork', 'porcupine'], use: 'Pork is meat from a pig. Porcine means "like a pig." A porcupine is a "spiny pig."',
    eg: 'We had pork for dinner.', stems: ['porcine', 'pork', 'porcupine'] },
  { id: 'canis', root: 'canis', lang: 'Latin', meaning: 'dog', level: 'easy', group: 'animal', accept: ['dog', 'dogs'],
    words: ['canine', 'canid'], use: 'Canine teeth are the pointed ones, named for a dog\'s fangs. A canid is any animal in the dog family, like a wolf or a fox.',
    eg: 'A wolf is a wild canine.', stems: ['canine', 'canid'] },
  { id: 'leon', root: 'leon', lang: 'Greek', meaning: 'lion', level: 'easy', group: 'animal', accept: ['lion', 'lions'],
    words: ['leonine', 'chameleon', 'dandelion'], use: 'Leonine means "like a lion." A chameleon is a "ground lion." A dandelion is a "lion\'s tooth," probably named for its jagged leaves.',
    eg: 'The chameleon changed color on the branch.', stems: ['leonine', 'chameleon', 'dandelion'] },
  { id: 'feles', root: 'feles', lang: 'Latin', meaning: 'cat', level: 'easy', group: 'animal', accept: ['cat', 'cats'],
    words: ['feline', 'felid'], use: 'A feline is any member of the cat family, from a house cat to a tiger. A felid is the same idea, used by scientists.',
    eg: 'The feline stretched in the sun.', stems: ['feline', 'felid'] },

  { id: 'ornis', root: 'ornis', lang: 'Greek', meaning: 'bird', level: 'medium', group: 'bird', accept: ['bird', 'birds'],
    words: ['ornithology', 'ornithologist', 'ornithopter'], use: 'An ornithologist studies birds. An ornithopter is a flying machine that flaps its wings like a bird.',
    eg: 'The ornithologist counted the birds in the marsh.', stems: ['ornitholog', 'ornithopter'] },
  { id: 'avis', root: 'avis', lang: 'Latin', meaning: 'bird', level: 'medium', group: 'bird', accept: ['bird', 'birds'],
    words: ['aviary', 'aviation', 'avian'], use: 'An aviary is a big cage or building for birds. Avian means "about birds." Aviation is flying, named for the way birds fly.',
    eg: 'We saw parrots in the aviary.', stems: ['aviar', 'aviation', 'avian'] },
  { id: 'malus', root: 'malus', lang: 'Latin', meaning: 'apple or bad', level: 'medium', group: 'other', accept: ['apple', 'bad', 'apples', 'evil', 'apple or bad', 'bad or apple'], either: true,
    words: ['malice', 'malicious', 'malic acid'], use: 'Latin had two look-alike words. One means "bad": malice is wanting to be mean, and malicious means mean on purpose. The other is about apples: Malus is the scientific name of the apple tree, and malic acid is the sour stuff in apples, named from the Latin word for the fruit.',
    eg: 'The prank was done with malice.', stems: ['malice', 'malicious', 'malic', 'malevol'] },
  { id: 'omnis', noTypo: true, root: 'omnis', lang: 'Latin', meaning: 'all', level: 'medium', group: 'other', accept: ['all', 'every', 'everything'],
    words: ['omnivore', 'omnipotent', 'omnipresent'], use: 'An omnivore eats all kinds of food, plants and animals. Omnipotent means "all powerful." Omnipresent means "in all places."',
    eg: 'A bear is an omnivore because it eats berries and fish.', stems: ['omnivor', 'omnipoten', 'omnipresen'] },
  { id: 'ex', root: 'ex', lang: 'Latin', meaning: 'out of', level: 'medium', group: 'other', accept: ['out of', 'out'],
    words: ['exit', 'export', 'exhale'], use: 'An exit is the way out. A country exports goods when it sends them out to sell. To exhale is to breathe out.',
    eg: 'Please use the exit at the back of the room.', stems: ['exit', 'export', 'exhal'] },
  { id: 'eu', root: 'eu', lang: 'Greek', meaning: 'good or well', level: 'medium', group: 'good', accept: ['good', 'well', 'good or well', 'well or good'], either: true,
    words: ['eulogy', 'euphony', 'euphoria'], use: 'A eulogy is a speech that says good things about a person. Euphony is a pleasant, good sound. Euphoria is a feeling of being very well and happy.',
    eg: 'He gave a eulogy full of kind words.', stems: ['eulog', 'euphon', 'euphori'] },

  { id: 'amphi', root: 'amphi', lang: 'Greek', meaning: 'both or around', level: 'hard', group: 'around', accept: ['both', 'around', 'both or around', 'on both sides'], either: true,
    words: ['amphibian', 'amphitheater', 'amphibious'], use: 'An amphibian can live both in water and on land. An amphitheater has seats all the way around the stage.',
    contrast: 'Amphi and ambi are cousins: the same idea in two languages. Remember amphi = both or around (Greek) and ambi = both (Latin). Tip: the letters "ph" are a Greek-style spelling (like phone and photo), so amphi is the Greek one.',
    eg: 'A frog is an amphibian.', stems: ['amphibi', 'amphitheat'] },
  { id: 'ambi', root: 'ambi', lang: 'Latin', meaning: 'both', level: 'hard', group: 'around', accept: ['both', 'both sides', 'on both sides'],
    words: ['ambidextrous', 'ambiguous', 'ambivalent'], use: 'Ambidextrous means able to use both hands equally well. Ambiguous means it can be understood in more than one way. Ambivalent means having two feelings at once.',
    contrast: 'Ambi and amphi are cousins: the same idea in two languages. Remember ambi = both (Latin) and amphi = both or around (Greek). Tip: "ph" is a Greek-style spelling, so amphi is the Greek one and ambi is the Latin one.',
    eg: 'She is ambidextrous, so she can write with either hand.', stems: ['ambidextr', 'ambiguous', 'ambiguit', 'ambivalen'] },
  { id: 'archos', noTypo: true, root: 'archos', lang: 'Greek', meaning: 'ruler', level: 'hard', group: 'other', accept: ['ruler', 'rulers', 'rule', 'to rule', 'leader', 'leaders', 'chief'],
    words: ['monarch', 'anarchy', 'patriarch'], use: 'A monarch is a king or queen, one ruler. Anarchy is what happens when no ruler is in charge. A patriarch is the male ruler or head of a family.',
    eg: 'The monarch waved from the palace balcony.', stems: ['monarch', 'anarch', 'patriarch'] },
  { id: 'kyklos', root: 'kyklos', lang: 'Greek', meaning: 'circle', level: 'hard', group: 'around', accept: ['circle', 'circles', 'wheel', 'wheels', 'ring', 'rings'],
    words: ['cycle', 'bicycle', 'cyclone'], use: 'A bicycle has two wheels, and wheels are circles. A cycle goes round and round, like the water cycle. A cyclone is a storm that spins in a circle.',
    eg: 'The water cycle goes round and round.', stems: ['cycle', 'cycling', 'cyclone'] },
  { id: 'circum', noTypo: true, root: 'circum', lang: 'Latin', meaning: 'around', level: 'hard', group: 'around', accept: ['around', 'round'],
    words: ['circumference', 'circumnavigate', 'circumstance'], use: 'The circumference is the distance around a circle. To circumnavigate is to sail all the way around something, like the world. A circumstance is a fact that "stands around" an event.',
    eg: 'We measured the circumference of the tree trunk.', stems: ['circumference', 'circumnavigat', 'circumstance'] },

  /* Set 2: Roots Study Sheet #17-24 (the sheet's numbers 17 to 24 are in the comments). level s2a = page 1, s2b = page 2. */
  { id: 'nomen', set: 2, no: 17, noTypo: true, root: 'nomen', also: 'nominis', lang: 'Latin', meaning: 'name', level: 's2a', accept: ['name', 'names'],
    words: ['nominate', 'denominator'], use: 'To nominate someone is to suggest their name for an office, like class president. The denominator is the bottom number of a fraction. It names the kind of parts the whole is split into.',
    eg: 'She was nominated for class president.', stems: ['nominat', 'denominator'] },
  { id: 'pro', set: 2, no: 18, noTypo: true, root: 'pro', lang: 'Latin', meaning: 'for, before, forward, in place of', level: 's2a', accept: ['for', 'before', 'forward', 'in place of', 'in place'], either: true,
    words: ['prologue', 'pronoun'], use: 'A prologue is the words before the beginning of a book or play. A pronoun stands in place of a noun, like "she" for "Maria." Careful: pro and prae can both mean "before," but only pro also means "for," "forward," or "in place of."',
    eg: 'The prologue came before chapter one.', stems: ['prologue', 'pronoun'] },
  { id: 'prae', set: 2, no: 19, noTypo: true, root: 'prae', lang: 'Latin', meaning: 'before, in front of', level: 's2a', accept: ['before', 'in front of', 'in front'], either: true,
    words: ['preamble', 'predict'], use: 'A preamble is the part that goes before the main part, like the opening words of the Constitution. To predict is to say beforehand what will happen. Careful: prae and pro can both mean "before," but prae is the one that means "in front of."',
    eg: 'Dark clouds helped me predict the storm.', stems: ['preamble', 'predict'] },
  { id: 'ad', set: 2, no: 20, noTypo: true, root: 'ad', lang: 'Latin', meaning: 'to, toward, near, next to', level: 's2a', accept: ['to', 'toward', 'towards', 'near', 'next to'], either: true,
    words: ['admire', 'adjective'], use: 'To admire is to look at something with wonder and amazement. An adjective is a word "thrown at" a noun, toward it, to tell more about it.',
    eg: 'I admire the way she plays the violin.', stems: ['admir', 'adjective'] },
  { id: 'jacio', set: 2, no: 21, noTypo: true, root: 'jacio', also: 'jactum', lang: 'Latin', meaning: 'throw', level: 's2b', accept: ['throw', 'throws', 'to throw'],
    words: ['object', 'reject'], use: 'To object is to throw an idea against someone else\'s. To reject is to throw something back.',
    eg: 'The goalie rejected the shot and sent it back.', stems: ['object', 'reject'] },
  { id: 'pono', set: 2, no: 22, noTypo: true, root: 'pono', also: 'positum', lang: 'Latin', meaning: 'lay, put, place', level: 's2b', accept: ['lay', 'put', 'place', 'lay put place', 'put or place'], either: true,
    words: ['position', 'component'], use: 'A position is where something is placed. A component is a part that is put together with other parts to make something.',
    eg: 'Each component of the radio was put into its position.', stems: ['position', 'component'] },
  { id: 'cum', set: 2, no: 23, noTypo: true, root: 'cum', lang: 'Latin', meaning: 'with, together', level: 's2b', accept: ['with', 'together', 'with together', 'together with'], either: true,
    words: ['collaborate', 'community'], use: 'To collaborate is to work with someone. A community is a group that builds together. At the start of a word, cum often changes to col- or com-.',
    eg: 'We collaborated on the science project.', stems: ['collaborat', 'communit'] },
  { id: 'figo', set: 2, no: 24, noTypo: true, root: 'figo', also: 'fixum', lang: 'Latin', meaning: 'fix, fasten, attach', level: 's2b', accept: ['fix', 'fasten', 'attach', 'fix fasten attach'], either: true,
    words: ['prefix', 'suffix'], use: 'A prefix is fastened to the beginning of a word, and a suffix is fastened to the end of a word.',
    eg: 'The prefix un- is fixed to the front of the word.', stems: ['prefix', 'suffix'] }
];

const LEVELS = [
  { id: 'easy', label: 'Easy', sub: 'Animals' },
  { id: 'medium', label: 'Medium', sub: 'Birds and more' },
  { id: 'hard', label: 'Hard', sub: 'Both and around' },
  { id: 'insane', label: 'Insane', sub: 'Two-root words' },
  /* Set 2 (Roots Study Sheet #17-24): two pages of roots, then the sheet's words and blanks */
  { id: 's2a', set: 2, label: 'Sheet 17 to 20', sub: 'nomen, pro, prae, ad' },
  { id: 's2b', set: 2, label: 'Sheet 21 to 24', sub: 'jacio, pono, cum, figo' },
  { id: 's2w', set: 2, words: true, label: 'Sheet words', sub: 'Fill in the blanks' }
];
const SETS = [
  { id: 1, label: 'Set 1', sub: 'The first 18 roots' },
  { id: 2, label: 'Set 2', sub: 'Study Sheet #17 to 24' }
];

/* Insane: words built from two roots. The first part is one of the 18 roots. The other part is NOT on the memorize list,
   so its meaning is shown in the question (gloss). def is the meaning of the whole word. blank/ans is the Type-the-answer
   version, where the answer is the meaning of the root from the list. */
const TWO = [
  { w: 'ornithology', root: 'ornis', other: ['logos', 'study'], def: 'the study of birds', blank: 'the study of ___', ans: ['bird', 'birds'] },
  { w: 'ornithopter', root: 'ornis', other: ['pteron', 'wing'], def: 'a flying machine that flaps its wings like a bird', blank: 'a flying machine with wings like a ___', ans: ['bird', 'birds'] },
  { w: 'hippopotamus', root: 'hippos', other: ['potamos', 'river'], def: 'a "river horse"', blank: 'a river ___', ans: ['horse', 'horses'] },
  { w: 'hippodrome', root: 'hippos', other: ['dromos', 'race'], def: 'a track for horse races', blank: 'a race track for ___', ans: ['horse', 'horses'] },
  { w: 'porcupine', root: 'porcus', other: ['spina', 'spine'], def: 'a "spiny pig"', blank: 'a spiny ___', ans: ['pig', 'pigs', 'hog'] },
  { w: 'chameleon', root: 'leon', other: ['khamai', 'on the ground'], def: 'a "ground lion"', blank: 'a ground ___', ans: ['lion', 'lions'] },
  { w: 'aviary', root: 'avis', other: ['-arium', 'a place for'], def: 'a place for birds', blank: 'a place for ___', ans: ['bird', 'birds'] },
  { w: 'omnivore', root: 'omnis', other: ['vorare', 'to eat'], def: 'an animal that eats all kinds of food', blank: 'eats ___ kinds of food', ans: ['all'] },
  { w: 'omnipotent', root: 'omnis', other: ['potens', 'powerful'], def: 'all powerful', blank: '___ powerful', ans: ['all'] },
  { w: 'export', root: 'ex', other: ['portare', 'to carry'], def: 'to send goods out of a country to sell them', blank: 'to carry goods ___ of a country', ans: ['out'] },
  { w: 'eulogy', root: 'eu', other: ['logos', 'speech'], def: 'a speech that says good things about a person', blank: 'a speech that says ___ things about a person', ans: ['good', 'well'] },
  { w: 'malevolent', root: 'malus', other: ['volens', 'wishing'], def: 'wishing bad things on other people', blank: 'wishing ___ things on other people', ans: ['bad', 'evil', 'ill', 'wicked'], note: 'The mal- part comes from Latin male ("badly"), a close cousin of malus.' },
  { w: 'amphibian', root: 'amphi', other: ['bios', 'life'], def: 'an animal that lives both in water and on land', blank: 'an animal that lives ___ in water and on land', ans: ['both'] },
  { w: 'amphitheater', root: 'amphi', other: ['theatron', 'a place for watching'], def: 'a theater with seats all the way around', blank: 'a theater with seats ___ the stage', ans: ['around', 'all around', 'surrounding'] },
  { w: 'ambidextrous', root: 'ambi', other: ['dexter', 'right hand'], def: 'able to use both hands equally well', blank: 'able to use ___ hands equally well', ans: ['both'] },
  { w: 'monarch', root: 'archos', other: ['monos', 'one'], def: 'one ruler, like a king or queen', blank: 'one ___', ans: ['ruler', 'leader', 'king', 'queen'] },
  { w: 'anarchy', root: 'archos', other: ['an-', 'without'], def: 'having no ruler in charge', blank: 'without a ___', ans: ['ruler', 'leader', 'rulers', 'leaders'] },
  { w: 'bicycle', root: 'kyklos', other: ['bi-', 'two'], def: 'a vehicle with two wheels, which are circles', blank: 'two ___', ans: ['circle', 'circles', 'wheel', 'wheels'] },
  { w: 'circumnavigate', root: 'circum', other: ['navigare', 'to sail'], def: 'to sail all the way around the world', blank: 'to sail all the way ___ the world', ans: ['around', 'round'] },
  { w: 'circumference', root: 'circum', other: ['ferre', 'to carry'], def: 'the distance around a circle', blank: 'the distance ___ a circle', ans: ['around', 'round'] }
];

/* Set 2 derivatives, in the sheet's wording. def is the sheet's definition with its blanks filled in (the printed words).
   NOT PRINTED ON THE SHEET, taken from the student's handwriting, so confirm with the teacher: the meanings of nomen, prae, jacio, cum, the root names pro, ad, pono/positum, figo/fixum, and the blank answers "establish" (position) and "builds" (community); the other answers there are accepted too.
   blanks lists each blank the sheet leaves open in the definition, in order; each one is the list of answers accepted, and the first is the
   printed word. word is true when the sheet also leaves the derivative itself blank. */
const DERIVS = [
  { w: 'nominate', root: 'nomen', def: 'suggest someone\'s name for office', word: true, blanks: [] },
  { w: 'denominator', root: 'nomen', def: 'part of a fraction below the line', blanks: [['part'], ['fraction']] },
  { w: 'prologue', root: 'pro', def: 'words before beginning a book or play', blanks: [['book', 'play'], ['play', 'book']] },
  { w: 'pronoun', root: 'pro', def: 'words that stand or replace nouns', word: true, blanks: [] },
  { w: 'preamble', root: 'prae', def: 'that which goes before', word: true, blanks: [] },
  { w: 'predict', root: 'prae', def: 'say beforehand, foretell', blanks: [['beforehand']] },
  { w: 'admire', root: 'ad', def: 'look at with wonder and amazement', blanks: [['wonder', 'amazement'], ['amazement', 'wonder']] },
  { w: 'adjective', root: 'ad', def: 'a word \u201cthrown at\u201d a noun to modify it', word: true, blanks: [] },
  { w: 'object', root: 'jacio', def: 'throw against', blanks: [['throw']] },
  { w: 'reject', root: 'jacio', def: 'throw back', word: true, blanks: [] },
  { w: 'position', root: 'pono', def: 'establish place', blanks: [['establish', 'put', 'set', 'lay', 'locate']] },
  { w: 'component', root: 'pono', def: 'put together', word: true, blanks: [] },
  { w: 'collaborate', root: 'cum', def: 'work with', word: true, blanks: [] },
  { w: 'community', root: 'cum', def: 'group which builds together', blanks: [['builds', 'lives', 'works', 'build', 'live', 'work']] },
  { w: 'prefix', root: 'figo', def: 'letters or syllables added to the beginning of a word', blanks: [['letters', 'syllables'], ['syllables', 'letters']] },
  { w: 'suffix', root: 'figo', def: 'letters or syllable added to the end of a word', word: true, blanks: [['end']] }
];

/* Sort it: groups by meaning, and Greek or Latin. */
const SORTS = [
  { id: 'animals', label: 'Animals', buckets: [['horse', 'Horse roots'], ['bird', 'Bird roots'], ['animal', 'Other animal roots']],
    items: [['equus', 'horse'], ['caballus', 'horse'], ['hippos', 'horse'], ['ornis', 'bird'], ['avis', 'bird'], ['porcus', 'animal'], ['canis', 'animal'], ['leon', 'animal'], ['feles', 'animal']] },
  { id: 'meanings', label: 'Good, bad, around', buckets: [['good', 'Good or bad roots'], ['around', 'Both, around, or circle roots']],
    items: [['eu', 'good'], ['malus', 'good'], ['amphi', 'around'], ['ambi', 'around'], ['circum', 'around'], ['kyklos', 'around']] },
  { id: 'language', label: 'Greek or Latin', buckets: [['Greek', 'Greek roots'], ['Latin', 'Latin roots']], items: 'language' },
  /* Set 2: drag each word from the sheet to the root it comes from. items: 'derivs' uses DERIVS for the listed roots. */
  { id: 'sheet1', label: 'Sheet 17 to 20: which root?', buckets: [['nomen', 'nomen'], ['pro', 'pro'], ['prae', 'prae'], ['ad', 'ad']], items: 'derivs' },
  { id: 'sheet2', label: 'Sheet 21 to 24: which root?', buckets: [['jacio', 'jacio'], ['pono', 'pono'], ['cum', 'cum'], ['figo', 'figo']], items: 'derivs' }
];
