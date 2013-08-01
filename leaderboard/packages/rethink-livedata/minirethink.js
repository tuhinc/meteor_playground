LocalTable = function() {
  this.docs = {};

  this._observeQueue = new Meteor._SynchronousQueue();

  this.next_qid = 1;

  this.queries = {};

  this._savedOriginals = null;

  this.paused = false;
};