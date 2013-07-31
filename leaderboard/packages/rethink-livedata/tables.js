var EventEmitter = Npm.require('events').EventEmitter;
var r = Npm.require('rethinkdb');
var RethinkClient = Npm.require('rethinkdb');
var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');
// Meteor.Rethink.on('ready', function () {console.log(Meteor.Rethink.connection);});
console.log(Meteor._RemoteTableDriver);
var Table = function(tableName, options) {
  var self = this;
  if (! (self instanceof Meteor.Table)) {
    throw new Error('use "new" to construct a Meteor.Table');
  }
  options = _.extend({
    connection: undefined,
    _driver: undefined
  }, options);

  self._connection = tableName && (options.connection ||
                                  (Meteor.isClient ?
                                  Meteor.default_connection : Meteor.default_server));

  if (!options._driver) {
    if (tableName && self._connection === Meteor.default_server && Meteor._RemoteTableDriver) {
      options._driver = Meteor._RemoteTableDriver;
      console.log(Meteor._RemoteTableDriver);
    } else {
      options._driver = Meteor._LocalTableDriver;
    }
  }
  // self._table = options._driver.open(tableName);
  self.tableName = tableName;

  var makeTable = function(tableName) {
    RethinkClient.connect({
      host:'localhost',
      port: 28015,
      db: 'test'
      }, function(err, conn){
        if(err) throw err;
        connection = conn;
        r.db('test').tableCreate(tableName).run(conn, function(){
          conn.close();
        });
    });
  };

  // ['insert', 'update', 'replace', 'delete'].forEach(function(writeMethod) {
  //   self[writeMethod] = function() {
  //     var future;
  //     if(Fibers.current) {
  //       future = new Future();
  //       Array.prototype.push.call(arguments. future.resolver());
  //     }

  //     applyMethod(arguments);
  //     if (future) {
  //       future.wait();
  //     }

  //     if(writeMethod === 'insert') {
  //       return arguments[0]._id;
  //     }
  //   };

  //   var applyMethod = function(args) {
  //     if(self.tableName) {
  //       doApply();
  //     } else {

  //     }
  //   }
  // })
  // var makeTable = function(tableName) {
  //   r.db('test').tableCreate(tableName).run(Meteor.Rethink.connection, function() {
  //     console.log('success');
  //   });
  // };

  // if (Meteor.Rethink.connection) {
  //   makeTable(tableName);
  // } else {
  //   Meteor.Rethink.on('ready', makeTable(tableName));
  // }
  makeTable(tableName);
};

Meteor.Table = Table;

//todo -- provide support for durability / returnVals arguments
Table.prototype._insert = function(document, callback) {
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
  RethinkClient.connect({
    host:'localhost',
    port: 28015,
    db: 'test'
    }, function(err, conn){
      if(err) throw err;
      connection = conn;
      r.table(self.tableName).insert(document).run(conn, function() {
        self.connection = conn;
      });
    }
  );
};

_.extend(Meteor.Table.prototype, {

  get: function(string, callback) {
    var self = this;
    // self.connection = Meteor.Rethink.connection;
    r.table(self.tableName).get(string).run(self.connection, function(err, cursor) {
      console.log(cursor);
    });
  }
});

setTimeout(function() { var Players = new Meteor.Table("players");
}, 5000);
// var John = new Meteor.Table("john");
// John._insert({name: "OMG"});
