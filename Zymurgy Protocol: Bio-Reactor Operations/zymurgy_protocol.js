const readline = require('readline');

const GAME_NAME = 'Zymurgy Protocol: Bio-Reactor Operations';
const MAX_TURNS = 20;
const TARGET_ENZYME_X = 500;
const VAT_COUNT = 4;
const OPTIMAL_EFFICIENCY_MULTIPLIER = 2.5;

let turn = 1;
let enzymeX = 0;
let vats = [];

function initializeVats() {
    for (let i = 1; i <= VAT_COUNT; i++) {
        vats.push({
            id: i,
            temperature: 50,
            pH: 7.0,
            microbePopulation: 50
        });
    }
}

function displayStatus() {
    console.log(`\n--- Turn ${turn}/${MAX_TURNS} | Enzyme-X: ${enzymeX}/${TARGET_ENZYME_X} ---\n`);
    console.log('ID | Temperature (°C) | pH     | Microbe Population |');
    console.log('---|------------------|--------|--------------------|');
    vats.forEach(vat => {
        console.log(
            `${vat.id.toString().padEnd(2)} | ` +
            `${vat.temperature.toString().padEnd(16)} | ` +
            `${vat.pH.toFixed(1).padEnd(6)} | ` +
            `${vat.microbePopulation.toString().padEnd(18)} |`
        );
    });
    console.log('\n');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function applyAction(command) {
    const parts = command.trim().toUpperCase().split(' ');
    const action = parts[0];
    const vatId = parseInt(parts[1]);

    if (isNaN(vatId) || vatId < 1 || vatId > VAT_COUNT) {
        console.log('Invalid vat ID.');
        return false;
    }

    const vat = vats.find(v => v.id === vatId);
    if (!vat) {
        console.log('Vat not found.');
        return false;
    }

    let actionTaken = true;
    switch (action) {
        case 'HEAT':
            vat.temperature += 10;
            break;
        case 'COOL':
            vat.temperature -= 10;
            break;
        case 'ACID':
            vat.pH -= 1.0;
            break;
        case 'BASE':
            vat.pH += 1.0;
            break;
        case 'HARVEST':
            enzymeX += vat.microbePopulation * OPTIMAL_EFFICIENCY_MULTIPLIER;
            vat.microbePopulation = 10;
            break;
        case 'PASS':
            return 'PASS';
        default:
            console.log('Unknown command.');
            actionTaken = false;
    }

    if (actionTaken) {
        vat.temperature = clamp(vat.temperature, 20, 100);
        vat.pH = clamp(vat.pH, 1.0, 14.0);
        vat.microbePopulation = clamp(vat.microbePopulation, 0, 100);
        displayStatus();
    }
    return actionTaken;
}

function environmentDrift() {
    vats.forEach(vat => {
        vat.temperature += Math.floor(Math.random() * 11) - 5; // -5 to +5
        vat.pH += (Math.random() * 1.0) - 0.5; // -0.5 to +0.5

        vat.temperature = clamp(vat.temperature, 20, 100);
        vat.pH = clamp(vat.pH, 1.0, 14.0);

        // Microbe reproduction
        if (vat.temperature >= 35 && vat.temperature <= 45 && vat.pH >= 6.0 && vat.pH <= 8.0) {
            vat.microbePopulation = clamp(vat.microbePopulation + Math.floor(Math.random() * 15), 0, 100);
        }
    });
}

function checkLossCondition() {
    for (const vat of vats) {
        if (vat.temperature > 90 || vat.pH < 2.0 || vat.pH > 12.0) {
            console.log(`\n--- CONTAINMENT RUPTURE in Vat ${vat.id}! ---`);
            console.log('Game Over.');
            return true;
        }
    }
    return false;
}

function checkWinCondition() {
    if (enzymeX >= TARGET_ENZYME_X) {
        console.log(`\n--- SUCCESS! ${TARGET_ENZYME_X} units of Enzyme-X synthesized! ---`);
        console.log('You Win!');
        return true;
    }
    return false;
}

function endGame() {
    console.log('\n--- Game Ended ---');
    console.log(`Final Turn: ${turn}`);
    console.log(`Total Enzyme-X: ${enzymeX}`);
    process.exit(0);
}

function gameLoop(rl) {
    if (turn > MAX_TURNS) {
        if (!checkWinCondition()) {
            console.log('\n--- Time limit reached. Insufficient Enzyme-X. ---');
            console.log('Game Over.');
        }
        endGame();
        return;
    }

    displayStatus();
    let actionsRemaining = 2;
    const prompt = `Turn ${turn}/${MAX_TURNS} | Actions: ${actionsRemaining} | Enter command (e.g., HEAT 1, ACID 3, HARVEST 2, PASS): `;

    rl.question(prompt, (command) => {
        const result = applyAction(command);

        if (result === 'PASS') {
            actionsRemaining = 0;
        } else if (result !== false) {
            actionsRemaining--;
        }

        if (actionsRemaining > 0) {
            gameLoop(rl); // Continue with remaining actions in the same turn
        } else {
            // End of turn actions
            if (checkLossCondition()) {
                endGame();
                return;
            }
            environmentDrift();
            if (checkLossCondition()) {
                endGame();
                return;
            }
            if (checkWinCondition()) {
                endGame();
                return;
            }
            turn++;
            gameLoop(rl); // Start next turn
        }
    });
}

function startGame() {
    console.log(`Welcome to ${GAME_NAME}!`);
    console.log(`Objective: Synthesize ${TARGET_ENZYME_X} units of Enzyme-X in ${MAX_TURNS} turns.`);
    console.log('Beware of containment ruptures!');

    initializeVats();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    gameLoop(rl);

    rl.on('close', () => {
        console.log('\nExiting game. Goodbye!');
        process.exit(0);
    });
}

startGame();
