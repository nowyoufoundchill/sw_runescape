// renderer/CharacterBuilder.js
// Builds box-geometry character assemblies for player + NPCs.
// Spec: BoxGeometry parts, MeshBasicMaterial, separate leg meshes for walk animation.
// All sizes are in Three.js world units (1 unit ≈ 0.5 tiles).
const CharacterBuilder = {
    // Shared geometries — created once, reused by all characters
    _geos: null,

    _ensureGeos() {
        if (this._geos) return;
        const S = 0.055; // pixels → world units (character ~1.6 units tall in a 2-unit tile)
        this._geos = {
            head:   new THREE.BoxGeometry(10*S, 10*S, 8*S),
            torso:  new THREE.BoxGeometry(14*S, 10*S, 4*S),
            armL:   new THREE.BoxGeometry( 4*S,  9*S, 3*S),
            armR:   new THREE.BoxGeometry( 4*S,  9*S, 3*S),
            legL:   new THREE.BoxGeometry( 5*S,  9*S, 3*S),
            legR:   new THREE.BoxGeometry( 5*S,  9*S, 3*S),
            hatBrim:new THREE.BoxGeometry(12*S,  2*S, 9*S),
            // Goblin-specific
            headG:  new THREE.BoxGeometry(12*S, 10*S, 8*S),
            // Shadow disk
            shadow: new THREE.CircleGeometry(0.28, 8),
        };
        this._geos.shadow.rotateX(-Math.PI / 2);
    },

    _mat(colorHex) {
        return new THREE.MeshBasicMaterial({ color: colorHex });
    },

    // opts: { color, legsColor, hat, npcType, hairColor }
    // Returns: THREE.Group with userData.legL, userData.legR, userData.nameLabel
    build(opts = {}) {
        this._ensureGeos();
        opts = opts || {};

        const npcType    = opts.npcType || opts.type || 'human';
        const shirtColor = opts.color      ? this._cssToHex(opts.color)      : RSC.COL_SKIN;
        const legsColor  = opts.legsColor  ? this._cssToHex(opts.legsColor)  : 0x2244cc;
        const hairColor  = opts.hairColor  ? this._cssToHex(opts.hairColor)  : RSC.COL_HAIR_DEFAULT;
        const hatColor   = opts.hat        ? this._cssToHex(opts.hat)        : null;

        const group = new THREE.Group();
        const S     = 0.055;

        if (npcType === 'goblin') {
            return this._buildGoblin(group, S);
        }
        if (npcType === 'guard') {
            return this._buildGuard(group, S);
        }

        // Y offsets (bottom of feet = y=0 in local space)
        const legBotY  = 9*S/2;          // 0.247 — leg centers
        const torsoBotY= 9*S + 10*S/2;   // leg height + half torso
        const headBotY = 9*S + 10*S + 10*S/2; // legs + torso + half head

        // Shadow
        const shadowMesh = new THREE.Mesh(this._geos.shadow, this._mat(0x000000));
        shadowMesh.material.transparent = true;
        shadowMesh.material.opacity     = 0.35;
        shadowMesh.position.set(0, 0.01, 0);
        group.add(shadowMesh);

        // Legs
        const legL = new THREE.Mesh(this._geos.legL, this._mat(legsColor));
        legL.position.set(-3*S, legBotY, 0);
        group.add(legL);

        const legR = new THREE.Mesh(this._geos.legR, this._mat(legsColor));
        legR.position.set(3*S, legBotY, 0);
        group.add(legR);

        // Torso
        const torso = new THREE.Mesh(this._geos.torso, this._mat(shirtColor));
        torso.position.set(0, torsoBotY, 0);
        group.add(torso);

        // Arms (use shirt color, slightly offset out)
        const armL = new THREE.Mesh(this._geos.armL, this._mat(shirtColor));
        armL.position.set(-9*S, torsoBotY - S, 0);
        group.add(armL);

        const armR = new THREE.Mesh(this._geos.armR, this._mat(shirtColor));
        armR.position.set(9*S, torsoBotY - S, 0);
        group.add(armR);

        // Head
        const head = new THREE.Mesh(this._geos.head, this._mat(RSC.COL_SKIN));
        head.position.set(0, headBotY, 0);
        group.add(head);

        // Hair strip on top of head
        const hairGeo = new THREE.BoxGeometry(10*S, 3*S, 8*S);
        const hair    = new THREE.Mesh(hairGeo, this._mat(hairColor));
        hair.position.set(0, headBotY + 10*S/2 + 3*S/2, 0);
        group.add(hair);

        // Hat (optional)
        if (hatColor !== null) {
            const hatBrim = new THREE.Mesh(this._geos.hatBrim, this._mat(hatColor));
            hatBrim.position.set(0, headBotY + 10*S/2 + 3*S + 2*S/2, 0);
            group.add(hatBrim);
        }

        // Name label (CSS2DObject if available)
        const labelHeight = headBotY + 10*S + 3*S + 0.15;
        const nameDiv = document.createElement('div');
        nameDiv.className = 'char-label';
        nameDiv.style.cssText =
            'font-family:"Press Start 2P",monospace;font-size:6px;color:#ffff00;' +
            'text-shadow:1px 1px 0 #000,-1px -1px 0 #000;white-space:nowrap;pointer-events:none;';
        nameDiv.textContent = opts.name || '';

        if (typeof THREE.CSS2DObject !== 'undefined') {
            const label = new THREE.CSS2DObject(nameDiv);
            label.position.set(0, labelHeight, 0);
            group.add(label);
            group.userData.nameDiv = nameDiv;
        }

        // Store references for animation
        group.userData.legL     = legL;
        group.userData.legR     = legR;
        group.userData.walkTimer = 0;
        group.userData.walkFrame = 0;

        return group;
    },

    _buildGoblin(group, S) {
        // Shadow
        const shadowMesh = new THREE.Mesh(this._geos.shadow, this._mat(0x000000));
        shadowMesh.material.transparent = true;
        shadowMesh.material.opacity = 0.35;
        shadowMesh.position.set(0, 0.01, 0);
        group.add(shadowMesh);

        const green  = 0x2a5a1a;
        const armor  = 0x5a4a00;
        const dkGrn  = 0x1a4a0a;

        const legBotY   = 9*S/2;
        const torsoBotY = 9*S + 10*S/2;
        const headBotY  = 9*S + 10*S + 10*S/2;

        const legL = new THREE.Mesh(this._geos.legL, this._mat(dkGrn));
        legL.position.set(-3*S, legBotY, 0);
        group.add(legL);
        const legR = new THREE.Mesh(this._geos.legR, this._mat(dkGrn));
        legR.position.set(3*S, legBotY, 0);
        group.add(legR);

        const torso = new THREE.Mesh(this._geos.torso, this._mat(armor));
        torso.position.set(0, torsoBotY, 0);
        group.add(torso);

        const armL = new THREE.Mesh(this._geos.armL, this._mat(green));
        armL.position.set(-9*S, torsoBotY - S, 0);
        group.add(armL);
        const armR = new THREE.Mesh(this._geos.armR, this._mat(green));
        armR.position.set(9*S, torsoBotY - S, 0);
        group.add(armR);

        // Goblin head — slightly larger
        const headGeo = new THREE.BoxGeometry(12*S, 10*S, 8*S);
        const head = new THREE.Mesh(headGeo, this._mat(green));
        head.position.set(0, headBotY, 0);
        group.add(head);

        group.userData.legL  = legL;
        group.userData.legR  = legR;
        group.userData.walkTimer = 0;
        group.userData.walkFrame = 0;
        return group;
    },

    _buildGuard(group, S) {
        const shadowMesh = new THREE.Mesh(this._geos.shadow, this._mat(0x000000));
        shadowMesh.material.transparent = true;
        shadowMesh.material.opacity = 0.35;
        shadowMesh.position.set(0, 0.01, 0);
        group.add(shadowMesh);

        const chain  = 0x888888;
        const helmet = 0x777777;

        const legBotY   = 9*S/2;
        const torsoBotY = 9*S + 10*S/2;
        const headBotY  = 9*S + 10*S + 10*S/2;

        const legL = new THREE.Mesh(this._geos.legL, this._mat(0x666666));
        legL.position.set(-3*S, legBotY, 0);
        group.add(legL);
        const legR = new THREE.Mesh(this._geos.legR, this._mat(0x666666));
        legR.position.set(3*S, legBotY, 0);
        group.add(legR);

        const torso = new THREE.Mesh(this._geos.torso, this._mat(chain));
        torso.position.set(0, torsoBotY, 0);
        group.add(torso);

        const armL = new THREE.Mesh(this._geos.armL, this._mat(helmet));
        armL.position.set(-9*S, torsoBotY - S, 0);
        group.add(armL);
        const armR = new THREE.Mesh(this._geos.armR, this._mat(helmet));
        armR.position.set(9*S, torsoBotY - S, 0);
        group.add(armR);

        const head = new THREE.Mesh(this._geos.head, this._mat(RSC.COL_SKIN));
        head.position.set(0, headBotY, 0);
        group.add(head);

        // Helmet cap
        const helmetGeo = new THREE.BoxGeometry(10*S, 5*S, 9*S);
        const helmetMesh = new THREE.Mesh(helmetGeo, this._mat(helmet));
        helmetMesh.position.set(0, headBotY + 10*S/2 + 5*S/2 - S, 0);
        group.add(helmetMesh);

        // Spear
        const spearGeo = new THREE.BoxGeometry(0.04, 1.0, 0.04);
        const spearMesh = new THREE.Mesh(spearGeo, this._mat(RSC.COL_TREE_TRUNK));
        spearMesh.position.set(9*S + 0.07, 0.5, 0);
        group.add(spearMesh);

        group.userData.legL  = legL;
        group.userData.legR  = legR;
        group.userData.walkTimer = 0;
        group.userData.walkFrame = 0;
        return group;
    },

    // Animate walk: called each frame when character is moving
    updateWalk(group, isMoving, dt) {
        if (!group || !group.userData.legL) return;

        const WALK_AMP   = 0.35;  // radians
        const WALK_SPEED = 350;   // ms per full cycle

        if (isMoving) {
            group.userData.walkTimer += dt;
            const phase = (group.userData.walkTimer % WALK_SPEED) / WALK_SPEED;
            const angle = Math.sin(phase * Math.PI * 2) * WALK_AMP;
            group.userData.legL.rotation.x =  angle;
            group.userData.legR.rotation.x = -angle;
        } else {
            group.userData.legL.rotation.x *= 0.8;
            group.userData.legR.rotation.x *= 0.8;
        }
    },

    // Convert CSS color string '#rrggbb' or 'rgb(...)' to 0xRRGGBB integer
    _cssToHex(css) {
        if (!css) return 0x888888;
        if (typeof css === 'number') return css;
        const s = css.trim();
        if (s.startsWith('#')) {
            return parseInt(s.slice(1), 16);
        }
        // Fallback: create a temporary element (not ideal in tight loop, but called once per character)
        try {
            const c = new THREE.Color(s);
            return (Math.round(c.r*255) << 16) | (Math.round(c.g*255) << 8) | Math.round(c.b*255);
        } catch(e) {
            return 0x888888;
        }
    },
};
