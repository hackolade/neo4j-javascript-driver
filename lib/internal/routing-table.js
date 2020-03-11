"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _integer = require("../integer");

var _driver = require("../driver");

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
var MIN_ROUTERS = 1;

var RoutingTable =
/*#__PURE__*/
function () {
  function RoutingTable() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        database = _ref.database,
        routers = _ref.routers,
        readers = _ref.readers,
        writers = _ref.writers,
        expirationTime = _ref.expirationTime;

    (0, _classCallCheck2["default"])(this, RoutingTable);
    this.database = database;
    this.databaseName = database || 'default database';
    this.routers = routers || [];
    this.readers = readers || [];
    this.writers = writers || [];
    this.expirationTime = expirationTime || (0, _integer["int"])(0);
  }

  (0, _createClass2["default"])(RoutingTable, [{
    key: "forget",
    value: function forget(address) {
      // Don't remove it from the set of routers, since that might mean we lose our ability to re-discover,
      // just remove it from the set of readers and writers, so that we don't use it for actual work without
      // performing discovery first.
      this.readers = removeFromArray(this.readers, address);
      this.writers = removeFromArray(this.writers, address);
    }
  }, {
    key: "forgetRouter",
    value: function forgetRouter(address) {
      this.routers = removeFromArray(this.routers, address);
    }
  }, {
    key: "forgetWriter",
    value: function forgetWriter(address) {
      this.writers = removeFromArray(this.writers, address);
    }
    /**
     * Check if this routing table is fresh to perform the required operation.
     * @param {string} accessMode the type of operation. Allowed values are {@link READ} and {@link WRITE}.
     * @return {boolean} `true` when this table contains servers to serve the required operation, `false` otherwise.
     */

  }, {
    key: "isStaleFor",
    value: function isStaleFor(accessMode) {
      return this.expirationTime.lessThan(Date.now()) || this.routers.length < MIN_ROUTERS || accessMode === _driver.READ && this.readers.length === 0 || accessMode === _driver.WRITE && this.writers.length === 0;
    }
    /**
     * Check if this routing table is expired for specified amount of duration
     *
     * @param {Integer} duration amount of duration in milliseconds to check for expiration
     * @returns {boolean}
     */

  }, {
    key: "isExpiredFor",
    value: function isExpiredFor(duration) {
      return this.expirationTime.add(duration).lessThan(Date.now());
    }
  }, {
    key: "allServers",
    value: function allServers() {
      return [].concat((0, _toConsumableArray2["default"])(this.routers), (0, _toConsumableArray2["default"])(this.readers), (0, _toConsumableArray2["default"])(this.writers));
    }
  }, {
    key: "toString",
    value: function toString() {
      return 'RoutingTable[' + "database=".concat(this.databaseName, ", ") + "expirationTime=".concat(this.expirationTime, ", ") + "currentTime=".concat(Date.now(), ", ") + "routers=[".concat(this.routers, "], ") + "readers=[".concat(this.readers, "], ") + "writers=[".concat(this.writers, "]]");
    }
  }]);
  return RoutingTable;
}();
/**
 * Remove all occurrences of the element in the array.
 * @param {Array} array the array to filter.
 * @param {Object} element the element to remove.
 * @return {Array} new filtered array.
 */


exports["default"] = RoutingTable;

function removeFromArray(array, element) {
  return array.filter(function (item) {
    return item.asKey() !== element.asKey();
  });
}