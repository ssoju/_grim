((core) => {
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

            this.id = core.getNextId();
            this.attrs = {};
            this.cache = {};
            this.filterUpToDate = false;
            this.isUnderCache = false;

            this.attr(options);
            this._bindEvents();
        },

        _bindEvents() {
            this.on(core.Node.TRANSFORM_CHANGE, function () {
                this.clearCache('transform')
            })
        },

        clearCache() {

        }
    })
})(window.Grim)