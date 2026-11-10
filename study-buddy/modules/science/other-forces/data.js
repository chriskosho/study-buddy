/* Unit 4, Lesson 3: Other Forces. Made from pages 18 to 23 and Quiz 1 of the student's 5th Grade Science, Unit 4, Force and Motion
   (Responsive Education Solutions). The study guide keeps the book's wording (only shortened), including its list of what magnets
   attract. The Quiz, Sort it, Put in order and Explain it questions come from the book's review questions (3.1 to 3.9) and Quiz 1;
   questions with several right answers are rewritten as one multiple-choice question. The Lab text is in the student's Lab Manual,
   which is not in Study Buddy. A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'other-forces',
  title: 'Unit 4, Lesson 3: Other Forces',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 3, pages 18 to 23). The pictures and the lab steps are in your book and Lab Manual.',
  sections: [
    { id: 'intro', title: 'Electric and magnetic', text: [
        'Have you ever wondered why a balloon sticks to your hair after you rub it on your shirt? Or why a magnet can pick up a paper clip? These are examples of electric and magnetic forces. Electric and magnetic forces are closely related. In fact, they are both caused by the same thing: the movement of electrons. Electrons are tiny particles that have a negative charge.',
        'Electric and magnetic forces, like gravity, are types of invisible forces that cause objects to attract or repel each other. These forces are all around us, from the magnets on our fridge to the electric current that powers our devices.'],
      key: ['Both are caused by the movement of electrons.', 'Electrons are tiny particles with a negative charge.', 'Both can attract or repel.'] },
    { id: 'electric', title: 'Electric force', text: [
        'Electric forces are forces that act between charged objects. Charged objects can be either positive or negative. Positive and negative charges attract each other. But like charges (two positive or two negative charges) repel each other.',
        'If you rub a balloon on your hair, the balloon will become negatively charged. The negative charge on the balloon will create an electric field. An electric field is an area of space where an electric force can be felt. If an electric field is strong enough, it can cause other charged objects to move. The electric field of the balloon can cause the hair to stand on end or become attracted to the balloon.'],
      key: ['Opposite charges attract.', 'Like charges repel.', 'An electric field is an area of space where an electric force can be felt.'] },
    { id: 'magnet', title: 'Magnets and poles', text: [
        'Magnetic forces are forces that act between magnets. Magnets are objects that attract iron and other metals to them and create a magnetic field. Magnetism is the force between magnets or between a magnet and objects that contain iron, cobalt, or nickel.',
        'A magnet has two ends, called poles. One is the south pole. The other is the north pole. If you cut a magnet in half, you will get two magnets. Each magnet will have its own north pole and its own south pole. The north pole of one magnet will attract the south pole of another magnet. If two north poles are pointed toward each other, the magnets will repel each other. If two south poles are pointed toward each other, the magnets repel each other.'],
      key: ['Like poles repel. Unlike poles attract.', 'A magnet has a north pole and a south pole.', 'Cut a magnet in half and you get two magnets, each with two poles.'] },
    { id: 'field', title: 'The magnetic field', text: [
        'Magnets create a magnetic field. The magnetic field is the invisible area around a magnet in which objects will be attracted or repelled. If you bring a metal paper clip toward a magnet, eventually the paper clip will enter the magnetic field. Once the paper clip is in the magnetic field, it will “jump” through the air and stick to the magnet. If you place iron shavings around a magnet, it will show you where the magnetic field is.',
        'The north pole of a magnet roughly points in the direction of Earth’s north pole. The south pole of a magnet roughly points in the direction of Earth’s south pole. If you were to attach a magnet to a piece of wood and let it float in water, you would see the wood move as the north pole of the magnet lines up with Earth’s north pole.'],
      key: ['A magnetic field is the invisible area around a magnet where objects are attracted or repelled.', 'Iron shavings show where the field is.', 'A magnet’s north pole roughly points toward Earth’s north pole.'] },
    { id: 'what', title: 'What magnets attract', text: [
        'Different materials interact with magnetism in different ways. Some materials are strongly attracted to magnets, like iron or steel. If you bring a magnet near a piece of iron or steel, it will be pulled towards the magnet. Other materials are only slightly attracted to magnets, like copper or aluminum. Some materials are not affected by magnets at all, like wood, glass, water, air, paper, and rubber.',
        'We can measure magnetism by measuring the strength of the magnetic field. It is like measuring how strong the push or pull is between two magnets.'],
      table: { title: 'How materials act near a magnet', head: ['Strongly attracted', 'Slightly attracted', 'Not affected'], rows: [['iron, steel', 'copper, aluminum', 'wood, glass, water, air, paper, rubber']] },
      key: ['Objects that contain iron, cobalt, or nickel are attracted to magnets.'] }
  ],
  vocab: [
    ['electric force', 'the force between charged objects'],
    ['electron', 'a tiny particle that has a negative charge'],
    ['electric field', 'an area of space where an electric force can be felt'],
    ['magnetism', 'the force between magnets or between a magnet and objects that contain iron, cobalt, or nickel'],
    ['magnetic field', 'the invisible area around a magnet in which objects will be attracted or repelled'],
    ['pole', 'one of the two ends of a magnet: the north pole and the south pole'],
    ['attract', 'to pull toward each other'],
    ['repel', 'to push away from each other']
  ],
  lab: { title: 'Magnetism', note: 'Complete this lab in the Lab Manual. (The lab steps are in your Lab Manual, not in Study Buddy.)',
    review: ['Like poles repel. Unlike poles attract.', 'Magnets attract objects that contain iron, cobalt, or nickel.', 'A magnetic field is the invisible area around a magnet where objects are attracted or repelled.', 'Wood, glass, water, air, paper, and rubber are not affected by magnets.'] },
  quiz: [
    { q: 'What is the force between two charged objects?', a: 'Electric force', wrong: ['Magnetic force', 'Gravity', 'Friction'], why: 'Electric forces are forces that act between charged objects.' },
    { q: 'What is an electric field?', a: 'An area of space where an electric force can be felt', wrong: ['A type of magnet', 'A type of charged object', 'A wire that carries electricity'], why: 'If an electric field is strong enough, it can cause other charged objects to move.' },
    { q: 'Electric and magnetic forces are caused by the movement of ___.', a: 'electrons', wrong: ['protons', 'neutrons', 'atoms of iron'], why: 'Electrons are tiny particles that have a negative charge.' },
    { q: 'Electrons have a ___ charge.', a: 'negative', wrong: ['positive', 'neutral', 'magnetic'], why: 'Electrons are tiny particles that have a negative charge.' },
    { q: 'What happens when positive and negative charges are near each other?', a: 'They attract each other', wrong: ['They repel each other', 'Nothing happens', 'They turn into magnets'], why: 'Positive and negative charges attract each other. Like charges repel.' },
    { q: 'What happens when you rub a balloon on your hair?', a: 'The balloon becomes negatively charged', wrong: ['The balloon becomes a magnet', 'The balloon loses all its charge', 'The hair becomes a magnet'], why: 'The negative charge on the balloon creates an electric field.' },
    { q: 'A magnet has two ends, called ___.', a: 'poles', wrong: ['magnet ends', 'metal tips', 'fields'], why: 'One is the south pole and the other is the north pole.' },
    { q: 'Two of the same poles will ___ each other, but two opposite poles will ___ each other.', a: 'repel; attract', wrong: ['attract; repel', 'attract; attract', 'repel; repel'], why: 'Like poles repel. Unlike poles attract.' },
    { q: 'Two north poles facing each other will ___ each other.', a: 'repel', wrong: ['attract', 'stick to', 'turn into south poles'], why: 'If two north poles are pointed toward each other, the magnets will repel each other.' },
    { q: 'The ___ is the area where a magnet can use force to attract or repel some objects.', a: 'magnetic field', wrong: ['attraction field', 'repel field', 'electric field'], why: 'A magnetic field is the invisible area around a magnet.' },
    { q: 'What happens when a metal paper clip enters the magnetic field of a magnet?', a: 'It becomes attracted to the magnet', wrong: ['It becomes repelled by the magnet', 'It becomes a north pole', 'Nothing happens'], why: 'The paper clip will “jump” through the air and stick to the magnet.' },
    { q: 'Which of these is attracted to a magnet?', a: 'Iron', wrong: ['Wood', 'Plastic', 'Rubber'], why: 'Magnetism is the force between a magnet and objects that contain iron, cobalt, or nickel.' },
    { q: 'Which of these materials is NOT attracted to magnets?', a: 'Water', wrong: ['Cobalt', 'Nickel', 'Steel'], why: 'Water, air, paper, wood, glass, and rubber are not affected by magnets at all.' },
    { q: 'What do you get if you cut a magnet in half?', a: 'Two magnets, each with its own north pole and south pole', wrong: ['One north-only magnet and one south-only magnet', 'Two pieces that are not magnets', 'One magnet and one piece of iron'], why: 'Each magnet will have its own north pole and its own south pole.' },
    { q: 'Which of these shows that an electric force can move objects?', a: 'A balloon makes a person’s hair stand on end', wrong: ['A rock falls from a cliff', 'A rolling ball slows down', 'A magnet sticks to a spoon'], why: 'The electric field of the balloon can cause the hair to stand on end or become attracted to the balloon.' },
    { q: 'Where does the north pole of a magnet roughly point?', a: 'In the direction of Earth’s north pole', wrong: ['In the direction of Earth’s south pole', 'Straight up', 'Straight down'], why: 'A magnet floating on wood in water lines up with Earth’s north pole.' }
  ],
  sorts: [
    { id: 'ar', label: 'Attract or repel?', buckets: [{ id: 'a', name: 'They attract' }, { id: 'r', name: 'They repel' }],
      items: [
        ['A north pole and a south pole', 'a'],
        ['A positive charge and a negative charge', 'a'],
        ['A negatively charged balloon and the hair it pulls toward itself', 'a'],
        ['A magnet and a paper clip made of iron or steel', 'a'],
        ['Two north poles', 'r'],
        ['Two south poles', 'r'],
        ['Two positive charges', 'r'],
        ['Two negative charges', 'r']] },
    { id: 'mag', label: 'Is it attracted to a magnet?', buckets: [{ id: 'y', name: 'Attracted to a magnet' }, { id: 'n', name: 'Not attracted' }],
      items: [
        ['iron', 'y'], ['steel', 'y'], ['cobalt', 'y'], ['nickel', 'y'],
        ['wood', 'n'], ['plastic', 'n'], ['rubber', 'n'], ['glass', 'n'], ['water', 'n'], ['paper', 'n']] }
  ],
  orders: [
    { id: 'balloon', label: 'The balloon and your hair', hint: 'What happens first? Put the steps in order.',
      items: ['You rub a balloon on your hair.', 'The balloon becomes negatively charged.', 'The negative charge creates an electric field around the balloon.', 'The electric field makes the hair stand on end or become attracted to the balloon.'] }
  ],
  explain: [
    { q: 'How are electric forces and magnetic forces alike?',
      model: 'Electric and magnetic forces are both caused by the movement of electrons. They are both invisible forces that can attract or repel objects, like gravity.',
      ideas: [
        { label: 'Both are caused by the movement of electrons', all: [['electron'], ['movement', 'moving', 'move', 'motion']] },
        { label: 'Both can attract or repel', all: [['attract'], ['repel']] },
        { label: 'Both are invisible forces', all: [['invisible', 'cannot see', 'can’t see', 'can not see', 'unseen']] }] },
    { q: 'What happens when you bring a metal paper clip toward a magnet? Use the words magnetic field.',
      model: 'A magnet creates a magnetic field. When the paper clip enters the magnetic field, it is attracted to the magnet. It jumps through the air and sticks to the magnet.',
      ideas: [
        { label: 'A magnet creates a magnetic field', all: [['magnetic field', 'field']] },
        { label: 'The paper clip enters the field', all: [['enter', 'inside', 'in the', 'comes into', 'gets into', 'near', 'reaches']] },
        { label: 'It is attracted to the magnet and sticks', all: [['attract', 'jump', 'pulled', 'stick']] }] },
    { q: 'Explain what happens when two magnets are brought together. What happens if you cut a magnet in half?',
      model: 'Like poles repel and unlike poles attract. A north pole attracts a south pole, and two north poles or two south poles repel each other. If you cut a magnet in half, you get two magnets, and each one has its own north pole and south pole.',
      ideas: [
        { label: 'Like poles repel and unlike poles attract', all: [['repel'], ['attract']] },
        { label: 'Poles: north and south', all: [['north'], ['south']] },
        { label: 'Cut in half: two magnets, each with two poles', all: [['half', 'cut'], ['two magnets', 'two', 'each']] }] }
  ]
};
