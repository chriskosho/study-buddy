/* The Punic Wars: content.
   SOURCE: the student's class notes on three note pages: "Carthage & 1st Punic War", "Hannibal and 2nd Punic War", and "Results of 2nd PW and 3rd PW".
   The notes keep the teacher's wording (spelling fixed only). The bottom of the second and third pages (the Summary lines) is cut off in the photos,
   so the module's summaries are written from the notes and say so.
   ADDED means it is not in the notes: dates, places, and background written for this module (marked in the app as "added", and kept out of Quiz,
   Type the answer, and Explain it, which stay on the notes). The map tools and the timeline use some added places and dates, and say so. */

/* ---- the notes, as the study guide shows them ---- */
const GUIDE = [
  { id: 'war1', label: 'Carthage and the 1st Punic War', art: 'ship', rows: [
    ['Carthage', 'An ancient city in North Africa that was Rome’s rival for power.'],
    ['Punic Wars', '3 wars fought between Rome and Carthage for control of the Mediterranean Sea.'],
    ['1st Punic War', 'Carthage attacked Sicily with its strong navy, but Rome copied their navy and won the war.']
  ] },
  { id: 'war2', label: 'Hannibal and the 2nd Punic War', art: 'alps', rows: [
    ['Hannibal', 'Carthaginian general during the 2nd Punic War.'],
    ['Scipio Africanus', 'Roman general who attacked Carthage, leading Rome to victory.'],
    ['2nd Punic War', 'Hannibal attacked Rome by crossing the Alps with elephants. Rome attacked Carthage and Carthage surrendered.']
  ] },
  { id: 'war3', label: 'Results of the 2nd war, and the 3rd Punic War', art: 'fire', rows: [
    ['Peace Treaty of the 2nd Punic War', '1) Carthage had to give Spain to Rome. 2) Carthage had to pay Rome a lot of money. 3) Carthage could not start another war without Rome’s permission.'],
    ['3rd Punic War', 'Carthage attacked another country, so Rome attacked Carthage. Carthage surrendered, but Rome still burned Carthage down and poured salt into the soil.'],
    ['Result', 'Rome became the greatest power on the Mediterranean Sea.']
  ] }
];
/* the summary lines from the notes (the photo cuts the ends off, so these are completed from the rest of the notes) */
const SUMMARIES = [
  'Carthage and Rome were rivals. Carthage attacked Sicily with its strong navy, but Rome copied the navy and won the 1st Punic War.',
  'Hannibal led the Carthaginian army and started the 2nd Punic War by crossing the Alps with elephants. Scipio Africanus led the Romans, attacked Carthage, and Carthage surrendered.',
  'Rome made a treaty with Carthage. Carthage broke the treaty. Rome attacked Carthage in the 3rd Punic War. Rome became the greatest power on the Mediterranean Sea.'
];

/* ---- added background: "More to know" (not in the notes) ---- */
const MORE = [
  ['Why “Punic”?', 'Punic comes from the Latin word for Phoenician. Carthage was started by Phoenicians, sailors and traders from the eastern Mediterranean.'],
  ['The 1st war, 264 to 241 B.C.', 'It was fought around Sicily and at sea. Rome had no real navy, so it copied a Carthaginian warship and built a fleet very fast. Rome won the last big sea battle in 241 B.C.'],
  ['The raven bridge', 'Roman ships carried a boarding bridge with a spike, called the corvus (Latin for raven). It locked onto an enemy ship so Roman soldiers could fight as if they were on land.'],
  ['Hannibal’s family', 'Hannibal’s father, Hamilcar Barca, was a Carthaginian general in the 1st war. Carthage lost Sicily, then built up its power in Spain. Hannibal grew up planning to fight Rome.'],
  ['The 2nd war, 218 to 201 B.C.', 'Hannibal marched from Spain, through Gaul (now France), and over the Alps in 218 B.C. Many of his elephants did not survive the cold and the steep paths.'],
  ['Cannae, 216 B.C.', 'Hannibal’s most famous victory. He surrounded a much bigger Roman army in southern Italy. Rome did not give up.'],
  ['Zama, 202 B.C.', 'Rome sent Scipio Africanus to attack Carthage’s lands in North Africa. Hannibal had to hurry home, and Scipio beat him in the battle of Zama. Peace came in 201 B.C.'],
  ['The 3rd war, 149 to 146 B.C.', 'Carthage fought its neighbor Numidia, which the treaty did not allow without Rome’s permission. Rome attacked, and after a long siege Carthage was burned down in 146 B.C.'],
  ['“Carthage must be destroyed”', 'The Roman senator Cato the Elder is said to have ended his speeches with these words, because he thought Carthage was still a danger.'],
  ['Historians say', 'Many historians think the story about pouring salt into Carthage’s soil was added much later. Carthage was burned down, but the salt may be a legend.']
];
const PEOPLE = [
  { name: 'Hannibal', what: 'Carthaginian general', line: 'Led an army from Spain over the Alps, with elephants, to attack Rome in the 2nd Punic War.', notes: true },
  { name: 'Scipio Africanus', what: 'Roman general', line: 'Attacked Carthage and led Rome to victory in the 2nd Punic War.', notes: true },
  { name: 'Hamilcar Barca', what: 'Carthaginian general (added)', line: 'Hannibal’s father. He fought in the 1st Punic War and built up Carthage’s power in Spain.', notes: false },
  { name: 'Cato the Elder', what: 'Roman senator (added)', line: 'Said to have ended his speeches by saying that Carthage must be destroyed.', notes: false }
];

/* ---- flashcards: the notes' terms ---- */
const CARDS = [
  ['Carthage', 'An ancient city in North Africa that was Rome’s rival for power.'],
  ['Punic Wars', '3 wars fought between Rome and Carthage for control of the Mediterranean Sea.'],
  ['1st Punic War', 'Carthage attacked Sicily with its strong navy, but Rome copied their navy and won the war.'],
  ['Hannibal', 'Carthaginian general during the 2nd Punic War.'],
  ['Scipio Africanus', 'Roman general who attacked Carthage, leading Rome to victory.'],
  ['2nd Punic War', 'Hannibal attacked Rome by crossing the Alps with elephants. Rome attacked Carthage and Carthage surrendered.'],
  ['Peace Treaty of the 2nd Punic War', '1) Carthage gave Spain to Rome. 2) Carthage paid Rome a lot of money. 3) Carthage could not start another war without Rome’s permission.'],
  ['3rd Punic War', 'Carthage attacked another country, so Rome attacked Carthage. Carthage surrendered, but Rome still burned Carthage down and poured salt into the soil.'],
  ['Result of the Punic Wars', 'Rome became the greatest power on the Mediterranean Sea.']
];

/* ---- quiz: only what is in the notes ---- */
const QUIZ = [
  { q: 'Where was Carthage?', a: 'North Africa', wrong: ['Spain', 'Sicily', 'Greece'] },
  { q: 'Carthage was Rome’s rival for what?', a: 'Power', wrong: ['Gold', 'Food', 'Gods'] },
  { q: 'How many Punic Wars were there?', a: '3', wrong: ['2', '4', '5'] },
  { q: 'Who fought the Punic Wars?', a: 'Rome and Carthage', wrong: ['Rome and Greece', 'Carthage and Egypt', 'Rome and Spain'] },
  { q: 'What did Rome and Carthage fight to control in the Punic Wars?', a: 'The Mediterranean Sea', wrong: ['The Alps', 'The Nile River', 'The Black Sea'] },
  { q: 'In the 1st Punic War, what did Carthage attack?', a: 'Sicily', wrong: ['Rome', 'Spain', 'Egypt'] },
  { q: 'What did Carthage use to attack Sicily?', a: 'Its strong navy', wrong: ['Elephants', 'A huge wall', 'Catapults on land'] },
  { q: 'How did Rome win the 1st Punic War?', a: 'It copied Carthage’s navy', wrong: ['It crossed the Alps', 'It poured salt on the soil', 'It burned Carthage down'] },
  { q: 'Who won the 1st Punic War?', a: 'Rome', wrong: ['Carthage', 'Sicily', 'Greece'] },
  { q: 'Who was Hannibal?', a: 'A Carthaginian general', wrong: ['A Roman general', 'A Roman emperor', 'A Greek sailor'] },
  { q: 'Which Punic War was Hannibal in?', a: 'The 2nd', wrong: ['The 1st', 'The 3rd', 'All three'] },
  { q: 'How did Hannibal attack Rome?', a: 'By crossing the Alps with elephants', wrong: ['By sailing up the Tiber', 'By tunneling under the walls', 'By crossing the desert on camels'] },
  { q: 'What animals did Hannibal take across the Alps?', a: 'Elephants', wrong: ['Horses only', 'Camels', 'Wolves'] },
  { q: 'Who was Scipio Africanus?', a: 'A Roman general', wrong: ['A Carthaginian general', 'A Greek philosopher', 'A king of Spain'] },
  { q: 'What did Scipio Africanus do?', a: 'Attacked Carthage and led Rome to victory', wrong: ['Crossed the Alps with elephants', 'Burned Rome', 'Started the 1st Punic War'] },
  { q: 'What happened when Rome attacked Carthage in the 2nd Punic War?', a: 'Carthage surrendered', wrong: ['Rome retreated', 'Carthage won', 'Both sides signed a tie'] },
  { q: 'In the peace treaty after the 2nd Punic War, what did Carthage have to give Rome?', a: 'Spain', wrong: ['Sicily', 'Egypt', 'The Alps'] },
  { q: 'What else did the treaty make Carthage do?', a: 'Pay Rome a lot of money', wrong: ['Build Rome a wall', 'Teach Rome to sail', 'Move to Spain'] },
  { q: 'What could Carthage NOT do under the treaty without Rome’s permission?', a: 'Start another war', wrong: ['Trade by sea', 'Build houses', 'Have a general'] },
  { q: 'What started the 3rd Punic War?', a: 'Carthage attacked another country', wrong: ['Hannibal crossed the Alps', 'Rome lost Sicily', 'Rome ran out of money'] },
  { q: 'What did Rome do to Carthage even though it surrendered in the 3rd Punic War?', a: 'Burned it down and poured salt into the soil', wrong: ['Made it a Roman capital', 'Gave it back its land', 'Let it keep its navy'] },
  { q: 'After the Punic Wars, what did Rome become?', a: 'The greatest power on the Mediterranean Sea', wrong: ['A small city again', 'A part of Carthage', 'A land with no army'] },
  { q: 'Which broke the treaty before the 3rd Punic War?', a: 'Carthage', wrong: ['Rome', 'Spain', 'Sicily'] },
  { q: 'Where was the 1st Punic War mostly fought?', a: 'Around Sicily', wrong: ['Around Spain', 'In the Alps', 'In Egypt'] }
];

/* ---- Type the answer: notes sentences with a blank ---- */
const TYPE = [
  { q: 'Carthage was an ancient city in ________ ________ that was Rome’s rival for power.', a: ['North Africa'] },
  { q: 'Carthage was Rome’s rival for ________.', a: ['Power'], noTypo: true },
  { q: 'The Punic Wars were ___ wars fought between Rome and Carthage.', a: ['3', 'three'], noTypo: true },
  { q: 'The Punic Wars were fought for control of the ________________ Sea.', a: ['Mediterranean'] },
  { q: 'In the 1st Punic War, Carthage attacked ________.', a: ['Sicily'] },
  { q: 'Carthage attacked Sicily with its strong ________.', a: ['Navy', 'Fleet'], noTypo: true },
  { q: 'In the 1st Punic War, Rome ________ Carthage’s navy and won the war.', a: ['Copied', 'Copy'] },
  { q: 'Who was the Carthaginian general in the 2nd Punic War?', a: ['Hannibal'] },
  { q: 'Hannibal crossed the ________ with elephants.', a: ['Alps', 'the Alps'], noTypo: true },
  { q: 'Hannibal crossed the Alps with ________.', a: ['Elephants'] },
  { q: 'Who was the Roman general who attacked Carthage and led Rome to victory?', a: ['Scipio Africanus', 'Scipio'] },
  { q: 'Scipio ________ was the Roman general who attacked Carthage.', a: ['Africanus'] },
  { q: 'In the 2nd Punic War, Rome attacked Carthage and Carthage ________.', a: ['Surrendered'] },
  { q: 'In the peace treaty, Carthage had to give ________ to Rome.', a: ['Spain'], noTypo: true },
  { q: 'In the peace treaty, Carthage had to pay Rome a lot of ________.', a: ['Money', 'Gold', 'Silver'], noTypo: true },
  { q: 'Carthage could not start another ________ without Rome’s permission.', a: ['War'], noTypo: true },
  { q: 'Carthage could not start another war without Rome’s ________.', a: ['Permission'] },
  { q: 'In the 3rd Punic War, Rome ________ Carthage down.', a: ['Burned', 'burnt'] },
  { q: 'Rome poured ________ into the soil of Carthage.', a: ['Salt'], noTypo: true },
  { q: 'After the Punic Wars, ________ became the greatest power on the Mediterranean Sea.', a: ['Rome'], noTypo: true }
];

/* ---- Put in order ---- */
const EVENTS = [
  { set: 'wars', text: 'The 1st Punic War: Carthage attacks Sicily, and Rome copies its navy and wins' },
  { set: 'wars', text: 'The 2nd Punic War: Hannibal crosses the Alps with elephants' },
  { set: 'wars', text: 'The peace treaty: Carthage gives up Spain and pays Rome' },
  { set: 'wars', text: 'The 3rd Punic War: Rome attacks Carthage and burns it down' },
  { set: 'wars', text: 'Rome becomes the greatest power on the Mediterranean Sea' },
  { set: 'war2', text: 'Hannibal leads an army and elephants across the Alps' },
  { set: 'war2', text: 'Hannibal attacks Rome' },
  { set: 'war2', text: 'Scipio Africanus attacks Carthage' },
  { set: 'war2', text: 'Carthage surrenders' },
  { set: 'war2', text: 'Carthage gives Spain to Rome and pays Rome a lot of money' },
  { set: 'story', text: 'Carthage attacks Sicily with its strong navy' },
  { set: 'story', text: 'Rome copies the navy and wins the 1st Punic War' },
  { set: 'story', text: 'Hannibal crosses the Alps with elephants' },
  { set: 'story', text: 'Scipio Africanus leads Rome to victory over Carthage' },
  { set: 'story', text: 'Carthage surrenders and signs the peace treaty' },
  { set: 'story', text: 'Carthage attacks another country' },
  { set: 'story', text: 'Rome attacks Carthage and burns it down' },
  { set: 'story', text: 'Rome pours salt into the soil of Carthage' }
];

/* ---- Explain it ---- */
const EXPLAIN = [
  { q: 'Who fought the Punic Wars, and what did they fight for?', teacher: true,
    model: 'The Punic Wars were 3 wars fought between Rome and Carthage for control of the Mediterranean Sea. Carthage was an ancient city in North Africa that was Rome’s rival for power.',
    ideas: [
      { label: 'Rome and Carthage fought', all: [['rome'], ['carthage']] },
      { label: 'There were 3 wars', all: [['3', 'three']] },
      { label: 'For control of the Mediterranean Sea', all: [['mediterranean']] }
    ] },
  { q: 'How did Rome win the 1st Punic War?',
    model: 'Carthage attacked Sicily with its strong navy, but Rome copied their navy and won the war.',
    ideas: [
      { label: 'Carthage attacked Sicily', all: [['sicily']] },
      { label: 'Carthage had a strong navy', all: [['navy', 'ships', 'fleet', 'boats']] },
      { label: 'Rome copied the navy and won', all: [['copied', 'copy', 'built', 'made their own', 'same'], ['won', 'win', 'victory', 'beat', 'defeat']] }
    ] },
  { q: 'Describe how Hannibal attacked Rome in the 2nd Punic War.',
    model: 'Hannibal, a Carthaginian general, attacked Rome by crossing the Alps with elephants.',
    ideas: [
      { label: 'Hannibal was a Carthaginian general', all: [['hannibal'], ['carthage', 'carthaginian', 'general']] },
      { label: 'He crossed the Alps', all: [['alps', 'mountain']] },
      { label: 'With elephants', all: [['elephant']] }
    ] },
  { q: 'How did the 2nd Punic War end?',
    model: 'Rome, led by the general Scipio Africanus, attacked Carthage and Carthage surrendered.',
    ideas: [
      { label: 'Rome attacked Carthage', all: [['rome', 'roman', 'scipio'], ['attack']] },
      { label: 'Scipio Africanus led Rome', all: [['scipio']] },
      { label: 'Carthage surrendered', all: [['surrender', 'gave up', 'give up']] }
    ] },
  { q: 'What did the peace treaty of the 2nd Punic War make Carthage do?',
    model: 'Carthage had to give Spain to Rome, pay Rome a lot of money, and not start another war without Rome’s permission.',
    ideas: [
      { label: 'Give Spain to Rome', all: [['spain']] },
      { label: 'Pay Rome a lot of money', all: [['money', 'pay', 'gold', 'silver']] },
      { label: 'Not start another war without Rome’s permission', all: [['war'], ['permission', 'allow', 'ask', 'approval']] }
    ] },
  { q: 'What happened in the 3rd Punic War, and what was the result of the Punic Wars?',
    model: 'Carthage attacked another country, so Rome attacked Carthage. Carthage surrendered, but Rome still burned Carthage down and poured salt into the soil. Rome became the greatest power on the Mediterranean Sea.',
    ideas: [
      { label: 'Carthage attacked another country, so Rome attacked Carthage', all: [['another country', 'other country', 'another land', 'neighbor'], ['rome', 'roman']] },
      { label: 'Carthage surrendered but was still burned down', all: [['burn', 'burnt', 'destroy'], ['carthage']] },
      { label: 'Salt was poured into the soil', all: [['salt']] },
      { label: 'Rome became the greatest power on the Mediterranean Sea', all: [['rome', 'roman'], ['greatest', 'most powerful', 'strongest', 'ruled', 'power']] }
    ] }
];

/* ---- the map: places (lon, lat). notes: true when the place is in the class notes. ---- */
const PLACES = [
  { id: 'rome', name: 'Rome', lon: 12.5, lat: 41.9, notes: true, d: 'The city that fought three wars against Carthage.' },
  { id: 'carthage', name: 'Carthage', lon: 10.32, lat: 36.85, notes: true, d: 'Ancient city in North Africa, Rome’s rival for power. Burned down in the 3rd Punic War.' },
  { id: 'sicily', name: 'Sicily', lon: 14.3, lat: 37.6, notes: true, d: 'The island Carthage attacked in the 1st Punic War.' },
  { id: 'spain', name: 'Spain', lon: -1.2, lat: 38.3, notes: true, d: 'Carthage had to give Spain to Rome in the peace treaty. Hannibal’s march began here.' },
  { id: 'alps', name: 'The Alps', lon: 7.2, lat: 45.3, notes: true, d: 'The mountains Hannibal crossed with elephants to attack Rome. Historians still argue about which pass he used.' },
  { id: 'sardinia', name: 'Sardinia', lon: 9.0, lat: 40.0, notes: false, d: 'Added: an island between Rome and Carthage. Rome took it from Carthage a few years after the 1st war, in 238 B.C.' },
  { id: 'syracuse', name: 'Syracuse', lon: 15.29, lat: 37.07, notes: false, d: 'Added: a big Greek city on Sicily, with a great harbor.' },
  { id: 'cannae', name: 'Cannae', lon: 16.13, lat: 41.3, notes: false, d: 'Added: where Hannibal won his most famous battle in 216 B.C.' },
  { id: 'zama', name: 'Zama', lon: 9.3, lat: 35.9, notes: false, d: 'Added: where Scipio beat Hannibal in 202 B.C. Historians are not sure of the exact spot.' },
  { id: 'numidia', name: 'Numidia', lon: 6.3, lat: 35.4, notes: false, d: 'Added: the land next to Carthage. Carthage fought Numidia, and that started the 3rd Punic War.' }
];
/* Hannibal's march (added; approximate, and the pass over the Alps is debated) */
const HANNIBAL = [[-1.0, 37.6], [-0.3, 39.7], [0.9, 41.0], [2.9, 42.5], [4.7, 43.9], [6.2, 44.9], [7.2, 45.3], [7.7, 45.1], [9.5, 45.0], [12.1, 43.1], [16.13, 41.3]];
/* Scipio's attack on Carthage's homeland (added) */
const SCIPIO = [[12.4, 37.8], [10.06, 37.06], [10.32, 36.85]];

/* ---- the timeline (years B.C.). notes: true when the idea is in the notes; the dates are added ---- */
const TIMELINE = [
  { y: 264, t: 'The 1st Punic War begins', war: 1, notes: true, d: 'Carthage attacks Sicily with its strong navy.' },
  { y: 260, t: 'Rome wins its first sea battle', war: 1, notes: false, d: 'Added: at Mylae, with its copied ships and the boarding bridge called the corvus.' },
  { y: 241, t: 'Rome wins the 1st Punic War', war: 1, notes: true, d: 'Rome copied the Carthaginian navy and won the war.' },
  { y: 218, t: 'The 2nd Punic War begins: Hannibal crosses the Alps', war: 2, notes: true, d: 'Hannibal, the Carthaginian general, attacks Rome by crossing the Alps with elephants.' },
  { y: 216, t: 'Hannibal wins at Cannae', war: 2, notes: false, d: 'Added: his most famous victory, in southern Italy. Rome did not give up.' },
  { y: 202, t: 'Scipio beats Hannibal at Zama', war: 2, notes: false, d: 'Added: Scipio Africanus attacked Carthage’s homeland, and Hannibal had to come home to fight him.' },
  { y: 201, t: 'The peace treaty', war: 2, notes: true, d: 'Carthage surrendered. It gave Spain to Rome, paid Rome a lot of money, and could not start another war without Rome’s permission.' },
  { y: 149, t: 'The 3rd Punic War begins', war: 3, notes: true, d: 'Carthage attacked another country, so Rome attacked Carthage.' },
  { y: 146, t: 'Carthage is burned down', war: 3, notes: true, d: 'Carthage surrendered, but Rome still burned it down. Rome became the greatest power on the Mediterranean Sea.' }
];
const WARS = [
  { n: 1, label: '1st Punic War', from: 264, to: 241 },
  { n: 2, label: '2nd Punic War', from: 218, to: 201 },
  { n: 3, label: '3rd Punic War', from: 149, to: 146 }
];
