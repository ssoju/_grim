((core) => {
    var
        LISTENING = 'listening',
        MOUSEENTER = 'mouseenter',
        MOUSELEAVE = 'mouseleave',
        SHAPE = 'Shape',
        STAGE = 'stage',
        TRANSFORM = 'transform',
        UPPER_STAGE = 'Stage',
        VISIBLE = 'visible';

    core.Node = core.BaseClass.extend({
        $mixins: [core.EventEmitter],
        $statics: {
            TRANSFORM_CHANGE: 'transformChange',
            SCALE_CHANGE: 'scaleChange',
            VISIBLE_CHANGE: 'visibleCahnge',
            LISTENING_CHANGE: 'listeningChange',
            OPACITY_CHANGE: 'opacityChange'
        },
        initialize(options) {
            options = options || {};

            this._id = core.getNextId();
            this._attrs = {};
            this._cache = {};
            this._filterUpToDate = false;
            this._isUnderCache = false;

            this.attr(options);
            this._bindEvents();
        },

        getId() {
            return this._id;
        },

        _bindEvents() {
            this.on(core.Node.TRANSFORM_CHANGE, function () {
                this.clearCache('transform')
            })
        },

        _clearCache(attr) {
            if (attr) {
                delete this._cache[attr];
            } else {
                this._cache = {};
            }
        },

        getCache(attr, privateGetter) {
            var cache = this._cache[attr];

            if (cache === undefined) {
                this._cache[attr] = privateGetter.call(this);
            }

            return this._cache[attr];
        },

        clearSelfAndDescendantCache(attr) {
            this._clearCache(attr);

            core.each(this.getChildren(), (node) => {
                node.clearSelfAndDescendantCache(attr);
            });
        },

        clearCache() {
            delete this._cache.canvas;
            this._filterUpToDate = false;
            return this;
        },

        cache(options) {
            options = options || {};

            var rect = this.getClientRects({
                    skipTransform: true,
                    relativeTo: this.getParent()
                }),
                width = options.width || rect.width,
                height = options.height || rect.height,
                pixelRatio = options.pixelRatio,
                x = options.x || rect.x,
                y = options.y || rect.y,
                offset = options.offset || 0,
                drawBorder = options.drawBorder;

            if (!width || !height) {
                setTimeout(() => {
                    core.throw('cant width, height is not 0')
                });
                return;
            }

            width += offset * 2;
            height += offset * 2;

            x -= offset;
            y -= offset;

            var cachedSceneCanvas = new core.SceneCanvas({
                pixelRatio,
                width,
                height
            });

            var cachedFiltrCanvas = new core.SceneCanvas({
                pixelRatio,
                width,
                height
            });

            var cachedHitCanvas = new core.HitCanvas({
                pixelRatio: 1,
                width,
                height
            });

            var sceneContext = cachedSceneCanvas.getContext(),
                hitContext = cachedHitCanvas.getContext();

            cachedHitCanvas.isCache = true;

            this.clearCache();

            sceneContext.save();
            hitContext.save();

            sceneContext.translate(-x, -y);
            hitContext.translate(-x, -y);


            this._isUnderCache = true;
            this.clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
            this.clearSelfAndDescendantCache(ABSOLUTE_SCALE);

            this.drawScene(cachedSceneCanvas, this, true);
            this.drawHit(cachedHitCanvas, this, true);

            if (drawBorder) {
                sceneContext.save();
                sceneContext.beginPath();
                sceneContext.rect(0, 0, width, height);
                sceneContext.closePath();
                sceneContext.attr('strokeStyle', 'red');
                sceneContext.attr('lineWidth', 5);
                sceneContext.stroke();
                sceneContext.restore();
            }

            this._cache.canvas = {
                scene: cachedSceneCanvas,
                filter: cachedFiltrCanvas,
                hit: cachedHitCanvas,
                x,
                y
            };

            return this;
        },

        getClientRect() {
            throw new Error('abstract "getClientRect" method call');
        },

        _transformedRect(rect, top) {
            var points = [
                {x: rect.x, y: rect.y},
                {x: rect.x + rect.width, y: rect.y},
                {x: rect.x + rect.width, y: rect.y + rect.height},
                {x: rect.x, y: rect.y + rect.height}
            ];

            var minX, minY, maxX, maxY;
            var trans = this.getAbsoluteTransform(top);

            points.forEach((point) => {
                var transformed = trans.point(point);

                if (minX === undefined) {
                    minX = maxX = transformed.x;
                    minY = maxY = transformed.y;
                }

                minX = Math.min(minX, transformed.x);
                minY = Math.min(minY, transformed.y);
                maxX = Math.max(maxX, transformed.x);
                maxY = Math.max(maxY, transformed.y);
            });

            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        },

        _drawCachedSceneCanvas(context) {
            var cachedCanvas = this._getCachedSceneCanvas();
            var ratio = cachedCanvas.pixelRatio;

            context.save();
            context.applyOpacity(this);
            context.applyGlobalCompositeOparation(this);
            context.translate(this._cache.canvas.x, this._cache.canvas.y);
            context.drawImage(
                cachedCanvas.getCanvas(),
                0,
                0,
                cachedCanvas.width / ratio,
                cachedCanvas.height / ratio
            );
            context.restore();
        },

        _drawCachedHitCanvas(context) {
            var cachedCanvas = this._cache.canvas,
                hitCanvas = cachedCanvas.hit;

            context.save();
            context.translate(cachedCanvas.x, cachedCanvas.y);
            context.drawImage(hitCanvas.getCanvas(), 0, 0);
            context.restore();
        },

        _getCachedSceneCanvas() {
            var filters = this.filters(),
                cachedCanvas = this._cache.canvas,
                sceneCanvas = cachedCanvas.scene,
                filterCanvas = cachedCanvas.filter,
                filterContext = filterCanvas.getContext(),
                len,
                imageData,
                n,
                filter;

            if (filters) {
                if (!this._filterUpToDate) {
                    var ratio = sceneCanvas.pixelRatio;

                    try {
                        len = filters.length;
                        filterContext.clear();

                        filterContext.drawImage(
                            sceneCanvas.getCanvas(),
                            0,
                            0,
                            sceneCanvas.getWidth() / ratio,
                            sceneCanvas.getHeight() / ratio
                        );

                        imageData = filterContext.getImageData(
                            0,
                            0,
                            filterCanvas.getWidth() / ratio,
                            filterCanvas.getHeight() / ratio
                        );

                        for (n = 0; n < len; n++) {
                            filter = filters[n];

                            if (!core.isFunction(filter)) {
                                core.error('Filter should be type of function');
                                continue;
                            }
                            filter.call(this, imageData);
                            filterContext.putImageData(imageData, 0, 0);
                        }
                    } catch (e) {
                        core.error('unable to apply filter. ' + e.message);
                    }

                    this._filterUpToDate = true;
                }

                return filterCanvas;
            }

            return sceneCanvas;
        },
        remove() {
            var parent = this.getParent();

            if (parent && parent.getChildren()) {
                parent.getChildren().splice(this.index, 1);
                parent._setChildrenIndices();
                delete this.parent;
            }

            this._clearSelfAndDecendantCache(STAGE);
            this._clearSelfAndDecendantCache(ABSOLUTE_TRANSFORM);
            this._clearSelfAndDecendantCache(VISIBLE);
            this._clearSelfAndDecendantCache(LISTENING);
            this._clearSelfAndDecendantCache(ABOUT_OPACITY);

            return this;
        },

        destroy() {
            var id = this.getId();

            core.removeId(id);
            core.each(this.getName().split(/\s/g), (subname) => {
                core.removeName(subname, id);
            });

            this.remove();
            return this;
        },

        attr(attr, value) {
            var method;

            if (value === undefined) {
                method = 'get' + core.capitalize(attr);
                if (core.isFunction(this[method])) {
                    return this[method]();
                }
                return this._attrs[attr];
            } else {
                method = 'set' + core.capitalize(attr);
                this[method](value);
            }
        },
        
        attrs(value) {
            if (value === undefined) {
                return this._attrs || {};
            } else {
                core.each(value, (val, key) => {
                    this.attr(key, val);
                });
            }
        },

        getAncestors() {
            var parent = this.getParent(),
                ancestors = [];

            while (parent) {
                ancestors.push(parent);
                parent = parent.getParent();
            }

            return ancestors;
        },

        isListening() {
            return this.getCache(LISTENING, this._IsListening);
        },

        _isListening() {
            var listening = this.getListening(),
                parent = this.getParent();

            if (listening === 'inherit') {
                if (parent) {
                    return parent.isListening();
                } else {
                    return true;
                }
            } else {
                return listening;
            }
        },

        isVisible() {
            return this._getCache(VISIBLE, this._isVisible);
        },

        _isVisible() {
            var visible = this.getVisible(),
                parent = this.getParent();

            if (visible === 'inherit') {
                if (parent) {
                    return parent.isVisible();
                } else {
                    return true;
                }
            } else {
                return visible;
            }
        },

        shouldDrawHit(canvas) {
            var layer = this.getLayer();

            return (
                (canvas && canvas.isCache) ||
                (layer &&
                    layer.hitGraphEnabled() &&
                    this.isListening() &&
                    this.isVisible()
                )
            );
        },

        show() {
            this.setVisible(true);
            return this;
        },

        hide() {
            this.setVisible(false);
            return this;
        },

        getZIndex() {
            return this.index || 0;
        },

        getAbsoluteZIndex() {
            var depth = this.getDepth(),
                self = this,
                index = 0,
                nodes,
                len,
                n;

            function addChildren(children) {
                nodes = [];
                len = children.length;
                core.each(children, (child) => {
                    index++;

                    if (child.nodeType !== SHAPE) {
                        nodes = nodes.concat(core.toArray(child.getChildren()));
                    }

                    if (child._id === self._id) {
                        n = len;
                    }
                });

                if (nodes.length && nodes[0].getDepth() <= depth) {
                    addChildren(nodes);
                }
            }

            if (self.nodeType !== UPPER_STAGE) {
                addChildren(self.getStage().getChildren());
            }

            return index;
        },

        getDepth() {
            var depth = 0,
                parent = this.getParent();

            while(parent) {
                depth++;
                parent = parent.getParent();
            }
            return depth;
        },

        setPosition(pos) {
            this.setX(pos.x);
            this.setY(pos.y);
            return this;
        },

        getPosition() {
            return {
                x: this.getX(),
                y: this.getY()
            };
        },

        getAbsolutePosition(top) {
            var absoluteMatrix = this.getAbsoluteTransform(top).getMatrix(),
                absoluteTransform = new core.Transform(),
                offset = this.offset();

            absoluteTransform.m = absoluteMatrix.slice();
            absoluteTransform.translate(offset.x, offset.y);

            return absoluteTransform.getTranslation();
        },

        setAbsolutePosition(pos) {
            var originTrans = this._clearTransform(),
                it;

            this._attrs.x = originTrans.x;
            this._attrs.y = originTrans.y;
            delete originTrans.x;
            delete originTrans.y;

            it = this.getAbsoluteTransform();

            it.invert();
            it.translate(pos.x, pos.y);
            pos = {
                x: this._attrs.x + it.getTranslation().x,
                y: this._attrs.y + it.getTranslation().y
            };

            this.setPosition(pos);
            this._setTransform(originTrans);

            return this;
        },

        _setTransform(trans) {
            core.each(trans, (val, key) => {
                this._attrs[key] = val;
            });

            this._clearCache(TRANSFORM);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
        },

        _getMethod(name) {
            return this['get' + core.capitalize(name)]();
        },

        _clearTransform() {
            var trans = {};

            core.each([
                'x',
                'y',
                'rotation',
                'scaleX',
                'scaleY',
                'offsetX',
                'offsetY',
                'skewX',
                'skewY'
            ], (item) => {
                trans['get' + core.firstUpperCase(item)]();
                this._attrs[item] = item.indexOf('scale') + 1; // only scale => 1
            });

            this._clearCache(TRANSFORM);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);

            return trans;
        },

        move(change) {
            var {x: changeX, y: changeY} = change;
            var x = this.getX();
            var y = this.getY();

            if (changeX !== undefined) {
                x += changeX;
            }

            if (changeY !== undefined) {
                y += changeY;
            }

            this.setPosition({x, y});
            return this;
        },

        _clearSelfAndDescendantCache(attr) {

        },

        getAbsoluteTransform() {

        },

        getTranslation() {

        },

        drawScene() {

        },

        drawHit() {

        }

    });

})(window.Grim);