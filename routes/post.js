/* Express middleware to display a post */

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
    $('../lib/blog').find({ id: +req.params.post_id }, domain.intercept(function (posts) {
      if ( ! posts.length ) {
        return res.redirect('/404');
      }
      res.render('posts/' + req.params.post_id, {
        post: posts[0],
        page: 'blog',
        title: posts[0].title,
        description: posts[0].blurb
      });
    }));
  });
};