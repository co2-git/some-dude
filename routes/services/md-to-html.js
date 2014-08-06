module.exports = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var domain = require('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    var marked = require('marked');
    var md = req.body.contents;

    // marked.setOptions({
    //   highlight: function (code, lang, callback) {
    //     var str = '<pre class="language-' + lang + '">';
    //     str += '<code class="language-' + lang + '">';
    //     str += code;
    //     str += '</code></pre>';
    //     return code;
    //   }
    // });

    res.json({ md: md, html: marked(md).replace(/<pre><code class="lang-(.+)"/g, '<pre class="language-$1"><code class="language-$1"') });
  });
};