#!/usr/bin/env node
/*
  Astro Salvage - A text-based console game in Node.js
  You are the captain of a salvage spaceship tasked with collecting valuable debris
  from a destroyed asteroid field. Manage your ship's fuel, integrity, and crew morale.
  Survive hazards and strategize your actions over limited turns to accumulate salvage.

  Author: ChatGPT
*/

const readline = require('readline');

// Setup readline interface for command line input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Game constants
const MAX_TURNS = 20; // Total turns available
const TARGET_SALVAGE = 100; // Salvage worth to win
const MAX_FUEL = 100;
const MAX_INTEGRITY = 100;
const MAX_MORALE = 100;

// Initial game state
let gameState = {
  turn: 1,
  fuel: 100,
  integrity: 100,
  morale: 100,
  salvage: 0,
  repairing: false,
  gameOver: false
};

// Helper: Clamp a value between min and max
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Display game instructions and status
function displayIntro() {
  console.log("\n=== Astro Salvage ===\n");
  console.log("Objective: Collect salvage worth 100 or more units within 20 turns.");
  console.log("Manage your ship's fuel, integrity, and crew morale to survive hazards.");
  console.log("\nActions each turn:");
  console.log("  move    - travel to a new asteroid sector (uses fuel, chance to find salvage)");
  console.log("  scan    - scan current area for salvage (low fuel cost, low salvage yield chance)");
  console.log("  salvage - attempt to gather salvage from current location (uses time)");
  console.log("  repair  - repair ship integrity (uses crew morale and time)");
  console.log("  rest    - rest the crew to restore morale (uses fuel and time)");
  console.log("\nResources: Fuel, Ship Integrity, Crew Morale, Salvage Worth");
  console.log("Make smart, strategic decisions to maximize salvage and survive hazards.");
  console.log("Good luck, Captain!\n");
}

// Display current status
function displayStatus() {
  console.log(`\nTurn: ${gameState.turn} / ${MAX_TURNS}`);
  console.log(`Fuel: ${gameState.fuel} / ${MAX_FUEL}`);
  console.log(`Ship Integrity: ${gameState.integrity} / ${MAX_INTEGRITY}`);
  console.log(`Crew Morale: ${gameState.morale} / ${MAX_MORALE}`);
  console.log(`Salvage Collected: ${gameState.salvage} / ${TARGET_SALVAGE}`);
}

// Random utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Event definitions
function randomEvent() {
  // Weighted random event: 
  // 50% no event, 15% asteroid storm, 15% pirate encounter, 10% equipment failure, 10% morale drop event
  const roll = Math.random();

  if (roll < 0.50) {
    return { type: 'none' };
  } else if (roll < 0.65) {
    return { type: 'asteroidStorm' };
  } else if (roll < 0.80) {
    return { type: 'pirateEncounter' };
  } else if (roll < 0.90) {
    return { type: 'equipmentFailure' };
  } else {
    return { type: 'moraleDrop' };
  }
}

// Event handlers
function handleAsteroidStorm() {
  console.log("\n*** ALERT: Asteroid Storm! ***");
  // Chance: 40% of damage 10-25, 60% minor damage 5-10
  const damage = Math.random() < 0.4 ? randomInt(10, 25) : randomInt(5, 10);
  gameState.integrity = clamp(gameState.integrity - damage, 0, MAX_INTEGRITY);
  console.log(`The ship was battered by debris, losing ${damage} integrity.`);
}

function handlePirateEncounter() {
  console.log("\n*** ALERT: Pirate Encounter! ***");
  // Chance: 50% lose salvage (10-30), 50% crew morale drops 5-15
  if (Math.random() < 0.5) {
    const lostSalvage = Math.min(gameState.salvage, randomInt(10, 30));
    gameState.salvage -= lostSalvage;
    console.log(`Pirates raided your salvage stash! Lost ${lostSalvage} salvage worth.`);
  } else {
    const moraleLoss = randomInt(5, 15);
    gameState.morale = clamp(gameState.morale - moraleLoss, 0, MAX_MORALE);
    console.log(`The crew was shaken by pirates' threat, morale dropped by ${moraleLoss}.`);
  }
}

function handleEquipmentFailure() {
  console.log("\n*** WARNING: Equipment Failure! ***");
  // Randomly reduce fuel or integrity slightly
  if (Math.random() < 0.5) {
    const fuelLoss = randomInt(5, 15);
    gameState.fuel = clamp(gameState.fuel - fuelLoss, 0, MAX_FUEL);
    console.log(`Fuel leakage detected! Lost ${fuelLoss} fuel.`);
  } else {
    const integrityLoss = randomInt(5, 15);
    gameState.integrity = clamp(gameState.integrity - integrityLoss, 0, MAX_INTEGRITY);
    console.log(`System malfunction damaged integrity by ${integrityLoss}.`);
  }
}

function handleMoraleDrop() {
  console.log("\n*** Crew Frustration Event ***");
  const moraleLoss = randomInt(10, 20);
  gameState.morale = clamp(gameState.morale - moraleLoss, 0, MAX_MORALE);
  console.log(`The crew grows restless and weary, morale drops by ${moraleLoss}.`);
}

// Execute event of the turn
function processRandomEvent() {
  const event = randomEvent();

  switch (event.type) {
    case 'asteroidStorm':
      handleAsteroidStorm();
      break;
    case 'pirateEncounter':
      handlePirateEncounter();
      break;
    case 'equipmentFailure':
      handleEquipmentFailure();
      break;
    case 'moraleDrop':
      handleMoraleDrop();
      break;
    default:
      // no event
      break;
  }
}

// Check for loss conditions
function checkLossConditions() {
  if (gameState.integrity <= 0) {
    console.log("\nYour ship has been destroyed. Game Over.");
    return true;
  }
  if (gameState.fuel <= 0) {
    console.log("\nYou ran out of fuel and are lost in space. Game Over.");
    return true;
  }
  if (gameState.morale <= 0) {
    console.log("\nCrew morale fell to zero. The crew mutinies. Game Over.");
    return true;
  }
  return false;
}

// Check win condition
function checkWinCondition() {
  if (gameState.salvage >= TARGET_SALVAGE) {
    console.log("\n*** Congratulations, Captain! You have collected enough salvage to be a hero! You win! ***");
    return true;
  }
  return false;
}

// Player action handlers
function actionMove() {
  if (gameState.fuel < 10) {
    console.log("Not enough fuel to move to a new sector. Consider resting or repairing.");
    return;
  }
  gameState.fuel = clamp(gameState.fuel - 10, 0, MAX_FUEL);
  console.log("You pilot your ship to a new asteroid sector, costing 10 fuel.");

  // Chance to find salvage in new sector
  const salvageFound = randomInt(5, 20);
  gameState.salvage += salvageFound;
  console.log(`You managed to salvage debris worth ${salvageFound} from this sector.`);
}

function actionScan() {
  if (gameState.fuel < 5) {
    console.log("Not enough fuel to scan this sector.");
    return;
  }
  gameState.fuel = clamp(gameState.fuel - 5, 0, MAX_FUEL);
  console.log("Scanning the current area... Consumes 5 fuel.");

  // Low yield chance
  if (Math.random() < 0.5) {
    const salvageFound = randomInt(2, 10);
    gameState.salvage += salvageFound;
    console.log(`Scan successful! Salvaged debris worth ${salvageFound}.`);
  } else {
    console.log("Scan found no valuable salvage this turn.");
  }
}

function actionSalvage() {
  console.log("You spend time carefully salvaging debris.");
  // Chance of injury or damage to ship small chance
  if (Math.random() < 0.2) {
    const damage = randomInt(5, 15);
    gameState.integrity = clamp(gameState.integrity - damage, 0, MAX_INTEGRITY);
    console.log(`Carelessness caused damage! Ship integrity reduced by ${damage}.`);
  }

  // Salvage gains
  const salvageFound = randomInt(10, 25);
  gameState.salvage += salvageFound;
  console.log(`Salvaged material worth ${salvageFound} added to your total.`);
}

function actionRepair() {
  if (gameState.morale < 10) {
    console.log("Crew morale is too low to perform repairs effectively. You might want to rest.");
    return;
  }
  console.log("The crew works on repairing the ship.");
  // Use morale, restores some integrity
  const repairAmount = randomInt(15, 30);
  gameState.integrity = clamp(gameState.integrity + repairAmount, 0, MAX_INTEGRITY);
  const moraleCost = randomInt(5, 15);
  gameState.morale = clamp(gameState.morale - moraleCost, 0, MAX_MORALE);
  console.log(`Ship integrity improved by ${repairAmount}, but morale dropped by ${moraleCost} due to exhaustion.`);
}

function actionRest() {
  console.log("The crew takes time to rest and recover morale.");
  if (gameState.fuel < 5) {
    console.log("Not enough fuel to maintain life support systems properly during rest.");
    return;
  }
  gameState.fuel = clamp(gameState.fuel - 5, 0, MAX_FUEL);
  const moraleGain = randomInt(15, 30);
  gameState.morale = clamp(gameState.morale + moraleGain, 0, MAX_MORALE);
  console.log(`Crew morale improved by ${moraleGain}, fuel decreased by 5 for life support.`);
}

// Prompt player for action
function promptAction() {
  console.log("\nChoose your action (type the word): move, scan, salvage, repair, rest");
  rl.question('> ', (answer) => {
    const action = answer.trim().toLowerCase();
    switch (action) {
      case 'move':
        actionMove();
        break;
      case 'scan':
        actionScan();
        break;
      case 'salvage':
        actionSalvage();
        break;
      case 'repair':
        actionRepair();
        break;
      case 'rest':
        actionRest();
        break;
      default:
        console.log("Invalid action, please try again.");
        promptAction();
        return;
    }
    endTurn();
  });
}

// End of turn processing
function endTurn() {
  // Process random event
  processRandomEvent();

  // Check loss conditions
  if (checkLossConditions()) {
    gameState.gameOver = true;
    rl.close();
    return;
  }

  // Check win condition
  if (checkWinCondition()) {
    gameState.gameOver = true;
    rl.close();
    return;
  }

  // Advance turn
  gameState.turn++;
  if (gameState.turn > MAX_TURNS) {
    console.log("\nTurns are up!");
    if (gameState.salvage >= TARGET_SALVAGE) {
      console.log("You managed to collect enough salvage. Victory!\n");
    } else {
      console.log("You failed to collect sufficient salvage in time. Mission failed.\n");
    }
    gameState.gameOver = true;
    rl.close();
    return;
  }

  // Show status and prompt next action
  displayStatus();
  promptAction();
}

// Start the game
function startGame() {
  displayIntro();
  displayStatus();
  promptAction();
}

startGame();
