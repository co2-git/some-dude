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
    $('../lib/tuts').find({}, domain.intercept(function (tuts) {
      res.render('pages/tuts', { tuts: tuts, page: 'tuts' });
    }));
  });
};