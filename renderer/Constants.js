// renderer/Constants.js
// Three.js migration constants — spec: TILE_SIZE=2, FOV 60°, MeshBasicMaterial only
const RSC = {
    // World coordinate scale: 1 tile = 4 Three.js world units (RSC spec)
    TILE_SIZE: 4,

    // Camera parameters (PerspectiveCamera)
    // Pitch = arctan((20-2)/22) = 39.3° — within RSC spec 35-40° range
    CAM_FOV:       60,
    CAM_NEAR:      0.1,
    CAM_FAR:       500,
    CAM_OFFSET_X:  0,
    CAM_OFFSET_Y:  20,
    CAM_OFFSET_Z:  22,
    CAM_LOOKAT_Y:  2.0,

    // Character lerp speed (per frame, 0..1)
    LERP_SPEED: 0.18,

    // Walk animation interval (ms per frame)
    WALK_INTERVAL: 200,

    // Water animation interval (ms per frame)
    WATER_INTERVAL: 800,

    // Tile colors (hex integers for THREE.Color)
    COL_GRASS:   0x3a6230,
    COL_GRASS2:  0x4a7c3f,
    COL_DIRT:    0x6b4f0e,
    COL_SAND:    0xb89a4a,
    COL_WATER:   0x1a2f7a,
    COL_WATER2:  0x1e3694,
    COL_STONE:   0x6b6b6b,
    COL_PATH:    0x8b6914,
    COL_WOOD:    0x5c3d1e,
    COL_LAVA:    0xaa3300,
    COL_SWAMP:   0x2a4a1a,

    // Object/character colors
    COL_TREE_TRUNK:    0x5c3d1e,
    COL_TREE_TRUNK_D:  0x3a2510,
    COL_TREE_CANOPY1:  0x2d5a1b,
    COL_TREE_CANOPY2:  0x3a7022,
    COL_TREE_CANOPY_D: 0x1e3d0f,
    COL_ROCK:          0x6b6b6b,
    COL_ROCK_LIGHT:    0x7d7d7d,
    COL_BARREL_BODY:   0x5c3d1e,
    COL_BARREL_BAND:   0x8b6914,
    COL_SERVER_CASE:   0x2a2a2a,
    COL_SERVER_LED:    0x00cc00,
    COL_FENCE:         0x5c3d1e,
    COL_BUSH:          0x2d5a1b,
    COL_COPPER:        0x8a5a2a,
    COL_TIN:           0x808080,

    // Building colors (NW roof=1.0, south wall=0.75, east wall=0.55 brightness)
    COL_BLDG_ROOF:  0x8b4513,
    COL_BLDG_SOUTH: 0x6e3a10,
    COL_BLDG_EAST:  0x4a2808,
    COL_NOC_ROOF:   0x2a2a2a,
    COL_NOC_SOUTH:  0x222222,
    COL_NOC_EAST:   0x1a1a1a,
    COL_NOC_STRIPE: 0xff6600,
    COL_WINDOW:     0x4488cc,
    COL_DOOR:       0x3d2010,

    // Character skin and clothes
    COL_SKIN:        0xd4956a,
    COL_HAIR_DEFAULT:0x4a2a0a,
    COL_BOOTS:       0x3a2a1a,
};
