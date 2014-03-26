'use strict';
var gutil = require('gulp-util'),
  path = require('path'),
  fs = require('fs'),
  rework = require('rework'),
  reworkImporter = require('rework-importer'),
  through = require('through2');


module.exports = function(destFile) {
  var destDir = path.dirname(destFile);
  var buffer = [];
  var firstFile = null;
  
  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-concat-css', 'Streaming not supported'));
      return cb();
    }
    
    if(!firstFile) {
      firstFile = file;
    }

    try {
      var processedCss = rework(String(file.contents), 'utf-8')
        .use(reworkImporter({
          path: file.path,
          base: file.base
        }))
        .use(rework.url(function(url){
          if(isUrl(url)) {
            return url;
          }
          var resourceAbsUrl = path.relative(file.base, path.resolve(path.dirname(file.path), url));
          resourceAbsUrl = path.relative(destDir, resourceAbsUrl);
          //not all systems use forward slash as path separator
          //this is required by urls.
          if(path.sep === '\\'){
            //replace with forward slash
            resourceAbsUrl = resourceAbsUrl.replace(/\\/g, '/');
          }
          return resourceAbsUrl;
        }))
        .toString();
    } catch(err) {
      this.emit('error', new gutil.PluginError('gulp-concat-css', err));
      return cb();
    }

    buffer.push(processedCss);
    cb();
  }, function(cb) {
    var concatenatedFile = new gutil.File({
      base: firstFile.base,
      cwd: firstFile.cwd,
      path: path.join(firstFile.base, destFile),
      contents: new Buffer(buffer.join(gutil.linefeed))
    });
    this.push(concatenatedFile);
    cb();
  });
};

function isUrl(url) {
  return (/^([\w]+:)?\/\/./).test(url);
}


