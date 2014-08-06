var $ = require;

module.exports = function (req, res, next) {
  var app = this;
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    next(error);
  });

  domain.run(function () {
    require('../lib/models/Post').model
      .find({}, domain.intercept(function (posts) {
        res.render('pages/posts', {
          posts: posts
        });
      }));
  });
};