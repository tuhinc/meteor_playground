var util = Npm.require('util');
var EventEmitter = Npm.require('events').EventEmitter;
var UPDATE_OPERATIONS = generateUpdateOperationsMap();

function Invalidator(table) {
  this._table = table;
  this._cursors = [];
  this._selectors = [];
}

Invalidator.prototype = Object.create(EventEmitter);

Invalidator.prototype.addCursor = function addCursor(cursor) {
  var index = this._cursors.indexOf(cursor);
  if(index < 0) {
    this._cursors.push(cursor);
  }

  //add to correct selector
  var added = false;

  for(var lc=0; lc<this._selectors.length; lc++) {
    var selectorInfo = this._selectors[lc];
    if(Meteor.deepEqual(selectorInfo.selector, cursor._selector)) {
      selectorInfo.cursors.push(cursor);
      added = true;
      break;
    }
  }  

  if(!added) {
    this._selectors.push({
      selector: cursor._selector,
      cursors: [cursor]
    });
  }
};