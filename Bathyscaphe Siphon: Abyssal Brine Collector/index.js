const readline = require('readline');

// ANSI Color Codes
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
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m'
};

class NadirBathyscapheGame {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.resetState();
  }

  resetState() {
    this.turn = 1;
    this.depth = 9500; // meters
    this.basePressure = 950; // atm
    this.pressureMod = 0; // transient modifier
    this.hull = 100; // %
    this.brine = 0; // target: 1000
    this.temp = 295; // Kelvin (safe 270K - 450K)
    this.battery = 100; // kWh
    this.cavitation = 0; // %
    this.nitrogen = 12; // canisters
    
    // Status Buffs & Modifiers
    this.ballastPurgeTurns = 0;
    this.sonarBoost = false;
    this.densitySurgeTurns = 0;
    this.microfractureTimer = 0;
    
    this.logs = [
      `${C.cyan}NADIR-IV telemetry initialized at depth 9,500m.${C.reset}`,
      `${C.cyan}Anchored to abyssal brine basin. Target: 1,000 units HSIB.${C.reset}`
    ];
  }

  start() {
    this.renderScreen();
    this.promptUser();
  }

  log(msg) {
    this.logs.push(msg);
    if (this.logs.length > 5) {
      this.logs.shift();
    }
  }

  get effectivePressure() {
    let p = this.basePressure + this.pressureMod;
    if (this.ballastPurgeTurns > 0) {
      p -= 50;
    }
    return Math.max(900, p);
  }

  renderBar(current, max, length = 20, color = C.green, fillChar = '█', emptyChar = '░') {
    const clamped = Math.max(0, Math.min(current, max));
    const filledLen = Math.round((clamped / max) * length);
    const emptyLen = length - filledLen;
    return `${color}${fillChar.repeat(filledLen)}${C.dim}${emptyChar.repeat(emptyLen)}${C.reset}`;
  }

  renderDashboard() {
    const p = this.effectivePressure;
    let hullColor = this.hull > 60 ? C.green : (this.hull > 30 ? C.yellow : C.red);
    let tempColor = (this.temp >= 310 && this.temp <= 360) ? C.green : ((this.temp > 360 && this.temp < 400) ? C.yellow : C.red);
    let cavColor = this.cavitation < 40 ? C.green : (this.cavitation < 75 ? C.yellow : C.red);
    let batColor = this.battery > 40 ? C.cyan : (this.battery > 15 ? C.yellow : C.red);

    console.clear();
    console.log(`${C.bold}${C.bgCyan}${C.white} === NADIR-IV ABYSSAL BRINE COLLECTOR // DEPTH: ${this.depth}m === ${C.reset}`);
    console.log(`${C.dim}Operational Shift: Turn ${this.turn} | Mission Time: +${(this.turn - 1) * 15}m | Target: 1,000 HSIB${C.reset}\n`);

    console.log(`${C.bold}PRIMARY GAUGES:${C.reset}`);
    console.log(`  Hull Integrity:   [${this.renderBar(this.hull, 100, 20, hullColor)}] ${hullColor}${this.hull.toFixed(1)}%${C.reset}`);
    console.log(`  Brine Reservoir:  [${this.renderBar(this.brine, 1000, 20, C.magenta)}] ${C.magenta}${this.brine} / 1000 HSIB${C.reset}`);
    console.log(`  Battery Core:     [${this.renderBar(this.battery, 100, 20, batColor)}] ${batColor}${this.battery.toFixed(1)} kWh${C.reset}`);
    console.log(`  Chamber Temp:     [${this.renderBar(this.temp - 250, 200, 20, tempColor)}] ${tempColor}${this.temp.toFixed(1)} K${C.reset} ${C.dim}(Limit: 450K)${C.reset}`);
    console.log(`  Cavitation Gas:   [${this.renderBar(this.cavitation, 100, 20, cavColor)}] ${cavColor}${this.cavitation.toFixed(1)}%${C.reset} ${C.dim}(Detonation: 100%)${C.reset}`);
    console.log(`  Ambient Pressure: ${C.yellow}${p.toFixed(0)} atm${C.reset} | Ballast Gas: ${C.cyan}${this.nitrogen} N2 canisters${C.reset}`);
    
    // Status Flags
    let flags = [];
    if (this.ballastPurgeTurns > 0) flags.push(`${C.cyan}[BALLAST PURGE ACTIVE: ${this.ballastPurgeTurns}T]${C.reset}`);
    if (this.sonarBoost) flags.push(`${C.green}[SONIC LOCK ACTIVE: +50% YIELD]${C.reset}`);
    if (this.densitySurgeTurns > 0) flags.push(`${C.magenta}[DENSITY SURGE: 2x YIELD]${C.reset}`);
    if (this.microfractureTimer > 0) flags.push(`${C.red}[MICRO-FRACTURE DETECTED: PATCH WITHIN ${this.microfractureTimer}T]${C.reset}`);
    
    if (flags.length > 0) {
      console.log(`  Active Buffs/Hazards: ${flags.join(' ')}`);
    }

    console.log(`\n${C.bold}OPERATIONAL LOGS:${C.reset}`);
    this.logs.forEach(l => console.log(`  > ${l}`));

    console.log(`\n${C.bold}COMMAND MATRIX:${C.reset}`);
    console.log(`  ${C.cyan}[1] SIPHON BRINE${C.reset}       : Run peristaltic suction pumps (+Brine, +25K, +15% Cav, -8 kWh)`);
    console.log(`  ${C.cyan}[2] CRYOGENIC COOL${C.reset}     : Circulate liquid helium through intake heat exchangers (-40K, -12 kWh)`);
    console.log(`  ${C.cyan}[3] VENT CAVITATION${C.reset}    : Flush explosive micro-bubbles into void (Cav to 0%, Hull -3%, -5 kWh)`);
    console.log(`  ${C.cyan}[4] PURGE BALLAST${C.reset}      : Discharge 1 N2 canister (-50 atm pressure relief for 3T)`);
    console.log(`  ${C.cyan}[5] PULSE SONAR${C.reset}        : Map high-yield isotope seams (+50% next siphon, -6 kWh)`);
    console.log(`  ${C.cyan}[6] THERMAL RECHARGE${C.reset}   : Route trench heat to thermoelectric generators (+25 kWh, +35K)`);
    console.log(`  ${C.cyan}[7] HULL PATCH${C.reset}         : Apply hyperbaric sealant paste (+8% Hull, -15 kWh, req Cav < 50%)`);
    if (this.brine >= 1000) {
      console.log(`  ${C.green}${C.bold}[8] SURFACE & ASCEND${C.reset}   : Disengage anchors and begin hyperbaric ascent (VICTORY)`);
    }
    console.log(`  ${C.dim}[Q] ABANDON STATION${C.reset}    : Emergency scuttle / Exit`);
  }

  renderScreen() {
    this.renderDashboard();
  }

  promptUser() {
    this.rl.question(`\n${C.bold}Select Action [1-7${this.brine >= 1000 ? ', 8' : ''}, Q]: ${C.reset}`, (answer) => {
      this.handleInput(answer.trim().toLowerCase());
    });
  }

  handleInput(input) {
    if (input === 'q') {
      console.log(`\n${C.yellow}Mission aborted by operator. Nadir-IV scuttled.${C.reset}`);
      this.rl.close();
      return;
    }

    let actionValid = false;

    switch (input) {
      case '1': // SIPHON
        if (this.battery < 8) {
          this.log(`${C.red}Error: Insufficient battery power (8 kWh required).${C.reset}`);
        } else {
          this.battery -= 8;
          let baseYield = Math.floor(40 + Math.random() * 41); // 40 - 80
          if (this.sonarBoost) {
            baseYield = Math.floor(baseYield * 1.5);
            this.sonarBoost = false;
            this.log(`${C.green}Sonar ping guided pump into isotope seam!${C.reset}`);
          }
          if (this.densitySurgeTurns > 0) {
            baseYield *= 2;
            this.log(`${C.magenta}Dense brine surge yielded double isotope extraction!${C.reset}`);
          }
          this.brine = Math.min(1000, this.brine + baseYield);
          this.temp += 25;
          this.cavitation = Math.min(100, this.cavitation + 15);
          this.log(`${C.green}Siphon complete: +${baseYield} HSIB harvested. Temp +25K, Cavitation +15%.${C.reset}`);
          actionValid = true;
        }
        break;

      case '2': // CRYOGENIC COOL
        if (this.battery < 12) {
          this.log(`${C.red}Error: Insufficient battery power (12 kWh required).${C.reset}`);
        } else {
          this.battery -= 12;
          this.temp = Math.max(270, this.temp - 40);
          this.log(`${C.cyan}Cryogenic cooling cycle executed. Chamber temperature dropped -40K.${C.reset}`);
          actionValid = true;
        }
        break;

      case '3': // VENT CAVITATION
        if (this.battery < 5) {
          this.log(`${C.red}Error: Insufficient battery power (5 kWh required).${C.reset}`);
        } else {
          this.battery -= 5;
          this.cavitation = 0;
          this.hull = Math.max(0, this.hull - 3);
          this.log(`${C.yellow}Venting manifold cleared gas bubbles. Acoustic backwash caused -3% hull stress.${C.reset}`);
          actionValid = true;
        }
        break;

      case '4': // PURGE BALLAST
        if (this.nitrogen <= 0) {
          this.log(`${C.red}Error: Nitrogen canisters depleted.${C.reset}`);
        } else {
          this.nitrogen -= 1;
          this.ballastPurgeTurns = 3;
          this.log(`${C.cyan}Nitrogen purged into buoyancy chambers. Hydrostatic load reduced by 50 atm for 3 turns.${C.reset}`);
          actionValid = true;
        }
        break;

      case '5': // PULSE SONAR
        if (this.battery < 6) {
          this.log(`${C.red}Error: Insufficient battery power (6 kWh required).${C.reset}`);
        } else {
          this.battery -= 6;
          this.sonarBoost = true;
          this.log(`${C.cyan}Acoustic sonar ping active. Next siphon yield boosted by +50%.${C.reset}`);
          if (Math.random() < 0.15) {
            const quakeDamage = 4;
            this.hull = Math.max(0, this.hull - quakeDamage);
            this.log(`${C.red}WARNING: Sonar triggered minor benthic sediment collapse! Hull damaged -${quakeDamage}%.${C.reset}`);
          }
          actionValid = true;
        }
        break;

      case '6': // THERMAL RECHARGE
        if (this.temp >= 380) {
          this.log(`${C.red}Error: Chamber Temp (${this.temp}K) too high for TEG engagement (Must be < 380K).${C.reset}`);
        } else {
          this.battery = Math.min(100, this.battery + 25);
          this.temp += 35;
          this.log(`${C.yellow}Geothermal TEG engaged: Battery restored +25 kWh, chamber heated +35K.${C.reset}`);
          actionValid = true;
        }
        break;

      case '7': // HULL PATCH
        if (this.battery < 15) {
          this.log(`${C.red}Error: Insufficient battery power (15 kWh required).${C.reset}`);
        } else if (this.cavitation > 50) {
          this.log(`${C.red}Error: Excessive manifold vibration (Cavitation > 50%). Sealant cannot cure.${C.reset}`);
        } else {
          this.battery -= 15;
          this.hull = Math.min(100, this.hull + 8);
          this.microfractureTimer = 0;
          this.log(`${C.green}Hull sealant paste applied: Structural integrity restored +8%.${C.reset}`);
          actionValid = true;
        }
        break;

      case '8': // SURFACE & ASCEND
        if (this.brine >= 1000) {
          this.handleVictory();
          return;
        } else {
          this.log(`${C.red}Brine quotas not met (1,000 HSIB needed). Cannot surface.${C.reset}`);
        }
        break;

      default:
        this.log(`${C.red}Invalid command code.${C.reset}`);
        break;
    }

    if (actionValid) {
      this.processTurnEnd();
    } else {
      this.renderScreen();
      this.promptUser();
    }
  }

  processTurnEnd() {
    // Check instant fail conditions before environmental ticks
    if (this.cavitation >= 100) {
      this.handleDefeat('CAVITATION_EXPLOSION');
      return;
    }

    // Decrement timers
    if (this.ballastPurgeTurns > 0) this.ballastPurgeTurns--;
    if (this.densitySurgeTurns > 0) this.densitySurgeTurns--;

    // Handle microfracture penalty
    if (this.microfractureTimer > 0) {
      this.microfractureTimer--;
      if (this.microfractureTimer === 0) {
        this.hull = Math.max(0, this.hull - 8);
        this.log(`${C.red}ALERT: Unpatched micro-fracture buckled under hyperbaric pressure! Hull -8%.${C.reset}`);
      }
    }

    // Hydrostatic strain damage
    const p = this.effectivePressure;
    if (p > 970) {
      const overpressureDmg = Math.round((p - 970) * 0.15 * 10) / 10;
      this.hull = Math.max(0, this.hull - overpressureDmg);
      this.log(`${C.red}CRUSH WARNING: Extreme trench pressure (${p} atm) caused -${overpressureDmg}% hull degradation.${C.reset}`);
    }

    // Thermal damage
    if (this.temp > 410) {
      const heatDmg = Math.round((this.temp - 410) * 0.2 * 10) / 10;
      this.hull = Math.max(0, this.hull - heatDmg);
      this.log(`${C.red}THERMAL ALERT: Extreme chamber heat (${this.temp}K) warped internal Bulkhead -${heatDmg}% hull.${C.reset}`);
    }

    // Dynamic Environmental Event (35% chance)
    if (Math.random() < 0.40) {
      this.triggerRandomEvent();
    } else {
      // Pressure natural fluctuation
      this.pressureMod = Math.floor(Math.random() * 41) - 15; // -15 to +25
    }

    // Passive drain & life support
    this.battery = Math.max(0, this.battery - 1);
    this.turn++;

    // Check Defeat Conditions
    if (this.hull <= 0) {
      this.handleDefeat('HULL_IMPLOSION');
      return;
    }

    if (this.battery <= 0 && this.temp >= 400) {
      this.handleDefeat('MELTDOWN');
      return;
    }

    if (this.battery <= 0 && this.temp <= 275) {
      this.handleDefeat('FROZEN');
      return;
    }

    this.renderScreen();
    this.promptUser();
  }

  triggerRandomEvent() {
    const roll = Math.random();
    if (roll < 0.25) {
      // Vent Plume
      this.temp += 30;
      this.log(`${C.yellow}ENVIRONMENT: Benthic thermal vent plume swept intake! Chamber Temp surged +30K.${C.reset}`);
    } else if (roll < 0.50) {
      // Pressure Surge
      this.pressureMod = 65;
      this.log(`${C.red}ENVIRONMENT: Hyperbaric down-current detected! Transient pressure spiked +65 atm.${C.reset}`);
    } else if (roll < 0.75) {
      // Density Surge
      this.densitySurgeTurns = 2;
      this.log(`${C.magenta}ENVIRONMENT: Brine pool convection currents surfaced an ultra-dense isotope layer!${C.reset}`);
    } else {
      // Micro-fracture alert
      if (this.microfractureTimer === 0) {
        this.microfractureTimer = 2;
        this.log(`${C.red}WARNING: Ultrasonic sensors detect structural micro-fracture! Must patch within 2 turns.${C.reset}`);
      }
    }
  }

  handleVictory() {
    console.clear();
    console.log(`\n${C.green}${C.bold}======================================================================${C.reset}`);
    console.log(`${C.bgCyan}${C.white}${C.bold}                     MISSION ACCOMPLISHED: EXTRACTION SUCCESS        ${C.reset}`);
    console.log(`${C.green}${C.bold}======================================================================${C.reset}\n`);
    console.log(`${C.cyan}The Nadir-IV releases bottom anchors and discharges emergency ballast.${C.reset}`);
    console.log(`You ascend through the abyssal midnight zone with ${C.magenta}${this.brine} units of HSIB${C.reset} safely contained.`);
    console.log(`\n${C.bold}FINAL MISSION METRICS:${C.reset}`);
    console.log(`  - Total Shifts (Turns): ${this.turn}`);
    console.log(`  - Final Hull Integrity: ${this.hull.toFixed(1)}%`);
    console.log(`  - Remaining Battery:    ${this.battery.toFixed(1)} kWh`);
    console.log(`  - Remaining Ballast:    ${this.nitrogen} canisters`);
    console.log(`\n${C.yellow}The Research Consortium commends your exceptional operational fortitude.${C.reset}\n`);
    this.rl.close();
  }

  handleDefeat(reason) {
    console.clear();
    console.log(`\n${C.red}${C.bold}======================================================================${C.reset}`);
    console.log(`${C.bgRed}${C.white}${C.bold}                      CATASTROPHIC FAILURE DETECTED                   ${C.reset}`);
    console.log(`${C.red}${C.bold}======================================================================${C.reset}\n`);

    switch (reason) {
      case 'HULL_IMPLOSION':
        console.log(`${C.red}CRUSH DEPTH FAILURE:${C.reset} Hyperbaric forces breached the primary titanium sphere.`);
        console.log(`The Nadir-IV suffered instantaneous catastrophic implosion at depth ${this.depth}m.`);
        break;
      case 'CAVITATION_EXPLOSION':
        console.log(`${C.red}MANIFOLD DETONATION:${C.reset} Cavitation gas reached critical saturation (100%).`);
        console.log(`Rapid adiabatic compression ignited the vapor pocket, destroying the intake array.`);
        break;
      case 'MELTDOWN':
        console.log(`${C.red}THERMAL RUNAWAY:${C.reset} Power grid exhausted while core temperature exceeded safety thresholds.`);
        console.log(`Telemetry systems melted and life support systems permanently severed.`);
        break;
      case 'FROZEN':
        console.log(`${C.red}SUB-ZERO POWER FAULT:${C.reset} Abyssal freezing cold froze hydraulic fluid without reserve battery to restart.`);
        break;
    }

    console.log(`\n${C.dim}Shift: ${this.turn} | Harvested Brine: ${this.brine} / 1000 HSIB${C.reset}\n`);
    this.rl.close();
  }
}

// Start game
const game = new NadirBathyscapheGame();
game.start();
