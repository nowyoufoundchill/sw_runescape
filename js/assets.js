// Asset Manager - RSC Visual Fidelity v3 (2:1 squashed isometric)
const Assets = {
    loaded: false,
    textures: {},
    sprites: {},

    // === EXACT SPEC PALETTE (Phase 2) ===
    PAL: {
        // Grass variants (60/25/15 weighting)
        grassBase:    '#4a7c3f',
        grassLight:   '#558a48',
        grassDark:    '#3a6230',

        // Path/dirt
        pathBase:     '#8b6914',
        pathLight:    '#9e7a1e',
        pathDark:     '#6b4f0e',

        // Water (dark navy — NOT bright blue)
        waterDeep:    '#1a2f7a',
        waterMid:     '#1e3694',
        waterShallow: '#2244aa',
        waterEdge:    '#0f1f55',

        // Stone
        stoneBase:    '#6b6b6b',
        stoneLight:   '#7d7d7d',
        stoneDark:    '#4a4a4a',

        // Wood
        woodBase:     '#5c3d1e',
        woodLight:    '#6e4f2a',

        // Lava
        lava:         '#aa3300',
        lavaLight:    '#cc4400',

        // Swamp
        swamp:        '#2a4a1a',
        swampDark:    '#1e3a0e',

        // Tree
        treeTrunk:    '#5c3d1e',
        treeTrunkDark:'#3a2510',
        treeCanopy1:  '#2d5a1b',
        treeCanopy2:  '#3a7022',
        treeCanopyDark:'#1e3d0f',

        // Characters
        skin:         '#ffcc88',
        skinShade:    '#ddaa66',
        hair:         '#4a2a0a',
        outlineColor: '#1a1a1a',

        // UI
        uiBg:         '#1a1a1a',
        uiText:       '#ffff00',
        uiHeader:     '#cc2200',
        uiPanel:      '#2a2a2a',
    },

    // === ISOMETRIC TILE DIMENSIONS (Phase 0: 4:1 ratio) ===
    TILE_W: 64,
    TILE_H: 16,

    // Seeded PRNG for consistent world generation
    _seed: 12345,
    seed(s) { this._seed = s; },
    rand() {
        this._seed = (this._seed * 16807 + 0) % 2147483647;
        return this._seed / 2147483647;
    },

    init() {
        this.generateTileTextures();
        this.generateObjectSprites();
        this.generateItemIcons();
        this.loaded = true;
    },

    // ===== ISOMETRIC TILE TEXTURES (64x16, Phase 2) =====
    generateTileTextures() {
        // Frame 1 water: waterMid with waterShallow specks
        this.textures['water']  = this.renderIsoTile([this.PAL.waterMid, this.PAL.waterShallow, this.PAL.waterDeep], 'water');
        // Frame 2 water: waterDeep with waterMid specks (swaps for shimmer)
        this.textures['water2'] = this.renderIsoTile([this.PAL.waterDeep, this.PAL.waterMid, this.PAL.waterEdge], 'water2');

        const types = {
            grass:  [this.PAL.grassBase, this.PAL.grassLight, this.PAL.grassDark],
            dirt:   [this.PAL.pathBase, this.PAL.pathLight, this.PAL.pathDark],
            sand:   ['#b89a4a', '#a88a3a', '#c8a858'],
            stone:  [this.PAL.stoneBase, this.PAL.stoneLight, this.PAL.stoneDark],
            path:   [this.PAL.pathBase, this.PAL.pathLight, this.PAL.pathDark],
            wood:   [this.PAL.woodBase, this.PAL.woodLight, '#4a2e10'],
            lava:   [this.PAL.lava, this.PAL.lavaLight, '#882200'],
            swamp:  [this.PAL.swamp, this.PAL.swampDark, '#1a3a0a'],
        };

        for (const [name, colors] of Object.entries(types)) {
            this.textures[name] = this.renderIsoTile(colors, name);
        }
    },

    renderIsoTile(colors, type) {
        const w = this.TILE_W;   // 64
        const h = this.TILE_H;   // 16 — 4:1 ratio
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Diamond clip path for 64x16 tile
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h / 2);
        ctx.lineTo(w / 2, h);
        ctx.lineTo(0, h / 2);
        ctx.closePath();
        ctx.clip();

        // Base fill
        ctx.fillStyle = colors[0];
        ctx.fillRect(0, 0, w, h);

        // Stipple texture: 3-5 randomly placed darker pixels (seeded)
        this.seed(this._hashType(type));
        for (let y = 0; y < h; y += 1) {
            for (let x = 0; x < w; x += 2) {
                const r = this.rand();
                if (r < 0.30) {
                    ctx.fillStyle = colors[Math.floor(this.rand() * colors.length)];
                    ctx.fillRect(x, y, 2, 1);
                }
            }
        }

        // Dark noise specks
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(0,0,0,${0.05 + this.rand() * 0.12})`;
            ctx.fillRect(Math.floor(this.rand() * w), Math.floor(this.rand() * h), 2, 1);
        }

        // Water edge pixel (1px darker border at land/water boundary)
        if (type === 'water' || type === 'water2') {
            ctx.strokeStyle = this.PAL.waterEdge;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h / 2);
            ctx.lineTo(w / 2, h);
            ctx.lineTo(0, h / 2);
            ctx.closePath();
            ctx.stroke();
        }

        // Path tiles: slight elevation (north edge lighter, south edge darker)
        if (type === 'path') {
            // North half (lighter — catching NW light)
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h / 2);
            ctx.lineTo(w / 2, h / 2);
            ctx.lineTo(0, h / 2);
            ctx.closePath();
            ctx.fill();
            // South half (darker — in shadow)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w / 2, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.lineTo(w / 2, h);
            ctx.closePath();
            ctx.fill();
        }

        return canvas;
    },

    _hashType(type) {
        let h = 0;
        for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) | 0;
        return Math.abs(h);
    },

    // ===== OBJECT SPRITES =====
    generateObjectSprites() {
        this.sprites.tree      = this.renderOakTree();
        this.sprites.deadTree  = this.renderDeadTree();
        this.sprites.serverRack= this.renderServerRack();
        this.sprites.bush      = this.renderBush();
        this.sprites.flowers   = this.renderFlowers();
        this.sprites.tallGrass = this.renderTallGrass();
        this.sprites.fenceH    = this.renderFence('h');
        this.sprites.fenceV    = this.renderFence('v');
        this.sprites.rock      = this.renderBoulder('grey');
        this.sprites.copperRock= this.renderBoulder('copper');
        this.sprites.tinRock   = this.renderBoulder('tin');
        this.sprites.barrel    = this.renderBarrel();
        this.sprites.house     = this.renderIsoBuilding('house');
        this.sprites.noc       = this.renderIsoBuilding('noc');
    },

    // Oak tree per spec: trunk 8x14, two-layer canopy, ground shadow
    renderOakTree() {
        const canvas = document.createElement('canvas');
        canvas.width = 44;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const cx = 22;

        // Ground shadow (ellipse beneath canopy, offset slightly SE per lighting spec)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, 61, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk: 8x14 (spec: width 8, height 14)
        const trunkX = cx - 4;
        const trunkY = 44;
        // Trunk outline
        ctx.fillStyle = this.PAL.treeTrunkDark;
        ctx.fillRect(trunkX - 1, trunkY - 1, 10, 16);
        // Trunk body
        ctx.fillStyle = this.PAL.treeTrunk;
        ctx.fillRect(trunkX, trunkY, 8, 14);
        // Trunk shading
        ctx.fillStyle = this.darken(this.PAL.treeTrunk, 20);
        ctx.fillRect(trunkX + 5, trunkY + 1, 2, 12);

        // Canopy layer 1 (bottom, wider): 34x22, centered
        const c1x = cx - 17;
        const c1y = 22;
        // Canopy 1 outline
        ctx.fillStyle = this.PAL.treeCanopyDark;
        ctx.fillRect(c1x - 1, c1y - 1, 36, 24);
        // Canopy 1 body
        ctx.fillStyle = this.PAL.treeCanopy1;
        ctx.fillRect(c1x, c1y, 34, 22);

        // Canopy layer 2 (top, lighter, offset): 28x18
        const c2x = cx - 14;
        const c2y = 14;
        // Canopy 2 outline
        ctx.fillStyle = this.PAL.treeCanopyDark;
        ctx.fillRect(c2x - 1, c2y - 1, 30, 20);
        // Canopy 2 body
        ctx.fillStyle = this.PAL.treeCanopy2;
        ctx.fillRect(c2x, c2y, 28, 18);

        // Highlight patches (NW light catch)
        ctx.fillStyle = this.lighten(this.PAL.treeCanopy2, 18);
        ctx.fillRect(c2x + 2, c2y + 2, 8, 4);
        ctx.fillRect(c2x + 12, c2y + 4, 6, 3);

        // Leaf detail specks
        this.seed(42);
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = this.rand() > 0.5 ? this.PAL.treeCanopy2 : this.PAL.treeCanopyDark;
            const lx = c1x + 2 + Math.floor(this.rand() * 30);
            const ly = c1y + 2 + Math.floor(this.rand() * 18);
            ctx.fillRect(lx, ly, 3, 2);
        }

        return canvas;
    },

    renderDeadTree() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 56;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(16, 53, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.fillStyle = '#2a1e10';
        ctx.fillRect(13, 8, 8, 46);
        ctx.fillRect(7, 14, 14, 3);
        ctx.fillRect(18, 8, 10, 3);
        ctx.fillRect(5, 26, 8, 3);
        ctx.fillRect(21, 22, 7, 2);

        // Trunk
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(14, 9, 6, 44);
        // Branches
        ctx.fillRect(8, 15, 12, 2);
        ctx.fillRect(19, 9, 8, 2);
        ctx.fillRect(6, 27, 7, 2);
        ctx.fillRect(22, 23, 6, 1);

        return canvas;
    },

    // Boulder per spec: highlight top-left, shadow bottom-right
    renderBoulder(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 26;
        canvas.height = 22;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const colors = type === 'copper' ? ['#8a5a2a', '#a06830', '#6a4420']
            : type === 'tin' ? ['#808080', '#999999', '#666666']
            : [this.PAL.stoneBase, this.PAL.stoneLight, this.PAL.stoneDark];

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(13, 20, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.fillStyle = this.darken(colors[2], 30);
        ctx.fillRect(3, 4, 20, 14);

        // Main rock body
        ctx.fillStyle = colors[2]; // dark shadow side (bottom-right)
        ctx.fillRect(4, 5, 18, 12);
        ctx.fillStyle = colors[0]; // mid tone
        ctx.fillRect(4, 4, 16, 9);
        ctx.fillStyle = colors[1]; // highlight top-left (NW light)
        ctx.fillRect(5, 4, 8, 5);
        ctx.fillRect(6, 5, 5, 3);

        // Ore specks
        if (type === 'copper') {
            ctx.fillStyle = '#c87830';
            ctx.fillRect(9, 7, 3, 2);
            ctx.fillRect(15, 9, 2, 3);
        } else if (type === 'tin') {
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(8, 6, 2, 2);
            ctx.fillRect(14, 8, 3, 2);
        }

        return canvas;
    },

    renderBush() {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(10, 14, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.fillStyle = this.PAL.treeCanopyDark;
        ctx.fillRect(1, 3, 18, 11);
        // Body
        ctx.fillStyle = this.PAL.treeCanopy1;
        ctx.fillRect(2, 4, 16, 10);
        // Light patches
        ctx.fillStyle = this.PAL.treeCanopy2;
        ctx.fillRect(4, 4, 5, 4);
        ctx.fillRect(11, 5, 4, 4);
        // Highlight
        ctx.fillStyle = this.lighten(this.PAL.treeCanopy2, 15);
        ctx.fillRect(5, 4, 2, 2);

        return canvas;
    },

    renderFlowers() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const flowerColors = ['#cc4444', '#dddd44', '#dd88dd', '#ffffff'];
        this.seed(777);
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[Math.floor(this.rand() * flowerColors.length)];
            ctx.fillRect(Math.floor(this.rand() * 14), Math.floor(this.rand() * 10), 2, 2);
            ctx.fillStyle = '#4a7a3a';
            ctx.fillRect(Math.floor(this.rand() * 14), Math.floor(this.rand() * 10) + 2, 1, 2);
        }
        return canvas;
    },

    renderTallGrass() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 14;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = this.PAL.grassLight;
        for (let i = 0; i < 5; i++) {
            const x = 2 + i * 3;
            ctx.fillRect(x, 4, 2, 10);
            ctx.fillRect(x - 1, 2, 2, 3);
        }
        ctx.fillStyle = this.PAL.grassDark;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(3 + i * 4, 6, 1, 6);
        }
        return canvas;
    },

    // Fence with post-and-rail construction per spec
    renderFence(orientation) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const post  = '#5c3d1e';
        const rail  = '#7d5a30';
        const dark  = '#3a2510';

        if (orientation === 'h') {
            // Rails at 1/3 and 2/3 height
            ctx.fillStyle = dark;
            ctx.fillRect(0, 7, 32, 4);
            ctx.fillRect(0, 13, 32, 4);
            ctx.fillStyle = rail;
            ctx.fillRect(0, 8, 32, 2);
            ctx.fillRect(0, 14, 32, 2);
            // Posts
            for (const px of [2, 14, 26]) {
                ctx.fillStyle = dark;
                ctx.fillRect(px - 1, 3, 6, 16);
                ctx.fillStyle = post;
                ctx.fillRect(px, 4, 4, 14);
            }
        } else {
            // Vertical fence
            ctx.fillStyle = dark;
            ctx.fillRect(11, 0, 4, 20);
            ctx.fillRect(17, 0, 4, 20);
            ctx.fillStyle = rail;
            ctx.fillRect(12, 0, 2, 20);
            ctx.fillRect(18, 0, 2, 20);
            for (const py of [2, 14]) {
                ctx.fillStyle = dark;
                ctx.fillRect(9, py - 1, 13, 5);
                ctx.fillStyle = post;
                ctx.fillRect(10, py, 11, 4);
            }
        }
        return canvas;
    },

    // Barrel per spec: body, 3 rings, lid
    renderBarrel() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(8, 19, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Barrel body outline
        ctx.fillStyle = this.darken(this.PAL.woodBase, 25);
        ctx.fillRect(2, 4, 12, 13);

        // Barrel body
        ctx.fillStyle = this.PAL.woodBase;
        ctx.fillRect(3, 5, 10, 11);

        // Lid outline
        ctx.fillStyle = this.darken(this.PAL.woodLight, 15);
        ctx.fillRect(2, 2, 12, 5);
        // Lid
        ctx.fillStyle = this.PAL.woodLight;
        ctx.fillRect(3, 3, 10, 3);

        // 3 metal rings (horizontal bands)
        const ringColor = this.PAL.pathBase;
        const ringY = [6, 10, 14];
        for (const ry of ringY) {
            ctx.fillStyle = this.darken(ringColor, 10);
            ctx.fillRect(2, ry, 12, 2);
            ctx.fillStyle = ringColor;
            ctx.fillRect(3, ry, 10, 1);
        }

        // Wood grain lines
        ctx.fillStyle = this.darken(this.PAL.woodBase, 15);
        ctx.fillRect(5, 5, 1, 11);
        ctx.fillRect(9, 5, 1, 11);

        return canvas;
    },

    renderServerRack() {
        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(14, 46, 11, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rack outline
        ctx.fillStyle = '#111';
        ctx.fillRect(3, 5, 22, 41);
        // Rack body
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(4, 6, 20, 39);
        ctx.fillStyle = '#333';
        ctx.fillRect(6, 8, 16, 35);

        // Drive bays with LEDs
        for (let y = 10; y < 42; y += 6) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(7, y, 14, 5);
            this.seed(y * 13 + 7);
            ctx.fillStyle = this.rand() > 0.2 ? '#00cc00' : '#cc0000';
            ctx.fillRect(9, y + 2, 2, 2);
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(13, y + 2, 2, 2);
            ctx.fillStyle = '#333';
            ctx.fillRect(17, y + 1, 2, 3);
        }
        return canvas;
    },

    // ===== ISOMETRIC BUILDINGS (Phase 4: 3 visible faces) =====
    // Building footprint: 3x3 tiles
    // TILE_W=64, TILE_H=16 → 3-tile span = 3*(TILE_W/2)=96 east, 3*(TILE_H/2)*2=48 south
    // Sprite: 192x80 (centered at x=96)
    // Render: ctx.drawImage(sprite, sx - 96, sy - 32, 192, 80)
    renderIsoBuilding(type) {
        const canvas = document.createElement('canvas');
        // 3x3 footprint: X spans -96 to +96 = 192px, Y spans 0 to 80
        canvas.width = 192;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Anchor: sprite pixel (96, 0) = NW corner of roof

        // Roof corners (relative to sprite, NW=96,0):
        const NW = { x: 96, y: 0  };
        const NE = { x: 192, y: 24 };
        const SE = { x: 96, y: 48 };
        const SW = { x: 0,  y: 24 };

        // Wall height (32px straight down in screen Y)
        const WH = 32;

        if (type === 'house') {
            // === GROUND SHADOW STRIPS (south + east of building) ===
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            // South shadow parallelogram
            ctx.beginPath();
            ctx.moveTo(SW.x, SW.y + WH);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(SE.x + 12, SE.y + WH + 4);
            ctx.lineTo(SW.x + 12, SW.y + WH + 4);
            ctx.closePath();
            ctx.fill();

            // === EAST WALL (side face — darkest, 0.55) ===
            ctx.beginPath();
            ctx.moveTo(NE.x, NE.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(NE.x, NE.y + WH);
            ctx.closePath();
            ctx.fillStyle = '#6b5a3e'; // side face color
            ctx.fill();
            // Stone texture on east wall
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let sy2 = NE.y + 2; sy2 < NE.y + WH; sy2 += 6) {
                for (let sx2 = 100; sx2 < 192; sx2 += 10) {
                    ctx.fillRect(sx2, sy2, 8, 4);
                }
            }

            // === SOUTH WALL (front face — medium, 0.75) ===
            ctx.beginPath();
            ctx.moveTo(SW.x, SW.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(SW.x, SW.y + WH);
            ctx.closePath();
            ctx.fillStyle = '#8b7355'; // front face color
            ctx.fill();
            // Stone texture on south wall
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let sy2 = SW.y + 2; sy2 < SW.y + WH; sy2 += 6) {
                for (let sx2 = 4; sx2 < 92; sx2 += 12) {
                    ctx.fillRect(sx2, sy2, 10, 4);
                }
            }

            // DOOR on south wall (centered)
            const doorX = 40;
            const doorY = SW.y + 18;
            ctx.fillStyle = '#3d2010'; // dark wood
            ctx.fillRect(doorX, doorY, 10, 14);
            ctx.fillStyle = '#2a1400';
            ctx.fillRect(doorX + 1, doorY + 1, 8, 12);
            // Door handle (2px lighter pixel right side)
            ctx.fillStyle = '#aa8840';
            ctx.fillRect(doorX + 7, doorY + 7, 2, 2);

            // WINDOWS on south wall
            for (const wx of [14, 70]) {
                ctx.fillStyle = '#5c3d1e'; // frame
                ctx.fillRect(wx, SW.y + 8, 12, 8);
                ctx.fillStyle = '#aaccff'; // glass
                ctx.fillRect(wx + 1, SW.y + 9, 10, 6);
                // Cross divider
                ctx.fillStyle = '#5c3d1e';
                ctx.fillRect(wx + 5, SW.y + 9, 1, 6); // vertical
                ctx.fillRect(wx + 1, SW.y + 12, 10, 1); // horizontal
            }

            // === ROOF (top face — brightest, 1.0) ===
            ctx.beginPath();
            ctx.moveTo(NW.x, NW.y);
            ctx.lineTo(NE.x, NE.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SW.x, SW.y);
            ctx.closePath();
            ctx.fillStyle = '#8b4513'; // brown tile roof
            ctx.fill();
            // Roof ridge line
            ctx.strokeStyle = '#6b3010';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(NW.x, NW.y + 1);
            ctx.lineTo(SE.x, SE.y - 1);
            ctx.stroke();
            // Roof tile texture
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let ri = 0; ri < 4; ri++) {
                const ry = 4 + ri * 10;
                for (let rx = 72; rx < 116; rx += 14) {
                    ctx.fillRect(rx, ry, 10, 4);
                }
            }
            // NW face highlight (lighter)
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.moveTo(NW.x, NW.y);
            ctx.lineTo(NE.x, NE.y);
            ctx.lineTo(NW.x, (NW.y + SE.y) / 2);
            ctx.closePath();
            ctx.fill();

            // Building sign above roof
            // (drawn in engine.js with name label)

        } else if (type === 'noc') {
            // === GROUND SHADOW ===
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.moveTo(SW.x, SW.y + WH);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(SE.x + 14, SE.y + WH + 5);
            ctx.lineTo(SW.x + 14, SW.y + WH + 5);
            ctx.closePath();
            ctx.fill();

            // === EAST WALL (darkest) ===
            ctx.beginPath();
            ctx.moveTo(NE.x, NE.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(NE.x, NE.y + WH);
            ctx.closePath();
            ctx.fillStyle = '#2a2a2a';
            ctx.fill();
            // Glass windows east
            ctx.fillStyle = '#1e3050';
            ctx.fillRect(102, NE.y + 4, 24, 12);
            ctx.fillRect(128, NE.y + 4, 20, 12);
            ctx.fillStyle = 'rgba(100,150,200,0.2)';
            ctx.fillRect(103, NE.y + 5, 8, 5);

            // === SOUTH WALL ===
            ctx.beginPath();
            ctx.moveTo(SW.x, SW.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SE.x, SE.y + WH);
            ctx.lineTo(SW.x, SW.y + WH);
            ctx.closePath();
            ctx.fillStyle = '#3a3a3a';
            ctx.fill();
            // Glass panel
            ctx.fillStyle = '#223344';
            ctx.fillRect(8, SW.y + 4, 80, 14);
            ctx.fillStyle = '#2a4466';
            ctx.fillRect(9, SW.y + 5, 24, 12);
            ctx.fillRect(35, SW.y + 5, 24, 12);
            ctx.fillStyle = 'rgba(100,150,200,0.2)';
            ctx.fillRect(10, SW.y + 6, 8, 5);
            ctx.fillRect(36, SW.y + 6, 8, 5);
            // Door
            ctx.fillStyle = '#1a3050';
            ctx.fillRect(38, SW.y + 16, 14, 16);

            // === ROOF (flat NOC roof) ===
            ctx.beginPath();
            ctx.moveTo(NW.x, NW.y);
            ctx.lineTo(NE.x, NE.y);
            ctx.lineTo(SE.x, SE.y);
            ctx.lineTo(SW.x, SW.y);
            ctx.closePath();
            ctx.fillStyle = '#2a2a2a';
            ctx.fill();
            // SolarWinds orange stripe
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(NW.x - 8, NW.y + 12);
            ctx.lineTo(NE.x - 8, NE.y + 12);
            ctx.lineTo(NE.x - 8, NE.y + 16);
            ctx.lineTo(NW.x - 8, NW.y + 16);
            ctx.closePath();
            ctx.fill();
            // Satellite dish
            ctx.fillStyle = '#666';
            ctx.fillRect(110, 6, 10, 6);
            ctx.fillRect(114, 4, 3, 3);
            // Blinking light
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(115, 3, 2, 2);
        }

        return canvas;
    },

    // ===== CHARACTER SPRITES (Phase 1) =====
    // Anatomy: head 10x10, neck 4x3, torso 14x10, arms 4x9, legs 5x9
    // 1px dark outline, shadow ellipse, 4-direction support
    generateCharacterSprite(options = {}) {
        const {
            color = '#cc2200',
            legsColor = null,
            isNPC = false,
            npcType = 'human',
            hat = null,
            hairColor = null,
            walkFrame = 0, // 0=idle/walk1, 1=walk2
            direction = 'south',
        } = options;

        if (npcType === 'goblin') return this._drawGoblinSprite();
        if (npcType === 'guard') return this._drawGuardSprite();

        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 36; // 32 body + 4 for shadow
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const skin = this.PAL.skin;
        const skinShade = this.PAL.skinShade;
        const hair = hairColor || this.PAL.hair;
        const shirt = color;
        const pants = legsColor || this.PAL.legsBlue;
        // Default player: shirt #cc2200, legs #2244cc (spec)
        const boots = '#3a2a1a';
        const outline = this.PAL.outlineColor;

        const cx = 12; // center x

        // HEAD: 10x10, yOffset 0
        const hx = cx - 5, hy = 0;
        this._drawPartWithOutline(ctx, hx, hy, 10, 10, skin, outline);
        // Hair on top
        ctx.fillStyle = hair;
        ctx.fillRect(hx, hy, 10, 3);
        // Eyes
        ctx.fillStyle = '#1a0a00';
        if (direction !== 'north') {
            ctx.fillRect(hx + 2, hy + 5, 2, 1);
            ctx.fillRect(hx + 6, hy + 5, 2, 1);
        }
        // Hat if provided
        if (hat) {
            ctx.fillStyle = outline;
            ctx.fillRect(hx - 1, hy - 2, 12, 4);
            ctx.fillStyle = hat;
            ctx.fillRect(hx, hy - 1, 10, 3);
        }

        // NECK: 4x3, yOffset 10
        this._drawPartWithOutline(ctx, cx - 2, 10, 4, 3, skinShade, outline);

        // TORSO: 14x10, yOffset 13
        const tx = cx - 7;
        this._drawPartWithOutline(ctx, tx, 13, 14, 10, shirt, outline);
        // Torso shading (NW light: left side slightly lighter, right darker)
        ctx.fillStyle = this.lighten(shirt, 12);
        ctx.fillRect(tx + 1, 13, 3, 10);
        ctx.fillStyle = this.darken(shirt, 20);
        ctx.fillRect(tx + 10, 13, 3, 10);

        // ARMS: 4x9, yOffset 14
        // Left arm
        const lax = cx - 9 - 2; // cx + xOffset(-9) - width/2(2)
        this._drawPartWithOutline(ctx, lax, 14, 4, 9, shirt, outline);
        // Left hand
        ctx.fillStyle = outline;
        ctx.fillRect(lax - 1, 22, 6, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(lax, 23, 4, 2);

        // Right arm
        const rax = cx + 9 - 2; // cx + xOffset(9) - width/2(2)
        this._drawPartWithOutline(ctx, rax, 14, 4, 9, shirt, outline);
        // Right hand
        ctx.fillStyle = outline;
        ctx.fillRect(rax - 1, 22, 6, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(rax, 23, 4, 2);

        // LEGS: 5x9, yOffset 23
        // Walking animation: alternate leg forward/back
        const leftLegY  = 23 + (walkFrame === 1 ? -2 : 0);
        const rightLegY = 23 + (walkFrame === 1 ?  2 : 0);

        const llx = cx - 3 - 2; // cx + xOffset(-3) - width/2(2) = 7
        const rlx = cx + 3 - 2; // cx + xOffset(3) - width/2(2)  = 13

        this._drawPartWithOutline(ctx, llx, leftLegY, 5, 9, pants, outline);
        this._drawPartWithOutline(ctx, rlx, rightLegY, 5, 9, pants, outline);

        // BOOTS
        ctx.fillStyle = outline;
        ctx.fillRect(llx - 1, leftLegY + 8,  7, 4);
        ctx.fillRect(rlx - 1, rightLegY + 8, 7, 4);
        ctx.fillStyle = boots;
        ctx.fillRect(llx, leftLegY + 9,  5, 2);
        ctx.fillRect(rlx, rightLegY + 9, 5, 2);

        // SHADOW ELLIPSE beneath feet (12x4, rgba(0,0,0,0.4))
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 34, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        return canvas;
    },

    // Draw a rect with 1px dark outline around it
    _drawPartWithOutline(ctx, x, y, w, h, color, outlineColor) {
        ctx.fillStyle = outlineColor;
        ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    },

    _drawGoblinSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 36;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const green = '#2a5a1a';
        const darkGreen = '#1a4a0a';
        const armor = '#5a4a00';
        const outline = this.PAL.outlineColor;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(12, 34, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (bigger, goblin-like)
        this._drawPartWithOutline(ctx, 6, 2, 12, 10, green, outline);
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(8, 6, 3, 2);
        ctx.fillRect(13, 6, 3, 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 11, 8, 1);

        // Body
        this._drawPartWithOutline(ctx, 5, 12, 14, 10, armor, outline);
        ctx.fillStyle = this.darken(armor, 15);
        ctx.fillRect(5, 12, 2, 10);

        // Arms (green, longer)
        this._drawPartWithOutline(ctx, 1, 12, 4, 10, green, outline);
        this._drawPartWithOutline(ctx, 19, 12, 4, 10, green, outline);

        // Legs
        this._drawPartWithOutline(ctx, 6, 22, 5, 9, darkGreen, outline);
        this._drawPartWithOutline(ctx, 13, 22, 5, 9, darkGreen, outline);

        // Feet
        ctx.fillStyle = outline;
        ctx.fillRect(5, 30, 7, 4);
        ctx.fillRect(12, 30, 7, 4);
        ctx.fillStyle = green;
        ctx.fillRect(6, 31, 5, 2);
        ctx.fillRect(13, 31, 5, 2);

        return canvas;
    },

    _drawGuardSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 36;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const skin = this.PAL.skin;
        const chainmail = '#888888';
        const helmet = '#777777';
        const outline = this.PAL.outlineColor;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(12, 34, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        this._drawPartWithOutline(ctx, 7, 2, 10, 8, skin, outline);
        ctx.fillStyle = '#1a1a00';
        ctx.fillRect(9, 6, 2, 1);
        ctx.fillRect(13, 6, 2, 1);

        // Helmet
        ctx.fillStyle = outline;
        ctx.fillRect(6, -1, 12, 6);
        ctx.fillStyle = this.lighten(helmet, 15);
        ctx.fillRect(7, 0, 10, 5);
        ctx.fillStyle = '#999';
        ctx.fillRect(8, 1, 8, 3);
        ctx.fillStyle = '#666';
        ctx.fillRect(11, 3, 2, 4); // nose guard

        // Neck
        this._drawPartWithOutline(ctx, 10, 10, 4, 3, skin, outline);

        // Torso (chainmail)
        this._drawPartWithOutline(ctx, 5, 13, 14, 10, chainmail, outline);
        // Chain pattern
        ctx.fillStyle = '#666';
        for (let cy = 14; cy < 23; cy += 2) {
            for (let cxp = 7; cxp < 17; cxp += 2) {
                ctx.fillRect(cxp, cy, 1, 1);
            }
        }

        // Arms
        this._drawPartWithOutline(ctx, 1, 13, 4, 9, helmet, outline);
        this._drawPartWithOutline(ctx, 19, 13, 4, 9, helmet, outline);
        ctx.fillStyle = skin;
        ctx.fillRect(2, 22, 2, 2);
        ctx.fillRect(20, 22, 2, 2);

        // Legs
        this._drawPartWithOutline(ctx, 7, 23, 5, 9, '#666', outline);
        this._drawPartWithOutline(ctx, 13, 23, 5, 9, '#666', outline);

        // Boots
        ctx.fillStyle = outline;
        ctx.fillRect(6, 31, 7, 4);
        ctx.fillRect(12, 31, 7, 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(7, 32, 5, 2);
        ctx.fillRect(13, 32, 5, 2);

        // Spear
        ctx.fillStyle = this.PAL.woodBase;
        ctx.fillRect(20, 0, 2, 30);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(19, -2, 4, 5);

        return canvas;
    },

    // ===== ITEM ICONS =====
    generateItemIcons() {
        const ids = [
            'bronze_sword', 'bronze_shield', 'logs', 'coins', 'net_monitor',
            'server_crystal', 'orion_amulet', 'cooked_meat', 'bread',
            'packet_rune', 'firewall_shield', 'observability_gem'
        ];
        ids.forEach(id => {
            this.sprites['item_' + id] = this.renderItemIcon(id);
        });
    },

    renderItemIcon(itemId) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const draw = {
            bronze_sword: () => {
                ctx.fillStyle = '#8a6030';
                ctx.fillRect(14, 2, 4, 18);
                ctx.fillRect(8, 18, 16, 3);
                ctx.fillStyle = '#5c3d1e';
                ctx.fillRect(12, 21, 8, 8);
            },
            bronze_shield: () => {
                ctx.fillStyle = '#8a6030';
                ctx.fillRect(6, 4, 20, 24);
                ctx.fillStyle = '#a07040';
                ctx.fillRect(8, 6, 16, 20);
                ctx.fillStyle = '#8a6030';
                ctx.fillRect(14, 8, 4, 16);
                ctx.fillRect(8, 14, 16, 4);
            },
            logs: () => {
                ctx.fillStyle = this.PAL.woodBase;
                ctx.fillRect(4, 14, 24, 6);
                ctx.fillStyle = this.PAL.woodLight;
                ctx.fillRect(4, 20, 24, 6);
                ctx.fillStyle = '#7a5e3e';
                ctx.fillRect(4, 14, 24, 2);
            },
            coins: () => {
                ctx.fillStyle = '#ccaa00';
                ctx.fillRect(8, 8, 16, 16);
                ctx.fillStyle = '#aa8800';
                ctx.fillRect(10, 10, 12, 12);
                ctx.fillStyle = '#ccaa00';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('G', 16, 21);
            },
            net_monitor: () => {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(4, 4, 24, 18);
                ctx.fillStyle = '#111';
                ctx.fillRect(6, 6, 20, 14);
                ctx.fillStyle = '#00cc00';
                ctx.fillRect(8, 14, 2, 2); ctx.fillRect(11, 12, 2, 2);
                ctx.fillRect(14, 10, 2, 2); ctx.fillRect(17, 13, 2, 2);
                ctx.fillRect(20, 8, 2, 2);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(10, 22, 12, 3);
                ctx.fillRect(8, 25, 16, 2);
            },
            server_crystal: () => {
                ctx.fillStyle = '#0088aa';
                ctx.fillRect(12, 4, 8, 4);
                ctx.fillRect(10, 8, 12, 12);
                ctx.fillRect(12, 20, 8, 4);
                ctx.fillStyle = '#44bbcc';
                ctx.fillRect(14, 6, 4, 2);
                ctx.fillRect(12, 10, 8, 6);
            },
            orion_amulet: () => {
                ctx.fillStyle = '#666';
                ctx.fillRect(14, 2, 4, 8);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(8, 10, 16, 16);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(10, 12, 12, 12);
                ctx.fillStyle = '#ff6600';
                ctx.font = 'bold 7px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SW', 16, 22);
            },
            cooked_meat: () => {
                ctx.fillStyle = '#6a3a1a';
                ctx.fillRect(6, 10, 20, 12);
                ctx.fillStyle = '#8a5a2a';
                ctx.fillRect(8, 8, 16, 12);
                ctx.fillStyle = '#5a2a0a';
                ctx.fillRect(14, 20, 4, 6);
            },
            bread: () => {
                ctx.fillStyle = '#aa8844';
                ctx.fillRect(4, 14, 24, 8);
                ctx.fillStyle = '#bb9954';
                ctx.fillRect(6, 12, 20, 8);
                ctx.fillStyle = '#997744';
                ctx.fillRect(8, 16, 16, 3);
            },
            packet_rune: () => {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(8, 4, 16, 24);
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(10, 6, 12, 20);
                ctx.fillStyle = '#111';
                ctx.font = '7px monospace'; ctx.textAlign = 'center';
                ctx.fillText('TCP', 16, 15);
                ctx.fillText('IP', 16, 22);
            },
            firewall_shield: () => {
                ctx.fillStyle = '#881100';
                ctx.fillRect(6, 4, 20, 24);
                ctx.fillStyle = '#bb2200';
                ctx.fillRect(8, 6, 16, 20);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(12, 8, 3, 8);
                ctx.fillRect(17, 10, 3, 6);
                ctx.fillRect(14, 6, 4, 4);
            },
            observability_gem: () => {
                ctx.fillStyle = '#6600aa';
                ctx.fillRect(10, 6, 12, 6);
                ctx.fillRect(8, 12, 16, 8);
                ctx.fillRect(10, 20, 12, 4);
                ctx.fillStyle = '#8844cc';
                ctx.fillRect(12, 8, 8, 4);
                ctx.fillRect(10, 14, 12, 4);
                ctx.fillStyle = '#aa66ee';
                ctx.fillRect(14, 10, 4, 2);
            },
        };

        if (draw[itemId]) draw[itemId]();
        else {
            ctx.fillStyle = '#666';
            ctx.fillRect(8, 8, 16, 16);
        }
        return canvas;
    },

    // ===== UTILITY =====
    darken(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
        const b = Math.max(0, (num & 0xFF) - amount);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    },

    lighten(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
        const b = Math.min(255, (num & 0xFF) + amount);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    },
};
