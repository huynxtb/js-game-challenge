const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Game constants
const MAX_DAYS = 30;
const CRITICAL_HEALTH = 10; // Colony health critical threshold
const INITIAL_HEALTH = 100;

// Crop definitions
const CROPS = {
  "Martian Potatoes": {
    growthTime: 5,    // days
    waterCost: 3,     // per day
    energyCost: 2,    // per day
    nutrientCost: 1,  // per day
    foodYield: 20    // food produced when harvested
  },
  "Solar Wheat": {
    growthTime: 3,
    waterCost: 2,
    energyCost: 3,
    nutrientCost: 2,
    foodYield: 15
  },
  "Alien Berries": {
    growthTime: 7,
    waterCost: 4,
    energyCost: 1,
    nutrientCost: 3,
    foodYield: 30
  }
};

const EVENT_CHANCE = 0.3; // 30% chance of random event each day

// Game state
let state = {
  day: 1,
  water: 100,
  energy: 100,
  nutrients: 100,
  colonyHealth: INITIAL_HEALTH,
  foodSupply: 50,
  cropsPlanted: [], // each crop: {name, plantedDay, growthTime}
  morale: 100
};

// Utility Functions
function promptUser(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function printSeparator() {
  console.log('------------------------------------------------------------');
}

function printStatus() {
  console.log(`\nDay ${state.day} Status:`);
  printSeparator();
  console.log(`Resources:`);
  console.log(` Water:     ${state.water}`);
  console.log(` Energy:    ${state.energy}`);
  console.log(` Nutrients: ${state.nutrients}`);
  console.log(`Food Supply: ${state.foodSupply}`);
  console.log(`Colony Health: ${state.colonyHealth}`);
  console.log(`Morale: ${state.morale}`);
  console.log('\nCrops Planted:');
  if(state.cropsPlanted.length === 0) {
    console.log(' None');
  } else {
    state.cropsPlanted.forEach((crop, idx) => {
      let daysGrowing = state.day - crop.plantedDay;
      let daysLeft = crop.growthTime - daysGrowing;
      let status = daysLeft <= 0 ? 'Ready to Harvest' : `${daysLeft} day(s) to mature`;
      console.log(` ${idx + 1}. ${crop.name} - ${status}`);
    });
  }
  printSeparator();
}

function checkGameOver() {
  if (state.water <= 0 || state.energy <= 0 || state.nutrients <= 0) {
    console.log('\n*** RESOURCE DEPLETION! ***');
    return true;
  }
  if (state.colonyHealth <= 0) {
    console.log('\n*** COLONY HEALTH CRITICAL! ***');
    return true;
  }
  return false;
}

function randomEvent() {
  if (Math.random() > EVENT_CHANCE) {
    return null;
  }
  const events = [
    {
      name: "Dust Storm",
      description: "A fierce dust storm reduces water supply and slows crop growth!",
      effect: () => {
        const waterLost = Math.floor(state.water * 0.2);
        state.water -= waterLost;
        // Increase growth time for all crops by 1 day
        state.cropsPlanted.forEach(crop => { crop.growthTime += 1; });
        console.log(`\n** RANDOM EVENT: Dust Storm! Water lost: ${waterLost}, all crops growth time +1 day.`);
      }
    },
    {
      name: "Alien Pests",
      description: "Alien pests attack! Some crops are damaged and nutrient levels drop.",
      effect: () => {
        const nutrientsLost = Math.floor(state.nutrients * 0.25);
        state.nutrients -= nutrientsLost;
        // Remove half of the crops (rounded down)
        const removedCount = Math.floor(state.cropsPlanted.length / 2);
        if(removedCount > 0) {
          for(let i=0; i<removedCount; i++) {
            const removed = state.cropsPlanted.shift();
            console.log(` - Lost ${removed.name} to alien pests.`);
          }
        } else {
          console.log(' - No crops lost, but nutrients depleted.');
        }
        console.log(`Nutrients lost: ${nutrientsLost}`);
        console.log(`\n** RANDOM EVENT: Alien Pests!`);
      }
    },
    {
      name: "Solar Flare",
      description: "A solar flare interferes with energy systems, temporarily reducing energy.",
      effect: () => {
        const energyLost = 15;
        state.energy -= energyLost;
        console.log(`\n** RANDOM EVENT: Solar Flare! Energy lost: ${energyLost}`);
      }
    },
    {
      name: "Good Harvest",
      description: "Environmental conditions help crops grow faster!",
      effect: () => {
        state.cropsPlanted.forEach(crop => {
          // Speed up crop growth by 1 day
          crop.plantedDay += 1;
        });
        console.log(`\n** RANDOM EVENT: Good Harvest! Crop growth accelerated by 1 day.`);
      }
    },
    {
      name: "Water Discovery",
      description: "An underground water source is found, increasing water supply!",
      effect: () => {
        const waterGained = 30;
        state.water += waterGained;
        console.log(`\n** RANDOM EVENT: Water Discovery! Water gained: ${waterGained}`);
      }
    }
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  event.effect();
  return event;
}

function updateColonyHealth() {
  // Morale depends on food supply
  if (state.foodSupply < 10) {
    state.morale -= 10;
    state.colonyHealth -= 15;
    console.log('\n[Warning] Food supply is very low! Morale and colony health drop.');
  } else if(state.foodSupply < 30) {
    state.morale -= 5;
    state.colonyHealth -= 5;
    console.log('\n[Warning] Food supply getting low. Morale and colony health slightly decrease.');
  } else {
    // Slowly recover morale and health if food is adequate
    state.morale = Math.min(state.morale + 3, 100);
    state.colonyHealth = Math.min(state.colonyHealth + 2, 100);
  }

  // Colony health affected by morale
  if(state.morale < 20){
    state.colonyHealth -= 5;
    console.log('\n[Warning] Morale critically low! Colony health suffers.');
  }

  // Ensure no negative values
  state.colonyHealth = Math.max(state.colonyHealth, 0);
  state.morale = Math.max(state.morale, 0);
}

function consumeResourcesForCrops() {
  // Each crop consumes water, energy, nutrients per day
  state.cropsPlanted.forEach(crop => {
    let cd = CROPS[crop.name];
    // Deduct resource costs for each crop daily
    state.water -= cd.waterCost;
    state.energy -= cd.energyCost;
    state.nutrients -= cd.nutrientCost;
  });
}

async function playerAction() {
  console.log('\nChoose your action:');
  console.log(' 1. Plant Crops');
  console.log(' 2. Water Crops (increase growth speed at some extra water cost)');
  console.log(' 3. Harvest Crops');
  console.log(' 4. Wait to Next Day');

  let action = await promptUser('Enter the number of your action: ');
  action = action.trim();

  switch(action) {
    case '1':
      return await plantCrops();
    case '2':
      return waterCrops();
    case '3':
      return harvestCrops();
    case '4':
      console.log('Waiting till next day...');
      return;
    default:
      console.log('Invalid input, please enter 1, 2, 3, or 4.');
      return await playerAction();
  }
}

async function plantCrops() {
  console.log('\nAvailable Crops to Plant:');
  const cropNames = Object.keys(CROPS);
  cropNames.forEach((name, idx) => {
    const crop = CROPS[name];
    console.log(` ${idx + 1}. ${name} (Growth: ${crop.growthTime} days, Daily Water: ${crop.waterCost}, Energy: ${crop.energyCost}, Nutrients: ${crop.nutrientCost})`);
  });

  let choice = await promptUser('Enter the number of the crop to plant (or 0 to cancel): ');
  choice = choice.trim();
  const index = parseInt(choice) - 1;
  if (choice === '0') {
    console.log('Canceled planting.');
    return;
  }
  if (index < 0 || index >= cropNames.length || isNaN(index)) {
    console.log('Invalid crop selection.');
    return await plantCrops();
  }

  // Plant the selected crop
  const cropName = cropNames[index];
  state.cropsPlanted.push({
    name: cropName,
    plantedDay: state.day,
    growthTime: CROPS[cropName].growthTime
  });
  console.log(`Planted: ${cropName}`);
}

function waterCrops() {
  if (state.cropsPlanted.length === 0) {
    console.log('No crops to water.');
    return;
  }
  // Watering crops accelerates growth by reducing 1 day from growth time for each crop,
  // but costs extra water (5 units flat cost).
  const WATERING_COST = 5;
  if(state.water < WATERING_COST) {
    console.log('Not enough water to water crops.');
    return;
  }
  state.water -= WATERING_COST;
  state.cropsPlanted.forEach(crop => {
    crop.growthTime = Math.max(crop.growthTime - 1, 1); // don't allow below 1
  });
  console.log('Watered crops: growth time reduced by 1 day for each crop, extra water consumed.');
}

function harvestCrops() {
  // Harvest all crops that are ready (growthTime <= days grown)
  if(state.cropsPlanted.length === 0) {
    console.log('No crops to harvest.');
    return;
  }
  let harvestedCount = 0;
  let foodGained = 0;
  const remainingCrops = [];

  state.cropsPlanted.forEach(crop => {
    let daysGrown = state.day - crop.plantedDay;
    if(daysGrown >= crop.growthTime) {
      // Harvest
      harvestedCount++;
      let cropFood = CROPS[crop.name].foodYield;
      foodGained += cropFood;
      console.log(`Harvested ${crop.name} and gained ${cropFood} food.`);
    } else {
      remainingCrops.push(crop);
    }
  });
  state.cropsPlanted = remainingCrops;
  if(harvestedCount === 0) {
    console.log('No crops are ready to harvest yet.');
  } else {
    state.foodSupply += foodGained;
  }
}

async function gameLoop() {
  console.clear();
  console.log('Welcome to AstroFarm: Colony Survival!');
  console.log('Manage your colony farm on a distant planet for 30 days to achieve sustainability.');
  console.log('Avoid resource depletion and maintain colony health to win.');
  printSeparator();

  while (state.day <= MAX_DAYS) {
    printStatus();

    // Player action
    await playerAction();

    // Resource consumption by crops
    consumeResourcesForCrops();

    // Random event
    randomEvent();

    // Update colony health and morale
    updateColonyHealth();

    // Check for game over
    if (checkGameOver()) {
      console.log('GAME OVER. Your colony did not survive.');
      rl.close();
      return;
    }

    // Daily food consumption by colonists (assume 5 food consumed daily)
    const foodConsumed = 5;
    if(state.foodSupply >= foodConsumed) {
      state.foodSupply -= foodConsumed;
    } else {
      // Not enough food, reduce colony health
      state.colonyHealth -= 10;
      state.foodSupply = 0;
      console.log('\n[Warning] Food supply insufficient! Colony health decreases.');
    }

    if(state.day === MAX_DAYS) {
      // Win condition check
      // Sustainable if after 30 days no resource zero or health critical
      if(state.water > 0 && state.energy > 0 && state.nutrients > 0 && state.colonyHealth >= CRITICAL_HEALTH) {
        console.log('\nCONGRATULATIONS! You have successfully sustained the colony farm for 30 days!');
        rl.close();
        return;
      } else {
        console.log('\nYou survived 30 days, but colony sustainability was not met. Game Over.');
        rl.close();
        return;
      }
    }

    state.day++;
  }
}

// Start the game
gameLoop();
