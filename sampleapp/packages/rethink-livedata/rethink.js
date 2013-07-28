var EventEmitter = require('events').EventEmitter;
var url = require('url');
var RethinkClient = require('rethinkdb');
var cp = require('child_process');

var connection = RethinkClient.connect({
  host:'localhost',
  port: 28015,
  db: 'test'
}, function(err, conn){
   if(err) throw err;
   console.log(err);
});