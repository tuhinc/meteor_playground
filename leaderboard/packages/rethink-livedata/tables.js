var EventEmitter = Npm.require('events').EventEmitter;
var r = Npm.require('rethinkdb');
var RethinkClient = Npm.require('rethinkdb');
var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');
// Meteor.Rethink.on('ready', function () {console.log(Meteor.Rethink.connection);});
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
    } else {
      options._driver = Meteor._LocalTableDriver;
    }
  }
  self._table = options._driver.open(tableName);
  console.log(self._connection.registerStore);
  self.tableName = tableName;
};

Meteor.Table = Table;


_.extend(Meteor.Table.prototype, {

  get: function(string, callback) {
    var self = this;
    // self.connection = Meteor.Rethink.connection;
    r.table(self.tableName).get(string).run(self.connection, function(err, cursor) {
      console.log(cursor);
    });
  }
});

//todo:: add functionality for other functions such as update / remove
_.each(["insert"], function(name) {
  Meteor.Table.prototype[name] = function (/* arguments */) {
    var self = this;
    var args = _.toArray(arguments);
    var callback;
    var ret;

    if (args.length && args[args.length - 1] instanceof Function)
      callback = args.pop();

    if (Meteor.isClient && !callback) {
      // (from Meteor -->) Client can't block, so it can't report errors by exception,
      // only by callback. If they forget the callback, give them a
      // default one that logs the error, so they aren't totally
      // baffled if their writes don't work because their database is
      // down.
      callback = function (err) {
        if (err) {
          Meteor._debug(name + " failed: " + (err.reason || err.stack));
        }
      };
    }

    if (name === "insert") {
      if (!args.length) {
        throw new Error("insert requires an argument!");
      }
      // do i need to generate an ID??
      // args[0] = _.extend({}, args[0]);
    }

    // if we are the remote collection
    if (self._connection && self._connection !== Meteor.default_server) {

      var enclosing = Meteor._CurrentInvocation.get();
      var alreadyInSimulation = enclosing && enclosing.isSimulation;
      if (!alreadyInSimulation && name !== "insert") {
        // In other words, if we're actually about to send an RPC
        // there may be a need for an error here but I'm not sure why
        // it has something to do with selectors, and rethink doesn't
        // have selectors...
      }

      if (callback) {
        // asynchronous: on success, callback should return ret
        // (document ID for insert, undefined for update and remove),
        // not the method's result.
        
      }
    }
  };
});