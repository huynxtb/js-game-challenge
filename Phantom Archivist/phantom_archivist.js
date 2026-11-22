const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Game {
  constructor() {
    this.sanityMeter = 100;
    this.knowledgeTokens = 0;
    this.inventory = [];
    this.sections = ['Entrance', 'Hall of Illusions', 'Phantom Archives', 'Secret Chamber'];
    this.currentSection = 0;
    this.ancientTexts = ['Tome of Shadows', 'Scroll of Forgotten Lore', 'Grimoire of Lost Knowledge'];
    this.collectedTexts = 0;
  }

  start() {
    console.log('Welcome to Phantom Archivist! Uncover the secrets of the forgotten library.');
    this.nextTurn();
  }

  nextTurn() {
    if (this.sanityMeter <= 0) {
      console.log('You have lost your sanity and succumbed to the phantoms. Game Over.');
      return;
    }
    console.log(`\nCurrent Section: ${this.sections[this.currentSection]}`);
    console.log(`Sanity Meter: ${this.sanityMeter}`);
    console.log(`Knowledge Tokens: ${this.knowledgeTokens}`);
    console.log(`Collected Ancient Texts: ${this.collectedTexts}/${this.ancientTexts.length}`);
    console.log('What would you like to do? (explore, collect, use, exit)');
    rl.question('> ', (action) => this.handleAction(action));
  }

  handleAction(action) {
    switch (action.toLowerCase()) {
      case 'explore':
        this.explore();
        break;
      case 'collect':
        this.collect();
        break;
      case 'use':
        this.use();
        break;
      case 'exit':
        this.exit();
        break;
      default:
        console.log('Invalid action. Please choose again.');
        this.nextTurn();
    }
  }

  explore() {
    const encounter = Math.random();
    if (encounter < 0.5) {
      console.log('You encountered a phantom!');
      this.sanityMeter -= 20;
      console.log('The phantom drains your sanity!');
    } else {
      console.log('You found a Knowledge Token!');
      this.knowledgeTokens += 1;
    }
    this.nextTurn();
  }

  collect() {
    if (this.currentSection < this.ancientTexts.length) {
      console.log(`You collected: ${this.ancientTexts[this.currentSection]}`);
      this.inventory.push(this.ancientTexts[this.currentSection]);
      this.collectedTexts += 1;
      this.currentSection += 1;
      this.nextTurn();
    } else {
      console.log('No more ancient texts to collect in this section.');
      this.nextTurn();
    }
  }

  use() {
    if (this.knowledgeTokens > 0) {
      console.log('You used a Knowledge Token to regain sanity!');
      this.sanityMeter += 10;
      this.knowledgeTokens -= 1;
      if (this.sanityMeter > 100) this.sanityMeter = 100;
    } else {
      console.log('You have no Knowledge Tokens to use.');
    }
    this.nextTurn();
  }

  exit() {
    if (this.collectedTexts === this.ancientTexts.length) {
      console.log('Congratulations! You have collected all the ancient texts and escaped the library with your sanity intact!');
    } else {
      console.log('You cannot escape yet. Collect all ancient texts first.');
    }
    rl.close();
  }
}

const game = new Game();
game.start();