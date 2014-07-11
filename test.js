'use strict';
var fromFactory = require('./'),
    merge = require('merge-stream'),
    assert = require('assert'),
    recorder = require('stream-recorder'),
    gulp = require('gulp'),
    File = require('vinyl'),
    testfilePath = '/test/file.coffee',
    testfile = new File({
      cwd: '/',
      base: '/test/',
      path: testfilePath,
      contents: new Buffer('answer: 42')
    });

function AsyncFactory(err, result) {
  return function(done) {
    setTimeout(function() {
      done(err, result);
    }, 500);
  };
}

function SyncFactory(err, result) {
  return function() {
    if (err) {
      throw err;
    }
    return result;
  };
}

/*
 * call done twice
 */
function BuggyFactory(err, result) {
  return function(done) {
    setTimeout(function() {
      done(err, result);
      setTimeout(function() {
        done(err, result);
      }, 500);
    }, 500);
  };
}

describe('fromFactory', function() {

  describe('with string as value', function() {
    var input = '\uD834\uDF06';

    it('should emit value', function(done) {
      fromFactory(new AsyncFactory(null, input))
      .on('error', done)
      .pipe(recorder(function(result) {
        assert.deepEqual(result.toString(), input);
        done();
      }))
      .resume();
    });

    describe('and decodeStrings:false option', function() {
      it('should emit value', function(done) {
        fromFactory(new SyncFactory(null, input),
            {decodeStrings: false})
        .on('error', done)
        .pipe(recorder(function(result) {
          assert.deepEqual(result.toString(), input);
          done();
        }))
        .resume();
      });
    });
  });

  it('should emit async errors', function(done) {
    fromFactory(new AsyncFactory(new Error('async test')))
      .on('error', function(err) {
        if (err) {
          assert.ok((err instanceof Error) && /async test/.test(err), err);
          done();
        }
      })
      .resume();
  });

  it('should emit sync errors', function(done) {
    fromFactory(new SyncFactory(new Error('sync test')))
      .on('error', function(err) {
        if (err) {
          assert.ok((err instanceof Error) && /sync test/.test(err), err);
          done();
        }
      })
      .resume();
  });

  it('should throw errors on non factory', function() {
    var sut = fromFactory(null);
    assert.throws(function() {
      sut.read();
    }, /object/);
  });

  it('should emit errors on multiple done calls', function(done) {
    fromFactory(new BuggyFactory(null, 'buggy test'))
      .on('error', function(err) {
        if (err) {
          assert.ok((err instanceof Error) && /done/.test(err), err);
          done();
        }
      })
      .resume();
  });

  it('constructor should return new instance w/o new', function() {
    var sut = fromFactory,
        instance = sut(new AsyncFactory());
    assert.strictEqual(instance instanceof fromFactory, true);
  });
});

describe('fromFactory.obj', function() {

  describe('with string array as value', function() {
    var input = ['foo', 'bar'];
    it('should emit value in object mode', function(done) {
      var opts = {objectMode: true};
      fromFactory(new AsyncFactory(null, input), opts)
        .on('error', done)
        .pipe(recorder(opts, function(result) {
          assert.deepEqual(result, [input]);
          done();
        }))
        .resume();
    });
  });

  [null, undefined].forEach(function(eof) {
    describe('with value == ' + eof, function() {
      it('should end stream', function(done) {
        var opts = {objectMode: true};
        fromFactory(new AsyncFactory(null, eof), opts)
          .on('error', done)
          .pipe(recorder(opts, function(result) {
            assert.deepEqual(result, []);
            done();
          }))
          .resume();
      });
    });
  });

  describe('with mixed object as value', function() {
    var input = ['foo', 1, { foobar: 'foobar', answer: 42 }, {}, 'bar',
          undefined, null];

    it('should emit value', function(done) {
      var opts = {objectMode: true};
      fromFactory.obj(new AsyncFactory(null, input))
        .on('error', done)
        .pipe(recorder(opts, function(result) {
          assert.deepEqual(result, [input]);
          done();
        }))
        .resume();
    });
  });

  describe('in duplex mode', function() {
    it('should insert vinyl file in gulp stream', function(done) {
      var opts = {objectMode: true};
      var sut = new fromFactory.obj(new AsyncFactory(null, testfile));
      merge(gulp.src(__filename), sut)
        .on('error', done)
        .pipe(recorder(opts, function(result) {
          var paths = result.map(function(file) { return file.path; });
          assert.deepEqual(paths.sort(), [testfilePath, __filename].sort());
          done();
        }))
        .resume();
    });
  });

  it('constructor should return new instance w/o new', function() {
    var sut = fromFactory.obj,
        instance = sut();
    assert.strictEqual(instance instanceof fromFactory, true);
  });
});
