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
      conn.collection('projects').find(options)
        .toArray(callback);
    }));
  });
};