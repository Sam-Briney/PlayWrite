var fs = require("fs"),
    gui = require("nw.gui"),
    win = gui.Window.get(),
    draw = require("code/draw_presentation.js");

$(window).load(function(){
    //swipe events
    var supportTouch = $.support.touch,
            scrollEvent = "touchmove scroll",
            touchStartEvent = supportTouch ? "touchstart" : "mousedown",
            touchStopEvent = supportTouch ? "touchend" : "mouseup",
            touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
    $.event.special.swipeupdown = {
        setup: function() {
            var thisObject = this;
            var $this = $(thisObject);
            $this.bind(touchStartEvent, function(event) {
                var data = event.originalEvent.touches ?
                        event.originalEvent.touches[ 0 ] :
                        event,
                        start = {
                            time: (new Date).getTime(),
                            coords: [ data.pageX, data.pageY ],
                            origin: $(event.target)
                        },
                        stop;

                function moveHandler(event) {
                    if (!start) {
                        return;
                    }
                    var data = event.originalEvent.touches ?
                            event.originalEvent.touches[ 0 ] :
                            event;
                    stop = {
                        time: (new Date).getTime(),
                        coords: [ data.pageX, data.pageY ]
                    };

                    // prevent scrolling
                    if (Math.abs(start.coords[1] - stop.coords[1]) > 10) {
                        event.preventDefault();
                    }
                }
                $this
                        .bind(touchMoveEvent, moveHandler)
                        .one(touchStopEvent, function(event) {
                    $this.unbind(touchMoveEvent, moveHandler);
                    if (start && stop) {
                        if (stop.time - start.time < 1000 &&
                                Math.abs(start.coords[1] - stop.coords[1]) > 30 &&
                                Math.abs(start.coords[0] - stop.coords[0]) < 75) {
                            start.origin
                                    .trigger("swipeupdown")
                                    .trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
                        }
                    }
                    start = stop = undefined;
                });
            });
        }
    };
    $.each({
        swipedown: "swipeupdown",
        swipeup: "swipeupdown"
    }, function(event, sourceEvent){
        $.event.special[event] = {
            setup: function(){
                $(this).bind(sourceEvent, $.noop);
            }
        };
    });

    fs.readFile("temp/presentation.json", function(err, data){
        if(err) console.error(err);
        else{
            var project = JSON.parse(data),
                frame = {
                    index: 0
                };

            draw.run($, window, document, project, frame);

            for(i=0; i<project.frames.length; i++){
                $("<div class='hidden frame'>\
                    <canvas width='500' height='420' id='canvas_" + i + "'></canvas>\
                </div>").appendTo("#content").hide();

                var canvas = document.getElementById("canvas_" + i);
                var context = canvas.getContext("2d");

                draw.log(context, document, project.frames[i], false, true);
            }

            $("#count").text("1/" + project.frames.length);
            $("#frame_name").text(project.frames[0].name);

            $("#canvas_0").parent().show();

            var map = {
                "1": {
                    hide: "up",
                    show: "down"
                },
                "-1": {
                    hide: "down",
                    show: "up"
                }
            }

            var index = 0;

            //direction 1 | -1
            function move(direction){
                if(project.frames[index + direction]){
                    $("#canvas_" + index).parent().hide({
                        effect: "slide",
                        direction: map[String(direction)].hide,
                        duration: 150
                    });

                    index += direction;
                    $("#count").text(index + 1 + "/" + project.frames.length);

                    setTimeout(function(){
                        $("#canvas_" + index).parent().show({
                            effect: "slide",
                            direction: map[String(direction)].show,
                            duration: 150,
                            complete: function(){
                                $("#frame_name").text(project.frames[index].name);
                            }
                        });
                    }, 150);
                }
                else if(index + 1 === project.frames.length){
                    $("#end_dialog").dialog("open");
                }
            }

            $("#content").on("click, tap", function(){
                move(1);
            });

            $(window).keydown(function(e){
                switch(e.which){
                    case 32:
                    case 40:
                        move(1);
                    break;
                    case 38:
                        move(-1);
                    break;
                    case 27:
                        win.close();
                    break;
                }
            });

            $(window).on("swipeup", function(){
                move(1);
            });
            $(window).on("swipedown", function(){
                move(-1);
            });

            $("#close").click(function(){
                win.close();
            });

            $("#end_dialog").dialog({
                autoOpen: false,
                width: 400,
                height: 230,
                buttons: [
                    {
                        text: "Exit",
                        click: function(){
                            win.close();
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){
                            $(this).dialog("close");
                        }
                    }
                ]
            });

            $("body").on("focus", ".ui-dialog .ui-dialog-buttonpane button, .ui-dialog .ui-dialog-titlebar-close", function(){
        		$(this).css("outline-color", "#1B4CAD");
        	});

        	$("body").on("focus", ".ui-tabs-active, .ui-tabs-anchor", function(){
        		$(this).css("outline-color", "rgba(0,0,0,0)");
        	});

            win.show();
            win.focus();
            win.enterFullscreen();
        }
    });
});
