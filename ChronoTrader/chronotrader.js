const readline = require('readline');

// Game constants
const MAX_TURNS = 20;
const STARTING_GOLD = 100;
const WIN_NET_WORTH = 1000;
const INVENTORY_LIMIT = 5;

// Artifact definitions
// Each artifact has: id, name, era, basePrice
const ARTIFACTS = [
  { id: 1, name: 'Ancient Egyptian Amulet', era: 'Ancient Egypt', basePrice: 50 },
  { id: 2, name: 'Roman Legionnaire Gladius', era: 'Roman Empire', basePrice: 60 },
  { id: 3, name: 'Medieval Tapestry', era: 'Middle Ages', basePrice: 40 },
  { id: 4, name: 'Renaissance Painting', era: 'Renaissance', basePrice: 80 },
  { id: 5, name: 'Industrial Age Typewriter', era: 'Industrial Revolution', basePrice: 70 },
  { id: 6, name: 'World War II Medal', era: '20th Century', basePrice: 90 },
  { id: 7, name: 'Future Tech Gadget', era: 'Future', basePrice: 100 }
];

// Era-specific market volatility factors for price fluctuations
const ERA_VOLATILITY = {
  'Ancient Egypt': 0.15,
  'Roman Empire': 0.12,
  'Middle Ages': 0.10,
  'Renaissance': 0.14,
  'Industrial Revolution': 0.13,
  '20th Century': 0.18,
  'Future': 0.20
};

// Random event definitions
const RANDOM_EVENTS = [
  {
    name: 'Time Rift',
    description: 'A time rift distorts artifact prices unpredictably this turn.',
    effect: (marketPrices, player) => {
      // Randomly increase or decrease some artifact prices significantly
      ARTIFACTS.forEach(a => {
        if (Math.random() < 0.5) {
          const change = (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
          marketPrices[a.id] = Math.max(1, Math.round(marketPrices[a.id] * (1 + change)));
        }
      });
    }
  },
  {
    name: 'Market Crash',
    description: 'A sudden market crash slashes artifact prices by half this turn.',
    effect: (marketPrices, player) => {
      ARTIFACTS.forEach(a => {
        marketPrices[a.id] = Math.max(1, Math.round(marketPrices[a.id] / 2));
      });
    }
  },
  {
    name: 'Treasure Hoard Found',
    description: 'You find a small treasure hoard, gaining 50 gold coins!'
    ,
    effect: (marketPrices, player) => {
      player.gold += 50;
    }
  },
  {
    name: 'Inventory Shuffle',
    description: 'Time anomaly shuffles an artifact in your inventory randomly.',
    effect: (marketPrices, player) => {
      if (player.inventory.length > 0) {
        // Remove one random artifact from inventory
        const idx = Math.floor(Math.random() * player.inventory.length);
        const removed = player.inventory.splice(idx,1)[0];
        console.log(`\n[Event] Your ${removed.name} was lost due to a time anomaly!`);
      }
    }
  },
  {
    name: 'Price Surge',
    description: 'Rare demand spike: one artifact price surges by 50% this turn.',
    effect: (marketPrices, player) => {
      const artifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
      marketPrices[artifact.id] = Math.round(marketPrices[artifact.id] * 1.5);
    }
  },
  {
    name: 'Supply Glitch',
    description: 'One artifact is unavailable to buy this turn.',
    effect: (marketPrices, player) => {
      player.unavailableArtifactId = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)].id;
    }
  },
  {
    name: 'Gold Tax',
    description: 'A sudden gold tax deducts 20 gold coins from you.',
    effect: (marketPrices, player) => {
      player.gold = Math.max(0, player.gold - 20);
      console.log('\n[Event] You paid 20 gold coins as a sudden gold tax.');
    }
  }
];

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Player object
const player = {
  gold: STARTING_GOLD,
  inventory: [], // array of {artifactId, artifact}
  unavailableArtifactId: null
};

// Market prices for artifacts (id -> price)
let marketPrices = {};

// Current turn
let currentTurn = 1;

// Utility: get net worth
function getNetWorth() {
  let worth = player.gold;
  player.inventory.forEach(i => {
    worth += marketPrices[i.artifactId];
  });
  return worth;
}

// Initialize market prices
function initializeMarket() {
  ARTIFACTS.forEach(a => {
    // Base price plus a slight random offset
    marketPrices[a.id] = Math.max(1, Math.round(a.basePrice * (1 + (Math.random() - 0.5) * 0.2)));
  });
}

// Update market prices each turn based on volatility
function updateMarketPrices() {
  ARTIFACTS.forEach(a => {
    const volatility = ERA_VOLATILITY[a.era];
    // Random price change percentage (-volatility to +volatility)
    const randFactor = (Math.random() * 2 - 1) * volatility;
    marketPrices[a.id] = Math.max(1, Math.round(marketPrices[a.id] * (1 + randFactor)));
  });
}

// Trigger a random event each turn with 50% chance
function triggerRandomEvent() {
  player.unavailableArtifactId = null; // reset unavailable artifact
  if (Math.random() < 0.5) {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    console.log(`\n[Event Triggered] ${event.name}: ${event.description}`);
    event.effect(marketPrices, player);
  }
}

// Display game instructions
function displayInstructions() {
  console.log(`\nWelcome to ChronoTrader!\n` +
    `You are a time-traveling trader collecting rare artifacts across history.\n` +
    `Buy low and sell high to accumulate gold coins over 20 turns.\n` +
    `Be mindful of your limited inventory space (${INVENTORY_LIMIT} artifacts).\n` +
    `Watch out for random events that may alter markets or your inventory!\n` +
    `\nCommands per turn:\n` +
    "  'buy <artifact id>' - buy one unit of the artifact if affordable and space available\n" +
    "  'sell <artifact id>' - sell one unit from your inventory at current market price\n" +
    "  'pass' - skip to next turn without trading\n" +
    `\nYour goal is to have a net worth of at least ${WIN_NET_WORTH} gold by turn ${MAX_TURNS}.\n` +
    `Run out of gold or inventory space, and you lose! Good luck!\n");
}

// Display current status
function displayStatus() {
  console.log(`\n--- Turn ${currentTurn} / ${MAX_TURNS} ---`);
  console.log(`Gold coins: ${player.gold}`);
  console.log(`Inventory space: ${player.inventory.length} / ${INVENTORY_LIMIT}`);
  console.log(`Net worth (gold + inventory value): ${getNetWorth()}`);

  // Show inventory contents
  if (player.inventory.length === 0) {
    console.log('Inventory: (empty)');
  } else {
    // Count each artifact in inventory
    const counts = {};
    player.inventory.forEach(i => {
      counts[i.artifactId] = (counts[i.artifactId] || 0) + 1;
    });
    console.log('Inventory:');
    for (const [artifactId, count] of Object.entries(counts)) {
      const art = ARTIFACTS.find(a => a.id === Number(artifactId));
      console.log(`  ${art.name} x${count} (Current price: ${marketPrices[artifactId]} gold)`);
    }
  }

  // Show market prices
  console.log('\nMarket prices:');
  ARTIFACTS.forEach(a => {
    if (player.unavailableArtifactId === a.id) {
      console.log(`  [Unavailable] ${a.id}: ${a.name} (${a.era})`);
    } else {
      console.log(`  ${a.id}: ${a.name} (${a.era}) - ${marketPrices[a.id]} gold`);
    }
  });
}

// Handle player's command
function handleCommand(input) {
  const parts = input.trim().toLowerCase().split(' ');
  const command = parts[0];
  const arg = parts[1];

  switch (command) {
    case 'buy':
      if (!arg || isNaN(arg)) {
        console.log("Invalid command usage. Usage: 'buy <artifact id>'");
        return false;
      }
      return buyArtifact(Number(arg));

    case 'sell':
      if (!arg || isNaN(arg)) {
        console.log("Invalid command usage. Usage: 'sell <artifact id>'");
        return false;
      }
      return sellArtifact(Number(arg));

    case 'pass':
      console.log('Turn passed.');
      return true;

    default:
      console.log('Unknown command. Valid commands are: buy, sell, pass.');
      return false;
  }
}

// Buy artifact
function buyArtifact(artifactId) {
  const artifact = ARTIFACTS.find(a => a.id === artifactId);
  if (!artifact) {
    console.log("Artifact ID not recognized.");
    return false;
  }
  if (player.unavailableArtifactId === artifactId) {
    console.log("That artifact is unavailable to buy this turn due to market disruption.");
    return false;
  }
  const price = marketPrices[artifactId];
  if (price > player.gold) {
    console.log(`You do not have enough gold to buy the ${artifact.name} (cost: ${price}).`);
    return false;
  }
  if (player.inventory.length >= INVENTORY_LIMIT) {
    console.log(`Your inventory is full. You must sell or discard an artifact before buying more.`);
    return false;
  }
  // Buy
  player.gold -= price;
  player.inventory.push({ artifactId, artifact });
  console.log(`You bought 1 ${artifact.name} for ${price} gold.`);
  return true;
}

// Sell artifact
function sellArtifact(artifactId) {
  const idx = player.inventory.findIndex(i => i.artifactId === artifactId);
  if (idx === -1) {
    console.log("You do not have that artifact in your inventory to sell.");
    return false;
  }
  const artifact = player.inventory[idx].artifact;
  const price = marketPrices[artifactId];

  // Sell
  player.inventory.splice(idx, 1);
  player.gold += price;
  console.log(`You sold 1 ${artifact.name} for ${price} gold.`);
  return true;
}

// Check for game end conditions
function checkGameEnd() {
  if (player.gold <= 0 && player.inventory.length === 0) {
    console.log('\nYou have run out of gold and artifacts. You lose!');
    return true;
  }
  if (player.gold < Math.min(...Object.values(marketPrices)) && player.inventory.length === INVENTORY_LIMIT) {
    console.log('\nYou have insufficient gold to buy any artifact and your inventory is full. You lose!');
    return true;
  }
  if (currentTurn > MAX_TURNS) {
    const netWorth = getNetWorth();
    console.log('\nGame over!');
    console.log(`Your final net worth is ${netWorth} gold coins.`);
    if (netWorth >= WIN_NET_WORTH) {
      console.log('Congratulations! You win!');
    } else {
      console.log('You did not reach the required net worth. You lose!');
    }
    return true;
  }
  return false;
}

// Main game loop
function nextTurn() {
  if (currentTurn > MAX_TURNS) {
    rl.close();
    return;
  }

  updateMarketPrices();
  triggerRandomEvent();
  displayStatus();

  rl.question('\nEnter command (buy <id>, sell <id>, pass): ', (answer) => {
    const valid = handleCommand(answer);
    if (valid) {
      // Next turn starts on success or pass
      if (currentTurn === MAX_TURNS) {
        // End game
        if (checkGameEnd()) {
          rl.close();
          return;
        }
        currentTurn++;
        nextTurn();
      } else {
        currentTurn++;
        if (checkGameEnd()) {
          rl.close();
          return;
        }
        nextTurn();
      }
    } else {
      // Repeat current turn on invalid command
      nextTurn();
    }
  });
}

// Start game
function startGame() {
  console.clear();
  console.log('--- ChronoTrader: Time-Traveling Artifact Trading Game ---');
  displayInstructions();
  initializeMarket();
  nextTurn();
}

startGame();
