"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _error = require("./error");

var _resultSummary = _interopRequireDefault(require("./result-summary"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _record = _interopRequireDefault(require("./record"));

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
var States = {
  READY: 0,
  STREAMING: 1,
  COMPLETED: 2
  /**
   * The reactive result interface.
   */

};

var RxResult =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @protected
   * @param {Observable<Result>} result - An observable of single Result instance to relay requests.
   */
  function RxResult(result) {
    (0, _classCallCheck2["default"])(this, RxResult);
    var replayedResult = result.pipe((0, _operators.publishReplay)(1), (0, _operators.refCount)());
    this._result = replayedResult;
    this._keys = replayedResult.pipe((0, _operators.flatMap)(function (r) {
      return (0, _rxjs.from)(r.keys());
    }), (0, _operators.publishReplay)(1), (0, _operators.refCount)());
    this._records = new _rxjs.Subject();
    this._summary = new _rxjs.ReplaySubject();
    this._state = States.READY;
  }
  /**
   * Returns an observable that exposes a single item containing field names
   * returned by the executing query.
   *
   * Errors raised by actual query execution can surface on the returned
   * observable stream.
   *
   * @public
   * @returns {Observable<string[]>} - An observable stream (with exactly one element) of field names.
   */


  (0, _createClass2["default"])(RxResult, [{
    key: "keys",
    value: function keys() {
      return this._keys;
    }
    /**
     * Returns an observable that exposes each record returned by the executing query.
     *
     * Errors raised during the streaming phase can surface on the returned observable stream.
     *
     * @public
     * @returns {Observable<Record>} - An observable stream of records.
     */

  }, {
    key: "records",
    value: function records() {
      var _this = this;

      return this._result.pipe((0, _operators.flatMap)(function (result) {
        return new _rxjs.Observable(function (recordsObserver) {
          return _this._startStreaming({
            result: result,
            recordsObserver: recordsObserver
          });
        });
      }));
    }
    /**
     * Returns an observable that exposes a single item of {@link ResultSummary} that is generated by
     * the server after the streaming of the executing query is completed.
     *
     * *Subscribing to this stream before subscribing to records() stream causes the results to be discarded on the server.*
     *
     * @public
     * @returns {Observable<ResultSummary>} - An observable stream (with exactly one element) of result summary.
     */

  }, {
    key: "consume",
    value: function consume() {
      var _this2 = this;

      return this._result.pipe((0, _operators.flatMap)(function (result) {
        return new _rxjs.Observable(function (summaryObserver) {
          return _this2._startStreaming({
            result: result,
            summaryObserver: summaryObserver
          });
        });
      }));
    }
  }, {
    key: "_startStreaming",
    value: function _startStreaming() {
      var _this3 = this;

      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          result = _ref.result,
          _ref$recordsObserver = _ref.recordsObserver,
          recordsObserver = _ref$recordsObserver === void 0 ? null : _ref$recordsObserver,
          _ref$summaryObserver = _ref.summaryObserver,
          summaryObserver = _ref$summaryObserver === void 0 ? null : _ref$summaryObserver;

      var subscriptions = [];

      if (summaryObserver) {
        subscriptions.push(this._summary.subscribe(summaryObserver));
      }

      if (this._state < States.STREAMING) {
        this._state = States.STREAMING;

        if (recordsObserver) {
          subscriptions.push(this._records.subscribe(recordsObserver));
        }

        subscriptions.push({
          unsubscribe: function unsubscribe() {
            if (result._cancel) {
              result._cancel();
            }
          }
        });

        if (this._records.observers.length === 0) {
          result._cancel();
        }

        result.subscribe({
          onNext: function onNext(record) {
            _this3._records.next(record);
          },
          onCompleted: function onCompleted(summary) {
            _this3._records.complete();

            _this3._summary.next(summary);

            _this3._summary.complete();

            _this3._state = States.COMPLETED;
          },
          onError: function onError(err) {
            _this3._records.error(err);

            _this3._summary.error(err);

            _this3._state = States.COMPLETED;
          }
        });
      } else if (recordsObserver) {
        recordsObserver.error((0, _error.newError)('Streaming has already started/consumed with a previous records or summary subscription.'));
      }

      return function () {
        subscriptions.forEach(function (s) {
          return s.unsubscribe();
        });
      };
    }
  }]);
  return RxResult;
}();

exports["default"] = RxResult;