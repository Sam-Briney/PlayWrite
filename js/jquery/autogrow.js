;(function($){

	function getCaret(node) {
	  if (node.selectionStart) {
		return node.selectionStart;
	  } else if (!document.selection) {
		return 0;
	  }

	  var c = "\001",
		  sel = document.selection.createRange(),
		  dul = sel.duplicate(),
		  len = 0;

	  dul.moveToElementText(node);
	  sel.text = c;
	  len = dul.text.indexOf(c);
	  sel.moveStart('character',-1);
	  sel.text = "";
	  return len;
	}
    //pass in just the context as a $(obj) or a settings JS object
    $.fn.autogrow = function(opts, project, frame, misc, document, draw) {
        var that = $(this).css({overflow: 'hidden', resize: 'none'}) //prevent scrollies
            , selector = that.selector
            , defaults = {
                context: $("#text_box_contain") //what to wire events to
                , animate: false //if you want the size change to animate
                , speed: 200 //speed of animation
                , fixMinHeight: true //if you don't want the box to shrink below its initial size
                , cloneClass: 'autogrowclone' //helper CSS class for clone if you need to add special rules
            }
        ;
		var pdf_ctx = document.getElementById("pdf_canvas").getContext("2d");
        opts = $.isPlainObject(opts) ? opts : {context: opts ? opts : $(document)};
        opts = $.extend({}, defaults, opts);
        that.each(function(i, elem){
            var min, clone;
            elem = $(elem);
            //if the element is "invisible", we get an incorrect height value
            //to get correct value, clone and append to the body.
            if (elem.is(':visible') || parseInt(elem.css('height'), 10) > 0) {
                min = parseInt(elem.css('height'), 10) || elem.innerHeight();
            } else {
                clone = elem.clone()
                    .addClass(opts.cloneClass)
                    .val(elem.val())
                    .css({
                        position: 'absolute'
                        , visibility: 'hidden'
                        , display: 'block'
                    })
                ;
                $('body').append(clone);
                min = clone.innerHeight();
                clone.remove();
            }
            if (opts.fixMinHeight) {
                elem.data('autogrow-start-height', min); //set min height
            }
            //elem.css('height', min);
        });
        opts.context
            .on('input paste', selector, resize)
        ;

        function resize (e){
			var box = $(this).parent()
				, oldHeight = box.innerHeight()
				, newHeight = this.scrollHeight + 16
				, minHeight = box.data('autogrow-start-height') || 0
				, clone
				, position = getCaret(this);
			;
			var canvas = $("#canvas");
			if((box.offset().top - canvas.offset().top) + newHeight >= canvas.height()){
				newHeight = canvas.height() - (box.offset().top - canvas.offset().top);
			}
			if (oldHeight < newHeight) { //user is typing
				this.scrollTop = 0; //try to reduce the top of the content hiding for a second
				opts.animate ? box.stop().animate({height: newHeight}, opts.speed) : box.innerHeight(newHeight);
			} else if (e.which == 8 || e.which == 46 || (e.ctrlKey && e.which == 88)) { //user is deleting, backspacing, or cutting
				if (oldHeight > minHeight) { //shrink!
					//this cloning part is not particularly necessary. however, it helps with animation
					//since the only way to cleanly calculate where to shrink the box to is to incrementally
					//reduce the height of the box until the $.innerHeight() and the scrollHeight differ.
					//doing this on an exact clone to figure out the height first and then applying it to the
					//actual box makes it look cleaner to the user
					clone = box.clone()
						.addClass(opts.cloneClass) //add clone class for extra css rules
						.css({position: 'absolute', zIndex:-10}) //make "invisible"
						.val(box.val()) //populate with content for consistent measuring
					;
					box.after(clone); //append as close to the box as possible for best CSS matching for clone
					do { //reduce height until they don't match
						newHeight = clone[0].scrollHeight - 1;
						clone.innerHeight(newHeight);
					} while (newHeight === clone[0].scrollHeight);
					newHeight++; //adding one back eliminates a wiggle on deletion
					clone.remove();
					//if user selects all and deletes or holds down delete til beginning
					//user could get here and shrink whole box
					newHeight < minHeight && (newHeight = minHeight);
					oldHeight > newHeight && opts.animate ? box.stop().animate({height: newHeight}, opts.speed) : box.innerHeight(newHeight);
				} else { //just set to the minHeight
					box.innerHeight(minHeight);
				}
			}

			var index = box.attr("id");

			index = parseInt(index.substring(9), 10);
			project.frames[frame.index].text_boxes[index].position = {
				x: parseInt(box.css("left"), 10),
				y: parseInt(box.css("top"), 10)
			}
			project.frames[frame.index].text_boxes[index].size = {
				width: box.width(),
				height: box.height()
			}

			project.frames[frame.index].text_boxes[index].text = box.find("textarea").context.value;

			draw.current_frame(frame.index, pdf_ctx, project.frames[frame.index], document);
		}
    }
})(jQuery);
