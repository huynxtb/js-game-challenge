const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let state = {
  depth: 0,
  hull: 100,
  oxygen: 100,
  battery: 100,
  specimens: []
};

const SPECIMENS_POOL = {
  shallow: ["Giant Isopod", "Dumbo Octopus"],
  mid: ["Fangtooth Fish", "Bioluminescent Jellyfish"],
  deep: ["Hadopelagic Amphipod", "Ghost Snailfish", "Mariana Snailfish"]
};

let logMessage = "Welcome to Hadopelagic Pressure. Dive to begin your expedition.";

function clearConsole() {
  console.clear();
}

function getSpecimenForDepth(depth) {
  let pool = [];
  if (depth <= 1500) pool = SPECIMENS_POOL.shallow;
  else if (depth <= 3500) pool = SPECIMENS_POOL.mid;
  else pool = SPECIMENS_POOL.deep;
  return pool[Math.floor(Math.random() * pool.length)];
}

function triggerHazard() {
  if (Math.random() > 0.2) return "";
  const hazards = [
    { name: "Pressure Leak", action: () => { state.hull -= 15; return "A sudden pressure leak damages the hull by 15%!"; } },
    { name: "Hydrothermal Vent", action: () => { state.battery = Math.min(100, state.battery + 20); state.hull -= 5; return "A hydrothermal vent turbulence damages the hull by 5% but recharges battery by 20%!"; } },
    { name: "Giant Squid Attack", action: () => { state.hull -= 25; return "A Giant Squid attacks the submarine! Hull damaged by 25%!"; } }
  ];
  const hazard = hazards[Math.floor(Math.random() * hazards.length)];
  return hazard.action();
}

function checkGameOver() {
  if (state.hull <= 0) {
    endGame(false, "Hull integrity compromised. The submarine imploded under intense pressure.");
    return true;
  }
  if (state.oxygen <= 0) {
    endGame(false, "Oxygen depleted. The crew suffocated.");
    return true;
  }
  if (state.battery <= 0) {
    endGame(false, "Battery depleted. Systems shut down, leaving you stranded in the abyss.");
    return true;
  }
  if (state.depth === 0 && state.specimens.length >= 5) {
    endGame(true, "Expedition successful! You returned to the surface with " + state.specimens.length + " unique specimens.");
    return true;
  }
  return false;
}

function endGame(win, message) {
  clearConsole();
  console.log("========================================");
  console.log(win ? "MISSION SUCCESSFUL" : "MISSION FAILED");
  console.log("========================================");
  console.log(message);
  console.log("\nFinal Stats:");
  console.log(`Depth: ${state.depth}m`);
  console.log(`Hull: ${state.hull}%`);
  console.log(`Oxygen: ${state.oxygen}%`);
  console.log(`Battery: ${state.battery}%`);
  console.log(`Specimens Collected (${state.specimens.length}): ${state.specimens.join(', ') || 'None'}`);
  console.log("========================================");
  rl.close();
}

function gameLoop() {
  if (checkGameOver()) return;

  clearConsole();
  console.log("========================================");
  console.log("          HADOPELAGIC PRESSURE          ");
  console.log("========================================");
  console.log(`Depth: ${state.depth}m`);
  console.log(`Hull Integrity: ${state.hull}%`);
  console.log(`Oxygen Level: ${state.oxygen}%`);
  console.log(`Battery Charge: ${state.battery}%`);
  console.log(`Specimens [${state.specimens.length}/5]: ${state.specimens.join(', ') || 'None'}`);
  console.log("----------------------------------------");
  console.log(`Status: ${logMessage}`);
  console.log("----------------------------------------");
  console.log("Choose Action:");
  console.log("1. Dive (+500m, -10% Battery, -5% Oxygen)");
  console.log("2. Ascend (-500m, -10% Battery, -5% Oxygen)");
  console.log("3. Search (-15% Battery, -10% Oxygen)");
  console.log("4. Repair (-20% Battery, +25% Hull) [Only depth < 2000m]");
  console.log("5. Conserve (+10% Battery, -10% Oxygen)");
  console.log("6. Abort Mission (Exit)");
  console.log("========================================");

  rl.question("Enter choice (1-6): ", (choice) => {
    let actionTaken = false;
    let hazardMsg = "";
    logMessage = "";

    switch (choice.trim()) {
      case '1':
        state.depth += 500;
        state.battery -= 10;
        state.oxygen -= 5;
        logMessage = "Dived 500m deeper.";
        actionTaken = true;
        break;
      case '2':
        if (state.depth === 0) {
          logMessage = "Already at the surface.";
        } else {
          state.depth = Math.max(0, state.depth - 500);
          state.battery -= 10;
          state.oxygen -= 5;
          logMessage = "Ascended 500m.";
          actionTaken = true;
        }
        break;
      case '3':
        if (state.depth === 0) {
          logMessage = "No specimens can be found at the surface. Dive deeper.";
        } else {
          state.battery -= 15;
          state.oxygen -= 10;
          actionTaken = true;
          const successRate = Math.min(0.8, 0.2 + (state.depth / 10000));
          if (Math.random() < successRate) {
            const specimen = getSpecimenForDepth(state.depth);
            if (state.specimens.includes(specimen)) {
              logMessage = `Found a ${specimen}, but you already have one.`;
            } else {
              state.specimens.push(specimen);
              logMessage = `Success! Collected a new specimen: ${specimen}.`;
            } 
          } else {
            logMessage = "Search failed. No specimens detected here.";
          }
        }
        break;
      case '4':
        if (state.depth >= 2000) {
          logMessage = "Pressure is too high to perform repairs. Ascend above 2000m.";
        } else if (state.battery < 20) {
          logMessage = "Not enough battery to perform repairs.";
        } else {
          state.battery -= 20;
          state.hull = Math.min(100, state.hull + 25);
          logMessage = "Hull repaired by 25%.";
          actionTaken = true;
        }
        break;
      case '5':
        state.battery = Math.min(100, state.battery + 10);
        state.oxygen -= 10;
        logMessage = "Conserving power. Battery recharged by 10%.";
        actionTaken = true;
        break;
      case '6':
        endGame(false, "Mission aborted by the crew.");
        return;
      default:
        logMessage = "Invalid choice. Select 1-6.";
        break;
    }

    if (actionTaken) {
      hazardMsg = triggerHazard();
      if (hazardMsg) {
        logMessage += " " + hazardMsg;
      }
    }

    state.hull = Math.max(0, state.hull);
    state.battery = Math.max(0, state.battery);
    state.oxygen = Math.max(0, state.oxygen);

    gameLoop();
  });
}

gameLoop();