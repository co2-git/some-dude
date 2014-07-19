module.exports = function (req, res, next) {

  if ( res.error ) {
    return next();
  }

  var route = this;

  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    return next();
  });

  domain.run(function () {
    /* verify if U is logged in Just Sayin */

    if ( ! route.app.locals.session.u ) {
      if ( req.cookies.u ) {
        route.app.locals.session.u = req.cookies.u;
      }
      else {
        console.log('You are not logged in into Just Sayin'.yellow);
        console.log('Redirecting you to opt-in page'.cyan);

        return res.render('pages/sign-in');
      }
    }

    /* verify if U is logged in into Google */

    if ( ! route.app.locals.session.googleAuth ) {
      console.log('You are not logged in into Google'.yellow);

      var google = require('../../lib/google');

      return google.connect(function (error, url) {
        if ( error ) {
          console.error(error.message.red);

          res.error = error;

          next();
        }

        else {
          res.redirect(url);
        }
      });
    }

    /* verify if user exists in database */

    if ( ! route.app.locals.session.user ) {
      var User = require('../../lib/users');

      var email = route.app.locals.session.googleAuth.me.emails[0].value;

      if ( ! email ) {
        res.error = new Error('No email');
        return next();
      }

      User.get(
        {
          email: email
        },
        
        function (error, users) {
          
          if ( error ) {
            res.error = error;
            return next();
          }

          if ( ! users.length ) {
            return User.add(
              {
                email: email,
                justsayin: route.app.locals.session.justsayin
              },

              function (error) {
                if ( error ) {
                  res.error = error;
                  return next();
                }

                route.app.locals.session.user = 1;

                var google = require('../../lib/google');

                return google.timelineInsert(route.app.locals.session.googleAuth, {
                    text: 'Welcome to Just Sayin for Glass'
                  }, function (error, item) {
                    if ( error ) {
                      res.error = error;
                      return next();
                    }
                  });
              });
          }

          route.app.locals.session.user = 1;

          next();
      });
    }

    next();
  });
};