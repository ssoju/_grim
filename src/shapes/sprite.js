((core) => {
    core.Sprite = core.Shape.extend({
        initialize(options) {
            this.supr(options);

            this.className = 'Sprite';
            this._uploaded = true;

            this.anim = new core.Animation(() => {
                var uploaded = this._uploaded;
                this._uploaded = false;
                return uploaded;
            });
        }
    })
})(window.Grim);