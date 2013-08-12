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
  self.tableName = tableName;
  r.db('test').tableCreate(tableName).run(self.connection, function(err, cursor) {
    console.log('success!', err);
  });
};

//TODO:: self.selector is missing -- rethink doesn't have selectors 
// so another mechanism will have to be used...
var RethinkCursorDescription = function(tableName, options) {
  var self = this;
  self.tableName = tableName;
  self.options = options || {};
};

var RethinkCursor = function(rethink, cursorDescription) {
  var self = this;

  self._rethink = rethink;
  self._cursorDescription = cursorDescription;
  self._synchronousCursor = null;
};

_.each(['forEach', 'map', 'rewind', 'fetch', 'count'], function(method) {
  RethinkCursor.prototype[method] = function() {
    var self = this;

    if (!self._synchronousCursor) {
      self._synchronousCursor = self._rethink._createSynchronousCursor(
        self._cursorDescription, true);
    }

    return self._synchronousCursor[method].apply(
      self.synchronousCursor, arguments);
  };
});


_Rethink.prototype.insert = function(tableName, document) {
  var self = this;
  console.log('insert function called on the server side');
  if (!document._id) {
    document._id = Random.id();
  }

  // this is not where it actually gets inserted -- it gets passed
  // to the table constructor prototype where it gets sluttily passed
  // around some more, validated, and then finally called somewhere
  // I have yet to figure out where....
  r.table(self.tableName).insert(document).run(self.connection, function(err, cursor) {
    console.log("successfully inserted into server side db");
  });
    //there has to be something useful you can do here with the cursor
};

_Rethink.prototype.find = function (tableName) {
  var self = this;
  console.log('find function was called!');
  return new RethinkCursor(self, new RethinkCursorDescription(tableName));
};

// TODO:: make this description more clear -->

// This is RethinkCursor's own publish function -- Meteor's publish function
// does not need to be replaced because the LivedataSubscription class calls
// _publishCursor in the context of the cursor that is returned as a result
// of the handler (which will be a Rethink cursor)
var fence = Meteor._CurrentWriteFence.get();
console.log('this is the write fence', fence);
RethinkCursor.prototype._publishCursor = function (sub) {
  //self is the cursor
  console.log('cursor: ', this);
  var self = this;
  var table = self._cursorDescription.tableName;
  console.log('table: ', table);
  var observeHandle = self.observeChanges({
    added: function (id, fields) {
      // these result in DDP messages being sent over the wire
      sub.added(table, id, fields);
    },
    changed: function (id, fields) {
      sub.changed(table, id, fields);
    },
    removed: function (id) {
      sub.removed(table, id);
    }
  });

  sub.onStop(function () {
    observeHandle.stop();
  });
};

RethinkCursor.prototype._getTableName = function() {
  var self = this;
  return self._cursorDescription.tableName;
};

RethinkCursor.prototype.observe = function (callbacks) {
  var self = this;
  return LocalTable._observeFromObserveChanges(self, callbacks);
};

RethinkCursor.prototype.observeChanges = function (callbacks) {
  var self = this;
  //TODO: ordered?
  return self._rethink._observeChanges(
    self._cursorDescription, callbacks);
};

//TODO: missing 'useTransform' argument
//TODO:: this will probably need to be wrapped in a future
//TODO:: what should I do with this beautiful callback I've been given?
_Rethink.prototype._createSynchronousCursor = function (cursorDescription) {

  var self = this;
  var options = cursorDescription.options;
  var tableName = cursorDescription.tableName;
  var dbCursor;
  r.table(tableName).run(self.connection, function(err, cur) {
    dbCursor = cur;
    console.log(dbCursor);
  });

  return new RethinkSynchronousCursor(dbCursor);
};


Meteor._LivedataSession.prototype.processMessage = function (msg_in, socket) {
    var self = this;
    if (socket !== self.socket)
      return;
    console.log('MESSAGE', msg_in);
    self.in_queue.push(msg_in);
    if (self.worker_running)
      return;
    self.worker_running = true;

    var processNext = function () {
      var msg = self.in_queue.shift();
      if (!msg) {
        self.worker_running = false;
        return;
      }

      Fiber(function () {
        var blocked = true;

        var unblock = function () {
          if (!blocked)
            return; // idempotent
          blocked = false;
          processNext();
        };

        if (_.has(self.protocol_handlers, msg.msg))
          self.protocol_handlers[msg.msg].call(self, msg, unblock);
        else
          self.sendError('Bad request', msg);
        unblock(); // in case the handler didn't already do it
      }).run();
    };

    processNext();
  };

Meteor._LivedataSession.prototype.protocol_handlers.sub = function (msg) {
      var self = this;

      // reject malformed messages
      if (typeof (msg.id) !== "string" ||
          typeof (msg.name) !== "string" ||
          (('params' in msg) && !(msg.params instanceof Array))) {
        self.sendError("Malformed subscription", msg);
        return;
      }

      if (!self.server.publish_handlers[msg.name]) {
        self.send({
          msg: 'nosub', id: msg.id,
          error: new Meteor.Error(404, "Subscription not found")});
        return;
      }

      if (_.has(self._namedSubs, msg.id))
        // subs are idempotent, or rather, they are ignored if a sub
        // with that id already exists. this is important during
        // reconnect.
        return;

      var handler = self.server.publish_handlers[msg.name];
      console.log('handler function: ', handler);
      self._startSubscription(handler, msg.id, msg.params, msg.name);

    };
var RethinkSynchronousCursor = function(dbCursor) {
  self._dbCursor = dbCursor;
  self._synchronousNextObject = Future.wrap(
    dbCursor.next.bind(dbCursor), 0);
  self._synchronousCount = Future.wrap(dbCursor.count.bind(dbCursor));
  self._visitedIds = {};
};

_.extend(RethinkSynchronousCursor.prototype, {
  _next: function() {
    var self = this;
    while (true) {
      var doc = self._synchronousNextObject().wait();
      if (!doc || !doc._id) {
        return null;
      }
      var strId = Meteor.idStringify(doc._id);
      if (self.visitedIds[strId]) continue;
      self._visitedIds[strId] = true;

      return doc;
    }
  },

  each: function(callback) {
    var self = this;

    // We implement the loop ourself instead of using self._dbCursor.each,
    // because "each" will call its callback outside of a fiber which makes it
    // much more complex to make this function synchronous.
    while (true) {
      var doc = self._next();
      if (!doc) {
        return;
      }
      callback(doc);
    }
  },

  map: function (callback) {
    var self = this;
    var res = [];
    self.each(function (doc) {
      res.push(callback(doc));
    });
    return res;
  },

  fetch: function() {
    var self = this;
    return self.map(_.identity);
  },

  count: function() {
    var self = this;
    return self._synchronousCount().wait();
  },

  hasNext: function() {
    var self = this;
    return self.hasNext();
  },

  getRawObjects: function (ordered) {
    var self = this;
    if (ordered) {
      return self.fetch();
    } else {
      var results = {};
      self.each(function (doc) {
        results[doc._id] = doc;
      });
      return results;
    }
  }
});

var nextObserveHandleId = 1;
var ObserveHandle = function (liveResultsSet, callbacks) {
  var self = this;
  self._liveResultsSet = liveResultsSet;
  self._added = callbacks.added;
  self._addedBefore = callbacks.addedBefore;
  self._changed = callbacks.changed;
  self._removed = callbacks.removed;
  self._moved = callbacks.moved;
  self._movedBefore = callbacks.movedBefore;
  self._observeHandleId = nextObserveHandleId++;
};

ObserveHandle.prototype.stop = function () {
  var self = this;
  self._liveResultsSet._removeObserveHandle(self);
  self._liveResultsSet = null;
};

_Rethink.prototype._observeChanges = function (
  cursorDescription, callbacks) {
  var self = this;
  var ordered = false;
  var observeKey = JSON.stringify(
    _.extend({ordered: ordered}, cursorDescription));

  var liveResultsSet;
  var observeHandle;
  var newlyCreated = false;
  console.log('callbacks!!!: ', callbacks);
  if (newlyCreated) {
    console.log('newlycreated');
    liveResultsSet._addFirstObserveHandle(observeHandle);
  } else {
    callbacks.added();
  }

  return observeHandle;
};


_.extend(Meteor, {
  _Rethink: _Rethink
});

// TODO :: write logic for server side publish function
// and see if long polling can be avoided by using Rethink's eventing system

// TODO :: finish implementing Public API

// Returns the Rethink table object; may yield.
// _Rethink.prototype._getTable = function(tableName) {
//   var self = this;

//   var future = new Future();
//   if (self.db) {
//     self.db.collection(tableName, future.resolver());
//   } else {
//     self.table_queue.push({name: tableName,
//                                 callback: future.resolver()});
//   }
//   return future.wait();
// };

// _Rethink.prototype._maybeBeginWrite = function () {
//     var self = this;
//     // var fence = Meteor._CurrentWriteFence.get();
//     if (fence) {
//       return fence.beginWrite();
//     }
//     else {
//       return {committed: function () {}};
//     }
// };

//////////// Public API //////////

//TODO -- provide support for durability / returnVals arguments

// Insert returns an object that contains the following attributes:

//     inserted - the number of documents that were succesfully inserted;
//     replaced - the number of documents that were updated when upsert is used;
//     unchanged - the number of documents that would have been modified, except that the new value was the same as the old value when doing an upsert;
//     errors - the number of errors encountered while inserting;
//     if errors where encountered while inserting, first_error contains the text of the first error;
//     generated_keys - a list of generated primary key values;
//     deleted and skipped - 0 for an insert operation.

