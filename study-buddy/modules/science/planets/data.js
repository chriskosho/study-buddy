/* The Planets: content.
   Numbers are rounded from NASA's Planetary Fact Sheet (equatorial diameter, average distance from the Sun,
   time to spin once, length of year, average temperature). Moon counts for the giant planets keep changing as
   new moons are found, so they are written as "more than ..." instead of exact numbers. */
const PLANETS = [
  { id: 'mercury', name: 'Mercury', type: 'Rocky', diameter: 4879, distance: 57.9, spin: '59 Earth days', spinH: 1408, year: 88, yearText: '88 Earth days', temp: 167, moons: 'No moons', moonCount: 0,
    look: 'gray', facts: ['The smallest planet, and the closest to the Sun.', 'It has almost no air, so it is very hot in the day and freezing at night.', 'It is covered in craters, like our Moon.'],
    clues: ['A year here lasts only 88 Earth days.', 'I have no moons and lots of craters.', 'I am the smallest planet and the closest to the Sun.'] },
  { id: 'venus', name: 'Venus', type: 'Rocky', diameter: 12104, distance: 108.2, spin: '243 Earth days', spinH: 5832, year: 225, yearText: '225 Earth days', temp: 464, moons: 'No moons', moonCount: 0,
    look: 'yellow', facts: ['The hottest planet. Its thick air (atmosphere) traps heat.', 'It spins backward compared with most planets.', 'It is the brightest planet in our night sky, and about the same size as Earth.'],
    clues: ['I spin backward, and one spin takes longer than my whole year.', 'My thick air traps heat, making me the hottest planet.', 'I am the second planet from the Sun.'] },
  { id: 'earth', name: 'Earth', type: 'Rocky', diameter: 12756, distance: 149.6, spin: '24 hours', spinH: 24, year: 365, yearText: '365 days', temp: 15, moons: '1 moon', moonCount: 1,
    look: 'blue', facts: ['The only planet known to have life.', 'About 71% of its surface is covered by water.', 'Its one Moon causes most of the ocean tides.'],
    clues: ['About 71% of my surface is covered by water.', 'My one moon causes most of the ocean tides.', 'I am the only planet known to have life.'] },
  { id: 'mars', name: 'Mars', type: 'Rocky', diameter: 6792, distance: 227.9, spin: 'about 24½ hours', spinH: 24.6, year: 687, yearText: '687 Earth days', temp: -65, moons: '2 moons (Phobos and Deimos)', moonCount: 2,
    look: 'red', facts: ['Rusty dust makes it look red.', 'It has the biggest volcano in the solar system, Olympus Mons.', 'Robot rovers explore its surface.'],
    clues: ['I have the biggest volcano in the solar system, Olympus Mons.', 'I have two small moons, Phobos and Deimos.', 'Rusty dust makes me look red.'] },
  { id: 'jupiter', name: 'Jupiter', type: 'Gas giant', diameter: 142984, distance: 778.5, spin: 'about 10 hours', spinH: 9.9, year: 4333, yearText: 'about 12 Earth years', temp: -110, moons: 'More than 90 moons', moonCount: 95,
    look: 'jupiter', facts: ['The largest planet. More than 1,000 Earths could fit inside it.', 'Its Great Red Spot is a storm bigger than Earth.', 'It has the shortest day of any planet.'],
    clues: ['A day here lasts only about 10 hours, the shortest of any planet.', 'My Great Red Spot is a storm bigger than Earth.', 'I am the largest planet.'] },
  { id: 'saturn', name: 'Saturn', type: 'Gas giant', diameter: 120536, distance: 1432, spin: 'about 11 hours', spinH: 10.7, year: 10759, yearText: 'about 29 Earth years', temp: -140, moons: 'More than 250 moons', moonCount: 274,
    look: 'saturn', facts: ['Its huge, bright rings are made of ice and rock.', 'It is so light for its size that it would float in a giant bathtub.', 'It is the second largest planet.'],
    clues: ['I am so light for my size that I would float in a giant bathtub.', 'I am the sixth planet from the Sun.', 'My huge, bright rings are made of ice and rock.'] },
  { id: 'uranus', name: 'Uranus', type: 'Ice giant', diameter: 51118, distance: 2867, spin: 'about 17 hours', spinH: 17.2, year: 30687, yearText: 'about 84 Earth years', temp: -195, moons: 'More than 25 moons', moonCount: 29,
    look: 'uranus', facts: ['It spins on its side, like a rolling ball.', 'Methane gas makes it look blue-green.', 'It was the first planet found with a telescope.'],
    clues: ['I was the first planet found with a telescope.', 'Methane gas makes me look blue-green.', 'I spin on my side, like a rolling ball.'] },
  { id: 'neptune', name: 'Neptune', type: 'Ice giant', diameter: 49528, distance: 4515, spin: 'about 16 hours', spinH: 16.1, year: 60190, yearText: 'about 165 Earth years', temp: -200, moons: '16 moons', moonCount: 16,
    look: 'neptune', facts: ['The farthest planet from the Sun.', 'It has the fastest winds in the solar system.', 'Scientists used math to predict where it was, then found it with a telescope.'],
    clues: ['Scientists used math to work out where I was before I was discovered.', 'I have the fastest winds in the solar system.', 'I am the eighth planet, the farthest from the Sun.'] }
];

const SOLAR = [
  ['The Sun', 'A star at the center of our solar system. All eight planets travel around it.'],
  ['Inner planets', 'Mercury, Venus, Earth, and Mars are small and rocky.'],
  ['Asteroid belt', 'A ring of rocky asteroids between Mars and Jupiter.'],
  ['Outer planets', 'Jupiter and Saturn are gas giants. Uranus and Neptune are ice giants.'],
  ['Pluto', 'Called a planet until 2006. Now it is a dwarf planet.'],
  ['Remember the order', 'My Very Educated Mother Just Served Us Nachos: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.']
];

/* Quiz questions written by hand; more are made from the planet data in planets.js. */
const PQUIZ = [
  { q: 'Which planet is closest to the Sun?', a: 'Mercury', wrong: ['Venus', 'Earth', 'Mars'] },
  { q: 'Which planet is the hottest?', a: 'Venus', wrong: ['Mercury', 'Mars', 'Jupiter'], why: 'Venus is the hottest. Its thick air (atmosphere) traps heat, so it is even hotter than Mercury.' },
  { q: 'Which planet is the largest?', a: 'Jupiter', wrong: ['Saturn', 'Neptune', 'Earth'] },
  { q: 'Which planet is known for its bright rings?', a: 'Saturn', wrong: ['Mars', 'Venus', 'Mercury'] },
  { q: 'Why does Mars look red?', a: 'Rusty dust covers it', wrong: ['It is very hot', 'It is made of fire', 'It has red oceans'] },
  { q: 'Which planet spins on its side?', a: 'Uranus', wrong: ['Neptune', 'Saturn', 'Earth'] },
  { q: 'What is between Mars and Jupiter?', a: 'The asteroid belt', wrong: ['The Sun', 'Pluto', 'Saturn\'s rings'] },
  { q: 'What is Pluto called now?', a: 'A dwarf planet', wrong: ['The ninth planet', 'A star', 'A moon of Neptune'] },
  { q: 'Which two planets are ice giants?', a: 'Uranus and Neptune', wrong: ['Jupiter and Saturn', 'Mars and Venus', 'Mercury and Mars'] },
  { q: 'Which two planets are gas giants?', a: 'Jupiter and Saturn', wrong: ['Uranus and Neptune', 'Earth and Mars', 'Venus and Mercury'] },
  { q: 'Which planet has the Great Red Spot?', a: 'Jupiter', wrong: ['Mars', 'Saturn', 'Neptune'] },
  { q: 'What is the Sun?', a: 'A star', wrong: ['A planet', 'A moon', 'An asteroid'] },
  { q: 'Which planet is the farthest from the Sun?', a: 'Neptune', wrong: ['Uranus', 'Saturn', 'Pluto'], why: 'Neptune is the farthest planet. Pluto is farther, but it is a dwarf planet, not a planet.' },
  { q: 'Which planets have no moons?', a: 'Mercury and Venus', wrong: ['Mars and Earth', 'Uranus and Neptune', 'Earth and Venus'] },
  { q: 'What are Saturn\'s rings made of?', a: 'Ice and rock', wrong: ['Fire', 'Gold', 'Water vapor clouds'] },
  { q: 'Which planet has the biggest volcano in the solar system?', a: 'Mars', wrong: ['Venus', 'Earth', 'Mercury'] }
];
