const readline = require('readline');
const process = require('process');

// --- Game Configuration ---
const CONFIG = {
    INITIAL_CARBON: 100,
    INITIAL_WATER: 100,
    INITIAL_NITROGEN: 10,
    RESOURCE_DECAY_PERCENTAGE: 0.05, // 5% decay per turn
    MOLD_GROWTH_PER_TURN: 10, // Mold points added to a random connected zone
    MOLD_CLEAR_PER_WATER: 15, // Mold points cleared per water spent
    MOLD_REDUCTION_PER_10_MOLD: 0.02, // 2% reduction in forage yield for every 10 mold points in a zone
    ZONE_CONNECTION_COST_PER_POINT: 5, // Carbon cost for 1 progress point
    ZONE_MAX_PROGRESS: 100, // 100% to connect a zone
    FORAGE_MIN_CARBON: 10,
    FORAGE_MAX_CARBON: 25,
    FORAGE_MIN_WATER: 10,
    FORAGE_MAX_WATER: 25,
    FORAGE_MIN_NITROGEN: 1,
    FORAGE_MAX_NITROGEN: 3,
    SYNTHESIS_NITROGEN_COST: 1,
    SYNTHESIS_WATER_TO_CARBON_RATIO: { water: 5, carbon: 3 }, // 5 Water -> 3 Carbon
    SYNTHESIS_CARBON_TO_WATER_RATIO: { carbon: 5, water: 3 }, // 5 Carbon -> 3 Water
    WIN_CONDITION_CONNECTED_ZONES: 5,
    LOSS_CONDITION_RESOURCE_ZERO: 0,
    LOSS_CONDITION_TOTAL_MOLD_PERCENTAGE: 100 // If total mold across all zones reaches 100% of max possible mold
};

// --- Game State ---
let gameState = {
    turn: 0,
    resources: {
        carbon: CONFIG.INITIAL_CARBON,
        water: CONFIG.INITIAL_WATER,
        nitrogen: CONFIG.INITIAL_NITROGEN,
    },
    zones: [
        { name: 'North', progress: 0, mold: 0, connected: false },
        { name: 'South', progress: 0, mold: 0, connected: false },
        { name: 'East', progress: 0, mold: 0, connected: false },
        { name: 'West', progress: 0, mold: 0, connected: false },
        { name: 'Canopy', progress: 0, mold: 0, connected: false },
    ],
    gameRunning: true,
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// --- Utility Functions ---
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createProgressBar(current, max, length = 20, fillChar = '#', emptyChar = '-') {
    const percentage = max === 0 ? 0 : Math.min(1, Math.max(0, current / max));
    const filledLength = Math.round(length * percentage);
    const emptyLength = length - filledLength;
    return `[${fillChar.repeat(filledLength)}${emptyChar.repeat(emptyLength)}] ${Math.round(percentage * 100)}%`;
}

function calculateTotalMoldPercentage() {
    const totalCurrentMold = gameState.zones.reduce((sum, zone) => sum + zone.mold, 0);
    const maxPossibleMold = gameState.zones.length * CONFIG.ZONE_MAX_PROGRESS; // Max mold per zone is 100
    return (totalCurrentMold / maxPossibleMold) * 100;
}

// --- Game Logic Functions ---
function displayStatus() {
    console.clear();
    console.log("==================================================");
    console.log("               MYCELIUM NEXUS - Turn " + gameState.turn);
    console.log("==================================================");

    console.log("\n--- Resources ---");
    console.log(`Carbon:   ${createProgressBar(gameState.resources.carbon, CONFIG.INITIAL_CARBON * 2)} ${gameState.resources.carbon}`);
    console.log(`Water:    ${createProgressBar(gameState.resources.water, CONFIG.INITIAL_WATER * 2)} ${gameState.resources.water}`);
    console.log(`Nitrogen: ${createProgressBar(gameState.resources.nitrogen, CONFIG.INITIAL_NITROGEN * 5)} ${gameState.resources.nitrogen}`);

    console.log("\n--- Forest Zones ---");
    gameState.zones.forEach(zone => {
        const status = zone.connected ? "CONNECTED" : "PENDING";
        console.log(`${zone.name}: ${createProgressBar(zone.progress, CONFIG.ZONE_MAX_PROGRESS)} ${status}`);
        if (zone.mold > 0) {
            console.log(`  Mold:   ${createProgressBar(zone.mold, CONFIG.ZONE_MAX_PROGRESS, 15, 'X', ' ')} ${zone.mold}%`);
        }
    });

    const totalMoldPercent = calculateTotalMoldPercentage();
    console.log(`\nTotal Network Mold: ${createProgressBar(totalMoldPercent, 100, 20, 'M', '-')} ${totalMoldPercent.toFixed(1)}%`);
    console.log("==================================================");
}

function applyTurnEffects() {
    // Resource Decay
    for (const res in gameState.resources) {
        gameState.resources[res] = Math.max(0, Math.floor(gameState.resources[res] * (1 - CONFIG.RESOURCE_DECAY_PERCENTAGE)));
    }

    // Mold Growth
    const connectedZones = gameState.zones.filter(z => z.connected);
    if (connectedZones.length > 0) {
        const randomZone = connectedZones[getRandomInt(0, connectedZones.length - 1)];
        randomZone.mold = Math.min(CONFIG.ZONE_MAX_PROGRESS, randomZone.mold + CONFIG.MOLD_GROWTH_PER_TURN);
        console.log(`\nALERT: Mold grew in the ${randomZone.name} zone!`);
    }
}

function checkWinLoss() {
    // Win Condition
    const connectedCount = gameState.zones.filter(z => z.connected).length;
    if (connectedCount === CONFIG.WIN_CONDITION_CONNECTED_ZONES) {
        console.log("\n==================================================");
        console.log("               VICTORY! MYCELIUM NEXUS COMPLETE!");
        console.log(" All forest zones are connected. The network thrives!");
        console.log("==================================================");
        gameState.gameRunning = false;
        return true;
    }

    // Loss Conditions
    if (gameState.resources.carbon <= CONFIG.LOSS_CONDITION_RESOURCE_ZERO ||
        gameState.resources.water <= CONFIG.LOSS_CONDITION_RESOURCE_ZERO) {
        console.log("\n==================================================");
        console.log("                 DEFEAT! RESOURCES DEPLETED!");
        console.log(" Carbon or Water reached zero. The Mycelium Hub withered.");
        console.log("==================================================");
        gameState.gameRunning = false;
        return true;
    }

    const totalMoldPercent = calculateTotalMoldPercentage();
    if (totalMoldPercent >= CONFIG.LOSS_CONDITION_TOTAL_MOLD_PERCENTAGE) {
        console.log("\n==================================================");
        console.log("                 DEFEAT! MOLD OVERRUN!");
        console.log(" The Mycelium network is completely consumed by toxic mold.");
        console.log("==================================================");
        gameState.gameRunning = false;
        return true;
    }

    return false;
}

// --- Player Actions ---
function expandZone(zoneName) {
    const zone = gameState.zones.find(z => z.name.toLowerCase() === zoneName.toLowerCase());
    if (!zone) {
        console.log("Invalid zone name. Please choose from North, South, East, West, Canopy.");
        return false;
    }
    if (zone.connected) {
        console.log(`${zone.name} zone is already fully connected.`);
        return false;
    }

    const cost = CONFIG.ZONE_CONNECTION_COST_PER_POINT;
    if (gameState.resources.carbon < cost) {
        console.log(`Not enough Carbon! Requires ${cost} Carbon to expand.`);
        return false;
    }

    gameState.resources.carbon -= cost;
    zone.progress = Math.min(CONFIG.ZONE_MAX_PROGRESS, zone.progress + 10); // Expand by 10 progress points
    console.log(`Expanded connection to ${zone.name}. Progress: ${zone.progress}%`);

    if (zone.progress >= CONFIG.ZONE_MAX_PROGRESS) {
        zone.connected = true;
        console.log(`The ${zone.name} zone is now fully connected!`);
    }
    return true;
}

function forage() {
    let carbonGained = getRandomInt(CONFIG.FORAGE_MIN_CARBON, CONFIG.FORAGE_MAX_CARBON);
    let waterGained = getRandomInt(CONFIG.FORAGE_MIN_WATER, CONFIG.FORAGE_MAX_WATER);
    let nitrogenGained = getRandomInt(CONFIG.FORAGE_MIN_NITROGEN, CONFIG.FORAGE_MAX_NITROGEN);

    // Apply mold reduction to forage yield
    let moldReductionFactor = 0;
    gameState.zones.filter(z => z.connected).forEach(zone => {
        moldReductionFactor += Math.floor(zone.mold / 10) * CONFIG.MOLD_REDUCTION_PER_10_MOLD;
    });
    moldReductionFactor = Math.min(1, moldReductionFactor); // Cap reduction at 100%

    carbonGained = Math.floor(carbonGained * (1 - moldReductionFactor));
    waterGained = Math.floor(waterGained * (1 - moldReductionFactor));

    gameState.resources.carbon += carbonGained;
    gameState.resources.water += waterGained;
    gameState.resources.nitrogen += nitrogenGained;

    console.log(`Foraged resources: +${carbonGained} Carbon, +${waterGained} Water, +${nitrogenGained} Nitrogen.`);
    if (moldReductionFactor > 0) {
        console.log(`(Resource gains reduced by ${Math.round(moldReductionFactor * 100)}% due to mold infestation)`);
    }
    return true;
}

function clearMold(zoneName) {
    const zone = gameState.zones.find(z => z.name.toLowerCase() === zoneName.toLowerCase());
    if (!zone) {
        console.log("Invalid zone name. Please choose from North, South, East, West, Canopy.");
        return false;
    }
    if (zone.mold === 0) {
        console.log(`${zone.name} zone has no mold to clear.`);
        return false;
    }

    const waterCost = Math.ceil(zone.mold / CONFIG.MOLD_CLEAR_PER_WATER); // Cost scales with mold
    if (gameState.resources.water < waterCost) {
        console.log(`Not enough Water! Requires ${waterCost} Water to clear mold in ${zone.name}.`);
        return false;
    }

    gameState.resources.water -= waterCost;
    zone.mold = Math.max(0, zone.mold - CONFIG.MOLD_CLEAR_PER_WATER * 5); // Clear a significant amount
    console.log(`Cleared mold in ${zone.name}. Mold level: ${zone.mold}% (Spent ${waterCost} Water).`);
    return true;
}

function synthesize(type) {
    if (gameState.resources.nitrogen < CONFIG.SYNTHESIS_NITROGEN_COST) {
        console.log(`Not enough Nitrogen! Requires ${CONFIG.SYNTHESIS_NITROGEN_COST} Nitrogen for synthesis.`);
        return false;
    }

    let success = false;
    if (type === 'water_to_carbon') {
        const { water, carbon } = CONFIG.SYNTHESIS_WATER_TO_CARBON_RATIO;
        if (gameState.resources.water < water) {
            console.log(`Not enough Water! Requires ${water} Water to convert to Carbon.`);
        } else {
            gameState.resources.water -= water;
            gameState.resources.carbon += carbon;
            gameState.resources.nitrogen -= CONFIG.SYNTHESIS_NITROGEN_COST;
            console.log(`Synthesized: Converted ${water} Water to ${carbon} Carbon (spent ${CONFIG.SYNTHESIS_NITROGEN_COST} Nitrogen).`);
            success = true;
        }
    } else if (type === 'carbon_to_water') {
        const { carbon, water } = CONFIG.SYNTHESIS_CARBON_TO_WATER_RATIO;
        if (gameState.resources.carbon < carbon) {
            console.log(`Not enough Carbon! Requires ${carbon} Carbon to convert to Water.`);
        } else {
            gameState.resources.carbon -= carbon;
            gameState.resources.water += water;
            gameState.resources.nitrogen -= CONFIG.SYNTHESIS_NITROGEN_COST;
            console.log(`Synthesized: Converted ${carbon} Carbon to ${water} Water (spent ${CONFIG.SYNTHESIS_NITROGEN_COST} Nitrogen).`);
            success = true;
        }
    } else {
        console.log("Invalid synthesis type. Choose 'water_to_carbon' or 'carbon_to_water'.");
    }
    return success;
}

// --- Game Loop ---
async function promptAction() {
    if (!gameState.gameRunning) {
        rl.close();
        return;
    }

    console.log("\nChoose an action:");
    console.log("1. Expand [Zone Name] (e.g., 'expand North') - Connects a zone using Carbon.");
    console.log("2. Forage - Gather random resources.");
    console.log("3. Clear Mold [Zone Name] (e.g., 'clear mold East') - Reduces mold in a zone using Water.");
    console.log("4. Synthesize [Type] (e.g., 'synthesize water_to_carbon' or 'synthesize carbon_to_water') - Convert resources using Nitrogen.");
    console.log("5. Quit - End the game.");

    rl.question("Your action: ", async (input) => {
        const parts = input.trim().toLowerCase().split(' ');
        const command = parts[0];
        let actionTaken = false;

        switch (command) {
            case 'expand':
                if (parts.length > 1) {
                    actionTaken = expandZone(parts[1]);
                } else {
                    console.log("Please specify a zone to expand (e.g., 'expand North').");
                }
                break;
            case 'forage':
                actionTaken = forage();
                break;
            case 'clear':
                if (parts.length > 2 && parts[1] === 'mold') {
                    actionTaken = clearMold(parts[2]);
                } else {
                    console.log("Please specify a zone to clear mold from (e.g., 'clear mold East').");
                }
                break;
            case 'synthesize':
                if (parts.length > 1) {
                    actionTaken = synthesize(parts[1]);
                } else {
                    console.log("Please specify synthesis type ('water_to_carbon' or 'carbon_to_water').");
                }
                break;
            case 'quit':
            case '5':
                console.log("Exiting Mycelium Nexus. Goodbye!");
                gameState.gameRunning = false;
                break;
            default:
                console.log("Invalid action. Please choose from the options above.");
                break;
        }

        if (actionTaken) {
            await processTurn();
        } else {
            // If action failed or was invalid, re-prompt without advancing turn
            await promptAction();
        }
    });
}

async function processTurn() {
    if (!gameState.gameRunning) {
        rl.close();
        return;
    }

    gameState.turn++;
    applyTurnEffects();
    displayStatus();

    if (checkWinLoss()) {
        rl.close();
        return;
    }

    await promptAction();
}

function startGame() {
    console.log("Welcome to Mycelium Nexus!");
    console.log("Your mission: Connect the central Mycelium Hub to five distinct Forest Zones.");
    console.log("Manage Carbon (expansion), Water (mold clearing), and Nitrogen (synthesis).");
    console.log("Beware of toxic mold, which reduces your resource gathering efficiency.");
    console.log("Connect all zones to win. Run out of Carbon/Water or let mold overrun the network to lose.");
    console.log("\nStarting game...");
    processTurn(); // Start the first turn
}

// --- Initialize Game ---
startGame();
