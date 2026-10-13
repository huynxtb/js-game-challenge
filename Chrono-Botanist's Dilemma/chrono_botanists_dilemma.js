const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Plant {
  constructor(name, waterNeeds, nutrientNeeds) {
    this.name = name;
    this.stage = 'Sprout';
    this.waterNeeds = waterNeeds;
    this.nutrientNeeds = nutrientNeeds;
    this.decayed = false;
  }

  grow() {
    const stages = ['Sprout', 'Bud', 'Bloom', 'Decay'];
    const currentIndex = stages.indexOf(this.stage);
    if (currentIndex < stages.length - 1) {
      this.stage = stages[currentIndex + 1];
    } else {
      this.decayed = true;
    }
  }
}

class Game {
  constructor() {
    this.resources = { Water: 10, Nutrients: 10, ChronoStabilizer: 3 };
    this.plants = [];
    this.growSlots = 3;
    this.temporalEssence = 0;
    this.turns = 0;
    this.maxTurns = 100;
  }

  addPlant(plant) {
    if (this.plants.length < this.growSlots) {
      this.plants.push(plant);
    } else {
      console.log('No available grow slots!');
    }
  }

  checkGameOver() {
    if (this.plants.every(plant => plant.decayed) && this.plants.length === this.growSlots) {
      console.log('Game Over: All plants have decayed.');
      return true;
    }
    if (this.resources.ChronoStabilizer <= 0 && this.turns >= 3) {
      console.log('Game Over: Temporal integrity collapsed due to lack of stabilizers.');
      return true;
    }
    if (this.turns >= this.maxTurns) {
      console.log('Game Over: Time has run out.');
      return true;
    }
    return false;
  }

  applyTemporalAnomaly() {
    const anomalyEffects = [
      () => { this.resources.Water += 2; console.log('A rainstorm has replenished your water!'); },
      () => { this.resources.Nutrients += 2; console.log('Nutrients have surged from the ground!'); },
      () => { this.resources.Water -= 3; console.log('A drought has struck!'); },
      () => { this.resources.Nutrients -= 3; console.log('Nutrient depletion has occurred!'); },
      () => { this.plants.forEach(plant => plant.grow()); console.log('Time has accelerated plant growth!'); }
    ];
    const randomEffect = anomalyEffects[Math.floor(Math.random() * anomalyEffects.length)];
    randomEffect();
  }

  displayStatus() {
    console.log(`\n--- Turn ${this.turns + 1} ---`);
    console.log(`Resources: Water: ${this.resources.Water}, Nutrients: ${this.resources.Nutrients}, Chrono-Stabilizer: ${this.resources.ChronoStabilizer}`);
    this.plants.forEach((plant, index) => {
      console.log(`Plant ${index + 1}: ${plant.name}, Stage: ${plant.stage}, Decayed: ${plant.decayed}`);
    });
    console.log(`Temporal Essence: ${this.temporalEssence}`);
  }

  async playerTurn() {
    this.displayStatus();
    const action = await this.askUser('Choose an action: (1) Plant Seed (2) Water Plant (3) Fertilize Plant (4) Harvest Temporal Essence (5) Craft Chrono-Stabilizer (6) Stabilize Environment: ');
    switch (action) {
      case '1':
        this.addPlant(new Plant('Time Fern', 2, 2));
        break;
      case '2':
        this.plants.forEach((plant, index) => {
          if (!plant.decayed) {
            this.resources.Water -= plant.waterNeeds;
            plant.grow();
          }
        });
        break;
      case '3':
        this.plants.forEach((plant, index) => {
          if (!plant.decayed) {
            this.resources.Nutrients -= plant.nutrientNeeds;
            plant.grow();
          }
        });
        break;
      case '4':
        this.temporalEssence += 5;
        break;
      case '5':
        if (this.resources.Water >= 2 && this.resources.Nutrients >= 2) {
          this.resources.Water -= 2;
          this.resources.Nutrients -= 2;
          this.resources.ChronoStabilizer += 1;
        } else {
          console.log('Not enough resources to craft Chrono-Stabilizer.');
        }
        break;
      case '6':
        if (this.resources.ChronoStabilizer > 0) {
          this.resources.ChronoStabilizer -= 1;
          console.log('Environment stabilized.');
        } else {
          console.log('No Chrono-Stabilizer available!');
        }
        break;
      default:
        console.log('Invalid action.');
    }
    this.turns++;
    this.applyTemporalAnomaly();
  }

  askUser(question) {
    return new Promise(resolve => {
      rl.question(question, answer => resolve(answer));
    });
  }

  async start() {
    while (true) {
      if (this.checkGameOver()) break;
      await this.playerTurn();
    }
    rl.close();
  }
}

const game = new Game();
game.start();