# SolarWinds Quest - A RuneScape Classic Tribute

A browser-based RPG inspired by RuneScape Classic, built for the SolarWinds trade show demo. Players explore a network-themed fantasy world, complete quests, fight malware goblins, and restore the shattered Observability Gem.

## Quick Start

Open `index.html` in any modern browser. No build step or server required.

## Game Features

- **Click-to-move** and WASD/arrow key movement with A* pathfinding
- **5 regions**: Luminara (town), Darkwood Forest, Packet Desert, Latency Swamp, Firewall Mountains
- **15+ NPCs** with full dialogue trees
- **Main quest**: "The Shattered Gem" - recover 4 fragments across the world
- **8 skills**: Networking, Observability, Security, Monitoring, Debugging, Automation, Database, Cloudcraft
- **Combat**: Fight Malware Goblins for Security XP
- **Inventory system** with 28 slots and SolarWinds-themed items
- **Leaderboard** with quest points and total XP
- **Minimap** showing the full world
- **RSC-style visuals**: Dithered tile textures, blocky character sprites, pixelated aesthetic

## SolarWinds Theming

- NOC Headquarters with Commander Chen and Analyst Ada
- Items: Network Monitor, Server Crystal, Orion Amulet, Packet Rune, Firewall Shield, Observability Gem
- Skills map to IT concepts: networking, observability, security, monitoring
- Quest narrative about restoring full-stack visibility after a DDoS attack
- Server rack "trees", network-themed NPCs, IT humor throughout

## Optional: Real RSC Assets

The game ships with procedural textures. For authentic RuneScape Classic sprites:

```bash
./scripts/download-assets.sh
```

This pulls from [Open-RSC](https://github.com/Open-RSC) repositories (AGPL-3.0).

## Project Structure

```
index.html          - Entry point
css/game.css        - RSC-style dark UI
js/engine.js        - Game loop, rendering, input
js/world.js         - Tile map, pathfinding, regions
js/player.js        - Player state, skills, inventory
js/npc.js           - NPC AI, dialogue trees
js/quest.js         - Quest system
js/ui.js            - Panels, chat, minimap, leaderboard
js/assets.js        - Procedural sprite/texture generation
scripts/            - Asset download tools
```
