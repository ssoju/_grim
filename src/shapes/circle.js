((core) => {
    var PIx2 = Math.PI * 2 - 0.0001,
        CIRCLE = 'Circle';

    core.Circle = core.Shape.extend({
        initialize(options) {
            this.supr();
            this.className = CIRCLE;
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            context.beginPath();
            context.arc(0, 0, this.getRadius(), 0, PIx2, false);
            context.closePath();
            context.fillStrokeShape(this);
        },

        // implements Shape.prototype.getWidth()
        getWidth() {
            return this.getRadius() * 2;
        },

        // implements Shape.prototype.getHeight()
        getHeight() {
            return this.getRadius() * 2;
        },

        // implements Shape.prototype.setWidth()
        setWidth(width) {
            this.supr(width);

            if (this.radius() !== width / 2) {
                this.setRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight(height) {
            this.supr(height);
            if (this.radius() !== height / 2) {
                this.setRadius(height / 2);
            }
        }
    });

    core.util.addGetterSetter(core.Circle, 'radius', 0);
    core.util.addOverloadedGetterSetter(core.Circle, 'radius');

})(window.Grim);