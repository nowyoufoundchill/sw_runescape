// renderer/ObjectBuilder.js
// Builds Three.js groups for every world object type.
// Spec: MeshBasicMaterial only, flat colors matching the RSC palette.
// All geometry dimensions are RSC-spec scaled for TILE_SIZE=4.
const ObjectBuilder = {
    // Build all world objects and add to scene
    buildAll(scene, objects) {
        this._scene = scene;
        this._objectMeshes = [];

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
                // Non-building objects sit on terrain at their tile center
                const wx = obj.x * S + S / 2;
                const wz = obj.y * S + S / 2;
                group.position.set(wx, TerrainBuilder.getHeightAt(wx, wz), wz);
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

    _mat(color, transparent, opacity) {
        const m = new THREE.MeshBasicMaterial({ color });
        if (transparent) { m.transparent = true; m.opacity = opacity || 0.5; }
        return m;
    },

    // ---- Tree ----
    // RSC spec: total height 10-12 units, canopy width 8-10 units
    _tree() {
        const g = new THREE.Group();
        // Trunk: 0.6 wide × 4.0 tall, base at y=0
        const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 4.0, 0.6),
            this._mat(RSC.COL_TREE_TRUNK)
        );
        trunk.position.set(0, 2.0, 0);
        g.add(trunk);
        // Lower canopy (wide, dark)
        const can1 = new THREE.Mesh(
            new THREE.BoxGeometry(8.0, 4.5, 8.0),
            this._mat(RSC.COL_TREE_CANOPY1)
        );
        can1.position.set(0, 6.5, 0);
        g.add(can1);
        // Upper canopy (narrower, lighter — spherical approximation)
        const can2 = new THREE.Mesh(
            new THREE.BoxGeometry(6.0, 3.5, 6.0),
            this._mat(RSC.COL_TREE_CANOPY2)
        );
        can2.position.set(0, 10.0, 0);
        g.add(can2);
        return g;
    },

    // ---- Dead Tree ----
    _deadTree() {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 5.0, 0.4),
            this._mat(0x4a3a2a)
        );
        trunk.position.set(0, 2.5, 0);
        g.add(trunk);
        const b1 = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.3, 0.3),
            this._mat(0x4a3a2a)
        );
        b1.position.set(-0.5, 3.5, 0);
        g.add(b1);
        const b2 = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.3, 0.3),
            this._mat(0x3a2a1a)
        );
        b2.position.set(0.4, 2.8, 0);
        b2.rotation.y = 0.8;
        g.add(b2);
        return g;
    },

    // ---- Rock / Ore ----
    // RSC spec: BOULDER_R = 1.2 → box ~2.0 wide
    _rock(dark, light) {
        const g = new THREE.Group();
        const r1 = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 1.2, 1.8),
            this._mat(dark)
        );
        r1.position.set(0, 0.6, 0);
        g.add(r1);
        const r2 = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.3, 1.2),
            this._mat(light)
        );
        r2.position.set(-0.2, 1.15, -0.2);
        g.add(r2);
        return g;
    },

    // ---- Barrel ----
    _barrel() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.6),
            this._mat(RSC.COL_BARREL_BODY)
        );
        body.position.set(0, 0.4, 0);
        g.add(body);
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.12, 0.65),
            this._mat(0x6e4f2a)
        );
        lid.position.set(0, 0.86, 0);
        g.add(lid);
        const bandGeo = new THREE.BoxGeometry(0.65, 0.1, 0.65);
        for (const by of [0.20, 0.40, 0.65]) {
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
            new THREE.BoxGeometry(1.2, 0.6, 1.2),
            this._mat(RSC.COL_TREE_CANOPY1)
        );
        bushy.position.set(0, 0.3, 0);
        g.add(bushy);
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.28, 0.8),
            this._mat(RSC.COL_TREE_CANOPY2)
        );
        top.position.set(0, 0.74, 0);
        g.add(top);
        return g;
    },

    // ---- Flowers ----
    _flowers() {
        const g = new THREE.Group();
        const colors = [0xcc4444, 0xdddd44, 0xdd88dd, 0xffffff];
        const stemGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const headGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        for (let i = 0; i < 4; i++) {
            const ox = (i % 2 === 0 ? -0.4 : 0.4);
            const oz = (i < 2 ? -0.3 : 0.3);
            const stem = new THREE.Mesh(stemGeo, this._mat(0x4a7a3a));
            stem.position.set(ox, 0.25, oz);
            g.add(stem);
            const head = new THREE.Mesh(headGeo, this._mat(colors[i % colors.length]));
            head.position.set(ox, 0.60, oz);
            g.add(head);
        }
        return g;
    },

    // ---- Tall Grass ----
    _tallGrass() {
        const g = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
        const positions = [-0.40, -0.20, 0.00, 0.20, 0.40];
        for (const bx of positions) {
            const blade = new THREE.Mesh(bladeGeo, this._mat(0x558a48));
            blade.position.set(bx, 0.4, 0);
            blade.rotation.z = bx * 0.4;
            g.add(blade);
        }
        return g;
    },

    // ---- Fence ----
    // RSC spec: FENCE_H = 2.5 world units (reaches character hip/waist at 5.8 total height)
    _fence(orientation) {
        const g = new THREE.Group();
        const S = RSC.TILE_SIZE;  // 4 — posts span full tile

        const postGeo  = new THREE.BoxGeometry(0.25, 2.5, 0.25);
        const railHGeo = new THREE.BoxGeometry(S,    0.12, 0.12);
        const railVGeo = new THREE.BoxGeometry(0.12, 0.12, S);
        const railY    = [0.8, 1.6];

        if (orientation === 'h') {
            for (const px of [-S/2, 0, S/2]) {
                const post = new THREE.Mesh(postGeo, this._mat(RSC.COL_FENCE));
                post.position.set(px, 1.25, 0);
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
                post.position.set(0, 1.25, pz);
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
        const caseM = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 2.2, 0.6),
            this._mat(RSC.COL_SERVER_CASE)
        );
        caseM.position.set(0, 1.1, 0);
        g.add(caseM);
        for (let i = 0; i < 5; i++) {
            const bay = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.25, 0.05),
                this._mat(0x1a1a1a)
            );
            bay.position.set(0, 0.25 + i * 0.35, 0.33);
            g.add(bay);
        }
        const ledColors = [RSC.COL_SERVER_LED, 0xcc0000, RSC.COL_SERVER_LED, RSC.COL_SERVER_LED, 0xcc0000];
        for (let i = 0; i < 5; i++) {
            const led = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.05),
                this._mat(ledColors[i])
            );
            led.position.set(-0.3, 0.25 + i * 0.35, 0.345);
            g.add(led);
        }
        return g;
    },

    // ---- Building ----
    // RSC spec: wallH=15 (house), char/wall ratio = 5.8/15 = 0.387 (within 0.30-0.42)
    _building(name, wTiles, hTiles, bType) {
        const g = new THREE.Group();
        const S     = RSC.TILE_SIZE;
        const bw    = wTiles * S;   // footprint width (X)
        const bd    = hTiles * S;   // footprint depth (Z)
        const wallT = 0.2;          // wall thickness

        // wallH per spec: 15.0 (house) for 0.38 char/wall ratio; 10.0 (NOC)
        const wallH = bType === 'noc' ? 10.0 : 15.0;
        const roofH = bType === 'noc' ?  1.0 :  3.5;

        if (bType === 'noc') {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(bw, wallH, wallT), this._mat(RSC.COL_NOC_SOUTH));
            sw.position.set(0, wallH/2, bd/2);
            g.add(sw);
            const ew = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, bd), this._mat(RSC.COL_NOC_EAST));
            ew.position.set(bw/2, wallH/2, 0);
            g.add(ew);
            const nw = new THREE.Mesh(new THREE.BoxGeometry(bw, wallH, wallT), this._mat(0x2a2a2a));
            nw.position.set(0, wallH/2, -bd/2);
            g.add(nw);
            const ww = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, bd), this._mat(0x222222));
            ww.position.set(-bw/2, wallH/2, 0);
            g.add(ww);
            // Roof slab
            const roof = new THREE.Mesh(new THREE.BoxGeometry(bw, roofH, bd), this._mat(RSC.COL_NOC_ROOF));
            roof.position.set(0, wallH + roofH/2, 0);
            g.add(roof);
            // SolarWinds orange stripe
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.2, 0.5), this._mat(RSC.COL_NOC_STRIPE));
            stripe.position.set(0, wallH + roofH + 0.1, -bd/2 + 2.0);
            g.add(stripe);
            // Windows (3 on south face)
            for (const wx of [-bw/2 + 1.5, -bw/2 + 4.5, -bw/2 + 7.5]) {
                const win = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.15), this._mat(RSC.COL_WINDOW));
                win.position.set(wx, wallH * 0.45, bd/2 + 0.02);
                g.add(win);
            }
        } else {
            // House: warm stone, south wall (facing player) medium brightness
            const sw = new THREE.Mesh(new THREE.BoxGeometry(bw, wallH, wallT), this._mat(RSC.COL_BLDG_SOUTH));
            sw.position.set(0, wallH/2, bd/2);
            g.add(sw);
            // East wall — darker
            const ew = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, bd), this._mat(RSC.COL_BLDG_EAST));
            ew.position.set(bw/2, wallH/2, 0);
            g.add(ew);
            // North wall — dark
            const nwm = new THREE.Mesh(new THREE.BoxGeometry(bw, wallH, wallT), this._mat(RSC.COL_BLDG_EAST));
            nwm.position.set(0, wallH/2, -bd/2);
            g.add(nwm);
            // West wall — medium (matches south)
            const ww = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, bd), this._mat(RSC.COL_BLDG_SOUTH));
            ww.position.set(-bw/2, wallH/2, 0);
            g.add(ww);
            // Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.4, roofH, bd + 0.4), this._mat(RSC.COL_BLDG_ROOF));
            roof.position.set(0, wallH + roofH/2, 0);
            g.add(roof);
            // Door on south face
            const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, wallT + 0.02), this._mat(RSC.COL_DOOR));
            door.position.set(0, 1.75, bd/2 + 0.01);
            g.add(door);
            // Windows (2 on south face)
            for (const wx of [-bw/4, bw/4]) {
                const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, wallT + 0.02), this._mat(RSC.COL_WINDOW));
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
                label.position.set(0, wallH + roofH + 0.5, 0);
                g.add(label);
            }
        }

        return g;
    },
};
