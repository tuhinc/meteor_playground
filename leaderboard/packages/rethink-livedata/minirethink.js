// LocalTable: a set of documents that supports queries and modifiers

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

  // null if not saving originals; a map from id to original document value if
  // saving originals. See comments before saveOriginals().
  this._savedOriginals = null;

  // True when observers are paused and we should not send callbacks.
  this.paused = false;
};

LocalTable.prototype.insert = function(doc) {
  var self = this;

  if (!_.has(doc, '_id')) {
    doc._id = LocalTable._useOID ? new LocalTable._ObjectID() : Random.id();
  }
  // there should be no problem using Meteor's minimongo helper function here
  var id = LocalCollection._idStringify(doc._id);
  if (_.has(self.docs, doc._id)) {
    throw new LocalCollection.MinimongoError("Duplicate _id '" + doc._id + "'");
  }
  // do we need this line of code?
  // self._saveOriginal(id, undefined);
  self.docs[id] = doc;

  var queriesToRecompute = [];
  // trigger live queries that match

  for (var qid in self.queries) {
    var query = self.queries[qid];
    if (query.selector_f(doc)) {
    }
  }
};

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