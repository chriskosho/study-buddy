/* Unit 4, Lesson 8: Scientific Inquiry and Engineering. Made from pages 62 to 70 and Quiz 3 of the student's 5th Grade Science,
   Unit 4, Force and Motion (Responsive Education Solutions). The study guide keeps the book's wording (only shortened), both lists of
   steps, and the Mia and Jaden helmet example. The Quiz, Sort it, Put in order and Explain it questions come from the book's review
   questions (8.1 to 8.9) and Quiz 3; questions with several right answers are rewritten as one multiple-choice question. The
   Activity "Evaluating Engineering Designs" needs the student's own catapult and has no answers in the book, so it is not graded here.
   A separate reviewer compares this file with the book pages. */
const LESSON = {
  id: 'inquiry-engineering',
  title: 'Unit 4, Lesson 8: Scientific Inquiry and Engineering',
  source: 'This guide follows the wording of your book (Unit 4, Lesson 8, pages 62 to 70). The pictures are in your book.',
  sections: [
    { id: 'two', title: 'Scientists and engineers', text: [
        'Scientists and engineers are two kinds of people who each use their knowledge to learn about the world and solve problems. Scientists use scientific inquiry to ask questions, do research, and make observations. Engineers use their knowledge of science and math to design and build things.',
        'To solve problems, scientists and engineers work together. Scientists might study the properties of materials, and engineers might use that information to design new products. They work together in fields like medicine, transportation, and energy.'],
      key: ['Scientists use scientific inquiry.', 'Engineers use science and math to design and build things.', 'They both use their knowledge to learn about the world and to solve problems.'] },
    { id: 'inquiry', title: 'Scientific inquiry', text: [
        'Scientists use a process called scientific inquiry to learn about the world around them. It involves asking questions, gathering evidence, and drawing conclusions. The steps are: 1. Ask a question. 2. Do research. 3. Make a hypothesis. 4. Test the hypothesis. 5. Analyze the results. 6. Draw a conclusion.',
        'Scientists start by asking a question about something they observe in the world around them, like “Why do leaves change color in the fall?” They do research by reading books, articles, or websites, or by talking to other scientists. Based on their research, they form a hypothesis about what they think will happen. They test it with a controlled experiment, where only one thing changes at a time. Then they analyze the results by looking at the data and trying to figure out what it means. Last, they draw a conclusion based on their data, and use the data to answer their original question.'],
      key: ['Ask a question → do research → make a hypothesis → test it → analyze the results → draw a conclusion.', 'A controlled experiment changes only one thing at a time.'] },
    { id: 'engineering', title: 'Engineering', text: [
        'Engineering is the use of science and math to design and build things. Engineers design many things, like bridges, buildings, and cars. They also design new medical devices and technologies that can help people stay healthy.',
        'Engineers use a process similar to scientific inquiry: the engineering design process. The steps are: 1. Identify a problem or need. 2. Research existing solutions. 3. Brainstorm ideas. 4. Design and prototype a solution. 5. Test and evaluate the solution. 6. Improve the design. 7. Communicate the results.'],
      key: ['Identify a problem or need → research existing solutions → brainstorm ideas → design and prototype a solution → test and evaluate → improve the design → communicate the results.'] },
    { id: 'steps', title: 'The engineering steps', text: [
        'In step 2, engineers read books, articles, or websites, or talk to other engineers. Brainstorming is a creative process: come up with as many ideas as possible, even if the ideas seem unlikely or odd at first.',
        'To design and prototype a solution, engineers create a model of the solution to see if it will work. To test and evaluate the solution, they try it out and see if it works the way they want it to. To improve the design, they make changes to the solution based on the results of their testing. Last, they communicate the results to others by writing a report, giving a presentation, or publishing an article.'],
      key: ['A prototype is a model of the solution.', 'Brainstorm: as many ideas as possible, even odd ones.', 'Communicate the results in a report, a presentation, or an article.'] },
    { id: 'helmet', title: 'Example: a new bike helmet', text: [
        'Two fifth graders, Mia and Jaden, saw a car accident while riding bikes home from school. A cyclist was hit by a car. The cyclist was not wearing a helmet and had a serious head injury. They decided to help prevent head injuries among cyclists.',
        'Identify a problem or need: the cyclist was not wearing a helmet. Research: many different bike helmets exist, but many cyclists choose not to wear helmets because they can be uncomfortable or inconvenient. Brainstorm: a new type of bike helmet that is more comfortable and convenient but still protects. Design and prototype: they chose one idea and made changes until they were satisfied. Test and evaluate: they dropped it from different heights onto different surfaces, and friends wore it to check fit and comfort. Improve the design: they made the helmet more comfortable so it fit more snugly, and made it more durable. Communicate: they gave a presentation to their class.'],
      key: ['The need: a bike helmet that is comfortable and convenient to wear.'] }
  ],
  vocab: [
    ['scientific inquiry', 'the process that scientists use to learn about the world around them'],
    ['engineering', 'the use of science and math to design and build things'],
    ['engineering design process', 'the process engineers use to design and build things'],
    ['hypothesis', 'what scientists think will happen, based on their research'],
    ['controlled experiment', 'a test where only one thing changes at a time'],
    ['prototype', 'a model of a solution, to see if it will work'],
    ['efficient', 'describing something that is done in the best possible way in the least amount of time']
  ],
  quiz: [
    { q: 'What is the process that scientists use to learn about the world around them?', a: 'Scientific inquiry', wrong: ['Engineering design process', 'Scientific calculation', 'Social media'], why: 'It involves asking questions, gathering evidence, and drawing conclusions.' },
    { q: 'What are the steps of scientific inquiry?', a: 'Ask a question, do research, make a hypothesis, test the hypothesis, analyze the results, and draw a conclusion', wrong: ['Identify a problem or need, research existing solutions, brainstorm ideas, design and prototype a solution, test and evaluate, improve the design, and communicate the results', 'Guess, build, break, and repeat', 'Read, write, and share'], why: 'The second list is the steps of the engineering design process.' },
    { q: 'What is the process that engineers use to design and build things?', a: 'Engineering design process', wrong: ['Scientific inquiry', 'Scientific calculation', 'Hypothesis testing'], why: 'Engineers use a process similar to scientific inquiry.' },
    { q: 'What is the first step of the engineering design process?', a: 'Identify a problem or need', wrong: ['Communicate the results', 'Test and evaluate the solution', 'Improve the design'], why: 'The engineers in the example started by noticing that a cyclist was not wearing a helmet.' },
    { q: 'What is the final step of the engineering design process?', a: 'Communicate the results', wrong: ['Identify a problem or need', 'Brainstorm ideas', 'Design and prototype a solution'], why: 'They tell others by writing a report, giving a presentation, or publishing an article.' },
    { q: 'Which step comes immediately before researching existing solutions in the engineering design process?', a: 'Identify a problem or need', wrong: ['Design and prototype', 'Brainstorm ideas', 'Test and evaluate'], why: 'The order starts: identify a problem or need, then research existing solutions.' },
    { q: 'What need did Mia and Jaden identify after seeing the accident?', a: 'A new bike helmet that is comfortable and convenient to wear', wrong: ['A new kind of bicycle', 'A way to stop cars', 'A new road'], why: 'Many cyclists choose not to wear helmets because they can be uncomfortable or inconvenient.' },
    { q: 'Which of these is a similarity between scientists and engineers?', a: 'They both use their knowledge to learn about the world and to solve problems', wrong: ['They both design and build things', 'They both use the engineering design process', 'They both work only alone'], why: 'Engineers design and build things. Scientists use scientific inquiry.' },
    { q: 'Which of these is something engineers design?', a: 'Bridges', wrong: ['Hypotheses', 'Experiments only', 'The sun'], why: 'Engineers design bridges, buildings, and cars.' },
    { q: 'Which of these do engineers do to solve problems?', a: 'They test and evaluate the effectiveness of prototypes', wrong: ['They use scientific inquiry to ask questions, do research, and make observations', 'They avoid science and math', 'They never change their designs'], why: 'The scientific inquiry choice describes what scientists do.' },
    { q: 'What is a hypothesis?', a: 'What scientists think will happen, based on their research', wrong: ['The final answer to a question', 'A model of a solution', 'A list of results'], why: 'In step 3 of scientific inquiry, scientists make a hypothesis.' },
    { q: 'What is a controlled experiment?', a: 'A test where only one thing changes at a time', wrong: ['A test where everything changes at once', 'A test with no data', 'A guess'], why: 'Scientists test the hypothesis by doing a controlled experiment.' },
    { q: 'What is a prototype?', a: 'A model of a solution, to see if it will work', wrong: ['The last step of a report', 'A kind of hypothesis', 'A tool for measuring force'], why: 'Engineers design and prototype a solution in step 4.' },
    { q: 'What do engineers do when they brainstorm?', a: 'Come up with as many ideas as possible, even odd ones', wrong: ['Pick the first idea', 'Copy an old design', 'Test the final design'], why: 'Brainstorming is a creative process.' },
    { q: 'What do engineers do in the step “improve the design”?', a: 'Make changes to the solution based on the results of their testing', wrong: ['Start over with a new problem', 'Write the final report', 'Ask a question'], why: 'Mia and Jaden made the helmet more comfortable and more durable.' },
    { q: 'Which is part of the Problem-Solving Toolbox?', a: 'Imagination', wrong: ['Guessing', 'Giving up', 'Speed'], why: 'The toolbox includes imagination, persistence, creativity, patience, counsel, and brainstorming.' },
    { q: 'A child kicks a ball that is rolled to her, and its direction changes. Is work being done?', a: 'Yes, because force changes the direction the ball is moving', wrong: ['No, because the ball is small', 'No, because she did not push hard', 'Yes, because the ball is rolling'], why: 'Work is the use of force to move an object or change the direction it is moving.' },
    { q: 'An axe has a long handle (lever) and a sharp blade (wedge). What is it used for?', a: 'Chopping wood', wrong: ['Pulling a load', 'Opening a door', 'Measuring weight'], why: 'This is the axe from Table 7.1.' }
  ],
  orders: [
    { id: 'inquiry', label: 'Scientific inquiry', hint: 'Put the six steps of scientific inquiry in order.',
      items: ['Ask a question', 'Do research', 'Make a hypothesis', 'Test the hypothesis', 'Analyze the results', 'Draw a conclusion'] },
    { id: 'design', label: 'Engineering design process', hint: 'Put the seven steps of the engineering design process in order.',
      items: ['Identify a problem or need', 'Research existing solutions', 'Brainstorm ideas', 'Design and prototype a solution', 'Test and evaluate the solution', 'Improve the design', 'Communicate the results'] }
  ],
  sorts: [
    { id: 'who', label: 'Scientists or engineers?', buckets: [{ id: 's', name: 'Scientists' }, { id: 'e', name: 'Engineers' }],
      items: [
        ['Use scientific inquiry to ask questions, do research, and make observations', 's'], ['Make a hypothesis and test it with a controlled experiment', 's'], ['Draw a conclusion from the data', 's'],
        ['Use science and math to design and build things', 'e'], ['Make a prototype of a solution', 'e'], ['Design bridges, buildings, and cars', 'e'], ['Test and evaluate the effectiveness of prototypes', 'e']] },
    { id: 'step', label: 'Which process does the step belong to?', buckets: [{ id: 'i', name: 'Scientific inquiry' }, { id: 'd', name: 'Engineering design process' }],
      items: [
        ['Make a hypothesis', 'i'], ['Analyze the results', 'i'], ['Draw a conclusion', 'i'],
        ['Identify a problem or need', 'd'], ['Brainstorm ideas', 'd'], ['Design and prototype a solution', 'd'], ['Improve the design', 'd'], ['Communicate the results', 'd']] }
  ],
  explain: [
    { q: 'Explain how scientists and engineers are alike and how they are different.',
      model: 'Scientists and engineers both use their knowledge to learn about the world and to solve problems. Scientists use scientific inquiry to ask questions, do research, and make observations. Engineers use science and math to design and build things.',
      ideas: [
        { label: 'Alike: both use their knowledge to learn and to solve problems', all: [['knowledge'], ['solve', 'learn']] },
        { label: 'Scientists ask questions and do research', all: [['scientist'], ['question', 'research', 'inquiry', 'observ']] },
        { label: 'Engineers design and build things', all: [['engineer'], ['design', 'build']] }] },
    { q: 'List the steps of scientific inquiry in order.',
      model: 'First, ask a question. Then do research. Then make a hypothesis. Then test the hypothesis. Then analyze the results. Last, draw a conclusion.',
      ideas: [
        { label: 'Ask a question and do research', all: [['question'], ['research']] },
        { label: 'Make a hypothesis and test it', all: [['hypothesis'], ['test']] },
        { label: 'Analyze the results and draw a conclusion', all: [['analyz'], ['conclusion']] }] },
    { q: 'Describe the engineering design process, starting with the first step and ending with the last.',
      model: 'Engineers identify a problem or need, research existing solutions, and brainstorm ideas. Then they design and prototype a solution, test and evaluate it, and improve the design. Last, they communicate the results.',
      ideas: [
        { label: 'Identify a problem or need, research, and brainstorm', all: [['problem', 'need'], ['research'], ['brainstorm']] },
        { label: 'Design and prototype, test and evaluate', all: [['prototype', 'design'], ['test', 'evaluate']] },
        { label: 'Improve the design and communicate the results', all: [['improve'], ['communicate']] }] },
    { q: 'How did Mia and Jaden use the engineering design process to make a new bike helmet?',
      model: 'They saw a cyclist with no helmet get hurt, so they identified the problem. They researched helmets, brainstormed a more comfortable one, built a prototype, tested it, improved it to fit snugly, and gave a presentation to their class.',
      ideas: [
        { label: 'They identified the problem: no helmet, head injury', all: [['helmet'], ['problem', 'need', 'injur', 'accident']] },
        { label: 'They designed, built, and tested a prototype', all: [['prototype', 'design', 'build', 'made', 'model'], ['test', 'drop']] },
        { label: 'They improved it and told others', all: [['improve', 'comfortable', 'durable', 'snug'], ['present', 'communicat', 'class', 'told', 'share']] }] }
  ]
};
