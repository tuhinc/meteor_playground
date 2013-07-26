var util = Npm.require('util');
var EventEmitter = Npm.require('events').EventEmitter;
var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');

function SmartTable(collectionName) {
  var self = this;
  this._collection = null;

  if(Meteor.SmartMongo.db) {
    createTable();
  } else {
    Meteor.SmartMongo.on('ready', createTable);
  }

  function createTable() {
    self._collection = Meteor.SmartMongo.db.collection(collectionName);
    self.emit('ready');
  }

  //do both fiber and non-fiber support
  ['insert', 'update', 'remove'].forEach(function(writeMethod) {
    self[writeMethod] = function() {
      var future;
      if(Fibers.current) {
        future = new Future();
        Array.prototype.push.call(arguments, future.resolver());
      }
      applyMethod(arguments);
      if(future) future.wait();
    };

    //ensure called after once _collection is ready
    function applyMethod(args) {
      if(self._collection) {
        doApply();
      } else {
        self.once('ready', doApply);
      }

      function doApply() {
        self['_' + writeMethod].apply(self, args)
      }
    }
  });
}

util.inherits(SmartTable, EventEmitter);

SmartTable.prototype._insert = function _insert(document, callback) {
  if(!document._id) {
    document._id = Random.id();
  }

  this._collection.insert(document, callback);
};

SmartTable.prototype._update = function(selector, mod, options, callback) {
  this._collection.update(selector, mod, options, callback);
};

SmartTable.prototype._remove = function(selector, callback) {
  this._collection.remove(selector, callback);
};

Meteor.SmartTable = SmartTable;