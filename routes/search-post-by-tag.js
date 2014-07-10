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
    $('../lib/blog').find({ tags: { $elemMatch: { key: req.params.tag } } },
      domain.intercept(function (posts) {
        if ( ! posts.length ) {
          return res.redirect('/404');
        }
        res.render('pages/blog', {
          posts: posts,
          page: 'blog',
          search: 'tag',
          title: 'Search all blog posts matching tag ' + req.params.tag,
          description: 'Check all blog posts talking about ' + req.params.tag
        });
      }));
  });
};