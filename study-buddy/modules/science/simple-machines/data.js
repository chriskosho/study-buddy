/* Unit 4, Lesson 6: Simple Machines. Made from pages 45 to 54 of the student's 5th Grade Science, Unit 4, Force and Motion
   (Responsive Education Solutions). The study guide keeps the book's wording (only shortened). The Quiz, Sort it and Explain it
   questions come from the book's review questions (6.1 to 6.20) and Quiz 3; questions with several right answers or pictures are
   rewritten as one multiple-choice question. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'simple-machines',
  title: 'Unit 4, Lesson 6: Simple Machines',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 6, pages 46 to 54). The pictures and figures are in your book.',
  sections: [
    { id: 'work', title: 'Work', text: [
        'Work in science is different from your mom or dad going to work. Work in science is not a job. Work is the use of force to move an object or change the direction it is moving. Work is done only if an object moves.',
        'Push really hard against a closed door and the door does not move: work has not been done. Lean against a building and it does not fall down: work has not been done. Pull on a door handle and the door opens: work is done. Push a toy car and it moves forward: work has been done. One way to do work is to use force to change the direction an object is moving, like two people kicking a soccer ball back and forth.'],
      key: ['Work is the use of force to move an object or change the direction it is moving.', 'Work is done only if an object moves.'] },
    { id: 'simple', title: 'What are simple machines?', text: [
        'Simple machines are machines that have only a few or no moving parts. They make work easier in two ways. First, using them requires less force to move an object. Second, some make work easier by changing the direction of the force. It is easier to sit down on the end of a seesaw to raise your friend off the ground than to push your friend up into the air.',
        'We use simple machines all the time. A knife is a simple machine. A doorknob is a simple machine. Even your arm is a simple machine. There are six types of simple machines: inclined planes, wedges, screws, levers, wheels and axles, and pulleys.'],
      key: ['Two ways simple machines make work easier: less force, and change the direction of the force.', 'Six types: inclined plane, wedge, screw, lever, wheel and axle, pulley.'] },
    { id: 'incline', title: 'Inclined planes and wedges', text: [
        'An inclined plane is a slanted surface that makes it easier to move heavy objects. It is also known as a ramp. Pushing a piano up a ramp into a truck takes much less force than lifting it. Inclined planes make work easier by increasing the distance an object moves. Because the distance increased, less force was needed.',
        'A wedge is a triangular simple machine that is used to split or separate objects. It is made of two inclined planes that meet at a sharp angle. Knives, chisels, and saws are examples. Wedges make work easier by decreasing the amount of force needed to do work, such as splitting apart wood. When force is applied to the top of the wedge, the force spreads outward along the sides of the wedge. The sharper the edge of a wedge, the less force it takes to do work.'],
      key: ['Inclined plane = ramp. It increases the distance, so less force is needed.', 'Wedge = two inclined planes meeting at a sharp angle. The sharper the edge, the less force.'] },
    { id: 'screw', title: 'Screws', text: [
        'A screw is an inclined plane that is wrapped around a cylinder. Think of paper wrapped around a pencil: the paper is like an inclined plane and the pencil is a cylinder. When an inclined plane wraps around a cylinder, it forms edges or ridges called threads.',
        'Screws are used to hold objects together or lift objects up. Screws make work easier by increasing the distance over which the force is applied. They are used in all sorts of things, from light bulbs and eyeglasses to car jacks and jar lids.'],
      key: ['Screw = an inclined plane wrapped around a cylinder.', 'The ridges are called threads.'] },
    { id: 'lever', title: 'Levers', text: [
        'A lever is a simple machine made of a bar that pivots at a fixed point. Pivot means to turn. The fixed, nonmoving point on a lever is called a fulcrum. The bar is the part of a lever that moves or pivots on the fulcrum.',
        'A seesaw is a great example of a lever in action. On a seesaw the fulcrum is in the middle. On other levers, the fulcrum may or may not be in the middle. Levers make work easier by changing the direction of a force and by adding distance. An object can sit at one end of a seesaw while force is applied to the other end.'],
      key: ['Lever = a bar that pivots at a fixed point called the fulcrum.', 'Levers change the direction of a force and add distance.'] },
    { id: 'wheel', title: 'Wheel and axle', text: [
        'The wheel and axle has two parts. The wheel is a circle or round shape that rolls easily. The axle is a rod that the wheel turns around. The axle is placed through the center of the wheel.',
        'Wheels and axles make work easier by increasing the force on the axle. As you turn a wheel with little force, the axle turns with greater force. When you open a door, you turn the knob (the wheel) with little force, and the axle turns with greater force to move the latch and open the door.'],
      key: ['Wheel and axle: a wheel turns around a rod (the axle).', 'A little force on the wheel gives a greater force on the axle.'] },
    { id: 'pulley', title: 'Pulleys', text: [
        'A pulley is a simple machine that is very similar to a wheel and axle. It is a rope or cable that wraps around a wheel and axle. Pulleys are often used to lift heavy objects. Pulleys increase the distance an object moves, which requires less force to move the object.',
        'The length of the rope and the number of wheels used in a pulley can allow you to pull up a heavy load with less force. You can use even less force by adding more pulleys or increasing the length of the rope. The more rope or more pulleys there are, the less force is needed to move an object or do work.'],
      key: ['Pulley = a rope that wraps around a wheel and axle.', 'More rope or more pulleys = less force needed.'] }
  ],
  vocab: [
    ['work', 'the use of force to move an object or change the direction it is moving'],
    ['simple machine', 'a machine with only a few or no moving parts that makes work easier'],
    ['inclined plane', 'a simple machine that is also known as a ramp'],
    ['wedge', 'a triangular simple machine that is two inclined planes that meet at a sharp angle'],
    ['screw', 'a simple machine that is an inclined plane that is wrapped around a cylinder'],
    ['lever', 'a simple machine that is a bar that pivots at a fixed point'],
    ['fulcrum', 'the fixed, nonmoving point on a lever'],
    ['wheel and axle', 'a simple machine that is a rod in the middle of a circle'],
    ['pulley', 'a simple machine that is a rope that wraps around a wheel and axle']
  ],
  quiz: [
    { q: 'What is a simple machine?', a: 'A machine with only a few or no moving parts that makes work easier', wrong: ['A machine with many moving parts', 'A machine that runs on electricity', 'A machine that makes work harder'], why: 'Simple machines have only a few or no moving parts.' },
    { q: 'What is work?', a: 'The use of force to move an object or change the direction it is moving', wrong: ['Going to a job', 'Pushing on an object that does not move', 'Any kind of energy'], why: 'Work in science is not a job.' },
    { q: 'Work is done only if an object ___.', a: 'moves', wrong: ['is heavy', 'is pushed hard', 'stays still'], why: 'Push hard against a closed door and it does not move: work has not been done.' },
    { q: 'One way work is done is if you use force to change the ___ an object is moving.', a: 'direction', wrong: ['color', 'shape', 'weight'], why: 'Kicking a soccer ball back and forth changes the direction the ball is moving.' },
    { q: 'Which of these is a way simple machines make work easier?', a: 'They need less force, or they change the direction of the force', wrong: ['They always move objects faster', 'They make objects lighter', 'They use up more force'], why: 'There are two ways: less force and changing the direction of the force.' },
    { q: 'Which of these shows work being done?', a: 'A man pushes a dresser and it moves across a room', wrong: ['A woman pushes against a door but it does not open', 'A child sits on a pillow on the floor', 'A dog leans its paws against a tree and the tree stays in the same place'], why: 'Work is done only if an object moves.' },
    { q: 'Which of these also shows work being done?', a: 'A batter hits a ball that is thrown, and its direction changes', wrong: ['A child sits on a pillow on the floor', 'A woman pushes against a door but it does not open', 'A dog leans its paws against a tree and the tree stays in the same place'], why: 'Changing the direction an object is moving is work.' },
    { q: 'Which simple machine is an inclined plane wrapped around a cylinder?', a: 'Screw', wrong: ['Wedge', 'Lever', 'Pulley'], why: 'The ridges formed are called threads.' },
    { q: 'Which simple machine is made of two inclined planes that meet at a sharp angle?', a: 'Wedge', wrong: ['Screw', 'Lever', 'Wheel and axle'], why: 'Knives, chisels, and saws are wedges.' },
    { q: 'Which simple machine is a bar that pivots at a fixed point?', a: 'Lever', wrong: ['Wedge', 'Pulley', 'Inclined plane'], why: 'The fixed point is the fulcrum.' },
    { q: 'Which simple machine is also known as a ramp?', a: 'Inclined plane', wrong: ['Wedge', 'Screw', 'Lever'], why: 'An inclined plane is a slanted surface.' },
    { q: 'Which simple machine is a rope that wraps around a wheel and axle?', a: 'Pulley', wrong: ['Lever', 'Screw', 'Wedge'], why: 'Pulleys are often used to lift heavy objects.' },
    { q: 'Which simple machine is a round shape that rolls and turns around a rod?', a: 'Wheel and axle', wrong: ['Pulley', 'Lever', 'Screw'], why: 'The axle is a rod that the wheel turns around.' },
    { q: 'What simple machine is a bolt and nut?', a: 'Screw', wrong: ['Inclined plane', 'Wedge', 'Lever'], why: 'A screw is an inclined plane wrapped around a cylinder.' },
    { q: 'What simple machine is a ramp or walkway?', a: 'Inclined plane', wrong: ['Screw', 'Wedge', 'Pulley'], why: 'A ramp is also known as an inclined plane.' },
    { q: 'What simple machine is a hand saw?', a: 'Wedge', wrong: ['Lever', 'Screw', 'Pulley'], why: 'Knives, chisels, and saws are wedges.' },
    { q: 'What simple machine is a flag on a flagpole raised with a rope?', a: 'Pulley', wrong: ['Lever', 'Wheel and axle', 'Screw'], why: 'A rope wraps around a wheel.' },
    { q: 'What simple machine is the wheel on an inline skate?', a: 'Wheel and axle', wrong: ['Lever', 'Pulley', 'Wedge'], why: 'The wheel turns around a rod, the axle.' },
    { q: 'On a balance scale, the beam is the bar and the center point is the ___.', a: 'fulcrum', wrong: ['wedge', 'thread', 'axle'], why: 'The fulcrum is the fixed, nonmoving point on a lever.' },
    { q: 'Which pulley system needs the least force to move a heavy object?', a: 'Several pulleys with a rope over a long path', wrong: ['A hoist with one pulley and a hook', 'Two wheels with a belt', 'A single wheel with no rope'], why: 'The more rope or more pulleys there are, the less force is needed.' },
    { q: 'In a wedge, how does force spread when it is applied to the top?', a: 'It spreads outward along the sides', wrong: ['It goes straight up', 'It spreads around the handle', 'It stays at the top'], why: 'The sharper the edge, the less force it takes to do work.' }
  ],
  sorts: [
    { id: 'which', label: 'Which simple machine is it?', buckets: [{ id: 'i', name: 'Inclined plane' }, { id: 'w', name: 'Wedge' }, { id: 's', name: 'Screw' }, { id: 'l', name: 'Lever' }, { id: 'a', name: 'Wheel and axle' }, { id: 'p', name: 'Pulley' }],
      items: [
        ['A ramp', 'i'], ['A walkway that slopes up', 'i'], ['A knife', 'w'], ['A hand saw', 'w'], ['A chisel', 'w'], ['A bolt and nut', 's'], ['A jar lid', 's'], ['A light bulb base', 's'],
        ['A seesaw', 'l'], ['A balance scale', 'l'], ['A doorknob', 'a'], ['Inline skate wheels', 'a'], ['A rope on a flagpole', 'p']] },
    { id: 'work', label: 'Is work being done?', buckets: [{ id: 'y', name: 'Work is done' }, { id: 'n', name: 'No work is done' }],
      items: [
        ['A man pushes a dresser across a room', 'y'], ['A batter hits a ball and its direction changes', 'y'], ['A child pushes a toy train around a track', 'y'], ['You pull a door handle and the door opens', 'y'],
        ['A woman pushes against a door but it does not open', 'n'], ['A child sits on a pillow on the floor', 'n'], ['A dog leans on a tree and the tree stays still', 'n'], ['You lean against a building and it does not fall', 'n']] }
  ],
  explain: [
    { q: 'What is work? Give one example of work being done and one example of no work being done.',
      model: 'Work is the use of force to move an object or change the direction it is moving. Work is done only if an object moves. Pushing a toy car so it moves is work. Pushing against a closed door that does not move is not work.',
      ideas: [
        { label: 'Work is the use of force to move an object or change its direction', all: [['force'], ['move', 'direction']] },
        { label: 'An example of work: the object moves', all: [['push', 'pull', 'kick', 'hit'], ['move', 'open', 'direction']] },
        { label: 'An example of no work: the object does not move', all: [['not move', 'does not', 'doesn’t', 'no work', 'not done', 'stay', 'lean']] }] },
    { q: 'Describe the two ways simple machines make work easier.',
      model: 'Simple machines make work easier in two ways. They need less force to move an object, and some change the direction of the force.',
      ideas: [
        { label: 'Less force', all: [['less force', 'less', 'smaller', 'lower']] },
        { label: 'Change the direction of the force', all: [['direction']] }] },
    { q: 'Name the six simple machines and tell what one of them is.',
      model: 'The six simple machines are the inclined plane, wedge, screw, lever, wheel and axle, and pulley. A lever is a bar that pivots at a fixed point called the fulcrum.',
      ideas: [
        { label: 'Names the six simple machines', all: [['inclined plane', 'ramp'], ['wedge'], ['screw'], ['lever'], ['wheel and axle', 'wheel'], ['pulley']] },
        { label: 'Tells what one of them is', all: [['is a', 'are a', 'made', 'means', 'bar', 'rope', 'ramp', 'slant', 'triangle', 'cylinder', 'rod']] }] }
  ]
};
