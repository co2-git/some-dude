var $ = require;

module.exports = function (req, res, next) {
  if ( res.error ) {
    return next();
  }
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    $('async').parallel({
      skills: function (cb) {
        $('../lib/profile').find({ type: 'skill', $orderBy: { level: -1 } }, cb);
      },

      social: function (cb) {
        $('../lib/profile').find({ type: 'social', $orderBy: { name: 1 } }, cb);
      }
    }, domain.intercept(function (profile) {
      res.render('pages/profile', {
        page: 'profile',
        profile: profile
      });
    }));
  });
};