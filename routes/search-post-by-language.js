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
    $('../lib/blog').find({ languages: { $elemMatch: { key: req.params.language } } },
      domain.intercept(function (posts) {
        if ( ! posts.length ) {
          return res.redirect('/404');
        }
        res.render('pages/blog', {
          posts: posts,
          page: 'blog',
          search: 'language',
          title: 'Search all blog posts about ' + req.params.language,
          description: 'Deepen your knowledge or curiosity about ' + req.params.language
        });
      }));
  });
};