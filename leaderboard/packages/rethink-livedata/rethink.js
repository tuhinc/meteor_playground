var EventEmitter = Npm.require('events').EventEmitter;
var url = Npm.require('url');
var RethinkClient = Npm.require('rethinkdb');

Meteor.Rethink = new EventEmitter();

// console.log(url.parse(process.env.MONGO_URL)['host']);

var connection = RethinkClient.connect({
  host:'localhost',
  port: 28015,
  db: 'test'
}, function(err, conn){
   if(err) throw err;
   console.log(err);
   Meteor.Rethink.emit('ready');
});