/**
 * Glacier Scribe: Permafrost Core Recovery
 * A terminal survival and data-recovery game written for Node.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// Game State
const state = {
  cycle: 1,
  fuel: 100,
  warmth: 100,
  drillIntegrity: 100,
  spareParts: 5,
  glacierIntegrity: 100,
  rawCores: 0,
  decodedArchives: 0,
  transmittedArchives: 0,
  ambientTemp: -20.0, // Celsius
  depthLevel: 1,
  blizzardTurns: 0,
  auroraActive: false,
  gameOver: false,
  gameWon: false,
  logs: []
};

const WIN_REQUIREMENT = 12;
const SYMBOLS = ['[O2]', '[CO2]', '[CH4]', '[ASH]', '[DUST]', '[POLLEN]'];

function log(msg) {
  state.logs.push(msg);
  if (state.logs.length > 5) {
    state.logs.shift();
  }
}

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function renderDashboard() {
  clearScreen();
  const tempStr = `${state.ambientTemp.toFixed(1)}°C`;
  const blizzardStatus = state.blizzardTurns > 0 ? ` [BLIZZARD: ${state.blizzardTurns} cyc]` : '';
  const auroraStatus = state.auroraActive ? ' [AURORA FLUX ACTIVE]' : '';

  console.log('======================================================================');
  console.log('             GLACIER SCRIBE: PERMAFROST CORE RECOVERY                 ');
  console.log('======================================================================');
  console.log(` Cycle: ${String(state.cycle).padEnd(4)} | Ambient Temp: ${tempStr.padEnd(8)} | Current Depth Tier: Level ${state.depthLevel}${blizzardStatus}${auroraStatus}`);
  console.log('----------------------------------------------------------------------');
  console.log(` [1] Fuel:              ${renderBar(state.fuel, 100)} ${Math.round(state.fuel)}/100`);
  console.log(` [2] Crew Warmth:       ${renderBar(state.warmth, 100)} ${Math.round(state.warmth)}/100`);
  console.log(` [3] Drill Integrity:   ${renderBar(state.drillIntegrity, 100)} ${Math.round(state.drillIntegrity)}/100`);
  console.log(` [4] Glacier Integrity: ${renderBar(state.glacierIntegrity, 100)} ${Math.round(state.glacierIntegrity)}/100`);
  console.log('----------------------------------------------------------------------');
  console.log(` Spare Parts: ${state.spareParts}  |  Raw Cores: ${state.rawCores}  |  Decoded: ${state.decodedArchives}  |  Transmitted: ${state.transmittedArchives}/${WIN_REQUIREMENT}`);
  console.log('======================================================================');
  console.log(' RECENT TELEMETRY & LOGS:');
  if (state.logs.length === 0) {
    console.log('  > All systems operational. Expedition standby.');
  } else {
    state.logs.forEach(l => console.log(`  > ${l}`));
  }
  console.log('======================================================================');
  console.log(' ACTIONS:');
  console.log(' [1] Drill Core           [2] Decode Raw Core      [3] Transmit Archives');
  console.log(' [4] Repair Drill         [5] Stoke Life-Heater    [6] Scavenge Outpost');
  console.log(' [7] Wait / Stabilize     [H] Field Manual / Help  [Q] Abort Mission');
  console.log('----------------------------------------------------------------------');
}

function renderBar(value, max) {
  const barLength = 16;
  const clamped = Math.max(0, Math.min(max, value));
  const filled = Math.round((clamped / max) * barLength);
  const empty = barLength - filled;
  return '[' + '#'.repeat(filled) + '-'.repeat(empty) + ']';
}

// Primary Actions
async function actionDrill() {
  const fuelCost = 10 + (state.depthLevel * 5);
  if (state.fuel < fuelCost) {
    log(`Insufficient Fuel! Need ${fuelCost} fuel to reach Depth Tier ${state.depthLevel}.`);
    return false;
  }

  state.fuel -= fuelCost;
  const wear = 12 + Math.floor(Math.random() * 8) + (state.depthLevel * 2);
  state.drillIntegrity = Math.max(0, state.drillIntegrity - wear);

  const successRoll = Math.random() * 100;
  const threshold = Math.max(25, state.drillIntegrity);

  if (successRoll <= threshold) {
    state.rawCores += 1;
    log(`Drill reached Tier ${state.depthLevel} stratum (-${fuelCost} Fuel, -${wear}% Drill). Recovered 1 Raw Core!`);
    // Progress deeper every 2 successful drills
    if (state.depthLevel < 3 && Math.random() > 0.45) {
      state.depthLevel++;
      log(`Thermal scanner identifies a deeper untouched strata (Depth Tier ${state.depthLevel} unlocked).`);
    }
  } else {
    log(`Structural fracture! Core shattered during extraction (-${fuelCost} Fuel, -${wear}% Drill).`);
  }
  return true;
}

async function actionDecode() {
  if (state.rawCores <= 0) {
    log('No Raw Cores available to decode. Drill samples first.');
    return false;
  }

  clearScreen();
  console.log('======================================================================');
  console.log('               SPECTROMETRIC CORE DECODING TERMINAL                   ');
  console.log('======================================================================');
  
  // Generate a random sequence of 4 distinct atmospheric markers
  const pool = [...SYMBOLS].sort(() => Math.random() - 0.5);
  const targetSeq = pool.slice(0, 4);
  const scrambled = [...targetSeq].sort(() => Math.random() - 0.5);

  console.log(' Recovering atmospheric strata layers.');
  console.log(' Target chronological order hint:');
  console.log(`   [OLD] ${targetSeq[0]}  ->  ${targetSeq[1]}  ->  ${targetSeq[2]}  ->  ${targetSeq[3]} [RECENT]`);
  console.log('\n Scrambled input channels:');
  scrambled.forEach((sym, idx) => {
    console.log(`   [${idx + 1}] ${sym}`);
  });

  if (state.auroraActive) {
    console.log('\n * AURORA BONUS: High atmospheric ionization auto-calibrates layer #1!');
  }

  console.log('\nEnter the 4 numbers (e.g. "1234" or "1 2 3 4") matching the hint order:');
  const answer = await prompt('> ');
  const cleaned = answer.replace(/[^1-4]/g, '').split('').map(n => parseInt(n, 10) - 1);

  let isMatch = false;
  if (cleaned.length === 4) {
    const reconstructed = cleaned.map(idx => scrambled[idx]);
    isMatch = reconstructed.every((val, i) => val === targetSeq[i]);
  }

  state.rawCores -= 1;

  if (isMatch || (state.auroraActive && Math.random() < 0.35)) {
    state.decodedArchives += 1;
    log('Spectrometric decoding SUCCESSFUL. 1 Climate Archive generated.');
  } else {
    // Partial corruption chance
    if (Math.random() < 0.4) {
      state.decodedArchives += 1;
      log('Spectrometry misaligned! Reconstructed a degraded Archive.');
    } else {
      log('Decoding sequence failed! Core sample vaporized by laser misalignment.');
    }
  }
  state.auroraActive = false;
  return true;
}

async function actionTransmit() {
  if (state.decodedArchives <= 0) {
    log('No Decoded Archives in local buffer to transmit.');
    return false;
  }

  const fuelCost = 8;
  if (state.fuel < fuelCost) {
    log(`Orbital transmitter requires at least ${fuelCost} Fuel to power satellite uplink.`);
    return false;
  }

  state.fuel -= fuelCost;
  
  // Reliability drops if ambient temperature is too warm or during blizzard
  let reliability = 90 - Math.max(0, (state.ambientTemp + 10) * 2);
  if (state.blizzardTurns > 0) reliability -= 25;

  const roll = Math.random() * 100;
  if (roll <= reliability) {
    const amount = state.decodedArchives;
    state.transmittedArchives += amount;
    state.decodedArchives = 0;
    log(`UPLINK SUCCESS: Transmitted ${amount} archive(s) to orbital relay! (-${fuelCost} Fuel)`);
  } else {
    log(`Atmospheric interference disrupted transmission. Uplink lost, archives retained. (-${fuelCost} Fuel)`);
  }
  return true;
}

async function actionRepair() {
  if (state.spareParts <= 0) {
    log('No Spare Parts left to conduct drill repairs.');
    return false;
  }
  if (state.drillIntegrity >= 100) {
    log('Drill integrity is already at maximum (100%).');
    return false;
  }

  state.spareParts -= 1;
  const restored = 30 + Math.floor(Math.random() * 15);
  state.drillIntegrity = Math.min(100, state.drillIntegrity + restored);
  log(`Maintenance complete: Used 1 Spare Part to restore +${restored}% Drill Integrity.`);
  return true;
}

async function actionStokeHeater() {
  if (state.fuel < 15) {
    log('Need at least 15 Fuel to stoke the life-support thermal grid.');
    return false;
  }
  if (state.warmth >= 100) {
    log('Crew Warmth is already at maximum (100%).');
    return false;
  }

  state.fuel -= 15;
  const warmthGain = 35 + Math.floor(Math.random() * 10);
  state.warmth = Math.min(100, state.warmth + warmthGain);
  log(`Thermal grid stoked: Burned 15 Fuel to restore +${warmthGain}% Crew Warmth.`);
  return true;
}

async function actionScavenge() {
  const roll = Math.random();
  if (roll < 0.35) {
    const foundFuel = 15 + Math.floor(Math.random() * 20);
    state.fuel = Math.min(100, state.fuel + foundFuel);
    log(`Scavenged an abandoned supply crate: Found +${foundFuel} Fuel!`);
  } else if (roll < 0.65) {
    state.spareParts += 2;
    log('Scavenged a ruined equipment shed: Found +2 Spare Parts!');
  } else if (roll < 0.85) {
    const dmg = 8 + Math.floor(Math.random() * 10);
    state.warmth = Math.max(0, state.warmth - dmg);
    log(`Caught in a sudden thermal frostbite squall while scouting (-${dmg}% Warmth).`);
  } else {
    const gDmg = 10 + Math.floor(Math.random() * 8);
    state.glacierIntegrity = Math.max(0, state.glacierIntegrity - gDmg);
    log(`Crevasse opened during field expedition! Station anchor destabilized (-${gDmg}% Glacier Integrity).`);
  }
  return true;
}

async function actionWait() {
  const warmthBonus = 5;
  state.warmth = Math.min(100, state.warmth + warmthBonus);
  log(`Expedition conserved energy: slight warmth stabilization (+${warmthBonus}%).`);
  return true;
}

function showHelp() {
  clearScreen();
  console.log('======================================================================');
  console.log('                    FIELD SURVIVAL MANUAL & PROTOCOLS                 ');
  console.log('======================================================================');
  console.log(' MISSION: Recover and Transmit 12 Climate Archives before collapse.\n');
  console.log(' CORE COMMANDS:');
  console.log('  [1] Drill Core        : Extracts raw ice samples. Consumes Fuel & Drill Health.');
  console.log('  [2] Decode Core       : Mini-challenge to reconstruct chronological strata.');
  console.log('  [3] Transmit Archives : Uplinks decoded data to orbit. (Requires 8 Fuel).');
  console.log('  [4] Repair Drill      : Consumes 1 Spare Part to mend drill integrity.');
  console.log('  [5] Stoke Heater      : Consumes 15 Fuel to restore life-support warmth.');
  console.log('  [6] Scavenge Outpost  : Search perimeter for Fuel/Parts (risk of hazards).');
  console.log('  [7] Wait / Stabilize  : Rest crew and advance cycle safely.');
  console.log('\n THREAT MECHANICS:');
  console.log('  - Ambient temperature continuously rises due to global climate shift.');
  console.log('  - Higher temperatures accelerate Glacier Integrity decay.');
  console.log('  - Warmth drops every cycle. Zero Warmth or Zero Glacier Integrity = DEFEAT.');
  console.log('======================================================================');
}

// Environmental Updates and Random Events
function updateEnvironment() {
  state.cycle++;

  // Temperature progression
  const tempIncrease = 0.35 + (state.cycle * 0.05) + (state.transmittedArchives * 0.1);
  state.ambientTemp += tempIncrease;

  // Warmth loss calculation
  let warmthLoss = 6 + Math.max(0, Math.floor(Math.abs(state.ambientTemp) / 5));
  if (state.blizzardTurns > 0) {
    warmthLoss += 8;
    state.blizzardTurns--;
    if (state.blizzardTurns === 0) {
      log('The roaring polar blizzard has subsided.');
    }
  }
  state.warmth = Math.max(0, state.warmth - warmthLoss);

  // Glacier Integrity decay
  let glacierDecay = 2 + (state.ambientTemp > -10 ? 3 : 1) + (state.cycle * 0.15);
  state.glacierIntegrity = Math.max(0, state.glacierIntegrity - glacierDecay);

  // Equipment passive wear
  if (Math.random() < 0.25) {
    state.drillIntegrity = Math.max(0, state.drillIntegrity - 5);
  }

  // Trigger random dynamic events
  triggerRandomEvent();
}

function triggerRandomEvent() {
  const roll = Math.random();
  if (roll < 0.15 && state.blizzardTurns === 0) {
    state.blizzardTurns = 2 + Math.floor(Math.random() * 2);
    log('EVENT: A severe Blizzard sweeps across the shelf! Warmth drain increased!');
  } else if (roll < 0.27) {
    const meltHit = 6 + Math.floor(Math.random() * 6);
    state.glacierIntegrity = Math.max(0, state.glacierIntegrity - meltHit);
    log(`EVENT: Sub-surface Meltwater Surge! Sub-ice erosion (-${meltHit}% Glacier Integrity).`);
  } else if (roll < 0.38) {
    state.drillIntegrity = Math.max(0, state.drillIntegrity - 12);
    log('EVENT: Hydro-thermal expansion jammed drill mechanics (-12% Drill Integrity).');
  } else if (roll < 0.48 && !state.auroraActive) {
    state.auroraActive = true;
    log('EVENT: Aurora Borealis ion flux! Spectrometer readings amplified for next decode.');
  }
}

function checkEndConditions() {
  if (state.transmittedArchives >= WIN_REQUIREMENT) {
    state.gameOver = true;
    state.gameWon = true;
    return true;
  }

  if (state.warmth <= 0) {
    state.gameOver = true;
    log('MISSION FAILED: Life-support failed. Expedition crew froze.');
    return true;
  }

  if (state.glacierIntegrity <= 0) {
    state.gameOver = true;
    log('MISSION FAILED: The ice sheet sheared apart. The station collapsed into the sea.');
    return true;
  }

  // Stalemate check: No fuel, no decoded archives to transmit, no spare parts
  if (state.fuel < 10 && state.decodedArchives === 0 && state.rawCores === 0 && state.spareParts === 0) {
    state.gameOver = true;
    log('MISSION FAILED: Depleted fuel and equipment. Stranded with no recourse.');
    return true;
  }

  return false;
}

async function showIntro() {
  clearScreen();
  console.log('======================================================================');
  console.log('             GLACIER SCRIBE: PERMAFROST CORE RECOVERY                 ');
  console.log('======================================================================');
  console.log('\n Welcome, Scribe.');
  console.log(' You are deployed upon the collapsing Wilkes Ice Shelf.');
  console.log(` Global warming is melting millennial permafrost strata.`);
  console.log(` Your duty is to recover ${WIN_REQUIREMENT} deep-ice climate records before the shelf gives way.\n`);
  console.log(' Manage Fuel, Body Warmth, and Drill Hardware.');
  console.log(' Keep the station operational while relaying critical data to orbit.\n');
  await prompt(' Press [ENTER] to initialize station telemetry...');
}

function renderGameOver() {
  clearScreen();
  console.log('======================================================================');
  if (state.gameWon) {
    console.log('                    *** MISSION ACCOMPLISHED ***                      ');
    console.log('======================================================================');
    console.log(' You successfully transmitted 12 Climate Archives to orbital archives!');
    console.log(' Humanity now possesses vital paleoclimatic data to counter the thaw.');
    console.log(`\n Final Mission Statistics:`);
    console.log(`  - Cycles Survived      : ${state.cycle}`);
    console.log(`  - Final Ambient Temp   : ${state.ambientTemp.toFixed(1)}°C`);
    console.log(`  - Glacier Remaining    : ${Math.round(state.glacierIntegrity)}%`);
    console.log(`  - Fuel Reserves Left   : ${Math.round(state.fuel)}`);
  } else {
    console.log('                      *** EXPEDITION LOST ***                         ');
    console.log('======================================================================');
    console.log(' The Wilkes Station has fallen dark.');
    console.log(` Transmitted Archives: ${state.transmittedArchives}/${WIN_REQUIREMENT}`);
    console.log(` Cycles Survived: ${state.cycle}`);
    console.log(` Final Ambient Temp: ${state.ambientTemp.toFixed(1)}°C`);
    console.log(' Cause of Failure: ' + (state.logs[state.logs.length - 1] || 'Unknown'));
  }
  console.log('======================================================================\n');
}

// Main Game Loop
async function main() {
  await showIntro();

  while (!state.gameOver) {
    renderDashboard();
    const choice = (await prompt(' Select action (1-7, H, Q): ')).trim().toLowerCase();

    let actionTaken = false;
    switch (choice) {
      case '1':
        actionTaken = await actionDrill();
        break;
      case '2':
        actionTaken = await actionDecode();
        break;
      case '3':
        actionTaken = await actionTransmit();
        break;
      case '4':
        actionTaken = await actionRepair();
        break;
      case '5':
        actionTaken = await actionStokeHeater();
        break;
      case '6':
        actionTaken = await actionScavenge();
        break;
      case '7':
        actionTaken = await actionWait();
        break;
      case 'h':
        showHelp();
        await prompt('\n Press [ENTER] to return to dashboard...');
        continue;
      case 'q':
        const confirm = (await prompt(' Are you sure you want to abort mission? (y/N): ')).toLowerCase();
        if (confirm === 'y') {
          state.gameOver = true;
          log('Expedition aborted by operator command.');
        }
        continue;
      default:
        log('Invalid protocol command. Enter numbers 1 to 7 or H for manual.');
        continue;
    }

    if (actionTaken) {
      if (!checkEndConditions()) {
        updateEnvironment();
        checkEndConditions();
      }
    }
  }

  renderGameOver();
  rl.close();
}

main().catch((err) => {
  console.error('Fatal Station Error:', err);
  rl.close();
});
