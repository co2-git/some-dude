#! /usr/bin/env node

/*/================================\*\
|*|
|*|
|*| CEREMONY
|*|
|*|
\*\================================/*/

require('colors');

/** This script is supposed to be run via a cluster
  If not, use console.log instead of process.send
  **/

if ( ! process.send ) {
  process.send = console.log;
}

/** The domain to run the server in
  http://some-dude-blog.com/blog/1/domains-in-javascript-or-how-to-try-catch-errors-in-asynchronous-code
  **/

var domain = require('domain').create();

/** The domain error handler
  **/

domain.on('error', function (error) {
  process.send({ 'uncaught error': {
    message: error.message,
    stack: error.stack
  } });
});

/** Start domain
  **/

domain.run(function () {

  /** Give process a title so it is easily identificable in processes
    **/

  process.title = 'some-process';

  /** Get module information
    **/

  var package = require('./package.json');

  /*/================================\*\
  |*|
  |*|
  |*| EXPRES APP
  |*|
  |*|
  \*\================================/*/

  /** App dependencies
    **/

  var express     = require('express');
  var app         = express();
  var connect     = require('connect')();
  var bodyParser  = require('body-parser');
  var cache       = require('express-redis-cache')({
    port: package.config.redis.port,
    expire: 60 * 60 * 5 // expire every 5 hours
  })
  .on('message', function (message) {
    console.log('[express-redis-cache] %s'.grey, message);
  });

  /** Get a list of languages from MongoDB
    **/

  require('./lib/connect')(domain.intercept(function (db) {
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

  app.set('port', process.env.PORT || package.config.http.port);

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET VIEW ENGINE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.set('view engine', 'jade');

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET VIEW FOLDER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.set('views', require('path').join(__dirname, 'views'));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SET PRETTY HTML SOURCE IN DEV
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  if ( app.get('env') === 'development' ) {
    app.locals.pretty = true;
  }

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SHORTCUT TO ACCESS REQUIRE FROM VIEWS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.require = require;

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========            CACHE CONTROL            ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        RAM CACHE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.cache = [];

  

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        MAKE ENV ACCESSIBLE TO VIEWS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.locals.env = app.get('env');

  app.locals.config = package.config;
  app.locals.pkg = package;

  app.locals.fromNow = function (date) {
    return require('moment')(date).fromNow();
  };

  

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

  app.use(require('method-override')());

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        GZIP COMPRESSION
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(require('compression')());

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========           SESSION & COOKIES         ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  app.locals.session = {};

  app.locals.secret = (process.pid + Math.random()).toString();

  app.use(require('cookie-parser')(app.locals.secret));

  var sessionTime = (1000 * 60 * 60);

  app.use(require('express-session')({
    secret: app.locals.secret,
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: sessionTime, expires: new Date(Date.now() + sessionTime) }
  }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        LOGGER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(require('morgan')(
    function (tokens, req, res) {

      var log = require('util').format('%s %s %s %dms %s',
        res.statusCode.toString().bold,
        req.method,
        req.originalUrl.bold,
        (new Date() - req._startTime),
        res.get('Content-Length'));

      var color;

      if ( res.statusCode < 200 ) {
        color = 'grey';
      }

      else if ( res.statusCode < 300 ) {
        color = 'green';
      }

      else if (res.statusCode < 400 ) {
        color = 'blue';
      }

      else if ( res.statusCode < 500 ) {
        color = 'yellow';
      }

      else if ( res.statusCode < 600 ) {
        color = 'red';
      }
      
      else {
        color = 'magenta';
      }

      console.log(log[color]);

    }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        FAVICON
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(require('serve-favicon')(require('path').join(__dirname, 'public', 'cdn', 'images', 'face.png')));

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========               ROUTER                ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        POSTS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  function goToNext(req, res, next) {
    next();
  }

  [ { get:  '/' },
    { get:  '/blog' },
    // { post: '/search' },
    { get:  '/search/language/:language' },
    { get:  '/search/tag/:tag' }
  ].forEach(function (route) {
    
    var method = Object.keys(route)[0];

    app[method](route[method],
      app.get('env') === 'development' ? cache.route() : goToNext,
      require('./routes/blog').bind({ app: app })
    );

  });

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        POST
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/blog/:post_id/:post_slug',
    function (req, res, next) {
        res.page = 'post_' + req.params.post_id;

        next();
      },
      require('./routes/get-cache').bind({ app: app }),
      require('./routes/post').bind({ app: app }),
      require('./routes/create-cache').bind({ app: app }));
  // app.get('/blog/:post_id', require('./routes/post').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECTS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects', require('./routes/projects').bind(app));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects/:project_name', require('./routes/project').bind({ app: app }));


  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SIGN IN
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/sign-in', require('./routes/sign-in').get.bind({ app: app }));
  app.post('/sign-in', require('./routes/sign-in').post.bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SIGN OUT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/sign-out', require('./routes/sign-out').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        ADMIN
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/admin',
    require('./routes/must-be-logged-in').bind(app),
    require('./routes/admin').bind(app));

  app.get('/admin/edit/:postid',
    // require('./routes/must-be-logged-in'),
    require('./routes/edit'));

  app.post('/admin/edit/:postid',
    // require('./routes/must-be-logged-in'),
    require('./routes/edit'));

  app.post('/services/md-to-html',
    // require('./routes/must-be-logged-in'),
    require('./routes/services/md-to-html'));

  app.get('/posts', require('./routes/posts').bind(app));
  app.get('/posts/:id/:slug', require('./routes/post2').bind(app));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        STATIC ROUTER
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.use(express.static(require('path').join(__dirname, 'public')));

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
      errorResolved = JSON.stringify({ error: error }); // use require(util).inspect() ?
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
        res.sendfile(require('path').join(process.env.imbk_path, 'bower_components', 'imbk-modules', 'assets', 'visual', 'notfound.png'));
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

  var server = require('http').createServer(app);

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