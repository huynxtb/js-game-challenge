#!/usr/bin/env node

const readline = require('readline');

// Game Constants
const TARGET_CARGO_VALUE = 1000;
const MAX_CARGO_SPACE = 10;
const MAX_SHIP_INTEGRITY = 100;
const MAX_FUEL = 50;
const FUEL_PER_EXPLORE = 5;
const REPAIR_COST = 2; // Cargo space units used per repair
const REPAIR_AMOUNT = 20; // Integrity points regained per repair

// Game State
const state = {
  fuel: MAX_FUEL,
  cargoSpaceUsed: 0,
  cargoValue: 0,
  shipIntegrity: MAX_SHIP_INTEGRITY,
  sectorsExplored: 0,
  atBase: false
};

// readline setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Utility Functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Game Messages
function printStatus() {
  console.log(`\n--- Ship Status ---`);
  console.log(`Fuel: ${state.fuel}/${MAX_FUEL}`);
  console.log(`Cargo: ${state.cargoSpaceUsed}/${MAX_CARGO_SPACE} units used`);
  console.log(`Cargo Value: ${state.cargoValue} credits`);
  console.log(`Ship Integrity: ${state.shipIntegrity}/${MAX_SHIP_INTEGRITY}`);
  console.log(`Sectors Explored: ${state.sectorsExplored}`);
}

function checkLossConditions() {
  if (state.shipIntegrity <= 0) {
    console.log(`\nYour ship has sustained critical damage and can no longer continue.`);
    return true;
  }
  if (state.fuel <= 0 && !state.atBase) {
    console.log(`\nYou have run out of fuel far from home and are stranded in space.`);
    return true;
  }
  return false;
}

function printWin() {
  console.log(`\nCongratulations! You have salvaged sufficient cargo and safely returned to base!`);
  console.log(`Final cargo value: ${state.cargoValue} credits`);
  console.log(`Total sectors explored: ${state.sectorsExplored}`);
}

function printLoss() {
  console.log(`\nMission failed.`);
  console.log(`Final cargo value: ${state.cargoValue} credits`);
  console.log(`Sectors explored: ${state.sectorsExplored}`);
}

// Event Generators
function exploreSectorEvent() {
  // Randomly select one event type:
  // 1. Salvage Opportunity
  // 2. Hazard
  // 3. Repair Opportunity
  // 4. Empty Sector

  const roll = randomInt(1, 100);

  if (roll <= 40) {
    // Salvage opportunity
    return { type: 'salvage' };
  } else if (roll <= 70) {
    // Hazard
    return { type: 'hazard' };
  } else if (roll <= 85) {
    // Repair Opportunity
    return { type: 'repairOpportunity' };
  } else {
    // Empty sector
    return { type: 'empty' };
  }
}

function salvageArtifact() {
  if (state.cargoSpaceUsed >= MAX_CARGO_SPACE) {
    console.log(`Your cargo hold is full! You cannot salvage anything more.`);
    return;
  }

  // Salvage success chance depends on ship integrity and random roll
  // Base success chance 60%, modified by integrity (integrity/100)*30%
  let successChance = 60 + ((state.shipIntegrity / MAX_SHIP_INTEGRITY) * 30);
  successChance = clamp(successChance, 10, 90);
  const roll = randomInt(1, 100);

  if (roll <= successChance) {
    // Successful salvage
    const artifactValue = randomInt(50, 300);
    state.cargoValue += artifactValue;
    state.cargoSpaceUsed += 1;
    console.log(`Success! You salvaged an artifact worth ${artifactValue} credits.`);
  } else {
    // Failed salvage
    // 1 in 4 chance salvage attempt causes minor damage
    console.log(`Salvage attempt failed. You found nothing useful.`);
    if (randomInt(1,4) === 1) {
      const damage = randomInt(5, 15);
      state.shipIntegrity = Math.max(0, state.shipIntegrity - damage);
      console.log(`The attempt caused damage to your ship! Integrity -${damage}`);
    }
  }
}

function repairShip() {
  if (state.cargoSpaceUsed < REPAIR_COST) {
    console.log(`Not enough salvage resources to repair your ship (need ${REPAIR_COST} cargo units).`);
    return;
  }
  if (state.shipIntegrity >= MAX_SHIP_INTEGRITY) {
    console.log(`Ship integrity is already at maximum.`);
    return;
  }

  state.cargoSpaceUsed -= REPAIR_COST;
  const repairAmt = Math.min(REPAIR_AMOUNT, MAX_SHIP_INTEGRITY - state.shipIntegrity);
  state.shipIntegrity += repairAmt;
  console.log(`Your engineers perform emergency repairs, restoring ${repairAmt} integrity.`);
}

function handleHazardEvent() {
  // Hazards cause random damage and consume some fuel unexpectedly
  const damage = randomInt(10, 25);
  const fuelLoss = randomInt(1, 3);
  state.shipIntegrity = Math.max(0, state.shipIntegrity - damage);
  state.fuel = Math.max(0, state.fuel - fuelLoss);
  console.log(`A sudden hazard hit your ship! Ship Integrity -${damage}, Fuel -${fuelLoss}`);
}

function handleRepairOpportunity() {
  // Chance to find some repair materials in the sector
  // Gives 1-2 units of cargo space freed (i.e., allows discarding junk and freeing space)
  if (state.cargoSpaceUsed > 0) {
    const freedSpace = randomInt(1, 2);
    const actualFreed = Math.min(freedSpace, state.cargoSpaceUsed);
    state.cargoSpaceUsed -= actualFreed;
    console.log(`You found some repair materials and scrap to discard. Cargo space freed: ${actualFreed} units.`);
  } else {
    console.log(`You found some useful materials but your cargo hold is empty; nothing to salvage/discard.`);
  }
}

async function gameTurn() {
  printStatus();

  console.log(`\nActions:`);
  console.log(`[1] Explore new sector (use ${FUEL_PER_EXPLORE} fuel)`);
  console.log(`[2] Attempt to salvage artifact (only if salvage opportunity)`);
  console.log(`[3] Repair ship (uses ${REPAIR_COST} cargo units)`);
  console.log(`[4] Return to base and end run`);

  const choice = await prompt(`Choose an action (1-4): `);

  switch(choice) {
    case '1':
      if (state.fuel < FUEL_PER_EXPLORE) {
        console.log(`Not enough fuel to explore a new sector.`);
        break;
      }
      // Consume fuel
      state.fuel -= FUEL_PER_EXPLORE;
      state.sectorsExplored++;
      state.atBase = false;

      // Determine event
      const event = exploreSectorEvent();

      switch(event.type) {
        case 'salvage':
          console.log(`\nYou discover a salvage opportunity in this sector.`);
          state.currentSectorHasSalvage = true;
          break;
        case 'hazard':
          console.log(`\nWarning! Your sensors detect a hazardous anomaly nearby.`);
          handleHazardEvent();
          state.currentSectorHasSalvage = false;
          break;
        case 'repairOpportunity':
          console.log(`\nYou find some repair materials floating in the debris.`);
          handleRepairOpportunity();
          state.currentSectorHasSalvage = false;
          break;
        case 'empty':
          console.log(`\nThis sector appears to be empty.`);
          state.currentSectorHasSalvage = false;
          break;
      }
      break;

    case '2':
      if (!state.currentSectorHasSalvage) {
        console.log(`There is nothing to salvage in this sector. Try exploring first.`);
        break;
      }
      salvageArtifact();
      // After salvage attempt, salvage opportunity ends
      state.currentSectorHasSalvage = false;
      break;

    case '3':
      repairShip();
      break;

    case '4':
      state.atBase = true;
      break;

    default:
      console.log(`Invalid choice, please select 1-4.`);
      break;
  }

  return;
}

async function main() {
  console.log(`Welcome to Stellar Salvage!`);
  console.log(`You command a small salvage ship tasked with exploring derelict star systems to collect rare artifacts and valuable resources.`);
  console.log(`Collect at least ${TARGET_CARGO_VALUE} credits worth of cargo and return safely to base.`);
  console.log(`Manage your fuel, cargo space, and ship integrity carefully.`);

  state.currentSectorHasSalvage = false;

  while(true) {
    if (state.atBase) {
      if (state.cargoValue >= TARGET_CARGO_VALUE) {
        printWin();
        break;
      } else {
        console.log(`\nYou have returned to base but do not have enough cargo value to complete your mission.`);
        printLoss();
        break;
      }
    }

    if (checkLossConditions()) {
      printLoss();
      break;
    }

    await gameTurn();
  }

  rl.close();
}

// Run the game
main();
