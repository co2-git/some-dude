/**
  Angular service to talk with the Web Sockets
  ====
**/

module.exports = function () {
  /* Web Socket URL prefix */
  var sockjs_url = '/echo';

  /* Open a new Web Socket */
  var sockjs = new SockJS(sockjs_url);

  /* Function to trigger on Web Socket opened */
  sockjs.onopen = function () {
    console.log('sockjs open');
  };

  /* Function to trigger on Web Socket message */
  sockjs.onmessage = function (e) {
    switch ( e.type ) {
      case 'message':
        console.log('got message from Web Socket', e);

        var bits = e.data.split(':');

        var error, response, options, parsed, collection, action;

        /* If error */
        if ( bits[0] === 'Error' ) {
          error = new Error(bits[1]);
          collection = bits[2];
          action = bits[3];
          options = JSON.parse(bits[4]);
        }

        /* If OK */
        else if ( bits[0] === 'OK' ) {
          collection = bits[1];
          action = bits[2];
          bits = bits.filter(function (bit, i) {
            return i > 2;
          }).join(':');
          
          try {
            parsed = JSON.parse(bits);
            response = parsed[0];
            options = parsed[1];
          }
          catch ( err )  {
            error = new Error('Reparse');
          }
        }

        /* Execute callbacks matching this message collection, action and options and remove matching
          callbacks from Array */
        callbacks = callbacks.filter(function (cb) {
          if ( cb.collection === collection && cb.action === action && cb.options === JSON.stringify(options) ) {
            console.log('we have a match');
            cb.callback(error, response);
            return false;
          }
          else {
            return true;
          }
        });

        break;
    }
  };

  /* Function to trigger on Web Socket closing */
  sockjs.onclose = function () {
    console.log('closing sock');
  };

  /* Function to trigger on Web Socket error */
  sockjs.onerror = function (error) {
    console.log(error);
  };

  /* Array of functions to be called once Web Socket is ready */
  var queue = [];

  /* Interval that process the queue if Web Socket is ready */
  setInterval(function () {
    if ( sockjs.readyState === 1 ) {
      var queueLength = queue.length;

      for ( var i = 0; i < queueLength; i ++ ) {
        queue[i]();
      }

      queue.splice(0, queueLength);
    }
  }, 500);

  /* The callbacks to be called on message from Web Socket */
  var callbacks = [];

  return function () {
    return {
      find: function (collection, options, callback) {
        queue.push(function () {
          // var uniqueID = ((+new Date()) + (Math.random() * 7919)).toString();
          callbacks.push({
            collection: collection,
            action: 'find',
            options: JSON.stringify(options),
            callback: callback
          });
          sockjs.send('find:' + collection + ':' + JSON.stringify(options));
        });
      }
    };
  };
};