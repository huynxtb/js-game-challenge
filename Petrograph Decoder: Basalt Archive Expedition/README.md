# Petrograph Decoder: Basalt Archive Expedition

## Overview
You are an archaeo-linguist deployed to a remote volcanic plateau where ancient civilizations carved encrypted messages (petrographs) into basalt columns. Your mission is to decode all 5 petrograph tablets before your supplies run out, a sandstorm buries the site, or your mental fatigue causes you to misinterpret a glyph catastrophically.

## Requirements
- Node.js (version 14 or higher recommended)
- No external npm packages or dependencies needed.

## How to Run

node petrograph_decoder.js


## Game Rules & Controls
- **Turn-based Resource Management**: Manage Supplies, Energy, Sanity, and Decryption Tokens across turns (days).
- **Sandstorm Countdown**: Arrives in 25 days. Every undecoded tablet will be permanently buried when it hits.
- **Mastermind Deduction**: Guess the glyph sequences (Tablets 1-2: 3 glyphs; Tablets 3-4: 4 glyphs; Tablet 5: 5 glyphs) using feedback: `[E]` Exact match, `[P]` Partial match, `[X]` No match.
- **Actions**: Scout new tablets, Study Glyphs to gain Tokens and Hint Shards, Attempt Decodes, Forage for food, Rest for sanity, or Consult Field Notes for guaranteed reveals.
- **Keyboard Control**: Follow the interactive prompts and enter number/letter selections in your terminal.
