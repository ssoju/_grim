((core) => {
    core.Arc = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Arc';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var angle = core.util.getAngle(this.getAngle()),
                clickwise = this.clockwise();

            context.beginPath();
            context.arc(0, 0, this.getOuterRadius(), 0, angle, clickwise);
            context.arc(0, 0, this.getInnerRadius(), angle, 0, !clickwise);
            context.closePath();
            context.fillStrokeShape(this);
        },

        getWidth() {
            return this.getOuterRadius() * 2;
        },

        getHeight() {
            return this.getOuterRadius() * 2;
        },

        setWidth(width) {
            this.supr(width);
            if (this.getOuterRadius() !== width / 2) {
                this.setOuterRadius(width / 2);
            }
        },

        setHeight(height) {
            this.supr(height);
            if (this.getOuterRadius() !== height / 2) {
                this.setOuterRadius(height / 2);
            }
        }
    });

    core.util.addGetterSetter(core.Arc, 'innerRadius', 0);
    core.util.addGetterSetter(core.Arc, 'outerRadius', 0);
    core.util.addGetterSetter(core.Arc, 'angle', 0);
    core.util.addGetterSetter(core.Arc, 'clockwise', 0);

})(window.Grim);