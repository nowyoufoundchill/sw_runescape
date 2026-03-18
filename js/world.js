// World / Map system - RSC-style tile grid
const World = {
    // Tile types
    TILES: {
        GRASS: 0,
        DIRT: 1,
        SAND: 2,
        WATER: 3,
        STONE: 4,
        PATH: 5,
        WOOD: 6,
        LAVA: 7,
        SWAMP: 8,
    },

    TILE_NAMES: ['grass', 'dirt', 'sand', 'water', 'stone', 'path', 'wood', 'lava', 'swamp'],

    // Map dimensions
    MAP_W: 64,
    MAP_H: 64,

    // Tile size for rendering
    TILE_SIZE: 32,

    // Map data
    tiles: null,
    objects: [],
    walkable: null,

    // Regions of the map
    regions: {
        lumbridge: { x: 28, y: 28, w: 12, h: 12, name: 'Luminara' },
        forest: { x: 10, y: 20, w: 18, h: 16, name: 'Darkwood Forest' },
        desert: { x: 42, y: 10, w: 14, h: 14, name: 'Packet Desert' },
        swamp: { x: 10, y: 42, w: 14, h: 14, name: 'Latency Swamp' },
        mountain: { x: 42, y: 42, w: 14, h: 14, name: 'Firewall Mountains' },
        noc: { x: 30, y: 14, w: 8, h: 8, name: 'NOC Headquarters' },
    },

    init() {
        this.tiles = new Uint8Array(this.MAP_W * this.MAP_H);
        this.walkable = new Uint8Array(this.MAP_W * this.MAP_H);
        this.generateMap();
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

        // Fill with water border
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

        // Luminara (starting town) - center of map
        this.fillRegion(26, 26, 16, 16, T.GRASS);
        // Town paths
        this.fillRegion(33, 26, 2, 16, T.PATH);
        this.fillRegion(26, 33, 16, 2, T.PATH);
        // Town square (stone)
        this.fillRegion(31, 31, 6, 6, T.STONE);
        // Buildings (set tiles + add objects)
        this.addBuilding(27, 27, 'house', 'General Store');
        this.addBuilding(37, 27, 'house', 'Bank');
        this.addBuilding(27, 37, 'house', 'Smithy');
        this.addBuilding(37, 37, 'house', 'Inn');

        // NOC Headquarters - north
        this.fillRegion(28, 12, 12, 10, T.STONE);
        this.fillRegion(30, 14, 8, 6, T.WOOD);
        this.addBuilding(30, 14, 'noc', 'NOC HQ');
        // Path from town to NOC
        this.fillRegion(33, 22, 2, 4, T.PATH);
        this.fillRegion(33, 12, 2, 2, T.PATH);

        // Darkwood Forest - west
        for (let y = 20; y < 36; y++) {
            for (let x = 6; x < 24; x++) {
                this.setTile(x, y, T.GRASS);
                // Scatter trees
                if (Math.random() < 0.15 && x > 7 && y > 21) {
                    this.addObject(x, y, 'tree', false);
                }
            }
        }
        // Some dead trees
        this.addObject(12, 25, 'deadTree', false);
        this.addObject(18, 30, 'deadTree', false);

        // Packet Desert - east
        for (let y = 8; y < 24; y++) {
            for (let x = 42; x < 56; x++) {
                this.setTile(x, y, T.SAND);
                if (Math.random() < 0.05) {
                    this.addObject(x, y, 'rock', false);
                }
            }
        }

        // Latency Swamp - southwest
        for (let y = 42; y < 56; y++) {
            for (let x = 8; x < 24; x++) {
                this.setTile(x, y, T.SWAMP);
                if (Math.random() < 0.08) {
                    this.setTile(x, y, T.WATER);
                    this.setWalkable(x, y, false);
                }
                if (Math.random() < 0.05) {
                    this.addObject(x, y, 'deadTree', false);
                }
            }
        }

        // Firewall Mountains - southeast
        for (let y = 42; y < 56; y++) {
            for (let x = 42; x < 56; x++) {
                this.setTile(x, y, T.STONE);
                if (Math.random() < 0.08) {
                    this.addObject(x, y, 'rock', false);
                }
            }
        }
        // Lava patches in mountains
        this.fillRegion(46, 46, 4, 4, T.LAVA);
        this.setWalkable(47, 47, false);
        this.setWalkable(48, 48, false);

        // Mining spots
        this.addObject(44, 44, 'copperRock', false);
        this.addObject(45, 43, 'tinRock', false);
        this.addObject(50, 48, 'copperRock', false);

        // Server racks near NOC
        this.addObject(29, 13, 'serverRack', false);
        this.addObject(37, 13, 'serverRack', false);
        this.addObject(29, 19, 'serverRack', false);
        this.addObject(37, 19, 'serverRack', false);

        // Paths between areas
        // West path to forest
        this.fillRegion(24, 33, 4, 2, T.PATH);
        // East path to desert
        this.fillRegion(42, 33, 4, 2, T.PATH);
        // South paths
        this.fillRegion(15, 36, 2, 6, T.PATH);
        this.fillRegion(49, 24, 2, 8, T.PATH);
        this.fillRegion(33, 42, 2, 4, T.PATH);
        this.fillRegion(24, 48, 9, 2, T.PATH);
        this.fillRegion(35, 48, 7, 2, T.PATH);

        // River running through map
        for (let x = 4; x < 60; x++) {
            const riverY = Math.floor(38 + Math.sin(x * 0.3) * 2);
            this.setTile(x, riverY, T.WATER);
            this.setTile(x, riverY + 1, T.WATER);
            this.setWalkable(x, riverY, false);
            this.setWalkable(x, riverY + 1, false);
        }
        // Bridge over river on main path
        this.fillRegion(32, 36, 4, 6, T.WOOD);
        this.setWalkable(32, 38, true);
        this.setWalkable(33, 38, true);
        this.setWalkable(34, 38, true);
        this.setWalkable(35, 38, true);
        this.setWalkable(32, 39, true);
        this.setWalkable(33, 39, true);
        this.setWalkable(34, 39, true);
        this.setWalkable(35, 39, true);
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
        // Mark building footprint as unwalkable (except door area)
        const w = type === 'noc' ? 6 : 3;
        const h = type === 'noc' ? 4 : 3;
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.setWalkable(x + dx, y + dy, false);
            }
        }
        // Door is walkable
        const doorX = x + Math.floor(w / 2);
        const doorY = y + h;
        this.setWalkable(doorX, doorY, true);

        this.objects.push({
            x, y, type, name,
            isBuilding: true,
            w, h,
        });
    },

    addObject(x, y, type, walkable) {
        this.objects.push({ x, y, type, isBuilding: false });
        if (!walkable) {
            this.setWalkable(x, y, false);
        }
    },

    getRegionAt(x, y) {
        for (const [key, r] of Object.entries(this.regions)) {
            if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
                return r.name;
            }
        }
        return 'Wilderness';
    },

    // Simple A* pathfinding
    findPath(sx, sy, ex, ey, maxSteps = 30) {
        if (!this.isWalkable(ex, ey)) return null;

        const key = (x, y) => x + ',' + y;
        const open = [{ x: sx, y: sy, g: 0, h: 0, f: 0, parent: null }];
        const closed = new Set();

        while (open.length > 0 && open.length < 500) {
            open.sort((a, b) => a.f - b.f);
            const current = open.shift();

            if (current.x === ex && current.y === ey) {
                const path = [];
                let node = current;
                while (node.parent) {
                    path.unshift({ x: node.x, y: node.y });
                    node = node.parent;
                }
                return path.slice(0, maxSteps);
            }

            closed.add(key(current.x, current.y));

            const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            ];

            for (const d of dirs) {
                const nx = current.x + d.dx;
                const ny = current.y + d.dy;

                if (closed.has(key(nx, ny)) || !this.isWalkable(nx, ny)) continue;

                const g = current.g + 1;
                const h = Math.abs(nx - ex) + Math.abs(ny - ey);
                const existing = open.find(n => n.x === nx && n.y === ny);

                if (!existing) {
                    open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
                } else if (g < existing.g) {
                    existing.g = g;
                    existing.f = g + existing.h;
                    existing.parent = current;
                }
            }
        }

        return null;
    },
};
