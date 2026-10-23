/* The Periodic Table: content.
   One line per element: number, symbol, name, category, group, period (group is - for lanthanides and actinides).
   US spellings (Aluminum, Cesium, Sulfur). Categories follow common school charts; elements 109–118 are "unknown":
   only a few atoms have ever been made, so their properties are not known for sure. */
const ELEMENT_LINES = `
1 H Hydrogen nm 1 1|2 He Helium ng 18 1|3 Li Lithium am 1 2|4 Be Beryllium ae 2 2|5 B Boron ml 13 2|6 C Carbon nm 14 2|7 N Nitrogen nm 15 2|8 O Oxygen nm 16 2
9 F Fluorine hal 17 2|10 Ne Neon ng 18 2|11 Na Sodium am 1 3|12 Mg Magnesium ae 2 3|13 Al Aluminum pt 13 3|14 Si Silicon ml 14 3|15 P Phosphorus nm 15 3|16 S Sulfur nm 16 3
17 Cl Chlorine hal 17 3|18 Ar Argon ng 18 3|19 K Potassium am 1 4|20 Ca Calcium ae 2 4|21 Sc Scandium tm 3 4|22 Ti Titanium tm 4 4|23 V Vanadium tm 5 4|24 Cr Chromium tm 6 4
25 Mn Manganese tm 7 4|26 Fe Iron tm 8 4|27 Co Cobalt tm 9 4|28 Ni Nickel tm 10 4|29 Cu Copper tm 11 4|30 Zn Zinc tm 12 4|31 Ga Gallium pt 13 4|32 Ge Germanium ml 14 4
33 As Arsenic ml 15 4|34 Se Selenium nm 16 4|35 Br Bromine hal 17 4|36 Kr Krypton ng 18 4|37 Rb Rubidium am 1 5|38 Sr Strontium ae 2 5|39 Y Yttrium tm 3 5|40 Zr Zirconium tm 4 5
41 Nb Niobium tm 5 5|42 Mo Molybdenum tm 6 5|43 Tc Technetium tm 7 5|44 Ru Ruthenium tm 8 5|45 Rh Rhodium tm 9 5|46 Pd Palladium tm 10 5|47 Ag Silver tm 11 5|48 Cd Cadmium tm 12 5
49 In Indium pt 13 5|50 Sn Tin pt 14 5|51 Sb Antimony ml 15 5|52 Te Tellurium ml 16 5|53 I Iodine hal 17 5|54 Xe Xenon ng 18 5|55 Cs Cesium am 1 6|56 Ba Barium ae 2 6
57 La Lanthanum la - 6|58 Ce Cerium la - 6|59 Pr Praseodymium la - 6|60 Nd Neodymium la - 6|61 Pm Promethium la - 6|62 Sm Samarium la - 6|63 Eu Europium la - 6|64 Gd Gadolinium la - 6
65 Tb Terbium la - 6|66 Dy Dysprosium la - 6|67 Ho Holmium la - 6|68 Er Erbium la - 6|69 Tm Thulium la - 6|70 Yb Ytterbium la - 6|71 Lu Lutetium la - 6|72 Hf Hafnium tm 4 6
73 Ta Tantalum tm 5 6|74 W Tungsten tm 6 6|75 Re Rhenium tm 7 6|76 Os Osmium tm 8 6|77 Ir Iridium tm 9 6|78 Pt Platinum tm 10 6|79 Au Gold tm 11 6|80 Hg Mercury tm 12 6
81 Tl Thallium pt 13 6|82 Pb Lead pt 14 6|83 Bi Bismuth pt 15 6|84 Po Polonium pt 16 6|85 At Astatine hal 17 6|86 Rn Radon ng 18 6|87 Fr Francium am 1 7|88 Ra Radium ae 2 7
89 Ac Actinium ac - 7|90 Th Thorium ac - 7|91 Pa Protactinium ac - 7|92 U Uranium ac - 7|93 Np Neptunium ac - 7|94 Pu Plutonium ac - 7|95 Am Americium ac - 7|96 Cm Curium ac - 7
97 Bk Berkelium ac - 7|98 Cf Californium ac - 7|99 Es Einsteinium ac - 7|100 Fm Fermium ac - 7|101 Md Mendelevium ac - 7|102 No Nobelium ac - 7|103 Lr Lawrencium ac - 7|104 Rf Rutherfordium tm 4 7
105 Db Dubnium tm 5 7|106 Sg Seaborgium tm 6 7|107 Bh Bohrium tm 7 7|108 Hs Hassium tm 8 7|109 Mt Meitnerium un 9 7|110 Ds Darmstadtium un 10 7|111 Rg Roentgenium un 11 7|112 Cn Copernicium un 12 7
113 Nh Nihonium un 13 7|114 Fl Flerovium un 14 7|115 Mc Moscovium un 15 7|116 Lv Livermorium un 16 7|117 Ts Tennessine un 17 7|118 Og Oganesson un 18 7`;

const CATS = {
  am: { name: 'Alkali metal', metal: 'Metal', color: '#f4a582', ink: '#6b2a0f' },
  ae: { name: 'Alkaline earth metal', metal: 'Metal', color: '#f7cf86', ink: '#5e4300' },
  tm: { name: 'Transition metal', metal: 'Metal', color: '#f2b8c6', ink: '#6e1d36' },
  pt: { name: 'Post-transition metal', metal: 'Metal', color: '#c9c3e6', ink: '#3b3178' },
  ml: { name: 'Metalloid', metal: 'Metalloid', color: '#b9dfa6', ink: '#2c5a17' },
  nm: { name: 'Nonmetal', metal: 'Nonmetal', color: '#9fd8d3', ink: '#0f5751' },
  hal: { name: 'Halogen', metal: 'Nonmetal', color: '#a8cbef', ink: '#1d3f78' },
  ng: { name: 'Noble gas', metal: 'Nonmetal', color: '#d3c0ea', ink: '#4b2f7a' },
  la: { name: 'Lanthanide', metal: 'Metal', color: '#efd9a8', ink: '#5e4a12' },
  ac: { name: 'Actinide', metal: 'Metal', color: '#e8c4a8', ink: '#5e3112' },
  un: { name: 'Unknown properties', metal: 'Unknown', color: '#dcd8d0', ink: '#4a4740' }
};

/* State at room temperature (about 20°C). Everything else known is a solid. */
const GASES = ['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn'];
const LIQUIDS = ['Br', 'Hg'];

const ELEMENTS = ELEMENT_LINES.trim().split(/[|\n]/).map(line => {
  const [n, sym, name, cat, group, period] = line.trim().split(' ');
  return { n: +n, sym, name, cat, group: group === '-' ? null : +group, period: +period,
    state: cat === 'un' ? 'Unknown' : GASES.includes(sym) ? 'Gas' : LIQUIDS.includes(sym) ? 'Liquid' : 'Solid' };
});

/* Short facts for well-known elements. */
const FACTS = {
  H: 'The lightest element, and the most common in the universe. Stars are mostly hydrogen.',
  He: 'Lighter than air, so it makes balloons float.',
  Li: 'A soft metal used in rechargeable batteries.',
  C: 'Found in every living thing. Diamonds and pencil "lead" are both made of carbon.',
  N: 'Makes up about 78% of the air we breathe.',
  O: 'Makes up about 21% of the air. People and animals need it to live.',
  F: 'A very reactive gas. Fluoride, made from fluorine, is added to toothpaste to help keep teeth strong.',
  Ne: 'Glows red-orange in neon signs.',
  Na: 'One of the two elements in table salt (sodium chloride).',
  Mg: 'Burns with a very bright white light.',
  Al: 'A light metal used for cans and foil.',
  Si: 'Found in sand, and used to make computer chips.',
  P: 'Used to make matches. It is in the strip on the box that you strike them on.',
  S: 'A yellow solid. Many stinky smells, like rotten eggs, come from things that contain sulfur.',
  Cl: 'Used to keep swimming pools clean. It is the other element in table salt.',
  Ar: 'Used inside some light bulbs.',
  K: 'Bananas have lots of it. Your body needs it.',
  Ca: 'Makes bones and teeth strong. Milk has lots of it.',
  Fe: 'Used to make steel. Your blood needs iron to carry oxygen around your body.',
  Cu: 'A reddish metal used in electric wires. Pennies are coated with it.',
  Zn: 'Used to coat steel so it does not rust.',
  Ag: 'A shiny metal used in jewelry and coins. It conducts electricity best of all metals.',
  Sn: 'Used to coat steel cans. Bronze is copper mixed with tin.',
  I: 'Added to table salt to keep people healthy.',
  W: 'Has the highest melting point of any metal.',
  Pt: 'A rare, valuable metal used in jewelry.',
  Au: 'A soft, shiny, valuable metal that never rusts.',
  Hg: 'A metal that is liquid at room temperature.',
  Pb: 'A heavy metal. It was once used in paint and pipes, but it is poisonous.',
  Br: 'One of only two elements that are liquid at room temperature.',
  U: 'Used as fuel in nuclear power plants.',
  Rn: 'A gas that is radioactive.',
  Og: 'The heaviest element ever made. Only a few atoms have existed.'
};

const IDEAS = [
  ['Element', 'A pure substance made of only one kind of atom.'],
  ['Atomic number', 'The number of protons in each atom of the element. No two elements share one.'],
  ['Symbol', 'A short code of one or two letters. The first letter is always a capital: Fe, not FE.'],
  ['Periods', 'The rows. There are 7.'],
  ['Groups', 'The columns. There are 18. Elements in a group act alike.'],
  ['Metals and nonmetals', 'Metals are on the left and middle. Nonmetals are on the right, plus hydrogen at the top left. Metalloids sit on the staircase between them.']
];

/* Hand-written questions about how the table works. More are made from the element data in pt.js. */
const PTQUIZ = [
  { q: 'What does the atomic number tell you?', a: 'The number of protons in an atom', wrong: ['How heavy the element is in grams', 'The year it was found', 'How many uses it has'] },
  { q: 'What are the rows of the periodic table called?', a: 'Periods', wrong: ['Groups', 'Families of metals', 'Columns'] },
  { q: 'What are the columns of the periodic table called?', a: 'Groups', wrong: ['Periods', 'Rows', 'Atoms'] },
  { q: 'Where are most metals on the periodic table?', a: 'On the left and in the middle', wrong: ['On the far right', 'Only in the top row', 'Only at the bottom'] },
  { q: 'Which group are the noble gases in?', a: 'Group 18, the last column', wrong: ['Group 1, the first column', 'Group 2', 'Group 10'] },
  { q: 'Which two elements are liquids at room temperature?', a: 'Mercury and bromine', wrong: ['Water and oxygen', 'Iron and gold', 'Helium and neon'] },
  { q: 'Which element makes up most of the air?', a: 'Nitrogen', wrong: ['Oxygen', 'Carbon', 'Hydrogen'] },
  { q: 'Which element is in every living thing?', a: 'Carbon', wrong: ['Gold', 'Neon', 'Helium'] },
  { q: 'What is an element?', a: 'A pure substance made of only one kind of atom', wrong: ['Any mixture of two things', 'A kind of rock', 'A type of energy'] },
  { q: 'Table salt is made of which two elements?', a: 'Sodium and chlorine', wrong: ['Sugar and water', 'Iron and oxygen', 'Carbon and helium'] }
];
