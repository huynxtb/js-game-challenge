const readline = require('readline');

/*
ChronoChef Challenge: A time management and resource allocation game in a whimsical kitchen.

Author: ChatGPT
*/

// --- CONSTANTS ---
const TURN_MINUTES = 5;
const KITCHEN_CLOSE_HOUR = 12 * 60; // 12 hours in minutes
const ENERGY_MAX = 100;
const ENERGY_REGEN_TURNS = 3; // after how many turns energy regenerates

// Ingredient list with initial quantities
const INITIAL_INGREDIENTS = {
  "Carrot": 10,
  "Tomato": 8,
  "Potato": 10,
  "Fish": 5,
  "Chicken": 5,
  "Herbs": 6,
  "Cheese": 4,
  "Flour": 8,
  "Egg": 10
};

// Tool list with quantities
const INITIAL_TOOLS = {
  "Knife": 1,
  "Oven": 1,
  "Stove": 1,
  "Plate": 5
};

// Orders for the day - each order has a name, required ingredients, tasks, and due time
// Tasks are: chopping, cooking, plating, serving
const DAILY_ORDERS = [
  {
    id: 1,
    name: "Tomato Soup",
    tasks: [
      { action: "Chop", ingredient: "Tomato", duration: 2 },
      { action: "Cook", tool: "Stove", duration: 3 },
      { action: "Plate", tool: "Plate", duration: 1 },
      { action: "Serve", duration: 1 }
    ],
    ingredients: { "Tomato": 3, "Herbs": 1 },
    due: 90
  },
  {
    id: 2,
    name: "Herb Chicken",
    tasks: [
      { action: "Chop", ingredient: "Herbs", duration: 1 },
      { action: "Cook", tool: "Oven", duration: 5 },
      { action: "Plate", tool: "Plate", duration: 1 },
      { action: "Serve", duration: 1 }
    ],
    ingredients: { "Chicken": 2, "Herbs": 2 },
    due: 150
  },
  {
    id: 3,
    name: "Fish & Chips",
    tasks: [
      { action: "Chop", ingredient: "Potato", duration: 3 },
      { action: "Cook", tool: "Stove", duration: 4 },
      { action: "Plate", tool: "Plate", duration: 1 },
      { action: "Serve", duration: 1 }
    ],
    ingredients: { "Fish": 2, "Potato": 4 },
    due: 200
  },
  {
    id: 4,
    name: "Cheese Omelette",
    tasks: [
      { action: "Chop", ingredient: "Herbs", duration: 1 },
      { action: "Cook", tool: "Stove", duration: 3 },
      { action: "Plate", tool: "Plate", duration: 1 },
      { action: "Serve", duration: 1 }
    ],
    ingredients: { "Egg": 3, "Cheese": 2, "Herbs": 1 },
    due: 120
  },
  {
    id: 5,
    name: "Carrot Cake",
    tasks: [
      { action: "Chop", ingredient: "Carrot", duration: 4 },
      { action: "Cook", tool: "Oven", duration: 6 },
      { action: "Plate", tool: "Plate", duration: 1 },
      { action: "Serve", duration: 1 }
    ],
    ingredients: { "Carrot": 5, "Flour": 4, "Egg": 2 },
    due: 250
  }
];

// Random events that can happen each turn
const RANDOM_EVENTS = [
  {
    description: "A sudden spill delays chopping tasks.",
    effect: (state) => {
      state.chopDelay = 2; // Extra 2 minutes delay on chopping tasks this turn
    }
  },
  {
    description: "A helpful kitchen assistant restocks some ingredients.",
    effect: (state) => {
      const restockItem = Object.keys(state.ingredients)[Math.floor(Math.random() * Object.keys(state.ingredients).length)];
      const restockAmount = Math.floor(Math.random() * 3) + 1;
      state.ingredients[restockItem] += restockAmount;
      state.consoleLog.push(`Assistant restocked ${restockAmount} ${restockItem}(s).`);
    }
  },
  {
    description: "The oven malfunctions, cooking tasks take longer!",
    effect: (state) => {
      state.cookDelay = 3; // Extra 3 minutes delay on cooking tasks
    }
  },
  {
    description: "Energy drink! You regain some energy.",
    effect: (state) => {
      state.energy = Math.min(state.energy + 20, ENERGY_MAX);
      state.consoleLog.push("You feel energized! +20 energy.");
    }
  },
  {
    description: "A supplier delivers fewer ingredients than expected.",
    effect: (state) => {
      const shortageItem = Object.keys(state.ingredients)[Math.floor(Math.random() * Object.keys(state.ingredients).length)];
      const lossAmount = Math.min(state.ingredients[shortageItem], Math.floor(Math.random() * 3) + 1);
      state.ingredients[shortageItem] -= lossAmount;
      state.consoleLog.push(`Supplier shortage: Lost ${lossAmount} ${shortageItem}(s).`);
    }
  },
  {
    description: "Quiet moment: No special events.",
    effect: (_) => {}
  }
];

// --- GAME STATE ---
let state = {
  time: 0, // in minutes from 0
  energy: ENERGY_MAX,
  ingredients: { ...INITIAL_INGREDIENTS },
  tools: { ...INITIAL_TOOLS },
  orders: JSON.parse(JSON.stringify(DAILY_ORDERS)), // deep copy
  currentOrderIndex: 0,
  chopDelay: 0,
  cookDelay: 0,
  consoleLog: [],
  turnsSinceLastEnergyRegen: 0,
  completedOrders: [],
  failedOrders: []
};

// --- SETUP READLINE ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- Utility Functions ---
function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

function printSeparator() {
  console.log("--------------------------------------------------");
}

function promptInput(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function resourcesToString() {
  let s = 'Ingredients:\n';
  for (const [k,v] of Object.entries(state.ingredients)) {
    s += `  - ${k}: ${v}\n`;
  }
  s += 'Tools:\n';
  for (const [k,v] of Object.entries(state.tools)) {
    s += `  - ${k}: ${v}\n`;
  }
  s += `Energy: ${state.energy}/100`;
  return s;
}

function displayOrders() {
  if (state.orders.length === 0) {
    console.log("No pending orders! Great job!");
    return;
  }
  console.log("Pending Orders:");
  state.orders.forEach(order => {
    const dueTime = formatTime(order.due);
    console.log(`  [${order.id}] ${order.name} (Due: ${dueTime})`);
  });
}

function displayCurrentOrder() {
  if (state.orders.length === 0) return;
  const order = state.orders[0];
  console.log(`Current Order: ${order.name}`);
  console.log("Ingredients Needed:");
  for (const [ing, qty] of Object.entries(order.ingredients)) {
    console.log(`  - ${ing}: ${qty}`);
  }
  console.log("Pending Tasks:");
  order.tasks.forEach((task, idx) => {
    let detail = task.action;
    if (task.ingredient) detail += ` (${task.ingredient})`;
    else if (task.tool) detail += ` (${task.tool})`;
    console.log(`  ${idx + 1}. ${detail} - ${task.duration} turn(s)`);
  });
}

function consumeIngredients(order) {
  for (const [ing, qty] of Object.entries(order.ingredients)) {
    if (state.ingredients[ing] === undefined || state.ingredients[ing] < qty) {
      return false; // not enough ingredient
    }
  }
  for (const [ing, qty] of Object.entries(order.ingredients)) {
    state.ingredients[ing] -= qty;
  }
  return true;
}

function delayDescription() {
  let desc = [];
  if (state.chopDelay > 0) desc.push(`${state.chopDelay} minutes extra chopping delay`);
  if (state.cookDelay > 0) desc.push(`${state.cookDelay} minutes extra cooking delay`);
  return desc.length > 0 ? desc.join(" and ") : "none";
}

function selectTask(order) {
  // Show tasks with progressive completion indication
  console.log("Choose a task to perform this turn:");
  order.tasks.forEach((task, idx) => {
    let detail = task.action;
    if (task.ingredient) detail += ` (${task.ingredient})`;
    else if (task.tool) detail += ` (${task.tool})`;
    console.log(`  ${idx + 1}. ${detail} - ${task.duration} turn(s)`);
  });
}

async function gameTurn() {
  state.consoleLog = [];

  // Check if kitchen closed
  if (state.time >= KITCHEN_CLOSE_HOUR) {
    console.log(`Time has passed ${formatTime(KITCHEN_CLOSE_HOUR)} - Kitchen is closed!`);
    return gameOver(false, "Kitchen closed before all orders completed.");
  }

  if (state.orders.length === 0) {
    return gameOver(true, "All orders completed before kitchen closed! Great job!");
  }

  // Display status
  printSeparator();
  console.log(`Time: ${formatTime(state.time)} (Turn +5 minutes)`);
  console.log(resourcesToString());
  console.log(`Next delays: ${delayDescription()}`);
  displayOrders();

  if(state.energy <= 0) {
    return gameOver(false, "You have run out of energy!");
  }

  const currentOrder = state.orders[0];

  displayCurrentOrder();

  // Trigger random event (20% chance)
  if (Math.random() < 0.2) {
    const eventIndex = Math.floor(Math.random() * RANDOM_EVENTS.length);
    const event = RANDOM_EVENTS[eventIndex];
    console.log(`\nRandom Event: ${event.description}`);
    event.effect(state);
  }

  // If energy is low, warn player
  if(state.energy < 25) {
    console.log("Warning: Energy is low. Consider resting or finishing tasks quickly.");
  }

  // Choose a task
  let taskChoice = await promptInput("Enter task number to perform (or 'rest' to regain energy, 'skip' to wait): ");
  taskChoice = taskChoice.trim().toLowerCase();

  if(taskChoice === 'rest') {
    // Resting recovers some energy and passes time
    state.energy = Math.min(state.energy + 15, ENERGY_MAX);
    console.log("You take a short break and regain 15 energy.");
    state.time += TURN_MINUTES;
    state.turnsSinceLastEnergyRegen = 0;
    state.chopDelay = 0;
    state.cookDelay = 0;
    await nextTurnCheck();
    return;
  }

  if(taskChoice === 'skip') {
    console.log("You wait for a moment. Time passes.");
    state.time += TURN_MINUTES;
    state.turnsSinceLastEnergyRegen++;
    // Minimal energy drain
    state.energy = Math.max(state.energy - 3, 0);
    state.chopDelay = 0;
    state.cookDelay = 0;
    await nextTurnCheck();
    return;
  }

  const choiceNum = parseInt(taskChoice, 10);
  if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > currentOrder.tasks.length) {
    console.log("Invalid input, please choose a valid task number, 'rest' or 'skip'.");
    return gameTurn();
  }

  let task = currentOrder.tasks[choiceNum - 1];

  // Calculate energy cost and time needed for task
  let baseDuration = task.duration * TURN_MINUTES;
  let extraDelay = 0;
  if (task.action === "Chop" && state.chopDelay > 0) {
    extraDelay = state.chopDelay;
  }
  if (task.action === "Cook" && state.cookDelay > 0) {
    extraDelay = state.cookDelay;
  }

  const totalTime = baseDuration + extraDelay;

  // Energy cost estimation
  // Chopping and plating cost moderate energy, cooking costs higher energy, serving is low energy
  let energyCost = 0;
  switch (task.action) {
    case "Chop": energyCost = 10; break;
    case "Cook": energyCost = 15; break;
    case "Plate": energyCost = 8; break;
    case "Serve": energyCost = 5; break;
  }

  if (state.energy < energyCost) {
    console.log(`Not enough energy to perform this task. You have ${state.energy} energy, but it requires ${energyCost}.`);
    return gameTurn();
  }

  // Tool availability check
  if(task.tool) {
    if (!state.tools[task.tool] || state.tools[task.tool] < 1) {
      console.log(`You don't have the required tool: ${task.tool} to perform this task.`);
      return gameTurn();
    }
  }

  // Ingredient availability for chopping task
  if (task.action === "Chop" && task.ingredient) {
    if (state.ingredients[task.ingredient] <= 0) {
      console.log(`No ${task.ingredient} left to chop.`);
      return gameTurn();
    }
  }

  // Perform the task:
  console.log(`Performing task '${task.action}'${task.ingredient ? ` on ${task.ingredient}` : task.tool ? ` using ${task.tool}` : ''} - This will take ${totalTime} minutes.`);

  // Consume energy
  state.energy -= energyCost;

  // Consume ingredients only at Chop phase to simulate preparation (don't consume at plating or serving)
  if(task.action === "Chop" && task.ingredient) {
    if(state.ingredients[task.ingredient] > 0) {
      state.ingredients[task.ingredient]--;
    } else {
      console.log(`Unexpectedly no ${task.ingredient} left to chop!`);
      return gameTurn();
    }
  }

  // Accumulate time
  state.time += totalTime;

  // Reduce delay effects after usage
  if (task.action === "Chop") {
    state.chopDelay = Math.max(0, state.chopDelay - extraDelay);
  }
  if (task.action === "Cook") {
    state.cookDelay = Math.max(0, state.cookDelay - extraDelay);
  }

  // Reduce task duration or finish task?
  task.duration -= 1;
  if (task.duration <= 0) {
    // Remove task from order
    currentOrder.tasks.splice(choiceNum - 1, 1);
  }

  // Check if order is finished
  if (currentOrder.tasks.length === 0) {
    // Check ingredients for the order were actually available and consumed
    // Re-check here - edge case handled when consumption might be delayed
    if (!consumeIngredients(currentOrder)) {
      console.log(`Failed order '${currentOrder.name}' due to insufficient ingredients.`);
      state.failedOrders.push(currentOrder);
    } else {
      console.log(`Order '${currentOrder.name}' completed! Served in time.`);
      state.completedOrders.push(currentOrder);
    }

    // Remove order
    state.orders.shift();
  }

  // Energy regeneration by resting or per turns
  state.turnsSinceLastEnergyRegen++;
  if(state.turnsSinceLastEnergyRegen >= ENERGY_REGEN_TURNS) {
    state.energy = Math.min(state.energy + 10, ENERGY_MAX);
    state.turnsSinceLastEnergyRegen = 0;
    console.log("You feel a bit rested, regaining 10 energy.");
  }

  await nextTurnCheck();
}

async function nextTurnCheck() {
  // Check fail conditions
  if(state.energy <= 0) {
    return gameOver(false, "You ran out of energy and couldn't continue.");
  }
  if(state.time >= KITCHEN_CLOSE_HOUR && state.orders.length > 0) {
    return gameOver(false, "Kitchen closed before all orders completed.");
  }

  // Check ingredient shortages critical for upcoming orders
  for(const order of state.orders) {
    for(const ing in order.ingredients) {
      if(state.ingredients[ing] === undefined || state.ingredients[ing] < order.ingredients[ing]) {
        return gameOver(false, `Critical ingredient shortage: Not enough ${ing} to complete order '${order.name}'.`);
      }
    }
  }

  // Continue next turn
  setImmediate(gameTurn);
}

function gameOver(won, message) {
  printSeparator();
  if(won) {
    console.log("\nCONGRATULATIONS! YOU WON THE CHRONOCHEF CHALLENGE!\n");
  } else {
    console.log("\nGAME OVER - YOU LOST THE CHRONOCHEF CHALLENGE!\n");
  }
  console.log(message);
  console.log(`Time elapsed: ${formatTime(state.time)}`);
  console.log(`Orders completed: ${state.completedOrders.length}`);
  if(state.failedOrders.length > 0) {
    console.log(`Orders failed: ${state.failedOrders.length}`);
    console.log("Failed orders:");
    state.failedOrders.forEach(order => console.log(` - ${order.name}`));
  }
  console.log("Thanks for playing! Press Ctrl+C to exit.");
  rl.close();
  process.exit(0);
}

// --- GAME START ---
console.log("Welcome to ChronoChef Challenge!\n");
console.log("You are the master chef in a whimsical kitchen racing against time.");
console.log("Manage your ingredients, energy, and time wisely to complete today's menu!\n");
console.log("Instructions:");
console.log("- Each turn represents 5 minutes in the kitchen.");
console.log("- Choose tasks for chopping, cooking, plating, and serving.");
console.log("- Manage your energy and ingredients to avoid order failure.");
console.log("- Use 'rest' to regain energy or 'skip' to wait and lose some energy.");
console.log("- Complete all orders before the kitchen closes at 12:00.");
console.log("Good luck!\n");

setImmediate(gameTurn);
