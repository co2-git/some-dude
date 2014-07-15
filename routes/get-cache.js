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
    return next();
    if ( ! $('./get-cache').client ) {
      $('./get-cache').client = $('redis').createClient(33369);
    }

    $('./get-cache').client.get('page:' + res.page,
      domain.intercept(function (response) {
        if ( ! response ) {
          return next();
        }
        // console.log(response);
        res.send(response + '<!-- cached -->');
      }));
  });
};


