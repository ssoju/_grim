((core) => {
    core.Line = core.Shape.extend({
        initialize(options) {
            this.supr();

            this.className = 'Line';
            this.on('pointsChange tensionChange closedChange bezierChange', () => {
                this._clearCache('tensionPoints');
            });

            this.sceneFunc(this._sceneFunc);
        },

        _sceneFunc(context) {
            var points = this.getPoints(),
                length = points.length,
                tension = this.getTension(),
                closed = this.getClosed(),
                bezier = this.getBezier(),
                tp,
                len,
                n;

            if (!length) {
                return;
            }

            context.beginPath();
            context.moveTo(points[0], points[1]);

            // tension
            if (tension !== 0 && length > 4) {
                tp = this.getTensionPoints();
                len = tp.length;
                n = closed ? 0 : 4;

                if (!closed) {
                    context.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
                }

                while (n < len - 2) {
                    context.bezierCurveTo(
                        tp[n++],
                        tp[n++],
                        tp[n++],
                        tp[n++],
                        tp[n++],
                        tp[n++]
                    );
                }

                if (!closed) {
                    context.quadraticCurveTo(
                        tp[len - 2],
                        tp[len - 1],
                        points[length - 2],
                        points[length - 1]
                    );
                }
            } else if (bezier) {
                // no tension but bezier
                n = 2;

                while (n < length) {
                    context.bezierCurveTo(
                        points[n++],
                        points[n++],
                        points[n++],
                        points[n++],
                        points[n++],
                        points[n++]
                    );
                }
            } else {
                // no tension
                for (n = 2; n < length; n += 2) {
                    context.lineTo(points[n], points[n + 1]);
                }
            }

            // closed e.g. polygons and blobs
            if (closed) {
                context.closePath();
                context.fillStrokeShape(this);
            } else {
                // open e.g. lines and splines
                context.strokeShape(this);
            }
        },

        getTensionPoints() {
            return this._getCache('tensionPoints', this._getTensionPoints);
        },

        _getTensionPoints() {
            if (this.getClosed()) {
                return this._getTensionPointsClosed();
            } else {
                return core.util.expandPoints(this.getPoints(), this.getTension());
            }
        },

        _getTensionPointsClosed() {
            var p = this.getPoints(),
                len = p.length,
                tension = this.getTension(),
                util = core.util,
                firstControlPoints = util.getControlPoints(
                    p[len - 2],
                    p[len - 1],
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    tension
                ),
                lastControlPoints = util.getControlPoints(
                    p[len - 4],
                    p[len - 3],
                    p[len - 2],
                    p[len - 1],
                    p[0],
                    p[1],
                    tension
                ),
                middle = core.util.expandPoints(p, tension),
                tp = [firstControlPoints[2], firstControlPoints[3]]
                    .concat(middle)
                    .concat([
                        lastControlPoints[0],
                        lastControlPoints[1],
                        p[len - 2],
                        p[len - 1],
                        lastControlPoints[2],
                        lastControlPoints[3],
                        firstControlPoints[0],
                        firstControlPoints[1],
                        p[0],
                        p[1]
                    ]);

            return tp;
        },

        getWidth: function() {
            return this.getSelfRect().width;
        },

        getHeight: function() {
            return this.getSelfRect().height;
        },

        // overload size detection
        getSelfRect: function() {
            var points;
            if (this.getTension() !== 0) {
                points = this._getTensionPoints();
            } else {
                points = this.getPoints();
            }
            var minX = points[0];
            var maxX = points[0];
            var minY = points[1];
            var maxY = points[1];
            var x, y;
            for (var i = 0; i < points.length / 2; i++) {
                x = points[i * 2];
                y = points[i * 2 + 1];
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            return {
                x: Math.round(minX),
                y: Math.round(minY),
                width: Math.round(maxX - minX),
                height: Math.round(maxY - minY)
            };
        }
    });

    core.util.addGetterSetter(core.Line, 'closed', false);
    core.util.addGetterSetter(core.Line, 'bezier', false);
    core.util.addGetterSetter(core.Line, 'tension', 0);
    core.util.addGetterSetter(core.Line, 'points', []);

})(window.Grim);
