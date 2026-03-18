// Game Engine — Three.js renderer
// Logic files (world.js, player.js, npc.js, quest.js, ui.js) are UNTOUCHED.
// This file replaces all 2D canvas rendering with Three.js 3D rendering.
const Engine = {
    running:  false,
    lastTime: 0,
    startTime: 0,

    // Player lerp position (smooth movement in world space)
    playerLerpX: 0,
    playerLerpZ: 0,

    // Per-NPC lerp state:  { [npc.id]: { x, z } }
    npcLerps: {},

    // Three.js character groups
    playerGroup: null,
    npcGroups:   {},  // { [npc.id]: THREE.Group }

    // Raycasting
    _raycaster:  null,
    _mouse:      new THREE.Vector2(),

    // Hover state
    hoveredTileX: -1,
    hoveredTileY:  -1,

    // Right-click context menu (DOM)
    contextMenu:        null,
    contextMenuNPC:     null,
    contextMenuVisible: false,

    // Path highlight plane meshes
    _pathHighlights: [],

    // Timer
    _timerEl: null,

    init() {
        this._buildContextMenu();
        this._setupLogin();
    },

    // ===== LOGIN =====
    _setupLogin() {
        const btn  = document.getElementById('login-btn');
        const inp  = document.getElementById('username');
        const go   = () => this.startGame(inp.value.trim() || 'Hero');
        btn.addEventListener('click', go);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        inp.focus();
    },

    startGame(name) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('game-screen').style.display  = 'flex';

        // Init game logic (unchanged)
        Assets.init();
        World.init();
        Player.init(name);
        NPC.init();
        Quest.init();
        UI.init();

        document.getElementById('player-name-display').textContent = name;
        this.startTime = Date.now();

        // ---- Three.js setup ----
        const viewport = document.getElementById('three-viewport');
        ThreeRenderer.init(viewport);

        // Build terrain
        TerrainBuilder.build(ThreeRenderer.scene);

        // Build world objects
        ObjectBuilder.buildAll(ThreeRenderer.scene, World.objects);

        // Build player character group
        this.playerGroup = CharacterBuilder.build({
            color:     '#cc2200',
            legsColor: '#2244cc',
            hairColor: '#4a2a0a',
            name:      name,
        });
        ThreeRenderer.scene.add(this.playerGroup);

        // Build NPC character groups
        for (const npc of NPC.list) {
            const group = CharacterBuilder.build({
                color:     npc.color     || '#888888',
                legsColor: npc.legsColor || null,
                hat:       npc.hat       || null,
                npcType:   npc.type      || 'human',
                name:      npc.name,
            });
            ThreeRenderer.scene.add(group);
            this.npcGroups[npc.id] = group;
            this.npcLerps[npc.id]  = { x: npc.x, z: npc.y };
        }

        // Lerp start positions
        const S = RSC.TILE_SIZE;
        this.playerLerpX = Player.x * S + S / 2;
        this.playerLerpZ = Player.y * S + S / 2;

        // Camera
        GameCamera.init(ThreeRenderer.camera, this.playerLerpX, this.playerLerpZ);

        // Raycaster
        this._raycaster = new THREE.Raycaster();

        // Event listeners on the viewport
        viewport.addEventListener('click',       e => this._onClick(e));
        viewport.addEventListener('mousemove',   e => this._onMouseMove(e));
        viewport.addEventListener('contextmenu', e => this._onRightClick(e));
        document.addEventListener('keydown',     e => this._onKeyDown(e));
        document.addEventListener('click',       e => {
            if (this.contextMenuVisible &&
                this.contextMenu && !this.contextMenu.contains(e.target)) {
                this._hideContextMenu();
            }
        });

        this._timerEl = document.getElementById('timer-display');

        this.running  = true;
        this.lastTime = performance.now();
        requestAnimationFrame(t => this._loop(t));
    },

    // ===== GAME LOOP =====
    _loop(timestamp) {
        if (!this.running) return;
        const dt = Math.min(timestamp - this.lastTime, 100); // cap dt at 100ms
        this.lastTime = timestamp;
        this._update(dt);
        this._render(dt);
        requestAnimationFrame(t => this._loop(t));
    },

    _update(dt) {
        Player.update(dt);
        NPC.update(dt);
        TerrainBuilder.update(dt);

        // Timer display
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this._timerEl.textContent =
            `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

        // Minimap
        if (Math.random() < 0.03 && UI.activePanel === 'map') {
            UI.drawMinimap();
        }

        UI.updateRegion();

        // Lerp player position toward tile target
        const S = RSC.TILE_SIZE;
        const targetX = Player.x * S + S / 2;
        const targetZ = Player.y * S + S / 2;
        this.playerLerpX += (targetX - this.playerLerpX) * RSC.LERP_SPEED;
        this.playerLerpZ += (targetZ - this.playerLerpZ) * RSC.LERP_SPEED;

        // Update player group transform — Y follows terrain height
        if (this.playerGroup) {
            const py = TerrainBuilder.getHeightAt(this.playerLerpX, this.playerLerpZ);
            this.playerGroup.position.set(this.playerLerpX, py, this.playerLerpZ);
            CharacterBuilder.updateWalk(this.playerGroup, Player.isMoving(), dt);
        }

        // Lerp and update NPC groups
        for (const npc of NPC.list) {
            const lerp = this.npcLerps[npc.id];
            if (!lerp) continue;
            const npcTX = npc.x * S + S / 2;
            const npcTZ = npc.y * S + S / 2;
            lerp.x += (npcTX - lerp.x) * RSC.LERP_SPEED;
            lerp.z += (npcTZ - lerp.z) * RSC.LERP_SPEED;

            const group = this.npcGroups[npc.id];
            if (group) {
                const ny = TerrainBuilder.getHeightAt(lerp.x, lerp.z);
                group.position.set(lerp.x, ny, lerp.z);
                CharacterBuilder.updateWalk(group, npc.wander && (Date.now() % 1200 < 600), dt);
            }
        }

        // Camera follow
        GameCamera.update(ThreeRenderer.camera, this.playerLerpX, this.playerLerpZ);

        // Update path highlights
        this._updatePathHighlights();
    },

    _render(dt) {
        ThreeRenderer.render();
    },

    // ===== PATH HIGHLIGHTS =====
    _updatePathHighlights() {
        // Remove old
        for (const m of this._pathHighlights) ThreeRenderer.scene.remove(m);
        this._pathHighlights = [];

        if (!Player.path || Player.pathIndex >= Player.path.length) return;
        const S = RSC.TILE_SIZE;
        const geo = new THREE.PlaneGeometry(S * 0.9, S * 0.9);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffff00, transparent: true, opacity: 0.18, side: THREE.DoubleSide
        });
        for (let i = Player.pathIndex; i < Player.path.length; i++) {
            const p = Player.path[i];
            const mesh = new THREE.Mesh(geo, mat);
            const tileY = TerrainBuilder.getHeightAt(p.x * S + S/2, p.y * S + S/2);
            mesh.position.set(p.x * S + S / 2, tileY + 0.02, p.y * S + S / 2);
            ThreeRenderer.scene.add(mesh);
            this._pathHighlights.push(mesh);
        }
    },

    // ===== RAYCASTING HELPERS =====
    _getViewport() {
        return document.getElementById('three-viewport');
    },

    // Returns { tileX, tileY } from a mouse event, or null
    _raycastTile(e) {
        const vp   = this._getViewport();
        const rect = vp.getBoundingClientRect();
        this._mouse.set(
            ((e.clientX - rect.left)  / rect.width)  * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        this._raycaster.setFromCamera(this._mouse, ThreeRenderer.camera);
        const hits = this._raycaster.intersectObjects(TerrainBuilder.meshes, false);
        if (hits.length === 0) return null;
        const p = hits[0].point;
        const S = RSC.TILE_SIZE;
        return {
            tileX: Math.floor(p.x / S),
            tileY: Math.floor(p.z / S),
        };
    },

    // ===== INPUT =====
    _onClick(e) {
        if (NPC.activeDialogue) return;
        this._hideContextMenu();
        const t = this._raycastTile(e);
        if (!t) return;
        const npc = NPC.getNPCAt(t.tileX, t.tileY);
        if (npc) { this._walkToNPCAndInteract(npc); return; }
        Player.clickTile(t.tileX, t.tileY);
    },

    _onMouseMove(e) {
        const t = this._raycastTile(e);
        if (!t) return;
        this.hoveredTileX = t.tileX;
        this.hoveredTileY = t.tileY;

        const npc = NPC.getNPCAt(t.tileX, t.tileY);
        this._getViewport().style.cursor = npc ? 'pointer' : 'crosshair';
    },

    _onRightClick(e) {
        e.preventDefault();
        if (NPC.activeDialogue) return;
        const t = this._raycastTile(e);
        const npc = t ? NPC.getNPCAt(t.tileX, t.tileY) : null;
        this._showContextMenu(e.clientX, e.clientY, npc);
    },

    _onKeyDown(e) {
        // Don't intercept keypresses when the user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (NPC.activeDialogue) {
            if (e.key === 'Escape') NPC.closeDialogue();
            return;
        }
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'w': case 'ArrowUp':    dy = -1; break;
            case 's': case 'ArrowDown':  dy =  1; break;
            case 'a': case 'ArrowLeft':  dx = -1; break;
            case 'd': case 'ArrowRight': dx =  1; break;
            case 'Escape': Player.path = null; this._hideContextMenu(); break;
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

    // ===== NPC WALK-AND-INTERACT =====
    _walkToNPCAndInteract(npc) {
        if (Math.abs(Player.x - npc.x) <= 1 && Math.abs(Player.y - npc.y) <= 1) {
            NPC.interact(npc);
            return;
        }
        const adj = [
            { x: npc.x,     y: npc.y + 1 },
            { x: npc.x,     y: npc.y - 1 },
            { x: npc.x - 1, y: npc.y     },
            { x: npc.x + 1, y: npc.y     },
        ];
        let best = null, bestDist = Infinity;
        for (const t of adj) {
            if (World.isWalkable(t.x, t.y)) {
                const d = Math.abs(t.x - Player.x) + Math.abs(t.y - Player.y);
                if (d < bestDist) { bestDist = d; best = t; }
            }
        }
        if (best) {
            const path = World.findPath(Player.x, Player.y, best.x, best.y);
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

    // ===== CONTEXT MENU =====
    _buildContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText =
            'display:none;position:fixed;z-index:100;background:#000;border:1px solid #ffff00;' +
            'font-family:"Press Start 2P",monospace;font-size:8px;min-width:120px;cursor:pointer;';
        document.body.appendChild(menu);
        this.contextMenu = menu;
    },

    _showContextMenu(sx, sy, npc) {
        const menu = this.contextMenu;
        this.contextMenuNPC = npc;
        this.contextMenuVisible = true;
        menu.innerHTML = '';

        const hdr = document.createElement('div');
        hdr.style.cssText = 'color:#fff;padding:4px 8px;border-bottom:1px solid #444;font-size:8px;';
        hdr.textContent = 'Choose option';
        menu.appendChild(hdr);

        const opts = npc
            ? [
                { label: `Talk-to ${npc.name}`, color: '#ffff00',
                  action: () => { this._walkToNPCAndInteract(npc); this._hideContextMenu(); } },
                { label: `Examine ${npc.name}`,  color: '#ffff00',
                  action: () => { UI.addChatMessage(`You see ${npc.name}.`, 'system'); this._hideContextMenu(); } },
                { label: 'Cancel', color: '#ff4444', action: () => this._hideContextMenu() },
              ]
            : [
                { label: 'Walk here', color: '#ffff00', action: () => this._hideContextMenu() },
                { label: 'Cancel',    color: '#ff4444', action: () => this._hideContextMenu() },
              ];

        for (const o of opts) {
            const el = document.createElement('div');
            el.style.cssText = `color:${o.color};padding:4px 8px;font-size:8px;`;
            el.textContent = o.label;
            el.addEventListener('mouseenter', () => el.style.background = '#1a1a00');
            el.addEventListener('mouseleave', () => el.style.background = '');
            el.addEventListener('click', o.action);
            menu.appendChild(el);
        }

        menu.style.display = 'block';
        menu.style.left    = sx + 'px';
        menu.style.top     = sy + 'px';
    },

    _hideContextMenu() {
        if (this.contextMenu) this.contextMenu.style.display = 'none';
        this.contextMenuVisible = false;
        this.contextMenuNPC = null;
    },
};

// Boot
window.addEventListener('DOMContentLoaded', () => Engine.init());
