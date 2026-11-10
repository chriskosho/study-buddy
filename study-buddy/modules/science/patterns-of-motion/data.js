/* Unit 4, Lesson 4: Patterns of Motion. Made from pages 27 to 33 (with Section Two's page) and Quiz 2 of the student's 5th Grade Science,
   Unit 4, Force and Motion (Responsive Education Solutions). The study guide keeps the book's wording (only shortened) and both tables
   (4.1 and 4.2). The Quiz, Sort it and Explain it questions come from the book's review questions (4.1 to 4.8) and Quiz 2; questions with
   several right answers are rewritten as one multiple-choice question. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'patterns-of-motion',
  title: 'Unit 4, Lesson 4: Patterns of Motion',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 4, pages 27 to 33). The pictures are in your book.',
  sections: [
    { id: 'pattern', title: 'Patterns', text: [
        'A pattern is a repeated arrangement of things. It can be objects, shapes, numbers, or colors. The stripes on a zebra are a pattern. The leaves on a tree are also a pattern. The numbers on a clock are a pattern. And the letters in a word are a pattern.',
        'Patterns can be used to create art, solve problems, or make predictions. The stripes on a tiger help it camouflage itself from predators. The leaves on a tree help to gather sunlight and produce food. The numbers on a clock help us keep track of time. The letters in a word help us communicate with each other.'],
      key: ['A pattern is a repeated arrangement of things.', 'Patterns are found in nature, machines, and everyday objects.'] },
    { id: 'motion', title: 'Patterns of motion', text: [
        'Everything that moves has a pattern. In science, motion refers to the way objects move, whether in a straight line, a circle, or some other path. Understanding patterns of motion is important in many fields.',
        'An engineer is a person who uses science and math to design and build things. Engineers use their understanding of patterns of motion to design bridges that can hold up against strong winds and earthquakes. Architects design buildings that are comfortable and use less energy. Roboticists create robots that can complete difficult tasks.'],
      key: ['Motion can be in a straight line, a circle, or back and forth.', 'Engineers, architects, and roboticists use patterns of motion.'] },
    { id: 'where', title: 'Nature, machines, objects', text: [
        'In nature, planets move around the sun in elliptical orbits, which means they move in a slightly oval path. Birds flap their wings in a rhythmic pattern to create lift and fly. Snakes slither in a winding pattern, and fish swim in a fluid motion.',
        'Machines also use patterns of motion. A car engine uses a series of explosions to create a motion that turns the wheels and propels the car forward. A computer hard drive uses a spinning motion to read and write data. In everyday objects, a thrown ball follows an arched path. When we ride a bike, we pedal in a circular motion. When we walk, we use a repetitive motion.'],
      table: { title: 'Table 4.1: Patterns of motion', head: ['Nature', 'Machines', 'Everyday objects'],
        rows: [['planets orbiting around our sun; moon orbiting around Earth; tides moving in and out; birds flying through the air; a flag flapping back and forth in the wind', 'wheels on a car turning; gears in a watch moving; needle on a sewing machine sewing; blades on a fan spinning; piston in an engine moving', 'pendulum swinging back and forth; yo-yo moving up and down; swing moving back and forth; ball rolling down a hill; person walking forward']] },
      key: [] },
    { id: 'cause', title: 'Cause and effect', text: [
        'The patterns of motion we observe in nature, machines, and everyday objects are a result of cause-and-effect relationships in force and motion. For example, the elliptical orbits of planets around the sun are caused by the gravitational pull of the sun.',
        'Animals move by applying force to their surroundings. Birds flap their wings to create lift, which pushes against gravity and allows them to fly. Machines use forces to move and work. In everyday objects, forces are constantly at work. When we throw a ball, the force of gravity causes it to fall back to the ground.'],
      table: { title: 'Table 4.2: Cause and effect in motion', head: ['Cause', 'Effect'],
        rows: [['The sun pulls the planets.', 'The planets move in a curved path around our sun.'], ['Birds flap their wings.', 'Air pushes against the wings, creating lift and allowing birds to fly.'], ['An explosion happens in a car engine.', 'A force is created, which pushes the car forward.'], ['A person throws a ball.', 'The ball moves in an arched path and falls to the ground.']] },
      key: [] },
    { id: 'planets', title: 'Planets in orbit', text: [
        'Planets orbiting our sun are not considered balanced in the traditional sense. This is because the sun’s gravity is constantly pulling on them, causing them to move in a curved path around the sun. But the planets have their own momentum, which is the tendency to keep moving in a straight line. This momentum keeps the planets from falling into our sun.',
        'So, while the planets are not balanced in the traditional sense, the forces acting on them are balanced, and they will continue to orbit the sun for a long time.'],
      key: ['The sun’s gravity pulls the planets into a curved path.', 'Momentum keeps the planets from falling into the sun.', 'The forces acting on the planets are balanced.'] }
  ],
  vocab: [
    ['pattern', 'a repeated arrangement of things'],
    ['motion', 'the process of something moving from one place to another'],
    ['elliptical orbit', 'the slightly oval path that a planet takes around the sun'],
    ['orbital motion', 'movement along a predictable orbit, caused by gravity'],
    ['engineer', 'a person who uses science and math to design and build things'],
    ['momentum', 'the tendency to keep moving in a straight line'],
    ['cause and effect', 'a relationship in which one thing (the cause) makes another thing (the effect) happen']
  ],
  quiz: [
    { q: 'What is a pattern?', a: 'A repeated arrangement of things', wrong: ['A group of objects that are all the same', 'A set of instructions for how to do something', 'A way to solve a problem'], why: 'A pattern is a repeated arrangement of things.' },
    { q: 'How do planets move around our sun?', a: 'In an elliptical orbit', wrong: ['In a straight line', 'In a zig-zag motion', 'In a square path'], why: 'Planets move around the sun in slightly oval paths.' },
    { q: 'What causes the elliptical orbits of planets around our sun?', a: 'The force of gravity', wrong: ['The force of magnetism', 'The force of electricity', 'The force of friction'], why: 'This pattern of motion is caused by the gravitational pull of the sun on the planets.' },
    { q: 'What causes birds to fly, and how do they move their wings to create lift?', a: 'They flap their wings in a rhythmic pattern, which creates lift by pushing against the air', wrong: ['They flap their wings in a rhythmic pattern, which creates lift by pulling against the air', 'They flap their wings randomly, which creates lift by heating the air', 'They flap their wings randomly, which creates lift by cooling the air'], why: 'A bird’s wings push against the air, lifting it into the sky.' },
    { q: 'Which of these is a pattern of motion in nature?', a: 'Tides moving in and out', wrong: ['Blades on a fan spinning', 'A pendulum swinging back and forth', 'A yo-yo moving up and down'], why: 'Table 4.1 lists planets orbiting, the moon orbiting Earth, tides, birds flying, and a flag flapping as patterns in nature.' },
    { q: 'Which of these is a pattern of motion in machines?', a: 'Gears in a watch moving', wrong: ['The leaves on a tree', 'Tides moving in and out', 'A person walking forward'], why: 'Wheels on a car, gears in a watch, a sewing machine needle, fan blades, and an engine piston are patterns in machines.' },
    { q: 'Which of these is a pattern of motion in everyday objects?', a: 'A pendulum swinging back and forth', wrong: ['Planets orbiting around our sun', 'A piston in an engine moving', 'The moon orbiting Earth'], why: 'A pendulum, a yo-yo, a swing, a ball rolling down a hill, and a person walking forward are everyday patterns.' },
    { q: 'Are the forces acting on planets balanced or unbalanced?', a: 'Balanced: the sun’s gravity pulls on them, and their momentum keeps them from falling in', wrong: ['Unbalanced: the sun’s gravity pulls them in until they fall into the sun', 'Unbalanced: friction slows them down', 'There are no forces acting on planets'], why: 'The forces acting on planets are balanced, and they will continue to orbit the sun for a long time.' },
    { q: 'What is momentum?', a: 'The tendency to keep moving in a straight line', wrong: ['The force that pulls objects toward each other', 'A repeated arrangement of things', 'The force that stops motion'], why: 'Momentum keeps the planets from falling into the sun.' },
    { q: 'The sun pulls the planets. What is the effect?', a: 'The planets move in a curved path around our sun', wrong: ['The planets move in a straight line', 'The planets stop moving', 'The planets fall to the ground'], why: 'This is Table 4.2: the sun pulls the planets, so they move in a curved path.' },
    { q: 'A person throws a ball. What is the effect?', a: 'The ball moves in an arched path and falls to the ground', wrong: ['The ball floats in the air forever', 'The ball moves in a straight line forever', 'The ball moves in a circle'], why: 'The force of gravity causes it to fall back to the ground.' },
    { q: 'An explosion happens in a car engine. What is the effect?', a: 'A force is created, which pushes the car forward', wrong: ['The car stops', 'The car turns left', 'The engine cools down'], why: 'The combustion of fuel creates a force that pushes the pistons, which turns the wheels.' },
    { q: 'Birds flap their wings. What is the effect?', a: 'Air pushes against the wings, creating lift', wrong: ['The air gets warmer', 'The wings get shorter', 'The bird falls faster'], why: 'Lift pushes against gravity and allows birds to fly.' },
    { q: 'What do engineers use their understanding of patterns of motion to do?', a: 'Design strong, cost-effective bridges, buildings, and robots', wrong: ['Change the way the sun moves across the sky', 'Stop forces from acting on objects', 'Make planets orbit faster'], why: 'Engineers, architects, and roboticists use patterns of motion to design bridges, buildings, and robots.' },
    { q: 'A pattern is a ___ arrangement of things.', a: 'repeated', wrong: ['unusual', 'rare', 'random'], why: 'A pattern is a repeated arrangement of things.' }
  ],
  sorts: [
    { id: 'where', label: 'Nature, machines, or everyday objects?', buckets: [{ id: 'n', name: 'In nature' }, { id: 'm', name: 'In machines' }, { id: 'e', name: 'In everyday objects' }],
      items: [
        ['Planets orbiting around our sun', 'n'], ['Tides moving in and out', 'n'], ['Birds flying through the air', 'n'],
        ['Gears in a watch moving', 'm'], ['Blades on a fan spinning', 'm'], ['A piston in an engine moving', 'm'],
        ['A pendulum swinging back and forth', 'e'], ['A yo-yo moving up and down', 'e'], ['A ball rolling down a hill', 'e']] },
    { id: 'ce', label: 'Cause or effect?', buckets: [{ id: 'c', name: 'Cause' }, { id: 'e', name: 'Effect' }],
      items: [
        ['The sun pulls the planets', 'c'], ['Birds flap their wings', 'c'], ['An explosion happens in a car engine', 'c'], ['A person throws a ball', 'c'],
        ['The planets move in a curved path around our sun', 'e'], ['Air pushes against the wings, creating lift', 'e'], ['A force is created, which pushes the car forward', 'e'], ['The ball moves in an arched path and falls to the ground', 'e']] }
  ],
  explain: [
    { q: 'What is a pattern of motion? Give an example from nature, from machines, and from everyday objects.',
      model: 'A pattern of motion is a repeated way that something moves. Planets orbiting the sun are in nature, gears in a watch are in machines, and a pendulum swinging back and forth is an everyday object.',
      ideas: [
        { label: 'A pattern of motion is a repeated way of moving', all: [['pattern', 'repeat', 'same way', 'again']] },
        { label: 'An example from nature', all: [['planet', 'orbit', 'tide', 'bird', 'moon', 'flag']] },
        { label: 'An example from machines', all: [['gear', 'wheel', 'fan', 'piston', 'needle', 'engine', 'machine']] },
        { label: 'An example from everyday objects', all: [['pendulum', 'yo-yo', 'swing', 'ball', 'walking', 'walk', 'everyday']] }] },
    { q: 'Explain a cause-and-effect relationship in force and motion.',
      model: 'The sun pulls on the planets with the force of gravity. This is the cause. The effect is that the planets move in a curved path around the sun.',
      ideas: [
        { label: 'A cause: a force acts', all: [['pull', 'push', 'flap', 'throw', 'explosion', 'force', 'gravity']] },
        { label: 'The effect: the motion that results', all: [['effect', 'result', 'causes', 'because', 'moves', 'move']] }] },
    { q: 'Why do planets not fall into the sun, even though the sun’s gravity is always pulling on them?',
      model: 'The sun’s gravity pulls the planets into a curved path. But the planets have momentum, which is the tendency to keep moving in a straight line. This keeps them from falling into the sun.',
      ideas: [
        { label: 'The sun’s gravity pulls the planets', all: [['gravity', 'pull']] },
        { label: 'The planets have momentum and keep moving', all: [['momentum', 'keep moving', 'straight line', 'tendency']] },
        { label: 'So they stay in orbit instead of falling in', all: [['orbit', 'curved', 'not fall', 'does not fall', 'do not fall', 'keeps them', 'stay']] }] }
  ]
};
