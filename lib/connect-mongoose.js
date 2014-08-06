module.exports = function (callback) {
  var self = this;

  var domain = require('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {

    var config = require('../.config.json').mongodb;

    var cache = require('./connect-mongoose');

    if ( ! cache.mongoose ) {
      cache.mongoose = require('mongoose');

      cache.mongoose.connect('mongodb://' + config.host + ':' + config.port + '/francois');
    }

    callback(null, cache.mongoose);
  });
};