$(document).ready(function(){
	String.prototype.width = function(){
		var textDiv = $('<div>' + this + '</div>');
        textDiv.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'display': 'none'});
        textDiv.appendTo($('body'));
		
		var width = textDiv.width();
		var spaces = this.match(/^\s+|\s+$/gm);
		if(spaces !== null){
			width += spaces.length * 6;
		}
		
		textDiv.remove();
		
		return width;
	}
});