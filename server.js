#! /usr/bin/env node

/*  
|   CEREMONY
*/  ////////////////

var $ = require;

if ( ! process.send ) {
  process.send = console.log;
}

var domain = $('domain').create();

domain.on('error', function (error) {
  process.send({ error: $('util').inspect(error) });
});

domain.run(function () {

  process.title = 'utopiajs';

  var package = $('./package.json');

  // var masterid = process.argv[2];

  // var options = JSON.parse(process.argv[3] || '{}');

  var express     = $('express');
  var app         = express();
  var bodyParser  = $('body-parser');

  app.set('port',           process.env.PORT || 33367);
  app.set('view engine',    'jade');
  app.set('views',          $('path').join(__dirname, 'views'));

  if ( app.get('env') === 'development' ) {
    app.locals.pretty = true;
  }

  app.locals.require = $;

  app.locals.cache = {
    queries: {}
  };

  app.locals.env = app.get('env');

  app.locals.config = package.config;
  app.locals.pkg = package;

  app.locals.page = 'home';

  app.locals.fromNow = function (date) {
    return $('moment')(date).fromNow();
  };

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

  app.use(bodyParser.urlencoded({ extended : true }));
  app.use(bodyParser.json());

  app.use($('method-override')());

  app.use($('compression')());

  /* cache */
  app.use(function (req, res, next) {
    if ( req.path.match(/^\/cdn\//) ) {
      res.set({ 'Cache-Control': 'max-age=172800' });
      res.set({ 'Expires': 'Mon, 29 Nov 2014 21:44:55 GMT' });
    }
    next();
  });

  /* Favicon */
  app.use($('serve-favicon')($('path').join(__dirname, 'public', 'cdn', 'images', 'face.png')));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        HOME
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/', $('./routes/blog').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        PROFILE
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/profile', $('./routes/profile').bind({ app: app }));

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

        TUTS
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/tuts', $('./routes/tuts').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        SEARCH FORM
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.post('/search', $('./routes/blog').bind({ app: app }));

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

        TUT
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/tuts/:tut_id/:tut_slug', $('./routes/tut').bind({ app: app }));
  app.get('/tuts/:tut_id', $('./routes/tut').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        SEARCH POST BY LANGUAGE
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/search/language/:language', $('./routes/search-post-by-language').bind({ app: app }));

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        SEARCH POST BY TAG
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  app.get('/search/tag/:tag', $('./routes/search-post-by-tag').bind({ app: app }));

  app.use(express.static($('path').join(__dirname, 'public')));

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

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        SOCKJS
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  // var echo = $('sockjs').createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });

  // echo.on('connection', function (conn) {
  //   conn.on('data', function (message) {

  //     var bits = message.split(':');

  //     var action = bits[0];

  //     var collection = bits[1];

  //     var options = bits.filter(function (bit, i) {
  //       return i > 1;
  //     }).join(':');

  //     try {
  //       options = JSON.parse(options);
  //     }
  //     catch (error) {
  //       conn.write(['Error', 'Parsing', collection, action, JSON.stringify(options)].join(':'));
  //     }

  //     $('./lib/' + collection)[action](options, function (error, items) {
  //       if ( error ) {
  //         return conn.write(['Error', 'MongoDB', collection, action, JSON.stringify(options)].join(':'));
  //       }
  //       conn.write(['OK', collection, action, JSON.stringify([items, options])].join(':'));
  //     });
  //   });

  //   conn.on('close', function () {

  //   });
  // });

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\

        START SERVER
    
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  var server = $('http').createServer(app);

  // echo.installHandlers(server, { prefix: '/echo' });

  server.listen(app.get('port'), function () {
    process.send({ message: 'started', port: app.get('port'), pid: process.pid });
  });

  /* ON SERVER ERROR */

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