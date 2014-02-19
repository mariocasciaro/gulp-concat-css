# [gulp](https://github.com/wearefractal/gulp)-concat-css 
[![Build Status](https://secure.travis-ci.org/mariocasciaro/gulp-concat-css.png?branch=master)](https://travis-ci.org/mariocasciaro/gulp-concat-css) 
[![NPM version](https://badge.fury.io/js/gulp-concat-css.png)](http://badge.fury.io/js/gulp-concat-css) 
[![Dependency Status](https://gemnasium.com/mariocasciaro/gulp-concat-css.png)](https://gemnasium.com/mariocasciaro/gulp-concat-css)

> Concatenate css files, rebasing urls and inlining @import.

## Install

Install with [npm](https://npmjs.org/package/gulp-concat-css).

```
npm install --save-dev gulp-concat-css
```

## Examples

```js
var gulp = require('gulp');
var concatCss = require('gulp-concat-css');

var cloneSink = clone();

gulp.task('default', function () {
  gulp.src('assets/**/*.css')
    .pipe(concatCss("styles/bundle.css"))
    .pipe(gulp.dest('out/'));
});
```

## License

[MIT](http://en.wikipedia.org/wiki/MIT_License) @ Mario Casciaro

-----

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/mariocasciaro/gulp-concat-css/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
