// renderer/TerrainBuilder.js
// Builds a single merged BufferGeometry for all terrain tiles.
// Water tiles are kept separate for 2-frame 800ms animation.
// All materials are MeshBasicMaterial (flat color, no lighting).
const TerrainBuilder = {
    terrainMesh: null,
    waterMesh:   null,

    // Float32Arrays for swap during water animation
    _waterColors0: null,
    _waterColors1: null,
    _waterTimer:   0,
    _waterFrame:   0,

    // Array of terrain meshes exposed for raycasting
    meshes: [],

    build(scene) {
        const S = RSC.TILE_SIZE;
        const W = World.MAP_W;
        const H = World.MAP_H;
        const T = World.TILES;

        // Separate buckets for water vs non-water
        const solidPos  = [];
        const solidCol  = [];
        const solidIdx  = [];
        const waterPos  = [];
        const wCol0     = [];  // frame 0 — dark navy
        const wCol1     = [];  // frame 1 — mid navy
        const waterIdx  = [];
        let si = 0, wi = 0;

        for (let ty = 0; ty < H; ty++) {
            for (let tx = 0; tx < W; tx++) {
                const tile  = World.getTile(tx, ty);
                const isWater = (tile === T.WATER);
                const wx    = tx * S;
                const wz    = ty * S;

                // Flat terrain (y=0); height variation dropped for simplicity
                const hy = 0;

                if (isWater) {
                    // 4 un-shared vertices per water tile
                    const base = wi * 4;
                    waterPos.push(
                        wx,     hy, wz,
                        wx + S, hy, wz,
                        wx + S, hy, wz + S,
                        wx,     hy, wz + S
                    );
                    const c0 = this._hexRGB(RSC.COL_WATER);
                    const c1 = this._hexRGB(RSC.COL_WATER2);
                    for (let v = 0; v < 4; v++) {
                        wCol0.push(c0.r, c0.g, c0.b);
                        wCol1.push(c1.r, c1.g, c1.b);
                    }
                    waterIdx.push(base, base+1, base+2, base, base+2, base+3);
                    wi++;
                } else {
                    const col  = this._tileColor(tile);
                    const rgb  = this._hexRGB(col);
                    const base = si * 4;
                    solidPos.push(
                        wx,     hy, wz,
                        wx + S, hy, wz,
                        wx + S, hy, wz + S,
                        wx,     hy, wz + S
                    );
                    for (let v = 0; v < 4; v++) {
                        solidCol.push(rgb.r, rgb.g, rgb.b);
                    }
                    solidIdx.push(base, base+1, base+2, base, base+2, base+3);
                    si++;
                }
            }
        }

        // ---- Solid terrain mesh ----
        const sgeo = new THREE.BufferGeometry();
        sgeo.setAttribute('position', new THREE.Float32BufferAttribute(solidPos, 3));
        sgeo.setAttribute('color',    new THREE.Float32BufferAttribute(solidCol, 3));
        sgeo.setIndex(solidIdx);
        const smat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        this.terrainMesh = new THREE.Mesh(sgeo, smat);
        scene.add(this.terrainMesh);

        // ---- Water terrain mesh ----
        const wgeo = new THREE.BufferGeometry();
        wgeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPos, 3));
        wgeo.setAttribute('color',    new THREE.Float32BufferAttribute(wCol0,    3));
        wgeo.setIndex(waterIdx);
        const wmat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        this.waterMesh = new THREE.Mesh(wgeo, wmat);
        scene.add(this.waterMesh);

        // Save color arrays for animation swap
        this._waterColors0 = new Float32Array(wCol0);
        this._waterColors1 = new Float32Array(wCol1);

        // Expose both meshes for raycasting
        this.meshes = [this.terrainMesh, this.waterMesh];
    },

    update(dt) {
        this._waterTimer += dt;
        if (this._waterTimer >= RSC.WATER_INTERVAL) {
            this._waterTimer -= RSC.WATER_INTERVAL;
            this._waterFrame  = 1 - this._waterFrame;
            const src = this._waterFrame === 0 ? this._waterColors0 : this._waterColors1;
            const attr = this.waterMesh.geometry.attributes.color;
            attr.array.set(src);
            attr.needsUpdate = true;
        }
    },

    // Returns a tile color integer from RSC palette
    _tileColor(tile) {
        const T = World.TILES;
        switch (tile) {
            case T.GRASS:  return RSC.COL_GRASS;
            case T.DIRT:   return RSC.COL_DIRT;
            case T.SAND:   return RSC.COL_SAND;
            case T.WATER:  return RSC.COL_WATER;
            case T.STONE:  return RSC.COL_STONE;
            case T.PATH:   return RSC.COL_PATH;
            case T.WOOD:   return RSC.COL_WOOD;
            case T.LAVA:   return RSC.COL_LAVA;
            case T.SWAMP:  return RSC.COL_SWAMP;
            default:       return RSC.COL_GRASS;
        }
    },

    // Convert 0xRRGGBB integer to {r,g,b} in 0..1 range
    _hexRGB(hex) {
        return {
            r: ((hex >> 16) & 255) / 255,
            g: ((hex >>  8) & 255) / 255,
            b: ((hex >>  0) & 255) / 255,
        };
    },
};
