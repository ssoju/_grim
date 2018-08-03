((core) => {
    core.Rect = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Rect';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var cornerRadius = this.getCornerRadius(),
                width = this.getWidth(),
                height = this.getHeight();

            context.beginPath();

            if (!cornerRadius) {
                // simple rect - don't bother doing all that complicated maths stuff.
                context.rect(0, 0, width, height);
            } else {
                // arcTo would be nicer, but browser support is patchy (Opera)
                cornerRadius = Math.min(cornerRadius, width / 2, height / 2);
                context.moveTo(cornerRadius, 0);
                context.lineTo(width - cornerRadius, 0);
                context.arc(
                    width - cornerRadius,
                    cornerRadius,
                    cornerRadius,
                    Math.PI * 3 / 2,
                    0,
                    false
                );
                context.lineTo(width, height - cornerRadius);
                context.arc(
                    width - cornerRadius,
                    height - cornerRadius,
                    cornerRadius,
                    0,
                    Math.PI / 2,
                    false
                );
                context.lineTo(cornerRadius, height);
                context.arc(
                    cornerRadius,
                    height - cornerRadius,
                    cornerRadius,
                    Math.PI / 2,
                    Math.PI,
                    false
                );
                context.lineTo(0, cornerRadius);
                context.arc(
                    cornerRadius,
                    cornerRadius,
                    cornerRadius,
                    Math.PI,
                    Math.PI * 3 / 2,
                    false
                );
            }
            context.closePath();
            context.fillStrokeShape(this);
        }
    });

    core.util.addGetterSetter(Konva.Rect, 'cornerRadius', 0);
    
})(window.Grim);