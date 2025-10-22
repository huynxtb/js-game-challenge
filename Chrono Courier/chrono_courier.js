#!/usr/bin/env node

const readline = require('readline');

// Chrono Courier - single file console game
// Author: OpenAI's ChatGPT

class ChronoCourier {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Game State
    this.eras = [
      'Ancient Egypt',
      'Medieval Europe',
      'Industrial Revolution',
      'Modern Day',
      'Far Future'
    ];

    // Messages to deliver: each has a destination era and integrity score
    this.messages = [
      { id: 1, destination: 'Ancient Egypt', integrity: 100, delivered: false },
      { id: 2, destination: 'Medieval Europe', integrity: 100, delivered: false },
      { id: 3, destination: 'Industrial Revolution', integrity: 100, delivered: false },
      { id: 4, destination: 'Modern Day', integrity: 100, delivered: false },
      { id: 5, destination: 'Far Future', integrity: 100, delivered: false },
    ];

    this.player = {
      currentEra: 'Modern Day',
      temporalEnergy: 100,
      maxEnergy: 100
    };

    this.TEMPORAL_ENERGY_REGEN = 10; // per turn
    this.TEMPORAL_ENERGY_TRAVEL_COST = 25;
    this.TEMPORAL_ENERGY_ANOMALY_LOSS = 15;
    this.TURN_COUNT = 0;

    this.MIN_TOTAL_INTEGRITY = 350; // minimum integrity score sum to win

    this.running = false;
  }

  start() {
    console.clear();
    console.log('Welcome to Chrono Courier!');
    console.log(`You are a time-traveling messenger tasked with delivering crucial messages across eras.`);
    console.log(`Manage your Temporal Energy and beware of temporal anomalies.
`);
    this.running = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.running) {
      this.rl.close();
      return;
    }

    this.TURN_COUNT++;
    this.regenerateEnergy();
    this.degradeMessages();
    console.log('------------------------------------------------');
    console.log(`Turn ${this.TURN_COUNT}`);
    this.showStatus();

    if (this.checkLossConditions()) {
      this.endGame(false);
      return;
    }

    if (this.checkWinCondition()) {
      this.endGame(true);
      return;
    }

    this.promptPlayerAction();
  }

  regenerateEnergy() {
    if (this.player.temporalEnergy < this.player.maxEnergy) {
      this.player.temporalEnergy += this.TEMPORAL_ENERGY_REGEN;
      if (this.player.temporalEnergy > this.player.maxEnergy) {
        this.player.temporalEnergy = this.player.maxEnergy;
      }
    }
  }

  degradeMessages() {
    // Messages lose some integrity each turn not delivered due to time decay
    const DECAY_PER_TURN = 2;
    this.messages.forEach(msg => {
      if (!msg.delivered) {
        msg.integrity -= DECAY_PER_TURN;
        if (msg.integrity < 0) {
          msg.integrity = 0;
        }
      }
    });
  }

  showStatus() {
    console.log(`Current Era: ${this.player.currentEra}`);
    console.log(`Temporal Energy: ${this.player.temporalEnergy}/${this.player.maxEnergy}`);

    const remaining = this.messages.filter(m => !m.delivered);
    if (remaining.length === 0) {
      console.log('All messages delivered!');
    } else {
      console.log('Messages Remaining:');
      remaining.forEach(m => {
        console.log(`  #${m.id} to ${m.destination} - Integrity: ${m.integrity}%`);
      });
    }
  }

  promptPlayerAction() {
    console.log('\nChoose your action for this turn:');
    console.log('1. Travel to different era');
    console.log('2. Deliver a message');
    console.log('3. Do nothing (rest)');

    this.rl.question('Enter the number of your action: ', (answer) => {
      switch (answer.trim()) {
        case '1':
          this.handleTravel();
          break;
        case '2':
          this.handleDelivery();
          break;
        case '3':
          console.log('You rest this turn. Temporal Energy regenerates.');
          this.gameLoop();
          break;
        default:
          console.log('Invalid input. Please enter 1, 2, or 3.');
          this.promptPlayerAction();
      }
    });
  }

  handleTravel() {
    console.log('\nAvailable eras to travel to:');
    this.eras.forEach((era, idx) => {
      if (era !== this.player.currentEra) {
        console.log(`  ${idx + 1}. ${era}`);
      }
    });

    this.rl.question('Enter the number corresponding to the era to travel: ', (input) => {
      let choice = parseInt(input.trim(), 10);
      if (isNaN(choice) || choice < 1 || choice > this.eras.length) {
        console.log('Invalid input. Please enter a valid era number.');
        return this.handleTravel();
      }

      let chosenEra = this.eras[choice - 1];
      if (chosenEra === this.player.currentEra) {
        console.log('You are already in that era. Choose a different era.');
        return this.handleTravel();
      }

      if (this.player.temporalEnergy < this.TEMPORAL_ENERGY_TRAVEL_COST) {
        console.log('Insufficient Temporal Energy to travel. You must rest or deliver instead.');
        return this.promptPlayerAction();
      }

      this.player.temporalEnergy -= this.TEMPORAL_ENERGY_TRAVEL_COST;

      // Travel success with chance of temporal anomaly
      this.player.currentEra = chosenEra;
      console.log(`Timing your jump to ${chosenEra}...`);
      this.handleTemporalAnomaly('travel');
    });
  }

  handleDelivery() {
    const deliverable = this.messages.filter(m => !m.delivered && m.destination === this.player.currentEra);
    if (deliverable.length === 0) {
      console.log('No messages to deliver in this era.');
      return this.gameLoop();
    }

    console.log('\nMessages you can deliver here:');
    deliverable.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. Message #${msg.id} - Integrity: ${msg.integrity}%`);
    });

    this.rl.question('Choose the message number to deliver: ', (input) => {
      let choice = parseInt(input.trim(), 10);
      if (isNaN(choice) || choice < 1 || choice > deliverable.length) {
        console.log('Invalid input. Please enter a valid message number.');
        return this.handleDelivery();
      }

      const msgToDeliver = deliverable[choice - 1];

      // Attempt to deliver with chance of anomaly
      console.log(`Delivering Message #${msgToDeliver.id} ...`);
      this.handleTemporalAnomaly('delivery', msgToDeliver);
    });
  }

  handleTemporalAnomaly(actionType, message=null) {
    // Random chance of anomaly (30%)
    const anomalyChance = 0.3;
    if (Math.random() < anomalyChance) {
      console.log('*** Temporal Anomaly Encountered! ***');
      this.player.temporalEnergy -= this.TEMPORAL_ENERGY_ANOMALY_LOSS;
      if (this.player.temporalEnergy < 0) this.player.temporalEnergy = 0;

      if (actionType === 'delivery' && message) {
        // Message corruption
        let corruption = Math.floor(Math.random() * 30) + 10; // 10 to 40%
        message.integrity -= corruption;
        if (message.integrity < 0) message.integrity = 0;
        console.log(`Message #${message.id} was corrupted by ${corruption}%. Integrity now at ${message.integrity}%.`);

        if (message.integrity === 0) {
          console.log(`Message #${message.id} has been completely corrupted and lost.`);
          message.delivered = true; // Consider lost and delivered (to avoid retry)
        } else {
          // Successfully delivered with corruption
          message.delivered = true;
          console.log(`Message #${message.id} was delivered despite anomalies.`);
        }
      } else {
        console.log(`Temporal Energy lost due to anomaly. Current energy: ${this.player.temporalEnergy}`);
      }
    } else {
      // No anomaly
      if (actionType === 'delivery' && message) {
        // Deliver without corruption
        message.delivered = true;
        console.log(`Message #${message.id} delivered successfully.`);
      } else {
        console.log('No temporal anomalies detected during travel.');
      }
    }

    // Continue game loop
    this.gameLoop();
  }

  checkWinCondition() {
    // Check if all messages delivered
    let allDelivered = this.messages.every(m => m.delivered);
    if (!allDelivered) return false;

    // Check total integrity
    let totalIntegrity = this.messages.reduce((sum, m) => sum + m.integrity, 0);
    return totalIntegrity >= this.MIN_TOTAL_INTEGRITY;
  }

  checkLossConditions() {
    if (this.player.temporalEnergy <= 0) {
      console.log('\nYou have run out of Temporal Energy and are stranded in time.');
      return true;
    }

    let integrityZero = this.messages.some(m => !m.delivered && m.integrity <= 0);
    if (integrityZero) {
      console.log('\nAt least one message integrity has dropped to zero before delivery. Mission failed.');
      return true;
    }

    return false;
  }

  endGame(won) {
    if (won) {
      console.log('\nCongratulations! You have delivered all messages with adequate integrity. You win!');
      let totalIntegrity = this.messages.reduce((sum, m) => sum + m.integrity, 0);
      console.log(`Total Message Integrity Score: ${totalIntegrity}`);
    } else {
      console.log('\nGAME OVER. Please try again.');
    }
    this.running = false;
    this.rl.close();
  }
}

const game = new ChronoCourier();
game.start();
