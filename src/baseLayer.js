((core) => {
    core.Baselayer = core.Container.extend({
        initialize(options) {
            options = options || {};

            this.nodeType = 'Layer';
            this.supr(options);
        },

        createPNGStream() {
            return this.canvas.getCanvas().createPNGStream();
        },

        getCanvas() {
            return this.canvas;
        },

        getHitCanvas() {
            return this.hitCanvas;
        },

        getContext() {
            return this.canvas.getContext();
        },

        clear(bounds) {
            this.getContext().clear(bounds);
            return this;
        },

        clearHitCache() {
            this._hitImageData = undefined;
        },

        setZIndex(index) {
            this.supr(index);

            var stage = this.getStage();
            if (stage) {
                stage.content.removeChild(this.canvas.getElement());

                if (index < stage.getChildren().length - 1) {
                    stage.content.insertBefore(
                        this.canvas.getElement(),
                        stage.getChildren()[index + 1].canvas.getElement()
                    );
                } else {
                    stage.content.appendChild(this.canvas.getElement());
                }
            }

            return this;
        },

        moveToTop() {
            this.supr();
            var stage = this.getStage();
            if (stage) {
                stage.content.removeChild(this.canvas.getElement());
                stage.content.appendChild(this.canvas.getElement());
            }
            return this;
        },

        moveUp: function() {
            var moved = this.supr();
            if (!moved) {
                return this;
            }

            var stage = this.getStage();
            if (!stage) {
                return this;
            }
            stage.content.removeChild(this.canvas.getElement());

            if (this.index < stage.getChildren().length - 1) {
                stage.content.insertBefore(
                    this.canvas.getElement(),
                    stage.getChildren()[this.index + 1].canvas.getElement()
                );
            } else {
                stage.content.appendChild(this.canvas.getElement());
            }
            return this;
        },

        moveDown: function() {
            if (this.supr()) {
                var stage = this.getStage();
                if (stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.canvas.getElement());
                    stage.content.insertBefore(
                        this.canvas.getElement(),
                        children[this.index + 1].canvas.getElement()
                    );
                }
            }
            return this;
        },

        moveToBottom: function() {
            if (this.supr()) {
                var stage = this.getStage();
                if (stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.getCanvas().getElement());
                    stage.content.insertBefore(
                        this.getCanvas().getElement(),
                        children[1].getCanvas().getElement()
                    );
                }
            }
            return this;
        },

        getLayer: function() {
            return this;
        },

        remove: function() {
            var _canvas = this.getCanvas().getElement();

            this.supr();

            if (_canvas && _canvas.parentNode && core.util.isInDocument(_canvas)) {
                _canvas.parentNode.removeChild(_canvas);
            }
            return this;
        },

        getStage: function() {
            return this.parent;
        },

        setSize: function(width, height) {
            this.canvas.setSize(width, height);
            return this;
        },

        getWidth: function() {
            if (this.parent) {
                return this.parent.getWidth();
            }
        },

        setWidth: function() {
            core.warn(
                'Can not change width of layer. Use "stage.width(value)" function instead.'
            );
        },

        getHeight: function() {
            if (this.parent) {
                return this.parent.getHeight();
            }
        },

        setHeight: function() {
            core.warn(
                'Can not change height of layer. Use "stage.height(value)" function instead.'
            );
        },

        _applyTransform: function(shape, context, top) {
            var m = shape.getAbsoluteTransform(top).getMatrix();
            context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        }
    });

    core.util.addGetterSetter(core.BaseLayer, 'clearBeforeDraw', true);

})(window.Grim);