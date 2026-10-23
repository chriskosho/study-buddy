/* Ancient Rome: content.
   Source: "Ancient Rome Test 1: Study Guide" (3 pages, photographed by the owner).
   Wording follows the study guide so practice matches the test.
   GODS is NOT on the photographed pages (the guide says to use the class gods chart). It is the standard list of the
   12 Roman Olympians and is marked in the app as "check against your class chart". Replace it with the class chart when available.
   The Mediterranean map places are in the class notes and are not included yet. */

const GUIDE = [
  { id: 'founding', label: 'Timeline and founding', blocks: [
    { h: 'Timeline words', rows: [
      ['B.C.', '"Before Christ"'],
      ['A.D.', '"Year of the Lord"'],
      ['B.C.E.', '"Before the common era." Same as B.C.'],
      ['C.E.', '"Common era." Same as A.D.']
    ] },
    { h: 'Founding of Rome', rows: [
      ['Romulus and Remus', 'Twin sons of the god Mars. They were sent down a river as babies, and were found and cared for by a she-wolf.'],
      ['Romulus', 'Killed Remus when they grew up, and became the first king of Rome in 753 B.C. This began the Roman Monarchy.'],
      ['Latin', 'The language of Rome.']
    ] }
  ] },
  { id: 'religion', label: 'Religion', blocks: [
    { h: 'Roman religion', rows: [
      ['Temples', 'Where Romans worshiped their gods.'],
      ['Polytheistic', 'Romans believed in more than one god, so they were polytheistic.'],
      ['Olympians', 'The 12 main gods and goddesses.']
    ] },
    { h: 'Gods and goddesses', gods: true, note: 'Not on the study guide pages. This is the usual list of 12. Check it against your class chart.' }
  ] },
  { id: 'gov', label: 'Kinds of government', table: true },
  { id: 'republic', label: 'Republic and classes', blocks: [
    { h: 'Parts of the Roman Republic government', rows: [
      ['Senate', '300 male citizens who helped create laws and elect consuls.'],
      ['Consuls', '2 male citizens who had the final say on laws and wars. They had the most power of any government official.'],
      ['Dictator', '1 male citizen who was elected for 6 months in times of war.'],
      ['Checks and balances', 'Each part of government kept the others from gaining too much power.']
    ] },
    { h: 'Social classes in the Roman Republic', rows: [
      ['Patricians', 'Upper, wealthy, powerful, and smaller social class in Rome.'],
      ['Plebeians', 'Lower, poorer, but larger social class in Rome.'],
      ['Slaves', 'Not citizens, no money, but the largest class in Rome.']
    ] }
  ] },
  { id: 'explain', label: 'Explain in sentences', explain: true }
];

const GOVS = [
  { name: 'Monarchy', what: 'Rule of one king. Began in 753 B.C.', good: 'Very quick decisions.', bad: 'Too much power for one person to have.' },
  { name: 'Democracy', what: 'Rule of the people. Rome never had a democracy.', good: 'Everyone has a say or a vote.', bad: 'Very slow. Disagreements happened easily.' },
  { name: 'Republic', what: 'Rule of elected representatives (some but not all people). Began in 509 B.C.', good: 'Everyone gets a say by voting for representatives. Fewer people have power, so quicker decisions can be made.', bad: 'Not all Romans were treated equally with equal rights. Laws favored patricians.' }
];

const GODS = [
  { name: 'Jupiter', attr: 'King of the gods; god of the sky and thunder' },
  { name: 'Juno', attr: 'Queen of the gods; goddess of marriage' },
  { name: 'Neptune', attr: 'God of the sea' },
  { name: 'Minerva', attr: 'Goddess of wisdom and crafts' },
  { name: 'Mars', attr: 'God of war; father of Romulus and Remus' },
  { name: 'Venus', attr: 'Goddess of love and beauty' },
  { name: 'Apollo', attr: 'God of the sun, music, poetry, and healing' },
  { name: 'Diana', attr: 'Goddess of the hunt and the moon' },
  { name: 'Vulcan', attr: 'God of fire and blacksmiths' },
  { name: 'Vesta', attr: 'Goddess of the hearth and home' },
  { name: 'Mercury', attr: 'Messenger of the gods; god of travelers' },
  { name: 'Ceres', attr: 'Goddess of the harvest and grain' }
];

/* Flashcards: term on the front, meaning on the back. */
const CARDS = [
  ['B.C.', '"Before Christ"'],
  ['A.D.', '"Year of the Lord"'],
  ['B.C.E.', '"Before the common era." Same as B.C.'],
  ['C.E.', '"Common era." Same as A.D.'],
  ['Romulus and Remus', 'Twin sons of the god Mars. Sent down a river as babies and cared for by a she-wolf.'],
  ['Romulus', 'Killed Remus and became the first king of Rome in 753 B.C.'],
  ['753 B.C.', 'Romulus becomes the first king of Rome. The Roman Monarchy begins.'],
  ['509 B.C.', 'The Roman Republic begins.'],
  ['Latin', 'The language of Rome.'],
  ['Temples', 'Where Romans worshiped their gods.'],
  ['Polytheistic', 'Believing in more than one god.'],
  ['Olympians', 'The 12 main gods and goddesses.'],
  ['Monarchy', 'Rule of one king. Good: very quick decisions. Bad: too much power for one person.'],
  ['Democracy', 'Rule of the people. Rome never had one. Good: everyone has a say. Bad: very slow, and disagreements happen easily.'],
  ['Republic', 'Rule of elected representatives (some but not all people). Began in 509 B.C. Good: everyone gets a say by voting for representatives, and fewer people in power means quicker decisions. Bad: not all Romans were treated equally with equal rights; laws favored patricians.'],
  ['Senate', '300 male citizens who helped create laws and elect consuls.'],
  ['Consuls', '2 male citizens with the final say on laws and wars. The most power of any official.'],
  ['Dictator', '1 male citizen elected for 6 months in times of war.'],
  ['Checks and balances', 'Each part of government kept the others from gaining too much power.'],
  ['Patricians', 'Upper, wealthy, powerful, and smaller social class.'],
  ['Plebeians', 'Lower, poorer, but larger social class.'],
  ['Slaves', 'Not citizens, no money, but the largest class in Rome.']
];

/* Quiz: one right answer and three wrong ones. */
const QUIZ = [
  { q: 'What does B.C. stand for?', a: 'Before Christ', wrong: ['Before Caesar', 'Before the Calendar', 'Before Citizens'] },
  { q: 'What does A.D. mean?', a: 'Year of the Lord', wrong: ['After Death', 'After the Dictator', 'Age of the Dynasty'] },
  { q: 'B.C.E. means the same thing as:', a: 'B.C.', wrong: ['A.D.', 'C.E.', 'Year of the Lord'] },
  { q: 'C.E. means "common era." It means the same thing as:', a: 'A.D.', wrong: ['B.C.', 'B.C.E.', 'The Monarchy'] },
  { q: 'Romulus and Remus were the twin sons of which god?', a: 'Mars', wrong: ['Jupiter', 'Neptune', 'Apollo'] },
  { q: 'Who found and cared for Romulus and Remus as babies?', a: 'A she-wolf', wrong: ['A bear', 'An eagle', 'A Roman senator'] },
  { q: 'Who became the first king of Rome?', a: 'Romulus', wrong: ['Remus', 'Mars', 'A consul'] },
  { q: 'When did Romulus become the first king of Rome?', a: '753 B.C.', wrong: ['509 B.C.', 'A.D. 753', '300 B.C.'] },
  { q: 'Romulus becoming king began the Roman:', a: 'Monarchy', wrong: ['Republic', 'Democracy', 'Senate'] },
  { q: 'What was the language of Rome?', a: 'Latin', wrong: ['Greek', 'Italian', 'English'] },
  { q: 'Where did Romans worship their gods?', a: 'Temples', wrong: ['The Senate', 'Pyramids', 'Castles'] },
  { q: 'Romans believed in more than one god. This means they were:', a: 'Polytheistic', wrong: ['Monotheistic', 'Patricians', 'Plebeians'] },
  { q: 'What are the 12 main gods and goddesses called?', a: 'The Olympians', wrong: ['The Consuls', 'The Senators', 'The Patricians'] },
  { q: 'What is a monarchy?', a: 'Rule of one king', wrong: ['Rule of the people', 'Rule of elected representatives', 'Rule of the Senate'] },
  { q: 'What is a democracy?', a: 'Rule of the people', wrong: ['Rule of one king', 'Rule of the consuls', 'Rule of the patricians'] },
  { q: 'What is a republic?', a: 'Rule of elected representatives', wrong: ['Rule of one king', 'Rule of all the people', 'Rule of one dictator'] },
  { q: 'Which kind of government did Rome never have?', a: 'Democracy', wrong: ['Monarchy', 'Republic', 'Rome had all three'] },
  { q: 'When did the Roman Republic begin?', a: '509 B.C.', wrong: ['753 B.C.', 'A.D. 509', '300 B.C.'] },
  { q: 'What is a good aspect of a monarchy?', a: 'Very quick decisions', wrong: ['Everyone has a vote', 'Laws treat everyone equally', 'Power is shared'] },
  { q: 'What is a bad aspect of a monarchy?', a: 'Too much power for one person', wrong: ['Decisions are very slow', 'Too many people vote', 'There is no king'] },
  { q: 'What is a bad aspect of a democracy?', a: 'Very slow, and disagreements happen easily', wrong: ['Too much power for one person', 'Laws favored patricians', 'Only a dictator decides'] },
  { q: 'What is a bad aspect of the Roman Republic?', a: 'Not all Romans were treated equally; laws favored patricians', wrong: ['Too much power for one person', 'No one could vote', 'Decisions were never made'] },
  { q: 'What is a good aspect of a democracy?', a: 'Everyone has a say or a vote', wrong: ['Very quick decisions', 'One king makes every choice', 'Laws favored patricians'] },
  { q: 'What is a good aspect of a republic?', a: 'Everyone gets a say by voting for representatives', wrong: ['One king makes every decision', 'No one has to vote', 'Only slaves make the laws'] },
  { q: 'Why can a republic make quicker decisions than a democracy?', a: 'Fewer people have power', wrong: ['There is one king', 'Everyone votes on every law', 'There are no laws'] },
  { q: 'What did the Senate do?', a: 'Helped create laws and elect consuls', wrong: ['Led the army for 6 months', 'Ruled as one king', 'Worked in the temples'] },
  { q: 'Who had the most power of any government official in the Republic?', a: 'The consuls', wrong: ['The senators', 'The plebeians', 'The patricians'] },
  { q: 'What did Romulus do when he and Remus grew up?', a: 'Killed Remus and became the first king', wrong: ['Left Rome with Remus', 'Became a consul', 'Built the Senate with Remus'] },
  { q: 'What happened to Romulus and Remus as babies?', a: 'They were sent down a river', wrong: ['They were raised by a king', 'They were born in a temple', 'They were elected consuls'] },
  { q: 'How many male citizens were in the Senate?', a: '300', wrong: ['2', '12', '100'] },
  { q: 'Who had the final say on laws and wars?', a: 'The 2 consuls', wrong: ['The Senate', 'The plebeians', 'The slaves'] },
  { q: 'For how long was a dictator elected?', a: '6 months, in times of war', wrong: ['For life', '1 year, in times of peace', '6 years'] },
  { q: 'What does "checks and balances" mean?', a: 'Each part of government kept the others from gaining too much power', wrong: ['The consuls counted the money', 'The king checked every law', 'Everyone paid the same taxes'] },
  { q: 'Which social class was upper, wealthy, powerful, and smaller?', a: 'Patricians', wrong: ['Plebeians', 'Slaves', 'Consuls'] },
  { q: 'Which social class was lower, poorer, but larger?', a: 'Plebeians', wrong: ['Patricians', 'Senators', 'Consuls'] },
  { q: 'Which group was not citizens, had no money, but was the largest class?', a: 'Slaves', wrong: ['Plebeians', 'Patricians', 'Senators'] }
];

/* Sort it: three sets from the study guide charts. */
const SORTS = [
  { id: 'gov', label: 'Governments', buckets: ['Monarchy', 'Democracy', 'Republic'], items: [
    ['Rule of one king', 'Monarchy'], ['Began in 753 B.C.', 'Monarchy'], ['Very quick decisions', 'Monarchy'], ['Too much power for one person', 'Monarchy'],
    ['Rule of the people', 'Democracy'], ['Rome never had one', 'Democracy'], ['Very slow', 'Democracy'], ['Disagreements happened easily', 'Democracy'],
    ['Rule of elected representatives', 'Republic'], ['Began in 509 B.C.', 'Republic'], ['People vote for representatives', 'Republic'], ['Laws favored patricians', 'Republic'], ['Fewer people have power', 'Republic']
  ] },
  { id: 'parts', label: 'Parts of the Republic', buckets: ['Senate', 'Consuls', 'Dictator'], items: [
    ['300 male citizens', 'Senate'], ['Helped create laws', 'Senate'], ['Helped elect consuls', 'Senate'],
    ['2 male citizens', 'Consuls'], ['Final say on laws and wars', 'Consuls'], ['Most power of any official', 'Consuls'],
    ['1 male citizen', 'Dictator'], ['Elected for 6 months', 'Dictator'], ['Only in times of war', 'Dictator']
  ] },
  { id: 'classes', label: 'Social classes', buckets: ['Patricians', 'Plebeians', 'Slaves'], items: [
    ['Upper class', 'Patricians'], ['Wealthy and powerful', 'Patricians'], ['Smaller class', 'Patricians'],
    ['Lower class', 'Plebeians'], ['Poorer, but larger', 'Plebeians'], ['Citizens without much power', 'Plebeians'],
    ['Not citizens', 'Slaves'], ['No money', 'Slaves'], ['Largest class in Rome', 'Slaves']
  ] }
];

/* Fill it in: type the missing word. Any answer in `a` counts. */
const BLANKS = [
  { s: 'Romulus became the first king of Rome in ___ B.C.', a: ['753', '753 BC', '753 B.C.'] },
  { s: 'The Roman Republic began in ___ B.C.', a: ['509', '509 BC', '509 B.C.'] },
  { s: 'Romulus and Remus were twin sons of the god ___.', a: ['Mars'] },
  { s: 'Romulus and Remus were found and cared for by a ___.', a: ['she-wolf', 'she wolf', 'shewolf', 'wolf'] },
  { s: 'The language of Rome was ___.', a: ['Latin'] },
  { s: 'Romans worshiped their gods in ___.', a: ['temples', 'temple'] },
  { s: 'Romans believed in more than one god, so they were ___.', a: ['polytheistic'] },
  { s: 'The 12 main gods and goddesses are called the ___.', a: ['Olympians', 'Olympian'] },
  { s: 'Romulus becoming king began the Roman ___.', a: ['Monarchy'] },
  { s: 'Rule of one king is called a ___.', a: ['monarchy'] },
  { s: 'Rule of the people is called a ___.', a: ['democracy'] },
  { s: 'Rule of elected representatives is called a ___.', a: ['republic'] },
  { s: 'The Senate had ___ male citizens.', a: ['300', 'three hundred'] },
  { s: 'The consuls were ___ male citizens.', a: ['2', 'two'] },
  { s: 'A dictator was elected for ___ months in times of war.', a: ['6', 'six'] },
  { s: 'The upper, wealthy, powerful social class was the ___.', a: ['patricians', 'patrician'] },
  { s: 'The lower, poorer, but larger social class was the ___.', a: ['plebeians', 'plebeian', 'plebs'] },
  { s: 'B.C.E. means "before the ___ era."', a: ['common'] },
  { s: 'Each part of government kept the others from gaining too much power. This is called checks and ___.', a: ['balances'] }
];

/* Explain it: answer in complete sentences. Each idea is found when one word from EVERY group appears. */
const EXPLAIN = [
  { q: 'How does a republic combine the good of a monarchy with the good of a democracy?', teacher: true,
    model: 'A republic has a few rulers, so they can still make quick decisions like in a monarchy. A republic is the rule of elected representatives, so the people still have a say in who their rulers are, like in a democracy.',
    ideas: [
      { label: 'A republic has a few rulers', all: [['few', 'small group', 'representative', 'not many']] },
      { label: 'So it can make quick decisions, like a monarchy', all: [['quick', 'fast', 'faster', 'quicker', 'quickly'], ['monarch', 'king']] },
      { label: 'People elect their rulers and have a say, like a democracy', all: [['elect', 'vote', 'choose', 'say in who'], ['democra']] }
    ] },
  { q: 'Explain a monarchy: what it is, when Rome had it, one good thing, and one bad thing.',
    model: 'A monarchy is the rule of one king. Rome\'s monarchy began in 753 B.C. A good thing is that decisions are very quick. A bad thing is that one person has too much power.',
    ideas: [
      { label: 'Rule of one king', all: [['king', 'one ruler', 'one person']] },
      { label: 'Began in 753 B.C.', all: [['753']] },
      { label: 'Good: very quick decisions', all: [['quick', 'fast']] },
      { label: 'Bad: too much power for one person', all: [['power']] }
    ] },
  { q: 'Explain a democracy: what it is, whether Rome had it, one good thing, and one bad thing.',
    model: 'A democracy is the rule of the people. Rome never had a democracy. A good thing is that everyone has a say or a vote. A bad thing is that it is very slow, and disagreements happen easily.',
    ideas: [
      { label: 'Rule of the people', all: [['people', 'everyone', 'citizens']] },
      { label: 'Rome never had one', all: [['never', 'did not', "didn't", 'not have']] },
      { label: 'Good: everyone has a say or vote', all: [['say', 'vote']] },
      { label: 'Bad: very slow, disagreements', all: [['slow', 'disagree']] }
    ] },
  { q: 'Explain a republic: what it is, when Rome had it, one good thing, and one bad thing.',
    model: 'A republic is the rule of elected representatives. The Roman Republic began in 509 B.C. A good thing is that people get a say by voting for representatives. A bad thing is that not all Romans were treated equally, and laws favored patricians.',
    ideas: [
      { label: 'Rule of elected representatives', all: [['represent', 'elect']] },
      { label: 'Began in 509 B.C.', all: [['509']] },
      { label: 'Good: people vote, or quicker decisions', all: [['vote', 'say', 'quick', 'fewer']] },
      { label: 'Bad: not treated equally, laws favored patricians', all: [['patrician', 'not treated equal', 'not equal', 'unequal', 'unfair', 'favored', 'favour']] }
    ] },
  { q: 'What are checks and balances in the Roman Republic?',
    model: 'Checks and balances means each part of the government kept the other parts from gaining too much power.',
    ideas: [
      { label: 'Each part of government', all: [['part', 'each', 'senate', 'consul', 'branch']] },
      { label: 'Kept the others from gaining too much power', all: [['power']] }
    ] }
];
