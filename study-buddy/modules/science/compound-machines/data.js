/* Unit 4, Lesson 7: Compound Machines. Made from pages 55 to 61 of the student's 5th Grade Science, Unit 4, Force and Motion
   (Responsive Education Solutions). The study guide keeps the book's wording (only shortened) and Table 7.1 and Figures 7.1 and 7.2
   (written out in words). The Quiz, Sort it and Explain it questions come from the book's review questions (7.1 to 7.10); questions
   with several right answers are rewritten as one multiple-choice question. The Lab text is in the student's Lab Manual, which is not
   in Study Buddy. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'compound-machines',
  title: 'Unit 4, Lesson 7: Compound Machines',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 7, pages 55 to 61). The pictures are in your book.',
  sections: [
    { id: 'system', title: 'Parts of a system', text: [
        'Scissors cutting paper, a wheelbarrow carrying supplies, and a car driving down the street are all machines made up of simpler machines working together.',
        'Simple machines can be thought of as the parts of a system. A system is a group of things that work together to do something. When two or more simple machines are combined, they form a compound machine. Compound machines can be used to do different things, like lifting heavy objects, moving objects over long distances, or changing the direction of force. They are often used to make work easier or to do things that would be impossible with just a simple machine.'],
      key: ['A system is a group of things that work together.', 'Compound machine = two or more simple machines combined.', 'Compound machines make work easier, or make it possible.'] },
    { id: 'examples', title: 'Compound machines', text: [
        'Figure 7.1 shows three compound machines. An axe is a lever (the handle) and a wedge (the blade). Scissors are wedges (the blades) and levers (the handles). A wheelbarrow is levers (the handles) and a wheel and axle.',
        'Figure 7.2 shows that a bicycle is a compound machine made up of several simple machines working together. The handlebars and pedals are levers, the chain is a pulley, and the front wheel is a wheel and axle. A crane is a compound machine too. It uses a lever and a pulley system, and it has a steering wheel (a wheel and axle) that allows the crane to turn left or right.'],
      table: { title: 'Figure 7.1 and 7.2: Simple machines inside compound machines', head: ['Compound machine', 'Simple machines inside'],
        rows: [['Axe', 'lever (handle) + wedge (blade)'], ['Scissors', 'wedges (blades) + levers (handles)'], ['Wheelbarrow', 'levers (handles) + wheel and axle'], ['Bicycle', 'levers (handlebars and pedals) + pulley (chain) + wheel and axle (front wheel)']] },
      key: [] },
    { id: 'ford', title: 'Cars and Henry Ford', text: [
        'A car is a compound machine. There are levers on the door handles. There are wheels and axles in the tires and the steering wheel. There are pulleys in the engine.',
        'Henry Ford was an engineer who found ways to make cars in an inexpensive and efficient way. Efficient means that something is done in the best possible way in the least amount of time. Since he was able to improve the process, cars became more affordable, and more people could buy them. The Ford Motor Company started in 1903 and still makes cars today.'],
      key: ['Efficient = done in the best possible way in the least amount of time.'] },
    { id: 'structure', title: 'Structure and function', text: [
        'The structure of a compound machine is related to its function. The structure of an object is its physical form. The function of an object is what it does. The structure of an object determines its function, and the function of an object determines its structure.',
        'A bicycle’s structure is a frame, wheels, pedals, handlebars, and brakes. Its function is to transport people from one place to another. The structure provides a place for the rider to sit, wheels to roll on, pedals to turn the wheels, and brakes to stop. Understanding this relationship helps us understand how objects work and allows us to design new objects better suited to their use. A racing bike is designed to be fast and lightweight for smooth roads or paved trails. A mountain bike is designed to be strong and sturdy for dirt, gravel, and other rough surfaces. Engineers use this concept to design objects that are efficient, safe, and effective.'],
      key: ['Structure = its physical form. Function = what it does.', 'Structure determines function, and function determines structure.'] },
    { id: 'table', title: 'Table 7.1: tools', text: [
        'Table 7.1 shows the structure and function of five compound machines. Here are the first three.'],
      table: { title: 'Table 7.1: Structures and functions of compound machines', head: ['Compound machine', 'Structure', 'Function'],
        rows: [
          ['Axe', 'a long handle (lever) and sharp blade (wedge)', 'used to chop wood or other materials using less force'],
          ['Scissors', 'two blades (wedges) that are connected by a pivot (lever)', 'used to cut paper, fabric, or other materials with less effort'],
          ['Wheelbarrow', 'a large wheel (wheel and axle), two handles (levers), and a container', 'used to lift and transport heavy objects with less force']] },
      key: [] },
    { id: 'table2', title: 'Table 7.1: vehicles', text: [
        'Here are the other two compound machines in Table 7.1.'],
      table: { title: 'Table 7.1: Structures and functions of compound machines', head: ['Compound machine', 'Structure', 'Function'],
        rows: [
          ['Car', 'door handles (levers), tires and steering wheel (wheel and axles), and an engine (pulleys)', 'used to transport people and goods over long distances'],
          ['Bicycle', 'two wheels (wheels and axles), a frame, handlebars, and pedals (levers)', 'used to transport people quickly and efficiently']] },
      key: [] }
  ],
  vocab: [
    ['compound machine', 'a machine made up of two or more simple machines'],
    ['system', 'a group of things that work together to do something'],
    ['efficient', 'describing something that is done in the best possible way in the least amount of time'],
    ['structure', 'the physical form of an object'],
    ['function', 'what an object does']
  ],
  lab: { title: 'Build a Catapult', note: 'Complete this lab in the Lab Manual. (The lab steps are in your Lab Manual, not in Study Buddy.)',
    review: ['A compound machine is two or more simple machines combined.', 'A lever has a bar that pivots on a fulcrum.', 'The structure of an object determines its function.', 'Engineers design things to be efficient, safe, and effective.'] },
  quiz: [
    { q: 'A ___ is a combination of simple machines.', a: 'compound machine', wrong: ['screw', 'wedge', 'ramp'], why: 'When two or more simple machines are combined, they form a compound machine.' },
    { q: 'Which of these is a benefit of using compound machines?', a: 'They make work easier', wrong: ['They make work more careful', 'They make work more complex', 'They make work slower'], why: 'Compound machines make work easier or make it possible.' },
    { q: 'Which of these is also a benefit of compound machines?', a: 'They make work possible', wrong: ['They make work more careful', 'They make work more complex', 'They make work louder'], why: 'They can do things that would be impossible with just a simple machine.' },
    { q: 'Which of these is a compound machine?', a: 'A bicycle', wrong: ['A ramp', 'A screw', 'A wedge'], why: 'A bicycle is made up of several simple machines working together.' },
    { q: 'Which of these is NOT a compound machine?', a: 'A screw', wrong: ['A crane', 'A pair of scissors', 'A wheelbarrow'], why: 'A screw is a simple machine.' },
    { q: 'What does it mean to be efficient?', a: 'Doing something in the best possible way in the least amount of time', wrong: ['Doing something as slowly as possible', 'Doing something without any tools', 'Doing something with the most force'], why: 'Henry Ford found efficient ways to make cars.' },
    { q: 'What is a system?', a: 'A group of things that work together to do something', wrong: ['A single simple machine', 'A rule about force', 'A kind of lever'], why: 'Simple machines can be thought of as the parts of a system.' },
    { q: 'Which statement is TRUE about structure and function?', a: 'The structure of an object determines its function, and the function determines its structure', wrong: ['The function determines the structure, but the structure does not determine the function', 'Structure and function are not related', 'The structure never changes the function'], why: 'The structure of an object is its physical form. The function is what it does.' },
    { q: 'What is the structure of an object?', a: 'Its physical form', wrong: ['What it does', 'How much it costs', 'How heavy it is'], why: 'The function of an object is what it does.' },
    { q: 'An axe has a long handle and a sharp blade. What simple machines are they?', a: 'The handle is a lever and the blade is a wedge', wrong: ['The handle is a wedge and the blade is a lever', 'The handle is a screw and the blade is a pulley', 'Both are inclined planes'], why: 'Table 7.1: a long handle (lever) and sharp blade (wedge).' },
    { q: 'Which compound machine has two blades (wedges) connected by a pivot (lever)?', a: 'Scissors', wrong: ['An axe', 'A wheelbarrow', 'A bicycle'], why: 'Scissors cut paper, fabric, or other materials with less effort.' },
    { q: 'Which compound machine has a large wheel (wheel and axle), two handles (levers), and a container?', a: 'A wheelbarrow', wrong: ['A bicycle', 'A car', 'Scissors'], why: 'A wheelbarrow lifts and transports heavy objects with less force.' },
    { q: 'Which compound machine has door handles (levers), tires and a steering wheel (wheels and axles), and an engine (pulleys)?', a: 'A car', wrong: ['A bicycle', 'A wheelbarrow', 'An axe'], why: 'A car transports people and goods over long distances.' },
    { q: 'Which compound machine has two wheels (wheels and axles), handlebars and pedals (levers), and a frame?', a: 'A bicycle', wrong: ['A car', 'A wheelbarrow', 'Scissors'], why: 'A bicycle transports people quickly and efficiently.' },
    { q: 'In a bicycle, the chain is a ___.', a: 'pulley', wrong: ['lever', 'wedge', 'screw'], why: 'The handlebars and pedals are levers, the chain is a pulley, and the front wheel is a wheel and axle.' },
    { q: 'Why is a mountain bike designed to be strong and sturdy?', a: 'It is used on dirt, gravel, and other rough surfaces', wrong: ['It is used only on smooth roads', 'It needs to be as light as possible', 'It does not need wheels'], why: 'A racing bike is fast and lightweight for smooth roads.' },
    { q: 'Who found ways to make cars in an inexpensive and efficient way?', a: 'Henry Ford', wrong: ['Isaac Newton', 'Galileo', 'The Wright brothers'], why: 'Cars became more affordable, and more people could buy them.' }
  ],
  sorts: [
    { id: 'which', label: 'Simple or compound machine?', buckets: [{ id: 's', name: 'Simple machine' }, { id: 'c', name: 'Compound machine' }],
      items: [
        ['A ramp', 's'], ['A screw', 's'], ['A lever', 's'], ['A pulley', 's'], ['A wedge', 's'],
        ['A bicycle', 'c'], ['A crane', 'c'], ['A pair of scissors', 'c'], ['A wheelbarrow', 'c'], ['A car', 'c'], ['An axe', 'c']] },
    { id: 'parts', label: 'Which simple machine is the part?', buckets: [{ id: 'l', name: 'Lever' }, { id: 'w', name: 'Wedge' }, { id: 'a', name: 'Wheel and axle' }, { id: 'p', name: 'Pulley' }],
      items: [
        ['The handle of an axe', 'l'], ['The handles of a wheelbarrow', 'l'], ['The pedals of a bicycle', 'l'], ['A door handle on a car', 'l'],
        ['The blade of an axe', 'w'], ['The blades of scissors', 'w'],
        ['The front wheel of a bicycle', 'a'], ['The tires of a car', 'a'], ['The steering wheel of a car', 'a'],
        ['The chain of a bicycle', 'p'], ['The engine of a car', 'p']] }
  ],
  explain: [
    { q: 'What is a compound machine? Give two examples and name the simple machines in one of them.',
      model: 'A compound machine is made of two or more simple machines. Scissors and a wheelbarrow are compound machines. An axe has a lever for the handle and a wedge for the blade.',
      ideas: [
        { label: 'Two or more simple machines combined', all: [['two or more', 'combin', 'together', 'more than one', 'made up', 'made of']] },
        { label: 'Two examples of compound machines', all: [['bicycle', 'bike', 'crane', 'scissors', 'wheelbarrow', 'car', 'axe']] },
        { label: 'Names the simple machines in one', all: [['lever', 'wedge', 'wheel and axle', 'pulley']] }] },
    { q: 'How are structure and function related? Use a bicycle as an example.',
      model: 'The structure of an object is its physical form, and the function is what it does. The structure determines the function, and the function determines the structure. A bicycle has wheels, pedals, and handlebars so it can carry people from place to place.',
      ideas: [
        { label: 'Structure is its form and function is what it does', all: [['structure'], ['function'], ['form', 'what it does', 'physical']] },
        { label: 'Each determines the other', all: [['determine', 'related', 'depend', 'connected', 'goes with']] },
        { label: 'A bicycle example', all: [['wheel', 'pedal', 'handlebar', 'frame', 'brake', 'bike', 'bicycle']] }] },
    { q: 'What does efficient mean? Tell how Henry Ford was efficient.',
      model: 'Efficient means that something is done in the best possible way in the least amount of time. Henry Ford found ways to make cars in an inexpensive and efficient way, so more people could buy them.',
      ideas: [
        { label: 'Efficient = best possible way in the least amount of time', all: [['best'], ['least', 'less', 'short', 'fast', 'quick']] },
        { label: 'Henry Ford made cars cheaply and efficiently, so more people could buy them', all: [['car'], ['afford', 'inexpensive', 'cheap', 'more people', 'cost less']] }] }
  ]
};
