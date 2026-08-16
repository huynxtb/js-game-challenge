const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const GRID_SIZE = 5;
const START_X = 2;
const START_Y = 0;

const STATE = {
    player: {
        x: START_X,
        y: START_Y,
        oxygen: 100,
        power: 100,
        light: 100,
        artifacts: 0
    },
    grid: [],
    gameOver: false
};

function initGrid() {
    for (let y = 0; y < GRID_SIZE; y++) {
        STATE.grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            STATE.grid[y][x] = {
                type: 'empty',
                scanned: false,
                cleared: false,
                hazardTriggered: false
            };
        }
    }

    STATE.grid[START_Y][START_X].scanned = true;

    const placements = [
        { type: 'artifact' }, { type: 'artifact' }, { type: 'artifact' },
        { type: 'oxygen_cache' }, { type: 'oxygen_cache' },
        { type: 'power_cache' }, { type: 'power_cache' },
        { type: 'hazard_squid' }, { type: 'hazard_vent' }, { type: 'hazard_current' }
    ];

    placements.forEach(item => {
        let placed = false;
        while (!placed) {
            const rx = Math.floor(Math.random() * GRID_SIZE);
            const ry = 1 + Math.floor(Math.random() * (GRID_SIZE - 1));
            if (STATE.grid[ry][rx].type === 'empty') {
                STATE.grid[ry][rx].type = item.type;
                placed = true;
            }
        }
    });
}

function printStatus() {
    console.log('\n==================================================');
    console.log(` AURORA ABYSSAL | Depth: ${STATE.player.y * 100}m`);
    console.log(` Oxygen: [${STATE.player.oxygen}%] | Power: [${STATE.player.power}%] | Light: [${STATE.player.light}%]`);
    console.log(` Artifacts Recovered: ${STATE.player.artifacts}/3`);
    console.log('==================================================');
    printMap();
}

function printMap() {
    for (let y = 0; y < GRID_SIZE; y++) {
        let rowStr = '';
        for (let x = 0; x < GRID_SIZE; x++) {
            if (x === STATE.player.x && y === STATE.player.y) {
                rowStr += ' [SUB] ';
            } else {
                const cell = STATE.grid[y][x];
                if (!cell.scanned) {
                    rowStr += ' [ ? ] ';
                } else {
                    if (cell.cleared) {
                        rowStr += ' [ . ] ';
                    } else {
                        switch (cell.type) {
                            case 'empty': rowStr += ' [ . ] '; break;
                            case 'artifact': rowStr += ' [ART] '; break;
                            case 'oxygen_cache': rowStr += ' [O2 ] '; break;
                            case 'power_cache': rowStr += ' [PWR] '; break;
                            case 'hazard_squid': rowStr += ' [SQD] '; break;
                            case 'hazard_vent': rowStr += ' [VNT] '; break;
                            case 'hazard_current': rowStr += ' [CUR] '; break;
                            default: rowStr += ' [ . ] ';
                        }
                    }
                }
            }
        }
        console.log(rowStr);
    }
    console.log('');
}

function checkResources() {
    if (STATE.player.oxygen <= 0) {
        console.log('\n[CRITICAL] Life support failure. Oxygen depleted. You lost.');
        STATE.gameOver = true;
    } else if (STATE.player.power <= 0) {
        console.log('\n[CRITICAL] Engine failure. Power depleted. You lost.');
        STATE.gameOver = true;
    } else if (STATE.player.light <= 0) {
        console.log('\n[CRITICAL] Navigation failure. Light depleted. You lost.');
        STATE.gameOver = true;
    }
    return !STATE.gameOver;
}

function checkWin() {
    if (STATE.player.x === START_X && STATE.player.y === START_Y && STATE.player.artifacts === 3) {
        console.log('\n[SUCCESS] You returned to the surface with all 3 artifacts! You won!');
        STATE.gameOver = true;
        return true;
    }
    return false;
}

function triggerHazard(cell) {
    if (cell.hazardTriggered || cell.cleared) return;
    cell.hazardTriggered = true;
    cell.cleared = true;

    if (cell.type === 'hazard_squid') {
        console.log('\n[HAZARD] A Giant Squid attacks! Hull integrity compromised. Lost 20 Oxygen, 10 Light.');
        STATE.player.oxygen -= 20;
        STATE.player.light -= 10;
    } else if (cell.type === 'hazard_vent') {
        console.log('\n[HAZARD] Hydrothermal Vent eruption! Systems overloaded. Lost 25 Power.');
        STATE.player.power -= 25;
    } else if (cell.type === 'hazard_current') {
        console.log('\n[HAZARD] Crushing Currents drag the sub. Lost 15 Oxygen, 15 Power.');
        STATE.player.oxygen -= 15;
        STATE.player.power -= 15;
    }
}

function move(dir) {
    let targetX = STATE.player.x;
    let targetY = STATE.player.y;

    switch (dir.toLowerCase()) {
        case 'n': targetY--; break;
        case 's': targetY++; break;
        case 'e': targetX++; break;
        case 'w': targetX--; break;
        default:
            console.log('Invalid direction. Use N, S, E, or W.');
            return;
    }

    if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
        console.log('Movement blocked by trench wall.');
        return;
    }

    STATE.player.x = targetX;
    STATE.player.y = targetY;
    STATE.player.oxygen -= 5;
    STATE.player.power -= 5;
    STATE.player.light -= 3;

    const cell = STATE.grid[targetY][targetX];
    if (!cell.scanned) {
        if (cell.type.startsWith('hazard')) {
            triggerHazard(cell);
        }
        cell.scanned = true;
    } else if (cell.type.startsWith('hazard') && !cell.hazardTriggered) {
        triggerHazard(cell);
    }
}

function scan() {
    STATE.player.power -= 5;
    STATE.player.light -= 5;
    STATE.player.oxygen -= 2;

    const x = STATE.player.x;
    const y = STATE.player.y;

    const coords = [
        {cx: x, cy: y},
        {cx: x, cy: y - 1},
        {cx: x, cy: y + 1},
        {cx: x - 1, cy: y},
        {cx: x + 1, cy: y}
    ];

    coords.forEach(c => {
        if (c.cx >= 0 && c.cx < GRID_SIZE && c.cy >= 0 && c.cy < GRID_SIZE) {
            STATE.grid[c.cy][c.cx].scanned = true;
        }
    });
    console.log('\n[SCAN] Sonar ping completed. Surrounding area mapped.');
}

function salvage() {
    const cell = STATE.grid[STATE.player.y][STATE.player.x];
    if (cell.cleared || cell.type === 'empty') {
        console.log('Nothing to salvage here.');
        return;
    }

    STATE.player.power -= 2;
    STATE.player.oxygen -= 2;

    if (cell.type === 'artifact') {
        STATE.player.artifacts++;
        cell.cleared = true;
        console.log(`\n[SALVAGE] Ancient Artifact recovered! (${STATE.player.artifacts}/3)`);
    } else if (cell.type === 'oxygen_cache') {
        STATE.player.oxygen = Math.min(100, STATE.player.oxygen + 35);
        cell.cleared = true;
        console.log('\n[SALVAGE] Oxygen tanks recovered. Oxygen replenished.');
    } else if (cell.type === 'power_cache') {
        STATE.player.power = Math.min(100, STATE.player.power + 35);
        cell.cleared = true;
        console.log('\n[SALVAGE] Battery packs recovered. Power replenished.');
    } else {
        console.log('Nothing useful to salvage.');
    }
}

function recharge(type) {
    if (type === 'o2') {
        if (STATE.player.power < 20) {
            console.log('Not enough power to run life support generator.');
            return;
        }
        STATE.player.power -= 20;
        STATE.player.oxygen = Math.min(100, STATE.player.oxygen + 20);
        console.log('\n[SYSTEM] Converted 20 Power to 20 Oxygen.');
    } else if (type === 'light') {
        if (STATE.player.power < 15) {
            console.log('Not enough power to recharge floodlights.');
            return;
        }
        STATE.player.power -= 15;
        STATE.player.light = Math.min(100, STATE.player.light + 25);
        console.log('\n[SYSTEM] Converted 15 Power to 25 Light.');
    } else {
        console.log('Invalid recharge type. Use "o2" or "light".');
    }
}

function promptUser() {
    if (STATE.gameOver) {
        rl.close();
        return;
    }

    printStatus();
    rl.question('Commands: [N/S/E/W] Move | [scan] Sonar | [salvage] Collect | [recharge o2/light] | [exit]\nInput: ', (input) => {
        const cmd = input.trim().toLowerCase();
        const parts = cmd.split(' ');

        if (cmd === 'exit') {
            console.log('Mission aborted.');
            rl.close();
            return;
        } else if (['n', 's', 'e', 'w'].includes(cmd)) {
            move(cmd);
        } else if (cmd === 'scan') {
            scan();
        } else if (cmd === 'salvage') {
            salvage();
        } else if (parts[0] === 'recharge') {
            recharge(parts[1]);
        } else {
            console.log('Unknown command.');
        }

        if (checkWin()) return;
        if (!checkResources()) return;

        promptUser();
    });
}

console.log('==================================================');
console.log('                AURORA ABYSSAL                    ');
console.log('==================================================');
console.log('Objective: Retrieve 3 ancient artifacts from the');
console.log('abyssal depths and return to the surface (0m).');
console.log('Watch your Oxygen, Power, and Light levels.');
console.log('==================================================');

initGrid();
promptUser();
