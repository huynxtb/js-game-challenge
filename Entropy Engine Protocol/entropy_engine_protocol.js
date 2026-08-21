const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const SECTORS = {
    1: { name: 'Reactor Core', heat: 40, stress: 20, shielding: 80 },
    2: { name: 'Cooling Array', heat: 20, stress: 30, shielding: 50 },
    3: { name: 'Magnetic Ring', heat: 30, stress: 40, shielding: 60 },
    4: { name: 'Exhaust Vent', heat: 50, stress: 50, shielding: 30 }
};

let cycle = 1;
let ap = 3;
let log = ['System initialized. Maintain stability for 20 cycles.'];

const EVENTS = [
    { desc: 'Solar Flare: +20% Heat to Magnetic Ring', action: () => { SECTORS[3].heat += 20; } },
    { desc: 'Micro-Fracture: +20% Stress to Exhaust Vent', action: () => { SECTORS[4].stress += 20; } },
    { desc: 'Coolant Leak: +15% Heat to Cooling Array', action: () => { SECTORS[2].heat += 15; } },
    { desc: 'Shield Flicker: -15% Shielding to Reactor Core', action: () => { SECTORS[1].shielding -= 15; } },
    { desc: 'System Surge: +10% Heat to all sectors', action: () => { Object.values(SECTORS).forEach(s => s.heat += 10); } },
    { desc: 'Calm Cycle: No anomalies detected', action: () => {} }
];

function clamp(val, min = 0, max = 100) {
    return Math.min(Math.max(val, min), max);
}

function checkGameOver() {
    for (const key in SECTORS) {
        const s = SECTORS[key];
        if (s.heat >= 100) return { over: true, reason: `${s.name} overheated (Heat >= 100%)!` };
        if (s.stress >= 100) return { over: true, reason: `${s.name} suffered structural collapse (Stress >= 100%)!` };
        if (s.shielding <= 0) return { over: true, reason: `${s.name} magnetic containment failed (Shielding <= 0%)!` };
    }
    if (cycle > 20) return { over: true, win: true };
    return { over: false };
}

function printStatus() {
    console.clear();
    console.log('====================================================');
    console.log('             ENTROPY ENGINE PROTOCOL                ');
    console.log(` Cycle: ${cycle}/20 | Action Points (AP): ${ap}/3`);
    console.log('====================================================');
    console.log(' Sectors:');
    for (const key in SECTORS) {
        const s = SECTORS[key];
        console.log(`  [${key}] ${s.name.padEnd(15)} | Heat: ${s.heat}% | Stress: ${s.stress}% | Shielding: ${s.shielding}%`);
    }
    console.log('----------------------------------------------------');
    console.log(' Logs:');
    log.slice(-4).forEach(l => console.log(`  * ${l}`));
    console.log('----------------------------------------------------');
    console.log(' Commands:');
    console.log('  vent <sector_id>      - Vent Heat (-25% Heat, +10% Stress) [1 AP]');
    console.log('  reinforce <sector_id> - Reinforce Structure (-20% Stress) [1 AP]');
    console.log('  calibrate <sector_id> - Calibrate Shields (+30% Shielding) [1 AP]');
    console.log('  end                   - End Turn and progress cycle');
    console.log('  exit                  - Exit game');
    console.log('====================================================');
}

function endTurn() {
    for (const key in SECTORS) {
        const s = SECTORS[key];
        s.heat += 10;
        if (s.shielding < 40) {
            s.stress += 15;
            log.push(`Low shielding in ${s.name} caused +15% Stress.`);
        }
    }

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    event.action();
    log.push(`Event: ${event.desc}`);

    for (const key in SECTORS) {
        const s = SECTORS[key];
        s.heat = clamp(s.heat);
        s.stress = clamp(s.stress);
        s.shielding = clamp(s.shielding);
    }

    cycle++;
    ap = 3;

    const status = checkGameOver();
    if (status.over) {
        printStatus();
        if (status.win) {
            console.log('\n>>> MISSION SUCCESS: Entropy Engine stabilized for 20 cycles! <<<');
        } else {
            console.log(`\n>>> MISSION FAILED: ${status.reason} <<<`);
        }
        rl.close();
        process.exit(0);
    }
}

function handleInput(input) {
    const parts = input.trim().toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const target = parseInt(parts[1], 10);

    if (cmd === 'exit') {
        console.log('Exiting protocol...');
        rl.close();
        process.exit(0);
    }

    if (cmd === 'end') {
        endTurn();
        return;
    }

    if (['vent', 'reinforce', 'calibrate'].includes(cmd)) {
        if (ap <= 0) {
            log.push('Error: No Action Points (AP) remaining this turn.');
            return;
        }
        if (!SECTORS[target]) {
            log.push('Error: Invalid sector ID. Use 1, 2, 3, or 4.');
            return;
        }

        const s = SECTORS[target];
        if (cmd === 'vent') {
            s.heat = clamp(s.heat - 25);
            s.stress = clamp(s.stress + 10);
            log.push(`Vented Heat in ${s.name}.`);
        } else if (cmd === 'reinforce') {
            s.stress = clamp(s.stress - 20);
            log.push(`Reinforced structure in ${s.name}.`);
        } else if (cmd === 'calibrate') {
            s.shielding = clamp(s.shielding + 30);
            log.push(`Calibrated shields in ${s.name}.`);
        }
        ap--;

        const status = checkGameOver();
        if (status.over) {
            printStatus();
            console.log(`\n>>> MISSION FAILED: ${status.reason} <<<`);
            rl.close();
            process.exit(0);
        }
    } else {
        log.push(`Error: Unknown command "${cmd}".`);
    }
}

function gameLoop() {
    printStatus();
    rl.question('Enter command: ', (input) => {
        handleInput(input);
        gameLoop();
    });
}

gameLoop();