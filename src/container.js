((core) => {
    core.Container = core.Node.extend({
        initialize(options) {
            this.children = new core.Collection();
        },

        getChildren(filterFunc) {
            if (!filterFunc) {
                return this.children;
            }

            var results = new core.Collection();

            this.children.each((node) => {
                if (filterFunc(node)) {
                    results.push(node);
                }
            });

            return results;
        },

        hasChildren() {
            return this.children.length > 0;
        },

        removeChildren() {
            var children = this.children.clone();

            core.each(children, (child) => {
                delete child.parent;
                child.index = 0;
                child.remove();
            });
            children = null;

            this.children = new core.Collection();
            return this;
        },

        destroyChildren() {
            var children = this.children.clone();

            core.each(children, (child) => {
                delete child.parent;
                child.index = 0;
                child.destroy();
            });
            children = null;

            this.children = new core.Collection();
            return this;
        },

        add(child) {
            if (arguments.length > 1) {
                core.each(arguments, (arg) => {
                    this.add(arg);
                });
                return this;
            }

            if (child.getParent()) {
                child.moveTo(this);
                return this;
            }

            var children = this.children;

            this._validateAdd(child);
            child.index = children.length;
            child.parent = this;
            children.push(child);

            this._fire('add', {
                child
            });

            if (core.states.DD && child.isDragging()) {
                core.states.DD.anim.setLayer(child.getLayer());
            }

            return this;
        },

        destroy() {
            if (this.hasChildren()) {
                this.destroyChildren();
            }

            this.supr();
            return this;
        },

        get() {
            return this.find.apply(this, arguments);
        },

        find(selector) {
            return this._generalFind(selector, false);
        },

        findOne(selector) {
            var results = this._generalFind(selector, true);
            return results.length ? results[0] : undefined;
        },

        _generalFind(selector, findOne) {
            var results = [];

            if (core.isString(selector)) {
                results = this._findByString(selector, findOne);
            } else if (core.isFunction(selector)) {
                results = this._findByFunction(selector, findOne);
            }

            return core.Collection.toCollection(results);
        },

        _findByString(selector) {
            var results = [],
                selectorArr = selector.replace(/ /g, '').split(','),
                len = selectorArr.length,
                n,
                i,
                sel,
                arr,
                node,
                children,
                clen;

            for (n = 0; n < len; n++) {
                sel = selectorArr[n];
                if (!core.validators.isValidSelector(sel)) {
                    core.warn(
                        'Selector "' +
                        sel +
                        '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".'
                    );
                    core.warn(
                        'If you have a custom shape with such className, please change it to start with upper letter like "Triangle".'
                    );
                    core.warn('grim is awesome, right?');
                }
                // id selector
                if (sel.charAt(0) === '#') {
                    node = this._getNodeById(sel.slice(1));
                    if (node) {
                        results.push(node);
                    }
                } else if (sel.charAt(0) === '.') {
                    // name selector
                    arr = this._getNodesByName(sel.slice(1));
                    results = results.concat(arr);
                } else {
                    // unrecognized selector, pass to children
                    children = this.getChildren();
                    clen = children.length;
                    for (i = 0; i < clen; i++) {
                        results = results.concat(children[i]._get(sel));
                    }
                }
            }

            return results;
        },

        _findByFunction(fn, findOne) {
            var results = [];

            var addItems = function(el) {
                if (findOne && results.length > 0) {
                    return;
                }

                var children = el.getChildren();
                var clen = children.length;

                if (fn(el)) {
                    results = results.concat(el);
                }

                for (var i = 0; i < clen; i++) {
                    addItems(children[i]);
                }
            };

            addItems(this);

            return results;
        },


        _getNodeById(key) {
            var node = core.states.ids[key];

            if (node !== undefined && this.isAncestorOf(node)) {
                return node;
            }
            return null;
        },

        _getNodesByName(key) {
            var arr = core.states.names[key] || [];
            return this._getDescendants(arr);
        },

        _get(selector) {
            var results = core.Node.prototype._get.call(this, selector);
            var children = this.getChildren();
            var len = children.length;

            for (var n = 0; n < len; n++) {
                results = results.concat(children[n]._get(selector));
            }
            return results;
        },

        toObject() {
            var obj = core.Node.prototype.toObject.call(this);
            var children = this.getChildren();
            var len = children.length;

            obj.children = [];
            for (var n = 0; n < len; n++) {
                var child = children[n];
                obj.children.push(child.toObject());
            }

            return obj;
        },

        _getDescendants(arr) {
            var results = [];
            var len = arr.length;

            for (var n = 0; n < len; n++) {
                var node = arr[n];
                if (this.isAncestorOf(node)) {
                    results.push(node);
                }
            }

            return results;
        },

        isAncestorOf(node) {
            var parent = node.getParent();

            while (parent) {
                if (parent._id === this._id) {
                    return true;
                }
                parent = parent.getParent();
            }

            return false;
        },

        clone(obj) {
            var node = core.Node.prototype.clone.call(this, obj);

            this.getChildren().each(function(no) {
                node.add(no.clone());
            });
            return node;
        },

        getAllIntersections(pos) {
            var arr = [];

            this.find('Shape').each(function(shape) {
                if (shape.isVisible() && shape.intersects(pos)) {
                    arr.push(shape);
                }
            });

            return arr;
        },

        _setChildrenIndices() {
            this.children.each(function(child, n) {
                child.index = n;
            });
        },
        
        drawScene(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas()),
                context = canvas && canvas.getContext(),
                cachedCanvas = this.getCanvas(),
                cachedSceneCanvas = cachedCanvas && cachedCanvas.scene;

            if (this.isVisible() || caching) {
                if (!caching && cachedSceneCanvas) {
                    context.save();
                    layer._applyTransform(this, context, top);
                    this._drawCachedSceneCanvas(context);
                    context.restore();
                } else {
                    this._drawChildren(canvas, 'drawScene', top, false, caching);
                }
            }
            return this;
        },
        
        drawHit(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.hitCanvas),
                context = canvas && canvas.getContext(),
                cachedCanvas = this.getCanvas(),
                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

            if (this.shouldDrawHit(canvas) || caching) {
                if (layer) {
                    layer.clearHitCache();
                }
                if (!caching && cachedHitCanvas) {
                    context.save();
                    layer._applyTransform(this, context, top);
                    this._drawCachedHitCanvas(context);
                    context.restore();
                } else {
                    this._drawChildren(canvas, 'drawHit', top);
                }
            }
            return this;
        },

        _drawChildren(canvas, drawMethod, top, caching, skipBuffer) {
            var layer = this.getLayer(),
                context = canvas && canvas.getContext(),
                clipWidth = this.getClipWidth(),
                clipHeight = this.getClipHeight(),
                clipFunc = this.getClipFunc(),
                hasClip = (clipWidth && clipHeight) || clipFunc,
                clipX,
                clipY;

            if (hasClip && layer) {
                context.save();
                var transform = this.getAbsoluteTransform(top);
                var m = transform.getMatrix();
                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                context.beginPath();
                if (clipFunc) {
                    clipFunc.call(this, context, this);
                } else {
                    clipX = this.getClipX();
                    clipY = this.getClipY();
                    context.rect(clipX, clipY, clipWidth, clipHeight);
                }
                context.clip();
                m = transform
                    .copy()
                    .invert()
                    .getMatrix();
                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }

            this.children.each(function(child) {
                child[drawMethod](canvas, top, caching, skipBuffer);
            });

            if (hasClip) {
                context.restore();
            }
        },

        shouldDrawHit(canvas) {
            var layer = this.getLayer();
            var dd = core.states.DD;
            var layerUnderDrag =
                dd &&
                core.states.isDragging() &&
                core.states.DD.anim.getLayers().indexOf(layer) !== -1;
            return (
                (canvas && canvas.isCache) ||
                (layer &&
                    layer.hitGraphEnabled() &&
                    this.isVisible() &&
                    !layerUnderDrag)
            );
        },

        getClientRect: function(attrs) {
            attrs = attrs || {};
            var skipTransform = attrs.skipTransform;
            var relativeTo = attrs.relativeTo;

            var minX, minY, maxX, maxY;
            var selfRect = {
                x: Infinity,
                y: Infinity,
                width: 0,
                height: 0
            };
            var that = this;
            this.children.each(function(child) {
                // skip invisible children
                if (!child.getVisible()) {
                    return;
                }

                var rect = child.getClientRect({ relativeTo: that });

                // skip invisible children (like empty groups)
                // or don't skip... hmmm...
                // if (rect.width === 0 && rect.height === 0) {
                //     return;
                // }

                if (minX === undefined) {
                    // initial value for first child
                    minX = rect.x;
                    minY = rect.y;
                    maxX = rect.x + rect.width;
                    maxY = rect.y + rect.height;
                } else {
                    minX = Math.min(minX, rect.x);
                    minY = Math.min(minY, rect.y);
                    maxX = Math.max(maxX, rect.x + rect.width);
                    maxY = Math.max(maxY, rect.y + rect.height);
                }
            });

            // if child is group we need to make sure it has visible shapes inside
            var shapes = this.find('Shape');
            var hasVisible = false;
            for (var i = 0; i < shapes.length; i++) {
                var shape = shapes[i];
                if (shape.getVisible()) {
                    hasVisible = true;
                    break;
                }
            }

            if (hasVisible) {
                selfRect = {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
            } else {
                selfRect = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
            }

            if (!skipTransform) {
                return this._transformedRect(selfRect, relativeTo);
            }
            return selfRect;
        }
    });

    core.util.addComponentsGetterSetter(core.Container, 'clip', [
        'x',
        'y',
        'width',
        'height'
    ]);
    core.util.addGetterSetter(core.Container, 'clipX');
    core.util.addGetterSetter(core.Container, 'clipY');
    core.util.addGetterSetter(core.Container, 'clipWidth');
    core.util.addGetterSetter(core.Container, 'clipHeight');
    core.util.addGetterSetter(core.Container, 'clipFunc');

    core.Collection.mapMethods(core.Container);

})(window.Grim);