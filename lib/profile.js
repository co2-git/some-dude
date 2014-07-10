var $ = require;

/**
  Module to find projects
  ====
**/

/**
  Function to find projects
  ====
**/

exports.find = function (/* Object */ options, /* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    $('./connect')(domain.intercept(function (conn) {
      var $options = {}, $orderBy = {};

      for ( var i in options ) {
        if ( i === '$orderBy' ) {
          for ( var j in options[i] ) {
            $orderBy[j] = options[i][j];
          }
        }
        else {
          $options[i] = options[i];
        }
      }

      var find = conn.collection('profile').find($options);

      if ( Object.keys($orderBy).length ) {
        find.sort($orderBy);
      }

      find.toArray(callback);
    }));
  });
};