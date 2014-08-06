var $ = require;

module.exports = function (req, res, next) {
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
    console.log(req.session);
    if ( ! req.session['some-session'] ) {
      res.redirect('/');
    }
    else {
      next();
    }
  });
};