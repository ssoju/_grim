((core) => {
    core.Tween = core.BaseClass.extend({
        initialize(options) {
            this.options = core.extend({
                begin: 0,
                diration: 600,
                finish: 0,
                propFunc: function () {
                    
                }
            }, options);
            
            this._pos = this.options.begin;
            this._change = 0;
            this._time = 0;
            this._position = 0;
            this._startTime = 0;
            this._finish = 0;
            this.prevPos = 0;
            this.duration = this.options.duration;
            this.propFunc = this.options.propFunc;
            
            this.pause();
        },
        
        fire(str) {
            var handler = this[str];
            if (handler) {
                handler();
            }
        },
        
        setTime(t) {
            if (t > this.duration) {
                if (this.options.yoyo) {
                    this._time = this.duration;
                    this.reverse();
                } else {
                    this.finish();
                }
            } else if (t < 0) {
                if (this.options.yoyo) {
                    this._time = 0;
                    this.play();
                } else {
                    this.reset();
                }
            } else {
                this._time = t;
                this.update();
            }
        },
        
        getTime() {
            return this._time;
        },
        
        setPosition(p) {
            this.prevPos = this._pos;
            this.propFunc(p);
            this._pos = p;
        },

        getPosition(t) {
            if (t === undefined) {
                t = this._time;
            }
            return this.func(t, this.begin, this._change, this.duration);
        },

        play() {
            this.state = PLAYING;
            this._startTime = this.getTime() - this._time;
            this.onEnterFrame();
            this.fire('onPlay');
        },

        reverse() {
            this.state = REVERSING;
            this._time = this.duration - this._time;
            this._startTime = this.getTime() - this._time;
            this.onEnterFrame();
            this.fire('onReverse');
        }
    })
})(window.Grim);