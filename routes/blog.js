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

    var searchOptions = {};
    var db;

    if ( req.body.search ) {
      searchOptions = { tags: { $elemMatch: { key: { $in: req.body.search.split(/\s+/) } } } };
    }

    else if ( req.params.language ) {
      searchOptions = { languages: { $elemMatch: { key: req.params.language } } };
    }

    else if ( req.params.tag ) {
      searchOptions = { tags: { $elemMatch: { key: req.params.tag } } };
    }

    setTimeout(function () {
      if ( ! db ) {
        res.error = new Error('MongoDB time out');
        return next();
      }
    }, 1000 * 3);

    $('../lib/connect')(domain.intercept(function (conn) {

      db = conn;

      $('async').parallel(
        {
          posts: function (cb) {
            db.collection('blog').find(searchOptions)
              .sort({ 'time.posted': -1 })
              .limit(25)
              .toArray(cb);
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
            page: 'blog',
            tags: results.tags,
            posts: results.posts,
            search: req.body.search,
            language: req.params.language,
            tag: req.params.tag
          };

          for ( var add in options2 ) {
            options[add] = options2[add];
          }

          $('jade').renderFile(
            $('path').join($('path').dirname(__dirname), 'views', 'pages', 'blog.jade'),
            options,
            domain.intercept(function (html) {
              
              res.html = html;

              next();
              // res.send(html);
            }));
        }));

    }));
  });
};