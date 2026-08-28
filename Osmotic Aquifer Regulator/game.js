const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

let state = {
    turn: 1,
    freshwater: 100,
    brine: 20,
    integrity: 100,
    filterHealth: 100,
    power: 50
};

async function main() {
    while (true) {
        console.clear();
        if (state.integrity <= 0) {
            console.log(`\n${RED}CRITICAL FAILURE: Chamber integrity reached 0%. A massive sinkhole has collapsed the shelter!${RESET}`);
            break;
        }
        if (state.freshwater <= 0) {
            console.log(`\n${RED}CRITICAL FAILURE: Freshwater reservoir is empty. The shelter population has dehydrated!${RESET}`);
            break;
        }
        if (state.turn > 25) {
            console.log(`\n${GREEN}====================================================`);
            console.log(`VICTORY! You successfully regulated the aquifer for 25 cycles.`);
            console.log(`The shelter's water supply is stabilized. Excellent work, Operator.`);
            console.log(`====================================================${RESET}`);
            break;
        }

        console.log(`${CYAN}=== Osmotic Aquifer Regulator ===${RESET}`);
        console.log(`Cycle: ${state.turn}/25`);
        console.log(`---------------------------------`);
        console.log(`Freshwater Reservoir: ${state.freshwater > 30 ? GREEN : RED}${state.freshwater} units${RESET}`);
        console.log(`Brine Concentration:  ${state.brine > 60 ? RED : BLUE}${state.brine}%${RESET} ${state.brine > 80 ? RED + "(CRITICAL - Filter Efficiency Halved)" + RESET : ""}`);
        console.log(`Chamber Integrity:    ${state.integrity > 40 ? GREEN : RED}${state.integrity}%${RESET}`);
        console.log(`Filter Health:        ${state.filterHealth > 30 ? GREEN : RED}${state.filterHealth}%${RESET}`);
        console.log(`Power Grid:           ${YELLOW}${state.power}/100 units${RESET}`);
        console.log(`---------------------------------`);

        console.log("Available Actions:");
        console.log(`[1] Run Filtration     (Cost: 15 Power) -> +30 Freshwater (+15 if Brine > 80%), +15% Brine, -10% Filter`);
        console.log(`[2] Flush Brine        (Cost: 20 Power) -> Reset Brine to 10%, -5% Chamber Integrity`);
        console.log(`[3] Service Filters    (Cost: 25 Power) -> +40% Filter Health`);
        console.log(`[4] Reinforce Chamber  (Cost: 30 Power) -> +20% Chamber Integrity`);
        console.log(`[5] Conserve Energy    (Cost: 0 Power)  -> Pass turn, +15 extra Power`);
        console.log(`[Q] Abandon Station    (Quit Game)`);

        const choice = await question(`\nSelect action [1-5, Q]: `);
        let actionTaken = false;
        let logMsg = "";

        if (choice === '1') {
            if (state.power < 15) {
                logMsg = `${RED}Insufficient Power! Requires 15 Power.${RESET}`;
            } else if (state.filterHealth <= 0) {
                logMsg = `${RED}Filters are completely destroyed! Service them first.${RESET}`;
            } else {
                state.power -= 15;
                let yieldAmt = state.brine > 80 ? 15 : 30;
                state.freshwater += yieldAmt;
                state.brine = Math.min(100, state.brine + 15);
                state.filterHealth = Math.max(0, state.filterHealth - 10);
                logMsg = `${GREEN}Filtration active. Produced ${yieldAmt} freshwater. Brine increased. Filter degraded.${RESET}`;
                actionTaken = true;
            }
        } else if (choice === '2') {
            if (state.power < 20) {
                logMsg = `${RED}Insufficient Power! Requires 20 Power.${RESET}`;
            } else {
                state.power -= 20;
                state.brine = 10;
                state.integrity = Math.max(0, state.integrity - 5);
                logMsg = `${YELLOW}Brine flushed to 10%. High-pressure discharge damaged chamber integrity by 5%.${RESET}`;
                actionTaken = true;
            }
        } else if (choice === '3') {
            if (state.power < 25) {
                logMsg = `${RED}Insufficient Power! Requires 25 Power.${RESET}`;
            } else {
                state.power -= 25;
                state.filterHealth = Math.min(100, state.filterHealth + 40);
                logMsg = `${GREEN}Filters serviced. Health restored by 40%.${RESET}`;
                actionTaken = true;
            }
        } else if (choice === '4') {
            if (state.power < 30) {
                logMsg = `${RED}Insufficient Power! Requires 30 Power.${RESET}`;
            } else {
                state.power -= 30;
                state.integrity = Math.min(100, state.integrity + 20);
                logMsg = `${GREEN}Chamber reinforced. Integrity restored by 20%.${RESET}`;
                actionTaken = true;
            }
        } else if (choice === '5') {
            state.power = Math.min(100, state.power + 15);
            logMsg = `${YELLOW}Conserving energy. Power generation boosted.${RESET}`;
            actionTaken = true;
        } else if (choice.toLowerCase() === 'q') {
            console.log(`${RED}Station abandoned. Game Over.${RESET}`);
            break;
        } else {
            logMsg = `${RED}Invalid input. Choose 1-5 or Q.${RESET}`;
        }

        if (actionTaken) {
            state.freshwater -= 10;
            let filterDegrade = Math.floor(Math.random() * 11) + 5;
            state.filterHealth = Math.max(0, state.filterHealth - filterDegrade);
            state.power = Math.min(100, state.power + 15);

            let brineCorrosion = false;
            if (state.brine > 60) {
                state.integrity = Math.max(0, state.integrity - 5);
                brineCorrosion = true;
            }

            let eventMsgs = [];
            if (Math.random() < 0.2) {
                state.integrity = Math.max(0, state.integrity - 15);
                eventMsgs.push(`${RED}[EVENT] Seismic Shift! Chamber integrity reduced by 15%.${RESET}`);
            }
            if (Math.random() < 0.2) {
                state.brine = Math.min(100, state.brine + 10);
                state.filterHealth = Math.max(0, state.filterHealth - 10);
                eventMsgs.push(`${RED}[EVENT] Algal Bloom! Brine increased by 10%, filter health reduced by 10%.${RESET}`);
            }
            if (Math.random() < 0.2) {
                state.freshwater += 20;
                state.brine = Math.min(100, state.brine + 5);
                eventMsgs.push(`${GREEN}[EVENT] Aquifer Surge! Freshwater increased by 20, brine increased by 5%.${RESET}`);
            }

            state.turn++;

            console.clear();
            console.log(`\n--- Cycle ${state.turn - 1} Summary ---`);
            console.log(logMsg);
            console.log(`Freshwater consumed: -10 units.`);
            console.log(`Filters degraded naturally by -${filterDegrade}%.`);
            if (brineCorrosion) {
                console.log(`${RED}High brine concentration corroded chamber walls (-5% Integrity).${RESET}`);
            }
            if (eventMsgs.length > 0) {
                console.log(`\nEvents occurred:`);
                eventMsgs.forEach(msg => console.log(msg));
            }
            await question(`\nPress Enter to proceed to Cycle ${state.turn}...`);
        } else {
            console.log(`\n${logMsg}`);
            await question(`\nPress Enter to try again...`);
        }
    }
    rl.close();
}

main();