const readline = require('readline');

// Game constants
const TARGET_SALVAGE = 100;
const MAX_SHIP_INTEGRITY = 100;
const MAX_CREW_STAMINA = 100;

// Initialize game state
let shipIntegrity = MAX_SHIP_INTEGRITY;
let crewStamina = MAX_CREW_STAMINA;
let salvageResources = 0;
let turnCount = 0;
let gameOver = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printStatus() {
  console.log('\n===== STATUS =====');
  console.log(`Ship Integrity: ${shipIntegrity}/${MAX_SHIP_INTEGRITY}`);
  console.log(`Crew Stamina: ${crewStamina}/${MAX_CREW_STAMINA}`);
  console.log(`Salvage Collected: ${salvageResources} / ${TARGET_SALVAGE}`);
  console.log('==================\n');
}

function randomChance(chancePercent) {
  return Math.random() * 100 < chancePercent;
}

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim().toLowerCase()));
  });
}

function hazardDamage() {
  // Hazard damage varies randomly
  return Math.floor(Math.random() * 15) + 5; // 5 to 19 damage
}

function staminaCost(min, max) {
  // Stamina cost between min and max inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function exploreEvent() {
  const eventRoll = Math.random();

  if (eventRoll < 0.4) {
    // Equipment Malfunction
    const damage = hazardDamage();
    shipIntegrity = Math.max(shipIntegrity - damage, 0);
    console.log(`While exploring, your ship's equipment malfunctions, causing ${damage} damage to ship integrity.`);
  } else if (eventRoll < 0.7) {
    // Alien Encounter
    const damage = hazardDamage();
    crewStamina = Math.max(crewStamina - damage, 0);
    console.log(`An aggressive alien creature attacks your crew! Crew stamina reduced by ${damage}.`);
  } else if (eventRoll < 0.9) {
    // Hidden Treasure
    const found = Math.floor(Math.random() * 15) + 5;
    salvageResources += found;
    console.log(`You discover a hidden cache of salvage worth ${found} resources!`);
  } else {
    // Calm exploration
    const found = Math.floor(Math.random() * 10) + 1;
    salvageResources += found;
    console.log(`The exploration yields some small salvage: ${found} resources.`);
  }
}

function salvageAction() {
  // Salvaging always costs stamina
  const staminaUsed = staminaCost(10, 18);
  if (crewStamina < staminaUsed) {
    console.log(`You try to salvage but don't have enough stamina (need ${staminaUsed}).`);
    return;
  }

  crewStamina -= staminaUsed;

  // Chance of hazard
  if (randomChance(25)) {
    const damage = hazardDamage();
    shipIntegrity = Math.max(shipIntegrity - damage, 0);
    console.log(`During salvage, a structural collapse injures your ship causing ${damage} damage!`);
  }

  // Salvage gained depends on stamina used
  const gained = Math.floor(staminaUsed * (Math.random() * 0.8 + 0.6)); // between 60%-140% of stamina used
  salvageResources += gained;
  console.log(`You expend ${staminaUsed} stamina collecting salvage worth ${gained} resources.`);
}

function repairAction() {
  // Repair costs salvage resources
  if (salvageResources <= 0) {
    console.log("You have no salvage to use for repairs.");
    return;
  }

  const maxRepairPossible = Math.min(salvageResources, MAX_SHIP_INTEGRITY - shipIntegrity);
  if (maxRepairPossible === 0) {
    console.log("Your ship's integrity is already at maximum.");
    return;
  }

  // Prompt how much salvage to use for repair
  return new Promise(async (resolve) => {
    while(true) {
      let answer = await promptUser(`You have ${salvageResources} salvage. Enter amount to use for repairs (max ${maxRepairPossible}): `);
      const amount = parseInt(answer, 10);
      if (!isNaN(amount) && amount > 0 && amount <= maxRepairPossible) {
        salvageResources -= amount;
        shipIntegrity += amount;
        console.log(`Used ${amount} salvage to repair ship. Ship integrity restored to ${shipIntegrity}.`);
        resolve();
        break;
      } else {
        console.log("Invalid input. Please enter a valid number within the allowed range.");
      }
    }
  });
}

function restAction() {
  // Rest restores stamina but costs ship integrity slightly due to system idling
  const staminaRestored = Math.floor(MAX_CREW_STAMINA * 0.3); // restore 30% stamina
  crewStamina = Math.min(crewStamina + staminaRestored, MAX_CREW_STAMINA);

  if (salvageResources >= TARGET_SALVAGE) {
    // Player can choose to return after enough salvage
    console.log(`You have collected enough salvage (${salvageResources} units) and decide to return to base safely.`);
    console.log('MISSION ACCOMPLISHED. YOU WIN!');
    gameOver = true;
    return;
  }

  // Small chance ship integrity drops slightly during rest from system wear
  if (randomChance(20)) {
    const damage = Math.floor(Math.random() * 6) + 1; // 1-6 damage
    shipIntegrity = Math.max(shipIntegrity - damage, 0);
    console.log(`While resting, minor system faults cause ${damage} damage to ship integrity.`);
  } else {
    console.log("Crew rest peacefully, recovering stamina.");
  }
}

async function playerTurn() {
  printStatus();

  let promptMsg = `Choose your action:
` +
    `  [E]xplore - Search the derelict ship for salvage but risk hazards.
` +
    `  [S]alvage - Collect resources, consuming stamina, with some risk.
` +
    `  [R]epair - Use salvage to repair ship integrity.
` +
    `  [St] rest - Skip exploring to restore crew stamina.
` +
    `Your choice? `;

  let validActions = ['e', 's', 'r', 'st'];

  while(true) {
    let answer = await promptUser(promptMsg);
    if (validActions.includes(answer)) {
      if (answer === 'e') {
        // Explore action
        const staminaNeeded = staminaCost(8, 15);
        if (crewStamina < staminaNeeded) {
          console.log(`Not enough stamina to explore (need ${staminaNeeded}). Choose another action.`);
          continue;
        }
        crewStamina -= staminaNeeded;
        console.log(`Exploring the derelict ship costs ${staminaNeeded} stamina.`);
        exploreEvent();
        break;
      } else if (answer === 's') {
        salvageAction();
        break;
      } else if (answer === 'r') {
        await repairAction();
        break;
      } else if (answer === 'st') {
        restAction();
        break;
      }
    } else {
      console.log("Invalid choice. Please enter 'E', 'S', 'R', or 'St'.");
    }
  }

  turnCount++;

  // Check Game Over Conditions
  if (crewStamina <= 0) {
    console.log("Your crew has become incapacitated due to exhaustion. Mission failed.");
    gameOver = true;
  } else if (shipIntegrity <= 0) {
    console.log("Your ship's integrity has fallen to zero and it is destroyed. Mission failed.");
    gameOver = true;
  }
}

async function main() {
  console.log("Welcome to Starship Salvage!");
  console.log("You are the captain of a salvage crew exploring derelict starships.");
  console.log(`Your goal is to collect at least ${TARGET_SALVAGE} salvage resources and return to base safely.`);
  console.log("Manage your crew stamina and ship's integrity carefully to survive hazards.");

  while(!gameOver) {
    await playerTurn();
  }

  console.log('\nGame Over. Thank you for playing Starship Salvage.');
  rl.close();
}

main();
