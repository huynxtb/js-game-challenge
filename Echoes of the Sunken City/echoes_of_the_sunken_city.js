const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const map = [
  ['S', '.', '.', 'A', '.', 'H'],
  ['.', 'C', '.', '.', 'A', '.'],
  ['.', '.', 'H', '.', '.', '.'],
  ['A', '.', '.', 'C', '.', 'A'],
  ['.', '.', '.', '.', 'H', '.'],
  ['.', 'A', '.', '.', '.', 'E']
];

const player = {
  x: 0,
  y: 0,
  oxygen: 100,
  hullIntegrity: 100,
  power: 50,
  artifacts: [],
  score: 0
};

const artifactValues = {
  'A': 300,
  'C': 200,
  'H': 100,
  'E': 500
};

function displayMap() {
  console.log('\nCurrent Map:');
  map.forEach((row, rowIndex) => {
    const displayRow = row.map((cell, colIndex) => {
      if (player.x === colIndex && player.y === rowIndex) return 'P';
      return cell;
    }).join(' ');
    console.log(displayRow);
  });
}

function checkWinCondition() {
  if (player.score >= 1000 && player.x === 0 && player.y === 0) {
    console.log('Congratulations! You have successfully returned to the surface with enough artifacts!');
    process.exit();
  }
}

function checkLossCondition() {
  if (player.oxygen <= 0) {
    console.log('You have run out of oxygen! Game Over.');
    process.exit();
  }
  if (player.hullIntegrity <= 0) {
    console.log('Your submersible has been destroyed! Game Over.');
    process.exit();
  }
  if (player.power <= 0) {
    console.log('Your submersible has lost all power! Game Over.');
    process.exit();
  }
}

function collectArtifact() {
  const cell = map[player.y][player.x];
  if (artifactValues[cell]) {
    player.artifacts.push(cell);
    player.score += artifactValues[cell];
    console.log(`Collected artifact: ${cell}. Score: ${player.score}`);
    map[player.y][player.x] = '.'; // Remove artifact from map
  } else {
    console.log('No artifact to collect here.');
  }
}

function move(direction) {
  const oldX = player.x;
  const oldY = player.y;
  if (direction === 'up' && player.y > 0) player.y--;
  else if (direction === 'down' && player.y < map.length - 1) player.y++;
  else if (direction === 'left' && player.x > 0) player.x--;
  else if (direction === 'right' && player.x < map[0].length - 1) player.x++;
  else {
    console.log('Invalid move!');
    return;
  }
  player.oxygen -= 5;
  checkLossCondition();
  collectArtifact();
  displayMap();
}

function scan() {
  if (player.power >= 10) {
    player.power -= 10;
    console.log('Scanning adjacent tiles...');
    // Simple scan logic
    const adjacent = [];
    if (player.y > 0) adjacent.push(map[player.y - 1][player.x]);
    if (player.y < map.length - 1) adjacent.push(map[player.y + 1][player.x]);
    if (player.x > 0) adjacent.push(map[player.y][player.x - 1]);
    if (player.x < map[0].length - 1) adjacent.push(map[player.y][player.x + 1]);
    console.log('Adjacent tiles:', adjacent);
  } else {
    console.log('Not enough power to scan!');
  }
}

function gameLoop() {
  checkLossCondition();
  rl.question('Choose action (move [up/down/left/right], scan, surface): ', (action) => {
    const [command, direction] = action.split(' ');
    if (command === 'move') {
      move(direction);
    } else if (command === 'scan') {
      scan();
    } else if (command === 'surface') {
      checkWinCondition();
      console.log('You have surfaced!');
      process.exit();
    } else {
      console.log('Invalid command!');
    }
    gameLoop();
  });
}

displayMap();
gameLoop();