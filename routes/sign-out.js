var $ = require;

module.exports = function (req, res, next) {
  if ( res.error ) {
    return next();
  }

  var route = this;
  
  var domain = $('domain').create();

  domain.on('error', function (error) {
    res.error = error;
    next();
  });

  domain.run(function () {
    res.clearCookie['some-cookie'];
    res.redirect('/');
  });
};

// bcrypt.genSalt(10, function(err, salt) {
//     bcrypt.hash("aQ1!lD7?-wGDH*672", salt, function(err, hash) {
//         console.log(arguments);
//     });
// });