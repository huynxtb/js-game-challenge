#!/usr/bin/env node
// Stellar Salvage: The Asteroid Haul
// A console-based resource management and strategy game in Node.js

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Game Constants
const TARGET_MINERALS = 100;
const MAX_FUEL = 50;
const MAX_CARGO = 50;
const MAX_SHIP_INTEGRITY = 5;
const MAX_TURNS = 100; // to prevent infinite games

// Game State
let gameState = {
  fuel: MAX_FUEL,
  cargo: 0,
  cargoCapacity: MAX_CARGO,
  shipIntegrity: MAX_SHIP_INTEGRITY,
  totalMineralsDelivered: 0,
  turn: 1,
  atBase: true,
  gameOver: false,
};

// Helper Functions
function promptPlayer(query) {
  return new Promise(resolve => rl.question(query, ans => resolve(ans.trim())));
}

function printStatus() {
  console.log('--- STATUS ---');
  console.log(`Turn: ${gameState.turn} ${gameState.atBase ? '(At Base)' : '(In Asteroid Belt)'}
Fuel: ${gameState.fuel}/${MAX_FUEL}
Ship Integrity: ${gameState.shipIntegrity}/${MAX_SHIP_INTEGRITY}
Cargo: ${gameState.cargo}/${gameState.cargoCapacity}
Total Minerals Delivered: ${gameState.totalMineralsDelivered}/${TARGET_MINERALS}
`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random Event Generator
function generateEvent() {
  // Weighted events:
  // 45% chance: Empty space (nothing happens)
  // 25% chance: Valuable asteroid
  // 15% chance: Hazardous debris
  // 10% chance: Repair station
  // 5% chance: Fuel station

  const roll = Math.random();
  if (roll < 0.45) return { type: 'empty' };
  if (roll < 0.70) {
    // Valuable asteroid with random mineral units
    const mineralUnits = randomInt(5, 15);
    return { type: 'asteroid', minerals: mineralUnits };
  }
  if (roll < 0.85) {
    // Hazardous debris causes damage
    const damage = randomInt(1, 2);
    return { type: 'hazard', damage };
  }
  if (roll < 0.95) {
    // Repair station restores partial integrity
    const repair = randomInt(1, 2);
    return { type: 'repair_station', repair };
  }
  // Fuel station refuels partially
  const fuelAmount = randomInt(10, 25);
  return { type: 'fuel_station', fuelAmount };
}

async function handleTurn() {
  printStatus();

  if (gameState.atBase) {
    // Player choices at base
    console.log('You are at the base station. What would you like to do?');
    console.log('1) Launch into the asteroid belt');
    console.log('2) Offload cargo');
    console.log('3) Repair ship (consumes fuel)');
    console.log('4) Refuel ship');
    console.log('5) Quit game');

    const choice = await promptPlayer('Enter choice (1-5): ');

    switch (choice) {
      case '1':
        if (gameState.fuel < 5) {
          console.log('Not enough fuel to safely navigate the belt. Try refueling or repairing first.');
        } else {
          gameState.atBase = false;
          console.log('You launch into the asteroid belt.');
        }
        break;

      case '2':
        if (gameState.cargo === 0) {
          console.log('You have no minerals to offload.');
        } else {
          gameState.totalMineralsDelivered += gameState.cargo;
          console.log(`You offloaded ${gameState.cargo} units of minerals.`);
          gameState.cargo = 0;
          if (gameState.totalMineralsDelivered >= TARGET_MINERALS) {
            console.log('Congratulations! You have collected and delivered enough minerals!');
            gameState.gameOver = true;
          }
        }
        break;

      case '3':
        // Repair costs fuel
        if (gameState.fuel < 3) {
          console.log('Not enough fuel to perform repairs.');
        } else if (gameState.shipIntegrity === MAX_SHIP_INTEGRITY) {
          console.log('Ship integrity is already full. No repairs needed.');
        } else {
          gameState.fuel -= 3;
          gameState.shipIntegrity = Math.min(MAX_SHIP_INTEGRITY, gameState.shipIntegrity + 2);
          console.log('You repaired your ship. Ship integrity improved.');
        }
        break;

      case '4':
        if (gameState.fuel === MAX_FUEL) {
          console.log('Fuel tanks are already full.');
        } else {
          gameState.fuel = MAX_FUEL;
          console.log('You refueled your ship to full capacity.');
        }
        break;

      case '5':
        console.log('You decided to quit the game. Goodbye!');
        gameState.gameOver = true;
        break;

      default:
        console.log('Invalid choice. Please enter a number 1-5.');
    }
  } else {
    // Player choices in asteroid belt
    console.log('You are in the asteroid belt. Choose your action:');
    console.log('1) Move forward (consume fuel, chance of event)');
    console.log('2) Scan area');
    console.log('3) Mine asteroid (if available)');
    console.log('4) Return to base');
    console.log('5) Quit game');

    const choice = await promptPlayer('Enter choice (1-5): ');

    switch (choice) {
      case '1':
        if (gameState.fuel < 2) {
          console.log('Not enough fuel to move forward. Consider returning to base.');
        } else {
          gameState.fuel -= 2;
          gameState.turn += 1;

          const event = generateEvent();

          if (event.type === 'empty') {
            console.log('You moved forward through empty space. Nothing found this turn.');
          } else if (event.type === 'asteroid') {
            console.log(`You discovered an asteroid containing approximately ${event.minerals} units of rare minerals.`);
            gameState.foundAsteroid = event.minerals;
          } else if (event.type === 'hazard') {
            const dmg = event.damage;
            gameState.shipIntegrity -= dmg;
            console.log(`Oh no! Hazardous debris damaged your ship, causing ${dmg} damage.`);
            if (gameState.shipIntegrity <= 0) {
              console.log('Your ship has taken critical damage and is no longer operational. Game Over.');
              gameState.gameOver = true;
            }
            gameState.foundAsteroid = 0;
          } else if (event.type === 'repair_station') {
            const repair = event.repair;
            gameState.shipIntegrity = Math.min(MAX_SHIP_INTEGRITY, gameState.shipIntegrity + repair);
            console.log(`You found a repair drone station. Ship integrity improved by ${repair}.`);
            gameState.foundAsteroid = 0;
          } else if (event.type === 'fuel_station') {
            const fuelGain = event.fuelAmount;
            const oldFuel = gameState.fuel;
            gameState.fuel = Math.min(MAX_FUEL, gameState.fuel + fuelGain);
            console.log(`You located a fuel station and refueled ${gameState.fuel - oldFuel} units.`);
            gameState.foundAsteroid = 0;
          }

        }
        break;

      case '2':
        // Scan area - chance to reveal an asteroid or hazard
        if (gameState.fuel < 1) {
          console.log('Not enough fuel to perform scanning.');
        } else {
          gameState.fuel -= 1;
          const scanRoll = Math.random();
          if(scanRoll < 0.6) {
            // Found nothing
            console.log('Scan complete. No significant objects detected nearby.');
            gameState.foundAsteroid = 0;
          } else {
            const mineralsFound = randomInt(3, 12);
            console.log(`Scan detected an asteroid containing approximately ${mineralsFound} units of rare minerals nearby.`);
            gameState.foundAsteroid = mineralsFound;
          }
        }
        break;

      case '3':
        // Mine asteroid if found
        if (!gameState.foundAsteroid || gameState.foundAsteroid <= 0) {
          console.log('There is no asteroid available to mine here. Try moving or scanning first.');
        } else {
          const spaceLeft = gameState.cargoCapacity - gameState.cargo;
          if (spaceLeft <= 0) {
            console.log('Your cargo hold is full. You should return to base to offload minerals.');
          } else {
            const mined = Math.min(spaceLeft, gameState.foundAsteroid);
            gameState.cargo += mined;
            console.log(`You mined ${mined} units of rare minerals.`);
            gameState.foundAsteroid = 0;
          }
        }
        break;

      case '4':
        console.log('You are returning to base station...');
        // Return to base costs fuel
        if (gameState.fuel < 5) {
          console.log('Warning: Not enough fuel for a safe return. Try to refuel or repair before going back.');
        }
        gameState.atBase = true;
        gameState.turn += 1;
        break;

      case '5':
        console.log('You decided to quit the game. Goodbye!');
        gameState.gameOver = true;
        break;

      default:
        console.log('Invalid choice. Please enter a number 1-5.');
    }

  }
}

async function gameLoop() {
  console.log('Welcome to Stellar Salvage: The Asteroid Haul!');
  console.log('Your mission: Collect and return at least 100 units of rare minerals from the asteroid belt.');
  console.log('Manage your fuel, cargo capacity, and ship integrity to survive the dangers of space.');
  console.log('Good luck, captain!\n');

  while (!gameState.gameOver) {
    await handleTurn();

    if (gameState.fuel <= 0) {
      console.log('Your ship has run out of fuel and is stranded in space. Game Over.');
      gameState.gameOver = true;
    }

    if (gameState.turn > MAX_TURNS) {
      console.log('You have reached the maximum number of turns allowed. Game Over.');
      gameState.gameOver = true;
    }
  }

  console.log('\nFinal Summary:');
  console.log(`Total Minerals Delivered: ${gameState.totalMineralsDelivered}`);
  console.log(`Fuel Left: ${gameState.fuel}`);
  console.log(`Ship Integrity: ${gameState.shipIntegrity}`);
  console.log('Thank you for playing Stellar Salvage: The Asteroid Haul!');
  rl.close();
}

// Start the game
gameLoop();
