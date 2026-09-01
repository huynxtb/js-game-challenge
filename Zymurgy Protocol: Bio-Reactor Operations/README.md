## Zymurgy Protocol: Bio-Reactor Operations

**Introduction:**
Welcome to Zymurgy Protocol: Bio-Reactor Operations! Your mission is to manage a grid of four bio-reactor vats to synthesize 500 units of Enzyme-X within 20 turns. Careful management of temperature and pH is crucial to prevent containment ruptures and ensure optimal microbe growth for harvesting.

**Game Mechanics:**

*   **Turn-Based:** The game progresses in turns. You have 2 actions per turn.
*   **Vats:** There are 4 vats, each with adjustable Temperature (20-100°C), pH (1.0-14.0), and Microbe Population (0-100).
*   **Actions:**
    *   `HEAT <vat_id>`: Increase temperature by 10°C.
    *   `COOL <vat_id>`: Decrease temperature by 10°C.
    *   `ACID <vat_id>`: Decrease pH by 1.0.
    *   `BASE <vat_id>`: Increase pH by 1.0.
    *   `HARVEST <vat_id>`: Collect Enzyme-X based on current microbe population and reset population.
    *   `PASS`: Skip remaining actions for the turn.
*   **Environment Drift:** At the end of each turn, random fluctuations occur: Temperature shifts by ±5°C, and pH shifts by ±0.5.
*   **Microbe Growth:** Microbes reproduce if the vat's temperature is between 35-45°C and pH is between 6.0-8.0.

**Win Condition:**
*   Accumulate 500 or more units of Enzyme-X by the end of Turn 20.

**Loss Conditions:**
*   Any vat's temperature exceeds 90°C.
*   Any vat's pH drops below 2.0 or rises above 12.0 (Containment Rupture).
*   Turn 20 ends, and you have less than 500 units of Enzyme-X.

**Setup and Running the Game:**

1.  **Save the Code:** Copy the provided JavaScript code and save it into a single file named `zymurgy_protocol.js`.
2.  **Run from Terminal:** Open your terminal or command prompt, navigate to the directory where you saved the file, and run the game using Node.js:
    
    node zymurgy_protocol.js
    
3.  **Play:** Follow the on-screen prompts to enter your commands for each turn.