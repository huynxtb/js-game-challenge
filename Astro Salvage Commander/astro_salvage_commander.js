// Astro Salvage Commander
// A text-based space salvage game in Node.js console
// Author: ChatGPT

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility functions
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Artifact definitions
const ARTIFACTS = [
  { name: 'Quantum Core', value: 500, weight: 10 },
  { name: 'Alien Relic', value: 300, weight: 8 },
  { name: 'Ancient Data Crystal', value: 200, weight: 5 },
  { name: 'Rare Mineral Sample', value: 150, weight: 7 },
  { name: 'Spaceborne Microchip', value: 100, weight: 3 },
  { name: 'Unidentified Artifact', value: 50, weight: 2 }
];

// Game constants
const INITIAL_FUEL = 100;    // units
const INITIAL_OXYGEN = 100;  // units
const CARGO_CAPACITY = 50;   // weight units
const VALUE_TO_WIN = 1000;   // min artifact value for victory

// Resource consumption rates
const FUEL_MOVE_COST = 5;
const OXYGEN_MOVE_COST = 4;
const OXYGEN_SALVAGE_COST = 2;
const OXYGEN_REPAIR_COST = 5;
const FUEL_REPAIR_COST = 3;

// Ship health
const MAX_SHIP_HEALTH = 50;

// Game state
class Game {
  constructor() {
    this.fuel = INITIAL_FUEL;
    this.oxygen = INITIAL_OXYGEN;
    this.cargoCapacity = CARGO_CAPACITY;
    this.shipHealth = MAX_SHIP_HEALTH;
    this.cargo = [];
    this.location = 0; // abstract asteroid field sector index
    this.turn = 0;
    this.isReturning = false;
    this.gameOver = false;
    this.win = false;

    // Statistics
    this.totalArtifactValue = 0;
    this.totalArtifactWeight = 0;
  }

  printStatus() {
    console.log('\n=== Status at Turn ' + this.turn + ' ===');
    console.log(`Location (Sector): ${this.location}`);
    console.log(`Fuel: ${this.fuel}`);
    console.log(`Oxygen: ${this.oxygen}`);
    console.log(`Ship Health: ${this.shipHealth}/${MAX_SHIP_HEALTH}`);
    console.log(`Cargo Capacity: ${this.totalArtifactWeight}/${this.cargoCapacity} weight units`);
    console.log(`Artifacts Collected: ${this.cargo.length}`);
    if (this.cargo.length > 0) {
      let counts = {};
      for (const art of this.cargo) {
        counts[art.name] = (counts[art.name] || 0) + 1;
      }
      console.log('Inventory:');
      for (const [name, count] of Object.entries(counts)) {
        console.log(`  ${name} x${count}`);
      }
    }
    console.log('======================\n');
  }

  async actionMenu() {
    const options = [];
    console.log('Choose your next action:');
    options.push('1. Move to a new sector (Consumes Fuel and Oxygen)');
    options.push('2. Salvage artifact in current sector (Consumes Oxygen)');
    options.push('3. Repair ship (Consumes Fuel and Oxygen)');
    if (!this.isReturning) {
      options.push('4. Return to base (End mission and tally loot)');
    } else {
      options.push('4. Continue returning to base');
    }

    for (const line of options) {
      console.log(line);
    }

    let choice = null;
    while (choice === null) {
      const input = await prompt('Enter choice number: ');
      const num = parseInt(input.trim(), 10);
      if (num >= 1 && num <= 4) {
        choice = num;
      } else {
        console.log('Invalid input. Please enter a number between 1 and 4.');
      }
    }
    return choice;
  }

  triggerRandomEvent() {
    // Possible random events chance
    // Asteroid strike 15%
    // Equipment malfunction 10%
    // Nothing 75%

    const roll = Math.random();
    if (roll < 0.15) {
      // Asteroid strike event
      const damage = randInt(5, 15);
      this.shipHealth -= damage;
      this.shipHealth = Math.max(this.shipHealth, 0);
      console.log(`\n*** ALERT: Asteroid strike! Ship took ${damage} damage. Ship health now at ${this.shipHealth}/${MAX_SHIP_HEALTH}. ***`);
      // Chance damage causes oxygen leak (additional oxygen loss next turn)
      if (Math.random() < 0.3) {
        const leakLoss = randInt(5, 10);
        this.oxygen -= leakLoss;
        this.oxygen = Math.max(this.oxygen, 0);
        console.log(`*** Oxygen leak caused by damage! Lost additional ${leakLoss} oxygen. Oxygen now ${this.oxygen}. ***`);
      }
    } else if (roll < 0.25) {
      // Equipment malfunction
      const malfLossOxygen = randInt(3, 7);
      const malfLossFuel = randInt(2, 5);
      this.oxygen -= malfLossOxygen;
      this.fuel -= malfLossFuel;
      this.oxygen = Math.max(this.oxygen, 0);
      this.fuel = Math.max(this.fuel, 0);
      console.log(`\n*** ALERT: Equipment malfunction! Lost ${malfLossOxygen} oxygen and ${malfLossFuel} fuel repairing the malfunction. ***`);
    } else {
      // No event
      console.log('\nNo unusual events this turn.');
    }
  }

  findDerelict() {
    // Chance of finding derelict ship to salvage: 60%
    if (Math.random() < 0.6) {
      console.log('You have found a derelict spacecraft in this sector.');
      return true;
    } else {
      console.log('No derelict spacecraft detected in this sector.');
      return false;
    }
  }

  async salvageArtifact() {
    if (this.isReturning) {
      console.log('Cannot salvage while returning to base.');
      return;
    }

    // Salvage consumes oxygen
    if (this.oxygen < OXYGEN_SALVAGE_COST) {
      console.log('Not enough oxygen to perform salvage operation.');
      return;
    }

    const canSalvage = this.findDerelict();
    if (!canSalvage) {
      return;
    }

    // Select random artifact
    const artifact = ARTIFACTS[randInt(0, ARTIFACTS.length - 1)];
    console.log(`Attempting salvage: Found artifact -> ${artifact.name} (Value: ${artifact.value}, Weight: ${artifact.weight})`);

    const potentialNewWeight = this.totalArtifactWeight + artifact.weight;
    if (potentialNewWeight > this.cargoCapacity) {
      console.log('Salvage failed! Cargo capacity would be exceeded by adding this artifact. Critical overload!');
      // Critical failure on cargo overload
      this.gameOver = true;
      console.log('\n***** CRITICAL FAILURE: Cargo capacity exceeded. Ship systems overloaded and fail. Mission failed. *****');
      return;
    }

    // Successful salvage
    this.cargo.push(artifact);
    this.totalArtifactWeight += artifact.weight;
    this.totalArtifactValue += artifact.value;
    this.oxygen -= OXYGEN_SALVAGE_COST;
    console.log(`Salvage successful! Artifact added to cargo hold. Oxygen reduced by ${OXYGEN_SALVAGE_COST}.`);
  }

  async moveSector() {
    if (this.isReturning) {
      // Moving while returning base means ship is closing distance home
      this.location = Math.max(0, this.location - 1);
      console.log(`\nMoving closer to base. Ship now at sector ${this.location}.`);
    } else {
      // Move to a new random sector further out
      const moveDistance = randInt(1, 3);
      this.location += moveDistance;
      console.log(`\nYou move ${moveDistance} sector(s) deeper into the asteroid field. Now at sector ${this.location}.`);
    }

    // Consume fuel/oxygen
    this.fuel -= FUEL_MOVE_COST;
    this.oxygen -= OXYGEN_MOVE_COST;
    if (this.fuel < 0) this.fuel = 0;
    if (this.oxygen < 0) this.oxygen = 0;

    console.log(`Fuel reduced by ${FUEL_MOVE_COST}, current fuel: ${this.fuel}`);
    console.log(`Oxygen reduced by ${OXYGEN_MOVE_COST}, current oxygen: ${this.oxygen}`);
  }

  async repairShip() {
    if (this.shipHealth >= MAX_SHIP_HEALTH) {
      console.log('Ship is already at maximum health, no need for repairs now.');
      return;
    }

    if (this.fuel < FUEL_REPAIR_COST || this.oxygen < OXYGEN_REPAIR_COST) {
      console.log('Not enough fuel or oxygen to perform repairs.');
      return;
    }

    const repairAmount = randInt(8, 15);
    this.shipHealth += repairAmount;
    if (this.shipHealth > MAX_SHIP_HEALTH) this.shipHealth = MAX_SHIP_HEALTH;
    this.fuel -= FUEL_REPAIR_COST;
    this.oxygen -= OXYGEN_REPAIR_COST;

    console.log(`Performed repairs restoring ${repairAmount} health.`);
    console.log(`Fuel reduced by ${FUEL_REPAIR_COST}, oxygen reduced by ${OXYGEN_REPAIR_COST}.`);
  }

  async returnToBase() {
    if (!this.isReturning) {
      this.isReturning = true;
      console.log('\nYou have initiated return to base sequence. Safe travel home!');
    } else {
      console.log('\nContinuing journey back to base...');
    }
    // On return move closer to base (sector decreases on moveSector)
  }

  checkLossConditions() {
    if (this.fuel <= 0) {
      this.gameOver = true;
      console.log('\n***** You have run out of fuel before returning to base. Mission failed. *****');
      return true;
    }
    if (this.oxygen <= 0) {
      this.gameOver = true;
      console.log('\n***** You have run out of oxygen before returning to base. Mission failed. *****');
      return true;
    }
    if (this.shipHealth <= 0) {
      this.gameOver = true;
      console.log('\n***** Ship has been destroyed due to damage. Mission failed. *****');
      return true;
    }
    if (this.totalArtifactWeight > this.cargoCapacity) {
      this.gameOver = true;
      console.log('\n***** Cargo capacity exceeded! Critical system failure. Mission failed. *****');
      return true;
    }
    return false;
  }

  checkWinCondition() {
    if (this.isReturning && this.location === 0) {
      // Arrived home base
      this.gameOver = true;
      if (this.totalArtifactValue >= VALUE_TO_WIN) {
        this.win = true;
        console.log(`\n***** Mission Success! Returned to base with artifact haul valued at ${this.totalArtifactValue}. *****`);
      } else {
        this.win = false;
        console.log(`\nMission ended. You returned to base with artifacts valued at ${this.totalArtifactValue} (less than required ${VALUE_TO_WIN}).`);
        console.log('Better luck next time!');
      }
      return true;
    }
    return false;
  }

  async playTurn() {
    this.turn += 1;
    this.printStatus();

    if (this.isReturning) {
      // Auto move towards base if returning
      const moveChoice = await this.actionMenu();
      if (moveChoice === 4) {
        await this.returnToBase();
        await this.moveSector();
      } else if (moveChoice === 1) {
        console.log('While returning, you can only continue your journey home (option 4).');
        await this.returnToBase();
        await this.moveSector();
      } else if (moveChoice === 2 || moveChoice ===3) {
        console.log('While returning to base, you cannot salvage or repair. Please continue your journey home (option 4).');
        await this.returnToBase();
        await this.moveSector();
      }
    } else {
      const choice = await this.actionMenu();
      switch (choice) {
        case 1:
          await this.moveSector();
          break;
        case 2:
          await this.salvageArtifact();
          break;
        case 3:
          await this.repairShip();
          break;
        case 4:
          await this.returnToBase();
          break;
      }
    }
    this.triggerRandomEvent();

    if (this.checkLossConditions()) {
      this.gameOver = true;
      return;
    }
    this.checkWinCondition();
  }

  async run() {
    console.log('=== Welcome to Astro Salvage Commander ===');
    console.log('Objective: Salvage valuable artifacts from derelict spaceships in an asteroid field and return safely.');
    console.log(`Reach an artifact haul value of at least ${VALUE_TO_WIN} and return to base before running out of oxygen or fuel.`);
    console.log('Manage your resources carefully, avoid hazards, and good luck!\n');

    while (!this.gameOver) {
      await this.playTurn();
    }

    if (this.win) {
      console.log('== Congratulations Commander, you won! ==');
    } else {
      console.log('== Mission failed. Better luck next time! ==');
    }

    console.log('Final haul summary:');
    console.log(`Total artifacts collected: ${this.cargo.length}`);
    console.log(`Total artifact value: ${this.totalArtifactValue}`);
    console.log(`Total cargo weight: ${this.totalArtifactWeight}/${this.cargoCapacity}`);

    rl.close();
  }
}

(async () => {
  const game = new Game();
  await game.run();
})();
