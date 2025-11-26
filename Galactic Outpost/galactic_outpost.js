#!/usr/bin/env node
// Galactic Outpost: A turn-based console game
// Player manages an interstellar outpost surviving 30 days with resource and event management.

const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt and get input
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Game constants
const MAX_DAYS = 30;
const MAX_MORALE = 100;
const MAX_INTEGRITY = 100;
const MAX_ENERGY = 100;
const MAX_SUPPLIES = 100;

// Outpost initial state
let state = {
  day: 1,
  energy: 75,       // Energy units
  supplies: 50,     // Supply units
  morale: 80,       // Crew morale percentage
  integrity: 100,  // Structural integrity percentage
  defenses: 20,    // Defense strength
  repairedToday: false // Track if repaired this turn
};

// Helper: Clamp a value between min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Display the current status of the outpost
function displayStatus() {
  console.log('\n=== Day ' + state.day + ' Status ===');
  console.log('Energy Units: ' + state.energy);
  console.log('Supplies: ' + state.supplies);
  console.log('Crew Morale: ' + state.morale + '%');
  console.log('Structural Integrity: ' + state.integrity + '%');
  console.log('Defense Strength: ' + state.defenses);
  console.log('==================================\n');
}

// Random helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

// Event definitions
const events = [
  {
    name: 'Meteor Strike',
    description: 'A meteor storm hits the outpost causing structural damage.',
    effect: () => {
      let damage = randomInt(10, 25);
      state.integrity = clamp(state.integrity - damage, 0, MAX_INTEGRITY);
      console.log(`Meteor storm caused ${damage}% damage to the outpost!`);
    }
  },
  {
    name: 'Alien Trade Offer',
    description: 'Friendly aliens offer to trade supplies for energy.',
    effect: () => {
      if(state.energy >= 15) {
        state.energy -= 15;
        state.supplies = clamp(state.supplies + 20, 0, MAX_SUPPLIES);
        console.log('You traded 15 energy units for 20 supplies from aliens.');
      } else {
        console.log('You lack enough energy to trade with aliens. No trade occurred.');
      }
    }
  },
  {
    name: 'Equipment Failure',
    description: 'A critical system malfunctions reducing energy and morale.',
    effect: () => {
      let lossEnergy = randomInt(5, 10);
      let lossMorale = randomInt(5, 15);
      state.energy = clamp(state.energy - lossEnergy, 0, MAX_ENERGY);
      state.morale = clamp(state.morale - lossMorale, 0, MAX_MORALE);
      console.log(`Equipment failure caused loss of ${lossEnergy} energy and ${lossMorale}% morale!`);
    }
  },
  {
    name: 'Successful Exploration',
    description: 'Exploration team returns with supplies and energy resources.',
    effect: () => {
      let gainEnergy = randomInt(10, 20);
      let gainSupplies = randomInt(10, 25);
      state.energy = clamp(state.energy + gainEnergy, 0, MAX_ENERGY);
      state.supplies = clamp(state.supplies + gainSupplies, 0, MAX_SUPPLIES);
      state.morale = clamp(state.morale + 5, 0, MAX_MORALE);
      console.log(`Exploration success! Gained ${gainEnergy} energy, ${gainSupplies} supplies, and +5% morale.`);
    }
  },
  {
    name: 'Calm Day',
    description: 'A quiet day with no significant events.',
    effect: () => {
      console.log('A calm day. Crew morale slightly improves.');
      state.morale = clamp(state.morale + 3, 0, MAX_MORALE);
    }
  },
  {
    name: 'Pirate Attack',
    description: 'Space pirates attempt to raid the outpost.',
    effect: () => {
      console.log('Alert! Space pirates are attacking the outpost! Prepare to defend.');
      // Trigger combat encounter
      combat().then(() => {
        // Combat concluded, continue game
        mainLoop();
      });
      return true; // Indicate event handled asynchronously
    }
  }
];

// Function to get a random event
function getRandomEvent() {
  // Weighted event chance: 80% chance an event applies each day
  if (!chance(80)) {
    console.log('The day passes with no remarkable incidents.');
    return;
  }
  let event = events[randomInt(0, events.length - 1)];
  console.log(`Event: ${event.name}`);
  console.log(event.description);
  if(event.effect) {
    let asyncEvent = event.effect();
    return asyncEvent === true ? asyncEvent : null; // Allow async events like combat
  }
}

// Combat sequence for pirate attack
async function combat() {
  let pirateHealth = 50;
  let outpostHealth = state.integrity;
  let outpostDefense = state.defenses;

  console.log('\n-- Combat Initiated --');
  console.log(`Pirate raid health: ${pirateHealth}`);
  console.log(`Outpost structural integrity: ${outpostHealth}`);

  while (pirateHealth > 0 && outpostHealth > 0) {
    // Player turn
    console.log('\nChoose your action:');
    console.log('1) Divert energy to weapons (attack pirates, costs 10 energy)');
    console.log('2) Reinforce defenses (increase defense strength by 5, costs 15 energy)');
    console.log('3) Repair structural damage (restore 10 integrity, costs 20 supplies)');

    let choice = await prompt('Your action (1-3): ');

    if (!['1','2','3'].includes(choice)) {
      console.log('Invalid choice. Please enter 1, 2, or 3.');
      continue;
    }

    switch(choice) {
      case '1':
        if(state.energy < 10) {
          console.log('Not enough energy to attack!');
          continue;
        }
        state.energy -= 10;
        let attackPower = outpostDefense + randomInt(5, 15);
        pirateHealth -= attackPower;
        console.log(`You attacked the pirates and dealt ${attackPower} damage.`);
        break;
      case '2':
        if(state.energy < 15) {
          console.log('Not enough energy to reinforce defenses!');
          continue;
        }
        state.energy -= 15;
        state.defenses += 5;
        console.log('You reinforced defenses by 5 points.');
        break;
      case '3':
        if(state.supplies < 20) {
          console.log('Not enough supplies to repair!');
          continue;
        }
        state.supplies -= 20;
        state.integrity = clamp(state.integrity + 10, 0, MAX_INTEGRITY);
        outpostHealth = state.integrity;
        console.log('Structural integrity repaired by 10 points.');
        break;
    }

    if(pirateHealth <= 0) {
      console.log('\nThe pirates have been defeated!');
      break;
    }

    // Pirates attack
    let pirateAttack = randomInt(10, 20) - Math.floor(state.defenses / 5);
    pirateAttack = pirateAttack < 0 ? 0 : pirateAttack;
    outpostHealth -= pirateAttack;
    state.integrity = clamp(outpostHealth, 0, MAX_INTEGRITY);

    console.log(`Pirates attacked causing ${pirateAttack} structural damage!`);
    if(state.integrity <= 0) {
      console.log('Your outpost has been destroyed in the attack!');
      break;
    }
  }

  console.log('-- Combat Ended --\n');
}

// Player turn decision: allocate resources
async function playerTurn() {
  console.log('Allocate your energy resources:');
  console.log(`Current Energy: ${state.energy}`);
  console.log('1) Allocate energy to Defenses (-10 energy, +5 defense strength)');
  console.log('2) Allocate energy to Exploration (-15 energy, chance for supplies & energy)');
  console.log('3) Allocate energy to Repair (-20 energy, restores some integrity)');
  console.log('4) Save energy for later (no cost)');

  let choice = await prompt('Choose an option (1-4): ');

  switch(choice) {
    case '1':
      if(state.energy < 10) {
        console.log('Not enough energy for this allocation! Nothing allocated.');
        return;
      }
      state.energy -= 10;
      state.defenses += 5;
      console.log('Energy allocated to defenses. Defense strength increased by 5.');
      break;
    case '2':
      if(state.energy < 15) {
        console.log('Not enough energy for exploration! Nothing allocated.');
        return;
      }
      state.energy -= 15;
      // Exploration event
      let explorationGainEnergy = randomInt(5, 15);
      let explorationGainSupplies = randomInt(10, 20);
      state.energy = clamp(state.energy + explorationGainEnergy, 0, MAX_ENERGY);
      state.supplies = clamp(state.supplies + explorationGainSupplies, 0, MAX_SUPPLIES);
      state.morale = clamp(state.morale + 3, 0, MAX_MORALE);
      console.log(`Exploration success! Gained ${explorationGainEnergy} energy and ${explorationGainSupplies} supplies, morale +3%.`);
      break;
    case '3':
      if(state.energy < 20) {
        console.log('Not enough energy for repairs! Nothing allocated.');
        return;
      }
      state.energy -= 20;
      let repairAmount = 15;
      state.integrity = clamp(state.integrity + repairAmount, 0, MAX_INTEGRITY);
      console.log(`Repairs performed. Outpost integrity improved by ${repairAmount}%.`);
      break;
    case '4':
      console.log('Energy saved for later use.');
      break;
    default:
      console.log('Invalid choice. No energy allocated this turn.');
      break;
  }
}

// Supplies consumption per day
function consumeSupplies() {
  // Each day 5 supplies consumed
  let consumption = 5;

  if(state.supplies >= consumption) {
    state.supplies -= consumption;
    console.log(`\nSupplies consumed: ${consumption}`);
  } else {
    // Not enough supplies, morale drops
    console.log('\nWARNING: Supplies critically low! Crew morale drops by 10%.');
    state.supplies = 0;
    state.morale = clamp(state.morale - 10, 0, MAX_MORALE);
  }
}

// Morale effects on gameplay
function moraleEffects() {
  if(state.morale < 30) {
    console.log('Crew morale is critically low. Defense effectiveness reduced.');
    state.defenses = clamp(state.defenses - 5, 0, state.defenses);
  }
}

// Check win/loss conditions
function checkGameOver() {
  if(state.integrity <= 0) {
    console.log('\nYour outpost has been destroyed. You lose.');
    return true;
  }
  if(state.morale <= 0) {
    console.log('\nCrew morale collapsed. The outpost mission fails. You lose.');
    return true;
  }
  if(state.day > MAX_DAYS) {
    console.log('\nReinforcements have arrived! You have successfully survived 30 days. You win!');
    return true;
  }
  return false;
}

// Main game loop
async function mainLoop() {
  if(checkGameOver()) {
    rl.close();
    return;
  }

  displayStatus();

  // Player resource allocation turn
  await playerTurn();

  // Random event (skip to async event like combat if returns true)
  let asyncEvent = getRandomEvent();
  if(asyncEvent === true) {
    // Combat handled inside getRandomEvent with its own flow
    return;
  }

  // Consume supplies
  consumeSupplies();

  // Apply morale effects
  moraleEffects();

  state.day++;
  console.log('\n--- End of Day ' + (state.day - 1) + ' ---\n');

  mainLoop();
}

// Intro and instructions
function intro() {
  console.log('==========================================================');
  console.log('                  Galactic Outpost Commander               ');
  console.log('==========================================================');
  console.log('You are the commander of a remote interstellar outpost.');
  console.log('Your mission is to survive 30 days managing resources,');
  console.log('defending against threats, and keeping crew morale up.');
  console.log('\nCore Mechanics:');
  console.log('- Each turn represents one day.');
  console.log('- Manage Energy, Supplies, and Crew Morale.');
  console.log('- Allocate energy to defenses, exploration or repair.');
  console.log('- Handle random events and space hazards.');
  console.log('- Engage in combat when under attack.');
  console.log('\nWin by surviving 30 days without losing your outpost.');
  console.log('Lose if structural integrity or morale reaches zero.');
  console.log('\nGood luck, Commander!\n');
}

// Start the game
intro();
mainLoop();
