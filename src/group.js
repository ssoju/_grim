((core) => {
    core.Group = core.Container.extend({
        initialize(options) {
            this.nodeType = 'Group';
            this.supr();
        },

        _validateAdd(child) {
            var type = child.getType();

            if (type !== 'Group' && type !== 'Shape') {
                core.throw('You may only add groups and shapes to groups.');
            }
        }
    });
})(window.Grim);