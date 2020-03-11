"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _resultSummary = _interopRequireDefault(require("./result-summary"));

var _connectionHolder = require("./internal/connection-holder");

var _streamObservers = require("./internal/stream-observers");

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
var DEFAULT_ON_ERROR = function DEFAULT_ON_ERROR(error) {
  console.log('Uncaught error when processing result: ' + error);
};

var DEFAULT_ON_COMPLETED = function DEFAULT_ON_COMPLETED(summary) {};

var DEFAULT_METADATA_SUPPLIER = function DEFAULT_METADATA_SUPPLIER(metadata) {};
/**
 * A stream of {@link Record} representing the result of a query.
 * Can be consumed eagerly as {@link Promise} resolved with array of records and {@link ResultSummary}
 * summary, or rejected with error that contains {@link string} code and {@link string} message.
 * Alternatively can be consumed lazily using {@link Result#subscribe} function.
 * @access public
 */


var Result =
/*#__PURE__*/
function () {
  /**
   * Inject the observer to be used.
   * @constructor
   * @access private
   * @param {Promise<ResultStreamObserver>} streamObserverPromise
   * @param {mixed} query - Cypher query to execute
   * @param {Object} parameters - Map with parameters to use in query
   * @param {ConnectionHolder} connectionHolder - to be notified when result is either fully consumed or error happened.
   */
  function Result(streamObserverPromise, query, parameters, connectionHolder) {
    (0, _classCallCheck2["default"])(this, Result);
    this._stack = captureStacktrace();
    this._streamObserverPromise = streamObserverPromise;
    this._p = null;
    this._query = query;
    this._parameters = parameters || {};
    this._connectionHolder = connectionHolder || _connectionHolder.EMPTY_CONNECTION_HOLDER;
  }
  /**
   * Returns a promise for the field keys.
   *
   * *Should not be combined with {@link Result#subscribe} function.*
   *
   * @public
   * @returns {Promise<string[]>} - Field keys, in the order they will appear in records.
   }
   */


  (0, _createClass2["default"])(Result, [{
    key: "keys",
    value: function keys() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this._streamObserverPromise.then(function (observer) {
          return observer.subscribe({
            onKeys: function onKeys(keys) {
              return resolve(keys);
            },
            onError: function onError(err) {
              return reject(err);
            }
          });
        });
      });
    }
    /**
     * Returns a promise for the result summary.
     *
     * *Should not be combined with {@link Result#subscribe} function.*
     *
     * @public
     * @returns {Promise<ResultSummary>} - Result summary.
     *
     */

  }, {
    key: "summary",
    value: function summary() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._streamObserverPromise.then(function (o) {
          o.cancel();
          o.subscribe({
            onCompleted: function onCompleted(metadata) {
              return resolve(metadata);
            },
            onError: function onError(err) {
              return reject(err);
            }
          });
        });
      });
    }
    /**
     * Create and return new Promise
     *
     * @private
     * @return {Promise} new Promise.
     */

  }, {
    key: "_getOrCreatePromise",
    value: function _getOrCreatePromise() {
      var _this3 = this;

      if (!this._p) {
        this._p = new Promise(function (resolve, reject) {
          var records = [];
          var observer = {
            onNext: function onNext(record) {
              records.push(record);
            },
            onCompleted: function onCompleted(summary) {
              resolve({
                records: records,
                summary: summary
              });
            },
            onError: function onError(error) {
              reject(error);
            }
          };

          _this3.subscribe(observer);
        });
      }

      return this._p;
    }
    /**
     * Waits for all results and calls the passed in function with the results.
     *
     * *Should not be combined with {@link Result#subscribe} function.*
     *
     * @param {function(result: {records:Array<Record>, summary: ResultSummary})} onFulfilled - function to be called
     * when finished.
     * @param {function(error: {message:string, code:string})} onRejected - function to be called upon errors.
     * @return {Promise} promise.
     */

  }, {
    key: "then",
    value: function then(onFulfilled, onRejected) {
      return this._getOrCreatePromise().then(onFulfilled, onRejected);
    }
    /**
     * Catch errors when using promises.
     *
     * *Should not be combined with {@link Result#subscribe} function.*
     *
     * @param {function(error: Neo4jError)} onRejected - Function to be called upon errors.
     * @return {Promise} promise.
     */

  }, {
    key: "catch",
    value: function _catch(onRejected) {
      return this._getOrCreatePromise()["catch"](onRejected);
    }
    /**
     * Stream records to observer as they come in, this is a more efficient method
     * of handling the results, and allows you to handle arbitrarily large results.
     *
     * @param {Object} observer - Observer object
     * @param {function(keys: string[])} observer.onKeys - handle stream head, the field keys.
     * @param {function(record: Record)} observer.onNext - handle records, one by one.
     * @param {function(summary: ResultSummary)} observer.onCompleted - handle stream tail, the result summary.
     * @param {function(error: {message:string, code:string})} observer.onError - handle errors.
     * @return
     */

  }, {
    key: "subscribe",
    value: function subscribe(observer) {
      var _this4 = this;

      var onCompletedOriginal = observer.onCompleted || DEFAULT_ON_COMPLETED;

      var onCompletedWrapper = function onCompletedWrapper(metadata) {
        // notify connection holder that the used connection is not needed any more because result has
        // been fully consumed; call the original onCompleted callback after that
        _this4._connectionHolder.releaseConnection().then(function () {
          onCompletedOriginal.call(observer, new _resultSummary["default"](_this4._query, _this4._parameters, metadata));
        });
      };

      observer.onCompleted = onCompletedWrapper;
      var onErrorOriginal = observer.onError || DEFAULT_ON_ERROR;

      var onErrorWrapper = function onErrorWrapper(error) {
        // notify connection holder that the used connection is not needed any more because error happened
        // and result can't bee consumed any further; call the original onError callback after that
        _this4._connectionHolder.releaseConnection().then(function () {
          replaceStacktrace(error, _this4._stack);
          onErrorOriginal.call(observer, error);
        });
      };

      observer.onError = onErrorWrapper;

      this._streamObserverPromise.then(function (o) {
        return o.subscribe(observer);
      });
    }
    /**
     * Signals the stream observer that the future records should be discarded on the server.
     *
     * @protected
     * @since 4.0.0
     */

  }, {
    key: "_cancel",
    value: function _cancel() {
      this._streamObserverPromise.then(function (o) {
        return o.cancel();
      });
    }
  }]);
  return Result;
}();

function captureStacktrace() {
  var error = new Error('');

  if (error.stack) {
    return error.stack.replace(/^Error(\n\r)*/, ''); // we don't need the 'Error\n' part, if only it exists
  }

  return null;
}

function replaceStacktrace(error, newStack) {
  if (newStack) {
    // Error.prototype.toString() concatenates error.name and error.message nicely
    // then we add the rest of the stack trace
    error.stack = error.toString() + '\n' + newStack;
  }
}

var _default = Result;
exports["default"] = _default;