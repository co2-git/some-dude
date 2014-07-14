var $ = require;

module.exports = function (req, res, next) {
  var route = this;

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
          post: function (cb) {
            db.collection('blog').findOne({ id: +req.params.post_id}, cb);
          },

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

          var options = route.app.locals;

          var options2 = {
            page: 'post',
            languages: results.languages,
            tags: results.tags,
            post: results.post
          };

          for ( var add in options2 ) {
            options[add] = options2[add];
          }

          $('jade').renderFile(
            $('path').join($('path').dirname(__dirname), 'views', 'posts', req.params.post_id + '.jade'),
            options,
            domain.intercept(function (html) {
              res.html = html;
              next();
            }));
        }));

    }));
  });
};