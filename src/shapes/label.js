((core) => {
    var LABEL = 'Label';

    core.Label = core.Group.extend({
        initialize(options) {
            this.supr(options);

            this.className = LABEL;
            this.on('add', (evt) => {
                this._addListener(evt.child);
                this._sync();
            });
        },

        getText() {
            return this.find('Text')[0];
        },

        getTag() {
            return this.find('Tag')[0];
        },

        _addListeners(text) {
            var handler = () => {
                this._sunc();
            };

            core.each([
                'fontFamily',
                'fontSize',
                'fontStyle',
                'padding',
                'lineHeight',
                'text',
                'width'
            ], (item) => {
                this.on(item, handler);
            });
        },

        getWidth() {
            return this.getText().getWidth();
        },

        getHeight() {
            return this.getText().getHeight();
        },

        _sync() {
            var text = this.getText(),
                tag = this.getTag(),
                width,
                height,
                pointerDirection,
                pointerWidth,
                x,
                y,
                pointerHeight;

            if (text && tag) {
                width = text.getWidth();
                height = text.getHeight();
                pointerDirection = tag.getPointerDirection();
                pointerWidth = tag.getPointerWidth();
                pointerHeight = tag.getPointerHeight();
                x = 0;
                y = 0;

                switch (pointerDirection) {
                    case 'up:
                        x = width / 2;
                        y = -1 * pointerHeight;
                        break;
                    case 'right':
                        x = width + pointerWidth;
                        y = height / 2;
                        break;
                    case 'down':
                        x = width / 2;
                        y = height + pointerHeight;
                        break;
                    case 'left':
                        x = -1 * pointerWidth;
                        y = height / 2;
                        break;
                }

                tag.attrs({
                    x: -1 * x,
                    y: -1 * y,
                    width: width,
                    height: height
                });

                text.attrs({
                    x: -1 * x,
                    y: -1 * y
                });
            }
        }
    })
})(window.Grim);