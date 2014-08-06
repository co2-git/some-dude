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
    var Post = require('../lib/models/Post').model;

    Post.find({}, domain.intercept(function (posts) {
      res.render('pages/admin', {
        loggedin: true,
        posts: posts
      });
    }));
  });
};