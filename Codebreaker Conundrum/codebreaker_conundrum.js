const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const puzzles = [
  { question: 'What is 2 + 2?', answer: '4' },
  { question: 'What is the output of console.log(\"Hello, World!\")?', answer: 'Hello, World!' },
  { question: 'What is the result of [1, 2, 3].map(x => x * 2)?', answer: '[2, 4, 6]' },
  { question: 'What is the output of \"5\" + 5?', answer: '55' },
  { question: 'What does the following code return? (function() { return 1; })()', answer: '1' },
  { question: 'What is the value of x after this code: let x = 5; x += 2;', answer: '7' },
  { question: 'What is the output of [1, 2, 3].filter(x => x > 1)?', answer: '[2, 3]' },
  { question: 'What is the result of (true && false)?', answer: 'false' },
  { question: 'What is the output of \"abc\".charAt(1)?', answer: 'b' },
  { question: 'What does JSON.stringify({ a: 1 }) return?', answer: '{"a":1}' }
];

let turns = 5;
let currentPuzzle = 0;
let score = 0;

function askPuzzle() {
  if (currentPuzzle < puzzles.length && turns > 0) {
    console.log(`Puzzle ${currentPuzzle + 1}: ${puzzles[currentPuzzle].question}`);
    rl.question('Your answer: ', (answer) => {
      if (answer.trim() === puzzles[currentPuzzle].answer) {
        console.log('Correct! You earned an extra turn.');
        score++;
        turns++;
      } else {
        console.log('Incorrect!');
        turns--;
      }
      currentPuzzle++;
      askPuzzle();
    });
  } else {
    endGame();
  }
}

function endGame() {
  console.log(`Game Over! You solved ${score} puzzles.`);
  rl.close();
}

console.log('Welcome to Codebreaker Conundrum! Solve the puzzles to earn turns.');
askPuzzle();