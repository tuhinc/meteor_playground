Package.describe({
	summary: "A RethinkDB module for Meteor"
});

Npm.depends({
	"rethinkdb": "1.7.0-2"
});

Package.on_use(function (api) {
	api.use(["underscore"], "client");
	api.add_files("both.js", ["client, server"]);
	api.add_files(["templates.html", "client.js"], "client");
});