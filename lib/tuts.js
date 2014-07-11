var $ = require;

/**
  Module to find tuts
  ====
**/

/**
  Function to find tuts
  ====
**/

exports.find = function (/* Object */ options, /* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    $('./connect')(domain.intercept(function (conn) {
      conn.collection('tuts').find(options)
        .sort({ 'time.posted': -1 })
        .limit(25)
        .toArray(callback);
    }));
  });
};