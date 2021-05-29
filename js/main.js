var fs = require("fs"),
	draw = require("code/draw.js"),
	construct = require("code/construct.js"),
	graphics = require("code/button_graphics.js"),
	calc = require("code/calc.js"),
	ui = require("code/ui.js"),
	shortcut = require("code/shortcut.js"),
	gui = require("nw.gui"),
	BSON = require("buffalo"),
	child_process = require("child_process"),
	clipboard = require("code/clipboard.js"),
	menu = require("code/menu.js"),
	court_settings = require("code/court_settings.js"),
	text_box = require("code/text_box.js"),
	player_icon_buttons = require("data/player_icon_buttons.json"),
	settings = require("code/settings.js"),
	players = require("code/players.js"),
	gif = require("code/gifshot.js"),
	https = require("https"),
	querystring = require('querystring'),
	dns = require("dns"),
	win = gui.Window.get();


$(window).load(function(){

	localStorage.clear()

	//win.showDevTools();

	global.actions = [];
	global.drawing = false;

	log = function(x){
		console.log(eval(x));
	}

	var frame = {
		index: 0
	},
	temp_line = {},
	misc = {
		saved: false
	},
	project = {
		path:"",
		frames:[
			{
				name:"New Frame",
				full_court:false,
				outside_lines:false,
				player_icons: "classic",
				text_box_index: 0,
				text_boxes: [],
				line_arr:[]
			}
		],
		players:[]
	},
	canvas = document.getElementById("canvas"),
	context = canvas.getContext("2d");

	draw.run($, window, document, project, frame);
	draw.court(context);

	graphics.draw($, window, document, win);

	ui.run($, document, window, win);

	clipboard.run(window, document, $);

	shortcut.run($, window, document, project, frame, clipboard);

	menu.set(window, win, gui, document, $, project, clipboard, ui, misc, draw, frame, BSON);

	text_box.run(window, document, $, project, frame, misc, draw);

	court_settings.run(window, document, $, project, frame, calc, draw, misc, text_box);

	players.run($, document, window, project, gui, frame, misc);

	construct.run(window, document, $, project);

	gif.run(window, document, $, project, gifshot);

	//initialize
	draw.log(context, document, project.frames[frame.index]);

	//touch keyboard
	$("body").on("touchstart", "input[type='text']", function(){
		child_process.spawn('cmd', ['/c','C:\\Program Files\\Common Files\\microsoft shared\\ink\\TabTip.exe']);
	});
	$("body").on("touchstart", "input[type='number']", function(){
		child_process.spawn('cmd', ['/c','C:\\Program Files\\Common Files\\microsoft shared\\ink\\TabTip.exe']);
	});

	$("body").on("click", ".external_link", function(){
		gui.Shell.openExternal($(this).attr("data-href"));
	});

	function frame_select(id){

		if(frame.index !== parseInt(id.substring(6), 10)){
			temp_line.a_done = false;
		}
		frame.index = parseInt(id.substring(6), 10);

		$("#frame_" + frame.index).scrollintoview({
			duration: 100
		});

		$("#name_display").text(project.frames[frame.index].name);

		if(project.frames[frame.index].full_court === true){
			$(".court_setting").removeClass("court_select");
			$("#full_court").mouseenter();
			$("#full_court").addClass("court_select");
		}
		else{
			$(".court_setting").removeClass("court_select");
			$("#half_court").mouseenter();
			$("#half_court").addClass("court_select");
		}
		if(project.frames[frame.index].outside_lines === true){
			$(".bound_setting").removeClass("bound_select");
			$("#bound").mouseenter();
			$("#bound").addClass("bound_select");
		}
		else{
			$(".bound_setting").removeClass("bound_select");
			$("#no_bound").mouseenter();
			$("#no_bound").addClass("bound_select");
		}

		if(!project.frames[frame.index].player_icons){
			project.frames[frame.index].player_icons = "classic";
		}
		$("#x img").attr("src", "resources/images/xo/buttons/" + player_icon_buttons[project.frames[frame.index].player_icons].x);
		$("#o img").attr("src", "resources/images/xo/buttons/" + player_icon_buttons[project.frames[frame.index].player_icons].o);

		draw.log(context, document, project.frames[frame.index], false);
		$("#frame_name").val($("#frame_" + frame.index).text());

		text_box.reset();
	}

	function frame_number(){
		$(".frame").each(function(index){
			$(this).children("span2").html((index + 1) + ". ");
		});
	}

	function sortable(){

		$("#frame_select").multisortable({
			selectedClass:"frame_selected",
			stop:function(e){
				var i = 0;
				frame.index = $("#frame_" + frame.index).index();

				$(".frame").each(function(){
					var index = parseInt($(this).attr("id").substring(6), 10);
					project.frames[index].order = i;

					$(this).attr("id", "frame_" + i);
					i++;
				});

				for(i=0; i<project.frames.length; i++){
					project.frames[i].old_index = i;
				}

				project.frames.sort(function(a, b){
					return a.order-b.order;
				});

				var map = [];

				for(i=0; i<project.frames.length; i++){
					map.push(project.frames[i].old_index);

					delete project.frames[i].order;
					delete project.frames[i].old_index;
				}

				global.actions.push(new construct.action({
					type: "frame_sort",
					map: map
				}));
			}



		});

		frame_number();

		misc.saved = false;

	}
	sortable();

	sortable();
	//frames
	(function(){

		$("#frame_select").on("mousedown", ".frame", function(){
			var that = this;
			frame_select($(that).attr("id"));
		});

		$("#add_frame").click(function(){

			global.actions.push(new construct.action({
				type: "add_frame",
				index: frame.index + 1
			}));

			for(i=project.frames.length - 1; i>frame.index; i--){
				project.frames[i+1] = project.frames[i];
				$("#frame_" + i).attr("id", "frame_" + (i+1));
			}
			frame.index++;
			project.frames[frame.index] = {
				name:project.frames[frame.index-1].name,
				full_court:project.frames[frame.index - 1].full_court,
				outside_lines:project.frames[frame.index - 1].outside_lines,
				player_icons: project.frames[frame.index - 1].player_icons,
				text_box_index: 0,
				text_boxes:[],
				line_arr:[]
			};
			draw.log(context, document, project.frames[frame.index]);

			$("#frame_" + (frame.index-1)).after("<li class='frame' id='frame_" + frame.index + "'>" + "<img src='" + context.canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[frame.index-1].name + "</span></li>");

			$(".frame").removeClass("frame_selected");
			$("#frame_" + frame.index).addClass("frame_selected");
			frame_select("frame_" + frame.index);
			temp_line.a_done = false;

			sortable();
		});

		$("#continue_frame").click(function(){
			global.actions.push(new construct.action({
				type: "add_frame",
				index: frame.index + 1
			}));

			for(i=project.frames.length - 1; i>frame.index; i--){
				project.frames[i+1] = project.frames[i];
				$("#frame_" + i).attr("id", "frame_" + (i+1));
			}
			frame.index++;
			project.frames[frame.index] = {
				name:project.frames[frame.index-1].name,
				full_court:project.frames[frame.index - 1].full_court,
				outside_lines:project.frames[frame.index - 1].outside_lines,
				player_icons: project.frames[frame.index - 1].player_icons,
				text_box_index: 0,
				text_boxes:[],
				line_arr:[]
			};

			project.frames[frame.index].line_arr = calc.continue_frame(project.frames[frame.index-1], $);

			draw.log(context, document, project.frames[frame.index]);

			var pdf_ctx = document.getElementById("pdf_canvas").getContext("2d");
			draw.log(pdf_ctx, document, project.frames[frame.index], false, true);

			$("#frame_" + (frame.index-1)).after("<li class='frame' id='frame_" + frame.index + "'>" + "<img src='" + pdf_ctx.canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[frame.index-1].name + "</span></li>");

			$(".frame").removeClass("frame_selected");
			$("#frame_" + frame.index).addClass("frame_selected");
			frame_select("frame_" + frame.index);
			temp_line.a_done = false;

			sortable();
		});

		$("#frame_name").on("input", function(){
			var v = $("#frame_name").val();

			if(v.width() + 17 >= 400){
				$("#frame_name").attr("maxlength", v.length);
			}
			else{
				$("#frame_name").attr("maxlength", 1000);
			}

			$("#name_display").text(v);
			$(".frame_selected span").text(v);
			$(".frame_selected").each(function(){
				project.frames[parseInt($(this).attr("id").substring(6), 10)].name = v;
			});

			misc.saved = false;
		});

		$("#name_display").on("touchend", function(e){
			$("#frame_rename").dialog("open");

			return false;
		});
		$("#name_display").dblclick(function(){
			$("#frame_rename").dialog("open");
		});

		var old_names = [];
		$("#frame_rename").on("dialogopen", function(){
			$("#frame_name").val(project.frames[frame.index].name);
			$("#frame_name").select();

			$(".frame_selected").each(function(){
				old_names[parseInt($(this).attr("id").substring(6), 10)] = project.frames[parseInt($(this).attr("id").substring(6), 10)].name;
			});
		});

		$("#frame_rename").on("dialogclose", function(){
			var new_name = project.frames[frame.index].name;

			global.actions.push(new construct.action({
				type: "frame_rename",
				old_names: old_names,
				new_name: new_name
			}));
		});

		$("#delete_frame").click(function(){

			$(".frame_selected").each(function(){
				var index = parseInt($(this).attr("id").substring(6), 10);
				project.frames[index].del = true;
			});

			var deleted_frames = project.frames.filter(function(obj){
				return obj.del === true;
			});

			var count = 0;
			for(i=0; i<project.frames.length; i++){
				if(project.frames[i].del === true){
					deleted_frames[count].index = i;
					count++;
				}
			}

			project.frames = project.frames.filter(function(obj){
				return obj.del !== true;
			});

			for(i=0; i<deleted_frames.length; i++){
				delete deleted_frames[i].del;
			}

			global.actions.push(new construct.action({
				type: "delete_frame",
				deleted_frames: deleted_frames
			}));

			if(project.frames.length < 1){
				project.frames[0] = {
					name:"New Frame",
					full_court:false,
					outside_lines:false,
					player_icons: "classic",
					text_box_index: 0,
					text_boxes:[],
					line_arr:[]
				};
			}

			if(frame.index > (project.frames.length - 1)){
				frame.index = project.frames.length - 1;
			}

			$(".frame").remove();

			var pdf_canvas = document.getElementById("pdf_canvas");
			var pdf_ctx = pdf_canvas.getContext("2d");

			for(i=0; i<project.frames.length; i++){
				draw.log(pdf_ctx, document, project.frames[i], false, true);
				$("#frame_select").append("<li class='frame' id='frame_" + i + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[i].name + "</span></li>");
			}

			$("#frame_" + frame.index).mousedown().click();

			sortable();

		});

		$("#paste").click(function(){

			var bson = fs.readFileSync("temp/clipboard.bson");

			var data = BSON.parse(bson);

			data.frames.reverse();
			for(i=0; i<data.frames.length; i++){
				project.frames.splice((frame.index + 1), 0, data.frames[i]);
			}

			$(".frame").remove();

			var pdf_canvas = document.getElementById("pdf_canvas");
			var pdf_ctx = pdf_canvas.getContext("2d");

			for(i=0; i<project.frames.length; i++){
				draw.log(pdf_ctx, document, project.frames[i], false, true);
				$("#frame_select").append("<li class='frame' id='frame_" + i + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[i].name + "</span></li>");
			}

			sortable();

			$("#frame_" + frame.index).mousedown().click();

		});

	})();

	$("#delete").click(function(){
		var e = $.Event("keydown");
		e.which = 46;
		$(window).trigger(e);
	});

	$("#show_handles").click(function(){
		$(".handle_display").addClass("handle_show");
	});

	$("#undo").click(function(){
		if(global.actions.length > 0){
			var d = false;

			var title = "Undo ";

			switch(global.actions[global.actions.length-1].type){
				case "a_done":
					temp_line.a_done = false;

					d = true;
				break;
				case "drawing":
					project.frames[global.actions[global.actions.length - 1].frame_index].line_arr.pop();
					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "move_drawing/handle":
					var index = global.actions[global.actions.length - 1].index;
					frame.index = global.actions[global.actions.length - 1].frame_index;
					var type = project.frames[frame.index].line_arr[index].type;

					var dif = {
						x: project.frames[frame.index].line_arr[index].a.x - global.actions[global.actions.length - 1].old.x,
						y: project.frames[frame.index].line_arr[index].a.y - global.actions[global.actions.length - 1].old.y
					}

					project.frames[frame.index].line_arr[index].a = {
						x: project.frames[frame.index].line_arr[index].a.x - dif.x,
						y: project.frames[frame.index].line_arr[index].a.y - dif.y
					}

					if(!(type === "ball" || type === "o" || type === "x" || /[ball|o|x][1-5]/.test(type))){
						if(type !== "arrow~" && type !== "screen~"){
							project.frames[frame.index].line_arr[index].b = {
								x: project.frames[frame.index].line_arr[index].b.x - dif.x,
								y: project.frames[frame.index].line_arr[index].b.y - dif.y
							}
						}
						project.frames[frame.index].line_arr[index].head = {
							pa:{
								x: project.frames[frame.index].line_arr[index].head.pa.x - dif.x,
								y: project.frames[frame.index].line_arr[index].head.pa.y - dif.y
							},
							pb:{
								x: project.frames[frame.index].line_arr[index].head.pb.x - dif.x,
								y: project.frames[frame.index].line_arr[index].head.pb.y - dif.y
							}
						}
						project.frames[frame.index].line_arr[index].handle = {
							x: project.frames[frame.index].line_arr[index].handle.x - dif.x,
							y: project.frames[frame.index].line_arr[index].handle.y - dif.y
						}
						if(type === "dribble" || type === "dribble~" || type === "arrow~" || type === "screen~"){
							var VAR = "curve";
							if(type === "dribble" || type === "dribble~"){
								VAR = "points";
							}

							for(i=0; i<project.frames[frame.index].line_arr[index][VAR].length; i++){
								project.frames[frame.index].line_arr[index][VAR][i] = {
									x: project.frames[frame.index].line_arr[index][VAR][i].x - dif.x,
									y: project.frames[frame.index].line_arr[index][VAR][i].y - dif.y
								}
							}
						}
					}
					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "new_text_box":
					project.frames[global.actions[global.actions.length - 1].frame_index].text_boxes.pop();
					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "move_text_box":
					project.frames[global.actions[global.actions.length - 1].frame_index].text_boxes[global.actions[global.actions.length - 1].index].position = {
						x: global.actions[global.actions.length - 1].old.x,
						y: global.actions[global.actions.length - 1].old.y
					}

					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "resize_text_box":
					project.frames[global.actions[global.actions.length - 1].frame_index].text_boxes[global.actions[global.actions.length - 1].index].size = {
						width: global.actions[global.actions.length - 1].old.width,
						height: global.actions[global.actions.length - 1].old.height
					}

					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "delete_text_box":
					project.frames[global.actions[global.actions.length - 1].frame_index].text_boxes.splice(global.actions[global.actions.length - 1].index, 0, global.actions[global.actions.length - 1].text_box);

					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					d = true;
				break;
				case "court_setting":
					project.frames[global.actions[global.actions.length - 1].frame_index][global.actions[global.actions.length - 1].VAR] = global.actions[global.actions.length - 1].to ? false : true;

					var setting = project.frames[global.actions[global.actions.length - 1].frame_index][global.actions[global.actions.length - 1].VAR];
					$("#frame_" + global.actions[global.actions.length - 1].frame_index).click();
					frame_select("frame_" + global.actions[global.actions.length - 1].frame_index);

					if(global.actions[global.actions.length - 1].VAR === "full_court"){
						project.frames[frame.index].line_arr = calc.translate(project.frames[frame.index].line_arr, setting, project.frames[frame.index].outside_lines);
						project.frames[frame.index].text_boxes = calc.translate_text_boxes(project.frames[frame.index].text_boxes, setting);
						text_box.reset();
					}
					else if(global.actions[global.actions.length - 1].VAR === "outside_lines"){
						project.frames[frame.index].line_arr = calc.scale(project.frames[frame.index].line_arr, setting, project.frames[frame.index].full_court);
					}

					d = true;
				break;
				case "delete_frame":
					for(i=0; i<global.actions[global.actions.length - 1].deleted_frames.a.length; i++){
						project.frames.splice(global.actions[global.actions.length - 1].deleted_frames.a[i].index, 0, global.actions[global.actions.length - 1].deleted_frames.a[i]);
					}

					$(".frame").remove();

					var pdf_canvas = document.getElementById("pdf_canvas");
					var pdf_ctx = pdf_canvas.getContext("2d");

					for(i=0; i<project.frames.length; i++){
						draw.log(pdf_ctx, document, project.frames[i], false, true);
						$("#frame_select").append("<li class='frame' id='frame_" + i + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[i].name + "</span></li>");
					}

					frame.index = global.actions[global.actions.length - 1].deleted_frames.a[0].index;
					$("#frame_" + frame.index).mousedown().click();

					sortable();

					d = true;
				break;
				case "add_frame":
					project.frames.splice(global.actions[global.actions.length - 1].index, 1);

					$(".frame").remove();

					var pdf_canvas = document.getElementById("pdf_canvas");
					var pdf_ctx = pdf_canvas.getContext("2d");

					for(i=0; i<project.frames.length; i++){
						draw.log(pdf_ctx, document, project.frames[i], false, true);
						$("#frame_select").append("<li class='frame' id='frame_" + i + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[i].name + "</span></li>");
					}

					frame.index = global.actions[global.actions.length - 1].index - 1;
					$("#frame_" + frame.index).mousedown().click();

					sortable();

					d = true;
				break;
				case "delete_drawing":
					for(i=0; i<global.actions[global.actions.length - 1].deleted_drawings.a.length; i++){
						project.frames[global.actions[global.actions.length - 1].frame_index].line_arr.splice(global.actions[global.actions.length - 1].deleted_drawings.a[i].index, 0, global.actions[global.actions.length - 1].deleted_drawings.a[i]);
					}

					frame.index = global.actions[global.actions.length - 1].frame_index;
					$("#frame_" + frame.index).mousedown().click();

					d = true;

				break;
				case "frame_sort":
					for(i=0; i<project.frames.length; i++){
						project.frames[i].order = global.actions[global.actions.length - 1].map.a[i];
					}

					project.frames.sort(function(a, b){
						return a.order-b.order;
					});

					for(i=0; i<project.frames.length; i++){
						delete project.frames[i].order;
					}

					$(".frame").remove();

					var pdf_canvas = document.getElementById("pdf_canvas");
					var pdf_ctx = pdf_canvas.getContext("2d");

					for(i=0; i<project.frames.length; i++){
						draw.log(pdf_ctx, document, project.frames[i], false, true);
						$("#frame_select").append("<li class='frame' id='frame_" + i + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[i].name + "</span></li>");
					}

					frame.index = global.actions[global.actions.length - 1].map.a[frame.index];

					$("#frame_" + frame.index).mousedown().click();

					sortable();

					d = true;

				break;
				case "frame_rename":
					global.actions[global.actions.length - 1].names.old_names.forEach(function(value, i, arr){
						$("#frame_" + i + " span").text(value);
						project.frames[i].name = value;
						$("#name_display").text(project.frames[frame.index].name);
					});
				break;
				case "change_player_icons":
					project.frames[global.actions[global.actions.length - 1].frame_index].player_icons = global.actions[global.actions.length - 1].old;
					frame.index = global.actions[global.actions.length - 1].frame_index;
					$("#frame_" + frame.index).mousedown().click();

					$("#player_icons ol li").removeClass("player_icon_select");
					$("#player_icons ol li[data-player='" + project.frames[frame.index].player_icons + "']").addClass("player_icon_select");

					d = true;
				break;
				case "edit_line":
					var action = global.actions[global.actions.length - 1];

					project.frames[action.frame_index].line_arr[action.line_index] = calc.reprocess(project.frames[action.frame_index].line_arr[action.line_index], action.changed_point, action.point);

					frame.index = global.actions[global.actions.length - 1].frame_index;
					$("#frame_" + frame.index).mousedown().click();

				break;
				case "edit_players":
					var action = global.actions[global.actions.length - 1];

					project.players = action.players;

					if($("#edit_players").is(":visible")){
						$("#edit_players").dialog("close").dialog("open");
					}
				break;
				case "delete_players":
					var action = global.actions[global.actions.length - 1];

					project.players = action.players;

					for(i=0; i<project.frames.length; i++){
						for(ii=0; ii<project.frames[i].line_arr.length; ii++){
							project.frames[i].line_arr[ii].player = action.frames[i].line_arr[ii].player;
						}
					}

					if($("#edit_players").is(":visible")){
						$("#edit_players").dialog("close").dialog("open");
					}

					d = true;
				break;
			}

			global.actions.pop();

			try{
				$("#undo").attr("title", global.actions[global.actions.length - 1].title);
			}
			catch(err){
				$("#undo").attr("title", "Undo");
			}

			if(d === true){
				draw.current_frame(frame.index, context, project.frames[frame.index], document);

				draw.log(context, document, project.frames[frame.index]);
			}

			misc.saved = false;
		}
	});

	//generate pdf
	$("#generate_pdf").click(function(e){
		e.stopPropagation();
		ui.pdf_detail(project);
	});

	//open, save and new
	(function(){

		function open_in_current(i, files){
			try{
				var data = fs.readFileSync(files[i]);

				$.extend(project, BSON.parse(data));

				project.path = files[i];
				//console.log(project, data);

				var path_arr = project.path.split(/[\/\\]/);
				$("title").html(path_arr[path_arr.length - 1].substring(0, path_arr[path_arr.length - 1].length - 5) + " - PlayWrite");

				$(".frame").remove();
				var pdf_canvas = document.getElementById("pdf_canvas");
				var pdf_ctx = pdf_canvas.getContext("2d");

				for(ii=0; ii<project.frames.length; ii++){
					draw.log(pdf_ctx, document, project.frames[ii], false, true);
					$("#frame_select").append("<li class='frame' id='frame_" + ii + "'>" + "<img src='" + pdf_canvas.toDataURL("image/png") + "'/></br><span2></span2><span>" + project.frames[ii].name + "</span></li>");
					if(!project.frames[ii].text_boxes){
						project.frames[ii].text_boxes = [];
						project.frames[ii].text_box_index = 0;
					}
					if(!project.frames[ii].text_box_index){
						project.frames[ii].text_box_index = 0;
					}
				}

				//players for older version 1.0.0.0
				//UPDATE in search.js also
				if(!project.hasOwnProperty("players")){
					project.players = [];
				}
				for(ii=0; ii<project.frames.length; ii++){
					for(iii=0; iii<project.frames[ii].line_arr.length; iii++){
						if(!project.frames[ii].line_arr[iii].hasOwnProperty("player")){
							project.frames[ii].line_arr[iii].player = -1;
						}
					}
				}

				$("#frame_0").click();
				frame_select($("#frame_0").attr("id"));

				draw.log(context, document, project.frames[frame.index]);
				temp_line.a_done = false;
				sortable();

				misc.saved = true;
			}
			catch(err){
				ui.notPLRT(files[i]);
			}
		}

		function open(files, New){
			for(i=0; i<files.length; i++){

				if(New !== true && project.path === "" && global.actions.length < 1){
					project.path = files[i];
					open_in_current(i, files);
				}
				else{

					var child = child_process.spawn(process.execPath, [files[i]], {
						detached: true,
						stdio: ['ignore']
					});

					child.unref();
				}

			}
		}

		$("#new").click(function(){
			open(["resources/New.plrt"], true);
		});

		$("#open").click(function(){
			$("#open_input").click();
		});

		$("#open_input").change(function(){
			var files = $("#open_input").val();
			files = files.split(";");

			open(files);
		});

		if(gui.App.argv.length > 0){
			if(gui.App.argv.length === 1){
				open(gui.App.argv);
			}
			else{
				var jPath = gui.App.argv.join(" ");

				var drive_regX = /([a-z]+\:)/i;

				var split = jPath.split(drive_regX);
				split.splice(0, 1);
				var paths = [];
				for(i=0; i<split.length; i+=2){
					paths.push(split[i] + split[i + 1]);
					paths[paths.length - 1] = paths[paths.length - 1].trim();
				}

				open(paths);
			}
		}

		$("#save").click(function(){
			if(project.path === ""){
				$("#save_as_input").click();
			}
			else{
				var buf = BSON.serialize(project);
				fs.writeFileSync(project.path, buf, {encoding: null});

				global.actions = [];
				$("#undo").attr("title", "Undo");

				misc.saved = true;

				if(ui.close === true){
					win.close();
				}
			}
		});

		$("#save_as_input").change(function(){
			var files = [$("#save_as_input").val()];

			project.path = files[0];
			var buf = BSON.serialize(project);
			fs.writeFileSync(files[0], buf, {encoding: null});

			var path_arr = project.path.split(/[\/\\]/);
			$("title").html(path_arr[path_arr.length - 1].substring(0, path_arr[path_arr.length - 1].length - 5) + " - PlayWrite");

			global.actions = [];
			$("#undo").attr("title", "Undo");

			misc.saved = true;

			$("#save_as_input").val("");
			if(ui.close === true){
				win.close();
			}
		});


	})();

	//process & draw new lines
	(function(){
		var x;
		var y;
		temp_line = {
			a_done: false,
			type: 0,
			a: {
				x: 0,
				y: 0
			},
			b: {
				x: 0,
				y: 0
			},
			head: {
				pa:{
					x:0,
					y:0
				},
				pb:{
					x:0,
					y:0
				}
			},
			num_dots: 0,
			curve:[]
			//curve on right click
		};

		$("#a_done_false").on("click", function(){
			temp_line.a_done = false;
		});

		var right_click_no_movement = false;

		var touching = false;
		var touching_no_movement = false;

		var right_clicking = false;
		var accuracy = 4;

		var dot = document.getElementById("dotIMG");

		$("#canvas_overlay").on("mousemove", function(e){
			x = e.pageX - $("#canvas").offset().left;
			y = e.pageY - $("#canvas").offset().top;


			if(x < 0){x = 0;}
			if(y < 0){y = 0;}
			//$("#test").val(x + ", " + y + ", " + right_clicking);
			//left_clicking if set accordingly settings.app.drawing
			if(right_clicking === true){
				$("#frame_select_contain").append(global.drawing);
				if(x > temp_line.curve[temp_line.curve.length - 1].x + accuracy || x < temp_line.curve[temp_line.curve.length - 1].x - accuracy || y > temp_line.curve[temp_line.curve.length - 1].y + accuracy || y < temp_line.curve[temp_line.curve.length - 1].y - accuracy){
					temp_line.curve.push({
						x: x,
						y: y
					});
					if(temp_line.type === "dribble~"){
						draw.lineSquiggle(context,temp_line.curve[temp_line.curve.length - 2].x, temp_line.curve[temp_line.curve.length - 2].y, temp_line.curve[temp_line.curve.length - 1].x, temp_line.curve[temp_line.curve.length - 1].y, true);
					}
					else{
						draw.line(context,temp_line.curve[temp_line.curve.length - 2].x, temp_line.curve[temp_line.curve.length - 2].y, temp_line.curve[temp_line.curve.length - 1].x, temp_line.curve[temp_line.curve.length - 1].y);
					}
				}
			}
		});

		$("#canvas_overlay").on("mousedown", function(e){
			if(e.which === settings.app.drawing.curve && ui.none_open() && global.draw !== false && !$(e.target).hasClass("handle_display") && !$(e.target).hasClass("drawing") && !$(e.target).hasClass("text_box") && !$(e.target).hasClass("ui-resizable-handle") && e.target.nodeName !== "IMG" && e.target.nodeName !== "TEXTAREA"){//right click
				if(graphics.line_setting === "screen" || graphics.line_setting === "arrow" || graphics.line_setting === "dribble"){
					right_clicking = true;
					temp_line.type = graphics.line_setting + "~";
					temp_line.curve[0] = {
						x:x,
						y:y
					};

					misc.saved = false;
				}
			}
			else if(e.which === 2){
				return false;
			}
		});


		$("#canvas_overlay").on("mouseup", function(e){
			if(ui.none_open() && global.draw !== false && e.which !== 2 && ((!$(e.target).hasClass("handle_display") && !$(e.target).hasClass("drawing") && e.target.nodeName !== "IMG" && e.target.nodeName !== "TEXTAREA") || right_clicking === true)){
				if((e.which === settings.app.drawing.straight||
				graphics.line_setting === "pass" ||
				/^ball$|^o$|^x$|^[ball|o|x]+[1-5]$/.test(graphics.line_setting) === true) &&
				right_clicking === false &&
				((/^ball$|^o$|^x$|^[ball|o|x]+[1-5]$/.test(graphics.line_setting) === true && e.which === 1) || /^ball$|^o$|^x$|^[ball|o|x]+[1-5]$/.test(graphics.line_setting) !== true)){//left click straight line

					if(temp_line.a_done === false){
						if(graphics.line_setting === "screen" || graphics.line_setting === "arrow" || graphics.line_setting === "pass" || graphics.line_setting === "dribble"){
							temp_line.a.x = x;
							temp_line.a.y = y;
							temp_line.a_done = true;
							context.drawImage(dot, temp_line.a.x - 6, temp_line.a.y - 5);
						}
						else if(/^ball$|^o$|^x$|^[ball|o|x]+[1-5]$/.test(graphics.line_setting) === true){
							temp_line.type = graphics.line_setting;
							temp_line.a.x = x - 12.5;
							temp_line.a.y = y - 12.5;
							project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line, window));
						}
					}
					else{
						temp_line.type = graphics.line_setting;

						temp_line.b.x = x;
						temp_line.b.y = y;
						temp_line.a_done = false;

						//screen
						if(temp_line.type === "screen"){
							temp_line = calc.head(temp_line);
						}
						//arrow, dribble & pass
						else if(temp_line.type === "arrow" || temp_line.type === "pass" || temp_line.type === "dribble"){
							temp_line = calc.head(temp_line);
						}
						//more pass
						if(temp_line.type === "pass"){
							temp_line.num_dots = calc.pass(temp_line);
						}
						project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line));
					}
				}
				else if(e.which === settings.app.drawing.curve){//right click curve
					right_clicking = false;

					if(temp_line.curve.length > 1){
						temp_line = calc.curve(temp_line);
						if(temp_line.type === "arrow~" || temp_line.type === "screen~" || temp_line.type === "dribble~"){
							temp_line = calc.head(temp_line);
						}
						project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line));

						temp_line.curve = [];
						temp_line.a_done = false;

						right_click_no_movement = false;
					}
					else{
						right_click_no_movement = true;
					}
				}

				if(right_clicking === false && right_click_no_movement === false){
					//console.log("in");
					var pdf_ctx = document.getElementById("pdf_canvas").getContext("2d");

					draw.current_frame(frame.index, pdf_ctx, project.frames[frame.index], document);

					if(temp_line.a_done === false){
						draw.log(context, document, project.frames[frame.index]);

						global.actions.push(new construct.action({
							type: "drawing",
							frame_index: frame.index,
							arr_index: project.frames[frame.index].line_arr.length - 1
						}));
					}
					else{
						global.actions.push(new construct.action({
							type: "a_done"
						}));
					}

				}
				if(e.which === 3){
					right_click_no_movement = false;
				}
				misc.saved = false;
			}
			global.draw = true;
		});

		$("#canvas_overlay").on("mouseleave", function(){
			if(right_clicking === true && ui.none_open()){
				right_clicking = false;
				temp_line = calc.curve(temp_line);

				if(temp_line.type === "arrow~" || temp_line.type === "screen~" || temp_line.type === "dribble~"){
					temp_line = calc.head(temp_line);
				}
				project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line));

				temp_line.curve = [];
				temp_line.a_done = false;
				global.a_done = false;

				var pdf_ctx = document.getElementById("pdf_canvas").getContext("2d");

				draw.current_frame(frame.index, pdf_ctx, project.frames[frame.index], document);

				if(temp_line.a_done === false){
					draw.log(context, document, project.frames[frame.index]);
				}
				misc.saved = false;
			}
			global.draw = true;
		});

		//touch support

		var d = false;
		$("#canvas_overlay").on("touchmove", function(e){
			x = e.originalEvent.touches[0].pageX - $("#canvas").offset().left;
			y = e.originalEvent.touches[0].pageY - $("#canvas").offset().top;

			if(x < 0){x = 0;}
			if(y < 0){y = 0;}

			//$("#test").val(x + ", " + y + ", " + right_clicking);
			//left_clicking if set accordingly settings.app.drawing
			if(touching === true){
				touching_no_movement = false;
				$("#frame_select_contain").append(global.drawing);
				if(x > temp_line.curve[temp_line.curve.length - 1].x + accuracy || x < temp_line.curve[temp_line.curve.length - 1].x - accuracy || y > temp_line.curve[temp_line.curve.length - 1].y + accuracy || y < temp_line.curve[temp_line.curve.length - 1].y - accuracy){
					temp_line.curve.push({
						x: x,
						y: y
					});
					if(temp_line.type === "dribble~"){
						draw.lineSquiggle(context,temp_line.curve[temp_line.curve.length - 2].x, temp_line.curve[temp_line.curve.length - 2].y, temp_line.curve[temp_line.curve.length - 1].x, temp_line.curve[temp_line.curve.length - 1].y, true);
					}
					else{
						draw.line(context,temp_line.curve[temp_line.curve.length - 2].x, temp_line.curve[temp_line.curve.length - 2].y, temp_line.curve[temp_line.curve.length - 1].x, temp_line.curve[temp_line.curve.length - 1].y);
					}
				}
			}

			return false;
		});

		$("#canvas_overlay").on("touchstart", function(e){
			x = e.originalEvent.touches[0].pageX - $("#canvas").offset().left;
			y = e.originalEvent.touches[0].pageY - $("#canvas").offset().top;

			if(x < 0){x = 0;}
			if(y < 0){y = 0;}

			if(ui.none_open() && global.draw !== false && !$(e.target).hasClass("handle_display") && !$(e.target).hasClass("drawing") && !$(e.target).hasClass("text_box") && !$(e.target).hasClass("ui-resizable-handle") && e.target.nodeName !== "IMG" && e.target.nodeName !== "TEXTAREA"){
				if(graphics.line_setting === "screen" || graphics.line_setting === "arrow" || graphics.line_setting === "dribble"){
					touching = true;
					touching_no_movement = true;
					temp_line.type = graphics.line_setting + "~";
					temp_line.curve[0] = {
						x:x,
						y:y
					};

					misc.saved = false;
				}
				else{
					touching = false;
				}
			}
			else{
				touching = false;
			}

			global.draw = true;
			return false;
		});

		$("#canvas_overlay").on("touchend", function(e){
			if(ui.none_open() && global.draw !== false && ((!$(e.target).hasClass("handle_display") && !$(e.target).hasClass("drawing") && !$(e.target).hasClass("text_box") && e.target.nodeName !== "IMG" && e.target.nodeName !== "TEXTAREA") || right_clicking === true)){
				if(graphics.line_setting === "pass"){
					if(temp_line.a_done === false){
						temp_line.a.x = x;
						temp_line.a.y = y;
						temp_line.a_done = true;
						context.drawImage(dot, temp_line.a.x - 6, temp_line.a.y - 5);

						global.actions.push(new construct.action({
							type: "a_done"
						}));
					}
					else{
						temp_line.type = graphics.line_setting;

						temp_line.b.x = x;
						temp_line.b.y = y;
						temp_line.a_done = false;

						temp_line.num_dots = calc.pass(temp_line);
						temp_line = calc.head(temp_line);

						project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line));
						d = true;
					}
				}
				else if(/^ball$|^o$|^x$|^[ball|o|x]+[1-5]$/.test(graphics.line_setting) === true){
					temp_line.type = graphics.line_setting;
					temp_line.a.x = x - 12.5;
					temp_line.a.y = y - 12.5;
					project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line, window));
					temp_line.a_done = false;
					d = true;
				}
				else{
					if(touching_no_movement === false){
						if(temp_line.curve.length > 1){
							temp_line = calc.curve(temp_line);
							temp_line = calc.head(temp_line);

							project.frames[frame.index].line_arr.push(new construct.Line_data(temp_line));

							d = true;
						}

						temp_line.curve = [];
						temp_line.a_done = false;

					}
				}

				if(d === true){
					var pdf_ctx = document.getElementById("pdf_canvas").getContext("2d");

					draw.current_frame(frame.index, pdf_ctx, project.frames[frame.index], document);

					draw.log(context, document, project.frames[frame.index]);

					global.actions.push(new construct.action({
						type: "drawing",
						frame_index: frame.index,
						arr_index: project.frames[frame.index].line_arr.length - 1
					}));

					d = false;
				}

				misc.saved = false;
				return false;
			}

			touching = false;
			global.draw = true;
		});

	})();

	$("#aa").click(function(){
		win.close(true);
	});

	misc.saved = true;
	win.on("close", function(){
		if(misc.saved === false){
			ui.save_changes(win);
		}
		else{
			win.close(true);
		}

	});

//END ENCRYPTION

	win.maximize();
	win.show();
});
