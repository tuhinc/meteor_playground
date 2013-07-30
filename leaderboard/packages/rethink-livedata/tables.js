var EventEmitter = Npm.require('events').EventEmitter;
var r = Npm.require('rethinkdb');
var RethinkClient = Npm.require('rethinkdb');

var Table = function(tableName, options) {
  var self = this;
  this._table = null; 

  var makeTable = function(tableName) {
    RethinkClient.connect({
      host:'localhost',
      port: 28015,
      db: 'test'
      }, function(err, conn){
        if(err) throw err;
        connection = conn;
        self._table = r.db('test').tableCreate(tableName).run(conn, function(){
          conn.close();
        });
    });
  };
};

//todo -- provide support for durability / returnVals arguments
Table.prototype._insert = function(document, callback) {
  if (!document._id) {
    document._id = Random.id();
  }

  // Insert returns an object that contains the following attributes:

  //     inserted - the number of documents that were succesfully inserted;
  //     replaced - the number of documents that were updated when upsert is used;
  //     unchanged - the number of documents that would have been modified, except that the new value was the same as the old value when doing an upsert;
  //     errors - the number of errors encountered while inserting;
  //     if errors where encountered while inserting, first_error contains the text of the first error;
  //     generated_keys - a list of generated primary key values;
  //     deleted and skipped - 0 for an insert operation.
  RethinkClient.connect({
    host:'localhost',
    port: 28015,
    db: 'test'
    }, function(err, conn){
      if(err) throw err;
      connection = conn;
      r.db('test').insert(document).run(conn, function() {
        callback();
        conn.close();
      });
    });
  };

Meteor.Table = Table;