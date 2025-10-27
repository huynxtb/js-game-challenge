const readline = require('readline');

// Game constants
const MAX_TURNS = 30;
const ENERGY_MAX = 10;
const WATER_MAX = 10;
const ERA_NAMES = ['Ancient Past', 'Present Day', 'Future'];

const ERA_WEATHER = {
  'Ancient Past': ['Drought', 'Sunny', 'Rainy'],
  'Present Day': ['Windy', 'Rainy', 'Sunny'],
  'Future': ['Toxic Fog', 'Sunny', 'Radiation Storm']
};

const RARE_CROPS = {
  'Ancient Past': 'Blueberry',
  'Present Day': 'SilverCorn',
  'Future': 'NeonMelon'
};

const CROP_GROWTH_DAYS = 4;
const WATER_CONSUMPTION_PER_WATER = 1;
const ENERGY_CONSUMPTION = {
  plant: 1,
  water: 1,
  harvest: 2,
  travel: 3,
  rest: 0
};
const QUOTA_PER_ERA = 3;

class Crop {
  constructor(name) {
    this.name = name; // Crop name
    this.stage = 0;    // Growth stage 0 to CROP_GROWTH_DAYS
    this.wateredToday = false;
  }

  isMature() {
    return this.stage >= CROP_GROWTH_DAYS;
  }

  progressDay(weatherEvent) {
    // Growth affected by weather and watering
    if (this.isMature()) return; // Already mature

    let growthIncrement = 1; // base growth
    // Weather effects
    if (weatherEvent === 'Drought' || weatherEvent === 'Toxic Fog') {
      growthIncrement = this.wateredToday ? 1 : 0; // Must be watered to grow
    } else if (weatherEvent === 'Rainy') {
      growthIncrement = 2; // rain boosts growth
    } else if (weatherEvent === 'Radiation Storm') {
      growthIncrement = -1; // radiation harms growth
    } else if (weatherEvent === 'Windy') {
      growthIncrement = this.wateredToday ? 1 : 0.5; // needs watering for full growth
    }

    this.stage += growthIncrement;
    if (this.stage < 0) this.stage = 0;
    if (this.stage > CROP_GROWTH_DAYS) this.stage = CROP_GROWTH_DAYS;

    // Reset wateredToday after growth
    this.wateredToday = false;
  }
}

class Era {
  constructor(name) {
    this.name = name;
    this.weather = null;
    this.crops = [];
  }

  startDay() {
    // Random new weather event per day
    let events = ERA_WEATHER[this.name];
    this.weather = events[Math.floor(Math.random() * events.length)];
    // Progress crops
    this.crops.forEach(crop => crop.progressDay(this.weather));
  }

  plantCrop() {
    if (this.crops.length >= 5) { // Max 5 crops per era to simplify
      return false;
    }
    const cropName = RARE_CROPS[this.name];
    this.crops.push(new Crop(cropName));
    return true;
  }

  harvestableCount() {
    return this.crops.filter(crop => crop.isMature()).length;
  }

  harvestCrop() {
    const idx = this.crops.findIndex(crop => crop.isMature());
    if (idx === -1) return false;
    this.crops.splice(idx, 1);
    return true;
  }

  displayCrops() {
    if (this.crops.length === 0) return 'No crops planted.';
    return this.crops.map((crop, i) => {
      const stagePct = Math.floor((crop.stage / CROP_GROWTH_DAYS) * 100);
      return `${i + 1}. ${crop.name} - ${stagePct}% grown${crop.isMature() ? ' (Mature)' : ''}`;
    }).join('\n');
  }
}

class Game {
  constructor() {
    this.turn = 1;
    this.energy = ENERGY_MAX;
    this.water = WATER_MAX;
    this.currentEraIndex = 1; // Start at Present Day
    this.eras = ERA_NAMES.map(name => new Era(name));
    this.harvestedQuota = {
      'Ancient Past': 0,
      'Present Day': 0,
      'Future': 0
    };
    // Setup readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  start() {
    console.log('Welcome to ChronoHarvest!');
    console.log('You are a time-traveling farmer saving your world by cultivating rare crops across eras.');
    console.log('Each turn is a day. Manage your seeds, water, and energy wisely.');
    console.log('Plant, water, harvest, or travel through time to succeed.');
    console.log('Win by harvesting at least ' + QUOTA_PER_ERA + ' rare crops from at least 3 different eras before time runs out.');
    console.log('Lose if you run out of water or energy or fail the quota of crops in time.');
    console.log('Good luck!\n');
    this.dayStart();
  }

  dayStart() {
    if (this.turn > MAX_TURNS) {
      this.endGame(false);
      return;
    }
    if (this.energy <= 0) {
      console.log('You have run out of energy and cannot continue.');
      this.endGame(false);
      return;
    }
    if (this.water <= 0) {
      console.log('You have run out of water and cannot continue.');
      this.endGame(false);
      return;
    }

    console.log('--- Day ' + this.turn + ' ---');
    const era = this.eras[this.currentEraIndex];
    era.startDay();
    this.displayStatus();
    this.promptAction();
  }

  displayStatus() {
    const era = this.eras[this.currentEraIndex];
    console.log(`Current Era: ${era.name} | Weather: ${era.weather}`);
    console.log(`Energy: ${this.energy} / ${ENERGY_MAX} | Water: ${this.water} / ${WATER_MAX}`);
    console.log(`Harvested │ Ancient Past: ${this.harvestedQuota['Ancient Past']} | Present Day: ${this.harvestedQuota['Present Day']} | Future: ${this.harvestedQuota['Future']}`);
    console.log('Your crops in this era:');
    console.log(era.displayCrops());
  }

  promptAction() {
    console.log('\nChoose your action:');
    console.log('1) Plant (uses 1 energy, 1 seed assumed unlimited)');
    console.log('2) Water (uses 1 energy, 1 water unit)');
    console.log('3) Harvest (uses 2 energy)');
    console.log('4) Travel Time (uses 3 energy)');
    console.log('5) Rest (recover 2 energy, but turn proceeds)');
    this.rl.question('Enter 1, 2, 3, 4, or 5: ', input => {
      this.handleAction(input.trim());
    });
  }

  handleAction(input) {
    switch(input) {
      case '1':
        this.actionPlant();
        break;
      case '2':
        this.actionWater();
        break;
      case '3':
        this.actionHarvest();
        break;
      case '4':
        this.actionTravel();
        break;
      case '5':
        this.actionRest();
        break;
      default:
        console.log('Invalid input, please try again.');
        this.promptAction();
    }
  }

  actionPlant() {
    if (this.energy < ENERGY_CONSUMPTION.plant) {
      console.log('Not enough energy to plant.');
      this.promptAction();
      return;
    }
    const era = this.eras[this.currentEraIndex];
    if (!era.plantCrop()) {
      console.log('Max crops planted in this era (5). Cannot plant more.');
      this.promptAction();
      return;
    }
    this.energy -= ENERGY_CONSUMPTION.plant;
    console.log('You planted a ' + RARE_CROPS[era.name] + '.');
    this.nextTurn();
  }

  actionWater() {
    if (this.energy < ENERGY_CONSUMPTION.water) {
      console.log('Not enough energy to water.');
      this.promptAction();
      return;
    }
    if (this.water < WATER_CONSUMPTION_PER_WATER) {
      console.log('Not enough water to water crops.');
      this.promptAction();
      return;
    }
    const era = this.eras[this.currentEraIndex];
    if (era.crops.length === 0) {
      console.log('No crops to water in this era.');
      this.promptAction();
      return;
    }
    this.energy -= ENERGY_CONSUMPTION.water;
    this.water -= WATER_CONSUMPTION_PER_WATER;
    era.crops.forEach(crop => {
      crop.wateredToday = true;
    });
    console.log('You watered your crops.');
    this.nextTurn();
  }

  actionHarvest() {
    if (this.energy < ENERGY_CONSUMPTION.harvest) {
      console.log('Not enough energy to harvest.');
      this.promptAction();
      return;
    }
    const era = this.eras[this.currentEraIndex];
    const harvested = era.harvestCrop();
    if (!harvested) {
      console.log('No mature crops to harvest here.');
      this.promptAction();
      return;
    }
    this.energy -= ENERGY_CONSUMPTION.harvest;
    this.harvestedQuota[era.name]++;
    console.log('You harvested a mature ' + RARE_CROPS[era.name] + '!');
    this.checkWinCondition();
    this.nextTurn();
  }

  actionTravel() {
    if (this.energy < ENERGY_CONSUMPTION.travel) {
      console.log('Not enough energy to time travel.');
      this.promptAction();
      return;
    }
    console.log('Choose era to travel to:');
    ERA_NAMES.forEach((name, idx) => {
      if (idx !== this.currentEraIndex) {
        console.log(`${idx + 1}) ${name}`);
      }
    });
    this.rl.question('Enter number of era: ', input => {
      let targetIdx = parseInt(input.trim(), 10) - 1;
      if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= ERA_NAMES.length || targetIdx === this.currentEraIndex) {
        console.log('Invalid era choice.');
        this.promptAction();
        return;
      }
      this.energy -= ENERGY_CONSUMPTION.travel;
      this.currentEraIndex = targetIdx;
      console.log(`You time traveled to ${ERA_NAMES[this.currentEraIndex]}.`);
      this.nextTurn();
    });
  }

  actionRest() {
    const energyGained = 2;
    this.energy += energyGained;
    if (this.energy > ENERGY_MAX) this.energy = ENERGY_MAX;
    console.log('You rested and recovered energy (+2).');
    this.nextTurn();
  }

  nextTurn() {
    this.turn++;
    this.dayStart();
  }

  checkWinCondition() {
    // Must have at least QUOTA_PER_ERA harvested from at least 3 eras
    const erasMet = Object.values(this.harvestedQuota).filter(v => v >= QUOTA_PER_ERA).length;
    if (erasMet >= 3) {
      this.endGame(true);
    }
  }

  endGame(won) {
    if (won) {
      console.log('\nCongratulations! You saved the future by harvesting enough rare crops across eras!');
    } else {
      console.log('\nGame Over. You failed to save the future from famine.');
      console.log('Harvested summary:');
      Object.entries(this.harvestedQuota).forEach(([era, count]) => {
        console.log(`- ${era}: ${count}`);
      });
    }
    console.log('Thanks for playing ChronoHarvest!');
    this.rl.close();
  }
}

const game = new Game();
game.start();
