((core) => {
    var PIx2 = Math.PI * 2 - 0.0001,
        ELLIPSE = 'Ellipse';

    core.Ellipse = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = ELLIPSE;
            this.sceneFunc(this._sceneFunc);
        },


        _sceneFunc(context) {
            var rx = this.getRadiusX(),
                ry = this.getRadiusY();

            context.beginPath();
            context.save();
            if (rx !== ry) {
                context.scale(1, ry / rx);
            }
            context.arc(0, 0, rx, 0, PIx2, false);
            context.restore();
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth() {
            return this.getRadiusX() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight() {
            return this.getRadiusY() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth(width) {
            this.supr(width);
            this.setRadius({
                x: width / 2
            });
        },
        // implements Shape.prototype.setHeight()
        setHeight(height) {
            this.supr(height);
            this.setRadius({
                y: height / 2
            });
        }
    });

    core.util.addComponentsGetterSetter(core.Ellipse, 'radius', ['x', 'y']);
    core.util.addGetterSetter(core.Ellipse, 'radiusX', 0);
    core.util.addGetterSetter(core.Ellipse, 'radiusY', 0);
})(window.Grim);