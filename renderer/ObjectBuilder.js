// renderer/ObjectBuilder.js
// Builds Three.js groups for every world object type.
// Spec: MeshBasicMaterial only, flat colors matching the 2D sprite palette.
const ObjectBuilder = {
    // Cache shared geometries by key
    _geoCache: {},

    // Build all world objects and add to scene
    buildAll(scene, objects) {
        this._scene = scene;
        this._objectMeshes = []; // array of { obj, group } for cleanup / lookup

        for (const obj of objects) {
            const group = this._buildObject(obj);
            if (!group) continue;

            const S = RSC.TILE_SIZE;
            if (obj.isBuilding) {
                // Buildings are anchored at NW tile corner; center is (x+w/2, z+h/2)
                group.position.set(
                    (obj.x + obj.w / 2) * S,
                    0,
                    (obj.y + obj.h / 2) * S
                );
            } else {
                // Non-building objects sit centered on their tile
                group.position.set(
                    obj.x * S + S / 2,
                    0,
                    obj.y * S + S / 2
                );
            }

            scene.add(group);
            this._objectMeshes.push({ obj, group });
        }
    },

    _buildObject(obj) {
        switch (obj.type) {
            case 'tree':       return this._tree();
            case 'deadTree':   return this._deadTree();
            case 'rock':       return this._rock(RSC.COL_ROCK, RSC.COL_ROCK_LIGHT);
            case 'copperRock': return this._rock(RSC.COL_COPPER, 0xa06830);
            case 'tinRock':    return this._rock(RSC.COL_TIN, 0x999999);
            case 'barrel':     return this._barrel();
            case 'bush':       return this._bush();
            case 'flowers':    return this._flowers();
            case 'tallGrass':  return this._tallGrass();
            case 'fenceH':     return this._fence('h');
            case 'fenceV':     return this._fence('v');
            case 'serverRack': return this._serverRack();
            case 'house':      return this._building(obj.name, obj.w || 3, obj.h || 3, 'house');
            case 'noc':        return this._building(obj.name, obj.w || 6, obj.h || 4, 'noc');
            default:           return null;
        }
    },

    _geo(key, factory) {
        if (!this._geoCache[key]) this._geoCache[key] = factory();
        return this._geoCache[key];
    },

    _mat(color, transparent, opacity) {
        const m = new THREE.MeshBasicMaterial({ color });
        if (transparent) { m.transparent = true; m.opacity = opacity || 0.5; }
        return m;
    },

    _mesh(geoKey, geoFactory, color) {
        return new THREE.Mesh(this._geo(geoKey, geoFactory), this._mat(color));
    },

    // ---- Tree ----
    _tree() {
        const g = new THREE.Group();
        const S = RSC.TILE_SIZE;
        // Trunk
        const trunk = new THREE.Mesh(
            this._geo('trunkGeo', () => new THREE.BoxGeometry(0.15, 0.7, 0.15)),
            this._mat(RSC.COL_TREE_TRUNK)
        );
        trunk.position.set(0, 0.35, 0);
        g.add(trunk);
        // Lower canopy (wider)
        const can1 = new THREE.Mesh(
            this._geo('canopy1Geo', () => new THREE.BoxGeometry(0.9, 0.5, 0.9)),
            this._mat(RSC.COL_TREE_CANOPY1)
        );
        can1.position.set(0, 0.95, 0);
        g.add(can1);
        // Upper canopy (narrower, lighter)
        const can2 = new THREE.Mesh(
            this._geo('canopy2Geo', () => new THREE.BoxGeometry(0.65, 0.45, 0.65)),
            this._mat(RSC.COL_TREE_CANOPY2)
        );
        can2.position.set(0, 1.35, 0);
        g.add(can2);
        return g;
    },

    // ---- Dead Tree ----
    _deadTree() {
        const g = new THREE.Group();
        // Trunk
        const trunk = new THREE.Mesh(
            this._geo('dTrunkGeo', () => new THREE.BoxGeometry(0.12, 1.0, 0.12)),
            this._mat(0x4a3a2a)
        );
        trunk.position.set(0, 0.5, 0);
        g.add(trunk);
        // Branches (two short horizontal boxes)
        const branchGeo = this._geo('branchGeo', () => new THREE.BoxGeometry(0.5, 0.08, 0.08));
        const b1 = new THREE.Mesh(branchGeo, this._mat(0x4a3a2a));
        b1.position.set(-0.1, 0.7, 0);
        g.add(b1);
        const b2 = new THREE.Mesh(branchGeo, this._mat(0x3a2a1a));
        b2.position.set(0.1, 0.55, 0);
        b2.rotation.y = 0.8;
        g.add(b2);
        return g;
    },

    // ---- Rock / Ore ----
    _rock(dark, light) {
        const g = new THREE.Group();
        // Main rock body — slightly irregular box
        const r1 = new THREE.Mesh(
            this._geo('rock1Geo', () => new THREE.BoxGeometry(0.45, 0.3, 0.4)),
            this._mat(dark)
        );
        r1.position.set(0, 0.15, 0);
        g.add(r1);
        // Highlight top slab
        const r2 = new THREE.Mesh(
            this._geo('rock2Geo', () => new THREE.BoxGeometry(0.3, 0.08, 0.28)),
            this._mat(light)
        );
        r2.position.set(-0.05, 0.3, -0.04);
        g.add(r2);
        return g;
    },

    // ---- Barrel ----
    _barrel() {
        const g = new THREE.Group();
        // Body
        const body = new THREE.Mesh(
            this._geo('barBodyGeo', () => new THREE.BoxGeometry(0.28, 0.38, 0.28)),
            this._mat(RSC.COL_BARREL_BODY)
        );
        body.position.set(0, 0.19, 0);
        g.add(body);
        // Lid
        const lid = new THREE.Mesh(
            this._geo('barLidGeo', () => new THREE.BoxGeometry(0.3, 0.06, 0.3)),
            this._mat(0x6e4f2a)
        );
        lid.position.set(0, 0.41, 0);
        g.add(lid);
        // 3 metal bands
        const bandGeo = this._geo('bandGeo', () => new THREE.BoxGeometry(0.3, 0.05, 0.3));
        for (const by of [0.1, 0.2, 0.32]) {
            const band = new THREE.Mesh(bandGeo, this._mat(RSC.COL_BARREL_BAND));
            band.position.set(0, by, 0);
            g.add(band);
        }
        return g;
    },

    // ---- Bush ----
    _bush() {
        const g = new THREE.Group();
        const bushy = new THREE.Mesh(
            this._geo('bushGeo', () => new THREE.BoxGeometry(0.55, 0.3, 0.55)),
            this._mat(RSC.COL_TREE_CANOPY1)
        );
        bushy.position.set(0, 0.15, 0);
        g.add(bushy);
        // Top lighter highlight
        const top = new THREE.Mesh(
            this._geo('bushTopGeo', () => new THREE.BoxGeometry(0.38, 0.14, 0.38)),
            this._mat(RSC.COL_TREE_CANOPY2)
        );
        top.position.set(0, 0.35, 0);
        g.add(top);
        return g;
    },

    // ---- Flowers ----
    _flowers() {
        const g = new THREE.Group();
        const colors = [0xcc4444, 0xdddd44, 0xdd88dd, 0xffffff];
        const stemGeo = this._geo('stemGeo', () => new THREE.BoxGeometry(0.04, 0.18, 0.04));
        const headGeo = this._geo('flrHeadGeo', () => new THREE.BoxGeometry(0.1, 0.08, 0.1));
        for (let i = 0; i < 4; i++) {
            const ox = (i % 2 === 0 ? -0.15 : 0.15);
            const oz = (i < 2 ? -0.1 : 0.1);
            const stem = new THREE.Mesh(stemGeo, this._mat(0x4a7a3a));
            stem.position.set(ox, 0.09, oz);
            g.add(stem);
            const head = new THREE.Mesh(headGeo, this._mat(colors[i % colors.length]));
            head.position.set(ox, 0.22, oz);
            g.add(head);
        }
        return g;
    },

    // ---- Tall Grass ----
    _tallGrass() {
        const g = new THREE.Group();
        const bladeGeo = this._geo('bladeGeo', () => new THREE.BoxGeometry(0.06, 0.32, 0.06));
        const positions = [-0.18, -0.08, 0.02, 0.12, 0.22];
        for (const bx of positions) {
            const blade = new THREE.Mesh(bladeGeo, this._mat(0x558a48));
            blade.position.set(bx, 0.16, 0);
            blade.rotation.z = (bx * 0.4); // slight lean
            g.add(blade);
        }
        return g;
    },

    // ---- Fence ----
    _fence(orientation) {
        const g = new THREE.Group();
        const S = RSC.TILE_SIZE; // 2
        const postGeo  = this._geo('postGeo',  () => new THREE.BoxGeometry(0.06, 0.5,  0.06));
        const railHGeo = this._geo('railHGeo', () => new THREE.BoxGeometry(S,    0.05, 0.05));
        const railVGeo = this._geo('railVGeo', () => new THREE.BoxGeometry(0.05, 0.05, S));
        const railY = [0.15, 0.32];

        if (orientation === 'h') {
            // Posts at x = -S/2, 0, +S/2
            for (const px of [-S/2, 0, S/2]) {
                const post = new THREE.Mesh(postGeo, this._mat(RSC.COL_FENCE));
                post.position.set(px, 0.25, 0);
                g.add(post);
            }
            for (const ry of railY) {
                const rail = new THREE.Mesh(railHGeo, this._mat(0x7d5a30));
                rail.position.set(0, ry, 0);
                g.add(rail);
            }
        } else {
            for (const pz of [-S/2, 0, S/2]) {
                const post = new THREE.Mesh(postGeo, this._mat(RSC.COL_FENCE));
                post.position.set(0, 0.25, pz);
                g.add(post);
            }
            for (const ry of railY) {
                const rail = new THREE.Mesh(railVGeo, this._mat(0x7d5a30));
                rail.position.set(0, ry, 0);
                g.add(rail);
            }
        }
        return g;
    },

    // ---- Server Rack ----
    _serverRack() {
        const g = new THREE.Group();
        // Case
        const caseGeo = this._geo('rackCaseGeo', () => new THREE.BoxGeometry(0.4, 0.9, 0.25));
        const caseM = new THREE.Mesh(caseGeo, this._mat(RSC.COL_SERVER_CASE));
        caseM.position.set(0, 0.45, 0);
        g.add(caseM);
        // Drive bays (flat panels with LED)
        const bayGeo = this._geo('bayGeo', () => new THREE.BoxGeometry(0.32, 0.1, 0.02));
        for (let i = 0; i < 5; i++) {
            const bay = new THREE.Mesh(bayGeo, this._mat(0x1a1a1a));
            bay.position.set(0, 0.1 + i * 0.14, 0.135);
            g.add(bay);
        }
        // Status LEDs (small boxes)
        const ledGeo = this._geo('ledGeo', () => new THREE.BoxGeometry(0.04, 0.04, 0.02));
        const ledColors = [RSC.COL_SERVER_LED, 0xcc0000, RSC.COL_SERVER_LED, RSC.COL_SERVER_LED, 0xcc0000];
        for (let i = 0; i < 5; i++) {
            const led = new THREE.Mesh(ledGeo, this._mat(ledColors[i]));
            led.position.set(-0.12, 0.1 + i * 0.14, 0.145);
            g.add(led);
        }
        return g;
    },

    // ---- Building ----
    _building(name, wTiles, hTiles, bType) {
        const g = new THREE.Group();
        const S     = RSC.TILE_SIZE;
        const bw    = wTiles * S;  // footprint width  (X)
        const bd    = hTiles * S;  // footprint depth  (Z)
        const wallH = 1.6;         // wall height in world units
        const roofH = bType === 'noc' ? 0.1 : 0.5;

        if (bType === 'noc') {
            // NOC: flat roof, dark grey
            // South wall
            const sw = new THREE.Mesh(
                new THREE.BoxGeometry(bw, wallH, 0.08),
                this._mat(RSC.COL_NOC_SOUTH)
            );
            sw.position.set(0, wallH/2, bd/2);
            g.add(sw);
            // East wall
            const ew = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, wallH, bd),
                this._mat(RSC.COL_NOC_EAST)
            );
            ew.position.set(bw/2, wallH/2, 0);
            g.add(ew);
            // North wall
            const nw = new THREE.Mesh(
                new THREE.BoxGeometry(bw, wallH, 0.08),
                this._mat(0x2a2a2a)
            );
            nw.position.set(0, wallH/2, -bd/2);
            g.add(nw);
            // West wall
            const ww = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, wallH, bd),
                this._mat(0x222222)
            );
            ww.position.set(-bw/2, wallH/2, 0);
            g.add(ww);
            // Roof slab
            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(bw, roofH, bd),
                this._mat(RSC.COL_NOC_ROOF)
            );
            roof.position.set(0, wallH + roofH/2, 0);
            g.add(roof);
            // SolarWinds orange stripe on roof
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(bw, 0.08, 0.22),
                this._mat(RSC.COL_NOC_STRIPE)
            );
            stripe.position.set(0, wallH + roofH + 0.05, -bd/2 + 0.8);
            g.add(stripe);
            // Windows (south wall — blue rectangles)
            for (const wx of [-bw/2 + 0.6, -bw/2 + 1.6, -bw/2 + 2.6]) {
                const win = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.5, 0.05),
                    this._mat(RSC.COL_WINDOW)
                );
                win.position.set(wx, wallH/2 + 0.1, bd/2 + 0.02);
                g.add(win);
            }
        } else {
            // House: sloped roof (represented by a taller box on top), warm stone
            // South wall (facing player) — medium brightness
            const sw = new THREE.Mesh(
                new THREE.BoxGeometry(bw, wallH, 0.08),
                this._mat(RSC.COL_BLDG_SOUTH)
            );
            sw.position.set(0, wallH/2, bd/2);
            g.add(sw);
            // East wall — darker
            const ew = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, wallH, bd),
                this._mat(RSC.COL_BLDG_EAST)
            );
            ew.position.set(bw/2, wallH/2, 0);
            g.add(ew);
            // North wall
            const nw = new THREE.Mesh(
                new THREE.BoxGeometry(bw, wallH, 0.08),
                this._mat(RSC.COL_BLDG_EAST)
            );
            nw.position.set(0, wallH/2, -bd/2);
            g.add(nw);
            // West wall
            const ww = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, wallH, bd),
                this._mat(RSC.COL_BLDG_SOUTH)
            );
            ww.position.set(-bw/2, wallH/2, 0);
            g.add(ww);
            // Roof — bright brown
            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(bw + 0.1, roofH, bd + 0.1),
                this._mat(RSC.COL_BLDG_ROOF)
            );
            roof.position.set(0, wallH + roofH/2, 0);
            g.add(roof);
            // Door on south face
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.65, 0.06),
                this._mat(RSC.COL_DOOR)
            );
            door.position.set(0, 0.325, bd/2 + 0.01);
            g.add(door);
            // Windows (2 on south wall)
            for (const wx of [-0.5, 0.5]) {
                const win = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.28, 0.05),
                    this._mat(RSC.COL_WINDOW)
                );
                win.position.set(wx, wallH * 0.55, bd/2 + 0.01);
                g.add(win);
            }
        }

        // Building name label
        if (name) {
            const div = document.createElement('div');
            div.style.cssText =
                'font-family:"Press Start 2P",monospace;font-size:7px;color:#ffff00;' +
                'text-shadow:1px 1px 0 #000,-1px -1px 0 #000;white-space:nowrap;pointer-events:none;';
            div.textContent = name;
            if (typeof THREE.CSS2DObject !== 'undefined') {
                const label = new THREE.CSS2DObject(div);
                label.position.set(0, wallH + roofH + 0.3, 0);
                g.add(label);
            }
        }

        return g;
    },
};
