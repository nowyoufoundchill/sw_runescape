// Game Engine - Core rendering and game loop
const Engine = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    running: false,

    // Camera
    cameraX: 0,
    cameraY: 0,

    // Viewport
    viewW: 512,
    viewH: 384,

    // Tile rendering
    tileW: 32,
    tileH: 32,

    // Water animation
    waterFrame: 0,
    waterTimer: 0,

    // Click handling
    hoveredTileX: -1,
    hoveredTileY: -1,

    // Game start timer
    startTime: 0,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Resize canvas to fill space
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse events
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Setup login
        this.setupLogin();
    },

    resizeCanvas() {
        // Canvas fills the game area (game-container width minus right panel)
        this.viewW = this.canvas.width;
        this.viewH = this.canvas.height;
    },

    setupLogin() {
        const loginBtn = document.getElementById('login-btn');
        const nameInput = document.getElementById('username');

        const startGame = () => {
            const name = nameInput.value.trim() || 'Hero';
            this.startGame(name);
        };

        loginBtn.addEventListener('click', startGame);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startGame();
        });

        nameInput.focus();
    },

    startGame(name) {
        // Hide login, show game
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';

        // Initialize all systems
        Assets.init();
        World.init();
        Player.init(name);
        NPC.init();
        Quest.init();
        UI.init();

        document.getElementById('player-name-display').textContent = name;
        this.startTime = Date.now();

        // Center camera on player
        this.centerCamera();

        // Start game loop
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    gameLoop(timestamp) {
        if (!this.running) return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(dt) {
        Player.update(dt);
        NPC.update(dt);
        this.centerCamera();
        UI.updateRegion();

        // Update timer display
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        document.getElementById('timer-display').textContent =
            `${mins}:${secs.toString().padStart(2, '0')}`;

        // Water animation
        this.waterTimer += dt;
        if (this.waterTimer > 400) {
            this.waterTimer = 0;
            this.waterFrame = (this.waterFrame + 1) % 3;
        }

        // Minimap update (every few frames)
        if (Math.random() < 0.05 && UI.activePanel === 'map') {
            UI.drawMinimap();
        }
    },

    centerCamera() {
        this.cameraX = Player.x * this.tileW - this.viewW / 2 + this.tileW / 2;
        this.cameraY = Player.y * this.tileH - this.viewH / 2 + this.tileH / 2;
    },

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.viewW, this.viewH);

        const startTileX = Math.floor(this.cameraX / this.tileW) - 1;
        const startTileY = Math.floor(this.cameraY / this.tileH) - 1;
        const endTileX = startTileX + Math.ceil(this.viewW / this.tileW) + 2;
        const endTileY = startTileY + Math.ceil(this.viewH / this.tileH) + 2;

        // Draw ground tiles
        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                const screenX = x * this.tileW - this.cameraX;
                const screenY = y * this.tileH - this.cameraY;

                const tile = World.getTile(x, y);
                const tileName = World.TILE_NAMES[tile] || 'grass';
                const texture = Assets.textures[tileName];

                if (texture) {
                    ctx.drawImage(texture, screenX, screenY, this.tileW, this.tileH);
                }

                // Animated water shimmer
                if (tile === World.TILES.WATER) {
                    ctx.fillStyle = `rgba(100,150,255,${0.1 + this.waterFrame * 0.05})`;
                    ctx.fillRect(screenX, screenY, this.tileW, this.tileH);
                }

                // Lava glow
                if (tile === World.TILES.LAVA) {
                    ctx.fillStyle = `rgba(255,100,0,${0.15 + Math.sin(Date.now() / 200) * 0.1})`;
                    ctx.fillRect(screenX, screenY, this.tileW, this.tileH);
                }

                // Hovered tile highlight
                if (x === this.hoveredTileX && y === this.hoveredTileY) {
                    ctx.strokeStyle = '#ff0';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX + 0.5, screenY + 0.5, this.tileW - 1, this.tileH - 1);
                }
            }
        }

        // Collect all renderables and sort by Y for depth
        const renderables = [];

        // Objects
        World.objects.forEach(obj => {
            const screenX = obj.x * this.tileW - this.cameraX;
            const screenY = obj.y * this.tileH - this.cameraY;

            if (screenX > -100 && screenX < this.viewW + 100 &&
                screenY > -100 && screenY < this.viewH + 100) {
                renderables.push({
                    type: 'object',
                    obj,
                    x: screenX,
                    y: screenY,
                    sortY: obj.y + (obj.h || 1),
                });
            }
        });

        // NPCs
        NPC.list.forEach(npc => {
            const screenX = npc.x * this.tileW - this.cameraX;
            const screenY = npc.y * this.tileH - this.cameraY;

            if (screenX > -50 && screenX < this.viewW + 50 &&
                screenY > -50 && screenY < this.viewH + 50) {
                renderables.push({
                    type: 'npc',
                    npc,
                    x: screenX,
                    y: screenY,
                    sortY: npc.y,
                });
            }
        });

        // Player
        const playerScreenX = Player.x * this.tileW - this.cameraX;
        const playerScreenY = Player.y * this.tileH - this.cameraY;
        renderables.push({
            type: 'player',
            x: playerScreenX,
            y: playerScreenY,
            sortY: Player.y,
        });

        // Sort by Y
        renderables.sort((a, b) => a.sortY - b.sortY);

        // Render all
        renderables.forEach(r => {
            switch (r.type) {
                case 'object': this.renderObject(r.obj, r.x, r.y); break;
                case 'npc': this.renderNPC(r.npc, r.x, r.y); break;
                case 'player': this.renderPlayer(r.x, r.y); break;
            }
        });

        // Draw path preview
        if (Player.path && Player.pathIndex < Player.path.length) {
            ctx.fillStyle = 'rgba(255,255,0,0.15)';
            for (let i = Player.pathIndex; i < Player.path.length; i++) {
                const p = Player.path[i];
                const sx = p.x * this.tileW - this.cameraX;
                const sy = p.y * this.tileH - this.cameraY;
                ctx.fillRect(sx, sy, this.tileW, this.tileH);
            }
        }

        // Right-click menu context hint
        this.renderHUD();
    },

    renderObject(obj, screenX, screenY) {
        const ctx = this.ctx;

        if (obj.isBuilding) {
            const sprite = Assets.sprites[obj.type];
            if (sprite) {
                ctx.drawImage(sprite,
                    screenX - 16,
                    screenY - sprite.height + (obj.h || 3) * this.tileH,
                    sprite.width, sprite.height
                );
            }
            // Building name
            if (obj.name) {
                ctx.fillStyle = '#ff0';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(obj.name, screenX + (obj.w || 3) * this.tileW / 2, screenY - 4);
            }
        } else {
            const sprite = Assets.sprites[obj.type];
            if (sprite) {
                ctx.drawImage(sprite,
                    screenX + (this.tileW - sprite.width) / 2,
                    screenY + this.tileH - sprite.height,
                    sprite.width, sprite.height
                );
            }
        }
    },

    renderNPC(npc, screenX, screenY) {
        const ctx = this.ctx;

        if (npc.sprite) {
            ctx.drawImage(npc.sprite,
                screenX + (this.tileW - 32) / 2,
                screenY + this.tileH - 48,
                32, 48
            );
        }

        // Name above head
        ctx.fillStyle = npc.hostile ? '#f44' : '#ff0';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX + this.tileW / 2, screenY - 4);

        // Level indicator for hostile NPCs
        if (npc.hostile) {
            ctx.fillStyle = '#f00';
            ctx.font = '8px monospace';
            ctx.fillText('(Level 3)', screenX + this.tileW / 2, screenY + this.tileH - 50);
        }
    },

    renderPlayer(screenX, screenY) {
        const ctx = this.ctx;

        const sprite = Player.isMoving() ? Player.spriteWalking : Player.sprite;
        if (sprite) {
            // Walking animation: slight bob
            const bobY = Player.isMoving() ? Math.sin(Date.now() / 100) * 2 : 0;
            ctx.drawImage(sprite,
                screenX + (this.tileW - 32) / 2,
                screenY + this.tileH - 48 + bobY,
                32, 48
            );
        }

        // Player name
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Player.name, screenX + this.tileW / 2, screenY - 4);
    },

    renderHUD() {
        const ctx = this.ctx;

        // Region name
        const region = World.getRegionAt(Player.x, Player.y);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.viewW, 16);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(region, this.viewW / 2, 12);

        // Coordinates
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Tile: ${Player.x}, ${Player.y}`, 4, this.viewH - 4);

        // Action hint
        if (this.hoveredTileX >= 0) {
            const npc = NPC.getNPCAt(this.hoveredTileX, this.hoveredTileY);
            if (npc) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, this.viewH - 20, this.viewW, 20);
                ctx.fillStyle = '#ff0';
                ctx.textAlign = 'center';
                ctx.fillText(`Talk to ${npc.name}`, this.viewW / 2, this.viewH - 6);
            }
        }
    },

    // Input handling
    onClick(e) {
        if (NPC.activeDialogue) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const tileX = Math.floor((mouseX + this.cameraX) / this.tileW);
        const tileY = Math.floor((mouseY + this.cameraY) / this.tileH);

        // Check if clicked on an NPC
        const npc = NPC.getNPCAt(tileX, tileY);
        if (npc) {
            // Walk to NPC first, then interact
            const adjTiles = [
                { x: npc.x, y: npc.y + 1 },
                { x: npc.x, y: npc.y - 1 },
                { x: npc.x - 1, y: npc.y },
                { x: npc.x + 1, y: npc.y },
            ];

            // Find walkable adjacent tile
            let target = null;
            let bestDist = Infinity;
            for (const t of adjTiles) {
                if (World.isWalkable(t.x, t.y)) {
                    const dist = Math.abs(t.x - Player.x) + Math.abs(t.y - Player.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        target = t;
                    }
                }
            }

            if (target) {
                if (Math.abs(Player.x - npc.x) <= 1 && Math.abs(Player.y - npc.y) <= 1) {
                    // Already adjacent
                    NPC.interact(npc);
                } else {
                    // Walk there first
                    const path = World.findPath(Player.x, Player.y, target.x, target.y);
                    if (path) {
                        Player.path = path;
                        Player.pathIndex = 0;
                        Player.moveTimer = 0;
                        // Set up callback to interact when arrived
                        const checkArrival = setInterval(() => {
                            if (!Player.isMoving()) {
                                clearInterval(checkArrival);
                                if (Math.abs(Player.x - npc.x) <= 1 && Math.abs(Player.y - npc.y) <= 1) {
                                    NPC.interact(npc);
                                }
                            }
                        }, 100);
                    }
                }
            }
            return;
        }

        // Regular tile click - move there
        Player.clickTile(tileX, tileY);
    },

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        this.hoveredTileX = Math.floor((mouseX + this.cameraX) / this.tileW);
        this.hoveredTileY = Math.floor((mouseY + this.cameraY) / this.tileH);

        // Update cursor based on what's hovered
        const npc = NPC.getNPCAt(this.hoveredTileX, this.hoveredTileY);
        this.canvas.style.cursor = npc ? 'pointer' : 'crosshair';
    },

    onKeyDown(e) {
        if (NPC.activeDialogue) {
            if (e.key === 'Escape') {
                NPC.closeDialogue();
            }
            return;
        }

        // WASD / Arrow key movement
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'w': case 'ArrowUp': dy = -1; break;
            case 's': case 'ArrowDown': dy = 1; break;
            case 'a': case 'ArrowLeft': dx = -1; break;
            case 'd': case 'ArrowRight': dx = 1; break;
            case 'Escape': Player.path = null; break;
            default: return;
        }

        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            const newX = Player.x + dx;
            const newY = Player.y + dy;
            if (World.isWalkable(newX, newY)) {
                Player.path = [{ x: newX, y: newY }];
                Player.pathIndex = 0;
                Player.moveTimer = 0;
            }
        }
    },
};

// Start engine on load
window.addEventListener('DOMContentLoaded', () => {
    Engine.init();
});
