Mycelium Nexus is a turn-based console game where you manage a burgeoning fungal network. Your goal is to connect the central Mycelium Hub to five distinct Forest Zones: North, South, East, West, and Canopy. To achieve this, you must strategically manage three vital resources: Carbon (for expansion), Water (to combat toxic mold), and Nitrogen (for resource synthesis). Each turn, resources decay, and toxic mold spreads through your connected network, hindering your efforts. Connect all five zones to win, but beware: running out of Carbon or Water, or allowing mold to completely overrun your network, will lead to defeat.

To set up and run the game:
1. Save the provided JavaScript code into a file named 'mycelium_nexus.js'.
2. Open your terminal or command prompt.
3. Navigate to the directory where you saved the file.
4. Run the game using Node.js:
   node mycelium_nexus.js

How to Play:
The game proceeds in turns. Each turn, you'll receive a status report on your resources, zone connection progress, and mold levels. You then choose one action:

1. Expand [Zone Name]: Spend Carbon to increase the connection progress to a specific zone (e.g., 'expand North'). Each expansion step costs Carbon and brings you closer to fully connecting a zone.
2. Forage: Spend a turn gathering random amounts of Carbon, Water, and Nitrogen. Be aware that mold infestation reduces the effectiveness of foraging.
3. Clear Mold [Zone Name]: Spend Water to reduce the mold level in a specific zone (e.g., 'clear mold East'). The cost of clearing mold scales with the amount of mold present.
4. Synthesize [Type]: Spend Nitrogen to convert one resource type into another.
   - 'synthesize water_to_carbon': Converts Water into Carbon.
   - 'synthesize carbon_to_water': Converts Carbon into Water.
5. Quit: End the game.

Win Condition: Successfully connect all five Forest Zones to 100% progress.
Loss Conditions:
- Your Carbon or Water resources reach 0.
- The total mold coverage across your entire network reaches 100% of its maximum capacity.

Good luck, Mycelium Master!