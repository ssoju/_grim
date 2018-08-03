((core) => {
    core.Wedge = core.Shape.extend({
        initialize(options) {
            this.supr(options);
            this.className = 'Wedge';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc(context) {
            context.beginPath();
            context.arc(
                0,
                0,
                this.getRadius(),
                0,
                Konva.getAngle(this.getAngle()),
                this.getClockwise()
            );
            context.lineTo(0, 0);
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
    })
})(window.Grim);