var $ = require;

module.exports = function (req, res, next) {
  var app = this;
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    next(error);
  });

  domain.run(function () {
    require('../lib/models/Post').model
      .findOne({ id: +req.params.id }, domain.intercept(function (post) {

        var marked = require('marked');
        var path = require('path');

        var md = '';

        var stream = require('fs').createReadStream(
          path.join(path.resolve(__dirname, '..'), 'views', 'posts2', post.id + '.md'));

        stream.on('data', function (data) {
          md += data.toString();
        });

        stream.on('end', function () {
          var html = marked(md)
            .replace(/<pre><code class="lang-(.+)"/g, '<pre class="language-$1"><code class="language-$1"')
            .replace(/(<\/code><\/pre>)/g, "\r\n$1");

          var options = app.locals;
          options.post = post;
          
          var jade = require('jade').renderFile(path.join(path.resolve(__dirname, '..'), 'views/pages/post.jade'), options);

          jade = jade.replace(/<\!\-\- html\-\->/, html);

          res.send(jade);
        });
      }));
  });
};