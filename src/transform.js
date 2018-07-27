((core) => {
    core.Transform = core.BaseClass.extend({
        initialize(matrix) {
            this.matrix = matrix || [1, 0, 0, 1, 0, 0];
        },
        
        copy() {
            return new this.constructor(this.matrix);
        },
        
        point(point) {
            var m = this.matrix;
            
            return {
                x: m[0] * point.x + m[2] * point.y + m[4],     
                y: m[1] * point.x + m[3] * point.y + m[5],     
            }
        },
        
        translate(x, y) {
            var m = this.matrix;
            
            m[4] += m[0] * x + m[2] * y;
            m[5] += m[1] * x + m[3] * y;
            
            return this;
        },
        
        scale(sx, sy) {
            var m = this.matrix;
            
            m[0] *= sx; 
            m[1] *= sx; 
            m[2] *= sy; 
            m[3] *= sy; 
        },
        
        rotate(rad) {
            var c = Math.cos(rad),
                s = Math.sin(rad),
                m = this.matrix;
            
            var m11 = m[0] * c + m[2] * s;
            var m12 = m[1] * c + m[3] * s;
            var m21 = m[0] * -s + m[2] * c;
            var m22 = m[1] * -s + m[3] * c;
            
            m[0] = m11;
            m[1] = m12;
            m[2] = m21;
            m[3] = m22;
            return this;
        },
        
        getTransition() {
            return {
                x: this.matrix[4],
                y: this.matrix[5]
            }
        },

        skew(sx, sy) {
            var m = this.matrix;
            var m11 = m[0] + m[2] * sy;
            var m12 = m[1] + m[3] * sy;
            var m21 = m[2] + m[0] * sx;
            var m22 = m[3] + m[1] * sx;
            
            m[0] = m11;
            m[1] = m12;
            m[2] = m21;
            m[3] = m22;
            
            return this;
        },

        multiply(matrix) {
            var m = this.matrix;
            var m11 = m[0] * matrix.m[0] + m[2] * matrix.m[1];
            var m12 = m[1] * matrix.m[0] + m[3] * matrix.m[1];
            var m21 = m[0] * matrix.m[2] + m[2] * matrix.m[3];
            var m22 = m[1] * matrix.m[2] + m[3] * matrix.m[3];
            var dx = m[0] * matrix.m[4] + m[2] * matrix.m[5] + m[4];
            var dy = m[1] * matrix.m[4] + m[3] * matrix.m[5] + m[5];

            m[0] = m11;
            m[1] = m12;
            m[2] = m21;
            m[3] = m22;
            m[4] = dx;
            m[5] = dy;
            
            return this;
        },

        invert() {
            var m = this;
            var d = 1 / (m[0] * m[3] - m[1] * m[2]);
            var m0 = m[3] * d;
            var m1 = -m[1] * d;
            var m2 = -m[2] * d;
            var m3 = m[0] * d;
            var m4 = d * (m[2] * m[5] - m[3] * m[4]);
            var m5 = d * (m[1] * m[4] - m[0] * m[5]);

            m[0] = m0;
            m[1] = m1;
            m[2] = m2;
            m[3] = m3;
            m[4] = m4;
            m[5] = m5;

            return this;
        },

        getMatrix() {
            return this.matrix;
        },

        setAbsolutePosition(x, y) {
            var m = this.matrix,
                m0 = m[0],
                m1 = m[1],
                m2 = m[2],
                m3 = m[3],
                m4 = m[4],
                m5 = m[5],
                yt = (m0 * (y - m5) - m1 * (x - m4)) / (m0 * m3 - m1 * m2),
                xt = (x - m4 - m2 * yt) / m0;

            return this.translate(xt, yt);
        }
    });

})(window.Grim);