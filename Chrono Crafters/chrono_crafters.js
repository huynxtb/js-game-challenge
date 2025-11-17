const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Game Constants
const REQUIRED_CHRONO_ARTIFACTS = 10;
const MAX_TIMELINE_STABILITY = 100;
const INITIAL_RESOURCES = {
  Moments: 10,
  Eras: 5,
  Events: 3
};

// Artifact definitions
// Each artifact costs some resource amounts and gives a stability boost
const ARTIFACTS = [
  {
    name: "Moment Shard",
    cost: { Moments: 3, Eras: 0, Events: 1 },
    stabilityBoost: 5
  },
  {
    name: "Era Fragment",
    cost: { Moments: 4, Eras: 2, Events: 0 },
    stabilityBoost: 8
  },
  {
    name: "Event Relic",
    cost: { Moments: 2, Eras: 1, Events: 3 },
    stabilityBoost: 10
  }
];

// Anomaly definitions
// Each anomaly requires fixing cost and causes a stability hit if not fixed
const ANOMALIES = [
  {
    name: "Time Ripple",
    fixCost: { Moments: 2, Eras: 0, Events: 0 },
    stabilityHit: 10,
    desc: "A ripple in the flow causes small disturbances."
  },
  {
    name: "Era Distortion",
    fixCost: { Moments: 1, Eras: 2, Events: 0 },
    stabilityHit: 15,
    desc: "An era begins to blur and lose definition."
  },
  {
    name: "Event Paradox",
    fixCost: { Moments: 0, Eras: 1, Events: 2 },
    stabilityHit: 20,
    desc: "A paradoxical event threatens to undo progress."
  }
];

// Game State
let gameState = {
  tick: 0,
  resources: { ...INITIAL_RESOURCES },
  chronoArtifacts: 0,
  timelineStability: MAX_TIMELINE_STABILITY,
  activeAnomaly: null
};

// Utility Functions
function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function displayStatus() {
  console.log('\n=== Chrono Crafters - Tick ' + gameState.tick + ' ===');
  console.log('Timeline Stability: ' + gameState.timelineStability + '/' + MAX_TIMELINE_STABILITY);
  console.log('Resources: Moments: ' + gameState.resources.Moments + ', Eras: ' + gameState.resources.Eras + ', Events: ' + gameState.resources.Events);
  console.log('Chrono Artifacts crafted: ' + gameState.chronoArtifacts + '/' + REQUIRED_CHRONO_ARTIFACTS);
  if (gameState.activeAnomaly) {
    console.log('\n!!! Temporal Anomaly Detected: ' + gameState.activeAnomaly.name + ' !!!');
    console.log(gameState.activeAnomaly.desc);
    console.log('Fix Cost: Moments: ' + gameState.activeAnomaly.fixCost.Moments + ', Eras: ' + gameState.activeAnomaly.fixCost.Eras + ', Events: ' + gameState.activeAnomaly.fixCost.Events);
  }
  console.log('');
}

function canAfford(cost, resources) {
  return Object.keys(cost).every(r => resources[r] >= cost[r]);
}

function consumeResources(cost, resources) {
  Object.keys(cost).forEach(r => {
    resources[r] -= cost[r];
  });
}

function generateResources() {
  // Each tick generates some resources randomly
  // Moments rare, Events somewhat common, Eras rarest
  const generated = {
    Moments: Math.floor(Math.random() * 3),
    Eras: Math.floor(Math.random() * 2),
    Events: Math.floor(Math.random() * 2)
  };
  Object.keys(generated).forEach(r => {
    gameState.resources[r] += generated[r];
  });
  console.log('Resource generation this tick: Moments +' + generated.Moments + ', Eras +' + generated.Eras + ', Events +' + generated.Events);
}

function spawnAnomaly() {
  // 30% chance per tick to spawn anomaly if none active
  if (!gameState.activeAnomaly && Math.random() < 0.3) {
    const anomaly = ANOMALIES[Math.floor(Math.random() * ANOMALIES.length)];
    gameState.activeAnomaly = { ...anomaly };
    console.log('\n[Alert] A temporal anomaly has emerged: ' + anomaly.name + '!');
  }
}

function repairAnomaly() {
  if (!gameState.activeAnomaly) {
    console.log('No anomalies to repair.');
    return false;
  }
  if (!canAfford(gameState.activeAnomaly.fixCost, gameState.resources)) {
    console.log('Insufficient resources to repair the anomaly.');
    return false;
  }
  consumeResources(gameState.activeAnomaly.fixCost, gameState.resources);
  console.log('You have repaired the anomaly: ' + gameState.activeAnomaly.name + '. Timeline stability restored by 10.');
  gameState.timelineStability = Math.min(MAX_TIMELINE_STABILITY, gameState.timelineStability + 10);
  gameState.activeAnomaly = null;
  return true;
}

function craftArtifact() {
  console.log('\nAvailable Time Artifacts to craft:');
  ARTIFACTS.forEach((artifact, idx) => {
    const costDesc = `Moments: ${artifact.cost.Moments}, Eras: ${artifact.cost.Eras}, Events: ${artifact.cost.Events}`;
    console.log(`${idx + 1}. ${artifact.name} (Cost: ${costDesc}, Stability Boost: ${artifact.stabilityBoost})`);
  });
  return prompt('Choose artifact to craft (number) or press Enter to cancel: ').then(choice => {
    if (!choice) {
      console.log('Cancelled crafting.');
      return false;
    }
    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= ARTIFACTS.length) {
      console.log('Invalid choice.');
      return false;
    }
    const artifact = ARTIFACTS[idx];
    if (!canAfford(artifact.cost, gameState.resources)) {
      console.log('Insufficient resources to craft this artifact.');
      return false;
    }
    consumeResources(artifact.cost, gameState.resources);
    gameState.chronoArtifacts++;
    gameState.timelineStability = Math.min(MAX_TIMELINE_STABILITY, gameState.timelineStability + artifact.stabilityBoost);
    console.log(`You crafted a ${artifact.name}! Timeline stability increased by ${artifact.stabilityBoost}.`);
    return true;
  });
}

function checkLossConditions() {
  if (gameState.timelineStability <= 0) {
    console.log('\n[Timeline Collapse] The timeline stability has reached zero. The timeline has collapsed into chaotic paradoxes.');
    return true;
  }
  const noResourcesLeft = Object.values(gameState.resources).every(amount => amount <= 0);
  if (noResourcesLeft && (gameState.activeAnomaly || gameState.chronoArtifacts < REQUIRED_CHRONO_ARTIFACTS)) {
    console.log('\n[Resource Depletion] All temporal resources depleted, unable to repair anomalies or craft artifacts.');
    return true;
  }
  return false;
}

function checkWinCondition() {
  if (gameState.chronoArtifacts >= REQUIRED_CHRONO_ARTIFACTS) {
    console.log('\n[Victory] You have successfully stabilized the timeline by crafting the required Chrono Artifacts! Time flows safely once more.');
    return true;
  }
  return false;
}

async function playerTurn() {
  console.log('Choose your action this tick:');
  console.log('1. Craft a Time Artifact');
  console.log('2. Repair a Temporal Anomaly');
  console.log('3. Do nothing / Wait');
  let choice = await prompt('Enter choice number: ');

  switch(choice.trim()) {
    case '1':
      await craftArtifact();
      break;
    case '2':
      repairAnomaly();
      break;
    case '3':
      console.log('You chose to wait this tick.');
      break;
    default:
      console.log('Invalid input, please choose 1, 2 or 3.');
      return await playerTurn(); // re-prompt
  }
}

async function gameLoop() {
  while (true) {
    gameState.tick++;
    displayStatus();

    generateResources();
    spawnAnomaly();

    await playerTurn();

    // Apply penalty if anomaly not fixed
    if (gameState.activeAnomaly) {
      gameState.timelineStability -= gameState.activeAnomaly.stabilityHit;
      console.log(`\nWarning: The anomaly '${gameState.activeAnomaly.name}' is unresolved. Timeline stability reduced by ${gameState.activeAnomaly.stabilityHit}.`);
    }

    if (checkLossConditions()) {
      break;
    }
    if (checkWinCondition()) {
      break;
    }
  }
  console.log('\nGame Over. Thank you for playing Chrono Crafters.');
  rl.close();
}

function showIntro() {
  console.log('Welcome to Chrono Crafters!');
  console.log('You are the master of time, tasked with managing temporal resources to build and maintain a stable timeline before it collapses into chaotic paradoxes.');
  console.log('');
  console.log('Core Gameplay:');
  console.log('- Each turn is a Tick representing the passage of time.');
  console.log('- Manage three temporal resources: Moments, Eras, and Events.');
  console.log('- Craft Time Artifacts to boost timeline stability.');
  console.log('- Random temporal anomalies can occur and must be repaired.');
  console.log('- Balance resource generation, artifact crafting, and anomaly fixing.');
  console.log('');
  console.log('Win by crafting ' + REQUIRED_CHRONO_ARTIFACTS + ' Chrono Artifacts and maintaining timeline stability.');
  console.log('Lose if timeline stability falls to zero or resources are depleted and you cannot act.');
  console.log('');
  console.log("Let's begin... Good luck!\n");
}

(async () => {
  showIntro();
  await gameLoop();
})();
