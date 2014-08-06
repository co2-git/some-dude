require('../connect-mongoose')(function (error, mongoose) {

  if ( error ) {
    throw error;
  }

  var model = mongoose.model('User', {
    email: String,
    password: String
  });

  exports.model = model;
});