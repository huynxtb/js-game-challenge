const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const STATE = {
  mp: 50,
  maxMp: 50,
  defeats: 0,
  maxDefeats: 3,
  tomes: new Set(),
  currentRoom: 0,
  sorcererHp: 100,
  sorcererShield: true,
  gameOver: false
};

const ROOMS = [
  {
    name: 'Grand Foyer',
    desc: 'Towering shelves line the walls. A glowing pedestal stands in the center.',
    hasTome: 'Tome of Arcane Secrets',
    puzzle: {
      question: 'Decipher the rune: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?"',
      answer: 'map',
      solved: false,
      rewardMp: 15,
      costMp: 5
    }
  },
  {
    name: 'Chamber of Whispers',
    desc: 'Floating books drift through the air, whispering forbidden incantations.',
    hasTome: 'Tome of Forgotten Shadows',
    creature: {
      name: 'Shadow Phantom',
      hp: 30,
      mpCost: 10,
      active: true
    }
  },
  {
    name: 'Astral Observatory',
    desc: 'A celestial dome displaying shifting constellations and ancient celestial maps.',
    hasTome: 'Tome of Celestial Light',
    puzzle: {
      question: 'Balance the cosmic scale: "Forward I am heavy, backward I am not. What am I?"',
      answer: 'ton',
      solved: false,
      rewardMp: 20,
      costMp: 5
    }
  },
  {
    name: 'Sanctum of the Dark Sorcerer',
    desc: 'Dark energy swirls around the Sorcerer Malakor, who floats above an obsidian rift.',
    isBossRoom: true
  }
];

function printStatus() {
  console.log('\n' + '='.repeat(50));
  console.log(`Location: ${ROOMS[STATE.currentRoom].name}`);
  console.log(`MP: ${STATE.mp}/${STATE.maxMp} | Defeats: ${STATE.defeats}/${STATE.maxDefeats} | Tomes Collected: ${STATE.tomes.size}/3`);
  console.log('='.repeat(50));
  console.log(ROOMS[STATE.currentRoom].desc);
}

function checkGameOver() {
  if (STATE.mp <= 0) {
    console.log('\n[DEFEAT] You have exhausted all your Magic Points. The library consumes your soul.');
    STATE.gameOver = true;
    rl.close();
    return true;
  }
  if (STATE.defeats >= STATE.maxDefeats) {
    console.log('\n[DEFEAT] You have suffered 3 defeats. Malakor banished you into the void.');
    STATE.gameOver = true;
    rl.close();
    return true;
  }
  return false;
}

function showMainMenu() {
  if (checkGameOver()) return;
  printStatus();
  
  const room = ROOMS[STATE.currentRoom];
  const options = [];
  
  if (!room.isBossRoom) {
    options.push({ text: 'Search room for Tomes / Secrets', action: handleSearch });
    if (room.puzzle && !room.puzzle.solved) {
      options.push({ text: 'Attempt ancient puzzle', action: handlePuzzle });
    }
    if (room.creature && room.creature.active) {
      options.push({ text: `Confront the ${room.creature.name}`, action: handleCombat });
    }
    options.push({ text: 'Meditate to restore MP (+10 MP, takes time)', action: handleMeditate });
    options.push({ text: 'Move to another room', action: handleMoveMenu });
  } else {
    options.push({ text: 'Attack Sorcerer Malakor', action: handleBossBattle });
    options.push({ text: 'Meditate to restore MP (+10 MP)', action: handleMeditate });
    options.push({ text: 'Retreat to another room', action: handleMoveMenu });
  }
  
  console.log('\nActions:');
  options.forEach((opt, idx) => console.log(`${idx + 1}. ${opt.text}`));
  
  rl.question('\nSelect an action: ', (input) => {
    const choice = parseInt(input.trim(), 10) - 1;
    if (choice >= 0 && choice < options.length) {
      options[choice].action();
    } else {
      console.log('Invalid choice.');
      showMainMenu();
    }
  });
}

function handleSearch() {
  const room = ROOMS[STATE.currentRoom];
  STATE.mp -= 2;
  console.log('\nYou channel 2 MP to scan the room with arcane vision.');
  
  if (room.hasTome && !STATE.tomes.has(room.hasTome)) {
    if (room.creature && room.creature.active) {
      console.log(`The ${room.creature.name} blocks your path to the tome! Defeat it first.`);
    } else if (room.puzzle && !room.puzzle.solved) {
      console.log('The tome is locked behind an active puzzle mechanism. Solve it to retrieve the tome.');
    } else {
      STATE.tomes.add(room.hasTome);
      console.log(`Success! You acquired: [${room.hasTome}]!`);
    }
  } else {
    console.log('No additional tomes found here.');
  }
  showMainMenu();
}

function handleMeditate() {
  const restored = Math.min(10, STATE.maxMp - STATE.mp);
  STATE.mp += restored;
  console.log(`\nYou sit in deep focus and channel ambient mana, recovering ${restored} MP.`);
  showMainMenu();
}

function handlePuzzle() {
  const room = ROOMS[STATE.currentRoom];
  const p = room.puzzle;
  console.log(`\n${p.question}`);
  console.log(`Attempting this puzzle costs ${p.costMp} MP.`);
  
  rl.question('Your answer (one word): ', (ans) => {
    STATE.mp -= p.costMp;
    if (ans.trim().toLowerCase() === p.answer.toLowerCase()) {
      p.solved = true;
      STATE.mp = Math.min(STATE.maxMp, STATE.mp + p.rewardMp);
      console.log(`\nCorrect! Arcane power flows into you (+${p.rewardMp} MP). The puzzle mechanism unlocks.`);
    } else {
      console.log('\nThe runes flicker red. Incorrect answer. Mana expended with no result.');
    }
    showMainMenu();
  });
}

function handleCombat() {
  const room = ROOMS[STATE.currentRoom];
  const creature = room.creature;
  console.log(`\nCombat initiated with ${creature.name} (HP: ${creature.hp}).`);
  console.log('Options:');
  console.log('1. Cast Arcane Blast (15 MP, deals 30 damage)');
  console.log('2. Cast Spell Dart (5 MP, deals 10 damage)');
  console.log('3. Flee');
  
  rl.question('Select spell: ', (ans) => {
    const c = ans.trim();
    if (c === '1') {
      if (STATE.mp < 15) {
        console.log('Not enough MP! The creature attacks while you struggle.');
        STATE.defeats += 1;
      } else {
        STATE.mp -= 15;
        creature.hp -= 30;
        console.log('Arcane Blast incinerates the enemy!');
      }
    } else if (c === '2') {
      if (STATE.mp < 5) {
        console.log('Not enough MP! The creature attacks while you struggle.');
        STATE.defeats += 1;
      } else {
        STATE.mp -= 5;
        creature.hp -= 10;
        console.log(`Spell Dart hits! Creature HP remaining: ${Math.max(0, creature.hp)}.`);
      }
    } else {
      console.log('You retreat from the fight.');
      showMainMenu();
      return;
    }
    
    if (creature.hp <= 0) {
      console.log(`The ${creature.name} dissolves into ether!`);
      creature.active = false;
    } else if (c === '2') {
      console.log(`The ${creature.name} strikes back before you can cast again! You suffer 1 defeat.`);
      STATE.defeats += 1;
    }
    showMainMenu();
  });
}

function handleBossBattle() {
  if (STATE.tomes.size < 3) {
    console.log('\nMalakor laughs: "Foolish librarian! Without all 3 ancient tomes, your magic cannot breach my shield!"');
    console.log('Malakor casts a dark surge, draining 15 MP and inflicting 1 defeat.');
    STATE.mp -= 15;
    STATE.defeats += 1;
    showMainMenu();
    return;
  }
  
  console.log('\nThe 3 Ancient Tomes resonate, shattering Malakor\'s obsidian shield!');
  console.log(`Sorcerer Malakor HP: ${STATE.sorcererHp}`);
  console.log('1. Cast Primordial Convergence (25 MP, 50 Damage)');
  console.log('2. Cast Banishing Nova (40 MP, 100 Damage)');
  console.log('3. Cast Light Ward (10 MP, defend)');
  
  rl.question('Select ultimate action: ', (ans) => {
    const c = ans.trim();
    if (c === '1') {
      if (STATE.mp < 25) {
        console.log('Insufficient MP! Malakor strikes you.');
        STATE.defeats += 1;
      } else {
        STATE.mp -= 25;
        STATE.sorcererHp -= 50;
        console.log(`Primordial Convergence crashes into Malakor! Malakor HP: ${Math.max(0, STATE.sorcererHp)}`);
      }
    } else if (c === '2') {
      if (STATE.mp < 40) {
        console.log('Insufficient MP! Malakor strikes you.');
        STATE.defeats += 1;
      } else {
        STATE.mp -= 40;
        STATE.sorcererHp -= 100;
        console.log('Banishing Nova consumes Malakor in blinding light!');
      }
    } else if (c === '3') {
      if (STATE.mp < 10) {
        console.log('Insufficient MP!');
        STATE.defeats += 1;
      } else {
        STATE.mp -= 10;
        console.log('Light Ward raised. Malakor\'s retaliation is absorbed.');
      }
    } else {
      console.log('Hesitation costs you! Malakor counters.');
      STATE.defeats += 1;
    }
    
    if (STATE.sorcererHp <= 0) {
      console.log('\n' + '*'.repeat(50));
      console.log('[VICTORY] Sorcerer Malakor is banished back into the Nether Abyss!');
      console.log('The Mystic Library is saved, and knowledge is preserved.');
      console.log('*'.repeat(50));
      STATE.gameOver = true;
      rl.close();
      return;
    }
    
    if (c !== '3') {
      console.log('Malakor retaliates with Dark Thunderbolt! (Takes 10 MP)');
      STATE.mp -= 10;
    }
    showMainMenu();
  });
}

function handleMoveMenu() {
  console.log('\nAvailable Locations:');
  ROOMS.forEach((r, idx) => {
    if (idx !== STATE.currentRoom) {
      console.log(`${idx + 1}. ${r.name}`);
    }
  });
  rl.question('Enter room number: ', (ans) => {
    const target = parseInt(ans.trim(), 10) - 1;
    if (target >= 0 && target < ROOMS.length && target !== STATE.currentRoom) {
      STATE.currentRoom = target;
      console.log(`You navigate through shifting corridors to the ${ROOMS[target].name}.`);
    } else {
      console.log('Invalid destination.');
    }
    showMainMenu();
  });
}

console.log('==================================================');
console.log('          WELCOME TO MYSTIC LIBRARIAN             ');
console.log('==================================================');
console.log('Objective: Find all 3 Ancient Tomes across the library');
console.log('and destroy Sorcerer Malakor in his Sanctum.');
console.log('Rules: Keep MP above 0 and avoid suffering 3 defeats.\n');

showMainMenu();
