BALLAST CARTOGRAPHER - Deep-Sea Submersible Survey Mission

=== GAME OVERVIEW ===
You are the pilot of an experimental deep-sea submersible tasked with mapping uncharted oceanic trenches. Manage your resources carefully while exploring the ocean's deepest regions. Your mission: discover 15 unique trench sectors and return safely to the surface.

=== OBJECTIVE ===
Map 15 unique trench sectors and return to surface (0m depth) with hull integrity > 0% and oxygen > 0.

=== CORE MECHANICS ===

RESOURCES:
- Oxygen (O2): Depletes each turn based on depth. Reaches 0 = Game Over.
- Power Cells: Fuel for all equipment. Different actions cost different amounts. At 0, limited actions available.
- Hull Integrity: Your vessel's structural condition. Damaged by pressure, anomalies, and fauna. At 0% = Implosion.
- Ballast Tanks: Control buoyancy. Affects oxygen consumption and dive/ascend capability.

DEPTH SYSTEM:
- Ranges from 0m (surface) to 11000m (maximum trench depth)
- Deeper exploration has higher pressure and hull damage risks
- Some sectors only appear at specific depths
- Oxygen consumption increases at greater depths

ACTIONS:
1. DIVE DEEPER: Move deeper into the trench (-8 Power, -O2). Risk increasing pressure damage.
2. EXPLORE: Map the current depth area (-10 Power, -O2). 70% success rate, decreases with repeated exploration.
3. ASCEND: Move toward surface (-5 Power, -O2). Essential for returning home.
4. REPAIR HULL: Fix hull damage (-15 Power, -5 O2). Restores up to 25% hull integrity.
5. VENT RECHARGE: Use thermal vents to recharge power (Risk: 10-25% hull damage). High risk/reward.
6. EMERGENCY SURFACE: Immediately return to surface but FAIL mission.

RANDOM EVENTS (30% chance per turn):
- Thermal Vent: Gain power but risk hull damage
- Bioluminescent Swarm: Reduces visibility, next map attempt 50% success
- Pressure Anomaly: 5-15% hull damage
- Abandoned Equipment: Gain O2
- Aggressive Fauna: Choose to evade (power cost) or risk hull damage
- Sonar Echo: Guaranteed mappable sector nearby

=== HOW TO WIN ===
1. Map all 15 target sectors by choosing EXPLORE at various depths
2. Return to surface (depth 0m) by choosing ASCEND
3. Maintain positive hull integrity and oxygen throughout
4. Reach surface with both metrics > 0

=== HOW TO LOSE ===
- Oxygen reaches 0 (suffocation)
- Hull integrity reaches 0% (implosion)
- Using EMERGENCY SURFACE (partial loss - survives but mission fails)

=== STRATEGY TIPS ===
- Balance exploration and resource management
- Deeper sectors are rarer but riskier to discover
- Repair hull before it becomes critical
- Use thermal vents strategically to recharge power
- Avoid pressure anomalies at extreme depths
- Plan your ascent route to avoid running out of oxygen
- Monitor all resource bars carefully

=== SETUP INSTRUCTIONS ===
1. Ensure Node.js is installed on your system
2. Save the game code to a file named 'ballast_cartographer.js'
3. Open a terminal/command prompt in the file's directory

=== HOW TO RUN ===
Simply execute the following command:
node ballast_cartographer.js

Then follow the on-screen prompts to navigate the deep-sea exploration. Use number keys 1-6 to select actions.

=== GAME INTERFACE ===
Each turn displays:
- Current depth in meters
- Real-time resource bars (O2, Power, Hull integrity, Ballast status)
- Number of sectors mapped
- Recent event log (last 3 events)
- Available actions with their resource costs

At game end, view comprehensive statistics including max depth reached, sectors discovered, and remaining resources.

Good luck, pilot. The deep awaits!