#!/usr/bin/env node
const readline = require('readline');

// Game Constants
const TARGET_CHRONO_CRYSTALS = 100;
const INITIAL_COLONY_STABILITY = 100;
const INITIAL_EQUIPMENT_LEVEL = 1;
const MAX_FRACTURES = 3;

// Fracture base parameters
const FRACTURE_BASE_STABILITY = 50;
const FRACTURE_BASE_RESOURCES = 30;

// Upgrade parameters
const EQUIPMENT_UPGRADE_COST = 20;
const STABILITY_COST_PER_MINE_BASE = 5;
const STABILIZATION_EFFECTIVENESS_BASE = 15; // How much stability a stabilization action restores to a fracture

class Fracture {
  constructor(id) {
    this.id = id;
    this.stability = FRACTURE_BASE_STABILITY; // Stability meter
    this.resources = FRACTURE_BASE_RESOURCES;
    this.stabilizedLastTurn = false; // whether stabilized last turn for regeneration
  }

  regenerate() {
    if (this.stabilizedLastTurn) {
      // Regenerate some resources
      let regenAmount = Math.floor(this.resources * 0.25) + 5;
      this.resources += regenAmount;
      // Also minor stability regain
      this.stability = Math.min(100, this.stability + 5);
    }
    this.stabilizedLastTurn = false;
  }

  mine(equipmentLevel) {
    // Mining yield depends on equipment level and available resources
    if (this.resources <= 0) return { yield: 0, stabilityCost: 0 };

    // Yield is random within a range influenced by equipment and resources
    let maxPotentialYield = 5 + equipmentLevel * 5;
    let actualYield = Math.min(this.resources, Math.floor(Math.random() * maxPotentialYield) + 1);

    // Stability cost scales with yield and base constant
    let stabilityCost = STABILITY_COST_PER_MINE_BASE + actualYield;

    // Reduce resources and stability
    this.resources -= actualYield;
    this.stability -= stabilityCost;

    return { yield: actualYield, stabilityCost };
  }

  stabilize(equipmentLevel) {
    // Stabilization reduces risk by restoring stability
    let stabilizeAmount = STABILIZATION_EFFECTIVENESS_BASE + equipmentLevel * 5;
    this.stability = Math.min(100, this.stability + stabilizeAmount);
    this.stabilizedLastTurn = true;

    return stabilizeAmount;
  }

  isCollapsed() {
    return this.stability <= 0;
  }
}

class Game {
  constructor() {
    this.turn = 1;
    this.colonyStability = INITIAL_COLONY_STABILITY;
    this.totalChronoCrystals = 0;
    this.equipmentLevel = INITIAL_EQUIPMENT_LEVEL;
    this.fractures = [];
    for (let i = 1; i <= MAX_FRACTURES; i++) {
      this.fractures.push(new Fracture(i));
    }
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  printIntro() {
    console.log(`\n--- Welcome to Chrono Miner ---\n`);
    console.log("You are the chief miner of a futuristic colony mining unstable time fractures.");
    console.log(`Your goal: Collect at least ${TARGET_CHRONO_CRYSTALS} Chrono Crystals before the colony collapses.`);
    console.log(`Managing fractures is critical; mining actions affect their stability and resource regeneration.
`);
  }

  printStatus() {
    console.log(`\n--- Turn ${this.turn} Status ---`);
    console.log(`Total Chrono Crystals: ${this.totalChronoCrystals}`);
    console.log(`Colony Stability: ${this.colonyStability.toFixed(2)}`);
    console.log(`Equipment Level: ${this.equipmentLevel}`);
    console.log(`Time Fractures:`);
    this.fractures.forEach(f => {
      console.log(`  [${f.id}] Stability: ${f.stability.toFixed(2)} | Resources: ${f.resources}`);
    });
  }

  printInstructions() {
    console.log(`\nChoose an action for this turn:\n`);
    this.fractures.forEach(f => {
      console.log(`Mine fracture ${f.id}:  mine ${f.id}`);
      console.log(`Stabilize fracture ${f.id}:  stabilize ${f.id}`);
    });
    console.log(`Upgrade mining equipment (cost: ${EQUIPMENT_UPGRADE_COST} Chrono Crystals): upgrade`);
    console.log(`Quit game: quit`);
  }

  async promptChoice() {
    return new Promise(resolve => {
      this.rl.question(`\nYour command: `, answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  validateMineOrStabilizeCommand(command) {
    const parts = command.split(' ');
    if (parts.length !== 2) return null;
    const action = parts[0];
    const fractureId = parseInt(parts[1], 10);
    if (!['mine', 'stabilize'].includes(action)) return null;
    if (isNaN(fractureId) || fractureId < 1 || fractureId > MAX_FRACTURES) return null;
    return { action, fractureId };
  }

  async processTurn() {
    // Regenerate resources and stabilize fractures if stabilized last turn
    this.fractures.forEach(f => f.regenerate());

    this.printStatus();
    this.printInstructions();

    let summary = '';
    let command = await this.promptChoice();

    // Process command
    if (command === 'quit') {
      console.log('\nQuitting game... Thanks for playing.');
      this.rl.close();
      process.exit(0);
    }

    if (command === 'upgrade') {
      if (this.totalChronoCrystals >= EQUIPMENT_UPGRADE_COST) {
        this.totalChronoCrystals -= EQUIPMENT_UPGRADE_COST;
        this.equipmentLevel++;
        summary += `Upgraded equipment to level ${this.equipmentLevel}. Spent ${EQUIPMENT_UPGRADE_COST} Chrono Crystals.\n`;
      } else {
        summary += `Not enough Chrono Crystals to upgrade. You need ${EQUIPMENT_UPGRADE_COST} but have ${this.totalChronoCrystals}.\n`;
      }
      return summary;
    }

    // Mine or Stabilize Command?
    const parsedCmd = this.validateMineOrStabilizeCommand(command);
    if (!parsedCmd) {
      summary += 'Invalid command. Please choose a valid action.\n';
      return summary;
    }

    const fracture = this.fractures.find(f => f.id === parsedCmd.fractureId);
    if (!fracture) {
      summary += 'Fracture not found.\n';
      return summary;
    }

    if (parsedCmd.action === 'mine') {
      // Mining action
      const { yield: mined, stabilityCost } = fracture.mine(this.equipmentLevel);
      if (mined === 0) {
        summary += `Fracture ${fracture.id} has no resources left to mine.\n`;
      } else {
        this.totalChronoCrystals += mined;
        this.colonyStability -= stabilityCost * 0.5; // Partial stability impact on colony
        summary += `Mined ${mined} Chrono Crystals from fracture ${fracture.id} at cost of ${stabilityCost} fracture stability (colony stability -${(stabilityCost * 0.5).toFixed(2)}).\n`;
      }
    } else if (parsedCmd.action === 'stabilize') {
      // Stabilize action
      const stabilizedAmount = fracture.stabilize(this.equipmentLevel);
      this.colonyStability += stabilizedAmount * 0.3; // Some colony stability gained
      this.totalChronoCrystals -= 2; // Cost: stabilizing uses some resources (representing time/energy cost)
      summary += `Stabilized fracture ${fracture.id}: +${stabilizedAmount} fracture stability, +${(stabilizedAmount * 0.3).toFixed(2)} colony stability, -2 Chrono Crystals cost.\n`;
      if (this.totalChronoCrystals < 0) this.totalChronoCrystals = 0; // no negative crystals
    }

    return summary;
  }

  checkEndConditions() {
    if (this.totalChronoCrystals >= TARGET_CHRONO_CRYSTALS) {
      console.log(`\n*** Congratulations! You have collected ${this.totalChronoCrystals} Chrono Crystals and saved the colony. You win! ***\n`);
      this.rl.close();
      return true;
    }

    if (this.colonyStability <= 0) {
      console.log(`\n*** Colony stability has collapsed to zero. Catastrophic failure! You lose. ***\n`);
      this.rl.close();
      return true;
    }

    // Check if any fracture collapsed - reduce colony stability accordingly
    let collapsedFractures = this.fractures.filter(f => f.isCollapsed());
    if (collapsedFractures.length > 0) {
      const collapsePenalty = collapsedFractures.length * 20;
      this.colonyStability -= collapsePenalty;
      console.log(`\n*** Warning! ${collapsedFractures.length} fracture(s) collapsed causing -${collapsePenalty} colony stability. ***`);
      // Remove collapsed fractures from play
      this.fractures = this.fractures.filter(f => !f.isCollapsed());
      if (this.fractures.length === 0) {
        console.log(`\n*** All fractures collapsed. The colony cannot continue mining. Game over. ***\n`);
        this.rl.close();
        return true;
      }
    }

    return false;
  }

  async gameLoop() {
    this.printIntro();
    while (true) {
      let summary = await this.processTurn();
      console.log('\nTurn Summary:');
      console.log(summary);

      if (this.checkEndConditions()) {
        break;
      }

      this.turn++;
    }
  }

  start() {
    this.gameLoop();
  }
}

// Start the game
const game = new Game();
game.start();
