(function(window) {
Symbol_22_copy_2_instance_1 = function() {
	this.initialize();
}
Symbol_22_copy_2_instance_1._SpriteSheet = new createjs.SpriteSheet({images: ["results_email_button.png"], frames: [[0,0,187,66,0,0,0],[0,66,187,66,0,0,0]]});
var Symbol_22_copy_2_instance_1_p = Symbol_22_copy_2_instance_1.prototype = new createjs.Sprite();
Symbol_22_copy_2_instance_1_p.Sprite_initialize = Symbol_22_copy_2_instance_1_p.initialize;
Symbol_22_copy_2_instance_1_p.initialize = function() {
	this.Sprite_initialize(Symbol_22_copy_2_instance_1._SpriteSheet);
	this.paused = false;
}
window.Symbol_22_copy_2_instance_1 = Symbol_22_copy_2_instance_1;
}(window));

