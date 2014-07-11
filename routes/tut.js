/* Express middleware to display a tut */

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
    $('../lib/tuts').find({ id: +req.params.tut_id }, domain.intercept(function (tuts) {
      if ( ! tuts.length ) {
        return res.render('pages/page-not-found', {
          page: 'tuts',
          disclaimer: 'Tut not found',
          text: 'We are sorry. The tut you are looking for was not found on this server.'});
      }
      res.render('tuts/' + req.params.tut_id, {
        tut: tuts[0],
        page: 'tuts',
        title: tuts[0].title,
        description: tuts[0].blurb
      });
    }));
  });
};