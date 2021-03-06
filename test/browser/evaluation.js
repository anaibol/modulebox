
var assert = chai.assert;

describe('evaluation', function () {
  var box = window.modulebox();

  var boxCustom = window.modulebox({
    sourcePath: '/custom/module/'
  });

  var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  if (is_chrome) {
    it('source map creates a meaningful stack trace', function (done) {
      box.require.ensure(['/throw.js'], function (err) {
        assert.equal(err, null);

        var produce = box.require('/throw.js');
        setTimeout(function() {
          var error = produce();
          assert.ok((/\/modulebox\/files\/throw\.js/).test(error.stack), 'throw.js exists in stack trace');

          done(null);
        }, 0);
      });
    });

    it('source map creates a meaningful stack trace for specials', function (done) {
      box.require.ensure(['throw'], function (err) {
        assert.equal(err, null);

        var produce = box.require('throw');
        setTimeout(function() {
          var error = produce();
          assert.ok((/\/modulebox\/_special_\/throw\.js/).test(error.stack), 'throw.js exists in stack trace');

          done(null);
        }, 0);
      });
    });

    it('source map filename are customizeable', function (done) {
      boxCustom.require.ensure(['/throw.js'], function (err) {
        assert.equal(err, null);

        var produce = boxCustom.require('/throw.js');
        setTimeout(function() {
          var error = produce();
          assert.ok((/\/custom\/module\/throw\.js/).test(error.stack), 'throw.js exists in stack trace');

          done(null);
        }, 0);
      });
    });
  } else {
    it('source map is assumed to be unsupported', function (done) {
      done(null);
    });
  }

  // !!! TESTING NOTE: for this test to work the variable name `content` must
  // exists in Module.prototype._evaluate.
  it('test that scripts are evaluated in a global scope', function (done) {
    box.require.ensure(['/global_scope.js'], function (err) {
      assert.equal(err, null);

      var type = box.require('/global_scope.js');
      assert.notEqual(type, 'string');

      done(null);
    });
  });

  it('json files are parsed', function (done) {
    box.require.ensure(['/file.json'], function (err) {
      assert.equal(err, null);

      assert.deepEqual(box.require('/file.json'), {
        "name": "file.json"
      });

      done(null);
    });
  });

  it('json files are parsed on special', function (done) {
    box.require.ensure(['json'], function (err) {
      assert.equal(err, null);

      assert.deepEqual(box.require('json'), {
        "simple": "json file"
      });

      done(null);
    });
  });

  it('circular dependency tree is evaluated correctly', function (done) {
    box.require.ensure(['/circle_c.js'], function (err) {
      assert.equal(err, null);

      assert.equal(box.require('/circle_c.js'), '[object Object]');

      done(null);
    });
  });
});
