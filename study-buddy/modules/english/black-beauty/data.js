/* Black Beauty: content.
   Source: the novel "Black Beauty" by Anna Sewell (1877). It has 49 chapters in four parts:
   Part 1 chapters 1–21, Part 2 chapters 22–31, Part 3 chapters 32–45, Part 4 chapters 46–49.
   The module is organized by Beauty's homes and the four parts, so it works with any edition (chapter numbers
   are not used in questions). Names are spelled as in the original text. */

const BOOK = [
  ['Title', 'Black Beauty. The original title page also called it "the autobiography of a horse."'],
  ['Author', 'Anna Sewell, an English writer. It was her only book.'],
  ['Published', '1877, in England. Anna Sewell died a few months later, in 1878.'],
  ['Narrator', 'Black Beauty tells his own story, so the book is written in the first person ("I").'],
  ['Setting', 'England in the 1800s, when horses pulled carriages, carts, and cabs. It moves from the country to the city of London.'],
  ['Why it was written', 'Anna Sewell wanted people to understand how horses feel, and to treat them with kindness.'],
  ['What Beauty looks like', 'A handsome black horse with one white foot and a white star on his forehead.']
];

const HORSES = [
  ['Black Beauty', 'The narrator. A gentle, hard-working black horse. He has many owners and many names in his life.'],
  ['Duchess', 'Beauty\'s mother. She tells him to work with a good will, lift his feet well when he trots, and never bite or kick, even in play.'],
  ['Rob Roy', 'Beauty\'s older brother. Beauty sees him fall in a hunt. His leg is broken, and he has to be shot.'],
  ['Ginger', 'A chestnut mare at Birtwick and Earlshall. She bites and snaps because people treated her roughly when she was young. She becomes Beauty\'s close friend.'],
  ['Merrylegs', 'A small gray pony at Birtwick who carries the Gordon children. Cheerful, and good at teaching rough boys a lesson.'],
  ['Captain', 'Jerry Barker\'s other cab horse in London. He was a cavalry horse in the Crimean War.'],
  ['Hotspur', 'The young horse who takes Captain\'s place at Jerry\'s.']
];

const PEOPLE = [
  ['Farmer Grey', 'Beauty\'s first master. He raises Beauty kindly and trains (breaks in) him gently.'],
  ['Squire Gordon', 'Owner of Birtwick Park. A kind master who speaks up for animals.'],
  ['Mrs. Gordon', 'The Squire\'s wife. She names him Black Beauty. Her illness makes the family move away.'],
  ['John Manly', 'The coachman at Birtwick. Wise, kind, and patient with horses.'],
  ['James Howard', 'The stable boy at Birtwick. He saves Beauty and Ginger from a stable fire.'],
  ['Joe Green', 'The young boy who takes James\'s place. His mistake makes Beauty very sick, but he learns, and he finds Beauty again at the end.'],
  ['York', 'The coachman at Earlshall. He uses the bearing rein because the lady of the house wants it.'],
  ['Reuben Smith', 'A skilled groom at Earlshall who drinks. He rides Beauty while drunk, and Beauty falls and breaks his knees.'],
  ['Lady Anne', 'The Earl\'s daughter, who rides Beauty at Earlshall.'],
  ['Jerry Barker', 'A kind London cab driver who buys Beauty and calls him Jack. He will not work on Sundays.'],
  ['Polly, Harry, and Dolly', 'Jerry\'s wife, son, and daughter. The whole family is kind to the horses.'],
  ['Nicholas Skinner', 'A cruel cab owner in London. He works his horses until they drop.'],
  ['Farmer Thoroughgood', 'A kind farmer who buys the worn-out Beauty and helps him get well.'],
  ['Willie', 'Farmer Thoroughgood\'s grandson. He cares for Beauty and helps him find a good last home.']
];

/* Beauty's homes, in the order of the story. */
const HOMES = [
  { part: 'Part 1', place: 'Farmer Grey\'s farm', name: 'Darkie', what: 'Beauty is born in a meadow and grows up with his mother, Duchess. Farmer Grey trains him gently.' },
  { part: 'Part 1', place: 'Birtwick Park', name: 'Black Beauty', what: 'His happiest home, with Squire Gordon, John Manly, Ginger, and Merrylegs. It ends when Mrs. Gordon gets sick and the family moves away.' },
  { part: 'Part 2', place: 'Earlshall Park', name: 'Black Auster', what: 'The lady makes the horses wear tight bearing reins. Reuben Smith rides Beauty drunk, and Beauty falls and breaks his knees.' },
  { part: 'Part 2', place: 'A livery stable in Bath, and Mr. Barry', name: '', what: 'Beauty is hired out to people who drive badly. Mr. Barry buys him, but one groom steals his oats and another lets his stall get dirty.' },
  { part: 'Part 3', place: 'London, with Jerry Barker', name: 'Jack', what: 'Beauty pulls a cab for kind Jerry and his family. He meets Ginger again. Jerry gets sick and has to stop driving.' },
  { part: 'Part 4', place: 'London: a corn dealer, then Nicholas Skinner', name: '', what: 'Beauty pulls heavy loads, then works for cruel Skinner until he falls down in the street.' },
  { part: 'Part 4', place: 'Farmer Thoroughgood\'s farm', name: '', what: 'Farmer Thoroughgood and Willie rest and feed Beauty until he is well.' },
  { part: 'Part 4', place: 'His last home', name: 'Black Beauty', what: 'Three kind ladies buy him. Their groom is Joe Green, who knows him by his white star and white foot.' }
];

const IDEAS = [
  ['Kindness to animals', 'Good masters like Farmer Grey, John Manly, and Jerry Barker make horses happy and willing. Cruel and careless people make them suffer.'],
  ['Horses have feelings', 'Because Beauty tells the story, readers feel what a horse feels: pain, fear, friendship, and being tired.'],
  ['The bearing rein', 'A strap that pulled a horse\'s head up high to look fashionable. It hurt and made pulling hard. The book helped people speak out against it.'],
  ['Ignorance can hurt', 'Joe Green did not mean to harm Beauty. John says ignorance can do as much harm as wickedness.'],
  ['Drinking', 'Reuben Smith was good at his job, but drinking made him careless, and it cost him his life and Beauty his good looks.'],
  ['Speaking up', 'Squire Gordon, John, and Joe speak up when they see people being cruel to animals.']
];

const WORDS = [
  ['Autobiography', 'A story of someone\'s life, written by that person.'],
  ['Narrator', 'The one who tells the story.'],
  ['Bearing rein', 'A strap that held a horse\'s head up high. Also called a check rein.'],
  ['Groom', 'A person who takes care of horses.'],
  ['Coachman', 'A person who drives a carriage.'],
  ['Ostler', 'A person who looks after horses at an inn.'],
  ['Farrier', 'A person who puts shoes on horses.'],
  ['Blinkers', 'Flaps beside a horse\'s eyes so it can only see ahead.'],
  ['Bit', 'The metal piece in a horse\'s mouth, joined to the reins.'],
  ['Breaking in', 'Training a young horse to wear a saddle and harness and to carry or pull people.'],
  ['Cab', 'A carriage you pay to ride in, like a taxi.'],
  ['Mare', 'A female horse.'],
  ['Colt', 'A young male horse.'],
  ['Foal', 'A baby horse.']
];

/* Quiz: one right answer and three wrong ones. */
const QUIZ = [
  { q: 'Who wrote Black Beauty?', a: 'Anna Sewell', wrong: ['Charles Dickens', 'Laura Ingalls Wilder', 'Beatrix Potter'] },
  { q: 'Who tells the story of Black Beauty?', a: 'Black Beauty himself', wrong: ['Ginger', 'John Manly', 'Merrylegs'], why: 'Beauty tells his own story, so it is written as "I". That makes it an autobiography of a horse.' },
  { q: 'What is the name of Black Beauty\'s mother?', a: 'Duchess', wrong: ['Ginger', 'Lizzie', 'Polly'] },
  { q: 'What does Beauty look like?', a: 'Black, with one white foot and a white star on his forehead', wrong: ['All black with no white at all', 'Chestnut with a black mane', 'Gray with black spots'] },
  { q: 'Who named him Black Beauty?', a: 'Mrs. Gordon', wrong: ['Farmer Grey', 'Jerry Barker', 'Willie'] },
  { q: 'Why does Ginger bite and snap?', a: 'People treated her roughly when she was young', wrong: ['She was born mean', 'She was always hungry', 'She did not like Beauty'] },
  { q: 'What does the bearing rein do to a horse?', a: 'Holds its head up high, which hurts', wrong: ['Keeps flies off its face', 'Helps it see in the dark', 'Keeps its feet warm'] },
  { q: 'On the stormy night, why does Beauty refuse to cross the bridge?', a: 'He senses that the bridge is broken', wrong: ['He is afraid of the rain', 'He is too tired', 'He wants to go home to eat'] },
  { q: 'Who saves Beauty and Ginger from the stable fire?', a: 'James Howard', wrong: ['Joe Green', 'Reuben Smith', 'Farmer Grey'] },
  { q: 'Why does Beauty get very sick after the ride to fetch the doctor?', a: 'Joe Green gives him cold water and no blanket', wrong: ['He eats bad hay', 'He falls in the river', 'He catches a cold from Ginger'], why: 'Beauty was hot and sweaty. Joe did not know to cover him and give him warm water, and John says ignorance can do as much harm as wickedness.' },
  { q: 'Why do the Gordons leave Birtwick Park?', a: 'Mrs. Gordon is sick and must move to a warmer country', wrong: ['They run out of money', 'The house burns down', 'They move to London'] },
  { q: 'What happens when Reuben Smith rides Beauty while drunk?', a: 'Beauty falls and breaks his knees', wrong: ['Beauty wins a race', 'They get lost in the woods', 'Beauty runs away to Birtwick'] },
  { q: 'Why can Beauty no longer work for rich families after his fall?', a: 'The scars on his knees spoil his looks', wrong: ['He becomes too old', 'He forgets how to pull a carriage', 'He bites people'] },
  { q: 'What does Jerry Barker call Beauty?', a: 'Jack', wrong: ['Darkie', 'Black Auster', 'Captain'] },
  { q: 'Why will Jerry Barker not drive his cab on Sundays?', a: 'He believes Sunday should be a day of rest for people and horses', wrong: ['There are no riders on Sundays', 'The law says cabs cannot drive', 'His horses are sold on Sundays'] },
  { q: 'What happens to Ginger at the end of her life?', a: 'She is worn out by cab work, and Beauty believes she died', wrong: ['She goes to live with Merrylegs', 'She wins a prize at the fair', 'She goes back to Birtwick'], why: 'Ginger is worn out from cab work. Soon after, Beauty sees a dead chestnut horse in a cart and believes it is Ginger.' },
  { q: 'Who works Beauty so hard that he falls down in the street?', a: 'Nicholas Skinner', wrong: ['Jerry Barker', 'Farmer Thoroughgood', 'John Manly'] },
  { q: 'Who helps Beauty get well after he collapses?', a: 'Farmer Thoroughgood and his grandson Willie', wrong: ['Jerry and Polly Barker', 'York and Reuben Smith', 'Squire Gordon'] },
  { q: 'Who recognizes Beauty at his last home?', a: 'Joe Green', wrong: ['John Manly', 'James Howard', 'Jerry Barker'] },
  { q: 'What was Captain before he pulled a cab?', a: 'A cavalry horse in a war', wrong: ['A racehorse', 'A plow horse', 'A circus horse'] },
  { q: 'What job does John Manly have at Birtwick?', a: 'Coachman', wrong: ['Stable boy', 'Farrier', 'Cab driver'] },
  { q: 'Which pony carries the Gordon children?', a: 'Merrylegs', wrong: ['Ginger', 'Hotspur', 'Rob Roy'] },
  { q: 'What is an autobiography?', a: 'A life story told by the one who lived it', wrong: ['A story about cars', 'A book of poems', 'A made-up fairy tale about animals'] },
  { q: 'Where does Beauty live with Jerry Barker?', a: 'London', wrong: ['Birtwick Park', 'Earlshall Park', 'Farmer Grey\'s farm'] }
];

/* Sort it. Each item is [text, bucket]. */
const SORTS = [
  { id: 'home', label: 'Where they belong', buckets: ['Farmer Grey\'s farm', 'Birtwick Park', 'Earlshall Park', 'London'], perBucket: 2, items: [
    ['Duchess', 'Farmer Grey\'s farm'], ['Farmer Grey', 'Farmer Grey\'s farm'],
    ['Mrs. Gordon', 'Birtwick Park'], ['John Manly', 'Birtwick Park'], ['James Howard', 'Birtwick Park'], ['Joe Green', 'Birtwick Park'], ['Merrylegs', 'Birtwick Park'], ['Ginger', 'Birtwick Park'],
    ['York', 'Earlshall Park'], ['Reuben Smith', 'Earlshall Park'], ['Lady Anne', 'Earlshall Park'],
    ['Jerry Barker', 'London'], ['Polly Barker', 'London'], ['Captain', 'London'], ['Hotspur', 'London'], ['Nicholas Skinner', 'London']
  ] },
  { id: 'kind', label: 'Good or bad for horses', buckets: ['Good to horses', 'Bad for horses'], perBucket: 5, items: [
    ['Farmer Grey', 'Good to horses'], ['John Manly', 'Good to horses'], ['Squire Gordon', 'Good to horses'], ['James Howard', 'Good to horses'], ['Jerry Barker', 'Good to horses'], ['Farmer Thoroughgood', 'Good to horses'], ['Willie', 'Good to horses'],
    ['Nicholas Skinner', 'Bad for horses'], ['The tight bearing rein', 'Bad for horses'], ['Reuben Smith\'s drunken ride', 'Bad for horses'], ['A groom who steals oats', 'Bad for horses'], ['A dirty stall', 'Bad for horses'], ['Overloaded carts', 'Bad for horses']
  ] },
  { id: 'who', label: 'Horse or person', buckets: ['Horse', 'Person'], perBucket: 5, items: [
    ['Duchess', 'Horse'], ['Ginger', 'Horse'], ['Merrylegs', 'Horse'], ['Captain', 'Horse'], ['Rob Roy', 'Horse'], ['Hotspur', 'Horse'],
    ['John Manly', 'Person'], ['York', 'Person'], ['Joe Green', 'Person'], ['Jerry Barker', 'Person'], ['Willie', 'Person'], ['Squire Gordon', 'Person']
  ] }
];

/* Put in order: events listed in the order they happen. */
const EVENTS = [
  { text: 'Beauty is born on Farmer Grey\'s farm', sub: 'His mother, Duchess, tells him never to bite or kick.' },
  { text: 'Rob Roy is hurt in a hunt and has to be shot', sub: 'A young rider is killed too.' },
  { text: 'Farmer Grey breaks in Beauty', sub: 'Beauty learns to wear a bit, saddle, and harness.' },
  { text: 'Beauty is sold to Squire Gordon at Birtwick Park', sub: 'He meets Ginger and Merrylegs.' },
  { text: 'Beauty refuses to cross the broken bridge', sub: 'He saves the Squire and John in a storm.' },
  { text: 'James saves Beauty and Ginger from a fire', sub: 'The stable at an inn catches fire.' },
  { text: 'John rides Beauty to fetch the doctor', sub: 'Mrs. Gordon is very sick. Afterward, Beauty gets sick too.' },
  { text: 'Beauty and Ginger are sold to Earlshall', sub: 'The Gordons move away for Mrs. Gordon\'s health.' },
  { text: 'Ginger fights the tight bearing rein', sub: 'She rears and kicks, so she is never put in the carriage again.' },
  { text: 'Beauty falls and breaks his knees', sub: 'Reuben Smith rode him while drunk.' },
  { text: 'Beauty is hired out from a stable in Bath', sub: 'Then Mr. Barry buys him.' },
  { text: 'Jerry Barker buys Beauty for his London cab', sub: 'Jerry calls him Jack.' },
  { text: 'Beauty meets Ginger again, worn out', sub: 'Soon after, he sees a dead chestnut horse in a cart and believes it is Ginger.' },
  { text: 'Jerry gets sick and gives up cab driving', sub: 'He waited for hours in the cold on New Year\'s Eve.' },
  { text: 'Beauty falls down while working for Skinner', sub: 'Skinner worked him too hard.' },
  { text: 'Farmer Thoroughgood and Willie help Beauty get well', sub: 'They feed and rest him on their farm.' },
  { text: 'Beauty goes to his last home', sub: 'Joe Green knows him by his white star.' }
];

/* Explain it: answer in complete sentences. Each idea is found when one word from every group appears. */
const EXPLAIN = [
  { q: 'Why did Anna Sewell write Black Beauty?',
    model: 'Anna Sewell wrote Black Beauty to show people how horses feel. She wanted people to treat horses with kindness instead of cruelty.',
    ideas: [
      { label: 'To show how horses feel', all: [['feel', 'suffer', 'pain', 'hurt', 'understand', 'think']] },
      { label: 'So people would treat horses kindly', all: [['kind', 'gentle', 'better', 'care', 'nice', 'good', 'respect']] }
    ] },
  { q: 'Why was the bearing rein cruel?',
    model: 'The bearing rein held a horse\'s head up high and tight. It hurt the horse\'s neck and mouth, and it made pulling a heavy load much harder.',
    ideas: [
      { label: 'It held the head up high', all: [['head'], ['up', 'high', 'raise', 'back']] },
      { label: 'It hurt the horse', all: [['hurt', 'pain', 'sore', 'ache', 'suffer', 'uncomfortable', 'bad for']] },
      { label: 'It made pulling or working harder', all: [['pull', 'load', 'work', 'carriage', 'hill']] }
    ] },
  { q: 'How did Beauty save Squire Gordon and John on the stormy night?',
    model: 'Beauty refused to cross the bridge, even when John tried to make him. The bridge was broken in the middle, so they would have fallen into the river if they had crossed.',
    ideas: [
      { label: 'Beauty would not cross the bridge', all: [['bridge'], ['refuse', 'would not', 'wouldn\'t', 'stop', 'did not', 'didn\'t', 'won\'t']] },
      { label: 'The bridge was broken', all: [['broke', 'broken', 'washed', 'damaged', 'gone']] },
      { label: 'They would have fallen into the river', all: [['river', 'water', 'fall', 'fell', 'drown']] }
    ] },
  { q: 'Why did Beauty\'s life get harder after Reuben Smith\'s ride?',
    model: 'Reuben Smith was drunk and rode Beauty fast on a stony road with a loose shoe. Beauty fell and broke his knees. The scars spoiled his looks, so rich families did not want him and he was sold to harder jobs.',
    ideas: [
      { label: 'Reuben Smith was drunk', all: [['drunk', 'drink', 'drank', 'alcohol']] },
      { label: 'Beauty fell and hurt his knees', all: [['knee']] },
      { label: 'The scars meant he was sold to harder work', all: [['scar', 'mark', 'look', 'ugly']] }
    ] },
  { q: 'Why were Ginger and Beauty so different when they met?',
    model: 'Ginger bit and kicked because people treated her roughly when she was young. Beauty was gentle because his mother and Farmer Grey raised him with kindness.',
    ideas: [
      { label: 'Ginger was treated roughly', all: [['rough', 'cruel', 'mean', 'hard', 'badly', 'harsh', 'beat', 'whip', 'bad', 'hurt', 'abuse']] },
      { label: 'Beauty was raised with kindness', all: [['kind', 'gentle', 'good', 'well', 'nice']] }
    ] },
  { q: 'Compare Jerry Barker and Nicholas Skinner.',
    model: 'Jerry Barker was a kind cab driver who never overworked his horses and rested on Sundays. Nicholas Skinner was cruel and worked his horses too hard. Beauty was happy with Jerry, but he fell down in the street while working for Skinner.',
    ideas: [
      { label: 'Jerry was kind to his horses', all: [['jerry'], ['kind', 'gentle', 'good', 'care', 'rest', 'nice']] },
      { label: 'Skinner was cruel and overworked them', all: [['skinner'], ['cruel', 'hard', 'mean', 'overwork', 'bad', 'whip']] }
    ] }
];
