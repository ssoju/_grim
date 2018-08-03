((core) => {
    core.Text = core.Shape.extend({
        initialize(options) {
            this.supr(options);

        }
    })
})(window.Grim);