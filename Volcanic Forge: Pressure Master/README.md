# Volcanic Forge: Pressure Master

A console-based resource management and survival game built with Node.js.

## Concept
You are the master engineer of a geothermal power station built directly inside an active volcano. Balance geothermal energy extraction against rising magma pressure, station structural integrity, and dwindling coolant reserves.

## Objective
Survive 20 operational days (turns) while generating at least 500 energy units without triggering an eruption or suffering total station collapse.

## Requirements
- Node.js (v14.0.0 or higher recommended)
- Uses native Node.js `readline` module (zero external npm dependencies required).

## How to Run
1. Save the code as `volcanic_forge.js`.
2. Open your terminal in the directory containing `volcanic_forge.js`.
3. Run: `node volcanic_forge.js`

## How to Play
Each day, review your station telemetry and choose one of five actions:
1. EXTRACT_LOW: Safe energy generation.
2. EXTRACT_HIGH: Aggressive generation at the expense of station integrity and increased heat.
3. VENT_PRESSURE: Cool down the chamber using coolant.
4. REPAIR_STATION: Reinforce station plating using coolant.
5. ACQUIRE_COOLANT: Gather external coolant at the cost of minor pressure buildup.

Watch out for spontaneous seismic events and natural magma pressure rises each turn!