const readline = require('readline');

// --- Game Constants ---
const TOTAL_STAR_SYSTEMS = 50;
const WIN_MAP_COMPLETION = 0.8; // 80%
const WIN_MAP_ACCURACY = 0.9; // 90%

// Resource usage constants
const FUEL_BASE_COST = 5;       // base fuel cost for scanning shallow sector
const TIME_BASE_COST = 1;       // base time cost per scan
const RESEARCH_POINT_BASE = 3;  // base research points earned per scan depending on investment

// Accuracy modifiers
const ACCURACY_BASE = 0.5; // minimum accuracy if invest minimal research
const ACCURACY_MAX = 1.0;  // max accuracy

// --- Helper Functions ---
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

// Clamp a value between min and max
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- Data Structures ---
class StarSystem {
  constructor(id, name, richness) {
    this.id = id;
    this.name = name;
    this.richness = richness; // represents potential reward quality (1-10)
    this.scanned = false;
    this.accuracy = 0; // accuracy level of mapping (0 to 1)
  }
}

class Universe {
  constructor(totalSystems) {
    this.starSystems = [];
    this.generateStarSystems(totalSystems);
  }

  generateStarSystems(total) {
    // Generate unique star system names and richness
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Omega', 'Sigma', 'Kappa'];
    const suffixes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const usedNames = new Set();

    while (this.starSystems.length < total) {
      const name = `${prefixes[getRandomInt(0, prefixes.length-1)]} ${suffixes[getRandomInt(0, suffixes.length-1)]}`;
      if (!usedNames.has(name)) {
        usedNames.add(name);
        const richness = getRandomInt(1, 10);
        this.starSystems.push(new StarSystem(this.starSystems.length + 1, name, richness));
      }
    }
  }

  getUnscannedSystems() {
    return this.starSystems.filter(system => !system.scanned);
  }

  getScannedSystems() {
    return this.starSystems.filter(system => system.scanned);
  }

  getCompletionRate() {
    return this.getScannedSystems().length / this.starSystems.length;
  }

  getAverageAccuracy() {
    const scanned = this.getScannedSystems();
    if (scanned.length === 0) return 0;
    const totalAccuracy = scanned.reduce((acc, sys) => acc + sys.accuracy, 0);
    return totalAccuracy / scanned.length;
  }
}

// --- Player Ship ---
class Ship {
  constructor() {
    this.fuel = 200;  // starting fuel
    this.time = 50;   // starting available time units
    this.researchPoints = 50; // starting research points
  }

  hasResources(fuelCost, timeCost, researchCost) {
    return this.fuel >= fuelCost && this.time >= timeCost && this.researchPoints >= researchCost;
  }

  consumeResources(fuelCost, timeCost, researchCost) {
    this.fuel -= fuelCost;
    this.time -= timeCost;
    this.researchPoints -= researchCost;
  }

  getStatus() {
    return `Fuel: ${this.fuel} | Time: ${this.time} | Research Points: ${this.researchPoints}`;
  }
}

// --- Game Logic ---
class CelestialCartographerGame {
  constructor() {
    this.universe = new Universe(TOTAL_STAR_SYSTEMS);
    this.ship = new Ship();
    this.turn = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  printWelcome() {
    console.log('Welcome to Celestial Cartographer!');
    console.log('You are the interstellar mapmaker tasked with exploring and documenting star systems.');
    console.log('Manage your ship resources wisely to achieve the most complete and accurate star map.');
    console.log('Win by mapping at least 80% of star systems with 90% accuracy before running out of fuel or time.');
    console.log('Good luck, explorer!\n');
  }

  showStatus() {
    console.log(`\n--- Turn ${this.turn} ---`);
    console.log(this.ship.getStatus());
    console.log(`Map Completion: ${formatPercent(this.universe.getCompletionRate())} | Average Accuracy: ${formatPercent(this.universe.getAverageAccuracy())}`);
    console.log(`Remaining Unexplored Star Systems: ${this.universe.getUnscannedSystems().length}`);
  }

  promptScanDepth() {
    console.log('\nChoose sector scan depth:');
    console.log('1) Shallow sector scan (less fuel, less reward)');
    console.log('2) Medium sector scan (moderate fuel, moderate reward)');
    console.log('3) Deep sector scan (more fuel, more reward)');
    return new Promise((resolve) => {
      this.rl.question('Enter depth choice (1-3): ', (answer) => {
        const choice = parseInt(answer);
        if ([1, 2, 3].includes(choice)) {
          resolve(choice);
        } else {
          console.log('Invalid input. Please enter 1, 2, or 3.');
          resolve(this.promptScanDepth());
        }
      });
    });
  }

  calculateResourceCosts(depth) {
    // Fuel cost increases quadratically by depth
    const fuelCost = FUEL_BASE_COST * depth * depth;
    const timeCost = TIME_BASE_COST * depth; // linearly increase by depth

    // Research points investment: player may spend some of their points for accuracy
    // For simplicity in this game, research points spent will be fixed fraction of base per depth
    // The deeper the scan, more research points are considered needed to get best accuracy.
    const researchCost = RESEARCH_POINT_BASE * depth;

    return { fuelCost, timeCost, researchCost };
  }

  promptResearchInvestment(maxResearch) {
    return new Promise((resolve) => {
      this.rl.question(`Invest research points for scanning (0 to ${maxResearch}): `, (answer) => {
        const points = parseInt(answer);
        if (!isNaN(points) && points >= 0 && points <= maxResearch) {
          resolve(points);
        } else {
          console.log('Invalid input. Must be a number between 0 and max research points available.');
          resolve(this.promptResearchInvestment(maxResearch));
        }
      });
    });
  }

  performScan(depth, researchInvestment) {
    const unscanned = this.universe.getUnscannedSystems();
    if (unscanned.length === 0) {
      console.log('All star systems have been scanned!');
      return;
    }

    // Calculate resource cost and check if player can afford
    const { fuelCost, timeCost, researchCost } = this.calculateResourceCosts(depth);
    if (!this.ship.hasResources(fuelCost, timeCost, researchCost)) {
      console.log('Insufficient resources for this scan depth and research investment.');
      return;
    }

    // Consume resources
    this.ship.consumeResources(fuelCost, timeCost, researchCost);

    // Select number of star systems scanned this turn based on depth
    // Depth 1 scans 1 star system, depth 2 scans 2, depth 3 scans 3
    const scanCount = depth;

    // Select unique star systems to scan
    const systemsToScan = [];
    while (systemsToScan.length < scanCount && unscanned.length > 0) {
      const idx = getRandomInt(0, unscanned.length - 1);
      systemsToScan.push(unscanned.splice(idx, 1)[0]);
    }

    // Map each scanned star system
    systemsToScan.forEach(system => {
      // Calculate accuracy depending on research investment relative to base
      // If player invests full researchCost, max accuracy; else linear scale
      let accuracy = ACCURACY_BASE + (researchInvestment / researchCost) * (ACCURACY_MAX - ACCURACY_BASE);
      accuracy = clamp(accuracy, ACCURACY_BASE, ACCURACY_MAX); // clamp to range

      // Accuracy scaled by star system richness factor (richness = 1 to 10)
      // richer systems are harder to map fully accurately
      const richnessFactor = 1 - (system.richness / 20); // max reduces accuracy by up to 0.5
      accuracy *= richnessFactor;
      accuracy = clamp(accuracy, 0, 1);

      system.scanned = true;
      system.accuracy = accuracy;
      console.log(`Scanned ${system.name} | Richness: ${system.richness} | Accuracy: ${formatPercent(accuracy)}`);
    });

    // Gain additional research points for new data
    const researchGained = systemsToScan.reduce((acc, sys) => acc + Math.ceil(sys.richness / 2), 0);
    this.ship.researchPoints += researchGained;
    console.log(`Gained ${researchGained} research points from new data.`);
  }

  checkWinLoss() {
    const completion = this.universe.getCompletionRate();
    const accuracy = this.universe.getAverageAccuracy();

    if (completion >= WIN_MAP_COMPLETION && accuracy >= WIN_MAP_ACCURACY) {
      console.log('\n*** Congratulations! You have completed an accurate star map of the universe! ***');
      return 'win';
    }

    if (this.ship.fuel <= 0) {
      console.log('\nYou have run out of fuel. Mission failed.');
      return 'lose';
    }

    if (this.ship.time <= 0) {
      console.log('\nYou have run out of time. Mission failed.');
      return 'lose';
    }

    return 'continue';
  }

  async gameTurn() {
    this.turn++;
    this.showStatus();

    if (this.universe.getUnscannedSystems().length === 0) {
      console.log('\nAll star systems scanned! Evaluating final results...');
      return 'end';
    }

    const scanDepth = await this.promptScanDepth();
    const {fuelCost, timeCost, researchCost} = this.calculateResourceCosts(scanDepth);
    console.log(`Resource costs for this scan: Fuel ${fuelCost}, Time ${timeCost}, Minimum Research Points ${researchCost}`);

    let researchInvestment = 0;
    if (this.ship.researchPoints < researchCost) {
      console.log(`You have only ${this.ship.researchPoints} research points, which is less than the minimum suggested ${researchCost}.`);
      researchInvestment = await this.promptResearchInvestment(this.ship.researchPoints);
    } else {
      researchInvestment = await this.promptResearchInvestment(this.ship.researchPoints);
      if (researchInvestment < researchCost) {
        console.log(`Warning: Investing less than the minimum research points suggested (${researchCost}) will reduce accuracy.`);
      }
    }

    this.performScan(scanDepth, researchInvestment);

    const status = this.checkWinLoss();
    return status;
  }

  async start() {
    this.printWelcome();

    let status = 'continue';
    while (status === 'continue') {
      status = await this.gameTurn();
    }

    if (status === 'win') {
      console.log('Thank you for playing Celestial Cartographer.');
    } else if (status === 'lose') {
      console.log('Mission failed. Better luck next time!');
    } else if (status === 'end') {
      // Evaluate post all scan
      const completion = this.universe.getCompletionRate();
      const accuracy = this.universe.getAverageAccuracy();
      if (completion >= WIN_MAP_COMPLETION && accuracy >= WIN_MAP_ACCURACY) {
        console.log('You have successfully completed your mission by scanning all systems with high accuracy!');
      } else {
        console.log('You scanned all systems but did not meet the win criteria. Mission failed.');
      }
    }

    this.rl.close();
  }
}

// Start the game
const game = new CelestialCartographerGame();
game.start();
