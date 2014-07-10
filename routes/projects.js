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
    $('../lib/projects').find({}, domain.intercept(function (projects) {
      res.render('pages/projects', { projects: projects, page: 'projects' });
    }));
  });
};