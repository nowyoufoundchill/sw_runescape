// renderer/Camera.js
// Smooth-follow camera that tracks the player in 3D space.
// Maintains fixed angle: offset (0, CAM_OFFSET_Y, CAM_OFFSET_Z) from target.
const GameCamera = {
    // Current camera world position (lerped toward target)
    _cx: 0,
    _cy: RSC.CAM_OFFSET_Y,
    _cz: RSC.CAM_OFFSET_Z,

    // Follow speed (higher = snappier)
    FOLLOW_SPEED: 0.12,

    init(camera, initialX, initialZ) {
        const S = RSC.TILE_SIZE;
        this._cx = initialX + RSC.CAM_OFFSET_X;
        this._cy = RSC.CAM_OFFSET_Y;
        this._cz = initialZ + RSC.CAM_OFFSET_Z;
        camera.position.set(this._cx, this._cy, this._cz);
        camera.lookAt(initialX, RSC.CAM_LOOKAT_Y, initialZ);
    },

    // targetX, targetZ: current world-space target (player lerp position)
    update(camera, targetX, targetZ) {
        const desiredX = targetX + RSC.CAM_OFFSET_X;
        const desiredY = RSC.CAM_OFFSET_Y;
        const desiredZ = targetZ + RSC.CAM_OFFSET_Z;

        const k = this.FOLLOW_SPEED;
        this._cx += (desiredX - this._cx) * k;
        this._cy += (desiredY - this._cy) * k;
        this._cz += (desiredZ - this._cz) * k;

        camera.position.set(this._cx, this._cy, this._cz);
        camera.lookAt(targetX, RSC.CAM_LOOKAT_Y, targetZ);
    },
};
