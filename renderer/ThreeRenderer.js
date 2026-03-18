// renderer/ThreeRenderer.js
// Three.js scene + renderer initialization
// Spec: r128, MeshBasicMaterial only, PerspectiveCamera FOV 60°
const ThreeRenderer = {
    scene:          null,
    camera:         null,
    renderer:       null,
    labelRenderer:  null,  // CSS2DRenderer for floating name labels

    init(container) {
        // ---- Scene ----
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        // Subtle distance fog — scaled for larger world (256 unit square)
        this.scene.fog = new THREE.Fog(0x111111, 120, 280);

        const w = container.clientWidth  || 512;
        const h = container.clientHeight || 384;

        // ---- Camera ----
        this.camera = new THREE.PerspectiveCamera(
            RSC.CAM_FOV, w / h, RSC.CAM_NEAR, RSC.CAM_FAR
        );
        // Initial position — will be overridden by Camera.update() each frame
        this.camera.position.set(0, RSC.CAM_OFFSET_Y, RSC.CAM_OFFSET_Z);
        this.camera.lookAt(0, 0, 0);

        // ---- WebGL Renderer ----
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.id = 'three-canvas';
        this.renderer.domElement.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;';
        container.appendChild(this.renderer.domElement);

        // ---- CSS2DRenderer (name labels) ----
        if (typeof THREE.CSS2DRenderer !== 'undefined') {
            this.labelRenderer = new THREE.CSS2DRenderer();
            this.labelRenderer.setSize(w, h);
            this.labelRenderer.domElement.style.cssText =
                'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
            container.appendChild(this.labelRenderer.domElement);
        }

        // ---- Resize handler ----
        window.addEventListener('resize', () => this._resize(container));
    },

    _resize(container) {
        const w = container.clientWidth  || 512;
        const h = container.clientHeight || 384;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        if (this.labelRenderer) this.labelRenderer.setSize(w, h);
    },

    render() {
        this.renderer.render(this.scene, this.camera);
        if (this.labelRenderer) {
            this.labelRenderer.render(this.scene, this.camera);
        }
    },
};
