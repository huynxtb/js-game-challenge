#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Game constants
const MAX_TURNS = 20;
const TARGET_KNOWLEDGE_POINTS = 100;
const INITIAL_CHRONO_FUEL = 50;

// Time periods database
const timePeriods = [
  {
    name: 'Prehistoric Era',
    cost: 2,
    difficulty: 3,
    knowledgeReward: [5, 15],
    description:
      'Encounter early human ancestors and attempt to document primitive survival events.',
  },
  {
    name: 'Ancient Egypt (c. 3000 BCE)',
    cost: 4,
    difficulty: 5,
    knowledgeReward: [10, 20],
    description:
      'Witness the rise of pharaohs and monumental architecture to gather knowledge.',
  },
  {
    name: 'Classical Greece (c. 500 BCE)',
    cost: 6,
    difficulty: 6,
    knowledgeReward: [15, 25],
    description:
      'Document the birth of democracy, philosophy, and arts.',
  },
  {
    name: 'Medieval Europe (c. 1200 CE)',
    cost: 5,
    difficulty: 7,
    knowledgeReward: [20, 30],
    description:
      'Explore feudal kingdoms and the church’s influence to collect history.',
  },
  {
    name: 'Renaissance Era (c. 1500 CE)',
    cost: 7,
    difficulty: 8,
    knowledgeReward: [25, 35],
    description: 'Witness rebirth of art and science.',
  },
  {
    name: 'Industrial Revolution (c. 1800 CE)',
    cost: 8,
    difficulty: 9,
    knowledgeReward: [30, 40],
    description:
      'Observe rapid technological progress and social shifts.',
  },
  {
    name: 'Early 20th Century (c. 1910 CE)',
    cost: 10,
    difficulty: 11,
    knowledgeReward: [35, 50],
    description:
      'Explore the turmoil and innovation before and during WWI.',
  },
  {
    name: 'Space Age (c. 1969 CE)',
    cost: 12,
    difficulty: 13,
    knowledgeReward: [40, 55],
    description: 'Document the first moon landing and space exploration.',
  },
  {
    name: 'Near Future (c. 2050 CE)',
    cost: 15,
    difficulty: 15,
    knowledgeReward: [50, 70],
    description:
      'Venture close to your own time, with cutting-edge tech and unknown risks.',
  },
];

// Player state
let player = {
  chronoFuel: INITIAL_CHRONO_FUEL,
  knowledgePoints: 0,
  turnsLeft: MAX_TURNS,
  abilitiesUnlocked: [],
};

// Special abilities
const abilities = {
  "Fuel Saver": {
    description: 'Reduces chrono fuel cost of each jump by 1 (minimum 1).',
    active: false,
  },
  "Knowledge Booster": {
    description:
      'Increases knowledge points gained from events by 20%.',
    active: false,
  },
};

function applyAbilitiesToCost(cost) {
  if (abilities["Fuel Saver"].active) {
    return Math.max(1, cost - 1);
  }
  return cost;
}

function applyAbilitiesToKnowledge(points) {
  if (abilities["Knowledge Booster"].active) {
    return Math.ceil(points * 1.2);
  }
  return points;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function introduction() {
  console.log(`\nWelcome to Chrono Cartographer!`);
  console.log(
    'You are a time-traveling explorer mapping uncharted eras in human history.'
  );
  console.log(
    `Travel wisely, manage your Chrono Fuel, and document significant events to gain Knowledge Points.`
  );
  console.log(
    `Your goal: collect ${TARGET_KNOWLEDGE_POINTS} Knowledge Points within ${MAX_TURNS} time jumps.`
  );
  console.log(`Beware: running out of Chrono Fuel means losing the mission.`);
  console.log('Good luck!\n');
}

function printStatus() {
  console.log('----------------------------------');
  console.log(`Turns left: ${player.turnsLeft}`);
  console.log(`Chrono Fuel: ${player.chronoFuel}`);
  console.log(`Knowledge Points: ${player.knowledgePoints}`);
  if (player.abilitiesUnlocked.length > 0) {
    console.log(`Unlocked Abilities: ${player.abilitiesUnlocked.join(', ')}`);
  }
  console.log('----------------------------------');
}

function listTimePeriods() {
  console.log('\nAvailable Time Periods to Visit:');
  timePeriods.forEach((period, index) => {
    const effectiveCost = applyAbilitiesToCost(period.cost);
    console.log(
      `${index + 1}. ${period.name} - Chrono Fuel Cost: ${effectiveCost}, Difficulty: ${period.difficulty}
    Description: ${period.description}`
    );
  });
}

function chanceSuccess(playerKnowledge, difficulty) {
  // Using simple formula:
  // success chance is higher if player's knowledge near difficulty
  // chance = 50% + (knowledgePoints - difficulty*5)% capped between 10% and 90%
  const baseChance = 50;
  const modifier = playerKnowledge - difficulty * 5;
  let chance = baseChance + modifier;
  if (chance > 90) chance = 90;
  if (chance < 10) chance = 10;
  return chance;
}

function tryDocumentEvent(period) {
  const successChance = chanceSuccess(player.knowledgePoints, period.difficulty);
  const roll = getRandomInt(1, 100);
  if (roll <= successChance) {
    // Success
    let knowledgeGained = getRandomInt(...period.knowledgeReward);
    knowledgeGained = applyAbilitiesToKnowledge(knowledgeGained);
    player.knowledgePoints += knowledgeGained;
    console.log(
      `\nSuccess! You documented a major event from the ${period.name} and earned ${knowledgeGained} Knowledge Points.`
    );
    checkUnlockAbilities();
  } else {
    // Failure
    console.log(
      `\nYou failed to properly document events from the ${period.name}. No Knowledge Points gained.`
    );
  }
}

function checkUnlockAbilities() {
  if (
    player.knowledgePoints >= 30 &&
    !player.abilitiesUnlocked.includes("Fuel Saver")
  ) {
    player.abilitiesUnlocked.push("Fuel Saver");
    abilities["Fuel Saver"].active = true;
    console.log(
      '\n>>> Ability Unlocked: Fuel Saver - Chrono Fuel costs reduced by 1 on each jump.'
    );
  }
  if (
    player.knowledgePoints >= 70 &&
    !player.abilitiesUnlocked.includes("Knowledge Booster")
  ) {
    player.abilitiesUnlocked.push("Knowledge Booster");
    abilities["Knowledge Booster"].active = true;
    console.log(
      '\n>>> Ability Unlocked: Knowledge Booster - Knowledge Points gained increased by 20%.'
    );
  }
}

function promptUser() {
  if (player.turnsLeft === 0) {
    console.log('\nNo turns left!');
    determineOutcome();
    return rl.close();
  }
  if (player.chronoFuel <= 0) {
    console.log('\nYou have run out of Chrono Fuel! Mission failed.');
    return rl.close();
  }

  printStatus();
  listTimePeriods();

  rl.question(
    '\nChoose a time period to visit by entering its number (e.g., 1): ',
    (answer) => {
      const choice = Number(answer.trim());
      if (
        Number.isNaN(choice) ||
        choice < 1 ||
        choice > timePeriods.length ||
        !Number.isInteger(choice)
      ) {
        console.log('Invalid selection. Please enter a valid option number.');
        promptUser();
        return;
      }
      handleTurn(choice - 1);
    }
  );
}

function handleTurn(index) {
  const period = timePeriods[index];
  const cost = applyAbilitiesToCost(period.cost);
  if (cost > player.chronoFuel) {
    console.log(
      `\nInsufficient Chrono Fuel for this jump. You have ${player.chronoFuel}, but need ${cost}. Choose another time period.`
    );
    promptUser();
    return;
  }

  player.chronoFuel -= cost;
  player.turnsLeft -= 1;

  console.log(
    `\nJumping to ${period.name}... (Fuel cost: ${cost})\n${period.description}`
  );

  tryDocumentEvent(period);

  if (player.knowledgePoints >= TARGET_KNOWLEDGE_POINTS) {
    console.log(
      `\nCongratulations! You have accumulated ${player.knowledgePoints} Knowledge Points and completed your mission!`
    );
    rl.close();
    return;
  }

  if (player.turnsLeft === 0) {
    console.log('\nYou have used all your jumps.');
    determineOutcome();
    rl.close();
    return;
  }

  if (player.chronoFuel <= 0) {
    console.log('\nYou have run out of Chrono Fuel! Mission failed.');
    rl.close();
    return;
  }
  promptUser();
}

function determineOutcome() {
  console.log('----------------------------------');
  if (player.knowledgePoints >= TARGET_KNOWLEDGE_POINTS) {
    console.log(
      `Mission Success! You accumulated ${player.knowledgePoints} Knowledge Points.`
    );
  } else if (player.chronoFuel <= 0) {
    console.log(
      `Mission Failed: You ran out of Chrono Fuel with only ${player.knowledgePoints} Knowledge Points.`
    );
  } else {
    console.log(
      `Mission Failed: You ended the journey with only ${player.knowledgePoints} Knowledge Points.`
    );
  }
  console.log('Thank you for playing Chrono Cartographer!');
}

function startGame() {
  introduction();
  promptUser();
}

startGame();
