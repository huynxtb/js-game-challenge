const readline = require('readline');

// --- Game Constants ---
const INITIAL_PRESSURE = 50;
const INITIAL_OIL = 100;
const INITIAL_GEAR_INTEGRITY = 100;
const INITIAL_HEAT = 30;
const INITIAL_TURNS = 50;

const PRESSURE_IDEAL_MIN = 40;
const PRESSURE_IDEAL_MAX = 60;
const PRESSURE_STALL_RISK = 20;
const PRESSURE_EXPLOSION_RISK = 80;
const PRESSURE_CRITICAL_MIN = 0;
const PRESSURE_CRITICAL_MAX = 100;

const HEAT_IDEAL_MAX = 50;
const HEAT_DANGER_ZONE = 70;
const HEAT_CRITICAL_MAX = 100;

const GEAR_INTEGRITY_LOW_THRESHOLD = 50;

const OIL_HEAVY_APPLY_COST = 20;
const OIL_LIGHT_APPLY_COST = 10;

const TURNS_TO_WIN = INITIAL_TURNS;

// --- Game State ---
let gameState = {
    pressure: INITIAL_PRESSURE,
    oil: INITIAL_OIL,
    gearIntegrity: INITIAL_GEAR_INTEGRITY,
    heat: INITIAL_HEAT,
    turnsRemaining: INITIAL_TURNS,
    gameOver: false,
    win: false
};

// --- Helper Functions ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clearConsole() {
    process.stdout.write('\x1Bc');
}

function displayStats() {
    console.log("========================================");
    console.log("        Cogwork Corekeeper Status       ");
    console.log("========================================");
    console.log(`  Pressure (PSI):       ${gameState.pressure} (Ideal: ${PRESSURE_IDEAL_MIN}-${PRESSURE_IDEAL_MAX})`);
    console.log(`  Lubricant (Oil):      ${gameState.oil} units`);
    console.log(`  Gear Integrity:      ${gameState.gearIntegrity}%`);
    console.log(`  Heat (Celsius):       ${gameState.heat}°C (Ideal: <${HEAT_IDEAL_MAX}°C)`);
    console.log(`  Turns Remaining:      ${gameState.turnsRemaining}`);
    console.log("----------------------------------------");
}

function displayMenu() {
    console.log("  Available Actions:");
    console.log("  1. Adjust Pressure");
    console.log("     1a. Increase PSI (Cost: 5 Oil, +5 Heat)");
    console.log("     1b. Decrease PSI (Reduces Heat)");
    console.log("  2. Apply Lubricant");
    console.log("     2a. Apply Oil (Heavy) (Cost: 20 Oil, +30 Integrity, -10 Heat)");
    console.log("     2b. Apply Oil (Light) (Cost: 10 Oil, +15 Integrity, -5 Heat)");
    console.log("  3. Emergency Vent Heat (Cost: 5 Oil, -20 Heat, -15 PSI)");
    console.log("  4. Monitor Systems (No Cost)");
    console.log("========================================");
}

function handleInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    return new Promise(resolve => {
        rl.question('Enter your action (e.g., 1a, 2b, 3, 4): ', (input) => {
            rl.close();
            resolve(input.trim().toLowerCase());
        });
    });
}

function checkGameOver() {
    if (gameState.pressure <= PRESSURE_CRITICAL_MIN) {
        console.log("\n!!! GAME OVER: Catastrophic Stall! Pressure dropped to 0 PSI. !!!");
        gameState.gameOver = true;
    } else if (gameState.pressure >= PRESSURE_CRITICAL_MAX) {
        console.log("\n!!! GAME OVER: Explosion! Pressure reached 100 PSI. !!!");
        gameState.gameOver = true;
    } else if (gameState.heat >= HEAT_CRITICAL_MAX) {
        console.log("\n!!! GAME OVER: Meltdown! Heat reached 100°C. !!!");
        gameState.gameOver = true;
    } else if (gameState.gearIntegrity <= 0) {
        console.log("\n!!! GAME OVER: Catastrophic Failure! Gear Integrity dropped to 0%. !!!");
        gameState.gameOver = true;
    } else if (gameState.turnsRemaining <= 0) {
        gameState.win = true;
        gameState.gameOver = true;
    }
}

function applyAction(action) {
    let turnCost = 1;

    switch (action) {
        case '1a': // Increase PSI
            if (gameState.oil < 5) {
                console.log("\nNot enough Oil to increase pressure!");
                return;
            }
            gameState.pressure += getRandomInt(10, 20);
            gameState.oil -= 5;
            gameState.heat += 5;
            console.log("\nPressure increased. Oil consumed. Heat slightly increased.");
            break;
        case '1b': // Decrease PSI
            gameState.pressure -= getRandomInt(10, 20);
            gameState.heat = Math.max(0, gameState.heat - 5);
            console.log("\nPressure decreased. Heat reduced.");
            break;
        case '2a': // Apply Oil (Heavy)
            if (gameState.oil < OIL_HEAVY_APPLY_COST) {
                console.log("\nNot enough Oil for Heavy Application!");
                return;
            }
            gameState.oil -= OIL_HEAVY_APPLY_COST;
            gameState.gearIntegrity = Math.min(100, gameState.gearIntegrity + 30);
            gameState.heat = Math.max(0, gameState.heat - 10);
            console.log("\nHeavy oil applied. Gear Integrity repaired. Heat reduced.");
            break;
        case '2b': // Apply Oil (Light)
            if (gameState.oil < OIL_LIGHT_APPLY_COST) {
                console.log("\nNot enough Oil for Light Application!");
                return;
            }
            gameState.oil -= OIL_LIGHT_APPLY_COST;
            gameState.gearIntegrity = Math.min(100, gameState.gearIntegrity + 15);
            gameState.heat = Math.max(0, gameState.heat - 5);
            console.log("\nLight oil applied. Gear Integrity partially repaired. Heat slightly reduced.");
            break;
        case '3': // Emergency Vent Heat
            if (gameState.oil < 5) {
                console.log("\nNot enough Oil for Emergency Vent!");
                return;
            }
            gameState.heat = Math.max(0, gameState.heat - 20);
            gameState.pressure = Math.max(0, gameState.pressure - 15);
            gameState.oil -= 5;
            console.log("\nEmergency heat vent activated. Heat reduced. Pressure decreased. Oil consumed.");
            break;
        case '4': // Monitor Systems
            turnCost = 0;
            console.log("\nMonitoring systems...");
            break;
        default:
            console.log("\nInvalid action. Please choose from the menu.");
            return;
    }

    if (turnCost > 0) {
        gameState.turnsRemaining -= turnCost;
    }
}

function updateGameLogic() {
    // 1. Passive Pressure Fluctuation
    if (gameState.pressure > PRESSURE_IDEAL_MAX) {
        gameState.pressure += getRandomInt(1, 3);
    } else if (gameState.pressure < PRESSURE_IDEAL_MIN) {
        gameState.pressure -= getRandomInt(1, 3);
    } else {
        gameState.pressure += getRandomInt(-1, 1);
    }
    gameState.pressure = Math.max(PRESSURE_CRITICAL_MIN, Math.min(PRESSURE_CRITICAL_MAX, gameState.pressure)); // Clamp pressure

    // 2. Passive Gear Degradation
    let degradationRate = 2;
    const pressureOutsideIdeal = gameState.pressure < PRESSURE_IDEAL_MIN || gameState.pressure > PRESSURE_IDEAL_MAX;
    const heatAboveIdeal = gameState.heat > HEAT_IDEAL_MAX;

    if (pressureOutsideIdeal && heatAboveIdeal) {
        degradationRate = 5;
    } else if (pressureOutsideIdeal || heatAboveIdeal) {
        degradationRate = 3;
    }
    gameState.gearIntegrity -= getRandomInt(degradationRate, degradationRate + 2);
    gameState.gearIntegrity = Math.max(0, gameState.gearIntegrity);

    // 3. Passive Oil Depletion
    gameState.oil -= getRandomInt(1, 2);
    gameState.oil = Math.max(0, gameState.oil);

    // 4. Passive Heat Increase
    if (gameState.pressure > PRESSURE_IDEAL_MAX || gameState.gearIntegrity < GEAR_INTEGRITY_LOW_THRESHOLD) {
        gameState.heat += getRandomInt(2, 5);
    }
    gameState.heat = Math.max(0, gameState.heat);

    // 5. Random Events (every 3-5 turns)
    if (gameState.turnsRemaining > 0 && gameState.turnsRemaining % getRandomInt(3, 5) === 0) {
        const eventType = getRandomInt(1, 4);
        switch (eventType) {
            case 1: // Pressure Surge!
                gameState.pressure += getRandomInt(20, 30);
                console.log("\n*** EVENT: Pressure Surge! ***");
                break;
            case 2: // Oil Line Leak!
                const oilLost = getRandomInt(15, 25);
                gameState.oil -= oilLost;
                gameState.oil = Math.max(0, gameState.oil);
                console.log(`\n*** EVENT: Oil Line Leak! Lost ${oilLost} units of Oil. ***`);
                break;
            case 3: // Gear Grind!
                const integrityLoss = getRandomInt(10, 20);
                gameState.gearIntegrity -= integrityLoss;
                gameState.gearIntegrity = Math.max(0, gameState.gearIntegrity);
                gameState.heat += 10;
                console.log(`\n*** EVENT: Gear Grind! Gear Integrity lost ${integrityLoss}%. Heat increased. ***`);
                break;
            case 4: // System Stabilized Briefly!
                gameState.oil = Math.min(INITIAL_OIL, gameState.oil + 5);
                gameState.heat = Math.max(0, gameState.heat - 5);
                console.log("\n*** EVENT: System Stabilized Briefly! Gained some Oil, Heat reduced. ***");
                break;
        }
    }

    // Clamp values to critical limits after all updates
    gameState.pressure = Math.max(PRESSURE_CRITICAL_MIN, Math.min(PRESSURE_CRITICAL_MAX, gameState.pressure));
    gameState.heat = Math.max(0, Math.min(HEAT_CRITICAL_MAX, gameState.heat));
    gameState.gearIntegrity = Math.max(0, gameState.gearIntegrity);
    gameState.oil = Math.max(0, gameState.oil);
}

async function gameLoop() {
    while (!gameState.gameOver) {
        clearConsole();
        displayStats();
        displayMenu();

        const action = await handleInput();

        if (action === 'exit') {
            console.log("Exiting game.");
            process.exit(0);
        }

        applyAction(action);

        if (!gameState.gameOver) {
            updateGameLogic();
            checkGameOver();
        }
    }

    // Game Over or Win
    clearConsole();
    displayStats();
    if (gameState.win) {
        console.log("\n*************************************************");
        console.log("*** CONGRATULATIONS! The Titan of Gears is STABLE! ***");
        console.log("*************************************************");
    } else {
        console.log("\n-------------------------------------------------");
        console.log("--- The Titan of Gears has fallen into disrepair. ---");
        console.log("-------------------------------------------------");
    }
    process.exit(0);
}

// --- Game Start ---
console.log("Welcome to Cogwork Corekeeper!");
console.log("You are tasked with stabilizing the ancient Titan of Gears.");
console.log("Survive for " + TURNS_TO_WIN + " turns to avert disaster.");
console.log("Type 'exit' at any time to quit.");
console.log("Press Enter to begin...");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('', () => {
    rl.close();
    gameLoop();
});
