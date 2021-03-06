(function() {

    var constant = function() {
        var renderViewport = this._renderViewport;
        var curViewX = renderViewport.x;
        var curViewY = renderViewport.y;
        var curViewW = renderViewport.z;
        var curViewH = renderViewport.w;

        var scaleFactor = this._scaleFactor;

        var resultX, resultY, resultW, resultH;
        resultX = curViewX;
        resultY = curViewY;
        resultW = curViewW;
        resultH = curViewH;

        this._resolutionSize.set(resultW * scaleFactor, resultH * scaleFactor);

        this.viewport.set(resultX, resultY, resultW, resultH);
    }

    var shrink = function() {
        var renderViewport = this._renderViewport;
        var curViewX = renderViewport.x;
        var curViewY = renderViewport.y;
        var curViewW = renderViewport.z;
        var curViewH = renderViewport.w;

        var resolutionSize = this._resolutionSize;

        var screenRate = (curViewW - curViewX) / (curViewH - curViewY);
        var resolutionRate = resolutionSize.x / resolutionSize.y;
        var widthBigger = resolutionRate > screenRate;
        var resultX, resultY, resultW, resultH;
        if(widthBigger) {
            resultW = curViewW;
            resultH = Math.floor(resultW / resolutionRate);
        } else {
            resultH = curViewH;
            resultW = Math.floor(resultH * resolutionRate);
        }
        resultX = Math.floor((curViewW - resultW) / 2) + curViewX;
        resultY = Math.floor((curViewH - resultH) / 2) + curViewY;

        this.viewport.set(resultX, resultY, resultW, resultH);
    }

    var expand = function() {
        var renderViewport = this._renderViewport;
        var curViewX = renderViewport.x;
        var curViewY = renderViewport.y;
        var curViewW = renderViewport.z;
        var curViewH = renderViewport.w;

        var resolutionSize = this._resolutionSize;

        var screenRate = (curViewW - curViewX) / (curViewH - curViewY);
        var resolutionRate = resolutionSize.x / resolutionSize.y;
        var widthBigger = resolutionRate > screenRate;
        var resultX, resultY, resultW, resultH;
        if(widthBigger) {
            resultH = curViewH;
            resultW = Math.floor(resultH * resolutionRate);
        } else {
            resultW = curViewW;
            resultH = Math.floor(resultW / resolutionRate);
        }
        resultX = Math.floor((curViewW - resultW) / 2) + curViewX;
        resultY = Math.floor((curViewH - resultH) / 2) + curViewY;

        this.viewport.set(resultX, resultY, resultW, resultH);
    }

    var SCREEN_MATCH_MODE = {
        CONSTANT: constant,
        SHRINK: shrink,
        EXPAND: expand
    };

    /**
     * Canvas2D
     */
    var Canvas2D = function(width, height, isScreenCanvas, screenMatchMode) {
        Canvas2D.superClass.constructor.call(this);

        this.type = zen3d.OBJECT_TYPE.CANVAS2D;

        this.frustumCulled = false;

        this.geometry = new zen3d.Geometry();
        this.buffer = new zen3d.InterleavedBuffer(new Float32Array(), 5);
        this.buffer.dynamic = true;
        this.geometry.addAttribute("a_Position", new zen3d.InterleavedBufferAttribute(this.buffer, 3, 0));
        this.geometry.addAttribute("a_Uv", new zen3d.InterleavedBufferAttribute(this.buffer, 2, 3));
        this.geometry.setIndex([]);

        this.geometry.usageType = zen3d.WEBGL_BUFFER_USAGE.DYNAMIC_DRAW;
        this.material = new zen3d.Canvas2DMaterial();

        this.sprites = [];
        this.drawArray = [];

        // screen space canvas or world space canvas
        this._isScreenCanvas = (isScreenCanvas !== undefined) ? isScreenCanvas : true;

        var width = (width !== undefined) ? width : 640;
        var height = (height !== undefined) ? height : 800;

        // the size in world space
        this._size = new zen3d.Vector2(width, height);

        // the resolution size of screen canvas
        this._resolutionSize = new zen3d.Vector2(width, height);
        // screen match mode
        this._screenMatchMode = screenMatchMode || SCREEN_MATCH_MODE.CONSTANT;
        // set the same size with the renderer viewport
        this._renderViewport = new zen3d.Vector4(0, 0, width, height);
        // if screen match mode is SCREEN_MATCH_MODE.CONSTANT, use this
        this._scaleFactor = 1;

        // real viewport after calculate with screen match mode
        this.viewport = new zen3d.Vector4();

        // screen canvas used ortho camera
        this.orthoCamera = new zen3d.Camera();
        this.orthoCamera.setOrtho(-width / 2, width / 2, -height / 2, height / 2, 0, 1);
        this.orthoCamera.viewMatrix.getInverse(this.orthoCamera.worldMatrix); // update view matrix
    }

    zen3d.inherit(Canvas2D, zen3d.Object3D);

    Object.defineProperties(Canvas2D.prototype, {
        isScreenCanvas: {
            get: function() {
                return this._isScreenCanvas;
            },
            set: function(value) {
                this._isScreenCanvas = value;
            }
        }
    });

    Canvas2D.prototype.setSize = function(width, height) {
        if(this._isScreenCanvas) {
            this._resolutionSize.set(width, height);
            this._screenMatchMode.call(this);
            this._updateCamera();
        } else {
            this._size.set(width, height);
        }
    }

    Canvas2D.prototype.setRenderViewport = function(x, y, w, h) {
        if(
            this._renderViewport.x !== x ||
            this._renderViewport.y !== y ||
            this._renderViewport.z !== w ||
            this._renderViewport.w !== h
        ) {
            this._renderViewport.set(x, y, w, h);
            this._screenMatchMode.call(this);
            this._updateCamera();
        }
    }

    Canvas2D.prototype.setScaleFactor = function(value) {
        if(this._scaleFactor !== value) {
            this._scaleFactor = value;
            this._screenMatchMode.call(this);
            this._updateCamera();
        }
    }

    Canvas2D.prototype.setScreenMatchMode = function(mode) {
        if(this._screenMatchMode !== mode) {
            this._screenMatchMode = mode;
            this._screenMatchMode.call(this);
            this._updateCamera();
        }
    }

    Canvas2D.prototype._updateCamera = function() {
        if(this._isScreenCanvas) {
            this.orthoCamera.setOrtho(-this._resolutionSize.x / 2, this._resolutionSize.x / 2, -this._resolutionSize.y / 2, this._resolutionSize.y / 2, 0, 1);
            this.orthoCamera.viewMatrix.getInverse(this.orthoCamera.worldMatrix); // update view matrix
        }
    }

    /**
     * add child to canvas2d
     */
    Canvas2D.prototype.add = function(object) {
        this.children.push(object);
    }

    /**
     * remove child from canvas2d
     */
    Canvas2D.prototype.remove = function(object) {
        var index = this.children.indexOf(object);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }

    var vertices = [];
    var indices = [];

    Canvas2D.prototype.updateSprites = function() {
        var vertexIndex = 0,
            indexIndex = 0;

        var sprites = this.sprites;

        var width = this._isScreenCanvas ? this._resolutionSize.x : this._size.x;
        var height = this._isScreenCanvas ? this._resolutionSize.y : this._size.y;

        for (var i = 0; i < sprites.length; i++) {
            var sprite = sprites[i];

            var x = 0;
            var y = 0;
            var w = sprite.width;
            var h = sprite.height;

            var _x, _y;
            var t = sprite.worldMatrix.elements;
            var a = t[0],
                b = t[1],
                c = t[3],
                d = t[4],
                tx = t[6] - width / 2,
                ty = height / 2 - t[7] - h;

            _x = x;
            _y = y;
            vertices[vertexIndex++] = a * _x + c * _y + tx;
            vertices[vertexIndex++] = b * _x + d * _y + ty;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 1;

            _x = x + w;
            _y = y;
            vertices[vertexIndex++] = a * _x + c * _y + tx;
            vertices[vertexIndex++] = b * _x + d * _y + ty;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 1;
            vertices[vertexIndex++] = 1;

            _x = x + w;
            _y = y + h;
            vertices[vertexIndex++] = a * _x + c * _y + tx;
            vertices[vertexIndex++] = b * _x + d * _y + ty;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 1;
            vertices[vertexIndex++] = 0;

            _x = x;
            _y = y + h;
            vertices[vertexIndex++] = a * _x + c * _y + tx;
            vertices[vertexIndex++] = b * _x + d * _y + ty;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 0;
            vertices[vertexIndex++] = 0;

            var vertCount = vertexIndex / 5 - 4;

            indices[indexIndex++] = vertCount + 0;
            indices[indexIndex++] = vertCount + 1;
            indices[indexIndex++] = vertCount + 2;
            indices[indexIndex++] = vertCount + 2;
            indices[indexIndex++] = vertCount + 3;
            indices[indexIndex++] = vertCount + 0;
        }

        vertices.length = vertexIndex;
        indices.length = indexIndex;

        var geometry = this.geometry;
        this.buffer.setArray(new Float32Array(vertices));
        geometry.index.setArray(new Uint16Array(indices));

        this.buffer.version++;
        geometry.index.version++;

        // drawArray
        this.drawArray = [];
        var currentTexture;
        for (var i = 0; i < sprites.length; i++) {
            var sprite = sprites[i];
            if (currentTexture !== sprite.texture) {
                this.drawArray.push({
                    texture: sprite.texture,
                    count: 1
                });
                currentTexture = sprite.texture;
            } else {
                this.drawArray[this.drawArray.length - 1].count++;
            }
        }

    }

    // override
    Canvas2D.prototype.updateMatrix = function() {
        Canvas2D.superClass.updateMatrix.call(this);

        this.sprites = [];

        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            this.cacheSprites(children[i]);
        }

        var sprites = this.sprites;
        for (var i = 0, l = sprites.length; i < l; i++) {
            sprites[i].updateMatrix();
        }

        // update geometry
        this.updateSprites();
    }

    Canvas2D.prototype.cacheSprites = function(object) {
        var sprites = this.sprites;

        sprites.push(object);

        for(var i = 0, l = object.children.length; i < l; i++) {
            this.cacheSprites(object.children[i]);
        }
    }

    Canvas2D.SCREEN_MATCH_MODE = SCREEN_MATCH_MODE;

    zen3d.Canvas2D = Canvas2D;
})();