
var fs = require('fs');
var path = require('path');
var endpoint = require('endpoint');
var modulebox = require('../../lib/dispatch.js');

var test = require('tap').test;

var box = modulebox({
  root: path.resolve(__dirname, '..', 'localized'),

  modules: 'modules'
});

function fixture(name) {
  return path.resolve(__dirname, '..', 'fixture', name + '.xml');
}

function matchResult(t, name, actual, callback) {
  fs.readFile(fixture(name), 'utf8', function (err, expected) {
    t.equal(err, null);
    t.equal(actual.toString(), expected);
    callback();
  });
}

test('simple single module request', function (t) {
  var bundle = box.dispatch({
    request: ['/single.js']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'single', actual, t.end.bind(t));
  }));
});

test('big multi chunk file', function (t) {
  var bundle = box.dispatch({
    request: ['/big.js']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'big', actual, t.end.bind(t));
  }));
});

test('simple request from none root location', function (t) {
  var bundle = box.dispatch({
    source: '/modules/simple/index.js',
    request: ['./package.json']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'package', actual, t.end.bind(t));
  }));
});

test('complex dependencies tree', function (t) {
  var bundle = box.dispatch({
    request: ['/complex.js']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'complex', actual, t.end.bind(t));
  }));
});

test('complex dependencies tree with acquired files', function (t) {
  var bundle = box.dispatch({
    request: ['/complex.js'],
    acquired: ['/modules/simple/index.js', '/modules/simple/package.json']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'acquired', actual, t.end.bind(t));
  }));
});

test('request acquired file', function (t) {
  var bundle = box.dispatch({
    request: ['/single.js'],
    acquired: ['/single.js']
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'all_acquired', actual, t.end.bind(t));
  }));
});

test('request dependency do not exists', function (t) {
  var bundle = box.dispatch({
    request: ['/missing_require.js']
  });

  var warning = null;
  bundle.once('warning', function (err) {
    warning = err;
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    t.equal(warning.message, 'Cannot find module \'/missing.js\'');
    t.equal(warning.code, 'MODULE_NOT_FOUND');
    t.equal(warning.name, 'Error');

    matchResult(t, 'dependency_missing', actual, t.end.bind(t));
  }));
});

test('request could not be resolved', function (t) {
  var bundle = box.dispatch({
    request: ['/missing.js']
  });

  var warning = null;
  bundle.once('warning', function (err) {
    warning = err;
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'file_missing', actual, function () {
      t.equal(warning.message, 'Cannot find module \'/missing.js\'');
      t.equal(warning.code, 'MODULE_NOT_FOUND');
      t.equal(warning.name, 'Error');

      t.end();
    });
  }));
});

test('request faulty sub package.json', function (t) {
  var bundle = box.dispatch({
    request: ['/faulty_require.js']
  });

  var warning = null;
  bundle.once('warning', function (err) {
    warning = err;
  });

  bundle.pipe(endpoint(function (err, actual) {
    t.equal(err, null);

    matchResult(t, 'faulty_package', actual, function () {
      t.equal(warning.message, 'Unexpected token s');
      t.equal(warning.name, 'SyntaxError');

      t.end();
    });
  }));
});
