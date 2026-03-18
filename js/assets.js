// Asset Manager - handles loading sprites and textures
const Assets = {
    loaded: false,
    textures: {},
    sprites: {},

    // RSC-authentic color palette
    palette: {
        grass1: '#2d5a1e',
        grass2: '#3a6b2a',
        grass3: '#1e4a12',
        dirt1: '#7a6030',
        dirt2: '#8a7040',
        sand1: '#c4a854',
        sand2: '#b49844',
        water1: '#1a3a6a',
        water2: '#2a4a7a',
        water3: '#0a2a5a',
        stone1: '#666666',
        stone2: '#777777',
        path1: '#8a7a5a',
        path2: '#7a6a4a',
        wood1: '#6a4a2a',
        wood2: '#5a3a1a',
        lava1: '#cc3300',
        lava2: '#ff4400',
        wall1: '#555555',
        wall2: '#666666',
        roof1: '#994400',
        roof2: '#aa5500',
        swamp1: '#2a4a1a',
        swamp2: '#1a3a0a',
    },

    // Generate procedural ground textures (RSC-style dithered look)
    generateTileTexture(type, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const colors = {
            grass: [this.palette.grass1, this.palette.grass2, this.palette.grass3],
            dirt: [this.palette.dirt1, this.palette.dirt2, '#6a5020'],
            sand: [this.palette.sand1, this.palette.sand2, '#d4b864'],
            water: [this.palette.water1, this.palette.water2, this.palette.water3],
            stone: [this.palette.stone1, this.palette.stone2, '#585858'],
            path: [this.palette.path1, this.palette.path2, '#9a8a6a'],
            wood: [this.palette.wood1, this.palette.wood2, '#4a2a0a'],
            lava: [this.palette.lava1, this.palette.lava2, '#ff6600'],
            swamp: [this.palette.swamp1, this.palette.swamp2, '#0a2a00'],
        };

        const c = colors[type] || colors.grass;

        // Fill base color
        ctx.fillStyle = c[0];
        ctx.fillRect(0, 0, size, size);

        // RSC-style dithering - random pixels for texture
        const pixelSize = 2;
        for (let y = 0; y < size; y += pixelSize) {
            for (let x = 0; x < size; x += pixelSize) {
                if (Math.random() < 0.4) {
                    ctx.fillStyle = c[Math.floor(Math.random() * c.length)];
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            }
        }

        // Water gets animated shimmer spots
        if (type === 'water' || type === 'lava') {
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                ctx.fillStyle = type === 'water' ? 'rgba(100,150,255,0.3)' : 'rgba(255,200,0,0.3)';
                ctx.fillRect(x, y, 3, 2);
            }
        }

        return canvas;
    },

    // Generate character sprite (RSC-style blocky character)
    generateCharacterSprite(options = {}) {
        const { color = '#f00', isNPC = false, npcType = 'human', dir = 'south' } = options;
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        if (npcType === 'human' || !isNPC) {
            // Head
            ctx.fillStyle = '#dba97a'; // skin tone
            ctx.fillRect(10, 2, 12, 12);

            // Eyes
            ctx.fillStyle = '#000';
            if (dir === 'south' || dir === 'east' || dir === 'west') {
                ctx.fillRect(12, 6, 2, 2);
                ctx.fillRect(18, 6, 2, 2);
            }

            // Hair
            ctx.fillStyle = options.hairColor || '#4a2a0a';
            ctx.fillRect(10, 0, 12, 4);

            // Body
            ctx.fillStyle = color;
            ctx.fillRect(8, 14, 16, 16);

            // Arms
            ctx.fillRect(4, 14, 4, 14);
            ctx.fillRect(24, 14, 4, 14);

            // Legs
            ctx.fillStyle = '#2a2a6a';
            ctx.fillRect(10, 30, 5, 12);
            ctx.fillRect(17, 30, 5, 12);

            // Boots
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(9, 42, 6, 4);
            ctx.fillRect(17, 42, 6, 4);

            // Weapon? (if player)
            if (!isNPC && options.hasWeapon) {
                ctx.fillStyle = '#aaa';
                ctx.fillRect(26, 8, 3, 22);
                ctx.fillStyle = '#888';
                ctx.fillRect(25, 6, 5, 4);
            }

            // NPC-specific details
            if (isNPC && options.hat) {
                ctx.fillStyle = options.hat;
                ctx.fillRect(8, -2, 16, 4);
                ctx.fillRect(10, -4, 12, 3);
            }
        } else if (npcType === 'goblin') {
            // Green goblin
            ctx.fillStyle = '#2a6a2a';
            ctx.fillRect(10, 4, 12, 10);
            ctx.fillStyle = '#f00';
            ctx.fillRect(12, 8, 2, 2);
            ctx.fillRect(18, 8, 2, 2);
            ctx.fillStyle = '#4a4a00';
            ctx.fillRect(8, 14, 16, 14);
            ctx.fillRect(4, 16, 4, 10);
            ctx.fillRect(24, 16, 4, 10);
            ctx.fillRect(10, 28, 5, 10);
            ctx.fillRect(17, 28, 5, 10);
        } else if (npcType === 'guard') {
            // Guard in armor
            ctx.fillStyle = '#dba97a';
            ctx.fillRect(10, 2, 12, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(12, 6, 2, 2);
            ctx.fillRect(18, 6, 2, 2);
            // Helmet
            ctx.fillStyle = '#888';
            ctx.fillRect(8, -1, 16, 5);
            // Chainmail body
            ctx.fillStyle = '#999';
            ctx.fillRect(8, 14, 16, 16);
            ctx.fillStyle = '#777';
            for (let y = 15; y < 30; y += 3) {
                for (let x = 9; x < 24; x += 3) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
            // Legs
            ctx.fillStyle = '#666';
            ctx.fillRect(10, 30, 5, 12);
            ctx.fillRect(17, 30, 5, 12);
            // Spear
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(27, 0, 2, 40);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(26, 0, 4, 6);
        }

        return canvas;
    },

    // Generate item icon
    generateItemIcon(itemId) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const items = {
            bronze_sword: () => {
                ctx.fillStyle = '#b87333';
                ctx.fillRect(14, 2, 4, 20);
                ctx.fillRect(8, 20, 16, 3);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(12, 23, 8, 7);
            },
            bronze_shield: () => {
                ctx.fillStyle = '#b87333';
                ctx.fillRect(6, 4, 20, 24);
                ctx.fillStyle = '#cd853f';
                ctx.fillRect(8, 6, 16, 20);
                ctx.fillStyle = '#b87333';
                ctx.fillRect(14, 8, 4, 16);
                ctx.fillRect(8, 14, 16, 4);
            },
            logs: () => {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(4, 12, 24, 8);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(4, 20, 24, 8);
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(4, 12, 24, 2);
            },
            coins: () => {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(16, 16, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.arc(16, 16, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px serif';
                ctx.textAlign = 'center';
                ctx.fillText('G', 16, 20);
            },
            net_monitor: () => {
                // SolarWinds network monitor item
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(4, 4, 24, 18);
                ctx.fillStyle = '#000';
                ctx.fillRect(6, 6, 20, 14);
                ctx.fillStyle = '#0f0';
                // Network graph
                ctx.fillRect(8, 14, 3, 2);
                ctx.fillRect(11, 12, 3, 2);
                ctx.fillRect(14, 10, 3, 2);
                ctx.fillRect(17, 13, 3, 2);
                ctx.fillRect(20, 8, 3, 2);
                // Base
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(10, 22, 12, 3);
                ctx.fillRect(8, 25, 16, 2);
            },
            server_crystal: () => {
                // Glowing crystal (quest item)
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(12, 4, 8, 4);
                ctx.fillRect(10, 8, 12, 12);
                ctx.fillRect(12, 20, 8, 4);
                ctx.fillStyle = '#88ffff';
                ctx.fillRect(14, 6, 4, 2);
                ctx.fillRect(12, 10, 8, 6);
                ctx.fillStyle = 'rgba(0,255,255,0.3)';
                ctx.fillRect(8, 6, 16, 18);
            },
            orion_amulet: () => {
                // SolarWinds Orion amulet
                ctx.fillStyle = '#888';
                ctx.fillRect(14, 2, 4, 8);
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(16, 18, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(16, 18, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff6600';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('SW', 16, 21);
            },
            cooked_meat: () => {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(6, 10, 20, 14);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(8, 8, 16, 14);
                ctx.fillStyle = '#654321';
                ctx.fillRect(14, 22, 4, 6);
            },
            bread: () => {
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(4, 12, 24, 10);
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(6, 10, 20, 10);
                ctx.fillStyle = '#C4A070';
                ctx.fillRect(8, 14, 16, 4);
            },
            packet_rune: () => {
                // Network packet rune
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(8, 4, 16, 24);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(10, 6, 12, 20);
                ctx.fillStyle = '#000';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('TCP', 16, 15);
                ctx.fillText('IP', 16, 23);
            },
            firewall_shield: () => {
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(6, 4, 20, 24);
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(8, 6, 16, 20);
                ctx.fillStyle = '#ff6600';
                // Fire pattern
                ctx.fillRect(12, 8, 3, 8);
                ctx.fillRect(17, 10, 3, 6);
                ctx.fillRect(14, 6, 4, 4);
            },
            observability_gem: () => {
                // Purple gem
                ctx.fillStyle = '#8800cc';
                ctx.fillRect(10, 6, 12, 6);
                ctx.fillRect(8, 12, 16, 8);
                ctx.fillRect(10, 20, 12, 4);
                ctx.fillStyle = '#aa44ff';
                ctx.fillRect(12, 8, 8, 4);
                ctx.fillRect(10, 14, 12, 4);
                ctx.fillStyle = '#cc88ff';
                ctx.fillRect(14, 10, 4, 2);
            },
        };

        if (items[itemId]) {
            items[itemId]();
        } else {
            // Generic item
            ctx.fillStyle = '#888';
            ctx.fillRect(8, 8, 16, 16);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(10, 10, 12, 12);
        }

        return canvas;
    },

    // Generate tree sprite
    generateTree(type = 'normal') {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        if (type === 'normal') {
            // Trunk
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(20, 30, 8, 34);
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(22, 32, 4, 30);
            // Canopy
            ctx.fillStyle = '#1a5a1a';
            ctx.fillRect(4, 4, 40, 30);
            ctx.fillStyle = '#2a6a2a';
            ctx.fillRect(8, 0, 32, 28);
            ctx.fillStyle = '#3a7a3a';
            for (let i = 0; i < 8; i++) {
                const x = 6 + Math.random() * 34;
                const y = 2 + Math.random() * 26;
                ctx.fillRect(x, y, 4, 3);
            }
        } else if (type === 'dead') {
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(20, 10, 8, 54);
            ctx.fillRect(12, 20, 10, 4);
            ctx.fillRect(26, 14, 12, 4);
            ctx.fillRect(8, 30, 10, 3);
        } else if (type === 'server_rack') {
            // Server rack "tree" - SolarWinds themed
            ctx.fillStyle = '#333';
            ctx.fillRect(8, 4, 32, 56);
            ctx.fillStyle = '#444';
            ctx.fillRect(10, 6, 28, 52);
            // Blinking lights
            for (let y = 8; y < 56; y += 8) {
                ctx.fillStyle = '#222';
                ctx.fillRect(12, y, 24, 6);
                ctx.fillStyle = Math.random() > 0.3 ? '#0f0' : '#f00';
                ctx.fillRect(14, y + 2, 2, 2);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(18, y + 2, 2, 2);
            }
        }

        return canvas;
    },

    // Generate rock sprite
    generateRock(type = 'normal') {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');

        const colors = type === 'copper' ? ['#b87333', '#cd853f', '#a0632a']
            : type === 'tin' ? ['#aaa', '#ccc', '#888']
            : ['#666', '#777', '#555'];

        ctx.fillStyle = colors[0];
        ctx.fillRect(4, 6, 24, 16);
        ctx.fillRect(2, 10, 28, 10);
        ctx.fillStyle = colors[1];
        ctx.fillRect(8, 4, 16, 8);
        ctx.fillStyle = colors[2];
        ctx.fillRect(6, 14, 8, 6);
        ctx.fillRect(18, 8, 6, 4);

        return canvas;
    },

    // Generate building sprite (simple RSC-style)
    generateBuilding(type = 'house') {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');

        if (type === 'house') {
            // Walls
            ctx.fillStyle = '#aa9070';
            ctx.fillRect(8, 24, 80, 48);
            ctx.fillStyle = '#998060';
            ctx.fillRect(10, 26, 76, 44);
            // Roof
            ctx.fillStyle = '#884400';
            ctx.fillRect(0, 10, 96, 18);
            ctx.fillStyle = '#993300';
            ctx.fillRect(4, 4, 88, 12);
            // Door
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(38, 44, 20, 28);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(52, 56, 3, 3);
            // Windows
            ctx.fillStyle = '#446688';
            ctx.fillRect(16, 36, 14, 12);
            ctx.fillRect(66, 36, 14, 12);
        } else if (type === 'noc') {
            // Network Operations Center
            ctx.fillStyle = '#444';
            ctx.fillRect(4, 20, 88, 56);
            ctx.fillStyle = '#555';
            ctx.fillRect(6, 22, 84, 52);
            // Flat roof
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 16, 96, 8);
            // SolarWinds logo area
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(30, 18, 36, 5);
            // Glass front
            ctx.fillStyle = '#335577';
            ctx.fillRect(10, 30, 76, 20);
            ctx.fillStyle = '#446688';
            ctx.fillRect(12, 32, 24, 16);
            ctx.fillRect(38, 32, 24, 16);
            ctx.fillRect(64, 32, 20, 16);
            // Door
            ctx.fillStyle = '#335577';
            ctx.fillRect(40, 54, 16, 22);
            // Satellite dish
            ctx.fillStyle = '#888';
            ctx.fillRect(72, 6, 12, 10);
            ctx.fillRect(76, 4, 4, 4);
        }

        return canvas;
    },

    init() {
        // Pre-generate tile textures
        const tileTypes = ['grass', 'dirt', 'sand', 'water', 'stone', 'path', 'wood', 'lava', 'swamp'];
        tileTypes.forEach(type => {
            this.textures[type] = this.generateTileTexture(type, 32);
        });

        // Pre-generate object sprites
        this.sprites.tree = this.generateTree('normal');
        this.sprites.deadTree = this.generateTree('dead');
        this.sprites.serverRack = this.generateTree('server_rack');
        this.sprites.rock = this.generateRock('normal');
        this.sprites.copperRock = this.generateRock('copper');
        this.sprites.tinRock = this.generateRock('tin');
        this.sprites.house = this.generateBuilding('house');
        this.sprites.noc = this.generateBuilding('noc');

        // Pre-generate item icons
        const itemIds = [
            'bronze_sword', 'bronze_shield', 'logs', 'coins', 'net_monitor',
            'server_crystal', 'orion_amulet', 'cooked_meat', 'bread',
            'packet_rune', 'firewall_shield', 'observability_gem'
        ];
        itemIds.forEach(id => {
            this.sprites['item_' + id] = this.generateItemIcon(id);
        });

        this.loaded = true;
    }
};
