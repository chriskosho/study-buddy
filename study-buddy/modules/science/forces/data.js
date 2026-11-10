/* Unit 4, Lesson 1: Forces. Made from pages 1 to 9 and Quiz 1 of the student's 5th Grade Science, Unit 4, Force and Motion
   (Responsive Education Solutions). The study guide keeps the book's wording (only shortened). Quiz, Sort it and Explain it
   questions come from the book's review questions and Quiz 1; where the book's question needs a picture or has several
   right answers, the question is rewritten as one multiple-choice question. The Lab text is in the student's Lab Manual,
   which is not in Study Buddy. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'forces',
  title: 'Unit 4, Lesson 1: Forces',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 1, pages 1 to 9). The pictures and the lab steps are in your book and Lab Manual.',
  sections: [
    { id: 'force', title: 'What is a force?', text: [
        'You have learned about energy. Energy is the ability to do work. To work, in science, is to move an object with force. A force is a push or a pull.',
        'Forces are all around us. They can cause objects to move, stop moving, or change direction. There are contact forces, like friction, when you rub your hands together. There are also noncontact forces, like gravity, that keep you on the ground.'],
      key: ['A force is a push or a pull.', 'Force is measured in newtons (N).', 'Motion is the process of something moving from one place to another.'] },
    { id: 'does', title: 'What forces do', text: [
        'Forces can affect motion in different ways. A force can start an object moving, stop an object from moving, change the direction an object is moving, or change the speed of a moving object.',
        'Push a bike while walking next to it: the force starts the bike moving. Use the brakes: the force of the brakes pushes against the wheels and stops the bike. Turn the handlebars: the force changes the direction of the bike. Pedal faster: the force of your legs pushes the pedals and increases the bike’s speed.'],
      key: ['Start an object moving', 'Stop an object from moving', 'Change the direction an object is moving', 'Change the speed of a moving object'] },
    { id: 'measure', title: 'Measuring forces', text: [
        'The strength of a force is measured in newtons (N). One way to measure force is to use a spring scale. A spring scale is a tool that measures how hard you are pushing or pulling on an object. The harder you push or pull on the object, the more the spring stretches.',
        'We can also measure how forces affect the motion of objects using tools like a stopwatch or ruler. We can see how long it takes an object to move a certain distance when pushed with a strong force, compared with a weak force.'],
      key: ['Unit of force: the newton (N)', 'A spring scale measures how hard you push or pull', 'A stopwatch and a ruler show how force affects motion'] },
    { id: 'balance', title: 'Balanced and unbalanced', text: [
        'Objects are not always moving because of balanced or equal forces. If two people arm-wrestling have equal force (100 N each), their arms will not move. The forces are opposite of each other, balanced, and no motion occurs.',
        'If one force is greater than the opposite force, the forces are unbalanced and an object will move. John pushes a sofa with 250 N and Joe pushes the other way with 150 N: the sofa moves in the direction John is pushing, with a force of 100 N (250 N − 150 N). If both push the same way, the forces add together: 250 N + 150 N = 400 N.'],
      key: ['Balanced forces: no motion or change of direction', 'Unbalanced forces: objects move or change direction', 'Opposite forces subtract. Forces in the same direction add.'] },
    { id: 'energy', title: 'Energy of motion', text: [
        'Kinetic energy is the energy that an object has when it is moving. Potential energy is energy that is stored or waiting to be used. When forces cause objects to move, they also transfer energy. Energy is what makes things happen.',
        'When you throw a ball, you are transferring kinetic energy from your hand to the ball. If you throw the ball harder, you apply a greater force. This greater force transfers more energy to the ball, causing it to move faster. When a ball hits the ground, it stops moving because the force of the ground pushing up on the ball is equal to the force of the ball’s downward motion.'],
      key: ['Kinetic energy: the energy of a moving object', 'Potential energy: stored energy', 'A force transfers energy from the force to the object'] }
  ],
  vocab: [
    ['force', 'a push or a pull'],
    ['friction', 'a force that stops or slows motion when two objects touch each other'],
    ['gravity', 'the force between objects that have mass, pulling them toward each other'],
    ['magnetism', 'the force between magnets or between a magnet and objects that contain iron, cobalt, or nickel'],
    ['motion', 'the process of something moving from one place to another'],
    ['newton (N)', 'the unit used to measure the strength of a force'],
    ['spring scale', 'a tool that measures how hard you are pushing or pulling on an object'],
    ['kinetic energy', 'the energy that an object has when it is moving'],
    ['potential energy', 'energy that is stored or waiting to be used']
  ],
  lab: { title: 'Balancing Forces', note: 'Complete this lab in the Lab Manual. (The lab steps are in your Lab Manual, not in Study Buddy.)',
    review: ['Balanced forces are equal and opposite, so there is no motion.', 'Unbalanced forces make an object move or change direction.', 'Forces in opposite directions subtract. Forces in the same direction add.', 'Force is measured in newtons (N).'] },
  quiz: [
    { q: 'What is a force?', a: 'A push or a pull', wrong: ['A measurement of an object', 'The change in an object’s shape', 'The process of something moving'], why: 'A force is a push or a pull.' },
    { q: 'Force is measured in which unit?', a: 'Newtons', wrong: ['Grams', 'Degrees', 'Meters'], why: 'The strength of a force is measured in newtons (N).' },
    { q: 'What is motion?', a: 'The process of an object moving', wrong: ['The measurement of an object', 'The change in an object’s shape', 'A push or a pull'], why: 'Motion is the process of something moving from one place to another.' },
    { q: 'What is a spring scale used for?', a: 'Measuring how hard you are pushing or pulling on an object', wrong: ['Measuring how far an object moves', 'Measuring how long it takes an object to move', 'Measuring how heavy the air is'], why: 'The harder you push or pull on the object, the more the spring stretches.' },
    { q: 'When forces are ___, there is no motion or change of direction.', a: 'balanced', wrong: ['unbalanced', 'kinetic', 'potential'], why: 'Balanced forces are equal and opposite.' },
    { q: 'When forces become ___, objects move or change direction.', a: 'unbalanced', wrong: ['balanced', 'equal', 'opposite and equal'], why: 'When one force is greater than the opposite force, an object will move.' },
    { q: 'What happens when forces cause objects to move?', a: 'Energy is transferred from the force to the object', wrong: ['Energy is transferred from the object to the force', 'Energy is created from the force', 'Energy is destroyed from the force'], why: 'When an object is pushed or pulled, the energy from the force is transferred to the object.' },
    { q: 'What happens when you throw a ball harder?', a: 'You apply a greater force to the ball', wrong: ['You apply less force to the ball', 'You transfer less energy to the ball', 'You make the ball lose all its energy'], why: 'A greater force transfers more energy to the ball, causing it to move faster.' },
    { q: 'When a ball hits the ground, why does it stop moving?', a: 'The force of the ground pushing up on the ball is equal to the force of the ball’s downward motion', wrong: ['The ground pushes up with more force than the ball’s downward motion', 'The ground pushes up with less force than the ball’s downward motion', 'The ball has no more potential energy'], why: 'The two forces are equal, so they are balanced and the ball stops.' },
    { q: 'Linda pushes a door from the inside with 100 N of force while Joyce pushes the door from the outside with 100 N of force. The forces are ___.', a: 'balanced', wrong: ['unbalanced', 'noncontact', 'kinetic'], why: 'Equal forces in opposite directions are balanced, so the door does not move.' },
    { q: 'One group pulls on a rope with 100 N of force and another group pulls the other way with 50 N. The forces are ___.', a: 'unbalanced', wrong: ['balanced', 'equal', 'zero'], why: 'One force is greater than the other, so the rope moves toward the group pulling with 100 N.' },
    { q: 'An object has a 10 N force pushing up and a 10 N force pushing down. What will it do?', a: 'Stay still', wrong: ['Move up', 'Move down', 'Spin around'], why: 'The forces are equal and opposite (balanced), so there is no motion.' },
    { q: 'An object has a 15 N force pushing left and a 25 N force pushing right. What will it do?', a: 'Move to the right', wrong: ['Move to the left', 'Stay still', 'Move up'], why: 'The forces are unbalanced. The greater force is to the right.' },
    { q: 'Which of these is NOT something a force can do?', a: 'Make an object lose all of its mass', wrong: ['Start an object moving', 'Stop an object from moving', 'Change the direction an object is moving'], why: 'A force can start, stop, change the direction of, or change the speed of a moving object.' },
    { q: 'John pushes a sofa with 250 N. Joe pushes it the other way with 150 N. How much force moves the sofa, and which way?', a: '100 N, in the direction John is pushing', wrong: ['400 N, in the direction John is pushing', '100 N, in the direction Joe is pushing', 'No force, because it is balanced'], why: '250 N − 150 N = 100 N, in the direction of the stronger push.' },
    { q: 'Joe and John push a sofa the same way with 150 N and 250 N. What is the total force?', a: '400 N', wrong: ['100 N', '250 N', '0 N'], why: 'Forces in the same direction add together: 250 N + 150 N = 400 N.' }
  ],
  sorts: [
    { id: 'bal', label: 'Balanced or unbalanced?', buckets: [{ id: 'b', name: 'Balanced forces' }, { id: 'u', name: 'Unbalanced forces' }],
      items: [
        ['Two arm-wrestlers each push with 100 N and the arms do not move', 'b'],
        ['Linda pushes a door with 100 N from one side and Joyce pushes back with 100 N', 'b'],
        ['An object has 10 N pushing up and 10 N pushing down', 'b'],
        ['A ball stops on the ground: the ground pushes up as hard as the ball pushes down', 'b'],
        ['John pushes a sofa with 250 N and Joe pushes the other way with 150 N', 'u'],
        ['One group pulls a rope with 100 N and the other group pulls with 50 N', 'u'],
        ['An object has 15 N pushing left and 25 N pushing right', 'u'],
        ['Jan’s friends help her push the door and it opens', 'u']] },
    { id: 'does', label: 'What did the force do?', buckets: [{ id: 'start', name: 'Starts an object moving' }, { id: 'stop', name: 'Stops an object' }, { id: 'dir', name: 'Changes direction' }, { id: 'speed', name: 'Changes speed' }],
      items: [
        ['You push a bike while walking next to it', 'start'],
        ['You kick a ball that is sitting still', 'start'],
        ['The brakes push against the wheels of a bike', 'stop'],
        ['A goalkeeper catches a ball', 'stop'],
        ['You turn the handlebars of a bike', 'dir'],
        ['A batter hits a ball back the way it came', 'dir'],
        ['You pedal a bike faster', 'speed'],
        ['You throw a ball harder', 'speed']] }
  ],
  explain: [
    { q: 'What is a force, and what are four things a force can do to an object?',
      model: 'A force is a push or a pull. A force can start an object moving, stop an object from moving, change the direction an object is moving, or change the speed of a moving object.',
      ideas: [
        { label: 'A force is a push or a pull', all: [['push'], ['pull']] },
        { label: 'Start or stop an object', all: [['start', 'begin'], ['stop']] },
        { label: 'Change direction or speed', all: [['direction', 'turn'], ['speed', 'faster', 'slower']] }] },
    { q: 'What is the difference between balanced and unbalanced forces?',
      model: 'Balanced forces are equal and opposite, so there is no motion or change of direction. When one force is greater than the other, the forces are unbalanced, and the object will move or change direction.',
      ideas: [
        { label: 'Balanced forces are equal, so there is no motion', all: [['balanced'], ['equal', 'same'], ['no motion', 'not move', 'stay still', 'does not move', 'doesn’t move', 'no change']] },
        { label: 'Unbalanced forces are not equal, so the object moves', all: [['unbalanced', 'greater', 'stronger', 'one force'], ['move', 'moves', 'change direction']] }] },
    { q: 'Explain what happens to the energy when you throw a ball, and what happens when you throw it harder.',
      model: 'When you throw a ball, the force transfers kinetic energy from your hand to the ball. If you throw it harder, you apply a greater force, which transfers more energy and makes the ball move faster.',
      ideas: [
        { label: 'Energy is transferred from the force to the ball', all: [['transfer', 'give', 'gives', 'passes'], ['energy']] },
        { label: 'A harder throw is a greater force', all: [['harder', 'greater', 'more force', 'stronger']] },
        { label: 'More energy, so the ball goes faster', all: [['faster', 'more energy', 'speed']] }] }
  ]
};
