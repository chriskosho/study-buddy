/* Textbooks: where a printed book (or an online skill plan) lines up with Study Buddy.
   This file holds no study content, only the map. Each lesson lists the tool ids (from registry.js) that practice it,
   in the order a student should try them. The Textbooks page in hub.js and textbooks.js reads it, and
   _dev/tests/books_check.mjs fails if a lesson points at a module or tool that does not exist.

   A chapter with a `module` but no `lessons` is built, but its lessons are not mapped yet (the page links to the module).
   A chapter with neither is not in Study Buddy yet, and the page says so.
   `skills` are the skill names IXL lists under a lesson, so a student can match them. */
window.BOOKS = [
  {
    id: 'dimensions-5',
    title: 'Dimensions Math 5',
    blurb: 'Follow the book, chapter by chapter, with the Study Buddy tools that go with each lesson.',
    link: { label: 'IXL skill plan for this book', url: 'https://www.ixl.com/math/skill-plans/dimensions-math-2017-grade-5' },
    chapters: [
      { n: 1 }, { n: 2 }, { n: 3 },
      {
        n: 4, title: 'Addition and Subtraction of Fractions', module: 'fractions-add-sub', guide: 'guide',
        lessons: [
          { n: 1, title: 'Fractions and Division', tools: ['division'],
            skills: ['Relate division and fractions', 'Relate division and mixed numbers', 'Understand fractions as division: word problems'] },
          { n: 2, title: 'Adding Unlike Fractions', tools: ['models', 'unlike'],
            skills: ['Add fractions with unlike denominators using models', 'Add two or three fractions with unlike denominators'] },
          { n: 3, title: 'Subtracting Unlike Fractions', tools: ['models', 'unlike'],
            skills: ['Subtract fractions with unlike denominators using models', 'Subtract fractions with unlike denominators'] },
          { n: 4, title: 'Practice A', tools: ['improper', 'unlike', 'words', 'review'],
            skills: ['Convert between improper fractions and reduced mixed numbers', 'Add and subtract fractions with unlike denominators', 'Add and subtract fractions with unlike denominators: word problems', 'Complete addition and subtraction sentences with fractions (also consider)'] },
          { n: 5, title: 'Adding Mixed Numbers - Part 1', tools: ['mixedadd'],
            skills: ['Add mixed numbers with unlike denominators'] },
          { n: 6, title: 'Adding Mixed Numbers - Part 2', tools: ['unlike', 'review'],
            skills: ['Add 3 fractions or mixed numbers using properties of addition'] },
          { n: 7, title: 'Subtracting Mixed Numbers - Part 1', tools: ['mixedsub'],
            skills: ['Subtract mixed numbers with unlike denominators: without renaming'] },
          { n: 8, title: 'Subtracting Mixed Numbers - Part 2', tools: ['mixedsub'],
            skills: ['Subtract mixed numbers with unlike denominators: with renaming'] },
          { n: 9, title: 'Practice B', tools: ['mixedadd', 'mixedsub', 'words'],
            skills: ['Add and subtract mixed numbers with unlike denominators', 'Add and subtract mixed numbers: word problems'] }
        ]
      },
      { n: 5, title: 'Multiplication of Fractions', module: 'fractions-multiply' },
      { n: 6, title: 'Division of Fractions', module: 'fractions-divide' },
      { n: 7, title: 'Measurement and Area', module: 'measurement' },
      { n: 8, title: 'Volume of Solid Figures', module: 'volume' },
      { n: 9 }, { n: 10 }, { n: 11 }, { n: 12 }, { n: 13 }, { n: 14 }, { n: 15 }
    ]
  }
];
