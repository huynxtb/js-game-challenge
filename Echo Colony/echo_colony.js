const readline = require('readline');

// Echo Colony: A turn-based console game for managing a colony on an alien planet.

class Colony {
  constructor() {
    this.day = 1;
    this.population = 5;
    this.food = 50;
    this.materials = 30;
    this.energy = 40;
    this.exploredAreas = 1;
    this.stableTurns = 0; // turns with surplus resources and population growth
    this.isDestroyed = false;

    // To track the history for win conditions:
    this.history = { food: [], energy: [], population: [] };

    // Messages to show player
    this.messages = [];

    // Exploration discoveries
    this.possibleDiscoveries = [
      { type: 'resource', resource: 'food', amount: 10, description: 'a fertile alien berry bush' },
      { type: 'resource', resource: 'materials', amount: 8, description: 'an abandoned alien mining outpost' },
      { type: 'resource', resource: 'energy', amount: 12, description: 'a natural geothermal vent' },
      { type: 'threat', description: 'a pack of aggressive alien creatures' },
      { type: 'artifact', description: 'a mysterious ancient alien artifact glowing with energy' },
      { type: 'resource', resource: 'food', amount: 15, description: 'rich fungal growths' },
      { type: 'resource', resource: 'materials', amount: 10, description: 'metallic crystals embedded in rock' },
      { type: 'threat', description: 'a sudden electrical storm disrupts colony electronics' },
      { type: 'artifact', description: 'a crashed drone containing advanced tech' },
      { type: 'resource', resource: 'energy', amount: 20, description: 'a small solar field' }
    ];

    this.randomEvents = [
      { type: 'positive', effect: () => { this.food += 10; return 'Alien wildlife migration increased available food.'; } },
      { type: 'negative', effect: () => { this.energy -= 15; return 'Energy systems were disrupted by a solar flare.'; } },
      { type: 'positive', effect: () => { this.materials += 12; return 'You salvaged materials from wreckage found nearby.'; } },
      { type: 'negative', effect: () => { this.population -= 2; return 'A minor outbreak sickened several colonists.'; } },
      { type: 'neutral', effect: () => { return 'A calm day passes with no notable events.'; } },
      { type: 'negative_major', effect: () => { this.isDestroyed = true; return 'A catastrophic cave-in destroyed the main colony hub!'; } },
      { type: 'positive', effect: () => { this.energy += 10; return 'A new energy conduit was discovered, boosting power reserves.'; } },
      { type: 'positive', effect: () => { this.population += 1; return 'A new colonist was born, strengthening the colony.'; } },
      { type: 'negative', effect: () => { this.materials -= 10; return 'Equipment failure consumed critical building materials.'; } },
      { type: 'positive', effect: () => { this.food += 15; return 'Fruitful harvest from cultivated alien plants.'; } }
    ];
  }

  consumeResources() {
    // Each colonist consumes 1 food and 1 energy per day
    const foodConsumed = this.population * 1;
    const energyConsumed = this.population * 1;

    this.food -= foodConsumed;
    this.energy -= energyConsumed;

    this.messages.push(`Consumed ${foodConsumed} food and ${energyConsumed} energy for the day.`);
  }

  populationGrowth() {
    // Population increases if there is surplus food and energy
    if (this.food > this.population * 2 && this.energy > this.population * 2) {
      const growth = Math.min(2, Math.floor((this.food - this.population*2)/10));
      if (growth > 0) {
        this.population += growth;
        this.messages.push(`Population grew by ${growth} colonists due to surplus resources.`);
        return growth;
      }
    }
    return 0;
  }

  checkWinLoss() {
    // Loss conditions
    if (this.population <= 0) {
      return { lost: true, reason: 'All colonists have perished.' };
    }
    if (this.food <= 0) {
      return { lost: true, reason: 'Colony ran out of food and could not sustain itself.' };
    }
    if (this.energy <= 0) {
      return { lost: true, reason: 'Energy reserves depleted. Colony systems failing.' };
    }
    if (this.isDestroyed) {
      return { lost: true, reason: 'Colony was destroyed by a major event.' };
    }

    // Win condition: population >= 50 and surplus of food, energy, materials for 10 turns
    if (
      this.population >= 50 &&
      this.food > this.population * 3 &&
      this.energy > this.population * 3 &&
      this.materials > this.population * 2
    ) {
      this.stableTurns++;
      if (this.stableTurns >= 10) {
        return { won: true };
      }
    } else {
      this.stableTurns = 0;
    }

    return { ongoing: true };
  }

  explore() {
    const discovery = this.possibleDiscoveries[Math.floor(Math.random() * this.possibleDiscoveries.length)];
    this.messages.push(`Exploration result: You discovered ${discovery.description}.`);
    if (discovery.type === 'resource') {
      this[discovery.resource] += discovery.amount;
      this.messages.push(`Collected +${discovery.amount} ${discovery.resource}.`);
    } else if (discovery.type === 'threat') {
      // Threat encounter: lose energy or materials or population
      const threatOutcome = Math.random();
      if (threatOutcome < 0.4) {
        const lossPop = Math.min(3, this.population);
        this.population -= lossPop;
        this.messages.push(`The threat caused the loss of ${lossPop} colonists.`);
      } else if (threatOutcome < 0.7) {
        const lossEnergy = Math.min(10, this.energy);
        this.energy -= lossEnergy;
        this.messages.push(`The threat damaged energy systems: -${lossEnergy} energy.`);
      } else {
        const lossMaterials = Math.min(8, this.materials);
        this.materials -= lossMaterials;
        this.messages.push(`The threat destroyed building materials: -${lossMaterials} materials.`);
      }
    } else if (discovery.type === 'artifact') {
      // Artifacts give random boosts
      const artifactRoll = Math.random();
      if (artifactRoll < 0.5) {
        const boostFood = 10;
        this.food += boostFood;
        this.messages.push(`The artifact emitted energy that boosted food supplies by +${boostFood}.`);
      } else if (artifactRoll < 0.8) {
        const boostEnergy = 15;
        this.energy += boostEnergy;
        this.messages.push(`The artifact powered energy reserves by +${boostEnergy}.`);
      } else {
        const newColonists = 1;
        this.population += newColonists;
        this.messages.push(`The artifact somehow encouraged new colonists to join (+${newColonists}).`);
      }
    }
    this.exploredAreas++;
  }

  triggerRandomEvent() {
    const eventChance = Math.random();
    if (eventChance < 0.5) {
      // No event
      this.messages.push('No major event occurred today.');
      return;
    }
    
    // Pick an event weighted by type
    // Major negative event much rarer
    const eventRoll = Math.random();
    let event;
    if (eventRoll < 0.05) {
      event = this.randomEvents.find(e => e.type === 'negative_major');
    } else if (eventRoll < 0.35) {
      // Negative events
      const negEvents = this.randomEvents.filter(e => e.type === 'negative');
      event = negEvents[Math.floor(Math.random() * negEvents.length)];
    } else if (eventRoll < 0.7) {
      // Positive events
      const posEvents = this.randomEvents.filter(e => e.type === 'positive');
      event = posEvents[Math.floor(Math.random() * posEvents.length)];
    } else {
      // Neutral
      event = this.randomEvents.find(e => e.type === 'neutral');
    }

    const eventMessage = event.effect();
    this.messages.push(`Event: ${eventMessage}`);
  }

  statusReport() {
    return `Day ${this.day}
Population: ${this.population}
Food: ${this.food}
Materials: ${this.materials}
Energy: ${this.energy}
Explored Areas: ${this.exploredAreas}
Stable Turns: ${this.stableTurns} (10 needed)`;
  }

  resetMessages() {
    this.messages = [];
  }

  getMessages() {
    return this.messages.join('\n');
  }
}

// Main game loop and interaction

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colony = new Colony();

function instructions() {
  return (`\nWelcome to Echo Colony!\n` +
    `You are managing a fledgling colony on an alien planet. Each turn represents one day.\n` +
    `Balance exploration, resource management, and colony growth to survive and expand.\n` +
    `\nCommands available each day:\n` +
    `explore - venture to discover new resources or threats\n` +
    `status - display current colony status\n` +
    `wait - pass the day without extra action\n` +
    `help - show instructions again\n` +
    `exit - quit the game\n` +
    `\nWin Condition: Reach 50 population and maintain stable surplus for 10 consecutive days.\n` +
    `Loss Conditions: Population or essential resources drop to zero or colony is destroyed.\n`);
}

function promptPlayer() {
  console.log('\n' + colony.statusReport());
  if (colony.messages.length > 0) {
    console.log(colony.getMessages());
  }
  colony.resetMessages();

  rl.question('\nEnter command (explore, status, wait, help, exit): ', (answer) => {
    handleInput(answer.trim().toLowerCase());
  });
}

function handleInput(input) {
  switch (input) {
    case 'explore':
      colony.explore();
      endTurn();
      break;
    case 'status':
      console.log('\nCurrent Status:');
      console.log(colony.statusReport());
      promptPlayer();
      break;
    case 'wait':
      colony.messages.push('You decided to wait and focus on internal management.');
      endTurn();
      break;
    case 'help':
      console.log(instructions());
      promptPlayer();
      break;
    case 'exit':
      console.log('Thanks for playing Echo Colony. Goodbye!');
      rl.close();
      break;
    default:
      console.log('Invalid command. Type "help" for instructions.');
      promptPlayer();
      break;
  }
}

function endTurn() {
  colony.consumeResources();
  colony.triggerRandomEvent();
  colony.populationGrowth();

  const status = colony.checkWinLoss();
  if (status.lost) {
    console.log('\nYour colony has failed!');
    console.log('Reason: ' + status.reason);
    console.log('Game Over on Day ' + colony.day);
    rl.close();
  } else if (status.won) {
    console.log('\nCongratulations! Your colony is thriving and sustainable!');
    console.log('You won the game on Day ' + colony.day + '!');
    rl.close();
  } else {
    colony.day++;
    promptPlayer();
  }
}

console.log(instructions());
promptPlayer();
