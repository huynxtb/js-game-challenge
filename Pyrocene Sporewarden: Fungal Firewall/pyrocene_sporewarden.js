const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const gridSize = 4;
const maxTurns = 15;
const minTemp = 40;
const maxTemp = 85;
const initialCoreIntegrity = 100;
const biomassGoal = 300;

let biomass = 0;
let thermalGradient = 60;
let moistureReservoir = 100;
let coreIntegrity = initialCoreIntegrity;
let turnCounter = 0;

const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('Stable'));

const strains = {
  CaldoRhizome: { type: 'Caldo-Rhizome', effect: 'absorbs heat, produces Biomass', tempTolerance: 85 },
  SilicateBinder: { type: 'Silicate Binder', effect: 'repairs fissures, reduces magma spread', tempTolerance: 75 },
  VaporPuffball: { type: 'Vapor Puffball', effect: 'releases moisture, suppresses ash', tempTolerance: 70 }
};

function displayStatus() {
  console.clear();
  console.log(`Turn: ${turnCounter + 1}/${maxTurns}`);
  console.log(`Core Integrity: ${coreIntegrity}%`);
  console.log(`Biomass: ${biomass}`);
  console.log(`Moisture Reservoir: ${moistureReservoir}L`);
  console.log(`Thermal Gradient: ${thermalGradient}°C`);
  console.log('\nGrid Status:');
  grid.forEach(row => console.log(row.join(' | ')));
}

function updateEnvironment() {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === 'Fissure Venting') {
        thermalGradient += 5;
        if (thermalGradient > 100) coreIntegrity -= 10;
      } else if (grid[i][j] === 'Magma Breach') {
        coreIntegrity -= 20;
      } else if (grid[i][j] === 'Ash Choked') {
        moistureReservoir -= 10;
      }
    }
  }
  if (thermalGradient < minTemp) thermalGradient = minTemp;
  if (thermalGradient > maxTemp) thermalGradient = maxTemp;
}

function playerAction(action) {
  const [cmd, row, col, strain] = action.split(' ');
  const r = parseInt(row);
  const c = parseInt(col);

  if (cmd === 'Inoculate' && strains[strain]) {
    if (biomass >= 50) {
      grid[r][c] = strains[strain].type;
      biomass -= 50;
      console.log(`Inoculated ${strains[strain].type} in sector (${r}, ${c}).`);
    } else {
      console.log('Not enough biomass to inoculate.');
    }
  } else if (cmd === 'Inject' && strain === 'Coolant') {
    if (moistureReservoir >= 20) {
      thermalGradient -= 10;
      moistureReservoir -= 20;
      console.log('Injected coolant, reducing thermal gradient.');
    } else {
      console.log('Not enough moisture to inject coolant.');
    }
  } else if (cmd === 'Harvest') {
    if (grid[r][c] === 'Caldo-Rhizome') {
      biomass += 30;
      console.log('Harvested biomass from Caldo-Rhizome.');
    } else {
      console.log('No harvestable hyphae in this sector.');
    }
  } else {
    console.log('Invalid action or parameters.');
  }
}

function checkWinCondition() {
  if (turnCounter >= maxTurns) {
    if (coreIntegrity > 0 && biomass >= biomassGoal) {
      console.log('Victory! You have successfully defended the bastion.');
    } else {
      console.log('Defeat! The bastion has fallen.');
    }
    process.exit();
  }
}

function gameLoop() {
  displayStatus();
  rl.question('Enter your actions (e.g., Inoculate 0 0 CaldoRhizome): ', (input) => {
    const actions = input.split(';');
    actions.forEach(action => playerAction(action.trim()));
    updateEnvironment();
    turnCounter++;
    checkWinCondition();
    gameLoop();
  });
}

gameLoop();