((core) => {
    var PIx2 = Math.PI * 2 - 0.0001;

    core.Ring = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Ring';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            context.beginPath();
            context.arc(0, 0, this.getInnerRadius(), 0, PIx2, false);
            context.moveTo(this.getOuterRadius(), 0);
            context.arc(0, 0, this.getOuterRadius(), PIx2, 0, true);
            context.closePath();
            context.fillStrokeShape(this);
        },

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
        },

        setOuterRadius(val) {
            this.attr('outerRadius', val);
            this.setWidth(val * 2);
            this.setHeight(val * 2);
        }
    });

    core.util.addGetterSetter(core.Ring, 'innerRadius', 0);
    core.util.addGetter(core.Ring, 'outerRadius', 0);
    core.util.addOverloadedGetterSetter(core.Ring, 'outerRadius');


})(window.Grim);