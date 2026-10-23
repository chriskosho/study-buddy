/* Parts of Speech: content.
   Sentences are written as word/tag pairs. Punctuation stands alone with no tag.
   Tags: n noun, v verb, adj adjective, art article (taught as a kind of adjective), adv adverb,
         pron pronoun, prep preposition, conj conjunction, int interjection.
   Content rules (so every label is clear and matches how grade school teaches it):
   - no possessive words like my, his, her, your, their (books disagree on pronoun vs adjective)
   - no this, that, these, those; no "to" before a verb; no "there is"
   - helping verbs (is, will, can) are verbs; "not" is an adverb */

const PARTS = [
  { id: 'n', name: 'Noun', color: '#f6c08a', ink: '#7a3d00',
    def: 'A person, place, thing, or idea.', asks: 'Who? What?',
    examples: ['teacher', 'park', 'ball', 'kindness'], sample: 'The/art dog/n chased/v a/art ball/n .', focus: 1 },
  { id: 'v', name: 'Verb', color: '#9fd3b4', ink: '#145c34',
    def: 'An action or a state of being.', asks: 'What does it do, or what is it?',
    examples: ['run', 'jump', 'think', 'is'], sample: 'Maya/n jumps/v over/prep the/art puddle/n .', focus: 1 },
  { id: 'adj', name: 'Adjective', color: '#b3cbef', ink: '#1d3f78',
    def: 'Describes a noun or a pronoun.', asks: 'What kind? Which one? How many?',
    examples: ['red', 'tall', 'three', 'happy'], sample: 'We/pron saw/v a/art huge/adj whale/n .', focus: 3,
    note: 'A, an, and the are articles. Articles are a kind of adjective.' },
  { id: 'adv', name: 'Adverb', color: '#d2c1ea', ink: '#4b2f7a',
    def: 'Describes a verb, an adjective, or another adverb.', asks: 'How? When? Where? How much?',
    examples: ['quickly', 'soon', 'here', 'very'], sample: 'The/art turtle/n walked/v slowly/adv .', focus: 3 },
  { id: 'pron', name: 'Pronoun', color: '#f5b8d1', ink: '#7d1f4a',
    def: 'Takes the place of a noun.', asks: 'Who? What? (without saying the name again)',
    examples: ['I', 'you', 'she', 'they'], sample: 'She/pron found/v the/art key/n .', focus: 0 },
  { id: 'prep', name: 'Preposition', color: '#ecd98a', ink: '#5e4b00',
    def: 'Shows how a noun or pronoun is connected to another word, often where or when.', asks: 'Where? When? (a noun or pronoun comes after it)',
    examples: ['in', 'on', 'under', 'after'], sample: 'The/art cat/n hid/v under/prep the/art bed/n .', focus: 3 },
  { id: 'conj', name: 'Conjunction', color: '#a7dcd6', ink: '#0f5751',
    def: 'Joins words or groups of words.', asks: 'What joins these together?',
    examples: ['and', 'but', 'or', 'because'], sample: 'I/pron like/v apples/n and/conj pears/n .', focus: 3 },
  { id: 'int', name: 'Interjection', color: '#f2a896', ink: '#7a2512',
    def: 'Shows a strong feeling. It often comes first, followed by a comma or an exclamation point.', asks: 'How do you feel?',
    examples: ['wow', 'oops', 'hey', 'ouch'], sample: 'Ouch/int , I/pron bumped/v the/art table/n !', focus: 0 }
];

/* Sort it (Easy): words that almost always do one job, so they can be sorted on their own. */
const SORT_WORDS = {
  n: ['teacher', 'kitchen', 'pencil', 'elephant', 'river', 'sister', 'window', 'pizza', 'library', 'mountain', 'planet', 'bicycle',
      'sandwich', 'friend', 'ocean', 'castle', 'rabbit', 'notebook', 'city', 'airplane', 'tomato', 'village', 'giraffe', 'museum', 'cousin'],
  v: ['sing', 'eat', 'write', 'carry', 'bake', 'explore', 'invent', 'borrow', 'forget', 'arrive', 'imagine', 'choose',
      'gather', 'listen', 'decide', 'destroy', 'discover', 'pretend', 'juggle', 'breathe', 'explain', 'remember', 'memorize', 'wander'],
  adj: ['happy', 'tiny', 'fuzzy', 'loud', 'soft', 'enormous', 'sleepy', 'shiny', 'gentle', 'hungry', 'cozy', 'bright',
        'fluffy', 'noisy', 'strong', 'curious', 'sticky', 'grumpy', 'delicious', 'wrinkly', 'ancient', 'careful', 'silly', 'muddy', 'polite']
};

/* Everyday sentences: Flashcards (words), Spot it, Speed round. */
const SENTENCES = [
  'The/art hungry/adj dog/n chased/v a/art red/adj ball/n .',
  'Maya/n jumped/v over/prep the/art muddy/adj puddle/n .',
  'She/pron quickly/adv packed/v a/art lunch/n .',
  'Wow/int , the/art fireworks/n were/v bright/adj !',
  'We/pron played/v soccer/n after/prep school/n .',
  'The/art tiny/adj turtle/n walked/v slowly/adv .',
  'Grandma/n baked/v cookies/n and/conj bread/n .',
  'They/pron sat/v under/prep a/art tall/adj tree/n .',
  'Oops/int , I/pron dropped/v the/art eggs/n !',
  'The/art kitten/n is/v very/adv sleepy/adj .',
  'Leo/n and/conj Sam/n built/v a/art fort/n .',
  'It/pron rained/v , so/conj we/pron stayed/v inside/adv .',
  'The/art bright/adj stars/n twinkled/v above/prep the/art lake/n .',
  'He/pron gently/adv patted/v the/art horse/n .',
  'Dad/n cooked/v pancakes/n for/prep breakfast/n .',
  'You/pron can/v sit/v beside/prep me/pron .',
  'The/art students/n read/v quietly/adv in/prep the/art library/n .',
  'Hey/int , wait/v for/prep us/pron !',
  'Ella/n wanted/v pizza/n , but/conj Max/n wanted/v tacos/n .',
  'The/art old/adj bridge/n creaked/v loudly/adv .',
  'We/pron will/v visit/v the/art museum/n soon/adv .',
  'Three/adj ducks/n swam/v across/prep the/art pond/n .',
  'Ouch/int , the/art stove/n is/v hot/adj !',
  'They/pron laughed/v because/conj the/art clown/n slipped/v .',
  'The/art brave/adj firefighter/n climbed/v the/art ladder/n .',
  'I/pron always/adv feed/v the/art fish/n .',
  'A/art gray/adj cloud/n floated/v past/prep the/art moon/n .',
  'Mom/n or/conj Dad/n will/v drive/v us/pron .',
  'The/art puppy/n happily/adv chewed/v a/art shoe/n .',
  'Yikes/int , a/art spider/n crawled/v onto/prep the/art table/n !',
  'Ben/n painted/v a/art beautiful/adj picture/n .',
  'She/pron arrived/v early/adv and/conj waited/v patiently/adv .',
  'The/art cold/adj wind/n blew/v through/prep the/art trees/n .',
  'We/pron found/v shells/n on/prep the/art sandy/adj beach/n .',
  'Hooray/int , we/pron won/v the/art game/n !',
  'The/art children/n sang/v loudly/adv during/prep the/art parade/n .'
];

/* Tricky sentences (Insane): the starred word does a different job than you might expect.
   Label the sentence uses these, so every word is tagged. */
const TRICKY = [
  { s: 'We/pron went/v for/prep a/art long/adj run/n* .', why: 'Run is a noun here. It names a thing: a run.' },
  { s: 'I/pron run/v* fast/adv every/adj morning/n .', why: 'Run is a verb here. It is the action. Fast tells how, so it is an adverb.' },
  { s: 'The/art fast/adj* car/n zoomed/v away/adv .', why: 'Fast is an adjective here. It describes the car.' },
  { s: 'The/art light/n* flickered/v .', why: 'Light is a noun here. It names a thing.' },
  { s: 'She/pron carried/v a/art light/adj* bag/n .', why: 'Light is an adjective here. It tells what kind of bag.' },
  { s: 'We/pron light/v* candles/n at/prep dinner/n .', why: 'Light is a verb here. It is what we do.' },
  { s: 'The/art back/adj* door/n squeaked/v .', why: 'Back is an adjective here. It tells which door.' },
  { s: 'We/pron walked/v back/adv* slowly/adv .', why: 'Back is an adverb here. It tells where we walked.' },
  { s: 'After/prep* lunch/n , we/pron rested/v .', why: 'After is a preposition here. It connects to the noun lunch.' },
  { s: 'We/pron rested/v after/conj* we/pron ate/v .', why: 'After is a conjunction here. It joins two parts, and each part has its own subject and verb: we rested, we ate.' },
  { s: 'Well/int* , I/pron am/v ready/adj now/adv .', why: 'Well is an interjection here. It starts the sentence and is set off by a comma.' },
  { s: 'Lily/n sings/v well/adv* .', why: 'Well is an adverb here. It tells how Lily sings.' },
  { s: 'We/pron watch/v* movies/n on/prep Fridays/n .', why: 'Watch is a verb here. It is what we do.' },
  { s: 'Dad/n wore/v a/art silver/adj watch/n* .', why: 'Watch is a noun here. It names a thing Dad wore.' },
  { s: 'The/art plant/n* grew/v tall/adj .', why: 'Plant is a noun here. Tall describes the plant, so it is an adjective.' },
  { s: 'We/pron plant/v* seeds/n in/prep spring/n .', why: 'Plant is a verb here. It is what we do.' },
  { s: 'The/art cat/n ran/v up/prep* the/art stairs/n .', why: 'Up is a preposition here. It connects to the noun stairs.' },
  { s: 'I/pron looked/v up/adv* .', why: 'Up is an adverb here. It tells where I looked, and no noun follows it.' },
  { s: 'She/pron kicked/v the/art ball/n hard/adv* .', why: 'Hard is an adverb here. It tells how she kicked.' },
  { s: 'The/art hard/adj* test/n surprised/v us/pron .', why: 'Hard is an adjective here. It describes the test.' }
];
