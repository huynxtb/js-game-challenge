const readline = require('readline');

class Game {
  constructor() {
    this.eras = ['Prehistoric', 'Medieval', 'Modern', 'Futuristic'];
    this.currentEra = 'Modern';
    this.day = 1;
    this.maxDays = 20;
    this.timeEnergy = 10; // resource that limits time travel and actions
    this.seeds = {
      Prehistoric: 3,
      Medieval: 3,
      Modern: 5,
      Futuristic: 3
    };
    this.crops = {
      Prehistoric: 0,
      Medieval: 0,
      Modern: 0,
      Futuristic: 0
    };
    this.plantedCrops = [];
    this.orders = [];
    this.completedOrders = 0;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.orderIdCounter = 1;

    // Crop growth times (days to mature) per era
    this.growthTimes = {
      Prehistoric: 5,
      Medieval: 4,
      Modern: 3,
      Futuristic: 2
    };

    // Crop yields per era (units per harvest)
    this.yields = {
      Prehistoric: 5,
      Medieval: 4,
      Modern: 3,
      Futuristic: 6
    };

    this.orderReward = 5; // time energy reward per completed order
  }

  start() {
    this.printIntroduction();
    this.generateOrders(5); // generate 5 orders
    this.mainMenu();
  }

  printIntroduction() {
    console.log("\nWelcome to ChronoHarvest!\n");
    console.log("You manage a time-traveling farm. Plant and harvest crops from different historical eras to fulfill orders before your time runs out.");
    console.log("Each turn is one day. You have limited time energy to travel, plant, and harvest.");
    console.log("Manage your resources carefully and complete all orders to win!\n");
  }

  generateOrders(num) {
    // Orders require a crop from a specific era and have deadlines
    for (let i = 0; i < num; i++) {
      const era = this.eras[Math.floor(Math.random() * this.eras.length)];
      const quantity = Math.floor(Math.random() * 6) + 3; // 3 to 8 units
      const deadline = this.day + Math.floor(Math.random() * (this.maxDays - this.day - 5)) + 5; // at least 5 days from now
      this.orders.push({
        id: this.orderIdCounter++,
        era: era,
        quantity: quantity,
        deadline: deadline,
        fulfilled: false
      });
    }
  }

  mainMenu() {
    if (this.checkLoss()) return this.endGame(false);
    if (this.checkWin()) return this.endGame(true);

    console.log(`\nDay ${this.day} | Current Era: ${this.currentEra} | Time Energy: ${this.timeEnergy}`);
    this.printOrders();
    this.printStatus();

    console.log('\nChoose an action:');
    console.log('1. Travel to another era (costs 1 time energy)');
    console.log('2. Plant crops');
    console.log('3. Harvest crops');
    console.log('4. View status');
    console.log('5. End day');

    this.rl.question('> ', (answer) => {
      switch (answer.trim()) {
        case '1':
          this.travelMenu();
          break;
        case '2':
          this.plantMenu();
          break;
        case '3':
          this.harvestMenu();
          break;
        case '4':
          this.viewStatusMenu();
          break;
        case '5':
          this.endDay();
          break;
        default:
          console.log('Invalid option, please choose a valid action.');
          this.mainMenu();
      }
    });
  }

  printOrders() {
    console.log('Current Orders:');
    if (this.orders.length === 0) {
      console.log('  No orders currently.');
      return;
    }
    this.orders.forEach(order => {
      if (!order.fulfilled) {
        let status = '';
        if (this.day > order.deadline) status = ' (MISSED DEADLINE)';
        console.log(`  [${order.id}] ${order.quantity} units of ${order.era} crops by day ${order.deadline}${status}`);
      }
    });
  }

  printStatus() {
    console.log('\nFarm Status:');
    console.log('Seeds:');
    for (const era of this.eras) {
      console.log(`  ${era}: ${this.seeds[era]}`);
    }
    console.log('Crops ready to harvest:');
    for (const era of this.eras) {
      console.log(`  ${era}: ${this.crops[era]}`);
    }
    console.log(`Planted crops waiting to grow: ${this.plantedCrops.length}`);
  }

  travelMenu() {
    if (this.timeEnergy < 1) {
      console.log('Not enough time energy to travel.');
      return this.mainMenu();
    }
    console.log('Choose an era to travel to:');
    this.eras.forEach((era, index) => {
      console.log(`  ${index + 1}. ${era}`);
    });
    this.rl.question('> ', (answer) => {
      let choice = parseInt(answer.trim());
      if (isNaN(choice) || choice < 1 || choice > this.eras.length) {
        console.log('Invalid choice.');
        return this.mainMenu();
      }
      const chosenEra = this.eras[choice - 1];
      if (chosenEra === this.currentEra) {
        console.log(`You are already in the ${chosenEra} era.`);
        return this.mainMenu();
      }
      this.currentEra = chosenEra;
      this.timeEnergy -= 1;
      console.log(`Traveled to ${chosenEra} era. (-1 time energy)`);
      this.mainMenu();
    });
  }

  plantMenu() {
    const era = this.currentEra;
    if (this.seeds[era] <= 0) {
      console.log(`No ${era} seeds available to plant.`);
      return this.mainMenu();
    }
    this.rl.question(`You have ${this.seeds[era]} ${era} seeds. How many do you want to plant? > `, (answer) => {
      let count = parseInt(answer.trim());
      if (isNaN(count) || count < 1) {
        console.log('Invalid number.');
        return this.mainMenu();
      }
      if (count > this.seeds[era]) {
        console.log('You do not have that many seeds.');
        return this.mainMenu();
      }
      this.seeds[era] -= count;
      for (let i = 0; i < count; i++) {
        this.plantedCrops.push({ era: era, plantedDay: this.day });
      }
      console.log(`Planted ${count} ${era} crops.`);
      this.mainMenu();
    });
  }

  harvestMenu() {
    const era = this.currentEra;
    // Find crops that are mature
    let matureCropsCount = this.plantedCrops.filter(pc =>
      pc.era === era && (this.day - pc.plantedDay) >= this.growthTimes[era]
    ).length;

    if (matureCropsCount === 0) {
      console.log(`No mature ${era} crops to harvest.`);
      return this.mainMenu();
    }

    this.rl.question(`There are ${matureCropsCount} mature ${era} crops. How many do you want to harvest? > `, (answer) => {
      let count = parseInt(answer.trim());
      if (isNaN(count) || count < 1 || count > matureCropsCount) {
        console.log('Invalid number.');
        return this.mainMenu();
      }
      // Remove harvested crops from plantedCrops
      let harvested = 0;
      this.plantedCrops = this.plantedCrops.filter(pc => {
        if (pc.era === era && (this.day - pc.plantedDay) >= this.growthTimes[era] && harvested < count) {
          harvested++;
          return false; // remove from planted
        }
        return true;
      });

      // Yield resources per crop
      const totalYield = count * this.yields[era];
      this.crops[era] += totalYield;
      console.log(`Harvested ${count} ${era} crops yielding ${totalYield} units.`);
      this.mainMenu();
    });
  }

  viewStatusMenu() {
    console.log('\n=== Farm Status ===');
    this.printStatus();
    console.log('\n=== Orders Status ===');
    this.printOrders();
    this.mainMenu();
  }

  endDay() {
    // Check for any orders that can be fulfilled
    this.fulfillOrders();

    // Advance day
    this.day++;

    // Regenerate small amount time energy daily
    this.timeEnergy = Math.min(this.timeEnergy + 2, 10);

    // Crops remain planted, grow with time
    // Seeds replenish slightly from harvest rewards maybe

    console.log('\nDay ended. Time energy recovered by 2.');
    this.mainMenu();
  }

  fulfillOrders() {
    this.orders.forEach(order => {
      if (!order.fulfilled && order.deadline >= this.day) {
        if (this.crops[order.era] >= order.quantity) {
          this.crops[order.era] -= order.quantity;
          order.fulfilled = true;
          this.completedOrders++;
          this.timeEnergy = Math.min(this.timeEnergy + this.orderReward, 10);
          console.log(`\nOrder #${order.id} for ${order.quantity} ${order.era} crops fulfilled! (+${this.orderReward} time energy)`);
        }
      }
    });
  }

  checkWin() {
    return this.orders.every(order => order.fulfilled === true);
  }

  checkLoss() {
    if (this.day > this.maxDays) return true; // ran out of time
    // Check if any incomplete order deadline passed
    for (const order of this.orders) {
      if (!order.fulfilled && order.deadline < this.day) {
        return true;
      }
    }
    return false;
  }

  endGame(won) {
    console.log('\n=== Game Over ===\n');
    if (won) {
      console.log('Congratulations! You completed all orders in time and mastered the ChronoHarvest.');
    } else {
      console.log('You failed to complete all orders within the allotted time or missed deadlines.');
    }
    console.log(`Orders Completed: ${this.completedOrders} / ${this.orders.length}`);
    console.log(`Days Played: ${this.day > this.maxDays ? this.maxDays : this.day - 1}`);
    console.log('Thanks for playing ChronoHarvest!');
    this.rl.close();
  }
}

const game = new Game();
game.start();
