const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Game {
  constructor() {
    this.stabilityPoints = 100;
    this.essenceShards = 0;
    this.temporalDust = 0;
    this.actionPoints = 3;
    this.districts = ['Market District', 'Arcane Library', 'Temporal Gardens', 'Rift Zone'];
    this.elixirs = {};
    this.rifts = [];
    this.turns = 10;
    this.majorRiftsToStabilize = 5;
    this.majorRiftsStabilized = 0;
  }

  start() {
    console.log('Welcome to Chrono-Alchemist's Crucible!');
    this.gameLoop();
  }

  gameLoop() {
    if (this.stabilityPoints <= 0) {
      console.log('Game Over! The city has collapsed.');
      return;
    }
    if (this.majorRiftsStabilized >= this.majorRiftsToStabilize) {
      console.log('Congratulations! You have stabilized enough rifts to save the city!');
      return;
    }
    if (this.turns <= 0) {
      console.log('Time is up! You could not stabilize the rifts in time.');
      return;
    }

    console.log(`\nStability Points: ${this.stabilityPoints}`);
    console.log(`Essence Shards: ${this.essenceShards}`);
    console.log(`Temporal Dust: ${this.temporalDust}`);
    console.log(`Turns Remaining: ${this.turns}`);
    console.log(`Major Rifts Stabilized: ${this.majorRiftsStabilized}/${this.majorRiftsToStabilize}`);
    console.log(`Action Points Available: ${this.actionPoints}`);

    this.showDistricts();
  }

  showDistricts() {
    console.log('\nChoose a district to explore:');
    this.districts.forEach((district, index) => {
      console.log(`${index + 1}. ${district}`);
    });
    console.log('5. Brew Elixirs');
    console.log('6. Stabilize Rift');
    console.log('7. End Turn');

    rl.question('Enter your choice: ', (answer) => {
      this.handleAction(answer);
    });
  }

  handleAction(choice) {
    const action = parseInt(choice);
    if (isNaN(action) || action < 1 || action > 7) {
      console.log('Invalid choice. Please try again.');
      this.showDistricts();
      return;
    }

    if (action <= 4) {
      this.exploreDistrict(action - 1);
    } else if (action === 5) {
      this.brewElixirs();
    } else if (action === 6) {
      this.stabilizeRift();
    } else if (action === 7) {
      this.endTurn();
    }
  }

  exploreDistrict(districtIndex) {
    console.log(`\nExploring ${this.districts[districtIndex]}...`);
    const foundEssence = Math.floor(Math.random() * 5);
    this.essenceShards += foundEssence;
    console.log(`You found ${foundEssence} Essence Shards!`);
    this.actionPoints--;
    this.checkActionPoints();
  }

  brewElixirs() {
    if (this.essenceShards < 2) {
      console.log('Not enough Essence Shards to brew an elixir.');
    } else {
      this.essenceShards -= 2;
      this.elixirs['Temporal Elixir'] = (this.elixirs['Temporal Elixir'] || 0) + 1;
      console.log('Brewed a Temporal Elixir!');
    }
    this.actionPoints--;
    this.checkActionPoints();
  }

  stabilizeRift() {
    if (this.elixirs['Temporal Elixir'] > 0) {
      this.elixirs['Temporal Elixir']--;
      this.majorRiftsStabilized++;
      console.log('Stabilized a major rift!');
    } else {
      console.log('You need a Temporal Elixir to stabilize a rift.');
    }
    this.actionPoints--;
    this.checkActionPoints();
  }

  endTurn() {
    this.turns--;
    this.stabilityPoints -= Math.floor(Math.random() * 10);
    this.actionPoints = 3;
    this.gameLoop();
  }

  checkActionPoints() {
    if (this.actionPoints <= 0) {
      this.endTurn();
    } else {
      this.showDistricts();
    }
  }
}

const game = new Game();
game.start();