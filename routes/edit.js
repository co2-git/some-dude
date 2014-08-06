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
    
    var posts = require('../lib/models/Post').model;

    posts.findOne({ id: +req.params.postid }, domain.intercept(function (post) {

      function render ($post) {
        require('../lib/md')($post,
          domain.intercept(function (md, html) {
            res.render('pages/edit', {
              loggedin: true,
              post: $post,
              md: md,
              html: html
            });
          }));
      }

      if ( req.method.toLowerCase() === 'post' ) {

        for ( var key in req.body ) {
          if ( key in post ) {
            if ( key === 'languages' || key === 'tags' ) {
              post[key] = req.body[key]
                .split(',')
                .map(function (i) {
                  return { key: i };
                });
            }
            else {
              post[key] = req.body[key];
            }
          }
        }

        post.save(domain.intercept(function (post) {
          var marked = require('marked');

          var stream = require('fs').createWriteStream(require('path').join(
            require('path').dirname(__dirname), 'views/posts2/' + req.body.id + '.md'));

          stream.write(req.body.post);

          stream.end();

          stream.on('finish', function () {
            render(post);
          });
        }));

      }

      else {
        render(post);
      }

        
    }));
  });
};