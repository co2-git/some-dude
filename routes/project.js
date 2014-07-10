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
    $('../lib/projects').find({ codename: req.params.project_name }, domain.intercept(function (projects) {
      res.render('pages/project', { project: projects[0], page: 'projects' });
    }));
  });
};