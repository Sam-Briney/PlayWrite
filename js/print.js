var fs = require("fs");
var BSON = require("buffalo");
var gui = require("nw.gui");
var draw = require("code/draw.js");

var win = gui.Window.get();

$(window).load(function(){
	
	var data = fs.readFileSync("temp/~printProject.bson");
	var project = {};
	
	$.extend(project, BSON.parse(data));
	
	draw.run($, window, document, project);
	
	fs.unlink("temp/~printProject.bson");
	
	var path_arr, title;
	if(project.path !== "" && project.path !== undefined){
		path_arr = project.path.split(/[\/\\]/);
		title = path_arr[path_arr.length - 1].substring(0, path_arr[path_arr.length - 1].length - 5);
	}
	else{
		title = "New Project";
	}
	
	$("body").append("<canvas class='hidden' id='print_canvas' width='500' height='420'></canvas>");
		
	var canvas = document.getElementById("print_canvas");
	var context = canvas.getContext("2d");
	
	var pages, room;
	
	if(project.print.per_page === 1){
		pages = 0;
		room = 0;
		
		for(i=0; i<project.frames.length; i++){
			if(i === 0){
				pages++;
				
				$("#container").append("<span id='page_number_" + i + "' class='page_number'>\
					<span style='float:left'>" + title + "</span>\
					<span class='page_number_actual'>" + pages + "</span>\
				</span>");
				$("#container").append("<div class='outer' id='outer_" + pages + "'></div>");
				
				room = 2;
			}
			if(project.frames[i].sel === true || project.print.selection_only === false){
			
				if(room === 0){
					pages++;
					
					$("#container").append("<span id='page_number_" + i + "' class='page_number'>\
						<span style='float:left'>" + title + "</span>\
						<span class='page_number_actual'>" + pages + "</span>\
					</span>");
					$("#container").append("<div class='outer' id='outer_" + pages + "'></div>");
					
					room = 2;
				}
				
				draw.log(context, document, project.frames[i], project.print.print_friend, true);
				
				if(room === 2){
					
					$("#outer_" + pages).append("<div class='name2'>" + project.frames[i].name + "</div>");
					$("#outer_" + pages).append("<img src='" + canvas.toDataURL("image/jpeg") + "' />");
					
					if(project.frames[i].full_court){
						room = 0;
					}
					else{
						room = 1;
					}
				}
				else{
					if(project.frames[i].full_court){
						pages++;
						
						$("#container").append("<span class='page_number'>" + pages + "</span>");
						$("#container").append("<div class='outer' id='outer_" + pages + "'></div>");
						
						$("#outer_" + pages).append("<div class='name2'>" + project.frames[i].name + "</div>");
						$("#outer_" + pages).append("<img src='" + canvas.toDataURL("image/jpeg") + "' />");
					}
					else{
						$("#outer_" + pages).append("<div class='name2'>" + project.frames[i].name + "</div>");
						$("#outer_" + pages).append("<img src='" + canvas.toDataURL("image/jpeg") + "' />");
					}
					
					room = 0;
				}
			}
		}
		
		//window.print();
	}
	else{
		
		pages = 0;
		room = 0;
		
		
		function append_frame(index, t, add){
			if(add){
				$("#outer_" + pages + " .t" + t + " > tbody").append("<tr><td></td></tr>");
			}
			
			$("#outer_" + pages + " .t" + t + " > tbody > tr:last-child > td").append("<div id='contain_" + index + "' class='contain'></div>");
			
			$("#contain_" + index).append(project.frames[index].name + "</br>");
			
			draw.log(context, document, project.frames[index], project.print.print_friend, true);
			
			$("#contain_" + index).append("<img class='court' src='" + canvas.toDataURL("image/jpeg") + "' />");
		}
		
		function set_room(full_court, half_court, ii){
			if(project.frames[ii].full_court){
				room = full_court;
			}
			else{
				room = half_court;
			}
		}
		
		var table = fs.readFileSync("resources/html_strings/print_table.html");
		table = table.toString().trim();
		
		for(i=0; i<project.frames.length; i++){
			if(i === 0){
				pages++;
				
				$("#container").append("<span id='page_number_" + i + "' class='page_number'>\
					<span style='float:left'>" + title + "</span>\
					<span class='page_number_actual'>" + pages + "</span>\
				</span>");
				$("#container").append("<div class='outer' id='outer_" + pages + "'>" + table + "</div>");
				
				room = 6;
			}
			if(project.frames[i].sel === true || project.print.selection_only === false){
			
				if(room === 0){
					pages++;
					
					$("#container").append("<span id='page_number_" + i + "' class='page_number'>\
						<span style='float:left'>" + title + "</span>\
						<span class='page_number_actual'>" + pages + "</span>\
					</span>");
					$("#container").append("<div class='outer' id='outer_" + pages + "'>" + table + "</div>");
					
					room = 6;
				}
				
				switch(room){
					case 6:
						append_frame(i, 1);
						set_room(4, 5, i);
					break;
					case 5:
						append_frame(i, 1, true);
						set_room(3, 4, i);
					break;
					case 4:
						if(project.frames[i].full_court){
							append_frame(i, 2, true);
							$("#outer_" + pages + " > table > tbody > tr > td:last-child").css("border-left", "solid black 1px");
						}
						else{
							append_frame(i, 1, true);
						}
						set_room(1, 3, i);
					break;
					case 3:
						$("#outer_" + pages + " > table > tbody > tr > td:last-child").addClass("separator");
						append_frame(i, 2, true);
						set_room(1, 2, i);
					break;
					case 2:
						if(project.frames[i].full_court){
							append_frame(i, 2, true);
						}
						else{
							append_frame(i, 2, true);
						}
						set_room(0, 1, i);
					break;
					case 1:
						if(project.frames[i].full_court){
							pages++;
					
							$("#container").append("<span id='page_number_" + i + "' class='page_number'>\
								<span style='float:left'>" + title + "</span>\
								<span class='page_number_actual'>" + pages + "</span>\
							</span>");
							$("#container").append("<div class='outer' id='outer_" + pages + "'>" + table + "</div>");
							append_frame(i, 1);
							
							room = 4;
						}
						else{
							append_frame(i, 2, true);
							room = 0;
						}
					break;
				}
			}
		}
		
		//window.print();
		
	}
	
	
	var menubar = new gui.Menu({ type: 'menubar' });
	
		menubar.append(new gui.MenuItem({
			label: "Print",
			click: function(){
				window.print();
			}
		}));
	
	win.menu = menubar;
});