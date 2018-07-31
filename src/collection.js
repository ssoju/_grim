((core) => {
    core.Collection = function () {
        var args = [].slice.call(arguments),
            length = args.length,
            i = 0;

        this.length = length;
        for (; i < length; i++) {
            this[i] = args[i];
        }
        return this;
    };
    core.Collection.prototype = [];

    core.extend(core.Collection.prototype, {
        each: function (callback) {
            for (var i = 0; i < this.length; i++) {
                callback(this[i], i, this);
            }
        },
        toArray: function () {
            var arr = [],
                len = this.length,
                n;

            for (n = 0; n < len; n++) {
                arr.push(this[n]);
            }
            return arr;
        },
        clone: function () {
            var collection = new core.Collection(),
                len = this.length,
                n;

            for (n = 0; n < len; n++) {
                collection.push(this[n]);
            }
            return collection;
        }
    });

    core.extend(core.Collection, {
        toCollection: function(arr) {
            var collection = new core.Collection(),
                len = arr.length,
                n;

            for (n = 0; n < len; n++) {
                collection.push(arr[n]);
            }
            return collection;
        },
        _mapMethod: function(methodName) {
            core.Collection.prototype[methodName] = function() {
                var len = this.length,
                    i;

                var args = [].slice.call(arguments);
                for (i = 0; i < len; i++) {
                    this[i][methodName].apply(this[i], args);
                }

                return this;
            };
        },
        mapMethods: function(constructor) {
            var prot = constructor.prototype;
            for (var methodName in prot) {
                coew.Collection._mapMethod(methodName);
            }
        }
    });

})(window.Grim);