const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Game {
  constructor() {
    this.luminite = 100;
    this.quillInk = 10;
    this.archivalParchment = 10;
    this.structuralIntegrity = 10;
    this.knowledgeFragments = 0;
    this.targetKnowledge = 50;
    this.turn = 0;
    this.actions = ['Catalog Text', 'Reinforce Structure', 'Expedition', 'Research Preservation', 'Rest & Conserve'];
  }

  start() {
    console.log('Welcome to Subterranean Scribe!');
    this.nextTurn();
  }

  nextTurn() {
    this.turn++;
    console.log(`\n--- Turn ${this.turn} ---`);
    this.displayStatus();
    this.promptAction();
  }

  displayStatus() {
    console.log(`Luminite: ${this.luminite}`);
    console.log(`Quill Ink: ${this.quillInk}`);
    console.log(`Archival Parchment: ${this.archivalParchment}`);
    console.log(`Structural Integrity: ${this.structuralIntegrity}`);
    console.log(`Knowledge Fragments: ${this.knowledgeFragments}/${this.targetKnowledge}`);
  }

  promptAction() {
    console.log('\nChoose an action:');
    this.actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`);
    });
    rl.question('Enter the number of your action: ', (answer) => {
      const actionIndex = parseInt(answer) - 1;
      if (actionIndex >= 0 && actionIndex < this.actions.length) {
        this.performAction(actionIndex);
      } else {
        console.log('Invalid action. Try again.');
        this.promptAction();
      }
    });
  }

  performAction(actionIndex) {
    switch (actionIndex) {
      case 0: // Catalog Text
        this.catalogText();
        break;
      case 1: // Reinforce Structure
        this.reinforceStructure();
        break;
      case 2: // Expedition
        this.expedition();
        break;
      case 3: // Research Preservation
        this.researchPreservation();
        break;
      case 4: // Rest & Conserve
        this.restAndConserve();
        break;
    }
    this.endTurn();
  }

  catalogText() {
    if (this.quillInk > 0 && this.archivalParchment > 0) {
      const success = Math.random() < 0.7; // 70% success rate
      if (success) {
        this.knowledgeFragments += 5;
        console.log('Successfully cataloged a text!');
      } else {
        console.log('Cataloging failed.');
      }
      this.quillInk--;
      this.archivalParchment--;
    } else {
      console.log('Not enough resources to catalog a text.');
    }
  }

  reinforceStructure() {
    if (this.luminite >= 10) {
      this.structuralIntegrity += 2;
      this.luminite -= 10;
      console.log('Structure reinforced.');
    } else {
      console.log('Not enough Luminite to reinforce structure.');
    }
  }

  expedition() {
    const success = Math.random() < 0.5; // 50% success rate
    if (success) {
      this.quillInk += 2;
      this.archivalParchment += 2;
      console.log('Expedition successful! Found resources.');
    } else {
      this.luminite -= 5;
      this.structuralIntegrity -= 1;
      console.log('Expedition failed. Lost some resources.');
    }
  }

  researchPreservation() {
    if (this.luminite >= 15) {
      this.luminite -= 15;
      console.log('Research conducted. Cataloging success rates improved for next turn.');
    } else {
      console.log('Not enough Luminite for research.');
    }
  }

  restAndConserve() {
    this.structuralIntegrity += 1;
    console.log('Resting and conserving resources.');
  }

  endTurn() {
    this.randomEvent();
    this.checkGameStatus();
    this.nextTurn();
  }

  randomEvent() {
    const event = Math.random();
    if (event < 0.2) {
      this.structuralIntegrity -= 1;
      console.log('Minor Tremor: Structural Integrity decreased.');
    } else if (event < 0.4) {
      this.luminite -= 5;
      console.log('Luminite Leak: Lost some Luminite.');
    } else if (event < 0.6) {
      this.quillInk += 1;
      this.archivalParchment += 1;
      console.log('Rarity Discovery: Found extra resources!');
    } else if (event < 0.8) {
      this.structuralIntegrity -= 3;
      console.log('Cave-in: Significant structural damage!');
    }
  }

  checkGameStatus() {
    if (this.structuralIntegrity <= 0) {
      console.log('Game Over: The archive has collapsed.');
      rl.close();
    } else if (this.knowledgeFragments >= this.targetKnowledge) {
      console.log('Congratulations! You have successfully preserved the knowledge!');
      rl.close();
    }
  }
}

const game = new Game();
game.start();