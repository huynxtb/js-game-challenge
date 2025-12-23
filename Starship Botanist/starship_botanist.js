const readline = require('readline');

// Game constants
const MAX_DAYS = 1000; // safety limit if needed
const CRITICAL_OXYGEN = 15;
const INITIAL_OXYGEN = 50;
const INITIAL_WATER = 50;
const INITIAL_ENERGY = 50;
const INITIAL_SAMPLES = 0;
const REQUIRED_ENGINE_REPAIR = 100;
const CONSECUTIVE_SAFE_DAYS = 30;

// Plant definitions
const PLANT_TYPES = [
  {
    name: 'Glowa Fern',
    growthTime: 3, // days to mature
    oxygenProduction: 10, // oxygen units per mature day
    waterConsumption: 4, // per day
    energyConsumption: 3, // per day
    sampleCost: 1
  },
  {
    name: 'Luma Bloom',
    growthTime: 5,
    oxygenProduction: 18,
    waterConsumption: 6,
    energyConsumption: 5,
    sampleCost: 2
  },
  {
    name: 'Creepnut Pods',
    growthTime: 7,
    oxygenProduction: 25,
    waterConsumption: 8,
    energyConsumption: 7,
    sampleCost: 3
  },
  {
    name: 'Aqua Spires',
    growthTime: 4,
    oxygenProduction: 12,
    waterConsumption: 5,
    energyConsumption: 6,
    sampleCost: 2
  },
  {
    name: 'Suncoil Vines',
    growthTime: 6,
    oxygenProduction: 20,
    waterConsumption: 7,
    energyConsumption: 8,
    sampleCost: 4
  }
];

// Random event definitions
const RANDOM_EVENTS = [
  {
    name: 'Equipment Malfunction',
    effect: (game) => {
      const energyLoss = Math.min(game.energy, 10);
      game.energy -= energyLoss;
      return `Equipment Malfunction! Lost ${energyLoss} energy.`;
    }
  },
  {
    name: 'Plant Disease Outbreak',
    effect: (game) => {
      if (game.plants.length === 0) return `No plants to affect.`;
      // Randomly kill one plant
      const alivePlants = game.plants.filter(p => p.health > 0);
      if (alivePlants.length === 0) return `All plants are already dead.`;
      const index = Math.floor(Math.random() * alivePlants.length);
      const plant = alivePlants[index];
      plant.health -= 2;
      if (plant.health <= 0) {
        plant.health = 0;
        return `A disease killed your ${plant.type.name}.`;
      } else {
        return `A disease struck your ${plant.type.name}, health reduced.`;
      }
    }
  },
  {
    name: 'Environmental Hazard',
    effect: (game) => {
      const oxygenLoss = Math.min(game.oxygen, 8);
      game.oxygen -= oxygenLoss;
      return `Environmental Hazard reduces oxygen by ${oxygenLoss}.`;
    }
  },
  {
    name: 'Rare Seed Discovery',
    effect: (game) => {
      // Grants rare seed (a plant sample)
      game.samples += 1;
      return `You found a rare seed sample while exploring! (+1 sample)`;
    }
  },
  {
    name: 'Water Vein Found',
    effect: (game) => {
      const waterGain = 10;
      game.water += waterGain;
      return `Discovered underground water vein! +${waterGain} water.`;
    }
  },
  {
    name: 'Energy Recharge',
    effect: (game) => {
      const energyGain = 10;
      game.energy += energyGain;
      return `Solar panels recharge energy by +${energyGain}.`;
    }
  },
  {
    name: 'Nothing Happens',
    effect: () => `Quiet and calm day. No incident.`
  }
];

class Plant {
  constructor(type) {
    this.type = type;
    this.age = 0; // days since planted
    this.health = 5; // max health 5
    this.mature = false;
  }

  // Advance a day for this plant
  grow(game) {
    if (this.health <= 0) return; // Dead

    // Consume resources
    if (game.water < this.type.waterConsumption || game.energy < this.type.energyConsumption) {
      this.health -= 1; // starve
    } else {
      game.water -= this.type.waterConsumption;
      game.energy -= this.type.energyConsumption;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.mature = false;
      return;
    }

    this.age += 1;
    if (this.age >= this.type.growthTime) {
      this.mature = true;
    }
  }

  produceOxygen() {
    if (this.health <= 0 || !this.mature) return 0;
    return this.type.oxygenProduction * (this.health / 5); // health modulates output
  }

  isAlive() {
    return this.health > 0;
  }

  getStatus() {
    return `${this.type.name} | Age: ${this.age}/${this.type.growthTime} | Health: ${this.health}/5 | ${this.mature ? 'Mature' : 'Growing'}`;
  }
}

class StarshipBotanistGame {
  constructor() {
    this.day = 1;
    this.oxygen = INITIAL_OXYGEN;
    this.water = INITIAL_WATER;
    this.energy = INITIAL_ENERGY;
    this.samples = INITIAL_SAMPLES;
    this.plants = [];
    this.engineRepairProgress = 0;
    this.consecutiveSafeDays = 0;
    this.gameOver = false;
    this.win = false;
  }

  statusReport() {
    const plantStatus = this.plants.length
      ? this.plants.map((p, i) => `  [${i + 1}] ${p.getStatus()}`).join('\n')
      : '  None';

    return (
      `\n--- Day ${this.day} Status ---\n` +
      `Oxygen: ${this.oxygen.toFixed(1)}\n` +
      `Water: ${this.water.toFixed(1)}\n` +
      `Energy: ${this.energy.toFixed(1)}\n` +
      `Botanical Samples: ${this.samples}\n` +
      `Engine Repair: ${this.engineRepairProgress}/${REQUIRED_ENGINE_REPAIR}\n` +
      `Plants:\n${plantStatus}\n` +
      `-------------------------\n`
    );
  }

  plantNew(typeIndex) {
    if (typeIndex < 0 || typeIndex >= PLANT_TYPES.length) {
      return 'Invalid plant choice.';
    }
    const plantType = PLANT_TYPES[typeIndex];
    if (this.samples < plantType.sampleCost) {
      return `Insufficient botanical samples to plant ${plantType.name}.`;
    }
    this.samples -= plantType.sampleCost;
    this.plants.push(new Plant(plantType));
    return `${plantType.name} planted.`;
  }

  explore() {
    // Exploring costs energy and water
    const energyCost = 5;
    const waterCost = 3;
    if (this.energy < energyCost || this.water < waterCost) {
      return 'Not enough energy or water to explore.';
    }
    this.energy -= energyCost;
    this.water -= waterCost;

    // 60% chance for random event selection related to exploration
    let eventPool = RANDOM_EVENTS.filter(e => e.name === 'Rare Seed Discovery' || e.name === 'Water Vein Found' || e.name === 'Energy Recharge' || e.name === 'Nothing Happens');
    if (Math.random() < 0.6) {
      const event = eventPool[Math.floor(Math.random() * eventPool.length)];
      return event.effect(this);
    }
    return 'Exploration yielded no results today.';
  }

  advanceDay(action, param) {
    if (this.gameOver) return;

    let actionMessage = '';
    switch (action) {
      case 'plant':
        actionMessage = this.plantNew(param);
        break;
      case 'explore':
        actionMessage = this.explore();
        break;
      case 'idle':
        actionMessage = 'Day spent maintaining current operations.';
        break;
      default:
        actionMessage = 'Invalid action; day wasted.';
        break;
    }

    let plantOxygenProduced = 0;
    let plantsAlive = 0;
    for (const plant of this.plants) {
      plant.grow(this);
      if (plant.isAlive()) {
        plantOxygenProduced += plant.produceOxygen();
        plantsAlive += 1;
      }
    }

    // Oxygen consumption by player and life support consumes oxygen daily
    const oxygenConsumed = 12; // baseline consumption
    this.oxygen += plantOxygenProduced;
    this.oxygen -= oxygenConsumed;

    if (this.oxygen > 100) this.oxygen = 100.0;
    if (this.water > 100) this.water = 100.0;
    if (this.energy > 100) this.energy = 100.0;

    // Random event possibility (20% chance)
    let randomEventMsg = '';
    if (Math.random() < 0.20) {
      // Pick one random event except exploration rewards
      const eventCandidates = RANDOM_EVENTS.filter(e => !['Rare Seed Discovery', 'Water Vein Found', 'Energy Recharge', 'Nothing Happens'].includes(e.name));
      const event = eventCandidates[Math.floor(Math.random() * eventCandidates.length)];
      randomEventMsg = event.effect(this);
    }

    // Engine repair progress depends on stable environment
    if (this.oxygen > CRITICAL_OXYGEN && plantsAlive > 0 && this.water > 5 && this.energy > 5) {
      this.engineRepairProgress += 3; // daily progress if conditions are good
      this.consecutiveSafeDays++;
    } else {
      this.consecutiveSafeDays = 0;
    }

    // Check loss conditions
    if (this.oxygen <= 0) {
      this.gameOver = true;
      this.win = false;
      return {
        dayReport: `Oxygen depleted completely. You suffocated.",\nAction: ${actionMessage}\n${randomEventMsg}`,
        gameOver: true
      };
    }
    if (this.water <= 0) {
      this.gameOver = true;
      this.win = false;
      return {
        dayReport: `Water resources fully depleted. You could not survive.",\nAction: ${actionMessage}\n${randomEventMsg}`,
        gameOver: true
      };
    }
    if (this.energy <= 0) {
      this.gameOver = true;
      this.win = false;
      return {
        dayReport: `Energy failed completely, shutting down life support.",\nAction: ${actionMessage}\n${randomEventMsg}`,
        gameOver: true
      };
    }
    if (plantsAlive === 0 && this.plants.length > 0) {
      this.gameOver = true;
      this.win = false;
      return {
        dayReport: `All your plants have died. You cannot produce oxygen.",\nAction: ${actionMessage}\n${randomEventMsg}`,
        gameOver: true
      };
    }

    // Win condition
    if (this.engineRepairProgress >= REQUIRED_ENGINE_REPAIR && this.consecutiveSafeDays >= CONSECUTIVE_SAFE_DAYS) {
      this.gameOver = true;
      this.win = true;
      return {
        dayReport: `You have repaired the starship's engines and maintained life support for ${CONSECUTIVE_SAFE_DAYS} days. Escape is possible! Congratulations!",
Action: ${actionMessage}\n${randomEventMsg}`,
        gameOver: true
      };
    }

    this.day++;
    if (this.day > MAX_DAYS) {
      this.gameOver = true;
      this.win = false;
      return {
        dayReport: 'You ran out of time. The rescue never came and supplies depleted.',
        gameOver: true
      };
    }

    return {
      dayReport: `Day ended.\nAction: ${actionMessage}\n${randomEventMsg}`,
      gameOver: false
    };
  }
}

function printInstructions() {
  console.log('Welcome to Starship Botanist!');
  console.log('You are a botanist stranded on an alien planet aboard a starship with failing systems.');
  console.log('Your goal is to cultivate alien plants to produce oxygen and gather resources to repair the starship engines.');
  console.log('You will manage oxygen, water, energy, and botanical samples each day (turn).');
  console.log('Actions you can take each day:');
  console.log('  plant - Plant a new alien species if you have enough samples.');
  console.log('  explore - Explore the nearby environment to find samples or resources (costs water and energy).');
  console.log('  idle - Do nothing this day, conserve resources.');
  console.log('\nWin by repairing the engines and maintaining oxygen above a critical level for 30 days in a row.');
  console.log('Lose if oxygen depletes, water or energy run out, or all plants die before repairs complete.');
  console.log('');
  console.log('Good luck! Press Ctrl+C at any time to quit.');
  console.log('');
}

function promptUser(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      resolve(input.trim());
    });
  });
}

async function main() {
  const game = new StarshipBotanistGame();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  printInstructions();

  while (!game.gameOver) {
    console.log(game.statusReport());

    let action = await promptUser(rl, 'Choose an action (plant, explore, idle): ');
    action = action.toLowerCase();

    let param = null;
    if (action === 'plant') {
      console.log('Available plants to grow:');
      PLANT_TYPES.forEach((pt, i) => {
        console.log(`  [${i}] ${pt.name} | Growth: ${pt.growthTime}d | O2/day: ${pt.oxygenProduction} | Water/day: ${pt.waterConsumption} | Energy/day: ${pt.energyConsumption} | Sample Cost: ${pt.sampleCost}`);
      });
      let plantChoice = await promptUser(rl, 'Enter number of plant to cultivate: ');
      let cNum = parseInt(plantChoice, 10);
      if (isNaN(cNum) || cNum < 0 || cNum >= PLANT_TYPES.length) {
        console.log('Invalid plant choice. Skipping planting this turn.');
        action = 'idle';
      } else {
        param = cNum;
      }
    }

    const result = game.advanceDay(action, param);
    console.log(result.dayReport);

    if (result.gameOver) {
      if (game.win) {
        console.log('\n*** YOU WIN! You repaired the starship and escaped. ***');
      } else {
        console.log('\n*** GAME OVER ***');
      }
      break;
    }

  }

  rl.close();
}

main();
