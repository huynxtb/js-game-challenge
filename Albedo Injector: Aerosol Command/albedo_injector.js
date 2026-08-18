const readline = require('readline');

const state = {
  month: 1,
  tempDeviation: 2.5,
  startTemp: 2.5,
  targetTemp: 0.5,
  maxTemp: 5.5,
  budget: 5000,
  aerosol: 10,
  balloons: 2,
  injectionRate: 1,
  approval: 50,
  logs: ['Game started. Objective: Lower global temperature deviation to 0.5°C.']
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message) {
  state.logs.push(message);
  if (state.logs.length > 5) {
    state.logs.shift();
  }
}

function renderStatus() {
  console.clear();
  console.log('==================================================');
  console.log('        ALBEDO INJECTOR: AEROSOL COMMAND          ');
  console.log('==================================================');
  console.log(` Month: ${state.month}`);
  console.log(` Global Temp Deviation: ${state.tempDeviation.toFixed(2)}°C (Target: <= ${state.targetTemp.toFixed(2)}°C, Limit: >= ${state.maxTemp.toFixed(2)}°C)`);
  console.log(` Budget: $${state.budget} | Public Approval: ${state.approval}%`);
  console.log(` Active Balloons: ${state.balloons} | Aerosol Stockpile: ${state.aerosol} tons`);
  console.log(` Current Injection Rate: ${state.injectionRate} tons/balloon/month`);
  console.log(` Max Injection Capacity: ${state.balloons * state.injectionRate} tons/month`);
  console.log('--------------------------------------------------');
  console.log(' Recent Logs:');
  state.logs.forEach(l => console.log(`  - ${l}`));
  console.log('--------------------------------------------------');
  console.log(' Actions:');
  console.log('  1) Launch Balloon ($500, +1 capacity)');
  console.log('  2) Purchase Aerosol ($100/ton)');
  console.log('  3) Adjust Injection Rate');
  console.log('  4) Fund Public Relations ($300, +15% Approval)');
  console.log('  5) Advance Month (Process Injection & Events)');
  console.log('  6) Exit Game');
  console.log('--------------------------------------------------');
}

function checkGameEnd() {
  if (state.tempDeviation <= state.targetTemp) {
    renderStatus();
    console.log('\n*** VICTORY! ***');
    console.log(`You successfully lowered the global temperature deviation to ${state.tempDeviation.toFixed(2)}°C.`);
    console.log(`The planet has stabilized. Final Month: ${state.month}. Remaining Budget: $${state.budget}.`);
    rl.close();
    process.exit(0);
  }
  if (state.tempDeviation >= state.maxTemp) {
    renderStatus();
    console.log('\n*** GAME OVER: RUNAWAY WARMING ***');
    console.log(`Global temperature reached ${state.tempDeviation.toFixed(2)}°C. The biosphere has collapsed.`);
    rl.close();
    process.exit(0);
  }
  if (state.approval <= 0) {
    renderStatus();
    console.log('\n*** GAME OVER: PUBLIC REVOLT ***');
    console.log('Public approval reached 0%. Global governments shut down your operation.');
    rl.close();
    process.exit(0);
  }
  if (state.budget <= 0) {
    renderStatus();
    console.log('\n*** GAME OVER: BANKRUPTCY ***');
    console.log('Your budget has hit $0. You can no longer sustain operations.');
    rl.close();
    process.exit(0);
  }
}

function triggerRandomEvent() {
  const roll = Math.random();
  if (roll < 0.15) {
    if (state.balloons > 0) {
      state.balloons--;
      log('EVENT: Wind Shear destroys 1 active balloon.');
    } else {
      log('EVENT: Wind Shear detected, but no balloons were active.');
    }
  } else if (roll < 0.30) {
    state.approval = Math.max(0, state.approval - 15);
    log('EVENT: Acid Rain outbreak linked to aerosols. Approval drops by 15%.');
  } else if (roll < 0.45) {
    state.tempDeviation += 0.4;
    log('EVENT: Solar Flare increases baseline temperature by 0.4°C.');
  } else if (roll < 0.60) {
    state.approval = Math.min(100, state.approval + 10);
    log('EVENT: "Blue Sky" PR campaign succeeds. Approval increases by 10%.');
  } else if (roll < 0.70) {
    state.budget += 1000;
    log('EVENT: Received $1000 environmental subsidy.');
  } else {
    log('EVENT: No significant weather or political events this month.');
  }
}

function advanceMonth() {
  const maxPossibleInjection = state.balloons * state.injectionRate;
  const actualInjection = Math.min(state.aerosol, maxPossibleInjection);
  
  state.aerosol -= actualInjection;
  
  const cooling = actualInjection * 0.05;
  const naturalWarming = 0.08;
  state.tempDeviation = state.tempDeviation - cooling + naturalWarming;
  
  const maintenanceCost = state.balloons * 50;
  state.budget -= maintenanceCost;
  
  if (actualInjection > 0) {
    const approvalImpact = Math.floor(actualInjection / 2);
    state.approval = Math.max(0, state.approval - approvalImpact);
    log(`Injected ${actualInjection} tons. Cooling: -${cooling.toFixed(2)}°C. Warming: +${naturalWarming}°C. Approval: -${approvalImpact}%.`);
  } else {
    log(`No aerosols injected. Warming: +${naturalWarming}°C.`);
  }
  
  if (maintenanceCost > 0) {
    log(`Paid $${maintenanceCost} balloon maintenance.`);
  }
  
  triggerRandomEvent();
  state.month++;
  checkGameEnd();
  promptUser();
}

function promptUser() {
  renderStatus();
  rl.question('Select action (1-6): ', (input) => {
    const choice = input.trim();
    if (choice === '1') {
      if (state.budget >= 500) {
        state.budget -= 500;
        state.balloons++;
        log('Launched 1 balloon for $500.');
      } else {
        log('Insufficient budget to launch balloon.');
      }
      checkGameEnd();
      promptUser();
    } else if (choice === '2') {
      rl.question('Enter tons of aerosol to purchase ($100/ton): ', (tonsInput) => {
        const tons = parseInt(tonsInput.trim(), 10);
        if (isNaN(tons) || tons <= 0) {
          log('Invalid purchase amount.');
        } else {
          const cost = tons * 100;
          if (state.budget >= cost) {
            state.budget -= cost;
            state.aerosol += tons;
            log(`Purchased ${tons} tons of aerosol for $${cost}.`);
          } else {
            log('Insufficient budget for this purchase.');
          }
        }
        checkGameEnd();
        promptUser();
      });
    } else if (choice === '3') {
      rl.question('Enter new injection rate (tons per balloon per month): ', (rateInput) => {
        const rate = parseInt(rateInput.trim(), 10);
        if (isNaN(rate) || rate < 0) {
          log('Invalid injection rate.');
        } else {
          state.injectionRate = rate;
          log(`Injection rate set to ${rate} tons/balloon/month.`);
        }
        promptUser();
      });
    } else if (choice === '4') {
      if (state.budget >= 300) {
        state.budget -= 300;
        state.approval = Math.min(100, state.approval + 15);
        log('Funded Public Relations for $300. Approval increased.');
      } else {
        log('Insufficient budget for PR.');
      }
      checkGameEnd();
      promptUser();
    } else if (choice === '5') {
      advanceMonth();
    } else if (choice === '6') {
      console.log('Exiting game. Goodbye.');
      rl.close();
      process.exit(0);
    } else {
      log('Invalid option.');
      promptUser();
    }
  });
}

promptUser();
