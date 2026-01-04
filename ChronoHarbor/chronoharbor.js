const readline = require('readline');

// ChronoHarbor - A text-based harbor management game
// Author: ChatGPT

// --- Game constants ---
const MAX_DAYS = 30;
const WIN_WEALTH = 10000;
const INITIAL_FACILITY_HEALTH = 100;
const MAX_FACILITY_HEALTH = 100;

// Resource types
const RESOURCE_TYPES = ['Chrono Crystals', 'Steampunk Components', 'Temporal Herbs'];

// Ship types with typical cargo
const SHIP_TYPES = [
  { name: 'Temporal Trader', cargo: ['Chrono Crystals', 'Temporal Herbs'], baseProfit: 500 },
  { name: 'Steampunk Freighter', cargo: ['Steampunk Components'], baseProfit: 700 },
  { name: 'Mystic Sailor', cargo: ['Temporal Herbs'], baseProfit: 400 },
  { name: 'Chrono Explorer', cargo: ['Chrono Crystals', 'Steampunk Components'], baseProfit: 900 },
];

// Number of docking slots per day
const MAX_DOCK_SLOTS = 3;

// Costs and consumption
const REPAIR_COST = 300; // gold coins needed to repair 20 health
const REPAIR_AMOUNT = 20;

const UPGRADE_COST = 1000; // gold to upgrade docks (improves throughput)

const MAX_DOCKS = 5;

// Readline setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helpers
function promptAsync(question) {
  return new Promise(resolve => rl.question(question, ans => resolve(ans)));
}

function chance(percent) {
  return Math.random() < percent / 100;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Ship class
class Ship {
  constructor(id) {
    this.id = id;
    this.type = randomChoice(SHIP_TYPES);
    this.arrivalTimeSlot = null; // will be assigned by player
    this.waiting = true;
  }

  summary() {
    return `${this.type.name} carrying ${this.type.cargo.join(', ')}`;
  }

  profit() {
    // Profit is base profit plus bonus for docks upgraded
    return this.type.baseProfit;
  }
}

// Game state class
class Game {
  constructor() {
    this.day = 1;
    this.wealth = 1000; // starting gold
    this.facilityHealth = INITIAL_FACILITY_HEALTH;
    this.resources = {
      'Chrono Crystals': 10,
      'Steampunk Components': 10,
      'Temporal Herbs': 10
    };
    this.docks = 3; // start with 3 docks
    this.ships = [];
    this.log = [];
    this.shipCounter = 1;
    this.isOver = false;
    this.reason = '';
  }

  addLog(message) {
    this.log.push(message);
    if (this.log.length > 10) this.log.shift();
  }

  statusReport() {
    const resourceStatus = Object.entries(this.resources)
      .map(([key,val]) => `${key}: ${val}`)
      .join(' | ');

    return (
      `\n=== Day ${this.day} / ${MAX_DAYS} ===\n` +
      `Wealth: ${this.wealth} gold | Facility Health: ${this.facilityHealth} / ${MAX_FACILITY_HEALTH} | Docks: ${this.docks} |\n` +
      `Resources -> ${resourceStatus}\n` +
      `Docking Slots Available: ${this.docks}\n` +
      `Pending Ships: ${this.ships.length}\n` +
      `Recent Log: ${this.log.slice(-3).join(' | ')}\n`
    );
  }

  generateShips() {
    // Each day generate 1-3 ships randomly
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      this.ships.push(new Ship(this.shipCounter++));
    }
    this.addLog(`${count} new ship${count > 1 ? 's' : ''} arrived.`);
  }

  async handleScheduling() {
    // Show ships and ask player to assign docking slots
    if (this.ships.length === 0) {
      this.addLog('No ships requiring docking today.');
      return;
    }

    this.addLog('Scheduling ships into docks.');

    const availableSlots = this.docks;
    let slotsLeft = availableSlots;
    
    // We let player assign ships to slots until all slots are used or no ships left
    for (let i = 0; i < this.ships.length; i++) {
      const ship = this.ships[i];
      if (slotsLeft <= 0) {
        ship.arrivalTimeSlot = null;
        ship.waiting = true;
        continue;
      }

      let answer = await promptAsync(`Assign docking slot to Ship #${ship.id} (${ship.summary()})? (y/n): `);
      answer = answer.trim().toLowerCase();

      if (answer === 'y' || answer === 'yes') {
        ship.arrivalTimeSlot = this.day; // docks today
        ship.waiting = false;
        slotsLeft--;
        this.addLog(`Ship #${ship.id} assigned to dock.`);
      } else {
        ship.arrivalTimeSlot = null;
        ship.waiting = true;
        this.addLog(`Ship #${ship.id} waits for docking.`);
      }
    }
  }

  processDocking() {
    // Process all ships scheduled today
    const dockingShips = this.ships.filter(s => s.arrivalTimeSlot === this.day);
    if (dockingShips.length === 0) {
      this.addLog('No ships docked today.');
      return;
    }

    dockingShips.forEach(ship => {
      // Add profit
      this.wealth += ship.profit();

      // Add cargo resources to inventory
      ship.type.cargo.forEach(resource => {
        // Each ship delivers random amount of their cargo (5-10)
        let amount = 5 + Math.floor(Math.random() * 6);
        this.resources[resource] += amount;
        this.addLog(`Ship #${ship.id} unloaded ${amount} units of ${resource}.`);
      });
    });

    // Remove docked ships from waiting list
    this.ships = this.ships.filter(s => s.arrivalTimeSlot !== this.day);
  }

  applyEvent() {
    // Random event each day
    const eventRoll = Math.random();

    if (eventRoll < 0.15) {
      // Time Storm
      this.addLog('A Time Storm hits the harbor! Facilities take damage.');
      this.facilityHealth -= 15 + Math.floor(Math.random() * 15);
      if (this.facilityHealth < 0) this.facilityHealth = 0;
    } else if (eventRoll < 0.30) {
      // Pirate Raid
      if (this.wealth > 0) {
        const loss = Math.min(this.wealth, 500 + Math.floor(Math.random() * 500));
        this.wealth -= loss;
        this.addLog(`Pirate raid steals ${loss} gold!`);
      } else {
        this.addLog('Pirate raid attempted but no gold to steal.');
      }
    } else if (eventRoll < 0.45) {
      // Trade Negotiation
      // Chance to trade resources for gold
      const resource = randomChoice(RESOURCE_TYPES);
      const available = this.resources[resource];
      if (available >= 5) {
        // Offer trade
        this.addLog(`Trade negotiation: Sell 5 units of ${resource} for 1000 gold?`);
        return { type: 'trade', resource };
      } else {
        this.addLog('Trade negotiation but insufficient resources.');
      }
    }
    // No actionable event
    return { type: 'none' };
  }

  async handleEventAction(event) {
    if (event.type === 'trade') {
      const answer = await promptAsync(`Trade 5 units of ${event.resource} for 1000 gold? (y/n): `);
      if (answer.trim().toLowerCase().startsWith('y')) {
        this.resources[event.resource] -= 5;
        this.wealth += 1000;
        this.addLog(`Trade executed: Sold 5 units of ${event.resource} for 1000 gold.`);
      } else {
        this.addLog('Trade declined.');
      }
    }
  }

  async maintenancePhase() {
    console.log('\nMaintenance Phase:');
    console.log('Facility health can be repaired or docks upgraded.');
    console.log(`You have ${this.wealth} gold.`);

    // Ask about repair
    if (this.facilityHealth < MAX_FACILITY_HEALTH) {
      const maxPossibleRepairs = Math.floor(this.wealth / REPAIR_COST);
      if (maxPossibleRepairs > 0) {
        const ans = await promptAsync(`Repair facilities? Each costs ${REPAIR_COST} gold and restores ${REPAIR_AMOUNT} health. How many to repair? (0-${maxPossibleRepairs}): `);
        let repairCount = parseInt(ans);
        if (isNaN(repairCount) || repairCount < 0) repairCount = 0;
        if (repairCount > maxPossibleRepairs) repairCount = maxPossibleRepairs;

        if (repairCount > 0) {
          this.wealth -= repairCount * REPAIR_COST;
          this.facilityHealth += repairCount * REPAIR_AMOUNT;
          if (this.facilityHealth > MAX_FACILITY_HEALTH) this.facilityHealth = MAX_FACILITY_HEALTH;
          this.addLog(`Repaired facility by ${repairCount * REPAIR_AMOUNT} health.`);
        }
      }
    }

    // Ask about upgrade
    if (this.docks < MAX_DOCKS) {
      const maxUpgrades = Math.floor(this.wealth / UPGRADE_COST);
      if (maxUpgrades > 0) {
        const ans = await promptAsync(`Upgrade docks? Each upgrade costs ${UPGRADE_COST} gold and adds 1 dock. How many to upgrade? (0-${maxUpgrades}): `);
        let upgradeCount = parseInt(ans);
        if (isNaN(upgradeCount) || upgradeCount < 0) upgradeCount = 0;
        if (upgradeCount > maxUpgrades) upgradeCount = maxUpgrades;

        if (upgradeCount > 0) {
          this.wealth -= upgradeCount * UPGRADE_COST;
          this.docks += upgradeCount;
          if (this.docks > MAX_DOCKS) this.docks = MAX_DOCKS;
          this.addLog(`Upgraded docks by ${upgradeCount}. Total docks: ${this.docks}.`);
        }
      }
    }

    // Optionally use resources to boost health
    const canConsumeResources = RESOURCE_TYPES.some(r => this.resources[r] >= 3);
    if (canConsumeResources) {
      const useRes = await promptAsync('Use 3 units of any one resource to boost facility health by 15? (y/n): ');
      if (useRes.trim().toLowerCase().startsWith('y')) {
        // Ask which resource
        let chosen = null;
        while (true) {
          const resChoice = await promptAsync(`Which resource to use (${RESOURCE_TYPES.join(', ')}): `);
          const trimmedChoice = resChoice.trim();
          if (RESOURCE_TYPES.includes(trimmedChoice)) {
            if (this.resources[trimmedChoice] >= 3) {
              chosen = trimmedChoice;
              break;
            } else {
              console.log('Not enough units of that resource.');
            }
          } else {
            console.log('Invalid resource name.');
          }
        }

        this.resources[chosen] -= 3;
        this.facilityHealth += 15;
        if (this.facilityHealth > MAX_FACILITY_HEALTH) this.facilityHealth = MAX_FACILITY_HEALTH;
        this.addLog(`Facility health boosted by consuming 3 units of ${chosen}.`);
      }
    }
  }

  checkLossConditions() {
    if (this.facilityHealth <= 0) {
      this.isOver = true;
      this.reason = 'Facility health dropped to zero. Harbor has fallen into disrepair.';
    }

    const essentialResourcesSum = RESOURCE_TYPES.reduce((sum, r) => sum + this.resources[r], 0);
    if (essentialResourcesSum <= 0 && this.wealth < 200) {
      this.isOver = true;
      this.reason = 'No essential resources and low wealth to continue operations.';
    }
  }

  checkWinCondition() {
    if (this.wealth >= WIN_WEALTH && this.day >= MAX_DAYS) {
      this.isOver = true;
      this.reason = `Congratulations! You've accumulated ${this.wealth} gold coins and managed ChronoHarbor for ${MAX_DAYS} days.`;
    }
  }
}

async function main() {
  console.clear();
  console.log('Welcome to ChronoHarbor!');
  console.log('You are the harbor master of a mysterious port where ships from different timelines dock.');
  console.log(`Manage ships, resources, and your facilities well to earn at least ${WIN_WEALTH} gold coins in ${MAX_DAYS} days.`);
  console.log('Commands and prompts will guide you through each day. Good luck!\n');

  const game = new Game();

  while (!game.isOver) {
    console.log(game.statusReport());

    // New ships arrive
    game.generateShips();

    // Scheduling phase
    await game.handleScheduling();

    // Docking phase
    game.processDocking();

    // Random event
    const event = game.applyEvent();
    if (event.type === 'trade') {
      await game.handleEventAction(event);
    }

    // Maintenance and upgrades
    await game.maintenancePhase();

    // Check loss and win conditions
    game.checkLossConditions();
    game.checkWinCondition();

    if (!game.isOver) {
      game.day++;
      if (game.day > MAX_DAYS) {
        // Game ends
        game.isOver = true;
        game.reason = `Season ended. You managed ${game.day - 1} days.`;
      }
    }

    console.log('\n------------------------------------------\n');
  }

  // Game over message
  console.log('\n===== GAME OVER =====');
  console.log(game.reason);
  console.log(`Final Wealth: ${game.wealth} gold`);
  console.log(`Facility Health: ${game.facilityHealth} / ${MAX_FACILITY_HEALTH}`);
  console.log(`Docks: ${game.docks}`);
  console.log(`Resources: ${RESOURCE_TYPES.map(r => `${r}: ${game.resources[r]}`).join(' | ')}`);
  console.log('Thanks for playing ChronoHarbor!');
  rl.close();
}

main();
