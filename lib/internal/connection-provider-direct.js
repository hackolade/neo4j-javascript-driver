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

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _connectionProviderPooled = _interopRequireDefault(require("./connection-provider-pooled"));

var _connectionDelegate = _interopRequireDefault(require("./connection-delegate"));

var _connectionChannel = _interopRequireDefault(require("./connection-channel"));

var _constants = require("./constants");

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
var DirectConnectionProvider =
/*#__PURE__*/
function (_PooledConnectionProv) {
  (0, _inherits2["default"])(DirectConnectionProvider, _PooledConnectionProv);

  function DirectConnectionProvider(_ref) {
    var _this;

    var id = _ref.id,
        config = _ref.config,
        log = _ref.log,
        address = _ref.address,
        userAgent = _ref.userAgent,
        authToken = _ref.authToken;
    (0, _classCallCheck2["default"])(this, DirectConnectionProvider);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(DirectConnectionProvider).call(this, {
      id: id,
      config: config,
      log: log,
      userAgent: userAgent,
      authToken: authToken
    }));
    _this._address = address;
    return _this;
  }
  /**
   * See {@link ConnectionProvider} for more information about this method and
   * its arguments.
   */


  (0, _createClass2["default"])(DirectConnectionProvider, [{
    key: "acquireConnection",
    value: function acquireConnection() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          accessMode = _ref2.accessMode,
          database = _ref2.database,
          bookmarks = _ref2.bookmarks;

      return this._connectionPool.acquire(this._address).then(function (connection) {
        return new _connectionDelegate["default"](connection, null);
      });
    }
  }, {
    key: "supportsMultiDb",
    value: function () {
      var _supportsMultiDb = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var connection, protocol;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                connection = _connectionChannel["default"].create(this._address, this._config, this._createConnectionErrorHandler(), this._log);
                _context.prev = 1;
                _context.next = 4;
                return connection._negotiateProtocol();

              case 4:
                protocol = connection.protocol();

                if (!protocol) {
                  _context.next = 7;
                  break;
                }

                return _context.abrupt("return", protocol.version >= _constants.BOLT_PROTOCOL_V4);

              case 7:
                return _context.abrupt("return", false);

              case 8:
                _context.prev = 8;
                _context.next = 11;
                return connection.close();

              case 11:
                return _context.finish(8);

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[1,, 8, 12]]);
      }));

      function supportsMultiDb() {
        return _supportsMultiDb.apply(this, arguments);
      }

      return supportsMultiDb;
    }()
  }]);
  return DirectConnectionProvider;
}(_connectionProviderPooled["default"]);

exports["default"] = DirectConnectionProvider;