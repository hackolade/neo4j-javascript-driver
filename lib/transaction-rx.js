"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _rxjs = require("rxjs");

var _resultRx = _interopRequireDefault(require("./result-rx"));

var _transaction = _interopRequireDefault(require("./transaction"));

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
 * A reactive transaction, which provides the same functionality as {@link Transaction} but through a Reactive API.
 */
var RxTransaction =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @protected
   * @param {Transaction} txc - The underlying transaction instance to relay requests
   */
  function RxTransaction(txc) {
    (0, _classCallCheck2["default"])(this, RxTransaction);
    this._txc = txc;
  }
  /**
   * Creates a reactive result that will execute the query in this transaction, with the provided parameters.
   *
   * @public
   * @param {string} query - Query to be executed.
   * @param {Object} parameters - Parameter values to use in query execution.
   * @returns {RxResult} - A reactive result
   */


  (0, _createClass2["default"])(RxTransaction, [{
    key: "run",
    value: function run(query, parameters) {
      var _this = this;

      return new _resultRx["default"](new _rxjs.Observable(function (observer) {
        try {
          observer.next(_this._txc.run(query, parameters));
          observer.complete();
        } catch (err) {
          observer.error(err);
        }

        return function () {};
      }));
    }
    /**
     *  Commits the transaction.
     *
     * @public
     * @returns {Observable} - An empty observable
     */

  }, {
    key: "commit",
    value: function commit() {
      var _this2 = this;

      return new _rxjs.Observable(function (observer) {
        _this2._txc.commit().then(function () {
          observer.complete();
        })["catch"](function (err) {
          return observer.error(err);
        });
      });
    }
    /**
     *  Rolls back the transaction.
     *
     * @public
     * @returns {Observable} - An empty observable
     */

  }, {
    key: "rollback",
    value: function rollback() {
      var _this3 = this;

      return new _rxjs.Observable(function (observer) {
        _this3._txc.rollback().then(function () {
          observer.complete();
        })["catch"](function (err) {
          return observer.error(err);
        });
      });
    }
  }]);
  return RxTransaction;
}();

exports["default"] = RxTransaction;