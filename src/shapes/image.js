((core) => {
    var IMAGE = 'Image';

    core.Image = core.Shape.extend({
        initialize(options) {
            // call super constructor
            this.supr(options);
            this.className = IMAGE;
            this.sceneFunc(this._sceneFunc);
            this.hitFunc(this._hitFunc);
        },
        _useBufferCanvas() {
            return (
                (this.hasShadow() || this.getAbsoluteOpacity() !== 1) &&
                this.hasStroke() &&
                this.getStage()
            );
        },
        _sceneFunc(context) {
            var width = this.getWidth(),
                height = this.getHeight(),
                image = this.getImage(),
                cropWidth,
                cropHeight,
                params;

            if (image) {
                cropWidth = this.getCropWidth();
                cropHeight = this.getCropHeight();
                if (cropWidth && cropHeight) {
                    params = [
                        image,
                        this.getCropX(),
                        this.getCropY(),
                        cropWidth,
                        cropHeight,
                        0,
                        0,
                        width,
                        height
                    ];
                } else {
                    params = [image, 0, 0, width, height];
                }
            }

            if (this.hasFill() || this.hasStroke()) {
                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                context.fillStrokeShape(this);
            }

            if (image) {
                context.drawImage.apply(context, params);
            }
        },
        _hitFunc(context) {
            var width = this.getWidth(),
                height = this.getHeight();

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            context.fillStrokeShape(this);
        },
        getWidth() {
            var image = this.getImage();
            return this.attrs.width || (image ? image.width : 0);
        },
        getHeight() {
            var image = this.getImage();
            return this.attrs.height || (image ? image.height : 0);
        }
    });

    core.util.addGetterSetter(core.Image, 'image');
    core.util.addComponentsGetterSetter(core.Image, 'crop', [
        'x',
        'y',
        'width',
        'height'
    ]);
    core.util.addGetterSetter(core.Image, 'cropX', 0);
    core.util.addGetterSetter(core.Image, 'cropY', 0);
    core.util.addGetterSetter(core.Image, 'cropWidth', 0);
    core.util.addGetterSetter(core.Image, 'cropHeight', 0);
    core.Image.fromURL = function(url, callback) {
        var img = new Image();
        img.onload = function() {
            var image = new core.Image({
                image: img
            });
            callback(image);
        };
        img.crossOrigin = 'Anonymous';
        img.src = url;
    };

})(window.Grim);