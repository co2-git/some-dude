var $ = require;

module.exports = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var route = this;

  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    return next();
  });

  domain.run(function () {
    res.send(res.html);

    if ( ! $('./get-cache').client ) {
      $('./get-cache').client = $('redis').createClient(33369);
    }

    $('./get-cache').client.set('page:' + res.page,
      res.html,
      domain.intercept(function () {
        console.log(arguments);
      }));
  });
};


