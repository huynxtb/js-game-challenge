const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Game {
  constructor() {
    this.timeEnergy = 10;
    this.artifacts = [];
    this.timeGuardians = 0;
    this.winCondition = 5;
    this.eraOptions = ['Ancient Egypt', 'Medieval Europe', 'Futuristic Dystopia'];
  }

  start() {
    console.log('Welcome to Chrono Collector!');
    this.mainMenu();
  }

  mainMenu() {
    console.log(`\nYou have ${this.timeEnergy} time energy.`);
    console.log('Choose an action:');
    console.log('1. Travel to a new era');
    console.log('2. Check inventory');
    console.log('3. Exit game');
    rl.question('Enter your choice: ', (choice) => {
      switch (choice) {
        case '1':
          this.travel();
          break;
        case '2':
          this.checkInventory();
          break;
        case '3':
          console.log('Thank you for playing!');
          rl.close();
          break;
        default:
          console.log('Invalid choice. Try again.');
          this.mainMenu();
      }
    });
  }

  travel() {
    if (this.timeEnergy <= 0) {
      console.log('You have no time energy left!');
      return this.mainMenu();
    }
    console.log('Select an era to travel to:');
    this.eraOptions.forEach((era, index) => {
      console.log(`${index + 1}. ${era}`);
    });
    rl.question('Enter the number of the era: ', (eraChoice) => {
      const eraIndex = parseInt(eraChoice) - 1;
      if (eraIndex < 0 || eraIndex >= this.eraOptions.length) {
        console.log('Invalid era choice.');
        return this.travel();
      }
      this.exploreEra(this.eraOptions[eraIndex]);
    });
  }

  exploreEra(era) {
    console.log(`\nYou are now in ${era}.`);
    this.timeEnergy--;
    console.log(`You have ${this.timeEnergy} time energy left.`);
    console.log('Choose an action:');
    console.log('1. Search for artifacts');
    console.log('2. Defend against time guardians');
    console.log('3. Return to base');
    rl.question('Enter your choice: ', (actionChoice) => {
      switch (actionChoice) {
        case '1':
          this.searchArtifacts(era);
          break;
        case '2':
          this.defend();
          break;
        case '3':
          this.returnToBase();
          break;
        default:
          console.log('Invalid choice.');
          this.exploreEra(era);
      }
    });
  }

  searchArtifacts(era) {
    const artifact = `Artifact from ${era}`;
    this.artifacts.push(artifact);
    console.log(`You found a ${artifact}!`);
    if (this.artifacts.length > 3) {
      this.timeGuardians++;
      console.log('You attracted a time guardian!');
    }
    this.checkWinCondition();
    this.exploreEra(era);
  }

  defend() {
    if (this.timeGuardians > 0) {
      console.log('You defended against a time guardian!');
      this.timeGuardians--;
    } else {
      console.log('No time guardians to defend against.');
    }
    this.exploreEra(this.eraOptions[Math.floor(Math.random() * this.eraOptions.length)]);
  }

  returnToBase() {
    console.log('Returning to base...');
    this.mainMenu();
  }

  checkInventory() {
    console.log('Your artifacts:');
    this.artifacts.forEach((artifact, index) => {
      console.log(`${index + 1}. ${artifact}`);
    });
    this.mainMenu();
  }

  checkWinCondition() {
    if (this.artifacts.length >= this.winCondition) {
      console.log('Congratulations! You have collected enough artifacts and won the game!');
      rl.close();
    } else if (this.timeEnergy <= 0) {
      console.log('You have run out of time energy and lost the game.');
      rl.close();
    } else if (this.timeGuardians > 3) {
      console.log('Too many time guardians! You have lost the game.');
      rl.close();
    }
  }
}

const game = new Game();
game.start();