var $ = require;

/**
  Function to fetch items from MongoDB
  ====
  
  You can pass it options to refine your search as first argument.

  Second argument is a callback that will be called with `Error` error as first argument (null 
  otherwise) and an `Object` response from MongoDB as 2nd argument (or undefined if error)

**/

module.exports = function (/* Object */ options, /* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    $('./connect')(domain.intercept(function (conn) {
      conn.collection('francois').find(options)
        .toArray(callback);
    }));
  });
};