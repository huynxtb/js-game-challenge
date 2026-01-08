#!/usr/bin/env node
// Starship Salvage Saga - A text based space salvage adventure game
// Run with: node starship_salvage_saga.js

const readline = require('readline');

// Game Constants
const MAX_FUEL = 100;
const MAX_HULL = 100;
const MAX_MORALE = 100;
const MAX_CARGO = 50;
const FUEL_COST_TRAVEL = 10;
const REPAIR_FUEL_COST = 5;
const REPAIR_HULL_RESTORE = 20;
const MORALE_RESTORE_REST = 15;
const WORTHY_SALVAGE_VALUE_RANGE = [50, 200];
const SALVAGE_HULL_RISK_CHANCE = 0.3;
const SALVAGE_HULL_DAMAGE_RANGE = [5, 20];
const SALVAGE_MORALE_LOSS_CHANCE = 0.2;
const SALVAGE_MORALE_LOSS_RANGE = [5, 15];
const TRAVEL_SECTORS = 10;
const MAX_TURNS = 1000; // safeguard for endless loop
const TARGET_CREDITS = 1000;

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChance(probability) {
  return Math.random() < probability;
}

// Game State
class Game {
  constructor() {
    this.fuel = MAX_FUEL;
    this.hull = MAX_HULL;
    this.morale = MAX_MORALE;
    this.cargo = 0;
    this.credits = 0;
    this.sector = 0; // 0 is home base sector
    this.turns = 0;
    this.homeBaseSector = 0;
    this.isGameOver = false;
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  printIntro() {
    console.clear();
    console.log('Welcome to Starship Salvage Saga!');
    console.log('You are the captain of a lone salvage starship drifting through a sector filled with derelict ships and mysterious debris.');
    console.log('Your mission: collect valuable salvage, manage your ship, and survive to return home rich.');
    console.log('');
    console.log('Commands Overview:');
    console.log('1. Travel to a new sector (Costs fuel but opens new salvage opportunities)');
    console.log('2. Attempt salvage (Gain credits but risk ship damage or crew morale loss)');
    console.log('3. Repair ship (Restore hull integrity at the cost of fuel and time)');
    console.log('4. Rest crew (Improve morale to avoid mutiny)');
    console.log('5. View ship status and inventory');
    console.log('');
    console.log(`Your goal: Accumulate ${TARGET_CREDITS} credits and safely return to sector 0 (home base).`);
    console.log('Beware: Running out of fuel, hull integrity reaching zero, or crew morale falling to zero means game over.');
    console.log('');
  }

  displayStatus() {
    console.log('-------------------------------------------------------');
    console.log(`Turn: ${this.turns} | Sector: ${this.sector} | Fuel: ${this.fuel}/${MAX_FUEL} | Hull Integrity: ${this.hull}/${MAX_HULL} | Crew Morale: ${this.morale}/${MAX_MORALE}`);
    console.log(`Cargo Space: ${this.cargo}/${MAX_CARGO} units | Credits: ${this.credits}`);
    console.log('-------------------------------------------------------');
  }

  promptAction() {
    return new Promise((resolve) => {
      console.log('Choose your action:');
      console.log('1) Travel to a new sector');
      console.log('2) Attempt salvage');
      console.log('3) Repair ship');
      console.log('4) Rest crew');
      console.log('5) View status');
      this.rl.question('Enter the number of your action: ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async gameLoop() {
    this.printIntro();

    while (!this.isGameOver && this.turns < MAX_TURNS) {
      this.turns++;
      this.displayStatus();
      let action = await this.promptAction();

      switch(action) {
        case '1':
          await this.travel();
          break;
        case '2':
          await this.salvage();
          break;
        case '3':
          await this.repair();
          break;
        case '4':
          await this.rest();
          break;
        case '5':
          this.viewStatus();
          break;
        default:
          console.log('Invalid action. Please choose a valid number 1-5.');
          this.turns--;
          continue;
      }

      if (this.sector !== this.homeBaseSector) {
        await this.randomEvent();
      }

      this.checkGameState();
    }

    if (this.turns >= MAX_TURNS) {
      console.log('You have reached the maximum number of turns. Game over.');
    }

    this.rl.close();
  }

  async travel() {
    if (this.fuel < FUEL_COST_TRAVEL) {
      console.log('Not enough fuel to travel to a new sector.');
      return;
    }

    let availableSectors = [];
    for (let i = 1; i <= TRAVEL_SECTORS; i++) {
      if (i !== this.sector) availableSectors.push(i);
    }

    console.log('Available sectors to travel: ' + availableSectors.join(', '));

    let destination = await new Promise((resolve) => {
      this.rl.question('Enter sector number to travel: ', (ans) => {
        resolve(parseInt(ans.trim(), 10));
      });
    });

    if (!availableSectors.includes(destination)) {
      console.log('Invalid sector number. Travel aborted.');
      return;
    }

    this.fuel -= FUEL_COST_TRAVEL;
    this.sector = destination;
    console.log(`You travel to sector ${destination}. Fuel is now ${this.fuel}/${MAX_FUEL}.`);
  }

  async salvage() {
    if (this.cargo >= MAX_CARGO) {
      console.log('Your cargo hold is full. Sell or return to base to free space.');
      return;
    }

    let salvageValue = randomInt(WORTHY_SALVAGE_VALUE_RANGE[0], WORTHY_SALVAGE_VALUE_RANGE[1]);

    console.log('Attempting to salvage a derelict ship or debris field...');
    await this.delay(1500);

    if (randomChance(0.1)) {
      console.log('Salvage attempt failed! It was worthless or inaccessible.');
      this.morale = Math.max(0, this.morale - 5);
      console.log('Crew morale decreased due to frustration.');
      return;
    }

    // Risk of hull damage
    if (randomChance(SALVAGE_HULL_RISK_CHANCE)) {
      let damage = randomInt(SALVAGE_HULL_DAMAGE_RANGE[0], SALVAGE_HULL_DAMAGE_RANGE[1]);
      this.hull = Math.max(0, this.hull - damage);
      console.log(`Salvage operation caused damage to your ship! Hull integrity lost: ${damage}.`);
    }

    // Risk of morale loss
    if (randomChance(SALVAGE_MORALE_LOSS_CHANCE)) {
      let moraleLoss = randomInt(SALVAGE_MORALE_LOSS_RANGE[0], SALVAGE_MORALE_LOSS_RANGE[1]);
      this.morale = Math.max(0, this.morale - moraleLoss);
      console.log(`The dangerous salvage operation lowered crew morale by ${moraleLoss}.`);
    }

    // Add salvage to cargo and credits
    let spaceUsed = randomInt(5, 15);
    if (this.cargo + spaceUsed > MAX_CARGO) {
      spaceUsed = MAX_CARGO - this.cargo; // fill remaining space
      salvageValue = Math.floor(salvageValue * (spaceUsed / 15));
    }
    this.cargo += spaceUsed;
    this.credits += salvageValue;

    console.log(`You successfully salvaged items worth ${salvageValue} credits using ${spaceUsed} cargo units.`);
  }

  async repair() {
    if (this.hull >= MAX_HULL) {
      console.log('Your hull is already at maximum integrity.');
      return;
    }

    if (this.fuel < REPAIR_FUEL_COST) {
      console.log('Not enough fuel to power repairs.');
      return;
    }

    this.fuel -= REPAIR_FUEL_COST;
    let repairAmount = Math.min(REPAIR_HULL_RESTORE, MAX_HULL - this.hull);
    this.hull += repairAmount;

    console.log(`Repairing ship... Hull integrity restored by ${repairAmount}. Fuel used: ${REPAIR_FUEL_COST}.`);
    await this.delay(1000);
  }

  async rest() {
    if (this.morale >= MAX_MORALE) {
      console.log('Crew morale is already high. No need to rest now.');
      return;
    }

    let moraleGain = Math.min(MORALE_RESTORE_REST, MAX_MORALE - this.morale);
    this.morale += moraleGain;
    console.log(`Crew rests and morale improves by ${moraleGain}.`);
    await this.delay(1000);
  }

  viewStatus() {
    console.log('\n===== CURRENT SHIP STATUS =====');
    console.log(`Sector: ${this.sector} (Home base is sector 0)`);
    console.log(`Fuel: ${this.fuel}/${MAX_FUEL}`);
    console.log(`Hull Integrity: ${this.hull}/${MAX_HULL}`);
    console.log(`Crew Morale: ${this.morale}/${MAX_MORALE}`);
    console.log(`Cargo Space Used: ${this.cargo}/${MAX_CARGO}`);
    console.log(`Credits: ${this.credits}`);
    console.log('================================\n');
  }

  async randomEvent() {
    let eventRoll = Math.random();
    // 40% chance of no event
    if(eventRoll < 0.4) {
      // No event
      return;
    } else if(eventRoll < 0.6) {
      await this.eventAsteroidField();
    } else if(eventRoll < 0.75) {
      await this.eventRadiationZone();
    } else if(eventRoll < 0.9) {
      await this.eventPirateEncounter();
    } else {
      await this.eventLuckyFind();
    }
  }

  async eventAsteroidField() {
    console.log('\nWarning: You enter a dense asteroid field!');
    if(randomChance(0.5)) {
      let damage = randomInt(10, 30);
      this.hull = Math.max(0, this.hull - damage);
      console.log(`Your ship scraped by asteroids and took ${damage} damage!`);
    } else {
      console.log('You carefully maneuver through the field without damage.');
    }
    await this.delay(1000);
  }

  async eventRadiationZone() {
    console.log('\nWarning: Radiation zone detected!');
    if(randomChance(0.5)) {
      let moraleLoss = randomInt(10, 25);
      this.morale = Math.max(0, this.morale - moraleLoss);
      console.log(`Radiation fatigue lowers crew morale by ${moraleLoss}.`);
    } else {
      console.log('Radiation shield held strong, no morale loss.');
    }
    await this.delay(1000);
  }

  async eventPirateEncounter() {
    console.log('\nAlert: Space pirates are attempting to ambush you!');
    if(this.fuel < 20) {
      console.log('You lack enough fuel to outrun pirates! Ship takes damage in skirmish.');
      let damage = randomInt(20, 40);
      this.hull = Math.max(0, this.hull - damage);
      this.morale = Math.max(0, this.morale - 10);
      await this.delay(1200);
      return;
    }

    console.log('Do you:');
    console.log('1) Attempt to flee (costs 20 fuel)');
    console.log('2) Confront pirates (risk damage and morale)');

    let choice = await new Promise((resolve) => {
      this.rl.question('Choose 1 or 2: ', (ans) => {
        resolve(ans.trim());
      });
    });

    if(choice === '1') {
      this.fuel -= 20;
      if(randomChance(0.7)) {
        console.log('You successfully escaped the pirates using fuel for a quick jump!');
      } else {
        let damage = randomInt(10, 25);
        this.hull = Math.max(0, this.hull - damage);
        this.morale = Math.max(0, this.morale - 5);
        console.log(`Escape was rough. Ship took ${damage} damage.`);
      }
    } else if(choice === '2') {
      if(randomChance(0.5)) {
        let damage = randomInt(15, 40);
        this.hull = Math.max(0, this.hull - damage);
        this.morale = Math.max(0, this.morale - 15);
        console.log(`The fight was intense; your ship took ${damage} damage and morale suffered.`);
      } else {
        let loot = randomInt(50, 150);
        this.credits += loot;
        console.log(`You defeated the pirates and salvaged booty worth ${loot} credits!`);
      }
    } else {
      console.log('Invalid choice. Pirates take advantage and hit your ship.');
      let damage = randomInt(20, 35);
      this.hull = Math.max(0, this.hull - damage);
      this.morale = Math.max(0, this.morale - 10);
    }
    await this.delay(1500);
  }

  async eventLuckyFind() {
    let loot = randomInt(100, 300);
    console.log(`\nLucky find! You discover hidden salvage worth ${loot} credits without any risk.`);
    this.credits += loot;
    await this.delay(1000);
  }

  checkGameState() {
    if (this.fuel <= 0) {
      console.log('\nYou have run out of fuel and are stranded in space. Game Over.');
      this.isGameOver = true;
    } else if (this.hull <= 0) {
      console.log('\nYour ship has suffered critical hull damage and breaks apart. Game Over.');
      this.isGameOver = true;
    } else if (this.morale <= 0) {
      console.log('\nYour crew has lost all morale and mutiny ensues. Game Over.');
      this.isGameOver = true;
    } else if (this.sector === this.homeBaseSector && this.credits >= TARGET_CREDITS) {
      console.log(`\nCongratulations! You have accumulated ${this.credits} credits and returned safely to base.`);
      console.log('You win Starship Salvage Saga!');
      this.isGameOver = true;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

(async () => {
  const game = new Game();
  await game.gameLoop();
})();
