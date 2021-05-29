var gui = require("nw.gui");
var win = gui.Window.get();


$(window).load(function(){

	//external links
	$("a").click(function(){
		gui.Shell.openExternal($(this).attr("data-href"));
	});

	var content = require("data/help.json");

	for(i=0; i<content.items.length; i++){
		var html = "";
		for(ii=0; ii<content.items[i].steps.length; ii++){
			if(content.items[i].steps[ii].img !== undefined){
				html += ("<li><h3>" + content.items[i].steps[ii].heading + "</h3><p>" + content.items[i].steps[ii].content + "<br/><img src='../resources/images/help/" + content.items[i].steps[ii].img + "'/>" + "</p></li>");
			}
			else{
				html += ("<li><h3>" + content.items[i].steps[ii].heading + "</h3><p>" + content.items[i].steps[ii].content + "</p></li>");
			}
		}
		$("#content ul").append("<li class='plus'><h4>" + content.items[i].heading + "</h4><ol style='display:none;'>" + html + "</ol></li>");
	}


	$("body").on("click", "#content ul .plus h4", function(){

		$(".minus ol").hide("fast");
		$(".minus").removeClass("minus").addClass("plus").mouseleave();

		$(this).parent().removeClass("plus");
		$(this).parent().addClass("minus");

		$(this).siblings().show({
			duration: 200,
			done: function(){
				$("html, body").animate({
					scrollTop: $(this).offset().top - 40
				}, 100);
			}
		});
	});

	$("body").on("click", "#content ul .minus h4", function(){

		$(this).parent().removeClass("minus");
		$(this).parent().addClass("plus");

		$(this).siblings().hide("fast");

	});

	$("body").on("mouseenter", ".plus", function(){
		$(this).fadeTo(100, 1);
	});
	$("body").on("mouseleave", ".plus", function(){
		$(this).fadeTo(50, 0.5);
	});

	$("#content, body").height(win.height - 10);

	win.on("resize", function(){
		$("#content, body").height(win.height - 10);
	});
	$(window).focus();
	win.show();
});
