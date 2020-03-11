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

var _routingTable = _interopRequireDefault(require("./routing-table"));

var _routingUtil = _interopRequireDefault(require("./routing-util"));

var _error = require("../error");

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
var Rediscovery =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {RoutingUtil} routingUtil the util to use.
   */
  function Rediscovery(routingUtil) {
    (0, _classCallCheck2["default"])(this, Rediscovery);
    this._routingUtil = routingUtil;
  }
  /**
   * Try to fetch new routing table from the given router.
   * @param {Session} session the session to use.
   * @param {string} database the database for which to lookup routing table.
   * @param {string} routerAddress the URL of the router.
   * @return {Promise<RoutingTable>} promise resolved with new routing table or null when connection error happened.
   */


  (0, _createClass2["default"])(Rediscovery, [{
    key: "lookupRoutingTableOnRouter",
    value: function () {
      var _lookupRoutingTableOnRouter = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(session, database, routerAddress) {
        var records, record, expirationTime, _this$_routingUtil$pa, routers, readers, writers;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._routingUtil.callRoutingProcedure(session, database, routerAddress);

              case 2:
                records = _context.sent;

                if (!(records === null)) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt("return", null);

              case 5:
                if (!(records.length !== 1)) {
                  _context.next = 7;
                  break;
                }

                throw (0, _error.newError)('Illegal response from router "' + routerAddress + '". ' + 'Received ' + records.length + ' records but expected only one.\n' + JSON.stringify(records), _error.PROTOCOL_ERROR);

              case 7:
                record = records[0];
                expirationTime = this._routingUtil.parseTtl(record, routerAddress);
                _this$_routingUtil$pa = this._routingUtil.parseServers(record, routerAddress), routers = _this$_routingUtil$pa.routers, readers = _this$_routingUtil$pa.readers, writers = _this$_routingUtil$pa.writers;

                Rediscovery._assertNonEmpty(routers, 'routers', routerAddress);

                Rediscovery._assertNonEmpty(readers, 'readers', routerAddress); // case with no writers is processed higher in the promise chain because only RoutingDriver knows
                // how to deal with such table and how to treat router that returned such table


                return _context.abrupt("return", new _routingTable["default"]({
                  database: database,
                  routers: routers,
                  readers: readers,
                  writers: writers,
                  expirationTime: expirationTime
                }));

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function lookupRoutingTableOnRouter(_x, _x2, _x3) {
        return _lookupRoutingTableOnRouter.apply(this, arguments);
      }

      return lookupRoutingTableOnRouter;
    }()
  }], [{
    key: "_assertNonEmpty",
    value: function _assertNonEmpty(serverAddressesArray, serversName, routerAddress) {
      if (serverAddressesArray.length === 0) {
        throw (0, _error.newError)('Received no ' + serversName + ' from router ' + routerAddress, _error.PROTOCOL_ERROR);
      }
    }
  }]);
  return Rediscovery;
}();

exports["default"] = Rediscovery;