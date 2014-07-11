'use strict';
var Readable = require('stream').Readable,
    inherits = require('util').inherits;

function StreamFromFactory(factory, options) {
  if (!(this instanceof StreamFromFactory)) {
    return new StreamFromFactory(factory, options);
  }

  Readable.call(this, options);

  var self = this,
      doneCalled = false,
      factoryCalled = false;

  function done(err, result) {
    if (doneCalled) {
      self.emit('error', new Error('done called to many times: ' +
        JSON.stringify([err, result]) ));
      return;
    } else {
      doneCalled = true;
    }
    if (err) {
      self.emit('error', err);
    }
    self.push(result);
    // don't push null || undefined twice
    if (typeof result !== 'undefined' && result !== null) {
      self.push(null);
    }
  }

  this._read = function() {
    var product;
    if (!factoryCalled) {
      factoryCalled = true;
      if (typeof factory !== 'function') {
        // throw TypeError:
        factory(done);
      }
      try {
        product = factory(done);
      } catch (err) {
        done(err, product);
      }
      if (typeof product !== 'undefined') {
        done(null, product);
      }
    }
  };
}
inherits(StreamFromFactory, Readable);

StreamFromFactory.obj = function(factory, options) {
  options = options || {};
  options.objectMode = true;
  return new StreamFromFactory(factory, options);
};

module.exports = StreamFromFactory;
