const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DAYS_TO_SURVIVE = 20;

// Initial game state
const state = {
  day: 1,
  resources: {
    fuel: 50,     // Allows movement and some special actions
    food: 30,     // Sustains crew daily
    oxygen: 40,   // Consumed daily
    materials: 0, // Used for upgrades and repairs
  },
  ship: {
    integrity: 100,  // Max 100
    upgrades: {
      fuelEfficiency: 0,  // Decreases fuel consumption
      foodStorage: 0,     // Increases max food (not strictly tracked but flavor)
      oxygenRecycling: 0,  // Decreases oxygen consumption
      repairSystems: 0,   // Improves repair effectiveness
      weapons: 0          // Improves combat outcomes
    }
  },
  crew: {
    members: 5,
    alive: 5
  },
  location: 0, // Progress towards home sector (goal at location 20)
  gameOver: false
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clrscr() {
  process.stdout.write('\x1Bc');
}

function showStatus() {
  console.log(`Day: ${state.day} / ${DAYS_TO_SURVIVE}`);
  console.log(`Location from home sector: ${state.location} / ${DAYS_TO_SURVIVE}`);
  console.log('Crew Members Alive:', state.crew.alive);
  console.log('Ship Integrity:', `${state.ship.integrity}%`);
  console.log('Resources:');
  console.log(`  Fuel: ${state.resources.fuel}`);
  console.log(`  Food: ${state.resources.food}`);
  console.log(`  Oxygen: ${state.resources.oxygen}`);
  console.log(`  Materials: ${state.resources.materials}`);
  console.log('Upgrades:');
  console.log(`  Fuel Efficiency: Level ${state.ship.upgrades.fuelEfficiency}`);
  console.log(`  Food Storage: Level ${state.ship.upgrades.foodStorage}`);
  console.log(`  Oxygen Recycling: Level ${state.ship.upgrades.oxygenRecycling}`);
  console.log(`  Repair Systems: Level ${state.ship.upgrades.repairSystems}`);
  console.log(`  Weapons: Level ${state.ship.upgrades.weapons}`);
  console.log('--------------------------------------------------');
}

function consumeResources(daily = true) {
  // Base consumption per day
  let foodConsumption = state.crew.alive;
  let oxygenConsumption = state.crew.alive;
  let fuelConsumption = 1;

  // Adjust consumption by upgrades
  fuelConsumption = Math.max(1, fuelConsumption - state.ship.upgrades.fuelEfficiency);
  oxygenConsumption = Math.max(1, oxygenConsumption - state.ship.upgrades.oxygenRecycling);

  // Food storage upgrade mitigates starvation risk (just flavor, reduce chance of dying from food shortages)

  if (daily) {
    // Consume resources from stocks
    state.resources.food -= foodConsumption;
    state.resources.oxygen -= oxygenConsumption;
    state.resources.fuel -= fuelConsumption;

    if (state.resources.food < 0) state.resources.food = 0;
    if (state.resources.oxygen < 0) state.resources.oxygen = 0;
    if (state.resources.fuel < 0) state.resources.fuel = 0;

    // Check starvation
    if (state.resources.food === 0) {
      // Chance of losing a crew member each day of no food
      if (Math.random() < 0.4) {
        state.crew.alive = Math.max(0, state.crew.alive - 1);
        console.log('A crew member has died of starvation.');
      }
    }

    // Check oxygen
    if (state.resources.oxygen === 0) {
      // Oxygen critically low, losing crew faster
      if (Math.random() < 0.7) {
        state.crew.alive = Math.max(0, state.crew.alive - 1);
        console.log('A crew member has suffocated due to lack of oxygen.');
      }
    }

    // Check fuel - if no fuel you can't move or perform some actions
    if (state.resources.fuel === 0) {
      console.log('Warning: Fuel depleted. Movement and certain actions disabled until refueled.');
    }
  }
}

function checkGameOver() {
  if (state.ship.integrity <= 0) {
    console.log('Ship integrity has dropped to zero. Your ship is destroyed.');
    state.gameOver = true;
    return true;
  }
  if (state.crew.alive <= 0) {
    console.log('All crew members have died. The mission is lost.');
    state.gameOver = true;
    return true;
  }
  if (state.resources.oxygen <= 0) {
    console.log('Your crew has run out of oxygen. The mission has failed.');
    state.gameOver = true;
    return true;
  }
  return false;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Events definitions
// Each event returns a promise that resolves after the event completes.

function eventAsteroidField() {
  console.log('\nEvent: Asteroid Field - Your ship enters a dense asteroid field.');
  return new Promise(resolve => {
    const damageRisk = 20 - (state.ship.upgrades.repairSystems * 3); // less damage risk with better repair systems
    const damage = randomInt(5, damageRisk);
    state.ship.integrity -= damage;
    console.log(`The ship sustained ${damage}% integrity damage from asteroids.`);
    // Chance to lose fuel due to evasion burns
    const fuelLost = randomInt(1, 3);
    state.resources.fuel -= fuelLost;
    if(state.resources.fuel < 0) state.resources.fuel = 0;
    console.log(`Fuel lost evading the asteroids: ${fuelLost}.`);
    resolve();
  });
}

function eventAlienEncounter() {
  console.log('\nEvent: Alien Encounter - An alien ship appears on sensors.');
  return new Promise(resolve => {
    function askAction() {
      rl.question('Choose action: (E)ngage, (E)vade, (N)egotiate > ', input => {
        input = input.trim().toLowerCase();
        if (input === 'e' || input === 'engage') {
          // Engage: Chance of winning depends on weapons upgrade
          const weaponLevel = state.ship.upgrades.weapons;
          const winChance = 0.5 + (weaponLevel * 0.1);
          if (Math.random() < winChance) {
            // Win: gain materials
            const materialsGained = randomInt(3, 7) + weaponLevel;
            state.resources.materials += materialsGained;
            console.log(`You won the combat and salvaged ${materialsGained} materials.`);
          } else {
            // Lose: take damage and lose crew
            const damage = randomInt(15, 30);
            state.ship.integrity -= damage;
            const crewLost = Math.min(state.crew.alive, randomInt(1, 2));
            state.crew.alive -= crewLost;
            console.log(`You lost the combat! Ship took ${damage}% damage and lost ${crewLost} crew members.`);
          }
          resolve();
        } else if (input === 'v' || input === 'evade') {
          // Evade: chance to lose fuel but avoid damage
          const evadeSuccess = 0.7 + (state.ship.upgrades.fuelEfficiency * 0.05);
          if (Math.random() < evadeSuccess) {
            const fuelUsed = randomInt(3, 6);
            state.resources.fuel -= fuelUsed;
            if(state.resources.fuel < 0) state.resources.fuel = 0;
            console.log(`Evaded the alien ship using ${fuelUsed} fuel.`);
          } else {
            const damage = randomInt(10,20);
            state.ship.integrity -= damage;
            console.log(`Failed to evade. Ship took ${damage}% damage.`);
          }
          resolve();
        } else if (input === 'n' || input === 'negotiate') {
          // Negotiate: small chance aliens give materials, risk losing crew
          const chance = 0.4 + (0.05 * state.ship.upgrades.weapons);
          if (Math.random() < chance) {
            const materialsGained = randomInt(1, 5);
            state.resources.materials += materialsGained;
            console.log(`Negotiations successful. You gained ${materialsGained} materials.`);
            resolve();
          } else {
            const crewLost = 1;
            state.crew.alive -= crewLost;
            console.log(`Negotiations failed. Lost ${crewLost} crew member due to hostility.`);
            resolve();
          }
        } else {
          console.log('Invalid input. Please choose E, V, or N.');
          askAction();
        }
      });
    }
    askAction();
  });
}

function eventEquipmentFailure() {
  console.log('\nEvent: Equipment Failure - A vital system malfunctions.');
  return new Promise(resolve => {
    rl.question('Do you want to (R)epair now using materials or (D)elay repairs? > ', input => {
      input = input.trim().toLowerCase();
      if (input === 'r' || input === 'repair') {
        const neededMaterials = 5 - state.ship.upgrades.repairSystems;
        if (state.resources.materials >= neededMaterials) {
          state.resources.materials -= neededMaterials;
          console.log(`You repaired the system using ${neededMaterials} materials.`);
        } else {
          const damage = randomInt(10, 25);
          state.ship.integrity -= damage;
          console.log(`Insufficient materials. Ship took ${damage}% damage due to failure.`);
        }
        resolve();
      } else if (input === 'd' || input === 'delay') {
        const damage = randomInt(15, 35);
        state.ship.integrity -= damage;
        console.log(`Delayed repairs caused ${damage}% damage to ship.`);
        resolve();
      } else {
        console.log('Invalid input. Please choose R or D.');
        resolve(eventEquipmentFailure());
      }
    });
  });
}

function eventFindResources() {
  console.log('\nEvent: Resource Cache Found - You discover a small cache of resources floating in space.');
  return new Promise(resolve => {
    const fuelFound = randomInt(3, 7);
    const foodFound = randomInt(2, 5);
    const oxygenFound = randomInt(2, 5);
    const materialsFound = randomInt(1, 4);

    state.resources.fuel += fuelFound;
    state.resources.food += foodFound;
    state.resources.oxygen += oxygenFound;
    state.resources.materials += materialsFound;

    console.log(`Collected resources: Fuel(${fuelFound}), Food(${foodFound}), Oxygen(${oxygenFound}), Materials(${materialsFound}).`);
    resolve();
  });
}

function eventQuietDay() {
  console.log('\nEvent: Quiet Day - No significant occurrences today.');
  return Promise.resolve();
}

const events = [
  eventAsteroidField,
  eventAlienEncounter,
  eventEquipmentFailure,
  eventFindResources,
  eventQuietDay
];

function getRandomEvent() {
  // Weight quiet day more so game is balanced
  const weightedEvents = [eventQuietDay,eventQuietDay,eventFindResources,eventEquipmentFailure,eventAlienEncounter,eventAsteroidField];
  const ev = weightedEvents[randomInt(0, weightedEvents.length -1)];
  return ev;
}

function canUpgrade() {
  return state.resources.materials >= 5;
}

function upgradeShip() {
  return new Promise(resolve => {
    if (!canUpgrade()) {
      console.log('Insufficient materials to upgrade ship (need at least 5).');
      return resolve();
    }
    console.log('\nUpgrade options available (cost: 5 materials):');
    console.log('(1) Fuel Efficiency - Reduce fuel consumption');
    console.log('(2) Food Storage - Better food management (flavor)');
    console.log('(3) Oxygen Recycling - Reduce oxygen consumption');
    console.log('(4) Repair Systems - Improve repair effects');
    console.log('(5) Weapons - Improve combat outcomes');
    rl.question('Choose upgrade to apply (1-5) or press enter to skip: ', input => {
      const choice = parseInt(input.trim());
      if (choice >=1 && choice <=5) {
        state.resources.materials -= 5;
        switch(choice) {
          case 1: state.ship.upgrades.fuelEfficiency++; break;
          case 2: state.ship.upgrades.foodStorage++; break;
          case 3: state.ship.upgrades.oxygenRecycling++; break;
          case 4: state.ship.upgrades.repairSystems++; break;
          case 5: state.ship.upgrades.weapons++; break;
        }
        console.log('Upgrade applied successfully.');
      } else {
        console.log('No upgrade applied this turn.');
      }
      resolve();
    });
  });
}

function moveForward() {
  // Need at least 1 fuel to move
  if(state.resources.fuel <= 0) {
    console.log('Not enough fuel to move forward this day.');
    return;
  }
  state.location++;
  console.log('You move forward one sector toward home.');
}

async function playerTurn() {
  clrscr();
  showStatus();
  consumeResources(true);

  if (checkGameOver()) {
    rl.close();
    return;
  }

  // Run event
  const event = getRandomEvent();
  await event();

  if (checkGameOver()) {
    rl.close();
    return;
  }

  // After event, offer upgrade
  await upgradeShip();

  if (checkGameOver()) {
    rl.close();
    return;
  }

  // Move forward at end of turn if possible
  moveForward();

  if (checkGameOver()) {
    rl.close();
    return;
  }

  // Advance to next day
  state.day++;

  if (state.day > DAYS_TO_SURVIVE || state.location >= DAYS_TO_SURVIVE) {
    if (state.crew.alive > 0 && state.ship.integrity > 0 && state.resources.oxygen > 0) {
      console.log('\nCongratulations! You have successfully navigated through the hostile nebula and reached the home sector safely.');
      state.gameOver = true;
      rl.close();
      return;
    } else {
      console.log('\nYou reached your destination but your crew or ship did not survive. Mission failed.');
      state.gameOver = true;
      rl.close();
      return;
    }
  }

  // Prompt to continue
  rl.question('\nPress Enter to proceed to the next day... ', () => {
    playerTurn();
  });
}

function startGame() {
  clrscr();
  console.log('Welcome to Nebula Nomads!');
  console.log('Command your spaceship crew to survive a hostile, resource-scarce nebula region.');
  console.log('Manage your fuel, food, oxygen, and ship integrity. Upgrade wisely, survive events, and reach home.');
  console.log('Win by reaching the home sector in 20 days with at least one crew member alive.');
  console.log('Good luck, Nomad!\n');
  rl.question('Press Enter to start your journey... ', () => {
    playerTurn();
  });
}

startGame();
