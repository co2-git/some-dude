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

    var skin = 'home';
    var index;

    if ( req.body.search ) {
      skin = 'search';
      index = req.body.search;
    }

    else if ( req.params.language ) {
      skin = 'language';
      index = req.params.language;
    }

    else if ( req.params.tag ) {
      skin = 'tag';
      index = req.params.tag;
    }

    var cached;

    route.app.locals.cache.forEach(function (cache) {
      if ( cache.page === 'blog' && cache.skin === skin &&
      cache.index == index ) {
        cached = cache;
      }
    });

    if ( cached ) {
      cached.views ++;
      return res.send(cached.html + '<!-- cached ' +
        route.app.locals.fromNow(cached.cached) + ' | viewed '+
        cached.views + ' time(s) | size of cache: ' +
        $('../lib/sizeof')(route.app.locals.cache) / (1024 * 1024) + ' MB -->');
    }

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

              var cache = {
                html: html,
                cached: +new Date(),
                views: 1,
                page: 'blog',
                skin: skin,
                index: index
              };

              route.app.locals.cache.push(cache);

              res.send(html);
            }));
        }));

    }));
  });
};