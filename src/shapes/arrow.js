((core) => {
    core.Arrow = core.Line.extend({
        initialize(options) {
            this.supr(options);
            this.className = 'Arrow';
        },
        _sceneFunc(ctx) {
            this.supr(ctx);

            var PI2 = Math.PI * 2;
            var points = this.points();
            var tp = points;
            var fromTension() !== 0 && points.length > 4;

            if (fromTension) {
                tp = this.getTensionPoints();
            }


            var n = points.length;

            var dx, dy;
            if (fromTension) {
                dx = points[n - 2] - tp[n - 2];
                dy = points[n - 1] - tp[n - 1];
            } else {
                dx = points[n - 2] - points[n - 4];
                dy = points[n - 1] - points[n - 3];
            }

            var radians = (Math.atan2(dy, dx) + PI2) % PI2;
            var length = this.pointerLength();
            var width = this.pointerWidth();

            ctx.save();
            ctx.beginPath();
            ctx.translate(points[n - 2], points[n - 1]);
            ctx.rotate(radians);
            ctx.moveTo(0, 0);
            ctx.lineTo(-length, width / 2);
            ctx.lineTo(-length, -width / 2);
            ctx.closePath();
            ctx.restore();

            if (this.pointerAtBeginning()) {
                ctx.save();
                ctx.translate(points[0], points[1]);
                if (fromTension) {
                    dx = tp[0] - points[0];
                    dy = tp[1] - points[1];
                } else {
                    dx = points[2] - points[0];
                    dy = points[3] - points[1];
                }

                ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
                ctx.moveTo(0, 0);
                ctx.lineTo(-length, width / 2);
                ctx.lineTo(-length, -width / 2);
                ctx.closePath();
                ctx.restore();
            }

            // here is a tricky part
            // we need to disable dash for arrow pointers
            var isDashEnabled = this.dashEnabled();
            if (isDashEnabled) {
                // manually disable dash for head
                // it is better not to use setter here,
                // because it will trigger attr change event
                this.attrs.dashEnabled = false;
                ctx.setLineDash([]);
            }

            ctx.fillStrokeShape(this);

            // restore old value
            if (isDashEnabled) {
                this.attrs.dashEnabled = true;
            }
        }
    });
    
    core.util.addGetterSetter(core.Arrow, 'pointerLength', 10);
    core.util.addGetterSetter(core.Arrow, 'pointerWidth', 10);
    core.util.addGetterSetter(core.Arrow, 'pointerAtBeginning', false);

})(window.Grim);