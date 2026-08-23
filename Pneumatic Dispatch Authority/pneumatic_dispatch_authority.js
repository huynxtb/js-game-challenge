const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let pressure = 80;
let integrity = 100;
let coal = 5;
let budget = 50;
let routedCount = 0;
const targetRouted = 30;
let currentCanister = null;
let currentEvent = null;
let logMessage = "Welcome to the Pneumatic Dispatch Authority.";

function generateCanister() {
  const destinations = ['High Court', 'Docks', 'Royal Palace', 'Parliament', 'Bank of England', 'Industrial Quarter'];
  const dest = destinations[Math.floor(Math.random() * destinations.length)];
  const diff = Math.floor(Math.random() * 15) + 10;
  const reward = Math.floor(Math.random() * 15) + 10;
  return { destination: dest, difficulty: diff, reward: reward };
}

function triggerEvent() {
  const roll = Math.random();
  if (roll < 0.15) {
    currentEvent = { name: 'Condensation Leak', effect: 'Integrity drops by 15% immediately.' };
    integrity = Math.max(0, integrity - 15);
  } else if (roll < 0.30) {
    currentEvent = { name: 'High Priority Message', effect: 'Double reward, but routing costs 50% more pressure.' };
  } else if (roll < 0.40) {
    currentEvent = { name: 'Coal Subsidy', effect: 'Received 2 free units of coal.' };
    coal += 2;
  } else {
    currentEvent = null;
  }
}

function checkGameOver() {
  if (pressure <= 0) {
    console.log("\n[GAME OVER] Steam pressure hit 0 PSI. The system has stalled.");
    rl.close();
    return true;
  }
  if (pressure > 150) {
    console.log("\n[GAME OVER] Steam pressure exceeded 150 PSI! The boiler exploded.");
    rl.close();
    return true;
  }
  if (integrity <= 0) {
    console.log("\n[GAME OVER] Pipe integrity hit 0%. The pneumatic network has collapsed.");
    rl.close();
    return true;
  }
  if (routedCount >= targetRouted) {
    console.log("\n[VICTORY] You successfully routed 30 canisters! The city honors your service.");
    rl.close();
    return true;
  }
  return false;
}

function gameLoop() {
  if (checkGameOver()) return;

  if (!currentCanister) {
    currentCanister = generateCanister();
    triggerEvent();
  }

  console.clear();
  console.log("==================================================");
  console.log("          PNEUMATIC DISPATCH AUTHORITY            ");
  console.log("==================================================");
  console.log(` Canisters Routed: ${routedCount}/${targetRouted}`);
  console.log(` Budget:           ${budget} shillings`);
  console.log(` Coal:             ${coal} units`);
  console.log(` Steam Pressure:   ${pressure} PSI (Safe: 1-150)`);
  console.log(` Pipe Integrity:   ${integrity}%`);
  console.log("--------------------------------------------------");
  if (currentEvent) {
    console.log(` EVENT: [${currentEvent.name}] - ${currentEvent.effect}`);
  } else {
    console.log(" EVENT: None");
  }
  console.log("--------------------------------------------------");
  console.log(" CURRENT CANISTER:");
  console.log(`   Destination: ${currentCanister.destination}`);
  let cost = currentCanister.difficulty;
  let reward = currentCanister.reward;
  if (currentEvent && currentEvent.name === 'High Priority Message') {
    cost = Math.floor(cost * 1.5);
    reward = reward * 2;
  }
  console.log(`   Pressure Cost: ${cost} PSI`);
  console.log(`   Reward:        ${reward} shillings`);
  console.log("--------------------------------------------------");
  if (logMessage) {
    console.log(` STATUS: ${logMessage}`);
    logMessage = "";
  }
  console.log("--------------------------------------------------");
  console.log(" ACTIONS:");
  console.log(" 1. Route Canister");
  console.log(" 2. Stoke Boiler (Uses 1 Coal, +20 PSI)");
  console.log(" 3. Vent Steam (-30 PSI)");
  console.log(" 4. Repair Pipes (Costs 15 shillings, +25% Integrity)");
  console.log(" 5. Buy Coal (Costs 10 shillings, +3 Coal)");
  console.log(" 6. Exit Game");
  console.log("--------------------------------------------------");

  rl.question("Enter action (1-6): ", (answer) => {
    const choice = answer.trim();
    let decay = 2 + Math.floor(pressure / 40);
    integrity = Math.max(0, integrity - decay);

    if (choice === '1') {
      if (pressure < cost) {
        logMessage = "Insufficient pressure to route canister!";
      } else {
        pressure -= cost;
        const roll = Math.random() * 100;
        if (roll <= integrity) {
          budget += reward;
          routedCount++;
          logMessage = `Successfully routed canister to ${currentCanister.destination}! Earned ${reward} shillings.`;
        } else {
          integrity = Math.max(0, integrity - 10);
          logMessage = `Routing failed! Canister lost in transit. Pipes damaged (-10% Integrity).`;
        }
        currentCanister = null;
        currentEvent = null;
      }
    } else if (choice === '2') {
      if (coal >= 1) {
        coal--;
        pressure += 20;
        logMessage = "Stoked boiler. Pressure increased by 20 PSI.";
      } else {
        logMessage = "No coal left!";
      }
    } else if (choice === '3') {
      pressure = Math.max(0, pressure - 30);
      logMessage = "Vented steam. Pressure decreased by 30 PSI.";
    } else if (choice === '4') {
      if (budget >= 15) {
        budget -= 15;
        integrity = Math.min(100, integrity + 25);
        logMessage = "Repaired pipes. Integrity increased by 25%.";
      } else {
        logMessage = "Insufficient budget to repair pipes!";
      }
    } else if (choice === '5') {
      if (budget >= 10) {
        budget -= 10;
        coal += 3;
        logMessage = "Bought 3 units of coal.";
      } else {
        logMessage = "Insufficient budget to buy coal!";
      }
    } else if (choice === '6') {
      console.log("Exiting game. Goodbye!");
      rl.close();
      return;
    } else {
      logMessage = "Invalid choice. Select 1-6.";
    }
    gameLoop();
  });
}

gameLoop();