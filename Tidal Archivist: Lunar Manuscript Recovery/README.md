# Tidal Archivist: Lunar Manuscript Recovery

An atmospheric, turn-based survival and exploration terminal game built in Node.js.

### Background
You are a specialized archivist operating a deep-sea submersible research station on an ocean moon orbiting a massive gas giant. Ancient civilizations left encrypted manuscripts scattered across the abyssal seafloor in pressure-sealed vaults. Your mission is to recover and decrypt 5 ancient manuscripts within 12 tidal cycles before the station must ascend.

### Requirements
- Node.js (v14.0.0 or higher)
- Standard built-in Node.js libraries (uses native `readline` module, no external npm packages required!)

### How to Run
1. Save the code as `tidal_archivist.js`
2. Open your terminal in the same directory.
3. Run: `node tidal_archivist.js`

### Mechanics & Tips
- Tidal cycles alternate between LOW TIDE (exploration permitted) and HIGH TIDE (crushing pressure, explore disabled).
- Explore during Low Tide to gather Sealed Vaults and Research Fragments.
- Balance Oxygen Reserves and Station Integrity carefully.
- Decrypting costs 10 Fragments per attempt with an 80% success rate.
- Score is calculated at the end based on manuscripts recovered, remaining integrity, and remaining oxygen.