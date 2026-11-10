/* Unit 4, Lesson 2: Gravity and Friction. Made from pages 10 to 17 of the student's 5th Grade Science, Unit 4, Force and Motion
   (Responsive Education Solutions). The study guide keeps the book's wording (only shortened). The Quiz, Sort it and Explain it questions
   come from the book's review questions (2.1 to 2.18) and Quiz 1; questions that need a picture or have several right answers are
   rewritten as one multiple-choice question. The "More or less friction?" and "Gravity or friction?" cards use the book's examples plus
   a few everyday ones in the same spirit. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'gravity-friction',
  title: 'Unit 4, Lesson 2: Gravity and Friction',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 2, pages 10 to 17). The pictures are in your book.',
  sections: [
    { id: 'gravity', title: 'Gravity', text: [
        'There are many different types of forces. Two of these forces affect everything on Earth: gravity and friction. Gravity is an invisible force that is found everywhere in the universe. Gravity is a force that pulls objects toward each other. It is the reason why things fall down when you drop them. It is why the moon orbits Earth.',
        'Gravity is a noncontact force. This means that it can act on objects without them touching. Earth’s gravity pulls on the moon even though Earth and the moon are not touching each other. Gravity is the force between any two objects that have mass. The more mass an object has, the greater the gravitational pull it will have.'],
      key: ['Gravity is a force that pulls objects toward each other.', 'Gravity is a noncontact force.', 'The more mass an object has, the greater its gravitational pull.', 'Earth’s gravity pulls a thrown ball back toward the ground.'] },
    { id: 'weight', title: 'Weight and gravity', text: [
        'Gravity affects how much a person weighs because weight is the measure of the pull of gravity on your mass. If you went to Mars, you would weigh less than you do on Earth. The person’s mass would not change. The person’s weight would change because of gravity.',
        'Mars’ mass is less than Earth’s mass. Because the planet is smaller, it would pull you down with less force. Jupiter’s mass is greater than Earth’s mass. It would pull you down with greater force, causing you to weigh more.'],
      table: { title: 'A person who weighs 100 lb on Earth would weigh', head: ['Where', 'Weight'], rows: [['On Earth', '100 lb'], ['On Mars', '38 lb'], ['On Jupiter', '236 lb']] },
      key: ['Weight is the measure of the pull of gravity on your mass.', 'Your mass does not change. Your weight does.'] },
    { id: 'height', title: 'Height and newtons', text: [
        'The force of gravity on Earth does not change, but the effect of the force of gravity on a mass changes depending on the height from which something falls. The higher something is before it falls, the longer gravity can act on the object. A book dropped from a height of 2 meters will hit the ground with more force than a book dropped from a height of 2 centimeters.',
        'Many scientists weigh objects in newtons rather than pounds or kilograms. An object that has a force of 4.5 N weighs about 1 lb. Something that weighs 2 lb would have 9 N (4.5 × 2 = 9 N).'],
      key: ['The higher something is before it falls, the longer gravity can act on it.', '4.5 N is about 1 lb.', '9 N is about 2 lb. 13.5 N is about 3 lb.'] },
    { id: 'friction', title: 'Friction', text: [
        'When you kick a ball, eventually it will stop rolling. The reason objects stop moving is friction. Friction is a contact force. It occurs when two objects touch or rub against each other. Because of friction, nothing can stay in motion forever.',
        'Friction is a force that stops or slows motion when two objects touch each other. It works against both pulling and pushing forces. Friction changes the kinetic energy of the moving objects into heat. This is why when you rub your hands back and forth, your hands will begin to feel hot. Gases, liquids, and solids all have friction when they come into contact with one another.'],
      key: ['Friction is a contact force.', 'Friction slows or stops motion.', 'Friction turns kinetic energy into heat.', 'Sometimes friction is helpful (a bathroom mat keeps you from slipping) and sometimes it is not (moving a heavy sofa on carpet).'] },
    { id: 'area', title: 'Area and texture', text: [
        'The amount of area between the two touching objects affects friction. A car has four tires, and only a little part of each tire is touching the ground. This creates less friction. The force of friction decreases when there is less surface area between objects. It increases when there is more surface area between two objects.',
        'The texture of objects affects friction. Rough, bumpy surfaces have more friction than smooth surfaces. A bowling ball goes fast down a smooth, hard surface. It would have much more friction on carpet. A dirt road has more friction than a paved road because it has a rougher texture.'],
      key: ['Less surface area: less friction. More surface area: more friction.', 'Rough, bumpy surfaces have more friction than smooth surfaces.', 'The rougher the texture, the more force you need to overcome the friction.'] },
    { id: 'mass', title: 'Mass and friction', text: [
        'The mass, or how heavy something is, affects friction. The heavier or more massive an object, the more friction there is when the object is pulled or pushed against another surface. An empty box is easy to push across the floor. A box full of books is difficult.',
        'Hydroplaning: tires have many grooves, and the rough, uneven texture increases friction between the tire and the ground. Over time, tires get worn down and smooth. When it rains, a car can lose contact with the road when the tires are too smooth. This is called hydroplaning. Hydroplaning can cause serious accidents.'],
      key: ['The heavier or more massive an object, the more friction.', 'Taking the cushions off a sofa reduces its mass, and that reduces friction.', 'Smooth, worn tires can cause hydroplaning on a wet road.'] }
  ],
  vocab: [
    ['gravity', 'the force between objects that have mass, pulling them toward each other'],
    ['friction', 'a force that stops or slows motion when two objects touch each other'],
    ['noncontact force', 'a force that can act on objects without them touching, like gravity'],
    ['contact force', 'a force that occurs when two objects touch or rub against each other, like friction'],
    ['weight', 'the measure of the pull of gravity on your mass'],
    ['mass', 'how heavy something is'],
    ['newton (N)', 'the unit of force. An object that has a force of 4.5 N weighs about 1 lb.'],
    ['texture', 'how rough or smooth the surface of an object is'],
    ['hydroplaning', 'when a car loses contact with a wet road because its tires are too smooth']
  ],
  quiz: [
    { q: 'Gravity is a type of ___ force that happens between objects, even if they are not touching.', a: 'noncontact', wrong: ['contact', 'magnetic', 'balanced'], why: 'Gravity can act on objects without them touching.' },
    { q: 'What is the force between objects that have mass?', a: 'Gravity', wrong: ['Friction', 'Weight', 'Inertia'], why: 'Gravity is the force between any two objects that have mass.' },
    { q: 'The ___ the mass of an object, the more gravity it will have.', a: 'greater', wrong: ['less', 'smaller', 'lighter'], why: 'The more mass an object has, the greater the gravitational pull it will have.' },
    { q: 'What changes as a result of gravity when you go to a different planet?', a: 'A person’s weight', wrong: ['A person’s mass', 'A person’s height', 'A person’s age'], why: 'Weight is the measure of the pull of gravity on your mass. Your mass does not change.' },
    { q: 'A person would weigh the most on which of these?', a: 'Jupiter', wrong: ['Earth', 'Mars', 'The moon'], why: 'Jupiter’s mass is greater than Earth’s mass, so it pulls you down with greater force. 100 lb on Earth is 236 lb on Jupiter.' },
    { q: 'The ___ something is before it falls, the longer gravity can act on the object.', a: 'higher', wrong: ['lower', 'lighter', 'smaller'], why: 'A book dropped from 2 meters hits with more force than one dropped from 2 centimeters.' },
    { q: 'If an object has a force of 13.5 N, how much would it weigh in pounds?', a: '3 lb', wrong: ['5 lb', '10 lb', '13.5 lb'], why: '4.5 N is about 1 lb, so 13.5 N is 13.5 ÷ 4.5 = 3 lb.' },
    { q: 'If an object has a force of 20 N, about how much would it weigh in pounds?', a: '4.5 lb', wrong: ['5 lb', '9 lb', '20 lb'], why: '4.5 N is about 1 lb, so 20 N is about 4.5 lb.' },
    { q: 'Why does a ball that is thrown up into the air fall back to the ground?', a: 'The force of gravity pulls it back toward the ground', wrong: ['Friction pulls it down', 'Mass makes it stop', 'Magnetism pulls it down'], why: 'What goes up must come down: gravity pulls objects toward each other.' },
    { q: 'What is a force that stops or slows motion when objects touch each other?', a: 'Friction', wrong: ['Weight', 'Gravity', 'Mass'], why: 'Friction works against both pulling and pushing forces.' },
    { q: 'Friction explains why ___.', a: 'our hands begin to feel hot when we rub them together', wrong: ['cars go faster when they are driven down a hill', 'a ball falls to the ground after it has been thrown into the air', 'the moon orbits Earth'], why: 'Friction changes kinetic energy into heat.' },
    { q: 'Which of these is an example of when friction is NOT helpful?', a: 'Moving a heavy sofa on carpet', wrong: ['Walking on a wet bathroom floor with a mat', 'Stepping on a mat after a bath', 'Tires gripping the road'], why: 'There is a lot of friction between the sofa and the carpet, so it is hard to push.' },
    { q: 'Friction is a type of ___ force that happens when objects touch.', a: 'contact', wrong: ['noncontact', 'magnetic', 'electric'], why: 'Friction occurs when two objects touch or rub against each other.' },
    { q: 'Rough, bumpy surfaces have ___ friction than smooth surfaces.', a: 'more', wrong: ['less', 'the same', 'no'], why: 'A dirt road has more friction than a paved road.' },
    { q: 'The force of friction ___ when there is less surface area between objects.', a: 'decreases', wrong: ['increases', 'stays the same', 'turns into gravity'], why: 'Putting cardboard under the sofa legs to reduce the contact area, which reduced friction.' },
    { q: 'The rougher a surface’s texture, the ___ force you need to overcome the friction.', a: 'more', wrong: ['less', 'the same amount of', 'no'], why: 'On a dirt road you have to use more force than on a paved road.' },
    { q: 'The heavier or more massive an object is, the ___ friction there is when it is pulled or pushed against another surface.', a: 'more', wrong: ['less', 'the same', 'no'], why: 'A box full of books is harder to push than an empty box.' },
    { q: 'Which surface would have more friction when a ball rolls on top of it?', a: 'Grass', wrong: ['A smooth wood floor', 'Ice', 'A glass table'], why: 'Rough, bumpy surfaces have more friction than smooth surfaces.' },
    { q: 'Which would have less friction when it is pushed across the ground?', a: 'An empty shopping cart', wrong: ['A shopping cart full of groceries', 'A box full of books', 'A heavy sofa'], why: 'The less mass an object has, the less friction.' },
    { q: 'What is hydroplaning?', a: 'When a car loses contact with a wet road because its tires are too smooth', wrong: ['When a car floats on a lake', 'When a tire gets extra grip in the rain', 'When a car’s engine gets too hot'], why: 'Worn, smooth tires have less friction and cannot grip the road.' }
  ],
  sorts: [
    { id: 'gf', label: 'Gravity or friction?', buckets: [{ id: 'g', name: 'Gravity' }, { id: 'f', name: 'Friction' }],
      items: [
        ['A ball thrown into the air falls back to the ground', 'g'],
        ['The moon orbits Earth', 'g'],
        ['A person weighs less on Mars than on Earth', 'g'],
        ['An apple falls from a tree', 'g'],
        ['A rolling ball slowly stops on the grass', 'f'],
        ['Your hands feel hot when you rub them together', 'f'],
        ['A bathroom mat keeps you from slipping', 'f'],
        ['A toy car on a long street eventually stops', 'f']] },
    { id: 'more', label: 'More friction or less friction?', buckets: [{ id: 'more', name: 'More friction' }, { id: 'less', name: 'Less friction' }],
      items: [
        ['A dirt road', 'more'],
        ['A bowling ball rolling on carpet', 'more'],
        ['A box full of books', 'more'],
        ['The whole bottom of a car touching the ground', 'more'],
        ['A paved road', 'less'],
        ['A bowling ball on a smooth, hard floor', 'less'],
        ['An empty box', 'less'],
        ['Sofa legs on pieces of cardboard (less contact area)', 'less']] }
  ],
  explain: [
    { q: 'Explain why a ball that is thrown up into the air falls back to the ground.',
      model: 'Gravity is a force that pulls objects toward each other. Earth has a lot of mass, so the force of gravity pulls the ball back toward the ground.',
      ideas: [
        { label: 'Gravity is a force that pulls objects toward each other', all: [['gravity'], ['pull', 'pulls', 'attract']] },
        { label: 'Earth has a lot of mass or pulls the ball toward the ground', all: [['earth', 'ground', 'down'], ['mass', 'toward', 'back', 'big', 'large']] }] },
    { q: 'Explain how mass, surface area, and texture affect friction.',
      model: 'The more mass an object has, the more friction there is. More surface area touching means more friction, and less surface area means less friction. A rough surface has more friction than a smooth surface.',
      ideas: [
        { label: 'More mass, more friction', all: [['mass', 'heavier', 'heavy'], ['more friction', 'more']] },
        { label: 'More surface area, more friction', all: [['area'], ['more', 'less', 'decrease', 'increase']] },
        { label: 'Rough surfaces have more friction than smooth ones', all: [['rough', 'texture', 'bumpy'], ['smooth']] }] },
    { q: 'Explain why a person weighs less on Mars than on Earth, and what stays the same.',
      model: 'Weight is the measure of the pull of gravity on your mass. Mars has less mass than Earth, so it pulls you down with less force and you weigh less. Your mass does not change.',
      ideas: [
        { label: 'Weight is the pull of gravity on your mass', all: [['weight'], ['pull', 'gravity']] },
        { label: 'Mars has less mass, so less pull', all: [['mars'], ['less', 'smaller', 'weaker']] },
        { label: 'Your mass does not change', all: [['mass'], ['not change', 'stays', 'same', 'doesn’t change', 'does not change']] }] }
  ]
};
