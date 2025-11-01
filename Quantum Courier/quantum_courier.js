#!/usr/bin/env node

const readline = require('readline');

// Quantum Courier - Single file console game

// Constants for the game
const MAX_TURNS = 30;
const MAX_ENERGY = 100;
const REST_ENERGY_GAIN = 15;
const ENERGY_DRAIN_ANOMALY = 20;
const ANOMALY_CHANCE = 0.3; // 30% chance per turn

// Define Space-Time Zones
// Each zone has a name and energy cost to travel from the current zone
// Costs represent abstracted distances and difficulty
const ZONES = [
  {name: 'Alpha Nexus'},
  {name: 'Blaze Stream'},
  {name: 'Celestial Drift'},
  {name: 'Delta Rift'},
  {name: 'Echo Verge'},
];

// Distances matrix between zones (symmetric), energy cost to travel between zones
const DISTANCES = [
  [0, 15, 30, 45, 20], // Alpha Nexus
  [15, 0, 25, 40, 30], // Blaze Stream
  [30, 25, 0, 20, 25], // Celestial Drift
  [45, 40, 20, 0, 15], // Delta Rift
  [20, 30, 25, 15, 0], // Echo Verge
];

// Packages are deliveries between two zones randomly assigned at game start
const TOTAL_PACKAGES = 5;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function chance(prob) {
  return Math.random() < prob;
}

class Game {
  constructor() {
    this.turnsLeft = MAX_TURNS;
    this.energy = MAX_ENERGY;
    this.currentZone = 0; // start from 'Alpha Nexus'
    this.packages = [];
    this.deliveredCount = 0;
    this.anomalyActive = false;
    this.extraTurns = 0;
    this.anomalyDescription = '';
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.initPackages();
  }

  initPackages() {
    this.packages = [];
    while(this.packages.length < TOTAL_PACKAGES) {
      let from = getRandomInt(ZONES.length);
      let to = getRandomInt(ZONES.length);
      if(from !== to) {
        // Avoid duplicates
        let exists = this.packages.some(p => p.from === from && p.to === to);
        if(!exists) {
          this.packages.push({from, to, delivered: false});
        }
      }
    }
  }

  printIntro() {
    console.log('Welcome to Quantum Courier!');
    console.log('You are a futuristic courier tasked with delivering packages across different warping space-time zones.');
    console.log(`You have ${MAX_TURNS} turns and ${MAX_ENERGY} energy units to deliver all ${TOTAL_PACKAGES} packages.`);
    console.log('Beware of time anomalies that can delay deliveries, speed time up, or drain your energy.');
    console.log('Each turn you can travel to a new zone or rest to recover energy.');
    console.log('Deliver packages by arriving at their destination zone.');
    console.log('Manage your resources wisely to complete all deliveries in time!\n');
    console.log('Instructions:');
    console.log('- Input the number of the zone you want to travel to.');
    console.log('- Input `R` or `r` to rest and recover some energy (risking anomalies).');
    console.log('- Deliver packages by reaching their destination zones.');
    console.log('- Your current zone is indicated each turn.');
    console.log('- Good luck!\n');
  }

  printStatus() {
    console.log('------------------------------');
    console.log(`Turn: ${MAX_TURNS - this.turnsLeft + 1} / ${MAX_TURNS}`);
    console.log(`Energy: ${this.energy} / ${MAX_ENERGY}`);
    console.log(`Current Zone: ${ZONES[this.currentZone].name}`);
    console.log(`Packages Remaining: ${this.packages.filter(p => !p.delivered).length}`);
    if(this.anomalyActive) {
      console.log(`⚠️  Time Anomaly Active: ${this.anomalyDescription}`);
    }

    const remainingPackages = this.packages.filter(p => !p.delivered);
    if(remainingPackages.length > 0) {
      console.log('Undelivered Packages:');
      remainingPackages.forEach((p, i) => {
        console.log(`  [${i+1}] From ${ZONES[p.from].name} to ${ZONES[p.to].name}`);
      });
    } else {
      console.log('All packages delivered!');
    }

    console.log('Available Zones to travel:');
    for(let i=0; i<ZONES.length; i++) {
      if(i !== this.currentZone) {
        const dist = DISTANCES[this.currentZone][i];
        console.log(`  [${i+1}] ${ZONES[i].name} (Energy cost: ${dist})`);
      }
    }
    console.log('  [R] Rest to recover energy');
  }

  applyAnomaly() {
    this.anomalyActive = true;
    this.anomalyDescription = '';
    // Randomly pick anomaly effect
    const anomalyType = getRandomInt(3);
    switch(anomalyType) {
      case 0:
        // Delay: lose 1-2 turns
        const delayTurns = 1 + getRandomInt(2);
        this.turnsLeft -= delayTurns;
        this.anomalyDescription = `Time Delay: Lose ${delayTurns} turn(s).`;
        break;
      case 1:
        // Speed up: gain 1-2 extra turns
        const gainTurns = 1 + getRandomInt(2);
        this.extraTurns += gainTurns;
        this.anomalyDescription = `Time Shift: Gain ${gainTurns} extra turn(s)!`;
        break;
      case 2:
        // Energy drain: lose energy
        const energyLost = ENERGY_DRAIN_ANOMALY;
        this.energy = Math.max(0, this.energy - energyLost);
        this.anomalyDescription = `Energy Drain: Lose ${energyLost} energy.`;
        break;
    }
  }

  clearAnomaly() {
    this.anomalyActive = false;
    this.anomalyDescription = '';
  }

  isGameOver() {
    if(this.energy <= 0) {
      console.log("You've run out of energy!");
      return true;
    }
    if(this.turnsLeft <= 0) {
      console.log('You have no turns left!');
      return true;
    }
    if(this.packages.every(p => p.delivered)) {
      return true;
    }
    return false;
  }

  printEnd() {
    if(this.packages.every(p => p.delivered)) {
      console.log('\n🎉 Congratulations! You have delivered all packages in time! 🎉\n');
    } else if(this.energy <= 0) {
      console.log('\n💥 You failed because your energy depleted before completing all deliveries. 💥\n');
    } else if(this.turnsLeft <= 0) {
      console.log('\n⏰ You failed as you ran out of turns before completing all deliveries. ⏰\n');
    }
  }

  // Calculate energy cost to travel between current zone and target
  travelEnergyCost(toZone) {
    return DISTANCES[this.currentZone][toZone];
  }

  deliverPackages() {
    // Check if current zone is a delivery destination for any package
    let deliveredThisTurn = 0;
    for(let pkg of this.packages) {
      if(!pkg.delivered && pkg.to === this.currentZone) {
        pkg.delivered = true;
        deliveredThisTurn++;
        console.log(`Package delivered at ${ZONES[this.currentZone].name}!`);
      }
    }
    return deliveredThisTurn;
  }

  promptUser() {
    return new Promise(resolve => {
      this.rl.question('\nEnter zone number to travel or R to rest: ', answer => {
        resolve(answer.trim());
      });
    });
  }

  async gameLoop() {
    this.printIntro();

    while(true) {
      this.printStatus();

      if(this.isGameOver()) {
        this.printEnd();
        break;
      }

      // Handle anomaly active from last turn
      if(this.anomalyActive) {
        this.clearAnomaly();
      }

      // Await player input
      let input = await this.promptUser();

      if(input.toLowerCase() === 'r') {
        // Rest
        this.energy += REST_ENERGY_GAIN;
        if(this.energy > MAX_ENERGY) this.energy = MAX_ENERGY;
        this.turnsLeft -= 1;
        console.log(`You rested and recovered ${REST_ENERGY_GAIN} energy.`);

        // Chance of anomaly
        if(chance(ANOMALY_CHANCE)) {
          this.applyAnomaly();
        }

      } else {
        // Attempt to parse zone index (1-based in UI)
        const choice = parseInt(input, 10) - 1;
        if(isNaN(choice) || choice < 0 || choice >= ZONES.length || choice === this.currentZone) {
          console.log('Invalid zone choice. Please enter a valid number or R to rest.');
          continue; // Skip turn deduction
        }

        // Calculate energy cost for travel
        const cost = this.travelEnergyCost(choice);
        if(cost > this.energy) {
          console.log('Not enough energy to travel to that zone. Choose a closer or different zone, or rest.');
          continue; // Skip turn deduction
        }

        // Travel
        this.energy -= cost;
        this.currentZone = choice;
        this.turnsLeft -= 1;
        console.log(`You traveled to ${ZONES[this.currentZone].name} using ${cost} energy.`);

        // Deliver packages if any at this zone
        this.deliverPackages();

        // Chance of anomaly on travel
        if(chance(ANOMALY_CHANCE)) {
          this.applyAnomaly();
        }
      }

      // Apply extra turns from anomaly if any
      if(this.extraTurns > 0) {
        console.log(`Time anomaly grants you ${this.extraTurns} extra turn(s) this round!`);
        this.turnsLeft += this.extraTurns;
        this.extraTurns = 0;
      }

      // Check again if game over
      if(this.isGameOver()) {
        this.printEnd();
        break;
      }
    }

    this.rl.close();
  }
}

const game = new Game();
game.gameLoop();
