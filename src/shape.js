((core) => {
    var HAS_SHADOW = 'hasShadow';
    var SHAROW_RGBA = 'shadowRGBA';

    core.Shape = core.Node.extend({
        initialize(options) {
            options = options || {};

            this.nodeType = 'Shape';

            var shapes = code.states.shapes;
            var key;

            while(true) {
                key = core.util.getRandomColor();
                if (key && !(key in shapes)) {
                    break;
                }
            }

            this.colorKey = key;
            shapes[key] = this;

            this.on('shadowColorChange shadowBlurChange shadowOffsetChange shadowOpacityChange shadowEnabledChange', (e) => {
                this.clearCache(HAS_SHADOW);
            });

            this.on('shadowColorChange shadowOpacityChange shadowEnabledChange', (e) => {
                this.clearCache(SHAROW_RGBA);
            });
        },

        hasChildren() {
            return false;
        },

        getChildren() {
            return [];
        },

        getContext() {
            return this.getLayer().getContext();
        },

        getCanvas() {
            this.getLayer().getCanvas();
        },

        hasShadow() {
            return this.getCache(HAS_SHADOW, this._hasShadow);
        },

        _hasShadow() {
            return (
                this.getShadowEnabled() &&
                (this.getShadowOpacity() !== 0 &&
                    !!(
                        this.getShadowColor() ||
                        this.getShadowBlur() ||
                        this.getShadowOffsetX() ||
                        this.getShadowOffsetY()
                    )
                )
            );
        },

        getShadowRGBA() {
            return this.getCache(SHAROW_RGBA, this._getShadowRGBA);
        },

        _getShadowRGBA() {
            if (this.hasShadow()) {
                var rgba = core.util.colorToRGBA(this.shadowColor());

                return (
                    'rgba(' +
                        rgba.r + ', ' +
                        rgba.g + ', ' +
                        rgba.b + ', ' +
                        rgba.a * (this.getShadowOpacity() || 1) +
                    ')'
                );
            }
        },

        hasFill() {
            return !!(
                this.getFill() ||
                this.getFillPatternImage() ||
                this.getFillLinearGradientColorStops() ||
                this.getFillRadialGradientColorStops()
            );
        },

        hasStroke() {
            return (
                this.strokeEnabled() &&
                !!(this.stroke() || this.getStrokeLinearGradientColorStops())
            )
        },

        interscts(point) {
            var stage = this.getStage(),
                bufferHitCanvas = stage.bufferHitCanvas,
                p;

            bufferHitCanvas.getContext().clear();
            this.drawHit(bufferHitCanvas);
            p = bufferHitCanvas.context.getImageData(
                Math.round(point.x),
                Math.round(point.y),
                1,
                1
            ).data;
            return p[3] > 0;
        },

        destroy() {
            this.supr();
            delete core.states.shapes[this.colorKey];
            return this;
        },

        _useBufferCanvas(caching) {
            return (
                (!caching &&
                    (this.perfectDrawEnabled() &&
                        this.getAbsoluteOpacity() !== 1 &&
                        this.hasFill() &&
                        this.hasStroke() &&
                        this.getStage())) ||
                (this.perfectDrawEnabled() &&
                    this.hasShadow() &&
                    this.getAbsoluteOpacity() !== 1 &&
                    this.hasFill() &&
                    this.hasStroke() &&
                    this.getStage())
            );
        },

        getSelfRect() {
            var size = this.getSize();
            return {
                x: this._centroid ? Math.round(-size.width / 2) : 0,
                y: this._centroid ? Math.round(-size.height / 2) : 0,
                width: size.width,
                height: size.height
            };
        },

        getClientRect(attrs) {
            attrs = attrs || {};
            var skipTransform = attrs.skipTransform;
            var relativeTo = attrs.relativeTo;

            var fillRect = this.getSelfRect();

            var strokeWidth = (this.hasStroke() && this.strokeWidth()) || 0;
            var fillAndStrokeWidth = fillRect.width + strokeWidth;
            var fillAndStrokeHeight = fillRect.height + strokeWidth;

            var shadowOffsetX = this.hasShadow() ? this.shadowOffsetX() : 0;
            var shadowOffsetY = this.hasShadow() ? this.shadowOffsetY() : 0;

            var preWidth = fillAndStrokeWidth + Math.abs(shadowOffsetX);
            var preHeight = fillAndStrokeHeight + Math.abs(shadowOffsetY);

            var blurRadius = (this.hasShadow() && this.shadowBlur()) || 0;

            var width = preWidth + blurRadius * 2;
            var height = preHeight + blurRadius * 2;

            // if stroke, for example = 3
            // we need to set x to 1.5, but after Math.round it will be 2
            // as we have additional offset we need to increase width and height by 1 pixel
            var roundingOffset = 0;
            if (Math.round(strokeWidth / 2) !== strokeWidth / 2) {
                roundingOffset = 1;
            }
            var rect = {
                width: width + roundingOffset,
                height: height + roundingOffset,
                x:
                -Math.round(strokeWidth / 2 + blurRadius) +
                Math.min(shadowOffsetX, 0) +
                fillRect.x,
                y:
                -Math.round(strokeWidth / 2 + blurRadius) +
                Math.min(shadowOffsetY, 0) +
                fillRect.y
            };
            if (!skipTransform) {
                return this._transformedRect(rect, relativeTo);
            }
            return rect;
        },

        drawScene(can, top, caching, skipBuffer) {
            var layer = this.getLayer(),
                canvas = can || layer.getCanvas(),
                context = canvas.getContext(),
                cachedCanvas = this._cache.canvas,
                drawFunc = this.sceneFunc(),
                hasShadow = this.hasShadow(),
                hasStroke = this.hasStroke(),
                stage,
                bufferCanvas,
                bufferContext;

            if (!this.isVisible() && !caching) {
                return this;
            }
            if (cachedCanvas) {
                context.save();
                layer._applyTransform(this, context, top);
                this._drawCachedSceneCanvas(context);
                context.restore();
                return this;
            }
            if (!drawFunc) {
                return this;
            }
            context.save();
            // if buffer canvas is needed
            if (this._useBufferCanvas(caching) && !skipBuffer) {
                stage = this.getStage();
                bufferCanvas = stage.bufferCanvas;
                bufferContext = bufferCanvas.getContext();
                bufferContext.clear();
                bufferContext.save();
                bufferContext._applyLineJoin(this);
                // layer might be undefined if we are using cache before adding to layer
                if (!caching) {
                    if (layer) {
                        layer._applyTransform(this, bufferContext, top);
                    } else {
                        var m = this.getAbsoluteTransform(top).getMatrix();
                        context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                    }
                }

                drawFunc.call(this, bufferContext, this);
                bufferContext.restore();

                var ratio = bufferCanvas.pixelRatio;
                if (hasShadow && !canvas.hitCanvas) {
                    context.save();

                    context._applyShadow(this);
                    context._applyOpacity(this);
                    context._applyGlobalCompositeOperation(this);
                    context.drawImage(
                        bufferCanvas._canvas,
                        0,
                        0,
                        bufferCanvas.width / ratio,
                        bufferCanvas.height / ratio
                    );
                    context.restore();
                } else {
                    context._applyOpacity(this);
                    context._applyGlobalCompositeOperation(this);
                    context.drawImage(
                        bufferCanvas._canvas,
                        0,
                        0,
                        bufferCanvas.width / ratio,
                        bufferCanvas.height / ratio
                    );
                }
            } else {
                // if buffer canvas is not needed
                context._applyLineJoin(this);
                // layer might be undefined if we are using cache before adding to layer
                if (!caching) {
                    if (layer) {
                        layer._applyTransform(this, context, top);
                    } else {
                        var o = this.getAbsoluteTransform(top).getMatrix();
                        context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                    }
                }

                if (hasShadow && hasStroke && !canvas.hitCanvas) {
                    context.save();
                    // apply shadow
                    if (!caching) {
                        context._applyOpacity(this);
                        context._applyGlobalCompositeOperation(this);
                    }
                    context._applyShadow(this);

                    drawFunc.call(this, context, this);
                    context.restore();
                    // if shape has stroke we need to redraw shape
                    // otherwise we will see a shadow under stroke (and over fill)
                    // but I think this is unexpected behavior
                    if (this.hasFill() && this.getShadowForStrokeEnabled()) {
                        drawFunc.call(this, context, this);
                    }
                } else if (hasShadow && !canvas.hitCanvas) {
                    context.save();
                    if (!caching) {
                        context._applyOpacity(this);
                        context._applyGlobalCompositeOperation(this);
                    }
                    context._applyShadow(this);
                    drawFunc.call(this, context, this);
                    context.restore();
                } else {
                    if (!caching) {
                        context._applyOpacity(this);
                        context._applyGlobalCompositeOperation(this);
                    }
                    drawFunc.call(this, context, this);
                }
            }
            context.restore();
            return this;
        },

        drawHit(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || layer.hitCanvas,
                context = canvas.getContext(),
                drawFunc = this.hitFunc() || this.sceneFunc(),
                cachedCanvas = this._cache.canvas,
                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

            if (!this.shouldDrawHit(canvas) && !caching) {
                return this;
            }
            if (layer) {
                layer.clearHitCache();
            }
            if (cachedHitCanvas) {
                context.save();
                layer._applyTransform(this, context, top);
                this._drawCachedHitCanvas(context);
                context.restore();
                return this;
            }
            if (!drawFunc) {
                return this;
            }
            context.save();
            context._applyLineJoin(this);
            if (!caching) {
                if (layer) {
                    layer._applyTransform(this, context, top);
                } else {
                    var o = this.getAbsoluteTransform(top).getMatrix();
                    context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                }
            }
            drawFunc.call(this, context, this);
            context.restore();
            return this;
        },

        drawHitFromCache(alphaThreshold) {
            var threshold = alphaThreshold || 0,
                cachedCanvas = this._cache.canvas,
                sceneCanvas = this._getCachedSceneCanvas(),
                hitCanvas = cachedCanvas.hit,
                hitContext = hitCanvas.getContext(),
                hitWidth = hitCanvas.getWidth(),
                hitHeight = hitCanvas.getHeight(),
                hitImageData,
                hitData,
                len,
                rgbColorKey,
                i,
                alpha;

            hitContext.clear();
            hitContext.drawImage(sceneCanvas.getCanvas(), 0, 0, hitWidth, hitHeight);

            try {
                hitImageData = hitContext.getImageData(0, 0, hitWidth, hitHeight);
                hitData = hitImageData.data;
                len = hitData.length;
                rgbColorKey = core.util.hexToRgb(this.colorKey);

                for (i = 0; i < len; i += 4) {
                    alpha = hitData[i + 3];
                    if (alpha > threshold) {
                        hitData[i] = rgbColorKey.r;
                        hitData[i + 1] = rgbColorKey.g;
                        hitData[i + 2] = rgbColorKey.b;
                        hitData[i + 3] = 255;
                    } else {
                        hitData[i + 3] = 0;
                    }
                }
                hitContext.putImageData(hitImageData, 0, 0);
            } catch (e) {
                core.error(
                    'Unable to draw hit graph from cached scene canvas. ' + e.message
                );
            }

            return this;
        }
    });

    core.util.addGetterSetter(core.Shape, 'stroke');
    core.util.addGetterSetter(core.Shape, 'strokeWidth', 2);
    core.util.addGetterSetter(core.Shape, 'strokeHitEnabled', true);
    core.util.addGetterSetter(core.Shape, 'perfectDrawEnabled', true);
    core.util.addGetterSetter(core.Shape, 'shadowForStrokeEnabled', true);
    core.util.addGetterSetter(core.Shape, 'lineJoin');
    core.util.addGetterSetter(core.Shape, 'lineCap');
    core.util.addGetterSetter(core.Shape, 'sceneFunc');
    core.util.addGetterSetter(core.Shape, 'hitFunc');
    core.util.addGetterSetter(core.Shape, 'dash');
    core.util.addGetterSetter(core.Shape, 'dashOffset', 0);
    core.util.addGetterSetter(core.Shape, 'shadowColor');
    core.util.addGetterSetter(core.Shape, 'shadowBlur');
    core.util.addGetterSetter(core.Shape, 'shadowOpacity');
    core.util.addComponentsGetterSetter(core.Shape, 'shadowOffset', [
        'x',
        'y'
    ]);
    core.util.addGetterSetter(core.Shape, 'shadowOffsetX', 0);
    core.util.addGetterSetter(core.Shape, 'shadowOffsetY', 0);
    core.util.addGetterSetter(core.Shape, 'fillPatternImage');
    core.util.addGetterSetter(core.Shape, 'fill');
    core.util.addGetterSetter(core.Shape, 'fillPatternX', 0);
    core.util.addGetterSetter(core.Shape, 'fillPatternY', 0);
    core.util.addGetterSetter(core.Shape, 'fillLinearGradientColorStops');
    core.util.addGetterSetter(core.Shape, 'strokeLinearGradientColorStops');
    core.util.addGetterSetter(
        core.Shape,
        'fillRadialGradientStartRadius',
        0
    );
    core.util.addGetterSetter(core.Shape, 'fillRadialGradientEndRadius', 0);
    core.util.addGetterSetter(core.Shape, 'fillRadialGradientColorStops');
    core.util.addGetterSetter(core.Shape, 'fillPatternRepeat', 'repeat');
    core.util.addGetterSetter(core.Shape, 'fillEnabled', true);
    core.util.addGetterSetter(core.Shape, 'strokeEnabled', true);
    core.util.addGetterSetter(core.Shape, 'shadowEnabled', true);
    core.util.addGetterSetter(core.Shape, 'dashEnabled', true);
    core.util.addGetterSetter(core.Shape, 'strokeScaleEnabled', true);
    core.util.addGetterSetter(core.Shape, 'fillPriority', 'color');
    core.util.addComponentsGetterSetter(core.Shape, 'fillPatternOffset', [
        'x',
        'y'
    ]);
    core.util.addGetterSetter(core.Shape, 'fillPatternOffsetX', 0);
    core.util.addGetterSetter(core.Shape, 'fillPatternOffsetY', 0)
    core.util.addComponentsGetterSetter(core.Shape, 'fillPatternScale', [
        'x',
        'y'
    ]);
    core.util.addGetterSetter(core.Shape, 'fillPatternScaleX', 1);
    core.util.addGetterSetter(core.Shape, 'fillPatternScaleY', 1);
    core.util.addComponentsGetterSetter(
        core.Shape,
        'fillLinearGradientStartPoint',
        ['x', 'y']
    );
    core.util.addComponentsGetterSetter(
        core.Shape,
        'strokeLinearGradientStartPoint',
        ['x', 'y']
    );
    core.util.addGetterSetter(
        core.Shape,
        'fillLinearGradientStartPointX',
        0
    );
    core.util.addGetterSetter(
        core.Shape,
        'strokeLinearGradientStartPointX',
        0
    );
    core.util.addGetterSetter(
        core.Shape,
        'fillLinearGradientStartPointY',
        0
    );
    core.util.addGetterSetter(
        core.Shape,
        'strokeLinearGradientStartPointY',
        0
    );
    core.util.addComponentsGetterSetter(
        core.Shape,
        'fillLinearGradientEndPoint',
        ['x', 'y']
    );
    core.util.addComponentsGetterSetter(
        core.Shape,
        'strokeLinearGradientEndPoint',
        ['x', 'y']
    );
    core.util.addGetterSetter(core.Shape, 'fillLinearGradientEndPointX', 0);
    core.util.addGetterSetter(
        core.Shape,
        'strokeLinearGradientEndPointX',
        0
    );
    core.util.addGetterSetter(core.Shape, 'fillLinearGradientEndPointY', 0);
    core.util.addGetterSetter(
        core.Shape,
        'strokeLinearGradientEndPointY',
        0
    );
    core.util.addComponentsGetterSetter(
        core.Shape,
        'fillRadialGradientStartPoint',
        ['x', 'y']
    );
    core.util.addGetterSetter(
        core.Shape,
        'fillRadialGradientStartPointX',
        0
    );
    core.util.addGetterSetter(
        core.Shape,
        'fillRadialGradientStartPointY',
        0
    );
    core.util.addComponentsGetterSetter(
        core.Shape,
        'fillRadialGradientEndPoint',
        ['x', 'y']
    );
    core.util.addGetterSetter(core.Shape, 'fillRadialGradientEndPointX', 0);
    core.util.addGetterSetter(core.Shape, 'fillRadialGradientEndPointY', 0);
    core.util.addGetterSetter(core.Shape, 'fillPatternRotation', 0);
    core.Collection.mapMethods(core.Shape);
    
    
    
})(window.Grim);