// Game Engine - RSC Visual Fidelity v3 (2:1 squashed isometric)
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

    // === PHASE 0: Correct RSC-style projection ===
    // Tile diamonds are 64px wide x 16px tall (4:1 ratio)
    TILE_W: 64,
    TILE_H: 16,

    // Water animation (2 frames, 800ms per frame — Phase 2)
    waterFrame: 0,
    waterTimer: 0,

    // Hover
    hoveredTileX: -1,
    hoveredTileY: -1,

    // Timer
    startTime: 0,

    // Right-click context menu
    contextMenu: null,
    contextMenuNPC: null,
    contextMenuVisible: false,

    // ===== ISOMETRIC TRANSFORMS (Phase 0) =====
    tileToScreen(tx, ty) {
        return {
            x: (tx - ty) * (this.TILE_W / 2),  // * 32
            y: (tx + ty) * (this.TILE_H / 2),  // * 8
        };
    },

    screenToTile(sx, sy) {
        const tw = this.TILE_W / 2; // 32
        const th = this.TILE_H / 2; // 8
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
        this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('click', (e) => {
            // Hide context menu when clicking elsewhere
            if (this.contextMenuVisible && e.target !== this.contextMenu &&
                !this.contextMenu?.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        this.buildContextMenu();
        this.setupLogin();
    },

    buildContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText = `
            display:none; position:fixed; z-index:100;
            background:#000; border:1px solid #ffff00;
            font-family:'Press Start 2P',monospace; font-size:8px;
            min-width:120px; cursor:pointer;
        `;
        document.body.appendChild(menu);
        this.contextMenu = menu;
    },

    showContextMenu(screenX, screenY, npc) {
        const menu = this.contextMenu;
        this.contextMenuNPC = npc;
        this.contextMenuVisible = true;

        menu.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'color:#ffffff; padding:4px 8px; border-bottom:1px solid #444; font-size:8px;';
        header.textContent = 'Choose option';
        menu.appendChild(header);

        // Options
        const options = npc
            ? [
                { label: `Talk-to ${npc.name}`, color: '#ffff00', action: () => { Engine.walkToNPCAndInteract(npc); this.hideContextMenu(); } },
                { label: `Examine ${npc.name}`, color: '#ffff00', action: () => { UI.addChatMessage(`You see ${npc.name}.`, 'system'); this.hideContextMenu(); } },
                { label: 'Cancel', color: '#ff4444', action: () => this.hideContextMenu() },
              ]
            : [
                { label: 'Walk here', color: '#ffff00', action: () => this.hideContextMenu() },
                { label: 'Cancel', color: '#ff4444', action: () => this.hideContextMenu() },
              ];

        for (const opt of options) {
            const el = document.createElement('div');
            el.style.cssText = `color:${opt.color}; padding:4px 8px; font-size:8px;`;
            el.textContent = opt.label;
            el.addEventListener('mouseenter', () => el.style.background = '#1a1a00');
            el.addEventListener('mouseleave', () => el.style.background = '');
            el.addEventListener('click', opt.action);
            menu.appendChild(el);
        }

        menu.style.display = 'block';
        menu.style.left = screenX + 'px';
        menu.style.top  = screenY + 'px';
    },

    hideContextMenu() {
        if (this.contextMenu) this.contextMenu.style.display = 'none';
        this.contextMenuVisible = false;
        this.contextMenuNPC = null;
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

        // Water animation: 2 frames @ 800ms (Phase 2)
        this.waterTimer += dt;
        if (this.waterTimer > 800) {
            this.waterTimer = 0;
            this.waterFrame = (this.waterFrame + 1) % 2;
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

        // Dark background
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, this.viewW, this.viewH);

        // Camera-relative visible tile range
        // Phase 0: show max 13 tiles in any direction from player
        const margin = 2;
        const centerTile = this.screenToTile(
            this.camX + this.viewW / 2,
            this.camY + this.viewH / 2
        );
        const rangeX = Math.min(13, Math.ceil(this.viewW / this.TILE_W) + margin);
        const rangeY = Math.min(13, Math.ceil(this.viewH / this.TILE_H) + margin);

        // Draw ground tiles (painter's algorithm: back to front)
        for (let ty = centerTile.y - rangeY; ty <= centerTile.y + rangeY; ty++) {
            for (let tx = centerTile.x - rangeX; tx <= centerTile.x + rangeX; tx++) {
                const sp = this.tileToScreen(tx, ty);
                const screenX = sp.x - this.camX;
                const screenY = sp.y - this.camY;

                // Cull off-screen tiles
                if (screenX < -this.TILE_W || screenX > this.viewW + this.TILE_W ||
                    screenY < -this.TILE_H * 3 || screenY > this.viewH + this.TILE_H * 3) continue;

                const tile = World.getTile(tx, ty);
                let tileName = World.TILE_NAMES[tile] || 'grass';

                // Phase 2: 2-frame water animation
                if (tile === World.TILES.WATER) {
                    tileName = this.waterFrame === 0 ? 'water' : 'water2';
                }

                const texture = Assets.textures[tileName];
                if (texture) {
                    ctx.drawImage(texture,
                        screenX - this.TILE_W / 2,
                        screenY - this.TILE_H / 2,
                        this.TILE_W, this.TILE_H
                    );
                }

                // Hover highlight (yellow diamond outline)
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
            if (sx > -200 && sx < this.viewW + 200 && sy > -200 && sy < this.viewH + 200) {
                renderables.push({
                    type: 'object',
                    obj,
                    screenX: sx,
                    screenY: sy,
                    depth: obj.x + obj.y + (obj.isBuilding ? 0.5 : 0),
                });
            }
        });

        // NPCs
        NPC.list.forEach(npc => {
            const sp = this.tileToScreen(npc.x, npc.y);
            const sx = sp.x - this.camX;
            const sy = sp.y - this.camY;
            if (sx > -80 && sx < this.viewW + 80 && sy > -80 && sy < this.viewH + 80) {
                renderables.push({
                    type: 'npc',
                    npc,
                    screenX: sx,
                    screenY: sy,
                    depth: npc.x + npc.y + 0.1,
                });
            }
        });

        // Player
        const ps = this.tileToScreen(Player.x, Player.y);
        renderables.push({
            type: 'player',
            screenX: ps.x - this.camX,
            screenY: ps.y - this.camY,
            depth: Player.x + Player.y + 0.1,
        });

        // Sort by depth (back to front)
        renderables.sort((a, b) => a.depth - b.depth);

        // Render all
        renderables.forEach(r => {
            switch (r.type) {
                case 'object': this.renderObject(r.obj, r.screenX, r.screenY); break;
                case 'npc':    this.renderNPC(r.npc, r.screenX, r.screenY); break;
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
            // Phase 4: Building is 192x80 sprite, rendered at sx-96, sy-32
            ctx.drawImage(sprite, sx - 96, sy - 32, 192, 80);

            // Building name label (above roof, yellow pixel font)
            if (obj.name) {
                ctx.font = 'bold 8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                ctx.fillText(obj.name, sx + 1, sy - 38);
                ctx.fillStyle = '#ffff00';
                ctx.fillText(obj.name, sx, sy - 39);
            }
        } else {
            // Regular objects (trees, rocks, bushes, barrels, etc.)
            const w = sprite.width;
            const h = sprite.height;
            ctx.drawImage(sprite, sx - w / 2, sy - h + this.TILE_H / 2, w, h);
        }
    },

    renderNPC(npc, sx, sy) {
        const ctx = this.ctx;
        // Walking animation for wandering NPCs (2-frame alternation)
        const walkCycle = Math.floor(Date.now() / 200) % 2;
        const sprite = (npc.wander && walkCycle === 1 && npc.spriteWalk) ? npc.spriteWalk : npc.sprite;
        if (!sprite) return;

        // Walking bob
        const bob = npc.wander ? Math.sin(Date.now() / 280 + npc.x * 7) * 1.5 : 0;

        // Phase 5: Shadow ellipse beneath feet (draw before character)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Character sprite (24x36 — 32 body + 4 shadow row in sprite)
        const w = sprite.width;
        const h = sprite.height;
        ctx.drawImage(sprite, sx - w / 2, sy - h + this.TILE_H + bob, w, h);

        // Phase 1: Name label 4px above head — yellow, Press Start 2P 8px
        const labelY = sy - h + this.TILE_H + bob - 4;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(npc.name, sx + 1, labelY + 1);
        ctx.fillStyle = npc.hostile ? '#ff4444' : '#ffff00';
        ctx.fillText(npc.name, sx, labelY);

        // Combat level for hostiles
        if (npc.hostile) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText('Lvl 3', sx, labelY - 10);
        }
    },

    renderPlayer(sx, sy) {
        const ctx = this.ctx;

        // Walking animation: use animFrame to pick walk sprite
        let sprite;
        if (Player.isMoving()) {
            sprite = (Player.animFrame % 2 === 0) ? Player.spriteWalk1 : Player.spriteWalk2;
        } else {
            sprite = Player.sprite;
        }
        if (!sprite) return;

        const bob = Player.isMoving() ? Math.sin(Date.now() / 100) * 1.5 : 0;
        const w = sprite.width;
        const h = sprite.height;

        // Phase 5: Shadow ellipse beneath feet
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(sprite, sx - w / 2, sy - h + this.TILE_H + bob, w, h);

        // Player name (green with shadow, Press Start 2P)
        const labelY = sy - h + this.TILE_H + bob - 4;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(Player.name, sx + 1, labelY + 1);
        ctx.fillStyle = '#00ff00';
        ctx.fillText(Player.name, sx, labelY);
    },

    renderHUD() {
        const ctx = this.ctx;

        // Region banner
        const region = World.getRegionAt(Player.x, Player.y);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.viewW, 16);
        ctx.fillStyle = '#ff6600';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(region, this.viewW / 2, 11);

        // Tile coordinates (bottom-left)
        ctx.fillStyle = '#666';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${Player.x},${Player.y}`, 4, this.viewH - 4);

        // Action hint on hover (NPC)
        if (this.hoveredTileX >= 0) {
            const npc = NPC.getNPCAt(this.hoveredTileX, this.hoveredTileY);
            if (npc) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(0, this.viewH - 18, this.viewW, 18);
                ctx.fillStyle = '#ffff00';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`Talk to ${npc.name}`, this.viewW / 2, this.viewH - 5);
            }
        }
    },

    // ===== INPUT HANDLING =====
    onClick(e) {
        if (NPC.activeDialogue) return;
        this.hideContextMenu();

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const worldX = mouseX + this.camX;
        const worldY = mouseY + this.camY;
        const tile = this.screenToTile(worldX, worldY);

        const npc = NPC.getNPCAt(tile.x, tile.y);
        if (npc) {
            this.walkToNPCAndInteract(npc);
            return;
        }

        Player.clickTile(tile.x, tile.y);
    },

    onRightClick(e) {
        e.preventDefault();
        if (NPC.activeDialogue) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const worldX = mouseX + this.camX;
        const worldY = mouseY + this.camY;
        const tile = this.screenToTile(worldX, worldY);
        const npc = NPC.getNPCAt(tile.x, tile.y);

        this.showContextMenu(e.clientX, e.clientY, npc);
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
            case 'Escape': Player.path = null; this.hideContextMenu(); break;
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
