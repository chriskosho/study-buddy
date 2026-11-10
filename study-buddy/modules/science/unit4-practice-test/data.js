/* Unit 4 Practice Test. Made from pages 74 to 77 of the student's 5th Grade Science, Unit 4, Force and Motion (Responsive Education
   Solutions): the book's 25 Practice Test questions, with the pictures described in words, plus a unit vocabulary guide. Questions
   with several right answers are rewritten as one multiple-choice question, and fill-in-the-blank questions give the word box as
   choices. The Sort it and Explain it practice beyond the book's questions is original and uses the book's wording. The book's
   Question 21 uses the book's answer (the apple falls faster in air), with a note on air resistance. A separate reviewer compares
   this file with the book pages. */
const LESSON = {
  id: 'unit4-practice-test',
  title: 'Unit 4 Practice Test',
  source: 'This guide follows your book (Unit 4 Practice Test, pages 74 to 77). To study for the Unit Test: review the Objectives and the Vocabulary, reread the questions from each Lesson, and review the Quizzes.',
  sections: [
    { id: 'plan', title: 'How to study', text: [
        'Your book says to study for the Unit Test this way: Review the Objectives and the Vocabulary. Reread the questions from each Lesson. Review the Quizzes. Then take the Practice Test.',
        'This page gives you the vocabulary from the whole unit. Use the tabs to see each word. Then try the Quiz, which has the questions from the Unit 4 Practice Test.'],
      key: ['Review the Objectives and the Vocabulary.', 'Reread the questions from each Lesson.', 'Review the Quizzes and the Practice Test.'] },
    { id: 'forces', title: 'Forces', text: [
        'A force is a push or a pull. A newton is a measurement of force. Gravity is the force between objects that have mass. Friction is the force that slows or stops motion when objects touch. Contact force is the force between objects that are touching. Inertia is the tendency of an object to resist moving or changing motion.',
        'Work is the use of force to move an object or change the direction it is moving. Work is done only if an object moves.'],
      key: ['force = a push or a pull', 'newton = a measurement of force', 'inertia = the tendency to resist moving or changing motion', 'work = using force to move an object or change its direction'] },
    { id: 'laws', title: 'Newton’s laws', text: [
        'Newton’s first law has to do with inertia. Newton’s second law says the amount of force needed to move an object is directly proportional to the object’s mass. Newton’s third law says force always acts in pairs.',
        'When forces are balanced, an object stays still or keeps moving the same way. When forces are unbalanced, the object moves. For example, a 15 N force one way and a 25 N force the other way are unbalanced, so the object will move.'],
      key: ['First law: inertia.', 'Second law: more mass needs more force.', 'Third law: forces come in pairs.'] },
    { id: 'machines', title: 'Machines', text: [
        'There are six simple machines: inclined plane, wedge, screw, lever, wheel and axle, and pulley. A compound machine is made up of two or more simple machines. An axe is a lever (the handle) and a wedge (the blade). A wheelbarrow has a wheel and axle, two handles (levers), and a container. A car has door handles (levers), tires and steering wheel (wheels and axles), and an engine (pulleys).',
        'Pliers are a lever. A drill bit is a screw. A monster truck wheel is a wheel and axle. A clothesline is a pulley. A person pushing a box up a ramp uses an inclined plane.'],
      key: ['Six simple machines. A compound machine has two or more.'] },
    { id: 'magnets', title: 'Magnets and motion', text: [
        'Magnets attract iron, steel, cobalt, and nickel. Water, rubber, and plastic are not attracted to magnets. Planets move in a curved path around the sun because of gravity.',
        'Patterns of motion in nature include planets orbiting around our sun, birds flying through the air, and tides moving in and out.'],
      key: ['Magnets attract iron, steel, cobalt, and nickel.', 'Gravity makes planets move in a curved path around the sun.'] }
  ],
  vocab: [
    ['force', 'a push or a pull'],
    ['newton', 'a measurement of force'],
    ['gravity', 'the force between objects that have mass'],
    ['inertia', 'the tendency of an object to resist moving or changing motion'],
    ['friction', 'the force that slows or stops motion when objects touch'],
    ['contact force', 'the force between objects that are touching'],
    ['work', 'the use of force to move an object or change the direction it is moving'],
    ['simple machine', 'a machine with only a few or no moving parts that makes work easier'],
    ['compound machine', 'a machine made up of two or more simple machines'],
    ['efficient', 'describing something that is done in the best possible way in the least amount of time']
  ],
  quiz: [
    { q: '___ is a measurement of force.', a: 'Newton', wrong: ['Work', 'Inertia', 'Gravity'], why: 'A newton (N) is the unit of force.' },
    { q: 'The force between objects that have mass is called ___.', a: 'gravity', wrong: ['friction', 'inertia', 'contact force'], why: 'Gravity pulls objects with mass toward each other.' },
    { q: 'The tendency of an object to resist moving or changing motion is called ___.', a: 'inertia', wrong: ['friction', 'gravity', 'work'], why: 'Inertia is the first law of motion.' },
    { q: 'The force that slows or stops motion when objects touch is called ___.', a: 'friction', wrong: ['gravity', 'inertia', 'newton'], why: 'Friction acts when objects touch.' },
    { q: 'A push or a pull is called ___.', a: 'force', wrong: ['work', 'friction', 'inertia'], why: 'A force is a push or a pull.' },
    { q: '___ is the force between objects that are touching.', a: 'Contact force', wrong: ['Gravity', 'Inertia', 'Newton'], why: 'Contact forces need the objects to touch.' },
    { q: '___ is the use of force to move an object or change the direction it is moving.', a: 'Work', wrong: ['Friction', 'Inertia', 'Gravity'], why: 'Work is done only if an object moves.' },
    { q: 'Which simple machine is an inclined plane, like a person pushing a box up a ramp?', a: 'Inclined plane', wrong: ['Wedge', 'Screw', 'Lever'], why: 'A ramp is an inclined plane.' },
    { q: 'An axe splitting a log is which simple machine?', a: 'Wedge', wrong: ['Screw', 'Lever', 'Pulley'], why: 'Force spreads outward along the sides of the wedge.' },
    { q: 'A drill bit is which simple machine?', a: 'Screw', wrong: ['Wedge', 'Lever', 'Pulley'], why: 'A screw is an inclined plane wrapped around a cylinder.' },
    { q: 'Pliers are which simple machine?', a: 'Lever', wrong: ['Wheel and axle', 'Pulley', 'Screw'], why: 'A lever is a bar that pivots at a fixed point.' },
    { q: 'The wheel of a monster truck is which simple machine?', a: 'Wheel and axle', wrong: ['Pulley', 'Lever', 'Wedge'], why: 'The axle is a rod that the wheel turns around.' },
    { q: 'A clothesline is which simple machine?', a: 'Pulley', wrong: ['Lever', 'Wheel and axle', 'Wedge'], why: 'A pulley is a rope that wraps around a wheel and axle.' },
    { q: 'Which of these is an example of work being done?', a: 'A soccer player hits a ball in the air with his head, and its direction changes', wrong: ['A man pushes on a locked door, and it does not move', 'A child sleeps in her bed', 'A woman stands by her desk'], why: 'Work changes motion or direction.' },
    { q: 'Planets move in a curved path around the sun because of ___.', a: 'gravity', wrong: ['friction', 'mass', 'a magnet'], why: 'The sun’s gravity pulls on the planets.' },
    { q: 'Which of Newton’s laws says force always acts in pairs?', a: 'The third law', wrong: ['The first law', 'The second law', 'The law of gravity'], why: 'Newton’s third law: forces act in pairs.' },
    { q: 'Which of Newton’s laws has to do with inertia?', a: 'The first law', wrong: ['The second law', 'The third law', 'The law of gravity'], why: 'Newton’s first law is about inertia.' },
    { q: 'Which of Newton’s laws says the amount of force needed to move an object is directly proportional to the object’s mass?', a: 'The second law', wrong: ['The first law', 'The third law', 'The law of gravity'], why: 'More mass needs more force.' },
    { q: 'An object has a 15 N arrow pointing left and a 25 N arrow pointing right. Which statement is TRUE?', a: 'The forces are unbalanced, so the object will move', wrong: ['The forces are balanced, so the object will move', 'The forces are unbalanced, so the object will stay still', 'The forces are balanced, so the object will stay still'], why: 'Forces of 15 N and 25 N are not equal, so they are unbalanced.' },
    { q: 'Which of these materials is attracted to magnets?', a: 'Iron, cobalt, nickel, and steel', wrong: ['Water and rubber', 'Plastic and water', 'Rubber and plastic'], why: 'Water, rubber, and plastic are not attracted to magnets.' },
    { q: 'If an apple and a feather were dropped at the same time in the air, what would happen?', a: 'The apple would fall faster than the feather', wrong: ['The feather would fall faster than the apple', 'They would fall at the same speed', 'Neither would fall'], why: 'This is the book’s answer. The air pushes up on the feather more, because air resistance is a kind of friction. Without air they would land together.' },
    { q: 'Which of these is a pattern of motion in nature?', a: 'Planets orbiting around our sun, birds flying through the air, and tides moving in and out', wrong: ['Wheels on a car turning', 'A ball rolling down a hill', 'Gears in a watch moving'], why: 'Wheels, balls, and gears are machines or everyday objects.' },
    { q: 'Which compound machine has a long handle (lever) and a sharp blade (wedge), used for chopping wood?', a: 'An axe', wrong: ['A wheelbarrow', 'A car', 'A bicycle'], why: 'This is the axe from Table 7.1.' },
    { q: 'Which compound machine has a large wheel (wheel and axle), two handles (levers), and a container?', a: 'A wheelbarrow', wrong: ['An axe', 'A car', 'Scissors'], why: 'A wheelbarrow lifts and transports heavy objects.' },
    { q: 'Which compound machine has door handles (levers), tires and a steering wheel (wheels and axles), and an engine (pulleys)?', a: 'A car', wrong: ['A wheelbarrow', 'An axe', 'A bicycle'], why: 'A car transports people and goods over long distances.' }
  ],
  sorts: [
    { id: 'machines', label: 'Which simple machine is it?', buckets: [{ id: 'i', name: 'Inclined plane' }, { id: 'w', name: 'Wedge' }, { id: 's', name: 'Screw' }, { id: 'l', name: 'Lever' }, { id: 'a', name: 'Wheel and axle' }, { id: 'p', name: 'Pulley' }],
      items: [
        ['A person pushing a box up a ramp', 'i'], ['An axe splitting a log', 'w'], ['A drill bit', 's'], ['Pliers', 'l'], ['The wheel of a monster truck', 'a'], ['A clothesline', 'p'], ['A jar lid', 's'], ['A seesaw', 'l'], ['A knife', 'w']] },
    { id: 'law', label: 'Which law is it?', buckets: [{ id: '1', name: 'First law' }, { id: '2', name: 'Second law' }, { id: '3', name: 'Third law' }],
      items: [
        ['It has to do with inertia', '1'], ['Force is directly proportional to mass', '2'], ['Force always acts in pairs', '3'],
        ['An object resists changing its motion', '1'], ['More mass needs more force to move', '2'], ['Every force has an equal and opposite force', '3']] },
    { id: 'magnet', label: 'Is it attracted to a magnet?', buckets: [{ id: 'y', name: 'Attracted' }, { id: 'n', name: 'Not attracted' }],
      items: [['iron', 'y'], ['cobalt', 'y'], ['nickel', 'y'], ['steel', 'y'], ['water', 'n'], ['rubber', 'n'], ['plastic', 'n']] }
  ],
  explain: [
    { q: 'What are the six simple machines? Give an example of a compound machine and the simple machines in it.',
      model: 'The six simple machines are the inclined plane, wedge, screw, lever, wheel and axle, and pulley. An axe is a compound machine. The handle is a lever and the blade is a wedge.',
      ideas: [
        { label: 'Names the six simple machines', all: [['inclined plane', 'ramp'], ['wedge'], ['screw'], ['lever'], ['wheel and axle', 'wheel'], ['pulley']] },
        { label: 'A compound machine example', all: [['axe', 'wheelbarrow', 'car', 'scissors', 'bicycle', 'bike', 'crane']] },
        { label: 'Names simple machines in it', all: [['lever', 'wedge', 'wheel and axle', 'pulley']] }] },
    { q: 'Why do planets move in a curved path around the sun instead of a straight line?',
      model: 'The sun’s gravity is always pulling on the planets. The planets also have momentum, which is the tendency to keep moving in a straight line. These two together keep the planets in a curved path around the sun.',
      ideas: [
        { label: 'The sun’s gravity pulls on the planets', all: [['gravity', 'pull']] },
        { label: 'Momentum / the tendency to keep moving in a straight line', all: [['momentum', 'straight line', 'keep moving', 'tendency']] }] },
    { q: 'What is work? Is work done when someone pushes against a locked door that does not move?',
      model: 'Work is the use of force to move an object or change the direction it is moving. No work is done if the door does not move, because work is done only if an object moves.',
      ideas: [
        { label: 'Work is the use of force to move an object or change its direction', all: [['force'], ['move', 'direction']] },
        { label: 'No work if the door does not move', all: [['not', 'no'], ['move', 'work']] }] }
  ]
};
