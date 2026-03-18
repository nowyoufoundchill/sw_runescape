// Game Engine - Isometric rendering and game loop
const Engine = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    running: false,

    // Camera (in screen/iso space)
    camX: 0,
    camY: 0,

    // Viewport
    viewW: 512,
    viewH: 384,

    // Isometric tile dimensions
    TILE_W: 64,
    TILE_H: 32,

    // Water animation
    waterFrame: 0,
    waterTimer: 0,

    // Hover
    hoveredTileX: -1,
    hoveredTileY: -1,

    // Timer
    startTime: 0,

    // ===== ISOMETRIC TRANSFORMS =====
    tileToScreen(tx, ty) {
        return {
            x: (tx - ty) * (this.TILE_W / 2),
            y: (tx + ty) * (this.TILE_H / 2),
        };
    },

    screenToTile(sx, sy) {
        // Inverse isometric transform
        const tw = this.TILE_W / 2;
        const th = this.TILE_H / 2;
        return {
            x: Math.floor((sx / tw + sy / th) / 2),
            y: Math.floor((sy / th - sx / tw) / 2),
        };
    },

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.viewW = this.canvas.width;
        this.viewH = this.canvas.height;

        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        this.setupLogin();
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
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';

        Assets.init();
        World.init();
        Player.init(name);
        NPC.init();
        Quest.init();
        UI.init();

        document.getElementById('player-name-display').textContent = name;
        this.startTime = Date.now();
        this.centerCamera();

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

        // Timer display
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        document.getElementById('timer-display').textContent =
            `${mins}:${secs.toString().padStart(2, '0')}`;

        // Water animation
        this.waterTimer += dt;
        if (this.waterTimer > 500) {
            this.waterTimer = 0;
            this.waterFrame = (this.waterFrame + 1) % 3;
        }

        // Periodic minimap
        if (Math.random() < 0.03 && UI.activePanel === 'map') {
            UI.drawMinimap();
        }
    },

    centerCamera() {
        const ps = this.tileToScreen(Player.x, Player.y);
        this.camX = ps.x - this.viewW / 2;
        this.camY = ps.y - this.viewH / 2 + this.TILE_H;
    },

    // ===== RENDERING =====
    render() {
        const ctx = this.ctx;

        // Sky/background - dark muted color
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, this.viewW, this.viewH);

        // Determine visible tile range
        // In isometric view, we need to scan a diamond-shaped range
        const margin = 4;
        const centerTile = this.screenToTile(
            this.camX + this.viewW / 2,
            this.camY + this.viewH / 2
        );
        const rangeX = Math.ceil(this.viewW / this.TILE_W) + margin;
        const rangeY = Math.ceil(this.viewH / this.TILE_H) + margin;

        // Draw ground tiles (painter's algorithm: back to front)
        for (let ty = centerTile.y - rangeY; ty <= centerTile.y + rangeY; ty++) {
            for (let tx = centerTile.x - rangeX; tx <= centerTile.x + rangeX; tx++) {
                const sp = this.tileToScreen(tx, ty);
                const screenX = sp.x - this.camX;
                const screenY = sp.y - this.camY;

                // Cull off-screen tiles
                if (screenX < -this.TILE_W || screenX > this.viewW + this.TILE_W ||
                    screenY < -this.TILE_H || screenY > this.viewH + this.TILE_H) continue;

                const tile = World.getTile(tx, ty);
                const tileName = World.TILE_NAMES[tile] || 'grass';
                const texture = Assets.textures[tileName];

                if (texture) {
                    // Draw diamond tile centered at (screenX, screenY)
                    ctx.drawImage(texture,
                        screenX - this.TILE_W / 2,
                        screenY - this.TILE_H / 2,
                        this.TILE_W, this.TILE_H
                    );
                }

                // Animated water shimmer
                if (tile === World.TILES.WATER) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY - this.TILE_H / 2);
                    ctx.lineTo(screenX + this.TILE_W / 2, screenY);
                    ctx.lineTo(screenX, screenY + this.TILE_H / 2);
                    ctx.lineTo(screenX - this.TILE_W / 2, screenY);
                    ctx.closePath();
                    ctx.clip();
                    ctx.fillStyle = `rgba(50,80,180,${0.08 + this.waterFrame * 0.04})`;
                    ctx.fillRect(screenX - this.TILE_W / 2, screenY - this.TILE_H / 2,
                        this.TILE_W, this.TILE_H);
                    ctx.restore();
                }

                // Lava pulse
                if (tile === World.TILES.LAVA) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY - this.TILE_H / 2);
                    ctx.lineTo(screenX + this.TILE_W / 2, screenY);
                    ctx.lineTo(screenX, screenY + this.TILE_H / 2);
                    ctx.lineTo(screenX - this.TILE_W / 2, screenY);
                    ctx.closePath();
                    ctx.clip();
                    ctx.fillStyle = `rgba(200,80,0,${0.12 + Math.sin(Date.now() / 300) * 0.08})`;
                    ctx.fillRect(screenX - this.TILE_W / 2, screenY - this.TILE_H / 2,
                        this.TILE_W, this.TILE_H);
                    ctx.restore();
                }

                // Hover highlight
                if (tx === this.hoveredTileX && ty === this.hoveredTileY) {
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY - this.TILE_H / 2 + 1);
                    ctx.lineTo(screenX + this.TILE_W / 2 - 1, screenY);
                    ctx.lineTo(screenX, screenY + this.TILE_H / 2 - 1);
                    ctx.lineTo(screenX - this.TILE_W / 2 + 1, screenY);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }

        // Collect all renderables for depth sorting
        const renderables = [];

        // Objects
        World.objects.forEach(obj => {
            const sp = this.tileToScreen(obj.x, obj.y);
            const sx = sp.x - this.camX;
            const sy = sp.y - this.camY;
            if (sx > -120 && sx < this.viewW + 120 && sy > -120 && sy < this.viewH + 120) {
                renderables.push({
                    type: 'object',
                    obj,
                    screenX: sx,
                    screenY: sy,
                    depth: obj.x + obj.y + (obj.h || 0) * 0.1,
                });
            }
        });

        // NPCs
        NPC.list.forEach(npc => {
            const sp = this.tileToScreen(npc.x, npc.y);
            const sx = sp.x - this.camX;
            const sy = sp.y - this.camY;
            if (sx > -60 && sx < this.viewW + 60 && sy > -60 && sy < this.viewH + 60) {
                renderables.push({
                    type: 'npc',
                    npc,
                    screenX: sx,
                    screenY: sy,
                    depth: npc.x + npc.y,
                });
            }
        });

        // Player
        const ps = this.tileToScreen(Player.x, Player.y);
        renderables.push({
            type: 'player',
            screenX: ps.x - this.camX,
            screenY: ps.y - this.camY,
            depth: Player.x + Player.y,
        });

        // Sort by depth (back to front)
        renderables.sort((a, b) => a.depth - b.depth);

        // Render all
        renderables.forEach(r => {
            switch (r.type) {
                case 'object': this.renderObject(r.obj, r.screenX, r.screenY); break;
                case 'npc': this.renderNPC(r.npc, r.screenX, r.screenY); break;
                case 'player': this.renderPlayer(r.screenX, r.screenY); break;
            }
        });

        // Path preview
        if (Player.path && Player.pathIndex < Player.path.length) {
            ctx.fillStyle = 'rgba(255,255,0,0.12)';
            for (let i = Player.pathIndex; i < Player.path.length; i++) {
                const p = Player.path[i];
                const sp = this.tileToScreen(p.x, p.y);
                const sx = sp.x - this.camX;
                const sy = sp.y - this.camY;
                ctx.beginPath();
                ctx.moveTo(sx, sy - this.TILE_H / 2);
                ctx.lineTo(sx + this.TILE_W / 2, sy);
                ctx.lineTo(sx, sy + this.TILE_H / 2);
                ctx.lineTo(sx - this.TILE_W / 2, sy);
                ctx.closePath();
                ctx.fill();
            }
        }

        this.renderHUD();
    },

    renderObject(obj, sx, sy) {
        const ctx = this.ctx;
        const sprite = Assets.sprites[obj.type];
        if (!sprite) return;

        if (obj.isBuilding) {
            // Buildings are larger, offset upward
            const bw = sprite.width;
            const bh = sprite.height;
            ctx.drawImage(sprite, sx - bw / 2, sy - bh + 16, bw, bh);
            // Label
            if (obj.name) {
                ctx.fillStyle = '#000';
                ctx.font = 'bold 9px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(obj.name, sx + 1, sy - bh + 13);
                ctx.fillStyle = '#ffff00';
                ctx.fillText(obj.name, sx, sy - bh + 12);
            }
        } else {
            // Regular objects (trees, rocks, bushes, etc.)
            const w = sprite.width;
            const h = sprite.height;
            ctx.drawImage(sprite, sx - w / 2, sy - h + 8, w, h);
        }
    },

    renderNPC(npc, sx, sy) {
        const ctx = this.ctx;
        const sprite = npc.sprite;
        if (!sprite) return;

        // Walking bob
        const bob = npc.wander ? Math.sin(Date.now() / 300 + npc.x * 7) * 1 : 0;
        const w = sprite.width * 1.4;
        const h = sprite.height * 1.4;

        ctx.drawImage(sprite, sx - w / 2, sy - h + 4 + bob, w, h);

        // Name label (shadow + text)
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(npc.name, sx + 1, sy - h + 1);
        ctx.fillStyle = npc.hostile ? '#ff4444' : '#ffff00';
        ctx.fillText(npc.name, sx, sy - h);

        // Combat level for hostiles
        if (npc.hostile) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '8px "Courier New", monospace';
            ctx.fillText('(Lvl 3)', sx, sy - h - 8);
        }
    },

    renderPlayer(sx, sy) {
        const ctx = this.ctx;
        const sprite = Player.isMoving() ? Player.spriteWalking : Player.sprite;
        if (!sprite) return;

        const bob = Player.isMoving() ? Math.sin(Date.now() / 100) * 2 : 0;
        const w = sprite.width * 1.5;
        const h = sprite.height * 1.5;

        ctx.drawImage(sprite, sx - w / 2, sy - h + 4 + bob, w, h);

        // Player name (green, with shadow)
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(Player.name, sx + 1, sy - h - 1);
        ctx.fillStyle = '#00ff00';
        ctx.fillText(Player.name, sx, sy - h - 2);
    },

    renderHUD() {
        const ctx = this.ctx;

        // Region banner
        const region = World.getRegionAt(Player.x, Player.y);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.viewW, 16);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(region, this.viewW / 2, 12);

        // Coordinates
        ctx.fillStyle = '#888';
        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Tile: ${Player.x}, ${Player.y}`, 4, this.viewH - 4);

        // Action hint on hover
        if (this.hoveredTileX >= 0) {
            const npc = NPC.getNPCAt(this.hoveredTileX, this.hoveredTileY);
            if (npc) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, this.viewH - 18, this.viewW, 18);
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`Talk to ${npc.name}`, this.viewW / 2, this.viewH - 5);
            }
        }
    },

    // ===== INPUT HANDLING =====
    onClick(e) {
        if (NPC.activeDialogue) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        // Convert screen coords to world iso coords, then to tile coords
        const worldX = mouseX + this.camX;
        const worldY = mouseY + this.camY;
        const tile = this.screenToTile(worldX, worldY);

        // Check NPC click
        const npc = NPC.getNPCAt(tile.x, tile.y);
        if (npc) {
            this.walkToNPCAndInteract(npc);
            return;
        }

        // Walk to tile
        Player.clickTile(tile.x, tile.y);
    },

    walkToNPCAndInteract(npc) {
        const adjTiles = [
            { x: npc.x, y: npc.y + 1 },
            { x: npc.x, y: npc.y - 1 },
            { x: npc.x - 1, y: npc.y },
            { x: npc.x + 1, y: npc.y },
        ];

        if (Math.abs(Player.x - npc.x) <= 1 && Math.abs(Player.y - npc.y) <= 1) {
            NPC.interact(npc);
            return;
        }

        let target = null;
        let bestDist = Infinity;
        for (const t of adjTiles) {
            if (World.isWalkable(t.x, t.y)) {
                const dist = Math.abs(t.x - Player.x) + Math.abs(t.y - Player.y);
                if (dist < bestDist) { bestDist = dist; target = t; }
            }
        }

        if (target) {
            const path = World.findPath(Player.x, Player.y, target.x, target.y);
            if (path) {
                Player.path = path;
                Player.pathIndex = 0;
                Player.moveTimer = 0;
                const check = setInterval(() => {
                    if (!Player.isMoving()) {
                        clearInterval(check);
                        if (Math.abs(Player.x - npc.x) <= 1 && Math.abs(Player.y - npc.y) <= 1) {
                            NPC.interact(npc);
                        }
                    }
                }, 100);
            }
        }
    },

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const worldX = mouseX + this.camX;
        const worldY = mouseY + this.camY;
        const tile = this.screenToTile(worldX, worldY);
        this.hoveredTileX = tile.x;
        this.hoveredTileY = tile.y;

        const npc = NPC.getNPCAt(tile.x, tile.y);
        this.canvas.style.cursor = npc ? 'pointer' : 'crosshair';
    },

    onKeyDown(e) {
        if (NPC.activeDialogue) {
            if (e.key === 'Escape') NPC.closeDialogue();
            return;
        }

        let dx = 0, dy = 0;
        switch (e.key) {
            case 'w': case 'ArrowUp':    dy = -1; break;
            case 's': case 'ArrowDown':  dy = 1; break;
            case 'a': case 'ArrowLeft':  dx = -1; break;
            case 'd': case 'ArrowRight': dx = 1; break;
            case 'Escape': Player.path = null; break;
            default: return;
        }

        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            const nx = Player.x + dx;
            const ny = Player.y + dy;
            if (World.isWalkable(nx, ny)) {
                Player.path = [{ x: nx, y: ny }];
                Player.pathIndex = 0;
                Player.moveTimer = 0;
            }
        }
    },
};

// Boot
window.addEventListener('DOMContentLoaded', () => {
    Engine.init();
});
