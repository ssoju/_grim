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
        }
    }
})(window.Grim)