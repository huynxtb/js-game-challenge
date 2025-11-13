const readline = require('readline');

/**
 * Circuit Caper - Console Game
 * 
 * You are an AI engineer trapped inside a malfunctioning supercomputer. Your goal is to reroute power through circuit nodes
 * to restore the core system while managing power units and avoiding system failures.
 * 
 * This file contains all the game logic and interaction in a single executable node.js script.
 */

class Node {
  constructor(id, type, effectValue, description) {
    this.id = id;             // Unique identifier (string)
    this.type = type;         // 'power_up', 'power_down', 'event', or 'core'
    this.effectValue = effectValue; // Integer value indicating power effect (+ or -)
    this.description = description; // Textual description of the node
    this.activated = false;   // Whether this node has been activated
    this.connections = new Set(); // Connected node ids
  }

  connect(node) {
    this.connections.add(node.id);
    node.connections.add(this.id);
  }
}

class CircuitCaper {
  constructor() {
    this.nodes = new Map();
    this.powerUnits = 20;    // Starting power units
    this.turn = 1;
    this.gameOver = false;
    this.win = false;
    this.coreNodeId = 'C'; // The node representing core
    this.eventChance = 0.25; // Probability of system event each turn
    this.activePath = new Set(); // Nodes activated forming the current path
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  setup() {
    // Create nodes
    // Ids are letters for convenience
    // Types: 'power_up', 'power_down', 'event', 'core'
    // effectValue: how many power units it adds or removes when activated

    // Power Up Nodes (+ power units)
    this.addNode(new Node('A', 'power_up', +5, 'Power Amplifier Node'));
    this.addNode(new Node('B', 'power_up', +3, 'Voltage Booster Node'));

    // Power Down Nodes (- power units)
    this.addNode(new Node('D', 'power_down', -4, 'Resistor Node'));
    this.addNode(new Node('E', 'power_down', -3, 'Damaged Capacitor Node'));

    // Event Nodes (trigger random events)
    this.addNode(new Node('F', 'event', 0, 'Glitch Node'));
    this.addNode(new Node('G', 'event', 0, 'System Anomaly Node'));

    // Core Node
    this.addNode(new Node('C', 'core', 0, 'Core System Node'));

    // Build connections (graph)
    // The circuit graph map:
    // A - B - C
    // |   |   |
    // D - E - F
    //      |
    //      G

    this.connectNodes('A', 'B');
    this.connectNodes('A', 'D');
    this.connectNodes('B', 'C');
    this.connectNodes('B', 'E');
    this.connectNodes('C', 'F');
    this.connectNodes('D', 'E');
    this.connectNodes('E', 'F');
    this.connectNodes('E', 'G');

    // Initially activate node A since it is the start (entry point)
    this.activateNode('A', false); // false means no cost or power changes for the start
    this.activePath.add('A');
  }

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  connectNodes(id1, id2) {
    const n1 = this.nodes.get(id1);
    const n2 = this.nodes.get(id2);
    if (n1 && n2) {
      n1.connect(n2);
    }
  }

  displayStatus() {
    console.clear();
    console.log('=== Circuit Caper ===');
    console.log(`Turn: ${this.turn}`);
    console.log(`Available Power Units: ${this.powerUnits}`);
    console.log('');
    console.log('Activated Nodes:', Array.from(this.activePath).join(', '));
    console.log('');

    // Display node map with status
    console.log('Circuit Node Status:');
    for (const node of this.nodes.values()) {
      let status = node.activated ? 'Activated' : 'Inactive';
      let connectionList = Array.from(node.connections).join(', ');
      console.log(`- [${node.id}] ${node.description} - ${status} - Connected to: ${connectionList}`);
    }
    console.log('');
    console.log('Instructions: Choose a node to activate next from nodes connected to your active path.

Each activation costs 1 power unit plus the node effect (adding or subtracting power). Avoid power dropping to zero or below.
Your goal is to activate a continuous path reaching the Core Node (C) with sufficient power.
');
  }

  promptPlayer() {
    return new Promise((resolve) => {
      // Gather all nodes which are inactive but connected to the active path
      let validTargets = new Set();
      for (const activeId of this.activePath) {
        const node = this.nodes.get(activeId);
        for (const connId of node.connections) {
          const connectedNode = this.nodes.get(connId);
          if (!connectedNode.activated) {
            validTargets.add(connId);
          }
        }
      }
      if (validTargets.size === 0) {
        // No moves possible
        resolve(null);
        return;
      }

      console.log('Nodes you can activate next:', Array.from(validTargets).join(', '));

      this.readlineInterface.question('Enter node ID to activate: ', (answer) => {
        let choice = answer.trim().toUpperCase();
        if (validTargets.has(choice)) {
          resolve(choice);
        } else {
          console.log('Invalid choice or node already activated. Try again.');
          resolve(this.promptPlayer());
        }
      });
    });
  }

  activateNode(nodeId, usePowerCost = true) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    if (node.activated) return false; // already activated

    let powerCost = 1; // 1 power unit consumed for activation action
    let powerEffect = node.effectValue; // power change from node

    if (usePowerCost) {
      this.powerUnits -= powerCost;
      this.powerUnits += powerEffect;
    }

    node.activated = true;
    this.activePath.add(nodeId);

    console.log(`\nActivated Node ${node.id}: ${node.description}`);

    if (powerEffect > 0) {
      console.log(`Power increased by ${powerEffect} units.`);
    } else if (powerEffect < 0) {
      console.log(`Power decreased by ${-powerEffect} units.`);
    } else if (node.type === 'event') {
      console.log('This node triggers a system event...');
    }

    return true;
  }

  checkWinCondition() {
    // Win if core node is activated AND the active path includes core node
    const coreNode = this.nodes.get(this.coreNodeId);
    if (coreNode && coreNode.activated) {
      this.win = true;
      this.gameOver = true;
      console.log('\n*** SYSTEM RESTORED! You successfully powered the Core Node! ***');
      console.log('Congratulations, you escaped the malfunctioning supercomputer!');
      this.readlineInterface.close();
    }
  }

  checkLossCondition() {
    if (this.powerUnits <= 0) {
      this.gameOver = true;
      console.log('\n*** SYSTEM FAILURE! Power has been depleted. ***');
      console.log('You failed to keep the system online.');
      this.readlineInterface.close();
    }
  }

  async applySystemEvent() {
    if (Math.random() > this.eventChance) return; // No event this turn

    // Pick a random event from the active or inactive nodes except core
    const possibleNodes = Array.from(this.nodes.values()).filter(n => n.type !== 'core');
    if (possibleNodes.length === 0) return;

    const eventNode = possibleNodes[Math.floor(Math.random() * possibleNodes.length)];

    // Define some system failure or glitch events
    const events = [
      () => {
        // System glitch disables a random inactive node temporarily
        // Mark node as "glitched": can't be activated next turn
        if (!eventNode.activated) {
          eventNode.glitched = true;
          console.log(`\n[System Event] Node ${eventNode.id} experiences a temporary glitch and cannot be activated next turn.`);
        }
      },
      () => {
        // Power surge reduces available power units slightly
        const loss = 2 + Math.floor(Math.random() * 3); // 2-4 power loss
        this.powerUnits = Math.max(0, this.powerUnits - loss);
        console.log(`\n[System Event] Power surge causes a loss of ${loss} power units!`);
      },
      () => {
        // Repair system fix: restores a random glitched node
        let glitchedNodes = Array.from(this.nodes.values()).filter(n => n.glitched === true);
        if (glitchedNodes.length > 0) {
          const toRepair = glitchedNodes[Math.floor(Math.random() * glitchedNodes.length)];
          toRepair.glitched = false;
          console.log(`\n[System Event] Repair protocol restores Node ${toRepair.id} from glitch.`);
        }
      },
      () => {
        // Temporary boost on a power up node (effect +1 next turn only)
        if (eventNode.type === 'power_up' && !eventNode.activated) {
          eventNode.tempBoost = 1;
          console.log(`\n[System Event] Node ${eventNode.id} temporarily increases power gain next turn.`);
        }
      },
      () => {
        // Major malfunction: unavoidable system failure if power below threshold
        if (this.powerUnits < 5) {
          this.gameOver = true;
          console.log('\n*** CRITICAL FAILURE! System instability causes unrecoverable crash! ***');
          this.readlineInterface.close();
        }
      }
    ];

    // Randomly pick an event
    const chosenEvent = events[Math.floor(Math.random() * events.length)];
    chosenEvent();
  }

  resetNodeTemporaryEffects() {
    // Remove temp boost effects from previous turn (only last one turn)
    for (const node of this.nodes.values()) {
      if (node.tempBoost) {
        node.effectValue -= node.tempBoost;
        delete node.tempBoost;
      }
    }
  }

  applyNodeTemporaryEffects() {
    // Check for tempBoost and apply them before player's turn
    for (const node of this.nodes.values()) {
      if (node.tempBoost) {
        node.effectValue += node.tempBoost;
      }
    }
  }

  async start() {
    this.setup();
    console.log('Welcome to Circuit Caper!');
    console.log('You are an AI engineer trapped inside a malfunctioning supercomputer.');
    console.log('Your goal: Reroute power through circuit nodes to restore the core system (Node C).');
    console.log('Manage your power units carefully. Activate nodes in sequence to maintain stable power flow.');
    console.log('Good luck! Press Enter to begin.');

    await new Promise(res => this.readlineInterface.question('', res));

    while (!this.gameOver) {
      this.resetNodeTemporaryEffects();
      this.applyNodeTemporaryEffects();

      this.displayStatus();

      await this.applySystemEvent();
      if (this.gameOver) break;

      let choice = await this.promptPlayer();

      if (!choice) {
        console.log('\nNo more nodes available to activate. You are stuck!');
        this.gameOver = true;
        break;
      }

      // If chosen node is glitched, disallow activation this turn
      const chosenNode = this.nodes.get(choice);
      if (chosenNode.glitched) {
        console.log(`\nNode ${choice} is currently experiencing glitches and cannot be activated this turn.`);
        // do not consume turn
        continue;
      }

      // Apply temporary boosts for power_up nodes (add effect value once)
      if (chosenNode.tempBoost) {
        chosenNode.effectValue += chosenNode.tempBoost;
      }

      this.activateNode(choice, true);

      // If temp boost was added to effectValue above, revert it after usage
      if (chosenNode.tempBoost) {
        chosenNode.effectValue -= chosenNode.tempBoost;
      }

      this.checkWinCondition();
      this.checkLossCondition();

      this.turn++;

      if (!this.gameOver) {
        console.log('\nPress Enter to proceed to next turn.');
        await new Promise(res => this.readlineInterface.question('', res));
      }
    }

    if (!this.win && this.gameOver) {
      console.log('\nGame Over. Better luck next time.');
      this.readlineInterface.close();
    }
  }
}

const game = new CircuitCaper();
game.start();
