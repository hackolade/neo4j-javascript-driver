"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _boltProtocolUtil = require("./bolt-protocol-util");

var _bookmark = _interopRequireDefault(require("./bookmark"));

var _chunking = require("./chunking");

var _connection = _interopRequireDefault(require("./connection"));

var _constants = require("./constants");

var v1 = _interopRequireWildcard(require("./packstream-v1"));

var _requestMessage = _interopRequireDefault(require("./request-message"));

var _streamObservers = require("./stream-observers");

var _txConfig = _interopRequireDefault(require("./tx-config"));

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
var BoltProtocol =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Connection} connection the connection.
   * @param {Chunker} chunker the chunker.
   * @param {boolean} disableLosslessIntegers if this connection should convert all received integers to native JS numbers.
   */
  function BoltProtocol(connection, chunker, disableLosslessIntegers) {
    (0, _classCallCheck2["default"])(this, BoltProtocol);
    this._connection = connection;
    this._packer = this._createPacker(chunker);
    this._unpacker = this._createUnpacker(disableLosslessIntegers);
  }
  /**
   * Returns the numerical version identifier for this protocol
   */


  (0, _createClass2["default"])(BoltProtocol, [{
    key: "packer",

    /**
     * Get the packer.
     * @return {Packer} the protocol's packer.
     */
    value: function packer() {
      return this._packer;
    }
    /**
     * Get the unpacker.
     * @return {Unpacker} the protocol's unpacker.
     */

  }, {
    key: "unpacker",
    value: function unpacker() {
      return this._unpacker;
    }
    /**
     * Transform metadata received in SUCCESS message before it is passed to the handler.
     * @param {Object} metadata the received metadata.
     * @return {Object} transformed metadata.
     */

  }, {
    key: "transformMetadata",
    value: function transformMetadata(metadata) {
      return metadata;
    }
    /**
     * Perform initialization and authentication of the underlying connection.
     * @param {Object} param
     * @param {string} param.userAgent the user agent.
     * @param {Object} param.authToken the authentication token.
     * @param {function(err: Error)} param.onError the callback to invoke on error.
     * @param {function()} param.onComplete the callback to invoke on completion.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "initialize",
    value: function initialize() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          userAgent = _ref.userAgent,
          authToken = _ref.authToken,
          onError = _ref.onError,
          onComplete = _ref.onComplete;

      var observer = new _streamObservers.LoginObserver({
        connection: this._connection,
        afterError: onError,
        afterComplete: onComplete
      });

      this._connection.write(_requestMessage["default"].init(userAgent, authToken), observer, true);

      return observer;
    }
    /**
     * Perform protocol related operations for closing this connection
     */

  }, {
    key: "prepareToClose",
    value: function prepareToClose() {} // no need to notify the database in this protocol version

    /**
     * Begin an explicit transaction.
     * @param {Object} param
     * @param {Bookmark} param.bookmark the bookmark.
     * @param {TxConfig} param.txConfig the configuration.
     * @param {string} param.database the target database name.
     * @param {string} param.mode the access mode.
     * @param {function(err: Error)} param.beforeError the callback to invoke before handling the error.
     * @param {function(err: Error)} param.afterError the callback to invoke after handling the error.
     * @param {function()} param.beforeComplete the callback to invoke before handling the completion.
     * @param {function()} param.afterComplete the callback to invoke after handling the completion.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "beginTransaction",
    value: function beginTransaction() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          bookmark = _ref2.bookmark,
          txConfig = _ref2.txConfig,
          database = _ref2.database,
          mode = _ref2.mode,
          beforeError = _ref2.beforeError,
          afterError = _ref2.afterError,
          beforeComplete = _ref2.beforeComplete,
          afterComplete = _ref2.afterComplete;

      return this.run('BEGIN', bookmark ? bookmark.asBeginTransactionParameters() : {}, {
        bookmark: bookmark,
        txConfig: txConfig,
        database: database,
        mode: mode,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete,
        flush: false
      });
    }
    /**
     * Commit the explicit transaction.
     * @param {Object} param
     * @param {function(err: Error)} param.beforeError the callback to invoke before handling the error.
     * @param {function(err: Error)} param.afterError the callback to invoke after handling the error.
     * @param {function()} param.beforeComplete the callback to invoke before handling the completion.
     * @param {function()} param.afterComplete the callback to invoke after handling the completion.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "commitTransaction",
    value: function commitTransaction() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          beforeError = _ref3.beforeError,
          afterError = _ref3.afterError,
          beforeComplete = _ref3.beforeComplete,
          afterComplete = _ref3.afterComplete;

      // WRITE access mode is used as a place holder here, it has
      // no effect on behaviour for Bolt V1 & V2
      return this.run('COMMIT', {}, {
        bookmark: _bookmark["default"].empty(),
        txConfig: _txConfig["default"].empty(),
        mode: _constants.ACCESS_MODE_WRITE,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
    }
    /**
     * Rollback the explicit transaction.
     * @param {Object} param
     * @param {function(err: Error)} param.beforeError the callback to invoke before handling the error.
     * @param {function(err: Error)} param.afterError the callback to invoke after handling the error.
     * @param {function()} param.beforeComplete the callback to invoke before handling the completion.
     * @param {function()} param.afterComplete the callback to invoke after handling the completion.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "rollbackTransaction",
    value: function rollbackTransaction() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          beforeError = _ref4.beforeError,
          afterError = _ref4.afterError,
          beforeComplete = _ref4.beforeComplete,
          afterComplete = _ref4.afterComplete;

      // WRITE access mode is used as a place holder here, it has
      // no effect on behaviour for Bolt V1 & V2
      return this.run('ROLLBACK', {}, {
        bookmark: _bookmark["default"].empty(),
        txConfig: _txConfig["default"].empty(),
        mode: _constants.ACCESS_MODE_WRITE,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
    }
    /**
     * Send a Cypher query through the underlying connection.
     * @param {string} query the cypher query.
     * @param {Object} parameters the query parameters.
     * @param {Object} param
     * @param {Bookmark} param.bookmark the bookmark.
     * @param {TxConfig} param.txConfig the transaction configuration.
     * @param {string} param.database the target database name.
     * @param {string} param.mode the access mode.
     * @param {function(keys: string[])} param.beforeKeys the callback to invoke before handling the keys.
     * @param {function(keys: string[])} param.afterKeys the callback to invoke after handling the keys.
     * @param {function(err: Error)} param.beforeError the callback to invoke before handling the error.
     * @param {function(err: Error)} param.afterError the callback to invoke after handling the error.
     * @param {function()} param.beforeComplete the callback to invoke before handling the completion.
     * @param {function()} param.afterComplete the callback to invoke after handling the completion.
     * @param {boolean} param.flush whether to flush the buffered messages.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "run",
    value: function run(query, parameters) {
      var _ref5 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          bookmark = _ref5.bookmark,
          txConfig = _ref5.txConfig,
          database = _ref5.database,
          mode = _ref5.mode,
          beforeKeys = _ref5.beforeKeys,
          afterKeys = _ref5.afterKeys,
          beforeError = _ref5.beforeError,
          afterError = _ref5.afterError,
          beforeComplete = _ref5.beforeComplete,
          afterComplete = _ref5.afterComplete,
          _ref5$flush = _ref5.flush,
          flush = _ref5$flush === void 0 ? true : _ref5$flush;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeKeys: beforeKeys,
        afterKeys: afterKeys,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      }); // bookmark and mode are ignored in this version of the protocol

      (0, _boltProtocolUtil.assertTxConfigIsEmpty)(txConfig, this._connection, observer); // passing in a database name on this protocol version throws an error

      (0, _boltProtocolUtil.assertDatabaseIsEmpty)(database, this._connection, observer);

      this._connection.write(_requestMessage["default"].run(query, parameters), observer, false);

      this._connection.write(_requestMessage["default"].pullAll(), observer, flush);

      return observer;
    }
    /**
     * Send a RESET through the underlying connection.
     * @param {Object} param
     * @param {function(err: Error)} param.onError the callback to invoke on error.
     * @param {function()} param.onComplete the callback to invoke on completion.
     * @returns {StreamObserver} the stream observer that monitors the corresponding server response.
     */

  }, {
    key: "reset",
    value: function reset() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          onError = _ref6.onError,
          onComplete = _ref6.onComplete;

      var observer = new _streamObservers.ResetObserver({
        connection: this._connection,
        onError: onError,
        onComplete: onComplete
      });

      this._connection.write(_requestMessage["default"].reset(), observer, true);

      return observer;
    }
  }, {
    key: "_createPacker",
    value: function _createPacker(chunker) {
      return new v1.Packer(chunker);
    }
  }, {
    key: "_createUnpacker",
    value: function _createUnpacker(disableLosslessIntegers) {
      return new v1.Unpacker(disableLosslessIntegers);
    }
  }, {
    key: "version",
    get: function get() {
      return _constants.BOLT_PROTOCOL_V1;
    }
  }]);
  return BoltProtocol;
}();

exports["default"] = BoltProtocol;