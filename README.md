RethinkDB for Meteor 
=================

This is a Smart Package that provides RethinkDB support for Meteor

* Full support for ReQL syntax on both client (Minirethink) and server (RethinkDB) side
* Efficiency (Memory & CPU)
* Scalability

> Disclaimer: This is a work-in-progress! Full functionality has not yet been implemented. There are definitely bugs! :)

Install
-------------

Install RethinkDB from Atmosphere
    
    mrt add rethink-live-data

Install From Git (If you are not using Meteorite)

    mkdir -p packages
    #make sure you created the packages folder
    git submodule add https://github.com/tuhinc/meteor_playground.git packages/rethink-live-data

Usage
-------------
### Tables
Replace `Meteor.Collection` with `Meteor.Table`.
    // old code
    Posts = new Meteor.Collection('posts');

    // with rethink-live-data
    Posts = new Meteor.Table('posts');

On the client side, create an instance of Minirethink to use ReQL syntax instead of Mongo syntax.

    // instantiate Minirethink
    var r = new Minirethink();
  
    // interact with database using ReQL syntax
    r.table('posts').get('username').run(callback);
  
Continue to use publish and subscribe as you normally would. (rethink-live-data does not currently support autopublish)

    // server: publish the posts table.
    Meteor.publish('posts', function () {
    return r.table('posts').run(callback);
    });
  
    // client: subscribe to the posts table
    Meteor.subscribe('posts');
  
    // client will queue incoming post records until ...
    Posts = new Meteor.Table('posts');
    
### Cursors

Currently provides support for `each`, `map`, `fetch`, `count`, and `hasNext`

#### each
Lazily iterate over the result set one element at a time.
    
    cursor.each(callback[, onFinished])
    
#### map
Transform each element of the sequence by applying the given mapping function.

    cursor.map(mappingFunction) → array
  
#### fetch
Returns an array of all documents in the cursor

    cursor.fetch() → array    

#### count
Transform each element of the sequence by applying the given mapping function.

    cursor.count() → integer
    
#### hasNext
Check if there are more elements in the cursor

    cursor.hasNext() → bool
  
    // var hasMore = cur.hasNext();
    

## Compatibility

* Currently does not support autopublish -- publish and subscribe functions must be used!

## Scalability

