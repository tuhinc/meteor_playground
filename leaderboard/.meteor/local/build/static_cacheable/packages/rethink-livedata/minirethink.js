(function(){ // LocalTable: a set of documents that supports queries and modifiers

// Cursor: a specification for a particular subset of documents, w/
// a defined order, limit, and offset. creating a Cursor with LocalTable.find(),

// LiveResultsSet: the return value of a live query.

LocalTable = function() {
  this.docs = {}; // _id -> document (also containing id)

  this._observeQueue = new Meteor._SynchronousQueue();

  this.next_qid = 1; // live query id generator

  // qid -> live query object. keys:
  //  ordered: bool. ordered queries have moved callbacks and callbacks
  //           take indices.
  //  results: array (ordered) or object (unordered) of current results
  //  results_snapshot: snapshot of results. null if not paused.
  //  cursor: Cursor object for the query.
  //  selector_f, sort_f, (callbacks): functions
  this.queries = {};

  this.chain = [];

  // null if not saving originals; a map from id to original document value if
  // saving originals. See comments before saveOriginals().
  this._savedOriginals = null;

  // True when observers are paused and we should not send callbacks.
  this.paused = false;
};

// ok so we have the get

LocalTable.prototype.get = function (string) {
  var self = this;

  var get = function(string) {
    return new LocalTable.Cursor(self, string);
  };

  self.chain.push(get);
  return self;
};

LocalTable.Cursor = function (table, selector, options) {
  var self = this;
  var doc;

  self.table = table;

  self.db_objects = null;
  self.cursor_pos = 0;

  if (typeof Deps !== "undefined") {
    self.reactive = (options.reactive === undefined) ? true : options.reactive;
  }
};

// handle that comes back from observe.

LocalTable.LiveResultsSet = function () {};

// add support for observe
_.extend(LocalTable.Cursor.prototype, {
  observeChanges: function (options) {
    var self = this;

    var handle = new LocalTable.LiveResultsSet();
    _.extend(handle, {
      collection: self.collection,
      stop: function() {
        if (self.reactive) {
          delete self.table.queries[qid];
        }
      }
    });

    if (self.reactive && Deps.active) {
      Deps.onInvalidate(function () {
        handle.stop();
      });
    }
    // run the observe callbacks resulting from the initial contents
    // before we leave the observe.
  }
});



LocalTable.prototype.insert = function(doc) {
  var self = this;
  console.log(self);
  console.log("hi");
  if (!_.has(doc, '_id')) {
    doc._id = LocalTable._useOID ? new LocalTable._ObjectID() : Random.id();
  }
  // there should be no problem using Meteor's minimongo helper function here
  var id = LocalCollection._idStringify(doc._id);
  if (_.has(self.docs, doc._id)) {
    throw new LocalCollection.MinimongoError("Duplicate _id '" + doc._id + "'");
  }

  //omg. insert that mother fucker!
  self.docs[id] = doc;

  var queriesToRecompute = [];
  // trigger live queries that match

  for (var qid in self.queries) {
    var query = self.queries[qid];
    if (query.selector_f(doc)) {
      if (query.cursor.skip || query.cursor.limit) {
        queriesToRecompute.push(qid);
      } else {
        LocalTable._insertInResults(query, doc);
      }
    }
  }
};





















// LocalTable.Cursor.prototype.rewind = function () {
//   var self = this;
//   self.db_objects = null;
//   self.cursor_pos = 0;
// };

// LocalTable.prototype.run = function(callback) {
//   var self = this;
//   _.each(self.queries, function(query) {
//     query.apply(self, arguments);
//   });
// };

// LocalTable.prototype.insert = function (doc) {
//   var self = this;
//   console.log('hello');
// };








































LocalTable.prototype._saveOriginal = function (id, doc) {
  var self = this;
  // Are we even trying to save originals?
  if (!self._savedOriginals)
    return;
  // Have we previously mutated the original (and so 'doc' is not actually
  // original)?  (Note the 'has' check rather than truth: we store undefined
  // here for inserted docs!)
  if (_.has(self._savedOriginals, id))
    return;
  self._savedOriginals[id] = EJSON.clone(doc);
};
}).call(this);
