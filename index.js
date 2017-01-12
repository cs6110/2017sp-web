var Metalsmith  = require('metalsmith');
var markdown    = require('metalsmith-markdown');
var layouts     = require('metalsmith-layouts');
var sass        = require('metalsmith-sass');
var metadata    = require('metalsmith-metadata');
var relative    = require('metalsmith-relative');
var collections = require('metalsmith-collections');
var filepath    = require('metalsmith-filepath');
var inplace     = require('metalsmith-in-place');
var ignore      = require('metalsmith-ignore');
var define      = require('metalsmith-define');

var url = require('url');

var serveMode = process.argv.indexOf('--serve') != -1;

var site = Metalsmith(__dirname)
  .source('./src')
  .destination('./build')
  .metadata({
    serve: serveMode,
  })
  .use(ignore(['**/.DS_Store']))
  .use(collections({
    pages: {
      pattern: '*.{md,html,pug}',
      sort: 'order',
    }
  }))
  .use(metadata({
    course: 'course.yaml',
    schedule: 'schedule.yaml'
  }))
  .use(relative())
  .use(define({
    resolve: url.resolve,  // Path join helper.
  }))
  .use(inplace({
    engine: "handlebars",
    pattern: "*.{html,md}"
  }))
  .use(inplace({
    engine: "pug",
    pattern: "*.pug",
    rename: true,
  }))
  .use(markdown({
    smartypants: true,
  }))
  .use(sass())
  .use(filepath({
    absolute: true
  }))
  .use(layouts('handlebars'));

if (serveMode) {
  var serve = require('metalsmith-serve');
  var watch = require('metalsmith-watch');
  site = site
    .use(serve())
    .use(watch({
      paths: {
        "${source}/**/*": true,
        "layouts/**/*": "**/*.md",
        "${source}/**/*.yaml": "**/*",
      },
      livereload: true
    }));
}

site.build(function(err) {
  if (err) throw err;
});
