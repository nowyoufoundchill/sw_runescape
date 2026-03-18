// World / Map system - RSC-style tile grid with dense ambient fill
const World = {
    TILES: {
        GRASS: 0, DIRT: 1, SAND: 2, WATER: 3, STONE: 4,
        PATH: 5, WOOD: 6, LAVA: 7, SWAMP: 8,
    },
    TILE_NAMES: ['grass', 'dirt', 'sand', 'water', 'stone', 'path', 'wood', 'lava', 'swamp'],

    MAP_W: 64,
    MAP_H: 64,
    TILE_SIZE: 32,

    tiles: null,
    objects: [],
    walkable: null,

    regions: {
        lumbridge: { x: 28, y: 28, w: 12, h: 12, name: 'Luminara' },
        forest:    { x: 10, y: 20, w: 18, h: 16, name: 'Darkwood Forest' },
        desert:    { x: 42, y: 10, w: 14, h: 14, name: 'Packet Desert' },
        swamp:     { x: 10, y: 42, w: 14, h: 14, name: 'Latency Swamp' },
        mountain:  { x: 42, y: 42, w: 14, h: 14, name: 'Firewall Mountains' },
        noc:       { x: 30, y: 14, w: 8, h: 8, name: 'NOC Headquarters' },
    },

    // Seeded PRNG for consistent world generation
    _seed: 54321,
    seed(s) { this._seed = s; },
    rand() {
        this._seed = (this._seed * 16807 + 0) % 2147483647;
        return this._seed / 2147483647;
    },

    init() {
        this.tiles = new Uint8Array(this.MAP_W * this.MAP_H);
        this.walkable = new Uint8Array(this.MAP_W * this.MAP_H);
        this.objects = [];
        this.generateMap();
        this.populateAmbient();
    },

    getTile(x, y) {
        if (x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return this.TILES.WATER;
        return this.tiles[y * this.MAP_W + x];
    },
    setTile(x, y, type) {
        if (x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return;
        this.tiles[y * this.MAP_W + x] = type;
    },
    isWalkable(x, y) {
        if (x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return false;
        return this.walkable[y * this.MAP_W + x] === 1;
    },
    setWalkable(x, y, val) {
        if (x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return;
        this.walkable[y * this.MAP_W + x] = val ? 1 : 0;
    },

    generateMap() {
        const T = this.TILES;

        // Water border
        for (let y = 0; y < this.MAP_H; y++) {
            for (let x = 0; x < this.MAP_W; x++) {
                if (x < 4 || x >= this.MAP_W - 4 || y < 4 || y >= this.MAP_H - 4) {
                    this.setTile(x, y, T.WATER);
                    this.setWalkable(x, y, false);
                } else {
                    this.setTile(x, y, T.GRASS);
                    this.setWalkable(x, y, true);
                }
            }
        }

        // === LUMINARA (starting town) ===
        this.fillRegion(26, 26, 16, 16, T.GRASS);
        // Dirt paths (not grey - earthy brown)
        this.fillRegion(33, 26, 2, 16, T.PATH);
        this.fillRegion(26, 33, 16, 2, T.PATH);
        // Town square
        this.fillRegion(31, 31, 6, 6, T.STONE);
        // Buildings
        this.addBuilding(27, 27, 'house', 'General Store');
        this.addBuilding(37, 27, 'house', 'Bank');
        this.addBuilding(27, 37, 'house', 'Smithy');
        this.addBuilding(37, 37, 'house', 'Inn');

        // === NOC HEADQUARTERS ===
        this.fillRegion(28, 12, 12, 10, T.STONE);
        this.fillRegion(30, 14, 8, 6, T.WOOD);
        this.addBuilding(30, 14, 'noc', 'NOC HQ');
        this.fillRegion(33, 22, 2, 4, T.PATH);
        this.fillRegion(33, 12, 2, 2, T.PATH);

        // === DARKWOOD FOREST ===
        this.seed(100);
        for (let y = 20; y < 36; y++) {
            for (let x = 6; x < 24; x++) {
                this.setTile(x, y, T.GRASS);
            }
        }
        // Trees in natural clusters of 2-4 (Phase 3 spec: never single isolated)
        const treeClusters = [
            { cx: 8,  cy: 22, r: 1 }, { cx: 11, cy: 22, r: 1 },
            { cx: 14, cy: 21, r: 2 }, { cx: 19, cy: 23, r: 1 },
            { cx: 22, cy: 22, r: 1 }, { cx: 8,  cy: 26, r: 1 },
            { cx: 11, cy: 27, r: 2 }, { cx: 16, cy: 26, r: 1 },
            { cx: 20, cy: 27, r: 2 }, { cx: 8,  cy: 31, r: 2 },
            { cx: 13, cy: 32, r: 1 }, { cx: 17, cy: 31, r: 1 },
            { cx: 21, cy: 33, r: 2 }, { cx: 9,  cy: 35, r: 1 },
        ];
        for (const c of treeClusters) {
            for (let dy = -c.r; dy <= c.r; dy++) {
                for (let dx = -c.r; dx <= c.r; dx++) {
                    if (this.rand() < 0.7) {
                        const tx2 = c.cx + dx, ty2 = c.cy + dy;
                        if (this.getTile(tx2, ty2) !== T.PATH) {
                            this.addObject(tx2, ty2, 'tree', false);
                        }
                    }
                }
            }
        }
        this.addObject(12, 25, 'deadTree', false);
        this.addObject(18, 30, 'deadTree', false);
        this.addObject(9, 33, 'deadTree', false);

        // === PACKET DESERT ===
        this.seed(200);
        for (let y = 8; y < 24; y++) {
            for (let x = 42; x < 56; x++) {
                this.setTile(x, y, T.SAND);
                if (this.rand() < 0.04) {
                    this.addObject(x, y, 'rock', false);
                }
            }
        }

        // === LATENCY SWAMP ===
        this.seed(300);
        for (let y = 42; y < 56; y++) {
            for (let x = 8; x < 24; x++) {
                this.setTile(x, y, T.SWAMP);
                if (this.rand() < 0.08) {
                    this.setTile(x, y, T.WATER);
                    this.setWalkable(x, y, false);
                } else if (this.rand() < 0.06) {
                    this.addObject(x, y, 'deadTree', false);
                }
            }
        }

        // === FIREWALL MOUNTAINS ===
        this.seed(400);
        for (let y = 42; y < 56; y++) {
            for (let x = 42; x < 56; x++) {
                this.setTile(x, y, T.STONE);
                if (this.rand() < 0.07) {
                    this.addObject(x, y, 'rock', false);
                }
            }
        }
        this.fillRegion(46, 46, 4, 4, T.LAVA);
        this.setWalkable(47, 47, false);
        this.setWalkable(48, 48, false);

        // Mining spots
        this.addObject(44, 44, 'copperRock', false);
        this.addObject(45, 43, 'tinRock', false);
        this.addObject(50, 48, 'copperRock', false);
        this.addObject(48, 50, 'tinRock', false);

        // Server racks near NOC
        this.addObject(29, 13, 'serverRack', false);
        this.addObject(37, 13, 'serverRack', false);
        this.addObject(29, 19, 'serverRack', false);
        this.addObject(37, 19, 'serverRack', false);

        // === BARRELS near building entrances (Phase 3 spec) ===
        // Near General Store entrance
        this.addAmbient(29, 30, 'barrel');
        this.addAmbient(30, 30, 'barrel');
        // Near Bank entrance
        this.addAmbient(39, 30, 'barrel');
        // Near Inn entrance
        this.addAmbient(39, 40, 'barrel');
        this.addAmbient(40, 40, 'barrel');
        // Near Smithy entrance
        this.addAmbient(29, 40, 'barrel');

        // === PATHS between areas ===
        this.fillRegion(24, 33, 4, 2, T.PATH);   // west to forest
        this.fillRegion(42, 33, 4, 2, T.PATH);   // east to desert
        this.fillRegion(15, 36, 2, 6, T.PATH);
        this.fillRegion(49, 24, 2, 8, T.PATH);
        this.fillRegion(33, 42, 2, 4, T.PATH);
        this.fillRegion(24, 48, 9, 2, T.PATH);
        this.fillRegion(35, 48, 7, 2, T.PATH);

        // === RIVER ===
        for (let x = 4; x < 60; x++) {
            const riverY = Math.floor(38 + Math.sin(x * 0.3) * 2);
            this.setTile(x, riverY, T.WATER);
            this.setTile(x, riverY + 1, T.WATER);
            this.setWalkable(x, riverY, false);
            this.setWalkable(x, riverY + 1, false);
        }
        // Bridge
        this.fillRegion(32, 36, 4, 6, T.WOOD);
        for (let dx = 0; dx < 4; dx++) {
            this.setWalkable(32 + dx, 38, true);
            this.setWalkable(32 + dx, 39, true);
        }
    },

    // === AMBIENT WORLD DENSITY ===
    // This fills empty grass areas with bushes, flowers, tall grass, and fences
    // to eliminate the "large empty green tiles" problem
    populateAmbient() {
        this.seed(9999);
        const T = this.TILES;

        for (let y = 5; y < this.MAP_H - 5; y++) {
            for (let x = 5; x < this.MAP_W - 5; x++) {
                const tile = this.getTile(x, y);
                if (!this.isWalkable(x, y)) continue;
                // Skip paths, stone, water
                if (tile !== T.GRASS && tile !== T.SWAMP && tile !== T.SAND) continue;
                // Don't clutter town square or building areas
                if (this.isInRegion(x, y, 'noc')) continue;
                if (x >= 30 && x <= 38 && y >= 30 && y <= 38) continue; // town center

                const r = this.rand();

                if (tile === T.GRASS) {
                    if (r < 0.03) {
                        this.addAmbient(x, y, 'bush');
                    } else if (r < 0.06) {
                        this.addAmbient(x, y, 'flowers');
                    } else if (r < 0.10) {
                        this.addAmbient(x, y, 'tallGrass');
                    }
                } else if (tile === T.SWAMP) {
                    if (r < 0.05) {
                        this.addAmbient(x, y, 'tallGrass');
                    }
                } else if (tile === T.SAND) {
                    if (r < 0.02) {
                        this.addAmbient(x, y, 'rock');
                    }
                }
            }
        }

        // Fence lines around town
        for (let x = 26; x <= 41; x++) {
            if (this.isWalkable(x, 26) && this.getTile(x, 26) !== T.PATH) {
                this.addAmbient(x, 26, 'fenceH');
            }
            if (this.isWalkable(x, 42) && this.getTile(x, 42) !== T.PATH) {
                this.addAmbient(x, 42, 'fenceH');
            }
        }
        for (let y = 26; y <= 42; y++) {
            if (this.isWalkable(26, y) && this.getTile(26, y) !== T.PATH) {
                this.addAmbient(26, y, 'fenceV');
            }
            if (this.isWalkable(42, y) && this.getTile(42, y) !== T.PATH) {
                this.addAmbient(42, y, 'fenceV');
            }
        }

        // Extra trees scattered in non-forest grass areas
        this.seed(7777);
        for (let i = 0; i < 40; i++) {
            const x = 5 + Math.floor(this.rand() * (this.MAP_W - 10));
            const y = 5 + Math.floor(this.rand() * (this.MAP_H - 10));
            const tile = this.getTile(x, y);
            if (tile === T.GRASS && this.isWalkable(x, y) &&
                !this.isInRegion(x, y, 'lumbridge') &&
                !this.isInRegion(x, y, 'noc')) {
                this.addObject(x, y, 'tree', false);
            }
        }
    },

    addAmbient(x, y, type) {
        // Ambient objects are walkable (decorative only)
        this.objects.push({ x, y, type, isBuilding: false, isAmbient: true });
    },

    fillRegion(x, y, w, h, type) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.setTile(x + dx, y + dy, type);
                if (type !== this.TILES.WATER && type !== this.TILES.LAVA) {
                    this.setWalkable(x + dx, y + dy, true);
                }
            }
        }
    },

    addBuilding(x, y, type, name) {
        const w = type === 'noc' ? 6 : 3;
        const h = type === 'noc' ? 4 : 3;
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.setWalkable(x + dx, y + dy, false);
            }
        }
        const doorX = x + Math.floor(w / 2);
        const doorY = y + h;
        this.setWalkable(doorX, doorY, true);
        this.objects.push({ x, y, type, name, isBuilding: true, w, h });
    },

    addObject(x, y, type, walkable) {
        this.objects.push({ x, y, type, isBuilding: false });
        if (!walkable) this.setWalkable(x, y, false);
    },

    isInRegion(x, y, regionKey) {
        const r = this.regions[regionKey];
        if (!r) return false;
        return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    },

    getRegionAt(x, y) {
        for (const [key, r] of Object.entries(this.regions)) {
            if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
                return r.name;
            }
        }
        return 'Wilderness';
    },

    // A* pathfinding
    findPath(sx, sy, ex, ey, maxSteps = 30) {
        if (!this.isWalkable(ex, ey)) return null;
        const key = (x, y) => x + ',' + y;
        const open = [{ x: sx, y: sy, g: 0, h: 0, f: 0, parent: null }];
        const closed = new Set();

        while (open.length > 0 && open.length < 500) {
            open.sort((a, b) => a.f - b.f);
            const cur = open.shift();
            if (cur.x === ex && cur.y === ey) {
                const path = [];
                let n = cur;
                while (n.parent) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
                return path.slice(0, maxSteps);
            }
            closed.add(key(cur.x, cur.y));
            const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
            for (const d of dirs) {
                const nx = cur.x + d.dx;
                const ny = cur.y + d.dy;
                if (closed.has(key(nx, ny)) || !this.isWalkable(nx, ny)) continue;
                const g = cur.g + 1;
                const h = Math.abs(nx - ex) + Math.abs(ny - ey);
                const existing = open.find(n => n.x === nx && n.y === ny);
                if (!existing) {
                    open.push({ x: nx, y: ny, g, h, f: g + h, parent: cur });
                } else if (g < existing.g) {
                    existing.g = g;
                    existing.f = g + existing.h;
                    existing.parent = cur;
                }
            }
        }
        return null;
    },
};
