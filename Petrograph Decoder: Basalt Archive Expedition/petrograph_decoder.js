const readline = require('readline');

const GLYPHS = [
  { id: 1, sym: '☉', code: 'S', name: 'Sun' },
  { id: 2, sym: '☽', code: 'M', name: 'Moon' },
  { id: 3, sym: '△', code: 'U', name: 'Pyramid' },
  { id: 4, sym: '▽', code: 'D', name: 'Chasm' },
  { id: 5, sym: '◇', code: 'Di', name: 'Diamond' },
  { id: 6, sym: '⬡', code: 'H', name: 'Hexagon' },
  { id: 7, sym: '⊕', code: 'C', name: 'Cross-Circle' },
  { id: 8, sym: '✦', code: 'St', name: 'Star' }
];

const MAX_SUPPLIES = 30;
const MAX_ENERGY = 12;
const MORNING_ENERGY = 8;
const MAX_SANITY = 20;
const MAX_HINT_SHARDS = 3;
const STORM_LIMIT = 25;

class PetrographGame {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.initGame();
  }

  initGame() {
    this.day = 1;
    this.stormDays = STORM_LIMIT;
    this.supplies = 30;
    this.energy = 10;
    this.sanity = 20;
    this.tokens = 0;
    this.hintShards = 0;
    this.totalAttempts = 0;
    this.maxEnergyMod = 0;
    this.decodeCostMod = 0;
    this.pendingEventMessage = null;
    this.dayLogs = [];

    this.tablets = [
      { id: 1, name: 'Tablet 1', diff: 'Easy', length: 3, status: 'Undiscovered', sequence: null, guesses: [], knownPositions: {} },
      { id: 2, name: 'Tablet 2', diff: 'Easy', length: 3, status: 'Undiscovered', sequence: null, guesses: [], knownPositions: {} },
      { id: 3, name: 'Tablet 3', diff: 'Med ', length: 4, status: 'Undiscovered', sequence: null, guesses: [], knownPositions: {} },
      { id: 4, name: 'Tablet 4', diff: 'Med ', length: 4, status: 'Undiscovered', sequence: null, guesses: [], knownPositions: {} },
      { id: 5, name: 'Tablet 5', diff: 'Hard', length: 5, status: 'Undiscovered', sequence: null, guesses: [], knownPositions: {} }
    ];
  }

  ask(query) {
    return new Promise((resolve) => {
      this.rl.question(query, (ans) => resolve(ans.trim()));
    });
  }

  generateSequence(length) {
    const seq = [];
    for (let i = 0; i < length; i++) {
      const randIdx = Math.floor(Math.random() * GLYPHS.length);
      seq.push(GLYPHS[randIdx]);
    }
    return seq;
  }

  log(msg) {
    this.dayLogs.push(msg);
  }

  async start() {
    console.clear();
    console.log('===============================================================');
    console.log('       PETROGRAPH DECODER: BASALT ARCHIVE EXPEDITION           ');
    console.log('===============================================================');
    console.log('You have arrived at the desolate volcanic plateau.');
    console.log('5 ancient basalt petroglyphs await decipherment before the sandstorm.');
    console.log('Manage your resources and crack the ancient logic sequences.\n');
    await this.ask('Press ENTER to set up camp and begin Day 1...');
    await this.turnLoop();
  }

  async turnLoop() {
    while (true) {
      if (this.checkWin()) {
        this.renderWinScreen();
        break;
      }
      const lossReason = this.checkLoss();
      if (lossReason) {
        this.renderLossScreen(lossReason);
        break;
      }

      await this.runDay();
    }

    const playAgain = await this.ask('\nWould you like to embark on another expedition? (y/n): ');
    if (playAgain.toLowerCase().startsWith('y')) {
      this.initGame();
      await this.turnLoop();
    } else {
      console.log('\nThank you for exploring the Basalt Archive. Safe travels!\n');
      this.rl.close();
    }
  }

  checkWin() {
    return this.tablets.every((t) => t.status === 'Fully Decoded');
  }

  checkLoss() {
    if (this.supplies <= 0) return 'SUPPLIES';
    if (this.sanity <= 0) return 'SANITY';
    if (this.stormDays <= 0 && !this.checkWin()) return 'SANDSTORM';
    return null;
  }

  renderHUD() {
    console.clear();
    const stormDisplay = this.stormDays > 0 ? `${this.stormDays}d remaining` : 'IMMINENT/ACTIVE';
    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log(`║  PETROGRAPH DECODER — Day ${String(this.day).padEnd(2, ' ')} │ Sandstorm Arrival: ${stormDisplay.padEnd(23, ' ')}║`);
    console.log('╠══════════════════════════════════════════════════════════════════════════╣');
    const supStr = `Supplies: ${this.supplies}/${MAX_SUPPLIES}`.padEnd(18, ' ');
    const engStr = `Energy: ${this.energy}/${Math.min(MAX_ENERGY, MAX_ENERGY + this.maxEnergyMod)}`.padEnd(18, ' ');
    const sanStr = `Sanity: ${this.sanity}/${MAX_SANITY}`.padEnd(16, ' ');
    const tokStr = `Tokens: ${this.tokens}`.padEnd(13, ' ');
    console.log(`║  ${supStr} ${engStr} ${sanStr} ${tokStr} ║`);
    console.log(`║  Hint Shards: [${this.hintShards}/${MAX_HINT_SHARDS}]` + ' '.repeat(51) + '║');
    console.log('╠══════════════════════════════════════════════════════════════════════════╣');
    console.log('║ TABLET STATUS:                                                           ║');
    this.tablets.forEach((t) => {
      let statusStr = '';
      if (t.status === 'Undiscovered') {
        statusStr = '❓ Undiscovered';
      } else if (t.status === 'Fully Decoded') {
        const decodedGlyphs = t.sequence.map((g) => `${g.sym}(${g.code})`).join(' ');
        statusStr = `✅ Fully Decoded [ ${decodedGlyphs} ]`;
      } else if (t.status === 'Partially Decoded') {
        statusStr = `🔍 Partially Decoded (${t.guesses.length} tries)`;
      } else {
        statusStr = `🔍 Excavated (${t.guesses.length} tries)`;
      }
      const line = `║  ${t.name} [${t.diff} - ${t.length} Glyphs]: ${statusStr}`;
      console.log(line.padEnd(75, ' ') + '║');
    });
    console.log('╚══════════════════════════════════════════════════════════════════════════╝');

    if (this.dayLogs.length > 0) {
      console.log('\n[ Field Log ]');
      this.dayLogs.forEach((l) => console.log(` • ${l}`));
      this.dayLogs = [];
    }
  }

  async runDay() {
    let turnFinished = false;
    let primaryActionTaken = null;

    while (!turnFinished) {
      this.renderHUD();
      console.log('\nGLYPH PALETTE REFERENCE:');
      const palette = GLYPHS.map((g) => `${g.id}.${g.sym} [${g.code}] ${g.name}`).join(' | ');
      console.log(palette);

      console.log('\nCHOOSE ACTION:');
      console.log('1. Scout Next Tablet (2 Energy)');
      console.log('2. Study Glyphs (+2-4 Tokens, 15% Shard) (3 Energy)');
      console.log('3. Attempt Decode Tablet (4 Energy + Decryption Tokens)');
      console.log('4. Rest (+3 Sanity) (0 Energy)');
      console.log('5. Forage (+3 Supplies) (3 Energy)');
      console.log('6. Consult Field Notes (Reveal glyph position, 5 Tokens) (2 Energy)');
      if (this.hintShards > 0) {
        console.log('7. Use Hint Shard (Free Action, 0 Energy)');
      }
      console.log('8. View Decryption Tablet Logs / Guesses');
      console.log('0. End Turn / Sleep for the Day');

      const choice = await this.ask('\nEnter choice: ');

      switch (choice) {
        case '1':
          await this.actionScout();
          break;
        case '2':
          await this.actionStudy(false);
          break;
        case '3':
          await this.actionAttemptDecode();
          break;
        case '4':
          await this.actionRest(false);
          break;
        case '5':
          await this.actionForage(false);
          break;
        case '6':
          await this.actionConsultFieldNotes();
          break;
        case '7':
          if (this.hintShards > 0) {
            await this.actionUseHintShard();
          } else {
            this.log('You have no Hint Shards to use.');
          }
          break;
        case '8':
          await this.viewTabletHistory();
          break;
        case '0':
          turnFinished = true;
          break;
        default:
          this.log('Invalid command selection.');
          break;
      }
    }

    await this.endDay();
  }

  async actionScout() {
    const nextTablet = this.tablets.find((t) => t.status === 'Undiscovered');
    if (!nextTablet) {
      this.log('All tablets have already been discovered!');
      return;
    }
    if (this.energy < 2) {
      this.log('Not enough Energy (2 required) to scout.');
      return;
    }

    this.energy -= 2;
    nextTablet.status = 'Excavated';
    nextTablet.sequence = this.generateSequence(nextTablet.length);
    this.log(`Excavated ${nextTablet.name}! It contains a sequence of ${nextTablet.length} glyphs.`);
  }

  async actionStudy(isSecondary = false) {
    const cost = isSecondary ? 5 : 3;
    if (this.energy < cost) {
      this.log(`Not enough Energy (${cost} required) to study glyphs.`);
      return;
    }
    this.energy -= cost;
    const tokensGained = Math.floor(Math.random() * 3) + 2; // 2-4
    this.tokens = Math.min(99, this.tokens + tokensGained);
    let msg = `Studied glyph syntax. Gained ${tokensGained} Decryption Tokens.`;

    if (Math.random() < 0.15 && this.hintShards < MAX_HINT_SHARDS) {
      this.hintShards++;
      msg += ' You uncovered a crystal Hint Shard!';
    }
    this.log(msg);
  }

  async actionRest(isSecondary = false) {
    const cost = isSecondary ? 2 : 0;
    if (this.energy < cost) {
      this.log(`Not enough Energy (${cost} required) to rest.`);
      return;
    }
    this.energy -= cost;
    this.sanity = Math.min(MAX_SANITY, this.sanity + 3);
    this.log('You rested and meditated by the basalt monoliths. Gained +3 Sanity.');
  }

  async actionForage(isSecondary = false) {
    const cost = isSecondary ? 5 : 3;
    if (this.energy < cost) {
      this.log(`Not enough Energy (${cost} required) to forage.`);
      return;
    }
    this.energy -= cost;
    this.supplies = Math.min(MAX_SUPPLIES, this.supplies + 3);
    this.log('Scoured the plateau for desert tubers and moisture vapor. Gained +3 Supplies.');
  }

  async actionConsultFieldNotes() {
    const available = this.tablets.filter((t) => t.status === 'Excavated' || t.status === 'Partially Decoded');
    if (available.length === 0) {
      this.log('No excavated or partially decoded tablets to consult notes on.');
      return;
    }
    if (this.energy < 2) {
      this.log('Not enough Energy (2 required) to consult field notes.');
      return;
    }
    if (this.tokens < 5) {
      this.log('Not enough Decryption Tokens (5 required).');
      return;
    }

    console.log('\nSelect Tablet to consult notes for:');
    available.forEach((t) => console.log(`${t.id}. ${t.name} (${t.diff} - ${t.length} glyphs)`));
    const pick = await this.ask('Enter tablet number (or 0 to cancel): ');
    const tablet = available.find((t) => t.id === parseInt(pick, 10));
    if (!tablet) return;

    const unrevealedIdxs = [];
    for (let i = 0; i < tablet.length; i++) {
      if (!tablet.knownPositions[i]) unrevealedIdxs.push(i);
    }

    if (unrevealedIdxs.length === 0) {
      this.log('All glyph positions for this tablet are already known!');
      return;
    }

    this.energy -= 2;
    this.tokens -= 5;
    const chosenIdx = unrevealedIdxs[Math.floor(Math.random() * unrevealedIdxs.length)];
    const glyph = tablet.sequence[chosenIdx];
    tablet.knownPositions[chosenIdx] = glyph;
    tablet.status = 'Partially Decoded';
    this.log(`Field notes translated! Position ${chosenIdx + 1} of ${tablet.name} is confirmed as ${glyph.sym} [${glyph.code} - ${glyph.name}].`);
  }

  async actionUseHintShard() {
    const available = this.tablets.filter((t) => t.status === 'Excavated' || t.status === 'Partially Decoded');
    if (available.length === 0) {
      this.log('No eligible tablet to divine clues for.');
      return;
    }

    console.log('\nSelect Tablet to use Hint Shard on:');
    available.forEach((t) => console.log(`${t.id}. ${t.name}`));
    const pick = await this.ask('Enter tablet number (or 0 to cancel): ');
    const tablet = available.find((t) => t.id === parseInt(pick, 10));
    if (!tablet) return;

    this.hintShards--;
    const inSeq = tablet.sequence.map((g) => g.code);
    const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    if (inSeq.includes(randomGlyph.code)) {
      this.log(`Shard Resonated: Glyph ${randomGlyph.sym} [${randomGlyph.code} - ${randomGlyph.name}] IS in the sequence for ${tablet.name}!`);
    } else {
      this.log(`Shard Resonated: Glyph ${randomGlyph.sym} [${randomGlyph.code} - ${randomGlyph.name}] is NOT in the sequence for ${tablet.name}.`);
    }
  }

  async actionAttemptDecode() {
    const available = this.tablets.filter((t) => t.status === 'Excavated' || t.status === 'Partially Decoded');
    if (available.length === 0) {
      this.log('No excavated tablets available to decode. Scout one first!');
      return;
    }

    const requiredTokens = 3 + this.decodeCostMod;
    if (this.energy < 4) {
      this.log('Not enough Energy (4 required) to attempt decoding.');
      return;
    }
    if (this.tokens < requiredTokens) {
      this.log(`Not enough Decryption Tokens (${requiredTokens} required).`);
      return;
    }

    console.log('\nSelect Tablet to decode:');
    available.forEach((t) => console.log(`${t.id}. ${t.name} (${t.length} glyphs)`));
    const pick = await this.ask('Enter tablet number (or 0 to cancel): ');
    const tablet = available.find((t) => t.id === parseInt(pick, 10));
    if (!tablet) return;

    console.clear();
    console.log(`=== DECODING: ${tablet.name} (Length: ${tablet.length}) ===`);
    this.displayTabletGuessHistory(tablet);

    console.log('\nGLYPH CHOICES:');
    GLYPHS.forEach((g) => console.log(`[${g.id}] ${g.sym} (Code: ${g.code}, Name: ${g.name})`));
    console.log(`\nEnter sequence of ${tablet.length} glyphs separated by space (e.g. '1 3 2' or 'S U M') or 'cancel':`);

    const input = await this.ask('> ');
    if (input.toLowerCase() === 'cancel') return;

    const parsedGlyphs = this.parseGlyphInput(input, tablet.length);
    if (!parsedGlyphs) {
      this.log('Invalid sequence format entered. Attempt canceled with no resource loss.');
      return;
    }

    // Deduct cost
    this.energy -= 4;
    this.tokens -= requiredTokens;
    this.decodeCostMod = 0; // Reset equipment damage if active
    this.totalAttempts++;

    const feedback = this.evaluateGuess(tablet.sequence, parsedGlyphs);
    const guessRecord = {
      guess: parsedGlyphs,
      exact: feedback.exact,
      partial: feedback.partial,
      miss: feedback.miss
    };
    tablet.guesses.push(guessRecord);

    if (feedback.exact === tablet.length) {
      tablet.status = 'Fully Decoded';
      this.log(`✨ SUCCESS! ${tablet.name} fully decoded! Ancient wisdom floods your mind.`);
    } else {
      tablet.status = 'Partially Decoded';
      this.sanity = Math.max(0, this.sanity - 1);
      this.log(`Decode attempt on ${tablet.name} was incomplete. Result: ${feedback.exact} Exact [🟢], ${feedback.partial} Partial [🟡], ${feedback.miss} Miss [⚫]. Lost 1 Sanity.`);
    }
  }

  parseGlyphInput(input, expectedLen) {
    const parts = input.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length !== expectedLen) return null;

    const result = [];
    for (const p of parts) {
      const gById = GLYPHS.find((g) => String(g.id) === p);
      const gByCode = GLYPHS.find((g) => g.code.toLowerCase() === p.toLowerCase());
      const gBySym = GLYPHS.find((g) => g.sym === p);

      const matched = gById || gByCode || gBySym;
      if (!matched) return null;
      result.push(matched);
    }
    return result;
  }

  evaluateGuess(targetSeq, guessSeq) {
    const len = targetSeq.length;
    let exact = 0;
    let partial = 0;

    const targetUsed = new Array(len).fill(false);
    const guessUsed = new Array(len).fill(false);

    // First pass: Exact matches
    for (let i = 0; i < len; i++) {
      if (guessSeq[i].code === targetSeq[i].code) {
        exact++;
        targetUsed[i] = true;
        guessUsed[i] = true;
      }
    }

    // Second pass: Partial matches
    for (let i = 0; i < len; i++) {
      if (!guessUsed[i]) {
        for (let j = 0; j < len; j++) {
          if (!targetUsed[j] && guessSeq[i].code === targetSeq[j].code) {
            partial++;
            targetUsed[j] = true;
            break;
          }
        }
      }
    }

    const miss = len - exact - partial;
    return { exact, partial, miss };
  }

  displayTabletGuessHistory(tablet) {
    console.log(`Known Positions:`);
    const knownStr = [];
    for (let i = 0; i < tablet.length; i++) {
      if (tablet.knownPositions[i]) {
        knownStr.push(`[${i + 1}: ${tablet.knownPositions[i].sym} (${tablet.knownPositions[i].code})]`);
      } else {
        knownStr.push(`[${i + 1}: ? ]`);
      }
    }
    console.log(knownStr.join(' '));

    if (tablet.guesses.length === 0) {
      console.log('No previous attempts recorded on this tablet.');
      return;
    }
    console.log('\n--- Attempt History ---');
    tablet.guesses.forEach((g, idx) => {
      const guessStr = g.guess.map((x) => `${x.sym}(${x.code})`).join(' ');
      const exactIcons = '🟢'.repeat(g.exact);
      const partIcons = '🟡'.repeat(g.partial);
      const missIcons = '⚫'.repeat(g.miss);
      console.log(`Try #${idx + 1}: [ ${guessStr} ] => ${exactIcons}${partIcons}${missIcons} (Exact: ${g.exact}, Partial: ${g.partial}, Miss: ${g.miss})`);
    });
  }

  async viewTabletHistory() {
    console.clear();
    console.log('=== TABLET GUESS ARCHIVES ===');
    const excavated = this.tablets.filter((t) => t.status !== 'Undiscovered');
    if (excavated.length === 0) {
      console.log('No tablets excavated yet.');
    } else {
      excavated.forEach((t) => {
        console.log(`\n--- ${t.name} [${t.status}] ---`);
        this.displayTabletGuessHistory(t);
      });
    }
    await this.ask('\nPress ENTER to return to camp actions...');
  }

  async endDay() {
    // Daily supply drain
    this.supplies = Math.max(0, this.supplies - 2);
    this.stormDays = Math.max(0, this.stormDays - 1);
    this.day++;

    // Reset Energy to 8 morning baseline
    const effectiveMax = Math.max(4, MAX_ENERGY + this.maxEnergyMod);
    this.energy = Math.min(MORNING_ENERGY, effectiveMax);
    this.maxEnergyMod = 0; // Reset temporary energy modifiers

    // Check random event (10% chance after Day 3)
    if (this.day > 3 && Math.random() < 0.2) {
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent() {
    const roll = Math.floor(Math.random() * 6) + 1;
    switch (roll) {
      case 1:
        this.supplies = Math.max(0, this.supplies - 2);
        this.maxEnergyMod = -1;
        this.energy = Math.max(1, this.energy - 1);
        this.log('⚡ EVENT: Rock Slide! Loose basalt smashed some supplies (-2 Supplies, -1 Max Energy today).');
        break;
      case 2:
        this.sanity = Math.max(0, this.sanity - 2);
        this.tokens += 2;
        this.log('⚡ EVENT: Mysterious Whispers! Eerie chants echo from the fissures (-2 Sanity, +2 Tokens).');
        break;
      case 3:
        this.supplies = Math.min(MAX_SUPPLIES, this.supplies + 5);
        this.log('⚡ EVENT: Cache Discovery! Uncovered an old emergency ration crate (+5 Supplies).');
        break;
      case 4:
        if (this.hintShards < MAX_HINT_SHARDS) {
          this.hintShards++;
          this.log('⚡ EVENT: Glyph Vision! A vivid dream revealed an ancient insight (+1 Hint Shard).');
        } else {
          this.log('⚡ EVENT: Calm Night. The volcanic plateau was quiet and serene.');
        }
        break;
      case 5:
        this.decodeCostMod = 2;
        this.log('⚡ EVENT: Equipment Damage! Stylus tip fractured. Next decode attempt costs +2 Tokens.');
        break;
      case 6:
        this.stormDays = Math.max(0, this.stormDays - 1);
        this.log('⚡ EVENT: Sandstorm Gust! Fierce gale winds speed up the oncoming storm (-1 Storm Day).');
        break;
    }
  }

  renderWinScreen() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                      EXPEDITION VICTORIOUS!                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝');
    console.log('\nYou have unlocked the ultimate secrets of the Basalt Archive!');
    console.log('All 5 ancient petroglyph sequences were deciphered before the sandstorm strikes.');
    console.log('\n--- EXPEDITION STATISTICS ---');
    console.log(` • Days Elapsed: ${this.day - 1}`);
    console.log(` • Remaining Sandstorm Days: ${this.stormDays}`);
    console.log(` • Final Supplies: ${this.supplies}/${MAX_SUPPLIES}`);
    console.log(` • Final Sanity: ${this.sanity}/${MAX_SANITY}`);
    console.log(` • Final Decryption Tokens: ${this.tokens}`);
    console.log(` • Total Decode Attempts: ${this.totalAttempts}`);
  }

  renderLossScreen(reason) {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         EXPEDITION FAILED                                ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');
    if (reason === 'SUPPLIES') {
      console.log('💀 LOSS: You have run out of provisions. The expedition is over.');
    } else if (reason === 'SANITY') {
      console.log('💀 LOSS: Your mind fractures under the weight of ancient symbols.');
      console.log('You can no longer distinguish reality from glyph-madness.');
    } else if (reason === 'SANDSTORM') {
      const undecoded = this.tablets.filter((t) => t.status !== 'Fully Decoded').length;
      console.log(`💀 LOSS: The sandstorm engulfs the plateau. ${undecoded} tablets remain buried forever beneath the ash.`);
    }

    const decodedCount = this.tablets.filter((t) => t.status === 'Fully Decoded').length;
    console.log(`\nDay of Failure: Day ${this.day}`);
    console.log(`Tablets Decoded: ${decodedCount}/5`);
  }
}

const game = new PetrographGame();
game.start();
