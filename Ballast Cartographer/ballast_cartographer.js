const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

class GameState {
  constructor() {
    this.depth = 0;
    this.oxygen = 100;
    this.power = 100;
    this.hull = 100;
    this.ballast = 50;
    this.sectorsDiscovered = new Set();
    this.targetSectors = 15;
    this.maxDepthReached = 0;
    this.turn = 0;
    this.eventLog = [];
    this.mappedDepthRanges = new Set();
    this.gameOver = false;
    this.gameWon = false;
    this.gameAborted = false;
  }

  addEvent(message) {
    this.eventLog.push(message);
    if (this.eventLog.length > 3) {
      this.eventLog.shift();
    }
  }

  getDepthRange() {
    if (this.depth < 1000) return '0-1000';
    if (this.depth < 2000) return '1000-2000';
    if (this.depth < 3000) return '2000-3000';
    if (this.depth < 4000) return '3000-4000';
    if (this.depth < 6000) return '4000-6000';
    if (this.depth < 8000) return '6000-8000';
    if (this.depth < 10000) return '8000-10000';
    return '10000-11000';
  }
}

function generateSectorName() {
  const prefixes = ['Abyssal', 'Hadal', 'Benthos', 'Bathic', 'Aphotic', 'Midnight', 'Abyss', 'Deep', 'Trench', 'Rift', 'Canyon', 'Gorge', 'Chasm'];
  const types = ['Ridge', 'Cavern', 'Corridor', 'Plateau', 'Basin', 'Knoll', 'Escarpment', 'Trough', 'Seamount', 'Fracture', 'Zone', 'Plain'];
  const suffixes = ['Alpha', 'Beta', 'Sigma', 'Omega', 'Delta', 'Theta', 'Gamma', 'Epsilon', 'Zeta', 'Iota', 'Kappa', 'Lambda'];
  const numbers = Math.floor(Math.random() * 100) + 1;

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${type} ${suffix}-${numbers}`;
}

function generateEvent(state) {
  const eventChance = Math.random();
  if (eventChance > 0.30) return null;

  const events = [
    { name: 'Thermal Vent Discovery', execute: (state) => {
      const gain = Math.floor(Math.random() * 20) + 20;
      const risk = Math.floor(Math.random() * 10) + 5;
      state.addEvent(`[!] Thermal vent discovered! Power +${gain}, but hull risk ${risk}%`);
      if (Math.random() < 0.5) {
        state.power = Math.min(100, state.power + gain);
      } else {
        state.hull -= risk;
      }
    }},
    { name: 'Bioluminescent Swarm', execute: (state) => {
      state.addEvent(`[!] Bioluminescent swarm encountered! Next mapping attempt 50% success rate.`);
    }},
    { name: 'Pressure Anomaly', execute: (state) => {
      const damage = Math.floor(Math.random() * 10) + 5;
      state.hull -= damage;
      state.addEvent(`[!] Pressure anomaly! Hull damaged by ${damage}%.`);
    }},
    { name: 'Abandoned Equipment', execute: (state) => {
      const gain = Math.floor(Math.random() * 10) + 10;
      state.oxygen = Math.min(100, state.oxygen + gain);
      state.addEvent(`[!] Found abandoned equipment cache. O2 +${gain}.`);
    }},
    { name: 'Aggressive Fauna', execute: (state) => {
      state.addEvent(`[!] Aggressive deep-sea creature detected! Choose to evade (costs power) or risk hull damage.`);
    }},
    { name: 'Sonar Echo', execute: (state) => {
      state.addEvent(`[!] Sonar echo detected! A mappable sector nearby.`);
    }}
  ];

  return events[Math.floor(Math.random() * events.length)];
}

function getOxygenConsumption(state) {
  let baseCost = 3;
  if (state.depth > 6000) baseCost = 5;
  else if (state.depth > 3000) baseCost = 4;
  return baseCost;
}

function displayStatus(state) {
  console.clear();
  console.log('═'.repeat(51));
  console.log(`   BALLAST CARTOGRAPHER - Depth: ${state.depth}m`);
  console.log('═'.repeat(51));
  
  const o2Bar = createBar(state.oxygen, 100);
  const powerBar = createBar(state.power, 100);
  const hullBar = createBar(state.hull, 100);
  
  console.log(` O2:    [${o2Bar}] ${state.oxygen}/100`);
  console.log(` POWER: [${powerBar}] ${state.power}/100`);
  console.log(` HULL:  [${hullBar}] ${state.hull.toFixed(1)}%`);
  const ballastStatus = state.ballast > 60 ? 'Sinking' : state.ballast < 40 ? 'Rising' : 'Neutral Buoyancy';
  console.log(` BALLAST: ${state.ballast}% (${ballastStatus})`);
  console.log('─'.repeat(51));
  console.log(` SECTORS MAPPED: ${state.sectorsDiscovered.size}/${state.targetSectors}`);
  console.log('─'.repeat(51));
  
  if (state.eventLog.length > 0) {
    state.eventLog.forEach(event => console.log(` ${event}`));
  } else {
    console.log(` [*] Ready for exploration`);
  }
  console.log('─'.repeat(51));
}

function createBar(current, max, length = 11) {
  const filled = Math.round((current / max) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function displayActions(state) {
  console.log(' ACTIONS:');
  const o2Cost = getOxygenConsumption(state);
  console.log(`  [1] DIVE DEEPER     (-8 Power, -${o2Cost} O2)`);
  console.log(`  [2] EXPLORE         (-10 Power, -${o2Cost} O2)`);
  console.log(`  [3] ASCEND          (-5 Power, -${o2Cost} O2)`);
  console.log(`  [4] REPAIR HULL     (-15 Power, -5 O2)`);
  console.log(`  [5] VENT RECHARGE   (Risk: Hull damage)`);
  console.log(`  [6] EMERGENCY SURFACE (Mission Failure)`);
  console.log('─'.repeat(51));
}

async function processAction(choice, state) {
  const o2Cost = getOxygenConsumption(state);

  switch (choice) {
    case '1':
      if (state.power < 8) {
        state.addEvent('[!] Insufficient power to dive.');
        return;
      }
      if (state.oxygen < o2Cost) {
        state.addEvent('[!] Insufficient oxygen.');
        return;
      }
      state.power -= 8;
      state.oxygen -= o2Cost;
      state.depth = Math.min(11000, state.depth + 1500);
      state.ballast = Math.min(100, state.ballast + 15);
      state.maxDepthReached = Math.max(state.maxDepthReached, state.depth);
      if (state.depth > 6000 && Math.random() < 0.3) {
        const damage = Math.floor(Math.random() * 8) + 3;
        state.hull -= damage;
        state.addEvent(`[!] Pressure stress! Hull -${damage}%.`);
      }
      state.addEvent('[*] Diving deeper...');
      break;

    case '2':
      if (state.power < 10) {
        state.addEvent('[!] Insufficient power to explore.');
        return;
      }
      if (state.oxygen < o2Cost) {
        state.addEvent('[!] Insufficient oxygen.');
        return;
      }
      state.power -= 10;
      state.oxygen -= o2Cost;
      const depthRange = state.getDepthRange();
      const successChance = state.mappedDepthRanges.has(depthRange) ? 0.4 : 0.7;
      if (Math.random() < successChance) {
        const sectorName = generateSectorName();
        state.sectorsDiscovered.add(sectorName);
        state.mappedDepthRanges.add(depthRange);
        state.addEvent(`[+] Sector discovered: ${sectorName}`);
      } else {
        state.addEvent('[−] Sonar returned no mappable features.');
      }
      break;

    case '3':
      if (state.power < 5) {
        state.addEvent('[!] Insufficient power to ascend.');
        return;
      }
      if (state.oxygen < o2Cost) {
        state.addEvent('[!] Insufficient oxygen.');
        return;
      }
      state.power -= 5;
      state.oxygen -= o2Cost;
      const ascentDistance = Math.min(state.depth, 2000);
      state.depth -= ascentDistance;
      state.ballast = Math.max(0, state.ballast - 20);
      state.addEvent('[*] Ascending...');
      break;

    case '4':
      if (state.power < 15) {
        state.addEvent('[!] Insufficient power to repair.');
        return;
      }
      if (state.oxygen < 5) {
        state.addEvent('[!] Insufficient oxygen.');
        return;
      }
      state.power -= 15;
      state.oxygen -= 5;
      const repair = Math.min(25, 100 - state.hull);
      state.hull += repair;
      state.addEvent(`[+] Hull repaired by ${repair}%.`);
      break;

    case '5':
      if (state.power >= 100) {
        state.addEvent('[!] Power cells already at full capacity.');
        return;
      }
      const gain = Math.floor(Math.random() * 30) + 20;
      const risk = Math.floor(Math.random() * 15) + 10;
      state.power = Math.min(100, state.power + gain);
      state.hull -= risk;
      state.addEvent(`[+] Recharged from thermal vent! Power +${gain}, Hull -${risk}%.`);
      break;

    case '6':
      state.gameAborted = true;
      state.gameOver = true;
      state.addEvent('[!] Emergency surface initiated. Mission aborted.');
      break;

    default:
      state.addEvent('[!] Invalid action.');
      return;
  }

  state.turn++;
  checkWinLoss(state);
}

function checkWinLoss(state) {
  if (state.oxygen <= 0) {
    state.gameOver = true;
    state.addEvent('[X] Oxygen depleted! You lose.');
  }
  if (state.hull <= 0) {
    state.gameOver = true;
    state.addEvent('[X] Hull integrity critical! Implosion!');
  }
  if (state.sectorsDiscovered.size >= state.targetSectors && state.depth === 0) {
    state.gameWon = true;
    state.gameOver = true;
    state.addEvent('[★] Mission complete! Safe return to surface!');
  }
}

function displayEndScreen(state) {
  console.clear();
  console.log('═'.repeat(51));
  if (state.gameWon) {
    console.log('   ★ MISSION COMPLETE ★');
  } else if (state.gameAborted) {
    console.log('   ⚠ MISSION ABORTED ⚠');
  } else {
    console.log('   ✗ MISSION FAILED ✗');
  }
  console.log('═'.repeat(51));
  console.log('');
  console.log(`Total Turns: ${state.turn}`);
  console.log(`Max Depth Reached: ${state.maxDepthReached}m`);
  console.log(`Sectors Mapped: ${state.sectorsDiscovered.size}/${state.targetSectors}`);
  console.log(`Final O2: ${state.oxygen}/100`);
  console.log(`Final Power: ${state.power}/100`);
  console.log(`Final Hull: ${state.hull.toFixed(1)}%`);
  console.log('');
  if (state.sectorsDiscovered.size > 0) {
    console.log('Discovered Sectors:');
    let count = 0;
    for (const sector of state.sectorsDiscovered) {
      console.log(`  - ${sector}`);
      count++;
      if (count >= 10) {
        console.log(`  ... and ${state.sectorsDiscovered.size - 10} more`);
        break;
      }
    }
  }
  console.log('');
  console.log('═'.repeat(51));
}

async function main() {
  const state = new GameState();
  
  console.clear();
  console.log('═'.repeat(51));
  console.log('   BALLAST CARTOGRAPHER');
  console.log('   Deep-Sea Submersible Survey Mission');
  console.log('═'.repeat(51));
  console.log('');
  console.log('You pilot an experimental deep-sea submersible tasked');
  console.log('with mapping uncharted oceanic trenches. Manage oxygen,');
  console.log('power, and hull integrity while discovering new sectors.');
  console.log('');
  console.log('OBJECTIVE: Map 15 unique sectors and return to surface!');
  console.log('');
  console.log('═'.repeat(51));
  await question('Press Enter to begin...');

  while (!state.gameOver) {
    displayStatus(state);
    displayActions(state);
    
    const choice = await question('> Enter choice (1-6): ');
    
    if (!['1', '2', '3', '4', '5', '6'].includes(choice)) {
      state.addEvent('[!] Invalid input. Choose 1-6.');
      continue;
    }

    await processAction(choice, state);
    
    if (!state.gameOver) {
      const event = generateEvent(state);
      if (event) {
        event.execute(state);
      }
      checkWinLoss(state);
    }

    if (!state.gameOver) {
      await question('\nPress Enter to continue...');
    }
  }

  displayEndScreen(state);
  rl.close();
}

main().catch(console.error);