
var assert = chai.assert;

describe('module environment', function () {
  var send = 0;
  var acquired = null;
  var special = null;
  var source = null;
  var request = null;

  var box = window.modulebox({
    url: function (arg_acquired, arg_special, arg_source, arg_request) {
      send += 1;
      acquired = JSON.parse(JSON.stringify(arg_acquired));
      special = JSON.parse(JSON.stringify(arg_special));
      request = JSON.parse(JSON.stringify(arg_request));
      source = JSON.parse(JSON.stringify(arg_source));

      return 'http://' + window.location.host + '/module' +
        '?acquired=' + encodeURIComponent(JSON.stringify(acquired)) +
        '&special=' + encodeURIComponent(JSON.stringify(special)) +
        '&source=' + encodeURIComponent(JSON.stringify(source)) +
        '&request=' + encodeURIComponent(JSON.stringify(request));
    }
  });

  it('require.ensure returns no error if module was found', function (done) {
    box.require.ensure(['/self_export.js'], function (err) {
      assert.equal(send, 1);
      assert.deepEqual(acquired, []);
      assert.deepEqual(special, []);
      assert.deepEqual(source, '/');
      assert.deepEqual(request, ['/self_export.js']);

      assert.equal(err, null);

      done(null);
    });
  });

  it('modules are compiled on first require and then reused', function () {
    var exports = box.require('/self_export.js');

    assert.ok(typeof exports === 'object' && exports !== null, 'is object');
    assert.equal(exports, box.require('/self_export.js'));
  });

  it('module.exports is the exported property', function () {
    var exports = box.require('/self_export.js');
    var module = exports.module;

    assert.equal(exports, module.exports);
  });

  it('module.filename matches resolved', function () {
    var exports = box.require('/self_export.js');
    var module = exports.module;

    assert.equal(module.filename, '/self_export.js');
  });

  it('scroped __filename matches resolved', function () {
    var exports = box.require('/self_export.js');

    assert.equal(exports.__filename, '/self_export.js');
  });

  it('scroped __dirname matches resolved', function () {
    var exports = box.require('/self_export.js');

    assert.equal(exports.__dirname, '/');
  });

  it('require.ensure exists and use its own resolve catch', function (done) {
    var exports = box.require('/self_export.js');

    exports.require.ensure(['/self_export.js'], function (err) {
      assert.equal(send, 2);
      assert.deepEqual(acquired, ['/self_export.js']);
      assert.deepEqual(source, '/self_export.js');
      assert.deepEqual(request, ['/self_export.js']);

      assert.equal(err, null);

      done(null);
    });
  });

  it('require use catched object module object', function () {
    var exports = box.require('/self_export.js');

    assert.equal(exports, exports.require('/self_export.js'));
  });

  it('undefined can\'t be affected', function () {
    var exports = box.require('/self_export.js');

    window.undefined = 'so wrong';
    assert.equal(exports.undefined, (void 0));
    window.undefined = (void 0);
  });

  it('require.resolve return filepath', function () {
    var exports = box.require('/self_export.js');

    assert.equal(exports.require.resolve('/self_export.js'), '/self_export.js');
  });

  it('relative requires work within special', function (done) {
    box.require.ensure(['relative'], function (err) {
      assert.equal(err, null);

      var exports = box.require('relative');
      assert.equal(exports, 'internal');
      done(null);
    });
  });

  it('special requires work within special', function (done) {
    box.require.ensure(['one'], function (err) {
      assert.equal(err, null);

      var exports = box.require('one');
      assert.equal(exports, 'two');
      done(null);
    });
  });

});
