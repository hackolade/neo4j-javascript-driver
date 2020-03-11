"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _node = require("./node");

var _chunking = require("./chunking");

var _error = require("../error");

var _channelConfig = _interopRequireDefault(require("./channel-config"));

var _protocolHandshaker = _interopRequireDefault(require("./protocol-handshaker"));

var _connection = _interopRequireDefault(require("./connection"));

var _boltProtocolV = _interopRequireDefault(require("./bolt-protocol-v1"));

var _streamObservers = require("./stream-observers");

/**
 * Copyright (c) 2002-2019 "Neo4j,"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Signature bytes for each response message type
var SUCCESS = 0x70; // 0111 0000 // SUCCESS <metadata>

var RECORD = 0x71; // 0111 0001 // RECORD <value>

var IGNORED = 0x7e; // 0111 1110 // IGNORED <metadata>

var FAILURE = 0x7f; // 0111 1111 // FAILURE <metadata>

function NO_OP() {}

var NO_OP_OBSERVER = {
  onNext: NO_OP,
  onCompleted: NO_OP,
  onError: NO_OP
};
var idGenerator = 0;

var ChannelConnection =
/*#__PURE__*/
function (_Connection) {
  (0, _inherits2["default"])(ChannelConnection, _Connection);

  /**
   * @constructor
   * @param {Channel} channel - channel with a 'write' function and a 'onmessage' callback property.
   * @param {ConnectionErrorHandler} errorHandler the error handler.
   * @param {ServerAddress} address - the server address to connect to.
   * @param {Logger} log - the configured logger.
   * @param {boolean} disableLosslessIntegers if this connection should convert all received integers to native JS numbers.
   */
  function ChannelConnection(channel, errorHandler, address, log) {
    var _this;

    var disableLosslessIntegers = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    (0, _classCallCheck2["default"])(this, ChannelConnection);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ChannelConnection).call(this, errorHandler));
    _this._id = idGenerator++;
    _this._address = address;
    _this._server = {
      address: address.asHostPort()
    };
    _this.creationTimestamp = Date.now();
    _this._disableLosslessIntegers = disableLosslessIntegers;
    _this._pendingObservers = [];
    _this._currentObserver = undefined;
    _this._ch = channel;
    _this._dechunker = new _chunking.Dechunker();
    _this._chunker = new _chunking.Chunker(channel);
    _this._log = log; // connection from the database, returned in response for HELLO message and might not be available

    _this._dbConnectionId = null; // bolt protocol is initially not initialized

    /**
     * @private
     * @type {BoltProtocol}
     */

    _this._protocol = null; // error extracted from a FAILURE message

    _this._currentFailure = null; // Set to true on fatal errors, to get this out of connection pool.

    _this._isBroken = false;

    if (_this._log.isDebugEnabled()) {
      _this._log.debug("".concat((0, _assertThisInitialized2["default"])(_this), " created towards ").concat(address));
    }

    return _this;
  }
  /**
   * Crete new connection to the provided address. Returned connection is not connected.
   * @param {ServerAddress} address - the Bolt endpoint to connect to.
   * @param {Object} config - the driver configuration.
   * @param {ConnectionErrorHandler} errorHandler - the error handler for connection errors.
   * @param {Logger} log - configured logger.
   * @return {Connection} - new connection.
   */


  (0, _createClass2["default"])(ChannelConnection, [{
    key: "connect",

    /**
     * Connect to the target address, negotiate Bolt protocol and send initialization message.
     * @param {string} userAgent the user agent for this driver.
     * @param {Object} authToken the object containing auth information.
     * @return {Promise<Connection>} promise resolved with the current connection if connection is successful. Rejected promise otherwise.
     */
    value: function connect(userAgent, authToken) {
      var _this2 = this;

      return this._negotiateProtocol().then(function () {
        return _this2._initialize(userAgent, authToken);
      });
    }
    /**
     * Execute Bolt protocol handshake to initialize the protocol version.
     * @return {Promise<Connection>} promise resolved with the current connection if handshake is successful. Rejected promise otherwise.
     */

  }, {
    key: "_negotiateProtocol",
    value: function _negotiateProtocol() {
      var _this3 = this;

      var protocolHandshaker = new _protocolHandshaker["default"](this, this._ch, this._chunker, this._disableLosslessIntegers, this._log);
      return new Promise(function (resolve, reject) {
        var handshakeErrorHandler = function handshakeErrorHandler(error) {
          _this3._handleFatalError(error);

          reject(error);
        };

        _this3._ch.onerror = handshakeErrorHandler.bind(_this3);

        if (_this3._ch._error) {
          // channel is already broken
          handshakeErrorHandler(_this3._ch._error);
        }

        _this3._ch.onmessage = function (buffer) {
          try {
            // read the response buffer and initialize the protocol
            _this3._protocol = protocolHandshaker.createNegotiatedProtocol(buffer); // reset the error handler to just handle errors and forget about the handshake promise

            _this3._ch.onerror = _this3._handleFatalError.bind(_this3); // Ok, protocol running. Simply forward all messages to the dechunker

            _this3._ch.onmessage = function (buf) {
              return _this3._dechunker.write(buf);
            }; // setup dechunker to dechunk messages and forward them to the message handler


            _this3._dechunker.onmessage = function (buf) {
              _this3._handleMessage(_this3._protocol.unpacker().unpack(buf));
            }; // forward all pending bytes to the dechunker


            if (buffer.hasRemaining()) {
              _this3._dechunker.write(buffer.readSlice(buffer.remaining()));
            }

            resolve(_this3);
          } catch (e) {
            _this3._handleFatalError(e);

            reject(e);
          }
        };

        protocolHandshaker.writeHandshakeRequest();
      });
    }
    /**
     * Perform protocol-specific initialization which includes authentication.
     * @param {string} userAgent the user agent for this driver.
     * @param {Object} authToken the object containing auth information.
     * @return {Promise<Connection>} promise resolved with the current connection if initialization is successful. Rejected promise otherwise.
     */

  }, {
    key: "_initialize",
    value: function _initialize(userAgent, authToken) {
      var _this4 = this;

      var self = this;
      return new Promise(function (resolve, reject) {
        _this4._protocol.initialize({
          userAgent: userAgent,
          authToken: authToken,
          onError: function onError(err) {
            return reject(err);
          },
          onComplete: function onComplete() {
            return resolve(self);
          }
        });
      });
    }
    /**
     * Get the Bolt protocol for the connection.
     * @return {BoltProtocol} the protocol.
     */

  }, {
    key: "protocol",
    value: function protocol() {
      return this._protocol;
    }
  }, {
    key: "write",

    /**
     * Write a message to the network channel.
     * @param {RequestMessage} message the message to write.
     * @param {ResultStreamObserver} observer the response observer.
     * @param {boolean} flush `true` if flush should happen after the message is written to the buffer.
     */
    value: function write(message, observer, flush) {
      var _this5 = this;

      var queued = this._queueObserver(observer);

      if (queued) {
        if (this._log.isDebugEnabled()) {
          this._log.debug("".concat(this, " C: ").concat(message));
        }

        this._protocol.packer().packStruct(message.signature, message.fields.map(function (field) {
          return _this5._packable(field);
        }));

        this._chunker.messageBoundary();

        if (flush) {
          this._chunker.flush();
        }
      }
    }
    /**
     * "Fatal" means the connection is dead. Only call this if something
     * happens that cannot be recovered from. This will lead to all subscribers
     * failing, and the connection getting ejected from the session pool.
     *
     * @param error an error object, forwarded to all current and future subscribers
     */

  }, {
    key: "_handleFatalError",
    value: function _handleFatalError(error) {
      this._isBroken = true;
      this._error = this.handleAndTransformError(error, this._address);

      if (this._log.isErrorEnabled()) {
        this._log.error("".concat(this, " experienced a fatal error ").concat(JSON.stringify(this._error)));
      }

      if (this._currentObserver && this._currentObserver.onError) {
        this._currentObserver.onError(this._error);
      }

      while (this._pendingObservers.length > 0) {
        var observer = this._pendingObservers.shift();

        if (observer && observer.onError) {
          observer.onError(this._error);
        }
      }
    }
  }, {
    key: "_handleMessage",
    value: function _handleMessage(msg) {
      if (this._isBroken) {
        // ignore all incoming messages when this connection is broken. all previously pending observers failed
        // with the fatal error. all future observers will fail with same fatal error.
        return;
      }

      var payload = msg.fields[0];

      switch (msg.signature) {
        case RECORD:
          if (this._log.isDebugEnabled()) {
            this._log.debug("".concat(this, " S: RECORD ").concat(JSON.stringify(msg)));
          }

          this._currentObserver.onNext(payload);

          break;

        case SUCCESS:
          if (this._log.isDebugEnabled()) {
            this._log.debug("".concat(this, " S: SUCCESS ").concat(JSON.stringify(msg)));
          }

          try {
            var metadata = this._protocol.transformMetadata(payload);

            this._currentObserver.onCompleted(metadata);
          } finally {
            this._updateCurrentObserver();
          }

          break;

        case FAILURE:
          if (this._log.isDebugEnabled()) {
            this._log.debug("".concat(this, " S: FAILURE ").concat(JSON.stringify(msg)));
          }

          try {
            var error = (0, _error.newError)(payload.message, payload.code);
            this._currentFailure = this.handleAndTransformError(error, this._address);

            this._currentObserver.onError(this._currentFailure);
          } finally {
            this._updateCurrentObserver(); // Things are now broken. Pending observers will get FAILURE messages routed until we are done handling this failure.


            this._resetOnFailure();
          }

          break;

        case IGNORED:
          if (this._log.isDebugEnabled()) {
            this._log.debug("".concat(this, " S: IGNORED ").concat(JSON.stringify(msg)));
          }

          try {
            if (this._currentFailure && this._currentObserver.onError) {
              this._currentObserver.onError(this._currentFailure);
            } else if (this._currentObserver.onError) {
              this._currentObserver.onError((0, _error.newError)('Ignored either because of an error or RESET'));
            }
          } finally {
            this._updateCurrentObserver();
          }

          break;

        default:
          this._handleFatalError((0, _error.newError)('Unknown Bolt protocol message: ' + msg));

      }
    }
    /**
     * Send a RESET-message to the database. Message is immediately flushed to the network.
     * @return {Promise<void>} promise resolved when SUCCESS-message response arrives, or failed when other response messages arrives.
     */

  }, {
    key: "resetAndFlush",
    value: function resetAndFlush() {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        _this6._protocol.reset({
          onError: function onError(error) {
            if (_this6._isBroken) {
              // handling a fatal error, no need to raise a protocol violation
              reject(error);
            } else {
              var neo4jError = _this6._handleProtocolError('Received FAILURE as a response for RESET: ' + error);

              reject(neo4jError);
            }
          },
          onComplete: function onComplete() {
            resolve();
          }
        });
      });
    }
  }, {
    key: "_resetOnFailure",
    value: function _resetOnFailure() {
      var _this7 = this;

      this._protocol.reset({
        onError: function onError() {
          _this7._currentFailure = null;
        },
        onComplete: function onComplete() {
          _this7._currentFailure = null;
        }
      });
    }
  }, {
    key: "_queueObserver",
    value: function _queueObserver(observer) {
      if (this._isBroken) {
        if (observer && observer.onError) {
          observer.onError(this._error);
        }

        return false;
      }

      observer = observer || NO_OP_OBSERVER;
      observer.onCompleted = observer.onCompleted || NO_OP;
      observer.onError = observer.onError || NO_OP;
      observer.onNext = observer.onNext || NO_OP;

      if (this._currentObserver === undefined) {
        this._currentObserver = observer;
      } else {
        this._pendingObservers.push(observer);
      }

      return true;
    }
    /*
     * Pop next pending observer form the list of observers and make it current observer.
     * @protected
     */

  }, {
    key: "_updateCurrentObserver",
    value: function _updateCurrentObserver() {
      this._currentObserver = this._pendingObservers.shift();
    }
    /** Check if this connection is in working condition */

  }, {
    key: "isOpen",
    value: function isOpen() {
      return !this._isBroken && this._ch._open;
    }
    /**
     * Call close on the channel.
     * @returns {Promise<void>} - A promise that will be resolved when the underlying channel is closed.
     */

  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this._log.isDebugEnabled()) {
                  this._log.debug("".concat(this, " closing"));
                }

                if (this._protocol && this.isOpen()) {
                  // protocol has been initialized and this connection is healthy
                  // notify the database about the upcoming close of the connection
                  this._protocol.prepareToClose();
                }

                _context.next = 4;
                return this._ch.close();

              case 4:
                if (this._log.isDebugEnabled()) {
                  this._log.debug("".concat(this, " closed"));
                }

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "toString",
    value: function toString() {
      return "Connection [".concat(this.id, "][").concat(this.databaseId || '', "]");
    }
  }, {
    key: "_packable",
    value: function _packable(value) {
      return this._protocol.packer().packable(value);
    }
  }, {
    key: "_handleProtocolError",
    value: function _handleProtocolError(message) {
      this._currentFailure = null;

      this._updateCurrentObserver();

      var error = (0, _error.newError)(message, _error.PROTOCOL_ERROR);

      this._handleFatalError(error);

      return error;
    }
  }, {
    key: "id",
    get: function get() {
      return this._id;
    }
  }, {
    key: "databaseId",
    get: function get() {
      return this._dbConnectionId;
    },
    set: function set(value) {
      this._dbConnectionId = value;
    }
  }, {
    key: "address",
    get: function get() {
      return this._address;
    }
    /**
     * Get the version of the connected server.
     * Available only after initialization
     *
     * @returns {ServerVersion} version
     */

  }, {
    key: "version",
    get: function get() {
      return this._server.version;
    },
    set: function set(value) {
      this._server.version = value;
    }
  }, {
    key: "server",
    get: function get() {
      return this._server;
    }
  }], [{
    key: "create",
    value: function create(address, config, errorHandler, log) {
      var channelConfig = new _channelConfig["default"](address, config, errorHandler.errorCode());
      return new ChannelConnection(new _node.Channel(channelConfig), errorHandler, address, log, config.disableLosslessIntegers);
    }
  }]);
  return ChannelConnection;
}(_connection["default"]);

exports["default"] = ChannelConnection;