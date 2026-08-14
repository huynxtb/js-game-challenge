const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let energy = 0;
let depth = 1000;
let temperature = 500;
let coolant = 5000;
let integrity = 100;
let stress = 0;
let turn = 1;

console.log("==================================================");
console.log("               SUBDUCTION SIPHON                  ");
console.log("==================================================");
console.log("Objective: Siphon 100,000 TW of geothermal energy.");
console.log("Avoid core meltdown (>3000C), structural failure (0%),");
console.log("or tectonic collapse (100% stress).");
console.log("==================================================");

function showStatus() {
  console.log(`\n--- TURN ${turn} ---`);
  console.log(`Accumulated Energy: ${Math.round(energy).toLocaleString()} / 100,000 TW`);
  console.log(`Drill Depth:        ${depth} meters`);
  console.log(`Core Temperature:   ${Math.round(temperature)}°C (Limit: 3000°C)`);
  console.log(`Coolant Level:      ${coolant} L`);
  console.log(`Tectonic Stress:    ${stress.toFixed(1)}% (Limit: 100%)`);
  console.log(`Station Integrity:  ${integrity}%`);
  console.log("--------------------------------------------------");
}

function checkGameOver() {
  if (energy >= 100000) {
    console.log("\n[VICTORY] Energy target achieved! The siphon station successfully harvested 100,000 TW.");
    rl.close();
    return true;
  }
  if (temperature > 3000) {
    console.log("\n[FAILURE] Core temperature exceeded 3000°C! The drill melted, causing a catastrophic thermal explosion.");
    rl.close();
    return true;
  }
  if (stress >= 100) {
    console.log("\n[FAILURE] Tectonic stress reached 100%! A massive earthquake collapsed the subduction zone.");
    rl.close();
    return true;
  }
  if (integrity <= 0) {
    console.log("\n[FAILURE] Structural integrity reached 0%! The station collapsed under tectonic pressure.");
    rl.close();
    return true;
  }
  return false;
}

function gameLoop() {
  if (checkGameOver()) return;
  showStatus();
  rl.question("Choose Action:\n(A) Drill Deeper\n(B) Inject Coolant\n(C) Vent Steam\n(D) Refit Station\n> ", (answer) => {
    const choice = answer.trim().toUpperCase();
    let valid = true;

    if (choice === 'A') {
      depth += 500;
      temperature += 400;
      stress += 15;
      console.log("\n[ACTION] Drilled deeper. Depth, temperature, and stress increased.");
    } else if (choice === 'B') {
      if (coolant >= 1500) {
        coolant -= 1500;
        temperature = Math.max(0, temperature - 800);
        console.log("\n[ACTION] Injected 1500L coolant. Temperature decreased.");
      } else {
        console.log("\n[ERROR] Insufficient coolant! Requires 1500L.");
        valid = false;
      }
    } else if (choice === 'C') {
      if (energy >= 5000) {
        energy -= 5000;
        stress = Math.max(0, stress - 25);
        temperature = Math.max(0, temperature - 300);
        console.log("\n[ACTION] Vented steam. Stress and temperature decreased. Consumed 5,000 TW.");
      } else {
        console.log("\n[ERROR] Insufficient energy to vent steam! Requires 5,000 TW.");
        valid = false;
      }
    } else if (choice === 'D') {
      if (energy >= 8000) {
        energy -= 8000;
        integrity = Math.min(100, integrity + 30);
        console.log("\n[ACTION] Refitted station. Integrity restored. Consumed 8,000 TW.");
      } else {
        console.log("\n[ERROR] Insufficient energy to refit! Requires 8,000 TW.");
        valid = false;
      }
    } else {
      console.log("\n[ERROR] Invalid choice. Select A, B, C, or D.");
      valid = false;
    }

    if (valid) {
      const generated = depth * (temperature / 1000) * 1.2;
      energy += generated;
      console.log(`[PASSIVE] Siphoned +${Math.round(generated).toLocaleString()} TW of energy.`);

      const tempRise = depth * 0.08;
      temperature += tempRise;

      const stressRise = (depth / 2000) * (temperature / 1000) * (Math.random() * 5 + 2);
      stress += stressRise;

      let decay = 0;
      if (temperature > 2000) decay += 10;
      if (stress > 60) decay += 8;
      integrity = Math.max(0, integrity - decay);
      if (decay > 0) {
        console.log(`[WARNING] High stress/temperature caused ${decay}% integrity damage!`);
      }

      coolant = Math.min(10000, coolant + 1000);
      turn++;
    }

    gameLoop();
  });
}

gameLoop();