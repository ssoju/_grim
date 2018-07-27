((core) => {
    var defaultStyle = {
        padding: 0,
        margin: 0,
        border: 0,
        background: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0
    };

    core.Canvas = core.BaseClass.extend({
        initialize(options) {
            options = options || {};

            this.pixelRatio = core.util.getPixelRatio();
            this.canvas = core.util.createCavasElement({
                style: defaultStyle
            });
        },

        getContext() {
            return this.context;
        },

        setWidth(width, update) {
            var pr = this.pixelRatio;

            this.canvas.style.width = this.width = width * pr;

            if (update !== false) {
                this.getContext()._context.scale(pr, pr);
            }

            return this;
        },

        getWidth() {
            return this.width;
        },

        setHeight(height) {
            var pr = this.pixelRatio;

            this.canvas.style.height = this.height = height * pr;


            if (update !== false) {
                this.getContext()._context.scale(pr, pr);
            }

            return this;
        },

        getHeight() {
            return this.height;
        },

        setSize(width, height) {
            this.setWidth(width, false);
            this.setHeight(height, false);

            this.getContext()._context.scale(pr, pr);
        },

        toDataURL: function(mimeType, quality) {
            try {
                return this.canvas.toDataURL(mimeType, quality);
            } catch (e) {
                try {
                    return this.canvas.toDataURL();
                } catch (err) {
                    core.warn('Unable to get data URL. ' + err.message);
                    return '';
                }
            }
        }
    });

    core.SceneCanvas = core.Canvas.extend({
        initialize(options) {
            options = options || {};

            this.supr(options);

            this.context = new core.SceneContext(this);
            this.setSize(options.width || 0, options.height || 0);
        }
    });


    core.HitCanvas = core.Canvas.extend({
        initialize(options) {
            options = options || {};

            this.supr(options);

            this.context = new core.SceneContext(this);
            this.setSize(options.width || 0, options.height || 0);
            this.hitCanvas = true;
        }
    })
})(window.Grim)