/* Greek and Latin Roots: content.
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
    eg: 'We measured the circumference of the tree trunk.', stems: ['circumference', 'circumnavigat', 'circumstance'] }
];

const LEVELS = [
  { id: 'easy', label: 'Easy', sub: 'Animals' },
  { id: 'medium', label: 'Medium', sub: 'Birds and more' },
  { id: 'hard', label: 'Hard', sub: 'Both and around' },
  { id: 'insane', label: 'Insane', sub: 'Two-root words' }
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

/* Sort it: groups by meaning, and Greek or Latin. */
const SORTS = [
  { id: 'animals', label: 'Animals', buckets: [['horse', 'Horse roots'], ['bird', 'Bird roots'], ['animal', 'Other animal roots']],
    items: [['equus', 'horse'], ['caballus', 'horse'], ['hippos', 'horse'], ['ornis', 'bird'], ['avis', 'bird'], ['porcus', 'animal'], ['canis', 'animal'], ['leon', 'animal'], ['feles', 'animal']] },
  { id: 'meanings', label: 'Good, bad, around', buckets: [['good', 'Good or bad roots'], ['around', 'Both, around, or circle roots']],
    items: [['eu', 'good'], ['malus', 'good'], ['amphi', 'around'], ['ambi', 'around'], ['circum', 'around'], ['kyklos', 'around']] },
  { id: 'language', label: 'Greek or Latin', buckets: [['Greek', 'Greek roots'], ['Latin', 'Latin roots']], items: 'language' }
];
