#! /usr/bin/env node

/*/================================\*\
|*|
|*|
|*| CEREMONY
|*|
|*|
\*\================================/*/

var $ = require;

/** This script is supposed to be run via a cluster
  If not, use console.log instead of process.send
  **/

if ( ! process.send ) {
  process.send = console.log;
}

/** The domain to run the server in
  http://some-dude-blog.com/blog/1/domains-in-javascript-or-how-to-try-catch-errors-in-asynchronous-code
  **/

var domain = $('domain').create();

/** The domain error handler
  **/

domain.on('error', function (error) {
  process.send({ 'uncaught error': $('util').inspect(error) });
});

/** Start domain
  **/

domain.run(function () {

  /** Give process a title so it is easily identificable in processes
    **/

  process.title = 'some-server';

  /** Get module information
    **/

  var package = $('./package.json');

  /*/================================\*\
  |*|
  |*|
  |*| EXPRES APP
  |*|
  |*|
  \*\================================/*/

  /** App dependencies
    **/

  var express     = $('express');
  var app         = express();
  var bodyParser  = $('body-parser');

  /** Get a list of languages from MongoDB
    **/

  $('./lib/connect')(domain.intercept(function (db) {
    db.collection('blog').find({},
      {
        _id: 0, id: 0, title: 0, slug: 0, blurb: 0, tags: 0
      })
      .toArray(domain.intercept(function (posts) {
        var lang = [];

        posts.forEach(function (post) {
          post.languages.forEach(function (language) {
            if ( lang.indexOf(language.key) === -1 ) {
              lang.push(language.key);
            }
          });
        });

        app.locals.languages = lang.sort();
      }));
  }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET PORT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.set('port', process.env.PORT || 33367);

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET VIEW ENGINE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.set('view engine', 'jade');

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET VIEW FOLDER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.set('views', $('path').join(__dirname, 'views'));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET PRETTY HTML SOURCE IN DEV
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  if ( app.get('env') === 'development' ) {
    app.locals.pretty = true;
  }

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SHORTCUT TO ACCESS REQUIRE FROM VIEWS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.require = $;

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========            CACHE CONTROL            ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        RAM CACHE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.cache = [];

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========           SESSION & COOKIES         ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  app.locals.session = {};

  app.locals.secret = (process.pid + Math.random()).toString();

  app.use($('cookie-parser')(app.locals.secret));

  app.use($('express-session')({ secret: app.locals.secret }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        MAKE ENV ACCESSIBLE TO VIEWS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.env = app.get('env');

  app.locals.config = package.config;
  app.locals.pkg = package;

  app.locals.fromNow = function (date) {
    return $('moment')(date).fromNow();
  };

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        LOGGER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use($('morgan')(
    function (tokens, req, res) {
      process.send({
        log: {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          time: (new Date() - req._startTime),
          length: +res.get('Content-Length')
        }
      });
    }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        AUTO ENCODE/DECODE URL
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(bodyParser.urlencoded({ extended : true }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        AUTO PARSE JSON
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(bodyParser.json());

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        METHOD OVERIDE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use($('method-override')());

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        GZIP COMPRESSION
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use($('compression')());

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        CACHE HEADERS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(function (req, res, next) {
    if ( req.path.match(/^\/cdn\//) ) {
      res.set({ 'Cache-Control': 'max-age=172800' });
      res.set({ 'Expires': 'Mon, 29 Nov 2014 21:44:55 GMT' });
    }
    next();
  });

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        FAVICON
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use($('serve-favicon')($('path').join(__dirname, 'public', 'cdn', 'images', 'face.png')));

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========               ROUTER                ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        POSTS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  [ { get: '/' },
    { get: '/blog' },
    { post: '/search' },
    { get: '/search/language/:language' },
    { get: '/search/tag/:tag' }
  ].forEach(function (route) {
    var method = Object.keys(route)[0];

    app[method](route[method],
      function (req, res, next) {
        res.page = 'home';

        if ( req.body.search ) {
          res.page = 'search/' + req.body.search.split(/\s+/).join('/');
        }

        else if ( req.params.language ) {
          res.page = 'language/' + req.params.language;
        }

        else if ( req.params.tag ) {
          res.page = 'tag/' + req.params.tag;
        }

        next();
      },
      $('./routes/get-cache').bind({ app: app }),
      $('./routes/blog').bind({ app: app }),
      $('./routes/create-cache').bind({ app: app }));
  });

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        POST
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/blog/:post_id/:post_slug',
    function (req, res, next) {
        res.page = 'post_' + req.params.post_id;

        next();
      },
      $('./routes/get-cache').bind({ app: app }),
      $('./routes/post').bind({ app: app }),
      $('./routes/create-cache').bind({ app: app }));
  // app.get('/blog/:post_id', $('./routes/post').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECTS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects', $('./routes/projects').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects/:project_name', $('./routes/project').bind({ app: app }));


  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SIGN IN
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/sign-in', $('./routes/sign-in').get.bind({ app: app }));
  app.post('/sign-in', $('./routes/sign-in').post.bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SIGN OUT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/sign-out', $('./routes/sign-out').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        ADMIN
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/admin',
    $('./routes/must-be-logged-in').bind({ app: app }),
    $('./routes/admin').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        STATIC ROUTER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(express.static($('path').join(__dirname, 'public')));

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========                ERROR                ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        ERROR HANDLDER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  function onError(error, req, res, next) {
    console.log(error.message.red, error.stack.yellow);

    var errorResolved;

    try {
      errorResolved = JSON.stringify({ error: error }); // use $(util).inspect() ?
    }
    
    catch ( _error ) {
      var errorResolved = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
    }

    process.send(errorResolved);

    var type = 'html';

    if ( res.forceType ) {
      type = res.forceType.split(';')[0];
    }

    res.statusCode = 500;

    switch ( type.trim() ) {
      case 'html':
        res.render('pages/error', {
          page: {
            slug: 'error',
            title: 'Error page'
          },
          env: app.get('env'),
          title: 'Erreur',
          error: {
            message: error.message,
            code: error.code,
            stack: error.stack
          }
        });
        break;
      
      case 'image/png':
        res.sendfile($('path').join(process.env.imbk_path, 'bower_components', 'imbk-modules', 'assets', 'visual', 'notfound.png'));
        break;
    }
  }

  /* ERROR */
  app.use(function (req, res, next) {
    if ( ! res.error ) {
      return next();
    }

    onError(res.error, req, res, next);
  });

  /* ERROR 2 */
  app.use(onError);

  
  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        PAGE NOT FOUND
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/
  
  app.use(function(req, res, next) {
    process.send({ error: { 'page not found': req.originalUrl } });

    res.statusCode = 404;
    
    res.render('pages/page-not-found');
  });

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========                SERVER               ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  var server = $('http').createServer(app);

  server.listen(app.get('port'), function () {
    process.send({ message: 'started', port: app.get('port'), pid: process.pid });
  });

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SERVER ERROR
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  server.on('error', function (error) {

    /* Emit error to listeners */

    process.send({ error: {
      message: error.message,
      code: error.code,
      stack: error.stack,
      pid: process.pid
    } });

    var code = 100;

    switch ( error.errno ) {
      case 'EADDRINUSE':
        process.send({
          error: {
            message: 'PORT ALREADY IN USE',
            port: app.get('port')
          }
        });
        code = 101;
        break;
    }

    process.exit(code);
  });
});