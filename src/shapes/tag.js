((core) => {
    core.Tag = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Tag';
            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var width = this.getWidth(),
                height = this.getHeight(),
                pointerDirection = this.getPointerDirection(),
                pointerWidth = this.getPointerWidth(),
                pointerHeight = this.getPointerHeight(),
                cornerRadius = Math.min(this.getCornerRadius(), width / 2, height / 2);

            context.beginPath();
            if (!cornerRadius) {
                context.moveTo(0, 0);
            } else {
                context.moveTo(cornerRadius, 0);
            }

            if (pointerDirection === 'up') {
                context.lineTo((width - pointerWidth) / 2, 0);
                context.lineTo(width / 2, -1 * pointerHeight);
                context.lineTo((width + pointerWidth) / 2, 0);
            }

            if (!cornerRadius) {
                context.lineTo(width, 0);
            } else {
                context.lineTo(width - cornerRadius, 0);
                context.arc(
                    width - cornerRadius,
                    cornerRadius,
                    cornerRadius,
                    Math.PI * 3 / 2,
                    0,
                    false
                );
            }

            if (pointerDirection === 'right') {
                context.lineTo(width, (height - pointerHeight) / 2);
                context.lineTo(width + pointerWidth, height / 2);
                context.lineTo(width, (height + pointerHeight) / 2);
            }

            if (!cornerRadius) {
                context.lineTo(width, height);
            } else {
                context.lineTo(width, height - cornerRadius);
                context.arc(
                    width - cornerRadius,
                    height - cornerRadius,
                    cornerRadius,
                    0,
                    Math.PI / 2,
                    false
                );
            }

            if (pointerDirection === 'down') {
                context.lineTo((width + pointerWidth) / 2, height);
                context.lineTo(width / 2, height + pointerHeight);
                context.lineTo((width - pointerWidth) / 2, height);
            }

            if (!cornerRadius) {
                context.lineTo(0, height);
            } else {
                context.lineTo(cornerRadius, height);
                context.arc(
                    cornerRadius,
                    height - cornerRadius,
                    cornerRadius,
                    Math.PI / 2,
                    Math.PI,
                    false
                );
            }

            if (pointerDirection === 'left') {
                context.lineTo(0, (height + pointerHeight) / 2);
                context.lineTo(-1 * pointerWidth, height / 2);
                context.lineTo(0, (height - pointerHeight) / 2);
            }

            if (cornerRadius) {
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
        },

        getSelfRect() {
            var x = 0,
                y = 0,
                pointerWidth = this.getPointerWidth(),
                pointerHeight = this.getPointerHeight(),
                direction = this.pointerDirection(),
                width = this.getWidth(),
                height = this.getHeight();

            if (direction === UP) {
                y -= pointerHeight;
                height += pointerHeight;
            } else if (direction === 'down') {
                height += pointerHeight;
            } else if (direction === 'left') {
                x -= pointerWidth * 1.5;
                width += pointerWidth;
            } else if (direction === 'right') {
                width += pointerWidth * 1.5;
            }

            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        }
    });

    core.util.addGetterSetter(core.Tag, 'pointerDirection', 'none');
    core.util.addGetterSetter(core.Tag, 'pointerWidth', 0);
    core.util.addGetterSetter(core.Tag, 'pointerHeight', 0);
    core.util.addGetterSetter(core.Tag, 'cornerRadius', 0);


})(window.Grim);