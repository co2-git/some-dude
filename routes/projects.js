var $ = require;

var domain = require('domain').create();

domain.on('error', function (error) {
  console.log('/////////////');
});

domain.run(function () {

  module.exports = function (req, res, next) {
    // console.log(Object.keys(res));

    // console.log(req._events);

    domain.add(req);
    domain.add(res);

    // res.on('error', console.log);

    // console.log(res._events);

    // // console.log(Object.keys(res));

    // res.domain.on('error', function (error) {
    //   throw new Error('GOTCHA');
    // });

    (function (cb) {

      var d = require('domain').create();

      d.on('error', cb);

      d.run(function () {
        throw new Error('jjhsjsjhdsjk');
      });

    })(domain.intercept(function () {}));
  };

    
});