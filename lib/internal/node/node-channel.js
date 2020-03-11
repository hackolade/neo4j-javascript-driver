"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _net = _interopRequireDefault(require("net"));

var _tls = _interopRequireDefault(require("tls"));

var _fs = _interopRequireDefault(require("fs"));

var _nodeBuf = _interopRequireDefault(require("./node-buf"));

var _util = require("../util");

var _error = require("../../error");

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
var _CONNECTION_IDGEN = 0;
var TrustStrategy = {
  TRUST_CUSTOM_CA_SIGNED_CERTIFICATES: function TRUST_CUSTOM_CA_SIGNED_CERTIFICATES(config, onSuccess, onFailure) {
    if (!config.trustedCertificates || config.trustedCertificates.length === 0) {
      onFailure((0, _error.newError)('You are using TRUST_CUSTOM_CA_SIGNED_CERTIFICATES as the method ' + 'to verify trust for encrypted  connections, but have not configured any ' + 'trustedCertificates. You  must specify the path to at least one trusted ' + 'X.509 certificate for this to work. Two other alternatives is to use ' + 'TRUST_ALL_CERTIFICATES or to disable encryption by setting encrypted="' + _util.ENCRYPTION_OFF + '"' + 'in your driver configuration.'));
      return;
    }

    var tlsOpts = newTlsOptions(config.address.host(), config.trustedCertificates.map(function (f) {
      return _fs["default"].readFileSync(f);
    }));

    var socket = _tls["default"].connect(config.address.port(), config.address.resolvedHost(), tlsOpts, function () {
      if (!socket.authorized) {
        onFailure((0, _error.newError)('Server certificate is not trusted. If you trust the database you are connecting to, add' + ' the signing certificate, or the server certificate, to the list of certificates trusted by this driver' + " using `neo4j.driver(.., { trustedCertificates:['path/to/certificate.crt']}). This " + ' is a security measure to protect against man-in-the-middle attacks. If you are just trying ' + ' Neo4j out and are not concerned about encryption, simply disable it using `encrypted="' + _util.ENCRYPTION_OFF + '"`' + ' in the driver options. Socket responded with: ' + socket.authorizationError));
      } else {
        onSuccess();
      }
    });

    socket.on('error', onFailure);
    return configureSocket(socket);
  },
  TRUST_SERVER_CLIENT_CERTIFICATES: function TRUST_SERVER_CLIENT_CERTIFICATES(config, onSuccess, onFailure) {
    if (!config.trustedCertificates || config.trustedCertificates.length === 0) {
      onFailure((0, _error.newError)("You are using TRUST_CUSTOM_CA_SIGNED_CERTIFICATES as the method " + "to verify trust for encrypted  connections, but have not configured any " + "trustedCertificates. You  must specify the path to at least one trusted " + "X.509 certificate for this to work. Two other alternatives is to use " + "TRUST_ALL_CERTIFICATES or to disable encryption by setting encrypted=\"" + _util.ENCRYPTION_OFF + "\"" + "in your driver configuration."));
      return;
    } else if (!config.key) {
      onFailure((0, _error.newError)("You are using TRUST_SERVER_CLIENT_CERTIFICATES as the method " + "to verify trust for encrypted  connections, but have not configured any" + "key. You  must specify the path to the key for this to work. Two other alternatives is to use " + "TRUST_ALL_CERTIFICATES or to disable encryption by setting encrypted=\"" + _util.ENCRYPTION_OFF + "\"" + "in your driver configuration."));
      return;
    } else if (!config.cert) {
      onFailure((0, _error.newError)("You are using TRUST_SERVER_CLIENT_CERTIFICATES as the method " + "to verify trust for encrypted  connections, but have not configured any " + "client certificates. You  must specify the path to the client certificate for this to work. Two other alternatives is to use " + "TRUST_ALL_CERTIFICATES or to disable encryption by setting encrypted=\"" + _util.ENCRYPTION_OFF + "\"" + "in your driver configuration."));
      return;
    }

    var tlsOpts = Object.assign({}, newTlsOptions(config.address.host()), {
      ca: config.trustedCertificates.map(function (f) {
        return _fs["default"].readFileSync(f);
      }),
      key: _fs["default"].readFileSync(config.key),
      cert: _fs["default"].readFileSync(config.cert),
      passphrase: config.passphrase
    });

    var socket = _tls["default"].connect(config.address.port(), config.address.resolvedHost(), tlsOpts, function () {
      if (!socket.authorized) {
        onFailure((0, _error.newError)("Server certificate is not trusted. If you trust the database you are connecting to, add" + " the signing certificate, or the server certificate, to the list of certificates trusted by this driver" + " using `neo4j.v1.driver(.., { trustedCertificates:['path/to/certificate.crt']}). This " + " is a security measure to protect against man-in-the-middle attacks. If you are just trying " + " Neo4j out and are not concerned about encryption, simply disable it using `encrypted=\"" + _util.ENCRYPTION_OFF + "\"`" + " in the driver options. Socket responded with: " + socket.authorizationError));
      } else {
        onSuccess();
      }
    });

    socket.on('error', onFailure);
    return configureSocket(socket);
  },
  TRUST_SYSTEM_CA_SIGNED_CERTIFICATES: function TRUST_SYSTEM_CA_SIGNED_CERTIFICATES(config, onSuccess, onFailure) {
    var tlsOpts = newTlsOptions(config.address.host());

    var socket = _tls["default"].connect(config.address.port(), config.address.resolvedHost(), tlsOpts, function () {
      if (!socket.authorized) {
        onFailure((0, _error.newError)('Server certificate is not trusted. If you trust the database you are connecting to, use ' + 'TRUST_CUSTOM_CA_SIGNED_CERTIFICATES and add' + ' the signing certificate, or the server certificate, to the list of certificates trusted by this driver' + " using `neo4j.driver(.., { trustedCertificates:['path/to/certificate.crt']}). This " + ' is a security measure to protect against man-in-the-middle attacks. If you are just trying ' + ' Neo4j out and are not concerned about encryption, simply disable it using `encrypted="' + _util.ENCRYPTION_OFF + '"`' + ' in the driver options. Socket responded with: ' + socket.authorizationError));
      } else {
        onSuccess();
      }
    });

    socket.on('error', onFailure);
    return configureSocket(socket);
  },
  TRUST_ALL_CERTIFICATES: function TRUST_ALL_CERTIFICATES(config, onSuccess, onFailure) {
    var tlsOpts = newTlsOptions(config.address.host());

    var socket = _tls["default"].connect(config.address.port(), config.address.resolvedHost(), tlsOpts, function () {
      var certificate = socket.getPeerCertificate();

      if ((0, _util.isEmptyObjectOrNull)(certificate)) {
        onFailure((0, _error.newError)('Secure connection was successful but server did not return any valid ' + 'certificates. Such connection can not be trusted. If you are just trying ' + ' Neo4j out and are not concerned about encryption, simply disable it using ' + '`encrypted="' + _util.ENCRYPTION_OFF + '"` in the driver options. ' + 'Socket responded with: ' + socket.authorizationError));
      } else {
        onSuccess();
      }
    });

    socket.on('error', onFailure);
    return configureSocket(socket);
  }
  /**
   * Connect using node socket.
   * @param {ChannelConfig} config - configuration of this channel.
   * @param {function} onSuccess - callback to execute on connection success.
   * @param {function} onFailure - callback to execute on connection failure.
   * @return {*} socket connection.
   */

};

function connect(config, onSuccess) {
  var onFailure = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {
    return null;
  };
  var trustStrategy = trustStrategyName(config);

  if (!isEncrypted(config)) {
    var socket = _net["default"].connect(config.address.port(), config.address.resolvedHost(), onSuccess);

    socket.on('error', onFailure);
    return configureSocket(socket);
  } else if (TrustStrategy[trustStrategy]) {
    return TrustStrategy[trustStrategy](config, onSuccess, onFailure);
  } else {
    onFailure((0, _error.newError)('Unknown trust strategy: ' + config.trust + '. Please use either ' + "trust:'TRUST_CUSTOM_CA_SIGNED_CERTIFICATES' or trust:'TRUST_ALL_CERTIFICATES' in your driver " + 'configuration. Alternatively, you can disable encryption by setting ' + '`encrypted:"' + _util.ENCRYPTION_OFF + '"`. There is no mechanism to use encryption without trust verification, ' + 'because this incurs the overhead of encryption without improving security. If ' + 'the driver does not verify that the peer it is connected to is really Neo4j, it ' + 'is very easy for an attacker to bypass the encryption by pretending to be Neo4j.'));
  }
}

function isEncrypted(config) {
  var encryptionNotConfigured = config.encrypted == null || config.encrypted === undefined;

  if (encryptionNotConfigured) {
    // default to using encryption if trust-all-certificates is available
    return false;
  }

  return config.encrypted === true || config.encrypted === _util.ENCRYPTION_ON;
}

function trustStrategyName(config) {
  if (config.trust) {
    return config.trust;
  }

  return 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES';
}
/**
 * Create a new configuration options object for the {@code tls.connect()} call.
 * @param {string} hostname the target hostname.
 * @param {string|undefined} ca an optional CA.
 * @return {Object} a new options object.
 */


function newTlsOptions(hostname) {
  var ca = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  return {
    rejectUnauthorized: false,
    // we manually check for this in the connect callback, to give a more helpful error to the user
    servername: hostname,
    // server name for the SNI (Server Name Indication) TLS extension
    ca: ca // optional CA useful for TRUST_CUSTOM_CA_SIGNED_CERTIFICATES trust mode

  };
}
/**
 * Update socket options for the newly created socket. Accepts either `net.Socket` or its subclass `tls.TLSSocket`.
 * @param {net.Socket} socket the socket to configure.
 * @return {net.Socket} the given socket.
 */


function configureSocket(socket) {
  socket.setKeepAlive(true);
  return socket;
}
/**
 * In a Node.js environment the 'net' module is used
 * as transport.
 * @access private
 */


var NodeChannel =
/*#__PURE__*/
function () {
  /**
   * Create new instance
   * @param {ChannelConfig} config - configuration for this channel.
   */
  function NodeChannel(config) {
    (0, _classCallCheck2["default"])(this, NodeChannel);
    var self = this;
    this.id = _CONNECTION_IDGEN++;
    this._pending = [];
    this._open = true;
    this._error = null;
    this._handleConnectionError = this._handleConnectionError.bind(this);
    this._handleConnectionTerminated = this._handleConnectionTerminated.bind(this);
    this._connectionErrorCode = config.connectionErrorCode;
    this._conn = connect(config, function () {
      if (!self._open) {
        return;
      }

      self._conn.on('data', function (buffer) {
        if (self.onmessage) {
          self.onmessage(new _nodeBuf["default"](buffer));
        }
      });

      self._conn.on('error', self._handleConnectionError);

      self._conn.on('end', self._handleConnectionTerminated); // Drain all pending messages


      var pending = self._pending;
      self._pending = null;

      for (var i = 0; i < pending.length; i++) {
        self.write(pending[i]);
      }
    }, this._handleConnectionError);

    this._setupConnectionTimeout(config, this._conn);
  }

  (0, _createClass2["default"])(NodeChannel, [{
    key: "_handleConnectionError",
    value: function _handleConnectionError(err) {
      var msg = 'Failed to connect to server. ' + 'Please ensure that your database is listening on the correct host and port ' + 'and that you have compatible encryption settings both on Neo4j server and driver. ' + 'Note that the default encryption setting has changed in Neo4j 4.0.';
      if (err.message) msg += ' Caused by: ' + err.message;
      this._error = (0, _error.newError)(msg, this._connectionErrorCode);

      if (this.onerror) {
        this.onerror(this._error);
      }
    }
  }, {
    key: "_handleConnectionTerminated",
    value: function _handleConnectionTerminated() {
      this._open = false;
      this._error = (0, _error.newError)('Connection was closed by server', this._connectionErrorCode);

      if (this.onerror) {
        this.onerror(this._error);
      }
    }
    /**
     * Setup connection timeout on the socket, if configured.
     * @param {ChannelConfig} config - configuration of this channel.
     * @param {Object} socket - `net.Socket` or `tls.TLSSocket` object.
     * @private
     */

  }, {
    key: "_setupConnectionTimeout",
    value: function _setupConnectionTimeout(config, socket) {
      var timeout = config.connectionTimeout;

      if (timeout) {
        socket.on('connect', function () {
          // connected - clear connection timeout
          socket.setTimeout(0);
        });
        socket.on('timeout', function () {
          // timeout fired - not connected within configured time. cancel timeout and destroy socket
          socket.setTimeout(0);
          socket.destroy((0, _error.newError)("Failed to establish connection in ".concat(timeout, "ms"), config.connectionErrorCode));
        });
        socket.setTimeout(timeout);
      }
    }
    /**
     * Write the passed in buffer to connection
     * @param {NodeBuffer} buffer - Buffer to write
     */

  }, {
    key: "write",
    value: function write(buffer) {
      // If there is a pending queue, push this on that queue. This means
      // we are not yet connected, so we queue things locally.
      if (this._pending !== null) {
        this._pending.push(buffer);
      } else if (buffer instanceof _nodeBuf["default"]) {
        this._conn.write(buffer._buffer);
      } else {
        throw (0, _error.newError)("Don't know how to write: " + buffer);
      }
    }
    /**
     * Close the connection
     * @returns {Promise} A promise that will be resolved after channel is closed
     */

  }, {
    key: "close",
    value: function close() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var cleanup = function cleanup() {
          if (!_this._conn.destroyed) {
            _this._conn.destroy();
          }

          resolve();
        };

        if (_this._open) {
          _this._open = false;

          _this._conn.removeListener('end', _this._handleConnectionTerminated);

          _this._conn.on('end', function () {
            return cleanup();
          });

          _this._conn.on('close', function () {
            return cleanup();
          });

          _this._conn.end();

          _this._conn.destroy();
        } else {
          cleanup();
        }
      });
    }
  }]);
  return NodeChannel;
}();

exports["default"] = NodeChannel;