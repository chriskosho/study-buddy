/* Weather: content.
   SOURCES: the student's Unit 3 notes (Section 1 L1 to L3, the weather flip-book, Section 2 L4 and L5) and the Unit 3 Practice Test (25 questions, with the student's answers).
   The notes keep the teacher's wording (spelling fixed only; faint pencil words on the notes are read from the sentence). The practice test's answer key was not in the photos,
   so every test answer was checked against the notes and ordinary science: where the student's mark differed from the correct answer (question 9, "different"; question 14,
   both causes of opposite seasons), the correct answer is used. Nothing else is added. */

/* ---- the notes, as the study guide shows them ---- */
const GUIDE = [
  { id: 'l1', label: 'Earth and the atmosphere', art: 'earth', rows: [
    ['Weather', 'The state of the atmosphere at a certain place and time.'],
    ['Atmosphere', 'The layer of gases that surround the earth.'],
    ['Equator', 'An imaginary line that divides the earth in the middle.'],
    ['Altitude', 'How high something is in the atmosphere.'],
    ['Northern Hemisphere', 'The part of the earth above the equator.'],
    ['Southern Hemisphere', 'The part of the earth below the equator.'],
    ['Latitude', 'How far something is from the equator.']
  ] },
  { id: 'l2', label: 'Clouds and water', art: 'clouds', rows: [
    ['Cirrus', 'Feathery, icy clouds that form high in the sky where air is cold.'],
    ['Cumulus', 'Fluffy, white clouds that float lower in the sky.'],
    ['Stratus', 'Low, gray clouds that may or may not bring rain.'],
    ['Nimbus', 'Rain-bearing cloud.'],
    ['Water vapor', 'Water that is in the gas state.'],
    ['Precipitation', 'Water that falls from clouds to the earth’s surface.']
  ] },
  { id: 'l3', label: 'The water cycle', art: 'cycle', rows: [
    ['Evaporation', 'The act of liquid turning into a gas.'],
    ['Condensation', 'The act of gas turning into a liquid.'],
    ['Cycle', 'A series of events that repeats.'],
    ['Water cycle', 'The movement of water on the earth between the solid, liquid, and gas states.']
  ] },
  { id: 'l45', label: 'Forecasting', art: 'tools', rows: [
    ['Meteorologist', 'A scientist who studies weather.'],
    ['Forecast', 'To predict a weather event.'],
    ['Wind vane', 'A tool for showing wind direction.'],
    ['Anemometer', 'A tool for measuring wind speed.']
  ] }
];
/* the flip-book: six kinds of weather, each with a picture (drawn for this module) */
const KINDS = ['Sunny', 'Partly cloudy', 'Cloudy', 'Rainy', 'Snowy', 'Thunderstorm'];
/* from the practice test */
const TEST_FACTS = [
  ['Weather conditions', 'The THREE main weather conditions are precipitation, temperature, and wind.'],
  ['Wind', 'Moving air is called wind.'],
  ['Rain gauge', 'A tool for measuring rainfall is called a rain gauge.'],
  ['The sun', 'Many weather patterns are caused by the sun heating the water and land differently.'],
  ['Around the world', 'Weather is different all over the world.'],
  ['Warmer and colder', 'Places near the equator have warmer weather. The weather is usually colder at the poles.'],
  ['The United States', 'The United States is in the Northern Hemisphere.'],
  ['Opposite seasons', 'The Northern and Southern Hemispheres have opposite seasons because the earth moves around the sun and the earth is tilted. When the Southern Hemisphere is having winter, the Northern Hemisphere is having summer.'],
  ['Near the ocean', 'A city next to the ocean is likely to get more precipitation than a city far from the ocean.'],
  ['Wind vane directions', 'If the wind vane is between south and west, the wind direction is southwest.'],
  ['Line graphs', 'On a line graph, the highest point shows the day with the highest temperature.']
];

/* ---- flashcards: terms ---- */
const CARDS = GUIDE.flatMap(g => g.rows).concat([['Rain gauge', 'A tool for measuring rainfall.'], ['Wind', 'Moving air.']]);

/* ---- quiz ---- */
const D = Object.fromEntries(CARDS.map(([t, d]) => [t, d.replace(/\.$/, '')]));
const QT = { 'Atmosphere': 'What is the atmosphere?', 'Equator': 'What is the equator?', 'Altitude': 'What is altitude?', 'Latitude': 'What is latitude?', 'Northern Hemisphere': 'What is the Northern Hemisphere?', 'Southern Hemisphere': 'What is the Southern Hemisphere?', 'Cirrus': 'What are cirrus clouds?', 'Cumulus': 'What are cumulus clouds?', 'Stratus': 'What are stratus clouds?', 'Nimbus': 'What is a nimbus?', 'Water vapor': 'What is water vapor?', 'Precipitation': 'What is precipitation?', 'Evaporation': 'What is evaporation?', 'Condensation': 'What is condensation?', 'Cycle': 'What is a cycle?', 'Water cycle': 'What is the water cycle?', 'Meteorologist': 'What is a meteorologist?', 'Forecast': 'What does it mean to forecast?', 'Wind vane': 'What is a wind vane?', 'Anemometer': 'What is an anemometer?', 'Rain gauge': 'What is a rain gauge?' };
const def = (t, wrongs) => ({ q: QT[t], a: D[t], wrong: wrongs.map(w => D[w]) });
const QUIZ = [
  { q: 'What is the state of the atmosphere at a certain place and time called?', a: 'Weather', wrong: ['A forecast', 'Altitude', 'Precipitation'] },
  def('Atmosphere', ['Equator', 'Altitude', 'Precipitation']),
  def('Equator', ['Atmosphere', 'Altitude', 'Northern Hemisphere']),
  def('Altitude', ['Latitude', 'Atmosphere', 'Equator']),
  def('Latitude', ['Altitude', 'Equator', 'Southern Hemisphere']),
  def('Northern Hemisphere', ['Southern Hemisphere', 'Atmosphere', 'Equator']),
  def('Southern Hemisphere', ['Northern Hemisphere', 'Atmosphere', 'Equator']),
  def('Cirrus', ['Cumulus', 'Stratus', 'Nimbus']),
  def('Cumulus', ['Cirrus', 'Stratus', 'Nimbus']),
  def('Stratus', ['Cirrus', 'Cumulus', 'Water vapor']),
  def('Nimbus', ['Cirrus', 'Cumulus', 'Water vapor']),
  def('Water vapor', ['Precipitation', 'Evaporation', 'Cycle']),
  def('Precipitation', ['Water vapor', 'Evaporation', 'Condensation']),
  def('Evaporation', ['Condensation', 'Precipitation', 'Cycle']),
  def('Condensation', ['Evaporation', 'Precipitation', 'Cycle']),
  def('Cycle', ['Evaporation', 'Condensation', 'Water vapor']),
  def('Water cycle', ['Cycle', 'Evaporation', 'Precipitation']),
  def('Meteorologist', ['Anemometer', 'Wind vane', 'Rain gauge']),
  def('Forecast', ['Anemometer', 'Wind vane', 'Water vapor']),
  def('Wind vane', ['Anemometer', 'Rain gauge', 'Meteorologist']),
  def('Anemometer', ['Wind vane', 'Rain gauge', 'Forecast']),
  def('Rain gauge', ['Anemometer', 'Wind vane', 'Meteorologist']),
  { q: 'What is moving air called?', a: 'Wind', wrong: ['Weather', 'Precipitation', 'A forecast'] },
  { q: 'Which is one of the THREE main weather conditions?', a: 'Wind', wrong: ['Salt', 'Latitude', 'Altitude'] },
  { q: 'Many weather patterns are caused by the sun ______ the water and land differently.', a: 'Heating', wrong: ['Moving', 'Cooling', 'Freezing'] },
  { q: 'Weather is ______ all over the world.', a: 'Different', wrong: ['The same'] },
  { q: 'Which has warmer weather?', a: 'Places near the equator', wrong: ['Places near the poles'] },
  { q: 'Which hemisphere is the United States in?', a: 'Northern Hemisphere', wrong: ['Southern Hemisphere'] },
  { q: 'If the wind vane is between south and west, what is the wind direction?', a: 'Southwest', wrong: ['Northwest', 'Northeast', 'Southeast'] },
  { q: 'Which two things make the Northern and Southern Hemispheres have opposite seasons?', a: 'The earth is tilted and moves around the sun', wrong: ['The moon is tilted and moves around the earth', 'The earth is tilted and the moon moves around the earth', 'The moon is tilted and the earth moves around the sun'] },
  { q: 'When the Southern Hemisphere is having winter, the Northern Hemisphere is having ______.', a: 'Summer', wrong: ['Spring', 'Fall', 'Winter'] },
  { q: 'Which place is likely to get more precipitation?', a: 'A city next to the ocean', wrong: ['A city far from the ocean'] }
];

/* ---- Type the answer: sentences from the notes and the practice test, with the missing word ---- */
const TYPE = [
  { q: 'Weather is the state of the ________ at a certain place and time.', a: ['Atmosphere'] },
  { q: 'The atmosphere is the layer of ________ that surround the earth.', a: ['Gases', 'Gasses'] },
  { q: 'The equator is an imaginary line that divides the ________ in the middle.', a: ['Earth', 'the earth'], noTypo: true },
  { q: 'Altitude is how high something is in the ________.', a: ['Atmosphere'] },
  { q: 'The Northern Hemisphere is the part of the earth ________ the equator.', a: ['Above', 'Over'], noTypo: true },
  { q: 'The Southern Hemisphere is the part of the earth ________ the equator.', a: ['Below', 'Under', 'Beneath'], noTypo: true },
  { q: 'Latitude is how far something is from the ________.', a: ['Equator'] },
  { q: 'Feathery, icy clouds that form high in the sky where air is cold are ________ clouds.', a: ['Cirrus'] },
  { q: 'Fluffy, white clouds that float lower in the sky are ________ clouds.', a: ['Cumulus'] },
  { q: 'Low, gray clouds that may or may not bring rain are ________ clouds.', a: ['Stratus'] },
  { q: 'A rain-bearing cloud is a ________.', a: ['Nimbus'] },
  { q: 'Water that is in the gas state is water ________.', a: ['Vapor'] },
  { q: 'Water that falls from clouds to the earth’s surface, such as rain or snow, is called ________.', a: ['Precipitation'] },
  { q: 'Evaporation is the act of liquid turning into a ________.', a: ['Gas', 'Vapor', 'Water vapor'], noTypo: true },
  { q: 'Condensation is the act of ________ turning into a liquid.', a: ['Gas', 'Vapor', 'Water vapor'], noTypo: true },
  { q: 'A cycle is a series of events that ________.', a: ['Repeats', 'Repeat'] },
  { q: 'The water cycle is the movement of ________ on the earth between the solid, liquid, and gas states.', a: ['Water'], noTypo: true },
  { q: 'A meteorologist is a ________ who studies weather.', a: ['Scientist', 'Person'] },
  { q: 'To forecast is to predict a ________ event.', a: ['Weather'] },
  { q: 'A wind vane is a tool for showing ________ direction.', a: ['Wind'], noTypo: true },
  { q: 'An anemometer is a tool for measuring ________ speed.', a: ['Wind'], noTypo: true },
  { q: 'A tool for measuring rainfall is called a rain ________.', a: ['Gauge', 'Gage'] },
  { q: 'The weather is usually colder at the ________.', a: ['Poles', 'Pole'] },
  { q: 'Moving air is called ________.', a: ['Wind'], noTypo: true }
];

/* ---- Sort it ---- */
const SORTS = [
  { id: 'clouds', label: 'Kinds of clouds', buckets: ['Cirrus', 'Cumulus', 'Stratus', 'Nimbus'], items: [
    ['Feathery and icy', 'Cirrus'], ['Forms high in the sky where air is cold', 'Cirrus'],
    ['Fluffy and white', 'Cumulus'], ['White and puffy', 'Cumulus'],
    ['Low and gray', 'Stratus'], ['May or may not bring rain', 'Stratus'],
    ['Rain-bearing cloud', 'Nimbus'] ] },
  { id: 'cycle', label: 'The water cycle', buckets: ['Evaporation', 'Condensation', 'Precipitation'], items: [
    ['Liquid turning into a gas', 'Evaporation'], ['The act of liquid becoming water vapor', 'Evaporation'],
    ['Gas turning into a liquid', 'Condensation'], ['The act of water vapor becoming liquid', 'Condensation'],
    ['Water that falls from clouds to the earth’s surface', 'Precipitation'] ] },
  { id: 'tools', label: 'Weather tools', buckets: ['Wind vane', 'Anemometer', 'Rain gauge'], items: [
    ['Shows wind direction', 'Wind vane'], ['Measures wind speed', 'Anemometer'], ['Measures rainfall', 'Rain gauge'],
    ['Between south and west means southwest', 'Wind vane'] ] },
  { id: 'hemi', label: 'Hemispheres', buckets: ['Northern Hemisphere', 'Southern Hemisphere'], items: [
    ['The part of the earth above the equator', 'Northern Hemisphere'], ['The United States', 'Northern Hemisphere'], ['The North Pole', 'Northern Hemisphere'],
    ['The part of the earth below the equator', 'Southern Hemisphere'], ['The South Pole', 'Southern Hemisphere'] ] }
];

/* ---- Explain it ---- */
const EXPLAIN = [
  { q: 'What is weather, and what are the THREE main weather conditions?', teacher: true,
    model: 'Weather is the state of the atmosphere at a certain place and time. The three main weather conditions are precipitation, temperature, and wind.',
    ideas: [
      { label: 'Weather is the state of the atmosphere', all: [['atmosphere']] },
      { label: 'At a certain place and time', all: [['place'], ['time']] },
      { label: 'Precipitation, temperature, and wind', all: [['precipitation'], ['temperature', 'temp'], ['wind']] }
    ] },
  { q: 'Explain the water cycle.',
    model: 'The water cycle is the movement of water on the earth between the solid, liquid, and gas states. Water evaporates, turning from a liquid into a gas. Then it condenses, turning from a gas into a liquid in clouds. Then it falls to the earth as precipitation.',
    ideas: [
      { label: 'Water moves between solid, liquid, and gas', all: [['solid'], ['liquid'], ['gas']] },
      { label: 'Evaporation: liquid turns into a gas', all: [['evaporat']] },
      { label: 'Condensation: gas turns into a liquid', all: [['condens']] },
      { label: 'Precipitation falls from clouds', all: [['precipitation', 'rain', 'snow']] }
    ] },
  { q: 'Why do the Northern Hemisphere and the Southern Hemisphere have opposite seasons?',
    model: 'The earth moves around the sun and the earth is tilted, so when the Southern Hemisphere is having winter, the Northern Hemisphere is having summer.',
    ideas: [
      { label: 'The earth moves around the sun', all: [['around the sun', 'around sun', 'round the sun', 'orbit', 'revolv', 'circl']] },
      { label: 'The earth is tilted', all: [['tilt']] },
      { label: 'Winter in one is summer in the other', all: [['winter'], ['summer']] }
    ] },
  { q: 'Why is weather different all over the world?',
    model: 'Many weather patterns are caused by the sun heating the water and land differently. Places near the equator have warmer weather, and the weather is usually colder at the poles.',
    ideas: [
      { label: 'The sun heats water and land differently', all: [['heat'], ['sun']] },
      { label: 'Places near the equator are warmer', all: [['equator'], ['warm', 'hot']] },
      { label: 'The poles are colder', all: [['pole'], ['cold', 'cool']] }
    ] },
  { q: 'What does a meteorologist do, and which tools help show the weather?',
    model: 'A meteorologist is a scientist who studies weather and makes a forecast, which means predicting a weather event. A wind vane shows wind direction, an anemometer measures wind speed, and a rain gauge measures rainfall.',
    ideas: [
      { label: 'A scientist who studies weather and forecasts', all: [['scientist'], ['forecast', 'predict']] },
      { label: 'A wind vane shows wind direction', all: [['vane'], ['direction']] },
      { label: 'An anemometer measures wind speed', all: [['anemometer'], ['speed']] },
      { label: 'A rain gauge measures rainfall', all: [['gauge'], ['rain']] }
    ] },
  { q: 'Describe the four kinds of clouds.',
    model: 'Cirrus clouds are feathery, icy clouds that form high in the sky where air is cold. Cumulus clouds are fluffy, white clouds that float lower in the sky. Stratus clouds are low, gray clouds that may or may not bring rain. A nimbus is a rain-bearing cloud.',
    ideas: [
      { label: 'Cirrus: feathery and icy, high in the sky', all: [['cirrus'], ['high', 'feather', 'icy', 'ice']] },
      { label: 'Cumulus: fluffy and white', all: [['cumulus'], ['fluffy', 'white']] },
      { label: 'Stratus: low and gray', all: [['stratus'], ['gray', 'grey', 'low']] },
      { label: 'Nimbus: rain-bearing', all: [['nimbus'], ['rain']] }
    ] }
];

/* ---- diagrams: the labelled parts (letters follow the practice test) ---- */
const EARTH = [['A', 'North Pole'], ['B', 'Northern Hemisphere'], ['C', 'equator'], ['D', 'Southern Hemisphere'], ['E', 'South Pole']];
const CYCLE = [['A', 'evaporation'], ['B', 'condensation'], ['C', 'precipitation']];
