/**
 * Tidal Archivist: Lunar Manuscript Recovery
 * A single-file Node.js terminal game using native readline.
 * No external dependencies required!
 * Run with: node tidal_archivist.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const STATE = {
  turn: 1,
  maxTurns: 12,
  stationIntegrity: 100,
  oxygen: 100,
  fragments: 0,
  maxFragments: 50,
  vaultsHeld: 0,
  manuscriptsRecovered: 0,
  targetManuscripts: 5,
  isGameOver: false,
  won: false,
  causeOfDeath: ''
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTidalState(turn) {
  // Turn 1 = LOW TIDE, Turn 2 = HIGH TIDE, alternating
  return turn % 2 === 1 ? 'LOW TIDE' : 'HIGH TIDE';
}

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function printSeparator(char = '=', len = 60) {
  console.log(char.repeat(len));
}

function displayHeader() {
  printSeparator('=');
  console.log('   🌙 TIDAL ARCHIVIST: LUNAR MANUSCRIPT RECOVERY 🌊');
  console.log('       Submersible Station \'Mnemosyne\' Logbook');
  printSeparator('=');
}

function displayStatus() {
  const tide = getTidalState(STATE.turn);
  const tideColor = tide === 'LOW TIDE' ? '\x1b[32m[LOW TIDE - SAFE EXPLORATION]\x1b[0m' : '\x1b[31m[HIGH TIDE - CRUSHING PRESSURE]\x1b[0m';

  console.log(` Cycle: ${STATE.turn}/${STATE.maxTurns}  |  Tidal Phase: ${tideColor}`);
  printSeparator('-');
  console.log(` Station Integrity: [${'#'.repeat(Math.ceil(STATE.stationIntegrity / 5))}${' '.repeat(20 - Math.ceil(STATE.stationIntegrity / 5))}] ${STATE.stationIntegrity}%`);
  console.log(` Oxygen Reserve    : [${'o'.repeat(Math.ceil(STATE.oxygen / 5))}${' '.repeat(20 - Math.ceil(STATE.oxygen / 5))}] ${STATE.oxygen}%`);
  console.log(` Research Fragments: ${STATE.fragments}/${STATE.maxFragments}`);
  console.log(` Sealed Vaults Held: ${STATE.vaultsHeld}`);
  console.log(` Manuscripts Decoded: ${STATE.manuscriptsRecovered}/${STATE.targetManuscripts} (Target: 5)`);
  printSeparator('-');
}

async function handleExplore() {
  console.log('\n[ACTION] Launching abyssal probe through decompression airlock...');
  STATE.oxygen = clamp(STATE.oxygen - 8, 0, 100);
  
  const roll = Math.random();
  if (roll < 0.60) {
    STATE.vaultsHeld += 1;
    console.log('>> SUCCESS: The probe sonar locked onto a sealed precursor vault half-buried in methane silt!');
    console.log('>> Secured 1 Precursor Vault.');
  } else {
    const frags = randomRange(3, 7);
    const gained = Math.min(frags, STATE.maxFragments - STATE.fragments);
    STATE.fragments = clamp(STATE.fragments + frags, 0, STATE.maxFragments);
    console.log(`>> SONAR SCAN: Recovered ancient telemetry and research data (${gained} fragments).`);
    if (STATE.fragments >= STATE.maxFragments) {
      console.log('>> [NOTICE] Data storage banks at maximum fragment capacity (50).');
    }
  }
}

async function handleRepair() {
  console.log('\n[ACTION] Deploying exterior hull welding drones...');
  STATE.oxygen = clamp(STATE.oxygen - 3, 0, 100);
  const repairAmount = randomRange(15, 25);
  STATE.stationIntegrity = clamp(STATE.stationIntegrity + repairAmount, 0, 100);
  console.log(`>> Hull reinforced! Restored +${repairAmount}% Station Integrity.`);
}

async function handleGenerateOxygen() {
  console.log('\n[ACTION] Overclocking electrochemical scrubber & electrolysis cells...');
  const dmg = 10;
  const restored = randomRange(20, 30);
  STATE.stationIntegrity = clamp(STATE.stationIntegrity - dmg, 0, 100);
  STATE.oxygen = clamp(STATE.oxygen + restored, 0, 100);
  console.log(`>> Oxygen replenished by +${restored}%. Power surge inflicted ${dmg}% damage on station systems.`);
}

async function handleDecrypt() {
  console.log('\n[ACTION] Feeding 10 fragments into quantum decryption lattice...');
  STATE.fragments -= 10;
  const roll = Math.random();
  if (roll < 0.80) {
    STATE.vaultsHeld -= 1;
    STATE.manuscriptsRecovered += 1;
    console.log('>> DECRYPTION COMPLETE! Ancient manuscript decrypted and cataloged.');
    console.log(`>> Total recovered manuscripts: ${STATE.manuscriptsRecovered}/${STATE.targetManuscripts}`);
  } else {
    console.log('>> ERROR: Cryptographic cipher corrupted. 10 fragments consumed, vault remains sealed.');
  }
}

async function handleWait() {
  console.log('\n[ACTION] Idling core systems and conserving station resources...');
}

function processTidalEffects() {
  const tide = getTidalState(STATE.turn);
  console.log('\n--- [END OF CYCLE TELEMETRY] ---');
  
  // Base environmental drain
  let baseIntegrityLoss = (tide === 'HIGH TIDE') ? 5 : 2;
  let baseOxygenLoss = 2;
  
  STATE.stationIntegrity = clamp(STATE.stationIntegrity - baseIntegrityLoss, 0, 100);
  STATE.oxygen = clamp(STATE.oxygen - baseOxygenLoss, 0, 100);
  console.log(`>> Baseline degradation: -${baseIntegrityLoss}% Integrity, -${baseOxygenLoss}% Oxygen.`);

  // Special Tidal Events
  if (tide === 'HIGH TIDE') {
    if (Math.random() < 0.30) {
      const surgeDmg = randomRange(10, 20);
      STATE.stationIntegrity = clamp(STATE.stationIntegrity - surgeDmg, 0, 100);
      console.log(`>> ⚠️ WARNING: Massive Gravitational Pressure Surge! Hull suffered +${surgeDmg}% structural damage!`);
    }
  } else {
    if (Math.random() < 0.20) {
      STATE.oxygen = clamp(STATE.oxygen + 5, 0, 100);
      console.log('>> 🌟 EVENT: Optimal ambient currents allowed natural venting. +5% Oxygen recovered.');
    }
  }
}

function checkGameOver() {
  if (STATE.stationIntegrity <= 0) {
    STATE.isGameOver = true;
    STATE.won = false;
    STATE.causeOfDeath = 'Station structural failure under abyssal water pressure.';
    return true;
  }
  if (STATE.oxygen <= 0) {
    STATE.isGameOver = true;
    STATE.won = false;
    STATE.causeOfDeath = 'Life support asphyxiation due to total oxygen depletion.';
    return true;
  }
  if (STATE.manuscriptsRecovered >= STATE.targetManuscripts) {
    STATE.isGameOver = true;
    STATE.won = true;
    return true;
  }
  if (STATE.turn >= STATE.maxTurns) {
    STATE.isGameOver = true;
    STATE.won = false;
    STATE.causeOfDeath = 'Cycle limit reached. The gas giant eclipse commenced before enough manuscripts were found.';
    return true;
  }
  return false;
}

async function gameLoop() {
  while (!STATE.isGameOver) {
    clearScreen();
    displayHeader();
    displayStatus();

    const tide = getTidalState(STATE.turn);
    console.log('\nAvailable Commands for this Cycle:');
    if (tide === 'LOW TIDE') {
      console.log('  1) [EXPLORE]           Search seabed for vaults & fragments (-8 O2)');
    } else {
      console.log('  1) [EXPLORE DISABLED]  High tide pressure prevents airlock operation');
    }
    console.log('  2) [REPAIR STATION]    Reinforce hull +15-25% (-3 O2)');
    console.log('  3) [GENERATE OXYGEN]   Electrolyze seawater +20-30% O2 (-10 Integrity)');
    
    const canDecrypt = STATE.vaultsHeld > 0 && STATE.fragments >= 10;
    if (canDecrypt) {
      console.log('  4) [DECRYPT]           Attempt deciphering sealed vault (-10 fragments, 80% success)');
    } else {
      console.log(`  4) [DECRYPT LOCKED]    Requires 1 Vault and >= 10 Fragments (Have: ${STATE.vaultsHeld} vaults, ${STATE.fragments} frags)`);
    }
    console.log('  5) [WAIT]              Idle station systems (Conserves actions)');
    console.log('  Q) [QUIT]              Abandon Expedition');
    printSeparator('-');

    const choice = (await askQuestion('\nSelect your order (1-5 / Q): ')).trim().toUpperCase();

    let validAction = false;

    if (choice === '1') {
      if (tide === 'LOW TIDE') {
        await handleExplore();
        validAction = true;
      } else {
        console.log('\n[!] Airlock locked! Cannot explore during High Tide pressure maximum.');
      }
    } else if (choice === '2') {
      await handleRepair();
      validAction = true;
    } else if (choice === '3') {
      await handleGenerateOxygen();
      validAction = true;
    } else if (choice === '4') {
      if (canDecrypt) {
        await handleDecrypt();
        validAction = true;
      } else {
        console.log('\n[!] Cannot decrypt: Insufficient vaults or research fragments.');
      }
    } else if (choice === '5') {
      await handleWait();
      validAction = true;
    } else if (choice === 'Q') {
      console.log('\nMission aborted by Archivist.');
      rl.close();
      return;
    } else {
      console.log('\n[!] Invalid command. Choose a valid action number.');
    }

    if (validAction) {
      processTidalEffects();
      if (checkGameOver()) {
        break;
      }
      STATE.turn += 1;
      console.log('\nPress ENTER to advance to the next tidal cycle...');
      await askQuestion('');
    } else {
      console.log('Press ENTER to retry action...');
      await askQuestion('');
    }
  }

  // Game End Screen
  clearScreen();
  printSeparator('=');
  if (STATE.won) {
    console.log(' 🎉 MISSION SUCCESSFUL: ARCHIVES PRESERVED! 🎉');
    printSeparator('=');
    console.log(`You successfully recovered and decrypted all ${STATE.targetManuscripts} ancient manuscripts!`);
    console.log('The secrets of the precursor lunar civilization have been rescued from the abyss.');
  } else {
    console.log(' 💀 MISSION FAILED: EXPEDITION LOST IN THE ABYSS 💀');
    printSeparator('=');
    console.log(`Cause: ${STATE.causeOfDeath}`);
    console.log(`Manuscripts recovered: ${STATE.manuscriptsRecovered}/${STATE.targetManuscripts}`);
  }

  const finalScore = (STATE.manuscriptsRecovered * 100) + STATE.stationIntegrity + STATE.oxygen;
  printSeparator('-');
  console.log(' FINAL PERFORMANCE EVALUATION:');
  console.log(` - Manuscripts Recovered : ${STATE.manuscriptsRecovered} x 100 = ${STATE.manuscriptsRecovered * 100}`);
  console.log(` - Remaining Integrity   : +${STATE.stationIntegrity}`);
  console.log(` - Remaining Oxygen      : +${STATE.oxygen}`);
  console.log(` TOTAL ARCHIVE SCORE     : ${finalScore} PTS`);
  printSeparator('=');
  rl.close();
}

gameLoop();
