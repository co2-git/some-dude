var $ = require;

exports.get = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var route = this;
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    res.render('pages/sign-in');
  });
};

exports.post = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var route = this;
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    $('../lib/sign').in(req.body.email, req.body.password, {},
      domain.intercept(function (U) {
        if ( ! U ) {
          res.statusCode = 401;
          res.render('pages/sign-in', { no_such_user: 1 });
          return;
        }
        else {
          req.session['some-session'] = {
            email: req.body.email
          };

          res.redirect('/admin');
        }
      }));
  });
};