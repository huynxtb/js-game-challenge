# Bathyscaphe Siphon: Abyssal Brine Collector

A standalone, terminal-based resource management survival simulation set 9,500 meters beneath the ocean surface.

## Background
You command the *Nadir-IV*, an autonomous deep-trench extraction bathyscaphe anchored beside a super-saline underwater brine pool. Your mission is to siphon and purify **1,000 units of Hyper-Saline Isotope Brine (HSIB)** while managing crushing hyperbaric pressure, extreme thermal fluctuations, cavitation gas buildup, and finite battery reserves.

## Installation & Execution
No external packages or npm dependencies required. Standard Node.js standard libraries only.


node index.js


## Game Controls & Actions
- `[1] SIPHON BRINE`: Harvests HSIB from the trench floor (+Brine, +Temp, +Cavitation, -Battery).
- `[2] CRYOGENIC COOL`: Cools the superheated chamber (-Temp, -Battery).
- `[3] VENT CAVITATION`: Clears explosive gas pockets before detonation at 100% (Slight hull stress).
- `[4] PURGE BALLAST`: Discharges Nitrogen canisters to counter transient hyperbaric pressure.
- `[5] PULSE SONAR`: Scans for dense isotope veins for a +50% siphon boost next turn.
- `[6] THERMAL RECHARGE`: Routes benthic heat to charge the battery (+Battery, +Temp).
- `[7] HULL PATCH`: Applies sealant paste to restore structural integrity (+Hull, -Battery).
- `[8] SURFACE & ASCEND`: Triggers ascent once quota (1,000 HSIB) is met.
- `[Q] ABANDON`: Scuttle the bathyscaphe and exit.