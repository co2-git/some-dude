var $ = require;

exports.in = function (email, password, options, callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    var User = $('./models/User').model;
    var bcrypt = $('bcrypt');

    User.findOne({ email: email },
      domain.intercept(function (user) {
        if ( ! user ) {
          return callback();
        }

        bcrypt.compare(password, user.password,
          domain.intercept(function (same) {
            callback(null, same ? user : null);
          }));
      }));
  });
};