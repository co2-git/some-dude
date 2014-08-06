module.exports = function (post, cb) {
  
  if ( typeof cb !== 'function' ) {
    throw new Error('Missing callback');
  }
  
  var domain = require('domain').create();

  domain.on('error', function (error) {
    cb(error);
  });

  domain.run(function () {
    var marked = require('marked');
    var path = require('path');

    var md = '';

    var stream = require('fs').createReadStream(
      path.join(path.dirname(__dirname), 'views', 'posts2', post.id + '.md'));

    stream.on('data', function (data) {
      md += data.toString();
    });

    stream.on('end', function () {
      cb(null, md, marked(md).replace(/<pre><code class="lang-(.+)"/g, '<pre class="language-$1"><code class="language-$1"'));
    });
  });
};