# RENDERER_FILES.md — Three.js Migration Phase 0 Audit

Files that constitute the 3D renderer. These may be freely changed.

| File | Role |
|------|------|
| `renderer/Constants.js` | All RSC/Three.js constants (TILE_SIZE, colors, camera params) |
| `renderer/ThreeRenderer.js` | THREE.Scene + PerspectiveCamera + WebGLRenderer + CSS2DRenderer init |
| `renderer/TerrainBuilder.js` | Merged BufferGeometry terrain from World tile data; water animation |
| `renderer/CharacterBuilder.js` | BoxGeometry character assembly (player + NPCs); walk animation |
| `renderer/ObjectBuilder.js` | 3D world objects: trees, rocks, barrels, fences, buildings, etc. |
| `renderer/Camera.js` | Smooth-follow camera that tracks player lerp position |
| `js/engine.js` | Three.js game loop; raycasting input; lerp state; connects logic ↔ renderer |
| `index.html` | CDN script tags; `#three-viewport` div; script load order |
| `css/game.css` | `#three-viewport` sizing and overflow rules |
