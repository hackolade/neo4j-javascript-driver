"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _driver = require("./driver");

var _error = require("./error");

var _connectionProviderRouting = _interopRequireDefault(require("./internal/connection-provider-routing"));

var _leastConnectedLoadBalancingStrategy = _interopRequireDefault(require("./internal/least-connected-load-balancing-strategy"));

var _connectionErrorHandler = _interopRequireDefault(require("./internal/connection-error-handler"));

var _configuredCustomResolver = _interopRequireDefault(require("./internal/resolver/configured-custom-resolver"));

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
 * A driver that supports routing in a causal cluster.
 * @private
 */
var RoutingDriver =
/*#__PURE__*/
function (_Driver) {
  (0, _inherits2["default"])(RoutingDriver, _Driver);

  function RoutingDriver(address, routingContext, userAgent) {
    var _this;

    var token = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var config = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    (0, _classCallCheck2["default"])(this, RoutingDriver);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(RoutingDriver).call(this, address, userAgent, token, validateConfig(config)));
    _this._routingContext = routingContext;
    return _this;
  }

  (0, _createClass2["default"])(RoutingDriver, [{
    key: "_afterConstruction",
    value: function _afterConstruction() {
      this._log.info("Routing driver ".concat(this._id, " created for server address ").concat(this._address));
    }
  }, {
    key: "_createConnectionProvider",
    value: function _createConnectionProvider(address, userAgent, authToken) {
      return new _connectionProviderRouting["default"]({
        id: this._id,
        address: address,
        routingContext: this._routingContext,
        hostNameResolver: createHostNameResolver(this._config),
        config: this._config,
        log: this._log,
        userAgent: userAgent,
        authToken: authToken
      });
    }
  }]);
  return RoutingDriver;
}(_driver.Driver);
/**
 * @private
 * @returns {ConfiguredCustomResolver} new custom resolver that wraps the passed-in resolver function.
 *              If resolved function is not specified, it defaults to an identity resolver.
 */


function createHostNameResolver(config) {
  return new _configuredCustomResolver["default"](config.resolver);
}
/**
 * @private
 * @returns {Object} the given config.
 */


function validateConfig(config) {
  var resolver = config.resolver;

  if (resolver && typeof resolver !== 'function') {
    throw new TypeError("Configured resolver should be a function. Got: ".concat(resolver));
  }

  return config;
}

var _default = RoutingDriver;
exports["default"] = _default;