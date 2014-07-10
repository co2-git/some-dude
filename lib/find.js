var $ = require;

/**
  Module to find projects
  ====
**/

/**
  Function to find projects
  ====
**/

module.exports = function (/* String */ collection, /* Object */ options, /* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {

    $('./connect')(domain.intercept(function (conn) {
      var $options = {},
        $orderBy = {},
        $fields = {};

      for ( var i in options ) {
        if ( i === '$orderBy' ) {
          for ( var j in options[i] ) {
            $orderBy[j] = options[i][j];
          }
        }
        else if ( i === '$exclude' ) {
          if ( ! Array.isArray(options.$exclude) ) {
            options.$exclude = [options.$exclude];
          }

          options.$exclude.forEach(function (field) {
            $fields[field] = 0;
          });
        }
        else {
          $options[i] = options[i];
        }
      }

      var find = conn.collection(collection).find($options, $fields);

      if ( Object.keys($orderBy).length ) {
        find.sort($orderBy);
      }

      find.toArray(callback);
    }));
  });
};