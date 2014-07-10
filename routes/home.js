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
    $('../lib/connect')(domain.intercept(function (db) {
      $('async').parallel(
        {
          skills: function (cb) {
            db.collection('profile')
              .find({ type: 'skill' })
              .limit(30)
              .sort({ level: -1 })
              .toArray(cb);
          },

          project: function (cb) {
            db.collection('projects')
              .find()
              .toArray(domain.intercept(function (projects) {
                cb(null, projects[0]);
              }));
          },

          posts: function (cb) {
            db.collection('blog')
              .find({})
              .sort({ _id: -1 })
              .limit(3)
              .toArray(cb);
          }
        },
        domain.intercept(function (results) {
          res.render('pages/home', {
            skills: results.skills,
            project: results.project,
            posts: results.posts
          });
        }));
    }));
  });
};