((core) => {
    core.Transformer = core.Shape.extend({
        initialize(options) {
            this.supr(options);
            
        }
    })
})(window.Grim);