((core) => {
    core.validators = {
        /**
         * @return {number}
         */
        RGBComponent: function(val) {
            if (val > 255) {
                return 255;
            } else if (val < 0) {
                return 0;
            }
            return Math.round(val);
        },
        alphaComponent: function(val) {
            if (val > 1) {
                return 1;
            } else if (val < 0.0001) {
                // chrome does not honor alpha values of 0
                return 0.0001;
            }

            return val;
        }
    };
})(window.Grim);