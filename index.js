'use strict';
var gutil = require('gulp-util'),
  path = require('path'),
  fs = require('fs'),
  through = require('through2');


module.exports = function(destFile) {
  var destDir = path.dirname(destFile);
  var buffer = [];
  var firstFile = null;
  
  function loadCss(fileBase, filePath, contents) {
    if(!contents) {
      try {
        contents = fs.readFileSync(filePath, 'utf8');
      } catch(err) {
        gutil.log(gutil.colors.red("[gulp-concat-css] Cannot resolve import " + filePath));
        return undefined;
      }
    }
    
    return contents
      .replace(/\burl\(\s*'([^']+)'\s*\)/gi, function(match, url) {
        if(isUrl(url)) {
          return match;
        }

        var resourceAbsUrl = path.relative(fileBase, path.resolve(path.dirname(filePath), url));
        var newUrl = path.relative(destDir, resourceAbsUrl);
        return "url('"+newUrl+"')";
      })
      .replace(/@import\s+(?:url\()?["'']([^'"]+)["']\)?/gi, function(match, url) {
        if(isUrl(url)) {
          return match;
        }
        
        return loadCss(fileBase, path.resolve(path.dirname(filePath), url)) || match;
      });
  }


	return through.obj(function(file, enc, cb) {
		if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-concat-css', 'Streaming not supported'));
      return cb();
    }
    
    if(!firstFile) {
      firstFile = file;
    }

    buffer.push(loadCss(file.base, file.path, String(file.contents)));
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
  return (/^[\w]+:\/\/./).test(url);
}


