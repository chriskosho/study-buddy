/* Julius Caesar and Pompey: content.
   Source: two pages of the student's class notes, photographed by the owner: "Julius Caesar and Pompey" and "Caesar and Pompey (cont'd)".
   Wording follows the notes. Fixed on copying: "well know" is "well known", "Soilder" is "soldier", and a capital and a full stop were added to
   each line. The summary on page 2 reads "Cleopata" on the photo (the pencil word); it is spelled "Cleopatra" here.
   Fill it in uses the words the student filled in with pencil (Gallic, Gaul, Rome, Caesar, Pompey, Rubicon, Egypt, Cleopatra) and seven more key words I chose
   (dishonest, soldier, general, civil, killed, government, secretly).
   NOT on the photos, and marked "added" or "Historians say" in the app: the Historians say notes (SAY below, each with a Wikipedia article as its source),
   the wrong answers in the quiz, and the Sort it and Put in order cards worded from the notes' table and summaries (the order follows the summaries). */

const PAGES = [
  { id: 'p1', label: 'Julius Caesar and Pompey', rows: [
    ['Changes in the Republic', 'The republic became very greedy and dishonest as it gained more power and land.'],
    ['Julius Caesar', 'Became a well known soldier who worked his way through government.'],
    ['Pompey', 'The greatest Roman general who formed an alliance with Caesar.'],
    ['Gallic Wars', 'Caesar conquered Gaul for Rome and became the greatest Roman general.']
  ], summary: 'Caesar worked his way up through government and made friends and enemies. He formed an alliance with Pompey, the greatest Roman general, but tensions grew and Caesar replaced Pompey as the greatest general.' },
  { id: 'p2', label: 'Caesar and Pompey (cont’d)', rows: [
    ['Crossing the Rubicon', 'Caesar led his army over the Rubicon River into Rome, starting a civil war against Pompey.'],
    ['Cleopatra', 'The smart and beautiful queen of Egypt who Caesar fell in love with.'],
    ['Result', 'Caesar won the civil war when the king of Egypt killed Pompey.']
  ], summary: 'Pompey and Caesar started to secretly fight. Caesar crossed the Rubicon River starting a civil war. Caesar went to Egypt and fell in love with Cleopatra.' }
];
const CARDS = PAGES.flatMap(p => p.rows);

/* "Historians say" notes (added; not on the photos). The notes keep the teacher's wording; these add what historians say, with Wikipedia as the source.
   Keys are the row names above. */
const WIKI = 'https://en.wikipedia.org/wiki/';
const SAY = {
  'Changes in the Republic': { text: 'Historians call this time the crisis of the Roman Republic. They point to a growing gap between rich and poor, rivalry and violence among leading families and politicians, and powerful generals whose soldiers were loyal to them.', page: 'Crisis_of_the_Roman_Republic', label: 'Crisis of the Roman Republic' },
  'Pompey': { text: 'Historians say the alliance had a third member, Crassus, and call the three men the First Triumvirate.', page: 'First_Triumvirate', label: 'First Triumvirate' },
  'Gallic Wars': { text: 'Historians say the Gallic Wars lasted about eight years, from 58 to 50 B.C. Caesar wrote his own account of them, so historians read it with care.', page: 'Gallic_Wars', label: 'Gallic Wars' },
  'Crossing the Rubicon': { text: 'Historians say Caesar crossed the Rubicon in early 49 B.C., probably in January. Today, “crossing the Rubicon” means making a choice that cannot be taken back.', page: 'Rubicon', label: 'Rubicon' },
  'Cleopatra': { text: 'Historians say Caesar stayed in Egypt to settle a fight for the throne between Cleopatra and her brother, King Ptolemy XIII, and later fought Ptolemy’s forces.', page: 'Cleopatra', label: 'Cleopatra' },
  'Result': { text: 'Historians say Pompey was killed in 48 B.C., soon after he landed in Egypt, by courtiers of the young king Ptolemy XIII.', page: 'Pompey', label: 'Pompey' }
};

/* Quiz: only what the notes say. The wrong answers are added. */
const QUIZ = [
  { q: 'What happened to the republic as it gained more power and land?', a: 'It became very greedy and dishonest', wrong: ['It gave its land away', 'It became more honest', 'It became smaller and poorer'], why: 'The republic became very greedy and dishonest as it gained more power and land.' },
  { q: 'How did Julius Caesar rise?', a: 'He became a well known soldier and worked his way through government', wrong: ['He was born a king', 'He was chosen by the gods', 'He was given the army by Pompey'], why: 'Julius Caesar became a well known soldier who worked his way through government.' },
  { q: 'Who was the greatest Roman general who formed an alliance with Caesar?', a: 'Pompey', wrong: ['Hannibal', 'Romulus', 'Cleopatra'], why: 'Pompey was the greatest Roman general who formed an alliance with Caesar.' },
  { q: 'What did Caesar conquer for Rome in the Gallic Wars?', a: 'Gaul', wrong: ['Egypt', 'Carthage', 'Greece'], why: 'Caesar conquered Gaul for Rome and became the greatest Roman general.' },
  { q: 'What did Caesar become after conquering Gaul?', a: 'The greatest Roman general', wrong: ['The king of Rome', 'The queen of Egypt', 'A friend of Cleopatra'], why: 'Caesar conquered Gaul for Rome and became the greatest Roman general.' },
  { q: 'What happened when tensions grew between Caesar and Pompey?', a: 'Caesar replaced Pompey as the greatest general', wrong: ['Pompey replaced Caesar as the greatest general', 'They ruled Rome as kings together', 'Pompey conquered Gaul'], why: 'Tensions grew and Caesar replaced Pompey as the greatest general.' },
  { q: 'What did Caesar do at the Rubicon River?', a: 'He led his army over it into Rome, starting a civil war', wrong: ['He built a bridge for Pompey', 'He signed a peace treaty', 'He sailed to Egypt'], why: 'Caesar led his army over the Rubicon River into Rome, starting a civil war against Pompey.' },
  { q: 'Who did Caesar fight in the civil war?', a: 'Pompey', wrong: ['Cleopatra', 'Remus', 'Gaul'], why: 'The civil war was against Pompey.' },
  { q: 'Who was Cleopatra?', a: 'The smart and beautiful queen of Egypt', wrong: ['A Roman general', 'Pompey’s wife', 'The queen of Gaul'], why: 'Cleopatra was the smart and beautiful queen of Egypt who Caesar fell in love with.' },
  { q: 'Which queen did Caesar fall in love with?', a: 'Cleopatra', wrong: ['The queen of Gaul', 'The queen of Carthage', 'The queen of Rome'], why: 'Caesar fell in love with Cleopatra, the queen of Egypt.' },
  { q: 'Who killed Pompey?', a: 'The king of Egypt', wrong: ['Caesar', 'Cleopatra', 'Hannibal'], why: 'Caesar won the civil war when the king of Egypt killed Pompey.' },
  { q: 'How did Caesar win the civil war?', a: 'The king of Egypt killed Pompey', wrong: ['Pompey gave up Rome', 'Cleopatra’s army beat Pompey', 'The Senate chose Caesar'], why: 'Caesar won the civil war when the king of Egypt killed Pompey.' }
];

/* Sort it: who is each fact about? Worded from the notes' table and summaries (added wording). */
const SORTS = [
  { id: 'who', label: 'Who is it about?', buckets: ['Caesar', 'Pompey', 'Cleopatra'], items: [
    ['Worked his way through government', 'Caesar'], ['Conquered Gaul for Rome', 'Caesar'], ['Led his army over the Rubicon River into Rome', 'Caesar'], ['Won the civil war', 'Caesar'],
    ['Was replaced by Caesar as the greatest general', 'Pompey'], ['Was the general Caesar fought in the civil war', 'Pompey'], ['Was killed by the king of Egypt', 'Pompey'],
    ['The smart and beautiful queen of Egypt', 'Cleopatra'], ['The queen Caesar fell in love with', 'Cleopatra']
  ] }
];

/* Put in order: follows the notes' two summaries (the cards are worded from them). */
const ORDERS = [
  { id: 'rise', label: 'Caesar rises', hint: 'From the first summary.', items: ['Caesar works his way up through government', 'Caesar forms an alliance with Pompey', 'Tensions grow between Caesar and Pompey', 'Caesar replaces Pompey as the greatest general'] },
  { id: 'war', label: 'The civil war', hint: 'From the second summary.', items: ['Pompey and Caesar start to secretly fight', 'Caesar crosses the Rubicon River, starting a civil war', 'Caesar goes to Egypt and falls in love with Cleopatra'] },
  { id: 'all', label: 'The whole story', hint: 'Both pages, from the first step to the last.', items: ['Caesar works his way up through government', 'Caesar forms an alliance with Pompey', 'Caesar conquers Gaul in the Gallic Wars', 'Caesar replaces Pompey as the greatest general', 'Pompey and Caesar start to secretly fight', 'Caesar crosses the Rubicon River, starting a civil war', 'Caesar goes to Egypt and falls in love with Cleopatra'] }
];

/* Fill it in: the notes' sentences with a key word taken out, the way the student's own notes do it. */
const BLANKS = [
  ['The republic became very greedy and ___ as it gained more power and land.', ['dishonest']],
  ['Julius Caesar became a well known ___ who worked his way through government.', ['soldier']],
  ['Pompey was the greatest Roman ___ who formed an alliance with Caesar.', ['general']],
  ['Pompey formed an alliance with ___.', ['Caesar']],
  ['Caesar conquered ___ for Rome.', ['Gaul']],
  ['Caesar conquered Gaul for ___ and became the greatest Roman general.', ['Rome']],
  ['In the ___ Wars, Caesar conquered Gaul for Rome.', ['Gallic']],
  ['Caesar led his army over the ___ River into Rome, starting a civil war against Pompey.', ['Rubicon']],
  ['Caesar led his army over the Rubicon River into Rome, starting a ___ war against Pompey.', ['civil']],
  ['Cleopatra was the smart and beautiful queen of ___.', ['Egypt']],
  ['Caesar fell in love with ___.', ['Cleopatra']],
  ['Caesar won the civil war when the king of Egypt ___ Pompey.', ['killed', 'murdered']],
  ['Caesar worked his way up through ___ and made friends and enemies.', ['government']],
  ['Tensions grew and Caesar replaced ___ as the greatest general.', ['Pompey']],
  ['Pompey and Caesar started to ___ fight.', ['secretly']]
];

/* Explain it: the notes' summaries, asked as questions. */
const EXPLAIN = [
  { q: 'Explain how Julius Caesar rose to power and what happened between Caesar and Pompey.', teacher: true,
    model: 'Caesar worked his way up through government and made friends and enemies. He formed an alliance with Pompey, the greatest Roman general, but tensions grew and Caesar replaced Pompey as the greatest general.',
    ideas: [
      { label: 'Caesar worked his way up through government', all: [['government', 'senate', 'politic', 'worked his way', 'rose', 'climbed']] },
      { label: 'He formed an alliance with Pompey, the greatest general', all: [['alliance', 'allied', 'allies', 'partner', 'team up', 'formed'], ['pompey']] },
      { label: 'Tensions grew and Caesar replaced Pompey as the greatest general', all: [['tension', 'fight', 'argu', 'rival', 'enem', 'jealous'], ['replace', 'took over', 'took his place', 'became the greatest', 'beat']] }
    ] },
  { q: 'Explain how the civil war between Caesar and Pompey began and how it ended.', teacher: true,
    model: 'Pompey and Caesar started to secretly fight. Caesar led his army over the Rubicon River into Rome, which started a civil war against Pompey. Caesar won the civil war when the king of Egypt killed Pompey.',
    ideas: [
      { label: 'Pompey and Caesar started to secretly fight', all: [['secret', 'tension', 'fight', 'argu', 'rival'], ['pompey', 'caesar']] },
      { label: 'Caesar led his army over the Rubicon River into Rome, starting a civil war', all: [['rubicon'], ['army', 'soldier', 'troops', 'crossed', 'led'], ['civil', 'war']] },
      { label: 'Caesar won when the king of Egypt killed Pompey', all: [['egypt'], ['kill', 'murder', 'dead', 'died']] }
    ] },
  { q: 'Who was Cleopatra, and what did Caesar do in Egypt?', teacher: true,
    model: 'Cleopatra was the smart and beautiful queen of Egypt. Caesar went to Egypt and fell in love with her.',
    ideas: [
      { label: 'Cleopatra was the queen of Egypt', all: [['queen', 'ruler'], ['egypt']] },
      { label: 'Caesar fell in love with her', all: [['love', 'loved', 'fell for']] }
    ] }
];
