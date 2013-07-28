// var EventEmitter = Npm.require('events').EventEmitter;
// var r = Npm.require('rethinkdb');

// var CreateTable = function(tableName, options) {
//   var self = this;
//   this._table = null;

//   //XXX introduce support for options
//   //var args = Array.prototype.slice.call(arguments, 1);

//   var makeTable = function(tableName) {
//     self._table = r.db('test').tableCreate(tableName).run();
//   };

//   Meteor.Rethink.on('ready', makeTable);
//   makeTable(tableName);
// };


// Meteor.Rethink.on('ready', function() { console.log('ready'); });

// Meteor.CreateTable = CreateTable;

// Meteor.CreateTable('omg');