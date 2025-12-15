const readline = require('readline');

// Galactic Relay - A turn-based console strategy game in Node.js

class GalacticRelay {
    constructor() {
        this.planets = ['Zarvex', 'Morlon', 'Xerath', 'Venra', 'Klyth', 'Norees', 'Jantor'];
        this.currentPlanetIndex = -1; // start before first planet
        this.fuel = 100;
        this.shipIntegrity = 100;
        this.repairKits = 3;
        this.deliveriesCompleted = 0;
        this.totalDeliveries = this.planets.length;
        this.gameOver = false;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    start() {
        this.printIntro();
        this.nextTurn();
    }

    printIntro() {
        console.log(`\n=== Galactic Relay ===\n`);
        console.log(`Welcome Commander! You are tasked with delivering critical supplies to a chain of planets:`);
        console.log(this.planets.map((p,i) => `${i+1}. ${p}`).join('\n'));
        console.log(`\nManage your ship carefully. Beware of space hazards and pirates!\n`);
        console.log(`Commands each turn:`);
        console.log(`  1. Move to next planet`);
        console.log(`  2. Repair ship (uses 1 repair kit)`);
        console.log(`  3. Refuel ship (takes a turn, risky in hostile space)`);
        console.log(`\nResources:`);
        console.log(`  Fuel: ${this.fuel}`);
        console.log(`  Ship Integrity: ${this.shipIntegrity}`);
        console.log(`  Repair Kits: ${this.repairKits}`);
        console.log(`\nGood luck!\n`);
    }

    nextTurn() {
        if (this.gameOver) {
            this.rl.close();
            return;
        }

        // Check win/loss conditions
        if (this.fuel <= 0) {
            this.gameOver = true;
            console.log(`\nYou have run out of fuel. Your ship is stranded in hostile space. Mission failed.`);
            this.endGame(false);
            return;
        }
        if (this.shipIntegrity <= 0) {
            this.gameOver = true;
            console.log(`\nYour ship has been destroyed. Mission failed.`);
            this.endGame(false);
            return;
        }
        if (this.deliveriesCompleted === this.totalDeliveries) {
            this.gameOver = true;
            console.log(`\nAll deliveries completed successfully! Congratulations, Commander!`);
            this.endGame(true);
            return;
        }

        this.printStatus();
        this.promptCommand();
    }

    printStatus() {
        let nextPlanet = this.planets[this.currentPlanetIndex + 1] || '(no more planets)';
        console.log(`\nCurrent Location: ${this.currentPlanetIndex >=0 ? this.planets[this.currentPlanetIndex] : 'Start Point'}`);
        console.log(`Next Destination: ${nextPlanet}`);
        console.log(`Fuel: ${this.fuel}`);
        console.log(`Ship Integrity: ${this.shipIntegrity}`);
        console.log(`Repair Kits: ${this.repairKits}`);
        console.log(`Deliveries Completed: ${this.deliveriesCompleted} / ${this.totalDeliveries}`);
    }

    promptCommand() {
        console.log(`\nChoose your action:`);
        console.log(`1. Move to next planet`);
        console.log(`2. Repair ship (use 1 repair kit)`);
        console.log(`3. Refuel ship`);
        this.rl.question(`> `, (answer) => {
            const choice = parseInt(answer.trim(), 10);
            if (![1,2,3].includes(choice)) {
                console.log(`Invalid choice. Please select 1, 2, or 3.`);
                this.promptCommand();
                return;
            }
            switch(choice) {
                case 1:
                    this.moveShip();
                    break;
                case 2:
                    this.repairShip();
                    break;
                case 3:
                    this.refuelShip();
                    break;
            }
        });
    }

    moveShip() {
        if (this.currentPlanetIndex + 1 >= this.planets.length) {
            console.log(`All deliveries complete. No more planets ahead.`);
            this.nextTurn();
            return;
        }

        // Consume fuel for travel
        const fuelCost = 15;
        this.fuel -= fuelCost;
        console.log(`\nTraveling to ${this.planets[this.currentPlanetIndex + 1]}... (-${fuelCost} fuel)`);

        // Random events during travel
        this.handleRandomEvent(() => {
            this.currentPlanetIndex++;
            this.deliveriesCompleted++;
            console.log(`You have arrived at ${this.planets[this.currentPlanetIndex]} and delivered the supplies.`);
            this.nextTurn();
        });
    }

    repairShip() {
        if (this.repairKits <= 0) {
            console.log(`\nNo repair kits left! Cannot repair ship.`);
            this.nextTurn();
            return;
        }
        this.repairKits--;
        const repairAmount = 30;
        this.shipIntegrity = Math.min(100, this.shipIntegrity + repairAmount);
        console.log(`\nUsed 1 repair kit. Ship integrity improved by ${repairAmount}.`);
        this.nextTurn();
    }

    refuelShip() {
        // Refueling does not consume a turn but is risky
        // Simulate risk: 40% chance of successful refuel (gain 25 fuel), 60% chance of pirate attack losing integrity
        console.log(`\nAttempting to refuel...`);
        const chance = Math.random();
        if (chance < 0.4) {
            const fuelAdded = 25;
            this.fuel = Math.min(100, this.fuel + fuelAdded);
            console.log(`Refueling successful! Gained ${fuelAdded} fuel.`);
        } else {
            // Pirate attack during refuel
            const damage = 20;
            this.shipIntegrity -= damage;
            console.log(`Pirate attack during refuel! Ship took ${damage} damage.`);
        }
        // Refueling counts as turn
        this.nextTurn();
    }

    handleRandomEvent(callback) {
        // Random chance to encounter event: 60%
        const eventChance = Math.random();
        if (eventChance > 0.6) {
            callback();
            return; // no event
        }

        const events = [
            this.asteroidFieldEvent.bind(this),
            this.spacePirateEvent.bind(this),
            this.systemMalfunctionEvent.bind(this),
        ];
        // Randomly select an event
        const eventFunc = events[Math.floor(Math.random() * events.length)];
        eventFunc(callback);
    }

    asteroidFieldEvent(callback) {
        console.log(`\n--- ALERT: Asteroid Field Encountered! ---`);
        console.log(`You must navigate carefully. Choose your approach:`);
        console.log(`1. Navigate cautiously (low damage, higher fuel cost)`);
        console.log(`2. Go full speed (riskier, possible damage)`);

        this.rl.question(`> `, (answer) => {
            const choice = parseInt(answer.trim(), 10);
            if (![1, 2].includes(choice)) {
                console.log(`Invalid choice.`);
                this.asteroidFieldEvent(callback);
                return;
            }
            if (choice === 1) {
                // cautious: -10 fuel, 5-10 damage
                const fuelLoss = 10;
                const damage = 5 + Math.floor(Math.random() * 6);
                this.fuel -= fuelLoss;
                this.shipIntegrity -= damage;
                console.log(`You navigated cautiously: -${fuelLoss} fuel, ship took ${damage} damage.`);
            } else {
                // full speed: -20 fuel, 0-30 damage (random)
                const fuelLoss = 20;
                const damage = Math.floor(Math.random() * 31);
                this.fuel -= fuelLoss;
                this.shipIntegrity -= damage;
                console.log(`You sped through the field: -${fuelLoss} fuel, ship took ${damage} damage.`);
            }
            callback();
        });
    }

    spacePirateEvent(callback) {
        console.log(`\n--- ALERT: Space Pirates Attacking! ---`);
        console.log(`Choose your response:`);
        console.log(`1. Attempt to flee (may lose fuel, possibly no damage)`);
        console.log(`2. Fight (may lose ship integrity, chance to get repair kit)`);
        console.log(`3. Surrender cargo (lose delivery progress but preserve ship)`);

        this.rl.question(`> `, (answer) => {
            const choice = parseInt(answer.trim(), 10);
            if (![1, 2, 3].includes(choice)) {
                console.log(`Invalid choice.`);
                this.spacePirateEvent(callback);
                return;
            }

            if (choice === 1) {
                // flee: 50% success: lose 10 fuel, no damage; 50% fail: lose 20 fuel and 20 ship integrity
                if (Math.random() < 0.5) {
                    this.fuel -= 10;
                    console.log(`You fled successfully! Lost 10 fuel, no damage.`);
                } else {
                    this.fuel -= 20;
                    this.shipIntegrity -= 20;
                    console.log(`Flee attempt failed! Lost 20 fuel and 20 damage to ship.`);
                }
                callback();
            } else if (choice === 2) {
                // fight: 60% chance: no damage and gain 1 repair kit (max 5); 40% chance: 30 damage
                if (Math.random() < 0.6) {
                    if (this.repairKits < 5) {
                        this.repairKits++;
                        console.log(`Victory! No damage taken and gained 1 repair kit.`);
                    } else {
                        console.log(`Victory! No damage taken but repair kits are full.`);
                    }
                } else {
                    this.shipIntegrity -= 30;
                    console.log(`Fight lost! Ship took 30 damage.`);
                }
                callback();
            } else {
                // surrender cargo: skip one delivery
                if (this.deliveriesCompleted > 0) {
                    this.deliveriesCompleted--;
                    console.log(`You surrendered cargo and lost one delivery progress. Ship preserved.`);
                } else {
                    console.log(`No delivery progress to lose. Ship preserved.`);
                }
                callback();
            }
        });
    }

    systemMalfunctionEvent(callback) {
        console.log(`\n--- ALERT: System Malfunction Detected! ---`);
        console.log(`Choose your action:`);
        console.log(`1. Attempt in-flight repairs (use 1 repair kit, 70% success)`);
        console.log(`2. Ignore (ship takes 15 damage)`);

        this.rl.question(`> `, (answer) => {
            const choice = parseInt(answer.trim(), 10);
            if (![1, 2].includes(choice)) {
                console.log(`Invalid choice.`);
                this.systemMalfunctionEvent(callback);
                return;
            }

            if (choice === 1) {
                if (this.repairKits <= 0) {
                    console.log(`No repair kits left! Cannot attempt repairs.`);
                    this.shipIntegrity -= 15;
                    console.log(`Ship took 15 damage due to malfunction.`);
                } else {
                    this.repairKits--;
                    if (Math.random() < 0.7) {
                        console.log(`Repairs successful! Malfunction fixed.`);
                    } else {
                        this.shipIntegrity -= 10;
                        console.log(`Repairs failed! Ship took 10 damage from malfunction.`);
                    }
                }
            } else {
                this.shipIntegrity -= 15;
                console.log(`You ignored the malfunction. Ship took 15 damage.`);
            }
            callback();
        });
    }

    endGame(won) {
        if (won) {
            console.log(`\n===== VICTORY =====`);
            console.log(`You have triumphed over the dangers of deep space and delivered all supplies.`);
        } else {
            console.log(`\n===== DEFEAT =====`);
            console.log(`Your mission has failed, but the galaxy still awaits a hero like you.`);
        }
        console.log(`\nThanks for playing Galactic Relay!`);
        this.rl.close();
        process.exit(0);
    }
}

// Run the game
const game = new GalacticRelay();
game.start();
