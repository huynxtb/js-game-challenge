// Chrono Colony - A text-based console game for Node.js
// Author: ChatGPT
// Game: Build and manage a colony on a distant planet

const readline = require('readline');

// Readline interface for user input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colony and game state constants
const MAX_DAYS = 30;
const INITIAL_COLONY_MEMBERS = 5;
const RESOURCE_NAMES = ['water', 'food', 'shelterMaterials', 'energy'];

// Each turn represents one day

// Colony object to hold state
class Colony {
  constructor() {
    this.day = 1;
    this.members = INITIAL_COLONY_MEMBERS;
    this.resources = {
      water: 20,        // Units of water
      food: 20,         // Units of food
      shelterMaterials: 10, // Shelter material units
      energy: 15        // Energy units
    };
    this.shelterIntegrity = 5; // Scale 0 (destroyed)-10 (perfect)
  }

  consumeResources() {
    // Each member consumes 1 water and 1 food per day
    const waterNeeded = this.members;
    const foodNeeded = this.members;

    this.resources.water -= waterNeeded;
    this.resources.food -= foodNeeded;

    let deaths = 0;
    // If water or food is insufficient, members die
    if (this.resources.water < 0) {
      deaths = Math.min(this.members, Math.ceil(-this.resources.water));
      this.resources.water = 0;
    }
    if (this.resources.food < 0) {
      deaths = Math.min(this.members, deaths + Math.ceil(-this.resources.food));
      this.resources.food = 0;
    }

    if (deaths > 0) {
      this.members -= deaths;
    }
    return deaths;
  }

  isLost() {
    return this.members <= 0 || 
           this.resources.water <= 0 && this.members > 0 || 
           this.resources.food <= 0 && this.members > 0;
  }

  isWon() {
    return this.day > MAX_DAYS && this.members > 0;
  }

  summary() {
    return `Day ${this.day} Summary:\n` +
      `Colony Members: ${this.members}\n` +
      `Water: ${this.resources.water} units\n` +
      `Food: ${this.resources.food} units\n` +
      `Shelter Materials: ${this.resources.shelterMaterials} units\n` +
      `Energy: ${this.resources.energy} units\n` +
      `Shelter Integrity: ${this.shelterIntegrity}/10\n`;
  }
}

// Events that can happen each day
// Each event modifies colony's resources or status
const EVENTS = [
  {
    name: 'Alien Rainstorm',
    description: 'A sudden acidic rainstorm hits the colony, damaging the shelter and using more water.',
    apply: (colony) => {
      // Damage shelter by 1-2 points
      let damage = Math.floor(Math.random() * 2) + 1;
      colony.shelterIntegrity = Math.max(0, colony.shelterIntegrity - damage);
      // Water consumption increases by 3 units
      colony.resources.water -= 3;
      return `The Acidic rainstorm caused shelter damage (-${damage} shelter integrity) and increased water consumption (-3 water).`;
    }
  },
  {
    name: 'Solar Flare',
    description: 'A solar flare disrupts energy systems, reducing available energy.',
    apply: (colony) => {
      let lostEnergy = Math.min(colony.resources.energy, Math.floor(Math.random() * 4) + 2);
      colony.resources.energy -= lostEnergy;
      return `Solar flare disrupted energy systems (-${lostEnergy} energy).`;
    }
  },
  {
    name: 'Alien Encounter',
    description: 'Curious friendly aliens visit and provide some resources.',
    apply: (colony) => {
      let giftWater = Math.floor(Math.random() * 3) + 1;
      let giftFood = Math.floor(Math.random() * 3) + 1;
      colony.resources.water += giftWater;
      colony.resources.food += giftFood;
      return `Friendly aliens gifted water (+${giftWater}) and food (+${giftFood}).`;
    }
  },
  {
    name: 'Equipment Failure',
    description: 'A critical equipment failure reduces shelter materials and energy.',
    apply: (colony) => {
      let lostShelter = Math.min(colony.resources.shelterMaterials, Math.floor(Math.random() * 3) + 1);
      let lostEnergy = Math.min(colony.resources.energy, Math.floor(Math.random() * 3) + 1);
      colony.resources.shelterMaterials -= lostShelter;
      colony.resources.energy -= lostEnergy;
      return `Equipment failure caused loss of shelter materials (-${lostShelter}) and energy (-${lostEnergy}).`;
    }
  },
  {
    name: 'Calm Day',
    description: 'A calm day. No unusual events.',
    apply: (colony) => {
      return 'A calm day with no unusual events.';
    }
  }
];

// Actions player can take each day
// Actions influence resources or colony status
const ACTIONS = [
  {
    id: 'gather',
    label: 'Gather Resources',
    description: 'Send colonists to gather water, food, and shelter materials. Uses energy but can yield resources.',
    perform: (colony) => {
      if (colony.resources.energy < 2) {
        return 'Not enough energy to gather resources.';
      }
      colony.resources.energy -= 2;
      // Gain random amounts of resources
      const waterGathered = Math.floor(Math.random() * 4) + 2;
      const foodGathered = Math.floor(Math.random() * 3) + 1;
      const shelterMaterialsFound = Math.floor(Math.random() * 2) + 1;
      colony.resources.water += waterGathered;
      colony.resources.food += foodGathered;
      colony.resources.shelterMaterials += shelterMaterialsFound;

      return `Gathered: +${waterGathered} water, +${foodGathered} food, +${shelterMaterialsFound} shelter materials (-2 energy).`;
    }
  },
  {
    id: 'reinforce',
    label: 'Reinforce Shelter',
    description: 'Use shelter materials and energy to improve shelter integrity.',
    perform: (colony) => {
      if (colony.resources.shelterMaterials < 2) {
        return 'Not enough shelter materials to reinforce.';
      }
      if (colony.resources.energy < 2) {
        return 'Not enough energy to reinforce shelter.';
      }
      colony.resources.shelterMaterials -= 2;
      colony.resources.energy -= 2;
      const improvement = Math.floor(Math.random() * 3) + 1;
      colony.shelterIntegrity = Math.min(10, colony.shelterIntegrity + improvement);
      return `Shelter reinforced (+${improvement} shelter integrity, -2 shelter materials, -2 energy).`;
    }
  },
  {
    id: 'explore',
    label: 'Explore Surroundings',
    description: 'Send colonists to explore nearby area, chance to find resources or trigger events.',
    perform: (colony) => {
      if (colony.resources.energy < 3) {
        return 'Not enough energy to explore.';
      }
      colony.resources.energy -= 3;
      const chance = Math.random();
      if (chance < 0.4) {
        // Find resources
        const waterFound = Math.floor(Math.random() * 5) + 1;
        const foodFound = Math.floor(Math.random() * 3);
        colony.resources.water += waterFound;
        colony.resources.food += foodFound;
        return `Exploration successful: +${waterFound} water, +${foodFound} food (-3 energy).`;
      } else if (chance < 0.7) {
        // Find shelter materials
        const shelterFound = Math.floor(Math.random() * 3) + 1;
        colony.resources.shelterMaterials += shelterFound;
        return `Exploration found shelter materials (+${shelterFound}) (-3 energy).`;
      } else {
        // Trigger random event
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const eventMessage = event.apply(colony);
        return `Exploration triggered event: ${event.name} - ${eventMessage} (-3 energy).`;
      }
    }
  },
  {
    id: 'rest',
    label: 'Rest',
    description: 'Do nothing to conserve energy. No resource changes but colony members regain morale.',
    perform: (colony) => {
      // For now, morale is implied, resting just skips energy consumption
      return 'Colony rested and conserved energy.';
    }
  }
];

// Utility: prompt user for input, return promise
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main game loop
async function gameLoop() {
  console.clear();
  console.log('Welcome to Chrono Colony!');
  console.log('Build and manage a colony on a distant planet. Survive 30 days through good and bad times.');
  console.log('(Press Ctrl+C to quit anytime)');

  const colony = new Colony();

  while(true) {
    console.log('\n------------------------------------------');
    console.log(colony.summary());

    // Daily Event
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const eventMessage = event.apply(colony);
    console.log(`Event of the day: ${event.name} - ${eventMessage}`);

    // Consume resources (water, food) and check for deaths due to shortages
    const deaths = colony.consumeResources();
    if (deaths > 0) {
      console.log(`Due to resource shortages, ${deaths} colonist(s) have perished.`);
    }

    if (colony.isLost()) {
      console.log('\nYour colony has lost the struggle to survive on this harsh planet.');
      console.log('All colony members have perished or essential resources are depleted.');
      break;
    }

    if (colony.isWon()) {
      console.log(`\nCongratulations! You have successfully kept the colony alive for ${MAX_DAYS} days!`);
      break;
    }

    console.log('\nChoose an action for the day:');
    for (const [index, action] of ACTIONS.entries()) {
      console.log(`${index + 1}. ${action.label} - ${action.description}`);
    }

    let actionChoice;
    while(true) {
      const input = await prompt('Enter the number of your chosen action: ');
      const choiceIndex = Number(input) - 1;
      if (choiceIndex >= 0 && choiceIndex < ACTIONS.length) {
        actionChoice = ACTIONS[choiceIndex];
        break;
      }
      console.log('Invalid input, please enter a valid number for your choice.');
    }

    const actionResult = actionChoice.perform(colony);
    console.log(`\nAction result: ${actionResult}`);

    colony.day++;
  }

  rl.close();
  console.log('\nThanks for playing Chrono Colony!');
  process.exit(0);
}

// Start the game
gameLoop();
