((core) => {
    core.Layer = core.BaseLayer.extend({
        initialize(options) {
            this.nodeType = 'Layer';
            this.canvas = new core.SceneCanvas();
            this.hitCanvas = new core.HitCanvas({
                pixelRatio: 1
            });
        },

        setCanvasSize(width, height) {
            this.canvas.setSize(width, height);
            this.hitCanvas.setSize(width, height);
        },

        _validateAdd(child) {
            var type = child.getType();

            if (type !== 'Group' && type !== 'Shape') {
                core.throw('You may only add groups and shapes to a layer.');
            }
        },

        getIntersection(pos, selector) {
            var obj, i, intersectionOffset, shape;

            if (!this.hitGraphEnabled() || !this.isVisible()) {
                return null;
            }
            // in some cases antialiased area may be bigger than 1px
            // it is possible if we will cache node, then scale it a lot
            // TODO: check { 0; 0 } point before loop, and remove it from INTERSECTION_OFFSETS.
            var spiralSearchDistance = 1;
            var continueSearch = false;
            while (true) {
                for (i = 0; i < INTERSECTION_OFFSETS_LEN; i++) {
                    intersectionOffset = INTERSECTION_OFFSETS[i];
                    obj = this._getIntersection({
                        x: pos.x + intersectionOffset.x * spiralSearchDistance,
                        y: pos.y + intersectionOffset.y * spiralSearchDistance
                    });
                    shape = obj.shape;
                    if (shape && selector) {
                        return shape.findAncestor(selector, true);
                    } else if (shape) {
                        return shape;
                    }
                    // we should continue search if we found antialiased pixel
                    // that means our node somewhere very close
                    continueSearch = !!obj.antialiased;
                    // stop search if found empty pixel
                    if (!obj.antialiased) {
                        break;
                    }
                }
                // if no shape, and no antialiased pixel, we should end searching
                if (continueSearch) {
                    spiralSearchDistance += 1;
                } else {
                    return null;
                }
            }
        },

        _getImageData(x, y) {
            var width = this.hitCanvas.width || 1,
                height = this.hitCanvas.height || 1,
                index = Math.round(y) * width + Math.round(x);

            if (!this._hitImageData) {
                this._hitImageData = this.hitCanvas.context.getImageData(
                    0,
                    0,
                    width,
                    height
                );
            }

            return [
                this._hitImageData.data[4 * index + 0], // Red
                this._hitImageData.data[4 * index + 1], // Green
                this._hitImageData.data[4 * index + 2], // Blue
                this._hitImageData.data[4 * index + 3] // Alpha
            ];
        },
        _getIntersection(pos) {
            var ratio = this.hitCanvas.pixelRatio;
            var p = this.hitCanvas.context.getImageData(
                Math.round(pos.x * ratio),
                Math.round(pos.y * ratio),
                1,
                1
                ).data,
                p3 = p[3],
                colorKey,
                shape;

            if (p3 === 255) {
                colorKey = core.util.rgbToHex(p[0], p[1], p[2]);
                shape = core.states.shapes[HASH + colorKey];
                if (shape) {
                    return {
                        shape: shape
                    };
                }
                return {
                    antialiased: true
                };
            } else if (p3 > 0) {
                // antialiased pixel
                return {
                    antialiased: true
                };
            }
            // empty pixel
            return {};
        },
        drawScene(can, top) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas());

            this.fire(BEFORE_DRAW, {
                node: this
            });

            if (this.getClearBeforeDraw()) {
                canvas.getContext().clear();
            }

            core.supr(canvas, top);

            this.fire(DRAW, {
                node: this
            });

            return this;
        },
        drawHit(can, top) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.hitCanvas);

            if (layer && layer.getClearBeforeDraw()) {
                layer
                    .getHitCanvas()
                    .getContext()
                    .clear();
            }

            this.supr(canvas, top);
            this.imageData = null; // Clear imageData cache
            return this;
        },
        clear(bounds) {
            this.supr(bounds);
            this.hitCanvas
                .getContext()
                .clear(bounds);
            this.imageData = null; // Clear getImageData cache
            return this;
        },

        setVisible(visible) {
            this.supr(visible);
            if (visible) {
                this.canvas.getElement().style.display = 'block';
                this.hitCanvas.getElement().style.display = 'block';
            } else {
                this.canvas.getElement().style.display = 'none';
                this.hitCanvas.getElement().style.display = 'none';
            }
            return this;
        },

        enableHitGraph() {
            this.setHitGraphEnabled(true);
            return this;
        },

        disableHitGraph() {
            this.setHitGraphEnabled(false);
            return this;
        },

        setSize(width, height) {
            this.supr(width, height);
            this.hitCanvas.setSize(width, height);
            return this;
        }
    });

    core.addGetterSetter(core.Layer, 'hitGraphEnabled', true);

})(window.Grim);