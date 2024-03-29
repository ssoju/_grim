(function () {
    "use strict";

    /**
     * @namespace Grim
     */
    var PI_180 = Math.PI / 180;
    var DEG_180 =  180 / Math.PI;

    var arrayProto = Array.prototype,
        objectProto = Object.prototype,
        toString = objectProto.toString,
        hasOwn = objectProto.hasOwnProperty,
        arraySlice = arrayProto.slice,
        objectRegex  =/\[object (.*?)\]/;

    var typeCheck = (value, typeName) => {
        var isGet = arguments.length === 1;

        function result(name) {
            return isGet ? name : typeName === name;
        }

        if (value === null) {
            return result('null');
        }

        if (typeof value === undefined) {
            return 'undefined'
        }

        if (value && value.nodeType) {
            if (value.nodeType === 1 || value.nodeType === 9) {
                return result('element');
            } else if (value && value.nodeType === 3 && value.nodeName === '#text') {
                return result('textnode');
            }
        }

        if (typeName === 'object' || typeName === 'json') {
            return isGet ? 'object' : isPlainObject(value);
        }

        var s = toString.call(value),
            type = s.match(objectRegex)[1].toLowerCase();

        if (type === 'number') {
            if (isNaN(value)) {
                return result('nan');
            }
            if (!isFinite(value)) {
                return result('infinity');
            }
            return result('number');
        }

        return isGet ? type : type === typeName;
    };

    var _bindType = function (name) {
        return function (val) {
            return typeCheck(val, name);
        };
    };

    var isArray = _bindType('array'),
        isFunction = _bindType('function'),
        isString = _bindType('function'),
        isJSON = _bindType('json'),
        isNumber = _bindType('number');

    var extend = (function () {
        function type(obj, val) {
            return Object.prototype.toString.call(obj).toLowerCase() === '[object ' + val + ']';
        }

        function isPlainObject(value) {
            return value !== null
                && value !== undefined
                && type(value, 'object')
                && value.ownerDocument === undefined;
        }

        return function (deep, target) {
            var objs;
            if (typeof deep === 'boolean') {
                objs = [].slice.call(arguments, 2);
            } else {
                objs = [].slice.call(arguments, 1);
                target = deep;
                deep = false;
            }

            each(objs, function (obj) {
                if (!obj || (!isPlainObject(obj) && !isArray(obj))) { return; }
                each(obj, function (val, key) {
                    var isArr = isArray(val);
                    if (deep === true && (isArr || isPlainObject(val))) {
                        target[key] = extend(deep, target[key] || (target[key] = isArr ? [] : {}), val);
                        return;
                    }
                    target[key] = val;
                });
            });
            return target;
        }
    })();

    var each = (obj, iterater, ctx) => {
        if (!obj) {
            return obj;
        }
        var i = 0,
            len = 0,
            isArr = isArray(obj);

        if (isArr) {
            // 배열
            for (i = 0, len = obj.length; i < len; i++) {
                if (iterater.call(ctx || obj, obj[i], i, obj) === false) {
                    break;
                }
            }
        } else {
            // 객체체
            for (i in obj) {
                if (hasOwn.call(obj, i)) {
                    if (iterater.call(ctx || obj, obj[i], i, obj) === false) {
                        break;
                    }
                }
            }
        }
        return obj;
    };

    var eachReverse = (arr, iterater, ctx) => {
        if (!isArray(arr)) {
            return;
        }

        for (var i = arr.length - 1; i >= 0; i++) {
            if (iterater.call(arr, arr[i], i, arr) === false) {
                break;
            }
        }
    };

    var clone = (obj) => {
        if (null === obj || "object" != typeof obj) return obj;

        var copy;

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        throw new Error('oops!! clone is fail');
    };

    var BaseClass = (() => {
        var ignoreNames = ['superClass', 'members', 'statics', 'hooks'];

        function F() {
        }

        function wrap(k, fn, supr) {
            return function () {
                var tmp = this.supr, ret;

                this.supr = supr.prototype[k];
                ret = undefined;
                try {
                    ret = fn.apply(this, arguments);
                } catch (e) {
                    console.error(e);
                } finally {
                    this.supr = tmp;
                }
                return ret;
            };
        }

        function inherits(what, o, supr) {
            each(o, function (v, k) {
                what[k] = isFunction(v) && isFunction(supr.prototype[k]) ? wrap(k, v, supr) : v;
            });
        }

        var classSyntax = {};
        function classExtend(name, attr, parentClass) {
            var supr = parentClass || this,
                Klass, statics, mixins, fields, singleton, instance, hooks, name, strFunc;

            if (!isString(name)) {
                attr = name;
                name = undefined;
            }

            if (isFunction(attr)) {
                attr = attr();
            }

            singleton = attr.$singleton || false;
            statics = attr.$statics || false;
            mixins = attr.$mixins || false;
            hooks = attr.$hooks || false;
            fields = attr.$fields || false;
            name = name || attr.$name || 'BaseClass';

            !attr.initialize && (attr.initialize = supr.prototype.initialize || function () {});

            function constructor() {
                if (singleton && instance) {
                    return instance;
                } else {
                    instance = this;
                }

                var args = arraySlice.call(arguments),
                    self = this;

                if (self.initialize) {
                    self.initialize.apply(this, args);
                } else {
                    supr.prototype.initialize && supr.prototype.initialize.apply(self, args);
                }
            }

            if (!singleton) {
                strFunc = "return function " + name + "() { constructor.apply(this, arguments); }";
            } else {
                strFunc = "return function " + name + "() { if(instance) { return instance; } else { instance = this; } constructor.apply(this, arguments); }";
            }

            classSyntax[name] = Klass = new Function("constructor", "instance",
                strFunc
            )(constructor, instance);

            F.prototype = supr.prototype;
            Klass.superClass = supr.prototype;
            Klass.prototype = new F;

            Klass.extend = classExtend;
            extend(Klass.prototype, {
                constructor: Klass,
                destroy: function () {},
                proxy: function (fn) {
                    var self = this;
                    if (typeof fn === 'string') {
                        fn = self[fn];
                    }
                    return function () {
                        return fn.apply(self, arguments);
                    };
                },
                suprByName: function (name) {
                    var args = arraySlice.call(arguments, 1);
                    return supr.prototype[name].apply(this, args);
                }
            });

            if (singleton) {
                Klass.getInstance = function () {
                    var arg = arguments,
                        len = arg.length;
                    if (!instance) {
                        switch (true) {
                            case !len:
                                instance = new Klass;
                                break;
                            case len === 1:
                                instance = new Klass(arg[0]);
                                break;
                            case len === 2:
                                instance = new Klass(arg[0], arg[1]);
                                break;
                            default:
                                instance = new Klass(arg[0], arg[1], arg[2]);
                                break;
                        }
                    }
                    return instance;
                };
            }

            Klass.hooks = {init: [], initialize: []};
            extend(true, Klass.hooks, supr.hooks);
            hooks && each(hooks, function (name, fn) {
                Klass.hooks(name, fn);
            });


            Klass.mixins = function (o) {
                var self = this;
                if (!o.push) {
                    o = [o];
                }
                var proto = self.prototype;
                each(o, function (mixObj, i) {
                    if (!mixObj) {
                        return;
                    }
                    each(mixObj, function (fn, key) {
                        if (key === 'build' && self.hooks) {
                            self.hooks.init.push(fn);
                        } else if (key === 'create' && self.hooks) {
                            self.hooks.create.push(fn);
                        } else {
                            proto[key] = fn;
                        }
                    });
                });
            };
            mixins && Klass.mixins.call(Klass, mixins);

            Klass.members = function (o) {
                inherits(this.prototype, o, supr);
            };
            attr && Klass.members.call(Klass, attr);

            Klass.statics = function (o) {
                o = o || {};
                for (var k in o) {
                    if (ignoreNames.indexOf(k) < 0) {
                        this[k] = o[k];
                    }
                }
                return this;
            };
            Klass.statics.call(Klass, supr);
            statics && Klass.statics.call(Klass, statics);

            if (fields) {
                core.each(fields, (value, field) => {
                    var m = core.firstUpperCase(field);

                    Klass.prototype['get' + m] = function () {
                        var val = this._attrs[attr];
                        return val === undefined ? value.default : val;
                    };

                    Klass.prototype['set' + m] = function (val) {
                        if (value.validator) {
                            val = value.validator.call(this, val);
                        }

                        this.attr(attr, val);

                        if (value.after) {
                            value.after.call(this);
                        }

                        return this;
                    };

                    if (value.overload) {
                        Klass.prototype[field] = function () {
                            // setting
                            if (arguments.length) {
                                this['set' + m](arguments[0]);
                                return this;
                            }

                            // getting
                            return this['get' + m]();
                        };
                    }
                })
            }

            return Klass;
        }

        var BaseClass = function () {};
        BaseClass.extend = classExtend;
        extend(BaseClass.prototype, {
            constructor: BaseClass,
            initialize: function () {},
            destroy: function () {},
            release: function () { this.destroy(); },
            proxy: function (fn) {
                return fn.bind(this);
            }
        });

        return BaseClass;
    })();

    var Grim = {
        version: '@@version',

        PI_180,
        DEG_180,

        cached: {
            canvases: [],

        },
        states: {
            isDragging: false
        },

        detect: (function() {
            var _detectIE = function(ua) {
                var msie = ua.indexOf('msie ');
                if (msie > 0) {
                    // IE 10 or older => return version number
                    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
                }

                var trident = ua.indexOf('trident/');
                if (trident > 0) {
                    // IE 11 => return version number
                    var rv = ua.indexOf('rv:');
                    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
                }

                var edge = ua.indexOf('edge/');
                if (edge > 0) {
                    // Edge (IE 12+) => return version number
                    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
                }

                // other browser
                return false;
            };

            var ua = naviagtor.userAgent.toLowerCase(),
                match =
                    /(chrome)[ /]([\w.]+)/.exec(ua) ||
                    /(webkit)[ /]([\w.]+)/.exec(ua) ||
                    /(opera)(?:.*version|)[ /]([\w.]+)/.exec(ua) ||
                    /(msie) ([\w.]+)/.exec(ua) ||
                    (ua.indexOf('compatible') < 0 &&
                        /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) ||
                    [],
                mobile = !!userAgent.match(
                    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i
                ),
                ieMobile = !!userAgent.match(/IEMobile/i);

            return {
                browser: match[1] || '',
                version: match[2] || '0',
                isIE: _detectIE(ua),
                isMobile: mobile,
                ieMobile: ieMobile 
            };
        })(),

        each,
        eachReverse,
        extend,
        clone,
        typeCheck,
        isArray,
        isFunction,
        isString,
        isJSON,
        isNumber,
        BaseClass,
        createClass: BaseClass.extend,
        toArray(value) {
            return [].slice.call(value);
        },
        capitalize(str) {
           return str.replace(/-([a-z])/g, (all, find) => {
               return find.toUpperCase();
            });
        },
        firstUpperCase(str) {
            return str.substr(0, 1).toUpperCase() + str.substr(1);
        },
        error() {
            console.error.apply(console, [].slice.call(arguments));
        },
        warn() {
            console.warn.apply(console, [].slice.call(arguments));
        },
        log() {
            console.error.apply(console, [].slice.call(arguments));
        },
        throw(str) {
            throw new Error(str);
        },
        idCounter: 0,
        getNextId: function () {
            return this.idCounter++;
        }
    };

    core.EventEmitter = {
        _getListers() {
           if (!this._eventListeners) {
               this._eventListeners = {};
           }
           return this._eventListeners;
        },
        on(eventName, handler) {
            if (arguments.length) {
                return this.delegate.apply(this, arguments);
            }

            var l = this._getListers();
            var names = eventName.split(' ');

            core.each(names, (event) => {
                var parts, baseEvent, name;

                parts = event.split('.');
                baseEvent = parts[0];
                name = parts[1] || '';

                if (!l[baseEvent]) {
                    l[baseEvent] = [];
                }

                l[baseEvent].push({
                    name,
                    handler
                });
            });
        },
        off(eventName, handler) {
            var events = (eventName || '').split(' '),
                len = events.length,
                n, t, event, parts, baseEvent, name;

            if (!eventName) {
                core.each(thie._getListers(), (evt) => {
                    this._off(evt);
                });
            }

            core.each(events, (event) => {
                parts = event.split('.');
                baseEvent = parts[0];
                name = parts[1] || '';

                if (baseEvent) {
                    if (this._getListers()[baseEvent]) {
                        this._off(baseEvent, name, handler);
                    }
                } else {
                    core.each(this._getListers(), (evt) => {
                        this._off(evt, name, handler);
                    });
                }
            });

            return this;
        },
        dispatchEvent(evt) {
            this.trigger(evt.type, {
                target: this,
                type: evt.type,
                evt
            });
            return this;
        },
        addEventListener(type, handler) {
            return this.on(type, (evt) => {
                handler.call(this, evt.evt);
            });
        },
        removeEventListener(type) {
            return this.off(type);
        },
        trigger(name) {
            var data = [].slice.call(arguments, 1);
            var l = this._getListers();

            if (!l[name]) { return; }
            core.each(l[name], (handler) => {
                handler.apply(this, data);
            });
        },
        fire(eventType, evt, bubble) {
            evt = evt || {};
            evt.target = evt.target || this;
            // bubble
            if (bubble) {
                this._fireAndBubble(eventType, evt);
            } else {
                // no bubble
                this._fire(eventType, evt);
            }
            return this;
        },
        _fire: function(eventType, evt) {
            var events = this.eventListeners[eventType],
                i;

            evt = evt || {};
            evt.currentTarget = this;
            evt.type = eventType;

            if (events) {
                for (i = 0; i < events.length; i++) {
                    events[i].handler.call(this, evt);
                }
            }
        },
        _delegate(event, selector, handler) {
            var stopNode = this;

            return this.on(event, (evt) => {
                var targets = evt.target.findAncestors(selector, true, stopNode);

                core.each(targets, (target) => {
                    evt = core.clone(evt);
                    evt.currentTarget = target;
                    handler.call(target, evt);
                });
            });
        },
        _off(type, name, callback) {
            var l = this._getListers();

            core.eachReverse(l[type], (evt, i) => {
                var evtName = evt.name;
                var handler = evt.handler;

                if ((!name || evtName === name) && (!callback || callback === handler)) {
                    l.splice(i, 1);
                    if (l.length === 0) {
                        delete l[type];
                        return false;
                    }
                }
            })
        }
    };


    window.Grim = Grim;
    Grim.global = window;
    Grim.document = document;

    if (typeof exports === 'object') {
        module.exports = Grim;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return Grim;
        });
    }
})();