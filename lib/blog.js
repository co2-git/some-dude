var $ = require;

/**
  Module to find blog posts
  ====
**/

/**
  Function to find blog posts
  ====
**/

exports.find = function (/* Object */ options, /* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    $('./connect')(domain.intercept(function (conn) {
      conn.collection('blog').find(options)
        .sort({ 'time.posted': -1 })
        .limit(25)
        .toArray(callback);
    }));
  });
};