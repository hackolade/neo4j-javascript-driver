"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _error = require("../error");

var _integer = _interopRequireWildcard(require("../integer"));

var _serverVersion = require("./server-version");

var _bookmark = _interopRequireDefault(require("./bookmark"));

var _session = _interopRequireDefault(require("../session"));

var _txConfig = _interopRequireDefault(require("./tx-config"));

var _serverAddress = _interopRequireDefault(require("./server-address"));

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
var CONTEXT = 'context';
var CALL_GET_ROUTING_TABLE = "CALL dbms.cluster.routing.getRoutingTable($".concat(CONTEXT, ")");
var DATABASE = 'database';
var CALL_GET_ROUTING_TABLE_MULTI_DB = "CALL dbms.routing.getRoutingTable($".concat(CONTEXT, ", $").concat(DATABASE, ")");
var PROCEDURE_NOT_FOUND_CODE = 'Neo.ClientError.Procedure.ProcedureNotFound';
var DATABASE_NOT_FOUND_CODE = 'Neo.ClientError.Database.DatabaseNotFound';

var RoutingUtil =
/*#__PURE__*/
function () {
  function RoutingUtil(routingContext) {
    (0, _classCallCheck2["default"])(this, RoutingUtil);
    this._routingContext = routingContext;
  }
  /**
   * Invoke routing procedure using the given session.
   * @param {Session} session the session to use.
   * @param {string} routerAddress the URL of the router.
   * @return {Promise<Record[]>} promise resolved with records returned by the procedure call or null if
   * connection error happened.
   */


  (0, _createClass2["default"])(RoutingUtil, [{
    key: "callRoutingProcedure",
    value: function () {
      var _callRoutingProcedure = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(session, database, routerAddress) {
        var result;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this._callAvailableRoutingProcedure(session, database);

              case 3:
                result = _context.sent;
                _context.next = 6;
                return session.close();

              case 6:
                return _context.abrupt("return", result.records);

              case 9:
                _context.prev = 9;
                _context.t0 = _context["catch"](0);

                if (!(_context.t0.code === DATABASE_NOT_FOUND_CODE)) {
                  _context.next = 15;
                  break;
                }

                throw _context.t0;

              case 15:
                if (!(_context.t0.code === PROCEDURE_NOT_FOUND_CODE)) {
                  _context.next = 19;
                  break;
                }

                throw (0, _error.newError)("Server at ".concat(routerAddress.asHostPort(), " can't perform routing. Make sure you are connecting to a causal cluster"), _error.SERVICE_UNAVAILABLE);

              case 19:
                return _context.abrupt("return", null);

              case 20:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 9]]);
      }));

      function callRoutingProcedure(_x, _x2, _x3) {
        return _callRoutingProcedure.apply(this, arguments);
      }

      return callRoutingProcedure;
    }()
  }, {
    key: "parseTtl",
    value: function parseTtl(record, routerAddress) {
      try {
        var now = (0, _integer["int"])(Date.now());
        var expires = (0, _integer["int"])(record.get('ttl')).multiply(1000).add(now); // if the server uses a really big expire time like Long.MAX_VALUE this may have overflowed

        if (expires.lessThan(now)) {
          return _integer["default"].MAX_VALUE;
        }

        return expires;
      } catch (error) {
        throw (0, _error.newError)("Unable to parse TTL entry from router ".concat(routerAddress, " from record:\n").concat(JSON.stringify(record), "\nError message: ").concat(error.message), _error.PROTOCOL_ERROR);
      }
    }
  }, {
    key: "parseServers",
    value: function parseServers(record, routerAddress) {
      try {
        var servers = record.get('servers');
        var routers = [];
        var readers = [];
        var writers = [];
        servers.forEach(function (server) {
          var role = server['role'];
          var addresses = server['addresses'];

          if (role === 'ROUTE') {
            routers = parseArray(addresses).map(function (address) {
              return _serverAddress["default"].fromUrl(address);
            });
          } else if (role === 'WRITE') {
            writers = parseArray(addresses).map(function (address) {
              return _serverAddress["default"].fromUrl(address);
            });
          } else if (role === 'READ') {
            readers = parseArray(addresses).map(function (address) {
              return _serverAddress["default"].fromUrl(address);
            });
          } else {
            throw (0, _error.newError)('Unknown server role "' + role + '"', _error.PROTOCOL_ERROR);
          }
        });
        return {
          routers: routers,
          readers: readers,
          writers: writers
        };
      } catch (error) {
        throw (0, _error.newError)("Unable to parse servers entry from router ".concat(routerAddress, " from record:\n").concat(JSON.stringify(record), "\nError message: ").concat(error.message), _error.PROTOCOL_ERROR);
      }
    }
  }, {
    key: "_callAvailableRoutingProcedure",
    value: function _callAvailableRoutingProcedure(session, database) {
      var _this = this;

      return session._run(null, null, function (connection) {
        var query;
        var params;

        var version = _serverVersion.ServerVersion.fromString(connection.version);

        if (version.compareTo(_serverVersion.VERSION_4_0_0) >= 0) {
          query = CALL_GET_ROUTING_TABLE_MULTI_DB;
          params = {
            context: _this._routingContext,
            database: database || null
          };
        } else {
          query = CALL_GET_ROUTING_TABLE;
          params = {
            context: _this._routingContext
          };
        }

        return connection.protocol().run(query, params, {
          bookmark: session._lastBookmark,
          txConfig: _txConfig["default"].empty(),
          mode: session._mode,
          database: session._database,
          afterComplete: session._onComplete
        });
      });
    }
  }]);
  return RoutingUtil;
}();

exports["default"] = RoutingUtil;

function parseArray(addresses) {
  if (!Array.isArray(addresses)) {
    throw new TypeError('Array expected but got: ' + addresses);
  }

  return Array.from(addresses);
}