/**
 * Volcanic Forge: Pressure Master
 * A single-file console-based resource management survival game.
 * Pure Node.js (Zero external dependencies).
 */

const readline = require('readline');

// Utility function for random integer in range [min, max] inclusive
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Game State Definition
class GameState {
    constructor() {
        this.turn = 1;
        this.maxTurns = 20;
        this.targetEnergy = 500;

        this.pressure = 50;
        this.maxPressure = 100;

        this.energy = 0;

        this.coolant = 60;
        this.maxCoolant = 100;

        this.integrity = 100;
        this.maxIntegrity = 100;

        this.coolantDiscount = false; // Triggered by Coolant Efficiency event
        this.gameOver = false;
        this.win = false;
        this.endReason = '';
    }
}

class VolcanicForgeGame {
    constructor() {
        this.state = new GameState();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    start() {
        console.clear();
        console.log('====================================================');
        console.log('       VOLCANIC FORGE: PRESSURE MASTER              ');
        console.log('====================================================');
        console.log('Welcome, Lead Geothermal Engineer.');
        console.log('Your mission: Generate at least 500 Energy in 20 days.');
        console.log('Warning: Magma Pressure >= 100 or Integrity <= 0 = DOOM.');
        console.log('====================================================\n');

        this.promptTurn();
    }

    displayStatus() {
        console.log(`\n=== VOLCANIC FORGE: PRESSURE MASTER ===`);
        console.log(`Turn: ${this.state.turn}/${this.state.maxTurns}`);
        console.log(`\nStation Status:`);
        console.log(`- Magma Pressure:       ${this.state.pressure}/100 ${this.state.pressure >= 80 ? '[CRITICAL DANGER]' : this.state.pressure >= 65 ? '[WARNING]' : '[STABLE]'}`);
        console.log(`- Total Energy Generated: ${this.state.energy}/${this.state.targetEnergy}`);
        console.log(`- Coolant Reserves:      ${this.state.coolant}/100`);
        console.log(`- Station Integrity:     ${this.state.integrity}/100`);
        if (this.state.coolantDiscount) {
            console.log(`- Active Buff:          Coolant usage -50% for this turn!`);
        }
        console.log(`\nAvailable Actions:`);
        console.log(`1. EXTRACT_LOW    - Safe extraction (+15-25 energy, +3-7 pressure)`);
        console.log(`2. EXTRACT_HIGH   - Aggressive extraction (+30-50 energy, +10-15 pressure, -5-10 integrity)`);
        console.log(`3. VENT_PRESSURE  - Release pressure (-20-30 pressure, uses 10-20 coolant)`);
        console.log(`4. REPAIR_STATION - Fix damage (+15-25 integrity, uses 10 coolant)`);
        console.log(`5. ACQUIRE_COOLANT- Gather coolant (+25-40 coolant, +5 pressure)`);
    }

    promptTurn() {
        this.displayStatus();
        this.rl.question('\nChoose action (1-5): ', (answer) => {
            const choice = answer.trim();
            if (!['1', '2', '3', '4', '5'].includes(choice)) {
                console.log('\n[ERROR] Invalid choice. Please enter a number from 1 to 5.');
                return this.promptTurn();
            }
            this.processTurn(parseInt(choice, 10));
        });
    }

    processTurn(actionChoice) {
        console.log('\n--- ACTION REPORT ---');
        let coolantCostMultiplier = this.state.coolantDiscount ? 0.5 : 1.0;
        this.state.coolantDiscount = false; // Reset buff

        // 1. Execute Player Action
        switch (actionChoice) {
            case 1: { // EXTRACT_LOW
                const energyGain = getRandomInt(15, 25);
                const pressureGain = getRandomInt(3, 7);
                this.state.energy += energyGain;
                this.state.pressure += pressureGain;
                console.log(`[ACTION] Low extraction generated ${energyGain} energy. Magma pressure increased by ${pressureGain}.`);
                break;
            }
            case 2: { // EXTRACT_HIGH
                const energyGain = getRandomInt(30, 50);
                const pressureGain = getRandomInt(10, 15);
                const integrityLoss = getRandomInt(5, 10);
                this.state.energy += energyGain;
                this.state.pressure += pressureGain;
                this.state.integrity -= integrityLoss;
                console.log(`[ACTION] High extraction generated ${energyGain} energy! Magma pressure rose by ${pressureGain}, station took ${integrityLoss} damage.`);
                break;
            }
            case 3: { // VENT_PRESSURE
                const baseCoolant = getRandomInt(10, 20);
                const actualCoolantCost = Math.round(baseCoolant * coolantCostMultiplier);
                if (this.state.coolant < actualCoolantCost) {
                    console.log(`[ACTION] Insufficient coolant (${this.state.coolant}/${actualCoolantCost})! Emergency dry vent executed with diminished effect.`);
                    const pressureRelief = getRandomInt(5, 10);
                    this.state.pressure = Math.max(0, this.state.pressure - pressureRelief);
                    this.state.coolant = 0;
                    console.log(`[ACTION] Vent reduced pressure by only ${pressureRelief}. Coolant depleted.`);
                } else {
                    this.state.coolant -= actualCoolantCost;
                    const pressureRelief = getRandomInt(20, 30);
                    this.state.pressure = Math.max(0, this.state.pressure - pressureRelief);
                    console.log(`[ACTION] Pressure vented! Magma pressure decreased by ${pressureRelief} using ${actualCoolantCost} coolant.`);
                }
                break;
            }
            case 4: { // REPAIR_STATION
                const baseCoolant = 10;
                const actualCoolantCost = Math.round(baseCoolant * coolantCostMultiplier);
                if (this.state.coolant < actualCoolantCost) {
                    console.log(`[ACTION] Insufficient coolant (${this.state.coolant}/${actualCoolantCost}) to synthesize plating repairs.`);
                } else {
                    this.state.coolant -= actualCoolantCost;
                    const repairAmount = getRandomInt(15, 25);
                    this.state.integrity = Math.min(this.state.maxIntegrity, this.state.integrity + repairAmount);
                    console.log(`[ACTION] Station repaired! Integrity restored by +${repairAmount} using ${actualCoolantCost} coolant.`);
                }
                break;
            }
            case 5: { // ACQUIRE_COOLANT
                const coolantGain = getRandomInt(25, 40);
                this.state.coolant = Math.min(this.state.maxCoolant, this.state.coolant + coolantGain);
                this.state.pressure += 5;
                console.log(`[ACTION] Coolant synthesis completed: +${coolantGain} coolant acquired. Pumps caused +5 pressure buildup.`);
                break;
            }
        }

        // Check immediate failure after player action
        if (this.checkImmediateLoss()) {
            return this.endGame();
        }

        // 2. Random Event (30% chance)
        console.log('\n--- ENVIRONMENT REPORT ---');
        if (Math.random() < 0.30) {
            this.triggerRandomEvent();
        } else {
            console.log('[SEISMIC] No anomalous seismic events detected.');
        }

        if (this.checkImmediateLoss()) {
            return this.endGame();
        }

        // 3. Natural Daily Pressure Increase
        const naturalPressure = getRandomInt(5, 15);
        this.state.pressure += naturalPressure;
        console.log(`[VOLCANO] Natural magma expansion increased pressure by +${naturalPressure}.`);

        if (this.checkImmediateLoss()) {
            return this.endGame();
        }

        // 4. Turn Completion / End of Game Check
        if (this.state.turn >= this.state.maxTurns) {
            if (this.state.energy >= this.state.targetEnergy && this.state.integrity > 0 && this.state.pressure < 100) {
                this.state.win = true;
                this.state.endReason = 'You successfully fulfilled the energy quota and safely stabilized the geothermal facility for future operation!';
            } else if (this.state.energy < this.state.targetEnergy) {
                this.state.win = false;
                this.state.endReason = `Quota unfulfilled! You only generated ${this.state.energy}/${this.state.targetEnergy} energy units by Day 20.`;
            }
            return this.endGame();
        }

        // Advance turn
        this.state.turn++;
        this.promptTurn();
    }

    triggerRandomEvent() {
        const roll = getRandomInt(1, 4);
        switch (roll) {
            case 1: { // Magma Surge
                const surge = getRandomInt(10, 20);
                this.state.pressure += surge;
                console.log(`[EVENT: MAGMA SURGE!] Deep seismic rupture! Pressure surges by +${surge}!`);
                break;
            }
            case 2: { // Thermal Leak
                const leak = getRandomInt(10, 15);
                this.state.integrity = Math.max(0, this.state.integrity - leak);
                console.log(`[EVENT: THERMAL LEAK!] Superheated steam ruptured conduits! Station integrity decreased by -${leak}!`);
                break;
            }
            case 3: { // Coolant Efficiency
                this.state.coolantDiscount = true;
                console.log(`[EVENT: COOLANT EFFICIENCY!] Cryo-compressors entered optimal cycle. Next turn's coolant costs reduced by 50%!`);
                break;
            }
            case 4: { // Seismic Stabilization
                const relief = 10;
                this.state.pressure = Math.max(0, this.state.pressure - relief);
                console.log(`[EVENT: SEISMIC STABILIZATION] Natural crust expansion dissipated internal chamber pressure by -${relief}.`);
                break;
            }
        }
    }

    checkImmediateLoss() {
        if (this.state.pressure >= this.state.maxPressure) {
            this.state.gameOver = true;
            this.state.win = false;
            this.state.endReason = 'CATASTROPHIC ERUPTION! Magma pressure exceeded threshold 100. The entire facility was vaporized.';
            return true;
        }
        if (this.state.integrity <= 0) {
            this.state.gameOver = true;
            this.state.win = false;
            this.state.endReason = 'STRUCTURAL COLLAPSE! Station integrity reached 0%. Magma breached the primary control room.';
            return true;
        }
        return false;
    }

    endGame() {
        console.log('\n====================================================');
        if (this.state.win) {
            console.log('                MISSION SUCCESSFUL!                 ');
            } else {
                console.log('                   MISSION FAILED                   ');
            }
        console.log('====================================================');
        console.log(`Outcome: ${this.state.endReason}`);
        console.log('\n--- FINAL MISSION STATISTICS ---');
        console.log(`- Final Day Reached:    ${this.state.turn}/${this.state.maxTurns}`);
        console.log(`- Total Energy Created:  ${this.state.energy}/${this.state.targetEnergy}`);
        console.log(`- Final Magma Pressure:  ${this.state.pressure}/100`);
        console.log(`- Final Station Integrity: ${Math.max(0, this.state.integrity)}/100`);
        console.log(`- Remaining Coolant:    ${this.state.coolant}/100`);
        console.log('====================================================\n');

        this.rl.question('Would you like to play again? (y/n): ', (ans) => {
            if (ans.trim().toLowerCase() === 'y' || ans.trim().toLowerCase() === 'yes') {
                this.state = new GameState();
                this.start();
            } else {
                console.log('\nThank you for operating the Volcanic Forge. Goodbye!');
                this.rl.close();
                process.exit(0);
            }
        });
    }
}

// Start game
const game = new VolcanicForgeGame();
game.start();
