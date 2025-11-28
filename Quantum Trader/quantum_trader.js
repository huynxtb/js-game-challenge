const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Game Configuration
const MAX_TRADING_CYCLES = 20;
const STARTING_CAPITAL = 10000;
const TARGET_NET_WORTH = 50000;

// Quantum Commodities Definition
const commodities = [
  {
    name: 'Quantum Flux',
    description: 'Highly volatile; massive spikes and crashes in price.',
    basePrice: 100,
    volatility: 0.5, // percentage max change per cycle
    risk: 'High'
  },
  {
    name: 'Entanglinium',
    description: 'Moderately volatile; relatively stable mid-range price swings.',
    basePrice: 500,
    volatility: 0.2,
    risk: 'Medium'
  },
  {
    name: 'Zero-Point Crystal',
    description: 'Low volatility; steady but slow changes in price.',
    basePrice: 1000,
    volatility: 0.1,
    risk: 'Low'
  }
];

// Game State
let tradingCycle = 0;
let capital = STARTING_CAPITAL;
let inventory = {};
let prices = {};
let netWorth = STARTING_CAPITAL;

// Initialize inventory with zero quantities
commodities.forEach(c => {
  inventory[c.name] = 0;
  prices[c.name] = c.basePrice;
});

// Utilities
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function calculateNetWorth() {
  let worth = capital;
  for (const commodity of commodities) {
    worth += inventory[commodity.name] * prices[commodity.name];
  }
  return worth;
}

// Market fluctuation simulation based on pseudo-random quantum events
// Each commodity price changes based on volatility and a random event factor
// Sometimes a rare event triggers bigger swings
function updateMarketPrices() {
  commodities.forEach(c => {
    let baseChange = (Math.random() * 2 - 1) * c.volatility; // -volatility to +volatility
    // Rare quantum surge or collapse event
    if (Math.random() < 0.05) {
      baseChange += (Math.random() < 0.5 ? -1 : 1) * c.volatility * (Math.random() * 2 + 1); // large change
      console.log(`\n*** Quantum event affects ${c.name}! Price shifts dramatically! ***`);
    }
    let newPrice = prices[c.name] * (1 + baseChange);
    // Prevent price falling below minimal threshold
    if (newPrice < 1) newPrice = 1;
    prices[c.name] = newPrice;
  });
}

function printMarketStatus() {
  console.log(`\n--- Trading Cycle ${tradingCycle} ---`);
  console.log(`Capital: ${formatCurrency(capital)}`);
  console.log(`Net Worth (Capital + Inventory Value): ${formatCurrency(netWorth)}`);
  console.log(`Inventory:`);
  commodities.forEach(c => {
    console.log(`  ${c.name}: ${inventory[c.name]} units (Price: ${formatCurrency(prices[c.name])})`);
  });
  console.log('');
}

function printCommoditiesInfo() {
  console.log('Available Quantum Commodities to Trade:');
  commodities.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.name} - ${c.description}`);
  });
  console.log('');
}

function parseIntegerInput(input) {
  let n = Number(input.trim());
  if (Number.isInteger(n) && n >= 0) return n;
  return NaN;
}

async function playerAction() {
  while (true) {
    console.log('Choose your action: buy, sell, or hold');
    let action = (await prompt('> ')).trim().toLowerCase();
    if (!['buy', 'sell', 'hold'].includes(action)) {
      console.log('Invalid action. Please enter buy, sell, or hold.');
      continue;
    }

    if (action === 'hold') {
      console.log('You chose to hold this cycle. No trading done.');
      return;
    }

    // Show commodities
    printCommoditiesInfo();

    while (true) {
      let commodityChoice = await prompt(`Enter the number of the commodity you want to ${action}: `);
      let idx = parseInt(commodityChoice.trim(), 10);
      if (idx >= 1 && idx <= commodities.length) {
        let commodity = commodities[idx - 1];

        if (action === 'buy') {
          // Calculate max affordable units
          let maxAffordable = Math.floor(capital / prices[commodity.name]);
          if (maxAffordable < 1) {
            console.log(`Not enough capital to buy any units of ${commodity.name}.`);
            return;
          }

          while (true) {
            let qtyInput = await prompt(`Enter quantity to buy (max ${maxAffordable}): `);
            let qty = parseIntegerInput(qtyInput);
            if (qty === NaN || qty < 1 || qty > maxAffordable) {
              console.log('Invalid quantity. Please enter a valid number within your affordable range.');
              continue;
            }
            // Deduct capital and add to inventory
            let cost = qty * prices[commodity.name];
            capital -= cost;
            inventory[commodity.name] += qty;
            console.log(`Bought ${qty} units of ${commodity.name} for ${formatCurrency(cost)}.`);
            return;
          }

        } else if (action === 'sell') {
          let availableQty = inventory[commodity.name];
          if (availableQty < 1) {
            console.log(`You do not have any units of ${commodity.name} to sell.`);
            return;
          }

          while (true) {
            let qtyInput = await prompt(`Enter quantity to sell (max ${availableQty}): `);
            let qty = parseIntegerInput(qtyInput);
            if (qty === NaN || qty < 1 || qty > availableQty) {
              console.log('Invalid quantity. Please enter a valid number within your inventory.');
              continue;
            }
            // Add capital and reduce inventory
            let revenue = qty * prices[commodity.name];
            capital += revenue;
            inventory[commodity.name] -= qty;
            console.log(`Sold ${qty} units of ${commodity.name} for ${formatCurrency(revenue)}.`);
            return;
          }
        }

      } else {
        console.log(`Invalid choice. Please enter a number from 1 to ${commodities.length}.`);
      }
    }
  }
}

// Display introduction & instructions
function printIntroduction() {
  console.log('Welcome to Quantum Trader!');
  console.log('You are a quantum-era merchant navigating a multi-dimensional market.');
  console.log(`Your goal is to accumulate a net worth of ${formatCurrency(TARGET_NET_WORTH)} within ${MAX_TRADING_CYCLES} trading cycles.`);
  console.log('Each cycle, prices fluctuate due to unpredictable quantum market events.');
  console.log('You may buy, sell, or hold each turn. Manage your capital and inventory carefully!');
  console.log('If you run out of capital or fail to meet your target by the end, you lose.');
  console.log('Good luck!');
}

async function gameLoop() {
  printIntroduction();

  while (tradingCycle < MAX_TRADING_CYCLES) {
    tradingCycle++;

    updateMarketPrices();
    netWorth = calculateNetWorth();
    printMarketStatus();

    if (capital < 1 && Object.values(inventory).every(qty => qty === 0)) {
      console.log('\nYou have run out of capital and inventory to trade. Game Over.');
      break;
    }

    if (netWorth >= TARGET_NET_WORTH) {
      console.log(`\nCONGRATULATIONS! You have reached your target net worth of ${formatCurrency(TARGET_NET_WORTH)}.`);
      break;
    }

    await playerAction();

    netWorth = calculateNetWorth();

    if (capital < 1 && Object.values(inventory).every(qty => qty === 0)) {
      console.log('\nYou have run out of capital and inventory to trade. Game Over.');
      break;
    }

    if (netWorth >= TARGET_NET_WORTH) {
      console.log(`\nCONGRATULATIONS! You have reached your target net worth of ${formatCurrency(TARGET_NET_WORTH)}.`);
      break;
    }
  }

  if (netWorth < TARGET_NET_WORTH && tradingCycle >= MAX_TRADING_CYCLES) {
    console.log(`\nTime has run out after ${MAX_TRADING_CYCLES} trading cycles.`);
    console.log(`Final Net Worth: ${formatCurrency(netWorth)}`);
    console.log('You did not reach your target. Better luck next time!');
  }

  rl.close();
}

// Start game
gameLoop();
