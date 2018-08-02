((core) => {
    core.Stage = core.Container.extend({
        initialize(options) {
            this.nodeType = 'Stage';

            this.supr(options || {});
            this._id = core.states.idCounter++;
            this._buildDOM();
            this._bindContentEvents();
            this._enableNestedTrasnforms();

            core.states.stages.push(this);
        },

        _validateAdd(child) {
            if (child.getType() !== 'Layer') {
                core.throw('you may only add layers to the stage')
            }
        },

        setContainer(container) {
            if (core.isString(container)) {
                container = core.document.querySelector(container);
            }

            if (!container) {
                throw 'Can not find container in document with it'
            }

            this.attr('container', container);
            return this;
        },

        shouldDrawHit() {
            return true;
        },

        draw() {
            this.supr();
        },

        setHeight(height) {
            this.supr(height);
            this._resizeDOM();
            return this;
        },

        setWidth(width) {
            this.supr(width);
            this._resizeDOM();
            return this;
        },

        clear() {
            var layers = this.children;

            core.each(layers, (layer) => {
                layer.clear();
            });

            return this;
        },

        clone(obj) {
            obj = obj || {};

            obj.container = core.document.createElement('div');
            return core.supr(obj);
        },

        destroy() {
            var content = this.content;

            this.supr();

            if (content && core.util.isInDocument(content)) {
                this.getContainer().removeChild(content);
            }

            var index = core.states.stages.indexOf(this);

            if (index > -1) {
                core.states.stages.splice(index, 1);
            }

            return this;
        },

        getPointerPosition() {
            return this.pointerPos;
        },

        getStage() {
            return this;
        },

        getContent() {
            return this.content;
        },

        toDataURL(config) {
            config = config || {};

            var mimeType = config.mimeType || null,
                quality = config.quality || null,
                x = config.x || 0,
                y = config.y || 0,
                canvas = new Konva.SceneCanvas({
                    width: config.width || this.getWidth(),
                    height: config.height || this.getHeight(),
                    pixelRatio: config.pixelRatio || 1
                }),
                _context = canvas.getContext().getRawContext(),
                layers = this.children;

            if (x || y) {
                _context.translate(-1 * x, -1 * y);
            }

            layers.each(function(layer) {
                if (!layer.isVisible()) {
                    return;
                }
                var width = layer.getCanvas().getWidth();
                var height = layer.getCanvas().getHeight();
                var ratio = layer.getCanvas().getPixelRatio();
                _context.drawImage(
                    layer.getCanvas().getElement(),
                    0,
                    0,
                    width / ratio,
                    height / ratio
                );
            });
            var src = canvas.toDataURL(mimeType, quality);

            if (config.callback) {
                config.callback(src);
            }

            return src;
        },

        toImage(config) {
            var cb = config.callback;

            config.callback = function(dataUrl) {
                core.util.getImage(dataUrl, function(img) {
                    cb(img);
                });
            };
            this.toDataURL(config);
        },

        getIntersection(pos, selector) {
            var layers = this.getChildren(),
                len = layers.length,
                end = len - 1,
                n,
                shape;

            for (n = end; n >= 0; n--) {
                shape = layers[n].getIntersection(pos, selector);
                if (shape) {
                    return shape;
                }
            }

            return null;
        },

        _resizeDOM() {
            if (this.content) {
                var width = this.getWidth(),
                    height = this.getHeight(),
                    layers = this.getChildren(),
                    len = layers.length,
                    n,
                    layer;

                // set content dimensions
                this.content.style.width = width + PX;
                this.content.style.height = height + PX;

                this.bufferCanvas.setSize(width, height);
                this.bufferHitCanvas.setSize(width, height);

                // set layer dimensions
                for (n = 0; n < len; n++) {
                    layer = layers[n];
                    layer.setSize(width, height);
                    layer.draw();
                }
            }
        },

        add(layer) {
            if (arguments.length > 1) {
                for (var i = 0; i < arguments.length; i++) {
                    this.add(arguments[i]);
                }
                return this;
            }
            this.supr(layer);

            layer.setCanvasSize(this.width(), this.height());
            layer.draw();

            if (core.detect.isBrowser) {
                this.content.appendChild(layer.canvas.getElement());
            }

            return this;
        },

        getParent() {
            return null;
        },

        getLayer() {
            return null;
        },

        getLayers() {
            return this.getChildren();
        },

        _bindContentEvents() {
            if (!core.detect.isBrowser) {
                return;
            }
            for (var n = 0; n < eventsLength; n++) {
                addEvent(this, EVENTS[n]);
            }
        },

        _mouseover(evt) {
            if (!core.detect.isMobile) {
                this.setPointerPosition(evt);
                this.fire(CONTENT_MOUSEOVER, { evt });
            }
        },

        _mouseout(evt) {
            if (!core.detect.isMobile) {
                this.setPointerPosition(evt);
                var targetShape = this.targetShape;

                if (targetShape && !core.states.isDragging()) {
                    targetShape.fireAndBubble(MOUSEOUT, { evt: evt });
                    targetShape.fireAndBubble(MOUSELEAVE, { evt: evt });
                    this.targetShape = null;
                }
                this.pointerPos = undefined;

                this.fire(CONTENT_MOUSEOUT, { evt: evt });
            }
        },

        _mousemove(evt) {
            if (core.detect.ieMobile) {
                return this._touchmove(evt);
            }

            if (
                (typeof evt.movementX !== 'undefined' ||
                    typeof evt.movementY !== 'undefined') &&
                evt.movementY === 0 &&
                evt.movementX === 0
            ) {
                return null;
            }
            if (core.detect.isMobile) {
                return null;
            }
            this.setPointerPosition(evt);

            var shape;
            if (!core.states.isDragging()) {
                shape = this.getIntersection(this.getPointerPosition());
                if (shape && shape.isListening()) {
                    if (
                        !core.states.isDragging() &&
                        (!this.targetShape || this.targetShape._id !== shape._id)
                    ) {
                        if (this.targetShape) {
                            this.targetShape.fireAndBubble(MOUSEOUT, { evt: evt }, shape);
                            this.targetShape.fireAndBubble(MOUSELEAVE, { evt: evt }, shape);
                        }
                        shape.fireAndBubble(MOUSEOVER, { evt: evt }, this.targetShape);
                        shape.fireAndBubble(MOUSEENTER, { evt: evt }, this.targetShape);
                        this.targetShape = shape;
                    } else {
                        shape.fireAndBubble(MOUSEMOVE, { evt: evt });
                    }
                } else {
                    if (this.targetShape && !core.states.isDragging()) {
                        this.targetShape.fireAndBubble(MOUSEOUT, { evt: evt });
                        this.targetShape.fireAndBubble(MOUSELEAVE, { evt: evt });
                        this.targetShape = null;
                    }
                    this.fire(MOUSEMOVE, {
                        evt: evt,
                        target: this,
                        currentTarget: this
                    });
                }

                this.fire(CONTENT_MOUSEMOVE, { evt: evt });
            }

            if (evt.cancelable) {
                evt.preventDefault();
            }
        },

        _mousedown: function(evt) {
            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
            if (core.detect.ieMobile) {
                return this._touchstart(evt);
            }
            if (!Konva.UA.mobile) {
                this.setPointerPosition(evt);
                var shape = this.getIntersection(this.getPointerPosition());

                core.states.listenClickTap = true;

                if (shape && shape.isListening()) {
                    this.clickStartShape = shape;
                    shape.fireAndBubble(MOUSEDOWN, { evt: evt });
                } else {
                    this.fire(MOUSEDOWN, {
                        evt: evt,
                        target: this,
                        currentTarget: this
                    });
                }

                this.fire(CONTENT_MOUSEDOWN, { evt: evt });
            }
        },

        _mouseup: function(evt) {
            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
            if (core.detect.ieMobile) {
                return this._touchend(evt);
            }
            if (!core.detect.isMobile) {
                this.setPointerPosition(evt);

                var shape = this.getIntersection(this.getPointerPosition()),
                    clickStartShape = this.clickStartShape,
                    clickEndShape = this.clickEndShape,
                    fireDblClick = false,
                    dd = core.states.DD;

                if (core.states.inDblClickWindow) {
                    fireDblClick = true;
                    clearTimeout(this.dblTimeout);
                    // Konva.inDblClickWindow = false;
                } else if (!dd || !dd.justDragged) {
                    // don't set inDblClickWindow after dragging
                    core.states.inDblClickWindow = true;
                    clearTimeout(this.dblTimeout);
                } else if (dd) {
                    dd.justDragged = false;
                }

                this.dblTimeout = setTimeout(function() {
                    core.states.inDblClickWindow = false;
                }, core.states.dblClickWindow);

                if (shape && shape.isListening()) {
                    this.clickEndShape = shape;
                    shape.fireAndBubble(MOUSEUP, { evt });

                    // detect if click or double click occurred
                    if (
                        core.states.listenClickTap &&
                        clickStartShape &&
                        clickStartShape.getId() === shape.getId()
                    ) {
                        shape.fireAndBubble(CLICK, { evt });

                        if (
                            fireDblClick &&
                            clickEndShape &&
                            clickEndShape.getId() === shape.getId()
                        ) {
                            shape.fireAndBubble(DBL_CLICK, { evt });
                        }
                    }
                } else {
                    this.fire(MOUSEUP, { evt, target: this, currentTarget: this });
                    this.fire(CLICK, { evt, target: this, currentTarget: this });
                    if (fireDblClick) {
                        this.fire(DBL_CLICK, {
                            evt,
                            target: this,
                            currentTarget: this
                        });
                    }
                }
                // content events
                this.fire(CONTENT_MOUSEUP, { evt });
                if (core.states.listenClickTap) {
                    this.fire(CONTENT_CLICK, { evt });
                    if (fireDblClick) {
                        this.fire(CONTENT_DBL_CLICK, { evt });
                    }
                }

                core.states.listenClickTap = false;
            }

            // always call preventDefault for desktop events because some browsers
            // try to drag and drop the canvas element
            if (evt.cancelable) {
                evt.preventDefault();
            }
        },

        _contextmenu(evt) {
            this.setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition());

            if (shape && shape.isListening()) {
                shape.fireAndBubble(CONTEXTMENU, { evt: evt });
            } else {
                this.fire(CONTEXTMENU, {
                    evt: evt,
                    target: this,
                    currentTarget: this
                });
            }
            this.fire(CONTENT_CONTEXTMENU, { evt: evt });
        },

        _touchstart(evt) {
            this.setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition());

            core.states.listenClickTap = true;

            if (shape && shape.isListening()) {
                this.tapStartShape = shape;
                shape.fireAndBubble(TOUCHSTART, { evt });

                // only call preventDefault if the shape is listening for events
                if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
                    evt.preventDefault();
                }
            } else {
                this.fire(TOUCHSTART, {
                    evt,
                    target: this,
                    currentTarget: this
                });
            }
            // content event
            this.fire(CONTENT_TOUCHSTART, { evt });
        },

        _touchend: function(evt) {
            this.setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition()),
                fireDblClick = false;

            if (core.states.inDblClickWindow) {
                fireDblClick = true;
                clearTimeout(this.dblTimeout);
                // Konva.inDblClickWindow = false;
            } else {
                core.states.inDblClickWindow = true;
                clearTimeout(this.dblTimeout);
            }

            this.dblTimeout = setTimeout(function() {
                core.states.inDblClickWindow = false;
            }, core.states.dblClickWindow);

            if (shape && shape.isListening()) {
                shape.fireAndBubble(TOUCHEND, { evt });

                // detect if tap or double tap occurred
                if (
                    core.states.listenClickTap &&
                    this.tapStartShape &&
                    shape.getId() === this.tapStartShape.getId()
                ) {
                    shape.fireAndBubble(TAP, { evt });

                    if (fireDblClick) {
                        shape.fireAndBubble(DBL_TAP, { evt });
                    }
                }
                // only call preventDefault if the shape is listening for events
                if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
                    evt.preventDefault();
                }
            } else {
                this.fire(TOUCHEND, { evt, target: this, currentTarget: this });
                this.fire(TAP, { evt, target: this, currentTarget: this });
                if (fireDblClick) {
                    this.fire(DBL_TAP, {
                        evt,
                        target: this,
                        currentTarget: this
                    });
                }
            }
            // content events
            this.fire(CONTENT_TOUCHEND, { evt });
            if (core.states.listenClickTap) {
                this.fire(CONTENT_TAP, { evt });
                if (fireDblClick) {
                    this.fire(CONTENT_DBL_TAP, { evt });
                }
            }

            core.states.listenClickTap = false;
        },

        _touchmove: function(evt) {
            this.setPointerPosition(evt);
            var dd = core.states.DD,
                shape;
            if (!core.states.isDragging()) {
                shape = this.getIntersection(this.getPointerPosition());
                if (shape && shape.isListening()) {
                    shape.fireAndBubble(TOUCHMOVE, { evt });
                    // only call preventDefault if the shape is listening for events
                    if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
                        evt.preventDefault();
                    }
                } else {
                    this.fire(TOUCHMOVE, {
                        evt,
                        target: this,
                        currentTarget: this
                    });
                }
                this.fire(CONTENT_TOUCHMOVE, { evt });
            }
            if (dd) {
                if (
                    core.states.isDragging() &&
                    core.states.DD.node.preventDefault() &&
                    evt.cancelable
                ) {
                    evt.preventDefault();
                }
            }
        },

        _wheel: function(evt) {
            this.setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition());

            if (shape && shape.isListening()) {
                shape.fireAndBubble(WHEEL, { evt });
            } else {
                this.fire(WHEEL, {
                    evt,
                    target: this,
                    currentTarget: this
                });
            }
            this.fire(CONTENT_WHEEL, { evt });
        },

        setPointerPosition: function(evt) {
            var contentPosition = this.getContentPosition(),
                x = null,
                y = null;
            evt = evt ? evt : window.event;

            // touch events
            if (evt.touches !== undefined) {
                // currently, only handle one finger
                if (evt.touches.length > 0) {
                    var touch = evt.touches[0];
                    // get the information for finger #1
                    x = touch.clientX - contentPosition.left;
                    y = touch.clientY - contentPosition.top;
                }
            } else {
                // mouse events
                x = evt.clientX - contentPosition.left;
                y = evt.clientY - contentPosition.top;
            }
            if (x !== null && y !== null) {
                this.pointerPos = {
                    x: x,
                    y: y
                };
            }
        },

        getContentPosition: function() {
            var rect = this.content.getBoundingClientRect
                ? this.content.getBoundingClientRect()
                : { top: 0, left: 0 };
            return {
                top: rect.top,
                left: rect.left
            };
        },

        _buildDOM: function() {
            // the buffer canvas pixel ratio must be 1 because it is used as an
            // intermediate canvas before copying the result onto a scene canvas.
            // not setting it to 1 will result in an over compensation
            this.bufferCanvas = new core.SceneCanvas();
            this.bufferHitCanvas = new core.HitCanvas({ pixelRatio: 1 });

            if (!core.detect.isBrowser) {
                return;
            }
            var container = this.getContainer();
            if (!container) {
                throw 'Stage has no container. A container is required.';
            }
            // clear content inside container
            container.innerHTML = EMPTY_STRING;

            // content
            this.content = core.document.createElement(DIV);
            this.content.style.position = RELATIVE;
            this.content.className = KONVA_CONTENT;
            this.content.setAttribute('role', 'presentation');

            container.appendChild(this.content);

            this._resizeDOM();
        },

        _onContent: function(typesStr, handler) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n,
                baseEvent;

            for (n = 0; n < len; n++) {
                baseEvent = types[n];
                this.content.addEventListener(baseEvent, handler, false);
            }
        },
        // currently cache function is now working for stage, because stage has no its own canvas element
        // TODO: may be it is better to cache all children layers?
        cache: function() {
            core.warn(
                'Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.'
            );
        },
        clearCache: function() {}
    });

    core.util.addGetter(core.Stage, 'container');
    core.util.addOverloadedGetterSetter(core.Stage, 'container');
})(window.Grim);
