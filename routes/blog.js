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
    var options = {};

    if ( req.body.search ) {
      options = { tags: { $elemMatch: { key: { $in: req.body.search.split(/\s+/) } } } };
    }

    if ( req.params.language ) {
      options = { languages: { $elemMatch: { key: req.params.language } } };
    }

    if ( req.params.tag ) {
      options = { tags: { $elemMatch: { key: req.params.tag } } };
    }

    $('../lib/connect')(domain.intercept(function (db) {

      $('async').parallel(
        {
          posts: function (cb) {
            db.collection('blog').find(options)
              .sort({ 'time.posted': -1 })
              .limit(25)
              .toArray(cb);
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
          res.render('pages/blog', {
            page: 'blog',
            languages: results.languages,
            tags: results.tags,
            posts: results.posts,
            search: req.body.search
          });
        }));

    }));
  });
};