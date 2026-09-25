/**
 * Dendrochronology Bureau: Ring Sequence Operator
 * A terminal simulation game for Node.js.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

const gameState = {
  shift: 1,
  maxShifts: 25,
  activeRing: 1,
  totalRingsNeeded: 5,
  integrity: 100,
  pressure: 50,
  viscosity: 175,
  power: 80,
  
  // Current ring data profile
  currentScan: {
    scanned: false,
    moisture: 0,
    carbon14: 0,
    sulfur: 0,
    optimalPresMin: 35,
    optimalPresMax: 65,
    optimalViscMin: 120,
    optimalViscMax: 220
  },
  
  logs: [
    'SYSTEM INITIALIZED: Dendrochronological Rig v4.8 online.',
    'OBJECTIVE: Sequence 5 planetary core rings within 25 shifts.',
    'CAUTION: Keep Resin Pressure strictly between 15% and 85%.'
  ],
  gameOver: false,
  victory: false
};

function addLog(msg) {
  gameState.logs.push(`[Shift ${gameState.shift}] ${msg}`);
  if (gameState.logs.length > 6) {
    gameState.logs.shift();
  }
}

function generateRingSpecs(ringNumber) {
  const pCenter = 40 + Math.floor(Math.random() * 21); // 40-60
  const vCenter = 140 + Math.floor(Math.random() * 61); // 140-200
  
  gameState.currentScan = {
    scanned: false,
    moisture: Math.floor(10 + Math.random() * 80),
    carbon14: Math.floor(100 + Math.random() * 900),
    sulfur: Math.floor(5 + Math.random() * 45),
    optimalPresMin: Math.max(20, pCenter - 15),
    optimalPresMax: Math.min(80, pCenter + 15),
    optimalViscMin: Math.max(70, vCenter - 40),
    optimalViscMax: Math.min(280, vCenter + 40)
  };
}

function drawBar(value, max, length = 20, color = C.green) {
  const pct = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * length);
  const empty = length - filled;
  return `${color}[${'█'.repeat(filled)}${'-'.repeat(empty)}] ${Math.round(value)}${C.reset}`;
}

function renderDashboard() {
  console.clear();
  console.log(`${C.cyan}${C.bold}========================================================================${C.reset}`);
  console.log(`${C.magenta}${C.bold}  DENDROCHRONOLOGY BUREAU // PLANETARY CORE SEQUENCER RIG-7  ${C.reset}`);
  console.log(`${C.cyan}========================================================================${C.reset}`);
  
  const shiftColor = gameState.shift > 20 ? C.red : (gameState.shift > 15 ? C.yellow : C.green);
  console.log(` Shift: ${shiftColor}${gameState.shift}/${gameState.maxShifts}${C.reset}  |  Sequenced Cores: ${C.green}${C.bold}${gameState.activeRing - 1}/${gameState.totalRingsNeeded}${C.reset}  |  Active Target: ${C.bold}Ring #${gameState.activeRing}${C.reset}`);
  console.log(`${C.cyan}------------------------------------------------------------------------${C.reset}`);
  
  // Integrity & Power
  const integCol = gameState.integrity < 30 ? C.red : (gameState.integrity < 60 ? C.yellow : C.green);
  console.log(` Structural Integrity : ${drawBar(gameState.integrity, 100, 16, integCol)}%`);
  console.log(` Power Grid Reserve    : ${drawBar(gameState.power, 100, 16, C.blue)} kW`);
  
  // Pressure
  let pCol = C.green;
  if (gameState.pressure < 25 || gameState.pressure > 75) pCol = C.red;
  else if (gameState.pressure < 35 || gameState.pressure > 65) pCol = C.yellow;
  console.log(` Resin Pressure        : ${drawBar(gameState.pressure, 100, 16, pCol)}% ${gameState.pressure < 15 || gameState.pressure > 85 ? C.bgRed + ' CRITICAL DANGER ' + C.reset : ''}`);
  
  // Viscosity
  let vCol = C.green;
  if (gameState.viscosity < 80 || gameState.viscosity > 260) vCol = C.red;
  else if (gameState.viscosity < 110 || gameState.viscosity > 220) vCol = C.yellow;
  console.log(` Sap Viscosity         : ${drawBar(gameState.viscosity, 300, 16, vCol)} cP`);
  
  console.log(`${C.cyan}------------------------------------------------------------------------${C.reset}`);
  console.log(`${C.bold}ACTIVE RING DIAGNOSTICS:${C.reset}`);
  if (gameState.currentScan.scanned) {
    console.log(` ${C.green}●${C.reset} Moisture: ${gameState.currentScan.moisture}%  |  C-14 Ratio: ${gameState.currentScan.carbon14} ppm  |  Sulfur: ${gameState.currentScan.sulfur}%`);
    console.log(` ${C.yellow}●${C.reset} Target Tolerances -> Pressure: [${gameState.currentScan.optimalPresMin}% - ${gameState.currentScan.optimalPresMax}%] | Viscosity: [${gameState.currentScan.optimalViscMin} - ${gameState.currentScan.optimalViscMax} cP]`);
  } else {
    console.log(` ${C.dim}[UNSCANNED] Micro-drill scan required to reveal molecular lock parameters.${C.reset}`);
  }

  console.log(`${C.cyan}------------------------------------------------------------------------${C.reset}`);
  console.log(`${C.bold}BUREAU TELEMETRY LOGS:${C.reset}`);
  gameState.logs.forEach(log => console.log(` ${C.dim}>${C.reset} ${log}`));
  console.log(`${C.cyan}========================================================================${C.reset}`);
}

function triggerRandomHazard() {
  const roll = Math.random();
  if (roll < 0.20) {
    const spike = Math.floor(8 + Math.random() * 12);
    gameState.pressure += spike;
    addLog(`${C.red}HAZARD: Pyroclastic Tectonic Surge detected! Pressure +${spike}%${C.reset}`);
  } else if (roll < 0.40) {
    const freeze = Math.floor(20 + Math.random() * 30);
    gameState.viscosity += freeze;
    addLog(`${C.blue}HAZARD: Sub-crustal Cryo-flux! Sap Viscosity +${freeze} cP${C.reset}`);
  } else if (roll < 0.55) {
    const dmg = Math.floor(6 + Math.random() * 10);
    gameState.integrity -= dmg;
    addLog(`${C.magenta}HAZARD: Resonant Void Fissure! Integrity -${dmg}%${C.reset}`);
  } else if (roll < 0.70) {
    const drop = Math.floor(8 + Math.random() * 12);
    gameState.pressure -= drop;
    addLog(`${C.yellow}HAZARD: Micro-pore Outgassing! Pressure -${drop}%${C.reset}`);
  }
}

function checkState() {
  // Clamp ranges
  gameState.viscosity = Math.max(40, Math.min(320, gameState.viscosity));
  gameState.power = Math.max(0, Math.min(100, gameState.power));
  
  // Pressure catastrophic checks
  if (gameState.pressure <= 0 || gameState.pressure >= 100) {
    gameState.gameOver = true;
    gameState.victory = false;
    addLog(`${C.bgRed}CATASTROPHIC FAILURE: Core ruptured due to extreme pressure blowout!${C.reset}`);
    return;
  }
  
  // Out of safe bounds pressure damages integrity
  if (gameState.pressure < 15 || gameState.pressure > 85) {
    const penalty = 15;
    gameState.integrity -= penalty;
    addLog(`${C.red}WARNING: Pressure out of safe envelope (15-85%)! Integrity -${penalty}%${C.reset}`);
  }
  
  if (gameState.integrity <= 0) {
    gameState.integrity = 0;
    gameState.gameOver = true;
    gameState.victory = false;
    addLog(`${C.bgRed}STRUCTURAL COLLAPSE: Petrified core shattered into dust.${C.reset}`);
    return;
  }
  
  if (gameState.activeRing > gameState.totalRingsNeeded) {
    gameState.gameOver = true;
    gameState.victory = true;
    return;
  }
  
  if (gameState.shift >= gameState.maxShifts && !gameState.victory) {
    gameState.gameOver = true;
    gameState.victory = false;
    addLog(`${C.red}OPERATIONAL TIMEOUT: Bureau allocated shifts exhausted.${C.reset}`);
  }
}

function endTurn(actionShiftCost = 1) {
  // Passive power regeneration from geothermal tap
  gameState.power = Math.min(100, gameState.power + 8);
  
  triggerRandomHazard();
  gameState.shift += actionShiftCost;
  checkState();
}

function promptAction() {
  renderDashboard();
  
  if (gameState.gameOver) {
    if (gameState.victory) {
      console.log(`\n${C.green}${C.bold}★★★ MISSION ACCOMPLISHED ★★★${C.reset}`);
      console.log(`${C.green}All 5 Core Rings successfully locked and sequenced.${C.reset}`);
      console.log(`${C.cyan}Prehistoric planetary climate matrix reconstituted for the Bureau archive.${C.reset}\n`);
    } else {
      console.log(`\n${C.red}${C.bold}☠☠☠ MISSION FAILED ☠☠☠${C.reset}`);
      console.log(`${C.red}The specimen was lost or operation window lapsed.${C.reset}\n`);
    }
    rl.question('Press Enter to exit...', () => {
      rl.close();
      process.exit(0);
    });
    return;
  }
  
  console.log(`\n${C.bold}AVAILABLE ACTIONS:${C.reset}`);
  console.log(` [1] Micro-Drill Scan       (-15 kW Power, consumes sap fluidity)`);
  console.log(` [2] Chemical Buffer Inject  (Increase or decrease Resin Pressure)`);
  console.log(` [3] Thermal Modulation      (Heat or cool Sap to modify Viscosity)`);
  console.log(` [4] Sequence Lock Ring      (Attempt lock; requires matching tolerances)`);
  console.log(` [5] Vent Geothermal Tap     (+45 kW Power, +1 Shift, -5% Integrity)`);
  console.log(` [Q] Abort Mission`);
  
  rl.question(`\nOperator Command > `, (input) => {
    const cmd = input.trim().toUpperCase();
    
    switch(cmd) {
      case '1':
        if (gameState.power < 15) {
          addLog(`${C.red}ERROR: Insufficient power for Micro-Drill scan (needs 15 kW).${C.reset}`);
        } else {
          gameState.power -= 15;
          gameState.viscosity += 15;
          gameState.currentScan.scanned = true;
          addLog(`${C.green}Micro-Drill Scan complete. Molecular tolerances identified.${C.reset}`);
          endTurn();
        }
        promptAction();
        break;
        
      case '2':
        rl.question(`Inject [P]ressurizer (+15%) or [D]e-pressurizer (-15%)? `, (sub) => {
          const s = sub.trim().toUpperCase();
          if (gameState.power < 10) {
            addLog(`${C.red}ERROR: Chemical injectors require 10 kW.${C.reset}`);
          } else if (s === 'P') {
            gameState.power -= 10;
            gameState.pressure += 15;
            addLog(`Buffer injected: Pressure increased by +15%.`);
            endTurn();
          } else if (s === 'D') {
            gameState.power -= 10;
            gameState.pressure -= 15;
            addLog(`Buffer injected: Pressure decreased by -15%.`);
            endTurn();
          } else {
            addLog(`${C.yellow}Buffer injection canceled: Invalid input.${C.reset}`);
          }
          promptAction();
        });
        break;
        
      case '3':
        rl.question(`Thermal Coil: [H]eat sap (-40 cP) or [C]ool sap (+40 cP)? `, (sub) => {
          const s = sub.trim().toUpperCase();
          if (gameState.power < 10) {
            addLog(`${C.red}ERROR: Thermal coils require 10 kW.${C.reset}`);
          } else if (s === 'H') {
            gameState.power -= 10;
            gameState.viscosity -= 40;
            addLog(`Thermal modulation: Coils heated sap (-40 cP).`);
            endTurn();
          } else if (s === 'C') {
            gameState.power -= 10;
            gameState.viscosity += 40;
            addLog(`Thermal modulation: Cryo-coolers thickened sap (+40 cP).`);
            endTurn();
          } else {
            addLog(`${C.yellow}Thermal modulation canceled: Invalid input.${C.reset}`);
          }
          promptAction();
        });
        break;
        
      case '4':
        if (!gameState.currentScan.scanned) {
          addLog(`${C.yellow}CANNOT LOCK: Ring molecular parameters have not been scanned yet!${C.reset}`);
          promptAction();
          return;
        }
        if (gameState.power < 20) {
          addLog(`${C.red}ERROR: Sequence locking requires 20 kW.${C.reset}`);
          promptAction();
          return;
        }
        
        gameState.power -= 20;
        const pOk = gameState.pressure >= gameState.currentScan.optimalPresMin && gameState.pressure <= gameState.currentScan.optimalPresMax;
        const vOk = gameState.viscosity >= gameState.currentScan.optimalViscMin && gameState.viscosity <= gameState.currentScan.optimalViscMax;
        
        if (pOk && vOk) {
          addLog(`${C.green}${C.bold}SUCCESS: Ring #${gameState.activeRing} permanently stabilized and locked!${C.reset}`);
          gameState.activeRing++;
          if (gameState.activeRing <= gameState.totalRingsNeeded) {
            generateRingSpecs(gameState.activeRing);
            addLog(`Transitioning sensors to Ring #${gameState.activeRing}...`);
          }
          endTurn();
        } else {
          const dmg = 15;
          gameState.integrity -= dmg;
          let reason = [];
          if (!pOk) reason.push(`Pressure ${gameState.pressure}% outside [${gameState.currentScan.optimalPresMin}-${gameState.currentScan.optimalPresMax}%]`);
          if (!vOk) reason.push(`Viscosity ${gameState.viscosity} outside [${gameState.currentScan.optimalViscMin}-${gameState.currentScan.optimalViscMax}]`);
          addLog(`${C.red}LOCK FAILED: Resonance harmonic fracture! Integrity -${dmg}%. (${reason.join(', ')})${C.reset}`);
          endTurn();
        }
        promptAction();
        break;
        
      case '5':
        gameState.power = Math.min(100, gameState.power + 45);
        gameState.integrity -= 5;
        addLog(`${C.blue}Geothermal tap vented: +45 kW restored, Structural integrity -5%.${C.reset}`);
        endTurn(1);
        promptAction();
        break;
        
      case 'Q':
        console.log(`\n${C.yellow}Mission aborted by Operator.${C.reset}`);
        rl.close();
        process.exit(0);
        break;
        
      default:
        addLog(`${C.yellow}Unrecognized command. Input 1-5 or Q.${C.reset}`);
        promptAction();
        break;
    }
  });
}

// Start game
generateRingSpecs(1);
promptAction();
