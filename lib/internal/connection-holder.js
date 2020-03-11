"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EMPTY_CONNECTION_HOLDER = exports["default"] = void 0;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _error = require("../error");

var _util = require("./util");

var _constants = require("./constants");

var _bookmark = _interopRequireDefault(require("./bookmark"));

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

/**
 * Utility to lazily initialize connections and return them back to the pool when unused.
 */
var ConnectionHolder =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {string} mode - the access mode for new connection holder.
   * @param {string} database - the target database name.
   * @param {ConnectionProvider} connectionProvider - the connection provider to acquire connections from.
   */
  function ConnectionHolder() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$mode = _ref.mode,
        mode = _ref$mode === void 0 ? _constants.ACCESS_MODE_WRITE : _ref$mode,
        _ref$database = _ref.database,
        database = _ref$database === void 0 ? '' : _ref$database,
        bookmark = _ref.bookmark,
        connectionProvider = _ref.connectionProvider;

    (0, _classCallCheck2["default"])(this, ConnectionHolder);
    this._mode = mode;
    this._database = database ? (0, _util.assertString)(database, 'database') : '';
    this._bookmark = bookmark || _bookmark["default"].empty();
    this._connectionProvider = connectionProvider;
    this._referenceCount = 0;
    this._connectionPromise = Promise.resolve(null);
  }
  /**
   * Returns the assigned access mode.
   * @returns {string} access mode
   */


  (0, _createClass2["default"])(ConnectionHolder, [{
    key: "mode",
    value: function mode() {
      return this._mode;
    }
    /**
     * Returns the target database name
     * @returns {string} the database name
     */

  }, {
    key: "database",
    value: function database() {
      return this._database;
    }
    /**
     * Make this holder initialize new connection if none exists already.
     * @return {boolean}
     */

  }, {
    key: "initializeConnection",
    value: function initializeConnection() {
      if (this._referenceCount === 0) {
        this._connectionPromise = this._connectionProvider.acquireConnection({
          accessMode: this._mode,
          database: this._database,
          bookmark: this._bookmark
        });
      } else {
        this._referenceCount++;
        return false;
      }

      this._referenceCount++;
      return true;
    }
    /**
     * Get the current connection promise.
     * @return {Promise<Connection>} promise resolved with the current connection.
     */

  }, {
    key: "getConnection",
    value: function getConnection() {
      return this._connectionPromise;
    }
    /**
     * Notify this holder that single party does not require current connection any more.
     * @return {Promise<Connection>} promise resolved with the current connection, never a rejected promise.
     */

  }, {
    key: "releaseConnection",
    value: function releaseConnection() {
      if (this._referenceCount === 0) {
        return this._connectionPromise;
      }

      this._referenceCount--;

      if (this._referenceCount === 0) {
        return this._releaseConnection();
      }

      return this._connectionPromise;
    }
    /**
     * Closes this holder and releases current connection (if any) despite any existing users.
     * @return {Promise<Connection>} promise resolved when current connection is released to the pool.
     */

  }, {
    key: "close",
    value: function close() {
      if (this._referenceCount === 0) {
        return this._connectionPromise;
      }

      this._referenceCount = 0;
      return this._releaseConnection();
    }
    /**
     * Return the current pooled connection instance to the connection pool.
     * We don't pool Session instances, to avoid users using the Session after they've called close.
     * The `Session` object is just a thin wrapper around Connection anyway, so it makes little difference.
     * @return {Promise} - promise resolved then connection is returned to the pool.
     * @private
     */

  }, {
    key: "_releaseConnection",
    value: function _releaseConnection() {
      this._connectionPromise = this._connectionPromise.then(function (connection) {
        if (connection) {
          return connection.resetAndFlush()["catch"](ignoreError).then(function () {
            return connection._release();
          });
        } else {
          return Promise.resolve();
        }
      })["catch"](ignoreError);
      return this._connectionPromise;
    }
  }]);
  return ConnectionHolder;
}();

exports["default"] = ConnectionHolder;

var EmptyConnectionHolder =
/*#__PURE__*/
function (_ConnectionHolder) {
  (0, _inherits2["default"])(EmptyConnectionHolder, _ConnectionHolder);

  function EmptyConnectionHolder() {
    (0, _classCallCheck2["default"])(this, EmptyConnectionHolder);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(EmptyConnectionHolder).apply(this, arguments));
  }

  (0, _createClass2["default"])(EmptyConnectionHolder, [{
    key: "initializeConnection",
    value: function initializeConnection() {
      // nothing to initialize
      return true;
    }
  }, {
    key: "getConnection",
    value: function getConnection() {
      return Promise.reject((0, _error.newError)('This connection holder does not serve connections'));
    }
  }, {
    key: "releaseConnection",
    value: function releaseConnection() {
      return Promise.resolve();
    }
  }, {
    key: "close",
    value: function close() {
      return Promise.resolve();
    }
  }]);
  return EmptyConnectionHolder;
}(ConnectionHolder); // eslint-disable-next-line handle-callback-err


function ignoreError(error) {}
/**
 * Connection holder that does not manage any connections.
 * @type {ConnectionHolder}
 */


var EMPTY_CONNECTION_HOLDER = new EmptyConnectionHolder();
exports.EMPTY_CONNECTION_HOLDER = EMPTY_CONNECTION_HOLDER;