import Grim from './grim'

var Cat = Grim.BaseClass.extend({
    initialize() {
        console.log('cat')
    }
});

var cat = new Cat()