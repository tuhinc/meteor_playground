var EventEmitter = Npm.require('events').EventEmitter;
var url = Npm.require('url');
var RethinkClient = Npm.require('rethinkdb');
var Fiber = Npm.require('fibers');
var path = Npm.require('path');
var Future = Npm.require(path.join('fibers', 'future'));

Meteor.Rethink = new EventEmitter();

_Rethink = function(url) {
  var self = this;
  self.collection_queue = [];
  self.liveResultsSets = {};

  RethinkClient.connect({
    host:'localhost',
    port: 28015,
    db: 'test'
  }, function(err, conn){
     if(err) throw err;
     Meteor.Rethink.connection = conn;

     // var c;
     // while((c = self.collection_queue.pop())) {
     //   Fiber(function() {
     //     //line 120 mongo_driver.js
     //   }).run();
     Meteor.Rethink.emit('ready');
  });

//eventually don't run this immediately
};
Meteor._Rethink = _Rethink;