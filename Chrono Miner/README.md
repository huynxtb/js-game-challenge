Chrono Miner - Console Turn-Based Resource Management Game

Introduction:
Chrono Miner places you in command of a futuristic mining colony tasked with extracting Chrono Crystals from unstable time fractures. Each turn represents a mining cycle where your choices impact resource yield and colony stability. Manage mining operations wisely to collect at least 100 Chrono Crystals before the colony's stability collapses.

Setup and Running:
- Ensure you have Node.js installed (https://nodejs.org/).
- Save the provided code into a file named "chrono_miner.js".
- Run the game from a terminal or command prompt with the command:
    node chrono_miner.js

Gameplay Instructions:
- Every turn, the game displays:
   * Total Chrono Crystals collected
   * Colony stability
   * Equipment level
   * Status of each time fracture (stability and available resources)

- You choose one action each turn:
   * Mine a fracture: "mine 1" or "mine 2" or "mine 3" to extract Chrono Crystals from that fracture.
   * Stabilize a fracture: "stabilize 1", "stabilize 2", or "stabilize 3" to improve stability and enable resource regeneration next turn.
   * Upgrade mining equipment using your Chrono Crystals by typing "upgrade". This improves mining yields and stabilization effectiveness.
   * Quit the game anytime by typing "quit".

- Mining yields resources but costs fracture and colony stability.
- Stabilizing a fracture restores its stability and helps resources regenerate but costs a small amount of Chrono Crystals.
- Losing colony stability to zero or less results in game over.
- Collecting 100 or more Chrono Crystals wins the game.

Enjoy managing time and resources as you strive to save your mining colony in Chrono Miner!