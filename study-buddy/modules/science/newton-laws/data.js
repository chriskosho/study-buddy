/* Newton and His Laws: content.
   SOURCE: photos of the student's science book, Lesson 5 "Newton and His Laws" (pages 34 to 41: the lesson, Table 5.1, and the lesson review questions 5.1 to 5.19)
   and "Quiz 2" (pages 42 to 44, questions 2.01 to 2.020).
   The lesson text and the questions keep the teacher's wording. The student's answers were not on the photos, so every answer was worked out from the lesson text.
   MARKED AS NOT IN THE LESSON TEXT (the study guide's last tab says so): the Quiz 2 facts about patterns (2.01, 2.020), elliptical orbits (2.05), birds (2.06), and the penny and brick (2.011), and the reason laws are not theories (5.5, 2.015).
   Their answers come from the question itself and ordinary science, and the answer key was not on the photos.
   The Quiz 2 questions that choose TWO or THREE answers (2.015, 2.020) are asked one answer at a time here.
   Pictures in the book (the apple tree, the soccer player, the rocket, the rivers) are not copied. Nothing else is added. */

/* ---- the study guide, as the lesson says it ---- */
const GUIDE = [
  { id: 'newton', label: 'Isaac Newton', rows: [
    ['Isaac Newton', 'Isaac Newton was a scientist who investigated many ideas, including forces. He lived from 1642 to 1726. He came up with several ideas about forces that are still true today.'],
    ['Gravity', 'Isaac Newton was the first person to discover the force of gravity. His ideas about gravity came to him by observation. He watched an apple fall in his mom’s garden, and the observation helped him come up with the idea of gravity.', 'says'],
    ['Experiments', 'He did experiments to test his ideas about gravity and forces. He repeated these experiments to make sure his ideas were true and that there were not any mistakes. Scientists throughout the years have also repeated these experiments and come to the same conclusion as Newton.'],
    ['Newtons', 'Force is measured in newtons. The unit of force was named after the man who made so many discoveries about it.'],
    ['Law', 'A law in science describes something that is always observed to be true. Laws are simple facts and are often part of a scientific theory. Newton wrote his three laws of motion in 1687.']
  ] },
  { id: 'laws', label: 'The three laws', rows: [
    ['First law', 'An object at rest tends to stay at rest, and an object in motion tends to stay in motion unless an outside force acts on it.'],
    ['A soccer ball', 'Think about a soccer ball sitting on a field. It will not move unless someone kicks it or something else applies force to it. A moving soccer ball will keep moving until something stops it, like a player’s foot or the goalpost. Because of friction, the ball will eventually stop rolling. When it stops rolling, the ball will remain still, or at rest, until another force makes it move.'],
    ['Inertia', 'The tendency of an object to resist moving or changing motion is called inertia. Force must be used to overcome an object’s inertia.'],
    ['Second law', 'The amount of force needed to move an object is directly proportional to the object’s mass. This means that the heavier the object, the more force it takes to move it.'],
    ['Toy car and full-sized car', 'Imagine trying to push a small toy car compared to a full-sized car. The full-sized car is much heavier, so it takes more force to move it.'],
    ['Third law', 'For every action, there is an equal and opposite reaction. What this law means is that when one object pushes on another object, the second object pushes back with the same amount of force. So, forces act in pairs.'],
    ['A rocket', 'When a rocket launches, it pushes hot gas out of its engines. The hot gas pushes back on the rocket with the same amount of force, which pushes the rocket upward.']
  ] },
  { id: 'spq', label: 'Scale, proportion, quantity', rows: [
    ['Scale', 'Scale is how big or small something is. Newton used scale to compare different objects that affect the force of gravity. He understood that the force of gravity from bigger objects is different from the force of gravity from the smaller objects.'],
    ['Proportion', 'Proportion is the relationship between two or more quantities. Newton used proportion to compare the speeds of different objects. He knew that the more mass an object had, the slower it would move. And that the less mass an object had, the faster it would go.'],
    ['Quantity', 'Quantity is the amount of something. Newton used quantity to measure the amount of force or energy in different systems. He observed that the amount of force in a system increases when the system is bigger. But, the amount of force is smaller when the system is smaller.'],
    ['Rivers and streams', 'River systems are larger in scale, proportion, and quantity than stream systems. This is because rivers are larger bodies of water that carry more water than streams. The larger size and volume of a river system results in a stronger current.']
  ] }
];
/* Table 5.1 (page 39) */
const TABLE_HEAD = ['Concept', 'How Newton used it', 'Investigation', 'Findings'];
const TABLE = [
  ['scale', 'to compare the sizes of objects that affect gravity', 'the force of gravity on Earth and the moon', 'The force of gravity from Earth, which is bigger, is different from the force of gravity from the moon, which is smaller.'],
  ['proportion', 'to compare the speed of different objects in relation to mass', 'the speed of a falling apple and a falling feather', 'An apple falls faster than a feather because the apple is much bigger than the feather.'],
  ['quantity', 'to measure the amount of force or energy in different systems', 'measuring the amount of force in a car engine or the amount of energy in a rolling ball', 'The amount of force in a system is bigger when the system is bigger, like the force created by a large engine in a car.']
];
/* "Historians say" note (the lesson's wording above stays as written) */
const SAY = { 'Gravity': { text: 'Historians say Newton told the story of watching an apple fall when he was an old man, and that nobody can be sure it happened just that way. The popular picture of an apple hitting his head is a legend.', page: 'Newton%27s_apple', label: 'Newton’s apple' } };
const WIKI = 'https://en.wikipedia.org/wiki/';

/* NOT in the lesson text: facts from the review and Quiz 2 questions */
const TEST_FACTS = [
  ['Pattern', 'A pattern is a repeated arrangement of things.'],
  ['Elliptical orbits', 'Gravity causes the elliptical orbits of planets around the sun.'],
  ['How birds fly', 'Birds fly by flapping their wings in a rhythmic pattern, which creates lift by pushing against the air.'],
  ['A penny and a brick', 'If a penny and a brick were dropped at the same time in the air, the brick would fall faster than the penny.'],
  ['Patterns in nature', 'The moon orbiting around Earth, tides moving in and out, and a flag flapping back and forth in the wind are patterns of motion in nature.'],
  ['Made by people', 'A yo-yo moving up and down and the gears in a watch moving are not patterns of motion in nature.'],
  ['Why laws and not theories', 'Newton’s laws are called laws and not theories because the laws have always been observed to be true and have been proven by many other scientists.']
];

/* ---- flashcards: terms ---- */
const CARDS = [
  ['Law', 'A law in science describes something that is always observed to be true.'],
  ['Inertia', 'The tendency of an object to resist moving or changing motion.'],
  ['Scale', 'How big or small something is.'],
  ['Proportion', 'The relationship between two or more quantities.'],
  ['Quantity', 'The amount of something.'],
  ['Newton’s first law', 'An object at rest tends to stay at rest, and an object in motion tends to stay in motion unless an outside force acts on it.'],
  ['Newton’s second law', 'The amount of force needed to move an object is directly proportional to the object’s mass.'],
  ['Newton’s third law', 'For every action, there is an equal and opposite reaction.'],
  ['Newtons', 'The unit that force is measured in, named after the man who made so many discoveries about it.'],
  ['Pattern', 'A repeated arrangement of things.']
];

/* ---- quiz: the review and Quiz 2 questions, each asked once ---- */
const LAW3 = ['Newton’s first law of motion', 'Newton’s second law of motion', 'Newton’s third law of motion'];
const STATE = ['an object at rest tends to stay at rest, and an object in motion tends to stay in motion unless an outside force acts on it', 'for every action, there is an equal and opposite reaction', 'the amount of force needed to move an object is directly proportional to the object’s mass'];
const QUIZ = [
  { q: 'Isaac Newton was the first person to discover the force of ______.', a: 'gravity', wrong: ['friction', 'magnetism'] },
  { q: 'What did Newton observe that helped him come up with the idea of gravity?', a: 'He observed an apple fall from a tree.', wrong: ['He observed a bird fly into a tree.', 'He observed a limb fall off of a tree.'] },
  { q: 'How did Newton make sure his ideas about gravity were true?', a: 'He repeated experiments that tested his ideas about gravity and force.', wrong: ['He asked other scientists for their opinions.', 'He made observations in his mother’s garden.'] },
  { q: 'A(n) ______ in science describes something that is always observed to be true.', a: 'law', wrong: ['observation', 'experiment', 'theory'] },
  { q: 'True or false? Newton’s laws of motion are considered laws and not theories because they have always been observed to be true and proven by many other scientists.', a: 'True', wrong: ['False'] },
  { q: 'Which is a reason Newton’s laws are called laws and not theories?', a: 'The laws have always been observed to be true.', wrong: ['Study of his laws is required by the governments of several nations.', 'Study of his laws helps scientists regulate which concepts are tested.'] },
  { q: 'Which is another reason Newton’s laws are called laws and not theories?', a: 'The laws have been proven by many other scientists.', wrong: ['Study of his laws is required by the governments of several nations.', 'Study of his laws helps scientists regulate which concepts are tested.'] },
  { q: 'Scale refers to ______.', a: 'how big or small something is', wrong: ['the relationship between two or more quantities', 'the amount of something'] },
  { q: 'Proportion refers to ______.', a: 'the relationship between two or more quantities', wrong: ['the amount of something', 'how big or small something is'] },
  { q: 'Quantity refers to ______.', a: 'the amount of something', wrong: ['the relationship between two or more quantities', 'how big or small something is'] },
  { q: 'Newton’s first law of motion states: ______.', a: STATE[0], wrong: [STATE[1], STATE[2]] },
  { q: 'Newton’s second law of motion states: ______.', a: STATE[2], wrong: [STATE[0], STATE[1]] },
  { q: 'Newton’s third law of motion states: ______.', a: STATE[1], wrong: [STATE[0], STATE[2]] },
  { q: 'The tendency of an object to resist moving or changing motion is called ______.', a: 'inertia', wrong: ['gravity', 'friction'] },
  { q: 'Which of these statements about Newton’s first law of motion is TRUE?', a: 'Newton’s first law has to do with inertia.', wrong: ['Newton’s first law says the force required to move an object is proportional to its mass.', 'Newton’s first law says that force always acts in pairs.'] },
  { q: 'Which of these statements about Newton’s second law of motion is TRUE?', a: 'Newton’s second law says the force required to move an object is proportional to its mass.', wrong: ['Newton’s second law has to do with inertia.', 'Newton’s second law says that force always acts in pairs.'] },
  { q: 'Which of these statements about Newton’s third law of motion is TRUE?', a: 'Newton’s third law says that force always acts in pairs.', wrong: ['Newton’s third law has to do with inertia.', 'Newton’s third law says the force required to move an object is proportional to its mass.'] },
  { q: 'What did Newton observe about the amount of force in a system?', a: 'The amount of force in a system increases when the system is bigger.', wrong: ['The amount of force in a system increases when the system is smaller.', 'The amount of force in a system is not affected by its size.'] },
  { q: 'What did Newton find when comparing the forces of gravity between the earth and the moon?', a: 'The force of gravity is greater from Earth.', wrong: ['The force of gravity is greater from our moon.', 'The forces of gravity are the same between the Earth and our moon.'] },
  { q: 'Why does an apple fall faster than a feather, according to Newton’s ideas of proportion?', a: 'because the apple is much bigger than the feather', wrong: ['because the apple is much smaller than the feather', 'because the apple and the feather have the same mass'] },
  { q: 'True or false? According to Newton’s second law of motion, an empty box takes less force to accelerate than a box full of books.', a: 'True', wrong: ['False'] },
  { q: 'A pattern is a(n) ______ arrangement of things.', a: 'repeated', wrong: ['unusual', 'rare'] },
  { q: '______ causes the elliptical orbits of planets around the sun.', a: 'Gravity', wrong: ['Magnetism', 'Electricity'] },
  { q: 'Birds fly by flapping their wings in a ______ pattern.', a: 'rhythmic', wrong: ['random'] },
  { q: 'Birds create lift by ______ against the air.', a: 'pushing', wrong: ['pulling'] },
  { q: 'If a penny and a brick were dropped at the same time in the air, what would happen?', a: 'The brick would fall faster than the penny.', wrong: ['The penny would fall faster than the brick.', 'The brick and penny would fall at the same speed.'] },
  { q: 'Which of Newton’s three laws of motion says that forces always act in pairs?', a: LAW3[2], wrong: [LAW3[0], LAW3[1]] },
  { q: 'Which of Newton’s three laws of motion has to do with inertia?', a: LAW3[0], wrong: [LAW3[1], LAW3[2]] },
  { q: 'Which of Newton’s laws of motion states: “An object at rest tends to stay at rest, and an object in motion tends to stay in motion unless an outside force acts upon it”?', a: LAW3[0], wrong: [LAW3[1], LAW3[2]] },
  { q: 'Which of Newton’s laws of motion states: “For every action, there is an equal and opposite reaction”?', a: LAW3[2], wrong: [LAW3[0], LAW3[1]] },
  { q: 'Which of Newton’s laws says that the force required to move an object is proportional to its mass?', a: LAW3[1], wrong: [LAW3[0], LAW3[2]] },
  { q: 'Which is a pattern of motion in nature?', a: 'tides moving in and out', wrong: ['a yo-yo moving up and down', 'gears in a watch moving'] }
];

/* ---- Type the answer: sentences from the lesson, with the missing word ---- */
const TYPE = [
  { q: 'Isaac Newton lived from 1642 to ________.', a: ['1726'], noTypo: true },
  { q: 'Newton wrote his three laws of motion in ________.', a: ['1687'], noTypo: true },
  { q: 'Isaac Newton was the first person to discover the force of ________.', a: ['Gravity'] },
  { q: 'Newton watched an ________ fall in his mom’s garden.', a: ['Apple'] },
  { q: 'Newton repeated his experiments to make sure his ideas were true and that there were not any ________.', a: ['Mistakes', 'Mistake'] },
  { q: 'Force is measured in ________.', a: ['Newtons', 'Newton'] },
  { q: 'A law in science describes something that is always observed to be ________.', a: ['True'], noTypo: true },
  { q: 'An object at rest tends to stay at ________.', a: ['Rest'], noTypo: true },
  { q: 'An object in motion tends to stay in ________ unless an outside force acts on it.', a: ['Motion'] },
  { q: 'The tendency of an object to resist moving or changing motion is called ________.', a: ['Inertia'] },
  { q: 'Because of ________, a rolling soccer ball will eventually stop rolling.', a: ['Friction'] },
  { q: 'The amount of force needed to move an object is directly proportional to the object’s ________.', a: ['Mass'], noTypo: true },
  { q: 'The heavier the object, the more ________ it takes to move it.', a: ['Force'], noTypo: true },
  { q: 'For every action, there is an equal and opposite ________.', a: ['Reaction'] },
  { q: 'Forces act in ________.', a: ['Pairs', 'Pair'], noTypo: true },
  { q: 'When a rocket launches, it pushes hot ________ out of its engines.', a: ['Gas', 'Gases', 'Gasses'], noTypo: true },
  { q: 'Scale is how ________ or small something is.', a: ['Big', 'Large'], noTypo: true },
  { q: 'Proportion is the relationship between two or more ________.', a: ['Quantities'] },
  { q: 'Quantity is the ________ of something.', a: ['Amount'] },
  { q: 'An apple falls faster than a feather because the apple is much ________ than the feather.', a: ['Bigger', 'Larger'] }
];

/* ---- Sort it ---- */
const SORTS = [
  { id: 'laws', label: 'Which law is it?', buckets: ['First law', 'Second law', 'Third law'], items: [
    ['Object at rest stays at rest', 'First law'], ['Has to do with inertia', 'First law'],
    ['Soccer ball sits until kicked', 'First law'], ['Rolling ball keeps rolling', 'First law'],
    ['Heavier means more force', 'Second law'], ['Full-sized car and toy car', 'Second law'], ['Empty box and box of books', 'Second law'],
    ['Equal and opposite reaction', 'Third law'], ['Forces act in pairs', 'Third law'], ['Rocket and hot gas', 'Third law'] ] },
  { id: 'spq', label: 'Scale, proportion, quantity', buckets: ['Scale', 'Proportion', 'Quantity'], items: [
    ['How big or small', 'Scale'], ['Sizes that affect gravity', 'Scale'], ['Earth and the moon', 'Scale'],
    ['Relationship of quantities', 'Proportion'], ['Speed in relation to mass', 'Proportion'], ['Apple and feather speed', 'Proportion'],
    ['The amount of something', 'Quantity'], ['Force in a car engine', 'Quantity'], ['Energy in a rolling ball', 'Quantity'] ] },
  { id: 'nature', label: 'Patterns of motion (Quiz 2)', buckets: ['In nature', 'Made by people'], items: [
    ['A moon orbiting around Earth', 'In nature'], ['Tides moving in and out', 'In nature'], ['A flag flapping back and forth in the wind', 'In nature'],
    ['A yo-yo moving up and down', 'Made by people'], ['Gears in a watch moving', 'Made by people'] ] }
];

/* ---- Explain it ---- */
const EXPLAIN = [
  { q: 'Who was Isaac Newton, and how did he make sure his ideas about gravity were true?', teacher: true,
    model: 'Isaac Newton was a scientist who investigated many ideas, including forces. His ideas about gravity came to him by observation when he watched an apple fall in his mom’s garden. He did experiments to test his ideas and repeated them to make sure his ideas were true and that there were not any mistakes.',
    ideas: [
      { label: 'A scientist who investigated forces', all: [['scientist'], ['force']] },
      { label: 'He watched an apple fall (observation)', all: [['apple'], ['observ', 'watch']] },
      { label: 'He did experiments and repeated them', all: [['experiment'], ['repeat']] }
    ] },
  { q: 'Why are Newton’s laws of motion called laws and not theories?',
    model: 'A law in science describes something that is always observed to be true. Newton’s laws of motion are considered laws because they have always been observed to be true and proven by many other scientists.',
    ideas: [
      { label: 'A law describes something always observed to be true', all: [['always'], ['true']] },
      { label: 'Proven by many other scientists', all: [['scientist'], ['proven', 'prove', 'repeat']] }
    ] },
  { q: 'State Newton’s first law of motion and explain inertia.',
    model: 'Newton’s first law states that an object at rest tends to stay at rest, and an object in motion tends to stay in motion unless an outside force acts on it. Inertia is the tendency of an object to resist moving or changing motion, and force must be used to overcome it.',
    ideas: [
      { label: 'An object at rest stays at rest', all: [['rest']] },
      { label: 'An object in motion stays in motion unless an outside force acts on it', all: [['motion', 'moving'], ['force']] },
      { label: 'Inertia is the tendency to resist moving or changing motion', all: [['inertia'], ['resist']] }
    ] },
  { q: 'Explain Newton’s second law of motion with an example.',
    model: 'Newton’s second law states that the amount of force needed to move an object is directly proportional to the object’s mass. This means the heavier the object, the more force it takes to move it. It takes more force to push a full-sized car than a small toy car.',
    ideas: [
      { label: 'Force needed is proportional to mass', all: [['force'], ['mass']] },
      { label: 'The heavier the object, the more force it takes', all: [['heavier', 'heavy'], ['more force']] },
      { label: 'An example, like a toy car and a full-sized car', all: [['car', 'box', 'books']] }
    ] },
  { q: 'Explain Newton’s third law of motion with an example.',
    model: 'Newton’s third law states that for every action, there is an equal and opposite reaction. When one object pushes on another object, the second object pushes back with the same amount of force, so forces act in pairs. When a rocket pushes hot gas out of its engines, the gas pushes back on the rocket and pushes it upward.',
    ideas: [
      { label: 'For every action, an equal and opposite reaction', all: [['action'], ['reaction'], ['equal', 'same']] },
      { label: 'Forces act in pairs', all: [['pair']] },
      { label: 'An example, like a rocket pushing hot gas', all: [['rocket', 'gas']] }
    ] },
  { q: 'What are scale, proportion, and quantity?',
    model: 'Scale is how big or small something is. Proportion is the relationship between two or more quantities. Quantity is the amount of something. Newton used all three to describe, compare, and model different systems.',
    ideas: [
      { label: 'Scale is how big or small something is', all: [['scale'], ['big', 'large', 'size'], ['small']] },
      { label: 'Proportion is the relationship between quantities', all: [['proportion'], ['relationship']] },
      { label: 'Quantity is the amount of something', all: [['quantity'], ['amount']] }
    ] }
];
