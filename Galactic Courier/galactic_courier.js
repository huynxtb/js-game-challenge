const readline = require('readline');

// Galactic Courier - Single file Node.js console game
// Author: OpenAI GPT

// Game Constants and Setup
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const HOME_BASE = 'Terra';

// Planets with their neighbors and fuel cost to travel
const galaxyMap = {
  Terra: { neighbors: { Nova: 5, Orion: 6 }, description: 'Your home base, the core of the galaxy.' },
  Nova: { neighbors: { Terra: 5, Vega: 3, Rigel: 7 }, description: 'A young star system known for its vibrant trade.' },
  Orion: { neighbors: { Terra: 6, Sirius: 4 }, description: 'A system with dense asteroid fields.' },
  Vega: { neighbors: { Nova: 3, Altair: 4 }, description: 'Bright star system with multiple moons.' },
  Rigel: { neighbors: { Nova: 7, Altair: 5 }, description: 'Known for its unstable volcanic planets.' },
  Altair: { neighbors: { Vega: 4, Rigel: 5, Sirius: 6 }, description: 'A hub for many space travelers.' },
  Sirius: { neighbors: { Orion: 4, Altair: 6 }, description: 'Famous for pirate activity in nearby space.' }
};

// Package priorities and their base rewards
const PRIORITY_LEVELS = {
  Low: { reward: 50, deadlineBuffer: 15 },
  Medium: { reward: 100, deadlineBuffer: 10 },
  High: { reward: 200, deadlineBuffer: 6 }
};

// Game Parameters
const START_FUEL = 50;
const MAX_TURNS = 50; // maximum time considered (turns)

// Utility Functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printLine() {
  console.log('-----------------------------------------------------');
}

// Game State
const state = {
  currentPlanet: HOME_BASE,
  fuel: START_FUEL,
  turn: 0,
  packages: [],
  deliveredPackages: 0,
  shipIntegrity: 100,
  totalReward: 0,
  log: []
};

// Package generator
function generatePackages() {
  // Create 5 packages with random destinations and priorities
  const planets = Object.keys(galaxyMap).filter(p => p !== HOME_BASE);
  let packages = [];
  for (let i = 1; i <= 5; i++) {
    const destination = randomChoice(planets);
    const priorityKeys = Object.keys(PRIORITY_LEVELS);
    const priority = randomChoice(priorityKeys);
    const deadline = PRIORITY_LEVELS[priority].deadlineBuffer + 5; // extra time for travel risk
    packages.push({
      id: i,
      destination: destination,
      priority: priority,
      deadline: deadline,
      reward: PRIORITY_LEVELS[priority].reward,
      delivered: false
    });
  }
  return packages;
}

// Display current status
function displayStatus() {
  printLine();
  console.log(`Turn: ${state.turn}`);
  console.log(`Current Location: ${state.currentPlanet}`);
  console.log(`Fuel Remaining: ${state.fuel}`);
  console.log(`Ship Integrity: ${state.shipIntegrity}%`);
  console.log(`Packages to Deliver:`);
  state.packages.forEach(pkg => {
    if (!pkg.delivered) {
      console.log(`  [#${pkg.id}] To ${pkg.destination} | Priority: ${pkg.priority} | Deadline in: ${pkg.deadline} turn(s)`);
    }
  });
  if (state.packages.every(p => p.delivered)) {
    console.log('All packages delivered! Return to Terra to finish the mission.');
  }
  printLine();
}

function isGameWon() {
  return state.packages.every(p => p.delivered) && state.currentPlanet === HOME_BASE;
}

function isGameLost() {
  if (state.fuel <= 0) {
    state.log.push('You have run out of fuel and are stranded in space.');
    return true;
  }
  if (state.shipIntegrity <= 0) {
    state.log.push('Your ship has been destroyed.');
    return true;
  }
  if (state.packages.some(p => !p.delivered && p.deadline < 0)) {
    state.log.push('You have missed a package delivery deadline.');
    return true;
  }
  if(state.turn > MAX_TURNS){
    state.log.push('Too much time has passed and your mission timed out.');
    return true;
  }
  return false;
}

// Random space events
function spaceEvent() {
  // We roll for an event: 20% chance each turn
  const roll = Math.random();
  if (roll < 0.2) {
    // Determine event type
    const eventTypeRoll = Math.random();
    if (eventTypeRoll < 0.4) {
      // Pirate attack
      console.log('\n--- Space Event: Pirate Attack! ---');
      let damage = Math.floor(Math.random() * 30) + 10;
      let lossFuel = Math.floor(Math.random() * 10) + 5;
      console.log(`Pirates attack! Ship takes ${damage}% damage and you lose ${lossFuel} fuel trying to evade.`);
      state.shipIntegrity -= damage;
      state.fuel = Math.max(0, state.fuel - lossFuel);
      if(state.shipIntegrity < 0) state.shipIntegrity = 0;
    } else if (eventTypeRoll < 0.7) {
      // Meteor storm
      console.log('\n--- Space Event: Meteor Storm! ---');
      let damage = Math.floor(Math.random() * 20) + 5;
      let fuelLoss = Math.floor(Math.random() * 5) + 3;
      console.log(`A meteor storm damages your ship for ${damage}% and consumes ${fuelLoss} extra fuel.`);
      state.shipIntegrity -= damage;
      state.fuel = Math.max(0, state.fuel - fuelLoss);
      if(state.shipIntegrity < 0) state.shipIntegrity = 0;
    } else {
      // Engine malfunction
      console.log('\n--- Space Event: Engine Malfunction! ---');
      let extraFuel = Math.floor(Math.random() * 10) + 5;
      console.log(`Your engines sputter and consume extra ${extraFuel} fuel this turn.`);
      state.fuel = Math.max(0, state.fuel - extraFuel);
    }
  } else {
    // No event
  }
}

// Travel function
async function travelTo(destination) {
  const distance = galaxyMap[state.currentPlanet].neighbors[destination];
  if (distance === undefined) {
    console.log('You cannot travel directly to that planet from your current location.');
    return false;
  }
  if (state.fuel < distance) {
    console.log('Not enough fuel to reach that planet.');
    return false;
  }

  console.log(`\nTraveling from ${state.currentPlanet} to ${destination}... Distance (fuel cost): ${distance}`);
  // Consume fuel for travel
  state.fuel -= distance;
  
  // Advance time
  state.turn++;

  // Space hazards may occur
  spaceEvent();

  if (state.fuel <= 0) {
    console.log('You have run out of fuel during the travel.');
  }
  if (state.shipIntegrity <= 0) {
    console.log('Your ship has been destroyed during the travel.');
  }

  // Arrive at new planet
  state.currentPlanet = destination;
  
  // Check package deliveries
  let deliveredThisTurn = 0;
  state.packages.forEach(pkg => {
    if (!pkg.delivered && pkg.destination === state.currentPlanet) {
      if (pkg.deadline >= 0) {
        pkg.delivered = true;
        state.deliveredPackages++;
        state.totalReward += pkg.reward;
        deliveredThisTurn++;
        console.log(`Package #${pkg.id} delivered to ${pkg.destination}! Reward: ${pkg.reward} credits.`);
      }
    }
  });

  if (deliveredThisTurn === 0 && state.packages.some(p => !p.delivered && p.destination === state.currentPlanet)) {
    console.log('You arrived too late to deliver one or more packages here.');
  }

  // Update package deadlines
  state.packages.forEach(pkg => {
    if (!pkg.delivered) {
      pkg.deadline--;
    }
  });

  // Show current status after travel
  displayStatus();

  await delay(200);

  return true;
}

// Prompt wrapper
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main game loop
async function gameLoop() {
  while (true) {
    if (isGameWon()) {
      console.log('\n***** MISSION SUCCESS! You delivered all packages and returned safely to Terra! *****');
      console.log(`Total Reward Credits Earned: ${state.totalReward}`);
      break;
    }
    if (isGameLost()) {
      console.log('\n***** MISSION FAILED! *****');n      state.log.forEach(entry => console.log(entry));
      console.log(`Packages delivered: ${state.deliveredPackages} / ${state.packages.length}`);
      console.log(`Total Reward Credits Earned: ${state.totalReward}`);
      break;
    }

    // Show choices
    console.log('\nChoose your travel destination from current planet:\');
    const neighbors = galaxyMap[state.currentPlanet].neighbors;
    const options = Object.keys(neighbors);

    for (let i = 0; i < options.length; i++) {
      const dest = options[i];
      const dist = neighbors[dest];
      // Risk Estimation: Sirius and neighbors have higher risk
      let risk = 0;
      if (dest === 'Sirius' || state.currentPlanet === 'Sirius') risk = 0.3;
      else risk = 0.1;

      // Show distances and risks
      console.log(`  [${i + 1}] ${dest} (Fuel: ${dist}, Risk: ${(risk * 100).toFixed(0)}%)`);
    }

    // Also option to stay (skip a turn) if needed
    console.log(`  [${options.length + 1}] Stay on ${state.currentPlanet} (Rest and assess)
`);

    let ans = await promptUser('Your choice: ');
    let choiceNum = parseInt(ans, 10);

    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > options.length + 1) {
      console.log('Invalid choice. Please enter a valid number.');
      continue;
    }

    if (choiceNum === options.length + 1) {
      // Stay option
      console.log(`You decide to stay on ${state.currentPlanet} and take time to assess.`);
      state.turn++;
      // Advance deadline timers for packages
      state.packages.forEach(pkg => { if (!pkg.delivered) pkg.deadline--; });
      // Chance for small repair or mini events
      if(Math.random() < 0.3) {
        let repair = Math.floor(Math.random() * 10) + 5;
        state.shipIntegrity += repair;
        if(state.shipIntegrity > 100) state.shipIntegrity = 100;
        console.log(`While resting, your ship was repaired by ${repair}% using spare parts.`);
      } else {
        console.log('Nothing significant happened during the rest.');
      }
      displayStatus();
      continue;
    }

    const destination = options[choiceNum - 1];

    // Travel
    const success = await travelTo(destination);
    if (!success) {
      // Travel failed (e.g. no fuel)
      continue;
    }
  }
  rl.close();
}

// Intro and instructions
function showIntro() {
  console.clear();
  printLine();
  console.log('GALACTIC COURIER - Console Interstellar Delivery Mission');
  printLine();
  console.log('Welcome, Courier! Your mission is to deliver all packages across volatile space within the deadlines \nwhile managing your fuel and ship integrity. Beware of pirates and space hazards!');
  console.log('\nGAME INSTRUCTIONS:');
  console.log('1. Each turn you choose a planet to travel to from your current location or choose to stay and rest.');
  console.log('2. Traveling consumes fuel equal to the distance between planets. You start with limited fuel.');
  console.log('3. Each package has a destination planet and a delivery deadline in turns. Deliver on time for rewards.');
  console.log('4. Random events such as pirate attacks, meteor storms, and engine malfunctions may occur each turn.');
  console.log('5. You lose if you run out of fuel, ship integrity reaches 0, or miss any delivery deadline. Win by delivering all and returning home.');
  printLine();
  console.log(`You start at ${HOME_BASE} with ${START_FUEL} fuel units.`);
  console.log('Good luck, space courier!');
  printLine();
}

// Start Game
async function startGame() {
  showIntro();
  state.packages = generatePackages();
  displayStatus();
  await gameLoop();
}

startGame();
