var $ = require;

var mongoose = $('mongoose');

var config = $('../../.config.json').mongodb;

mongoose.connect('mongodb://' + config.host + ':' + config.port + '/francois');

var model = mongoose.model('User', {
  email: String,
  password: String
});

exports.model = model;