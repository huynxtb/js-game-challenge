const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const state = {
  funds: 100,
  crew: 3,
  durability: 100,
  chimneysCleaned: 0,
  currentSoot: 100,
  currentCreosote: 0,
  fatigue: 0,
  targetSoot: 100,
  pendingMedical: false
};

function printStatus() {
  console.log("\n==================================================");
  console.log(`CHIMNEY ${state.chimneysCleaned + 1}/5 | Soot: ${state.currentSoot}/${state.targetSoot} | Creosote: ${state.currentCreosote}%`);
  console.log(`Crew: ${state.crew} | Funds: ${state.funds}s | Scraper: ${state.durability}% | Fatigue: ${state.fatigue}%`);
  console.log("==================================================");
}

function printMenu() {
  console.log("1. Sweep Chimney (Soot down, Durability down, Creosote up)");
  console.log("2. Scrape Creosote (Creosote down, Durability down)");
  console.log("3. Rest Crew (Costs 5s, Fatigue down)");
  console.log("4. Replace Scraper (Costs 20s, Durability to 100%)");
  console.log("5. Quit Game");
}

function checkGameOver() {
  if (state.crew <= 0) {
    console.log("\nGAME OVER: You have no crew members left!");
    return true;
  }
  if (state.funds < 0) {
    console.log("\nGAME OVER: You went bankrupt!");
    return true;
  }
  return false;
}

function checkWin() {
  if (state.chimneysCleaned >= 5) {
    console.log("\nVICTORY: You successfully cleaned all 5 chimneys and kept your crew safe!");
    return true;
  }
  return false;
}

function handleMedical(answer) {
  if (answer === 'y' || answer === 'yes') {
    state.funds -= 30;
    console.log("\nPaid 30 shillings. Crew member recovered.");
  } else {
    state.crew -= 1;
    console.log("\nRefused payment. Crew member left the team.");
  }
  state.pendingMedical = false;
  gameLoop();
}

function runEndOfTurn() {
  if (state.currentCreosote > 60) {
    const fireChance = (state.currentCreosote - 50) * 2;
    if (Math.random() * 100 < fireChance) {
      console.log("\nCRITICAL: A spark ignites the creosote! CHIMNEY FIRE!");
      state.funds -= 50;
      state.currentSoot = state.targetSoot;
      state.currentCreosote = 0;
      if (checkGameOver()) {
        rl.close();
        return;
      }
      gameLoop();
      return;
    }
  }

  const collapseChance = state.fatigue;
  if (Math.random() * 100 < collapseChance) {
    console.log("\nACCIDENT: A soot collapse occurs!");
    if (state.funds >= 30) {
      state.pendingMedical = true;
      gameLoop();
      return;
    } else {
      console.log("You cannot afford the 30s medical fee! A crew member is forced to retire.");
      state.crew -= 1;
      if (checkGameOver()) {
        rl.close();
        return;
      }
    }
  }

  if (Math.random() * 100 < 15) {
    const tip = Math.floor(Math.random() * 21) + 10;
    state.funds += tip;
    console.log(`\nEVENT: A satisfied homeowner tips you ${tip} shillings!`);
  }

  if (state.currentSoot <= 0) {
    state.chimneysCleaned += 1;
    state.funds += 80;
    console.log(`\nSUCCESS: Chimney cleaned! Earned 80 shillings.`);
    if (state.chimneysCleaned < 5) {
      state.targetSoot = 100 + state.chimneysCleaned * 20;
      state.currentSoot = state.targetSoot;
      state.currentCreosote = 0;
      state.fatigue = Math.max(0, state.fatigue - 20);
    }
  }

  gameLoop();
}

function handleAction(choice) {
  switch (choice) {
    case '1':
      if (state.durability <= 0) {
        console.log("\nScraper is broken! Replace it first.");
        gameLoop();
        return;
      }
      const sootRemoved = Math.floor(Math.random() * 11) + 10;
      const durLoss = Math.floor(Math.random() * 6) + 10;
      const creosoteGain = Math.floor(Math.random() * 11) + 5;
      const fatigueGain = Math.floor(Math.random() * 11) + 10;

      state.currentSoot = Math.max(0, state.currentSoot - sootRemoved);
      state.durability = Math.max(0, state.durability - durLoss);
      state.currentCreosote = Math.min(100, state.currentCreosote + creosoteGain);
      state.fatigue = Math.min(100, state.fatigue + fatigueGain);

      console.log(`\nYou swept the chimney. Soot -${sootRemoved}, Scraper Durability -${durLoss}%, Creosote +${creosoteGain}%, Fatigue +${fatigueGain}%`);
      runEndOfTurn();
      break;

    case '2':
      if (state.durability <= 0) {
        console.log("\nScraper is broken! Replace it first.");
        gameLoop();
        return;
      }
      const creosoteRemoved = Math.floor(Math.random() * 21) + 30;
      state.currentCreosote = Math.max(0, state.currentCreosote - creosoteRemoved);
      state.durability = Math.max(0, state.durability - 20);
      state.fatigue = Math.min(100, state.fatigue + 10);

      console.log(`\nYou scraped the creosote. Creosote -${creosoteRemoved}%, Scraper Durability -20%, Fatigue +10%`);
      runEndOfTurn();
      break;

    case '3':
      if (state.funds < 5) {
        console.log("\nNot enough funds for rations!");
        gameLoop();
        return;
      }
      state.funds -= 5;
      state.fatigue = Math.max(0, state.fatigue - 40);
      console.log("\nCrew rested. Fatigue reduced by 40%. Cost: 5 shillings.");
      runEndOfTurn();
      break;

    case '4':
      if (state.funds < 20) {
        console.log("\nNot enough funds to replace scraper!");
        gameLoop();
        return;
      }
      state.funds -= 20;
      state.durability = 100;
      console.log("\nScraper replaced. Durability restored to 100%. Cost: 20 shillings.");
      runEndOfTurn();
      break;

    case '5':
      console.log("\nExiting game. Goodbye!");
      rl.close();
      break;

    default:
      console.log("\nInvalid choice. Please select 1-5.");
      gameLoop();
      break;
  }
}

function gameLoop() {
  if (checkGameOver() || checkWin()) {
    rl.close();
    return;
  }

  if (state.pendingMedical) {
    rl.question("Pay 30 shillings for medical treatment? (y/n): ", (answer) => {
      handleMedical(answer.trim().toLowerCase());
    });
    return;
  }

  printStatus();
  printMenu();
  rl.question("Choose action: ", (answer) => {
    handleAction(answer.trim());
  });
}

console.log("Welcome to Soot Sweeper: Chimney Control!");
console.log("Clean 5 chimneys to win. Watch your funds, crew safety, and creosote levels!");
gameLoop();