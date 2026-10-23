/* Study Buddy registry: the list of subjects and modules.
   To add a module: put its folder under modules/<subject>/<module>/ and add one entry below.
   The hub builds itself from this file. Module difficulty is worked out from its tools.

   Module fields
     id        unique id (also used in saved progress, so don't rename it later)
     subject   the home subject id
     tags      extra subjects or skills; a tag that matches another subject puts the module
               in that subject's "Suggested" area
     path      page to open, relative to the site root
     storage   localStorage keys the module saves under SB.moduleKey(...), so a parent reset can clear them
     tools     the activities inside the module

   Tool fields
     id          the module's own name for it (opened with ?tool=<id>)
     difficulty  easy | medium | hard | insane
     kind        'study' for tools with no score (they never count toward mastery)
     masterAt    mastered when the best score reaches this number, or
     masterPct   mastered when best / max reaches this share (default 0.8)
*/
window.SB_REGISTRY = {
  subjects: [
    { id: 'english', name: 'English' },
    { id: 'math', name: 'Math' },
    { id: 'science', name: 'Science' },
    { id: 'geography', name: 'Geography' },
    { id: 'history', name: 'History' }
  ],
  modules: [
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
        { id: 'cards', name: 'Flashcards', difficulty: 'easy', blurb: 'Map shapes, capitals, and flags. Mastered when you know 10 of 12 on the first try.' },
        { id: 'listen', name: 'Listen and tap', difficulty: 'medium', blurb: 'Hear a name, then tap the country. Mastered at 10 of 12 on the first try.' },
        { id: 'find', name: 'Find it', difficulty: 'medium', masterAt: 12, blurb: '60 seconds to find as many countries as you can. Mastered at 12 found.' },
        { id: 'drag', name: 'Drag names', difficulty: 'medium', blurb: 'Drag each name onto its country. Mastered with 2 misses or fewer.' },
        { id: 'spell', name: 'Spell it', difficulty: 'hard', blurb: 'Type the name of the country shown. Mastered at 8 of 10.' }
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
        { id: 'cards', name: 'Flashcards', difficulty: 'easy', blurb: 'What each part does, and words in sentences. Mastered at 80% on the first try.' },
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
        { id: 'cards', name: 'Flashcards', difficulty: 'easy', blurb: 'Terms from the study guide, plus the gods and goddesses. Mastered at 80% on the first try.' },
        { id: 'quiz', name: 'Quiz', difficulty: 'medium', blurb: '10 multiple-choice questions. Mastered at 8 of 10.' },
        { id: 'sort', name: 'Sort it', difficulty: 'medium', blurb: 'Sort facts into governments, parts of the Republic, or social classes. Mastered at 80%.' },
        { id: 'blanks', name: 'Fill it in', difficulty: 'hard', blurb: 'Type the missing word or date. Mastered at 8 of 10.' },
        { id: 'explain', name: 'Explain it', difficulty: 'insane', blurb: 'Answer in complete sentences, like the test. Mastered at 4 of 5.' }
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
    }
  ],
  /* Utilities: handy tools that are not lessons, so they have no progress or difficulty. */
  utilities: [
    { id: 'calculator', title: 'Calculator', blurb: 'Follows the order of operations, with parentheses and a history. Shows remainders for division.', path: 'utilities/calculator/index.html' }
  ]
};
