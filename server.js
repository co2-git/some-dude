#! /usr/bin/env node

/*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
\-\========-------------------------------------========/-/
|-|========               CEREMONY              ========|-|
/-/========-------------------------------------========\-\
\*\========/////////////////////////////////////========/*/

var $ = require;

if ( ! process.send ) {
  process.send = console.log;
}

var domain = $('domain').create();

domain.on('error', function (error) {
  process.send({ error: $('util').inspect(error) });
});

domain.run(function () {

  process.title = 'some-server';

  var package = $('./package.json');

  /*/========\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\========\*\
  \-\========-------------------------------------========/-/
  |-|========             EXPRESS APP             ========|-|
  /-/========-------------------------------------========\-\
  \*\========/////////////////////////////////////========/*/

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        DEPENDENCIES + START EXPRESS APP
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  var express     = $('express');
  var app         = express();
  var bodyParser  = $('body-parser');

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        GET LANGUAGES FROM MONGODB
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

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

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        MAINTAIN CACHE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  setInterval(function () {
    return;
    var sizeof_home = $('./lib/sizeof')(app.locals.cache.pages.home);
    var limit_home = 1024 * 1024;

    var sizeof_search = $('./lib/sizeof')(app.locals.cache.pages.search);
    var limit_search = 1024 * 3;

    process.send({ cachesize: {
      home: sizeof_home,
      search: sizeof_search
    }});

    if ( sizeof_home < limit_home ) {
      throw new Exception('Cache boom!');
    }

    

    if ( sizeof_search < limit_search ) {
      var searches = [];

      for ( var index in app.locals.search ) {
        searches.push({ index: index, search: app.locals.search[index] });
      }

      searches = searches.sort(function (a, b) {
        if ( a.views < b.views ) {
          return -1;
        }

        else if ( a.views > b.views ) {
          return 1;
        }

        return 0;
      });

      console.log(searches);

      
    }
  }, 60 * 60 );

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
        HOME
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECTS
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects', $('./routes/projects').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        PROJECT
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/projects/:project_name', $('./routes/project').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        BLOG
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/blog', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SEARCH FORM
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.post('/search', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SEARCH POST BY LANGUAGE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/search/language/:language', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SEARCH POST BY TAG
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/search/tag/:tag', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SEARCH PAGE
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/search', $('./routes/search').get.bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        POST
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/blog/:post_id/:post_slug', $('./routes/post').bind({ app: app }));
  app.get('/blog/:post_id', $('./routes/post').bind({ app: app }));

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