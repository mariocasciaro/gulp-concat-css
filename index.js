'use strict';
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var rework = require('rework');
var reworkImport = require('rework-import');
var through = require('through2');
var pluginFunc = require('rework-plugin-function');

module.exports = function(destFile) {
  var buffer = [];
  var firstFile, commonBase;
  var destDir = path.dirname(destFile);

  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-concat-css', 'Streaming not supported'));
      return cb();
    }

    if(!firstFile) {
      firstFile = file;
      commonBase = file.base;
    }

    function urlPlugin(file) {
      return pluginFunc({url: function() {
        var rawUrl = Array.prototype.slice.apply(arguments).join(',');
        var url = rawUrl.split('"').join('');
        url = url.split('\'').join('');
        url = url.trim();

        if(isUrl(url) || isDataURI(url) || path.extname(url) === '.css' || path.resolve(url) === url) {
          return 'url(' + rawUrl + ')';
        }
        var resourceAbsUrl = path.relative(commonBase, path.resolve(path.dirname(file), url));
        resourceAbsUrl = path.relative(destDir, resourceAbsUrl);
        //not all systems use forward slash as path separator
        //this is required by urls.
        if(path.sep === '\\'){
          //replace with forward slash
          resourceAbsUrl = resourceAbsUrl.replace(/\\/g, '/');
        }
        return 'url("' + resourceAbsUrl + '")';
      }});
    }


    function urlRewrite(contents, file) {
      return rework(contents)
        .use(urlPlugin(file))
        .toString()
    }

    try {
      var processedCss = rework(String(file.contents))
        .use(urlPlugin(file.path))
        .use(reworkImport({
          path: [
            '.',
            path.dirname(file.path)
          ],
          transform: urlRewrite
        }))
        .toString();

      // var processedCss = rework(String(file.contents), 'utf-8')
      //   .use(urlPlugin(file))
      //   .use(reworkImporter({
      //     path: file.path,
      //     base: file.base,
      //     preProcess: function(ast, opts) {
      //       return ast.use(urlPlugin(opts));
      //     }
      //   }))
      //   .toString();
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

function isDataURI(url) {
  return url && url.indexOf('data:') === 0;
}
