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
          // res.cookie('some-cookie',
            
          //   {
          //     email: req.body.email
          //   },

          //   {
          //     maxAge: 999999,
          //     domain: req.host,
          //     secure: true
          //   });

          req.session['some-session'] = {
            email: req.body.email
          };

          res.redirect('/admin');
        }
      }));
  });
};

// bcrypt.genSalt(10, function(err, salt) {
//     bcrypt.hash("aQ1!lD7?-wGDH*672", salt, function(err, hash) {
//         console.log(arguments);
//     });
// });