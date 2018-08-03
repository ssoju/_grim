((core) => {
    core.RegularPolygon = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'RegularPolygon';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var sides = this.attrs.sides,
                radius = this.attrs.radius,
                n,
                x,
                y;

            context.beginPath();
            context.moveTo(0, 0 - radius);

            for (n = 1; n < sides; n++) {
                x = radius * Math.sin(n * 2 * Math.PI / sides);
                y = -1 * radius * Math.cos(n * 2 * Math.PI / sides);
                context.lineTo(x, y);
            }
            context.closePath();
            context.fillStrokeShape(this);
        },

        getWidth() {
            return this.getRadius() * 2;
        },

        getHeight() {
            return this.getRadius() * 2;
        },

        setWidth(width) {
            this.supr(width);
            if (this.radius() !== width / 2) {
                this.setRadius(width / 2);
            }
        },

        setHeight(height) {
            this.supr(height);
            if (this.radius() !== height / 2) {
                this.setRadius(height / 2);
            }
        }
    });

    core.util.addGetterSetter(core.RegularPolygon, 'radius', 0);
    core.util.addGetterSetter(core.RegularPolygon, 'sides', 0);

})(window.Grim);