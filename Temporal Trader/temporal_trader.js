const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class TemporalTrader {
  constructor() {
    this.wealth = 1000;
    this.turns = 30;
    this.market = this.generateMarket();
    this.targetWealth = 5000;
    this.resources = {};
  }

  generateMarket() {
    const eras = ['Ancient Rome', 'Medieval Europe', 'Industrial Revolution', 'Modern Era'];
    const goods = ['Wheat', 'Silk', 'Coal', 'Tech'];
    const market = {};

    eras.forEach(era => {
      market[era] = {};
      goods.forEach(good => {
        market[era][good] = Math.floor(Math.random() * 100) + 1;
      });
    });

    return market;
  }

  displayStatus() {
    console.log(`Wealth: $${this.wealth}`);
    console.log(`Turns left: ${this.turns}`);
    console.log('Market:', this.market);
    console.log('Resources:', this.resources);
  }

  buy(good, amount, era) {
    const price = this.market[era][good];
    const totalCost = price * amount;
    if (this.wealth >= totalCost) {
      this.wealth -= totalCost;
      this.resources[good] = (this.resources[good] || 0) + amount;
      console.log(`Bought ${amount} ${good} for $${totalCost}.`);
    } else {
      console.log('Not enough wealth to buy!');
    }
  }

  sell(good, amount, era) {
    if (this.resources[good] >= amount) {
      const price = this.market[era][good];
      const totalGain = price * amount;
      this.wealth += totalGain;
      this.resources[good] -= amount;
      console.log(`Sold ${amount} ${good} for $${totalGain}.`);
    } else {
      console.log('Not enough resources to sell!');
    }
  }

  nextTurn() {
    this.turns--;
    this.updateMarket();
    this.displayStatus();
  }

  updateMarket() {
    Object.keys(this.market).forEach(era => {
      Object.keys(this.market[era]).forEach(good => {
        this.market[era][good] += Math.floor(Math.random() * 10) - 5;
        this.market[era][good] = Math.max(this.market[era][good], 1);
      });
    });
  }

  checkWinCondition() {
    if (this.wealth >= this.targetWealth) {
      console.log('Congratulations! You have reached your wealth target!');
      return true;
    }
    if (this.turns <= 0) {
      console.log('Time is up! You did not reach your wealth target.');
      return true;
    }
    return false;
  }

  startGame() {
    console.log('Welcome to Temporal Trader!');
    this.displayStatus();
    this.promptAction();
  }

  promptAction() {
    if (this.checkWinCondition()) {
      rl.close();
      return;
    }
    rl.question('Choose an action (buy/sell/next): ', (action) => {
      if (action === 'next') {
        this.nextTurn();
      } else {
        rl.question('Enter good: ', (good) => {
          rl.question('Enter amount: ', (amount) => {
            rl.question('Enter era: ', (era) => {
              if (action === 'buy') {
                this.buy(good, parseInt(amount), era);
              } else if (action === 'sell') {
                this.sell(good, parseInt(amount), era);
              }
              this.promptAction();
            });
          });
        });
      }
    });
  }
}

const game = new TemporalTrader();
game.startGame();