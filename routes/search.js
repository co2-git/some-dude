var $ = require;

exports.get = function (req, res, next) {
  if ( res.error ) {
    return next();
  }
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    $('../lib/connect')(domain.intercept(function (db) {

      $('async').parallel(
        {
          languages: function (cb) {
            db.collection('blog').find({},
              {
                _id: 0, id: 0, title: 0, slug: 0, blurb: 0, tags: 0
              })
              .toArray(domain.intercept(function (posts) {
                var lang = [];

                posts.forEach(function (post) {
                  post.languages.forEach(function (language) {
                    if ( lang.indexOf(language.key) === -1 ) {
                      lang.push(language.key);
                    }
                  });
                });
                
                cb(null, lang.sort());
              }));
          },

          tags: function (cb) {
            db.collection('blog').find({},
              {
                _id: 0, id: 0, title: 0, slug: 0, blurb: 0, languages: 0
              })
              .toArray(domain.intercept(function (posts) {
                var tags = [];

                posts.forEach(function (post) {
                  post.tags.forEach(function (tag) {
                    if ( tags.indexOf(tag.key) === -1 ) {
                      tags.push(tag.key);
                    }
                  });
                });
                
                cb(null, tags.sort());
              }));
          }
        },


        domain.intercept(function (results) {
          res.render('pages/search', {
            page: 'search',
            languages: results.languages,
            tags: results.tags
          });
        }));

    }));
  });
};

exports.post = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    var options = {};

    if ( req.body.advanced ) {
      options = {};

      if ( req.body.tags ) {
        options.tags = {
          $elemMatch: {
            key: {
              $in: req.body.tags.split(',')
            }
          }
        };
      }

      if ( req.body.languages ) {
        options.languages = {
          $elemMatch: {
            key: {
              $in: req.body.languages.split(',')
            }
          }
        };
      }

      if ( req.body.tags && req.body.languages ) {
        options = {
          $or: [
            {
              tags: options.tags,
              languages: options.languages
            }
          ]
        };
      }
    }
    else {
      options = { tags: { $elemMatch: { key: req.body.search } } };
    }

    $('../lib/blog').find(options,
      domain.intercept(function (posts) {
        res.render('pages/blog', { posts: posts, page: 'blog', keyword: req.body.search });
      }));
  });
};