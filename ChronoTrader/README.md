ChronoTrader - A Console-Based Time-Traveling Artifact Trading Game

Introduction:
In ChronoTrader, you assume the role of a time-traveling trader collecting and trading rare artifacts from different historical eras. Your goal is to accumulate the highest possible wealth in gold coins over 20 turns by buying artifacts low and selling them high as market prices fluctuate.

Setup Instructions:
1. Ensure you have Node.js installed on your system (https://nodejs.org/).
2. Save the provided JavaScript code into a file named 'chronotrader.js'.

How to Run the Game:
1. Open a terminal or command prompt.
2. Navigate to the directory containing the 'chronotrader.js' file.
3. Run the game with the command:
   node chronotrader.js

Gameplay Instructions:
- You start with 100 gold coins and an empty inventory that can hold up to 5 artifacts.
- Each turn (total of 20), the market prices of artifacts update, possibly influenced by random events.
- Commands you can enter each turn:
  * buy <artifact id>  - Purchase one unit of an artifact if you have enough gold and inventory space.
  * sell <artifact id> - Sell one unit of an artifact from your inventory at the current market price.
  * pass               - Skip the turn without trading.
- You'll see current gold, inventory contents, net worth, and market prices each turn.
- Random events can affect prices, your inventory, or gold.

Win Condition:
Have a net worth (gold + inventory value) of at least 1000 gold coins by the end of turn 20.

Loss Conditions:
- Run out of gold and inventory with no ability to trade.
- Inventory space full and insufficient gold to buy any artifact.

Good luck and enjoy your time-traveling trade adventure in ChronoTrader!