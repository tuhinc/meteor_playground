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
  console.log(Meteor.isClient);
  console.log(self._connection);
  self._table = options._driver.open(tableName);
  console.log(self._table);
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
      // Meteor wants us to generate an ID
      // first make a shallow copy of the document
      args[0] = _.extend({}, args[0]);
      if ('_id' in args[0]) {
        ret = args[0]._id;
        if (!(typeof ret === 'string' || ret instanceof Meteor.Collection.ObjectID)) {
          throw new Error("Meteor requires document _id fields to be strings or ObjectIDs");
        } else {
          ret = args[0]._id = self._makeNewID();
        }
      }
    } else {
      args[0] = Meteor.Collection._rewriteSelector(args[0]);
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
        throwIfSelectorIsNotId(args[0], name);
      }

      if (callback) {
        // asynchronous: on success, callback should return ret
        // (document ID for insert, undefined for update and remove),
        // not the method's result.

        // self.connection.apply
        // (but can't apply because the method doesn't exist in the connection)
      }
    }
  };
});

Meteor.Table.prototype._defineMutationMethods = function() {
  var self = this;
  // set to true once we call any allow or deny methods. If true, use
  // allow/deny semantics. If false, use insecure mode semantics.
  self._restricted = false;
  // Insecure mode (default to allowing writes). Defaults to 'undefined'
  // which means use the global Meteor.Collection.insecure.  This
  // property can be overriden by tests or packages wishing to change
  // insecure mode behavior of their collections.
  self._insecure = undefined;

  self._validators = {
    insert: {allow: [], deny: []},
    update: {allow: [], deny: []},
    remove: {allow: [], deny: []}
  };
  if (!self._name) {
    return; //anonymous collection
  }
  self._prefix = '/rethink/' + self._name + '/';
  //and here we go -- mutation methods
  if (self._connection) {
    var m = {};

    _.each(['insert', 'update', 'remove'], function (method) {
      m[self._prefix + method] = function (/* ... */) {
        try {
          if (this.isSimulation) {

            // Because this is a client simulation, you can do any mutation
            // (even with a complex selector)
            self._table[method].apply(
              self._table, _.toArray(arguments));
            return;
          }
          // This is the server receiving a method call from the client.
          // Meteor doesn't allow arbitrary selectors in mutations from the client:
          // only single-ID selectors.
          if (method !== 'insert') {
            throwIfSelectorIsNotId(arguments[0], method);
          }
          if (self._restricted) {
            // short circuit if there is no way it will pass
            if (self._validators[method].allow.length === 0) {
              throw new Meteor.Error(
                403, "Access denied. No allow validators set on restricted " +
                  "collection for method '" + method + "'.");
            }

            var validatedMathodName =
                  '_validated' + method.charAt(0).toUpperCase() + method.slice(1);
            var argsWithUserId = [this.userId].concat(_.toArray(arguments));
            // self[validatedMathodName]
          }


        }
      };
    });
  }
};
setTimeout(function() {var tuhin = new Meteor.Table("tuhin");}, 500);


