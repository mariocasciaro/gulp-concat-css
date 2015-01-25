'use strict';
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var rework = require('rework');
var reworkImport = require('rework-import');
var through = require('through2');
var parseImport = require('parse-import');
var reworkUrl = require('rework-plugin-url');

module.exports = function(destFile) {
  var buffer = [];
  var firstFile, commonBase;
  var destDir = path.dirname(destFile);
  var urlImportRules = [];

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
      return reworkUrl(function(url) {
        if(isUrl(url) || isDataURI(url) || path.extname(url) === '.css' || path.resolve(url) === url) {
          return url;
        }

        var resourceAbsUrl = path.relative(commonBase, path.resolve(path.dirname(file), url));
        resourceAbsUrl = path.relative(destDir, resourceAbsUrl);
        //not all systems use forward slash as path separator
        //this is required by urls.
        if(path.sep === '\\'){
          //replace with forward slash
          resourceAbsUrl = resourceAbsUrl.replace(/\\/g, '/');
        }
        return resourceAbsUrl;
      });
    }


    function collectImportUrls(styles) {
      var outRules = [];
      styles.rules.forEach(function(rule) {
        if(rule.type !== 'import') {
          return outRules.push(rule);
        }

        var importData = parseImport('@import ' + rule.import + ';');
        var importPath = importData && importData[0].path;
        if(isUrl(importPath)) {
          return urlImportRules.push(rule);
        }
        return outRules.push(rule);
      });
      styles.rules = outRules;
    }


    function urlRewrite(contents) {
      return rework(contents)
        .use(urlPlugin(this.source))
        .use(collectImportUrls)
        .toString()
    }

    try {
      var processedCss = rework(String(file.contents))
        .use(urlPlugin(file.path))
        .use(collectImportUrls)
        .use(reworkImport({
          path: [
            '.',
            path.dirname(file.path)
          ],
          transform: urlRewrite
        }))
        .toString();
    } catch(err) {
      this.emit('error', new gutil.PluginError('gulp-concat-css', err));
      return cb();
    }

    buffer.push(processedCss);
    cb();
  }, function(cb) {
    var contents = urlImportRules.map(function(rule) {
      return '@import ' + rule.import + ';';
    }).concat(buffer).join(gutil.linefeed);

    var concatenatedFile = new gutil.File({
      base: firstFile.base,
      cwd: firstFile.cwd,
      path: path.join(firstFile.base, destFile),
      contents: new Buffer(contents)
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
