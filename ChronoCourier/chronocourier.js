#!/usr/bin/env node

/**
 * ChronoCourier - A Console-Based Time-Travel Delivery Game
 * 
 * Players are couriers navigating through time to deliver packages before their deadlines.
 * Manage stamina and cargo efficiently while overcoming time era challenges and random events.
 *
 * No external dependencies, pure Node.js console application.
 *
 * Author: ChatGPT
 */

const readline = require('readline');

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to get random integer in range [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define available time eras with unique obstacles
const ERAS = {
  "Prehistoric": {
    description: "The age of dinosaurs and wild environments.",
    staminaCostMove: 3,  // moving costs more stamina
    eventChance: 0.25,
    eventEffects: [
      {
        name: "Dinosaur Encounter",
        description: "A wild dinosaur blocks your path! You must rest quickly.",
        effect: (game) => {
          console.log("You lose 2 stamina escaping the dinosaur!");
          game.stamina = Math.max(0, game.stamina - 2);
        }
      },
      {
        name: "Hidden Cave",
        description: "You find a hidden cave that lets you rest and recover stamina.",
        effect: (game) => {
          console.log("You regain 4 stamina from resting in the cave.");
          game.stamina = Math.min(game.maxStamina, game.stamina + 4);
        }
      },
    ]
  },
  "Medieval": {
    description: "A world of castles, knights, and suspicious villagers.",
    staminaCostMove: 2,
    eventChance: 0.3,
    eventEffects: [
      {
        name: "Roadblock by Guards",
        description: "Guards demand a toll to let you pass.",
        effect: (game) => {
          if (game.stamina >= 3) {
            console.log("You pay the toll with stamina (lose 3 stamina).");
            game.stamina -= 3;
          } else {
            console.log("You cannot pay the toll. You lose a turn while negotiating.");
            game.skipNextTurn = true;
          }
        }
      },
      {
        name: "Meeting a Bard",
        description: "The bard sings a morale-boosting song.",
        effect: (game) => {
          console.log("Your stamina is boosted by 3.");
          game.stamina = Math.min(game.maxStamina, game.stamina + 3);
        }
      },
    ]
  },
  "Industrial": {
    description: "Era of factories, steam power, and crowded cities.",
    staminaCostMove: 2,
    eventChance: 0.35,
    eventEffects: [
      {
        name: "Steam Engine Breakdown",
        description: "Your transport breaks down. Rest and fix it.",
        effect: (game) => {
          console.log("You must rest this turn to fix your transport, regain 2 stamina.");
          game.skipNextTurn = true;
          game.stamina = Math.min(game.maxStamina, game.stamina + 2);
        }
      },
      {
        name: "Smoke-Filled Streets",
        description: "Harder to move; stamina cost temporarily doubled next turn.",
        effect: (game) => {
          console.log("Next move action costs double stamina.");
          game.nextMoveCostMultiplier = 2;
        }
      },
    ]
  },
  "Future": {
    description: "High-tech world with advanced transport and strange anomalies.",
    staminaCostMove: 1,
    eventChance: 0.4,
    eventEffects: [
      {
        name: "Time Paradox",
        description: "A paradox slows you down. Skip your next turn.",
        effect: (game) => {
          console.log("You are stuck in a time loop and must skip a turn.");
          game.skipNextTurn = true;
        }
      },
      {
        name: "Helpful AI Assistant",
        description: "AI assists you, reducing next move stamina cost by half.",
        effect: (game) => {
          console.log("Next move will cost half stamina.");
          game.nextMoveCostMultiplier = 0.5;
        }
      },
    ]
  }
};

// Game data structure
class Game {
  constructor() {
    this.turn = 1;
    this.stamina = 10;
    this.maxStamina = 10;
    this.cargoCapacity = 4;
    this.packages = [];
    this.position = new Map(); // key: packageId, value: distance left to destination
    this.skipNextTurn = false;
    this.nextMoveCostMultiplier = 1;
    this.score = 0;

    this.distances = { // fixed distances per era for delivery
      "Prehistoric": 12,
      "Medieval": 10,
      "Industrial": 8,
      "Future": 6
    };
  }

  // Initialize game packages
  initializePackages() {
    const eras = Object.keys(ERAS);
    // Create a random set of packages - at least 4 packages
    for (let i = 0; i < this.cargoCapacity; i++) {
      const era = eras[randInt(0, eras.length - 1)];
      // Deadline is turn limit (distance * factor between 5 to 8)
      const distance = this.distances[era];
      const deadline = distance * randInt(5, 8);
      this.packages.push({
        id: i + 1,
        era,
        distanceLeft: distance,
        deadline,
        delivered: false
      });
    }
  }

  // Display game status to player
  displayStatus() {
    console.log(`\n=== Turn ${this.turn} ===`);
    console.log(`Stamina: ${this.stamina}/${this.maxStamina}`);
    console.log(`Cargo capacity: ${this.cargoCapacity}
`);
    console.log(`Packages:`);
    this.packages.forEach(pkg => {
      const status = pkg.delivered ? 'Delivered' : `Distance left: ${pkg.distanceLeft}, Deadline: ${pkg.deadline} turns`;
      console.log(`  ${pkg.id}: Era: ${pkg.era}, Status: ${status}`);
    });
  }

  // Determine if all packages are delivered
  allDelivered() {
    return this.packages.every(pkg => pkg.delivered);
  }

  // Check if stamina is depleted
  isStaminaDepleted() {
    return this.stamina <= 0;
  }

  // Handle random event for current package / era
  handleRandomEvent(currentPackage) {
    if (!currentPackage) return;
    const eraInfo = ERAS[currentPackage.era];
    if (!eraInfo) return;

    if (Math.random() < eraInfo.eventChance) {
      // Pick a random event
      const event = eraInfo.eventEffects[randInt(0, eraInfo.eventEffects.length -1)];
      console.log(`\n*** Random Event: ${event.name} ***`);
      console.log(event.description);
      event.effect(this);
      console.log('');
    }
  }

  // Player actions
  moveTowardDestination(selectedId) {
    const pkg = this.packages.find(p => p.id === selectedId && !p.delivered);
    if (!pkg) {
      console.log("Invalid package selection or package already delivered.");
      return false;
    }
    const eraInfo = ERAS[pkg.era];
    let staminaCost = eraInfo.staminaCostMove * this.nextMoveCostMultiplier;
    staminaCost = Math.ceil(staminaCost);

    if (this.stamina < staminaCost) {
      console.log(`Not enough stamina to move. Required: ${staminaCost}, Have: ${this.stamina}`);
      return false;
    }
    this.stamina -= staminaCost;
    this.nextMoveCostMultiplier = 1; // reset multiplier after use

    pkg.distanceLeft = Math.max(0, pkg.distanceLeft - 1);
    console.log(`You moved closer to package #${pkg.id}'s destination. Distance left: ${pkg.distanceLeft}`);

    if (pkg.distanceLeft === 0) {
      if (this.turn <= pkg.deadline) {
        pkg.delivered = true;
        this.score += 10;
        console.log(`Package #${pkg.id} delivered successfully in the ${pkg.era} era! +10 points.`);
      } else {
        // Late delivery penalty
        pkg.delivered = true;
        this.score -= 5;
        this.stamina = Math.max(0, this.stamina - 2);
        console.log(`Package #${pkg.id} was delivered late and you lose 2 stamina and 5 points.`);
      }
    }

    this.handleRandomEvent(pkg);
    return true;
  }

  rest() {
    const staminaRecovered = 3;
    this.stamina = Math.min(this.maxStamina, this.stamina + staminaRecovered);
    console.log(`You rested and recovered ${staminaRecovered} stamina. Current stamina: ${this.stamina}`);
    this.nextMoveCostMultiplier = 1; // reset
  }

  rearrangeCargo() {
    // Allow player to see packages and reorder. Since packages have no positional order beyond id,
    // simulate some tactical choice: reorder packages to prioritize easier era deliveries.
    console.log("Current package order:");
    this.packages.forEach(pkg => {
      console.log(`  ${pkg.id}: Era: ${pkg.era}, Delivered: ${pkg.delivered}`);
    });
    // For simplification, let player reorder by era alphabetical ascending order or original order
    console.log("Do you want to reorder cargo by era alphabetically? (yes/no)");
  }

  reorderPackagesByEra() {
    this.packages.sort((a,b) => a.era.localeCompare(b.era));
    console.log("Cargo reordered alphabetically by era.");
  }

}

// Main game loop and interaction
async function main() {
  console.log("\nWelcome to ChronoCourier!\n");
  console.log("You are a time-sensitive courier delivering packages through different eras.");
  console.log("Manage stamina, overcome challenges, and deliver on time!\n");

  const game = new Game();
  game.initializePackages();

  function prompt(question) {
    return new Promise(resolve => {
      rl.question(question, input => resolve(input.trim()));
    });
  }

  while (true) {
    if (game.skipNextTurn) {
      console.log(`\nTurn ${game.turn}: You must skip this turn due to a previous event.`);
      game.skipNextTurn = false;
      game.turn++;
      if (game.isStaminaDepleted()) {
        break;
      }
      if (game.allDelivered()) {
        break;
      }
      continue;
    }

    game.displayStatus();

    if (game.allDelivered()) {
      console.log(`\nCongratulations! All packages delivered successfully.`);
      break;
    }

    if (game.isStaminaDepleted()) {
      console.log(`\nYou have run out of stamina! Game Over.`);
      break;
    }

    console.log(`Choose your action:`);
    console.log(`1. Move closer to a package's destination`);
    console.log(`2. Rest to regain stamina`);
    console.log(`3. Rearrange cargo`);
    console.log(`4. View package details`);
    console.log(`5. Quit game`);

    const choice = await prompt('> ');

    if (choice === '1') {
      // Select a package to move toward
      const undelivered = game.packages.filter(p => !p.delivered);
      console.log("Choose a package to move towards (enter package ID):");
      undelivered.forEach(pkg => {
        console.log(`  ${pkg.id}: Era: ${pkg.era}, Distance left: ${pkg.distanceLeft}, Deadline: ${pkg.deadline}`);
      });
      const packChoice = await prompt('Package ID: ');
      const packId = Number(packChoice);
      if (isNaN(packId) || !undelivered.some(p => p.id === packId)) {
        console.log("Invalid package selection.");
        continue;
      }

      const success = game.moveTowardDestination(packId);
      if (success) {
        game.turn++;
      }

    } else if (choice === '2') {
      game.rest();
      game.turn++;

    } else if (choice === '3') {
      game.rearrangeCargo();
      // Await yes/no to reorder
      let validInput = false;
      while (!validInput) {
        const res = await prompt('Your choice (yes/no): ');
        if (res.toLowerCase() === 'yes') {
          game.reorderPackagesByEra();
          validInput = true;
        } else if (res.toLowerCase() === 'no') {
          console.log("Cargo order unchanged.");
          validInput = true;
        } else {
          console.log("Please enter 'yes' or 'no'.");
        }
      }

    } else if (choice === '4') {
      console.log('\nPackage Details:');
      game.packages.forEach(pkg => {
        console.log(`Package #${pkg.id}:`);
        console.log(`  Era: ${pkg.era} - ${ERAS[pkg.era].description}`);
        console.log(`  Distance left: ${pkg.distanceLeft}`);
        console.log(`  Deadline: ${pkg.deadline} turns`);
        console.log(`  Delivered: ${pkg.delivered ? 'Yes' : 'No'}`);
      });

    } else if (choice === '5') {
      console.log("Thanks for playing ChronoCourier! Goodbye.");
      break;

    } else {
      console.log("Invalid choice, please select a valid option.");
    }
  }

  // Final scores and summary
  console.log(`\nGame Over! Your final score: ${game.score}`);

  if (game.allDelivered()) {
    console.log("You have successfully delivered all packages! You win!");
  } else if (game.isStaminaDepleted()) {
    console.log("You ran out of stamina before completing all deliveries. Better luck next time.");
  } else {
    console.log("Game ended.");
  }

  rl.close();
}

// Run the main game function
main();
