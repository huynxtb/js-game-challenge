Astro Salvage Commander - Text-based Node.js Console Game

Introduction:
In this game, you are the commander of a spaceship tasked with salvaging valuable artifacts from derelict spacecraft drifting in an uncharted asteroid field. Your goal is to maximize your haul of artifacts while managing limited fuel, oxygen, and cargo space. Be cautious of environmental hazards that can damage your ship or consume your resources.

Game Objective:
Collect artifacts that have various values and weights by exploring asteroid sectors and salvaging derelict ships. Manage your fuel, oxygen, and cargo capacity carefully, avoid dangers, and decide when to return to base to safely offload your haul. You win by returning to base with artifact haul valued at or above a specified threshold before running out of vital resources.

Setup:
- Make sure you have Node.js installed on your computer (https://nodejs.org/).

How to Run the Game:
1. Save the provided JavaScript code into a file named "astro_salvage_commander.js".
2. Open a terminal or command prompt.
3. Navigate to the directory containing the saved file.
4. Run the game with the command:

   node astro_salvage_commander.js

Gameplay:
- Each turn you will see the status of your ship and resources.
- Choose one of the following actions each turn:
    1. Move to a new sector (consumes fuel and oxygen)
    2. Salvage artifact in current sector (consumes oxygen)
    3. Repair ship (consumes fuel and oxygen)
    4. Return to base (end mission and tally loot)
- Random events might occur each turn, such as asteroid strikes or equipment malfunctions.
- When returning to base, you must continue choosing the return option until you arrive at sector 0 (the base).
- The game ends when you either successfully return with enough artifact value or when you run out of vital resources or your ship is destroyed.

Enjoy your mission commanding the Astro Salvage Commander and good luck collecting valuable artifacts!