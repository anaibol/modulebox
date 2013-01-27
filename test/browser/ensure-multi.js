
var assert = chai.assert;

describe('multi module ensure on a working destination', function () {
  var send = 0;
  var acquired = null;
  var source = null;
  var request = null;

  var box = window.modulebox({
    url: function (arg_acquired, arg_source, arg_request) {
      send += 1;
      acquired = JSON.parse(JSON.stringify(arg_acquired));
      request = JSON.parse(JSON.stringify(arg_request));
      source = JSON.parse(JSON.stringify(arg_source));

      return 'http://localhost:17000/module' +
        '?acquired=' + JSON.stringify(acquired) +
        '&source=' + JSON.stringify(source) +
        '&request=' + JSON.stringify(request);
    }
  });

  it('errors are insolated intro individual requires', function (done) {
    box.require.ensure(['/missingA.js', '/missingB.js'], function (err) {
      assert.equal(send, 1);

      assert.deepEqual(acquired, []);
      assert.deepEqual(source, '/');
      assert.deepEqual(request, ['/missingA.js', '/missingB.js']);

      assert.equal(err, null);

      try {
        box.require('/missingA.js');
      } catch (err) {
        assert.equal(err.message, 'Cannot find module \'/missingA.js\'');
        assert.equal(err.name, 'Error');
        assert.equal(err.code, 'MODULE_NOT_FOUND');
      }

      try {
        box.require('/missingB.js');
      } catch (err) {
        assert.equal(err.message, 'Cannot find module \'/missingB.js\'');
        assert.equal(err.name, 'Error');
        assert.equal(err.code, 'MODULE_NOT_FOUND');
      }

      done(null);
    });
  });

  it('resolve error do not affect working modules', function (done) {
    box.require.ensure(['/missing.js', '/self_export.js'], function (err) {
      assert.equal(send, 2);

      assert.deepEqual(acquired, []);
      assert.deepEqual(source, '/');
      assert.deepEqual(request, ['/missing.js', '/self_export.js']);

      assert.equal(err, null);

      try {
        box.require('/missing.js');
      } catch (err) {
        assert.equal(err.message, 'Cannot find module \'/missing.js\'');
        assert.equal(err.name, 'Error');
        assert.equal(err.code, 'MODULE_NOT_FOUND');
      }

      var exports = box.require('/self_export.js');
      assert.ok(typeof exports.module === 'object' && exports.module !== null);

      done(null);
    });
  });

  it('If everything is already fetched do not send request', function (done) {
    box.require.ensure(['/missing.js', '/self_export.js'], function (err) {
      assert.equal(send, 2);
      assert.equal(err, null);

      done(null);
    });
  });

  it('already fetched requires are removed', function (done) {
    box.require.ensure(['/missing.js', '/self_export.js', '/single.js'], function (err) {
      assert.equal(send, 3);

      assert.deepEqual(acquired, ['/self_export.js']);
      assert.deepEqual(source, '/');
      assert.deepEqual(request, ['/single.js']);

      assert.equal(err, null);

      // do not throw
      box.require('/single.js');

      done(null);
    });
  });
});