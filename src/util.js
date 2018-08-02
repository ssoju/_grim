((core) => {
    core.util = {
        createCavasElement(options) {
            options = options || {};

            var canvas = core.document.createElement('canvas');

            if (options.style) {
                core.each(options.style, (value, name) => {
                    canvas.style[name] = value;
                });
            }

            if (options.attr) {
                core.each(options.attr, (value, name) => {
                    canvas.setAttribute(name, value);
                });
            }

            if (options.width) {
                canvas.style.width = options + 'px';
            }

            if (options.height) {
                canvas.style.height = options + 'px';
            }

            return canvas;
        },

        regToHex(r, g, b) {
            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        hexToRgb(hex) {
            hex = hex.replace(/^#/, '');

            var bigint = parseInt(hex, 16);

            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        },

        getAngle(angle) {
            return angle * PI_180
        },

        getRandomColor() {
            var randColor = ((Math.random() * 0xffffff) << 0).toString(16);

            while (randColor.length < 6) {
                randColor = '0' + randColor;
            }
            return '#' + randColor;
        },

        isIntersection(r1, r2) {
            return !(
                r2.x > r1.x + r1.width ||
                r2.x + r2.width < r1.x ||
                r2.y > r1.y + r1.height ||
                r2.y + r2.height < r1.y
            );
        },

        degToRad(deg) {
            return deg * core.PI_180;
        },

        radToDeg(rad) {
            return rad * core.DEG_180;
        },

        addGetterSetter(constructor, attr, def, validator, after) {
            this.addGetter(constructor, attr, def);
            this.addSetter(constructor, attr, validator, after);
            this.addOverloadedGetterSetter(constructor, attr);
        },

        addGetter(constructor, attr, def) {
            var method = 'get' + core.firstUpperCase(attr);

            constructor.prototype[method] = function() {
                var val = this.attrs[attr];
                return val === undefined ? def : val;
            };
        },

        addSetter(constructor, attr, validator, after) {
            var method = 'set' + core.firstUpperCase(attr);

            constructor.prototype[method] = function(val) {
                if (validator) {
                    val = validator.call(this, val);
                }

                this.attr(attr, val);

                if (after) {
                    after.call(this);
                }

                return this;
            };
        },

        addComponentsGetterSetter(
            constructor,
            attr,
            components,
            validator,
            after
        ) {
            var len = components.length,
                capitalize = Konva.Util._capitalize,
                getter = GET + capitalize(attr),
                setter = SET + capitalize(attr),
                n,
                component;

            // getter
            constructor.prototype[getter] = function() {
                var ret = {};

                for (n = 0; n < len; n++) {
                    component = components[n];
                    ret[component] = this.getAttr(attr + capitalize(component));
                }

                return ret;
            };

            // setter
            constructor.prototype[setter] = function(val) {
                var oldVal = this.attrs[attr],
                    key;

                if (validator) {
                    val = validator.call(this, val);
                }

                for (key in val) {
                    if (!val.hasOwnProperty(key)) {
                        continue;
                    }
                    this.attr(attr + capitalize(key), val[key]);
                }

                this._fireChangeEvent(attr, oldVal, val);

                if (after) {
                    after.call(this);
                }

                return this;
            };

            this.addOverloadedGetterSetter(constructor, attr);
        },

        addOverloadedGetterSetter(constructor, attr) {
            var capitalizedAttr = core.firstUpperCase(attr),
                setter = 'set' + capitalizedAttr,
                getter = 'get' + capitalizedAttr;

            constructor.prototype[attr] = function() {
                // setting
                if (arguments.length) {
                    this[setter](arguments[0]);
                    return this;
                }
                // getting
                return this[getter]();
            };
        },

        addDeprecatedGetterSetter(constructor, attr, def, validator) {
            core.error('Adding deprecated ' + attr);

            var method = 'get' + core.firstUpperCase(attr);

            var message =
                attr +
                ' property is deprecated and will be removed soon. Look at Konva change log for more information.';
            constructor.prototype[method] = function() {
                core.error(message);
                var val = this.attrs[attr];
                return val === undefined ? def : val;
            };
            this.addSetter(constructor, attr, validator, function() {
                core.error(message);
            });
            this.addOverloadedGetterSetter(constructor, attr);
        },

        backCompat(constructor, methods) {
            core.each(methods, (oldMethodName, newMethodName) => {
                var method = constructor.prototype[newMethodName];
                constructor.prototype[oldMethodName] = function() {
                    method.apply(this, arguments);
                    core.error(
                        oldMethodName +
                        ' method is deprecated and will be removed soon. Use ' +
                        newMethodName +
                        ' instead'
                    );
                };
            });
        },

        afterSetFilter() {
            this._filterUpToDate = false;
        }
    }
})(window.Grim)