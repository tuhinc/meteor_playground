Package.describe({
  summary: "A RethinkDB module for Meteor"
});

Npm.depends({
  'rethinkdb': '1.7.0-2'
});

Package.on_use(function (api) {
  api.use(['underscore'], 'server');
  api.add_files(['rethink.js'], 'server');
  api.add_files(['tables.js'], 'server');
  api.add_files(['minirethink.js'], 'client');
  api.add_files(['local_table_driver.js'], 'server');
  api.add_files(['remote_table_driver.js'], 'server');
});