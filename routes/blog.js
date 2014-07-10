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
    $('../lib/blog').find({}, domain.intercept(function (posts) {
      res.render('pages/blog', { posts: posts, page: 'blog' });
    }));
  });
};