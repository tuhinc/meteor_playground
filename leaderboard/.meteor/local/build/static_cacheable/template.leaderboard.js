(function(){ Meteor.startup(function(){document.body.appendChild(Spark.render(Meteor._def_template(null,Handlebars.json_ast_to_func(["<div id=\"outer\">\n    ",[">","leaderboard"],"\n    ",[">","newPlayer"],"\n  </div>"]))));});Meteor._def_template("leaderboard",Handlebars.json_ast_to_func(["<div class=\"leaderboard\">\n    ",["#",[[0,"each"],[0,"players"]],["\n      ",[">","player"],"\n    "]],"\n  </div>\n\n  ",["#",[[0,"if"],[0,"selected_name"]],["\n  <div class=\"details\">\n    <div class=\"name\">",["{",[[0,"selected_name"]]],"</div>\n    <input type=\"button\" class=\"inc\" value=\"Give 5 points\" />\n  </div>\n  <div class=\"details\">\n    <div class=\"name\">",["{",[[0,"selected_name"]]],"</div>\n    <input type=\"button\" class=\"dec\" value=\"Subtract 5 points\" />\n  </div>\n  "]],"\n\n  ",["#",[[0,"unless"],[0,"selected_name"]],["\n  <div class=\"none\">Click a player to select</div>\n  "]],"\n\n  <div>\n    <input type=\"button\" class=\"sort\" value=\"toggleSort\" />\n  </div>\n\n  <div>\n    <input type=\"button\" class=\"randomizer\" value=\"randomizeScores\" />\n  </div>"]));
Meteor._def_template("newPlayer",Handlebars.json_ast_to_func(["<div class=\"newPlayer\">\n    <input id=\"new_player_name\" type=\"text\" />\n    <input type=\"button\" class=\"add\" value=\"Add Player\" />\n  </div>"]));
Meteor._def_template("player",Handlebars.json_ast_to_func(["<div class=\"player ",["{",[[0,"selected"]]],"\">\n    <span class=\"name\">",["{",[[0,"name"]]],"</span>\n    <span class=\"score\">",["{",[[0,"score"]]],"</span>\n  </div>"]));

}).call(this);
