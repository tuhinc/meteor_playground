Package.describe({
  summary: "A RethinkDB module for Meteor"
});

Npm.depends({
  'rethinkdb': '1.7.0-2'
});

Package.on_use(function (api) {
  api.use(['underscore'], 'client');
  api.add_files(['rethink.js'], 'server');
  api.add_files(['tables.js'], 'server');
});