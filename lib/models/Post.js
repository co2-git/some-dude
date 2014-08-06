require('../connect-mongoose')(function (error, mongoose) {

  if ( error ) {
    throw error;
  }

  var schema = new mongoose.Schema({
    id: Number,
    title: String,
    slug: String,
    blurb: String,
    time: {
      started: Date,
      posted: Date,
      updated: Date
    },
    languages: [
      {
        key: String
      }
    ],
    tags: [
      {
        key: String
      }
    ]
  });

  var model = mongoose.model('Post', schema);

  exports.model = model;
});