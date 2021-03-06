
var gammu = require('node-gammu-json');

/**
 * @namespace abstract:
 */
exports.prototype = {

  /**
   * @name initialize:
   *   Perform device-specific or API-specific initialization.
   */
  initialize: function (_options) {

    this._options = (_options || {});
    this._gammu = gammu.create(this._options);

    return this;
  },

  /**
   * @name send:
   *   Send a new message. The `_message` argument must be an object,
   *   containing at least a `to` property (set to the phone number or
   *   MSISDN of the intended recipient), and a `content` property
   *   (containing the message body, encoded as utf-8 text).
   *
   *   After the message has been successfully transmitted, the
   *   `_callback(_err, _result)` function will be invoked with two
   *   arguments -- `_err` will be a node.js-style error object (or
   *   false-like if no error occurred). THe `_result` argument will be
   *   an object containing, at a minimum, a single `result` property
   *   set to either `success`, `partial`, or `failure`. A result of
   *   `partial` indicates that the message was too large for a single
   *   message, had to be fragmented, and one or more of the fragments
   *   failed to send properly.
   *
   *   This function should return the driver instance in `this`.
   */
  send: function (_message, _callback) {

    if (this._options.debug) {
      process.stderr.write(
        'gammu-json driver: queueing ' + JSON.stringify(_message) + '\n'
      );
    }

    try {
      this._gammu.send(_message.to, _message.content, function (_err, _rv) {

        if (this._options.debug) {
          process.stderr.write(
            'gammu-json driver: sent ' + JSON.stringify(_message) + '\n'
          );
          process.stderr.write(
            'gammu-json driver: status is ' + JSON.stringify(_rv) + '\n'
          );
        }

        return _callback(_err);
      });

    } catch (e) {

      return _callback(new Error(
        'Invalid argument(s) supplied to the `send` method'
      ));
    }

    return this;
  },

  /**
   * @name register_receive_handler:
   *   Ask the driver to invoke `_callback` whenever a message arrives.
   *   The `_handler(_message, _callback)` function will be invoked
   *   for each message received: the `_err` argument is a node.js-style
   *   error object (or false-like if the operation was successful); the
   *   `_message` argument is an object containing at least the `from`,
   *   `timestamp`, and `content` properties; the `_callback(_err)` argument
   *   is a function that must be called by our instansiator once the
   *   message has been safely written to persistent storage. If for some
   *   reason our instansiator cannot accept the message, the function
   *   should still be called, but the `_err` parameter set to a non-null
   *   error object.
   */
  register_receive_handler: function (_handler) {

    var self = this;

    self._gammu.on('receive', function (_message, _callback) {

      if (self._options.debug) {
        process.stderr.write(
          'gammu-json driver: received ' + JSON.stringify(_message) + '\n'
        );
      }

      _handler(_message, function (_e) {

        if (self._options.debug) {
          process.stderr.write(
            'gammu-json driver: receive handler invoked; ' +
              'error status is ' + JSON.stringify(_e) + '\n'
          );
        }

        _callback(_e);
      });

    });

    if (self._options.debug) {
      process.stderr.write(
        'gammu-json driver: registered receive handler' + '\n'
      );
    }

    return self;
  },

  /**
   * @name register_error_handler:
   *   Ask the driver to invoke `_handler(_err)` whenever an error occurs
   *   that cannot be attributed to a requested `send` operation. The
   *   `_err` argument will contain a node.js-style error object, and
   *   should never be null.
   */
  register_error_handler: function (_handler) {

    this._gammu.on('error', function (_err) {
      _handler(_err);
    });

    return this;
  },

  /**
   * @name start:
   *   Start any polling and/or watch operations that are required
   *   for this driver instance to function properly. To avoid data
   *   loss, this function *must* be called after you've registered
   *   callback functions via the `register_receive_handler` and
   *   `register_error_handler` methods.
   */
  start: function () {

    this._gammu.start();
    return this;
  },

  /**
   * @name stop:
   *   Stop any polling and/or watch operations that are currently
   *   running on behalf of this driver instance.
   */
  stop: function () {

    this._gammu.stop();
    return this;
  },

  /**
   * @name destroy:
   *   Release any and all resources held by this driver.
   */
  destroy: function () {

    this._gammu.destroy();
    return this;
  }

};

