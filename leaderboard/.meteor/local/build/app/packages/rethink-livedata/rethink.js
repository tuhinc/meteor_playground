var EventEmitter = Npm.require('events').EventEmitter;
var url = Npm.require('url');
var r = Npm.require('rethinkdb');
var Fiber = Npm.require('fibers');
var path = Npm.require('path');
var Future = Npm.require(path.join('fibers', 'future'));

_Rethink = function(url) {
  var self = this;
  self.table_queue = [];
  self.liveResultsSets = {};

  r.connect({
    host:'localhost',
    port: 28015,
    db: 'test'
  }, function(err, connection){
     if(err) throw err;
     console.log('connected');
     self.connection = connection;
  });
};

_Rethink.prototype._createTable = function(tableName) {
  var self = this;
  console.log(self.connection);
  r.db('test').tableCreate(tableName).run(self.connection, function(err, cursor) {
    console.log('success!', err);
  });
};

// Returns the Rethink table object; may yield.
_Rethink.prototype._getTable = function(tableName) {
  var self = this;

  var future = new Future();
  if (self.db) {
    self.db.collection(tableName, future.resolver());
  } else {
    self.collection_queue.push({name: tableName,
                                callback: future.resolver()});
  }
  return future.wait();
};

_Rethink.prototype._maybeBeginWrite = function () {
    var self = this;
    var fence = Meteor._CurrentWriteFence.get();
    if (fence) {
      return fence.beginWrite();
    }
    else {
      return {committed: function () {}};
    }
};

//////////// Public API //////////

//todo -- provide support for durability / returnVals arguments
_Rethink.prototype.insert = function(tableName, document) {
  var self = this;
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

  var write = self._maybeBeginWrite();

  try {
    var table = self._getTable(tableName);
    //table should equal r.table(self.tableName);
    table.insert();
  } finally {
    write.committed();
  }
  // this is not where it actually gets inserted -- it gets passed
  // to the table constructor prototype where it gets sluttily passed
  // around some more, validated, and then finally called somewhere
  // I have yet to figure out where....
  r.table(self.tableName).insert(document).run(self.connection, function(err, cursor) {});
    //there has to be something useful you can do here with the cursor
};
Meteor._Rethink = _Rethink;