(function() {
    /**
     * SpotLightShadow
     * @class
     */
    var SpotLightShadow = function() {
        SpotLightShadow.superClass.constructor.call(this);

        this.renderTarget = new zen3d.RenderTarget2D(this.mapSize.x, this.mapSize.y);

        var map = this.renderTarget.texture;
        map.generateMipmaps = false;
        map.minFilter = zen3d.WEBGL_TEXTURE_FILTER.LINEAR;
        this.map = map;

        this._lookTarget = new zen3d.Vector3();

        this._up = new zen3d.Vector3(0, 1, 0);
    }

    zen3d.inherit(SpotLightShadow, zen3d.LightShadow);

    /**
     * update by light
     */
    SpotLightShadow.prototype.update = function(light) {
        this._updateCamera(light);
        this._updateMatrix();

        // TODO check size change, remove this from loop
        if(this.mapSize.x !== this.renderTarget.width || this.mapSize.y !== this.renderTarget.height) {
            this.renderTarget.resize(this.mapSize.x, this.mapSize.y);
        }
    }

    /**
     * update camera matrix by light
     */
    SpotLightShadow.prototype._updateCamera = function(light) {
        var camera = this.camera;
        var lookTarget = this._lookTarget;

        // set camera position and lookAt(rotation)
        light.getWorldDirection(this._lookTarget);
        camera.position.setFromMatrixPosition(light.worldMatrix);
        lookTarget.set(lookTarget.x + camera.position.x, lookTarget.y + camera.position.y, lookTarget.z + camera.position.z);
        camera.setLookAt(lookTarget, this._up);

        // update view matrix
        camera.updateMatrix(); // just copy matrix to world matrix
        camera.viewMatrix.getInverse(camera.worldMatrix);

        // update projection
        // TODO distance should be custom?
        camera.setPerspective(light.angle * 2, 1, this.cameraNear, this.cameraFar);
    }

    /**
     * update shadow matrix
     */
    SpotLightShadow.prototype._updateMatrix = function() {
        var matrix = this.matrix;
        var camera = this.camera;

        // matrix * 0.5 + 0.5, after identity, range is 0 ~ 1 instead of -1 ~ 1
        matrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );

        matrix.multiply(camera.projectionMatrix);
        matrix.multiply(camera.viewMatrix);
    }

    zen3d.SpotLightShadow = SpotLightShadow;
})();