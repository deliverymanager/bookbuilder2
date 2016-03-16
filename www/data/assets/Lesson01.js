(function(window) {
Bgr1 = function() {
	this.initialize();
}
Bgr1._SpriteSheet = new createjs.SpriteSheet({images: ["Lesson01.png"], frames: [[0,0,27,19,0,13.1,9.5],[0,19,31,21,0,15.1,10.5],[0,40,26,19,0,13.1,9.5]]});
var Bgr1_p = Bgr1.prototype = new createjs.Sprite();
Bgr1_p.Sprite_initialize = Bgr1_p.initialize;
Bgr1_p.initialize = function() {
	this.Sprite_initialize(Bgr1._SpriteSheet);
	this.paused = false;
}
window.Bgr1 = Bgr1;
}(window));

