const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

const state = {
  cycle: 1,
  stemCells: 15,
  iron: 15,
  nutrients: 15,
  oxygen: 70,
  wbc: 10,
  pathogens: 20
};

function displayStatus() {
  console.log('\n==================================================');
  console.log(` CYCLE: ${state.cycle} / 20`);
  console.log('==================================================');
  console.log(` [Resources]  Stem Cells: ${state.stemCells} | Iron: ${state.iron} | Nutrients: ${state.nutrients}`);
  console.log(` [Vitals]     Oxygen: ${state.oxygen}% | Pathogen Load: ${state.pathogens}% | WBC Count: ${state.wbc}`);
  console.log('==================================================');
}

async function handleAction() {
  console.log('\nChoose Action:');
  console.log(' 1. Produce Erythrocytes (-3 Stem Cells, -3 Iron, -1 Nutrient -> +20% Oxygen)');
  console.log(' 2. Produce Leukocytes   (-3 Stem Cells, -1 Iron, -3 Nutrients -> +5 WBC, -20% Pathogens)');
  console.log(' 3. Synthesize Resources (-5 Stem Cells -> +4 Iron, +4 Nutrients)');
  console.log(' 4. Conserve Energy      (No cost -> +2 Stem Cells)');

  while (true) {
    const choice = await ask('\nSelect action (1-4): ');
    if (choice === '1') {
      if (state.stemCells >= 3 && state.iron >= 3 && state.nutrients >= 1) {
        state.stemCells -= 3;
        state.iron -= 3;
        state.nutrients -= 1;
        state.oxygen = Math.min(100, state.oxygen + 20);
        console.log('\n>>> Produced Erythrocytes. Oxygen levels restored.');
        break;
      } else {
        console.log('Insufficient resources.');
      }
    } else if (choice === '2') {
      if (state.stemCells >= 3 && state.iron >= 1 && state.nutrients >= 3) {
        state.stemCells -= 3;
        state.iron -= 1;
        state.nutrients -= 3;
        state.wbc += 5;
        state.pathogens = Math.max(0, state.pathogens - 20);
        console.log('\n>>> Produced Leukocytes. Immune response strengthened.');
        break;
      } else {
        console.log('Insufficient resources.');
      }
    } else if (choice === '3') {
      if (state.stemCells >= 5) {
        state.stemCells -= 5;
        state.iron += 4;
        state.nutrients += 4;
        console.log('\n>>> Synthesized Iron and Nutrients.');
        break;
      } else {
        console.log('Insufficient Stem Cells.');
      }
    } else if (choice === '4') {
      state.stemCells += 2;
      console.log('\n>>> Conserved energy. Extra Stem Cells generated.');
      break;
    } else {
      console.log('Invalid choice. Enter 1, 2, 3, or 4.');
    }
  }
}

async function handleEvent() {
  const events = [
    { name: 'Hemorrhage', desc: 'Severe blood loss detected. Spend 4 Iron to patch, or lose 25% Oxygen.', costType: 'iron', costVal: 4, penalty: () => { state.oxygen -= 25; console.log('Penalty: Oxygen dropped by 25%'); }, success: () => { state.oxygen -= 5; console.log('Mitigated: Patched hemorrhage. Lost only 5% Oxygen.'); } },
    { name: 'Viral Mutation', desc: 'Pathogens mutating rapidly. Spend 6 WBC to combat, or Pathogen Load increases by 30%.', costType: 'wbc', costVal: 6, penalty: () => { state.pathogens += 30; console.log('Penalty: Pathogen Load increased by 30%'); }, success: () => { state.pathogens += 5; console.log('Mitigated: Contained mutation. Pathogen Load increased by only 5%.'); } },
    { name: 'Splenic Sequestration', desc: 'Spleen trapping active cells. Spend 3 Stem Cells to clear, or lose 15% Oxygen and 4 WBC.', costType: 'stemCells', costVal: 3, penalty: () => { state.oxygen -= 15; state.wbc = Math.max(0, state.wbc - 4); console.log('Penalty: Lost 15% Oxygen and 4 WBC.'); }, success: () => { console.log('Mitigated: Spleen cleared successfully.'); } },
    { name: 'Bacterial Invasion', desc: 'Bacterial infection spreading. Spend 4 WBC to neutralize, or Pathogen Load increases by 25%.', costType: 'wbc', costVal: 4, penalty: () => { state.pathogens += 25; console.log('Penalty: Pathogen Load increased by 25%'); }, success: () => { console.log('Mitigated: Bacterial invasion neutralized.'); } },
    { name: 'Nutrient Surge', desc: 'Host consumed rich meal. Gain +5 Nutrients and +3 Iron.', costType: 'none', apply: () => { state.nutrients += 5; state.iron += 3; } }
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  console.log(`\n[EVENT] ${event.name.toUpperCase()}: ${event.desc}`);

  if (event.costType === 'none') {
    event.apply();
    return;
  }

  const hasResource = state[event.costType] >= event.costVal;
  if (!hasResource) {
    console.log(`\nInsufficient ${event.costType} (Requires ${event.costVal}). Cannot mitigate!`);
    event.penalty();
    return;
  }

  while (true) {
    const answer = (await ask(`Spend ${event.costVal} ${event.costType} to mitigate? (y/n): `)).toLowerCase();
    if (answer === 'y') {
      state[event.costType] -= event.costVal;
      event.success();
      break;
    } else if (answer === 'n') {
      event.penalty();
      break;
    }
  }
}

function applyTurnDecay() {
  state.stemCells += 5;
  state.iron += 3;
  state.nutrients += 3;

  state.oxygen -= 12;

  const pathogenGrowth = Math.max(0, 12 - state.wbc);
  state.pathogens += pathogenGrowth;

  state.wbc = Math.max(0, state.wbc - 2);

  state.oxygen = Math.max(0, Math.min(100, state.oxygen));
  state.pathogens = Math.max(0, Math.min(100, state.pathogens));
}

async function gameLoop() {
  console.clear();
  console.log('==================================================');
  console.log('                 MARROW WEAVER                    ');
  console.log('==================================================');
  console.log('Manage the bone marrow. Keep the host alive.');
  console.log('Survive 20 cycles.');
  console.log('Win condition: Oxygen > 20%, Pathogens < 90% at Cycle 20.');
  console.log('Loss condition: Oxygen reaches 0% or Pathogens reach 100%.');
  console.log('==================================================');
  await ask('\nPress Enter to start...');

  while (state.cycle <= 20) {
    console.clear();
    displayStatus();
    await handleAction();
    await handleEvent();
    applyTurnDecay();

    if (state.oxygen <= 0) {
      console.log('\n[GAME OVER] Host died of hypoxia. Oxygen reached 0%.');
      break;
    }
    if (state.pathogens >= 100) {
      console.log('\n[GAME OVER] Host died of systemic infection. Pathogen Load reached 100%.');
      break;
    }

    if (state.cycle === 20) {
      if (state.oxygen > 20 && state.pathogens < 90) {
        console.log('\n[VICTORY] You successfully stabilized the host for 20 cycles! Marrow Weaver operations complete.');
      } else {
        console.log('\n[GAME OVER] Host survived 20 cycles but remains in critical condition. Mission failed.');
      }
      break;
    }

    state.cycle++;
    await ask('\nPress Enter for next cycle...');
  }
  rl.close();
}

gameLoop();