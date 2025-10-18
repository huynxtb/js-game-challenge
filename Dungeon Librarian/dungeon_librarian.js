const readline = require('readline');

/**
 * Game: Dungeon Librarian
 * 
 * Objective:
 *   Survive and explore the mysterious dungeon library, collect ancient tomes,
 *   solve riddles, and uncover the ultimate lost knowledge to win.
 *
 * Core Mechanics:
 *   - Turn-based exploration in a text-based dungeon library.
 *   - Resource management: energy and sanity.
 *   - Collecting tomes that provide lore or benefits.
 *   - Puzzle challenges in the form of riddles to proceed through the library.
 *   - Random events such as traps, helpful spirits, or cursed pages.
 *
 * Win/Loss Conditions:
 *   Win: Find and read the "Codex Ultima" tome, the ultimate lost knowledge, before running out of energy or sanity.
 *   Lose: Energy or sanity falls to zero or below.
 *
 * Implementation:
 *   Single file Node.js console game.
 *   Clear prompts and text feedback.
 *   Uses built-in readline module for input.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Utility
function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Game Data
const rooms = [
  {
    description: 'You stand in a grand hall lined with towering shelves filled with dusty books. Flickering candlelight barely illuminates the worn stone floor.',
    hasTome: false,
    riddle: null,
    event: null
  },
  {
    description: 'A spiral staircase winds up into darkness and down into shadows. Several ancient manuscripts lie scattered on a table.',
    hasTome: true,
    tomeName: 'Tome of Forgotten Secrets',
    riddle: {
      question: 'I speak without a mouth and hear without ears. I have nobody, but I come alive with the wind. What am I?',
      answer: 'echo'
    },
    event: null
  },
  {
    description: 'Rows of glass cases hold fragile scrolls and cryptic charts. A chill runs through your spine as ghostly whispers echo.',
    hasTome: false,
    riddle: null,
    event: 'sanityTrap'
  },
  {
    description: 'This chamber glows faintly blue. A magical guardian spirit offers you a blessing if you answer a question.',
    hasTome: true,
    tomeName: 'Tome of Mental Clarity',
    riddle: {
      question: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?',
      answer: 'river'
    },
    event: 'blessing'
  },
  {
    description: 'An alcove filled with crumbling books and scattered pages. A mysterious dark tome rests on a pedestal.',
    hasTome: true,
    tomeName: 'Codex Ultima', // Winning tome
    riddle: {
      question: 'I have cities but no houses, forests but no trees, and rivers but no water. What am I?',
      answer: 'map'
    },
    event: 'curse'
  }
];

// Player State
let player = {
  position: 0,
  energy: 10,
  sanity: 10,
  tomesCollected: [],
  hasReadCodexUltima: false
};

async function gameIntro() {
  console.log(`\nWelcome to Dungeon Librarian!`);
  console.log(`You have entered an ancient, mystical library dungeon filled with tomes of great power.`);
  console.log(`Explore the rooms, collect tomes, and solve riddles to uncover the ultimate lost knowledge.`);
  console.log(`Beware — your energy and sanity are limited. If either reaches zero, you are lost in the maze forever.`);
  console.log(`Your goal is to find and read the legendary "Codex Ultima" tome.`);
  console.log(`\nControls:`);
  console.log(`  - Type 'n' to move to the next room.
  - Type 'p' to move to the previous room.
  - Type 'r' to read a tome if present in the room.
  - Type 's' to show your status.
  - Type 'q' to quit the game.
`);
}

function showStatus() {
  console.log(`\n=== Status ===`);
  console.log(`Location: Room #${player.position + 1} of ${rooms.length}`);
  console.log(`Energy: ${player.energy}`);
  console.log(`Sanity: ${player.sanity}`);
  console.log(`Tomes Collected: ${player.tomesCollected.length > 0 ? player.tomesCollected.join(', ') : 'None'}`);
  console.log(`==============\n`);
}

async function handleRiddle(riddle) {
  console.log(`You encounter a riddle to access this tome:`);
  console.log(`"${riddle.question}"`);
  for (let attempts = 3; attempts > 0; attempts--) {
    let answer = await prompt(`Your answer (attempts left ${attempts}): `);
    answer = answer.trim().toLowerCase();
    if (answer === riddle.answer) {
      console.log(`Correct! You may read the tome.`);
      return true;
    } else {
      console.log(`Incorrect.`);
    }
  }
  console.log(`You've failed to solve the riddle. This drains your sanity.`);
  player.sanity -= 2;
  return false;
}

function applyEvent(event) {
  if (!event) return;
  switch (event) {
    case 'sanityTrap':
      console.log(`A whispering voice invades your mind, unsettling you.`);
      player.sanity -= 3;
      break;
    case 'blessing':
      console.log(`The guardian spirit's blessing restores some of your energy.`);
      player.energy = Math.min(player.energy + 3, 10);
      break;
    case 'curse':
      console.log(`Dark energies sap your energy.`);
      player.energy -= 3;
      break;
  }
}

async function readTome(room) {
  if (!room.hasTome) {
    console.log(`There is no tome to read here.`);
    return;
  }
  if (player.tomesCollected.includes(room.tomeName)) {
    console.log(`You have already collected this tome.`);
    return;
  }
  const correct = await handleRiddle(room.riddle);
  if (correct) {
    player.tomesCollected.push(room.tomeName);
    if (room.tomeName === 'Codex Ultima') {
      player.hasReadCodexUltima = true;
    }
  }
}

async function gameLoop() {
  while (true) {
    const room = rooms[player.position];
    console.log(`\n--- Room #${player.position + 1} ---`);
    console.log(room.description);

    applyEvent(room.event);

    // Every turn costs 1 energy
    player.energy -= 1;

    if (player.energy <= 0 || player.sanity <= 0) {
      console.log(`\nYour mind and body can no longer endure the dungeon's toll.`);
      console.log(`You have lost the Dungeon Librarian quest...`);
      break;
    }

    if (player.hasReadCodexUltima) {
      console.log(`\nYou have unearthed and comprehended the "Codex Ultima"!`);
      console.log(`You have won the Dungeon Librarian quest, mastering ancient knowledge! Congratulations!`);
      break;
    }

    const cmd = (await prompt(`\nWhat do you want to do? (n=next, p=previous, r=read tome, s=status, q=quit): `)).trim().toLowerCase();

    if (cmd === 'n') {
      if (player.position < rooms.length - 1) {
        player.position++;
      } else {
        console.log(`You have reached the end of the dungeon library corridor.`);
      }
    } else if (cmd === 'p') {
      if (player.position > 0) {
        player.position--;
      } else {
        console.log(`You are at the entrance; you cannot go back further.`);
      }
    } else if (cmd === 'r') {
      await readTome(room);
    } else if (cmd === 's') {
      showStatus();
    } else if (cmd === 'q') {
      console.log(`Goodbye, adventurer!`);
      break;
    } else {
      console.log(`Invalid command. Please enter n, p, r, s, or q.`);
    }
  }
  rl.close();
}

async function main() {
  await gameIntro();
  await gameLoop();
}

main();
