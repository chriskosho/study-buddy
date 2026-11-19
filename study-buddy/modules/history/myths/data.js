/* Greek and Roman Myths: content.
   Source: the teacher's "Greek and Roman Myth Study Guide" (five photographed pages, test Thursday 11/19), sent by the owner. It covers seven stories:
   Jason and the Golden Fleece, Perseus & Medusa, Cupid & Psyche, Damon and Pythias, The Sword of Damocles, Horatius and the Bridge, and Androcles and the Lion.
   Questions and answers use the teacher's wording (the italic answers on the sheet). Fixed on copying: a capital and a full stop were added where the sheet has none,
   and "Cerebus" on the sheet is spelled "Cerberus" in the app (the sheet's wording is kept in the Clarify note it came from, with the usual spelling).
   Questions the sheet asks with no answer written (the "Discuss" questions about pros and cons, family, friendship, and so on) have no answer here either:
   they show as "Talk it over" in the Study guide and are not scored. Two sheet answers are not full sentences ("filled with danger", "his power"); they are kept as written.
   NOT on the photos, and marked "added" in the app or this file: the wrong answers in the Quiz, the Sort it and Put in order cards (worded from the sheet's answers,
   the order follows the order of the sheet's questions), and the words I chose to blank in Fill it in. */

/* qa: [question, teacher's answer]; talk: [question, teacher's answer or '' when the sheet gives none]; note: a "Clarify" line from the sheet; main: a "Main Idea" or "Review" line. */
const STORIES = [
  { id: 'jason', label: 'Jason and the Golden Fleece', qa: [
    ['Who raised Jason?', 'The centaur.'],
    ['Why is he going to his step-uncle’s kingdom?', 'Pelias stole the kingdom from Jason’s father.'],
    ['What did Jason lose in the river?', 'One sandal.'],
    ['Why did this concern Pelias?', 'Someone predicted Pelias’ kingdom would be overthrown by a man with one shoe.'],
    ['Pelias was worried about a prophecy he was told many years before. What is a prophecy?', 'A prediction of the future, that can often be a warning to the person it is about.'],
    ['Jason receives three impossible tasks. The first is to bring the ___ to Pelias.', 'Golden fleece.'],
    ['What was Jason’s ship called?', 'Argo.'],
    ['What were his crew-mates called?', 'Argonauts.'],
    ['Who gives Jason his second task?', 'The king on the island with the golden fleece.'],
    ['Why would he not want Jason to have the golden fleece?', 'Because it brings power and honor to his kingdom and was a gift from the gods.'],
    ['What is the second impossible task Jason is given?', 'To sow dragons’ teeth into a field with two brass bulls.'],
    ['Brass is a very heavy metal. What happens when dragons’ teeth are planted?', 'Iron men spring out ready to fight.'],
    ['Who helps Jason with this task?', 'Medea.'],
    ['What does she give him to keep him safe?', 'Magic ointment.'],
    ['How can Jason defeat the iron soldiers?', 'Throwing a stone in the middle of them.'],
    ['What was Jason’s third impossible task?', 'To get past the dragon to retrieve the golden fleece.']
  ], talk: [
    ['When Medea helped Jason, who does she betray? Was this just? Discuss pros and cons.', ''],
    ['How does Jason respond to his seemingly impossible tasks? What virtue does he show?', 'Fortitude.'],
    ['Why did Jason begin any of these tasks?', 'To win back his father’s kingdom from Pelias.'],
    ['How is family important in this myth?', '']
  ] },
  { id: 'perseus', label: 'Perseus & Medusa', qa: [
    ['Who is Perseus’ father?', 'Zeus.'],
    ['Why was Perseus’ grandfather afraid?', 'Prophecy said he would be killed by his grandson.'],
    ['What did he do with Perseus and his mother?', 'Put them into a chest and sent them into the sea.'],
    ['What kind of creature is Medusa?', 'A Gorgon.'],
    ['What happens if you look in her eyes?', 'You turn to stone.'],
    ['What 3 gifts from the gods is Perseus given? Who is each one from?', '1. Brass shield, Athena. 2. Helmet to make Perseus invisible, Hades. 3. Sword that cuts through anything in one stroke, and winged sandals, Hermes.'],
    ['Who tells Perseus where Medusa is?', 'The Three Gray Sisters.'],
    ['What do they share?', 'One eye.'],
    ['Why does Perseus use a mirror? Why can he use a mirror and still be alive?', 'Not looking Medusa in the eye directly, but in a reflection.']
  ], note: 'Clarify: altogether, the Three Gray Sisters only have one eye that they must share. Only one of them can see at a time.',
  talk: [
    ['Although Perseus received help from the gods, he used his wit to figure out how to defeat Medusa and the evil king of the island. What does it mean to be heroic?', 'Someone who rejoices in a challenge, is brave even when there is little or no hope.'],
    ['What virtues or characteristics define a hero?', 'Fortitude.'],
    ['Does a hero have to do everything him/herself? What help did Perseus receive?', 'Perseus received help from the gods, a hero accepts and uses his gifts wisely.']
  ] },
  { id: 'psyche', label: 'Cupid & Psyche', main: 'Main idea: Curiosity can be dangerous if you do not control your urges, but the people around you can bring you back to your senses.', qa: [
    ['Why does Venus want to punish Psyche?', 'She is jealous that people think Psyche is more beautiful than Venus.'],
    ['What happens when Cupid flies to earth?', 'He accidentally shoots himself with his arrow, causing him to fall in love with Psyche.'],
    ['Who does Psyche marry?', 'Cupid.'],
    ['Does she know who it is at first? Why not?', 'No, he comes at night when it is dark.'],
    ['How does she find out?', 'She turns on a lamp when he comes one night.'],
    ['What happens when Psyche finally sees Cupid?', 'He disappears.'],
    ['Who does Psyche go to for help? Why?', 'Venus, because she is the goddess of love.'],
    ['How does Venus treat Psyche?', 'Unkindly because she is jealous.'],
    ['What is the first task Venus gave Psyche?', 'To separate the grain.'],
    ['Who/what helps Psyche sort the grain?', 'Ants.'],
    ['What is the second task Venus gives Psyche?', 'Go to the underworld and ask Proserpina to send Venus some beauty.'],
    ['Can humans return from the underworld alive?', 'No: “no mortal could return.”'],
    ['What advice is she given?', 'Take a coin to the boatman, give a cake to the three-headed god who guards the underworld, do not open the box from Proserpina.'],
    ['What happens after Psyche receives the beauty from Proserpina?', 'She opens the box and goes into a deep sleep.'],
    ['Who saves Psyche from her sleep?', 'Cupid.'],
    ['In the end, Psyche becomes ___.', 'Immortal.']
  ], note: 'Discuss: grains are tiny and all look similar (think of rice). Would this be easy? Clarify: in order to enter the underworld, one must cross a river, but mortals cannot cross it and survive. If Psyche gives the boatman a coin, she can survive. Past the river, the underworld is guarded by a three headed dog named Cerberus.',
  talk: [
    ['Who do you think might have sent the ants? Who do you think might have been the voice telling Psyche how to survive in the underworld?', 'Cupid.'],
    ['What does Cupid say to her when she wakes up?', '“See what curiosity gets you?”'],
    ['What is curiosity?', 'Wanting to know something, wondering about something.'],
    ['Is it a bad thing?', 'No.'],
    ['Why was there a bad result for Psyche in the story? Are there times when you need to trust the people around you when you do not yet know something? What does it mean to let curiosity get the best of you?', ''],
    ['Who saved Psyche? What would have happened if Cupid was not there? Could Psyche have saved herself? What did Psyche need?', 'Someone else to help her.'],
    ['When we have flaws, the people around us can help us come back to our senses, just like Cupid brought Psyche back to her senses. Discuss.', '']
  ] },
  { id: 'damon', label: 'Damon and Pythias', qa: [
    ['What is Pythias’ philosophy?', 'That all people are equal.'],
    ['What does Pythias refuse to do?', 'Bow down to Dionysus.'],
    ['What does a bow signify?', 'You are showing respect to someone greater, more powerful than you.'],
    ['By not bowing, what is Pythias doing?', 'Refusing to show respect to the king: saying he is not any more powerful than anyone else.'],
    ['What does Pythias ask to do before he is put in prison?', 'Go tell his family.'],
    ['What does Damon offer to do for Pythias?', 'Take his place while he goes to his family.'],
    ['What will happen to Damon if Pythias does not return in 3 days?', 'He will be killed instead.'],
    ['What does Damon keep saying while he waits for Pythias to show up?', '“I trust my friend.”'],
    ['What could Pythias have done?', 'Stayed at home, never gone back to serve his punishment.'],
    ['What did Pythias have to go through to get back?', 'A shipwreck, being robbed.'],
    ['Why does Dionysus set them both free?', 'He sees their true friendship.']
  ], talk: [
    ['What is loyalty?', 'Standing by or standing up for someone, especially in the most difficult times, not giving up on someone.'],
    ['What is trust?', 'Believing that someone will follow through, when there is no proof or guarantee that this will happen.'],
    ['What did Damon trust Pythias would do?', 'Come back.'],
    ['What did Dionysus think Pythias would do?', 'Not come back.'],
    ['How did Damon show loyalty to Pythias?', 'Continuing to trust him.'],
    ['How did Pythias show loyalty to Damon?', 'Returning to accept his punishment.'],
    ['What is friendship? How do Damon and Pythias show true friendship? Does Dionysus believe in the power of this friendship at first? What does he realize by the end?', '']
  ] },
  { id: 'damocles', label: 'The Sword of Damocles', main: 'Review: The moral/lesson of The Sword of Damocles is that “the privilege of power brings dangers.”', qa: [
    ['Who are the two main characters in this story?', 'Damocles and Dionysus.'],
    ['In the beginning of the story, Damocles feels what toward Dionysus?', 'Envy, jealousy.'],
    ['Why does Damocles feel jealous?', 'He thinks Dionysus has the best life, with riches and power.'],
    ['Dionysus says that they should do what?', 'Switch places for just one day.'],
    ['How does Damocles feel when they first switch places?', 'Great: he has everything he could want.'],
    ['Then he sees what above him?', 'A sword, hanging by a single horse hair from the ceiling.'],
    ['Then Damocles feels how?', 'Afraid, tense, nervous.'],
    ['Why does he feel this way?', 'The sword could fall at any minute and kill him.'],
    ['Dionysus says that the privilege of power brings ___.', 'Dangers.']
  ], talk: [
    ['In the beginning of the story, does Damocles really know what Dionysus’ life is like? What does he think it is like?', ''],
    ['What is Dionysus’ life really like?', 'Filled with danger.'],
    ['What about Dionysus’ life is dangerous?', 'His power.'],
    ['What responsibilities might Dionysus have as a king?', 'He ultimately has to make sure all his people are safe.'],
    ['Think about ancient Rome. If Dionysus makes a mistake, what could happen?', 'His people could overthrow him.'],
    ['What symbol in this story represents the ever-present danger Dionysus feels?', 'The sword.'],
    ['Does a sword actually always hang above Dionysus? Why does he put it above Damocles?', 'To help him see the danger that comes with responsibility.'],
    ['Why is it held with just a single horse hair?', 'It is more likely to fall.'],
    ['“The privilege of power brings dangers.” Why is power a privilege?', 'Not everyone gets to have power.']
  ], note: 'With great power, comes great responsibility. Dionysus has a duty to fulfill, and if he makes one mistake, he could lose his life and all of his power. From the outside, like Damocles thought, power seems like a great life. But when you hold the responsibility of such great power, like the king Dionysus, you have an ever-present danger to do what is right upon you.' },
  { id: 'horatius', label: 'Horatius and the Bridge', qa: [
    ['What was Tarquin the Proud like? Why did the people want to overthrow him?', 'Greedy, cruel; they wanted to have a say in the government.'],
    ['Who did Tarquin turn to for help?', 'The Etruscans.'],
    ['What did the Romans forget to destroy at first?', 'The bridge over the Tiber River.'],
    ['Why should they have destroyed it?', 'So that the Etruscans could not get into Rome.'],
    ['Who stood up to the entire Etruscan army on his own?', 'Horatius.'],
    ['What did his fellow soldiers do in the meantime?', 'Chop down the bridge.'],
    ['What could have happened to Horatius as the bridge gave way?', 'He could have fallen in and drowned, could have been defeated by the Etruscans.'],
    ['According to the myth, who was with Horatius as he dove in the Tiber?', 'The gods.'],
    ['Who won this battle?', 'Rome.']
  ], talk: [
    ['Imagine fighting an entire army on your own. What would you feel like? What virtue would you have to show the most?', 'Fortitude.']
  ] },
  { id: 'androcles', label: 'Androcles and the Lion', qa: [
    ['Who is Androcles?', 'A runaway Roman slave.'],
    ['How did Androcles help the lion?', 'Pulled a thorn out of his paw.'],
    ['How did the lion help Androcles?', 'Gave him comfort/companionship when he was afraid after running away.'],
    ['Who discovered Androcles? What did the law state must be done?', 'Roman soldiers, they had to imprison him.'],
    ['What was decided for Androcles? How would he die?', 'Fighting a vicious animal in the Colosseum.'],
    ['Who did Androcles meet in the Colosseum?', 'The same lion who was his friend.'],
    ['What did the crowd cheer for?', 'Both the lion and Androcles to be freed.']
  ], talk: [
    ['How do you think Androcles felt when he ran away from his master? Why?', 'Afraid: he knew what would happen if he was caught.'],
    ['How did he feel when he saw a lion? Why?', 'More afraid: it was a wild animal, and he did not know how it would act.'],
    ['How does Androcles help the lion? What virtue did he show in approaching a wild animal?', 'Pulled out a thorn from its paw, showed fortitude (courage).'],
    ['After Androcles is told he will be sent to the Colosseum, why does he believe he will die?', 'Gladiators fought wild animals in the Colosseum: usually wild animals attack on instinct, and humans are weaker than these animals.'],
    ['What happens that Androcles does not expect?', 'The wild animal he faces is his friend the lion.'],
    ['What is the result of their friendship?', 'They are both set free.'],
    ['What myth is similar?', 'Damon & Pythias.'],
    ['Do either of them show loyalty? How so?', 'Yes, neither of them fight the other even though they are being told to.'],
    ['What does it mean to be loyal?', 'To stand by your friend’s side, especially in difficult times.']
  ] }
];

/* Flashcards: every question that has a written answer. */
const CARDS = STORIES.flatMap(s => [...s.qa, ...s.talk.filter(t => t[1])].map(([q, a]) => ({ story: s.label, q, a })));

/* Quiz: the right answer is the sheet's answer (teacher's wording). The wrong answers are added. */
const QUIZ = [
  { q: 'Who raised Jason?', a: 'The centaur', wrong: ['Pelias', 'Medea', 'Zeus'], why: 'The centaur raised Jason.' },
  { q: 'Why is Jason going to his step-uncle’s kingdom?', a: 'Pelias stole the kingdom from Jason’s father', wrong: ['He was lost at sea', 'Medea told him to go', 'He wanted to find the dragon'], why: 'Pelias stole the kingdom from Jason’s father.' },
  { q: 'What did Jason lose in the river?', a: 'One sandal', wrong: ['His ship', 'His sword', 'The golden fleece'], why: 'Jason lost one sandal in the river.' },
  { q: 'Why did Jason’s missing sandal worry Pelias?', a: 'Someone predicted Pelias’ kingdom would be overthrown by a man with one shoe', wrong: ['Pelias wanted the sandal for himself', 'Pelias thought Jason was a thief', 'The sandal belonged to the gods'], why: 'Someone predicted Pelias’ kingdom would be overthrown by a man with one shoe.' },
  { q: 'What is a prophecy?', a: 'A prediction of the future, that can often be a warning to the person it is about', wrong: ['A story about the past', 'A magic ointment', 'A gift from the gods'], why: 'A prophecy is a prediction of the future, that can often be a warning to the person it is about.' },
  { q: 'What is the first of Jason’s three impossible tasks?', a: 'To bring the golden fleece to Pelias', wrong: ['To sow dragons’ teeth', 'To defeat the iron soldiers', 'To build a ship'], why: 'The first task is to bring the golden fleece to Pelias.' },
  { q: 'What was Jason’s crew called?', a: 'Argonauts', wrong: ['Gorgons', 'Etruscans', 'Centaurs'], why: 'His ship was the Argo and his crew-mates were the Argonauts.' },
  { q: 'What is the second impossible task Jason is given?', a: 'To sow dragons’ teeth into a field with two brass bulls', wrong: ['To get past the dragon', 'To cut off Medusa’s head', 'To sort a field of grain'], why: 'The second task is to sow dragons’ teeth into a field with two brass bulls.' },
  { q: 'What happens when dragons’ teeth are planted?', a: 'Iron men spring out ready to fight', wrong: ['Golden trees grow', 'A dragon wakes up', 'Nothing happens'], why: 'Iron men spring out ready to fight.' },
  { q: 'Who helps Jason with the second task, and what does she give him?', a: 'Medea gives him magic ointment', wrong: ['Athena gives him a shield', 'Proserpina gives him a box', 'Medea gives him a mirror'], why: 'Medea helps Jason and gives him magic ointment to keep him safe.' },
  { q: 'How can Jason defeat the iron soldiers?', a: 'Throwing a stone in the middle of them', wrong: ['Playing a song', 'Chopping down a bridge', 'Looking at them in a mirror'], why: 'Jason defeats the iron soldiers by throwing a stone in the middle of them.' },
  { q: 'Why did Jason begin his tasks?', a: 'To win back his father’s kingdom from Pelias', wrong: ['To find a wife', 'To become a god', 'To escape from Medea'], why: 'Jason began the tasks to win back his father’s kingdom from Pelias.' },
  { q: 'Who is Perseus’ father?', a: 'Zeus', wrong: ['Hades', 'Hermes', 'Dionysus'], why: 'Zeus is Perseus’ father.' },
  { q: 'Why was Perseus’ grandfather afraid?', a: 'A prophecy said he would be killed by his grandson', wrong: ['Perseus had stolen his crown', 'Medusa had cursed him', 'Perseus was a Gorgon'], why: 'A prophecy said he would be killed by his grandson.' },
  { q: 'What did Perseus’ grandfather do with Perseus and his mother?', a: 'Put them into a chest and sent them into the sea', wrong: ['Locked them in the underworld', 'Sent them to Rome', 'Gave them to the Three Gray Sisters'], why: 'He put them into a chest and sent them into the sea.' },
  { q: 'What kind of creature is Medusa?', a: 'A Gorgon', wrong: ['A centaur', 'A three-headed dog', 'A dragon'], why: 'Medusa is a Gorgon.' },
  { q: 'What happens if you look in Medusa’s eyes?', a: 'You turn to stone', wrong: ['You fall into a deep sleep', 'You become invisible', 'You become immortal'], why: 'If you look in her eyes, you turn to stone.' },
  { q: 'Which god gave Perseus the brass shield?', a: 'Athena', wrong: ['Hades', 'Hermes', 'Zeus'], why: 'The brass shield was from Athena.' },
  { q: 'Which god gave Perseus the helmet that makes him invisible?', a: 'Hades', wrong: ['Athena', 'Hermes', 'Zeus'], why: 'The helmet to make Perseus invisible was from Hades.' },
  { q: 'Which god gave Perseus the sword and the winged sandals?', a: 'Hermes', wrong: ['Athena', 'Hades', 'Venus'], why: 'The sword that cuts through anything in one stroke, and the winged sandals, were from Hermes.' },
  { q: 'Who tells Perseus where Medusa is, and what do they share?', a: 'The Three Gray Sisters, who share one eye', wrong: ['The centaur, who shares a ship', 'Athena, who shares a shield', 'The Argonauts, who share a map'], why: 'The Three Gray Sisters tell him, and they share one eye.' },
  { q: 'Why can Perseus use a mirror and still be alive?', a: 'He is not looking Medusa in the eye directly, but in a reflection', wrong: ['The mirror turns Medusa to stone', 'The helmet protects his eyes', 'Medusa cannot see in the mirror'], why: 'Perseus is not looking Medusa in the eye directly, but in a reflection.' },
  { q: 'What does it mean to be heroic?', a: 'Someone who rejoices in a challenge, is brave even when there is little or no hope', wrong: ['Someone who never needs help', 'Someone who is more powerful than everyone else', 'Someone who always wins'], why: 'Being heroic means rejoicing in a challenge and being brave even when there is little or no hope.' },
  { q: 'What help did Perseus receive, and what does a hero do with it?', a: 'He received help from the gods; a hero accepts and uses his gifts wisely', wrong: ['He received no help; a hero does everything himself', 'He received help from Medea; a hero keeps it secret', 'He received help from Cupid; a hero returns it'], why: 'Perseus received help from the gods, and a hero accepts and uses his gifts wisely.' },
  { q: 'Why does Venus want to punish Psyche?', a: 'She is jealous that people think Psyche is more beautiful than Venus', wrong: ['Psyche stole Cupid’s arrow', 'Psyche refused to bow to her', 'Psyche opened a box'], why: 'Venus is jealous that people think Psyche is more beautiful than Venus.' },
  { q: 'What happens when Cupid flies to earth?', a: 'He accidentally shoots himself with his arrow, causing him to fall in love with Psyche', wrong: ['He is turned to stone', 'He loses one sandal', 'He is robbed and shipwrecked'], why: 'He accidentally shoots himself with his arrow and falls in love with Psyche.' },
  { q: 'Why does Psyche not know who her husband is at first?', a: 'He comes at night when it is dark', wrong: ['He wears a helmet', 'He is invisible', 'He lives in the underworld'], why: 'He comes at night when it is dark.' },
  { q: 'How does Psyche find out who her husband is?', a: 'She turns on a lamp when he comes one night', wrong: ['Venus tells her', 'The ants tell her', 'She looks in a mirror'], why: 'She turns on a lamp when he comes one night.' },
  { q: 'What happens when Psyche finally sees Cupid?', a: 'He disappears', wrong: ['He turns to stone', 'He takes her to the underworld', 'He falls into a deep sleep'], why: 'When Psyche sees Cupid, he disappears.' },
  { q: 'Who helps Psyche sort the grain?', a: 'Ants', wrong: ['Cupid’s arrows', 'The Three Gray Sisters', 'The boatman'], why: 'Ants help Psyche sort the grain.' },
  { q: 'What is the second task Venus gives Psyche?', a: 'Go to the underworld and ask Proserpina to send Venus some beauty', wrong: ['Separate the grain', 'Bring Venus the golden fleece', 'Sow dragons’ teeth'], why: 'Psyche must go to the underworld and ask Proserpina to send Venus some beauty.' },
  { q: 'Which is part of the advice Psyche is given for the underworld?', a: 'Take a coin to the boatman', wrong: ['Take a mirror to the three-headed dog', 'Look Proserpina in the eye', 'Open the box right away'], why: 'She is told to take a coin to the boatman, give a cake to the three-headed god, and not open the box.' },
  { q: 'What happens after Psyche receives the beauty from Proserpina?', a: 'She opens the box and goes into a deep sleep', wrong: ['She gives the box to the boatman', 'She turns to stone', 'She becomes invisible'], why: 'She opens the box and goes into a deep sleep.' },
  { q: 'Who saves Psyche from her sleep, and what does she become in the end?', a: 'Cupid saves her, and she becomes immortal', wrong: ['Venus saves her, and she becomes a Gorgon', 'The ants save her, and she becomes a queen', 'Cupid saves her, and she becomes a mortal again'], why: 'Cupid saves Psyche, and in the end she becomes immortal.' },
  { q: 'What is the main idea of Cupid & Psyche?', a: 'Curiosity can be dangerous if you do not control your urges, but the people around you can bring you back to your senses', wrong: ['Beauty is more important than love', 'A hero must do everything himself', 'The privilege of power brings dangers'], why: 'Curiosity can be dangerous if you do not control your urges, but the people around you can bring you back to your senses.' },
  { q: 'What is Pythias’ philosophy?', a: 'That all people are equal', wrong: ['That the king is the most powerful', 'That friends must never be trusted', 'That power is a privilege'], why: 'Pythias’ philosophy is that all people are equal.' },
  { q: 'What does Pythias refuse to do?', a: 'Bow down to Dionysus', wrong: ['Pay a coin to the boatman', 'Leave the prison', 'Tell his family'], why: 'Pythias refuses to bow down to Dionysus.' },
  { q: 'What does a bow signify?', a: 'You are showing respect to someone greater, more powerful than you', wrong: ['You are asking for help', 'You are saying you are equal', 'You are afraid of a prophecy'], why: 'A bow signifies you are showing respect to someone greater, more powerful than you.' },
  { q: 'What does Damon offer to do for Pythias?', a: 'Take his place while he goes to his family', wrong: ['Bow to the king for him', 'Fight the king’s army', 'Pay the king in gold'], why: 'Damon offers to take his place while he goes to his family.' },
  { q: 'What will happen to Damon if Pythias does not return in 3 days?', a: 'He will be killed instead', wrong: ['He will be set free', 'He will become king', 'He will be sent into the sea'], why: 'Damon will be killed instead.' },
  { q: 'What does Damon keep saying while he waits?', a: '“I trust my friend”', wrong: ['“I will be a king”', '“See what curiosity gets you?”', '“With great power comes great responsibility”'], why: 'Damon keeps saying “I trust my friend.”' },
  { q: 'What did Pythias have to go through to get back?', a: 'A shipwreck, being robbed', wrong: ['A river of stone', 'A field of iron men', 'An army of Etruscans'], why: 'Pythias went through a shipwreck and being robbed.' },
  { q: 'Why does Dionysus set Damon and Pythias both free?', a: 'He sees their true friendship', wrong: ['He is afraid of the gods', 'Pythias bowed to him at last', 'Damon pays him'], why: 'He sees their true friendship.' },
  { q: 'What is loyalty?', a: 'Standing by or standing up for someone, especially in the most difficult times', wrong: ['Believing that someone is more powerful than you', 'Wanting to know something', 'Having the best life, with riches and power'], why: 'Loyalty is standing by or standing up for someone, especially in the most difficult times, not giving up on someone.' },
  { q: 'What is trust?', a: 'Believing that someone will follow through, when there is no proof or guarantee that this will happen', wrong: ['Knowing for sure that someone will follow through', 'Standing up to an army on your own', 'Being jealous of a friend'], why: 'Trust is believing that someone will follow through, when there is no proof or guarantee that this will happen.' },
  { q: 'How did Pythias show loyalty to Damon?', a: 'Returning to accept his punishment', wrong: ['Staying at home', 'Bowing to Dionysus', 'Going to Rome'], why: 'Pythias showed loyalty by returning to accept his punishment.' },
  { q: 'Who are the two main characters in The Sword of Damocles?', a: 'Damocles and Dionysus', wrong: ['Damon and Pythias', 'Androcles and Dionysus', 'Horatius and Damocles'], why: 'The two main characters are Damocles and Dionysus.' },
  { q: 'What does Damocles feel toward Dionysus in the beginning?', a: 'Envy, jealousy', wrong: ['Fear', 'Loyalty', 'Curiosity'], why: 'Damocles feels envy and jealousy.' },
  { q: 'Why does Damocles feel jealous?', a: 'He thinks Dionysus has the best life, with riches and power', wrong: ['Dionysus has a sword', 'Dionysus will not bow to him', 'Dionysus is a god'], why: 'He thinks Dionysus has the best life, with riches and power.' },
  { q: 'What does Damocles see above him after the two switch places?', a: 'A sword, hanging by a single horse hair from the ceiling', wrong: ['A dragon', 'A mirror', 'A lamp'], why: 'He sees a sword hanging by a single horse hair from the ceiling.' },
  { q: 'Why is the sword held with just a single horse hair?', a: 'It is more likely to fall', wrong: ['It is hard to see', 'Horse hair is very strong', 'It is a gift from the gods'], why: 'A single hair makes the sword more likely to fall.' },
  { q: 'What symbol in the story represents the ever-present danger Dionysus feels?', a: 'The sword', wrong: ['The ceiling', 'The throne', 'The crown'], why: 'The sword is the symbol of the ever-present danger.' },
  { q: 'What is the moral of The Sword of Damocles?', a: 'The privilege of power brings dangers', wrong: ['Curiosity can be dangerous', 'All people are equal', 'A hero accepts help wisely'], why: 'The moral is that “the privilege of power brings dangers.”' },
  { q: 'Why is power a privilege?', a: 'Not everyone gets to have power', wrong: ['Everyone has power', 'Power makes people friends', 'Power belongs to the gods'], why: 'Power is a privilege because not everyone gets to have power.' },
  { q: 'What was Tarquin the Proud like?', a: 'Greedy, cruel', wrong: ['Brave, kind', 'Curious, shy', 'Loyal, honest'], why: 'Tarquin was greedy and cruel, and the people wanted to have a say in the government.' },
  { q: 'Who did Tarquin turn to for help?', a: 'The Etruscans', wrong: ['The Argonauts', 'The Gorgons', 'The gladiators'], why: 'Tarquin turned to the Etruscans.' },
  { q: 'What did the Romans forget to destroy at first?', a: 'The bridge over the Tiber River', wrong: ['The Colosseum', 'The ship Argo', 'The Etruscan army'], why: 'They forgot to destroy the bridge over the Tiber River, so the Etruscans could get into Rome.' },
  { q: 'Who stood up to the entire Etruscan army on his own?', a: 'Horatius', wrong: ['Androcles', 'Damon', 'Perseus'], why: 'Horatius stood up to the entire Etruscan army on his own.' },
  { q: 'What did Horatius’ fellow soldiers do in the meantime?', a: 'Chop down the bridge', wrong: ['Build a new bridge', 'Run away to Egypt', 'Bow to Tarquin'], why: 'His fellow soldiers chopped down the bridge.' },
  { q: 'According to the myth, who was with Horatius as he dove in the Tiber?', a: 'The gods', wrong: ['Cupid', 'The Etruscans', 'The Three Gray Sisters'], why: 'According to the myth, the gods were with him. Rome won the battle.' },
  { q: 'Which virtue does Horatius show most?', a: 'Fortitude', wrong: ['Envy', 'Curiosity', 'Loyalty to the king'], why: 'Standing up to an entire army on your own takes fortitude.' },
  { q: 'Who is Androcles?', a: 'A runaway Roman slave', wrong: ['A Roman king', 'A Greek hero', 'An Etruscan soldier'], why: 'Androcles is a runaway Roman slave.' },
  { q: 'How did Androcles help the lion?', a: 'Pulled a thorn out of his paw', wrong: ['Gave him a coin', 'Gave him a cake', 'Chopped down a bridge'], why: 'Androcles pulled a thorn out of the lion’s paw.' },
  { q: 'How did the lion help Androcles?', a: 'Gave him comfort/companionship when he was afraid after running away', wrong: ['Carried him to Rome', 'Fought the soldiers for him', 'Gave him magic ointment'], why: 'The lion gave Androcles comfort and companionship when he was afraid after running away.' },
  { q: 'How was Androcles to die?', a: 'Fighting a vicious animal in the Colosseum', wrong: ['In the underworld', 'In a shipwreck', 'Under a hanging sword'], why: 'He was to die fighting a vicious animal in the Colosseum.' },
  { q: 'Who did Androcles meet in the Colosseum?', a: 'The same lion who was his friend', wrong: ['Dionysus', 'Horatius', 'A three-headed dog'], why: 'He met the same lion who was his friend.' },
  { q: 'What did the crowd cheer for?', a: 'Both the lion and Androcles to be freed', wrong: ['The lion to win', 'Androcles to be punished', 'The soldiers to win'], why: 'The crowd cheered for both the lion and Androcles to be freed.' },
  { q: 'Which myth is similar to Androcles and the Lion?', a: 'Damon & Pythias', wrong: ['Perseus & Medusa', 'The Sword of Damocles', 'Horatius and the Bridge'], why: 'Both are about loyalty and friendship: Damon & Pythias is the similar myth.' },
  { q: 'How do Androcles and the lion show loyalty?', a: 'Neither of them fights the other even though they are being told to', wrong: ['They run away together', 'They bow to the crowd', 'They fight the soldiers'], why: 'Neither of them fights the other even though they are being told to.' }
];

/* Sort it (added wording, from the sheet's answers). */
const SORTS = [
  { id: 'greek', label: 'Which Greek myth?', buckets: ['Jason', 'Perseus', 'Psyche'], items: [
    ['Raised by the centaur', 'Jason'], ['Lost one sandal in a river', 'Jason'], ['Sailed on the Argo with the Argonauts', 'Jason'], ['Sowed dragons’ teeth and got help from Medea', 'Jason'],
    ['Put in a chest and sent into the sea with his mother', 'Perseus'], ['Used a mirror to look at a Gorgon', 'Perseus'], ['Was told where to go by the Three Gray Sisters', 'Perseus'], ['Was given a brass shield and winged sandals', 'Perseus'],
    ['Married Cupid but did not know who he was', 'Psyche'], ['Turned on a lamp one night', 'Psyche'], ['Was helped by ants to sort the grain', 'Psyche'], ['Opened the box and fell into a deep sleep', 'Psyche']
  ] },
  { id: 'roman', label: 'Which story of friendship or power?', buckets: ['Damon and Pythias', 'The Sword of Damocles', 'Horatius', 'Androcles'], items: [
    ['Refused to bow down to Dionysus', 'Damon and Pythias'], ['“I trust my friend”', 'Damon and Pythias'], ['Went through a shipwreck and was robbed on the way back', 'Damon and Pythias'],
    ['Felt envy and jealousy toward the king', 'The Sword of Damocles'], ['A sword hung by a single horse hair', 'The Sword of Damocles'], ['The privilege of power brings dangers', 'The Sword of Damocles'],
    ['Stood up to the entire Etruscan army on his own', 'Horatius'], ['The Romans forgot to destroy the bridge over the Tiber River', 'Horatius'], ['Tarquin the Proud turned to the Etruscans', 'Horatius'],
    ['A runaway Roman slave', 'Androcles'], ['Pulled a thorn out of a lion’s paw', 'Androcles'], ['Met his friend the lion in the Colosseum', 'Androcles']
  ] },
  { id: 'gifts', label: 'Who gave Perseus the gift?', buckets: ['Athena', 'Hades', 'Hermes'], items: [
    ['Brass shield', 'Athena'], ['Helmet that makes Perseus invisible', 'Hades'], ['Sword that cuts through anything in one stroke', 'Hermes'], ['Winged sandals', 'Hermes']
  ] }
];

/* Put in order (added wording; the order follows the order of the sheet's questions). */
const ORDERS = [
  { id: 'jason', label: 'Jason', hint: 'The sheet’s questions, with the ointment first because it keeps him safe.', items: ['Jason loses one sandal in the river', 'Jason receives three impossible tasks', 'Medea gives Jason magic ointment to keep him safe', 'Jason sows dragons’ teeth and iron men spring out', 'Jason throws a stone in the middle of the iron soldiers', 'Jason gets past the dragon to retrieve the golden fleece'] },
  { id: 'perseus', label: 'Perseus', hint: 'The order of the sheet’s questions.', items: ['Perseus and his mother are put into a chest and sent into the sea', 'Perseus is given three gifts from the gods', 'The Three Gray Sisters tell Perseus where Medusa is', 'Perseus uses a mirror so he does not look Medusa in the eye'] },
  { id: 'psyche', label: 'Cupid & Psyche', hint: 'The order of the sheet’s questions.', items: ['Cupid shoots himself with his arrow and falls in love with Psyche', 'Psyche marries Cupid', 'Psyche turns on a lamp and Cupid disappears', 'Psyche goes to Venus for help', 'Ants help Psyche separate the grain', 'Psyche goes to the underworld to ask Proserpina for beauty', 'Psyche opens the box and goes into a deep sleep', 'Cupid saves Psyche, and she becomes immortal'] },
  { id: 'damon', label: 'Damon and Pythias', hint: 'The order of the sheet’s questions.', items: ['Pythias refuses to bow down to Dionysus', 'Pythias asks to go tell his family', 'Damon takes his place', 'Pythias goes through a shipwreck and is robbed', 'Pythias returns to accept his punishment', 'Dionysus sets them both free'] },
  { id: 'damocles', label: 'The Sword of Damocles', hint: 'The order of the sheet’s questions.', items: ['Damocles feels envy toward Dionysus', 'Dionysus says they should switch places for one day', 'Damocles feels great and has everything he could want', 'Damocles sees a sword hanging by a single horse hair', 'Damocles feels afraid, tense, and nervous'] }
];

/* Fill it in: sentences made from the sheet's answers, with a key word taken out. Blanks 1, 3 and 4 are printed on the sheet; the word "prophecy" is in bold there. */
const BLANKS = [
  ['Jason receives three impossible tasks. The first is to bring the ___ to Pelias.', ['golden fleece']],
  ['A ___ is a prediction of the future, that can often be a warning to the person it is about.', ['prophecy']],
  ['In the end, Psyche becomes ___.', ['immortal']],
  ['Dionysus says that the privilege of power brings ___.', ['dangers', 'danger']],
  ['Jason’s ship was called the ___.', ['Argo']],
  ['Jason’s crew-mates were called the ___.', ['Argonauts']],
  ['Medea gives Jason magic ___ to keep him safe.', ['ointment']],
  ['Jason shows the virtue of ___.', ['fortitude']],
  ['Perseus’ father is ___.', ['Zeus']],
  ['Medusa is a ___.', ['Gorgon']],
  ['The Three Gray Sisters share one ___.', ['eye']],
  ['Perseus uses a ___ so he does not look Medusa in the eye directly.', ['mirror']],
  ['Venus is ___ that people think Psyche is more beautiful than Venus.', ['jealous']],
  ['Psyche turns on a ___ when Cupid comes one night.', ['lamp']],
  ['___ help Psyche sort the grain.', ['ants']],
  ['Psyche goes to the underworld and asks ___ to send Venus some beauty.', ['Proserpina']],
  ['Pythias’ philosophy is that all people are ___.', ['equal']],
  ['Damon keeps saying “I ___ my friend.”', ['trust']],
  ['___ is standing by or standing up for someone, especially in the most difficult times.', ['loyalty']],
  ['A sword hangs over Damocles by a single ___ hair.', ['horse']],
  ['The sword is the ___ of the ever-present danger Dionysus feels.', ['symbol']],
  ['The Romans forgot to destroy the ___ over the Tiber River.', ['bridge']],
  ['Tarquin the Proud turned to the ___ for help.', ['Etruscans']],
  ['Androcles pulled a ___ out of the lion’s paw.', ['thorn']],
  ['Androcles was a runaway Roman ___.', ['slave']],
  ['Androcles was to fight a vicious animal in the ___.', ['Colosseum']]
];

/* Explain it: questions from the sheet's "Discuss" parts that have the teacher's answer; the model answer uses the teacher's wording. */
const EXPLAIN = [
  { q: 'Explain what it means to be heroic, and what help Perseus received.', teacher: true,
    model: 'Someone who is heroic rejoices in a challenge and is brave even when there is little or no hope. Perseus received help from the gods, and a hero accepts and uses his gifts wisely.',
    ideas: [
      { label: 'A hero rejoices in a challenge and is brave even when there is little hope', all: [['challenge', 'brave', 'courage', 'little or no hope', 'no hope']] },
      { label: 'Perseus received help from the gods', all: [['god', 'athena', 'hades', 'hermes', 'gift']] },
      { label: 'A hero accepts and uses his gifts wisely', all: [['accept', 'wise', 'wisely', 'uses his gifts', 'use his gifts', 'use the gifts', 'uses the gifts']] }
    ] },
  { q: 'Explain the lesson of The Sword of Damocles.', teacher: true,
    model: 'The lesson is that the privilege of power brings dangers. Dionysus has a duty to fulfill, and if he makes one mistake, he could lose his life and all of his power.',
    ideas: [
      { label: 'The privilege of power brings dangers', all: [['power'], ['danger']] },
      { label: 'Dionysus has a duty or responsibility, and one mistake could cost him his life and power', all: [['duty', 'responsib', 'mistake', 'lose his life', 'overthrow']] }
    ] },
  { q: 'Explain what loyalty and trust mean, and how Damon and Pythias show them.', teacher: true,
    model: 'Loyalty is standing by someone, especially in the most difficult times, and trust is believing someone will follow through even with no proof. Damon showed loyalty by continuing to trust Pythias, and Pythias showed loyalty by returning to accept his punishment.',
    ideas: [
      { label: 'Loyalty is standing by someone, especially in difficult times; trust is believing they will follow through', all: [['stand', 'standing', 'stands', 'by someone', 'by their side', 'follow through', 'believ']] },
      { label: 'Damon showed loyalty by continuing to trust Pythias', all: [['damon'], ['trust']] },
      { label: 'Pythias showed loyalty by returning to accept his punishment', all: [['pythias'], ['return', 'came back', 'come back', 'went back', 'punishment']] }
    ] },
  { q: 'Explain the main idea of Cupid & Psyche.', teacher: true,
    model: 'Curiosity can be dangerous if you do not control your urges, but the people around you can bring you back to your senses.',
    ideas: [
      { label: 'Curiosity can be dangerous if you do not control your urges', all: [['curios'], ['danger', 'bad', 'trouble', 'urge', 'control']] },
      { label: 'The people around you can bring you back to your senses', all: [['people', 'someone', 'others', 'cupid', 'friend', 'help'], ['senses', 'sense', 'save', 'help']] }
    ] },
  { q: 'Why did Jason begin his tasks, and what virtue did he show?', teacher: true,
    model: 'Jason began the tasks to win back his father’s kingdom from Pelias. He showed the virtue of fortitude.',
    ideas: [
      { label: 'He wanted to win back his father’s kingdom from Pelias', all: [['kingdom', 'father'], ['win', 'back', 'pelias', 'stole', 'took']] },
      { label: 'He showed fortitude', all: [['fortitude']] }
    ] }
];
