const readline = require('readline');

class StellarOutpost {
  constructor() {
    this.turn = 1;
    this.maxTurns = 30;
    this.energy = 100;
    this.food = 100;
    this.materials = 50;
    this.health = 100;
    this.structures = {
      lifeSupport: 1, // affects resource usage
      farms: 0,        // affects food generation
      solarPanels: 0,  // affects energy generation
      workshops: 0     // affects materials generation
    };
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.isPlaying = true;

    this.events = [
      {
        name: 'Meteor Storm',
        description: 'A meteor storm hits the outpost causing damage.',
        effect: (game) => {
          const damage = 10 + Math.floor(Math.random() * 15);
          game.health -= damage;
          return `Outpost damaged! Health decreased by ${damage}.`;
        }
      },
      {
        name: 'Equipment Failure',
        description: 'Critical equipment failed, consuming extra energy to repair.',
        effect: (game) => {
          const energyLoss = 10 + Math.floor(Math.random() * 10);
          game.energy -= energyLoss;
          return `Energy drained by ${energyLoss} due to repair.`;
        }
      },
      {
        name: 'Alien Encounter',
        description: 'A peaceful alien envoy offers to trade materials for food.',
        effect: (game) => {
          if (game.food >= 5) {
            game.food -= 5;
            game.materials += 10;
            return 'Traded 5 food for 10 materials with aliens.';
          } else {
            return 'Aliens left due to lack of food to trade.';
          }
        }
      },
      {
        name: 'Solar Flare',
        description: 'A powerful solar flare boosts energy but disables systems for a day.',
        effect: (game) => {
          const energyGain = 20 + Math.floor(Math.random() * 20);
          game.energy += energyGain;
          game.skipNextTurn = true;
          return `Energy increased by ${energyGain}, but systems offline next day.`;
        }
      },
      {
        name: 'Crop Blossom',
        description: 'Farms produced abundant food due to good conditions.',
        effect: (game) => {
          const foodGain = 10 + game.structures.farms * 5;
          game.food += foodGain;
          return `Farms produced ${foodGain} food.`;
        }
      },
      {
        name: 'Material Shipment',
        description: 'A shipment of materials arrived unexpectedly.',
        effect: (game) => {
          const materialsGain = 15;
          game.materials += materialsGain;
          return `Received ${materialsGain} materials.`;
        }
      },
      {
        name: 'Radiation Leak',
        description: 'Radiation leak causes health deterioration.',
        effect: (game) => {
          const healthLoss = 15;
          game.health -= healthLoss;
          return `Health decreased by ${healthLoss} due to radiation.`;
        }
      },
    ];
  }

  start() {
    console.clear();
    console.log("Welcome commander to 'Stellar Outpost'!\n");
    this.mainLoop();
  }

  mainLoop() {
    if (!this.isPlaying) {
      this.rl.close();
      return;
    }

    if (this.turn > this.maxTurns) {
      console.log('\nCongratulations! You have successfully maintained the outpost for 30 days!');
      console.log('You Win!');
      this.isPlaying = false;
      this.rl.close();
      return;
    }

    // Check loss conditions
    if (this.energy <= 0) {
      console.log('\nOut of energy! The outpost cannot continue functioning.');
      console.log('Game Over.');
      this.isPlaying = false;
      this.rl.close();
      return;
    }
    if (this.food <= 0) {
      console.log('\nOut of food! Your crew cannot survive without nutrition.');
      console.log('Game Over.');
      this.isPlaying = false;
      this.rl.close();
      return;
    }
    if (this.health <= 0) {
      console.log('\nThe commander has perished due to poor health conditions.');
      console.log('Game Over.');
      this.isPlaying = false;
      this.rl.close();
      return;
    }

    console.log(`\n--- Day ${this.turn} at Stellar Outpost ---`);
    this.showStatus();

    if (this.skipNextTurn) {
      console.log('Systems are offline today due to the previous solar flare. No actions can be taken.');
      this.skipNextTurn = false;
      this.endTurn();
      return;
    }

    // Present options to player
    this.rl.question(this.getActionPrompt(), (answer) => {
      this.handleAction(answer.trim().toLowerCase());
    });
  }

  showStatus() {
    console.log(`Health: ${this.health}`);
    console.log(`Energy: ${Math.max(0,this.energy)}`);
    console.log(`Food: ${Math.max(0,this.food)}`);
    console.log(`Materials: ${Math.max(0,this.materials)}`);
    console.log(`Structures:`);
    for (let s in this.structures) {
      console.log(`  ${s}: ${this.structures[s]}`);
    }
  }

  getActionPrompt() {
    return (`\nChoose an action for this day:\n` +
            ` 1) Allocate resources to build structures\n` +
            ` 2) Allocate resources to maintain life support (consume energy, food)\n` +
            ` 3) Allocate resources to expand and repair outpost (consume materials and energy)\n` +
            `Enter the number of your choice: `);
  }

  handleAction(choice) {
    switch(choice) {
      case '1':
        this.buildStructure();
        break;
      case '2':
        this.maintainLifeSupport();
        break;
      case '3':
        this.expandOutpost();
        break;
      default:
        console.log('Invalid choice. Please select 1, 2, or 3.');
        this.mainLoop();
        break;
    }
  }

  buildStructure() {
    console.log(`\nWhich structure do you want to build?`);
    console.log(` 1) Life Support (cost: 10 materials, 5 energy) - Improves life support efficiency`);
    console.log(` 2) Farms (cost: 15 materials, 5 energy) - Increases food production`);
    console.log(` 3) Solar Panels (cost: 15 materials, 0 energy) - Increases energy production`);
    console.log(` 4) Workshops (cost: 20 materials, 10 energy) - Increases materials production`);
    console.log(` 5) Cancel`);
    this.rl.question('Enter the number of your choice: ', (answer) => {
      this.processBuildChoice(answer.trim());
    });
  }

  processBuildChoice(choice) {
    switch(choice) {
      case '1':
        if (this.materials >= 10 && this.energy >= 5) {
          this.materials -= 10;
          this.energy -= 5;
          this.structures.lifeSupport += 1;
          console.log('Built one Life Support structure.');
        } else {
          console.log('Not enough materials or energy to build Life Support.');
        }
        break;
      case '2':
        if (this.materials >= 15 && this.energy >= 5) {
          this.materials -= 15;
          this.energy -= 5;
          this.structures.farms += 1;
          console.log('Built one Farm.');
        } else {
          console.log('Not enough materials or energy to build Farm.');
        }
        break;
      case '3':
        if (this.materials >= 15) {
          this.materials -= 15;
          this.structures.solarPanels += 1;
          console.log('Built one Solar Panel.');
        } else {
          console.log('Not enough materials to build Solar Panel.');
        }
        break;
      case '4':
        if (this.materials >= 20 && this.energy >= 10) {
          this.materials -= 20;
          this.energy -= 10;
          this.structures.workshops += 1;
          console.log('Built one Workshop.');
        } else {
          console.log('Not enough materials or energy to build Workshop.');
        }
        break;
      case '5':
        console.log('Build cancelled.');
        break;
      default:
        console.log('Invalid choice. No structure built.');
        break;
    }
    this.endTurn();
  }

  maintainLifeSupport() {
    // Life support consumes energy and food to keep crew healthy
    const energyCost = 10 * this.structures.lifeSupport;
    const foodCost = 10 * this.structures.lifeSupport;
    if (this.energy >= energyCost && this.food >= foodCost) {
      this.energy -= energyCost;
      this.food -= foodCost;
      this.health = Math.min(100, this.health + 15); // health improves
      console.log(`Life support maintained: -${energyCost} energy, -${foodCost} food. Health improved.`);
    } else {
      // Insufficient resources cause health to decline
      this.health -= 20;
      console.log(`Not enough resources to maintain life support. Health declined!`);
    }
    this.endTurn();
  }

  expandOutpost() {
    // Expansion costs materials and energy but increases resource generation
    const materialsCost = 20;
    const energyCost = 15;
    if (this.materials >= materialsCost && this.energy >= energyCost) {
      this.materials -= materialsCost;
      this.energy -= energyCost;
      // Randomly choose a structure to improve as part of expansion effort
      const possible = ['lifeSupport', 'farms', 'solarPanels', 'workshops'];
      // 60% chance to upgrade a random structure
      if (Math.random() < 0.6) {
        const structure = possible[Math.floor(Math.random() * possible.length)];
        this.structures[structure] += 1;
        console.log(`Outpost expanded successfully. ${structure} upgraded by 1.`);
      } else {
        console.log('Expansion completed but no significant upgrades occurred.');
      }
    } else {
      console.log('Not enough materials or energy to expand the outpost.');
    }
    this.endTurn();
  }

  endTurn() {
    if (!this.isPlaying) {
      this.rl.close();
      return;
    }

    // At end of turn, produce resources based on structures
    const energyProduced = 10 * this.structures.solarPanels;
    const foodProduced = 8 * this.structures.farms;
    const materialsProduced = 5 * this.structures.workshops;

    this.energy += energyProduced;
    this.food += foodProduced;
    this.materials += materialsProduced;

    console.log(`\nResource production this day:`);
    if (energyProduced > 0) console.log(`+${energyProduced} energy from solar panels.`);
    if (foodProduced > 0) console.log(`+${foodProduced} food from farms.`);
    if (materialsProduced > 0) console.log(`+${materialsProduced} materials from workshops.`);

    // Then random event occurs
    const event = this.events[Math.floor(Math.random() * this.events.length)];
    console.log(`\nRandom Event: ${event.name} - ${event.description}`);
    const eventResult = event.effect(this);
    console.log(eventResult);

    // Normalize values to not go negative for display
    this.energy = Math.max(0, this.energy);
    this.food = Math.max(0, this.food);
    this.materials = Math.max(0, this.materials);
    this.health = Math.max(0, this.health);

    this.turn ++;

    if (this.isPlaying) {
      setTimeout(() => this.mainLoop(), 800);
    } else {
      this.rl.close();
    }
  }
}

const game = new StellarOutpost();
game.start();
