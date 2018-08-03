((core) => {
    core.TextPath = core.Shape.extend({
        initialize(options) {
            this.supr(options);
            
        }
    })
})(window.Grim);