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
            OPACITY_CHANGE: 'opacityChange',

            create: (data, container) => {
                if (core.isString(data)) {
                    data = JSON.parse(data);
                }
                return this._createNode(data, container);
            },

            _createNode: function (obj, container) {
                var className = core.Node.prototype.getClassName.call(obj),
                    children = obj.children,
                    no,
                    len,
                    n;

                // if container was passed in, add it to attrs
                if (container) {
                    obj._attrs.container = container;
                }

                no = new core[className](obj.attrs);
                if (children) {
                    len = children.length;
                    for (n = 0; n < len; n++) {
                        no.add(this._createNode(children[n]));
                    }
                }

                return no;
            }
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
                if (core.isFunction(this[method])) {
                    this[method](value);
                } else {
                    var oldVal = this._attrs[attr];
                    if (oldVal === value && !core.isJSON(value)) {
                        return;
                    }

                    if (value == null) {
                        delete this._attrs[attr];
                    } else {
                        this._attrs[attr] = value;
                    }

                    this._fireChangeEvent(attr, oldVal, value);
                }
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

            while (parent) {
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

        rotate(theta) {
            this.setRotation(this.getRotation() + theta);
            return this;
        },

        moveToTop() {
            if (!this.getParent()) {
                core.warn('node has no parent');
                return false;
            }

            var index = this.index;
            var parent = this.getParent();

            parent.children.splice(index, 1);
            parent.children.push(this);
            parent.setChildrenIndices();
        },

        moveUp() {
            var parent = this.getParent();

            if (!parent) {
                core.warn('node has no parent');
            }

            var index = this.index,
                len = parent.getChildren().length;

            if (index < len - 1) {
                parent.children.splice(index, 1);
                parent.children.splice(index + 1, 0, this);
                parent.setChildrenIndices();
                return true;
            }
            return false;
        },

        moveDown() {
            var parent = this.getParent();

            if (!parent) {
                core.warn('Node has no parent. moveDown function is ignored.');
                return false;
            }

            var index = this.index;
            if (index > 0) {
                parent.children.splice(index, 1);
                parent.children.splice(index - 1, 0, this);
                parent._setChildrenIndices();
                return true;
            }
            return false;
        },

        moveToBottom() {
            var parent = this.getParent();

            if (!parent) {
                core.warn(
                    'Node has no parent. moveToBottom function is ignored.'
                );
                return false;
            }

            var index = this.index;
            if (index > 0) {
                parent.children.splice(index, 1);
                parent.children.unshift(this);
                parent._setChildrenIndices();
                return true;
            }
            return false;
        },

        moveTo(newContainer) {
            // do nothing if new container is already parent
            if (this.getParent() !== newContainer) {
                // this.remove my be overrided by drag and drop
                // buy we need original
                (this.__originalRemove || this.remove).call(this);
                newContainer.add(this);
            }
            return this;
        },

        setZIndex(zIndex) {
            var parent = this.getParent();

            if (!parent) {
                core.warn('Node has no parent. zIndex parameter is ignored.');
                return false;
            }

            var index = this.index;
            parent.children.splice(index, 1);
            parent.children.splice(zIndex, 0, this);
            parent._setChildrenIndices();
            return this;
        },

        getAbsoluteOpacity() {
            return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
        },

        _getAbsoluteOpacity() {
            var absOpacity = this.getOpacity();
            var parent = this.getParent();
            if (parent && !parent._isUnderCache) {
                absOpacity *= parent.getAbsoluteOpacity();
            }
            return absOpacity;
        },

        toObject() {
            var obj = {},
                attrs = this.attrs(),
                key,
                val,
                getter,
                defaultValue;

            obj.attrs = {};

            for (key in attrs) {
                val = attrs[key];
                getter = typeof this[key] === 'function' && this[key];
                // remove attr value so that we can extract the default value from the getter
                delete attrs[key];
                defaultValue = getter ? getter.call(this) : null;
                // restore attr value
                attrs[key] = val;
                if (defaultValue !== val) {
                    obj.attrs[key] = val;
                }
            }

            obj.className = this.getClassName();
            return obj
        },

        toJSON() {
            return JSON.stringify(this.toObject());
        },

        _getCache() {

        },

        getParent() {
            return this.parent;
        },

        _eachAncestorReverse(func, top) {
            var family = [],
                parent = this.getParent();

            if (top && top.getId() === this.getId()) {
                func(this);
                return;
            }

            family.unshift(this);

            while (parent && (!top || parent.getId() !== top.getId())) {
                family.unshift(parent);
                parent = parent.getParent();
            }

            core.each(family, (f) => {
                func(f)
            });
        },

        findAncestors(selector, includeSelf, stopNode) {
            var res = [];

            if (includeSelf && this._isMatch(selector)) {
                res.push(this);
            }
            var ancestor = this.getParent();
            while (ancestor) {
                if (ancestor === stopNode) {
                    return res;
                }
                if (ancestor._isMatch(selector)) {
                    res.push(ancestor);
                }
                ancestor = ancestor.parent;
            }
            return res;
        },

        findAncestor(selector, includeSelf, stopNode) {
            return this.findAncestors(selector, includeSelf, stopNode)[0];
        },

        _isMatch: function (selector) {
            if (!selector) {
                return false;
            }

            var selectorArr = selector.replace(/ /g, '').split(','),
                len = selectorArr.length,
                n,
                sel;

            for (n = 0; n < len; n++) {
                sel = selectorArr[n];
                if (!core.util.isValidSelector(sel)) {
                    core.warn(
                        'Selector "' +
                        sel +
                        '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".'
                    );
                    core.warn(
                        'If you have a custom shape with such className, please change it to start with upper letter like "Triangle".'
                    );
                    core.warn('Konva is awesome, right?');
                }
                // id selector
                if (sel.charAt(0) === '#') {
                    if (this.id() === sel.slice(1)) {
                        return true;
                    }
                } else if (sel.charAt(0) === '.') {
                    // name selector
                    if (this.hasName(sel.slice(1))) {
                        return true;
                    }
                } else if (this._get(sel).length !== 0) {
                    return true;
                }
            }
            return false;
        },

        getLayer() {
            var parent = this.getParent();
            return parent ? parent.getLayer() : null;
        },

        getStage() {
            return this._getCache(STAGE, this._getStage);
        },

        _getStage() {
            var parent = this.getParent();
            if (parent) {
                return parent.getStage();
            } else {
                return undefined;
            }
        },

        getAbsoluteTransform(top) {
            // if using an argument, we can't cache the result.
            if (top) {
                return this._getAbsoluteTransform(top);
            } else {
                // if no argument, we can cache the result
                return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
            }
        },

        _getAbsoluteTransform(top) {
            var at = new core.Transform();

            // start with stage and traverse downwards to self
            this._eachAncestorReverse((node) => {
                var transformsEnabled = node.transformsEnabled();

                if (transformsEnabled === 'all') {
                    at.multiply(node.getTransform());
                } else if (transformsEnabled === 'position') {
                    at.translate(
                        node.getX() - node.getOffsetX(),
                        node.getY() - node.getOffsetY()
                    );
                }
            }, top);
            return at;
        },

        getAbsoluteScale(top) {
            // if using an argument, we can't cache the result.
            if (top) {
                return this._getAbsoluteScale(top);
            } else {
                // if no argument, we can cache the result
                return this._getCache(ABSOLUTE_SCALE, this._getAbsoluteScale);
            }
        },

        _getAbsoluteScale(top) {
            // this is special logic for caching with some shapes with shadow
            var parent = this;
            while (parent) {
                if (parent._isUnderCache) {
                    top = parent;
                }
                parent = parent.getParent();
            }

            var scaleX = 1,
                scaleY = 1;

            // start with stage and traverse downwards to self
            this._eachAncestorReverse((node) => {
                scaleX *= node.scaleX();
                scaleY *= node.scaleY();
            }, top);

            return {
                x: scaleX,
                y: scaleY
            };
        },

        getTransform() {
            return this._getCache(TRANSFORM, this._getTransform);
        },

        _getTransform() {
            var m = new core.Transform(),
                x = this.getX(),
                y = this.getY(),
                rotation = core.util.getAngle(this.getRotation()),
                scaleX = this.getScaleX(),
                scaleY = this.getScaleY(),
                skewX = this.getSkewX(),
                skewY = this.getSkewY(),
                offsetX = this.getOffsetX(),
                offsetY = this.getOffsetY();

            if (x !== 0 || y !== 0) {
                m.translate(x, y);
            }
            if (rotation !== 0) {
                m.rotate(rotation);
            }
            if (skewX !== 0 || skewY !== 0) {
                m.skew(skewX, skewY);
            }
            if (scaleX !== 1 || scaleY !== 1) {
                m.scale(scaleX, scaleY);
            }
            if (offsetX !== 0 || offsetY !== 0) {
                m.translate(-1 * offsetX, -1 * offsetY);
            }

            return m;
        },

        clone(obj) {
            // instantiate new node
            var attrs = core.clone(this._attrs),
                len,
                n,
                listener;

            core.each(CLONE_BLACK_LIST, (blockAttr) => {
                delete attrs[blockAttr];
            });

            core.extend(attrs, obj);

            var node = new this.constructor(attrs);
            core.each(this._getListers(), (allListeners, key) => {
                len = allListeners.length;
                for (n = 0; n < len; n++) {
                    listener = allListeners[n];
                    if (!node._getListers()[key]) {
                        node._getListers()[key] = [];
                    }
                    node._getListers()[key].push(listener);
                }
            });
            return node;
        },

        _toCanvas(config) {
            config = config || {};

            var stage = this.getStage(),
                x = config.x || 0,
                y = config.y || 0,
                pixelRatio = config.pixelRatio || 1,
                canvas = new core.SceneCanvas({
                    width: config.width || this.getWidth() || (stage ? stage.getWidth() : 0),
                    height: config.height || this.getHeight() || (stage ? stage.getHeight() : 0),
                    pixelRatio
                }),
                context = canvas.getContext();

            context.save();

            if (x || y) {
                context.translate(-1 * x, -1 * y);
            }

            this.drawScene(canvas);
            context.restore();

            return canvas;
        },

        toCanvas(config) {
            return this._toCanvas(config).getCanvas();
        },

        toDataURL(config) {
            config = config || {};
            var mimeType = config.mimeType || null,
                quality = config.quality || null;
            return this._toCanvas(config).toDataURL(mimeType, quality);
        },

        toImage(config) {
            if (!config || !config.callback) {
                throw 'callback required for toImage method config argument';
            }
            core.util.getImage(this.toDataURL(config), (img) => {
                config.callback(img);
            });
        },

        setSize(size) {
            this.setWidth(size.width);
            this.setHeight(size.height);
            return this;
        },

        getSize() {
            return {
                width: this.getWidth(),
                height: this.getHeight()
            };
        },

        getWidth() {
            return this._attrs.width || 0;
        },

        getHeight() {
            return this._attrs.height || 0;
        },

        getClassName() {
            return this.className || this.nodeType;
        },

        getType() {
            return this.nodeType;
        },

        getDragDistance() {
            // compare with undefined because we need to track 0 value
            if (this._attrs.dragDistance !== undefined) {
                return this._attrs.dragDistance;
            } else if (this.parent) {
                return this.parent.getDragDistance();
            } else {
                return core.states.dragDistance;
            }
        },

        _get(selector) {
            return this.className === selector || this.nodeType === selector
                ? [this]
                : [];
        },

        _fireChangeEvent(attr, oldVal, newVal) {
            this._fire(attr + CHANGE, {
                oldVal: oldVal,
                newVal: newVal
            });
        },

        setId(id) {
            var oldId = this.getId();

            core.removeId(oldId);
            core.addId(this, id);
            this.attr(ID, id);
            return this;
        },


        setName(name) {
            var oldNames = (this.getName() || '').split(/\s/g);
            var newNames = (name || '').split(/\s/g);
            var subname, i;
            // remove all subnames
            for (i = 0; i < oldNames.length; i++) {
                subname = oldNames[i];
                if (newNames.indexOf(subname) === -1 && subname) {
                    core.removeName(subname, this._id);
                }
            }

            // add new names
            for (i = 0; i < newNames.length; i++) {
                subname = newNames[i];
                if (oldNames.indexOf(subname) === -1 && subname) {
                    core.addName(this, subname);
                }
            }

            this.attr(NAME, name);
            return this;
        },

        addName(name) {
            if (!this.hasName(name)) {
                var oldName = this.name();
                var newName = oldName ? oldName + ' ' + name : name;
                this.setName(newName);
            }
            return this;
        },

        hasName(name) {
            var names = (this.name() || '').split(/\s/g);
            return names.indexOf(name) !== -1;
        },


        removeName(name) {
            var names = (this.name() || '').split(/\s/g);
            var index = names.indexOf(name);
            if (index !== -1) {
                names.splice(index, 1);
                this.setName(names.join(' '));
            }
            return this;
        },


        _setComponentAttr(key, component, val) {
            var oldVal;
            if (val !== undefined) {
                oldVal = this._attrs[key];

                if (!oldVal) {
                    this._attrs[key] = this.getAttr(key);
                }

                this._attrs[key][component] = val;
                this._fireChangeEvent(key, oldVal, val);
            }
        },

        _fireAndBubble(eventType, evt, compareShape) {
            var okayToRun = true;

            if (evt && this.nodeType === SHAPE) {
                evt.target = this;
            }

            if (
                eventType === MOUSEENTER &&
                compareShape &&
                (this.getId() === compareShape.getId() ||
                    (this.isAncestorOf && this.isAncestorOf(compareShape)))
            ) {
                okayToRun = false;
            } else if (
                eventType === MOUSELEAVE &&
                compareShape &&
                (this.getId() === compareShape.getId() ||
                    (this.isAncestorOf && this.isAncestorOf(compareShape)))
            ) {
                okayToRun = false;
            }
            if (okayToRun) {
                this._fire(eventType, evt);

                // simulate event bubbling
                var stopBubble =
                    (eventType === MOUSEENTER || eventType === MOUSELEAVE) &&
                    (compareShape &&
                        compareShape.isAncestorOf &&
                        compareShape.isAncestorOf(this) &&
                        !compareShape.isAncestorOf(this.parent));
                if (
                    ((evt && !evt.cancelBubble) || !evt) &&
                    this.parent &&
                    this.parent.isListening() &&
                    !stopBubble
                ) {
                    if (compareShape && compareShape.parent) {
                        this._fireAndBubble.call(
                            this.parent,
                            eventType,
                            evt,
                            compareShape.parent
                        );
                    } else {
                        this._fireAndBubble.call(this.parent, eventType, evt);
                    }
                }
            }
        },

        draw() {
            this.drawScene();
            this.drawHit();
            return this;
        },

        _clearSelfAndDescendantCache(attr) {
            this._clearCache(attr);

            if (this.getChildren()) {
                this.getChildren().each(function(node) {
                    node._clearSelfAndDescendantCache(attr);
                });
            }
        }
    });

    core.util.addOverloadedGetterSetter(core.Node, 'position');
    core.util.addGetterSetter(core.Node, 'x', 0);
    core.util.addGetterSetter(core.Node, 'y', 0);
    core.util.addGetterSetter(
        core.Node,
        'globalCompositeOperation',
        'source-over'
    );
    core.util.addGetterSetter(core.Node, 'opacity', 1);
    core.util.addGetter(core.Node, 'name');
    core.util.addOverloadedGetterSetter(core.Node, 'name');
    core.util.addGetter(core.Node, 'id');
    core.util.addOverloadedGetterSetter(core.Node, 'id');
    core.util.addGetterSetter(core.Node, 'rotation', 0);
    core.util.addComponentsGetterSetter(core.Node, 'scale', ['x', 'y']);
    core.util.addGetterSetter(core.Node, 'scaleX', 1);
    core.util.addGetterSetter(core.Node, 'scaleY', 1);
    core.util.addComponentsGetterSetter(core.Node, 'skew', ['x', 'y']);
    core.util.addGetterSetter(core.Node, 'skewX', 0);
    core.util.addGetterSetter(core.Node, 'skewY', 0);
    core.util.addComponentsGetterSetter(core.Node, 'offset', ['x', 'y']);
    core.util.addGetterSetter(core.Node, 'offsetX', 0);
    core.util.addGetterSetter(core.Node, 'offsetY', 0);
    core.util.addSetter(core.Node, 'dragDistance');
    core.util.addOverloadedGetterSetter(core.Node, 'dragDistance');
    core.util.addSetter(core.Node, 'width', 0);
    core.util.addOverloadedGetterSetter(core.Node, 'width');
    core.util.addSetter(core.Node, 'height', 0);
    core.util.addOverloadedGetterSetter(core.Node, 'height');
    core.util.addGetterSetter(core.Node, 'listening', 'inherit');
    core.util.addGetterSetter(core.Node, 'transformsEnabled', 'all');
    core.util.addOverloadedGetterSetter(core.Node, 'size');
    core.util.backCompat(core.Node, {
        rotateDeg: 'rotate',
        setRotationDeg: 'setRotation',
        getRotationDeg: 'getRotation'
    });

    //Konva.Collection.mapMethods(Konva.Node);
    

})(window.Grim);