var EventEmitter = Npm.require('events').EventEmitter;
var RethinkClient = Npm.require('rethinkdb');
var url = Npm.require('url');

Meteor.Rethink = new EventEmitter();

// console.log(url.parse(process.env.MONGO_URL)['host']);

RethinkClient.connect({
  host:'localhost',
  port: 28015,
  db: 'test'
}, function(err, conn){});