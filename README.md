# stream-from-factory [![Dependencies Status Image](https://gemnasium.com/schnittstabil/stream-from-factory.svg)](https://gemnasium.com/schnittstabil/stream-from-factory) [![Build Status Image](https://travis-ci.org/schnittstabil/stream-from-factory.svg)](https://travis-ci.org/schnittstabil/stream-from-factory) [![Coverage Status](https://coveralls.io/repos/schnittstabil/stream-from-factory/badge.png)](https://coveralls.io/r/schnittstabil/stream-from-factory)

Create streams from sync and async factories.

```bash
npm install stream-from-factory --save
```

## About Factories

A factory is simply a function creating a product (i.e. a JavaScript value, like numbers, objects, etc.) and sends it back to its caller.

(The term _factory_ refers to the idea of Joshua Blochs _static factory methods_, not to _abstract factories_, nor to _factory methods_.)

### Synchronous Factories

_Synchronous Factories_ are functions `return`ing a single product - other than `undefined` - or throwing an arbitrary JavaScript value:

```JavaScript
function syncFactory() {
  if (...) {
    throw new Error('sth. went wrong...'); // typically Errors are thrown
  }
  return null; // that's ok (typeof null !== 'undefined'), but see below (API)
}
```
### Asynchronous Factories

_Asynchronous Factories_ working with callbacks (in node style), but don't return a value;

```JavaScript
function asyncFactory(done) {
  if (...) {
    // return an error:
    done(new Error('sth. went wrong...'));
    return; // that's ok (!)
  }
  // return a result:
  done(null, ['a', 'string', 'array']);
}
```

## Usage

### Factories creating `String | Buffer`s

```JavaScript
var StreamFromFactory = require('stream-from-factory');

function syncFactory() {
  return new Buffer('buff!');
}

function asyncFactory(done) {
  setTimeout(function() {
    done(null, 'strrrring!');
  }, 1000);
}


StreamFromFactory(syncFactory)
  .pipe(process.stdout); // output: buff!

StreamFromFactory(asyncFactory)
  .pipe(process.stdout); // output: strrrring!
```

### Factories creating arbitrary JavaScript values

```JavaScript
var StreamFromFactory = require('stream-from-factory');

function logFunc(){
  console.log('func!?!');
};

function asyncFactory(done) {
  setTimeout(function() {
    done(null, logFunc);
  }, 1000);
}

StreamFromFactory.obj(asyncFactory)
  .on('data', function(fn){
    fn(); // output: func!?!
  });
```

### Errors

```JavaScript
var StreamFromFactory = require('stream-from-factory');

function syncFactory() {
  throw new Error('sth. went wrong ;-)');
}

function asyncFactory(done) {
  setTimeout(function() {
    done(new Error('sth. went wrong ;-)'));
  }, 1000);
}

StreamFromFactory(syncFactory)
  .on('error', function(err){
    console.log(err); // output: [Error: sth. went wrong ;-)]
  })
  .on('data', function(data){
    // do something awsome
  });
```

### [Gulp](http://gulpjs.com/) File Factories

Gulp files are [vinyl](https://github.com/wearefractal/vinyl) files:

```bash
npm install vinyl
```

Test some awsome Gulp plugin:

```JavaScript
var StreamFromFactory = require('stream-from-factory'),
    File = require('vinyl');

function creatTestFile(){
  return new File({
    cwd: '/',
    base: '/hello/',
    path: '/hello/hello.js',
    contents: new Buffer('console.log("Hello");')
  });
}

StreamFromFactory.obj(creatTestFile)
  .pipe(someAwsomeGulpPlugin())
  .on('data', function(file){
    console.log(file.contents.toString()); // dunno what someAwsomeGulpPlugin does :)
  });
```

See also [stream-recorder](https://github.com/schnittstabil/stream-recorder) for testing gulp plugins.

## API

### Class: StreamFromFactory

_StreamFromFactorys_ are [Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable_1) streams.

#### new StreamFromFactory(factory, [options])

* _factory_ `Function` Async or sync factory.
* _options_ `Object` passed through [new Readable([options])](http://nodejs.org/api/stream.html#stream_new_stream_readable_options)

Notes:

* The `new` operator can be omitted.
* `null` is special for streams (signals end-of-stream). Using a factory returning `null` will result in an empty stream.

#### StreamFromFactory#obj(factory, [options])

A convenience wrapper for `new StreamFromFactory(factory, {objectMode: true, ...})`.

## License

Copyright (c) 2014 Michael Mayer

Licensed under the MIT license.
