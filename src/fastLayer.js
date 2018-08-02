((core) => {
    core.FastLayer = core.BaseLayer.extend({
        initialize(options) {
            this.canvas = new core.SceneCanvas();
            this.supr();
        },

        _validateAdd(child) {
            var type = child.getType();

            if (type !== 'shape') {
                core.throw('You may only add shapes to a fast layer');
            }
        },

        setCanvasSize(width, height) {
            this.canvas.setSize(width, height);
        },

        hitGraphEnabled() {
            return false;
        },

        getIntersection() {
            return null;
        },

        drawScene(can) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas());

            if (this.getClearBeforeDraw()) {
                canvas.getContext().clear();
            }

            this.supr();
            return this;
        },

        draw() {
            this.drawScene();
            return this;
        },

        setVisible(visible) {
            this.supr();

            if (visible) {
                this.canvas.getElement().style.display = 'block';
            } else {
                this.canvas.getElement().style.display = 'none';
            }
            return this;
        }

    });

})(window.Grim);