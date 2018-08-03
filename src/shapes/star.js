((core) => {
    core.Star = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Star';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var innerRadius = this.innerRadius(),
                outerRadius = this.outerRadius(),
                numPoints = this.numPoints();

            context.beginPath();
            context.moveTo(0, 0 - outerRadius);

            for (var n = 1; n < numPoints * 2; n++) {
                var radius = n % 2 === 0 ? outerRadius : innerRadius;
                var x = radius * Math.sin(n * Math.PI / numPoints);
                var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
                context.lineTo(x, y);
            }
            context.closePath();

            context.fillStrokeShape(this);
        },

        // implements Shape.prototype.getWidth()
        getWidth() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth(width) {
            this.supr(width);
            if (this.outerRadius() !== width / 2) {
                this.setOuterRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight(height) {
            this.supr(height);
            if (this.outerRadius() !== height / 2) {
                this.setOuterRadius(height / 2);
            }
        }
    });

    core.util.addGetterSetter(core.Star, 'numPoints', 5);
    core.util.addGetterSetter(core.Star, 'innerRadius', 0);
    core.util.addGetterSetter(core.Star, 'outerRadius', 0);

})(window.Grim);