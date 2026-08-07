const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let state = {
  budget: 10000,
  pressure: 0,
  heat: 0,
  power: 0,
  integrity: 100,
  efficiency: 1.0,
  turn: 1
};
function showStatus(msg) {
  console.clear();
  console.log("==================================================");
  console.log("             GEOTHERMAL GRIDMASTER                ");
  console.log("==================================================");
  console.log(` Turn: ${state.turn}`);
  console.log(` Budget: $${state.budget.toLocaleString()}`);
  console.log(` Power Generated: ${state.power.toLocaleString()} / 10,000 MW`);
  console.log(` Turbine Efficiency: ${(state.efficiency * 100).toFixed(0)}%`);
  console.log("--------------------------------------------------");
  console.log(` Core Heat: ${state.heat}°C / 1,000°C`);
  console.log(` Chamber Pressure: ${state.pressure}% / 100%`);
  console.log(` Structural Integrity: ${state.integrity}%`);
  console.log("==================================================");
  if (msg) {
    console.log(` STATUS: ${msg}`);
    console.log("==================================================");
  }
  console.log(" Choose an action:");
  console.log(" 1) Inject Coolant   (Costs $1,000 | -200°C Heat, -10% Pressure)");
  console.log(" 2) Vent Steam       (Free         | +50°C Heat, -30% Pressure)");
  console.log(" 3) Upgrade Turbines (Costs $3,000 | +25% Efficiency)");
  console.log(" 4) Repair Grid      (Costs $2,000 | +30% Integrity)");
  console.log(" 5) Do Nothing       (Free)");
  console.log("--------------------------------------------------");
}
function checkGameOver() {
  if (state.power >= 10000) {
    console.log("\n*** VICTORY! ***");
    console.log(`You successfully generated ${state.power.toLocaleString()} MW of clean energy!`);
    console.log(`Final Budget: $${state.budget.toLocaleString()}`);
    rl.close();
    return true;
  }
  if (state.budget < 0) {
    console.log("\n*** GAME OVER: BANKRUPTCY ***");
    console.log("You ran out of funds to maintain the plant.");
    rl.close();
    return true;
  }
  if (state.pressure >= 100) {
    console.log("\n*** GAME OVER: VOLCANIC MELTDOWN ***");
    console.log("Chamber pressure hit 100%! The volcano erupted!");
    rl.close();
    return true;
  }
  if (state.integrity <= 0) {
    console.log("\n*** GAME OVER: STRUCTURAL COLLAPSE ***");
    console.log("The power grid collapsed due to structural failure.");
    rl.close();
    return true;
  }
  return false;
}
function gameLoop(msg = "") {
  if (checkGameOver()) return;
  showStatus(msg);
  rl.question("Enter action (1-5): ", (answer) => {
    const choice = parseInt(answer.trim(), 10);
    if (isNaN(choice) || choice < 1 || choice > 5) {
      gameLoop("Invalid input. Enter a number between 1 and 5.");
      return;
    }
    let actionMsg = "";
    switch (choice) {
      case 1:
        state.budget -= 1000;
        state.heat = Math.max(0, state.heat - 200);
        state.pressure = Math.max(0, state.pressure - 10);
        actionMsg = "Injected coolant.";
        break;
      case 2:
        state.pressure = Math.max(0, state.pressure - 30);
        state.heat = Math.min(1000, state.heat + 50);
        actionMsg = "Vented steam.";
        break;
      case 3:
        state.budget -= 3000;
        state.efficiency += 0.25;
        actionMsg = "Upgraded turbines.";
        break;
      case 4:
        state.budget -= 2000;
        state.integrity = Math.min(100, state.integrity + 30);
        actionMsg = "Repaired grid.";
        break;
      case 5:
        actionMsg = "Did nothing.";
        break;
    }
    state.heat = Math.min(1000, state.heat + 100);
    state.pressure = Math.min(100, state.pressure + 10);
    const powerGen = Math.floor(state.heat * state.efficiency * 0.5);
    state.power += powerGen;
    let heatDamage = 0;
    if (state.heat > 600) {
      heatDamage = Math.floor((state.heat - 600) / 100) * 5;
      state.integrity = Math.max(0, state.integrity - heatDamage);
    }
    let envMsg = `Heat +100°C, Pressure +10%, Generated ${powerGen} MW.`;
    if (heatDamage > 0) envMsg += ` Heat damage: -${heatDamage}% integrity.`;
    let eventMsg = "";
    if (Math.random() < 0.35) {
      const eventRoll = Math.floor(Math.random() * 3);
      if (eventRoll === 0) {
        state.integrity = Math.max(0, state.integrity - 15);
        state.pressure = Math.min(100, state.pressure + 20);
        eventMsg = "Seismic Tremor! Integrity -15%, Pressure +20%.";
      } else if (eventRoll === 1) {
        state.heat = Math.min(1000, state.heat + 150);
        eventMsg = "Heat Spike! Heat +150°C.";
      } else {
        state.budget += 2000;
        eventMsg = "Subsidy Grant! Budget +$2,000.";
      }
    }
    state.turn++;
    const combinedMsg = `${actionMsg} | ${envMsg}${eventMsg ? ' | ' + eventMsg : ''}`;
    gameLoop(combinedMsg);
  });
}
console.clear();
gameLoop("Welcome to Geothermal Gridmaster. Manage the plant and reach 10,000 MW!");