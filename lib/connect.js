var $ = require;

/**
  Function to connect to mongoDB
  ====
  It uses require's cache to cache existing mongoDB connections and use them in order not to create too many connections.
  It takes a callback as only argument that will be called with `Error` error as the first argument (null if no error) and with `MongoDB.db` conn as second argument if no error.
  Example to get a connection to fetch something:
      require('francois/lib/connect')(function (error, conn) {
        if ( error ) throw error;
        conn.collection('myCollection').find({});
      });
**/
module.exports = function (/* Function */ callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {

    // use require's cache
    var cache = $('./connect');

    // if no function cached create one
    if ( ! cache.conn ) {
      var client = $('mongodb').MongoClient;

      var config = $('../.config.json').mongodb;

      client.connect($('util').format('mongodb://%s:%s/%s', config.host, config.port.toString(), config.db),
        domain.intercept(function (conn) {
          // Save connection in cache
          cache.conn = conn;
          callback(null, conn);
        }));
    }

    // otherwise use cache
    else {
      callback(null, cache.conn);
    }
  });
};