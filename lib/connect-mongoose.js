var $ = require;

module.exports = function (db, callback) {
  var self = this;

  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {

    var config = $('../.config.json').mongodb;

    var cache = $('./connect');

    function onConnError (error) {
      if ( ! cache.retry ) {
        cache.retry = 0;
      }

      cache.retry ++;

      if ( cache.retry > 100 ) {
        throw error;
      }

      delete cache.conn;

      throw error;
    }

    if ( ! cache.conn ) {
      var mongoose = $('mongoose');

      cache.conn = mongoose.connect('mongodb://' + config.host + ':' + config.port + '/');
    }

    callback(null, cache.conn);
  });
};