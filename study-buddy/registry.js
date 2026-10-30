/* Study Buddy registry: the list of subjects and modules.
   To add a module: put its folder under modules/<subject>/<module>/ and add one entry below.
   The hub builds itself from this file. Module difficulty is worked out from its tools.

   Module fields
     id        unique id (also used in saved progress, so don't rename it later)
     subject   the home subject id
     tags      extra subjects or skills; a tag that matches another subject puts the module
               in that subject's "Suggested" area
     path      page to open, relative to the site root
     storage   localStorage keys the module saves under SB.moduleKey(...), so an admin reset can clear them
     tools     the activities inside the module

   Tool fields
     id          the module's own name for it (opened with ?tool=<id>)
     difficulty  easy | medium | hard | insane
     kind        'study' for tools with no score (they never count toward mastery)
     masterAt    mastered when the best score reaches this number, or
     masterPct   mastered when best / max reaches this share (default 0.8)
*/
window.SB_REGISTRY = {
  /* The scratch pad button shows on question tools in these subjects (and in any module marked scratchpad: true). Add a subject id to turn it on there. */
  scratchpad: { subjects: ['math'] },
  subjects: [
    { id: 'english', name: 'English' },
    { id: 'math', name: 'Math' },
    { id: 'science', name: 'Science' },
    { id: 'geography', name: 'Geography' },
    { id: 'history', name: 'History' },
    { id: 'roots', name: 'Greek and Latin Roots' },
    { id: 'other', name: 'Other' }
  ],
  modules: [
    {
      id: 'ham-technician',
      subject: 'other',
      title: 'Ham Radio Technician',
      blurb: 'Practice for the FCC Technician license exam (2026 to 2030): all 409 official questions as flashcards by topic, and a 35-question mock exam with explanations.',
      tags: ['science', 'electronics'],
      path: 'modules/other/ham-technician/index.html',
      storage: ['ham-technician'],
      tools: [
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Every question, one topic at a time. Jump to any section.' },
        { id: 'quiz', name: 'Quiz', kind: 'study', difficulty: 'medium', blurb: 'Pick a topic group and answer every question in it (Full), or 10 random ones. Practice only.' },
        { id: 'exam', name: 'Mock exam', difficulty: 'hard', masterAt: 26, blurb: '35 random questions, one from each topic group. 26 right to pass.' }
      ]
    },
    {
      id: 'south-america',
      subject: 'geography',
      title: 'South America',
      blurb: 'The 12 countries: where they are, their capitals, their flags, and how to say and spell their names.',
      tags: ['geography', 'maps'],
      path: 'modules/geography/south-america/index.html',
      storage: ['explorers-atlas.south-america'],
      tools: [
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, and flags. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', blurb: 'Hear a name, then tap the country. Mastered at 10 of 12 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 12, blurb: '60 seconds to find as many countries as you can. Mastered at 12 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', blurb: 'Drag each name onto its country. Mastered with 2 misses or fewer.' },
        { id: 'spell', name: 'Spell it', difficulty: 'hard', blurb: 'Type the name of the country shown. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'us-states',
      subject: 'geography',
      title: 'US States',
      blurb: 'All 50 states: capitals, flags, mottos, state birds and flowers, notable cities, and when each joined the United States.',
      tags: [],
      path: 'modules/geography/us-states/index.html',
      storage: ['us-states'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every state with its capital, flag, motto, bird, flower, cities, and year admitted. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every state with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, mottos, birds and flowers, cities, and years. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the state. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many states as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 45, blurb: 'Drag each of the 50 names onto its state. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, mottos, birds, flowers, cities, or when states joined. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, state names, birds, flowers, or years. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' },
        { id: 'order', name: 'Put in order', difficulty: 'insane', blurb: 'Put states in the order they joined the United States. Mastered at 80% in place on the first check.' }
      ]
    },
    {
      id: 'europe',
      subject: 'geography',
      title: 'Europe',
      blurb: 'The countries of Europe: capitals, flags, main languages, and where each one is on the map.',
      tags: [],
      path: 'modules/geography/europe/index.html',
      storage: ['europe'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 41, blurb: 'Drag each country name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'africa',
      subject: 'geography',
      title: 'Africa',
      blurb: 'The countries of Africa: capitals, flags, main languages, and where each one is on the map.',
      tags: [],
      path: 'modules/geography/africa/index.html',
      storage: ['africa'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 49, blurb: 'Drag each country name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'asia',
      subject: 'geography',
      title: 'Asia',
      blurb: 'The countries of Asia: capitals, flags, main languages, and where each one is on the map.',
      tags: [],
      path: 'modules/geography/asia/index.html',
      storage: ['asia'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 44, blurb: 'Drag each country name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'north-america',
      subject: 'geography',
      title: 'North America',
      blurb: 'The countries of North America, Central America, and the Caribbean: capitals, flags, main languages, and where each one is on the map.',
      tags: [],
      path: 'modules/geography/north-america/index.html',
      storage: ['north-america'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 18, blurb: 'Drag each country name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'oceania',
      subject: 'geography',
      title: 'Oceania',
      blurb: 'The countries of Oceania, from Australia and New Zealand to the Pacific islands: capitals, flags, main languages, and where each one is on the map.',
      tags: [],
      path: 'modules/geography/oceania/index.html',
      storage: ['oceania'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 9, blurb: 'Drag each country name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'world',
      subject: 'geography',
      title: 'World',
      blurb: 'Every country on Earth: capitals, flags, main languages, and where each one is on the map. Study the whole world or one continent at a time.',
      tags: [],
      path: 'modules/geography/world/index.html',
      storage: ['world'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every country with its flag, capital, and main language. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every country with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, capitals, flags, languages, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the country. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 20, blurb: '60 seconds to find as many countries as you can. Mastered at 20 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 192, blurb: 'Drag each country name onto the map, for the whole world or one continent. Mastered with all 197 placed and 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice on capitals, flags, or languages. Mastered at 80% on the Full quiz (whole world).' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type capitals, country names, or languages. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'oceans',
      subject: 'geography',
      title: 'Oceans',
      blurb: 'The five oceans and the world\'s best-known seas, gulfs, and bays: where each one is on the map, clues, facts, and sizes.',
      tags: [],
      path: 'modules/geography/oceans/index.html',
      storage: ['oceans'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every ocean and sea with where it is, its size, and a fact. Search by name.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'Every ocean and sea with its name on the map. Tap one to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Map shapes, clues, facts, and every quiz question. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a name, then tap the ocean or sea. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 15, blurb: '60 seconds to find as many oceans and seas as you can. Mastered at 15 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', masterAt: 22, blurb: 'Drag each ocean and sea name onto the map. Mastered with 5 misses or fewer.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Multiple choice from the map, from clues, or on size. Mastered at 80% on the Full quiz.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type the name from a clue or from the map. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'parts-of-speech',
      subject: 'english',
      title: 'Parts of Speech',
      blurb: 'The eight jobs a word can do in a sentence, from nouns and verbs to words that switch jobs.',
      tags: ['english', 'grammar'],
      path: 'modules/english/parts-of-speech/index.html',
      storage: ['parts-of-speech'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'All eight parts of speech, with examples you can hear.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'What each part does, and words in sentences. Practice only.' },
        { id: 'sort', name: 'Sort it', difficulty: 'easy', blurb: 'Sort words into nouns, verbs, and adjectives. Mastered with 2 misses or fewer.' },
        { id: 'spot', name: 'Spot it', difficulty: 'medium', blurb: 'Tap the noun, verb, adjective, adverb, or pronoun in a sentence. Mastered at 8 of 10.' },
        { id: 'speed', name: 'Speed round', difficulty: 'hard', masterAt: 12, blurb: '60 seconds to name the part of speech of as many words as you can. Mastered at 12.' },
        { id: 'label', name: 'Label the sentence', difficulty: 'insane', blurb: 'Label every word, including words that switch jobs. Mastered at 4 of 5 sentences.' }
      ]
    },
    {
      id: 'ancient-rome',
      subject: 'history',
      title: 'Ancient Rome',
      blurb: 'Test 1 review: the founding of Rome, Roman religion, kinds of government, the Republic, and social classes.',
      tags: ['history', 'government'],
      path: 'modules/history/ancient-rome/index.html',
      storage: ['ancient-rome'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Everything from the class study guide, section by section.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Terms from the study guide, plus the gods and goddesses. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Sort facts into governments, parts of the Republic, or social classes. Mastered at 80%.' },
        { id: 'blanks', name: 'Fill it in', difficulty: 'hard', blurb: 'Type the missing word or date. Mastered at 8 of 10.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences, like the test. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'punic-wars',
      subject: 'history',
      title: 'The Punic Wars',
      blurb: 'Rome against Carthage: the three wars, Hannibal and the Alps, and how Rome became the greatest power on the Mediterranean. With a map, a timeline, and pictures.',
      tags: ['history', 'rome'],
      path: 'modules/history/punic-wars/index.html',
      storage: ['punic-wars'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Your class notes, section by section, with drawings, who is who, pictures, and a clearly marked “More to know” page.' },
        { id: 'timeline', name: 'Timeline', kind: 'study', difficulty: 'easy', blurb: 'The three wars on a line of years B.C. Dates and events that are not in the notes are marked “added”.' },
        { id: 'study', name: 'Study map', kind: 'study', difficulty: 'easy', blurb: 'The western Mediterranean with Rome, Carthage, Sicily, Spain, and the Alps. Show Hannibal’s march. Tap a place to hear it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Terms from the class notes. Practice only.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', masterAt: 8, blurb: 'Hear a place, then tap it on the map. Mastered at 8 of 10 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 10, blurb: '60 seconds to find as many places as you can. Mastered at 10 found.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions from the class notes. Mastered at 80% on the Full quiz.' },
        { id: 'type', name: 'Type the answer', difficulty: 'hard', blurb: 'Type the missing word from a sentence in the notes. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' },
        { id: 'order', name: 'Put in order', difficulty: 'hard', blurb: 'Put the events of the wars in order. Mastered at 80% in place on the first check.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences, like the test. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'weather',
      subject: 'science',
      title: 'Weather',
      blurb: 'Unit 3: the atmosphere, clouds, the water cycle, hemispheres and seasons, and the tools meteorologists use.',
      tags: ['science', 'earth'],
      path: 'modules/science/weather/index.html',
      storage: ['weather'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Your Unit 3 notes with drawings, the six kinds of weather, and facts from the practice test.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Vocabulary, or name the kind of weather from its picture. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions, some with weather pictures. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Clouds, the water cycle, weather tools, or hemispheres. Mastered at 80%.' },
        { id: 'label', name: 'Label the diagram', difficulty: 'medium', blurb: 'Pick the letter for each part of the earth and of the water cycle. Mastered at 80%.' },
        { id: 'graph', name: 'Read the graph', difficulty: 'medium', blurb: 'Read a line graph of temperatures. Mastered at 5 of 6.', masterAt: 5 },
        { id: 'type', name: 'Type the answer', difficulty: 'hard', blurb: 'Type the missing word from a sentence in the notes. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences, like the test. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'newton-laws',
      subject: 'science',
      title: 'Newton and His Laws',
      blurb: 'Lesson 5: Isaac Newton, his three laws of motion, inertia, and scale, proportion, and quantity.',
      tags: ['science', 'physics', 'forces'],
      path: 'modules/science/newton-laws/index.html',
      storage: ['newton-laws'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'The lesson in your book\'s words, Table 5.1, and facts from the review and Quiz 2.' },
        { id: 'lab', name: 'Experiments', kind: 'study', difficulty: 'easy', blurb: 'Kick a ball, push things, launch a rocket, and see the three laws happen. Practice only.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Vocabulary, the three laws, Table 5.1, and every quiz question. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions from the review and Quiz 2. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Which law it is, scale, proportion, and quantity, or patterns of motion. Mastered at 80%.' },
        { id: 'type', name: 'Type the answer', difficulty: 'hard', blurb: 'Type the missing word from a sentence in the lesson. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'handwriting',
      subject: 'english',
      title: 'Handwriting',
      blurb: 'Trace letters, words, and sentences in cursive or print. Works with a stylus, a finger, or a mouse.',
      tags: ['english', 'handwriting'],
      path: 'modules/english/handwriting/index.html',
      storage: ['handwriting'],
      tools: [
        { id: 'practice', name: 'Practice paper', kind: 'study', difficulty: 'easy', blurb: 'Lined paper. Type a name or spelling words to trace them.' },
        { id: 'letters', name: 'Letters', difficulty: 'easy', blurb: 'Capitals and lowercase, one at a time. Mastered when 42 of the 52 letters pass.' },
        { id: 'words', name: 'Words', difficulty: 'medium', blurb: 'Trace six words per round. Mastered at 5 of 6 on the first try.' },
        { id: 'sentences', name: 'Sentences', difficulty: 'hard', blurb: 'Trace four short sentences per round. Mastered at 4 of 4 on the first try.' }
      ]
    },
    {
      id: 'place-value',
      subject: 'math',
      title: 'Place Value and Zeros',
      blurb: 'Place value from millions to thousandths, decimal places, and multiplying and dividing numbers that end in zeros.',
      tags: ['math', 'decimals', 'multiplication', 'division'],
      path: 'modules/math/place-value/index.html',
      storage: ['place-value'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'A place value chart you can type into, and the zero tricks with examples.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for place value and decimals, one card each.' },
        { id: 'place', name: 'Place value', difficulty: 'easy', blurb: 'Values, places, and digits in big numbers and decimals. Mastered at 8 of 10.' },
        { id: 'decimals', name: 'Decimal places', difficulty: 'medium', blurb: 'Compare, round, and read decimals. Mastered at 8 of 10.' },
        { id: 'multiply', name: 'Multiply with zeros', difficulty: 'medium', blurb: 'Like 9,000 × 6,000. Mastered at 8 of 10.' },
        { id: 'divide', name: 'Divide with zeros', difficulty: 'hard', blurb: 'Like 1,200,000 ÷ 3,000. Mastered at 8 of 10.' },
        { id: 'powers', name: 'Decimals and powers of ten', difficulty: 'insane', blurb: 'Like 3.45 × 100 and 72 ÷ 1,000. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'fractions-add-sub',
      subject: 'math',
      title: 'Add and Subtract Fractions',
      blurb: 'Fractions as division, adding and subtracting with unlike denominators, and mixed numbers (Dimensions Math 5, chapter 4).',
      tags: ['math', 'fractions', 'mixed numbers'],
      path: 'modules/math/fractions-add-sub/index.html',
      storage: ['fractions-add-sub'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Worked examples, and a helper that shows every step for any two fractions.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for adding and subtracting fractions, one card each.' },
        { id: 'division', name: 'Fractions and division', difficulty: 'easy', blurb: 'Like 3 \u00f7 4 as a fraction, and sharing things equally. Mastered at 8 of 10.' },
        { id: 'models', name: 'Use the models', difficulty: 'easy', blurb: 'Add and subtract fractions with pictures. Mastered at 8 of 10.' },
        { id: 'improper', name: 'Improper fractions and mixed numbers', difficulty: 'easy', blurb: 'Change between the two, in simplest form. Mastered at 8 of 10.' },
        { id: 'unlike', name: 'Unlike denominators', difficulty: 'medium', blurb: 'Add two or three fractions, or subtract two. Mastered at 8 of 10.' },
        { id: 'mixedadd', name: 'Add mixed numbers', difficulty: 'medium', blurb: 'Like 2 1/3 + 1 3/4. Mastered at 8 of 10.' },
        { id: 'mixedsub', name: 'Subtract mixed numbers', difficulty: 'hard', blurb: 'With and without renaming. Mastered at 8 of 10.' },
        { id: 'words', name: 'Word problems', difficulty: 'hard', blurb: 'Fractions and mixed numbers in real situations. Mastered at 8 of 10.' },
        { id: 'review', name: 'Mixed review', difficulty: 'insane', blurb: 'Missing numbers, three fractions at once, whole numbers minus mixed numbers, and bigger mixed numbers. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'fractions-multiply',
      subject: 'math',
      title: 'Multiplication of Fractions',
      blurb: 'Fractions times whole numbers, fractions times fractions, mixed numbers, and reciprocals (Dimensions Math 5, chapter 5).',
      tags: ['math', 'fractions', 'multiplication'],
      path: 'modules/math/fractions-multiply/index.html',
      storage: ['fractions-multiply'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Worked examples, and a helper that shows every step for any two numbers.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for multiplying fractions, one card each.' },
        { id: 'whole', name: 'Fractions times whole numbers', difficulty: 'easy', blurb: 'Like 3/4 \u00d7 5. Mastered at 8 of 10.' },
        { id: 'fractionof', name: 'Fraction of a number', difficulty: 'easy', blurb: 'Like 2/3 of 12, and simple word problems. Mastered at 8 of 10.' },
        { id: 'models', name: 'Use the area model', difficulty: 'easy', blurb: 'Read a product from overlapping shading. Mastered at 8 of 10.' },
        { id: 'fraction', name: 'Multiply fractions', difficulty: 'medium', blurb: 'Unit fractions, two fractions, or three factors. Mastered at 8 of 10.' },
        { id: 'scale', name: 'Bigger, smaller or the same?', difficulty: 'medium', blurb: 'Sort products without working them out.' },
        { id: 'recip', name: 'Reciprocals', difficulty: 'medium', blurb: 'Swap the top and bottom. Mastered at 8 of 10.' },
        { id: 'mixed', name: 'Multiply mixed numbers', difficulty: 'hard', blurb: 'By a whole number, a fraction, or a mixed number. Mastered at 8 of 10.' },
        { id: 'words', name: 'Word problems', difficulty: 'hard', blurb: 'Recipes, gardens, and parts of parts. Mastered at 8 of 10.' },
        { id: 'review', name: 'Mixed review', difficulty: 'insane', blurb: 'Three or more factors, missing factors, and parentheses. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'fractions-divide',
      subject: 'math',
      title: 'Division of Fractions',
      blurb: 'Unit fractions and fractions divided by whole numbers, whole numbers divided by fractions, and word problems (Dimensions Math 5, chapter 6).',
      tags: ['math', 'fractions', 'division'],
      path: 'modules/math/fractions-divide/index.html',
      storage: ['fractions-divide'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Worked examples, and a helper that shows every step for any two numbers.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for dividing fractions, one card each.' },
        { id: 'share', name: 'Share a unit fraction', difficulty: 'easy', blurb: 'Read the answer from a bar model. Mastered at 8 of 10.' },
        { id: 'fracwhole', name: 'Fractions divided by whole numbers', difficulty: 'easy', blurb: 'Like 3/4 \u00f7 2. Mastered at 8 of 10.' },
        { id: 'fit', name: 'How many fit?', difficulty: 'medium', blurb: 'Whole numbers divided by unit fractions, with pictures. Mastered at 8 of 10.' },
        { id: 'wholefrac', name: 'Whole numbers divided by fractions', difficulty: 'medium', blurb: 'Like 4 \u00f7 1/3 and 3 \u00f7 3/4. Mastered at 8 of 10.' },
        { id: 'words', name: 'Word problems', difficulty: 'hard', blurb: 'Sharing equally, and how many fit. Mastered at 8 of 10.' },
        { id: 'review', name: 'Mixed review', difficulty: 'insane', blurb: 'Mixed numbers, fractions divided by fractions, and missing numbers. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'measurement',
      subject: 'math',
      title: 'Measurement and Area',
      blurb: 'Converting units with fractions, and the area of rectangles, triangles, trapezoids and composite figures (Dimensions Math 5, chapter 7).',
      tags: ['math', 'measurement', 'area'],
      path: 'modules/math/measurement/index.html',
      storage: ['measurement'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Worked examples, and a helper that finds the area of a rectangle, triangle or trapezoid step by step.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for units and area, one card each.' },
        { id: 'units', name: 'Convert customary units', difficulty: 'easy', blurb: 'Feet, yards, pounds and gallons, with fractions. Mastered at 8 of 10.' },
        { id: 'time', name: 'Convert units of time', difficulty: 'easy', blurb: 'Hours, minutes, days, weeks and years. Mastered at 8 of 10.' },
        { id: 'rect', name: 'Area of a rectangle', difficulty: 'medium', blurb: 'Fraction and mixed-number sides. Mastered at 8 of 10.' },
        { id: 'triangle', name: 'Area of a triangle', difficulty: 'medium', blurb: 'Acute, right and obtuse. Mastered at 8 of 10.' },
        { id: 'trapezoid', name: 'Area of a trapezoid', difficulty: 'hard', blurb: 'Two bases and a height. Mastered at 8 of 10.' },
        { id: 'composite', name: 'Composite figures', difficulty: 'hard', blurb: 'L-shapes, cut-outs, and a triangle on a rectangle. Mastered at 8 of 10.' },
        { id: 'review', name: 'Mixed review', difficulty: 'insane', blurb: 'Fractions in every shape, and two-step conversions. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'volume',
      subject: 'math',
      title: 'Volume of Solid Figures',
      blurb: 'Counting unit cubes, the volume formula, compound figures, and volume and capacity (Dimensions Math 5, chapter 8).',
      tags: ['math', 'volume', 'geometry'],
      path: 'modules/math/volume/index.html',
      storage: ['volume'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Worked examples, and a helper that finds the volume of any box and what it holds.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'The rules and facts for volume, one card each.' },
        { id: 'cubes', name: 'Count the cubes', difficulty: 'easy', blurb: 'Layers of unit cubes in a box. Mastered at 8 of 10.' },
        { id: 'stacks', name: 'Stacks of cubes', difficulty: 'easy', blurb: 'Irregular figures built from cubes, seen from above. Mastered at 8 of 10.' },
        { id: 'formula', name: 'Use the formula', difficulty: 'medium', blurb: 'Boxes, cubes, and finding a missing edge. Mastered at 8 of 10.' },
        { id: 'capacity', name: 'Volume and capacity', difficulty: 'medium', blurb: 'Milliliters, liters and cubic centimeters. Mastered at 8 of 10.' },
        { id: 'words', name: 'Word problems', difficulty: 'hard', blurb: 'Boxes, tanks and sand. Mastered at 8 of 10.' },
        { id: 'compare', name: 'Compare volumes', difficulty: 'hard', blurb: 'How much more does the bigger box hold? Mastered at 8 of 10.' },
        { id: 'compound', name: 'Compound figures', difficulty: 'hard', blurb: 'Join two boxes, or cut a piece out. Mastered at 8 of 10.' },
        { id: 'review', name: 'Mixed review', difficulty: 'insane', blurb: 'All the volume skills together. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'hard', full: true, blurb: 'Random 10, or One of each: one problem of every kind in this module. Mastered at 80% on One of each.' }
      ]
    },
    {
      id: 'planets',
      subject: 'science',
      title: 'The Planets',
      blurb: 'The eight planets: their order, sizes, kinds, and the facts that make each one different.',
      tags: ['science', 'space'],
      path: 'modules/science/planets/index.html',
      storage: ['planets'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Tap each planet in the solar system to learn about it.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Name the planet from clues, or recall facts. Practice only.' },
        { id: 'order', name: 'Put in order', difficulty: 'easy', blurb: 'Order the planets from the Sun, or by size. Mastered at 7 of 8 in place.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Rocky, gas giant, or ice giant, and how many moons. Mastered at 80%.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions. Mastered at 80% on the Full quiz.' },
        { id: 'compare', name: 'Which is more?', difficulty: 'hard', blurb: 'Bigger, farther, hotter, longer year, or longer spin. Mastered at 8 of 10.' },
        { id: 'riddle', name: 'Which planet am I?', difficulty: 'insane', blurb: 'Guess the planet from a tricky first clue. Mastered at 7 of 8 on the first clue.', masterAt: 7 }
      ]
    },
    {
      id: 'periodic-table',
      subject: 'science',
      title: 'The Periodic Table',
      blurb: 'All 118 elements: symbols, atomic numbers, families, metals and nonmetals, and where each one sits on the table.',
      tags: ['science', 'chemistry'],
      path: 'modules/science/periodic-table/index.html',
      storage: ['periodic-table'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'A periodic table you can tap. Light up each family of elements.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Symbols and names, from the first 20 to the common ones. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: 'Symbols, atomic numbers, families, and how the table works. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Metal, nonmetal, or metalloid, and solid, liquid, or gas. Mastered at 80%.' },
        { id: 'find', name: 'Find it', difficulty: 'hard', masterAt: 15, blurb: '60 seconds to find elements on the table. Mastered at 15 found.' },
        { id: 'symbols', name: 'Type the symbol', difficulty: 'insane', blurb: 'Type the symbol from the name, including the tricky ones. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'black-beauty',
      archived: true,
      archivedNote: 'The first Black Beauty review, replaced by the version built from the class study guide.',
      subject: 'english',
      title: 'Black Beauty (old version)',
      blurb: 'Review the novel by Anna Sewell: the horses and people, Beauty\'s homes, the order of events, and the big ideas.',
      tags: ['english', 'literature', 'reading'],
      path: 'modules/english/black-beauty/index.html',
      storage: ['black-beauty'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'The book, the characters, Beauty\'s homes, big ideas, and words to know.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Characters, homes, and words to know. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions about the story. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Sort characters by where they belong, horse or person, and good or bad for horses. Mastered at 80%.' },
        { id: 'order', name: 'Put in order', difficulty: 'hard', blurb: 'Put the events of the story in order. Mastered at 80% in place on the first check.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'black-beauty-guide',
      subject: 'english',
      title: 'Black Beauty',
      blurb: 'The class study guide for Black Beauty, chapter by chapter: comprehension questions, quiz, typing the answers, the order of events, and explaining the big ideas.',
      tags: ['english', 'literature', 'reading'],
      path: 'modules/english/black-beauty-guide/index.html',
      storage: ['black-beauty-guide'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'Every comprehension question and answer from the class guide, by part of the book.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Question on the front, the guide\'s answer on the back. Practice only.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions from the guide. Mastered at 80% on the Full quiz.' },
        { id: 'order', name: 'Put in order', difficulty: 'hard', blurb: 'Put the events of the story in order. Mastered at 80% in place on the first check.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', blurb: 'Type the answer to a guide question. Two tries, and a Skip button. Mastered at 8 of 10.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences, checked against the guide\'s answers. Mastered at 4 of 5.' }
      ]
    },
    {
      id: 'phonograms',
      subject: 'english',
      title: 'Phonograms',
      blurb: 'The 72 phonograms (English spelling patterns) plus 4 extras: their sounds, rules, and example words.',
      tags: ['english', 'spelling', 'reading'],
      path: 'modules/english/phonograms/index.html',
      storage: ['phonograms'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'All 76 phonograms with their sounds, notes, and example words. Press the speaker to hear the words.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'Letters to sounds, sounds to letters, and the rules. Practice only.' },
        { id: 'hear', name: 'Hear it, tap it', difficulty: 'easy', masterAt: 8, blurb: 'Press the speaker, listen to the sounds, then tap the phonogram you heard. No reading or typing. Mastered at 8 of 10.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', full: true, blurb: '10 multiple-choice questions on sounds, spellings, and rules. Mastered at 80% on the Full quiz.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Sort phonograms by end-of-word use, sound, or spelling. Mastered at 80%.' },
        { id: 'answer', name: 'Type the phonogram', difficulty: 'hard', blurb: 'Type the missing phonogram from its sounds. Two tries, a hint, and a Skip button. Mastered at 8 of 10.' },
        { id: 'spell', name: 'Spell it', difficulty: 'insane', blurb: 'Hear an example word and type it. Mastered at 8 of 10.' }
      ]
    },
    {
      id: 'greek-latin-roots',
      subject: 'roots',
      title: 'Greek and Latin Roots',
      blurb: 'Memorize what 18 roots mean, like equus, ornis, and circum, and the English words built from them.',
      tags: [],
      path: 'modules/roots/greek-latin-roots/index.html',
      storage: ['greek-latin-roots'],
      tools: [
        { id: 'guide', name: 'Study guide', kind: 'study', difficulty: 'easy', blurb: 'All 18 roots by level, with their words and notes you can hear.' },
        { id: 'cards', name: 'Flashcards', kind: 'study', difficulty: 'easy', blurb: 'All 18 roots with their meanings, words, and notes. Practice only.' },
        { id: 'sort', name: 'Sort it', difficulty: 'easy', blurb: 'Sort roots by meaning, or by Greek and Latin. Mastered at 80%.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', masterAt: 18, blurb: 'Pick the meaning of a root, from Easy to Insane. Missed roots come back first, and you can skip a question to review it later. Mastered when all 18 roots are mastered.' },
        { id: 'answer', name: 'Type the answer', difficulty: 'hard', masterAt: 18, blurb: 'Type the meaning of a root. Two tries, a hint, and a Skip button. Mastered when all 18 roots are mastered.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Use a root word in a complete sentence. Mastered at 4 of 5.' }
      ]
    }
  ],
  /* Utilities: handy tools that are not lessons, so they have no progress or difficulty. */
  utilities: [
    { id: 'calculator', title: 'Calculator', blurb: 'Follows the order of operations, with parentheses and a history. Shows remainders for division.', path: 'utilities/calculator/index.html' },
    { id: 'scratchpad', title: 'Scratch pad', blurb: 'Draw, type, or work things out for any homework. Save notes to your profile or as a picture.', path: 'utilities/scratchpad/index.html' }
  ]
};
