// Asset Manager - RSC-style isometric assets with muted palette
const Assets = {
    loaded: false,
    textures: {},
    sprites: {},

    // RSC-authentic MUTED color palette (per spec)
    PAL: {
        grass:      '#4a7c3f',
        grassVar:   '#3d6b2e',
        grassDark:  '#345a27',
        dirt:       '#8b6914',
        dirtVar:    '#7a5c10',
        sand:       '#b89a4a',
        sandVar:    '#a88a3a',
        water:      '#2244aa',
        waterDark:  '#1a3388',
        waterLight: '#3355bb',
        stone:      '#6b6b6b',
        stoneVar:   '#5a5a5a',
        path:       '#8b6914',
        pathVar:    '#7a5c10',
        wood:       '#5c3d1e',
        woodLight:  '#6e4e2e',
        lava:       '#aa3300',
        lavaLight:  '#cc4400',
        swamp:      '#2a4a1a',
        swampDark:  '#1e3a0e',
        treeTrunk:  '#5c3d1e',
        treeCanopy: '#2d5a1b',
        treeLight:  '#3a6a28',
        treeDark:   '#1e4a0e',
        skin:       '#ffcc88',
        skinShade:  '#ddaa66',
        hair:       '#4a2a0a',
        shirtRed:   '#cc0000',
        legsBlue:   '#4444cc',
        boots:      '#3a2a1a',
        uiBg:       '#1a1a1a',
        uiText:     '#ffff00',
        uiHeader:   '#cc2200',
    },

    // Isometric tile dimensions
    TILE_W: 64,
    TILE_H: 32,

    // Seeded PRNG for consistent placement
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

    // ===== ISOMETRIC TILE TEXTURES =====
    generateTileTextures() {
        const types = {
            grass:  [this.PAL.grass, this.PAL.grassVar, this.PAL.grassDark],
            dirt:   [this.PAL.dirt, this.PAL.dirtVar, '#6a4e0e'],
            sand:   [this.PAL.sand, this.PAL.sandVar, '#c8a858'],
            water:  [this.PAL.water, this.PAL.waterDark, this.PAL.waterLight],
            stone:  [this.PAL.stone, this.PAL.stoneVar, '#505050'],
            path:   [this.PAL.path, this.PAL.pathVar, '#6a4e0e'],
            wood:   [this.PAL.wood, this.PAL.woodLight, '#4a2e10'],
            lava:   [this.PAL.lava, this.PAL.lavaLight, '#882200'],
            swamp:  [this.PAL.swamp, this.PAL.swampDark, '#1a3a0a'],
        };

        for (const [name, colors] of Object.entries(types)) {
            this.textures[name] = this.renderIsoTile(colors, name);
        }
    },

    renderIsoTile(colors, type) {
        const w = this.TILE_W;
        const h = this.TILE_H;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Diamond clip path
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

        // RSC-style dithered texture (2px pixel blocks)
        this.seed(type.charCodeAt(0) * 137 + type.length * 31);
        const px = 2;
        for (let y = 0; y < h; y += px) {
            for (let x = 0; x < w; x += px) {
                if (this.rand() < 0.45) {
                    ctx.fillStyle = colors[Math.floor(this.rand() * colors.length)];
                    ctx.fillRect(x, y, px, px);
                }
            }
        }

        // Add dark noise specks
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(0,0,0,${0.05 + this.rand() * 0.1})`;
            ctx.fillRect(Math.floor(this.rand() * w), Math.floor(this.rand() * h), 2, 2);
        }

        // Water gets subtle wave lines
        if (type === 'water') {
            ctx.strokeStyle = 'rgba(80,120,200,0.25)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const yy = 6 + i * 10;
                ctx.beginPath();
                ctx.moveTo(10, yy);
                ctx.quadraticCurveTo(w / 2, yy - 3, w - 10, yy);
                ctx.stroke();
            }
        }

        return canvas;
    },

    // ===== OBJECT SPRITES =====
    generateObjectSprites() {
        this.sprites.tree = this.renderTree('normal');
        this.sprites.deadTree = this.renderTree('dead');
        this.sprites.serverRack = this.renderServerRack();
        this.sprites.bush = this.renderBush();
        this.sprites.flowers = this.renderFlowers();
        this.sprites.tallGrass = this.renderTallGrass();
        this.sprites.fenceH = this.renderFence('h');
        this.sprites.fenceV = this.renderFence('v');
        this.sprites.rock = this.renderRock('grey');
        this.sprites.copperRock = this.renderRock('copper');
        this.sprites.tinRock = this.renderRock('tin');
        this.sprites.house = this.renderIsoBuilding('house');
        this.sprites.noc = this.renderIsoBuilding('noc');
    },

    renderTree(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');

        if (type === 'normal') {
            // Shadow on ground
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(20, 56, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Trunk
            ctx.fillStyle = this.PAL.treeTrunk;
            ctx.fillRect(17, 30, 6, 28);
            ctx.fillStyle = '#4a2e10';
            ctx.fillRect(19, 32, 2, 24);

            // Canopy - layered circles for RSC look
            const cx = 20, cy = 22;
            ctx.fillStyle = this.PAL.treeDark;
            ctx.fillRect(4, 10, 32, 26);
            ctx.fillStyle = this.PAL.treeCanopy;
            ctx.fillRect(6, 6, 28, 24);
            ctx.fillStyle = this.PAL.treeLight;
            ctx.fillRect(10, 8, 12, 10);
            ctx.fillRect(18, 12, 10, 8);
            // Leaf detail
            this.seed(42);
            for (let i = 0; i < 6; i++) {
                ctx.fillStyle = this.rand() > 0.5 ? this.PAL.treeLight : this.PAL.treeDark;
                const lx = 6 + Math.floor(this.rand() * 26);
                const ly = 6 + Math.floor(this.rand() * 22);
                ctx.fillRect(lx, ly, 4, 3);
            }
        } else {
            // Dead tree
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(20, 56, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(18, 12, 5, 46);
            // Branches
            ctx.fillRect(10, 20, 12, 3);
            ctx.fillRect(22, 14, 10, 3);
            ctx.fillRect(8, 32, 8, 3);
            ctx.fillRect(24, 28, 8, 2);
        }

        return canvas;
    },

    renderBush() {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(10, 14, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.PAL.treeDark;
        ctx.fillRect(2, 4, 16, 10);
        ctx.fillStyle = this.PAL.treeCanopy;
        ctx.fillRect(4, 2, 12, 10);
        ctx.fillStyle = this.PAL.treeLight;
        ctx.fillRect(6, 4, 4, 4);
        ctx.fillRect(10, 6, 4, 3);
        return canvas;
    },

    renderFlowers() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');

        // Small colored dots on grass
        const flowerColors = ['#cc4444', '#dddd44', '#dd88dd', '#ffffff'];
        this.seed(777);
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = flowerColors[Math.floor(this.rand() * flowerColors.length)];
            ctx.fillRect(Math.floor(this.rand() * 14), Math.floor(this.rand() * 10), 2, 2);
            // Tiny stem
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

        ctx.fillStyle = this.PAL.grassVar;
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

    renderFence(orientation) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6a4a2a';
        if (orientation === 'h') {
            // Horizontal fence
            ctx.fillRect(0, 8, 32, 3);
            ctx.fillRect(0, 14, 32, 3);
            // Posts
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(2, 4, 4, 16);
            ctx.fillRect(14, 4, 4, 16);
            ctx.fillRect(26, 4, 4, 16);
        } else {
            ctx.fillRect(12, 0, 3, 20);
            ctx.fillRect(18, 0, 3, 20);
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(10, 0, 4, 5);
            ctx.fillRect(10, 15, 4, 5);
        }
        return canvas;
    },

    renderRock(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');

        const colors = type === 'copper' ? ['#8a5a2a', '#a06830', '#6a4420']
            : type === 'tin' ? ['#808080', '#999999', '#666666']
            : ['#5a5a5a', '#6a6a6a', '#4a4a4a'];

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(12, 18, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main rock body (isometric-ish)
        ctx.fillStyle = colors[2]; // darkest = back
        ctx.fillRect(4, 6, 18, 12);
        ctx.fillStyle = colors[0]; // mid = top
        ctx.fillRect(4, 4, 16, 8);
        ctx.fillStyle = colors[1]; // lightest = highlight
        ctx.fillRect(6, 4, 8, 5);

        // Ore specks for copper/tin
        if (type === 'copper') {
            ctx.fillStyle = '#c87830';
            ctx.fillRect(8, 6, 3, 2);
            ctx.fillRect(14, 8, 2, 3);
        } else if (type === 'tin') {
            ctx.fillStyle = '#bbb';
            ctx.fillRect(7, 5, 2, 2);
            ctx.fillRect(13, 7, 3, 2);
        }

        return canvas;
    },

    renderServerRack() {
        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(14, 46, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rack body
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(4, 6, 20, 40);
        ctx.fillStyle = '#333';
        ctx.fillRect(6, 8, 16, 36);

        // Drive bays with LEDs
        for (let y = 10; y < 42; y += 6) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(7, y, 14, 5);
            // LED
            this.seed(y * 13);
            ctx.fillStyle = this.rand() > 0.2 ? '#00cc00' : '#cc0000';
            ctx.fillRect(9, y + 2, 2, 2);
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(13, y + 2, 2, 2);
            // Drive slot lines
            ctx.fillStyle = '#333';
            ctx.fillRect(17, y + 1, 2, 3);
        }

        return canvas;
    },

    // ===== ISOMETRIC BUILDINGS =====
    renderIsoBuilding(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');

        if (type === 'house') {
            // Front face (lighter wall)
            ctx.fillStyle = '#a09080';
            ctx.fillRect(8, 30, 80, 42);
            // Stone block pattern
            ctx.fillStyle = '#8a7a6a';
            for (let y = 32; y < 72; y += 8) {
                for (let x = 10; x < 86; x += 12) {
                    ctx.fillRect(x, y, 10, 6);
                }
            }
            // Side face (darker)
            ctx.fillStyle = '#7a6a5a';
            // Roof - angled
            ctx.fillStyle = this.PAL.uiHeader; // dark red roof
            ctx.beginPath();
            ctx.moveTo(0, 30);
            ctx.lineTo(48, 8);
            ctx.lineTo(96, 30);
            ctx.lineTo(48, 18);
            ctx.closePath();
            ctx.fill();
            // Roof highlight
            ctx.fillStyle = '#dd3300';
            ctx.beginPath();
            ctx.moveTo(48, 8);
            ctx.lineTo(96, 30);
            ctx.lineTo(48, 18);
            ctx.closePath();
            ctx.fill();
            // Door
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(38, 48, 20, 24);
            ctx.fillStyle = '#3a1a00';
            ctx.fillRect(40, 50, 16, 20);
            // Door handle
            ctx.fillStyle = '#ddaa00';
            ctx.fillRect(50, 58, 3, 3);
            // Windows
            ctx.fillStyle = '#334466';
            ctx.fillRect(14, 40, 16, 12);
            ctx.fillRect(66, 40, 16, 12);
            // Window panes
            ctx.fillStyle = '#446688';
            ctx.fillRect(15, 41, 7, 5);
            ctx.fillRect(23, 41, 7, 5);
            ctx.fillRect(67, 41, 7, 5);
            ctx.fillRect(75, 41, 7, 5);
        } else if (type === 'noc') {
            // Modern building - NOC HQ
            // Front face
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(4, 26, 88, 50);
            ctx.fillStyle = '#444';
            ctx.fillRect(6, 28, 84, 46);
            // Flat roof (darker)
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 20, 96, 10);
            // SolarWinds orange stripe
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(24, 22, 48, 4);
            // Glass panels
            ctx.fillStyle = '#223344';
            ctx.fillRect(10, 34, 76, 18);
            ctx.fillStyle = '#2a4466';
            ctx.fillRect(12, 36, 24, 14);
            ctx.fillRect(38, 36, 24, 14);
            ctx.fillRect(64, 36, 20, 14);
            // Glass reflections
            ctx.fillStyle = 'rgba(100,150,200,0.15)';
            ctx.fillRect(14, 37, 8, 6);
            ctx.fillRect(40, 37, 8, 6);
            // Door
            ctx.fillStyle = '#1a3050';
            ctx.fillRect(40, 56, 16, 20);
            // Satellite dish on roof
            ctx.fillStyle = '#666';
            ctx.fillRect(74, 12, 10, 8);
            ctx.fillRect(78, 10, 3, 4);
            // Blinking light
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(80, 8, 2, 2);
        }

        return canvas;
    },

    // ===== CHARACTER SPRITES (28-32px humanoid) =====
    generateCharacterSprite(options = {}) {
        const {
            color = '#cc0000',
            isNPC = false,
            npcType = 'human',
            hat = null,
            hairColor = null,
        } = options;

        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const skin = this.PAL.skin;
        const skinShade = this.PAL.skinShade;
        const hair = hairColor || this.PAL.hair;
        const shirt = color;
        const pants = isNPC ? this.darken(color, 50) : this.PAL.legsBlue;
        const boot = this.PAL.boots;

        if (npcType === 'goblin') {
            this._drawGoblin(ctx);
            return canvas;
        }
        if (npcType === 'guard') {
            this._drawGuard(ctx);
            return canvas;
        }

        // === HUMANOID SPRITE (20x32) ===
        // Head (6x6 block)
        ctx.fillStyle = skin;
        ctx.fillRect(7, 2, 6, 6);

        // Hair
        ctx.fillStyle = hair;
        ctx.fillRect(7, 0, 6, 3);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 4, 2, 1);
        ctx.fillRect(11, 4, 2, 1);

        // Neck
        ctx.fillStyle = skinShade;
        ctx.fillRect(9, 8, 2, 1);

        // Torso (8x8)
        ctx.fillStyle = shirt;
        ctx.fillRect(5, 9, 10, 9);
        // Shading on torso
        ctx.fillStyle = this.darken(shirt, 30);
        ctx.fillRect(5, 9, 2, 9);
        ctx.fillRect(13, 9, 2, 9);

        // Arms (2x8 each side)
        ctx.fillStyle = shirt;
        ctx.fillRect(3, 9, 2, 8);
        ctx.fillRect(15, 9, 2, 8);
        // Hands
        ctx.fillStyle = skin;
        ctx.fillRect(3, 17, 2, 2);
        ctx.fillRect(15, 17, 2, 2);

        // Legs (3x8 each)
        ctx.fillStyle = pants;
        ctx.fillRect(6, 18, 3, 8);
        ctx.fillRect(11, 18, 3, 8);
        // Leg shading
        ctx.fillStyle = this.darken(pants, 20);
        ctx.fillRect(6, 18, 1, 8);
        ctx.fillRect(13, 18, 1, 8);

        // Boots
        ctx.fillStyle = boot;
        ctx.fillRect(5, 26, 4, 3);
        ctx.fillRect(11, 26, 4, 3);

        // Hat (if NPC has one)
        if (hat) {
            ctx.fillStyle = hat;
            ctx.fillRect(5, -1, 10, 3);
            ctx.fillRect(7, -2, 6, 2);
        }

        return canvas;
    },

    _drawGoblin(ctx) {
        // Green monster, shorter and wider
        const green = '#2a5a1a';
        const darkGreen = '#1a4a0a';

        // Head
        ctx.fillStyle = green;
        ctx.fillRect(5, 4, 10, 8);
        // Red eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(7, 6, 2, 2);
        ctx.fillRect(11, 6, 2, 2);
        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 10, 4, 1);

        // Body
        ctx.fillStyle = '#5a4a00';
        ctx.fillRect(4, 12, 12, 10);
        ctx.fillStyle = '#4a3a00';
        ctx.fillRect(4, 12, 2, 10);

        // Arms
        ctx.fillStyle = green;
        ctx.fillRect(2, 13, 2, 8);
        ctx.fillRect(16, 13, 2, 8);

        // Legs
        ctx.fillStyle = darkGreen;
        ctx.fillRect(5, 22, 4, 7);
        ctx.fillRect(11, 22, 4, 7);

        // Feet
        ctx.fillStyle = green;
        ctx.fillRect(4, 28, 5, 3);
        ctx.fillRect(11, 28, 5, 3);
    },

    _drawGuard(ctx) {
        const skin = this.PAL.skin;

        // Head
        ctx.fillStyle = skin;
        ctx.fillRect(7, 2, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 4, 2, 1);
        ctx.fillRect(11, 4, 2, 1);

        // Helmet
        ctx.fillStyle = '#777';
        ctx.fillRect(6, -1, 8, 4);
        ctx.fillStyle = '#888';
        ctx.fillRect(7, 0, 6, 3);
        // Nose guard
        ctx.fillStyle = '#666';
        ctx.fillRect(9, 3, 2, 3);

        // Chainmail body
        ctx.fillStyle = '#888';
        ctx.fillRect(5, 9, 10, 9);
        // Chain pattern
        ctx.fillStyle = '#666';
        for (let y = 10; y < 18; y += 2) {
            for (let x = 6; x < 14; x += 2) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Arms (armored)
        ctx.fillStyle = '#777';
        ctx.fillRect(3, 9, 2, 8);
        ctx.fillRect(15, 9, 2, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(3, 17, 2, 2);
        ctx.fillRect(15, 17, 2, 2);

        // Legs
        ctx.fillStyle = '#666';
        ctx.fillRect(6, 18, 3, 8);
        ctx.fillRect(11, 18, 3, 8);

        // Boots
        ctx.fillStyle = '#555';
        ctx.fillRect(5, 26, 4, 3);
        ctx.fillRect(11, 26, 4, 3);

        // Spear
        ctx.fillStyle = '#5c3d1e';
        ctx.fillRect(18, 0, 2, 28);
        ctx.fillStyle = '#999';
        ctx.fillRect(17, 0, 4, 5);
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
                ctx.fillStyle = this.PAL.treeTrunk;
                ctx.fillRect(4, 14, 24, 6);
                ctx.fillStyle = this.PAL.woodLight;
                ctx.fillRect(4, 20, 24, 6);
                ctx.fillStyle = '#7a5e3e';
                ctx.fillRect(4, 14, 24, 2);
            },
            coins: () => {
                ctx.fillStyle = '#ccaa00';
                ctx.beginPath();
                ctx.arc(16, 16, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#aa8800';
                ctx.beginPath();
                ctx.arc(16, 16, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ccaa00';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('G', 16, 20);
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
                ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath(); ctx.arc(16, 18, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff6600';
                ctx.font = 'bold 7px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SW', 16, 21);
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

        if (draw[itemId]) {
            draw[itemId]();
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(8, 8, 16, 16);
        }
        return canvas;
    },

    // Utility: darken a hex color
    darken(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
        const b = Math.max(0, (num & 0xFF) - amount);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    },
};
