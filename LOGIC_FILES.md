# LOGIC_FILES.md — Three.js Migration Phase 0 Audit

Files that contain game logic. These are NOT changed by the renderer migration.

| File | Role |
|------|------|
| `js/world.js` | Tile grid, A* pathfinding, world generation, object list |
| `js/player.js` | Player state, skills, inventory, XP, movement (tile coords) |
| `js/npc.js` | NPC list, wander AI, dialogue trees, combat encounters |
| `js/quest.js` | Quest state machine |
| `js/ui.js` | HTML UI panels: skills, inventory, quests, minimap, leaderboard, chat |
| `js/assets.js` | Item icon sprites (used by ui.js); character sprite stubs for npc.js compat |

All files above remain byte-for-byte identical to the RSC Visual Fidelity v3 commit.
