const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class CrystalConduit {
  constructor(id, frequency) {
    this.id = id;
    this.frequency = frequency;
    this.integrity = 100;
    this.status = 'Healthy';
    this.aetheriumGeneration = this.calculateAetheriumGeneration();
  }

  calculateAetheriumGeneration() {
    return this.status === 'Healthy' ? 10 : this.status === 'Unstable' ? 5 : 0;
  }

  tune(frequency) {
    this.frequency = frequency;
  }

  reinforce() {
    this.integrity = Math.min(this.integrity + 20, 100);
  }

  overcharge() {
    this.integrity -= 15;
    if (this.integrity <= 0) {
      this.status = 'Failed';
    }
  }

  updateStatus() {
    if (this.integrity <= 0) {
      this.status = 'Failed';
    } else if (this.integrity < 50) {
      this.status = 'Damaged';
    } else if (this.integrity < 80) {
      this.status = 'Unstable';
    } else {
      this.status = 'Healthy';
    }
    this.aetheriumGeneration = this.calculateAetheriumGeneration();
  }
}

class Game {
  constructor() {
    this.cycle = 0;
    this.aetheriumCharge = 100;
    this.resonanceStability = 100;
    this.crystals = [
      new CrystalConduit(1, 'LOW'),
      new CrystalConduit(2, 'MID'),
      new CrystalConduit(3, 'HIGH')
    ];
    this.failedCrystals = 0;
    this.maxCycles = 50;
  }

  start() {
    console.log('Welcome to Resonance Conductor: Aetherium Echoes!');
    this.nextCycle();
  }

  nextCycle() {
    this.cycle++;
    this.updateCrystalStates();
    this.handleEvents();
    this.displayStatus();
    if (this.cycle > this.maxCycles) {
      console.log('You have successfully maintained the Aetherium Network for 50 cycles! You win!');
      rl.close();
      return;
    }
    if (this.isGameOver()) {
      console.log('Game Over!');
      rl.close();
      return;
    }
    this.promptAction();
  }

  updateCrystalStates() {
    this.crystals.forEach(crystal => {
      crystal.updateStatus();
      this.aetheriumCharge -= crystal.aetheriumGeneration;
    });
  }

  handleEvents() {
    const event = Math.floor(Math.random() * 3);
    switch (event) {
      case 0:
        console.log('Event: Aetheric Surge! All crystals become unstable.');
        this.crystals.forEach(crystal => {
          crystal.status = 'Unstable';
        });
        break;
      case 1:
        const randomCrystal = this.crystals[Math.floor(Math.random() * this.crystals.length)];
        console.log(`Event: Frequency Drift! Crystal ${randomCrystal.id} changes frequency.`);
        randomCrystal.tune(randomCrystal.frequency === 'LOW' ? 'MID' : randomCrystal.frequency === 'MID' ? 'HIGH' : 'LOW');
        break;
      case 2:
        const integrityCrystal = this.crystals[Math.floor(Math.random() * this.crystals.length)];
        console.log(`Event: Integrity Flaw! Crystal ${integrityCrystal.id} loses 20 integrity.`);
        integrityCrystal.integrity -= 20;
        integrityCrystal.updateStatus();
        break;
    }
  }

  displayStatus() {
    console.log(`Cycle: ${this.cycle}, Aetherium Charge: ${this.aetheriumCharge}, Resonance Stability: ${this.resonanceStability}`);
    this.crystals.forEach(crystal => {
      console.log(`Crystal ${crystal.id}: Frequency: ${crystal.frequency}, Integrity: ${crystal.integrity}, Status: ${crystal.status}, Aetherium Generation: ${crystal.aetheriumGeneration}`);
    });
  }

  promptAction() {
    rl.question('Enter your action (TUNE [ID] [FREQ], REINFORCE [ID], OVERCHARGE [ID], SCAN NETWORK): ', (input) => {
      this.processAction(input);
    });
  }

  processAction(input) {
    const parts = input.split(' ');
    const command = parts[0].toUpperCase();
    const id = parseInt(parts[1]);
    const frequency = parts[2] ? parts[2].toUpperCase() : null;

    if (command === 'TUNE' && frequency) {
      this.tuneCrystal(id, frequency);
    } else if (command === 'REINFORCE') {
      this.reinforceCrystal(id);
    } else if (command === 'OVERCHARGE') {
      this.overchargeCrystal(id);
    } else if (command === 'SCAN') {
      this.scanNetwork();
    } else {
      console.log('Invalid command.');
    }
    this.nextCycle();
  }

  tuneCrystal(id, frequency) {
    const crystal = this.crystals.find(c => c.id === id);
    if (crystal) {
      crystal.tune(frequency);
      this.aetheriumCharge -= 5;
      console.log(`Tuned Crystal ${id} to ${frequency}.`);
    } else {
      console.log('Crystal not found.');
    }
  }

  reinforceCrystal(id) {
    const crystal = this.crystals.find(c => c.id === id);
    if (crystal) {
      crystal.reinforce();
      this.aetheriumCharge -= 10;
      console.log(`Reinforced Crystal ${id}.`);
    } else {
      console.log('Crystal not found.');
    }
  }

  overchargeCrystal(id) {
    const crystal = this.crystals.find(c => c.id === id);
    if (crystal) {
      crystal.overcharge();
      this.aetheriumCharge -= 15;
      console.log(`Overcharged Crystal ${id}.`);
    } else {
      console.log('Crystal not found.');
    }
  }

  scanNetwork() {
    this.aetheriumCharge -= 5;
    console.log('Scanning network...');
    this.displayStatus();
  }

  isGameOver() {
    if (this.aetheriumCharge <= 0 || this.resonanceStability <= 0) {
      return true;
    }
    this.failedCrystals = this.crystals.filter(c => c.status === 'Failed').length;
    return this.failedCrystals >= 4;
  }
}

const game = new Game();
game.start();