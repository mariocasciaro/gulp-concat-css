var expect = require('chai').expect,
  through = require('through2'),
  gutil = require('gulp-util'),
  fs = require('fs'),
  path = require('path'),
  concatCss = require('../');


function expected(file) {
  var filepath = path.resolve('test/expected', file);
  return new gutil.File({
    path: filepath,
    cwd: process.cwd(),
    base: process.cwd() + '/test/expected',
    contents: fs.readFileSync(filepath)
  });
}

function fixture(file) {
  var filepath = path.join('test/fixtures', file);
  return new gutil.File({
    path: filepath,
    cwd: process.cwd(),
    base: process.cwd() + '/test/fixtures',
    contents: fs.readFileSync(filepath)
  });
}

describe('gulp-concat-css', function() {
  it('should concat, rebase urls and inline imports', function(done) {
    
    var stream = concatCss('build/bundle.css');
    stream
      .pipe(through.obj(function(file, enc, cb) {
        var expectedFile = expected('build/bundle.css');
        expect(String(file.contents)).to.be.equal(String(expectedFile.contents));
        expect(path.basename(file.path)).to.be.equal(path.basename(expectedFile.path));
        expect(file.cwd, "cwd").to.be.equal(expectedFile.cwd);
        expect(file.relative, "relative").to.be.equal(expectedFile.relative);
        done();
      }));
    
    stream.write(fixture('main.css'));
    stream.write(fixture('vendor/vendor.css'));
    stream.end();
  });
});
