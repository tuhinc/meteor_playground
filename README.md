RethinkDB for Meteor 
=================

This is a Smart Package that provides RethinkDB support for Meteor

* Full support for ReQL syntax on both client (Minirethink) and server (RethinkDB) side
* Efficiency (Memory & CPU)
* Scalability

> Disclaimer: This is still a work-in-progress! Full functionality has not yet been implemented. There are definitely bugs! :)

# Install

Install RethinkDB from Atmosphere
    
    mrt add rethink-live-data

Install From Git (If you are not using Meteorite)

    mkdir -p packages
    #make sure you created the packages folder
    git submodule add https://github.com/tuhinc/meteor_playground.git packages/rethink-live-data

# Usage

## Tables

Replace `Meteor.Collection` with `Meteor.Table`.

eg:-

    // old code
    Posts = new Meteor.Collection('posts');

    // with rethink-live-data
    Posts = new Meteor.Table('posts');

On the client side, create an instance of Minirethink to use ReQL syntax instead of Mongo syntax.

eg:-

    // instantiate Minirethink
    var r = new Minirethink();
  
    // interact with database using ReQL syntax
    r.table('posts').get('username').run(callback);
  
Continue to use publish and subscribe as you normally would. (rethink-live-data does not currently support autopublish)

eg:-

    // server: publish the posts table.
    Meteor.publish('posts', function () {
    return r.table('posts').run(callback);
    });
  
    // client: subscribe to the posts table
    Meteor.subscribe('posts');
  
    // client will queue incoming post records until ...
    Posts = new Meteor.Table('posts');

## Cursors

Currently provides support for `each`, `map`, `fetch`, `count`, and `hasNext`

# each

eg:-

    cursor.each(callback[, onFinished])
  
    >Lazily iterate over the result set one element at a time.
  
### map

eg:-

    cursor.map(mappingFunction) → array
  
    >Transform each element of the sequence by applying the given mapping function.

### fetch

eg:-

    cursor.fetch() → array
  
    >Returns an array of all documents in the cursor

### count

eg:-

    cursor.count() → integer
  
    >Transform each element of the sequence by applying the given mapping function.
  
### hasNext

eg:-

    cursor.hasNext() → bool
  
    >// var hasMore = cur.hasNext();
    >// Check if there are more elements in the cursor



## Compatibility

* Currently does not support autopublish -- publish and subscribe functions must be used!
* But server side `Cursor.observe()` does not exists
* `_id` must be a `String` (will support `ObjectID` and `numbers` soon)

## Scalability

