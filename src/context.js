((core) => {
    core.Context = core.BaseClass.extend({
        initialize(canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext('2d');
        },

        getCanvas() {
            return this.canvas;
        },

        getRawContext() {
            return this.context;
        },

        reset() {
            var pixelRatio = this.getCanvas().getPixelRatio();

            this.setTransform(1 * pixelRatio, 0, 0, 1 * pixelRatio, 0, 0);
        },

        clear(bounds) {
            var canvas = this.getCanvas();

            if (bounds) {
                this.clearRect(
                    bounds.x || 0,
                    bounds.y || 0,
                    bounds.width || 0,
                    bounds.height || 0
                );
            } else {
                this.clearRect(
                    0,
                    0,
                    canvas.getWidth() / canvas.pixelRatio,
                    canvas.getHeight() / canvas.pixelRatio
                );
            }
        },

        attr(name, value) {
            if (typeof value === 'undefined') {
                return this.context[name];
            } else {
                this.context[name] = value;
            }
        }
    });

    core.each([
        'arc',
        'arcTo',
        'beginPath',
        'bezierCurveTo',
        'clearRect',
        'clip',
        'closePath',
        'createImageData',
        'createLinearGradient',
        'createPattern',
        'createRadialGradient',
        'drawImage',
        'fill',
        'fillText',
        'fillRext',
        'getImageData',
        'isPointInPath',
        'lineTo',
        'moveTo',
        'putImageData',
        'quadraticCurveTo',
        'rect',
        'restore',
        'rotate',
        'save',
        'scale',
        'setLineDash',
        'setTransform',
        'stroke',
        'strokeText',
        'transform',
        'translate'
    ], function (item) {
        core.Context.prototype[item] = function () {
            return this.context[item]([].slice.apply(arguments));
        }
    });

    core.each([
        'fillStyle',
        'strokeStyle',
        'shadowColor',
        'shadowBlur',
        'shadowOffsetX',
        'shadowOffsetY',
        'lineCap',
        'lineDashOffset',
        'lineJoin',
        'lineWidth',
        'miterLimit',
        'font',
        'textAlign',
        'textBaseline',
        'globalAlpha',
        'globalCompositeOperation'
    ], function (item) {
        Object.defineProperty(core.Context.prototype, item, {
            get: function() {
                return this.context[item];
            },
            set: function(val) {
                this.context[item] = val;
            }
        });
    });

    core.SceneContext = core.Context.extend({

    });

    core.HitContext = core.Context.extend({

    });

})